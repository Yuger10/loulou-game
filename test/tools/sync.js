/* ---------- Aligner index.html et sw.js sur le manifeste des slices ----------
   node test/tools/sync.js   (ou bun run sync)

   Réécrit les <link rel="stylesheet"> locales d'index.html (dans l'ordre de
   CSS_ORDER) et sa balise de script (un seul module, js/app/main.js, v54), et
   la liste des modules et feuilles de style mis en cache par sw.js (FILES). Le reste des fichiers est conservé
   tel quel. Depuis la v66, il écrit aussi la version du jeu (APP_VERSION,
   js/shared/lib/version.js) dans le nom du cache de sw.js (lagon-vNN).
   test/slices.test.js et test/update.test.js vérifient ensuite que tout correspond. */
const fs = require('fs');
const path = require('path');
const page = require('./page.js');

const scripts = page.manifestScripts();
const css = page.manifestCss();
const file = (f) => path.join(page.root, f);

// index.html : un bloc de <link> à la place du premier, un bloc de <script> à la place du premier
let html = fs.readFileSync(file('index.html'), 'utf8');
let done = false;
html = html.replace(/<link rel="stylesheet" href="(?!https?:)[^"]+\.css">\n?/g, () => {
  if (done) return '';
  done = true;
  return css.map((f) => `<link rel="stylesheet" href="${f}">`).join('\n') + '\n';
});
// v54 : un seul script, le point d'entrée des modules ES
done = false;
html = html.replace(/<script(?: type="module")? src="js\/[^"]+"><\/script>\n?/g, () => {
  if (done) return '';
  done = true;
  return `<script type="module" src="${page.ENTRY}"></script>\n`;
});
fs.writeFileSync(file('index.html'), html);

// sw.js : on garde les entrées qui ne sont ni .js ni .css (pages, icônes, manifest)
let sw = fs.readFileSync(file('sw.js'), 'utf8');
sw = sw.replace(/const FILES = \[[\s\S]*?\];/, (block) => {
  const others = [...block.matchAll(/'(\.\/[^']*)'/g)].map((m) => m[1]).filter((f) => !/\.(js|css)$/.test(f));
  const all = [...others, ...css.map((f) => './' + f), ...scripts.map((f) => './' + f)];
  const lines = [];
  for (let i = 0; i < all.length; i += 6)
    lines.push(
      '  ' +
        all
          .slice(i, i + 6)
          .map((f) => `'${f}'`)
          .join(','),
    );
  return 'const FILES = [\n' + lines.join(',\n') + '\n];';
});
// v66 : le cache porte la version du jeu (js/shared/lib/version.js)
// (66.1 : versions sans track livrée, voir js/shared/lib/version.js)
const version = require('./version.js').readVersion().label;
sw = sw.replace(/const CACHE = 'lagon-v[\d.]+';/, `const CACHE = 'lagon-v${version}';`);

// Les clips de la voix (track voix-naturelle, ADR 0007) : un cache à part,
// `lagon-voix`, que les versions du jeu ne vident pas (un nom de clip ne
// change jamais de contenu). Trois insertions, sans effet au second passage :
// 1. le nom du cache, après celui du jeu ;
if (!sw.includes("const VOICE_CACHE = 'lagon-voix';"))
  sw = sw.replace(/(const CACHE = 'lagon-v[\d.]+';\n)/, "$1const VOICE_CACHE = 'lagon-voix';\n");
// 2. la règle « cache d'abord » de voix/*.mp3, entre ses marqueurs. Le motif ne
//    regarde que la fin du chemin : il marche sous le sous-chemin de GitHub Pages.
const VOICE_START = '  /* voix: début (écrit par test/tools/sync.js) */\n';
const VOICE_END = '  /* voix: fin */\n';
const VOICE_RULE =
  '  const vu = new URL(e.request.url);\n' +
  '  if(vu.origin===self.location.origin && /\\/voix\\/[0-9a-f]{12}\\.mp3$/.test(vu.pathname)){ e.respondWith(caches.open(VOICE_CACHE).then(c=>c.match(e.request).then(hit=> hit || fetch(e.request).then(res=>{ if(res.status===200) c.put(e.request, res.clone()).catch(()=>{}); return res; })))); return; }\n';
const voiceBlock = VOICE_START + VOICE_RULE + VOICE_END;
const from = sw.indexOf(VOICE_START),
  to = sw.indexOf(VOICE_END);
if (from >= 0 && to > from) sw = sw.slice(0, from) + voiceBlock + sw.slice(to + VOICE_END.length);
else {
  const GET_ONLY = "  if(e.request.method!=='GET') return;\n";
  if (!sw.includes(GET_ONLY)) {
    console.error(
      "❌ sync : sw.js n'a plus la ligne « if(e.request.method!=='GET') return; » où poser la règle des voix",
    );
    process.exit(1);
  }
  sw = sw.replace(GET_ONLY, GET_ONLY + voiceBlock);
}
// 3. une nouvelle version garde le cache des voix
sw = sw.replace('keys.filter(k=>k!==CACHE)', 'keys.filter(k=>k!==CACHE&&k!==VOICE_CACHE)');
fs.writeFileSync(file('sw.js'), sw);
console.log(
  `index.html et sw.js alignés : ${scripts.length} modules, ${css.length} feuilles de style, cache lagon-v${version}`,
);
