/* Lanceur des tests (factory, phase 1) : `bun run test [filtre…]`.
   - Trouve tout seul test/*.test.js : un nouveau fichier n'a rien à déclarer.
   - Lance les suites en parallèle (un processus Node par suite, autant que
     de cœurs ; TEST_JOBS=n pour changer).
   - Une suite qui commence par `// @shards N` est découpée en N morceaux
     (voir test/tools/shard.js).
   - Filtre : `bun run test jardin licornes` ne lance que ces suites.
   - Affiche une ligne par suite, puis la sortie complète des suites en échec.
   - Hasard rejouable : une graine est tirée à chaque passage (ou TEST_SEED=n)
     et transmise aux suites ; en cas d'échec, la commande pour rejouer
     exactement le même passage est affichée.
   Sortie (contrat cothon) : 0 tout vert, 1 une suite échoue, 2 rien n'a pu
   tourner (aucune suite ne correspond).
     node test/tools/run.js --selftest   vérifie le lanceur sur de fausses suites */
const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

// --holdout : les tests holdout (test/holdout/), lancés par `bun run verify` et la CI
const holdout = process.argv.includes('--holdout');
// TEST_DIR : seulement pour le --selftest (de fausses suites dans un dossier temporaire)
const dir = process.env.TEST_DIR || (holdout ? path.join(__dirname, '..', 'holdout') : path.join(__dirname, '..'));
const filters = process.argv.slice(2).filter((a) => a !== '--holdout' && a !== '--selftest');

if (process.argv.includes('--selftest')) selftest();
const jobsMax = Number(process.env.TEST_JOBS) || os.availableParallelism();
const seed =
  Number.isInteger(Number(process.env.TEST_SEED)) && process.env.TEST_SEED !== ''
    ? Number(process.env.TEST_SEED)
    : Math.floor(Math.random() * 100000);

const files = fs
  .readdirSync(dir)
  .filter((f) => f.endsWith('.test.js'))
  .filter((f) => !filters.length || filters.some((x) => f.includes(x)));
if (!files.length) {
  console.error(`⛔ aucune suite ne correspond à : ${filters.join(' ')}`);
  process.exit(2); // rien n'a pu tourner : bloqué, pas réussi
}

const jobs = [];
for (const f of files) {
  const src = fs.readFileSync(path.join(dir, f), 'utf8');
  const n = Number((src.match(/^\/\/ @shards (\d+)/m) || [])[1]) || 1;
  for (let k = 0; k < n; k++) jobs.push({ f, k, n, size: src.length / n });
}
// les plus lourdes d'abord : le temps total est celui de la plus longue
jobs.sort((a, b) => b.n - a.n || b.size - a.size);

const t0 = Date.now();
const failures = [];
let next = 0,
  running = 0;
function label(j) {
  return j.f.replace('.test.js', '') + (j.n > 1 ? ` (${j.k + 1}/${j.n})` : '');
}
function start() {
  while (running < jobsMax && next < jobs.length) {
    const j = jobs[next++],
      t = Date.now();
    running++;
    let out = '';
    const p = spawn(process.execPath, [path.join(dir, j.f)], {
      env: { ...process.env, TEST_SHARD: `${j.k}/${j.n}`, TEST_SEED: String(seed) },
    });
    p.stdout.on('data', (c) => (out += c));
    p.stderr.on('data', (c) => (out += c));
    p.on('close', (code) => {
      running--;
      const s = ((Date.now() - t) / 1000).toFixed(1).padStart(5);
      console.log(`${code === 0 ? '✅' : '❌'} ${s} s  ${label(j)}`);
      if (code !== 0) failures.push({ j, out });
      if (next < jobs.length) start();
      else if (running === 0) done();
    });
  }
}
function done() {
  for (const { j, out } of failures) console.log(`\n──── ${label(j)} ────\n${out}`);
  const s = ((Date.now() - t0) / 1000).toFixed(1);
  console.log(
    failures.length
      ? `\n❌ ${failures.length} suite(s) en échec sur ${jobs.length} (${s} s, graine ${seed})\n` +
          `   rejouer le même passage : TEST_SEED=${seed} bun run test ${[...new Set(failures.map(({ j }) => j.f.replace('.test.js', '')))].join(' ')}`
      : `\n✅ ${jobs.length} suites vertes en ${s} s (${jobsMax} en parallèle, graine ${seed})`,
  );
  process.exit(failures.length ? 1 : 0);
}
start();

// Le lanceur vérifié sur de fausses suites : une verte, une rouge, une
// découpée en 2 morceaux, et un filtre sans correspondance.
function selftest() {
  const { spawnSync } = require('child_process');
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'run-selftest-'));
  fs.writeFileSync(path.join(tmp, 'verte.test.js'), 'process.exit(0);\n');
  fs.writeFileSync(path.join(tmp, 'rouge.test.js'), "console.log('❌ faux échec'); process.exit(1);\n");
  fs.writeFileSync(
    path.join(tmp, 'morceaux.test.js'),
    "// @shards 2\nconsole.log('morceau ' + process.env.TEST_SHARD);\n",
  );
  const go = (...args) =>
    spawnSync(process.execPath, [__filename, ...args], { env: { ...process.env, TEST_DIR: tmp }, encoding: 'utf8' });
  const all = go(),
    green = go('verte', 'morceaux'),
    none = go('introuvable');
  const checks = [
    ['une suite rouge fait sortir en 1', all.status === 1],
    ['sa sortie est affichée', all.stdout.includes('faux échec')],
    [
      'une suite découpée tourne en 2 morceaux',
      /morceaux \(1\/2\)/.test(all.stdout) && /morceaux \(2\/2\)/.test(all.stdout),
    ],
    ['le filtre ne lance que les suites voulues, vertes : 0', green.status === 0 && !green.stdout.includes('rouge')],
    ['aucune suite ne correspond : bloqué, 2', none.status === 2],
  ];
  fs.rmSync(tmp, { recursive: true, force: true });
  for (const [name, ok] of checks) if (!ok) console.log(`❌ ${name}`);
  const ok = checks.every(([, v]) => v);
  console.log(ok ? `run : selftest ok (${checks.length} cas)` : 'run : selftest en échec');
  process.exit(ok ? 0 : 1);
}
