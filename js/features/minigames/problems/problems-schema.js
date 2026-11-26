/* ---------- « Le trésor raconté » : le dessin (tables V1, F1 et L1 de la spec) ----------
   Tout ce que la fenêtre montre est fabriqué ici, d'un seul coup : les
   vignettes de l'histoire (sans décor : les personnages, l'objet, un « ? »),
   le coffre et ses objets à toucher, le schéma en barres à ses vraies
   longueurs, l'égalité, les signes et les nombres du calcul. Les étapes à
   venir sont déjà là, cachées (`hidden`) : la solution lue par les tests
   existe dès l'ouverture. */
import { PB_OBJECTS, PB_PEOPLE } from './problems-bank.js';
import { pbChoices } from './problems-draw.js';

/** @typedef {import('./problems-bank.js').PbProblem} PbProblem */
/** @typedef {import('./problems-bank.js').PbStory} PbStory */
/** @typedef {import('./problems-bank.js').PbLine} PbLine */
/** @typedef {import('./problems-draw.js').PbStage} PbStage */
/** @typedef {import('../../../entities/difficulty/index.js').ProblemsRound} ProblemsRound */
/**
 * Un problème tel qu'il est montré : son conteneur (`pb-main`, `pb-ex` ou
 * `pb-twin`), son énoncé, ses étapes de calcul, la ligne du palier.
 * @typedef {{ box: string, x: PbProblem, story: PbStory, stages: PbStage[], row: ProblemsRound }} PbView
 */

const PB_STEPS = [
  ['comprendre', '👂 Comprendre'],
  ['dessiner', '📊 Dessiner'],
  ['calculer', '🧮 Calculer'],
  ['repondre', '💬 Répondre'],
];
function pbStepsHTML() {
  return `<div class="pb-steps">${PB_STEPS.map(
    ([k, label], i) => `<span class="pb-step${i ? '' : ' on'}" data-step="${k}">${label}</span>`,
  ).join('')}</div>`;
}

/** @param {PbView} v vrai si les objets se touchent (représentations concrètes) */
function pbIsConcrete(v) {
  return v.row.rep === 'concret' || v.row.rep === 'concret-barre';
}
/** @param {PbView} v vrai si l'on ajoute des objets au coffre (réunion, ajout) */
function pbAddsTokens(v) {
  return pbIsConcrete(v) && v.stages.length === 1 && v.stages[0].op === '+';
}

/**
 * Les objets d'une vignette : un emoji par objet jusqu'à 10, au-delà le nombre
 * et un seul emoji. `from` : le rang du premier objet à toucher (−1 : aucun).
 * @param {number} n
 * @param {string} emoji
 * @param {number} from
 */
function pbObjectsHTML(n, emoji, from) {
  if (n > 10) return `<span class="pb-count">${n}</span><span class="pb-obj">${emoji}</span>`;
  return Array.from({ length: n }, (_, i) =>
    from < 0
      ? `<span class="pb-obj">${emoji}</span>`
      : `<button class="pb-obj pb-token" data-i="${from + i}" aria-label="Un objet">${emoji}</button>`,
  ).join('');
}
/**
 * Les vignettes de l'histoire, une par phrase (table V1).
 * @param {PbView} v
 */
function pbSceneHTML(v) {
  const emoji = PB_OBJECTS[v.x.obj].emoji;
  let next = pbAddsTokens(v) ? 0 : -1;
  const cells = v.story.lines.map((line, k) => {
    const who = line.who.map((id) => `<span class="pb-who" data-p="${id}">${PB_PEOPLE[id].emoji}</span>`).join('');
    const objs = line.q
      ? `<span class="pb-obj">${emoji}</span><span class="pb-qm">?</span>`
      : pbObjectsHTML(line.n, emoji, next);
    if (next >= 0 && !line.q) next += line.n;
    return `<div class="pb-vignette" data-k="${k}"${line.q ? ' data-q' : ''}>${who}${objs}</div>`;
  });
  return `<div class="pb-scene">${cells.join('')}</div>`;
}

