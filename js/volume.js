/* ---------- Mini-jeu : Grandeurs & volumes (niveau CP) ----------
   Au CP, on ne calcule pas de volume : on compare des contenances
   (« qui contient le plus ? ») et on reconnaît les formes en volume
   (solides du quotidien). C'est le programme officiel « grandeurs et
   mesures » / « espace et géométrie » de CP-CE1.
   - île 1-2 : comparer deux contenants, trouver celui qui contient le plus
   - île 3-4 : reconnaître le solide (cube, boule, cylindre, cône, pavé) */

const CONTAINER_PAIRS = [
  ['🥤','🪣'], ['☕','🛁'], ['🍶','🏊'], ['🥛','🛢️'],
  ['🧴','🚰'], ['🥣','🍲'], ['🧃','🛳️'], ['🥄','🍳'],
];

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
  if(dd <= 2) renderCapacityCompare();
  else renderSolidShape();
}

// île 1-2 : quel récipient contient le plus (ou le moins) ?
function renderCapacityCompare(){
  const [small, big] = pickRandom(CONTAINER_PAIRS);
  const askMore = Math.random() < 0.7;              // surtout "le plus", parfois "le moins"
  const answer = askMore ? big : small;
  const options = shuffle([small, big]);
  const question = askMore ? 'Touche celui qui contient LE PLUS' : 'Touche celui qui contient LE MOINS';

  openModal(`
    ${gameHeader('🧪 Grandeurs & volumes', question)}
    ${livesBar()}
    <div class="vol-containers">
      ${options.map(o=>`<button type="button" class="vol-container-btn" data-v="${o}">${o}</button>`).join('')}
    </div>
  `);
  bindQuit();
  document.querySelectorAll('.vol-container-btn').forEach(btn=>{
    btn.onclick = ()=>{
      if(btn.dataset.v===answer){ stepOk(btn); flashModal('ok'); setTimeout(onMissionWin, 350); }
      else loseLife(btn);
    };
  });
}

// île 3-4 : reconnaître la forme en volume (solide) d'un objet du quotidien
function renderSolidShape(){
  const dd = gameDiff();
  const solid = pickRandom(SOLIDS);
  const item = pickRandom(solid.items);
  const nOptions = dd >= 4 ? 4 : 3;
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
  document.querySelectorAll('.vol-opt-btn').forEach(btn=>{
    btn.onclick = ()=>{
      if(btn.dataset.v===solid.name){ stepOk(btn); flashModal('ok'); setTimeout(onMissionWin, 350); }
      else loseLife(btn);
    };
  });
}
