/* ---------- Avatars proposés et corrections d'anciens avatars ---------- */
// « 👧‍🦱 » et « 👦‍🦱 » ne sont pas des emoji standard : beaucoup d'appareils
// les affichent en deux morceaux. On les remplace par leur équivalent standard.
const AVATAR_FIX = { '👧‍🦱':'👩‍🦱', '👦‍🦱':'👨‍🦱' };

function fixAvatar(av){ return AVATAR_FIX[av] || av; }

const AVATARS = [
  '👧','👦','🧒','👩‍🦰','👨‍🦰','👩‍🦱','👨‍🦱',
  'art:zap','art:perle','art:rose','art:lili','art:tom','art:leo','art:sam','🦸‍♀️','🦸‍♂️','🧚‍♀️','🧙‍♂️','👸','🤴','🧜‍♀️','🧜‍♂️',
  '🏴‍☠️','🥷','🤖','🚀','🐉','🦖','🦁','🐱','🦄','⚽',
];

export { AVATARS, fixAvatar };
