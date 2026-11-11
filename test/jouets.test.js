// Le Coffre aux Jouets Doux (saison 2, île 2 ; idée de la joueuse : « un monde
// de jouets qui ressemblent à des squishies ») : l'île, ses 4 personnages,
// ses objets, sa série de squishies « Jouets doux », ses deux mini-jeux
// (« Les paquets de jouets » et « L'étagère magique ») et son chapitre
// « Les jouets qui ne jouent plus ». Même harnais que test/saison2.test.js.
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
const shown = (sel)=> d.getElementById('overlay').classList.contains('show') && !!d.querySelector(sel);
const json = (x)=> JSON.stringify(x);
const LEVEL = (n)=> (n - 1) * 5;   // missions pour être au niveau n
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
  ev('closeModal(); state.storySolved = { lagon: true }; state.skyIntroSeen = true; save()');

  /* ================= Phase 1 : l'île ================= */
  section('L\'île');
  {
    const css = page.manifestCss().map(f=> page.read(f)).join('\n');
    check('Le Coffre aux Jouets Doux : saison 2, niveau 38 (conductor/niveaux.md), palier 6',
      ev('WORLDS.jouets.saison') === 2 && ev('WORLDS.jouets.level') === 38 && ev('WORLDS.jouets.diff') === 6 && ev('WORLDS.jouets.emoji') === '🧸');
    check('c\'est la 2ᵉ île du Ciel des Rêves, après les Boîtes', json(ev('worldsOf(2)').slice(0, 2)) === json(['boites', 'jouets']));
    check('son thème de couleurs (crème, rose, menthe)', css.includes('body[data-world="jouets"]{--world-sky'));
    check('son paysage (le grand coffre ouvert, l\'étagère, les cubes)', !!ev('ISLE_SCENERY.jouets') && /<rect/.test(ev('ISLE_SCENERY.jouets(WORLDS.jouets)')));
    check('sa musique : une boîte à musique (célesta), douce, à 80 battements par minute', ev('MUSIC_THEMES.jouets.lead') === 'celesta' && ev('MUSIC_THEMES.jouets.bpm') === 80);
    const chars = ev('charsOf("jouets").map(([id])=> id)');
    check('4 personnages : Nougat, Cocotte, Gloups, Rainette', json(chars) === json(['nougat','cocotte','gloups','rainette']));
    check('chacun a son butin (2 objets de l\'île) et 3 répliques', chars.every(c=> ev(`CHARACTERS.${c}.loot.length===2 && CHARACTERS.${c}.loot.every(k=> ITEMS[k] && ITEMS[k].world==="jouets") && CHARACTERS.${c}.texts.length===3`)));
    check('chacun a son dessin', chars.every(c=> ev(`charArtSVG(${json(c)})`).startsWith('<svg')));
    const items = ev('Object.keys(ITEMS).filter(k=> ITEMS[k].world==="jouets")');
    check(`ses objets (${items.length}) : ruban, bouton de nounours, grelot, ressort, étoile en feutrine, mini-mochi…`, items.length >= 6
      && ['rubanpeluche','boutonours','grelot','ressort','etoilefeutrine','minimochi'].every(k=> items.includes(k)));
    check('au moins 3 objets ne sont donnés par personne', items.filter(k=> !chars.some(c=> ev(`CHARACTERS.${c}.loot.includes(${json(k)})`))).length >= 3);
    check('2 recettes de fusion, avec des objets de l\'île', ev('Object.keys(CRAFTED).filter(k=> CRAFTED[k].world==="jouets").length') === 2
      && ev('Object.keys(CRAFTED).filter(k=> CRAFTED[k].world==="jouets").every(k=> Object.keys(CRAFTED[k].recipe).every(i=> ITEMS[i] && ITEMS[i].world==="jouets"))'));
    check('4 à 5 décorations', [4, 5].includes(ev('decosOf("jouets").length')));
    check('2 objets préférés par personnage, de l\'île', chars.every(c=> ev(`(()=>{ const f = favoritesOf(${json(c)}); return f.length===2 && f.every(k=> ITEMS[k].world==="jouets" && !CHARACTERS.${c}.loot.includes(k)); })()`)));
    ev(`closeModal(); state.missions = ${LEVEL(38)}; save(); setWorld("jouets", true); switchView("ile")`);
    check('sur l\'île : ses 4 personnages dans le paysage', d.querySelectorAll('#scene [data-char]').length === 4 || d.querySelectorAll('#scene .isle-char').length === 4);
    check('le thème de l\'île est appliqué', d.body.dataset.world === 'jouets');
    check('ses objets font partie des objets accessibles', ev('availableItems().includes("grelot")'));
    ev(`state.missions = ${LEVEL(37)}; save()`);
    check('niveau 37 : l\'île est encore fermée', ev('worldUnlocked("jouets")') === false && ev('availableItems().includes("grelot")') === false);
    ev('setWorld("lagon", true)');
  }

  section('Ouverture au niveau 38');
  {
    ev(`closeModal(); state.missions = ${LEVEL(38) - 1}; state.visited = WORLD_ORDER.filter(worldUnlocked); state.storySolved = { lagon:true, boites:true }; save(); setCurrentWorld("boites")`);
    ev('playGame("count"); onMissionWin()');
    check('la mission qui fait passer au niveau 38', ev('level()') === 38);
    d.getElementById('btn-yay').click();
    await waitFor(()=> shown('.char-header'), 1500);
    check('le chapitre « Les jouets qui ne jouent plus » s\'ouvre, raconté par Nougat, avec Grisou', shown('.char-header') && /jouets qui ne jouent plus/.test(d.querySelector('.char-header h2').textContent) && shown('.story-grisou .grisou'));
    check('l\'île est marquée comme découverte', ev('state.visited.includes("jouets")'));
    ev('closeModal()');
  }

  section('Série de squishies « Jouets doux »');
  {
    const ids = ev('squishiesOf("jouets")');
    const rar = ids.map(id=> ev(`SQUISHIES[${json(id)}].rarity`));
    check('6 modèles : 4 communs, 1 rare, 1 ✨', ids.length === 6 && rar.filter(r=> r==='commun').length === 4 && rar.filter(r=> r==='rare').length === 1 && rar.filter(r=> r==='brille').length === 1);
    check('le rare est Nougat, le ✨ l\'ourson arc-en-ciel', ev('SQUISHIES.nougat.rarity') === 'rare' && ev('SQUISHIES["ourson-arc"].rarity') === 'brille');
    check('chaque modèle a son dessin', ids.every(id=> ev(`squishyArtSVG(${json(id)})`).includes('sq-face')));
    ev(`state.missions = ${LEVEL(37)}; save()`);
    check('avant l\'île : la série n\'apparaît pas', ev('squishySeriesAvailable("jouets")') === false && !ev('squishyMissing()').includes('nougat'));
    ev(`state.missions = ${LEVEL(38)}; save(); openSquishyRoom("collection")`);
    check('ensuite, elle apparaît dans la chambre', !!d.querySelector('.sq-series[data-series="jouets"]'));
    ev('closeModal(); state.squishies = squishyFreshState(); save(); storyWin("jouets")');
    check('l\'énigme du coffre donne une boîte de la série Jouets doux', json(ev('state.squishies.boxes')) === json(['jouets']) && shown('.sq-reward-line'));
    ev('closeModal(); storyWin("jouets")');
    check('… une seule fois', ev('squishyBoxCount()') === 1);
    ev('closeModal()');
  }

  /* ================= Phase 2 : Les paquets de jouets ================= */
  section('Les paquets de jouets');
  {
    const sizesOf = (tier)=> new Set(Array.from({ length: 60 }, ()=> ev(`packsBuildRound(${tier}).size`)));
    check('palier 1 : paquets de 2, 2 ou 3 paquets', [...sizesOf(1)].every(s=> s === 2) && ev('(()=>{ for(let i = 0; i < 40; i++){ const r = packsBuildRound(1); if(r.n < 2 || r.n > 3 || r.extra) return false; } return true; })()'));
    check('palier 2 : paquets de 2 et de 5', json([...sizesOf(2)].sort((a, b)=> a - b)) === json([2, 5]));
    check('palier 3 et plus : paquets de 2, 5 et 10', json([...sizesOf(4)].sort((a, b)=> a - b)) === json([2, 5, 10]));
    check('palier 4 : parfois un jouet tout seul en plus', ev('(()=>{ let n = 0; for(let i = 0; i < 60; i++) if(packsBuildRound(4).extra) n++; return n > 10 && n < 50; })()'));
    check('le total = paquets × taille (+ le jouet seul)', ev('(()=>{ for(let i = 0; i < 60; i++){ const r = packsBuildRound(5); if(r.total !== r.n * r.size + r.extra) return false; } return true; })()'));
    check('3 réponses différentes, dont la bonne', ev('(()=>{ for(let i = 0; i < 60; i++){ const r = packsBuildRound(1 + i % 5), o = packsOptions(r); if(o.length !== 3 || new Set(o).size !== 3 || !o.includes(r.total) || o.some(x=> x < 1)) return false; } return true; })()'));
    startGame('packs', 3);
    const sol = ev('gameSolution');
    check('le dessin compte autant de jouets que la bonne réponse', d.querySelectorAll('.packs-stage .pack-toy').length === Number(d.querySelector(sol[0]).dataset.v));
    check('les jouets sont rangés en paquets', d.querySelectorAll('.packs-stage .pack').length >= 2);
    const before = d.querySelector('.packs-stage').outerHTML, q0 = ev('hint.q');
    [...d.querySelectorAll('.pack-opt')].find(b=> b !== d.querySelector(sol[0])).click();
    await waitFor(()=> ev('hint.q') !== q0, 600);
    check('une mauvaise réponse : une autre collection de paquets', ev('hint.q') !== q0 && !!d.querySelector('.packs-stage'));
    check('2 indices : compter de paquet en paquet, sans jamais dire le total', ev(`(()=>{
      for(let i = 0; i < 100; i++){
        const r = packsBuildRound(1 + i % 5), q = { size:r.size, n:r.n, extra:r.extra, label:r.label, total:r.total };
        const lv = hintsFor("packs", q);
        if(lv.length !== 2 || !/paquet/.test(lv[0].say)) return false;
        if(lv.some(h=> (h.say.match(/[0-9]+/g) || []).map(Number).includes(r.total))) return false;
      }
      return true; })()`));
    startGame('packs', 5);
    check('palier 5 : « 4 paquets de 5 » écrit sous l\'image, et l\'écriture × en indice', /paquets? de (2|5|10)/.test(d.querySelector('.packs-label').textContent) && /×/.test(ev('hintsFor("packs", hint.q)[1].say')));
    check('pas de minuteur', ev('timerFor("packs", 5)') === null);
    check('dans l\'espace parents : « Nombres »', ev('SKILL_GROUPS.find(g=> g.id==="nombres").games').includes('packs'));
  }

  /* ================= Phase 3 : L'étagère magique ================= */
  section('L\'étagère magique');
  {
    check('palier 1 : 2 × 2 cases, un jouet ; palier 2 : 3 × 3, deux jouets ; palier 4 : 4 × 4',
      ev('shelfRound(1).size') === 2 && ev('shelfRound(1).toys') === 1 && ev('shelfRound(2).size') === 3 && ev('shelfRound(2).toys') === 2 && ev('shelfRound(4).size') === 4);
    const modes = (tier)=> new Set(Array.from({ length: 60 }, ()=> ev(`shelfBuildRound(${tier}).mode`)));
    check('paliers 1 et 2 : on range les jouets', json([...modes(1)]) === json(['place']) && json([...modes(2)]) === json(['place']));
    check('palier 3 : parfois « quel jouet va dans cette case ? »', modes(3).has('find') && modes(3).has('place'));
    check('palier 5 : parfois les coordonnées dites à voix haute', modes(5).has('coords'));
    check('chaque case est à la croisée de sa ligne (couleur) et de sa colonne (forme)', ev('(()=>{ for(let i = 0; i < 40; i++){ const r = shelfBuildRound(1 + i % 5); const all = r.mode === "find" ? [r.target, ...r.options] : r.steps; if(!all.every(t=> r.rows.includes(t.color) && r.cols.includes(t.shape))) return false; } return true; })()'));
    check('question inverse : 3 jouets différents, dont le bon', ev('(()=>{ for(let i = 0; i < 80; i++){ const r = shelfBuildRound(3); if(r.mode !== "find") continue; const k = r.options.map(o=> o.color + o.shape); if(new Set(k).size !== 3 || !k.includes(r.target.color + r.target.shape)) return false; } return true; })()'));
    // ranger : le panier montre les jouets, l'étagère ses lignes et colonnes
    let tries = 0;
    do { startGame('shelf', 2); tries++; } while(!d.querySelector('.shelf-todo') && tries < 10);
    check('l\'étagère : une ligne par couleur, une colonne par forme (3 × 3)', d.querySelectorAll('.shelf-head.row').length === 3 && d.querySelectorAll('.shelf-head.col').length === 3 && d.querySelectorAll('.shelf-cell').length === 9);
    check('le panier : les jouets à ranger, le premier en avant', d.querySelectorAll('.shelf-todo').length === 2 && d.querySelector('.shelf-todo').classList.contains('now'));
    const sol = ev('gameSolution');
    d.querySelector(sol[0]).click();
    check('le bon jouet rangé : il apparaît dans sa case, au tour du suivant', d.querySelector(sol[0]).classList.contains('filled') && d.querySelector('.shelf-todo[data-i="1"]').classList.contains('now'));
    check('l\'indice suit le jouet en cours (sa ligne)', ev('hint.q.color') === d.querySelector('.shelf-todo[data-i="1"]').dataset.color);
    const lv = ev('hintsFor("shelf", hint.q)');
    check('2 indices : la méthode, puis la ligne (jamais la colonne de la réponse)', lv.length === 2 && /ligne/.test(lv[0].say) && !lv[1].say.includes(`colonne ${ev('hint.q.shape')}`));
    const q0 = ev('hint.q');
    const wrong = [...d.querySelectorAll('.shelf-cell:not(.filled)')].find(c=> c !== d.querySelector(sol[1]));
    wrong.click();
    await waitFor(()=> ev('hint.q') !== q0 && !d.querySelector('.shelf-cell.filled'), 600);
    check('une mauvaise case : une autre étagère', !d.querySelector('.shelf-cell.filled'));
    // les coordonnées
    tries = 0;
    do { startGame('shelf', 5); tries++; } while(!d.querySelector('.shelf-gift') && tries < 30);
    check('palier 5 : « Pose le cadeau ici : ligne rose, colonne étoile » (écrit et dit)', /ligne (rose|bleu|jaune|vert), colonne (rond|carré|triangle|étoile|cœur)/.test(d.getElementById('shelf-ask').textContent));
    for(const s of ev('gameSolution')) d.querySelector(s).click();
    check('tous les cadeaux posés : mission réussie', await waitFor(()=> !!d.querySelector('.win-box'), 1500));
    check('pas de minuteur', ev('timerFor("shelf", 5)') === null);
    check('dans l\'espace parents : « Formes et espace »', ev('SKILL_GROUPS.find(g=> g.id==="formes").games').includes('shelf'));
  }

  section('Le jeu de l\'île');
  {
    check('les paquets pour moins de 7 ans, l\'étagère ensuite', ev('worldGame("jouets", 5)') === 'packs' && ev('worldGame("jouets", 8)') === 'shelf');
    check('proposés dès 5 ans (pas avant)', ev('gameTypesForAge(5)').includes('packs') && ev('gameTypesForAge(5)').includes('shelf') && !ev('gameTypesForAge(4)').includes('packs'));
    ev(`closeModal(); currentProfile().age = 5; state.missions = ${LEVEL(38)}; save(); setWorld("jouets", true); openGamePicker("gloups")`);
    check('sur l\'île, un enfant de 5 ans se voit proposer les paquets', !!d.querySelector('.game-choice[data-game="packs"]'));
    ev('closeModal(); currentProfile().age = 8; openGamePicker("cocotte")');
    check('à 8 ans, l\'étagère magique', !!d.querySelector('.game-choice[data-game="shelf"]'));
    ev('closeModal(); currentProfile().age = 0; setWorld("lagon", true)');
  }

  /* ================= Phase 4 : l'histoire ================= */
  section('Histoire « Les jouets qui ne jouent plus »');
  {
    const ch = ev('STORY.jouets');
    check('guide Nougat, 3 phrases, au moins 2 énigmes en images avec un coup de pouce', ch.guide === 'nougat' && ch.intro.length === 3 && ch.riddles.length >= 2 && ch.riddles.every(r=> r.opts.filter(o=> o.ok).length === 1 && r.tip));
    check('Grisou fait partie de l\'histoire (le rêve de « jouer ensemble »)', /Grisou/.test(ch.intro.join(' ')) && /Grisou/.test(ch.success));
    ev('closeModal(); state.coins = 0; state.storySolved = { lagon:true, boites:true }; state.squishies = squishyFreshState(); save(); storyWin("jouets")');
    const coins = ev('state.coins');
    check('la récompense : des pièces et une boîte surprise de la série de l\'île', coins === ch.reward && json(ev('state.squishies.boxes')) === json(['jouets']));
    ev('closeModal(); openStoryChapter("jouets")');
    while(d.getElementById('story-next') && /Suite/.test(d.getElementById('story-next').textContent)) d.getElementById('story-next').click();
    const last = d.getElementById('story-next');
    check('relire le chapitre résolu : pas de nouvelle énigme', !!last && /Continuer/.test(last.textContent));
    last.click();
    check('… ni de nouvelle récompense', ev('state.coins') === coins && ev('squishyBoxCount()') === 1 && !shown('.story-opt'));
    check('Grisou reprend des couleurs : 2 îles du Ciel libérées', ev('skyIslandsFreed()') === 2);
    const eps = ev('EPISODES.jouets');
    check('3 épisodes, racontés par Cocotte, Gloups et Rainette (jamais Nougat)', eps.length === 3 && eps.every(e=> ['cocotte','gloups','rainette'].includes(e.by)) && eps.every(e=> e.lines.length >= 2 && e.find));
    ev(`closeModal(); state.missions = ${LEVEL(38)}; state.storyMissions = {}; state.storyEpisodes = {}; save(); setCurrentWorld("jouets")`);
    let seen = 0;
    for(let k = 0; k < 7; k++){ ev('noteStoryMission("jouets")'); if(ev('maybeStoryEpisode()')){ seen++; ev('closeModal()'); } }
    check('les épisodes arrivent après la 2ᵉ, 4ᵉ et 7ᵉ mission sur l\'île', seen === 3 && ev('state.storyEpisodes.jouets') === 3);
    ev('closeModal(); openStoryJournal()');
    check('le journal : le chapitre des Jouets dans la partie du Ciel des Rêves', !!d.querySelector('.story-season[data-saison="2"] .story-chap[data-world="jouets"]'));
    ev('closeModal(); setCurrentWorld("lagon")');
  }

  check('aucune erreur JS', errs.length === 0);
  if(errs.length) console.log('   ' + errs.slice(0, 5).join('\n   '));
  console.log(failed ? `\n${failed} échec(s), ${passed} réussi(s)` : `\nTous les tests du Coffre aux Jouets Doux passent (${passed})`);
  process.exit(failed ? 1 : 0);
})();
