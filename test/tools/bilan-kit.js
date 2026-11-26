// Outils communs aux suites du bilan de la semaine (test/bilan*.test.js) :
// le jeu lancé dans JSDOM, des suivis de jeu construits à la main, la carte
// montée dans la page et lue comme le parent la voit. Les suites sont
// découpées en fichiers et en fonctions par section pour rester lisibles
// (garde de complexité de la CI).
const { JSDOM } = require('jsdom');
const page = require('./page.js');

const html = page.buildHtml();
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
function section(name) {
  console.log('— ' + name);
}
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

function boot(saved) {
  const dom = new JSDOM(html, {
    runScripts: 'dangerously',
    pretendToBeVisual: true,
    url: 'http://localhost/?saison=aucune',
    beforeParse(win) {
      win.SpeechSynthesisUtterance = function () {};
      win.speechSynthesis = { speaking: false, cancel() {}, getVoices: () => [], speak() {} };
      if (saved) for (const [k, v] of Object.entries(saved)) win.localStorage.setItem(k, v);
    },
  });
  const w = dom.window;
  const errs = [];
  w.addEventListener('error', (e) => errs.push(e.message));
  return { w, d: w.document, ev: (code) => w.eval(code), errs };
}

// les jours : même formule que la spec (calendrier local, comme todayKey)
const pad = (n) => String(n).padStart(2, '0');
function day(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// des suivis de jeu construits à la main
const OK = (t = 2) => ({ t, e: 0, ok: true });
const KO = (t = 2) => ({ t, e: 2, ok: false });
/** à l'aise : au moins 3 missions récentes, sans erreur ni échec */
const aise = (last, more) => ({
  wins: 5,
  fails: 0,
  errors: 0,
  last,
  recent: [OK(), OK(), OK(), OK()],
  hints: 0,
  ...more,
});
/** à travailler : `ko` missions ratées parmi les dernières */
const hard = (last, ko = 3, more) => ({
  wins: 1,
  fails: ko,
  errors: 2 * ko,
  last,
  recent: [...Array.from({ length: ko }, () => KO()), OK()],
  hints: 0,
  ...more,
});

const FOOT = "Ces idées viennent des parties jouées sur cet appareil. Rien n'est envoyé ailleurs.";
const EMPTY = 'Pas de partie ces 7 derniers jours.';
const GOOD = 'Ce qui va bien :';
const HARD = 'Ce qui résiste cette semaine :';
const NONE = 'Rien ne résiste cette semaine.';
const TITLE = '🧭 Cette semaine';
const BLOCKS = [TITLE, EMPTY, GOOD, HARD, NONE, FOOT];

const profilesOf = (current) =>
  JSON.stringify({
    list: [
      { id: 'p1', name: 'Nina', avatar: '👧' },
      { id: 'p2', name: 'Léo', avatar: '👦' },
    ],
    current,
  });
const saveOf = (name, skills, more) => JSON.stringify({ v: 9, name, avatar: '👧', missions: 12, skills, ...more });

/** les blocs présents, dans l'ordre où ils apparaissent */
const blocksOf = (text) =>
  BLOCKS.filter((b) => text.includes(b))
    .sort((a, b) => text.indexOf(a) - text.indexOf(b))
    .join(' | ');
/** des blocs attendus, sous la forme que rend blocksOf */
const blocks = (...want) => want.join(' | ');
/** l'ordre d'apparition de quelques noms dans un texte (absents : non listés) */
const orderOf = (text, names) =>
  names
    .filter((n) => text.includes(n))
    .sort((a, b) => text.indexOf(a) - text.indexOf(b))
    .join(', ');
const after = (text, mark) => (text.includes(mark) ? text.slice(text.indexOf(mark)) : '');
const between = (text, from, to) => {
  const a = after(text, from);
  return to && a.includes(to) ? a.slice(0, a.indexOf(to)) : a;
};

/**
 * Lance le jeu avec deux enfants (Nina, joueuse courante, à qui Compter
 * résiste ; Léo, à l'aise en Mémoire) et rend de quoi monter une carte.
 */
async function open() {
  const game = boot({
    'lagon-magique-profiles': profilesOf('p1'),
    'lagon-magique-save:p1': saveOf('Nina', { count: hard(day(1)) }),
    'lagon-magique-save:p2': saveOf('Léo', { memory: aise(day(2)) }),
  });
  await wait(300);

  // la carte montée dans un élément : on lit ce que le parent voit (textContent)
  const stage = game.d.createElement('div');
  game.d.body.appendChild(stage);
  function mount(cardHtml) {
    stage.innerHTML = cardHtml;
    const el = stage.querySelector('.ps-bilan');
    const text = (el ? el.textContent : '').replace(/ /g, ' ').replace(/\s+/g, ' ').trim();
    return { el, text };
  }
  /** la carte d'une partie donnée (objet simple, passé tel quel à bilanHTML) */
  function card(st) {
    let out = '';
    try {
      out = game.ev(`bilanHTML(${JSON.stringify(st)})`);
    } catch (e) {
      return { el: null, text: '', error: e.message };
    }
    return mount(out);
  }
  return { ...game, stage, mount, card };
}

/** vérifie qu'aucune erreur JS n'a eu lieu, affiche le total et termine la suite */
function finish(name, errs) {
  check('aucune erreur JS', errs.length === 0, errs.join(' | '));
  console.log(`\n${failed ? '❌' : '✅'} ${name} : ${passed} vérifications réussies, ${failed} en échec`);
  process.exit(failed ? 1 : 0);
}

module.exports = {
  check,
  section,
  wait,
  day,
  OK,
  KO,
  aise,
  hard,
  FOOT,
  EMPTY,
  GOOD,
  HARD,
  NONE,
  TITLE,
  saveOf,
  blocksOf,
  blocks,
  orderOf,
  after,
  between,
  open,
  finish,
};
