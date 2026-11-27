// Le Monde des Chatouilles : l'écran du « Chemin de la plume » (coding) :
// critères 4 à 14 de la spec, contrat DOM, textes C1 à C11. Vraies parties et
// indices : test/chatouilles-coding-parties.test.js.
// Les grilles sont celles de T2 (secours), posées par le test.
// Harnais : test/tools/chatouilles.js.
const t = require('./tools/chatouilles.js');
const { ev, json, check, section, all, one, T1 } = t;

const C = {
  abs: 'Guili a envie de rire ! Choisis les flèches pour guider la plume jusqu’à lui, puis appuie sur Go.',
  rel: 'Guili a envie de rire ! Programme la plume : elle avance tout droit, ou elle tourne sur place. Puis appuie sur Go. Attention aux cactus !',
  empty: 'Ajoute d’abord des flèches, puis appuie sur Go !',
  full: 'Ton programme est plein. Touche une flèche du programme pour l’enlever.',
  win: 'Hi hi hi ! Ça chatouille ! Bravo, ta plume a trouvé le chemin !',
  rock: 'Oups, un cactus ! La plume s’arrête là. Change la flèche rouge.',
  edge: 'Oups, le bord ! La plume s’arrête là. Change la flèche rouge.',
  stop: 'La plume s’est arrêtée ici, mais Guili est plus loin. Ajoute ou change des flèches !',
};
Object.keys(C).forEach((k) => (C[k] = C[k].replace(/’/g, "'")));
const WORDS = {
  U: 'en haut',
  R: 'à droite',
  D: 'en bas',
  L: 'à gauche',
  F: 'avance',
  TL: 'tourne à gauche',
  TR: 'tourne à droite',
};
const go = () => one('#cd-go');
const errors = () => ev('missionErrors');
const marks = () => all('.cd-step.ko, .cd-step.on, #cd-feather.cd-bump, .cd-cell.cd-stop').length;

function rendu(p) {
  t.openCoding(p, t.fallbackGrid(p));
  const g = t.gridOnScreen();
  const R = T1[p];
  const ops = R.mode === 'abs' ? ['U', 'R', 'D', 'L'] : ['F', 'TL', 'TR'];
  check(`critère 1, palier ${p} : la grille, ses cases, la plume au départ, ${R.slots} cases de programme`, () => [
    g.size === R.size && g.mode === R.mode && g.dir === t.T2[p].dir,
    all('.cd-cell').length === R.size * R.size,
    json([g.start, g.goal, g.rocks.sort()]) === json([t.T2[p].start, t.T2[p].goal, t.T2[p].rocks.slice().sort()]),
    json(t.feather()) === json({ r: g.start[0], c: g.start[1], dir: g.dir }),
    one('#cd-feather').tagName.toLowerCase() === 'svg' || !!one('#cd-feather svg'),
    one('.cd-cell.goal .cd-friend').textContent === '🐧',
    all('#cd-prog .cd-slot').length === R.slots && t.steps().length === 0,
    !one('#challenge-timer'),
  ]);
  check(`critères 4 et 5, palier ${p} : la palette (${ops.join(', ')}), chaque bouton dit son mot`, () => [
    json(all('#cd-pal .cd-op').map((b) => b.dataset.op)) === json(ops),
    all('#cd-pal .cd-op').every((b) => b.getAttribute('aria-label') === WORDS[b.dataset.op]),
    go().textContent.includes('Go'),
  ]);
  check(`C1 à C4, palier ${p} : titre, consigne écrite, consigne dite`, () => [
    one('.game-head h2').textContent === '🪶 Le chemin de la plume',
    one('.puzzle-hint .hint-txt').textContent === "Guide la plume jusqu'à Guili",
    t.saidLast(R.mode === 'abs' ? C.abs : C.rel),
  ]);
  check(`critère 16, palier ${p} : la solution : les flèches d'un plus court programme, puis Go`, () => {
    const s = t.sol();
    const prog = s.slice(0, -1).map((x) => one(x).dataset.op);
    return [
      s[s.length - 1] === '#cd-go',
      json(s) === json(t.solutionOf(prog)),
      s.every((x) => all(x).length === 1),
      t.run(g, prog).end === 'goal',
      prog.length === t.T2[p].len && t.turnsOf(R.mode, prog) === t.T2[p].turns,
    ];
  });
  ev('closeModal()');
}

