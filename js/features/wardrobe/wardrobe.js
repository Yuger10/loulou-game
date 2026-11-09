/* ---------- Garde-robe : habiller son avatar (Phase 4) ----------
   Sac → onglet « 🎩 Mon look ». Chaque enfant habille son avatar :
   - un accessoire sur la tête et un sur le visage, pour TOUS les avatars
     (dessinés ou emoji) ;
   - la couleur de la tenue, pour les personnages dessinés ;
   - la couleur de la cape, pour Zap le super-héros.
   Les objets s'achètent avec les pièces, ou se gagnent en faisant des
   missions (🔒 « encore N missions »). On essaie avant d'acheter.

   Données :
     state.wardrobe = ['noeud', …]   objets achetés (partie de l'enfant)
     state.look     = { tete, visage, tenue, cape }   ce qu'il porte
     profile.look   = copie de state.look, pour dessiner l'avatar des
                      autres joueurs (liste, chacun son tour, course).

   Les accessoires sont dessinés dans un repère « tête » : x de 0 (bord
   gauche du visage) à 100 (bord droit), y de 0 (haut du front) à 100
   (menton), les yeux en (30, 55) et (70, 55). companionSVG le place
   exactement sur les personnages dessinés ; pour un avatar emoji, il est
   superposé à l'emoji (js/features/wardrobe/wardrobe.css, .look-ov). */

const LOOK_SLOTS = [
  { id:'tete',   emoji:'🎩', name:'Tête' },
  { id:'visage', emoji:'👓', name:'Visage' },
  { id:'tenue',  emoji:'👕', name:'Tenue', artOnly:true },
  { id:'cape',   emoji:'🦸', name:'Cape',  heroOnly:true },
];

// price : en pièces ; unlock : gagné automatiquement après N missions
const WARDROBE = {
  noeud:      { slot:'tete',   name:'Nœud',               price:8 },
  casquette:  { slot:'tete',   name:'Casquette',          price:10 },
  bonnet:     { slot:'tete',   name:'Bonnet à pompon',    price:12 },
  chat:       { slot:'tete',   name:'Oreilles de chat',   price:14 },
  fleurs:     { slot:'tete',   name:'Couronne de fleurs', price:16 },
  magicien:   { slot:'tete',   name:'Chapeau de magicien', price:22 },
  tricorne:   { slot:'tete',   name:'Chapeau de pirate',  price:24 },
  couronne:   { slot:'tete',   name:'Couronne dorée',     price:30 },
  antennes:   { slot:'tete',   name:'Antennes rigolotes', unlock:25 },
  etoiles:    { slot:'tete',   name:"Couronne d'étoiles", unlock:60 },
  // offerts une fois par saison (js/features/seasons/seasons.js), puis gardés
  bonnet_noel:{ slot:'tete',   name:'Bonnet de Noël',     season:'noel' },
  sorciere:   { slot:'tete',   name:'Chapeau de sorcière', season:'halloween' },
  fete:       { slot:'tete',   name:'Chapeau de fête',    season:'anniversaire' },

  lunettes:   { slot:'visage', name:'Lunettes rondes',    price:8 },
  moustache:  { slot:'visage', name:'Moustache rigolote', price:10 },
  soleil:     { slot:'visage', name:'Lunettes de soleil', price:12 },
  coeurs:     { slot:'visage', name:'Lunettes cœurs',     price:14 },
  masque:     { slot:'visage', name:'Masque de héros',    price:16 },
  joues:      { slot:'visage', name:'Joues étoilées',     unlock:10 },

  t_rouge:    { slot:'tenue',  name:'Tenue rouge',   price:15, colors:{ outfit:'#E5484D', outfitDark:'#A82E33' } },
  t_vert:     { slot:'tenue',  name:'Tenue verte',   price:15, colors:{ outfit:'#3DBE73', outfitDark:'#23874D' } },
  t_violet:   { slot:'tenue',  name:'Tenue violette', price:15, colors:{ outfit:'#8B5CF6', outfitDark:'#5B3BB0' } },
  t_rose:     { slot:'tenue',  name:'Tenue rose',    price:15, colors:{ outfit:'#FF8FB8', outfitDark:'#D9578A' } },
  t_noir:     { slot:'tenue',  name:'Tenue noire',   price:20, colors:{ outfit:'#3A4150', outfitDark:'#1C212B' } },
  t_or:       { slot:'tenue',  name:'Tenue dorée',   unlock:40, colors:{ outfit:'#FFCB4C', outfitDark:'#C98A14' } },

  c_rouge:    { slot:'cape',   name:'Cape rouge',    price:12, colors:{ cape:'#E5484D', capeDark:'#A82E33' } },
  c_vert:     { slot:'cape',   name:'Cape verte',    price:12, colors:{ cape:'#3DBE73', capeDark:'#23874D' } },
  c_violet:   { slot:'cape',   name:'Cape violette', price:12, colors:{ cape:'#8B5CF6', capeDark:'#5B3BB0' } },
  c_rose:     { slot:'cape',   name:'Cape rose',     price:12, colors:{ cape:'#FF8FB8', capeDark:'#D9578A' } },
  c_noir:     { slot:'cape',   name:'Cape noire',    price:16, colors:{ cape:'#3A4150', capeDark:'#1C212B' } },
  c_or:       { slot:'cape',   name:'Cape dorée',    unlock:40, colors:{ cape:'#FFCB4C', capeDark:'#C98A14' } },
};
const EMPTY_LOOK = { tete:null, visage:null, tenue:null, cape:null };
// Avatars emoji qui sont un VISAGE de face : on peut y poser chapeau et
// lunettes. Les autres (fusée, drapeau, héros en pied…) gardent leur
// dessin ; les personnages dessinés, eux, s'habillent entièrement.
const LOOK_FACE_EMOJI = ['👧','👦','🧒','👩‍🦰','👨‍🦰','👩‍🦱','👨‍🦱','🤖','🦁','🐱'];
function lookFits(av){
  return isArtAvatar(av) || LOOK_FACE_EMOJI.includes(av);
}

