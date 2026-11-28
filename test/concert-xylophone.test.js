// L'Île du Grand Concert : la slice « xylophone », partagée par les deux
// mini-jeux, le final et l'île : critères 1 à 4 de la spec (les 8 lames,
// `xyloHTML`, `playXylo`, `staffSVG`) et ligne S8 (les règles de mise en page).
// Harnais : test/tools/concert.js.
const fs = require('fs');
const path = require('path');
const t = require('./tools/concert.js');
const { d, ev, json, check, section, XYLO, INK } = t;

// un morceau de HTML ou de SVG du jeu, posé hors de la page pour le lire
function parse(code) {
  const box = d.createElement('div');
  box.innerHTML = ev(code);
  return box;
}
const lines = (box, cls = 'staff-line') => [...box.querySelectorAll(`line.${cls}`)];
const ys = (box) => lines(box).map((l) => Number(l.getAttribute('y1')));

function lames() {
  check('critère 1 : XYLO_NOTES a les 8 lignes de la table, dans l’ordre', () => [
    json(ev('XYLO_NOTES')) === json(XYLO.map(({ n, name, hz, color, edge }) => ({ n, name, hz, color, edge }))),
  ]);
  const box = parse('xyloHTML({ lames: [0, 2, 4] })');
  const bars = [...box.querySelectorAll('.xylo > button.xylo-lame')];
  check('critère 2 : 3 lames, du grave à l’aigu, chacune plus courte que celle de gauche', () => [
    json(bars.map((b) => b.dataset.n)) === json(['0', '2', '4']),
    json(bars.map((b) => b.style.height)) === json(['170px', '152.86px', '135.71px']),
  ]);
  check('critère 2 : le nom écrit sur chaque lame, et son aria-label', () => [
    json(bars.map((b) => b.querySelector('b.xylo-name').textContent)) === json(['do', 'mi', 'sol']),
    json(bars.map((b) => b.getAttribute('aria-label'))) === json(['Lame do', 'Lame mi', 'Lame sol']),
  ]);
  const sorted = parse('xyloHTML({ lames: [4, 0, 2] })');
  const gold = parse('xyloHTML({ lames: [0, 1, 2, 3, 4, 5, 6, 7], gold: true, names: false, id: "x1" })');
  check('xyloHTML : toujours rangé du grave à l’aigu ; `gold`, `names` et `id`', () => [
    json([...sorted.querySelectorAll('.xylo-lame')].map((b) => b.dataset.n)) === json(['0', '2', '4']),
    !box.querySelector('.xylo').classList.contains('xylo-gold'),
    gold.querySelector('.xylo.xylo-gold').id === 'x1',
    gold.querySelectorAll('.xylo-lame').length === 8,
    gold.querySelectorAll('.xylo-name').length === 0,
    [...gold.querySelectorAll('.xylo-lame')].pop().style.height === '110px',
  ]);
}

// critère 3 : une lame touchée joue sa note et s'allume 200 ms
async function toucher() {
  for (const n of [0, 2, 4]) {
    t.startGame('notes', 1);
    t.spy();
    const el = t.lame(n);
    el.click();
    const now = [t.played().pop() === XYLO[n].hz, el.classList.contains('lit')];
    await t.wait(60);
    check(`critère 3 : la lame ${XYLO[n].name} joue ${XYLO[n].hz} Hz et s’allume, puis s’éteint`, () => [
      ...now,
      !el.classList.contains('lit'),
    ]);
  }
  t.unspy();
  ev('closeModal(); state.sound = false');
  t.startGame('notes', 1);
  const el = t.lame(2);
  el.click();
  check('critère 3 : le son coupé, la lame s’allume quand même', () => [el.classList.contains('lit')]);
  ev('closeModal(); state.sound = true');
  const free = parse('xyloHTML({ lames: [5] })').querySelector('.xylo-lame');
  t.spy();
  ev('playXylo')(5, free);
  check('playXylo(n, el) : la note de la lame, et `lit` sur l’élément donné', () => [
    json(t.played()) === json([440]),
    free.classList.contains('lit'),
  ]);
  t.unspy();
}

