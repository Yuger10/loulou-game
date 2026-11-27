/* Les mascottes SVG de la saison 3 « La Grande Expédition ». Même modèle que
   characters-art-s2.js : les dessins reçoivent les outils de characters-art.js
   en paramètre (`kit`). Une fonction par île, appelée par season3Art. */

import { concertArt } from './characters-art-s3-concert.js';
/** @typedef {import('./characters-art.js').ArtKit} ArtKit */

/**
 * L'Île des Crayons (saison 3, île 1) : quatre objets de la trousse, dans le
 * style de Boumbo (un objet rond et doux, de grands yeux, un sourire).
 * @param {Record<string, string>} ART
 * @param {ArtKit} kit
 */
function crayonsArt(ART, kit) {
  const { AI, O, eyes, cheeks, smile, svg } = kit;
  // Gribouille le crayon à papier : un crayon jaune debout, pointe en haut, gomme rose en bas, petits bras
  ART.gribouille = svg(
    `<path d="M38 80 Q20 84 18 68 M82 80 Q100 84 102 68" fill="none" stroke="${AI}" stroke-width="4.5" stroke-linecap="round"/>` +
      `<path d="M38 46 L60 6 L82 46Z" fill="#F1D3A2" ${O()}/><path d="M52.5 20 L60 6 L67.5 20Z" fill="#4A4A4A"/>` +
      `<path d="M38 46 Q45.5 54 53 46 Q60 54 67 46 Q74.5 54 82 46 V106 H38Z" fill="#F7C948" ${O()}/>` +
      `<path d="M53 52 V104 M67 52 V104" stroke="#B8901A" stroke-width="2" opacity=".55"/>` +
      `<rect x="36" y="103" width="48" height="10" fill="#DDE6EE" ${O(2)}/><path d="M36 108 H84" stroke="#A7BBC7" stroke-width="1.6"/>` +
      `<rect x="38" y="113" width="44" height="14" rx="6" fill="#FF9CC8" ${O()}/>` +
      eyes(50, 70, 68, 4.8, 6) +
      cheeks(43, 77, 80) +
      smile(53, 67, 81, 7),
  );

  // Gommette la gomme rose : une gomme arrondie, un bandeau bleu et un nœud
  ART.gommette = svg(
    `<rect x="18" y="30" width="84" height="92" rx="24" fill="#FF9CC8" ${O()}/>` +
      `<path d="M30 48 Q40 38 54 40" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".6"/>` +
      `<path d="M18 90 H102 V108 H18Z" fill="#6FB8F5" ${O()}/><path d="M24 99 H96" stroke="#fff" stroke-width="2.5" stroke-dasharray="2 8" stroke-linecap="round" opacity=".7"/>` +
      `<path d="M60 26 L38 12 L40 38Z M60 26 L82 12 L80 38Z" fill="#6FB8F5" ${O(2)}/><circle cx="60" cy="26" r="6.5" fill="#3C8FC0" ${O(2)}/>` +
      eyes(46, 74, 62, 4.8, 6) +
      cheeks(33, 87, 74) +
      smile(52, 68, 74, 7),
  );
}

/**
 * L'Île des Crayons, la suite : le taille-crayon et le pinceau.
 * @param {Record<string, string>} ART
 * @param {ArtKit} kit
 */
