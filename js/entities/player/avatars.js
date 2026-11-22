/* ---------- Avatars proposés et corrections d'anciens avatars ---------- */
// « 👧‍🦱 » et « 👦‍🦱 » ne sont pas des emoji standard : beaucoup d'appareils
// les affichent en deux morceaux. On les remplace par leur équivalent standard.
/** @type {Record<string, string>} */
const AVATAR_FIX = { '👧‍🦱': '👩‍🦱', '👦‍🦱': '👨‍🦱' };

/** @param {string} av */
function fixAvatar(av) {
  return AVATAR_FIX[av] || av;
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
