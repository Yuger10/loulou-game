/* ---------- « La commande du chef » : le dessin de l'écran ----------
   Le HTML du jeu (js/features/minigames/order/order.js), selon le contrat C2
   de la spec : le client et son ticket, la palette, le plateau, les deux
   boutons. Les dumplings sont dessinés ici (couleur de SQ_COLORS, forme
   « rond » ou « lune », visage « sourit » ou « dort ») : le jeu ne dépend
   d'aucun dessin de l'île. */
import { SQ_COLORS } from '../../../entities/squishy/index.js';

/** @typedef {import('./order-build.js').OrderKind} OrderKind */
/** @typedef {import('./order-build.js').OrderQuestion} OrderQuestion */

const ORDER_INK = '#4A3A2A';

/**
 * Un dumpling : un bao tout rond aux plis sur le dessus, ou une demi-lune au
 * bord plissé ; les yeux ouverts et un sourire, ou les yeux fermés en arcs.
 * @param {OrderKind} kind
 */
function orderDumplingSVG(kind) {
  const c = SQ_COLORS[/** @type {keyof typeof SQ_COLORS} */ (kind.color)] || SQ_COLORS.rose;
  const paint = `fill="${c.fill}" stroke="${c.edge}" stroke-width="2.5" stroke-linejoin="round"`;
  const fold = `fill="none" stroke="${c.edge}" stroke-width="2" stroke-linecap="round"`;
  const body =
    kind.shape === 'lune'
      ? `<path d="M3 33 Q3 13 24 13 Q45 13 45 33 Q24 41 3 33Z" ${paint}/>
         <path d="M8 22 Q11 17 15 18 M17 16 Q21 12 25 15 M27 15 Q31 12 34 16 M36 18 Q39 18 41 23" ${fold}/>`
      : `<circle cx="24" cy="27" r="17.5" ${paint}/>
         <path d="M16 15 Q19 9 24 14 Q29 9 32 15 M24 14 V19" ${fold}/>`;
  const y = kind.shape === 'lune' ? 27 : 28;
  const eyes =
    kind.face === 'dort'
      ? `<path d="M14 ${y} Q17 ${y + 3} 20 ${y} M28 ${y} Q31 ${y + 3} 34 ${y}" fill="none" stroke="${ORDER_INK}" stroke-width="2" stroke-linecap="round"/>`
      : `<circle cx="17" cy="${y}" r="2.2" fill="${ORDER_INK}"/><circle cx="31" cy="${y}" r="2.2" fill="${ORDER_INK}"/>`;
  return `<svg viewBox="0 0 48 48" aria-hidden="true">${body}${eyes}
    <path d="M21 ${y + 5} Q24 ${y + 8} 27 ${y + 5}" fill="none" stroke="${ORDER_INK}" stroke-width="1.8" stroke-linecap="round"/>
    <ellipse cx="12" cy="${y + 5}" rx="2.6" ry="1.6" fill="#fff" opacity=".55"/><ellipse cx="36" cy="${y + 5}" rx="2.6" ry="1.6" fill="#fff" opacity=".55"/>
  </svg>`;
}

/** @param {OrderKind} kind les quatre attributs que portent ticket, palette et plateau */
function orderData(kind) {
  return `data-k="${kind.k}" data-color="${kind.color}" data-shape="${kind.shape}" data-face="${kind.face}"`;
}
/** @param {OrderKind} kind la sorte dite en entier, pour un lecteur d'écran */
function orderLabel(kind) {
  const c = SQ_COLORS[/** @type {keyof typeof SQ_COLORS} */ (kind.color)];
  return `Un dumpling ${c ? c.adj[0] : kind.color} ${kind.shape === 'lune' ? 'en demi-lune' : 'tout rond'} ${kind.face === 'dort' ? 'qui dort' : 'qui sourit'}`;
}

/** @param {OrderQuestion} q le ticket : un dessin par dumpling commandé, sorte après sorte */
function orderTicketHTML(q) {
  return q.items
    .map((x) => `<span class="order-item" ${orderData(x)}>${orderDumplingSVG(x)}</span>`.repeat(x.qty))
    .join('');
}
/** @param {OrderQuestion} q la palette : un bouton par sorte proposée */
function orderPaletteHTML(q) {
  return q.palette
    .map(
      (x) =>
        `<button type="button" class="order-pick" ${orderData(x)} aria-label="${orderLabel(x)}">${orderDumplingSVG(x)}</button>`,
    )
    .join('');
}
/** @param {OrderQuestion} q le plateau : un bouton par dumpling posé, dans l'ordre de pose */
function orderPlateHTML(q) {
  return q.plate
    .map((k, i) => {
      const kind = q.palette.find((x) => x.k === k);
      if (!kind) return '';
      return `<button type="button" class="order-placed" data-i="${i}" ${orderData(kind)} aria-label="Enlever : ${orderLabel(kind)}">${orderDumplingSVG(kind)}</button>`;
    })
    .join('');
}

/**
 * Tout l'écran sous la consigne. La palette, le plateau et la cloche sont déjà
 * dans la page, cachés tant que l'enfant regarde le ticket.
 * @param {OrderQuestion} q
 */
function orderStageHTML(q) {
  return `<div class="order-stage" id="order-stage">
    <div class="order-counter">
      <span class="order-client" aria-hidden="true">${q.client}</span>
      <div class="order-ticket" id="order-ticket">${orderTicketHTML(q)}</div>
    </div>
    <button type="button" class="btn-primary order-ready" id="order-ready" aria-label="J'ai retenu !">👍 J'ai retenu !</button>
    <div class="order-plate" id="order-plate" hidden></div>
    <div class="order-palette" id="order-palette" hidden>${orderPaletteHTML(q)}</div>
    <button type="button" class="btn-primary order-serve" id="order-serve" aria-label="Servir" hidden>🛎️ Servir</button>
  </div>`;
}

export { orderPlateHTML, orderStageHTML };
