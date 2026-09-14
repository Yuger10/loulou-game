/* ---------- Utilitaires ---------- */
function addItem(key, qty=1){ state.inventory[key] = (state.inventory[key]||0) + qty; save(); }
function removeItem(key, qty=1){ state.inventory[key] = Math.max(0, (state.inventory[key]||0) - qty); save(); }
function countItem(key){ return state.inventory[key] || 0; }
function addCoins(n){
  state.coins += n; save(); renderCoins();
  const pill = document.getElementById('coin-pill');
  pill.classList.remove('bump'); void pill.offsetWidth; pill.classList.add('bump');
}
function renderCoins(){ document.getElementById('coin-count').textContent = state.coins; }
function pickRandom(arr){ return arr[Math.floor(Math.random()*arr.length)]; }
function shuffle(arr){ return arr.map(v=>[Math.random(),v]).sort((a,b)=>a[0]-b[0]).map(v=>v[1]); }
function level(){ return 1 + Math.floor(state.missions / MISSIONS_PER_LEVEL); }
function levelProgress(){ return (state.missions % MISSIONS_PER_LEVEL) / MISSIONS_PER_LEVEL; }

function showToast(msg){
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(showToast._t);
  showToast._t = setTimeout(()=> t.classList.remove('show'), 1600);
}

function vibrate(pattern){
  if(navigator.vibrate) navigator.vibrate(pattern);
}

function shakeEl(el){
  el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake');
}

function wrongFeedback(el){
  playSound('wrong');
  vibrate(80);
  shakeEl(el);
  el.style.opacity=.4; setTimeout(()=>el.style.opacity=1,400);
}

/* ---------- Sons (Web Audio, aucun fichier) ---------- */
let audioCtx = null;
function tone(freq, start, dur, type='sine', vol=.18){
  const o = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  o.type = type; o.frequency.value = freq;
  g.gain.setValueAtTime(0, audioCtx.currentTime + start);
  g.gain.linearRampToValueAtTime(vol, audioCtx.currentTime + start + .01);
  g.gain.exponentialRampToValueAtTime(.001, audioCtx.currentTime + start + dur);
  o.connect(g).connect(audioCtx.destination);
  o.start(audioCtx.currentTime + start);
  o.stop(audioCtx.currentTime + start + dur + .05);
}
function playSound(kind){
  if(!state.sound) return;
  try{
    if(!audioCtx) audioCtx = new (window.AudioContext||window.webkitAudioContext)();
    if(audioCtx.state==='suspended') audioCtx.resume();
    if(kind==='tap') tone(660, 0, .08, 'triangle', .1);
    else if(kind==='good') { tone(523, 0, .12); tone(784, .1, .16); }
    else if(kind==='wrong') tone(220, 0, .2, 'square', .08);
    else if(kind==='win') { [523,659,784,1047].forEach((f,i)=>tone(f, i*.11, .22)); }
    else if(kind==='coin') { tone(988, 0, .08, 'triangle'); tone(1319, .07, .14, 'triangle'); }
  }catch(e){}
}
document.getElementById('sound-btn').addEventListener('click', ()=>{
  // cycle : son+voix → son seul → muet
  if(state.sound && state.voice){ state.voice=false; }
  else if(state.sound){ state.sound=false; }
  else { state.sound=true; state.voice=true; }
  save(); renderSoundBtn();
  if(!state.voice && window.speechSynthesis) speechSynthesis.cancel();
  if(state.sound) playSound('tap');
  showToast(state.sound ? (state.voice ? '🗣️ Sons + voix' : '🔊 Sons seulement') : '🔇 Silence');
});
function renderSoundBtn(){
  document.getElementById('sound-btn').textContent = state.sound ? (state.voice ? '🗣️' : '🔊') : '🔇';
}

