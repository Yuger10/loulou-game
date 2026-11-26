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
   seulement les clips absents de voix/, écrit js/shared/ui/voice-clips.js
   (puis oxfmt), supprime les clips orphelins.

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
  CLIP_MAX,
  SERVICE_NAMES,
  clipHash,
  extractPhrases,
  isMp3,
  loadToSpoken,
  readClipsTable,
  readConfig,
} = require('./voix-phrases.js');

const REPO = path.join(__dirname, '..', '..');
// oxfmt est toujours celui du vrai dépôt, même pour une autre racine (D23)
const OXFMT = path.join(REPO, 'node_modules', '.bin', 'oxfmt');

const SERVICE_VARS = {
  azure: ['VOIX_AZURE_KEY', 'VOIX_AZURE_REGION'],
  google: ['VOIX_GOOGLE_TOKEN', 'VOIX_GOOGLE_PROJECT'],
};
const AZURE_PAUSE = 3400; // palier gratuit : jamais plus de 18 requêtes par 60 s (ligne 8)
const TRIES = 3; // 1 envoi et 2 reprises (ligne 7)
const RETRY_DEFAULT = 10; // secondes, sans en-tête Retry-After
const RETRY_MAX = 60;
const UNLOCK_MAX = 8000; // caractères de VOICE_UNLOCK (ligne 12)
const SILENCE = '<break time="200ms"/>';

// Table E : les 5 phrases de l'essai d'écoute
const ESSAI_PHRASES = [
  "Touche un personnage pour l'aider.",
  'Compte les étoiles, puis touche le bon nombre.',
  'Presque ! Regarde bien et réessaie.',
  "Bravo ! Marina t'offre un coquillage.",
  'Il était une fois, au milieu du lagon, une île qui brillait la nuit.',
];
// Table V : les voix candidates, avec les réglages de voix.json qu'elles donneraient
const ESSAI_VOICES = [
  {
    service: 'azure',
    voice: 'fr-FR-DeniseNeural',
    style: 'cheerful',
    rate: '-8%',
    format: 'audio-24khz-48kbitrate-mono-mp3',
  },
  { service: 'azure', voice: 'fr-FR-EloiseNeural', style: '', rate: '-8%', format: 'audio-24khz-48kbitrate-mono-mp3' },
  {
    service: 'azure',
    voice: 'fr-FR-Vivienne:DragonHDLatestNeural',
    style: '',
    rate: '-8%',
    format: 'audio-24khz-48kbitrate-mono-mp3',
  },
  { service: 'google', voice: 'fr-FR-Chirp3-HD-Aoede', style: '', rate: 0.92, format: 'MP3' },
  { service: 'google', voice: 'fr-FR-Chirp3-HD-Leda', style: '', rate: 0.92, format: 'MP3' },
  { service: 'google', voice: 'fr-FR-Chirp3-HD-Kore', style: '', rate: 0.92, format: 'MP3' },
];

// les variables d'un service absentes ou vides, dans l'ordre de la spec
const missingVars = (service, env) => SERVICE_VARS[service].filter((v) => !env[v]);
const escapeXml = (s) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
const worst = (codes) => (codes.includes(2) ? 2 : codes.includes(1) ? 1 : 0);

/* ----- Les deux requêtes (tables A et G de la spec) ----- */

// `said` : { text } pour une phrase (la clé, exactement toSpoken), { silence: true } pour le déverrouillage
function azureRequest(config, env, said) {
  const inner = said.silence ? SILENCE : escapeXml(said.text);
  const prosody = `<prosody rate="${config.rate}">${inner}</prosody>`;
  const styled = config.style ? `<mstts:express-as style="${config.style}">${prosody}</mstts:express-as>` : prosody;
  return {
    url: `https://${env.VOIX_AZURE_REGION}.tts.speech.microsoft.com/cognitiveservices/v1`,
    init: {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': env.VOIX_AZURE_KEY,
        'Content-Type': 'application/ssml+xml',
        'X-Microsoft-OutputFormat': config.format,
        'User-Agent': 'lagon-voix',
      },
      body: `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="https://www.w3.org/2001/mstts" xml:lang="fr-FR"><voice name="${config.voice}">${styled}</voice></speak>`,
    },
  };
}
function googleRequest(config, env, said) {
  return {
    url: 'https://texttospeech.googleapis.com/v1/text:synthesize',
    init: {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + env.VOIX_GOOGLE_TOKEN,
        'x-goog-user-project': env.VOIX_GOOGLE_PROJECT,
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify({
        input: said.silence ? { ssml: `<speak>${SILENCE}</speak>` } : { text: said.text },
        voice: { languageCode: 'fr-FR', name: config.voice },
        audioConfig: { audioEncoding: config.format, speakingRate: config.rate },
      }),
    },
  };
}

