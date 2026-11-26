/* ---------- Les souvenirs : la révision espacée des questions ratées ----------
   Une question ratée dans un jeu simple (opérations, calcul, comparer, heure,
   lecture) est gardée dans state.review (js/entities/review : la file, ses
   règles et sa validation), puis reposée 1, 3 et 7 jours plus tard dans une
   petite mission de 3 questions au plus, que le compagnon propose en début de
   séance. Toujours refusable, une fois par jour au plus, jamais à plusieurs.

   Rien ne se gagne ici (ni pièces, ni objets, ni mission, ni progrès, ni
   quête) : une récompense annoncée diminue l'envie de jouer pour jouer. Le
   compagnon dit seulement ce que l'enfant a fait. Les mots « erreur », « raté »
   et « faux » ne s'écrivent jamais dans ces textes.

   Contrat d'un jeu : registerReplay(clé, { item, render }) —
     item(q)    la question posée (celle donnée à setHintQuestion) sous forme
                rejouable, ou null si elle ne se garde pas ;
     render(p)  le jeu affiche cette question-là (les choix sont tirés à nouveau).
   Un jeu sans contrat n'est pas gardé. */
import { buddySlot, COMPANIONS, currentCompanion } from '../../entities/companion/index.js';
import { addMiss, dayKey, pickDue, reviewAnswer, validParams } from '../../entities/review/index.js';
import { save, state } from '../../entities/game-state/index.js';
import { ac, party, race } from '../../entities/player/index.js';
import { emit, on } from '../../shared/lib/index.js';
import {
  bindSpeakButtons,
  closeModal,
  onModalClose,
  openModal,
  playSound,
  setHandler,
  speak,
} from '../../shared/ui/index.js';
import { gameDiff, inBonusChallenge, setLastGame } from '../adaptive/index.js';
import { setRoundHandlers } from '../minigame-engine/index.js';

/** @typedef {import('../../entities/review/index.js').ReviewParams} ReviewParams */
/** @typedef {import('../../entities/review/index.js').ReviewItem} ReviewItem */
/**
 * @template {ReviewParams} P
 * @typedef {{ item: (q: unknown) => P | null, render: (p: P) => void }} Replay
 */

const REVIEW_SESSION = 3; // questions par mission, au plus
const REVIEW_STOP_AFTER = 2; // erreurs : la mission s'arrête là, sans insister

/** @type {Record<string, Replay<ReviewParams>>} */
const REVIEW_REPLAYS = {};
/**
 * @template {ReviewParams} P
 * @param {string} key le type de mini-jeu
 * @param {Replay<P>} r
 */
function registerReplay(key, r) {
  // rangé sans la forme de ses paramètres : `render` ne reçoit que des items de ce
  // jeu (p.g === clé, vérifié avant chaque appel)
  REVIEW_REPLAYS[key] = /** @type {Replay<ReviewParams>} */ (/** @type {unknown} */ (r));
}

// aujourd'hui, en date locale (même calcul que la pause et les progrès)
function reviewToday() {
  return dayKey(new Date());
}

/* ---- garder une question ratée ----
   Le moteur (plus bas dans les couches) annonce chaque réponse fausse touchée
   en solo, hors mission « souvenirs ». Rien n'est gardé à plusieurs (une
   erreur y passe la main), ni pendant le défi bonus de Zap (joué un cran
   au-dessus du niveau). Une question ratée pendant qu'une mission est ouverte
   entre dans la file pour demain, jamais dans la mission en cours. */
on('answer:wrong', (/** @type {{ kind: string, q: unknown }} */ { kind, q }) => {
  if (party.active || race.active || inBonusChallenge()) return;
  const r = REVIEW_REPLAYS[kind];
  if (!r) return;
  const p = r.item(q);
  if (!p || p.g !== kind || !validParams(p)) return;
  state.review = addMiss(state.review, p, gameDiff(), reviewToday());
  save();
});

/* ---- la mission « souvenirs » ---- */
/** La mission en cours : ses questions, où l'on en est, les réponses données.
 * @type {{ items: ReviewItem[], i: number, right: number, wrong: number } | null} */
let reviewMission = null;

// La mission s'arrête : le moteur revient au jeu normal, et la réponse qui
// attendait (WIN_DELAY, REVIEW_SHOW_MS) est annulée avec lui.
function reviewStop() {
  reviewMission = null;
  setRoundHandlers(null);
}
// croix, Échap, pause, « Plus tard » : la question affichée n'est pas comptée
onModalClose(() => {
  if (reviewMission) reviewStop();
});

/**
 * Le compagnon propose la mission, si c'est le moment : en solo, une fois par
 * jour, avec au moins un souvenir dû, sans autre fenêtre, et hors pause.
 * @returns {boolean} true si la proposition s'affiche
 */
