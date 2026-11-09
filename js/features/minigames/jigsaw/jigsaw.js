/* ---------- Mini-jeu : Assembler l'image (vrai puzzle) ----------
   Une image dessinée — le paysage d'une île avec un compagnon au premier
   plan — est découpée en morceaux mélangés. L'enfant remet chaque morceau
   à sa place :
   - en le faisant glisser du doigt jusqu'à sa case ;
   - ou en touchant le morceau, puis la case (plus facile pour les petits).
   Selon le palier (voir `jigsawRound` dans js/entities/difficulty/difficulty.js) : 2×2 avec
   l'image en transparence dans le cadre, puis 3×3, puis 4×3 avec seulement
   un petit modèle à côté. Un morceau posé au mauvais endroit revient dans
   la réserve (et coûte un essai à partir de l'île 2).

   L'image est dessinée une seule fois (un <symbol>), chaque morceau en
   montre une partie : pas d'image à télécharger, rien qui change d'un
   appareil à l'autre. */

const JIGSAW_W = 480, JIGSAW_H = 360;

// L'image : ciel, paysage de l'île (js/features/island/island.js), et un compagnon en grand.
function jigsawPicture(worldId, compId){
  const w = WORLDS[worldId] || WORLDS.lagon;
  const draw = (typeof ISLE_SCENERY!=='undefined' && (ISLE_SCENERY[w.shape] || ISLE_SCENERY[worldId]))
    || (typeof isleGenericScenery==='function' ? isleGenericScenery : ()=> '');
  const buddy = (typeof companionSVG==='function' ? companionSVG(compId, 'happy') : '')
    .replace(/^<svg class="[^"]*"/, '<svg class="jg-buddy" x="138" y="140" width="204" height="221"');
  return `<linearGradient id="jg-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7FD3EE"/><stop offset=".6" stop-color="#E2F7F6"/></linearGradient>
    <rect width="${JIGSAW_W}" height="${JIGSAW_H}" fill="url(#jg-sky)"/>
    <circle cx="404" cy="62" r="40" fill="#FFE07A" opacity=".35"/><circle cx="404" cy="62" r="25" fill="#FFD54A"/>
    <g fill="#fff" opacity=".92"><ellipse cx="86" cy="62" rx="34" ry="12"/><ellipse cx="106" cy="52" rx="20" ry="14"/><ellipse cx="68" cy="56" rx="14" ry="10"/>
      <ellipse cx="270" cy="92" rx="26" ry="9"/><ellipse cx="284" cy="84" rx="14" ry="10"/></g>
    ${draw(w)}
    ${JIGSAW_DETAILS}
    ${buddy}`;
}
// Petits détails répartis pour que CHAQUE morceau soit différent, quelle
// que soit la découpe (2×2, 3×3, 4×3) : sinon deux morceaux tout verts ou
// tout bleus seraient interchangeables, et l'enfant aurait « faux » alors
// que l'image paraît juste.
const JIGSAW_DETAILS = `
  <g fill="none" stroke="#123B4F" stroke-width="2.6" stroke-linecap="round"><path d="M166 40 q6 -7 12 0 q6 -7 12 0"/><path d="M196 56 q5 -6 10 0 q5 -6 10 0"/></g>
  <g transform="translate(56 196)"><ellipse cx="-8" cy="-5" rx="9" ry="7" fill="#FF8FB8"/><ellipse cx="8" cy="-5" rx="9" ry="7" fill="#FF8FB8"/>
    <ellipse cx="-6" cy="7" rx="6" ry="5" fill="#FFCB4C"/><ellipse cx="6" cy="7" rx="6" ry="5" fill="#FFCB4C"/><rect x="-1.6" y="-9" width="3.2" height="20" rx="1.6" fill="#123B4F"/></g>
  <g transform="translate(432 214)"><circle cx="-14" cy="0" r="13" fill="#3FAF6A"/><circle cx="12" cy="-2" r="14" fill="#3FAF6A"/><circle cx="0" cy="-12" r="13" fill="#4CC07A"/>
    <circle cx="-10" cy="-6" r="3" fill="#FF6FA5"/><circle cx="8" cy="-10" r="3" fill="#FFCB4C"/><circle cx="14" cy="3" r="3" fill="#FF6FA5"/><circle cx="-2" cy="2" r="3" fill="#fff"/></g>
  <g stroke="#3F8F4E" stroke-width="3" stroke-linecap="round"><path d="M40 344 V322 M62 346 V316 M84 344 V326"/></g>
  <g><circle cx="40" cy="318" r="7" fill="#FF6FA5"/><circle cx="40" cy="318" r="3" fill="#FFE38A"/><circle cx="62" cy="312" r="8" fill="#8B5CF6"/><circle cx="62" cy="312" r="3.4" fill="#FFE38A"/>
    <circle cx="84" cy="322" r="7" fill="#FFCB4C"/><circle cx="84" cy="322" r="3" fill="#fff"/></g>
  <g transform="translate(430 320)"><rect x="-5" y="0" width="10" height="16" rx="4" fill="#FFF3DE" stroke="#E0C08A" stroke-width="1.5"/>
    <path d="M-20 2 C-20 -16 20 -16 20 2 Z" fill="#E5484D"/><circle cx="-8" cy="-6" r="3" fill="#fff"/><circle cx="6" cy="-9" r="2.6" fill="#fff"/><circle cx="12" cy="-2" r="2.2" fill="#fff"/></g>`;

