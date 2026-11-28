/* Les dessins des squishies de la saison 3 « La Grande Expédition ».
   squishy-art.js les étale à la fin de SQ_ART. Même forme que 'tambour-mochi'
   et boumbo : un corps, un visage, un détail derrière et devant. */

// la pointe d'un crayon (bois et mine), posée au-dessus d'un corps ovale
const SQ_PENCIL_TIP = `<path d="M34 30 L50 0 L66 30Z" fill="#F1D3A2" stroke="#7A4524" stroke-width="3.5" stroke-linejoin="round"/><path d="M44 11 L50 0 L56 11Z" fill="#4A4A4A"/>`;

/**
 * Les plis d'un dumpling, en éventail sur le dessus d'un corps rond.
 * @param {string} color la couleur du trait
 * @param {number} [dy] plus bas de `dy` (sous une toque)
 */
function sqDumplingFolds(color, dy = 0) {
  const y = (/** @type {number} */ v) => v + dy;
  return `<path class="sq-deco" d="M34 ${y(34)} Q40 ${y(24)} 46 ${y(33)} M44 ${y(30)} Q50 ${y(20)} 56 ${y(30)} M54 ${y(33)} Q60 ${y(24)} 66 ${y(34)}" fill="none" stroke="${color}" stroke-width="3.5" stroke-linecap="round"/>`;
}

