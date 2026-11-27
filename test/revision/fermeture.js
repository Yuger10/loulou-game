const { rightBtn, wrongBtn } = require('./jeux.js');
const { waitFor, wait, check, KEY, J, section, done } = require('./fixtures.js');
const { badge, WIN, modalOpen, byKey, REVIEW_SHOW, ninaPage, D, startSession, tier3 } = require('./seance.js');
const { STOP_ITEMS } = require('./fin.js');

// fermée pendant WIN_DELAY, après une bonne réponse ; rend la file d'avant cette réponse
async function closeDuringWinTests(pg) {
  const { d } = pg;
  d.getElementById('review-yes').click();
  rightBtn(pg).click();
  await waitFor(() => badge(pg) === '🌟 2/3', 1000);
  const after1 = pg.js('state.review');
  rightBtn(pg).click();
  d.getElementById('modal-close').click();
  await wait(WIN * 2 + 50);
  check('fermée pendant WIN_DELAY : aucune fenêtre ne revient', !modalOpen(pg));
  check(
    "… l'item de la question affichée ne change pas, les autres non plus",
    pg.js('state.review') === after1,
    pg.js('state.review'),
  );
  check("… l'item déjà joué garde son nouvel état (sorti après box 7)", !byKey(pg, KEY.math));
  return after1;
}

// fermée (Échap) pendant REVIEW_SHOW_MS, après une erreur
async function closeDuringShowTests(pg, after1) {
  const { ev, d, w } = pg;
  ev('state.review.offered = null; maybeOfferReview()');
  d.getElementById('review-yes').click();
  check('une nouvelle mission repart de la question 1', badge(pg) === '🌟 1/2');
  wrongBtn(pg, ev('lastGame')).click();
  d.dispatchEvent(new w.KeyboardEvent('keydown', { key: 'Escape' }));
  await wait(REVIEW_SHOW * 2);
  check('fermée (Échap) pendant REVIEW_SHOW_MS : aucune fenêtre ne revient', !modalOpen(pg));
  check(
    "… l'item de la question affichée ne change pas",
    pg.js('state.review.items') === J(JSON.parse(after1).items),
    pg.js('state.review.items'),
  );
  check("un abandon n'annonce aucune fin de mission", pg.js('__after') === '[]');
  check('après un abandon, un jeu normal a ses cœurs et son minuteur', () => {
    ev('playGame("math")');
    return !!d.getElementById('lives-bar') && !!d.getElementById('challenge-timer');
  });
  ev('closeModal()');
}

async function playOverTests(pg) {
  section('S7 : un jeu normal lancé par-dessus la mission, sans la fermer');
  const { ev, d } = pg;
  ev('state.review.offered = null; maybeOfferReview()');
  d.getElementById('review-yes').click();
  const open = pg.js('state.review');
  ev('playGame("count")');
  check('le jeu a ses cœurs et son minuteur', !!d.getElementById('lives-bar') && !!d.getElementById('challenge-timer'));
  check('plus de badge de souvenir', !d.querySelector('.review-badge'));
  const lives = () => d.querySelectorAll('#lives-bar .life.on').length;
  const full = lives();
  [...d.querySelectorAll('.num-btn')].find((b) => b !== rightBtn(pg)).click();
  check("une erreur y coûte un essai, comme d'habitude", lives() === full - 1);
  await wait(REVIEW_SHOW * 2);
  check(
    'une autre question du même jeu est reposée, jamais un souvenir',
    !!d.querySelector('.count-row') &&
      !d.querySelector('.review-badge') &&
      !d.getElementById('review-end') &&
      [...d.querySelectorAll('.num-btn')].every((b) => !b.disabled),
  );
  check('la file ne change pas (count ne se garde pas)', pg.js('state.review') === open);
  rightBtn(pg).click();
  check('et une bonne réponse y mène à la victoire normale', await waitFor(() => d.getElementById('btn-yay'), 1000));
  ev('closeModal()');
}

async function closeTests() {
  section('S7 : la fenêtre se ferme en cours de mission (ligne 17)');
  const pg = await ninaPage({ items: STOP_ITEMS, offered: null }, D);
  await startSession(pg);
  tier3(pg);
  const after1 = await closeDuringWinTests(pg);
  await closeDuringShowTests(pg, after1);
  await playOverTests(pg);
  done(pg);
}

module.exports = { closeTests };
