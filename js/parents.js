/* ---------- Espace parents (Phase 2) ----------
   Réservé aux adultes (une multiplication à résoudre), il montre pour chaque
   enfant :
   - le temps de jeu par jour (7 derniers jours) ;
   - les progrès par compétence : pour chaque mini-jeu, les missions réussies,
     les erreurs, le palier atteint, et un état simple (à l'aise / en cours /
     difficile / pas encore assez joué) ;
   - le réglage de la pause douce (après X minutes de jeu dans la journée) ;
   - les réglages adultes : sauvegarde, réglages du joueur, remise à zéro.

   Données, dans la partie de chaque enfant (exportées par la sauvegarde) :
     state.skills[jeu]  = { wins, fails, errors, last, recent:[{t, e, ok}…10] }
     state.playTime[jour] = secondes de jeu ACTIF ce jour-là (60 jours gardés)
     state.pauseExtra   = { date, min }  minutes ajoutées par un adulte aujourd'hui
   Réglage dans le profil : profile.pauseMin (0 = pas de pause). */

const SKILL_GROUPS = [
  { id:'lire',     emoji:'📖', name:'Lecture et langage',  games:['reading','determinants'] },
  { id:'nombres',  emoji:'🔢', name:'Nombres',             games:['count','puzzle','compare'] },
  { id:'calcul',   emoji:'➕', name:'Calcul',              games:['math','calc','money'] },
  { id:'mesures',  emoji:'🕐', name:'Temps et mesures',    games:['clock','calendar','volume'] },
  { id:'formes',   emoji:'🔷', name:'Formes et espace',    games:['shapes'] },
  { id:'sciences', emoji:'🪐', name:'Sciences',            games:['planets'] },
  { id:'logique',  emoji:'🧠', name:'Mémoire et logique',  games:['memory','simon','diff','sequence'] },
];
const SKILL_STATUS = {
  aise:      { label:"À l'aise",                cls:'ok' },
  encours:   { label:'En cours',                 cls:'mid' },
  difficile: { label:'À travailler',             cls:'hard' },
  nouveau:   { label:'Pas assez joué',           cls:'new' },
  jamais:    { label:'Pas encore joué',          cls:'new' },
};
const PAUSE_CHOICES = [0, 15, 20, 30, 45, 60];
// Au mémo, retourner deux cartes différentes fait partie du jeu : on
// tolère donc plus d'« erreurs » avant de dire que c'est difficile.
const SKILL_ERR_TOLERANCE = { memory: 3 };

