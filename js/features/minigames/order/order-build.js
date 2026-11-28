/* ---------- « La commande du chef » : les tirages ----------
   La commande d'une mission (js/features/minigames/order/order.js) : des
   sortes de dumplings (couleur, forme, visage) et leur quantité, la palette
   proposée, la phrase du client (règle R2 de la spec) et la signature qui dit
   si deux commandes sont les mêmes. Les paliers : `orderRound`
   (js/entities/difficulty/difficulty-s3.js). */
import { orderRound } from '../../../entities/difficulty/index.js';
import { SQ_COLORS } from '../../../entities/squishy/index.js';
import { pickRandom, random, shuffle } from '../../../shared/lib/index.js';

/** @typedef {import('../../../entities/difficulty/index.js').OrderRound} OrderRound */
/**
 * Une sorte de dumpling ; `k` : sa clé, toujours en trois parties (`rose-rond-sourit`).
 * @typedef {{ color: string, shape: 'rond' | 'lune', face: 'sourit' | 'dort', k: string }} OrderKind
 */
/** @typedef {OrderKind & { qty: number }} OrderItem une sorte commandée, et combien */
/**
 * La question d'une mission. `phase` : `see` (le ticket est montré), `make`
 * (l'enfant prépare le plateau), `won` ; `plate` : les clés posées, dans l'ordre.
 * @typedef {{
 *   tier: number, items: OrderItem[], palette: OrderKind[], client: string,
 *   phase: 'see' | 'make' | 'won', plate: string[],
 * }} OrderQuestion
 */

const ORDER_CLIENTS = ['🐰', '🦊', '🐻', '🐨', '🐸', '🐧'];
const ORDER_NUMBERS = ['', 'un', 'deux', 'trois'];

/** @param {number} dd le palier de difficulté, ramené de 1 à 5 */
function orderTier(dd) {
  return Math.max(1, Math.min(5, Math.round(Number(dd)) || 1));
}
/**
 * Toutes les sortes du palier : un attribut inactif garde sa valeur par défaut
 * (forme « rond », visage « sourit »).
 * @param {OrderRound} cfg
 * @returns {OrderKind[]}
 */
function orderKinds(cfg) {
  /** @type {Array<OrderKind['shape']>} */
  const shapes = cfg.attrs.includes('shape') ? ['rond', 'lune'] : ['rond'];
  /** @type {Array<OrderKind['face']>} */
  const faces = cfg.attrs.includes('face') ? ['sourit', 'dort'] : ['sourit'];
  return cfg.colors.flatMap((color) =>
    shapes.flatMap((shape) => faces.map((face) => ({ color, shape, face, k: `${color}-${shape}-${face}` }))),
  );
}
/**
 * Par combien d'attributs deux sortes diffèrent-elles ?
 * @param {OrderKind} a
 * @param {OrderKind} b
 */
function orderApart(a, b) {
  return Number(a.color !== b.color) + Number(a.shape !== b.shape) + Number(a.face !== b.face);
}

/**
 * Les quantités : 1 à 3 par sorte, un total dans les bornes du palier.
 * @param {OrderRound} cfg
 * @returns {number[]}
 */
function orderQuantities(cfg) {
  const total = (/** @type {number[]} */ list) => list.reduce((a, b) => a + b, 0);
  for (let k = 0; k < 60; k++) {
    const list = Array.from({ length: cfg.kinds }, () => 1 + Math.floor(random() * 3));
    if (total(list) >= cfg.min && total(list) <= cfg.max) return list;
  }
  // jamais atteint en pratique : un de chaque, puis un de plus à tour de rôle
  const list = Array.from({ length: cfg.kinds }, () => 1);
  for (let i = 0; total(list) < cfg.min; i++) list[i % list.length]++;
  return list;
}
/**
 * La palette : les sortes commandées, puis celles qui ressemblent à une sorte
 * commandée à un seul attribut près (les vrais pièges), puis d'autres ; mélangée.
 * @param {OrderItem[]} items
 * @param {OrderRound} cfg
 * @returns {OrderKind[]}
 */
function orderPalette(items, cfg) {
  const others = orderKinds(cfg).filter((x) => !items.some((y) => y.k === x.k));
  const isNear = (/** @type {OrderKind} */ x) => items.some((y) => orderApart(x, y) === 1);
  const near = shuffle(others.filter(isNear));
  const far = shuffle(others.filter((x) => !isNear(x)));
  const kinds = items.map(({ color, shape, face, k }) => ({ color, shape, face, k }));
  return shuffle([...kinds, ...near, ...far].slice(0, cfg.palette));
}
/**
 * Une commande tirée au hasard.
 * @param {number} tier
 * @returns {OrderQuestion}
 */
function orderDraw(tier) {
  const cfg = orderRound(tier);
  const qty = orderQuantities(cfg);
  const items = shuffle(orderKinds(cfg))
    .slice(0, cfg.kinds)
    .map((kind, i) => ({ ...kind, qty: qty[i] }));
  return {
    tier,
    items,
    palette: orderPalette(items, cfg),
    client: pickRandom(ORDER_CLIENTS),
    phase: 'see',
    plate: [],
  };
}

/**
 * La signature d'une commande : ses couples sorte et quantité, triés (l'ordre ne compte pas).
 * @param {Pick<OrderQuestion, 'items'>} q
 */
function orderSignature(q) {
  return q.items
    .map((x) => `${x.k}×${x.qty}`)
    .sort()
    .join('|');
}
// la commande précédente : une relance en tire toujours une AUTRE (anti-devinette)
let orderLast = '';
/**
 * La commande d'une mission : au plus 20 tirages pour qu'elle diffère de la précédente.
 * @param {number} dd le palier de difficulté
 * @returns {OrderQuestion}
 */
function orderNewQuestion(dd) {
  const tier = orderTier(dd);
  let q = orderDraw(tier);
  for (let k = 1; k < 20 && orderSignature(q) === orderLast; k++) q = orderDraw(tier);
  orderLast = orderSignature(q);
  return q;
}

/**
 * Une sorte dite par le client : « deux dumplings roses tout ronds qui sourient ».
 * La forme et le visage ne sont dits que s'ils comptent au palier.
 * @param {OrderItem} x
 * @param {OrderRound} cfg
 */
function orderSayItem(x, cfg) {
  const many = x.qty > 1;
  const color = SQ_COLORS[/** @type {keyof typeof SQ_COLORS} */ (x.color)];
  const words = [ORDER_NUMBERS[x.qty], many ? 'dumplings' : 'dumpling', color ? color.adj[many ? 1 : 0] : x.color];
  if (cfg.attrs.includes('shape')) words.push(x.shape === 'lune' ? 'en demi-lune' : many ? 'tout ronds' : 'tout rond');
  if (cfg.attrs.includes('face')) {
    const sleeps = many ? 'qui dorment' : 'qui dort';
    words.push(x.face === 'dort' ? sleeps : many ? 'qui sourient' : 'qui sourit');
  }
  return words.join(' ');
}
/**
 * La phrase du client (règle R2) : les sortes jointes par « , » puis « et ».
 * @param {Pick<OrderQuestion, 'tier' | 'items'>} q
 */
function orderSay(q) {
  const cfg = orderRound(q.tier);
  const parts = q.items.map((x) => orderSayItem(x, cfg));
  const last = parts.pop();
  const list = parts.length ? `${parts.join(', ')} et ${last}` : last;
  return `Bonjour ! Je voudrais ${list}, s'il te plaît !`;
}

export { orderNewQuestion, orderSay, orderSignature };
