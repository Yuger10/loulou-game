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

/* ---- AGENTS.md, types en JSDoc : jamais `any` ni `@ts-ignore` (ADR 0003) ----
   tsc en mode strict refuse un `any` implicite, pas un `any` écrit : ce garde
   le refuse, sous toutes ses formes (`{any}`, `{*}`, `{?}`, `Array<any>`…). */
console.log('— Types stricts');
const ANY = /[{<(,|:]\s*any\b|\bany\s*[>}[|,)]|\{\s*[*?]\s*\}/;
const IGNORE = /@ts-(ignore|nocheck|expect-error)\b/;
check(
  'le garde reconnaît chaque forme de `any`',
  [
    '/** @type {any} */',
    '/** @param {Array<any>} x */',
    '/** @type {Record<string, any>} */',
    '/** @returns {*} */',
    '/** @type {?} */',
  ].every((l) => ANY.test(l)) &&
    !['/** @type {HTMLElement} */', "const company = 'Anyway'", '/** @type {Set<string>} */'].some((l) =>
      ANY.test(l),
    ) &&
    IGNORE.test('// @ts-ignore') &&
    IGNORE.test('// @ts-expect-error'),
);
const anys = grep(ANY);
check('aucun type `any` dans js/', anys.length === 0, anys.join('\n       '));
const ignores = grep(IGNORE);
check('aucune erreur de type mise sous silence (@ts-ignore)', ignores.length === 0, ignores.join('\n       '));

console.log(`\n${failed ? '❌' : '✅'} gardes : ${passed} vérifications réussies, ${failed} en échec`);
process.exit(failed ? 1 : 0);
