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
   scénario par le test.

   Les mini-jeux sont dans test/voix-ecrans-jeux.js ; les fenêtres à en-tête,
   l'histoire, la pause et les adultes dans test/voix-ecrans-suite.js. */

const { CHOICE_GAMES, GAME_RENDERERS, gameScenarios, startGame } = require('./voix-ecrans-jeux.js');
const { MORE_SCENARIOS } = require('./voix-ecrans-suite.js');

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
  ...MORE_SCENARIOS,
];

const COVERS = [...new Set(SCENARIOS.flatMap((s) => s.covers))];

module.exports = { SCENARIOS, COVERS, CHOICE_GAMES, GAME_RENDERERS, startGame };
