/* ---------- Une pause qui tient (track pause-verrou) ----------
   Quand le temps de jeu du jour est atteint (règle : js/features/parents,
   pauseDue), un VOILE flouté couvre tout le jeu : le contenu dessous est
   inerte, rien n'est touchable. Il revient toujours (chargement, retour dans
   l'application, changement de vue, minuterie) et ne se lève que le lendemain
   ou par un adulte (la multiplication de la porte des parents).

   Ce que la recherche nous fait garder (voir la spec de la track) :
   - fin naturelle : une mission en cours se termine, puis le voile arrive ;
   - pas de compte à rebours : seul un bâillement du compagnon, un peu avant ;
   - une cause extérieure : c'est le compagnon qui est fatigué ;
   - le choix d'une activité (bouger, yoga, respirer, idée hors écran),
     courte, puis l'écran s'endort : une seule activité par pause ;
   - aucune récompense pendant la pause. */
import { charFace } from '../../entities/character/index.js';
import { COMPANIONS, companionSVG, currentCompanion } from '../../entities/companion/index.js';
import { save, state } from '../../entities/game-state/index.js';
import { currentProfile, onProfileRefresh, party, profiles } from '../../entities/player/index.js';
import { on, pickRandom } from '../../shared/lib/index.js';
import { closeModal, onModalClose, onViewChange, playSound, showToast, speak, switchView } from '../../shared/ui/index.js';
import { todayKey } from '../adaptive/index.js';
import { pauseAnnouncer } from '../companion-team/index.js';
import { openParentGate, pauseDue, pauseMinutesLeft } from '../parents/index.js';
import { stopParty } from '../party/index.js';
import { grisouSVG } from '../story/index.js';

/* ---- les activités ----
   Mouvements et postures sûrs pour les 4-10 ans (pas d'équilibre sur la tête,
   pas de saut en hauteur). `art` : un personnage des îles (char) ou un
   compagnon (comp). `sec` : durée d'une étape. */
const REST_STEP_SEC = 20;
const REST_ACTIVITIES = {
  move: { emoji:'🤸', label:'Bouger comme les animaux', said:'bouger comme les animaux',
    intro:'On bouge comme les animaux ! Fais attention autour de toi.',
    steps:[
      { char:'rainette', anim:'jump',  say:'Saute comme la grenouille : accroupis-toi… et hop, un petit saut ! Encore !' },
      { char:'sirene',   anim:'swim',  say:'Nage comme la sirène : fais de grands cercles avec tes bras.' },
      { char:'singe',    anim:'climb', say:'Grimpe comme le singe : lève une main, puis l\'autre, sur place.' },
    ] },
  yoga: { emoji:'🧘', label:'Le yoga des animaux', said:'le yoga des animaux',
    intro:'Le yoga des animaux. On prend son temps, et on respire.',
    steps:[
      { comp:'lili',  anim:'tree',    say:'L\'arbre : un pied contre ta jambe, les bras en l\'air comme des branches. Inspire… souffle…' },
      { char:'kiki',  anim:'cat',     say:'Le chat : à quatre pattes, fais le dos rond… puis le dos creux. Inspire… souffle…' },
      { comp:'perle', anim:'mermaid', say:'La sirène : assis, les jambes sur le côté, lève un bras au-dessus de ta tête. Inspire… souffle…' },
    ] },
  breathe: { emoji:'🌬️', label:'Respirer avec Grisou', said:'respirer avec Grisou',
    intro:'On respire avec Grisou, tout doucement.', breaths:5 },
  offscreen: { emoji:'🎨', label:'Une idée sans écran', said:'une activité sans écran',
    ideas:[
      'Dessine ton squishy préféré sur une feuille de papier.',
      'Choisis un livre et regarde les images, ou lis-le avec quelqu\'un.',
      'Aide à la maison : mettre la table, ranger tes jouets.',
      'Va jouer dehors, si un adulte est d\'accord.',
      'Construis une cabane avec des coussins.',
    ] },
};

