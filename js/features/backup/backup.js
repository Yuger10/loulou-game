/* ---------- Sauvegarde, restauration, installation (Phase 1 : ne rien perdre) ----------
   Toute la partie (joueurs + progression de chacun) vit dans le stockage du
   navigateur, sous des clés qui commencent par « lagon-magique ». Ce module :
   - l'exporte dans un fichier (feuille de partage du téléphone si possible,
     sinon téléchargement) ou dans un code de transfert à copier-coller ;
   - la restaure depuis un fichier ou un code, après vérification et
     confirmation, en gardant une copie de la partie remplacée ;
   - demande au navigateur de ne pas effacer ces données (stockage persistant) ;
   - invite à installer le jeu sur l'écran d'accueil (Safari efface les
     données d'un site non installé après 7 jours sans visite) ;
   - rappelle de sauvegarder quand la dernière sauvegarde a plus de 2 semaines. */
import { avatarHTML } from '../../entities/companion/index.js';
import { load, save, state } from '../../entities/game-state/index.js';
import {
  LEGACY_SAVE_KEY,
  loadProfiles,
  party,
  profiles,
  PROFILES_KEY,
  profileSaveKey,
  refreshAll,
  saveProfiles,
} from '../../entities/player/index.js';
import { setCurrentWorld } from '../../entities/world/index.js';
import { cleanName, on, storageRemove, storageWrite } from '../../shared/lib/index.js';
import { closeModal, openModal, playSound, setHandler, showToast } from '../../shared/ui/index.js';
import { renderMap } from '../map/index.js';
import { stopParty } from '../party/index.js';
import { bindQuit, gameHeader } from '../screen/index.js';

const BACKUP_PREFIX = 'lagon-magique';
const BACKUP_META_KEY = 'lagon-magique-meta';
const BACKUP_UNDO_KEY = 'lagon-avant-restauration'; // hors préfixe : jamais exportée
const BACKUP_REMIND_DAYS = 14;

/** @typedef {import('../../entities/player/index.js').Profile} Profile */
/**
 * Une sauvegarde : `data` = les clés du stockage (préfixe « lagon-magique ») et
 * leur texte JSON. Lue depuis un fichier ou un code, c'est une entrée non fiable :
 * parseBackupObject vérifie `app`, `data` et que chaque valeur est un texte JSON.
 * @typedef {{ app: string, kind?: string, v?: number, at?: string, data: Record<string, string> }} Backup
 */
/** @typedef {{ name: string, avatar: string, missions: number }} BackupPlayer un joueur, dans l'aperçu */
/**
 * Le verdict sur une sauvegarde lue ; `async` : un code compressé, à lire par parseBackupCode.
 * (`error?: undefined` côté réussite : sans strictNullChecks, `!result.ok` ne distingue pas les deux cas)
 * @typedef {{ ok: true, backup: Backup, players: BackupPlayer[], error?: undefined } | { ok: false, error?: string, async?: boolean }} BackupCheck
 */
/**
 * Les repères de sauvegarde de l'appareil (clé BACKUP_META_KEY).
 * @typedef {{
 *   lastBackupAt?: string,
 *   restoredAt?: string,
 *   persisted?: boolean,
 *   installed?: boolean,
 *   installHintDismissed?: boolean,
 * }} BackupMeta
 */
/**
 * L'invitation à installer (Chrome, Edge) : absente des types du DOM.
 * @typedef {Event & { prompt: () => Promise<void>, userChoice: Promise<{ outcome: string }> }} InstallPromptEvent
 */

function lsKeys() {
  const out = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k) out.push(k);
    }
  } catch {
    // stockage bloqué : aucune clé à lister
  }
  return out;
}
/** @returns {BackupMeta} */
function backupMeta() {
  try {
    return JSON.parse(localStorage.getItem(BACKUP_META_KEY) || '{}') || {};
  } catch {
    return {};
  }
}
/** @param {BackupMeta} patch */
function setBackupMeta(patch) {
  storageWrite(BACKUP_META_KEY, JSON.stringify(Object.assign(backupMeta(), patch)));
}

/* ---- construire / lire une sauvegarde ---- */
/** @returns {Backup} */
function buildBackup() {
  save();
  saveProfiles();
  /** @type {Record<string, string>} */
  const data = {};
  lsKeys()
    .filter((k) => k.startsWith(BACKUP_PREFIX) && k !== BACKUP_META_KEY)
    .forEach((k) => {
      try {
        data[k] = /** @type {string} */ (localStorage.getItem(k)); // la clé vient d'être listée
      } catch {
        // clé illisible : elle manque dans la sauvegarde, les autres y sont
      }
    });
  return { app: 'lagon-magique', kind: 'sauvegarde', v: 1, at: new Date().toISOString(), data };
}

