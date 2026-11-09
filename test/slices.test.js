// Architecture (v54) : modules ES natifs rangés en feature slices. Le
// manifeste js/slices.cjs, les fichiers réels, index.html et sw.js doivent
// correspondre ; les imports respectent les couches, l'API publique (index.js)
// et l'ordre des slices, sans aucun cycle ; aucune variable globale.
const fs = require('fs');
const path = require('path');
const page = require('./tools/page.js');
const { buildModel, importViolations, sliceCycles, missingImports, globalWrites, LAYER_RANK } = require('./tools/boundaries.js');

let failed = 0;
function check(name, cond, detail){
  console.log((cond ? '✅' : '❌') + ' ' + name + (!cond && detail ? `\n     → ${detail}` : ''));
  if(!cond) failed++;
}
const same = (a, b)=> a.length === b.length && a.every((x, i)=> x === b[i]);
const diff = (a, b)=> a.filter(x=> !b.includes(x));

const { SLICES, CSS_ORDER, root } = page;
const modules = page.manifestScripts();

console.log('— Manifeste');
const LAYERS = Object.keys(LAYER_RANK);
check('chaque slice a une couche connue', SLICES.every(s=> LAYERS.includes(s.layer)),
  SLICES.filter(s=> !LAYERS.includes(s.layer)).map(s=> s.id).join(', '));
check('les slices sont rangées de la couche la plus basse à la plus haute',
  SLICES.every((s, i)=> i === 0 || LAYER_RANK[SLICES[i - 1].layer] <= LAYER_RANK[s.layer]));
const ids = SLICES.map(s=> s.id);
check('identifiants de slice uniques', new Set(ids).size === ids.length);
check('aucun fichier JS dans deux slices', new Set(modules).size === modules.length);
const dirs = SLICES.filter(s=> s.files.length).map(s=> [s.id, [...new Set(s.files.map(f=> path.posix.dirname(f)))]]);
check('un dossier par slice, et une slice par dossier', dirs.every(([, d])=> d.length === 1) && new Set(dirs.map(([, d])=> d[0])).size === dirs.length,
  dirs.filter(([, d])=> d.length > 1).map(([id])=> id).join(', '));
const sliceCss = SLICES.flatMap(s=> s.css);
check('chaque feuille de style appartient à une slice, une seule fois',
  new Set(sliceCss).size === sliceCss.length && same([...sliceCss].sort(), [...CSS_ORDER].sort()),
  `en trop : ${diff(sliceCss, CSS_ORDER)} ; manquantes : ${diff(CSS_ORDER, sliceCss)}`);

console.log('— Fichiers réels');
function walkDir(dir){
  return fs.readdirSync(path.join(root, dir), { withFileTypes:true }).flatMap(e=>
    e.isDirectory() ? walkDir(path.join(dir, e.name)) : [path.join(dir, e.name).split(path.sep).join('/')]);
}
const realJs = walkDir('js').filter(f=> f.endsWith('.js'));
check('chaque module de js/ appartient à une slice (fichiers, index.js, main.js)', diff(realJs, modules).length === 0, diff(realJs, modules).join(', '));
check('chaque module du manifeste existe', diff(modules, realJs).length === 0, diff(modules, realJs).join(', '));
check('chaque slice qui a du JS a son index.js (son API publique)', SLICES.filter(s=> s.files.length && s.layer !== 'app')
  .every(s=> fs.existsSync(path.join(root, page.sliceIndex(s)))));
const missingCss = CSS_ORDER.filter(f=> !fs.existsSync(path.join(root, f)));
check('chaque feuille de style du manifeste existe', missingCss.length === 0, missingCss.join(', '));
check('js/ est déclaré en modules ES pour Node (js/package.json)', JSON.parse(page.read('js/package.json')).type === 'module');

console.log('— index.html et sw.js');
check('index.html charge un seul script, le module js/app/main.js',
  same(page.indexScripts(), [page.ENTRY]) && same(page.indexModuleScripts(), [page.ENTRY]), page.indexScripts().join(', '));
check('index.html charge les feuilles de style du manifeste, dans le même ordre', same(page.indexCss(), CSS_ORDER), page.indexCss().join(', '));
const sw = page.read('sw.js');
const swFiles = [...sw.matchAll(/'\.\/([^']+\.(?:js|css))'/g)].map(m=> m[1]);
const expected = [...CSS_ORDER, ...modules];
check('sw.js met en cache exactement les modules et feuilles de style (npm run sw)',
  same([...swFiles].sort(), [...expected].sort()),
  `en trop : ${diff(swFiles, expected)} ; manquants : ${diff(expected, swFiles)}`);

