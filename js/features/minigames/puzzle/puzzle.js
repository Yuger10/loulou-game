/* Jeu 4 : puzzle des nombres (remettre une suite dans l'ordre). Pas de
   minuteur : tâche à plusieurs clics successifs (voir js/entities/difficulty/difficulty.js
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
  setSolution(seq.map(n=>solSel('.puzzle-btn','n',n)));
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

// inscription auprès du moteur de mini-jeux (js/features/minigame-engine)
registerGame('puzzle', renderPuzzle);
