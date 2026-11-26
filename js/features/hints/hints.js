/* ---------- Les indices du compagnon (v52) ----------
   Dès le niveau 1, le compagnon principal donne des indices dans tous les
   mini-jeux (et les énigmes d'histoire) :
   - un bouton 💡 dans l'en-tête du jeu, avec sa tête, toujours utilisable ;
   - il brille et se balance après une erreur, ou après 10 secondes sans
     toucher l'écran : le compagnon « réfléchit ». Il ne parle pas de
     lui-même : l'aide n'est jamais imposée ;
   - 2 niveaux par question : la piste (la méthode), puis le coup de pouce
     (le début du raisonnement). Jamais de 3ᵉ : la réponse n'est jamais
     donnée, le bouton dit alors « Tu peux le faire ! » ;
   - anti-devinette : un indice n'élimine une réponse qu'au niveau 2, avec 4
     choix ou plus, une seule fois, et il en reste toujours au moins 3 ;
   - aucune pénalité : ni pièces, ni objets, ni niveau adaptatif ne changent.
     Les indices sont seulement comptés pour l'espace parents
     (state.skills[jeu].hints).

   Contrat (voir conductor/checklist-mini-jeu.md) : chaque jeu inscrit ses
   indices avec registerHints(clé, question => [niveau 1, niveau 2]), et
   appelle setHintQuestion(clé, question, { choices }) après chaque
   openModal. Une NOUVELLE question (objet différent, ex. après une relance)
   remet les indices à zéro ; la même question re-dessinée (le mémo) les garde.
   Un niveau d'indice : { say, fx } —
     say          la phrase dite à voix haute et montrée dans la bulle
     fx.glow      sélecteur des éléments clés à faire briller
     fx.marks     [{ sel, text }] : petites étiquettes (ex. numéros 1, 2, 3)
     fx.strike    sélecteur des éléments à barrer (ex. ceux qu'on enlève)
     fx.dim       sélecteur d'UNE mauvaise réponse à écarter (niveau 2)
     fx.html      un petit dessin dans la bulle (ex. le mot en syllabes)
     fx.run       un effet propre au jeu, fn(racine de la fenêtre) */
import { buddyReact, COMPANIONS, companionSVG, currentCompanion } from '../../entities/companion/index.js';
import { save, state } from '../../entities/game-state/index.js';
import { party, race } from '../../entities/player/index.js';
import { pickRandom } from '../../shared/lib/index.js';
import { bindSpeakButtons, onModalChange, playSound, setHandler, speak } from '../../shared/ui/index.js';

const HINT_IDLE_MS = 10000; // sans toucher l'écran, le bouton se propose
const HINT_LEVELS = 2;
const HINT_MIN_CHOICES = 4; // pas d'élimination en dessous
const HINT_MIN_LEFT = 3; // choix qui restent toujours, au minimum

/**
 * Les effets d'un niveau d'indice (détail en tête de fichier).
 * @typedef {{
 *   glow?: string,
 *   marks?: Array<{ sel: string, text: string }>,
 *   strike?: string,
 *   dim?: string,
 *   html?: string,
 *   run?: (root: HTMLElement) => void,
 * }} HintFx
 */
/** @typedef {{ say: string, fx: HintFx }} Hint un niveau d'indice, au format commun */
/** @typedef {{ say?: string, fx?: HintFx } | null | undefined} HintIn un niveau tel qu'un jeu le donne */
/**
 * Les indices d'une question ; chaque jeu a sa forme de question.
 * @template Q
 * @typedef {(question: Q) => HintIn[] | null | undefined} HintProvider
 */

/** @type {Record<string, HintProvider<unknown>>} */
const HINT_PROVIDERS = {};
/**
 * @template Q
 * @param {string} key
 * @param {HintProvider<Q>} fn
 */
