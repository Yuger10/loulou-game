/* ---------- Mini-jeu : Opérations magiques (niveau CP-CE2) ----------
   Additions et soustractions illustrées avec des emojis, pour
   apprendre le calcul sans se noyer dans les chiffres.
   Les bornes (mathBounds) sont centralisées et documentées dans
   js/entities/difficulty/difficulty.js — voir aussi ANALYSE-DIFFICULTE.md. */

const MATH_EMOJIS = ['⭐','🐚','🌸','🦪','🐠','🦋','🍎','🎈'];

function makeMathProblem(){
  const { max, allowMinus } = mathBounds(gameDiff());
  const isMinus = allowMinus && Math.random()<0.5;
  let a, b, result, op;
  if(isMinus){
    a = 2 + Math.floor(Math.random()*(max-1));      // a entre 2 et max
    b = 1 + Math.floor(Math.random()*(a-1));          // b < a : jamais de résultat négatif
    result = a - b;
    op = '−';
  } else {
    const half = Math.max(1, Math.floor(max/2));
    a = 1 + Math.floor(Math.random()*half);
    b = 1 + Math.floor(Math.random()*(max-a));
    result = a + b;
    op = '+';
  }
  return { a, b, op, result };
}

function renderMath(){
  setupLives('math');
  const emoji = pickRandom(MATH_EMOJIS);
  const { a, b, op, result } = makeMathProblem();

  let options = new Set([result]);
  while(options.size<3){
    const delta = Math.floor(Math.random()*5)-2;
    const cand = Math.max(0, result + (delta===0 ? 1 : delta));
    options.add(cand);
  }
  options = shuffle([...options]);

  const spoken = op==='+'
    ? `Combien ça fait, ${a} plus ${b} ?`
    : `Combien ça fait, ${a} moins ${b} ?`;

  openModal(`
    ${gameHeader('➕ Opérations magiques', `${a} ${op} ${b} = ?`, spoken)}
    ${livesBar()}
    <div class="math-illustration">
      <div class="math-group">${Array(a).fill(emoji).map(e=>`<span>${e}</span>`).join('')}</div>
      <span class="math-op">${op}</span>
      <div class="math-group">${Array(b).fill(emoji).map(e=>`<span>${e}</span>`).join('')}</div>
    </div>
    <div class="math-equation">
      <span class="eq-num">${a}</span>
      <span class="eq-op">${op}</span>
      <span class="eq-num">${b}</span>
      <span class="eq-op">=</span>
      <span class="eq-q">?</span>
    </div>
    <div class="num-options">
      ${options.map(o=>`<button class="num-btn" data-v="${o}">${o}</button>`).join('')}
    </div>
  `);
  bindQuit();
  startTimerIfNeeded('math');
  setSolution([solSel('.num-btn','v',result)]);
  document.querySelectorAll('.num-btn').forEach(btn=>{
    btn.onclick = ()=>{
      if(Number(btn.dataset.v)===result){
        clearActiveTimer();
        const q = document.querySelector('.eq-q');
        if(q){ q.textContent = result; q.classList.add('filled'); }
        stepOk(btn); flashModal('ok');
        setTimeout(onMissionWin, 420);
      } else {
        loseLife(btn, { onRetry: renderMath });
      }
    };
  });
}

// inscription auprès du moteur de mini-jeux (js/features/minigame-engine)
registerGame('math', renderMath);
