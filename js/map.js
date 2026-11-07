/* ---------- Carte des îles (mer animée, route, bateau) ---------- */

// courbe douce passant par les îles (toutes, ou de l'île `from` à l'île `to`) ;
// un morceau suit exactement le tracé complet, pour s'y superposer
function mapRoutePath(from, to){
  const all = WORLD_ORDER.map(id=>WORLDS[id].map);
  const pts = all.slice(from || 0, (to == null ? all.length - 1 : to) + 1);
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for(let i=1;i<pts.length;i++){
    const a = pts[i-1], b = pts[i];
    const cx = (a.x+b.x)/2, cy = Math.min(a.y,b.y) - 12;
    d += ` Q ${cx} ${cy} ${b.x} ${b.y}`;
  }
  return d;
}

function renderMap(){
  const el = document.getElementById('island-map');
  if(!el) return;
  const route = mapRoutePath();
  // progression = dernière île débloquée (et non l'île où l'on se trouve)
  const reached = WORLD_ORDER.reduce((m, id, i)=> worldUnlocked(id) ? i : m, 0);
  const hasNext = reached < WORLD_ORDER.length - 1;

  el.innerHTML = `
    <div class="sea" aria-hidden="true">
      <span class="wave w1"></span><span class="wave w2"></span><span class="wave w3"></span>
      <span class="cloud c1">☁️</span><span class="cloud c2">☁️</span>
      <span class="sparkle s1">✨</span><span class="sparkle s2">✨</span>
      <span class="mapfish f1">🐟</span><span class="mapfish f2">🐠</span>
    </div>
    <svg class="route" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
      <path d="${route}" class="route-band"/>
      <path d="${mapRoutePath(0, reached)}" class="route-band-done"/>
      <path d="${route}" class="route-line"/>
      <path d="${mapRoutePath(0, reached)}" class="route-done"/>
      ${hasNext ? `<path d="${mapRoutePath(reached, reached + 1)}" class="route-next"/>` : ''}
    </svg>
    ${WORLD_ORDER.map((id,i)=>{
      const w = WORLDS[id];
      const locked = !worldUnlocked(id);
      const here = currentWorld===id;
      return `<button class="map-island shape-${w.shape} ${here?'here':''} ${locked?'locked':''}"
                data-world="${id}"
                style="left:${w.map.x}%; top:${w.map.y}%; --d:${i*0.4}s; --sand:${w.sand}; --land:${w.land};"
                aria-label="${w.name}${locked?', verrouillée':''}">
        <span class="isle">
          <span class="isle-land"></span>
          <span class="isle-icon">${w.icon}</span>
          ${locked ? '<span class="isle-lock">🔒</span>' : ''}
          ${!locked ? `<span class="isle-chars">${charsOf(id).map(([,c])=>c.emoji).join('')}</span>` : ''}
        </span>
        <span class="isle-label"><b>${i+1}. ${w.short}</b><i>${locked?`niv. ${w.level}`:'⭐'.repeat(w.diff)}</i></span>
      </button>`;
    }).join('')}
    <span class="boat" id="map-boat"><span class="boat-av">${state.avatar||'👧'}</span>⛵</span>
  `;

  placeBoat(currentWorld, false);

  el.querySelectorAll('.map-island').forEach(b=>{
    b.onclick = ()=>{
      playSound('tap');
      const id = b.dataset.world;
      if(!worldUnlocked(id)){ setWorld(id); return; }
      if(id===currentWorld){ switchView('ile'); return; }
      sailTo(id);
    };
  });

  const nxt = nextLockedWorld();
  const info = document.getElementById('map-next');
  if(info){
    if(nxt){
      const w = WORLDS[nxt];
      const need = (w.level-1) * MISSIONS_PER_LEVEL;
      const pct = Math.min(100, Math.round(state.missions/need*100));
      const say = `Prochaine île : ${w.name}, au niveau ${w.level}`.replace(/"/g,'&quot;');
      info.innerHTML = `🗺️ Prochaine île : <strong>${w.name}</strong> au niveau ${w.level}
        <button type="button" class="btn-speak map-next-speak" data-say="${say}" aria-label="Écouter">🔈</button>
        <div class="quest-bar"><i style="width:${pct}%"></i></div>`;
    } else {
      info.innerHTML = `🏆 Tu as débloqué toutes les îles !`;
    }
    info.hidden = false;
    bindSpeakButtons();
  }
}

function placeBoat(id, animated){
  const boat = document.getElementById('map-boat');
  const w = WORLDS[id];
  if(!boat || !w) return;
  boat.style.transition = animated
    ? 'left .75s cubic-bezier(.45,0,.35,1), top .75s cubic-bezier(.45,0,.35,1)'
    : 'none';
  // le bateau mouille à côté de l'île (jamais sur son étiquette)
  const side = w.map.x < 50 ? 1 : -1;
  boat.style.left = (w.map.x + side*15) + '%';
  boat.style.top  = (w.map.y - 2) + '%';
}

// le bateau navigue d'île en île avant de débarquer
let sailing = false;
function sailTo(id){
  if(sailing){ return; }
  const from = WORLD_ORDER.indexOf(currentWorld), to = WORLD_ORDER.indexOf(id);
  const el = document.getElementById('island-map');
  const boat = document.getElementById('map-boat');
  if(!boat || from<0 || to<0){ setWorld(id); return; }
  sailing = true;
  if(el) el.classList.add('sailing');
  boat.classList.toggle('flip', to < from);
  const step = to > from ? 1 : -1;
  const stops = [];
  for(let i=from+step; i!==to+step; i+=step) stops.push(WORLD_ORDER[i]);
  let n = 0;
  (function hop(){
    if(n >= stops.length){
      sailing = false;
      if(el) el.classList.remove('sailing');
      setWorld(id);
      renderMap(); renderIslandCard();
      setTimeout(()=> switchView('ile'), 350);   // on débarque
      return;
    }
    placeBoat(stops[n], true);
    playSound('tap');
    n++;
    setTimeout(hop, 620);
  })();
}
