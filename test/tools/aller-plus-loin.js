/* ---------- Outils des tests de la track aller-plus-loin ----------
   Les suites test/aller-plus-loin*.test.js partagent la page de test (jsdom),
   les textes de l'enfant et les raccourcis qui lisent ou règlent l'état du jeu.
   Une suite : `const p = await newPage()`, ses sections, puis `finish(nom)`. */
const { JSDOM } = require('jsdom');
const page = require('./page.js');

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
// les textes se comparent avec une espace ordinaire (spec, « Espaces avant ! et ? »)
const plain = (s) =>
  String(s || '')
    .replace(/ /g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
// une phrase telle que la voix la dit : sans emoji, sans espace avant la ponctuation
const voiced = (s) =>
  plain(s)
    .replace(/⭐/g, '')
    .replace(/\s+([?!,.:])/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
const json = (x) => JSON.stringify(x);
const stars = (n) => '⭐'.repeat(n);

/* ---- phase 2 : les textes de l'enfant (spec, points 17 à 30) ---- */
const TEXTS = {
  OFFER: "Ce jeu, tu le connais par cœur ! Tu veux essayer un défi étoile ? C'est un cran plus difficile.",
  REFUSED: "D'accord ! Le défi étoile t'attendra.",
  WON_FIRST: 'Défi étoile réussi ! Ce jeu gagne son étoile ⭐',
  WON_AGAIN: 'Défi étoile réussi ⭐',
  FAIL_MSG: "Le défi étoile était très difficile. C'était courageux d'essayer !",
  BACK_STAR: 'On revient à ton jeu habituel. Ton étoile reste à toi !',
  BACK_NONE: "On revient à ton jeu habituel. Bravo d'avoir essayé !",
};
const STAR_NONE = { streak: 0, open: false, miss: 0, won: 0, offered: null };
const COUNT_SKILL = '{ wins: 5, fails: 0, errors: 0, last: null, recent: [], lvl: 2, hints: 0 }';

const html = page.buildHtml();
function boot(saved) {
  const spoken = [];
  const dom = new JSDOM(html, {
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
      if (saved) for (const [k, v] of Object.entries(saved)) win.localStorage.setItem(k, v);
    },
  });
  const w = dom.window;
  const errs = [];
  w.addEventListener('error', (e) => errs.push(e.message));
  return { w, d: w.document, ev: (code) => w.eval(code), errs, spoken };
}

// les raccourcis d'une page : ils lisent et règlent l'état du jeu par son nom
function pageTools({ d, ev, t }) {
  return {
    // le profil courant, en solo, sur une île, sans défi en cours
    solo(age, grade, world) {
      ev(`closeModal(); endBonusChallenge(); party.active = false; race.active = false;
    currentProfile().age = ${json(age)}; currentProfile().grade = ${json(grade)};
    currentWorld = ${json(world || 'volcan')}; saveProfiles()`);
    },
    openParents(id) {
      ev(`parentUnlockedUntil = Date.now() + 60000; openParentSpace(${id ? json(id) : ''})`);
    },
    // la carte de l'espace parents dont le titre contient ce texte
    parentCard(title) {
      return [...d.querySelectorAll('#modal-body section.bk-card')].find((s) =>
        (s.querySelector('h3') || { textContent: '' }).textContent.includes(title),
      );
    },
    // l'état de départ de la phase 2 : 6 ans sans classe (plafond 2), en solo, sur une île
    // de palier 2, « Compter » déjà au niveau 2 : le palier joué est le plafond du jeu
    base() {
      t('closeModal(); endBonusChallenge(); party.active = false; party.players = []; race.active = false');
      t('endStarMission()');
      t(
        "currentProfile().age = 6; currentProfile().grade = ''; delete currentProfile().starChallenges; saveProfiles()",
      );
      t(
        `currentWorld = 'foret'; state.missions = 400; state.skills = { count: ${COUNT_SKILL} }; state.stars = {}; setLastGame(null); save()`,
      );
    },
  };
}
// les raccourcis du défi étoile
function starTools({ w, ev, t }) {
  return {
    // le suivi étoile d'un jeu, lu par l'API (une copie)
    starRec(k = 'count') {
      try {
        return JSON.parse(t(`JSON.stringify(starOf(${JSON.stringify(k)}))`));
      } catch {
        return {}; // starOf pas encore écrite : les vérifications échouent
      }
    },
    // le suivi étoile d'un jeu tel qu'il est enregistré dans la partie du joueur courant
    savedStar(k = 'count') {
      const saved = JSON.parse(w.localStorage.getItem(ev('currentSaveKey()')) || '{}');
      return (saved.stars || {})[k] || {};
    },
    // une mission enregistrée sans passer par l'écran du jeu
    mission(key, ok, errors) {
      t(
        `setLastGame(${JSON.stringify(key)}); resetMissionErrors(); for (let i = 0; i < ${errors}; i++) noteAnswerError(); recordMission(${ok})`,
      );
    },
    // une victoire au tirage fixé (jamais d'objet surprise), sans laisser Math.random figé
    winMission() {
      t(
        'window.__r0 = window.__r0 || Math.random; Math.random = () => 0.5; try { onMissionWin(); } finally { Math.random = window.__r0; }',
      );
    },
  };
}

const pages = [];
/**
 * Une page neuve du jeu, prête à jouer. Sans partie fournie, la joueuse Lina est
 * créée et toutes les îles sont ouvertes.
 * @param {{ saved?: Record<string, string> | null, tom?: boolean }} [opts] `saved` : le
 *   stockage de départ (une partie déjà enregistrée) ; `tom` : un deuxième joueur, Tom
 */
async function newPage({ saved = null, tom = false } = {}) {
  const p = boot(saved);
  pages.push(p);
  // une fonction pas encore écrite ne doit pas arrêter la suite : le point échoue, c'est tout
  p.t = (code) => {
    try {
      return p.ev(code);
    } catch (e) {
      return `⛔ ${e.message}`;
    }
  };
  Object.assign(p, pageTools(p), starTools(p));
  await wait(150);
  if (!saved) {
    p.d.getElementById('btn-splash-play').click();
    p.d.getElementById('name-input').value = 'Lina';
    p.d.querySelector('.avatar-opt').click();
    p.d.getElementById('btn-start').click();
  }
  await wait(700); // après le premier chapitre de l'histoire, ouvert 600 ms après la création du joueur
  if (!saved) p.ev('closeModal(); state.missions = 400; save()'); // toutes les îles sont ouvertes
  p.linaId = p.ev('profiles.current');
  if (tom) {
    p.ev(`addProfile('Tom', '👦', { age: 7 }); switchProfile(${json(p.linaId)}, true)`);
    p.tomId = p.ev('profiles.list[1].id');
  }
  p.today = p.ev('todayKey()');
  p.yesterday = p.ev('todayKey(new Date(Date.now() - 864e5))');
  return p;
}

// la fin d'une suite : aucune erreur JS dans ses pages, le bilan, le code de sortie
function finish(name) {
  for (const p of pages) check('aucune erreur JS', p.errs.length === 0, p.errs.join(' | '));
  console.log(`\n${failed ? '❌' : '✅'} ${name} : ${passed} vérifications réussies, ${failed} en échec`);
  process.exit(failed ? 1 : 0);
}

module.exports = { check, COUNT_SKILL, finish, json, newPage, plain, section, STAR_NONE, stars, TEXTS, voiced, wait };
