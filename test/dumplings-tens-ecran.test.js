// L'Île des Squishy Dumplings : l'écran de « Les paniers de dix » (tens) :
// contrat C1 (ranger, lire, construire, écrire), regroupement et retour en
// arrière (S5), bonne réponse, puis une AUTRE question après une erreur
// (lignes 3 à 14 et 17 de la spec). Harnais : test/tools/dumplings.js.
const t = require('./tools/dumplings.js');
const { ev, json, check, section, all, one, tap, hidden, digits, stageTotal, said } = t;

const q = () => t.question();
const stage = () => one('#tens-stage');
const zones = () => [...stage().children].map((el) => el.className);
const sol = () => ev('gameSolution');
const opts = () => all('.tens-opt').map((o) => Number(o.dataset.v));
const until = (p, mode) => t.startUntil('tens', p, (x) => x.mode === mode);
const made = () => [
  all('.tens-pile').length,
  all('.tens-basket.full').length,
  all('.tens-loose .tens-dumpling').length,
];

/* ================= Ranger (palier 1, mode build) ================= */
function rangerOuverture() {
  t.startGame('tens', 1);
  const n = q().n;
  check('ligne 3 : n dumplings en vrac (data-id de 0 à n − 1), un panier vide de 10 cases', () => [
    stage().dataset.mode === 'build',
    json(zones()) === json(['tens-piles', 'tens-baskets', 'tens-loose', 'tens-heap']),
    n >= 11 && n <= 19,
    json(all('.tens-heap .tens-dumpling').map((el) => el.dataset.id)) === json([...Array(n).keys()].map(String)),
    all('.tens-baskets .tens-basket').length === 1,
    all('.tens-basket .tens-cell').length === 10,
    all('.tens-cell .tens-dumpling').length === 0,
    all('.tens-loose .tens-dumpling').length === 0,
    !one('.tens-basket').classList.contains('full'),
  ]);
  check('ligne 3 : les réponses sont dans la page, mais cachées ; la consigne de T12', () => [
    hidden('.tens-options'),
    opts().length === 3 && opts().includes(n),
    t.hintText() === 'Range les dumplings dans le panier !',
    t.sayBtn() === "Touche chaque dumpling pour le ranger dans le panier. Un panier, c'est dix places !",
  ]);
  check('ligne 17 : la solution touche chaque dumpling en vrac, puis la bonne réponse', () => [
    json(sol()) ===
      json([
        ...[...Array(n).keys()].map((i) => `.tens-heap .tens-dumpling[data-id="${i}"]`),
        `.tens-opt[data-v="${n}"]`,
      ]),
  ]);
  return n;
}
function rangerGestes(n) {
  const first = one('.tens-heap .tens-dumpling[data-id="3"]');
  first.click();
  check('ligne 4 : le dumpling touché (le même élément) saute dans la première case libre', () => [
    all('.tens-cell')[0].firstElementChild === first,
    first.dataset.id === '3' && first.classList.contains('tens-dumpling'),
    all('.tens-heap .tens-dumpling').length === n - 1,
    stageTotal() === n,
  ]);
  first.click();
  check("C1 : un dumpling rangé n'est plus touchable", () => [
    all('.tens-cell')[0].firstElementChild === first,
    all('.tens-cell .tens-dumpling').length === 1,
    ev('missionErrors') === 0,
  ]);
  tap('.tens-heap .tens-dumpling', 8);
  const before = one('.tens-basket').classList.contains('full');
  tap('.tens-heap .tens-dumpling');
  check('ligne 4 : au 10ᵉ dumpling, le panier est plein (classe full)', () => [
    !before,
    one('.tens-basket').classList.contains('full'),
    all('.tens-cell').every((c) => c.querySelectorAll('.tens-dumpling').length === 1),
    hidden('.tens-options') === n > 10,
  ]);
}
async function rangerFin(n) {
  const from = t.spoken.length,
    u = n - 10;
  tap('.tens-heap .tens-dumpling', u - 1);
  const stillHidden = hidden('.tens-options');
  tap('.tens-heap .tens-dumpling');
  check('ligne 5 : les suivants vont dans l’assiette ; le dernier rangé, les réponses apparaissent', () => [
    stillHidden,
    !hidden('.tens-options'),
    all('.tens-heap .tens-dumpling').length === 0,
    all('.tens-loose .tens-dumpling').length === u,
    stageTotal() === n,
    ev('missionErrors') === 0,
  ]);
  check('ligne 5 : la consigne devient « Combien de dumplings en tout ? », dite avec le bon accord', () => [
    t.hintText() === 'Combien de dumplings en tout ?',
    said(`Un panier de dix, et ${u} ${u === 1 ? 'tout seul' : 'tout seuls'}. Combien de dumplings en tout ?`, from),
  ]);
  tap(`.tens-opt[data-v="${n}"]`);
  const win = await t.won();
  check('ligne 14 : la bonne réponse gagne la mission', () => [win]);
  ev('closeModal()');
}

