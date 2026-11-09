/* ---------- Mini-jeu : Quelle heure est-il ? (grandeurs & mesures, CP-CE1) ----------
   Lire l'heure sur une horloge à aiguilles. Granularité centralisée
   dans js/entities/difficulty/difficulty.js (clockGranularity) : heures pleines d'abord,
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
  setHintQuestion('clock', { hour, minute, answer, options:[...options] }, { choices:'.clock-opt-btn' });
  document.querySelectorAll('.clock-opt-btn').forEach(btn=>{
    btn.onclick = ()=>{
      if(btn.dataset.v===answer){ clearActiveTimer(); stepOk(btn); flashModal('ok'); setTimeout(onMissionWin, 350); }
      else loseLife(btn, { onRetry: renderClock });
    };
  });
}

// Indices (v52) : 1. la petite aiguille montre l'heure, la grande les
// minutes ; 2. les nombres apparaissent autour de l'horloge, la petite
// aiguille brille ; « en bas sur le 6, c'est la demie »… Avec 4 choix, une
// heure aux minutes impossibles est écartée.
const CLOCK_MINUTE_TIPS = {
  0:'La grande aiguille est tout en haut, sur le 12 : c\'est l\'heure pile.',
  30:'La grande aiguille est tout en bas, sur le 6 : c\'est la demie, 30 minutes.',
  15:'La grande aiguille est sur le 3 : c\'est le quart, 15 minutes.',
  45:'La grande aiguille est sur le 9 : c\'est 45 minutes.',
};
function clockNumbersSVG(){
  return `<svg class="clock-nums" viewBox="0 0 100 100" aria-hidden="true">${Array.from({length:12}, (_,i)=>{
    const n = i + 1, a = (n * 30 - 90) * Math.PI / 180;
    return `<text x="${(50 + 37 * Math.cos(a)).toFixed(1)}" y="${(50 + 37 * Math.sin(a) + 4).toFixed(1)}" text-anchor="middle">${n}</text>`;
  }).join('')}</svg>`;
}
function clockHints(q){
  const mins = (label)=> (label.match(/h (\d+)/) || [0, '0'])[1];
  const wrong = q.options.find(o=> o !== q.answer && mins(o) !== mins(q.answer)) || q.options.find(o=> o !== q.answer);
  return [
    { say:'La petite aiguille montre l\'heure. La grande aiguille montre les minutes.', fx:{ glow:'.clock-hand-h' } },
    { say:`J'écris les nombres autour de l'horloge. Sur quel nombre est la petite aiguille ? ${CLOCK_MINUTE_TIPS[q.minute] || ''}`,
      fx:{ glow:'.clock-hand-h', dim: wrong ? solSel('.clock-opt-btn', 'v', wrong) : null, run(root){
        const face = root.querySelector('.clock-face');
        if(face && !face.querySelector('.clock-nums')) face.insertAdjacentHTML('beforeend', clockNumbersSVG());
      } } },
  ];
}

// inscription auprès du moteur de mini-jeux (js/features/minigame-engine)
registerGame('clock', renderClock);
registerHints('clock', clockHints);
