// Harnais des suites de l'Île des Squishy Dumplings (test/dumplings*.test.js,
// track monde-dumplings) : la page et les aides de test/tools/crayons.js
// (lancement d'un mini-jeu à un palier, voix), plus les tables de la spec
// (T1, T4) et les aides de lecture des deux jeux `tens` et `order`.
const t = require('./crayons.js');
const { d, ev, json } = t;

// T1 : `tensRound(dd)`, paliers 1 à 5
const T1 = {
  1: {
    modes: { build: 1 },
    min: 11,
    max: 19,
    choices: 3,
    zero: false,
    looseBig: 0,
    unitsFirst: 0,
    shuffled: 0,
    hundreds: false,
  },
  2: {
    modes: { read: 0.5, make: 0.5 },
    min: 20,
    max: 69,
    choices: 3,
    zero: false,
    looseBig: 0,
    unitsFirst: 0,
    shuffled: 0,
    hundreds: false,
  },
  3: {
    modes: { read: 0.35, make: 0.35, write: 0.3 },
    min: 20,
    max: 99,
    choices: 4,
    zero: true,
    looseBig: 0,
    unitsFirst: 0,
    shuffled: 0,
    hundreds: false,
  },
  4: {
    modes: { read: 0.35, make: 0.3, write: 0.35 },
    min: 20,
    max: 99,
    choices: 4,
    zero: true,
    looseBig: 0.5,
    unitsFirst: 0.5,
    shuffled: 0,
    hundreds: false,
  },
  5: {
    modes: { read: 0.35, make: 0.3, write: 0.35 },
    min: 100,
    max: 999,
    choices: 4,
    zero: true,
    looseBig: 0,
    unitsFirst: 0,
    shuffled: 0.3,
    hundreds: true,
  },
};
// T4 : `orderRound(dd)`, paliers 1 à 5
const T4 = {
  1: { kinds: 1, min: 1, max: 3, attrs: ['color'], colors: ['rose', 'vert', 'jaune'], palette: 3 },
  2: { kinds: 2, min: 3, max: 4, attrs: ['color'], colors: ['rose', 'vert', 'jaune', 'violet'], palette: 4 },
  3: { kinds: 2, min: 3, max: 5, attrs: ['color', 'shape'], colors: ['rose', 'vert', 'jaune'], palette: 6 },
  4: { kinds: 3, min: 4, max: 6, attrs: ['color', 'shape'], colors: ['rose', 'vert', 'jaune'], palette: 6 },
  5: {
    kinds: 3,
    min: 5,
    max: 6,
    attrs: ['color', 'shape', 'face'],
    colors: ['rose', 'vert', 'jaune', 'violet'],
    palette: 8,
  },
};

const all = (sel) => [...d.querySelectorAll(sel)];
const one = (sel) => d.querySelector(sel);
const question = () => ev('hint.q'); // la question affichée (TensQuestion ou OrderQuestion)
// lance le jeu `key` au palier p jusqu'à ce que la question convienne (au plus 80 tirages)
function startUntil(key, p, ok) {
  for (let k = 0; k < 80; k++) {
    t.startGame(key, p);
    if (ok(question())) return true;
  }
  return false;
}
const hintText = () => one('.puzzle-hint .hint-txt').textContent.trim();
const hintBtn = () => one('#modal-body .hint-btn');
// touche `k` fois l'élément `sel` (relu à chaque fois : la scène peut être redessinée)
function tap(sel, k = 1) {
  for (let i = 0; i < k; i++) one(sel).click();
}
const hidden = (sel) => !!one(sel) && one(sel).hasAttribute('hidden');
const digits = (n) => ({ c: Math.floor(n / 100), d: Math.floor((n % 100) / 10), u: n % 10 });
// le total montré par la scène de `tens` (contrat C1)
const stageTotal = () => 100 * all('#tens-stage .tens-pile').length + all('#tens-stage .tens-dumpling').length;
// les `data-k` d'une liste d'éléments, avec leurs nombres : { 'rose-rond-sourit': 2 }
function countKeys(els) {
  const n = {};
  els.forEach((el) => (n[el.dataset.k] = (n[el.dataset.k] || 0) + 1));
  return n;
}
const sameCounts = (a, b) => json(Object.entries(a).sort()) === json(Object.entries(b).sort());
// une erreur est notée, pas de victoire, puis une AUTRE question s'affiche
async function wrongThenNew(el) {
  const q = question(),
    errors = ev('missionErrors');
  el.click();
  const facts = [ev('missionErrors') === errors + 1, !one('.win-box')];
  facts.push(await t.waitFor(() => question() !== q, 1500));
  return facts.every(Boolean);
}

module.exports = {
  ...t,
  T1,
  T4,
  all,
  one,
  question,
  startUntil,
  hintText,
  hintBtn,
  tap,
  hidden,
  digits,
  stageTotal,
  countKeys,
  sameCounts,
  wrongThenNew,
};
