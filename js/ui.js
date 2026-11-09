/* ---------- Utilitaires ---------- */

function addCoins(n){
  state.coins += n; save(); renderCoins();
  const pill = document.getElementById('coin-pill');
  pill.classList.remove('bump'); void pill.offsetWidth; pill.classList.add('bump');
}
// pièces comptées mais encore en vol (voir gains.js) : l'affichage les attend
var coinsInFlight = 0;
function renderCoins(){ document.getElementById('coin-count').textContent = state.coins - (coinsInFlight || 0); }

document.getElementById('sound-btn').addEventListener('click', ()=>{
  // cycle : musique (+ sons + voix) → sons + voix → sons seuls → silence → musique…
  if(state.sound && state.voice && state.music){ state.music=false; }
  else if(state.sound && state.voice){ state.voice=false; }
  else if(state.sound){ state.sound=false; }
  else { state.sound=true; state.voice=true; state.music=true; }
  save(); renderSoundBtn();
  if(!state.voice && window.speechSynthesis) speechSynthesis.cancel();
  if(state.sound) playSound('tap');
  showToast(soundModeLabel());
});
function renderSoundBtn(){
  const k = state.sound ? (state.music && state.voice ? 'musique' : state.voice ? 'voix' : 'son') : 'muet';
  const b = document.getElementById('sound-btn');
  if(typeof uiIcon==='function') b.innerHTML = uiIcon(k);
  else b.textContent = state.sound ? (state.voice ? '🗣️' : '🔊') : '🔇';
  b.setAttribute('aria-label', soundModeLabel().replace(/^\S+\s/, ''));
  if(typeof updateMusic==='function') updateMusic();
}

if('speechSynthesis' in window){
  pickVoice();
  window.speechSynthesis.onvoiceschanged = pickVoice;
}

/* ---------- Navigation ---------- */
document.querySelectorAll('.navbtn').forEach(btn=>{
  btn.addEventListener('click', ()=> { playSound('tap'); switchView(btn.dataset.view); });
});

// onglets du sac : objets / album
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
  else if(typeof renderLook==='function'){ lookTry = null; renderLook(); }
}
function renderBadge(){
  const b = document.getElementById('sac-badge');
  b.hidden = state.newItems===0;
  b.textContent = state.newItems;
}

