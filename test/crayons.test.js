// L'Île des Crayons (saison 3, île 1, track monde-crayons) : le mini-jeu
// « Trace avec ton doigt », sans écran : paliers, glyphes, points d'un trait et
// juge du tracé (lignes 1 à 12 de la spec). Harnais : test/tools/crayons.js.
// La suite : test/crayons-trace.test.js (l'écran), test/crayons-trace-rates.test.js
// (traits suivants et ratés), test/crayons-length*.test.js (« Mesure les
// crayons »), test/crayons-ile*.test.js (l'île).
const t = require('./tools/crayons.js');
const { ev, json, check, section, has, dist, strokes, paths, model, judge, TRACE_TIERS, TIERS } = t;

/* ================= Paliers et glyphes ================= */
function paliers() {
  check('ligne 1 : traceRound(p) vaut la table des paliers, de 1 à 5', () =>
    TIERS.map((p) => json(ev(`traceRound(${p})`)) === json(TRACE_TIERS[p])),
  );
  check('les ensembles de glyphes sont ceux de la spec', () => [json(ev('TRACE_SETS')) === json(t.TRACE_SETS)]);
  check("ligne 2 : traceBuildRound tire le bon nombre de glyphes, dans l'ensemble du palier, sans doublon", () =>
    TIERS.flatMap((p) =>
      Array.from({ length: 40 }, () => {
        const b = ev(`traceBuildRound(${p})`);
        return [
          json(b.rules) === json(TRACE_TIERS[p]),
          b.glyphs.length === TRACE_TIERS[p].glyphs,
          b.glyphs.every((id) => t.TRACE_SETS[TRACE_TIERS[p].set].includes(id)),
          new Set(b.glyphs).size === b.glyphs.length,
        ].every(Boolean);
      }),
    ),
  );
}

function glyphes() {
  check('23 glyphes : 10 chiffres, 4 capitales, 9 lettres attachées, chacun avec son id', () => {
    const G = ev('TRACE_GLYPHS'),
      ids = Object.keys(G);
    const kinds = (k) => ids.filter((id) => G[id].kind === k).length;
    return [
      ids.length === 23,
      ids.every((id) => G[id].id === id && G[id].say && G[id].strokes.length >= 1),
      kinds('chiffre') === 10,
      kinds('capitale') === 4,
      kinds('attachée') === 9,
    ];
  });
  check('un mot et un emoji pour chaque lettre, aucun pour un chiffre ; le mot contient la lettre', () => {
    const G = ev('TRACE_GLYPHS');
    const plain = (x) => x.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
    return Object.values(G).map((g) =>
      g.kind === 'chiffre'
        ? g.word === undefined && g.emoji === undefined
        : !!g.emoji && plain(g.word).includes(g.id.toLowerCase()),
    );
  });
  check('les mots et les noms de la table : lion, lapin, lune, étoile, quatre', () => {
    const G = ev('TRACE_GLYPHS');
    return [
      G.L.word === 'lion',
      G.l.word === 'lapin',
      G.u.word === 'lune',
      G.E.word === 'étoile',
      G['4'].say === 'quatre',
      G['0'].say === 'zéro',
    ];
  });
}

function codage() {
  check('les glyphes à plusieurs traits : 4, 5, T, E (2), H (3), i (2, dont le point), t (2)', () => {
    const multi = Object.values(ev('TRACE_GLYPHS'))
      .filter((g) => g.strokes.length > 1)
      .map((g) => g.id + g.strokes.length);
    return [
      json(multi.sort()) === json(['42', '52', 'E2', 'H3', 'T2', 'i2', 't2'].sort()),
      json(ev('TRACE_GLYPHS.i.strokes[1]')) === json({ kind: 'dot', at: [45, 36] }),
    ];
  });
  check('le codage exact du 0 et du i (exemples de la spec)', () => [
    json(ev('TRACE_GLYPHS["0"]')) ===
      json({
        id: '0',
        kind: 'chiffre',
        say: 'zéro',
        strokes: [
          { kind: 'path', closed: true, parts: [{ k: 'A', cx: 50, cy: 50, rx: 22, ry: 35, a0: 270, a1: -90 }] },
        ],
      }),
    json(ev('TRACE_GLYPHS.i.strokes[0]')) ===
      json({
        kind: 'path',
        closed: false,
        parts: [
          {
            k: 'P',
            pts: [
              [25, 85],
              [45, 52],
              [45, 78],
              [53, 86],
              [68, 80],
            ],
          },
        ],
      }),
  ]);
}

// le départ d'un trait, lu dans la table des glyphes
function startOf(st) {
  if (st.kind === 'dot') return st.at;
  const a = st.parts[0];
  if (a.k === 'P') return a.pts[0];
  const rad = (a.a0 * Math.PI) / 180;
  return [a.cx + a.rx * Math.cos(rad), a.cy + a.ry * Math.sin(rad)];
}

