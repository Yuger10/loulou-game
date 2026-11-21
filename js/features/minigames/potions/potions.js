/* ---------- Mini-jeu : Les potions de couleurs (Royaume Arc-en-ciel, saison 2) ----------
   Félix mélange ses potions comme on mélange la peinture :
   rouge + jaune = orange, bleu + jaune = vert, rouge + bleu = violet,
   rouge + blanc = rose, noir + blanc = gris.
   Selon le palier (`potionsRound`, js/entities/difficulty/difficulty.js) :
     name      reconnaître la couleur nommée à voix haute (GS)
     mix       le mélange : quelle couleur obtient-on ? (primaires, puis tous)
     rainbow   remettre les couleurs qui manquent à l'arc-en-ciel, dans l'ordre
     inverse   le mélange à l'envers : « orange = rouge + ? »
   Accessibilité : une couleur n'est JAMAIS donnée par la couleur seule :
   chaque fiole porte son initiale (R, J, B, O, Ve, Vi…) et son nom, dit à
   voix haute et écrit dessous.
   Anti-devinette : une erreur relance un AUTRE mélange. */
import { potionsRound } from '../../../entities/difficulty/index.js';
import { shuffle } from '../../../shared/lib/index.js';
import { openModal } from '../../../shared/ui/index.js';
import { gameDiff } from '../../adaptive/index.js';
import { registerHints, setHintQuestion } from '../../hints/index.js';
import {
  clearActiveTimer, flashModal, livesBar, loseLife, onMissionWin, progressDots, registerGame,
  setSolution, setupLives, solSel, startTimerIfNeeded, stepOk
} from '../../minigame-engine/index.js';
import { bindQuit, gameHeader } from '../../screen/index.js';

const POTION_COLORS = {
  rouge:  { fill:'#E8344E', mark:'R',  ink:'#fff',    like:'une fraise 🍓' },
  orange: { fill:'#FF9A3C', mark:'O',  ink:'#2B2140', like:'une orange 🍊' },
  jaune:  { fill:'#FFD95A', mark:'J',  ink:'#2B2140', like:'le soleil ☀️' },
  vert:   { fill:'#3FB86A', mark:'Ve', ink:'#fff',    like:'une feuille 🍃' },
  bleu:   { fill:'#3F7FD8', mark:'B',  ink:'#fff',    like:'la mer 🌊' },
  violet: { fill:'#8A5CD0', mark:'Vi', ink:'#fff',    like:'le raisin 🍇' },
  rose:   { fill:'#FF9CC8', mark:'Ro', ink:'#2B2140', like:'un flamant rose 🦩' },
  blanc:  { fill:'#FFFFFF', mark:'Bl', ink:'#2B2140', like:'la neige ❄️' },
  noir:   { fill:'#2B2140', mark:'N',  ink:'#fff',    like:'la nuit 🌙' },
  gris:   { fill:'#9AA3AF', mark:'G',  ink:'#2B2140', like:'un éléphant 🐘' },
};
// les mélanges de la peinture : [couleur, couleur, résultat] ; les 3 premiers sont les primaires
const COLOR_MIXES = [['rouge', 'jaune', 'orange'], ['bleu', 'jaune', 'vert'], ['rouge', 'bleu', 'violet'], ['rouge', 'blanc', 'rose'], ['noir', 'blanc', 'gris']];
// l'arc-en-ciel, de l'extérieur (en haut) à l'intérieur ; l'indigo est laissé de côté
const RAINBOW = ['rouge', 'orange', 'jaune', 'vert', 'bleu', 'violet'];

function potionsBuildRound(dd, rng){
  rng = rng || Math.random;
  const cfg = potionsRound(dd);
  const pick = (arr)=> arr[Math.floor(rng() * arr.length)];
  const mode = pick(cfg.modes);
  const others = (exclude, n)=> shuffle(Object.keys(POTION_COLORS).filter(c=> !exclude.includes(c))).slice(0, n);
  if(mode === 'name'){
    const target = pick(['rouge', 'jaune', 'bleu', 'vert', 'orange', 'violet', 'rose']);
    return { cfg, mode, target, options: shuffle([target, ...others([target, 'blanc', 'noir', 'gris'], 2)]) };
  }
  if(mode === 'rainbow'){
    const holes = shuffle(RAINBOW.map((c, i)=> i)).slice(0, cfg.holes).sort((a, b)=> a - b);
    return { cfg, mode, holes, missing: holes.map(i=> RAINBOW[i]), options: shuffle(holes.map(i=> RAINBOW[i])) };
  }
  const mix = pick(COLOR_MIXES.slice(0, cfg.mixes));
  const [a, b, r] = rng() < .5 ? mix : [mix[1], mix[0], mix[2]];
  if(mode === 'inverse') return { cfg, mode, a, b, r, options: shuffle([b, ...others([a, b, r], 2)]) };
  return { cfg, mode:'mix', a, b, r, options: shuffle([r, ...others([a, b, r], 2)]) };
}