function gameDiffIsland(){ return WORLDS[currentWorld] ? WORLDS[currentWorld].diff : 1; }
// La difficulté suit l'île… mais jamais au-delà de ce que l'âge du
// joueur permet, y compris en solo. Avant ce correctif, un enfant de
// 3-4 ans qui avait progressé jusqu'à l'île 2-3 (ce qui arrive vite,
// seulement 10-25 missions) recevait quand même la difficulté complète
// de cette île : seul le TYPE de jeu était filtré par âge
// (`gameTypesForAge`), jamais ses PARAMÈTRES numériques. Résultat : des
// exercices trop abstraits pour son âge (ex. la variante miroir de
// « Trouve l'intrus »), que l'enfant ne peut résoudre qu'au hasard.
function gameDiff(){
  const island = gameDiffIsland();
  // multijoueur (chacun son tour / course) : l'âge prime totalement,
  // sans plafond lié à l'île — c'est le mécanisme d'équité déjà en
  // place (chacun joue à son niveau, peu importe où se déroule la partie).
  if(typeof party!=='undefined' && party.active && typeof ageToDiff==='function'){
    const p = (typeof partyCurrent==='function' && partyCurrent()) || (typeof currentProfile==='function' && currentProfile());
    const d = p && ageToDiff(p.age);
    if(d) return d;
  }
  // solo : l'âge, s'il est renseigné, plafonne la difficulté de l'île —
  // jamais l'inverse (un enfant plus âgé qu'une île facile n'est pas
  // artificiellement ralenti, seul le cas « trop dur pour son âge »
  // est corrigé).
  if(typeof currentProfile==='function' && typeof ageToDiff==='function'){
    const p = currentProfile();
    const d = p && ageToDiff(p.age);
    if(d) return adaptedDiff(Math.min(d, island));
  }
  return adaptedDiff(island);
}
// Phase 3 : chaque mini-jeu a son propre niveau par enfant (js/adaptive.js) ;
// on ne joue jamais au-dessus de ce qui est acquis dans CE jeu.
function adaptedDiff(base){ return typeof adaptTier==='function' ? adaptTier(base) : base; }
function setWorld(id, silent){
  const w = WORLDS[id];
  if(!worldUnlocked(id)){
    playSound('wrong');
    const miss = (w.level - level()) * MISSIONS_PER_LEVEL - (state.missions % MISSIONS_PER_LEVEL);
    speak(`${w.name} s'ouvrira au niveau ${w.level}. Encore ${miss} missions !`);
    showToast(`🔒 ${w.name} : niveau ${w.level}`);
    return false;
  }
  const changed = currentWorld !== id;
  currentWorld = id;
  document.body.dataset.world = id;
  renderLagon();
  if(changed && !silent){
    playSound('good');
    speak(`${w.name} ! ${w.subtitle}.`);
  }
  return true;
}
// signale et ouvre une île fraîchement débloquée
function checkNewIsland(){
  const newly = WORLD_ORDER.filter(id=>worldUnlocked(id) && !(state.visited||[]).includes(id));
  if(!newly.length) return false;
  const id = newly[newly.length-1];
  state.visited = (state.visited||[]).concat(newly);
  save();
  if(id==='lagon') return false;
  const w = WORLDS[id];
  playSound('win'); confetti(); vibrate([70,50,70,50,180]);
  const who = hello();
  const showUnlockModal = ()=>{
    speak(`Nouvelle île débloquée${who?', '+who:''} ! ${w.name} : ${w.subtitle}. Attention, les défis y sont plus difficiles !`);
    openModal(`
      <div class="reward-box">
        <span class="big-emoji">${w.emoji}</span>
        <h2>Nouvelle île !</h2>
        <div class="speech"><strong>${w.name}</strong> — ${w.subtitle}<br>
          Tu peux y aller depuis la carte 🗺️</div>
        <div class="speech" style="background:#FFF9E8;">
          ⚔️ Les défis sont plus difficiles ici : ${'⭐'.repeat(w.diff)}<br>
          🎁 ${charsOf(id).length} nouveaux amis et de nouveaux objets à découvrir
        </div>
      </div>
      <button class="btn-primary" id="btn-go">Y aller ! ${w.emoji}</button>
      <button class="btn-ghost" id="btn-stay">Plus tard</button>
    `);
    document.getElementById('btn-go').onclick = ()=>{ playSound('tap'); closeModal(); setWorld(id); };
    document.getElementById('btn-stay').onclick = ()=>{ playSound('tap'); closeModal(); renderLagon(); };
  };
  // le fil de l'histoire (js/story.js) précède l'écran habituel : une
  // nouvelle île est d'abord racontée, avec son énigme à résoudre.
  if(typeof openStoryChapter==='function' && typeof STORY!=='undefined' && STORY[id] && typeof storySolved==='function' && !storySolved(id)){
    openStoryChapter(id, showUnlockModal);
  } else {
    showUnlockModal();
  }
  return true;
}
function renderLevelPill(){
  const lp = document.getElementById('level-pill');
  if(lp) lp.innerHTML = `⭐ Niv. ${level()} <span class="level-bar"><i style="width:${levelProgress()*100}%"></i></span>`;
}

// carte : fiche de l'île courante avec le bouton pour y aller
function renderIslandCard(){
  const el = document.getElementById('island-card');
  if(!el) return;
  const w = WORLDS[currentWorld];
  el.innerHTML = `
    <div class="ic-head"><span class="ic-emoji">${w.emoji}</span>
      <div><div class="ic-name">${w.name}</div><div class="ic-sub">${w.subtitle} · ${'⭐'.repeat(w.diff)}</div></div>
    </div>
    <div class="ic-chars">${charsOfForPlayer(currentWorld, typeof playerGender==='function' ? playerGender() : '').map(([cid])=>charFace(cid)).join('')}</div>
    <button class="btn-primary" id="ic-go">🏝️ Débarquer sur l'île</button>`;
  const b = document.getElementById('ic-go');
  if(b) b.onclick = ()=>{ playSound('tap'); switchView('ile'); };
}

