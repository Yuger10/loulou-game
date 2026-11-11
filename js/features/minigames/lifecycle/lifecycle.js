/* ---------- Mini-jeu : De la graine à la fleur (Jardin des Fées, saison 2) ----------
   Remettre dans l'ordre les étapes de la vie d'une plante, d'un papillon ou
   d'une poule. Chaque étape est dessinée et nommée (« Questionner le monde
   du vivant », cycle 2 : naissance, croissance, reproduction).
   Selon le palier (`lifecycleRound`, js/entities/difficulty/difficulty.js) :
     order    toucher les étapes dans l'ordre (3, 4 puis 5 étapes)
     missing  une étape manque dans le cycle : la retrouver parmi 3
     mixed    deux cycles mélangés : ranger seulement ceux de la plante
     next     « que se passe-t-il ensuite ? »
   Anti-devinette : une erreur relance un AUTRE cycle. */
import { lifecycleRound } from '../../../entities/difficulty/index.js';
import { shuffle } from '../../../shared/lib/index.js';
import { openModal } from '../../../shared/ui/index.js';
import { gameDiff } from '../../adaptive/index.js';
import { registerHints, setHintQuestion } from '../../hints/index.js';
import {
  clearActiveTimer, flashModal, livesBar, loseLife, onMissionWin, progressDots, registerGame,
  setSolution, setupLives, solSel, startTimerIfNeeded, stepOk
} from '../../minigame-engine/index.js';
import { bindQuit, gameHeader } from '../../screen/index.js';

// les étapes : un dessin (SVG simple, ou un emoji bien connu) et un nom à dire
const LC_STAGES = {
  graine:     { name:'la graine', svg:'<ellipse cx="30" cy="38" rx="11" ry="8" fill="#B5702E" stroke="#6B3E26" stroke-width="2.5"/><path d="M22 36 Q30 30 38 36" fill="none" stroke="#E7C29A" stroke-width="2"/><path d="M8 48 H52" stroke="#8B5A3C" stroke-width="4" stroke-linecap="round"/>' },
  pousse:     { name:'la pousse', svg:'<path d="M30 50 V28" stroke="#4F8A45" stroke-width="4" stroke-linecap="round"/><path d="M30 32 Q18 18 10 26 Q18 36 30 32Z M30 30 Q42 14 50 22 Q42 34 30 30Z" fill="#6DBB57" stroke="#4F8A45" stroke-width="2"/><path d="M8 52 H52" stroke="#8B5A3C" stroke-width="4" stroke-linecap="round"/>' },
  bouton:     { name:'le bouton de fleur', svg:'<path d="M30 54 V24" stroke="#4F8A45" stroke-width="4" stroke-linecap="round"/><path d="M30 40 Q18 34 14 40 Q22 46 30 44Z" fill="#6DBB57" stroke="#4F8A45" stroke-width="2"/><path d="M30 26 C20 22 22 6 30 4 C38 6 40 22 30 26Z" fill="#FF9CC8" stroke="#C9497F" stroke-width="2.5"/><path d="M24 22 Q30 28 36 22" fill="#6DBB57"/>' },
  fleur:      { name:'la fleur', svg:'<path d="M30 56 V30" stroke="#4F8A45" stroke-width="4" stroke-linecap="round"/><g fill="#FF9CC8" stroke="#C9497F" stroke-width="2"><circle cx="30" cy="10" r="8"/><circle cx="18" cy="20" r="8"/><circle cx="42" cy="20" r="8"/><circle cx="22" cy="32" r="8"/><circle cx="38" cy="32" r="8"/></g><circle cx="30" cy="22" r="7" fill="#FFD95A" stroke="#B8901A" stroke-width="2"/>' },
  fruit:      { name:'le fruit', svg:'<path d="M30 14 Q32 6 38 4" fill="none" stroke="#6B3E26" stroke-width="3" stroke-linecap="round"/><path d="M34 10 Q46 6 46 14 Q38 16 34 10Z" fill="#6DBB57"/><path d="M30 18 C14 10 6 30 14 44 C20 56 28 52 30 50 C32 52 40 56 46 44 C54 30 46 10 30 18Z" fill="#E8344E" stroke="#A8264A" stroke-width="2.5"/>' },
  oeuf:       { name:'l\'œuf', emoji:'🥚' },
  chenille:   { name:'la chenille', emoji:'🐛' },
  chrysalide: { name:'la chrysalide', svg:'<path d="M30 4 V12" stroke="#6B3E26" stroke-width="3"/><path d="M30 12 C40 14 42 30 38 42 C36 50 32 56 30 56 C28 56 24 50 22 42 C18 30 20 14 30 12Z" fill="#9FD48A" stroke="#4F8A45" stroke-width="2.5"/><path d="M24 26 Q30 30 36 26 M24 36 Q30 40 36 36" fill="none" stroke="#4F8A45" stroke-width="2"/>' },
  papillon:   { name:'le papillon', emoji:'🦋' },
  poussinoeuf:{ name:'le poussin qui éclot', emoji:'🐣' },
  poussin:    { name:'le poussin', emoji:'🐥' },
  poule:      { name:'la poule', emoji:'🐔' },
};
const LC_CYCLES = {
  plante:   { name:'la plante',    stages:['graine', 'pousse', 'bouton', 'fleur', 'fruit'] },
  papillon: { name:'le papillon',  stages:['oeuf', 'chenille', 'chrysalide', 'papillon'] },
  poule:    { name:'la poule',     stages:['oeuf', 'poussinoeuf', 'poussin', 'poule'] },
};
const stageArt = (s)=> LC_STAGES[s].svg ? `<svg class="lc-svg" viewBox="0 0 60 60" aria-hidden="true">${LC_STAGES[s].svg}</svg>` : `<span class="lc-emoji" aria-hidden="true">${LC_STAGES[s].emoji}</span>`;
const stageCard = (s, extra)=> `<button class="lc-card" data-s="${s}" aria-label="${LC_STAGES[s].name}"${extra || ''}>${stageArt(s)}<span class="lc-name">${LC_STAGES[s].name.replace(/^(la |le |l')/, '')}</span></button>`;

