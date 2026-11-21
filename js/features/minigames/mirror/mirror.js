/* ---------- Mini-jeu : Le miroir magique (Royaume Arc-en-ciel, saison 2) ----------
   La symétrie : une grille coupée par un axe (une ligne de paillettes). D'un
   côté, Mira a déjà colorié un motif ; l'enfant touche les cases de l'autre
   côté pour en dessiner le reflet, puis « ✨ Fini ! ».
   Selon le palier (`mirrorRound`, js/entities/difficulty/difficulty.js) :
   grille 4 × 4 et 2 ou 3 cases, puis 6 × 6 et 5 cases, puis axe horizontal
   ou deux couleurs (une case se touche alors une fois pour ♥ rose, deux
   fois pour ★ bleu). Chaque couleur a aussi son symbole.
   Une erreur : les cases fausses clignotent, avec un indice parlé ; à la
   2ᵉ erreur, un NOUVEAU motif (relance annulable). */
import { mirrorRound } from '../../../entities/difficulty/index.js';
import { shuffle } from '../../../shared/lib/index.js';
import { openModal, speak } from '../../../shared/ui/index.js';
import { gameDiff } from '../../adaptive/index.js';
import { registerHints, setHintQuestion } from '../../hints/index.js';
import {
  clearActiveTimer, flashModal, livesBar, loseLife, onMissionWin, registerGame, setSolution,
  setupLives, startTimerIfNeeded, stepOk
} from '../../minigame-engine/index.js';
import { bindQuit, gameHeader } from '../../screen/index.js';

const MIRROR_INKS = { 1:{ fill:'#FF8FB8', sym:'♥', name:'rose' }, 2:{ fill:'#6FB8F5', sym:'★', name:'bleue' } };

// le reflet d'une case par l'axe (v : vertical, au milieu des colonnes ; h : horizontal)
function mirrorOf(cell, axis, size){
  return axis === 'v' ? { r: cell.r, c: size - 1 - cell.c, v: cell.v } : { r: size - 1 - cell.r, c: cell.c, v: cell.v };
}
function mirrorBuildRound(dd, rng){
  rng = rng || Math.random;
  const cfg = mirrorRound(dd);
  const axis = cfg.axes[Math.floor(rng() * cfg.axes.length)];
  const two = rng() < cfg.two;
  const half = cfg.size / 2;
  // les cases du côté déjà colorié : à gauche (axe vertical) ou en haut (axe horizontal)
  const source = [];
  for(let r = 0; r < cfg.size; r++) for(let c = 0; c < cfg.size; c++){
    if((axis === 'v' && c < half) || (axis === 'h' && r < half)) source.push({ r, c });
  }
  const picked = shuffle(source).slice(0, cfg.cells).map(x=> Object.assign(x, { v: two && rng() < .5 ? 2 : 1 }));
  if(two && picked.every(x=> x.v === picked[0].v)) picked[0].v = picked[0].v === 1 ? 2 : 1;   // vraiment deux couleurs
  return { cfg, axis, two, size: cfg.size, pattern: picked, target: picked.map(x=> mirrorOf(x, axis, cfg.size)) };
}