/* ================= Lire et écrire ================= */
function lire(p) {
  const found = until(p, 'read');
  const x = q();
  check(`ligne 7, palier ${p} : piles, paniers pleins et tout seuls montrent le nombre`, () => [
    found,
    stage().dataset.mode === 'read',
    json(zones()) === json(['tens-piles', 'tens-baskets', 'tens-loose']),
    stageTotal() === x.n,
    all('.tens-piles .tens-pile').length === x.piles,
    all('.tens-pile').every((el) => el.dataset.v === '100' && !el.querySelector('.tens-basket, .tens-dumpling')),
    all('.tens-baskets .tens-basket').length === x.baskets,
    all('.tens-basket').every((el) => el.classList.contains('full') && el.querySelectorAll('.tens-cell').length === 10),
    all('.tens-loose .tens-dumpling').length === x.loose,
    (p === 5) === x.piles > 0,
  ]);
  check(`palier ${p} : les réponses sont visibles ; la solution est la bonne réponse`, () => [
    !hidden('.tens-options'),
    json(opts()) === json(x.options),
    json(sol()) === json([`.tens-opt[data-v="${x.n}"]`]),
    !one('.tens-tools') && !one('#tens-expr'),
  ]);
}
function ecrire(p) {
  const found = until(p, 'write');
  const x = q();
  const shown = x.terms.join(' + ');
  check(`ligne 12, palier ${p} : l'écriture en grand, ses termes, la scène vide`, () => [
    found,
    stage().dataset.mode === 'write',
    stageTotal() === 0,
    one('#tens-expr').dataset.terms === x.terms.join(','),
    t.text(one('#tens-expr')) === shown,
    t.hintText() === `${shown} = ?`,
    t.sayBtn() === `${x.terms.join(' plus ')}. Quel nombre ça fait ?`,
    json(opts()) === json(x.options),
    json(sol()) === json([`.tens-opt[data-v="${x.n}"]`]),
  ]);
}

