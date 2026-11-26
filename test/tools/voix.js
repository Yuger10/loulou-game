/* ---------- `bun run voix` : les clips de la voix du jeu ----------
   (track voix-naturelle, ADR 0007 ; outil de développement, jamais chargé par le jeu)

     bun run voix              génère les clips manquants des phrases fixes
     bun run voix --essai      l'essai d'écoute : 5 phrases par voix candidate
     bun run voix --selftest   vérifie l'outil avec un faux service
     --root <dossier>          une autre racine que le dépôt

   Le service (Microsoft Azure ou Google Cloud) est payant : la clé ne vit que
   dans l'environnement du poste d'Amrou (VOIX_AZURE_KEY et VOIX_AZURE_REGION,
   ou VOIX_GOOGLE_TOKEN et VOIX_GOOGLE_PROJECT). Elle n'est jamais écrite dans
   un fichier ni affichée. Seuls des littéraux du code sont envoyés : jamais
   le prénom, jamais une donnée de partie.

   Génération : extrait les phrases fixes (test/tools/voix-phrases.js), demande
   seulement les clips absents de voix/ (test/tools/voix-service.js), écrit
   js/shared/ui/voice-clips.js (puis oxfmt), supprime les clips orphelins.
   L'essai d'écoute vit dans test/tools/voix-essai.js.

   `main` ne lit ni process.env ni le vrai fetch : tout lui est passé, pour
   que le selftest tourne dans une racine temporaire avec un faux service.
   Sortie (contrat cothon) : 0 réussi, 1 le service a refusé une phrase ou un
   fichier est invalide, 2 bloqué (pas de réglage, pas de clé, service
   injoignable, oxfmt absent). */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const {
  CLIPS_FILE,
  SERVICE_NAMES,
  clipHash,
  extractPhrases,
  readClipsTable,
  readConfig,
} = require('./voix-phrases.js');
const { ask, missingVars } = require('./voix-service.js');
const { essai } = require('./voix-essai.js');

const REPO = path.join(__dirname, '..', '..');
// oxfmt est toujours celui du vrai dépôt, même pour une autre racine (D23)
const OXFMT = path.join(REPO, 'node_modules', '.bin', 'oxfmt');
const UNLOCK_MAX = 8000; // caractères de VOICE_UNLOCK (ligne 12)

/* ----- La table générée ----- */

function clipsSource(service, unlock, clips) {
  const keys = Object.keys(clips).sort((a, b) => a.localeCompare(b, 'fr'));
  const body = keys.length
    ? '{\n' + keys.map((k) => `  ${JSON.stringify(k)}: ${JSON.stringify(clips[k])},`).join('\n') + '\n}'
    : '{}';
  return [
    '/* Généré par bun run voix (test/tools/voix.js) : ne pas modifier à la main. */',
    '/** @type {string} */',
    `export const VOICE_SERVICE = ${JSON.stringify(service)};`,
    '/** @type {string} */',
    `export const VOICE_UNLOCK = ${JSON.stringify(unlock)};`,
    '/** @type {Record<string, string>} */',
    `export const VOICE_CLIPS = ${body};`,
    '',
  ].join('\n');
}

/* ----- Génération (lignes 3 à 9 de la spec) ----- */

// Les états d'entrée (table C) : { code } si la génération ne peut pas commencer,
// sinon { config, tableFile, oldSource, old }.
function readInputs(io) {
  const { root, log } = io;
  const read = readConfig(root);
  if (read.absent) {
    log(
      "⛔ voix : voix/voix.json absent. Lance d'abord bun run voix --essai, puis écris le choix d'Amrou dans voix/voix.json.",
    );
    return { code: 2 };
  }
  if (read.problem) {
    log('❌ voix : voix/voix.json invalide : ' + read.problem);
    return { code: 1 };
  }
  const config = read.config;
  const missing = missingVars(config.service, io.env);
  if (missing.length) {
    log(`⛔ voix : ${config.service} incomplet, il manque ${missing.join(', ')}`);
    return { code: 2 };
  }
  const tableFile = path.join(root, CLIPS_FILE);
  const oldSource = fs.existsSync(tableFile) ? fs.readFileSync(tableFile, 'utf8') : null;
  const old = readClipsTable(oldSource || '');
  if (old.bad) {
    log(`❌ voix : ${CLIPS_FILE} illisible : ${old.bad}`);
    return { code: 1 };
  }
  return { config, tableFile, oldSource, old };
}

// Demande les clips absents de voix/ : { refused, fatal, written }.
async function requestClips(line, job) {
  const { config, phrases, clips, voixDir } = job;
  const refused = [];
  let written = 0;
  for (const [key, o] of phrases) {
    const file = path.join(voixDir, clips[key] + '.mp3');
    if (fs.existsSync(file)) continue;
    const r = await ask(line, config, { text: key });
    if (r.fatal) return { refused, fatal: r.fatal, written };
    if (r.refused) {
      refused.push(`${o.file}:${o.line}  ${o.text}`);
      continue;
    }
    // un clip neuf est écrit dès sa réponse, jamais par-dessus un fichier existant
    fs.writeFileSync(file, r.ok, { flag: 'wx' });
    written++;
  }
  return { refused, fatal: '', written };
}

