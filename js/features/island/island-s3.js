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

/**
 * Un panier vapeur en bambou, vu de côté : la tour de la cuisine en empile trois.
 * @param {number} x son bord gauche
 * @param {number} y son bord haut
 */
function isleSteamBasket(x, y) {
  return `<g stroke="#8A5A2B" stroke-width="3" stroke-linejoin="round">
      <rect x="${x}" y="${y}" width="72" height="30" rx="7" fill="#D9B27A"/>
      <ellipse cx="${x + 36}" cy="${y}" rx="36" ry="6" fill="#EBCB98"/>
    </g>
    <path d="M${x + 4} ${y + 12} H${x + 68} M${x + 4} ${y + 21} H${x + 68}" stroke="#8A5A2B" stroke-width="2" opacity=".45"/>`;
}
/**
 * Un petit dumpling souriant : pâte crème, plis en arcs, yeux et joues roses.
 * @param {number} x son centre
 * @param {number} y son centre
 */
function isleTinyDumpling(x, y) {
  return `<path d="M${x - 15} ${y + 5} Q${x - 15} ${y - 12} ${x} ${y - 12} Q${x + 15} ${y - 12} ${x + 15} ${y + 5} Q${x} ${y + 12} ${x - 15} ${y + 5}Z" fill="#FFF3DC" stroke="#C9A36A" stroke-width="2.5"/>
    <path d="M${x - 6} ${y - 8} q3 -4 6 0 q3 -4 6 0" fill="none" stroke="#C9A36A" stroke-width="2" stroke-linecap="round"/>
    <circle cx="${x - 5}" cy="${y}" r="1.8" fill="#4A3A2A"/><circle cx="${x + 5}" cy="${y}" r="1.8" fill="#4A3A2A"/>
    <path d="M${x - 3} ${y + 4} q3 3 6 0" fill="none" stroke="#4A3A2A" stroke-width="1.6" stroke-linecap="round"/>
    <ellipse cx="${x - 10}" cy="${y + 4}" rx="2.6" ry="1.6" fill="#FF9CC8" opacity=".8"/><ellipse cx="${x + 10}" cy="${y + 4}" rx="2.6" ry="1.6" fill="#FF9CC8" opacity=".8"/>`;
}
/**
 * Une tige de bambou verte, avec ses nœuds.
 * @param {number} x son bord gauche
 * @param {number} top son sommet
 */
function isleBambooStalk(x, top) {
  const knots = [top + 34, top + 72, top + 110].filter((y) => y < 246);
  return `<rect x="${x}" y="${top}" width="12" height="${252 - top}" rx="5" fill="#6FBF73" stroke="#3F7A4A" stroke-width="2.5"/>
    <path d="${knots.map((y) => `M${x} ${y} h12`).join(' ')}" stroke="#3F7A4A" stroke-width="2.5"/>
    <path d="M${x + 12} ${top + 20} q20 -14 30 -4 q-14 12 -30 4z" fill="#8FD694" stroke="#3F7A4A" stroke-width="2"/>`;
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
  // Île des Squishy Dumplings (saison 3) : une cuisine de conte ; une tour de
  // trois paniers vapeur d'où montent trois volutes, un bosquet de bambous, un
  // comptoir bas et trois petits dumplings souriants. Même bande visible que
  // les Crayons : le décor se glisse entre les personnages
  dumplings: (w) => `
    <g fill="#fff" opacity=".9"><ellipse cx="110" cy="58" rx="46" ry="13"/><ellipse cx="392" cy="70" rx="50" ry="14"/></g>
    <path d="M0 250 C140 236 340 236 480 250 L480 360 L0 360 Z" fill="${w.land}"/>
    ${isleBambooStalk(52, 96)}${isleBambooStalk(72, 128)}${isleBambooStalk(34, 150)}
    ${isleSteamBasket(190, 220)}${isleSteamBasket(190, 188)}${isleSteamBasket(190, 156)}
    <path d="M196 156 Q226 126 256 156Z" fill="#EBCB98" stroke="#8A5A2B" stroke-width="3" stroke-linejoin="round"/>
    <circle cx="226" cy="138" r="5" fill="#D9B27A" stroke="#8A5A2B" stroke-width="2.5"/>
    <g fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round" opacity=".8">
      <path d="M206 126 q-12 -14 0 -28 q12 -14 0 -28"/><path d="M226 116 q-12 -16 0 -32 q12 -16 0 -32"/><path d="M246 126 q-12 -14 0 -28 q12 -14 0 -28"/></g>
    <g stroke="#8A5A2B" stroke-width="3" stroke-linejoin="round"><rect x="356" y="222" width="100" height="34" rx="6" fill="#EBCB98"/>
      <rect x="350" y="214" width="112" height="12" rx="5" fill="#D9B27A"/></g>
    ${isleTinyDumpling(378, 202)}${isleTinyDumpling(408, 200)}${isleTinyDumpling(438, 202)}
    <path d="M250 360 C262 322 250 290 226 252" fill="none" stroke="${w.sand}" stroke-width="18" stroke-linecap="round"/>
    <g fill="#fff" opacity=".7"><circle cx="130" cy="304" r="2"/><circle cx="330" cy="326" r="2"/></g>`,
};

export { ISLE_SCENERY_S3 };
