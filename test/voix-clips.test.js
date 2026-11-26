// La garde des clips de la voix (track voix-naturelle, lignes 10 à 13 de la spec) :
// - sur le vrai dépôt : toute phrase fixe du code a son clip à jour, aucun clip
//   ni entrée en trop, le budget tenu. Tant que voix/voix.json n'existe pas
//   (pas encore de voix choisie), la table doit être vide et voix/ sans clip ;
// - sur une racine temporaire d'exemple (clips factices générés par un faux
//   service) : chaque écart fait bien échouer la garde, avec le bon message.
const fs = require('fs');
const os = require('os');
const path = require('path');
const { auditClips, clipHash, readConfig, CLIPS_FILE } = require('./tools/voix-phrases.js');
const { main } = require('./tools/voix.js');
const { MP3, fakeService } = require('./tools/voix-selftest.js');

const REPO = path.join(__dirname, '..');
let failed = 0,
  passed = 0;
function check(name, cond, detail) {
  if (cond) {
    passed++;
    console.log('✅ ' + name);
  } else {
    failed++;
    console.log('❌ ' + name + (detail !== undefined ? `\n     → ${detail}` : ''));
  }
}

const AZURE = {
  service: 'azure',
  voice: 'fr-FR-DeniseNeural',
  style: 'cheerful',
  rate: '-8%',
  format: 'audio-24khz-48kbitrate-mono-mp3',
};
const SRC = "speak('Bonjour le lagon.');\nconst perso = { say: 'Je suis Marina.' };\n";

