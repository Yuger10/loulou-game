/* ---------- La version du jeu et sa mise à jour (v66) ----------
   Le jeu se met à jour tout seul quand il démarre avec Internet : le service
   worker (sw.js) trouve la nouvelle version, l'installe, et la page se recharge
   (js/app/init.js). Mais sur iPad, une app laissée en arrière-plan ne redémarre
   pas : elle reprend l'ancienne page. Cette slice ajoute dans l'espace parents :
   - la version du jeu (APP_LABEL, js/shared/lib/version.js) ;
   - un bouton « Chercher une mise à jour », qui demande tout de suite au
     service worker s'il y a du neuf, et redémarre le jeu si oui ;
   - après ce redémarrage, un message « Le jeu est à jour : version N » (affiché
     sur l'écran titre par js/app/init.js).
   La progression n'est jamais touchée : elle est dans la sauvegarde, qui se
   migre toute seule (js/entities/game-state). */
import { APP_LABEL, versionBuild } from '../../shared/lib/index.js';
import { playSound, setHandler } from '../../shared/ui/index.js';

// mémorisé juste avant le redémarrage, pour l'annoncer ensuite
const UPDATE_FLAG = 'lagon-update-from';
// si le nouveau service worker ne prend pas la main tout seul, on recharge quand même
const UPDATE_RELOAD_AFTER = 20000;
const UPDATE_MESSAGES = {
  searching: "🔍 Recherche d'une nouvelle version…",
  offline: "📴 Pas d'Internet : le jeu se mettra à jour à la prochaine connexion.",
  error: '😕 Le site ne répond pas. Vérifiez Internet, puis réessayez dans un moment.',
  uptodate: `✅ Le jeu est à jour (version ${APP_LABEL}).`,
  found: '✨ Nouvelle version trouvée ! Le jeu redémarre dans quelques secondes…',
  reload: '🔄 Le jeu redémarre pour prendre la dernière version…',
};

// la plus récente des versions déjà installées (caches `lagon-v66`, `lagon-v66.1`…), 0 sinon
async function installedVersion() {
  try {
    if (typeof caches === 'undefined') return 0;
    const nums = (await caches.keys()).filter((k) => /^lagon-v\d+(\.\d+)?$/.test(k)).map(versionBuild);
    return Math.max(0, ...nums);
  } catch {
    return 0;
  }
}

/* Cherche une mise à jour. Réponses :
   'offline'  : pas d'Internet ;
   'error'    : le site n'a pas répondu ;
   'found'    : une nouvelle version s'installe, le jeu va redémarrer ;
   'reload'   : la nouvelle version est déjà là, il faut juste redémarrer
                (ou il n'y a pas de service worker) ;
   'uptodate' : rien de neuf. */
async function checkForUpdate() {
  if (navigator.onLine === false) return 'offline';
  const sw = navigator.serviceWorker;
  if (!sw || typeof sw.getRegistration !== 'function') return 'reload';
  let reg;
  try {
    reg = await sw.getRegistration();
    if (!reg) return 'reload';
    // demande sw.js au site : s'il a changé, le nouveau s'installe aussitôt
    await reg.update();
  } catch {
    return 'error';
  }
  if (reg.installing || reg.waiting) {
    if (reg.waiting) reg.waiting.postMessage('skipWaiting'); // oxlint-disable-line unicorn/require-post-message-target-origin -- service worker, pas une fenêtre
    return 'found';
  }
  // un service worker plus récent que cette page est déjà installé
  if ((await installedVersion()) > versionBuild(APP_LABEL)) return 'reload';
  return 'uptodate';
}

function reloadGame() {
  location.reload();
}

function rememberUpdate() {
  try {
    sessionStorage.setItem(UPDATE_FLAG, APP_LABEL);
  } catch {
    // session bloquée (navigation privée) : on ne montrera simplement pas « Le jeu est à jour »
  }
}

// au démarrage : si le jeu vient de redémarrer pour une mise à jour, le message
// à montrer (une seule fois), sinon null
function announceUpdate() {
  let from = null;
  try {
    from = sessionStorage.getItem(UPDATE_FLAG);
    sessionStorage.removeItem(UPDATE_FLAG);
  } catch {
    // session bloquée : pas de message après la mise à jour, rien de grave
  }
  if (from === null) return null;
  return versionBuild(from) < versionBuild(APP_LABEL)
    ? `✨ Le jeu est à jour : version ${APP_LABEL}`
    : `✅ Le jeu est à jour (version ${APP_LABEL})`;
}

/* ---- la carte de l'espace parents ---- */
function updateCardHTML() {
  return `<section class="bk-card ps-update"><h3>📲 Version du jeu</h3>
    <p class="ps-version">Version <strong id="ps-version">${APP_LABEL}</strong></p>
    <div class="ps-actions">
      <button type="button" class="btn-small" id="ps-update">🔄 Chercher une mise à jour</button>
    </div>
    <p class="ps-update-msg" id="ps-update-msg" role="status" aria-live="polite"></p>
    <p class="bk-help">Le jeu se met à jour tout seul quand il démarre avec Internet. Sur iPad, il peut rester ouvert en arrière-plan sans jamais redémarrer : ce bouton cherche tout de suite. La progression est gardée.</p>
    <p class="bk-help">Une version qui vient de sortir peut mettre une dizaine de minutes à arriver.</p>
  </section>`;
}

function bindUpdateCard() {
  const btn = /** @type {HTMLButtonElement} */ (document.getElementById('ps-update')),
    msg = document.getElementById('ps-update-msg');
  if (!btn || !msg) return;
  setHandler(btn, 'click', async () => {
    playSound('tap');
    btn.disabled = true;
    msg.textContent = UPDATE_MESSAGES.searching;
    const status = await checkForUpdate();
    msg.textContent = UPDATE_MESSAGES[status];
    msg.dataset.status = status;
    if (status === 'found' || status === 'reload') {
      // 'found' : js/app/init.js recharge dès que la nouvelle version prend la main
      rememberUpdate();
      setTimeout(reloadGame, status === 'reload' ? 900 : UPDATE_RELOAD_AFTER);
    } else {
      btn.disabled = false;
    }
  });
}

export { announceUpdate, bindUpdateCard, checkForUpdate, updateCardHTML };
