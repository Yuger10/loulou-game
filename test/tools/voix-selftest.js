/* ---------- Selftest de `bun run voix` (test/tools/voix.js --selftest) ----------
   Ne touche qu'une racine temporaire et n'appelle jamais le vrai service :
   `main` reçoit un faux `fetch` qui compte ses appels et rend les statuts
   voulus, et un `sleep` qui note les pauses sans attendre. oxfmt et `toSpoken`
   viennent du vrai dépôt (spec voix-naturelle, « Selftest sans toucher au dépôt »).
   Sortie : 0 tous les cas passent, 1 un cas est faux, 2 oxfmt introuvable. */
const fs = require('fs');
const os = require('os');
const path = require('path');

const REPO = path.join(__dirname, '..', '..');
const OXFMT = path.join(REPO, 'node_modules', '.bin', 'oxfmt');
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
const ENV_AZURE = { VOIX_AZURE_KEY: 'cle-secrete-1234', VOIX_AZURE_REGION: 'francecentral' };
const ENV_GOOGLE = { VOIX_GOOGLE_TOKEN: 'jeton-secret-5678', VOIX_GOOGLE_PROJECT: 'lagon-projet' };

const P1 = 'Presque ! Regarde bien et réessaie.';
const K1 = 'Presque! Regarde bien et réessaie.';
const K2 = "Touche un personnage pour l'aider.";
const TWO = `speak('${P1}');\nspeak("${K2}");\n`;

// source d'exemple pour les règles R1 à R5 (une phrase par ligne, les lignes comptent)
const RULES_SRC = [
  "speak('Bonjour le lagon.');", // 1 : R1
  'speak(`Bravo ${name} !`);', // 2 : gabarit avec ${} ignoré
  'speak(`Encore une fois !`);', // 3 : R1, gabarit sans ${}
  "speechBubble('Regarde <b>bien</b> ⭐ !');", // 4 : R1, HTML retiré, emoji devenu mot
  "gameHeader('Titre', 'Consigne écrite', 'Consigne dite');", // 5 : R2, le 3e argument
  "gameHeader('Titre', 'Consigne seule');", // 6 : R2, le 2e argument
  "const perso = { say: 'Je suis Marina.' };", // 7 : R3
  'const a = \'<button data-say="Dis &quot;oui&quot;.">x</button>\';', // 8 : R4
  'const b = `<i data-say="${x}">`;', // 9 : data-say variable, ignoré
  'const c = `<i data-say="Écoute bien.">${x}</i>`;', // 10 : R4 dans un gabarit
  '// voix: phrases', // 11
  "const CHEERS = ['Super !', 'Bien joué !'];", // 12 : R5, tableau
  '// voix: phrases', // 13
  "const TABLE = { a: 'Presque.', b: { c: ['Encore.'] } };", // 14 : R5, objet, récursif
  "const AUTRES = ['Pas moi.'];", // 15 : sans marqueur, ignoré
  "speak('Tu as 3 étoiles.');", // 16 : un chiffre, rejeté
  "speak('🎉');", // 17 : vide après toSpoken, rejeté
  "speak('Bonjour le lagon.');", // 18 : seconde occurrence de la même clé
  'speak(texte);', // 19 : pas un littéral, ignoré
].join('\n');
const RULES_KEYS = [
  'Bien joué!',
  'Bonjour le lagon.',
  'Consigne dite',
  'Consigne seule',
  'Dis "oui".',
  'Écoute bien.',
  'Encore une fois!',
  'Encore.',
  'Je suis Marina.',
  'Presque.',
  'Regarde bien étoile!',
  'Super!',
];

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

