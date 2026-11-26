/* ---------- Selftest de `bun run voix` : l'extraction, l'empreinte, la génération ----------
   (lignes 3 à 9 de la spec voix-naturelle, tables A, G et C ; banc : test/tools/voix-banc.js) */
const fs = require('fs');
const path = require('path');
const { extractPhrases, clipHash } = require('./voix-phrases.js');
const B = require('./voix-banc.js');
const { AZURE, CLIPS_FILE, ENV_GOOGLE, FAKE_KEY, FAKE_TOKEN, GOOGLE, K1, K2, MP3, TWO, last, mp3s, table } = B;

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

/* ----- extraction (R1 à R5, ligne 9) ----- */
async function casExtraction(t) {
  const root = t.makeRoot(RULES_SRC, AZURE);
  // la table générée n'est jamais une source de phrases
  fs.writeFileSync(path.join(root, CLIPS_FILE), "speak('Pas une phrase du jeu.');\n");
  const occ = await extractPhrases(root);
  const keys = [...new Set(occ.map((o) => o.key))].sort((a, b) => a.localeCompare(b, 'fr'));
  t.expect('extraction R1 à R5 : les clés', keys, RULES_KEYS);
  t.expect('extraction : toutes les occurrences (une clé peut en avoir deux)', occ.length, RULES_KEYS.length + 1);
  const twice = occ.filter((o) => o.key === 'Bonjour le lagon.');
  t.expect(
    'extraction : fichier et ligne de chaque occurrence',
    twice.map((o) => `${o.file}:${o.line}`).join(' '),
    'js/exemple.js:1 js/exemple.js:18',
  );
  t.expect('extraction : le texte du code est gardé', occ.find((o) => o.key === 'Super!').text, 'Super !');
}

/* ----- empreinte (D9) ----- */
function casEmpreinte(t) {
  t.expect('empreinte de la spec', clipHash(AZURE, K1), '3b8aa8075516');
  t.expect('empreinte stable pour un même texte', clipHash(AZURE, K1), clipHash({ ...AZURE }, K1));
  t.expect(
    'empreinte différente si voix.json change',
    clipHash({ ...AZURE, rate: '-5%' }, K1) !== clipHash(AZURE, K1),
    true,
  );
  t.expect('empreinte différente pour un autre service', clipHash(GOOGLE, K1) !== clipHash(AZURE, K1), true);
}

