/* ---------- Le hasard du jeu ----------
   Tout tirage au sort du jeu passe par random() (et pickRandom, shuffle) :
   c'est la seule source de hasard, oxlint interdit Math.random ailleurs dans
   js/. random() appelle Math.random au moment du tirage : un test peut donc
   forcer un tirage en remplaçant Math.random, et la page de test le remplace
   par un générateur à graine quand TEST_SEED est défini (test/tools/page.js) :
   un passage des tests se rejoue alors à l'identique. */
function random() {
  return Math.random();
}

function pickRandom(arr) {
  return arr[Math.floor(random() * arr.length)];
}

function shuffle(arr) {
  return arr
    .map((v) => [random(), v])
    .sort((a, b) => a[0] - b[0])
    .map((v) => v[1]);
}

export { pickRandom, random, shuffle };
