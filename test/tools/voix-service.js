/* ---------- Les deux services de voix de `bun run voix` ----------
   (track voix-naturelle, tables A et G de la spec ; outil de développement)
   Les requêtes à Microsoft Azure et à Google Cloud, et `ask`, qui en envoie
   une avec ses reprises et son rythme. Rien ici ne lit l'environnement ni le
   vrai réseau : `io` porte `env`, `fetch` et `sleep` (test/tools/voix.js). */
const { CLIP_MAX, isMp3 } = require('./voix-phrases.js');

const SERVICE_VARS = {
  azure: ['VOIX_AZURE_KEY', 'VOIX_AZURE_REGION'],
  google: ['VOIX_GOOGLE_TOKEN', 'VOIX_GOOGLE_PROJECT'],
};
const AZURE_PAUSE = 3400; // palier gratuit : jamais plus de 18 requêtes par 60 s (ligne 8)
const TRIES = 3; // 1 envoi et 2 reprises (ligne 7)
const RETRY_DEFAULT = 10; // secondes, sans en-tête Retry-After
const RETRY_MAX = 60;
const RETRY_STATUS = [429, 500, 502, 503];
const SILENCE = '<break time="200ms"/>';

// les variables d'un service absentes ou vides, dans l'ordre de la spec
const missingVars = (service, env) => SERVICE_VARS[service].filter((v) => !env[v]);
const escapeXml = (s) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');

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

// Ce que vaut une réponse : { ok }, { refused }, { fatal }, ou { retry: secondes, cause }.
async function verdict(config, res) {
  const s = res.status;
  if (s === 200) {
    const body = await audioBody(config, res);
    return body && body.length >= 1 && body.length <= CLIP_MAX && isMp3(body) ? { ok: body } : { refused: true };
  }
  if (s === 401 || s === 403) return { fatal: String(s) };
  if (!RETRY_STATUS.includes(s)) return { refused: true };
  const after = Number(res.headers.get('retry-after'));
  return { retry: after > 0 ? Math.min(after, RETRY_MAX) : RETRY_DEFAULT, cause: String(s) };
}

/* Une demande au service, selon la table « Réponse du service » :
   { ok: Buffer }      200 et un MP3 valide de 1 à 307 200 octets ;
   { refused: true }   400, 404, autre statut, ou 200 sans MP3 valide : les autres continuent ;
   { fatal: cause }    401, 403, ou 3e tentative ratée (429, 5xx, réseau) : le service s'arrête.
   `line` : { io, pace }, `pace` gardant le rythme d'un service d'un appel à l'autre. */
async function ask({ io, pace }, config, said) {
  const { url, init } = (config.service === 'azure' ? azureRequest : googleRequest)(config, io.env, said);
  const azure = config.service === 'azure';
  let cause = '';
  for (let attempt = 1; attempt <= TRIES; attempt++) {
    if (azure && pace.sent && !pace.waited) await io.sleep(AZURE_PAUSE);
    pace.sent = true;
    pace.waited = false;
    let v;
    try {
      v = await verdict(config, await io.fetch(url, init));
    } catch (e) {
      v = { retry: RETRY_DEFAULT, cause: 'réseau : ' + ((e && e.name) || 'Error') };
    }
    if (v.retry === undefined) return v;
    cause = v.cause;
    if (attempt < TRIES) {
      // l'attente d'une reprise vaut aussi pour le rythme Azure
      await io.sleep(Math.max(v.retry * 1000, azure ? AZURE_PAUSE : 0));
      pace.waited = true;
    }
  }
  return { fatal: cause };
}

module.exports = { ask, missingVars };
