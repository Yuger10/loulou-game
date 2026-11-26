/* ---------- Moteur des mini-jeux : essais, relance anti-devinette, minuteur, victoire ---------- */
import { CHARACTERS, charFace } from '../../entities/character/index.js';
import { buddyReact, buddySlot, COMPANIONS, companionSVG } from '../../entities/companion/index.js';
import { gameTypesForAge, livesFor, timerFor } from '../../entities/difficulty/index.js';
import { hello, level, save, state, trackGamePlayed } from '../../entities/game-state/index.js';
import { addItem, ITEMS } from '../../entities/item/index.js';
import { ac, currentPlayerAge, party, race } from '../../entities/player/index.js';
import { availableItems, currentWorld } from '../../entities/world/index.js';
import { emit, on, pickRandom, random } from '../../shared/lib/index.js';
import {
  closeModal,
  confetti,
  onModalChange,
  bindSpeakButtons,
  onModalClose,
  openModal,
  playSound,
  setHandler,
  shakeEl,
  showToast,
  speak,
  vibrate,
  wrongFeedback,
} from '../../shared/ui/index.js';
import {
  beginBonusChallenge,
  bonusChallenge,
  bonusOnNewGame,
  endBonusChallenge,
  gameDiff,
  inBonusChallenge,
  lastGame,
  missionProgress,
  noteAnswerError,
  pickPracticeGame,
  progressCheer,
  recordMission,
  resetMissionErrors,
  setLastGame,
} from '../adaptive/index.js';
import { markSeen, renderBadge } from '../bag/index.js';
import { maybeTeamOpening, teamCheerBy, teamWinExtras } from '../companion-team/index.js';
import { queueGain } from '../gains/index.js';
import { hintNudge, hintPolicy, setHintCountable } from '../hints/index.js';
import { checkNewIsland, currentChar, markHelped, renderLagon } from '../island/index.js';
import { partyAfterWin, partyScore, passTurn } from '../party/index.js';
import { questProgress } from '../quests/index.js';
import { forgetSpokenHint, resetChoicesRead, speakWrongHint } from '../screen/index.js';
import { maybeStoryEpisode, noteStoryMission, storyProgressHTML } from '../story/index.js';
import { newlyUnlockedLookItems, WARDROBE } from '../wardrobe/index.js';

/* Essais autorisés : à partir de l'île 2, les erreurs comptent.
   On évite ainsi de cliquer au hasard jusqu'à tomber juste.
   Le barème complet (par type de jeu et par palier) est centralisé et
   documenté dans js/entities/difficulty/difficulty.js (fonction `livesFor`) — voir aussi
   ANALYSE-DIFFICULTE.md pour le détail académique. */

let lives = Infinity,
  maxLives = Infinity;

/** @param {string} kind le type de mini-jeu */
function triesFor(kind) {
  return livesFor(kind, gameDiff());
}

/** @param {string} kind le type de mini-jeu */
function setupLives(kind) {
  maxLives = triesFor(kind);
  lives = maxLives;
}

function livesBar() {
  if (maxLives === Infinity) return '';
  return `<div class="lives" id="lives-bar" aria-label="Essais restants">
    ${Array.from({ length: maxLives }, (_, i) => `<span class="life ${i < lives ? 'on' : 'off'}">${i < lives ? '❤️' : '🤍'}</span>`).join('')}
  </div>`;
}
function renderLives() {
  const bar = document.getElementById('lives-bar');
  if (!bar || maxLives === Infinity) return;
  [...bar.querySelectorAll('.life')].forEach((el, i) => {
    const alive = i < lives;
    if (!alive && el.classList.contains('on')) {
      el.classList.remove('on');
      el.classList.add('off', 'breaking');
      el.textContent = '💔';
      setTimeout(() => {
        el.textContent = '🤍';
        el.classList.remove('breaking');
      }, 600);
    }
  });
}

