/* ---------- Frontières entre slices (architecture v51) ----------
   Deux règles, vérifiées par test/slices.test.js :
   1. Couches : un fichier n'utilise que des noms de sa couche ou des couches
      inférieures (app > features > entities > shared).
   2. API publique : un nom défini dans une AUTRE slice n'est utilisable que
      s'il figure dans le `public` de cette slice (js/slices.js).

   node test/tools/boundaries.js --write
     recalcule l'API publique de chaque slice (les noms que d'autres slices
     utilisent vraiment) et la réécrit dans js/slices.js. À lancer quand on
     expose volontairement un nouveau nom ; le test, lui, ne réécrit rien. */
const fs = require('fs');
const path = require('path');
const { analyzeFiles } = require('./globals.js');

const LAYER_RANK = { shared:0, entities:1, features:2, app:3 };

// analyse : pour chaque fichier, sa slice, ses définitions et ses usages
function analyzeSlices(slices, root){
  const files = slices.flatMap(s=> s.files.map(f=> ({ file:f, slice:s })));
  const res = analyzeFiles(files.map(x=> path.join(root, x.file)));
  const owner = new Map();
  res.forEach((r, i)=> r.defs.forEach(d=> owner.set(d, files[i].slice)));
  return files.map((x, i)=> ({ file:x.file, slice:x.slice, refs:[...res[i].refs.keys()] })).map(f=> Object.assign(f, { owner }));
}

// liste des violations (vide = frontières respectées)
function boundaryViolations(files){
  const out = [];
  for(const f of files){
    for(const name of f.refs){
      const o = f.owner.get(name);
      if(!o || o === f.slice) continue;
      if(LAYER_RANK[o.layer] > LAYER_RANK[f.slice.layer])
        out.push(`${f.file} (${f.slice.layer}) utilise ${name} de ${o.id} (${o.layer}) : couche supérieure`);
      else if(o.public && !o.public.includes(name))
        out.push(`${f.file} utilise ${name}, qui n'est pas dans l'API publique de ${o.id}`);
    }
  }
  return out;
}

// API publique réellement utilisée par les autres slices
function usedPublicApi(files){
  const api = new Map();
  for(const f of files) for(const name of f.refs){
    const o = f.owner.get(name);
    if(o && o !== f.slice){ if(!api.has(o.id)) api.set(o.id, new Set()); api.get(o.id).add(name); }
  }
  return api;
}

module.exports = { analyzeSlices, boundaryViolations, usedPublicApi, LAYER_RANK };

if(require.main === module && process.argv.includes('--write')){
  const root = path.join(__dirname, '..', '..');
  const manifest = path.join(root, 'js', 'slices.js');
  delete require.cache[manifest];
  const { SLICES } = require(manifest);
  const api = usedPublicApi(analyzeSlices(SLICES, root));
  let src = fs.readFileSync(manifest, 'utf8');
  for(const s of SLICES){
    const names = [...(api.get(s.id) || [])].sort((a, b)=> a.localeCompare(b));
    const re = new RegExp(`(\\{ id:'${s.id}',[\\s\\S]*?)public:(?:null|\\[[\\s\\S]*?\\])( \\})`);
    const list = names.length ? '[\n      ' + names.map(n=> `'${n}'`).join(', ').replace(/(.{1,96})(, |$)/g, '$1$2\n      ').trimEnd() + ']' : '[]';
    if(!re.test(src)) throw new Error('slice introuvable dans le manifeste : ' + s.id);
    src = src.replace(re, `$1public:${list}$2`);
  }
  fs.writeFileSync(manifest, src);
  console.log(`API publiques écrites pour ${SLICES.length} slices`);
}