// une fiole : la couleur, et son initiale par-dessus (repère non coloré)
function potionSVG(c){
  const p = POTION_COLORS[c];
  return `<svg class="po-svg" viewBox="0 0 60 72" aria-hidden="true">
    <rect x="23" y="4" width="14" height="16" rx="3" fill="#EEF0FF" stroke="#6A4FB3" stroke-width="2.5"/>
    <rect x="20" y="2" width="20" height="6" rx="3" fill="#C9B8F2" stroke="#6A4FB3" stroke-width="2"/>
    <path d="M23 20 L23 28 C10 34 6 44 8 54 C10 64 20 70 30 70 C40 70 50 64 52 54 C54 44 50 34 37 28 L37 20Z" fill="${p.fill}" stroke="#6A4FB3" stroke-width="3" stroke-linejoin="round"/>
    <path d="M16 46 Q18 38 26 36" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".55"/>
    <text x="30" y="58" text-anchor="middle" font-size="${p.mark.length > 1 ? 15 : 18}" font-weight="800" fill="${p.ink}" font-family="Fredoka, Nunito, sans-serif">${p.mark}</text>
  </svg>`;
}
const potionBtn = (c, k)=> `<button class="po-opt" data-c="${c}"${k != null ? ` data-k="${k}"` : ''} aria-label="${c}">${potionSVG(c)}<span class="po-name">${c}</span></button>`;
const potionShow = (c)=> `<span class="po-show" data-c="${c}">${potionSVG(c)}<span class="po-name">${c}</span></span>`;

