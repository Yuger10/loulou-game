// @shards 4
// Une voix partout (track voix-partout) : tout texte montré à l'enfant est lu
// à l'ouverture ou s'écoute d'un toucher, sans que l'écouter déclenche un bouton.
// - l'écoute au doigt (js/shared/ui/listen.js) : lignes 10 à 18 de la spec ;
// - ce qui est lu à l'ouverture de chaque écran : lignes 19 à 22 ;
// - la garde : chaque écran de test/voix-ecrans.js est ouvert, et tout texte
//   visible doit avoir une voix (lignes 23 à 27) ; un écran sans scénario, un
//   bouton `disabled` à l'ouverture ou un champ sans étiquette font échouer.
// VOIX_DEBUG=1 affiche les phrases dites par chaque scénario.
const fs = require('fs');
const path = require('path');
const acorn = require('acorn');
const walk = require('acorn-walk');
const { JSDOM } = require('jsdom');
const page = require('./tools/page.js');
const { inShard, shard } = require('./tools/shard.js');
const { SCENARIOS, COVERS, CHOICE_GAMES, startGame } = require('./voix-ecrans.js');

const DEBUG = !!process.env.VOIX_DEBUG;
let failed = 0,
  passed = 0;
function check(name, cond, detail) {
  if (cond) {
    passed++;
    if (DEBUG) console.log('✅ ' + name);
  } else {
    failed++;
    console.log('❌ ' + name + (detail ? `\n     → ${detail}` : ''));
  }
}
function section(name) {
  console.log('— ' + name);
}
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

const SPEED = 0.05; // le temps du jeu est accéléré ×20
const spoken = [];
let cancels = 0; // phrases coupées (speechSynthesis.cancel)
const dom = new JSDOM(page.buildHtml(), {
  runScripts: 'dangerously',
  pretendToBeVisual: true,
  url: 'http://localhost/?saison=aucune',
  beforeParse(win) {
    const st = win.setTimeout.bind(win),
      si = win.setInterval.bind(win);
    win.setTimeout = (fn, ms, ...a) => st(fn, Math.round((ms || 0) * SPEED), ...a);
    win.setInterval = (fn, ms, ...a) => si(fn, Math.max(1, Math.round((ms || 0) * SPEED)), ...a);
    win.SpeechSynthesisUtterance = function (text) {
      this.text = text;
    };
    // faux speechSynthesis qui note les phrases ; rien ne « parle » : chaque phrase part tout de suite
    win.speechSynthesis = {
      speaking: false,
      pending: false,
      current: null,
      manual: false, // pas à pas : une phrase « parle » jusqu'à finish()
      cancel() {
        cancels++;
        this.speaking = false;
        this.current = null;
      },
      getVoices: () => [],
      speak(u) {
        spoken.push(u.text);
        if (!this.manual) return;
        this.current = u;
        this.speaking = true;
      },
      finish() {
        const u = this.current;
        this.current = null;
        this.speaking = false;
        if (u && u.onend) u.onend();
      },
    };
  },
});
const w = dom.window,
  d = w.document;
const ev = (code) => w.eval(code);
const errs = [];
w.addEventListener('error', (e) => errs.push(e.message));
const $ = (sel) => d.querySelector(sel);
const said = () => spoken.join(' | ');
// un toucher, puis le temps que les handlers et le retour sonore passent
async function tap(el) {
  el.click();
  await wait(15);
}

/* ---------- La garde : ce qu'elle regarde sur un écran ---------- */