// critères 4 à 8 : la palette et le programme, au palier 1 (6 cases)
function programme() {
  t.openCoding(1, t.fallbackGrid(1));
  const said = [];
  ['U', 'R', 'D', 'L'].forEach((o) => {
    t.op(o).click();
    said.push(t.saidLast(WORDS[o]));
  });
  check('critère 4 : toucher une flèche l’ajoute au bout du programme et dit sa direction', () => [
    ...said,
    json(t.steps()) === json(['U', 'R', 'D', 'L']),
    json(all('.cd-step').map((x) => x.dataset.i)) === json(['0', '1', '2', '3']),
    all('.cd-step').every((x) => !x.classList.contains('cd-op')),
  ]);
  t.tapOps(['U', 'U']);
  const before = errors();
  t.op('R').click();
  check('critère 6 : programme plein : rien ne s’ajoute, la voix le dit (C7), aucune erreur', () => [
    json(t.steps()) === json(['U', 'R', 'D', 'L', 'U', 'U']),
    t.saidLast(C.full),
    errors() === before,
  ]);
  one('.cd-step[data-i="1"]').click();
  check('critère 7 : toucher une flèche du programme la retire, les suivantes se décalent', () => [
    json(t.steps()) === json(['U', 'D', 'L', 'U', 'U']),
    json(all('.cd-step').map((x) => x.dataset.i)) === json(['0', '1', '2', '3', '4']),
    all('#cd-prog .cd-slot').length === 6,
  ]);
  ev('closeModal()');
  t.openCoding(2, t.fallbackGrid(2));
  const lives = t.lives();
  go().click();
  check('critère 8 : Go sur un programme vide : la plume ne bouge pas, aucun essai perdu, C6', () => [
    t.saidLast(C.empty),
    errors() === 0 && t.lives() === lives,
    json(t.feather()) === json({ r: 3, c: 0, dir: 0 }),
    go().disabled === false,
  ]);
  ['F', 'TL', 'TR'].forEach((o) => {
    t.op(o).click();
    said.push(t.saidLast(WORDS[o]));
  });
  check('critère 5 : en mode relatif, la voix dit « avance », « tourne à gauche », « tourne à droite »', () => [
    said.slice(4).every(Boolean),
    json(t.steps()) === json(['F', 'TL', 'TR']),
  ]);
  ev('closeModal()');
}

// critères 9 à 13 : le trajet, palier 2 (grille de secours)
async function trajet() {
  t.openCoding(2, t.fallbackGrid(2));
  const grid = json(t.gridOnScreen());
  const lives = t.lives();
  // heurt d'un cactus : tourne à droite, avance
  t.tapOps(['TR', 'F']);
  go().click();
  const busy = [go().disabled, all('.cd-op').every((b) => b.disabled), all('.cd-step').every((b) => b.disabled)];
  const seen = new Set();
  await t.waitFor(() => {
    all('.cd-step.on').forEach((x) => seen.add(x.dataset.i));
    return all('.cd-step.on').length > 1 || !go().disabled;
  }, 2500);
  check('critère 9 : pendant le trajet, palette, programme et Go sont inactifs ; une seule flèche surlignée', () => [
    ...busy,
    seen.has('0'),
    all('.cd-step.on').length <= 1,
  ]);
  check('critère 11 : cactus : la plume reste et tremble, la flèche fautive est rouge, un essai perdu, puis C9', () => [
    json(t.feather()) === json({ r: 3, c: 0, dir: 1 }),
    one('#cd-feather').classList.contains('cd-bump'),
    json(all('.cd-step.ko').map((x) => x.dataset.i)) === json(['1']),
    errors() === 1 && t.lives() === lives - 1,
    t.saidLast(C.rock),
    one('#cd-feather').style.transform.includes('rotate(90deg)'),
  ]);
  check('critère 13 : après l’erreur, la même grille et le même programme restent, tout est de nouveau actif', () => [
    json(t.steps()) === json(['TR', 'F']),
    json(t.gridOnScreen()) === grid,
    !go().disabled && all('.cd-op').every((b) => !b.disabled),
  ]);
  one('.cd-step[data-i="0"]').click();
  check('critère 13 : dès qu’on modifie le programme, la plume revient au départ et les marques s’effacent', () => [
    marks() === 0,
    json(t.feather()) === json({ r: 3, c: 0, dir: 0 }),
    one('#cd-feather').style.transform.includes('rotate(0deg)'),
  ]);
}
// la suite, sur la même partie : le bord, puis l'arrêt ailleurs
async function trajetSuite() {
  // heurt du bord : (il reste F) on repart de zéro
  one('.cd-step[data-i="0"]').click();
  t.tapOps(['TL', 'F']);
  go().click();
  await t.idle();
  check('critère 11 : bord : la plume reste, un essai perdu, puis C10 ; un quart de tour à gauche vaut -90°', () => [
    json(t.feather()) === json({ r: 3, c: 0, dir: 3 }),
    json(all('.cd-step.ko').map((x) => x.dataset.i)) === json(['1']),
    errors() === 2,
    t.saidLast(C.edge),
    one('#cd-feather').style.transform.includes('rotate(-90deg)'),
  ]);
  // arrêt ailleurs : avance, tourne à droite, avance
  all('.cd-step').forEach(() => one('.cd-step[data-i="0"]').click());
  t.tapOps(['F', 'TR', 'F']);
  go().click();
  const cleared = marks() === 0 && json(t.feather()) === json({ r: 3, c: 0, dir: 0 });
  await t.idle();
  check('critère 12 : arrêt ailleurs : la case d’arrêt est entourée, un essai perdu, puis C11', () => [
    cleared,
    json(t.feather()) === json({ r: 2, c: 1, dir: 1 }),
    json(all('.cd-cell.cd-stop').map((x) => [x.dataset.r, x.dataset.c])) === json([['2', '1']]),
    all('.cd-step.ko').length === 0,
    errors() === 3,
    t.saidLast(C.stop),
  ]);
  go().click();
  check('critère 13 : au Go suivant, la plume repart du départ et la marque d’arrêt s’efface', () => [
    all('.cd-cell.cd-stop').length === 0,
    json(t.feather()) === json({ r: 3, c: 0, dir: 0 }),
  ]);
  ev('closeModal()');
}

