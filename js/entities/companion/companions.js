/* ---------- Compagnons ----------
   Le petit personnage qui accompagne chaque joueur : il lit les consignes,
   réagit aux réponses et fête les réussites. Dessinés en SVG (léger,
   net sur tous les écrans, identique sur iOS, Android et ordinateur).

   Par défaut on propose ceux qui correspondent au profil (fille : sirène,
   princesse, fée ; garçon : pirate, chevalier, explorateur), mais l'enfant
   peut toujours choisir n'importe lequel. */

// La garde-robe (« Mon look ») et les fêtes de saison habillent compagnons et
// avatars. Ce sont des features : elles fournissent leurs fonctions ici avec
// setCompanionDressing, l'entité ne les appelle jamais directement.
const companionDressing = { seasonHat:null, lookColors:null, lookAccessoriesSVG:null, lookFits:null };
function setCompanionDressing(part){ Object.assign(companionDressing, part); }

const COMPANIONS = {
  perle:  { name:'Perle',  title:'la sirène',      group:'f', skin:'#FFD9C2', hair:'#FF7FAE', hairDark:'#D9578A', outfit:'#3CC9B5', outfitDark:'#24A493', style:'mermaid' },
  rose:   { name:'Rose',   title:'la princesse',   group:'f', skin:'#FFE0CC', hair:'#F7C04A', hairDark:'#D99A22', outfit:'#FF8FB8', outfitDark:'#E2679A', style:'princess' },
  lili:   { name:'Lili',   title:'la fée',         group:'f', skin:'#E8B48F', hair:'#7A4A2E', hairDark:'#5A321C', outfit:'#7FD8A6', outfitDark:'#4FB57F', style:'fairy' },
  tom:    { name:'Tom',    title:'le pirate',      group:'m', skin:'#F6C9A6', hair:'#7A4426', hairDark:'#56301A', outfit:'#FFFFFF', outfitDark:'#3A7BD5', style:'pirate' },
  leo:    { name:'Léo',    title:'le chevalier',   group:'m', skin:'#C98B62', hair:'#4A2C1A', hairDark:'#2E1A0E', outfit:'#C9D3DE', outfitDark:'#97A6B6', style:'knight' },
  sam:    { name:'Sam',    title:"l'explorateur",  group:'m', skin:'#8D5A3B', hair:'#2B2420', hairDark:'#16110E', outfit:'#D9B26F', outfitDark:'#B38B47', style:'explorer' },
  zap:    { name:'Zap',    title:'le super-héros', group:'m', skin:'#EDB98F', hair:'#4A2C1A', hairDark:'#2E1A0E', outfit:'#3A7BD5', outfitDark:'#24427A', cape:'#FF8A3D', capeDark:'#E0692A', style:'hero' },
};
const COMPANION_ORDER = ['perle','rose','lili','tom','leo','sam','zap'];
const BUDDY_MOODS = ['happy','think','wow','cheer','oops','sleepy'];

const INK = '#2B2140';
const MOUTH = '#8C2F3F';

