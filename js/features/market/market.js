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
      gainCoins(ALL_ITEMS[k].price, rowEmoji);
      questProgress('sell', null, 1);
      playSound('coin');
      showToast(`Vendu ! +${ALL_ITEMS[k].price} 🪙`);
      speak(`Vendu ! Tu gagnes ${ALL_ITEMS[k].price} pièces.`);
      renderVendre(el);
    };
  });
}

/* ---------- Squishies (v53) : échanger ses doubles, acheter des boîtes ----------
   3 doubles, quels qu'ils soient, donnent 1 squishy manquant au choix (une
   silhouette des séries incomplètes). La boutique vend des boîtes surprises
   « mystère » : 15 pièces, 3 par jour au plus. */
let sqWanted = null;
function squishyTradeHTML(){
  const dupes = squishyDuplicates(), missing = squishyMissing();
  const need = Math.max(0, SQ_TRADE_COST - dupes);
  if(sqWanted && !missing.includes(sqWanted)) sqWanted = null;
  const head = `<h3>🧸 Mes doubles de squishies <span class="sqm-n">${dupes} double${dupes > 1 ? 's' : ''}</span></h3>`;
  if(!missing.length) return `<section class="sq-market">${head}<p class="sqm-msg">Ta collection est complète, bravo ! 🏆 Garde tes doubles, ce sont tes préférés.</p></section>`;
  const label = need ? `Encore ${need} double${need > 1 ? 's' : ''}` : sqWanted ? 'Échanger 3 doubles 🔄' : 'Choisis un squishy';
  return `<section class="sq-market">${head}
    <p class="sqm-msg">${SQ_TRADE_COST} doubles = 1 squishy de ton choix.${need ? '' : ' Lequel veux-tu ?'}</p>
    <div class="sqm-grid">${missing.map(id=> `<button type="button" class="sq-cell missing ${sqWanted === id ? 'selected' : ''}" data-want="${id}" aria-label="Un squishy ${SQUISHY_SERIES[SQUISHIES[id].series].name}">${squishyArtSVG(id, { silhouette:true })}<span class="sq-name">${SQUISHY_SERIES[SQUISHIES[id].series].emoji}</span></button>`).join('')}</div>
    <button type="button" class="btn-craft" id="sqm-trade" ${!need && sqWanted ? '' : 'disabled'}>${label}</button>
  </section>`;
}
function bindSquishyTrade(el, rerender){
  el.querySelectorAll('[data-want]').forEach(b=>{
    b.onclick = ()=>{
      playSound('tap');
      sqWanted = b.dataset.want;
      const need = Math.max(0, SQ_TRADE_COST - squishyDuplicates());
      speak(need ? `Il te faut encore ${need} double${need > 1 ? 's' : ''} pour l'échanger.` : 'Celui-là ? Touche Échanger !');
      rerender();
    };
  });
  const t = el.querySelector('#sqm-trade');
  if(t) t.onclick = ()=>{
    const res = tradeDuplicatesFor(sqWanted);
    if(!res.ok) return;
    sqWanted = null;
    const m = SQUISHIES[res.id];
    playSound('win'); confetti(); vibrate([40, 30, 80]);
    showToast(`🔄 ${m.name} est à toi !`);
    speak(`Échangé ! ${m.say.charAt(0).toUpperCase() + m.say.slice(1)} rejoint ta collection !${res.seriesCompleted ? ` Et la série ${SQUISHY_SERIES[m.series].name} est complète : tu gagnes ${SQ_SERIES_BONUS} pièces !` : ''}`);
    if(res.seriesCompleted) gainCoins(SQ_SERIES_BONUS, t);
    rerender();
  };
}
function squishyShopHTML(){
  const shop = squishyShopState();
  const sub = !shop.left ? 'Reviens demain pour d\'autres boîtes 🌙'
    : `🪙 ${shop.price} pièces · encore ${shop.left} aujourd'hui`;
  const say = (shop.left ? `Boîte surprise de squishies, ${shop.price} pièces` : 'Reviens demain pour d\'autres boîtes').replace(/"/g,'&quot;');
  return `<section class="sq-market sqm-shop">
    <div class="market-row">
      <button type="button" class="emoji sqm-box" data-say="${say}" aria-label="Écouter : boîte surprise">${squishyBoxSVG(null)}</button>
      <div class="info"><div class="name">Boîte surprise de squishies</div><div class="sub">${sub}</div></div>
      <button class="btn-small" id="sqm-buy" ${shop.left && shop.canPay ? '' : 'disabled'}>Acheter</button>
    </div>
    ${squishyBoxCount() ? `<button type="button" class="chip-btn sqm-go" id="sqm-go">🧸 Ouvrir mes boîtes (${squishyBoxCount()})</button>` : ''}
  </section>`;
}
function bindSquishyShop(el, rerender){
  const b = el.querySelector('#sqm-buy');
  if(b) b.onclick = ()=>{
    const res = buySquishyBox();
    if(!res.ok){
      speak(res.reason === 'limit' ? 'Reviens demain pour d\'autres boîtes !' : `Il te faut ${SQ_BOX_PRICE} pièces.`);
      rerender();
      return;
    }
    spendCoins(SQ_BOX_PRICE, el.querySelector('.sqm-box'));
    playSound('coin');
    showToast('🎁 Boîte surprise achetée !');
    speak('Une boîte surprise ! Ouvre-la dans ta chambre à squishies.');
    rerender();
  };
  const go = el.querySelector('#sqm-go');
  if(go) go.onclick = ()=>{ playSound('tap'); openSquishyRoom('collection'); };
}

function renderEchanger(el){
  const owned = Object.keys(ITEMS).filter(k=>countItem(k)>0);
  const sqPart = squishyTradeHTML();
  if(owned.length===0){
    el.innerHTML = sqPart + `<div class="empty-state"><span class="es-art">🔄</span>Tu n'as pas encore d'objet à échanger.</div>`;
    bindSquishyTrade(el, ()=> renderEchanger(el));
    return;
  }
  el.innerHTML = sqPart + owned.map(k=>{
    const it = ITEMS[k];
    const say = `${it.name}, contre un objet surprise`.replace(/"/g,'&quot;');
    return `<div class="market-row">
      <button type="button" class="emoji" data-say="${say}" aria-label="Écouter : ${it.name}">${it.emoji}</button>
      <div class="info"><div class="name">${it.name} x${countItem(k)}</div><div class="sub">Contre un autre objet surprise 🎁</div></div>
      <button class="btn-small" data-trade="${k}">Échanger</button>
    </div>`;
  }).join('');
  bindSpeakButtons();
  bindSquishyTrade(el, ()=> renderEchanger(el));
  el.querySelectorAll('[data-trade]').forEach(btn=>{
    btn.onclick = ()=>{
      const k = btn.dataset.trade;
      const others = Object.keys(ITEMS).filter(x=>x!==k);
      const gained = pickRandom(others);
      removeItem(k,1);
      addItem(gained,1); markSeen(gained);
      gainItems([ITEMS[gained].emoji], btn.closest('.market-row').querySelector('.emoji'));
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
  squishyShopHTML() +
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
  bindSquishyShop(el, ()=> renderAcheter(el));
  el.querySelectorAll('[data-buy]').forEach(btn=>{
    btn.onclick = ()=>{
      const k = btn.dataset.buy;
      const cost = ITEMS[k].price * 2;
      if(state.coins < cost) return;
      const rowEmoji = btn.closest('.market-row').querySelector('.emoji');
      addCoins(-cost);
      addItem(k,1); markSeen(k);
      // les pièces partent du compteur vers l'objet, puis l'objet file dans le sac
      { spendCoins(cost, rowEmoji); gainItems([ITEMS[k].emoji], rowEmoji, 520); }
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
      gainItems([c.emoji], btn.closest('.recipe-card').querySelector('.result .emoji'));
      questProgress('craft', key, 1);
      playSound('win');
      confetti();
      showToast(`${c.emoji} ${c.name} créé !`);
      speak(`${c.name} créé !`);
      renderFusionner(el);
    };
  });
}

registerView('marche', ()=> renderMarche());
