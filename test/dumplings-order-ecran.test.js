// L'Île des Squishy Dumplings : l'écran de « La commande du chef » (order) :
// contrat C2 (ticket, palette, plateau), les deux phases « voir » et
// « préparer », servir (vide, juste, faux), tables et indices T5
// (lignes 19, 20, 22 à 24, 26 à 29 de la spec). Harnais : test/tools/dumplings.js.
const t = require('./tools/dumplings.js');
const { ev, json, check, section, all, one, tap, hidden, said, countKeys, sameCounts } = t;

const q = () => t.question();
const ATTRS = ['k', 'color', 'shape', 'face'];
const hasAll = (el) => ATTRS.every((a) => !!el.dataset[a]) && el.dataset.k.split('-').length === 3;
const plate = () => all('#order-plate .order-placed');
const pick = (k) => `.order-pick[data-k="${k}"]`;
// pose toute la commande sur le plateau
function prepare() {
  q().items.forEach((x) => tap(pick(x.k), x.qty));
}

function tables() {
  check('ligne 20 : orderRound(p) vaut la table T4, paliers 1 à 5', () =>
    t.TIERS.map((p) => json(ev(`orderRound(${p})`)) === json(t.T4[p])),
  );
  check('ligne 19 : « La commande du chef » est inscrit, dès 5 ans, jamais à 4 ans', () => [
    ev('GAME_TYPES.filter((k) => k === "order").length') === 1,
    ev('hasHints("order")'),
    json(ev('GAME_LIST.filter((x) => x.key === "order")')) ===
      json([{ key: 'order', emoji: '🥟', name: 'La commande du chef' }]),
    ev('gameTypesForAge(5).includes("order")') && ev('gameTypesForAge(8).includes("order")'),
    !ev('gameTypesForAge(4).includes("order")'),
  ]);
  check('ligne 27 : pas de minuteur, essais de Simon, compétence « logique », phrase de progrès', () => [
    ev('timerFor("order", 3)') === null && ev('timerFor("order", 5)') === null,
    json(ev('LIVES_TABLE.order')) === json({ 2: 3, 3: 3, 4: 2, 5: 2 }),
    json(ev('LIVES_TABLE.order')) === json(ev('LIVES_TABLE.simon')),
    ev('SKILL_GROUPS.find((x) => x.id === "logique").games.includes("order")'),
    ev('PROGRESS_CHEERS.order') === 'Tu retiens les commandes de mieux en mieux !',
  ]);
  for (let k = 0; k < 8; k++) t.startGame('order', 6, 6);
  check('ligne 16 : à 6 ans sur une île au palier 6, « order » se joue au palier 2 au plus', () => [
    ev('gameDiff()') <= 2,
    q().tier <= 2,
  ]);
}

function voir(p) {
  t.startGame('order', p);
  const x = q();
  const wanted = x.items.flatMap((i) => Array(i.qty).fill(i.k));
  check(`ligne 22, palier ${p} : le client montre son ticket, un dessin par dumpling, sorte après sorte`, () => [
    ['🐰', '🦊', '🐻', '🐨', '🐸', '🐧'].includes(t.text(one('.order-client'))),
    json(all('#order-ticket .order-item').map((el) => el.dataset.k)) === json(wanted),
    all('#order-ticket .order-item').every((el) => hasAll(el) && !!el.querySelector('svg')),
    !hidden('#order-ticket') && !hidden('#order-ready'),
  ]);
  check(`ligne 22, palier ${p} : la palette, le plateau et la cloche sont dans la page, mais cachés`, () => [
    hidden('#order-palette') && hidden('#order-plate') && hidden('#order-serve'),
    all('#order-palette .order-pick').length === t.T4[p].palette,
    json(all('.order-pick').map((el) => el.dataset.k)) === json(x.palette.map((k) => k.k)),
    all('.order-pick').every((el) => hasAll(el) && (el.getAttribute('aria-label') || '').length > 5),
    plate().length === 0,
  ]);
  check(`T12 et R2, palier ${p} : la consigne, et la phrase du client dite`, () => [
    one('.game-head h2').textContent === '🥟 La commande du chef',
    t.hintText() === 'Retiens la commande !',
    t.sayBtn() === ev('orderSay')(x),
    said(t.sayBtn()),
    /^Bonjour ! Je voudrais .* s'il te plaît !$/.test(t.sayBtn()),
  ]);
  check(`ligne 28, palier ${p} : la solution : « J'ai retenu », chaque dumpling commandé, la cloche`, () => [
    json(ev('gameSolution')) === json(['#order-ready', ...wanted.map(pick), '#order-serve']),
  ]);
}