/* ---- dessin des accessoires (repère « tête ») ---- */
function lookStar(cx, cy, r, fill, stroke){
  const pts = [];
  for(let i=0;i<10;i++){
    const a = -Math.PI/2 + i*Math.PI/5, rr = i%2 ? r*0.45 : r;
    pts.push(`${(cx + rr*Math.cos(a)).toFixed(1)} ${(cy + rr*Math.sin(a)).toFixed(1)}`);
  }
  return `<path d="M${pts.join(' L')} Z" fill="${fill}"${stroke ? ` stroke="${stroke}" stroke-width="2" stroke-linejoin="round"` : ''}/>`;
}
const LOOK_ART = {
  noeud: ()=> `<g transform="translate(80 -6) rotate(18)">
      <path d="M0 0 C-10 -15 -27 -11 -25 2 C-23 15 -8 10 0 0Z" fill="#FF6FA5" stroke="#D94A86" stroke-width="2.5" stroke-linejoin="round"/>
      <path d="M0 0 C10 -15 27 -11 25 2 C23 15 8 10 0 0Z" fill="#FF6FA5" stroke="#D94A86" stroke-width="2.5" stroke-linejoin="round"/>
      <circle r="6.5" fill="#E84D8A" stroke="#D94A86" stroke-width="2"/>
      <path d="M-18 -4 C-14 -7 -9 -6 -6 -3" stroke="#fff" stroke-width="2.4" fill="none" opacity=".7" stroke-linecap="round"/></g>`,
  casquette: ()=> `<path d="M-2 14 C-2 -12 22 -26 50 -26 C78 -26 102 -12 102 14 Z" fill="#3A7BD5"/>
      <path d="M50 -25 L50 13" stroke="#24427A" stroke-width="2" opacity=".5"/><circle cx="50" cy="-25" r="4.5" fill="#24427A"/>
      <path d="M-6 14 C20 7 80 7 106 14 C110 21 105 27 97 27 C70 22 30 22 3 27 C-5 27 -10 21 -6 14Z" fill="#24427A"/>
      <path d="M18 -8 C26 -17 37 -21 45 -21" stroke="#fff" stroke-width="3.2" fill="none" opacity=".45" stroke-linecap="round"/>`,
  bonnet: ()=> `<path d="M-2 18 C-4 -14 22 -32 50 -32 C78 -32 104 -14 102 18 Z" fill="#F46B5D"/>
      <path d="M22 -22 L23 12 M41 -30 L41 12 M59 -30 L59 12 M78 -22 L77 12" stroke="#D9503F" stroke-width="3" opacity=".55"/>
      <rect x="-6" y="7" width="112" height="17" rx="8.5" fill="#fff" stroke="#DCE3EA" stroke-width="2"/>
      <circle cx="50" cy="-36" r="12" fill="#fff" stroke="#DCE3EA" stroke-width="2"/>`,
  chat: ()=> `<path d="M0 18 C4 -12 26 -24 50 -24 C74 -24 96 -12 100 18" fill="none" stroke="#5B3E8F" stroke-width="7" stroke-linecap="round"/>
      <path d="M8 2 L12 -40 L38 -18 Z" fill="#5B3E8F" stroke-linejoin="round"/><path d="M14 -6 L17 -30 L31 -17 Z" fill="#FF8FB8"/>
      <path d="M92 2 L88 -40 L62 -18 Z" fill="#5B3E8F" stroke-linejoin="round"/><path d="M86 -6 L83 -30 L69 -17 Z" fill="#FF8FB8"/>`,
  fleurs: ()=> {
    const f = [[4,6,'#FF8FB8'],[19,-7,'#FFD54A'],[35,-15,'#C9A7F5'],[50,-17,'#FF8FB8'],[65,-15,'#FFD54A'],[81,-7,'#C9A7F5'],[96,6,'#FF8FB8']];
    return `<path d="M0 12 C14 -10 34 -18 50 -18 C66 -18 86 -10 100 12" fill="none" stroke="#5FCB7E" stroke-width="5" stroke-linecap="round"/>`
      + f.map(([x,y,c])=>`<g transform="translate(${x} ${y})"><circle r="8" fill="${c}" stroke="#fff" stroke-width="1.6"/><circle r="3" fill="#fff"/></g>`).join('');
  },
  magicien: ()=> `<path d="M14 4 L58 -66 L88 4 Z" fill="#5B3BB0" stroke="#3E2580" stroke-width="2.5" stroke-linejoin="round"/>
      <path d="M17 -2 C40 2 64 2 86 -2 L84 -9 C62 -5 40 -5 20 -9 Z" fill="#FFCB4C"/>
      <ellipse cx="50" cy="5" rx="54" ry="10" fill="#3E2580"/>
      ${lookStar(46,-28,7,'#FFD54A')}${lookStar(62,-46,5,'#FFD54A')}<circle cx="38" cy="-46" r="2.4" fill="#fff"/><circle cx="66" cy="-22" r="2" fill="#fff"/>`,
  tricorne: ()=> `<path d="M-10 10 C8 -4 28 -32 50 -32 C72 -32 92 -4 110 10 C92 3 70 1 50 1 C30 1 8 3 -10 10Z" fill="#2B2140"/>
      <path d="M-10 10 C8 3 30 1 50 1 C70 1 92 3 110 10" fill="none" stroke="#FFCB4C" stroke-width="3"/>
      <circle cx="50" cy="-15" r="7.5" fill="#fff"/><rect x="45.5" y="-11" width="9" height="6" rx="2" fill="#fff"/>
      <circle cx="47.3" cy="-16" r="2" fill="#2B2140"/><circle cx="52.7" cy="-16" r="2" fill="#2B2140"/>`,
  couronne: ()=> `<path d="M12 6 L15 -32 L32 -13 L50 -42 L68 -13 L85 -32 L88 6 Z" fill="#FFCB4C" stroke="#D99A22" stroke-width="3" stroke-linejoin="round"/>
      <rect x="12" y="-3" width="76" height="9" rx="3" fill="#F2B632"/>
      <circle cx="50" cy="-15" r="5.5" fill="#F46B5D" stroke="#fff" stroke-width="1.6"/><circle cx="30" cy="-6" r="3.8" fill="#5AB0F2"/><circle cx="70" cy="-6" r="3.8" fill="#5AB0F2"/>
      <circle cx="15" cy="-33" r="3.4" fill="#FFE38A"/><circle cx="50" cy="-43" r="4" fill="#FFE38A"/><circle cx="85" cy="-33" r="3.4" fill="#FFE38A"/>`,
  antennes: ()=> `<path d="M2 16 C6 -12 26 -22 50 -22 C74 -22 94 -12 98 16" fill="none" stroke="#5FCB7E" stroke-width="7" stroke-linecap="round"/>
      <path d="M32 -20 C28 -34 22 -42 16 -48 M68 -20 C72 -34 78 -42 84 -48" fill="none" stroke="#2B2140" stroke-width="3.5" stroke-linecap="round"/>
      <circle cx="15" cy="-50" r="9" fill="#FFD54A" stroke="#E0A92A" stroke-width="2"/><circle cx="85" cy="-50" r="9" fill="#FF8FB8" stroke="#E2679A" stroke-width="2"/>`,
  bonnet_noel: ()=> `<path d="M-2 12 C2 -12 24 -34 54 -34 C78 -34 98 -20 110 0 C113 6 114 12 112 18 C106 8 98 2 90 0 C94 4 96 8 97 12 Z" fill="#E5484D" stroke="#A82E33" stroke-width="2.5" stroke-linejoin="round"/>
      <path d="M22 -14 C32 -24 44 -28 56 -28" fill="none" stroke="#fff" stroke-width="3.5" opacity=".35" stroke-linecap="round"/>
      <rect x="-8" y="5" width="112" height="18" rx="9" fill="#fff" stroke="#DCE3EA" stroke-width="2"/>
      <circle cx="112" cy="20" r="10" fill="#fff" stroke="#DCE3EA" stroke-width="2"/>`,
  sorciere: ()=> `<path d="M16 4 L46 -56 C50 -64 60 -66 66 -60 C60 -60 56 -56 56 -50 L84 4 Z" fill="#4B3570" stroke="#2A1D44" stroke-width="2.5" stroke-linejoin="round"/>
      <path d="M19 -3 C40 1 62 1 81 -3 L78 -11 C60 -7 40 -7 22 -11 Z" fill="#FF8A3D"/>
      <rect x="43" y="-12" width="13" height="10" rx="2" fill="none" stroke="#FFCB4C" stroke-width="2.5"/>
      <ellipse cx="50" cy="5" rx="58" ry="10" fill="#2A1D44"/>
      ${lookStar(66,-30,5,'#FFD54A')}`,
  fete: ()=> `<g transform="rotate(10 50 6)"><path d="M24 8 L50 -54 L76 8 Z" fill="#5AB0F2" stroke="#2F7FC0" stroke-width="2.5" stroke-linejoin="round"/>
      <path d="M33 -14 L42 -10 L46 -26 M58 -30 L62 -14 L70 -8" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="40" cy="-2" r="3.2" fill="#FFCB4C"/><circle cx="58" cy="-6" r="3.2" fill="#FF6FA5"/><circle cx="50" cy="-34" r="3" fill="#FFCB4C"/>
      <path d="M22 8 Q50 16 78 8" fill="none" stroke="#FF6FA5" stroke-width="5" stroke-linecap="round"/>
      <circle cx="50" cy="-56" r="7.5" fill="#FFCB4C" stroke="#E0A92A" stroke-width="2"/></g>`,
  etoiles: ()=> [[6,4,9],[24,-12,11],[50,-22,14],[76,-12,11],[94,4,9]].map(([x,y,r])=>lookStar(x,y,r,'#FFD54A','#E0A92A')).join('')
      + `<circle cx="37" cy="-30" r="2.6" fill="#fff"/><circle cx="63" cy="-30" r="2.6" fill="#fff"/><circle cx="12" cy="-14" r="2" fill="#fff"/><circle cx="88" cy="-14" r="2" fill="#fff"/>`,

  lunettes: ()=> `<g fill="#fff" fill-opacity=".22" stroke="#3A7BD5" stroke-width="4"><circle cx="30" cy="55" r="15"/><circle cx="70" cy="55" r="15"/></g>
      <path d="M45 53 Q50 48 55 53" fill="none" stroke="#3A7BD5" stroke-width="4"/>
      <path d="M15 51 L1 47 M85 51 L99 47" stroke="#3A7BD5" stroke-width="4" stroke-linecap="round"/>`,
  soleil: ()=> `<path d="M11 45 H47 V57 C47 68 39 73 30 73 C19 73 11 66 11 56 Z" fill="#1E2A38"/>
      <path d="M53 45 H89 V56 C89 66 81 73 70 73 C61 73 53 68 53 57 Z" fill="#1E2A38"/>
      <path d="M46 49 Q50 45 54 49" stroke="#1E2A38" stroke-width="4.5" fill="none"/>
      <path d="M11 47 L0 43 M89 47 L100 43" stroke="#1E2A38" stroke-width="4.5" stroke-linecap="round"/>
      <path d="M17 51 L27 51 M59 51 L69 51" stroke="#fff" stroke-width="3.2" opacity=".55" stroke-linecap="round"/>`,
  coeurs: ()=> {
    const h = (x)=> `<path transform="translate(${x} 56) scale(1.45)" d="M0 7 C-15 -3 -11 -16 0 -8 C11 -16 15 -3 0 7Z" fill="#FF5F8F" fill-opacity=".9" stroke="#D63C6E" stroke-width="2.2" stroke-linejoin="round"/>`;
    return h(30) + h(70) + `<path d="M46 52 Q50 48 54 52" stroke="#D63C6E" stroke-width="3.5" fill="none"/>
      <path d="M12 50 L1 46 M88 50 L99 46" stroke="#D63C6E" stroke-width="3.5" stroke-linecap="round"/>`;
  },
  // même découpe que le masque de Zap (repère du compagnon → repère « tête »)
  masque: ()=> `<g transform="scale(1.5152 1.5873) translate(-27 -26.5)"><path fill-rule="evenodd" fill="#E5484D" d="M26 55 C32 47 50 48 60 53 C70 48 88 47 94 55 C95 63 91 71 83 73 C74 75 66 71 60 67 C54 71 46 75 37 73 C29 71 25 63 26 55Z M37.5 61 a9.5 10 0 1 0 19 0 a9.5 10 0 1 0 -19 0Z M63.5 61 a9.5 10 0 1 0 19 0 a9.5 10 0 1 0 -19 0Z"/>
      <path d="M29 56 C34 51 44 50 52 52" fill="none" stroke="#FF8A8E" stroke-width="2" stroke-linecap="round"/></g>`,
  moustache: ()=> `<path d="M50 65 C44 58 34 58 30 64 C26 70 17 70 13 63 C14 75 29 78 38 71 C44 68 48 68 50 67 C52 68 56 68 62 71 C71 78 86 75 87 63 C83 70 74 70 70 64 C66 58 56 58 50 65Z" fill="#5A321C"/>`,
  joues: ()=> lookStar(13,72,8,'#FFD54A','#E0A92A') + lookStar(87,72,8,'#FFD54A','#E0A92A') + `<circle cx="22" cy="64" r="2" fill="#fff"/><circle cx="78" cy="64" r="2" fill="#fff"/>`,
};

