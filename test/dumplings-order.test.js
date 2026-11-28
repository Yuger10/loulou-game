// L'Île des Squishy Dumplings : le mini-jeu « La commande du chef » (order),
// sans écran : tirage d'une commande (200 par palier), palette, phrase du
// client (règle R2), signature d'une commande et relance (lignes 21, 25, 26 de
// la spec). L'écran : test/dumplings-order-ecran.test.js. Harnais : test/tools/dumplings.js.
const t = require('./tools/dumplings.js');
const { ev, check, section } = t;

const DRAWS = 200;
const draws = (p) => Array.from({ length: DRAWS }, () => ev(`orderNewQuestion(${p})`));
const distinct = (list) => new Set(list).size === list.length;
const sum = (list) => list.reduce((a, b) => a + b, 0);
const key = (x) => `${x.color}-${x.shape}-${x.face}`;
// une sorte n'utilise que les attributs actifs du palier ; les autres gardent leur défaut
function kindOk(x, cfg) {
  return (
    cfg.colors.includes(x.color) &&
    (cfg.attrs.includes('shape') ? ['rond', 'lune'].includes(x.shape) : x.shape === 'rond') &&
    (cfg.attrs.includes('face') ? ['sourit', 'dort'].includes(x.face) : x.face === 'sourit') &&
    x.k === key(x)
  );
}
// deux sortes qui diffèrent par un seul attribut
const oneApart = (a, b) => ['color', 'shape', 'face'].filter((f) => a[f] !== b[f]).length === 1;
// toutes les sortes possibles du palier
function universe(cfg) {
  const shapes = cfg.attrs.includes('shape') ? ['rond', 'lune'] : ['rond'];
  const faces = cfg.attrs.includes('face') ? ['sourit', 'dort'] : ['sourit'];
  return cfg.colors.flatMap((color) => shapes.flatMap((shape) => faces.map((face) => ({ color, shape, face }))));
}

function commande(p, list) {
  const cfg = t.T4[p];
  check(
    `ligne 21, palier ${p} : ${cfg.kinds} sorte(s) différentes, 1 à 3 de chaque, total de ${cfg.min} à ${cfg.max}`,
    () =>
      list.map((q) => {
        const total = sum(q.items.map((x) => x.qty));
        return (
          q.tier === p &&
          q.items.length === cfg.kinds &&
          distinct(q.items.map((x) => x.k)) &&
          q.items.every((x) => Number.isInteger(x.qty) && x.qty >= 1 && x.qty <= 3) &&
          total >= cfg.min &&
          total <= cfg.max
        );
      }),
  );
  check(`ligne 21, palier ${p} : seuls les attributs actifs varient (${cfg.attrs.join(', ')})`, () =>
    list.map((q) => q.items.every((x) => kindOk(x, cfg))),
  );
  check(`palier ${p} : le client est un des six animaux ; la phase de départ est « voir », le plateau vide`, () =>
    list.map(
      (q) => ['🐰', '🦊', '🐻', '🐨', '🐸', '🐧'].includes(q.client) && q.phase === 'see' && q.plate.length === 0,
    ),
  );
}

function palette(p, list) {
  const cfg = t.T4[p];
  const all = universe(cfg);
  check(`ligne 25, palier ${p} : ${cfg.palette} sortes proposées, toutes différentes, dont celles de la commande`, () =>
    list.map(
      (q) =>
        q.palette.length === cfg.palette &&
        distinct(q.palette.map((x) => x.k)) &&
        q.palette.every((x) => kindOk(x, cfg)) &&
        q.items.every((x) => q.palette.some((y) => y.k === x.k)),
    ),
  );
  check(`ligne 25, palier ${p} : les sortes à un seul attribut d'écart passent d'abord`, () =>
    list.map((q) => {
      const ordered = q.items.map((x) => x.k);
      const near = all.filter((x) => !ordered.includes(key(x)) && q.items.some((y) => oneApart(x, y)));
      const extra = q.palette.filter((x) => !ordered.includes(x.k));
      const nearIn = extra.filter((x) => q.items.some((y) => oneApart(x, y))).length;
      return nearIn === Math.min(extra.length, near.length);
    }),
  );
  check(`ligne 25, palier ${p} : la palette est mélangée`, () => [
    new Set(list.map((q) => q.palette.findIndex((x) => x.k === q.items[0].k))).size >= Math.min(3, cfg.palette),
  ]);
}

