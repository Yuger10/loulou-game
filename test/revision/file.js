const { EMPTY, section, J, P, item } = require('./fixtures.js');

function addMissTests(eq) {
  section('S1 : une question ratée entre dans la file (addMiss)');
  eq('ligne 1 : ajout (box 1, dû le lendemain)', `addMiss(${J(EMPTY)}, ${J(P.math)}, { t: 2, today: '2026-11-20' })`, {
    items: [item('math')],
    offered: null,
  });
  const before = {
    items: [item('clock'), item('math', { due: '2026-11-27', box: 3 }), item('compare')],
    offered: '2026-11-23',
  };
  eq('ligne 2 : raté de nouveau en jeu', `addMiss(${J(before)}, ${J(P.math)}, { t: 3, today: '2026-11-24' })`, {
    items: [item('clock'), item('math', { t: 3, due: '2026-11-25', box: 1 }), item('compare')],
    offered: '2026-11-23',
  });
  eq(
    'ligne 2 : `fails` ne change pas',
    `addMiss(${J({ items: [item('math', { fails: 2, box: 7 })], offered: null })}, ${J(P.math)}, { t: 1, today: '2026-11-24' }).items[0]`,
    item('math', { fails: 2, box: 1, t: 1, due: '2026-11-25' }),
  );
  eq(
    "addMiss ne modifie pas la file qu'on lui donne",
    `(() => { const rv = ${J(before)}; const s = JSON.stringify(rv); addMiss(rv, ${J(P.math)}, { t: 3, today: '2026-11-24' }); addMiss(rv, ${J(P.reading)}, { t: 3, today: '2026-11-24' }); return JSON.stringify(rv) === s; })()`,
    true,
  );
}

// 30 items : des comparaisons 1-2, 1-3… ; les rangs de `oldest` sont les plus anciens
const fullQueue = (oldest) =>
  Array.from({ length: 30 }, (_, i) => ({
    k: `compare:1-${i + 2}`,
    p: { g: 'compare', a: 1, b: i + 2 },
    t: 1,
    due: '2026-11-21',
    box: 1,
    fails: 0,
    added: oldest.includes(i) ? '2026-11-01' : '2026-11-10',
  }));
function fullQueueTests(eq) {
  // le plus ancien est le 5e, et le 9e a la même date
  const full = fullQueue([4, 8]);
  const after = `addMiss(${J({ items: full, offered: null })}, ${J(P.math)}, { t: 2, today: '2026-11-20' }).items`;
  eq('ligne 4 : la file garde 30 items', `${after}.length`, 30);
  eq(
    'ligne 4 : le plus ancien sort (le premier du tableau à égalité)',
    `${after}.map((x) => x.k)`,
    full
      .filter((_, i) => i !== 4)
      .map((x) => x.k)
      .concat('math:7+5'),
  );
  eq(
    'ligne 4 : une question déjà dans une file pleine ne fait sortir personne',
    `addMiss(${J({ items: full, offered: null })}, ${J(full[3].p)}, { t: 2, today: '2026-11-20' }).items.map((x) => x.k)`,
    full.map((x) => x.k),
  );
}

// une réponse en révision sur une file d'un seul item
const answerOne = (it, ok, day) =>
  `reviewAnswer(${J({ items: [it], offered: null })}, ${J(it.k)}, { ok: ${ok}, today: '${day}' }).items`;
function scheduleTests(eq) {
  section("S1 : l'échéancier (reviewAnswer)");
  const one = answerOne;
  eq('réussite, box 1 : box 3, dû 3 jours après', one(item('math'), true, '2026-11-21'), [
    item('math', { due: '2026-11-24', box: 3 }),
  ]);
  eq(
    'réussite, box 3 : box 7, dû 7 jours après',
    one(item('math', { due: '2026-11-24', box: 3 }), true, '2026-11-24'),
    [item('math', { due: '2026-12-01', box: 7 })],
  );
  eq('réussite, box 7 : sorti de la file', one(item('math', { due: '2026-12-01', box: 7 }), true, '2026-12-01'), []);
  eq('échec, box 3 : box 1, dû le lendemain, fails + 1', one(item('math', { box: 3 }), false, '2026-11-24'), [
    item('math', { due: '2026-11-25', box: 1, fails: 1 }),
  ]);
  eq('échec, box 7 : box 1, dû le lendemain, fails + 1', one(item('math', { box: 7, fails: 1 }), false, '2026-12-01'), [
    item('math', { due: '2026-12-02', box: 1, fails: 2 }),
  ]);
  eq('échec, box 1 : reste box 1', one(item('math'), false, '2026-11-21'), [
    item('math', { due: '2026-11-22', fails: 1 }),
  ]);
  eq('3ᵉ échec : sorti de la file', one(item('math', { fails: 2 }), false, '2026-11-24'), []);
  eq(
    'le délai compte à partir du jour de la révision réelle (10 jours de retard)',
    one(item('math'), true, '2026-12-01'),
    [item('math', { due: '2026-12-04', box: 3 })],
  );
}

