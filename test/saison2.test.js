// La saison 2 (v55) : le Ciel des Rêves (deuxième archipel, carte à deux
// onglets, montgolfière, ouverture au niveau 36, migration), le Monde des
// Boîtes (île, personnages, objets, série de squishies, Pop), les deux
// mini-jeux (gigognes, cubes) et l'histoire « Les Rêves dans les boîtes »
// (prologue, chapitre, épisodes, Grisou, journal à deux saisons).
// Même harnais que test/squishies.test.js.
const { JSDOM } = require('jsdom');
const page = require('./tools/page.js');
const html = page.buildHtml();

const SPEED = 0.1;
const spoken = [];
const dom = new JSDOM(html, {
  runScripts:'dangerously', pretendToBeVisual:true, url:'http://localhost/?saison=aucune',
  beforeParse(win){
    const st = win.setTimeout.bind(win), si = win.setInterval.bind(win);
    win.setTimeout = (fn, ms, ...a)=> st(fn, Math.round((ms || 0) * SPEED), ...a);
    win.setInterval = (fn, ms, ...a)=> si(fn, Math.max(1, Math.round((ms || 0) * SPEED)), ...a);
    win.SpeechSynthesisUtterance = function(text){ this.text = text; };
    win.speechSynthesis = { speaking:false, cancel(){}, getVoices:()=>[], speak(u){ spoken.push(u.text); } };
  },
});
const w = dom.window, d = w.document;
w.confirm = ()=>true;
const errs = [];
w.addEventListener('error', e=>errs.push(e.message));
const ev = (code)=> w.eval(code);
const wait = ms => new Promise(r=>setTimeout(r, ms));
async function waitFor(cond, ms = 3000){
  const t0 = Date.now();
  while(Date.now() - t0 < ms){ if(cond()) return true; await wait(10); }
  return !!cond();
}
let failed = 0, passed = 0;
function check(name, cond){ if(cond){ passed++; console.log('✅ ' + name); } else { failed++; console.log('❌ ' + name); } }
function section(name){ console.log('— ' + name); }
const lastSaid = ()=> spoken[spoken.length - 1] || '';
const shown = (sel)=> d.getElementById('overlay').classList.contains('show') && !!d.querySelector(sel);
const json = (x)=> JSON.stringify(x);
const LEVEL = (n)=> (n - 1) * 5;   // missions pour être au niveau n
// un jeu au palier voulu, en solo (comme test/games.test.js)
const ISLAND_FOR_TIER = { 1:'lagon', 2:'foret', 3:'montagne', 4:'chateau', 5:'jungle', 6:'volcan' };
function startGame(key, tier, age){
  ev(`closeModal(); party.active = false; currentProfile().age = ${age || 0};
      state.missions = 200; currentWorld = ${json(ISLAND_FOR_TIER[tier || 1])};
      state.skills = { ${key}: { wins:0, fails:0, errors:0, last:null, recent:[], lvl:${tier || 1} } };
      playGame(${json(key)})`);
}

