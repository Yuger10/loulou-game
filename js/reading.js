/* ---------- Mini-jeu : Lecture magique (niveau GS-CE1) ----------
   Association image <-> mot écrit, pour s'entraîner à lire des mots
   simples. Plus le palier est élevé, plus on retire les indices
   visuels (ça force à vraiment lire, pas juste reconnaître l'image).
   Seuils centralisés dans js/difficulty.js (readingWordOnly/Options). */

function pickDistractors(pool, correct, count){
  const others = pool.filter(w=>w.word!==correct.word);
  return shuffle(others).slice(0, count);
}

function renderReading(){
  setupLives('reading');
  const dd = gameDiff();
  const pool = WORDS_CP;
  const correct = pickRandom(pool);

  // paliers 1-2 : on voit l'image, on choisit le mot écrit (association)
  // paliers 3-5 : on ne voit QUE le mot, il faut le lire pour trouver l'image
  const wordToImage = readingWordOnly(dd);
  const nOptions = readingOptions(dd);
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
  } else {
    openModal(`
      ${gameHeader('📖 Lecture magique', 'Quel mot va avec cette image ?', 'Quel mot va avec cette image ?')}
      ${livesBar()}
      <div class="reading-image-box"><span class="reading-image">${correct.emoji}</span></div>
      <div class="reading-options reading-options-words">
        ${options.map(o=>`<button type="button" class="reading-opt reading-word-btn" data-w="${o.word}">${o.word}</button>`).join('')}
      </div>
    `);
  }
  bindQuit();
  startTimerIfNeeded('reading');
  setSolution([solSel('.reading-opt','w',correct.word)]);
  document.querySelectorAll('.reading-opt').forEach(btn=>{
    btn.onclick = ()=>{
      if(btn.dataset.w===correct.word){ clearActiveTimer(); stepOk(btn); flashModal('ok'); setTimeout(onMissionWin, 350); }
      else loseLife(btn, { onRetry: renderReading });
    };
  });
}
