/* ---------- Sac ---------- */
function renderSac(){
  const owned = Object.keys(ALL_ITEMS).filter(k=>countItem(k)>0);
  const el = document.getElementById('sac-content');
  if(owned.length===0){
    el.innerHTML = `<div class="empty-state"><span class="es-art">🎒</span>Ton sac est vide !<br>Va aider Marina, Étincelle ou Luna pour gagner des objets ✨</div>`;
    speak("Ton sac est vide. Va aider un personnage pour gagner des objets !");
    return;
  }
  el.innerHTML = `<div class="sac-grid">
    ${owned.map(k=>{
      const it = ALL_ITEMS[k];
      const say = `${it.name}, ${countItem(k)}`.replace(/"/g,'&quot;');
      return `<button type="button" class="item-card ${CRAFTED[k]?'crafted':''}" data-say="${say}" aria-label="${it.name}, ${countItem(k)}">
        <span class="emoji">${it.emoji}</span><div class="name">${it.name}</div><div class="qty">x${countItem(k)}</div>
      </button>`;
    }).join('')}
  </div>`;
  bindSpeakButtons();
}
document.getElementById('reset-btn').addEventListener('click', ()=>{
  playSound('tap');
  // ouvre les réglages du joueur courant : renommer, recommencer, supprimer
  if(typeof openPlayerSettings==='function'){ openPlayerSettings(profiles.current); return; }
  if(confirm('Tout recommencer à zéro ? (pièces, objets et niveau seront perdus)')){
    resetState();
    renderCoins(); renderBadge(); renderSac(); renderScene(); renderQuests();
    showToast('Nouvelle aventure ! 🌊');
  }
});

/* ---------- Marché ---------- */
let currentTab = 'vendre';
document.querySelectorAll('.tab-btn').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    playSound('tap');
    currentTab = btn.dataset.tab;
    document.querySelectorAll('.tab-btn').forEach(b=>b.classList.toggle('active', b===btn));
    renderMarche();
  });
});

function renderMarche(){
  const el = document.getElementById('marche-content');
  if(currentTab==='vendre') return renderVendre(el);
  if(currentTab==='echanger') return renderEchanger(el);
  if(currentTab==='acheter') return renderAcheter(el);
  return renderFusionner(el);
}