function registerHints(key, fn) {
  // rangé sans sa forme de question : seul le jeu qui pose la question la relit
  HINT_PROVIDERS[key] = /** @type {HintProvider<unknown>} */ (fn);
}
/** @param {string} key */
function hasHints(key) {
  return !!HINT_PROVIDERS[key];
}

// Les deux niveaux d'indice d'une question, toujours au même format
/**
 * @param {string} type
 * @param {unknown} question
 * @returns {Hint[]}
 */
function hintsFor(type, question) {
  const fn = HINT_PROVIDERS[type];
  if (!fn) return [];
  return (fn(question) || []).slice(0, HINT_LEVELS).map((h) => ({ say: (h && h.say) || '', fx: (h && h.fx) || {} }));
}
// Règle anti-devinette : écarter une réponse est-il permis ?
/**
 * @param {number} level
 * @param {number} nChoices
 */
function hintMayEliminate(level, nChoices) {
  return level === HINT_LEVELS && nChoices >= HINT_MIN_CHOICES && nChoices - 1 >= HINT_MIN_LEFT;
}

/* Indices d'une suite à toucher dans l'ordre (puzzle des nombres, jours de la
   semaine, planètes) : 1. la méthode ; 2. le chemin déjà fait, avec un « ? »
   pour le suivant. Rien n'est écarté : chaque choix servira plus tard. */
/**
 * @template T
 * @param {T[]} done les étapes déjà touchées
 * @param {string} say
 * @param {(x: T) => string} [label] le texte d'une étape, par défaut la valeur elle-même
 * @returns {Hint}
 */
function hintOrderStep(done, say, label) {
  return {
    say,
    fx: {
      html: `<span class="hint-strip">${done
        .slice(-3)
        .map((x) => `<i>${label ? label(x) : x}</i>`)
        .join('')}<i class="q">?</i></span>`,
    },
  };
}

/* Qui donne l'indice, au bout de combien de temps il se propose, les
   paillettes… : réglé par l'équipe des compagnons (js/features/companion-team),
   qui s'inscrit ici avec setHintPolicy. Par défaut : le compagnon du joueur,
   10 s, et rien en mode course (pour rester équitable). */
/** Comportement des indices, réglé par les spécialités de l'équipe (setHintPolicy).
 * @type {{
 *   giver: (kind?: string | null, level?: number) => string,
 *   idleMs: (kind?: string | null) => number,
 *   sparkle: (kind?: string | null) => boolean,
 *   enabled: (kind?: string) => boolean,
 *   syllablesFirst: () => boolean,
 *   onUse: ((kind: string, level: number) => void) | null,
 *   onShow: ((kind: string) => void) | null,
 *   onError: ((kind: string | null) => void) | null,
 *   onGood: (() => void) | null,
 *   onMission: ((kind: string) => void) | null,
 * }} */
const hintPolicy = {
  giver: () => currentCompanion(),
  idleMs: () => HINT_IDLE_MS,
  sparkle: () => false,
  enabled: () => !race.active,
  syllablesFirst: () => false, // Perle la conteuse : les syllabes dès l'indice 1
  onUse: null, // (kind, level) après chaque indice
  onShow: null, // (kind) quand une question avec indices s'affiche
  onError: null, // (kind) à chaque erreur (Grisou console après 2 d'affilée)
  onGood: null, // une bonne étape
  onMission: null, // (kind) une nouvelle mission commence
};
/** @param {Partial<typeof hintPolicy>} part */
function setHintPolicy(part) {
  Object.assign(hintPolicy, part);
}

/**
 * La question en cours : `kind` = le jeu, `q` = la question (sa forme dépend du
 * jeu), `choices` = sélecteur des réponses, `idle` = minuteur de la proposition.
 * @type {{
 *   kind: string | null,
 *   q: unknown,
 *   level: number,
 *   choices: string | null,
 *   on: boolean,
 *   idle: ReturnType<typeof setTimeout> | undefined,
 *   nudged: boolean,
 *   carry: boolean,
 *   noCount: boolean,
 * }}
 */
