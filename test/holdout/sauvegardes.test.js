// Tests holdout (playbook cothon 5.3) : parcours critiques écrits ou validés
// par Amrou, que les agents ne modifient jamais (AGENTS.md, garde de la CI).
// Lancés par `bun run verify` et en CI, pas par `bun run check`.
//
// Une partie enregistrée ne se perd jamais : chaque sauvegarde figée de
// test/holdout/sauvegardes/ (une vraie partie d'une ancienne version) se
// charge avec la version actuelle du jeu, sans rien perdre. Une migration
// future qui casse une ancienne partie fait échouer ce test.
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');
const page = require('../tools/page.js');

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
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

const dir = path.join(__dirname, 'sauvegardes');
const fixtures = fs.readdirSync(dir).filter((f) => f.endsWith('.json'));

(async () => {
  check('au moins deux sauvegardes de référence', fixtures.length >= 2, fixtures.join(', '));
  for (const f of fixtures) {
    console.log(`— ${f}`);
    const data = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
    const saveKey = Object.keys(data).find((k) => k.startsWith('lagon-magique-save'));
    const before = data[saveKey];
    const dom = new JSDOM(html, {
      runScripts: 'dangerously',
      pretendToBeVisual: true,
      url: 'http://localhost/?saison=aucune',
      beforeParse(win) {
        win.SpeechSynthesisUtterance = function () {};
        win.speechSynthesis = { speaking: false, cancel() {}, getVoices: () => [], speak() {} };
        for (const [k, v] of Object.entries(data)) win.localStorage.setItem(k, JSON.stringify(v));
      },
    });
    const w = dom.window;
    const errs = [];
    w.addEventListener('error', (e) => errs.push(e.message));
    const ev = (code) => w.eval(code);
    await wait(300);
    check('le prénom est retrouvé', ev('state.name') === before.name, ev('state.name'));
    check('les pièces sont gardées', ev('state.coins') === before.coins, ev('state.coins'));
    check('les missions sont gardées', ev('state.missions') === before.missions, ev('state.missions'));
    check(
      "l'inventaire est gardé",
      same(ev('state.inventory'), before.inventory),
      JSON.stringify(ev('state.inventory')),
    );
    for (const key of ['storySolved', 'visited', 'skills', 'friends'].filter((k) => before[k] !== undefined))
      check(`« ${key} » est gardé`, same(ev(`state.${key}`), before[key]), JSON.stringify(ev(`state.${key}`)));
    check('la partie est migrée vers la version actuelle', ev('state.v') === ev('SAVE_VERSION'), `${ev('state.v')}`);
    check('un joueur existe', ev('profiles.list.length') >= 1);
    ev('save()');
    const saved = JSON.parse(w.localStorage.getItem(ev('currentSaveKey()')));
    check('réenregistrée, la partie garde tout', saved.coins === before.coins && saved.missions === before.missions);
    check('aucune erreur JS', errs.length === 0, errs.join(' | '));
    w.close();
  }
  console.log(`\n${failed ? '❌' : '✅'} holdout sauvegardes : ${passed} vérifications réussies, ${failed} en échec`);
  process.exit(failed ? 1 : 0);
})();