/* ---- visage : yeux, sourcils, bouche selon l'humeur ---- */
function buddyFace(c, mood){
  const brow = c.hairDark;
  const eye = (x, big)=> `<ellipse cx="${x}" cy="61" rx="${big?6.4:5.4}" ry="${big?8.2:7}" fill="${INK}"/>
      <circle cx="${x+2}" cy="${big?57:57.5}" r="${big?2.6:2.2}" fill="#fff"/><circle cx="${x-2}" cy="64.5" r="1.1" fill="#fff"/>`;
  const shut = (x)=> `<path d="M${x-6} 62 Q${x} 55 ${x+6} 62" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>`;
  const asleep = (x)=> `<path d="M${x-6} 60 Q${x} 65 ${x+6} 60" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>`;
  const browPath = (d)=> `<path d="${d}" fill="none" stroke="${brow}" stroke-width="3" stroke-linecap="round"/>`;
  let eyes, brows, mouth;
  switch(mood){
    case 'wow':
      eyes = eye(47,true) + eye(73,true);
      brows = browPath('M40 45 Q46 41 52 44') + browPath('M68 44 Q74 41 80 45');
      mouth = `<ellipse cx="60" cy="77" rx="4.6" ry="5.6" fill="${MOUTH}"/><ellipse cx="60" cy="80" rx="2.6" ry="1.8" fill="#FF7A8A"/>`;
      break;
    case 'cheer':
      eyes = shut(47) + shut(73);
      brows = browPath('M40 47 Q46 43 52 46') + browPath('M68 46 Q74 43 80 47');
      mouth = `<path d="M49 71 Q60 89 71 71 Z" fill="${MOUTH}"/><path d="M54 79 Q60 85 66 79 Q60 77 54 79 Z" fill="#FF7A8A"/>`;
      break;
    case 'think':
      eyes = `<ellipse cx="47" cy="61" rx="5.4" ry="7" fill="${INK}"/><circle cx="50" cy="57" r="2.2" fill="#fff"/>
              <ellipse cx="73" cy="61" rx="5.4" ry="7" fill="${INK}"/><circle cx="76" cy="57" r="2.2" fill="#fff"/>`;
      brows = browPath('M41 50 Q46 48 52 50') + browPath('M68 46 Q74 42 80 46');
      mouth = `<path d="M55 76 Q61 78 66 74" fill="none" stroke="${MOUTH}" stroke-width="3" stroke-linecap="round"/>`;
      break;
    case 'oops':
      eyes = eye(47) + eye(73);
      brows = browPath('M41 50 Q46 46 52 45') + browPath('M68 45 Q74 46 79 50');
      mouth = `<path d="M53 76 Q56.5 73.5 60 76 Q63.5 78.5 67 75.5" fill="none" stroke="${MOUTH}" stroke-width="3" stroke-linecap="round"/>`;
      break;
    case 'sleepy':
      eyes = asleep(47) + asleep(73);
      brows = browPath('M41 51 Q46 49 52 51') + browPath('M68 51 Q74 49 79 51');
      mouth = `<ellipse cx="60" cy="76" rx="2.6" ry="3" fill="${MOUTH}"/>
               <text x="88" y="34" font-family="Baloo 2, sans-serif" font-weight="800" font-size="13" fill="#fff" stroke="${INK}" stroke-width=".8">z</text>
               <text x="97" y="24" font-family="Baloo 2, sans-serif" font-weight="800" font-size="10" fill="#fff" stroke="${INK}" stroke-width=".7">z</text>`;
      break;
    default: // happy
      eyes = eye(47) + eye(73);
      brows = browPath('M41 49 Q46 46 52 48') + browPath('M68 48 Q74 46 79 49');
      mouth = `<path d="M51 72 Q60 84 69 72 Q60 76 51 72 Z" fill="${MOUTH}"/>`;
  }
  return `<g class="b-brows">${brows}</g><g class="b-eyes">${eyes}</g>
    <ellipse cx="38.5" cy="71" rx="6" ry="3.6" fill="#FF8FA3" opacity=".55"/>
    <ellipse cx="81.5" cy="71" rx="6" ry="3.6" fill="#FF8FA3" opacity=".55"/>
    <g class="b-mouth">${mouth}</g>`;
}

/* ---- cheveux longs (derrière la tête) et frange ---- */
const HAIR_LONG_BACK = 'M25 58 C21 30 40 17 60 17 C80 17 99 30 95 58 C97 74 100 90 98 104 C91 110 82 107 80 98 L40 98 C38 107 29 110 22 104 C20 90 23 74 25 58 Z';
const HAIR_LONG_FRONT = 'M27 58 C25 33 41 21 60 21 C79 21 95 33 93 58 C90 47 83 40 74 38 C70 44 62 46 55 42 C48 46 41 46 37 41 C31 45 28 51 27 58 Z';
const HAIR_SHORT_FRONT = 'M27 56 C25 31 41 20 60 20 C79 20 95 31 93 56 C90 45 84 38 76 37 C72 42 64 43 58 39 C52 43 44 43 40 38 C33 41 29 47 27 56 Z';

