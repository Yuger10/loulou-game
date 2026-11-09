/* ---------- Offrir un objet à un personnage (Phase 4) ----------
   Dans le dialogue d'un personnage : « 🎁 Offrir un objet ». L'enfant
   choisit un objet de son sac ; l'objet s'envole jusqu'au personnage, qui
   remercie (cœurs, petite danse, phrase dite à voix haute).
   - Chaque personnage a 2 objets préférés (💖), choisis parmi les objets
     de SON île qu'il ne donne pas lui-même : il faut aller jouer avec ses
     voisins pour les trouver. Un objet préféré vaut 2 cœurs, un autre 1.
   - L'amitié se voit en cœurs (jusqu'à 5) dans son dialogue ; à 5 cœurs,
     ils deviennent meilleurs amis et le personnage offre une surprise
     (une seule fois).
   - Offrir compte pour la mission du jour « Offre 2 objets à tes amis ».
   Données : state.friends[perso] = points d'amitié ;
             state.friendRewards[perso] = true une fois la surprise donnée. */

const FRIEND_MAX = 5;          // cœurs affichés ; « meilleurs amis » à partir de là
const FRIEND_REWARD = 10;      // pièces offertes par un meilleur ami (une fois)

function giftHash(s){ let h = 0; for(const ch of s) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return h; }
// Les 2 objets préférés d'un personnage (toujours les mêmes)
function favoritesOf(charId){
  const c = CHARACTERS[charId];
  if(!c) return [];
  const world = c.world || 'lagon';
  const pool = Object.keys(ITEMS).filter(k=> (ITEMS[k].world || 'lagon') === world && !(c.loot || []).includes(k));
  if(pool.length <= 2) return pool;
  const h = giftHash(charId);
  const a = pool[h % pool.length];
  const rest = pool.filter(k=>k!==a);
  return [a, rest[(h >>> 3) % rest.length]];
}
function friendPoints(charId){ return (state.friends || {})[charId] || 0; }
function friendHearts(charId){
  const n = Math.min(FRIEND_MAX, friendPoints(charId));
  return `<span class="friend-hearts" aria-label="Amitié : ${n} cœur${n>1?'s':''} sur ${FRIEND_MAX}">${'❤️'.repeat(n)}${'<i>🤍</i>'.repeat(FRIEND_MAX - n)}</span>`;
}
function giftableItems(){
  return Object.keys(state.inventory || {}).filter(k=> countItem(k) > 0 && ALL_ITEMS[k]);
}

// Donne l'objet : met à jour sac, amitié, missions. Renvoie ce qui s'est passé.
function giveGift(charId, key){
  if(!CHARACTERS[charId] || countItem(key) <= 0) return null;
  const fav = favoritesOf(charId).includes(key);
  const before = friendPoints(charId);
  removeItem(key, 1);
  state.friends = Object.assign({}, state.friends || {}, { [charId]: before + (fav ? 2 : 1) });
  let reward = 0;
  if(state.friends[charId] >= FRIEND_MAX && !(state.friendRewards || {})[charId]){
    state.friendRewards = Object.assign({}, state.friendRewards || {}, { [charId]: true });
    reward = FRIEND_REWARD;
    addCoins(reward);
  }
  save();
  questProgress('gift', null, 1);
  return { fav, reward, bestFriends: before < FRIEND_MAX && state.friends[charId] >= FRIEND_MAX };
}