/**
 * Une barre du schéma, à sa vraie longueur (F1 : l'échelle est le plus grand nombre).
 * @param {string} slot
 * @param {{ values: Record<string, number>, max: number, filled: boolean, q: string }} bars
 */
function pbBarHTML(slot, bars) {
  const width = Math.round((bars.values[slot] / bars.max) * 100);
  const text = bars.filled ? (slot === bars.q ? '?' : bars.values[slot]) : '';
  return `<button class="pb-bar pb-slot${slot === 'ecart' ? ' pb-dash' : ''}" data-s="${slot}" style="width:${width}%">${text}</button>`;
}
/**
 * Le schéma d'une étape : parties-tout (une grande barre sur deux petites) ou
 * comparaison (deux barres alignées, l'écart en pointillés, un visage par barre).
 * @param {PbStage} s
 * @param {PbProblem} x
 * @param {boolean} filled les étiquettes sont déjà posées
 */
function pbBarsHTML(s, x, filled) {
  const values = { [s.slots[0]]: s.n1, [s.slots[1]]: s.n2, [s.slots[2]]: s.r };
  const bars = { values, max: Math.max(s.n1, s.n2, s.r), filled, q: s.slots[2] };
  const face = (/** @type {string} */ id) => `<span class="pb-face">${PB_PEOPLE[id].emoji}</span>`;
  const rows =
    s.kind === 'pt'
      ? [
          ['', ['tout']],
          ['', ['partie1', 'partie2']],
        ]
      : [
          [face(x.q), ['grand']],
          [face(x.p), ['petit', 'ecart']],
        ];
  return `<div class="pb-bars" data-kind="${s.kind}">${rows
    .map(
      ([head, slots]) =>
        `<div class="pb-row">${head}<div class="pb-track">${/** @type {string[]} */ (slots).map((k) => pbBarHTML(k, bars)).join('')}</div></div>`,
    )
    .join('')}</div>`;
}
/**
 * « Est-ce possible ? » : ce qu'on a, et dessous ce qu'on veut donner (elle dépasse si b > a).
 * @param {PbProblem} x
 */
function pbPossibleHTML(x) {
  const max = Math.max(x.a, x.b);
  const bar = (/** @type {string} */ slot, /** @type {number} */ n, /** @type {string} */ tag) =>
    `<div class="pb-row"><span class="pb-face">${tag}</span><div class="pb-track"><div class="pb-bar${slot === 'donner' && x.b > x.a ? ' over' : ''}" data-s="${slot}" style="width:${Math.round((n / max) * 100)}%">${n}</div></div></div>`;
  return `<div class="pb-bars" data-kind="possible" hidden>${bar('a', x.a, PB_PEOPLE[x.p].emoji)}${bar('donner', x.b, '🎁')}</div>
    <div class="pb-yesnos" hidden>
      <button class="pb-yesno" data-v="oui" aria-label="Oui, c'est possible">👍</button>
      <button class="pb-yesno" data-v="non" aria-label="Non, ce n'est pas possible">👎</button>
    </div>`;
}

/**
 * Le coffre : vide (on y met les objets des vignettes) ou déjà plein (on en sort).
 * @param {PbView} v
 * @param {PbStage} s
 */
