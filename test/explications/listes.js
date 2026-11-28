// Les listes du garde des explications (ligne 17 de la spec erreurs-expliquees),
// lues par les suites test/explications*.test.js.

// les 30 jeux inscrits quand la track a été écrite : seuls eux peuvent être exemptés
const LEGACY_GAMES = [
  'memory',
  'count',
  'diff',
  'puzzle',
  'sequence',
  'simon',
  'math',
  'reading',
  'determinants',
  'volume',
  'compare',
  'money',
  'clock',
  'calendar',
  'calc',
  'shapes',
  'planets',
  'jigsaw',
  'nesting',
  'cubes',
  'packs',
  'shelf',
  'share',
  'recipe',
  'rhythm',
  'pitch',
  'lifecycle',
  'ladybugs',
  'potions',
  'mirror',
];
// jamais d'explication : une erreur est le jeu lui-même (mémoire), ou la suite est déjà rejouée (Simon)
const EXPLAIN_NEVER = ['memory', 'simon'];
// en attente : cette liste ne peut que diminuer (chaque suite retire ses jeux et baisse le maximum)
const EXPLAIN_EXEMPT = [
  'diff',
  'sequence',
  'reading',
  'determinants',
  'volume',
  'calendar',
  'shapes',
  'planets',
  'jigsaw',
  'nesting',
  'cubes',
  'shelf',
  'recipe',
  'rhythm',
  'pitch',
  'lifecycle',
  'potions',
  'mirror',
];
const EXPLAIN_EXEMPT_MAX = 18;
// couples jeu et palier qui n'ont qu'une question possible (ligne 5 sans objet) : aucun
const SINGLE_QUESTION = [];
// les jeux qui ont leurs explications, phase par phase
const EXPLAINED = ['count', 'compare', 'math', 'calc', 'clock', 'puzzle', 'money', 'packs', 'share', 'ladybugs'];
// le dernier palier d'un jeu, quand ce n'est pas 5
const MAX_TIER = { calc: 6 };
// chaque palier de chaque jeu expliqué
const tierPairs = () =>
  EXPLAINED.flatMap((key) => Array.from({ length: MAX_TIER[key] || 5 }, (_, i) => ({ key, tier: i + 1 })));

module.exports = {
  LEGACY_GAMES,
  EXPLAIN_NEVER,
  EXPLAIN_EXEMPT,
  EXPLAIN_EXEMPT_MAX,
  SINGLE_QUESTION,
  EXPLAINED,
  MAX_TIER,
  tierPairs,
};
