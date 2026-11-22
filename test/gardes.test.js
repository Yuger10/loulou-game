// Gardes de forme du code, pour ce qu'oxlint ne sait pas exprimer
// (docs/factory/AUDIT.md). Chaque garde dit d'où il vient.
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const root = path.join(__dirname, '..');
let failed = 0,
  passed = 0;
function check(name, cond, detail) {
  if (cond) {
    passed++;
    console.log('✅ ' + name);
  } else {
    failed++;
    console.log('❌ ' + name + (detail ? `\n     → ${detail}` : ''));
  }
}
const jsFiles = execFileSync('git', ['ls-files', 'js'], { cwd: root, encoding: 'utf8' })
  .split('\n')
  .filter((f) => f.endsWith('.js'));
// les lignes d'un fichier qui correspondent à un motif : « fichier:ligne: code »
function grep(re, except = []) {
  const out = [];
  for (const f of jsFiles) {
    if (except.includes(f)) continue;
    fs.readFileSync(path.join(root, f), 'utf8')
      .split('\n')
      .forEach((line, i) => {
        if (re.test(line)) out.push(`${f}:${i + 1}: ${line.trim()}`);
      });
  }
  return out;
}

/* ---- anti-pattern 4 : la fin de mission a un seul délai, dans le moteur ---- */
console.log('— Fin de mission');
const timers = grep(/setTimeout\(\s*onMissionWin\b/, ['js/features/minigame-engine/engine.js']);
check(
  'aucun mini-jeu ne programme lui-même sa fin de mission (winSoon)',
  timers.length === 0,
  timers.join('\n       '),
);
const literal = grep(/winSoon\(\s*\d/);
check('winSoon reçoit un délai nommé, jamais un nombre', literal.length === 0, literal.join('\n       '));

console.log(`\n${failed ? '❌' : '✅'} gardes : ${passed} vérifications réussies, ${failed} en échec`);
process.exit(failed ? 1 : 0);
