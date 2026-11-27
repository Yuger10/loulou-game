// L'Île du Grand Concert : le champ de sauvegarde `season3Done` (le xylophone
// d'or est gagné) : critères 41 et 42 de la spec. Migration depuis la version
// précédente, redémarrage du jeu dans une nouvelle page (même méthode que
// test/redemarrage.test.js), valeur importée qui n'est pas un booléen.
// Harnais : test/tools/concert.js.
const { JSDOM } = require('jsdom');
const page = require('./tools/page.js');
const t = require('./tools/concert.js');
const { d, ev, json, check, section, one, LEVEL } = t;

// une partie de la version précédente, au niveau 102, sans `season3Done`
function oldSave() {
  return {
    v: ev('SAVE_VERSION') - 1,
    name: 'Lou',
    coins: 12,
    missions: LEVEL(102),
    inventory: { coquillage: 3 },
    storySolved: { lagon: true, crayons: true },
    skyIntroSeen: true,
    expeditionIntroSeen: true,
    season2Done: true,
    skills: { rhythm: { wins: 7, fails: 1, errors: 2, last: null, recent: [], lvl: 2 } },
  };
}

function migration() {
  const old = oldSave();
  const m = ev(`migrate(${json(old)})`);
  const { v, season3Done, ...rest } = m;
  check('critère 41 : une partie de la version précédente reçoit `season3Done: false`, le reste est identique', () => [
    !('season3Done' in old),
    season3Done === false,
    v === ev('SAVE_VERSION') && v === old.v + 1,
    json(rest) === json({ ...old, v: undefined }),
  ]);
  check('critère 41 : une partie neuve n’a pas le xylophone d’or', () => [
    ev('freshState().season3Done') === false,
    ev('DEFAULT_STATE.season3Done') === false,
  ]);
  ev(`closeModal(); localStorage.setItem(currentSaveKey(), ${json(json(old))}); load(); refreshAll()`);
  check('critère 41 : chargée, elle garde ses pièces, ses missions, ses compétences et sa saison 2', () => [
    ev('state.season3Done') === false,
    ev('state.coins') === 12 && ev('level()') === 102,
    ev('state.skills.rhythm.wins') === 7,
    ev('state.season2Done') === true && ev('state.storySolved.crayons') === true,
    ev('season3Done()') === false,
  ]);
}

// le jeu rechargé dans une nouvelle page, avec le stockage de la première
async function redemarrage() {
  ev('state.season3Done = true; save()');
  const store = d.defaultView.localStorage;
  const saved = {};
  for (let i = 0; i < store.length; i++) saved[store.key(i)] = store.getItem(store.key(i));
  const dom = new JSDOM(page.buildHtml(), {
    runScripts: 'dangerously',
    pretendToBeVisual: true,
    url: 'http://localhost/?saison=aucune',
    beforeParse(win) {
      win.SpeechSynthesisUtterance = function () {};
      win.speechSynthesis = { speaking: false, cancel() {}, getVoices: () => [], speak() {} };
      for (const [k, v] of Object.entries(saved)) win.localStorage.setItem(k, v);
    },
  });
  const errs = [];
  dom.window.addEventListener('error', (e) => errs.push(e.message));
  await t.wait(300);
  check('critère 41 : après un redémarrage du jeu, le xylophone d’or est toujours gagné', () => [
    dom.window.eval('state.season3Done') === true,
    dom.window.eval('state.coins') === 12,
    errs.length === 0,
  ]);
  dom.window.close();
}

// critère 42 : une valeur importée qui n'est pas un booléen se lit comme `!!valeur`
function importee() {
  const cases = [
    ['"oui"', true],
    ['1', true],
    ['{}', true],
    ['0', false],
    ['null', false],
    ['""', false],
  ];
  for (const [raw, on] of cases) {
    ev(`closeModal(); state.missions = ${LEVEL(102)}; ${t.VISIT_ALL}
        state.storySolved = Object.fromEntries(state.visited.map((id) => [id, true])); state.season3Done = false; save();
        const s = JSON.parse(localStorage.getItem(currentSaveKey())); s.season3Done = ${raw};
        localStorage.setItem(currentSaveKey(), JSON.stringify(s)); load(); refreshAll(); setWorld("concert", true)`);
    const read = ev('season3Done()'); // avant le final, qui pose un vrai booléen
    ev('renderLiveIsland(document.getElementById("scene")); openStoryJournal()');
    const journal = [!!one('[data-finale="3"]') === on, !!one('[data-xylo]') === on];
    ev('closeModal(); openDialogue("stella")');
    const stella = !!one('#btn-xylo') === on;
    ev('closeModal(); storyWin("concert")');
    t.click(one('#story-continue'));
    // déjà gagné : pas de final ; sinon le final s'ouvre et pose un vrai booléen
    const finale = on ? !t.modalOpen() : !!one('.finale3') && ev('state.season3Done') === true;
    check(`critère 42 : \`season3Done\` importé à ${raw} se lit comme ${on}, partout, sans erreur`, () => [
      read === on,
      ...journal,
      stella,
      !!one('#scene g.ls-xylo-or') === on && !!one('#scene g.ls-drap') === !on,
      finale,
      t.errs.length === 0,
    ]);
  }
  ev('closeModal(); setWorld("lagon", true)');
}

(async () => {
  await t.start();
  section('Sauvegarde : migration et redémarrage (critère 41)');
  migration();
  await redemarrage();
  section('Sauvegarde importée (critère 42)');
  importee();
  await t.finish('l’Île du Grand Concert (la sauvegarde)');
})();
