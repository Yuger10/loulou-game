/* ---------- La forme dite d'un texte ----------
   Fonction pure, sans DOM : la voix (js/shared/ui/voice.js), l'écoute au
   doigt (js/shared/ui/listen.js) et les outils hors navigateur (garde de la
   voix, clips enregistrés) disent tous la même phrase pour un même texte. */
// Mots prononcés pour chaque emoji (singulier, pluriel)
/** @type {Record<string, [string, string]>} */
const EMOJI_WORDS = {
  '🐚': ['coquillage', 'coquillages'],
  '🦪': ['perle', 'perles'],
  '🎀': ['ruban', 'rubans'],
  '🌸': ['fleur', 'fleurs'],
  '⭐': ['étoile', 'étoiles'],
  '🌟': ['étoile qui brille', 'étoiles qui brillent'],
  '💎': ['gemme', 'gemmes'],
  '🐠': ['poisson', 'poissons'],
  '🐟': ['petit poisson', 'petits poissons'],
  '🦋': ['papillon', 'papillons'],
  '🐝': ['abeille', 'abeilles'],
  '🐌': ['escargot', 'escargots'],
  '🌺': ['hibiscus', 'hibiscus'],
  '🎁': ['cadeau', 'cadeaux'],
  '🍓': ['fraise', 'fraises'],
  '🌙': ['lune', 'lunes'],
  '🦄': ['licorne', 'licornes'],
  '🧜‍♀️': ['sirène', 'sirènes'],
  '📿': ['collier', 'colliers'],
  '💐': ['bouquet', 'bouquets'],
  '👑': ['couronne', 'couronnes'],
  '🪄': ['baguette magique', 'baguettes magiques'],
  '🏆': ['trésor', 'trésors'],
  '🪙': ['', ''],
  '🎮': ['', ''],
  '✨': ['', ''],
  '🎉': ['', ''],
  '🔊': ['', ''],
  '🔈': ['', ''],
};

/**
 * @param {string} emoji
 * @param {boolean} [plural]
 */
function emojiWord(emoji, plural = false) {
  const w = EMOJI_WORDS[emoji];
  return w ? w[plural ? 1 : 0] : '';
}

// "de étoiles" → "d'étoiles"
/** @param {string} s */
function elide(s) {
  return s.replace(/\b(de|que|le|la|ne|se|je|me|te) (?=[aéèêàeiouôûh])/gi, (m, /** @type {string} */ a) => a[0] + "'");
}

/** @param {string} text */
function toSpoken(text) {
  // remplace chaque emoji connu par son mot, puis enlève le reste
  let s = text.replace(/<[^>]+>/g, '');
  const keys = Object.keys(EMOJI_WORDS).sort((a, b) => b.length - a.length);
  for (const k of keys) {
    s = s.split(k).join(' ' + emojiWord(k) + ' ');
  }
  s = s.replace(/[\p{Extended_Pictographic}\u{FE0F}\u{200D}]/gu, '');
  s = s
    .replace(/\s+/g, ' ')
    .replace(/\s+([?!,.:])/g, '$1')
    .trim();
  return elide(s);
}

export { EMOJI_WORDS, emojiWord, toSpoken };
