/* ---------- Mini-jeu : Les planètes (Questionner le monde / sciences) ----------
   Un quiz illustré sur le Soleil, la Lune, la Terre et les 8 planètes.

   EXACTITUDE SCIENTIFIQUE — règles suivies :
   - Les réponses ne sont jamais écrites à la main : elles sont CALCULÉES
     à partir du tableau SOLAR_DATA ci-dessous (ordre depuis le Soleil,
     diamètre, température moyenne), lui-même tiré des fiches de la NASA
     (Planetary Fact Sheet). Les tests vérifient chaque question.
   - 8 planètes : Pluton est une planète naine depuis 2006 (UAI), elle
     n'apparaît jamais comme planète.
   - Le Soleil est une étoile ; la Lune est un satellite naturel de la
     Terre (pas une planète) et ne produit pas sa propre lumière.
   - La planète la plus chaude est Vénus (son atmosphère épaisse garde la
     chaleur), pas Mercure, pourtant plus proche du Soleil : piège classique.
   - Saturne n'est pas la seule planète à anneaux (les 4 géantes en ont) :
     on dit « de grands anneaux bien visibles », jamais « la seule ».
   - Le jour et la nuit viennent de la rotation de la Terre sur elle-même,
     pas du Soleil qui « tournerait autour de la Terre ».
   - Les dessins ne sont PAS à l'échelle : toutes les planètes sont
     dessinées avec le même diamètre (PLANET_DRAW_R), pour que la réponse
     vienne du savoir et qu'aucune image ne donne une fausse taille.

   ADAPTATION À L'ÂGE (paliers, voir `planetsTier` dans js/entities/difficulty/difficulty.js) :
     1 GS/CP   reconnaître le Soleil, la Lune, la Terre ; le jour et la nuit
     2 CP      le Soleil est une étoile qui produit sa lumière ; la Lune
               tourne autour de la Terre ; on habite sur la Terre
     3 CE1     reconnaître les planètes à leur aspect (anneaux, rouge, tache)
     4 CE1/CE2 la plus proche, la plus lointaine, la plus grande, la plus petite
     5 CE2     8 planètes, 1 jour, 1 an, pourquoi le jour et la nuit, Vénus
     6 CE2/CM1 l'ordre des planètes, planètes rocheuses et géantes
   Le système solaire est surtout au programme du cycle 3 (CM1) : les
   paliers 4 à 6 sont donc des défis pour les plus grands, et le jeu n'est
   proposé qu'à partir de 5 ans (paliers 1-2 seulement à cet âge). */

const SOLAR_DATA = {
  // order : rang depuis le Soleil ; diameter : km ; temp : température moyenne (°C)
  mercure: { name:'Mercure', the:'Mercure', order:1, diameter:4879,   temp:167,  kind:'rocheuse' },
  venus:   { name:'Vénus',   the:'Vénus',   order:2, diameter:12104,  temp:464,  kind:'rocheuse' },
  terre:   { name:'Terre',   the:'la Terre',order:3, diameter:12756,  temp:15,   kind:'rocheuse' },
  mars:    { name:'Mars',    the:'Mars',    order:4, diameter:6792,   temp:-65,  kind:'rocheuse' },
  jupiter: { name:'Jupiter', the:'Jupiter', order:5, diameter:142984, temp:-110, kind:'géante' },
  saturne: { name:'Saturne', the:'Saturne', order:6, diameter:120536, temp:-140, kind:'géante' },
  uranus:  { name:'Uranus',  the:'Uranus',  order:7, diameter:51118,  temp:-195, kind:'géante' },
  neptune: { name:'Neptune', the:'Neptune', order:8, diameter:49528,  temp:-200, kind:'géante' },
};
const PLANET_IDS = Object.keys(SOLAR_DATA).sort((a,b)=>SOLAR_DATA[a].order-SOLAR_DATA[b].order);
const SKY_BODIES = { soleil:{ name:'le Soleil' }, lune:{ name:'la Lune' } };

