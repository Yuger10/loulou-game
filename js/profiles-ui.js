/* ---------- Écran des joueurs, modes de jeu, choix du mini-jeu ---------- */

const GAME_LIST = [
  { key:'memory',   emoji:'🧠', name:'Mémoire',      fn:()=>renderMemory() },
  { key:'count',    emoji:'🔢', name:'Compter',      fn:()=>renderCount() },
  { key:'diff',     emoji:'🔍', name:"L'intruse",    fn:()=>renderDiff() },
  { key:'puzzle',   emoji:'🧩', name:'Les nombres',  fn:()=>renderPuzzle() },
  { key:'sequence', emoji:'🔮', name:'La suite',     fn:()=>renderSequence() },
  { key:'simon',    emoji:'🎵', name:'Les couleurs', fn:()=>renderSimon() },
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
            <span class="emoji">${p.avatar}</span>
            <div class="info">
              <div class="name">${p.name || 'Sans nom'} ${p.id===profiles.current?'<small>(en cours)</small>':''}</div>
              <div class="sub">${playerSummary(p.id)}</div>
            </div>
            <button class="pick-btn ${sel.has(p.id)?'on':''}" data-pick="${p.id}">${sel.has(p.id)?'✅':'⬜️'}</button>
            <button class="btn-small ghost" data-edit="${p.id}">⚙️</button>
          </div>`).join('')}
      </div>
      <button class="btn-craft" id="btn-add-player">➕ Ajouter un joueur</button>
      <div class="mode-row">
        <button class="btn-primary" id="btn-solo">👤 Mode solo</button>
        <button class="btn-primary alt" id="btn-turns">🎲 Chacun son tour</button>
      </div>
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

/* --- Nouveau joueur --- */
function openNewPlayer(){
  let av = pickRandom(AVATARS);
  const render = ()=>{
    openModal(`
      ${gameHeader('➕ Nouveau joueur', 'Choisis un prénom et un avatar')}
      <input id="np-name" class="name-input-modal" type="text" maxlength="12" placeholder="Prénom" autocomplete="off">
      <div class="avatar-grid">
        ${AVATARS.map(a=>`<button class="avatar-opt ${a===av?'sel':''}" data-av="${a}">${a}</button>`).join('')}
      </div>
      <button class="btn-primary" id="np-ok">C'est parti ! 🎮</button>
      <button class="btn-ghost" id="np-cancel">Annuler</button>
    `);
    bindQuit();
    const input = document.getElementById('np-name');
    document.querySelectorAll('.avatar-opt').forEach(b=>{
      b.onclick = ()=>{ av = b.dataset.av; playSound('tap');
        const v = input.value;
        render();
        document.getElementById('np-name').value = v;
      };
    });
    document.getElementById('np-ok').onclick = ()=>{
      const name = (document.getElementById('np-name').value || '').trim().slice(0,12);
      addProfile(name, av);
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
  const render = ()=>{
    openModal(`
      ${gameHeader(`⚙️ ${p.name || 'Joueur'}`, 'Modifier, réinitialiser ou supprimer')}
      <input id="pe-name" class="name-input-modal" type="text" maxlength="12" value="${(p.name||'').replace(/"/g,'&quot;')}" placeholder="Prénom">
      <div class="avatar-grid">
        ${AVATARS.map(a=>`<button class="avatar-opt ${a===av?'sel':''}" data-av="${a}">${a}</button>`).join('')}
      </div>
      <div class="speech" style="font-size:.82rem;">${playerSummary(id)}</div>
      <button class="btn-primary" id="pe-save">Enregistrer ✅</button>
      <button class="btn-craft danger" id="pe-reset">🔄 Recommencer à zéro</button>
      ${profiles.list.length>1 ? `<button class="btn-craft danger" id="pe-del">🗑️ Supprimer ce joueur</button>` : ''}
      <button class="btn-ghost" id="pe-back">Retour</button>
    `);
    bindQuit();
    const input = document.getElementById('pe-name');
    document.querySelectorAll('.avatar-opt').forEach(b=>{
      b.onclick = ()=>{ av = b.dataset.av; playSound('tap');
        const v = input.value; render(); document.getElementById('pe-name').value = v;
      };
    });
    document.getElementById('pe-save').onclick = ()=>{
      p.name = (document.getElementById('pe-name').value||'').trim().slice(0,12);
      p.avatar = av;
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
function openGamePicker(charId){
  if(charId) currentChar = charId;
  const who = party.active ? (partyCurrent() || currentProfile()) : currentProfile();
  openModal(`
    ${gameHeader('🎮 Choisis ton jeu', party.active ? `${who.avatar} ${who.name || 'À toi'} choisit !` : 'À quoi veux-tu jouer ?')}
    <div class="game-picker">
      ${GAME_LIST.map(g=>`<button class="game-choice" data-game="${g.key}">
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
      else (GAME_LIST.find(g=>g.key===k) || GAME_LIST[0]).fn();
    };
  });
}
