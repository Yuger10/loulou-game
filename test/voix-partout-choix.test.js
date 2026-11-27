// Une voix partout (track voix-partout), les choix écrits des mini-jeux
// (ligne 20 de la spec, table J) : à la première question d'une mission, la
// consigne puis chaque choix, dans l'ordre, surligné pendant sa lecture ; le
// 🔈 de la consigne les relit ; rhythm et simon disent leurs signaux de tour.
const {
  check,
  section,
  wait,
  spoken,
  d,
  synth,
  ev,
  $,
  said,
  tap,
  norm,
  resetScreen,
  start,
  finish,
} = require('./voix-outils.js');
const { CHOICE_GAMES, startGame } = require('./voix-ecrans.js');

const choicesOf = () => [...d.querySelectorAll('#modal-body [data-voix="choix"][data-say]')];
const lit = () => choicesOf().filter((c) => c.classList.contains('voix-lu'));
// la forme dite attendue de chaque choix (table J)
const FORMS = {
  clock: (c) => {
    const [h, , m] = c.textContent.trim().split(' ');
    return `${h} heure${h === '1' ? '' : 's'}${m ? ' ' + m : ''}`;
  },
  share: (c) => ({ '½': 'un demi', '⅓': 'un tiers', '¼': 'un quart' })[c.textContent.trim()],
  planets: (c) => (c.querySelector('.pl-name') || c).textContent.trim(),
};
// le texte affiché d'un choix, sans son dessin ni son symbole
const shownLabel = (c) => {
  const k = c.cloneNode(true);
  k.querySelectorAll('svg, b, [aria-hidden="true"]').forEach((x) => x.remove());
  return k.textContent.trim();
};
// les signaux de tour de rhythm et simon
const TURN = /^(Écoute…|Écoute encore…|Regarde encore…|À toi!|Lis le rythme, puis joue-le!|On recommence…)$/;

(async () => {
  await start();
  section('Les choix écrits des mini-jeux (ligne 20, table J)');
  for (const key of CHOICE_GAMES) await gameChoiceTests(key);
  await voiceOffHintTest();
  await afterHintTest();
  await calendarHintTest();
  await turnSignalTests();
  await resetScreen();
  finish('voix-partout-choix');
})();

// les variantes d'un jeu changent avec le palier et le hasard : on cherche une question à choix écrits
async function gameChoiceTests(key) {
  let seen = false;
  for (let n = 0; n < 24 && !seen; n++) seen = await tryQuestion(key, n % 2 ? 5 : 1);
  check(`${key} : une question à choix écrits a été trouvée`, seen);
}
async function tryQuestion(key, tier) {
  await resetScreen();
  ev('stopSpeech()');
  synth.manual = true;
  spoken.length = 0;
  startGame(ev, key, tier);
  const choices = choicesOf();
  if (!choices.length) {
    synth.manual = false;
    return false;
  }
  firstQuestionChecks(key, tier, choices);
  nextQuestionCheck(key);
  hintButtonCheck(key);
  nextMissionCheck(key);
  synth.manual = false;
  ev('stopSpeech()');
  return true;
}

// première question d'une mission : la consigne seule, puis chaque choix dans l'ordre
function firstQuestionChecks(key, tier, choices) {
  const hint = $('.puzzle-hint [data-say]').dataset.say;
  const says = choices.map((c) => c.dataset.say);
  const form = FORMS[key] || shownLabel;
  check(
    `${key} (palier ${tier}) : la forme dite de chaque choix`,
    choices.every((c) => norm(c.dataset.say) === norm(form(c))),
    says.join(' | '),
  );
  check(`${key} : la consigne d'abord, seule`, said() === ev('toSpoken')(hint) && lit().length === 0, said());
  let ordered = true;
  for (let i = 0; i < choices.length; i++) {
    synth.finish();
    ordered =
      ordered &&
      spoken.length === i + 2 &&
      spoken[i + 1] === ev('toSpoken')(says[i]) &&
      lit().length === 1 &&
      lit()[0] === choices[i];
  }
  check(`${key} : puis chaque choix, dans l'ordre, surligné pendant sa lecture`, ordered, said());
  synth.finish();
  check(`${key} : rien d'autre ensuite, plus de surlignage`, spoken.length === choices.length + 1 && !lit().length);
  if (key === 'clock')
    check(
      'clock : « 3 h 30 » se dit en heures',
      says.every((t) => /^\d+ heures?( \d+)?$/.test(t)),
      says.join(' | '),
    );
}