function renderLagon(){
  // si le monde courant n'est plus accessible, on revient au lagon
  if(!worldUnlocked(currentWorld)) currentWorld = 'lagon';
  document.body.dataset.world = currentWorld;
  const w = WORLDS[currentWorld];
  const intro = document.getElementById('lagon-intro-text');
  if(intro) intro.textContent = w.intro;
  const ttl = document.getElementById('world-title');
  if(ttl) ttl.innerHTML = `${w.emoji} ${w.name}`;
  renderLevelPill();
  // les personnages vivent maintenant dans le paysage de l'île (js/island.js)
  document.getElementById('islands').innerHTML = '';
  renderQuests();
  renderScene();
  if(typeof renderRaceTrack==='function') renderRaceTrack();
}

/* ---------- Décorations ---------- */
// l'île vivante : paysage, personnages et décorations (js/island.js)
function renderScene(){
  renderLiveIsland(document.getElementById('scene'));
}

function openDecoShop(){
  const w = WORLDS[currentWorld];
  openModal(`
    ${gameHeader(`🎨 Décorer ${w.name}`, `Tu as 🪙 ${state.coins} pièces`)}
    <div id="deco-list">
      ${decosOf(currentWorld).map(([k,d])=>{
        const owned = state.decos.includes(k);
        const can = state.coins >= d.price;
        return `<div class="market-row deco-row ${owned?'owned':''}">
          <span class="emoji">${d.emoji}</span>
          <div class="info"><div class="name">${d.name}</div><div class="sub">${owned?'Déjà dans ton lagon ✅':`🪙 ${d.price} pièces`}</div></div>
          ${owned?'':`<button class="btn-small" data-deco="${k}" ${can?'':'disabled'}>Acheter</button>`}
        </div>`;
      }).join('')}
    </div>
  `);
  bindQuit();
  document.querySelectorAll('[data-deco]').forEach(btn=>{
    btn.onclick = ()=>{
      const k = btn.dataset.deco;
      const d = DECOS[k];
      if(state.coins < d.price || state.decos.includes(k)) return;
      const rowEmoji = btn.closest('.market-row').querySelector('.emoji');
      const fromPt = typeof gainCenter==='function' ? gainCenter(rowEmoji) : null;
      addCoins(-d.price);
      if(typeof spendCoins==='function'){
        spendCoins(d.price, rowEmoji);
        const scene = document.getElementById('scene');
        flyEmoji(d.emoji, fromPt, gainCenter(scene), { delay:480, size:'2.6rem', endScale:.9, onLand:()=>{ playSound('pop'); gainLand(scene, true); } });
      }
      state.decos.push(k); save();
      setTimeout(checkAlbumComplete, 900);
      playSound('win'); confetti();
      speak(`Super ! ${d.name} est dans ${WORLDS[currentWorld].name} !`);
      showToast(`${d.emoji} ${d.name} ajouté !`);
      renderScene();
      openDecoShop();
    };
  });
}

/* ---------- Personnages / dialogue ---------- */
let currentChar = null;

