/* ---------- Mini-jeux ---------- */
let lastGame = null;
function startMinigame(){
  // évite de tomber deux fois de suite sur le même jeu
  const type = pickRandom(GAME_TYPES.filter(t=>t!==lastGame));
  lastGame = type;
  if(type==='memory') renderMemory();
  else if(type==='count') renderCount();
  else if(type==='diff') renderDiff();
  else if(type==='sequence') renderSequence();
  else if(type==='simon') renderSimon();
  else renderPuzzle();
}

// En-tête d'une fenêtre de jeu : titre, consigne et bouton pour l'écouter.
// La fermeture est assurée par la croix de la fenêtre (#modal-close).
function gameHeader(title, hint, spoken){
  const say = (spoken || hint).replace(/"/g,'&quot;');
  return `
    <div class="game-head"><h2>${title}</h2></div>
    <p class="puzzle-hint">
      <span>${hint}</span>
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

function onMissionWin(){
  bindQuit._last = null;
  if(typeof partyScore==='function') partyScore();
  // course : on avance d'une case ; si la ligne d'arrivée est franchie, l'écran de victoire s'affiche
  if(typeof partyAfterWin==='function' && partyAfterWin()) return;
  const c = CHARACTERS[currentChar] || CHARACTERS.sirene;
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
    <div class="reward-box">
      <span class="big-emoji">${levelUp ? '🌟' : '🎉'}</span>
      <h2>${levelUp ? `Niveau ${level()} !` : praise}</h2>
      <div class="speech" style="display:flex; align-items:center; justify-content:center; gap:10px;">
        <span style="font-size:2rem;">${it.emoji}</span>
        <span>${c.name} t'offre : <strong>${it.name}</strong></span>
      </div>
      ${bonus ? `<div class="speech" style="display:flex; align-items:center; justify-content:center; gap:10px; background:#FFF9E8;">
        <span style="font-size:2rem;">${ITEMS[bonus].emoji}</span>
        <span>Surprise ! <strong>${ITEMS[bonus].name}</strong> en plus ✨</span>
      </div>` : ''}
    </div>
    <button class="btn-primary" id="btn-yay">${(typeof party!=='undefined' && party.active) ? 'Au joueur suivant 👉' : 'Super !'}</button>
    ${(typeof party!=='undefined' && party.active) ? '' : '<button class="btn-ghost" id="btn-again">Encore une mission 🎮</button>'}
  `);
  document.getElementById('btn-yay').onclick = ()=> {
    playSound('tap'); closeModal(); renderLagon();
    // multijoueur : la main passe au joueur suivant après une réussite
    if(typeof party!=='undefined' && party.active){ passTurn('next'); return; }
    setTimeout(checkNewIsland, 250);   // nouvelle île débloquée ?
  };
  const againBtn = document.getElementById('btn-again');
  if(againBtn) againBtn.onclick = ()=> { playSound('tap'); renderLagon(); startMinigame(); };
}

