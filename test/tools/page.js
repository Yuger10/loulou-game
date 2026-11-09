/* ---------- Page de test construite depuis le manifeste des slices ----------
   Le jeu est fait de modules ES natifs (v54), chargés par un seul
   `<script type="module" src="js/app/main.js">`. jsdom gère mal les modules :
   les tests regroupent donc main.js et tout ce qu'il importe en UN script avec
   esbuild (outil de développement seulement ; le jeu, lui, n'a pas de build).
   - Le script est injecté à la place de la balise module, les feuilles de
     style locales sont injectées dans l'ordre du manifeste (CSS_ORDER).
   - « use strict » : le jeu tourne en modules, donc en mode strict.
   - Sans « tree shaking » : tout le code est gardé, et comme chaque nom de
     haut niveau est unique dans le jeu (vérifié par test/slices.test.js),
     esbuild n'en renomme aucun. Les tests peuvent donc lire et régler l'état
     interne par son nom (`state`, `currentWorld`, `playGame(…)`).
   Ce regroupement change une chose : esbuild transforme `const`/`let` en
   `var`. Une erreur d'ordre d'initialisation ne se verrait pas ici ; elle est
   vérifiée par test/modules.test.js, qui charge les vrais modules. */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..', '..');
const { SLICES, CSS_ORDER } = require(path.join(root, 'js', 'slices.cjs'));
const ENTRY = 'js/app/main.js';

const read = (f)=> fs.readFileSync(path.join(root, f), 'utf8');
const LOCAL_CSS = /<link rel="stylesheet" href="(?!https?:)([^"]+\.css)">\n?/g;
const LOCAL_JS = /<script(?: type="module")? src="(js\/[^"]+)"><\/script>\n?/g;

// le dossier d'une slice (un seul par slice) et son fichier d'API publique
function sliceDir(s){ return s.files.length ? path.posix.dirname(s.files[0]) : null; }
function sliceIndex(s){ return s.files.length && s.layer !== 'app' ? sliceDir(s) + '/index.js' : null; }

// tous les modules du jeu : les fichiers des slices, leurs index.js, main.js
function manifestScripts(){
  return SLICES.flatMap(s=> [...s.files, ...(sliceIndex(s) ? [sliceIndex(s)] : []), ...(s.layer === 'app' ? [ENTRY] : [])]);
}
function manifestCss(){ return CSS_ORDER.slice(); }

// balises de index.html, dans l'ordre (pour le test de cohérence)
function indexScripts(){ return [...read('index.html').matchAll(LOCAL_JS)].map(m=> m[1]); }
function indexModuleScripts(){ return [...read('index.html').matchAll(/<script type="module" src="([^"]+)"><\/script>/g)].map(m=> m[1]); }
function indexCss(){ return [...read('index.html').matchAll(LOCAL_CSS)].map(m=> m[1]); }

let bundleCache = null;
function bundle(){
  if(bundleCache) return bundleCache;
  const esbuild = require('esbuild');
  const out = esbuild.buildSync({
    absWorkingDir: root, entryPoints:[ENTRY], bundle:true, format:'esm', treeShaking:false,
    write:false, charset:'utf8', logLevel:'silent', metafile:true,
  });
  bundleCache = { code: out.outputFiles[0].text, metafile: out.metafile };
  return bundleCache;
}

function buildHtml(){
  let html = read('index.html');
  const css = manifestCss().map(f=> '<style>' + read(f) + '</style>').join('\n');
  // un « </script> » dans le code fermerait la balise trop tôt
  const js = '<script>"use strict";\n' + bundle().code.replace(/<\/script/gi, '<\\/script') + '</script>';
  let cssDone = false, jsDone = false;
  html = html.replace(LOCAL_CSS, ()=>{ if(cssDone) return ''; cssDone = true; return css + '\n'; });
  html = html.replace(LOCAL_JS, ()=>{ if(jsDone) return ''; jsDone = true; return js + '\n'; });
  return html;
}

module.exports = { root, SLICES, CSS_ORDER, ENTRY, buildHtml, bundle, manifestScripts, manifestCss,
  indexScripts, indexModuleScripts, indexCss, read, sliceDir, sliceIndex };