function relances(p, list) {
  const sig = (q) => ev('orderSignature')(q);
  check(`ligne 26, palier ${p} : 200 relances, jamais deux fois de suite la même commande`, () =>
    list.slice(1).map((q, i) => sig(q) !== sig(list[i])),
  );
  check(`palier ${p} : la signature ne dépend pas de l'ordre des sortes`, () => {
    const q = list[0];
    const flipped = { ...q, items: q.items.slice().reverse() };
    return [sig(q) === sig(flipped), sig(q).length > 3];
  });
}

// règle R2 : quatre commandes écrites à la main
function phrases() {
  // `look` : la forme et le visage, « rond-sourit » par défaut
  const item = (color, qty, look = 'rond-sourit') => {
    const [shape, face] = look.split('-');
    return { color, shape, face, qty, k: key({ color, shape, face }) };
  };
  const say = (tier, items) => ev('orderSay')({ tier, items });
  check('R2, une sorte (palier 1) : « un dumpling vert », « trois dumplings jaunes »', () => [
    say(1, [item('vert', 1)]) === "Bonjour ! Je voudrais un dumpling vert, s'il te plaît !",
    say(1, [item('jaune', 3)]) === "Bonjour ! Je voudrais trois dumplings jaunes, s'il te plaît !",
  ]);
  check('R2, deux sortes (palier 2) : jointes par « et », couleur accordée', () => [
    say(2, [item('rose', 2), item('vert', 1)]) ===
      "Bonjour ! Je voudrais deux dumplings roses et un dumpling vert, s'il te plaît !",
    say(2, [item('violet', 1), item('violet', 2)]).includes('un dumpling violet et deux dumplings violets'),
  ]);
  check('R2, formes (paliers 3 et 4) : « tout rond », « tout ronds », « en demi-lune »', () => [
    say(3, [item('rose', 1), item('jaune', 2, 'lune-sourit')]) ===
      "Bonjour ! Je voudrais un dumpling rose tout rond et deux dumplings jaunes en demi-lune, s'il te plaît !",
    say(4, [item('vert', 2), item('rose', 1, 'lune-sourit'), item('jaune', 1)]) ===
      "Bonjour ! Je voudrais deux dumplings verts tout ronds, un dumpling rose en demi-lune et un dumpling jaune tout rond, s'il te plaît !",
  ]);
  check("R2, trois sortes au palier 5 : l'exemple de la spec, forme et visage", () => [
    say(5, [item('rose', 2), item('vert', 1, 'lune-dort'), item('jaune', 2, 'rond-dort')]) ===
      "Bonjour ! Je voudrais deux dumplings roses tout ronds qui sourient, un dumpling vert en demi-lune qui dort et deux dumplings jaunes tout ronds qui dorment, s'il te plaît !",
    say(5, [item('violet', 1), item('rose', 1, 'lune-sourit'), item('vert', 3, 'lune-dort')]).includes(
      'un dumpling violet tout rond qui sourit, un dumpling rose en demi-lune qui sourit et trois dumplings verts en demi-lune qui dorment',
    ),
  ]);
}

(async () => {
  await t.start();
  section('La commande du chef : tirages, palette, relances');
  for (const p of t.TIERS) {
    const list = draws(p);
    commande(p, list);
    palette(p, list);
    relances(p, list);
  }
  section('La commande du chef : la phrase du client (R2)');
  phrases();
  await t.finish("l'Île des Squishy Dumplings (order, la logique)");
})();