function crayonsArtTools(ART, kit) {
  const { AI, O, eyes, cheeks, smile, svg } = kit;
  // Taillou le taille-crayon : un cube rouge, un trou rond sur le côté, un copeau de bois ondulé en chapeau
  ART.taillou = svg(
    `<path d="M32 38 Q26 16 42 13 Q56 11 54 23 Q52 31 62 29 Q74 27 72 16 Q86 9 90 24 Q92 32 86 38Z" fill="#F1D3A2" ${O(2)}/>` +
      `<path d="M39 31 Q36 20 45 19 M66 25 Q77 23 77 17" fill="none" stroke="#C99364" stroke-width="2.5" stroke-linecap="round"/>` +
      `<rect x="20" y="36" width="80" height="84" rx="14" fill="#E8344E" ${O()}/>` +
      `<path d="M30 50 Q40 42 52 44" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".5"/>` +
      `<circle cx="84" cy="100" r="9" fill="#5A1620" ${O(2)}/>` +
      `<rect x="28" y="96" width="36" height="9" rx="2" fill="#DDE6EE" ${O(2)}/><circle cx="46" cy="100.5" r="2" fill="${AI}"/>` +
      eyes(46, 74, 66, 4.8, 6) +
      cheeks(33, 87, 78) +
      smile(52, 68, 78, 7),
  );

  // Aquarelle le pinceau magique : manche en bois, bague argentée, poils violets en coiffure, un béret
  ART.aquarelle = svg(
    `<path d="M36 52 Q28 28 46 14 Q52 28 60 6 Q68 28 76 14 Q92 30 84 52Z" fill="#BFA3EC" ${O()}/>` +
      `<path d="M48 46 Q48 32 54 25 M68 46 Q72 34 69 25" fill="none" stroke="#8E6FD0" stroke-width="2.5" stroke-linecap="round"/>` +
      `<ellipse cx="76" cy="16" rx="18" ry="8" fill="#E8344E" ${O(2)} transform="rotate(14 76 16)"/><path d="M78 8 L81 2" stroke="${AI}" stroke-width="2.5" stroke-linecap="round"/>` +
      `<rect x="34" y="50" width="52" height="14" rx="3" fill="#DDE6EE" ${O()}/><path d="M36 57 H84" stroke="#A7BBC7" stroke-width="2"/>` +
      `<path d="M38 64 H82 L76 118 Q60 130 44 118Z" fill="#C99364" ${O()}/>` +
      `<path d="M46 72 Q46 92 50 108" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".4"/>` +
      eyes(50, 70, 86, 4.4, 5.6) +
      cheeks(43, 77, 97) +
      smile(54, 66, 97, 6),
  );
}

/**
 * L'Île des Squishy Dumplings (saison 3, île 2) : le style « tout rond, le
 * visage sur le corps » du Pays Squishy. Bao le chef et Bambou la pousse.
 * @param {Record<string, string>} ART
 * @param {ArtKit} kit
 */
function dumplingsArt(ART, kit) {
  const { O, eyes, cheeks, smile, svg } = kit;
  // Bao le chef dumpling : un gros dumpling crème, plis sur le dessus, toque blanche, tablier bleu
  ART.bao = svg(
    `<path d="M14 86 Q14 38 60 38 Q106 38 106 86 Q106 124 60 124 Q14 124 14 86Z" fill="#FFF3DC" ${O()}/>` +
      `<path d="M40 52 Q46 44 52 52 M54 50 Q60 42 66 50 M68 52 Q74 44 80 52" fill="none" stroke="#C9A36A" stroke-width="3" stroke-linecap="round"/>` +
      `<path d="M40 30 Q28 10 46 10 Q52 0 64 4 Q78 0 80 12 Q96 12 82 30Z" fill="#fff" ${O()}/>` +
      `<rect x="38" y="28" width="46" height="12" rx="4" fill="#fff" ${O(2)}/>` +
      `<path d="M32 100 Q60 112 88 100 L84 120 Q60 128 36 120Z" fill="#6FB8F5" ${O(2)}/>` +
      `<path d="M54 108 H66" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".7"/>` +
      eyes(48, 72, 72, 4.8, 6) +
      cheeks(36, 84, 84) +
      smile(52, 68, 84, 7),
  );

  // Bambou la pousse de bambou : une tige verte ronde à nœuds, deux feuilles en couettes, un petit panier sur la tête
  ART.bambou = svg(
    `<path d="M32 58 Q4 46 10 22 Q30 30 38 50Z M88 58 Q116 46 110 22 Q90 30 82 50Z" fill="#8FD694" ${O(2)}/>` +
      `<rect x="28" y="34" width="64" height="90" rx="30" fill="#6FBF73" ${O()}/>` +
      `<path d="M30 60 Q60 67 90 60 M30 100 Q60 107 90 100" fill="none" stroke="#3F7A4A" stroke-width="3" stroke-linecap="round" opacity=".6"/>` +
      `<path d="M38 50 Q40 42 48 40" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".5"/>` +
      `<path d="M44 22 Q60 6 76 22Z" fill="#EBCB98" stroke="#8A5A2B" stroke-width="3" stroke-linejoin="round"/>` +
      `<rect x="42" y="20" width="36" height="16" rx="5" fill="#D9B27A" stroke="#8A5A2B" stroke-width="3"/><path d="M42 28 H78" stroke="#8A5A2B" stroke-width="2"/>` +
      eyes(48, 72, 78, 4.8, 6) +
      cheeks(38, 82, 88) +
      smile(52, 68, 88, 7),
  );
}

