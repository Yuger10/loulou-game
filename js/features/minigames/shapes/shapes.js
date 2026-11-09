/* ---------- Mini-jeu : Formes et couleurs (Pays Squishy) ----------
   « Touche tous les… » : l'enfant trie des squishies (formes moelleuses
   avec un petit visage) en touchant TOUS ceux qui répondent à la
   consigne. Le critère dépend du palier (voir `shapesRound` dans
   js/difficulty.js) : couleur, forme, forme + couleur, taille + forme,
   nombre de côtés, nombre de sommets.
   Dessin en SVG, sans image : chaque squishy tient dans un carré 100×100. */

const SQ_COLORS = {
  rose:   { fill:'#FF9CC8', edge:'#C9497F', adj:['rose','roses','rose','roses'] },
  bleu:   { fill:'#6FB8F5', edge:'#2F7CC0', adj:['bleu','bleus','bleue','bleues'] },
  jaune:  { fill:'#FFD95A', edge:'#B8901A', adj:['jaune','jaunes','jaune','jaunes'] },
  vert:   { fill:'#6ED38C', edge:'#2F9551', adj:['vert','verts','verte','vertes'] },
  violet: { fill:'#BFA3EC', edge:'#7B5CC0', adj:['violet','violets','violette','violettes'] },
  orange: { fill:'#FFAE5C', edge:'#C8661A', adj:['orange','orange','orange','orange'] },
};
const SQ_SIZES = {
  grand: ['grand','grands','grande','grandes'],
  petit: ['petit','petits','petite','petites'],
};

// régulier : n sommets sur un cercle de rayon r, premier sommet à l'angle a0 (degrés)
function sqPolygon(n, r, cx, cy, a0){
  return Array.from({length:n}, (_,i)=>{
    const a = (a0 + i*360/n) * Math.PI/180;
    return `${(cx + r*Math.cos(a)).toFixed(1)},${(cy + r*Math.sin(a)).toFixed(1)}`;
  }).join(' ');
}
function sqStar(){
  return Array.from({length:10}, (_,i)=>{
    const r = i%2 ? 21 : 47, a = (-90 + i*36) * Math.PI/180;
    return `${(50 + r*Math.cos(a)).toFixed(1)},${(54 + r*Math.sin(a)).toFixed(1)}`;
  }).join(' ');
}

// g : genre du nom (accords) ; sides / vertices : pour les paliers 5-6 ; face : centre du visage
const SQ_SHAPES = {
  rond:      { g:'m', s:'rond',      p:'ronds',      sides:0, vertices:0, face:[50,54], el:`<circle cx="50" cy="52" r="41"/>` },
  carre:     { g:'m', s:'carré',     p:'carrés',     sides:4, vertices:4, face:[50,54], el:`<rect x="11" y="13" width="78" height="78" rx="7"/>` },
  rectangle: { g:'m', s:'rectangle', p:'rectangles', sides:4, vertices:4, face:[50,55], el:`<rect x="5" y="25" width="90" height="56" rx="6"/>` },
  losange:   { g:'m', s:'losange',   p:'losanges',   sides:4, vertices:4, face:[50,54], el:`<polygon points="50,5 93,52 50,99 7,52"/>` },
  triangle:  { g:'m', s:'triangle',  p:'triangles',  sides:3, vertices:3, face:[50,66], el:`<polygon points="50,8 94,90 6,90"/>` },
  pentagone: { g:'m', s:'pentagone', p:'pentagones', sides:5, vertices:5, face:[50,57], el:`<polygon points="${sqPolygon(5,46,50,55,-90)}"/>` },
  hexagone:  { g:'m', s:'hexagone',  p:'hexagones',  sides:6, vertices:6, face:[50,53], el:`<polygon points="${sqPolygon(6,46,50,52,0)}"/>` },
  octogone:  { g:'m', s:'octogone',  p:'octogones',  sides:8, vertices:8, face:[50,53], el:`<polygon points="${sqPolygon(8,46,50,52,22.5)}"/>` },
  etoile:    { g:'f', s:'étoile',    p:'étoiles',    sides:10, vertices:10, face:[50,58], el:`<polygon points="${sqStar()}"/>` },
  coeur:     { g:'m', s:'cœur',      p:'cœurs',      sides:0, vertices:0, face:[50,46], el:`<path d="M50 90 C22 70 6 52 8 34 C10 16 34 10 50 28 C66 10 90 16 92 34 C94 52 78 70 50 90Z"/>` },
};