// le corps d'une réponse 200 : les octets du MP3, ou null s'il n'est pas lisible
async function audioBody(config, res) {
  try {
    if (config.service === 'azure') return Buffer.from(await res.arrayBuffer());
    const json = await res.json();
    return typeof json.audioContent === 'string' ? Buffer.from(json.audioContent, 'base64') : null;
  } catch {
    // corps coupé ou JSON illisible : traité comme une réponse refusée
    return null;
  }
}

/* Une demande au service, selon la table « Réponse du service » :
   { ok: Buffer }      200 et un MP3 valide de 1 à 307 200 octets ;
   { refused: true }   400, 404, autre statut, ou 200 sans MP3 valide : les autres continuent ;
   { fatal: cause }    401, 403, ou 3e tentative ratée (429, 5xx, réseau) : le service s'arrête.
   `pace` garde le rythme d'un service d'un appel à l'autre. */
async function ask(io, pace, config, said) {
  const { url, init } = (config.service === 'azure' ? azureRequest : googleRequest)(config, io.env, said);
  let cause = '';
  for (let attempt = 1; attempt <= TRIES; attempt++) {
    if (config.service === 'azure' && pace.sent && !pace.waited) await io.sleep(AZURE_PAUSE);
    pace.sent = true;
    pace.waited = false;
    let wait = RETRY_DEFAULT;
    try {
      const res = await io.fetch(url, init);
      const s = res.status;
      if (s === 200) {
        const body = await audioBody(config, res);
        return body && body.length >= 1 && body.length <= CLIP_MAX && isMp3(body) ? { ok: body } : { refused: true };
      }
      if (s === 401 || s === 403) return { fatal: String(s) };
      if (![429, 500, 502, 503].includes(s)) return { refused: true };
      cause = String(s);
      const after = Number(res.headers.get('retry-after'));
      if (after > 0) wait = Math.min(after, RETRY_MAX);
    } catch (e) {
      cause = 'réseau : ' + ((e && e.name) || 'Error');
    }
    if (attempt < TRIES) {
      // l'attente d'une reprise vaut aussi pour le rythme Azure
      await io.sleep(Math.max(wait * 1000, config.service === 'azure' ? AZURE_PAUSE : 0));
      pace.waited = true;
    }
  }
  return { fatal: cause };
}

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

async function generate(io) {
  const { root, log } = io;
  const read = readConfig(root);
  if (read.absent) {
    log(
      "⛔ voix : voix/voix.json absent. Lance d'abord bun run voix --essai, puis écris le choix d'Amrou dans voix/voix.json.",
    );
    return 2;
  }
  if (read.problem) {
    log('❌ voix : voix/voix.json invalide : ' + read.problem);
    return 1;
  }
  const config = read.config;
  const missing = missingVars(config.service, io.env);
  if (missing.length) {
    log(`⛔ voix : ${config.service} incomplet, il manque ${missing.join(', ')}`);
    return 2;
  }
  const tableFile = path.join(root, CLIPS_FILE);
  const oldSource = fs.existsSync(tableFile) ? fs.readFileSync(tableFile, 'utf8') : null;
  const old = readClipsTable(oldSource || '');
  if (old.bad) {
    log(`❌ voix : ${CLIPS_FILE} illisible : ${old.bad}`);
    return 1;
  }

  // une phrase par clé distincte ; sa première occurrence sert à la citer
  const phrases = new Map();
  for (const o of await extractPhrases(root)) if (!phrases.has(o.key)) phrases.set(o.key, o);
  const clips = {};
  for (const key of phrases.keys()) clips[key] = clipHash(config, key);

  const voixDir = path.join(root, 'voix');
  const pace = { sent: false, waited: false };
  const refused = [];
  let fatal = '';
  let written = 0;
  for (const [key, o] of phrases) {
    const file = path.join(voixDir, clips[key] + '.mp3');
    if (fs.existsSync(file)) continue;
    const r = await ask(io, pace, config, { text: key });
    if (r.fatal) {
      fatal = r.fatal;
      break;
    }
    if (r.refused) {
      refused.push(`${o.file}:${o.line}  ${o.text}`);
      continue;
    }
    // un clip neuf est écrit dès sa réponse, jamais par-dessus un fichier existant
    fs.writeFileSync(file, r.ok, { flag: 'wx' });
    written++;
  }
  // le silence de déverrouillage : une requête, seulement s'il manque (un silence
  // reste un silence quand la voix change) ; sans phrase, il n'a pas lieu d'être
  let unlock = phrases.size ? old.unlock : '';
  if (!fatal && phrases.size && !unlock) {
    const r = await ask(io, pace, config, { silence: true });
    const uri = r.ok ? 'data:audio/mpeg;base64,' + r.ok.toString('base64') : '';
    if (r.fatal) fatal = r.fatal;
    else if (!uri || uri.length > UNLOCK_MAX) refused.push(`${CLIPS_FILE}  silence de déverrouillage (VOICE_UNLOCK)`);
    else unlock = uri;
  }
  // après un échec : les clips reçus restent, la table n'est pas réécrite, aucun clip n'est supprimé
  if (refused.length) {
    log(`❌ voix : ${refused.length} phrases refusées par le service`);
    refused.forEach((line) => log(line));
  }
  if (fatal) {
    log(`⛔ voix : ${config.service} injoignable ou clé refusée (${fatal})`);
    return 2;
  }
  if (refused.length) return 1;

  // la table, puis oxfmt ; s'il échoue, l'ancien contenu revient à l'identique
  fs.writeFileSync(tableFile, clipsSource(SERVICE_NAMES[config.service], unlock, clips));
  const fmt = spawnSync(io.oxfmt, [CLIPS_FILE], { cwd: root, stdio: 'pipe' });
  if (fmt.error || fmt.status !== 0) {
    if (oldSource == null) fs.rmSync(tableFile, { force: true });
    else fs.writeFileSync(tableFile, oldSource);
    log(`⛔ voix : oxfmt n'a pas pu formater ${CLIPS_FILE}`);
    return 2;
  }
  // les clips orphelins, en dernier
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
  log(`✅ voix : ${phrases.size} phrases, ${written} nouvelles, ${removed} supprimées, ${(bytes / 1e6).toFixed(1)} Mo`);
  return 0;
}

