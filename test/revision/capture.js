const { section, J, check, item, P, waitFor } = require('./fixtures.js');
const {
  startGame,
  EXPECTED_PARAMS,
  hintQ,
  wrongBtn,
  CAPTURE_DAY,
  queue,
  stored,
  setTier,
  rightBtn,
} = require('./jeux.js');
const { EMPTY_JSON } = require('./sauvegardes.js');
const { fullQueue } = require('./file.js');

function captureKeptTests(pg) {
  section('S2 : une mauvaise réponse est gardée (ligne 1)');
  for (const [key, tier] of [
    ['math', 2],
    ['calc', 4],
    ['compare', 3],
    ['clock', 5],
    ['reading', 1],
    ['reading', 3],
  ]) {
    pg.ev('state.review = { items: [], offered: null }; save()');
    startGame(pg, key, tier);
    const p = EXPECTED_PARAMS[key](hintQ(pg));
    wrongBtn(pg, key).click();
    const expected = {
      k: pg.ev(`reviewKey(${J(p)})`),
      p,
      t: tier,
      due: '2026-11-21',
      box: 1,
      fails: 0,
      added: CAPTURE_DAY,
    };
    check(`${key}, palier ${tier} : l'item entre dans la file`, J(queue(pg).items) === J([expected]), J(queue(pg)));
    check(`${key}, palier ${tier} : la partie est enregistrée`, J(stored(pg)) === J(queue(pg)), J(stored(pg)));
    check(`${key}, palier ${tier} : le palier gardé est celui du moment`, pg.ev('gameDiff()') === tier);
  }
}

function captureAgainTests(pg) {
  section('S2 : la même question ratée à nouveau (ligne 2)');
  const before = { items: [item('clock'), item('math', { due: '2026-11-27', box: 3, fails: 1 })], offered: null };
  pg.ev(`state.review = ${J(before)}; save()`);
  startGame(pg, 'math', 3);
  pg.ev(`renderMath(${J(P.math)})`); // la question 7 + 5, en jeu normal
  wrongBtn(pg, 'math').click();
  check(
    'pas de doublon : box 1, dû demain, palier du moment, même place',
    J(queue(pg)) ===
      J({
        items: [item('clock'), item('math', { t: 3, due: '2026-11-21', box: 1, fails: 1 })],
        offered: null,
      }),
    J(queue(pg)),
  );
}

async function captureNothingTests(pg) {
  section('S2 : ce qui ne se garde pas (ligne 3)');
  const { ev } = pg;
  const reset = () => ev('closeModal(); endBonusChallenge(); state.review = { items: [], offered: null }; save()');
  const nothing = (name) => check(name, J(queue(pg)) === EMPTY_JSON, J(queue(pg)));
  reset();
  startGame(pg, 'math', 3);
  ev('party.active = true');
  wrongBtn(pg, 'math').click();
  ev('party.active = false');
  nothing('à plusieurs (chacun son tour) : rien');
  reset();
  startGame(pg, 'math', 3);
  ev('race.active = true');
  wrongBtn(pg, 'math').click();
  ev('race.active = false');
  nothing('à plusieurs (course) : rien');
  reset();
  setTier(pg, 'math', 3);
  ev('startBonusChallenge("math")');
  check('le défi bonus de Zap est bien en cours', ev('inBonusChallenge()') === true);
  wrongBtn(pg, 'math').click();
  nothing('défi bonus de Zap : rien');
  reset();
  startGame(pg, 'math', 3);
  ev('loseLife(null)');
  nothing('temps écoulé : rien');
  reset();
  startGame(pg, 'count', 2);
  [...pg.d.querySelectorAll('.num-btn')].find((b) => b !== rightBtn(pg)).click();
  nothing('un jeu hors de la liste (count) : rien');
  reset();
  startGame(pg, 'math', 3);
  rightBtn(pg).click();
  nothing('une bonne réponse : rien');
  await waitFor(() => pg.d.getElementById('btn-yay'));
  reset();
}

function captureFullTests(pg) {
  section('S2 : une file pleine (ligne 4)');
  const full = fullQueue([6]);
  pg.ev(`state.review = ${J({ items: full, offered: null })}; save()`);
  startGame(pg, 'clock', 2);
  wrongBtn(pg, 'clock').click();
  const q = queue(pg).items;
  check(
    'le plus ancien sort, le nouveau entre en fin de tableau, 30 items',
    q.length === 30 && !q.some((x) => x.k === full[6].k) && q[29].p.g === 'clock' && q[0].k === full[0].k,
    J(q.map((x) => x.k)),
  );
  pg.ev('closeModal(); state.review = { items: [], offered: null }; save()');
}

module.exports = { captureKeptTests, captureAgainTests, captureNothingTests, captureFullTests };
