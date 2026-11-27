const { boot, wait, J } = require('./fixtures.js');

/* ============ S2 et S4 : la capture en jeu, l'aller-retour item / render ============ */
// une page avec un joueur tout neuf (Zoé), fenêtre fermée
async function newPlayer(opts) {
  const pg = boot(opts);
  await wait(200);
  pg.d.getElementById('btn-splash-play').click();
  pg.d.getElementById('name-input').value = 'Zoé';
  pg.d.querySelector('.avatar-opt').click();
  pg.d.getElementById('btn-start').click();
  await wait(300);
  pg.ev('closeModal()');
  return pg;
}
// L'âge et l'île fixent le palier ; le niveau propre au jeu le plafonne (comme test/games.test.js)
const ISLAND_FOR_TIER = { 1: 'lagon', 2: 'foret', 3: 'montagne', 4: 'chateau', 5: 'jungle', 6: 'volcan' };
const setTier = (pg, key, tier) =>
  pg.ev(`closeModal(); party.active = false; race.active = false; currentProfile().age = 0;
      state.missions = 200; currentWorld = ${J(ISLAND_FOR_TIER[tier])};
      state.skills = { ${key}: { wins:0, fails:0, errors:0, last:null, recent:[], lvl:${tier} } }`);
function startGame(pg, key, tier) {
  setTier(pg, key, tier);
  pg.ev(`playGame(${J(key)})`);
}
const ascii = (s) => (s === '−' ? '-' : s);
// Les paramètres attendus, relus sur la question que le jeu a posée (sans passer par son `item`)
const EXPECTED_PARAMS = {
  math: (q) => ({ g: 'math', a: q.a, b: q.b, op: ascii(q.op) }),
  calc: (q) =>
    q.mult
      ? { g: 'calc', mult: { a: q.mult.a, b: q.mult.b } }
      : { g: 'calc', first: q.first, ops: q.ops.map((o) => ({ s: ascii(o.sign), n: o.n })) },
  compare: (q) => ({ g: 'compare', a: q.a, b: q.b }),
  clock: (q) => ({ g: 'clock', h: q.hour, m: q.minute }),
  reading: (q) => ({ g: 'reading', w: q.correct.word, img: q.wordToImage }),
};
const calcValue = (p) =>
  p.mult ? p.mult.a * p.mult.b : p.ops.reduce((v, o) => (o.s === '+' ? v + o.n : v - o.n), p.first);
const calcText = (p) =>
  p.mult ? `${p.mult.a} × ${p.mult.b}` : `${p.first}${p.ops.map((o) => ` ${o.s === '+' ? '+' : '−'} ${o.n}`).join('')}`;
const clockLabel = (p) => (p.m === 0 ? `${p.h} h` : `${p.h} h ${p.m}`);
// Ce que l'écran montre pour des paramètres donnés : la question, et la bonne réponse (data-…)
const SHOWN = {
  math: (d, p) =>
    [...d.querySelectorAll('.math-equation .eq-num')].map((x) => x.textContent).join() === `${p.a},${p.b}` &&
    d.querySelector('.math-equation .eq-op').textContent === (p.op === '+' ? '+' : '−') &&
    d.querySelectorAll('.math-group')[0].children.length === p.a &&
    d.querySelectorAll('.math-group')[1].children.length === p.b,
  calc: (d, p) => d.querySelector('.calc-expr').textContent === calcText(p),
  compare: (d, p) => [...d.querySelectorAll('.cmp-num')].map((x) => x.textContent).join() === `${p.a},${p.b}`,
  clock: (d, p) =>
    d.querySelector('.clock-hand-h').style.transform === `rotate(${((p.h % 12) + p.m / 60) * 30}deg)` &&
    d.querySelector('.clock-hand-m').style.transform === `rotate(${p.m * 6}deg)`,
  reading: (d, p) =>
    p.img
      ? d.querySelector('.reading-word').textContent === p.w && !d.querySelector('.reading-image-box')
      : !!d.querySelector('.reading-image-box') && !d.querySelector('.reading-word'),
};
const ANSWER = {
  math: (p) => String(p.op === '+' ? p.a + p.b : p.a - p.b),
  calc: (p) => String(calcValue(p)),
  compare: (p) => (p.a < p.b ? '<' : p.a > p.b ? '>' : '='),
  clock: clockLabel,
  reading: (p) => p.w,
};
const CHOICES = {
  math: '.num-btn',
  calc: '.num-btn',
  compare: '.cmp-btn',
  clock: '.clock-opt-btn',
  reading: '.reading-opt',
};
const answerOf = (btn) => btn.dataset.v || btn.dataset.w;
const rightBtn = (pg) => pg.d.querySelector(pg.ev('gameSolution')[0]);
const wrongBtn = (pg, key) => [...pg.d.querySelectorAll(CHOICES[key])].find((b) => b !== rightBtn(pg) && !b.disabled);
const hintQ = (pg) => JSON.parse(pg.js('hint.q'));

const queue = (pg) => JSON.parse(pg.js('state.review'));
const stored = (pg) => JSON.parse(pg.w.localStorage.getItem(pg.ev('currentSaveKey()'))).review;
const CAPTURE_DAY = '2026-11-20';

module.exports = {
  startGame,
  EXPECTED_PARAMS,
  hintQ,
  wrongBtn,
  CAPTURE_DAY,
  queue,
  stored,
  setTier,
  rightBtn,
  SHOWN,
  answerOf,
  ANSWER,
  CHOICES,
  newPlayer,
};
