/* ---------- « Le code secret » : la fabrique de cadenas (tables S2, I2 et A2 de la spec) ----------
   Un cadenas = une palette de symboles, un code (des symboles tous
   différents, un par roue) et des indices. Les indices sont tous vrais, un
   seul code les respecte tous, et chacun est nécessaire : sans lui, au moins
   deux codes conviendraient. Tout se déduit donc avant d'ouvrir.
   Les symboles et les couleurs des roues sont ici, en local : le jeu ne
   dépend d'aucune entité de l'Île des Coffres. */
import { codeRound } from '../../../entities/difficulty/index.js';
import { shuffle } from '../../../shared/lib/index.js';

/** @typedef {import('../../../entities/difficulty/index.js').CodeRound} CodeRound */
/** @typedef {{ emoji: string, name: string, of: string, gender: 'f' | 'm' }} CodeSymbol */
/**
 * Un indice (table A2). `w` : le rang de la roue, 0 à gauche ; `s2` : le
 * voisin de droite. Aucune autre clé : le solveur des tests lit ces objets.
 * @typedef {{ t: 'est' | 'pas' | 'absent' | 'voisins' | 'bout', s: string, s2?: string, w?: number }} CodeClue
 */
/** @typedef {{ wheels: number, palette: string[], code: string[], clues: CodeClue[] }} CodeLock */

/** @type {Record<string, CodeSymbol>} */
const CODE_SYMBOLS = {
  poisson: { emoji: '🐟', name: 'le poisson', of: 'du poisson', gender: 'm' },
  etoile: { emoji: '⭐', name: "l'étoile", of: "de l'étoile", gender: 'f' },
  lune: { emoji: '🌙', name: 'la lune', of: 'de la lune', gender: 'f' },
  pomme: { emoji: '🍎', name: 'la pomme', of: 'de la pomme', gender: 'f' },
  fleur: { emoji: '🌸', name: 'la fleur', of: 'de la fleur', gender: 'f' },
  coquillage: { emoji: '🐚', name: 'le coquillage', of: 'du coquillage', gender: 'm' },
};
// les roues, de gauche à droite
const CODE_COLORS = [
  { name: 'rouge', hex: '#E8344E' },
  { name: 'bleue', hex: '#2F7CC0' },
  { name: 'verte', hex: '#2F9551' },
  { name: 'jaune', hex: '#E0A800' },
];

/** @type {Record<string, (code: string[], k: CodeClue) => boolean>} le sens de chaque indice */
const CODE_TRUE = {
  est: (c, k) => c[k.w || 0] === k.s,
  pas: (c, k) => c.includes(k.s) && c[k.w || 0] !== k.s,
  absent: (c, k) => !c.includes(k.s),
  voisins: (c, k) => c.some((s, i) => s === k.s && c[i + 1] === k.s2),
  bout: (c, k) => c[0] === k.s || c[c.length - 1] === k.s,
};
/**
 * Toutes les suites de `n` symboles différents de la palette.
 * @param {string[]} palette
 * @param {number} n
 * @returns {string[][]}
 */
function codeCandidates(palette, n) {
  if (n === 0) return [[]];
  return codeCandidates(palette, n - 1).flatMap((c) => palette.filter((s) => !c.includes(s)).map((s) => [...c, s]));
}
/**
 * Les codes qui respectent tous ces indices.
 * @param {string[][]} codes
 * @param {CodeClue[]} clues
 */
function codeLeft(codes, clues) {
  return codes.filter((c) => clues.every((k) => CODE_TRUE[k.t](c, k)));
}

/** @type {Record<string, (code: string[], palette: string[]) => CodeClue[]>} tous les indices vrais d'un type */
const CODE_FACTS = {
  est: (code) => code.map((s, w) => ({ t: 'est', s, w })),
  pas: (code) =>
    code.flatMap((s) =>
      code
        .map((_x, w) => w)
        .filter((w) => code[w] !== s)
        .map((w) => ({ t: 'pas', s, w })),
    ),
  absent: (code, palette) => palette.filter((s) => !code.includes(s)).map((s) => ({ t: 'absent', s })),
  voisins: (code) => code.slice(0, -1).map((s, i) => ({ t: 'voisins', s, s2: code[i + 1] })),
  bout: (code) => [code[0], code[code.length - 1]].map((s) => ({ t: 'bout', s })),
};
/**
 * Un essai : palette, code, puis des indices ajoutés tant qu'ils réduisent les
 * codes possibles, et enfin les indices devenus inutiles retirés.
 * @param {CodeRound} R
 * @returns {CodeLock}
 */
function codeTry(R) {
  const palette = shuffle(Object.keys(CODE_SYMBOLS)).slice(0, R.palette);
  const code = shuffle(palette).slice(0, R.wheels);
  const all = codeCandidates(palette, R.wheels);
  /** @type {CodeClue[]} */
  let clues = [];
  let left = all.length;
  for (const fact of shuffle(R.types.flatMap((ty) => CODE_FACTS[ty](code, palette)))) {
    const now = codeLeft(all, [...clues, fact]).length;
    if (left > 1 && now < left) {
      clues.push(fact);
      left = now;
    }
  }
  for (const fact of clues.slice()) {
    const without = clues.filter((k) => k !== fact);
    if (codeLeft(all, without).length === 1) clues = without;
  }
  return { wheels: R.wheels, palette, code, clues };
}
/**
 * Un cadenas du palier : au plus 500 essais pour respecter le nombre d'indices
 * et de « est » de la table T2 ; au-delà (jamais vu), le palier du dessous.
 * @param {number} tier
 * @returns {CodeLock}
 */
function codeLock(tier) {
  const R = codeRound(tier);
  for (let k = 0; k < 500; k++) {
    const lock = codeTry(R);
    const est = lock.clues.filter((c) => c.t === 'est').length;
    if (lock.clues.length <= R.maxClues && est <= R.maxEst) return lock;
  }
  return codeLock(Math.max(1, tier - 1));
}

/** @param {string} id « Le poisson », « L'étoile » : le nom avec la majuscule sur l'article */
function codeName(id) {
  const name = CODE_SYMBOLS[id].name;
  return name[0].toUpperCase() + name.slice(1);
}
/** @param {number} [w] le rang de la roue (dit par sa couleur) */
function codeWheelName(w) {
  return `la roue ${CODE_COLORS[w || 0].name}`;
}
/**
 * La phrase d'un indice (table I2).
 * @param {CodeClue} k
 */
function codeClueSay(k) {
  const X = codeName(k.s);
  if (k.t === 'est') return `${X} est sur ${codeWheelName(k.w)}.`;
  if (k.t === 'pas') return `${X} n'est pas sur ${codeWheelName(k.w)}.`;
  if (k.t === 'absent') return `${X} n'est pas dans le code.`;
  if (k.t === 'bout') return `${X} est sur une roue du bout.`;
  return `${X} est juste à gauche ${CODE_SYMBOLS[k.s2 || k.s].of}.`;
}

export { CODE_COLORS, CODE_SYMBOLS, codeClueSay, codeLock, codeName, codeWheelName };