// La relance programmée par `onRetry` (ci-dessous) doit être annulée si
// la fenêtre se ferme ou change avant d'avoir eu lieu — sinon une
// question en retard pourrait réapparaître par-dessus un autre jeu déjà
// lancé (même principe que `clearActiveTimer` pour le minuteur).
/** @type {ReturnType<typeof setTimeout> | null} */
let pendingRetryTimeout = null;
function clearPendingRetry() {
  if (pendingRetryTimeout) {
    clearTimeout(pendingRetryTimeout);
    pendingRetryTimeout = null;
  }
}
/** @param {() => void} fn */
function scheduleRetry(fn) {
  clearPendingRetry();
  pendingRetryTimeout = setTimeout(() => {
    pendingRetryTimeout = null;
    forgetSpokenHint();
    fn();
  }, 900);
}

/**
 * @typedef {object} LoseLifeOptions
 * @property {boolean} [disable] false : le bouton fautif reste cliquable
 * @property {() => void} [onRetry] une nouvelle question plutôt que la même (anti-devinette)
 */
/**
 * Une erreur : le bouton fautif (ou rien, temps écoulé) et les options du jeu.
 * @param {EventTarget | null} target le bouton fautif (souvent `e.currentTarget` d'un handler)
 * @param {LoseLifeOptions} [opts]
 * @returns {boolean} true si la mission est ratée (plus d'essais)
 */
function loseLife(target, opts = {}) {
  const el = /** @type {HTMLElement | null} */ (target);
  buddyReact('oops', 1300);
  hintNudge(true); // le bouton 💡 se propose (js/features/hints/hints.js)
  // multijoueur : la règle reste « une erreur = on passe la main »
  if (party.active) {
    wrongFeedback(el); // el vaut null pour une erreur sans bouton (temps écoulé, mémoire)
    return false;
  }
  noteAnswerError(); // pour l'espace parents

  playSound('wrong');
  vibrate(90);
  speakWrongHint();
  if (el) loseLifeShake(el, opts);
  if (lives === Infinity) return loseLifeUnlimited(el, opts);
  lives--;
  renderLives();
  flashModal('ko');
  if (lives <= 0) {
    setTimeout(onMissionFail, 520);
    return true;
  }
  // « dernière chance » ne se dit pas : la voix rassure (pas de pression)
  if (lives === 1) showToast('⚠️ Dernier essai !', "Plus qu'un essai. Prends ton temps.");
  else showToast(`${lives} essais restants`);
  // même logique à essais limités : une nouvelle question plutôt que
  // de réduire le choix restant jusqu'à la seule bonne réponse.
  if (opts.onRetry) {
    scheduleRetry(opts.onRetry);
    return false;
  }
  return false;
}

/**
 * Le bouton fautif tremble et se referme (sauf `disable: false`).
 * @param {HTMLElement} el
 * @param {LoseLifeOptions} opts
 */
function loseLifeShake(el, opts) {
  shakeEl(el);
  el.classList.add('ko-flash');
  if (opts.disable !== false && 'disabled' in el) {
    el.disabled = true;
    el.classList.add('ko');
  }
  setTimeout(() => el.classList.remove('ko-flash'), 450);
}
/**
 * Une erreur à essais illimités : jamais ratée.
 * @param {HTMLElement | null} el
 * @param {LoseLifeOptions} opts
 * @returns {false}
 */
