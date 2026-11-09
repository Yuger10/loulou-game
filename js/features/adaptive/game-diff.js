/* ---------- Difficulté jouée : île, âge, et niveau adaptatif de chaque mini-jeu ---------- */
function gameDiffIsland(){ return WORLDS[currentWorld] ? WORLDS[currentWorld].diff : 1; }

// La difficulté suit l'île… mais jamais au-delà de ce que l'âge du
// joueur permet, y compris en solo. Avant ce correctif, un enfant de
// 3-4 ans qui avait progressé jusqu'à l'île 2-3 (ce qui arrive vite,
// seulement 10-25 missions) recevait quand même la difficulté complète
// de cette île : seul le TYPE de jeu était filtré par âge
// (`gameTypesForAge`), jamais ses PARAMÈTRES numériques. Résultat : des
// exercices trop abstraits pour son âge (ex. la variante miroir de
// « Trouve l'intrus »), que l'enfant ne peut résoudre qu'au hasard.
function gameDiff(){
  const island = gameDiffIsland();
  // multijoueur (chacun son tour / course) : l'âge prime totalement,
  // sans plafond lié à l'île — c'est le mécanisme d'équité déjà en
  // place (chacun joue à son niveau, peu importe où se déroule la partie).
  if(party.active){
    const p = partyCurrent() || currentProfile();
    const d = p && ageToDiff(p.age);
    if(d) return d;
  }
  // solo : l'âge, s'il est renseigné, plafonne la difficulté de l'île —
  // jamais l'inverse (un enfant plus âgé qu'une île facile n'est pas
  // artificiellement ralenti, seul le cas « trop dur pour son âge »
  // est corrigé).
  {
    const p = currentProfile();
    const d = p && ageToDiff(p.age);
    if(d) return adaptedDiff(Math.min(d, island));
  }
  return adaptedDiff(island);
}

// Phase 3 : chaque mini-jeu a son propre niveau par enfant (js/features/adaptive/adaptive.js) ;
// on ne joue jamais au-dessus de ce qui est acquis dans CE jeu.
// Défi bonus de Zap (v52) : un cran au-dessus du niveau du jeu, sans jamais
// dépasser le plafond de l'âge ni le palier maximal du jeu.
function adaptedDiff(base){
  const t = adaptTier(base);
  if(!inBonusChallenge()) return t;
  const p = currentProfile();
  const ageCap = (p && ageToDiff(p.age)) || 6;
  return Math.max(t, Math.min(t + 1, ageCap, gameMaxTier(lastGame)));
}
