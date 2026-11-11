/* ---------- Mini-jeu : L'étagère magique (Coffre aux Jouets Doux, saison 2) ----------
   Se repérer dans un tableau à double entrée : une couleur par ligne, une
   forme par colonne. On range chaque jouet dans sa case (là où sa ligne et
   sa colonne se croisent).
   Trois façons de jouer, selon le palier (`shelfRound`, js/entities/difficulty/difficulty.js) :
     place   ranger 1 à 3 jouets, un par un (le prochain attend dans le panier)
     find    « quel jouet va dans cette case ? » : on choisit parmi 3 jouets
     coords  poser un cadeau à la case dite à voix haute (« ligne rose,
             colonne étoile ») : lire des coordonnées
   Anti-devinette : une mauvaise case relance une AUTRE étagère. */
import { shelfRound } from '../../../entities/difficulty/index.js';
import { SQ_COLORS } from '../../../entities/squishy/index.js';
import { shuffle } from '../../../shared/lib/index.js';
import { openModal, speak } from '../../../shared/ui/index.js';
import { gameDiff } from '../../adaptive/index.js';
import { registerHints, setHintQuestion } from '../../hints/index.js';
import {
  clearActiveTimer, flashModal, livesBar, loseLife, onMissionWin, progressDots, registerGame,
  setSolution, setupLives, solSel, startTimerIfNeeded, stepOk
} from '../../minigame-engine/index.js';
import { bindQuit, gameHeader } from '../../screen/index.js';

const SHELF_COLORS = ['rose', 'bleu', 'jaune', 'vert'];
function shelfStar(){
  return Array.from({ length:10 }, (_, i)=>{
    const r = i % 2 ? 20 : 44, a = (-90 + i * 36) * Math.PI / 180;
    return `${(50 + r * Math.cos(a)).toFixed(1)},${(54 + r * Math.sin(a)).toFixed(1)}`;
  }).join(' ');
}
// g : genre du nom (accord de la couleur) ; face : centre du visage
const SHELF_SHAPES = {
  rond:     { g:'m', s:'rond',     art:'le rond',     face:[50,54], el:'<circle cx="50" cy="52" r="38"/>' },
  carre:    { g:'m', s:'carré',    art:'le carré',    face:[50,54], el:'<rect x="14" y="16" width="72" height="72" rx="12"/>' },
  triangle: { g:'m', s:'triangle', art:'le triangle', face:[50,66], el:'<polygon points="50,10 92,88 8,88"/>' },
  etoile:   { g:'f', s:'étoile',   art:'l\'étoile',   face:[50,58], el:`<polygon points="${shelfStar()}"/>` },
  coeur:    { g:'m', s:'cœur',     art:'le cœur',     face:[50,46], el:'<path d="M50 90 C22 70 6 52 8 34 C10 16 34 10 50 28 C66 10 90 16 92 34 C94 52 78 70 50 90Z"/>' },
};
const colorAdj = (color, shape)=> SQ_COLORS[color].adj[SHELF_SHAPES[shape].g === 'f' ? 2 : 0];
const toyName = (t)=> `${SHELF_SHAPES[t.shape].art} ${colorAdj(t.color, t.shape)}`;

// un jouet : la forme, sa couleur, un petit visage (`plain` : la forme seule, en blanc, pour la colonne)
function shelfToySVG(shape, color, plain){
  const sh = SHELF_SHAPES[shape];
  const c = plain ? { fill:'#fff', edge:'#8E7FA6' } : SQ_COLORS[color];
  const [fx, fy] = sh.face;
  const face = plain ? '' : `<ellipse cx="${fx - 8}" cy="${fy}" rx="3.4" ry="4.2" fill="#2B2140"/><ellipse cx="${fx + 8}" cy="${fy}" rx="3.4" ry="4.2" fill="#2B2140"/>
    <path d="M${fx - 5} ${fy + 7} Q${fx} ${fy + 11} ${fx + 5} ${fy + 7}" fill="none" stroke="#8C2F3F" stroke-width="2.6" stroke-linecap="round"/>`;
  return `<svg class="shelf-toy" viewBox="0 0 100 100" aria-hidden="true"><g fill="${c.fill}" stroke="${c.edge}" stroke-width="6" stroke-linejoin="round">${sh.el}</g>${face}</svg>`;
}
const GIFT = '<span class="shelf-gift" aria-hidden="true">🎁</span>';

