// L'Île des Coffres : l'écran de « Le trésor raconté » (problems), l'enfant
// fait tout (mode n = 2) : critères 3 à 9, 11 à 13 et 19 de la spec, tables
// V1 (vignettes), A1 (attributs), F1 (longueurs), G1 (solution), paliers 1 à 3.
// Paliers 4 et 5 : test/problems-paliers.test.js. Harnais : test/tools/coffres.js.
const t = require('./tools/coffres.js');
const { ev, json, check, section, all, one, T1 } = t;

const EMO = { grignote: '🐭', kadi: '🔒', zap: '🦸‍♂️' };
const OBJ = '🪙';
// V1 : les vignettes, dans l'ordre : [personnages, nombre d'objets (null : phrase sans nombre)]
const V1 = {
  reunion: (n) => [[['p'], n.a], [['p'], n.b], [['p']]],
  ajout: (n) => [[['p'], n.a], [['q'], n.b], [['p']]],
  retrait: (n) => [[['p'], n.a], [['p'], n.b], [['p']]],
  partie: (n) => [[['p', 'q'], n.t], [['p'], n.a], [['q']]],
  ajoutInconnu: (n) => [[['p'], n.a], [['q'], null], [['p'], n.t], [['q']]],
  compPlus: (n) => [[['p'], n.a], [['q'], n.b], [['q']]],
  compEcart: (n) => [[['p'], n.a], [['q'], n.b], [['q']]],
};
const who = (codes) => codes.map((c) => (c === 'p' ? EMO.grignote : EMO.kadi));
// critère 3 : une vignette ne montre que ses personnages, ses objets, un nombre ou « ? »
function vignetteOk(el, [codes, n], isQ) {
  const has = (sel) => el.querySelectorAll(sel).length;
  const count = el.querySelector('.pb-count');
  const plain = [
    [...el.children].every((k) => k.matches('.pb-who, .pb-obj, .pb-count, .pb-qm')),
    [...el.childNodes].every((x) => x.nodeType !== 3 || !x.textContent.trim()),
    json([...el.querySelectorAll('.pb-who')].map((x) => x.textContent)) === json(who(codes)),
    [...el.querySelectorAll('.pb-obj')].every((x) => x.textContent === OBJ),
    el.hasAttribute('data-q') === isQ && has('.pb-qm') === (isQ ? 1 : 0),
  ].every(Boolean);
  return plain && objectsOk({ objs: has('.pb-obj'), count: count && count.textContent }, n, isQ);
}
// le nombre d'objets : un seul pour la question, aucun sans nombre, n jusqu'à 10, sinon le nombre écrit
function objectsOk(seen, n, isQ) {
  if (isQ) return seen.objs === 1 && !seen.count;
  if (n == null) return seen.objs === 0 && !seen.count;
  return n <= 10 ? seen.objs === n && !seen.count : seen.objs === 1 && seen.count === String(n);
}

function ouverture(p, type) {
  const spec = t.sample(type, p);
  t.openPb(p, 2, spec);
  const n = t.data();
  const rep = T1[p].rep;
  const where = `palier ${p}, ${type}`;
  check(`critère 3, ${where} : les 4 étapes en haut, « Comprendre » allumée`, () => [
    json(all('.pb-steps .pb-step').map((x) => x.dataset.step)) ===
      json(['comprendre', 'dessiner', 'calculer', 'repondre']),
    json(all('.pb-steps .pb-step').map((x) => x.textContent.trim())) ===
      json(['👂 Comprendre', '📊 Dessiner', '🧮 Calculer', '💬 Répondre']),
    json(all('.pb-steps .pb-step.on').map((x) => x.dataset.step)) === json(['comprendre']),
  ]);
  check(`critère 3 et V1, ${where} : les vignettes, sans décor (personnages, objets, « ? »)`, () => {
    const vs = all('#pb-main .pb-scene .pb-vignette');
    const want = V1[type](n);
    return [vs.length === want.length, ...vs.map((el, i) => vignetteOk(el, want[i], i === want.length - 1))];
  });
  check(`A1, ${where} : #pb-root porte le type, les nombres et le résultat`, () => {
    const ds = one('#pb-root').dataset;
    const txt = (v) => (v ? String(v) : '');
    return [
      ds.type === type,
      ds.a === txt(spec.a) &&
        ds.b === txt(spec.b) &&
        ds.c === '' &&
        ds.t === txt(spec.t || (type === 'reunion' || type === 'ajout' ? spec.a + spec.b : 0)),
      ds.r === t.resultOf(n),
    ];
  });
  check(`critère 19 et G1, ${where} : gameSolution vaut la liste de la spec, tout est déjà dans la fenêtre`, () => [
    json(t.sol()) === json(t.expectedSolution(n, rep, 2)),
    t.sol().every((s) => !!one(s)),
    t.sol().every((s) => all(s).length === 1),
  ]);
  return { n, rep, where };
}

