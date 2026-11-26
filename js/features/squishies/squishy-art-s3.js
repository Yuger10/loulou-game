/* Les dessins des squishies de la saison 3 « La Grande Expédition ».
   squishy-art.js les étale à la fin de SQ_ART. Même forme que 'tambour-mochi'
   et boumbo : un corps, un visage, un détail derrière et devant. */

// la pointe d'un crayon (bois et mine), posée au-dessus d'un corps ovale
const SQ_PENCIL_TIP = `<path d="M34 30 L50 0 L66 30Z" fill="#F1D3A2" stroke="#7A4524" stroke-width="3.5" stroke-linejoin="round"/><path d="M44 11 L50 0 L56 11Z" fill="#4A4A4A"/>`;

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
};

export { SQ_ART_S3 };
