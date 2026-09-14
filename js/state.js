/* ---------- État ---------- */
const SAVE_VERSION = 1;
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
};
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
};

function save(){
  try{ localStorage.setItem(SAVE_KEY, JSON.stringify(state)); }catch(e){}
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
    saved.decos = saved.decos || [];
  }
  saved.v = SAVE_VERSION;
  return saved;
}
function load(){
  try{
    const raw = localStorage.getItem(SAVE_KEY);
    if(!raw) return;
    const saved = migrate(JSON.parse(raw));
    // ne garde que les clés connues : une sauvegarde ancienne ou corrompue ne casse pas le jeu
    const clean = {};
    Object.keys(DEFAULT_STATE).forEach(k=>{
      clean[k] = (saved[k] !== undefined && saved[k] !== null) || k==='quests' ? saved[k] : DEFAULT_STATE[k];
    });
    state = Object.assign({}, DEFAULT_STATE, clean);
    save();
  }catch(e){
    console.warn('Sauvegarde illisible, on repart à zéro', e);
  }
}
function resetState(){
  state = Object.assign({}, DEFAULT_STATE, {
    sound: state.sound, voice: state.voice,
    name: state.name, avatar: state.avatar,
  });
  save();
}

/* ---------- Profil (prénom + avatar) ---------- */
function hello(){ return state.name ? state.name : ''; }
function renderProfile(){
  document.querySelector('#avatar-pill .av').textContent = state.avatar || '👧';
  document.getElementById('player-name').textContent = state.name || 'Toi';
}
let pendingAvatar = '👧';
function openWelcome(){
  const grid = document.getElementById('avatar-grid');
  pendingAvatar = state.avatar || '👧';
  grid.innerHTML = AVATARS.map(a=>`<button class="avatar-opt ${a===pendingAvatar?'sel':''}" data-av="${a}">${a}</button>`).join('');
  grid.querySelectorAll('.avatar-opt').forEach(b=>{
    b.onclick = ()=>{
      pendingAvatar = b.dataset.av;
      grid.querySelectorAll('.avatar-opt').forEach(x=>x.classList.toggle('sel', x===b));
      playSound('tap');
    };
  });
  document.getElementById('name-input').value = state.name || '';
  document.getElementById('welcome').classList.add('show');
}
function closeWelcome(){
  const name = document.getElementById('name-input').value.trim().slice(0,12);
  state.name = name;
  state.avatar = pendingAvatar;
  save();
  renderProfile();
  document.getElementById('welcome').classList.remove('show');
  playSound('win');
  const who = name ? name : 'toi';
  speak(`Bonjour ${who} ! Bienvenue dans le lagon magique.`);
  showToast(name ? `Bonjour ${name} ! ✨` : 'Bonne aventure ! ✨');
  renderLagon();
}

/* ---------- Quêtes du jour ---------- */
const QUEST_TEMPLATES = [
  ()=>{ const k = pickRandom(Object.keys(ITEMS)); const goal = 2 + Math.floor(Math.random()*2);
        return {type:'collect', target:k, goal, n:0, label:`Gagne ${goal} ${ITEMS[k].name.toLowerCase()}${goal>1?'s':''} ${ITEMS[k].emoji}`}; },
  ()=>{ const c = pickRandom(Object.keys(CHARACTERS)); const goal = 2;
        return {type:'char', target:c, goal, n:0, label:`Joue ${goal} fois avec ${CHARACTERS[c].name} ${CHARACTERS[c].emoji}`}; },
  ()=>{ const goal = 3; return {type:'win', target:null, goal, n:0, label:`Réussis ${goal} missions 🎮`}; },
  ()=>{ const k = pickRandom(['collier','bouquet','couronne','baguette']);
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
function renderQuests(){
  const q = ensureQuests();
  const el = document.getElementById('quests');
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
  const b = document.getElementById('btn-chest');
  if(b) b.onclick = openChest;
}
function openChest(){
  const q = ensureQuests();
  if(q.claimed || !questsDone()) return;
  q.claimed = true;
  const bonusCoins = 15;
  const gift = pickRandom(Object.keys(ITEMS));
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
        <span style="font-size:2rem;">🪙</span><span><strong>+${bonusCoins} pièces</strong></span>
      </div>
      <div class="speech" style="display:flex; align-items:center; justify-content:center; gap:10px; background:#FFF9E8;">
        <span style="font-size:2rem;">${ITEMS[gift].emoji}</span><span><strong>${ITEMS[gift].name}</strong></span>
      </div>
    </div>
    <button class="btn-primary" id="btn-yay">Merci ! 🎉</button>
  `);
  document.getElementById('btn-yay').onclick = ()=>{ playSound('tap'); closeModal(); renderLagon(); };
  renderQuests();
}

/* ---------- Album ---------- */
function markSeen(key){
  if(!state.seen) state.seen = {};
  if(!state.seen[key]){ state.seen[key] = true; save(); return true; }
  return false;
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
  const objFound = objKeys.filter(k=>seen[k]||countItem(k)>0).length;
  const decoFound = decoKeys.filter(k=>state.decos.includes(k)).length;
  const total = objKeys.length + decoKeys.length;
  const found = objFound + decoFound;
  el.innerHTML = `
    <div class="album-progress">
      ${found===total ? '🏆 Album complet, bravo !' : `✨ ${found} / ${total} découverts`}
      <div class="quest-bar"><i style="width:${(found/total)*100}%"></i></div>
    </div>
    <div class="album-section">
      <h3>🎒 Objets</h3>
      <div class="album-grid">${objKeys.map(k=>cell(k, ALL_ITEMS[k], !!(seen[k]||countItem(k)>0))).join('')}</div>
      <h3>🎨 Décorations</h3>
      <div class="album-grid">${decoKeys.map(k=>cell(k, DECOS[k], state.decos.includes(k))).join('')}</div>
    </div>`;
}

