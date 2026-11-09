/* ---------- Mini-jeu : Calcul mental (CE1-CE2, Volcan des Génies) ----------
   Seul jeu du Lagon Magique à aller jusqu'au palier 6. Calcul SANS
   AUCUN support imagé (à la différence du jeu « Opérations ») : addition,
   soustraction, et à partir du palier 5, multiplication (tables de 2, 5,
   10) et expressions à 3 termes. Bornes dans js/entities/difficulty/difficulty.js (calcBounds). */

function makeCalcProblem(dd){
  const { max, terms, allowMinus, allowMulti } = calcBounds(dd);
  const useMulti = allowMulti && Math.random() < 0.3;

  if(useMulti){
    const table = pickRandom(CALC_MULT_TABLES);
    const factor = 1 + Math.floor(Math.random()*10);
    const a = table, b = factor;
    return { text:`${a} × ${b}`, result: a*b };
  }

  // construit une expression à 2 ou 3 termes, toujours positive à chaque étape
  const nTerms = terms>=3 && Math.random()<0.5 ? 3 : 2;
  let value = 1 + Math.floor(Math.random()*Math.floor(max/2));
  let text = `${value}`;
  for(let i=1;i<nTerms;i++){
    const isMinus = allowMinus && Math.random()<0.5 && value>1;
    if(isMinus){
      const b = 1 + Math.floor(Math.random()*Math.min(value-1, max));
      value -= b;
      text += ` − ${b}`;
    } else {
      const room = Math.max(1, max - value);
      const b = 1 + Math.floor(Math.random()*Math.min(room, max));
      value += b;
      text += ` + ${b}`;
    }
  }
  return { text, result: value };
}

function renderCalc(){
  setupLives('calc');
  const dd = gameDiff();
  const { text, result } = makeCalcProblem(dd);

  let options = new Set([result]);
  while(options.size<3){
    const delta = Math.floor(Math.random()*7)-3;
    options.add(Math.max(0, result + (delta===0 ? 1 : delta)));
  }
  options = shuffle([...options]);

  openModal(`
    ${gameHeader('🌋 Calcul mental', `${text} = ?`, `Combien ça fait, ${text.replace('×','fois').replace('−','moins').replace('+','plus')} ?`)}
    ${livesBar()}
    <div class="calc-equation">
      <span class="calc-expr">${text}</span>
      <span class="calc-op">=</span>
      <span class="eq-q">?</span>
    </div>
    <div class="num-options">
      ${options.map(o=>`<button class="num-btn" data-v="${o}">${o}</button>`).join('')}
    </div>
  `);
  bindQuit();
  startTimerIfNeeded('calc');
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
        loseLife(btn, { onRetry: renderCalc });
      }
    };
  });
}

// inscription auprès du moteur de mini-jeux (js/features/minigame-engine)
registerGame('calc', renderCalc);
