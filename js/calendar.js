/* ---------- Mini-jeu : Jours, mois, saisons (« explorer le monde ») ----------
   Deux familles d'exercices, voir js/difficulty.js (calendarUsesWeekdayOrder) :
   - reconnaître une saison à partir d'une petite scène (dès la petite
     section, aucune lecture nécessaire) ;
   - remettre les jours de la semaine dans l'ordre (demande de lire des
     mots, réservé à partir du CP confirmé).
   Pas de minuteur sur ce jeu (voir NO_TIMER_KINDS dans difficulty.js). */

const SEASONS = [
  { name:'printemps', scene:'🌷🐣🌦️' },
  { name:'été',       scene:'☀️🏖️🍉' },
  { name:'automne',   scene:'🍂🎃🌧️' },
  { name:'hiver',     scene:'⛄❄️🧣' },
];
const WEEKDAYS = ['lundi','mardi','mercredi','jeudi','vendredi','samedi','dimanche'];

function renderCalendar(){
  setupLives('calendar');
  const dd = gameDiff();
  if(calendarUsesWeekdayOrder(dd) && Math.random() < 0.6) renderWeekdayOrder(dd);
  else renderSeasonGuess();
}

// Dès la petite section : associer une scène illustrée à sa saison.
// Seulement 3 options : sans précaution, une erreur laisserait deviner
// la bonne réponse PAR ÉLIMINATION (observé en situation réelle). Une
// erreur relance donc une NOUVELLE scène, jamais la même à éliminer —
// et les 3 noms proposés sont annoncés à voix haute (sans révéler
// lequel est juste), pour relier le mot entendu à l'image vue.
function renderSeasonGuess(){
  const correct = pickRandom(SEASONS);
  const options = shuffle(SEASONS).slice(0,3);
  if(!options.includes(correct)) options[0] = correct;
  const shown = shuffle(options);

  openModal(`
    ${gameHeader('📅 Quelle saison ?', "Regarde l'image… à quelle saison ça correspond ?", "Regarde l'image, à quelle saison ça correspond ?")}
    ${livesBar()}
    <div class="season-scene">${correct.scene}</div>
    <div class="season-options">
      ${shown.map(o=>`<button type="button" class="season-btn" data-v="${o.name}">${o.name}</button>`).join('')}
    </div>
  `);
  bindQuit();
  // annonce les 3 mots proposés (vocabulaire), un peu après la consigne
  setTimeout(()=> speak(shown.map(o=>o.name).join(', ')), 1600);
  document.querySelectorAll('.season-btn').forEach(btn=>{
    btn.onclick = ()=>{
      if(btn.dataset.v===correct.name){ stepOk(btn); flashModal('ok'); setTimeout(onMissionWin, 350); }
      else loseLife(btn, { onRetry: renderSeasonGuess });
    };
  });
}

// À partir du CP confirmé : remettre les jours de la semaine dans l'ordre
// (même interaction que le puzzle des nombres, avec des mots à la place).
function renderWeekdayOrder(dd){
  const count = calendarWeekdayCount(dd);
  const startIdx = Math.floor(Math.random()*(7-count+1));
  const seq = WEEKDAYS.slice(startIdx, startIdx+count);
  const nums = shuffle(seq.slice());
  let idx = 0;

  openModal(`
    ${gameHeader('📅 Les jours de la semaine', `Touche les jours dans l'ordre : ${seq[0]} → ${seq[seq.length-1]}`)}
    ${livesBar()}
    ${progressDots(0, seq.length)}
    <div class="weekday-row">
      ${nums.map(w=>`<button type="button" class="weekday-btn" data-w="${w}">${w}</button>`).join('')}
    </div>
  `);
  bindQuit();
  document.querySelectorAll('.weekday-btn').forEach(btn=>{
    btn.onclick = ()=>{
      const w = btn.dataset.w;
      if(btn.classList.contains('done')) return;
      if(w===seq[idx]){
        btn.classList.add('done');
        stepOk(btn);
        idx++;
        document.querySelectorAll('.game-progress i').forEach((d,i)=>d.classList.toggle('on', i<idx));
        if(idx===seq.length){ flashModal('ok'); setTimeout(onMissionWin, 350); }
      } else {
        loseLife(btn, {disable:false});
      }
    };
  });
}
