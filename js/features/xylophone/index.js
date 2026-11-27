/* Slice « xylophone » (couche features) : son API publique. Les autres slices
   n'importent que ce fichier (vérifié par test/slices.test.js). */
/** @typedef {import('./xylophone.js').XyloNote} XyloNote */
export { playXylo, staffSVG, XYLO_NOTES, xyloHTML } from './xylophone.js';
