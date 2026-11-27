const { item, check, P, waitFor, J, wait, KEY, section, done } = require('./fixtures.js');
const { SHOWN, wrongBtn, rightBtn } = require('./jeux.js');
const { badge, REVIEW_SHOW, GLOW_PHRASE, byKey, heard, startSession, ninaPage, D } = require('./seance.js');

const STOP_ITEMS = [item('math', { box: 7 }), item('clock', { box: 3 }), item('compare')];

// deux erreurs : la bonne réponse est montrée, puis l'écran de fin remplace la question 3
async function stopAfterTwoTests(pg) {
  const { ev, d, spoken } = pg;
  check("question 1 (la mieux sue d'abord : box 7)", () => SHOWN.math(d, P.math) && badge(pg) === '🌟 1/3');
  wrongBtn(pg, 'math').click();
  const t1 = Date.now();
  check(
    'T + 1500 ms : question 2',
    (await waitFor(() => badge(pg) === '🌟 2/3', 1000)) && Date.now() - t1 >= REVIEW_SHOW - 5,
  );
  spoken.length = 0;
  const right = rightBtn(pg);
  wrongBtn(pg, 'clock').click();
  const t2 = Date.now();
  check(
    'deuxième erreur : la bonne réponse est montrée comme la première fois',
    right.classList.contains('hint-glow') &&
      J(spoken) === J([ev(GLOW_PHRASE)]) &&
      [...d.querySelectorAll('#modal-body button:not(.btn-speak)')].every((b) => b.disabled),
  );
  await wait(REVIEW_SHOW / 2);
  check(
    '… et elle reste affichée',
    Date.now() - t2 >= REVIEW_SHOW - 30 || (badge(pg) === '🌟 2/3' && !d.getElementById('review-end')),
  );
  check("T2 + 1500 ms : l'écran de fin", await waitFor(() => d.getElementById('review-end'), 1000));
  check(`… pas avant (${Date.now() - t2} ms)`, Date.now() - t2 >= REVIEW_SHOW - 15);
  await wait(REVIEW_SHOW * 2);
  check(
    "la question 3 n'est jamais affichée",
    pg.js('__badges') === J(['🌟 1/3', '🌟 2/3']) && !!d.getElementById('review-end'),
  );
}

function stopEndTests(pg) {
  const { d, spoken } = pg;
  check("l'item de la question 3 est identique", J(byKey(pg, KEY.compare)) === J(STOP_ITEMS[2]));
  check(
    'les deux items ratés : box 1, dû le lendemain, fails + 1',
    J([byKey(pg, KEY.math), byKey(pg, KEY.clock)]) ===
      J([item('math', { due: '2026-11-22', fails: 1 }), item('clock', { due: '2026-11-22', fails: 1 })]),
  );
  const none = "Merci d'avoir joué avec moi ! On en reparle bientôt.";
  check(
    'fin, aucune juste : la phrase',
    heard(pg, none) && d.getElementById('review-end').textContent.includes(none),
    J(spoken),
  );
  check('une fin de mission annoncée', pg.js('__after') === J([{ win: true }]));
  check(
    "jamais « erreur », « raté » ni « faux » à l'écran de fin",
    !/erreur|rat[ée]|faux/i.test(d.getElementById('modal-body').textContent),
  );
  d.getElementById('review-done').click();
}

// tout juste, avec les dernières transitions : box 7 sort, box 3 passe à 7
async function allRightTests(pg) {
  const { ev, d, spoken } = pg;
  pg.setDay('2026-11-25');
  ev(`state.review = ${J({ items: [item('math', { box: 7 }), item('clock', { box: 3 })], offered: null })}`);
  await startSession(pg);
  d.getElementById('review-yes').click();
  spoken.length = 0;
  rightBtn(pg).click();
  await waitFor(() => badge(pg) === '🌟 2/2', 1000);
  rightBtn(pg).click();
  await waitFor(() => d.getElementById('review-end'), 1000);
  const all = 'Bravo, ta mémoire a bien travaillé !';
  check(
    'fin, tout juste : la phrase',
    heard(pg, all) && d.getElementById('review-end').textContent.includes(all),
    J(spoken),
  );
  check(
    'réussite en box 7 : sorti de la file ; en box 3 : box 7, dû 7 jours après',
    pg.js('state.review.items') === J([item('clock', { box: 7, due: '2026-12-02' })]),
    pg.js('state.review.items'),
  );
  d.getElementById('review-done').click();
}

// une 3ᵉ erreur de révision fait sortir l'item
async function thirdFailTests(pg) {
  const { ev, d } = pg;
  pg.setDay('2026-11-26');
  ev(`state.review = ${J({ items: [item('math', { fails: 2 }), item('clock')], offered: null })}`);
  await startSession(pg);
  d.getElementById('review-yes').click();
  wrongBtn(pg, ev('lastGame')).click();
  await waitFor(() => badge(pg) === '🌟 2/2', 1000);
  check(
    'échec avec fails 2 : sorti de la file',
    pg.js('state.review.items') === J([item('clock')]),
    pg.js('state.review.items'),
  );
  ev('closeModal()');
}

async function stopTests() {
  section('S6 : arrêt après deux erreurs (ligne 15), et les autres phrases de fin');
  const pg = await ninaPage({ items: STOP_ITEMS, offered: null }, D);
  await startSession(pg);
  pg.d.getElementById('review-yes').click();
  await stopAfterTwoTests(pg);
  stopEndTests(pg);
  await allRightTests(pg);
  await thirdFailTests(pg);
  done(pg);
}

module.exports = { STOP_ITEMS, stopTests };