function lifecycleBuildRound(dd, rng){
  rng = rng || Math.random;
  const cfg = lifecycleRound(dd);
  const pick = (arr)=> arr[Math.floor(rng() * arr.length)];
  const mode = pick(cfg.modes);
  if(mode === 'mixed'){
    const plant = LC_CYCLES.plante.stages.slice(0, cfg.n);
    const other = shuffle(LC_CYCLES.papillon.stages.slice()).slice(0, 2);
    return { cfg, mode, cycle:'plante', order: plant, cards: shuffle(plant.concat(other)) };
  }
  // un cycle assez long pour le nombre d'étapes voulu ; au palier 1, la plante en 3 étapes
  const pool = Object.keys(LC_CYCLES).filter(k=> LC_CYCLES[k].stages.length >= Math.min(cfg.n, 4));
  const cycle = cfg.n >= 5 ? 'plante' : pick(pool);
  let stages = LC_CYCLES[cycle].stages;
  if(cfg.n === 3) stages = cycle === 'plante' ? ['graine', 'pousse', 'fleur'] : [stages[0], stages[1], stages[stages.length - 1]];
  else stages = stages.slice(0, Math.min(cfg.n, stages.length));
  if(mode === 'missing'){
    const gap = 1 + Math.floor(rng() * (stages.length - 2));   // jamais la première ni la dernière
    const others = Object.keys(LC_STAGES).filter(s=> !stages.includes(s));
    return { cfg, mode, cycle, order: stages, gap, options: shuffle([stages[gap], ...shuffle(others).slice(0, 2)]) };
  }
  if(mode === 'next'){
    const at = Math.floor(rng() * (stages.length - 1));
    // ce qui peut suivre cette étape dans N'IMPORTE QUEL cycle (l'œuf de la
    // poule ou du papillon…) n'est jamais une mauvaise réponse
    const after = new Set(Object.values(LC_CYCLES).flatMap(c=> c.stages.filter((s, i)=> c.stages[i - 1] === stages[at])));
    const wrong = shuffle(stages.filter((s, i)=> i !== at + 1 && i !== at && !after.has(s))).slice(0, 1)
      .concat(shuffle(Object.keys(LC_STAGES).filter(s=> !stages.includes(s) && !after.has(s))).slice(0, 1));
    if(wrong.length < 2) wrong.push(shuffle(Object.keys(LC_STAGES).filter(s=> !after.has(s) && s !== stages[at] && !wrong.includes(s)))[0]);
    return { cfg, mode, cycle, order: stages, at, options: shuffle([stages[at + 1], ...wrong]) };
  }
  return { cfg, mode:'order', cycle, order: stages, cards: shuffle(stages.slice()) };
}
const lcKey = (r)=> `${r.mode}-${r.cycle}-${(r.cards || r.options || []).join()}-${r.gap}-${r.at}`;

