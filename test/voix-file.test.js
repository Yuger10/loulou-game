// La file de parole (track voix-partout, phase 1, lignes 1 à 9 de la spec) :
// deux phrases qui se suivent ne se coupent plus, une nouvelle scène ou une
// demande de l'enfant coupe, la file ne grossit pas, rien n'est dit avant le
// premier geste, et seul js/shared/ui/voice.js touche à speechSynthesis.
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');
const page = require('./tools/page.js');

let failed = 0,
  passed = 0;
function check(name, cond, detail) {
  if (cond) {
    passed++;
    console.log('✅ ' + name);
  } else {
    failed++;
    console.log('❌ ' + name + (detail ? `\n     → ${detail}` : ''));
  }
}
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

// Faux speechSynthesis : une seule phrase à la fois, `speaking` tenu à jour,
// et la fin d'une phrase déclenchée par le test (synth.end()).
const synth = {
  speaking: false,
  pending: false,
  current: null,
  log: [],
  cancels: 0,
  getVoices: () => [],
  speak(u) {
    this.log.push(u.text);
    this.current = u;
    this.speaking = true;
    if (u.onstart) u.onstart();
  },
  // comme Chrome : la phrase coupée reçoit `error`
  cancel() {
    this.cancels++;
    const u = this.current;
    this.current = null;
    this.speaking = false;
    if (u && u.onerror) u.onerror();
  },
  end() {
    const u = this.current;
    this.current = null;
    this.speaking = false;
    if (u && u.onend) u.onend();
  },
};

const dom = new JSDOM(page.buildHtml(), {
  runScripts: 'dangerously',
  pretendToBeVisual: true,
  url: 'http://localhost/?saison=aucune',
  beforeParse(win) {
    win.SpeechSynthesisUtterance = function (text) {
      this.text = text;
    };
    win.speechSynthesis = synth;
  },
});
const w = dom.window,
  d = w.document;
const ev = (code) => w.eval(code);
const errs = [];
w.addEventListener('error', (e) => errs.push(e.message));

// repart d'une file vide et d'un journal vide
function reset() {
  ev('stopSpeech()');
  synth.log.length = 0;
  synth.cancels = 0;
}
const said = () => synth.log.join(' | ');

