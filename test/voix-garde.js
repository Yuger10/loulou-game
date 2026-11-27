/* ---------- La garde de la voix : ce qu'elle regarde ----------
   Lu par test/voix-partout.test.js (track voix-partout, lignes 23 à 26 de la
   spec) : les textes visibles d'un écran et leur voix (`auditScreen`), et
   l'inventaire du code (`inventory` : chaque `openModal(`, chaque vue, chaque
   addEventListener('click'). */
const fs = require('fs');
const path = require('path');
const acorn = require('acorn');
const walk = require('acorn-walk');
const page = require('./tools/page.js');
const { d, ev, norm } = require('./voix-outils.js');

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

// les règles CSS qui posent `display`, dans l'ordre des feuilles
function loadDisplayRules() {
  const rules = [];
  const add = (rule) => {
    if (rule.selectorText && rule.style && rule.style.display)
      rules.push({ sel: rule.selectorText, display: rule.style.display });
  };
  for (const sheet of d.styleSheets)
    for (const rule of sheet.cssRules) {
      if (!rule.media) add(rule);
      else if (Array.prototype.indexOf.call(rule.media, 'screen') !== -1)
        Array.prototype.forEach.call(rule.cssRules, add);
    }
  return rules;
}
// `display: none` calculé, comme getComputedStyle de jsdom (dernière règle qui
// s'applique, dans l'ordre des feuilles, puis le style de l'élément), mais en
// ne regardant que les règles qui posent `display` : getComputedStyle parcourt
// toutes les règles pour chaque élément, soit 4 s par écran. La suite vérifie
// que les deux disent la même chose (« la garde se trompe-t-elle ? »).
let displayRules = null;
function isDisplayNone(el) {
  if (!displayRules) displayRules = loadDisplayRules();
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

/* ---------- L'inventaire du code (lignes 24 et 25b) ---------- */

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
// un appel `nom(…)` ; avec `literal`, son premier argument doit être un littéral
function isCallTo(n, name, literal) {
  if (n.callee.type !== 'Identifier' || n.callee.name !== name) return false;
  return !literal || (!!n.arguments[0] && n.arguments[0].type === 'Literal');
}
// un appel `x.addEventListener('click', …)`
function isClickListener(n) {
  const c = n.callee;
  if (c.type !== 'MemberExpression' || c.property.name !== 'addEventListener') return false;
  return !!n.arguments[0] && n.arguments[0].type === 'Literal' && n.arguments[0].value === 'click';
}
// l'« objet » d'un écouteur de clic : `#<id>`, `document`, sinon son texte source
function clickTarget(o, src) {
  const byId =
    o.type === 'CallExpression' &&
    o.callee.type === 'MemberExpression' &&
    o.callee.object.name === 'document' &&
    o.callee.property.name === 'getElementById' &&
    o.arguments[0] &&
    o.arguments[0].type === 'Literal';
  if (byId) return '#' + o.arguments[0].value;
  return o.type === 'Identifier' && o.name === 'document' ? 'document' : src.slice(o.start, o.end);
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
      if (isCallTo(n, 'openModal') && file !== 'js/shared/ui/modal.js') {
        const fn = enclosingName(ancestors.slice(0, -1));
        if (fn) keys.push(`${file}#${fn}`);
        else anonymous.push(`${file} (caractère ${n.start})`);
      }
      if (isCallTo(n, 'registerView', true)) keys.push(`view:${n.arguments[0].value}`);
      if (isClickListener(n)) clicks.push(`${file}|${clickTarget(n.callee.object, src)}`);
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

module.exports = {
  selectorOf,
  isDisplayNone,
  auditScreen,
  jsFiles,
  inventory,
  missingCovers,
  GATE_KEY,
  CLICK_LISTENERS,
};
