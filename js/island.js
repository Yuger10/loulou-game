/* ---------- L'île vivante ----------
   La vue Île est un paysage dessiné (SVG) propre à chaque monde, où vivent
   les personnages (on les touche pour jouer) et où l'enfant pose ses
   décorations du bout du doigt. Le ciel suit l'heure réelle : matin,
   journée, coucher de soleil, nuit étoilée.

   - Chaque monde a son paysage selon sa forme (`WORLDS[id].shape`) ; un
     monde inconnu reçoit un paysage générique à ses couleurs (sand/land et
     jetons --world-*), il n'y a donc rien à faire pour qu'une nouvelle île
     soit jolie.
   - Les décorations se déplacent (glisser) ; leur place est gardée dans
     state.decoPos[clé] = {x, y} en coordonnées du dessin (480×360).
   - Une bulle au-dessus de chaque personnage : 📜 mission du jour,
     ❤️ déjà aidé aujourd'hui, 💬 il a envie de jouer.

   Le dessin (viewBox 480×360, cadré par le bas) garde toujours le sol
   dans la moitié basse de la scène, quel que soit le format d'écran. */

// Places en coordonnées du DESSIN (viewBox 480×360), converties à l'affichage
// selon la taille réelle de la scène : un personnage reste sur la plage et
// un dauphin dans l'eau, quel que soit le format d'écran.
const ISLE_W = 480, ISLE_H = 360;
const ISLE_CHAR_SLOTS = [
  {x:150, y:262}, {x:330, y:256}, {x:205, y:334}, {x:300, y:336}, {x:112, y:320}, {x:372, y:318},
];
const ISLE_GROUND_SLOTS = [
  {x:242, y:262}, {x:110, y:276}, {x:378, y:276}, {x:248, y:348}, {x:150, y:350}, {x:345, y:350},
  {x:282, y:292}, {x:182, y:290}, {x:104, y:342}, {x:384, y:342}, {x:214, y:270}, {x:300, y:268},
];
const ISLE_SKY_SLOTS = [ {x:222, y:70}, {x:280, y:104}, {x:172, y:100}, {x:250, y:40} ];
const ISLE_SEA_SLOTS = [ {x:272, y:180}, {x:206, y:184}, {x:370, y:178}, {x:240, y:192} ];
const SKY_DECO_EMOJIS = ['🌈','🌙','☁️','⭐','🌟','🎈','🦋','🐦','🕊️','🪁','🦅','🐉','💫','🌞'];
const SEA_DECO_EMOJIS = ['🐠','🐟','🐬','🦈','🐢','🐙','🐳','🐋','🦀','⛵','🏴‍☠️','🚤','🧜‍♀️'];

