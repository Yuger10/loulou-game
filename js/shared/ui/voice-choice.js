/* ---------- Le choix de la voix de l'appareil (Web Speech) ----------
   Fonction pure : js/shared/ui/voice.js lui passe les voix du navigateur. */

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

/** @param {SpeechSynthesisVoice} v */
function voiceScore(v) {
  let s = 0;
  const i = VOICE_PREFS.findIndex((p) => v.name.toLowerCase().startsWith(p.toLowerCase()));
  if (i >= 0) s += 1000 - i * 10;
  if (/premium|enhanced|natural|neural|amélior/i.test(v.name)) s += 200;
  if (/^fr-FR$/i.test(v.lang)) s += 50;
  if (VOICE_MALE.test(v.name)) s -= 500;
  if (/grandma|compact/i.test(v.name)) s -= 100;
  if (v.localService) s += 5;
  return s;
}

// La meilleure voix française de la liste, ou null s'il n'y en a aucune.
/**
 * @param {SpeechSynthesisVoice[]} voices
 * @returns {SpeechSynthesisVoice | null}
 */
function bestFrenchVoice(voices) {
  const french = voices.filter((v) => /^fr/i.test(v.lang));
  if (!french.length) return null;
  return french.sort((a, b) => voiceScore(b) - voiceScore(a))[0];
}

export { bestFrenchVoice };
