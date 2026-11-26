/* ---------- Les écrans que parcourt la garde de la voix ----------
   Lu par test/voix-partout.test.js (track voix-partout). Chaque scénario
   ouvre un écran du jeu ; la garde vérifie alors que tout texte visible a une
   voix (lu à l'ouverture, ou écoutable au doigt) et que les phrases dites
   toutes seules sont exactement celles de `auto`, dans l'ordre.

   Un nouvel écran (un `openModal(`, une vue, un mini-jeu) doit ajouter ici
   son scénario, avec sa clé dans `covers` :
     - `<chemin>#<fonction>` : la fonction nommée qui appelle `openModal(` ;
     - `view:<nom>` : une vue inscrite par `registerView` ;
     - `game:<key>` : un jeu de GAME_LIST.
   Sans quoi `bun run check` échoue : « Écran sans passage dans la garde de
   la voix ».

   open(ev, d, w) : `ev(code)` évalue du code dans la page du jeu, `d` est son
   document, `w` sa fenêtre. L'état de départ (joueuse Lina, 6 ans, 200
   missions, 500 pièces, vue Carte, fenêtre fermée) est remis avant chaque
   scénario par le test. */

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

const noop = '() => {}';

const SCENARIOS = [
  /* ---- avant le jeu ---- */
  {
    name: 'écran titre',
    covers: [],
    open: (ev) => ev('showSplash()'),
    close: (ev, d) => d.getElementById('splash').classList.remove('show', 'hiding'),
    auto: [],
  },
  {
    name: 'accueil',
    covers: [],
    open: (ev) => ev('openWelcome()'),
    close: (ev, d) => d.getElementById('welcome').classList.remove('show'),
    auto: [/^Bienvenue dans le lagon! Écris ton prénom, puis choisis ton avatar et ton compagnon\.$/],
  },

  /* ---- les vues ---- */
  {
    name: 'vue Carte',
    covers: ['view:carte'],
    open: (ev) => ev("switchView('carte')"),
    auto: [/^La carte$/],
  },
  {
    name: 'vue Île',
    covers: ['view:ile'],
    open: (ev) => ev("islandIntroSaid.clear(); switchView('ile')"),
    auto: [/^Touche un personnage pour l'aider$/],
  },
  {
    name: 'vue Île, arrivée sur une autre île',
    covers: ['view:ile'],
    open: (ev) => ev("islandIntroSaid.clear(); setWorld('foret'); switchView('ile')"),
    auto: [/^La Forêt! Les bois enchantés\.$/, /^La forêt enchantée t'attend$/],
  },
  {
    name: 'vue Sac vide',
    covers: ['view:sac'],
    open: (ev) => ev("state.inventory = {}; switchView('sac')"),
    auto: [/^Ton sac est vide\. Va aider un personnage pour gagner des objets!$/],
  },
  {
    name: 'vue Sac',
    covers: ['view:sac'],
    open: (ev) => ev("addItem(Object.keys(ITEMS)[0], 2); switchView('sac')"),
    auto: [/^Mon sac$/],
  },
  { name: 'vue Sac, album', covers: ['view:sac'], open: (ev) => ev("switchView('album')"), auto: [/^Mon sac$/] },
  {
    name: 'album complet',
    covers: ['js/features/bag/bag.js#checkAlbumComplete'],
    open: (ev) =>
      ev(
        'Object.keys(ALL_ITEMS).forEach((k) => markSeen(k)); state.decos = Object.keys(DECOS); state.albumDone = false; checkAlbumComplete()',
      ),
    auto: [/^Incroyable Lina! Tu as trouvé tous les objets du jeu/],
  },
  {
    name: 'vue Marché, vendre',
    covers: ['view:marche'],
    open: (ev) => ev("addItem(Object.keys(ITEMS)[0], 2); currentTab = 'vendre'; switchView('marche')"),
    auto: [/^Le marché$/],
  },
  {
    name: 'vue Marché, échanger (doubles de squishies)',
    covers: ['view:marche'],
    open: (ev) => ev("addItem(Object.keys(ITEMS)[0], 2); currentTab = 'echanger'; switchView('marche')"),
    auto: [/^Le marché$/],
  },
  {
    name: 'vue Marché, fusionner (il manque des objets)',
    covers: ['view:marche'],
    open: (ev) => ev("state.inventory = {}; currentTab = 'fusionner'; switchView('marche')"),
    auto: [/^Le marché$/],
  },
  {
    name: 'vue Marché, acheter (sans pièces, boîte de squishies)',
    covers: ['view:marche'],
    open: (ev) => ev("state.coins = 0; currentTab = 'acheter'; switchView('marche')"),
    auto: [/^Le marché$/],
  },
  { name: 'vue Réglages', covers: ['view:reglages'], open: (ev) => ev("switchView('reglages')"), auto: [/^Réglages$/] },

  /* ---- l'île ---- */
  {
    name: "dialogue d'un personnage",
    covers: ['js/features/island/island-view.js#openDialogue'],
    open: (ev) => ev('openDialogue("sirene")'),
    auto: [/./],
  },
  {
    name: 'offre du défi de Zap',
    covers: [],
    open: (ev) =>
      ev(
        "teamState().open = true; teamState().met = Object.assign(teamState().met || {}, { zap: true }); teamState().mates = ['zap']; teamDay().zap = {}; islandIntroSaid.add('lagon'); zapOfferSaid.clear(); switchView('ile')",
      ),
    auto: [/^Un défi bonus\? Un cran plus difficile, et la récompense est doublée!$/],
  },
  {
    name: 'magasin de décos (sans pièces)',
    covers: ['js/features/island/island-view.js#openDecoShop'],
    open: (ev) => ev('state.coins = 0; state.decos = []; openDecoShop()'),
    auto: [/^Tu as 0 pièces$/],
  },
  {
    name: 'nouvelle île',
    covers: ['js/features/island/island-view.js#openIslandUnlock'],
    open: (ev) => ev('openIslandUnlock("foret", "Lina")'),
    auto: [/^Nouvelle île débloquée, Lina!/],
  },
  {
    name: 'ouverture du Ciel des Rêves',
    covers: ['js/features/island/island-view.js#openSkyOpening'],
    open: (ev) => ev(`openSkyOpening(${noop})`),
    auto: [/un nouveau monde s'ouvre dans le ciel/i],
  },
  {
    name: 'offrir un objet',
    covers: ['js/features/gifts/gifts.js#openGiftPicker'],
    open: (ev) => ev('addItem(Object.keys(ITEMS)[0], 2); openGiftPicker("sirene")'),
    auto: [/./],
  },
  {
    name: 'merci pour le cadeau',
    covers: ['js/features/gifts/gifts.js#showGiftThanks'],
    open: (ev, d) => {
      ev('addItem(Object.keys(ITEMS)[0], 2); openGiftPicker("sirene")');
      d.querySelector('#modal-body [data-gift]').click();
    },
    auto: [/./, /./],
  },

  /* ---- choisir et jouer ---- */
  {
    name: "choix d'un jeu",
    covers: ['js/features/players/profiles-ui.js#openGamePicker'],
    open: (ev) => ev('openGamePicker("sirene")'),
    auto: [/^À quoi veux-tu jouer\?$/],
  },
  ...gameScenarios,
  {
    name: 'victoire',
    covers: ['js/features/minigame-engine/engine.js#onMissionWin'],
    open: (ev) => {
      startGame(ev, 'count', 1);
      ev('onMissionWin()');
    },
    auto: [/./, /./],
  },
  {
    name: 'échec',
    covers: ['js/features/minigame-engine/engine.js#onMissionFail'],
    open: (ev) => {
      startGame(ev, 'count', 1);
      ev('onMissionFail()');
    },
    auto: [/./, /./],
  },
  {
    name: 'indice',
    covers: [],
    open: (ev) => {
      startGame(ev, 'count', 1);
      ev('useHint()');
    },
    auto: [/./, /./],
  },

  /* ---- fenêtres à en-tête ---- */
  {
    name: 'missions du jour',
    covers: ['js/features/quests/quests.js#openQuestsModal'],
    open: (ev) => ev('openQuestsModal()'),
    auto: [/^Termine-les pour ouvrir le coffre$/],
  },
  {
    name: 'coffre du jour',
    covers: ['js/features/quests/quests.js#openChest'],
    open: (ev) => ev('ensureQuests().list.forEach((i) => (i.n = i.goal)); ensureQuests().claimed = false; openChest()'),
    auto: [/^Lina, bravo! Tu as fini toutes tes missions du jour/],
  },
  {
    name: 'équipe (bientôt)',
    covers: ['js/features/companion-team/team.js#teamWindowSoon', 'js/features/companion-team/team.js#openTeamWindow'],
    open: (ev) => ev('teamState().open = false; state.missions = 0; openTeamWindow()'),
    auto: [/te donne des indices/],
  },
  {
    name: 'équipe (pleine, un compagnon au repos)',
    covers: ['js/features/companion-team/team.js#openTeamWindow'],
    open: (ev) =>
      ev(
        `(() => { const t = teamState(); t.open = true; const ids = teamKnownIds().filter((id) => id !== teamPrincipal());
           t.met = {}; ids.forEach((id) => (t.met[id] = true)); t.mates = ids.slice(0, 2); openTeamWindow(); })()`,
      ),
    auto: [/^Ton compagnon principal et 2 équipiers t'accompagnent$/],
  },
  {
    name: "ouverture de l'équipe",
    covers: ['js/features/companion-team/team.js#openTeamOpening'],
    open: (ev) => ev('teamState().open = false; openTeamOpening()'),
    auto: [/Ton équipe s'agrandit!/],
  },
  {
    name: "rencontre d'un compagnon",
    covers: ['js/features/companion-team/team.js#openTeamEncounter'],
    open: (ev) => ev('openTeamEncounter(teamKnownIds().filter((id) => id !== teamPrincipal())[0])'),
    auto: [/Tu veux bien que je rejoigne ton équipe\?$/],
  },
  {
    name: 'chambre à squishies, collection',
    covers: ['js/features/squishies/squishy-room.js#openSquishyRoom'],
    open: (ev) => ev('addSquishyBox(null); openSquishyRoom("collection")'),
    auto: [/./],
  },
  {
    name: 'chambre à squishies, étagère',
    covers: ['js/features/squishies/squishy-room.js#openSquishyRoom'],
    open: (ev) => ev('openSquishyRoom("etagere")'),
    auto: [/./],
  },
  {
    name: 'chambre à squishies, ranger',
    covers: ['js/features/squishies/squishy-room.js#openSquishyRoom'],
    open: (ev) => ev('openSquishyRoom("ranger")'),
    auto: [/^Les boîtes de rangement\.$/, /^Il te faut au moins 6 squishies différents pour ranger\./],
  },
  {
    name: 'cadeau de saison',
    covers: ['js/features/seasons/seasons.js#maybeSeasonGift'],
    // le jour de son anniversaire (la vraie saison, pas un aperçu)
    open: (ev) =>
      ev(
        'currentProfile().birthday = seasonMMDD(new Date()); setSeasonPreview(null); state.seasonGifts = {}; maybeSeasonGift()',
      ),
    close: (ev) => ev('currentProfile().birthday = ""; setSeasonPreview("aucune")'),
    auto: [/^Joyeux anniversaire Lina!/],
  },

  /* ---- l'histoire ---- */
  {
    name: "histoire : récit d'un chapitre",
    covers: ['js/features/story/story.js#renderStoryIntro'],
    open: (ev) => ev('state.storySolved = {}; openStoryChapter("lagon")'),
    auto: [/./],
  },
  {
    name: 'histoire : énigme',
    covers: ['js/features/story/story.js#renderStoryRiddle'],
    open: (ev) => ev('state.storySolved = {}; renderStoryRiddle("lagon", 0)'),
    auto: [/./],
  },
  {
    name: 'histoire : énigme résolue',
    covers: ['js/features/story/story.js#storyWin'],
    open: (ev) => ev('state.storySolved = {}; storyWin("lagon")'),
    auto: [/Tu gagnes \d+ pièces/],
  },
  {
    name: 'histoire : prologue de la saison 2',
    covers: ['js/features/story/story.js#openSeasonPrologue'],
    open: (ev) => ev('openSeasonPrologue(2)'),
    auto: [/./],
  },
  {
    name: 'histoire : épisode',
    covers: ['js/features/story/episodes.js#openEpisode'],
    open: (ev) => ev('openEpisode("lagon", 0, { line: 0, fresh: false })'),
    auto: [/./],
  },
  {
    name: "histoire : dernier mot d'un épisode",
    covers: ['js/features/story/episodes.js#openEpisode'],
    open: (ev) => ev('openEpisode("lagon", 0, { line: EPISODES.lagon[0].lines.length - 1, fresh: true })'),
    auto: [/./],
  },
  {
    name: "journal de l'histoire (chapitres verrouillés)",
    covers: ['js/features/story/story.js#openStoryJournal'],
    open: (ev) => ev('state.missions = 0; openStoryJournal()'),
    auto: [/^Le grand voyage du Lagon Magique$/],
  },
  {
    name: 'grand final',
    covers: [
      'js/features/story/finale.js#finaleScene',
      'js/features/story/finale.js#finaleCompanion',
      'js/features/story/finale.js#finaleTreasure',
      'js/features/story/finale.js#finaleComplete',
    ],
    open: (ev) => ev('openSeasonFinale(null, { replay: true })'),
    auto: [/./],
  },
  {
    name: 'grand final : le compagnon',
    covers: ['js/features/story/finale.js#finaleCompanion'],
    open: (ev) => ev(`finaleCompanion({ i: 0, rewards: true, replay: false, end: ${noop} })`),
    auto: [/./],
  },
  {
    name: 'grand final : le trésor',
    covers: ['js/features/story/finale.js#finaleTreasure'],
    open: (ev) => ev(`finaleTreasure({ i: 0, rewards: true, replay: false, end: ${noop} })`),
    auto: [/./],
  },
  {
    name: 'grand final : la fin',
    covers: ['js/features/story/finale.js#finaleComplete'],
    open: (ev) => ev(`finaleComplete({ i: 0, rewards: true, replay: false, end: ${noop} })`),
    auto: [/./],
  },

  /* ---- la pause ---- */
  {
    name: 'pause : début',
    covers: [],
    open: (ev) =>
      ev(
        'currentProfile().pauseMin = 20; saveProfiles(); state.pauseExtra = null; state.restLog = {}; state.playTime = { [todayKey()]: 25 * 60 }; save(); maybeRest()',
      ),
    close: (ev) =>
      ev('currentProfile().pauseMin = 0; saveProfiles(); state.playTime = {}; state.restLog = {}; save(); restWake()'),
    auto: [/./],
  },
  {
    name: 'pause : une activité',
    covers: [],
    open: (ev, d) => {
      ev(
        'currentProfile().pauseMin = 20; saveProfiles(); state.pauseExtra = null; state.restLog = {}; state.playTime = { [todayKey()]: 25 * 60 }; save(); maybeRest()',
      );
      d.querySelector('[data-rest-act]').click();
    },
    close: (ev) =>
      ev('currentProfile().pauseMin = 0; saveProfiles(); state.playTime = {}; state.restLog = {}; save(); restWake()'),
    auto: [/./, /./],
  },
  {
    name: 'pause : « À demain ! » rouvert endormi',
    covers: [],
    open: (ev) =>
      ev(
        'currentProfile().pauseMin = 20; saveProfiles(); state.pauseExtra = null; state.restLog = {}; state.playTime = { [todayKey()]: 25 * 60 }; restLogToday().skipped = true; save(); maybeRest()',
      ),
    close: (ev) =>
      ev('currentProfile().pauseMin = 0; saveProfiles(); state.playTime = {}; state.restLog = {}; save(); restWake()'),
    auto: [/^L'île dort\. On revient demain\.$/],
  },

  /* ---- les adultes et les joueurs ---- */
  {
    name: 'porte des parents',
    covers: ['js/features/parents/parents.js#openParentGate'],
    open: (ev) => ev(`openParentGate(${noop}, ${noop}, ${noop})`),
    auto: [/^C'est pour les adultes\.$/],
  },
  {
    name: 'joueurs',
    covers: ['js/features/players/profiles-ui.js#render'],
    open: (ev) => ev('openPlayers()'),
    auto: [/./],
  },
  {
    name: 'nouveau joueur',
    covers: [],
    open: (ev) => ev('openNewPlayer()'),
    auto: [],
  },
  {
    name: "réglages d'un joueur",
    covers: [],
    open: (ev) => ev('openPlayerSettings(profiles.current)'),
    auto: [],
  },
  {
    name: 'tour de jeu à plusieurs',
    covers: [],
    open: (ev) => ev('showTurnOverlay(currentProfile())'),
    close: (ev, d) => d.getElementById('turn-overlay').classList.remove('show'),
    auto: [/^À toi de jouer Lina!$/],
  },
  {
    name: 'course gagnée',
    covers: ['js/features/party/race.js#raceWin'],
    open: (ev) => ev('raceWin(currentProfile())'),
    auto: [/^Bravo Lina! Tu gagnes la course/],
  },
];

const COVERS = [...new Set(SCENARIOS.flatMap((s) => s.covers))];

module.exports = { SCENARIOS, COVERS, CHOICE_GAMES, GAME_RENDERERS, startGame };
