/* ---------- Le défi étoile : un cran au-dessus du plafond de l'enfant ----------
   (track aller-plus-loin) Quand un jeu est maîtrisé à son plafond (la classe ou
   l'âge de l'enfant, et le palier maximal du jeu), l'écran de victoire propose
   un défi étoile, toujours refusable. Accepté, il ouvre la « porte » du jeu :
   ses parties se jouent un cran au-dessus, sans regarder l'île, jusqu'à 2
   erreurs d'affilée ; la porte se referme alors, sans rien retirer à l'enfant.

   Dans la partie de chaque enfant :
     state.stars[jeu] = { streak, open, miss, won, offered }
       streak   missions d'affilée maîtrisées au plafond du jeu (offre à 3)
       open     la porte est ouverte
       miss     erreurs d'affilée pendant le défi (fermeture à 2, 6 au mémo)
       won      défis étoile réussis (une étoile sur le jeu dès 1)
       offered  dernier jour où le défi a été proposé (AAAA-MM-JJ)
   Dans le profil : starChallenges (false = un adulte a coupé les défis).

   Ce fichier n'importe ni skills.js ni game-diff.js, qui l'importent tous les
   deux (import/no-cycle). */
import { playerCap } from '../../entities/difficulty/index.js';
import { save, state } from '../../entities/game-state/index.js';
import { currentProfile, party } from '../../entities/player/index.js';
import { gameMaxTier } from './adaptive.js';
import { todayKey } from './day.js';
import { bonusChallenge, inBonusChallenge, lastGame } from './session.js';
import { SKILL_ERR_TOLERANCE } from './skill-status.js';

/** @typedef {import('../../entities/game-state/index.js').StarRecord} StarRecord */
/** @typedef {Partial<import('../../entities/game-state/index.js').GameState>} StarsHolder une partie : la courante, ou celle d'un autre enfant */

const STAR_STREAK = 3; // missions maîtrisées d'affilée avant de proposer le défi
const STAR_MISS_LIMIT = 2; // erreurs d'affilée qui referment la porte

// La mission étoile en cours (variable de session, comme le défi de Zap dans
// session.js) : posée au démarrage d'une partie, retirée à la fin de la mission.
/** @type {{ key: string } | null} */
let starMission = null;
// Une seule offre de défi étoile par ouverture du jeu, tous jeux confondus :
// rien ne remet cette marque à faux, sauf un nouveau chargement de la page.
let starOfferedThisSession = false;

/**
 * Le suivi étoile d'un jeu, sans rien créer : une valeur absente se lit par défaut.
 * @param {string} k le jeu
 * @returns {StarRecord}
 */
function starOf(k) {
  return (state.stars || {})[k] || { streak: 0, open: false, miss: 0, won: 0, offered: null };
}
/**
 * Le suivi étoile d'un jeu, créé s'il manque (pour l'écrire).
 * @param {string} k le jeu
 * @returns {StarRecord}
 */
function starRecord(k) {
  if (!state.stars) state.stars = {};
  if (!state.stars[k]) state.stars[k] = starOf(k);
  return state.stars[k];
}

/** @returns {number | null} le plafond de l'enfant qui joue (sa classe, sinon son âge) */
function starCap() {
  return playerCap(currentProfile());
}
/** @returns {boolean} un adulte n'a pas coupé les défis étoile de cet enfant */
function starSwitchOn() {
  const p = currentProfile();
  return !p || p.starChallenges !== false;
}
/**
 * Erreurs d'affilée qui referment la porte : 2, ou 6 au mémo (deux fois sa
 * tolérance), où retourner deux cartes différentes fait partie du jeu.
 * @param {string} k le jeu
 * @returns {number}
 */
function starMissLimit(k) {
  return SKILL_ERR_TOLERANCE[k] ? 2 * SKILL_ERR_TOLERANCE[k] : STAR_MISS_LIMIT;
}

/**
 * Le palier d'une mission étoile : un seul cran au-dessus du plafond de
 * l'enfant, sans dépasser le palier maximal du jeu.
 * @param {string} k le jeu
 * @returns {number}
 */
function starTier(k) {
  const cap = starCap();
  return cap ? Math.min(cap + 1, gameMaxTier(k)) : gameMaxTier(k);
}

/**
 * Une partie commence (playGame) : c'est une mission étoile si la porte du jeu
 * est ouverte, en solo, hors défi de Zap, pour un enfant dont le plafond est
 * connu. Interrupteur coupé par un adulte : la porte restée ouverte (partie
 * importée, autre onglet) se referme ici.
 * @param {string} k le jeu
 * @returns {void}
 */
function beginStarMission(k) {
  starMission = null;
  if (!starOf(k).open) return;
  if (!starSwitchOn()) {
    const s = starRecord(k);
    s.open = false;
    s.miss = 0;
    save();
    return;
  }
  // le défi de Zap prime : lastGame n'est pas encore réglé ici, on lit le défi lui-même
  const zap = !!bonusChallenge && bonusChallenge.key === k;
  if (starCap() === null || party.active || zap) return;
  starMission = { key: k };
}
/** @returns {void} */
function endStarMission() {
  starMission = null;
}
/** @returns {boolean} la mission en cours a commencé comme une mission étoile */
function inStarMission() {
  return !!starMission && starMission.key === lastGame;
}
/**
 * La règle « Palier étoile » : la mission étoile en cours a encore sa porte
 * ouverte. Fermée en pleine mission, la mission reste comptée comme étoile
 * mais se joue au palier habituel, sans badge.
 * @returns {boolean}
 */
