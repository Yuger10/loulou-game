/* ---------- Les spécialités des compagnons (v52) ----------
   Une spécialité agit quand son compagnon est équipier actif, ou principal
   une fois l'équipe ouverte (niveau 10), jamais pendant une course (pour
   rester équitable). Le compagnon concerné apparaît et parle quand elle
   agit, pour que l'enfant associe chaque aide à son ami. Une seule
   spécialité parle à la fois (file d'attente), et les indices passent avant.
   - Lili, indices magiques : le 💡 se propose après 5 s (au lieu de 10),
     paillettes à l'indice 2 ; c'est elle qui aide aux énigmes d'histoire.
   - Perle, conteuse : un bouton « 🔁 Relire » (plus lentement) sur les
     dialogues, consignes et chapitres ; en lecture, les syllabes dès l'indice 1.
   - Grisou, câlins (track Licornes) : il console après 2 erreurs d'affilée,
     et annonce la pause douce réglée par les parents (aucun minuteur à lui).
   - Léo, tuteur : il incarne le jeu adaptatif existant (v42) : il annonce un
     jeu « à travailler » (1 fois par session), dit la phrase de progrès, et
     rappelle la méthode (indice 1) avant un jeu en soutien.
   - Sam, guide : une bulle avec une flèche montre la prochaine chose utile
     (mission du jour, nouvelle île, chapitre d'histoire, ami jamais aidé).
   - Zap, défis : 1 fois par jour et par île, un défi bonus un cran au-dessus
     du niveau du jeu (plafond de l'âge), récompense doublée, sans effet sur
     le niveau, toujours refusable.
   - Tom, trésors : 1 fois par jour, après une mission réussie, des pièces ou
     un objet de l'île en plus.
   - Rose, collection : dans le Sac, l'Album et « Mon look », ce qui manque et
     où le trouver.
   Compteurs du jour : state.team.day = { date, zap:{ île:true }, tom:bool }. */
import { CHARACTERS, charsOf } from '../../entities/character/index.js';
import { COMPANIONS, companionSVG, currentCompanion } from '../../entities/companion/index.js';
import { GAME_LIST, gameTypesForAge } from '../../entities/difficulty/index.js';
import { save, state } from '../../entities/game-state/index.js';
import { addItem, ITEMS } from '../../entities/item/index.js';
import { ac, currentPlayerAge, onProfileRefresh, party, race } from '../../entities/player/index.js';
import {
  availableItems, currentWorld, WORLD_ORDER, WORLDS, worldUnlocked
} from '../../entities/world/index.js';
import { emit, on, pickRandom } from '../../shared/lib/index.js';
import { bindSpeakButtons, onModalOpen, playSound, speak, switchView } from '../../shared/ui/index.js';
import { bonusChallenge, needsPractice, todayKey } from '../adaptive/index.js';
import { markSeen } from '../bag/index.js';
import { hintLevel, hintShowFirst, setHintPolicy } from '../hints/index.js';
import { openDialogue, setWorld } from '../island/index.js';
import { ensureQuests, openQuestsModal } from '../quests/index.js';
import { openStoryChapter, STORY, storySolved } from '../story/index.js';
import { addCoins } from '../wallet/index.js';
import { ownsLookItem, WARDROBE } from '../wardrobe/index.js';
import { teamIsOpen, teamMates, teamPrincipal, teamState } from './team.js';

function specialtyOn(id){
  if(race.active || !COMPANIONS[id]) return false;
  return teamMates().includes(id) || (id === teamPrincipal() && teamIsOpen());
}
// en solo seulement (progression personnelle : défis, trésors, guide, tuteur)
function soloSpecialtyOn(id){ return !party.active && specialtyOn(id); }

function teamDay(){
  const t = teamState(), d = todayKey();
  if(!t.day || t.day.date !== d) t.day = { date:d, zap:{}, tom:false };
  return t.day;
}

