/* ---------- Mini-jeux ---------- */

/* Essais autorisés : à partir de l'île 2, les erreurs comptent.
   On évite ainsi de cliquer au hasard jusqu'à tomber juste.
   Le barème complet (par type de jeu et par palier) est centralisé et
   documenté dans js/difficulty.js (fonction `livesFor`) — voir aussi
   ANALYSE-DIFFICULTE.md pour le détail académique. */
let lives = Infinity, maxLives = Infinity, currentGameKind = null;

function triesFor(kind){
  return livesFor(kind, gameDiff());
}

function setupLives(kind){
  currentGameKind = kind;
  maxLives = triesFor(kind);
  lives = maxLives;
}

function livesBar(){
  if(maxLives === Infinity) return '';
  return `<div class="lives" id="lives-bar" aria-label="Essais restants">
    ${Array.from({length:maxLives},(_,i)=>`<span class="life ${i<lives?'on':'off'}">${i<lives?'❤️':'🤍'}</span>`).join('')}
  </div>`;
}
function renderLives(){
  const bar = document.getElementById('lives-bar');
  if(!bar || maxLives === Infinity) return;
  [...bar.querySelectorAll('.life')].forEach((el,i)=>{
    const alive = i < lives;
    if(!alive && el.classList.contains('on')){
      el.classList.remove('on'); el.classList.add('off','breaking');
      el.textContent = '💔';
      setTimeout(()=>{ el.textContent = '🤍'; el.classList.remove('breaking'); }, 600);
    }
  });
}

// Une erreur : la proposition fautive est neutralisée et un essai est perdu.
function loseLife(el, opts){
  opts = opts || {};
  if(typeof buddyReact==='function') buddyReact('oops', 1300);
  // multijoueur : la règle reste « une erreur = on passe la main »
  if(typeof party!=='undefined' && party.active){ wrongFeedback(el); return false; }

  playSound('wrong');
  vibrate(90);
  if(el){
    shakeEl(el);
    el.classList.add('ko-flash');
    if(opts.disable !== false && 'disabled' in el){ el.disabled = true; el.classList.add('ko'); }
    setTimeout(()=> el.classList.remove('ko-flash'), 450);
  }
  if(lives === Infinity){
    if(el && 'disabled' in el && opts.disable !== false){
      // île 1 : la mauvaise réponse se referme mais on peut continuer
      setTimeout(()=>{ el.disabled = false; el.classList.remove('ko'); }, 700);
    }
    return false;
  }
  lives--;
  renderLives();
  flashModal('ko');
  if(lives <= 0){ setTimeout(onMissionFail, 520); return true; }
  showToast(lives === 1 ? '⚠️ Dernier essai !' : `${lives} essais restants`);
  return false;
}

/* =====================================================================
   MINUTEUR DE RÉPONSE — fluence, à partir du palier 3 (voir
   js/difficulty.js pour la table des durées et le détail académique).
   Principes :
   - jamais pour un enfant de moins de 6 ans (currentPlayerAge) ;
   - jamais pour les jeux à plusieurs étapes (mémoire, Simon, puzzle) ;
   - le temps écoulé compte comme un essai perdu (même système de
     cœurs ❤️ que les autres erreurs), jamais comme un échec immédiat ;
   - toujours annulé dès qu'une nouvelle fenêtre s'ouvre ou se ferme
     (voir les appels à `clearActiveTimer()` dans openModal/closeModal,
     js/ui.js) : aucun minuteur ne continue à tourner « dans le vide ».
   ===================================================================== */
let activeTimerInterval = null;

function clearActiveTimer(){
  if(activeTimerInterval){ clearInterval(activeTimerInterval); activeTimerInterval = null; }
}

