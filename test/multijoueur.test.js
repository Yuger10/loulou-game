// Multijoueur (chacun son tour) : une erreur passe la main, même quand elle ne
// vient d'aucun bouton. Bug révélé par TypeScript strict (v66.11) : une paire
// ratée au jeu de mémoire, ou le temps écoulé, appelait loseLife(null), puis
// wrongFeedback(null) plantait (shakeEl sur null) avant de passer la main :
// le tour restait bloqué sur le même joueur.
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

function boot() {
  const save = (name) => JSON.stringify({ name, avatar: '👧', missions: 3 });
  const dom = new JSDOM(html, {
    runScripts: 'dangerously',
    pretendToBeVisual: true,
    url: 'http://localhost/?saison=aucune',
    beforeParse(win) {
      win.SpeechSynthesisUtterance = function () {};
      win.speechSynthesis = { speaking: false, cancel() {}, getVoices: () => [], speak() {} };
      win.localStorage.setItem(
        'lagon-magique-profiles',
        JSON.stringify({
          list: [
            { id: 'p1', name: 'Nina', avatar: '👧' },
            { id: 'p2', name: 'Léo', avatar: '👦' },
          ],
          current: 'p1',
        }),
      );
      win.localStorage.setItem('lagon-magique-save:p1', save('Nina'));
      win.localStorage.setItem('lagon-magique-save:p2', save('Léo'));
    },
  });
  const w = dom.window;
  const errs = [];
  w.addEventListener('error', (e) => errs.push(e.message));
  return { w, d: w.document, ev: (code) => w.eval(code), errs };
}

(async () => {
  console.log('— Jeu de mémoire : une paire ratée');
  {
    const { d, ev, errs } = boot();
    await wait(300);
    ev('startParty(["p1", "p2"]); closeModal(); currentWorld = "lagon"; renderMemory()');
    check('Nina commence', ev('profiles.current') === 'p1');
    // la solution liste les cartes paire par paire : la 1re et la 3e ne vont pas ensemble
    const sol = ev('gameSolution.slice()');
    d.querySelector(sol[0]).click();
    d.querySelector(sol[2]).click();
    await wait(1300);
    check('aucune erreur JS', errs.length === 0, errs.join(' | '));
    check('la main passe à Léo', ev('profiles.current') === 'p2', ev('profiles.current'));
    check("l'écran de changement de joueur s'affiche", d.getElementById('turn-overlay').classList.contains('show'));
  }

  console.log('— Temps écoulé');
  {
    const { d, ev, errs } = boot();
    await wait(300);
    ev('startParty(["p1", "p2"]); closeModal(); currentWorld = "lagon"; renderCount(); onResponseTimeout("count")');
    await wait(700);
    check('aucune erreur JS', errs.length === 0, errs.join(' | '));
    check('la main passe à Léo', ev('profiles.current') === 'p2', ev('profiles.current'));
    check("l'écran de changement de joueur s'affiche", d.getElementById('turn-overlay').classList.contains('show'));
  }

  console.log('— Une erreur sur un bouton passe toujours la main (comme avant)');
  {
    const { d, ev, errs } = boot();
    await wait(300);
    ev('startParty(["p1", "p2"]); closeModal(); currentWorld = "lagon"; renderCount()');
    const good = d.querySelectorAll('.count-row span').length;
    [...d.querySelectorAll('.num-btn')].find((b) => Number(b.dataset.v) !== good).click();
    await wait(700);
    check('aucune erreur JS', errs.length === 0, errs.join(' | '));
    check('la main passe à Léo', ev('profiles.current') === 'p2', ev('profiles.current'));
  }

  console.log(`\n${failed ? '❌' : '✅'} multijoueur : ${passed} vérifications réussies, ${failed} en échec`);
  process.exit(failed ? 1 : 0);
})();