async function victoire(p, type) {
  const { n, where } = ouverture(p, type);
  const story = ev('pbStory')(t.make(t.sample(type, p)));
  check(`critère 4, ${where} : l'énoncé est dit, phrase par phrase ; 🔈 le redit en entier`, () => [
    story.lines.every((l) => t.said(l.text)),
    one('.puzzle-hint .btn-speak').dataset.say === story.lines.map((l) => l.text).join(' '),
    !!one('#pb-main .pb-vignette[data-q]'),
  ]);
  const from = t.spoken.length;
  const played = t.play(t.sol());
  const answer = one('#pb-main .pb-answer');
  check(`critère 13, ${where} : le « ? » devient le nombre, la phrase réponse est écrite et dite`, () => [
    played,
    answer.textContent.trim() === t.resultOf(n),
    t.text(one('#pb-main .pb-sentence')) === story.answer,
    t.said(story.answer, from),
    json(all('.pb-steps .pb-step.on').map((x) => x.dataset.step)) === json(['repondre']),
  ]);
  check(`critère 19, ${where} : la mission est gagnée, sans erreur`, () => [ev('missionErrors') === 0]);
  const win = await t.won();
  check(`critère 13, ${where} : victoire`, () => [win]);
  ev('closeModal()');
}

// critères 5 et 6 : les objets à toucher (concret, palier 1)
async function concret() {
  t.openPb(1, 2, t.sample('ajout', 1));
  check('critère 5 : avant « 👉 », toucher un objet ne fait rien', () => {
    one('#pb-main .pb-scene .pb-token[data-i="0"]').click();
    return [all('#pb-main-e1 .pb-chest .pb-token').length === 0, ev('missionErrors') === 0];
  });
  one('#pb-main .pb-next').click();
  const from = t.spoken.length;
  t.play([0, 1, 2].map((i) => `#pb-main .pb-scene .pb-token[data-i="${i}"]`));
  check('critère 5 : chaque objet touché va dans le coffre, la voix compte', () => [
    all('#pb-main-e1 .pb-chest .pb-token').length === 3,
    json(t.spoken.slice(from)) === json(['un', 'deux', 'trois']),
    one('.pb-step.on').dataset.step === 'dessiner',
  ]);
  t.play([3, 4].map((i) => `#pb-main .pb-token[data-i="${i}"]`));
  check('critère 5 : tous les objets dans le coffre, « Dessiner » se termine seule ; critère 11 : 3 choix', () => [
    all('#pb-main-e1 .pb-chest .pb-token').length === 5,
    one('.pb-step.on').dataset.step === 'calculer',
    !t.hidden('#pb-main-e1 .pb-nums'),
    all('#pb-main-e1 .pb-num').length === 3,
  ]);
  ev('closeModal()');

  t.openPb(1, 2, t.sample('retrait', 1));
  check('critère 6 : pour un retrait, le coffre contient déjà les a objets', () => [
    all('#pb-main-e1 .pb-chest .pb-token').length === 5,
    all('#pb-main .pb-scene .pb-token').length === 0,
  ]);
  t.play(['#pb-main .pb-next', '#pb-main-e1 .pb-chest .pb-token[data-i="0"]']);
  const before = t.data();
  const again = await t.wrongThenNew(
    one('#pb-main-e1 .pb-done'),
    () => one('#pb-root') && t.tuple(t.data()) !== t.tuple(before),
  );
  check('critère 6 : « C’est fait » avec le mauvais nombre d’objets sortis : une erreur, un autre problème', () => [
    again,
    t.data().type !== 'retrait',
  ]);
  ev('closeModal()');
}

