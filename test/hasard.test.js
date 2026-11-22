// Le hasard du jeu est rejouable (anti-pattern 2 de docs/factory/AUDIT.md) :
// tout tirage passe par random() (js/shared/lib/random.js), et la page de
// test pose une graine quand TEST_SEED est défini (test/tools/page.js).
// Même graine : mêmes tirages. Graine différente : autres tirages. Un test
// qui remplace Math.random garde la main sur les tirages.
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
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function draws(seed) {
  process.env.TEST_SEED = String(seed);
  const dom = new JSDOM(page.buildHtml(), {
    runScripts: 'dangerously',
    pretendToBeVisual: true,
    url: 'http://localhost/?saison=aucune',
    beforeParse(win) {
      win.SpeechSynthesisUtterance = function () {};
      win.speechSynthesis = { speaking: false, cancel() {}, getVoices: () => [], speak() {} };
    },
  });
  await wait(100);
  const ev = (code) => dom.window.eval(code);
  const out = {
    random: ev('Array.from({ length: 5 }, () => random())'),
    ladybugs: ev('Array.from({ length: 8 }, () => { const r = ladybugsBuildRound(3); return r.mode + r.n; })'),
    shuffle: ev('shuffle([1, 2, 3, 4, 5, 6, 7, 8]).join()'),
  };
  ev('Math.random = () => 0');
  out.forced = ev('random()');
  dom.window.close();
  return JSON.stringify(out);
}

(async () => {
  console.log('— Hasard rejouable');
  const a = await draws(4242);
  const b = await draws(4242);
  const c = await draws(7);
  check('même graine : mêmes tirages (random, coccinelles, shuffle)', a === b, `${a}\n       ${b}`);
  check('graine différente : autres tirages', a !== c);
  check('un test qui remplace Math.random garde la main', JSON.parse(a).forced === 0);
  console.log(`\n${failed ? '❌' : '✅'} hasard : ${passed} vérifications réussies, ${failed} en échec`);
  process.exit(failed ? 1 : 0);
})();
