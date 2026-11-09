/* ---------- Déplacer des déclarations d'un fichier à un autre (refactor) ----------
   node test/tools/move.js <source> <destination> nom1 nom2 …

   Retire de <source> chaque instruction de haut niveau qui définit l'un des
   noms (function, const, let, var, class), avec le bloc de commentaires
   collé juste au-dessus, et l'ajoute à la fin de <destination> (créé si
   besoin), dans l'ordre d'origine. Rien n'est réécrit : le code est déplacé
   tel quel, caractère pour caractère. Une instruction qui définit plusieurs
   noms est déplacée dès qu'un de ses noms est demandé (signalé).

   Outil de développement uniquement (refactor en feature slices, v51). */
const fs = require('fs');
const acorn = require('acorn');

function declNames(s){
  if(s.type==='FunctionDeclaration' || s.type==='ClassDeclaration') return [s.id.name];
  if(s.type==='VariableDeclaration') return s.declarations.flatMap(d=> d.id.type==='Identifier' ? [d.id.name] : []);
  return [];
}

// début du bloc de commentaires collé au-dessus de l'instruction : des
// commentaires consécutifs séparés seulement par un retour à la ligne (une
// ligne vide arrête le bloc : c'est alors un commentaire de section)
function leadingStart(src, start, prevEnd, comments){
  let i = start;
  for(let k = comments.length - 1; k >= 0; k--){
    const c = comments[k];
    if(c.end > i || c.start < prevEnd) continue;
    const gap = src.slice(c.end, i);
    if(/^[ \t]*\n?[ \t]*$/.test(gap)) i = c.start; else if(c.end <= i) break;
  }
  // reprendre l'indentation du début de ligne
  const lineStart = src.lastIndexOf('\n', i - 1) + 1;
  return /^[ \t]*$/.test(src.slice(lineStart, i)) ? lineStart : i;
}

function move(srcFile, destFile, names){
  const src = fs.readFileSync(srcFile, 'utf8');
  const comments = [];
  const ast = acorn.parse(src, { ecmaVersion:'latest', sourceType:'script', onComment: comments });
  const want = new Set(names);
  const found = new Set();
  const chunks = [];
  let prevEnd = 0;
  for(const s of ast.body){
    const ns = declNames(s);
    if(ns.some(n=> want.has(n))){
      const from = leadingStart(src, s.start, prevEnd, comments);
      // inclure la fin de ligne (commentaire de fin de ligne compris)
      let to = src.indexOf('\n', s.end); if(to < 0) to = src.length; else to += 1;
      chunks.push({ from, to });
      ns.forEach(n=> found.add(n));
      const extra = ns.filter(n=> !want.has(n));
      if(extra.length) console.warn(`⚠ ${srcFile} : déplacé aussi ${extra.join(', ')} (même instruction)`);
      prevEnd = to;
    } else prevEnd = s.end;
  }
  const missing = names.filter(n=> !found.has(n));
  if(missing.length) throw new Error(`${srcFile} : introuvable(s) : ${missing.join(', ')}`);
  let rest = src, moved = '';
  for(const c of chunks.slice().reverse()){
    moved = src.slice(c.from, c.to) + (moved ? '\n' + moved : '');
    rest = rest.slice(0, c.from) + rest.slice(c.to);
  }
  rest = rest.replace(/\n{3,}/g, '\n\n');
  const dest = fs.existsSync(destFile) ? fs.readFileSync(destFile, 'utf8') : '';
  const out = dest ? dest.replace(/\s*$/, '\n\n') + moved : moved;
  fs.writeFileSync(srcFile, rest);
  fs.writeFileSync(destFile, out.replace(/\s*$/, '\n'));
  console.log(`${names.length} nom(s) : ${srcFile} → ${destFile}`);
}

if(require.main === module){
  const [src, dest, ...names] = process.argv.slice(2);
  if(!src || !dest || !names.length){ console.error('usage : node test/tools/move.js <source> <destination> nom…'); process.exit(2); }
  move(src, dest, names);
}
module.exports = { move };