/* ----- génération : N + 1, 0, 1, N appels (lignes 3 à 6) ----- */
async function casPremierLancement(t) {
  const root = t.makeRoot(TWO, AZURE);
  const h1 = clipHash(AZURE, K1),
    h2 = clipHash(AZURE, K2);
  const r = await t.run(root);
  t.expect('premier lancement : code', r.code, 0);
  t.expect('premier lancement : N + 1 appels', r.calls.length, 3);
  t.expect('premier lancement : ligne de succès', last(r), '✅ voix : 2 phrases, 2 nouvelles, 0 supprimées, 0.0 Mo');
  t.expect(
    'premier lancement : les clips portent leur empreinte',
    mp3s(root),
    [h1, h2].sort().map((h) => h + '.mp3'),
  );
  t.expect('rythme Azure : 3,4 s entre deux requêtes (ligne 8)', r.sleeps, [3400, 3400]);
  const unlock = 'data:audio/mpeg;base64,' + MP3.toString('base64');
  t.expect(
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
  return { root, h1, unlock, r };
}

// la requête Azure (table A) et le texte envoyé (ligne 6b)
function casRequeteAzure(t, r) {
  const call = r.calls.find((c) => String(c.init.body).includes('Presque'));
  t.expect('Azure : adresse', call.url, 'https://francecentral.tts.speech.microsoft.com/cognitiveservices/v1');
  t.expect('Azure : méthode', call.init.method, 'POST');
  t.expect('Azure : en-têtes', call.init.headers, {
    'Ocp-Apim-Subscription-Key': FAKE_KEY,
    'Content-Type': 'application/ssml+xml',
    'X-Microsoft-OutputFormat': 'audio-24khz-48kbitrate-mono-mp3',
    'User-Agent': 'lagon-voix',
  });
  t.expect(
    'Azure : corps SSML, la clé toSpoken (sans espace avant « ! »)',
    call.init.body,
    '<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="https://www.w3.org/2001/mstts" xml:lang="fr-FR"><voice name="fr-FR-DeniseNeural"><mstts:express-as style="cheerful"><prosody rate="-8%">Presque! Regarde bien et réessaie.</prosody></mstts:express-as></voice></speak>',
  );
  t.expect(
    'Azure : apostrophe échappée pour XML',
    r.calls.some((c) => String(c.init.body).includes('pour l&apos;aider.')),
    true,
  );
  t.expect(
    'Azure : le silence de déverrouillage est demandé en dernier',
    String(r.calls[2].init.body).includes('<break time="200ms"/>'),
    true,
  );
  t.expect('la clé du service ne paraît jamais dans la sortie', r.out.join('\n').includes(FAKE_KEY), false);
}

// les relances : rien à faire, une phrase change, voix.json change
async function casRelances(t, { root, h1, unlock }) {
  let r;
  const bytes = table(root);
  r = await t.run(root);
  t.expect('tout à jour : 0 appel', r.calls.length, 0);
  t.expect('tout à jour : ligne de succès', last(r), '✅ voix : 2 phrases, 0 nouvelles, 0 supprimées, 0.0 Mo');
  t.expect("tout à jour : table identique à l'octet près", table(root) === bytes, true);
  t.expect('tout à jour : code', r.code, 0);

  fs.writeFileSync(path.join(root, 'js', 'exemple.js'), TWO.replace('réessaie.', 'réessaye.'));
  r = await t.run(root);
  t.expect('une phrase change : 1 appel (pas de silence)', r.calls.length, 1);
  t.expect('une phrase change : ligne de succès', last(r), '✅ voix : 2 phrases, 1 nouvelles, 1 supprimées, 0.0 Mo');
  t.expect("une phrase change : l'ancien clip est supprimé", mp3s(root).includes(h1 + '.mp3'), false);
  t.expect('une phrase change : le silence est gardé', table(root).includes(unlock), true);

  const other = { ...AZURE, voice: 'fr-FR-EloiseNeural', style: '' };
  fs.writeFileSync(path.join(root, 'voix', 'voix.json'), JSON.stringify(other));
  r = await t.run(root);
  t.expect('voix.json change : N appels (pas de silence)', r.calls.length, 2);
  t.expect('voix.json change : ligne de succès', last(r), '✅ voix : 2 phrases, 2 nouvelles, 2 supprimées, 0.0 Mo');
  t.expect(
    'voix.json change : seuls les nouveaux clips restent',
    mp3s(root),
    [clipHash(other, K2), clipHash(other, 'Presque! Regarde bien et réessaye.')].sort().map((h) => h + '.mp3'),
  );
  t.expect(
    'sans style, mstts:express-as est omis',
    r.calls.every((c) => !String(c.init.body).includes('express-as')),
    true,
  );
}

async function casGeneration(t) {
  const first = await casPremierLancement(t);
  casRequeteAzure(t, first.r);
  await casRelances(t, first);
}

/* ----- XML : & < > " échappés ----- */
async function casXml(t) {
  const root = t.makeRoot('speak(\'Sel & poivre : dis "oui".\');\n', AZURE);
  const r = await t.run(root);
  t.expect(
    'Azure : & et " échappés pour XML',
    String(r.calls[0].init.body).includes('>Sel &amp; poivre: dis &quot;oui&quot;.</prosody>'),
    true,
  );
}

/* ----- Google (table G) ----- */
async function casGoogle(t) {
  const root = t.makeRoot(TWO, GOOGLE);
  const r = await t.run(root, { env: ENV_GOOGLE });
  t.expect('Google : code', r.code, 0);
  t.expect('Google : N + 1 appels', r.calls.length, 3);
  t.expect('Google : pas de pause entre les requêtes', r.sleeps, []);
  const call = r.calls.find((c) => String(c.init.body).includes('Presque'));
  t.expect('Google : adresse', call.url, 'https://texttospeech.googleapis.com/v1/text:synthesize');
  t.expect('Google : en-têtes', call.init.headers, {
    Authorization: 'Bearer ' + FAKE_TOKEN,
    'x-goog-user-project': 'lagon-projet',
    'Content-Type': 'application/json; charset=utf-8',
  });
  t.expect(
    'Google : corps JSON, la clé telle quelle',
    call.init.body,
    '{"input":{"text":"Presque! Regarde bien et réessaie."},"voice":{"languageCode":"fr-FR","name":"fr-FR-Chirp3-HD-Aoede"},"audioConfig":{"audioEncoding":"MP3","speakingRate":0.92}}',
  );
  t.expect('Google : silence en SSML', JSON.parse(r.calls[2].init.body).input, {
    ssml: '<speak><break time="200ms"/></speak>',
  });
  t.expect('Google : la table nomme le service', table(root).includes("VOICE_SERVICE = 'Google Cloud'"), true);
  t.expect(
    'Google : audioContent décodé dans le clip',
    fs.readFileSync(path.join(root, 'voix', mp3s(root)[0])).equals(MP3),
    true,
  );
  t.expect('le jeton ne paraît jamais dans la sortie', r.out.join('\n').includes(FAKE_TOKEN), false);
}

/* ----- --root ----- */
async function casRoot(t) {
  const root = t.makeRoot(TWO, AZURE);
  const r = await t.run(path.join(t.tmp, 'ailleurs'), { argv: ['--root', root] });
  t.expect('--root : une autre racine', [r.code, mp3s(root).length], [0, 2]);
}

module.exports = [casExtraction, casEmpreinte, casGeneration, casXml, casGoogle, casRoot];