// renvoie { ok:true, backup, players:[{name, avatar, missions}] } ou { ok:false, error }
/**
 * @param {Partial<Backup> | null | undefined} obj du JSON lu tel quel (entrée non fiable)
 * @returns {BackupCheck}
 */
function parseBackupObject(obj) {
  if (!obj || obj.app !== 'lagon-magique' || typeof obj.data !== 'object' || !obj.data)
    return { ok: false, error: "Ce n'est pas une sauvegarde du Lagon Magique." };
  const keys = Object.keys(obj.data);
  if (
    !keys.length ||
    !keys.every(
      (k) => k.startsWith(BACKUP_PREFIX) && typeof (/** @type {Record<string, unknown>} */ (obj.data)[k]) === 'string',
    )
  )
    return { ok: false, error: 'Cette sauvegarde est incomplète ou abîmée.' };
  /** @type {{ list?: Profile[] } | null} JSON lu tel quel : seul `list` est vérifié (un tableau) */
  let prof = null;
  try {
    prof = JSON.parse(obj.data[PROFILES_KEY] || 'null');
  } catch {
    // liste des joueurs abîmée : traitée juste après comme « aucun joueur »
  }
  for (const k of keys) {
    try {
      JSON.parse(obj.data[k]);
    } catch {
      return { ok: false, error: 'Cette sauvegarde est abîmée (une partie est illisible).' };
    }
  }
  const players = (prof && Array.isArray(prof.list) ? prof.list : []).map((p) => {
    let missions = 0;
    try {
      // obj.data : vérifié plus haut (des textes JSON)
      missions =
        JSON.parse(/** @type {Record<string, string>} */ (obj.data)[profileSaveKey(p.id)] || '{}').missions || 0;
    } catch {
      // partie illisible : on affiche 0 mission dans l'aperçu
    }
    return { name: cleanName(p.name) || 'Sans nom', avatar: p.avatar, missions };
  });
  if (!players.length && !obj.data[LEGACY_SAVE_KEY])
    return { ok: false, error: 'Cette sauvegarde ne contient aucun joueur.' };
  return { ok: true, backup: /** @type {Backup} */ (obj), players }; // app et data vérifiés ci-dessus
}
/**
 * @param {string} text
 * @returns {BackupCheck}
 */
function parseBackupText(text) {
  const t = String(text || '').trim();
  if (!t) return { ok: false, error: 'Le code est vide.' };
  try {
    if (t.startsWith('LAGON1:')) return parseBackupObject(JSON.parse(b64ToUtf8(t.slice(7))));
    if (t.startsWith('{')) return parseBackupObject(JSON.parse(t));
  } catch {
    return { ok: false, error: "Ce code est incomplet : vérifiez qu'il a été copié en entier." };
  }
  if (t.startsWith('LAGONZ1:')) return { ok: false, async: true };
  return { ok: false, error: "Ce n'est pas un code de sauvegarde du Lagon Magique." };
}

/* ---- appliquer une sauvegarde (remplace la partie actuelle) ---- */
/** @param {Backup} backup */
function applyBackup(backup) {
  // garde une copie de ce qu'on remplace, pour pouvoir revenir en arrière
  storageWrite(BACKUP_UNDO_KEY, JSON.stringify(buildBackup()));
  lsKeys()
    .filter((k) => k.startsWith(BACKUP_PREFIX) && k !== BACKUP_META_KEY)
    .forEach((k) => {
      storageRemove(k);
    });
  // chaque écriture ratée (mémoire pleine…) est comptée : l'écran le dira
  const failed = Object.entries(backup.data).filter(([k, v]) => !storageWrite(k, v)).length;
  setBackupMeta({ restoredAt: new Date().toISOString(), lastBackupAt: backup.at || new Date().toISOString() });
  // recharge les joueurs et la partie sans recharger la page
  if (party.active) stopParty();
  loadProfiles();
  load();
  setCurrentWorld('lagon');
  refreshAll();
  renderMap();
  renderBackupReminder();
  return { failed };
}
function undoRestoreAvailable() {
  try {
    return !!localStorage.getItem(BACKUP_UNDO_KEY);
  } catch {
    return false;
  }
}

