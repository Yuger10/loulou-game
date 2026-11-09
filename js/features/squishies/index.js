/* Slice « squishies » (couche features) : son API publique. Les autres slices
   n'importent que ce fichier (vérifié par test/slices.test.js). */
export {
  addSquishyBox, addStorySquishyBox, buySquishyBox, SQ_BOX_PRICE, SQ_SERIES_BONUS, SQ_TRADE_COST,
  squishyBoxCount, squishyDuplicates, squishyMissing, squishyShopState, tradeDuplicatesFor
} from './squishies.js';
export {
  openSquishyRoom, renderSquishyBadge, squishyArtSVG, squishyBoxRewardHTML, squishyBoxSVG,
  squishySessionHello
} from './squishy-room.js';
