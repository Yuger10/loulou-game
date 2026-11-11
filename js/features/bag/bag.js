// onglets du sac : objets / album
import { hello, save, state } from '../../entities/game-state/index.js';
import { ALBUM_REWARD, ALL_ITEMS, countItem, CRAFTED, DECOS } from '../../entities/item/index.js';
import { onProfileRefresh, profiles } from '../../entities/player/index.js';
import { WORLDS } from '../../entities/world/index.js';
import { emit } from '../../shared/lib/index.js';
import {
  bindSpeakButtons, closeModal, confetti, openModal, playSound, registerView, speak, vibrate
} from '../../shared/ui/index.js';
import { queueGain } from '../gains/index.js';
import { addCoins } from '../wallet/index.js';
import { clearLookTry, renderLook } from '../wardrobe/index.js';

let currentSacTab = 'sac';

function setSacTab(tab){
  currentSacTab = tab;
  document.querySelectorAll('[data-sactab]').forEach(b=>b.classList.toggle('active', b.dataset.sactab===tab));
  const sac = document.getElementById('sac-content');
  const alb = document.getElementById('album-content');
  const look = document.getElementById('look-content');
  if(!sac || !alb) return;
  sac.hidden = tab!=='sac';
  alb.hidden = tab!=='album';
  if(look) look.hidden = tab!=='look';
  if(tab==='sac') renderSac();
  else if(tab==='album') renderAlbum();
  else { clearLookTry(); renderLook(); }
  emit('bag:tab', tab);   // Rose (collection) : ce qui manque, et où le trouver (js/features/companion-team)
}

function renderBadge(){
  const b = document.getElementById('sac-badge');
  b.hidden = state.newItems===0;
  b.textContent = state.newItems;
}

/* ---------- Sac ---------- */
function renderSac(){
  const owned = Object.keys(ALL_ITEMS).filter(k=>countItem(k)>0);
  const el = document.getElementById('sac-content');
  if(owned.length===0){
    el.innerHTML = `<div class="empty-state"><span class="es-art">🎒</span>Ton sac est vide !<br>Va aider Marina, Étincelle ou Luna pour gagner des objets ✨</div>`;
    speak("Ton sac est vide. Va aider un personnage pour gagner des objets !");
    return;
  }
  el.innerHTML = `<div class="sac-grid">
    ${owned.map(k=>{
      const it = ALL_ITEMS[k];
      const say = `${it.name}, ${countItem(k)}`.replace(/"/g,'&quot;');
      return `<button type="button" class="item-card ${CRAFTED[k]?'crafted':''}" data-say="${say}" aria-label="${it.name}, ${countItem(k)}">
        <span class="emoji">${it.emoji}</span><div class="name">${it.name}</div><div class="qty">x${countItem(k)}</div>
      </button>`;
    }).join('')}
  </div>`;
  bindSpeakButtons();
}

/* ---------- Album ---------- */
function markSeen(key){
  if(!state.seen) state.seen = {};
  if(!state.seen[key]){
    state.seen[key] = true; save();
    setTimeout(checkAlbumComplete, 800);
    return true;
  }
  return false;
}

function albumStats(){
  const seen = state.seen || {};
  const objKeys = Object.keys(ALL_ITEMS);
  const decoKeys = Object.keys(DECOS);
  const found = objKeys.filter(k=>seen[k]||countItem(k)>0).length
              + decoKeys.filter(k=>state.decos.includes(k)).length;
  return { found, total: objKeys.length + decoKeys.length };
}

function checkAlbumComplete(){
  const { found, total } = albumStats();
  if(found < total || state.albumReward) return;
  state.albumReward = true; save();
  addCoins(ALBUM_REWARD);
  playSound('win'); confetti(); vibrate([80,50,80,50,200]);
  const who = hello();
  speak(`Incroyable${who?' '+who:''} ! Tu as trouvé tous les objets du jeu. Ton album est complet !`);
  openModal(`
    <div class="reward-box">
      <span class="big-emoji">🏆</span>
      <h2>Album complet !</h2>
      <div class="speech">Tu as découvert les <strong>${total}</strong> objets et décorations du jeu${who?', '+who:''} ! 🌟</div>
      <div class="speech" style="display:flex; align-items:center; justify-content:center; gap:10px; background:#FFF9E8;">
        <span data-gain-coins style="font-size:2rem;">🪙</span><span><strong>+${ALBUM_REWARD} pièces</strong></span>
      </div>
    </div>
    <button class="btn-primary" id="btn-yay">Waouh ! 🎉</button>
  `);
  queueGain({ coins:ALBUM_REWARD });
  document.getElementById('btn-yay').onclick = ()=>{ playSound('tap'); closeModal(); };
}

function renderAlbum(){
  const el = document.getElementById('album-content');
  const seen = state.seen || {};
  const cell = (k, it, unlocked)=>`
    <div class="album-cell ${unlocked?'':'locked'}">
      <span class="emoji">${unlocked?it.emoji:'❓'}</span>
      <span class="nm">${unlocked?it.name:'?'}</span>
    </div>`;
  const objKeys = Object.keys(ALL_ITEMS);
  const decoKeys = Object.keys(DECOS);
  const { found, total } = albumStats();
  const group = (keys, src, isUnlocked) => keys.map(k=>cell(k, src[k], isUnlocked(k))).join('');
  const isObj = k => !!(seen[k]||countItem(k)>0);
  const isDeco = k => state.decos.includes(k);
  const worldOf = o => o.world || 'lagon';
  el.innerHTML = `
    <div class="album-progress">
      ${found===total ? '🏆 Album complet, bravo !' : `✨ ${found} / ${total} découverts`}
      <div class="quest-bar"><i style="width:${(found/total)*100}%"></i></div>
    </div>
    <div class="album-section">
      ${Object.entries(WORLDS).map(([wid,w])=>`
        <h3>${w.emoji} ${w.name}</h3>
        <div class="album-grid">${group(objKeys.filter(k=>worldOf(ALL_ITEMS[k])===wid), ALL_ITEMS, isObj)}</div>
        <h3 style="font-size:.85rem; opacity:.85;">🎨 Décorations</h3>
        <div class="album-grid">${group(decoKeys.filter(k=>worldOf(DECOS[k])===wid), DECOS, isDeco)}</div>
      `).join('')}
    </div>`;
}

// bouton « réglages / recommencer » du sac
document.getElementById('reset-btn').addEventListener('click', ()=>{
  playSound('tap');
  // ouvre les réglages du joueur courant (recommencer et supprimer : espace parents)
  emit('nav:player-settings', profiles.current);
});

registerView('sac', ({ sacTab })=>{
  state.newItems = 0; save(); renderBadge();
  setSacTab(sacTab || currentSacTab);
});

// changement de joueur : pastille des nouveaux objets
onProfileRefresh(renderBadge);

export { checkAlbumComplete, markSeen, renderBadge, setSacTab };
