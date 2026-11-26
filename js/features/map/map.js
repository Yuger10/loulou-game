/* ---------- Carte des îles (mer animée, route, bateau) ---------- */
import { charFace, charsOf } from '../../entities/character/index.js';
import { avatarHTML } from '../../entities/companion/index.js';
import { state } from '../../entities/game-state/index.js';
import {
  ARCHIPELAGOS,
  archipelagoOf,
  archipelagoUnlocked,
  currentWorld,
  shownArchipelagos,
  WORLDS,
  worldsOf,
  worldUnlocked,
} from '../../entities/world/index.js';
import { on } from '../../shared/lib/index.js';
import { playSound, registerView, setHandler, showToast, speak, switchView } from '../../shared/ui/index.js';
import { renderSamGuide, teamHeadsHTML } from '../companion-team/index.js';
import { renderIslandCard, renderLevelPill, setWorld } from '../island/index.js';
import { renderMapNext } from './next-step.js';

/* Les archipels (v55) : le Lagon Magique, le Ciel des Rêves, puis La Grande
   Expédition (carte en vieux papier, avion en papier), chacun sa carte,
   choisie par les onglets en haut. Le Ciel est verrouillé (cadenas et
   son niveau) tant qu'il n'est pas ouvert ; il a son fond pastel et ses
   nuages, et le bateau y devient une montgolfière. On voyage d'île en île à
   l'intérieur d'un archipel ; on passe de l'un à l'autre par l'onglet. */
/** @type {number | null} */
let mapSaison = null; // l'archipel affiché (par défaut, celui de l'île courante)
function shownSaison() {
  const s = mapSaison || archipelagoOf(currentWorld);
  return archipelagoUnlocked(s) ? s : 1;
}

// courbe douce passant par les îles d'un archipel (toutes, ou de l'île
// `from` à l'île `to`) ; un morceau suit exactement le tracé complet
/** @param {string[]} ids les îles de l'archipel @param {number} [from] @param {number} [to] */
function mapRoutePath(ids, from, to) {
  const all = ids.map((id) => WORLDS[id].map);
  const pts = all.slice(from || 0, (to == null ? all.length - 1 : to) + 1);
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1],
      b = pts[i];
    const cx = (a.x + b.x) / 2,
      cy = Math.min(a.y, b.y) - 12;
    d += ` Q ${cx} ${cy} ${b.x} ${b.y}`;
  }
  return d;
}

/** @param {number} saison l'archipel affiché */
function renderMapTabs(saison) {
  const tabs = document.getElementById('map-tabs');
  if (!tabs) return;
  // seuls les archipels qui ont une île ont un onglet (un archipel vide reste caché)
  tabs.innerHTML = shownArchipelagos()
    .map((s) => {
      const a = ARCHIPELAGOS[s],
        open = archipelagoUnlocked(s);
      return `<button type="button" class="map-tab ${s === saison ? 'active' : ''} ${open ? '' : 'locked'} ${a.sky ? 'sky' : ''} ${a.paper ? 'paper' : ''}" data-saison="${s}"
      aria-label="${a.name}${open ? '' : `, niveau ${a.level}`}">
      <span class="mt-ico" aria-hidden="true">${open ? a.emoji : '🔒'}</span>
      <span class="mt-txt"><b>${a.name}</b>${open ? '' : `<i>Niveau ${a.level}</i>`}</span>
    </button>`;
    })
    .join('');
  tabs.querySelectorAll('[data-saison]').forEach((b) => {
    setHandler(b, 'click', () => {
      const s = Number(b.dataset.saison),
        a = ARCHIPELAGOS[s];
      if (!archipelagoUnlocked(s)) {
        playSound('wrong');
        speak(`${a.name} s'ouvrira au niveau ${a.level}. Continue tes missions !`);
        showToast(`🔒 ${a.name} : niveau ${a.level}`);
        return;
      }
      playSound('tap');
      if (s === shownSaison()) return;
      mapSaison = s;
      speak(a.name);
      renderMap();
    });
  });
}

