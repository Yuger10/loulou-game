/* ---------- Décorations de saison : Halloween, Noël, anniversaire (Phase 4) ----------
   Le jeu se met aux couleurs du moment, tout seul :
   - Halloween du 20 octobre au 2 novembre, Noël du 1er décembre au 6 janvier ;
   - l'anniversaire de l'enfant (jour et mois réglés dans ses réglages), qui
     passe avant les autres ce jour-là.
   Pendant une saison :
   - l'île est décorée (sapin et bonhomme de neige, citrouilles et chauves-
     souris, ballons, guirlande et gâteau) ;
   - de la neige, des feuilles ou des ballons passent à l'écran (jamais si
     l'appareil demande moins d'animations) ;
   - les compagnons portent le chapeau de la saison (bonnet de Noël, chapeau
     de sorcière, chapeau de fête), sauf si l'avatar porte déjà un chapeau ;
   - l'écran titre souhaite la fête ;
   - une fois par saison, chaque enfant reçoit un cadeau : le chapeau de la
     saison pour son avatar (gardé ensuite) et quelques pièces.
   Aperçu pour les adultes (espace parents, ou ?saison=noel dans l'adresse) :
   il dure jusqu'à la fermeture du jeu et ne donne aucun cadeau. */

const FETES = {
  halloween:    { name:'Halloween',    emoji:'🎃', from:[10,20], to:[11,2], hat:'sorciere',    gift:10, fx:'feuilles', hatGift:'un chapeau de sorcière',
                  greet:(who)=>`Joyeux Halloween${who ? ' ' + who : ''} !` },
  noel:         { name:'Noël',         emoji:'🎄', from:[12,1],  to:[1,6],  hat:'bonnet_noel', gift:10, fx:'neige', hatGift:'un bonnet de Noël',
                  greet:(who)=>`Joyeux Noël${who ? ' ' + who : ''} !` },
  anniversaire: { name:'Anniversaire', emoji:'🎂',                          hat:'fete',        gift:20, fx:'ballons', hatGift:'un chapeau de fête',
                  greet:(who)=>`Joyeux anniversaire${who ? ' ' + who : ''} !` },
};
const SEASON_PREVIEW_KEY = 'lagon-magique-saison';   // sessionStorage : aperçu choisi par un adulte
const SEASON_NONE = 'aucune';                         // aperçu « pas de saison » (tests, comparaison)

