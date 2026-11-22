/* ---------- Avatars proposés et corrections d'anciens avatars ---------- */
// « 👧‍🦱 » et « 👦‍🦱 » ne sont pas des emoji standard : beaucoup d'appareils
// les affichent en deux morceaux. On les remplace par leur équivalent standard.
/** @type {Record<string, string>} */
const AVATAR_FIX = { '👧‍🦱': '👩‍🦱', '👦‍🦱': '👨‍🦱' };

/**
 * Porte d'entrée de tout avatar chargé ou importé (entrée non fiable : il
 * s'insère ensuite tel quel dans le HTML). Garde un avatar proposé, ou un emoji
 * d'une ancienne version (que des caractères hors ASCII, court) ; tout le reste
 * (texte, HTML, dessin inconnu) redevient 👧. Un avatar absent reste absent.
 * @template {string | undefined} T
 * @param {T} av
 * @returns {T}
 */
function fixAvatar(av) {
  if (!av) return av;
  const fixed = AVATAR_FIX[av] || av;
  if (AVATARS.includes(fixed)) return /** @type {T} */ (fixed);
  const emoji =
    typeof fixed === 'string' && fixed.length <= 16 && [...fixed].every((c) => Number(c.codePointAt(0)) > 127);
  return /** @type {T} */ (emoji ? fixed : AVATARS[0]);
}

const AVATARS = [
  '👧',
  '👦',
  '🧒',
  '👩‍🦰',
  '👨‍🦰',
  '👩‍🦱',
  '👨‍🦱',
  'art:zap',
  'art:perle',
  'art:rose',
  'art:lili',
  'art:tom',
  'art:leo',
  'art:sam',
  '🦸‍♀️',
  '🦸‍♂️',
  '🧚‍♀️',
  '🧙‍♂️',
  '👸',
  '🤴',
  '🧜‍♀️',
  '🧜‍♂️',
  '🏴‍☠️',
  '🥷',
  '🤖',
  '🚀',
  '🐉',
  '🦖',
  '🦁',
  '🐱',
  '🦄',
  '⚽',
];

export { AVATARS, fixAvatar };
