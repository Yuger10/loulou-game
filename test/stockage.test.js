// Un enregistrement raté ne passe plus inaperçu (anti-pattern 3 de
// docs/factory/AUDIT.md) : toutes les écritures passent par storageWrite et
// storageRemove (js/shared/lib/storage.js), qui savent si elles ont réussi.
// En cas d'échec (mémoire pleine, navigation privée) :
//   - un message doux, une seule fois par session, lu à voix haute ;
//   - une ligne dans l'espace parents (cause et conseil) ;
//   - une restauration de sauvegarde incomplète le dit.
const { JSDOM } = require('jsdom');
const page = require('./tools/page.js');

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

const spoken = [];
const dom = new JSDOM(page.buildHtml(), {
  runScripts: 'dangerously',
  pretendToBeVisual: true,
  url: 'http://localhost/?saison=aucune',
  beforeParse(win) {
    win.SpeechSynthesisUtterance = function (text) {
      this.text = text;
    };
    win.speechSynthesis = {
      speaking: false,
      cancel() {},
      getVoices: () => [],
      speak(u) {
        spoken.push(u.text);
      },
    };
  },
});
const w = dom.window,
  d = w.document;
const errs = [];
w.addEventListener('error', (e) => errs.push(e.message));
const ev = (code) => w.eval(code);

// le stockage du navigateur refuse d'écrire, comme quand la mémoire est pleine
const realSet = w.Storage.prototype.setItem;
function storageFull(on, onlyKey) {
  w.Storage.prototype.setItem = on
    ? function (k, v) {
        if (onlyKey && !onlyKey(k)) return realSet.call(this, k, v);
        throw new w.DOMException('Quota dépassé', 'QuotaExceededError');
      }
    : realSet;
}

(async () => {
  await wait(150);
  d.getElementById('btn-splash-play').click();
  d.getElementById('name-input').value = 'Lina';
  d.querySelector('.avatar-opt').click();
  d.getElementById('btn-start').click();
  await wait(300);
  ev('closeModal()');

  section('storageWrite et storageRemove');
  check('une écriture normale réussit', ev("storageWrite('lagon-magique-essai', '1')") === true);
  check('une suppression normale réussit', ev("storageRemove('lagon-magique-essai')") === true);
  storageFull(true);
  check('mémoire pleine : storageWrite renvoie false', ev("storageWrite('lagon-magique-essai', '1')") === false);
  const e1 = ev('storageErrors()');
  check("l'échec est noté avec sa cause", e1.length === 1 && e1[0].cause === 'mémoire pleine', JSON.stringify(e1));

  section('La partie ne peut pas être enregistrée');
  const toast = d.getElementById('toast');
  check("un message doux pour l'enfant", /pas pu être enregistrée/.test(toast.textContent), toast.textContent);
  check(
    "le message est lu à voix haute et parle d'un adulte",
    spoken.some((s) => /adulte/.test(s)),
    spoken.slice(-3).join(' | '),
  );
  toast.textContent = '';
  const nSpoken = spoken.length;
  ev('state.coins += 1; save()');
  check('la sauvegarde ratée est notée', ev('storageErrors()').length === 2);
  check(
    'une seule fois par session : pas de deuxième message',
    toast.textContent === '' && spoken.length === nSpoken,
    toast.textContent,
  );
  storageFull(false);

  section('Espace parents');
  const cards = ev("emit('parents:cards', { st: state, p: currentProfile() }).filter(Boolean).join('')");
  check(
    'une carte « Enregistrement » liste les échecs',
    /Enregistrement/.test(cards) && /mémoire pleine/.test(cards),
    cards.slice(0, 200),
  );
  check('avec un conseil (sauvegarde, place)', /sauvegarde/i.test(cards));

  section('Restauration incomplète');
  const backup = ev('buildBackup()');
  storageFull(true, (k) => k.startsWith('lagon-magique-save:'));
  const res = ev(`applyBackup(${JSON.stringify(backup)})`);
  storageFull(false);
  check("applyBackup dit combien de parties n'ont pas été écrites", res && res.failed >= 1, JSON.stringify(res));

  check('aucune erreur JS', errs.length === 0, errs.join(' | '));
  console.log(`\n${failed ? '❌' : '✅'} stockage : ${passed} vérifications réussies, ${failed} en échec`);
  process.exit(failed ? 1 : 0);
})();
