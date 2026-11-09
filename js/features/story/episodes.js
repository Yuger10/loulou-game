/* ---------- L'histoire avance à chaque mission (Phase 4) ----------
   Entre deux chapitres (un par île, js/features/story/story.js), il se passait 10 à 20
   missions sans rien de nouveau. Chaque île a maintenant 3 ÉPISODES : de
   petites scènes racontées par les autres habitants de l'île, qui suivent
   le fil de la chasse au trésor (une bouteille à la mer, une petite clé
   dorée qui servira au château, une noix de coco qui fait tic-tac…) et
   annoncent l'île suivante.
   - Un épisode arrive après la 2e, la 4e et la 7e mission réussie sur
     l'île (en solo), juste après l'écran de victoire.
   - L'écran de victoire montre que l'histoire avance (●●○).
   - Chaque épisode fait trouver un objet (pour l'histoire) et 3 pièces.
   - « 📖 Mon histoire » permet de relire les épisodes déjà vus.
   Données : state.storyMissions[île] = missions réussies sur l'île ;
             state.storyEpisodes[île] = nombre d'épisodes déjà vus. */

const EPISODE_AT = [2, 4, 7];     // missions réussies sur l'île pour chaque épisode
const EPISODE_REWARD = 3;

// by : personnage qui raconte ; find : ce que l'on trouve (pour l'histoire)
const EPISODES = {
  lagon: [
    { by:'pirate',  title:'La bouteille à la mer', find:'✉️',
      lines:["Ohé ! J'ai repêché une bouteille avec un message dedans !", "Il dit : « Le trésor dort là où les huit îles se donnent la main. » Mystère…"] },
    { by:'licorne', title:"L'étoile filante", find:'⭐',
      lines:["Cette nuit, une étoile filante est tombée derrière la forêt.", "Ma corne brille quand je regarde par là. C'est sûrement un signe !"] },
    { by:'danseuse', title:'La danse des vagues', find:'🐚',
      lines:["Les vagues dansent plus fort aujourd'hui.", "Elles veulent t'emmener plus loin : continue tes missions, la Forêt enchantée t'attend !"] },
  ],
  foret: [
    { by:'hibou', title:'Des traces qui brillent', find:'🐾',
      lines:["Hou hou ! J'ai vu des traces qui brillent sur le chemin.", "Elles mènent au grand chêne. Quelqu'un est passé par là avant toi…"] },
    { by:'biche', title:'La petite clé dorée', find:'🗝️',
      lines:["Dans le creux du grand chêne, j'ai trouvé une petite clé dorée.", "Elle ne m'ouvre rien… Garde-la bien : elle ouvrira peut-être quelque chose pour toi !"] },
    { by:'loup', title:'Le vent des montagnes', find:'❄️',
      lines:["Ahouuu ! Du haut de la colline, je vois des montagnes toutes blanches.", "Le vent qui en descend sent l'aventure. Prêt pour la suite ?"] },
  ],
  montagne: [
    { by:'aigle', title:'La grotte aux cristaux', find:'🔮',
      lines:["Je vole plus haut que les nuages.", "De là-haut, j'ai vu une grotte qui scintille de mille cristaux !"] },
    { by:'robotmontagne', title:'Le vieux parchemin', find:'📜',
      lines:["Bip bip ! Mes capteurs ont trouvé un vieux parchemin dans la grotte.", "Il y a un dessin dessus : un château avec une tour très haute."] },
    { by:'magicienne', title:'La boule de cristal', find:'🏰',
      lines:["Ma boule de cristal montre une princesse qui t'attend dans son château.", "Garde bien la petite clé de la forêt : elle va bientôt servir !"] },
  ],
  chateau: [
    { by:'pegase', title:'Le tour des tours', find:'🌟',
      lines:["Hiii ! Monte sur mon dos, on fait le tour des tours !", "Là-haut, une fenêtre est fermée par une serrure toute dorée…"] },
    { by:'chevalier', title:'La fenêtre de la tour', find:'🗺️',
      lines:["La petite clé de la forêt ! Elle ouvre la fenêtre de la tour !", "Derrière, il y a une carte, avec une jungle et un singe dessinés dessus."] },
    { by:'sorciere', title:'La potion qui parle', find:'🧪',
      lines:["Hi hi ! N'aie pas peur, je suis une gentille sorcière.", "Ma potion me dit que, dans la jungle, quelqu'un connaît le chemin du trésor."] },
  ],
  jungle: [
    { by:'singe', title:'La noix de coco qui fait tic-tac', find:'🥥',
      lines:["Hop, hop ! Je saute de liane en liane.", "Tout en haut d'un arbre, j'ai trouvé une noix de coco… qui fait tic-tac !"] },
    { by:'perroquet', title:"L'horloge cachée", find:'⏰',
      lines:["Tic-tac, tic-tac ! La noix de coco cache une petite horloge.", "Elle vient sûrement de la Cité du Temps…"] },
    { by:'jaguar', title:'Le chemin secret', find:'🌿',
      lines:["Doucement… J'ai flairé un chemin secret entre les grandes feuilles.", "Il mène à une porte en pierre, avec des aiguilles d'horloge. Bientôt la Cité !"] },
  ],
  cite: [
    { by:'robotcoucou', title:"L'heure de l'aventure", find:'🕰️',
      lines:["Coucou ! Coucou ! C'est l'heure de l'aventure !", "Merci d'avoir rapporté l'horloge de la jungle : elle était perdue depuis cent ans."] },
    { by:'gardienne', title:'Le secret du temps', find:'⏳',
      lines:["Le temps m'a raconté un secret.", "Le prochain indice est caché près d'un volcan… qui fait des bulles de feu !"] },
    { by:'chouette', title:'La nuit du volcan', find:'🌙',
      lines:["Cette nuit, j'ai vu le volcan s'allumer, tout rouge.", "Prends ton courage à deux mains : le génie du volcan t'attend !"] },
  ],
  volcan: [
    { by:'savante', title:'La lave qui chante', find:'🔥',
      lines:["J'ai mesuré la lave : elle est très chaude, mais elle chante !", "Écoute bien : elle répète « dou-ceur, dou-ceur »… Bizarre, non ?"] },
    { by:'dragonlave', title:'La pierre de feu', find:'💎',
      lines:["Je garde cette pierre de feu depuis mille ans.", "Je te la confie : elle te donnera du courage pour la dernière étape."] },
    { by:'robotsavant', title:'Le mot mystère', find:'🍡',
      lines:["Analyse terminée ! Le mot « douceur » mène au Pays Squishy.", "C'est là que le dernier secret t'attend. Bip bip, bonne chance !"] },
  ],
  squishy: [
    { by:'donut', title:'Tout est tout doux', find:'🍭',
      lines:["Bienvenue ! Ici, tout est tout doux, même le sol.", "On dit que le trésor est caché dans un nuage de barbe à papa !"] },
    { by:'phoque', title:'Le coffre moelleux', find:'🎁',
      lines:["Plouf ! J'ai trouvé un coffre tout moelleux sous l'eau.", "Il est fermé par huit petites serrures : une pour chaque île que tu as visitée !"] },
    { by:'avocat', title:'Le vrai trésor', find:'🏆',
      lines:["Tu as tous les indices, et tous nos amis sont avec toi.", "Le vrai trésor du Lagon Magique, c'est tout ce que tu as appris en chemin. Bravo !"] },
  ],
};

