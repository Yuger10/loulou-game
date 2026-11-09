/* ---------- Mini-jeu : Comparer les nombres (CP-CE2) ----------
   Choisir le bon signe < / > / = entre deux nombres. Programme CP :
   comparaison et rangement des nombres, introduction des symboles
   mathématiques. Bornes dans js/difficulty.js (compareRange).
   Correctif pédagogique : à partir du palier 3, une partie des manches
   force des nombres PROCHES (compareCloseChance) — sinon l'exercice
   peut rester trivial même au palier maximal (comparer 3 et 97 ne
   demande aucune réflexion sur l'ordre de grandeur réel). */

function renderCompare(){
  setupLives('compare');
  const dd = gameDiff();
  const max = compareRange(dd);
  let a = 1 + Math.floor(Math.random()*max);
  let b;
  if(Math.random() < compareCloseChance(dd)){
    // nombre voisin de a (écart de 1 à 5), toujours dans les bornes
    const delta = 1 + Math.floor(Math.random()*5);
    b = Math.random()<0.5 ? Math.max(1, a-delta) : Math.min(max, a+delta);
  } else {
    b = 1 + Math.floor(Math.random()*max);
  }
  if(Math.random() < compareEqualChance(dd)) b = a;     // teste aussi l'égalité
  const answer = a<b ? '<' : (a>b ? '>' : '=');
  const options = shuffle(['<','>','=']);

  openModal(`
    ${gameHeader('⚖️ Compare les nombres', 'Quel est le bon signe ?', `Quel est le bon signe entre ${a} et ${b} ?`)}
    ${livesBar()}
    <div class="cmp-equation">
      <span class="cmp-num">${a}</span>
      <span class="cmp-q">?</span>
      <span class="cmp-num">${b}</span>
    </div>
    <div class="cmp-options">
      ${options.map(o=>`<button type="button" class="cmp-btn" data-v="${o}">${o}</button>`).join('')}
    </div>
  `);
  bindQuit();
  startTimerIfNeeded('compare');
  setSolution([solSel('.cmp-btn','v',answer)]);
  document.querySelectorAll('.cmp-btn').forEach(btn=>{
    btn.onclick = ()=>{
      if(btn.dataset.v===answer){
        clearActiveTimer();
        const q = document.querySelector('.cmp-q');
        if(q){ q.textContent = answer; q.classList.add('filled'); }
        stepOk(btn); flashModal('ok');
        setTimeout(onMissionWin, 350);
      } else {
        loseLife(btn, { onRetry: renderCompare });
      }
    };
  });
}