async function selftest(main) {
  if (!fs.existsSync(OXFMT)) {
    console.log('⛔ voix : oxfmt introuvable');
    return 2;
  }
  const { extractPhrases, clipHash } = require('./voix-phrases.js');
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'voix-selftest-'));
  const fails = [];
  let n = 0;
  const expect = (name, got, want) => {
    n++;
    const g = typeof got === 'string' ? got : JSON.stringify(got),
      w = typeof want === 'string' ? want : JSON.stringify(want);
    if (g !== w) fails.push(`❌ ${name} : ${g} au lieu de ${w}`);
  };

  // une racine d'exemple : des fichiers js/, voix/voix.json, une table vide, la copie de .oxfmtrc.json
  let roots = 0;
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
  const essaiDir = path.join(tmp, 'essai');
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
      log: (line) => out.push(line),
      oxfmt,
    });
    return { code, out, sleeps, calls: service.calls };
  }
  const mp3s = (root) =>
    fs
      .readdirSync(path.join(root, 'voix'))
      .filter((f) => f.endsWith('.mp3'))
      .sort();
  const table = (root) => fs.readFileSync(path.join(root, CLIPS_FILE), 'utf8');
  const last = (r) => r.out[r.out.length - 1];

  // le vrai dépôt ne doit pas bouger : sa table et son dossier voix/ avant, puis après
  const snapshot = () =>
    JSON.stringify([
      fs.existsSync(path.join(REPO, CLIPS_FILE)) ? fs.readFileSync(path.join(REPO, CLIPS_FILE), 'utf8') : null,
      fs.existsSync(path.join(REPO, 'voix')) ? fs.readdirSync(path.join(REPO, 'voix')).sort() : null,
    ]);
  const before = snapshot();

  try {
    /* ----- extraction (R1 à R5, ligne 9) ----- */
    {
      const root = makeRoot(RULES_SRC, AZURE);
      // la table générée n'est jamais une source de phrases
      fs.writeFileSync(path.join(root, CLIPS_FILE), "speak('Pas une phrase du jeu.');\n");
      const occ = await extractPhrases(root);
      const keys = [...new Set(occ.map((o) => o.key))].sort((a, b) => a.localeCompare(b, 'fr'));
      expect('extraction R1 à R5 : les clés', keys, RULES_KEYS);
      expect('extraction : toutes les occurrences (une clé peut en avoir deux)', occ.length, RULES_KEYS.length + 1);
      const twice = occ.filter((o) => o.key === 'Bonjour le lagon.');
      expect(
        'extraction : fichier et ligne de chaque occurrence',
        twice.map((o) => `${o.file}:${o.line}`).join(' '),
        'js/exemple.js:1 js/exemple.js:18',
      );
      expect('extraction : le texte du code est gardé', occ.find((o) => o.key === 'Super!').text, 'Super !');
    }

    /* ----- empreinte (D9) ----- */
    expect('empreinte de la spec', clipHash(AZURE, K1), '3b8aa8075516');
    expect('empreinte stable pour un même texte', clipHash(AZURE, K1), clipHash({ ...AZURE }, K1));
    expect(
      'empreinte différente si voix.json change',
      clipHash({ ...AZURE, rate: '-5%' }, K1) !== clipHash(AZURE, K1),
      true,
    );
    expect('empreinte différente pour un autre service', clipHash(GOOGLE, K1) !== clipHash(AZURE, K1), true);

    /* ----- génération : N + 1, 0, 1, N appels (lignes 3 à 6) ----- */
    {
      const root = makeRoot(TWO, AZURE);
      const h1 = clipHash(AZURE, K1),
        h2 = clipHash(AZURE, K2);
      let r = await run(root);
      expect('premier lancement : code', r.code, 0);
      expect('premier lancement : N + 1 appels', r.calls.length, 3);
      expect('premier lancement : ligne de succès', last(r), '✅ voix : 2 phrases, 2 nouvelles, 0 supprimées, 0.0 Mo');
      expect(
        'premier lancement : les clips portent leur empreinte',
        mp3s(root),
        [h1, h2].sort().map((h) => h + '.mp3'),
      );
      expect('rythme Azure : 3,4 s entre deux requêtes (ligne 8)', r.sleeps, [3400, 3400]);
      const unlock = 'data:audio/mpeg;base64,' + MP3.toString('base64');
      expect(
        'texte exact du fichier généré (après oxfmt)',
        table(root),
        [
          '/* Généré par bun run voix (test/tools/voix.js) : ne pas modifier à la main. */',
          '/** @type {string} */',
          "export const VOICE_SERVICE = 'Microsoft Azure';",
          '/** @type {string} */',
          // oxfmt passe à la ligne quand la valeur dépasse la largeur de 120
          'export const VOICE_UNLOCK =',
          `  '${unlock}';`,
          '/** @type {Record<string, string>} */',
          'export const VOICE_CLIPS = {',
          `  '${K1}': '${h1}',`,
          `  "${K2}": '${h2}',`,
          '};',
          '',
        ].join('\n'),
      );
      // la requête Azure (table A) et le texte envoyé (ligne 6b)
      const call = r.calls.find((c) => String(c.init.body).includes('Presque'));
      expect('Azure : adresse', call.url, 'https://francecentral.tts.speech.microsoft.com/cognitiveservices/v1');
      expect('Azure : méthode', call.init.method, 'POST');
      expect('Azure : en-têtes', call.init.headers, {
        'Ocp-Apim-Subscription-Key': 'cle-secrete-1234',
        'Content-Type': 'application/ssml+xml',
        'X-Microsoft-OutputFormat': 'audio-24khz-48kbitrate-mono-mp3',
        'User-Agent': 'lagon-voix',
      });
      expect(
        'Azure : corps SSML, la clé toSpoken (sans espace avant « ! »)',
        call.init.body,
        '<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="https://www.w3.org/2001/mstts" xml:lang="fr-FR"><voice name="fr-FR-DeniseNeural"><mstts:express-as style="cheerful"><prosody rate="-8%">Presque! Regarde bien et réessaie.</prosody></mstts:express-as></voice></speak>',
      );
      expect(
        'Azure : apostrophe échappée pour XML',
        r.calls.some((c) => String(c.init.body).includes('pour l&apos;aider.')),
        true,
      );
      expect(
        'Azure : le silence de déverrouillage est demandé en dernier',
        String(r.calls[2].init.body).includes('<break time="200ms"/>'),
        true,
      );
      expect('la clé du service ne paraît jamais dans la sortie', r.out.join('\n').includes('cle-secrete'), false);

      const bytes = table(root);
      r = await run(root);
      expect('tout à jour : 0 appel', r.calls.length, 0);
      expect('tout à jour : ligne de succès', last(r), '✅ voix : 2 phrases, 0 nouvelles, 0 supprimées, 0.0 Mo');
      expect("tout à jour : table identique à l'octet près", table(root) === bytes, true);
      expect('tout à jour : code', r.code, 0);

      fs.writeFileSync(path.join(root, 'js', 'exemple.js'), TWO.replace('réessaie.', 'réessaye.'));
      r = await run(root);
      expect('une phrase change : 1 appel (pas de silence)', r.calls.length, 1);
      expect('une phrase change : ligne de succès', last(r), '✅ voix : 2 phrases, 1 nouvelles, 1 supprimées, 0.0 Mo');
      expect("une phrase change : l'ancien clip est supprimé", mp3s(root).includes(h1 + '.mp3'), false);
      expect('une phrase change : le silence est gardé', table(root).includes(unlock), true);

      const other = { ...AZURE, voice: 'fr-FR-EloiseNeural', style: '' };
      fs.writeFileSync(path.join(root, 'voix', 'voix.json'), JSON.stringify(other));
      r = await run(root);
      expect('voix.json change : N appels (pas de silence)', r.calls.length, 2);
      expect('voix.json change : ligne de succès', last(r), '✅ voix : 2 phrases, 2 nouvelles, 2 supprimées, 0.0 Mo');
      expect(
        'voix.json change : seuls les nouveaux clips restent',
        mp3s(root),
        [clipHash(other, K2), clipHash(other, 'Presque! Regarde bien et réessaye.')].sort().map((h) => h + '.mp3'),
      );
      expect(
        'sans style, mstts:express-as est omis',
        r.calls.every((c) => !String(c.init.body).includes('express-as')),
        true,
      );
    }

    /* ----- XML : & < > " échappés ----- */
    {
      const root = makeRoot('speak(\'Sel & poivre : dis "oui".\');\n', AZURE);
      const r = await run(root);
      expect(
        'Azure : & et " échappés pour XML',
        String(r.calls[0].init.body).includes('>Sel &amp; poivre: dis &quot;oui&quot;.</prosody>'),
        true,
      );
    }

    /* ----- Google (table G) ----- */
    {
      const root = makeRoot(TWO, GOOGLE);
      const r = await run(root, { env: ENV_GOOGLE });
      expect('Google : code', r.code, 0);
      expect('Google : N + 1 appels', r.calls.length, 3);
      expect('Google : pas de pause entre les requêtes', r.sleeps, []);
      const call = r.calls.find((c) => String(c.init.body).includes('Presque'));
      expect('Google : adresse', call.url, 'https://texttospeech.googleapis.com/v1/text:synthesize');
      expect('Google : en-têtes', call.init.headers, {
        Authorization: 'Bearer jeton-secret-5678',
        'x-goog-user-project': 'lagon-projet',
        'Content-Type': 'application/json; charset=utf-8',
      });
      expect(
        'Google : corps JSON, la clé telle quelle',
        call.init.body,
        '{"input":{"text":"Presque! Regarde bien et réessaie."},"voice":{"languageCode":"fr-FR","name":"fr-FR-Chirp3-HD-Aoede"},"audioConfig":{"audioEncoding":"MP3","speakingRate":0.92}}',
      );
      expect('Google : silence en SSML', JSON.parse(r.calls[2].init.body).input, {
        ssml: '<speak><break time="200ms"/></speak>',
      });
      expect('Google : la table nomme le service', table(root).includes("VOICE_SERVICE = 'Google Cloud'"), true);
      expect(
        'Google : audioContent décodé dans le clip',
        fs.readFileSync(path.join(root, 'voix', mp3s(root)[0])).equals(MP3),
        true,
      );
      expect('le jeton ne paraît jamais dans la sortie', r.out.join('\n').includes('jeton-secret'), false);
    }

    /* ----- table C : états d'entrée ----- */
    {
      let root = makeRoot(TWO, null);
      let r = await run(root);
      expect(
        'voix.json absent : message',
        last(r),
        "⛔ voix : voix/voix.json absent. Lance d'abord bun run voix --essai, puis écris le choix d'Amrou dans voix/voix.json.",
      );
      expect('voix.json absent : code', r.code, 2);
      expect('voix.json absent : aucun appel', r.calls.length, 0);

      fs.writeFileSync(path.join(root, 'voix', 'voix.json'), '{ pas du json');
      r = await run(root);
      expect('voix.json illisible : message', last(r).startsWith('❌ voix : voix/voix.json invalide : '), true);
      expect('voix.json illisible : code', r.code, 1);

      fs.writeFileSync(path.join(root, 'voix', 'voix.json'), JSON.stringify({ ...AZURE, region: 'francecentral' }));
      r = await run(root);
      expect(
        'voix.json avec une clé en trop : message',
        last(r),
        '❌ voix : voix/voix.json invalide : clé en trop : region',
      );
      expect('voix.json avec une clé en trop : code', r.code, 1);

      for (const [name, bad] of [
        ['service inconnu', { ...AZURE, service: 'autre' }],
        ['voix hors forme', { ...AZURE, voice: 'en-US-Jenny' }],
        ['style hors forme', { ...AZURE, style: 'Cheerful 2' }],
        ['vitesse Azure hors forme', { ...AZURE, rate: 0.92 }],
        ['format Azure hors forme', { ...AZURE, format: 'MP3' }],
        ['vitesse Google hors forme', { ...GOOGLE, rate: 3 }],
        ['style Google non vide', { ...GOOGLE, style: 'cheerful' }],
        ['clé manquante', { service: 'azure', voice: 'fr-FR-DeniseNeural', style: '', rate: '-8%' }],
      ]) {
        fs.writeFileSync(path.join(root, 'voix', 'voix.json'), JSON.stringify(bad));
        r = await run(root);
        expect(`voix.json, ${name} : code 1 sans appel`, [r.code, r.calls.length], [1, 0]);
      }

      root = makeRoot(TWO, AZURE);
      r = await run(root, { env: { VOIX_AZURE_KEY: 'cle-secrete-1234' } });
      expect('service incomplet : message', last(r), '⛔ voix : azure incomplet, il manque VOIX_AZURE_REGION');
      expect('service incomplet : code', r.code, 2);
      r = await run(root, { env: ENV_GOOGLE });
      expect(
        'service choisi absent (seul l’autre est posé) : message',
        last(r),
        '⛔ voix : azure incomplet, il manque VOIX_AZURE_KEY, VOIX_AZURE_REGION',
      );
      root = makeRoot(TWO, GOOGLE);
      r = await run(root, { env: { VOIX_GOOGLE_PROJECT: 'lagon-projet', VOIX_GOOGLE_TOKEN: '' } });
      expect(
        'Google incomplet (variable vide) : message',
        last(r),
        '⛔ voix : google incomplet, il manque VOIX_GOOGLE_TOKEN',
      );

      root = makeRoot(TWO, AZURE);
      fs.writeFileSync(
        path.join(root, CLIPS_FILE),
        "export const VOICE_SERVICE = '';\nexport const VOICE_UNLOCK = String(1);\nexport const VOICE_CLIPS = {};\n",
      );
      r = await run(root);
      expect('table illisible : message', last(r), '❌ voix : js/shared/ui/voice-clips.js illisible : VOICE_UNLOCK');
      expect('table illisible : code 1 sans appel', [r.code, r.calls.length], [1, 0]);
    }

    /* ----- table C et ligne 7 : réponses du service ----- */
    {
      // une phrase refusée (400) : les autres continuent, la table n'est pas réécrite
      let root = makeRoot(TWO, AZURE);
      const refuse = (status) => (_url, init) => (String(init.body).includes('Presque') ? status : 200);
      let r = await run(root, { answer: refuse(400) });
      expect('400 : code', r.code, 1);
      expect('400 : message', r.out.slice(-2), [
        '❌ voix : 1 phrases refusées par le service',
        `js/exemple.js:1  ${P1}`,
      ]);
      expect('400 : le clip réussi reste', mp3s(root), [clipHash(AZURE, K2) + '.mp3']);
      expect("400 : la table n'est pas réécrite", table(root), '');
      // relancer finit le travail sans redemander le clip présent
      r = await run(root);
      expect('après un 400, relancer ne redemande que ce qui manque', [r.code, r.calls.length], [0, 2]);

      for (const [name, answer] of [
        ['404', refuse(404)],
        ['autre statut (504)', refuse(504)],
        [
          '200 vide',
          (_u, init) => (String(init.body).includes('Presque') ? { status: 200, body: Buffer.alloc(0) } : 200),
        ],
        [
          '200 qui n’est pas un MP3',
          (_u, init) =>
            String(init.body).includes('Presque') ? { status: 200, body: Buffer.from('<html>erreur</html>') } : 200,
        ],
        [
          '200 trop gros',
          (_u, init) =>
            String(init.body).includes('Presque')
              ? { status: 200, body: Buffer.concat([MP3, Buffer.alloc(307200)]) }
              : 200,
        ],
      ]) {
        root = makeRoot(TWO, AZURE);
        r = await run(root, { answer });
        expect(
          `${name} : code 1, table non réécrite, rien d'écrit pour la phrase`,
          [r.code, table(root), mp3s(root).length],
          [1, '', 1],
        );
      }
      root = makeRoot(TWO, AZURE);
      r = await run(root, { answer: () => ({ status: 200, body: Buffer.from([0xff, 0xfb, 0x90, 0x00]) }) });
      expect('200 avec un en-tête de trame MP3 (0xFF 0xFB) : accepté', r.code, 0);

      root = makeRoot(TWO, GOOGLE);
      r = await run(root, { env: ENV_GOOGLE, answer: (_u, _i, k) => (k === 1 ? { status: 200, json: {} } : 200) });
      expect('Google sans audioContent : code 1', r.code, 1);
      root = makeRoot(TWO, GOOGLE);
      r = await run(root, {
        env: ENV_GOOGLE,
        answer: (_u, _i, k) => (k === 1 ? { status: 200, json: 'illisible' } : 200),
      });
      expect('Google en JSON illisible : code 1', r.code, 1);

      // clé refusée : arrêt immédiat
      for (const status of [401, 403]) {
        root = makeRoot(TWO, AZURE);
        r = await run(root, { answer: () => status });
        expect(`${status} : message`, last(r), `⛔ voix : azure injoignable ou clé refusée (${status})`);
        expect(
          `${status} : code 2, un seul appel, table non réécrite`,
          [r.code, r.calls.length, table(root)],
          [2, 1, ''],
        );
      }

      // 3 tentatives au total, puis arrêt
      root = makeRoot(TWO, AZURE);
      r = await run(root, { answer: () => ({ status: 429, headers: { 'retry-after': '7' } }) });
      expect('429 trois fois : message', last(r), '⛔ voix : azure injoignable ou clé refusée (429)');
      expect('429 trois fois : code 2 après 3 tentatives', [r.code, r.calls.length], [2, 3]);
      expect('429 : attend Retry-After secondes entre les tentatives', r.sleeps, [7000, 7000]);

      root = makeRoot(TWO, AZURE);
      r = await run(root, { answer: () => new TypeError('fetch failed') });
      expect('réseau coupé : message', last(r), '⛔ voix : azure injoignable ou clé refusée (réseau : TypeError)');
      expect('réseau coupé : code 2, 10 s entre les tentatives', [r.code, r.sleeps], [2, [10000, 10000]]);

      // 429 puis succès
      root = makeRoot(TWO, AZURE);
      r = await run(root, {
        answer: (_u, _i, k) => (k === 1 ? { status: 429, headers: { 'retry-after': '120' } } : 200),
      });
      expect('429 puis succès : code 0', r.code, 0);
      expect('429 puis succès : Retry-After plafonné à 60 s, puis le rythme Azure', r.sleeps, [60000, 3400, 3400]);
      expect('429 puis succès : N + 1 appels et une reprise', r.calls.length, 4);
      root = makeRoot(TWO, GOOGLE);
      r = await run(root, { env: ENV_GOOGLE, answer: (_u, _i, k) => (k === 1 ? 503 : 200) });
      expect('503 sans Retry-After puis succès : 10 s', [r.code, r.sleeps], [0, [10000]]);

      // un refus (1) et une clé refusée (2) : 2 gagne
      root = makeRoot(TWO, AZURE);
      r = await run(root, { answer: (_u, _i, k) => (k === 1 ? 400 : 401) });
      expect('400 puis 401 : le code le plus grave gagne', r.code, 2);

      // oxfmt en échec : la table est restaurée, aucun clip supprimé
      root = makeRoot(TWO, AZURE);
      fs.writeFileSync(path.join(root, 'voix', 'aaaaaaaaaaaa.mp3'), MP3);
      r = await run(root, { oxfmt: path.join(tmp, 'oxfmt-absent') });
      expect('oxfmt en échec : message', last(r), "⛔ voix : oxfmt n'a pas pu formater js/shared/ui/voice-clips.js");
      expect(
        'oxfmt en échec : code 2, table restaurée, aucun clip supprimé',
        [r.code, table(root), mp3s(root).length],
        [2, '', 3],
      );
    }

    /* ----- essai d'écoute (lignes 1 et 2, tables E et V) ----- */
    {
      const root = makeRoot(TWO, null);
      const ecoute = path.join(essaiDir, 'ecoute.html');
      let r = await run(root, { env: {}, argv: ['--essai'] });
      expect(
        'essai sans service : message',
        last(r),
        "⛔ voix : aucun service complet dans l'environnement (VOIX_AZURE_KEY et VOIX_AZURE_REGION, ou VOIX_GOOGLE_TOKEN et VOIX_GOOGLE_PROJECT), rien n'est généré",
      );
      expect('essai sans service : code 2, aucun appel', [r.code, r.calls.length], [2, 0]);

      r = await run(root, { env: { ...ENV_AZURE, ...ENV_GOOGLE }, argv: ['--essai'] });
      const files = fs.readdirSync(essaiDir).sort();
      expect('essai complet : code', r.code, 0);
      expect('essai complet : 6 voix × 5 phrases', r.calls.length, 30);
      expect('essai complet : 30 fichiers et ecoute.html', files.length, 31);
      expect(
        'essai : le « : » du nom de voix devient « _ »',
        files.includes('azure-fr-FR-Vivienne_DragonHDLatestNeural-3.mp3'),
        true,
      );
      expect(
        'essai : nom de fichier <service>-<voix>-<n>.mp3',
        files.includes('google-fr-FR-Chirp3-HD-Leda-5.mp3'),
        true,
      );
      expect('essai : le chemin de ecoute.html est affiché', last(r), ecoute);
      const page = fs.readFileSync(ecoute, 'utf8');
      expect('ecoute.html : un <audio controls> par fichier', (page.match(/<audio controls /g) || []).length, 30);
      expect(
        'essai : toSpoken des phrases de la table E',
        r.calls.some((c) => String(c.init.body).includes('>Presque! Regarde bien et réessaie.<')),
        true,
      );
      expect(
        'essai : Denise en style cheerful, Eloise sans style',
        [
          r.calls
            .filter((c) => /DeniseNeural/.test(c.init.body))
            .every((c) => /express-as style="cheerful"/.test(c.init.body)),
          r.calls.filter((c) => /EloiseNeural/.test(c.init.body)).some((c) => /express-as/.test(c.init.body)),
        ],
        [true, false],
      );
      expect('essai : rien dans la racine', [mp3s(root).length, table(root)], [0, '']);

      fs.writeFileSync(path.join(essaiDir, 'reste.txt'), 'ancien essai');
      r = await run(root, { env: { ...ENV_AZURE, VOIX_GOOGLE_TOKEN: 'jeton-secret-5678' }, argv: ['--essai'] });
      expect(
        'essai, service à moitié posé : avertissement',
        r.out[0],
        '⚠️ voix : google ignoré, il manque VOIX_GOOGLE_PROJECT',
      );
      expect(
        "essai, service à moitié posé : l'autre continue, code 0",
        [r.code, r.calls.length, last(r)],
        [0, 15, ecoute],
      );
      expect("essai : le dossier d'essai est vidé au début", fs.existsSync(path.join(essaiDir, 'reste.txt')), false);

      r = await run(root, { env: { VOIX_AZURE_REGION: 'francecentral' }, argv: ['--essai'] });
      expect(
        'essai, seul service à moitié posé : avertissement puis blocage',
        [r.out[0], r.code],
        ['⚠️ voix : azure ignoré, il manque VOIX_AZURE_KEY', 2],
      );

      r = await run(root, {
        env: ENV_AZURE,
        argv: ['--essai'],
        answer: (_u, init) => (/EloiseNeural/.test(init.body) ? 400 : 200),
      });
      expect('essai, voix refusée : message', r.out.includes('⚠️ voix : voix inconnue : fr-FR-EloiseNeural'), true);
      expect(
        'essai, voix refusée : code 1, les autres voix continuent',
        [r.code, fs.readdirSync(essaiDir).filter((f) => f.endsWith('.mp3')).length],
        [1, 10],
      );
      expect('essai, voix refusée : ecoute.html est écrit', last(r), ecoute);

      r = await run(root, {
        env: { ...ENV_AZURE, ...ENV_GOOGLE },
        argv: ['--essai'],
        answer: (url) => (url.includes('microsoft') ? 403 : 200),
      });
      expect('essai, clé refusée : message', r.out.includes('⛔ voix : azure injoignable ou clé refusée (403)'), true);
      expect(
        "essai, clé refusée : ce service s'arrête, l'autre continue, code 2",
        [r.code, r.calls.length, fs.readdirSync(essaiDir).filter((f) => f.endsWith('.mp3')).length],
        [2, 16, 15],
      );
      expect(
        'essai : même rythme Azure et mêmes tentatives',
        (
          await run(root, { env: ENV_AZURE, argv: ['--essai'], answer: (_u, _i, k) => (k === 1 ? 500 : 200) })
        ).sleeps.slice(0, 3),
        [10000, 3400, 3400],
      );
    }

    /* ----- --root ----- */
    {
      const root = makeRoot(TWO, AZURE);
      const r = await run(path.join(tmp, 'ailleurs'), { argv: ['--root', root] });
      expect('--root : une autre racine', [r.code, mp3s(root).length], [0, 2]);
    }
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
  expect('le vrai dépôt est intact (racine temporaire seule touchée)', snapshot() === before, true);
  expect('la racine temporaire est supprimée', fs.existsSync(tmp), false);

  if (fails.length) {
    fails.forEach((f) => console.log(f));
    return 1;
  }
  console.log(`✅ voix : selftest, ${n} cas`);
  return 0;
}

module.exports = { selftest };
