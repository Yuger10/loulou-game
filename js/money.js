/* ---------- Mini-jeu : La monnaie magique (niveau CP-CE1) ----------
   Composer une somme avec des pièces de différentes valeurs : retrouver
   la pile de pièces qui vaut exactement le prix demandé. Prépare au
   calcul de la monnaie (compter, additionner des valeurs différentes). */

function moneyDenoms(){
  const dd = gameDiff();
  if(dd<=1) return [1,2];
  if(dd===2) return [1,2,5];
  if(dd===3) return [1,2,5,10];
  return [1,2,5,10,20];
}

// construit une pile de pièces au hasard (3 à 4 pièces) et renvoie sa valeur
function randomPile(denoms, size){
  const pile = [];
  for(let i=0;i<size;i++) pile.push(pickRandom(denoms));
  const total = pile.reduce((s,v)=>s+v, 0);
  return { pile: pile.sort((a,b)=>b-a), total };
}

function renderMoney(){
  setupLives('money');
  const denoms = moneyDenoms();
  const size = 2 + Math.floor(Math.random()*2);     // 2 ou 3 pièces dans la bonne pile
  const correct = randomPile(denoms, size);
  const target = correct.total;
  const item = pickRandom(['🍭','🧸','🎈','🍦','⚽','🎁','🪁','🍪']);

  const options = [correct];
  let tries = 0;
  while(options.length < 3 && tries < 30){
    tries++;
    const p = randomPile(denoms, 2 + Math.floor(Math.random()*2));
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
  document.querySelectorAll('.money-pile-btn').forEach(btn=>{
    btn.onclick = ()=>{
      if(Number(btn.dataset.v)===target){ stepOk(btn); flashModal('ok'); setTimeout(onMissionWin, 350); }
      else loseLife(btn);
    };
  });
}
