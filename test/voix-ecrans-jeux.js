/* ---------- Les mini-jeux que parcourt la garde de la voix ----------
   Lu par test/voix-ecrans.js (track voix-partout). Un nouveau mini-jeu ajoute
   ici, dans `GAME_RENDERERS`, sa clé `game:<key>` et la clé
   `<chemin>#<fonction>` de chaque fonction qui appelle `openModal(`. */

const G = 'js/features/minigames/';
// le palier d'un jeu vient de l'île et du niveau propre au jeu (comme test/games.test.js)
const ISLAND_FOR_TIER = { 1: 'lagon', 2: 'foret', 3: 'montagne', 4: 'chateau', 5: 'jungle', 6: 'volcan' };
function startGame(ev, key, tier) {
  ev(`closeModal(); party.active = false; currentProfile().age = 0;
      state.missions = 200; currentWorld = ${JSON.stringify(ISLAND_FOR_TIER[tier])};
      state.skills = { ${key}: { wins:0, fails:0, errors:0, last:null, recent:[], lvl:${tier} } };
      playGame(${JSON.stringify(key)})`);
}

// les fonctions qui dessinent chaque jeu (clés `<chemin>#<fonction>`)
const GAME_RENDERERS = {
  memory: ['memory/memory.js#memoryDraw'],
  count: ['count/count.js#renderCount'],
  diff: ['intruder/intruder.js#renderDiff'],
  puzzle: ['puzzle/puzzle.js#renderPuzzle'],
  sequence: ['sequence/sequence.js#renderSequence'],
  simon: ['simon/simon.js#renderSimon'],
  math: ['math/math.js#renderMath'],
  reading: ['reading/reading.js#renderReading'],
  determinants: ['grammar/grammar.js#renderDeterminants'],
  volume: ['volume/volume.js#renderCapacityCompare', 'volume/volume.js#renderSolidShape'],
  compare: ['compare/compare.js#renderCompare'],
  money: ['money/money.js#renderMoney'],
  clock: ['clock/clock.js#renderClock'],
  calendar: ['calendar/calendar.js#renderSeasonGuess', 'calendar/calendar.js#renderWeekdayOrder'],
  calc: ['calc/calc.js#renderCalc'],
  shapes: ['shapes/shapes.js#renderShapes'],
  planets: ['planets/planets.js#renderPlanets', 'planets/planets.js#renderPlanetOrder'],
  jigsaw: ['jigsaw/jigsaw.js#renderJigsaw'],
  nesting: ['nesting/nesting.js#renderNesting'],
  cubes: ['cubes/cubes.js#renderCubes'],
  packs: ['packs/packs.js#renderPacks'],
  shelf: ['shelf/shelf.js#shelfAskPlace', 'shelf/shelf.js#shelfAskFind'],
  share: ['share/share.js#renderShare'],
  recipe: [
    'recipe/recipe.js#recipeAskCup',
    'recipe/recipe.js#recipeAskSpoons',
    'recipe/recipe.js#recipeAskBalance',
    'recipe/recipe.js#recipeAskBowls',
  ],
  rhythm: ['rhythm/rhythm.js#renderRhythm'],
  pitch: ['pitch/pitch.js#renderPitch'],
  lifecycle: ['lifecycle/lifecycle.js#lifecycleAskOrder', 'lifecycle/lifecycle.js#lifecycleAskStep'],
  ladybugs: ['ladybugs/ladybugs.js#ladybugsAskCount', 'ladybugs/ladybugs.js#ladybugsAskComplete'],
  potions: ['potions/potions.js#potionsAskColor', 'potions/potions.js#potionsAskRainbow'],
  mirror: ['mirror/mirror.js#renderMirror'],
};
// les jeux dont les choix écrits sont lus après la consigne (table J de la spec)
const CHOICE_GAMES = ['clock', 'planets', 'volume', 'calendar', 'pitch', 'rhythm', 'potions', 'lifecycle', 'share'];

// Un scénario de jeu n'a pas de `auto` : la garde attend la consigne, puis
// les choix écrits de la table J dans l'ordre d'affichage (ligne 20).
const gameScenarios = [];
for (const key of Object.keys(GAME_RENDERERS)) {
  // palier 1 pour tous ; palier 5 aussi : les variantes d'un jeu changent avec le palier
  for (const tier of [1, 5]) {
    gameScenarios.push({
      name: `jeu ${key}, palier ${tier}`,
      covers: [`game:${key}`, ...GAME_RENDERERS[key].map((k) => G + k)],
      open: (ev) => startGame(ev, key, tier),
    });
  }
}

module.exports = { CHOICE_GAMES, GAME_RENDERERS, gameScenarios, startGame };