function loseLifeUnlimited(el, opts) {
  // Avec seulement 2-3 choix et des essais illimités, laisser le
  // bouton fautif se réactiver permettrait de deviner la bonne
  // réponse PAR ÉLIMINATION, sans aucune compréhension (observé en
  // situation réelle sur « Volumes » et « Quelle saison ? »). Quand
  // le jeu le permet (`opts.onRetry`), on propose une NOUVELLE
  // question à la place, jamais la même à éliminer petit à petit.
  if (opts.onRetry) {
    scheduleRetry(opts.onRetry);
    return false;
  }
  if (el && 'disabled' in el && opts.disable !== false) {
    // île 1 : la mauvaise réponse se referme mais on peut continuer
    setTimeout(() => {
      el.disabled = false;
      el.classList.remove('ko');
    }, 700);
  }
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
/** @type {ReturnType<typeof setInterval> | null} */
let activeTimerInterval = null;

function clearActiveTimer() {
  if (activeTimerInterval) {
    clearInterval(activeTimerInterval);
    activeTimerInterval = null;
  }
}

// Insère la barre de minuteur juste après la consigne, et démarre le
// décompte. `kind` = type de jeu (sert à lire la durée adaptée dans
// TIMER_SECONDS) ; appelé par chaque jeu « une question = une réponse »
// juste après son propre openModal(...).
/** @param {string} kind le type de mini-jeu */
function startTimerIfNeeded(kind) {
  clearActiveTimer();
  // en multijoueur (chacun son tour / course), on garde l'expérience
  // simple : pas de minuteur qui se superpose au passage de main.
  if (party.active) return;
  if (race.active) return;
  const dd = gameDiff();
  // jamais de pression temporelle avant le CP (programme de maternelle)
  const age = currentPlayerAge();
  if (age && age < 6) return;
  const seconds = timerFor(kind, dd);
  if (!seconds) return;

  const hint = document.querySelector('.puzzle-hint');
  if (!hint) return;
  const bar = document.createElement('div');
  bar.className = 'challenge-timer';
  bar.id = 'challenge-timer';
  bar.innerHTML = `<i id="challenge-timer-bar" style="width:100%"></i>`;
  hint.insertAdjacentElement('afterend', bar);

  let remaining = seconds;
  activeTimerInterval = setInterval(() => {
    remaining -= 1;
    const el = document.getElementById('challenge-timer-bar');
    const wrap = document.getElementById('challenge-timer');
    if (el) el.style.width = Math.max(0, (remaining / seconds) * 100) + '%';
    if (wrap) wrap.classList.toggle('urgent', remaining <= 5);
    if (remaining <= 0) {
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
/** @param {string} kind le type de mini-jeu */
function onResponseTimeout(kind) {
  showToast('⏰ Temps écoulé ! On réessaie 👀');
  const failed = loseLife(null);
  if (!failed) startTimerIfNeeded(kind);
}

// petit flash coloré sur tout le deck
/** @param {'ok' | 'ko'} kind */
function flashModal(kind) {
  const m = document.getElementById('modal');
  if (!m) return;
  m.classList.remove('flash-ok', 'flash-ko');
  void m.offsetWidth;
  m.classList.add(kind === 'ok' ? 'flash-ok' : 'flash-ko');
  setTimeout(() => m.classList.remove('flash-ok', 'flash-ko'), 500);
}

// bonne étape : pastille verte + petite étoile qui monte
/** @param {EventTarget | null} [target] l'élément réussi (souvent `e.currentTarget` d'un handler) */
function stepOk(target) {
  const el = /** @type {HTMLElement | null | undefined} */ (target);
  playSound('good');
  if (hintPolicy.onGood) hintPolicy.onGood();
  buddyReact('wow', 900);
  if (!el) return;
  el.classList.add('ok-flash');
  setTimeout(() => el.classList.remove('ok-flash'), 600);
  const spark = document.createElement('span');
  spark.className = 'step-spark';
  spark.textContent = pickRandom(['✨', '⭐', '💫', '👍']);
  if (el.appendChild) el.appendChild(spark);
  setTimeout(() => spark.remove(), 800);
}

/* Pour les tests automatiques : chaque mini-jeu note ce qu'il faut toucher
   pour réussir — des sélecteurs CSS, dans l'ordre (test/games.test.js joue
   ainsi chaque jeu jusqu'à la victoire). Rien n'est montré à l'enfant. */
/** @type {string[] | null} */
// oxlint-disable-next-line no-unused-vars -- lu par les tests, par son nom (ev('gameSolution'))
let gameSolution = null;
/** @param {string[]} steps les sélecteurs à toucher, dans l'ordre */
function setSolution(steps) {
  gameSolution = steps;
}
/**
 * @param {string} base sélecteur de l'élément
 * @param {string} attr nom de l'attribut, sans `data-`
 * @param {string | number} v valeur attendue
 */
function solSel(base, attr, v) {
  return `${base}[data-${attr}=${JSON.stringify(String(v))}]`;
}
// Phrase à retenir (vraie et vérifiée) qu'un jeu peut faire afficher et dire
// sur l'écran de victoire, ex. le quiz des planètes. Utilisée une seule fois.
/** @type {string | null} */
let missionFact = null;
/** @param {string} f */
function setMissionFact(f) {
  missionFact = f;
}
// Registre des mini-jeux : chaque jeu s'inscrit avec registerGame(clé, rendu)
// (js/features/minigames/<jeu>/). Le moteur ne connaît pas la liste des jeux.
// Résolu au moment de l'appel : tous les jeux sont inscrits avant le premier.
/** @typedef {() => void} GameRenderer affiche le mini-jeu (sa première question) */
/** @type {Record<string, GameRenderer>} */
const GAME_RENDERERS = {};
/**
 * @param {string} key le type de mini-jeu
 * @param {GameRenderer} render
 */
function registerGame(key, render) {
  GAME_RENDERERS[key] = render;
}
// les indices (js/features/hints) ne comptent que ceux des mini-jeux inscrits
setHintCountable((key) => !!GAME_RENDERERS[key]);
/** @param {string} key */
function gameRenderer(key) {
  return GAME_RENDERERS[key] || GAME_RENDERERS.memory;
}

// lancer un jeu à la demande d'une feature : l'île (« Surprise »), Zap (défi)
on('game:start', () => startMinigame());
on('game:bonus', (/** @type {string} */ key) => startBonusChallenge(key));
/** @param {string} key */
function startBonusChallenge(key) {
  beginBonusChallenge(key);
  playGame(key);
}

// Lance un type de jeu précis, en comptant le coup pour ce joueur
// (utilisé pour proposer en priorité les jeux les moins essayés).
/** @param {string} key le type de mini-jeu */
function playGame(key) {
  // pause douce réglée par les parents : plus de nouveau défi aujourd'hui
  // (l'espace parents répond true et montre l'écran de pause)
  if (emit('game:before', key).some(Boolean)) return;
  resetChoicesRead(); // nouvelle mission : les choix écrits seront lus après la consigne
  bonusOnNewGame();
  if (hintPolicy.onMission) hintPolicy.onMission(key);
  resetMissionErrors();
  trackGamePlayed(key);
  setLastGame(key);
  gameSolution = null;
  gameRenderer(key)();
}

function startMinigame() {
  // ne propose que des défis adaptés à l'âge du joueur, et évite de
  // tomber deux fois de suite sur le même jeu
  const allowed = gameTypesForAge(currentPlayerAge());
  const pool = allowed.filter((t) => t !== lastGame);
  const practice = pickPracticeGame(allowed);
  const type = practice || pickRandom(pool.length ? pool : allowed);
  playGame(type);
}

/**
 * @param {number} done étapes réussies
 * @param {number} total
 */
function progressDots(done, total) {
  return `<div class="game-progress">${Array.from({ length: total }, (_, i) => `<i class="${i < done ? 'on' : ''}"></i>`).join('')}</div>`;
}

/* Mission ratée : on encourage, on ne punit pas — mais pas de récompense. */
function onMissionFail() {
  recordMission(false);
  emit('game:after', { win: false }); // fin naturelle : la pause peut venir ensuite (js/features/rest)
  endBonusChallenge();
  missionFact = null;
  forgetSpokenHint();
  resetChoicesRead();
  lives = 0;
  const c = (currentChar && CHARACTERS[currentChar]) || CHARACTERS.sirene;
  const who = hello();
  playSound('wrong');
  vibrate([120, 60, 120]);
  const msg = pickRandom([
    `Ce n'est pas grave${who ? ' ' + who : ''} ! On réessaie ?`,
    `Presque ! Tu vas y arriver la prochaine fois.`,
    `Oups ! Regarde bien et réessaie 👀`,
  ]);
  speak(`${msg}`);

  openModal(`
    <div class="reward-box fail-box">
      ${buddySlot('oops', 'buddy-big fail-emoji')}
      <h2>Raté !</h2>
      <div class="speech with-voice"><span class="txt">${msg}</span>${replayButton(msg)}</div>
      <div class="speech" style="background:#FFF1EC;">
        ${charFace(currentChar || '')} <strong>${c.name}</strong> t'attend pour un nouvel essai !
      </div>
    </div>
    <button class="btn-primary" id="btn-retry">🔁 Réessayer</button>
    <button class="btn-ghost" id="btn-later">Plus tard</button>
  `);
  bindSpeakButtons();
  const m = document.getElementById('modal');
  if (m) {
    m.classList.add('shake-hard');
    setTimeout(() => m.classList.remove('shake-hard'), 500);
  }
  setHandler(document.getElementById('btn-retry'), 'click', () => {
    playSound('tap');
    startMinigame();
  });
  setHandler(document.getElementById('btn-later'), 'click', () => {
    playSound('tap');
    closeModal();
    renderLagon();
  });
}

/* Fin de mission : le délai entre la bonne réponse (étincelle, son) et
   l'écran de victoire. Un seul endroit (anti-pattern 4 de l'audit) : chaque
   mini-jeu appelle winSoon(), ou winSoon(WIN_DELAY_LONG) s'il finit sur une
   animation. test/gardes.test.js refuse un setTimeout(onMissionWin, …) ailleurs. */
const WIN_DELAY = 400;
const WIN_DELAY_LONG = 700;
function winSoon(delay = WIN_DELAY) {
  setTimeout(onMissionWin, delay);
}

function onMissionWin() {
  recordMission(true); // avant le mode course, qui s'arrête plus bas
  emit('game:after', { win: true }); // fin naturelle : la pause peut venir ensuite (js/features/rest)
  forgetSpokenHint();
  resetChoicesRead();
  partyScore();
  // course : on avance d'une case ; si la ligne d'arrivée est franchie, l'écran de victoire s'affiche
  if (partyAfterWin()) return;
  const c = (currentChar && CHARACTERS[currentChar]) || CHARACTERS.sirene;
  markHelped(currentChar); // ❤️ sur l'île
  const prevLevel = level();
  state.missions += 1;
  const solo = !party.active;
  if (solo) noteStoryMission(currentWorld); // l'histoire avance (js/features/story/episodes.js)
  const { key, bonus, boost } = winGiveLoot(c);
  const levelUp = level() > prevLevel;

  playSound('win');
  vibrate([60, 40, 120]);
  confetti();
  const praise = winPraise();
  const fact = missionFact;
  missionFact = null;
  // garde-robe : un objet se gagne à certains nombres de missions (js/features/wardrobe/wardrobe.js)
  const lookWon = newlyUnlockedLookItems().map((k) => WARDROBE[k].name);
  const cheer = progressCheer(missionProgress);
  // l'équipe des compagnons (js/features/companion-team) : Léo dit la phrase de
  // progrès ; Zap fête le défi bonus ; Tom rapporte le trésor du jour
  const cheerBy = cheer ? teamCheerBy() : null;
  const extras = teamWinExtras();
  endBonusChallenge();
  /** @type {MissionWin} */
  const w = { c, it: ITEMS[key], bonus, boost, levelUp, praise, fact, lookWon, cheer, cheerBy, extras, solo };
  setTimeout(() => speak(winSpeech(w)), 300);

  openModal(winMarkup(w));
  // l'objet gagné s'envolera jusqu'au sac quand la fenêtre se fermera
  queueGain({ items: [w.it.emoji, bonus ? ITEMS[bonus].emoji : null] });
  winBindButtons();
}

/**
 * Ce que l'écran de victoire montre et dit.
 * @typedef {{ c: typeof CHARACTERS[string], it: typeof ITEMS[string], bonus: string | null, boost: number,
 *   levelUp: boolean, praise: string, fact: string | null, lookWon: string[], cheer: string | null,
 *   cheerBy: string | null, extras: ReturnType<typeof teamWinExtras>, solo: boolean }} MissionWin
 */

/**
 * Le cadeau du personnage aidé, parfois un objet rare en plus, doublé au défi bonus.
 * @param {typeof CHARACTERS[string]} c
 */
function winGiveLoot(c) {
  const key = pickRandom(c.loot);
  // bonus : de temps en temps un objet rare en plus
  const bonus = random() < 0.2 ? pickRandom(availableItems()) : null;
  // défi bonus de Zap réussi : la récompense est doublée
  const boost = inBonusChallenge() ? 2 : 1;
  if (boost > 1 && bonusChallenge) bonusChallenge.won = true;
  addItem(key, boost);
  markSeen(key);
  if (bonus) {
    addItem(bonus, 1);
    markSeen(bonus);
  }
  state.newItems += bonus ? 2 : 1;
  save();
  renderBadge();
  questProgress('win', null, 1);
  questProgress('char', currentChar, 1);
  questProgress('collect', key, 1);
  if (bonus) questProgress('collect', bonus, 1);
  return { key, bonus, boost };
}

function winPraise() {
  const who = hello();
  return pickRandom([
    `Bravo${who ? ' ' + who : ''}, bien joué !`,
    `Super${who ? ' ' + who : ''}, tu es trop ${ac('fort')} !`,
    `Génial, c'est réussi !`,
    `Waouh${who ? ' ' + who : ''}, quel${ac('', 'le')} ${ac('champion', 'championne')} !`,
    `Incroyable, tu as tout trouvé !`,
    `Trop ${ac('malin', 'maligne')} ! 💪`,
  ]).replace(/ ([!?])/g, ' $1'); // espace insécable : le « ! » ne part pas seul à la ligne
}

// le bouton 🔈 qui relit la phrase dite à l'ouverture d'une fenêtre de fin de mission
/** @param {string} say */
const replayButton = (say) =>
  `<button type="button" class="btn-speak" data-say="${say.replace(/<[^>]+>/g, '').replace(/"/g, '&quot;')}" aria-label="Écouter">🔈</button>`;

/** @param {MissionWin} w */
function winSpeech(w) {
  const { levelUp, praise, cheer, cheerBy, extras, lookWon, fact, c, it, bonus } = w;
  return `${levelUp ? `Niveau ${level()} ! ` : ''}${praise} ${cheer ? (cheerBy ? COMPANIONS[cheerBy].name + ' : ' : '') + cheer + ' ' : ''}${extras.map((x) => `${COMPANIONS[x.by].name} : ${x.text} `).join('')}${lookWon.length ? `Tu gagnes ${lookWon.join(' et ')} pour ton avatar ! ` : ''}${fact ? fact + ' ' : ''}${c.name} t'offre ${it.name}${bonus ? `, et une surprise : ${ITEMS[bonus].name}` : ''}.`;
}

/** @param {MissionWin} w */
function winMarkup(w) {
  const { levelUp, praise, cheer, cheerBy, extras, lookWon, fact, c, it, bonus, boost, solo } = w;
  return `
    <div class="reward-box win-box">
      <span class="win-rays" aria-hidden="true"></span>
      ${buddySlot('cheer', 'buddy-big win-emoji')}
      <span class="win-stamp">${levelUp ? '🌟' : '✅'}</span>
      <h2>${levelUp ? `Niveau ${level()} !` : praise}</h2>
      ${replayButton(winSpeech(w))}
      ${lookWon.length ? `<div class="speech look-won"><span aria-hidden="true">🎁</span> Nouveau pour ton avatar : <strong>${lookWon.join(', ')}</strong> (sac → Mon look)</div>` : ''}
      ${cheer ? `<div class="speech progress-cheer">${cheerBy ? `<span class="cheer-face" aria-hidden="true">${companionSVG(cheerBy, 'cheer')}</span><b>${COMPANIONS[cheerBy].name}</b>` : '<span aria-hidden="true">📈</span>'} ${cheer}</div>` : ''}
      ${extras.map((x) => `<div class="speech team-extra" data-by="${x.by}"><span class="cheer-face" aria-hidden="true">${companionSVG(x.by, 'cheer')}</span><span><b>${COMPANIONS[x.by].name}</b> ${x.text}</span></div>`).join('')}
      ${fact ? `<div class="speech fun-fact"><span aria-hidden="true">💡</span> ${fact}</div>` : ''}
      <div class="speech reward-item" style="display:flex; align-items:center; justify-content:center; gap:10px;">
        <span class="reward-emoji" data-gain-item style="font-size:2rem;">${it.emoji}</span>
        <span>${c.name} t'offre : <strong>${it.name}</strong>${boost > 1 ? ` <b class="boost">× ${boost}</b>` : ''}</span>
      </div>
      ${solo ? storyProgressHTML(currentWorld) : ''}
      ${
        bonus
          ? `<div class="speech" style="display:flex; align-items:center; justify-content:center; gap:10px; background:#FFF9E8;">
        <span data-gain-item style="font-size:2rem;">${ITEMS[bonus].emoji}</span>
        <span>Surprise ! <strong>${ITEMS[bonus].name}</strong> en plus ✨</span>
      </div>`
          : ''
      }
    </div>
    <button class="btn-primary" id="btn-yay">${party.active ? 'Au joueur suivant 👉' : 'Super !'}</button>
    ${party.active ? '' : '<button class="btn-ghost" id="btn-again">Encore une mission 🎮</button>'}
  `;
}

function winBindButtons() {
  bindSpeakButtons();
  setHandler(document.getElementById('btn-yay'), 'click', () => {
    playSound('tap');
    closeModal();
    renderLagon();
    // multijoueur : la main passe au joueur suivant après une réussite
    if (party.active) {
      passTurn('next');
      return;
    }
    // nouvelle île débloquée ? sinon l'équipe qui s'ouvre (niveau 10), sinon
    // peut-être un épisode de l'histoire
    setTimeout(() => {
      if (!checkNewIsland() && !maybeTeamOpening()) maybeStoryEpisode();
    }, 250);
  });
  const againBtn = document.getElementById('btn-again');
  if (againBtn)
    setHandler(againBtn, 'click', () => {
      playSound('tap');
      renderLagon();
      startMinigame();
    });
}

// tout nouveau contenu (ou la fermeture) invalide un éventuel minuteur de
// défi en cours — jamais de décompte qui tourne « dans le vide » — et une
// relance de question programmée après une erreur (anti-devinette) : sans
// ça, l'ancienne question pourrait réapparaître par-dessus un autre jeu.
onModalChange(() => {
  clearActiveTimer();
  clearPendingRetry();
});
onModalClose(() => {
  forgetSpokenHint();
  resetChoicesRead();
});

export {
  clearActiveTimer,
  flashModal,
  livesBar,
  loseLife,
  onMissionWin,
  playGame,
  progressDots,
  registerGame,
  setMissionFact,
  setSolution,
  setupLives,
  solSel,
  startMinigame,
  startTimerIfNeeded,
  stepOk,
  WIN_DELAY_LONG,
  winSoon,
};
