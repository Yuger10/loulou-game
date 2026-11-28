// L'Île des Squishy Dumplings : les indices de « Les paniers de dix » (table T3,
// ligne 18 de la spec) et ses consignes (T12) : deux niveaux aux textes exacts,
// jamais le total, une seule réponse écartée au niveau 2 avec 4 choix.
// Harnais : test/tools/dumplings.js.
const t = require('./tools/dumplings.js');
const { ev, json, check, section, all, one } = t;

// les indices d'une question construite : mode, nombre, palier, et ce qui change (rangés, dessin)
const hintsWith = ([mode, n, p], more) =>
  ev(`tensHints(Object.assign(tensQuestion(${json(mode)}, ${n}, ${p}), ${json(more)}))`);
const hints = (mode, n, p) => hintsWith([mode, n, p], {});
const says = (lv, say1, say2) => [lv.length === 2, lv[0].say === say1, lv[1].say === say2, !lv[0].fx.dim];
// le piège le plus éloigné de la bonne réponse ; à distance égale, la plus grande valeur
function farthest(n, options) {
  const wrong = options.filter((v) => v !== n);
  const far = Math.max(...wrong.map((v) => Math.abs(v - n)));
  return Math.max(...wrong.filter((v) => Math.abs(v - n) === far));
}
const dimSel = (n, p) => `.tens-opt[data-v="${farthest(n, [n, ...ev(`tensTraps(${n}, ${p})`)])}"]`;

const BUILD1 = "Touche chaque dumpling : il saute dans le panier. Un panier, c'est dix places.";
const BUILD_DONE = "Un panier plein, c'est dix. Compte dix, puis continue avec ceux qui sont tout seuls.";
const READ1 = 'Compte les paniers de dix en dix, puis ajoute les dumplings tout seuls.';
const READ5 = "Compte d'abord les piles de cent, puis les paniers de dix, puis ceux qui sont tout seuls.";
const MAKE1 = 'Le premier chiffre dit combien de paniers. Le dernier dit combien de dumplings tout seuls.';
const MAKE5 =
  'Le premier chiffre dit combien de piles, le deuxième combien de paniers, le dernier combien de tout seuls.';
const WRITE1 = 'Regarde chaque morceau : le plus grand te donne les dizaines, le petit les unités.';
const WRITE5 = 'Regarde chaque morceau : les centaines, les dizaines, puis les unités.';

function indicesRanger() {
  const open = hintsWith(['build', 14, 1], { placed: 3 });
  check('T3, ranger, panier pas plein : la méthode, puis la première case vide qui brille', () => [
    ...says(open, BUILD1, "Regarde : il reste des places dans le panier. Remplis-le d'abord !"),
    open[0].fx.glow === '.tens-heap',
    open[1].fx.glow === '.tens-cell[data-c="3"]',
    !open[1].fx.dim,
  ]);
  const full = hintsWith(['build', 14, 1], { placed: 11 });
  check('T3, ranger, panier plein et vrac non vide', () => [
    ...says(full, BUILD1, "Le panier est plein : c'est dix. Touche ceux qui restent, ils vont à côté."),
    full[1].fx.glow === '.tens-heap',
  ]);
  const done = hintsWith(['build', 14, 1], { placed: 14 });
  check('T3, ranger, tout est rangé, 2 tout seuls ou plus : « 11 » sur le premier tout seul', () => [
    ...says(done, BUILD_DONE, 'Après dix, on dit onze, douze… Continue !'),
    done[0].fx.glow === '.tens-basket',
    json(done[1].fx.marks) === json([{ sel: '.tens-loose .tens-dumpling:first-child', text: '11' }]),
  ]);
  const single = hintsWith(['build', 11, 1], { placed: 11 });
  check('T3, ranger, tout est rangé, un seul tout seul', () => [
    ...says(single, BUILD_DONE, 'Compte avec ton doigt : dix pour le panier, puis le tout seul.'),
    single[1].fx.glow === '.tens-loose',
    !single[1].fx.marks,
  ]);
}