function starActive() {
  return (
    inStarMission() &&
    !!lastGame &&
    starOf(lastGame).open === true &&
    starSwitchOn() &&
    starCap() !== null &&
    !party.active &&
    !inBonusChallenge()
  );
}

/**
 * La règle « Offre due » : faut-il proposer le défi étoile de ce jeu sur
 * l'écran de victoire ? Toutes les conditions de la spec, dans l'ordre.
 * @param {string} k le jeu
 * @returns {boolean}
 */
function starOfferDue(k) {
  const s = starOf(k);
  const cap = starCap();
  return (
    s.streak >= STAR_STREAK &&
    starSwitchOn() &&
    cap !== null &&
    cap < gameMaxTier(k) &&
    !party.active &&
    !inBonusChallenge() &&
    s.open !== true &&
    !inStarMission() &&
    s.offered !== todayKey() &&
    !starOfferedThisSession
  );
}
/**
 * L'offre vient d'être montrée : pas avant demain pour ce jeu, et plus aucune
 * offre pendant cette ouverture du jeu (quitter l'écran vaut un refus).
 * @param {string} k le jeu
 * @returns {void}
 */
function noteStarOffered(k) {
  starRecord(k).offered = todayKey();
  starOfferedThisSession = true;
  save();
}

/**
 * L'enfant accepte le défi : la porte s'ouvre.
 * @param {string} k le jeu
 * @returns {void}
 */
function openStarDoor(k) {
  const s = starRecord(k);
  s.open = true;
  s.miss = 0;
  save();
}
/**
 * La porte se referme : il faudra de nouveau 3 missions maîtrisées. Les
 * étoiles déjà gagnées (`won`) restent.
 * @param {string} k le jeu
 * @returns {void}
 */
function closeStarDoor(k) {
  const s = starRecord(k);
  s.open = false;
  s.streak = 0;
  s.miss = 0;
  save();
}

/**
 * Une erreur pendant une mission étoile.
 * @returns {boolean} true si la porte vient de se fermer (le moteur retire le badge)
 */
function noteStarError() {
  if (!lastGame || !starActive()) return false;
  const s = starRecord(lastGame);
  s.miss++;
  if (s.miss >= starMissLimit(lastGame)) {
    closeStarDoor(lastGame);
    return true;
  }
  save();
  return false;
}
/**
 * Une bonne étape pendant une mission étoile : les erreurs ne sont plus « d'affilée ».
 * @returns {void}
 */
function noteStarGood() {
  if (!lastGame || !starActive() || !starOf(lastGame).miss) return;
  starRecord(lastGame).miss = 0;
  save();
}

/**
 * Après une mission enregistrée en solo, hors défi de Zap (recordMission, qui
 * enregistre ensuite la partie).
 * - Mission étoile, porte encore ouverte : gagnée, le jeu gagne une étoile ;
 *   ratée, la porte se referme. Porte fermée en cours de mission : rien.
 * - Mission habituelle : jouée au plafond du jeu et maîtrisée, elle rapproche
 *   de l'offre ; ratée ou avec trop d'erreurs, le compteur repart de 0 ; jouée
 *   plus bas (île plus facile, niveau du jeu), elle ne compte pas.
 * @param {boolean} ok mission réussie
 * @param {number} errors erreurs pendant la mission
 * @param {number} t palier joué
 * @returns {void}
 */
function starAfterMission(ok, errors, t) {
  const k = lastGame;
  if (!k) return;
  if (inStarMission()) {
    if (!starActive()) return;
    const s = starRecord(k);
    if (ok) {
      s.won++;
      s.miss = 0;
    } else {
      s.open = false;
      s.streak = 0;
      s.miss = 0;
    }
    return;
  }
  const cap = starCap();
  if (cap === null || t !== Math.min(cap, gameMaxTier(k))) return;
  const s = starRecord(k);
  s.streak = ok && errors <= (SKILL_ERR_TOLERANCE[k] || 1) ? s.streak + 1 : 0;
}

/**
 * Change toutes les portes d'une partie (celle du joueur courant, ou celle
 * d'un autre enfant lue par l'espace parents, qui l'enregistre ensuite).
 * @param {StarsHolder} st
 * @param {boolean} resetStreak remettre aussi les compteurs de maîtrise à 0
 * @returns {boolean} true si quelque chose a changé (il faut enregistrer)
 */
function shutStarDoors(st, resetStreak) {
  let changed = false;
  Object.values(st.stars || {}).forEach((s) => {
    if (s.open || s.miss || (resetStreak && s.streak)) changed = true;
    s.open = false;
    s.miss = 0;
    if (resetStreak) s.streak = 0;
  });
  return changed;
}
/**
 * Un adulte coupe les défis étoile : toutes les portes se ferment ; les
 * compteurs de maîtrise et les étoiles gagnées restent.
 * @param {StarsHolder} st
 * @returns {boolean} true si quelque chose a changé
 */
function closeAllStarDoors(st) {
  return shutStarDoors(st, false);
}
/**
 * Un adulte change la classe : le plafond change, donc toutes les portes se
 * ferment et la maîtrise se prouve de nouveau ; les étoiles gagnées restent.
 * @param {StarsHolder} st
 * @returns {boolean} true si quelque chose a changé
 */
function starsResetFor(st) {
  return shutStarDoors(st, true);
}

export {
  beginStarMission,
  closeAllStarDoors,
  closeStarDoor,
  endStarMission,
  inStarMission,
  noteStarError,
  noteStarGood,
  noteStarOffered,
  openStarDoor,
  starActive,
  starAfterMission,
  starOf,
  starOfferDue,
  starsResetFor,
  starTier,
};