/**
 * L'Île des Squishy Dumplings, la suite : Sésame la serveuse et Théo la théière.
 * @param {Record<string, string>} ART
 * @param {ArtKit} kit
 */
function dumplingsArtService(ART, kit) {
  const { AI, O, eyes, cheeks, smile, svg } = kit;
  // Sésame la petite serveuse : un dumpling rose en demi-lune, graines de sésame sur la tête, un plateau à la main
  ART.sesame = svg(
    `<path d="M96 92 Q108 88 106 74" fill="none" stroke="${AI}" stroke-width="4.5" stroke-linecap="round"/>` +
      `<ellipse cx="104" cy="70" rx="12" ry="4" fill="#DDE6EE" ${O(2)}/><path d="M97 68 Q104 56 111 68Z" fill="#FFF3DC" ${O(2)}/>` +
      `<path d="M10 96 Q10 44 56 44 Q102 44 102 96 Q56 122 10 96Z" fill="#FF9CC8" ${O()}/>` +
      `<path d="M20 70 Q26 58 34 61 M38 55 Q46 47 54 52 M60 52 Q68 47 76 55 M80 61 Q88 58 94 70" fill="none" stroke="#C9497F" stroke-width="3" stroke-linecap="round"/>` +
      `<g fill="#FFF3DC" stroke="#C9A36A" stroke-width="1"><ellipse cx="44" cy="62" rx="2.4" ry="3.6" transform="rotate(-20 44 62)"/><ellipse cx="56" cy="59" rx="2.4" ry="3.6"/><ellipse cx="68" cy="62" rx="2.4" ry="3.6" transform="rotate(20 68 62)"/></g>` +
      eyes(44, 68, 82, 4.8, 6) +
      cheeks(32, 80, 92) +
      smile(48, 64, 92, 7),
  );

  // Théo la théière : une théière ronde vert jade, le visage sur le ventre, un bec, un petit nuage de vapeur
  ART.theo = svg(
    `<path d="M94 30 Q84 20 94 13 Q90 3 101 3 Q113 5 107 15 Q116 24 104 31Z" fill="#fff" ${O(2)}/>` +
      `<path d="M90 78 Q112 72 108 44 L97 46 Q100 60 86 66Z" fill="#7FCFA6" ${O()}/>` +
      `<path d="M24 62 Q4 64 8 86 Q12 102 28 100" fill="none" stroke="#4FA47C" stroke-width="7" stroke-linecap="round"/>` +
      `<ellipse cx="58" cy="86" rx="40" ry="37" fill="#7FCFA6" ${O()}/>` +
      `<path d="M30 70 Q36 58 48 56" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".5"/>` +
      `<path d="M34 54 Q58 38 82 54Z" fill="#A5E0C2" ${O(2)}/><circle cx="58" cy="41" r="5.5" fill="#4FA47C" ${O(2)}/>` +
      eyes(46, 70, 84, 4.8, 6) +
      cheeks(34, 82, 94) +
      smile(50, 66, 94, 7),
  );
}

/**
 * L'Île des Coffres (saison 3, île 3) : Clémence la gardienne des clés et
 * Kadi le cadenas (rond et doux, comme Boumbo).
 * @param {Record<string, string>} ART
 * @param {ArtKit} kit
 */
