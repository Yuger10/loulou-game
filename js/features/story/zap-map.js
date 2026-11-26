/* ---------- La carte de Zap, le fil de la saison 3 « La Grande Expédition » ----------
   Zap le super-héros a trouvé une vieille carte d'explorateur, déchirée en
   cinq morceaux que le vent a emportés sur cinq îles. Chaque énigme d'île
   résolue rend son morceau : c'est la progression visible de la saison (comme
   Grisou pour la saison 2, grisou.js).
   Rien n'est stocké : les morceaux trouvés se lisent dans `state.storySolved`.
   Chaque morceau garde sa place, de gauche à droite dans l'ordre des îles,
   même si l'enfant résout les îles dans le désordre.
   Dessin SVG, sans image. */
import { state } from '../../entities/game-state/index.js';

// les îles de la saison 3, dans l'ordre de leurs niveaux (conductor/niveaux.md) :
// un morceau de carte par île
const ZAP_MAP_PIECES = ['crayons', 'dumplings', 'coffres', 'chatouilles', 'concert'];

// les morceaux déjà trouvés (énigme de l'île résolue), dans l'ordre de la carte
/** @returns {string[]} */
function zapMapFound() {
  const solved = state.storySolved || {};
  return ZAP_MAP_PIECES.filter((id) => !!solved[id]);
}
/** @returns {number} */
function zapMapPieces() {
  return zapMapFound().length;
}

// ce que la voix dit de la carte (bouton 🔈 du journal, fin d'une énigme)
/** @param {number} n les morceaux trouvés @returns {string} */
function zapMapSay(n) {
  const all = ZAP_MAP_PIECES.length;
  if (n <= 0)
    return "La carte de Zap : aucun morceau pour l'instant. Résous l'énigme de chaque île pour les retrouver !";
  if (n >= all) return `La carte de Zap est complète ! Les ${all} morceaux sont réunis.`;
  return `La carte de Zap : tu as trouvé ${n} morceau${n > 1 ? 'x' : ''} sur ${all}.`;
}

// le cadre de la carte dans le dessin (viewBox 0 0 200 120) et la largeur d'un morceau
const ZM = { left: 10, top: 16, bottom: 104, width: 36 };
// un bord déchiré, de haut en bas : il zigzague autour de la verticale `x`
// (les deux bords extérieurs de la carte restent presque droits)
/** @param {number} x @param {boolean} outer @returns {[number, number][]} */
function zapTornEdge(x, outer) {
  const k = outer ? 1 : 3.5;
  return [
    [x, ZM.top],
    [x + k, 32],
    [x - k, 48],
    [x + k, 64],
    [x - k, 80],
    [x + k * 0.6, 94],
    [x, ZM.bottom],
  ];
}
// le contour du morceau `i` : il part de son coin haut gauche (`M x y`), longe
// son bord droit vers le bas, puis remonte son bord gauche
/** @param {number} i @returns {string} */
function zapPiecePath(i) {
  const n = ZAP_MAP_PIECES.length;
  const x0 = ZM.left + i * ZM.width,
    x1 = x0 + ZM.width;
  const right = zapTornEdge(x1, i === n - 1),
    left = zapTornEdge(x0, i === 0).reverse();
  const pts = [...right, ...left.slice(0, -1)];
  return `M ${x0} ${ZM.top} ` + pts.map(([x, y]) => `L ${x} ${y}`).join(' ') + ' Z';
}
// le bout de chemin en pointillés rouges d'un morceau trouvé ; le dernier
// morceau porte la croix du trésor
/** @param {number} i @returns {string} */
function zapPieceRoute(i) {
  const x0 = ZM.left + i * ZM.width + 5,
    x1 = x0 + ZM.width - 10;
  const y0 = i % 2 ? 46 : 74,
    y1 = i % 2 ? 74 : 46;
  const last = i === ZAP_MAP_PIECES.length - 1;
  const route = `<path class="zm-route" d="M ${x0} ${y0} Q ${(x0 + x1) / 2} ${y0} ${last ? x1 - 8 : x1} ${last ? 60 : y1}" fill="none" stroke="#C0392B" stroke-width="2.4" stroke-linecap="round" stroke-dasharray="1 5"/>`;
  const cross = last
    ? `<path class="zm-cross" d="M ${x1 - 9} 53 l 10 14 M ${x1 + 1} 53 l -10 14" fill="none" stroke="#C0392B" stroke-width="3.4" stroke-linecap="round"/>`
    : '';
  return route + cross;
}

/**
 * La carte, en 5 morceaux : ceux de `found` sont dessinés (vieux papier, bout
 * de chemin), les autres ne sont qu'un contour en tirets.
 * @param {string[]} found les îles dont le morceau est trouvé
 * @param {{ fresh?: string }} [opts] `fresh` : le morceau qui vient d'être gagné (il brille)
 * @returns {string}
 */
function zapMapSVG(found, opts = {}) {
  const pieces = ZAP_MAP_PIECES.map((id, i) => {
    const has = found.includes(id);
    const cls = `zm-piece${has && opts.fresh === id ? ' zm-new' : ''}`;
    const look = has
      ? 'fill="#F3DDAF" stroke="#8A5A2B" stroke-width="2"'
      : 'fill="none" stroke="#C9B79A" stroke-width="1.6" stroke-dasharray="4 4"';
    return `<path class="${cls}" data-piece="${id}" data-found="${has}" d="${zapPiecePath(i)}" ${look} stroke-linejoin="round"/>${has ? zapPieceRoute(i) : ''}`;
  }).join('');
  // le contour des morceaux trouvés est redessiné par-dessus : le bord en tirets
  // d'un voisin manquant ne le recouvre pas
  const edges = ZAP_MAP_PIECES.map((id, i) =>
    found.includes(id)
      ? `<path class="zm-edge" d="${zapPiecePath(i)}" fill="none" stroke="#8A5A2B" stroke-width="2" stroke-linejoin="round"/>`
      : '',
  ).join('');
  return `<svg class="zap-map" viewBox="0 0 200 120" role="img" aria-label="${zapMapSay(found.length)}" data-found="${found.length}">${pieces}${edges}</svg>`;
}

// la ligne « carte de Zap » du journal : le dessin, le compte et le bouton 🔈
/** @returns {string} */
function zapMapRowHTML() {
  const n = zapMapPieces();
  return `<div class="story-zapmap-row">
      ${zapMapSVG(zapMapFound())}
      <span class="story-zapmap-count">🗺️ La carte de Zap : ${n} / ${ZAP_MAP_PIECES.length}</span>
      <button type="button" class="btn-speak" data-say="${zapMapSay(n)}" aria-label="Écouter">🔈</button>
    </div>`;
}

export { ZAP_MAP_PIECES, zapMapFound, zapMapPieces, zapMapRowHTML, zapMapSay, zapMapSVG };
