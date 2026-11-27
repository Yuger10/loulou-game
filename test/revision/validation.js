const { check, J, item, section, P, boot, wait, done } = require('./fixtures.js');
const { dayTests, keyTests, boundsTests } = require('./parametres.js');
const { addMissTests, fullQueueTests, scheduleTests, scheduleQueueTests, pickDueTests } = require('./file.js');

/* ===================== S1 : les fonctions pures ===================== */
// une comparaison par JSON d'une valeur calculée dans la page
const makeEq = (js) => (name, code, expected) =>
  check(
    name,
    () => js(code) === J(expected),
    () => {
      try {
        return `${js(code)} au lieu de ${J(expected)}`;
      } catch (e) {
        return e.message;
      }
    },
  );

const SAN_DAY = '2026-11-22';
const san = (raw) => `sanitizeReview(${J(raw)}, '${SAN_DAY}')`;
// tout ce qui n'est pas un item valide
const BAD_ITEMS = [
  null,
  'x',
  item('math', { p: { g: 'math', a: 70, b: 5, op: '+' }, k: 'math:70+5' }),
  item('reading', { p: { g: 'reading', w: '<img id=pwn src=x>', img: true }, k: 'reading:<img id=pwn src=x>-1' }),
  item('math', { k: 'math:7+6' }),
  item('math', { k: '<img id=pwn src=x>' }),
  item('math', { t: 0 }),
  item('math', { t: 7 }),
  item('math', { t: 1.5 }),
  item('math', { t: '2' }),
  item('math', { due: '21/11/2026' }),
  item('math', { due: '2026-02-30' }),
  item('math', { due: '2026-13-01' }),
  item('math', { due: 20261121 }),
  item('math', { added: 'hier' }),
  item('math', { added: '2026-11-31' }),
  item('math', { box: 2 }),
  item('math', { box: '1' }),
  item('math', { fails: 3 }),
  item('math', { fails: -1 }),
  item('math', { fails: 0.5 }),
  { k: 'math:7+5' },
];
function sanitizeItemTests(eq) {
  section('S1 : une file lue du stockage (sanitizeReview)');
  for (const raw of [undefined, null, 'x', 42, [], { items: 'x' }, { items: null, offered: 5 }])
    eq(
      `illisible (${J(raw)}) : une file vide`,
      `sanitizeReview(${raw === undefined ? 'undefined' : J(raw)}, '${SAN_DAY}')`,
      {
        items: [],
        offered: null,
      },
    );
  eq('une file valide est gardée telle quelle', san({ items: Object.keys(P).map((n) => item(n)), offered: SAN_DAY }), {
    items: Object.keys(P).map((n) => item(n)),
    offered: SAN_DAY,
  });
  eq('chaque item invalide est retiré', san({ items: [...BAD_ITEMS, item('clock')], offered: null }), {
    items: [item('clock')],
    offered: null,
  });
  eq(
    "les champs inconnus sont retirés (de l'item et de ses paramètres)",
    san({
      items: [{ ...item('math'), html: '<b>x</b>', p: { ...P.math, extra: 1 } }],
      offered: null,
      autre: 1,
    }),
    { items: [item('math')], offered: null },
  );
  eq(
    'les doublons de clé sont retirés (le premier est gardé)',
    san({ items: [item('math'), item('clock'), item('math', { box: 7, t: 5 })], offered: null }),
    { items: [item('math'), item('clock')], offered: null },
  );
}

function sanitizeQueueTests(eq) {
  const many = Array.from({ length: 500 }, (_, i) => ({
    k: `compare:${1 + (i % 100)}-${1 + Math.floor(i / 100)}`,
    p: { g: 'compare', a: 1 + (i % 100), b: 1 + Math.floor(i / 100) },
    t: 1,
    due: '2026-11-21',
    box: 1,
    fails: 0,
    added: '2026-11-20',
  }));
  eq(
    '500 items : les 30 premiers valides sont gardés',
    `sanitizeReview(${J({ items: [null, ...many], offered: null })}, '${SAN_DAY}').items.map((x) => x.k)`,
    many.slice(0, 30).map((x) => x.k),
  );
  eq(
    "une date `due` trop lointaine est ramenée à aujourd'hui + 7",
    san({ items: [item('math', { due: '2031-01-01' }), item('clock', { due: '2026-11-29' })], offered: null }).concat(
      '.items.map((x) => x.due)',
    ),
    ['2026-11-29', '2026-11-29'],
  );
  for (const offered of ['demain', '2026-02-30', 5, {}, '<img id=pwn src=x>'])
    eq(`offered invalide (${J(offered)}) devient null`, san({ items: [], offered }).concat('.offered'), null);
}

async function pureTests() {
  const pg = boot();
  await wait(100);
  const eq = makeEq(pg.js);
  dayTests(eq);
  keyTests(eq);
  boundsTests(pg.ev);
  addMissTests(eq);
  fullQueueTests(eq);
  scheduleTests(eq);
  scheduleQueueTests(eq);
  pickDueTests(eq);
  sanitizeItemTests(eq);
  sanitizeQueueTests(eq);
  done(pg);
}

module.exports = { pureTests };