// critères 9 et 10 : la victoire, la plume suit le chemin case par case
async function victoire() {
  t.openCoding(2, t.fallbackGrid(2));
  const prog = ['F', 'F', 'TR', 'F', 'F', 'F'];
  t.tapOps(prog);
  go().click();
  const path = [json(t.feather())];
  const win = await t.waitFor(() => {
    const now = json(t.feather());
    if (path[path.length - 1] !== now) path.push(now);
    return !!one('.win-box') || one('.cd-friend').classList.contains('giggle-wiggle');
  }, 2500);
  const want = ev('codingRun')(t.fallbackGrid(2), prog).path.map((s) => json(s));
  check('critère 9 : la plume suit le trajet, une instruction à la fois, depuis le départ', () => [
    win,
    json(path) === json(want),
    path.length === 6,
  ]);
  check('critère 10 : chez l’ami, le trajet s’arrête, l’ami rit, la voix dit C8, la mission est gagnée', async () => [
    one('.cd-cell.goal .cd-friend').classList.contains('giggle-wiggle'),
    t.said(C.win, t.spoken.length - 1),
    errors() === 0,
  ]);
  check('critère 10 : la mission est gagnée', [await t.won()]);
  ev('closeModal()');
}

// critère 14 : au palier 1, la grille ne change jamais d'elle-même
async function illimite() {
  t.openCoding(1, t.fallbackGrid(1));
  const grid = json(t.gridOnScreen());
  t.tapOps(['U']);
  for (let k = 0; k < 3; k++) {
    go().click();
    await t.idle();
  }
  check('critère 14 : palier 1 : trois programmes faux, la grille et le programme restent, essais illimités', () => [
    errors() === 3,
    json(t.gridOnScreen()) === grid,
    json(t.steps()) === json(['U']),
    ev('lives') === Infinity,
    !one('.win-box'),
  ]);
  t.tapOps(['U', 'U', 'U']);
  go().click();
  await t.idle();
  check('critère 11 : en flèches absolues, le bord arrête aussi la plume (C10)', () => [
    t.saidLast(C.edge),
    json(all('.cd-step.ko').map((x) => x.dataset.i)) === json(['3']),
    json(t.feather()) === json({ r: 0, c: 0, dir: 0 }),
  ]);
  ev('closeModal()');
}

// critère 14 : aux paliers 2 à 5, les essais du barème s'épuisent et la mission est perdue
const LIVES = { 2: 4, 3: 3, 4: 3, 5: 2 }; // critère 29 : barème `generous`
async function epuise(p) {
  t.openCoding(p, t.fallbackGrid(p));
  const lives = t.lives();
  t.tapOps(['F']); // une seule instruction : jamais chez l'ami (T2 : au moins 5)
  for (let k = 1; k < lives; k++) {
    go().click();
    await t.idle();
  }
  const before = [errors() === lives - 1, t.lives() === 1, !one('.fail-box'), !go().disabled];
  go().click();
  await t.waitFor(() => errors() === lives, 2500);
  // entre la dernière erreur et l'écran « Raté ! » : plus rien ne répond
  const locked = [errors() === lives, go().disabled, all('.cd-op').every((b) => b.disabled), !one('.fail-box')];
  t.op('F').click();
  const same = json(t.steps()) === json(['F']);
  const failed = await t.waitFor(() => !!one('.fail-box'), 2500);
  check(`critère 14, palier ${p} : ${LIVES[p]} essais ; au dernier programme faux, la mission est perdue`, () => [
    lives === LIVES[p],
    ...before,
    ...locked,
    same,
    failed,
    ev('lives') === 0, // le compte des erreurs, lui, repart à zéro avec l'écran « Raté ! »
    !one('.win-box') && !one('#cd-grid'),
  ]);
  ev('closeModal()');
}

(async () => {
  await t.start();
  section('Le chemin de la plume : la grille, la palette, la solution');
  t.TIERS.forEach(rendu);
  section('Le chemin de la plume : palette et programme');
  programme();
  section('Le chemin de la plume : le trajet, les erreurs, la victoire');
  await trajet();
  await trajetSuite();
  await victoire();
  await illimite();
  for (const p of [2, 3, 4, 5]) await epuise(p);
  await t.finish('le Monde des Chatouilles (coding, l’écran)');
})();