// Un morceau (ou l'image entière) : une fenêtre sur le symbole #jg-art
function jigsawViewSVG(x, y, w, h, cls){
  return `<svg class="${cls || 'jg-svg'}" viewBox="${x} ${y} ${w} ${h}" preserveAspectRatio="none" aria-hidden="true"><use href="#jg-art" width="${JIGSAW_W}" height="${JIGSAW_H}"/></svg>`;
}

let jigsawState = null;   // pour les tests : { cols, rows, order }

function renderJigsaw(){
  setupLives('jigsaw');
  const dd = gameDiff();
  const r = jigsawRound(dd);
  const n = r.cols * r.rows;
  const pw = JIGSAW_W / r.cols, ph = JIGSAW_H / r.rows;
  // une île déjà découverte (ou le Lagon) et un compagnon au hasard
  const worlds = (typeof WORLD_ORDER!=='undefined' ? WORLD_ORDER : Object.keys(WORLDS)).filter(id=> typeof worldUnlocked!=='function' || worldUnlocked(id));
  const worldId = pickRandom(worlds.length ? worlds : ['lagon']);
  const compId = pickRandom(typeof COMPANION_ORDER!=='undefined' ? COMPANION_ORDER : Object.keys(COMPANIONS));
  // ordre mélangé, jamais déjà en place
  let order = shuffle(Array.from({length:n}, (_,i)=>i));
  if(order.every((p,i)=>p===i)) order = order.slice(1).concat(order[0]);
  jigsawState = { cols:r.cols, rows:r.rows, order };
  const piece = (i)=> jigsawViewSVG((i % r.cols) * pw, Math.floor(i / r.cols) * ph, pw, ph);
  const hint = r.ghost ? 'Remets les morceaux à leur place' : 'Refais l\'image du modèle';
  // réserve compacte : tous les morceaux tiennent sur 1 ou 2 rangées sous le cadre
  const tcols = n <= 4 ? n : Math.ceil(n / 2);
  openModal(`
    ${gameHeader('🖼️ Le puzzle', hint, r.ghost ? 'Remets chaque morceau à sa place pour reconstruire l\'image' : 'Refais l\'image du modèle')}
    ${livesBar()}
    <svg class="jg-defs" width="0" height="0" aria-hidden="true" focusable="false"><defs><symbol id="jg-art" viewBox="0 0 ${JIGSAW_W} ${JIGSAW_H}">${jigsawPicture(worldId, compId)}</symbol></defs></svg>
    <div class="jg-wrap" style="--cols:${r.cols}; --rows:${r.rows}; --tcols:${tcols};">
      <div class="jg-top">
        ${r.ghost ? '' : `<div class="jg-model" aria-label="Le modèle">${jigsawViewSVG(0, 0, JIGSAW_W, JIGSAW_H, 'jg-svg')}<span>Modèle</span></div>`}
        <div class="jg-progress">${progressDots(0, n)}</div>
      </div>
      <div class="jg-board">
        ${r.ghost ? `<div class="jg-ghost" style="opacity:${r.ghost}">${jigsawViewSVG(0, 0, JIGSAW_W, JIGSAW_H, 'jg-svg')}</div>` : ''}
        ${Array.from({length:n}, (_,i)=>`<button type="button" class="jg-slot" data-s="${i}" aria-label="Case, ligne ${Math.floor(i/r.cols)+1}, colonne ${i%r.cols+1}"></button>`).join('')}
      </div>
      <p class="jg-tip">👆 Glisse un morceau, ou touche-le puis touche sa case</p>
      <div class="jg-tray">
        ${order.map(p=>`<button type="button" class="jg-piece" data-p="${p}" aria-label="Morceau de l'image">${piece(p)}</button>`).join('')}
      </div>
    </div>
  `);
  bindQuit();
  // tests : toucher chaque morceau, puis sa case
  setSolution(Array.from({length:n}, (_,i)=>[solSel('.jg-piece','p',i), solSel('.jg-slot','s',i)]).flat());

  let placed = 0, selected = null, justDragged = false;
  const clearSel = ()=>{ if(selected) selected.classList.remove('sel'); selected = null; };
  const tryPlace = (pieceEl, slotEl)=>{
    if(!pieceEl || !slotEl || slotEl.classList.contains('filled') || pieceEl.classList.contains('used')) return;
    const p = Number(pieceEl.dataset.p), s = Number(slotEl.dataset.s);
    clearSel();
    if(p === s){
      slotEl.innerHTML = piece(p);
      slotEl.classList.add('filled');
      slotEl.setAttribute('aria-label', 'Morceau bien placé');
      pieceEl.classList.add('used'); pieceEl.disabled = true; pieceEl.innerHTML = '';
      placed++;
      const prog = document.querySelector('.jg-progress');
      if(prog) prog.innerHTML = progressDots(placed, n);
      stepOk(slotEl);
      if(placed >= n){
        document.querySelector('.jg-board').classList.add('done');
        flashModal('ok');
        setTimeout(onMissionWin, 700);
      }
    } else {
      pieceEl.classList.remove('lifted');
      loseLife(slotEl, { disable:false });
    }
  };
  document.querySelectorAll('.jg-slot').forEach(slot=>{
    slot.onclick = ()=>{
      if(slot.classList.contains('filled')) return;
      if(selected) tryPlace(selected, slot);
      else { playSound('tap'); showToast('👆 Choisis d\'abord un morceau en bas'); }
    };
  });
  document.querySelectorAll('.jg-piece').forEach(pc=>{
    pc.onclick = ()=>{
      if(justDragged){ justDragged = false; return; }
      if(pc.classList.contains('used')) return;
      playSound('tap');
      if(selected === pc){ clearSel(); return; }
      clearSel(); selected = pc; pc.classList.add('sel');
    };
    // glisser du doigt (ou à la souris) jusqu'à une case
    pc.addEventListener('pointerdown', e=>{
      if(pc.classList.contains('used') || (e.pointerType==='mouse' && e.button!==0)) return;
      const sx = e.clientX, sy = e.clientY;
      let ghost = null, box = null;
      try{ pc.setPointerCapture(e.pointerId); }catch(err){}
      const move = ev=>{
        if(!ghost && Math.hypot(ev.clientX - sx, ev.clientY - sy) > 8){
          box = pc.getBoundingClientRect();
          ghost = pc.cloneNode(true);
          ghost.classList.add('jg-drag'); ghost.classList.remove('sel');
          ghost.style.width = box.width + 'px'; ghost.style.height = box.height + 'px';
          document.body.appendChild(ghost);
          pc.classList.add('lifted'); clearSel();
        }
        if(ghost){
          ghost.style.left = (ev.clientX - box.width/2) + 'px';
          ghost.style.top = (ev.clientY - box.height/2) + 'px';
        }
      };
      const end = ev=>{
        pc.removeEventListener('pointermove', move);
        pc.removeEventListener('pointerup', end);
        pc.removeEventListener('pointercancel', end);
        if(!ghost) return;
        ghost.remove(); justDragged = true;
        setTimeout(()=>{ justDragged = false; }, 350);
        pc.classList.remove('lifted');
        if(ev.type === 'pointercancel') return;
        const target = document.elementFromPoint(ev.clientX, ev.clientY);
        const slot = target && target.closest && target.closest('.jg-slot');
        if(slot) tryPlace(pc, slot);
      };
      pc.addEventListener('pointermove', move);
      pc.addEventListener('pointerup', end);
      pc.addEventListener('pointercancel', end);
    });
  });
}

// inscription auprès du moteur de mini-jeux (js/features/minigame-engine)
registerGame('jigsaw', renderJigsaw);
