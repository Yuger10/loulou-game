/* ---------- Moteur des mini-jeux : essais, relance anti-devinette, minuteur, victoire ---------- */

/* Essais autorisés : à partir de l'île 2, les erreurs comptent.
   On évite ainsi de cliquer au hasard jusqu'à tomber juste.
   Le barème complet (par type de jeu et par palier) est centralisé et
   documenté dans js/entities/difficulty/difficulty.js (fonction `livesFor`) — voir aussi
   ANALYSE-DIFFICULTE.md pour le détail académique. */
let lives = Infinity, maxLives = Infinity, currentGameKind = null;

function triesFor(kind){
  return livesFor(kind, gameDiff());
}

function setupLives(kind){
  currentGameKind = kind;
  maxLives = triesFor(kind);
  lives = maxLives;
}

function livesBar(){
  if(maxLives === Infinity) return '';
  return `<div class="lives" id="lives-bar" aria-label="Essais restants">
    ${Array.from({length:maxLives},(_,i)=>`<span class="life ${i<lives?'on':'off'}">${i<lives?'❤️':'🤍'}</span>`).join('')}
  </div>`;
}
function renderLives(){
  const bar = document.getElementById('lives-bar');
  if(!bar || maxLives === Infinity) return;
  [...bar.querySelectorAll('.life')].forEach((el,i)=>{
    const alive = i < lives;
    if(!alive && el.classList.contains('on')){
      el.classList.remove('on'); el.classList.add('off','breaking');
      el.textContent = '💔';
      setTimeout(()=>{ el.textContent = '🤍'; el.classList.remove('breaking'); }, 600);
    }
  });
}

// Une erreur : la proposition fautive est neutralisée et un essai est perdu.
// Petits encouragements parlés à chaque erreur : avant ce correctif,
// seul un son « faux » jouait — aucune voix pendant le jeu lui-même
// (juste au tout début, pour la consigne). Varié pour ne pas lasser.
const WRONG_HINTS = [
  'Pas tout à fait, regarde encore',
  'Essaie encore, tu vas trouver',
  'Presque ! Observe bien',
  'Non, regarde une nouvelle fois',
];
function speakWrongHint(){
  if(Math.random()<0.7) speak(pickRandom(WRONG_HINTS));
}

// La relance programmée par `onRetry` (ci-dessous) doit être annulée si
// la fenêtre se ferme ou change avant d'avoir eu lieu — sinon une
// question en retard pourrait réapparaître par-dessus un autre jeu déjà
// lancé (même principe que `clearActiveTimer` pour le minuteur).
let pendingRetryTimeout = null;
function clearPendingRetry(){
  if(pendingRetryTimeout){ clearTimeout(pendingRetryTimeout); pendingRetryTimeout = null; }
}
function scheduleRetry(fn){
  clearPendingRetry();
  pendingRetryTimeout = setTimeout(()=>{
    pendingRetryTimeout = null;
    bindQuit._last = null;
    fn();
  }, 900);
}

function loseLife(el, opts){
  opts = opts || {};
  if(typeof buddyReact==='function') buddyReact('oops', 1300);
  // multijoueur : la règle reste « une erreur = on passe la main »
  if(typeof party!=='undefined' && party.active){ wrongFeedback(el); return false; }
  if(typeof noteAnswerError==='function') noteAnswerError();   // pour l'espace parents

  playSound('wrong');
  vibrate(90);
  speakWrongHint();
  if(el){
    shakeEl(el);
    el.classList.add('ko-flash');
    if(opts.disable !== false && 'disabled' in el){ el.disabled = true; el.classList.add('ko'); }
    setTimeout(()=> el.classList.remove('ko-flash'), 450);
  }
  if(lives === Infinity){
    // Avec seulement 2-3 choix et des essais illimités, laisser le
    // bouton fautif se réactiver permettrait de deviner la bonne
    // réponse PAR ÉLIMINATION, sans aucune compréhension (observé en
    // situation réelle sur « Volumes » et « Quelle saison ? »). Quand
    // le jeu le permet (`opts.onRetry`), on propose une NOUVELLE
    // question à la place — jamais la même à éliminer petit à petit.
    if(opts.onRetry){ scheduleRetry(opts.onRetry); return false; }
    if(el && 'disabled' in el && opts.disable !== false){
      // île 1 : la mauvaise réponse se referme mais on peut continuer
      setTimeout(()=>{ el.disabled = false; el.classList.remove('ko'); }, 700);
    }
    return false;
  }
  lives--;
  renderLives();
  flashModal('ko');
  if(lives <= 0){ setTimeout(onMissionFail, 520); return true; }
  showToast(lives === 1 ? '⚠️ Dernier essai !' : `${lives} essais restants`);
  // même logique à essais limités : une nouvelle question plutôt que
  // de réduire le choix restant jusqu'à la seule bonne réponse.
  if(opts.onRetry){ scheduleRetry(opts.onRetry); return false; }
  return false;
}

