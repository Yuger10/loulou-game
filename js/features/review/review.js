/* ---------- Les souvenirs : la révision espacée des questions ratées ----------
   Une question ratée dans un jeu simple (opérations, calcul, comparer, heure,
   lecture) est gardée dans state.review (js/entities/review : la file, ses
   règles et sa validation), pour être reposée 1, 3 puis 7 jours plus tard.

   Contrat d'un jeu : registerReplay(clé, { item, render }) —
     item(q)    la question posée (celle donnée à setHintQuestion) sous forme
                rejouable, ou null si elle ne se garde pas ;
     render(p)  le jeu affiche cette question-là (les choix sont tirés à nouveau).
   Un jeu sans contrat n'est pas gardé. */
import { addMiss, dayKey, validParams } from '../../entities/review/index.js';
import { save, state } from '../../entities/game-state/index.js';
import { party, race } from '../../entities/player/index.js';
import { on } from '../../shared/lib/index.js';
import { gameDiff, inBonusChallenge } from '../adaptive/index.js';

/** @typedef {import('../../entities/review/index.js').ReviewParams} ReviewParams */
/**
 * @template {ReviewParams} P
 * @typedef {{ item: (q: unknown) => P | null, render: (p: P) => void }} Replay
 */

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
   en solo. Rien n'est gardé à plusieurs (une erreur y passe la main), ni
   pendant le défi bonus de Zap (joué un cran au-dessus du niveau). */
on('answer:wrong', (/** @type {{ kind: string, q: unknown }} */ { kind, q }) => {
  if (party.active || race.active || inBonusChallenge()) return;
  const r = REVIEW_REPLAYS[kind];
  if (!r) return;
  const p = r.item(q);
  if (!p || p.g !== kind || !validParams(p)) return;
  state.review = addMiss(state.review, p, gameDiff(), reviewToday());
  save();
});

export { registerReplay };
