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
     state.skills[jeu]  = { wins, fails, errors, last, recent:[{t, e, ok}…10], hints }
                          (hints : indices demandés au compagnon, v52)
     state.playTime[jour] = secondes de jeu ACTIF ce jour-là (60 jours gardés)
     state.pauseExtra   = { date, min }  minutes ajoutées par un adulte aujourd'hui
   Réglage dans le profil : profile.pauseMin (0 = pas de pause). */
import {
  avatarHTML, buddySlot, COMPANIONS, companionSVG, currentCompanion
} from '../../entities/companion/index.js';
import { GAME_LIST, gameTypesForAge } from '../../entities/difficulty/index.js';
import { save, state } from '../../entities/game-state/index.js';
import {
  currentProfile, party, profiles, profileSaveKey, saveProfiles
} from '../../entities/player/index.js';
import { currentSeason, FETES, seasonPreview } from '../../entities/season/index.js';
import { on } from '../../shared/lib/index.js';
import { closeModal, openModal, playSound, showToast, speak } from '../../shared/ui/index.js';
import { SKILL_STATUS, skillStatus, todayKey } from '../adaptive/index.js';
import { openBackup } from '../backup/index.js';
import { pauseAnnouncer } from '../companion-team/index.js';
import { openPlayers, openPlayerSettings } from '../players/index.js';
import { renderSoundBtn } from '../profile/index.js';
import { bindQuit, gameHeader } from '../screen/index.js';
import { setSeasonPreview } from '../seasons/index.js';

