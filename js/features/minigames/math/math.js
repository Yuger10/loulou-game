/* ---------- Mini-jeu : Opérations magiques (niveau CP-CE2) ----------
   Additions et soustractions illustrées avec des emojis, pour
   apprendre le calcul sans se noyer dans les chiffres.
   Les bornes (mathBounds) sont centralisées et documentées dans
   js/entities/difficulty/difficulty.js — voir aussi ANALYSE-DIFFICULTE.md. */
import { mathBounds } from '../../../entities/difficulty/index.js';
import { pickRandom, shuffle } from '../../../shared/lib/index.js';
import { emojiWord, openModal } from '../../../shared/ui/index.js';
import { gameDiff } from '../../adaptive/index.js';
import { registerHints, setHintQuestion } from '../../hints/index.js';
import {
  clearActiveTimer, flashModal, livesBar, loseLife, onMissionWin, registerGame, setSolution,
  setupLives, solSel, startTimerIfNeeded, stepOk
} from '../../minigame-engine/index.js';
import { bindQuit, gameHeader } from '../../screen/index.js';

const MATH_EMOJIS = ['⭐','🐚','🌸','🦪','🐠','🦋','🍎','🎈'];

function makeMathProblem(){
  const { max, allowMinus } = mathBounds(gameDiff());
  const isMinus = allowMinus && Math.random()<0.5;
  let a, b, result, op;
  if(isMinus){
    a = 2 + Math.floor(Math.random()*(max-1));      // a entre 2 et max
    b = 1 + Math.floor(Math.random()*(a-1));          // b < a : jamais de résultat négatif
    result = a - b;
    op = '−';
  } else {
    const half = Math.max(1, Math.floor(max/2));
    a = 1 + Math.floor(Math.random()*half);
    b = 1 + Math.floor(Math.random()*(max-a));
    result = a + b;
    op = '+';
  }
  return { a, b, op, result };
}

function renderMath(){
  setupLives('math');
  const emoji = pickRandom(MATH_EMOJIS);
  const { a, b, op, result } = makeMathProblem();

  let options = new Set([result]);
  while(options.size<3){
    const delta = Math.floor(Math.random()*5)-2;
    const cand = Math.max(0, result + (delta===0 ? 1 : delta));
    options.add(cand);
  }
  options = shuffle([...options]);

  const spoken = op==='+'
    ? `Combien ça fait, ${a} plus ${b} ?`
    : `Combien ça fait, ${a} moins ${b} ?`;

  openModal(`
    ${gameHeader('➕ Opérations magiques', `${a} ${op} ${b} = ?`, spoken)}
    ${livesBar()}
    <div class="math-illustration">
      <div class="math-group">${Array(a).fill(emoji).map(e=>`<span>${e}</span>`).join('')}</div>
      <span class="math-op">${op}</span>
      <div class="math-group">${Array(b).fill(emoji).map(e=>`<span>${e}</span>`).join('')}</div>
    </div>
    <div class="math-equation">
      <span class="eq-num">${a}</span>
      <span class="eq-op">${op}</span>
      <span class="eq-num">${b}</span>
      <span class="eq-op">=</span>
      <span class="eq-q">?</span>
    </div>
    <div class="num-options">
      ${options.map(o=>`<button class="num-btn" data-v="${o}">${o}</button>`).join('')}
    </div>
  `);
  bindQuit();
  startTimerIfNeeded('math');
  setSolution([solSel('.num-btn','v',result)]);
  setHintQuestion('math', { a, b, op, result, emoji }, { choices:'.num-btn' });
  document.querySelectorAll('.num-btn').forEach(btn=>{
    btn.onclick = ()=>{
      if(Number(btn.dataset.v)===result){
        clearActiveTimer();
        const q = document.querySelector('.eq-q');
        if(q){ q.textContent = result; q.classList.add('filled'); }
        stepOk(btn); flashModal('ok');
        setTimeout(onMissionWin, 420);
      } else {
        loseLife(btn, { onRetry: renderMath });
      }
    };
  });
}

// Indices (v52). Addition : 1. tout compter ensemble ; 2. partir du premier
// groupe et continuer (« il y en a déjà 4… 5… »). Soustraction : 1. barrer ceux
// qui partent ; 2. ils sont barrés, il reste à compter. Jamais le résultat.
function mathHints(q){
  const word = emojiWord(q.emoji, true) || 'images';
  const g1 = '.math-illustration .math-group:first-child', g2 = '.math-illustration .math-group:last-child';
  if(q.op === '+') return [
    { say:`Pour ajouter, on compte tous les ${word} ensemble, ceux des deux groupes.`, fx:{ glow:'.math-illustration' } },
    { say: q.b > 1
        ? `Il y en a déjà ${q.a} dans le premier groupe. Continue avec les autres : ${q.a + 1}…`
        : `Il y en a déjà ${q.a} dans le premier groupe. Ajoute encore celui de l'autre groupe !`,
      fx:{ marks:[{ sel:`${g1} span:last-child`, text:String(q.a) }].concat(q.b > 1 ? [{ sel:`${g2} span:first-child`, text:String(q.a + 1) }] : []), glow:g2 } },
  ];
  return [
    { say:`Pour enlever, on barre les ${word} qui s'en vont, puis on compte ceux qui restent.`, fx:{ glow:g1 } },
    { say:`Je barre ceux qui s'en vont. Compte ceux qui restent !`, fx:{ strike:`${g1} span:nth-last-child(-n+${q.b})` } },
  ];
}

// inscription auprès du moteur de mini-jeux (js/features/minigame-engine)
registerGame('math', renderMath);
registerHints('math', mathHints);
