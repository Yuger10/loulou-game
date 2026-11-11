/* ---------- Mini-jeu : La recette (Royaume des Bonbons, saison 2) ----------
   Mesurer en cuisine : comparer des quantités, compter des cuillères, lire
   un verre doseur gradué.
   Quatre façons de jouer, selon le palier (`recipeRound`, js/entities/difficulty/difficulty.js) :
     bowls    « Quel bol a le plus (le moins) de sucre ? » (3 bols)
     balance  « Quel sac est le plus lourd (léger) ? » (la balance penche)
     spoons   mettre le bon nombre de cuillères (jusqu'à 10), puis « C'est prêt ! »
     cup      verser jusqu'au bon trait d'un verre doseur : en verres (de 1
              en 1), puis en grammes et centilitres (traits de 10 en 10 ou de
              50 en 50, seuls quelques traits portent un nombre)
   Anti-devinette : une erreur relance une AUTRE recette. */
import { recipeRound } from '../../../entities/difficulty/index.js';
import { shuffle } from '../../../shared/lib/index.js';
import { openModal } from '../../../shared/ui/index.js';
import { gameDiff } from '../../adaptive/index.js';
import { registerHints, setHintQuestion } from '../../hints/index.js';
import {
  clearActiveTimer, flashModal, livesBar, loseLife, onMissionWin, registerGame, setSolution,
  setupLives, solSel, startTimerIfNeeded, stepOk
} from '../../minigame-engine/index.js';
import { bindQuit, gameHeader } from '../../screen/index.js';

// des couleurs bien visibles dans le bol (pas de blanc sur blanc)
const RECIPE_INGREDIENTS = [
  { what:'farine', g:'f', fill:'#EBCB95' }, { what:'cacao', g:'m', fill:'#8B5A3C' }, { what:'sucre rose', g:'m', fill:'#FF9CC8' },
  { what:'sirop', g:'m', fill:'#F2B04E' }, { what:'confiture', g:'f', fill:'#E8344E' },
];
const CUP_LIQUIDS = [{ what:'lait', fill:'#FFFFFF' }, { what:'jus de fraise', fill:'#FF8FB8' }, { what:'sirop', fill:'#F2B04E' }];
const unitSay = (v, unit)=> unit === 'verres' ? `${v} verre${v > 1 ? 's' : ''}` : unit === 'g' ? `${v} grammes` : `${v} centilitres`;
const unitShort = (v, unit)=> unit === 'verres' ? `${v} verre${v > 1 ? 's' : ''}` : `${v} ${unit}`;

function recipeBuildRound(dd, rng){
  rng = rng || Math.random;
  const cfg = recipeRound(dd);
  const pick = (arr)=> arr[Math.floor(rng() * arr.length)];
  const ask = pick(cfg.asks);
  if(ask === 'bowls'){
    const amounts = shuffle(cfg.amounts.slice());
    return { cfg, ask, most: rng() < .5, amounts, ing: pick(RECIPE_INGREDIENTS) };
  }
  if(ask === 'balance'){
    const heavy = rng() < .5 ? 'left' : 'right';
    return { cfg, ask, heavy, heaviest: rng() < .5 };
  }
  if(ask === 'spoons'){
    const n = cfg.min + Math.floor(rng() * (cfg.max - cfg.min + 1));
    return { cfg, ask, n, ing: pick(RECIPE_INGREDIENTS.filter(i=> i.what !== 'confiture')) };
  }
  const scale = pick(cfg.scales);
  const marks = [];
  for(let v = scale.step; v <= scale.max; v += scale.step) marks.push(v);
  // la cible : un trait sans nombre écrit, quand il y en a (il faut compter)
  const free = marks.filter(v=> v % scale.label !== 0);
  const target = pick(free.length ? free : marks);
  return { cfg, ask:'cup', scale, marks, target, liquid: pick(CUP_LIQUIDS) };
}
const recipeKey = (r)=> JSON.stringify([r.ask, r.amounts, r.most, r.heavy, r.heaviest, r.n, r.target, r.scale && r.scale.unit]);

