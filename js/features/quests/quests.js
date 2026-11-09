/* ---------- Missions du jour et coffre ---------- */
const QUEST_TEMPLATES = [
  ()=>{ const k = pickRandom(availableItems()); const goal = 2 + Math.floor(Math.random()*2);
        return {type:'collect', target:k, goal, n:0, label:`Gagne ${goal} ${ITEMS[k].name.toLowerCase()}${goal>1?'s':''} ${ITEMS[k].emoji}`}; },
  ()=>{ const c = pickRandom(availableChars()); const goal = 2;
        return {type:'char', target:c, goal, n:0, label:`Joue ${goal} fois avec ${CHARACTERS[c].name} ${CHARACTERS[c].emoji}`}; },
  ()=>{ const goal = 3; return {type:'win', target:null, goal, n:0, label:`Réussis ${goal} missions 🎮`}; },
  ()=>{ const k = pickRandom(availableCrafted().filter(k=>CRAFTED[k].tier!==2));
        return {type:'craft', target:k, goal:1, n:0, label:`Fabrique un ${CRAFTED[k].name.toLowerCase()} ${CRAFTED[k].emoji}`}; },
  ()=>{ const goal = 2; return {type:'sell', target:null, goal, n:0, label:`Vends ${goal} objets au marché 🏪`}; },
  ()=>{ const goal = 2; return {type:'gift', target:null, goal, n:0, label:`Offre ${goal} objets à tes amis 🎁`}; },
];

function today(){ const d = new Date(); return d.toISOString().slice(0,10); }

function ensureQuests(){
  if(!state.quests || state.quests.date !== today()){
    const picks = shuffle(QUEST_TEMPLATES).slice(0,3).map(f=>f());
    state.quests = { date: today(), list: picks, claimed:false };
    save();
  }
  return state.quests;
}

function questProgress(type, target, n=1){
  const q = ensureQuests();
  let changed = false;
  q.list.forEach(item=>{
    if(item.n >= item.goal) return;
    if(item.type !== type) return;
    if(item.target && item.target !== target) return;
    item.n = Math.min(item.goal, item.n + n);
    changed = true;
    if(item.n >= item.goal){
      playSound('good');
      showToast(`✅ ${item.label}`);
    }
  });
  if(changed){ save(); renderQuests(); }
}

function questsDone(){ const q = ensureQuests(); return q.list.every(i=>i.n>=i.goal); }

// pastille du haut : nombre de missions restantes
function renderQuestBadge(){
  const q = ensureQuests();
  const el = document.getElementById('quest-badge');
  if(!el) return;
  const left = q.list.filter(i=>i.n<i.goal).length;
  const ready = questsDone() && !q.claimed;
  el.hidden = false;
  el.textContent = ready ? '🎁' : (left || '✓');
  el.classList.toggle('ready', ready);
}

function openQuestsModal(){
  const q = ensureQuests();
  openModal(`
    ${gameHeader('📜 Mes missions du jour', questsDone() ? 'Tout est fait, ouvre le coffre !' : 'Termine-les pour ouvrir le coffre')}
    <div class="quests in-modal" id="quests-modal"></div>
  `);
  bindQuit();
  renderQuests(document.getElementById('quests-modal'));
}

function renderQuests(target){
  const q = ensureQuests();
  const el = target || document.getElementById('quests');
  renderQuestBadge();
  if(!el) return;
  const done = q.list.filter(i=>i.n>=i.goal).length;
  el.innerHTML = `
    <h3>📜 Mes missions du jour <span class="chest">${questsDone() && !q.claimed ? '🎁' : (q.claimed?'✅':'📦')}</span></h3>
    ${q.list.map(i=>`
      <div class="quest ${i.n>=i.goal?'done':''}">
        <span class="tick">${i.n>=i.goal?'✅':'⭕'}</span>
        <span class="txt">${i.label}</span>
        <span class="cnt">${i.n}/${i.goal}</span>
      </div>`).join('')}
    <div class="quest-bar"><i style="width:${(done/q.list.length)*100}%"></i></div>
    ${questsDone() && !q.claimed ? `<button class="btn-chest" id="btn-chest">🎁 Ouvrir le coffre !</button>` : ''}
  `;
  const b = el.querySelector('#btn-chest');
  if(b) b.onclick = openChest;
}

function openChest(){
  const q = ensureQuests();
  if(q.claimed || !questsDone()) return;
  q.claimed = true;
  const bonusCoins = 15;
  const gift = pickRandom(availableItems());
  addCoins(bonusCoins);
  addItem(gift,1); markSeen(gift);
  state.newItems += 1; save(); renderBadge();
  // v53 : toujours une boîte surprise de squishies en plus (à ouvrir dans la chambre 🧸)
  addSquishyBox(null);
  playSound('win'); confetti(); vibrate([60,40,120,40,160]);
  const who = hello();
  speak(`${who ? who+', b' : 'B'}ravo ! Tu as fini toutes tes missions du jour. Tu gagnes ${bonusCoins} pièces, ${ITEMS[gift].name}, et une boîte surprise de squishies !`);
  openModal(`
    <div class="reward-box">
      <span class="big-emoji">🎁</span>
      <h2>Coffre du jour ouvert !</h2>
      <div class="speech" style="display:flex; align-items:center; justify-content:center; gap:10px;">
        <span data-gain-coins style="font-size:2rem;">🪙</span><span><strong>+${bonusCoins} pièces</strong></span>
      </div>
      <div class="speech" style="display:flex; align-items:center; justify-content:center; gap:10px; background:#FFF9E8;">
        <span data-gain-item style="font-size:2rem;">${ITEMS[gift].emoji}</span><span><strong>${ITEMS[gift].name}</strong></span>
      </div>
      ${squishyBoxRewardHTML()}
    </div>
    <button class="btn-primary" id="btn-yay">Merci ! 🎉</button>
  `);
  queueGain({ items:[ITEMS[gift].emoji], coins:bonusCoins });
  document.getElementById('btn-yay').onclick = ()=>{ playSound('tap'); closeModal(); renderLagon(); };
  renderQuests();
}

// changement de joueur : ses missions du jour
onProfileRefresh(ensureQuests);
