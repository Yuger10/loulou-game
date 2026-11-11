/* ---------- Mini-jeu : Combien de cubes ? (Monde des Boîtes, saison 2, v55) ----------
   Se repérer dans l'espace : une pile de cubes dessinée en perspective
   (SVG isométrique). L'enfant choisit le bon nombre parmi 3 réponses, en
   grands chiffres et en points.
   La pile est une « carte des hauteurs » : une tour de cubes par case, donc
   chaque cube du dessus repose toujours sur un autre cube (pile possible).
   Taille et forme : `cubesRound` (js/entities/difficulty/difficulty.js) ;
   au palier haut, certains cubes sont cachés derrière ou dessous.
   Anti-devinette : une mauvaise réponse relance une AUTRE pile. */
import { cubesRound } from '../../../entities/difficulty/index.js';
import { shuffle } from '../../../shared/lib/index.js';
import { openModal } from '../../../shared/ui/index.js';
import { gameDiff } from '../../adaptive/index.js';
import { registerHints, setHintQuestion } from '../../hints/index.js';
import {
  clearActiveTimer, flashModal, livesBar, loseLife, onMissionWin, registerGame, setSolution,
  setupLives, solSel, startTimerIfNeeded, stepOk
} from '../../minigame-engine/index.js';
import { bindQuit, gameHeader } from '../../screen/index.js';

const CUBE_COLORS = [
  ['#FFD1E6', '#F4A9CE', '#D97BA8'], ['#C9E7FB', '#8EC6F0', '#5B9FD4'], ['#D7F2C9', '#A6DE90', '#6DBB57'],
  ['#FFE9A8', '#F6CF6B', '#D9A63A'], ['#E6DDFB', '#C6B4F2', '#9C85D9'],
];

/* Une pile : les hauteurs (heights[y][x]) dans les limites du palier, avec au
   moins deux tours (sinon on compterait une seule tour). */
function cubesBuildStack(dd, rng){
  rng = rng || Math.random;
  const cfg = cubesRound(dd);
  for(let tries = 0; tries < 400; tries++){
    const heights = Array.from({ length: cfg.d }, ()=> Array.from({ length: cfg.w }, ()=> Math.floor(rng() * (cfg.h + 1))));
    const total = heights.flat().reduce((a, b)=> a + b, 0);
    const towers = heights.flat().filter(Boolean).length;
    if(total >= cfg.min && total <= cfg.max && towers >= 2) return { cfg, heights, total };
  }
  // repli sûr : une rangée de tours d'un cube
  const heights = Array.from({ length: cfg.d }, (_, y)=> Array.from({ length: cfg.w }, (_, x)=> (y === 0 && x < cfg.min) ? 1 : 0));
  return { cfg, heights, total: heights.flat().reduce((a, b)=> a + b, 0) };
}
// les cubes, un par un (x, y, z), dans l'ordre où on les dessine (du fond vers l'avant)
function cubesList(heights){
  const out = [];
  heights.forEach((row, y)=> row.forEach((h, x)=>{ for(let z = 0; z < h; z++) out.push({ x, y, z }); }));
  return out.sort((a, b)=> (a.x + a.y) - (b.x + b.y) || a.z - b.z);
}

// Le dessin isométrique : chaque cube a son dessus (clair) et ses deux côtés
function cubesSVG(heights){
  const A = 22, B = 12.7, C = 25;
  const cubes = cubesList(heights);
  const pts = (arr)=> arr.map(p=> p.map(v=> v.toFixed(1)).join(',')).join(' ');
  const xs = [], ys = [];
  const shapes = cubes.map(c=>{
    const ox = (c.x - c.y) * A, oy = (c.x + c.y) * B - c.z * C;
    const top = [[ox, oy], [ox + A, oy + B], [ox, oy + 2 * B], [ox - A, oy + B]];
    const left = [[ox - A, oy + B], [ox, oy + 2 * B], [ox, oy + 2 * B + C], [ox - A, oy + B + C]];
    const right = [[ox, oy + 2 * B], [ox + A, oy + B], [ox + A, oy + B + C], [ox, oy + 2 * B + C]];
    [...top, ...left, ...right].forEach(([px, py])=>{ xs.push(px); ys.push(py); });
    const col = CUBE_COLORS[(c.x + c.y * 2) % CUBE_COLORS.length];
    return `<g class="cube" data-col="${c.x}-${c.y}" data-z="${c.z}">
      <polygon points="${pts(left)}" fill="${col[1]}"/><polygon points="${pts(right)}" fill="${col[2]}"/><polygon points="${pts(top)}" fill="${col[0]}"/>
    </g>`;
  });
  const pad = 6, minX = Math.min(...xs) - pad, minY = Math.min(...ys) - pad;
  const w = Math.max(...xs) - minX + pad, h = Math.max(...ys) - minY + pad;
  return `<svg class="cubes-svg" viewBox="${minX.toFixed(1)} ${minY.toFixed(1)} ${w.toFixed(1)} ${h.toFixed(1)}" role="img" aria-label="Une pile de cubes">
    <g stroke="#3D3552" stroke-width="1.6" stroke-linejoin="round">${shapes.join('')}</g>
  </svg>`;
}

