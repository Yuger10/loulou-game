/* ---------- Les écrans que parcourt la garde de la voix (suite) ----------
   Lu par test/voix-ecrans.js (track voix-partout), qui dit comment écrire un
   scénario : les fenêtres à en-tête, l'histoire, la pause, les adultes et les
   joueurs. */

const noop = '() => {}';

const MORE_SCENARIOS = [
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

module.exports = { MORE_SCENARIOS };