// comparaison de deux phrases : forme dite, sans casse, accents ni ponctuation
function norm(text) {
  return ev('toSpoken')(String(text))
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
const HAS_WORD = /[\p{L}\p{N}]/u;
function selectorOf(el) {
  const parts = [];
  for (let e = el; e && e.nodeType === 1 && parts.length < 4; e = e.parentElement) {
    parts.unshift(
      e.id ? `#${e.id}` : e.tagName.toLowerCase() + (e.classList.length ? '.' + [...e.classList].join('.') : ''),
    );
    if (e.id) break;
  }
  return parts.join(' > ');
}

// `display: none` calculé, comme getComputedStyle de jsdom (dernière règle qui
// s'applique, dans l'ordre des feuilles, puis le style de l'élément), mais en
// ne regardant que les règles qui posent `display` : getComputedStyle parcourt
// toutes les règles pour chaque élément, soit 4 s par écran. `guardSelfTests`
// vérifie que les deux disent la même chose.
let displayRules = null;
function isDisplayNone(el) {
  if (!displayRules) {
    displayRules = [];
    const add = (rule) => {
      if (rule.selectorText && rule.style && rule.style.display)
        displayRules.push({ sel: rule.selectorText, display: rule.style.display });
    };
    for (const sheet of d.styleSheets)
      for (const rule of sheet.cssRules) {
        if (rule.media) {
          if (Array.prototype.indexOf.call(rule.media, 'screen') !== -1)
            Array.prototype.forEach.call(rule.cssRules, add);
        } else add(rule);
      }
  }
  let display = '';
  for (const r of displayRules) {
    try {
      if (el.matches(r.sel)) display = r.display;
    } catch {
      // sélecteur que jsdom ne sait pas lire : il ne s'applique pas (comme dans jsdom)
    }
  }
  if (el.style && el.style.display) display = el.style.display;
  return display === 'none';
}

// Les textes visibles d'un écran (définition de la spec, sans mise en page) :
// pas sous style, script, title, template ni svg ; invisible si un ancêtre est
// `hidden`, `aria-hidden="true"` ou `display: none` ; #toast sans `.show` aussi.
function visibleTexts() {
  const out = [];
  const visit = (el) => {
    if (/^(style|script|title|template|svg)$/i.test(el.tagName)) return;
    if (el.hasAttribute('hidden') || el.getAttribute('aria-hidden') === 'true') return;
    if (el.id === 'toast' && !el.classList.contains('show')) return;
    if (isDisplayNone(el)) return;
    for (const c of el.childNodes) {
      if (c.nodeType === 1) visit(c);
      else if (c.nodeType === 3 && HAS_WORD.test(ev('toSpoken')(c.nodeValue))) out.push(c);
    }
  };
  visit(d.body);
  return out;
}

// Un écran juste après son ouverture : les textes sans voix (lignes 23 et 26),
// les boutons `disabled` et les champs sans étiquette (ligne 25).
function auditScreen(name, autoSaid) {
  const problems = [];
  const texts = visibleTexts();
  const autoNorm = autoSaid.map(norm);
  const listenText = ev('listenText');
  for (const node of texts) {
    const el = node.parentElement;
    const text = norm(node.nodeValue);
    if (!text) continue;
    if (el.closest('[data-voix="lire"], [data-voix="muet"]')) continue; // table X
    if (autoNorm.some((p) => p.includes(text))) continue; // lu à l'ouverture
    if (el.closest('button[disabled]')) continue; // signalé une fois par bouton, plus bas
    const phrase = listenText(el);
    const covered = !!phrase && (!!el.closest('[data-say]') || norm(phrase).includes(text));
    if (!covered) problems.push(`Texte sans voix dans « ${name} » : « ${node.nodeValue.trim()} » (${selectorOf(el)})`);
  }
  const shown = (el) => {
    for (let e = el; e && e.nodeType === 1; e = e.parentElement) {
      if (e.hasAttribute('hidden') || e.getAttribute('aria-hidden') === 'true') return false;
      if (isDisplayNone(e)) return false;
    }
    return true;
  };
  d.querySelectorAll('button[disabled]').forEach((b) => {
    if (shown(b) && HAS_WORD.test(ev('toSpoken')(b.textContent)))
      problems.push(
        `Bouton disabled à l'ouverture de « ${name} » : « ${b.textContent.trim()} » (${selectorOf(b)}). Un bouton inactif dit pourquoi : aria-disabled="true" et data-say-why.`,
      );
  });
  d.querySelectorAll('input, select, textarea').forEach((f) => {
    if (!shown(f) || f.type === 'hidden') return;
    const by = f.getAttribute('aria-labelledby');
    const labelled =
      (f.id && d.querySelector(`label[for="${f.id}"]`)) ||
      f.closest('label') ||
      (f.getAttribute('aria-label') || '').trim() ||
      (by && d.getElementById(by) && d.getElementById(by).textContent.trim());
    if (!labelled) problems.push(`Champ sans étiquette dans « ${name} » : ${selectorOf(f)}`);
  });
  return { texts: texts.length, problems };
}

/* ---------- La garde : l'inventaire du code (lignes 24 et 25b) ---------- */

function jsFiles() {
  const out = [];
  (function rec(dir) {
    for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, f.name);
      if (f.isDirectory()) rec(p);
      else if (f.name.endsWith('.js')) out.push(path.relative(page.root, p).split(path.sep).join('/'));
    }
  })(path.join(page.root, 'js'));
  return out.sort();
}
// le nom de la fonction nommée englobante la plus proche
function enclosingName(ancestors) {
  for (let i = ancestors.length - 1; i >= 0; i--) {
    const n = ancestors[i],
      p = ancestors[i - 1];
    if (n.type === 'FunctionDeclaration' && n.id) return n.id.name;
    if (n.type !== 'FunctionExpression' && n.type !== 'ArrowFunctionExpression') continue;
    if (n.id) return n.id.name;
    if (p && p.type === 'VariableDeclarator' && p.id.type === 'Identifier') return p.id.name;
    if (p && p.type === 'AssignmentExpression' && p.left.type === 'Identifier') return p.left.name;
    if (p && (p.type === 'Property' || p.type === 'MethodDefinition') && p.value === n)
      return p.key.name || String(p.key.value);
  }
  return null;
}
// Les clés des écrans d'un fichier (`<chemin>#<fonction>` pour chaque openModal,
// `view:<nom>` pour chaque registerView) et ses addEventListener('click'.
function inventory(file, src) {
  const keys = [],
    anonymous = [],
    clicks = [];
  const ast = acorn.parse(src, { ecmaVersion: 'latest', sourceType: 'module' });
  walk.ancestor(ast, {
    CallExpression(n, ancestors) {
      const c = n.callee;
      if (c.type === 'Identifier' && c.name === 'openModal' && file !== 'js/shared/ui/modal.js') {
        const fn = enclosingName(ancestors.slice(0, -1));
        if (fn) keys.push(`${file}#${fn}`);
        else anonymous.push(`${file} (caractère ${n.start})`);
      }
      if (c.type === 'Identifier' && c.name === 'registerView' && n.arguments[0] && n.arguments[0].type === 'Literal')
        keys.push(`view:${n.arguments[0].value}`);
      if (
        c.type === 'MemberExpression' &&
        c.property.name === 'addEventListener' &&
        n.arguments[0] &&
        n.arguments[0].type === 'Literal' &&
        n.arguments[0].value === 'click'
      ) {
        const o = c.object;
        const byId =
          o.type === 'CallExpression' &&
          o.callee.type === 'MemberExpression' &&
          o.callee.object.name === 'document' &&
          o.callee.property.name === 'getElementById' &&
          o.arguments[0] &&
          o.arguments[0].type === 'Literal';
        clicks.push(
          `${file}|${byId ? '#' + o.arguments[0].value : o.type === 'Identifier' && o.name === 'document' ? 'document' : src.slice(o.start, o.end)}`,
        );
      }
    },
  });
  return { keys: [...new Set(keys)], anonymous, clicks };
}
// table X : écrans d'adulte (l'espace parents, la sauvegarde) ; la porte reste obligatoire
const ADULT_FILES = ['js/features/parents/parents.js', 'js/features/backup/backup.js'];
const GATE_KEY = 'js/features/parents/parents.js#openParentGate';
function missingCovers(keys, covers) {
  return keys
    .filter((k) => k === GATE_KEY || !ADULT_FILES.some((f) => k.startsWith(f + '#')))
    .filter((k) => !covers.includes(k))
    .map((k) => `Écran sans passage dans la garde de la voix : ${k}. Ajoute un scénario dans test/voix-ecrans.js.`);
}
// la liste permise des addEventListener('click' : elle ne peut que diminuer
const CLICK_LISTENERS = [
  'js/app/init.js|#overlay',
  'js/features/companion-team/team.js|document',
  'js/shared/ui/listen.js|document',
];

