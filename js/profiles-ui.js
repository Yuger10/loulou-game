/* ---------- Écran des joueurs, modes de jeu, choix du mini-jeu ---------- */

const GAME_LIST = [
  { key:'memory',   emoji:'🧠', name:'Mémoire',      fn:()=>renderMemory() },
  { key:'count',    emoji:'🔢', name:'Compter',      fn:()=>renderCount() },
  { key:'diff',     emoji:'🔍', name:"L'intrus",     fn:()=>renderDiff() },
  { key:'puzzle',   emoji:'🧩', name:'Les nombres',  fn:()=>renderPuzzle() },
  { key:'sequence', emoji:'🔮', name:'La suite',     fn:()=>renderSequence() },
  { key:'simon',    emoji:'🎵', name:'Les couleurs', fn:()=>renderSimon() },
  { key:'math',     emoji:'➕', name:'Opérations',   fn:()=>renderMath() },
  { key:'reading',  emoji:'📖', name:'Lecture',      fn:()=>renderReading() },
  { key:'determinants', emoji:'🔤', name:'Petits mots', fn:()=>renderDeterminants() },
  { key:'volume',   emoji:'🧪', name:'Volumes',      fn:()=>renderVolume() },
  { key:'compare',  emoji:'⚖️', name:'Comparer',     fn:()=>renderCompare() },
  { key:'money',    emoji:'💰', name:'La monnaie',   fn:()=>renderMoney() },
  { key:'clock',    emoji:'🕐', name:"L'heure",      fn:()=>renderClock() },
  { key:'calendar', emoji:'📅', name:'Calendrier',   fn:()=>renderCalendar() },
  { key:'calc',     emoji:'🌋', name:'Calcul mental', fn:()=>renderCalc() },
  { key:'shapes',   emoji:'🍡', name:'Formes et couleurs', fn:()=>renderShapes() },
];

/* --- Panneau des joueurs --- */
function openPlayers(){
  const sel = new Set(party.active ? party.players : [profiles.current]);
  const render = ()=>{
    openModal(`
      ${gameHeader('👥 Les joueurs', 'Choisis qui joue, ou ajoute quelqu\'un')}
      <div id="players-list">
        ${profiles.list.map(p=>`
          <div class="market-row player-row ${p.id===profiles.current?'current':''}">
            <span class="emoji">${p.avatar}<span class="row-buddy">${companionSVG(companionOf(p),'happy')}</span></span>
            <div class="info">
              <div class="name">${p.name || 'Sans nom'} ${p.id===profiles.current?'<small>(en cours)</small>':''}</div>
              <div class="sub">${p.age?`🎂 ${p.age} ans · `:''}${playerSummary(p.id)}</div>
            </div>
            <button class="pick-btn ${sel.has(p.id)?'on':''}" data-pick="${p.id}">${sel.has(p.id)?'✅':'⬜️'}</button>
            <button class="btn-small ghost" data-edit="${p.id}">⚙️</button>
          </div>`).join('')}
      </div>
      <button class="btn-craft" id="btn-add-player">➕ Ajouter un joueur</button>
      <div class="mode-row">
        <button class="btn-primary" id="btn-solo">👤 Solo</button>
        <button class="btn-primary alt" id="btn-turns">🎲 Chacun<br>son tour</button>
        <button class="btn-primary race" id="btn-race">🏁 Course</button>
      </div>
      <p class="mode-hint">🏁 En course, chacun joue à sa difficulté selon son âge : c'est équitable même entre grands et petits.</p>
      ${party.active ? `<button class="btn-ghost" id="btn-stop-party">Arrêter le mode chacun son tour</button>` : ''}
    `);
    bindQuit();

    document.querySelectorAll('[data-pick]').forEach(b=>{
      b.onclick = ()=>{
        const id = b.dataset.pick;
        if(sel.has(id)) sel.delete(id); else sel.add(id);
        playSound('tap');
        render();
      };
    });
    document.querySelectorAll('[data-edit]').forEach(b=>{
      b.onclick = ()=>{ playSound('tap'); openPlayerSettings(b.dataset.edit); };
    });
    document.getElementById('btn-add-player').onclick = ()=>{ playSound('tap'); openNewPlayer(); };
    document.getElementById('btn-solo').onclick = ()=>{
      playSound('tap');
      const id = [...sel][0] || profiles.current;
      if(party.active) stopParty();
      switchProfile(id, true);
      closeModal();
      renderProfile(); renderLagon();
      speak(`Mode solo. À toi de jouer ${currentProfile().name || ''} !`);
      showToast(`👤 ${currentProfile().avatar} ${currentProfile().name || ''}`);
    };
    document.getElementById('btn-turns').onclick = ()=>{
      playSound('tap');
      const ids = profiles.list.filter(p=>sel.has(p.id)).map(p=>p.id);
      if(ids.length < 2){
        showToast('Choisis au moins 2 joueurs ✌️');
        speak('Choisis au moins deux joueurs pour jouer chacun son tour.');
        return;
      }
      startParty(ids);
      closeModal();
    };
    document.getElementById('btn-race').onclick = ()=>{
      playSound('tap');
      const ids = profiles.list.filter(p=>sel.has(p.id)).map(p=>p.id);
      if(ids.length < 2){
        showToast('Choisis au moins 2 joueurs ✌️');
        speak('Choisis au moins deux joueurs pour faire la course.');
        return;
      }
      const sansAge = profiles.list.filter(p=>sel.has(p.id) && !p.age);
      if(sansAge.length){
        showToast(`Ajoute l'âge de ${sansAge[0].name || 'ce joueur'} 🎂`);
        speak(`Indique l'âge de ${sansAge[0].name || 'ce joueur'} pour une course équitable.`);
        openPlayerSettings(sansAge[0].id);
        return;
      }
      startRace(ids);
      closeModal();
      renderLagon();
    };
    const stop = document.getElementById('btn-stop-party');
    if(stop) stop.onclick = ()=>{ playSound('tap'); stopParty(); closeModal(); };
  };
  render();
}

