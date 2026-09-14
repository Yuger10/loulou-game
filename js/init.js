/* ---------- Init ---------- */
loadProfiles();
load();
// marque comme déjà vus les objets déjà possédés (anciennes sauvegardes)
Object.keys(state.inventory||{}).forEach(k=>{ if(state.inventory[k]>0) markSeen(k); });
renderCoins();
renderSoundBtn();
renderBadge();
renderProfile();
ensureQuests();
// à la première ouverture, les îles déjà accessibles sont considérées comme connues
if(!state.visited || !state.visited.length){
  state.visited = WORLD_ORDER.filter(worldUnlocked);
  save();
}
renderTurnBar();
renderLagon();

/* Écran titre : sert aussi à débloquer le son et la voix (geste utilisateur requis sur iOS) */
function showSplash(){
  const sp = document.getElementById('splash');
  document.getElementById('splash-hello').textContent =
    state.name ? `Coucou ${state.name} ${state.avatar} !` : "Prête pour l'aventure ?";
  sp.classList.remove('hiding');
  sp.classList.add('show');
}
function hideSplash(){
  const sp = document.getElementById('splash');
  playSound('win');
  sp.classList.add('hiding');
  setTimeout(()=>{ sp.classList.remove('show','hiding'); }, 450);
  if(!state.name) openWelcome();
  else {
    speak(`Coucou ${state.name} ! Le lagon t'attend.`);
    renderLagon();
  }
}
document.getElementById('btn-splash-play').addEventListener('click', hideSplash);
showSplash();
// la pastille en haut ouvre le panneau des joueurs (profils, solo / chacun son tour)
document.getElementById('avatar-pill').addEventListener('click', ()=>{ playSound('tap'); openPlayers(); });
document.getElementById('btn-start').addEventListener('click', closeWelcome);
document.getElementById('name-input').addEventListener('keydown', e=>{ if(e.key==='Enter') closeWelcome(); });
if('serviceWorker' in navigator && location.protocol!=='file:'){
  navigator.serviceWorker.register('sw.js').catch(()=>{});
}