/* ---- encodage du code de transfert ---- */
// (repli sans TextEncoder pour les vieux navigateurs : même résultat)
/** @param {string} s */
function utf8ToB64(s) {
  if (typeof TextEncoder !== 'function') return btoa(unescape(encodeURIComponent(s)));
  const bytes = new TextEncoder().encode(s);
  let bin = '';
  // apply accepte un tableau typé (ES5) ; ses types ne veulent que des tableaux
  for (let i = 0; i < bytes.length; i += 0x8000)
    bin += String.fromCharCode.apply(
      null,
      /** @type {number[]} */ (/** @type {unknown} */ (bytes.subarray(i, i + 0x8000))),
    );
  return btoa(bin);
}
/** @param {string} b */
function b64ToUtf8(b) {
  const bin = atob(b.replace(/\s+/g, ''));
  if (typeof TextDecoder !== 'function') return decodeURIComponent(escape(bin));
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}
/** @param {Uint8Array} bytes */
function bytesToB64(bytes) {
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000)
    bin += String.fromCharCode.apply(
      null,
      /** @type {number[]} */ (/** @type {unknown} */ (bytes.subarray(i, i + 0x8000))),
    );
  return btoa(bin);
}
/** @param {string} b */
function b64ToBytes(b) {
  const bin = atob(b.replace(/\s+/g, ''));
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
// code compressé (gzip) quand le navigateur sait le faire, sinon code simple
/** @param {Backup} backup */
async function backupToCode(backup) {
  const json = JSON.stringify(backup);
  if (typeof CompressionStream === 'function') {
    try {
      const stream = new Blob([json]).stream().pipeThrough(new CompressionStream('gzip'));
      const buf = new Uint8Array(await new Response(stream).arrayBuffer());
      return 'LAGONZ1:' + bytesToB64(buf);
    } catch {
      // compression indisponible : on revient au code non compressé ci-dessous
    }
  }
  return 'LAGON1:' + utf8ToB64(json);
}
/**
 * @param {string} text
 * @returns {Promise<BackupCheck>}
 */
async function parseBackupCode(text) {
  const t = String(text || '').trim();
  if (!t.startsWith('LAGONZ1:')) return parseBackupText(t);
  if (typeof DecompressionStream !== 'function')
    return { ok: false, error: 'Ce navigateur ne sait pas lire ce code : utilisez plutôt le fichier de sauvegarde.' };
  try {
    const stream = new Blob([b64ToBytes(t.slice(8))]).stream().pipeThrough(new DecompressionStream('gzip'));
    return parseBackupObject(JSON.parse(await new Response(stream).text()));
  } catch {
    return { ok: false, error: "Ce code est incomplet : vérifiez qu'il a été copié en entier." };
  }
}

/* ---- stockage persistant ---- */
async function requestPersistentStorage() {
  try {
    if (!navigator.storage || !navigator.storage.persist) return null;
    if (await navigator.storage.persisted()) return true;
    const ok = await navigator.storage.persist();
    setBackupMeta({ persisted: !!ok });
    return ok;
  } catch {
    return null;
  }
}

/* ---- installation sur l'écran d'accueil ---- */
/** @type {InstallPromptEvent | null} */
let deferredInstallPrompt = null;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredInstallPrompt = /** @type {InstallPromptEvent} */ (e);
  renderInstallHint();
});
window.addEventListener('appinstalled', () => {
  deferredInstallPrompt = null;
  setBackupMeta({ installed: true });
  renderInstallHint();
});
function isInstalled() {
  try {
    // TypeScript croit matchMedia toujours là ; les vieux navigateurs ne l'ont pas
    return (
      (/** @type {Window['matchMedia'] | undefined} */ (window.matchMedia) &&
        matchMedia('(display-mode: standalone)').matches) ||
      navigator.standalone === true
    );
  } catch {
    return false;
  }
}
function isIOS() {
  const ua = navigator.userAgent || '';
  return /iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
}
function installHelpHTML() {
  if (isInstalled()) return `<p class="bk-ok">✅ Le jeu est installé sur cet appareil.</p>`;
  if (deferredInstallPrompt) return `<button class="btn-small" id="bk-install">📲 Installer le jeu</button>`;
  if (isIOS())
    return `<ol class="bk-steps"><li>Ouvrez le jeu dans <b>Safari</b>.</li><li>Touchez le bouton <b>Partager</b> <span aria-hidden="true">⬆️</span>.</li><li>Choisissez <b>« Sur l'écran d'accueil »</b>.</li></ol>`;
  return `<p>Dans le menu du navigateur, choisissez <b>« Installer l'application »</b> ou <b>« Ajouter à l'écran d'accueil »</b>.</p>`;
}
function renderInstallHint() {
  const el = document.getElementById('install-hint');
  if (!el) return;
  const dismissed = !!backupMeta().installHintDismissed;
  el.hidden = isInstalled() || dismissed || !(deferredInstallPrompt || isIOS());
}

