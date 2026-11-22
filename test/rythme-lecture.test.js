// Le rythme magique, palier 5 (lecture) : une fois le rythme lu et joué par
// l'enfant, Boumbo le joue enfin en entier, et l'écran de victoire attend la fin.
// Bug révélé par TypeScript strict (v66.11) : la victoire arrivait à 900 ms,
// remplaçait le jeu et coupait la musique après la première note (sur 4 à 6).
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

(async () => {
  const dom = new JSDOM(html, {
    runScripts: 'dangerously',
    pretendToBeVisual: true,
    url: 'http://localhost/?saison=aucune',
    beforeParse(win) {
      win.SpeechSynthesisUtterance = function () {};
      win.speechSynthesis = { speaking: false, cancel() {}, getVoices: () => [], speak() {} };
    },
  });
  const w = dom.window,
    d = w.document,
    ev = (c) => w.eval(c);
  const errs = [];
  w.addEventListener('error', (e) => errs.push(e.message));
  await wait(100);
  d.getElementById('btn-splash-play').click();
  d.getElementById('name-input').value = 'Lou';
  d.querySelector('.avatar-opt').click();
  d.getElementById('btn-start').click();
  await wait(150);

  for (const round of [1, 2]) {
    console.log(`— Palier 5, partie ${round}`);
    // un chapitre d'histoire peut s'ouvrir au lancement : il couvrirait le jeu
    ev(`openStoryChapter = function () {}; closeModal(); state.missions = 200; currentWorld = "musique";
        state.skills = { rhythm: { wins: 0, fails: 0, errors: 0, last: null, recent: [], lvl: 5 } }; playGame("rhythm")`);
    await wait(100);
    const seq = [...d.querySelectorAll('#rh-score .rh-beat')].map((b) => b.dataset.k);
    const notes = seq.filter((k) => k !== 'silence').length;
    for (const s of ev('gameSolution.slice()')) d.querySelector(s).click();
    const lit = new Set();
    let win = false;
    for (let t = 0; t < 6000 && !win; t += 15) {
      d.querySelectorAll('#rh-score .rh-beat.lit').forEach((b) => lit.add(b.dataset.i));
      win = !!d.querySelector('.win-box');
      await wait(15);
    }
    const litNotes = [...lit].filter((i) => seq[Number(i)] !== 'silence').length;
    check(
      `toutes les notes du rythme sont jouées avant la victoire (${notes})`,
      litNotes === notes,
      `${litNotes} sur ${notes} : ${seq.join(' ')}`,
    );
    check("puis l'écran de victoire s'affiche", win);
  }
  check('aucune erreur JS', errs.length === 0, errs.join(' | '));
  console.log(`\n${failed ? '❌' : '✅'} rythme (lecture) : ${passed} vérifications réussies, ${failed} en échec`);
  process.exit(failed ? 1 : 0);
})();
