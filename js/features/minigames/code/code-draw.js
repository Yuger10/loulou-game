/* ---------- « Le code secret » : le dessin (tables I2 et A2 de la spec) ----------
   Le cadenas (une roue par symbole du code, chacune de sa couleur), les
   cartes d'indice dessinées (l'enfant n'a pas besoin de lire : il touche une
   carte pour l'écouter), la palette de symboles et le bouton « Ouvrir ». */
import { CODE_COLORS, CODE_SYMBOLS, codeClueSay } from './code-make.js';

/** @typedef {import('./code-make.js').CodeClue} CodeClue */
/** @typedef {import('./code-make.js').CodeLock} CodeLock */

/** @param {string} id l'emoji d'un symbole */
function codeEmoji(id) {
  return CODE_SYMBOLS[id].emoji;
}
/**
 * Une petite case du dessin d'une carte : de la couleur de sa roue, ou blanche.
 * @param {string} inside ce que la case montre
 * @param {number} [w] le rang de la roue (absent : une case blanche)
 * @param {string} [extra] une classe de plus
 */
function codeBox(inside, w, extra) {
  const color = w === undefined ? '' : ` style="border-color:${CODE_COLORS[w].hex}"`;
  return `<i class="code-box${extra ? ' ' + extra : ''}"${color}>${inside}</i>`;
}
/**
 * Un petit cadenas : une case par roue, le symbole dans la case `at`.
 * @param {number} wheels
 * @param {number} at
 * @param {string} inside
 */
function codeMiniLock(wheels, at, inside) {
  return Array.from({ length: wheels }, (_, w) => codeBox(w === at ? inside : '', w)).join('');
}
/** @type {Record<string, (k: CodeClue, wheels: number) => string>} le dessin de chaque type d'indice */
const CODE_CARDS = {
  est: (k, n) => `${codeMiniLock(n, k.w || 0, codeEmoji(k.s))}<b class="code-mark">✅</b>`,
  pas: (k, n) => codeMiniLock(n, k.w || 0, `${codeEmoji(k.s)}<b class="code-cross">✕</b>`),
  absent: (k) => `${codeBox(codeEmoji(k.s))}<b class="code-mark">🚫</b>`,
  voisins: (k) =>
    `${codeBox(codeEmoji(k.s), undefined, 'joined')}<b class="code-link"></b>${codeBox(codeEmoji(k.s2 || k.s), undefined, 'joined')}`,
  bout: (k, n) =>
    `${codeBox(codeEmoji(k.s), 0, 'dashed')}<em class="code-or">ou</em>${codeBox(codeEmoji(k.s), n - 1, 'dashed')}`,
};
/**
 * Les cartes d'indice, dans l'ordre : la carte k porte `data-k` et son type.
 * @param {CodeLock} lock
 */
function codeCluesHTML(lock) {
  return `<div class="code-clues">${lock.clues
    .map(
      (k, i) =>
        `<button class="code-clue" data-k="${i}" data-t="${k.t}" aria-label="${codeClueSay(k).replace(/"/g, '&quot;')}">${CODE_CARDS[k.t](k, lock.wheels)}</button>`,
    )
    .join('')}</div>`;
}
/**
 * Toute la scène : indices, cadenas, palette, « Ouvrir » (grisé tant qu'une roue est vide).
 * @param {CodeLock} lock
 */
function codeStageHTML(lock) {
  const wheels = Array.from(
    { length: lock.wheels },
    (_, w) =>
      `<button class="code-wheel${w ? '' : ' sel'}" data-w="${w}" data-s="" style="border-color:${CODE_COLORS[w].hex}" aria-label="La roue ${CODE_COLORS[w].name}"></button>`,
  ).join('');
  const palette = lock.palette
    .map(
      (s) =>
        `<button class="code-sym" data-s="${s}" aria-label="${CODE_SYMBOLS[s].name.replace(/"/g, '&quot;')}">${codeEmoji(s)}</button>`,
    )
    .join('');
  return `<div id="code-root">
      ${codeCluesHTML(lock)}
      <div class="code-lock"><span class="code-shackle"></span><div class="code-wheels">${wheels}</div></div>
      <div class="code-palette">${palette}</div>
      <button class="btn-primary" id="code-open" disabled>🔓 Ouvrir</button>
    </div>`;
}

export { codeEmoji, codeStageHTML };
