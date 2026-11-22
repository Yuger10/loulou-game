// Une partie lue sur l'appareil peut venir d'une sauvegarde importée (entrée
// non fiable). Points fragiles révélés par TypeScript strict (v66.11) :
//   - l'espace parents lisait la partie d'un autre joueur telle quelle (sans
//     migrate) : un suivi de jeu sans `recent` le faisait planter ;
//   - les compteurs des jeux et le journal des pauses s'inséraient tels quels
//     dans le HTML de l'espace parents ;
//   - une activité de pause inconnue faisait planter le rappel « Hier, … ».
// Règle : une partie passe par la même porte (readSave) qu'elle soit chargée
// pour jouer ou lue pour l'espace parents, et cette porte remet en forme les
// compteurs et le journal des pauses.
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

const pad = (n) => String(n).padStart(2, '0');
const dayKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const today = dayKey(new Date());
const yesterday = dayKey(new Date(Date.now() - 864e5));
const IMG = (id) => `<img id="${id}" src="x">`;

// une partie piégée : compteurs et journal des pauses en HTML, activité inconnue
const rigged = {
  v: 9,
  name: 'Nina',
  avatar: '👧',
  missions: 12,
  skills: {
    memory: { wins: IMG('pwn1'), fails: 0, errors: 0, hints: IMG('pwn2'), last: null, recent: IMG('pwn3') },
    count: { wins: 2, fails: 1, errors: 3, hints: 0, last: null, lvl: IMG('pwn4') },
  },
  restLog: {
    [today]: { at: IMG('pwn5'), activity: 'inconnue', skipped: false, attempts: IMG('pwn6') },
    [yesterday]: { at: '10:30', activity: 'inconnue', skipped: false, attempts: 0 },
  },
};
// une très vieille partie (v0) d'un autre joueur, avec un suivi sans `recent`
const old = { name: 'Léo', avatar: '👦', missions: 4, skills: { memory: { wins: 1, fails: 0, errors: 2 } } };
const profilesOf = (current) =>
  JSON.stringify({
    list: [
      { id: 'p1', name: 'Nina', avatar: '👧' },
      { id: 'p2', name: 'Léo', avatar: '👦' },
    ],
    current,
  });

(async () => {
  console.log('— Le joueur courant, avec une partie piégée');
  {
    const { w, d, ev, errs } = boot({
      'lagon-magique-profiles': profilesOf('p1'),
      'lagon-magique-save:p1': JSON.stringify(rigged),
      'lagon-magique-save:p2': JSON.stringify(old),
    });
    await wait(300);
    let recall = 'ok';
    try {
      ev('state.restRecall = null; restRecallYesterday()');
    } catch (e) {
      recall = e.message;
    }
    check("le rappel « Hier, … » d'une activité inconnue ne plante pas", recall === 'ok', recall);
    ev('parentUnlockedUntil = Date.now() + 60000; openParentSpace()');
    await wait(100);
    const ids = ['pwn1', 'pwn2', 'pwn3', 'pwn4', 'pwn5', 'pwn6'].filter((id) => d.getElementById(id));
    check("rien de la partie n'est injecté dans l'espace parents", ids.length === 0, ids.join(', '));
    check("l'espace parents montre les jeux", /Mémoire|Compter|réussie/.test(d.body.textContent));
    check(
      'le suivi est remis en forme (nombres, liste)',
      ev('typeof state.skills.memory.wins === "number" && Array.isArray(state.skills.memory.recent)'),
      ev('JSON.stringify(state.skills.memory)'),
    );
    check(
      'un niveau illisible est retiré',
      ev('state.skills.count.lvl') === undefined,
      String(ev('state.skills.count.lvl')),
    );
    check('une heure de pause illisible est écartée', ev(`state.restLog[${JSON.stringify(today)}].at`) === null);
    check('une heure de pause valide est gardée', ev(`state.restLog[${JSON.stringify(yesterday)}].at`) === '10:30');
    check('aucune erreur JS', errs.length === 0 && !w.pwned, errs.join(' | '));
  }

  console.log("— L'espace parents ouvert sur un autre joueur, à la partie très ancienne");
  {
    const { d, ev, errs } = boot({
      'lagon-magique-profiles': profilesOf('p1'),
      'lagon-magique-save:p1': JSON.stringify({ ...rigged, skills: {}, restLog: {} }),
      'lagon-magique-save:p2': JSON.stringify(old),
    });
    await wait(300);
    ev('parentUnlockedUntil = Date.now() + 60000; openParentSpace("p2")');
    await wait(100);
    check("l'espace parents de Léo s'ouvre", /Léo/.test(d.body.textContent));
    check('son suivi sans `recent` ne plante pas', errs.length === 0, errs.join(' | '));
    check('ses réussites sont affichées', /1 réussie/.test(d.body.textContent));
    check(
      "sa partie n'est pas modifiée par la lecture",
      JSON.parse(ev('localStorage.getItem("lagon-magique-save:p2")')).v === undefined,
    );
  }

  console.log('— Une partie normale est lue sans changement');
  {
    const { d, ev, errs } = boot();
    await wait(200);
    d.getElementById('btn-splash-play').click();
    d.getElementById('name-input').value = 'Zoé';
    d.querySelector('.avatar-opt').click();
    d.getElementById('btn-start').click();
    await wait(300);
    ev(`closeModal();
      state.skills.memory = { wins: 3, fails: 1, errors: 2, last: '2026-11-20', recent: [{ t: 2, e: 1, ok: true }], hints: 1, lvl: 2, atLvl: [{ ok: true, e: 0 }], support: true };
      state.restLog[${JSON.stringify(today)}] = { at: '09:05', activity: 'yoga', skipped: false, attempts: 2 };
      save()`);
    const before = ev('JSON.stringify([state.skills, state.restLog])');
    ev('load()');
    check(
      'le suivi et le journal des pauses sont identiques après rechargement',
      ev('JSON.stringify([state.skills, state.restLog])') === before,
      ev('JSON.stringify([state.skills, state.restLog])'),
    );
    ev('parentUnlockedUntil = Date.now() + 60000; openParentSpace()');
    await wait(100);
    check(
      "l'espace parents affiche la pause et les tentatives",
      /pause à 09:05/.test(d.body.textContent) && /2 tentatives/.test(d.body.textContent),
    );
    check('aucune erreur JS', errs.length === 0, errs.join(' | '));
  }

  console.log(`\n${failed ? '❌' : '✅'} parties importées : ${passed} vérifications réussies, ${failed} en échec`);
  process.exit(failed ? 1 : 0);
})();