/* =====================================================================
   MINUTEUR DE RÉPONSE — fluence, à partir du palier 3 (voir
   js/entities/difficulty/difficulty.js pour la table des durées et le détail académique).
   Principes :
   - jamais pour un enfant de moins de 6 ans (currentPlayerAge) ;
   - jamais pour les jeux à plusieurs étapes (mémoire, Simon, puzzle) ;
   - le temps écoulé compte comme un essai perdu (même système de
     cœurs ❤️ que les autres erreurs), jamais comme un échec immédiat ;
   - toujours annulé dès qu'une nouvelle fenêtre s'ouvre ou se ferme
     (voir les appels à `clearActiveTimer()` dans openModal/closeModal,
     js/shared/ui.js) : aucun minuteur ne continue à tourner « dans le vide ».
   ===================================================================== */
let activeTimerInterval = null;

function clearActiveTimer(){
  if(activeTimerInterval){ clearInterval(activeTimerInterval); activeTimerInterval = null; }
}

// Insère la barre de minuteur juste après la consigne, et démarre le
// décompte. `kind` = type de jeu (sert à lire la durée adaptée dans
// TIMER_SECONDS) ; appelé par chaque jeu « une question = une réponse »
// juste après son propre openModal(...).
function startTimerIfNeeded(kind){
  clearActiveTimer();
  // en multijoueur (chacun son tour / course), on garde l'expérience
  // simple : pas de minuteur qui se superpose au passage de main.
  if(typeof party!=='undefined' && party.active) return;
  if(typeof race!=='undefined' && race.active) return;
  const dd = gameDiff();
  // jamais de pression temporelle avant le CP (programme de maternelle)
  const age = typeof currentPlayerAge === 'function' ? currentPlayerAge() : null;
  if(age && age < 6) return;
  const seconds = timerFor(kind, dd);
  if(!seconds) return;

  const hint = document.querySelector('.puzzle-hint');
  if(!hint) return;
  const bar = document.createElement('div');
  bar.className = 'challenge-timer';
  bar.id = 'challenge-timer';
  bar.innerHTML = `<i id="challenge-timer-bar" style="width:100%"></i>`;
  hint.insertAdjacentElement('afterend', bar);

  let remaining = seconds;
  activeTimerInterval = setInterval(()=>{
    remaining -= 1;
    const el = document.getElementById('challenge-timer-bar');
    const wrap = document.getElementById('challenge-timer');
    if(el) el.style.width = Math.max(0, (remaining/seconds)*100) + '%';
    if(wrap) wrap.classList.toggle('urgent', remaining <= 5);
    if(remaining <= 0){
      clearActiveTimer();
      onResponseTimeout(kind);
    }
  }, 1000);
}

// Temps écoulé : traité EXACTEMENT comme une mauvaise réponse (même
// cœurs ❤️, même message d'encouragement), sans jamais désigner un
// bouton fautif puisque l'enfant n'a rien cliqué de faux. Si la mission
// n'est pas ratée, on redonne simplement un nouveau temps complet sur
// la même question — aucune pénalité au-delà de l'essai perdu.
function onResponseTimeout(kind){
  showToast('⏰ Temps écoulé ! On réessaie 👀');
  const failed = loseLife(null);
  if(!failed) startTimerIfNeeded(kind);
}