function coffresArt(ART, kit) {
  const { AI, O, eyes, cheeks, smile, svg, human } = kit;
  // Clémence : cheveux bruns en tresse, robe bleu canard, un gros trousseau de clés dorées à la ceinture
  ART.clemence = human(
    '#F2C6A0',
    '#6B3F1D',
    '#1F7A8C',
    `<path d="M90 50 Q104 62 98 80 Q94 92 100 104" fill="none" stroke="#6B3F1D" stroke-width="9" stroke-linecap="round"/>` +
      `<path d="M93 62 l8 4 M94 76 l8 2 M95 90 l8 4" stroke="#4A2A12" stroke-width="2" stroke-linecap="round"/>` +
      `<circle cx="100" cy="106" r="4.5" fill="#E8344E" ${O(2)}/>`,
    `<path d="M30 112 Q60 120 90 112" fill="none" stroke="#6B3F1D" stroke-width="4" stroke-linecap="round"/>` +
      `<circle cx="44" cy="118" r="7" fill="none" stroke="#E0A800" stroke-width="3"/>` +
      `<g fill="#FFD95A" stroke="#B98500" stroke-width="1.5" stroke-linejoin="round"><path d="M36 122 l-6 6 l3 1 l1 3 l6 -6z"/><path d="M44 125 v8 h3 v-2 h2 v-2 h-2 v-4z"/><path d="M52 122 l6 6 l-3 1 l-1 3 l-6 -6z"/></g>`,
  );

  // Kadi le petit cadenas à code : un cadenas doré tout rond, l'anse en haut, une molette à chiffres sur le ventre
  ART.kadi = svg(
    `<path d="M38 56 V34 Q38 12 60 12 Q82 12 82 34 V56" fill="none" stroke="#9AA3AD" stroke-width="9" stroke-linecap="round"/>` +
      `<rect x="18" y="48" width="84" height="76" rx="30" fill="#F7C948" ${O()}/>` +
      `<path d="M30 66 Q38 56 52 56" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".6"/>` +
      `<rect x="40" y="96" width="40" height="16" rx="6" fill="#fff" ${O(2)}/><path d="M53 96 V112 M67 96 V112" stroke="${AI}" stroke-width="1.6"/>` +
      `<path d="M46.5 100 v8 M57 100.5 h6 v3.5 h-6 v3.5 h6 M70.5 100.5 h6 v7 h-6 M71.5 104 h5" fill="none" stroke="${AI}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>` +
      eyes(46, 74, 72, 4.8, 6) +
      cheeks(33, 87, 84) +
      smile(52, 68, 84, 7),
  );
}

/**
 * L'Île des Coffres, la suite : Grignote la souris et Pinçou le crabe.
 * @param {Record<string, string>} ART
 * @param {ArtKit} kit
 */
function coffresArtFriends(ART, kit) {
  const { AI, O, eyes, cheeks, smile, svg } = kit;
  // Grignote la souris qui compte tout : grise, grandes oreilles roses, lunettes rondes, une pièce d'or dans les pattes
  ART.grignote = svg(
    `<circle cx="28" cy="38" r="20" fill="#B9BEC9" ${O()}/><circle cx="28" cy="38" r="11" fill="#FFB3C7"/>` +
      `<circle cx="92" cy="38" r="20" fill="#B9BEC9" ${O()}/><circle cx="92" cy="38" r="11" fill="#FFB3C7"/>` +
      `<ellipse cx="60" cy="80" rx="40" ry="42" fill="#B9BEC9" ${O()}/><ellipse cx="60" cy="98" rx="22" ry="20" fill="#E9ECF2"/>` +
      eyes(46, 74, 70, 4.4, 5.6) +
      `<g fill="none" stroke="${AI}" stroke-width="2.5"><circle cx="46" cy="70" r="10"/><circle cx="74" cy="70" r="10"/><path d="M56 70 H64"/></g>` +
      `<ellipse cx="60" cy="82" rx="3.5" ry="2.6" fill="#FF8FA3"/>` +
      cheeks(34, 86, 84) +
      smile(54, 66, 87, 5) +
      `<circle cx="60" cy="108" r="11" fill="#FFD95A" stroke="#B98500" stroke-width="2.5"/><circle cx="60" cy="108" r="6.5" fill="none" stroke="#B98500" stroke-width="1.6"/>` +
      `<ellipse cx="46" cy="108" rx="6" ry="4.5" fill="#B9BEC9" ${O(2)}/><ellipse cx="74" cy="108" rx="6" ry="4.5" fill="#B9BEC9" ${O(2)}/>`,
  );

  // Pinçou le crabe serrurier : orange, deux grosses pinces, une petite clé tenue dans une pince
  ART.pincou = svg(
    `<path d="M26 84 Q8 70 12 48 M94 84 Q112 70 108 48" fill="none" stroke="#E86A2E" stroke-width="7" stroke-linecap="round"/>` +
      `<path d="M2 44 Q2 24 20 24 Q30 26 28 38 L18 36 L24 48 Q10 54 2 44Z" fill="#FF8A4C" ${O()}/>` +
      `<path d="M118 44 Q118 24 100 24 Q90 26 92 38 L102 36 L96 48 Q110 54 118 44Z" fill="#FF8A4C" ${O()}/>` +
      `<path d="M100 22 v-14 M100 8 h6 M100 13 h5" stroke="#B98500" stroke-width="3" stroke-linecap="round"/><circle cx="100" cy="26" r="4.5" fill="#FFD95A" stroke="#B98500" stroke-width="2"/>` +
      `<path d="M30 112 l-10 10 M44 118 l-6 10 M76 118 l6 10 M90 112 l10 10" stroke="#E86A2E" stroke-width="5" stroke-linecap="round"/>` +
      `<ellipse cx="60" cy="88" rx="40" ry="32" fill="#FF8A4C" ${O()}/>` +
      `<path d="M34 76 Q42 66 54 66" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".5"/>` +
      `<path d="M48 60 V50 M72 60 V50" stroke="#E86A2E" stroke-width="4" stroke-linecap="round"/>` +
      eyes(48, 72, 84, 4.8, 6) +
      cheeks(35, 85, 95) +
      smile(52, 68, 95, 7),
  );
}

