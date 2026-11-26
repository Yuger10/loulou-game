// La file de parole dans les écrans du jeu (track voix-partout, lignes 6 et 7
// de la spec) : ce qui coupe la voix. Les deux « Pas maintenant » (la pause,
// le dialogue d'un personnage) et la voix coupée dans les réglages arrêtent la
// phrase en cours et vident la file ; une fin de phrase perdue (connu sur iOS)
// ne laisse pas le surlignage `voix-lu` collé au texte.
// La file elle-même (lignes 1 à 9) : test/voix-file.test.js.
const {
  check,
  section,
  wait,
  spoken,
  synth,
  ev,
  $,
  said,
  tap,
  resetScreen,
  start,
  finish,
} = require('./voix-outils.js');

const spokenForm = (t) => ev('toSpoken')(t);
const OPEN_REST =
  'currentProfile().pauseMin = 20; saveProfiles(); state.pauseExtra = null; state.restLog = {}; state.playTime = { [todayKey()]: 25 * 60 }; save(); maybeRest()';
const CLOSE_REST =
  'currentProfile().pauseMin = 0; saveProfiles(); state.playTime = {}; state.restLog = {}; save(); restWake()';

// Une phrase « parle » (pas à pas) et une autre attend son tour.
function talkAndQueue() {
  ev('stopSpeech()');
  synth.manual = true;
  ev('speak')('Une phrase en cours', { interrupt: true });
  ev('speak')('Une phrase en attente');
  spoken.length = 0;
  synth.cancels = 0;
}
// laisse finir tout ce qui parle encore, puis revient au mode sans attente
async function drain() {
  for (let i = 0; i < 4; i++) {
    synth.finish();
    await wait(15);
  }
  synth.manual = false;
  ev('stopSpeech()');
}

(async () => {
  await start();
  await restSkipTests();
  await dialogueCloseTest();
  await settingsVoiceOffTest();
  await lostEndHighlightTest();
  await resetScreen();
  finish('voix-file-coupures');
})();

// « Pas maintenant » de la pause : la voix se tait, puis la pause dit sa phrase
async function restSkipTests() {
  section('Ligne 7 : « Pas maintenant » de la pause');
  await resetScreen();
  ev(OPEN_REST);
  await wait(15);
  talkAndQueue();
  $('#rest-skip').click();
  const bye = spokenForm("D'accord. Bonne nuit, à demain !");
  check(
    'la phrase en cours est coupée et la pause dit sa phrase tout de suite',
    synth.cancels >= 1 && spoken[0] === bye,
    `${synth.cancels} coupure(s) ; dit : ${said()}`,
  );
  await drain();
  check(
    'la file est vidée : la phrase en attente n’est jamais dite',
    !spoken.includes('Une phrase en attente'),
    said(),
  );
  ev(CLOSE_REST);

  // voix coupée : la phrase de la pause est muette, mais ce que l'enfant écoutait s'arrête
  await resetScreen();
  ev(OPEN_REST);
  await wait(15);
  ev('stopSpeech(); state.sound = true; state.voice = false');
  synth.manual = true;
  ev('speak')('Un texte écouté au doigt', { interrupt: true, demand: true });
  spoken.length = 0;
  synth.cancels = 0;
  $('#rest-skip').click();
  check(
    'voix coupée : la phrase écoutée s’arrête, et rien d’autre n’est dit',
    synth.cancels >= 1 && !synth.speaking && said() === '',
    `${synth.cancels} coupure(s), parle encore : ${synth.speaking} ; dit : ${said()}`,
  );
  await drain();
  ev(`state.voice = true; ${CLOSE_REST}`);
}

// « Pas maintenant » du dialogue d'un personnage : la réplique s'arrête
async function dialogueCloseTest() {
  section('Ligne 7 : « Pas maintenant » du dialogue');
  await resetScreen();
  ev('openDialogue("sirene")');
  await wait(15);
  talkAndQueue();
  check('le dialogue a son « Pas maintenant »', /Pas maintenant/.test($('#btn-close').textContent));
  $('#btn-close').click();
  check(
    'la phrase en cours est coupée et la fenêtre se ferme',
    synth.cancels >= 1 && !synth.speaking && !$('#overlay').classList.contains('show'),
    `${synth.cancels} coupure(s), parle encore : ${synth.speaking}`,
  );
  await drain();
  check(
    'la file est vidée : la phrase en attente n’est jamais dite',
    !spoken.includes('Une phrase en attente'),
    said(),
  );
}

// la voix coupée dans les réglages : la phrase en cours s'arrête
async function settingsVoiceOffTest() {
  section('Ligne 7 : la voix coupée dans les réglages');
  await resetScreen();
  ev("switchView('reglages')");
  await wait(15);
  talkAndQueue();
  $('#view-reglages [data-sound="voice"]').click();
  check(
    'couper la voix arrête la phrase en cours',
    ev('state.voice') === false && synth.cancels >= 1 && !synth.speaking,
    `voix : ${ev('state.voice')}, ${synth.cancels} coupure(s), parle encore : ${synth.speaking}`,
  );
  await drain();
  check('la file est vidée, et rien d’autre n’est dit', said() === '', said());
  ev('state.voice = true');
}

// une fin de phrase perdue : le surlignage du texte lu ne reste pas collé
async function lostEndHighlightTest() {
  section('Ligne 6 : après une fin perdue, le surlignage s’en va');
  await resetScreen();
  ev('openModal(\'<p id="vx-lu">Un texte à écouter</p>\')');
  synth.manual = true;
  const p = $('#vx-lu');
  await tap(p);
  check(
    'le texte touché est lu et surligné',
    said() === 'Un texte à écouter' && p.classList.contains('voix-lu'),
    said(),
  );
  // la fin de la phrase n'arrive jamais (événement `end` perdu)
  synth.speaking = false;
  synth.current = null;
  ev('speak')('Autre');
  check('la phrase suivante est dite tout de suite', said() === 'Un texte à écouter | Autre', said());
  check('le texte d’avant n’est plus surligné', !p.classList.contains('voix-lu'));
  synth.finish();
  check('ni après la fin de la phrase suivante', !p.classList.contains('voix-lu'));
  await drain();
}
