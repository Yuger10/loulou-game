// Le Royaume des Bonbons (saison 2, île 3 ; proposition retenue par la
// joueuse) : l'île, ses 4 personnages, ses objets, sa série de squishies
// « Bonbons », ses deux mini-jeux (« Le gâteau partagé » et « La recette »)
// et son chapitre « La fête sans gâteau ». Même harnais que test/saison2.test.js.
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
    check('Le Royaume des Bonbons : saison 2, niveau 44 (conductor/niveaux.md), palier 6',
      ev('WORLDS.bonbons.saison') === 2 && ev('WORLDS.bonbons.level') === 44 && ev('WORLDS.bonbons.diff') === 6 && ev('WORLDS.bonbons.emoji') === '🍭');
    check('c\'est la 3ᵉ île du Ciel des Rêves, après les Boîtes et les Jouets Doux', json(ev('worldsOf(2)').slice(0, 3)) === json(['boites', 'jouets', 'bonbons']));
    check('son thème de couleurs (framboise, caramel, vanille)', css.includes('body[data-world="bonbons"]{--world-sky'));
    check('son paysage (maisons en pain d\'épices, rivière de sirop, arbres-sucettes)', !!ev('ISLE_SCENERY.bonbons') && /ls-lolly/.test(ev('ISLE_SCENERY.bonbons(WORLDS.bonbons)')));
    check('sa musique : une petite valse en pizzicato, à 92 battements par minute', ev('MUSIC_THEMES.bonbons.lead') === 'pluck' && ev('MUSIC_THEMES.bonbons.bpm') === 92);
    const chars = ev('charsOf("bonbons").map(([id])=> id)');
    check('4 personnages : Praline, Chouquette, Cacao, Berlingot', json(chars) === json(['praline','chouquette','cacao','berlingot']));
    check('chacun a son butin (2 objets de l\'île) et 3 répliques', chars.every(c=> ev(`CHARACTERS.${c}.loot.length===2 && CHARACTERS.${c}.loot.every(k=> ITEMS[k] && ITEMS[k].world==="bonbons") && CHARACTERS.${c}.texts.length===3`)));
    check('chacun a son dessin', chars.every(c=> ev(`charArtSVG(${json(c)})`).startsWith('<svg')));
    const items = ev('Object.keys(ITEMS).filter(k=> ITEMS[k].world==="bonbons")');
    check(`ses objets (${items.length}) : sucre glace, cerise confite, pépite de chocolat, réglisse, cuillère en bois, moule à gâteau…`, items.length >= 6
      && ['sucreglace','cerise','pepite','reglisse','cuillere','moule'].every(k=> items.includes(k)));
    check('au moins 3 objets ne sont donnés par personne', items.filter(k=> !chars.some(c=> ev(`CHARACTERS.${c}.loot.includes(${json(k)})`))).length >= 3);
    check('2 recettes de fusion, avec des objets de l\'île', ev('Object.keys(CRAFTED).filter(k=> CRAFTED[k].world==="bonbons").length') === 2
      && ev('Object.keys(CRAFTED).filter(k=> CRAFTED[k].world==="bonbons").every(k=> Object.keys(CRAFTED[k].recipe).every(i=> ITEMS[i] && ITEMS[i].world==="bonbons"))'));
    check('4 à 5 décorations', [4, 5].includes(ev('decosOf("bonbons").length')));
    check('2 objets préférés par personnage, de l\'île', chars.every(c=> ev(`(()=>{ const f = favoritesOf(${json(c)}); return f.length===2 && f.every(k=> ITEMS[k].world==="bonbons" && !CHARACTERS.${c}.loot.includes(k)); })()`)));
    ev(`closeModal(); state.missions = ${LEVEL(44)}; save(); setWorld("bonbons", true); switchView("ile")`);
    check('sur l\'île : ses 4 personnages dans le paysage', d.querySelectorAll('#scene [data-char]').length === 4 || d.querySelectorAll('#scene .isle-char').length === 4);
    check('le thème de l\'île est appliqué', d.body.dataset.world === 'bonbons');
    check('ses objets font partie des objets accessibles', ev('availableItems().includes("cerise")'));
    ev(`state.missions = ${LEVEL(43)}; save()`);
    check('niveau 43 : l\'île est encore fermée', ev('worldUnlocked("bonbons")') === false && ev('availableItems().includes("cerise")') === false);
    ev('setWorld("lagon", true)');
  }

  section('Ouverture au niveau 44');
  {
    ev(`closeModal(); state.missions = ${LEVEL(44) - 1}; state.visited = WORLD_ORDER.filter(worldUnlocked); state.storySolved = { lagon:true, boites:true, jouets:true }; save(); setCurrentWorld("jouets")`);
    ev('playGame("count"); onMissionWin()');
    check('la mission qui fait passer au niveau 44', ev('level()') === 44);
    d.getElementById('btn-yay').click();
    await waitFor(()=> shown('.char-header'), 1500);
    check('le chapitre « La fête sans gâteau » s\'ouvre, raconté par Praline, avec Grisou', shown('.char-header') && /fête sans gâteau/.test(d.querySelector('.char-header h2').textContent) && shown('.story-grisou .grisou'));
    check('l\'île est marquée comme découverte', ev('state.visited.includes("bonbons")'));
    ev('closeModal()');
  }

  section('Série de squishies « Bonbons »');
  {
    const ids = ev('squishiesOf("bonbons")');
    const rar = ids.map(id=> ev(`SQUISHIES[${json(id)}].rarity`));
    check('6 modèles : 4 communs, 1 rare, 1 ✨', ids.length === 6 && rar.filter(r=> r==='commun').length === 4 && rar.filter(r=> r==='rare').length === 1 && rar.filter(r=> r==='brille').length === 1);
    check('le rare est Praline, le ✨ le gâteau à étages doré', ev('SQUISHIES.praline.rarity') === 'rare' && ev('SQUISHIES["gateau-etages"].rarity') === 'brille');
    check('chaque modèle a son dessin', ids.every(id=> ev(`squishyArtSVG(${json(id)})`).includes('sq-face')));
    ev(`state.missions = ${LEVEL(43)}; save()`);
    check('avant l\'île : la série n\'apparaît pas', ev('squishySeriesAvailable("bonbons")') === false && !ev('squishyMissing()').includes('praline'));
    ev(`state.missions = ${LEVEL(44)}; save(); openSquishyRoom("collection")`);
    check('ensuite, elle apparaît dans la chambre', !!d.querySelector('.sq-series[data-series="bonbons"]'));
    ev('closeModal()');
  }

  /* ================= Phase 2 : Le gâteau partagé ================= */
  section('Le gâteau partagé');
  {
    const asks = (tier)=> new Set(Array.from({ length: 40 }, ()=> ev(`shareBuildRound(${tier}).ask`)));
    check('paliers 1 et 2 : « quel gâteau est coupé en parts égales ? »', json([...asks(1)]) === json(['fair']) && json([...asks(2)]) === json(['fair']));
    check('palier 1 : en 2 parts ; palier 2 : en 2 ou en 4', ev('(()=>{ for(let i = 0; i < 30; i++) if(shareBuildRound(1).n !== 2) return false; return true; })()')
      && ev('(()=>{ const s = new Set(); for(let i = 0; i < 40; i++) s.add(shareBuildRound(2).n); return s.has(2) && s.has(4); })()'));
    check('paliers 3 et 4 : montrer la moitié, le tiers, le quart', json([...asks(3)]) === json(['show']) && ev('(()=>{ const s = new Set(); for(let i = 0; i < 60; i++) s.add(shareBuildRound(4).n); return s.size === 3; })()'));
    check('palier 5 : les écritures ½ ⅓ ¼, et « combien de… pour faire… ? »', asks(5).has('write') && asks(5).has('whole'));
    check('un seul gâteau juste parmi les 3 (parts égales, parts inégales)', ev('(()=>{ for(let i = 0; i < 60; i++){ const r = shareBuildRound(1 + i % 2); if(r.opts.filter(o=> o.equal).length !== 1) return false; if(r.opts.some(o=> Math.abs(o.parts.reduce((a, b)=> a + b, 0) - 1) > 1e-9)) return false; if(r.opts.filter(o=> !o.equal).some(o=> o.parts.every(p=> Math.abs(p - o.parts[0]) < 1e-9))) return false; } return true; })()'));
    check('palier 4 : le piège a le bon nombre de parts, mais inégales', ev('(()=>{ for(let i = 0; i < 40; i++){ const r = shareBuildRound(4); const t = r.opts.find(o=> !o.equal); if(!t || t.parts.length !== r.n) return false; if(r.opts.filter(o=> o.equal && o.n === r.n).length !== 1) return false; } return true; })()'));
    startGame('share', 3);
    const sol = ev('gameSolution');
    const good = d.querySelector(sol[0]);
    const n = Number(d.querySelector('.share-options').dataset.n);
    check('la bonne réponse : le gâteau coupé en autant de parts égales que la fraction demandée', good.querySelectorAll('.share-part').length === n && good.dataset.equal === '1');
    check('la part colorée est dessinée, et la consigne dit « la moitié » ou « le quart »', /la moitié|le quart/.test(d.getElementById('modal-body').textContent) && good.innerHTML.includes('#FF8FB8'));
    const q0 = ev('hint.q');
    [...d.querySelectorAll('.share-opt')].find(b=> b !== good).click();
    await waitFor(()=> ev('hint.q') !== q0, 600);
    check('une erreur : un autre gâteau', ev('hint.q') !== q0 && !!d.querySelector('.share-opt'));
    let tries = 0;
    do { startGame('share', 5); tries++; } while(!d.querySelector('.share-frac') && tries < 20);
    check('palier 5 : ½, ⅓ et ¼ à choisir pour la part colorée', [...d.querySelectorAll('.share-frac')].map(b=> b.textContent.trim()).sort().join('') === ['½','⅓','¼'].sort().join(''));
    const lv = ev('hintsFor("share", hint.q)');
    check('ses indices : le chiffre du bas, puis compter les parts (jamais l\'écriture)', lv.length === 2 && /bas/.test(lv[0].say) && !/[½⅓¼]/.test(lv[1].say));
    check('pas de minuteur ; compétence « Calcul » dans l\'espace parents', ev('timerFor("share", 5)') === null && ev('SKILL_GROUPS.find(g=> g.id==="calcul").games').includes('share'));
  }

  /* ================= Phase 3 : La recette ================= */
  section('La recette');
  {
    const asks = (tier)=> new Set(Array.from({ length: 40 }, ()=> ev(`recipeBuildRound(${tier}).ask`)));
    check('palier 1 : le bol le plus (le moins) rempli, ou la balance', asks(1).has('bowls') && asks(1).has('balance') && asks(1).size === 2);
    check('palier 2 : compter les cuillères', json([...asks(2)]) === json(['spoons']));
    check('palier 3 : cuillères jusqu\'à 10, ou le verre doseur gradué de 1 en 1', asks(3).has('cup') && ev('recipeRound(3).max') === 10 && ev('recipeRound(3).scales[0].step') === 1);
    check('paliers 4 et 5 : grammes et centilitres, de 10 en 10 et de 50 en 50', ev('recipeRound(4).scales[0].step') === 10 && ev('recipeRound(5).scales').some(s=> s.step === 50) && ev('recipeRound(5).scales').some(s=> s.unit === 'cl'));
    check('palier haut : la cible est un trait sans nombre écrit (il faut compter)', ev('(()=>{ for(let i = 0; i < 40; i++){ const r = recipeBuildRound(4 + i % 2); if(r.target % r.scale.label === 0) return false; } return true; })()'));
    // les cuillères
    let tries = 0;
    do { startGame('recipe', 2); tries++; } while(!d.getElementById('recipe-add') && tries < 5);
    const n = Number(d.querySelector('.recipe-ask').dataset.n);
    for(let i = 0; i < n + 1; i++) d.getElementById('recipe-add').click();
    check('chaque cuillère se voit dans le bol', d.querySelectorAll('#recipe-spoons .recipe-spoon').length === n + 1);
    d.getElementById('recipe-undo').click();
    check('↩️ enlève la dernière cuillère', d.querySelectorAll('#recipe-spoons .recipe-spoon').length === n);
    d.getElementById('recipe-done').click();
    check('le bon nombre, puis « C\'est prêt ! » : mission réussie', await waitFor(()=> !!d.querySelector('.win-box'), 1500));
    tries = 0;
    do { startGame('recipe', 2); tries++; } while(!d.getElementById('recipe-add') && tries < 5);
    const q0 = ev('hint.q');
    d.getElementById('recipe-done').click();   // aucune cuillère : ce n'est pas prêt
    await waitFor(()=> ev('hint.q') !== q0, 600);
    check('« C\'est prêt ! » trop tôt : une autre recette, pas de victoire', ev('hint.q') !== q0 && !d.querySelector('.win-box'));
    // le verre doseur
    tries = 0;
    do { startGame('recipe', 4); tries++; } while(!d.querySelector('.cup') && tries < 5);
    const target = Number(d.querySelector('.recipe-ask').dataset.target);
    check('le verre doseur : 10 traits de 10 en 10, des nombres seulement tous les 50', d.querySelectorAll('.cup-mark').length === 10 && [...d.querySelectorAll('.cup-mark b')].map(b=> b.textContent).join() === '50,100');
    const lv = ev('hintsFor("recipe", hint.q)');
    check('ses indices : compter de 10 en 10, en partant d\'un trait numéroté (jamais la cible)', /de 10 en 10/.test(lv[0].say) && !lv.some(h=> new RegExp(`(^|[^0-9])${target}([^0-9]|$)`).test(h.say)));
    d.querySelector(`.cup-mark[data-v="${target}"]`).click();
    check('le bon trait : le lait monte, mission réussie', await waitFor(()=> !!d.querySelector('.win-box'), 1500));
    check('pas de minuteur ; compétence « Temps et mesures » dans l\'espace parents', ev('timerFor("recipe", 5)') === null && ev('SKILL_GROUPS.find(g=> g.id==="mesures").games').includes('recipe'));
  }

  section('Le jeu de l\'île');
  {
    check('la recette pour moins de 7 ans, le gâteau partagé ensuite', ev('worldGame("bonbons", 5)') === 'recipe' && ev('worldGame("bonbons", 8)') === 'share');
    check('proposés dès 5 ans (pas avant)', ev('gameTypesForAge(5)').includes('share') && ev('gameTypesForAge(5)').includes('recipe') && !ev('gameTypesForAge(4)').includes('share'));
    ev(`closeModal(); currentProfile().age = 5; state.missions = ${LEVEL(44)}; save(); setWorld("bonbons", true); openGamePicker("cacao")`);
    check('sur l\'île, un enfant de 5 ans se voit proposer la recette', !!d.querySelector('.game-choice[data-game="recipe"]'));
    ev('closeModal(); currentProfile().age = 8; openGamePicker("chouquette")');
    check('à 8 ans, le gâteau partagé', !!d.querySelector('.game-choice[data-game="share"]'));
    ev('closeModal(); currentProfile().age = 0; setWorld("lagon", true)');
  }

  /* ================= Phase 4 : l'histoire ================= */
  section('Histoire « La fête sans gâteau »');
  {
    const ch = ev('STORY.bonbons');
    check('guide Praline, 3 phrases, au moins 2 énigmes en images avec un coup de pouce', ch.guide === 'praline' && ch.intro.length === 3 && ch.riddles.length >= 2 && ch.riddles.every(r=> r.opts.filter(o=> o.ok).length === 1 && r.tip));
    check('Grisou a caché le rêve dans le four ; il devient jaune caramel', /Grisou/.test(ch.intro.join(' ')) && /four/.test(ch.intro.join(' ')) && /Grisou/.test(ch.success) && /caramel/.test(ch.success));
    ev('closeModal(); state.coins = 0; state.storySolved = { lagon:true, boites:true, jouets:true }; state.squishies = squishyFreshState(); save(); storyWin("bonbons")');
    const coins = ev('state.coins');
    check('la récompense : des pièces et une boîte surprise de la série Bonbons', coins === ch.reward && json(ev('state.squishies.boxes')) === json(['bonbons']));
    ev('closeModal(); openStoryChapter("bonbons")');
    while(d.getElementById('story-next') && /Suite/.test(d.getElementById('story-next').textContent)) d.getElementById('story-next').click();
    const last = d.getElementById('story-next');
    check('relire le chapitre résolu : pas de nouvelle énigme', !!last && /Continuer/.test(last.textContent));
    last.click();
    check('… ni de nouvelle récompense', ev('state.coins') === coins && ev('squishyBoxCount()') === 1 && !shown('.story-opt'));
    check('Grisou reprend des couleurs : 3 îles du Ciel libérées', ev('skyIslandsFreed()') === 3);
    const eps = ev('EPISODES.bonbons');
    check('3 épisodes, racontés par Chouquette, Cacao et Berlingot (jamais Praline)', eps.length === 3 && eps.every(e=> ['chouquette','cacao','berlingot'].includes(e.by)) && eps.every(e=> e.lines.length >= 2 && e.find));
    ev(`closeModal(); state.missions = ${LEVEL(44)}; state.storyMissions = {}; state.storyEpisodes = {}; save(); setCurrentWorld("bonbons")`);
    let seen = 0;
    for(let k = 0; k < 7; k++){ ev('noteStoryMission("bonbons")'); if(ev('maybeStoryEpisode()')){ seen++; ev('closeModal()'); } }
    check('les épisodes arrivent après la 2ᵉ, 4ᵉ et 7ᵉ mission sur l\'île', seen === 3 && ev('state.storyEpisodes.bonbons') === 3);
    ev('closeModal(); openStoryJournal()');
    check('le journal : le chapitre des Bonbons dans la partie du Ciel des Rêves', !!d.querySelector('.story-season[data-saison="2"] .story-chap[data-world="bonbons"]'));
    ev('closeModal(); setCurrentWorld("lagon")');
  }

  check('aucune erreur JS', errs.length === 0);
  if(errs.length) console.log('   ' + errs.slice(0, 5).join('\n   '));
  console.log(failed ? `\n${failed} échec(s), ${passed} réussi(s)` : `\nTous les tests du Royaume des Bonbons passent (${passed})`);
  process.exit(failed ? 1 : 0);
})();