/** @type {Record<string, import('./squishy-art.js').SqArt>} */
const SQ_ART_S3 = {
  // ✏️ Papeterie (l'Île des Crayons)
  'crayon-mochi': {
    body: 'ovale-v',
    face: {},
    faceY: 58,
    back: () => SQ_PENCIL_TIP,
    front: () =>
      `<path class="sq-deco" d="M24 82 Q50 98 76 82" fill="none" stroke="#FF9CC8" stroke-width="7" stroke-linecap="round"/>`,
  },
  'gomme-fraise': {
    body: 'carre',
    face: {},
    faceY: 64,
    back: () =>
      `<path d="M34 28 L40 10 L50 22 L60 10 L66 28Z" fill="#6ED38C" stroke="#2F9551" stroke-width="3" stroke-linejoin="round"/>`,
    front: () =>
      `<g class="sq-deco" fill="#FFF3A6"><ellipse cx="26" cy="44" rx="1.9" ry="2.8"/><ellipse cx="50" cy="38" rx="1.9" ry="2.8"/><ellipse cx="74" cy="44" rx="1.9" ry="2.8"/><ellipse cx="30" cy="84" rx="1.9" ry="2.8"/><ellipse cx="70" cy="84" rx="1.9" ry="2.8"/></g>`,
  },
  'taille-crayon': {
    body: 'carre',
    face: {},
    faceY: 58,
    back: () =>
      `<path d="M38 28 Q32 8 48 8 Q62 8 58 19 Q56 27 68 24" fill="none" stroke="#C99364" stroke-width="6" stroke-linecap="round"/>`,
    front: () =>
      `<circle class="sq-deco" cx="50" cy="82" r="6" fill="#2B2140" opacity=".65"/><rect class="sq-deco" x="22" y="78" width="16" height="6" rx="2" fill="#fff" opacity=".75"/>`,
  },
  'pot-de-peinture': {
    body: 'rond',
    face: {},
    faceY: 68,
    back: () =>
      `<path d="M64 30 L84 0" stroke="#C99364" stroke-width="7" stroke-linecap="round"/><path d="M58 38 L70 22" stroke="#BFA3EC" stroke-width="11" stroke-linecap="round"/>`,
    front: () =>
      `<path class="sq-deco" d="M17 40 Q50 18 83 40 Q80 52 74 43 Q68 56 60 42 Q52 50 44 42 Q36 58 29 43 Q22 50 17 40Z" fill="#fff" opacity=".7"/>`,
  },
  gribouille: {
    body: 'ovale-v',
    face: { wide: true },
    faceY: 56,
    back: () =>
      `${SQ_PENCIL_TIP}<path d="M22 66 Q6 64 8 48 M78 66 Q94 64 92 48" fill="none" stroke="#2B2140" stroke-width="4.5" stroke-linecap="round"/>`,
    front: () =>
      `<path class="sq-deco" d="M24 82 Q50 98 76 82" fill="none" stroke="#FF9CC8" stroke-width="7" stroke-linecap="round"/><path class="sq-deco" d="M26 76 Q50 91 74 76" fill="none" stroke="#DDE6EE" stroke-width="3.5" stroke-linecap="round"/>`,
  },
  'crayon-arc-en-ciel': {
    body: 'ovale-v',
    face: {},
    faceY: 52,
    back: () => SQ_PENCIL_TIP,
    front: () =>
      `<g class="sq-deco" fill="none" stroke-width="4.5" stroke-linecap="round" opacity=".9"><path d="M23 72 Q50 88 77 72" stroke="#FF8FB8"/><path d="M24 79 Q50 95 76 79" stroke="#FFD95A"/><path d="M27 86 Q50 100 73 86" stroke="#6FB8F5"/></g>`,
  },
  // 🥟 Dumplings (l'Île des Squishy Dumplings)
  'dumpling-rose': {
    body: 'rond',
    face: {},
    faceY: 64,
    front: (c) => sqDumplingFolds(c.edge),
  },
  'demi-lune': {
    body: 'ovale-h',
    face: { sleep: true },
    faceY: 70,
    front: (c) =>
      `<path class="sq-deco" d="M12 58 Q18 46 26 50 Q32 40 42 44 Q50 36 58 44 Q68 40 74 50 Q82 46 88 58" fill="none" stroke="${c.edge}" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>`,
  },
  'bao-violet': {
    body: 'rond',
    face: {},
    faceY: 64,
    front: (c) =>
      `${sqDumplingFolds(c.edge)}<circle class="sq-deco" cx="50" cy="24" r="5" fill="#FF6F91" stroke="#C9497F" stroke-width="1.5"/>`,
  },
  'panier-vapeur': {
    body: 'carre',
    face: {},
    faceY: 64,
    back: () =>
      `<path d="M78 20 Q72 14 78 9 Q84 4 79 0" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".9"/><path d="M18 30 Q50 2 82 30Z" fill="#EBCB98" stroke="#8A5A2B" stroke-width="3.5" stroke-linejoin="round"/>`,
    front: () =>
      `<path class="sq-deco" d="M15 42 H85 M15 86 H85" stroke="#fff" stroke-width="3.5" stroke-linecap="round" opacity=".65"/>`,
  },
  'chef-bao': {
    body: 'rond',
    face: { wide: true },
    faceY: 66,
    back: () =>
      `<path d="M30 30 Q18 6 38 8 Q44 -1 56 3 Q70 0 70 11 Q86 11 72 30Z" fill="#fff" stroke="#9AA7B4" stroke-width="3" stroke-linejoin="round"/>`,
    front: (c) =>
      `<rect class="sq-deco" x="31" y="22" width="40" height="9" rx="3.5" fill="#fff" stroke="#9AA7B4" stroke-width="2"/>${sqDumplingFolds(c.edge, 12)}`,
  },
  'dumpling-dore': {
    body: 'rond',
    face: {},
    faceY: 64,
    front: () =>
      `${sqDumplingFolds('#fff')}<path class="sq-deco" d="M18 36 l2 5 l5 2 l-5 2 l-2 5 l-2 -5 l-5 -2 l5 -2z M82 30 l1.6 4 l4 1.6 l-4 1.6 l-1.6 4 l-1.6 -4 l-4 -1.6 l4 -1.6z" fill="#FFF3A6"/>`,
  },
  // 🔐 Coffres (l'Île des Coffres)
  'coffre-mochi': {
    body: 'carre',
    face: {},
    faceY: 68,
    front: (c) =>
      `<path class="sq-deco" d="M14 46 Q50 34 86 46" fill="none" stroke="${c.edge}" stroke-width="3.5" stroke-linecap="round"/><rect class="sq-deco" x="43" y="38" width="14" height="14" rx="4" fill="#FFD95A" stroke="#B98500" stroke-width="2"/><circle class="sq-deco" cx="50" cy="45" r="2" fill="#B98500"/>`,
  },
  'cadenas-coeur': {
    body: 'ovale-v',
    face: {},
    faceY: 56,
    back: () =>
      `<path d="M36 28 V16 Q36 2 50 2 Q64 2 64 16 V28" fill="none" stroke="#9AA3AD" stroke-width="6" stroke-linecap="round"/>`,
    front: () =>
      `<path class="sq-deco" d="M50 88 q-9 -7 -9 -12 q0 -5 5 -5 q3 0 4 3 q1 -3 4 -3 q5 0 5 5 q0 5 -9 12z" fill="#fff" opacity=".9"/>`,
  },
  'cle-lune': {
    body: 'ovale-h',
    face: {},
    faceY: 70,
    back: () =>
      `<path d="M50 44 V6 M50 8 H64 M50 16 H60" fill="none" stroke="#B98500" stroke-width="6" stroke-linecap="round"/>`,
    front: () =>
      `<path class="sq-deco" d="M26 52 a9 9 0 1 0 9 11 a7 7 0 1 1 -9 -11z" fill="#FFF3A6" stroke="#B98500" stroke-width="1.5"/>`,
  },
  'piece-souriante': {
    body: 'rond',
    face: {},
    faceY: 64,
    front: () =>
      `<circle class="sq-deco" cx="50" cy="58" r="30" fill="none" stroke="#fff" stroke-width="3.5" opacity=".55"/><path class="sq-deco" d="M50 28 l2.4 6 l6 2.4 l-6 2.4 l-2.4 6 l-2.4 -6 l-6 -2.4 l6 -2.4z" fill="#fff" opacity=".85"/>`,
  },
  kadi: {
    body: 'carre',
    face: {},
    faceY: 56,
    back: () =>
      `<path d="M32 30 V18 Q32 2 50 2 Q68 2 68 18 V30" fill="none" stroke="#9AA3AD" stroke-width="7" stroke-linecap="round"/>`,
    front: () =>
      `<rect class="sq-deco" x="32" y="72" width="36" height="14" rx="5" fill="#fff" stroke="#2B2140" stroke-width="2"/><path class="sq-deco" d="M44 72 V86 M56 72 V86" stroke="#2B2140" stroke-width="1.5"/><path class="sq-deco" d="M38 75.5 v7 M47.5 76 h5 v3 h-5 v3 h5 M59.5 76 h5 v6 h-5 M60.5 79 h4" fill="none" stroke="#2B2140" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>`,
  },
  'coffre-etoiles': {
    body: 'carre',
    face: {},
    faceY: 70,
    back: () =>
      `<g fill="#FFF3A6" stroke="#E0A800" stroke-width="1.2"><path d="M26 14 l2 5 l5 2 l-5 2 l-2 5 l-2 -5 l-5 -2 l5 -2z"/><path d="M52 2 l2.4 6 l6 2.4 l-6 2.4 l-2.4 6 l-2.4 -6 l-6 -2.4 l6 -2.4z"/><path d="M78 14 l2 5 l5 2 l-5 2 l-2 5 l-2 -5 l-5 -2 l5 -2z"/></g>`,
    front: () =>
      `<path class="sq-deco" d="M15 46 Q15 26 37 24 H63 Q85 26 85 46Z" fill="#FFD95A" stroke="#B98500" stroke-width="3" stroke-linejoin="round"/><rect class="sq-deco" x="44" y="40" width="12" height="12" rx="3.5" fill="#fff" stroke="#B98500" stroke-width="2"/>`,
  },
};

export { SQ_ART_S3 };
