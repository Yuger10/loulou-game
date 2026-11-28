// L'Île des Coffres : « Le trésor raconté », l'exemple résolu et son
// estompage : critères 12, 16 et 17 de la spec, tables E1, N1 et G1 (modes
// n = 0, 1, 2), relance d'un jumeau (D25), essais épuisés (D31).
// Harnais : test/tools/coffres.js.
const t = require('./tools/coffres.js');
const { ev, json, check, section, all, one, T1 } = t;

const TWIN_DONE = "J'ai dessiné l'histoire. À toi de calculer !";
const exBtn = (k) => `#pb-ex .pb-next[data-step="ex${k}"]`;
const shownEx = () =>
  all('#pb-ex .pb-next')
    .filter((b) => !b.closest('[hidden]'))
    .map((b) => b.dataset.step);

// critère 16 et N1 : l'exemple pas à pas (palier 1, ajout), puis le jumeau
async function exemple() {
  t.openPb(1, 0, { type: 'ajout', a: 1, b: 4, ex: { type: 'ajout', a: 3, b: 2 } });
  check('G1, n = 0 : les 5 flèches de l’exemple, puis le résultat et la réponse du jumeau', () => [
    json(t.sol()) ===
      json([1, 2, 3, 4, 5].map(exBtn).concat(['#pb-twin-e1 .pb-num[data-v="5"]', '#pb-twin .pb-answer'])),
    json(t.sol()) === json(t.expectedSolution(t.data(), 'concret', 0)),
    t.sol().every((s) => all(s).length === 1),
  ]);
  check('critère 16 : l’exemple est montré, le jumeau attend caché ; #pb-root décrit le jumeau', () => [
    !t.hidden('#pb-ex') && t.hidden('#pb-twin'),
    !one('#pb-main'),
    t.tuple(t.data()) === 'ajout||1|4|0|5',
    all('#pb-ex .pb-obj').every((x) => x.textContent === '🔑'),
    all('#pb-twin .pb-obj').every((x) => x.textContent === '🪙'),
    json(shownEx()) === json(['ex1']),
  ]);
  check('N1 : à l’ouverture, l’énoncé de l’exemple puis « J’écoute l’histoire… »', () => [
    t.said('Grignote a 3 clés. Kadi lui en donne 2. Combien de clés a Grignote maintenant ?'),
    t.said("J'écoute l'histoire. La question, c'est : Combien de clés a Grignote maintenant ?"),
  ]);
}
async function exemplePasAPas() {
  let from = t.spoken.length;
  one(exBtn(1)).click();
  check('N1, pas 2 : le compagnon met les objets dans le coffre', () => [
    t.said('Je mets les clés dans le coffre, une par une.', from),
    all('#pb-ex-e1 .pb-chest .pb-token').length === 5,
    json(shownEx()) === json(['ex2']),
  ]);
  from = t.spoken.length;
  one(exBtn(2)).click();
  check('N1, pas 3 : il calcule, le résultat s’allume', () => [
    t.said("On cherche le tout, alors j'ajoute : 3 plus 2, ça fait 5.", from),
    json(all('#pb-ex-e1 .pb-num.on').map((b) => b.dataset.v)) === json(['5']),
  ]);
  from = t.spoken.length;
  one(exBtn(3)).click();
  check('N1, pas 4 : il répond à la question', () => [
    t.said('Je réponds à la question : Grignote a 5 clés maintenant.', from),
    one('#pb-ex .pb-answer').textContent.trim() === '5',
  ]);
  from = t.spoken.length;
  one(exBtn(4)).click();
  check('N1, pas 5 : « À toi, maintenant ! »', () => [
    t.said('À toi, maintenant !', from),
    json(shownEx()) === json(['ex5']),
    !t.hidden('#pb-ex'),
  ]);
  from = t.spoken.length;
  one(exBtn(5)).click();
  check('critère 16 : le jumeau arrive, le compagnon a compris et dessiné, l’enfant calcule', () => [
    t.hidden('#pb-ex') && !t.hidden('#pb-twin'),
    t.said('Grignote a une pièce. Kadi lui en donne 4. Combien de pièces a Grignote maintenant ?', from),
    t.said("J'écoute l'histoire. La question, c'est : Combien de pièces a Grignote maintenant ?", from),
    t.said(TWIN_DONE, from),
    all('#pb-twin-e1 .pb-chest .pb-token').length === 5,
    one('.pb-step.on').dataset.step === 'calculer',
    one('.puzzle-hint .btn-speak').dataset.say.startsWith('Grignote a une pièce.'),
  ]);
  const win = t.play(t.sol().slice(5)) && (await t.won());
  check('critère 16 : le jumeau se gagne', () => [win, ev('missionErrors') === 0]);
  ev('closeModal()');
}