// petit flash coloré sur tout le deck
function flashModal(kind){
  const m = document.getElementById('modal');
  if(!m) return;
  m.classList.remove('flash-ok','flash-ko');
  void m.offsetWidth;
  m.classList.add(kind==='ok' ? 'flash-ok' : 'flash-ko');
  setTimeout(()=> m.classList.remove('flash-ok','flash-ko'), 500);
}

// bonne étape : pastille verte + petite étoile qui monte
function stepOk(el){
  playSound('good');
  if(typeof buddyReact==='function') buddyReact('wow', 900);
  if(!el) return;
  el.classList.add('ok-flash');
  setTimeout(()=> el.classList.remove('ok-flash'), 600);
  const spark = document.createElement('span');
  spark.className = 'step-spark';
  spark.textContent = pickRandom(['✨','⭐','💫','👍']);
  el.appendChild ? el.appendChild(spark) : null;
  setTimeout(()=> spark.remove(), 800);
}

let lastGame = null;
/* Pour les tests automatiques : chaque mini-jeu note ce qu'il faut toucher
   pour réussir — des sélecteurs CSS, dans l'ordre (test/games.test.js joue
   ainsi chaque jeu jusqu'à la victoire). Rien n'est montré à l'enfant. */
let gameSolution = null;
function setSolution(steps){ gameSolution = steps; }
function solSel(base, attr, v){ return `${base}[data-${attr}=${JSON.stringify(String(v))}]`; }
// Phrase à retenir (vraie et vérifiée) qu'un jeu peut faire afficher et dire
// sur l'écran de victoire, ex. le quiz des planètes. Utilisée une seule fois.
let missionFact = null;
// Registre des mini-jeux : chaque jeu s'inscrit avec registerGame(clé, rendu)
// (js/features/minigames/<jeu>/). Le moteur ne connaît pas la liste des jeux.
// Résolu au moment de l'appel : tous les jeux sont inscrits avant le premier.
const GAME_RENDERERS = {};
function registerGame(key, render){ GAME_RENDERERS[key] = render; }
function gameRenderer(key){ return GAME_RENDERERS[key] || GAME_RENDERERS.memory; }

// Lance un type de jeu précis, en comptant le coup pour ce joueur
// (utilisé pour proposer en priorité les jeux les moins essayés).
function playGame(key){
  // pause douce réglée par les parents : plus de nouveau défi aujourd'hui
  if(typeof pauseDue==='function' && pauseDue()){ showPauseScreen(); return; }
  if(typeof missionErrors!=='undefined') missionErrors = 0;
  trackGamePlayed(key);
  lastGame = key;
  gameSolution = null;
  gameRenderer(key)();
}

function startMinigame(){
  // ne propose que des défis adaptés à l'âge du joueur, et évite de
  // tomber deux fois de suite sur le même jeu
  const allowed = gameTypesForAge(typeof currentPlayerAge==='function' ? currentPlayerAge() : null);
  const pool = allowed.filter(t=>t!==lastGame);
  const practice = typeof pickPracticeGame==='function' ? pickPracticeGame(allowed) : null;
  const type = practice || pickRandom(pool.length ? pool : allowed);
  playGame(type);
}