// question suivante (après une erreur : le moteur oublie la consigne et redessine)
function nextQuestionCheck(key) {
  spoken.length = 0;
  ev(`forgetSpokenHint(); gameRenderer(${JSON.stringify(key)})()`);
  for (let i = 0; i < 8; i++) synth.finish();
  check(
    `${key} : à la question suivante, la consigne sans les choix`,
    spoken.filter((t) => !TURN.test(t)).length === 1,
    said(),
  );
}

// le 🔈 de la consigne dit la consigne puis les choix
function hintButtonCheck(key) {
  const now = choicesOf();
  spoken.length = 0;
  $('.puzzle-hint .btn-speak').click();
  for (let i = 0; i < now.length + 2; i++) synth.finish();
  const expected = [$('.puzzle-hint [data-say]').dataset.say, ...now.map((c) => c.dataset.say)].map((t) =>
    ev('toSpoken')(t),
  );
  check(`${key} : le 🔈 de la consigne relit la consigne puis les choix`, said() === expected.join(' | '), said());
}

// une nouvelle mission relit les choix
function nextMissionCheck(key) {
  ev('closeModal()');
  spoken.length = 0;
  ev(`gameRenderer(${JSON.stringify(key)})()`);
  const again = choicesOf().length;
  for (let i = 0; i < again + 2; i++) synth.finish();
  check(
    `${key} : à la mission suivante, les choix sont relus`,
    spoken.filter((t) => !TURN.test(t)).length === again + 1,
    said(),
  );
}

// voix coupée : le 🔈 de la consigne dit quand même la consigne et les choix (demande)
async function voiceOffHintTest() {
  await resetScreen();
  startGame(ev, 'clock', 1); // l'horloge a toujours des choix écrits
  ev('state.voice = false');
  spoken.length = 0;
  $('.puzzle-hint .btn-speak').click();
  check(
    'voix coupée : le 🔈 de la consigne dit la consigne et les choix',
    spoken.length === choicesOf().length + 1,
    said(),
  );
  ev('state.voice = true');
}

// après un indice (qui rebranche les 🔈 pour sa bulle), le 🔈 de la consigne relit toujours les choix
async function afterHintTest() {
  await resetScreen();
  startGame(ev, 'clock', 1); // l'horloge a toujours des choix écrits
  const expected = () =>
    [$('.puzzle-hint [data-say]').dataset.say, ...choicesOf().map((c) => c.dataset.say)]
      .map((t) => ev('toSpoken')(t))
      .join(' | ');
  spoken.length = 0;
  $('.puzzle-hint .btn-speak').click();
  check('clock : avant un indice, le 🔈 de la consigne dit la consigne puis les choix', said() === expected(), said());
  const hintBtn = $('#modal-body .hint-btn');
  check('clock : le bouton d’indice est là', !!hintBtn);
  if (!hintBtn) return;
  await tap(hintBtn);
  check('clock : l’indice est affiché avec son 🔈', !!$('.hint-bubble .btn-speak'));
  spoken.length = 0;
  $('.puzzle-hint .btn-speak').click();
  check(
    'clock : après un indice, le 🔈 de la consigne dit encore la consigne puis les choix',
    said() === expected(),
    said(),
  );
  spoken.length = 0;
  $('.hint-bubble .btn-speak').click();
  check(
    'clock : le 🔈 de l’indice ne dit que l’indice',
    said() === ev('toSpoken')($('.hint-bubble .btn-speak').dataset.say),
    said(),
  );
}

// calendar : « lundi → jeudi » se dit « de lundi à jeudi »
async function calendarHintTest() {
  let week = null;
  for (let n = 0; n < 40 && !week; n++) {
    await resetScreen();
    startGame(ev, 'calendar', n % 2 ? 5 : 1);
    if ($('.weekday-btn')) week = spoken[0];
  }
  check(
    'calendar : la consigne dit « de lundi à jeudi », sans flèche',
    !!week && /, de \p{L}+ à \p{L}+$/u.test(week),
    week,
  );
}

// rhythm et simon : les signaux de tour sont dits à chaque changement d'état
async function turnSignalTests() {
  await resetScreen();
  startGame(ev, 'simon', 1);
  await wait(250);
  check('simon : « À toi ! » est dit quand c’est le tour de l’enfant', spoken.includes('À toi!'), said());
  await resetScreen();
  startGame(ev, 'rhythm', 1);
  await wait(400);
  check('rhythm : « À toi ! » est dit quand c’est le tour de l’enfant', spoken.includes('À toi!'), said());
}
