const { boot, profilesOf, J, wait, SPEED } = require('./fixtures.js');
const { queue } = require('./jeux.js');

/* ============ S6 et S7 : la mission « souvenirs » ============ */
// Nina, déjà connue, avec une file donnée, à un jour donné ; minuteries ×0,1
async function ninaPage(review, day) {
  const pg = boot({
    day,
    fast: true,
    saved: {
      'lagon-magique-profiles': profilesOf(),
      'lagon-magique-save:p1': J({ v: 9, name: 'Nina', avatar: '👧', coins: 12, missions: 7, review }),
    },
  });
  await wait(200);
  // les appels de la pause (game:before, game:after) sont comptés
  pg.ev(`window.__before = []; window.__after = [];
    on('game:before', (k) => { __before.push(k); }); on('game:after', (r) => { __after.push(r); });
    window.__badges = [];
    const body = document.getElementById('modal-body');
    new MutationObserver(() => {
      const b = body.querySelector('.review-badge');
      if (b && __badges[__badges.length - 1] !== b.textContent) __badges.push(b.textContent);
    }).observe(body, { childList: true, subtree: true });`);
  return pg;
}
// une séance commence : l'enfant touche « Jouer » sur l'écran titre
async function startSession(pg) {
  if (!pg.d.getElementById('splash').classList.contains('show')) pg.ev('closeModal(); showSplash()');
  pg.d.getElementById('btn-splash-play').click();
  await wait(200); // la chaîne de début de séance passe 700 ms après (70 ms ici)
}
// la phrase a été dite (la voix reçoit le texte mis en forme par toSpoken)
const heard = (pg, text) => pg.spoken.includes(pg.ev(`toSpoken(${J(text)})`));
const offerOpen = (pg) => !!pg.d.getElementById('review-offer') && modalOpen(pg);
const modalOpen = (pg) => pg.d.getElementById('overlay').classList.contains('show');
const badge = (pg) => (pg.d.querySelector('.review-badge') || { textContent: '' }).textContent;
const currentGame = (pg) => pg.ev('lastGame');
const REVIEW_SHOW = 1500 * SPEED,
  WIN = 400 * SPEED;
// tout ce que la mission ne doit pas changer (le temps de jeu, lui, avance tout seul)
const untouched = (pg) => pg.js('Object.assign({}, state, { review: 0, playTime: 0 })');
// le palier 3 pour tous : un jeu normal y a des cœurs et un minuteur
const tier3 = (pg) =>
  pg.ev(`currentProfile().age = 0; state.missions = 200; currentWorld = 'montagne';
    ['math', 'calc', 'compare', 'clock', 'reading', 'count'].forEach((k) => {
      state.skills[k] = { wins: 0, fails: 0, errors: 0, last: null, recent: [], lvl: 3 };
    }); save()`);
const D = '2026-11-21';
const byKey = (pg, k) => queue(pg).items.find((x) => x.k === k);
const GLOW_PHRASE = `toSpoken("Regarde, c'était celle-ci.")`;

module.exports = {
  offerOpen,
  startSession,
  heard,
  D,
  modalOpen,
  ninaPage,
  currentGame,
  badge,
  byKey,
  WIN,
  GLOW_PHRASE,
  REVIEW_SHOW,
  untouched,
  tier3,
};