// Insère la barre de minuteur juste après la consigne, et démarre le
// décompte. `kind` = type de jeu (sert à lire la durée adaptée dans
// TIMER_SECONDS) ; appelé par chaque jeu « une question = une réponse »
// juste après son propre openModal(...).
function startTimerIfNeeded(kind){
  clearActiveTimer();
  // en multijoueur (chacun son tour / course), on garde l'expérience
  // simple : pas de minuteur qui se superpose au passage de main.
  if(typeof party!=='undefined' && party.active) return;
  if(typeof race!=='undefined' && race.active) return;
  const dd = gameDiff();
  // jamais de pression temporelle avant le CP (programme de maternelle)
  const age = typeof currentPlayerAge === 'function' ? currentPlayerAge() : null;
  if(age && age < 6) return;
  const seconds = timerFor(kind, dd);
  if(!seconds) return;

  const hint = document.querySelector('.puzzle-hint');
  if(!hint) return;
  const bar = document.createElement('div');
  bar.className = 'challenge-timer';
  bar.id = 'challenge-timer';
  bar.innerHTML = `<i id="challenge-timer-bar" style="width:100%"></i>`;
  hint.insertAdjacentElement('afterend', bar);

  let remaining = seconds;
  activeTimerInterval = setInterval(()=>{
    remaining -= 1;
    const el = document.getElementById('challenge-timer-bar');
    const wrap = document.getElementById('challenge-timer');
    if(el) el.style.width = Math.max(0, (remaining/seconds)*100) + '%';
    if(wrap) wrap.classList.toggle('urgent', remaining <= 5);
    if(remaining <= 0){
      clearActiveTimer();
      onResponseTimeout(kind);
    }
  }, 1000);
}

// Temps écoulé : traité EXACTEMENT comme une mauvaise réponse (même
// cœurs ❤️, même message d'encouragement), sans jamais désigner un
// bouton fautif puisque l'enfant n'a rien cliqué de faux. Si la mission
// n'est pas ratée, on redonne simplement un nouveau temps complet sur
// la même question — aucune pénalité au-delà de l'essai perdu.
function onResponseTimeout(kind){
  showToast('⏰ Temps écoulé ! On réessaie 👀');
  const failed = loseLife(null);
  if(!failed) startTimerIfNeeded(kind);
}

// petit flash coloré sur tout le deck
function flashModal(kind){
  const m = document.getElementById('modal');
  if(!m) return;
  m.classList.remove('flash-ok','flash-ko');
  void m.offsetWidth;
  m.classList.add(kind==='ok' ? 'flash-ok' : 'flash-ko');
  setTimeout(()=> m.classList.remove('flash-ok','flash-ko'), 500);
}

// bonne étape : pastille verte + petite étoile qui monte
function stepOk(el){
  playSound('good');
  if(typeof buddyReact==='function') buddyReact('wow', 900);
  if(!el) return;
  el.classList.add('ok-flash');
  setTimeout(()=> el.classList.remove('ok-flash'), 600);
  const spark = document.createElement('span');
  spark.className = 'step-spark';
  spark.textContent = pickRandom(['✨','⭐','💫','👍']);
  el.appendChild ? el.appendChild(spark) : null;
  setTimeout(()=> spark.remove(), 800);
}

let lastGame = null;
// Fonction de rendu pour un type de jeu donné (doit couvrir GAME_TYPES).
// Résolu au moment de l'appel (et non au chargement) : les mini-jeux les
// plus récents sont définis dans des fichiers chargés après celui-ci.
function gameRenderer(key){
  switch(key){
    case 'memory': return renderMemory;
    case 'count': return renderCount;
    case 'diff': return renderDiff;
    case 'puzzle': return renderPuzzle;
    case 'sequence': return renderSequence;
    case 'simon': return renderSimon;
    case 'math': return renderMath;
    case 'reading': return renderReading;
    case 'determinants': return renderDeterminants;
    case 'volume': return renderVolume;
    case 'compare': return renderCompare;
    case 'money': return renderMoney;
    case 'clock': return renderClock;
    case 'calendar': return renderCalendar;
    case 'calc': return renderCalc;
    default: return renderMemory;
  }
}

// Lance un type de jeu précis, en comptant le coup pour ce joueur
// (utilisé pour proposer en priorité les jeux les moins essayés).
function playGame(key){
  trackGamePlayed(key);
  lastGame = key;
  gameRenderer(key)();
}

function startMinigame(){
  // ne propose que des défis adaptés à l'âge du joueur, et évite de
  // tomber deux fois de suite sur le même jeu
  const allowed = gameTypesForAge(typeof currentPlayerAge==='function' ? currentPlayerAge() : null);
  const pool = allowed.filter(t=>t!==lastGame);
  const type = pickRandom(pool.length ? pool : allowed);
  playGame(type);
}

