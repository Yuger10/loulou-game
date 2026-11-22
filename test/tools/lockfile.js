/* Garde du gestionnaire de paquets (factory, phase 1) : le projet utilise
   bun, et seulement bun. Échoue si un lockfile d'un autre gestionnaire
   réapparaît (un `npm install` par habitude, par exemple). */
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..', '..');
const foreign = ['package-lock.json', 'yarn.lock', 'pnpm-lock.yaml'].filter((f) => fs.existsSync(path.join(root, f)));
if (foreign.length) {
  console.error(
    `❌ Lockfile interdit : ${foreign.join(', ')}. Le projet utilise bun : supprime-le, puis lance \`bun install\`.`,
  );
  process.exit(1);
}
if (!fs.existsSync(path.join(root, 'bun.lock'))) {
  console.error('❌ bun.lock manquant : lance `bun install`.');
  process.exit(1);
}
console.log('✅ lockfile : bun.lock seul');
