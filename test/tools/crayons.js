// Harnais des suites de l'Île des Crayons (test/crayons*.test.js, track
// monde-crayons) : la page et les aides de test/tools/saison3.js, plus le
// lancement d'un mini-jeu à un palier et les aides de « Trace avec ton doigt »
// (tables de la spec, glyphes imposés, pilote du doigt de test/tools/gestures.js).
const t = require('./saison3.js');
const gestures = require('./gestures.js');
const { d, ev, json, spoken } = t;
const w = d.defaultView;

// L'île fixe le palier ; le niveau propre au jeu le plafonne (comme test/games.test.js).
const ISLAND_FOR_TIER = { 1: 'lagon', 2: 'foret', 3: 'montagne', 4: 'chateau', 5: 'jungle', 6: 'volcan' };
function startGame(key, tier, age) {
  ev(`closeModal(); party.active = false; currentProfile().age = ${age || 0};
      state.missions = 200; currentWorld = ${json(ISLAND_FOR_TIER[tier || 1])};
      state.skills = { ${json(key)}: { wins:0, fails:0, errors:0, last:null, recent:[], lvl:${tier || 1} } };
      playGame(${json(key)})`);
}

// Les tables de la spec (« Paliers de trace », « Ensembles de glyphes »)
const TRACE_TIERS = {
  1: { glyphs: 1, set: 'p1', R: 16, cover: 0.75, order: false, start: false, wander: 0.35, arrows: true, demo: true },
  2: { glyphs: 2, set: 'p2', R: 14, cover: 0.85, order: true, start: true, wander: 0.3, arrows: true, demo: false },
  3: { glyphs: 2, set: 'p3', R: 12, cover: 0.85, order: true, start: true, wander: 0.25, arrows: true, demo: false },
  4: { glyphs: 3, set: 'p4', R: 11, cover: 0.9, order: true, start: true, wander: 0.25, arrows: true, demo: false },
  5: { glyphs: 3, set: 'p5', R: 10, cover: 0.9, order: true, start: true, wander: 0.2, arrows: false, demo: false },
};
const TRACE_SETS = {
  p1: ['1', '4', '7', '0', 'L', 'T', 'E', 'H'],
  p2: ['i', 'u', 't', 'l', 'e', '2', '3', '5'],
  p3: ['c', 'o', 'a', 'd', '6', '8', '9'],
  p4: ['i', 'u', 't', 'l', 'e', 'c', 'o', 'a', 'd'],
  p5: ['i', 'u', 't', 'l', 'e', 'c', 'o', 'a', 'd', '2', '3', '5', '6', '8', '9'],
};
const TIERS = [1, 2, 3, 4, 5];

const has = (name) => ev(`typeof ${name} !== 'undefined'`);
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
const near = (a, b) => Math.abs(Number(a) - b) < 0.06; // les nombres du dessin sont arrondis au dixième
// tous les traits du jeu : { g, s, st } (glyphe, rang, trait) ; `paths` : sans le point du i
const strokes = () =>
  has('TRACE_GLYPHS')
    ? Object.values(ev('TRACE_GLYPHS')).flatMap((g) => g.strokes.map((st, s) => ({ g: g.id, s, st })))
    : [];
const paths = () => strokes().filter((x) => x.st.kind === 'path');
const strokesOf = (id) => ev('TRACE_GLYPHS')[id].strokes;
const model = (st) => ev('traceStrokePoints')(st);
const judge = (st, pts, p) => ev('traceJudge')(st, pts, TRACE_TIERS[p]);

// un gribouillis : du premier point donné, puis 20 lignes horizontales en zigzag sur tout le carré
function scribble(first) {
  const pts = [first];
  for (let k = 0; k < 20; k++) {
    const y = 5 + (90 * k) / 19;
    pts.push(k % 2 ? [95, y] : [5, y], k % 2 ? [5, y] : [95, y]);
  }
  return pts;
}
// un tracé raté pour ce trait : loin du point, ou à l'envers (raison start dès le palier 2)
const FAR_TAP = [
  [90, 90],
  [90, 90],
];
const badPts = (st) => (st.kind === 'dot' ? FAR_TAP : model(st).slice().reverse());

// la voix : `said(texte, depuis)` cherche la phrase du jeu parmi ce qui a été dit depuis `depuis`
const toSpoken = (text) => ev('toSpoken(' + json(text) + ')');
const said = (text, from = 0) => spoken.slice(from).some((x) => x.includes(toSpoken(text)));

function headOf(g) {
  if (g.kind === 'chiffre') return `Trace le chiffre ${g.say}.`;
  if (g.kind === 'capitale') return `Trace la lettre ${g.say}, comme dans ${g.word}.`;
  return `Trace la lettre ${g.say} en attaché, comme dans ${g.word}.`;
}
// la consigne d'un glyphe au palier p (table « Textes » de la spec)
const consigne = (id, p) =>
  `${headOf(ev('TRACE_GLYPHS')[id])} Pars du point vert ${p === 5 ? 'et suis le chemin gris !' : 'et suis les flèches !'}`;

// lance « trace » au palier p ; `ids` impose les glyphes de la mission (l'ensemble du palier, le temps du tirage)
function startTrace(p, ids) {
  const set = TRACE_TIERS[p].set;
  const force = ids && has('TRACE_SETS');
  if (force) ev(`TRACE_SETS.${set}.splice(0, 99, ...${json(ids)})`);
  startGame('trace', p);
  if (force) ev(`TRACE_SETS.${set}.splice(0, 99, ...${json(TRACE_SETS[set])})`);
}
const pad = () => d.getElementById('tr-pad');
const padAt = (g, s) => !!pad() && pad().dataset.g === String(g) && pad().dataset.s === String(s);
const game = () => (has('traceGame') ? ev('traceGame') : null);
const glyphs = () => (game() ? game().glyphs : []);
const msEl = (g, s) => d.querySelector(`.tr-ms[data-g="${g}"][data-s="${s}"]`);
// trace l'élément (g, s) de la bande ; `pts` : un autre tracé que le modèle
const trace = (g, s, pts) => !!msEl(g, s) && gestures.traceAlong(w, msEl(g, s), pts);
// trace tout ce qui reste de la solution, dans l'ordre
function traceRest() {
  const todo = (ev('gameSolution') || []).map((sel) => d.querySelector(sel));
  return todo.length > 0 && todo.every((el) => el.classList.contains('done') || gestures.traceAlong(w, el));
}
const won = () => t.waitFor(() => !!d.querySelector('.win-box'));
const sayBtn = () => d.querySelector('.puzzle-hint .btn-speak').dataset.say;

module.exports = {
  ...t,
  w,
  startGame,
  TRACE_TIERS,
  TRACE_SETS,
  TIERS,
  has,
  dist,
  near,
  strokes,
  paths,
  strokesOf,
  model,
  judge,
  scribble,
  badPts,
  toSpoken,
  said,
  consigne,
  startTrace,
  pad,
  padAt,
  game,
  glyphs,
  msEl,
  trace,
  traceRest,
  won,
  sayBtn,
};