/* ================= Construire (mode make) ================= */
function construireOuverture(p) {
  const found = until(p, 'make');
  const x = q(),
    g = digits(x.n);
  check(`ligne 8, palier ${p} : la cible en grand, la scène vide, les boutons, aucun total affiché`, () => [
    found,
    stage().dataset.mode === 'make',
    one('#tens-target').dataset.target === String(x.n),
    t.text(one('#tens-target')) === String(x.n),
    stageTotal() === 0,
    ['#tens-add10', '#tens-add1', '#tens-undo', '#tens-ready'].every((s) => !!one(`.tens-tools ${s}`)),
    !!one('#tens-add100') === (p === 5),
    all('.tens-opt').length === 0,
    t.hintText() === `Prépare ${x.n} dumplings`,
    all('.tens-tools button').every((b) => (b.getAttribute('aria-label') || '').length > 3),
  ]);
  check(`ligne 17, palier ${p} : la solution suit les chiffres de la cible, puis « C'est prêt ! »`, () => [
    json(sol()) ===
      json([
        ...Array(p === 5 ? g.c : 0).fill('#tens-add100'),
        ...Array(p === 5 ? g.d : 10 * g.c + g.d).fill('#tens-add10'),
        ...Array(g.u).fill('#tens-add1'),
        '#tens-ready',
      ]),
  ]);
}
// S5 : 10 × +1 font un panier ; ↩️ revient à 9 tout seuls ; à 99, +1 et +10 ne font rien
function construireRegroupe() {
  until(2, 'make');
  const from = t.spoken.length;
  tap('#tens-undo');
  tap('#tens-add1', 9);
  const nine = json(made());
  tap('#tens-add1');
  check('ligne 9 (S5) : le 10ᵉ tout seul fait un panier plein, et la voix le dit', () => [
    nine === json([0, 0, 9]),
    json(made()) === json([0, 1, 0]),
    said('Dix dumplings : hop, un panier plein !', from),
    stageTotal() === 10,
  ]);
  tap('#tens-undo');
  check('ligne 10 (S5) : ↩️ rend les 9 tout seuls, regroupement défait', () => [json(made()) === json([0, 0, 9])]);
  tap('#tens-undo', 12);
  check('ligne 10 : sans rien à enlever, ↩️ ne fait rien', () => [json(made()) === json([0, 0, 0])]);
  tap('#tens-add10', 9);
  tap('#tens-add1', 9);
  const at99 = json(made());
  tap('#tens-add1');
  tap('#tens-add10');
  check('ligne 9 (S5) : à 99, « +1 » et « +10 » ne changent rien', () => [
    at99 === json([0, 9, 9]),
    json(made()) === at99,
    stageTotal() === 99,
    ev('missionErrors') === 0,
  ]);
}
function construireCent() {
  until(5, 'make');
  const from = t.spoken.length;
  tap('#tens-add10', 10);
  check('ligne 9, palier 5 : le 10ᵉ panier fait une pile de cent, et la voix le dit', () => [
    json(made()) === json([1, 0, 0]),
    said('Dix paniers : hop, une pile de cent !', from),
    stageTotal() === 100,
  ]);
  tap('#tens-add100', 8);
  tap('#tens-add10', 9);
  tap('#tens-add1', 9);
  tap('#tens-add100');
  tap('#tens-add10');
  tap('#tens-add1');
  check('ligne 9, palier 5 : le plafond est 999', () => [json(made()) === json([9, 9, 9])]);
}
async function construirePret() {
  until(2, 'make');
  const from = t.spoken.length,
    x = q(),
    g = digits(x.n);
  tap('#tens-ready');
  check("ligne 11 : « C'est prêt ! » sans rien : une phrase, aucun essai perdu, la même question", () => [
    said("Ajoute d'abord des paniers ou des dumplings !", from),
    ev('missionErrors') === 0,
    q() === x,
  ]);
  tap('#tens-add1');
  const wrong = await t.wrongThenNew(one('#tens-ready'));
  check('lignes 11 et 13 : un mauvais total est une erreur, puis une autre question', () => [
    wrong,
    q().mode !== x.mode || q().n !== x.n,
  ]);
  until(2, 'make');
  const y = digits(q().n);
  tap('#tens-add10', y.d);
  tap('#tens-add1', y.u);
  tap('#tens-ready');
  const win = await t.won();
  check('ligne 11 : le bon total gagne la mission', () => [win, g.d >= 2]);
  ev('closeModal()');
}

async function erreurChoix(p) {
  until(p, 'read');
  const x = q();
  const ok = await t.wrongThenNew(all('.tens-opt').find((o) => Number(o.dataset.v) !== x.n));
  check(`ligne 13, palier ${p} : une mauvaise réponse relance un autre (mode, nombre)`, () => [
    ok,
    q().mode !== x.mode || q().n !== x.n,
    ev('hint.kind') === 'tens',
  ]);
  ev('closeModal()');
}

(async () => {
  await t.start();
  section('Les paniers de dix : ranger (palier 1)');
  const n = rangerOuverture();
  rangerGestes(n);
  await rangerFin(n);
  section('Les paniers de dix : lire et écrire');
  [2, 3, 4, 5].forEach(lire);
  [3, 4, 5].forEach(ecrire);
  section('Les paniers de dix : construire');
  [2, 5].forEach(construireOuverture);
  construireRegroupe();
  construireCent();
  await construirePret();
  section('Les paniers de dix : erreurs (anti-devinette)');
  await erreurChoix(2);
  await erreurChoix(4);
  await t.finish("l'Île des Squishy Dumplings (tens, l'écran)");
})();