// le décor derrière les îles : ciel pastel, vieux papier ou mer
/** @param {{ sky: boolean, paper: boolean }} arch l'archipel affiché */
function seaHTML(arch) {
  if (arch.sky)
    return `
      <span class="cloud c1">☁️</span><span class="cloud c2">☁️</span><span class="cloud c3">☁️</span>
      <span class="sparkle s1">✨</span><span class="sparkle s2">⭐</span><span class="sparkle s3">✨</span>`;
  if (arch.paper)
    return `
      <span class="compass">🧭</span><span class="cloud c1">☁️</span><span class="cloud c2">☁️</span>
      <span class="sparkle s1">✨</span><span class="sparkle s2">✨</span>`;
  return `
      <span class="wave w1"></span><span class="wave w2"></span><span class="wave w3"></span>
      <span class="cloud c1">☁️</span><span class="cloud c2">☁️</span>
      <span class="sparkle s1">✨</span><span class="sparkle s2">✨</span>
      <span class="mapfish f1">🐟</span><span class="mapfish f2">🐠</span>`;
}

function renderMap() {
  const el = document.getElementById('island-map');
  if (!el) return;
  const saison = shownSaison(),
    arch = ARCHIPELAGOS[saison];
  renderMapTabs(saison);
  const ids = worldsOf(saison);
  const route = mapRoutePath(ids);
  // progression = dernière île débloquée (et non l'île où l'on se trouve)
  const reached = ids.reduce((m, id, i) => (worldUnlocked(id) ? i : m), 0);
  const hasNext = reached < ids.length - 1;
  el.classList.toggle('sky', !!arch.sky);
  el.classList.toggle('paper', !!arch.paper);
  el.dataset.saison = String(saison); // dataset ne garde que du texte (même valeur qu'avant)
  el.innerHTML = `
    <div class="sea" aria-hidden="true">
      ${seaHTML(arch)}
    </div>
    <svg class="route" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
      <path d="${route}" class="route-band"/>
      <path d="${mapRoutePath(ids, 0, reached)}" class="route-band-done"/>
      <path d="${route}" class="route-line"/>
      <path d="${mapRoutePath(ids, 0, reached)}" class="route-done"/>
      ${hasNext ? `<path d="${mapRoutePath(ids, reached, reached + 1)}" class="route-next"/>` : ''}
    </svg>
    ${ids.map(mapIslandHTML).join('')}
    <span class="boat ${arch.sky ? 'balloon' : arch.paper ? 'plane' : ''}" id="map-boat"><span class="boat-av">${avatarHTML(state.avatar, state.look)}</span><span class="boat-ride">${arch.vehicle}</span><span class="boat-team" data-team-heads>${teamHeadsHTML()}</span></span>
  `;
  // le véhicule est à l'île courante ; dans l'autre archipel, il attend à la première île
  const here = ids.includes(currentWorld);
  placeBoat(here ? currentWorld : ids[0], false);
  // le bateau vient d'être dessiné dans la carte, juste au-dessus
  /** @type {HTMLElement} */ (document.getElementById('map-boat')).classList.toggle('parked', !here);
  renderSamGuide(); // Sam le guide (js/features/companion-team)
  bindMapIslands(el, ids);
  renderMapNext(saison);
}