(async () => {
  await wait(200);
  const speak = (t, o) => ev('speak')(t, o);

  console.log('— Ligne 1 : une phrase attend la fin de la précédente');
  reset();
  speak('Un');
  speak('Deux');
  check('la seconde phrase ne coupe pas la première', said() === 'Un' && synth.cancels === 0, said());
  synth.end();
  check('elle est dite à la fin de la première', said() === 'Un | Deux', said());
  synth.end();
  check('la file est vide ensuite', said() === 'Un | Deux' && !synth.speaking, said());

  console.log('— Ligne 2 : une nouvelle scène coupe la phrase de la scène précédente');
  reset();
  speak('Ancienne scène');
  speak('En attente');
  ev('newVoiceScene()');
  check('newVoiceScene seul ne coupe rien', synth.cancels === 0 && synth.speaking);
  speak('Nouvelle scène');
  check(
    'le premier speak de la nouvelle scène coupe et parle tout de suite',
    said() === 'Ancienne scène | Nouvelle scène' && synth.cancels === 1,
    `${said()} (${synth.cancels} coupure(s))`,
  );
  synth.end();
  check("la file de l'ancienne scène est vidée", said() === 'Ancienne scène | Nouvelle scène', said());
  for (const [nom, code] of [
    ['openModal', "openModal('<p>x</p>')"],
    ['switchView', "switchView('carte', { silent: true })"],
    ['closeModal', 'closeModal()'],
    ['renderVeil (pause)', "renderVeil('asleep')"],
  ]) {
    reset();
    speak('Avant');
    ev(code);
    speak('Après');
    check(`${nom} ouvre une nouvelle scène`, said() === 'Avant | Après', said());
  }
  ev("document.getElementById('rest-veil') && (document.getElementById('rest-veil').hidden = true); closeModal()");

  // une phrase dite juste avant un changement d'écran est gardée (l'arrivée sur une île)
  reset();
  speak('Arrivée');
  ev('newVoiceScene(); keepSpeech("Arrivée")');
  speak('Intro');
  check(
    'keepSpeech : la phrase en cours passe dans la nouvelle scène',
    said() === 'Arrivée' && synth.cancels === 0,
    said(),
  );
  synth.end();
  check('la phrase suivante attend son tour', said() === 'Arrivée | Intro', said());
  reset();
  speak('La carte');
  speak('Arrivée');
  ev('newVoiceScene(); keepSpeech("Arrivée")');
  check(
    'keepSpeech : une phrase en attente passe devant celle de la scène quittée',
    said() === 'La carte | Arrivée' && synth.cancels === 1,
    `${said()} (${synth.cancels} coupure(s))`,
  );
  speak('Intro');
  synth.end();
  check('puis la suite, sans coupure de plus', said() === 'La carte | Arrivée | Intro' && synth.cancels === 1, said());

  console.log('— Ligne 3 : interrupt coupe et parle tout de suite');
  reset();
  speak('Un');
  speak('Deux');
  speak('Trois', { interrupt: true });
  check('la phrase en cours est coupée', synth.cancels === 1 && said() === 'Un | Trois', said());
  synth.end();
  check('la file est vidée', said() === 'Un | Trois', said());

  console.log('— Ligne 4 : pas de doublon pour une lecture automatique');
  reset();
  speak('Un');
  speak('Deux');
  speak('Deux');
  speak('Un');
  speak('Un ✨'); // même phrase une fois dite (toSpoken)
  synth.end();
  synth.end();
  synth.end();
  check('une phrase en cours ou en attente ne se répète pas', said() === 'Un | Deux', said());
  reset();
  speak('Un');
  speak('Un', { interrupt: true, demand: true });
  check("une demande redit la phrase, même si c'est la même", said() === 'Un | Un' && synth.cancels === 1, said());

  console.log('— Ligne 5 : 3 phrases en attente au plus');
  reset();
  ['Un', 'Deux', 'Trois', 'Quatre', 'Cinq'].forEach((t) => speak(t));
  for (let i = 0; i < 6; i++) synth.end();
  check('la plus ancienne en attente est retirée', said() === 'Un | Trois | Quatre | Cinq', said());

  // les choix écrits d'une question (surlignés) sont lus en entier, après la consigne
  reset();
  speak('Consigne');
  const els = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi'].map((t) => {
    const b = d.createElement('button');
    d.body.appendChild(b);
    speak(t, { el: b });
    return b;
  });
  for (let i = 0; i < 7; i++) synth.end();
  check(
    'les choix surlignés ne comptent pas dans la limite de 3',
    said() === 'Consigne | lundi | mardi | mercredi | jeudi | vendredi',
    said(),
  );
  els.forEach((b) => b.remove());

  console.log('— Ligne 6 : rien ne parle (ou fin perdue) : dit tout de suite');
  reset();
  speak('Un');
  synth.speaking = false; // la fin de « Un » n'est jamais arrivée
  synth.current = null;
  speak('Deux');
  check('la phrase est dite sans attendre', said() === 'Un | Deux', said());

  console.log('— Ligne 7 : stopSpeech');
  reset();
  speak('Un');
  speak('Deux');
  ev('stopSpeech()');
  check('la phrase en cours est coupée', synth.cancels === 1 && !synth.speaking);
  synth.end();
  check('la file est vidée', said() === 'Un', said());
  reset();
  speak('Un');
  speak('Deux');
  ev('closeModal()');
  synth.end();
  check('closeModal coupe la voix et vide la file', synth.cancels === 1 && said() === 'Un', said());
  // la voix coupée par le bouton son : musique + sons + voix → sons + voix → sons seuls
  reset();
  ev('state.sound = true; state.voice = true; state.music = false');
  speak('Un');
  speak('Deux');
  d.getElementById('sound-btn').click();
  synth.end();
  check('couper la voix au bouton son arrête la phrase et vide la file', synth.cancels >= 1 && said() === 'Un', said());
  ev('state.voice = true');
  const jsFiles = [];
  (function walk(dir) {
    for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, f.name);
      if (f.isDirectory()) walk(p);
      else if (f.name.endsWith('.js')) jsFiles.push(p);
    }
  })(path.join(page.root, 'js'));
  const direct = jsFiles
    .filter((f) => path.relative(page.root, f) !== path.join('js', 'shared', 'ui', 'voice.js'))
    .filter((f) => fs.readFileSync(f, 'utf8').includes('speechSynthesis'))
    .map((f) => path.relative(page.root, f));
  check('seul js/shared/ui/voice.js contient speechSynthesis', direct.length === 0, direct.join(', '));

  console.log('— Ligne 8 : rien avant le premier geste');
  reset();
  Object.defineProperty(w.navigator, 'userActivation', { value: { hasBeenActive: false }, configurable: true });
  speak('Trop tôt');
  check('sans geste, rien n’est dit', said() === '', said());
  w.navigator.userActivation.hasBeenActive = true;
  speak('Après le geste');
  check('la phrase refusée n’a pas été mise en file', said() === 'Après le geste', said());
  delete w.navigator.userActivation;
  reset();
  speak('Sans userActivation');
  check('sans navigator.userActivation, la file ne bloque pas', said() === 'Sans userActivation', said());

  console.log('— Ligne 9 : une fenêtre rouverte relit sa consigne');
  reset();
  const open = "openModal(gameHeader('Titre', 'Lis la consigne')); bindQuit()";
  ev(open);
  check('la consigne est lue à l’ouverture', said() === 'Lis la consigne', said());
  ev('closeModal()');
  ev(open);
  check('elle est relue à la réouverture', said() === 'Lis la consigne | Lis la consigne', said());
  ev('closeModal()');

  console.log('— Voix coupée, demande, surlignage');
  reset();
  ev('state.sound = true; state.voice = false');
  speak('Automatique');
  check('voix coupée : une lecture automatique se tait', said() === '', said());
  speak('À la demande', { interrupt: true, demand: true });
  check('voix coupée : une demande parle', said() === 'À la demande', said());
  reset();
  ev('state.sound = false');
  speak('À la demande', { interrupt: true, demand: true });
  check('silence : rien n’est dit, même à la demande', said() === '', said());
  ev('state.sound = true; state.voice = true');
  reset();
  const p1 = d.createElement('p'),
    p2 = d.createElement('p');
  d.body.append(p1, p2);
  speak('Un', { el: p1 });
  speak('Deux', { el: p2 });
  check('l’élément lu porte voix-lu', p1.classList.contains('voix-lu') && !p2.classList.contains('voix-lu'));
  synth.end();
  check('le surlignage suit la phrase', !p1.classList.contains('voix-lu') && p2.classList.contains('voix-lu'));
  ev('stopSpeech()');
  check('stopSpeech retire le surlignage', !p2.classList.contains('voix-lu'));

  console.log('— toSpoken sorti de voice.js');
  check('toSpoken est exporté par shared/lib', ev('toSpoken("3 ⭐ de étoiles ✨")') === "3 étoile d'étoiles");
  check(
    'js/shared/lib/spoken.js ne touche ni window ni document',
    !/\b(window|document)\b/.test(fs.readFileSync(path.join(page.root, 'js/shared/lib/spoken.js'), 'utf8')),
  );

  check('aucune erreur JS', errs.length === 0, errs.join(' | '));
  console.log(`\n${failed ? '❌' : '✅'} voix-file : ${passed} vérifications réussies, ${failed} en échec`);
  process.exit(failed ? 1 : 0);
})();