// G1 : chaque type à chaque palier, exemple puis jumeau, joué jusqu'à la victoire
async function tousLesTypes() {
  for (const p of t.TIERS)
    for (const type of T1[p].types) {
      t.openPb(p, 0, t.sample(type, p));
      const expected = t.expectedSolution(t.data(), T1[p].rep, 0);
      const same = json(t.sol()) === json(expected) && t.sol().every((s) => all(s).length === 1);
      const steps = all('#pb-ex .pb-next').length === t.exSteps(t.data());
      const win = t.play(t.sol()) && (await t.won());
      check(`G1, n = 0, palier ${p}, ${type} : la liste de la spec, jouée jusqu'à la victoire`, () => [
        same,
        steps,
        win,
        ev('missionErrors') === 0,
      ]);
      ev('closeModal()');
    }
}
function exemplesComplets() {
  t.openPb(5, 0, { type: 'deuxEtapes', variant: 'A', a: 30, b: 12, c: 7 });
  check('G1, quatrième exemple : palier 5, deuxEtapes, 7 flèches puis les deux calculs', () => [
    json(t.sol()) ===
      json(
        [1, 2, 3, 4, 5, 6, 7]
          .map(exBtn)
          .concat(['#pb-twin-e1 .pb-num[data-v="42"]', '#pb-twin-e2 .pb-num[data-v="35"]', '#pb-twin .pb-answer']),
      ),
  ]);
  t.play(t.sol().slice(0, 7));
  const from = t.spoken.length;
  const drawn2 = t.hidden('#pb-twin-e2');
  one('#pb-twin-e1 .pb-num[data-v="42"]').click();
  check('N1 : dans le jumeau, le dessin 2 et son texte arrivent seuls après le bon calcul 1', () => [
    drawn2,
    !t.hidden('#pb-twin-e2'),
    t.said("Maintenant, le tout, c'est 42. Une partie s'en va : je cherche l'autre partie.", from),
    json(all('#pb-twin-e2 .pb-eq-case').map((x) => x.textContent.trim())) === json(['42', '7']),
  ]);
  ev('closeModal()');
  t.openPb(3, 1, { type: 'partie', t: 8, a: 3 });
  check('G1, premier exemple : n = 1, palier 3, partie (t = 8, a = 3)', () => [
    json(t.sol()) ===
      json([
        '#pb-main .pb-next[data-step="comprendre"]',
        '#pb-main-e1 .pb-label[data-l="n1"]',
        '#pb-main-e1 .pb-slot[data-s="tout"]',
        '#pb-main-e1 .pb-label[data-l="n2"]',
        '#pb-main-e1 .pb-slot[data-s="partie1"]',
        '#pb-main-e1 .pb-label[data-l="q"]',
        '#pb-main-e1 .pb-slot[data-s="partie2"]',
        '#pb-main-e1 .pb-sign[data-v="-"]',
        '#pb-main-e1 .pb-num[data-v="5"]',
        '#pb-main .pb-answer',
      ]),
  ]);
  check('critère 16, n = 1 : le compagnon fait seulement Comprendre', () => [
    t.said("J'écoute l'histoire. La question, c'est : Combien de pièces a Kadi ?"),
    t.said("J'ai écouté avec toi. À toi de dessiner !"),
    !one('#pb-ex') && !one('#pb-twin'),
    all('#pb-main-e1 .pb-slot').every((x) => x.textContent.trim() === ''),
  ]);
  ev('closeModal()');
}