console.log('— Imports');
const model = buildModel(SLICES, root, modules);
const viol = importViolations(model, SLICES);
check('entre slices, seulement l\'index.js ; couches et ordre du manifeste respectés', viol.length === 0, viol.slice(0, 10).join('\n       '));
const missing = missingImports(model);
check('aucun nom d\'un autre fichier utilisé sans import', missing.length === 0, missing.slice(0, 10).join('\n       '));
// le graphe réel, tel qu'esbuild le résout (metafile)
const { metafile } = page.bundle();
const sliceOfFile = new Map(model.map(m=> [m.file, m.slice && m.slice.id]));
const graph = new Map();
for(const [file, info] of Object.entries(metafile.inputs)){
  const from = sliceOfFile.get(file);
  if(!from) continue;
  info.imports.forEach(i=>{ const to = sliceOfFile.get(i.path); if(to && to !== from) (graph.get(from) || graph.set(from, new Set()).get(from)).add(to); });
}
check('le graphe d\'esbuild couvre tous les modules', model.every(m=> metafile.inputs[m.file]), model.filter(m=> !metafile.inputs[m.file]).map(m=> m.file).join(', '));
const cycles = sliceCycles(graph);
check('aucun cycle d\'import entre slices (graphe d\'esbuild)', cycles.length === 0, cycles.map(c=> c.join(' ↔ ')).join(' ; '));
// le regroupement des tests garde les noms : chaque nom de haut niveau est unique
const owners = new Map();
model.forEach(m=> m.defs.forEach(d=> (owners.get(d) || owners.set(d, []).get(d)).push(m.file)));
const dup = [...owners].filter(([, fs])=> fs.length > 1);
check('chaque nom de haut niveau n\'est défini qu\'une fois (les tests les lisent par leur nom)', dup.length === 0,
  dup.map(([n, fs])=> `${n} (${fs.join(', ')})`).join(' ; '));

console.log('— Aucune variable globale');
const writes = model.flatMap(m=> globalWrites(m.file, m.src));
check('aucune écriture sur window, globalThis ou self', writes.length === 0, writes.join('\n       '));
const guards = model.flatMap(m=> [...m.src.matchAll(/typeof\s+([A-Za-z_$][\w$]*)\s*[!=]==?\s*['"]function['"]/g)]
  .filter(x=> owners.has(x[1])).map(x=> `${m.file} : typeof ${x[1]}`));
check('aucune garde « typeof fn === \'function\' » pour une dépendance du jeu', guards.length === 0, guards.join(', '));

console.log('— Le test sait échouer (cas fautifs fabriqués)');
{
  const low = { id:'bas', layer:'entities', files:['js/entities/bas/a.js'] };
  const mid = { id:'milieu', layer:'features', files:['js/features/milieu/m.js'] };
  const high = { id:'haut', layer:'features', files:['js/features/haut/h.js'] };
  const fake = (file, slice, rank, imports, exports)=> ({ file, slice, rank, defs:[], refs:[], exports: exports || [], imports });
  const mk = (src, target, names)=> ({ source: src, target, names });
  const files = [
    fake('js/entities/bas/a.js', low, 0, [mk('../../features/haut/index.js', 'js/features/haut/index.js', ['h'])]),
    fake('js/features/milieu/m.js', mid, 1, [mk('../haut/h.js', 'js/features/haut/h.js', ['h']), mk('../haut/index.js', 'js/features/haut/index.js', ['h'])], ['m']),
    fake('js/features/haut/h.js', high, 2, [], ['h']),
    fake('js/features/haut/index.js', high, 2, [mk('./h.js', 'js/features/haut/h.js', ['h'])], ['h']),
  ];
  const v = importViolations(files, [low, mid, high]);
  check('détecté : une entité qui importe une feature', v.some(x=> /couche supérieure/.test(x)));
  check('détecté : un import d\'un fichier interne d\'une autre slice', v.some(x=> /fichier interne/.test(x)));
  check('détecté : une slice qui importe une slice placée après elle', v.some(x=> /placée après/.test(x)));
  check('détecté : un cycle d\'import entre deux slices', sliceCycles(new Map([['a', new Set(['b'])], ['b', new Set(['a'])]])).length === 1);
  check('détecté : une écriture sur window', globalWrites('x.js', 'window.state = {}; Object.assign(globalThis, { a:1 });').length === 2);
  check('détecté : un nom utilisé sans import', missingImports([{ file:'a.js', defs:['f'], refs:[] }, { file:'b.js', defs:[], refs:['f'] }]).length === 1);
}

console.log(failed ? `\n${failed} test(s) d'architecture en échec` : '\nArchitecture cohérente');
process.exit(failed ? 1 : 0);