/**
 * Le Monde des Chatouilles (saison 3, île 4) : Plumette la paonne et Guili le manchot, yeux souriants.
 * @param {Record<string, string>} ART
 * @param {ArtKit} kit
 */
function chatouillesArt(ART, kit) {
  const { AI, O, eyes, cheeks, smile, svg } = kit;
  // Plumette la paonne : bleue et verte, une roue de plumes roses et jaunes, une aigrette de trois points
  ART.plumette = svg(
    [-40, -20, 0, 20, 40]
      .map(
        (a, i) =>
          `<g transform="rotate(${a} 60 96)"><ellipse cx="60" cy="46" rx="13" ry="30" fill="${i % 2 ? '#FFD95A' : '#FF8FB8'}" ${O()}/><circle cx="60" cy="30" r="6" fill="#2F7CC0"/><circle cx="60" cy="30" r="2.8" fill="#6ED38C"/></g>`,
      )
      .join('') +
      `<ellipse cx="60" cy="96" rx="30" ry="30" fill="#2F9E8F" ${O()}/><ellipse cx="60" cy="108" rx="17" ry="15" fill="#8FE0C8"/>` +
      `<circle cx="60" cy="62" r="25" fill="#2F7CC0" ${O()}/>` +
      `<path d="M52 38 V28 M60 37 V25 M68 38 V28" stroke="${AI}" stroke-width="2.2" stroke-linecap="round"/><g fill="#FFD95A" ${O(1.6)}><circle cx="52" cy="26" r="3.4"/><circle cx="60" cy="23" r="3.4"/><circle cx="68" cy="26" r="3.4"/></g>` +
      eyes(51, 69, 59, 4.4, 5.6) +
      `<path d="M55 68 L65 68 L60 76Z" fill="#FFA43A" ${O(2)}/>` +
      cheeks(43, 77, 68) +
      smile(54, 66, 79, 4),
  );

  // Guili le petit manchot : noir et blanc, une plume rose sur la tête, bec et pattes orange
  ART.guili = svg(
    `<path d="M60 26 Q46 10 58 -2 Q72 10 60 26Z" fill="#FF8FB8" stroke="#C2457A" stroke-width="2.5" stroke-linejoin="round" transform="rotate(14 60 20)"/>` +
      `<path d="M24 74 Q8 86 14 104 M96 74 Q112 86 106 104" fill="none" stroke="#3B3550" stroke-width="12" stroke-linecap="round"/>` +
      `<ellipse cx="46" cy="124" rx="12" ry="5.5" fill="#FFA43A" ${O(2)}/><ellipse cx="74" cy="124" rx="12" ry="5.5" fill="#FFA43A" ${O(2)}/>` +
      `<ellipse cx="60" cy="74" rx="38" ry="50" fill="#3B3550" ${O()}/><ellipse cx="60" cy="84" rx="26" ry="36" fill="#fff"/>` +
      `<path d="M34 62 Q34 40 50 40 Q60 40 60 50 Q60 40 70 40 Q86 40 86 62 Q76 74 60 62 Q44 74 34 62Z" fill="#fff"/>` +
      eyes(49, 71, 56, 4.6, 5.8) +
      `<path d="M53 65 L67 65 L60 75Z" fill="#FFA43A" ${O(2)}/>` +
      cheeks(40, 80, 67) +
      smile(54, 66, 79, 4),
  );
}

