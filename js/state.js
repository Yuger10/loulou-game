/* ---------- État ---------- */
const SAVE_VERSION = 2;
const DEFAULT_STATE = {
  v: SAVE_VERSION,
  coins: 5,
  inventory: {},
  missions: 0,
  sound: true,
  voice: true,
  newItems: 0,
  decos: [],
  name: '',
  avatar: '👧',
  seen: {},
  quests: null,
  albumReward: false,
  visited: [],
  gameCounts: {},     // nombre de fois jouées, par type de mini-jeu (pour forcer la variété)
};
// copie profonde : sinon inventory/seen/decos seraient partagés avec DEFAULT_STATE
function freshState(extra){
  return Object.assign(JSON.parse(JSON.stringify(DEFAULT_STATE)), extra||{});
}
let state = {
  v: SAVE_VERSION,
  coins: 5,
  inventory: {},
  missions: 0,
  sound: true,
  voice: true,
  newItems: 0,
  decos: [],
  name: '',
  avatar: '👧',
  seen: {},           // objets déjà découverts (album)
  quests: null,       // quêtes du jour { date, list:[{type,target,goal,done,n}], claimed }
  albumReward: false, // récompense d'album complet déjà donnée
  visited: [],        // îles déjà découvertes (pour annoncer les nouvelles)
  gameCounts: {},     // nombre de fois jouées, par type de mini-jeu
};

function save(){
  try{
    localStorage.setItem(typeof currentSaveKey==='function' ? currentSaveKey() : SAVE_KEY, JSON.stringify(state));
    if(typeof syncProfileFromState==='function') syncProfileFromState();
  }catch(e){}
}
// Migre une sauvegarde d'une ancienne version vers la structure courante
function migrate(saved){
  const v = saved.v || 0;
  if(v < 1){
    // v0 (jeu v1→v3) : ni profil, ni album, ni quêtes
    saved.name = saved.name || '';
    saved.avatar = saved.avatar || '👧';
    saved.seen = saved.seen || {};
    saved.quests = saved.quests || null;
    saved.albumReward = saved.albumReward || false;
    saved.visited = saved.visited || [];
    saved.decos = saved.decos || [];
  }
  if(v < 2){
    saved.gameCounts = saved.gameCounts || {};
  }
  saved.v = SAVE_VERSION;
  return saved;
}
function load(){
  try{
    const key = typeof currentSaveKey==='function' ? currentSaveKey() : SAVE_KEY;
    const raw = localStorage.getItem(key);
    if(!raw){ state = freshState(); return; }
    const saved = migrate(JSON.parse(raw));
    // ne garde que les clés connues : une sauvegarde ancienne ou corrompue ne casse pas le jeu
    const clean = {};
    Object.keys(DEFAULT_STATE).forEach(k=>{
      clean[k] = (saved[k] !== undefined && saved[k] !== null) || k==='quests' ? saved[k] : DEFAULT_STATE[k];
    });
    state = freshState(clean);
    save();
  }catch(e){
    console.warn('Sauvegarde illisible, on repart à zéro', e);
  }
}
function resetState(){
  state = freshState({
    sound: state.sound, voice: state.voice,
    name: state.name, avatar: state.avatar,
  });
  save();
}

/* ---------- Profil (prénom + avatar) ---------- */
function hello(){ return state.name ? state.name : ''; }
function renderProfile(){
  document.querySelector('#avatar-pill .av').innerHTML = avatarHTML(state.avatar);
  if(typeof renderBackupReminder==='function') renderBackupReminder();
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
  const p0 = typeof currentProfile==='function' && currentProfile();
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
  const p1 = typeof currentProfile==='function' && currentProfile();
  if(p1){
    p1.gender = pendingGender;
    p1.companion = pendingCompanion || defaultCompanionFor(pendingGender);
    if(typeof saveProfiles==='function') saveProfiles();
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
  renderLagon();
}

/* ---------- Quêtes du jour ---------- */
// objets et personnages accessibles selon les mondes débloqués
function availableItems(){
  return Object.keys(ITEMS).filter(k=>{
    const w = ITEMS[k].world || 'lagon';
    return level() >= WORLDS[w].level;
  });
}
function availableChars(){
  return Object.keys(CHARACTERS).filter(k=>{
    const w = CHARACTERS[k].world || 'lagon';
    return level() >= WORLDS[w].level;
  });
}
function availableCrafted(){
  return Object.keys(CRAFTED).filter(k=>{
    const w = CRAFTED[k].world || 'lagon';
    return level() >= WORLDS[w].level;
  });
}

const QUEST_TEMPLATES = [
  ()=>{ const k = pickRandom(availableItems()); const goal = 2 + Math.floor(Math.random()*2);
        return {type:'collect', target:k, goal, n:0, label:`Gagne ${goal} ${ITEMS[k].name.toLowerCase()}${goal>1?'s':''} ${ITEMS[k].emoji}`}; },
  ()=>{ const c = pickRandom(availableChars()); const goal = 2;
        return {type:'char', target:c, goal, n:0, label:`Joue ${goal} fois avec ${CHARACTERS[c].name} ${CHARACTERS[c].emoji}`}; },
  ()=>{ const goal = 3; return {type:'win', target:null, goal, n:0, label:`Réussis ${goal} missions 🎮`}; },
  ()=>{ const k = pickRandom(availableCrafted().filter(k=>CRAFTED[k].tier!==2));
        return {type:'craft', target:k, goal:1, n:0, label:`Fabrique un ${CRAFTED[k].name.toLowerCase()} ${CRAFTED[k].emoji}`}; },
  ()=>{ const goal = 2; return {type:'sell', target:null, goal, n:0, label:`Vends ${goal} objets au marché 🏪`}; },
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
  playSound('win'); confetti(); vibrate([60,40,120,40,160]);
  const who = hello();
  speak(`${who ? who+', b' : 'B'}ravo ! Tu as fini toutes tes missions du jour. Tu gagnes ${bonusCoins} pièces et ${ITEMS[gift].name}.`);
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
    </div>
    <button class="btn-primary" id="btn-yay">Merci ! 🎉</button>
  `);
  if(typeof queueGain==='function') queueGain({ items:[ITEMS[gift].emoji], coins:bonusCoins });
  document.getElementById('btn-yay').onclick = ()=>{ playSound('tap'); closeModal(); renderLagon(); };
  renderQuests();
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
  if(typeof queueGain==='function') queueGain({ coins:ALBUM_REWARD });
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