/* ---- la file de parole : une seule spécialité parle à la fois ---- */
const TEAM_SAY_MS = 4200;      // durée d'une bulle
const HINT_HOLD_MS = 3500;     // après un indice, les spécialités attendent
let teamSayQueue = [], teamSaying = null, teamSayTimer = null, teamHold = null;
function teamSay(id, text, opts){
  opts = opts || {};
  if(!COMPANIONS[id]) return;
  teamSayQueue.push({ id, text, onTap: opts.onTap || null });
  if(!teamSaying && !teamHold) teamSayNext();
}
function teamSayNext(){
  clearTimeout(teamSayTimer);
  const el = teamSayEl();
  if(teamHold) return;                 // un indice parle : on attend
  const it = teamSayQueue.shift();
  teamSaying = it || null;
  if(!it){ el.classList.remove('show'); return; }
  el.innerHTML = `<span class="ts-face" aria-hidden="true">${companionSVG(it.id, 'cheer')}</span><span class="ts-txt"><b>${COMPANIONS[it.id].name}</b> ${it.text}</span>`;
  el.dataset.who = it.id;
  el.classList.remove('show'); void el.offsetWidth; el.classList.add('show');
  speak(`${COMPANIONS[it.id].name} : ${it.text}`);
  teamSayTimer = setTimeout(teamSayNext, TEAM_SAY_MS);
}
function teamSayEl(){
  let el = document.getElementById('team-say');
  if(!el){
    el = document.createElement('button');
    el.type = 'button'; el.id = 'team-say'; el.className = 'team-say';
    el.setAttribute('aria-live', 'polite');
    el.onclick = ()=>{ const it = teamSaying; playSound('tap'); if(it && it.onTap) it.onTap(); teamSayNext(); };
    document.body.appendChild(el);
  }
  return el;
}
// un indice vient d'être donné : il passe avant ; la bulle en cours reprendra après
function teamHintSpoken(){
  if(teamSaying) teamSayQueue.unshift(teamSaying);
  teamSaying = null;
  clearTimeout(teamSayTimer); clearTimeout(teamHold);
  teamSayEl().classList.remove('show');
  teamHold = setTimeout(()=>{ teamHold = null; teamSayNext(); }, HINT_HOLD_MS);
}
function teamSayClear(){
  teamSayQueue = []; teamSaying = null;
  clearTimeout(teamSayTimer); clearTimeout(teamHold); teamHold = null;
  const el = document.getElementById('team-say');
  if(el) el.classList.remove('show');
}

/* ---- Lili, Perle, Léo, Grisou : branchés sur les indices du moteur ---- */
let grisouErrors = 0;
const leoSession = { announced:false, primed:{} };
setHintPolicy({
  // Lili donne les indices des énigmes, et l'indice 2 (avec ses paillettes)
  giver: (kind, level)=> specialtyOn('lili') && (kind === 'riddle' || level === 2) ? 'lili' : currentCompanion(),
  idleMs: ()=> specialtyOn('lili') ? 5000 : 10000,
  sparkle: ()=> specialtyOn('lili'),
  syllablesFirst: ()=> specialtyOn('perle'),
  onUse: ()=> teamHintSpoken(),
  onError: (kind)=>{
    grisouErrors++;
    if(grisouErrors >= 2 && specialtyOn('grisou')){
      grisouErrors = 0;
      teamSay('grisou', pickRandom(['Ce n\'est pas grave, on réessaie ensemble ☁️', 'Un petit câlin ☁️ Respire, et on recommence tout doucement.', 'Tu es courageux·se ! On essaie encore ensemble ☁️']).replace('courageux·se', ac('courageux', 'courageuse')));
    }
  },
  onGood: ()=>{ grisouErrors = 0; },
  onMission: ()=>{ grisouErrors = 0; },
  // Léo : avant la première question d'un jeu en soutien, il rappelle la méthode
  onShow: (kind)=>{
    if(!soloSpecialtyOn('leo') || hintLevel() > 0 || leoSession.primed[kind]) return;
    const s = (state.skills || {})[kind];
    if(!s || !s.support) return;
    leoSession.primed[kind] = true;
    setTimeout(()=> hintShowFirst('leo'), 700);   // après la consigne
  },
});

// Perle : « 🔁 Relire », plus lentement, sur les bulles qui se lisent à voix haute
function perleDecorate(){
  if(!specialtyOn('perle')) return;
  document.querySelectorAll('#modal-body .btn-speak[data-say]').forEach(b=>{
    if(b.nextElementSibling && b.nextElementSibling.classList.contains('btn-reread')) return;
    const r = document.createElement('button');
    r.type = 'button'; r.className = 'btn-reread';
    r.setAttribute('aria-label', 'Perle relit doucement');
    r.innerHTML = `<span class="rr-face" aria-hidden="true">${companionSVG('perle', 'happy')}</span>🔁`;
    r.onclick = (e)=>{ e.stopPropagation(); playSound('tap'); speak(b.dataset.say, { rate:.7 }); };
    b.insertAdjacentElement('afterend', r);
  });
}
onModalOpen(()=> setTimeout(perleDecorate, 0));