function maybeOfferReview() {
  if (party.active || race.active || !state.name) return false;
  // la fenêtre (#overlay) fait partie de la page (index.html)
  if (/** @type {HTMLElement} */ (document.getElementById('overlay')).classList.contains('show')) return false;
  const today = reviewToday();
  if (state.review.offered === today) return false;
  const n = pickDue(state.review, today, REVIEW_SESSION).length;
  if (!n) return false;
  // la pause gagne toujours : elle est consultée une fois, ici (pas à chaque
  // question) ; si elle est due, elle montre son voile et rien n'est proposé
  if (emit('game:before', 'souvenirs').some(Boolean)) return false;
  state.review = { items: state.review.items, offered: today };
  save();
  const comp = COMPANIONS[currentCompanion()];
  const line = `J'ai ${['un souvenir', 'deux souvenirs', 'trois souvenirs'][n - 1]} pour toi. On joue ensemble ?`;
  openModal(`
    <div class="team-meet review-offer" id="review-offer">
      ${buddySlot('happy', 'buddy-big')}
      <h2>🌟 Les souvenirs</h2>
      <div class="speech with-voice">
        <span class="txt"><strong>${comp ? comp.name : 'Ton compagnon'}</strong> : ${line}</span>
        <button class="btn-speak" data-say="${line}" aria-label="Écouter">🔈</button>
      </div>
    </div>
    <button class="btn-primary" id="review-yes">🌟 On joue !</button>
    <button class="btn-ghost" id="review-later">Plus tard</button>
  `);
  bindSpeakButtons();
  playSound('good');
  speak(line);
  setHandler(document.getElementById('review-yes'), 'click', () => {
    playSound('tap');
    reviewStart();
  });
  setHandler(document.getElementById('review-later'), 'click', () => {
    playSound('tap');
    closeModal();
  });
  return true;
}

function reviewStart() {
  const items = pickDue(state.review, reviewToday(), REVIEW_SESSION);
  if (!items.length) {
    closeModal();
    return;
  }
  reviewMission = { items, i: 0, right: 0, wrong: 0 };
  setRoundHandlers({ onRight: () => reviewAnswered(true), onWrong: () => reviewAnswered(false) });
  reviewShowQuestion();
}

// Une question : seulement le jeu courant (le palier adaptatif en dépend)
// puis le rendu du jeu. Rien d'autre d'une partie normale : ni partie comptée,
// ni défi bonus consommé, ni erreurs remises à zéro.
function reviewShowQuestion() {
  const m = reviewMission;
  if (!m) return;
  const it = m.items[m.i];
  const r = REVIEW_REPLAYS[it.p.g];
  if (!r) {
    reviewEnd(); // un jeu qui n'a plus son contrat : on s'arrête là, sans rien compter
    return;
  }
  setLastGame(it.p.g);
  r.render(it.p);
  const head = document.querySelector('#modal-body .game-head');
  if (!head) return;
  head.classList.add('has-review'); // le titre laisse la place à la pastille (review.css)
  head.insertAdjacentHTML(
    'beforeend',
    `<span class="review-badge" aria-label="Souvenir ${m.i + 1} sur ${m.items.length}">🌟 ${m.i + 1}/${m.items.length}</span>`,
  );
}

/** @param {boolean} ok la première réponse à la question affichée */
function reviewAnswered(ok) {
  const m = reviewMission;
  if (!m) return;
  state.review = reviewAnswer(state.review, m.items[m.i].k, ok, reviewToday());
  save();
  if (ok) m.right++;
  else m.wrong++;
  m.i++;
  // deux erreurs : on s'arrête, les souvenirs non posés attendent sans changer
  if (m.wrong >= REVIEW_STOP_AFTER || m.i >= m.items.length) reviewEnd();
  else reviewShowQuestion();
}

// L'écran de fin : un retour qui dit ce que l'enfant a fait, et rien à gagner.
function reviewEnd() {
  const m = reviewMission;
  if (!m) return;
  reviewStop();
  emit('game:after', { win: true }); // fin naturelle : la pause peut venir ensuite (js/features/rest)
  const line =
    m.right && !m.wrong
      ? 'Bravo, ta mémoire a bien travaillé !'
      : m.right
        ? `Bravo, tu t'en es ${ac('souvenu', 'souvenue')} ! On garde les autres pour bientôt.`
        : "Merci d'avoir joué avec moi ! On en reparle bientôt.";
  openModal(`
    <div class="reward-box review-end" id="review-end">
      ${buddySlot('cheer', 'buddy-big')}
      <h2>🌟 Les souvenirs</h2>
      <div class="speech">${line}</div>
    </div>
    <button class="btn-primary" id="review-done">Super !</button>
  `);
  playSound('good');
  speak(line);
  setHandler(document.getElementById('review-done'), 'click', () => {
    playSound('tap');
    closeModal();
  });
}

export { maybeOfferReview, registerReplay };
