/* ---------- Écouter au doigt ----------
   Un seul écouteur pour tout le jeu, posé sur le document en phase de
   capture : aucun écran n'a à le brancher, donc aucun ne peut l'oublier.
   - toucher un texte le lit ;
   - toucher un bouton l'actionne, puis dit son libellé si l'action n'a rien dit ;
   - un bouton inactif (`aria-disabled="true"`) dit pourquoi (`data-say-why`) ;
   - un 🔈 (`.btn-speak[data-say]`) garde son propre handler (bindSpeakButtons) ;
   - `data-voix="lire"` : un mot à lire ne se dit pas ; `data-voix="muet"` : jamais dit.
   La garde test/voix-partout.test.js utilise la même fonction listenText. */
import { toSpoken } from '../lib/index.js';
import { ACTIVE_SELECTOR } from './handlers.js';
import { speak, speakCallCount } from './voice.js';

// le bloc lu quand on touche un texte : le plus proche de ces éléments
const BLOCK_SELECTOR =
  '[data-say], h1, h2, h3, h4, p, li, label, .speech, .hint-bubble, .view-hint, .name, .sub, .toast';
const HAS_WORD = /[\p{L}\p{N}]/u;
const SKIPPED_TAGS = /^(script|style|svg|template|title)$/i;

/**
 * Le toucher actionne cet élément (lui ou un ancêtre) au lieu de le lire.
 * @param {Element} el
 * @returns {boolean}
 */
function isActive(el) {
  return !!el.closest(ACTIVE_SELECTOR);
}

// un élément du DOM, reconnu sans `instanceof` (le jeu doit marcher partout,
// y compris là où `Element` n'est pas un nom global)
/**
 * @param {unknown} node
 * @returns {node is Element}
 */
function isElement(node) {
  return !!node && /** @type {Node} */ (node).nodeType === 1;
}

// le texte affiché d'un élément, sans ses parties décoratives ou cachées
/** @param {Element} el */
function shownText(el) {
  let out = '';
  /** @param {Node} node */
  const walk = (node) => {
    node.childNodes.forEach((c) => {
      if (c.nodeType === 3) out += c.nodeValue || '';
      else if (isElement(c)) {
        if (c.getAttribute('aria-hidden') === 'true' || c.hasAttribute('hidden') || SKIPPED_TAGS.test(c.tagName))
          return;
        out += ' ';
        walk(c);
        out += ' ';
      }
    });
  };
  walk(el);
  return out;
}

/**
 * Ce que dit un élément quand on l'écoute : son `data-say`, sinon son texte
 * affiché, sinon son `aria-label` (ou l'étiquette d'un champ).
 * @param {Element} el
 * @returns {string}
 */
function listenText(el) {
  if (el.closest('[data-voix="muet"]')) return '';
  const say = el.getAttribute('data-say');
  if (say) return toSpoken(say);
  const text = toSpoken(shownText(el));
  if (HAS_WORD.test(text)) return text;
  const aria = el.getAttribute('aria-label');
  if (aria) return toSpoken(aria);
  // un champ sans texte : son étiquette
  const labels = /** @type {{ labels?: NodeListOf<HTMLLabelElement> | null }} */ (el).labels;
  const label = labels && labels[0];
  return label && !label.closest('[data-voix="muet"]') ? toSpoken(shownText(label)) : '';
}

/** @param {Element} el */
function hasOwnText(el) {
  return [...el.childNodes].some((c) => c.nodeType === 3 && HAS_WORD.test(toSpoken(c.nodeValue || '')));
}

/** @param {Element} act l'élément actif touché */
function listenActive(act) {
  const inactive = act.getAttribute('aria-disabled') === 'true';
  const before = speakCallCount();
  // après les handlers du bouton : si son action a parlé, on n'ajoute rien
  setTimeout(() => {
    if (speakCallCount() !== before) return;
    // un mot à lire (réponse d'un jeu de lecture) ne se dit jamais, même éliminé
    if (act.closest('[data-voix="lire"], [data-voix="muet"]')) return;
    if (inactive) {
      const why = act.getAttribute('data-say-why') || listenText(act);
      if (why) speak(why, { interrupt: true, demand: true });
      return;
    }
    // retour sonore : lecture automatique (muette si la voix est coupée),
    // qui coupe la phrase en cours puisqu'elle répond à un toucher
    const label = listenText(act);
    if (label) speak(label, { interrupt: true });
  }, 0);
}

/** @param {Event} e */
function onTap(e) {
  const t = e.target;
  if (!isElement(t)) return;
  if (t.closest('.btn-speak[data-say]')) return; // le 🔈 parle lui-même
  const act = t.closest(ACTIVE_SELECTOR);
  if (act) {
    listenActive(act);
    return;
  }
  if (t.closest('[data-voix="muet"]')) return;
  if (t.closest('[data-voix="lire"]')) {
    speak('Essaie de le lire !', { interrupt: true, demand: true });
    return;
  }
  // un toucher dans le vide (fond d'une fenêtre, marge) ne lit pas tout l'écran
  const block = t.closest(BLOCK_SELECTOR) || (hasOwnText(t) ? t : null);
  if (!block) return;
  const text = listenText(block);
  if (text) speak(text, { interrupt: true, demand: true, el: /** @type {HTMLElement} */ (block) });
}

if (typeof document !== 'undefined') document.addEventListener('click', onTap, { capture: true });

export { isActive, listenText };