// un bol vu de face, avec un tas plus ou moins haut (amount de 1 à 5)
function bowlSVG(amount, fill){
  const top = 58 - amount * 10;
  return `<svg class="recipe-bowl" viewBox="0 0 100 100" aria-hidden="true">
    <path d="M14 66 C20 ${top + 14} 36 ${top} 50 ${top} C64 ${top} 80 ${top + 14} 86 66Z" fill="${fill}" stroke="#7A4524" stroke-width="2.5" stroke-linejoin="round"/>
    <path d="M38 ${top + 8} Q46 ${top + 3} 54 ${top + 5}" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".6"/>
    <path d="M6 62 H94 Q90 96 50 96 Q10 96 6 62Z" fill="#9FDCF5" stroke="#3F7FA8" stroke-width="3" stroke-linejoin="round"/>
    <path d="M16 70 Q50 76 84 70" fill="none" stroke="#fff" stroke-width="3" opacity=".6"/>
  </svg>`;
}
// la balance : le plateau du sac lourd descend
function balanceSVG(heavy){
  const tilt = heavy === 'left' ? -12 : 12;
  return `<svg class="recipe-balance" viewBox="0 0 200 130" aria-hidden="true">
    <path d="M100 30 V112 M70 118 H130" stroke="#8A4A2B" stroke-width="6" stroke-linecap="round"/>
    <g transform="rotate(${tilt} 100 30)">
      <path d="M30 30 H170" stroke="#8A4A2B" stroke-width="6" stroke-linecap="round"/>
      <path d="M30 30 L16 66 M30 30 L44 66 M170 30 L156 66 M170 30 L184 66" stroke="#B5702E" stroke-width="2"/>
      <path d="M10 66 H50 Q48 76 30 76 Q12 76 10 66Z M150 66 H190 Q188 76 170 76 Q152 76 150 66Z" fill="#F6D7A8" stroke="#8A4A2B" stroke-width="2.5"/>
      <g transform="rotate(${-tilt} 30 66)"><path d="M18 66 Q16 44 26 40 L34 40 Q44 44 42 66Z" fill="#FF8FB8" stroke="#A8456A" stroke-width="2.5"/></g>
      <g transform="rotate(${-tilt} 170 66)"><path d="M158 66 Q156 44 166 40 L174 40 Q184 44 182 66Z" fill="#9FDCF5" stroke="#3F7FA8" stroke-width="2.5"/></g>
    </g>
    <circle cx="100" cy="30" r="7" fill="#FFD95A" stroke="#8A4A2B" stroke-width="2.5"/>
  </svg>`;
}
const bagSVG = (fill, edge)=> `<svg class="recipe-bag" viewBox="0 0 60 60" aria-hidden="true"><path d="M12 56 Q8 22 22 16 L38 16 Q52 22 48 56Z" fill="${fill}" stroke="${edge}" stroke-width="3" stroke-linejoin="round"/><path d="M22 16 Q30 6 38 16" fill="none" stroke="${edge}" stroke-width="3"/></svg>`;
const spoonIcon = (fill)=> `<svg class="recipe-spoon" viewBox="0 0 40 40" aria-hidden="true"><ellipse cx="14" cy="14" rx="10" ry="8" fill="#E7C29A" stroke="#8A4A2B" stroke-width="2"/><ellipse cx="14" cy="13" rx="6" ry="4" fill="${fill}"/><path d="M21 20 L36 35" stroke="#8A4A2B" stroke-width="4" stroke-linecap="round"/></svg>`;