const planetBy = (fn)=> PLANET_IDS.reduce((best, id)=> best===null || fn(SOLAR_DATA[id], SOLAR_DATA[best]) ? id : best, null);
const closestPlanet  = ()=> planetBy((a,b)=> a.order < b.order);
const farthestPlanet = ()=> planetBy((a,b)=> a.order > b.order);
const largestPlanet  = ()=> planetBy((a,b)=> a.diameter > b.diameter);
const smallestPlanet = ()=> planetBy((a,b)=> a.diameter < b.diameter);
const hottestPlanet  = ()=> planetBy((a,b)=> a.temp > b.temp);
const planetAt = (n)=> PLANET_IDS.find(id=>SOLAR_DATA[id].order===n);

/* ---- dessins (SVG 100×100, sans visage, pas à l'échelle) ---- */
// rayon du disque de chaque planète dans son dessin : toutes sont ramenées au
// même rayon, pour qu'aucune image ne suggère une fausse taille (ex. Neptune,
// 4 fois plus large que la Terre, ne doit jamais paraître plus petite)
const PLANET_DISC_R = { mercure:36, venus:38, terre:38, mars:34, jupiter:42, saturne:27, uranus:30, neptune:30 };
const PLANET_DRAW_R = 30;
function bodySVG(id){
  const k = PLANET_DISC_R[id] ? PLANET_DRAW_R / PLANET_DISC_R[id] : 1;
  const g = (inner)=> `<svg class="pl-svg" viewBox="0 0 100 100" aria-hidden="true">${k===1 ? inner : `<g transform="translate(50 50) scale(${k.toFixed(3)}) translate(-50 -50)">${inner}</g>`}</svg>`;
  switch(id){
    case 'soleil': return g(`<g stroke="#FFB020" stroke-width="6" stroke-linecap="round">${Array.from({length:12},(_,i)=>{const a=i*30*Math.PI/180;return `<line x1="${50+34*Math.cos(a)}" y1="${50+34*Math.sin(a)}" x2="${50+46*Math.cos(a)}" y2="${50+46*Math.sin(a)}"/>`;}).join('')}</g>
      <circle cx="50" cy="50" r="29" fill="#FFD23F" stroke="#F29A1F" stroke-width="3"/><circle cx="42" cy="42" r="9" fill="#FFF2A8" opacity=".7"/>`);
    case 'lune': return g(`<circle cx="50" cy="50" r="38" fill="#E3E3DE" stroke="#A9A9A2" stroke-width="3"/>
      <g fill="#C7C7BF"><circle cx="38" cy="38" r="8"/><circle cx="62" cy="58" r="10"/><circle cx="44" cy="66" r="5"/><circle cx="66" cy="34" r="4"/></g>`);
    case 'mercure': return g(`<circle cx="50" cy="50" r="36" fill="#A8968A" stroke="#6E5F55" stroke-width="3"/>
      <g fill="#8C7B70"><circle cx="38" cy="40" r="7"/><circle cx="60" cy="60" r="9"/><circle cx="62" cy="36" r="4"/><circle cx="40" cy="64" r="4"/></g>`);
    case 'venus': return g(`<circle cx="50" cy="50" r="38" fill="#EED9A4" stroke="#B89B5E" stroke-width="3"/>
      <path d="M18 42 Q50 34 82 44 M16 56 Q50 64 84 54 M24 70 Q50 76 76 68" fill="none" stroke="#D9BD7C" stroke-width="5" stroke-linecap="round"/>`);
    case 'terre': return g(`<circle cx="50" cy="50" r="38" fill="#3A8FD6" stroke="#1F5E99" stroke-width="3"/>
      <path d="M30 30 C38 24 50 28 48 38 C46 46 36 44 34 52 C32 58 24 54 22 46 C21 40 24 34 30 30Z M58 46 C66 40 78 46 76 56 C74 66 66 72 58 68 C52 64 52 52 58 46Z" fill="#5FB35A"/>
      <path d="M26 64 Q36 60 46 66 M54 26 Q64 22 72 28" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".85"/>`);
    case 'mars': return g(`<circle cx="50" cy="50" r="34" fill="#D9603B" stroke="#97391F" stroke-width="3"/>
      <g fill="#B24A2C"><ellipse cx="40" cy="52" rx="10" ry="6"/><ellipse cx="62" cy="62" rx="8" ry="4"/></g>
      <ellipse cx="50" cy="20" rx="10" ry="4" fill="#fff"/>`);
    case 'jupiter': return g(`<circle cx="50" cy="50" r="42" fill="#E8C9A0" stroke="#A87A4F" stroke-width="3"/>
      <path d="M10 36 H90 M9 50 H91 M12 64 H88" stroke="#C99364" stroke-width="7"/><path d="M16 28 H84 M14 72 H86" stroke="#D9AE80" stroke-width="4"/>
      <ellipse cx="62" cy="64" rx="9" ry="5.5" fill="#C9472E" stroke="#97391F" stroke-width="1.5"/>`);
    case 'saturne': return g(`<path d="M8 58 C8 50 92 36 92 44" fill="none" stroke="#CDB57A" stroke-width="7" stroke-linecap="round"/>
      <circle cx="50" cy="50" r="27" fill="#EBD69A" stroke="#B89B5E" stroke-width="3"/>
      <path d="M26 44 H74 M24 54 H76" stroke="#D6BC77" stroke-width="4"/>
      <path d="M8 58 C8 66 92 52 92 44" fill="none" stroke="#B89B5E" stroke-width="7" stroke-linecap="round"/>`);
    case 'uranus': return g(`<ellipse cx="50" cy="50" rx="7" ry="45" fill="none" stroke="#9FD6D9" stroke-width="2.5" opacity=".9"/>
      <circle cx="50" cy="50" r="30" fill="#A6E3E6" stroke="#5FA9AE" stroke-width="3"/>
      <path d="M50 21 V79" stroke="#8ED1D5" stroke-width="3" opacity=".7"/>`);
    case 'neptune': return g(`<circle cx="50" cy="50" r="30" fill="#3F66D6" stroke="#22388C" stroke-width="3"/>
      <ellipse cx="42" cy="54" rx="7" ry="4" fill="#26409E"/><path d="M52 40 Q62 36 70 42" fill="none" stroke="#DCE8FF" stroke-width="3" stroke-linecap="round"/>`);
  }
  return '';
}

