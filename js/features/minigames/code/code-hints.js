/* ---------- « Le code secret » : les indices du compagnon (table H2 de la spec) ----------
   Niveau 1 : par quelle carte commencer (la plus sûre). Niveau 2 : ce que
   cette carte veut dire, sans jamais poser un symbole à la place de l'enfant :
   on ne dit où va un symbole que si une carte l'écrit telle quelle. Aucune
   réponse écartée. */
import { CODE_SYMBOLS, codeName, codeWheelName } from './code-make.js';

/** @typedef {import('./code-make.js').CodeClue} CodeClue */
/** @typedef {import('../../hints/index.js').HintFx} HintFx */
/** @typedef {{ clues: CodeClue[] }} CodeHintQ la question d'indice : les cartes du cadenas, dans l'ordre */
/** @typedef {import('../../hints/index.js').HintProvider<CodeHintQ>} CodeHintProvider */

const CODE_HINT_FIRST =
  "Commence par l'indice le plus sûr : celui qui chasse un symbole du code, ou celui qui dit où va un symbole.";
/** @param {string} id « il » ou « elle » */
function codeIl(id) {
  return CODE_SYMBOLS[id].gender === 'f' ? 'elle' : 'il';
}
/** @type {Record<string, (k: CodeClue) => string>} ce que veut dire la carte, par type */
const CODE_HINT_SECOND = {
  absent: (k) =>
    `${codeName(k.s)} n'est pas dans le code : ${codeIl(k.s)} ne va sur aucune roue. Regarde les autres symboles.`,
  voisins: (k) => {
    const y = k.s2 || k.s;
    const fem = CODE_SYMBOLS[k.s].gender === 'f' && CODE_SYMBOLS[y].gender === 'f';
    return `${codeName(k.s)} et ${CODE_SYMBOLS[y].name} sont ${fem ? 'collées' : 'collés'} : ${CODE_SYMBOLS[k.s].name} d'abord, puis ${CODE_SYMBOLS[y].name} juste à sa droite. Où peuvent-${fem ? 'elles' : 'ils'} aller ?`;
  },
  pas: (k) => `${codeName(k.s)} n'est pas sur ${codeWheelName(k.w)}. Où peut-${codeIl(k.s)} aller, alors ?`,
  est: (k) =>
    `Une carte dit où va ${CODE_SYMBOLS[k.s].name} : ${codeWheelName(k.w)}. Commence par elle, puis cherche les autres.`,
  bout: (k) => `${codeName(k.s)} est sur une roue du bout : la première ou la dernière. Laquelle reste possible ?`,
};
/**
 * La première carte d'un des types, dans l'ordre de préférence donné.
 * @param {CodeClue[]} clues
 * @param {string[]} order
 */
function codeFirstClue(clues, order) {
  const type = order.find((ty) => clues.some((k) => k.t === ty)) || clues[0].t;
  return clues.findIndex((k) => k.t === type);
}

/**
 * Les deux niveaux d'indice du cadenas.
 * @type {CodeHintProvider}
 */
const codeHints = (q) => {
  if (!q.clues.length) return [];
  const sure = q.clues[codeFirstClue(q.clues, ['absent', 'est', 'voisins', 'pas', 'bout'])];
  const at = codeFirstClue(q.clues, ['absent', 'voisins', 'pas', 'est', 'bout']);
  return [
    { say: CODE_HINT_FIRST, fx: { glow: `.code-clue[data-t="${sure.t}"]` } },
    { say: CODE_HINT_SECOND[q.clues[at].t](q.clues[at]), fx: { glow: `.code-clue[data-k="${at}"]` } },
  ];
};

export { codeHints };
