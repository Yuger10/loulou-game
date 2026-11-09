/* Jeu 3 : trouver l'intrus (discrimination visuelle — voir
   js/entities/difficulty/difficulty.js § diffTotal / diffMirrorChance) */
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
  setSolution(['.diff-item[data-odd="true"]']);
  document.querySelectorAll('.diff-item').forEach(el=>{
    el.onclick = ()=>{
      if(el.dataset.odd==='true'){ clearActiveTimer(); stepOk(el); flashModal('ok'); setTimeout(onMissionWin, 350); }
      else loseLife(el, { onRetry: renderDiff });
    };
  });
}

// inscription auprès du moteur de mini-jeux (js/features/minigame-engine)
registerGame('diff', renderDiff);
