// Aller plus loin (track aller-plus-loin_20261122), phase 2 : une mission étoile
// quittée par la croix (relecture de la PR 108). La mission s'arrête avec la
// fenêtre du jeu : le badge ⭐ ne doit pas réapparaître sur une autre fenêtre
// (choix des jeux, espace parents), et le palier lu redevient le palier habituel.
// La porte, elle, reste ouverte : le prochain « Compter » est de nouveau un défi.
const { check, finish, newPage, plain, section, wait } = require('./tools/aller-plus-loin.js');

// une mission étoile de « Compter », son badge affiché
async function startStarMission(p) {
  p.base();
  p.t("state.stars.count = { streak: 0, open: true, miss: 0, won: 0, offered: null }; playGame('count')");
  await wait(0);
}
const badges = (p) => p.d.querySelectorAll('#modal-body .star-badge').length;

async function croix(p) {
  section('Défi étoile : la croix pendant une mission étoile');
  await startStarMission(p);
  check(
    'contrôle : la mission étoile est en cours, avec son badge',
    p.t('inStarMission()') === true && badges(p) === 1,
  );
  p.d.getElementById('modal-close').click();
  check('la fenêtre se ferme', !p.d.getElementById('overlay').classList.contains('show'));
  check('la mission étoile est finie', p.t('inStarMission()') === false && p.t('starActive()') === false);
  check('le palier lu redevient le palier habituel (2)', p.ev('gameDiff()') === 2, `${p.ev('gameDiff()')}`);
  check('la porte reste ouverte', p.starRec().open === true, JSON.stringify(p.starRec()));
}

async function autresFenetres(p) {
  p.ev('openGamePicker()');
  await wait(0);
  check(
    'le choix des jeux ne porte pas le badge',
    !!p.d.querySelector('#modal-body .game-head') && badges(p) === 0,
    `${badges(p)} badge(s)`,
  );
  p.ev('closeModal()');
  p.openParents();
  await wait(0);
  const head = plain((p.d.querySelector('#modal-body .game-head') || {}).textContent);
  check("l'espace parents ne porte pas le badge", badges(p) === 0 && !head.includes('⭐'), head);
  p.ev('closeModal()');
}

async function reprise(p) {
  p.t("playGame('count')");
  await wait(0);
  check(
    'rejoué, « Compter » est de nouveau une mission étoile, avec son badge',
    p.t('inStarMission()') === true && p.ev('gameDiff()') === 3 && badges(p) === 1,
  );
  // les autres fermetures demandées par l'enfant passent par le même chemin
  p.d.dispatchEvent(new p.w.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  check('Échap : la mission étoile est finie', p.t('inStarMission()') === false);
  p.ev('closeModal()');
}

(async () => {
  const p = await newPage();
  await croix(p);
  await autresFenetres(p);
  await reprise(p);
  finish('aller-plus-loin (croix pendant une mission étoile)');
})();