let hint = {
  kind: null,
  q: null,
  level: 0,
  choices: null,
  on: false,
  idle: undefined,
  nudged: false,
  carry: false,
  noCount: false,
};

// Une question s'affiche (après openModal) : le bouton 💡 apparaît dans l'en-tête.
/**
 * @param {string} kind
 * @param {unknown} q
 * @param {{ choices?: string, noCount?: boolean }} [opts]
 */
function setHintQuestion(kind, q, opts = {}) {
  if (hint.q !== q || hint.kind !== kind) {
    hint.level = 0;
    hint.nudged = hint.carry; // une erreur juste avant la relance : il brille déjà
  }
  hint.carry = false;
  hint.kind = kind;
  hint.q = q;
  hint.choices = opts.choices || null;
  hint.noCount = !!opts.noCount;
  hint.on = hintPolicy.enabled(kind) && hasHints(kind);
  renderHintButton();
  armHintIdle();
  if (hint.on && hintPolicy.onShow) hintPolicy.onShow(kind);
}
function hintSyllablesFirst() {
  return !!hintPolicy.syllablesFirst();
}
// un mot écrit découpé en syllabes colorées (lecture)
/** @param {string[]} syl */
function hintSyllablesHTML(syl) {
  return syl.map((x) => `<span class="hint-syl">${x}</span>`).join('');
}
function hintLevel() {
  return hint.on ? hint.level : 0;
}

function renderHintButton() {
  const head = document.querySelector('#modal-body .game-head');
  if (!head) return;
  let b = /** @type {HTMLButtonElement} */ (head.querySelector('.hint-btn'));
  if (!hint.on) {
    if (b) b.remove();
    return;
  }
  if (!b) {
    b = document.createElement('button');
    b.type = 'button';
    b.className = 'hint-btn';
    setHandler(b, 'click', () => useHint());
    head.appendChild(b);
    head.classList.add('has-hint');
  }
  const done = hint.level >= HINT_LEVELS;
  const who = hintPolicy.giver(hint.kind, 0);
  const mood = done ? 'cheer' : hint.nudged ? 'think' : 'happy';
  b.innerHTML =
    `<span class="hint-face" aria-hidden="true">${companionSVG(who, mood)}</span>` +
    `<span class="hint-ico" aria-hidden="true">${done ? '💪' : '💡'}</span>` +
    (done ? '<span class="hint-cando">Tu peux le faire !</span>' : '');
  b.classList.toggle('done', done);
  b.classList.toggle('nudge', hint.nudged && !done);
  b.dataset.level = String(hint.level);
  b.setAttribute(
    'aria-label',
    done ? 'Tu peux le faire !' : `Un indice de ${COMPANIONS[who] ? COMPANIONS[who].name : 'ton compagnon'}`,
  );
}

/* ---- la proposition douce ---- */
function armHintIdle() {
  clearTimeout(hint.idle);
  hint.idle = undefined;
  if (!hint.on || hint.level >= HINT_LEVELS) return;
  hint.idle = setTimeout(() => hintNudge(), hintPolicy.idleMs(hint.kind));
}
// fromError : la relance qui suit gardera le bouton brillant
/** @param {boolean} [fromError] */
function hintNudge(fromError) {
  if (fromError) {
    hint.carry = true;
    if (hintPolicy.onError) hintPolicy.onError(hint.kind);
  }
  if (!hint.on || hint.level >= HINT_LEVELS || hint.nudged) return;
  hint.nudged = true;
  renderHintButton();
}
// toucher l'écran pendant une question relance le compte des 10 secondes
if (typeof document !== 'undefined')
  document.addEventListener(
    'pointerdown',
    (e) => {
      if (hint.on && !hint.nudged && e.target && /** @type {HTMLElement} */ (e.target).closest('#modal')) armHintIdle();
    },
    true,
  );