function scheduleQueueTests(eq) {
  eq(
    'les autres items, leur ordre et `offered` ne changent pas',
    `reviewAnswer(${J({ items: [item('clock'), item('math'), item('compare')], offered: '2026-11-21' })}, 'math:7+5', { ok: true, today: '2026-11-21' })`,
    { items: [item('clock'), item('math', { due: '2026-11-24', box: 3 }), item('compare')], offered: '2026-11-21' },
  );
  eq(
    'une clé inconnue ne change rien',
    `reviewAnswer(${J({ items: [item('clock')], offered: null })}, 'math:1+1', { ok: true, today: '2026-11-21' })`,
    { items: [item('clock')], offered: null },
  );
  eq(
    "reviewAnswer ne modifie pas la file qu'on lui donne",
    `(() => { const rv = ${J({ items: [item('math')], offered: null })}; const s = JSON.stringify(rv); reviewAnswer(rv, 'math:7+5', { ok: true, today: '2026-11-21' }); reviewAnswer(rv, 'math:7+5', { ok: false, today: '2026-11-21' }); return JSON.stringify(rv) === s; })()`,
    true,
  );
  eq(
    'ligne 19 : raté le 1er, réussi le 2, le 5 et le 12',
    `(() => {
      const due = [];
      let rv = addMiss(${J(EMPTY)}, ${J(P.math)}, { t: 2, today: '2026-12-01' });
      due.push(rv.items[0].due);
      for (const day of ['2026-12-02', '2026-12-05', '2026-12-12']) {
        rv = reviewAnswer(rv, 'math:7+5', { ok: true, today: day });
        due.push(rv.items.length ? rv.items[0].due : 'sorti');
      }
      return due;
    })()`,
    ['2026-12-02', '2026-12-05', '2026-12-12', 'sorti'],
  );
  eq(
    'ligne 19 : raté le 1er, raté en révision le 2 : dû le 3',
    `reviewAnswer(addMiss(${J(EMPTY)}, ${J(P.math)}, { t: 2, today: '2026-12-01' }), 'math:7+5', { ok: false, today: '2026-12-02' }).items[0].due`,
    '2026-12-03',
  );
}

// un item des exemples de pickDue : son rang, son jeu, puis sa boîte et son jour
const PICK_PARAMS = {
  math: (id) => ({ g: 'math', a: 1, b: id, op: '+' }),
  clock: (id) => ({ g: 'clock', h: id, m: 0 }),
  compare: (id) => ({ g: 'compare', a: 1, b: id }),
  reading: () => P.reading,
  calc: (id) => ({ g: 'calc', mult: { a: 2, b: id } }),
};
const mk = (id, g, [box, due]) => ({
  k: `${g}#${id}`,
  p: PICK_PARAMS[g](id),
  t: 1,
  due,
  box,
  fails: 0,
  added: '2026-11-01',
});
const PICK_EX1 = [
  mk(1, 'math', [1, '2026-11-20']), // A
  mk(2, 'math', [3, '2026-11-19']), // B
  mk(3, 'clock', [1, '2026-11-21']), // C
  mk(4, 'compare', [7, '2026-11-22']), // D
  mk(5, 'reading', [1, '2026-11-23']), // E
  mk(6, 'calc', [3, '2026-11-21']), // F
];
const PICK_EX2 = [
  mk(1, 'math', [1, '2026-11-20']), // X
  mk(2, 'math', [3, '2026-11-21']), // Y
  mk(3, 'math', [1, '2026-11-19']), // Z
  mk(4, 'math', [7, '2026-11-22']), // W
];
function pickDueTests(eq) {
  section('S1 : le choix des souvenirs (pickDue)');
  const ex1 = PICK_EX1;
  eq('exemple 1 : B, F, C', `pickDue(${J({ items: ex1, offered: null })}, '2026-11-22', 3).map((x) => x.k)`, [
    'math#2',
    'calc#6',
    'clock#3',
  ]);
  eq(
    'exemple 2 (passe 2) : Y, Z, X',
    `pickDue(${J({ items: PICK_EX2, offered: null })}, '2026-11-22', 3).map((x) => x.k)`,
    ['math#2', 'math#3', 'math#1'],
  );
  eq(
    'exemple 3 : aucun item dû',
    `pickDue(${J({ items: [mk(5, 'reading', [1, '2026-11-23'])], offered: null })}, '2026-11-22', 3)`,
    [],
  );
  eq('une file vide', `pickDue(${J(EMPTY)}, '2026-11-22', 3)`, []);
  eq(
    'pickDue rend les items entiers, sans modifier la file',
    `(() => { const rv = ${J({ items: ex1, offered: null })}; const s = JSON.stringify(rv); const out = pickDue(rv, '2026-11-22', 3); return JSON.stringify(rv) === s && JSON.stringify(out[0]) === JSON.stringify(rv.items[1]); })()`,
    true,
  );
  eq('pas plus de `max`', `pickDue(${J({ items: ex1, offered: null })}, '2026-11-22', 2).map((x) => x.k)`, [
    'math#2',
    'clock#3',
  ]);
}

module.exports = { addMissTests, fullQueueTests, scheduleTests, scheduleQueueTests, pickDueTests, fullQueue };
