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
  const q = { seq, idx:0, variant };   // q.idx : où en est l'enfant (pour les indices)
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
  setHintQuestion('puzzle', q, { choices:'.puzzle-btn' });
  document.querySelectorAll('.puzzle-btn').forEach(btn=>{
    btn.onclick = ()=>{
      const n = Number(btn.dataset.n);
      if(btn.classList.contains('done')) return;
      if(n===seq[q.idx]){
        btn.classList.add('done');
        stepOk(btn);
        q.idx++;
        document.querySelectorAll('.game-progress i').forEach((d,i)=>d.classList.toggle('on', i<q.idx));
        if(q.idx===seq.length){ flashModal('ok'); setTimeout(onMissionWin, 350); }
      } else {
        loseLife(btn, {disable:false});   // le bon nombre reste cliquable ensuite
      }
    };
  });
}

// Indices (v52) : voir hintOrderStep (js/features/minigame-engine/hints.js).
function puzzleHints(q){
  const done = q.seq.slice(0, q.idx), last = done[done.length - 1];
  const desc = q.variant === 'desc', step2 = q.variant === 'step2';
  let say1;
  if(!done.length) say1 = desc ? 'Cherche d\'abord le plus grand nombre.' : 'Cherche d\'abord le plus petit nombre.';
  else if(step2) say1 = `On compte de 2 en 2 : après ${last}, saute un nombre.`;
  else say1 = desc ? `Quel nombre vient juste avant ${last} quand on compte ?` : `Quel nombre vient juste après ${last} quand on compte ?`;
  return [
    { say:say1, fx:{ glow:'.puzzle-row' } },
    hintOrderStep(done, done.length ? 'Voici le chemin déjà fait. Récite la suite dans ta tête : quel nombre vient ensuite ?' : 'Compare les nombres deux par deux, et garde à chaque fois le ' + (desc ? 'plus grand.' : 'plus petit.')),
  ];
}

// inscription auprès du moteur de mini-jeux (js/features/minigame-engine)
registerGame('puzzle', renderPuzzle);
registerHints('puzzle', puzzleHints);