function todayKey(d){
  d = d || new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

/* ---- enregistrer ce qui se passe en jeu ---- */
let missionErrors = 0;
let missionProgress = null;   // progrès de la dernière mission, pour l'écran de victoire
function noteAnswerError(){ missionErrors++; }
function recordMission(ok){
  const key = typeof lastGame!=='undefined' ? lastGame : null;
  // à plusieurs (chacun son tour, course), une erreur passe la main au
  // suivant : la mission n'est ni gagnée ni ratée, on ne compte rien.
  missionProgress = null;
  if(!key || (typeof party!=='undefined' && party.active)){ missionErrors = 0; return null; }
  if(!state.skills) state.skills = {};
  const s = state.skills[key] || (state.skills[key] = { wins:0, fails:0, errors:0, last:null, recent:[] });
  const t = typeof gameDiff==='function' ? gameDiff() : 1;   // niveau joué (île, âge et niveau du jeu)
  const e = missionErrors;
  const before = skillStatus(s, key);
  if(ok) s.wins++; else s.fails++;
  s.errors += e;
  s.last = todayKey();
  s.recent.push({ t, e, ok: !!ok });
  if(s.recent.length > 10) s.recent = s.recent.slice(-10);
  missionErrors = 0;
  // Phase 3 : le niveau du jeu monte ou redescend (js/adaptive.js)
  const step = typeof adaptAfterMission==='function' ? adaptAfterMission(key, s, t, !!ok, e) : null;
  // le compagnon félicitera si le jeu a progressé : niveau gagné, ou plus « à travailler »
  if(ok && ((step && step.type==='up') || (before==='difficile' && skillStatus(s, key)!=='difficile'))){
    missionProgress = { key, lvl: s.lvl, up: !!(step && step.type==='up') };
  }
  save();
  return step;
}
function skillStatus(s, key){
  if(!s || !(s.wins + s.fails)) return 'jamais';
  const r = s.recent || [];
  const last = r.slice(-6);
  if(last.length < 2) return 'nouveau';
  const fails = last.filter(x=>!x.ok).length / last.length;
  const avgErr = last.reduce((a,x)=>a + x.e, 0) / last.length / (SKILL_ERR_TOLERANCE[key] || 1);
  if(fails >= 0.34 || avgErr >= 1.5) return 'difficile';
  if(last.length >= 3 && avgErr <= 0.5 && fails === 0) return 'aise';
  return 'encours';
}

/* ---- temps de jeu actif ---- */
let lastInteraction = Date.now();
['pointerdown','keydown','touchstart'].forEach(ev=> window.addEventListener(ev, ()=>{ lastInteraction = Date.now(); }, { passive:true }));
function tickPlayTime(seconds){
  if(!state.playTime) state.playTime = {};
  const k = todayKey();
  state.playTime[k] = (state.playTime[k] || 0) + seconds;
  // on ne garde que les 60 derniers jours
  const keys = Object.keys(state.playTime).sort();
  while(keys.length > 60) delete state.playTime[keys.shift()];
  save();
}
function playMinutesToday(st){
  st = st || state;
  return Math.floor(((st.playTime || {})[todayKey()] || 0) / 60);
}
function startPlayTimeTracker(){
  setInterval(()=>{
    const visible = typeof document==='undefined' || document.visibilityState !== 'hidden';
    const splash = document.getElementById('splash');
    const onSplash = splash && splash.classList.contains('show');
    if(visible && !onSplash && Date.now() - lastInteraction < 90000) tickPlayTime(15);
  }, 15000);
}

/* ---- pause douce ---- */
function pauseLimit(){
  const p = typeof currentProfile==='function' ? currentProfile() : null;
  return (p && Number(p.pauseMin)) || 0;
}
function pauseDue(){
  if(typeof party!=='undefined' && party.active) return false;   // à plusieurs : pas de coupure au milieu
  const limit = pauseLimit();
  if(!limit) return false;
  const extra = state.pauseExtra && state.pauseExtra.date === todayKey() ? state.pauseExtra.min : 0;
  return playMinutesToday() >= limit + extra;
}
function showPauseScreen(){
  const p = currentProfile();
  const comp = typeof currentCompanion==='function' ? currentCompanion() : null;
  const c = comp && COMPANIONS[comp];
  const cName = c ? c.name : 'Ton compagnon';
  const tired = c && c.group==='f' ? 'fatiguée' : 'fatigué';
  // espaces insécables avant « ! ? : » (typographie française, pas de retour à la ligne)
  const msg = `Tu as bien joué aujourd'hui${p && p.name ? ', ' + p.name : ''}\u00a0! ${cName} est ${tired}\u00a0: on fait une pause et on revient demain\u00a0?`;
  openModal(`
    <div class="reward-box pause-box">
      ${typeof buddySlot==='function' ? buddySlot('sleepy','buddy-big') : '<span class="big-emoji">😴</span>'}
      <h2>C'est l'heure de la pause</h2>
      <div class="speech">${msg}</div>
      <p class="pause-note">Tu peux encore regarder ton île, ton sac et ton album.</p>
    </div>
    <button class="btn-primary" id="pause-ok">D'accord 😴</button>
    <button class="btn-ghost" id="pause-more">Un adulte peut ajouter 10 minutes</button>
  `);
  speak(msg);
  document.getElementById('pause-ok').onclick = ()=>{ playSound('tap'); closeModal(); };
  document.getElementById('pause-more').onclick = ()=>{
    playSound('tap');
    openParentGate(()=>{
      const k = todayKey();
      const cur = state.pauseExtra && state.pauseExtra.date===k ? state.pauseExtra.min : 0;
      state.pauseExtra = { date:k, min: cur + 10 }; save();
      closeModal(); showToast('⏱️ 10 minutes de plus');
    }, ()=> showPauseScreen());
  };
}

/* ---- accès réservé aux adultes ---- */
let parentUnlockedUntil = 0;
function openParentGate(onOk, onCancel){
  if(Date.now() < parentUnlockedUntil){ onOk(); return; }
  const a = 6 + Math.floor(Math.random()*4), b = 6 + Math.floor(Math.random()*4);
  openModal(`
    ${gameHeader('🔒 Pour les adultes', 'Répondez à cette question pour continuer')}
    <div class="gate-box">
      <label for="gate-in" class="gate-q">Combien font ${a} × ${b} ?</label>
      <input id="gate-in" class="name-input-modal gate-in" type="number" inputmode="numeric" autocomplete="off" aria-describedby="gate-err">
      <p class="gate-err" id="gate-err" aria-live="polite"></p>
    </div>
    <button class="btn-primary" id="gate-ok">Valider</button>
    <button class="btn-ghost" id="gate-cancel">Retour</button>
  `);
  const input = document.getElementById('gate-in');
  const ok = ()=>{
    if(Number(input.value) === a*b){ parentUnlockedUntil = Date.now() + 5*60*1000; playSound('good'); onOk(); }
    else { playSound('wrong'); document.getElementById('gate-err').textContent = "Ce n'est pas la bonne réponse."; input.value=''; input.focus(); }
  };
  document.getElementById('gate-ok').onclick = ok;
  input.addEventListener('keydown', e=>{ if(e.key==='Enter') ok(); });
  document.getElementById('gate-cancel').onclick = ()=>{ playSound('tap'); if(onCancel) onCancel(); else closeModal(); };
  setTimeout(()=>{ try{ input.focus(); }catch(e){} }, 50);
}

/* ---- l'espace parents ---- */
function profileState(id){
  if(id === profiles.current) return state;
  try{ return JSON.parse(localStorage.getItem(profileSaveKey(id)) || '{}') || {}; }catch(e){ return {}; }
}
function minutesLabel(min){
  if(min < 1) return 'moins d\'1 min';
  if(min < 60) return `${min} min`;
  return `${Math.floor(min/60)} h ${String(min%60).padStart(2,'0')}`;
}
function playTimeHTML(st){
  const days = [];
  for(let i=6;i>=0;i--){ const d = new Date(); d.setDate(d.getDate()-i); days.push(d); }
  const mins = days.map(d=> Math.floor(((st.playTime||{})[todayKey(d)] || 0)/60));
  const max = Math.max(10, ...mins);
  const played = mins.filter(m=>m>0);
  const avg = played.length ? Math.round(played.reduce((a,b)=>a+b,0)/played.length) : 0;
  const dayName = (d,i)=> i===6 ? "Auj." : d.toLocaleDateString('fr-FR',{ weekday:'short' }).replace('.','');
  return `<p class="pt-today">Aujourd'hui : <b>${minutesLabel(mins[6])}</b>${played.length ? ` · moyenne les jours joués : <b>${minutesLabel(avg)}</b>` : ''}</p>
    <div class="pt-bars" role="img" aria-label="Temps de jeu des 7 derniers jours : ${days.map((d,i)=>`${dayName(d,i)} ${mins[i]} minutes`).join(', ')}">
      ${days.map((d,i)=>`<div class="pt-col"><div class="pt-track"><span class="pt-val">${mins[i] ? mins[i] : ''}</span><i style="height:${Math.round(mins[i]/max*82)}%" class="${i===6?'today':''}"></i></div><span class="pt-day">${dayName(d,i)}</span></div>`).join('')}
    </div>`;
}
function skillsHTML(st, age){
  const sk = st.skills || {};
  const gameName = (k)=>{ const g = (typeof GAME_LIST!=='undefined' ? GAME_LIST : []).find(x=>x.key===k); return g ? `${g.emoji} ${g.name}` : k; };
  // les jeux proposés à cet âge, plus ceux déjà joués (avant un changement d'âge)
  const allowed = new Set([...gameTypesForAge(age), ...Object.keys(sk)]);
  const summary = { aise:[], difficile:[] };
  const groups = SKILL_GROUPS.map(gr=>{
    const rows = gr.games.filter(k=>allowed.has(k)).map(k=>{
      const s = sk[k], status = skillStatus(s, k), info = SKILL_STATUS[status];
      if(status==='aise' || status==='difficile') summary[status].push(gameName(k));
      const lastTier = s ? (s.lvl || (s.recent.length ? s.recent[s.recent.length-1].t : null)) : null;
      const detail = s ? `${s.wins} réussie${s.wins>1?'s':''}${s.fails?` · ${s.fails} ratée${s.fails>1?'s':''}`:''} · ${(s.wins+s.fails) ? (s.errors/(s.wins+s.fails)).toFixed(1).replace('.',',') : '0'} erreur par mission${lastTier ? ` · niveau ${'⭐'.repeat(Math.min(lastTier,6))}`:''}${s.support ? ' (redescendu d\'un cran pour s\'entraîner)' : ''}` : '';
      return `<li class="sk-row"><span class="sk-name">${gameName(k)}</span><span class="sk-pill ${info.cls}">${info.label}</span>${detail ? `<span class="sk-detail">${detail}</span>` : ''}</li>`;
    }).join('');
    return rows ? `<div class="sk-group"><h4>${gr.emoji} ${gr.name}</h4><ul>${rows}</ul></div>` : '';
  }).join('');
  const sum = `<div class="sk-summary">
      <p><span class="sk-pill ok">À l'aise</span> ${summary.aise.length ? summary.aise.join(', ') : '—'}</p>
      <p><span class="sk-pill hard">À travailler</span> ${summary.difficile.length ? summary.difficile.join(', ') : '—'}</p>
    </div>`;
  return sum + groups;
}
function openParentSpace(selectedId){
  const id = selectedId || profiles.current;
  const p = profiles.list.find(x=>x.id===id) || currentProfile();
  const st = profileState(p.id);
  openModal(`
    ${gameHeader('👪 Espace parents', 'Le temps de jeu et les progrès de chaque enfant')}
    <div class="ps-tabs" role="tablist">
      ${profiles.list.map(x=>`<button type="button" role="tab" class="ps-tab ${x.id===p.id?'on':''}" aria-selected="${x.id===p.id}" data-ps="${x.id}">${avatarHTML(x.avatar, x.look)} ${x.name || 'Sans nom'}</button>`).join('')}
    </div>
    <section class="bk-card"><h3>⏱️ Temps de jeu</h3>${playTimeHTML(st)}<p class="bk-help">Seul le temps où l'enfant joue vraiment est compté (pas le jeu laissé ouvert).</p></section>
    <section class="bk-card"><h3>😴 Pause douce</h3>
      <p>Après ce temps de jeu dans la journée, les mini-jeux se mettent en pause jusqu'au lendemain. L'île, le sac et l'album restent ouverts.</p>
      <div class="ps-chips" role="group" aria-label="Durée avant la pause">
        ${PAUSE_CHOICES.map(m=>`<button type="button" class="ps-chip ${(Number(p.pauseMin)||0)===m?'on':''}" data-pause="${m}">${m ? m + ' min' : 'Pas de pause'}</button>`).join('')}
      </div>
    </section>
    <section class="bk-card"><h3>📈 Progrès par compétence</h3>${skillsHTML(st, p.age)}
      <p class="bk-help">« À l'aise » : réussi sans erreur ou presque ces dernières fois. « À travailler » : souvent raté ou beaucoup d'erreurs.</p>
      <p class="bk-help">Chaque jeu a son propre niveau : il monte d'un cran après 2 réussites d'affilée presque sans erreur, redescend d'un cran après 2 missions ratées, et ne dépasse jamais celui de l'île ni l'âge de l'enfant. Les jeux à travailler reviennent plus souvent.</p></section>
    <section class="bk-card"><h3>⚙️ Réglages</h3>
      <div class="ps-actions">
        <button class="btn-small" id="ps-backup">💾 Sauvegarde</button>
        <button class="btn-small ghost" id="ps-player">✏️ Prénom, âge, compagnon, remise à zéro</button>
      </div>
    </section>
  `);
  bindQuit();
  document.querySelectorAll('[data-ps]').forEach(b=> b.onclick = ()=>{ playSound('tap'); openParentSpace(b.dataset.ps); });
  document.querySelectorAll('[data-pause]').forEach(b=> b.onclick = ()=>{
    playSound('tap'); p.pauseMin = Number(b.dataset.pause); saveProfiles();
    document.querySelectorAll('[data-pause]').forEach(x=>x.classList.toggle('on', x===b));
    showToast(p.pauseMin ? `😴 Pause après ${p.pauseMin} min` : 'Pas de pause');
  });
  document.getElementById('ps-backup').onclick = ()=>{ playSound('tap'); openBackup(); };
  document.getElementById('ps-player').onclick = ()=>{ playSound('tap'); openPlayerSettings(p.id); };
}
function openParents(){ openParentGate(()=> openParentSpace(), ()=> openPlayers()); }
