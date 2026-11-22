/* Lit la version du jeu dans js/shared/lib/version.js, pour les outils
   (sync.js écrit le nom du cache de sw.js) et les tests (update.test.js) :
   un seul lecteur, pour qu'ils ne divergent jamais. */
const fs = require('fs');
const path = require('path');

function readVersion() {
  const src = fs.readFileSync(path.join(__dirname, '..', '..', 'js/shared/lib/version.js'), 'utf8');
  const major = Number((/const APP_VERSION = (\d+);/.exec(src) || [])[1]);
  const patch = Number((/const APP_PATCH = (\d+);/.exec(src) || [])[1] || 0);
  if (!major) throw new Error('APP_VERSION introuvable dans js/shared/lib/version.js');
  return { major, patch, label: patch ? `${major}.${patch}` : String(major) };
}

module.exports = { readVersion };