(async () => {
  console.log('— Le dépôt');
  const real = await auditClips(REPO);
  const mode = readConfig(REPO).absent ? 'pas encore de voix choisie : table vide attendue' : 'clips attendus';
  check(`les clips de la voix sont à jour (${mode})`, real.length === 0, real.join('\n     → '));

  console.log("— La garde, prouvée sur une racine d'exemple");
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'voix-garde-'));
  try {
    const file = (f) => path.join(tmp, f);
    fs.mkdirSync(file('js/shared/ui'), { recursive: true });
    fs.mkdirSync(file('voix'));
    fs.writeFileSync(file('js/exemple.js'), SRC);
    fs.writeFileSync(file(CLIPS_FILE), '');
    fs.copyFileSync(path.join(REPO, '.oxfmtrc.json'), file('.oxfmtrc.json'));
    const audit = () => auditClips(tmp);
    const has = (problems, re) => problems.some((p) => re.test(p));
    // un écart posé, vérifié, puis défait
    async function broken(name, re, breakIt) {
      const undo = breakIt();
      const problems = await audit();
      check(name, has(problems, re), problems.join(' | ') || 'aucun problème signalé');
      undo();
    }
    const swap = (rel, content) => {
      const before = fs.readFileSync(file(rel));
      fs.writeFileSync(file(rel), content);
      return () => fs.writeFileSync(file(rel), before);
    };
    const add = (rel, content) => {
      fs.writeFileSync(file(rel), content);
      return () => fs.rmSync(file(rel));
    };

    // sans voix.json : seule la forme vide passe (ligne 10)
    check('sans voix.json, table vide et pas de clip : la garde passe', (await audit()).length === 0);
    await broken('sans voix.json, un clip dans voix/ : échec', /voix\.json n'existe pas/, () =>
      add('voix/0123456789ab.mp3', MP3),
    );
    await broken('sans voix.json, VOICE_CLIPS non vide : échec', /VOICE_CLIPS doit être vide/, () =>
      swap(CLIPS_FILE, "export const VOICE_CLIPS = { 'Bonjour.': '0123456789ab' };\n"),
    );
    await broken('sans voix.json, VOICE_UNLOCK non vide : échec', /VOICE_UNLOCK et VOICE_CLIPS vont ensemble/, () =>
      swap(CLIPS_FILE, "export const VOICE_UNLOCK = 'data:audio/mpeg;base64,AAAA';\n"),
    );

    // avec voix.json, avant la génération : chaque phrase manque (ligne 10)
    fs.writeFileSync(file('voix/voix.json'), JSON.stringify(AZURE));
    let problems = await audit();
    check(
      'une phrase fixe sans entrée : le fichier source, la ligne, la phrase et la commande',
      problems.includes(
        "js/exemple.js:1 « Bonjour le lagon. » n'a pas d'entrée dans VOICE_CLIPS : lance bun run voix",
      ) && problems.some((p) => p.startsWith('js/exemple.js:2 « Je suis Marina. »')),
      problems.join(' | '),
    );

    // la génération (faux service) met tout à jour
    const service = fakeService();
    const code = await main({
      root: tmp,
      env: { VOIX_AZURE_KEY: 'cle', VOIX_AZURE_REGION: 'francecentral' },
      fetch: service.fetch,
      sleep: async () => {},
      argv: [],
      essaiDir: file('essai'),
      log: () => {},
    });
    problems = await audit();
    check('après bun run voix, la garde passe', code === 0 && problems.length === 0, problems.join(' | '));
    const h1 = clipHash(AZURE, 'Bonjour le lagon.');

    await broken(
      "une phrase change d'un caractère : pas d'entrée, et l'ancienne est en trop",
      /« Bonjour le lagon ! » n'a pas d'entrée dans VOICE_CLIPS/,
      () => swap('js/exemple.js', SRC.replace('lagon.', 'lagon !')),
    );
    await broken(
      "voix.json change : l'entrée n'est plus l'empreinte actuelle",
      /son entrée n'est pas son empreinte actuelle : lance bun run voix/,
      () => swap('voix/voix.json', JSON.stringify({ ...AZURE, rate: '-5%' })),
    );
    await broken('un clip manque', new RegExp(`le clip voix/${h1}\\.mp3 manque : lance bun run voix`), () => {
      const before = fs.readFileSync(file(`voix/${h1}.mp3`));
      fs.rmSync(file(`voix/${h1}.mp3`));
      return () => fs.writeFileSync(file(`voix/${h1}.mp3`), before);
    });
    // ligne 11
    await broken('un clip orphelin', /voix\/0123456789ab\.mp3 : fichier orphelin/, () =>
      add('voix/0123456789ab.mp3', MP3),
    );
    await broken("une entrée qui n'est plus une phrase fixe du code", /entrée en trop « Je suis Marina\. »/, () =>
      swap('js/exemple.js', "speak('Bonjour le lagon.');\n"),
    );
    // ligne 12
    await broken('un clip de plus de 300 Ko', /plus de 300 Ko/, () =>
      swap(`voix/${h1}.mp3`, Buffer.concat([MP3, Buffer.alloc(307200)])),
    );
    await broken('plus de 8 Mo de clips au total', /plus de 8 Mo/, () => {
      const names = Array.from({ length: 27 }, (_, i) => `voix/${String(i).padStart(12, 'a')}.mp3`);
      names.forEach((n) => fs.writeFileSync(file(n), Buffer.alloc(307000)));
      return () => names.forEach((n) => fs.rmSync(file(n)));
    });
    await broken('un fichier qui n’est ni voix.json ni un clip', /voix\/notes\.txt : ni voix\.json ni un clip/, () =>
      add('voix/notes.txt', 'x'),
    );
    await broken('un nom de clip hors forme', /voix\/Bonjour\.mp3 : ni voix\.json ni un clip/, () =>
      add('voix/Bonjour.mp3', MP3),
    );
    const tableText = fs.readFileSync(file(CLIPS_FILE), 'utf8');
    const unlockValue = /VOICE_UNLOCK =\s*'([^']*)'/.exec(tableText)[1];
    await broken(
      'VOICE_UNLOCK vide alors que VOICE_CLIPS ne l’est pas',
      /VOICE_UNLOCK et VOICE_CLIPS vont ensemble/,
      () => swap(CLIPS_FILE, tableText.replace(unlockValue, '')),
    );
    await broken('VOICE_UNLOCK qui n’est pas un MP3 en data:', /ne commence pas par data:audio\/mpeg;base64,/, () =>
      swap(CLIPS_FILE, tableText.replace(unlockValue, 'https://ailleurs.test/silence.mp3')),
    );
    await broken('VOICE_UNLOCK de plus de 8 000 caractères', /dépasse 8000 caractères/, () =>
      swap(CLIPS_FILE, tableText.replace(unlockValue, 'data:audio/mpeg;base64,' + 'A'.repeat(8000))),
    );
    await broken('une table illisible', /voice-clips\.js illisible : VOICE_CLIPS/, () =>
      swap(CLIPS_FILE, 'export const VOICE_CLIPS = autre;\n'),
    );
    // ligne 13 : la forme exacte de voix/voix.json
    for (const [name, bad, re] of [
      [
        'une clé en trop (une région, une clé de service)',
        { ...AZURE, region: 'francecentral' },
        /clé en trop : region/,
      ],
      ['une clé manquante', { service: 'azure', voice: AZURE.voice, style: '', rate: '-8%' }, /clé manquante : format/],
      ['un service inconnu', { ...AZURE, service: 'autre' }, /service doit valoir/],
      ['une voix hors forme', { ...AZURE, voice: 'en-US-Jenny' }, /voice doit correspondre/],
      ['un style hors forme', { ...AZURE, style: 'Très Gai' }, /style doit valoir/],
      ['une vitesse Azure hors forme', { ...AZURE, rate: 0.92 }, /rate \(azure\)/],
      ['un format Azure hors forme', { ...AZURE, format: 'MP3' }, /format \(azure\)/],
      [
        'une vitesse Google hors forme',
        { service: 'google', voice: 'fr-FR-Chirp3-HD-Aoede', style: '', rate: 3, format: 'MP3' },
        /rate \(google\)/,
      ],
      [
        'un style Google non vide',
        { service: 'google', voice: 'fr-FR-Chirp3-HD-Aoede', style: 'cheerful', rate: 0.92, format: 'MP3' },
        /style \(google\)/,
      ],
      [
        'un format Google hors forme',
        { service: 'google', voice: 'fr-FR-Chirp3-HD-Aoede', style: '', rate: 0.92, format: 'OGG' },
        /format \(google\)/,
      ],
    ])
      await broken(`voix.json : ${name}`, new RegExp('voix/voix\\.json invalide : .*' + re.source), () =>
        swap('voix/voix.json', JSON.stringify(bad)),
      );
    await broken('voix.json : JSON illisible', /voix\/voix\.json invalide : JSON illisible/, () =>
      swap('voix/voix.json', '{'),
    );
    // les exemples de la spec passent tous
    const { configProblem } = require('./tools/voix-phrases.js');
    const examples = [
      AZURE,
      { ...AZURE, voice: 'fr-FR-EloiseNeural', style: '' },
      { ...AZURE, voice: 'fr-FR-Vivienne:DragonHDLatestNeural', style: '' },
      ...['Aoede', 'Leda', 'Kore'].map((v) => ({
        service: 'google',
        voice: 'fr-FR-Chirp3-HD-' + v,
        style: '',
        rate: 0.92,
        format: 'MP3',
      })),
    ];
    check(
      'voix.json : chaque exemple de la spec est accepté',
      examples.every((c) => configProblem(c) === ''),
      examples.map(configProblem).join(' | '),
    );
    problems = await audit();
    check('chaque écart défait, la garde repasse', problems.length === 0, problems.join(' | '));
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }

  console.log(
    failed
      ? `\n${failed} test(s) de la garde des clips en échec`
      : `\nTous les tests de la garde des clips passent (${passed})`,
  );
  process.exit(failed ? 1 : 0);
})();
