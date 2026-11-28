import { state } from '../../entities/game-state/index.js';

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

/**
 * Une clé dorée pendue à une branche, l'anneau en haut : elle se balance.
 * @param {number} x son centre
 * @param {number} y le haut de son fil
 * @param {string} swing `l1` ou `l2` : les deux balancements de l'île
 */
function isleHangingKey(x, y, swing) {
  return `<g class="ls-lolly ${swing}"><path d="M${x} ${y} v10" stroke="#8A5A2B" stroke-width="2"/>
      <circle cx="${x}" cy="${y + 16}" r="6" fill="none" stroke="#E0A800" stroke-width="3.5"/>
      <path d="M${x} ${y + 22} v20 M${x} ${y + 34} h7 M${x} ${y + 41} h6" fill="none" stroke="#E0A800" stroke-width="3.5" stroke-linecap="round"/></g>`;
}
/**
 * Le grand coffre de bois, cerclé d'or, fermé par un cadenas doré.
 * @param {number} x son bord gauche
 * @param {number} y le haut de son couvercle
 */
function isleBigChest(x, y) {
  return `<g stroke="#8A5A2B" stroke-width="3" stroke-linejoin="round">
      <path d="M${x} ${y + 46} Q${x} ${y} ${x + 64} ${y} Q${x + 128} ${y} ${x + 128} ${y + 46}Z" fill="#C8955A"/>
      <rect x="${x}" y="${y + 46}" width="128" height="62" rx="6" fill="#B07A45"/></g>
    <path d="M${x} ${y + 46} H${x + 128} M${x + 28} ${y + 6} V${y + 108} M${x + 100} ${y + 6} V${y + 108}" stroke="#E0A800" stroke-width="6"/>
    <path d="M${x + 56} ${y + 36} v-6 q8 -10 16 0 v6" fill="none" stroke="#9AA3AD" stroke-width="4"/>
    <rect x="${x + 50}" y="${y + 36}" width="28" height="26" rx="6" fill="#F7C948" stroke="#8A5A2B" stroke-width="2.5"/>
    <circle cx="${x + 64}" cy="${y + 48}" r="3" fill="#8A5A2B"/>`;
}

/**
 * Un arbre à plumes : tronc lilas, houppe de plumes roses et jaunes qui se balance.
 * @param {number} x le milieu du tronc
 * @param {number} top le haut de la houppe
 * @param {string} sway `l1` ou `l2` : le rythme du balancement
 */
function isleFeatherTree(x, top, sway) {
  const plume = (/** @type {number} */ rot, /** @type {string} */ fill) =>
    `<ellipse cx="${x}" cy="${top + 34}" rx="13" ry="34" fill="${fill}" transform="rotate(${rot} ${x} ${top + 70})"/>`;
  return `<rect x="${x - 8}" y="${top + 62}" width="16" height="${192 - top}" rx="7" fill="#BFA3EC" stroke="#8A3D6B" stroke-width="3"/>
    <g class="ls-lolly ${sway}" stroke="#C2457A" stroke-width="2.5">${plume(-44, '#FF8FB8')}${plume(-22, '#FFD95A')}${plume(0, '#FF8FB8')}${plume(22, '#FFD95A')}${plume(44, '#FF8FB8')}</g>`;
}
/**
 * Une plume qui flotte dans le ciel.
 * @param {number[]} at son milieu : x, y
 * @param {number} rot son inclinaison, en degrés
 * @param {string} fill
 */
function isleFloatingFeather(at, rot, fill) {
  const [x, y] = at;
  return `<g transform="rotate(${rot} ${x} ${y})"><path d="M${x} ${y - 18} Q${x + 12} ${y - 4} ${x} ${y + 14} Q${x - 12} ${y - 4} ${x} ${y - 18}Z" fill="${fill}" stroke="#C2457A" stroke-width="2"/>
    <path d="M${x} ${y - 12} V${y + 22}" stroke="#fff" stroke-width="2" stroke-linecap="round"/></g>`;
}

/**
 * Sur l'estrade du Grand Concert : le trésor de Zap. Avant le grand final, un
 * drap violet et un « ? » ; après, le xylophone d'or (8 lames, de la plus
 * longue à la plus courte). Jamais les deux.
 * @returns {string}
 */