function portee() {
  const fa = parse('staffSVG([3], { lines: 5, colors: false })');
  const head = fa.querySelector('.note-head');
  check('critère 4 : 5 lignes aux ordonnées 88, 72, 56, 40, 24 ; le fa à cy = 80, sans couleur', () => [
    json(ys(fa)) === json([88, 72, 56, 40, 24]),
    fa.querySelectorAll('.note-head').length === 1,
    head.dataset.n === '3' && head.getAttribute('cy') === '80',
    head.getAttribute('fill') === INK,
    lines(fa, 'ledger-line').length === 0,
    fa.querySelector('svg').getAttribute('viewBox') === '0 0 52 120',
  ]);
  const low = parse('staffSVG([0], { lines: 5, colors: false })');
  check('critère 4 : le do grave a son petit trait à y = 104', () => [
    lines(low, 'ledger-line').length === 1,
    lines(low, 'ledger-line')[0].getAttribute('y1') === '104',
    low.querySelector('.note-head').getAttribute('cy') === '104',
  ]);
  const three = parse('staffSVG([2], { lines: 3, colors: true, id: "s1", cls: "petite" })');
  check('critère 4 : portée réduite (3 lignes du bas), tête de la couleur de sa lame, `id` et `cls`', () => [
    json(ys(three)) === json([88, 72, 56]),
    three.querySelector('.note-head').getAttribute('fill') === XYLO[2].color,
    three.querySelector('svg').id === 's1',
    three.querySelector('svg').classList.contains('petite'),
  ]);
  const many = parse('staffSVG([0, 4, 7], { lines: 5, colors: true })');
  const heads = [...many.querySelectorAll('.note-head')];
  check('staffSVG : plusieurs notes, à x = 20 + 28 k, la largeur suit', () => [
    json(heads.map((h) => h.getAttribute('cx'))) === json(['20', '48', '76']),
    json(heads.map(t.headN)) === json([0, 4, 7]),
    many.querySelector('svg').getAttribute('viewBox') === '0 0 108 120',
    lines(many)[0].getAttribute('x1') === '4' && lines(many)[0].getAttribute('x2') === '104',
  ]);
}

// S8 : jsdom ne fait pas de mise en page, on lit donc les règles de la feuille
function feuille() {
  const css = fs
    .readFileSync(path.join(__dirname, '..', 'js/features/xylophone/xylophone.css'), 'utf8')
    .replace(/\s+/g, ' ');
  const rule = (sel) => (css.match(new RegExp(`(?:^|[}/] ?)${sel} \\{([^}]*)\\}`)) || [])[1] || '';
  check('S8 : le conteneur .xylo tient sur une ligne, sans défilement', () => [
    /display: flex/.test(rule('\\.xylo')),
    /flex-wrap: nowrap/.test(rule('\\.xylo')),
    /gap: 4px/.test(rule('\\.xylo')),
    /width: 100%/.test(rule('\\.xylo')),
  ]);
  check('S8 : une lame fait 64 px au plus, 36 px au moins, 30 px sous 356 px d’écran', () => [
    /flex: 0 1 64px/.test(rule('\\.xylo-lame')),
    /min-width: 36px/.test(rule('\\.xylo-lame')),
    /@media \(max-width: 355px\) \{ \.xylo-lame \{ min-width: 30px; \} \}/.test(css),
  ]);
}

(async () => {
  await t.start();
  section('Le xylophone : les 8 lames (critères 1 et 2)');
  lames();
  section('Le xylophone : toucher une lame (critère 3)');
  await toucher();
  section('Le xylophone : la portée (critère 4)');
  portee();
  section('Le xylophone : la feuille de style (S8)');
  feuille();
  await t.finish('l’Île du Grand Concert (le xylophone)');
})();