// Grisou annonce la pause douce des parents (js/features/parents/parents.js)
function pauseAnnouncer(){ return specialtyOn('grisou') ? 'grisou' : null; }

// Léo, dans le choix des jeux : un jeu « à travailler » proposé (1 fois par session)
function teamOnGamePicker(keys){
  if(!soloSpecialtyOn('leo') || leoSession.announced) return;
  const k = keys.find(x=> needsPractice(x));
  if(!k) return;
  leoSession.announced = true;
  const g = GAME_LIST.find(x=> x.key === k);
  const btn = document.querySelector(`#modal-body .game-choice[data-game="${k}"]`);
  if(btn && !btn.querySelector('.leo-badge')) btn.insertAdjacentHTML('beforeend', `<span class="leo-badge" aria-hidden="true">${companionSVG('leo', 'happy')}</span>`);
  teamSay('leo', `On s'entraîne ensemble ${g ? '« ' + g.name + ' »' : ''} ? Je suis avec toi !`);
}
// Léo dit la phrase de progrès sur l'écran de victoire (sinon, le compagnon)
function teamCheerBy(){ return soloSpecialtyOn('leo') ? 'leo' : null; }

/* ---- Sam : la prochaine chose utile ---- */
function samNextStep(){
  const q = ensureQuests();
  const quest = q && q.list.find(i=> i.n < i.goal);
  if(quest){
    if(quest.type === 'char' && CHARACTERS[quest.target]){
      const c = CHARACTERS[quest.target], w = c.world || 'lagon';
      return { icon:'📜', text:`Ta mission du jour : joue avec ${c.name} !`, go:()=>{ if(currentWorld !== w) setWorld(w); switchView('ile'); openDialogue(quest.target); } };
    }
    return { icon:'📜', text:`Ta mission du jour : ${quest.label.replace(/\s*\p{Extended_Pictographic}+$/u, '')}.`, go:()=> openQuestsModal() };
  }
  const fresh = WORLD_ORDER.find(id=> worldUnlocked(id) && id !== currentWorld && !(state.storyMissions || {})[id] && id !== 'lagon');
  if(fresh) return { icon:WORLDS[fresh].emoji, text:`Une nouvelle île t'attend : ${WORLDS[fresh].name} !`, go:()=>{ setWorld(fresh); switchView('ile'); } };
  const chap = WORLD_ORDER.find(id=> worldUnlocked(id) && STORY[id] && !storySolved(id));
  if(chap) return { icon:'📖', text:`L'énigme de ${WORLDS[chap].name} n'est pas encore résolue !`, go:()=> openStoryChapter(chap) };
  const helped = state.charsHelped || {};
  const friend = charsOf(currentWorld).map(([cid])=> cid).find(cid=> !helped[cid] && !CHARACTERS[cid].noGames);
  if(friend) return { icon:'💬', text:`${CHARACTERS[friend].name} n'a encore jamais joué avec toi !`, go:()=>{ switchView('ile'); openDialogue(friend); } };
  return null;
}
function renderSamGuide(){
  const step = soloSpecialtyOn('sam') ? samNextStep() : null;
  document.querySelectorAll('[data-sam-guide]').forEach(el=>{
    if(!step){ el.hidden = true; el.innerHTML = ''; return; }
    el.hidden = false;
    el.innerHTML = `<button type="button" class="sam-guide"><span class="sg-face" aria-hidden="true">${companionSVG('sam', 'happy')}</span>
      <span class="sg-txt"><b>Sam</b> ${step.text}</span><span class="sg-arrow" aria-hidden="true">${step.icon} ➜</span></button>`;
    el.querySelector('button').onclick = ()=>{ playSound('tap'); speak(`Sam : ${step.text}`); step.go(); };
  });
}

/* ---- Zap : le défi bonus du jour ---- */
function zapGameFor(){
  const allowed = gameTypesForAge(currentPlayerAge());
  const played = allowed.filter(k=> (state.skills || {})[k] && state.skills[k].wins);
  return pickRandom(played.length ? played : allowed);
}
function zapOfferDue(){
  return soloSpecialtyOn('zap') && !teamDay().zap[currentWorld];
}
function renderZapOffer(){
  const el = document.querySelector('[data-zap-offer]');
  if(!el) return;
  if(!zapOfferDue()){ el.hidden = true; el.innerHTML = ''; return; }
  el.hidden = false;
  el.innerHTML = `<div class="zap-offer"><span class="sg-face" aria-hidden="true">${companionSVG('zap', 'cheer')}</span>
    <span class="sg-txt"><b>Zap</b> Un défi bonus ? Un cran plus difficile, et la récompense est doublée !</span>
    <span class="zo-btns"><button type="button" class="btn-small" data-zap="yes">⚡ Oui !</button><button type="button" class="btn-small ghost" data-zap="no">Non merci</button></span></div>`;
  el.querySelector('[data-zap="yes"]').onclick = ()=>{ playSound('tap'); zapStart(); };
  el.querySelector('[data-zap="no"]').onclick = ()=>{ playSound('tap'); teamDay().zap[currentWorld] = true; save(); renderZapOffer(); speak('Zap : D\'accord, une autre fois !'); };
}
function zapStart(key){
  teamDay().zap[currentWorld] = true; save();
  renderZapOffer();
  emit('game:bonus', key || zapGameFor());   // le moteur lance le défi
}

