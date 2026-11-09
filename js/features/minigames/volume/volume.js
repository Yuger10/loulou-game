/* ---------- Mini-jeu : Grandeurs & volumes (GS-CE1) ----------
   Deux compétences enchaînées dans le temps, et non juste « plus dur » :
   - paliers 1-2 : comparer des contenances (« qui contient le plus ? »),
     une compétence de cycle 1 (grande section) ;
   - paliers 3-5 : reconnaître les solides du quotidien (cube, boule,
     cylindre, cône, pavé), une compétence qui se construit en CP-CE1.
   Seuils et tailles centralisés dans js/difficulty.js
   (volumeUsesCapacityCompare / ContainerCount / AskLessChance / solidOptions). */

const CONTAINER_PAIRS = [
  ['🥤','🪣'], ['☕','🛁'], ['🍶','🏊'], ['🥛','🛢️'],
  ['🧴','🚰'], ['🥣','🍲'], ['🧃','🛳️'], ['🥄','🍳'],
];
// un 3e contenant, de taille intermédiaire, pour le palier 2 (3 contenants
// à classer au lieu de 2 — davantage de comparaisons mentales à faire)
const CONTAINER_MID = ['🧋','🫖','🪙','🧊','🍯','🧱','🚲','🛶'];

const SOLIDS = [
  { name:'cube',     items:['🎲','🧊','🗃️'] },
  { name:'boule',    items:['⚽','🏀','🌍'] },
  { name:'cylindre', items:['🥫','🕯️','🧻'] },
  { name:'cône',     items:['🍦','🎉','🚧'] },
  { name:'pavé',     items:['🎁','📦','🧱'] },
];

function renderVolume(){
  setupLives('volume');
  const dd = gameDiff();
  if(volumeUsesCapacityCompare(dd)) renderCapacityCompare(dd);
  else renderSolidShape(dd);
}

// paliers 1-2 : quel récipient contient le plus (ou le moins) ?
function renderCapacityCompare(dd){
  const pairIdx = Math.floor(Math.random()*CONTAINER_PAIRS.length);
  const [small, big] = CONTAINER_PAIRS[pairIdx];
  const nContainers = volumeContainerCount(dd);
  // palier 2 : un 3e contenant de taille intermédiaire, pour forcer un
  // vrai classement (petit/moyen/grand) plutôt qu'un simple duel
  const containers = nContainers>=3 ? [small, CONTAINER_MID[pairIdx], big] : [small, big];

  const askMore = Math.random() > volumeAskLessChance(dd);
  const answer = askMore ? big : small;
  const options = shuffle(containers);
  const question = askMore ? 'Touche celui qui contient LE PLUS' : 'Touche celui qui contient LE MOINS';

  openModal(`
    ${gameHeader('🧪 Grandeurs & volumes', question)}
    ${livesBar()}
    <div class="vol-containers">
      ${options.map(o=>`<button type="button" class="vol-container-btn" data-v="${o}">${o}</button>`).join('')}
    </div>
  `);
  bindQuit();
  startTimerIfNeeded('volume');
  setSolution([solSel('.vol-container-btn','v',answer)]);
  // seulement 2-3 contenants : sans ça, une mauvaise réponse laisserait
  // deviner la bonne par élimination. Une erreur relance une NOUVELLE
  // comparaison (nouveaux contenants), jamais la même à éliminer.
  document.querySelectorAll('.vol-container-btn').forEach(btn=>{
    btn.onclick = ()=>{
      if(btn.dataset.v===answer){ clearActiveTimer(); stepOk(btn); flashModal('ok'); setTimeout(onMissionWin, 350); }
      else loseLife(btn, { onRetry: ()=> renderCapacityCompare(dd) });
    };
  });
}

// paliers 3-5 : reconnaître la forme en volume (solide) d'un objet du quotidien
function renderSolidShape(dd){
  const solid = pickRandom(SOLIDS);
  const item = pickRandom(solid.items);
  const nOptions = solidOptions(dd);
  const distractors = shuffle(SOLIDS.filter(s=>s.name!==solid.name)).slice(0, nOptions - 1);
  const options = shuffle([solid, ...distractors]);

  openModal(`
    ${gameHeader('🧪 Grandeurs & volumes', 'Quelle est la forme de cet objet ?')}
    ${livesBar()}
    <div class="vol-shape-box"><span class="vol-shape-emoji">${item}</span></div>
    <div class="vol-options">
      ${options.map(o=>`<button type="button" class="vol-opt-btn" data-v="${o.name}">${o.name}</button>`).join('')}
    </div>
  `);
  bindQuit();
  startTimerIfNeeded('volume');
  setSolution([solSel('.vol-opt-btn','v',solid.name)]);
  document.querySelectorAll('.vol-opt-btn').forEach(btn=>{
    btn.onclick = ()=>{
      if(btn.dataset.v===solid.name){ clearActiveTimer(); stepOk(btn); flashModal('ok'); setTimeout(onMissionWin, 350); }
      else loseLife(btn, { onRetry: ()=> renderSolidShape(dd) });
    };
  });
}

// inscription auprès du moteur de mini-jeux (js/features/minigame-engine)
registerGame('volume', renderVolume);
