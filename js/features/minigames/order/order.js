/* ---------- Mini-jeu : La commande du chef (Île des Squishy Dumplings, saison 3) ----------
   Un jeu de mémoire, pour le plaisir et l'attention : un client montre et dit
   sa commande (des sortes de dumplings et leur quantité). L'enfant la regarde
   aussi longtemps qu'il veut, touche « J'ai retenu ! », puis la prépare sur le
   plateau en choisissant dans une palette de sortes qui se ressemblent, et
   touche la cloche. L'ordre ne compte pas. Pas de minuteur ni de compte à
   rebours. Les tirages : order-build.js ; le dessin : order-draw.js ; les
   paliers : `orderRound` (js/entities/difficulty/difficulty-s3.js).
   Poser et retirer un dumpling n'est jamais une erreur. Anti-devinette : un
   plateau faux relance une AUTRE commande. */
import { openModal, setHandler, speak } from '../../../shared/ui/index.js';
import { gameDiff } from '../../adaptive/index.js';
import { registerHints, setHintQuestion } from '../../hints/index.js';
import {
  flashModal,
  livesBar,
  loseLife,
  registerGame,
  setSolution,
  setupLives,
  solSel,
  stepOk,
  winSoon,
} from '../../minigame-engine/index.js';
import { bindQuit, gameHeader } from '../../screen/index.js';
import { orderNewQuestion, orderSay } from './order-build.js';
import { orderPlateHTML, orderStageHTML } from './order-draw.js';

/** @typedef {import('./order-build.js').OrderQuestion} OrderQuestion */
/** @typedef {import('../../hints/index.js').HintProvider<OrderQuestion>} OrderHintProvider */

const ORDER_PLATE_MAX = 8;
const ORDER_MAKE_SAY = 'À toi ! Prépare la commande, puis touche la cloche.';

/**
 * Cache ou montre un élément de l'écran par l'attribut `hidden`.
 * @param {string} id
 * @param {boolean} hide
 */
function orderHide(id, hide) {
  const el = document.getElementById(id);
  if (!el) return;
  if (hide) el.setAttribute('hidden', '');
  else el.removeAttribute('hidden');
}

/** @param {OrderQuestion} q le plateau est redessiné ; toucher un dumpling posé le retire */
function orderDrawPlate(q) {
  const plate = document.getElementById('order-plate');
  if (!plate) return;
  plate.innerHTML = orderPlateHTML(q);
  /** @type {NodeListOf<HTMLButtonElement>} */ (plate.querySelectorAll('.order-placed')).forEach((el) =>
    setHandler(el, 'click', () => {
      if (q.phase !== 'make') return;
      q.plate.splice(Number(el.dataset.i), 1);
      orderDrawPlate(q);
    }),
  );
}
/**
 * « J'ai retenu ! » : le ticket se cache, la palette et le plateau apparaissent.
 * C'est l'enfant qui décide quand il a retenu.
 * @param {OrderQuestion} q
 */
function orderToMake(q) {
  if (q.phase !== 'see') return;
  q.phase = 'make';
  ['order-ticket', 'order-ready'].forEach((id) => orderHide(id, true));
  ['order-palette', 'order-plate', 'order-serve'].forEach((id) => orderHide(id, false));
  const txt = document.querySelector('.puzzle-hint .hint-txt');
  if (txt) txt.textContent = 'Prépare la commande';
  const btn = /** @type {HTMLElement | null} */ (document.querySelector('.puzzle-hint .btn-speak'));
  if (btn) btn.dataset.say = ORDER_MAKE_SAY;
  speak(ORDER_MAKE_SAY);
}
/**
 * Un dumpling de la palette est touché : une copie se pose sur le plateau (8 au plus).
 * @param {OrderQuestion} q
 * @param {string} k la clé de la sorte
 */