/* ---- rappel de sauvegarde ---- */
function backupDue() {
  const last = backupMeta().lastBackupAt;
  const anyProgress = profiles.list.length > 0 && state.missions >= 5;
  if (!last) return anyProgress;
  return Date.now() - new Date(last).getTime() > BACKUP_REMIND_DAYS * 864e5;
}
function lastBackupText() {
  const last = backupMeta().lastBackupAt;
  if (!last) return 'jamais';
  const days = Math.floor((Date.now() - new Date(last).getTime()) / 864e5);
  return days <= 0 ? "aujourd'hui" : days === 1 ? 'hier' : `il y a ${days} jours`;
}
function renderBackupReminder() {
  const pill = document.getElementById('avatar-pill');
  if (pill) pill.classList.toggle('backup-due', backupDue());
}

/* ---- la fenêtre « Sauvegarde » (pour les adultes) ---- */
function backupFileName() {
  const d = new Date();
  return `lagon-magique-sauvegarde-${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}.json`;
}
async function exportBackupFile() {
  const b = buildBackup();
  const json = JSON.stringify(b, null, 1);
  const name = backupFileName();
  const file = typeof File === 'function' ? new File([json], name, { type: 'application/json' }) : null;
  try {
    if (file && navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({ files: [file], title: 'Sauvegarde du Lagon Magique' });
      setBackupMeta({ lastBackupAt: b.at });
      return 'shared';
    }
  } catch (e) {
    if (e && /** @type {Error} */ (e).name === 'AbortError') return 'cancelled';
  }
  const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
  setBackupMeta({ lastBackupAt: b.at });
  return 'downloaded';
}

