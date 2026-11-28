// L'Île des Squishy Dumplings : les tables des deux mini-jeux `tens` (« Les
// paniers de dix ») et `order` (« La commande du chef ») : paliers T1 et T4,
// inscription, essais, minuteur, compétences, plafond de l'âge, clés uniques
// (lignes 1, 2, 15, 16, 19, 20, 27 de la spec ; S1, S6).
// Harnais : test/tools/dumplings.js.
const t = require('./tools/dumplings.js');
const { ev, json, check, section } = t;

const count = (list, k) => list.filter((x) => x === k).length;

function paliers() {
  check('ligne 2 : tensRound(p) vaut la table T1, paliers 1 à 5', () =>
    t.TIERS.map((p) => json(ev(`tensRound(${p})`)) === json(t.T1[p])),
  );
  check('ligne 2 : au-delà du palier 5, tensRound garde le palier 5', () => [
    json(ev('tensRound(6)')) === json(t.T1[5]),
  ]);
}

function inscriptionTens() {
  check('ligne 1 : « Les paniers de dix » est inscrit, avec ses indices, dans « choisir un jeu »', () => [
    ev('GAME_TYPES.includes("tens")'),
    ev('hasHints("tens")'),
    json(ev('GAME_LIST.find((x) => x.key === "tens")')) ===
      json({ key: 'tens', emoji: '🧺', name: 'Les paniers de dix' }),
  ]);
  check('ligne 1 : proposé dès 5 ans, jamais à 4 ans', () => [
    ev('gameTypesForAge(5).includes("tens")'),
    ev('gameTypesForAge(6).includes("tens")'),
    ev('gameTypesForAge(9).includes("tens")'),
    !ev('gameTypesForAge(4).includes("tens")'),
  ]);
  check('ligne 15 : pas de minuteur, essais du barème généreux', () => [
    ev('timerFor("tens", 3)') === null,
    ev('timerFor("tens", 5)') === null,
    ev('livesFor("tens", 1)') === Infinity,
    json([2, 3, 4, 5].map((p) => ev(`livesFor("tens", ${p})`))) ===
      json([2, 3, 4, 5].map((p) => ev(`LIVES_TABLE.generous[${p}]`))),
  ]);
  check('ligne 15 : compétence « Nombres » des parents, et sa phrase de progrès', () => [
    ev('SKILL_GROUPS.find((x) => x.id === "nombres").games.includes("tens")'),
    ev('PROGRESS_CHEERS.tens') === 'Tu ranges les nombres en dizaines de mieux en mieux !',
  ]);
}

function clesUniques() {
  const types = ev('GAME_TYPES'),
    list = ev('GAME_LIST.map((x) => x.key)');
  check('clés uniques : aucun jeu en double dans GAME_TYPES ni dans GAME_LIST', () => [
    new Set(types).size === types.length,
    new Set(list).size === list.length,
  ]);
  check('clés uniques : `tens` présent une seule fois dans chaque table', () => [
    count(types, 'tens') === 1,
    count(list, 'tens') === 1,
    count(ev('gameTypesForAge(5)'), 'tens') === 1,
  ]);
}

// ligne 16 (S6) : une enfant de 6 ans, sur une île au palier 6, reste au palier 2
function plafondAge(key) {
  const tiers = [];
  for (let k = 0; k < 12; k++) {
    t.startGame(key, 6, 6);
    tiers.push(ev('gameDiff()'));
  }
  check(`ligne 16 : à 6 ans sur une île au palier 6, « ${key} » se joue au palier 2 au plus`, () => [
    ev('WORLDS[currentWorld].diff') === 6,
    tiers.every((x) => x <= 2),
    ev('hint.kind') === key,
  ]);
  return tiers;
}
function plafondTens() {
  const seen = [];
  for (let k = 0; k < 30; k++) {
    t.startGame('tens', 6, 6);
    seen.push(t.question());
  }
  check('ligne 16 : à 6 ans, « tens » ne propose que lire et construire, jusqu’à 69', () => [
    seen.every((q) => q.mode === 'read' || q.mode === 'make'),
    seen.every((q) => q.n >= 20 && q.n <= 69),
    seen.every((q) => q.tier === 2),
  ]);
  ev('closeModal()');
}

(async () => {
  await t.start();
  section('Les paniers de dix : paliers et tables');
  paliers();
  inscriptionTens();
  clesUniques();
  section("Le plafond de l'âge");
  plafondAge('tens');
  plafondTens();
  await t.finish("l'Île des Squishy Dumplings (tables des jeux)");
})();
