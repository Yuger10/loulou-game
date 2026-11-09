/* ---------- Manifeste des slices (architecture « feature slices », v51) ----------
   Source unique de vérité de l'organisation du code :
   - `layer` : la couche de la slice. De la plus haute à la plus basse :
       app > features > entities > shared
     Un fichier ne doit utiliser que des noms de sa couche ou des couches
     inférieures (vérifié par test/slices.test.js).
   - `files` / `css` : les fichiers de la slice, DANS L'ORDRE de chargement.
     index.html, sw.js et les tests chargent exactement cette liste, slice
     après slice, dans l'ordre du tableau.
   - `public` : l'API publique de la slice, c'est-à-dire les seuls noms que les
     autres slices ont le droit d'utiliser. `null` = pas encore déclarée (la
     règle n'est alors pas vérifiée pour cette slice).

   Ce fichier n'est pas chargé par le jeu : seuls les outils et les tests le
   lisent (`require`). */
const SLICES = [
  { id:'shared-lib',     layer:'shared',   files:['js/shared/lib/random.js'], css:[], public:[
      'pickRandom', 'shuffle'] },
  { id:'shared-styles',  layer:'shared',   files:[], css:['js/shared/styles/base.css','js/shared/styles/interface-v12.css','js/shared/styles/pointer-v13.css','js/shared/styles/responsive-v14.css','js/shared/styles/design-system-v21.css','js/shared/styles/devices.css'], public:[] },
  { id:'shared-ui',      layer:'shared',   files:['js/shared/ui/icons.js','js/shared/ui/sound.js','js/shared/ui/voice.js',
                                                'js/shared/ui/feedback.js','js/shared/ui/modal.js','js/shared/ui/views.js'], css:['js/shared/ui/views.css','js/shared/ui/modal.css','js/shared/ui/feedback.css','js/shared/ui/icons.css'], public:[
      'audioCtx', 'bindSpeakButtons', 'closeModal', 'confetti', 'emojiWord', 'onModalChange', 
      'onModalClose', 'onWrongFeedback', 'openModal', 'playSound', 'registerView', 
      'setAudioPrefsSource', 'shakeEl', 'showToast', 'soundModeLabel', 'speak', 'speechBubble', 
      'switchView', 'tone', 'uiIcon', 'vibrate', 'wrongFeedback'] },
  { id:'words',          layer:'entities', files:['js/entities/words/words.js'], css:[], public:[
      'WORDS_CP'] },
  { id:'item',           layer:'entities', files:['js/entities/item/items.js'], css:[], public:[
      'addItem', 'ALBUM_REWARD', 'ALL_ITEMS', 'countItem', 'CRAFTED', 'DECOS', 'decosOf', 'ITEMS', 
      'removeItem'] },
  { id:'world',          layer:'entities', files:['js/entities/world/worlds.js','js/entities/world/availability.js'], css:['js/entities/world/world-themes.css'], public:[
      'availableChars', 'availableCrafted', 'availableItems', 'currentWorld', 'nextLockedWorld', 
      'WORLD_ORDER', 'WORLDS', 'worldUnlocked'] },
  { id:'character',      layer:'entities', files:['js/entities/character/characters.js','js/entities/character/characters-art.js'],
                                           css:['js/entities/character/characters.css'], public:[
      'CHARACTERS', 'charFace', 'charsOf', 'charsOfForPlayer'] },
  { id:'difficulty',     layer:'entities', files:['js/entities/difficulty/difficulty.js','js/entities/difficulty/game-types.js',
                                                'js/entities/difficulty/age.js'], css:[], public:[
      'ageLabel', 'ageToDiff', 'CALC_MULT_TABLES', 'calcBounds', 'calendarUsesWeekdayOrder', 
      'calendarWeekdayCount', 'clockGranularity', 'clockOptions', 'compareCloseChance', 
      'compareEqualChance', 'compareRange', 'countRange', 'determinantsExtraDistractor', 
      'determinantsImageShown', 'determinantsPluralChance', 'diffMirrorChance', 'diffTotal', 
      'gameTypesForAge', 'jigsawRound', 'livesFor', 'mathBounds', 'memoryPairs', 'moneyDenoms', 
      'moneyPileSize', 'planetsTier', 'puzzleCount', 'puzzleStartMax', 'puzzleVariants', 
      'readingOptions', 'readingWordOnly', 'sequencePatternLength', 'shapesRound', 'simonLength', 
      'solidOptions', 'timerFor', 'volumeAskLessChance', 'volumeContainerCount', 
      'volumeUsesCapacityCompare'] },
  { id:'game-state',     layer:'entities', files:['js/entities/game-state/state.js'], css:[], public:[
      'freshState', 'gameCount', 'hello', 'level', 'levelProgress', 'load', 'MISSIONS_PER_LEVEL', 
      'resetState', 'save', 'state', 'trackGamePlayed'] },
  { id:'player',         layer:'entities', files:['js/entities/player/avatars.js','js/entities/player/profiles.js',
                                                'js/entities/player/party-state.js'], css:[], public:[
      'ac', 'addProfile', 'AVATARS', 'currentPlayer', 'currentPlayerAge', 'currentProfile', 
      'currentSaveKey', 'deleteProfile', 'fixAvatar', 'LEGACY_SAVE_KEY', 'loadProfiles', 
      'onProfileRefresh', 'party', 'partyCurrent', 'partyPlayers', 'playerGender', 'profiles', 
      'PROFILES_KEY', 'profileSaveKey', 'race', 'RACE_STEPS', 'raceCurrent', 'refreshAll', 
      'saveProfiles', 'switchProfile', 'syncProfileFromState'] },
  { id:'companion',      layer:'entities', files:['js/entities/companion/companions.js'], css:['js/entities/companion/companions.css'], public:[
      'avatarHTML', 'avatarText', 'bindCompanionSelector', 'buddyReact', 'buddySlot', 
      'COMPANION_ORDER', 'companionOf', 'COMPANIONS', 'companionSelector', 'companionsFor', 
      'companionSVG', 'currentCompanion', 'defaultCompanionFor', 'isArtAvatar', 'setCompanionDressing'] },
  { id:'party', layer:'features', files:['js/features/party/party.js','js/features/party/race.js'], css:['js/features/party/party.css','js/features/party/race.css'], public:[
      'partyAfterWin', 'partyScore', 'passTurn', 'renderRaceTrack', 'renderTurnBar', 'startParty', 
      'startRace', 'stopParty'] },
  { id:'profile', layer:'features', files:['js/features/profile/profile.js','js/features/profile/topbar.js'], css:['js/features/profile/welcome.css'], public:[
      'closeWelcome', 'openWelcome', 'renderProfile', 'renderSoundBtn'] },
  { id:'quests', layer:'features', files:['js/features/quests/quests.js'], css:['js/features/quests/quests.css'], public:[
      'ensureQuests', 'openQuestsModal', 'questProgress', 'renderQuests'] },
  { id:'wallet', layer:'features', files:['js/features/wallet/wallet.js'], css:[], public:[
      'addCoins', 'coinsInFlight', 'renderCoins'] },
  { id:'adaptive', layer:'features', files:['js/features/adaptive/game-diff.js','js/features/adaptive/adaptive.js'], css:['js/features/adaptive/adaptive.css'], public:[
      'adaptAfterMission', 'gameDiff', 'gameDiffIsland', 'pickPracticeGame', 'progressCheer'] },
  { id:'bag', layer:'features', files:['js/features/bag/bag.js'], css:['js/features/bag/bag.css'], public:[
      'checkAlbumComplete', 'markSeen', 'renderBadge', 'setSacTab'] },
  { id:'island', layer:'features', files:['js/features/island/island-view.js','js/features/island/island.js'], css:['js/features/island/island.css','js/features/island/island-view.css'], public:[
      'checkNewIsland', 'currentChar', 'ISLE_SCENERY', 'isleGenericScenery', 'markHelped', 
      'openDialogue', 'renderIslandCard', 'renderLagon', 'renderLevelPill', 'renderScene', 'setWorld'] },
  { id:'music', layer:'features', files:['js/features/music/music.js'], css:[], public:[
      'updateMusic'] },
  { id:'gains', layer:'features', files:['js/features/gains/gains.js'], css:['js/features/gains/gains.css'], public:[
      'flyEmoji', 'gainCenter', 'gainCoins', 'gainItems', 'gainLand', 'queueGain', 'spendCoins'] },
  { id:'map', layer:'features', files:['js/features/map/map.js'], css:['js/features/map/map.css'], public:[
      'renderMap'] },
  { id:'minigame-engine', layer:'features', files:['js/features/minigame-engine/engine.js','js/features/minigame-engine/hints.js'], css:['js/features/minigame-engine/engine.css','js/features/minigame-engine/deck-v13.css','js/features/minigame-engine/outcome-v14.css','js/features/minigame-engine/board-v21.css','js/features/minigame-engine/timer.css','js/features/minigame-engine/hints.css'], public:[
      'bindQuit', 'clearActiveTimer', 'flashModal', 'gameHeader', 'hintNudge', 'hintOrderStep', 
      'hintSyllablesFirst', 'hintSyllablesHTML', 'lastGame', 'livesBar', 'loseLife', 'missionFact', 
      'onMissionWin', 'playGame', 'progressDots', 'registerGame', 'registerHints', 'setHintQuestion', 
      'setSolution', 'setupLives', 'solSel', 'speakWrongHint', 'startMinigame', 'startTimerIfNeeded', 
      'stepOk'] },
  { id:'minigame-memory', layer:'features', files:['js/features/minigames/memory/memory.js'], css:[], public:[] },
  { id:'minigame-count', layer:'features', files:['js/features/minigames/count/count.js'], css:[], public:[] },
  { id:'minigame-intruder', layer:'features', files:['js/features/minigames/intruder/intruder.js'], css:[], public:[] },
  { id:'minigame-simon', layer:'features', files:['js/features/minigames/simon/simon.js'], css:['js/features/minigames/simon/simon.css'], public:[] },
  { id:'minigame-sequence', layer:'features', files:['js/features/minigames/sequence/sequence.js'], css:['js/features/minigames/sequence/sequence.css'], public:[] },
  { id:'minigame-puzzle', layer:'features', files:['js/features/minigames/puzzle/puzzle.js'], css:[], public:[] },
  { id:'minigame-math', layer:'features', files:['js/features/minigames/math/math.js'], css:['js/features/minigames/math/math.css'], public:[] },
  { id:'minigame-reading', layer:'features', files:['js/features/minigames/reading/reading.js'], css:['js/features/minigames/reading/reading.css'], public:[] },
  { id:'minigame-grammar', layer:'features', files:['js/features/minigames/grammar/grammar.js'], css:['js/features/minigames/grammar/grammar.css'], public:[] },
  { id:'minigame-volume', layer:'features', files:['js/features/minigames/volume/volume.js'], css:['js/features/minigames/volume/volume.css'], public:[] },
  { id:'minigame-compare', layer:'features', files:['js/features/minigames/compare/compare.js'], css:['js/features/minigames/compare/compare.css'], public:[] },
  { id:'minigame-money', layer:'features', files:['js/features/minigames/money/money.js'], css:['js/features/minigames/money/money.css'], public:[] },
  { id:'minigame-clock', layer:'features', files:['js/features/minigames/clock/clock.js'], css:['js/features/minigames/clock/clock.css'], public:[] },
  { id:'minigame-calendar', layer:'features', files:['js/features/minigames/calendar/calendar.js'], css:['js/features/minigames/calendar/calendar.css'], public:[] },
  { id:'minigame-calc', layer:'features', files:['js/features/minigames/calc/calc.js'], css:['js/features/minigames/calc/calc.css'], public:[] },
  { id:'minigame-shapes', layer:'features', files:['js/features/minigames/shapes/shapes.js'], css:['js/features/minigames/shapes/shapes.css'], public:[] },
  { id:'minigame-planets', layer:'features', files:['js/features/minigames/planets/planets.js'], css:['js/features/minigames/planets/planets.css'], public:[] },
  { id:'minigame-jigsaw', layer:'features', files:['js/features/minigames/jigsaw/jigsaw.js'], css:['js/features/minigames/jigsaw/jigsaw.css'], public:[] },
  { id:'story', layer:'features', files:['js/features/story/story.js','js/features/story/episodes.js'], css:['js/features/story/story.css','js/features/story/episodes.css'], public:[
      'maybeStoryEpisode', 'noteStoryMission', 'openStoryChapter', 'openStoryJournal', 'STORY', 
      'storyProgressHTML', 'storySolved'] },
  { id:'market', layer:'features', files:['js/features/market/market.js'], css:['js/features/market/market.css'], public:[] },
  { id:'gifts', layer:'features', files:['js/features/gifts/gifts.js'], css:['js/features/gifts/gifts.css'], public:[
      'favoritesOf', 'friendHearts', 'friendPoints', 'openGiftPicker'] },
  { id:'players', layer:'features', files:['js/features/players/profiles-ui.js'], css:[], public:[
      'GAME_LIST', 'genderSelector', 'openGamePicker', 'openPlayers', 'openPlayerSettings'] },
  { id:'backup', layer:'features', files:['js/features/backup/backup.js'], css:['js/features/backup/backup.css'], public:[
      'backupDue', 'initBackup', 'openBackup', 'renderBackupReminder', 'requestPersistentStorage'] },
  { id:'parents', layer:'features', files:['js/features/parents/parents.js'], css:['js/features/parents/parents.css'], public:[
      'missionErrors', 'missionProgress', 'noteAnswerError', 'openParents', 'pauseDue', 
      'recordMission', 'showPauseScreen', 'SKILL_ERR_TOLERANCE', 'skillStatus', 'startPlayTimeTracker'] },
  { id:'wardrobe', layer:'features', files:['js/features/wardrobe/wardrobe.js'], css:['js/features/wardrobe/wardrobe.css'], public:[
      'currentLook', 'lookTry', 'newlyUnlockedLookItems', 'renderLook', 'WARDROBE', 'wearLook'] },
  { id:'seasons', layer:'features', files:['js/features/seasons/seasons.js'], css:['js/features/seasons/seasons.css'], public:[
      'applySeason', 'currentSeason', 'FETES', 'initSeasons', 'maybeSeasonGift', 'seasonPreview', 
      'seasonSceneSVG', 'setSeasonPreview'] },
  { id:'app', layer:'app', files:['js/app/init.js'], css:[], public:[] },
];