// o.noHat : un chapeau de la garde-robe remplace le couvre-chef d'origine ;
// o.noMask : des lunettes ou un masque de la garde-robe remplacent celui de Zap.
function buddyParts(c, o){
  o = o || {};
  const back = [], front = [], hat = [], mask = [];
  let body = `<path d="M22 130 C22 104 38 94 60 94 C82 94 98 104 98 130 Z" fill="${c.outfit}"/>`;
  switch(c.style){
    case 'mermaid':
      back.push(`<path d="${HAIR_LONG_BACK}" fill="${c.hair}"/>`,
        `<path d="M22 104 C18 96 24 90 28 96 M98 104 C102 96 96 90 92 96" fill="none" stroke="${c.hair}" stroke-width="7" stroke-linecap="round"/>`);
      body = `<path d="M22 130 C22 104 38 94 60 94 C82 94 98 104 98 130 Z" fill="${c.outfit}"/>
        <path d="M30 130 C34 118 40 112 46 116 M90 130 C86 118 80 112 74 116" fill="none" stroke="${c.outfitDark}" stroke-width="3" stroke-linecap="round" opacity=".6"/>
        <path d="M44 104 C44 96 56 96 56 104 Z M64 104 C64 96 76 96 76 104 Z" fill="#C9A7F5"/>
        <path d="M50 97 L50 104 M70 97 L70 104" stroke="#A784E6" stroke-width="1.6"/>`;
      front.push(`<path d="${HAIR_LONG_FRONT}" fill="${c.hair}"/>`,
        `<circle cx="34" cy="38" r="3" fill="#fff" opacity=".9"/><circle cx="40" cy="32" r="2" fill="#fff" opacity=".9"/>`);
      hat.push(
        // étoile de mer dans les cheveux
        `<path d="M83 27 L85.6 33 L92 33.4 L87 37.4 L88.8 43.6 L83 40 L77.2 43.6 L79 37.4 L74 33.4 L80.4 33 Z" fill="#FFCB4C" stroke="#E0A92A" stroke-width="1.2" stroke-linejoin="round"/>`);
      break;
    case 'princess':
      back.push(`<path d="${HAIR_LONG_BACK}" fill="${c.hair}"/>`);
      body = `<path d="M22 130 C22 104 38 94 60 94 C82 94 98 104 98 130 Z" fill="${c.outfit}"/>
        <circle cx="30" cy="106" r="11" fill="${c.outfit}"/><circle cx="90" cy="106" r="11" fill="${c.outfit}"/>
        <circle cx="30" cy="106" r="11" fill="none" stroke="${c.outfitDark}" stroke-width="2" opacity=".5"/>
        <circle cx="90" cy="106" r="11" fill="none" stroke="${c.outfitDark}" stroke-width="2" opacity=".5"/>
        <path d="M46 96 Q60 108 74 96" fill="#fff" stroke="#fff" stroke-width="2"/>
        <circle cx="60" cy="108" r="3.4" fill="#5AB0F2" stroke="#fff" stroke-width="1.5"/>`;
      front.push(`<path d="${HAIR_LONG_FRONT}" fill="${c.hair}"/>`);
      hat.push(
        // couronne
        `<path d="M43 26 L46 12 L53 21 L60 8 L67 21 L74 12 L77 26 Z" fill="#FFCB4C" stroke="#D99A22" stroke-width="1.8" stroke-linejoin="round"/>`,
        `<circle cx="60" cy="20" r="2.8" fill="#F46B5D"/><circle cx="48.5" cy="22.5" r="2" fill="#5AB0F2"/><circle cx="71.5" cy="22.5" r="2" fill="#5AB0F2"/>`);
      break;
    case 'fairy':
      back.push(
        `<ellipse cx="22" cy="92" rx="18" ry="24" transform="rotate(-28 22 92)" fill="#BDEBFF" stroke="#8FD3F2" stroke-width="2" opacity=".9"/>`,
        `<ellipse cx="98" cy="92" rx="18" ry="24" transform="rotate(28 98 92)" fill="#BDEBFF" stroke="#8FD3F2" stroke-width="2" opacity=".9"/>`,
        `<path d="M24 60 C20 33 39 19 60 19 C81 19 100 33 96 60 C98 70 96 80 90 84 C86 78 84 72 84 66 L36 66 C36 72 34 78 30 84 C24 80 22 70 24 60 Z" fill="${c.hair}"/>`);
      body = `<path d="M22 130 C22 104 38 94 60 94 C82 94 98 104 98 130 Z" fill="${c.outfit}"/>
        <path d="M42 96 L50 108 L56 97 L60 110 L64 97 L70 108 L78 96 Z" fill="${c.outfitDark}"/>`;
      front.push(`<path d="${HAIR_SHORT_FRONT}" fill="${c.hair}"/>`);
      hat.push(
        // couronne de fleurs
        `<g stroke="#fff" stroke-width="1"><circle cx="38" cy="30" r="5" fill="#FF8FB8"/><circle cx="49" cy="23" r="5" fill="#FFD54A"/><circle cx="60" cy="21" r="5.4" fill="#C9A7F5"/><circle cx="71" cy="23" r="5" fill="#FF8FB8"/><circle cx="82" cy="30" r="5" fill="#FFD54A"/></g>`,
        `<circle cx="38" cy="30" r="1.8" fill="#fff"/><circle cx="49" cy="23" r="1.8" fill="#fff"/><circle cx="60" cy="21" r="2" fill="#fff"/><circle cx="71" cy="23" r="1.8" fill="#fff"/><circle cx="82" cy="30" r="1.8" fill="#fff"/>`);
      break;
    case 'pirate':
      // marinière : rayures qui suivent l'arrondi des épaules (sans clipPath, pour
      // pouvoir afficher plusieurs compagnons sur la même page)
      body = `<path d="M22 130 C22 104 38 94 60 94 C82 94 98 104 98 130 Z" fill="#fff" stroke="#CFDDEA" stroke-width="2"/>
        <path d="M29.5 102 L90.5 102 L93 108 L27 108 Z" fill="${c.outfitDark}"/>
        <path d="M24.2 114 L95.8 114 L96.8 120 L23.2 120 Z" fill="${c.outfitDark}"/>
        <path d="M22.3 126 L97.7 126 L98 130 L22 130 Z" fill="${c.outfitDark}"/>
        <path d="M48 95 L60 106 L72 95" fill="none" stroke="#F46B5D" stroke-width="5" stroke-linejoin="round"/>`;
      front.push(`<path d="${HAIR_SHORT_FRONT}" fill="${c.hair}"/>`,
        // anneau d'oreille
        `<circle cx="28" cy="72" r="3.2" fill="none" stroke="#FFCB4C" stroke-width="2"/>`);
      hat.push(
        // bandana rouge
        `<path d="M27 46 C30 30 44 22 60 22 C76 22 90 30 93 46 C84 40 72 37 60 37 C48 37 36 40 27 46 Z" fill="#F46B5D"/>`,
        `<circle cx="44" cy="31" r="1.6" fill="#fff"/><circle cx="56" cy="27" r="1.6" fill="#fff"/><circle cx="70" cy="28" r="1.6" fill="#fff"/><circle cx="82" cy="34" r="1.6" fill="#fff"/>`,
        `<path d="M92 44 L104 40 L100 50 Z M92 44 L106 52 L96 55 Z" fill="#E0503F"/>`);
      break;
    case 'knight':
      body = `<path d="M22 130 C22 104 38 94 60 94 C82 94 98 104 98 130 Z" fill="${c.outfit}"/>
        <path d="M22 130 C22 112 28 102 36 98 L40 130 Z M98 130 C98 112 92 102 84 98 L80 130 Z" fill="${c.outfitDark}"/>
        <path d="M50 102 L70 102 L70 114 C70 121 60 126 60 126 C60 126 50 121 50 114 Z" fill="#F46B5D" stroke="#FFCB4C" stroke-width="2"/>
        <path d="M60 106 L61.8 110.4 L66.5 110.6 L62.8 113.5 L64 118 L60 115.4 L56 118 L57.2 113.5 L53.5 110.6 L58.2 110.4 Z" fill="#FFCB4C"/>`;
      front.push(`<path d="${HAIR_SHORT_FRONT}" fill="${c.hair}"/>`);
      hat.push(
        // casque à visière relevée + plumet
        `<path d="M24 60 C22 30 40 15 60 15 C80 15 98 30 96 60 L90 60 C90 44 82 36 60 36 C38 36 30 44 30 60 Z" fill="${c.outfit}" stroke="${c.outfitDark}" stroke-width="2"/>`,
        `<path d="M32 40 C38 30 48 27 60 27 C72 27 82 30 88 40" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".7"/>`,
        `<path d="M60 15 C58 6 64 0 72 2 C68 6 70 10 66 14 Z" fill="#F46B5D"/>`,
        `<rect x="56" y="13" width="8" height="5" rx="2" fill="${c.outfitDark}"/>`);
      break;
    case 'hero':
      // Zap : cape orange derrière, combinaison bleue, éclair doré, masque troué (les yeux restent visibles)
      back.push(`<path d="M30 102 C18 110 10 122 6 130 L114 130 C110 122 102 110 90 102Z" fill="${c.cape || '#FF8A3D'}"/>`,
        `<path d="M30 102 C22 110 16 120 13 130 M90 102 C98 110 104 120 107 130" fill="none" stroke="${c.capeDark || '#E0692A'}" stroke-width="2.5"/>`);
      body = `<path d="M22 130 C22 104 38 94 60 94 C82 94 98 104 98 130 Z" fill="${c.outfit}"/>
        <path d="M34 100 L49 95 L44 109Z M86 100 L71 95 L76 109Z" fill="${c.cape || '#FF8A3D'}"/>
        <path d="M63 101 L51 116 L59 116 L55 128 L70 110 L62 110 L66 101Z" fill="#FFD54A" stroke="#B8901A" stroke-width="1.6" stroke-linejoin="round"/>
        <path d="M30 112 Q36 106 40 108" fill="none" stroke="#6FA3EA" stroke-width="3" stroke-linecap="round"/>`;
      front.push(`<path d="M27 52 C25 30 40 19 60 19 C80 19 95 30 93 52 C88 44 82 40 76 39 L73 29 L66 37 L60 25 L54 37 L47 29 L44 39 C38 40 32 44 27 52Z" fill="${c.hair}"/>`);
      mask.push(
        `<path fill-rule="evenodd" fill="${c.outfitDark}" d="M26 55 C32 47 50 48 60 53 C70 48 88 47 94 55 C95 63 91 71 83 73 C74 75 66 71 60 67 C54 71 46 75 37 73 C29 71 25 63 26 55Z M37.5 61 a9.5 10 0 1 0 19 0 a9.5 10 0 1 0 -19 0Z M63.5 61 a9.5 10 0 1 0 19 0 a9.5 10 0 1 0 -19 0Z"/>`,
        `<path d="M29 56 C34 51 44 50 52 52" fill="none" stroke="#5B86C9" stroke-width="2" stroke-linecap="round"/>`,
        `<path d="M93 57 L104 52 L102 60 Z" fill="${c.outfitDark}"/>`);
      break;
    case 'explorer':
      body = `<path d="M22 130 C22 104 38 94 60 94 C82 94 98 104 98 130 Z" fill="${c.outfit}"/>
        <path d="M44 95 L60 110 L76 95" fill="#5FCB7E"/><path d="M60 110 L56 122 L64 122 Z" fill="#4AB067"/>
        <rect x="32" y="112" width="12" height="10" rx="2" fill="${c.outfitDark}"/><rect x="76" y="112" width="12" height="10" rx="2" fill="${c.outfitDark}"/>`;
      if(o.noHat){ front.push(`<path d="${HAIR_SHORT_FRONT}" fill="${c.hair}"/>`); break; }
      front.push(
        // cheveux courts bouclés qui dépassent du chapeau
        `<path d="M27 57 C25 44 31 37 40 37 L80 37 C89 37 95 44 93 57 C90 49 84 45 77 46 C72 43 66 45 60 43 C54 45 48 43 43 46 C36 45 30 49 27 57 Z" fill="${c.hair}"/>`,
        `<g fill="${c.hair}"><circle cx="30.5" cy="48" r="4.6"/><circle cx="89.5" cy="48" r="4.6"/></g>`);
      hat.push(
        // chapeau d'explorateur
        `<ellipse cx="60" cy="38" rx="44" ry="9" fill="${c.outfitDark}"/>`,
        `<path d="M34 38 C34 18 46 10 60 10 C74 10 86 18 86 38 Z" fill="${c.outfit}"/>`,
        `<path d="M34 34 C44 30 76 30 86 34 L86 38 L34 38 Z" fill="#7A4A2E"/>`,
        `<path d="M44 20 C48 15 54 13 60 13" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".5"/>`);
      break;
  }
  return { back: back.join(''), body, front: front.join('') + (o.noHat ? '' : hat.join('')) + (o.noMask ? '' : mask.join('')) };
}

