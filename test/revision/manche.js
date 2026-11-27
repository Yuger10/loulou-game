const { item, check, P, J, KEY, waitFor, wait, section, done } = require('./fixtures.js');
const { SHOWN, rightBtn, wrongBtn } = require('./jeux.js');
const {
  currentGame,
  badge,
  byKey,
  WIN,
  GLOW_PHRASE,
  REVIEW_SHOW,
  heard,
  modalOpen,
  untouched,
  ninaPage,
  D,
  startSession,
  tier3,
} = require('./seance.js');

// l'exemple 1 de pickDue, au jour J : B (math, box 3), F (calc, box 3), C (clock, box 1)
const RUN_ITEMS = [
  item('math', { due: '2026-11-20' }), // A : même jeu que B, refusé à la passe 1
  item('minus', { box: 3, due: '2026-11-19', t: 5 }), // B
  item('clock', { due: '2026-11-21' }), // C
  item('compare', { box: 7, due: '2026-11-22' }), // D : pas encore dû
  item('reading', { due: '2026-11-23' }), // E : pas encore dû
  item('calc', { box: 3, due: '2026-11-21' }), // F
];
const noTimerNoLives = (d) => !d.getElementById('challenge-timer') && !d.getElementById('lives-bar');

// question 1 : B (9 − 4), telle qu'elle s'affiche
function runFirstShown(pg) {
  const { ev, d } = pg;
  check('ligne 11 : la première question est celle choisie par pickDue (9 − 4)', () => SHOWN.math(d, P.minus));
  check('ligne 11 : son jeu est le jeu courant (setLastGame)', currentGame(pg) === 'math');
  check(
    "ligne 11 : le badge 🌟 1/3, dans l'en-tête",
    () =>
      badge(pg) === '🌟 1/3' &&
      d.querySelector('.game-head .review-badge').getAttribute('aria-label') === 'Souvenir 1 sur 3',
    () => badge(pg),
  );
  check('ligne 12 : ni minuteur, ni cœurs', noTimerNoLives(d));
  check('ligne 12 : le bouton 💡 est là et donne un indice', () => {
    d.querySelector('.hint-btn').click();
    return ev('hintLevel()') === 1;
  });
  ev('delete state.skills.math.hints; save()'); // l'indice demandé pour ce test n'est pas compté plus bas
}

// question 1 : une bonne réponse
async function runFirstRight(pg) {
  pg.spoken.length = 0;
  rightBtn(pg).click();
  check(
    'ligne 13 : rien ne change avant WIN_DELAY',
    J(byKey(pg, KEY.minus)) === J(RUN_ITEMS[1]) && badge(pg) === '🌟 1/3',
  );
  const t1 = Date.now();
  check('ligne 13 : la question suivante arrive', await waitFor(() => badge(pg) === '🌟 2/3', 1000));
  check(`ligne 13 : … WIN_DELAY après (${Date.now() - t1} ms)`, Date.now() - t1 >= WIN - 15);
  check(
    'ligne 13 : box 3 devient box 7, dû 7 jours après (le palier `t` ne change pas)',
    J(byKey(pg, KEY.minus)) === J(item('minus', { box: 7, due: '2026-11-28', t: 5 })),
    J(byKey(pg, KEY.minus)),
  );
  check(
    'ligne 13 : la partie est enregistrée',
    () => J(JSON.parse(pg.w.localStorage.getItem('lagon-magique-save:p1')).review) === pg.js('state.review'),
  );
}

// question 2 : F (23 + 14), une erreur ; rend la bonne réponse et l'instant de l'erreur
function runSecondWrong(pg) {
  const { ev, d, spoken } = pg;
  check('ligne 11 : deuxième question, 23 + 14 (calc)', () => SHOWN.calc(d, P.calc) && currentGame(pg) === 'calc');
  check('ligne 12 : toujours ni minuteur, ni cœurs', noTimerNoLives(d));
  spoken.length = 0;
  const right = rightBtn(pg);
  wrongBtn(pg, 'calc').click();
  const t2 = Date.now();
  const buttons = [...d.querySelectorAll('#modal-body button')];
  check(
    'ligne 14 : tous les boutons sont désactivés (sauf « écouter »)',
    buttons.length > 3 && buttons.every((b) => b.disabled === !b.classList.contains('btn-speak')),
    J(buttons.map((b) => [b.className, b.disabled])),
  );
  check('ligne 14 : la bonne réponse brille', right.classList.contains('hint-glow'));
  check('ligne 14 : une seule phrase est dite', J(spoken) === J([ev(GLOW_PHRASE)]), J(spoken));
  return { right, t2 };
}