/* ---- le journal des pauses (dans la partie de l'enfant) ---- */
function restLogToday(){
  if(!state.restLog || typeof state.restLog !== 'object') state.restLog = {};
  const k = todayKey();
  if(!state.restLog[k]) state.restLog[k] = { at:null, activity:null, skipped:false, attempts:0 };
  return state.restLog[k];
}
function restKeepDays(){
  const keys = Object.keys(state.restLog || {}).sort();
  while(keys.length > 14) delete state.restLog[keys.shift()];
}
const hhmm = (d)=> `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;

/* ---- le voile ---- */
let inMission = false;          // une mission est en cours : on la laisse finir
let restTimers = [];            // étapes d'une activité (annulables)
let restGrace = null;           // { id, until } : un adulte fait changer de joueur
const restLater = (fn, ms)=>{ const t = setTimeout(fn, ms); restTimers.push(t); return t; };
function restClearTimers(){ restTimers.forEach(clearTimeout); restTimers = []; }

function veilEl(){
  let el = document.getElementById('rest-veil');
  if(!el){
    el = document.createElement('div');
    el.id = 'rest-veil';
    el.hidden = true;
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-modal', 'true');
    el.setAttribute('aria-label', 'C\'est l\'heure de la pause');
    document.body.appendChild(el);
  }
  return el;
}
function restActive(){ const el = document.getElementById('rest-veil'); return !!el && !el.hidden; }
function setAppInert(on){
  const app = document.getElementById('app');
  if(app){ app.inert = on; if(on) app.setAttribute('inert', ''); else app.removeAttribute('inert'); }
  document.body.classList.toggle('resting', on);
}

// le compagnon qui annonce la pause (Grisou s'il est dans l'équipe, v52)
function restBuddyId(){ return pauseAnnouncer() || currentCompanion(); }
function restBuddyHTML(asleep){
  return `<div class="rest-buddy sleepy ${asleep ? 'asleep' : 'yawn'}" aria-hidden="true">
    <span class="rest-nightcap"><svg viewBox="0 0 60 40"><path d="M4 36 Q20 4 52 10 Q40 18 44 34 Z" fill="#7C6CE0"/><path d="M2 34 h44 v6 h-44 Z" fill="#fff" opacity=".9"/><circle cx="53" cy="10" r="5" fill="#fff"/></svg></span>
    ${companionSVG(restBuddyId(), 'sleepy')}
    <span class="rest-zzz">z<span>z</span><span>z</span></span>
  </div>`;
}
function restNightHTML(){
  const stars = Array.from({ length:14 }, (_, i)=> `<span class="rest-star" style="left:${(i * 37) % 100}%; top:${(i * 23) % 60}%; animation-delay:${(i % 5) * .4}s"></span>`).join('');
  return `<div class="rest-night" aria-hidden="true"><span class="rest-moon"></span>${stars}</div>`;
}
function restAdultBtn(){ return `<button type="button" class="rest-adult" id="rest-adult">🔒 Un adulte</button>`; }

function renderVeil(stageName, extra){
  const el = veilEl();
  el.dataset.stage = stageName;
  if(stageName === 'choose'){
    el.innerHTML = `${restNightHTML()}
      <div class="rest-box">
        ${restBuddyHTML(false)}
        <h2>C'est l'heure de la pause</h2>
        <p class="rest-say">${extra}</p>
        <div class="rest-cards">
          ${Object.entries(REST_ACTIVITIES).map(([k, a])=> `<button type="button" class="rest-card" data-rest-act="${k}" data-say="${a.label}">
            <span class="rest-card-emoji" aria-hidden="true">${a.emoji}</span><span>${a.label}</span></button>`).join('')}
        </div>
        <div class="rest-foot"><button type="button" class="rest-skip" id="rest-skip">Pas maintenant</button>${restAdultBtn()}</div>
      </div>`;
  } else if(stageName === 'asleep'){
    el.innerHTML = `${restNightHTML()}
      <div class="rest-box">
        ${restBuddyHTML(true)}
        <h2>À demain !</h2>
        ${extra ? `<p class="rest-idea">${extra}</p>` : '<p class="rest-say">L\'île dort. On revient demain.</p>'}
        <div class="rest-foot">${restAdultBtn()}</div>
      </div>`;
  } else if(stageName === 'adult'){
    el.innerHTML = `${restNightHTML()}
      <div class="rest-box">
        <h2>🔒 Pour les adultes</h2>
        <div class="rest-adult-menu">
          <button type="button" class="btn-small" id="rest-add10">⏱️ + 10 minutes</button>
          <button type="button" class="btn-small" id="rest-add30">⏱️ + 30 minutes</button>
          <button type="button" class="btn-small" id="rest-endday">🌞 Fin de la pause pour aujourd'hui</button>
          <button type="button" class="btn-small ghost" id="rest-switch">👥 Changer de joueur</button>
          <button type="button" class="btn-small ghost" id="rest-back">Retour</button>
        </div>
      </div>`;
  }
  bindVeil(el);
  const first = el.querySelector('button');
  if(first) setTimeout(()=>{ try{ first.focus(); }catch(e){} }, 0);
}

function restIntroLine(){
  const id = restBuddyId(), c = COMPANIONS[id] || {};
  if(id === pauseAnnouncer()) return 'Viens, on respire tout doucement, comme un petit nuage… On a bien joué aujourd\'hui ! Avant de dormir, tu choisis une activité avec moi ?';
  const tired = c.group === 'f' ? 'toute fatiguée' : 'tout fatigué';
  return `Je suis ${tired}… On a bien joué aujourd'hui ! Avant de dormir, tu choisis une activité avec moi ?`;
}