/* ---- banque de questions, par palier ----
   Chaque question : say (lue et affichée), answer, options (ids ou textes),
   type 'pic' (images) ou 'txt' (texte), fact (une phrase vraie montrée et
   dite après la bonne réponse). */
const PLANET_QUESTIONS = {
  1: [
    ()=>({ type:'pic', say:'Touche le Soleil', answer:'soleil', options:['soleil','lune','terre'],
           fact:'Le Soleil nous éclaire et nous chauffe pendant la journée.' }),
    ()=>({ type:'pic', say:'Touche la Lune', answer:'lune', options:['soleil','lune','terre'],
           fact:'La Lune tourne autour de la Terre.' }),
    ()=>({ type:'pic', say:'Touche la Terre, notre planète', answer:'terre', options:['soleil','lune','terre'],
           fact:'Sur la Terre, il y a de l\'eau, de l\'air et des êtres vivants.' }),
    ()=>({ type:'txt', say:'Quand voit-on les étoiles dans le ciel ?', answer:'La nuit', options:['La nuit','Le jour'],
           fact:'Le jour, le Soleil brille si fort qu\'on ne voit plus les étoiles.' }),
  ],
  2: [
    ()=>({ type:'pic', say:'Sur quelle planète habitons-nous ?', answer:'terre', options:['terre','mars','saturne'],
           fact:'Nous habitons sur la Terre, la seule planète où l\'on sait qu\'il y a de la vie.' }),
    ()=>({ type:'pic', say:'Qui fabrique sa propre lumière ?', answer:'soleil', options:['soleil','lune','terre'],
           fact:'Le Soleil est une étoile : il produit sa lumière. La Lune, elle, renvoie la lumière du Soleil.' }),
    ()=>({ type:'pic', say:'Qui tourne autour de la Terre ?', answer:'lune', options:['lune','soleil','mars'],
           fact:'La Lune est le satellite de la Terre : elle tourne autour d\'elle.' }),
    ()=>({ type:'txt', say:'Le Soleil, c\'est…', answer:'une étoile', options:['une étoile','une planète','un satellite'],
           fact:'Le Soleil est une étoile, comme celles que l\'on voit la nuit, mais bien plus proche de nous.' }),
  ],
  3: [
    ()=>({ type:'pic', say:'Quelle planète a de grands anneaux bien visibles ?', answer:'saturne', options:['saturne','mars','terre'],
           fact:'Les anneaux de Saturne sont faits de morceaux de glace et de roche.' }),
    ()=>({ type:'pic', say:'Quelle est la planète rouge ?', answer:'mars', options:['mars','neptune','venus'],
           fact:'Mars est rouge à cause de sa poussière, riche en fer comme la rouille.' }),
    ()=>({ type:'pic', say:'Quelle planète a une grande tache rouge ?', answer:'jupiter', options:['jupiter','saturne','mercure'],
           fact:'La grande tache rouge de Jupiter est une énorme tempête.' }),
    ()=>({ type:'pic', say:'Quelle planète est bleue, avec des océans et des nuages ?', answer:'terre', options:['terre','mars','jupiter'],
           fact:'La Terre est surtout recouverte d\'eau : c\'est la planète bleue.' }),
  ],
  4: [
    ()=>{ const a = closestPlanet(); return { type:'pic', sameSize:true, say:'Quelle planète est la plus proche du Soleil ?', answer:a, options:[a,'terre','neptune'],
           fact:`${SOLAR_DATA[a].name} est la planète la plus proche du Soleil.` }; },
    ()=>{ const a = farthestPlanet(); return { type:'pic', sameSize:true, say:'Quelle planète est la plus éloignée du Soleil ?', answer:a, options:[a,'mars','saturne'],
           fact:`${SOLAR_DATA[a].name} est la planète la plus éloignée du Soleil.` }; },
    ()=>{ const a = largestPlanet(); return { type:'pic', sameSize:true, say:'Quelle est la plus grande planète ?', answer:a, options:[a,'terre','uranus'],
           fact:`${SOLAR_DATA[a].name} est la plus grande planète : plus de mille Terres pourraient tenir dedans.` }; },
    ()=>{ const a = smallestPlanet(); return { type:'pic', sameSize:true, say:'Quelle est la plus petite planète ?', answer:a, options:[a,'terre','jupiter'],
           fact:`${SOLAR_DATA[a].name} est la plus petite des huit planètes.` }; },
    ()=>{ const a = planetAt(SOLAR_DATA.terre.order + 1); return { type:'pic', sameSize:true, say:'Quelle planète vient juste après la Terre, en partant du Soleil ?', answer:a, options:[a,'venus','jupiter'],
           fact:`Après la Terre vient ${SOLAR_DATA[a].name}.` }; },
  ],
  5: [
    ()=>({ type:'txt', say:'Combien y a-t-il de planètes autour du Soleil ?', answer:String(PLANET_IDS.length), options:['7', String(PLANET_IDS.length), '9'],
           fact:'Il y a 8 planètes. Pluton est une planète naine depuis 2006.' }),
    ()=>({ type:'txt', say:'Combien de temps la Terre met-elle pour faire le tour du Soleil ?', answer:'1 an', options:['1 jour','1 mois','1 an'],
           fact:'La Terre fait le tour du Soleil en un an, environ 365 jours.' }),
    ()=>({ type:'txt', say:'Combien de temps la Terre met-elle pour tourner sur elle-même ?', answer:'1 jour', options:['1 heure','1 jour','1 an'],
           fact:'La Terre fait un tour sur elle-même en un jour, environ 24 heures.' }),
    ()=>({ type:'txt', say:'Pourquoi y a-t-il le jour et la nuit ?', answer:'La Terre tourne sur elle-même',
           options:['La Terre tourne sur elle-même','Le Soleil tourne autour de la Terre','La Lune cache le Soleil'],
           fact:'Le côté de la Terre tourné vers le Soleil est dans le jour, l\'autre côté est dans la nuit.' }),
    ()=>{ const a = hottestPlanet(); return { type:'pic', sameSize:true, say:'Quelle est la planète la plus chaude ?', answer:a, options:['mercure',a,'mars'],
           fact:`C'est ${SOLAR_DATA[a].name} : son air très épais garde la chaleur. Mercure est plus près du Soleil, mais moins chaude.` }; },
    ()=>({ type:'txt', say:'La Lune, c\'est…', answer:'un satellite de la Terre', options:['une planète','une étoile','un satellite de la Terre'],
           fact:'La Lune est le satellite naturel de la Terre.' }),
  ],
  6: [
    ()=>({ type:'order', say:'Touche les planètes dans l\'ordre, en partant du Soleil',
           fact:'Dans l\'ordre : Mercure, Vénus, la Terre, Mars, Jupiter, Saturne, Uranus et Neptune.' }),
    ()=>{ const a = planetAt(SOLAR_DATA.mars.order + 1); return { type:'pic', sameSize:true, say:'Quelle planète se trouve entre Mars et Saturne ?', answer:a, options:[a,'uranus','venus'],
           fact:`Entre Mars et Saturne, il y a ${SOLAR_DATA[a].name}.` }; },
    ()=>{ const n = PLANET_IDS.filter(id=>SOLAR_DATA[id].order < SOLAR_DATA.terre.order).length; return { type:'txt', say:'Combien de planètes sont plus proches du Soleil que la Terre ?',
           answer:String(n), options:['1', String(n), '3'], fact:'Mercure et Vénus sont plus proches du Soleil que la Terre.' }; },
    ()=>({ type:'pic', sameSize:true, say:'Laquelle est une planète géante ?', answer:'neptune', options:['mars','neptune','mercure'],
           fact:'Jupiter, Saturne, Uranus et Neptune sont les quatre planètes géantes.' }),
    ()=>({ type:'pic', sameSize:true, say:'Laquelle est une planète rocheuse, comme la Terre ?', answer:'mars', options:['jupiter','mars','uranus'],
           fact:'Mercure, Vénus, la Terre et Mars sont des planètes rocheuses.' }),
    ()=>({ type:'pic', sameSize:true, say:'Quelle planète tourne couchée sur le côté ?', answer:'uranus', options:['uranus','terre','saturne'],
           fact:'Uranus est penchée sur le côté : elle roule presque autour du Soleil.' }),
  ],
};