// critère 12 et D25 : une erreur pendant le jumeau relance un jumeau seul
async function relanceJumeau() {
  t.openPb(3, 0, { type: 'compEcart', a: 6, b: 13, ex: { type: 'compEcart', a: 4, b: 9 } });
  t.play(t.sol().slice(0, 5));
  const failed = t.tuple(t.data());
  const again = await t.wrongThenNew(one('#pb-twin-e1 .pb-sign[data-v="+"]'), () => t.tuple(t.data()) !== failed);
  const n = t.data();
  check('D25 : même type, autres nombres que le jumeau raté et que l’exemple, autre objet que l’exemple', () => [
    again,
    n.type === 'compEcart',
    ![failed, 'compEcart||4|9|0|0'].includes(t.tuple(n)),
    all('#pb-twin .pb-obj').every((x) => x.textContent !== '🔑'),
  ]);
  check('D25 : l’exemple reste dans la page, caché ; la solution est celle du jumeau seul', () => [
    !!one('#pb-ex') && t.hidden('#pb-ex') && !t.hidden('#pb-twin'),
    json(t.sol()) === json(t.expectedSolution(n, 'barres', 'twin')),
    !t.sol().some((s) => s.includes('pb-ex')),
    all('#lives-bar .life.on').length === 3,
  ]);
  const noted = ev('missionErrors') === 1;
  const win = t.play(t.sol()) && (await t.won());
  check('D25 : le nouveau jumeau se gagne', () => [win, noted]);
  ev('closeModal()');
}

// critère 17 : à plusieurs, pas d'exemple résolu
function aPlusieurs() {
  t.startPb(2, 0);
  const solo = !!one('#pb-ex');
  ev('closeModal(); party.active = true; playGame("problems")');
  const multi = !one('#pb-ex') && !!one('#pb-main');
  ev('party.active = false; closeModal()');
  check('critère 17 : seul, sans mission au palier : un exemple ; à plusieurs : jamais', () => [solo, multi]);
}

// D31 : les essais épuisés comptent comme une mission ratée, E1 ne change pas
async function essaisEpuises() {
  t.openPb(4, 0, t.sample('partie', 4));
  t.play(t.sol().slice(0, 5));
  for (let k = 0; k < 3; k++) {
    const was = t.tuple(t.data());
    one('#pb-twin-e1 .pb-sign[data-v="+"]').click();
    if (k < 2) await t.waitFor(() => t.tuple(t.data()) !== was, 1500);
  }
  const failed = await t.waitFor(() => !!one('.fail-box'), 1500);
  check('D31 : au palier 4, trois erreurs épuisent les essais : mission ratée, enregistrée', () => [
    failed,
    ev('state.skills.problems.fails') === 1,
    ev('state.skills.problems.atLvl.length') === 1,
  ]);
  ev('closeModal(); playGame("problems")');
  check('D31 : la mission suivante est en mode n = 1, sans qu’aucun jumeau ait été réussi', () => [
    !one('#pb-ex') && !!one('#pb-main'),
    t.said("J'ai écouté avec toi. À toi de dessiner !"),
  ]);
  ev('closeModal()');
}

(async () => {
  await t.start();
  section('Le trésor raconté : l’exemple résolu, pas à pas (N1)');
  await exemple();
  await exemplePasAPas();
  exemplesComplets();
  section('Le trésor raconté : exemple puis jumeau, chaque type (G1)');
  await tousLesTypes();
  section('Le trésor raconté : relance du jumeau, à plusieurs, essais épuisés');
  await relanceJumeau();
  aPlusieurs();
  await essaisEpuises();
  await t.finish("l'Île des Coffres (problems, l'exemple résolu)");
})();
