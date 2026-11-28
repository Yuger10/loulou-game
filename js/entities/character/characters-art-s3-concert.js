/* Les mascottes SVG de l'Île du Grand Concert (saison 3, île 5). Un fichier
   frère de characters-art-s3.js (à la limite de 300 lignes du contrôle de
   qualité), qui appelle `concertArt` : même modèle, les dessins reçoivent les
   outils de characters-art.js en paramètre (`kit`). Zone sensible, comme les
   autres fichiers de dessins (test/tools/sensitive.js). */

/** @typedef {import('./characters-art.js').ArtKit} ArtKit */

/**
 * La scène : Stella la cheffe (dans le style de Viola) et Dorémi la fauvette.
 * @param {Record<string, string>} ART
 * @param {ArtKit} kit
 */
function concertArtStage(ART, kit) {
  const { AI, O, eyes, cheeks, svg, human } = kit;
  // Stella la cheffe de la grande scène : cheveux violets en queue de cheval, veste rouge à
  // paillettes dorées, un micro doré dans la main
  ART.stella = human(
    '#F2C6A5',
    '#8E5CD9',
    '#D8344B',
    `<path d="M90 30 Q116 26 112 62 Q108 84 96 88 Q104 62 92 46Z" fill="#8E5CD9" ${O()}/><circle cx="91" cy="34" r="5" fill="#FFD95A" ${O(2)}/>`,
    `<g fill="#FFD95A"><circle cx="40" cy="112" r="2.4"/><circle cx="52" cy="122" r="2.4"/><circle cx="68" cy="112" r="2.4"/><circle cx="82" cy="122" r="2.4"/><circle cx="60" cy="104" r="2.4"/></g>` +
      `<path d="M52 98 L60 110 L68 98" fill="none" stroke="#FFD95A" stroke-width="3" stroke-linejoin="round"/>` +
      `<rect x="97" y="96" width="7" height="24" rx="3.5" fill="#B8860B" ${O(2)}/><circle cx="100.5" cy="90" r="9" fill="#F7C948" ${O(2)}/><path d="M94 88 h13 M94 93 h13" stroke="#B8860B" stroke-width="1.6"/>`,
  );

  // Dorémi la petite fauvette : jaune et verte, le bec orange grand ouvert, trois notes qui s'envolent
  ART.doremi = svg(
    `<g fill="${AI}"><circle cx="86" cy="26" r="4.4"/><rect x="89" y="8" width="2.4" height="18"/><circle cx="100" cy="42" r="4"/><rect x="102.6" y="26" width="2.4" height="16"/><circle cx="72" cy="12" r="3.6"/><rect x="74.4" y="-2" width="2.2" height="14"/></g>` +
      `<path d="M22 92 Q4 100 8 116 Q22 112 30 104Z" fill="#6ED38C" ${O()}/>` +
      `<ellipse cx="58" cy="82" rx="38" ry="40" fill="#FFD95A" ${O()}/><ellipse cx="56" cy="98" rx="22" ry="20" fill="#FFF3B8"/>` +
      `<path d="M30 74 Q16 88 28 104 Q40 96 40 80Z" fill="#6ED38C" ${O()}/><path d="M86 74 Q100 88 88 104 Q76 96 76 80Z" fill="#6ED38C" ${O()}/>` +
      `<path d="M50 44 Q58 30 66 44" fill="none" stroke="#6ED38C" stroke-width="5" stroke-linecap="round"/>` +
      eyes(46, 70, 70, 4.6, 5.8) +
      `<path d="M50 80 L66 80 L58 88Z" fill="#FFA43A" ${O(2)}/><path d="M51 82 L65 82 L58 96Z" fill="#E8573A" ${O(2)}/>` +
      cheeks(36, 80, 80) +
      `<path d="M48 122 v6 M68 122 v6" stroke="#FFA43A" stroke-width="4" stroke-linecap="round"/>`,
  );
}

