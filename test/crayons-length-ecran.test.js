// L'Île des Crayons : l'écran de « Mesure les crayons » (lignes 31 et 32 de la
// spec) : les crayons, les gommes, la règle, la bonne réponse, et une autre
// question après une erreur (anti-devinette). Les indices :
// test/crayons-length-indices.test.js. Harnais : test/tools/crayons.js.
const t = require('./tools/crayons.js');
const { d, ev, json, check, section, said, startGame } = t;

const all = (sel) => [...d.querySelectorAll(sel)];
const one = (sel) => d.querySelector(sel);
const stage = () => d.getElementById('ln-stage');
const build = () => ev('hint.q').b; // la question affichée (LengthBuild)
const num = (el, attr) => Number(el.getAttribute(attr));
// lance le jeu au palier p jusqu'à ce que la question convienne (au plus 60 tirages)
function startUntil(p, ok) {
  for (let k = 0; k < 60; k++) {
    startGame('length', p);
    if (ok(build())) return true;
  }
  return false;
}
const hintText = () => one('.puzzle-hint .hint-txt').textContent.trim();

/* ================= Ce qui s'affiche ================= */
function ecranComparer(p) {
  startGame('length', p);
  const b = build();
  check(`palier ${p} : la scène (mode compare) et un bouton par crayon, avec son dessin`, () => [
    stage().tagName === 'DIV',
    stage().dataset.mode === 'compare',
    stage().dataset.ask === b.ask,
    all('button.ln-crayon').length === b.crayons.length,
    all('button.ln-crayon').every((el) => !!el.querySelector('svg')),
    all('.ln-opt').length === 0,
  ]);
  check(`palier ${p} : chaque bouton porte son rang, son départ et sa longueur`, () =>
    all('button.ln-crayon').map(
      (el, i) =>
        el.dataset.i === String(i) &&
        el.dataset.start === String(b.crayons[i].start) &&
        el.dataset.len === String(b.crayons[i].len),
    ),
  );
  check(`palier ${p} : la solution est le crayon demandé ; la consigne est lue`, () => [
    json(ev('gameSolution')) === json([`.ln-crayon[data-i="${b.answer}"]`]),
    hintText() === (b.ask === 'long' ? 'Le plus long !' : 'Le plus court !'),
    t.sayBtn() === (b.ask === 'long' ? 'Touche le crayon le plus long !' : 'Touche le crayon le plus court !'),
    said(t.sayBtn()),
  ]);
}

function ecranGommes() {
  startGame('length', 3);
  const b = build();
  check('palier 3 : le crayon seul (pas un bouton) et sa longueur en gommes', () => [
    stage().dataset.mode === 'units',
    stage().dataset.len === String(b.answer),
    stage().dataset.start === '0',
    all('div.ln-crayon.solo').length === 1,
    all('button.ln-crayon').length === 0,
    one('div.ln-crayon.solo').dataset.len === String(b.answer),
    one('div.ln-crayon.solo').dataset.start === '0',
    !!one('div.ln-crayon.solo svg'),
  ]);
  check('palier 3 : une rangée de 7 gommes de 12 unités, à partir de x = 5', () => [
    all('svg.ln-units rect.ln-unit').length === 7,
    all('svg.ln-units rect.ln-unit').every(
      (r, u) => r.dataset.u === String(u) && num(r, 'x') === 5 + 12 * u && num(r, 'width') === 12,
    ),
  ]);
  check('palier 3 : les 3 nombres proposés, la consigne', () => [
    json(all('button.ln-opt').map((o) => Number(o.dataset.v))) === json(b.choices),
    json(ev('gameSolution')) === json([`.ln-opt[data-v="${b.answer}"]`]),
    hintText() === 'Combien de gommes ?',
    t.sayBtn() === 'Combien de gommes mesure ce crayon ?',
  ]);
}