/* ---------- Voix (Web Speech) ---------- */
// Mots prononcés pour chaque emoji (singulier, pluriel)
const EMOJI_WORDS = {
  '🐚':['coquillage','coquillages'], '🦪':['perle','perles'], '🎀':['ruban','rubans'],
  '🌸':['fleur','fleurs'], '⭐':['étoile','étoiles'], '🌟':['étoile qui brille','étoiles qui brillent'],
  '💎':['gemme','gemmes'], '🐠':['poisson','poissons'], '🐟':['petit poisson','petits poissons'],
  '🦋':['papillon','papillons'], '🐝':['abeille','abeilles'], '🐌':['escargot','escargots'],
  '🌺':['hibiscus','hibiscus'], '🎁':['cadeau','cadeaux'], '🍓':['fraise','fraises'],
  '🌙':['lune','lunes'], '🦄':['licorne','licornes'], '🧜‍♀️':['sirène','sirènes'],
  '📿':['collier','colliers'], '💐':['bouquet','bouquets'], '👑':['couronne','couronnes'],
  '🪄':['baguette magique','baguettes magiques'], '🏆':['trésor','trésors'],
  '🪙':['',''], '🎮':['',''], '✨':['',''], '🎉':['',''], '🔊':['',''], '🔈':['',''],
};
function emojiWord(emoji, plural=false){
  const w = EMOJI_WORDS[emoji];
  return w ? w[plural?1:0] : '';
}
// "de étoiles" → "d'étoiles"
function elide(s){
  return s.replace(/\b(de|que|le|la|ne|se|je|me|te) (?=[aéèêàeiouôûh])/gi, (m,a)=> a[0]+"'");
}
function toSpoken(text){
  // remplace chaque emoji connu par son mot, puis enlève le reste
  let s = text.replace(/<[^>]+>/g,'');
  const keys = Object.keys(EMOJI_WORDS).sort((a,b)=>b.length-a.length);
  for(const k of keys){ s = s.split(k).join(' '+emojiWord(k)+' '); }
  s = s.replace(/[\p{Extended_Pictographic}\u{FE0F}\u{200D}]/gu,'');
  s = s.replace(/\s+/g,' ').replace(/\s+([?!,.:])/g,'$1').trim();
  return elide(s);
}

// Choix d'une voix féminine française, la plus naturelle possible
const VOICE_PREFS = ['Audrey','Aurélie','Aurelie','Google français','Marie','Amélie','Amelie','Virginie','Hortense','Julie','Denise','Vivienne','Flo (Français (France))','Sandy (Français (France))','Shelley (Français (France))','Flo','Sandy','Shelley'];
const VOICE_MALE = /thomas|jacques|eddy|reed|rocko|grandpa|nicolas|paul|henri|daniel|claude|yannick/i;
let chosenVoice = null;
function pickVoice(){
  if(!('speechSynthesis' in window)) return null;
  const voices = window.speechSynthesis.getVoices().filter(v=>/^fr/i.test(v.lang));
  if(!voices.length) return null;
  const score = v=>{
    let s = 0;
    const i = VOICE_PREFS.findIndex(p=>v.name.toLowerCase().startsWith(p.toLowerCase()));
    if(i>=0) s += 1000 - i*10;
    if(/premium|enhanced|natural|neural|amélior/i.test(v.name)) s += 200;
    if(/^fr-FR$/i.test(v.lang)) s += 50;
    if(VOICE_MALE.test(v.name)) s -= 500;
    if(/grandma|compact/i.test(v.name)) s -= 100;
    if(v.localService) s += 5;
    return s;
  };
  chosenVoice = voices.sort((a,b)=>score(b)-score(a))[0];
  return chosenVoice;
}
if('speechSynthesis' in window){
  pickVoice();
  window.speechSynthesis.onvoiceschanged = pickVoice;
}
function speak(text){
  if(!state.voice || !('speechSynthesis' in window)) return;
  try{
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(toSpoken(text));
    u.lang = 'fr-FR';
    u.rate = .92;
    u.pitch = 1.0;
    const v = chosenVoice || pickVoice();
    if(v) u.voice = v;
    window.speechSynthesis.speak(u);
  }catch(e){}
}
function bindSpeakButtons(){
  document.querySelectorAll('[data-say]').forEach(b=>{
    b.onclick = (e)=>{ e.stopPropagation(); speak(b.dataset.say); };
  });
}
function speechBubble(text, extraStyle=''){
  return `<div class="speech with-voice" style="${extraStyle}">
    <span class="txt">${text}</span>
    <button class="btn-speak" data-say="${text.replace(/"/g,'&quot;').replace(/<[^>]+>/g,'')}" aria-label="Écouter">🔈</button>
  </div>`;
}

/* ---------- Confettis ---------- */
function confetti(){
  const box = document.getElementById('confetti');
  const colors = ['#FF8969','#FFAAD4','#FFCB4C','#2EC4C6','#FFFFFF','#B388FF'];
  for(let i=0;i<50;i++){
    const p = document.createElement('div');
    p.className = 'confetti-piece';
    p.style.left = Math.random()*100 + '%';
    p.style.background = pickRandom(colors);
    p.style.animationDuration = (1.4 + Math.random()*1.2) + 's';
    p.style.animationDelay = (Math.random()*.4) + 's';
    p.style.transform = `rotate(${Math.random()*360}deg)`;
    box.appendChild(p);
    setTimeout(()=>p.remove(), 3200);
  }
}

