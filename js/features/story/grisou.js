/* ---------- Grisou, le petit nuage de la saison 2 (v55) ----------
   « Les Rêves dans les boîtes » : Grisou avait peur de perdre les rêves
   colorés du ciel, et les a tous rangés dans des boîtes. Il est d'abord gris
   et triste ; chaque île du Ciel des Rêves libérée (son énigme résolue) lui
   rend un peu de couleur : des joues roses, un sourire, puis des bandes
   d'arc-en-ciel. C'est la progression visible de la saison.
   Dessin SVG, sans image ; `freed` = îles de la saison 2 libérées. */

// sa couleur, du gris au mauve pastel, île après île
const GRISOU_COLORS = ['#B9C2CE', '#C9C3E6', '#D8C6F2', '#E6CDF6', '#F3D7F5'];
const GRISOU_RAINBOW = ['#FF8FB8', '#FFD95A', '#6ED38C', '#6FB8F5', '#BFA3EC'];

function grisouSVG(freed){
  const n = Math.max(0, Number(freed) || 0);
  const body = GRISOU_COLORS[Math.min(n, GRISOU_COLORS.length - 1)];
  const sad = n === 0;
  // l'arc-en-ciel, derrière le nuage : une bande de plus par île libérée
  const arcs = GRISOU_RAINBOW.slice(0, Math.min(n, GRISOU_RAINBOW.length)).map((c, i)=>
    `<path d="M${8 + i * 5} 78 Q60 ${-10 + i * 10} ${112 - i * 5} 78" fill="none" stroke="${c}" stroke-width="5" stroke-linecap="round"/>`).join('');
  const mouth = sad
    ? '<path d="M52 82 Q60 76 68 82" fill="none" stroke="#5B6474" stroke-width="3" stroke-linecap="round"/>'
    : '<path d="M50 78 Q60 88 70 78" fill="none" stroke="#8C2F3F" stroke-width="3" stroke-linecap="round"/>';
  const tears = sad ? '<path d="M40 70 q-3 7 0 10 q3 -3 0 -10z M82 70 q-3 7 0 10 q3 -3 0 -10z" fill="#8FC8F2"/>' : '';
  const cheeks = sad ? '' : '<ellipse cx="38" cy="76" rx="6" ry="3.6" fill="#FF8FA3" opacity=".6"/><ellipse cx="82" cy="76" rx="6" ry="3.6" fill="#FF8FA3" opacity=".6"/>';
  return `<svg class="grisou" viewBox="0 0 120 124" role="img" aria-label="Grisou, le petit nuage" data-freed="${n}" data-color="${body}">
    ${arcs}
    <g fill="${body}" stroke="#7D8796" stroke-width="2.5" stroke-linejoin="round">
      <path d="M26 96 C10 96 6 76 20 70 C16 52 34 42 46 50 C50 32 76 28 84 46 C100 40 114 56 104 70 C116 76 110 98 94 96 Z"/>
    </g>
    <path d="M36 56 Q44 48 54 52" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".7"/>
    <ellipse cx="47" cy="68" rx="4.6" ry="${sad ? 4 : 6}" fill="#2B2140"/><ellipse cx="73" cy="68" rx="4.6" ry="${sad ? 4 : 6}" fill="#2B2140"/>
    <circle cx="48.6" cy="65.5" r="1.6" fill="#fff"/><circle cx="74.6" cy="65.5" r="1.6" fill="#fff"/>
    ${sad ? '<path d="M39 61 Q45 56 52 57 M81 61 Q75 56 68 57" fill="none" stroke="#5B6474" stroke-width="2.4" stroke-linecap="round"/>' : ''}
    ${tears}${cheeks}${mouth}
  </svg>`;
}

export { grisouSVG };