// Accessoires portés (visage, puis tête par-dessus)
function lookAccessoriesSVG(look){
  if(!look) return '';
  return ['visage','tete'].map(s=>{
    const id = look[s], art = id && WARDROBE[id] && LOOK_ART[id];
    return art ? art() : '';
  }).join('');
}
// Couleurs de la tenue et de la cape (personnages dessinés)
function lookColors(look){
  const out = {};
  ['tenue','cape'].forEach(s=>{ const it = look && look[s] && WARDROBE[look[s]]; if(it && it.colors) Object.assign(out, it.colors); });
  return out;
}

/* ---- ce que l'enfant possède et porte ---- */
function currentLook(){ return Object.assign({}, EMPTY_LOOK, state.look || {}); }
function ownsLookItem(id){
  const it = WARDROBE[id];
  if(!it) return false;
  if(it.unlock) return (state.missions || 0) >= it.unlock;
  return (state.wardrobe || []).includes(id);
}
function lookSlotsFor(av){
  if(!lookFits(av)) return [];
  const art = isArtAvatar(av);
  const hero = art && COMPANIONS[av.slice(4)].style === 'hero';
  return LOOK_SLOTS.filter(s=> (!s.artOnly || art) && (!s.heroOnly || hero));
}
function wearLook(slot, id){
  state.look = Object.assign(currentLook(), { [slot]: id || null });
  save();
  refreshLookEverywhere();
}
function buyLookItem(id){
  const it = WARDROBE[id];
  if(!it || ownsLookItem(id) || !it.price || state.coins < it.price) return false;
  addCoins(-it.price);
  state.wardrobe = (state.wardrobe || []).concat(id);
  wearLook(it.slot, id);
  return true;
}
// objets gagnés à cette mission (appelé après state.missions += 1)
function newlyUnlockedLookItems(){
  return Object.keys(WARDROBE).filter(k=> WARDROBE[k].unlock && WARDROBE[k].unlock === state.missions);
}
function refreshLookEverywhere(){
  syncProfileFromState();
  emit('ui:profile');
  if(document.getElementById('island-map')) emit('ui:map');
}

