/* Jeu 6 : mémoire de séquence (Simon). Pas de minuteur : la tâche est
   déjà chronométrée par nature (on répète une séquence qui vient de
   s'afficher) — un décompte en plus ferait double pression, voir
   js/entities/difficulty/difficulty.js § « MINUTEUR ». Longueur dans § simonLength. */
import { simonLength } from '../../../entities/difficulty/index.js';
import { pickRandom } from '../../../shared/lib/index.js';
import { openModal, playNote } from '../../../shared/ui/index.js';
import { gameDiff } from '../../adaptive/index.js';
import { registerHints, setHintQuestion } from '../../hints/index.js';
import {
  flashModal, livesBar, loseLife, onMissionWin, progressDots, registerGame, setSolution, setupLives,
  solSel
} from '../../minigame-engine/index.js';
import { bindQuit, gameHeader } from '../../screen/index.js';

function renderSimon(){
  setupLives('simon');
  const PADS = [
    {k:'a', emoji:'🟡', freq:392, name:'jaune'},
    {k:'b', emoji:'🔵', freq:523, name:'bleu'},
    {k:'c', emoji:'🟢', freq:659, name:'vert'},
    {k:'d', emoji:'🔴', freq:784, name:'rouge'},
  ];
  const len = simonLength(gameDiff());
  const seq = Array.from({length:len},()=>pickRandom(PADS));
  let pos = 0, playing = true;

  openModal(`
    ${gameHeader('🎵 Répète après moi', 'Regarde bien les couleurs, puis touche-les dans le même ordre')}
    ${livesBar()}
    ${progressDots(0, len)}
    <div class="simon-grid" id="simon-grid">
      ${PADS.map(p=>`<button class="simon-pad" data-k="${p.k}">${p.emoji}</button>`).join('')}
    </div>
    <p class="puzzle-hint" id="simon-state">👀 Regarde…</p>
  `);
  bindQuit();

  const padEl = k => document.querySelector(`.simon-pad[data-k="${k}"]`);
  // chaque pastille a sa propre note : elle peut reconnaître la couleur à
  // l'oreille. Note de marimba exacte (sans variation), pour être mémorisée.
  function padTone(p, dur=.3, vol=.16){ playNote(p.freq, dur, vol); }
  function flash(p, i){
    setTimeout(()=>{
      const el = padEl(p.k);
      if(!el) return;
      el.classList.add('lit');
      padTone(p);
      setTimeout(()=>el.classList.remove('lit'), 380);
    }, 600 + i*650);
  }
  seq.forEach(flash);
  setSolution(seq.map(p=>solSel('.simon-pad','k',p.k)));   // après « À toi ! »
  // indices (v52) : revoir la suite, plus lentement, depuis le début
  const q = { len, replay(){
    if(playing) return;
    playing = true; pos = 0;
    document.querySelectorAll('.game-progress i').forEach(dd=>dd.classList.remove('on'));
    const s = document.getElementById('simon-state');
    if(s) s.textContent = '👀 Regarde encore…';
    seq.forEach((p, i)=> flash(p, i * 1.6));   // 1,6 fois plus lent
    setTimeout(()=>{ playing = false; const s2 = document.getElementById('simon-state'); if(s2) s2.textContent = '👆 À toi !'; }, 600 + seq.length*1040);
  } };
  setHintQuestion('simon', q);
  setTimeout(()=>{
    playing = false;
    const s = document.getElementById('simon-state');
    if(s) s.textContent = '👆 À toi !';
  }, 600 + seq.length*650);

  document.querySelectorAll('.simon-pad').forEach(btn=>{
    btn.onclick = ()=>{
      if(playing) return;
      const k = btn.dataset.k;
      const p = PADS.find(x=>x.k===k);
      btn.classList.add('lit'); setTimeout(()=>btn.classList.remove('lit'), 200);
      padTone(p, .22, .15); // le son de la pastille joue toujours, même si c'est la mauvaise
      if(seq[pos].k === k){
        pos++;
        document.querySelectorAll('.game-progress i').forEach((dd,i)=>dd.classList.toggle('on', i<pos));
        if(pos===seq.length){ flashModal('ok'); setTimeout(onMissionWin, 350); }
      } else {
        if(loseLife(btn, {disable:false})) return;
        pos = 0;
        document.querySelectorAll('.game-progress i').forEach(dd=>dd.classList.remove('on'));
        const s = document.getElementById('simon-state');
        if(s) s.textContent = '🔁 On recommence…';
        playing = true;
        seq.forEach(flash);
        setTimeout(()=>{
          playing = false;
          const s2 = document.getElementById('simon-state');
          if(s2) s2.textContent = '👆 À toi !';
        }, 600 + seq.length*650);
      }
    };
  });
}

// Indices (v52) : 1. dire le nom des couleurs dans sa tête pendant qu'elles
// s'allument ; 2. la suite rejouée plus lentement, depuis le début.
function simonHints(q){
  return [
    { say:'Pendant que les couleurs s\'allument, dis leur nom dans ta tête : ça aide à retenir !', fx:{ glow:'.simon-grid' } },
    { say:'Regarde encore une fois, plus lentement. Puis recommence depuis le début.', fx:{ run(){ q.replay(); } } },
  ];
}

// inscription auprès du moteur de mini-jeux (js/features/minigame-engine)
registerGame('simon', renderSimon);
registerHints('simon', simonHints);
