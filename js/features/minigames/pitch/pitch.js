/* ---------- Mini-jeu : Grave ou aigu ? (Île de la Musique, saison 2) ----------
   Écouter des notes et dire laquelle est la plus aiguë (ou la plus grave),
   les ranger du grave à l'aigu, puis reconnaître une mélodie qui monte ou
   qui descend. Chaque note est aussi une cloche plus ou moins grande (la
   grande sonne grave, la petite sonne aigu) : on peut jouer sans le son.
   Selon le palier (`pitchRound`, js/entities/difficulty/difficulty.js) :
     high    2 cloches très éloignées : « laquelle sonne le plus aigu (grave) ? »
     order   3, puis 4, puis 5 cloches à ranger, de plus en plus proches
     melody  « la mélodie monte ou descend ? » (palier 5)
   🔈 fait écouter les cloches de gauche à droite.
   Anti-devinette : une erreur relance d'AUTRES notes. */
import { pitchRound } from '../../../entities/difficulty/index.js';
import { shuffle } from '../../../shared/lib/index.js';
import { openModal, playNote } from '../../../shared/ui/index.js';
import { gameDiff } from '../../adaptive/index.js';
import { registerHints, setHintQuestion } from '../../hints/index.js';
import {
  clearActiveTimer, flashModal, livesBar, loseLife, onMissionWin, progressDots, registerGame,
  setSolution, setupLives, solSel, startTimerIfNeeded, stepOk
} from '../../minigame-engine/index.js';
import { bindQuit, gameHeader } from '../../screen/index.js';

// gamme pentatonique, du do grave au do aigu (notes MIDI) : jamais de fausse note
const PITCH_NOTES = [60, 62, 64, 67, 69, 72, 74, 76, 79, 81, 84];
const pitchHz = (m)=> 440 * Math.pow(2, (m - 69) / 12);
const BELL_COLORS = ['#FFD95A', '#5CC6CC', '#FF8FB8', '#BFA3EC', '#6ED38C', '#FFAE5C'];
// la taille de la cloche suit la note : grande et grave, petite et aiguë
const bellSize = (m)=> Math.round(36 + (84 - m) / 24 * 48);

function pitchBuildRound(dd, rng){
  rng = rng || Math.random;
  const cfg = pitchRound(dd);
  if(rng() < (cfg.melody || 0)){
    const up = rng() < .5;
    const start = Math.floor(rng() * (PITCH_NOTES.length - 4));
    const run = PITCH_NOTES.slice(start, start + 4);
    return { cfg, ask:'melody', up, notes: up ? run : run.slice().reverse() };
  }
  for(let t = 0; t < 300; t++){
    const picked = shuffle(PITCH_NOTES.slice()).slice(0, cfg.n).sort((a, b)=> a - b);
    const gaps = picked.slice(1).map((m, i)=> m - picked[i]);
    if(gaps.every(g=> g >= cfg.gap) && (!cfg.maxGap || gaps.every(g=> g <= cfg.maxGap))){
      const ask = cfg.ask === 'high' ? (rng() < .5 ? 'high' : 'low') : 'order';
      return { cfg, ask, notes: shuffle(picked.slice()), sorted: picked };
    }
  }
  return { cfg, ask:'order', notes: PITCH_NOTES.slice(0, cfg.n).reverse(), sorted: PITCH_NOTES.slice(0, cfg.n) };
}

function bellSVG(m, i){
  const c = BELL_COLORS[PITCH_NOTES.indexOf(m) % BELL_COLORS.length];
  return `<svg class="bell-svg" viewBox="0 0 60 66" style="width:${bellSize(m)}px" aria-hidden="true">
    <path d="M30 4 C30 4 34 4 34 8 C46 11 50 24 50 38 L50 48 L56 56 L4 56 L10 48 L10 38 C10 24 14 11 26 8 C26 4 30 4 30 4Z" fill="${c}" stroke="#2B2F6B" stroke-width="3" stroke-linejoin="round"/>
    <path d="M18 24 Q22 14 30 12" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".7"/>
    <circle cx="30" cy="60" r="5" fill="#2B2F6B"/>
  </svg>`;
}

