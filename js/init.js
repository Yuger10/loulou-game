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
renderRaceTrack();
renderLagon();
renderMap();
renderIslandCard();
renderLevelPill();
switchView('carte');

/* Écran titre : sert aussi à débloquer le son et la voix (geste utilisateur requis sur iOS) */
function showSplash(){
  const sp = document.getElementById('splash');
  document.getElementById('splash-hello').textContent =
    state.name ? `Coucou ${state.name} ${avatarText(state.avatar)} !` : "En route pour l'aventure ?";
  // joueur connu : son compagnon l'accueille ; sinon la troupe des personnages
  const bud = document.getElementById('splash-buddy');
  const cast = sp.querySelector('.cast');
  if(bud && state.name && typeof companionSVG==='function'){
    bud.innerHTML = companionSVG(currentCompanion(), 'cheer');
    bud.hidden = false; if(cast) cast.hidden = true;
  } else if(bud){ bud.hidden = true; if(cast) cast.hidden = false; }
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
    speak(`Coucou ${state.name} ! L'aventure t'attend.`);
    switchView('carte');
  }
}
// navigation secondaire
document.getElementById('btn-back-map').addEventListener('click', ()=>{ playSound('tap'); switchView('carte'); });
document.querySelectorAll('[data-sactab]').forEach(b=>{
  b.addEventListener('click', ()=>{ playSound('tap'); setSacTab(b.dataset.sactab); });
});
document.getElementById('quests-btn').addEventListener('click', ()=>{ playSound('tap'); openQuestsModal(); });

// fermeture facile des fenêtres : croix, poignée, clic à côté, touche Échap
document.getElementById('modal-close').addEventListener('click', ()=>{ playSound('tap'); closeModal(); });
document.getElementById('modal-handle').addEventListener('click', ()=>{ playSound('tap'); closeModal(); });
document.getElementById('overlay').addEventListener('click', (e)=>{
  if(e.target.id==='overlay') closeModal();
});
document.addEventListener('keydown', (e)=>{
  if(e.key==='Escape') closeModal();
});

document.getElementById('btn-splash-play').addEventListener('click', hideSplash);
showSplash();
// la pastille en haut ouvre le panneau des joueurs (profils, solo / chacun son tour)
document.getElementById('avatar-pill').addEventListener('click', ()=>{ playSound('tap'); openPlayers(); });
document.getElementById('btn-start').addEventListener('click', closeWelcome);
document.getElementById('name-input').addEventListener('keydown', e=>{ if(e.key==='Enter') closeWelcome(); });
// Installe le service worker ET recharge automatiquement dès qu'une
// nouvelle version est prête, pour que les nouveautés (nouveaux jeux,
// nouvelle île…) soient toujours visibles sans manipulation.
if('serviceWorker' in navigator && location.protocol!=='file:'){
  navigator.serviceWorker.register('sw.js').then(reg=>{
    // vérifie s'il y a une mise à jour à chaque lancement
    reg.update().catch(()=>{});
    reg.addEventListener('updatefound', ()=>{
      const sw = reg.installing;
      if(!sw) return;
      sw.addEventListener('statechange', ()=>{
        if(sw.state==='installed' && navigator.serviceWorker.controller){
          // une nouvelle version vient de s'installer : on l'active tout de suite
          sw.postMessage('skipWaiting');
        }
      });
    });
  }).catch(()=>{});
  let refreshed = false;
  navigator.serviceWorker.addEventListener('controllerchange', ()=>{
    if(refreshed) return;
    refreshed = true;
    location.reload();
  });
}
