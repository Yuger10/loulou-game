/* ---------- Selftest de `bun run voix` : les états d'entrée, les réponses du service ----------
   (ligne 7 de la spec voix-naturelle, table C ; banc : test/tools/voix-banc.js) */
const fs = require('fs');
const path = require('path');
const { clipHash } = require('./voix-phrases.js');
const B = require('./voix-banc.js');
const { AZURE, CLIPS_FILE, ENV_GOOGLE, FAKE_KEY, GOOGLE, K2, MP3, P1, TWO, last, mp3s, table } = B;

// le faux service refuse la phrase « Presque… » par ce statut, et rend 200 aux autres
const refuse = (status) => (_url, init) => (String(init.body).includes('Presque') ? status : 200);

/* ----- table C : états d'entrée ----- */
async function casConfig(t) {
  const root = t.makeRoot(TWO, null);
  let r = await t.run(root);
  t.expect(
    'voix.json absent : message',
    last(r),
    "⛔ voix : voix/voix.json absent. Lance d'abord bun run voix --essai, puis écris le choix d'Amrou dans voix/voix.json.",
  );
  t.expect('voix.json absent : code', r.code, 2);
  t.expect('voix.json absent : aucun appel', r.calls.length, 0);

  fs.writeFileSync(path.join(root, 'voix', 'voix.json'), '{ pas du json');
  r = await t.run(root);
  t.expect('voix.json illisible : message', last(r).startsWith('❌ voix : voix/voix.json invalide : '), true);
  t.expect('voix.json illisible : code', r.code, 1);

  fs.writeFileSync(path.join(root, 'voix', 'voix.json'), JSON.stringify({ ...AZURE, region: 'francecentral' }));
  r = await t.run(root);
  t.expect(
    'voix.json avec une clé en trop : message',
    last(r),
    '❌ voix : voix/voix.json invalide : clé en trop : region',
  );
  t.expect('voix.json avec une clé en trop : code', r.code, 1);

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
    r = await t.run(root);
    t.expect(`voix.json, ${name} : code 1 sans appel`, [r.code, r.calls.length], [1, 0]);
  }
}

async function casServiceIncomplet(t) {
  let root, r;
  root = t.makeRoot(TWO, AZURE);
  r = await t.run(root, { env: { VOIX_AZURE_KEY: FAKE_KEY } });
  t.expect('service incomplet : message', last(r), '⛔ voix : azure incomplet, il manque VOIX_AZURE_REGION');
  t.expect('service incomplet : code', r.code, 2);
  r = await t.run(root, { env: ENV_GOOGLE });
  t.expect(
    'service choisi absent (seul l’autre est posé) : message',
    last(r),
    '⛔ voix : azure incomplet, il manque VOIX_AZURE_KEY, VOIX_AZURE_REGION',
  );
  root = t.makeRoot(TWO, GOOGLE);
  r = await t.run(root, { env: { VOIX_GOOGLE_PROJECT: 'lagon-projet', VOIX_GOOGLE_TOKEN: '' } });
  t.expect(
    'Google incomplet (variable vide) : message',
    last(r),
    '⛔ voix : google incomplet, il manque VOIX_GOOGLE_TOKEN',
  );
}

async function casTableIllisible(t) {
  const root = t.makeRoot(TWO, AZURE);
  fs.writeFileSync(
    path.join(root, CLIPS_FILE),
    "export const VOICE_SERVICE = '';\nexport const VOICE_UNLOCK = String(1);\nexport const VOICE_CLIPS = {};\n",
  );
  const r = await t.run(root);
  t.expect('table illisible : message', last(r), '❌ voix : js/shared/ui/voice-clips.js illisible : VOICE_UNLOCK');
  t.expect('table illisible : code 1 sans appel', [r.code, r.calls.length], [1, 0]);
}

/* ----- table C et ligne 7 : réponses du service ----- */
async function casRefus(t) {
  // une phrase refusée (400) : les autres continuent, la table n'est pas réécrite
  const root = t.makeRoot(TWO, AZURE);
  let r = await t.run(root, { answer: refuse(400) });
  t.expect('400 : code', r.code, 1);
  t.expect('400 : message', r.out.slice(-2), ['❌ voix : 1 phrases refusées par le service', `js/exemple.js:1  ${P1}`]);
  t.expect('400 : le clip réussi reste', mp3s(root), [clipHash(AZURE, K2) + '.mp3']);
  t.expect("400 : la table n'est pas réécrite", table(root), '');
  // relancer finit le travail sans redemander le clip présent
  r = await t.run(root);
  t.expect('après un 400, relancer ne redemande que ce qui manque', [r.code, r.calls.length], [0, 2]);
}

