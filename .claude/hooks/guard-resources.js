/* Garde des ressources d'Amrou (cothon 0.2.0-1, playbook 5.4) : hook
   PreToolUse sur Bash. Refuse une commande destructrice qui vise une
   ressource protégée (liste : AGENTS.md, section « Ressources protégées »).
   La ligne est lue comme le ferait le shell : découpée aux ; && || | et aux
   retours à la ligne HORS des guillemets, sans le contenu des heredocs ; chaque
   commande est vérifiée seule, à partir de son programme. Un texte entre
   guillemets (description de PR, message) ne déclenche donc rien.
   Sortie : 0 permis ; 2 refusé, ou garde impossible (raison sur stderr).
     node .claude/hooks/guard-resources.js --selftest */
// un outil en ligne de commande écrit sur ses sorties (pas de console dans js/ ni ici)
const out = (msg) => process.stdout.write(msg + '\n');
const err = (msg) => process.stderr.write(msg + '\n');

const PROTECTED_DIRS = ['js', 'docs', 'conductor', 'test', 'test/holdout', '.git', '.github'];

// découpe une ligne de shell en commandes, chacune une liste de mots
function parse(line) {
  const commands = [];
  let words = [];
  let word = '';
  let quote = null;
  let hasWord = false;
  const endWord = () => {
    if (hasWord) words.push(word);
    word = '';
    hasWord = false;
  };
  const endCommand = () => {
    endWord();
    if (words.length) commands.push(words);
    words = [];
  };
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (quote) {
      if (c === quote) quote = null;
      else if (c === '\\' && quote === '"' && i + 1 < line.length) word += line[++i];
      else word += c;
      continue;
    }
    if (c === "'" || c === '"') {
      quote = c;
      hasWord = true;
    } else if (c === '\\' && i + 1 < line.length) {
      word += line[++i];
      hasWord = true;
    } else if (c === '<' && line[i + 1] === '<' && line[i + 2] !== '<') {
      // heredoc : son contenu n'est pas une commande, on saute jusqu'au délimiteur
      const m = /^<<-?\s*(['"]?)([A-Za-z_][\w-]*)\1/.exec(line.slice(i));
      if (!m) {
        word += c;
        hasWord = true;
        continue;
      }
      endCommand();
      const lineEnd = line.indexOf('\n', i);
      if (lineEnd < 0) break;
      const rest = line.slice(lineEnd + 1);
      const close = rest.search(new RegExp(`^\\s*${m[2]}\\s*$`, 'm'));
      if (close < 0) break; // heredoc sans fin : rien après n'est une commande
      const closeEnd = rest.indexOf('\n', close);
      i = closeEnd < 0 ? line.length : lineEnd + 1 + closeEnd;
    } else if (c === ';' || c === '\n' || c === '|' || (c === '&' && line[i + 1] === '&')) {
      if (c === '&' || (c === '|' && line[i + 1] === '|')) i++;
      endCommand();
    } else if (c === ' ' || c === '\t') endWord();
    else {
      word += c;
      hasWord = true;
    }
  }
  endCommand();
  // les affectations en tête (FOO=1 git push…) ne sont pas le programme
  return commands.map((w) => {
    let k = 0;
    while (k < w.length - 1 && /^[A-Za-z_]\w*=/.test(w[k])) k++;
    return w.slice(k);
  });
}

// la raison d'un refus pour une commande (liste de mots), ou null
function reasonFor(w) {
  const [prog, sub] = w;
  const has = (...flags) => w.some((x) => flags.includes(x));
  if (prog === 'git') {
    const forcing = w.some((x) => /^--force(-with-lease)?(=.*)?$/.test(x) || /^-[a-z]*f[a-z]*$/.test(x));
    if (sub === 'push' && forcing) return 'push forcé : interdit (AGENTS.md)';
    if (sub === 'reset' && has('--hard'))
      return "git reset --hard efface du travail : commiter d'abord, puis annuler par un commit";
    if (sub === 'clean' && forcing) return 'git clean -f efface des fichiers non suivis';
    if (sub === 'branch' && has('-D') && has('main')) return 'supprimer la branche main';
  }
  if (prog === 'gh' && sub === 'pr' && w[2] === 'merge' && has('--admin'))
    return 'merge forcé en administrateur : il contourne ci-ok et la protection de main';
  if (
    prog === 'gh' &&
    sub === 'api' &&
    w.some((x) => /branches\/main\/protection/.test(x)) &&
    w.some((x) => /^(-X)?(DELETE|PUT|PATCH|POST)$/.test(x))
  )
    return "modifier la protection de main : décision d'Amrou";
  if (prog === 'rm' || prog === 'trash') {
    const hit = w
      .slice(1)
      .find((x) => !x.startsWith('-') && PROTECTED_DIRS.includes(x.replace(/^\.\//, '').replace(/\/+$/, '')));
    if (hit) return `suppression de « ${hit} » : ressource protégée`;
  }
  return null;
}

const check = (line) => parse(line).map(reasonFor).find(Boolean) || null;

if (process.argv.includes('--selftest')) {
  const cases = [
    ['deny', 'git push --force origin main'],
    ['deny', 'git push -f'],
    ['deny', 'cd x && git reset --hard HEAD~1'],
    ['deny', 'git clean -fd'],
    ['deny', 'git branch -D main'],
    ['deny', 'gh pr merge 12 --merge --admin'],
    ['deny', 'gh api -X PUT repos/o/r/branches/main/protection --input p.json'],
    ['deny', 'rm -rf js'],
    ['deny', 'rm -rf test/holdout'],
    ['deny', 'cd /tmp && rm -r docs/'],
    ['deny', 'rm -rf .git'],
    ['deny', 'rm -rf "js"'],
    ['deny', 'FOO=1 git push --force'],
    ['deny', 'echo ok\ngit push --force'],
    ['allow', 'git push -u origin claude/x'],
    ['allow', 'git branch -D claude/vieille-branche'],
    ['allow', 'rm js/zz-essai.js'],
    ['allow', 'rm -rf node_modules'],
    ['allow', 'gh pr merge 12 --merge'],
    ['allow', 'bun run check'],
    // les faux positifs de la première version : un texte cité, deux commandes, un heredoc
    ['allow', 'gh pr create --body "testé en réel : git clean -fdn refusé"'],
    ['allow', 'git push -qu origin x; git worktree remove --force /tmp/w'],
    ['allow', "cat > f <<'EOF'\ngit push --force\nrm -rf js\nEOF\necho fini"],
    ['allow', 'echo "rm -rf js"'],
    // après un heredoc, les commandes suivantes sont bien vérifiées
    ['deny', "cat > f <<'EOF'\nbonjour\nEOF\ngit push --force"],
  ];
  let ok = true;
  for (const [want, line] of cases) {
    const got = check(line) ? 'deny' : 'allow';
    if (got !== want) {
      ok = false;
      out(`❌ ${want} attendu, ${got} obtenu : ${JSON.stringify(line)}`);
    }
  }
  out(ok ? `guard-resources : selftest ok (${cases.length} cas)` : 'guard-resources : selftest en échec');
  process.exit(ok ? 0 : 1);
}

let input = '';
process.stdin.on('data', (c) => (input += c));
process.stdin.on('end', () => {
  let cmd;
  try {
    cmd = (JSON.parse(input).tool_input || {}).command || '';
  } catch {
    err('guard-resources : entrée illisible, la garde ne peut pas vérifier : commande bloquée');
    process.exit(2);
  }
  const why = cmd && check(cmd);
  if (why) {
    err(`Refusé par la garde des ressources (.claude/hooks/guard-resources.js) : ${why}.`);
    process.exit(2);
  }
  process.exit(0);
});
