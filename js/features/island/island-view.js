/* ---------- Vue Île : changer d'île, nouvelle île, personnages, dialogues, boutique de décorations ---------- */
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
  setCurrentWorld(id);
  document.body.dataset.world = id;
  renderLagon();
  if(changed && !silent){
    playSound('good');
    speak(`${w.name} ! ${w.subtitle}.`);
    teamOnTravel(id);   // un compagnon à rencontrer sur cette île ? (js/features/companion-team)
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
  // le fil de l'histoire (js/features/story/story.js) précède l'écran habituel : une
  // nouvelle île est d'abord racontée, avec son énigme à résoudre.
  if(STORY[id] && !storySolved(id)){
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
    <div class="ic-chars">${charsOfForPlayer(currentWorld, playerGender()).map(([cid])=>charFace(cid)).join('')}</div>
    <button class="btn-primary" id="ic-go">🏝️ Débarquer sur l'île</button>`;
  const b = document.getElementById('ic-go');
  if(b) b.onclick = ()=>{ playSound('tap'); switchView('ile'); };
}

function renderLagon(){
  // si le monde courant n'est plus accessible, on revient au lagon
  if(!worldUnlocked(currentWorld)) setCurrentWorld('lagon');
  document.body.dataset.world = currentWorld;
  const w = WORLDS[currentWorld];
  const intro = document.getElementById('lagon-intro-text');
  if(intro) intro.textContent = w.intro;
  const ttl = document.getElementById('world-title');
  if(ttl) ttl.innerHTML = `${w.emoji} ${w.name}`;
  renderLevelPill();
  // les personnages vivent maintenant dans le paysage de l'île (js/features/island/island.js)
  document.getElementById('islands').innerHTML = '';
  renderQuests();
  renderScene();
  renderRaceTrack();
  renderTeamHeads();
  renderTeamHelpers();   // Sam le guide et le défi de Zap
}

/* ---------- Décorations ---------- */
// l'île vivante : paysage, personnages et décorations (js/features/island/island.js)
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
      const fromPt = gainCenter(rowEmoji);
      addCoins(-d.price);
      {
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
function setCurrentChar(id){ currentChar = id; }

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
  if(!Object.values(state.look||{}).some(Boolean) && state.coins >= 8) lines.push(`Avec tes pièces, tu peux habiller ton avatar : regarde dans ton sac, « Mon look » 🎩 !`);
  { const fv = favoritesOf(charId).map(k=>ITEMS[k]); if(fv.length) lines.push(`Mes cadeaux préférés ? ${fv.map(i=>i.name + ' ' + i.emoji).join(' et ')} ! 💖`); }
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
      <h2>${c.name} ${c.title}${friendPoints(charId) ? friendHearts(charId) : ''}</h2>
    </div>
    ${speechBubble(text)}
    <button class="btn-primary" id="btn-play">Choisir un jeu 🎮</button>
    ${'<button class="btn-craft gift-open" id="btn-gift">🎁 Offrir un objet</button>'}
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

// changement de joueur : son île (en dernier : elle s'appuie sur le reste)
onProfileRefresh(()=> renderLagon());