/* ---------- Le déroulé ---------- */

const BASE_STATE =
  "party.active = false; currentProfile().age = 6; state.missions = 200; state.coins = 500; state.sound = true; state.voice = true; currentWorld = 'lagon'";
async function resetScreen() {
  ev(`${BASE_STATE}; closeModal(); switchView('carte')`);
  await wait(15);
  spoken.length = 0;
}

(async () => {
  await wait(150);
  // état de départ commun : l'accueil passé comme dans test/smoke.test.js
  ev('setSeasonPreview("aucune")');
  d.getElementById('btn-splash-play').click();
  d.getElementById('name-input').value = 'Lina';
  d.querySelector('.avatar-opt[data-av="🦄"]').click();
  d.getElementById('btn-start').click();
  await wait(120); // le premier chapitre de l'histoire s'ouvre, puis on le referme
  d.body.dispatchEvent(new w.Event('pointerdown', { bubbles: true })); // premier geste
  await resetScreen();

  if (shard.k === 0) {
    await listenTests();
    await openingTests();
    await choiceTests();
    staticTests();
    guardSelfTests();
  }

  section('La garde : chaque écran de test/voix-ecrans.js');
  let texts = 0,
    voiceless = 0;
  const mine = inShard(SCENARIOS);
  for (const sc of mine) {
    await resetScreen();
    await sc.open(ev, d, w);
    await wait(70);
    const autoSaid = spoken.slice();
    if (DEBUG) console.log(`   [${sc.name}] ${autoSaid.join(' | ') || '(rien)'}`);
    if (sc.auto) {
      const ok = autoSaid.length === sc.auto.length && sc.auto.every((re, i) => re.test(autoSaid[i]));
      check(
        `${sc.name} : les phrases dites à l'ouverture (ligne 19)`,
        ok,
        `attendu ${sc.auto.map(String).join(' puis ') || 'rien'} ; dit : ${autoSaid.join(' | ') || 'rien'}`,
      );
    } else checkGameAuto(sc, autoSaid);
    const res = auditScreen(sc.name, autoSaid);
    texts += res.texts;
    voiceless += res.problems.length;
    check(`${sc.name} : tout texte visible a une voix`, res.problems.length === 0, res.problems.join('\n     → '));
    if (sc.close) sc.close(ev, d, w);
  }
  await resetScreen();
  check('aucune erreur JS', errs.length === 0, errs.join(' | '));
  console.log(`voix : ${mine.length} scénarios, ${texts} textes, ${voiceless} sans voix`);
  clipsLine();
  console.log(`\n${failed ? '❌' : '✅'} voix-partout : ${passed} vérifications réussies, ${failed} en échec`);
  process.exit(failed ? 1 : 0);
})();

// si la track voix-naturelle a branché des clips enregistrés : leur couverture
function clipsLine() {
  if (ev('typeof VOICE_CLIPS') === 'undefined') return;
  const clips = ev('VOICE_CLIPS');
  const all = [...new Set(everSaid)];
  const n = all.filter((p) => clips[p]).length;
  console.log(
    `clips : ${n} phrases dites sur ${all.length} ont un clip (${all.length ? Math.round((n * 100) / all.length) : 0} %)`,
  );
}
const everSaid = [];
const pushSpoken = spoken.push.bind(spoken);
spoken.push = (...a) => {
  everSaid.push(...a);
  return pushSpoken(...a);
};