/* ----- Essai d'écoute (lignes 1 et 2) ----- */

const escapeHtml = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function ecouteHtml(got) {
  const rows = got
    .map(
      (g) =>
        `<tr><td>${escapeHtml(g.service)}</td><td>${escapeHtml(g.voice)}</td><td>${escapeHtml(g.phrase)}</td>` +
        `<td><audio controls preload="none" src="${escapeHtml(g.file)}"></audio></td></tr>`,
    )
    .join('\n');
  return `<!doctype html>
<html lang="fr"><meta charset="utf-8"><title>Essai d'écoute des voix</title>
<style>body{font-family:system-ui,sans-serif;margin:1rem}td{padding:.3rem .6rem;border-bottom:1px solid #ddd}</style>
<h1>Essai d'écoute des voix</h1>
<p>Chaque phrase est dite par chaque voix candidate. La voix choisie s'écrit dans voix/voix.json.</p>
<table>
${rows}
</table>
</html>
`;
}

async function essai(io) {
  const { env, log, essaiDir } = io;
  const complete = [];
  for (const service of ['azure', 'google']) {
    const missing = missingVars(service, env);
    if (!missing.length) complete.push(service);
    // à moitié posé : une seule de ses deux variables
    else if (missing.length === 1) log(`⚠️ voix : ${service} ignoré, il manque ${missing.join(', ')}`);
  }
  if (!complete.length) {
    log(
      "⛔ voix : aucun service complet dans l'environnement (VOIX_AZURE_KEY et VOIX_AZURE_REGION, ou VOIX_GOOGLE_TOKEN et VOIX_GOOGLE_PROJECT), rien n'est généré",
    );
    return 2;
  }
  const toSpoken = await loadToSpoken();
  fs.rmSync(essaiDir, { recursive: true, force: true });
  fs.mkdirSync(essaiDir, { recursive: true });
  const codes = [];
  const got = [];
  for (const service of complete) {
    const pace = { sent: false, waited: false };
    let stopped = false;
    for (const config of ESSAI_VOICES.filter((v) => v.service === service)) {
      if (stopped) break;
      for (let n = 1; n <= ESSAI_PHRASES.length; n++) {
        const phrase = ESSAI_PHRASES[n - 1];
        // le texte même qui serait généré : ce que Web Speech dit aujourd'hui (ligne 6b)
        const r = await ask(io, pace, config, { text: toSpoken(phrase) });
        if (r.fatal) {
          log(`⛔ voix : ${service} injoignable ou clé refusée (${r.fatal})`);
          codes.push(2);
          stopped = true;
          break;
        }
        if (r.refused) {
          log(`⚠️ voix : voix inconnue : ${config.voice}`);
          codes.push(1);
          break; // cette voix s'arrête, les autres continuent
        }
        const file = `${service}-${config.voice.replace(/:/g, '_')}-${n}.mp3`;
        fs.writeFileSync(path.join(essaiDir, file), r.ok);
        got.push({ service, voice: config.voice, phrase, file });
      }
    }
  }
  const page = path.join(essaiDir, 'ecoute.html');
  fs.writeFileSync(page, ecouteHtml(got));
  log(page);
  return worst(codes);
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
