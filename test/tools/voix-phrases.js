/* ---------- Les phrases fixes du jeu et leurs clips ----------
   Module partagé par `bun run voix` (test/tools/voix.js) et par la garde
   (test/voix-clips.test.js), track voix-naturelle :
   - extractPhrases(root) : les phrases dites sans partie variable, trouvées
     dans le code par les règles R1 à R5 de la spec (analyse statique, acorn) ;
   - clipHash(config, key) : l'empreinte d'un clip (D9), qui nomme son fichier ;
   - configProblem(config) : la première règle de voix/voix.json violée ;
   - readClipsTable(text) : la table générée, lue par acorn et jamais par
     import() (un second import() du même fichier rendrait l'ancienne valeur) ;
   - isMp3(buf) : le contrôle des premiers octets d'une réponse du service. */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { pathToFileURL } = require('url');
const acorn = require('acorn');
const walk = require('acorn-walk');

const CLIPS_FILE = 'js/shared/ui/voice-clips.js';
const MARKER = 'voix: phrases';
const KEY_MAX = 400; // une clé plus longue n'est pas une réplique : elle reste en Web Speech
const CLIP_MAX = 307200; // 300 Ko par clip (D14)
const TOTAL_MAX = 8000000; // 8 Mo de clips au total (D14)
const SERVICE_NAMES = { azure: 'Microsoft Azure', google: 'Google Cloud' };
const CONFIG_KEYS = ['service', 'voice', 'style', 'rate', 'format'];

// `toSpoken` vient toujours du vrai dépôt, par un chemin relatif à ce script
// et indépendant de la racine analysée (D25) : le jeu et l'outil calculent la même clé.
let spokenModule = null;
async function loadToSpoken() {
  spokenModule ||= await import(
    pathToFileURL(path.join(__dirname, '..', '..', 'js', 'shared', 'lib', 'spoken.js')).href
  );
  return spokenModule.toSpoken;
}

// tous les fichiers js/**/*.js de la racine, triés, sauf la table générée
function sourceFiles(root) {
  const out = [];
  const visit = (dir) => {
    for (const e of fs.readdirSync(path.join(root, dir), { withFileTypes: true })) {
      const rel = dir + '/' + e.name;
      if (e.isDirectory()) visit(rel);
      else if (e.name.endsWith('.js') && rel !== CLIPS_FILE) out.push(rel);
    }
  };
  if (fs.existsSync(path.join(root, 'js'))) visit('js');
  return out.sort();
}

// la valeur d'un littéral chaîne ou d'un gabarit sans ${…} ; tout le reste rend null
function fixedString(node) {
  if (!node) return null;
  if (node.type === 'Literal' && typeof node.value === 'string') return node.value;
  if (node.type === 'TemplateLiteral' && node.expressions.length === 0) return node.quasis[0].value.cooked;
  return null;
}