// En-tête d'une fenêtre de jeu : titre, consigne et bouton pour l'écouter.
// La fermeture est assurée par la croix de la fenêtre (#modal-close).
function gameHeader(title, hint, spoken){
  const say = (spoken || hint).replace(/"/g,'&quot;');
  return `
    <div class="game-head"><h2>${title}</h2></div>
    <p class="puzzle-hint has-buddy">
      <span class="hint-txt">${hint}</span>
      ${typeof buddySlot==='function' ? buddySlot('think') : ''}
      <button class="btn-speak" data-say="${say}" aria-label="Écouter la consigne">🔈</button>
    </p>
  `;
}
// branche les boutons « écouter » et lit la consigne à voix haute
function bindQuit(){
  bindSpeakButtons();
  // lit la consigne une seule fois par mini-jeu (le mémo se re-rend à chaque clic)
  const hint = document.querySelector('.puzzle-hint [data-say]');
  if(hint && hint.dataset.say !== bindQuit._last){ bindQuit._last = hint.dataset.say; speak(hint.dataset.say); }
}
function progressDots(done, total){
  return `<div class="game-progress">${Array.from({length:total},(_,i)=>`<i class="${i<done?'on':''}"></i>`).join('')}</div>`;
}

/* Mission ratée : on encourage, on ne punit pas — mais pas de récompense. */
function onMissionFail(){
  if(typeof recordMission==='function') recordMission(false);
  missionFact = null;
  bindQuit._last = null;
  lives = 0;
  const c = CHARACTERS[currentChar] || CHARACTERS.sirene;
  const who = hello();
  playSound('wrong');
  vibrate([120, 60, 120]);
  const msg = pickRandom([
    `Ce n'est pas grave${who?' '+who:''} ! On réessaie ?`,
    `Presque ! Tu vas y arriver la prochaine fois.`,
    `Oups ! Regarde bien et réessaie 👀`,
  ]);
  speak(`${msg}`);

  openModal(`
    <div class="reward-box fail-box">
      ${typeof buddySlot==='function' ? buddySlot('oops','buddy-big fail-emoji') : '<span class="big-emoji fail-emoji">😅</span>'}
      <h2>Raté !</h2>
      <div class="speech">${msg}</div>
      <div class="speech" style="background:#FFF1EC;">
        ${charFace(currentChar)} <strong>${c.name}</strong> t'attend pour un nouvel essai !
      </div>
    </div>
    <button class="btn-primary" id="btn-retry">🔁 Réessayer</button>
    <button class="btn-ghost" id="btn-later">Plus tard</button>
  `);
  const m = document.getElementById('modal');
  if(m){ m.classList.add('shake-hard'); setTimeout(()=>m.classList.remove('shake-hard'), 500); }
  document.getElementById('btn-retry').onclick = ()=>{ playSound('tap'); startMinigame(); };
  document.getElementById('btn-later').onclick = ()=>{ playSound('tap'); closeModal(); renderLagon(); };
}

function onMissionWin(){
  if(typeof recordMission==='function') recordMission(true);   // avant le mode course, qui s'arrête plus bas
  bindQuit._last = null;
  if(typeof partyScore==='function') partyScore();
  // course : on avance d'une case ; si la ligne d'arrivée est franchie, l'écran de victoire s'affiche
  if(typeof partyAfterWin==='function' && partyAfterWin()) return;
  const c = CHARACTERS[currentChar] || CHARACTERS.sirene;
  if(typeof markHelped==='function') markHelped(currentChar);   // ❤️ sur l'île
  const prevLevel = level();
  state.missions += 1;
  const solo = !(typeof party!=='undefined' && party.active);
  if(solo && typeof noteStoryMission==='function') noteStoryMission(currentWorld);   // l'histoire avance (js/features/story/episodes.js)
  const key = pickRandom(c.loot);
  // bonus : de temps en temps un objet rare en plus
  const bonus = Math.random() < 0.2 ? pickRandom(availableItems()) : null;
  addItem(key,1); markSeen(key);
  if(bonus){ addItem(bonus,1); markSeen(bonus); }
  state.newItems += bonus ? 2 : 1;
  save();
  renderBadge();
  questProgress('win', null, 1);
  questProgress('char', currentChar, 1);
  questProgress('collect', key, 1);
  if(bonus) questProgress('collect', bonus, 1);
  const it = ITEMS[key];
  const levelUp = level() > prevLevel;

  playSound('win');
  vibrate([60,40,120]);
  confetti();
  const who = hello();
  const praise = pickRandom([
    `Bravo${who?' '+who:''}, bien joué !`,
    `Super${who?' '+who:''}, tu es trop ${ac('fort')} !`,
    `Génial, c'est réussi !`,
    `Waouh${who?' '+who:''}, quel${ac('','le')} ${ac('champion','championne')} !`,
    `Incroyable, tu as tout trouvé !`,
    `Trop ${ac('malin','maligne')} ! 💪`,
  ]).replace(/ ([!?])/g, '\u00a0$1');   // espace insécable : le « ! » ne part pas seul à la ligne
  const fact = missionFact; missionFact = null;
  // garde-robe : un objet se gagne à certains nombres de missions (js/features/wardrobe/wardrobe.js)
  const lookWon = typeof newlyUnlockedLookItems==='function' ? newlyUnlockedLookItems().map(k=>WARDROBE[k].name) : [];
  const cheer = typeof progressCheer==='function' ? progressCheer(typeof missionProgress!=='undefined' ? missionProgress : null) : null;
  setTimeout(()=> speak(`${levelUp ? `Niveau ${level()} ! ` : ''}${praise} ${cheer ? cheer + ' ' : ''}${lookWon.length ? `Tu gagnes ${lookWon.join(' et ')} pour ton avatar ! ` : ''}${fact ? fact + ' ' : ''}${c.name} t'offre ${it.name}${bonus ? `, et une surprise : ${ITEMS[bonus].name}` : ''}.`), 300);

  openModal(`
    <div class="reward-box win-box">
      <span class="win-rays" aria-hidden="true"></span>
      ${typeof buddySlot==='function' ? buddySlot('cheer','buddy-big win-emoji') : `<span class="big-emoji win-emoji">${levelUp ? '🌟' : '🎉'}</span>`}
      <span class="win-stamp">${levelUp ? '🌟' : '✅'}</span>
      <h2>${levelUp ? `Niveau ${level()} !` : praise}</h2>
      ${lookWon.length ? `<div class="speech look-won"><span aria-hidden="true">🎁</span> Nouveau pour ton avatar : <strong>${lookWon.join(', ')}</strong> (sac → Mon look)</div>` : ''}
      ${cheer ? `<div class="speech progress-cheer"><span aria-hidden="true">📈</span> ${cheer}</div>` : ''}
      ${fact ? `<div class="speech fun-fact"><span aria-hidden="true">💡</span> ${fact}</div>` : ''}
      <div class="speech reward-item" style="display:flex; align-items:center; justify-content:center; gap:10px;">
        <span class="reward-emoji" data-gain-item style="font-size:2rem;">${it.emoji}</span>
        <span>${c.name} t'offre : <strong>${it.name}</strong></span>
      </div>
      ${solo && typeof storyProgressHTML==='function' ? storyProgressHTML(currentWorld) : ''}
      ${bonus ? `<div class="speech" style="display:flex; align-items:center; justify-content:center; gap:10px; background:#FFF9E8;">
        <span data-gain-item style="font-size:2rem;">${ITEMS[bonus].emoji}</span>
        <span>Surprise ! <strong>${ITEMS[bonus].name}</strong> en plus ✨</span>
      </div>` : ''}
    </div>
    <button class="btn-primary" id="btn-yay">${(typeof party!=='undefined' && party.active) ? 'Au joueur suivant 👉' : 'Super !'}</button>
    ${(typeof party!=='undefined' && party.active) ? '' : '<button class="btn-ghost" id="btn-again">Encore une mission 🎮</button>'}
  `);
  // l'objet gagné s'envolera jusqu'au sac quand la fenêtre se fermera
  if(typeof queueGain==='function') queueGain({ items:[it.emoji, bonus ? ITEMS[bonus].emoji : null] });
  document.getElementById('btn-yay').onclick = ()=> {
    playSound('tap'); closeModal(); renderLagon();
    // multijoueur : la main passe au joueur suivant après une réussite
    if(typeof party!=='undefined' && party.active){ passTurn('next'); return; }
    // nouvelle île débloquée ? sinon, peut-être un épisode de l'histoire
    setTimeout(()=>{ if(!checkNewIsland() && typeof maybeStoryEpisode==='function') maybeStoryEpisode(); }, 250);
  };
  const againBtn = document.getElementById('btn-again');
  if(againBtn) againBtn.onclick = ()=> { playSound('tap'); renderLagon(); startMinigame(); };
}

// tout nouveau contenu (ou la fermeture) invalide un éventuel minuteur de
// défi en cours — jamais de décompte qui tourne « dans le vide » — et une
// relance de question programmée après une erreur (anti-devinette) : sans
// ça, l'ancienne question pourrait réapparaître par-dessus un autre jeu.
onModalChange(()=>{ clearActiveTimer(); clearPendingRetry(); });
onModalClose(()=>{ bindQuit._last = null; });