/* Un squishy : la forme, un reflet, un petit visage. `plain` = silhouette
   sans visage (pour la consigne). */
function squishySVG(shape, color, plain){
  const sh = SQ_SHAPES[shape], c = SQ_COLORS[color] || { fill:'#E4ECF0', edge:'#7C8E99' };
  const [fx, fy] = sh.face;
  const face = plain ? '' : `
    <ellipse cx="${fx-9}" cy="${fy}" rx="3.4" ry="4.4" fill="#2B2140"/><ellipse cx="${fx+9}" cy="${fy}" rx="3.4" ry="4.4" fill="#2B2140"/>
    <circle cx="${fx-8}" cy="${fy-1.8}" r="1.3" fill="#fff"/><circle cx="${fx+10}" cy="${fy-1.8}" r="1.3" fill="#fff"/>
    <ellipse cx="${fx-16}" cy="${fy+6}" rx="4" ry="2.4" fill="#FF6F91" opacity=".45"/><ellipse cx="${fx+16}" cy="${fy+6}" rx="4" ry="2.4" fill="#FF6F91" opacity=".45"/>
    <path d="M${fx-4} ${fy+5} Q${fx} ${fy+9} ${fx+4} ${fy+5}" fill="none" stroke="#8C2F3F" stroke-width="2.2" stroke-linecap="round"/>`;
  return `<svg class="sq-svg" viewBox="-4 -4 108 108" aria-hidden="true">
    <g fill="${c.fill}" stroke="${c.edge}" stroke-width="4.5" stroke-linejoin="round">${sh.el}</g>
    ${plain ? '' : `<ellipse cx="${fx-14}" cy="${fy-22}" rx="9" ry="5" fill="#fff" opacity=".45" transform="rotate(-25 ${fx-14} ${fy-22})"/>`}
    ${face}
  </svg>`;
}

/* Une manche : la consigne (dite et écrite), son image, et les squishies
   du plateau (dont exactement `targets` répondent à la consigne). */
