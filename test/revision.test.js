// La révision espacée (« les souvenirs », track revision-espacee_20261122).
// Une question ratée dans math, calc, compare, clock ou reading est gardée
// (state.review), puis reposée 1, 3 et 7 jours plus tard dans une petite
// mission proposée par le compagnon en début de séance.
//   S1  fonctions pures de l'entité (dates fixes)
//   S2  capture des questions ratées, avec une horloge simulée
//   S3  parties trafiquées : chargées, importées, lues par l'espace parents
//   S4  aller-retour item / render de chaque jeu, à chaque palier
//   S6  la mission « souvenirs » ; S7 refus, fermeture, abandon, à plusieurs, pause
const { pureTests } = require('./revision/validation.js');
const { saveTests } = require('./revision/sauvegardes.js');
const { captureTests } = require('./revision/restitution.js');
const { offerTests } = require('./revision/proposition.js');
const { runTests } = require('./revision/manche.js');
const { stopTests } = require('./revision/fin.js');
const { closeTests } = require('./revision/fermeture.js');
const { lifeTests } = require('./revision/parcours.js');
const { report } = require('./revision/fixtures.js');

async function main() {
  await pureTests();
  await saveTests();
  await captureTests();
  await offerTests();
  await runTests();
  await stopTests();
  await closeTests();
  await lifeTests();
  report();
}
main();