let lifecycleLast = '';
function renderLifecycle(){
  setupLives('lifecycle');
  const dd = gameDiff();
  let r = lifecycleBuildRound(dd);
  for(let k = 0; k < 8 && lcKey(r) === lifecycleLast; k++) r = lifecycleBuildRound(dd);
  lifecycleLast = lcKey(r);
  const cyc = LC_CYCLES[r.cycle];
  const arrow = '<span class="lc-arrow" aria-hidden="true">➜</span>';
  const ok = ()=>{ clearActiveTimer(); flashModal('ok'); setTimeout(onMissionWin, 450); };

  if(r.mode === 'missing' || r.mode === 'next'){
    const missing = r.mode === 'missing';
    const title = missing ? 'Quelle étape manque ?' : 'Que se passe-t-il ensuite ?';
    const say = missing
      ? `Voici la vie de ${cyc.name}, mais une étape manque. Laquelle ?`
      : `Voici ${LC_STAGES[r.order[r.at]].name}. Que se passe-t-il ensuite ?`;
    const strip = missing
      ? r.order.map((s, i)=> i === r.gap ? '<span class="lc-slot" aria-label="une étape manque">?</span>' : `<span class="lc-step" data-s="${s}">${stageArt(s)}</span>`).join(arrow)
      : `<span class="lc-step" data-s="${r.order[r.at]}">${stageArt(r.order[r.at])}</span>${arrow}<span class="lc-slot">?</span>`;
    const good = missing ? r.order[r.gap] : r.order[r.at + 1];
    openModal(`
      ${gameHeader('🌱 De la graine à la fleur', title, say)}
      ${livesBar()}
      <div class="lc-strip" id="lc-strip" data-mode="${r.mode}" data-cycle="${r.cycle}">${strip}</div>
      <div class="lc-options">${r.options.map(s=> stageCard(s)).join('')}</div>
    `);
    bindQuit(); startTimerIfNeeded('lifecycle');
    setSolution([solSel('.lc-card', 's', good)]);
    const q = missing
      ? { mode:'missing', prev: r.order[r.gap - 1], next: r.order[r.gap + 1] }
      : { mode:'next', cur: r.order[r.at] };
    setHintQuestion('lifecycle', q, { choices:'.lc-card' });
    document.querySelectorAll('.lc-card').forEach(b=> b.onclick = ()=>{
      if(b.dataset.s === good){
        stepOk(b);
        const slot = document.querySelector('.lc-slot');
        if(slot){ slot.outerHTML = `<span class="lc-step found" data-s="${good}">${stageArt(good)}</span>`; }
        ok();
      } else loseLife(b, { onRetry: renderLifecycle });
    });
    return;
  }

  // order / mixed : toucher les étapes dans l'ordre ; elles se rangent sur le chemin
  const mixed = r.mode === 'mixed';
  const title = mixed ? 'Range seulement les étapes de la plante' : `Remets dans l'ordre la vie de ${cyc.name}`;
  const say = mixed
    ? 'Les étapes de la plante et du papillon sont mélangées ! Touche seulement celles de la plante, de la graine au fruit.'
    : `Remets dans l'ordre la vie de ${cyc.name} : touche les étapes, de la première à la dernière.`;
  openModal(`
    ${gameHeader('🌱 De la graine à la fleur', title, say)}
    ${livesBar()}
    <div class="lc-strip lc-path" id="lc-strip" data-mode="${r.mode}" data-cycle="${r.cycle}">${r.order.map(()=> '<span class="lc-slot">?</span>').join(arrow)}</div>
    <div class="lc-options">${r.cards.map(s=> stageCard(s)).join('')}</div>
    <div id="lc-progress">${progressDots(0, r.order.length)}</div>
  `);
  bindQuit(); startTimerIfNeeded('lifecycle');
  setSolution(r.order.map(s=> solSel('.lc-card', 's', s)));
  setHintQuestion('lifecycle', { mode: r.mode, cycle: r.cycle, first: r.order[0] }, { choices:'.lc-card' });
  let pos = 0;
  document.querySelectorAll('.lc-card').forEach(b=> b.onclick = ()=>{
    if(b.classList.contains('done')) return;
    if(b.dataset.s !== r.order[pos]){ loseLife(b, { onRetry: renderLifecycle, disable:false }); return; }
    stepOk(b);
    b.classList.add('done');
    const slot = document.querySelectorAll('#lc-strip .lc-slot')[0];
    if(slot) slot.outerHTML = `<span class="lc-step found" data-s="${b.dataset.s}">${stageArt(b.dataset.s)}</span>`;
    pos++;
    const p = document.getElementById('lc-progress'); if(p) p.innerHTML = progressDots(pos, r.order.length);
    if(pos === r.order.length) ok();
  });
}

