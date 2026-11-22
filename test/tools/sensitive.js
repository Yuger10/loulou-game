/* Garde des zones sensibles (playbook cothon 5.4), lancé par la CI sur
   chaque PR. Liste : docs/factory/AUDIT.md (section 8), validée par Amrou.

     node test/tools/sensitive.js <base>   (ex. origin/main)

   - Une PR qui touche une zone SENSIBLE est signalée (relecture humaine
     obligatoire) : la CI lui pose l'étiquette `needs-human:sensitive`.
   - Une PR qui modifie une zone PROTÉGÉE (tests holdout, workflows de la CI)
     échoue, sauf si Amrou a posé l'étiquette `human:approved`
     (variable PR_LABELS, fournie par la CI).
   Sortie pour la CI (GITHUB_OUTPUT) : `sensitive=true|false` et
   `blocked=true|false` ; la CI pose l'étiquette, puis échoue si bloqué.
   Lancé à la main (sans GITHUB_OUTPUT), il échoue directement.
   Sortie (contrat cothon) : 0 permis, 1 zone protégée sans approbation,
   2 bloqué (git diff impossible).
     node test/tools/sensitive.js --selftest   vérifie le classement */
const fs = require('fs');
const { execFileSync } = require('child_process');

const SENSITIVE = [
  /^js\/entities\/game-state\//, // sauvegarde et migrations
  /^js\/features\/backup\//, // import de sauvegarde (entrée non fiable)
  /^js\/features\/(rest|parents)\//, // pause et porte des parents
  /^(sw\.js|manifest\.json|index\.html)$/, // PWA
  /^(js\/slices\.cjs|test\/slices\.test\.js|test\/tools\/boundaries\.js)$/, // garde d'architecture
  /^(package\.json|bun\.lock)$/, // dépendances
  /^js\/entities\/character\/characters-art\.js$/, // dessins des personnages
];
const PROTECTED = [/^test\/holdout\//, /^\.github\//];

// classe des fichiers modifiés : zones sensibles, zones protégées, PR bloquée ?
function classify(changed, labels) {
  const sensitive = changed.filter((f) => SENSITIVE.some((re) => re.test(f)) || PROTECTED.some((re) => re.test(f)));
  const protectedHits = changed.filter((f) => PROTECTED.some((re) => re.test(f)));
  return { sensitive, protectedHits, blocked: protectedHits.length > 0 && !labels.includes('human:approved') };
}

if (process.argv.includes('--selftest')) {
  const cases = [
    ['rien de sensible', classify(['js/features/map/map.js'], []), { s: 0, p: 0, b: false }],
    ['la sauvegarde est sensible', classify(['js/entities/game-state/state.js'], []), { s: 1, p: 0, b: false }],
    ['un test holdout bloque', classify(['test/holdout/sauvegardes.test.js'], []), { s: 1, p: 1, b: true }],
    ['la CI bloque', classify(['.github/workflows/ci.yml'], []), { s: 1, p: 1, b: true }],
    ['approuvée par Amrou', classify(['.github/workflows/ci.yml'], ['human:approved']), { s: 1, p: 1, b: false }],
    ['les dépendances sont sensibles', classify(['package.json', 'bun.lock'], []), { s: 2, p: 0, b: false }],
  ];
  let ok = true;
  for (const [name, got, want] of cases) {
    if (got.sensitive.length !== want.s || got.protectedHits.length !== want.p || got.blocked !== want.b) {
      ok = false;
      console.log(`❌ ${name} : ${JSON.stringify(got)}`);
    }
  }
  console.log(ok ? `sensitive : selftest ok (${cases.length} cas)` : 'sensitive : selftest en échec');
  process.exit(ok ? 0 : 1);
}

const base = process.argv[2] || 'origin/main';
let changed;
try {
  changed = execFileSync('git', ['diff', '--name-only', `${base}...HEAD`], { encoding: 'utf8' })
    .split('\n')
    .filter(Boolean);
} catch (e) {
  console.error(`⛔ git diff impossible depuis ${base} : ${e.message}`);
  process.exit(2); // bloqué, pas réussi
}
const labels = (process.env.PR_LABELS || '').split(',').map((s) => s.trim());
const { sensitive, protectedHits, blocked } = classify(changed, labels);
console.log(`${changed.length} fichier(s) modifié(s).`);
if (sensitive.length) console.log(`Zones sensibles (relecture humaine) :\n  ${sensitive.join('\n  ')}`);

if (process.env.GITHUB_OUTPUT)
  fs.appendFileSync(process.env.GITHUB_OUTPUT, `sensitive=${sensitive.length > 0}\nblocked=${blocked}\n`);
if (blocked) {
  console.error(
    `❌ Zone protégée modifiée sans l'étiquette « human:approved » :\n  ${protectedHits.join('\n  ')}\n` +
      "   Les tests holdout et les workflows ne changent que sur décision d'Amrou (AGENTS.md).",
  );
  process.exitCode = 1;
  if (!process.env.GITHUB_OUTPUT) process.exit(1);
} else
  console.log(
    protectedHits.length
      ? '✅ Zone protégée modifiée, approuvée (human:approved).'
      : '✅ Aucune zone protégée modifiée.',
  );