/* Jeu 1 : mémoire */
function renderMemory(){
  const dd = gameDiff();
  const pairs = dd===1 ? 3 : (dd===2 ? 4 : (dd===3 ? 5 : 6));
  const pool = shuffle(Object.values(ALL_ITEMS).map(i=>i.emoji)).slice(0,pairs);
  const cards = shuffle([...pool, ...pool]).map((e,i)=>({id:i, emoji:e, flipped:false, matched:false}));
  let first=null, lock=false;
  const cols3 = pairs===3;

  function render(){
    openModal(`
      ${gameHeader('🧠 Jeu de mémoire','Retrouve les paires identiques')}
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
          if(isMatch){
            first.matched = true; second.matched = true;
            playSound('good');
          } else {
            first.flipped = false; second.flipped = false;
            playSound('wrong');
          }
          first = null; lock = false;
          render();
          if(cards.every(c=>c.matched)) setTimeout(onMissionWin, 300);
        }, isMatch ? 350 : 700);
      };
    });
  }
  render();
}

/* Jeu 2 : compter */
function renderCount(){
  const emoji = pickRandom(['⭐','🐚','🌸','🦪','🐠','🦋']);
  const dd = gameDiff();
  const min = dd>=3 ? 4 : 3, max = Math.min(12, 5 + dd*2); // île 1 : 3–7 … île 4 : 4–12
  const n = min + Math.floor(Math.random()*(max-min+1));
  let options = new Set([n]);
  while(options.size<3){ options.add(Math.max(1, n + (Math.floor(Math.random()*5)-2))); }
  options = shuffle([...options]);

  openModal(`
    ${gameHeader('🔢 Compte avec moi', `Combien y a-t-il de ${emoji} ?`, `Combien y a-t-il de ${emojiWord(emoji,true)} ?`)}
    <div class="count-row">${Array(n).fill(emoji).map(e=>`<span>${e}</span>`).join('')}</div>
    <div class="num-options">
      ${options.map(o=>`<button class="num-btn" data-v="${o}">${o}</button>`).join('')}
    </div>
  `);
  bindQuit();
  document.querySelectorAll('.num-btn').forEach(btn=>{
    btn.onclick = ()=>{
      if(Number(btn.dataset.v)===n) onMissionWin();
      else wrongFeedback(btn);
    };
  });
}

/* Jeu 3 : trouver l'intrus */
function renderDiff(){
  const dd = gameDiff();
  const total = dd>=4 ? 12 : (dd===3 ? 9 : (dd===2 ? 8 : 6));
  // emojis qui se voient bien à l'envers (pas symétriques)
  const MIRRORABLE = ['🐠','🦋','🐌','🦄','🐬','🦊','🐿️','🦉','🦌','🦔','🐟','🎩'];
  // niveaux élevés : l'intrus ressemble un peu plus aux autres
  const sets = dd>=2
    ? [['🐚','🐌'],['🌸','🌺'],['⭐','🌟'],['🦋','🐝'],['🎀','🎁'],['🐠','🐟'],['🍄','🌰'],['🍀','🌿']]
    : [['🐚','🦄'],['🦋','💎'],['🌸','🍓'],['⭐','🌙'],['🎀','🧜‍♀️'],['🍄','🦊']];

  // 1 fois sur 3 (dès le niveau 2) : même image, mais retournée
  const mirrorMode = dd>=2 && Math.random() < (dd>=3 ? 0.5 : 0.35);
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
    <div class="diff-row">
      ${items.map((e,i)=>{
        const isOdd = mirrorMode ? (i===oddPos) : (e===odd);
        return `<button type="button" class="diff-item ${mirrorMode && isOdd ? 'mirror':''}" data-odd="${isOdd}" aria-label="Image ${i+1}">${e}</button>`;
      }).join('')}
    </div>
  `);
  bindQuit();
  document.querySelectorAll('.diff-item').forEach(el=>{
    el.onclick = ()=>{
      if(el.dataset.odd==='true') onMissionWin();
      else wrongFeedback(el);
    };
  });
}

/* Jeu 6 : mémoire de séquence (Simon) */
function renderSimon(){
  const PADS = [
    {k:'a', emoji:'🟡', freq:392, name:'jaune'},
    {k:'b', emoji:'🔵', freq:523, name:'bleu'},
    {k:'c', emoji:'🟢', freq:659, name:'vert'},
    {k:'d', emoji:'🔴', freq:784, name:'rouge'},
  ];
  const len = Math.min(7, 2 + gameDiff()); // île 1 : 3 … île 4 : 6
  const seq = Array.from({length:len},()=>pickRandom(PADS));
  let pos = 0, playing = true;

  openModal(`
    ${gameHeader('🎵 Répète après moi', 'Regarde bien les couleurs, puis touche-les dans le même ordre')}
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
        if(pos===seq.length) setTimeout(onMissionWin, 350);
      } else {
        vibrate(80); shakeEl(btn);
        setTimeout(()=>{ if(state.sound){ try{ tone(180, 0, .18, 'square', .07); }catch(e){} } }, 230);
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

/* Jeu 5 : suite logique */
function renderSequence(){
  const symbols = shuffle(['🐚','⭐','🌸','🎀','💎','🦋','🐠']).slice(0,3);
  const [A,B,C] = symbols;
  const dd = gameDiff();
  const patterns = dd===1
    ? [[A,B]]
    : dd===2 ? [[A,B],[A,A,B],[A,B,C]]
    : dd===3 ? [[A,B,B],[A,A,B],[A,B,C]]
    : [[A,B,C],[A,B,A,C],[A,A,B,C],[A,B,B,C]];
  const pattern = pickRandom(patterns);
  const shown = pattern.length===2 ? 5 : (pattern.length===3 ? 6 : 7);
  const seq = Array.from({length:shown},(_,i)=>pattern[i%pattern.length]);
  const answer = pattern[shown%pattern.length];
  const options = shuffle([...new Set([answer, ...symbols])]).slice(0,3);
  if(!options.includes(answer)) options[0] = answer;

  openModal(`
    ${gameHeader('🔮 La suite magique', 'Regarde bien… quelle image vient après ?')}
    <div class="seq-row">
      ${seq.map(e=>`<span>${e}</span>`).join('')}
      <span class="q">?</span>
    </div>
    <div class="seq-options">
      ${shuffle(options).map(o=>`<button class="seq-btn" data-v="${o}">${o}</button>`).join('')}
    </div>
  `);
  bindQuit();
  document.querySelectorAll('.seq-btn').forEach(btn=>{
    btn.onclick = ()=>{
      if(btn.dataset.v===answer){
        document.querySelector('.seq-row .q').textContent = answer;
        document.querySelector('.seq-row .q').style.border='none';
        setTimeout(onMissionWin, 350);
      } else wrongFeedback(btn);
    };
  });
}

/* Jeu 4 : puzzle (remettre les nombres dans l'ordre) */
function renderPuzzle(){
  const dd = gameDiff();
  const count = Math.min(9, 3 + dd); // île 1 : 4 … île 4 : 7
  const lvl = dd;

  // variantes : à partir de 1, à partir d'un autre nombre, de 2 en 2, ou à l'envers
  const variants = ['from1'];
  if(lvl>=1) variants.push('start');            // ex. 6 → 9
  if(lvl>=2) variants.push('start','desc');     // à l'envers : 7 → 4
  if(lvl>=3) variants.push('step2');            // de 2 en 2 : 2, 4, 6, 8
  const variant = pickRandom(variants);

  let seq, hint;
  if(variant==='from1'){
    seq = Array.from({length:count},(_,i)=>i+1);
    hint = `Touche les nombres dans l'ordre : 1 → ${count}`;
  } else if(variant==='start'){
    const maxStart = lvl>=3 ? 12 : 8;
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
        playSound('good');
        idx++;
        document.querySelectorAll('.game-progress i').forEach((d,i)=>d.classList.toggle('on', i<idx));
        if(idx===seq.length) setTimeout(onMissionWin, 300);
      } else {
        wrongFeedback(btn);
      }
    };
  });
}

