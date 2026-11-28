// L'Île des Crayons : « Trace avec ton doigt », d'un trait au suivant (lignes 15
// et 16 de la spec) et les ratés (lignes 17 à 19) : sans essai perdu aux deux
// premiers, la démonstration au troisième, le toucher court ignoré.
// Harnais : test/tools/crayons.js.
const t = require('./tools/crayons.js');
const { d, ev, check, section, near, strokesOf, model, consigne, startTrace, padAt, glyphs, said, msEl, trace } = t;

const one = (sel) => d.querySelector(sel);
const has = (el, cls) => !!el && el.classList.contains(cls);

/* ================= Lignes 15 et 16 : trait suivant, glyphe suivant ================= */
// après le trait s (pas le dernier) du glyphe g : ce qui ne va pas (ligne 15)
function nextStrokeProblems(g, s, from) {
  const start = one('#tr-pad .tr-start'),
    num = one('#tr-pad text.tr-num'),
    next = model(strokesOf(glyphs()[g])[s + 1])[0];
  const facts = {
    'le carré passe au trait suivant': padAt(g, s + 1),
    'le modèle réussi est « done »': has(one(`#tr-pad .tr-model[data-s="${s}"]`), 'done'),
    'le trait suivant est « current »': has(one(`#tr-pad .tr-model[data-s="${s + 1}"]`), 'current'),
    'le point vert suit': start.dataset.s === String(s + 1) && near(start.getAttribute('cx'), next[0]),
    'le numéro du trait': !!num && num.textContent === String(s + 2) && num.dataset.s === String(s + 1),
    'le numéro est à côté du point vert, pas dedans':
      !!num &&
      near(num.getAttribute('x'), Number(start.getAttribute('cx')) + 7) &&
      near(num.getAttribute('y'), Number(start.getAttribute('cy')) - 7) &&
      num.parentNode === start.parentNode,
    'la voix annonce le trait': said(`Bravo ! Maintenant, le trait numéro ${s + 2}.`, from),
  };
  return Object.keys(facts).filter((k) => !facts[k]);
}
// après le dernier trait du glyphe g (pas le dernier glyphe) : ce qui ne va pas (ligne 16)
function nextGlyphProblems(g, p, from) {
  const minis = d.querySelectorAll('.tr-strip .tr-mini'),
    id = glyphs()[g + 1];
  const facts = {
    "le glyphe suivant s'affiche tout de suite": padAt(g + 1, 0),
    'la vignette est « done »': has(minis[g], 'done') && !has(minis[g], 'current'),
    'la vignette suivante est « current »': has(minis[g + 1], 'current'),
    'la voix félicite puis dit la consigne suivante': said("Bravo, c'est très bien tracé ! " + consigne(id, p), from),
    'la consigne à réécouter change': t.sayBtn() === consigne(id, p),
    "l'en-tête montre le glyphe suivant": one('.puzzle-hint .tr-big').textContent === id,
    'les points de progression': d.querySelectorAll('.game-progress i.on').length === g + 1,
  };
  return Object.keys(facts).filter((k) => !facts[k]);
}
// trace le trait `at` = [g, s] et vérifie le passage qui suit
function playStroke(at, p, run) {
  const [g, s] = at;
  const n = strokesOf(glyphs()[g]).length,
    from = t.spoken.length,
    q = ev('hint.q');
  let problems = trace(g, s) && has(msEl(g, s), 'done') ? [] : ['le trait est réussi, « done » dans la bande'];
  if (s < n - 1) {
    run.steps++;
    problems = problems.concat(nextStrokeProblems(g, s, from), ev('hint.q') === q ? [] : ['mêmes indices']);
  } else if (g < glyphs().length - 1) {
    run.nexts++;
    problems = problems.concat(nextGlyphProblems(g, p, from), ev('hint.q') === q ? ['indices remis à zéro'] : []);
  }
  run.problems.push(...problems.map((x) => `${glyphs()[g]} trait ${s + 1} : ${x}`));
}
// joue toute une mission, glyphes imposés, et note chaque passage
async function playAll(p, ids, run) {
  startTrace(p, ids);
  glyphs().forEach((id, g) => strokesOf(id).forEach((_, s) => playStroke([g, s], p, run)));
  if (!(await t.won())) run.problems.push(`${ids.join(' ')} : pas de victoire`);
  ev('closeModal()');
}
async function suivants() {
  const run = { problems: [], steps: 0, nexts: 0 };
  for (const id of ['4', '5', 'T', 'E', 'H']) await playAll(1, [id], run);
  await playAll(2, ['i', 't'], run);
  await playAll(4, ['i', 't', 'u'], run);
  await playAll(5, ['d', '8', '5'], run);
  check('ligne 15 : un trait réussi passe au trait suivant (4, 5, T, E, H, i, t), numéro et voix compris', () => [
    run.problems.length === 0,
    run.steps === 11,
  ]);
  check('ligne 16 : un glyphe réussi laisse tout de suite la place au suivant, avec sa consigne', () => [
    run.problems.length === 0,
    run.nexts === 5,
  ]);
  if (run.problems.length) console.log('   ' + run.problems.slice(0, 8).join('\n   '));
}

