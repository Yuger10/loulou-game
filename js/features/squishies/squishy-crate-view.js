/* ---------- 🗃️ Mes boîtes : ce que les écrans de l'onglet partagent ----------
   L'état de l'onglet (rien de sauvegardé : la partie est dans
   state.squishies.crates), ses minuteurs, l'étiquette en image, et le passage
   d'un écran à l'autre. Les cartes et le choix de l'étiquette sont dans
   squishy-crates.js, la boîte ouverte dans squishy-crate-box.js : chacun des
   deux ouvre l'autre, donc ils passent par ici (cbRender, cbPickLabel), sans
   s'importer l'un l'autre (import/no-cycle). */
import { crateCriteria } from '../../entities/game-state/index.js';
import { SQUISHY_SERIES } from '../../entities/squishy/index.js';
import { onModalChange } from '../../shared/ui/index.js';
import { sortIconsHTML } from './squishy-art.js';

/** @typedef {{ i: number, first: string | null, second: string | null }} CratePick le choix d'étiquette en cours */

/**
 * L'état de l'onglet.
 * @type {{ open: number | null, pick: CratePick | null, sel: string | null, wrong: number, justDragged: boolean }}
 */
const cb = {
  open: null, // la boîte ouverte, ou null : les cartes
  pick: null, // le choix d'étiquette en cours
  sel: null, // le squishy du tapis choisi (toucher puis toucher)
  wrong: 0, // erreurs d'affilée dans la boîte ouverte
  justDragged: false, // un glisser vient de finir : le clic qui suit est ignoré
};
let cbTimers = /** @type {Array<ReturnType<typeof setTimeout>>} */ ([]);
/** @param {() => void} fn @param {number} ms */
function cbLater(fn, ms) {
  const t = setTimeout(() => {
    cbTimers = cbTimers.filter((x) => x !== t);
    fn();
  }, ms);
  cbTimers.push(t);
}
// une lueur ou un drapeau en attente ne survit pas à la fenêtre
onModalChange(() => {
  cbTimers.forEach(clearTimeout);
  cbTimers = [];
  cb.justDragged = false;
});

/** @param {string} s @returns {string} la phrase avec sa majuscule */
const cbCap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
function cbRoom() {
  return document.getElementById('sq-room');
}

/* ---- l'étiquette en image, pour qui ne lit pas encore ---- */
/** @param {string | null} key */
function crateLabelHTML(key) {
  if (!key) return '🏷️ ?';
  const rules = crateCriteria(key);
  if (!rules) return '<span class="cb-emoji">❤️</span>';
  if (rules[0].type === 'series') return `<span class="cb-emoji">${SQUISHY_SERIES[rules[0].value].emoji}</span>`;
  return sortIconsHTML(rules);
}

/* ---- d'un écran à l'autre : squishy-crates.js pose ici son rendu et son choix d'étiquette ---- */
/** @type {{ render: () => void, pick: (i: number) => void } | null} */
let cbNav = null;
/** @param {() => void} render @param {(i: number) => void} pick */
function cbSetNav(render, pick) {
  cbNav = { render, pick };
}
// redessiner l'écran en cours (cartes, étiquette ou boîte)
function cbRender() {
  if (cbNav) cbNav.render();
}
/** @param {number} i la boîte dont on choisit l'étiquette */
function cbPickLabel(i) {
  if (cbNav) cbNav.pick(i);
}
// revenir aux cartes (ou y arriver) : la boîte se ferme, le compteur d'erreurs repart
function cbShowCards() {
  cb.open = null;
  cb.pick = null;
  cb.sel = null;
  cb.wrong = 0;
  cbRender();
}

export { cb, cbCap, cbLater, cbPickLabel, cbRender, cbRoom, cbSetNav, cbShowCards, crateLabelHTML };