// la recette précédente : une relance en tire toujours une AUTRE (anti-devinette)
let recipeLast = '';
function renderRecipe(){
  setupLives('recipe');
  const dd = gameDiff();
  let r = recipeBuildRound(dd);
  for(let k = 0; k < 8 && recipeKey(r) === recipeLast; k++) r = recipeBuildRound(dd);
  recipeLast = recipeKey(r);
  const ok = ()=>{ clearActiveTimer(); flashModal('ok'); setTimeout(onMissionWin, 450); };
  const retry = (el, o)=> loseLife(el, Object.assign({ onRetry: renderRecipe }, o || {}));

  if(r.ask === 'bowls'){
    const word = r.most ? 'le plus' : 'le moins';
    const best = r.most ? Math.max(...r.amounts) : Math.min(...r.amounts);
    const say = `Quel bol contient ${word} de ${r.ing.what} ?`;
    openModal(`
      ${gameHeader('🥣 La recette', say, `Cacao prépare sa recette. ${say}`)}
      ${livesBar()}
      <div class="recipe-options">${r.amounts.map(a=> `<button class="recipe-opt" data-v="${a}" aria-label="Un bol">${bowlSVG(a, r.ing.fill)}</button>`).join('')}</div>
    `);
    bindQuit(); startTimerIfNeeded('recipe');
    setSolution([solSel('.recipe-opt', 'v', best)]);
    setHintQuestion('recipe', { ask:'bowls', most: r.most }, { choices:'.recipe-opt' });
    document.querySelectorAll('.recipe-opt').forEach(b=> b.onclick = ()=>{ if(Number(b.dataset.v) === best){ stepOk(b); ok(); } else retry(b); });
    return;
  }

  if(r.ask === 'balance'){
    const word = r.heaviest ? 'le plus lourd' : 'le plus léger';
    const good = r.heaviest ? r.heavy : (r.heavy === 'left' ? 'right' : 'left');
    const say = `Quel sac est ${word} ?`;
    openModal(`
      ${gameHeader('⚖️ La recette', say, `Regarde la balance. ${say}`)}
      ${livesBar()}
      <div class="recipe-stage">${balanceSVG(r.heavy)}</div>
      <div class="recipe-options">
        <button class="recipe-opt" data-v="left" aria-label="Le sac rose">${bagSVG('#FF8FB8', '#A8456A')}</button>
        <button class="recipe-opt" data-v="right" aria-label="Le sac bleu">${bagSVG('#9FDCF5', '#3F7FA8')}</button>
      </div>
    `);
    bindQuit(); startTimerIfNeeded('recipe');
    setSolution([solSel('.recipe-opt', 'v', good)]);
    setHintQuestion('recipe', { ask:'balance', heaviest: r.heaviest }, { choices:'.recipe-opt' });
    document.querySelectorAll('.recipe-opt').forEach(b=> b.onclick = ()=>{ if(b.dataset.v === good){ stepOk(b); ok(); } else retry(b); });
    return;
  }

  if(r.ask === 'spoons'){
    let count = 0;
    const say = `Mets ${r.n} cuillères de ${r.ing.what} dans le bol, puis appuie sur « C'est prêt ! ».`;
    openModal(`
      ${gameHeader('🥄 La recette', `${r.n} cuillères de ${r.ing.what}`, `La recette de Cacao dit : ${r.n} cuillères de ${r.ing.what}. ${say}`)}
      ${livesBar()}
      <p class="recipe-ask" data-n="${r.n}">📜 ${r.n} cuillères de ${r.ing.what}</p>
      <div class="recipe-stage recipe-spoons" id="recipe-spoons" aria-live="polite"></div>
      <div class="recipe-actions">
        <button class="btn-ghost recipe-undo" id="recipe-undo" aria-label="Enlever une cuillère">↩️</button>
        <button class="recipe-add" id="recipe-add">🥄 Une cuillère</button>
        <button class="btn-primary recipe-done" id="recipe-done">C'est prêt !</button>
      </div>
    `);
    bindQuit(); startTimerIfNeeded('recipe');
    setSolution([...Array(r.n).fill('#recipe-add'), '#recipe-done']);
    setHintQuestion('recipe', { ask:'spoons', n: r.n }, { choices:'.recipe-done' });
    const box = document.getElementById('recipe-spoons');
    const draw = ()=>{ box.innerHTML = Array.from({ length: count }, ()=> spoonIcon(r.ing.fill)).join(''); };
    document.getElementById('recipe-add').onclick = ()=>{ if(count < 12){ count++; draw(); } };
    document.getElementById('recipe-undo').onclick = ()=>{ if(count > 0){ count--; draw(); } };
    document.getElementById('recipe-done').onclick = (e)=>{
      if(count === r.n){ stepOk(e.currentTarget); ok(); }
      else retry(e.currentTarget, { disable:false });
    };
    return;
  }

  // le verre doseur : des traits à toucher ; seuls certains portent un nombre
  const { scale, marks, target } = r;
  const say = `Verse ${unitSay(target, scale.unit)} de ${r.liquid.what} : touche le bon trait du verre doseur.`;
  const pct = (v)=> 6 + (v / scale.max) * 86;
  openModal(`
    ${gameHeader('🥛 La recette', `Verse ${unitShort(target, scale.unit)} de ${r.liquid.what}`, say)}
    ${livesBar()}
    <p class="recipe-ask" data-target="${target}" data-unit="${scale.unit}">📜 ${unitShort(target, scale.unit)} de ${r.liquid.what}</p>
    <div class="recipe-stage">
      <div class="cup" style="--liquid:${r.liquid.fill}">
        <span class="cup-liquid" id="cup-liquid"></span>
        <span class="cup-zero" style="bottom:6%">0</span>
        ${marks.map(v=> `<button class="cup-mark${v % scale.label === 0 ? ' labeled' : ''}" data-v="${v}" style="bottom:${pct(v)}%" aria-label="trait ${v % scale.label === 0 ? v : ''}">
          <i></i>${v % scale.label === 0 ? `<b>${v}</b>` : ''}</button>`).join('')}
        <span class="cup-unit">${scale.unit === 'verres' ? 'verres' : scale.unit}</span>
      </div>
    </div>
  `);
  bindQuit(); startTimerIfNeeded('recipe');
  setSolution([solSel('.cup-mark', 'v', target)]);
  setHintQuestion('recipe', { ask:'cup', step: scale.step, label: scale.label, unit: scale.unit, target }, { choices:'.cup-mark' });
  document.querySelectorAll('.cup-mark').forEach(b=> b.onclick = ()=>{
    document.getElementById('cup-liquid').style.height = `${pct(Number(b.dataset.v))}%`;
    if(Number(b.dataset.v) === target){ stepOk(b); ok(); } else retry(b, { disable:false });
  });
}