function shelfBuildRound(dd, rng){
  rng = rng || Math.random;
  const cfg = shelfRound(dd);
  const rows = shuffle(SHELF_COLORS.slice()).slice(0, cfg.size);
  const cols = shuffle(Object.keys(SHELF_SHAPES)).slice(0, cfg.size);
  const cells = shuffle(rows.flatMap(color=> cols.map(shape=> ({ color, shape }))));
  const roll = rng();
  const mode = roll < cfg.find ? 'find' : roll < cfg.find + cfg.coords ? 'coords' : 'place';
  if(mode === 'find'){
    const target = cells[0];
    const sameColor = { color: target.color, shape: shuffle(cols.filter(s=> s !== target.shape))[0] };
    const sameShape = { color: shuffle(rows.filter(c=> c !== target.color))[0], shape: target.shape };
    // quelques cases déjà rangées montrent la règle (jamais une des réponses proposées)
    const shown = cells.slice(1).filter(t=> !(t.color === target.color && t.shape === target.shape)).slice(0, cfg.size - 1);
    return { cfg, rows, cols, mode, target, options: shuffle([target, sameColor, sameShape]), shown, steps: [] };
  }
  return { cfg, rows, cols, mode, steps: cells.slice(0, cfg.toys), shown: [] };
}

function shelfGridHTML(r){
  const key = (t)=> `${t.color}-${t.shape}`;
  const shown = new Set(r.shown.map(key));
  return `<div class="shelf" style="--n:${r.cols.length}">
    <span class="shelf-corner" aria-hidden="true">🧸</span>
    ${r.cols.map(s=> `<span class="shelf-head col" data-shape="${s}" title="colonne ${SHELF_SHAPES[s].s}">${shelfToySVG(s, null, true)}</span>`).join('')}
    ${r.rows.map(c=> `<span class="shelf-head row" data-color="${c}" title="ligne ${c}"><i style="background:${SQ_COLORS[c].fill}; border-color:${SQ_COLORS[c].edge}"></i></span>
      ${r.cols.map(s=>{
        const k = `${c}-${s}`, target = r.mode === 'find' && k === key(r.target);
        return `<button class="shelf-cell${shown.has(k) ? ' filled' : ''}${target ? ' target' : ''}" data-cell="${k}" data-color="${c}" data-shape="${s}"
          aria-label="ligne ${c}, colonne ${SHELF_SHAPES[s].s}"${shown.has(k) || r.mode === 'find' ? ' disabled' : ''}>${shown.has(k) ? shelfToySVG(s, c) : target ? '<b>?</b>' : ''}</button>`;
      }).join('')}`).join('')}
  </div>`;
}
const coordsSay = (t)=> `ligne ${t.color}, colonne ${SHELF_SHAPES[t.shape].s}`;
function stepAsk(r, i){
  const t = r.steps[i];
  return r.mode === 'coords' ? `Pose le cadeau ici : ${coordsSay(t)}.` : `Range ${toyName(t)}.`;
}

