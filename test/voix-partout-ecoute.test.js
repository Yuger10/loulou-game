// Une voix partout (track voix-partout), l'écoute au doigt
// (js/shared/ui/listen.js, lignes 10 à 18 de la spec) : toucher un texte le
// lit, un bouton agit puis dit son libellé, un bouton inactif dit pourquoi, un
// 🔈 fait écouter sans agir, un mot à lire ne se dit pas, et les messages qui
// passent parlent. Les raisons de la table R : test/voix-partout-raisons.test.js.
const { check, section, wait, spoken, w, ev, $, said, tap, resetScreen, start, finish } = require('./voix-outils.js');
const { startGame } = require('./voix-ecrans.js');

let acted = [];
w.voixActed = (x) => acted.push(x);
// une fenêtre d'essai : un exemple de chaque sorte d'élément
function fixture() {
  ev(`openModal(\`
      <h2 id="vx-h">Un titre</h2>
      <div class="speech" id="vx-bulle">Bonjour <b id="vx-gras">toi</b> ✨ <span aria-hidden="true">déco</span></div>
      <div id="vx-vide"><i id="vx-seul">Un mot seul</i></div>
      <button id="vx-b1">Un bouton</button>
      <button id="vx-b2">Je parle</button>
      <div id="vx-act">Carte active</div>
      <button id="vx-off" aria-disabled="true" data-say-why="Il te faut 3 pièces.">Acheter</button>
      <button id="vx-off2" aria-disabled="true">Fermé</button>
      <button class="btn-speak" id="vx-ecoute" data-say="Écoute bien" aria-label="Écouter">🔈</button>
      <button id="vx-carte" data-say="Bouger">🤸 <span>Bouger un peu</span></button>
      <p data-voix="lire" id="vx-mot">chat</p>
      <button data-voix="lire" id="vx-rep">chien</button>
      <button data-voix="lire" id="vx-elim" aria-disabled="true">lapin</button>
      <label data-voix="muet" id="vx-muet">Combien font 6 × 7 ?</label>
    \`)`);
  const set = ev('setHandler');
  set($('#vx-b1'), 'click', () => w.voixActed('b1'));
  set($('#vx-b2'), 'click', () => {
    w.voixActed('b2');
    ev('speak')("C'est fait !");
  });
  set($('#vx-act'), 'click', () => w.voixActed('act'));
  set($('#vx-off'), 'click', () => w.voixActed('off'));
  set($('#vx-carte'), 'click', () => w.voixActed('carte'));
  set($('#vx-rep'), 'click', () => w.voixActed('rep'));
  ev('bindSpeakButtons()');
  acted = [];
  spoken.length = 0;
}

(async () => {
  await start();
  section('Écouter au doigt');
  await textTests();
  await buttonTests();
  await inactiveAndSpeakButtonTests();
  await readingTests();
  await restCardTest();
  await gateTests();
  await voiceOffTests();
  await toastTests();
  await oneVoiceTest();
  await resetScreen();
  finish('voix-partout-ecoute');
})();

async function textTests() {
  fixture();
  await tap($('#vx-gras'));
  check('ligne 10 : toucher un texte lit son bloc', said() === 'Bonjour toi', said());
  check('ligne 10 : le bloc lu porte voix-lu', $('#vx-bulle').classList.contains('voix-lu'));
  spoken.length = 0;
  await tap($('#vx-h'));
  await tap($('#vx-seul'));
  check('ligne 10 : un titre, un texte hors bloc', said() === 'Un titre | Un mot seul', said());
  spoken.length = 0;
  await tap($('#vx-vide'));
  await tap($('#modal-body'));
  check('un toucher dans le vide ne lit pas tout l’écran', said() === '', said());
}

async function buttonTests() {
  fixture();
  await tap($('#vx-b1'));
  check('ligne 11 : un bouton agit, puis dit son libellé', acted.join() === 'b1' && said() === 'Un bouton', said());
  spoken.length = 0;
  await tap($('#vx-b2'));
  check('ligne 11 : si l’action parle, seule sa phrase est dite', said() === "C'est fait!", said());
  spoken.length = 0;
  acted = [];
  check('ligne 11 : setHandler marque data-act un élément non actif', $('#vx-act').hasAttribute('data-act'));
  await tap($('#vx-act'));
  check(
    'ligne 11 : un élément data-act agit et dit son libellé',
    acted.join() === 'act' && said() === 'Carte active',
    said(),
  );
}

async function inactiveAndSpeakButtonTests() {
  fixture();
  await tap($('#vx-off'));
  check('ligne 12 : le toucher arrive aux handlers d’un bouton inactif', acted.join() === 'off', acted.join());
  check('ligne 12 : il dit pourquoi (data-say-why)', said() === 'Il te faut 3 pièces.', said());
  spoken.length = 0;
  await tap($('#vx-off2'));
  check('ligne 12 : sans raison écrite, son libellé', said() === 'Fermé', said());

  fixture();
  await tap($('#vx-ecoute'));
  check('ligne 13 : un 🔈 dit son data-say, sans autre action', said() === 'Écoute bien' && !acted.length, said());
  spoken.length = 0;
  await tap($('#vx-carte'));
  check(
    'ligne 14 : un élément qui agit garde son action, data-say est son libellé',
    acted.join() === 'carte' && said() === 'Bouger',
    `${acted.join()} / ${said()}`,
  );
}

