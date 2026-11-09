/* Jeu 5 : suite logique (notion de « suite organisée », cycle 1 puis
   algorithme simple en cycle 2 — voir js/entities/difficulty/difficulty.js § sequence*) */
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
  setSolution([solSel('.seq-btn','v',answer)]);
  document.querySelectorAll('.seq-btn').forEach(btn=>{
    btn.onclick = ()=>{
      if(btn.dataset.v===answer){
        clearActiveTimer();
        const q = document.querySelector('.seq-row .q');
        q.textContent = answer; q.style.border='none'; q.classList.add('filled');
        stepOk(btn); flashModal('ok');
        setTimeout(onMissionWin, 420);
      } else loseLife(btn, { onRetry: renderSequence });
    };
  });
}

// inscription auprès du moteur de mini-jeux (js/features/minigame-engine)
registerGame('sequence', renderSequence);
