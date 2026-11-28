// L'Île du Grand Concert : le mini-jeu « La mélodie » (melody), son ouverture :
// critères 16 à 19 de la spec (la mélodie tirée, l'écoute, la partition en
// points ou en portée), tables « Mélodies », `melodyRound` et « Textes de
// melody ». Le jeu lui-même (critères 20 à 23) : test/concert-melody-jeu.test.js.
// Harnais : test/tools/concert.js. Les minuteries du jeu sont 10 fois plus courtes.
const t = require('./tools/concert.js');
const { ev, json, check, section, all, one, XYLO, INK, MELODY_T, TIERS } = t;

const TITLES = {
  listen: [
    'Rejoue la mélodie de Xylo',
    'Écoute et regarde la mélodie de Xylo, puis rejoue-la sur le xylophone.',
    '👆 À toi !',
  ],
  read: [
    'Lis la mélodie, puis joue-la !',
    'Lis les notes sur la portée, puis joue-les sur le xylophone. Xylo te la fera écouter après !',
    '📖 Lis la mélodie, puis joue-la !',
  ],
};
const MEMORY = '👆 À toi ! Tu t’en souviens ?'.replace('’', "'");
const youLabel = (p) => (p === 3 ? MEMORY : TITLES[MELODY_T[p].read ? 'read' : 'listen'][2]);
const GREY = 'rgb(201, 206, 219)';

// critère 16 : la mélodie appartient à la liste du palier, jamais la même deux fois
function tirages(p) {
  const cfg = MELODY_T[p];
  const list = t.melodiesOf(p).map((m) => m.join(''));
  const seen = [];
  let fine = true;
  for (let k = 0; k < 25; k++) {
    t.startGame('melody', p);
    const m = t.score();
    seen.push(m.join(''));
    fine =
      fine &&
      m.length === cfg.n &&
      list.includes(m.join('')) &&
      json(t.ns('.xylo-lame')) === json(cfg.lames) &&
      json(t.sol()) === json(m.map((n) => `.xylo-lame[data-n="${n}"]`)) &&
      all('#melody-progress .game-progress i').length === cfg.n &&
      !one('#challenge-timer');
  }
  check(`critère 16, palier ${p} : ${cfg.n} notes d'une mélodie de la liste, ses lames, sa solution`, () => [
    fine,
    list.length === 8 && list.every((m) => m.length === cfg.n),
    json(ev(`MELODIES[${p}]`)) === json(t.melodiesOf(p)),
  ]);
  check(`critère 16, palier ${p} : jamais la même mélodie deux fois d'affilée, plusieurs mélodies tirées`, () => [
    seen.every((m, i) => i === 0 || m !== seen[i - 1]),
    new Set(seen).size >= 4,
  ]);
  const [title, say] = TITLES[cfg.read ? 'read' : 'listen'];
  check(`« Textes de melody », palier ${p} : le titre et la consigne dite`, () => [
    one('.game-head h2').textContent === '🎶 La mélodie',
    one('.puzzle-hint .hint-txt').textContent === title,
    t.sayBtn() === say,
    !!one('#melody-listen') === !cfg.read,
  ]);
}

// critère 17 : l'écoute du début (paliers 1 à 3)
async function ecoute(p) {
  t.spy();
  t.startGame('melody', p);
  const t0 = Date.now();
  const m = t.score();
  const opened = [t.stateText() === '👂 Écoute…', t.turn() === 'listen', t.played().length === 0];
  const errors = ev('missionErrors');
  t.lame(m[0]).click();
  t.lame(MELODY_T[p].lames.find((n) => n !== m[0])).click();
  const ignored = [t.played().length === 0, ev('missionErrors') === errors, !one('.ml-note.done')];
  const lit = t.watchLit();
  const back = await t.yourTurn();
  const ms = Date.now() - t0;
  check(`critère 17, palier ${p} : « 👂 Écoute… », et les touches sont ignorées pendant l'écoute`, () => [
    ...opened,
    ...ignored,
  ]);
  check(`critère 17, palier ${p} : la mélodie est jouée une fois, chaque lame s'allume avec sa note`, () => [
    json(t.played()) === json(t.hzOf(m)),
    m.every((n) => lit.has(n)),
  ]);
  check(`critère 17, palier ${p} : puis « ${youLabel(p)} », à 500 + n × 650 ms`, () => [
    back,
    t.stateText() === youLabel(p),
    ms >= (500 + m.length * 650) / 10 - 5,
  ]);
  partition(p, m);
  t.unspy();
}

// critère 18 : les points après l'écoute (visibles aux paliers 1 et 2, cachés au palier 3)
function partition(p, m) {
  const dots = all('#melody-score span.ml-note');
  if (p < 3)
    check(`critère 18, palier ${p} : les points restent visibles, à la couleur et à la hauteur de leur note`, () => [
      dots.length === m.length,
      dots.every((el) => !el.classList.contains('covered')),
      dots.every((el, i) => el.style.backgroundColor === XYLO[m[i]].rgb),
      dots.every((el, i) => el.style.bottom === `${10 + m[i] * 10}%`),
    ]);
  else
    check('critère 18, palier 3 : les points sont cachés (gris, tous à la même hauteur)', () => [
      dots.length === m.length,
      dots.every((el) => el.classList.contains('covered')),
      dots.every((el) => el.style.bottom === '45%' && el.style.backgroundColor === GREY),
      json(dots.map((el) => Number(el.dataset.n))) === json(m),
    ]);
}

// critère 19 : aux paliers 4 et 5, on lit avant d'entendre
async function lecture(p) {
  t.spy();
  t.startGame('melody', p);
  const m = t.score();
  const heads = all('#melody-staff .note-head.ml-note');
  const now = [t.turn() === 'you', t.stateText() === TITLES.read[2]];
  await t.wait(200);
  check(`critère 19, palier ${p} : rien n'est joué, l'enfant peut jouer tout de suite`, () => [
    ...now,
    t.played().length === 0,
    t.turn() === 'you',
    !one('#melody-listen'),
  ]);
  check(
    `critère 19, palier ${p} : la portée de 5 lignes, une tête par note, ${p === 4 ? 'colorée' : 'sans couleur'}`,
    () => [
      one('#melody-score > svg#melody-staff.ml-staff') !== null,
      all('#melody-staff line.staff-line').length === 5,
      heads.length === MELODY_T[p].n,
      json(heads.map(t.headN)) === json(m),
      heads.every((h, i) => h.getAttribute('fill') === (p === 4 ? XYLO[m[i]].color : INK)),
    ],
  );
  t.lame(m[0]).click();
  check(`critère 19, palier ${p} : le premier toucher joue sa note`, () => [
    json(t.played()) === json([XYLO[m[0]].hz]),
    heads[0].classList.contains('done'),
  ]);
  t.unspy();
  ev('closeModal()');
}

(async () => {
  await t.start();
  section('La mélodie : tirages et consignes (critère 16)');
  TIERS.forEach(tirages);
  ev('closeModal()');
  section('La mélodie : écouter, puis rejouer (critères 17 et 18)');
  for (const p of [1, 2, 3]) await ecoute(p);
  section('La mélodie : lire, puis jouer (critère 19)');
  for (const p of [4, 5]) await lecture(p);
  await t.finish('l’Île du Grand Concert (La mélodie, ouverture)');
})();
