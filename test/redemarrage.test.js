// Ce qui est enregistré survit au redémarrage du jeu. Bug trouvé par les types
// de la partie (TypeScript strict sur js/entities, v66.7) : load() ne garde que
// les champs de DEFAULT_STATE, et trois champs posés par l'île n'y étaient pas :
//   decoPos      la place des décorations que l'enfant a fait glisser ;
//   helped       les personnages déjà aidés aujourd'hui (la bulle ❤️) ;
//   tipDragDeco  l'astuce « fais glisser tes décorations », déjà vue.
// Le test joue, enregistre, puis recharge le jeu dans une nouvelle page.
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

(async () => {
  console.log('— Une partie jouée puis enregistrée');
  const a = boot();
  await wait(200);
  a.d.getElementById('btn-splash-play').click();
  a.d.getElementById('name-input').value = 'Zoé';
  a.d.querySelector('.avatar-opt').click();
  a.d.getElementById('btn-start').click();
  await wait(300);
  a.ev(
    'closeModal(); state.decos = ["palmier"]; moveDeco("palmier", 300, 280); markHelped("licorne"); state.tipDragDeco = true; save()',
  );
  const before = a.ev('JSON.stringify({ decoPos: state.decoPos, helped: state.helped, tip: state.tipDragDeco })');
  const saved = {};
  for (let i = 0; i < a.w.localStorage.length; i++) {
    const k = a.w.localStorage.key(i);
    saved[k] = a.w.localStorage.getItem(k);
  }
  a.w.close();

  console.log('— Le jeu redémarre');
  const b = boot(saved);
  await wait(300);
  check(
    'une décoration déplacée garde sa place',
    b.ev(
      'state.decoPos && state.decoPos.palmier && state.decoPos.palmier.x === 300 && state.decoPos.palmier.y === 280',
    ),
    `${b.ev('JSON.stringify(state.decoPos)')} (avant : ${before})`,
  );
  check(
    "le personnage aidé aujourd'hui l'est encore",
    b.ev('helpedToday("licorne")'),
    b.ev('JSON.stringify(state.helped)'),
  );
  check("l'astuce déjà vue ne revient pas", b.ev('state.tipDragDeco') === true);
  check(
    'une vieille partie sans ces champs reçoit leurs valeurs par défaut',
    (() => {
      const old = JSON.parse(saved[Object.keys(saved).find((k) => k.startsWith('lagon-magique-save:'))]);
      delete old.decoPos;
      delete old.helped;
      delete old.tipDragDeco;
      const c = boot({
        ...saved,
        [Object.keys(saved).find((k) => k.startsWith('lagon-magique-save:'))]: JSON.stringify(old),
      });
      return c.ev('JSON.stringify([state.decoPos, state.helped, state.tipDragDeco])');
    })() === JSON.stringify([{}, null, false]),
  );
  check('aucune erreur JS', b.errs.length === 0, b.errs.join(' | '));
  console.log(`\n${failed ? '❌' : '✅'} redémarrage : ${passed} vérifications réussies, ${failed} en échec`);
  process.exit(failed ? 1 : 0);
})();
