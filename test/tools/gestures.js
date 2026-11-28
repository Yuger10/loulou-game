// Pilote de test des jeux à geste (« Trace avec ton doigt », track
// monde-crayons) : un élément de solution qui porte `data-pts` (les points du
// modèle, unités du carré) et `data-pad` (l'id du carré) se joue en traçant,
// pas en cliquant. jsdom n'a pas de mise en page : le pilote donne au carré
// une taille de 100 × 100, les coordonnées de l'écran valent alors celles du
// carré. Aucun code de test dans le jeu.

// Trace l'élément `el` sur son carré ; `pts` remplace les points du modèle
// (un tracé raté, pour les essais). Renvoie false si le carré attend un autre
// trait que celui de `el`.
function traceAlong(w, el, pts) {
  const d = w.document;
  const pad = d.getElementById(el.dataset.pad);
  if (!pad || pad.dataset.g !== el.dataset.g || pad.dataset.s !== el.dataset.s) return false;
  const points = pts || JSON.parse(el.dataset.pts);
  pad.getBoundingClientRect = () => ({ left: 0, top: 0, width: 100, height: 100, right: 100, bottom: 100 });
  const [down, move, up] = w.eval('TRACE_EVENTS');
  const send = (type, [x, y]) => pad.dispatchEvent(new w.MouseEvent(type, { clientX: x, clientY: y, bubbles: true }));
  send(down, points[0]);
  points.forEach((p) => send(move, p));
  send(up, points[points.length - 1]);
  return true;
}

// Joue un élément de solution : en traçant s'il porte `data-pts`, sinon d'un clic.
function playStep(w, el) {
  if (el.dataset && el.dataset.pts) return traceAlong(w, el);
  el.click();
  return true;
}

module.exports = { traceAlong, playStep };