/* Phrases qui dépendent de la partie en cours */
function contextualLine(charId){
  const c = CHARACTERS[charId];
  const who = hello();
  const lines = [];
  const q = ensureQuests();
  const quest = q.list.find(i=>i.n<i.goal && i.type==='char' && i.target===charId);
  if(quest) lines.push(`Ta mission du jour, c'est de jouer avec moi ! Encore ${quest.goal-quest.n} fois.`);
  // un objet dont elle a beaucoup
  const rich = Object.keys(ITEMS).filter(k=>countItem(k)>=3);
  if(rich.length) { const k = pickRandom(rich); lines.push(`Oh, tu as déjà ${countItem(k)} ${ITEMS[k].name.toLowerCase()}s ${ITEMS[k].emoji} ! Tu pourrais en vendre au marché.`); }
  // recette presque complète
  for(const [key,cr] of Object.entries(CRAFTED)){
    if(countItem(key)>0) continue;
    const need = Object.entries(cr.recipe);
    const missing = need.filter(([ik,qty])=>countItem(ik)<qty);
    if(missing.length===1 && countItem(missing[0][0])===missing[0][1]-1){
      lines.push(`Il ne te manque qu'un ${ALL_ITEMS[missing[0][0]].name.toLowerCase()} ${ALL_ITEMS[missing[0][0]].emoji} pour fabriquer ${cr.name} ${cr.emoji} !`);
      break;
    }
  }
  if(state.decos.length===0 && state.coins>=8) lines.push(`Avec tes ${state.coins} pièces, tu pourrais décorer ${WORLDS[currentWorld].name} 🌴 !`);
  if(typeof WARDROBE!=='undefined' && !Object.values(state.look||{}).some(Boolean) && state.coins >= 8) lines.push(`Avec tes pièces, tu peux habiller ton avatar : regarde dans ton sac, « Mon look » 🎩 !`);
  if(typeof favoritesOf==='function'){ const fv = favoritesOf(charId).map(k=>ITEMS[k]); if(fv.length) lines.push(`Mes cadeaux préférés ? ${fv.map(i=>i.name + ' ' + i.emoji).join(' et ')} ! 💖`); }
  if(state.decos.length>=3) lines.push(`C'est magnifique ici${who?', '+who:''} ! ${state.decos.length} décorations déjà ✨`);
  if(level()>=3) lines.push(`Niveau ${level()} déjà ! Tu es un${ac('','e')} vrai${ac('','e')} ${ac('explorateur','exploratrice')}.`);
  if(level()===2 && levelProgress()>=0.6) lines.push(`Encore quelques missions et la forêt enchantée s'ouvrira 🌲 !`);
  if(countItem(c.loot[0])===0 && countItem(c.loot[1])===0) lines.push(`Je peux t'offrir ${ITEMS[c.loot[0]].emoji} ou ${ITEMS[c.loot[1]].emoji}, tu n'en as pas encore !`);
  // 60 % de chance d'utiliser une phrase contextuelle si dispo
  return (lines.length && Math.random()<0.6) ? pickRandom(lines) : null;
}

function openDialogue(charId){
  const c = CHARACTERS[charId];
  currentChar = charId;
  const who = hello();
  const greet = who && Math.random()<0.5 ? `Coucou ${who} ! ` : '';
  const text = greet + (contextualLine(charId) || pickRandom(c.texts));
  openModal(`
    <div class="char-header">
      <span class="emoji">${charFace(charId)}</span>
      <h2>${c.name} ${c.title}${typeof friendHearts==='function' && friendPoints(charId) ? friendHearts(charId) : ''}</h2>
    </div>
    ${speechBubble(text)}
    <button class="btn-primary" id="btn-play">Choisir un jeu 🎮</button>
    ${typeof openGiftPicker==='function' ? '<button class="btn-craft gift-open" id="btn-gift">🎁 Offrir un objet</button>' : ''}
    <button class="btn-ghost" id="btn-random">🎲 Surprise</button>
    <button class="btn-ghost" id="btn-close">Pas maintenant</button>
  `);
  bindSpeakButtons();
  speak(`${c.name} ${c.title} : ${text}`);
  document.getElementById('btn-play').onclick = ()=> { playSound('tap'); openGamePicker(charId); };
  const pickBtn = document.getElementById('btn-random');
  if(pickBtn) pickBtn.onclick = ()=> { playSound('tap'); startMinigame(); };
  const giftBtn = document.getElementById('btn-gift');
  if(giftBtn) giftBtn.onclick = ()=> { playSound('tap'); openGiftPicker(charId); };
  document.getElementById('btn-close').onclick = ()=>{ window.speechSynthesis && speechSynthesis.cancel(); closeModal(); };
}

registerView('ile', ()=> renderLagon());
registerView('sac', ({ sacTab })=>{
  state.newItems = 0; save(); renderBadge();
  setSacTab(sacTab || currentSacTab);
});
