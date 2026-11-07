/* ---------- Mini-jeu : Comparer les nombres (niveau CP) ----------
   Choisir le bon signe < / > / = entre deux nombres. Programme CP :
   comparaison et rangement des nombres, introduction des symboles
   mathématiques. Les nombres grandissent avec la difficulté de l'île. */

function compareRange(){
  const dd = gameDiff();
  if(dd<=1) return 10;
  if(dd===2) return 20;
  if(dd===3) return 50;
  return 100;
}

function renderCompare(){
  setupLives('compare');
  const max = compareRange();
  let a = 1 + Math.floor(Math.random()*max);
  let b = 1 + Math.floor(Math.random()*max);
  if(Math.random() < 0.2) b = a;              // parfois une égalité, pour la tester aussi
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
  document.querySelectorAll('.cmp-btn').forEach(btn=>{
    btn.onclick = ()=>{
      if(btn.dataset.v===answer){
        const q = document.querySelector('.cmp-q');
        if(q){ q.textContent = answer; q.classList.add('filled'); }
        stepOk(btn); flashModal('ok');
        setTimeout(onMissionWin, 350);
      } else {
        loseLife(btn);
      }
    };
  });
}
