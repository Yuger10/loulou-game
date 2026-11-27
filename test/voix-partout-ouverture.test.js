// Une voix partout (track voix-partout), ce qui est lu à l'ouverture hors
// scénarios de la garde (lignes 19, 21 et 22 de la spec, table O) : l'écran
// titre, l'arrivée sur une île, le 🔈 de la victoire, de l'échec et de
// l'indice, et le 🔈 de chaque carte du choix d'un jeu.
const {
  check,
  section,
  wait,
  spoken,
  w,
  d,
  synth,
  ev,
  $,
  said,
  tap,
  resetScreen,
  start,
  finish,
} = require('./voix-outils.js');
const { startGame } = require('./voix-ecrans.js');

(async () => {
  await start();
  section("Lire à l'ouverture");
  await splashTests();
  await islandTests();
  await replayButtonTests();
  await gamePickerTests();
  await resetScreen();
  finish('voix-partout-ouverture');
})();

// l'écran titre : rien de dit tout seul, le titre se lit au toucher avec l'accueil du jour
async function splashTests() {
  await resetScreen();
  ev('showSplash()');
  await wait(15);
  const h1 = $('#splash h1');
  check('table O : écran titre, rien de dit tout seul', said() === '', said());
  check(
    'table O : joueur connu, le titre dit « Coucou Lina ! »',
    h1.dataset.say === 'Le Lagon Magique. Coucou Lina !',
    h1.dataset.say,
  );
  await tap(h1);
  check('toucher le titre le lit', said() === 'Le Lagon Magique. Coucou Lina!', said());
  ev('state.name = ""; showSplash()');
  check(
    'table O : joueur inconnu, « En route pour l’aventure ? »',
    h1.dataset.say === "Le Lagon Magique. En route pour l'aventure ?",
    h1.dataset.say,
  );
  ev('state.name = "Lina"; setSeasonPreview("noel"); showSplash()');
  check(
    'table O : jour de fête, l’accueil de la fête',
    h1.dataset.say === 'Le Lagon Magique. ' + ev('FETES.noel.greet("Lina")') && /Noël Lina/.test(h1.dataset.say),
    h1.dataset.say,
  );
  ev('setSeasonPreview("aucune"); state.skyIntroSeen = true; showSplash()');
  spoken.length = 0;
  $('#btn-splash-play').click();
  await wait(60);
  check(
    'après « Jouer », le bonjour n’est pas coupé par la carte',
    spoken[0] === "Coucou Lina! L'aventure t'attend." && !spoken.includes('La carte'),
    said(),
  );
}

// l'île : l'arrivée puis l'intro, une fois par île et par session
async function islandTests() {
  await resetScreen();
  ev("islandIntroSaid.clear(); switchView('ile')");
  ev("switchView('carte'); switchView('ile')");
  await wait(15);
  check(
    'table O : l’intro d’une île est dite une seule fois par session',
    spoken.filter((p) => p === "Touche un personnage pour l'aider").length === 1,
    said(),
  );
  await resetScreen();
  ev('stopSpeech()');
  w.speechSynthesis.speaking = true; // l'arrivée est en train d'être dite
  synth.cancels = 0;
  ev("islandIntroSaid.clear(); setWorld('foret'); switchView('ile')");
  check(
    'table O : l’intro attend la fin de l’arrivée, sans la couper',
    said() === 'La Forêt! Les bois enchantés.' && synth.cancels === 0,
    `${said()} (${synth.cancels} coupure(s))`,
  );
  w.speechSynthesis.speaking = false;
  ev('stopSpeech()');
}

// victoire, échec, indice : un 🔈 relit la phrase dite à l'ouverture (ligne 21)
async function replayButtonTests() {
  for (const [nom, code, box] of [
    ['victoire', 'onMissionWin()', '.win-box'],
    ['échec', 'onMissionFail()', '.fail-box'],
    ['indice', 'useHint()', '.hint-bubble'],
  ]) {
    await resetScreen();
    startGame(ev, 'count', 1);
    await wait(15);
    spoken.length = 0;
    ev(code);
    await wait(40);
    const phrase = spoken[spoken.length - 1];
    const btn = $(`#modal-body ${box} .btn-speak[data-say]`);
    check(`ligne 21 : ${nom}, un 🔈 dans la fenêtre`, !!btn && spoken.length === 1, said());
    spoken.length = 0;
    if (btn) await tap(btn);
    check(
      `ligne 21 : ${nom}, le 🔈 relit la phrase dite`,
      spoken.length === 1 && spoken[0] === phrase,
      `${said()} / ${phrase}`,
    );
  }
}

// choix d'un jeu : chaque carte et « Surprise » ont leur 🔈 à droite (ligne 22)
async function gamePickerTests() {
  await resetScreen();
  ev('openGamePicker("sirene")');
  await wait(15);
  const cards = [...d.querySelectorAll('#modal-body .game-choice')];
  check(
    'ligne 22 : chaque carte est dans un div.game-choice-wrap, suivie de son 🔈',
    cards.length === 3 &&
      cards.every(
        (c) =>
          c.parentElement.matches('div.game-choice-wrap') &&
          c.parentElement.firstElementChild === c &&
          c.nextElementSibling &&
          c.nextElementSibling.matches('.btn-speak[data-say]') &&
          c.parentElement.children.length === 2,
      ),
  );
  spoken.length = 0;
  const first = cards[0];
  await tap(first.nextElementSibling);
  check(
    'ligne 22 : le 🔈 dit le nom du jeu sans le lancer',
    said() === ev('toSpoken')(first.querySelector('.nm').textContent) && !!$('#modal-body .game-picker'),
    said(),
  );
  spoken.length = 0;
  await tap($('#modal-body .game-choice.surprise').nextElementSibling);
  check('ligne 22 : le 🔈 de « Surprise »', said() === 'Surprise' && !!$('#modal-body .game-picker'), said());
}
