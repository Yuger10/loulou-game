/* ---------- « Mesure les crayons » : le dessin de l'écran ----------
   Le HTML du jeu (js/features/minigames/length/length.js) : les crayons, la
   rangée de gommes, la règle graduée et les traits en pointillés de l'indice.
   Tous les dessins partagent la même largeur (100 unités) : un x du tirage
   (length-build.js) est le même x à l'écran, d'un dessin à l'autre. */

/** @typedef {import('./length-build.js').LengthBuild} LengthBuild */

const LENGTH_COLORS = ['#F7C948', '#FF9CC8', '#6FB8F5', '#7FD7A4'];
const LENGTH_ZERO = 5; // le x du début de la rangée de gommes et du 0 de la règle
const LENGTH_ROW = 14; // hauteur d'un crayon, dans son dessin
const LENGTH_UNITS = 7; // gommes de la rangée
const LENGTH_CM = 15; // la règle va de 0 à 15 cm

/**
 * Un crayon à l'horizontale : gomme rose à gauche, corps de couleur, pointe en
 * bois et mine à droite.
 * @param {number} x son bord gauche
 * @param {number} len sa longueur
 * @param {string} color la couleur du corps
 */
function lengthCrayonSVG(x, len, color) {
  const end = x + len,
    tip = end - 7; // la pointe en bois fait 7 unités
  return `<svg class="ln-svg" viewBox="0 0 100 ${LENGTH_ROW}" aria-hidden="true">
    <rect x="${x}" y="2.5" width="4" height="9" rx="1.6" fill="#FF8FB3" stroke="#C9497F" stroke-width=".6"/>
    <rect x="${x + 4}" y="2.5" width="2" height="9" fill="#C9CED6" stroke="#8A93A0" stroke-width=".5"/>
    <rect x="${x + 6}" y="2.5" width="${tip - x - 6}" height="9" fill="${color}" stroke="#7A5A12" stroke-width=".6"/>
    <path d="M${x + 6} 5.5 H${tip}" stroke="#fff" stroke-width="1" opacity=".5"/>
    <path d="M${tip} 2.5 L${end} 7 L${tip} 11.5Z" fill="#F1D3A2" stroke="#7A5A12" stroke-width=".6" stroke-linejoin="round"/>
    <path d="M${end - 2.6} 5.4 L${end} 7 L${end - 2.6} 8.6Z" fill="#4A4A4A"/>
  </svg>`;
}

// Comparer : un bouton par crayon, les uns sous les autres
/** @param {LengthBuild} b */
function lengthCompareHTML(b) {
  const words = ['du haut', 'du milieu', 'du bas'];
  return b.crayons
    .map(
      (c, i) =>
        `<button type="button" class="ln-crayon" data-i="${i}" data-start="${c.start}" data-len="${c.len}" aria-label="Le crayon ${b.crayons.length === 2 ? words[i * 2] : words[i]}">${lengthCrayonSVG(c.start, c.len, LENGTH_COLORS[i])}</button>`,
    )
    .join('');
}

/**
 * Le crayon à mesurer (pas un bouton), posé au-dessus de son étalon.
 * @param {LengthBuild} b
 * @param {number} unit largeur d'une gomme ou d'un centimètre
 */
function lengthSoloHTML(b, unit) {
  const c = b.crayons[0];
  return `<div class="ln-crayon solo" data-start="${c.start}" data-len="${c.len}">${lengthCrayonSVG(LENGTH_ZERO + c.start * unit, c.len * unit, LENGTH_COLORS[0])}</div>`;
}

// La rangée de gommes : l'étalon du palier 3
/** @param {number} unit largeur d'une gomme */
function lengthUnitsSVG(unit) {
  const erasers = Array.from(
    { length: LENGTH_UNITS },
    (_, u) =>
      `<rect class="ln-unit" data-u="${u}" x="${LENGTH_ZERO + unit * u}" y="1" width="${unit}" height="8" rx="2"/>`,
  ).join('');
  return `<svg class="ln-units" viewBox="0 0 100 10" role="img" aria-label="Une rangée de gommes">${erasers}</svg>`;
}

// La règle graduée de 0 à 15 cm
/** @param {number} cm largeur d'un centimètre */
function lengthRulerSVG(cm) {
  let marks = '';
  for (let k = 0; k <= LENGTH_CM; k++) {
    const x = LENGTH_ZERO + cm * k;
    marks += `<line class="ln-tick" data-cm="${k}" x1="${x}" x2="${x}" y1="0.5" y2="5.5"/><text x="${x}" y="11.6">${k}</text>`;
  }
  return `<svg class="ln-ruler" viewBox="0 0 100 15" role="img" aria-label="Une règle graduée en centimètres">
    <rect class="ln-ruler-body" x="1" y="0.5" width="98" height="14" rx="1.5"/>${marks}
  </svg>`;
}

/** @param {LengthBuild} b les nombres proposés */
function lengthOptionsHTML(b) {
  return `<div class="num-options ln-options">${b.choices
    .map((v) => `<button type="button" class="num-btn ln-opt" data-v="${v}">${v}</button>`)
    .join('')}</div>`;
}

/**
 * La scène du jeu, selon le mode de la question.
 * @param {LengthBuild} b
 */
function lengthStageHTML(b) {
  if (b.mode === 'compare') {
    return `<div id="ln-stage" class="ln-stage" data-mode="compare" data-ask="${b.ask}">${lengthCompareHTML(b)}</div>`;
  }
  const unit = (b.mode === 'units' ? b.rules.unit : b.rules.cm) || 6;
  const scale = b.mode === 'units' ? lengthUnitsSVG(unit) : lengthRulerSVG(unit);
  return `<div id="ln-stage" class="ln-stage" data-mode="${b.mode}" data-len="${b.answer}" data-start="${b.start}">
      ${lengthSoloHTML(b, unit)}${scale}
    </div>${lengthOptionsHTML(b)}`;
}

/**
 * Indice 2 de la comparaison : deux traits en pointillés par crayon, à son
 * début et à sa fin, posés sur toute la scène (un dessin étiré : même x).
 * @param {LengthBuild} b
 */
function lengthGuidesSVG(b) {
  const lines = b.crayons
    .map((c, i) =>
      [
        ['start', c.start],
        ['end', c.start + c.len],
      ]
        .map(
          ([at, x]) =>
            `<line class="ln-guide" data-i="${i}" data-at="${at}" x1="${x}" x2="${x}" y1="${i * 10 + 0.5}" y2="${i * 10 + 9.5}"/>`,
        )
        .join(''),
    )
    .join('');
  return `<svg class="ln-guides" viewBox="0 0 100 ${b.crayons.length * 10}" preserveAspectRatio="none" aria-hidden="true">${lines}</svg>`;
}

// Indice 2 des gommes : le « 1 » écrit sur la première gomme
/** @param {number} unit largeur d'une gomme */
function lengthUnitNumSVG(unit) {
  return `<text class="ln-unit-num" x="${LENGTH_ZERO + unit / 2}" y="5.2">1</text>`;
}

export { lengthGuidesSVG, lengthStageHTML, lengthUnitNumSVG };
