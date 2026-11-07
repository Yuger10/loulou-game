/* ---------- Mode course de navigation (compétition équitable) ---------- */

// Difficulté adaptée à l'âge : chacun joue à son niveau, la course reste juste.
// Bornes alignées sur les 5 paliers de js/difficulty.js (repères scolaires
// GS/CP/CE1/CE2) : voir ANALYSE-DIFFICULTE.md pour le détail académique.
const AGE_DIFF = [
  { max:5,  diff:1, label:'4-5 ans' },
  { max:7,  diff:2, label:'6-7 ans' },
  { max:8,  diff:3, label:'8 ans' },
  { max:9,  diff:4, label:'9 ans' },
  { max:99, diff:5, label:'10 ans et +' },
];
function ageToDiff(age){
  const a = Number(age);
  if(!a) return null;                       // âge non renseigné → difficulté de l'île
  return (AGE_DIFF.find(r=>a<=r.max) || AGE_DIFF[AGE_DIFF.length-1]).diff;
}
function ageLabel(age){
  const a = Number(age);
  if(!a) return 'âge non précisé';
  return `${a} ans`;
}

const RACE_STEPS = 6;        // cases à parcourir pour gagner
const RACE_PRIZE = 50;       // pièces pour le vainqueur

let race = { active:false, players:[], pos:{}, turn:0, goal:RACE_STEPS, winner:null, rounds:0 };

function raceCurrent(){ return profiles.list.find(p=>p.id===race.players[race.turn]); }

function startRace(ids){
  if(ids.length < 2) return false;
  race = { active:true, players:ids.slice(), pos:{}, turn:0, goal:RACE_STEPS, winner:null, rounds:0 };
  ids.forEach(id=> race.pos[id] = 0);
  // la course réutilise la mécanique de tour par tour
  party = { active:true, mode:'race', players:ids.slice(), turn:0, scores:{}, lastWinner:null };
  ids.forEach(id=> party.scores[id] = 0);
  switchProfile(ids[0], true);
  renderTurnBar();
  renderRaceTrack();
  playSound('win'); confetti();
  const p = raceCurrent();
  speak(`La course commence ! Premier arrivé à ${RACE_STEPS} cases gagne. ${p.name || ''} commence.`);
  showToast(`🏁 La course commence !`);
  return true;
}

function stopRace(silent){
  race.active = false;
  party.active = false; party.mode = null;
  renderTurnBar();
  renderRaceTrack();
  if(!silent){ showToast('👤 Mode solo'); speak('Course terminée.'); }
}

// avance le joueur courant d'une case (mini-jeu réussi)
function raceAdvance(){
  if(!race.active) return false;
  const p = raceCurrent();
  if(!p) return false;
  race.pos[p.id] = Math.min(race.goal, (race.pos[p.id]||0) + 1);
  renderRaceTrack();
  if(race.pos[p.id] >= race.goal){
    raceWin(p);
    return true;
  }
  return false;
}

function raceWin(p){
  race.winner = p.id;
  race.active = false;
  const wasCurrent = profiles.current === p.id;
  if(!wasCurrent) switchProfile(p.id, true);
  addCoins(RACE_PRIZE);
  playSound('win'); confetti(); vibrate([80,50,80,50,220]);
  const classement = race.players
    .map(id=>({ p: profiles.list.find(x=>x.id===id), n: race.pos[id]||0 }))
    .sort((a,b)=>b.n-a.n);
  speak(`Bravo ${p.name || ''} ! Tu gagnes la course et ${RACE_PRIZE} pièces !`);
  openModal(`
    <div class="reward-box">
      <span class="big-emoji">🏁</span>
      <h2>${p.name || 'Joueur'} gagne la course !</h2>
      <div class="speech" style="display:flex; align-items:center; justify-content:center; gap:10px;">
        <span style="font-size:2.2rem;">${avatarHTML(p.avatar, p.look)}</span>
        <span><strong>+${RACE_PRIZE} pièces</strong> <span data-gain-coins>🪙</span></span>
      </div>
      <div class="race-results">
        ${classement.map((r,i)=>`<div class="race-result">
          <span class="medal">${['🥇','🥈','🥉'][i]||'🏅'}</span>
          <span class="av">${avatarHTML(r.p.avatar, r.p.look)}</span>
          <span class="nm">${r.p.name || 'Joueur'}</span>
          <span class="sc">${r.n}/${race.goal}</span>
        </div>`).join('')}
      </div>
    </div>
    <button class="btn-primary" id="race-again">🔁 Refaire une course</button>
    <button class="btn-ghost" id="race-done">Terminer</button>
  `);
  if(typeof queueGain==='function') queueGain({ coins:RACE_PRIZE });
  document.getElementById('race-again').onclick = ()=>{
    playSound('tap'); closeModal(); startRace(race.players);
  };
  document.getElementById('race-done').onclick = ()=>{
    playSound('tap'); closeModal(); stopRace(true); renderLagon();
  };
  party.active = false; party.mode = null;
  renderTurnBar();
  renderRaceTrack();
}

/* --- Piste de course affichée sur l'écran principal --- */
function renderRaceTrack(){
  const el = document.getElementById('race-track');
  if(!el) return;
  if(!race.active && !race.winner){ el.hidden = true; el.innerHTML = ''; return; }
  if(!race.active && race.winner){ el.hidden = true; el.innerHTML = ''; return; }
  el.hidden = false;
  const cur = raceCurrent();
  el.innerHTML = `
    <div class="race-head">🏁 Course : premier à ${race.goal} cases !
      <button class="turn-stop" id="race-stop">✖️</button>
    </div>
    ${race.players.map(id=>{
      const p = profiles.list.find(x=>x.id===id);
      const n = race.pos[id]||0;
      const here = cur && cur.id===id;
      return `<div class="race-lane ${here?'active':''}">
        <span class="lane-av">${avatarHTML(p.avatar, p.look)}</span>
        <span class="lane-name">${p.name || 'Joueur'}<small>${ageLabel(p.age)} · ${'⭐'.repeat(ageToDiff(p.age)||1)}</small></span>
        <span class="lane-track">
          ${Array.from({length:race.goal},(_,i)=>`<i class="${i<n?'on':''}"></i>`).join('')}
          <span class="lane-boat" style="left:calc(${(n/race.goal)*100}% - 10px)">⛵</span>
        </span>
        <span class="lane-score">${n}/${race.goal}</span>
      </div>`;
    }).join('')}
    ${cur ? `<div class="race-turn">👉 Au tour de <b>${avatarHTML(cur.avatar, cur.look)} ${cur.name || 'Joueur'}</b> — niveau ${'⭐'.repeat(ageToDiff(cur.age)||gameDiffIsland())}</div>` : ''}
  `;
  const stop = document.getElementById('race-stop');
  if(stop) stop.onclick = ()=>{ playSound('tap'); stopRace(); renderLagon(); };
}