function seasonMMDD(d){ return `${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; }
function inSeasonRange(d, from, to){
  const md = (d.getMonth()+1)*100 + d.getDate();
  const a = from[0]*100 + from[1], b = to[0]*100 + to[1];
  return a <= b ? (md >= a && md <= b) : (md >= a || md <= b);
}
function seasonPreview(){ try{ return sessionStorage.getItem(SEASON_PREVIEW_KEY) || null; }catch(e){ return null; } }
function setSeasonPreview(id){
  try{ if(id) sessionStorage.setItem(SEASON_PREVIEW_KEY, id); else sessionStorage.removeItem(SEASON_PREVIEW_KEY); }catch(e){}
  applySeason(true);
}
function isBirthday(profile, d){ return !!(profile && profile.birthday && profile.birthday === seasonMMDD(d || new Date())); }
// La saison du moment pour le joueur courant (ou null)
function currentSeason(date){
  const prev = seasonPreview();
  if(prev === SEASON_NONE) return null;
  if(prev && FETES[prev]) return prev;
  const d = date || new Date();
  const p = typeof currentProfile==='function' ? currentProfile() : null;
  if(isBirthday(p, d)) return 'anniversaire';
  return Object.keys(FETES).find(k=>FETES[k].from && inSeasonRange(d, FETES[k].from, FETES[k].to)) || null;
}
// Le chapeau de saison des compagnons (utilisé par companionSVG)
function seasonHat(){ const s = currentSeason(); return s ? FETES[s].hat : null; }

/* ---- ce qui tombe (ou monte) à l'écran ---- */
function seasonFxHTML(kind){
  const n = kind === 'ballons' ? 6 : 16;
  let out = '';
  for(let i=0;i<n;i++){
    const left = (i * 61 + 7) % 100;                   // réparti, sans hasard (pas de saut au rendu)
    const dur = kind === 'ballons' ? 14 + (i % 4) * 3 : 9 + (i % 5) * 2.2;
    const delay = -((i * 3.7) % dur);
    const size = kind === 'neige' ? 5 + (i % 4) * 2 : kind === 'feuilles' ? 10 + (i % 3) * 3 : 14 + (i % 3) * 4;
    out += `<span class="sfx sfx-${kind} v${i % 4}" style="left:${left}%; --dur:${dur}s; --delay:${delay}s; --size:${size}px;"></span>`;
  }
  return out;
}
let appliedSeason;   // dernière saison appliquée (évite de tout redessiner)
function applySeason(force){
  const s = currentSeason();
  if(!force && s === appliedSeason) return;
  appliedSeason = s;
  if(s) document.body.dataset.season = s; else delete document.body.dataset.season;
  const fx = s ? seasonFxHTML(FETES[s].fx) : '';
  let layer = document.getElementById('season-fx');
  if(!layer){ layer = document.createElement('div'); layer.id = 'season-fx'; layer.setAttribute('aria-hidden','true'); document.body.appendChild(layer); }
  layer.innerHTML = fx;
  const sp = document.getElementById('splash');
  if(sp){
    let sl = sp.querySelector('.season-fx');
    if(!sl){ sl = document.createElement('div'); sl.className = 'season-fx'; sl.setAttribute('aria-hidden','true'); sp.appendChild(sl); }
    sl.innerHTML = fx;
  }
  // les dessins qui dépendent de la saison (île, compagnons, avatar)
  if(force){
    if(typeof renderLagon==='function'){ try{ renderLagon(); }catch(e){} }
    if(typeof renderProfile==='function'){ try{ renderProfile(); }catch(e){} }
  }
}

/* ---- décor de l'île (repère du paysage : 480 × 360) ---- */
function seasonSceneSVG(id){
  if(id === 'noel') return `<g class="ss ss-noel">
      <g fill="#fff" opacity=".9"><ellipse cx="40" cy="358" rx="96" ry="14"/><ellipse cx="250" cy="362" rx="150" ry="14"/><ellipse cx="452" cy="356" rx="90" ry="14"/></g>
      <g transform="translate(300 216) scale(.72) translate(-400 -262)">
      <rect x="393" y="244" width="14" height="18" rx="3" fill="#8A5A2B"/>
      <path d="M400 146 L428 186 L416 186 L440 220 L426 220 L452 252 L348 252 L374 220 L360 220 L384 186 L372 186 Z" fill="#2E8B57" stroke="#1F6B42" stroke-width="3" stroke-linejoin="round"/>
      <path d="M382 198 Q400 208 420 196 M368 232 Q400 246 434 230" fill="none" stroke="#FFD54A" stroke-width="3" stroke-linecap="round"/>
      <g stroke="#fff" stroke-width="1.2"><circle cx="392" cy="182" r="4.5" fill="#E5484D"/><circle cx="412" cy="210" r="4.5" fill="#5AB0F2"/><circle cx="384" cy="222" r="4.5" fill="#FFD54A"/><circle cx="420" cy="238" r="4.5" fill="#E5484D"/><circle cx="376" cy="244" r="4" fill="#5AB0F2"/><circle cx="402" cy="168" r="3.6" fill="#FFD54A"/></g>
      <path d="M400 128 L404.6 139.5 L417 140.2 L407.5 148 L410.6 160 L400 153.4 L389.4 160 L392.5 148 L383 140.2 L395.4 139.5 Z" fill="#FFD54A" stroke="#E0A92A" stroke-width="2" stroke-linejoin="round"/>
      <rect x="352" y="244" width="22" height="18" rx="3" fill="#E5484D" stroke="#A82E33" stroke-width="2"/><path d="M363 244 V262 M352 252 H374" stroke="#FFD54A" stroke-width="3"/>
      <rect x="426" y="246" width="20" height="16" rx="3" fill="#5AB0F2" stroke="#2F7FC0" stroke-width="2"/><path d="M436 246 V262 M426 254 H446" stroke="#fff" stroke-width="3"/>
      </g>
      <g class="ss-snowman" transform="translate(190 226) scale(.62) translate(-70 -327)">
        <circle cx="70" cy="304" r="23" fill="#fff" stroke="#DCE3EA" stroke-width="2"/>
        <circle cx="70" cy="270" r="16" fill="#fff" stroke="#DCE3EA" stroke-width="2"/>
        <circle cx="64" cy="266" r="2.4" fill="#123B4F"/><circle cx="76" cy="266" r="2.4" fill="#123B4F"/>
        <path d="M70 271 L83 274 L70 276 Z" fill="#FF8A3D"/>
        <path d="M54 284 Q70 292 86 284 L86 290 Q70 298 54 290 Z" fill="#E5484D"/><path d="M80 288 L84 304 L77 304 Z" fill="#E5484D"/>
        <circle cx="70" cy="300" r="2.4" fill="#123B4F"/><circle cx="70" cy="310" r="2.4" fill="#123B4F"/>
        <rect x="58" y="246" width="24" height="9" rx="2" fill="#123B4F"/><rect x="62" y="232" width="16" height="16" rx="2" fill="#123B4F"/>
      </g>
    </g>`;
  if(id === 'halloween'){
    const pumpkin = (x, y, s)=> `<g transform="translate(${x} ${y}) scale(${s})">
        <path d="M0 -20 C0 -27 4 -31 9 -31" stroke="#3F8F4E" stroke-width="4" fill="none" stroke-linecap="round"/>
        <ellipse rx="27" ry="21" fill="#FF8A3D" stroke="#C25E1E" stroke-width="2.5"/>
        <path d="M-10 -20 C-14 -7 -14 7 -10 20 M10 -20 C14 -7 14 7 10 20" stroke="#C25E1E" stroke-width="2" fill="none"/>
        <path d="M-14 -5 L-8 -12 L-3 -5 Z M3 -5 L8 -12 L14 -5 Z" fill="#6B3410"/>
        <path d="M-13 4 Q0 15 13 4 Q0 9 -13 4 Z" fill="#6B3410"/></g>`;
    const bat = (x, y, s, cls)=> `<g class="ss-bat ${cls}" transform="translate(${x} ${y}) scale(${s})">
        <path d="M0 0 C-6 -8 -16 -10 -26 -4 C-20 -2 -18 2 -18 6 C-12 2 -6 4 0 8 C6 4 12 2 18 6 C18 2 20 -2 26 -4 C16 -10 6 -8 0 0 Z" fill="#4B3570"/>
        <circle cx="0" cy="1" r="6" fill="#4B3570"/><path d="M-4 -4 L-3 -9 L-1 -5 M4 -4 L3 -9 L1 -5" fill="#4B3570" stroke="#4B3570" stroke-width="1.5"/>
        <circle cx="-2.2" cy="0" r="1.4" fill="#fff"/><circle cx="2.2" cy="0" r="1.4" fill="#fff"/></g>`;
    return `<g class="ss ss-halloween">
      ${pumpkin(192, 222, .62)}${pumpkin(302, 214, .5)}${pumpkin(244, 292, .55)}
      ${bat(130, 66, 1.1, 'b1')}${bat(372, 46, .9, 'b2')}${bat(250, 104, .7, 'b3')}
    </g>`;
  }
  if(id === 'anniversaire'){
    const flags = [];
    for(let i=0;i<12;i++){
      const x = 12 + i*40, y = 18 + Math.sin(i/11*Math.PI)*22;
      const c = ['#FF6FA5','#FFCB4C','#5AB0F2','#5FCB7E'][i%4];
      flags.push(`<path d="M${x} ${y.toFixed(1)} L${x+30} ${(y+2).toFixed(1)} L${x+15} ${(y+26).toFixed(1)} Z" fill="${c}"/>`);
    }
    const balloon = (x, y, c, d)=> `<g class="ss-balloon" style="--d:${d}s"><path d="M${x} ${y+27} C${x-4} ${y+50} ${x+6} ${y+66} 334 214" fill="none" stroke="#7A8A94" stroke-width="1.5"/>
        <ellipse cx="${x}" cy="${y}" rx="18" ry="22" fill="${c}"/><path d="M${x-3} ${y+21} L${x+3} ${y+21} L${x} ${y+27} Z" fill="${c}"/>
        <ellipse cx="${x-6}" cy="${y-8}" rx="4" ry="7" fill="#fff" opacity=".45"/></g>`;
    return `<g class="ss ss-anniv">
      <path d="M0 16 Q240 64 480 16" fill="none" stroke="#7A8A94" stroke-width="2"/>${flags.join('')}
      ${balloon(312, 128, '#FF6FA5', 0)}${balloon(340, 108, '#5AB0F2', .6)}${balloon(366, 134, '#FFCB4C', 1.2)}
      <g transform="translate(192 206) scale(.8)">
        <rect x="-30" y="-6" width="60" height="26" rx="6" fill="#FFB6CF" stroke="#E2679A" stroke-width="2"/>
        <rect x="-22" y="-26" width="44" height="22" rx="6" fill="#FFF3DE" stroke="#E0C08A" stroke-width="2"/>
        <path d="M-30 4 Q-22 10 -15 4 Q-8 10 0 4 Q8 10 15 4 Q22 10 30 4" fill="none" stroke="#fff" stroke-width="3"/>
        <g stroke="#123B4F" stroke-width="1"><rect x="-13" y="-38" width="5" height="13" rx="2" fill="#5AB0F2"/><rect x="-2.5" y="-40" width="5" height="15" rx="2" fill="#FF6FA5"/><rect x="8" y="-38" width="5" height="13" rx="2" fill="#5FCB7E"/></g>
        <g class="ss-flame" fill="#FFCB4C"><ellipse cx="-10.5" cy="-42" rx="2.6" ry="4"/><ellipse cx="0" cy="-44" rx="2.6" ry="4"/><ellipse cx="10.5" cy="-42" rx="2.6" ry="4"/></g>
      </g>
    </g>`;
  }
  return '';
}

/* ---- le cadeau de la saison (une fois par saison et par enfant) ---- */
function seasonGiftKey(id, d){
  d = d || new Date();
  // Noël déborde sur janvier : c'est la saison de l'année de décembre
  const y = (id === 'noel' && d.getMonth() === 0) ? d.getFullYear() - 1 : d.getFullYear();
  return `${id}-${y}`;
}
function seasonGiftDue(){
  const id = currentSeason();
  if(!id || seasonPreview() || !state.name) return null;
  if(typeof party!=='undefined' && party.active) return null;
  return (state.seasonGifts || {})[seasonGiftKey(id)] ? null : id;
}
function giveSeasonGift(id){
  const s = FETES[id];
  state.seasonGifts = Object.assign({}, state.seasonGifts || {}, { [seasonGiftKey(id)]: true });
  if(!(state.wardrobe || []).includes(s.hat)) state.wardrobe = (state.wardrobe || []).concat(s.hat);
  addCoins(s.gift);
  save();
}
function maybeSeasonGift(){
  const id = seasonGiftDue();
  if(!id) return false;
  const s = FETES[id], hat = WARDROBE[s.hat];
  const comp = typeof currentCompanion==='function' ? COMPANIONS[currentCompanion()] : null;
  giveSeasonGift(id);
  const msg = `${s.greet(state.name)} ${comp ? comp.name : 'Ton compagnon'} t'offre ${s.hatGift} pour ton avatar, et ${s.gift} pièces !`;
  const tryLook = Object.assign({}, typeof currentLook==='function' ? currentLook() : {}, { tete: s.hat });
  openModal(`
    <div class="reward-box season-gift">
      ${typeof buddySlot==='function' ? buddySlot('cheer','buddy-big') : ''}
      <h2>${s.emoji} Surprise ${id==='anniversaire' ? "d'anniversaire" : 'de ' + s.name} !</h2>
      <div class="speech">${msg}</div>
      <div class="season-gift-av">${avatarHTML(state.avatar, tryLook)}</div>
    </div>
    <button class="btn-primary" id="sg-wear">Le mettre tout de suite ${s.emoji}</button>
    <button class="btn-ghost" id="sg-ok">Merci !</button>
  `);
  playSound('win');
  if(typeof confetti==='function') confetti();
  speak(msg);
  document.getElementById('sg-wear').onclick = ()=>{ playSound('tap'); if(typeof wearLook==='function') wearLook('tete', s.hat); closeModal(); showToast(`${s.emoji} ${hat.name} !`); };
  document.getElementById('sg-ok').onclick = ()=>{ playSound('tap'); closeModal(); };
  return true;
}

/* ---- au lancement ---- */
// aperçu demandé dans l'adresse (?saison=noel) : lu dès le chargement, car
// l'écran titre s'affiche avant initSeasons
try{
  const q = new URLSearchParams(location.search).get('saison');
  if(q && (FETES[q] || q === SEASON_NONE)) sessionStorage.setItem(SEASON_PREVIEW_KEY, q);
}catch(e){}
function initSeasons(){ applySeason(true); }
