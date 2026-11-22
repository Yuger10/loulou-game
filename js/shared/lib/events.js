/* ---------- Petit bus d'événements (v54) ----------
   Les slices forment des couches, et une slice n'importe jamais une slice
   placée au-dessus d'elle (pas de cycle d'import). Quand une feature doit
   prévenir ou solliciter une feature plus haute, elle émet un événement,
   et la feature concernée l'écoute :
     on('ui:lagon', renderLagon)        // l'île se redessine sur demande
     emit('ui:lagon')                   // l'histoire, une fête… le demandent
   Trois familles de noms :
     ui:…      redessiner une partie de l'écran (ui:lagon, ui:profile, ui:map…)
     nav:…     ouvrir un écran (nav:game-picker, nav:parents…)
     domaine   ce qui vient de se passer (world:changed, lagon:rendered…)
   Les écouteurs sont appelés dans l'ordre d'inscription, tout de suite (comme
   un appel de fonction). `emit` renvoie leurs résultats. Un écouteur qui
   plante n'empêche pas les autres : son erreur est relancée juste après,
   pour rester visible (console, tests). */
/* Un écouteur reçoit les arguments de `emit`. Le bus ne connaît pas leur
   forme (chaque événement a la sienne) : il les transmet tels quels, et
   l'écouteur déclare lui-même ce qu'il reçoit. */
/** @typedef {Function} BusListener */
/** @type {Map<string, BusListener[]>} */
const busListeners = new Map(); // nom → [fonctions]

/**
 * @template {BusListener} F
 * @param {string} name
 * @param {F} fn
 * @returns {() => void} désinscrit l'écouteur
 */
function on(name, fn) {
  /** @type {BusListener[]} */ (busListeners.get(name) || busListeners.set(name, []).get(name)).push(fn);
  return () => off(name, fn);
}
/**
 * @param {string} name
 * @param {BusListener} fn
 */
function off(name, fn) {
  const list = busListeners.get(name);
  if (!list) return;
  const i = list.indexOf(fn);
  if (i >= 0) list.splice(i, 1);
}
/**
 * @param {string} name
 * @param {...unknown} args
 * @returns {unknown[]} les résultats des écouteurs (undefined pour celui qui a planté)
 */
function emit(name, ...args) {
  const list = (busListeners.get(name) || []).slice();
  return list.map((fn) => {
    try {
      // le bus transmet les arguments sans les connaître : l'écouteur inscrit
      // pour ce nom sait ce qu'il reçoit
      return /** @type {(...a: unknown[]) => unknown} */ (fn)(...args);
    } catch (e) {
      setTimeout(() => {
        throw e;
      });
      return undefined;
    }
  });
}

export { emit, on };
