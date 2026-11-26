/* ---------- La garde des clips de la voix ----------
   (test/voix-clips.test.js, lignes 10 à 13 de la spec voix-naturelle)
   auditClips(root) : la liste des problèmes d'une racine, vide si tout va
   bien. Tant que voix/voix.json n'existe pas, la table doit être vide et
   voix/ sans clip. Ensuite : chaque phrase fixe a son clip à jour, aucun clip
   ni entrée en trop, le budget tenu. */
const fs = require('fs');
const path = require('path');
const {
  CLIPS_FILE,
  CLIP_MAX,
  TOTAL_MAX,
  SERVICE_NAMES,
  clipHash,
  extractPhrases,
  readClipsTable,
  readConfig,
} = require('./voix-phrases.js');

const CLIP_NAME = /^[0-9a-f]{12}\.mp3$/;
const UNLOCK_MAX = 8000; // caractères de VOICE_UNLOCK
const RUN = 'lance bun run voix';

// ligne 12 : rien d'autre dans voix/ que voix.json et des clips nommés par leur
// empreinte ; VOICE_UNLOCK et VOICE_CLIPS vont ensemble
function shapeProblems(files, table) {
  const problems = files
    .filter((f) => f !== 'voix.json' && !CLIP_NAME.test(f))
    .map((f) => `voix/${f} : ni voix.json ni un clip nommé par son empreinte (^[0-9a-f]{12}\\.mp3$)`);
  if (!!table.unlock !== Object.keys(table.clips).length > 0)
    problems.push(`VOICE_UNLOCK et VOICE_CLIPS vont ensemble : l'un est vide et pas l'autre (${RUN})`);
  if (table.unlock && !table.unlock.startsWith('data:audio/mpeg;base64,'))
    problems.push('VOICE_UNLOCK ne commence pas par data:audio/mpeg;base64,');
  if (table.unlock.length > UNLOCK_MAX)
    problems.push(`VOICE_UNLOCK dépasse ${UNLOCK_MAX} caractères (${table.unlock.length})`);
  return problems;
}

// phases 1 et 2 : pas encore de voix choisie, le lecteur du jeu reste inerte
function emptyProblems(table, mp3) {
  const problems = [];
  if (Object.keys(table.clips).length) problems.push("VOICE_CLIPS doit être vide tant que voix/voix.json n'existe pas");
  if (table.service) problems.push("VOICE_SERVICE doit être vide tant que voix/voix.json n'existe pas");
  if (mp3.length) problems.push(`voix/ contient ${mp3.length} clip(s) alors que voix/voix.json n'existe pas`);
  return problems;
}

// ligne 12 : le budget
function budgetProblems(voixDir, mp3) {
  const problems = [];
  let total = 0;
  for (const f of mp3) {
    const size = fs.statSync(path.join(voixDir, f)).size;
    total += size;
    if (size > CLIP_MAX) problems.push(`voix/${f} pèse ${size} octets : plus de 300 Ko (${CLIP_MAX})`);
  }
  if (total > TOTAL_MAX) problems.push(`voix/ pèse ${total} octets : plus de 8 Mo (${TOTAL_MAX})`);
  return problems;
}

// ligne 10 : chaque phrase fixe a son entrée, à son empreinte actuelle, et son fichier ;
// ligne 11 : aucune entrée en trop, aucun fichier orphelin
function phraseProblems(phrases, { config, table, mp3 }) {
  const problems = [];
  const present = new Set(mp3);
  const keys = new Set();
  for (const o of phrases) {
    keys.add(o.key);
    const where = `${o.file}:${o.line} « ${o.text} »`;
    const hash = clipHash(config, o.key);
    const entry = Object.prototype.hasOwnProperty.call(table.clips, o.key) ? table.clips[o.key] : null;
    if (entry == null) problems.push(`${where} n'a pas d'entrée dans VOICE_CLIPS : ${RUN}`);
    else if (entry !== hash) problems.push(`${where} : son entrée n'est pas son empreinte actuelle : ${RUN}`);
    else if (!present.has(hash + '.mp3')) problems.push(`${where} : le clip voix/${hash}.mp3 manque : ${RUN}`);
  }
  for (const key of Object.keys(table.clips))
    if (!keys.has(key))
      problems.push(`VOICE_CLIPS : entrée en trop « ${key} » (plus une phrase fixe du code) : ${RUN}`);
  const wanted = new Set(Object.values(table.clips).map((h) => h + '.mp3'));
  for (const f of mp3)
    if (!wanted.has(f))
      problems.push(`voix/${f} : fichier orphelin (l'empreinte d'aucune entrée de VOICE_CLIPS) : ${RUN}`);
  return problems;
}

async function auditClips(root) {
  const voixDir = path.join(root, 'voix');
  const files = fs.existsSync(voixDir) ? fs.readdirSync(voixDir).sort() : [];
  const tableFile = path.join(root, CLIPS_FILE);
  const table = readClipsTable(fs.existsSync(tableFile) ? fs.readFileSync(tableFile, 'utf8') : '');
  if (table.bad) return [`${CLIPS_FILE} illisible : ${table.bad} (${RUN})`];
  const mp3 = files.filter((f) => CLIP_NAME.test(f));
  const problems = shapeProblems(files, table);

  const read = readConfig(root);
  if (read.absent) return [...problems, ...emptyProblems(table, mp3)];
  // ligne 13 : la forme exacte de voix/voix.json
  if (read.problem) return [...problems, 'voix/voix.json invalide : ' + read.problem];
  const config = read.config;
  if (table.service !== SERVICE_NAMES[config.service])
    problems.push(`VOICE_SERVICE vaut « ${table.service} » au lieu de « ${SERVICE_NAMES[config.service]} » (${RUN})`);
  return [
    ...problems,
    ...budgetProblems(voixDir, mp3),
    ...phraseProblems(await extractPhrases(root), { config, table, mp3 }),
  ];
}

module.exports = { auditClips };
