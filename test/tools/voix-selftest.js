/* ---------- Selftest de `bun run voix` (test/tools/voix.js --selftest) ----------
   Ne touche qu'une racine temporaire et n'appelle jamais le vrai service :
   `main` reçoit un faux `fetch` qui compte ses appels et rend les statuts
   voulus, et un `sleep` qui note les pauses sans attendre. oxfmt et `toSpoken`
   viennent du vrai dépôt (spec voix-naturelle, « Selftest sans toucher au dépôt »).
   Sortie : 0 tous les cas passent, 1 un cas est faux, 2 oxfmt introuvable. */
const fs = require('fs');
const path = require('path');
const { MP3, REPO, fakeService, makeBench, repoSnapshot } = require('./voix-banc.js');

const OXFMT = path.join(REPO, 'node_modules', '.bin', 'oxfmt');

async function selftest(main) {
  if (!fs.existsSync(OXFMT)) {
    console.log('⛔ voix : oxfmt introuvable');
    return 2;
  }
  const cases = ['generation', 'service', 'essai'].flatMap((part) => require(`./voix-selftest-${part}.js`));
  const t = makeBench(main);
  const before = repoSnapshot();
  try {
    // l'un après l'autre : ils partagent le dossier d'essai et le compte des racines
    for (const cas of cases) await cas(t);
  } finally {
    fs.rmSync(t.tmp, { recursive: true, force: true });
  }
  t.expect('le vrai dépôt est intact (racine temporaire seule touchée)', repoSnapshot() === before, true);
  t.expect('la racine temporaire est supprimée', fs.existsSync(t.tmp), false);
  return t.report();
}

module.exports = { MP3, fakeService, selftest };
