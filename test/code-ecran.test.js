// L'Île des Coffres : l'écran du « Code secret » (code) : critères 24 à 29 de
// la spec, tables A2 (attributs de #code-root) et G2 (solution) : roues,
// palette, cartes d'indice, « Ouvrir », mauvais code, indices du compagnon.
// Harnais : test/tools/coffres.js.
const t = require('./tools/coffres.js');
const { ev, json, check, section, all, one, T2 } = t;

const CONSIGNE =
  'Trouve le code du cadenas. Chaque symbole ne sert qu’une fois. Touche un indice pour l’écouter.'.replace(/’/g, "'");
const wheel = (w) => one(`.code-wheel[data-w="${w}"]`);
const onWheels = () => all('.code-wheel').map((el) => el.dataset.s || '');
const selected = () => all('.code-wheel.sel').map((el) => Number(el.dataset.w));
const sym = (s) => one(`.code-sym[data-s="${s}"]`);
const open = () => one('#code-open');

function ouverture(p) {
  t.startCode(p);
  const x = t.lock();
  const R = T2[p];
  check(`A2, palier ${p} : #code-root porte les roues, la palette, le code et les indices`, () => [
    x.wheels === R.wheels && x.palette.length === R.palette && x.code.length === R.wheels,
    json(all('.code-sym').map((el) => el.dataset.s)) === json(x.palette),
    all('.code-wheel').length === R.wheels && json(onWheels()) === json(Array(R.wheels).fill('')),
    json(all('.code-clue').map((el) => [el.dataset.k, el.dataset.t])) === json(x.clues.map((k, i) => [String(i), k.t])),
    json(t.solutions(x)) === json([x.code]),
  ]);
  check(`G2, palier ${p} : la solution : chaque roue puis son symbole, enfin « Ouvrir » ; tout est déjà là`, () => [
    json(t.sol()) === json(t.codeSolution(x.code)),
    t.sol().every((s) => all(s).length === 1),
  ]);
  check(
    `critère 24, palier ${p} : la consigne est dite ; les indices sont dits à la suite aux paliers 1 et 2 seulement`,
    () => {
      const from = t.spoken.length - 1;
      const says = x.clues.map((k) => ev('codeClueSay')(k));
      return [
        one('.game-head h2').textContent === '🔐 Le code secret',
        t.said(CONSIGNE, from),
        says.every((s) => t.said(s, from)) === p <= 2,
        all('.code-clue').every(
          (el, i) => el.getAttribute('aria-label') === says[i] && !!el.querySelector('.code-box'),
        ),
      ];
    },
  );
  const from = t.spoken.length;
  all('.code-clue')[0].click();
  check(`critère 24, palier ${p} : toucher une carte d'indice redit sa phrase`, () => [
    t.said(ev('codeClueSay')(x.clues[0]), from),
    ev('missionErrors') === 0,
  ]);
  check(`critère 26, palier ${p} : au départ la roue de gauche est choisie, « Ouvrir » est grisé`, () => [
    json(selected()) === json([0]),
    open().disabled === true,
    !one('#challenge-timer'),
  ]);
  ev('closeModal()');
}

// critère 25 : la règle de sélection des roues, avec l'exemple de la spec (3 roues)
function selection() {
  t.startCode(2);
  const [a, b, c] = t.lock().palette;
  sym(a).click();
  const one1 = [json(onWheels()) === json([a, '', '']), json(selected()) === json([1])];
  sym(b).click();
  const two = [json(onWheels()) === json([a, b, '']), json(selected()) === json([2])];
  open().click();
  check('critère 25 : un symbole se pose sur la roue choisie, la sélection va à la roue vide de droite', () => [
    ...one1,
    ...two,
  ]);
  check('critère 26 : avec une roue vide, « Ouvrir » ne fait rien', () => [
    open().disabled === true,
    ev('missionErrors') === 0,
    !one('.win-box'),
  ]);
  wheel(0).click();
  const picked = json(selected()) === json([0]);
  sym(b).click();
  check('critère 25 et D26 : un symbole posé sur une autre roue quitte la première, jamais de doublon', () => [
    picked,
    json(onWheels()) === json([b, '', '']),
    json(selected()) === json([1]),
  ]);
  sym(a).click();
  sym(c).click();
  check(
    'critère 26 : toutes les roues pleines, « Ouvrir » s’active ; la sélection reste sur la dernière roue posée',
    () => [json(onWheels()) === json([b, a, c]), json(selected()) === json([2]), open().disabled === false],
  );
  wheel(0).click();
  sym(c).click();
  check('critère 25 : une roue pleine se change ; la roue vidée redevient vide, « Ouvrir » se grise', () => [
    json(onWheels()) === json([c, a, '']),
    json(selected()) === json([2]),
    open().disabled === true,
  ]);
  ev('closeModal()');
}

async function bonCode(p) {
  t.startCode(p);
  const x = t.lock();
  const from = t.spoken.length;
  const win = t.play(t.sol()) && (await t.won());
  check(`critère 27, palier ${p} : le bon code ouvre le cadenas : « Clic ! », mission gagnée`, () => [
    win,
    t.said("Clic ! Le cadenas s'ouvre !", from),
    x.code.length === T2[p].wheels,
  ]);
  ev('closeModal()');
}
async function mauvaisCode(p) {
  t.startCode(p);
  const x = t.lock();
  const lives = () => all('#lives-bar .life.on').length;
  const start = lives();
  // le code à l'envers : toujours faux (les symboles sont tous différents)
  t.play(t.codeSolution(x.code.slice().reverse()).slice(0, -1));
  const again = await t.wrongThenNew(open(), () => !!one('#code-root') && json(t.lock().code) !== json(x.code));
  const y = t.lock();
  check(`critère 28, palier ${p} : un mauvais code : une erreur, un AUTRE cadenas (data-code différent)`, () => [
    again,
    json(y.code) !== json(x.code),
    json(onWheels()) === json(Array(y.wheels).fill('')),
    json(t.sol()) === json(t.codeSolution(y.code)),
    lives() === start - 1,
  ]);
  const win = t.play(t.sol()) && (await t.won());
  check(`critère 28, palier ${p} : le nouveau cadenas s'ouvre`, () => [win]);
  ev('closeModal()');
}

async function indices(p) {
  t.startCode(p);
  const h = ev('hintsFor("code", hint.q)');
  t.hintBtn().click();
  const first = all('.code-clue.hint-glow').length;
  t.hintBtn().click();
  check(`critère 29, palier ${p} : les deux indices font briller des cartes, sans rien poser ni écarter`, () => [
    h.length === 2 && h[0].say !== h[1].say,
    first >= 1,
    all('.code-clue.hint-glow').length >= 1,
    all('#modal-body .hint-dim').length === 0,
    json(onWheels()) === json(Array(T2[p].wheels).fill('')),
  ]);
  const win = t.play(t.sol()) && (await t.won());
  check(`critère 29, palier ${p} : le cadenas reste gagnable après les indices`, () => [win]);
  ev('closeModal()');
}

(async () => {
  await t.start();
  section('Le code secret : ouverture (A2, G2), consigne et cartes');
  t.TIERS.forEach(ouverture);
  section('Le code secret : roues, palette, « Ouvrir »');
  selection();
  section('Le code secret : bon code, mauvais code');
  for (const p of t.TIERS) await bonCode(p);
  for (const p of [2, 3, 5]) await mauvaisCode(p);
  section('Le code secret : indices du compagnon (H2)');
  for (const p of [1, 4]) await indices(p);
  await t.finish("l'Île des Coffres (code, l'écran)");
})();