function preparer(p) {
  t.startGame('order', p);
  const first = q().items[0].k;
  tap(pick(first));
  tap('#order-serve');
  check(`C2, palier ${p} : pendant « voir », la palette et la cloche ne font rien`, () => [
    plate().length === 0,
    ev('missionErrors') === 0,
    q().phase === 'see',
  ]);
  const from = t.spoken.length;
  tap('#order-ready');
  check(`ligne 23, palier ${p} : « J'ai retenu ! » cache le ticket, montre la palette et le plateau`, () => [
    q().phase === 'make',
    hidden('#order-ticket') && hidden('#order-ready'),
    !hidden('#order-palette') && !hidden('#order-plate') && !hidden('#order-serve'),
    t.hintText() === 'Prépare la commande',
    said('À toi ! Prépare la commande, puis touche la cloche.', from),
    !one('#challenge-timer'),
  ]);
  tap(pick(first), 2);
  const two = plate();
  check(`ligne 24, palier ${p} : chaque toucher pose une copie sur le plateau, dans l'ordre`, () => [
    two.length === 2,
    two.every((el, i) => hasAll(el) && el.dataset.k === first && el.dataset.i === String(i)),
    !!two[0].querySelector('svg'),
  ]);
  two[0].click();
  check(`ligne 24, palier ${p} : toucher un dumpling du plateau le retire, sans erreur`, () => [
    plate().length === 1,
    plate()[0].dataset.i === '0',
    ev('missionErrors') === 0,
  ]);
}

function plateauPlein() {
  t.startGame('order', 2);
  tap('#order-ready');
  const from = t.spoken.length;
  tap('.order-pick', 8);
  const quiet = !said('Le plateau est plein !', from);
  tap('.order-pick', 2);
  check('ligne 24 : 8 dumplings au plus ; au-delà, « Le plateau est plein ! », sans erreur', () => [
    quiet,
    plate().length === 8,
    said('Le plateau est plein !', from),
    ev('missionErrors') === 0,
  ]);
  ev('closeModal()');
}

async function servir(p) {
  t.startGame('order', p);
  tap('#order-ready');
  let from = t.spoken.length;
  const x = q();
  tap('#order-serve');
  check(`ligne 26, palier ${p} : servir un plateau vide : une phrase, aucun essai perdu`, () => [
    said('Ton plateau est vide : ajoute des dumplings !', from),
    ev('missionErrors') === 0,
    q() === x,
  ]);
  prepare();
  tap(pick(x.items[0].k));
  const wrong = await t.wrongThenNew(one('#order-serve'));
  check(`ligne 26, palier ${p} : un dumpling de trop est une erreur, puis une AUTRE commande`, () => [
    wrong,
    ev('orderSignature')(q()) !== ev('orderSignature')(x),
    q().phase === 'see' && !hidden('#order-ticket'),
  ]);
  tap('#order-ready');
  // l'ordre ne compte pas : on pose la commande à l'envers
  q()
    .items.slice()
    .reverse()
    .forEach((i) => tap(pick(i.k), i.qty));
  from = t.spoken.length;
  const same = sameCounts(countKeys(plate()), countKeys(all('#order-ticket .order-item')));
  tap('#order-serve');
  const win = await t.won();
  check(`ligne 26, palier ${p} : la commande exacte gagne, dans n'importe quel ordre`, () => [
    same,
    win,
    said("Miam ! C'est exactement ma commande !", from),
  ]);
  ev('closeModal()');
}