async function readingTests() {
  fixture();
  await tap($('#vx-rep'));
  check('ligne 15 : une réponse à lire agit sans être dite', acted.join() === 'rep' && said() === '', said());
  await tap($('#vx-mot'));
  check('ligne 15 : un mot à lire touché : « Essaie de le lire ! »', said() === 'Essaie de le lire!', said());
  spoken.length = 0;
  await tap($('#vx-elim'));
  check('un mot à lire inactif reste muet (ligne 15 sur ligne 12)', said() === '', said());
  await tap($('#vx-muet'));
  check('data-voix="muet" n’est jamais dit, même touché', said() === '', said());
}

// la pause : ses cartes agissent encore après un bindSpeakButtons (ligne 14)
async function restCardTest() {
  ev(
    'currentProfile().pauseMin = 20; saveProfiles(); state.pauseExtra = null; state.restLog = {}; state.playTime = { [todayKey()]: 25 * 60 }; save(); maybeRest()',
  );
  ev('bindSpeakButtons()');
  const card = $('#rest-veil [data-rest-act]');
  await tap(card);
  check(
    'ligne 14 : une carte de la pause lance son activité',
    $('#rest-veil').dataset.stage !== 'choose',
    $('#rest-veil').dataset.stage,
  );
  ev('currentProfile().pauseMin = 0; saveProfiles(); state.playTime = {}; state.restLog = {}; save(); restWake()');
}

// la porte des parents (ligne 16)
async function gateTests() {
  await resetScreen();
  ev('openParentGate(() => {}, () => {}, () => {})');
  await wait(15);
  check('ligne 16 : la porte dit seulement « C’est pour les adultes. »', said() === "C'est pour les adultes.", said());
  spoken.length = 0;
  await tap($('#modal-body .game-head h2'));
  await tap($('#modal-body .hint-txt'));
  check(
    'ligne 16 : son titre et sa consigne se lisent au toucher',
    said() === 'Pour les adultes | Répondez à cette question pour continuer',
    said(),
  );
  spoken.length = 0;
  await tap($('#modal-body .gate-q'));
  await tap($('#gate-in'));
  check('ligne 16 : la question de calcul n’est jamais dite', said() === '', said());
  check('ligne 16 : elle porte data-voix="muet"', $('.gate-q').dataset.voix === 'muet');
}

// voix coupée et silence (ligne 17)
async function voiceOffTests() {
  fixture();
  ev('state.sound = true; state.voice = false');
  await tap($('#vx-h'));
  await tap($('#vx-ecoute'));
  await tap($('#vx-off'));
  check(
    'ligne 17 : voix coupée, un texte, un 🔈 et un bouton inactif parlent',
    said() === 'Un titre | Écoute bien | Il te faut 3 pièces.',
    said(),
  );
  spoken.length = 0;
  await tap($('#vx-b1'));
  ev('speak')('Automatique');
  check(
    'ligne 17 : voix coupée, le libellé d’un bouton et les lectures automatiques se taisent',
    said() === '',
    said(),
  );
  ev('state.sound = false');
  await tap($('#vx-h'));
  await tap($('#vx-ecoute'));
  await tap($('#vx-off'));
  check('ligne 17 : en silence, rien n’est dit', said() === '', said());
  ev('state.sound = true; state.voice = true');
}

// les messages qui passent (ligne 18)
async function toastTests() {
  await resetScreen();
  ev('showToast')('✅ Bien joué');
  check(
    'ligne 18 : un message qui passe est dit',
    said() === 'Bien joué' && $('#toast').textContent === '✅ Bien joué',
    said(),
  );
  spoken.length = 0;
  ev('showToast')('⚠️ Affiché', 'Dit autrement');
  check(
    'ligne 18 : sa forme dite, si elle est donnée',
    said() === 'Dit autrement' && $('#toast').textContent === '⚠️ Affiché',
  );
  spoken.length = 0;
  ev('showToast')('Muet', '');
  check('ligne 18 : un message muet', said() === '' && $('#toast').textContent === 'Muet', said());
  startGame(ev, 'count', 1);
  await wait(15);
  spoken.length = 0;
  ev('lives = 2; loseLife(null)');
  await wait(15);
  check(
    'ligne 18 : « Dernier essai ! » se dit « Plus qu’un essai. Prends ton temps. »',
    $('#toast').textContent === '⚠️ Dernier essai !' && spoken.includes("Plus qu'un essai. Prends ton temps."),
    `${$('#toast').textContent} / ${said()}`,
  );
}

// une seule voix par événement : vendre dit sa phrase, pas le message en plus
async function oneVoiceTest() {
  await resetScreen();
  ev("state.inventory = {}; addItem(Object.keys(ITEMS)[0], 1); switchView('marche')");
  $('.tab-btn[data-tab="vendre"]').click();
  await wait(15);
  spoken.length = 0;
  await tap($('[data-sell]'));
  check(
    'ligne 18 : une seule voix par événement (vendre)',
    spoken.length === 1 && spoken[0].startsWith('Vendu'),
    said(),
  );
}