function showVeil(){
  const log = restLogToday();
  if(!log.at){ log.at = hhmm(new Date()); restKeepDays(); save(); }
  if(party.active) stopParty();   // à plusieurs : la partie s'arrête à la fin de la mission
  closeModalQuietly();
  veilEl().hidden = false;
  veilEl().classList.remove('rest-behind');
  setAppInert(true);
  if(log.activity || log.skipped) renderVeil('asleep');
  else {
    const line = restIntroLine();
    renderVeil('choose', line);
    speak(line);
  }
}
// fermer une fenêtre (hors mission) sans que la fermeture relance maybeRest
let closingQuietly = false;
function closeModalQuietly(){
  if(!document.getElementById('overlay') || !document.getElementById('overlay').classList.contains('show')) return;
  closingQuietly = true; closeModal(); closingQuietly = false;
}

// lever le voile (adulte, nouveau jour, autre joueur)
function restWake(){
  restClearTimers();
  const el = document.getElementById('rest-veil');
  if(el){ el.hidden = true; el.innerHTML = ''; el.classList.remove('rest-behind'); }
  setAppInert(false);
}

// le voile doit-il être là ? (appelé souvent : il revient toujours)
function maybeRest(){
  const splash = document.getElementById('splash');
  if(splash && splash.classList.contains('show')) return;
  if(!pauseDue()){ if(restActive()) restWake(); return; }
  if(restGrace && restGrace.id === profiles.current && Date.now() < restGrace.until) return;
  if(restActive() || inMission) return;
  showVeil();
}

/* ---- avant la limite : un bâillement (pas de compte à rebours) ---- */
function restTick(){
  const left = pauseMinutesLeft();
  const b = document.getElementById('team-btn');
  if(b) b.classList.toggle('yawning', left > 0 && left <= 5 && !restActive());
  maybeRest();
}