/* ---- utiliser un indice ---- */
const HINT_CHEERS = ['Tu peux le faire !', 'Je crois en toi !', 'Prends ton temps, tu vas trouver !'];
function useHint() {
  if (!hint.on) return null;
  playSound('hint');
  if (hint.level >= HINT_LEVELS) {
    speak(pickRandom(HINT_CHEERS), { interrupt: true, demand: true });
    buddyReact('cheer', 1200);
    return null;
  }
  // hint.on : la question a des indices inscrits, donc son jeu est connu
  const kind = /** @type {string} */ (hint.kind);
  const levels = hintsFor(kind, hint.q);
  const h = levels[hint.level];
  if (!h) return null;
  hint.level++;
  hint.nudged = false;
  clearTimeout(hint.idle);
  showHint(h, hint.level, undefined, true);
  countHint(kind);
  buddyReact(hint.level >= HINT_LEVELS ? 'cheer' : 'think', 1400);
  renderHintButton();
  if (hintPolicy.onUse) hintPolicy.onUse(kind, hint.level);
  return h;
}

// Montre l'indice 1 de lui-même (Léo, avant un jeu en soutien) : pas compté.
/** @param {string} giver le compagnon qui montre l'indice */
function hintShowFirst(giver) {
  if (!hint.on || hint.level > 0) return false;
  // hint.on : la question a des indices inscrits, donc son jeu est connu
  const kind = /** @type {string} */ (hint.kind);
  const h = hintsFor(kind, hint.q)[0];
  if (!h) return false;
  hint.level = 1;
  hint.nudged = false;
  showHint(h, 1, giver);
  renderHintButton();
  armHintIdle();
  if (hintPolicy.onUse) hintPolicy.onUse(kind, 1);
  return true;
}

// la bulle de l'indice sous la consigne, et l'effet visuel
/**
 * @param {Hint} h
 * @param {number} level
 * @param {string} [giverOverride]
 * @param {boolean} [demand] l'enfant a demandé l'indice (bouton 💡) : dit même voix coupée
 */
function showHint(h, level, giverOverride, demand) {
  const body = document.getElementById('modal-body');
  if (!body) return;
  let bub = body.querySelector('.hint-bubble');
  if (!bub) {
    bub = document.createElement('div');
    bub.className = 'hint-bubble';
    bub.setAttribute('role', 'status');
    const anchor =
      body.querySelector('#challenge-timer') || body.querySelector('.puzzle-hint') || body.querySelector('.game-head');
    if (anchor) anchor.insertAdjacentElement('afterend', bub);
    else body.prepend(bub);
  }
  const who = giverOverride || hintPolicy.giver(hint.kind, level);
  bub.dataset.level = String(level);
  // espaces insécables avant « : ! ? » (typographie française, pas de « : » seul en début de ligne)
  const text = h.say.replace(/ ([:;!?»])/g, '\u00a0$1').replace(/« /g, '«\u00a0');
  bub.innerHTML = `<span class="hint-bface" aria-hidden="true">${companionSVG(who, 'think')}</span>
    <span class="hint-btext"><b class="hint-n">💡 ${level}</b> ${text}${h.fx.html ? `<span class="hint-extra">${h.fx.html}</span>` : ''}</span>
    <button type="button" class="btn-speak" data-say="${h.say.replace(/<[^>]+>/g, '').replace(/"/g, '&quot;')}" aria-label="Écouter l'indice">🔈</button>`;
  bindSpeakButtons();
  bub.classList.remove('pop');
  void bub.offsetWidth;
  bub.classList.add('pop');
  applyHintFx(h.fx, level);
  speak(h.say, { interrupt: true, demand: !!demand });
}

