/* ---------- Mini-jeu : Les boîtes gigognes (Monde des Boîtes, saison 2, v55) ----------
   Sériation : des boîtes de tailles différentes, dans le désordre. L'enfant
   les touche de la plus petite à la plus grande (à l'envers au palier haut),
   et chaque bonne boîte vient se ranger dans la suivante, au-dessus du
   plateau. Nombre de boîtes, écarts et ordre : `nestingRound`
   (js/entities/difficulty/difficulty.js).
   Anti-devinette : une erreur fait trembler la boîte et donne un indice
   parlé ; à la 2ᵉ erreur, nouvelle série de boîtes (relance annulable, celle
   du moteur). On touche, on ne fait pas glisser. */
import { nestingRound } from '../../../entities/difficulty/index.js';
import { shuffle } from '../../../shared/lib/index.js';
import { openModal, speak } from '../../../shared/ui/index.js';
import { gameDiff } from '../../adaptive/index.js';
import { registerHints, setHintQuestion } from '../../hints/index.js';
import {
  flashModal, livesBar, loseLife, onMissionWin, progressDots, registerGame, setSolution, setupLives,
  solSel, stepOk
} from '../../minigame-engine/index.js';
import { bindQuit, gameHeader } from '../../screen/index.js';

// les couleurs des boîtes (carton, puis pastels) : une par boîte
const NEST_COLORS = [
  ['#E3B57E', '#8A5A2B'], ['#F4C6E0', '#C9497F'], ['#C9E7FB', '#3C8FC0'],
  ['#CDEFC2', '#2F9551'], ['#E6DDFB', '#7B5CC0'], ['#FFE9A8', '#B8901A'],
];

// une boîte en carton, vue de face, avec son couvercle ouvert
function nestBoxSVG(color){
  const [fill, edge] = color;
  return `<svg class="nest-box" viewBox="0 0 100 100" aria-hidden="true">
    <path d="M10 34 L2 18 L46 12 L50 30Z M90 34 L98 18 L54 12 L50 30Z" fill="${fill}" stroke="${edge}" stroke-width="4" stroke-linejoin="round" opacity=".85"/>
    <rect x="10" y="30" width="80" height="64" rx="6" fill="${fill}" stroke="${edge}" stroke-width="4.5" stroke-linejoin="round"/>
    <path d="M50 30 V94" stroke="${edge}" stroke-width="4" opacity=".35"/>
    <path d="M20 44 Q26 38 34 40" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".6"/>
  </svg>`;
}

/* Une série : les tailles (du plus petit au plus grand), l'ordre demandé et
   les boîtes mélangées sur le plateau. */
function nestingBuildRound(dd, rng){
  rng = rng || Math.random;
  const cfg = nestingRound(dd);
  const reverse = rng() < cfg.reverse;
  const colors = shuffle(NEST_COLORS.slice()).slice(0, cfg.n);
  const boxes = cfg.sizes.map((size, i)=> ({ i, size, color: colors[i] }));
  // l'ordre à toucher : petite → grande (ou l'inverse)
  const order = reverse ? boxes.slice().reverse() : boxes.slice();
  return { cfg, reverse, boxes: shuffle(boxes.slice()), order };
}

