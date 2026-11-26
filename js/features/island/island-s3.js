/* Les paysages des îles de la saison 3 « La Grande Expédition ». island.js
   les étale à la fin de ISLE_SCENERY. Même cadre que les autres paysages :
   480 × 360, le sol vers y = 250. */

/**
 * Un crayon géant planté comme un arbre : corps de couleur bordé, pointe en bois, mine.
 * @param {number} x son bord gauche
 * @param {number} top le haut de sa pointe
 * @param {string} color la couleur du corps
 */
function isleGiantCrayon(x, top, color) {
  return `<g stroke="#B8901A" stroke-width="3" stroke-linejoin="round">
      <path d="M${x} ${top + 36} L${x + 14} ${top} L${x + 28} ${top + 36}Z" fill="#F1D3A2"/>
      <rect x="${x}" y="${top + 36}" width="28" height="${222 - top}" fill="${color}"/>
    </g>
    <path d="M${x + 9.5} ${top + 12} L${x + 14} ${top} L${x + 18.5} ${top + 12}Z" fill="#4A4A4A"/>
    <path d="M${x + 9} ${top + 40} V${252} M${x + 19} ${top + 40} V${252}" stroke="#B8901A" stroke-width="2" opacity=".35"/>`;
}

/** @type {Record<string, (w: import('./island.js').World) => string>} */
const ISLE_SCENERY_S3 = {
  // Île des Crayons (saison 3) : une page de cahier ; trois crayons géants
  // plantés comme des arbres, un pont en règle sur un ruisseau de peinture,
  // des taches de couleur, une maison taille-crayon. Sur un téléphone, on voit
  // la bande de x = 45 à x = 410, et les personnages se tiennent vers x = 110
  // et x = 340 (au fond), x = 180 et x = 270 (devant) : le décor se glisse entre eux
  crayons: (w) => `
    <g fill="#fff" opacity=".9"><ellipse cx="96" cy="64" rx="44" ry="13"/><ellipse cx="388" cy="48" rx="54" ry="14"/></g>
    <path d="M0 250 C140 236 340 236 480 250 L480 360 L0 360 Z" fill="${w.land}"/>
    <path d="M0 284 H480 M0 318 H480 M0 346 H480" stroke="#fff" stroke-width="2" opacity=".4"/>
    <path d="M296 246 C282 280 330 300 316 360 L372 360 C386 304 338 284 350 246Z" fill="#6FB8F5"/>
    <path d="M310 262 C304 284 340 300 336 332" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".6"/>
    <g><rect x="266" y="286" width="122" height="20" rx="4" fill="#FFE9A8" stroke="#B8901A" stroke-width="3"/>
      <path d="M278 286 v9 M290 286 v5 M302 286 v9 M314 286 v5 M326 286 v9 M338 286 v5 M350 286 v9 M362 286 v5 M374 286 v9" stroke="#B8901A" stroke-width="2"/></g>
    ${isleGiantCrayon(64, 92, '#F7C948')}${isleGiantCrayon(146, 112, '#6FB8F5')}${isleGiantCrayon(186, 148, '#FF9CC8')}
    <g stroke="#7A1F2D" stroke-width="3" stroke-linejoin="round"><rect x="232" y="176" width="64" height="78" rx="10" fill="#E8344E"/>
      <circle cx="264" cy="226" r="16" fill="#5A1620"/><rect x="244" y="188" width="40" height="9" rx="2" fill="#DDE6EE"/></g>
    <path d="M246 176 Q240 158 254 156 Q266 154 264 164 Q262 172 272 170 Q284 168 286 176" fill="#F1D3A2" stroke="#B8901A" stroke-width="2.5" stroke-linejoin="round"/>
    <g opacity=".9"><path d="M150 304 q14 -14 30 -4 q16 -2 12 12 q4 14 -14 12 q-12 10 -24 0 q-16 -6 -4 -20z" fill="#FF8FB8"/>
      <path d="M36 322 q10 -12 24 -4 q14 0 10 12 q0 12 -16 10 q-12 6 -18 -4 q-10 -6 0 -14z" fill="#6ED38C"/>
      <path d="M420 316 q10 -10 22 -2 q12 0 8 10 q2 10 -12 8 q-10 6 -16 -2 q-10 -6 -2 -14z" fill="#BFA3EC"/></g>
    <path d="M150 360 C168 322 196 290 196 248" fill="none" stroke="${w.sand}" stroke-width="18" stroke-linecap="round"/>
    <g fill="#fff" opacity=".7"><circle cx="120" cy="300" r="2"/><circle cx="250" cy="330" r="2"/></g>`,
};

export { ISLE_SCENERY_S3 };
