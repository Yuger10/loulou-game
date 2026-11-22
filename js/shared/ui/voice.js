/* ---------- Voix (Web Speech) ---------- */
import { audioPrefs, setVoiceDuck } from './sound.js';
import { setHandler } from './handlers.js';

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

// Choix d'une voix féminine française, la plus naturelle possible
const VOICE_PREFS = [
  'Audrey',
  'Aurélie',
  'Aurelie',
  'Google français',
  'Marie',
  'Amélie',
  'Amelie',
  'Virginie',
  'Hortense',
  'Julie',
  'Denise',
  'Vivienne',
  'Flo (Français (France))',
  'Sandy (Français (France))',
  'Shelley (Français (France))',
  'Flo',
  'Sandy',
  'Shelley',
];

const VOICE_MALE = /thomas|jacques|eddy|reed|rocko|grandpa|nicolas|paul|henri|daniel|claude|yannick/i;

/** @type {SpeechSynthesisVoice | null} */
let chosenVoice = null;

function pickVoice() {
  if (!('speechSynthesis' in window)) return null;
  const voices = window.speechSynthesis.getVoices().filter((v) => /^fr/i.test(v.lang));
  if (!voices.length) return null;
  /** @param {SpeechSynthesisVoice} v */
  const score = (v) => {
    let s = 0;
    const i = VOICE_PREFS.findIndex((p) => v.name.toLowerCase().startsWith(p.toLowerCase()));
    if (i >= 0) s += 1000 - i * 10;
    if (/premium|enhanced|natural|neural|amélior/i.test(v.name)) s += 200;
    if (/^fr-FR$/i.test(v.lang)) s += 50;
    if (VOICE_MALE.test(v.name)) s -= 500;
    if (/grandma|compact/i.test(v.name)) s -= 100;
    if (v.localService) s += 5;
    return s;
  };
  chosenVoice = voices.sort((a, b) => score(b) - score(a))[0];
  return chosenVoice;
}

// opts.rate : plus lent pour relire (Perle la conteuse, v52)
/**
 * @param {string} text
 * @param {{ rate?: number }} [opts]
 */
function speak(text, opts) {
  if (!audioPrefs().voice || !('speechSynthesis' in window)) return;
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(toSpoken(text));
    u.lang = 'fr-FR';
    u.rate = (opts && opts.rate) || 0.92;
    u.pitch = 1.0;
    const v = chosenVoice || pickVoice();
    if (v) u.voice = v;
    // tout le bus audio baisse pendant que la voix parle (js/shared/ui/sound.js)
    setHandler(u, 'start', () => setVoiceDuck(true));
    setHandler(u, 'end', () => setVoiceDuck(false));
    setHandler(u, 'error', () => setVoiceDuck(false));
    window.speechSynthesis.speak(u);
  } catch {
    // synthèse vocale absente ou en panne : le texte reste affiché à l'écran
  }
}

function bindSpeakButtons() {
  document.querySelectorAll('[data-say]').forEach((b) => {
    setHandler(b, 'click', (e) => {
      e.stopPropagation();
      speak(/** @type {string} */ (b.dataset.say)); // le sélecteur garantit data-say
    });
  });
}

/**
 * @param {string} text
 * @param {string} [extraStyle]
 */
function speechBubble(text, extraStyle = '') {
  return `<div class="speech with-voice" style="${extraStyle}">
    <span class="txt">${text}</span>
    <button class="btn-speak" data-say="${text.replace(/"/g, '&quot;').replace(/<[^>]+>/g, '')}" aria-label="Écouter">🔈</button>
  </div>`;
}

if ('speechSynthesis' in window) {
  pickVoice();
  setHandler(window.speechSynthesis, 'voiceschanged', pickVoice);
}

export { bindSpeakButtons, emojiWord, speak, speechBubble };