// Indices (v52) : 1. la méthode ; 2. par où commencer. Jamais la réponse.
function recipeHints(q){
  if(q.ask === 'bowls') return [
    { say:'Regarde jusqu\'où chaque bol est rempli.', fx:{ glow:'.recipe-options' } },
    { say:`Compare les bols deux par deux, et garde à chaque fois celui qui en a ${q.most ? 'le plus' : 'le moins'}.`, fx:{ glow:'.recipe-options' } },
  ];
  if(q.ask === 'balance') return [
    { say:'Sur une balance, le côté le plus lourd descend, et le plus léger monte.', fx:{ glow:'.recipe-stage' } },
    { say:`Regarde de quel côté la balance penche, puis trouve le sac ${q.heaviest ? 'qui la fait descendre' : 'qui est remonté'}.`, fx:{ glow:'.recipe-stage' } },
  ];
  if(q.ask === 'spoons') return [
    { say:'Compte chaque cuillère en la mettant dans le bol : une, deux, trois…', fx:{ glow:'#recipe-add' } },
    { say:`Il en faut ${q.n}. Compte celles qui sont déjà dans le bol : il en manque, ou il y en a trop ?`, fx:{ glow:'#recipe-spoons' } },
  ];
  const lab = Math.floor(q.target / q.label) * q.label;
  return q.step === 1 && q.label === 1 ? [
    { say:'Lis les nombres à côté des traits du verre doseur.', fx:{ glow:'.cup' } },
    { say:'Le premier trait, c\'est 1 verre ; le suivant, 2 verres… Monte trait par trait.', fx:{ glow:'.cup' } },
  ] : [
    { say:`Les traits vont de ${q.step} en ${q.step}. Compte-les à partir de zéro.`, fx:{ glow:'.cup' } },
    { say:`Pars du trait ${lab === 0 ? 'zéro' : lab}, puis compte de ${q.step} en ${q.step}.`, fx:{ glow: lab ? `.cup-mark[data-v="${lab}"]` : '.cup' } },
  ];
}

registerGame('recipe', renderRecipe);
registerHints('recipe', recipeHints);