/* SVG complet d'un compagnon. mood ∈ BUDDY_MOODS */
// opts.look : la tenue choisie dans la garde-robe (js/features/wardrobe/wardrobe.js), pour
// l'avatar dessiné du joueur — { tete, visage, tenue }.
function companionSVG(id, mood, opts){
  let look = (opts && opts.look) || null;
  // saison (js/features/seasons/seasons.js) : bonnet de Noël, chapeau de sorcière ou de fête
  const sHat = (!look || !look.tete) && companionDressing.seasonHat ? companionDressing.seasonHat() : null;
  if(sHat) look = Object.assign({}, look || {}, { tete: sHat });
  const base = COMPANIONS[id] || COMPANIONS.perle;
  const c = look && companionDressing.lookColors ? Object.assign({}, base, companionDressing.lookColors(look)) : base;
  const m = BUDDY_MOODS.includes(mood) ? mood : 'happy';
  const p = buddyParts(c, { noHat: !!(look && look.tete), noMask: !!(look && look.visage) });
  const extra = look && companionDressing.lookAccessoriesSVG ? companionDressing.lookAccessoriesSVG(look) : '';
  const label = (opts && opts.label) || `${c.name} ${c.title}`;
  return `<svg class="buddy buddy--${m}" data-buddy="${id}" viewBox="0 0 120 130" role="img" aria-label="${label}">
    <g class="b-body">
      ${p.back}
      ${p.body}
      <rect x="52" y="84" width="16" height="14" rx="5" fill="${c.skin}"/>
      <rect x="52" y="84" width="16" height="6" fill="#000" opacity=".06"/>
    </g>
    <g class="b-head">
      <circle cx="27" cy="62" r="6.5" fill="${c.skin}"/><circle cx="93" cy="62" r="6.5" fill="${c.skin}"/>
      <ellipse cx="60" cy="58" rx="33" ry="31.5" fill="${c.skin}"/>
      ${buddyFace(c, m)}
      ${p.front}
      ${extra ? `<g class="b-look" transform="translate(27 26.5) scale(.66 .63)">${extra}</g>` : ''}
    </g>
  </svg>`;
}

