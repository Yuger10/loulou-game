/* ---------- Un handler d'événement par élément et par type ----------
   setHandler(el, 'click', fn) remplace le handler précédent du même type,
   comme `el.onclick = fn` : un rendu qui rebranche ses boutons ne crée
   jamais de doublon. Il passe par addEventListener (règle oxlint
   prefer-add-event-listener) ; pour un objet qui n'en a pas (vieux
   navigateurs, objets audio ou voix incomplets), il garde la propriété
   `onX` : le jeu doit marcher partout. setHandler(el, type, null) retire
   le handler. test/handlers.test.js vérifie l'absence de doublon. */
/** @type {WeakMap<object, Map<string, EventListener>>} */
const handlers = new WeakMap();

/**
 * @param {any} el élément du DOM ou autre cible d'événements
 * @param {string} type 'click', 'input', 'load'…
 * @param {((e: any) => void) | null} fn
 */
function setHandler(el, type, fn) {
  if (!el) return;
  if (typeof el.addEventListener !== 'function') {
    el['on' + type] = fn; // pas d'addEventListener : la propriété, qui ne double jamais
    return;
  }
  let byType = handlers.get(el);
  if (!byType) {
    byType = new Map();
    handlers.set(el, byType);
  }
  const previous = byType.get(type);
  if (previous) el.removeEventListener(type, previous);
  if (fn) {
    el.addEventListener(type, fn);
    byType.set(type, fn);
  } else byType.delete(type);
}

export { setHandler };