function storyMissionsOn(world){ return (state.storyMissions || {})[world] || 0; }
function episodesSeen(world){ return (state.storyEpisodes || {})[world] || 0; }
// une mission réussie sur l'île (appelé par onMissionWin, en solo)
function noteStoryMission(world){
  if(!EPISODES[world]) return;
  state.storyMissions = Object.assign({}, state.storyMissions || {}, { [world]: storyMissionsOn(world) + 1 });
}
// l'épisode à montrer maintenant sur cette île (son numéro), ou -1
function episodeDue(world){
  const eps = EPISODES[world];
  if(!eps) return -1;
  const k = episodesSeen(world);
  return k < eps.length && storyMissionsOn(world) >= EPISODE_AT[k] ? k : -1;
}
// pour l'écran de victoire : les missions vers le prochain épisode (●●○), ou ''
function storyProgressHTML(world){
  const k = episodesSeen(world), eps = EPISODES[world];
  if(!eps || k >= eps.length) return '';
  const from = k ? EPISODE_AT[k-1] : 0, need = EPISODE_AT[k] - from;
  const done = Math.min(need, storyMissionsOn(world) - from);
  const dots = Array.from({length:need}, (_,i)=> i < done ? '●' : '○').join('');
  return `<div class="story-progress" aria-label="L'histoire avance : ${done} sur ${need}">📖 ${done >= need ? 'Un nouvel épisode de l\'histoire t\'attend !' : 'L\'histoire avance…'} <span class="sp-dots">${dots}</span></div>`;
}

// Montre l'épisode dû (après l'écran de victoire). Renvoie true s'il y en a un.
function maybeStoryEpisode(){
  if(typeof party!=='undefined' && party.active) return false;
  const world = typeof currentWorld!=='undefined' ? currentWorld : 'lagon';
  const k = episodeDue(world);
  if(k < 0) return false;
  state.storyEpisodes = Object.assign({}, state.storyEpisodes || {}, { [world]: k + 1 });
  addCoins(EPISODE_REWARD);
  save();
  openEpisode(world, k, 0, true);
  return true;
}

// Une scène, ligne par ligne. fresh : vient d'être débloquée (pièces gagnées).
function openEpisode(world, k, line, fresh){
  const ep = EPISODES[world][k];
  const c = CHARACTERS[ep.by];
  const last = line >= ep.lines.length - 1;
  openModal(`
    <div class="char-header">
      <span class="emoji">${typeof charFace==='function' ? charFace(ep.by) : c.emoji}</span>
      <h2><small class="ep-num">Épisode ${k + 1} sur ${EPISODES[world].length}</small>${ep.title}</h2>
    </div>
    ${speechBubble(ep.lines[line])}
    ${last ? `<div class="speech ep-find"><span class="ep-find-emoji" aria-hidden="true">${ep.find}</span><span>${c.name} t'a montré un indice de l'histoire${fresh ? `, et tu gagnes <strong>${EPISODE_REWARD} pièces</strong>` : ''} !</span></div>` : ''}
    <button class="btn-primary" id="ep-next">${last ? 'Continuer ✨' : 'Suite ➡️'}</button>
  `);
  bindSpeakButtons();
  speak(`${line === 0 ? c.name + ' : ' : ''}${ep.lines[line]}`);
  if(last && fresh){ playSound('coin'); if(typeof gainCoins==='function') gainCoins(EPISODE_REWARD, document.querySelector('.ep-find-emoji')); }
  document.getElementById('ep-next').onclick = ()=>{
    playSound('tap');
    if(!last){ openEpisode(world, k, line + 1, fresh); return; }
    closeModal();
    if(typeof renderLagon==='function') renderLagon();
  };
}
