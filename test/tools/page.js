/* ---------- Page de test construite depuis le manifeste des slices ----------
   jsdom ne charge pas les fichiers tout seul : on remplace les balises
   <link rel="stylesheet"> locales et <script src="js/…"> d'index.html par le
   contenu des fichiers, dans l'ordre du manifeste (js/slices.js). Ainsi les
   tests suivent automatiquement les déplacements de fichiers. */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..', '..');
const { SLICES, CSS_ORDER } = require(path.join(root, 'js', 'slices.js'));

const read = (f)=> fs.readFileSync(path.join(root, f), 'utf8');
const LOCAL_CSS = /<link rel="stylesheet" href="(?!https?:)([^"]+\.css)">\n?/g;
const LOCAL_JS = /<script src="(js\/[^"]+)"><\/script>\n?/g;

function manifestScripts(){ return SLICES.flatMap(s=> s.files); }
function manifestCss(){ return CSS_ORDER.slice(); }

// balises de index.html, dans l'ordre (pour le test de cohérence)
function indexScripts(){ return [...read('index.html').matchAll(LOCAL_JS)].map(m=> m[1]); }
function indexCss(){ return [...read('index.html').matchAll(LOCAL_CSS)].map(m=> m[1]); }

function buildHtml(){
  let html = read('index.html');
  const css = manifestCss().map(f=> '<style>' + read(f) + '</style>').join('\n');
  const js = manifestScripts().map(f=> '<script>' + read(f) + '</script>').join('\n');
  // les feuilles de style à la place de la première, les scripts à la place du premier
  let cssDone = false, jsDone = false;
  html = html.replace(LOCAL_CSS, ()=>{ if(cssDone) return ''; cssDone = true; return css + '\n'; });
  html = html.replace(LOCAL_JS, ()=>{ if(jsDone) return ''; jsDone = true; return js + '\n'; });
  return html;
}

module.exports = { root, SLICES, CSS_ORDER, buildHtml, manifestScripts, manifestCss, indexScripts, indexCss, read };
