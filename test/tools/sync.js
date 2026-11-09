/* ---------- Aligner index.html et sw.js sur le manifeste des slices ----------
   node test/tools/sync.js   (ou npm run sync)

   Réécrit les balises <script src="js/…"> et <link rel="stylesheet"> locales
   d'index.html, et la liste des scripts et feuilles de style de sw.js
   (FILES), dans l'ordre de js/slices.js. Le reste des fichiers est conservé
   tel quel. test/slices.test.js vérifie ensuite que tout correspond. */
const fs = require('fs');
const path = require('path');
const page = require('./page.js');

const scripts = page.manifestScripts();
const css = page.manifestCss();
const file = (f)=> path.join(page.root, f);

// index.html : un bloc de <link> à la place du premier, un bloc de <script> à la place du premier
let html = fs.readFileSync(file('index.html'), 'utf8');
let done = false;
html = html.replace(/<link rel="stylesheet" href="(?!https?:)[^"]+\.css">\n?/g, ()=>{
  if(done) return ''; done = true;
  return css.map(f=> `<link rel="stylesheet" href="${f}">`).join('\n') + '\n';
});
done = false;
html = html.replace(/<script src="js\/[^"]+"><\/script>\n?/g, ()=>{
  if(done) return ''; done = true;
  return scripts.map(f=> `<script src="${f}"></script>`).join('\n') + '\n';
});
fs.writeFileSync(file('index.html'), html);

// sw.js : on garde les entrées qui ne sont ni .js ni .css (pages, icônes, manifest)
let sw = fs.readFileSync(file('sw.js'), 'utf8');
sw = sw.replace(/const FILES = \[[\s\S]*?\];/, (block)=>{
  const others = [...block.matchAll(/'(\.\/[^']*)'/g)].map(m=> m[1]).filter(f=> !/\.(js|css)$/.test(f));
  const all = [...others, ...css.map(f=> './' + f), ...scripts.map(f=> './' + f)];
  const lines = [];
  for(let i = 0; i < all.length; i += 6) lines.push('  ' + all.slice(i, i + 6).map(f=> `'${f}'`).join(','));
  return 'const FILES = [\n' + lines.join(',\n') + '\n];';
});
fs.writeFileSync(file('sw.js'), sw);
console.log(`index.html et sw.js alignés : ${scripts.length} scripts, ${css.length} feuilles de style`);
