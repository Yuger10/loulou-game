/* ---------- Le bilan de la semaine (track bilan-parents) ----------
   L'espace parents montre beaucoup de chiffres par jeu, mais ne dit pas quoi
   faire. Cette carte « 🧭 Cette semaine » se lit en dix secondes : ce qui va
   bien, ce qui résiste cette semaine (3 jeux au plus) et, pour chacun, une
   idée simple à faire avec l'enfant, loin de l'écran.
   - Rien n'est stocké : la carte se calcule à l'affichage depuis `skills`.
   - Aucune note, aucun pourcentage, aucune comparaison avec d'autres enfants,
     et rien ne quitte l'appareil (test/bilan.test.js le vérifie).
   - La partie peut venir d'une sauvegarde importée : elle est déjà passée par
     readSave, et `bilanSkill` écarte en plus toute entrée qu'une partie écrite
     par le jeu ne peut pas contenir. Le bilan n'écrit jamais dans la partie.
   - Ce fichier n'importe rien de parents.js (pas de cycle) : il s'inscrit sur
     l'événement `parents:cards`, comme storage-alert.js. */
import { GAME_LIST } from '../../entities/difficulty/index.js';
import { emit, on } from '../../shared/lib/index.js';
import { skillStatus, todayKey } from '../adaptive/index.js';
import { BILAN_TIPS } from './bilan-tips.js';

/** Le suivi d'un jeu, tel que readSave le remet en forme.
 * @typedef {import('../../entities/game-state/index.js').GameState['skills'][string]} BilanSkill */

const BILAN_DAYS = 7; // la fenêtre de la semaine : aujourd'hui et les 6 jours d'avant
const BILAN_MAX = 3; // au plus 3 jeux cités par bloc : court et faisable le soir même
// Le palier montré est celui de la dernière mission jouée (`t`), pas `lvl`,
// qui peut dépasser d'un cran le palier vraiment joué quand l'âge plafonne.
/** @type {Record<number, string>} */
const BILAN_TIER_LABELS = {
  1: 'GS, début CP',
  2: 'CP',
  3: 'fin CP, CE1',
  4: 'CE1',
  5: 'fin CE1, CE2',
  6: 'CE2',
};

/**
 * Échappe la seule phrase qui vient d'une autre slice (`bilan:error-kind`).
 * L'apostrophe reste telle quelle : aucun attribut n'est délimité par elle.
 * @param {string} s
 * @returns {string}
 */