/* ---- quel compagnon pour quel joueur ---- */
function defaultCompanionFor(gender){
  return gender==='m' ? 'tom' : gender==='f' ? 'perle' : 'perle';
}
function companionOf(profile){
  if(!profile) return defaultCompanionFor('');
  return COMPANIONS[profile.companion] ? profile.companion : defaultCompanionFor(profile.gender);
}
// le compagnon du joueur dont c'est le tour (solo, chacun son tour ou course).
// Le joueur courant vient d'entities/player (une couche au-dessus), qui
// branche sa fonction ici (v54).
let companionPlayerSource = ()=> null;
function setCompanionPlayerSource(fn){ companionPlayerSource = fn; }
function currentCompanion(){
  return companionOf(companionPlayerSource());
}
// compagnons proposés en premier selon le profil ; '' = tous
function companionsFor(gender){
  if(gender==='f' || gender==='m') return COMPANION_ORDER.filter(k=>COMPANIONS[k].group===gender);
  return COMPANION_ORDER.slice();
}

/* ---- le compagnon réagit dans la fenêtre de jeu ---- */
let buddyTimer = null;
function buddyReact(mood, holdMs){
  const slots = document.querySelectorAll('#modal-body .buddy-slot');
  if(!slots.length) return;
  const id = currentCompanion();
  slots.forEach(s=>{
    const base = s.dataset.mood || 'happy';
    s.innerHTML = companionSVG(id, mood);
    s.classList.remove('react'); void s.offsetWidth; s.classList.add('react');
    clearTimeout(buddyTimer);
    if(holdMs !== 0){
      buddyTimer = setTimeout(()=>{
        if(!s.isConnected) return;
        s.innerHTML = companionSVG(id, base);
        s.classList.remove('react');
      }, holdMs || 1100);
    }
  });
}
function buddySlot(mood, extraClass){
  const m = mood || 'happy';
  return `<span class="buddy-slot ${extraClass||''}" data-mood="${m}" aria-hidden="true">${companionSVG(currentCompanion(), m)}</span>`;
}

