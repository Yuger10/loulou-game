// L'Île des Coffres : « Le trésor raconté » aux paliers 4 et 5 : l'égalité
// sous le schéma (critère 9), l'égalité seule (critère 10), les problèmes à
// deux étapes (critère 14), « est-ce possible ? » (critère 15), et chaque type
// joué jusqu'à la victoire (G1). Harnais : test/tools/coffres.js.
const t = require('./tools/coffres.js');
const { ev, json, check, section, all, one, T1 } = t;

const MINUS = '−';
// critère 9 : la forme de l'égalité d'une étape, dans l'ordre Q de L1
function eqText(s, done) {
  const nums = s.order.map((k) => (k === 1 ? s.n1 : s.n2));
  return `${nums[0]} ${s.op === '+' ? '+' : MINUS} ${nums[1]} = ${done ? s.r : '?'}`;
}

async function victoire(p, type) {
  t.openPb(p, 2, t.sample(type, p));
  const n = t.data();
  const where = `palier ${p}, ${type}`;
  check(`critère 19 et G1, ${where} : gameSolution vaut la liste de la spec, tout est dans la fenêtre`, () => [
    json(t.sol()) === json(t.expectedSolution(n, T1[p].rep, 2)),
    t.sol().every((s) => all(s).length === 1),
    one('#pb-root').dataset.r === t.resultOf(n),
  ]);
  const win = t.play(t.sol()) && (await t.won());
  check(`${where} : la mission se gagne sans erreur`, () => [win, ev('missionErrors') === 0]);
  ev('closeModal()');
}

// critère 9 : au palier 4, l'égalité s'écrit sous le schéma au clic du bon signe
const EXEMPLES = [
  [{ type: 'retrait', a: 30, b: 12 }, `30 ${MINUS} 12 = ?`],
  [{ type: 'partie', t: 40, a: 15 }, `40 ${MINUS} 15 = ?`],
  [{ type: 'ajoutInconnu', a: 15, t: 40 }, `40 ${MINUS} 15 = ?`],
  [{ type: 'compPlus', a: 23, b: 9 }, '23 + 9 = ?'],
  [{ type: 'compEcart', a: 17, b: 35 }, `35 ${MINUS} 17 = ?`],
  [{ type: 'compMoinsPlus', t: 44, b: 1 }, `44 ${MINUS} 1 = ?`],
];
function egaliteSousSchema() {
  for (const [spec, text] of EXEMPLES) {
    t.openPb(4, 2, spec);
    const s = t.stagesOf(t.data())[0];
    const eq = () => one('#pb-main-e1 .pb-eq-text').textContent.trim();
    const empty = eq() === '';
    t.play(t.sol().slice(0, 8)); // 👉, trois étiquettes posées, le bon signe
    const asked = eq();
    one(`#pb-main-e1 .pb-num[data-v="${s.r}"]`).click();
    check(`critère 9, palier 4, ${spec.type} : « ${text} », puis le « ? » devient le résultat`, () => [
      empty,
      asked === text && asked === eqText(s, false),
      eq() === eqText(s, true),
    ]);
    ev('closeModal()');
  }
  t.openPb(3, 2, t.sample('partie', 3));
  check('critère 9 : au palier 3, aucune égalité sous le schéma', () => [all('.pb-eq-text').length === 0]);
  ev('closeModal()');
}

// critère 14 : deux étapes, chacune dans son bloc
function deuxEtapes() {
  t.openPb(4, 2, { type: 'deuxEtapes', variant: 'A', a: 20, b: 14, c: 9 });
  const [s1, s2] = t.stagesOf(t.data());
  const ds = one('#pb-root').dataset;
  check('critère 14 et A1 : deux blocs, la variante et le résultat de l’étape 1 sur #pb-root', () => [
    ds.variant === 'A' && ds.r1 === '34' && ds.r === '25' && ds.c === '9',
    !!one('#pb-main-e1') && !!one('#pb-main-e2'),
    t.hidden('#pb-main-e2 .pb-bars'),
    one('#pb-main-e2 .pb-label[data-l="n1"]').textContent.trim() === '34',
    one('#pb-main-e2 .pb-label[data-l="n2"]').textContent.trim() === '9',
  ]);
  t.play(t.sol().slice(0, 9)); // 👉, étape 1 : dessin, signe, résultat
  check('critère 14 : après le calcul 1, on dessine l’étape 2 ; le résultat 1 y est une étiquette', () => [
    one('#pb-main-e1 .pb-eq-text').textContent.trim() === eqText(s1, true),
    one('.pb-step.on').dataset.step === 'dessiner',
    !t.hidden('#pb-main-e2 .pb-bars'),
    ev('missionErrors') === 0,
  ]);
  t.play(t.sol().slice(9, -1));
  check('critère 14 : puis le calcul 2, et une seule étape Répondre', () => [
    one('#pb-main-e2 .pb-eq-text').textContent.trim() === eqText(s2, true) && eqText(s2, true) === `34 ${MINUS} 9 = 25`,
    one('.pb-step.on').dataset.step === 'repondre',
    all('#pb-main .pb-answer').length === 1,
  ]);
  ev('closeModal()');
}