function ecranRegle(p) {
  startGame('length', p);
  const b = build();
  check(`palier ${p} : la règle de 0 à 15 cm, 1 cm = 6 unités, le 0 à x = 5`, () => [
    stage().dataset.mode === 'ruler',
    all('svg.ln-ruler line.ln-tick').length === 16,
    all('svg.ln-ruler line.ln-tick').every(
      (l, cm) => l.dataset.cm === String(cm) && num(l, 'x1') === 5 + 6 * cm && num(l, 'x2') === 5 + 6 * cm,
    ),
    all('svg.ln-ruler text').length === 16,
  ]);
  check(`palier ${p} : le crayon seul, son départ et sa longueur en centimètres ; 4 nombres proposés`, () => [
    stage().dataset.len === String(b.answer),
    stage().dataset.start === String(b.start),
    one('div.ln-crayon.solo').dataset.len === String(b.answer),
    one('div.ln-crayon.solo').dataset.start === String(b.start),
    (p === 5) === b.start > 0,
    json(all('button.ln-opt').map((o) => Number(o.dataset.v))) === json(b.choices),
    json(ev('gameSolution')) === json([`.ln-opt[data-v="${b.answer}"]`]),
    hintText() === 'Combien de centimètres ?',
    t.sayBtn() === 'Combien de centimètres mesure ce crayon ?',
  ]);
}

/* ================= Lignes 31 et 32 : bonne réponse, erreur ================= */
// touche `el` (une mauvaise réponse) : la phrase est dite, puis une AUTRE question s'affiche
async function wrongThenNew(el, phrase) {
  const q = ev('hint.q'),
    from = t.spoken.length,
    errors = ev('missionErrors');
  el.click();
  const facts = [ev('missionErrors') === errors + 1, !one('.win-box')];
  facts.push(await t.waitFor(() => ev('hint.q') !== q && !!stage(), 1500));
  facts.push(said(phrase, from), ev('hint.kind') === 'length');
  return facts.every(Boolean);
}
async function bonneReponse() {
  startGame('length', 1);
  one(`button.ln-crayon[data-i="${build().answer}"]`).click();
  const win = await t.won();
  check('ligne 31 : toucher le bon crayon gagne la mission', () => [win]);
  ev('closeModal()');
  for (const p of [3, 4, 5]) {
    startGame('length', p);
    one(`button.ln-opt[data-v="${build().answer}"]`).click();
    const ok = await t.won();
    check(`palier ${p} : toucher le bon nombre gagne la mission`, () => [ok]);
    ev('closeModal()');
  }
}
async function erreursComparer() {
  for (const [ask, word] of [
    ['long', 'le plus long'],
    ['short', 'le plus court'],
  ]) {
    const found = startUntil(2, (b) => b.ask === ask);
    const wrong = all('button.ln-crayon').find((el) => el.dataset.i !== String(build().answer));
    const ok = await wrongThenNew(wrong, 'Compare où chaque crayon commence et finit.');
    check(`ligne 31 : un mauvais crayon (« ${word} ») : la phrase d'erreur, puis une autre question`, () => [
      found,
      ok,
    ]);
  }
  ev('closeModal()');
}
const wrongOpt = (avoid) =>
  all('button.ln-opt').find((o) => Number(o.dataset.v) !== build().answer && Number(o.dataset.v) !== avoid);
async function erreursMesurer() {
  startGame('length', 3);
  const units = await wrongThenNew(wrongOpt(null), 'Compte les gommes une par une.');
  check('ligne 32 : palier 3, un mauvais nombre : « Compte les gommes… », puis une autre question', () => [units]);
  startGame('length', 4);
  const ruler = await wrongThenNew(wrongOpt(null), 'Lis la graduation sous la pointe.');
  check('ligne 32 : palier 4, un mauvais nombre : « Lis le nombre juste sous la pointe… »', () => [ruler]);
  startGame('length', 5);
  const trap = await wrongThenNew(one(`button.ln-opt[data-v="${build().trap}"]`), 'Le crayon ne commence pas au zéro.');
  check(
    'ligne 32 : palier 5, la graduation sous la pointe : « Attention : le crayon ne commence pas au zéro ! »',
    () => [trap],
  );
  startGame('length', 5);
  const other = await wrongThenNew(wrongOpt(build().trap), 'Lis la graduation sous la pointe.');
  check('ligne 32 : palier 5, un autre mauvais nombre : « Compte les centimètres… »', () => [other]);
  ev('closeModal()');
}

(async () => {
  await t.start();
  section("Mesure les crayons : l'écran");
  ecranComparer(1);
  ecranComparer(2);
  ecranGommes();
  ecranRegle(4);
  ecranRegle(5);
  section('Mesure les crayons : bonne réponse, puis erreurs (anti-devinette)');
  await bonneReponse();
  await erreursComparer();
  await erreursMesurer();
  await t.finish("l'Île des Crayons (length, l'écran)");
})();
