/* Les squishies de la saison 3 « La Grande Expédition ». Chaque île y ajoute
   les 6 modèles de sa série ; squishies.js les étale à la fin de SQUISHIES. */

/** @type {Record<string, import('./squishies.js').Squishy>} */
const SQUISHIES_S3 = {
  // ✏️ Papeterie (saison 3, l'Île des Crayons)
  'crayon-mochi': {
    series: 'papeterie',
    name: 'Crayon mochi',
    say: 'un crayon mochi',
    rarity: 'commun',
    color: 'jaune',
    shape: 'ovale',
    size: 'grand',
  },
  'gomme-fraise': {
    series: 'papeterie',
    name: 'Gomme fraise',
    say: 'une gomme fraise',
    rarity: 'commun',
    color: 'rose',
    shape: 'carre',
    size: 'petit',
  },
  'taille-crayon': {
    series: 'papeterie',
    name: 'Taille-crayon',
    say: 'un taille-crayon',
    rarity: 'commun',
    color: 'bleu',
    shape: 'carre',
    size: 'petit',
  },
  'pot-de-peinture': {
    series: 'papeterie',
    name: 'Pot de peinture',
    say: 'un pot de peinture',
    rarity: 'commun',
    color: 'vert',
    shape: 'rond',
    size: 'grand',
  },
  // le rare porte l'id de son personnage, comme Boumbo (tables différentes)
  gribouille: {
    series: 'papeterie',
    name: 'Gribouille',
    say: 'Gribouille, le crayon à papier',
    rarity: 'rare',
    color: 'orange',
    shape: 'ovale',
    size: 'grand',
  },
  'crayon-arc-en-ciel': {
    series: 'papeterie',
    name: 'Crayon arc-en-ciel',
    say: 'un crayon arc-en-ciel',
    rarity: 'brille',
    color: 'violet',
    shape: 'ovale',
    size: 'grand',
  },
  // 🥟 Dumplings (saison 3, l'Île des Squishy Dumplings)
  'dumpling-rose': {
    series: 'dumplings',
    name: 'Dumpling rose',
    say: 'un dumpling rose',
    rarity: 'commun',
    color: 'rose',
    shape: 'rond',
    size: 'petit',
  },
  'demi-lune': {
    series: 'dumplings',
    name: 'Demi-lune',
    say: 'un dumpling en demi-lune',
    rarity: 'commun',
    color: 'vert',
    shape: 'ovale',
    size: 'petit',
  },
  'bao-violet': {
    series: 'dumplings',
    name: 'Bao violet',
    say: 'un bao violet',
    rarity: 'commun',
    color: 'violet',
    shape: 'rond',
    size: 'grand',
  },
  'panier-vapeur': {
    series: 'dumplings',
    name: 'Panier vapeur',
    say: 'un panier vapeur',
    rarity: 'commun',
    color: 'orange',
    shape: 'carre',
    size: 'grand',
  },
  'chef-bao': {
    series: 'dumplings',
    name: 'Chef Bao',
    say: 'Bao, le chef dumpling',
    rarity: 'rare',
    color: 'bleu',
    shape: 'rond',
    size: 'grand',
  },
  'dumpling-dore': {
    series: 'dumplings',
    name: 'Dumpling doré',
    say: 'un dumpling doré',
    rarity: 'brille',
    color: 'jaune',
    shape: 'rond',
    size: 'grand',
  },
};

export { SQUISHIES_S3 };