function openBackup() {
  const players = profiles.list.map((p) => p.name || 'Sans nom').join(', ');
  openModal(`
    ${gameHeader('💾 Sauvegarde', 'Pour ne jamais perdre la partie (à faire avec un adulte)')}
    <section class="bk-card">
      <h3>Sauvegarder</h3>
      <p>Joueurs : <b>${players || '—'}</b>. Dernière sauvegarde : <b id="bk-last">${lastBackupText()}</b>.</p>
      <button class="btn-primary" id="bk-export">💾 Enregistrer une sauvegarde</button>
      <p class="bk-help">Sur téléphone, choisissez « Enregistrer dans Fichiers » ou envoyez-la-vous par message.</p>
    </section>
    <section class="bk-card">
      <h3>Changer d'appareil</h3>
      <p>Copiez ce code, envoyez-le sur l'autre appareil, puis collez-le dans « Restaurer ».</p>
      <button class="btn-small" id="bk-code">📋 Copier le code de transfert</button>
      <textarea id="bk-code-out" class="bk-code" readonly hidden aria-label="Code de transfert"></textarea>
    </section>
    <section class="bk-card">
      <h3>Restaurer</h3>
      <p>Remplace la partie de cet appareil par une sauvegarde.</p>
      <label class="btn-small ghost bk-file">📂 Choisir un fichier<input type="file" id="bk-file" accept="application/json,.json" hidden></label>
      <textarea id="bk-paste" class="bk-code" placeholder="…ou collez ici un code de transfert" aria-label="Code de transfert à restaurer"></textarea>
      <button class="btn-small" id="bk-paste-go">Restaurer ce code</button>
      <div id="bk-preview" aria-live="polite"></div>
      ${undoRestoreAvailable() ? `<button class="btn-ghost" id="bk-undo">↩️ Revenir à la partie d'avant la dernière restauration</button>` : ''}
    </section>
    <section class="bk-card">
      <h3>Installer le jeu</h3>
      <p>Installé sur l'écran d'accueil, le jeu s'ouvre en plein écran, marche sans Internet, et Safari n'efface plus la partie.</p>
      <div id="bk-install-zone">${installHelpHTML()}</div>
      <p class="bk-help" id="bk-persist"></p>
    </section>
  `);
  bindQuit();
  /** @param {string} id */
  const $ = (id) => document.getElementById(id);
  setHandler($('bk-export'), 'click', async () => {
    playSound('tap');
    const r = await exportBackupFile();
    if (r !== 'cancelled') {
      showToast('💾 Sauvegarde enregistrée');
      const l = $('bk-last');
      if (l) l.textContent = lastBackupText();
      renderBackupReminder();
    }
  });
  setHandler($('bk-code'), 'click', async () => {
    playSound('tap');
    const code = await backupToCode(buildBackup());
    const out = /** @type {HTMLTextAreaElement} */ ($('bk-code-out'));
    out.value = code;
    out.hidden = false;
    try {
      await navigator.clipboard.writeText(code);
      showToast('📋 Code copié');
      setBackupMeta({ lastBackupAt: new Date().toISOString() });
      renderBackupReminder();
    } catch {
      out.focus();
      out.select();
      showToast('Sélectionnez le code puis copiez-le');
    }
  });
  /** @param {BackupCheck} result */
  const preview = async (result) => {
    const box = /** @type {HTMLElement} */ ($('bk-preview'));
    if (!result.ok) {
      box.innerHTML = `<p class="bk-err">${result.error}</p>`;
      return;
    }
    const when = result.backup.at
      ? new Date(result.backup.at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
      : 'date inconnue';
    box.innerHTML = `<div class="bk-confirm"><p>Sauvegarde du <b>${when}</b> :</p>
      <ul>${result.players.map((p) => `<li>${avatarHTML(p.avatar)} <b>${p.name}</b> — ${p.missions} mission${p.missions > 1 ? 's' : ''}</li>`).join('')}</ul>
      <p>La partie actuelle de cet appareil sera remplacée (une copie est gardée).</p>
      <button class="btn-craft danger" id="bk-apply">Remplacer par cette sauvegarde</button></div>`;
    setHandler($('bk-apply'), 'click', () => {
      const { failed } = applyBackup(result.backup);
      playSound(failed ? 'tap' : 'win');
      closeModal();
      showToast(
        failed
          ? `⚠️ Restauration incomplète : ${failed} partie${failed > 1 ? 's' : ''} non enregistrée${failed > 1 ? 's' : ''} (mémoire pleine ?)`
          : '✅ Partie restaurée',
      );
    });
  };
  setHandler($('bk-file'), 'change', (e) => {
    const files = /** @type {HTMLInputElement} */ (e.target).files;
    const f = files && files[0];
    if (!f) return;
    const rd = new FileReader();
    setHandler(rd, 'load', () => preview(parseBackupText(String(rd.result || ''))));
    setHandler(rd, 'error', () => preview({ ok: false, error: 'Impossible de lire ce fichier.' }));
    rd.readAsText(f);
  });
  setHandler($('bk-paste-go'), 'click', async () => {
    playSound('tap');
    preview(await parseBackupCode(/** @type {HTMLTextAreaElement} */ ($('bk-paste')).value));
  });
  const undo = $('bk-undo');
  if (undo)
    setHandler(undo, 'click', () => {
      /** @type {BackupCheck} */
      let r = { ok: false };
      try {
        // pas de copie : JSON.parse(null) donne null, que parseBackupObject refuse
        r = parseBackupObject(JSON.parse(/** @type {string} */ (localStorage.getItem(BACKUP_UNDO_KEY))));
      } catch {
        // copie de secours absente ou abîmée : pas de retour arrière proposé
      }
      if (r.ok) preview(r);
    });
  const inst = $('bk-install');
  if (inst)
    setHandler(inst, 'click', async () => {
      if (!deferredInstallPrompt) return;
      deferredInstallPrompt.prompt();
      try {
        await deferredInstallPrompt.userChoice;
      } catch {
        // l'adulte a fermé la demande d'installation : rien à faire
      }
      deferredInstallPrompt = null;
      const z = $('bk-install-zone');
      if (z) z.innerHTML = installHelpHTML();
    });
  const ps = $('bk-persist');
  if (navigator.storage && navigator.storage.persisted) {
    navigator.storage
      .persisted()
      .then((ok) => {
        if (ps)
          ps.textContent = ok
            ? "🔒 Ce navigateur protège la partie contre l'effacement automatique."
            : "ℹ️ Ce navigateur peut effacer la partie s'il manque de place : pensez à sauvegarder.";
      })
      .catch(() => {});
  }
}

/* ---- branchements au démarrage ---- */
function initBackup() {
  const hint = document.getElementById('install-hint');
  if (hint) {
    setHandler(hint.querySelector('[data-install-how]'), 'click', () => {
      playSound('tap');
      openBackup();
    });
    setHandler(hint.querySelector('[data-install-close]'), 'click', () => {
      playSound('tap');
      setBackupMeta({ installHintDismissed: true });
      renderInstallHint();
    });
  }
  renderInstallHint();
  renderBackupReminder();
}

// l'en-tête du joueur redemande le rappel de sauvegarde (js/features/profile)
on('ui:backup-reminder', renderBackupReminder);

export { backupDue, initBackup, openBackup, requestPersistentStorage };