/**
 * Le Monde des Chatouilles, la suite : Lulu la loutre et Pic le hérisson.
 * @param {Record<string, string>} ART
 * @param {ArtKit} kit
 */
function chatouillesArtFriends(ART, kit) {
  const { AI, O, eyes, cheeks, smile, svg } = kit;
  // Lulu la loutre : marron clair, moustaches, un nez rouge de clown posé sur le front
  ART.lulu = svg(
    `<circle cx="30" cy="38" r="12" fill="#C99A6B" ${O()}/><circle cx="90" cy="38" r="12" fill="#C99A6B" ${O()}/><circle cx="30" cy="38" r="5.5" fill="#8A5A2B"/><circle cx="90" cy="38" r="5.5" fill="#8A5A2B"/>` +
      `<ellipse cx="60" cy="78" rx="40" ry="44" fill="#C99A6B" ${O()}/><ellipse cx="60" cy="100" rx="24" ry="20" fill="#F3DDBE"/>` +
      `<ellipse cx="60" cy="82" rx="19" ry="13" fill="#F3DDBE"/><ellipse cx="60" cy="76" rx="5" ry="3.6" fill="${AI}"/>` +
      `<path d="M40 80 H22 M40 85 L24 90 M80 80 H98 M80 85 L96 90" stroke="${AI}" stroke-width="1.8" stroke-linecap="round"/>` +
      `<circle cx="60" cy="44" r="9" fill="#E8344E" ${O(2)}/><circle cx="57" cy="41" r="2.6" fill="#fff" opacity=".8"/>` +
      eyes(45, 75, 64, 4.6, 5.8) +
      cheeks(33, 87, 76) +
      smile(53, 67, 85, 6),
  );

  // Pic le petit hérisson timide : des piquants arrondis couleur noisette, des joues roses, un petit sourire
  ART.pic = svg(
    `<path d="M14 96 Q4 80 14 68 Q8 52 22 44 Q22 28 38 26 Q46 12 60 18 Q74 12 82 26 Q98 28 98 44 Q112 52 106 68 Q116 80 106 96 Q104 120 60 122 Q16 120 14 96Z" fill="#B07A4A" ${O()}/>` +
      `<path d="M30 46 q5 -10 10 0 M52 34 q5 -10 10 0 M76 42 q5 -10 10 0 M22 70 q5 -10 10 0 M88 68 q5 -10 10 0 M40 56 q5 -10 10 0 M68 54 q5 -10 10 0" fill="none" stroke="#7A4E28" stroke-width="2.4" stroke-linecap="round"/>` +
      `<ellipse cx="60" cy="92" rx="30" ry="28" fill="#F3DDBE" ${O()}/>` +
      `<ellipse cx="60" cy="94" rx="4.4" ry="3.2" fill="${AI}"/>` +
      eyes(48, 72, 84, 4.2, 5.4) +
      `<ellipse cx="40" cy="96" rx="7" ry="4.4" fill="#FF8FA3" opacity=".7"/><ellipse cx="80" cy="96" rx="7" ry="4.4" fill="#FF8FA3" opacity=".7"/>` +
      smile(55, 65, 102, 4),
  );
}

/**
 * Ajoute les dessins de la saison 3 à `ART`.
 * @param {Record<string, string>} ART
 * @param {ArtKit} kit
 */
function season3Art(ART, kit) {
  crayonsArt(ART, kit);
  crayonsArtTools(ART, kit);
  dumplingsArt(ART, kit);
  dumplingsArtService(ART, kit);
  coffresArt(ART, kit);
  coffresArtFriends(ART, kit);
  chatouillesArt(ART, kit);
  chatouillesArtFriends(ART, kit);
  concertArt(ART, kit);
}

export { season3Art };