function orderPick(q, k) {
  if (q.phase !== 'make') return;
  if (q.plate.length >= ORDER_PLATE_MAX) {
    speak('Le plateau est plein !');
    return;
  }
  q.plate.push(k);
  orderDrawPlate(q);
}
/** @param {OrderQuestion} q le plateau contient-il exactement la commande ? (l'ordre ne compte pas) */
function orderExact(q) {
  const total = q.items.reduce((n, x) => n + x.qty, 0);
  return q.plate.length === total && q.items.every((x) => q.plate.filter((k) => k === x.k).length === x.qty);
}
/**
 * La cloche : un plateau vide n'est pas une erreur ; la commande exacte gagne.
 * @param {OrderQuestion} q
 * @param {HTMLElement} btn
 */
function orderServe(q, btn) {
  if (q.phase !== 'make') return;
  if (!q.plate.length) {
    speak('Ton plateau est vide : ajoute des dumplings !');
    return;
  }
  if (!orderExact(q)) {
    loseLife(btn, { disable: false, onRetry: renderOrder });
    return;
  }
  q.phase = 'won';
  stepOk(btn);
  flashModal('ok');
  speak("Miam ! C'est exactement ma commande !");
  winSoon();
}

function renderOrder() {
  setupLives('order');
  const q = orderNewQuestion(gameDiff());
  openModal(`
    ${gameHeader('🥟 La commande du chef', 'Retiens la commande !', orderSay(q))}
    ${livesBar()}
    ${orderStageHTML(q)}
  `);
  bindQuit();
  setSolution([
    '#order-ready',
    ...q.items.flatMap((x) => Array(x.qty).fill(solSel('.order-pick', 'k', x.k))),
    '#order-serve',
  ]);
  setHintQuestion('order', q);
  const ready = document.getElementById('order-ready');
  const serve = document.getElementById('order-serve');
  if (ready) setHandler(ready, 'click', () => orderToMake(q));
  if (serve) setHandler(serve, 'click', () => orderServe(q, serve));
  /** @type {NodeListOf<HTMLButtonElement>} */ (document.querySelectorAll('.order-pick')).forEach((el) =>
    setHandler(el, 'click', () => orderPick(q, el.dataset.k || '')),
  );
}

/* Indices (table T5 de la spec) : 1. la méthode ; 2. le début du raisonnement.
   La phase est lue au moment où l'indice est demandé. Jamais les dumplings
   posés à la place de l'enfant. */
/**
 * Le ticket réapparaît un instant (3 s aux deux premiers paliers, 2 s ensuite),
 * puis se cache : comme Simon rejoue sa suite. La palette reste utilisable.
 * @param {OrderQuestion} q
 */
function orderPeek(q) {
  const ticket = document.getElementById('order-ticket');
  if (!ticket || q.phase !== 'make') return;
  ticket.removeAttribute('hidden');
  setTimeout(
    () => {
      if (q.phase !== 'see') ticket.setAttribute('hidden', '');
    },
    q.tier <= 2 ? 3000 : 2000,
  );
}
/** @param {OrderQuestion} q ce qu'il faut retenir de la première sorte, selon le palier */
function orderFirstSay(q) {
  const what =
    q.tier >= 5 ? 'sa couleur, sa forme, son visage,' : q.tier >= 3 ? 'sa couleur, sa forme,' : 'sa couleur,';
  return `Commence par celle-ci : retiens ${what} et combien il y en a.`;
}
/** @type {OrderHintProvider} */
const orderHints = (q) => {
  if (q.phase === 'see')
    return [
      {
        say: "Regarde bien : quelles sortes, et combien de chaque ? Dis-le tout bas, puis touche « J'ai retenu ».",
        fx: { glow: '#order-ticket' },
      },
      { say: orderFirstSay(q), fx: { glow: `#order-ticket ${solSel('.order-item', 'k', q.items[0].k)}` } },
    ];
  return [
    {
      say: 'Souviens-toi : quelles sortes de dumplings, et combien de chaque ? Pose-les un par un sur le plateau.',
      fx: { glow: '#order-palette' },
    },
    { say: 'Je te remontre la commande un petit instant. Regarde bien !', fx: { run: () => orderPeek(q) } },
  ];
};

registerGame('order', renderOrder);
registerHints('order', orderHints);
