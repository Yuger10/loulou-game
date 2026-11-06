/* ---------- Mini-jeu : Lecture magique (niveau CP) ----------
   Association image <-> mot écrit, pour s'entraîner à lire des mots
   simples. Plus l'île est difficile, plus on retire les indices visuels
   (ça force à vraiment lire, pas juste reconnaître l'image). */

function pickDistractors(pool, correct, count){
  const others = pool.filter(w=>w.word!==correct.word);
  return shuffle(others).slice(0, count);
}

function renderReading(){
  setupLives('reading');
  const dd = gameDiff();
  const pool = WORDS_CP;
  const correct = pickRandom(pool);

  // île 1-2 : on voit l'image, on choisit le mot écrit (association)
  // île 3-4 : on ne voit QUE le mot, il faut le lire pour trouver l'image
  const wordToImage = dd >= 3;
  const nOptions = dd >= 3 ? 4 : 3;
  const distractors = pickDistractors(pool, correct, nOptions - 1);
  const options = shuffle([correct, ...distractors]);

  if(wordToImage){
    openModal(`
      ${gameHeader('📖 Lecture magique', 'Lis bien le mot… puis touche la bonne image !', 'Lis bien le mot, puis touche la bonne image')}
      ${livesBar()}
      <div class="reading-word-box"><span class="reading-word">${correct.word}</span></div>
      <div class="reading-options">
        ${options.map(o=>`<button type="button" class="reading-opt" data-w="${o.word}" aria-label="${o.word}">${o.emoji}</button>`).join('')}
      </div>
    `);
    bindQuit();
    document.querySelectorAll('.reading-opt').forEach(btn=>{
      btn.onclick = ()=>{
        if(btn.dataset.w===correct.word){ stepOk(btn); flashModal('ok'); setTimeout(onMissionWin, 350); }
        else loseLife(btn);
      };
    });
  } else {
    openModal(`
      ${gameHeader('📖 Lecture magique', 'Quel mot va avec cette image ?', 'Quel mot va avec cette image ?')}
      ${livesBar()}
      <div class="reading-image-box"><span class="reading-image">${correct.emoji}</span></div>
      <div class="reading-options reading-options-words">
        ${options.map(o=>`<button type="button" class="reading-opt reading-word-btn" data-w="${o.word}">${o.word}</button>`).join('')}
      </div>
    `);
    bindQuit();
    document.querySelectorAll('.reading-opt').forEach(btn=>{
      btn.onclick = ()=>{
        if(btn.dataset.w===correct.word){ stepOk(btn); flashModal('ok'); setTimeout(onMissionWin, 350); }
        else loseLife(btn);
      };
    });
  }
}