// trois réponses : la bonne et deux voisines, toutes différentes et au moins 1
function cubesOptions(total, rng){
  rng = rng || Math.random;
  const set = new Set([total]);
  const near = shuffle([-2, -1, 1, 2, 3]);
  for(const k of near){ if(set.size >= 3) break; if(total + k >= 1) set.add(total + k); }
  return shuffle([...set]);
}
const cubeDots = (n)=> `<span class="cube-dots" aria-hidden="true">${'<i></i>'.repeat(n)}</span>`;

// la pile précédente : une relance en tire toujours une AUTRE (anti-devinette)
let cubesLast = '';
function renderCubes(){
  setupLives('cubes');
  const dd = gameDiff();
  let stack = cubesBuildStack(dd);
  for(let k = 0; k < 8 && JSON.stringify(stack.heights) === cubesLast; k++) stack = cubesBuildStack(dd);
  cubesLast = JSON.stringify(stack.heights);
  const opts = cubesOptions(stack.total);
  const q = { heights: stack.heights, total: stack.total, hidden: stack.cfg.d > 1 };
  const say = 'Combien y a-t-il de cubes dans la pile ?';
  openModal(`
    ${gameHeader('🧊 Combien de cubes ?', say, say)}
    ${livesBar()}
    <div class="cubes-stage">${cubesSVG(stack.heights)}</div>
    ${q.hidden ? '<p class="cubes-tip">💡 Les cubes du dessus sont toujours posés sur d\'autres cubes.</p>' : ''}
    <div class="num-options cubes-options">
      ${opts.map(o=> `<button class="num-btn cube-opt" data-v="${o}" aria-label="${o}"><b>${o}</b>${cubeDots(o)}</button>`).join('')}
    </div>
  `);
  bindQuit();
  startTimerIfNeeded('cubes');
  setSolution([solSel('.cube-opt', 'v', stack.total)]);
  setHintQuestion('cubes', q, { choices:'.cube-opt' });
  document.querySelectorAll('.cube-opt').forEach(btn=>{
    btn.onclick = ()=>{
      if(Number(btn.dataset.v) === stack.total){ clearActiveTimer(); stepOk(btn); flashModal('ok'); setTimeout(onMissionWin, 350); }
      else loseLife(btn, { onRetry: renderCubes });
    };
  });
}

// Indices (v52) : 1. compter tour par tour (et ceux qui sont cachés dessous) ;
// 2. une tour qui brille, avec son nombre de cubes : il reste à ajouter les autres.
function cubesHints(q){
  const towers = [];
  q.heights.forEach((row, y)=> row.forEach((h, x)=>{ if(h) towers.push({ x, y, h }); }));
  // la plus haute tour, mais jamais une tour qui contiendrait tous les cubes
  const t = towers.slice().sort((a, b)=> b.h - a.h)[0];
  const first = q.hidden
    ? 'Les cubes du dessus sont toujours posés sur d\'autres cubes : compte aussi ceux qui sont cachés dessous, tour par tour.'
    : 'Compte les cubes tour par tour : combien dans chaque tour ?';
  return [
    { say: first, fx:{ glow:'.cubes-stage' } },
    { say: `La tour qui brille a ${t.h} cube${t.h > 1 ? 's' : ''}. Compte les autres tours, et ajoute-les.`,
      fx:{ glow:`.cube[data-col="${t.x}-${t.y}"]`, html:`<span class="hint-strip"><i>${t.h}</i><i class="q">+ ?</i></span>` } },
  ];
}

registerGame('cubes', renderCubes);
registerHints('cubes', cubesHints);