// critère 7 : au palier 2, les objets se rangent en barres
function concretBarre() {
  t.openPb(2, 2, t.sample('partie', 2));
  const s = t.stagesOf(t.data())[0];
  check('critère 7 : le schéma est dans la fenêtre, caché tant qu’on manipule', () => [
    t.hidden('#pb-main-e1 .pb-bars'),
    t.hidden('#pb-main-e1 .pb-signs'),
  ]);
  const from = t.spoken.length;
  t.play(t.sol().slice(0, 4)); // 👉, deux objets sortis, « C'est fait »
  check('critère 7 : au clic qui termine Dessiner, le schéma de L1 apparaît rempli', () => [
    !t.hidden('#pb-main-e1 .pb-bars'),
    one(`#pb-main-e1 .pb-slot[data-s="${s.s1}"]`).textContent.trim() === String(s.n1),
    one(`#pb-main-e1 .pb-slot[data-s="${s.s2}"]`).textContent.trim() === String(s.n2),
    one(`#pb-main-e1 .pb-slot[data-s="${s.sq}"]`).textContent.trim() === '?',
    t.said('Regarde : les objets deviennent des barres.', from),
    !t.hidden('#pb-main-e1 .pb-signs') && t.hidden('#pb-main-e1 .pb-nums'),
  ]);
  check('critère 7 : les largeurs suivent la règle des longueurs', () => widths('#pb-main-e1', s));
  ev('closeModal()');
}
// F1 : chaque barre, celle du « ? » comprise, à sa vraie longueur (échelle : le plus grand nombre)
function widths(B, s) {
  const val = { [s.s1]: s.n1, [s.s2]: s.n2, [s.sq]: s.r };
  const max = Math.max(s.n1, s.n2, s.r);
  return Object.keys(val).map(
    (k) => one(`${B} .pb-bar[data-s="${k}"]`).style.width === `${Math.round((val[k] / max) * 100)}%`,
  );
}

