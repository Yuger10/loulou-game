// Les prénoms ne peuvent jamais contenir de HTML (anti-pattern 1 de
// docs/factory/AUDIT.md) : un prénom est nettoyé par cleanName()
// (js/shared/lib/text.js) à chacune de ses 4 portes d'entrée :
//   1. la saisie à la création d'un joueur ;
//   2. la saisie au renommage ;
//   3. le chargement depuis localStorage (profils et partie) ;
//   4. l'import d'une sauvegarde (fichier ou code, entrée non fiable).
// Plus un garde d'architecture : aucune affectation de `.name` à un joueur
// sans cleanName, hors exceptions listées.
const fs = require('fs');
const path = require('path');
const { JSDOM, VirtualConsole } = require('jsdom');
const page = require('./tools/page.js');
const html = page.buildHtml();

let failed = 0,
  passed = 0;
function check(name, cond, detail) {
  if (cond) {
    passed++;
    console.log('✅ ' + name);
  } else {
    failed++;
    console.log('❌ ' + name + (detail ? `\n     → ${detail}` : ''));
  }
}
function section(name) {
  console.log('— ' + name);
}
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const SAFE = (s) => typeof s === 'string' && !/[<>&"]/.test(s);

// Une fois en CI (run 45036098430), le jeu n'était pas chargé au premier test
// (« cleanName is not defined »), sans pouvoir le reproduire en local, même avec la
// graine. Les erreurs internes de jsdom (script qui plante au chargement) sont donc
// affichées : si ça se reproduit, le log donnera la cause.
function boot(seed) {
  const vc = new VirtualConsole();
  vc.on('jsdomError', (e) => console.error('jsdomError :', e && (e.stack || e.message)));
  const dom = new JSDOM(html, {
    virtualConsole: vc,
    runScripts: 'dangerously',
    pretendToBeVisual: true,
    url: 'http://localhost/?saison=aucune',
    beforeParse(win) {
      win.SpeechSynthesisUtterance = function (text) {
        this.text = text;
      };
      win.speechSynthesis = { speaking: false, cancel() {}, getVoices: () => [], speak() {} };
      if (seed) for (const [k, v] of Object.entries(seed)) win.localStorage.setItem(k, JSON.stringify(v));
    },
  });
  const w = dom.window;
  const errs = [];
  w.addEventListener('error', (e) => errs.push(e.message));
  return { w, d: w.document, ev: (code) => w.eval(code), errs };
}
const pwned = (d) => d.querySelectorAll('[id^="pwn"]').length;

(async () => {
  /* ---- cleanName ---- */
  section('cleanName');
  {
    const { ev } = boot();
    await wait(200);
    const c = (s) => ev(`cleanName(${JSON.stringify(s)})`);
    check('une balise disparaît, le prénom reste', c('<b>Zoé</b>') === 'Zoé', c('<b>Zoé</b>'));
    check(
      'une image piégée disparaît',
      c('<img src=x onerror=alert(1)>Léa') === 'Léa',
      c('<img src=x onerror=alert(1)>Léa'),
    );
    check('les caractères < > & " restants disparaissent', SAFE(c('Léo"> & <')), c('Léo"> & <'));
    check(
      'accents, tirets, apostrophes et espaces gardés',
      c('Anne-Sophie') === 'Anne-Sophie' && c("N'Dia") === "N'Dia",
    );
    check('12 caractères au plus, espaces autour retirés', c('   Maximilienne-Rose  ') === 'Maximilienne');
    check('sauts de ligne et tabulations retirés', c('Zo\né\t') === 'Zoé', JSON.stringify(c('Zo\né\t')));
    check('valeur absente : chaîne vide', c(null) === '' && ev('cleanName(undefined)') === '');
  }

  /* ---- 3. chargement depuis localStorage ---- */
  section('Porte 3 : une partie enregistrée avec des prénoms piégés');
  {
    const seed = {
      'lagon-magique-profiles': {
        list: [
          { id: 'p1', name: '<img id=pwn1 src=x>Zoé', avatar: '👧' },
          { id: 'p2', name: 'Léo"><b id=pwn2>', avatar: '👦' },
        ],
        current: 'p1',
      },
      'lagon-magique-save:p1': { name: '<i id=pwn3>Zoé</i>', avatar: '👧', missions: 3 },
    };
    const { d, ev, errs } = boot(seed);
    await wait(300);
    const names = ev('profiles.list.map(p => p.name)');
    check('les profils chargés sont nettoyés', names.every(SAFE), JSON.stringify(names));
    check('« Zoé » et « Léo » gardés', names[0] === 'Zoé' && names[1] === 'Léo', JSON.stringify(names));
    check('la partie chargée est nettoyée', ev('state.name') === 'Zoé', ev('state.name'));
    ev('openPlayers()');
    await wait(50);
    check('panneau des joueurs : aucun élément injecté', pwned(d) === 0);
    check('aucune erreur JS', errs.length === 0, errs.join(' | '));
  }

  /* ---- 4. import d'une sauvegarde ---- */
  section("Porte 4 : l'aperçu d'une sauvegarde importée");
  {
    const { ev } = boot();
    await wait(200);
    const backup = {
      app: 'lagon-magique',
      at: Date.now(),
      data: {
        'lagon-magique-profiles': JSON.stringify({
          list: [{ id: 'p9', name: '<img id=pwn5 src=x>Nina', avatar: '👧' }],
          current: 'p9',
        }),
        'lagon-magique-save:p9': JSON.stringify({ name: '<img id=pwn6>Nina', missions: 1 }),
      },
    };
    const r = ev(`parseBackupObject(${JSON.stringify(backup)})`);
    check('la sauvegarde est lisible', r.ok === true, JSON.stringify(r));
    check(
      "l'aperçu montre des prénoms nettoyés",
      r.ok && r.players.every((p) => SAFE(p.name)) && r.players[0].name === 'Nina',
      JSON.stringify(r.players),
    );
  }

  /* ---- 1. création et 2. renommage ---- */
  section('Portes 1 et 2 : saisie à la création et au renommage');
  {
    const { d, ev, errs } = boot();
    await wait(200);
    d.getElementById('btn-splash-play').click();
    d.getElementById('name-input').value = '<b id=pwn7>Lina</b>';
    d.querySelector('.avatar-opt').click();
    d.getElementById('btn-start').click();
    await wait(300);
    check('création : prénom nettoyé dans la partie', ev('state.name') === 'Lina', ev('state.name'));
    check(
      'création : prénom nettoyé dans le profil',
      ev('currentProfile().name') === 'Lina',
      ev('currentProfile().name'),
    );
    check('création : aucun élément injecté', pwned(d) === 0);

    ev('closeModal(); openPlayerSettings(profiles.current)');
    await wait(50);
    const input = d.getElementById('pe-name');
    input.value = '<img id=pwn8 src=x>Mila';
    input.dispatchEvent(new d.defaultView.Event('input', { bubbles: true }));
    const saveBtn = d.querySelector('#modal-body .form-primary');
    check('renommage : bouton Enregistrer trouvé', !!saveBtn);
    if (saveBtn) saveBtn.click();
    await wait(100);
    check(
      'renommage : prénom nettoyé dans le profil',
      ev('currentProfile().name') === 'Mila',
      ev('currentProfile().name'),
    );
    check('renommage : prénom nettoyé dans la partie', ev('state.name') === 'Mila', ev('state.name'));
    check('renommage : aucun élément injecté', pwned(d) === 0);
    check('aucune erreur JS', errs.length === 0, errs.join(' | '));
  }

  /* ---- 5. nouveau joueur depuis le panneau des joueurs ---- */
  section('Porte 5 : un nouveau joueur ajouté depuis le panneau');
  {
    const { d, ev, errs } = boot();
    await wait(200);
    d.getElementById('btn-splash-play').click();
    d.getElementById('name-input').value = 'Lina';
    d.querySelector('.avatar-opt').click();
    d.getElementById('btn-start').click();
    await wait(300);
    ev('closeModal(); openNewPlayer()');
    await wait(50);
    const input = d.getElementById('np-name');
    input.value = '<b id=pwn9>Rose</b>';
    input.dispatchEvent(new d.defaultView.Event('input', { bubbles: true }));
    const avatar = d.querySelector('#modal-body .avatar-opt');
    if (avatar) avatar.click();
    d.querySelector('#modal-body .form-primary').click();
    await wait(100);
    const names = ev('profiles.list.map(p => p.name)');
    check('nouveau joueur : prénom nettoyé', names.length === 2 && names[1] === 'Rose', JSON.stringify(names));
    check('nouveau joueur : aucun élément injecté', pwned(d) === 0);
    check('aucune erreur JS', errs.length === 0, errs.join(' | '));
  }

  /* ---- garde d'architecture ---- */
  section('Garde : aucun prénom de joueur affecté sans cleanName');
  {
    // `x.name = …` sur un joueur ou une partie : le côté droit passe par
    // cleanName, ou vient d'une valeur déjà nettoyée (exceptions ci-dessous).
    const ALLOWED = [
      // state.name a déjà été nettoyé à l'entrée
      ['js/entities/player/profiles.js', 'p.name = state.name;'],
      ['js/features/players/profiles-ui.js', 'state.name = p.name;'],
      // écran d'accueil : name vient de cleanName(input.value), juste au-dessus
      ['js/features/profile/profile.js', 'state.name = name;'],
      // migration d'une vieille partie : load() nettoie juste après
      ['js/entities/game-state/state.js', "saved.name = saved.name || '';"],
    ];
    const all = require('child_process')
      .execFileSync('git', ['ls-files', 'js'], { cwd: page.root, encoding: 'utf8' })
      .split('\n')
      .filter((f) => f.endsWith('.js'));
    const bad = [];
    for (const f of all) {
      const lines = fs.readFileSync(path.join(page.root, f), 'utf8').split('\n');
      lines.forEach((line, i) => {
        const m = /\b(p|state|saved|profile|prof|player)\.name\s*=(?!=)/.exec(line);
        if (!m || line.includes('cleanName(')) return;
        if (ALLOWED.some(([af, snip]) => af === f && line.includes(snip))) return;
        bad.push(`${f}:${i + 1}: ${line.trim()}`);
      });
    }
    check('chaque affectation de prénom passe par cleanName', bad.length === 0, bad.join('\n       '));
  }

  console.log(`\n${failed ? '❌' : '✅'} prénoms : ${passed} vérifications réussies, ${failed} en échec`);
  process.exit(failed ? 1 : 0);
})();
