/* ---------- Un jeu qui s'adapte à chaque enfant (Phase 3) ----------
   Jusqu'ici, la difficulté d'un mini-jeu suivait seulement l'île (plafonnée
   par l'âge) : changer d'île suffisait pour tout rendre plus difficile,
   même un jeu jamais réussi. Désormais, CHAQUE mini-jeu a son propre
   niveau pour chaque enfant, gardé dans sa partie :
     state.skills[jeu].lvl     niveau atteint dans ce jeu (1 à 5, 6 pour
                               le calcul mental, les formes et les planètes)
     state.skills[jeu].atLvl   les 3 dernières missions jouées à ce niveau
     state.skills[jeu].support true si le jeu est redescendu d'un cran

   Règles (en solo ; à plusieurs, chacun garde la difficulté de son âge) :
   - le niveau joué est le plus petit entre celui de l'île et celui du jeu :
     une île ne rend jamais un jeu plus difficile que ce que l'enfant a
     acquis, et un jeu ne dépasse jamais l'île ni l'âge ;
   - premier essai d'un jeu : un cran sous l'île (pour se placer), le
     niveau 1 restant le minimum ;
   - on monte d'un cran après 2 missions réussies d'affilée à ce niveau,
     avec au plus 1 erreur chacune (3 au mémo, où retourner deux cartes
     différentes fait partie du jeu) ;
   - on redescend d'un cran (« soutien ») après 2 missions ratées sur les
     3 dernières à ce niveau ; on remonte ensuite de la même façon ;
   - un jeu à travailler revient plus souvent : une fois sur deux, il
     prend l'une des deux places du choix des jeux (et de la Surprise) ;
   - quand un jeu progresse, le compagnon le dit sur l'écran de victoire
     (« Tu lis de mieux en mieux ! »). */

const GAME_TIER_MAX = { calc:6, shapes:6, planets:6 };
const ADAPT_UP_STREAK = 2;      // réussites d'affilée pour monter d'un cran
const ADAPT_DOWN_FAILS = 2;     // missions ratées (sur les 3 dernières) pour redescendre
let PRACTICE_CHANCE = 0.5;      // part des choix où revient un jeu à travailler

// Ce que dit le compagnon quand un jeu progresse (sans accord : valable
// pour une fille comme pour un garçon).
const PROGRESS_CHEERS = {
  reading:      'Tu lis de mieux en mieux !',
  determinants: 'Les petits mots, tu les connais de mieux en mieux !',
  count:        'Tu comptes de mieux en mieux !',
  puzzle:       'Tu ranges les nombres de mieux en mieux !',
  compare:      'Tu compares les nombres de mieux en mieux !',
  math:         'Tes calculs sont de plus en plus justes !',
  calc:         'Ton calcul mental progresse vite !',
  money:        'Tu comptes les pièces de mieux en mieux !',
  clock:        "Tu lis l'heure de mieux en mieux !",
  calendar:     'Les jours et les saisons, tu les connais de mieux en mieux !',
  volume:       'Tu compares les tailles de mieux en mieux !',
  shapes:       'Les formes et les couleurs, tu les reconnais de mieux en mieux !',
  planets:      'Tu connais les planètes de mieux en mieux !',
  memory:       'Ta mémoire est de plus en plus forte !',
  simon:        'Tu retiens des suites de plus en plus longues !',
  diff:         'Tu repères les intrus de mieux en mieux !',
  sequence:     'Tu trouves les suites de mieux en mieux !',
  jigsaw:       'Tu assembles les images de mieux en mieux !',
};

function gameMaxTier(key){ return GAME_TIER_MAX[key] || 5; }
function skillOf(key){ return (state.skills || {})[key] || null; }
function inGroupPlay(){ return party.active; }

// Niveau de départ d'un jeu jamais joué : un cran sous l'île.
function placementTier(base){ return Math.max(1, base - 1); }

// Niveau réellement joué pour ce jeu, à partir du palier de l'île (déjà
// plafonné par l'âge). Appelé par gameDiff() en solo.
function adaptTier(base, key){
  key = key || lastGame;
  if(!key || inGroupPlay()) return base;
  const s = skillOf(key);
  const lvl = s && s.lvl ? s.lvl : placementTier(base);
  return Math.max(1, Math.min(base, lvl, gameMaxTier(key)));
}

// Après une mission enregistrée (js/features/parents/parents.js, recordMission) : fait
// monter ou redescendre le niveau du jeu. Renvoie {type:'up'|'down', lvl}
// ou null.
function adaptAfterMission(key, s, tier, ok, errors){
  if(!s.lvl) s.lvl = tier;           // premier passage : on part du niveau joué
  if(tier !== s.lvl) return null;    // joué plus bas (île plus facile) : ne compte pas
  s.atLvl = (s.atLvl || []).concat({ ok: !!ok, e: errors }).slice(-3);
  const tol = (SKILL_ERR_TOLERANCE[key]) || 1;
  const streak = s.atLvl.slice(-ADAPT_UP_STREAK);
  if(streak.length === ADAPT_UP_STREAK && streak.every(x=>x.ok && x.e <= tol) && s.lvl < gameMaxTier(key)){
    const back = !!s.support;
    s.lvl++; s.atLvl = []; s.support = false;
    return { type:'up', lvl: s.lvl, back };
  }
  if(s.atLvl.filter(x=>!x.ok).length >= ADAPT_DOWN_FAILS && s.lvl > 1){
    s.lvl--; s.atLvl = []; s.support = true;
    return { type:'down', lvl: s.lvl };
  }
  return null;
}

/* ---- ce qui est à travailler revient plus souvent ---- */
function needsPractice(key){
  const s = skillOf(key);
  return !!s && (s.support || skillStatus(s, key)==='difficile');
}
// Un jeu à travailler parmi ceux proposés (jamais celui qu'on vient de
// jouer), une fois sur deux ; sinon null.
function pickPracticeGame(keys){
  if(inGroupPlay() || Math.random() >= PRACTICE_CHANCE) return null;
  const last = lastGame;
  const list = keys.filter(k=>k!==last && needsPractice(k));
  return list.length ? pickRandom(list) : null;
}

/* ---- le compagnon encourage ce qui progresse ---- */
function progressCheer(p){
  if(!p) return null;
  return PROGRESS_CHEERS[p.key] || 'Tu progresses, bravo !';
}