const SEE1 = "Regarde bien : quelles sortes, et combien de chaque ? Dis-le tout bas, puis touche « J'ai retenu ».";
const SEE2 = {
  1: 'Commence par celle-ci : retiens sa couleur, et combien il y en a.',
  2: 'Commence par celle-ci : retiens sa couleur, et combien il y en a.',
  3: 'Commence par celle-ci : retiens sa couleur, sa forme, et combien il y en a.',
  4: 'Commence par celle-ci : retiens sa couleur, sa forme, et combien il y en a.',
  5: 'Commence par celle-ci : retiens sa couleur, sa forme, son visage, et combien il y en a.',
};
const MAKE1 = 'Souviens-toi : quelles sortes de dumplings, et combien de chaque ? Pose-les un par un sur le plateau.';
const MAKE2 = 'Je te remontre la commande un petit instant. Regarde bien !';
const lv = () => ev('hintsFor("order", hint.q)');

function indicesVoir(p) {
  t.startGame('order', p);
  const h = lv();
  const first = q().items[0];
  check(`T5, palier ${p}, phase « voir » : la méthode, puis la première sorte qui brille`, () => [
    h.length === 2 && h[0].say === SEE1 && h[1].say === SEE2[p],
    h[0].fx.glow === '#order-ticket',
    h[1].fx.glow === `#order-ticket .order-item[data-k="${first.k}"]`,
    !h[0].fx.dim && !h[1].fx.dim && !h[1].fx.run,
  ]);
  t.hintBtn().click();
  t.hintBtn().click();
  check(`T5, palier ${p} : les indices de « voir » ne changent rien au jeu`, () => [
    all('.order-item.hint-glow').length === first.qty,
    q().phase === 'see' && plate().length === 0,
    all('#modal-body .hint-dim').length === 0,
  ]);
}
async function indicesPreparer(p) {
  t.startGame('order', p);
  tap('#order-ready');
  const h = lv();
  check(`T5, palier ${p}, phase « préparer » : se souvenir, puis le ticket remontré`, () => [
    h.length === 2 && h[0].say === MAKE1 && h[1].say === MAKE2,
    h[0].fx.glow === '#order-palette',
    typeof h[1].fx.run === 'function' && !h[1].fx.dim,
  ]);
  t.hintBtn().click();
  const still = hidden('#order-ticket');
  t.hintBtn().click();
  const shownNow = !hidden('#order-ticket');
  const usable = !hidden('#order-palette') && plate().length === 0;
  // 3 s aux paliers 1 et 2, 2 s ensuite (10 fois plus court ici)
  const back = await t.waitFor(() => hidden('#order-ticket'), 1500);
  check(`ligne 29, palier ${p} : l'indice 2 remontre le ticket un instant, sans rien poser`, () => [
    still,
    shownNow,
    usable,
    back,
    plate().length === 0,
  ]);
  prepare();
  tap('#order-serve');
  const win = await t.won();
  check(`palier ${p} : la commande reste gagnable après les indices`, () => [win]);
  ev('closeModal()');
}

(async () => {
  await t.start();
  section('La commande du chef : tables');
  tables();
  section('La commande du chef : voir, puis préparer');
  t.TIERS.forEach(voir);
  [1, 3, 5].forEach(preparer);
  plateauPlein();
  section('La commande du chef : servir');
  for (const p of [1, 2, 5]) await servir(p);
  section('La commande du chef : indices (T5)');
  t.TIERS.forEach(indicesVoir);
  for (const p of [2, 4]) await indicesPreparer(p);
  await t.finish("l'Île des Squishy Dumplings (order, l'écran)");
})();