// critères 8 et 9 : barres, étiquettes, opération (palier 3)
async function barres(type) {
  t.openPb(3, 2, t.sample(type, 3));
  const n = t.data();
  const s = t.stagesOf(n)[0];
  const B = '#pb-main-e1';
  check(`critère 8, ${type} : le schéma vide, à ses vraies longueurs, et trois étiquettes`, () => [
    ...widths(B, s),
    all(`${B} .pb-slot`).every((x) => x.textContent.trim() === ''),
    json(all(`${B} .pb-label`).map((x) => [x.dataset.l, x.textContent.trim()])) ===
      json([
        ['n1', String(s.n1)],
        ['n2', String(s.n2)],
        ['q', '?'],
      ]),
    all(`${B} .pb-eq-text`).length === 0,
  ]);
  if (type.startsWith('comp'))
    check(`critère 8, ${type} : chaque barre de comparaison porte l'emoji de son personnage`, () => [
      json(all(`${B} .pb-face`).map((x) => x.textContent.trim())) === json([EMO.kadi, EMO.grignote]),
    ]);
  // le « ? » ira dans la case d'un nombre connu (jamais une autre partie : elles sont interchangeables)
  const wrongSlot = { partie: 'tout', compEcart: 'grand', ajoutInconnu: 'tout' }[type];
  const [l, slot, value] = s.s1 === wrongSlot ? ['n2', s.s2, s.n2] : ['n1', s.s1, s.n1];
  t.play(['#pb-main .pb-next', `${B} .pb-label[data-l="${l}"]`, `${B} .pb-slot[data-s="${slot}"]`]);
  check(`critère 8, ${type} : une étiquette posée dans la bonne case s'y fixe`, () => [
    one(`${B} .pb-slot[data-s="${slot}"]`).textContent.trim() === String(value),
    t.hidden(`${B} .pb-label[data-l="${l}"]`),
    ev('missionErrors') === 0,
  ]);
  one(`${B} .pb-label[data-l="q"]`).click();
  const before = t.data();
  const again = await t.wrongThenNew(
    one(`${B} .pb-slot[data-s="${wrongSlot}"]`),
    () => t.tuple(t.data()) !== t.tuple(before),
  );
  check(
    `critère 8, ${type} : le « ? » posé dans une mauvaise case : une erreur, un autre problème d'un autre type`,
    () => [again, t.data().type !== type],
  );
  ev('closeModal()');
}
async function operation() {
  t.openPb(3, 2, t.sample('reunion', 3));
  const B = '#pb-main-e1';
  // les deux parties sont interchangeables : n1 dans partie2, n2 dans partie1
  t.play([
    '#pb-main .pb-next',
    `${B} .pb-label[data-l="n1"]`,
    `${B} .pb-slot[data-s="partie2"]`,
    `${B} .pb-label[data-l="n2"]`,
    `${B} .pb-slot[data-s="partie1"]`,
  ]);
  const quiet = t.hidden(`${B} .pb-signs`);
  t.play([`${B} .pb-label[data-l="q"]`, `${B} .pb-slot[data-s="tout"]`]);
  check('critère 8 : les deux parties sont interchangeables ; le schéma rempli, on choisit l’opération', () => [
    ev('missionErrors') === 0,
    quiet,
    !t.hidden(`${B} .pb-signs`),
    all(`${B} .pb-sign`).length === 2,
    t.hidden(`${B} .pb-nums`),
  ]);
  const before = t.data();
  const again = await t.wrongThenNew(one(`${B} .pb-sign[data-v="-"]`), () => t.tuple(t.data()) !== t.tuple(before));
  check('critère 9 : une mauvaise opération est une erreur, puis un autre problème', () => [again]);
  ev('closeModal()');
}

// critères 11 et 12 : un mauvais résultat, les essais, la relance
async function erreurs() {
  t.openPb(3, 2, t.sample('partie', 3));
  const lives = () => all('#lives-bar .life.on').length;
  const start = lives();
  t.play(t.sol().slice(0, -2));
  const r = Number(t.resultOf(t.data()));
  check('critère 11 : 4 nombres proposés au palier 3, dont le résultat', () => [
    all('#pb-main-e1 .pb-num').length === 4,
    all('#pb-main-e1 .pb-num').some((b) => Number(b.dataset.v) === r),
  ]);
  const before = t.data();
  const wrong = all('#pb-main-e1 .pb-num').find((b) => Number(b.dataset.v) !== r);
  const again = await t.wrongThenNew(wrong, () => t.tuple(t.data()) !== t.tuple(before));
  check('critère 12 : un mauvais résultat : une erreur, un essai en moins, un AUTRE problème (autre type)', () => [
    again,
    start === 4 && lives() === 3,
    t.data().type !== 'partie',
    json(t.sol()) === json(t.expectedSolution(t.data(), 'barres', 2)),
    one('.pb-step.on').dataset.step === 'comprendre',
  ]);
  const noted = ev('missionErrors') === 1;
  const win = t.play(t.sol()) && (await t.won());
  check('critère 12 : le nouveau problème se gagne ; l’erreur reste notée', () => [win, noted]);
  ev('closeModal()');
}

(async () => {
  await t.start();
  section('Le trésor raconté : chaque type, de l’ouverture à la victoire (paliers 1 à 3)');
  for (const p of [1, 2, 3]) for (const type of T1[p].types) await victoire(p, type);
  section('Le trésor raconté : objets à toucher (concret, concret-barre)');
  await concret();
  concretBarre();
  section('Le trésor raconté : barres, étiquettes, opération, erreurs');
  for (const type of ['partie', 'compEcart', 'ajoutInconnu']) await barres(type);
  await operation();
  await erreurs();
  await t.finish("l'Île des Coffres (problems, l'écran)");
})();