/* ---- les activités ---- */
function restArt(step){
  if(step.comp) return `<span class="rest-step-art anim-${step.anim}">${companionSVG(step.comp, 'happy')}</span>`;
  return `<span class="rest-step-art anim-${step.anim}">${charFace(step.char)}</span>`;
}
function startRestActivity(key){
  const a = REST_ACTIVITIES[key];
  if(!a) return;
  restClearTimers();
  const el = veilEl();
  if(key === 'offscreen'){
    const idea = pickRandom(a.ideas);
    finishRestActivity(key, idea);
    return;
  }
  el.dataset.stage = 'activity';
  if(key === 'breathe'){
    el.innerHTML = `${restNightHTML()}
      <div class="rest-box">
        <h2>${a.emoji} ${a.label}</h2>
        <div class="rest-grisou" aria-hidden="true">${grisouSVG(6)}</div>
        <p class="rest-say" id="rest-phase">${a.intro}</p>
        <div class="rest-progress" aria-hidden="true"><i></i></div>
      </div>`;
    speak(a.intro);
    const g = el.querySelector('.rest-grisou'), phase = el.querySelector('#rest-phase'), bar = el.querySelector('.rest-progress i');
    const CYCLE = 8000;
    for(let i = 0; i < a.breaths; i++){
      restLater(()=>{ g.classList.add('inhale'); g.classList.remove('exhale'); phase.textContent = 'On inspire…'; speak('On inspire…');
        bar.style.width = `${Math.round((i + .5) / a.breaths * 100)}%`; }, 1500 + i * CYCLE);
      restLater(()=>{ g.classList.add('exhale'); g.classList.remove('inhale'); phase.textContent = 'On souffle…'; speak('On souffle…');
        bar.style.width = `${Math.round((i + 1) / a.breaths * 100)}%`; }, 1500 + i * CYCLE + CYCLE / 2);
    }
    restLater(()=> finishRestActivity(key), 1500 + a.breaths * CYCLE);
    return;
  }
  // bouger, yoga : 3 étapes guidées
  speak(a.intro);
  const runStep = (i)=>{
    if(i >= a.steps.length){ finishRestActivity(key); return; }
    const s = a.steps[i];
    el.innerHTML = `${restNightHTML()}
      <div class="rest-box">
        <h2>${a.emoji} ${a.label}</h2>
        ${restArt(s)}
        <p class="rest-say">${s.say}</p>
        <div class="rest-progress" aria-hidden="true"><i style="width:${Math.round(i / a.steps.length * 100)}%"></i></div>
      </div>`;
    speak(s.say);
    const bar = el.querySelector('.rest-progress i');
    restLater(()=>{ bar.style.width = `${Math.round((i + 1) / a.steps.length * 100)}%`; }, 50);
    restLater(()=> runStep(i + 1), REST_STEP_SEC * 1000);
  };
  restLater(()=> runStep(0), 1500);
  // premier écran tout de suite (le temps que la voix lise l'intro)
  const s0 = a.steps[0];
  el.innerHTML = `${restNightHTML()}<div class="rest-box"><h2>${a.emoji} ${a.label}</h2>${restArt(s0)}<p class="rest-say">${a.intro}</p>
    <div class="rest-progress" aria-hidden="true"><i></i></div></div>`;
}
function finishRestActivity(key, idea){
  const log = restLogToday();
  log.activity = key; save();
  restClearTimers();
  playSound('good');
  speak(idea ? `${idea} Bravo ! À demain !` : 'Bravo ! À demain !');
  renderVeil('asleep', idea || '');
}

/* ---- les boutons du voile ---- */
function bindVeil(el){
  el.querySelectorAll('[data-rest-act]').forEach(b=> b.onclick = ()=>{ playSound('tap'); startRestActivity(b.dataset.restAct); });
  const skip = el.querySelector('#rest-skip');
  if(skip) skip.onclick = ()=>{ playSound('tap'); const log = restLogToday(); log.skipped = true; save(); speak('D\'accord. Bonne nuit, à demain !'); renderVeil('asleep'); };
  const adult = el.querySelector('#rest-adult');
  if(adult) adult.onclick = ()=>{
    playSound('tap');
    el.classList.add('rest-behind');   // la porte des parents passe devant le voile
    openParentGate(()=>{ closeModalQuietly(); el.classList.remove('rest-behind'); renderVeil('adult'); },
      ()=>{ closeModalQuietly(); el.classList.remove('rest-behind'); },
      ()=>{ const log = restLogToday(); log.attempts = (log.attempts || 0) + 1; save(); });
  };
  const addMin = (min)=>{
    const k = todayKey();
    const cur = state.pauseExtra && state.pauseExtra.date === k ? state.pauseExtra.min : 0;
    state.pauseExtra = { date:k, min: cur + min }; save();
    restWake(); showToast(min >= 24 * 60 ? '🌞 Plus de pause aujourd\'hui' : `⏱️ ${min} minutes de plus`);
  };
  const on10 = el.querySelector('#rest-add10'); if(on10) on10.onclick = ()=> addMin(10);
  const on30 = el.querySelector('#rest-add30'); if(on30) on30.onclick = ()=> addMin(30);
  const end = el.querySelector('#rest-endday'); if(end) end.onclick = ()=> addMin(24 * 60);
  const sw = el.querySelector('#rest-switch'); if(sw) sw.onclick = ()=>{
    restGrace = { id: profiles.current, until: Date.now() + 2 * 60 * 1000 };
    restWake(); switchView('reglages');
  };
  const back = el.querySelector('#rest-back'); if(back) back.onclick = ()=>{
    const log = restLogToday();
    if(log.activity || log.skipped) renderVeil('asleep'); else renderVeil('choose', restIntroLine());
  };
}