/* ================= Lignes 17 à 19 : les ratés ================= */
const SAY = {
  start: 'Presque ! Pose ton doigt sur le point vert pour commencer.',
  cover: "Presque ! Suis bien le chemin gris jusqu'au bout.",
  wander: 'Doucement ! Reste sur le chemin gris.',
  dot: 'Touche juste le petit point.',
};
const EXPLAIN = {
  start: 'Pose ton doigt près du point vert.',
  cover: 'Suis le chemin gris jusqu’au bout.',
  wander: 'Reste sur le chemin gris.',
  dot: 'Touche juste le petit point.',
};
const DEMO = 'Regarde le crayon, puis refais ce trait !';
const misses = () => t.game().misses;
// l'état que les ratés ne doivent pas toucher
const snap = () => ({ from: t.spoken.length, lives: ev('lives'), errors: ev('missionErrors') });
const untouched = (was) => ev('lives') === was.lives && ev('missionErrors') === was.errors;
// un raté sans essai perdu : encre effacée, phrase de la raison, même trait
function softMiss(at, pts, reason) {
  const [g, s] = at;
  const was = snap();
  trace(g, s, pts);
  return [
    untouched(was),
    (one('#tr-pad .tr-ink').getAttribute('points') || '') === '',
    said(SAY[reason], was.from),
    !said(DEMO, was.from),
    padAt(g, s),
    !has(msEl(g, s), 'done'),
  ].every(Boolean);
}

function ratesSansPerte(st1, reason1) {
  const m0 = model(strokesOf(glyphs()[0])[0]);
  check('ligne 17 : un 1ᵉʳ raté (pas parti du point vert) ne coûte rien, la voix aide, même trait', () => [
    softMiss([0, 0], m0.slice().reverse(), 'start'),
    misses() === 1,
  ]);
  check('ligne 17 : un 2ᵉ raté de suite (chemin pas fini) ne coûte rien non plus', () => [
    softMiss([0, 0], m0.slice(0, Math.ceil(m0.length / 2)), 'cover'),
    misses() === 2,
  ]);
  check('un trait réussi remet le compteur de ratés à zéro', () => [trace(0, 0), padAt(0, 1), misses() === 0]);
  check(`ligne 17 : raté sur le 2ᵉ trait (raison ${reason1}), deux fois de suite`, () => [
    softMiss([0, 1], t.badPts(st1), reason1),
    softMiss([0, 1], t.badPts(st1), reason1),
    misses() === 2,
  ]);
}

function troisiemeRate(st1, reason1) {
  const was = snap();
  trace(0, 1, t.badPts(st1));
  check('ligne 18 : au 3ᵉ raté de suite, un essai est perdu (une seule fois) et la voix explique la raison', () => [
    was.lives === 4,
    ev('lives') === 3,
    ev('missionErrors') === was.errors + 1,
    said(EXPLAIN[reason1], was.from),
  ]);
  check('ligne 18 : la démonstration montre ce trait seulement, et on reste sur ce trait', () => [
    !!one('#tr-pad text.tr-demo[data-s="1"]'),
    d.querySelectorAll('#tr-pad .tr-demo').length === 1,
    misses() === 0,
    padAt(0, 1),
    !one('.fail-box'),
  ]);
  check('ligne 18 : les traits déjà réussis du glyphe restent faits', () => [
    has(one('#tr-pad .tr-model[data-s="0"]'), 'done'),
    has(msEl(0, 0), 'done'),
    !has(msEl(0, 1), 'done'),
  ]);
  check('poser le doigt arrête la démonstration ; un 4ᵉ raté repart de 1, sans essai perdu', () => [
    softMiss([0, 1], t.badPts(st1), reason1),
    !one('#tr-pad .tr-demo'),
    misses() === 1,
    ev('lives') === 3,
  ]);
}

// ligne 19 : un toucher court sur le premier trait qui n'est pas un point
function toucherCourt(st1) {
  if (st1.kind === 'dot') trace(0, 1); // (le point du i se touche : on passe au glyphe suivant)
  const g = st1.kind === 'dot' ? 1 : 0,
    s = st1.kind === 'dot' ? 0 : 1;
  const first = model(strokesOf(glyphs()[g])[s])[0],
    before = misses(),
    was = snap();
  trace(g, s, [first, first]);
  check('ligne 19 : un toucher court est ignoré (ni voix de raté, ni erreur, ni compteur)', () => [
    !Object.values(SAY).some((x) => said(x, was.from)),
    !said(DEMO, was.from),
    untouched(was),
    misses() === before,
    padAt(g, s),
  ]);
}

async function rates() {
  startTrace(2, ['t', 'i']);
  // le 2ᵉ trait du premier glyphe : la barre du t (raison start), ou le point du i (raison dot)
  const st1 = strokesOf(glyphs()[0])[1];
  const reason1 = st1.kind === 'dot' ? 'dot' : 'start';
  ratesSansPerte(st1, reason1);
  troisiemeRate(st1, reason1);
  toucherCourt(st1);
  const traced = t.traceRest();
  const win = await t.won();
  check('après les ratés, la mission se gagne toujours', () => [traced, win]);
  ev('closeModal()');
  startTrace(2, ['e', 'l']);
  check('ligne 17 : un gribouillis (raison wander) : « Doucement ! Reste sur le chemin gris. »', () => [
    softMiss([0, 0], t.scribble(model(strokesOf(glyphs()[0])[0])[0]), 'wander'),
  ]);
  ev('closeModal()');
}

(async () => {
  await t.start();
  section('Trace avec ton doigt : trait suivant, glyphe suivant');
  await suivants();
  section('Trace avec ton doigt : les ratés');
  await rates();
  await t.finish("l'Île des Crayons (trace, traits et ratés)");
})();