function bilanEsc(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/**
 * Politique « Entrée du bilan » : une entrée dont un champ est hors de ce
 * qu'une partie écrite par le jeu peut contenir (import abîmé) est ignorée
 * partout, sans correction de la sauvegarde. Sinon, une copie : tout le bilan
 * ne lit qu'elle, et un écouteur ne peut pas toucher à la partie.
 * @param {BilanSkill} s entrée déjà remise en forme par readSave
 * @returns {BilanSkill | null}
 */
function bilanSkill(s) {
  if (s.last !== null && !/^\d{4}-\d{2}-\d{2}$/.test(s.last)) return null;
  if (!Number.isInteger(s.wins) || !Number.isInteger(s.fails)) return null;
  if (s.recent.length > 10) return null;
  if (s.recent.some((r) => !Number.isInteger(r.t) || r.t < 1 || r.t > 6 || !Number.isInteger(r.e))) return null;
  /** @type {BilanSkill} */
  const copy = {
    wins: s.wins,
    fails: s.fails,
    errors: 0, // jamais lu par le bilan : présent pour que la copie soit un suivi complet
    last: s.last,
    recent: s.recent.map((r) => ({ t: r.t, e: r.e, ok: r.ok })),
  };
  if (s.support === true) copy.support = true;
  return copy;
}

/** @param {string} key une clé de BILAN_TIPS */
function bilanName(key) {
  const own = BILAN_TIPS[key].name;
  if (own) return own;
  const g = GAME_LIST.find((x) => x.key === key);
  return g ? `${g.emoji} ${g.name}` : key;
}

/**
 * L'étoile de la track « aller plus loin », si elle existe un jour dans la
 * partie : lue sans rien supposer, elle ne fait jamais ignorer le jeu.
 * @param {unknown} stars
 * @param {string} key
 */
function bilanStar(stars, key) {
  if (!stars || typeof stars !== 'object') return false;
  const entry = /** @type {Record<string, unknown>} */ (stars)[key];
  if (!entry || typeof entry !== 'object' || !('won' in entry)) return false;
  const won = entry.won;
  return typeof won === 'number' && Number.isInteger(won) && won >= 1;
}

/**
 * Règle « Réponse d'erreur » : la première phrase non vide renvoyée par un
 * écouteur, coupée à 80 caractères avant l'échappement. Tout le reste
 * (rien, nombre, objet, écouteur qui plante) est ignoré.
 * @param {string} key
 * @param {BilanSkill} s
 */
function bilanErrorKind(key, s) {
  // l'écouteur reçoit sa propre copie : il ne peut changer ni la partie ni la carte
  for (const reply of emit('bilan:error-kind', { key, s: bilanSkill(s) })) {
    if (typeof reply !== 'string') continue;
    const text = reply.trim();
    // par caractère entier, pour ne pas couper un emoji en deux
    if (text) return bilanEsc(Array.from(text).slice(0, 80).join(''));
  }
  return '';
}

/**
 * @param {string} a
 * @param {string} b
 */
function bilanCompare(a, b) {
  if (a < b) return -1;
  return a > b ? 1 : 0;
}

/**
 * La ligne d'un jeu qui résiste : son nom, le palier vraiment joué, l'erreur
 * fréquente si une autre slice la connaît, puis l'idée sans écran.
 * @param {string} key
 * @param {BilanSkill} s
 */
function bilanHardRow(key, s) {
  const tier = s.recent.length ? Number(s.recent[s.recent.length - 1].t) || 0 : 0;
  const kind = bilanErrorKind(key, s);
  const where = tier ? ` · palier ${tier} (repère : ${BILAN_TIER_LABELS[tier]})` : '';
  return `<li><p class="bilan-game"><strong>${bilanName(key)}</strong>${where}${kind ? ` · Erreur fréquente : ${kind}` : ''}</p>
      <p class="bilan-tip">Une idée sans écran : ${BILAN_TIPS[key].tip}</p></li>`;
}

/**
 * Les jeux suivis de la partie, chacun avec ce que la carte doit en savoir.
 * @param {Record<string, BilanSkill | undefined>} skills
 */
function bilanRows(skills) {
  // calendrier local, sans dérive à l'heure d'été (contrairement à Date.now() - 6 jours)
  const start = new Date();
  start.setDate(start.getDate() - (BILAN_DAYS - 1));
  const from = todayKey(start),
    to = todayKey();

  const rows = [];
  for (const key of Object.keys(BILAN_TIPS)) {
    const raw = skills[key];
    const s = raw ? bilanSkill(raw) : null;
    if (!s) continue;
    const status = skillStatus(s, key);
    // les dates AAAA-MM-JJ se comparent comme du texte ; une date future est hors fenêtre
    const inWeek = s.last !== null && from <= s.last && s.last <= to;
    rows.push({
      key,
      s,
      status,
      inWeek,
      last: s.last || '',
      // « résiste » : joué cette semaine, et redescendu d'un cran ou « à travailler »
      hard: inWeek && (s.support === true || status === 'difficile'),
      missed: s.recent.slice(-6).filter((r) => !r.ok).length,
    });
  }
  return rows;
}

/**
 * Les jeux qui résistent : le soutien d'abord, puis le plus de ratés récents,
 * puis le plus récent, puis par clé.
 * @param {ReturnType<typeof bilanRows>} rows
 */
function bilanHard(rows) {
  return rows
    .filter((r) => r.hard)
    .sort(
      (a, b) =>
        Number(b.s.support === true) - Number(a.s.support === true) ||
        b.missed - a.missed ||
        bilanCompare(b.last, a.last) ||
        bilanCompare(a.key, b.key),
    )
    .slice(0, BILAN_MAX);
}

/**
 * Les jeux qui vont bien, du plus récent au plus ancien : un jeu qui résiste
 * n'y est jamais cité, même coupé par la limite.
 * @param {ReturnType<typeof bilanRows>} rows
 */
function bilanGood(rows) {
  return rows
    .filter((r) => r.status === 'aise' && !r.hard)
    .sort((a, b) => bilanCompare(b.last, a.last) || bilanCompare(a.key, b.key))
    .slice(0, BILAN_MAX);
}

/**
 * La carte « 🧭 Cette semaine » d'une partie (celle de l'enfant affiché).
 * @param {{ skills?: unknown, stars?: unknown }} st
 * @returns {string}
 */
function bilanHTML(st) {
  // toute partie vue ici est passée par readSave (load ou profileState), qui
  // garantit la forme des entrées ; une lecture échouée donne {}
  const skills =
    st.skills && typeof st.skills === 'object' ? /** @type {Record<string, BilanSkill | undefined>} */ (st.skills) : {};
  const rows = bilanRows(skills);
  const played = rows.some((r) => r.inWeek);
  const hard = bilanHard(rows);
  const good = bilanGood(rows);

  const parts = [];
  if (!played) parts.push(`<p>Pas de partie ces ${BILAN_DAYS} derniers jours.</p>`);
  if (good.length) {
    const names = good.map((r) => bilanName(r.key) + (bilanStar(st.stars, r.key) ? ' ⭐' : ''));
    parts.push(`<p class="bilan-good">Ce qui va bien : ${names.join(', ')}</p>`);
  }
  if (hard.length) {
    parts.push(`<p>Ce qui résiste cette semaine :</p>
    <ul class="bilan-list">${hard.map((r) => bilanHardRow(r.key, r.s)).join('')}</ul>`);
  } else if (played) parts.push('<p>Rien ne résiste cette semaine.</p>');
  return `<section class="bk-card ps-bilan"><h3>🧭 Cette semaine</h3>
    ${parts.join('\n    ')}
    <p class="bk-help">Ces idées viennent des parties jouées sur cet appareil. Rien n'est envoyé ailleurs.</p>
  </section>`;
}

on('parents:cards', (/** @type {{ st: { skills?: unknown, stars?: unknown } }} */ { st }) => bilanHTML(st));