// critère 10 : l'égalité seule, jugée au toucher du signe
async function egalite() {
  const spec = { type: 'partie', t: 63, a: 18 };
  const B = '#pb-main-e1';
  t.openPb(5, 2, spec);
  check('critère 10 : aucun schéma, les deux nombres de l’étape et eux seuls', () => [
    all(`${B} .pb-bars`).length === 0 && all(`${B} .pb-label`).length === 0,
    json(all(`${B} .pb-eq-num`).map((x) => [x.dataset.k, x.textContent.trim()])) ===
      json([
        ['1', '63'],
        ['2', '18'],
      ]),
  ]);
  t.play(['#pb-main .pb-next', `${B} .pb-eq-num[data-k="1"]`, `${B} .pb-sign[data-v="-"]`]);
  check('critère 10 : un signe touché avant que les deux cases soient pleines ne fait rien', () => [
    ev('missionErrors') === 0,
    one('.pb-step.on').dataset.step === 'dessiner',
  ]);
  t.play([`${B} .pb-eq-num[data-k="2"]`, `${B} .pb-eq-num[data-k="1"]`, `${B} .pb-sign[data-v="-"]`]);
  check('critère 10 : 63, 18, puis ➖ : l’égalité est juste, on calcule', () => [
    ev('missionErrors') === 0,
    one('.pb-step.on').dataset.step === 'calculer',
    json(all(`${B} .pb-eq-case`).map((x) => x.textContent.trim())) === json(['63', '18']),
  ]);
  ev('closeModal()');
}
async function egaliteFausse() {
  const spec = { type: 'partie', t: 63, a: 18 };
  const B = '#pb-main-e1';
  const before = () => t.tuple(t.data());
  t.openPb(5, 2, spec);
  const lives = () => all('#lives-bar .life.on').length;
  t.play(['#pb-main .pb-next', `${B} .pb-eq-num[data-k="2"]`, `${B} .pb-eq-num[data-k="1"]`]);
  let was = before();
  const wrongOrder = await t.wrongThenNew(one(`${B} .pb-sign[data-v="-"]`), () => before() !== was);
  check('critère 10 : 18, 63, puis ➖ : une erreur, il reste 2 essais, un autre problème arrive', () => [
    wrongOrder,
    lives() === 2,
  ]);
  ev('closeModal()');

  t.openPb(5, 2, spec);
  t.play(['#pb-main .pb-next', `${B} .pb-eq-num[data-k="1"]`, `${B} .pb-eq-num[data-k="2"]`]);
  was = before();
  const wrongSign = await t.wrongThenNew(one(`${B} .pb-sign[data-v="+"]`), () => before() !== was);
  check('critère 10 : 63, 18, puis ➕ : une erreur (« partie » demande ➖)', () => [wrongSign]);
  ev('closeModal()');

  // ➕ : les deux ordres sont justes (étape 1 d'un problème à deux étapes)
  t.openPb(5, 2, { type: 'deuxEtapes', variant: 'B', a: 30, b: 12, c: 7 });
  t.play([
    '#pb-main .pb-next',
    `${B} .pb-eq-num[data-k="2"]`,
    `${B} .pb-eq-num[data-k="1"]`,
    `${B} .pb-sign[data-v="+"]`,
  ]);
  check('critère 10 : pour ➕, les deux ordres sont justes', () => [
    ev('missionErrors') === 0,
    one('.pb-step.on').dataset.step === 'calculer',
    one('#pb-main-e2 .pb-eq-num[data-k="1"]').textContent.trim() === '42',
  ]);
  ev('closeModal()');
}

// critère 15 : « est-ce possible ? »
async function possible() {
  for (const [spec, r] of [
    [{ type: 'possible', a: 25, b: 31 }, 'non'],
    [{ type: 'possible', a: 40, b: 22 }, 'oui'],
  ]) {
    t.openPb(r === 'non' ? 4 : 5, 2, spec);
    const story = ev('pbStory')(t.make(spec));
    const give = one('#pb-main .pb-bars[data-kind="possible"] .pb-bar[data-s="donner"]');
    const have = one('#pb-main .pb-bars[data-kind="possible"] .pb-bar[data-s="a"]');
    const max = Math.max(spec.a, spec.b);
    check(`critère 15 (${r}) : ni étiquette, ni signe, ni nombre ; le schéma de retrait déjà dessiné`, () => [
      all('#pb-main .pb-label, #pb-main .pb-sign, #pb-main .pb-eq-num, #pb-main .pb-num').length === 0,
      one('#pb-root').dataset.r === r,
      give.classList.contains('over') === (r === 'non'),
      have.style.width === `${Math.round((spec.a / max) * 100)}%`,
      give.style.width === `${Math.round((spec.b / max) * 100)}%`,
      json(t.sol()) === json(['#pb-main .pb-next[data-step="comprendre"]', `#pb-main .pb-yesno[data-v="${r}"]`]),
    ]);
    const from = t.spoken.length;
    const win = t.play(t.sol()) && (await t.won());
    check(`critère 15 (${r}) : la bonne réponse dit la phrase de B1 et gagne la mission`, () => [
      win,
      t.said(story.answer, from),
    ]);
    ev('closeModal()');
  }
  t.openPb(4, 2, { type: 'possible', a: 25, b: 31 });
  one('#pb-main .pb-next').click();
  const was = t.tuple(t.data());
  const again = await t.wrongThenNew(one('#pb-main .pb-yesno[data-v="oui"]'), () => t.tuple(t.data()) !== was);
  check('critère 15 : la mauvaise réponse est une erreur, puis un autre problème', () => [
    again,
    t.data().type !== 'possible',
  ]);
  ev('closeModal()');
}

(async () => {
  await t.start();
  section('Le trésor raconté : chaque type des paliers 4 et 5, jusqu’à la victoire');
  for (const p of [4, 5]) for (const type of T1[p].types) await victoire(p, type);
  section('Le trésor raconté : l’égalité sous le schéma (palier 4), deux étapes');
  egaliteSousSchema();
  deuxEtapes();
  section('Le trésor raconté : l’égalité seule (palier 5), est-ce possible ?');
  await egalite();
  await egaliteFausse();
  await possible();
  await t.finish("l'Île des Coffres (problems, paliers 4 et 5)");
})();