let lastPlanetQ = null;
function pickPlanetQuestion(dd){
  const tier = planetsTier(dd);
  const pool = PLANET_QUESTIONS[tier];
  let i, guard = 0;
  do { i = Math.floor(Math.random()*pool.length); } while(pool.length>1 && `${tier}:${i}`===lastPlanetQ && guard++<10);
  lastPlanetQ = `${tier}:${i}`;
  return Object.assign({ tier }, pool[i]());
}

const bodyName = (id)=> SKY_BODIES[id] ? SKY_BODIES[id].name : SOLAR_DATA[id].the;
const bodyLabel = (id)=> SKY_BODIES[id] ? SKY_BODIES[id].name.replace(/^l[ea] /,'').replace(/^./,c=>c.toUpperCase()) : SOLAR_DATA[id].name;

function renderPlanets(){
  setupLives('planets');
  const q = pickPlanetQuestion(gameDiff());
  if(q.type==='order') return renderPlanetOrder(q);
  const opts = shuffle(q.options.slice());
  const body = q.type==='pic'
    ? `<div class="pl-options">${opts.map(id=>`<button type="button" class="pl-opt ${q.sameSize?'same-size':''}" data-v="${id}" aria-label="${bodyName(id)}">${bodySVG(id)}<span class="pl-name">${bodyLabel(id)}</span></button>`).join('')}</div>`
    : `<div class="pl-options txt">${opts.map(t=>`<button type="button" class="pl-opt pl-txt" data-v="${t}">${t}</button>`).join('')}</div>`;
  openModal(`
    ${gameHeader('🪐 Les planètes', q.say, q.say)}
    ${livesBar()}
    <div class="pl-space">${body}</div>
  `);
  bindQuit();
  setSolution([solSel('.pl-opt','v',q.answer)]);
  setHintQuestion('planets', q, { choices:'.pl-opt' });
  document.querySelectorAll('.pl-opt').forEach(btn=>{
    btn.onclick = ()=>{
      if(btn.dataset.v===q.answer){ stepOk(btn); flashModal('ok'); planetWin(q); }
      else loseLife(btn, { onRetry: renderPlanets });
    };
  });
}