function playerSummary(id){
  try{
    const raw = localStorage.getItem(profileSaveKey(id));
    if(!raw) return 'Nouvelle aventure';
    const s = JSON.parse(raw);
    const lvl = 1 + Math.floor((s.missions||0)/MISSIONS_PER_LEVEL);
    return `⭐ niveau ${lvl} · 🪙 ${s.coins||0} · 🎮 ${s.missions||0} missions`;
  }catch(e){ return ''; }
}

function genderSelector(sel){
  const opts = [
    { v:'f', emoji:'👧', label:'Fille' },
    { v:'m', emoji:'👦', label:'Garçon' },
    { v:'',  emoji:'🧒', label:'Peu importe' },
  ];
  return `<label class="mini-label">Comment on te parle ?</label>
    <div class="gender-row">
      ${opts.map(o=>`<button class="gender-opt ${String(sel||'')===o.v?'sel':''}" data-gender="${o.v}">
        <span class="ge">${o.emoji}</span><span class="gl">${o.label}</span></button>`).join('')}
    </div>`;
}

function ageSelector(sel){
  const ages = [4,5,6,7,8,9,10,11,12];
  return `<label class="mini-label">🎂 Quel âge ?</label>
    <div class="age-grid">
      ${ages.map(a=>`<button class="age-opt ${Number(sel)===a?'sel':''}" data-age="${a}">${a}</button>`).join('')}
    </div>
    <p class="mode-hint" id="age-hint">${sel?`Défi adapté : ${'⭐'.repeat(ageToDiff(sel))}`:'Sert à adapter la difficulté en course 🏁'}</p>`;
}