let mirrorLast = '';
function renderMirror(){
  setupLives('mirror');
  const dd = gameDiff();
  let r = mirrorBuildRound(dd);
  const key = (x)=> JSON.stringify([x.axis, x.pattern]);
  for(let k = 0; k < 8 && key(r) === mirrorLast; k++) r = mirrorBuildRound(dd);
  mirrorLast = key(r);
  const { size, axis } = r, half = size / 2;
  const src = {}; r.pattern.forEach(x=> src[`${x.r}-${x.c}`] = x.v);
  const want = {}; r.target.forEach(x=> want[`${x.r}-${x.c}`] = x.v);
  const state = {};
  let errors = 0;
  const isSource = (rr, cc)=> axis === 'v' ? cc < half : rr < half;
  const cellHTML = (rr, cc)=>{
    const k = `${rr}-${cc}`;
    if(isSource(rr, cc)){
      const v = src[k];
      return `<span class="mr-cell src${v ? ' on' : ''}" data-k="${k}" ${v ? `data-src="${v}" style="background:${MIRROR_INKS[v].fill}"` : ''}>${v ? MIRROR_INKS[v].sym : ''}</span>`;
    }
    return `<button class="mr-cell tap" data-k="${k}" aria-label="case ${rr + 1}, ${cc + 1}"></button>`;
  };
  const say = r.two
    ? 'Mira a colorié un côté du miroir, en rose et en bleu. Dessine le reflet de l\'autre côté : touche une fois pour le rose, deux fois pour le bleu. Puis appuie sur Fini.'
    : 'Mira a colorié un côté du miroir. Dessine le reflet de l\'autre côté de la ligne de paillettes, puis appuie sur Fini.';
  openModal(`
    ${gameHeader('🪞 Le miroir magique', 'Dessine le reflet', say)}
    ${livesBar()}
    <div class="mr-wrap">
      <div class="mr-grid axis-${axis}" id="mr-grid" data-axis="${axis}" data-size="${size}" style="--n:${size}">
        ${Array.from({ length: size }, (_, rr)=> Array.from({ length: size }, (_, cc)=> cellHTML(rr, cc)).join('')).join('')}
        <span class="mr-axis" aria-hidden="true"></span>
      </div>
    </div>
    ${r.two ? '<p class="mr-key"><span style="background:#FF8FB8">♥</span> une fois · <span style="background:#6FB8F5">★</span> deux fois</p>' : ''}
    <button class="btn-primary mr-done" id="mirror-done">✨ Fini !</button>
  `);
  bindQuit(); startTimerIfNeeded('mirror');
  // la solution : chaque case du reflet, touchée 1 fois (♥) ou 2 fois (★), puis « Fini »
  setSolution([...r.target.flatMap(x=> Array(x.v).fill(`.mr-cell[data-k="${x.r}-${x.c}"]`)), '#mirror-done']);
  setHintQuestion('mirror', { axis, two: r.two }, { choices:'#mirror-done' });
  const paint = (b)=>{
    const v = state[b.dataset.k] || 0;
    b.classList.toggle('on', !!v);
    b.style.background = v ? MIRROR_INKS[v].fill : '';
    b.textContent = v ? MIRROR_INKS[v].sym : '';
  };
  document.querySelectorAll('.mr-cell.tap').forEach(b=> b.onclick = ()=>{
    const k = b.dataset.k;
    state[k] = ((state[k] || 0) + 1) % (r.two ? 3 : 2);
    b.classList.remove('wrong');
    paint(b);
  });
  document.getElementById('mirror-done').onclick = (e)=>{
    const keys = new Set([...Object.keys(want), ...Object.keys(state).filter(k=> state[k])]);
    const wrong = [...keys].filter(k=> (state[k] || 0) !== (want[k] || 0));
    if(!wrong.length){ clearActiveTimer(); stepOk(e.currentTarget); flashModal('ok'); setTimeout(onMissionWin, 450); return; }
    errors++;
    wrong.forEach(k=>{ const c = document.querySelector(`.mr-cell.tap[data-k="${k}"]`); if(c){ c.classList.remove('wrong'); void c.offsetWidth; c.classList.add('wrong'); } });
    speak(`Les cases qui clignotent ne sont pas encore le reflet. Regarde leur jumelle, de l'autre côté de la ligne.`);
    // la 2ᵉ erreur : un nouveau motif ; la 1ʳᵉ : on corrige les cases qui clignotent
    loseLife(e.currentTarget, errors >= 2 ? { onRetry: renderMirror, disable:false } : { disable:false });
  };
}

// Indices (v52) : 1. ce qu'est un reflet ; 2. par quelle case commencer. Jamais une case.
function mirrorHints(q){
  const side = q.axis === 'v' ? 'à la même hauteur, de l\'autre côté' : 'dans la même colonne, de l\'autre côté';
  return [
    { say:`Le miroir montre la même chose de l'autre côté de la ligne de paillettes : chaque case colorée a sa jumelle, à la même distance de la ligne.${q.two ? ' Et de la même couleur !' : ''}`, fx:{ glow:'.mr-axis' } },
    { say:`Commence par la case colorée la plus proche de la ligne : sa jumelle est juste en face, ${side}.`, fx:{ glow:'#mr-grid' } },
  ];
}

registerGame('mirror', renderMirror);
registerHints('mirror', mirrorHints);
