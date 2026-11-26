/* ---------- Le banc du selftest de `bun run voix` ----------
   Ne touche qu'une racine temporaire et n'appelle jamais le vrai service :
   `main` reçoit un faux `fetch` qui compte ses appels et rend les statuts
   voulus, et un `sleep` qui note les pauses sans attendre. oxfmt et `toSpoken`
   viennent du vrai dépôt (spec voix-naturelle, « Selftest sans toucher au dépôt »).
   Les cas vivent dans voix-selftest-generation.js, -service.js et -essai.js ;
   test/tools/voix-selftest.js les enchaîne. */
const fs = require('fs');
const os = require('os');
const path = require('path');

const REPO = path.join(__dirname, '..', '..');
const CLIPS_FILE = 'js/shared/ui/voice-clips.js';

// corps MP3 factice : les octets `ID3` suivis de 100 octets nuls (103 octets)
const MP3 = Buffer.concat([Buffer.from('ID3'), Buffer.alloc(100)]);
const AZURE = {
  service: 'azure',
  voice: 'fr-FR-DeniseNeural',
  style: 'cheerful',
  rate: '-8%',
  format: 'audio-24khz-48kbitrate-mono-mp3',
};
const GOOGLE = { service: 'google', voice: 'fr-FR-Chirp3-HD-Aoede', style: '', rate: 0.92, format: 'MP3' };
// identifiants factices : le selftest vérifie qu'ils partent dans les en-têtes et jamais dans la sortie
const FAKE_KEY = 'cle-factice';
const FAKE_TOKEN = 'jeton-factice';
const ENV_AZURE = { VOIX_AZURE_KEY: FAKE_KEY, VOIX_AZURE_REGION: 'francecentral' };
const ENV_GOOGLE = { VOIX_GOOGLE_TOKEN: FAKE_TOKEN, VOIX_GOOGLE_PROJECT: 'lagon-projet' };

const P1 = 'Presque ! Regarde bien et réessaie.';
const K1 = 'Presque! Regarde bien et réessaie.';
const K2 = "Touche un personnage pour l'aider.";
const TWO = `speak('${P1}');\nspeak("${K2}");\n`;

// Faux service : `answer(url, init, n)` rend un statut, une erreur à lever, ou
// { status, body, headers, json }. Sans réponse donnée : 200 et le MP3 factice.
function fakeService(answer) {
  const calls = [];
  const fetch = async (url, init) => {
    calls.push({ url, init });
    const a = answer ? answer(url, init, calls.length) : 200;
    if (a instanceof Error) throw a;
    const r = typeof a === 'number' ? { status: a } : a;
    const body = r.body || MP3;
    return {
      status: r.status,
      headers: { get: (h) => (r.headers || {})[h.toLowerCase()] ?? null },
      arrayBuffer: async () => body.buffer.slice(body.byteOffset, body.byteOffset + body.byteLength),
      json: async () => {
        if (r.json === 'illisible') throw new SyntaxError('JSON illisible');
        return r.json !== undefined ? r.json : { audioContent: body.toString('base64') };
      },
    };
  };
  return { fetch, calls };
}

const mp3s = (root) =>
  fs
    .readdirSync(path.join(root, 'voix'))
    .filter((f) => f.endsWith('.mp3'))
    .sort();
const table = (root) => fs.readFileSync(path.join(root, CLIPS_FILE), 'utf8');
const last = (r) => r.out[r.out.length - 1];

// le vrai dépôt ne doit pas bouger : sa table et son dossier voix/ avant, puis après
const repoSnapshot = () =>
  JSON.stringify([
    fs.existsSync(path.join(REPO, CLIPS_FILE)) ? fs.readFileSync(path.join(REPO, CLIPS_FILE), 'utf8') : null,
    fs.existsSync(path.join(REPO, 'voix')) ? fs.readdirSync(path.join(REPO, 'voix')).sort() : null,
  ]);

// Le banc d'un selftest : une racine temporaire, les lancements de `main`, le compte des cas.
function makeBench(main) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'voix-selftest-'));
  const essaiDir = path.join(tmp, 'essai');
  const fails = [];
  let n = 0;
  let roots = 0;
  const expect = (name, got, want) => {
    n++;
    const g = typeof got === 'string' ? got : JSON.stringify(got),
      w = typeof want === 'string' ? want : JSON.stringify(want);
    if (g !== w) fails.push(`❌ ${name} : ${g} au lieu de ${w}`);
  };
  // une racine d'exemple : des fichiers js/, voix/voix.json, une table vide, la copie de .oxfmtrc.json
  function makeRoot(src, config) {
    const root = path.join(tmp, 'racine-' + ++roots);
    fs.mkdirSync(path.join(root, 'js', 'shared', 'ui'), { recursive: true });
    fs.mkdirSync(path.join(root, 'voix'));
    fs.writeFileSync(path.join(root, 'js', 'exemple.js'), src);
    fs.writeFileSync(path.join(root, CLIPS_FILE), '');
    if (config) fs.writeFileSync(path.join(root, 'voix', 'voix.json'), JSON.stringify(config));
    fs.copyFileSync(path.join(REPO, '.oxfmtrc.json'), path.join(root, '.oxfmtrc.json'));
    return root;
  }
  // un lancement : sa sortie, son code, les pauses demandées, les appels au service
  async function run(root, { env = ENV_AZURE, answer, argv = [], oxfmt } = {}) {
    const service = fakeService(answer);
    const out = [];
    const sleeps = [];
    const code = await main({
      root,
      env,
      fetch: service.fetch,
      sleep: async (ms) => void sleeps.push(ms),
      argv,
      essaiDir,
      log: (entry) => out.push(entry),
      oxfmt,
    });
    return { code, out, sleeps, calls: service.calls };
  }
  // la fin : les cas faux, ou le compte des cas ; rend le code de sortie
  const report = () => {
    fails.forEach((f) => console.log(f));
    if (!fails.length) console.log(`✅ voix : selftest, ${n} cas`);
    return fails.length ? 1 : 0;
  };
  return { tmp, essaiDir, expect, makeRoot, run, report };
}

module.exports = {
  AZURE,
  CLIPS_FILE,
  ENV_AZURE,
  ENV_GOOGLE,
  FAKE_KEY,
  FAKE_TOKEN,
  GOOGLE,
  K1,
  K2,
  MP3,
  P1,
  REPO,
  TWO,
  fakeService,
  last,
  makeBench,
  mp3s,
  repoSnapshot,
  table,
};