/* --- Nouveau joueur --- */
function openNewPlayer(){
  let av = pickRandom(AVATARS);
  let age = null, gen = '', comp = null, allBuddies = false;
  const render = ()=>{
    openModal(`
      ${gameHeader('➕ Nouveau joueur', 'Choisis un prénom, un avatar et ton âge')}
      <input id="np-name" class="name-input-modal" type="text" maxlength="12" placeholder="Prénom" autocomplete="off">
      <div class="avatar-grid">
        ${AVATARS.map(a=>`<button class="avatar-opt ${a===av?'sel':''}" data-av="${a}">${a}</button>`).join('')}
      </div>
      ${genderSelector(gen)}
      ${companionSelector(comp || defaultCompanionFor(gen), gen, allBuddies)}
      ${ageSelector(age)}
      <button class="btn-primary" id="np-ok">C'est parti ! 🎮</button>
      <button class="btn-ghost" id="np-cancel">Annuler</button>
    `);
    bindQuit();
    const input = document.getElementById('np-name');
    const redraw = ()=>{ const v = input.value; render(); document.getElementById('np-name').value = v; };
    document.querySelectorAll('.avatar-opt').forEach(b=>{
      b.onclick = ()=>{ av = b.dataset.av; playSound('tap'); redraw(); };
    });
    document.querySelectorAll('.age-opt').forEach(b=>{
      b.onclick = ()=>{ age = Number(b.dataset.age); playSound('tap'); redraw(); };
    });
    document.querySelectorAll('.gender-opt').forEach(b=>{
      b.onclick = ()=>{
        gen = b.dataset.gender; playSound('tap');
        if(comp && !allBuddies && !companionsFor(gen).includes(comp)) comp = null;
        redraw();
      };
    });
    bindCompanionSelector(document, k=>{ comp = k; redraw(); }, ()=>{ allBuddies = true; redraw(); });
    document.getElementById('np-ok').onclick = ()=>{
      const name = (document.getElementById('np-name').value || '').trim().slice(0,12);
      addProfile(name, av, age, gen, comp || defaultCompanionFor(gen));
      playSound('win'); confetti();
      speak(`Bienvenue ${name || ''} !`);
      showToast(`${av} ${name || 'Nouveau joueur'} ajouté !`);
      openPlayers();
    };
    document.getElementById('np-cancel').onclick = ()=>{ playSound('tap'); openPlayers(); };
  };
  render();
}

/* --- Réglages d'un joueur : renommer, réinitialiser, supprimer --- */
function openPlayerSettings(id){
  const p = profiles.list.find(x=>x.id===id);
  if(!p) return;
  let av = p.avatar;
  let age = p.age || null;
  let gen = p.gender || '';
  let comp = companionOf(p), allBuddies = !companionsFor(gen).includes(comp);
  const render = ()=>{
    openModal(`
      ${gameHeader(`⚙️ ${p.name || 'Joueur'}`, 'Modifier, réinitialiser ou supprimer')}
      <input id="pe-name" class="name-input-modal" type="text" maxlength="12" value="${(p.name||'').replace(/"/g,'&quot;')}" placeholder="Prénom">
      <div class="avatar-grid">
        ${AVATARS.map(a=>`<button class="avatar-opt ${a===av?'sel':''}" data-av="${a}">${a}</button>`).join('')}
      </div>
      ${genderSelector(gen)}
      ${companionSelector(comp, gen, allBuddies)}
      ${ageSelector(age)}
      <div class="speech" style="font-size:.82rem;">${playerSummary(id)}</div>
      <button class="btn-primary" id="pe-save">Enregistrer ✅</button>
      <button class="btn-craft danger" id="pe-reset">🔄 Recommencer à zéro</button>
      ${profiles.list.length>1 ? `<button class="btn-craft danger" id="pe-del">🗑️ Supprimer ce joueur</button>` : ''}
      <button class="btn-ghost" id="pe-back">Retour</button>
    `);
    bindQuit();
    const input = document.getElementById('pe-name');
    const redraw = ()=>{ const v = input.value; render(); document.getElementById('pe-name').value = v; };
    document.querySelectorAll('.avatar-opt').forEach(b=>{
      b.onclick = ()=>{ av = b.dataset.av; playSound('tap'); redraw(); };
    });
    document.querySelectorAll('.age-opt').forEach(b=>{
      b.onclick = ()=>{ age = Number(b.dataset.age); playSound('tap'); redraw(); };
    });
    document.querySelectorAll('.gender-opt').forEach(b=>{
      b.onclick = ()=>{ gen = b.dataset.gender; playSound('tap'); redraw(); };
    });
    bindCompanionSelector(document, k=>{ comp = k; redraw(); }, ()=>{ allBuddies = true; redraw(); });
    document.getElementById('pe-save').onclick = ()=>{
      p.name = (document.getElementById('pe-name').value||'').trim().slice(0,12);
      p.avatar = av;
      p.age = age;
      p.gender = gen;
      p.companion = comp;
      saveProfiles();
      if(id === profiles.current){
        state.name = p.name; state.avatar = p.avatar; save();
        renderProfile(); renderLagon();
      }
      playSound('good');
      showToast('Enregistré ✅');
      openPlayers();
    };
    document.getElementById('pe-reset').onclick = ()=>{
      if(!confirm(`Tout recommencer à zéro pour ${p.name || 'ce joueur'} ?\n(pièces, objets, îles et niveau seront perdus)`)) return;
      if(id === profiles.current){
        resetState();
        currentWorld = 'lagon';
        refreshAll();
      } else {
        try{ localStorage.removeItem(profileSaveKey(id)); }catch(e){}
      }
      playSound('win');
      speak(`Nouvelle aventure pour ${p.name || 'toi'} !`);
      showToast('🔄 Nouvelle aventure !');
      openPlayers();
    };
    const del = document.getElementById('pe-del');
    if(del) del.onclick = ()=>{
      if(!confirm(`Supprimer ${p.name || 'ce joueur'} et toute sa partie ?`)) return;
      deleteProfile(id);
      playSound('tap');
      showToast('Joueur supprimé');
      openPlayers();
    };
    document.getElementById('pe-back').onclick = ()=>{ playSound('tap'); openPlayers(); };
  };
  render();
}