function pbChestHTML(v, s) {
  const emoji = PB_OBJECTS[v.x.obj].emoji;
  const inside = s.op === '+' ? '' : pbObjectsHTML(s.n1, emoji, 0);
  const done = s.op === '+' ? '' : `<button class="btn-primary pb-done">✅ C'est fait</button>`;
  return `<div class="pb-chest-zone">
      <div class="pb-chest" aria-label="Le coffre">${inside}</div>
      <div class="pb-out" aria-label="Sortis du coffre"></div>${done}
    </div>`;
}
/** @param {PbStage} s les trois étiquettes à poser : les deux nombres, puis le « ? » */
function pbLabelsHTML(s) {
  const label = (/** @type {string} */ l, /** @type {string | number} */ text) =>
    `<button class="pb-label" data-l="${l}">${text}</button>`;
  return `<div class="pb-labels">${label('n1', s.n1)}${label('n2', s.n2)}${label('q', '?')}</div>`;
}
/** @param {PbStage} s l'égalité à remplir : □ ○ □ = ? et les deux nombres de l'étape */
function pbEqualityHTML(s) {
  return `<div class="pb-eq">
      <div class="pb-eq-nums">
        <button class="pb-eq-num" data-k="1">${s.n1}</button><button class="pb-eq-num" data-k="2">${s.n2}</button>
      </div>
      <div class="pb-eq-line">
        <span class="pb-eq-case" data-c="0"></span><span class="pb-eq-op">○</span><span class="pb-eq-case" data-c="1"></span>
        <span>=</span><span class="pb-eq-res">?</span>
      </div>
    </div>`;
}
/**
 * Ce qui sert à dessiner l'étape, selon la représentation du palier.
 * @param {PbView} v
 * @param {PbStage} s
 */
function pbDrawHTML(v, s) {
  if (v.row.rep === 'egalite') return pbEqualityHTML(s);
  if (v.row.rep === 'barres') return pbBarsHTML(s, v.x, false) + pbLabelsHTML(s);
  const bars =
    v.row.rep === 'concret-barre' ? pbBarsHTML(s, v.x, true).replace('class="pb-bars"', 'class="pb-bars" hidden') : '';
  return pbChestHTML(v, s) + bars;
}
/**
 * Le bloc d'une étape de calcul : dessiner, choisir l'opération, calculer.
 * @param {PbView} v
 * @param {number} e le rang de l'étape (0 ou 1)
 */
function pbBlockHTML(v, e) {
  const s = v.stages[e];
  const signs = `<div class="pb-signs"${v.row.rep === 'egalite' ? '' : ' hidden'}>
      <button class="pb-sign" data-v="+" aria-label="Ajouter">➕</button>
      <button class="pb-sign" data-v="-" aria-label="Enlever">➖</button>
    </div>`;
  const nums = pbChoices(s, v.row)
    .map((n) => `<button class="num-btn pb-num" data-v="${n}">${n}</button>`)
    .join('');
  return `<div class="pb-block" id="${v.box}-e${e + 1}" hidden>
      ${pbDrawHTML(v, s)}
      ${v.row.rep === 'concret' ? '' : signs}
      ${v.row.eqUnder ? '<p class="pb-eq-text"></p>' : ''}
      <div class="num-options pb-nums" hidden>${nums}</div>
    </div>`;
}

/**
 * Un problème entier dans son conteneur. `steps` : les flèches 👉 (une par
 * pas : « comprendre », ou « ex1 » à « exK » pour l'exemple ; aucune pour le jumeau).
 * @param {PbView} v
 * @param {string[]} steps
 * @param {boolean} shown faux : le conteneur attend caché (le jumeau)
 */
function pbBoxHTML(v, steps, shown) {
  const nexts = steps
    .map(
      (k, i) =>
        `<button class="btn-primary pb-next" data-step="${k}"${i ? ' hidden' : ''} aria-label="Continuer">👉</button>`,
    )
    .join('');
  const body = v.x.type === 'possible' ? pbPossibleHTML(v.x) : v.stages.map((_s, e) => pbBlockHTML(v, e)).join('');
  const answer = v.x.type === 'possible' ? '' : '<button class="pb-answer" aria-label="La réponse">?</button>';
  return `<div class="pb-box" id="${v.box}"${shown ? '' : ' hidden'}>
      ${pbSceneHTML(v)}
      <div class="pb-nexts">${nexts}</div>
      ${body}
      <div class="pb-reply" hidden><span class="pb-sentence"></span>${answer}</div>
    </div>`;
}

export { pbAddsTokens, pbBarsHTML, pbBoxHTML, pbIsConcrete, pbStepsHTML };
