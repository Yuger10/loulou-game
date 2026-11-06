/* ---------- Mini-jeu : Les petits mots magiques (déterminants, niveau CP) ----------
   Choisir le bon déterminant (le/la/un/une) devant un nom, en fonction
   de son genre. Règle simple et sûre, du programme CP/CE1 français :
   - "le" / "un"  devant un nom masculin singulier
   - "la" / "une" devant un nom féminin singulier
   Plus l'île est difficile, moins il y a d'indice image (on doit
   connaître le mot, pas seulement reconnaître le dessin). */

function renderDeterminants(){
  setupLives('determinants');
  const dd = gameDiff();
  const defini = Math.random() < 0.5;             // "le/la" ou "un/une" ?
  const noun = pickRandom(WORDS_CP);
  const answer = defini
    ? (noun.gender==='m' ? 'le' : 'la')
    : (noun.gender==='m' ? 'un' : 'une');
  const otherOption = defini
    ? (noun.gender==='m' ? 'la' : 'le')
    : (noun.gender==='m' ? 'une' : 'un');

  // île 3-4 : un 3e intrus de l'autre famille, pour forcer à vraiment lire
  const extra = dd >= 3 ? (defini ? pickRandom(['un','une']) : pickRandom(['le','la'])) : null;
  const options = shuffle(extra ? [answer, otherOption, extra] : [answer, otherOption]);

  const showImage = dd <= 2;
  const title = defini ? '🔤 "le" ou "la" ?' : '🔤 "un" ou "une" ?';

  openModal(`
    ${gameHeader(title, `Quel petit mot va avec « ${noun.word} » ?`, `Quel petit mot va avec le mot ${noun.word} ?`)}
    ${livesBar()}
    <div class="det-box">
      ${showImage ? `<span class="det-emoji">${noun.emoji}</span>` : ''}
      <span class="det-noun">${noun.word}</span>
    </div>
    <div class="det-options">
      ${options.map(o=>`<button type="button" class="det-btn" data-v="${o}">${o}</button>`).join('')}
    </div>
  `);
  bindQuit();
  document.querySelectorAll('.det-btn').forEach(btn=>{
    btn.onclick = ()=>{
      if(btn.dataset.v===answer){ stepOk(btn); flashModal('ok'); setTimeout(onMissionWin, 350); }
      else loseLife(btn);
    };
  });
}