/** @param {string} id @param {number} i son rang sur la carte */
function mapIslandHTML(id, i) {
  const w = WORLDS[id];
  const locked = !worldUnlocked(id);
  const here = currentWorld === id;
  return `<button class="map-island shape-${w.shape} ${here ? 'here' : ''} ${locked ? 'locked' : ''}"
                data-world="${id}"
                style="left:${w.map.x}%; top:${w.map.y}%; --d:${i * 0.4}s; --sand:${w.sand}; --land:${w.land};"
                aria-label="${w.name}${locked ? ', verrouillée' : ''}">
        <span class="isle">
          <span class="isle-land"></span>
          <span class="isle-icon">${w.icon}</span>
          ${locked ? '<span class="isle-lock">🔒</span>' : ''}
          ${
            !locked
              ? `<span class="isle-chars">${charsOf(id)
                  .map(([cid]) => charFace(cid))
                  .join('')}</span>`
              : ''
          }
        </span>
        <span class="isle-label"><b>${i + 1}. ${w.short}</b><i>${locked ? `niv. ${w.level}` : '⭐'.repeat(w.diff)}</i></span>
      </button>`;
}

// toucher une île : y aller (en bateau, ou tout de suite depuis l'autre archipel)
/** @param {HTMLElement} el la carte @param {string[]} ids les îles de l'archipel affiché */
function bindMapIslands(el, ids) {
  el.querySelectorAll('.map-island').forEach((b) => {
    setHandler(b, 'click', () => {
      playSound('tap');
      // chaque .map-island porte data-world (juste au-dessus)
      const id = /** @type {string} */ (b.dataset.world);
      if (!worldUnlocked(id)) setWorld(id);
      else if (id === currentWorld) switchView('ile');
      // d'un archipel à l'autre : pas de trajet, on y est tout de suite
      else if (!ids.includes(currentWorld)) landOn(id);
      else sailTo(id);
    });
  });
}

/** @param {string} id l'île @param {boolean} animated */
function placeBoat(id, animated) {
  const boat = document.getElementById('map-boat');
  const w = WORLDS[id];
  if (!boat || !w) return;
  boat.style.transition = animated ? 'left .75s cubic-bezier(.45,0,.35,1), top .75s cubic-bezier(.45,0,.35,1)' : 'none';
  // le bateau mouille à côté de l'île (jamais sur son étiquette)
  const side = w.map.x < 50 ? 1 : -1;
  boat.style.left = w.map.x + side * 15 + '%';
  boat.style.top = w.map.y - 2 + '%';
}

// on débarque sur une île (après le trajet, ou tout de suite depuis l'autre archipel)
/** @param {string} id */
function landOn(id) {
  setWorld(id);
  renderMap();
  renderIslandCard();
  setTimeout(() => switchView('ile'), 350);
}

// le bateau navigue d'île en île avant de débarquer
let sailing = false;
/** @param {string} id */
function sailTo(id) {
  if (sailing) return;
  const ids = worldsOf(archipelagoOf(id));
  const from = ids.indexOf(currentWorld),
    to = ids.indexOf(id);
  const el = document.getElementById('island-map');
  const boat = document.getElementById('map-boat');
  if (!boat || from < 0 || to < 0) {
    setWorld(id);
    return;
  }
  sailing = true;
  if (el) el.classList.add('sailing');
  boat.classList.toggle('flip', to < from);
  const step = to > from ? 1 : -1;
  const stops = [];
  for (let i = from + step; i !== to + step; i += step) stops.push(ids[i]);
  let n = 0;
  (function hop() {
    if (n >= stops.length) {
      sailing = false;
      if (el) el.classList.remove('sailing');
      landOn(id); // on débarque
      return;
    }
    placeBoat(stops[n], true);
    playSound('tap');
    n++;
    setTimeout(hop, 620);
  })();
}

registerView('carte', () => {
  renderMap();
  renderIslandCard();
  renderLevelPill();
});

// la garde-robe redemande la carte (le bateau porte la tenue)
on('ui:map', renderMap);

// montrer un archipel (l'ouverture du Ciel, js/features/island)
/** @param {number} saison */
function showArchipelago(saison) {
  mapSaison = saison;
  renderMap();
}
on('map:archipelago', showArchipelago);
// on change d'île : la carte montre de nouveau l'archipel de l'île courante
on('world:changed', () => {
  mapSaison = null;
});

export { renderMap };