/**
 * L'orchestre : Xylo l'ourson et Trompi le petit éléphant (dans le style de Boumbo).
 * @param {Record<string, string>} ART
 * @param {ArtKit} kit
 */
function concertArtBand(ART, kit) {
  const { AI, O, eyes, cheeks, smile, svg } = kit;
  // Xylo l'ourson au xylophone : brun, un nœud papillon rouge, deux maillets dans les pattes
  ART.xylo = svg(
    `<path d="M22 100 L8 62 M98 100 L112 62" stroke="#C99364" stroke-width="5" stroke-linecap="round"/><circle cx="8" cy="60" r="8" fill="#F0544F" ${O(2)}/><circle cx="112" cy="60" r="8" fill="#3FC1C9" ${O(2)}/>` +
      `<circle cx="32" cy="34" r="13" fill="#A9703F" ${O()}/><circle cx="88" cy="34" r="13" fill="#A9703F" ${O()}/><circle cx="32" cy="34" r="6" fill="#E9C9A0"/><circle cx="88" cy="34" r="6" fill="#E9C9A0"/>` +
      `<ellipse cx="60" cy="78" rx="42" ry="46" fill="#A9703F" ${O()}/><ellipse cx="60" cy="104" rx="24" ry="18" fill="#E9C9A0"/>` +
      `<ellipse cx="60" cy="76" rx="16" ry="12" fill="#E9C9A0"/><ellipse cx="60" cy="71" rx="5.4" ry="3.8" fill="${AI}"/>` +
      eyes(44, 76, 60, 4.6, 5.8) +
      cheeks(32, 88, 72) +
      smile(54, 66, 78, 5) +
      `<path d="M60 96 L42 87 L44 105Z M60 96 L78 87 L76 105Z" fill="#E8344E" ${O(2)}/><circle cx="60" cy="96" r="5" fill="#B3243A" ${O(2)}/>` +
      `<circle cx="24" cy="100" r="9" fill="#A9703F" ${O(2)}/><circle cx="96" cy="100" r="9" fill="#A9703F" ${O(2)}/>`,
  );

  // Trompi le petit éléphant trompettiste : gris-bleu, de grandes oreilles roses, une petite
  // trompette dorée au bout de la trompe
  ART.trompi = svg(
    `<ellipse cx="21" cy="60" rx="18" ry="26" fill="#9FB4C7" ${O()}/><ellipse cx="22" cy="61" rx="10" ry="17" fill="#FFB3C7"/>` +
      `<ellipse cx="99" cy="60" rx="18" ry="26" fill="#9FB4C7" ${O()}/><ellipse cx="98" cy="61" rx="10" ry="17" fill="#FFB3C7"/>` +
      `<ellipse cx="60" cy="72" rx="38" ry="42" fill="#9FB4C7" ${O()}/>` +
      `<path d="M52 74 Q50 104 66 108 Q82 110 88 98" fill="none" stroke="${AI}" stroke-width="15" stroke-linecap="round"/>` +
      `<path d="M52 74 Q50 104 66 108 Q82 110 88 98" fill="none" stroke="#9FB4C7" stroke-width="10" stroke-linecap="round"/>` +
      `<path d="M84 104 L98 96 L96 108Z M94 100 L110 88 Q118 96 114 112Z" fill="#F7C948" stroke="#B8860B" stroke-width="2.5" stroke-linejoin="round"/><path d="M110 88 Q118 96 114 112" fill="none" stroke="#B8860B" stroke-width="4" stroke-linecap="round"/>` +
      eyes(44, 76, 58, 4.8, 6) +
      cheeks(32, 88, 70) +
      `<path d="M40 40 Q46 32 54 38" fill="none" stroke="#7E95AA" stroke-width="3" stroke-linecap="round"/>`,
  );
}

/**
 * Ajoute les dessins de l'Île du Grand Concert à `ART`.
 * @param {Record<string, string>} ART
 * @param {ArtKit} kit
 */
function concertArt(ART, kit) {
  concertArtStage(ART, kit);
  concertArtBand(ART, kit);
}

export { concertArt };
