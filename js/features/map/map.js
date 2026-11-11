/* ---------- Carte des îles (mer animée, route, bateau) ---------- */
import { charFace, charsOf } from '../../entities/character/index.js';
import { avatarHTML } from '../../entities/companion/index.js';
import { missionsForLevel, missionsUntil, state } from '../../entities/game-state/index.js';
import {
  ARCHIPELAGO_ORDER, ARCHIPELAGOS, archipelagoOf, archipelagoUnlocked, currentWorld, lastOpenedLevel,
  nextLockedWorld, WORLD_ORDER, WORLDS, worldsOf, worldUnlocked
} from '../../entities/world/index.js';
import { on } from '../../shared/lib/index.js';
import { bindSpeakButtons, playSound, registerView, showToast, speak, switchView } from '../../shared/ui/index.js';
import { renderSamGuide, teamHeadsHTML } from '../companion-team/index.js';
import { renderIslandCard, renderLevelPill, setWorld } from '../island/index.js';

/* Deux archipels (v55) : le Lagon Magique et le Ciel des Rêves, chacun sa
   carte, choisie par deux onglets en haut. Le Ciel est verrouillé (cadenas et
   son niveau) tant qu'il n'est pas ouvert ; il a son fond pastel et ses
   nuages, et le bateau y devient une montgolfière. On voyage d'île en île à
   l'intérieur d'un archipel ; on passe de l'un à l'autre par l'onglet. */
let mapSaison = null;   // l'archipel affiché (par défaut, celui de l'île courante)
function shownSaison(){
  const s = mapSaison || archipelagoOf(currentWorld);
  return archipelagoUnlocked(s) ? s : 1;
}

// courbe douce passant par les îles d'un archipel (toutes, ou de l'île
// `from` à l'île `to`) ; un morceau suit exactement le tracé complet
function mapRoutePath(ids, from, to){
  const all = ids.map(id=>WORLDS[id].map);
  const pts = all.slice(from || 0, (to == null ? all.length - 1 : to) + 1);
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for(let i=1;i<pts.length;i++){
    const a = pts[i-1], b = pts[i];
    const cx = (a.x+b.x)/2, cy = Math.min(a.y,b.y) - 12;
    d += ` Q ${cx} ${cy} ${b.x} ${b.y}`;
  }
  return d;
}

function renderMapTabs(saison){
  const tabs = document.getElementById('map-tabs');
  if(!tabs) return;
  tabs.innerHTML = ARCHIPELAGO_ORDER.map(s=>{
    const a = ARCHIPELAGOS[s], open = archipelagoUnlocked(s);
    return `<button type="button" class="map-tab ${s === saison ? 'active' : ''} ${open ? '' : 'locked'} ${a.sky ? 'sky' : ''}" data-saison="${s}"
      aria-label="${a.name}${open ? '' : `, niveau ${a.level}`}">
      <span class="mt-ico" aria-hidden="true">${open ? a.emoji : '🔒'}</span>
      <span class="mt-txt"><b>${a.name}</b>${open ? '' : `<i>Niveau ${a.level}</i>`}</span>
    </button>`;
  }).join('');
  tabs.querySelectorAll('[data-saison]').forEach(b=>{
    b.onclick = ()=>{
      const s = Number(b.dataset.saison), a = ARCHIPELAGOS[s];
      if(!archipelagoUnlocked(s)){
        playSound('wrong');
        speak(`${a.name} s'ouvrira au niveau ${a.level}. Continue tes missions !`);
        showToast(`🔒 ${a.name} : niveau ${a.level}`);
        return;
      }
      playSound('tap');
      if(s === shownSaison()) return;
      mapSaison = s;
      speak(a.name);
      renderMap();
    };
  });
}