function isleConcertTreasure() {
  if (!state.season3Done)
    return `<g class="ls-drap"><path d="M196 230 Q198 190 220 184 Q240 174 260 184 Q282 190 284 230Z" fill="#7B5CC0" stroke="#4B3690" stroke-width="3" stroke-linejoin="round"/>
      <text x="240" y="220" text-anchor="middle" font-size="30" font-weight="900" fill="#fff">?</text></g>`;
  const lames = Array.from({ length: 8 }, (_, i) => {
    const h = 50 - i * 3;
    return `<rect class="ls-xylo-lame" x="${197 + i * 11}" y="${204 - h / 2}" width="9" height="${h}" rx="2.5" fill="#F7C948" stroke="#B8860B" stroke-width="2"/>`;
  }).join('');
  return `<g class="ls-xylo-or"><path d="M192 196 L288 200 M192 212 L288 208" stroke="#7A4524" stroke-width="4" stroke-linecap="round"/>${lames}</g>`;
}
/**
 * Un rang de trois petites chaises, vues de dos.
 * @param {number} x le bord gauche du rang
 * @param {number} y le bas des chaises
 * @returns {string}
 */
function isleChairRow(x, y) {
  return [0, 24, 48]
    .map(
      (dx) =>
        `<path d="M${x + dx} ${y} v-18 h12 v18 M${x + dx} ${y - 8} h12" fill="none" stroke="#8A2E3B" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>`,
    )
    .join('');
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
  // Île des Coffres (saison 3) : une île de sable sur la mer turquoise ; au
  // centre le grand coffre, à gauche l'arbre à clés (elles se balancent), à
  // droite un rocher à petite porte ronde, des pièces d'or dans le sable
  coffres: (w) => `
    <g fill="#fff" opacity=".9"><ellipse cx="120" cy="60" rx="46" ry="13"/><ellipse cx="380" cy="74" rx="50" ry="14"/></g>
    <path d="M0 226 C120 216 360 216 480 226 L480 262 L0 262 Z" fill="#3FA7A3" opacity=".85"/>
    <path d="M0 250 C140 236 340 236 480 250 L480 360 L0 360 Z" fill="${w.sand}"/>
    <rect x="66" y="150" width="16" height="104" rx="6" fill="#8A5A2B"/>
    <path d="M74 186 Q40 176 30 150 M74 176 Q108 166 120 144" fill="none" stroke="#8A5A2B" stroke-width="7" stroke-linecap="round"/>
    <g fill="#6FBF73" stroke="#3F7A4A" stroke-width="3"><circle cx="46" cy="128" r="30"/><circle cx="102" cy="124" r="30"/><circle cx="74" cy="100" r="34"/></g>
    ${isleHangingKey(38, 152, 'l1')}${isleHangingKey(74, 136, 'l2')}${isleHangingKey(112, 148, 'l1')}
    ${isleBigChest(176, 150)}
    <path d="M352 256 Q346 196 396 184 Q452 190 458 256Z" fill="#B7B0A6" stroke="#7A736A" stroke-width="3" stroke-linejoin="round"/>
    <circle cx="404" cy="232" r="20" fill="#8A5A2B" stroke="#5A3A22" stroke-width="3"/><circle cx="414" cy="234" r="3" fill="#E0A800"/>
    <g fill="#FFD95A" stroke="#E0A800" stroke-width="2"><circle cx="150" cy="290" r="6"/><circle cx="322" cy="302" r="6"/><circle cx="336" cy="284" r="5"/><circle cx="118" cy="320" r="5"/></g>
    <path d="M240 360 C252 322 246 290 240 262" fill="none" stroke="#FFF4DC" stroke-width="18" stroke-linecap="round"/>
    <g fill="#fff" opacity=".7"><circle cx="130" cy="304" r="2"/><circle cx="330" cy="326" r="2"/></g>`,
  // Monde des Chatouilles (saison 3) : deux arbres à plumes qui se balancent
  // (tronc lilas, houppe de plumes roses et jaunes), trois plumes dans le
  // ciel, un petit trampoline à rayures, un nuage qui sourit
  chatouilles: (w) => `
    <g fill="#fff" stroke="#F3C4DA" stroke-width="2.5"><ellipse cx="372" cy="70" rx="54" ry="20"/><circle cx="346" cy="58" r="20"/><circle cx="386" cy="50" r="24"/></g>
    <path d="M356 70 Q372 84 388 70" fill="none" stroke="#C2457A" stroke-width="3" stroke-linecap="round"/><circle cx="360" cy="60" r="2.6" fill="#8A3D6B"/><circle cx="384" cy="60" r="2.6" fill="#8A3D6B"/>
    <path d="M0 254 C140 240 340 240 480 254 L480 360 L0 360 Z" fill="${w.land}"/>
    ${isleFeatherTree(70, 128, 'l1')}${isleFeatherTree(430, 150, 'l2')}
    ${isleFloatingFeather([150, 60], -24, '#FF8FB8')}${isleFloatingFeather([236, 96], 18, '#FFD95A')}${isleFloatingFeather([292, 44], -10, '#BFA3EC')}
    <g stroke="#8A3D6B" stroke-width="3" stroke-linejoin="round"><path d="M176 250 V226 M276 250 V226" fill="none" stroke-linecap="round"/>
      <ellipse cx="226" cy="224" rx="56" ry="13" fill="#FFF7FB"/><path d="M186 224 h14 M212 224 h14 M238 224 h14" stroke="#FF8FB8" stroke-width="6" stroke-linecap="round"/></g>
    <path d="M150 360 C168 322 196 290 196 258" fill="none" stroke="${w.sand}" stroke-width="18" stroke-linecap="round"/>
    <g fill="#fff" opacity=".7"><circle cx="110" cy="306" r="2"/><circle cx="340" cy="318" r="2"/></g>`,
  // Île du Grand Concert (saison 3) : une scène en plein air ; une estrade en
  // bois, deux rideaux rouges relevés, une guirlande d'ampoules entre deux
  // mâts, trois rangs de chaises, des notes qui flottent. Sur l'estrade, le
  // trésor de Zap : sous un drap, puis le xylophone d'or
  concert: (w) => `
    <g class="ls-cloud c3" fill="#fff" opacity=".9"><ellipse cx="96" cy="50" rx="44" ry="13"/><ellipse cx="398" cy="44" rx="50" ry="14"/></g>
    <path d="M0 254 C140 240 340 240 480 254 L480 360 L0 360 Z" fill="${w.land}"/>
    <path d="M124 252 V66 M356 252 V66" stroke="#7A4524" stroke-width="6" stroke-linecap="round"/>
    <path d="M124 72 Q240 112 356 72" fill="none" stroke="#5A3A22" stroke-width="2"/>
    <g stroke="#5A3A22" stroke-width="1.5"><circle cx="153" cy="81" r="6" fill="#F0544F"/><circle cx="182" cy="87" r="6" fill="#FFD93D"/><circle cx="211" cy="91" r="6" fill="#5CC96B"/><circle cx="240" cy="92" r="6" fill="#3FC1C9"/><circle cx="269" cy="91" r="6" fill="#4A7BEA"/><circle cx="298" cy="87" r="6" fill="#A66FE0"/><circle cx="327" cy="81" r="6" fill="#FF9A3C"/></g>
    <rect x="150" y="122" width="180" height="108" fill="#FFF8F0" opacity=".55"/>
    <g fill="#C8384B" stroke="#8A2E3B" stroke-width="3" stroke-linejoin="round">
      <path d="M146 118 Q184 150 164 196 Q154 214 146 230Z"/><path d="M334 118 Q296 150 316 196 Q326 214 334 230Z"/>
      <path d="M142 108 H338 V124 Q313.5 138 289 124 Q264.5 138 240 124 Q215.5 138 191 124 Q166.5 138 142 124Z"/></g>
    <g stroke="#7A4524" stroke-width="3" stroke-linejoin="round"><rect x="140" y="226" width="200" height="30" rx="5" fill="#E0A96D"/><path d="M140 240 H340 M190 226 V240 M290 226 V240 M240 240 V256" fill="none" stroke-width="2"/></g>
    ${isleConcertTreasure()}
    ${isleChairRow(28, 300)}${isleChairRow(40, 322)}${isleChairRow(28, 344)}
    <g fill="#fff" opacity=".85"><circle cx="70" cy="150" r="5"/><rect x="73" y="130" width="2.4" height="20"/><circle cx="412" cy="130" r="5"/><rect x="415" y="110" width="2.4" height="20"/><circle cx="400" cy="196" r="4"/><rect x="402.4" y="180" width="2" height="16"/></g>
    <path d="M240 360 C246 330 244 300 240 262" fill="none" stroke="${w.sand}" stroke-width="18" stroke-linecap="round"/>
    <g fill="#fff" opacity=".7"><circle cx="130" cy="312" r="2"/><circle cx="350" cy="322" r="2"/></g>`,
};

export { ISLE_SCENERY_S3 };