/* ---------- Navigation ---------- */
document.querySelectorAll('.navbtn').forEach(btn=>{
  btn.addEventListener('click', ()=> { playSound('tap'); switchView(btn.dataset.view); });
});
function switchView(name){
  document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));
  document.getElementById('view-'+name).classList.add('active');
  document.querySelectorAll('.navbtn').forEach(b=>b.classList.toggle('active', b.dataset.view===name));
  if(name==='lagon') renderLagon();
  if(name==='sac'){ state.newItems = 0; save(); renderBadge(); renderSac(); }
  if(name==='marche') renderMarche();
  if(name==='album') renderAlbum();
}
function renderBadge(){
  const b = document.getElementById('sac-badge');
  b.hidden = state.newItems===0;
  b.textContent = state.newItems;
}

/* ---------- Lagon ---------- */
function renderLagon(){
  const lp = document.getElementById('level-pill');
  lp.innerHTML = `⭐ Niveau ${level()} <span class="level-bar"><i style="width:${levelProgress()*100}%"></i></span>`;
  const el = document.getElementById('islands');
  el.innerHTML = Object.entries(CHARACTERS).map(([id,c])=>`
    <button class="island" data-char="${id}">
      <span class="emoji">${c.emoji}</span>
      <span class="name">${c.name}<br>${c.title}</span>
      <span class="loot">${c.loot.map(k=>ITEMS[k].emoji).join(' ')}</span>
    </button>`).join('');
  el.querySelectorAll('.island').forEach(btn=>{
    btn.addEventListener('click', ()=> { playSound('tap'); openDialogue(btn.dataset.char); });
  });
  renderQuests();
  renderScene();
}

/* ---------- Décorations ---------- */
function renderScene(){
  const sc = document.getElementById('scene');
  const owned = state.decos.filter(k=>DECOS[k]);
  sc.innerHTML = (owned.length
    ? owned.map(k=>`<span class="deco">${DECOS[k].emoji}</span>`).join('')
    : `<span class="empty">Ton lagon est encore vide… gagne des pièces pour le décorer !</span>`)
    + `<button class="btn-deco" id="btn-deco">🎨 Décorer</button>`;
  document.getElementById('btn-deco').onclick = ()=>{ playSound('tap'); openDecoShop(); };
}

function openDecoShop(){
  openModal(`
    ${gameHeader('🎨 Décorer mon lagon', `Tu as 🪙 ${state.coins} pièces`)}
    <div id="deco-list">
      ${Object.entries(DECOS).map(([k,d])=>{
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
      addCoins(-d.price);
      state.decos.push(k); save();
      playSound('win'); confetti();
      speak(`Super ! ${d.name} est dans ton lagon !`);
      showToast(`${d.emoji} ${d.name} ajouté !`);
      renderScene();
      openDecoShop();
    };
  });
}

/* ---------- Personnages / dialogue ---------- */
let currentChar = null;

function openModal(html){
  document.getElementById('modal').innerHTML = html;
  document.getElementById('overlay').classList.add('show');
}
function closeModal(){
  document.getElementById('overlay').classList.remove('show');
  bindQuit._last = null;
}

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
  if(state.decos.length===0 && state.coins>=8) lines.push(`Avec tes ${state.coins} pièces, tu pourrais décorer le lagon 🌴 !`);
  if(state.decos.length>=3) lines.push(`Ton lagon est magnifique${who?', '+who:''} ! ${state.decos.length} décorations déjà ✨`);
  if(level()>=3) lines.push(`Niveau ${level()} déjà ! Tu es une vraie exploratrice du lagon.`);
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
      <span class="emoji">${c.emoji}</span>
      <h2>${c.name} ${c.title}</h2>
    </div>
    ${speechBubble(text)}
    <button class="btn-primary" id="btn-play">Jouer 🎮</button>
    <button class="btn-ghost" id="btn-close">Pas maintenant</button>
  `);
  bindSpeakButtons();
  speak(`${c.name} ${c.title} : ${text}`);
  document.getElementById('btn-play').onclick = ()=> { playSound('tap'); startMinigame(); };
  document.getElementById('btn-close').onclick = ()=>{ window.speechSynthesis && speechSynthesis.cancel(); closeModal(); };
}

