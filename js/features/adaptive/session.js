/* ---------- Ce qui se joue en ce moment (v54 : sorti du moteur des mini-jeux) ----------
   Le jeu en cours (`lastGame`) et le défi bonus de Zap. Ils règlent la
   difficulté (gameDiff) et ce qui est compté pour les parents ; le moteur
   les met à jour avec setLastGame et les fonctions du défi. */

let lastGame = null;
function setLastGame(key){ lastGame = key; }

/* Défi bonus de Zap (js/features/companion-team) : le jeu est joué un cran
   au-dessus de son niveau (js/features/adaptive/game-diff.js), la récompense
   est doublée, et le niveau du jeu ne bouge pas (js/features/parents). Il ne
   vaut que pour la partie lancée par startBonusChallenge. */
let bonusChallenge = null;

function inBonusChallenge(){ return !!bonusChallenge && bonusChallenge.key === lastGame; }
// Zap lance un défi : il vaut pour la prochaine partie de ce jeu seulement
function beginBonusChallenge(key){ bonusChallenge = { key, fresh:true, won:false }; }
// une nouvelle partie commence : le défi vaut pour la première, puis s'arrête
function bonusOnNewGame(){
  if(bonusChallenge){ if(bonusChallenge.fresh) bonusChallenge.fresh = false; else bonusChallenge = null; }
}
function endBonusChallenge(){ bonusChallenge = null; }

export {
  beginBonusChallenge, bonusChallenge, bonusOnNewGame, endBonusChallenge, inBonusChallenge, lastGame,
  setLastGame
};
