/* Jeu 1 : mémoire (pas de minuteur : tâche à plusieurs étapes, voir
   js/entities/difficulty/difficulty.js § « MINUTEUR » pour la justification). */
function renderMemory(){
  setupLives('memory');
  const dd = gameDiff();
  const pairs = memoryPairs(dd);
  const pool = shuffle(Object.values(ALL_ITEMS).map(i=>i.emoji)).slice(0,pairs);
  const cards = shuffle([...pool, ...pool]).map((e,i)=>({id:i, emoji:e, flipped:false, matched:false}));
  let first=null, lock=false;
  const cols3 = pairs===3;
  // tests : les paires, deux cartes à la fois
  { const by = {}; cards.forEach(c=> (by[c.emoji] = by[c.emoji] || []).push(c.id)); setSolution(Object.values(by).flat().map(id=>solSel('.mcard','id',id))); }

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

// inscription auprès du moteur de mini-jeux (js/features/minigame-engine)
registerGame('memory', renderMemory);