/* ---- le lendemain : le compagnon se souvient ---- */
function restRecallYesterday(){
  const today = todayKey();
  if(state.restRecall === today) return;
  const y = todayKey(new Date(Date.now() - 864e5));
  const log = state.restLog && state.restLog[y];
  if(!log || !log.activity) return;
  const a = REST_ACTIVITIES[log.activity];
  const line = log.activity === 'offscreen' ? 'Hier, tu as fait une activité sans écran. Bravo !' : `Hier, on a fait ${a.said} ensemble !`;
  state.restRecall = today; save();
  speak(line); showToast(`${a.emoji} ${line}`);
}

/* ---- espace parents : les pauses des 7 derniers jours ---- */
on('parents:cards', ({ st })=>{
  const days = [];
  for(let i = 0; i < 7; i++) days.push(todayKey(new Date(Date.now() - i * 864e5)));
  const logs = days.map(k=> [k, (st.restLog || {})[k]]).filter(([, l])=> l && (l.at || l.attempts));
  const fam = Number(profiles.familyPause) || 0;
  const label = (l)=> l.activity ? `${REST_ACTIVITIES[l.activity].emoji} ${REST_ACTIVITIES[l.activity].label}` : l.skipped ? 'activité passée' : '—';
  return `<section class="bk-card ps-rest"><h3>🌙 Pauses</h3>
    ${logs.length ? `<ul class="ps-rest-list">${logs.map(([k, l])=> `<li><strong>${k.slice(8, 10)}/${k.slice(5, 7)}</strong>
      ${l.at ? `pause à ${l.at} · ${label(l)}` : 'pas de pause'}${l.attempts ? ` · ${l.attempts} tentative${l.attempts > 1 ? 's' : ''} de continuer (mauvaise réponse à la question des adultes)` : ''}</li>`).join('')}</ul>`
      : '<p>Pas encore de pause ces 7 derniers jours.</p>'}
    <p class="bk-help">Les tentatives sont notées pour en parler ensemble, sans reproche.</p>
    <p class="bk-help">Pause des nouveaux joueurs : <strong>${fam ? fam + ' min' : 'aucune'}</strong> (le dernier choix d'un adulte).</p>
    <p class="bk-help">Pour aller plus loin, les contrôles de l'appareil limitent aussi les autres applications : Temps d'écran (iPhone, iPad), Family Link (Android).</p>
  </section>`;
});

/* ---- branchements : le voile revient toujours ---- */
on('game:before', ()=>{
  if(pauseDue()){ maybeRest(); return true; }   // aucun nouveau mini-jeu
  inMission = true;
  return false;
});
// fin naturelle : on laisse voir l'écran de victoire, puis le voile arrive
on('game:after', ()=>{ inMission = false; setTimeout(maybeRest, 2500); });
onModalClose(()=>{ inMission = false; if(!closingQuietly) setTimeout(maybeRest, 0); });
onViewChange(()=> maybeRest());
// un autre joueur : le délai accordé par l'adulte s'arrête (revenir sur l'enfant en pause fait revenir le voile)
onProfileRefresh(()=>{ if(restGrace && restGrace.id !== profiles.current) restGrace = null; if(restActive() && !pauseDue()) restWake(); maybeRest(); });
if(typeof document !== 'undefined'){
  document.addEventListener('visibilitychange', ()=>{ if(document.visibilityState !== 'hidden') maybeRest(); });
  // le voile garde la main : Échap ne ferme rien dessous
  document.addEventListener('keydown', (e)=>{ if(restActive() && !veilEl().classList.contains('rest-behind') && e.key === 'Escape'){ e.stopImmediatePropagation(); e.preventDefault(); } }, true);
  setInterval(restTick, 15000);
}

export {
  maybeRest, REST_ACTIVITIES, restActive, restLogToday, restRecallYesterday, restTick, restWake, startRestActivity
};