function renderVendre(el){
  const owned = Object.keys(ALL_ITEMS).filter(k=>countItem(k)>0);
  if(owned.length===0){
    el.innerHTML = `<div class="empty-state"><span class="es-art">🏪</span>Tu n'as rien à vendre pour l'instant.<br>Va gagner des objets dans le lagon !</div>`;
    return;
  }
  el.innerHTML = owned.map(k=>{
    const it = ALL_ITEMS[k];
    const say = `${it.name}, ${it.price} pièce${it.price>1?'s':''}`.replace(/"/g,'&quot;');
    return `<div class="market-row">
      <button type="button" class="emoji" data-say="${say}" aria-label="Écouter : ${it.name}">${it.emoji}</button>
      <div class="info"><div class="name">${it.name} x${countItem(k)}</div><div class="sub">🪙 ${it.price} pièce${it.price>1?'s':''}</div></div>
      <button class="btn-small" data-sell="${k}">Vendre</button>
    </div>`;
  }).join('');
  bindSpeakButtons();
  el.querySelectorAll('[data-sell]').forEach(btn=>{
    btn.onclick = ()=>{
      const k = btn.dataset.sell;
      const rowEmoji = btn.closest('.market-row').querySelector('.emoji');
      removeItem(k,1);
      addCoins(ALL_ITEMS[k].price);
      if(typeof gainCoins==='function') gainCoins(ALL_ITEMS[k].price, rowEmoji);
      questProgress('sell', null, 1);
      playSound('coin');
      showToast(`Vendu ! +${ALL_ITEMS[k].price} 🪙`);
      speak(`Vendu ! Tu gagnes ${ALL_ITEMS[k].price} pièces.`);
      renderVendre(el);
    };
  });
}

function renderEchanger(el){
  const owned = Object.keys(ITEMS).filter(k=>countItem(k)>0);
  if(owned.length===0){
    el.innerHTML = `<div class="empty-state"><span class="es-art">🔄</span>Tu n'as pas encore d'objet à échanger.</div>`;
    return;
  }
  el.innerHTML = owned.map(k=>{
    const it = ITEMS[k];
    const say = `${it.name}, contre un objet surprise`.replace(/"/g,'&quot;');
    return `<div class="market-row">
      <button type="button" class="emoji" data-say="${say}" aria-label="Écouter : ${it.name}">${it.emoji}</button>
      <div class="info"><div class="name">${it.name} x${countItem(k)}</div><div class="sub">Contre un autre objet surprise 🎁</div></div>
      <button class="btn-small" data-trade="${k}">Échanger</button>
    </div>`;
  }).join('');
  bindSpeakButtons();
  el.querySelectorAll('[data-trade]').forEach(btn=>{
    btn.onclick = ()=>{
      const k = btn.dataset.trade;
      const others = Object.keys(ITEMS).filter(x=>x!==k);
      const gained = pickRandom(others);
      removeItem(k,1);
      addItem(gained,1); markSeen(gained);
      if(typeof gainItems==='function') gainItems([ITEMS[gained].emoji], btn.closest('.market-row').querySelector('.emoji'));
      questProgress('collect', gained, 1);
      playSound('good');
      showToast(`Échangé contre ${ITEMS[gained].emoji} ${ITEMS[gained].name} !`);
      speak(`Échangé contre ${ITEMS[gained].name} !`);
      renderEchanger(el);
    };
  });
}

function renderAcheter(el){
  el.innerHTML = `<div class="market-wallet">Tu as <span class="mw-coin">🪙</span> <strong>${state.coins}</strong> pièces</div>` +
  Object.entries(ITEMS).map(([k,it])=>{
    const cost = it.price * 2;
    const can = state.coins >= cost;
    const say = `${it.name}, ${cost} pièces`.replace(/"/g,'&quot;');
    return `<div class="market-row">
      <button type="button" class="emoji" data-say="${say}" aria-label="Écouter : ${it.name}">${it.emoji}</button>
      <div class="info"><div class="name">${it.name}</div><div class="sub">🪙 ${cost} pièces</div></div>
      <button class="btn-small" data-buy="${k}" ${can?'':'disabled'}>Acheter</button>
    </div>`;
  }).join('');
  bindSpeakButtons();
  el.querySelectorAll('[data-buy]').forEach(btn=>{
    btn.onclick = ()=>{
      const k = btn.dataset.buy;
      const cost = ITEMS[k].price * 2;
      if(state.coins < cost) return;
      const rowEmoji = btn.closest('.market-row').querySelector('.emoji');
      addCoins(-cost);
      addItem(k,1); markSeen(k);
      // les pièces partent du compteur vers l'objet, puis l'objet file dans le sac
      if(typeof spendCoins==='function'){ spendCoins(cost, rowEmoji); gainItems([ITEMS[k].emoji], rowEmoji, 520); }
      questProgress('collect', k, 1);
      playSound('coin');
      showToast(`${ITEMS[k].emoji} ${ITEMS[k].name} acheté !`);
      speak(`${ITEMS[k].name} acheté !`);
      renderAcheter(el);
    };
  });
}

function renderFusionner(el){
  el.innerHTML = Object.entries(CRAFTED).map(([key,c])=>{
    const need = Object.entries(c.recipe);
    const canCraft = need.every(([ik,qty])=>countItem(ik)>=qty);
    const say = `${c.name}, ${canCraft ? 'tu peux le créer' : 'il manque des objets'}`.replace(/"/g,'&quot;');
    return `<div class="recipe-card ${c.tier===2?'tier2':''}">
      <div class="result">
        <button type="button" class="emoji" data-say="${say}" aria-label="Écouter : ${c.name}">${c.emoji}</button>
        <span>${c.name}</span><span class="price">🪙 ${c.price}</span>
      </div>
      <div class="recipe-ingredients">
        ${need.map(([ik,qty])=>{
          const has = countItem(ik);
          const ok = has>=qty;
          return `<span class="ingredient-pill ${ok?'ok':'ko'}">${ALL_ITEMS[ik].emoji} ${has}/${qty}</span>`;
        }).join('')}
      </div>
      <button class="btn-craft" data-craft="${key}" ${canCraft?'':'disabled'}>${canCraft?'Créer ✨':'Il manque des objets'}</button>
    </div>`;
  }).join('');
  bindSpeakButtons();
  el.querySelectorAll('[data-craft]').forEach(btn=>{
    btn.onclick = ()=>{
      const key = btn.dataset.craft;
      const c = CRAFTED[key];
      Object.entries(c.recipe).forEach(([ik,qty])=> removeItem(ik,qty));
      addItem(key,1); markSeen(key);
      if(typeof gainItems==='function') gainItems([c.emoji], btn.closest('.recipe-card').querySelector('.result .emoji'));
      questProgress('craft', key, 1);
      playSound('win');
      confetti();
      showToast(`${c.emoji} ${c.name} créé !`);
      speak(`${c.name} créé !`);
      renderFusionner(el);
    };
  });
}

