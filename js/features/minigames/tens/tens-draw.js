/* ---------- « Les paniers de dix » : le dessin de l'écran ----------
   Le HTML du jeu (js/features/minigames/tens/tens.js), selon le contrat C1 de
   la spec : la scène `#tens-stage` (piles de cent, paniers de dix, tout seuls,
   et le vrac du mode « ranger »), les réponses, la cible et les boutons du mode
   « construire », l'écriture du mode « écrire ». Les dumplings, paniers et
   piles sont dessinés ici : le jeu ne dépend d'aucun dessin de l'île. */

/** @typedef {import('./tens-build.js').TensQuestion} TensQuestion */
/** @typedef {import('./tens-build.js').TensStock} TensStock */

// un dumpling tout rond et souriant : pâte crème, plis sur le dessus, joues roses
const TENS_DUMPLING_SVG = `<svg viewBox="0 0 40 40" aria-hidden="true">
  <path d="M4 25 Q4 8 20 8 Q36 8 36 25 Q36 34 20 34 Q4 34 4 25Z" fill="#FFF3DC" stroke="#C9A36A" stroke-width="2"/>
  <path d="M12 13 Q15 9 18 13 M18 12 Q20 8 22 12 M22 13 Q25 9 28 13" fill="none" stroke="#C9A36A" stroke-width="1.6" stroke-linecap="round"/>
  <circle cx="14.5" cy="22" r="1.7" fill="#4A3A2A"/><circle cx="25.5" cy="22" r="1.7" fill="#4A3A2A"/>
  <path d="M17 26 Q20 29 23 26" fill="none" stroke="#4A3A2A" stroke-width="1.5" stroke-linecap="round"/>
  <ellipse cx="11" cy="26" rx="2.4" ry="1.5" fill="#FF9CC8" opacity=".7"/><ellipse cx="29" cy="26" rx="2.4" ry="1.5" fill="#FF9CC8" opacity=".7"/>
</svg>`;

/**
 * Un dumpling : un bouton à toucher dans le vrac (avec son `data-id`), un
 * simple dessin ailleurs.
 * @param {number | null} id son rang dans le vrac, ou null s'il ne se touche pas
 */
function tensDumplingHTML(id) {
  if (id === null) return `<span class="tens-dumpling">${TENS_DUMPLING_SVG}</span>`;
  return `<button type="button" class="tens-dumpling" data-id="${id}" aria-label="Un dumpling à ranger">${TENS_DUMPLING_SVG}</button>`;
}
/**
 * Un panier vapeur : 2 rangées de 5 cases, pleines ou vides.
 * @param {boolean} full
 */
function tensBasketHTML(full) {
  const cells = Array.from(
    { length: 10 },
    (_, c) => `<span class="tens-cell" data-c="${c}">${full ? tensDumplingHTML(null) : ''}</span>`,
  ).join('');
  return `<div class="tens-basket${full ? ' full' : ''}">${cells}</div>`;
}
// un petit panier fermé, vu de côté : pour la bulle d'un indice
function tensBasketSVG() {
  return `<svg class="tens-mini" viewBox="0 0 40 26" aria-hidden="true">
    <rect x="3" y="9" width="34" height="14" rx="4" fill="#D9B27A" stroke="#8A5A2B" stroke-width="2"/>
    <path d="M3 16 H37" stroke="#8A5A2B" stroke-width="1.4"/>
    <path d="M5 9 Q20 -2 35 9Z" fill="#EBCB98" stroke="#8A5A2B" stroke-width="2" stroke-linejoin="round"/>
  </svg>`;
}
// une pile de cent : 10 paniers fermés empilés, en un seul dessin
function tensPileSVG() {
  const rows = Array.from(
    { length: 10 },
    (_, i) =>
      `<rect x="4" y="${10 + i * 8}" width="32" height="7" rx="2.5" fill="${i % 2 ? '#D9B27A' : '#E4C08A'}" stroke="#8A5A2B" stroke-width="1.2"/>`,
  ).join('');
  return `<svg class="tens-mini pile" viewBox="0 0 40 94" aria-hidden="true">
    <path d="M6 10 Q20 0 34 10Z" fill="#EBCB98" stroke="#8A5A2B" stroke-width="1.4" stroke-linejoin="round"/>${rows}
  </svg>`;
}