// Un mini-jeu : la consigne d'abord ; puis, pour la table J, les choix écrits
// dans l'ordre d'affichage (ligne 20) ; rhythm et simon disent leurs signaux de tour.
function checkGameAuto(sc, autoSaid) {
  const hint = $('.puzzle-hint [data-say]');
  const choices = [...d.querySelectorAll('#modal-body [data-voix="choix"][data-say]')].map((c) => norm(c.dataset.say));
  const expected = [norm(hint ? hint.dataset.say : ''), ...choices];
  const got = autoSaid.map(norm);
  const turnSignals = /^(ecoute|ecoute encore|regarde encore|a toi|lis le rythme puis joue le|on recommence)$/;
  const rest = got.slice(expected.length);
  const ok = expected.every((p, i) => got[i] === p) && rest.every((p) => turnSignals.test(p));
  check(
    `${sc.name} : la consigne${choices.length ? ' puis les choix' : ''}, et rien d'autre (ligne 19)`,
    ok,
    `attendu : ${expected.join(' | ')} ; dit : ${got.join(' | ') || 'rien'}`,
  );
}

/* ---------- Écouter au doigt (lignes 10 à 18) ---------- */
async function listenTests() {
  section('Écouter au doigt');
  let acted = [];
  w.voixActed = (x) => acted.push(x);
  const fixture = () => {
    ev(`openModal(\`
      <h2 id="vx-h">Un titre</h2>
      <div class="speech" id="vx-bulle">Bonjour <b id="vx-gras">toi</b> ✨ <span aria-hidden="true">déco</span></div>
      <div id="vx-vide"><i id="vx-seul">Un mot seul</i></div>
      <button id="vx-b1">Un bouton</button>
      <button id="vx-b2">Je parle</button>
      <div id="vx-act">Carte active</div>
      <button id="vx-off" aria-disabled="true" data-say-why="Il te faut 3 pièces.">Acheter</button>
      <button id="vx-off2" aria-disabled="true">Fermé</button>
      <button class="btn-speak" id="vx-ecoute" data-say="Écoute bien" aria-label="Écouter">🔈</button>
      <button id="vx-carte" data-say="Bouger">🤸 <span>Bouger un peu</span></button>
      <p data-voix="lire" id="vx-mot">chat</p>
      <button data-voix="lire" id="vx-rep">chien</button>
      <button data-voix="lire" id="vx-elim" aria-disabled="true">lapin</button>
      <label data-voix="muet" id="vx-muet">Combien font 6 × 7 ?</label>
    \`)`);
    const set = ev('setHandler');
    set($('#vx-b1'), 'click', () => w.voixActed('b1'));
    set($('#vx-b2'), 'click', () => {
      w.voixActed('b2');
      ev('speak')("C'est fait !");
    });
    set($('#vx-act'), 'click', () => w.voixActed('act'));
    set($('#vx-off'), 'click', () => w.voixActed('off'));
    set($('#vx-carte'), 'click', () => w.voixActed('carte'));
    set($('#vx-rep'), 'click', () => w.voixActed('rep'));
    ev('bindSpeakButtons()');
    acted = [];
    spoken.length = 0;
  };

  fixture();
  await tap($('#vx-gras'));
  check('ligne 10 : toucher un texte lit son bloc', said() === 'Bonjour toi', said());
  check('ligne 10 : le bloc lu porte voix-lu', $('#vx-bulle').classList.contains('voix-lu'));
  spoken.length = 0;
  await tap($('#vx-h'));
  await tap($('#vx-seul'));
  check('ligne 10 : un titre, un texte hors bloc', said() === 'Un titre | Un mot seul', said());
  spoken.length = 0;
  await tap($('#vx-vide'));
  await tap($('#modal-body'));
  check('un toucher dans le vide ne lit pas tout l’écran', said() === '', said());

  fixture();
  await tap($('#vx-b1'));
  check('ligne 11 : un bouton agit, puis dit son libellé', acted.join() === 'b1' && said() === 'Un bouton', said());
  spoken.length = 0;
  await tap($('#vx-b2'));
  check('ligne 11 : si l’action parle, seule sa phrase est dite', said() === "C'est fait!", said());
  spoken.length = 0;
  acted = [];
  check('ligne 11 : setHandler marque data-act un élément non actif', $('#vx-act').hasAttribute('data-act'));
  await tap($('#vx-act'));
  check(
    'ligne 11 : un élément data-act agit et dit son libellé',
    acted.join() === 'act' && said() === 'Carte active',
    said(),
  );

  fixture();
  await tap($('#vx-off'));
  check('ligne 12 : le toucher arrive aux handlers d’un bouton inactif', acted.join() === 'off', acted.join());
  check('ligne 12 : il dit pourquoi (data-say-why)', said() === 'Il te faut 3 pièces.', said());
  spoken.length = 0;
  await tap($('#vx-off2'));
  check('ligne 12 : sans raison écrite, son libellé', said() === 'Fermé', said());

  fixture();
  await tap($('#vx-ecoute'));
  check('ligne 13 : un 🔈 dit son data-say, sans autre action', said() === 'Écoute bien' && !acted.length, said());
  spoken.length = 0;
  await tap($('#vx-carte'));
  check(
    'ligne 14 : un élément qui agit garde son action, data-say est son libellé',
    acted.join() === 'carte' && said() === 'Bouger',
    `${acted.join()} / ${said()}`,
  );

  fixture();
  await tap($('#vx-rep'));
  check('ligne 15 : une réponse à lire agit sans être dite', acted.join() === 'rep' && said() === '', said());
  await tap($('#vx-mot'));
  check('ligne 15 : un mot à lire touché : « Essaie de le lire ! »', said() === 'Essaie de le lire!', said());
  spoken.length = 0;
  await tap($('#vx-elim'));
  check('un mot à lire inactif reste muet (ligne 15 sur ligne 12)', said() === '', said());
  await tap($('#vx-muet'));
  check('data-voix="muet" n’est jamais dit, même touché', said() === '', said());

  // la pause : ses cartes agissent encore après un bindSpeakButtons (ligne 14)
  ev(
    'currentProfile().pauseMin = 20; saveProfiles(); state.pauseExtra = null; state.restLog = {}; state.playTime = { [todayKey()]: 25 * 60 }; save(); maybeRest()',
  );
  ev('bindSpeakButtons()');
  const card = $('#rest-veil [data-rest-act]');
  await tap(card);
  check(
    'ligne 14 : une carte de la pause lance son activité',
    $('#rest-veil').dataset.stage !== 'choose',
    $('#rest-veil').dataset.stage,
  );
  ev('currentProfile().pauseMin = 0; saveProfiles(); state.playTime = {}; state.restLog = {}; save(); restWake()');

  // la porte des parents (ligne 16)
  await resetScreen();
  ev('openParentGate(() => {}, () => {}, () => {})');
  await wait(15);
  check('ligne 16 : la porte dit seulement « C’est pour les adultes. »', said() === "C'est pour les adultes.", said());
  spoken.length = 0;
  await tap($('#modal-body .game-head h2'));
  await tap($('#modal-body .hint-txt'));
  check(
    'ligne 16 : son titre et sa consigne se lisent au toucher',
    said() === 'Pour les adultes | Répondez à cette question pour continuer',
    said(),
  );
  spoken.length = 0;
  await tap($('#modal-body .gate-q'));
  await tap($('#gate-in'));
  check('ligne 16 : la question de calcul n’est jamais dite', said() === '', said());
  check('ligne 16 : elle porte data-voix="muet"', $('.gate-q').dataset.voix === 'muet');

  // voix coupée et silence (ligne 17)
  fixture();
  ev('state.sound = true; state.voice = false');
  await tap($('#vx-h'));
  await tap($('#vx-ecoute'));
  await tap($('#vx-off'));
  check(
    'ligne 17 : voix coupée, un texte, un 🔈 et un bouton inactif parlent',
    said() === 'Un titre | Écoute bien | Il te faut 3 pièces.',
    said(),
  );
  spoken.length = 0;
  await tap($('#vx-b1'));
  ev('speak')('Automatique');
  check(
    'ligne 17 : voix coupée, le libellé d’un bouton et les lectures automatiques se taisent',
    said() === '',
    said(),
  );
  ev('state.sound = false');
  await tap($('#vx-h'));
  await tap($('#vx-ecoute'));
  await tap($('#vx-off'));
  check('ligne 17 : en silence, rien n’est dit', said() === '', said());
  ev('state.sound = true; state.voice = true');

  // les messages qui passent (ligne 18)
  await resetScreen();
  ev('showToast')('✅ Bien joué');
  check(
    'ligne 18 : un message qui passe est dit',
    said() === 'Bien joué' && $('#toast').textContent === '✅ Bien joué',
    said(),
  );
  spoken.length = 0;
  ev('showToast')('⚠️ Affiché', 'Dit autrement');
  check(
    'ligne 18 : sa forme dite, si elle est donnée',
    said() === 'Dit autrement' && $('#toast').textContent === '⚠️ Affiché',
  );
  spoken.length = 0;
  ev('showToast')('Muet', '');
  check('ligne 18 : un message muet', said() === '' && $('#toast').textContent === 'Muet', said());
  startGame(ev, 'count', 1);
  await wait(15);
  spoken.length = 0;
  ev('lives = 2; loseLife(null)');
  await wait(15);
  check(
    'ligne 18 : « Dernier essai ! » se dit « Plus qu’un essai. Prends ton temps. »',
    $('#toast').textContent === '⚠️ Dernier essai !' && spoken.includes("Plus qu'un essai. Prends ton temps."),
    `${$('#toast').textContent} / ${said()}`,
  );
  // une seule voix par événement : vendre dit sa phrase, pas le message en plus
  await resetScreen();
  ev("state.inventory = {}; addItem(Object.keys(ITEMS)[0], 1); switchView('marche')");
  $('.tab-btn[data-tab="vendre"]').click();
  await wait(15);
  spoken.length = 0;
  await tap($('[data-sell]'));
  check(
    'ligne 18 : une seule voix par événement (vendre)',
    spoken.length === 1 && spoken[0].startsWith('Vendu'),
    said(),
  );

  // boutons inactifs : la raison de la table R, et le toucher ignoré
  await resetScreen();
  ev("state.coins = 0; switchView('marche')");
  $('.tab-btn[data-tab="acheter"]').click();
  await wait(15);
  spoken.length = 0;
  const buy = $('[data-buy]');
  const price = ev(`ITEMS[${JSON.stringify(buy.dataset.buy)}].price * 2`);
  await tap(buy);
  check(
    'table R : « Acheter » sans assez de pièces dit le prix, sans acheter',
    said() === `Il te faut ${price} pièces.` && ev('state.coins') === 0,
    said(),
  );
  check(
    'table R : il est aria-disabled, jamais disabled',
    buy.getAttribute('aria-disabled') === 'true' && !buy.disabled,
  );
}