// question 2, après l'erreur : seule la première réponse compte, puis on passe à la suite
async function runSecondLocked(pg, { right, t2 }) {
  right.click();
  right.disabled = false; // même si le bouton était encore actif, la première réponse compte seule
  right.click();
  await wait(REVIEW_SHOW / 2);
  // à mi-délai, rien n'a bougé (sans objet si la machine a pris du retard : le délai est déjà passé)
  const late = (t) => Date.now() - t >= REVIEW_SHOW - 30;
  check('ligne 14 : la bonne réponse touchée ensuite ne compte pas', () => {
    const it = byKey(pg, KEY.calc);
    return late(t2) || (badge(pg) === '🌟 2/3' && J(it) === J(RUN_ITEMS[5]));
  });
  check('ligne 14 : on passe à la suite', await waitFor(() => badge(pg) === '🌟 3/3', 1000));
  check(`ligne 14 : … REVIEW_SHOW_MS après l'erreur (${Date.now() - t2} ms)`, Date.now() - t2 >= REVIEW_SHOW - 15);
  check(
    'ligne 14 : box 1, dû le lendemain, fails + 1',
    J(byKey(pg, KEY.calc)) === J(item('calc', { box: 1, due: '2026-11-22', fails: 1 })),
    J(byKey(pg, KEY.calc)),
  );
  check(
    "ligne 14 : la même question n'est pas reposée",
    () => SHOWN.clock(pg.d, P.clock) && currentGame(pg) === 'clock',
  );
}

// question 3 : C (3 h 30), une bonne réponse, puis l'écran de fin
async function runEndScreen(pg) {
  const { ev, d, spoken } = pg;
  spoken.length = 0;
  rightBtn(pg).click();
  check("ligne 16 : l'écran de fin s'ouvre", await waitFor(() => d.getElementById('review-end'), 1000));
  const phrase = `Bravo, tu t'en es ${ev('ac("souvenu", "souvenue")')} ! On garde les autres pour bientôt.`;
  check(
    'ligne 16 : il dit et montre la phrase « au moins une juste »',
    heard(pg, phrase) && d.getElementById('review-end').textContent.includes(phrase),
    J(spoken),
  );
  check('ligne 16 : son bouton « Super ! »', () => d.getElementById('review-done').textContent === 'Super !');
  check(
    'ligne 16 : ni objet gagné, ni minuteur, ni cœurs',
    !d.querySelector('.reward-item, [data-gain-item], #lives-bar, #challenge-timer'),
  );
  check(
    'ligne 16 : une fin de mission est annoncée, une seule',
    pg.js('__after') === J([{ win: true }]),
    pg.js('__after'),
  );
  check("la pause n'a été consultée qu'une fois, avant la proposition", pg.js('__before') === J(['souvenirs']));
  check(
    'ligne 13 : box 1 devient box 3, dû 3 jours après',
    J(byKey(pg, KEY.clock)) === J(item('clock', { box: 3, due: '2026-11-24' })),
  );
  const others = [RUN_ITEMS[0], RUN_ITEMS[3], RUN_ITEMS[4]];
  check('les items non choisis ne changent pas', J(others.map((x) => byKey(pg, x.k))) === J(others));
  check('les badges vus : 1/3, 2/3, 3/3', pg.js('__badges') === J(['🌟 1/3', '🌟 2/3', '🌟 3/3']), pg.js('__badges'));
}

// après l'écran de fin : rien n'a été gagné, et un jeu normal redevient normal
function runAfter(pg, state0) {
  const { ev, d } = pg;
  d.getElementById('review-done').click();
  check('« Super ! » ferme la fenêtre', !modalOpen(pg));
  check(
    'ligne 16 : rien gagné, rien compté (pièces, objets, missions, progrès, quêtes, parties jouées)',
    untouched(pg) === state0,
    `${untouched(pg)}\n     ≠ ${state0}`,
  );
  check('ligne 16 : aucun défi bonus', ev('bonusChallenge') === null);
  check('après la mission, un jeu normal retrouve ses cœurs et son minuteur', () => {
    ev('playGame("math")');
    return (
      !!d.getElementById('lives-bar') && !!d.getElementById('challenge-timer') && !d.querySelector('.review-badge')
    );
  });
  ev('closeModal()');
}

async function runTests() {
  section("S6 : une mission, de la proposition à l'écran de fin (lignes 11 à 16)");
  const pg = await ninaPage({ items: RUN_ITEMS, offered: null }, D);
  await startSession(pg);
  tier3(pg);
  check('la proposition annonce trois souvenirs', heard(pg, "J'ai trois souvenirs pour toi. On joue ensemble ?"));
  const state0 = untouched(pg);
  pg.d.getElementById('review-yes').click();
  runFirstShown(pg);
  await runFirstRight(pg);
  await runSecondLocked(pg, runSecondWrong(pg));
  await runEndScreen(pg);
  runAfter(pg, state0);
  done(pg);
}

module.exports = { runTests };