// palier 6 : toucher 4 planètes voisines dans l'ordre depuis le Soleil
function renderPlanetOrder(q){
  const start = 1 + Math.floor(Math.random()*(PLANET_IDS.length-3));
  const seq = PLANET_IDS.filter(id=>SOLAR_DATA[id].order>=start && SOLAR_DATA[id].order<start+4);
  q.seq = seq; q.next = 0;   // q.next : où en est l'enfant (pour les indices)
  openModal(`
    ${gameHeader('🪐 Les planètes', q.say, q.say)}
    ${livesBar()}
    ${progressDots(0, seq.length)}
    <div class="pl-space"><span class="pl-sun" aria-hidden="true">${bodySVG('soleil')}</span>
      <div class="pl-options">${shuffle(seq.slice()).map(id=>`<button type="button" class="pl-opt same-size" data-v="${id}" aria-label="${bodyName(id)}">${bodySVG(id)}<span class="pl-name">${bodyLabel(id)}</span></button>`).join('')}</div>
    </div>
  `);
  bindQuit();
  setSolution(seq.map(id=>solSel('.pl-opt','v',id)));
  setHintQuestion('planets', q, { choices:'.pl-opt' });
  document.querySelectorAll('.pl-opt').forEach(btn=>{
    btn.onclick = ()=>{
      if(btn.dataset.v===seq[q.next]){
        q.next++; btn.disabled = true; btn.classList.add('done');
        btn.insertAdjacentHTML('beforeend', `<span class="pl-rank">${SOLAR_DATA[btn.dataset.v].order}</span>`);
        document.querySelectorAll('.game-progress i').forEach((d,i)=>d.classList.toggle('on', i<q.next));
        stepOk(btn);
        if(q.next>=seq.length){ flashModal('ok'); planetWin(q); }
      } else loseLife(btn, { disable:false });
    };
  });
}

