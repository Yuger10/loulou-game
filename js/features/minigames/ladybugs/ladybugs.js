/* ---------- Mini-jeu : Les coccinelles (Jardin des Fées, saison 2) ----------
   Les deux ailes d'une coccinelle sont symétriques : autant de points de
   chaque côté. On compte, on découvre les doubles (3 + 3), on complète
   l'aile vide pour qu'elle soit pareille, puis les moitiés (« 14 points en
   tout, combien par aile ? »).
   Selon le palier (`ladybugsRound`, js/entities/difficulty/difficulty.js) :
     count     compter tous les points (jusqu'à 3 par aile)
     double    les doubles, jusqu'à 5 + 5 puis 10 + 10
     complete  ajouter des points sur l'aile vide, puis « Pareil ! »
     half      le total est donné : combien par aile ?
   Anti-devinette : une erreur relance une AUTRE coccinelle. */
import { ladybugsRound } from '../../../entities/difficulty/index.js';
import { shuffle } from '../../../shared/lib/index.js';
import { openModal } from '../../../shared/ui/index.js';
import { gameDiff } from '../../adaptive/index.js';
import { registerHints, setHintQuestion } from '../../hints/index.js';
import {
  clearActiveTimer, flashModal, livesBar, loseLife, onMissionWin, registerGame, setSolution,
  setupLives, solSel, startTimerIfNeeded, stepOk
} from '../../minigame-engine/index.js';
import { bindQuit, gameHeader } from '../../screen/index.js';

// places des 10 points possibles sur l'aile gauche (centres, repère 120×170,
// sans chevauchement) ; l'aile droite est en miroir (120 - x)
const LB_SPOTS = [[44, 68], [28, 74], [36, 92], [50, 96], [22, 100], [30, 118], [48, 120], [24, 138], [42, 142], [36, 158]];

function ladybugsBuildRound(dd, rng){
  rng = rng || Math.random;
  const cfg = ladybugsRound(dd);
  const mode = cfg.modes[Math.floor(rng() * cfg.modes.length)];
  const n = cfg.min + Math.floor(rng() * (cfg.max - cfg.min + 1));
  return { cfg, mode, n, total: 2 * n };
}
// la coccinelle : `left` et `right` points sur chaque aile (right null : aile vide à compléter)
function ladybugSVG(left, right, hidden){
  const dots = (k, side)=> LB_SPOTS.slice(0, k).map(([x, y])=> `<circle class="lb-dot" data-w="${side}" cx="${side === 'l' ? x : 120 - x}" cy="${y}" r="6.5"/>`).join('');
  return `<svg class="lb-svg" viewBox="0 0 120 170" role="img" aria-label="Une coccinelle">
    <path d="M48 26 Q40 6 30 6 M72 26 Q80 6 90 6" fill="none" stroke="#2B2140" stroke-width="3.5" stroke-linecap="round"/><circle cx="30" cy="6" r="4" fill="#2B2140"/><circle cx="90" cy="6" r="4" fill="#2B2140"/>
    <ellipse cx="60" cy="38" rx="24" ry="18" fill="#2B2140"/><circle cx="52" cy="34" r="4" fill="#fff"/><circle cx="68" cy="34" r="4" fill="#fff"/>
    <path d="M58 48 C20 48 6 90 10 124 C14 156 40 166 58 164Z" fill="${hidden ? '#F5B7C2' : '#E8344E'}" stroke="#2B2140" stroke-width="3" class="lb-wing" data-w="l"/>
    <path d="M62 48 C100 48 114 90 110 124 C106 156 80 166 62 164Z" fill="${right === null ? '#FFE3E8' : hidden ? '#F5B7C2' : '#E8344E'}" stroke="#2B2140" stroke-width="3" class="lb-wing" data-w="r" ${right === null ? 'stroke-dasharray="6 5"' : ''}/>
    <g fill="#2B2140">${hidden ? '' : dots(left, 'l')}<g id="lb-right">${hidden || right === null ? '' : dots(right, 'r')}</g></g>
  </svg>`;
}
function ladybugsOptions(answer){
  const set = new Set([answer]);
  for(const k of shuffle([-2, -1, 1, 2, 3])){ if(set.size >= 3) break; if(answer + k >= 1) set.add(answer + k); }
  return shuffle([...set]);
}
const lbDots = (n)=> n <= 12 ? `<span class="cube-dots" aria-hidden="true">${'<i></i>'.repeat(n)}</span>` : '';