/* ---------- Lire à l'ouverture (lignes 19 à 22), hors scénarios ---------- */
async function openingTests() {
  section("Lire à l'ouverture");
  // l'écran titre : rien de dit tout seul, le titre se lit au toucher avec l'accueil du jour
  await resetScreen();
  ev('showSplash()');
  await wait(15);
  const h1 = $('#splash h1');
  check('table O : écran titre, rien de dit tout seul', said() === '', said());
  check(
    'table O : joueur connu, le titre dit « Coucou Lina ! »',
    h1.dataset.say === 'Le Lagon Magique. Coucou Lina !',
    h1.dataset.say,
  );
  await tap(h1);
  check('toucher le titre le lit', said() === 'Le Lagon Magique. Coucou Lina!', said());
  ev('state.name = ""; showSplash()');
  check(
    'table O : joueur inconnu, « En route pour l’aventure ? »',
    h1.dataset.say === "Le Lagon Magique. En route pour l'aventure ?",
    h1.dataset.say,
  );
  ev('state.name = "Lina"; setSeasonPreview("noel"); showSplash()');
  check(
    'table O : jour de fête, l’accueil de la fête',
    h1.dataset.say === 'Le Lagon Magique. ' + ev('FETES.noel.greet("Lina")') && /Noël Lina/.test(h1.dataset.say),
    h1.dataset.say,
  );
  ev('setSeasonPreview("aucune"); state.skyIntroSeen = true; showSplash()');
  spoken.length = 0;
  $('#btn-splash-play').click();
  await wait(60);
  check(
    'après « Jouer », le bonjour n’est pas coupé par la carte',
    spoken[0] === "Coucou Lina! L'aventure t'attend." && !spoken.includes('La carte'),
    said(),
  );

  // l'île : l'arrivée puis l'intro, une fois par île et par session
  await resetScreen();
  ev("islandIntroSaid.clear(); switchView('ile')");
  ev("switchView('carte'); switchView('ile')");
  await wait(15);
  check(
    'table O : l’intro d’une île est dite une seule fois par session',
    spoken.filter((p) => p === "Touche un personnage pour l'aider").length === 1,
    said(),
  );
  await resetScreen();
  ev('stopSpeech()');
  w.speechSynthesis.speaking = true; // l'arrivée est en train d'être dite
  cancels = 0;
  ev("islandIntroSaid.clear(); setWorld('foret'); switchView('ile')");
  check(
    'table O : l’intro attend la fin de l’arrivée, sans la couper',
    said() === 'La Forêt! Les bois enchantés.' && cancels === 0,
    `${said()} (${cancels} coupure(s))`,
  );
  w.speechSynthesis.speaking = false;
  ev('stopSpeech()');

  // victoire, échec, indice : un 🔈 relit la phrase dite à l'ouverture (ligne 21)
  for (const [nom, code, box] of [
    ['victoire', 'onMissionWin()', '.win-box'],
    ['échec', 'onMissionFail()', '.fail-box'],
    ['indice', 'useHint()', '.hint-bubble'],
  ]) {
    await resetScreen();
    startGame(ev, 'count', 1);
    await wait(15);
    spoken.length = 0;
    ev(code);
    await wait(40);
    const phrase = spoken[spoken.length - 1];
    const btn = $(`#modal-body ${box} .btn-speak[data-say]`);
    check(`ligne 21 : ${nom}, un 🔈 dans la fenêtre`, !!btn && spoken.length === 1, said());
    spoken.length = 0;
    if (btn) await tap(btn);
    check(
      `ligne 21 : ${nom}, le 🔈 relit la phrase dite`,
      spoken.length === 1 && spoken[0] === phrase,
      `${said()} / ${phrase}`,
    );
  }

  // choix d'un jeu : chaque carte et « Surprise » ont leur 🔈 à droite (ligne 22)
  await resetScreen();
  ev('openGamePicker("sirene")');
  await wait(15);
  const cards = [...d.querySelectorAll('#modal-body .game-choice')];
  check(
    'ligne 22 : chaque carte est dans un div.game-choice-wrap, suivie de son 🔈',
    cards.length === 3 &&
      cards.every(
        (c) =>
          c.parentElement.matches('div.game-choice-wrap') &&
          c.parentElement.firstElementChild === c &&
          c.nextElementSibling &&
          c.nextElementSibling.matches('.btn-speak[data-say]') &&
          c.parentElement.children.length === 2,
      ),
  );
  spoken.length = 0;
  const first = cards[0];
  await tap(first.nextElementSibling);
  check(
    'ligne 22 : le 🔈 dit le nom du jeu sans le lancer',
    said() === norm2(first.querySelector('.nm').textContent) && !!$('#modal-body .game-picker'),
    said(),
  );
  spoken.length = 0;
  await tap($('#modal-body .game-choice.surprise').nextElementSibling);
  check('ligne 22 : le 🔈 de « Surprise »', said() === 'Surprise' && !!$('#modal-body .game-picker'), said());
}
const norm2 = (t) => ev('toSpoken')(t);

