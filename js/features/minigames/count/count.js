/* Jeu 2 : compter (dénombrement — voir js/entities/difficulty/difficulty.js § countRange) */
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
  setSolution([solSel('.num-btn','v',n)]);
  document.querySelectorAll('.num-btn').forEach(btn=>{
    btn.onclick = ()=>{
      if(Number(btn.dataset.v)===n){ clearActiveTimer(); stepOk(btn); flashModal('ok'); setTimeout(onMissionWin, 350); }
      else loseLife(btn, { onRetry: renderCount });
    };
  });
}

// inscription auprès du moteur de mini-jeux (js/features/minigame-engine)
registerGame('count', renderCount);
