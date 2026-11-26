// L'Île des Crayons : l'écran de « Trace avec ton doigt » (lignes 13, 14 et 20
// à 23 de la spec) : le carré, la bande, la consigne, la démonstration, les
// indices et les tables du jeu. Harnais : test/tools/crayons.js.
const t = require('./tools/crayons.js');
const { d, ev, json, check, section, near, strokesOf, model, consigne, startTrace, padAt, glyphs, said } = t;

const all = (sel) => [...d.querySelectorAll(sel)];
const one = (sel) => d.querySelector(sel);

/* ================= Ligne 13 : la fenêtre au palier 2 ================= */
function ecranPad() {
  const first = model(strokesOf(glyphs()[0])[0])[0];
  const start = all('#tr-pad circle.tr-start');
  check('ligne 13 : le carré à tracer (svg#tr-pad de 0 à 100), sur le premier trait du premier glyphe', () => [
    one('svg#tr-pad').getAttribute('viewBox') === '0 0 100 100',
    padAt(0, 0),
  ]);
  check('ligne 13 : un seul point vert, au départ du trait', () => [
    start.length === 1,
    start[0].dataset.s === '0',
    near(start[0].getAttribute('cx'), first[0]),
    near(start[0].getAttribute('cy'), first[1]),
    start[0].getAttribute('r') === '5',
  ]);
  check("ligne 13 : des flèches sur le trait courant, et l'encre vide", () => [
    all('#tr-pad path.tr-arrow').length >= 1,
    all('#tr-pad path.tr-arrow').every((a) => a.dataset.s === '0'),
    all('#tr-pad polyline.tr-ink').length === 1,
    (one('#tr-pad .tr-ink').getAttribute('points') || '') === '',
    !one('#tr-pad .tr-demo'),
  ]);
  check('le modèle du glyphe courant : un tracé gris par trait, le premier est à faire', () => {
    const models = all('#tr-pad .tr-model'),
      n = strokesOf(glyphs()[0]).length;
    return [
      models.length === n,
      models[0].classList.contains('current'),
      models.every((m, s) => m.dataset.s === String(s) && !m.classList.contains('done')),
      all('#tr-pad text.tr-num').length === (n > 1 ? 1 : 0),
    ];
  });
}

function ecranBande() {
  check('ligne 13 : la bande des 2 glyphes, le premier est le glyphe courant', () => [
    all('.tr-strip span.tr-mini').length === 2,
    all('.tr-strip .tr-mini').every((m, g) => m.dataset.g === String(g)),
    all('.tr-strip .tr-mini')[0].classList.contains('current'),
    !all('.tr-strip .tr-mini')[1].classList.contains('current'),
    all('.tr-strip .tr-mini svg').every((s) => s.getAttribute('viewBox') === '0 0 100 100'),
  ]);
  check('ligne 13 : la voix dit la consigne du premier glyphe', () => [
    said(consigne(glyphs()[0], 2)),
    t.sayBtn() === consigne(glyphs()[0], 2),
  ]);
  check("la solution : chaque trait de chaque glyphe de la bande, dans l'ordre", () => {
    const want = glyphs().flatMap((id, g) => strokesOf(id).map((_, s) => `.tr-ms[data-g="${g}"][data-s="${s}"]`));
    return [json(ev('gameSolution')) === json(want), want.length === all('.tr-strip .tr-ms').length];
  });
  check('chaque trait de la bande porte les points de son modèle (data-pts) et son carré (data-pad)', () =>
    ev('gameSolution').map((sel) => {
      const el = one(sel);
      const st = strokesOf(glyphs()[Number(el.dataset.g)])[Number(el.dataset.s)];
      const pts = JSON.parse(el.dataset.pts),
        m = model(st);
      return (
        el.dataset.pad === 'tr-pad' &&
        el.tagName.toLowerCase() === (st.kind === 'dot' ? 'circle' : 'polyline') &&
        pts.length === m.length &&
        pts.every((p, i) => near(p[0], m[i][0]) && near(p[1], m[i][1]))
      );
    }),
  );
}

/* ================= L'en-tête et la consigne, glyphe par glyphe ================= */
function enTete() {
  startTrace(1, ['L']);
  check('en-tête : le glyphe en grand, son mot et son emoji ; consigne exacte de la capitale L', () => [
    one('.puzzle-hint .tr-big').textContent === 'L',
    one('.puzzle-hint .tr-word').textContent.includes('lion'),
    one('.puzzle-hint .tr-word').textContent.includes('🦁'),
    t.sayBtn() === 'Trace la lettre L, comme dans lion. Pars du point vert et suis les flèches !',
  ]);
  check('ligne 21 : au palier 1, la démonstration du premier trait se joue toute seule', () => [
    !!one('#tr-pad text.tr-demo[data-s="0"]'),
    all('#tr-pad .tr-demo').length === 1,
  ]);
  check('palier 1 : essais illimités, pas de barre de cœurs', () => [
    ev('lives') === Infinity,
    !d.getElementById('lives-bar'),
  ]);
  startTrace(1, ['4']);
  check('en-tête : un chiffre montre autant de petits points ; consigne exacte du chiffre 4', () => [
    one('.puzzle-hint .tr-big').textContent === '4',
    all('.puzzle-hint .tr-count i').length === 4,
    t.sayBtn() === 'Trace le chiffre quatre. Pars du point vert et suis les flèches !',
  ]);
  startTrace(2, ['l', 'u']);
  check('consigne exacte des lettres attachées l et u ; pas de démonstration au palier 2', () => {
    const says = glyphs().map((id) => consigne(id, 2));
    return [
      says.includes('Trace la lettre l en attaché, comme dans lapin. Pars du point vert et suis les flèches !'),
      says.includes('Trace la lettre u en attaché, comme dans lune. Pars du point vert et suis les flèches !'),
      t.sayBtn() === says[0],
      !one('#tr-pad .tr-demo'),
    ];
  });
  ev('closeModal()');
}