// En-tête d'une fenêtre de jeu : titre, consigne et bouton pour l'écouter.
// La fermeture est assurée par la croix de la fenêtre (#modal-close).
function gameHeader(title, hint, spoken){
  const say = (spoken || hint).replace(/"/g,'&quot;');
  return `
    <div class="game-head"><h2>${title}</h2></div>
    <p class="puzzle-hint has-buddy">
      <span class="hint-txt">${hint}</span>
      ${typeof buddySlot==='function' ? buddySlot('think') : ''}
      <button class="btn-speak" data-say="${say}" aria-label="Écouter la consigne">🔈</button>
    </p>
  `;
}
// branche les boutons « écouter » et lit la consigne à voix haute
function bindQuit(){
  bindSpeakButtons();
  // lit la consigne une seule fois par mini-jeu (le mémo se re-rend à chaque clic)
  const hint = document.querySelector('.puzzle-hint [data-say]');
  if(hint && hint.dataset.say !== bindQuit._last){ bindQuit._last = hint.dataset.say; speak(hint.dataset.say); }
}
function progressDots(done, total){
  return `<div class="game-progress">${Array.from({length:total},(_,i)=>`<i class="${i<done?'on':''}"></i>`).join('')}</div>`;
}

/* Mission ratée : on encourage, on ne punit pas — mais pas de récompense. */
function onMissionFail(){
  bindQuit._last = null;
  lives = 0;
  const c = CHARACTERS[currentChar] || CHARACTERS.sirene;
  const who = hello();
  playSound('wrong');
  vibrate([120, 60, 120]);
  const msg = pickRandom([
    `Ce n'est pas grave${who?' '+who:''} ! On réessaie ?`,
    `Presque ! Tu vas y arriver la prochaine fois.`,
    `Oups ! Regarde bien et réessaie 👀`,
  ]);
  speak(`${msg}`);

  openModal(`
    <div class="reward-box fail-box">
      ${typeof buddySlot==='function' ? buddySlot('oops','buddy-big fail-emoji') : '<span class="big-emoji fail-emoji">😅</span>'}
      <h2>Raté !</h2>
      <div class="speech">${msg}</div>
      <div class="speech" style="background:#FFF1EC;">
        ${charFace(currentChar)} <strong>${c.name}</strong> t'attend pour un nouvel essai !
      </div>
    </div>
    <button class="btn-primary" id="btn-retry">🔁 Réessayer</button>
    <button class="btn-ghost" id="btn-later">Plus tard</button>
  `);
  const m = document.getElementById('modal');
  if(m){ m.classList.add('shake-hard'); setTimeout(()=>m.classList.remove('shake-hard'), 500); }
  document.getElementById('btn-retry').onclick = ()=>{ playSound('tap'); startMinigame(); };
  document.getElementById('btn-later').onclick = ()=>{ playSound('tap'); closeModal(); renderLagon(); };
}

function onMissionWin(){
  bindQuit._last = null;
  if(typeof partyScore==='function') partyScore();
  // course : on avance d'une case ; si la ligne d'arrivée est franchie, l'écran de victoire s'affiche
  if(typeof partyAfterWin==='function' && partyAfterWin()) return;
  const c = CHARACTERS[currentChar] || CHARACTERS.sirene;
  if(typeof markHelped==='function') markHelped(currentChar);   // ❤️ sur l'île
  const prevLevel = level();
  state.missions += 1;
  const key = pickRandom(c.loot);
  // bonus : de temps en temps un objet rare en plus
  const bonus = Math.random() < 0.2 ? pickRandom(availableItems()) : null;
  addItem(key,1); markSeen(key);
  if(bonus){ addItem(bonus,1); markSeen(bonus); }
  state.newItems += bonus ? 2 : 1;
  save();
  renderBadge();
  questProgress('win', null, 1);
  questProgress('char', currentChar, 1);
  questProgress('collect', key, 1);
  if(bonus) questProgress('collect', bonus, 1);
  const it = ITEMS[key];
  const levelUp = level() > prevLevel;

  playSound('win');
  vibrate([60,40,120]);
  confetti();
  const who = hello();
  const praise = pickRandom([
    `Bravo${who?' '+who:''}, bien joué !`,
    `Super${who?' '+who:''}, tu es trop ${ac('fort')} !`,
    `Génial, c'est réussi !`,
    `Waouh${who?' '+who:''}, quel${ac('','le')} ${ac('champion','championne')} !`,
    `Incroyable, tu as tout trouvé !`,
    `Trop ${ac('malin','maligne')} ! 💪`,
  ]);
  setTimeout(()=> speak(`${levelUp ? `Niveau ${level()} ! ` : ''}${praise} ${c.name} t'offre ${it.name}${bonus ? `, et une surprise : ${ITEMS[bonus].name}` : ''}.`), 300);

  openModal(`
    <div class="reward-box win-box">
      <span class="win-rays" aria-hidden="true"></span>
      ${typeof buddySlot==='function' ? buddySlot('cheer','buddy-big win-emoji') : `<span class="big-emoji win-emoji">${levelUp ? '🌟' : '🎉'}</span>`}
      <span class="win-stamp">${levelUp ? '🌟' : '✅'}</span>
      <h2>${levelUp ? `Niveau ${level()} !` : praise}</h2>
      <div class="speech reward-item" style="display:flex; align-items:center; justify-content:center; gap:10px;">
        <span class="reward-emoji" data-gain-item style="font-size:2rem;">${it.emoji}</span>
        <span>${c.name} t'offre : <strong>${it.name}</strong></span>
      </div>
      ${bonus ? `<div class="speech" style="display:flex; align-items:center; justify-content:center; gap:10px; background:#FFF9E8;">
        <span data-gain-item style="font-size:2rem;">${ITEMS[bonus].emoji}</span>
        <span>Surprise ! <strong>${ITEMS[bonus].name}</strong> en plus ✨</span>
      </div>` : ''}
    </div>
    <button class="btn-primary" id="btn-yay">${(typeof party!=='undefined' && party.active) ? 'Au joueur suivant 👉' : 'Super !'}</button>
    ${(typeof party!=='undefined' && party.active) ? '' : '<button class="btn-ghost" id="btn-again">Encore une mission 🎮</button>'}
  `);
  // l'objet gagné s'envolera jusqu'au sac quand la fenêtre se fermera
  if(typeof queueGain==='function') queueGain({ items:[it.emoji, bonus ? ITEMS[bonus].emoji : null] });
  document.getElementById('btn-yay').onclick = ()=> {
    playSound('tap'); closeModal(); renderLagon();
    // multijoueur : la main passe au joueur suivant après une réussite
    if(typeof party!=='undefined' && party.active){ passTurn('next'); return; }
    setTimeout(checkNewIsland, 250);   // nouvelle île débloquée ?
  };
  const againBtn = document.getElementById('btn-again');
  if(againBtn) againBtn.onclick = ()=> { playSound('tap'); renderLagon(); startMinigame(); };
}

/* Jeu 1 : mémoire (pas de minuteur : tâche à plusieurs étapes, voir
   js/difficulty.js § « MINUTEUR » pour la justification). */
function renderMemory(){
  setupLives('memory');
  const dd = gameDiff();
  const pairs = memoryPairs(dd);
  const pool = shuffle(Object.values(ALL_ITEMS).map(i=>i.emoji)).slice(0,pairs);
  const cards = shuffle([...pool, ...pool]).map((e,i)=>({id:i, emoji:e, flipped:false, matched:false}));
  let first=null, lock=false;
  const cols3 = pairs===3;

  function render(){
    openModal(`
      ${gameHeader('🧠 Jeu de mémoire','Retrouve les paires identiques')}
      ${livesBar()}
      ${progressDots(cards.filter(c=>c.matched).length/2, pairs)}
      <div class="memory-grid ${cols3?'cols3':''}">
        ${cards.map(c=>`<button type="button" class="mcard ${c.matched?'matched':(c.flipped?'flipped':'')}" data-id="${c.id}" ${c.matched?'disabled':''} aria-label="Carte ${c.id+1}">${(c.flipped||c.matched)?c.emoji:''}</button>`).join('')}
      </div>
    `);
    bindQuit();
    document.querySelectorAll('.mcard').forEach(el=>{
      el.onclick = ()=>{
        const id = Number(el.dataset.id);
        const card = cards.find(c=>c.id===id);
        if(lock || card.flipped || card.matched) return;
        playSound('tap');
        card.flipped = true;
        render();
        if(!first){ first = card; return; }
        lock = true;
        const second = card;
        const isMatch = first.emoji===second.emoji;
        setTimeout(()=>{
          const wasMatch = isMatch;
          if(isMatch){
            first.matched = true; second.matched = true;
          } else {
            first.flipped = false; second.flipped = false;
          }
          first = null; lock = false;
          render();
          if(wasMatch){
            playSound('good');
            document.querySelectorAll('.mcard.matched').forEach(el=>{
              el.classList.add('ok-flash');
              setTimeout(()=>el.classList.remove('ok-flash'), 600);
            });
          } else {
            if(loseLife(null)) return;    // plus d'essais : mission ratée
          }
          if(cards.every(c=>c.matched)){ flashModal('ok'); setTimeout(onMissionWin, 350); }
        }, isMatch ? 350 : 700);
      };
    });
  }
  render();
}

/* Jeu 2 : compter (dénombrement — voir js/difficulty.js § countRange) */
function renderCount(){
  setupLives('count');
  const emoji = pickRandom(['⭐','🐚','🌸','🦪','🐠','🦋']);
  const dd = gameDiff();
  const { min, max } = countRange(dd);
  const n = min + Math.floor(Math.random()*(max-min+1));
  let options = new Set([n]);
  while(options.size<3){ options.add(Math.max(1, n + (Math.floor(Math.random()*5)-2))); }
  options = shuffle([...options]);

  openModal(`
    ${gameHeader('🔢 Compte avec moi', `Combien y a-t-il de ${emoji} ?`, `Combien y a-t-il de ${emojiWord(emoji,true)} ?`)}
    ${livesBar()}
    <div class="count-row">${Array(n).fill(emoji).map(e=>`<span>${e}</span>`).join('')}</div>
    <div class="num-options">
      ${options.map(o=>`<button class="num-btn" data-v="${o}">${o}</button>`).join('')}
    </div>
  `);
  bindQuit();
  startTimerIfNeeded('count');
  document.querySelectorAll('.num-btn').forEach(btn=>{
    btn.onclick = ()=>{
      if(Number(btn.dataset.v)===n){ clearActiveTimer(); stepOk(btn); flashModal('ok'); setTimeout(onMissionWin, 350); }
      else loseLife(btn);
    };
  });
}

/* Jeu 3 : trouver l'intrus (discrimination visuelle — voir
   js/difficulty.js § diffTotal / diffMirrorChance) */
function renderDiff(){
  setupLives('diff');
  const dd = gameDiff();
  const total = diffTotal(dd);
  // emojis qui se voient bien à l'envers (pas symétriques)
  const MIRRORABLE = ['🐠','🦋','🐌','🦄','🐬','🦊','🐿️','🦉','🦌','🦔','🐟','🎩'];
  // niveaux élevés : l'intrus ressemble un peu plus aux autres
  const sets = dd>=2
    ? [['🐚','🐌'],['🌸','🌺'],['⭐','🌟'],['🦋','🐝'],['🎀','🎁'],['🐠','🐟'],['🍄','🌰'],['🍀','🌿']]
    : [['🐚','🦄'],['🦋','💎'],['🌸','🍓'],['⭐','🌙'],['🎀','🧜‍♀️'],['🍄','🦊']];

  // au-delà du palier 1 : chance croissante que ce soit la variante miroir
  const mirrorMode = Math.random() < diffMirrorChance(dd);
  let base, odd, items, hint;
  if(mirrorMode){
    base = pickRandom(MIRRORABLE);
    odd = base;
    hint = "Une image est retournée comme dans un miroir. Laquelle ?";
    items = Array(total).fill(base);
  } else {
    [base, odd] = pickRandom(sets);
    hint = "Touche celui qui n'est pas comme les autres";
    items = Array(total-1).fill(base);
  }
  const oddPos = Math.floor(Math.random()*total);
  if(!mirrorMode) items.splice(oddPos,0,odd);

  openModal(`
    ${gameHeader("🔍 Trouve l'intrus", hint)}
    ${livesBar()}
    <div class="diff-row">
      ${items.map((e,i)=>{
        const isOdd = mirrorMode ? (i===oddPos) : (e===odd);
        return `<button type="button" class="diff-item ${mirrorMode && isOdd ? 'mirror':''}" data-odd="${isOdd}" aria-label="Image ${i+1}">${e}</button>`;
      }).join('')}
    </div>
  `);
  bindQuit();
  startTimerIfNeeded('diff');
  document.querySelectorAll('.diff-item').forEach(el=>{
    el.onclick = ()=>{
      if(el.dataset.odd==='true'){ clearActiveTimer(); stepOk(el); flashModal('ok'); setTimeout(onMissionWin, 350); }
      else loseLife(el);
    };
  });
}

/* Jeu 6 : mémoire de séquence (Simon). Pas de minuteur : la tâche est
   déjà chronométrée par nature (on répète une séquence qui vient de
   s'afficher) — un décompte en plus ferait double pression, voir
   js/difficulty.js § « MINUTEUR ». Longueur dans § simonLength. */
function renderSimon(){
  setupLives('simon');
  const PADS = [
    {k:'a', emoji:'🟡', freq:392, name:'jaune'},
    {k:'b', emoji:'🔵', freq:523, name:'bleu'},
    {k:'c', emoji:'🟢', freq:659, name:'vert'},
    {k:'d', emoji:'🔴', freq:784, name:'rouge'},
  ];
  const len = simonLength(gameDiff());
  const seq = Array.from({length:len},()=>pickRandom(PADS));
  let pos = 0, playing = true;

  openModal(`
    ${gameHeader('🎵 Répète après moi', 'Regarde bien les couleurs, puis touche-les dans le même ordre')}
    ${livesBar()}
    ${progressDots(0, len)}
    <div class="simon-grid" id="simon-grid">
      ${PADS.map(p=>`<button class="simon-pad" data-k="${p.k}">${p.emoji}</button>`).join('')}
    </div>
    <p class="puzzle-hint" id="simon-state">👀 Regarde…</p>
  `);
  bindQuit();

  const padEl = k => document.querySelector(`.simon-pad[data-k="${k}"]`);
  // chaque pastille a sa propre note : elle peut reconnaître la couleur à l'oreille
  function padTone(p, dur=.3, vol=.16){
    if(!state.sound) return;
    try{
      if(!audioCtx) audioCtx = new (window.AudioContext||window.webkitAudioContext)();
      if(audioCtx.state==='suspended') audioCtx.resume();
      tone(p.freq, 0, dur, 'sine', vol);
      tone(p.freq*2, 0, dur*.5, 'triangle', vol*.35); // harmonique : timbre plus doux
    }catch(e){}
  }
  function flash(p, i){
    setTimeout(()=>{
      const el = padEl(p.k);
      if(!el) return;
      el.classList.add('lit');
      padTone(p);
      setTimeout(()=>el.classList.remove('lit'), 380);
    }, 600 + i*650);
  }
  seq.forEach(flash);
  setTimeout(()=>{
    playing = false;
    const s = document.getElementById('simon-state');
    if(s) s.textContent = '👆 À toi !';
  }, 600 + seq.length*650);

  document.querySelectorAll('.simon-pad').forEach(btn=>{
    btn.onclick = ()=>{
      if(playing) return;
      const k = btn.dataset.k;
      const p = PADS.find(x=>x.k===k);
      btn.classList.add('lit'); setTimeout(()=>btn.classList.remove('lit'), 200);
      padTone(p, .22, .15); // le son de la pastille joue toujours, même si c'est la mauvaise
      if(seq[pos].k === k){
        pos++;
        document.querySelectorAll('.game-progress i').forEach((dd,i)=>dd.classList.toggle('on', i<pos));
        if(pos===seq.length){ flashModal('ok'); setTimeout(onMissionWin, 350); }
      } else {
        if(loseLife(btn, {disable:false})) return;
        pos = 0;
        document.querySelectorAll('.game-progress i').forEach(dd=>dd.classList.remove('on'));
        const s = document.getElementById('simon-state');
        if(s) s.textContent = '🔁 On recommence…';
        playing = true;
        seq.forEach(flash);
        setTimeout(()=>{
          playing = false;
          const s2 = document.getElementById('simon-state');
          if(s2) s2.textContent = '👆 À toi !';
        }, 600 + seq.length*650);
      }
    };
  });
}

/* Jeu 5 : suite logique (notion de « suite organisée », cycle 1 puis
   algorithme simple en cycle 2 — voir js/difficulty.js § sequence*) */
function renderSequence(){
  setupLives('sequence');
  const symbols = shuffle(['🐚','⭐','🌸','🎀','💎','🦋','🐠']).slice(0,3);
  const [A,B,C] = symbols;
  const dd = gameDiff();
  // le motif qui se répète grandit avec le palier : 2 éléments (le plus
  // simple) → jusqu'à 4 éléments combinés (palier 5)
  const patterns = dd<=1
    ? [[A,B]]
    : dd===2 ? [[A,B],[A,A,B],[A,B,C]]
    : dd===3 ? [[A,B,B],[A,A,B],[A,B,C]]
    : [[A,B,C],[A,B,A,C],[A,A,B,C],[A,B,B,C]];
  const pattern = pickRandom(patterns);
  const shown = sequencePatternLength(dd);
  const seq = Array.from({length:shown},(_,i)=>pattern[i%pattern.length]);
  const answer = pattern[shown%pattern.length];
  const options = shuffle([...new Set([answer, ...symbols])]).slice(0,3);
  if(!options.includes(answer)) options[0] = answer;

  openModal(`
    ${gameHeader('🔮 La suite magique', 'Regarde bien… quelle image vient après ?')}
    ${livesBar()}
    <div class="seq-row">
      ${seq.map(e=>`<span>${e}</span>`).join('')}
      <span class="q">?</span>
    </div>
    <div class="seq-options">
      ${shuffle(options).map(o=>`<button class="seq-btn" data-v="${o}">${o}</button>`).join('')}
    </div>
  `);
  bindQuit();
  startTimerIfNeeded('sequence');
  document.querySelectorAll('.seq-btn').forEach(btn=>{
    btn.onclick = ()=>{
      if(btn.dataset.v===answer){
        clearActiveTimer();
        const q = document.querySelector('.seq-row .q');
        q.textContent = answer; q.style.border='none'; q.classList.add('filled');
        stepOk(btn); flashModal('ok');
        setTimeout(onMissionWin, 420);
      } else loseLife(btn);
    };
  });
}

/* Jeu 4 : puzzle des nombres (remettre une suite dans l'ordre). Pas de
   minuteur : tâche à plusieurs clics successifs (voir js/difficulty.js
   § « MINUTEUR »). Longueur et variantes dans § puzzleCount/Variants —
   corrige un bug où la variante « start » était comptée deux fois dans
   la liste de tirage (probabilité doublée par erreur). */
function renderPuzzle(){
  setupLives('puzzle');
  const dd = gameDiff();
  const count = puzzleCount(dd);
  const lvl = dd;
  const variants = puzzleVariants(dd);
  const variant = pickRandom(variants);

  let seq, hint;
  if(variant==='from1'){
    seq = Array.from({length:count},(_,i)=>i+1);
    hint = `Touche les nombres dans l'ordre : 1 → ${count}`;
  } else if(variant==='start'){
    const maxStart = puzzleStartMax(dd);
    const start = 2 + Math.floor(Math.random()*(maxStart-1));
    seq = Array.from({length:count},(_,i)=>start+i);
    hint = `Touche les nombres dans l'ordre : ${seq[0]} → ${seq[seq.length-1]}`;
  } else if(variant==='desc'){
    const start = count + 1 + Math.floor(Math.random()*6);
    seq = Array.from({length:count},(_,i)=>start-i);
    hint = `À l'envers ! Du plus grand au plus petit : ${seq[0]} → ${seq[seq.length-1]}`;
  } else { // step2
    const start = pickRandom([2,3,4,5,10]);
    seq = Array.from({length:count},(_,i)=>start+i*2);
    hint = `De 2 en 2 : ${seq[0]}, ${seq[1]}, ${seq[2]}…`;
  }

  const nums = shuffle(seq.slice());
  let idx = 0;
  openModal(`
    ${gameHeader('🧩 Petit puzzle', hint)}
    ${livesBar()}
    ${progressDots(0, seq.length)}
    <div class="puzzle-row">
      ${nums.map(n=>`<button class="puzzle-btn" data-n="${n}">${n}</button>`).join('')}
    </div>
  `);
  bindQuit();
  document.querySelectorAll('.puzzle-btn').forEach(btn=>{
    btn.onclick = ()=>{
      const n = Number(btn.dataset.n);
      if(btn.classList.contains('done')) return;
      if(n===seq[idx]){
        btn.classList.add('done');
        stepOk(btn);
        idx++;
        document.querySelectorAll('.game-progress i').forEach((d,i)=>d.classList.toggle('on', i<idx));
        if(idx===seq.length){ flashModal('ok'); setTimeout(onMissionWin, 350); }
      } else {
        loseLife(btn, {disable:false});   // le bon nombre reste cliquable ensuite
      }
    };
  });
}

