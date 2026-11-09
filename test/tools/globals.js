/* ---------- Analyse des noms d'un fichier (outil de développement) ----------
   Depuis la v54, le jeu est fait de modules ES : un fichier importe ce qu'il
   utilise. Cet outil lit chaque fichier avec acorn et donne, pour chacun :
     - defs    : les noms qu'il définit à son niveau le plus haut (function,
                 const, let, var, class, exportés ou non) ;
     - refs    : les noms LIBRES qu'il utilise (ni déclarés, ni importés, ni
                 paramètres) : ce qu'il attend du navigateur. Un nom libre
                 défini par un autre fichier du jeu est un import oublié ;
     - imports : [{ source, names }] et exports : noms exportés.
   Il sert à l'inventaire du refactor en feature slices (v51) et au test de
   frontières (test/slices.test.js). Une vraie analyse de portée évite les
   faux positifs : un paramètre `state` ou un mot dans un texte ne compte pas. */
const fs = require('fs');
const acorn = require('acorn');

function parse(src, file){
  try{ return acorn.parse(src, { ecmaVersion:'latest', sourceType:'module', allowHashBang:true }); }
  catch(e){ throw new Error(`${file} : ${e.message}`); }
}

// noms introduits par un motif de déclaration (x, {a, b:c}, [d, ...e], f = 1)
function patternNames(p, out = []){
  if(!p) return out;
  switch(p.type){
    case 'Identifier': out.push(p.name); break;
    case 'ObjectPattern': p.properties.forEach(pr=> patternNames(pr.type==='RestElement' ? pr.argument : pr.value, out)); break;
    case 'ArrayPattern': p.elements.forEach(el=> patternNames(el, out)); break;
    case 'RestElement': patternNames(p.argument, out); break;
    case 'AssignmentPattern': patternNames(p.left, out); break;
  }
  return out;
}

// déclarations `var` et `function` d'un corps de fonction (remontées)
function hoisted(body, out = new Set()){
  (function visit(n, top){
    if(!n || typeof n.type !== 'string') return;
    if(n.type==='VariableDeclaration' && n.kind==='var') n.declarations.forEach(d=> patternNames(d.id).forEach(x=>out.add(x)));
    if(n.type==='FunctionDeclaration' && top){ out.add(n.id.name); }
    if(/Function/.test(n.type) && !top) return;   // ne pas entrer dans les fonctions imbriquées
    for(const k in n){
      if(k==='type' || k==='start' || k==='end') continue;
      const v = n[k];
      if(Array.isArray(v)) v.forEach(c=> c && typeof c.type==='string' && visit(c, false));
      else if(v && typeof v.type==='string') visit(v, false);
    }
  })(body, true);
  return out;
}

// déclarations lexicales directes d'un bloc (let, const, class, function)
function lexical(stmts){
  const out = new Set();
  for(let s of stmts){
    if(s.type==='ImportDeclaration'){ s.specifiers.forEach(sp=> out.add(sp.local.name)); continue; }
    if((s.type==='ExportNamedDeclaration' || s.type==='ExportDefaultDeclaration') && s.declaration) s = s.declaration;
    if(s.type==='VariableDeclaration' && s.kind!=='var') s.declarations.forEach(d=> patternNames(d.id).forEach(x=>out.add(x)));
    if(s.type==='ClassDeclaration' && s.id) out.add(s.id.name);
    if(s.type==='FunctionDeclaration' && s.id) out.add(s.id.name);
  }
  return out;
}

