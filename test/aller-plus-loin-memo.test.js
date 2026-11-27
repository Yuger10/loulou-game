// Aller plus loin (track aller-plus-loin_20261122), phase 2 : le défi étoile au
// mémo (relecture de la PR 108). Décision D10 : au mémo, la porte se ferme après
// 6 erreurs d'affilée (2 × la tolérance du mémo), car retourner deux cartes
// différentes fait partie du jeu. « D'affilée » : une paire trouvée remet le
// compteur à 0, sinon les 7 couples du palier 5 ferment la porte rien qu'en
// étant découverts.
const { check, finish, json, newPage, section, wait } = require('./tools/aller-plus-loin.js');

// une mission étoile de mémo : CE1 (plafond 4), mémo au niveau 4, donc palier 5 (7 paires)
async function startMemo(p, miss) {
  p.base();
  p.solo(7, 'CE1', 'volcan');
  p.t('state.skills.memory = { wins: 5, fails: 0, errors: 0, last: null, recent: [], lvl: 4, hints: 0 }');
  p.t(`state.stars.memory = { streak: 0, open: true, miss: ${miss}, won: 0, offered: null }; playGame('memory')`);
  await wait(0);
}
// les cartes dans l'ordre de la solution : deux cartes à la suite forment une paire
const cards = (p) => p.ev('gameSolution') || [];
// retourner deux cartes (leurs rangs dans la solution), puis attendre que le jeu réponde
async function flip(p, pair, ms) {
  const sol = cards(p);
  for (const i of pair) p.d.querySelector(sol[i]).click();
  await wait(ms);
}
const mismatch = (p) => flip(p, [0, 2], 760); // deux cartes différentes : elles se retournent après 700 ms
const badges = (p) => p.d.querySelectorAll('#modal-body .star-badge').length;

async function paireTrouvee(p) {
  section('Défi étoile au mémo : une paire trouvée');
  await startMemo(p, 4);
  check(
    'contrôle : mission étoile de mémo au palier 5 (7 paires), essais du palier 4',
    p.t('inStarMission()') === true && p.ev('gameDiff()') === 5 && cards(p).length === 14 && p.ev('maxLives') === 8,
    `palier ${p.ev('gameDiff()')}, ${cards(p).length} cartes, ${p.ev('maxLives')} essais`,
  );
  await mismatch(p);
  check(
    'une erreur de plus : miss vaut 5, la porte reste ouverte',
    p.starRec('memory').miss === 5 && p.starRec('memory').open === true && badges(p) === 1,
    json(p.starRec('memory')),
  );
  await flip(p, [4, 5], 420); // une paire : elle reste trouvée après 350 ms
  check('contrôle : la paire est trouvée', p.d.querySelectorAll('.mcard.matched').length === 2);
  check(
    'D10 : une paire trouvée remet miss à 0',
    p.starRec('memory').miss === 0,
    `miss vaut ${p.starRec('memory').miss}`,
  );
  await mismatch(p);
  check(
    "D10 : l'erreur qui suit une paire trouvée ne ferme pas la porte",
    p.starRec('memory').open === true && p.starRec('memory').miss === 1 && badges(p) === 1,
    json(p.starRec('memory')),
  );
  p.t('closeModal()');
}

async function sixErreurs(p) {
  section("Défi étoile au mémo : 6 erreurs d'affilée");
  await startMemo(p, 4);
  await mismatch(p);
  check(
    "D10 : après 5 erreurs d'affilée, la porte reste ouverte (la limite n'est pas 2)",
    p.starRec('memory').open === true && p.starRec('memory').miss === 5,
    json(p.starRec('memory')),
  );
  await mismatch(p);
  check(
    "D10 : la 6e erreur d'affilée ferme la porte",
    json(p.starRec('memory')) === json({ streak: 0, open: false, miss: 0, won: 0, offered: null }),
    json(p.starRec('memory')),
  );
  check('le badge est retiré, la mission continue', badges(p) === 0 && p.t('inStarMission()') === true);
  p.t('closeModal()');
}

(async () => {
  const p = await newPage();
  await paireTrouvee(p);
  await sixErreurs(p);
  finish('aller-plus-loin (défi étoile au mémo)');
})();