let potionsLast = '';
function renderPotions(){
  setupLives('potions');
  const dd = gameDiff();
  let r = potionsBuildRound(dd);
  const key = (x)=> JSON.stringify([x.mode, x.target, x.a, x.b, x.holes, x.options]);
  for(let k = 0; k < 8 && key(r) === potionsLast; k++) r = potionsBuildRound(dd);
  potionsLast = key(r);
  const ok = ()=>{ clearActiveTimer(); flashModal('ok'); setTimeout(onMissionWin, 450); };

  if(r.mode === 'rainbow'){
    const say = `L'arc-en-ciel de Biscotte a perdu ${r.holes.length} couleurs ! Touche les couleurs qui manquent, dans l'ordre, du haut vers le bas.`;
    const bands = RAINBOW.map((c, i)=> r.holes.includes(i)
      ? `<span class="po-band hole" data-i="${i}">?</span>`
      : `<span class="po-band" data-i="${i}" data-c="${c}" style="background:${POTION_COLORS[c].fill}"><b style="color:${POTION_COLORS[c].ink}">${POTION_COLORS[c].mark}</b> ${c}</span>`).join('');
    openModal(`
      ${gameHeader('🌈 Les potions de couleurs', 'Répare l\'arc-en-ciel', say)}
      ${livesBar()}
      <div class="po-rainbow" id="po-stage" data-mode="rainbow">${bands}</div>
      <div class="po-options">${r.options.map(c=> potionBtn(c)).join('')}</div>
      <div id="po-progress">${progressDots(0, r.missing.length)}</div>
    `);
    bindQuit(); startTimerIfNeeded('potions');
    setSolution(r.missing.map(c=> solSel('.po-opt', 'c', c)));
    setHintQuestion('potions', { mode:'rainbow' }, { choices:'.po-opt' });
    let pos = 0;
    document.querySelectorAll('.po-opt').forEach(b=> b.onclick = ()=>{
      if(b.classList.contains('done')) return;
      if(b.dataset.c !== r.missing[pos]){ loseLife(b, { onRetry: renderPotions, disable:false }); return; }
      stepOk(b); b.classList.add('done');
      const band = document.querySelector(`.po-band[data-i="${r.holes[pos]}"]`);
      const c = r.missing[pos];
      if(band){ band.classList.remove('hole'); band.dataset.c = c; band.style.background = POTION_COLORS[c].fill; band.innerHTML = `<b style="color:${POTION_COLORS[c].ink}">${POTION_COLORS[c].mark}</b> ${c}`; }
      pos++;
      const p = document.getElementById('po-progress'); if(p) p.innerHTML = progressDots(pos, r.missing.length);
      if(pos === r.missing.length) ok();
    });
    return;
  }

  let title, say, stage, good;
  if(r.mode === 'name'){
    title = `Touche la potion ${r.target}`;
    say = `Touche la potion de couleur ${r.target}.`;
    stage = '';
    good = r.target;
  } else if(r.mode === 'inverse'){
    title = `${r.r} = ${r.a} + ?`;
    say = `Avec quelle couleur faut-il mélanger le ${r.a} pour obtenir du ${r.r} ?`;
    stage = `<div class="po-eq" id="po-stage" data-mode="inverse" data-a="${r.a}" data-r="${r.r}">${potionShow(r.a)}<b>+</b><span class="po-show po-q">?</span><b>=</b>${potionShow(r.r)}</div>`;
    good = r.b;
  } else {
    title = `${r.a} + ${r.b} = ?`;
    say = `Félix mélange du ${r.a} et du ${r.b}. Quelle couleur obtient-il ?`;
    stage = `<div class="po-eq" id="po-stage" data-mode="mix" data-a="${r.a}" data-b="${r.b}">${potionShow(r.a)}<b>+</b>${potionShow(r.b)}<b>=</b><span class="po-show po-q">?</span></div>`;
    good = r.r;
  }
  openModal(`
    ${gameHeader('🧪 Les potions de couleurs', title, say)}
    ${livesBar()}
    ${stage || `<div class="po-eq" id="po-stage" data-mode="name" data-target="${r.target}"><span class="po-ask">🧪 ${r.target}</span></div>`}
    <div class="po-options">${r.options.map(c=> potionBtn(c)).join('')}</div>
  `);
  bindQuit(); startTimerIfNeeded('potions');
  setSolution([solSel('.po-opt', 'c', good)]);
  setHintQuestion('potions', { mode: r.mode, target: r.target, a: r.a, b: r.b, r: r.r }, { choices:'.po-opt' });
  document.querySelectorAll('.po-opt').forEach(b=> b.onclick = ()=>{
    if(b.dataset.c === good){
      stepOk(b);
      const q = document.querySelector('.po-q');
      if(q) q.outerHTML = potionShow(good);
      ok();
    } else loseLife(b, { onRetry: renderPotions });
  });
}

// Indices (v52) : 1. ce que l'on fait (écouter, mélanger, l'ordre) ; 2. un
// repère (un objet de cette couleur, ce qui n'est pas la réponse). Jamais la couleur.
function potionsHints(q){
  if(q.mode === 'name') return [
    { say:'Écoute bien le nom de la couleur, puis regarde chaque potion.', fx:{ glow:'.po-options' } },
    { say:`Pense à quelque chose de cette couleur : ${POTION_COLORS[q.target].like}`, fx:{ glow:'.po-options' } },
  ];
  if(q.mode === 'rainbow') return [
    { say:'Un arc-en-ciel a toujours ses couleurs dans le même ordre : il commence par le rouge, en haut, et finit par le violet, en bas.', fx:{ glow:'#po-stage' } },
    { say:'Regarde la couleur juste au-dessus du trou et celle juste en dessous : la couleur qui manque est entre les deux.', fx:{ glow:'#po-stage' } },
  ];
  if(q.mode === 'inverse') return [
    { say:`Cherche la couleur qui, mélangée au ${q.a}, donne du ${q.r}.`, fx:{ glow:'#po-stage' } },
    { say:`Essaie chaque potion dans ta tête : ${q.a}, plus cette potion… est-ce que ça fait du ${q.r} ?`, fx:{ glow:'.po-options' } },
  ];
  return [
    { say:'Quand on mélange deux peintures, on obtient une nouvelle couleur, un peu des deux à la fois.', fx:{ glow:'#po-stage' } },
    { say:`Mélange-les dans ta tête : la nouvelle couleur n'est plus ${q.a}, ni ${q.b}.`, fx:{ glow:'.po-options' } },
  ];
}

registerGame('potions', renderPotions);
registerHints('potions', potionsHints);