/* ---- le choix de l'objet ---- */
function openGiftPicker(charId){
  const c = CHARACTERS[charId];
  const favs = favoritesOf(charId);
  const keys = giftableItems().sort((a,b)=> (favs.includes(b) - favs.includes(a)) || ALL_ITEMS[a].name.localeCompare(ALL_ITEMS[b].name));
  const favText = favs.map(k=>`${ITEMS[k].emoji} ${ITEMS[k].name}`).join(' et ');
  openModal(`
    <div class="char-header">
      <span class="emoji">${charFace(charId)}</span>
      <h2>🎁 Un cadeau pour ${c.name}</h2>
    </div>
    <p class="gift-likes">💖 ${c.name} adore : <b>${favText}</b></p>
    ${keys.length ? `<div class="gift-grid">
      ${keys.map(k=>{ const it = ALL_ITEMS[k], fav = favs.includes(k);
        return `<button type="button" class="gift-item ${fav?'fav':''}" data-gift="${k}" aria-label="${it.name}${fav?', son préféré':''}, tu en as ${countItem(k)}">
          <span class="gi-emoji">${it.emoji}</span><span class="gi-name">${it.name}</span><span class="gi-count">×${countItem(k)}</span>${fav ? '<span class="gi-fav" aria-hidden="true">💖</span>' : ''}
        </button>`; }).join('')}
    </div>` : `<div class="empty-state"><span class="es-art">🎒</span>Ton sac est vide : joue avec tes amis pour gagner des objets !</div>`}
    <button class="btn-ghost" id="gift-back">Retour</button>
  `);
  speak(keys.length ? `Que veux-tu offrir à ${c.name} ? ${c.name} adore ${favs.map(k=>ITEMS[k].name).join(' et ')}.` : `Ton sac est vide.`);
  document.getElementById('gift-back').onclick = ()=>{ playSound('tap'); emit('nav:dialogue', charId); };
  document.querySelectorAll('[data-gift]').forEach(b=> b.onclick = ()=>{
    const key = b.dataset.gift;
    const from = b.querySelector('.gi-emoji').getBoundingClientRect();
    const res = giveGift(charId, key);
    if(res) showGiftThanks(charId, key, res, from);
  });
}

/* ---- le merci ---- */
function showGiftThanks(charId, key, res, fromRect){
  const c = CHARACTERS[charId], it = ALL_ITEMS[key];
  const who = hello();
  const msg = res.fav
    ? `Oh, ${it.name} ! C'est mon cadeau préféré ! Merci${who ? ' ' + who : ''} !`
    : pickRandom([
        `Un cadeau pour moi ? Merci${who ? ' ' + who : ''}, ça me fait très plaisir !`,
        `Oh, merci${who ? ' ' + who : ''} ! Je vais en prendre grand soin.`,
        `Comme c'est gentil ! Merci${who ? ' ' + who : ''} !`,
      ]);
  const best = res.bestFriends
    ? `Tu es ${ac('mon meilleur ami', 'ma meilleure amie')} !${res.reward ? ` Voici ${res.reward} pièces, pour toi !` : ''}`
    : '';
  openModal(`
    <div class="gift-thanks">
      <div class="gt-stage">
        <span class="emoji gt-face">${charFace(charId)}</span>
        <span class="gt-item" aria-hidden="true">${it.emoji}</span>
        <span class="gt-hearts" aria-hidden="true">${Array.from({length: res.fav ? 9 : 6}, (_,i)=>`<i style="--i:${i}">${res.fav && i%2 ? '💖' : '❤️'}</i>`).join('')}</span>
      </div>
      <h2>${c.name} ${res.fav ? 'adore ton cadeau !' : 'te dit merci !'}</h2>
      ${speechBubble(msg)}
      ${best ? `<div class="speech gift-best">🏅 ${best}</div>` : ''}
      <p class="gt-friend">Amitié avec ${c.name} : ${friendHearts(charId)}</p>
    </div>
    ${giftableItems().length ? '<button class="btn-primary" id="gift-more">🎁 Offrir encore</button>' : ''}
    <button class="btn-ghost" id="gift-play">Jouer avec ${c.name} 🎮</button>
  `);
  bindSpeakButtons();
  playSound(res.fav || res.bestFriends ? 'win' : 'good');
  if(res.bestFriends) confetti();
  if(res.reward) gainCoins(res.reward, document.querySelector('.gt-face'));
  speak(`${msg} ${best}`);
  // l'objet s'envole du sac jusqu'au personnage
  const face = document.querySelector('.gt-face');
  const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(fromRect && face && !reduce){
    const to = face.getBoundingClientRect();
    const fly = document.createElement('span');
    fly.className = 'gift-fly'; fly.textContent = it.emoji;
    fly.style.left = fromRect.left + 'px'; fly.style.top = fromRect.top + 'px';
    document.body.appendChild(fly);
    requestAnimationFrame(()=>{
      fly.style.transform = `translate(${to.left + to.width/2 - fromRect.left - 20}px, ${to.top + to.height*0.55 - fromRect.top - 20}px) scale(1.4)`;
      fly.style.opacity = '0';
    });
    setTimeout(()=> fly.remove(), 800);
  }
  const more = document.getElementById('gift-more');
  if(more) more.onclick = ()=>{ playSound('tap'); openGiftPicker(charId); };
  document.getElementById('gift-play').onclick = ()=>{ playSound('tap'); emit('nav:game-picker', charId); };
}
