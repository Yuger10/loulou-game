/* Lanceur des tests (factory, phase 1) : `bun run test [filtre…]`.
   - Trouve tout seul test/*.test.js : un nouveau fichier n'a rien à déclarer.
   - Lance les suites en parallèle (un processus Node par suite, autant que
     de cœurs ; TEST_JOBS=n pour changer).
   - Une suite qui commence par `// @shards N` est découpée en N morceaux
     (voir test/tools/shard.js).
   - Filtre : `bun run test jardin licornes` ne lance que ces suites.
   - Affiche une ligne par suite, puis la sortie complète des suites en échec.
   Le code de sortie est 1 si une suite échoue ou si aucune ne correspond. */
const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const dir = path.join(__dirname, '..');
const filters = process.argv.slice(2);
const jobsMax = Number(process.env.TEST_JOBS) || os.availableParallelism();

const files = fs
  .readdirSync(dir)
  .filter((f) => f.endsWith('.test.js'))
  .filter((f) => !filters.length || filters.some((x) => f.includes(x)));
if (!files.length) {
  console.error(`❌ aucune suite ne correspond à : ${filters.join(' ')}`);
  process.exit(1);
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
      env: { ...process.env, TEST_SHARD: `${j.k}/${j.n}` },
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
      ? `\n❌ ${failures.length} suite(s) en échec sur ${jobs.length} (${s} s)`
      : `\n✅ ${jobs.length} suites vertes en ${s} s (${jobsMax} en parallèle)`,
  );
  process.exit(failures.length ? 1 : 0);
}
start();
