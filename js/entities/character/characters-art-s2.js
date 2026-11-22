/* Les mascottes SVG de la saison 2 (Monde des Boîtes, Coffre aux Jouets Doux,
   Royaume des Bonbons, Île de la Musique, Jardin des Fées, Royaume Arc-en-ciel).
   Déplacées telles quelles depuis characters-art.js, devenu trop long : elles
   dessinent avec les outils de ce fichier, reçus en paramètre (`kit`). */

/**
 * Ajoute les dessins de la saison 2 à `ART`.
 * @param {Record<string, string>} ART
 * @param {import('./characters-art.js').ArtKit} kit
 */
function season2Art(ART, kit) {
  const { AI, AM, O, eyes, cheeks, smile, svg, human, beast, horse } = kit;
  // ---- Saison 2, le Monde des Boîtes (v55) ----
  // Capucine la capybara : corps carré tout doux, museau, lunettes rondes, carnet de directrice
  ART.capucine = svg(
    `<ellipse cx="30" cy="34" rx="9" ry="8" fill="#A06A3E" ${O()}/><ellipse cx="90" cy="34" rx="9" ry="8" fill="#A06A3E" ${O()}/>` +
      `<rect x="14" y="28" width="92" height="96" rx="34" fill="#C08A55" ${O()}/>` +
      `<ellipse cx="60" cy="106" rx="30" ry="16" fill="#E2B98A"/>` +
      `<path d="M30 44 Q40 36 52 38" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".5"/>` +
      eyes(44, 76, 58, 4.4, 5.6) +
      `<circle cx="44" cy="58" r="11" fill="none" stroke="#5A3A22" stroke-width="2.5"/><circle cx="76" cy="58" r="11" fill="none" stroke="#5A3A22" stroke-width="2.5"/><path d="M55 57 Q60 54 65 57" fill="none" stroke="#5A3A22" stroke-width="2.5"/>` +
      `<ellipse cx="60" cy="82" rx="20" ry="13" fill="#9C6B42" ${O(2)}/><ellipse cx="53" cy="79" rx="3" ry="2.2" fill="${AI}"/><ellipse cx="67" cy="79" rx="3" ry="2.2" fill="${AI}"/>` +
      `<path d="M54 88 Q60 92 66 88" fill="none" stroke="${AM}" stroke-width="2.4" stroke-linecap="round"/>` +
      cheeks(28, 92, 74) +
      `<rect x="80" y="96" width="24" height="28" rx="3" fill="#FFF7E8" ${O(2)}/><path d="M85 104 H99 M85 110 H99 M85 116 H95" stroke="#C79A63" stroke-width="2"/>`,
  );

  // Kiki le chat-dans-la-boîte : la tête et les pattes dépassent d'un carton ouvert
  ART.kiki = svg(
    `<path d="M30 46 L26 14 L52 32Z M90 46 L94 14 L68 32Z" fill="#F2A65A" ${O()}/><path d="M33 38 L31 22 L45 32Z M87 38 L89 22 L75 32Z" fill="#FFC9D6"/>` +
      `<ellipse cx="60" cy="58" rx="36" ry="32" fill="#F2A65A" ${O()}/>` +
      `<path d="M46 30 L49 40 M60 27 V38 M74 30 L71 40" stroke="#D9803A" stroke-width="4" stroke-linecap="round"/>` +
      eyes(46, 74, 56, 5, 6.4) +
      cheeks(34, 86, 68) +
      `<path d="M57 66 L63 66 L60 70Z" fill="#FF8FB8"/><path d="M60 70 Q55 76 51 72 M60 70 Q65 76 69 72" fill="none" stroke="${AM}" stroke-width="2.4" stroke-linecap="round"/>` +
      `<path d="M24 64 H10 M25 70 L12 74 M96 64 H110 M95 70 L108 74" stroke="#B5763A" stroke-width="2" stroke-linecap="round"/>` +
      `<path d="M14 84 L60 76 L106 84 L106 128 L14 128Z" fill="#E3B57E" ${O()}/><path d="M14 84 L2 70 L48 64 L60 76Z M106 84 L118 70 L72 64 L60 76Z" fill="#EFC896" ${O(2)}/>` +
      `<ellipse cx="42" cy="86" rx="9" ry="6" fill="#F2A65A" ${O(2)}/><ellipse cx="78" cy="86" rx="9" ry="6" fill="#F2A65A" ${O(2)}/>` +
      `<path d="M60 92 V128" stroke="#C79A63" stroke-width="6"/>`,
  );

  // Boulon le robot en carton : tête-boîte avec une bande de scotch, il tient un cube
  ART.boulon = svg(
    `<path d="M25 130 L30 98 H90 L95 130Z" fill="#D19C62" ${O()}/>` +
      `<rect x="24" y="31" width="72" height="67" rx="10" fill="#E3B57E" ${O(3)}/>` +
      `<rect x="54" y="32.5" width="12" height="64" fill="#F3D9A8" opacity=".9"/>` +
      `<rect x="32" y="42" width="56" height="44" rx="8" fill="#FFF4E0" ${O(2)}/>` +
      eyes(47, 73, 61, 5, 6.4) +
      cheeks(38, 82, 74) +
      smile(52, 68, 75, 6) +
      `<path d="M60 31 V15" stroke="${AI}" stroke-width="3"/><circle cx="60" cy="12" r="5" fill="#FF9CC8" ${O(2)}/>` +
      `<path d="M24 50 L12 44 M96 50 L108 44" stroke="#8A5A2B" stroke-width="3" stroke-linecap="round"/>` +
      `<rect x="14" y="100" width="28" height="26" rx="3" fill="#C9E7FB" ${O(2)}/><path d="M14 110 H42 M28 100 V126" stroke="#5B8FC7" stroke-width="2"/>`,
  );

  // Lola la livreuse : casquette rose, sac à colis, trottinette
  ART.lola = human(
    '#C98663',
    '#3B2A24',
    '#6FB8F5',
    `<path d="M24 44 Q30 16 60 16 Q90 16 96 44Z" fill="#FF8FB8" ${O()}/><path d="M86 41 L112 45 L108 52 L86 49Z" fill="#FF8FB8" ${O(2)}/>`,
    `<rect x="76" y="100" width="30" height="24" rx="4" fill="#E3B57E" ${O(2)}/><path d="M76 108 H106" stroke="#C79A63" stroke-width="2"/>` +
      `<path d="M8 126 H104 M14 126 L20 100" stroke="#5E6B7C" stroke-width="4" stroke-linecap="round"/><circle cx="12" cy="126" r="4" fill="#5E6B7C"/><circle cx="100" cy="126" r="4" fill="#5E6B7C"/>`,
  );
  // ---- Saison 2, le Coffre aux Jouets Doux (idée de la joueuse) ----
  // Nougat l'ourson en guimauve : tout blanc crème, oreilles roses, ruban et clé du coffre
  ART.nougat = svg(
    `<circle cx="30" cy="30" r="13" fill="#FFF4E8" ${O()}/><circle cx="90" cy="30" r="13" fill="#FFF4E8" ${O()}/>` +
      `<circle cx="30" cy="30" r="6.5" fill="#FFC2D6"/><circle cx="90" cy="30" r="6.5" fill="#FFC2D6"/>` +
      `<rect x="14" y="24" width="92" height="102" rx="40" fill="#FFF4E8" ${O()}/>` +
      `<path d="M18 84 Q60 96 102 84" fill="none" stroke="#F3DCC8" stroke-width="3"/>` +
      `<path d="M30 44 Q40 36 52 38" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round"/>` +
      eyes(46, 74, 56, 4.8, 6) +
      cheeks(32, 88, 68) +
      `<ellipse cx="60" cy="72" rx="13" ry="9" fill="#F7DDC8" ${O(2)}/><ellipse cx="60" cy="68.5" rx="4.4" ry="3.2" fill="${AI}"/>` +
      `<path d="M55 75 Q60 79 65 75" fill="none" stroke="${AM}" stroke-width="2.4" stroke-linecap="round"/>` +
      `<path d="M38 96 Q60 108 82 96" fill="none" stroke="#FF8FB8" stroke-width="5" stroke-linecap="round"/>` +
      `<circle cx="60" cy="108" r="6" fill="#FFD95A" ${O(2)}/><path d="M60 114 V125 M60 121 H66" stroke="#B8901A" stroke-width="3" stroke-linecap="round"/>`,
  );

  // Cocotte la lapine mochi : une boule rose toute ronde, longues oreilles, un cube menthe
  ART.cocotte = svg(
    `<ellipse cx="42" cy="28" rx="10" ry="24" fill="#FFE4EE" ${O()} transform="rotate(-12 42 28)"/><ellipse cx="78" cy="28" rx="10" ry="24" fill="#FFE4EE" ${O()} transform="rotate(12 78 28)"/>` +
      `<ellipse cx="42" cy="30" rx="4.5" ry="15" fill="#FFB3CC" transform="rotate(-12 42 30)"/><ellipse cx="78" cy="30" rx="4.5" ry="15" fill="#FFB3CC" transform="rotate(12 78 30)"/>` +
      `<path d="M60 46 C94 46 110 72 108 98 C106 120 86 126 60 126 C34 126 14 120 12 98 C10 72 26 46 60 46Z" fill="#FFE4EE" ${O()}/>` +
      `<path d="M28 66 Q36 56 48 56" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round"/>` +
      eyes(46, 74, 82, 4.8, 6) +
      cheeks(32, 88, 94) +
      `<path d="M57 90 L63 90 L60 93.5Z" fill="#FF8FB8"/><path d="M60 94 Q56 99 52 96 M60 94 Q64 99 68 96" fill="none" stroke="${AM}" stroke-width="2.2" stroke-linecap="round"/>` +
      `<rect x="86" y="102" width="20" height="20" rx="5" fill="#BFF0DA" ${O(2)}/><circle cx="96" cy="112" r="4" fill="#fff" opacity=".8"/>`,
  );

  // Gloups le poulpe tout mou : tête ronde bleu pâle, huit petits bras, un grand sourire
  ART.gloups = svg(
    `<g fill="#A9C9F5" ${O(2.4)}>` +
      `<path d="M22 90 C8 98 6 116 16 120 C22 112 28 104 36 100Z"/><path d="M98 90 C112 98 114 116 104 120 C98 112 92 104 84 100Z"/>` +
      `<path d="M36 100 C28 112 30 126 40 126 C42 116 46 108 50 104Z"/><path d="M84 100 C92 112 90 126 80 126 C78 116 74 108 70 104Z"/>` +
      `<path d="M50 104 C48 116 52 128 60 128 C68 128 72 116 70 104Z"/></g>` +
      `<g fill="#D6E7FC"><circle cx="14" cy="112" r="2"/><circle cx="106" cy="112" r="2"/><circle cx="60" cy="120" r="2"/></g>` +
      `<path d="M60 14 C92 14 106 40 104 66 C102 92 84 104 60 104 C36 104 18 92 16 66 C14 40 28 14 60 14Z" fill="#A9C9F5" ${O()}/>` +
      `<g fill="#D6E7FC"><circle cx="78" cy="30" r="4"/><circle cx="88" cy="46" r="3"/></g>` +
      `<path d="M30 44 Q38 32 52 30" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".8"/>` +
      eyes(46, 74, 62, 5.2, 6.6) +
      cheeks(32, 88, 76) +
      smile(50, 70, 78, 9),
  );

  // Rainette la grenouille squishy : verte, yeux sur la tête, ventre clair, petites taches
  ART.rainette = svg(
    `<circle cx="36" cy="36" r="17" fill="#7FD49A" ${O()}/><circle cx="84" cy="36" r="17" fill="#7FD49A" ${O()}/>` +
      `<path d="M60 34 C96 34 112 60 110 88 C108 116 88 126 60 126 C32 126 12 116 10 88 C8 60 24 34 60 34Z" fill="#7FD49A" ${O()}/>` +
      `<ellipse cx="60" cy="102" rx="30" ry="18" fill="#D6F5DE"/>` +
      `<circle cx="36" cy="36" r="9" fill="#fff"/><circle cx="84" cy="36" r="9" fill="#fff"/>` +
      `<circle cx="37" cy="37" r="5" fill="${AI}"/><circle cx="85" cy="37" r="5" fill="${AI}"/><circle cx="38.5" cy="35" r="1.8" fill="#fff"/><circle cx="86.5" cy="35" r="1.8" fill="#fff"/>` +
      cheeks(28, 92, 70) +
      `<path d="M40 68 Q60 84 80 68" fill="none" stroke="${AM}" stroke-width="2.6" stroke-linecap="round"/>` +
      `<path d="M24 58 Q30 50 40 50" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".6"/>` +
      `<g fill="#5DBB7C"><circle cx="22" cy="90" r="3"/><circle cx="98" cy="94" r="3.5"/><circle cx="90" cy="78" r="2.4"/></g>`,
  );
  // ---- Saison 2, le Royaume des Bonbons ----
  // Praline la reine pâtissière : toque blanche et petite couronne dorée, tablier à la cerise
  ART.praline = human(
    '#F0C4AA',
    '#8A4A2B',
    '#FF8FB8',
    `<path d="M30 40 C18 36 20 16 34 18 C34 6 50 2 58 12 C64 2 84 4 84 18 C98 16 102 36 90 40Z" fill="#fff" ${O()}/>` +
      `<rect x="30" y="34" width="60" height="10" rx="4" fill="#FFE3EC" ${O(2)}/>` +
      `<path d="M47 15 L51 4 L57 11 L61 1 L65 11 L71 4 L75 15Z" fill="#FFD95A" ${O(2)}/>`,
    `<path d="M42 100 H78 L84 130 H36Z" fill="#fff" ${O(2)}/><circle cx="58" cy="115" r="5" fill="#E8344E"/><circle cx="65" cy="117" r="5" fill="#E8344E"/><path d="M58 110 Q62 104 68 104 M65 112 Q66 106 68 104" stroke="#3E8E4A" stroke-width="2" fill="none"/>`,
  );

  // Chouquette la petite pâtissière : un cupcake tout rond, crème rose, cerise sur la tête
  ART.chouquette = svg(
    `<path d="M24 78 L96 78 L86 126 L34 126Z" fill="#9FDCF5" ${O()}/>` +
      `<path d="M40 80 L44 124 M57 80 L58 126 M73 80 L71 124 M88 82 L83 122" stroke="#6FB8F5" stroke-width="3"/>` +
      `<path d="M18 80 C6 72 12 52 28 54 C24 36 42 26 54 34 C58 18 80 20 82 36 C96 32 108 48 98 60 C110 66 104 84 92 82Z" fill="#FFD1E3" ${O()}/>` +
      `<path d="M28 50 Q36 40 48 42" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round"/>` +
      `<g stroke-linecap="round" stroke-width="3.5"><path d="M30 70 l5 -2" stroke="#FFD95A"/><path d="M92 68 l-4 -3" stroke="#6ED38C"/><path d="M84 46 l4 3" stroke="#6FB8F5"/><path d="M38 40 l4 -3" stroke="#BFA3EC"/></g>` +
      eyes(46, 74, 60, 4.6, 5.8) +
      cheeks(33, 87, 70) +
      smile(52, 68, 70, 6) +
      `<circle cx="66" cy="22" r="8" fill="#E8344E" ${O(2)}/><path d="M66 14 Q70 6 77 5" stroke="#3E8E4A" stroke-width="2.5" fill="none" stroke-linecap="round"/>`,
  );

  // Cacao le chocolatier : un ourson couleur chocolat, petite toque, une tablette à la main
  ART.cacao = beast(
    '#8B5A3C',
    `<circle cx="30" cy="36" r="12" fill="#8B5A3C" ${O()}/><circle cx="90" cy="36" r="12" fill="#8B5A3C" ${O()}/><circle cx="30" cy="36" r="6" fill="#C99364"/><circle cx="90" cy="36" r="6" fill="#C99364"/>`,
    `<path d="M42 32 C34 28 36 14 46 16 C48 6 60 4 64 12 C70 4 84 8 80 18 C88 20 86 32 78 34Z" fill="#fff" ${O(2)}/><rect x="42" y="28" width="36" height="8" rx="3" fill="#F2E6DA" ${O(1.8)}/>` +
      `<ellipse cx="60" cy="108" rx="20" ry="13" fill="#C99364"/>` +
      `<rect x="80" y="96" width="22" height="28" rx="3" fill="#6B3E26" ${O(2)}/><path d="M80 105 H102 M80 114 H102 M91 96 V124" stroke="#8B5A3C" stroke-width="2"/>`,
  );

  // Berlingot le marchand de bonbons : bonnet rayé à pompon, gilet menthe, grosse sucette
  ART.berlingot = human(
    '#C98663',
    '#2B2140',
    '#6ED38C',
    `<path d="M26 44 Q28 16 60 14 Q92 16 94 44Z" fill="#FF8FB8" ${O()}/><path d="M42 20 L38 42 M60 14 V42 M78 20 L82 42" stroke="#fff" stroke-width="5"/><circle cx="60" cy="12" r="6" fill="#FFD95A" ${O(2)}/>`,
    `<path d="M42 100 L38 130 M78 100 L82 130" stroke="#FF8FB8" stroke-width="6"/>` +
      `<rect x="98" y="84" width="5" height="40" rx="2.5" fill="#fff" ${O(1.5)}/><circle cx="100" cy="76" r="14" fill="#FF8FB8" ${O(2)}/><path d="M100 76 m-8 0 a8 8 0 1 1 8 8 a4.5 4.5 0 1 1 -4.5 -4.5" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"/>`,
  );
  // ---- Saison 2, l'Île de la Musique ----
  // Viola la violoniste, cheffe d'orchestre : chignon, robe bleu nuit, violon et archet
  ART.viola = human(
    '#E8B69D',
    '#2B2140',
    '#2B2F6B',
    `<circle cx="60" cy="16" r="10" fill="#2B2140" ${O()}/><path d="M50 10 L54 2 L60 8 L66 2 L70 10" fill="none" stroke="#FFD95A" stroke-width="3" stroke-linejoin="round"/>`,
    `<path d="M44 98 L60 108 L76 98" fill="none" stroke="#FFD95A" stroke-width="4" stroke-linejoin="round"/>` +
      `<g transform="rotate(-28 30 106)"><path d="M22 94 C13 94 13 104 19 106 C13 108 13 118 22 118 L38 118 C47 118 47 108 41 106 C47 104 47 94 38 94Z" fill="#B5652E" ${O(2)}/><rect x="28" y="72" width="4" height="22" fill="#5A3A22"/><path d="M27 104 h6 M27 110 h6" stroke="#5A3A22" stroke-width="2"/></g>` +
      `<path d="M6 90 L56 124" stroke="#8A5A2B" stroke-width="3" stroke-linecap="round"/>`,
  );

  // Boumbo le petit tambour : un tambour rouge à frange dorée, deux baguettes sur la tête
  ART.boumbo = svg(
    `<path d="M40 34 L22 6 M80 34 L98 6" stroke="#C99364" stroke-width="5" stroke-linecap="round"/><circle cx="22" cy="6" r="5" fill="#FFF4E0" ${O(1.5)}/><circle cx="98" cy="6" r="5" fill="#FFF4E0" ${O(1.5)}/>` +
      `<rect x="14" y="40" width="92" height="80" rx="14" fill="#E8573A" ${O()}/>` +
      `<ellipse cx="60" cy="40" rx="46" ry="14" fill="#FFF4E0" ${O()}/>` +
      `<path d="M30 36 Q44 30 58 32" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round"/>` +
      eyes(46, 74, 70, 4.8, 6) +
      cheeks(31, 89, 82) +
      smile(52, 68, 82, 7) +
      `<rect x="12" y="96" width="96" height="8" rx="4" fill="#FFD95A" ${O(2)}/>` +
      `<path d="M18 106 L28 118 L38 106 L48 118 L58 106 L68 118 L78 106 L88 118 L98 106" fill="none" stroke="#FFD95A" stroke-width="3" stroke-linejoin="round"/>`,
  );

  // Flûtine la flûte enchantée : cheveux turquoise, couronne de fleurs, une flûte dans les mains
  ART.flutine = human(
    '#F0C4AA',
    '#3FB3BA',
    '#FFD95A',
    `<g ${O(1.6)}><circle cx="36" cy="30" r="6" fill="#FF8FB8"/><circle cx="50" cy="22" r="6" fill="#FFF3A6"/><circle cx="70" cy="22" r="6" fill="#BFA3EC"/><circle cx="84" cy="30" r="6" fill="#FF8FB8"/></g>`,
    `<rect x="10" y="104" width="100" height="8" rx="4" fill="#DDE6EE" ${O(2)}/><g fill="${AI}"><circle cx="40" cy="108" r="1.8"/><circle cx="52" cy="108" r="1.8"/><circle cx="64" cy="108" r="1.8"/><circle cx="76" cy="108" r="1.8"/></g>` +
      `<path d="M98 86 V70 L108 68 V82" fill="none" stroke="#2B2F6B" stroke-width="2.4"/><circle cx="96" cy="87" r="3" fill="#2B2F6B"/><circle cx="106" cy="83" r="3" fill="#2B2F6B"/>`,
  );

  // Piccolo le perroquet chanteur : tête rouge, crête jaune, corps vert, une note de musique
  ART.piccolo = svg(
    `<path d="M48 110 L40 128 L60 118 L80 128 L72 110Z" fill="#6FB8F5" ${O(2)}/>` +
      `<ellipse cx="60" cy="96" rx="30" ry="26" fill="#6ED38C" ${O()}/>` +
      `<path d="M30 88 Q14 104 26 118 Q34 106 36 96Z M90 88 Q106 104 94 118 Q86 106 84 96Z" fill="#3FB86A" ${O(2)}/>` +
      `<path d="M50 26 Q52 8 60 16 Q64 4 70 16 Q78 10 74 28" fill="#FFD95A" ${O(2)}/>` +
      `<circle cx="60" cy="52" r="30" fill="#FF6F61" ${O()}/>` +
      `<ellipse cx="47" cy="50" rx="9" ry="10" fill="#fff"/><ellipse cx="73" cy="50" rx="9" ry="10" fill="#fff"/>` +
      eyes(47, 73, 51, 4.2, 5.2) +
      cheeks(36, 84, 64) +
      `<path d="M53 60 Q60 55 67 60 Q67 72 60 77 Q55 71 53 60Z" fill="#FFD95A" ${O(2)}/>` +
      `<path d="M100 34 V16 L110 14 V28" fill="none" stroke="${AI}" stroke-width="2.4"/><circle cx="98" cy="35" r="3.2" fill="${AI}"/><circle cx="108" cy="30" r="3.2" fill="${AI}"/>`,
  );
  // ---- Saison 2, le Jardin des Fées ----
  // Pétale la fée jardinière : chapeau-fleur rose, ailes nacrées, robe vert tendre, petit arrosoir
  ART.petale = human(
    '#F0C4AA',
    '#A85A3C',
    '#8FD48A',
    `<g ${O(2)}><ellipse cx="38" cy="22" rx="12" ry="8" fill="#FF9CC8" transform="rotate(-25 38 22)"/><ellipse cx="82" cy="22" rx="12" ry="8" fill="#FF9CC8" transform="rotate(25 82 22)"/><ellipse cx="60" cy="12" rx="9" ry="12" fill="#FFB8D6"/><circle cx="60" cy="24" r="7" fill="#FFD95A"/></g>`,
    `<path d="M60 112 L84 128 L60 122 L36 128Z" fill="#6DBB57"/>` +
      `<rect x="88" y="100" width="22" height="18" rx="5" fill="#9FDCF5" ${O(2)}/><path d="M110 104 L118 96" stroke="${AI}" stroke-width="3" stroke-linecap="round"/><path d="M92 100 Q99 90 106 100" fill="none" stroke="${AI}" stroke-width="2.5"/>`,
    `<path d="M30 92 Q2 72 8 50 Q26 58 40 84Z M90 92 Q118 72 112 50 Q94 58 80 84Z" fill="#F3E8FF" opacity=".9" ${O(2)}/>`,
  );

  // Pois la coccinelle : carapace rouge à points noirs, tête noire, antennes
  ART.pois = svg(
    `<path d="M44 30 Q38 12 30 10 M76 30 Q82 12 90 10" fill="none" stroke="${AI}" stroke-width="3" stroke-linecap="round"/><circle cx="30" cy="10" r="4" fill="${AI}"/><circle cx="90" cy="10" r="4" fill="${AI}"/>` +
      `<ellipse cx="60" cy="40" rx="26" ry="20" fill="#2B2140"/>` +
      `<ellipse cx="60" cy="84" rx="46" ry="42" fill="#E8344E" ${O()}/>` +
      `<path d="M60 44 V126" stroke="${AI}" stroke-width="3"/>` +
      `<g fill="${AI}"><circle cx="36" cy="96" r="6"/><circle cx="84" cy="96" r="6"/><circle cx="32" cy="70" r="4.6"/><circle cx="88" cy="70" r="4.6"/><circle cx="44" cy="114" r="4.4"/><circle cx="76" cy="114" r="4.4"/></g>` +
      `<path d="M28 60 Q36 50 48 50" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".55"/>` +
      `<g transform="translate(0 -22)">` +
      eyes(50, 70, 62, 4.2, 5.2) +
      `</g>` +
      cheeks(42, 78, 48) +
      `<path d="M54 50 Q60 54 66 50" fill="none" stroke="#FFB8C8" stroke-width="2.4" stroke-linecap="round"/>`,
  );

  // Azur le papillon : grandes ailes bleues à taches, petit corps, antennes en spirale
  ART.azur = svg(
    `<path d="M58 60 C36 20 4 26 10 56 C14 74 40 74 56 66Z M62 60 C84 20 116 26 110 56 C106 74 80 74 64 66Z" fill="#6FB8F5" ${O()}/>` +
      `<path d="M56 70 C34 76 18 96 30 110 C42 120 54 98 58 80Z M64 70 C86 76 102 96 90 110 C78 120 66 98 62 80Z" fill="#BFA3EC" ${O()}/>` +
      `<g fill="#fff" opacity=".8"><circle cx="28" cy="46" r="6"/><circle cx="92" cy="46" r="6"/><circle cx="36" cy="98" r="4"/><circle cx="84" cy="98" r="4"/></g>` +
      `<path d="M54 28 Q48 12 40 14 Q36 18 42 20 M66 28 Q72 12 80 14 Q84 18 78 20" fill="none" stroke="${AI}" stroke-width="2.6" stroke-linecap="round"/>` +
      `<ellipse cx="60" cy="86" rx="9" ry="30" fill="#5A4A7A" ${O(2)}/>` +
      `<circle cx="60" cy="44" r="18" fill="#7B6AA8" ${O()}/>` +
      `<g transform="translate(0 -18)">` +
      eyes(53, 67, 62, 3.4, 4.4) +
      `</g><path d="M55 50 Q60 54 65 50" fill="none" stroke="#FFB8C8" stroke-width="2.2" stroke-linecap="round"/>`,
  );

  // Miella l'abeille : rayée jaune et brun, ailes transparentes, petit pot de miel
  ART.miella = svg(
    `<ellipse cx="34" cy="48" rx="20" ry="14" fill="#E6F4FF" opacity=".9" ${O(2)} transform="rotate(-25 34 48)"/><ellipse cx="86" cy="48" rx="20" ry="14" fill="#E6F4FF" opacity=".9" ${O(2)} transform="rotate(25 86 48)"/>` +
      `<path d="M50 24 Q46 10 38 8 M70 24 Q74 10 82 8" fill="none" stroke="${AI}" stroke-width="3" stroke-linecap="round"/><circle cx="38" cy="8" r="4" fill="${AI}"/><circle cx="82" cy="8" r="4" fill="${AI}"/>` +
      `<ellipse cx="60" cy="80" rx="40" ry="44" fill="#FFD95A" ${O()}/>` +
      `<path d="M24 92 Q60 102 96 92 M28 110 Q60 120 92 110" fill="none" stroke="#6B3E26" stroke-width="9" stroke-linecap="round"/>` +
      `<path d="M30 56 Q38 44 52 44" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".7"/>` +
      eyes(47, 73, 64, 4.8, 6) +
      cheeks(34, 86, 76) +
      smile(52, 68, 76, 7) +
      `<rect x="90" y="104" width="22" height="20" rx="6" fill="#F2B04E" ${O(2)}/><path d="M90 110 H112" stroke="#B5702E" stroke-width="2"/>`,
  );
  // ---- Saison 2, le Royaume Arc-en-ciel ----
  /**
   * @param {string} base
   * @param {string} extra
   */
  const plus = (base, extra) => base.replace('</svg>', extra + '</svg>');
  // la Reine Arc-en-ciel : licorne blanche à crinière arc-en-ciel, couronne d'or
  ART.reine = plus(
    horse({
      coat: '#FFFFFF',
      muzzle: '#F6EEFF',
      maneBack: `<path d="M64 25 C38 19 21 44 25 80 C28 92 37 97 43 99 C38 86 38 70 45 55Z" fill="#FF6F61" ${O(2)}/><path d="M58 28 C40 28 30 46 32 74 C34 84 38 90 42 92 C40 80 40 66 46 54Z" fill="#FFD95A"/><path d="M53 31 C43 36 38 50 39 66 C41 74 43 80 45 82 C44 70 45 60 49 52Z" fill="#6ED38C"/><path d="M49 36 C44 44 42 54 43 64 C44 70 45 74 46 76 C46 66 47 58 50 52Z" fill="#6FB8F5"/>`,
      horn: `<path d="M55 30 L60 6 L65 30Z" fill="#FFF3A6" ${O(2)}/>`,
      forelock: `<path d="M64 29 C74 26 81 34 78 46 C74 40 69 37 63 37Z" fill="#BFA3EC" ${O(2)}/>`,
    }),
    `<path d="M42 22 L46 8 L53 16 L60 4 L67 16 L74 8 L78 22Z" fill="#FFD95A" ${O(2)}/><circle cx="60" cy="13" r="2.6" fill="#FF6F91"/>` +
      `<path d="M44 102 Q60 112 76 102" fill="none" stroke="#BFA3EC" stroke-width="5" stroke-linecap="round"/>`,
  );
  // Étincelle, rentrée chez elle : la licorne du Lagon avec un foulard arc-en-ciel et une étoile
  ART.etincelle = plus(
    horse({
      coat: '#FFFDF8',
      muzzle: '#FBE8EE',
      maneBack: `<path d="M64 25 C38 19 21 44 25 80 C28 92 37 97 43 99 C38 86 38 70 45 55Z" fill="#F48FB8" ${O(2)}/><path d="M58 28 C40 28 30 46 32 74 C34 84 38 90 42 92 C40 80 40 66 46 54Z" fill="#B79BE0"/>`,
      horn: `<path d="M55 30 L60 2 L65 30Z" fill="#F6C94E" ${O(2)}/><path d="M57 22 L63 19 M56 14 L62 11" stroke="#D99A22" stroke-width="1.8"/>`,
      forelock: `<path d="M64 29 C74 26 81 34 78 46 C74 40 69 37 63 37Z" fill="#B79BE0" ${O(2)}/>`,
    }),
    `<path d="M42 92 Q60 104 78 92 L76 100 Q60 110 44 100Z" fill="#FF8FB8" ${O(2)}/><path d="M46 96 Q60 104 74 96" fill="none" stroke="#FFD95A" stroke-width="2.5"/>` +
      `<path d="M96 30 l3 7 l7 1 l-5 5 l1 7 l-6 -3 l-6 3 l1 -7 l-5 -5 l7 -1z" fill="#FFD95A" ${O(1.6)}/>`,
  );
  // Biscotte le bébé licorne : couleur biscuit, petite corne, un arc-en-ciel tout tordu
  ART.biscotte = plus(
    horse({
      coat: '#FFE3BF',
      muzzle: '#FFF1DE',
      maneBack: `<path d="M64 25 C40 21 26 42 30 72 C32 82 38 88 42 90 C40 78 40 66 46 54Z" fill="#FFAE5C" ${O(2)}/>`,
      horn: `<path d="M56 30 L60 14 L64 30Z" fill="#FFF3A6" ${O(2)}/>`,
      forelock: `<path d="M64 29 C72 26 78 32 76 42 C73 37 69 35 63 36Z" fill="#9FDCF5" ${O(2)}/>`,
    }),
    `<g fill="none" stroke-width="4" stroke-linecap="round"><path d="M86 120 Q92 92 106 104 Q112 112 104 116" stroke="#FF6F61"/><path d="M90 120 Q95 98 104 108" stroke="#FFD95A"/></g>`,
  );
  // Félix le licorne alchimiste : bleu pâle, lunettes rondes, une fiole verte qui fume
  ART.felix = plus(
    horse({
      coat: '#E3F2FF',
      muzzle: '#F2F8FF',
      maneBack: `<path d="M64 25 C38 19 21 44 25 80 C28 92 37 97 43 99 C38 86 38 70 45 55Z" fill="#6ED38C" ${O(2)}/><path d="M58 28 C40 28 30 46 32 74 C34 84 38 90 42 92 C40 80 40 66 46 54Z" fill="#5CC6CC"/>`,
      horn: `<path d="M55 30 L60 4 L65 30Z" fill="#C9D6E3" ${O(2)}/>`,
      forelock: `<path d="M64 29 C74 26 81 34 78 46 C74 40 69 37 63 37Z" fill="#5CC6CC" ${O(2)}/>`,
    }),
    `<circle cx="49" cy="50" r="9" fill="none" stroke="#5A3A22" stroke-width="2.5"/><circle cx="71" cy="50" r="9" fill="none" stroke="#5A3A22" stroke-width="2.5"/><path d="M58 50 H62" stroke="#5A3A22" stroke-width="2.5"/>` +
      `<path d="M92 96 V108 L84 124 H112 L104 108 V96Z" fill="#9FE8B8" ${O(2)}/><path d="M86 118 H110" stroke="#4FB57F" stroke-width="3"/><g fill="#fff" opacity=".8"><circle cx="96" cy="88" r="3"/><circle cx="102" cy="80" r="2.4"/></g>`,
  );
  // Mira la licorne coiffeuse : longue crinière violette, un miroir à main et un peigne
  ART.mira = plus(
    horse({
      coat: '#FFF0FA',
      muzzle: '#FFF8FC',
      maneBack: `<path d="M64 25 C34 19 14 50 20 90 C22 104 30 112 40 114 C34 96 34 74 45 55Z" fill="#BFA3EC" ${O(2)}/><path d="M56 30 C38 32 28 52 30 80 C32 92 36 100 40 104 C38 86 40 66 46 54Z" fill="#E3D6FB"/>`,
      horn: `<path d="M55 30 L60 2 L65 30Z" fill="#FFB8E1" ${O(2)}/>`,
      forelock: `<path d="M64 29 C74 26 81 34 78 46 C74 40 69 37 63 37Z" fill="#BFA3EC" ${O(2)}/>`,
    }),
    `<ellipse cx="98" cy="96" rx="12" ry="14" fill="#E9F6FF" stroke="#B8901A" stroke-width="3"/><path d="M98 110 V126" stroke="#B8901A" stroke-width="4" stroke-linecap="round"/><path d="M92 90 Q96 86 100 88" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/>` +
      `<rect x="10" y="108" width="22" height="6" rx="3" fill="#FFD95A" ${O(1.6)}/><path d="M13 114 V120 M18 114 V120 M23 114 V120 M28 114 V120" stroke="${AI}" stroke-width="1.8"/>`,
  );
}

export { season2Art };