// les phrases candidates d'un fichier : [{ text, line }], avant toSpoken
function candidates(src) {
  const found = [];
  const add = (node, at) => {
    const text = fixedString(node);
    if (text != null) found.push({ text, line: (at || node).loc.start.line });
  };
  // R5 : chaque chaîne d'un tableau ou d'un objet, récursivement
  const addAll = (node) => {
    if (!node) return;
    if (node.type === 'ArrayExpression') node.elements.forEach(addAll);
    else if (node.type === 'ObjectExpression') node.properties.forEach((p) => p.type === 'Property' && addAll(p.value));
    else add(node);
  };
  // R4 : data-say="…" écrit en dur dans un morceau de chaîne (un morceau de gabarit s'arrête à ${)
  const addAttrs = (piece, node) => {
    for (const m of String(piece).matchAll(/data-say="([^"]*)"/g))
      found.push({ text: m[1].replace(/&quot;/g, '"'), line: node.loc.start.line });
  };

  const markers = new Set(); // lignes des commentaires `// voix: phrases`
  const ast = acorn.parse(src, {
    ecmaVersion: 'latest',
    sourceType: 'module',
    locations: true,
    onComment: (block, text, _start, _end, loc) => {
      if (!block && text.trim() === MARKER) markers.add(loc.line);
    },
  });
  // les déclarations de haut niveau portent parfois un `export` : la ligne du marqueur précède l'ensemble
  const marked = new Set();
  walk.full(ast, (node) => {
    if (node.type === 'ExportNamedDeclaration' && node.declaration && markers.has(node.loc.start.line - 1))
      marked.add(node.declaration);
  });
  walk.full(ast, (node) => {
    if (node.type === 'CallExpression' && node.callee.type === 'Identifier') {
      const name = node.callee.name,
        args = node.arguments;
      // R1 : ce que dit speak ou speechBubble
      if (name === 'speak' || name === 'speechBubble') add(args[0]);
      // R2 : la consigne dite d'un mini-jeu (le 3e argument s'il existe, sinon le 2e)
      if (name === 'gameHeader') add(args.length >= 3 ? args[2] : args[1]);
    }
    // R3 : toute propriété nommée `say`
    if (node.type === 'Property' && !node.computed) {
      const key = node.key.type === 'Identifier' ? node.key.name : node.key.value;
      if (key === 'say') add(node.value);
    }
    if (node.type === 'Literal' && typeof node.value === 'string') addAttrs(node.value, node);
    if (node.type === 'TemplateLiteral') node.quasis.forEach((q) => addAttrs(q.value.cooked, q));
    if (node.type === 'VariableDeclaration' && (marked.has(node) || markers.has(node.loc.start.line - 1)))
      node.declarations.forEach((d) => addAll(d.init));
  });
  return found;
}

// Toutes les occurrences des phrases fixes : [{ text, key, file, line }], une
// par endroit du code. Deux occurrences de même clé sont une seule phrase.
async function extractPhrases(root) {
  const toSpoken = await loadToSpoken();
  const out = [];
  for (const file of sourceFiles(root)) {
    const src = fs.readFileSync(path.join(root, file), 'utf8');
    for (const c of candidates(src)) {
      const key = toSpoken(c.text);
      // un chiffre, rien à dire, ou trop long : la phrase reste en Web Speech (ligne 9)
      if (!key || /\d/.test(key) || key.length > KEY_MAX) continue;
      out.push({ text: c.text, key, file, line: c.line });
    }
  }
  return out.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line);
}

// Empreinte (D9) : 12 premiers caractères hexadécimaux du SHA-256 de 7 lignes.
// GEN augmente si la façon de générer change ; la région n'y est pas.
function clipHash(config, key) {
  const canon = [
    'GEN=1',
    'service=' + config.service,
    'voice=' + config.voice,
    'style=' + config.style,
    'rate=' + String(config.rate),
    'format=' + config.format,
    'text=' + key,
  ].join('\n');
  return crypto.createHash('sha256').update(canon, 'utf8').digest('hex').slice(0, 12);
}

// La première règle de voix/voix.json violée (ligne 13), ou '' si tout va bien.
// Exactement cinq clés : une clé de service ou une région n'ont nulle part où se loger.
function configProblem(c) {
  if (!c || typeof c !== 'object' || Array.isArray(c)) return 'un objet est attendu';
  const extra = Object.keys(c).find((k) => !CONFIG_KEYS.includes(k));
  if (extra) return 'clé en trop : ' + extra;
  const missing = CONFIG_KEYS.find((k) => !(k in c));
  if (missing) return 'clé manquante : ' + missing;
  if (c.service !== 'azure' && c.service !== 'google') return 'service doit valoir azure ou google';
  if (typeof c.voice !== 'string' || !/^fr-FR-[A-Za-z0-9:-]+$/.test(c.voice))
    return 'voice doit correspondre à ^fr-FR-[A-Za-z0-9:-]+$';
  if (typeof c.style !== 'string' || !/^[a-z-]*$/.test(c.style))
    return "style doit valoir '' ou correspondre à ^[a-z-]+$";
  if (c.service === 'azure') {
    if (typeof c.rate !== 'string' || !/^[+-]?\d{1,2}%$/.test(c.rate))
      return 'rate (azure) doit correspondre à ^[+-]?\\d{1,2}%$';
    if (c.format !== 'audio-24khz-48kbitrate-mono-mp3')
      return 'format (azure) doit valoir audio-24khz-48kbitrate-mono-mp3';
  } else {
    if (typeof c.rate !== 'number' || !(c.rate >= 0.25 && c.rate <= 2))
      return 'rate (google) doit être un nombre entre 0.25 et 2';
    if (c.style !== '') return "style (google) doit valoir ''";
    if (c.format !== 'MP3') return 'format (google) doit valoir MP3';
  }
  return '';
}