function shapesBuildRound(dd){
  const cfg = shapesRound(dd);
  const pick = (a)=> a[Math.floor(Math.random()*a.length)];
  const agree = (forms, g, plural)=> forms[(g==='f'?2:0) + (plural?1:0)];
  const tous = (g)=> g==='f' ? 'toutes' : 'tous';
  let test, say, icon;
  if(cfg.criterion==='color'){
    const col = pick(cfg.colors);
    test = it=> it.color===col;
    say = `Touche tous les squishies ${agree(SQ_COLORS[col].adj,'m',true)}`;
    icon = `<span class="sq-dot" style="background:${SQ_COLORS[col].fill};border-color:${SQ_COLORS[col].edge}"></span>`;
  } else if(cfg.criterion==='shape'){
    const sh = pick(cfg.shapes), S = SQ_SHAPES[sh];
    test = it=> it.shape===sh;
    say = `Touche ${tous(S.g)} les ${S.p}`;
    icon = `<span class="sq-hint-shape">${squishySVG(sh, null, true)}</span>`;
  } else if(cfg.criterion==='shapeColor'){
    const sh = pick(cfg.shapes), col = pick(cfg.colors), S = SQ_SHAPES[sh];
    test = it=> it.shape===sh && it.color===col;
    say = `Touche ${tous(S.g)} les ${S.p} ${agree(SQ_COLORS[col].adj, S.g, true)}`;
    icon = `<span class="sq-hint-shape">${squishySVG(sh, col, true)}</span>`;
  } else if(cfg.criterion==='sizeShape'){
    const sh = pick(cfg.shapes), size = pick(['grand','petit']), S = SQ_SHAPES[sh];
    test = it=> it.shape===sh && it.size===size;
    say = `Touche ${tous(S.g)} les ${agree(SQ_SIZES[size], S.g, true)} ${S.p}`;
    icon = `<span class="sq-hint-shape ${size==='petit'?'is-small':''}">${squishySVG(sh, null, true)}</span>`;
  } else {
    const key = cfg.criterion; // 'sides' ou 'vertices'
    const counts = [...new Set(cfg.shapes.map(s=>SQ_SHAPES[s][key]).filter(n=>n>=3))];
    const n = pick(counts);
    test = it=> SQ_SHAPES[it.shape][key]===n;
    say = `Touche toutes les formes qui ont ${n} ${key==='sides' ? 'côtés' : 'sommets'}`;
    icon = '';
  }

  const sized = cfg.criterion==='sizeShape';
  const rnd = ()=>({ shape:pick(cfg.shapes), color:pick(cfg.colors), size: sized ? pick(['grand','petit']) : 'moyen' });
  const items = [];
  // les bonnes réponses
  let guard = 0;
  while(items.length < cfg.targets && guard++ < 500){ const it = rnd(); if(test(it)) items.push({...it, ok:true}); }
  // des « presque » : même forme ou même couleur/taille que la cible, pour obliger à regarder les deux
  const ref = items[0];
  const near = [];
  if(cfg.criterion==='shapeColor'){ near.push({...ref, color:pick(cfg.colors.filter(c=>c!==ref.color))}); near.push({...ref, shape:pick(cfg.shapes.filter(s=>s!==ref.shape))}); }
  if(cfg.criterion==='sizeShape'){ near.push({...ref, size: ref.size==='grand'?'petit':'grand'}); near.push({...ref, shape:pick(cfg.shapes.filter(s=>s!==ref.shape))}); }
  near.forEach(it=>{ if(!test(it)) items.push({...it, ok:false}); });
  // et le reste au hasard, sans jamais répondre à la consigne
  guard = 0;
  while(items.length < cfg.items && guard++ < 1000){ const it = rnd(); if(!test(it)) items.push({...it, ok:false}); }
  return { cfg, say, icon, items: shuffle(items), targets: items.filter(i=>i.ok).length };
}

function renderShapes(){
  setupLives('shapes');
  const dd = gameDiff();
  const r = shapesBuildRound(dd);
  let found = 0;
  const cols = r.items.length===8 ? 4 : 3;
  openModal(`
    ${gameHeader('🍡 Les squishies', `${r.icon}<span>${r.say} !</span>`, r.say)}
    ${livesBar()}
    <div class="sq-progress">${progressDots(0, r.targets)}</div>
    <div class="sq-board" style="--cols:${cols}">
      ${r.items.map((it,i)=>`<button type="button" class="sq-item sq-${it.size}" data-i="${i}"
          aria-label="${SQ_SHAPES[it.shape].s} ${SQ_COLORS[it.color].adj[SQ_SHAPES[it.shape].g==='f'?2:0]}${it.size!=='moyen'?', '+it.size:''}">
          ${squishySVG(it.shape, it.color)}<span class="sq-check" aria-hidden="true">✓</span></button>`).join('')}
    </div>
  `);
  bindQuit();
  setSolution(r.items.map((it,i)=> it.ok ? solSel('.sq-item','i',i) : null).filter(Boolean));
  document.querySelectorAll('.sq-item').forEach(btn=>{
    btn.onclick = ()=>{
      const it = r.items[Number(btn.dataset.i)];
      btn.classList.remove('squish'); void btn.offsetWidth; btn.classList.add('squish');
      if(it.ok){
        btn.disabled = true; btn.classList.add('found');
        found++;
        const prog = document.querySelector('.sq-progress');
        if(prog) prog.innerHTML = progressDots(found, r.targets);
        stepOk(btn);
        if(found >= r.targets){ flashModal('ok'); setTimeout(onMissionWin, 500); }
      } else {
        loseLife(btn);
      }
    };
  });
}

// inscription auprès du moteur de mini-jeux (js/features/minigame-engine)
registerGame('shapes', renderShapes);