// Ordre de chargement des feuilles de style : la cascade dépend de cet ordre.
// Les 48 premières reprennent, dans l'ordre exact, l'ancien styles.css découpé
// par slice (v51) : à la concaténation, le CSS est identique octet pour octet.
const CSS_ORDER = [
  'js/shared/styles/base.css',
  'js/features/island/island-view.css',
  'js/entities/world/world-themes.css',
  'js/features/map/map.css',
  'js/features/minigames/simon/simon.css',
  'js/features/minigames/sequence/sequence.css',
  'js/features/profile/welcome.css',
  'js/features/quests/quests.css',
  'js/features/bag/bag.css',
  'js/features/market/market.css',
  'js/shared/ui/views.css',
  'js/shared/ui/modal.css',
  'js/features/minigame-engine/engine.css',
  'js/shared/ui/feedback.css',
  'js/features/party/party.css',
  'js/features/party/race.css',
  'js/shared/styles/interface-v12.css',
  'js/shared/styles/pointer-v13.css',
  'js/features/minigame-engine/deck-v13.css',
  'js/features/minigame-engine/outcome-v14.css',
  'js/shared/styles/responsive-v14.css',
  'js/features/minigames/math/math.css',
  'js/features/minigames/reading/reading.css',
  'js/features/minigames/grammar/grammar.css',
  'js/features/minigames/volume/volume.css',
  'js/features/minigames/compare/compare.css',
  'js/features/minigames/money/money.css',
  'js/shared/styles/design-system-v21.css',
  'js/features/minigame-engine/board-v21.css',
  'js/features/minigame-engine/timer.css',
  'js/entities/companion/companions.css',
  'js/shared/styles/devices.css',
  'js/features/gains/gains.css',
  'js/features/minigames/clock/clock.css',
  'js/features/minigames/calendar/calendar.css',
  'js/features/story/story.css',
  'js/features/minigames/calc/calc.css',
  'js/features/minigames/shapes/shapes.css',
  'js/features/minigames/planets/planets.css',
  'js/features/backup/backup.css',
  'js/features/parents/parents.css',
  'js/features/adaptive/adaptive.css',
  'js/features/wardrobe/wardrobe.css',
  'js/shared/ui/icons.css',
  'js/features/seasons/seasons.css',
  'js/features/minigames/jigsaw/jigsaw.css',
  'js/features/gifts/gifts.css',
  'js/features/story/episodes.css',
  'js/features/minigame-engine/hints.css',
  'js/features/island/island.css',
  'js/entities/character/characters.css',
];

if(typeof module !== 'undefined') module.exports = { SLICES, CSS_ORDER };
