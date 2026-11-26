/* ---------- Le défi étoile, côté adulte : fermer toutes les portes ----------
   (track aller-plus-loin) Les réglages de l'espace parents agissent sur toute
   une partie : celle du joueur courant, ou celle d'un autre enfant, lue par
   l'espace parents qui l'enregistre ensuite. Les règles du défi lui-même sont
   dans stars.js ; ce fichier n'importe rien. */

/** @typedef {Partial<import('../../entities/game-state/index.js').GameState>} StarsHolder une partie : la courante, ou celle d'un autre enfant */

/**
 * Change toutes les portes d'une partie.
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

export { closeAllStarDoors, starsResetFor };