// voix/voix.json : { absent } | { problem } | { config }
function readConfig(root) {
  const file = path.join(root, 'voix', 'voix.json');
  if (!fs.existsSync(file)) return { absent: true };
  let config;
  try {
    config = JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (e) {
    return { problem: 'JSON illisible (' + e.message + ')' };
  }
  const problem = configProblem(config);
  return problem ? { problem } : { config };
}

// La table générée, lue comme un texte : { service, unlock, clips, bad }.
// Fichier absent ou vide, export manquant : '' ou {}. Export d'une autre forme
// qu'un littéral : `bad` porte son nom.
function readClipsTable(text) {
  const table = { service: '', unlock: '', clips: {}, bad: '' };
  if (!text.trim()) return table;
  let ast;
  try {
    ast = acorn.parse(text, { ecmaVersion: 'latest', sourceType: 'module' });
  } catch {
    // le fichier ne s'analyse pas : aucun de ses exports n'est lisible
    return { ...table, bad: 'VOICE_CLIPS' };
  }
  const str = (node) => (node && node.type === 'Literal' && typeof node.value === 'string' ? node.value : null);
  for (const node of ast.body) {
    if (node.type !== 'ExportNamedDeclaration' || !node.declaration || node.declaration.type !== 'VariableDeclaration')
      continue;
    for (const d of node.declaration.declarations) {
      const name = d.id.name;
      if (name === 'VOICE_SERVICE' || name === 'VOICE_UNLOCK') {
        const v = str(d.init);
        if (v == null) return { ...table, bad: name };
        table[name === 'VOICE_SERVICE' ? 'service' : 'unlock'] = v;
      }
      if (name === 'VOICE_CLIPS') {
        if (!d.init || d.init.type !== 'ObjectExpression') return { ...table, bad: name };
        for (const p of d.init.properties) {
          // oxfmt retire les guillemets d'une clé quand toutes s'écrivent sans
          const key =
            p.type !== 'Property' || p.computed ? null : p.key.type === 'Identifier' ? p.key.name : str(p.key);
          const value = p.type === 'Property' ? str(p.value) : null;
          if (key == null || value == null) return { ...table, bad: name };
          table.clips[key] = value;
        }
      }
    }
  }
  return table;
}

// les 3 premiers octets d'un MP3 : `ID3`, ou un en-tête de trame (0xFF puis 0xFB, 0xF3 ou 0xF2)
function isMp3(buf) {
  if (buf.length >= 3 && buf.subarray(0, 3).toString('latin1') === 'ID3') return true;
  return buf.length >= 2 && buf[0] === 0xff && [0xfb, 0xf3, 0xf2].includes(buf[1]);
}

/* La garde (test/voix-clips.test.js, lignes 10 à 13 de la spec) : la liste des
   problèmes d'une racine, vide si tout va bien. Tant que voix/voix.json
   n'existe pas, la table doit être vide et voix/ sans clip. Ensuite : chaque
   phrase fixe a son clip à jour, aucun clip ni entrée en trop, le budget tenu. */
const CLIP_NAME = /^[0-9a-f]{12}\.mp3$/;
const UNLOCK_MAX = 8000; // caractères de VOICE_UNLOCK
const RUN = 'lance bun run voix';
async function auditClips(root) {
  const problems = [];
  const voixDir = path.join(root, 'voix');
  const files = fs.existsSync(voixDir) ? fs.readdirSync(voixDir).sort() : [];
  const tableFile = path.join(root, CLIPS_FILE);
  const table = readClipsTable(fs.existsSync(tableFile) ? fs.readFileSync(tableFile, 'utf8') : '');
  if (table.bad) return [`${CLIPS_FILE} illisible : ${table.bad} (${RUN})`];
  const entries = Object.keys(table.clips).length;

  // ligne 12 : rien d'autre dans voix/ que voix.json et des clips nommés par leur empreinte
  for (const f of files)
    if (f !== 'voix.json' && !CLIP_NAME.test(f))
      problems.push(`voix/${f} : ni voix.json ni un clip nommé par son empreinte (^[0-9a-f]{12}\\.mp3$)`);
  const mp3 = files.filter((f) => CLIP_NAME.test(f));
  if (!!table.unlock !== entries > 0)
    problems.push(`VOICE_UNLOCK et VOICE_CLIPS vont ensemble : l'un est vide et pas l'autre (${RUN})`);
  if (table.unlock && !table.unlock.startsWith('data:audio/mpeg;base64,'))
    problems.push('VOICE_UNLOCK ne commence pas par data:audio/mpeg;base64,');
  if (table.unlock.length > UNLOCK_MAX)
    problems.push(`VOICE_UNLOCK dépasse ${UNLOCK_MAX} caractères (${table.unlock.length})`);

  const read = readConfig(root);
  if (read.absent) {
    // phases 1 et 2 : pas encore de voix choisie, le lecteur du jeu reste inerte
    if (entries) problems.push("VOICE_CLIPS doit être vide tant que voix/voix.json n'existe pas");
    if (table.service) problems.push("VOICE_SERVICE doit être vide tant que voix/voix.json n'existe pas");
    if (mp3.length) problems.push(`voix/ contient ${mp3.length} clip(s) alors que voix/voix.json n'existe pas`);
    return problems;
  }
  // ligne 13 : la forme exacte de voix/voix.json
  if (read.problem) return [...problems, 'voix/voix.json invalide : ' + read.problem];
  const config = read.config;
  if (table.service !== SERVICE_NAMES[config.service])
    problems.push(`VOICE_SERVICE vaut « ${table.service} » au lieu de « ${SERVICE_NAMES[config.service]} » (${RUN})`);

  // ligne 12 : le budget
  let total = 0;
  for (const f of mp3) {
    const size = fs.statSync(path.join(voixDir, f)).size;
    total += size;
    if (size > CLIP_MAX) problems.push(`voix/${f} pèse ${size} octets : plus de 300 Ko (${CLIP_MAX})`);
  }
  if (total > TOTAL_MAX) problems.push(`voix/ pèse ${total} octets : plus de 8 Mo (${TOTAL_MAX})`);

  // ligne 10 : chaque phrase fixe a son entrée, à son empreinte actuelle, et son fichier
  const present = new Set(mp3);
  const keys = new Set();
  for (const o of await extractPhrases(root)) {
    keys.add(o.key);
    const where = `${o.file}:${o.line} « ${o.text} »`;
    const hash = clipHash(config, o.key);
    const entry = Object.prototype.hasOwnProperty.call(table.clips, o.key) ? table.clips[o.key] : null;
    if (entry == null) problems.push(`${where} n'a pas d'entrée dans VOICE_CLIPS : ${RUN}`);
    else if (entry !== hash) problems.push(`${where} : son entrée n'est pas son empreinte actuelle : ${RUN}`);
    else if (!present.has(hash + '.mp3')) problems.push(`${where} : le clip voix/${hash}.mp3 manque : ${RUN}`);
  }
  // ligne 11 : entrée en trop, fichier orphelin
  for (const key of Object.keys(table.clips))
    if (!keys.has(key))
      problems.push(`VOICE_CLIPS : entrée en trop « ${key} » (plus une phrase fixe du code) : ${RUN}`);
  const wanted = new Set(Object.values(table.clips).map((h) => h + '.mp3'));
  for (const f of mp3)
    if (!wanted.has(f))
      problems.push(`voix/${f} : fichier orphelin (l'empreinte d'aucune entrée de VOICE_CLIPS) : ${RUN}`);
  return problems;
}

module.exports = {
  CLIPS_FILE,
  CLIP_MAX,
  TOTAL_MAX,
  SERVICE_NAMES,
  auditClips,
  clipHash,
  configProblem,
  extractPhrases,
  isMp3,
  loadToSpoken,
  readClipsTable,
  readConfig,
};