// la bonne réponse : on montre et on dit une phrase vraie, puis la victoire
function planetWin(q){
  missionFact = q.fact;
  setTimeout(onMissionWin, 450);
}

/* Indices (v52) : 1. regarder chaque dessin (couleurs, anneaux, taches) ou
   repenser à la question ; 2. une piste propre à chaque question
   (PLANET_TIPS), vraie et vérifiée comme le reste du quiz, qui ne nomme
   jamais la réponse. Pour l'ordre des planètes : le chemin déjà fait. */
const PLANET_TIPS = {
  'Touche le Soleil':'Il est jaune, avec des rayons tout autour.',
  'Touche la Lune':'Elle est grise, avec des petits creux ronds : des cratères.',
  'Touche la Terre, notre planète':'Notre planète est bleue et verte : de l\'eau et des terres.',
  'Quand voit-on les étoiles dans le ciel ?':'Les étoiles brillent quand le ciel est tout noir.',
  'Sur quelle planète habitons-nous ?':'Cherche la planète bleue, avec de l\'eau et des terres vertes.',
  'Qui fabrique sa propre lumière ?':'Cherche celui qui brille tout seul, avec des rayons.',
  'Qui tourne autour de la Terre ?':'C\'est celle qu\'on voit la nuit, grise et toute proche de nous.',
  'Le Soleil, c\'est…':'Il brille tout seul, comme les points lumineux du ciel de la nuit, mais bien plus près de nous.',
  'Quelle planète a de grands anneaux bien visibles ?':'Les anneaux, c\'est comme un grand cerceau tout autour de la planète.',
  'Quelle est la planète rouge ?':'Cherche la planète couleur de rouille.',
  'Quelle planète a une grande tache rouge ?':'Cherche une tache rouge sur des bandes de couleur.',
  'Quelle planète est bleue, avec des océans et des nuages ?':'L\'eau est bleue, les nuages sont blancs.',
  'Quelle planète est la plus proche du Soleil ?':'Pense à l\'ordre des planètes en partant du Soleil : quelle est la toute première ?',
  'Quelle planète est la plus éloignée du Soleil ?':'Pense à la toute dernière planète, la plus loin dans le froid.',
  'Quelle est la plus grande planète ?':'C\'est la plus grosse des planètes géantes.',
  'Quelle est la plus petite planète ?':'Elle est rocheuse, et c\'est aussi la plus proche du Soleil.',
  'Quelle planète vient juste après la Terre, en partant du Soleil ?':'Récite l\'ordre : Mercure, Vénus, la Terre… et après ?',
  'Combien y a-t-il de planètes autour du Soleil ?':'Attention : Pluton n\'est plus une planète depuis 2006. Enlève-la de ta liste !',
  'Combien de temps la Terre met-elle pour faire le tour du Soleil ?':'C\'est très long : on fête son anniversaire une fois à chaque tour !',
  'Combien de temps la Terre met-elle pour tourner sur elle-même ?':'Pendant un tour sur elle-même, il fait jour une fois, puis nuit une fois.',
  'Pourquoi y a-t-il le jour et la nuit ?':'C\'est la Terre qui bouge, comme une toupie.',
  'Quelle est la planète la plus chaude ?':'Attention au piège : ce n\'est pas la plus proche du Soleil ! Son air très épais garde la chaleur.',
  'La Lune, c\'est…':'La Lune tourne autour de la Terre.',
  'Touche les planètes dans l\'ordre, en partant du Soleil':'Les petites planètes rocheuses sont près du Soleil, les géantes plus loin.',
  'Quelle planète se trouve entre Mars et Saturne ?':'Entre les deux, il y a la plus grande de toutes.',
  'Combien de planètes sont plus proches du Soleil que la Terre ?':'Compte celles qui viennent avant la Terre, en partant du Soleil.',
  'Laquelle est une planète géante ?':'Les géantes sont très loin du Soleil, et faites surtout de gaz.',
  'Laquelle est une planète rocheuse, comme la Terre ?':'Rocheuse, comme la Terre : on pourrait marcher dessus.',
  'Quelle planète tourne couchée sur le côté ?':'Regarde ses anneaux : ils ne sont pas couchés comme les autres, ils sont debout !',
};
function planetsHints(q){
  const tip = PLANET_TIPS[q.say] || 'Pense à ce que tu sais du ciel.';
  if(q.type === 'order'){
    const done = q.seq.slice(0, q.next);
    return [
      { say:'Le Soleil est à gauche : commence par la planète la plus proche de lui. ' + tip, fx:{ glow:'.pl-sun' } },
      hintOrderStep(done, 'Voici le chemin déjà fait. Quelle planète vient ensuite ?', id=> SOLAR_DATA[id].name),
    ];
  }
  return [
    { say: q.type === 'pic' ? 'Regarde bien chaque dessin : la couleur, les anneaux, les taches…' : 'Écoute encore la question, et pense à ce que tu sais du ciel.', fx:{ glow:'.pl-options' } },
    { say:tip, fx:{} },
  ];
}

// inscription auprès du moteur de mini-jeux (js/features/minigame-engine)
registerGame('planets', renderPlanets);
registerHints('planets', planetsHints);
