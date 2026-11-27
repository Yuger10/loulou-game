// Harnais des suites de l'Île du Grand Concert (test/concert*.test.js, track
// monde-concert) : la page et les aides de test/tools/crayons.js (lancement
// d'un mini-jeu à un palier, voix), plus les tables de la spec (les 8 lames,
// `notesRound`, `melodyRound`, les mélodies) et l'espion de `playNote`.
const t = require('./crayons.js');
const { d, ev, json } = t;

// « Les 8 lames » (spec) : nom, fréquence, couleur (texte et `rgb` lu par jsdom), bord
const XYLO = [
  { n: 0, name: 'do', hz: 261.63, color: '#F0544F', rgb: 'rgb(240, 84, 79)', edge: '#A8322E' },
  { n: 1, name: 'ré', hz: 293.66, color: '#FF9A3C', rgb: 'rgb(255, 154, 60)', edge: '#C2661A' },
  { n: 2, name: 'mi', hz: 329.63, color: '#FFD93D', rgb: 'rgb(255, 217, 61)', edge: '#B8901A' },
  { n: 3, name: 'fa', hz: 349.23, color: '#5CC96B', rgb: 'rgb(92, 201, 107)', edge: '#2F9551' },
  { n: 4, name: 'sol', hz: 392.0, color: '#3FC1C9', rgb: 'rgb(63, 193, 201)', edge: '#1F8A91' },
  { n: 5, name: 'la', hz: 440.0, color: '#4A7BEA', rgb: 'rgb(74, 123, 234)', edge: '#2A4FA8' },
  { n: 6, name: 'si', hz: 493.88, color: '#A66FE0', rgb: 'rgb(166, 111, 224)', edge: '#6E3FB0' },
  { n: 7, name: 'do', hz: 523.25, color: '#F0544F', rgb: 'rgb(240, 84, 79)', edge: '#A8322E' },
];
const INK = '#2B2F6B'; // une note sans couleur
const LOW5 = [0, 1, 2, 3, 4];
const ALL8 = [0, 1, 2, 3, 4, 5, 6, 7];

// `notesRound(dd)` (spec) : ce que montre chaque palier
const NOTES_T = {
  1: { ask: 'hear', lames: [0, 2, 4], targets: [0, 2, 4] },
  2: { ask: 'name', lames: LOW5, targets: LOW5 },
  3: { ask: 'read', lames: LOW5, targets: LOW5, staff: 3, colors: true },
  4: { ask: 'read', lames: ALL8, targets: ALL8, staff: 5, colors: false },
  5: { ask: 'find', lames: [], targets: ALL8, staff: 5, colors: false, choices: 5 },
};
// `melodyRound(dd)` (spec)
const MELODY_T = {
  1: { n: 3, lames: [0, 2, 4], show: 'dots', hide: false, read: false, colors: true },
  2: { n: 4, lames: LOW5, show: 'dots', hide: false, read: false, colors: true },
  3: { n: 5, lames: LOW5, show: 'dots', hide: true, read: false, colors: true },
  4: { n: 5, lames: ALL8, show: 'staff', hide: false, read: true, colors: true },
  5: { n: 6, lames: ALL8, show: 'staff', hide: false, read: true, colors: false },
};
// « Mélodies » (spec) : une ligne par palier, les notes collées
const MELODIES = {
  1: '024 420 004 440 242 020 424 202',
  2: '0120 2344 0001 4321 0242 4210 1234 2210',
  3: '00012 01234 43210 23420 44220 02132 42310 01200',
  4: '02454 76543 45432 04740 23454 54321 74200 32104',
  5: '004455 223443 012345 765432 024742 432210 332211 554433',
};
const melodiesOf = (p) => MELODIES[p].split(' ').map((m) => m.split('').map(Number));

const all = (sel) => [...d.querySelectorAll(sel)];
const one = (sel) => d.querySelector(sel);
const sol = () => ev('gameSolution') || [];
const won = () => t.waitFor(() => !!one('.win-box'), 2500);
const ns = (sel) => all(sel).map((el) => Number(el.dataset.n));
// la note d'une tête, relue sur le dessin (D9 : cy = 104 - 8 n)
const headN = (el) => (104 - Number(el.getAttribute('cy'))) / 8;
const lame = (n) => one(`.xylo-lame[data-n="${n}"]`);

// L'espion de `playNote` (spec, « Observer les notes jouées ») : les fréquences
// jouées, dans l'ordre, le son coupé ou non. `unspy` rend la vraie fonction.
function spy() {
  ev(`window.__real = window.__real || playNote; window.__pn = [];
      playNote = (hz) => { window.__pn.push(hz); return true; }`);
}
const unspy = () => ev('if (window.__real) playNote = window.__real');
const played = () => ev('window.__pn').slice();
// l'espion des événements (critères 32 et 39) : les thèmes demandés et la fin de saison
function spyEvents() {
  ev(`if (!window.__th) { window.__th = []; on("music:theme", (k) => window.__th.push(k));
        on("season3:done", () => window.__th.push("done")); }
      window.__th.length = 0`);
}
const themes = () => ev('window.__th').slice();

// « notes » : la cible et les états lus dans la page
const stage = () => one('#notes-stage');
const target = () => Number(stage().dataset.n);
// relance « notes » au palier p jusqu'à ce que `want(cible)` soit vrai
function startNotesUntil(p, want) {
  for (let k = 0; k < 200; k++) {
    t.startGame('notes', p);
    if (want(target())) return true;
  }
  return false;
}
// « melody » : la mélodie lue sur la partition, et l'état
const score = () => ns('#melody-score .ml-note');
const turn = () => (one('#melody-state') ? one('#melody-state').dataset.turn : '');
const stateText = () => t.text(one('#melody-state'));
const yourTurn = (ms = 3000) => t.waitFor(() => turn() === 'you', ms);
const hzOf = (notes) => notes.map((n) => XYLO[n].hz);
// joue une suite de lames, d'un clic chacune
const tap = (notes) => notes.forEach((n) => lame(n).click());

module.exports = {
  ...t,
  XYLO,
  INK,
  NOTES_T,
  MELODY_T,
  melodiesOf,
  all,
  one,
  sol,
  won,
  ns,
  headN,
  lame,
  spy,
  unspy,
  played,
  spyEvents,
  themes,
  stage,
  target,
  startNotesUntil,
  score,
  turn,
  stateText,
  yourTurn,
  hzOf,
  tap,
  json,
};