/* ---- sélecteur de compagnon (accueil, nouveau joueur, réglages) ---- */
function companionSelector(sel, gender, showAll){
  const list = showAll ? COMPANION_ORDER : companionsFor(gender);
  const others = COMPANION_ORDER.length - list.length;
  return `<label class="mini-label">✨ Ton compagnon d'aventure</label>
    <div class="buddy-grid">
      ${list.map(k=>`<button type="button" class="buddy-opt ${k===sel?'sel':''}" data-buddy="${k}" aria-label="${COMPANIONS[k].name} ${COMPANIONS[k].title}">
        ${companionSVG(k, k===sel ? 'cheer' : 'happy')}
        <span class="bn">${COMPANIONS[k].name}</span><span class="bt">${COMPANIONS[k].title}</span>
      </button>`).join('')}
    </div>
    ${others>0 ? `<button type="button" class="buddy-more" data-buddy-more>＋ Voir les autres compagnons</button>` : ''}`;
}
// branche les boutons du sélecteur ; onPick(id) / onMore()
function bindCompanionSelector(root, onPick, onMore){
  (root||document).querySelectorAll('.buddy-opt').forEach(b=>{
    b.onclick = ()=>{ playSound('tap'); onPick(b.dataset.buddy); };
  });
  const more = (root||document).querySelector('[data-buddy-more]');
  if(more) more.onclick = ()=>{ playSound('tap'); onMore(); };
}

