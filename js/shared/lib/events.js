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
const busListeners = new Map();   // nom → [fonctions]

function on(name, fn){
  (busListeners.get(name) || busListeners.set(name, []).get(name)).push(fn);
  return ()=> off(name, fn);
}
function off(name, fn){
  const list = busListeners.get(name);
  if(!list) return;
  const i = list.indexOf(fn);
  if(i >= 0) list.splice(i, 1);
}
function emit(name, ...args){
  const list = (busListeners.get(name) || []).slice();
  return list.map(fn=>{
    try{ return fn(...args); }
    catch(e){ setTimeout(()=>{ throw e; }); return undefined; }
  });
}

export { emit, on };