let ladybugsLast = '';
function renderLadybugs(){
  setupLives('ladybugs');
  const dd = gameDiff();
  let r = ladybugsBuildRound(dd);
  for(let k = 0; k < 8 && `${r.mode}${r.n}` === ladybugsLast; k++) r = ladybugsBuildRound(dd);
  ladybugsLast = `${r.mode}${r.n}`;
  const ok = (b)=>{ clearActiveTimer(); stepOk(b); flashModal('ok'); setTimeout(onMissionWin, 400); };
  const q = { mode: r.mode, n: r.n, total: r.total };

  if(r.mode === 'complete'){
    let added = 0;
    const max = Math.min(LB_SPOTS.length, r.cfg.max + 2);
    const say = 'L\'aile droite a perdu ses points ! Ajoute autant de points que sur l\'aile gauche, puis appuie sur « Pareil ! ».';
    openModal(`
      ${gameHeader('🐞 Les coccinelles', 'Rends les deux ailes pareilles', say)}
      ${livesBar()}
      <div class="lb-stage" id="lb-stage" data-mode="complete">${ladybugSVG(r.n, null)}</div>
      <div class="recipe-actions lb-actions">
        <button class="btn-ghost" id="lb-undo" aria-label="Enlever un point">↩️</button>
        <button class="lb-add" id="lb-add">⚫ Un point</button>
        <button class="btn-primary" id="lb-done">Pareil !</button>
      </div>
    `);
    bindQuit(); startTimerIfNeeded('ladybugs');
    setSolution([...Array(r.n).fill('#lb-add'), '#lb-done']);
    setHintQuestion('ladybugs', q, { choices:'#lb-done' });
    const draw = ()=>{
      const g = document.getElementById('lb-right');
      if(g) g.innerHTML = LB_SPOTS.slice(0, added).map(([x, y])=> `<circle class="lb-dot" data-w="r" cx="${120 - x}" cy="${y}" r="6.5"/>`).join('');
    };
    document.getElementById('lb-add').onclick = ()=>{ if(added < max){ added++; draw(); } };
    document.getElementById('lb-undo').onclick = ()=>{ if(added > 0){ added--; draw(); } };
    document.getElementById('lb-done').onclick = (e)=>{ if(added === r.n) ok(e.currentTarget); else loseLife(e.currentTarget, { onRetry: renderLadybugs, disable:false }); };
    return;
  }

  const half = r.mode === 'half';
  const answer = half ? r.n : r.total;
  const title = half ? `${r.total} points en tout : combien sur chaque aile ?` : 'Combien de points en tout ?';
  const say = half
    ? `Cette coccinelle a ${r.total} points en tout, autant sur chaque aile. Combien de points sur chaque aile ?`
    : 'Combien de points la coccinelle a-t-elle en tout, sur ses deux ailes ?';
  openModal(`
    ${gameHeader('🐞 Les coccinelles', title, say)}
    ${livesBar()}
    <div class="lb-stage" id="lb-stage" data-mode="${r.mode}" data-total="${r.total}">${ladybugSVG(r.n, r.n, half)}${half ? `<span class="lb-total">${r.total} points</span>` : ''}</div>
    <div class="num-options lb-options">${ladybugsOptions(answer).map(o=> `<button class="num-btn lb-opt" data-v="${o}" aria-label="${o}"><b>${o}</b>${lbDots(o)}</button>`).join('')}</div>
  `);
  bindQuit(); startTimerIfNeeded('ladybugs');
  setSolution([solSel('.lb-opt', 'v', answer)]);
  setHintQuestion('ladybugs', q, { choices:'.lb-opt' });
  document.querySelectorAll('.lb-opt').forEach(b=> b.onclick = ()=>{
    if(Number(b.dataset.v) === answer) ok(b); else loseLife(b, { onRetry: renderLadybugs });
  });
}

// Indices (v52) : 1. les deux ailes sont pareilles ; 2. une aile, puis le
// double (ou partager en deux). Jamais le total ni la moitié.
function ladybugsHints(q){
  if(q.mode === 'complete') return [
    { say:'Regarde l\'aile pleine : l\'aile vide doit avoir exactement autant de points.', fx:{ glow:'#lb-stage' } },
    { say:'Compte les points de l\'aile pleine, puis ajoute-en autant sur l\'aile vide. Compte-les encore à la fin.', fx:{ glow:'#lb-add' } },
  ];
  if(q.mode === 'half') return [
    { say:'Les deux ailes ont autant de points : on partage le total en deux parts égales.', fx:{ glow:'#lb-stage' } },
    { say:`Cherche le nombre qui, ajouté à lui-même, fait ${q.total}.`, fx:{ glow:'.lb-options' } },
  ];
  if(q.mode === 'count') return [
    { say:'Compte les points d\'une aile, puis ceux de l\'autre aile.', fx:{ glow:'#lb-stage' } },
    { say:`Sur une aile, il y a ${q.n} point${q.n > 1 ? 's' : ''}. Il y en a autant sur l'autre : continue à compter.`, fx:{ glow:'#lb-stage' } },
  ];
  return [
    { say:'Les deux ailes sont pareilles : compte les points d\'une seule aile, puis double.', fx:{ glow:'#lb-stage' } },
    { say:`Sur chaque aile, il y a ${q.n} points. ${q.n} + ${q.n}, c'est le double de ${q.n}.`, fx:{ glow:'#lb-stage' } },
  ];
}

registerGame('ladybugs', renderLadybugs);
registerHints('ladybugs', ladybugsHints);
