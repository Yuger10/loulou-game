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
  // mode chacun son tour : une erreur passe la main au joueur suivant
  if(typeof party!=='undefined' && party.active){
    setTimeout(()=> passTurn('wrong'), 420);
  }
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
let currentView = 'carte';
function switchView(name){
  // alias pratiques
  if(name==='lagon') name = 'ile';
  let sacTab = null;
  if(name==='album'){ name = 'sac'; sacTab = 'album'; }

  const sec = document.getElementById('view-'+name);
  if(!sec) return;
  currentView = name;
  document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));
  sec.classList.add('active');
  document.querySelectorAll('.navbtn').forEach(b=>b.classList.toggle('active', b.dataset.view===name));
  // remonte en haut de la vue (sans dépendre de window.scrollTo, absent de certains environnements)
  try{
    if(document.scrollingElement) document.scrollingElement.scrollTop = 0;
    else document.documentElement.scrollTop = 0;
  }catch(e){}

  if(name==='carte'){ renderMap(); renderIslandCard(); renderLevelPill(); }
  if(name==='ile') renderLagon();
  if(name==='sac'){
    state.newItems = 0; save(); renderBadge();
    setSacTab(sacTab || currentSacTab);
  }
  if(name==='marche') renderMarche();
}

// onglets du sac : objets / album
let currentSacTab = 'sac';
function setSacTab(tab){
  currentSacTab = tab;
  document.querySelectorAll('[data-sactab]').forEach(b=>b.classList.toggle('active', b.dataset.sactab===tab));
  const sac = document.getElementById('sac-content');
  const alb = document.getElementById('album-content');
  if(!sac || !alb) return;
  sac.hidden = tab!=='sac';
  alb.hidden = tab!=='album';
  if(tab==='sac') renderSac(); else renderAlbum();
}
function renderBadge(){
  const b = document.getElementById('sac-badge');
  b.hidden = state.newItems===0;
  b.textContent = state.newItems;
}

/* ---------- Carte des îles ---------- */
let currentWorld = 'lagon';
function worldUnlocked(id){ return level() >= WORLDS[id].level; }
function gameDiffIsland(){ return WORLDS[currentWorld] ? WORLDS[currentWorld].diff : 1; }
// En multijoueur, la difficulté suit l'âge du joueur qui joue : chacun a un défi à sa mesure.
function gameDiff(){
  if(typeof party!=='undefined' && party.active && typeof ageToDiff==='function'){
    const p = (typeof partyCurrent==='function' && partyCurrent()) || (typeof currentProfile==='function' && currentProfile());
    const d = p && ageToDiff(p.age);
    if(d) return d;
  }
  return gameDiffIsland();
}
// prochaine île à débloquer, et progression vers celle-ci
function nextLockedWorld(){
  return WORLD_ORDER.find(id=>!worldUnlocked(id));
}
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
    <div class="ic-chars">${charsOf(currentWorld).map(([,c])=>`<span>${c.emoji}</span>`).join('')}</div>
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
  const el = document.getElementById('islands');
  el.innerHTML = charsOf(currentWorld).map(([id,c])=>`
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
  if(typeof renderRaceTrack==='function') renderRaceTrack();
}

/* ---------- Décorations ---------- */
function renderScene(){
  const sc = document.getElementById('scene');
  const owned = decosOf(currentWorld).map(([k])=>k).filter(k=>state.decos.includes(k));
  sc.innerHTML = (owned.length
    ? owned.map(k=>`<span class="deco">${DECOS[k].emoji}</span>`).join('')
    : `<span class="empty">${WORLDS[currentWorld].sceneEmpty}</span>`)
    + `<button class="btn-deco" id="btn-deco">🎨 Décorer</button>`;
  document.getElementById('btn-deco').onclick = ()=>{ playSound('tap'); openDecoShop(); };
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
      addCoins(-d.price);
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

function openModal(html){
  const body = document.getElementById('modal-body') || document.getElementById('modal');
  body.innerHTML = html;
  const ov = document.getElementById('overlay');
  ov.classList.add('show');
  document.body.classList.add('modal-open');
  // la fenêtre repart toujours du haut
  const m = document.getElementById('modal');
  if(m) m.scrollTop = 0;
}
function closeModal(){
  document.getElementById('overlay').classList.remove('show');
  document.body.classList.remove('modal-open');
  if(window.speechSynthesis) speechSynthesis.cancel();
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
  if(state.decos.length===0 && state.coins>=8) lines.push(`Avec tes ${state.coins} pièces, tu pourrais décorer ${WORLDS[currentWorld].name} 🌴 !`);
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
      <span class="emoji">${c.emoji}</span>
      <h2>${c.name} ${c.title}</h2>
    </div>
    ${speechBubble(text)}
    <button class="btn-primary" id="btn-play">Choisir un jeu 🎮</button>
    <button class="btn-ghost" id="btn-random">🎲 Surprise</button>
    <button class="btn-ghost" id="btn-close">Pas maintenant</button>
  `);
  bindSpeakButtons();
  speak(`${c.name} ${c.title} : ${text}`);
  document.getElementById('btn-play').onclick = ()=> { playSound('tap'); openGamePicker(charId); };
  const pickBtn = document.getElementById('btn-random');
  if(pickBtn) pickBtn.onclick = ()=> { playSound('tap'); startMinigame(); };
  document.getElementById('btn-close').onclick = ()=>{ window.speechSynthesis && speechSynthesis.cancel(); closeModal(); };
}