const SKILL_GROUPS = [
  { id:'lire',     emoji:'📖', name:'Lecture et langage',  games:['reading','determinants'] },
  { id:'nombres',  emoji:'🔢', name:'Nombres',             games:['count','puzzle','compare'] },
  { id:'calcul',   emoji:'➕', name:'Calcul',              games:['math','calc','money'] },
  { id:'mesures',  emoji:'🕐', name:'Temps et mesures',    games:['clock','calendar','volume'] },
  { id:'formes',   emoji:'🔷', name:'Formes et espace',    games:['shapes','jigsaw','nesting','cubes'] },
  { id:'sciences', emoji:'🪐', name:'Sciences',            games:['planets'] },
  { id:'logique',  emoji:'🧠', name:'Mémoire et logique',  games:['memory','simon','diff','sequence','rangement'] },
];
// activités suivies qui ne sont pas des mini-jeux du choix des jeux
// (les boîtes de rangement de la chambre à squishies, v53 : un tri)
const SKILL_EXTRA_NAMES = { rangement:'📦 Boîtes de rangement' };
const PAUSE_CHOICES = [0, 15, 20, 30, 45, 60];

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
  const p = currentProfile();
  return (p && Number(p.pauseMin)) || 0;
}
function pauseDue(){
  if(party.active) return false;   // à plusieurs : pas de coupure au milieu
  const limit = pauseLimit();
  if(!limit) return false;
  const extra = state.pauseExtra && state.pauseExtra.date === todayKey() ? state.pauseExtra.min : 0;
  return playMinutesToday() >= limit + extra;
}
function showPauseScreen(){
  const p = currentProfile();
  const comp = currentCompanion();
  const c = comp && COMPANIONS[comp];
  const cName = c ? c.name : 'Ton compagnon';
  const tired = c && c.group==='f' ? 'fatiguée' : 'fatigué';
  // Grisou (câlins, v52) annonce la pause en respirant tout doucement, à la
  // place du compagnon qui s'endort ; la durée reste le réglage des parents
  const hug = pauseAnnouncer();
  // espaces insécables avant « ! ? : » (typographie française, pas de retour à la ligne)
  const msg = hug
    ? `Tu as bien joué aujourd'hui${p && p.name ? ', ' + p.name : ''}\u00a0! Viens, on respire tout doucement, comme un petit nuage\u00a0: on fait une pause et on revient demain\u00a0?`
    : `Tu as bien joué aujourd'hui${p && p.name ? ', ' + p.name : ''}\u00a0! ${cName} est ${tired}\u00a0: on fait une pause et on revient demain\u00a0?`;
  openModal(`
    <div class="reward-box pause-box ${hug ? 'pause-hug' : ''}">
      ${hug ? `<span class="buddy-slot buddy-big breathe" aria-hidden="true">${companionSVG(hug, 'happy')}</span>` : buddySlot('sleepy','buddy-big')}
      <h2>C'est l'heure de la pause</h2>
      <div class="speech">${msg}</div>
      <p class="pause-note">Tu peux encore regarder ton île, ton sac et ton album.</p>
    </div>
    <button class="btn-primary" id="pause-ok">D'accord 😴</button>
    <button class="btn-ghost" id="pause-more">Un adulte peut ajouter 10 minutes</button>
  `);
  speak(hug ? `${COMPANIONS[hug].name} : ${msg}` : msg);
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
  const gameName = k=>{ const g = GAME_LIST.find(x=>x.key===k); return g ? `${g.emoji} ${g.name}` : (SKILL_EXTRA_NAMES[k] || k); };
  // les jeux proposés à cet âge, plus ceux déjà joués (avant un changement d'âge)
  const allowed = new Set([...gameTypesForAge(age), ...Object.keys(sk)]);
  const summary = { aise:[], difficile:[] };
  const groups = SKILL_GROUPS.map(gr=>{
    const rows = gr.games.filter(k=>allowed.has(k)).map(k=>{
      const s = sk[k], status = skillStatus(s, k), info = SKILL_STATUS[status];
      if(status==='aise' || status==='difficile') summary[status].push(gameName(k));
      const lastTier = s ? (s.lvl || (s.recent.length ? s.recent[s.recent.length-1].t : null)) : null;
      // les indices (v52) sont montrés à côté des erreurs, sans jugement
      const hints = s && s.hints ? ` · ${s.hints} indice${s.hints>1?'s':''} demandé${s.hints>1?'s':''}` : '';
      const detail = s ? `${s.wins} réussie${s.wins>1?'s':''}${s.fails?` · ${s.fails} ratée${s.fails>1?'s':''}`:''} · ${(s.wins+s.fails) ? (s.errors/(s.wins+s.fails)).toFixed(1).replace('.',',') : '0'} erreur par mission${hints}${lastTier ? ` · niveau ${'⭐'.repeat(Math.min(lastTier,6))}`:''}${s.support ? ' (redescendu d\'un cran pour s\'entraîner)' : ''}` : '';
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
      <p class="bk-help">Les indices du compagnon (💡) sont comptés pour information : ils ne changent ni les récompenses ni le niveau du jeu.</p>
      <p class="bk-help">Chaque jeu a son propre niveau : il monte d'un cran après 2 réussites d'affilée presque sans erreur, redescend d'un cran après 2 missions ratées, et ne dépasse jamais celui de l'île ni l'âge de l'enfant. Les jeux à travailler reviennent plus souvent.</p></section>
    <section class="bk-card"><h3>🎉 Fêtes et saisons</h3>
      <p>Le jeu se décore tout seul : Halloween (20 oct. – 2 nov.), Noël (1er déc. – 6 janv.) et le jour de l'anniversaire de l'enfant (à régler dans ses réglages). Chaque fois, un petit cadeau : un chapeau pour son avatar et quelques pièces.</p>
      <p class="bk-help">Aperçu (sans cadeau, jusqu'à la fermeture du jeu) :</p>
      <div class="ps-chips" role="group" aria-label="Aperçu des saisons">
        ${Object.keys(FETES).map(k=>`<button type="button" class="ps-chip ${seasonPreview()===k?'on':''}" data-season-preview="${k}">${FETES[k].emoji} ${FETES[k].name}</button>`).join('')}
        <button type="button" class="ps-chip ${!seasonPreview()?'on':''}" data-season-preview="">Selon la date</button>
      </div>
    </section>
    <section class="bk-card"><h3>⚙️ Réglages</h3>
      <div class="ps-chips" role="group" aria-label="Musique d'ambiance">
        <button type="button" class="ps-chip ${st.music ? 'on' : ''}" data-music="1">🎵 Musique d'ambiance</button>
        <button type="button" class="ps-chip ${st.music ? '' : 'on'}" data-music="0">Pas de musique</button>
      </div>
      <p class="bk-help">Une petite musique douce, différente sur chaque île, qui baisse quand la voix parle. L'enfant peut aussi la couper avec le bouton du son, en haut.</p>
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
  document.querySelectorAll('[data-season-preview]').forEach(b=> b.onclick = ()=>{
    playSound('tap'); setSeasonPreview(b.dataset.seasonPreview || null);
    document.querySelectorAll('[data-season-preview]').forEach(x=>x.classList.toggle('on', x===b));
    const s = currentSeason();
    showToast(s ? `${FETES[s].emoji} Aperçu : ${FETES[s].name}` : 'Pas de fête aujourd\'hui');
  });
  document.querySelectorAll('[data-music]').forEach(b=> b.onclick = ()=>{
    playSound('tap');
    const on = b.dataset.music === '1';
    if(p.id === profiles.current){ state.music = on; if(on){ state.sound = true; state.voice = true; } save(); renderSoundBtn(); }
    else { st.music = on; try{ localStorage.setItem(profileSaveKey(p.id), JSON.stringify(st)); }catch(e){} }
    document.querySelectorAll('[data-music]').forEach(x=>x.classList.toggle('on', x===b));
    showToast(on ? '🎵 Musique d\'ambiance' : 'Pas de musique');
  });
  document.getElementById('ps-backup').onclick = ()=>{ playSound('tap'); openBackup(); };
  document.getElementById('ps-player').onclick = ()=>{ playSound('tap'); openPlayerSettings(p.id); };
}
function openParents(){ openParentGate(()=> openParentSpace(), ()=> openPlayers()); }

// le panneau des joueurs ouvre l'espace parents ; avant chaque mini-jeu, la
// pause douce peut l'empêcher (le moteur, plus bas, demande avec game:before)
on('nav:parents', openParents);
on('game:before', ()=>{ if(pauseDue()){ showPauseScreen(); return true; } return false; });

export { startPlayTimeTracker };
