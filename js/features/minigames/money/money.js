/* ---------- Mini-jeu : La monnaie magique (CP-CE2) ----------
   Composer une somme avec des pièces de différentes valeurs : retrouver
   la pile de pièces qui vaut exactement le prix demandé. Prépare au
   calcul de la monnaie (compter, additionner des valeurs différentes).
   Valeurs et nombre de pièces centralisés dans js/entities/difficulty/difficulty.js
   (moneyDenoms / moneyPileSize) : plus de pièces = plus de termes à
   additionner mentalement, indépendamment des valeurs elles-mêmes. */

// construit une pile de pièces au hasard et renvoie sa valeur
function randomPile(denoms, size){
  const pile = [];
  for(let i=0;i<size;i++) pile.push(pickRandom(denoms));
  const total = pile.reduce((s,v)=>s+v, 0);
  return { pile: pile.sort((a,b)=>b-a), total };
}

function renderMoney(){
  setupLives('money');
  const dd = gameDiff();
  const denoms = moneyDenoms(dd);
  const { min, max } = moneyPileSize(dd);
  const size = min + Math.floor(Math.random()*(max-min+1));
  const correct = randomPile(denoms, size);
  const target = correct.total;
  const item = pickRandom(['🍭','🧸','🎈','🍦','⚽','🎁','🪁','🍪']);

  const options = [correct];
  let tries = 0;
  while(options.length < 3 && tries < 30){
    tries++;
    const p = randomPile(denoms, min + Math.floor(Math.random()*(max-min+1)));
    if(p.total !== target) options.push(p);
  }
  // au cas où (petites valeurs) on n'a pas trouvé 2 distracteurs différents
  while(options.length < 3){
    options.push({ pile:[pickRandom(denoms)], total: target + options.length });
  }
  const shuffled = shuffle(options);

  openModal(`
    ${gameHeader('💰 La monnaie magique', `Quelle pile de pièces vaut ${target} ?`, `Quelle pile de pièces vaut ${target} ?`)}
    ${livesBar()}
    <div class="money-target"><span class="money-item">${item}</span><span class="money-price">${target} 🪙</span></div>
    <div class="money-options">
      ${shuffled.map(o=>`<button type="button" class="money-pile-btn" data-v="${o.total}">
        ${o.pile.map(v=>`<span class="coin-chip">${v}</span>`).join('')}
      </button>`).join('')}
    </div>
  `);
  bindQuit();
  startTimerIfNeeded('money');
  setSolution([solSel('.money-pile-btn','v',target)]);
  document.querySelectorAll('.money-pile-btn').forEach(btn=>{
    btn.onclick = ()=>{
      if(Number(btn.dataset.v)===target){ clearActiveTimer(); stepOk(btn); flashModal('ok'); setTimeout(onMissionWin, 350); }
      else loseLife(btn, { onRetry: renderMoney });
    };
  });
}

// inscription auprès du moteur de mini-jeux (js/features/minigame-engine)
registerGame('money', renderMoney);