function renderShelf(){
  setupLives('shelf');
  const dd = gameDiff();
  const r = shelfBuildRound(dd);
  if(r.mode === 'find'){
    const t = r.target;
    const q = { mode:'find', color: t.color, shape: t.shape };
    const say = 'Une ligne pour chaque couleur, une colonne pour chaque forme. Quel jouet va dans la case avec le point d\'interrogation ?';
    openModal(`
      ${gameHeader('🗄️ L\'étagère magique', 'Quel jouet va dans la case « ? » ?', say)}
      ${livesBar()}
      <div class="shelf-stage">${shelfGridHTML(r)}</div>
      <div class="num-options shelf-options">
        ${r.options.map(o=> `<button class="num-btn shelf-opt" data-k="${o.color}-${o.shape}" data-color="${o.color}" data-shape="${o.shape}" aria-label="${toyName(o)}">${shelfToySVG(o.shape, o.color)}</button>`).join('')}
      </div>
    `);
    bindQuit();
    startTimerIfNeeded('shelf');
    setSolution([solSel('.shelf-opt', 'k', `${t.color}-${t.shape}`)]);
    setHintQuestion('shelf', q, { choices:'.shelf-opt' });
    document.querySelectorAll('.shelf-opt').forEach(btn=>{
      btn.onclick = ()=>{
        if(btn.dataset.k === `${t.color}-${t.shape}`){
          clearActiveTimer(); stepOk(btn); flashModal('ok');
          const cell = document.querySelector('.shelf-cell.target');
          if(cell){ cell.innerHTML = shelfToySVG(t.shape, t.color); cell.classList.add('filled'); }
          setTimeout(onMissionWin, 450);
        } else loseLife(btn, { onRetry: renderShelf });
      };
    });
    return;
  }
  // place / coords : les jouets (ou cadeaux) attendent dans le panier, un par un
  let i = 0;
  const todo = (t, k)=> `<span class="shelf-todo${k === 0 ? ' now' : ''}" data-i="${k}" data-color="${t.color}" data-shape="${t.shape}">${r.mode === 'coords' ? GIFT : shelfToySVG(t.shape, t.color)}</span>`;
  const intro = r.mode === 'coords'
    ? 'Une ligne pour chaque couleur, une colonne pour chaque forme. Pose chaque cadeau dans la case que je te dis.'
    : 'Une ligne pour chaque couleur, une colonne pour chaque forme. Range chaque jouet dans sa case.';
  openModal(`
    ${gameHeader('🗄️ L\'étagère magique', r.mode === 'coords' ? 'Pose les cadeaux aux bonnes cases' : 'Range les jouets dans l\'étagère', `${intro} ${stepAsk(r, 0)}`)}
    ${livesBar()}
    <div class="shelf-tray">${r.steps.map(todo).join('')}</div>
    <p class="shelf-ask" id="shelf-ask">${stepAsk(r, 0)}</p>
    <div class="shelf-stage">${shelfGridHTML(r)}</div>
    ${r.steps.length > 1 ? `<div id="shelf-progress">${progressDots(0, r.steps.length)}</div>` : ''}
  `);
  bindQuit();
  startTimerIfNeeded('shelf');
  setSolution(r.steps.map(t=> solSel('.shelf-cell', 'cell', `${t.color}-${t.shape}`)));
  const ask = ()=> setHintQuestion('shelf', { mode: r.mode, color: r.steps[i].color, shape: r.steps[i].shape }, { choices:'.shelf-cell' });
  ask();
  document.querySelectorAll('.shelf-cell:not([disabled])').forEach(cell=>{
    cell.onclick = ()=>{
      const t = r.steps[i];
      if(!t || cell.classList.contains('filled')) return;
      if(cell.dataset.cell !== `${t.color}-${t.shape}`){ loseLife(cell, { onRetry: renderShelf }); return; }
      stepOk(cell);
      cell.innerHTML = r.mode === 'coords' ? GIFT : shelfToySVG(t.shape, t.color);
      cell.classList.add('filled');
      const tray = document.querySelector(`.shelf-todo[data-i="${i}"]`);
      if(tray){ tray.classList.remove('now'); tray.classList.add('done'); }
      i++;
      const prog = document.getElementById('shelf-progress');
      if(prog) prog.innerHTML = progressDots(i, r.steps.length);
      if(i >= r.steps.length){ clearActiveTimer(); flashModal('ok'); setTimeout(onMissionWin, 450); return; }
      const next = document.querySelector(`.shelf-todo[data-i="${i}"]`);
      if(next) next.classList.add('now');
      document.getElementById('shelf-ask').textContent = stepAsk(r, i);
      speak(stepAsk(r, i));
      ask();
    };
  });
}

// Indices (v52) : 1. la méthode (la ligne de sa couleur, la colonne de sa
// forme) ; 2. la ligne brille : il reste à trouver la colonne. Jamais la case.
function shelfHints(q){
  const row = `.shelf-head.row[data-color="${q.color}"]`;
  if(q.mode === 'find') return [
    { say: 'Regarde la couleur de la ligne et la forme de la colonne : le jouet de cette case a les deux.', fx:{ glow:'.shelf-cell.target' } },
    { say: `La case est sur la ligne ${q.color} : le jouet est ${colorAdj(q.color, q.shape)}. Et quelle est sa forme ?`, fx:{ glow: row } },
  ];
  if(q.mode === 'coords') return [
    { say: 'Trouve d\'abord la ligne, puis la colonne : la case est là où elles se croisent.', fx:{ glow:'.shelf' } },
    { say: `La ligne ${q.color} brille. Suis-la jusqu'à la bonne colonne.`, fx:{ glow: row } },
  ];
  return [
    { say: 'Cherche la ligne de sa couleur, puis la colonne de sa forme : sa case est là où elles se croisent.', fx:{ glow:'.shelf' } },
    { say: `Le jouet est ${colorAdj(q.color, q.shape)} : sa case est sur la ligne ${q.color}, qui brille. Dans quelle colonne ?`, fx:{ glow: row } },
  ];
}

registerGame('shelf', renderShelf);
registerHints('shelf', shelfHints);