/* --- Choix du mini-jeu --- */
// Nombre de défis proposés à chaque fois (+ le bouton Surprise).
// On ne montre jamais toute la liste : un petit choix à chaque tour,
// pour garder la surprise et faire tourner tous les jeux.
const GAME_PICKER_SIZE = 2;

// Choisit les défis à proposer :
// 1) on ne garde que les types adaptés à l'âge du joueur (programme
//    de maternelle pour les 3-5 ans, tout l'éventail dès 6 ans/CP) ;
// 2) parmi eux, on favorise ceux que CE joueur a le moins essayés (son
//    compteur personnel `state.gameCounts`) : les jeux jamais faits
//    remontent toujours en premier, pour forcer la variété (égalités
//    départagées au hasard).
function pickPickerChoices(n){
  const allowed = new Set(gameTypesForAge(typeof currentPlayerAge==='function' ? currentPlayerAge() : null));
  const pool = GAME_LIST.filter(g=>allowed.has(g.key));
  const withCount = shuffle(pool.length ? pool : GAME_LIST).map(g=>({ g, c: gameCount(g.key) }));
  withCount.sort((a,b)=>a.c-b.c);
  const choices = withCount.slice(0, n).map(x=>x.g);
  // une île peut avoir « son » mini-jeu (WORLDS[id].game) : il est toujours
  // proposé quand on y joue (s'il convient à l'âge du joueur)
  const own = typeof currentWorld!=='undefined' && WORLDS[currentWorld] && WORLDS[currentWorld].game;
  const ownGame = own && pool.find(g=>g.key===own);
  if(ownGame && !choices.includes(ownGame)) choices[0] = ownGame;
  return choices;
}

function openGamePicker(charId){
  if(charId) currentChar = charId;
  const who = party.active ? (partyCurrent() || currentProfile()) : currentProfile();
  const choices = pickPickerChoices(Math.min(GAME_PICKER_SIZE, GAME_LIST.length));
  openModal(`
    ${gameHeader('🎮 Choisis ton jeu', party.active ? `${who.avatar} ${who.name || 'À toi'} choisit !` : 'À quoi veux-tu jouer ?')}
    <div class="game-picker">
      ${choices.map(g=>`<button class="game-choice" data-game="${g.key}">
        <span class="emoji">${g.emoji}</span><span class="nm">${g.name}</span>
      </button>`).join('')}
      <button class="game-choice surprise" data-game="random">
        <span class="emoji">🎲</span><span class="nm">Surprise</span>
      </button>
    </div>
  `);
  bindQuit();
  document.querySelectorAll('[data-game]').forEach(b=>{
    b.onclick = ()=>{
      playSound('tap');
      const k = b.dataset.game;
      if(k==='random') startMinigame();
      else playGame(k);
    };
  });
}
