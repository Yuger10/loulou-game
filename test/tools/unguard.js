/* ---------- Retirer les gardes `typeof X==='function'` devenues inutiles ----------
   node test/tools/unguard.js            (tous les fichiers du manifeste)

   Avant les feature slices, un fichier vérifiait qu'une fonction d'un autre
   fichier existait (`typeof renderMap==='function' && renderMap()`), au cas
   où ce fichier ne serait pas chargé. Désormais le manifeste charge toujours
   tout : pour un nom DÉFINI PAR LE JEU, la garde vaut toujours vrai.
   Cet outil remplace chaque garde par sa valeur et simplifie autour :
     typeof f==='function' && f()          → f()
     typeof f==='function' ? f() : null    → f()
     if(typeof f!=='function') return;     → (supprimé)
   Les gardes sur des noms du navigateur (window, document, TextEncoder…)
   ne sont pas touchées. Outil de développement (refactor v51). */
const fs = require('fs');
const path = require('path');
const acorn = require('acorn');
const page = require('./page.js');
const { analyzeFiles } = require('./globals.js');

// marqueurs internes (jamais confondus avec un vrai `true`/`false` du code)
const T = '\u0000VRAI\u0000', F = '\u0000FAUX\u0000';

function guardValue(n, gameNames){
  // typeof X === 'function' | 'undefined'  (et !==, ==, !=)
  if(n.type !== 'BinaryExpression' || !/^[!=]==?$/.test(n.operator)) return null;
  let t = n.left, lit = n.right;
  if(t.type !== 'UnaryExpression'){ t = n.right; lit = n.left; }
  if(t.type !== 'UnaryExpression' || t.operator !== 'typeof' || t.argument.type !== 'Identifier') return null;
  if(lit.type !== 'Literal' || !['function', 'undefined'].includes(lit.value)) return null;
  if(!gameNames.has(t.argument.name)) return null;
  const isEq = n.operator[0] === '=';
  // le nom existe toujours (et, pour 'function', c'est bien une fonction)
  const holds = lit.value === 'function';
  return (isEq === holds) ? T : F;
}

function children(n){
  const out = [];
  for(const k in n){
    if(k === 'type' || k === 'start' || k === 'end') continue;
    const v = n[k];
    if(Array.isArray(v)) v.forEach(c=> c && typeof c.type === 'string' && out.push(c));
    else if(v && typeof v.type === 'string') out.push(v);
  }
  // propriété abrégée `{ f }` : clé et valeur partagent la même plage de texte
  out.sort((a, b)=> a.start - b.start || b.end - a.end);
  return out.filter((c, i)=> i === 0 || c.start >= out[i - 1].end);
}

function transform(src, gameNames){
  const ast = acorn.parse(src, { ecmaVersion:'latest', sourceType:'script' });
  let count = 0;
  function splice(n){
    let out = '', pos = n.start;
    for(const c of children(n)){ out += src.slice(pos, c.start) + gen(c); pos = c.end; }
    return out + src.slice(pos, n.end);
  }
  function gen(n){
    const g = guardValue(n, gameNames);
    if(g){ count++; return g; }
    if(n.type === 'UnaryExpression' && n.operator === '!'){
      const a = gen(n.argument);
      if(a === T) return F;
      if(a === F) return T;
      return src.slice(n.start, n.argument.start) + a + src.slice(n.argument.end, n.end);
    }
    if(n.type === 'LogicalExpression'){
      const l = gen(n.left), r = gen(n.right);
      if(n.operator === '&&'){
        if(l === T) return r;
        if(l === F) return F;
        if(r === T) return l;
      }
      if(n.operator === '||'){
        if(l === F) return r;
        if(l === T) return T;
        if(r === F) return l;
      }
      return src.slice(n.start, n.left.start) + l + src.slice(n.left.end, n.right.start) + r + src.slice(n.right.end, n.end);
    }
    if(n.type === 'ConditionalExpression'){
      const t = gen(n.test);
      if(t === T) return gen(n.consequent);
      if(t === F) return gen(n.alternate);
    }
    if(n.type === 'IfStatement'){
      const t = gen(n.test);
      if(t === T) return gen(n.consequent);
      if(t === F) return n.alternate ? gen(n.alternate) : '';
    }
    return splice(n);
  }
  const out = gen(ast);
  // une garde laissée seule (ex. `x = typeof f==='function'`) redevient un booléen
  return { out: out.split(T).join('true').split(F).join('false'), count };
}

if(require.main === module){
  const files = page.manifestScripts();
  const gameNames = new Set(analyzeFiles(files.map(f=> path.join(page.root, f))).flatMap(r=> r.defs));
  let total = 0;
  for(const f of files){
    const p = path.join(page.root, f);
    const src = fs.readFileSync(p, 'utf8');
    const { out, count } = transform(src, gameNames);
    if(count){ fs.writeFileSync(p, out); total += count; console.log(`${count}\t${f}`); }
  }
  console.log(`${total} garde(s) retirée(s)`);
}
module.exports = { transform };
