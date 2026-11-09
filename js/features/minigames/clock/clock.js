/* ---------- Mini-jeu : Quelle heure est-il ? (grandeurs & mesures, CP-CE1) ----------
   Lire l'heure sur une horloge à aiguilles. Granularité centralisée
   dans js/difficulty.js (clockGranularity) : heures pleines d'abord,
   puis demi-heures, puis quarts d'heure. Horloge dessinée en CSS pur
   (pas d'image), les aiguilles sont deux barres tournées en degrés. */

function clockAngles(hour, minute){
  // aiguille des heures : 30° par heure + un peu selon les minutes
  const hourAngle = ((hour % 12) + minute/60) * 30;
  const minuteAngle = minute * 6;
  return { hourAngle, minuteAngle };
}

function clockFaceHtml(hour, minute){
  const { hourAngle, minuteAngle } = clockAngles(hour, minute);
  const ticks = Array.from({length:12},(_,i)=>{
    const a = i*30;
    return `<i class="clock-tick" style="transform:rotate(${a}deg)"></i>`;
  }).join('');
  return `
    <div class="clock-face">
      ${ticks}
      <b class="clock-hand clock-hand-h" style="transform:rotate(${hourAngle}deg)"></b>
      <b class="clock-hand clock-hand-m" style="transform:rotate(${minuteAngle}deg)"></b>
      <span class="clock-center"></span>
    </div>`;
}

function timeLabel(hour, minute){
  const h = hour===0 ? 12 : hour;
  if(minute===0) return `${h} h`;
  if(minute===30) return `${h} h 30`;
  if(minute===15) return `${h} h 15`;
  return `${h} h 45`;
}

function renderClock(){
  setupLives('clock');
  const dd = gameDiff();
  const minutes = clockGranularity(dd);
  const hour = 1 + Math.floor(Math.random()*12);
  const minute = pickRandom(minutes);
  const answer = timeLabel(hour, minute);

  const nOptions = clockOptions(dd);
  const options = new Set([answer]);
  while(options.size < nOptions){
    const h2 = 1 + Math.floor(Math.random()*12);
    const m2 = pickRandom(minutes);
    options.add(timeLabel(h2, m2));
  }

  openModal(`
    ${gameHeader('🕐 Quelle heure est-il ?', 'Regarde bien les aiguilles, puis touche la bonne heure')}
    ${livesBar()}
    ${clockFaceHtml(hour, minute)}
    <div class="clock-options">
      ${shuffle([...options]).map(o=>`<button type="button" class="clock-opt-btn" data-v="${o}">${o}</button>`).join('')}
    </div>
  `);
  bindQuit();
  startTimerIfNeeded('clock');
  setSolution([solSel('.clock-opt-btn','v',answer)]);
  document.querySelectorAll('.clock-opt-btn').forEach(btn=>{
    btn.onclick = ()=>{
      if(btn.dataset.v===answer){ clearActiveTimer(); stepOk(btn); flashModal('ok'); setTimeout(onMissionWin, 350); }
      else loseLife(btn, { onRetry: renderClock });
    };
  });
}

// inscription auprès du moteur de mini-jeux (js/features/minigame-engine)
registerGame('clock', renderClock);
