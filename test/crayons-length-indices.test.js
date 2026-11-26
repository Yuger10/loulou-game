// L'Île des Crayons : les indices de « Mesure les crayons » (ligne 33 de la
// spec) : deux niveaux aux textes exacts, les traits en pointillés, la gomme
// numéro 1, les deux graduations qui brillent et le seul nombre écarté.
// Harnais : test/tools/crayons.js.
const t = require('./tools/crayons.js');
const { d, ev, json, check, section, startGame } = t;

const all = (sel) => [...d.querySelectorAll(sel)];
const build = () => ev('hint.q').b;
const hints = () => ev('hintsFor("length", hint.q)');
const hintBtn = () => d.querySelector('#modal-body .hint-btn');
const num = (el, attr) => Number(el.getAttribute(attr));
function startUntil(p, ok) {
  for (let k = 0; k < 60; k++) {
    startGame('length', p);
    if (ok(build())) return true;
  }
  return false;
}

const HINT1 = {
  alignedLong: 'Les crayons partent tous du même bord : regarde lequel va le plus loin.',
  alignedShort: "Les crayons partent tous du même bord : regarde lequel s'arrête le plus tôt.",
  shifted: 'Attention, les crayons ne partent pas du même endroit : regarde où chacun commence et où il finit.',
  units: 'Compte les gommes sous le crayon, une par une.',
  ruler4: 'Le crayon commence au zéro : lis le nombre sous sa pointe.',
  ruler5: 'Le crayon ne commence pas au zéro : compte les centimètres de son début à sa pointe.',
};
const HINT2 = {
  compare: 'Regarde les traits en pointillés : ils montrent le début et la fin de chaque crayon.',
  units: "Compte avec moi : un… et continue jusqu'au bout du crayon !",
  ruler:
    'Regarde les deux traits qui brillent : le début et la pointe du crayon. Combien de centimètres entre les deux ?',
};
// deux indices aux textes attendus, sans rien écarter au premier
const two = (say1, say2) => {
  const lv = hints();
  return [lv.length === 2, lv[0].say === say1, lv[1].say === say2, !lv[0].fx.dim];
};

function indicesComparer() {
  check('ligne 33 : crayons alignés, le plus long', () => [
    startUntil(1, (b) => b.ask === 'long'),
    ...two(HINT1.alignedLong, HINT2.compare),
  ]);
  check('ligne 33 : crayons alignés, le plus court', () => [
    startUntil(1, (b) => b.ask === 'short'),
    ...two(HINT1.alignedShort, HINT2.compare),
  ]);
  startGame('length', 2);
  const b = build();
  check("ligne 33 : crayons décalés ; l'indice 2 a un effet propre (fx.run), aucun n'écarte rien", () => [
    ...two(HINT1.shifted, HINT2.compare),
    typeof hints()[1].fx.run === 'function',
    !hints()[1].fx.dim,
    all('.ln-guide').length === 0,
  ]);
  hintBtn().click();
  const before = all('.ln-guide').length;
  hintBtn().click();
  check("ligne 33 : l'indice 2 pose 2 traits en pointillés par crayon, à son début et à sa fin", () => [
    before === 0,
    all('#ln-stage svg.ln-guides line.ln-guide').length === 2 * b.crayons.length,
    ...b.crayons.flatMap((c, i) => {
      const at = (where) => d.querySelector(`.ln-guide[data-i="${i}"][data-at="${where}"]`);
      return [
        num(at('start'), 'x1') === c.start && num(at('start'), 'x2') === c.start,
        num(at('end'), 'x1') === c.start + c.len && num(at('end'), 'x2') === c.start + c.len,
      ];
    }),
    all('#modal-body .hint-dim').length === 0,
  ]);
}

function indicesGommes() {
  startGame('length', 3);
  check("ligne 33 : en gommes, l'indice 2 numérote la première gomme (fx.marks), sans rien écarter", () => [
    ...two(HINT1.units, HINT2.units),
    json(hints()[1].fx.marks) === json([{ sel: '.ln-unit[data-u="0"]', text: '1' }]),
    !hints()[1].fx.dim,
  ]);
  hintBtn().click();
  hintBtn().click();
  check("le « 1 » se voit sur la première gomme, et aucun nombre n'est écarté (3 choix)", () => [
    d.querySelector('svg.ln-units text.ln-unit-num').textContent === '1',
    all('#modal-body .hint-dim').length === 0,
  ]);
}

function indicesRegle(p) {
  startGame('length', p);
  const b = build(),
    lv = hints();
  const dim = /^\.ln-opt\[data-v="(\d+)"\]$/.exec(lv[1].fx.dim || '');
  check(`ligne 33 : à la règle (palier ${p}), les deux graduations du début et de la pointe brillent`, () => [
    ...two(p === 5 ? HINT1.ruler5 : HINT1.ruler4, HINT2.ruler),
    lv[1].fx.glow === `.ln-tick[data-cm="${b.start}"], .ln-tick[data-cm="${b.start + b.answer}"]`,
  ]);
  check(`ligne 33 : un seul nombre écarté (palier ${p}), ni la réponse ni le piège`, () => [
    !!dim,
    b.choices.includes(Number(dim[1])),
    Number(dim[1]) !== b.answer,
    Number(dim[1]) !== b.trap,
    json(hints()[1].fx.dim) === json(lv[1].fx.dim), // le même à chaque lecture
  ]);
  hintBtn().click();
  hintBtn().click();
  check(`palier ${p} : après l'indice 2, un nombre grisé, deux graduations brillantes, et le jeu se gagne`, () => [
    all('#modal-body .hint-dim').length === 1,
    all('#modal-body .hint-dim')[0].dataset.v === dim[1],
    all('.ln-tick.hint-glow').length === 2,
    !d.querySelector(`.ln-opt[data-v="${b.answer}"]`).disabled,
  ]);
}

(async () => {
  await t.start();
  section('Mesure les crayons : indices pour comparer');
  indicesComparer();
  section('Mesure les crayons : indices pour mesurer');
  indicesGommes();
  indicesRegle(4);
  indicesRegle(5);
  ev('closeModal()');
  await t.finish("l'Île des Crayons (length, les indices)");
})();