function renderNesting(){
  setupLives('nesting');
  const dd = gameDiff();
  const r = nestingBuildRound(dd);
  const q = { r, idx:0, errors:0 };   // q.idx : boîtes déjà rangées (pour les indices)
  const say = r.reverse
    ? 'Range les boîtes de la plus grande à la plus petite'
    : 'Range les boîtes de la plus petite à la plus grande';
  const arrow = r.reverse
    ? '<span class="nest-arrow" aria-hidden="true"><i class="big"></i>➜<i class="small"></i></span>'
    : '<span class="nest-arrow" aria-hidden="true"><i class="small"></i>➜<i class="big"></i></span>';
  const short = r.reverse ? 'De la plus grande à la plus petite !' : 'De la plus petite à la plus grande !';
  openModal(`
    ${gameHeader('🪆 Les boîtes gigognes', `${arrow}<span>${short}</span>`, say + ' !')}
    ${livesBar()}
    ${progressDots(0, r.order.length)}
    <div class="nest-stack" id="nest-stack" aria-label="Les boîtes rangées"></div>
    <div class="nest-board">
      ${r.boxes.map(b=> `<button type="button" class="nest-btn" data-i="${b.i}" data-size="${b.size}"
          style="--s:${b.size}" aria-label="Boîte ${b.i + 1} sur ${r.boxes.length}, de la plus petite">${nestBoxSVG(b.color)}</button>`).join('')}
    </div>
  `);
  bindQuit();
  setSolution(r.order.map(b=> solSel('.nest-btn', 'i', b.i)));
  setHintQuestion('nesting', q, { choices:'.nest-btn' });
  document.querySelectorAll('.nest-btn').forEach(btn=>{
    btn.onclick = ()=>{
      if(btn.disabled) return;
      const want = r.order[q.idx];
      if(Number(btn.dataset.i) === want.i){
        btn.disabled = true; btn.classList.add('placed');
        q.idx++;
        stepOk(btn);
        nestingDrawStack(r, q.idx);
        document.querySelectorAll('.game-progress i').forEach((d, i)=> d.classList.toggle('on', i < q.idx));
        if(q.idx === r.order.length){ flashModal('ok'); setTimeout(onMissionWin, 450); }
        return;
      }
      // anti-devinette : un indice parlé, puis une autre série à la 2ᵉ erreur
      q.errors++;
      const bigger = Number(btn.dataset.size) > want.size;
      const tip = r.reverse
        ? (bigger ? 'Celle-ci est trop grande : regarde bien les tailles.' : 'Pas encore celle-là : il en reste une plus grande.')
        : (bigger ? 'Pas encore celle-là : il en reste une plus petite.' : 'Celle-ci est trop petite : regarde bien les tailles.');
      if(q.errors >= 2) loseLife(btn, { disable:false, onRetry: renderNesting });
      else if(!loseLife(btn, { disable:false })) speak(tip);   // (sauf si la mission est perdue)
    };
  });
}

// Les boîtes rangées : chacune dans la suivante (dessinées l'une dans l'autre)
function nestingDrawStack(r, n){
  const el = document.getElementById('nest-stack');
  if(!el) return;
  const placed = r.order.slice(0, n);
  // la plus grande dehors, les plus petites dedans
  const bySize = placed.slice().sort((a, b)=> b.size - a.size);
  el.innerHTML = bySize.map((b, k)=> `<span class="nest-in" style="--s:${b.size}; --k:${k}">${nestBoxSVG(b.color)}</span>`).join('');
}

// Indices (v52) : 1. par quelle taille commencer, ou la règle pour la suivante ;
// 2. trois boîtes qui brillent, dont la bonne (jamais celle-là seule).
function nestingHints(q){
  const r = q.r, left = r.order.slice(q.idx);
  const first = q.idx === 0
    ? (r.reverse ? 'Cherche d\'abord la plus grande boîte de toutes.' : 'Cherche d\'abord la plus petite boîte de toutes.')
    : (r.reverse ? 'La suivante est un peu plus petite que celle que tu viens de ranger.' : 'La suivante est un peu plus grande que celle que tu viens de ranger.');
  const want = left[0];
  const others = shuffle(left.slice(1)).slice(0, 2);
  const glow = [want, ...others].map(b=> `.nest-btn[data-i="${b.i}"]`).join(', ');
  return [
    { say: first, fx:{ glow:'.puzzle-hint' } },
    { say: left.length > 1 ? 'Compare les boîtes qui brillent, deux par deux : laquelle vient maintenant ?' : 'Il n\'en reste plus qu\'une : range-la !',
      fx:{ glow } },
  ];
}

registerGame('nesting', renderNesting);
registerHints('nesting', nestingHints);