function indicesLire() {
  const p2 = hints('read', 34, 2);
  check('T3, lire, palier 2 : « 3 paniers, ça fait 30 », la bande, rien écarté (3 réponses)', () => [
    ...says(p2, READ1, '3 paniers, ça fait 30. Ajoute le reste !'),
    p2[0].fx.glow === '#tens-stage',
    /30 \+ \? = \?/.test(p2[1].fx.html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ')),
    !p2[1].fx.dim,
  ]);
  const p3 = hints('read', 34, 3);
  check('T3, lire, palier 3 : la même phrase, et le piège le plus éloigné écarté (44 pour 34)', () => [
    ...says(p3, READ1, '3 paniers, ça fait 30. Ajoute le reste !'),
    p3[1].fx.dim === '.tens-opt[data-v="44"]',
    dimSel(34, 3) === '.tens-opt[data-v="44"]',
  ]);
  const big = hintsWith(['read', 33, 4], { baskets: 2, loose: 13 });
  const one4 = hintsWith(['read', 23, 4], { baskets: 1, loose: 13 });
  check('T3, lire, looseBig : les groupes dessinés (33 en 2 paniers et 13 tout seuls), « 1 panier »', () => [
    ...says(big, READ1, '2 paniers, ça fait 20. Ajoute le reste !'),
    /20 \+ \? = \?/.test(big[1].fx.html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ')),
    one4[1].say === '1 panier, ça fait 10. Ajoute le reste !',
  ]);
  const round = hints('read', 30, 3);
  check('T3, lire, paniers seuls : compter de dix en dix, « 10 » et « 20 » sur les 2 premiers paniers', () => [
    ...says(round, 'Compte les paniers de dix en dix.', 'Compte de dix en dix avec moi : 10, 20… Continue !'),
    json(round[1].fx.marks) ===
      json([
        { sel: '.tens-basket:nth-child(1)', text: '10' },
        { sel: '.tens-basket:nth-child(2)', text: '20' },
      ]),
    round[1].fx.dim === dimSel(30, 3),
  ]);
}
function indicesLireCent() {
  const mixed = hints('read', 345, 5);
  check('T3, lire, palier 5 : « 3 piles, ça fait 300 », la bande, un piège écarté', () => [
    ...says(mixed, READ5, '3 piles, ça fait 300. Ajoute le reste !'),
    /300 \+ \? = \?/.test(mixed[1].fx.html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ')),
    mixed[1].fx.dim === dimSel(345, 5),
    hints('read', 105, 5)[1].say === '1 pile, ça fait 100. Ajoute le reste !',
  ]);
  const piles = hints('read', 300, 5);
  const single = hints('read', 100, 5);
  check('T3, lire, palier 5, piles seules : de cent en cent, ou « Une pile… »', () => [
    ...says(piles, READ5, 'Compte de cent en cent avec moi : 100, 200… Continue !'),
    json(piles[1].fx.marks) ===
      json([
        { sel: '.tens-pile:nth-child(1)', text: '100' },
        { sel: '.tens-pile:nth-child(2)', text: '200' },
      ]),
    ...says(single, READ5, "Une pile, c'est dix paniers de dix dumplings."),
    !single[1].fx.marks,
    piles[1].fx.dim === dimSel(300, 5) && single[1].fx.dim === dimSel(100, 5),
  ]);
}

function indicesConstruire() {
  const two = hints('make', 34, 2);
  const oneBasket = hints('make', 15, 2);
  check('T3, construire : le premier chiffre, puis « Commence par mettre 3 paniers »', () => [
    ...says(two, MAKE1, 'Dans 34, le premier chiffre est 3. Commence par mettre 3 paniers.'),
    two[0].fx.glow === '#tens-target' && two[1].fx.glow === '#tens-add10',
    !two[1].fx.dim,
    oneBasket[1].say === 'Dans 15, le premier chiffre est 1. Commence par mettre 1 panier.',
  ]);
  const cent = hints('make', 345, 5);
  check('T3, construire, palier 5 : les piles d’abord', () => [
    ...says(cent, MAKE5, 'Dans 345, le premier chiffre est 3. Commence par mettre 3 piles.'),
    cent[1].fx.glow === '#tens-add100',
    hints('make', 105, 5)[1].say === 'Dans 105, le premier chiffre est 1. Commence par mettre 1 pile.',
  ]);
  const thirty = hints('make', 30, 3);
  const hundreds = hints('make', 300, 5);
  check('T3, construire, un seul chiffre non nul (30, 300)', () => [
    ...says(thirty, MAKE1, 'Le dernier chiffre est 0 : pas de dumpling tout seul. Combien de paniers ?'),
    ...says(hundreds, MAKE5, 'Les deux derniers chiffres sont 0 : ni panier, ni tout seul. Combien de piles ?'),
    thirty[1].fx.glow === '#tens-target' && hundreds[1].fx.glow === '#tens-target',
  ]);
}

function indicesEcrire() {
  const w3 = hints('write', 35, 3);
  check('T3, écrire, paliers 3 et 4 : « 30, c’est 3 paniers de dix », 3 paniers dessinés, un piège écarté', () => [
    ...says(w3, WRITE1, "30, c'est 3 paniers de dix. Combien de tout seuls en plus ?"),
    w3[0].fx.glow === '#tens-expr',
    (w3[1].fx.html.match(/<svg/g) || []).length === 3,
    w3[1].fx.dim === dimSel(35, 3),
  ]);
  const w5 = hints('write', 345, 5);
  check('T3, écrire, palier 5 : « 300, c’est 3 piles de cent », 3 piles dessinées', () => [
    ...says(w5, WRITE5, "300, c'est 3 piles de cent. Ajoute le reste !"),
    (w5[1].fx.html.match(/<svg/g) || []).length === 3,
    w5[1].fx.dim === dimSel(345, 5),
    hints('write', 105, 5)[1].say === "100, c'est 1 pile de cent. Ajoute le reste !",
  ]);
}

// les textes ne donnent jamais le total (hors les deux comptines de la spec, « 10, 20… » et « onze, douze… »)
function jamaisLeTotal() {
  const cases = [
    ['read', 34, 2],
    ['read', 47, 3],
    ['make', 58, 2],
    ['write', 35, 3],
    ['read', 345, 5],
    ['write', 678, 5],
    ['make', 345, 5],
  ];
  check('aucun indice ne dit le nombre à trouver (lire, écrire) ni ne pose les dumplings (construire)', () =>
    cases.map(([mode, n, p]) =>
      hints(mode, n, p).every((h) => mode === 'make' || !(h.say.match(/[0-9]+/g) || []).includes(String(n))),
    ),
  );
}

// à l'écran : 💡 deux fois ; la bulle de l'indice 2, un seul choix écarté avec 4 réponses, aucun avec 3
function ecran(p, mode) {
  const found = t.startUntil('tens', p, (x) => x.mode === mode);
  const q = t.question();
  t.hintBtn().click();
  const first = all('#modal-body .hint-dim').length;
  t.hintBtn().click();
  const dims = all('#modal-body .hint-dim');
  check(
    `à l'écran, ${mode} au palier ${p} : ${p >= 3 ? 'un seul piège écarté, le plus éloigné' : 'rien écarté'}`,
    () => [
      found,
      first === 0,
      !!one('.hint-bubble[data-level="2"]'),
      dims.length === (p >= 3 ? 1 : 0),
      p < 3 || dims[0] === one(dimSel(q.n, p)),
      !one(`.tens-opt[data-v="${q.n}"]`).classList.contains('hint-dim'),
      t.stageTotal() === (mode === 'read' ? q.n : 0),
    ],
  );
  ev('closeModal()');
}
function ecranRanger() {
  t.startGame('tens', 1);
  t.tap('.tens-heap .tens-dumpling', 2);
  t.hintBtn().click();
  t.hintBtn().click();
  check("à l'écran, ranger : la première case vide brille, rien n'est écarté, rien ne bouge", () => [
    all('.tens-cell.hint-glow').length === 1,
    one('.tens-cell.hint-glow') === all('.tens-cell')[2],
    all('#modal-body .hint-dim').length === 0,
    all('.tens-cell .tens-dumpling').length === 2,
  ]);
  ev('closeModal()');
}

// T12 : les consignes dites de lire et de construire
function consignes() {
  const READ = 'Les dumplings sont rangés par paniers de dix. Combien y en a-t-il en tout ?';
  const READ_CENT = "Une pile, c'est dix paniers : cent dumplings. Combien y en a-t-il en tout ?";
  const make = (n, with100) =>
    `Le client veut ${n} dumplings. Prépare-les avec ${with100 ? 'des piles de cent, ' : ''}des paniers de dix et des dumplings tout seuls, puis touche « C'est prêt ».`;
  for (const p of [2, 5]) {
    t.startUntil('tens', p, (x) => x.mode === 'read');
    check(`T12, lire au palier ${p} : la consigne affichée et la phrase dite`, () => [
      t.hintText() === 'Combien de dumplings en tout ?',
      t.sayBtn() === (p === 5 ? READ_CENT : READ),
      one('.game-head h2').textContent === '🧺 Les paniers de dix',
    ]);
    t.startUntil('tens', p, (x) => x.mode === 'make');
    check(`T12, construire au palier ${p} : la phrase dite nomme le nombre`, () => [
      t.sayBtn() === make(t.question().n, p === 5),
      t.said(make(t.question().n, p === 5)),
    ]);
  }
  ev('closeModal()');
}

(async () => {
  await t.start();
  section('Les paniers de dix : indices (T3)');
  indicesRanger();
  indicesLire();
  indicesLireCent();
  indicesConstruire();
  indicesEcrire();
  jamaisLeTotal();
  section("Les paniers de dix : indices à l'écran");
  ecran(2, 'read');
  ecran(3, 'read');
  ecran(4, 'write');
  ecran(5, 'read');
  ecranRanger();
  section('Les paniers de dix : consignes (T12)');
  consignes();
  await t.finish("l'Île des Squishy Dumplings (tens, les indices)");
})();