(async ()=>{
  await wait(100);
  d.getElementById('btn-splash-play').click();
  d.getElementById('name-input').value = 'Lou';
  d.querySelector('.avatar-opt').click();
  d.getElementById('btn-start').click();
  await wait(150);
  ev('closeModal(); state.storySolved = { lagon: true }; save()');

  /* ================= Phase 1 : deux archipels ================= */
  section('Les archipels');
  {
    const s1 = ev('worldsOf(1)');
    check('les 8 îles de la saison 1, dans le même ordre', json(s1) === json(['lagon','foret','montagne','chateau','jungle','cite','volcan','squishy']));
    check('leurs niveaux d\'ouverture sont inchangés', json(s1.map(id=> ev(`WORLDS.${id}.level`))) === json([1,3,6,10,14,18,22,26]));
    check('chaque île a un archipel (saison 1 ou 2)', ev('Object.values(WORLDS).every(w=> w.saison===1 || w.saison===2)'));
    check('le Ciel des Rêves : saison 2, ouvert au niveau 36 (après tout le Lagon), en montgolfière', ev('ARCHIPELAGOS[2].level') === 36 && ev('ARCHIPELAGOS[2].level') > ev('WORLDS.squishy.level') && ev('ARCHIPELAGOS[2].vehicle') === '🎈' && /Ciel des Rêves/.test(ev('ARCHIPELAGOS[2].name')));
    check('le Monde des Boîtes est sa première île (niveau 36, palier 6)', json(ev('worldsOf(2)')) === json(['boites']) && ev('WORLDS.boites.level') === 36 && ev('WORLDS.boites.diff') === 6);
    check('prochaine île de chaque archipel', (ev(`state.missions = ${LEVEL(7)}; save()`), ev('nextLockedWorld(1)')) === 'chateau' && ev('nextLockedWorld(2)') === 'boites');
  }

  section('Carte à deux onglets');
  {
    ev(`closeModal(); state.missions = ${LEVEL(35)}; state.skyIntroSeen = true; save(); setCurrentWorld("lagon"); switchView("carte")`);
    const tabs = d.querySelectorAll('#map-tabs .map-tab');
    check('deux onglets : le Lagon Magique et le Ciel des Rêves', tabs.length === 2 && /Lagon Magique/.test(tabs[0].textContent) && /Ciel des Rêves/.test(tabs[1].textContent));
    check('niveau 35 : le Ciel est verrouillé (cadenas, « Niveau 36 »)', tabs[1].classList.contains('locked') && /🔒/.test(tabs[1].textContent) && /Niveau 36/.test(tabs[1].textContent));
    check('toutes les îles du Lagon ouvertes : la carte annonce le prochain monde, avec sa progression', /Prochain monde : Le Ciel des Rêves au niveau 36/.test(d.getElementById('map-next').textContent) && !!d.querySelector('#map-next .quest-bar'));
    check('la carte de la saison 1 reste la même (8 îles, bateau ⛵)', d.querySelectorAll('.map-island').length === 8 && /⛵/.test(d.getElementById('map-boat').textContent) && !d.getElementById('island-map').classList.contains('sky'));
    spoken.length = 0;
    tabs[1].click();
    check('toucher l\'onglet fermé : la voix dit quand il s\'ouvre, la carte ne change pas', /niveau 36/.test(lastSaid()) && d.querySelectorAll('.map-island').length === 8);
    ev(`state.missions = ${LEVEL(36)}; save(); renderMap()`);
    check('niveau 36 : l\'onglet du Ciel s\'ouvre', !d.querySelector('#map-tabs .map-tab[data-saison="2"]').classList.contains('locked'));
    d.querySelector('#map-tabs .map-tab[data-saison="2"]').click();
    check('la carte du Ciel : fond pastel, ses îles seulement', d.getElementById('island-map').classList.contains('sky') && d.querySelectorAll('.map-island').length === 1 && !!d.querySelector('.map-island[data-world="boites"]'));
    check('dans le Ciel, le bateau devient une montgolfière', /🎈/.test(d.getElementById('map-boat').textContent) && d.getElementById('map-boat').classList.contains('balloon'));
    check('la montgolfière attend à la première île (l\'île courante est au Lagon)', d.getElementById('map-boat').classList.contains('parked'));
    const pos = ev('worldsOf(2).map(id=> WORLDS[id].map)');
    check('les îles du Ciel tiennent dans le cadre', pos.every(p=> p.x >= 14 && p.x <= 86 && p.y >= 15 && p.y <= 85));
    d.querySelector('.map-island[data-world="boites"]').click();
    check('d\'un archipel à l\'autre : pas de trajet, on y est tout de suite', ev('currentWorld') === 'boites' && !ev('sailing'));
    await wait(80);
    check('on débarque sur l\'île du Ciel', d.getElementById('view-ile').classList.contains('active') && /Monde des Boîtes/.test(d.getElementById('world-title').textContent));
    ev('switchView("carte")');
    check('revenir à la carte : elle montre l\'archipel de l\'île courante', d.getElementById('island-map').classList.contains('sky'));
    d.querySelector('#map-tabs .map-tab[data-saison="1"]').click();
    check('l\'onglet du Lagon ramène la carte de la saison 1', d.querySelectorAll('.map-island').length === 8 && !d.getElementById('island-map').classList.contains('sky'));
    ev('setCurrentWorld("lagon"); renderMap()');
  }

  section('Ouverture du Ciel (niveau 36)');
  {
    ev(`closeModal(); state.missions = ${LEVEL(36) - 1}; state.skyIntroSeen = false; state.visited = worldsOf(1).filter(worldUnlocked); state.storySolved = { lagon:true }; save(); setCurrentWorld("lagon")`);
    ev('playGame("count"); onMissionWin()');
    check('la mission qui fait passer au niveau 36', ev('level()') === 36);
    d.getElementById('btn-yay').click();   // « Continuer » sur l'écran de victoire
    await waitFor(()=> shown('.sky-open'), 1500);
    check('l\'écran « Un nouveau monde s\'ouvre dans le ciel ! » s\'affiche', shown('.sky-open') && /nouveau monde s'ouvre dans le ciel/i.test(d.querySelector('.sky-open h2').textContent));
    check('il est dit à voix haute', /nouveau monde s'ouvre dans le ciel/.test(spoken.join(' ')));
    check('il ne sera montré qu\'une fois', ev('state.skyIntroSeen') === true);
    d.getElementById('sky-go').click();
    check('puis le prologue de la saison 2, lu par Capucine, avec Grisou', shown('.story-grisou .grisou') && /Capucine/.test(lastSaid()) && !!d.querySelector('.char-header [aria-label*="Capucine"]'));
    while(d.getElementById('story-next') && /Suite/.test(d.getElementById('story-next').textContent)) d.getElementById('story-next').click();
    d.getElementById('story-next').click();   // « En route ! »
    await wait(30);
    check('puis le chapitre du Monde des Boîtes', shown('.char-header') && /rêves de la Fabrique/.test(d.querySelector('.char-header h2').textContent));
    check('le chapitre de la saison 2 montre aussi Grisou', shown('.story-grisou .grisou'));
    ev('closeModal()');
    check('l\'île des Boîtes est marquée comme découverte', ev('state.visited.includes("boites")'));
    check('pas de deuxième ouverture', ev('maybeSkyOpening()') === false);
  }

  section('Partie existante et migration');
  {
    const old = { v:5, coins:12, missions:180, inventory:{ coquillage:3 }, storySolved:{ lagon:true, foret:true }, visited:['lagon','foret','montagne','chateau','jungle'],
      squishies:{ owned:{ donut:2 }, boxes:['capy'], shelf:Array(12).fill(null), dry:0, done:{}, fromStory:{ lagon:true, foret:true }, day:null, sorted:3, hello:true } };
    const m = ev(`migrate(${json(old)})`);
    check('migration v5 → v6 : rien n\'est perdu', m.v === ev('SAVE_VERSION') && m.coins === 12 && m.missions === 180 && m.inventory.coquillage === 3 && m.squishies.owned.donut === 2 && m.squishies.sorted === 3 && json(m.visited) === json(old.visited));
    check('migration : l\'ouverture du Ciel reste à montrer', m.skyIntroSeen === false);
    ev(`closeModal(); localStorage.setItem(currentSaveKey(), ${json(json(old))}); load(); refreshAll()`);
    check('une partie déjà au niveau 37 : le Ciel s\'ouvre au premier lancement', ev('maybeSkyOpening()') === true && shown('.sky-open'));
    d.getElementById('sky-go').click();
    check('… suivi du prologue', shown('.story-grisou') && !!d.getElementById('story-next'));
    ev('closeModal()');
  }

  /* ================= Phase 2 : le Monde des Boîtes ================= */
  section('Le Monde des Boîtes');
  {
    const css = page.manifestCss().map(f=> page.read(f)).join('\n');
    check('l\'île : saison 2, niveau 36, son thème de couleurs', ev('WORLDS.boites.saison') === 2 && css.includes('body[data-world="boites"]{--world-sky'));
    const chars = ev('charsOf("boites").map(([id])=> id)');
    check('4 personnages : Capucine, Kiki, Boulon, Lola', json(chars) === json(['capucine','kiki','boulon','lola']));
    check('chacun a son butin (2 objets de l\'île) et 3 répliques', chars.every(c=> ev(`CHARACTERS.${c}.loot.length===2 && CHARACTERS.${c}.loot.every(k=> ITEMS[k] && ITEMS[k].world==="boites") && CHARACTERS.${c}.texts.length===3`)));
    check('chacun a son dessin', chars.every(c=> ev(`charArtSVG(${json(c)})`).startsWith('<svg')));
    const items = ev('Object.keys(ITEMS).filter(k=> ITEMS[k].world==="boites")');
    check(`ses objets (${items.length})`, items.length >= 6);
    check('au moins 3 objets ne sont donnés par personne', items.filter(k=> !chars.some(c=> ev(`CHARACTERS.${c}.loot.includes(${json(k)})`))).length >= 3);
    check('2 recettes de fusion', ev('Object.keys(CRAFTED).filter(k=> CRAFTED[k].world==="boites").length') === 2);
    check('4 à 5 décorations', [4, 5].includes(ev('decosOf("boites").length')));
    check('2 objets préférés par personnage, de l\'île', chars.every(c=> ev(`(()=>{ const f = favoritesOf(${json(c)}); return f.length===2 && f.every(k=> ITEMS[k].world==="boites" && !CHARACTERS.${c}.loot.includes(k)); })()`)));
    check('sa musique (MUSIC_THEMES.boites)', !!ev('MUSIC_THEMES.boites'));
    check('son paysage (des boîtes en carton)', !!ev('ISLE_SCENERY.boites'));
    ev(`closeModal(); state.missions = ${LEVEL(36)}; save(); setWorld("boites", true); switchView("ile")`);
    check('sur l\'île : ses 4 personnages dans le paysage', d.querySelectorAll('#scene [data-char]').length === 4 || d.querySelectorAll('#scene .isle-char').length === 4);
    check('le thème de l\'île est appliqué', d.body.dataset.world === 'boites');
    ev('ensureQuests()');
    check('ses objets font partie des objets accessibles (missions)', ev('availableItems().includes("carton")'));
  }

  section('Série de squishies « Boîtes »');
  {
    const ids = ev('squishiesOf("boites")');
    const rar = ids.map(id=> ev(`SQUISHIES[${json(id)}].rarity`));
    check('6 modèles : 4 communs, 1 rare, 1 ✨', ids.length === 6 && rar.filter(r=> r==='commun').length === 4 && rar.filter(r=> r==='rare').length === 1 && rar.filter(r=> r==='brille').length === 1);
    check('le rare est Pop, le ✨ la boîte dorée', ev('SQUISHIES.pop.rarity') === 'rare' && ev('SQUISHIES["boite-doree"].rarity') === 'brille');
    check('chaque modèle a son dessin', ids.every(id=> ev(`squishyArtSVG(${json(id)})`).includes('sq-face')));
    ev(`state.missions = ${LEVEL(35)}; save()`);
    check('avant le Monde des Boîtes : la série n\'apparaît pas', ev('squishySeriesAvailable("boites")') === false && !ev('squishyMissing()').includes('pop'));
    ev(`state.missions = ${LEVEL(36)}; save(); openSquishyRoom("collection")`);
    check('ensuite, elle apparaît dans la chambre', !!d.querySelector('.sq-series[data-series="boites"]'));
    ev('closeModal(); state.storySolved = { lagon:true }; state.squishies = squishyFreshState(); save(); storyWin("boites")');
    check('l\'énigme des Boîtes donne une boîte de la série Boîtes', json(ev('state.squishies.boxes')) === json(['boites']) && shown('.sq-reward-line'));
    ev('closeModal(); storyWin("boites")');
    check('… une seule fois', ev('squishyBoxCount()') === 1);
    ev('closeModal()');
  }

  section('Pop, le diablotin à ressort');
  {
    const run = async (popR)=>{
      ev(`closeModal(); state.squishies = squishyFreshState(); state.squishies.boxes = ["boites"]; save(); openSquishyRoom("collection")`);
      ev('Math.__r = Math.random; (()=>{ let i = 0; const v = [.3, .1, .7]; Math.random = ()=> v[i++ % v.length]; })()');
      const r = ev(`squishyOpenAnimated(()=> ${popR})`);
      ev('Math.random = Math.__r');
      const jack = await waitFor(()=> !!d.querySelector('#sq-stage .sq-pop-jack'), 150);   // avant que le squishy ne saute
      await wait(150);
      return { id: r.res.id, pop: r.pop, jack };
    };
    const a = await run(0.1), b = await run(0.9);
    check('1 fois sur 5 : Pop surgit de la boîte', a.pop === true && a.jack && ev('SQ_POP_CHANCE') === 0.2);
    check('sinon, pas de Pop', b.pop === false && !b.jack);
    check('Pop ne change pas le résultat du tirage', a.id === b.id);
    ev('closeModal()');
  }

  /* ================= Phase 3 : les deux mini-jeux ================= */
  section('Les boîtes gigognes');
  {
    for(const [tier, n] of [[1, 3], [2, 4], [3, 5], [5, 5]]){
      startGame('nesting', tier);
      check(`palier ${tier} : ${n} boîtes`, d.querySelectorAll('.nest-btn').length === n);
    }
    startGame('nesting', 1);
    const sol = ev('gameSolution');
    const sizes = sol.map(s=> Number(d.querySelector(s).dataset.size));
    check('à ranger de la plus petite à la plus grande', sizes.every((x, i)=> i === 0 || x > sizes[i - 1]) && /plus petite à la plus grande/.test(d.querySelector('.puzzle-hint').textContent));
    d.querySelector(sol[0]).click();
    check('une bonne boîte se range (dans la pile)', d.querySelectorAll('#nest-stack .nest-in').length === 1);
    spoken.length = 0;
    const wrong = [...d.querySelectorAll('.nest-btn:not(:disabled)')].find(b=> b !== d.querySelector(sol[1]));
    wrong.click();
    check('une erreur : la boîte tremble et un indice est dit', wrong.classList.contains('ko-flash') && /trop|encore|celle/i.test(spoken.join(' ')));
    const before = ev('hint.q');
    const wrong2 = [...d.querySelectorAll('.nest-btn:not(:disabled)')].find(b=> b !== d.querySelector(sol[1]));
    wrong2.click();
    await waitFor(()=> ev('hint.q') !== before, 600);
    check('2ᵉ erreur : une nouvelle série de boîtes', ev('hint.q') !== before && d.querySelectorAll('#nest-stack .nest-in').length === 0);
    // relance annulable : la fenêtre fermée, rien ne réapparaît
    startGame('nesting', 1);
    const s2 = ev('gameSolution');
    const bad = ()=> [...d.querySelectorAll('.nest-btn:not(:disabled)')].find(b=> b !== d.querySelector(s2[0]));
    bad().click(); bad().click(); ev('closeModal()');
    await wait(300);
    check('la relance est annulée si la fenêtre se ferme', !d.getElementById('overlay').classList.contains('show'));
    // à l'envers au palier haut
    const rev = ev('(()=>{ let n = 0; for(let i = 0; i < 60; i++) if(nestingBuildRound(5).reverse) n++; return n; })()');
    check('palier haut : parfois de la plus grande à la plus petite', rev > 10 && rev < 50);
    check('jamais à l\'envers aux premiers paliers', ev('(()=>{ for(let i = 0; i < 40; i++) if(nestingBuildRound(2).reverse) return false; return true; })()'));
    check('dès 3 ans', ev('gameTypesForAge(3)').includes('nesting'));
    startGame('nesting', 1);
    const all = ev('gameSolution');
    for(const s of all) d.querySelector(s).click();
    check('toutes les boîtes rangées : mission réussie', await waitFor(()=> !!d.querySelector('.win-box'), 1500));
  }

  section('Combien de cubes ?');
  {
    let ok = true, possible = true, tiers = {};
    for(const tier of [1, 2, 3, 4, 5]){
      for(let r = 0; r < 25; r++){
        const st = ev(`cubesBuildStack(${tier})`);
        const cubes = ev(`cubesList(${json(st.heights)})`);
        if(cubes.length !== st.total) ok = false;
        // chaque cube du dessus repose sur un cube
        if(!cubes.every(c=> c.z === 0 || cubes.some(o=> o.x === c.x && o.y === c.y && o.z === c.z - 1))) possible = false;
        tiers[tier] = Math.max(tiers[tier] || 0, st.total);
      }
    }
    check('le nombre de cubes de la pile est la bonne réponse (cachés compris)', ok);
    check('seulement des piles possibles : chaque cube du dessus repose sur un autre', possible);
    check('la taille suit le palier (au plus 5, puis 8, puis 12 cubes)', tiers[1] <= 4 && tiers[2] <= 5 && tiers[3] <= 8 && tiers[5] <= 12 && tiers[5] > 8);
    check('palier haut : 2 rangées (des cubes cachés derrière ou dessous)', ev('cubesRound(5).d') === 2 && ev('cubesRound(5).h') === 3);
    startGame('cubes', 3);
    const sol = ev('gameSolution');
    const opts = [...d.querySelectorAll('.cube-opt')].map(b=> Number(b.dataset.v));
    check('3 réponses différentes, en chiffres et en points', opts.length === 3 && new Set(opts).size === 3 && !!d.querySelector('.cube-opt .cube-dots i'));
    check('le dessin compte autant de cubes que la bonne réponse', d.querySelectorAll('.cubes-svg .cube').length === Number(d.querySelector(sol[0]).dataset.v));
    const pile = d.querySelector('.cubes-svg').outerHTML;
    [...d.querySelectorAll('.cube-opt')].find(b=> b !== d.querySelector(sol[0])).click();
    await waitFor(()=> d.querySelector('.cubes-svg') && d.querySelector('.cubes-svg').outerHTML !== pile, 600);
    check('une mauvaise réponse : une autre pile', !!d.querySelector('.cubes-svg') && d.querySelector('.cubes-svg').outerHTML !== pile);
    startGame('cubes', 5);
    check('palier haut : le rappel « les cubes du dessus sont posés sur d\'autres »', /posés sur d'autres cubes/.test(d.querySelector('.cubes-tip').textContent));
  }

  section('Le jeu de l\'île');
  {
    check('les gigognes pour moins de 7 ans, les cubes ensuite', ev('worldGame("boites", 5)') === 'nesting' && ev('worldGame("boites", 8)') === 'cubes');
    ev(`closeModal(); currentProfile().age = 5; state.missions = ${LEVEL(36)}; save(); setWorld("boites", true); openGamePicker("kiki")`);
    check('sur l\'île, un enfant de 5 ans se voit proposer les gigognes', !!d.querySelector('.game-choice[data-game="nesting"]'));
    ev('closeModal(); currentProfile().age = 8; openGamePicker("boulon")');
    check('à 8 ans, Combien de cubes ?', !!d.querySelector('.game-choice[data-game="cubes"]'));
    ev('closeModal(); currentProfile().age = 0; setWorld("lagon", true)');
    check('dans l\'espace parents : « Formes et espace »', ev('SKILL_GROUPS.find(g=> g.id==="formes").games').includes('nesting') && ev('SKILL_GROUPS.find(g=> g.id==="formes").games').includes('cubes'));
  }

  /* ================= Phase 4 : l'histoire de la saison 2 ================= */
  section('Histoire « Les Rêves dans les boîtes »');
  {
    const ch = ev('STORY.boites');
    check('chapitre des Boîtes : guide Capucine, 3 phrases, au moins 2 énigmes en images', ch.guide === 'capucine' && ch.intro.length === 3 && ch.riddles.length >= 2 && ch.riddles.every(r=> r.opts.some(o=> o.ok) && r.tip));
    check('le prologue de la saison 2, lu par Capucine', ev('STORY_PROLOGUES[2].guide') === 'capucine' && ev('STORY_PROLOGUES[2].intro.length') >= 3);
    const eps = ev('EPISODES.boites');
    check('3 épisodes, racontés par Kiki, Boulon et Lola (jamais Capucine)', eps.length === 3 && eps.every(e=> ['kiki','boulon','lola'].includes(e.by)) && eps.every(e=> e.lines.length >= 2 && e.find));
    ev(`closeModal(); state.missions = ${LEVEL(36)}; state.storyMissions = {}; state.storyEpisodes = {}; save(); setCurrentWorld("boites")`);
    let seen = 0;
    for(let k = 0; k < 7; k++){ ev('noteStoryMission("boites")'); if(ev('maybeStoryEpisode()')){ seen++; ev('closeModal()'); } }
    check('les épisodes arrivent après la 2ᵉ, 4ᵉ et 7ᵉ mission sur l\'île', seen === 3 && ev('state.storyEpisodes.boites') === 3);
  }

  section('Grisou');
  {
    const g0 = ev('grisouSVG(0)'), g1 = ev('grisouSVG(1)');
    const color = (s)=> (s.match(/data-color="([^"]+)"/) || [])[1];
    check('Grisou est un nuage dessiné en SVG', /^<svg/.test(g0.trim()) && /Grisou/.test(g0));
    check('il reprend des couleurs à chaque île libérée', color(g0) !== color(g1) && color(ev('grisouSVG(2)')) !== color(g1));
    check('triste au début (larmes), il sourit ensuite', /8FC8F2/.test(g0) && !/8FC8F2/.test(g1));
    check('il progresse avec les énigmes de la saison 2 résolues', (ev('state.storySolved = {}; save()'), ev('skyIslandsFreed()')) === 0 && (ev('state.storySolved = { boites:true }; save()'), ev('skyIslandsFreed()')) === 1);
  }

  section('Journal à deux saisons');
  {
    ev(`closeModal(); state.missions = ${LEVEL(5)}; state.storySolved = { lagon:true }; save(); openStoryJournal()`);
    const secs = d.querySelectorAll('.story-season');
    check('deux parties : Saison 1 et le Ciel des Rêves', secs.length === 2 && /Saison 1/.test(secs[0].querySelector('h3').textContent) && /Ciel des Rêves/.test(secs[1].querySelector('h3').textContent));
    check('le Ciel est verrouillé avant le niveau 36 (chapitre fermé)', /🔒/.test(secs[1].querySelector('h3').textContent) && d.querySelector('.story-season[data-saison="2"] .story-chap[data-world="boites"]').disabled);
    check('la saison 1 est inchangée (8 chapitres)', secs[0].querySelectorAll('.story-chap[data-world]').length === 8);
    ev(`closeModal(); state.missions = ${LEVEL(36)}; state.storySolved = { lagon:true, boites:true }; save(); openStoryJournal()`);
    check('niveau 36 : le prologue et le chapitre des Boîtes (résolu) s\'ouvrent', !!d.querySelector('[data-prologue="2"]') && d.querySelector('.story-chap[data-world="boites"]').classList.contains('done'));
    d.querySelector('[data-prologue="2"]').click();
    check('relire le prologue', shown('.story-grisou') && /Rêves dans les boîtes/.test(d.querySelector('.char-header h2').textContent));
    ev('closeModal()');
  }

  await wait(200);
  check('aucune erreur JS', errs.length === 0);
  if(errs.length) console.log(errs);
  console.log(failed ? `\n${failed} échec(s), ${passed} réussi(s)` : `\nTous les tests de la saison 2 passent (${passed})`);
  process.exit(failed ? 1 : 0);
})();
