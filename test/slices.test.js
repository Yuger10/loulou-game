// Architecture en feature slices (v51) : le manifeste js/slices.js, index.html,
// sw.js et les fichiers réels doivent correspondre exactement, et chaque nom
// global ne doit être défini qu'à un seul endroit.
const fs = require('fs');
const path = require('path');
const page = require('./tools/page.js');
const { analyzeFiles } = require('./tools/globals.js');

let failed = 0;
function check(name, cond, detail){
  console.log((cond?'✅':'❌')+' '+name + (!cond && detail ? `\n     → ${detail}` : ''));
  if(!cond) failed++;
}
const same = (a, b)=> a.length === b.length && a.every((x, i)=> x === b[i]);
const diff = (a, b)=> a.filter(x=> !b.includes(x));

const { SLICES, CSS_ORDER, root } = page;
const scripts = page.manifestScripts();

console.log('— Manifeste');
const LAYERS = ['shared', 'entities', 'features', 'app'];
check('chaque slice a une couche connue', SLICES.every(s=> LAYERS.includes(s.layer)),
  SLICES.filter(s=> !LAYERS.includes(s.layer)).map(s=> s.id).join(', '));
const ids = SLICES.map(s=> s.id);
check('identifiants de slice uniques', new Set(ids).size === ids.length);
check('aucun fichier JS dans deux slices', new Set(scripts).size === scripts.length);
const sliceCss = SLICES.flatMap(s=> s.css);
check('chaque feuille de style appartient à une slice, une seule fois',
  new Set(sliceCss).size === sliceCss.length && same([...sliceCss].sort(), [...CSS_ORDER].sort()),
  `en trop : ${diff(sliceCss, CSS_ORDER)} ; manquantes : ${diff(CSS_ORDER, sliceCss)}`);

console.log('— Fichiers réels');
function walk(dir){
  return fs.readdirSync(path.join(root, dir), { withFileTypes:true }).flatMap(e=>
    e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name).split(path.sep).join('/')]);
}
const realJs = walk('js').filter(f=> f.endsWith('.js') && f !== 'js/slices.js');
check('chaque fichier de js/ appartient à une slice', diff(realJs, scripts).length === 0, diff(realJs, scripts).join(', '));
check('chaque fichier du manifeste existe', diff(scripts, realJs).length === 0, diff(scripts, realJs).join(', '));
const missingCss = CSS_ORDER.filter(f=> !fs.existsSync(path.join(root, f)));
check('chaque feuille de style du manifeste existe', missingCss.length === 0, missingCss.join(', '));

console.log('— index.html et sw.js');
check('index.html charge les scripts du manifeste, dans le même ordre', same(page.indexScripts(), scripts),
  `index.html : ${diff(page.indexScripts(), scripts)} en trop, ${diff(scripts, page.indexScripts())} manquants (ou ordre différent)`);
check('index.html charge les feuilles de style du manifeste, dans le même ordre', same(page.indexCss(), CSS_ORDER),
  page.indexCss().join(', '));
const sw = page.read('sw.js');
const swFiles = [...sw.matchAll(/'\.\/([^']+\.(?:js|css))'/g)].map(m=> m[1]);
const expected = [...CSS_ORDER, ...scripts];
check('sw.js met en cache exactement les scripts et feuilles de style du manifeste',
  same([...swFiles].sort(), [...expected].sort()),
  `en trop : ${diff(swFiles, expected)} ; manquants : ${diff(expected, swFiles)}`);

console.log('— Noms globaux');
const analysis = analyzeFiles(scripts.map(f=> path.join(root, f)));
const owners = new Map();
analysis.forEach((r, i)=> r.defs.forEach(d=> (owners.get(d) || owners.set(d, []).get(d)).push(scripts[i])));
const dup = [...owners].filter(([, fs])=> fs.length > 1);
check('chaque nom global n\'est défini qu\'une fois', dup.length === 0,
  dup.map(([n, fs])=> `${n} (${fs.join(', ')})`).join(' ; '));

console.log('— Frontières entre slices');
const { analyzeSlices, boundaryViolations } = require('./tools/boundaries.js');
const files = analyzeSlices(SLICES, root);
const violations = boundaryViolations(files);
check('couches et API publiques respectées', violations.length === 0, violations.slice(0, 12).join('\n       '));
// chaque nom d'une API publique est bien défini par sa slice
const defined = new Map();
files.forEach(f=> f.owner.forEach((s, n)=> defined.set(n, s.id)));
const stale = SLICES.flatMap(s=> (s.public || []).filter(n=> defined.get(n) !== s.id).map(n=> `${s.id}.${n}`));
check('les API publiques ne citent que des noms définis par leur slice', stale.length === 0, stale.join(', '));
check('chaque slice déclare son API publique', SLICES.every(s=> Array.isArray(s.public)),
  SLICES.filter(s=> !Array.isArray(s.public)).map(s=> s.id).join(', '));
// le test sait-il échouer ? deux cas fautifs fabriqués
{
  const low = { id:'bas', layer:'entities', public:[] }, high = { id:'haut', layer:'features', public:['ok'] };
  const owner = new Map([['secret', high], ['ok', high], ['interne', low]]);
  const up = boundaryViolations([{ file:'bas.js', slice:low, refs:['ok'], owner }]);
  const priv = boundaryViolations([{ file:'haut.js', slice:high, refs:['interne'], owner }]);
  check('cas fautif détecté : une entité qui appelle une feature', up.length === 1 && /couche supérieure/.test(up[0]));
  check('cas fautif détecté : un nom hors de l\'API publique', priv.length === 1 && /API publique/.test(priv[0]));
}

console.log(failed ? `\n${failed} test(s) d'architecture en échec` : '\nArchitecture cohérente');
process.exit(failed ? 1 : 0);
