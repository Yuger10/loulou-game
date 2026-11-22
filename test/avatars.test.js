// L'avatar d'un joueur vient d'une entrée non fiable quand il est importé
// (fichier ou code de transfert) : il s'insère ensuite dans le HTML partout
// (aperçu de restauration, barre du haut, liste des joueurs). Faille trouvée par
// TypeScript strict (v66.11) : seul le prénom passait par cleanName.
// Règle : à chaque porte (aperçu, chargement des joueurs, chargement de la
// partie), un avatar qui n'est pas un emoji ou un dessin connu redevient 👧.
// Vérifie aussi la date d'une sauvegarde importée (`at`).
const { JSDOM } = require('jsdom');
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
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

function boot(saved) {
  const dom = new JSDOM(html, {
    runScripts: 'dangerously',
    pretendToBeVisual: true,
    url: 'http://localhost/?saison=aucune',
    beforeParse(win) {
      win.SpeechSynthesisUtterance = function () {};
      win.speechSynthesis = { speaking: false, cancel() {}, getVoices: () => [], speak() {} };
      if (saved) for (const [k, v] of Object.entries(saved)) win.localStorage.setItem(k, v);
    },
  });
  const w = dom.window;
  const errs = [];
  w.addEventListener('error', (e) => errs.push(e.message));
  return { w, d: w.document, ev: (code) => w.eval(code), errs };
}

const EVIL = '<img id="pwn" src="x" onerror="window.pwned = 1">';
const backupOf = (avatar, at) => ({
  app: 'lagon-magique',
  at,
  data: {
    'lagon-magique-profiles': JSON.stringify({ list: [{ id: 'p1', name: 'Nina', avatar }], current: 'p1' }),
    'lagon-magique-save:p1': JSON.stringify({ name: 'Nina', avatar, missions: 3 }),
  },
});

(async () => {
  console.log("— L'aperçu d'une sauvegarde importée");
  {
    const { d, ev, errs } = boot();
    await wait(200);
    ev('openBackup()');
    d.getElementById('bk-paste').value = JSON.stringify(backupOf(EVIL, 'pas une date'));
    d.getElementById('bk-paste-go').click();
    await wait(100);
    const box = d.getElementById('bk-preview');
    check("l'aperçu s'affiche", /Nina/.test(box.textContent), box.innerHTML);
    check(
      "un avatar piégé n'entre pas dans la page",
      !d.getElementById('pwn') && !box.querySelector('img'),
      box.innerHTML,
    );
    check("il est remplacé par l'avatar par défaut", box.textContent.includes('👧'), box.textContent);
    check("une date invalide n'affiche pas « Invalid Date »", !/Invalid/.test(box.textContent), box.textContent);
    const r = ev(`parseBackupText(${JSON.stringify(JSON.stringify(backupOf(EVIL, 'pas une date')))})`);
    check(
      'la date invalide est écartée de la sauvegarde',
      r.ok && r.backup.at === undefined,
      JSON.stringify(r.backup && r.backup.at),
    );
    const r2 = ev(`parseBackupText(${JSON.stringify(JSON.stringify(backupOf('👧', '2026-11-20T10:00:00.000Z')))})`);
    check(
      'une date valide est gardée',
      r2.ok && r2.backup.at === '2026-11-20T10:00:00.000Z',
      JSON.stringify(r2.backup && r2.backup.at),
    );
    check('aucune erreur JS', errs.length === 0, errs.join(' | '));
  }

  console.log("— Une sauvegarde piégée déjà sur l'appareil (restaurée avant le correctif)");
  {
    const evil = backupOf(EVIL, '2026-11-20T10:00:00.000Z').data;
    const { w, d, ev, errs } = boot(evil);
    await wait(300);
    check(
      "le joueur chargé n'a plus l'avatar piégé",
      ev('profiles.list[0].avatar') === '👧',
      ev('profiles.list[0].avatar'),
    );
    ev('load()');
    check('la partie chargée non plus', ev('state.avatar') === '👧', ev('state.avatar'));
    check("rien n'a été injecté dans la page", !d.getElementById('pwn') && !w.pwned);
    check('aucune erreur JS', errs.length === 0, errs.join(' | '));
  }

  console.log("— Une ancienne partie unique, d'avant les profils");
  {
    const { d, ev, errs } = boot({ 'lagon-magique-save': JSON.stringify({ name: 'Nina', avatar: EVIL }) });
    await wait(300);
    check('le joueur migré a un avatar sûr', ev('profiles.list[0].avatar') === '👧', ev('profiles.list[0].avatar'));
    check("rien n'a été injecté dans la page", !d.getElementById('pwn'));
    check('aucune erreur JS', errs.length === 0, errs.join(' | '));
  }

  console.log('— Les avatars légitimes sont gardés');
  {
    const { ev } = boot();
    await wait(200);
    const all = ev('JSON.stringify(AVATARS)');
    const kept = ev(`JSON.stringify(${all}.filter((a) => fixAvatar(a) !== a))`);
    check('chaque avatar proposé reste tel quel', kept === '[]', kept);
    check('un ancien avatar non standard est corrigé comme avant', ev("fixAvatar('👧‍🦱')") === '👩‍🦱');
    check('un emoji hors de la liste (ancienne version) est gardé', ev("fixAvatar('🐼')") === '🐼');
    check('un dessin inconnu redevient 👧', ev("fixAvatar('art:inconnu')") === '👧');
    check(
      'du texte redevient 👧',
      ev("fixAvatar('Nina')") === '👧' && ev(`fixAvatar(${JSON.stringify(EVIL)})`) === '👧',
    );
    check("un avatar absent reste absent (l'affichage met 👧)", ev('fixAvatar(undefined)') === undefined);
  }

  console.log(`\n${failed ? '❌' : '✅'} avatars : ${passed} vérifications réussies, ${failed} en échec`);
  process.exit(failed ? 1 : 0);
})();