function analyze(src, file){
  const ast = parse(src, file);
  const defs = new Set();
  const imports = [], exported = new Set();
  for(let s of ast.body){
    if(s.type==='ImportDeclaration'){ imports.push({ source: s.source.value, names: s.specifiers.map(sp=> sp.imported ? sp.imported.name : (sp.type==='ImportDefaultSpecifier' ? 'default' : '*')) }); continue; }
    if(s.type==='ExportNamedDeclaration' && s.source){ imports.push({ source: s.source.value, names: s.specifiers.map(sp=> sp.local.name), reexport:true }); s.specifiers.forEach(sp=> exported.add(sp.exported.name)); continue; }
    if(s.type==='ExportAllDeclaration'){ imports.push({ source: s.source.value, names:['*'], reexport:true }); continue; }
    if(s.type==='ExportNamedDeclaration' && !s.declaration){ s.specifiers.forEach(sp=> exported.add(sp.exported.name)); continue; }
    if((s.type==='ExportNamedDeclaration' || s.type==='ExportDefaultDeclaration') && s.declaration){
      s = s.declaration;
      if(s.id) exported.add(s.id.name);
      if(s.type==='VariableDeclaration') s.declarations.forEach(d=> patternNames(d.id).forEach(x=> exported.add(x)));
    }
    if(s.type==='FunctionDeclaration') defs.add(s.id.name);
    else if(s.type==='ClassDeclaration') defs.add(s.id.name);
    else if(s.type==='VariableDeclaration') s.declarations.forEach(d=> patternNames(d.id).forEach(x=>defs.add(x)));
  }
  const refs = new Map();   // nom -> nombre d'usages
  const scopes = [];
  const known = (name)=> scopes.some(sc=> sc.has(name));
  const use = (name)=>{ if(!known(name)) refs.set(name, (refs.get(name)||0) + 1); };

  function fn(n){
    const sc = new Set();
    if(n.type==='FunctionExpression' && n.id) sc.add(n.id.name);
    n.params.forEach(p=> patternNames(p).forEach(x=>sc.add(x)));
    if(n.type!=='ArrowFunctionExpression') sc.add('arguments');
    if(n.body.type==='BlockStatement'){ hoisted(n.body).forEach(x=>sc.add(x)); }
    scopes.push(sc);
    n.params.forEach(p=> pattern(p));
    if(n.body.type==='BlockStatement') block(n.body.body); else walk(n.body);
    scopes.pop();
  }
  function block(stmts){
    scopes.push(lexical(stmts));
    stmts.forEach(walk);
    scopes.pop();
  }
  // dans un motif de déclaration, seules les valeurs par défaut et les clés calculées sont des usages
  function pattern(p){
    if(!p) return;
    switch(p.type){
      case 'ObjectPattern': p.properties.forEach(pr=>{ if(pr.type==='RestElement') pattern(pr.argument); else { if(pr.computed) walk(pr.key); pattern(pr.value); } }); break;
      case 'ArrayPattern': p.elements.forEach(pattern); break;
      case 'RestElement': pattern(p.argument); break;
      case 'AssignmentPattern': pattern(p.left); walk(p.right); break;
    }
  }
  function walk(n){
    if(!n || typeof n.type !== 'string') return;
    switch(n.type){
      case 'Identifier': use(n.name); return;
      case 'ImportDeclaration': case 'ExportAllDeclaration': return;
      case 'ExportNamedDeclaration':
        if(n.declaration) walk(n.declaration);
        else if(!n.source) n.specifiers.forEach(sp=> use(sp.local.name));
        return;
      case 'ExportDefaultDeclaration': walk(n.declaration); return;
      case 'FunctionDeclaration': case 'FunctionExpression': case 'ArrowFunctionExpression': fn(n); return;
      case 'BlockStatement': block(n.body); return;
      case 'Program': block(n.body); return;
      case 'VariableDeclaration': n.declarations.forEach(d=>{ pattern(d.id); walk(d.init); }); return;
      case 'ClassDeclaration': case 'ClassExpression': walk(n.superClass); n.body.body.forEach(m=>{ if(m.computed) walk(m.key); walk(m.value); }); return;
      case 'MemberExpression': walk(n.object); if(n.computed) walk(n.property); return;
      case 'Property': if(n.computed) walk(n.key); walk(n.value); return;
      case 'PropertyDefinition': case 'MethodDefinition': if(n.computed) walk(n.key); walk(n.value); return;
      case 'LabeledStatement': walk(n.body); return;
      case 'BreakStatement': case 'ContinueStatement': return;
      case 'CatchClause': { const sc = new Set(patternNames(n.param)); scopes.push(sc); walk(n.body); scopes.pop(); return; }
      case 'ForStatement': case 'ForInStatement': case 'ForOfStatement': {
        const decl = n.init || n.left;
        const sc = new Set();
        if(decl && decl.type==='VariableDeclaration' && decl.kind!=='var') decl.declarations.forEach(d=> patternNames(d.id).forEach(x=>sc.add(x)));
        scopes.push(sc);
        // `for(x of …)` sans déclaration : x est une affectation, donc un usage
        for(const k of ['init','left','test','update','right']) walk(n[k]);
        walk(n.body);
        scopes.pop();
        return;
      }
    }
    for(const k in n){
      if(k==='type' || k==='start' || k==='end') continue;
      const v = n[k];
      if(Array.isArray(v)) v.forEach(walk);
      else if(v && typeof v.type==='string') walk(v);
    }
  }
  walk(ast);
  // les noms définis par le fichier lui-même ne sont pas des dépendances
  for(const d of defs) refs.delete(d);
  return { defs:[...defs], refs, imports, exports:[...exported] };
}

function analyzeFiles(files){
  return files.map(f=> Object.assign({ file:f }, analyze(fs.readFileSync(f, 'utf8'), f)));
}

module.exports = { analyze, analyzeFiles };

// en ligne de commande : node test/tools/globals.js js/a.js js/b.js …
// (npm run inventaire) : ce que chaque fichier définit, exporte et importe
if(require.main === module){
  const res = analyzeFiles(process.argv.slice(2));
  for(const r of res){
    console.log(`\n## ${r.file}\ndéfinit (${r.defs.length}) : ${r.defs.join(', ')}`);
    if(r.exports.length) console.log(`  exporte : ${r.exports.join(', ')}`);
    for(const i of r.imports) console.log(`  importe ${i.source} : ${i.names.join(', ')}`);
    const free = [...r.refs.keys()];
    if(free.length) console.log(`  navigateur : ${free.join(', ')}`);
  }
}