/* ---------- Les choix des mini-jeux (ligne 20) ---------- */
async function choiceTests() {
  section('Les choix écrits des mini-jeux (ligne 20, table J)');
  const synth = w.speechSynthesis;
  const choicesOf = () => [...d.querySelectorAll('#modal-body [data-voix="choix"][data-say]')];
  const lit = () => choicesOf().filter((c) => c.classList.contains('voix-lu'));
  // la forme dite attendue de chaque choix (table J)
  const FORMS = {
    clock: (c) => {
      const [h, , m] = c.textContent.trim().split(' ');
      return `${h} heure${h === '1' ? '' : 's'}${m ? ' ' + m : ''}`;
    },
    share: (c) => ({ '½': 'un demi', '⅓': 'un tiers', '¼': 'un quart' })[c.textContent.trim()],
    planets: (c) => (c.querySelector('.pl-name') || c).textContent.trim(),
  };
  // le texte affiché d'un choix, sans son dessin ni son symbole
  const shownLabel = (c) => {
    const k = c.cloneNode(true);
    k.querySelectorAll('svg, b, [aria-hidden="true"]').forEach((x) => x.remove());
    return k.textContent.trim();
  };
  for (const key of CHOICE_GAMES) {
    let seen = false;
    // les variantes d'un jeu changent avec le palier et le hasard : on cherche une question à choix écrits
    for (let n = 0; n < 24 && !seen; n++) {
      await resetScreen();
      ev('stopSpeech()');
      synth.manual = true;
      spoken.length = 0;
      startGame(ev, key, n % 2 ? 5 : 1);
      const choices = choicesOf();
      if (!choices.length) {
        synth.manual = false;
        continue;
      }
      seen = true;
      const tier = n % 2 ? 5 : 1;
      const hint = $('.puzzle-hint [data-say]').dataset.say;
      const says = choices.map((c) => c.dataset.say);
      const form = FORMS[key] || shownLabel;
      check(
        `${key} (palier ${tier}) : la forme dite de chaque choix`,
        choices.every((c) => norm(c.dataset.say) === norm(form(c))),
        says.join(' | '),
      );
      check(`${key} : la consigne d'abord, seule`, said() === ev('toSpoken')(hint) && lit().length === 0, said());
      let ordered = true;
      for (let i = 0; i < choices.length; i++) {
        synth.finish();
        ordered =
          ordered &&
          spoken.length === i + 2 &&
          spoken[i + 1] === ev('toSpoken')(says[i]) &&
          lit().length === 1 &&
          lit()[0] === choices[i];
      }
      check(`${key} : puis chaque choix, dans l'ordre, surligné pendant sa lecture`, ordered, said());
      synth.finish();
      check(`${key} : rien d'autre ensuite, plus de surlignage`, spoken.length === choices.length + 1 && !lit().length);
      if (key === 'clock')
        check(
          'clock : « 3 h 30 » se dit en heures',
          says.every((t) => /^\d+ heures?( \d+)?$/.test(t)),
          says.join(' | '),
        );

      // question suivante (après une erreur : le moteur oublie la consigne et redessine)
      spoken.length = 0;
      ev(`forgetSpokenHint(); gameRenderer(${JSON.stringify(key)})()`);
      for (let i = 0; i < 8; i++) synth.finish();
      const turn = /^(Écoute…|Écoute encore…|Regarde encore…|À toi!|Lis le rythme, puis joue-le!|On recommence…)$/;
      check(
        `${key} : à la question suivante, la consigne sans les choix`,
        spoken.filter((t) => !turn.test(t)).length === 1,
        said(),
      );

      // le 🔈 de la consigne dit la consigne puis les choix
      const now = choicesOf();
      spoken.length = 0;
      $('.puzzle-hint .btn-speak').click();
      for (let i = 0; i < now.length + 2; i++) synth.finish();
      const expected = [$('.puzzle-hint [data-say]').dataset.say, ...now.map((c) => c.dataset.say)].map((t) =>
        ev('toSpoken')(t),
      );
      check(`${key} : le 🔈 de la consigne relit la consigne puis les choix`, said() === expected.join(' | '), said());

      // une nouvelle mission relit les choix
      ev('closeModal()');
      spoken.length = 0;
      ev(`gameRenderer(${JSON.stringify(key)})()`);
      const again = choicesOf().length;
      for (let i = 0; i < again + 2; i++) synth.finish();
      check(
        `${key} : à la mission suivante, les choix sont relus`,
        spoken.filter((t) => !turn.test(t)).length === again + 1,
        said(),
      );
      synth.manual = false;
      ev('stopSpeech()');
    }
    check(`${key} : une question à choix écrits a été trouvée`, seen);
  }

  // voix coupée : le 🔈 de la consigne dit quand même la consigne et les choix (demande)
  await resetScreen();
  startGame(ev, 'clock', 1); // l'horloge a toujours des choix écrits
  ev('state.voice = false');
  spoken.length = 0;
  $('.puzzle-hint .btn-speak').click();
  check(
    'voix coupée : le 🔈 de la consigne dit la consigne et les choix',
    spoken.length === choicesOf().length + 1,
    said(),
  );
  ev('state.voice = true');

  // calendar : « lundi → jeudi » se dit « de lundi à jeudi »
  let week = null;
  for (let n = 0; n < 40 && !week; n++) {
    await resetScreen();
    startGame(ev, 'calendar', n % 2 ? 5 : 1);
    if ($('.weekday-btn')) week = spoken[0];
  }
  check(
    'calendar : la consigne dit « de lundi à jeudi », sans flèche',
    !!week && /, de \p{L}+ à \p{L}+$/u.test(week),
    week,
  );

  // rhythm et simon : les signaux de tour sont dits à chaque changement d'état
  await resetScreen();
  startGame(ev, 'simon', 1);
  await wait(250);
  check('simon : « À toi ! » est dit quand c’est le tour de l’enfant', spoken.includes('À toi!'), said());
  await resetScreen();
  startGame(ev, 'rhythm', 1);
  await wait(400);
  check('rhythm : « À toi ! » est dit quand c’est le tour de l’enfant', spoken.includes('À toi!'), said());
  await resetScreen();
}

