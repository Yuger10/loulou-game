/* ---------- Un handler d'événement par élément et par type ----------
   setHandler(el, 'click', fn) remplace le handler précédent du même type,
   comme `el.onclick = fn` : un rendu qui rebranche ses boutons ne crée
   jamais de doublon. Il passe par addEventListener (règle oxlint
   prefer-add-event-listener) ; pour un objet qui n'en a pas (vieux
   navigateurs, objets audio ou voix incomplets), il garde la propriété
   `onX` : le jeu doit marcher partout. setHandler(el, type, null) retire
   le handler. test/handlers.test.js vérifie l'absence de doublon.

   Écoute au doigt (js/shared/ui/listen.js) : un élément qui reçoit un
   handler `click` sans être actif par sa balise est marqué `data-act`. Le
   toucher y déclenche alors son action au lieu de lire son texte. */
/** @type {WeakMap<object, Map<string, EventListener>>} */
const handlers = new WeakMap();

// Un élément actif : le toucher l'actionne (lui ou un ancêtre), il ne le lit pas.
const ACTIVE_SELECTOR = 'button, a[href], input, select, textarea, [role="button"], [role="tab"], [data-act]';
// les éléments marqués `data-act` par setHandler (pour ne retirer que les siens)
/** @type {WeakSet<Element>} */
const markedActive = new WeakSet();

/**
 * @param {EventTarget} target
 * @param {boolean} on un handler `click` vient d'être posé (true) ou retiré (false)
 */
function markActive(target, on) {
  // un élément du DOM, reconnu sans `instanceof` (objets audio ou voix : jamais marqués)
  if (/** @type {Node} */ (target).nodeType !== 1) return;
  const el = /** @type {Element} */ (target);
  if (on) {
    if (el.closest(ACTIVE_SELECTOR)) return; // déjà actif par sa balise, un ancêtre ou un marquage
    el.setAttribute('data-act', '');
    markedActive.add(el);
  } else if (markedActive.has(el)) {
    el.removeAttribute('data-act');
    markedActive.delete(el);
  }
}

/**
 * @param {EventTarget} el
 * @param {string} type
 */
function hasHandler(el, type) {
  const byType = handlers.get(el);
  return !!byType && byType.has(type);
}

/* Une cible : un élément du DOM, un objet audio ou voix, ou un objet
   incomplet qui n'a que ses propriétés `onX` (vieux navigateurs). */
/** @typedef {EventTarget | Record<string, unknown>} HandlerTarget */
/* L'événement reçu : celui que le navigateur associe à ce type pour un
   élément HTML ('click' → MouseEvent, 'keydown' → KeyboardEvent), sinon Event. */
/**
 * @template {string} K
 * @typedef {K extends keyof HTMLElementEventMap ? HTMLElementEventMap[K] : Event} HandlerEvent
 */

/**
 * @template {string} K
 * @param {HandlerTarget | null | undefined} el élément du DOM ou autre cible d'événements
 * @param {K} type 'click', 'input', 'load'…
 * @param {((e: HandlerEvent<K>) => void) | null} fn
 */
function setHandler(el, type, fn) {
  if (!el) return;
  if (typeof el.addEventListener !== 'function') {
    /** @type {Record<string, unknown>} */ (el)['on' + type] = fn; // pas d'addEventListener : la propriété, qui ne double jamais
    return;
  }
  const target = /** @type {EventTarget} */ (el);
  let byType = handlers.get(target);
  if (!byType) {
    byType = new Map();
    handlers.set(target, byType);
  }
  const previous = byType.get(type);
  if (previous) target.removeEventListener(type, previous);
  if (fn) {
    // le navigateur passe bien à fn l'événement de ce type (voir HandlerEvent)
    const listener = /** @type {EventListener} */ (fn);
    target.addEventListener(type, listener);
    byType.set(type, listener);
  } else byType.delete(type);
  if (type === 'click') markActive(target, !!fn);
}

export { ACTIVE_SELECTOR, hasHandler, setHandler };
