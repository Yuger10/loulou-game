// L'Île de la Musique (saison 2, île 4 ; proposition retenue par la joueuse) :
// l'île, ses 4 personnages, ses objets, sa série de squishies « Instruments »,
// ses deux mini-jeux (« Le rythme magique » et « Grave ou aigu ? ») et son
// chapitre « Le silence de l'île ». Même harnais que test/saison2.test.js.
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

  /* ================= L'île ================= */
  section('L\'île');
  {
    const css = page.manifestCss().map(f=> page.read(f)).join('\n');
    check('L\'Île de la Musique : saison 2, niveau 50 (conductor/niveaux.md), palier 6',
      ev('WORLDS.musique.saison') === 2 && ev('WORLDS.musique.level') === 50 && ev('WORLDS.musique.diff') === 6 && ev('WORLDS.musique.emoji') === '🎵');
    check('c\'est la 4ᵉ île du Ciel des Rêves', json(ev('worldsOf(2)').slice(0, 4)) === json(['boites', 'jouets', 'bonbons', 'musique']));
    check('son thème de couleurs (nuit, or, turquoise)', css.includes('body[data-world="musique"]{--world-sky'));
    check('son paysage (clavier-pont, arbres-flûtes, cascade de notes)', !!ev('ISLE_SCENERY.musique') && /2B2F6B/.test(ev('ISLE_SCENERY.musique(WORLDS.musique)')));
    check('sa musique : un thème joyeux au marimba, à 100 battements par minute', ev('MUSIC_THEMES.musique.lead') === 'marimba' && ev('MUSIC_THEMES.musique.bpm') === 100);
    const chars = ev('charsOf("musique").map(([id])=> id)');
    check('4 personnages : Viola, Boumbo, Flûtine, Piccolo', json(chars) === json(['viola','boumbo','flutine','piccolo']));
    check('chacun a son butin (2 objets de l\'île) et 3 répliques', chars.every(c=> ev(`CHARACTERS.${c}.loot.length===2 && CHARACTERS.${c}.loot.every(k=> ITEMS[k] && ITEMS[k].world==="musique") && CHARACTERS.${c}.texts.length===3`)));
    check('chacun a son dessin', chars.every(c=> ev(`charArtSVG(${json(c)})`).startsWith('<svg')));
    const items = ev('Object.keys(ITEMS).filter(k=> ITEMS[k].world==="musique")');
    check(`ses objets (${items.length}) : baguette de chef, partition, clé de sol, grelot doré, corde de violon, anche de flûte…`, items.length >= 6
      && ['baguettechef','partition','clesol','grelotdore','corde','anche'].every(k=> items.includes(k)));
    check('au moins 3 objets ne sont donnés par personne', items.filter(k=> !chars.some(c=> ev(`CHARACTERS.${c}.loot.includes(${json(k)})`))).length >= 3);
    check('2 recettes de fusion, avec des objets de l\'île', ev('Object.keys(CRAFTED).filter(k=> CRAFTED[k].world==="musique").length') === 2
      && ev('Object.keys(CRAFTED).filter(k=> CRAFTED[k].world==="musique").every(k=> Object.keys(CRAFTED[k].recipe).every(i=> ITEMS[i] && ITEMS[i].world==="musique"))'));
    check('4 à 5 décorations', [4, 5].includes(ev('decosOf("musique").length')));
    check('2 objets préférés par personnage, de l\'île', chars.every(c=> ev(`(()=>{ const f = favoritesOf(${json(c)}); return f.length===2 && f.every(k=> ITEMS[k].world==="musique" && !CHARACTERS.${c}.loot.includes(k)); })()`)));
    ev(`closeModal(); state.missions = ${LEVEL(50)}; save(); setWorld("musique", true); switchView("ile")`);
    check('sur l\'île : ses 4 personnages dans le paysage', d.querySelectorAll('#scene [data-char]').length === 4 || d.querySelectorAll('#scene .isle-char').length === 4);
    check('le thème de l\'île est appliqué', d.body.dataset.world === 'musique');
    ev(`state.missions = ${LEVEL(49)}; save()`);
    check('niveau 49 : l\'île est encore fermée', ev('worldUnlocked("musique")') === false && ev('availableItems().includes("clesol")') === false);
    ev('setWorld("lagon", true)');
  }

  section('Ouverture au niveau 50');
  {
    ev(`closeModal(); state.missions = ${LEVEL(50) - 1}; state.visited = WORLD_ORDER.filter(worldUnlocked); state.storySolved = { lagon:true, boites:true, jouets:true, bonbons:true }; save(); setCurrentWorld("bonbons")`);
    ev('playGame("count"); onMissionWin()');
    check('la mission qui fait passer au niveau 50', ev('level()') === 50);
    d.getElementById('btn-yay').click();
    await waitFor(()=> shown('.char-header'), 1500);
    check('le chapitre « Le silence de l\'île » s\'ouvre, raconté par Viola, avec Grisou', shown('.char-header') && /silence de l'île/.test(d.querySelector('.char-header h2').textContent) && shown('.story-grisou .grisou'));
    check('l\'île est marquée comme découverte', ev('state.visited.includes("musique")'));
    ev('closeModal()');
  }

  section('Série de squishies « Instruments »');
  {
    const ids = ev('squishiesOf("instruments")');
    const rar = ids.map(id=> ev(`SQUISHIES[${json(id)}].rarity`));
    check('6 modèles : 4 communs, 1 rare, 1 ✨', ids.length === 6 && rar.filter(r=> r==='commun').length === 4 && rar.filter(r=> r==='rare').length === 1 && rar.filter(r=> r==='brille').length === 1);
    check('le rare est Boumbo, le ✨ la lyre dorée', ev('SQUISHIES.boumbo.rarity') === 'rare' && ev('SQUISHIES["lyre-doree"].rarity') === 'brille');
    check('chaque modèle a son dessin', ids.every(id=> ev(`squishyArtSVG(${json(id)})`).includes('sq-face')));
    ev(`state.missions = ${LEVEL(49)}; save()`);
    check('avant l\'île : la série n\'apparaît pas', ev('squishySeriesAvailable("instruments")') === false && !ev('squishyMissing()').includes('boumbo'));
    ev(`state.missions = ${LEVEL(50)}; save(); openSquishyRoom("collection")`);
    check('ensuite, elle apparaît dans la chambre', !!d.querySelector('.sq-series[data-series="instruments"]'));
    ev('closeModal()');
  }

  /* ================= Le rythme magique ================= */
  section('Le rythme magique');
  {
    check('palier 1 : 3 coups tous pareils', ev('(()=>{ for(let i = 0; i < 40; i++){ const s = rhythmBuildRound(1).seq; if(s.length !== 3 || new Set(s).size !== 1 || s.includes("silence")) return false; } return true; })()'));
    check('palier 2 : 4 coups, des courts et des longs', ev('(()=>{ for(let i = 0; i < 40; i++){ const s = rhythmBuildRound(2).seq; if(s.length !== 4 || !s.includes("court") || !s.includes("long") || s.includes("silence")) return false; } return true; })()'));
    check('palier 3 : 5 symboles dont un silence, jamais au début ni à la fin', ev('(()=>{ for(let i = 0; i < 40; i++){ const s = rhythmBuildRound(3).seq; if(s.length !== 5 || s.filter(k=> k === "silence").length !== 1 || s[0] === "silence" || s[4] === "silence") return false; } return true; })()'));
    check('palier 5 : 6 symboles, deux silences jamais collés, et le rythme se lit avant de l\'entendre', ev('rhythmRound(5).read') === true && ev('(()=>{ for(let i = 0; i < 40; i++){ const s = rhythmBuildRound(5).seq; if(s.length !== 6 || s.filter(k=> k === "silence").length !== 2 || s.some((k, j)=> k === "silence" && s[j + 1] === "silence")) return false; } return true; })()'));
    startGame('rhythm', 2);
    check('le rythme est écrit en images (● court, ▬ long), et les boutons du tambour', d.querySelectorAll('#rh-score .rh-beat').length === 4 && !!d.querySelector('.rh-btn[data-k="court"]') && !!d.querySelector('.rh-btn[data-k="long"]') && !d.querySelector('.rh-btn[data-k="silence"]'));
    let sol = ev('gameSolution');
    d.querySelector(sol[0]).click();
    check('un bon coup s\'ajoute à la réponse', d.querySelectorAll('#rh-answer .rh-beat').length === 1);
    const q0 = ev('hint.q');
    const k1 = d.querySelector(sol[1]).dataset.k;
    d.querySelector(`.rh-btn[data-k="${k1 === 'court' ? 'long' : 'court'}"]`).click();
    await waitFor(()=> ev('hint.q') !== q0, 600);
    check('un mauvais coup : un autre rythme', ev('hint.q') !== q0 && d.querySelectorAll('#rh-answer .rh-beat').length === 0);
    startGame('rhythm', 3);
    check('palier 3 : le bouton « Chut » pour le silence', !!d.querySelector('.rh-btn[data-k="silence"]'));
    check('après l\'écoute, le rythme se cache : il faut le retenir', await waitFor(()=> d.getElementById('rh-score').classList.contains('covered') && /À toi/.test(d.getElementById('rh-state').textContent), 1500));
    ev('hintsFor("rhythm", hint.q)[1].fx.run()');
    check('l\'indice 2 fait réécouter et revoir le rythme (il se montre de nouveau)', !d.getElementById('rh-score').classList.contains('covered'));
    sol = ev('gameSolution');
    for(const s of sol) d.querySelector(s).click();
    check('le rythme rejoué en entier : mission réussie', await waitFor(()=> !!d.querySelector('.win-box'), 1500));
    startGame('rhythm', 5);
    check('palier 5 : « Lis le rythme » (rien n\'est joué avant)', /Lis le rythme/.test(d.getElementById('rh-state').textContent) && !d.getElementById('rh-score').classList.contains('covered'));
    check('pas de minuteur ; compétence « Mémoire et logique »', ev('timerFor("rhythm", 5)') === null && ev('SKILL_GROUPS.find(g=> g.id==="logique").games').includes('rhythm'));
  }

  /* ================= Grave ou aigu ? ================= */
  section('Grave ou aigu ?');
  {
    check('palier 1 : 2 cloches très éloignées, la plus aiguë ou la plus grave', ev('(()=>{ const s = new Set(); for(let i = 0; i < 40; i++){ const r = pitchBuildRound(1); s.add(r.ask); if(r.notes.length !== 2 || Math.abs(r.notes[0] - r.notes[1]) < 9) return false; } return s.has("high") && s.has("low"); })()'));
    check('paliers 2 à 4 : 3, 4 puis 5 cloches à ranger', [2, 3, 4].every((t, i)=> ev(`(()=>{ for(let k = 0; k < 20; k++){ const r = pitchBuildRound(${t}); if(r.ask !== "order" || r.notes.length !== ${3 + i}) return false; } return true; })()`)));
    check('palier 5 : parfois « la mélodie monte ou descend ? », 4 notes qui montent (ou descendent)', ev('(()=>{ let n = 0; for(let i = 0; i < 60; i++){ const r = pitchBuildRound(5); if(r.ask !== "melody") continue; n++; const m = r.notes; const up = m.every((x, j)=> !j || x > m[j - 1]), down = m.every((x, j)=> !j || x < m[j - 1]); if(m.length !== 4 || up !== r.up || (!up && !down)) return false; } return n > 5; })()'));
    startGame('pitch', 2);
    const sizes = [...d.querySelectorAll('.bell')].map(b=> ({ m: Number(b.dataset.m), w: parseFloat(b.querySelector('.bell-svg').style.width) }));
    check('une cloche grave est plus grande : le jeu se fait aussi sans le son', sizes.every(a=> sizes.every(b=> a.m >= b.m || a.w > b.w)));
    check('le bouton 🔈 fait écouter les cloches', !!d.getElementById('pitch-listen'));
    let sol = ev('gameSolution');
    d.querySelector(sol[0]).click();
    check('la plus grave d\'abord : elle reçoit le numéro 1', d.querySelector(sol[0]).classList.contains('done') && d.querySelector(sol[0]).querySelector('.bell-n').textContent === '1');
    const q0 = ev('hint.q');
    d.querySelector(sol[2]).click();
    await waitFor(()=> ev('hint.q') !== q0, 600);
    check('une cloche dans le désordre : d\'autres notes', ev('hint.q') !== q0 && !d.querySelector('.bell.done'));
    let tries = 0;
    do { startGame('pitch', 5); tries++; } while(!d.querySelector('.pitch-melody') && tries < 30);
    check('la mélodie : des points qui montent ou descendent, et deux réponses', d.querySelectorAll('.pm-dot').length === 4 && d.querySelectorAll('.pitch-dir').length === 2);
    sol = ev('gameSolution');
    d.querySelector(sol[0]).click();
    check('le bon sens : mission réussie', await waitFor(()=> !!d.querySelector('.win-box'), 1500));
    check('pas de minuteur ; compétence « Mémoire et logique »', ev('timerFor("pitch", 5)') === null && ev('SKILL_GROUPS.find(g=> g.id==="logique").games').includes('pitch'));
  }

  section('Le jeu de l\'île');
  {
    check('le rythme pour moins de 7 ans, grave ou aigu ensuite', ev('worldGame("musique", 5)') === 'rhythm' && ev('worldGame("musique", 8)') === 'pitch');
    check('proposés dès 5 ans (pas avant)', ev('gameTypesForAge(5)').includes('rhythm') && ev('gameTypesForAge(5)').includes('pitch') && !ev('gameTypesForAge(4)').includes('rhythm'));
    ev(`closeModal(); currentProfile().age = 5; state.missions = ${LEVEL(50)}; save(); setWorld("musique", true); openGamePicker("boumbo")`);
    check('sur l\'île, un enfant de 5 ans se voit proposer le rythme', !!d.querySelector('.game-choice[data-game="rhythm"]'));
    ev('closeModal(); currentProfile().age = 8; openGamePicker("flutine")');
    check('à 8 ans, grave ou aigu', !!d.querySelector('.game-choice[data-game="pitch"]'));
    ev('closeModal(); currentProfile().age = 0; setWorld("lagon", true)');
  }

  /* ================= L'histoire ================= */
  section('Histoire « Le silence de l\'île »');
  {
    const ch = ev('STORY.musique');
    check('guide Viola, 3 phrases, au moins 2 énigmes en images avec un coup de pouce', ch.guide === 'viola' && ch.intro.length === 3 && ch.riddles.length >= 2 && ch.riddles.every(r=> r.opts.filter(o=> o.ok).length === 1 && r.tip));
    check('Grisou a enfermé le rêve dans une boîte à musique ; il devient turquoise', /Grisou/.test(ch.intro.join(' ')) && /boîte à musique/.test(ch.intro.join(' ')) && /turquoise/.test(ch.success));
    ev('closeModal(); state.coins = 0; state.storySolved = { lagon:true, boites:true, jouets:true, bonbons:true }; state.squishies = squishyFreshState(); save(); storyWin("musique")');
    const coins = ev('state.coins');
    check('la récompense : des pièces et une boîte surprise de la série Instruments', coins === ch.reward && json(ev('state.squishies.boxes')) === json(['instruments']));
    ev('closeModal(); openStoryChapter("musique")');
    while(d.getElementById('story-next') && /Suite/.test(d.getElementById('story-next').textContent)) d.getElementById('story-next').click();
    const last = d.getElementById('story-next');
    check('relire le chapitre résolu : pas de nouvelle énigme', !!last && /Continuer/.test(last.textContent));
    last.click();
    check('… ni de nouvelle récompense', ev('state.coins') === coins && ev('squishyBoxCount()') === 1 && !shown('.story-opt'));
    check('Grisou reprend des couleurs : 4 îles du Ciel libérées', ev('skyIslandsFreed()') === 4);
    const eps = ev('EPISODES.musique');
    check('3 épisodes, racontés par Boumbo, Flûtine et Piccolo (jamais Viola)', eps.length === 3 && eps.every(e=> ['boumbo','flutine','piccolo'].includes(e.by)) && eps.every(e=> e.lines.length >= 2 && e.find));
    ev(`closeModal(); state.missions = ${LEVEL(50)}; state.storyMissions = {}; state.storyEpisodes = {}; save(); setCurrentWorld("musique")`);
    let seen = 0;
    for(let k = 0; k < 7; k++){ ev('noteStoryMission("musique")'); if(ev('maybeStoryEpisode()')){ seen++; ev('closeModal()'); } }
    check('les épisodes arrivent après la 2ᵉ, 4ᵉ et 7ᵉ mission sur l\'île', seen === 3 && ev('state.storyEpisodes.musique') === 3);
    ev('closeModal(); setCurrentWorld("lagon")');
  }

  check('aucune erreur JS', errs.length === 0);
  if(errs.length) console.log('   ' + errs.slice(0, 5).join('\n   '));
  console.log(failed ? `\n${failed} échec(s), ${passed} réussi(s)` : `\nTous les tests de l'Île de la Musique passent (${passed})`);
  process.exit(failed ? 1 : 0);
})();