let pitchToken = 0, pitchLast = '';
function renderPitch(){
  setupLives('pitch');
  const dd = gameDiff();
  let r = pitchBuildRound(dd);
  for(let k = 0; k < 8 && `${r.ask}${r.notes.join()}` === pitchLast; k++) r = pitchBuildRound(dd);
  pitchLast = `${r.ask}${r.notes.join()}`;
  const token = ++pitchToken;
  const alive = ()=> token === pitchToken && !!document.getElementById('pitch-stage');
  const asks = {
    high:  ['Quelle cloche sonne le plus aigu ?', 'Écoute les cloches. Laquelle sonne le plus aigu, comme un petit oiseau ?'],
    low:   ['Quelle cloche sonne le plus grave ?', 'Écoute les cloches. Laquelle sonne le plus grave, comme un gros ours ?'],
    order: ['Range les cloches, de la plus grave à la plus aiguë', 'Touche les cloches dans l\'ordre, de la plus grave à la plus aiguë.'],
    melody:['La mélodie monte ou descend ?', 'Écoute la mélodie de Flûtine. Est-ce qu\'elle monte, ou est-ce qu\'elle descend ?'],
  };
  const [title, say] = asks[r.ask];
  const stage = r.ask === 'melody'
    ? `<div class="pitch-melody" id="pitch-stage" data-ask="melody">${r.notes.map((m, i)=> `<span class="pm-dot" data-i="${i}" data-m="${m}" style="bottom:${8 + (m - 60) / 24 * 76}%"></span>`).join('')}</div>`
    : `<div class="pitch-bells" id="pitch-stage" data-ask="${r.ask}">${r.notes.map((m, i)=> `<button class="bell" data-i="${i}" data-m="${m}" aria-label="Cloche ${i + 1}">${bellSVG(m, i)}<b class="bell-n"></b></button>`).join('')}</div>`;
  openModal(`
    ${gameHeader('🔔 Grave ou aigu ?', title, say)}
    ${livesBar()}
    ${stage}
    <button class="btn-small pitch-listen" id="pitch-listen">🔈 Écouter</button>
    ${r.ask === 'order' ? `<div id="pitch-progress">${progressDots(0, r.notes.length)}</div>` : ''}
    ${r.ask === 'melody' ? `<div class="num-options pitch-dirs">
      <button class="num-btn pitch-dir" data-v="up" aria-label="Elle monte"><b>⬆️</b><span>Elle monte</span></button>
      <button class="num-btn pitch-dir" data-v="down" aria-label="Elle descend"><b>⬇️</b><span>Elle descend</span></button></div>` : ''}
  `);
  bindQuit();
  startTimerIfNeeded('pitch');

  // écouter : les cloches (ou les notes de la mélodie) de gauche à droite
  function listen(slow){
    const step = slow ? 900 : 620;
    r.notes.forEach((m, i)=> setTimeout(()=>{
      if(!alive()) return;
      const el = document.querySelector(`#pitch-stage [data-i="${i}"]`);
      if(el){ el.classList.add('lit'); setTimeout(()=> el.classList.remove('lit'), step - 120); }
      playNote(pitchHz(m), .5, .2);
    }, 300 + i * step));
  }
  document.getElementById('pitch-listen').onclick = ()=> listen(false);
  if(r.ask === 'melody') listen(false);

  const q = { ask: r.ask, replay(){ listen(true); } };
  if(r.ask === 'melody'){
    const good = r.up ? 'up' : 'down';
    setSolution([solSel('.pitch-dir', 'v', good)]);
    setHintQuestion('pitch', q, { choices:'.pitch-dir' });
    document.querySelectorAll('.pitch-dir').forEach(b=> b.onclick = ()=>{
      if(b.dataset.v === good){ clearActiveTimer(); stepOk(b); flashModal('ok'); setTimeout(onMissionWin, 350); }
      else loseLife(b, { onRetry: renderPitch });
    });
    return;
  }
  const target = r.ask === 'high' ? [Math.max(...r.notes)] : r.ask === 'low' ? [Math.min(...r.notes)] : r.sorted;
  setSolution(target.map(m=> solSel('.bell', 'm', m)));
  setHintQuestion('pitch', q, { choices:'.bell' });
  let pos = 0;
  document.querySelectorAll('.bell').forEach(b=> b.onclick = ()=>{
    const m = Number(b.dataset.m);
    playNote(pitchHz(m), .5, .2);
    if(b.classList.contains('done')) return;
    if(m !== target[pos]){ loseLife(b, { onRetry: renderPitch, disable:false }); return; }
    stepOk(b);
    pos++;
    if(r.ask === 'order'){
      b.classList.add('done'); b.querySelector('.bell-n').textContent = pos;
      const p = document.getElementById('pitch-progress'); if(p) p.innerHTML = progressDots(pos, target.length);
    }
    if(pos === target.length){ clearActiveTimer(); flashModal('ok'); setTimeout(onMissionWin, 450); }
  });
}

// Indices (v52) : 1. grave et aigu (le gros ours, le petit oiseau ; la grande
// et la petite cloche) ; 2. écouter encore, deux par deux. Jamais la cloche.
function pitchHints(q){
  if(q.ask === 'melody') return [
    { say:'Si chaque note est plus aiguë que celle d\'avant, la mélodie monte. Si elle est plus grave, elle descend.', fx:{ glow:'#pitch-stage' } },
    { say:'Regarde les points : ils grimpent comme un escalier, ou ils descendent ? Écoute encore, plus lentement.', fx:{ glow:'#pitch-stage', run(){ q.replay(); } } },
  ];
  if(q.ask === 'order') return [
    { say:'On range du plus grave au plus aigu : du gros ours au petit oiseau. Les grandes cloches sonnent grave.', fx:{ glow:'#pitch-stage' } },
    { say:'Écoute les cloches deux par deux : la plus grave des deux passe avant.', fx:{ glow:'#pitch-listen', run(){ q.replay(); } } },
  ];
  return [
    { say:'Une note aiguë est fine, comme un petit oiseau. Une note grave est grosse, comme un ours. Les petites cloches sonnent aigu.', fx:{ glow:'#pitch-stage' } },
    { say:`Écoute encore les cloches, et garde celle qui sonne le plus ${q.ask === 'high' ? 'aigu' : 'grave'}.`, fx:{ glow:'#pitch-listen', run(){ q.replay(); } } },
  ];
}

registerGame('pitch', renderPitch);
registerHints('pitch', pitchHints);
