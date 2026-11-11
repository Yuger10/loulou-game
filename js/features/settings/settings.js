/* ---------- Écran Réglages (track navigation-reglages) ----------
   Une vue à part entière (registerView('reglages')), ouverte en touchant
   l'avatar et le prénom en haut : pas de 5e bouton dans la barre du bas.
   Il regroupe ce qui était dispersé :
     🔊 Son     : trois interrupteurs (Bruitages, Voix, Musique) et le volume ;
                  le bouton 🔊 du haut reste un raccourci, synchronisé ;
     🙂 Moi     : le profil du joueur courant (formulaire de la v59), « Mon équipe » ;
     👥 Joueurs : changer de joueur, en ajouter, jouer à plusieurs ;
     🔒 Parents : espace parents et sauvegarde, derrière la multiplication. */
import { avatarHTML, COMPANIONS, companionOf } from '../../entities/companion/index.js';
import { save, state } from '../../entities/game-state/index.js';
import { currentProfile, onProfileRefresh, profiles, switchProfile } from '../../entities/player/index.js';
import { playSound, registerView, showToast, soundModeLabel, speak, switchView } from '../../shared/ui/index.js';
import { backupDue, openBackup } from '../backup/index.js';
import { renderTeamHeads } from '../companion-team/index.js';
import { openParentGate, openParents } from '../parents/index.js';
import { openNewPlayer, openPlayers, openPlayerSettings } from '../players/index.js';
import { renderProfile, renderSoundBtn } from '../profile/index.js';

// un interrupteur lisible au doigt : libellé, état, et désactivé si besoin
function rgSwitch(key, label, on, disabled){
  return `<button type="button" class="rg-switch" role="switch" data-sound="${key}" aria-checked="${on}"${disabled ? ' aria-disabled="true"' : ''}>
    <span class="rg-switch-label">${label}</span><span class="rg-switch-track" aria-hidden="true"><span class="rg-switch-knob"></span></span>
  </button>`;
}

function renderSettings(){
  const el = document.getElementById('reglages-content');
  if(!el) return;
  const p = currentProfile() || {};
  const comp = COMPANIONS[companionOf(p)] || {};
  const vol = typeof state.soundVolume === 'number' ? state.soundVolume : 80;
  el.innerHTML = `
    ${backupDue() ? `<p class="rg-reminder">💾 Pense à faire une sauvegarde de la partie (section Parents).</p>` : ''}
    <section class="rg-card rg-me" aria-labelledby="rg-me-title">
      <h3 id="rg-me-title">🙂 Moi</h3>
      <div class="rg-me-row">
        <span class="rg-me-av">${avatarHTML(state.avatar, state.look)}</span>
        <div class="rg-me-txt"><strong>${state.name || 'Toi'}</strong><small>${p.age ? `${p.age} ans · ` : ''}${comp.name ? `avec ${comp.name}` : ''}</small></div>
        <button type="button" class="btn-small" id="rg-edit">✏️ Modifier</button>
      </div>
      <div class="rg-team"><span>Mon compagnon, mon équipe</span><button type="button" class="icon-btn team-btn" data-team-slot></button></div>
    </section>
    <section class="rg-card" aria-labelledby="rg-sound-title">
      <h3 id="rg-sound-title">🔊 Son</h3>
      ${rgSwitch('sound', 'Bruitages', !!state.sound)}
      ${rgSwitch('voice', 'Voix', !!(state.sound && state.voice), !state.sound)}
      ${rgSwitch('music', 'Musique', !!(state.sound && state.music), !state.sound)}
      <div class="ps-volume">
        <label for="rg-volume">Volume</label>
        <input type="range" id="rg-volume" min="0" max="100" step="5" value="${vol}">
        <output id="rg-volume-v" for="rg-volume">${vol} %</output>
      </div>
    </section>
    <section class="rg-card" aria-labelledby="rg-players-title">
      <h3 id="rg-players-title">👥 Joueurs</h3>
      <button type="button" class="btn-small ghost" id="rg-switch">🔁 Changer de joueur</button>
      <div class="rg-players" id="rg-players">
        ${profiles.list.map(x=> `<button type="button" class="rg-player ${x.id === profiles.current ? 'on' : ''}" data-player="${x.id}" aria-pressed="${x.id === profiles.current}">
          ${avatarHTML(x.avatar, x.look)}<span>${x.name || 'Sans nom'}</span></button>`).join('')}
      </div>
      <div class="rg-actions">
        <button type="button" class="btn-small" id="rg-add">➕ Ajouter un joueur</button>
        <button type="button" class="btn-small ghost" id="rg-modes">🎲 Jouer à plusieurs</button>
      </div>
    </section>
    <section class="rg-card rg-parents" aria-labelledby="rg-parents-title">
      <h3 id="rg-parents-title">🔒 Parents</h3>
      <p class="bk-help">Réservé aux adultes : une petite multiplication à résoudre.</p>
      <div class="rg-actions">
        <button type="button" class="btn-small" id="rg-parents">👪 Espace parents</button>
        <button type="button" class="btn-small ghost" id="rg-backup">💾 Sauvegarde et installation</button>
      </div>
    </section>`;
  renderTeamHeads();
  bindSettings(el);
}

function setSound(key){
  if(key === 'sound'){
    state.sound = !state.sound;
    // couper les bruitages coupe tout ; les rallumer rend la voix
    if(!state.sound){ state.voice = false; state.music = false; }
    else state.voice = true;
  } else {
    if(!state.sound) return;
    state[key] = !state[key];
  }
  save(); renderSoundBtn();
  if(!state.voice && window.speechSynthesis) speechSynthesis.cancel();
  if(state.sound) playSound('tap');
  showToast(soundModeLabel());
}

function bindSettings(el){
  el.querySelectorAll('[data-sound]').forEach(b=> b.onclick = ()=>{
    if(b.getAttribute('aria-disabled') === 'true'){ speak('Allume d\'abord les bruitages.'); return; }
    setSound(b.dataset.sound);
    renderSettings();
  });
  const vol = el.querySelector('#rg-volume');
  vol.oninput = ()=>{
    state.soundVolume = Number(vol.value); save();
    el.querySelector('#rg-volume-v').textContent = vol.value + ' %';
    playSound('pop');   // une note pour entendre le nouveau volume
  };
  el.querySelector('#rg-edit').onclick = ()=>{ playSound('tap'); openPlayerSettings(profiles.current); };
  el.querySelector('#rg-switch').onclick = ()=>{
    playSound('tap');
    const list = el.querySelector('#rg-players');
    try{ list.scrollIntoView({ block:'center', behavior:'smooth' }); }catch(e){}
    speak('Touche le joueur qui va jouer.');
  };
  el.querySelectorAll('[data-player]').forEach(b=> b.onclick = ()=>{
    if(b.dataset.player === profiles.current) return;
    switchProfile(b.dataset.player);
    renderProfile();
    renderSettings();
  });
  el.querySelector('#rg-add').onclick = ()=>{ playSound('tap'); openNewPlayer(); };
  el.querySelector('#rg-modes').onclick = ()=>{ playSound('tap'); openPlayers(); };
  el.querySelector('#rg-parents').onclick = ()=>{ playSound('tap'); openParents(); };
  el.querySelector('#rg-backup').onclick = ()=>{ playSound('tap'); openParentGate(()=> openBackup()); };
}

registerView('reglages', ()=> renderSettings());
// changement de joueur pendant qu'on est sur les Réglages : on les redessine
onProfileRefresh(()=>{ const v = document.getElementById('view-reglages'); if(v && v.classList.contains('active')) renderSettings(); });

export { renderSettings };
