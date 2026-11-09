/* ---------- En-tête du joueur et écran de bienvenue ---------- */
import {
  avatarHTML, avatarText, bindCompanionSelector, COMPANIONS, companionSelector, companionsFor,
  defaultCompanionFor
} from '../../entities/companion/index.js';
import { save, state } from '../../entities/game-state/index.js';
import { AVATARS, currentProfile, onProfileRefresh, saveProfiles } from '../../entities/player/index.js';
import { emit, on } from '../../shared/lib/index.js';
import { playSound, showToast, speak } from '../../shared/ui/index.js';
import { applySeason } from '../seasons/index.js';
import { openStoryChapter, storySolved } from '../story/index.js';

function renderProfile(){
  document.querySelector('#avatar-pill .av').innerHTML = avatarHTML(state.avatar, state.look);
  emit('ui:backup-reminder');
  applySeason();   // anniversaire : propre à chaque joueur
  document.getElementById('player-name').textContent = state.name || 'Toi';
}
let pendingAvatar = '👧';
let pendingGender = '', pendingCompanion = null, welcomeAllBuddies = false;
// prénom, « tu es… » et compagnon sur l'écran d'accueil
function renderWelcomeExtra(){
  const box = document.getElementById('welcome-extra');
  if(!box) return;
  const comp = pendingCompanion || defaultCompanionFor(pendingGender);
  box.innerHTML = genderSelector(pendingGender) + companionSelector(comp, pendingGender, welcomeAllBuddies);
  box.querySelectorAll('.gender-opt').forEach(b=>{
    b.onclick = ()=>{
      pendingGender = b.dataset.gender; playSound('tap');
      // le compagnon suit le profil tant que l'enfant n'en a pas choisi un autre
      if(pendingCompanion && !companionsFor(pendingGender).includes(pendingCompanion) && !welcomeAllBuddies) pendingCompanion = null;
      renderWelcomeExtra();
    };
  });
  bindCompanionSelector(box, k=>{ pendingCompanion = k; renderWelcomeExtra(); speak(`${COMPANIONS[k].name} ${COMPANIONS[k].title} part à l'aventure avec toi !`); },
    ()=>{ welcomeAllBuddies = true; renderWelcomeExtra(); });
}
function openWelcome(){
  const grid = document.getElementById('avatar-grid');
  pendingAvatar = state.avatar || '👧';
  grid.innerHTML = AVATARS.map(a=>`<button class="avatar-opt ${a===pendingAvatar?'sel':''}" data-av="${a}" aria-label="${avatarText(a)}">${avatarHTML(a)}</button>`).join('');
  grid.querySelectorAll('.avatar-opt').forEach(b=>{
    b.onclick = ()=>{
      pendingAvatar = b.dataset.av;
      grid.querySelectorAll('.avatar-opt').forEach(x=>x.classList.toggle('sel', x===b));
      playSound('tap');
    };
  });
  document.getElementById('name-input').value = state.name || '';
  const p0 = currentProfile();
  pendingGender = (p0 && p0.gender) || '';
  pendingCompanion = (p0 && p0.companion) || null;
  welcomeAllBuddies = false;
  renderWelcomeExtra();
  document.getElementById('welcome').classList.add('show');
}
function closeWelcome(){
  const name = document.getElementById('name-input').value.trim().slice(0,12);
  state.name = name;
  state.avatar = pendingAvatar;
  const p1 = currentProfile();
  if(p1){
    p1.gender = pendingGender;
    p1.companion = pendingCompanion || defaultCompanionFor(pendingGender);
    saveProfiles();
  }
  save();
  renderProfile();
  document.getElementById('welcome').classList.remove('show');
  const extra = document.getElementById('welcome-extra');
  if(extra) extra.innerHTML = '';
  playSound('win');
  const who = name ? name : 'toi';
  speak(`Bonjour ${who} ! Bienvenue dans le lagon magique.`);
  showToast(name ? `Bonjour ${name} ! ✨` : 'Bonne aventure ! ✨');
  emit('ui:lagon');
  // premier lancement : le fil de l'histoire commence par le chapitre du
  // Lagon (jamais répété une fois résolu — voir js/features/story/story.js)
  if(!storySolved('lagon')){
    setTimeout(()=> openStoryChapter('lagon'), 600);
  }
}

// changement de joueur : en-tête à jour (js/entities/player/profiles.js)
onProfileRefresh(renderProfile);

// une fête, une tenue… : l'en-tête se redessine à la demande
on('ui:profile', renderProfile);

function genderSelector(sel){
  const opts = [
    { v:'f', emoji:'👧', label:'Fille' },
    { v:'m', emoji:'👦', label:'Garçon' },
    { v:'',  emoji:'🧒', label:'Peu importe' },
  ];
  return `<label class="mini-label">Comment on te parle ?</label>
    <div class="gender-row">
      ${opts.map(o=>`<button class="gender-opt ${String(sel||'')===o.v?'sel':''}" data-gender="${o.v}">
        <span class="ge">${o.emoji}</span><span class="gl">${o.label}</span></button>`).join('')}
    </div>`;
}

export { closeWelcome, genderSelector, openWelcome, renderProfile };
