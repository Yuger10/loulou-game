/* ---------- Frontières entre slices (v54 : modules ES natifs) ----------
   Les règles de l'architecture, vérifiées par test/slices.test.js sur les
   `import` de chaque fichier :
   1. Entre slices, on n'importe que l'index.js de l'autre slice (son API
      publique) ; dans sa slice, on importe le fichier voulu.
   2. Couches : une slice n'importe que sa couche ou une couche inférieure
      (app > features > entities > shared).
   3. Ordre : une slice n'importe que des slices placées AVANT elle dans le
      manifeste (js/slices.cjs). Il ne peut donc pas y avoir de cycle d'import
      entre slices ; le test le vérifie aussi sur le graphe d'esbuild.
   4. Un nom défini par un autre fichier du jeu n'est jamais utilisé sans
      être importé (sinon : erreur dans le navigateur).
   5. Aucune écriture sur window, globalThis ou self : pas de variable globale.
   Chaque règle est une fonction pure, pour que le test puisse aussi prouver
   qu'elle échoue sur des cas fautifs fabriqués. */
const fs = require('fs');
const path = require('path');
const acorn = require('acorn');
const walk = require('acorn-walk');
const { analyze } = require('./globals.js');

const LAYER_RANK = { shared:0, entities:1, features:2, app:3 };

/* Le modèle : chaque module du jeu, sa slice, ses imports résolus.
   slices : le manifeste ; root : la racine du dépôt ; modules : chemins. */
function buildModel(slices, root, modules){
  const sliceOf = new Map();
  slices.forEach((s, rank)=> s.files.forEach(f=> sliceOf.set(f, { s, rank })));
  // index.js et main.js appartiennent à la slice de leur dossier
  const dirSlice = new Map();
  slices.forEach((s, rank)=> s.files.length && dirSlice.set(path.posix.dirname(s.files[0]), { s, rank }));
  return modules.map(file=>{
    const src = fs.readFileSync(path.join(root, file), 'utf8');
    const a = analyze(src, file);
    const own = sliceOf.get(file) || dirSlice.get(path.posix.dirname(file));
    const imports = a.imports.map(i=>{
      const target = path.posix.normalize(path.posix.join(path.posix.dirname(file), i.source));
      return Object.assign({}, i, { target });
    });
    return { file, src, slice: own && own.s, rank: own ? own.rank : -1, defs:a.defs, refs:[...a.refs.keys()], exports:a.exports, imports };
  });
}

// règles 1 à 3 : renvoie la liste des violations (vide = règles respectées)
function importViolations(model, slices){
  const byFile = new Map(model.map(m=> [m.file, m]));
  const indexOf = (s)=> s.files.length ? path.posix.dirname(s.files[0]) + '/index.js' : null;
  const out = [];
  for(const m of model){
    for(const i of m.imports){
      const t = byFile.get(i.target);
      if(!t){ out.push(`${m.file} : import de ${i.source}, fichier inconnu`); continue; }
      const names = i.names.filter(n=> n !== '*' && n !== 'default' && !t.exports.includes(n));
      if(names.length) out.push(`${m.file} : ${names.join(', ')} n'est pas exporté par ${t.file}`);
      if(t.slice === m.slice) continue;
      if(i.target !== indexOf(t.slice)) out.push(`${m.file} : importe ${t.file}, un fichier interne de « ${t.slice.id} » (seul son index.js est permis)`);
      if(LAYER_RANK[t.slice.layer] > LAYER_RANK[m.slice.layer]) out.push(`${m.file} : importe « ${t.slice.id} », d'une couche supérieure (${t.slice.layer})`);
      else if(t.rank > m.rank) out.push(`${m.file} : importe « ${t.slice.id} », placée après « ${m.slice.id} » dans le manifeste`);
      if(m.file.endsWith('/index.js') && m.slice.layer !== 'app') out.push(`${m.file} : un index.js ne réexporte que sa propre slice`);
    }
  }
  return out;
}

// cycles entre slices dans un graphe { slice: Set(slices importées) } (Tarjan)
function sliceCycles(graph){
  let idx = 0; const st = [], on = new Set(), ix = new Map(), low = new Map(), out = [];
  const visit = (v)=>{
    ix.set(v, idx); low.set(v, idx); idx++; st.push(v); on.add(v);
    for(const w of graph.get(v) || []){
      if(!ix.has(w)){ visit(w); low.set(v, Math.min(low.get(v), low.get(w))); }
      else if(on.has(w)) low.set(v, Math.min(low.get(v), ix.get(w)));
    }
    if(low.get(v) === ix.get(v)){ const c = []; let w; do { w = st.pop(); on.delete(w); c.push(w); } while(w !== v); if(c.length > 1) out.push(c); }
  };
  [...graph.keys()].forEach(v=>{ if(!ix.has(v)) visit(v); });
  return out;
}

// règle 4 : un nom d'un autre fichier du jeu utilisé sans import
function missingImports(model){
  const owner = new Map();
  model.forEach(m=> m.defs.forEach(d=> owner.set(d, m.file)));
  return model.flatMap(m=> m.refs.filter(n=> owner.has(n) && owner.get(n) !== m.file)
    .map(n=> `${m.file} : ${n} (défini dans ${owner.get(n)}) est utilisé sans import`));
}

// règle 5 : écritures sur l'objet global
const GLOBAL_OBJECTS = new Set(['window', 'globalThis', 'self']);
function globalWrites(file, src){
  const out = [];
  const ast = acorn.parse(src, { ecmaVersion:'latest', sourceType:'module', locations:true });
  const isGlobal = (n)=> n && n.type === 'Identifier' && GLOBAL_OBJECTS.has(n.name);
  // une propriété posée directement sur l'objet global (window.x = …) ; une
  // API du navigateur reste permise (window.speechSynthesis.onvoiceschanged = …)
  const target = (n)=> n.type === 'MemberExpression' && isGlobal(n.object);
  walk.simple(ast, {
    AssignmentExpression(n){ if(n.left.type === 'MemberExpression' && target(n.left)) out.push(`${file}:${n.loc.start.line} : écrit sur l'objet global`); },
    UpdateExpression(n){ if(n.argument.type === 'MemberExpression' && target(n.argument)) out.push(`${file}:${n.loc.start.line} : écrit sur l'objet global`); },
    CallExpression(n){
      const c = n.callee;
      if(c.type === 'MemberExpression' && c.object.type === 'Identifier' && c.object.name === 'Object'
        && ['assign', 'defineProperty', 'defineProperties'].includes(c.property.name) && isGlobal(n.arguments[0]))
        out.push(`${file}:${n.loc.start.line} : Object.${c.property.name} sur l'objet global`);
    },
  });
  return out;
}

module.exports = { LAYER_RANK, buildModel, importViolations, sliceCycles, missingImports, globalWrites };