/* ---------- L'inventaire du code ---------- */
function staticTests() {
  section('La garde : chaque écran a son scénario (ligne 24), liste des écouteurs de clic (ligne 25b)');
  const keys = [],
    anonymous = [],
    clicks = [];
  for (const f of jsFiles()) {
    const inv = inventory(f, fs.readFileSync(path.join(page.root, f), 'utf8'));
    keys.push(...inv.keys);
    anonymous.push(...inv.anonymous);
    clicks.push(...inv.clicks);
  }
  check(
    'aucun openModal dans une fonction anonyme',
    anonymous.length === 0,
    `nomme la fonction qui ouvre cet écran : ${anonymous.join(', ')}`,
  );
  keys.push(...ev('GAME_LIST').map((g) => `game:${g.key}`));
  const missing = missingCovers(keys, COVERS);
  check('chaque écran, vue et jeu a son passage dans la garde', missing.length === 0, missing.join('\n     → '));
  const stale = COVERS.filter((k) => !keys.includes(k));
  check('COVERS ne cite que des écrans qui existent', stale.length === 0, stale.join(', '));
  check(
    "la liste des addEventListener('click' est la liste permise",
    clicks.sort().join('\n') === CLICK_LISTENERS.join('\n'),
    `trouvé :\n${clicks.join('\n')}\nUn handler se pose par setHandler (js/shared/ui/handlers.js) : l'écoute au doigt le reconnaît.`,
  );
  const direct = jsFiles().filter(
    (f) =>
      f !== 'js/shared/ui/voice.js' && fs.readFileSync(path.join(page.root, f), 'utf8').includes('speechSynthesis'),
  );
  check('seul js/shared/ui/voice.js contient speechSynthesis', direct.length === 0, direct.join(', '));
}

