/* ---------- Mini-jeu : Jours, mois, saisons (« explorer le monde ») ----------
   Deux familles d'exercices, voir js/entities/difficulty/difficulty.js (calendarUsesWeekdayOrder) :
   - reconnaître une saison à partir d'une petite scène (dès la petite
     section, aucune lecture nécessaire) ;
   - remettre les jours de la semaine dans l'ordre (demande de lire des
     mots, réservé à partir du CP confirmé).
   Pas de minuteur sur ce jeu (voir NO_TIMER_KINDS dans difficulty.js). */

// tip : ce que montre la scène, sans dire la saison (indice 2, v52)
const SEASONS = [
  { name:'printemps', scene:'🌷🐣🌦️', tip:'Les fleurs poussent et les petits animaux naissent.' },
  { name:'été',       scene:'☀️🏖️🍉', tip:'Il fait très chaud, on va à la plage et on mange des fruits bien frais.' },
  { name:'automne',   scene:'🍂🎃🌧️', tip:'Les feuilles tombent des arbres, et il pleut souvent.' },
  { name:'hiver',     scene:'⛄❄️🧣', tip:'Il fait très froid, il peut neiger : on met une écharpe.' },
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
  setSolution([solSel('.season-btn','v',correct.name)]);
  setHintQuestion('calendar', { kind:'season', correct }, { choices:'.season-btn' });
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
  const q = { kind:'week', seq, idx:0 };   // q.idx : où en est l'enfant (pour les indices)

  openModal(`
    ${gameHeader('📅 Les jours de la semaine', `Touche les jours dans l'ordre : ${seq[0]} → ${seq[seq.length-1]}`)}
    ${livesBar()}
    ${progressDots(0, seq.length)}
    <div class="weekday-row">
      ${nums.map(w=>`<button type="button" class="weekday-btn" data-w="${w}">${w}</button>`).join('')}
    </div>
  `);
  bindQuit();
  setSolution(seq.map(w=>solSel('.weekday-btn','w',w)));
  setHintQuestion('calendar', q, { choices:'.weekday-btn' });
  document.querySelectorAll('.weekday-btn').forEach(btn=>{
    btn.onclick = ()=>{
      const w = btn.dataset.w;
      if(btn.classList.contains('done')) return;
      if(w===seq[q.idx]){
        btn.classList.add('done');
        stepOk(btn);
        q.idx++;
        document.querySelectorAll('.game-progress i').forEach((d,i)=>d.classList.toggle('on', i<q.idx));
        if(q.idx===seq.length){ flashModal('ok'); setTimeout(onMissionWin, 350); }
      } else {
        loseLife(btn, {disable:false});
      }
    };
  });
}

// Indices (v52). Saisons : 1. chaud ou froid ? que font les plantes ? ;
// 2. ce que montre la scène. Jours : 1. réciter la comptine des jours ;
// 2. le chemin déjà fait, avec un « ? » pour le jour suivant.
function calendarHints(q){
  if(q.kind === 'season') return [
    { say:'Regarde les images : fait-il chaud ou froid ? Que font les plantes et les animaux ?', fx:{ glow:'.season-scene' } },
    { say:q.correct.tip, fx:{ glow:'.season-scene' } },
  ];
  const done = q.seq.slice(0, q.idx);
  return [
    { say: done.length ? `Récite les jours dans ta tête : quel jour vient après ${done[done.length - 1]} ?` : 'Récite la comptine des jours dans ta tête, depuis lundi : lequel arrive en premier ?', fx:{ glow:'.weekday-row' } },
    hintOrderStep(done, 'Voici le chemin déjà fait. Quel jour vient ensuite ?'),
  ];
}

// inscription auprès du moteur de mini-jeux (js/features/minigame-engine)
registerGame('calendar', renderCalendar);
registerHints('calendar', calendarHints);