function renderMap(){
  const el = document.getElementById('island-map');
  if(!el) return;
  const saison = shownSaison(), arch = ARCHIPELAGOS[saison];
  renderMapTabs(saison);
  const ids = worldsOf(saison);
  const route = mapRoutePath(ids);
  // progression = dernière île débloquée (et non l'île où l'on se trouve)
  const reached = ids.reduce((m, id, i)=> worldUnlocked(id) ? i : m, 0);
  const hasNext = reached < ids.length - 1;
  el.classList.toggle('sky', !!arch.sky);
  el.dataset.saison = saison;

  el.innerHTML = `
    <div class="sea" aria-hidden="true">
      ${arch.sky ? `
      <span class="cloud c1">☁️</span><span class="cloud c2">☁️</span><span class="cloud c3">☁️</span>
      <span class="sparkle s1">✨</span><span class="sparkle s2">⭐</span><span class="sparkle s3">✨</span>` : `
      <span class="wave w1"></span><span class="wave w2"></span><span class="wave w3"></span>
      <span class="cloud c1">☁️</span><span class="cloud c2">☁️</span>
      <span class="sparkle s1">✨</span><span class="sparkle s2">✨</span>
      <span class="mapfish f1">🐟</span><span class="mapfish f2">🐠</span>`}
    </div>
    <svg class="route" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
      <path d="${route}" class="route-band"/>
      <path d="${mapRoutePath(ids, 0, reached)}" class="route-band-done"/>
      <path d="${route}" class="route-line"/>
      <path d="${mapRoutePath(ids, 0, reached)}" class="route-done"/>
      ${hasNext ? `<path d="${mapRoutePath(ids, reached, reached + 1)}" class="route-next"/>` : ''}
    </svg>
    ${ids.map((id,i)=>{
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
          ${!locked ? `<span class="isle-chars">${charsOf(id).map(([cid])=>charFace(cid)).join('')}</span>` : ''}
        </span>
        <span class="isle-label"><b>${i+1}. ${w.short}</b><i>${locked?`niv. ${w.level}`:'⭐'.repeat(w.diff)}</i></span>
      </button>`;
    }).join('')}
    <span class="boat ${arch.sky ? 'balloon' : ''}" id="map-boat"><span class="boat-av">${avatarHTML(state.avatar, state.look)}</span><span class="boat-ride">${arch.vehicle}</span><span class="boat-team" data-team-heads>${teamHeadsHTML()}</span></span>
  `;

  // le véhicule est à l'île courante ; dans l'autre archipel, il attend à la première île
  const here = ids.includes(currentWorld);
  placeBoat(here ? currentWorld : ids[0], false);
  document.getElementById('map-boat').classList.toggle('parked', !here);
  renderSamGuide();   // Sam le guide (js/features/companion-team)

  el.querySelectorAll('.map-island').forEach(b=>{
    b.onclick = ()=>{
      playSound('tap');
      const id = b.dataset.world;
      if(!worldUnlocked(id)){ setWorld(id); return; }
      if(id===currentWorld){ switchView('ile'); return; }
      // d'un archipel à l'autre : pas de trajet, on y est tout de suite
      if(!ids.includes(currentWorld)){ landOn(id); return; }
      sailTo(id);
    };
  });

  const info = document.getElementById('map-next');
  if(info){
    // la prochaine étape : une île de cette carte, sinon la prochaine île du
    // voyage (un autre monde, verrouillé ou déjà ouvert), sinon rien
    const nxt = nextLockedWorld(saison) || WORLD_ORDER.find(id=> !worldUnlocked(id));
    if(!nxt){
      info.innerHTML = `🏆 Tu as ouvert toutes les îles ! D'autres arriveront bientôt.`;
    } else if(!archipelagoUnlocked(archipelagoOf(nxt))){
      const a = ARCHIPELAGOS[archipelagoOf(nxt)];
      info.innerHTML = nextStepHTML(a.emoji, 'Prochain monde', a.name, a.level);
    } else {
      info.innerHTML = nextStepHTML('🗺️', 'Prochaine île', WORLDS[nxt].name, WORLDS[nxt].level);
    }
    info.hidden = false;
    bindSpeakButtons();
  }
}

/* La prochaine étape sous la carte : son nom, son niveau, les missions qui
   restent, et une barre qui part de la dernière île ouverte (elle se remplit
   à chaque île, au lieu de compter depuis le tout début). */
function nextStepHTML(icon, label, name, lvl){
  const from = missionsForLevel(lastOpenedLevel()), to = missionsForLevel(lvl);
  const pct = Math.max(0, Math.min(100, Math.round((state.missions - from) / Math.max(1, to - from) * 100)));
  const left = missionsUntil(lvl);
  const rest = `encore ${left} mission${left > 1 ? 's' : ''}`;
  const say = `${label} : ${name}, au niveau ${lvl}. ${rest[0].toUpperCase() + rest.slice(1)}.`.replace(/"/g,'&quot;');
  return `${icon} ${label} : <strong>${name}</strong> au niveau ${lvl} · ${rest}
        <button type="button" class="btn-speak map-next-speak" data-say="${say}" aria-label="Écouter">🔈</button>
        <div class="quest-bar" role="progressbar" aria-label="Vers ${name.replace(/"/g,'&quot;')}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct}"><i style="width:${pct}%"></i></div>`;
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

// on débarque sur une île (après le trajet, ou tout de suite depuis l'autre archipel)
function landOn(id){
  setWorld(id);
  renderMap(); renderIslandCard();
  setTimeout(()=> switchView('ile'), 350);
}

// le bateau navigue d'île en île avant de débarquer
let sailing = false;
function sailTo(id){
  if(sailing){ return; }
  const ids = worldsOf(archipelagoOf(id));
  const from = ids.indexOf(currentWorld), to = ids.indexOf(id);
  const el = document.getElementById('island-map');
  const boat = document.getElementById('map-boat');
  if(!boat || from<0 || to<0){ setWorld(id); return; }
  sailing = true;
  if(el) el.classList.add('sailing');
  boat.classList.toggle('flip', to < from);
  const step = to > from ? 1 : -1;
  const stops = [];
  for(let i=from+step; i!==to+step; i+=step) stops.push(ids[i]);
  let n = 0;
  (function hop(){
    if(n >= stops.length){
      sailing = false;
      if(el) el.classList.remove('sailing');
      landOn(id);   // on débarque
      return;
    }
    placeBoat(stops[n], true);
    playSound('tap');
    n++;
    setTimeout(hop, 620);
  })();
}

registerView('carte', ()=>{ renderMap(); renderIslandCard(); renderLevelPill(); });

// la garde-robe redemande la carte (le bateau porte la tenue)
on('ui:map', renderMap);

// montrer un archipel (l'ouverture du Ciel, js/features/island)
function showArchipelago(saison){ mapSaison = saison; renderMap(); }
on('map:archipelago', showArchipelago);
// on change d'île : la carte montre de nouveau l'archipel de l'île courante
on('world:changed', ()=>{ mapSaison = null; });

export { renderMap };