/* ---- avatars dessinés ----
   Un avatar vaut d'ordinaire un emoji ; « art:<id> » désigne un compagnon
   dessiné (ex. « art:zap », le super-héros). avatarHTML l'affiche en image
   partout où l'avatar est affiché ; avatarText le remplace par un emoji
   dans le texte simple (notifications, voix). */
const AVATAR_ART_EMOJI = { zap:'🦸‍♂️', perle:'🧜‍♀️', rose:'👸', lili:'🧚‍♀️', tom:'🏴‍☠️', leo:'🛡️', sam:'🧭' };
function isArtAvatar(av){ return typeof av==='string' && av.startsWith('art:') && !!COMPANIONS[av.slice(4)]; }
// look (facultatif) : chapeau, lunettes, couleurs choisis dans la garde-robe
function avatarHTML(av, look){
  const hasLook = look && (look.tete || look.visage || look.tenue);
  if(!isArtAvatar(av)){
    const emo = av || '👧';
    if(!hasLook || !companionDressing.lookAccessoriesSVG || (companionDressing.lookFits && !companionDressing.lookFits(emo))) return emo;
    const acc = companionDressing.lookAccessoriesSVG(look);
    return `<span class="av-look">${emo}${acc ? `<svg class="look-ov" viewBox="-30 -70 160 200" aria-hidden="true">${acc}</svg>` : ''}</span>`;
  }
  const id = av.slice(4), c = COMPANIONS[id];
  return `<span class="av-art" role="img" aria-label="${c.name} ${c.title}">${companionSVG(id,'happy', hasLook ? { look } : null)}</span>`;
}
function avatarText(av){
  if(!isArtAvatar(av)) return av || '👧';
  return AVATAR_ART_EMOJI[av.slice(4)] || '🙂';
}

