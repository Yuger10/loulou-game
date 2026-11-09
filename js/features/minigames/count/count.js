/* Jeu 2 : compter (dénombrement — voir js/entities/difficulty/difficulty.js § countRange) */
import { countRange } from '../../../entities/difficulty/index.js';
import { pickRandom, shuffle } from '../../../shared/lib/index.js';
import { emojiWord, openModal } from '../../../shared/ui/index.js';
import { gameDiff } from '../../adaptive/index.js';
import { registerHints, setHintQuestion } from '../../hints/index.js';
import {
  clearActiveTimer, flashModal, livesBar, loseLife, onMissionWin, registerGame, setSolution,
  setupLives, solSel, startTimerIfNeeded, stepOk
} from '../../minigame-engine/index.js';
import { bindQuit, gameHeader } from '../../screen/index.js';

function renderCount(){
  setupLives('count');
  const emoji = pickRandom(['⭐','🐚','🌸','🦪','🐠','🦋']);
  const dd = gameDiff();
  const { min, max } = countRange(dd);
  const n = min + Math.floor(Math.random()*(max-min+1));
  let options = new Set([n]);
  while(options.size<3){ options.add(Math.max(1, n + (Math.floor(Math.random()*5)-2))); }
  options = shuffle([...options]);

  openModal(`
    ${gameHeader('🔢 Compte avec moi', `Combien y a-t-il de ${emoji} ?`, `Combien y a-t-il de ${emojiWord(emoji,true)} ?`)}
    ${livesBar()}
    <div class="count-row">${Array(n).fill(emoji).map(e=>`<span>${e}</span>`).join('')}</div>
    <div class="num-options">
      ${options.map(o=>`<button class="num-btn" data-v="${o}">${o}</button>`).join('')}
    </div>
  `);
  bindQuit();
  startTimerIfNeeded('count');
  setSolution([solSel('.num-btn','v',n)]);
  setHintQuestion('count', { n, emoji }, { choices:'.num-btn' });
  document.querySelectorAll('.num-btn').forEach(btn=>{
    btn.onclick = ()=>{
      if(Number(btn.dataset.v)===n){ clearActiveTimer(); stepOk(btn); flashModal('ok'); setTimeout(onMissionWin, 350); }
      else loseLife(btn, { onRetry: renderCount });
    };
  });
}

// Indices (v52) : 1. compter un par un avec le doigt ; 2. les premiers
// objets numérotés (jamais jusqu'au dernier : la réponse reste à trouver).
function countHints(q){
  const k = Math.min(3, q.n - 1);
  const what = emojiWord(q.emoji) || 'image';
  return [
    { say:`Touche chaque ${what} avec ton doigt, une seule fois, en comptant.`, fx:{ glow:'.count-row' } },
    { say: k > 0 ? `Je commence avec toi : ${Array.from({length:k}, (_,i)=> i + 1).join(', ')}… Continue à compter !` : 'Compte doucement avec ton doigt.',
      fx:{ marks: Array.from({length:k}, (_,i)=> ({ sel:`.count-row span:nth-child(${i+1})`, text:String(i + 1) })) } },
  ];
}

// inscription auprès du moteur de mini-jeux (js/features/minigame-engine)
registerGame('count', renderCount);
registerHints('count', countHints);