/* ---- moment de la journée (heure réelle) ---- */
function isleTimeOfDay(date){
  const h = (date || new Date()).getHours();
  if(h >= 20 || h < 6) return 'nuit';
  if(h < 10) return 'matin';
  if(h < 17) return 'jour';
  return 'soir';
}
function isleToday(){
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

/* ---- personnages aidés aujourd'hui ---- */
function markHelped(charId){
  if(!charId) return;
  const today = isleToday();
  if(!state.helped || state.helped.date !== today) state.helped = { date: today, ids: {} };
  state.helped.ids[charId] = (state.helped.ids[charId] || 0) + 1;
  save();
}
function helpedToday(charId){
  return !!(state.helped && state.helped.date === isleToday() && state.helped.ids[charId]);
}
function charMood(charId){
  const q = typeof ensureQuests === 'function' ? ensureQuests() : null;
  const quest = q && q.list.find(i=>i.type==='char' && i.target===charId && i.n < i.goal);
  if(quest) return { icon:'📜', label:'mission du jour' };
  if(helpedToday(charId)) return { icon:'❤️', label:"déjà aidé aujourd'hui" };
  return { icon:'💬', label:'veut jouer avec toi' };
}

/* ---- paysages ---- */
function isleSky(){
  return `<rect width="480" height="360" fill="url(#isle-sky)"/>
    <g class="ls-stars" fill="#fff">
      <circle cx="40" cy="30" r="1.6"/><circle cx="96" cy="58" r="1.2"/><circle cx="150" cy="22" r="1.8"/>
      <circle cx="210" cy="64" r="1.2"/><circle cx="262" cy="30" r="1.5"/><circle cx="318" cy="70" r="1.1"/>
      <circle cx="356" cy="22" r="1.7"/><circle cx="430" cy="46" r="1.3"/><circle cx="458" cy="90" r="1.2"/>
      <circle cx="70" cy="104" r="1.1"/><circle cx="180" cy="110" r="1.3"/><circle cx="300" cy="118" r="1.1"/>
    </g>
    <g class="ls-sun"><circle cx="340" cy="86" r="40" fill="#FFE07A" opacity=".25"/><circle cx="340" cy="86" r="25" fill="#FFD54A"/></g>
    <g class="ls-moon"><circle cx="344" cy="80" r="20" fill="#FFF6D6"/><circle cx="336" cy="74" r="4" fill="#EDE2B8"/><circle cx="351" cy="88" r="3" fill="#EDE2B8"/></g>
    <g class="ls-cloud c1" fill="#fff" opacity=".9"><ellipse cx="90" cy="70" rx="34" ry="12"/><ellipse cx="110" cy="60" rx="20" ry="14"/><ellipse cx="72" cy="64" rx="14" ry="10"/></g>
    <g class="ls-cloud c2" fill="#fff" opacity=".75"><ellipse cx="300" cy="110" rx="28" ry="9"/><ellipse cx="314" cy="102" rx="15" ry="10"/></g>`;
}

const ISLE_SCENERY = {
  lagon: (w)=>`
    <rect y="150" width="480" height="210" fill="#5ED0D2"/>
    <g class="ls-waves" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" opacity=".55">
      <path d="M-20 168 q15 -6 30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0"/>
      <path d="M-5 184 q15 -6 30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0"/>
    </g>
    <ellipse cx="150" cy="152" rx="38" ry="7" fill="${w.land}" opacity=".7"/>
    <path d="M-10 360 L-10 252 C60 216 150 197 240 195 C330 197 420 216 490 252 L490 360 Z" fill="${w.sand}"/>
    <path d="M-10 360 L-10 268 C70 236 150 214 240 212 C330 214 410 236 490 268 L490 360 Z" fill="${w.land}"/>
    <path d="M170 360 C190 320 230 300 250 270 C262 252 250 236 240 226" fill="none" stroke="${w.sand}" stroke-width="16" stroke-linecap="round" opacity=".9"/>
    <g class="ls-palm">
      <path d="M112 232 C108 196 114 160 128 128" fill="none" stroke="#9A6B3F" stroke-width="9" stroke-linecap="round"/>
      <g fill="#3FAF6A"><ellipse cx="108" cy="122" rx="30" ry="9" transform="rotate(-20 108 122)"/><ellipse cx="150" cy="120" rx="30" ry="9" transform="rotate(18 150 120)"/>
      <ellipse cx="124" cy="110" rx="9" ry="26" transform="rotate(-8 124 110)"/><ellipse cx="102" cy="136" rx="24" ry="7" transform="rotate(-48 102 136)"/><ellipse cx="154" cy="138" rx="24" ry="7" transform="rotate(46 154 138)"/></g>
      <circle cx="126" cy="130" r="5" fill="#7A4A2E"/><circle cx="134" cy="132" r="5" fill="#7A4A2E"/>
    </g>
    <g fill="#fff" opacity=".85"><circle cx="360" cy="300" r="3"/><circle cx="370" cy="306" r="2"/><circle cx="96" cy="318" r="2.5"/></g>`,
  foret: (w)=>`
    <path d="M0 205 C80 150 160 160 240 186 C320 150 400 142 480 180 L480 360 L0 360 Z" fill="#9ED8A0"/>
    <g fill="#5FAF6E"><path d="M60 182 l12 -34 l12 34z"/><path d="M84 176 l10 -28 l10 28z"/><path d="M330 166 l13 -38 l13 38z"/><path d="M356 162 l11 -32 l11 32z"/><path d="M400 168 l10 -28 l10 28z"/></g>
    <path d="M0 232 C100 202 200 212 260 226 C340 206 420 202 480 216 L480 360 L0 360 Z" fill="#7CC77F"/>
    <path d="M0 252 C120 236 360 236 480 252 L480 360 L0 360 Z" fill="${w.land}"/>
    <path d="M200 360 C214 320 250 300 262 262" fill="none" stroke="${w.sand}" stroke-width="16" stroke-linecap="round" opacity=".85"/>
    <g class="ls-tree"><rect x="370" y="196" width="16" height="64" rx="4" fill="#8A5A36"/>
      <circle cx="378" cy="180" r="34" fill="#3E9A55"/><circle cx="352" cy="196" r="22" fill="#4DAA60"/><circle cx="402" cy="198" r="22" fill="#4DAA60"/></g>
    <g><circle cx="120" cy="300" r="4" fill="#FF8FB8"/><circle cx="132" cy="306" r="3" fill="#FFD54A"/><circle cx="330" cy="318" r="4" fill="#C9A7F5"/><circle cx="90" cy="276" r="3" fill="#FFD54A"/></g>
    <g><rect x="146" y="262" width="5" height="9" rx="2" fill="#F6EFD9"/><path d="M140 264 q8 -12 17 0z" fill="#F46B5D"/></g>`,
  montagne: (w)=>`
    <path d="M20 212 L130 72 L240 212 Z" fill="#B9D3EE"/><path d="M130 72 L104 106 L118 100 L130 112 L144 100 L157 106 Z" fill="#fff"/>
    <path d="M196 212 L330 42 L464 212 Z" fill="#A6C6E8"/><path d="M330 42 L298 84 L314 76 L330 90 L346 76 L362 84 Z" fill="#fff"/>
    <g class="ls-cloud c3" fill="#fff" opacity=".85"><ellipse cx="240" cy="178" rx="60" ry="10"/><ellipse cx="270" cy="170" rx="28" ry="10"/></g>
    <path d="M0 232 C120 202 220 216 300 206 C380 197 440 210 480 220 L480 360 L0 360 Z" fill="#CFE0F2"/>
    <path d="M0 252 C140 238 340 238 480 252 L480 360 L0 360 Z" fill="${w.sand}"/>
    <g fill="${w.land}"><ellipse cx="70" cy="276" rx="26" ry="12"/><ellipse cx="420" cy="290" rx="30" ry="13"/><ellipse cx="300" cy="330" rx="18" ry="8"/></g>
    <g fill="#fff" opacity=".9"><ellipse cx="64" cy="270" rx="14" ry="4"/><ellipse cx="414" cy="283" rx="16" ry="4"/></g>`,
  chateau: (w)=>`
    <path d="M60 232 C140 172 340 172 420 232 Z" fill="#4B3A7A"/>
    <g fill="#2E2452">
      <rect x="168" y="118" width="30" height="96"/><path d="M164 120 L183 90 L202 120 Z"/>
      <rect x="282" y="118" width="30" height="96"/><path d="M278 120 L297 90 L316 120 Z"/>
      <rect x="196" y="148" width="88" height="66"/><rect x="226" y="104" width="28" height="60"/><path d="M222 106 L240 74 L258 106 Z"/>
    </g>
    <path d="M232 214 L232 192 C232 182 248 182 248 192 L248 214 Z" fill="#1E1838"/>
    <g fill="#FFD54A"><rect x="178" y="140" width="8" height="12" rx="3"/><rect x="292" y="140" width="8" height="12" rx="3"/><rect x="236" y="122" width="8" height="12" rx="3"/><rect x="208" y="168" width="7" height="10" rx="3"/><rect x="266" y="168" width="7" height="10" rx="3"/></g>
    <g fill="#F46B5D"><path d="M183 90 L183 76 L195 81 L183 86 Z"/><path d="M240 74 L240 60 L252 65 L240 70 Z"/></g>
    <path d="M0 250 C140 232 340 232 480 250 L480 360 L0 360 Z" fill="${w.land}"/>
    <path d="M206 360 C220 320 236 290 240 236" fill="none" stroke="${w.sand}" stroke-width="16" stroke-linecap="round" opacity=".8"/>
    <g><rect x="110" y="270" width="4" height="30" fill="#6A4C93"/><circle cx="112" cy="266" r="7" fill="#FFE07A"/><circle cx="112" cy="266" r="16" fill="#FFE07A" opacity=".25"/>
    <rect x="366" y="276" width="4" height="30" fill="#6A4C93"/><circle cx="368" cy="272" r="7" fill="#FFE07A"/><circle cx="368" cy="272" r="16" fill="#FFE07A" opacity=".25"/></g>`,
  jungle: (w)=>`
    <g fill="#3E8E5A"><circle cx="20" cy="200" r="40"/><circle cx="90" cy="186" r="44"/><circle cx="170" cy="196" r="40"/><circle cx="250" cy="182" r="46"/><circle cx="330" cy="194" r="40"/><circle cx="410" cy="184" r="44"/><circle cx="476" cy="198" r="38"/></g>
    <rect y="200" width="480" height="40" fill="#3E8E5A"/>
    <g class="ls-vines" fill="none" stroke="#2F7A4A" stroke-width="3" stroke-linecap="round">
      <path d="M104 0 C98 40 112 70 104 104"/><path d="M164 0 C170 30 158 52 164 76"/><path d="M372 0 C366 44 380 80 372 120"/>
    </g>
    <g fill="#4FB57F"><ellipse cx="104" cy="60" rx="7" ry="4" transform="rotate(30 104 60)"/><ellipse cx="164" cy="44" rx="7" ry="4" transform="rotate(-30 164 44)"/><ellipse cx="372" cy="84" rx="8" ry="4" transform="rotate(25 372 84)"/></g>
    <path d="M0 246 C140 230 340 230 480 246 L480 360 L0 360 Z" fill="${w.land}"/>
    <path d="M180 360 C200 320 252 300 258 252" fill="none" stroke="#C9A86B" stroke-width="16" stroke-linecap="round" opacity=".9"/>
    <g fill="#3FA86A"><ellipse cx="96" cy="356" rx="60" ry="18" transform="rotate(-24 96 356)"/><ellipse cx="400" cy="352" rx="62" ry="18" transform="rotate(22 400 352)"/></g>
    <g fill="#245F3C"><ellipse cx="118" cy="40" rx="50" ry="14" transform="rotate(28 118 40)"/><ellipse cx="380" cy="30" rx="54" ry="14" transform="rotate(-26 380 30)"/></g>
    <g><circle cx="300" cy="300" r="4" fill="#FF8FB8"/><circle cx="140" cy="290" r="4" fill="#FFD54A"/></g>`,
  // Cité du Temps : tour de l'horloge (les aiguilles tournent), engrenages dans le ciel, toits, réverbères
  cite: (w)=>`
    <g class="ls-gear g1" style="transform-origin:92px 74px">
      <circle cx="92" cy="74" r="25" fill="none" stroke="#C9A46A" stroke-width="10" stroke-dasharray="7 6"/>
      <circle cx="92" cy="74" r="20" fill="#D9B97E"/><circle cx="92" cy="74" r="7" fill="#8C7355"/>
    </g>
    <g class="ls-gear g2" style="transform-origin:134px 108px">
      <circle cx="134" cy="108" r="15" fill="none" stroke="#B8925A" stroke-width="8" stroke-dasharray="5 5"/>
      <circle cx="134" cy="108" r="11" fill="#CFAE72"/><circle cx="134" cy="108" r="4" fill="#8C7355"/>
    </g>
    <g fill="#D8C3A0">
      <rect x="22" y="172" width="44" height="76"/><path d="M18 174 L44 142 L70 174 Z"/>
      <rect x="76" y="190" width="56" height="58"/><path d="M72 192 L104 166 L136 192 Z"/>
      <rect x="146" y="180" width="40" height="68"/><path d="M142 182 L166 154 L190 182 Z"/>
      <rect x="296" y="182" width="42" height="66"/><path d="M292 184 L317 156 L342 184 Z"/>
      <rect x="350" y="168" width="52" height="80"/><path d="M346 170 L376 136 L406 170 Z"/>
      <rect x="414" y="190" width="48" height="58"/><path d="M410 192 L438 166 L466 192 Z"/>
    </g>
    <g fill="#FFF1C9"><rect x="36" y="190" width="8" height="10" rx="2"/><rect x="96" y="206" width="8" height="10" rx="2"/><rect x="160" y="196" width="8" height="10" rx="2"/>
      <rect x="310" y="198" width="8" height="10" rx="2"/><rect x="368" y="186" width="8" height="10" rx="2"/><rect x="430" y="206" width="8" height="10" rx="2"/></g>
    <rect x="212" y="98" width="56" height="150" fill="#8C7355"/>
    <path d="M204 102 L240 52 L276 102 Z" fill="#6E4B2A"/>
    <circle cx="240" cy="134" r="22" fill="#FFF8E6" stroke="#5C4128" stroke-width="4"/>
    <g fill="#5C4128"><circle cx="240" cy="117" r="2"/><circle cx="257" cy="134" r="2"/><circle cx="240" cy="151" r="2"/><circle cx="223" cy="134" r="2"/></g>
    <g class="ls-clock-h" style="transform-origin:240px 134px"><line x1="240" y1="134" x2="251" y2="134" stroke="#5C4128" stroke-width="4" stroke-linecap="round"/></g>
    <g class="ls-clock-m" style="transform-origin:240px 134px"><line x1="240" y1="134" x2="240" y2="118" stroke="#E8573A" stroke-width="3" stroke-linecap="round"/></g>
    <circle cx="240" cy="134" r="3" fill="#5C4128"/>
    <path d="M230 248 L230 222 C230 212 250 212 250 222 L250 248 Z" fill="#5C4128"/>
    <path d="M0 248 C140 232 340 232 480 248 L480 360 L0 360 Z" fill="${w.land}"/>
    <g fill="${w.sand}" opacity=".35">
      <ellipse cx="60" cy="280" rx="14" ry="5"/><ellipse cx="100" cy="300" rx="14" ry="5"/><ellipse cx="380" cy="284" rx="14" ry="5"/>
      <ellipse cx="420" cy="306" rx="14" ry="5"/><ellipse cx="140" cy="334" rx="14" ry="5"/><ellipse cx="340" cy="330" rx="14" ry="5"/>
    </g>
    <path d="M196 360 C214 320 236 290 240 250" fill="none" stroke="${w.sand}" stroke-width="18" stroke-linecap="round" opacity=".9"/>
    <g><rect x="120" y="244" width="4" height="40" fill="#5C4128"/><circle cx="122" cy="240" r="7" fill="#FFE07A"/><circle cx="122" cy="240" r="16" fill="#FFE07A" opacity=".25"/>
      <rect x="356" y="244" width="4" height="40" fill="#5C4128"/><circle cx="358" cy="240" r="7" fill="#FFE07A"/><circle cx="358" cy="240" r="16" fill="#FFE07A" opacity=".25"/></g>`,
  // Volcan des Génies : cône fumant, coulées de lave, fissures qui rougeoient
  volcan: (w)=>`
    <path d="M0 236 L60 186 L118 214 L176 176 L214 200 L300 192 L352 170 L410 206 L480 180 L480 360 L0 360 Z" fill="#B4553A" opacity=".55"/>
    <g class="ls-smoke">
      <circle class="s1" cx="236" cy="78" r="14" fill="#A99A94"/><circle class="s2" cx="248" cy="70" r="12" fill="#BCAFA9"/><circle class="s3" cx="228" cy="66" r="10" fill="#9C8F8A"/>
    </g>
    <ellipse cx="240" cy="96" rx="56" ry="18" fill="#FFB06A" opacity=".35"/>
    <path d="M118 248 L206 96 L274 96 L362 248 Z" fill="#6B2A1E"/>
    <path d="M206 96 L196 114 L284 114 L274 96 Z" fill="#5A2218"/>
    <ellipse cx="240" cy="96" rx="34" ry="8" fill="#FF7A3A"/>
    <g fill="none" stroke-linecap="round">
      <path d="M226 100 C220 132 238 152 226 194 C220 214 232 230 228 246" stroke="#FF8A3A" stroke-width="9"/>
      <path d="M256 100 C262 126 250 150 262 182" stroke="#FFA54A" stroke-width="7"/>
      <path d="M226 100 C220 132 238 152 226 194" stroke="#FFD27A" stroke-width="3" opacity=".8"/>
    </g>
    <path d="M0 250 C140 234 340 234 480 250 L480 360 L0 360 Z" fill="${w.land}"/>
    <g class="ls-lava" fill="none" stroke="#FF8A3A" stroke-width="3" stroke-linecap="round" opacity=".85">
      <path d="M40 290 l18 6 l10 -8 l16 4"/><path d="M380 300 l14 -6 l12 8 l18 -4"/><path d="M120 336 l16 -4 l10 6"/><path d="M330 340 l12 4 l14 -6"/>
    </g>
    <path d="M196 360 C214 322 236 292 238 252" fill="none" stroke="#C9583A" stroke-width="18" stroke-linecap="round" opacity=".9"/>
    <g fill="${w.sand}"><ellipse cx="80" cy="266" rx="22" ry="9"/><ellipse cx="404" cy="272" rx="26" ry="10"/><ellipse cx="300" cy="318" rx="14" ry="6"/></g>
    <g fill="#FF8A3A" opacity=".8"><ellipse cx="150" cy="300" rx="16" ry="4"/></g>`,
};
// paysage générique, aux couleurs du monde (toute nouvelle île en profite)
function isleGenericScenery(w){
  return `
    <path d="M0 214 C90 170 190 178 260 200 C340 170 420 168 480 196 L480 360 L0 360 Z" fill="${w.land}" opacity=".45"/>
    <path d="M0 252 C140 234 340 234 480 252 L480 360 L0 360 Z" fill="${w.land}"/>
    <path d="M196 360 C212 320 246 298 256 260" fill="none" stroke="${w.sand}" stroke-width="16" stroke-linecap="round" opacity=".9"/>
    <g fill="${w.sand}" opacity=".9"><ellipse cx="80" cy="300" rx="22" ry="7"/><ellipse cx="402" cy="312" rx="26" ry="8"/></g>`;
}
function landscapeSVG(worldId){
  const w = WORLDS[worldId] || WORLDS.lagon;
  const draw = ISLE_SCENERY[w.shape] || ISLE_SCENERY[worldId] || isleGenericScenery;
  return `<svg class="isle-land" viewBox="0 0 480 360" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
    <defs><linearGradient id="isle-sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" style="stop-color:var(--sky-top)"/><stop offset=".62" style="stop-color:var(--sky-bot)"/>
    </linearGradient></defs>
    ${isleSky()}
    ${draw(w)}
  </svg>`;
}

/* ---- places des décorations ---- */
function decoZone(emoji, worldShape){
  if(SKY_DECO_EMOJIS.includes(emoji)) return 'sky';
  if(worldShape === 'lagon' && SEA_DECO_EMOJIS.includes(emoji)) return 'sea';
  return 'ground';
}
const ISLE_ZONE_SLOTS = { sky: ISLE_SKY_SLOTS, sea: ISLE_SEA_SLOTS, ground: ISLE_GROUND_SLOTS };
// place de chaque décoration : celle choisie par l'enfant, sinon la
// prochaine place libre de sa zone (ciel, mer ou sol)
function decoPositions(keys){
  const shape = (WORLDS[currentWorld]||{}).shape;
  const used = { sky:0, sea:0, ground:0 };
  const out = {};
  keys.forEach(k=>{
    const zone = decoZone(DECOS[k].emoji, shape);
    const slots = ISLE_ZONE_SLOTS[zone];
    const def = slots[used[zone]++ % slots.length];
    out[k] = (state.decoPos && state.decoPos[k]) || def;
  });
  return out;
}
function moveDeco(key, x, y){
  if(!state.decoPos) state.decoPos = {};
  state.decoPos[key] = { x: Math.round(Math.max(0, Math.min(ISLE_W, x))), y: Math.round(Math.max(0, Math.min(ISLE_H, y))) };
  save();
}
const isleZ = (y)=> 10 + Math.round(y / 4);

/* ---- dessin ↔ écran : même cadrage que le SVG (xMidYMax slice) ---- */
function isleFrame(sc){
  const W = sc.clientWidth || 400, H = sc.clientHeight || 440;
  const s = Math.max(W / ISLE_W, H / ISLE_H);
  const ox = (W - ISLE_W * s) / 2, oy = H - ISLE_H * s;
  // partie du dessin réellement visible (marge pour ne rien couper au bord)
  const pad = 22 / s;
  return { W, H, s, ox, oy,
    minX: Math.max(0, -ox / s) + pad, maxX: Math.min(ISLE_W, (W - ox) / s) - pad,
    minY: Math.max(0, -oy / s) + pad * 1.6, maxY: ISLE_H - pad * .4 };
}
function isleToScreen(f, x, y){
  const cx = Math.max(f.minX, Math.min(f.maxX, x)), cy = Math.max(f.minY, Math.min(f.maxY, y));
  return { left: (f.ox + cx * f.s) / f.W * 100, top: (f.oy + cy * f.s) / f.H * 100 };
}
function isleFromScreen(f, px, py){
  return { x: Math.max(f.minX, Math.min(f.maxX, (px - f.ox) / f.s)), y: Math.max(f.minY, Math.min(f.maxY, (py - f.oy) / f.s)) };
}
// place chaque élément (data-vx / data-vy) selon la taille actuelle de la scène
function layoutIsle(sc){
  if(!sc) return;
  const f = isleFrame(sc);
  sc.querySelectorAll('[data-vx]').forEach(el=>{
    if(el.classList.contains('dragging')) return;
    const p = isleToScreen(f, Number(el.dataset.vx), Number(el.dataset.vy));
    el.style.left = p.left + '%'; el.style.top = p.top + '%';
  });
}
let isleResizeObs = null;

/* ---- rendu ---- */
function renderLiveIsland(sc){
  if(!sc) return;
  const w = WORLDS[currentWorld];
  const chars = charsOf(currentWorld);
  const owned = decosOf(currentWorld).map(([k])=>k).filter(k=>state.decos.includes(k));
  const tod = isleTimeOfDay();
  const pos = decoPositions(owned);
  sc.className = `scene live-isle tod-${tod} shape-${w.shape || currentWorld}`;
  sc.innerHTML = `
    ${landscapeSVG(currentWorld)}
    <div class="isle-tod" aria-hidden="true"></div>
    ${owned.map((k,i)=>{
      const p = pos[k];
      return `<span class="deco" data-deco-key="${k}" data-vx="${p.x}" data-vy="${p.y}" role="img" aria-label="${DECOS[k].name}"
        style="z-index:${isleZ(p.y)}; --d:${(i*0.7)%3}s">${DECOS[k].emoji}</span>`;
    }).join('')}
    ${chars.map(([id,c],i)=>{
      const p = ISLE_CHAR_SLOTS[i % ISLE_CHAR_SLOTS.length];
      const mood = charMood(id);
      return `<button class="island isle-char" data-char="${id}" data-vx="${p.x}" data-vy="${p.y}" aria-label="${c.name} ${c.title}, ${mood.label}"
        style="z-index:${isleZ(p.y)}; --d:${i*0.6}s">
        <span class="ic-bubble">${mood.icon}</span>
        <span class="emoji">${charFace(id)}</span>
        <span class="ic-shadow"></span>
        <span class="name">${c.name}</span>
      </button>`;
    }).join('')}
    ${owned.length ? '' : `<span class="empty isle-empty">${w.sceneEmpty}</span>`}
    ${owned.length && !state.tipDragDeco ? `<span class="isle-tip">✋ Fais glisser tes décorations !</span>` : ''}
    <button class="btn-deco" id="btn-deco">🎨 Décorer</button>
  `;
  layoutIsle(sc);
  // l'écran tourne, la fenêtre change de taille : tout reste à sa place dans le dessin
  if(!isleResizeObs && typeof ResizeObserver === 'function'){
    isleResizeObs = new ResizeObserver(()=> layoutIsle(sc));
    isleResizeObs.observe(sc);
  }
  sc.querySelectorAll('.isle-char').forEach(btn=>{
    btn.addEventListener('click', ()=>{ playSound('tap'); openDialogue(btn.dataset.char); });
  });
  sc.querySelectorAll('.deco[data-deco-key]').forEach(el=> bindDecoDrag(sc, el));
  const b = document.getElementById('btn-deco');
  if(b) b.onclick = ()=>{ playSound('tap'); openDecoShop(); };
}

/* ---- glisser une décoration ---- */
function bindDecoDrag(sc, el){
  let start = null, dragging = false;
  el.addEventListener('pointerdown', e=>{
    start = { x:e.clientX, y:e.clientY, id:e.pointerId };
    dragging = false;
  });
  el.addEventListener('pointermove', e=>{
    if(!start || e.pointerId !== start.id) return;
    if(!dragging){
      if(Math.hypot(e.clientX - start.x, e.clientY - start.y) < 6) return;
      dragging = true;
      el.classList.add('dragging');
      try{ el.setPointerCapture(e.pointerId); }catch(err){}
    }
    const r = sc.getBoundingClientRect();
    if(!r.width) return;
    const f = isleFrame(sc);
    const v = isleFromScreen(f, e.clientX - r.left, e.clientY - r.top);
    const p = isleToScreen(f, v.x, v.y);
    el.style.left = p.left + '%'; el.style.top = p.top + '%'; el.style.zIndex = 200;
    el.dataset.vx = v.x; el.dataset.vy = v.y;
  });
  const end = e=>{
    if(!start) return;
    if(dragging){
      const x = Number(el.dataset.vx), y = Number(el.dataset.vy);
      moveDeco(el.dataset.decoKey, x, y);
      el.style.zIndex = isleZ(y);
      el.classList.remove('dragging');
      playSound('pop');
      if(!state.tipDragDeco){ state.tipDragDeco = true; save(); const t = sc.querySelector('.isle-tip'); if(t) t.remove(); }
    } else if(e.type === 'pointerup'){
      // simple toucher : la décoration se trémousse et dit son nom
      el.classList.remove('wiggle'); void el.offsetWidth; el.classList.add('wiggle');
      playSound('tap');
      const d = DECOS[el.dataset.decoKey];
      if(d && typeof speak === 'function') speak(d.name);
    }
    start = null; dragging = false;
  };
  el.addEventListener('pointerup', end);
  el.addEventListener('pointercancel', end);
}

// le ciel change tout seul quand l'heure tourne (vérifié chaque minute)
setInterval(()=>{
  const sc = document.getElementById('scene');
  if(sc && sc.classList.contains('live-isle') && !sc.classList.contains('tod-' + isleTimeOfDay())) renderLiveIsland(sc);
}, 60000);