/* ---- Tom (trésor du jour) et Zap (défi réussi) sur l'écran de victoire ---- */
const TOM_COINS = 5;
function teamWinExtras(){
  const out = [];
  if(bonusChallenge && bonusChallenge.won){
    out.push({ by:'zap', text:'Défi bonus réussi ! Ta récompense est doublée ⚡' });
  }
  if(soloSpecialtyOn('tom') && !teamDay().tom){
    teamDay().tom = true;
    let text;
    const items = availableItems().filter(k=> (ITEMS[k].world || 'lagon') === currentWorld);
    if(items.length && Math.random() < .5){
      const k = pickRandom(items);
      addItem(k, 1); markSeen(k);
      text = `J'ai trouvé un trésor : ${ITEMS[k].name} ${ITEMS[k].emoji} !`;
    } else {
      addCoins(TOM_COINS);
      text = `J'ai trouvé un trésor : ${TOM_COINS} pièces 🪙 !`;
    }
    out.push({ by:'tom', text });
  }
  if(out.length) save();
  return out;
}

/* ---- Rose : ce qui manque à la collection, et où le trouver ---- */
function roseTipFor(tab){
  if(tab === 'look'){
    const miss = Object.keys(WARDROBE).filter(k=> !WARDROBE[k].season && !ownsLookItem(k));
    if(!miss.length) return null;
    const k = pickRandom(miss), it = WARDROBE[k];
    return it.unlock ? `Le ${it.name.toLowerCase()} se gagne après ${it.unlock} missions : encore ${it.unlock - (state.missions || 0)} !`
                     : `Il te manque : ${it.name}. Il coûte ${it.price} pièces, juste ici !`;
  }
  const missing = Object.keys(ITEMS).filter(k=> !(state.seen || {})[k] && worldUnlocked(ITEMS[k].world || 'lagon'));
  if(!missing.length) return null;
  const k = pickRandom(missing), it = ITEMS[k], w = WORLDS[it.world || 'lagon'];
  const giver = Object.keys(CHARACTERS).find(cid=> (CHARACTERS[cid].loot || []).includes(k));
  return giver ? `Il te manque ${it.emoji} ${it.name} : ${CHARACTERS[giver].name} peut te l'offrir, sur l'île ${w.emoji} ${w.name} !`
               : `Il te manque ${it.emoji} ${it.name} : cherche sur l'île ${w.emoji} ${w.name} !`;
}
function roseTip(tab){
  const host = document.getElementById(tab === 'sac' ? 'sac-content' : tab === 'album' ? 'album-content' : 'look-content');
  if(!host) return;
  const old = host.querySelector('.rose-tip');
  if(old) old.remove();
  const tip = specialtyOn('rose') ? roseTipFor(tab) : null;
  if(!tip) return;
  host.insertAdjacentHTML('afterbegin', `<div class="rose-tip"><span class="sg-face" aria-hidden="true">${companionSVG('rose', 'happy')}</span>
    <span class="sg-txt"><b>Rose</b> ${tip}</span><button type="button" class="btn-speak" data-say="${('Rose : ' + tip).replace(/"/g, '&quot;')}" aria-label="Écouter">🔈</button></div>`);
  bindSpeakButtons();
}

// l'île et la carte : la bulle de Sam et l'offre de Zap
function renderTeamHelpers(){ renderSamGuide(); renderZapOffer(); }
onProfileRefresh(()=>{ teamSayClear(); renderTeamHelpers(); });

// Rose : dans le Sac, l'Album et « Mon look » (événement du Sac)
on('bag:tab', roseTip);

export { pauseAnnouncer, renderSamGuide, renderTeamHelpers, teamCheerBy, teamOnGamePicker, teamWinExtras };