/* ---------- La garde se trompe-t-elle ? (S3 : un écran cassé exprès) ---------- */
function guardSelfTests() {
  section('La garde échoue sur un écran cassé exprès (S3)');
  const sample = [...d.querySelectorAll('body > *, .view, .view > *, #modal *, nav *')]
    .filter((el) => !/^(script|style)$/i.test(el.tagName))
    .slice(0, 150);
  const differ = sample.filter((el) => isDisplayNone(el) !== (w.getComputedStyle(el).display === 'none'));
  check(
    'la visibilité de la garde dit comme getComputedStyle',
    sample.length > 40 && differ.length === 0,
    differ.map(selectorOf).join(', '),
  );
  ev('openModal(\'<h2>Un écran</h2><button disabled id="vx-casse">Acheter 3 pièces</button>\')');
  let res = auditScreen('cassé', []);
  check(
    'un bouton disabled avec du texte fait échouer la garde',
    res.problems.length === 1 &&
      res.problems[0].startsWith("Bouton disabled à l'ouverture de « cassé » : « Acheter 3 pièces »"),
    res.problems.join(' | '),
  );
  const b = $('#vx-casse');
  b.disabled = false;
  b.setAttribute('aria-disabled', 'true');
  res = auditScreen('réparé', []);
  check('la garde repasse une fois le bouton en aria-disabled', res.problems.length === 0, res.problems.join(' | '));
  ev('openModal(\'<h2>Un écran</h2><input id="vx-champ" placeholder="Prénom">\')');
  res = auditScreen('cassé', []);
  check(
    'un champ sans étiquette fait échouer la garde',
    res.problems.length === 1 && res.problems[0].startsWith('Champ sans étiquette'),
    res.problems.join(' | '),
  );
  $('#vx-champ').setAttribute('aria-label', 'Prénom');
  check('la garde repasse avec aria-label', auditScreen('réparé', []).problems.length === 0);
  ev(
    'openModal(\'<h2>Un écran</h2><p data-say=""><span data-voix="muet" id="vx-m">secret</span></p><p id="vx-vide2"></p>\')',
  );
  $('#vx-m').removeAttribute('data-voix');
  $('#vx-m').closest('p').setAttribute('data-voix', 'lire');
  check('un mot à lire est une exception de la garde (table X)', auditScreen('lire', []).problems.length === 0);
  ev('closeModal()');
  const inv = inventory(
    'js/features/truc/truc.js',
    "function openTruc() { openModal('<p>x</p>'); }\nregisterView('truc', () => {});",
  );
  const missing = missingCovers(inv.keys, COVERS);
  check(
    'un nouvel openModal sans scénario fait échouer la garde',
    missing[0] ===
      'Écran sans passage dans la garde de la voix : js/features/truc/truc.js#openTruc. Ajoute un scénario dans test/voix-ecrans.js.' &&
      missing.length === 2,
    missing.join(' | '),
  );
  check(
    'elle repasse quand le scénario existe',
    missingCovers(inv.keys, [...COVERS, 'js/features/truc/truc.js#openTruc', 'view:truc']).length === 0,
  );
  const anon = inventory(
    'js/x.js',
    "document.getElementById('b').addEventListener('click', () => { openModal('x'); });",
  );
  check(
    'un openModal dans une fonction anonyme et un addEventListener de clic sont repérés',
    anon.anonymous.length === 1 && anon.clicks.join() === 'js/x.js|#b',
    JSON.stringify(anon),
  );
  check(
    'espace parents et sauvegarde sont hors garde, sauf la porte',
    missingCovers(
      ['js/features/parents/parents.js#openParentSpace', 'js/features/backup/backup.js#openBackup', GATE_KEY],
      [],
    ).length === 1,
  );
}