async function casReponsesInvalides(t) {
  let root, r;
  for (const [name, answer] of [
    ['404', refuse(404)],
    ['autre statut (504)', refuse(504)],
    ['200 vide', (_u, init) => (String(init.body).includes('Presque') ? { status: 200, body: Buffer.alloc(0) } : 200)],
    [
      '200 qui n’est pas un MP3',
      (_u, init) =>
        String(init.body).includes('Presque') ? { status: 200, body: Buffer.from('<html>erreur</html>') } : 200,
    ],
    [
      '200 trop gros',
      (_u, init) =>
        String(init.body).includes('Presque') ? { status: 200, body: Buffer.concat([MP3, Buffer.alloc(307200)]) } : 200,
    ],
  ]) {
    root = t.makeRoot(TWO, AZURE);
    r = await t.run(root, { answer });
    t.expect(
      `${name} : code 1, table non réécrite, rien d'écrit pour la phrase`,
      [r.code, table(root), mp3s(root).length],
      [1, '', 1],
    );
  }
  root = t.makeRoot(TWO, AZURE);
  r = await t.run(root, { answer: () => ({ status: 200, body: Buffer.from([0xff, 0xfb, 0x90, 0x00]) }) });
  t.expect('200 avec un en-tête de trame MP3 (0xFF 0xFB) : accepté', r.code, 0);

  root = t.makeRoot(TWO, GOOGLE);
  r = await t.run(root, { env: ENV_GOOGLE, answer: (_u, _i, k) => (k === 1 ? { status: 200, json: {} } : 200) });
  t.expect('Google sans audioContent : code 1', r.code, 1);
  root = t.makeRoot(TWO, GOOGLE);
  r = await t.run(root, {
    env: ENV_GOOGLE,
    answer: (_u, _i, k) => (k === 1 ? { status: 200, json: 'illisible' } : 200),
  });
  t.expect('Google en JSON illisible : code 1', r.code, 1);
}

async function casCleRefusee(t) {
  let root, r;
  // clé refusée : arrêt immédiat
  for (const status of [401, 403]) {
    root = t.makeRoot(TWO, AZURE);
    r = await t.run(root, { answer: () => status });
    t.expect(`${status} : message`, last(r), `⛔ voix : azure injoignable ou clé refusée (${status})`);
    t.expect(
      `${status} : code 2, un seul appel, table non réécrite`,
      [r.code, r.calls.length, table(root)],
      [2, 1, ''],
    );
  }

  // 3 tentatives au total, puis arrêt
  root = t.makeRoot(TWO, AZURE);
  r = await t.run(root, { answer: () => ({ status: 429, headers: { 'retry-after': '7' } }) });
  t.expect('429 trois fois : message', last(r), '⛔ voix : azure injoignable ou clé refusée (429)');
  t.expect('429 trois fois : code 2 après 3 tentatives', [r.code, r.calls.length], [2, 3]);
  t.expect('429 : attend Retry-After secondes entre les tentatives', r.sleeps, [7000, 7000]);

  root = t.makeRoot(TWO, AZURE);
  r = await t.run(root, { answer: () => new TypeError('fetch failed') });
  t.expect('réseau coupé : message', last(r), '⛔ voix : azure injoignable ou clé refusée (réseau : TypeError)');
  t.expect('réseau coupé : code 2, 10 s entre les tentatives', [r.code, r.sleeps], [2, [10000, 10000]]);
}

async function casReprises(t) {
  let root, r;
  // 429 puis succès
  root = t.makeRoot(TWO, AZURE);
  r = await t.run(root, {
    answer: (_u, _i, k) => (k === 1 ? { status: 429, headers: { 'retry-after': '120' } } : 200),
  });
  t.expect('429 puis succès : code 0', r.code, 0);
  t.expect('429 puis succès : Retry-After plafonné à 60 s, puis le rythme Azure', r.sleeps, [60000, 3400, 3400]);
  t.expect('429 puis succès : N + 1 appels et une reprise', r.calls.length, 4);
  root = t.makeRoot(TWO, GOOGLE);
  r = await t.run(root, { env: ENV_GOOGLE, answer: (_u, _i, k) => (k === 1 ? 503 : 200) });
  t.expect('503 sans Retry-After puis succès : 10 s', [r.code, r.sleeps], [0, [10000]]);

  // un refus (1) et une clé refusée (2) : 2 gagne
  root = t.makeRoot(TWO, AZURE);
  r = await t.run(root, { answer: (_u, _i, k) => (k === 1 ? 400 : 401) });
  t.expect('400 puis 401 : le code le plus grave gagne', r.code, 2);
}

async function casOxfmt(t) {
  // oxfmt en échec : la table est restaurée, aucun clip supprimé
  const root = t.makeRoot(TWO, AZURE);
  fs.writeFileSync(path.join(root, 'voix', 'aaaaaaaaaaaa.mp3'), MP3);
  const r = await t.run(root, { oxfmt: path.join(t.tmp, 'oxfmt-absent') });
  t.expect('oxfmt en échec : message', last(r), "⛔ voix : oxfmt n'a pas pu formater js/shared/ui/voice-clips.js");
  t.expect(
    'oxfmt en échec : code 2, table restaurée, aucun clip supprimé',
    [r.code, table(root), mp3s(root).length],
    [2, '', 3],
  );
}

module.exports = [
  casConfig,
  casServiceIncomplet,
  casTableIllisible,
  casRefus,
  casReponsesInvalides,
  casCleRefusee,
  casReprises,
  casOxfmt,
];
