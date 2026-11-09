function showToast(msg){
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(showToast._t);
  showToast._t = setTimeout(()=> t.classList.remove('show'), 1600);
}

function vibrate(pattern){
  if(navigator.vibrate) navigator.vibrate(pattern);
}

function shakeEl(el){
  el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake');
}

// fonctions appelées après chaque retour d'erreur (voir onWrongFeedback)
const wrongFeedbackHooks = [];
function onWrongFeedback(fn){ wrongFeedbackHooks.push(fn); }

function wrongFeedback(el){
  playSound('wrong');
  vibrate(80);
  shakeEl(el);
  el.style.opacity=.4; setTimeout(()=>el.style.opacity=1,400);
  // abonnés (par exemple le mode chacun son tour, qui passe la main)
  wrongFeedbackHooks.forEach(fn=> fn(el));
}

/* ---------- Confettis ---------- */
function confetti(){
  const box = document.getElementById('confetti');
  const colors = ['#FF8969','#FFAAD4','#FFCB4C','#2EC4C6','#FFFFFF','#B388FF'];
  for(let i=0;i<50;i++){
    const p = document.createElement('div');
    p.className = 'confetti-piece';
    p.style.left = Math.random()*100 + '%';
    p.style.background = pickRandom(colors);
    p.style.animationDuration = (1.4 + Math.random()*1.2) + 's';
    p.style.animationDelay = (Math.random()*.4) + 's';
    p.style.transform = `rotate(${Math.random()*360}deg)`;
    box.appendChild(p);
    setTimeout(()=>p.remove(), 3200);
  }
}