function points() {
  check('ligne 3 : les points de chaque trait sont dans le carré, à 3 unités au plus les uns des autres', () =>
    strokes().map(({ st }) => {
      const pts = model(st);
      return (
        pts.length >= 1 &&
        pts.every(([x, y]) => x >= 0 && x <= 100 && y >= 0 && y <= 100) &&
        pts.every((p, i) => i === 0 || dist(p, pts[i - 1]) <= 3.0001)
      );
    }),
  );
  check('ligne 3 : le premier point est le départ du trait', () =>
    strokes().map(({ st }) => dist(model(st)[0], startOf(st)) < 0.001),
  );
  check('un trait fermé (closed) : seulement le 0 et le 8', () =>
    paths().map(({ g, st }) => {
      const pts = model(st);
      return st.closed === dist(pts[0], pts[pts.length - 1]) < 1 && st.closed === (g === '0' || g === '8');
    }),
  );
  check('le point du i renvoie son seul point', () => [
    json(ev('traceStrokePoints(TRACE_GLYPHS.i.strokes[1])')) === json([[45, 36]]),
  ]);
  check("ligne 12 : traceClientToPad ramène un point de l'écran dans le carré de 0 à 100", () => [
    json(ev('traceClientToPad({ clientX: 150, clientY: 75 }, { left: 50, top: 25, width: 200, height: 200 })')) ===
      json([50, 25]),
  ]);
}

/* ================= Le juge ================= */
// vrai si `fn(trait, palier)` l'est pour chaque trait de la liste, à chaque palier donné
const eachTier = (list, tiers, fn) => list.flatMap(({ st }) => tiers.map((p) => fn(st, p)));
const refused = (r, reason) => r.ok === false && r.reason === reason;

function tolerance() {
  check('ligne 4 : le modèle lui-même est accepté, pour chaque trait, à chaque palier', () =>
    eachTier(strokes(), TIERS, (st, p) => judge(st, model(st), p).ok === true),
  );
  check('ligne 5 : un tracé décalé de 0,7 × R vers la droite est accepté (tolérance)', () =>
    eachTier(paths(), TIERS, (st, p) => {
      const R = TRACE_TIERS[p].R;
      const shifted = model(st).map(([x, y]) => [x + 0.7 * R, y]);
      return judge(st, shifted, p).ok;
    }),
  );
  check('ligne 6 : une main qui tremble (0,5 × R) est acceptée', () =>
    eachTier(paths(), TIERS, (st, p) => {
      const R = TRACE_TIERS[p].R;
      const shaky = model(st).map(([x, y], i) => [x + 0.5 * R * Math.sin(i / 5), y + 0.5 * R * Math.cos(i / 7)]);
      return judge(st, shaky, p).ok;
    }),
  );
}

function refus() {
  const open = paths().filter((x) => !x.st.closed);
  const reversed = (st) => model(st).slice().reverse();
  check('ligne 7 : tous les traits sont ouverts, sauf le 0, le 8 et le point du i', () => [
    open.length === paths().length - 2,
    open.length === strokes().length - 3,
  ]);
  check("ligne 7 : un trait ouvert tracé à l'envers est accepté au palier 1", () =>
    eachTier(open, [1], (st, p) => judge(st, reversed(st), p).ok === true),
  );
  check('ligne 7 : il est refusé dès le palier 2 (raison start)', () =>
    eachTier(open, [2, 3, 4, 5], (st, p) => refused(judge(st, reversed(st), p), 'start')),
  );
  check('ligne 8 : le 0 tracé dans le mauvais sens (même départ) est refusé dès le palier 2 (raison cover)', () => {
    const st = ev('TRACE_GLYPHS["0"].strokes[0]');
    const wrong = model(st).map(([x, y]) => [100 - x, y]); // même départ en haut, sens des aiguilles d'une montre
    return [2, 3, 4, 5].map((p) => refused(judge(st, wrong, p), 'cover'));
  });
  check('ligne 9 : un gribouillis qui couvre tout le carré est refusé (raison wander), à chaque palier', () =>
    eachTier(paths(), TIERS, (st, p) => refused(judge(st, t.scribble(model(st)[0]), p), 'wander')),
  );
  check('ligne 10 : un simple toucher sur un trait est trop court (raison short)', () =>
    eachTier(paths(), TIERS, (st, p) => refused(judge(st, [model(st)[0], model(st)[0]], p), 'short')),
  );
  check('ligne 11 : le point du i se touche à moins de R ; plus loin, raison dot', () => {
    const st = ev('TRACE_GLYPHS.i.strokes[1]');
    const tap = (x) => [
      [x, 36],
      [x, 36],
    ];
    return TIERS.map((p) => {
      const R = TRACE_TIERS[p].R;
      return judge(st, tap(45 + R - 1), p).ok === true && refused(judge(st, tap(45 + R + 1), p), 'dot');
    });
  });
}

(async () => {
  await t.start();
  section('Trace avec ton doigt : paliers et glyphes');
  if (has('traceRound')) paliers();
  else check('le mini-jeu « trace » existe (traceRound)', false);
  glyphes();
  codage();
  section("Trace avec ton doigt : les points d'un trait");
  points();
  section('Trace avec ton doigt : le juge du tracé');
  tolerance();
  refus();
  await t.finish("l'Île des Crayons (trace, la logique)");
})();