// Indices (v52) : 1. par où commencer, ce qui grandit ; 2. le voisinage de
// l'étape à trouver. Jamais l'étape elle-même.
function lifecycleHints(q){
  if(q.mode === 'missing') return [
    { say:'Regarde l\'étape juste avant le point d\'interrogation, et celle juste après.', fx:{ glow:'#lc-strip' } },
    { say:`Que se passe-t-il entre ${LC_STAGES[q.prev].name} et ${LC_STAGES[q.next].name} ? Ça grandit un peu.`, fx:{ glow:'#lc-strip' } },
  ];
  if(q.mode === 'next') return [
    { say:'Dans la nature, tout grandit petit à petit, jour après jour.', fx:{ glow:'#lc-strip' } },
    { say:`Après ${LC_STAGES[q.cur].name}, ça grandit encore : cherche l'étape un peu plus grande, de la même famille.`, fx:{ glow:'.lc-options' } },
  ];
  if(q.mode === 'mixed') return [
    { say:'Les petites bêtes ne poussent pas dans la terre ! Garde seulement les étapes de la plante.', fx:{ glow:'.lc-options' } },
    { say:'Une plante commence toujours sous la terre, puis elle sort, grandit, fleurit, et donne un fruit.', fx:{ glow:'.lc-options' } },
  ];
  return [
    { say:'Cherche le tout début : ce qui est le plus petit, ce qu\'on met dans la terre, ou ce qui va éclore.', fx:{ glow:'.lc-options' } },
    { say:'Après chaque étape, demande-toi : qu\'est-ce qui grandit ensuite ?', fx:{ glow:'#lc-strip' } },
  ];
}

registerGame('lifecycle', renderLifecycle);
registerHints('lifecycle', lifecycleHints);