function hintChoicesLeft() {
  if (!hint.choices) return 0;
  const choices = /** @type {HTMLButtonElement[]} */ ([...document.querySelectorAll(`#modal-body ${hint.choices}`)]);
  return choices.filter((el) => !el.disabled && !el.classList.contains('hint-dim') && !el.classList.contains('done'))
    .length;
}
/**
 * @param {HintFx} fx
 * @param {number} level
 */
function applyHintFx(fx, level) {
  // appelé par showHint, qui a déjà trouvé la fenêtre
  const root = /** @type {HTMLElement} */ (document.getElementById('modal-body'));
  /** @param {string | undefined} sel */
  const all = (sel) => (sel ? [...root.querySelectorAll(sel)] : []);
  const sparkle = level === HINT_LEVELS && hintPolicy.sparkle(hint.kind);
  all(fx.glow).forEach((el) => {
    el.classList.remove('hint-glow');
    void el.offsetWidth;
    el.classList.add('hint-glow');
  });
  (fx.marks || []).forEach((m) =>
    all(m.sel).forEach((el) => {
      const old = el.querySelector(':scope > .hint-mark');
      if (old) old.textContent = m.text;
      else el.insertAdjacentHTML('beforeend', `<span class="hint-mark" aria-hidden="true">${m.text}</span>`);
    }),
  );
  all(fx.strike).forEach((el) => el.classList.add('hint-strike'));
  if (fx.run) fx.run(root);
  // les paillettes de Lili : sur l'élément clé (ce qui brille, sinon ce qui est
  // numéroté ou barré, sinon la bulle de l'indice)
  if (sparkle) {
    let keys = all(fx.glow);
    if (!keys.length) keys = (fx.marks || []).flatMap((m) => all(m.sel)).slice(0, 3);
    if (!keys.length) keys = all(fx.strike).slice(0, 3);
    if (!keys.length) keys = all('.hint-bubble');
    keys.forEach((el) => el.classList.add('hint-sparkle'));
  }
  if (fx.dim) hintEliminate(fx.dim, level);
}
// écarte UNE mauvaise réponse, seulement si la règle anti-devinette le permet
/**
 * @param {string} sel
 * @param {number} level
 */
function hintEliminate(sel, level) {
  const el = /** @type {HTMLButtonElement} */ (document.querySelector(`#modal-body ${sel}`));
  if (!el || el.disabled || !hintMayEliminate(level, hintChoicesLeft())) return false;
  if (document.querySelector('#modal-body .hint-dim')) return false; // une seule fois par question
  el.classList.add('hint-dim');
  el.disabled = true;
  el.setAttribute('aria-disabled', 'true');
  return true;
}

// compté pour l'espace parents, jamais comme une erreur (niveau adaptatif inchangé)
// Quels indices compter : ceux des mini-jeux inscrits au moteur (qui le dit
// avec setHintCountable, v54 : les indices sont une couche sous le moteur)
/** @type {(kind: string) => boolean} */
let hintCountable = () => false;
/** @param {(kind: string) => boolean} fn */
function setHintCountable(fn) {
  hintCountable = fn;
}
/** @param {string} kind */
function countHint(kind) {
  if (hint.noCount || party.active || !hintCountable(kind)) return;
  if (!state.skills) state.skills = {};
  const s =
    state.skills[kind] || (state.skills[kind] = { wins: 0, fails: 0, errors: 0, last: null, recent: [], hints: 0 });
  s.hints = (s.hints || 0) + 1;
  save();
}

// toute nouvelle fenêtre (ou sa fermeture) met les indices en veille ;
// le jeu les rallume avec setHintQuestion s'il s'agit d'une question.
onModalChange(() => {
  hint.on = false;
  hint.nudged = false;
  clearTimeout(hint.idle);
  hint.idle = undefined;
});

export {
  hintLevel,
  hintNudge,
  hintOrderStep,
  hintPolicy,
  hintShowFirst,
  hintSyllablesFirst,
  hintSyllablesHTML,
  registerHints,
  setHintCountable,
  setHintPolicy,
  setHintQuestion,
};