/**
 * Les trois zones de la scène, dans l'ordre du contrat : piles, paniers, tout seuls.
 * @param {TensStock} stock
 * @param {string} [baskets] le HTML des paniers, s'ils ne sont pas tous pleins (mode « ranger »)
 */
function tensGroupsHTML(stock, baskets) {
  const pile = `<div class="tens-pile" data-v="100">${tensPileSVG()}</div>`;
  return `<div class="tens-piles">${pile.repeat(stock.piles)}</div>
    <div class="tens-baskets">${baskets === undefined ? tensBasketHTML(true).repeat(stock.baskets) : baskets}</div>
    <div class="tens-loose">${tensDumplingHTML(null).repeat(stock.loose)}</div>`;
}
/** @param {TensQuestion} q la scène à l'ouverture, selon le mode */
function tensSceneHTML(q) {
  if (q.mode === 'read') return tensGroupsHTML(q);
  if (q.mode !== 'build') return tensGroupsHTML({ piles: 0, baskets: 0, loose: 0 });
  // ranger : un panier vide, l'assiette des tout seuls vide, et tout le monde en vrac
  const heap = Array.from({ length: q.n }, (_, i) => tensDumplingHTML(i)).join('');
  return `${tensGroupsHTML({ piles: 0, baskets: 0, loose: 0 }, tensBasketHTML(false))}<div class="tens-heap">${heap}</div>`;
}

/** @param {TensQuestion} q les réponses en grands nombres (cachées tant qu'on range) */
function tensOptionsHTML(q) {
  if (q.mode === 'make') return '';
  const buttons = q.options
    .map((v) => `<button type="button" class="num-btn tens-opt" data-v="${v}" aria-label="${v}"><b>${v}</b></button>`)
    .join('');
  return `<div class="num-options tens-options"${q.mode === 'build' ? ' hidden' : ''}>${buttons}</div>`;
}
/** @param {TensQuestion} q les boutons du mode « construire » ; +100 au palier 5 seulement */
function tensToolsHTML(q) {
  const tool = (/** @type {string} */ id, /** @type {string} */ label, /** @type {string} */ aria) =>
    `<button type="button" class="tens-tool" id="${id}" aria-label="${aria}">${label}</button>`;
  return `<div class="tens-tools">
    ${q.tier === 5 ? tool('tens-add100', '🗼 +100', 'Ajouter une pile de cent') : ''}
    ${tool('tens-add10', '🧺 +10', 'Ajouter un panier de dix')}
    ${tool('tens-add1', '🥟 +1', 'Ajouter un dumpling tout seul')}
    ${tool('tens-undo', '↩️', 'Enlever le dernier ajout')}
    <button type="button" class="btn-primary tens-ready" id="tens-ready" aria-label="C'est prêt !">✅ C'est prêt !</button>
  </div>`;
}
/**
 * Tout l'écran sous la consigne : la cible ou l'écriture, la scène, puis les
 * réponses ou les boutons.
 * @param {TensQuestion} q
 */
function tensStageHTML(q) {
  const target = q.mode === 'make' ? `<p class="tens-big" id="tens-target" data-target="${q.n}">${q.n}</p>` : '';
  const expr =
    q.mode === 'write'
      ? `<p class="tens-big" id="tens-expr" data-terms="${q.terms.join(',')}">${q.terms.join(' + ')}</p>`
      : '';
  return `${target}${expr}
    <div class="tens-stage" id="tens-stage" data-mode="${q.mode}">${tensSceneHTML(q)}</div>
    ${q.mode === 'make' ? tensToolsHTML(q) : tensOptionsHTML(q)}`;
}

export { tensBasketSVG, tensGroupsHTML, tensPileSVG, tensStageHTML };
