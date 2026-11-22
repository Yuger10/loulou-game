/* Livraison (anti-pattern 5 de docs/factory/AUDIT.md) : la partie mécanique
   du rituel, en une commande, pour ne rien oublier et ne pas se tromper de
   numéro quand plusieurs sessions livrent en parallèle.

     bun run release patch "Résumé en une ligne"   66.2 → 66.3 (sans track)
     bun run release track "Résumé en une ligne"   66.3 → 67   (track livrée)

   Ce que fait le script :
   1. augmente APP_PATCH, ou APP_VERSION avec APP_PATCH remis à 0
      (js/shared/lib/version.js) ;
   2. lance la synchronisation (index.html, sw.js et son cache lagon-vNN) ;
   3. ajoute la ligne de la version dans le tableau de TODO.md ;
   4. ajoute une section à compléter à la fin du PRD.
   Il reste à la main : le texte de la section du PRD, et pour une track
   conductor/ (plan, metadata, registre) et la doc touchée.
   À lancer juste avant la PR, après un rebase sur main. */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { readVersion } = require('./version.js');

const root = path.join(__dirname, '..', '..');
const file = (f) => path.join(root, f);
const [kind, ...words] = process.argv.slice(2);
const summary = words.join(' ').trim();
if (!['patch', 'track'].includes(kind) || !summary) {
  console.error('Usage : bun run release patch|track "Résumé en une ligne"');
  process.exit(1);
}

// 1. la version
const before = readVersion();
const major = kind === 'track' ? before.major + 1 : before.major;
const patch = kind === 'track' ? 0 : before.patch + 1;
const vFile = file('js/shared/lib/version.js');
fs.writeFileSync(
  vFile,
  fs
    .readFileSync(vFile, 'utf8')
    .replace(/const APP_VERSION = \d+;/, `const APP_VERSION = ${major};`)
    .replace(/const APP_PATCH = \d+;/, `const APP_PATCH = ${patch};`),
);
const after = readVersion();

// 2. index.html, sw.js et le nom du cache
execFileSync('node', [file('test/tools/sync.js')], { stdio: 'inherit' });

// 3. TODO.md : une ligne après la dernière version du tableau
const todo = fs.readFileSync(file('TODO.md'), 'utf8').split('\n');
const last = todo.reduce((at, line, i) => (/^\| v\d+(\.\d+)? \|/.test(line) ? i : at), -1);
if (last < 0) throw new Error('tableau des versions introuvable dans TODO.md');
todo.splice(last + 1, 0, `| v${after.label} | ${summary} |`);
fs.writeFileSync(file('TODO.md'), todo.join('\n'));

// 4. PRD : une section à compléter
fs.appendFileSync(
  file('PRD-lagon-magique.md'),
  `\n# v${after.label} : ${summary}\n\n- **Ce que voit l'enfant :** (à compléter)\n- **Pour le code :** (à compléter)\n- Cache \`lagon-v${after.label}\`.\n`,
);

console.log(
  `\nVersion ${before.label} → ${after.label}. À faire à la main : compléter la section v${after.label} du PRD.`,
);