/* ---- l'onglet « Mon look » du sac ---- */
let lookTry = null;   // objet essayé, pas encore acheté : { slot, id }
function clearLookTry(){ lookTry = null; }
let lookSlot = 'tete';
function lookStatusText(id){
  const it = WARDROBE[id];
  if(ownsLookItem(id)) return '';
  if(it.season) return `${FETES[it.season].emoji} ${FETES[it.season].name}`;
  if(it.unlock) return `🔒 ${it.unlock} missions`;
  return `🪙 ${it.price}`;
}
function renderLook(){
  const el = document.getElementById('look-content');
  if(!el) return;
  const av = state.avatar;
  const worn = currentLook();
  const slots = lookSlotsFor(av);
  if(lookSlot!=='avatar' && !slots.some(s=>s.id===lookSlot)) lookSlot = slots.length ? 'tete' : 'avatar';
  const preview = Object.assign({}, worn, lookTry ? { [lookTry.slot]: lookTry.id } : {});
  const tryItem = lookTry && WARDROBE[lookTry.id];
  let action = '';
  if(tryItem){
    if(tryItem.season){
      const se = FETES[tryItem.season];
      action = `<p class="look-msg">${se.emoji} ${tryItem.name} : un cadeau ${tryItem.season==='anniversaire' ? "le jour de ton anniversaire" : 'à ' + se.name}</p>`;
    } else if(tryItem.unlock){
      const left = tryItem.unlock - (state.missions || 0);
      action = `<p class="look-msg">🔒 Encore <b>${left}</b> mission${left>1?'s':''} pour gagner : ${tryItem.name}</p>`;
    } else if(state.coins >= tryItem.price){
      action = `<button class="btn-primary look-buy" id="look-buy">Acheter : ${tryItem.name} · 🪙 ${tryItem.price}</button>`;
    } else {
      const miss = tryItem.price - state.coins;
      action = `<p class="look-msg">Il te manque <b>${miss}</b> pièce${miss>1?'s':''} pour : ${tryItem.name} 🪙 ${tryItem.price}</p>`;
    }
  }
  const items = Object.keys(WARDROBE).filter(k=>WARDROBE[k].slot===lookSlot);
  const tile = (id)=>{
    const it = id ? WARDROBE[id] : null;
    const on = (worn[lookSlot] || null) === id && !(lookTry && lookTry.slot===lookSlot);
    const trying = lookTry && lookTry.id === id;
    const owned = !id || ownsLookItem(id);
    const lk = Object.assign({}, worn, { [lookSlot]: id });
    const label = it ? `${it.name}${owned ? '' : it.season ? ', un cadeau de saison' : it.unlock ? `, à gagner après ${it.unlock} missions` : `, ${it.price} pièces`}` : 'Rien';
    return `<button type="button" class="look-tile ${on?'on':''} ${trying?'trying':''} ${owned?'':'locked'}" data-look="${id||''}" aria-pressed="${on}" aria-label="${label}">
      <span class="lt-av">${avatarHTML(av, lk)}</span>
      <span class="lt-name">${it ? it.name : 'Rien'}</span>
      ${owned ? (on ? '<span class="lt-tag on">✓</span>' : '') : `<span class="lt-tag">${lookStatusText(id)}</span>`}
    </button>`;
  };
  el.innerHTML = `
    <div class="look-stage">
      <div class="look-preview">${avatarHTML(av, preview)}</div>
      <div class="look-side">
        <div class="look-name">${state.name || 'Mon avatar'}</div>
        <div class="market-wallet">Tu as <span class="mw-coin">🪙</span> <strong>${state.coins}</strong> pièces</div>
      </div>
    </div>
    <div class="look-action">${action}</div>
    <div class="look-tabs" role="tablist">
      ${slots.map(s=>`<button type="button" role="tab" class="look-tab ${s.id===lookSlot?'on':''}" aria-selected="${s.id===lookSlot}" data-lslot="${s.id}">${s.emoji} ${s.name}</button>`).join('')}
      <button type="button" role="tab" class="look-tab ${lookSlot==='avatar'?'on':''}" aria-selected="${lookSlot==='avatar'}" data-lslot="avatar">🙂 Personnage</button>
    </div>
    ${lookSlot==='avatar' ? `
      <p class="look-hint">${slots.length ? 'Les personnages dessinés peuvent aussi changer de tenue ✨' : 'Pour habiller ton avatar, choisis un visage ou un personnage dessiné ✨'}</p>
      <div class="look-grid avatars">${AVATARS.map(a=>`<button type="button" class="look-tile av-pick ${a===av?'on':''}" data-av="${a}" aria-label="${avatarText(a)}"><span class="lt-av">${avatarHTML(a, worn)}</span></button>`).join('')}</div>`
    : `<div class="look-grid">${tile(null)}${items.map(tile).join('')}</div>`}
  `;
  el.querySelectorAll('[data-lslot]').forEach(b=> b.onclick = ()=>{ playSound('tap'); lookSlot = b.dataset.lslot; lookTry = null; renderLook(); });
  el.querySelectorAll('[data-look]').forEach(b=> b.onclick = ()=>{
    playSound('tap');
    const id = b.dataset.look || null;
    const it = id && WARDROBE[id];
    if(!id || ownsLookItem(id)){
      lookTry = null;
      wearLook(lookSlot, id);
      if(it) speak(it.name);
    } else {
      lookTry = { slot: lookSlot, id };
      speak(it.season ? `${it.name}. Un cadeau de saison.` : it.unlock ? `${it.name}. À gagner après ${it.unlock} missions.` : `${it.name}. ${it.price} pièces.`);
    }
    renderLook();
  });
  el.querySelectorAll('[data-av]').forEach(b=> b.onclick = ()=>{
    playSound('tap');
    state.avatar = b.dataset.av; lookTry = null; save();
    refreshLookEverywhere();
    renderLook();
  });
  const buy = document.getElementById('look-buy');
  if(buy) buy.onclick = ()=>{
    const id = lookTry && lookTry.id;
    const it = id && WARDROBE[id];
    const from = el.querySelector('.look-preview');
    if(!it || !buyLookItem(id)) return;
    lookTry = null;
    spendCoins(it.price, from);
    playSound('coin');
    confetti();
    showToast(`✨ Nouveau look : ${it.name} !`);
    speak(`Super ! ${it.name}, ça te va très bien !`);
    renderLook();
  };
}

// habille compagnons et avatars (js/entities/companion)
setCompanionDressing({ lookColors, lookAccessoriesSVG, lookFits });
