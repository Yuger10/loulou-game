/* ---------- Selftest de `bun run voix --essai` : l'essai d'écoute ----------
   (lignes 1 et 2 de la spec voix-naturelle, tables E et V ; banc : test/tools/voix-banc.js) */
const fs = require('fs');
const path = require('path');
const { ENV_AZURE, ENV_GOOGLE, FAKE_TOKEN, TWO, last, mp3s, table } = require('./voix-banc.js');

/* ----- essai d'écoute (lignes 1 et 2, tables E et V) ----- */
async function casEssaiComplet(t) {
  const root = t.makeRoot(TWO, null);
  const ecoute = path.join(t.essaiDir, 'ecoute.html');
  let r = await t.run(root, { env: {}, argv: ['--essai'] });
  t.expect(
    'essai sans service : message',
    last(r),
    "⛔ voix : aucun service complet dans l'environnement (VOIX_AZURE_KEY et VOIX_AZURE_REGION, ou VOIX_GOOGLE_TOKEN et VOIX_GOOGLE_PROJECT), rien n'est généré",
  );
  t.expect('essai sans service : code 2, aucun appel', [r.code, r.calls.length], [2, 0]);

  r = await t.run(root, { env: { ...ENV_AZURE, ...ENV_GOOGLE }, argv: ['--essai'] });
  const files = fs.readdirSync(t.essaiDir).sort();
  t.expect('essai complet : code', r.code, 0);
  t.expect('essai complet : 6 voix × 5 phrases', r.calls.length, 30);
  t.expect('essai complet : 30 fichiers et ecoute.html', files.length, 31);
  t.expect(
    'essai : le « : » du nom de voix devient « _ »',
    files.includes('azure-fr-FR-Vivienne_DragonHDLatestNeural-3.mp3'),
    true,
  );
  t.expect(
    'essai : nom de fichier <service>-<voix>-<n>.mp3',
    files.includes('google-fr-FR-Chirp3-HD-Leda-5.mp3'),
    true,
  );
  t.expect('essai : le chemin de ecoute.html est affiché', last(r), ecoute);
  const page = fs.readFileSync(ecoute, 'utf8');
  t.expect('ecoute.html : un <audio controls> par fichier', (page.match(/<audio controls /g) || []).length, 30);
  t.expect(
    'essai : toSpoken des phrases de la table E',
    r.calls.some((c) => String(c.init.body).includes('>Presque! Regarde bien et réessaie.<')),
    true,
  );
  t.expect(
    'essai : Denise en style cheerful, Eloise sans style',
    [
      r.calls
        .filter((c) => /DeniseNeural/.test(c.init.body))
        .every((c) => /express-as style="cheerful"/.test(c.init.body)),
      r.calls.filter((c) => /EloiseNeural/.test(c.init.body)).some((c) => /express-as/.test(c.init.body)),
    ],
    [true, false],
  );
  t.expect('essai : rien dans la racine', [mp3s(root).length, table(root)], [0, '']);
}

async function casEssaiPartiel(t) {
  const root = t.makeRoot(TWO, null);
  const ecoute = path.join(t.essaiDir, 'ecoute.html');
  let r;
  fs.mkdirSync(t.essaiDir, { recursive: true });
  fs.writeFileSync(path.join(t.essaiDir, 'reste.txt'), 'ancien essai');
  r = await t.run(root, { env: { ...ENV_AZURE, VOIX_GOOGLE_TOKEN: FAKE_TOKEN }, argv: ['--essai'] });
  t.expect(
    'essai, service à moitié posé : avertissement',
    r.out[0],
    '⚠️ voix : google ignoré, il manque VOIX_GOOGLE_PROJECT',
  );
  t.expect(
    "essai, service à moitié posé : l'autre continue, code 0",
    [r.code, r.calls.length, last(r)],
    [0, 15, ecoute],
  );
  t.expect("essai : le dossier d'essai est vidé au début", fs.existsSync(path.join(t.essaiDir, 'reste.txt')), false);

  r = await t.run(root, { env: { VOIX_AZURE_REGION: 'francecentral' }, argv: ['--essai'] });
  t.expect(
    'essai, seul service à moitié posé : avertissement puis blocage',
    [r.out[0], r.code],
    ['⚠️ voix : azure ignoré, il manque VOIX_AZURE_KEY', 2],
  );
}

async function casEssaiRefus(t) {
  const root = t.makeRoot(TWO, null);
  const ecoute = path.join(t.essaiDir, 'ecoute.html');
  let r;
  r = await t.run(root, {
    env: ENV_AZURE,
    argv: ['--essai'],
    answer: (_u, init) => (/EloiseNeural/.test(init.body) ? 400 : 200),
  });
  t.expect('essai, voix refusée : message', r.out.includes('⚠️ voix : voix inconnue : fr-FR-EloiseNeural'), true);
  t.expect(
    'essai, voix refusée : code 1, les autres voix continuent',
    [r.code, fs.readdirSync(t.essaiDir).filter((f) => f.endsWith('.mp3')).length],
    [1, 10],
  );
  t.expect('essai, voix refusée : ecoute.html est écrit', last(r), ecoute);

  r = await t.run(root, {
    env: { ...ENV_AZURE, ...ENV_GOOGLE },
    argv: ['--essai'],
    answer: (url) => (url.includes('microsoft') ? 403 : 200),
  });
  t.expect('essai, clé refusée : message', r.out.includes('⛔ voix : azure injoignable ou clé refusée (403)'), true);
  t.expect(
    "essai, clé refusée : ce service s'arrête, l'autre continue, code 2",
    [r.code, r.calls.length, fs.readdirSync(t.essaiDir).filter((f) => f.endsWith('.mp3')).length],
    [2, 16, 15],
  );
  t.expect(
    'essai : même rythme Azure et mêmes tentatives',
    (
      await t.run(root, { env: ENV_AZURE, argv: ['--essai'], answer: (_u, _i, k) => (k === 1 ? 500 : 200) })
    ).sleeps.slice(0, 3),
    [10000, 3400, 3400],
  );
}

module.exports = [casEssaiComplet, casEssaiPartiel, casEssaiRefus];
