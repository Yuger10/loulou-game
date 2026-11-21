/* ---------- Le grand final de la saison 2 (Royaume Arc-en-ciel) ----------
   Juste après l'énigme du Royaume : Grisou retrouve toutes ses couleurs,
   s'excuse (il avait peur de perdre les rêves) et comprend qu'un rêve
   partagé ne se perd jamais. Il devient l'ami de tous.
   Récompenses, une seule fois par profil (`state.season2Done`) :
     - Grisou devient un compagnon que l'on peut choisir (il rejoint aussi
       l'équipe : événement « season2:done », js/features/companion-team) ;
     - le squishy unique ✨ Grisou arc-en-ciel, dans la case « Trésors »
       de la chambre à squishies (jamais dans les boîtes).
   Le journal 📖 affiche alors « Le Ciel des Rêves ✅ » et permet de revoir
   le final, sans redonner les récompenses. Une musique de fête l'accompagne. */
import { COMPANIONS, companionSVG } from '../../entities/companion/index.js';
import { save, state } from '../../entities/game-state/index.js';
import { currentProfile, refreshAll, saveProfiles } from '../../entities/player/index.js';
import { emit } from '../../shared/lib/index.js';
import { closeModal, confetti, onModalClose, openModal, playSound, speak, vibrate } from '../../shared/ui/index.js';
import { grantSquishyTreasure, squishyArtSVG } from '../squishies/index.js';
import { grisouSVG } from './grisou.js';

const FINALE_LINES = [
  "Grisou s'approche tout doucement… Ses joues deviennent roses, puis jaunes, puis bleues : il a retrouvé toutes ses couleurs !",
  "« Pardon, dit Grisou. J'avais si peur de perdre les rêves colorés du ciel que je les ai tous enfermés dans des boîtes. »",
  "« Mais j'ai compris : un rêve partagé ne se perd jamais, il grandit ! Est-ce que je peux être ton ami ? »",
];

function season2Done(){ return !!state.season2Done; }
// les récompenses, une seule fois : vrai si elles viennent d'être données
function giveSeason2Rewards(){
  if(state.season2Done) return false;
  state.season2Done = true;
  grantSquishyTreasure('grisou-arc');
  save();
  emit('season2:done');
  return true;
}

let finaleActive = false;
// fermer la fenêtre (✕ ou fin du final) : la musique de l'île revient
onModalClose(()=>{ if(finaleActive){ finaleActive = false; emit('music:theme', null); } });

function openSeasonFinale(onDone, opts){
  const replay = !!(opts && opts.replay);
  // données dès le début : fermer la fenêtre en route ne les fait pas perdre
  const rewards = !replay && giveSeason2Rewards();
  finaleActive = true;
  emit('music:theme', 'licornes-fete');
  const end = ()=>{ closeModal(); if(onDone) onDone(); };
  let i = 0;

  const scene = ()=>{
    const last = i === FINALE_LINES.length - 1;
    openModal(`
      <div class="finale" id="finale" data-step="${i}">
        <div class="finale-sky" aria-hidden="true"></div>
        <div class="finale-grisou">${grisouSVG(i === 0 ? 5 : 6)}</div>
        <h2>${i === 0 ? 'Grisou retrouve ses couleurs !' : 'Grisou, l\'ami de tous'}</h2>
        <div class="speech">${FINALE_LINES[i]}</div>
      </div>
      <button class="btn-primary" id="finale-next">${!last ? 'Suite ➡️' : rewards ? 'Mes cadeaux 🎁' : 'Le Ciel des Rêves ✅'}</button>
    `);
    speak(FINALE_LINES[i]);
    if(i === 0){ playSound('win'); confetti(); vibrate([80, 60, 80, 60, 200]); }
    document.getElementById('finale-next').onclick = ()=>{
      playSound('tap');
      i++;
      if(i < FINALE_LINES.length) scene();
      else if(rewards) companionReward();
      else seasonComplete();
    };
  };

  const companionReward = ()=>{
    const say = 'Grisou devient ton compagnon ! Tu peux le choisir : il te fera un câlin quand c\'est difficile, et te dira quand c\'est l\'heure de la pause.';
    openModal(`
      <div class="reward-box finale-gift">
        <span class="finale-buddy">${companionSVG('grisou', 'cheer')}</span>
        <h2>Grisou devient ton compagnon ! ☁️</h2>
        <div class="speech">${say}</div>
      </div>
      <button class="btn-primary" id="finale-pick">☁️ Choisir ${COMPANIONS.grisou.name}</button>
      <button class="btn-ghost" id="finale-later">Plus tard</button>
    `);
    speak(say);
    document.getElementById('finale-pick').onclick = ()=>{
      playSound('good');
      const p = currentProfile();
      if(p){ p.companion = 'grisou'; saveProfiles(); refreshAll(); }
      treasureReward();
    };
    document.getElementById('finale-later').onclick = ()=>{ playSound('tap'); treasureReward(); };
  };

  const treasureReward = ()=>{
    const say = 'Et un trésor unique : Grisou arc-en-ciel ! Il t\'attend dans la case Trésors de ta chambre à squishies.';
    openModal(`
      <div class="reward-box finale-gift">
        <span class="finale-treasure">${squishyArtSVG('grisou-arc')}</span>
        <h2>Un trésor unique ✨</h2>
        <div class="speech">${say}</div>
      </div>
      <button class="btn-primary" id="finale-treasure">Super ! ✨</button>
    `);
    speak(say);
    confetti();
    document.getElementById('finale-treasure').onclick = ()=>{ playSound('tap'); seasonComplete(); };
  };

  const seasonComplete = ()=>{
    const say = replay
      ? 'Le Ciel des Rêves est terminé : tous les rêves du ciel sont libres, grâce à toi !'
      : 'Bravo ! Tu as libéré tous les rêves du ciel. La saison 2, le Ciel des Rêves, est terminée !';
    openModal(`
      <div class="reward-box finale-done">
        <span class="big-emoji">🌈</span>
        <h2>Le Ciel des Rêves ✅</h2>
        <div class="speech">${say}</div>
      </div>
      <button class="btn-primary" id="finale-end">Continuer ✨</button>
    `);
    speak(say);
    document.getElementById('finale-end').onclick = ()=>{ playSound('tap'); end(); };
  };

  scene();
}

export { openSeasonFinale, season2Done };