/* ================= Palier 5 et indices ================= */
function palier5() {
  const from = t.spoken.length;
  startTrace(5);
  check('ligne 20 : au palier 5, plus de flèches, et la consigne dit « suis le chemin gris »', () => [
    !!t.pad(),
    all('#tr-pad .tr-arrow').length === 0,
    t.sayBtn() === consigne(glyphs()[0], 5),
    t.sayBtn().endsWith('et suis le chemin gris !'),
    said(consigne(glyphs()[0], 5), from),
  ]);
  check("ligne 22 : au palier 5, l'indice 1 dit « suis le chemin gris »", () => [
    ev('hintsFor("trace", hint.q)')[0].say ===
      'Pose ton doigt sur le point vert, puis suis le chemin gris sans lever le doigt.',
  ]);
}

function indices() {
  startTrace(2, ['t', 'u']);
  check("ligne 22 : 2 indices aux textes exacts ; le 1ᵉʳ fait briller le point vert, aucun n'écarte rien", () => {
    const lv = ev('hintsFor("trace", hint.q)');
    return [
      lv.length === 2,
      lv[0].say === 'Pose ton doigt sur le point vert, puis suis les flèches sans lever le doigt.',
      lv[0].fx.glow === '#tr-pad .tr-start',
      lv[1].say === 'Regarde bien le crayon : il te montre le chemin. À toi !',
      typeof lv[1].fx.run === 'function',
      lv.every((h) => !h.fx.dim),
      ev('hint.kind') === 'trace',
    ];
  });
  check("ligne 22 : l'indice 2 lance la démonstration du trait courant", () => {
    const g = glyphs().indexOf('t'); // le t a deux traits : on demande l'indice sur le second
    for (let k = 0; k < g; k++) t.trace(k, 0);
    t.trace(g, 0);
    const btn = () => one('#modal-body .hint-btn');
    btn().click();
    const before = !!one('#tr-pad .tr-demo');
    btn().click();
    return [padAt(g, 1), !before, !!one('#tr-pad text.tr-demo[data-s="1"]'), all('#tr-pad .tr-demo').length === 1];
  });
  ev('closeModal()');
}

/* ================= Ligne 23 : les tables ================= */
function tables() {
  check('ligne 23 : pas de minuteur ; essais illimités au palier 1, puis 4, 4, 3, 3', () => [
    ev('timerFor("trace", 5)') === null,
    ev('timerFor("trace", 3)') === null,
    ev('livesFor("trace", 1)') === Infinity,
    json([2, 3, 4, 5].map((p) => ev(`livesFor("trace", ${p})`))) === json([4, 4, 3, 3]),
  ]);
  check('ligne 23 : le jeu est inscrit, dans « choisir un jeu », dès 5 ans', () => [
    ev('GAME_TYPES.includes("trace")'),
    ev('hasHints("trace")'),
    json(ev('GAME_LIST.find((x) => x.key === "trace")')) ===
      json({ key: 'trace', emoji: '✍️', name: 'Trace avec ton doigt' }),
    ev('gameTypesForAge(5).includes("trace")'),
    !ev('gameTypesForAge(4).includes("trace")'),
    ev('gameTypesForAge(6).includes("trace")'),
  ]);
  check('ligne 23 : compétence « Lecture et langage » des parents, et sa phrase de progrès', () => [
    ev('SKILL_GROUPS.find((x) => x.id === "lire").games.includes("trace")'),
    ev('PROGRESS_CHEERS.trace') === 'Tes lettres sont de plus en plus belles !',
  ]);
}

(async () => {
  await t.start();
  section("Trace avec ton doigt : l'écran au palier 2");
  startTrace(2);
  ecranPad();
  ecranBande();
  const traced = t.traceRest();
  const win = await t.won();
  check("ligne 14 : tracer chaque trait de la solution, dans l'ordre, fait gagner la mission", () => [traced, win]);
  ev('closeModal()');
  section("Trace avec ton doigt : l'en-tête et la consigne");
  enTete();
  section('Trace avec ton doigt : palier 5, indices, tables');
  palier5();
  indices();
  tables();
  await t.finish("l'Île des Crayons (trace, l'écran)");
})();