// Le silence de déverrouillage : une requête, seulement s'il manque (un silence
// reste un silence quand la voix change) ; sans phrase, il n'a pas lieu d'être.
// Rend { unlock }, { fatal } ou { refused }.
async function requestUnlock(line, job) {
  if (!job.phrases.size) return { unlock: '' };
  if (job.old.unlock) return { unlock: job.old.unlock };
  const r = await ask(line, job.config, { silence: true });
  if (r.fatal) return { fatal: r.fatal };
  const uri = r.ok ? 'data:audio/mpeg;base64,' + r.ok.toString('base64') : '';
  if (!uri || uri.length > UNLOCK_MAX) return { refused: `${CLIPS_FILE}  silence de déverrouillage (VOICE_UNLOCK)` };
  return { unlock: uri };
}

// La table, puis oxfmt ; s'il échoue, l'ancien contenu revient à l'identique. Rend vrai si elle est écrite.
function writeTable(io, job, unlock) {
  fs.writeFileSync(job.tableFile, clipsSource(SERVICE_NAMES[job.config.service], unlock, job.clips));
  const fmt = spawnSync(io.oxfmt, [CLIPS_FILE], { cwd: io.root, stdio: 'pipe' });
  if (!fmt.error && fmt.status === 0) return true;
  if (job.oldSource == null) fs.rmSync(job.tableFile, { force: true });
  else fs.writeFileSync(job.tableFile, job.oldSource);
  return false;
}

// Les clips orphelins quittent voix/ : { removed, bytes } (le poids de ceux qui restent).
function removeOrphans(voixDir, clips) {
  const wanted = new Set(Object.values(clips).map((h) => h + '.mp3'));
  let removed = 0,
    bytes = 0;
  for (const f of fs.readdirSync(voixDir).filter((x) => x.endsWith('.mp3'))) {
    if (wanted.has(f)) bytes += fs.statSync(path.join(voixDir, f)).size;
    else {
      fs.rmSync(path.join(voixDir, f));
      removed++;
    }
  }
  return { removed, bytes };
}

async function generate(io) {
  const { root, log } = io;
  const inputs = readInputs(io);
  if (inputs.code) return inputs.code;
  const { config } = inputs;

  // une phrase par clé distincte ; sa première occurrence sert à la citer
  const phrases = new Map();
  for (const o of await extractPhrases(root)) if (!phrases.has(o.key)) phrases.set(o.key, o);
  const clips = {};
  for (const key of phrases.keys()) clips[key] = clipHash(config, key);
  const job = { ...inputs, phrases, clips, voixDir: path.join(root, 'voix') };

  const line = { io, pace: { sent: false, waited: false } };
  const got = await requestClips(line, job);
  const silence = got.fatal ? {} : await requestUnlock(line, job);
  const refused = silence.refused ? [...got.refused, silence.refused] : got.refused;
  const fatal = got.fatal || silence.fatal;
  // après un échec : les clips reçus restent, la table n'est pas réécrite, aucun clip n'est supprimé
  if (refused.length) {
    log(`❌ voix : ${refused.length} phrases refusées par le service`);
    refused.forEach((entry) => log(entry));
  }
  if (fatal) {
    log(`⛔ voix : ${config.service} injoignable ou clé refusée (${fatal})`);
    return 2;
  }
  if (refused.length) return 1;

  if (!writeTable(io, job, silence.unlock)) {
    log(`⛔ voix : oxfmt n'a pas pu formater ${CLIPS_FILE}`);
    return 2;
  }
  // les clips orphelins, en dernier
  const { removed, bytes } = removeOrphans(job.voixDir, clips);
  log(
    `✅ voix : ${phrases.size} phrases, ${got.written} nouvelles, ${removed} supprimées, ${(bytes / 1e6).toFixed(1)} Mo`,
  );
  return 0;
}

/**
 * Le point d'entrée testable. `log` et `oxfmt` ne servent qu'au selftest
 * (sortie capturée, oxfmt absent) ; par défaut la console et l'oxfmt du dépôt.
 */
async function main({ root, env, fetch, sleep, argv, essaiDir, log = console.log, oxfmt = OXFMT }) {
  const at = argv.indexOf('--root');
  const io = {
    root: at >= 0 && argv[at + 1] ? path.resolve(argv[at + 1]) : root,
    env,
    fetch,
    sleep,
    essaiDir,
    log,
    oxfmt,
  };
  return argv.includes('--essai') ? essai(io) : generate(io);
}

module.exports = { main };

// seul endroit qui lit l'environnement et le vrai réseau
if (require.main === module) {
  const argv = process.argv.slice(2);
  const run = argv.includes('--selftest')
    ? require('./voix-selftest.js').selftest(main)
    : main({
        root: REPO,
        env: process.env,
        fetch: globalThis.fetch,
        sleep: (ms) => new Promise((r) => setTimeout(r, ms)),
        argv,
        essaiDir: path.join(os.tmpdir(), 'voix-essai'),
      });
  run.then(
    (code) => process.exit(code),
    (e) => {
      console.error('⛔ voix : ' + ((e && e.message) || e));
      process.exit(2);
    },
  );
}
