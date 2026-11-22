/* `bun run check` et `bun run verify` (cothon 0.2.0-3, playbook 4.1).
   Lance TOUTES les étapes, même après un échec (on voit tout d'un coup),
   et combine leurs sorties selon le contrat :
     0  tout a réussi ;
     1  une étape a tourné et a trouvé un problème ;
     2  une étape n'a pas pu tourner (outil absent, sortie 2 ou 127).
   Bloqué n'est jamais une réussite : un 2 l'emporte sur un 1.
     node test/tools/check.js [--verify]   --verify ajoute les tests holdout
     node test/tools/check.js --selftest   vérifie sa propre logique */
const { spawnSync } = require('child_process');

const STEPS = [
  ['garde des lockfiles', 'node', ['test/tools/lockfile.js']],
  ['lint et format', 'bun', ['run', 'lint']],
  ['types', 'bun', ['run', 'typecheck']],
  ['docs', 'bun', ['run', 'docs']],
  ['selftests des scripts', 'bun', ['run', 'selftest']],
  ['tests', 'bun', ['run', 'test']],
];
const HOLDOUT = ['tests holdout', 'bun', ['run', 'test:holdout']];

// 0, 1 ou 2 pour une étape : 2 si elle n'a pas pu tourner
function stepCode(result) {
  if (result.error) return 2; // programme introuvable
  if (result.status === 0) return 0;
  if (result.status === 2 || result.status === 127 || result.status === null) return 2;
  return 1;
}
// le pire gagne, et bloqué (2) l'emporte sur échec (1)
const combine = (codes) => (codes.includes(2) ? 2 : codes.includes(1) ? 1 : 0);

function run(steps) {
  const codes = [];
  for (const [label, cmd, args] of steps) {
    const t = Date.now();
    const code = stepCode(spawnSync(cmd, args, { stdio: 'inherit' }));
    codes.push(code);
    const s = ((Date.now() - t) / 1000).toFixed(1);
    console.log(
      `${['✅', '❌', '⛔'][code]} ${label} (${s} s)${code === 2 ? " : bloqué, l'outil n'a pas pu tourner" : ''}`,
    );
  }
  const final = combine(codes);
  console.log(
    [
      '\n✅ check : tout passe',
      '\n❌ check : au moins une étape en échec',
      "\n⛔ check : bloqué (ce n'est pas une réussite)",
    ][final],
  );
  return final;
}

if (process.argv.includes('--selftest')) {
  let ok = true;
  const expect = (name, got, want) => {
    if (got !== want) {
      ok = false;
      console.log(`❌ ${name} : ${got} au lieu de ${want}`);
    }
  };
  expect('réussite', stepCode({ status: 0 }), 0);
  expect('échec', stepCode({ status: 1 }), 1);
  expect('sortie 2', stepCode({ status: 2 }), 2);
  expect('commande introuvable', stepCode({ status: 127 }), 2);
  expect('programme absent', stepCode({ error: new Error('ENOENT'), status: null }), 2);
  expect('tué par un signal', stepCode({ status: null }), 2);
  expect('tout vert', combine([0, 0, 0]), 0);
  expect('un échec', combine([0, 1, 0]), 1);
  expect("bloqué l'emporte", combine([1, 2, 0]), 2);
  const absent = stepCode(spawnSync('commande-qui-n-existe-pas-cothon', [], { stdio: 'ignore' }));
  expect('vrai programme absent', absent, 2);
  console.log(ok ? 'check : selftest ok (10 cas)' : 'check : selftest en échec');
  process.exit(ok ? 0 : 1);
}

process.exit(run(process.argv.includes('--verify') ? [...STEPS, HOLDOUT] : STEPS));
