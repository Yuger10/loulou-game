// Le Jardin des Fées (saison 2, île 5 ; proposition retenue par la joueuse) :
// l'île, la carte du Ciel à 6 places, ses 4 personnages, ses objets, sa série
// de squishies « Petites bêtes », ses deux mini-jeux (« De la graine à la
// fleur » et « Les coccinelles ») et son chapitre « Le jardin endormi ».
// Même harnais que test/saison2.test.js.
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
  section('L\'île et la carte du Ciel');
  {
    const css = page.manifestCss().map(f=> page.read(f)).join('\n');
    check('Le Jardin des Fées : saison 2, niveau 56 (conductor/niveaux.md), palier 6',
      ev('WORLDS.jardin.saison') === 2 && ev('WORLDS.jardin.level') === 56 && ev('WORLDS.jardin.diff') === 6 && ev('WORLDS.jardin.emoji') === '🌸');
    check('c\'est la 5ᵉ île du Ciel des Rêves', json(ev('worldsOf(2)').slice(0, 5)) === json(['boites', 'jouets', 'bonbons', 'musique', 'jardin']));
    // la carte du Ciel en serpentin : 6 places sans chevauchement (la 6ᵉ, en haut à gauche, pour les Licornes)
    const pos = ev('worldsOf(2).map(id=> WORLDS[id].map)');
    const clash = pos.some((a, i)=> pos.slice(i + 1).some(b=> Math.abs(a.x - b.x) < 24 && Math.abs(a.y - b.y) < 30));
    check('la carte du Ciel a la place de ses 6 îles, sans chevauchement', !clash && pos.length <= 6);
    check('son thème de couleurs (vert tendre, lilas, pêche)', css.includes('body[data-world="jardin"]{--world-sky'));
    check('son paysage (fleurs géantes, champignons-maisons, gouttes de rosée)', !!ev('ISLE_SCENERY.jardin') && /E8344E/.test(ev('ISLE_SCENERY.jardin(WORLDS.jardin)')));
    check('sa musique : une flûte légère et de petites cloches, à 76 battements par minute', ev('MUSIC_THEMES.jardin.lead') === 'flute' && ev('MUSIC_THEMES.jardin.bpm') === 76);
    const chars = ev('charsOf("jardin").map(([id])=> id)');
    check('4 personnages : Pétale, Pois, Azur, Miella', json(chars) === json(['petale','pois','azur','miella']));
    check('chacun a son butin (2 objets de l\'île) et 3 répliques', chars.every(c=> ev(`CHARACTERS.${c}.loot.length===2 && CHARACTERS.${c}.loot.every(k=> ITEMS[k] && ITEMS[k].world==="jardin") && CHARACTERS.${c}.texts.length===3`)));
    check('chacun a son dessin', chars.every(c=> ev(`charArtSVG(${json(c)})`).startsWith('<svg')));
    const items = ev('Object.keys(ITEMS).filter(k=> ITEMS[k].world==="jardin")');
    check(`ses objets (${items.length}) : graine magique, goutte de rosée, pollen doré, arrosoir, pétale de rose, fil d'araignée…`, items.length >= 6
      && ['graine','rosee','pollen','arrosoir','petalerose','filaraignee'].every(k=> items.includes(k)));
    check('au moins 3 objets ne sont donnés par personne', items.filter(k=> !chars.some(c=> ev(`CHARACTERS.${c}.loot.includes(${json(k)})`))).length >= 3);
    check('2 recettes de fusion, avec des objets de l\'île', ev('Object.keys(CRAFTED).filter(k=> CRAFTED[k].world==="jardin").length') === 2
      && ev('Object.keys(CRAFTED).filter(k=> CRAFTED[k].world==="jardin").every(k=> Object.keys(CRAFTED[k].recipe).every(i=> ITEMS[i] && ITEMS[i].world==="jardin"))'));
    check('4 à 5 décorations', [4, 5].includes(ev('decosOf("jardin").length')));
    check('2 objets préférés par personnage, de l\'île', chars.every(c=> ev(`(()=>{ const f = favoritesOf(${json(c)}); return f.length===2 && f.every(k=> ITEMS[k].world==="jardin" && !CHARACTERS.${c}.loot.includes(k)); })()`)));
    ev(`closeModal(); state.missions = ${LEVEL(56)}; save(); setWorld("jardin", true); switchView("ile")`);
    check('sur l\'île : ses 4 personnages dans le paysage', d.querySelectorAll('#scene [data-char]').length === 4 || d.querySelectorAll('#scene .isle-char').length === 4);
    check('le thème de l\'île est appliqué', d.body.dataset.world === 'jardin');
    ev(`state.missions = ${LEVEL(55)}; save()`);
    check('niveau 55 : l\'île est encore fermée', ev('worldUnlocked("jardin")') === false && ev('availableItems().includes("pollen")') === false);
    ev('setWorld("lagon", true)');
  }

  section('Ouverture au niveau 56');
  {
    ev(`closeModal(); state.missions = ${LEVEL(56) - 1}; state.visited = WORLD_ORDER.filter(worldUnlocked); state.storySolved = { lagon:true, boites:true, jouets:true, bonbons:true, musique:true }; save(); setCurrentWorld("musique")`);
    ev('playGame("count"); onMissionWin()');
    check('la mission qui fait passer au niveau 56', ev('level()') === 56);
    d.getElementById('btn-yay').click();
    await waitFor(()=> shown('.char-header'), 1500);
    check('le chapitre « Le jardin endormi » s\'ouvre, raconté par Pétale, avec Grisou', shown('.char-header') && /jardin endormi/.test(d.querySelector('.char-header h2').textContent) && shown('.story-grisou .grisou'));
    check('l\'île est marquée comme découverte', ev('state.visited.includes("jardin")'));
    ev('closeModal()');
  }

  section('Série de squishies « Petites bêtes »');
  {
    const ids = ev('squishiesOf("petitesbetes")');
    const rar = ids.map(id=> ev(`SQUISHIES[${json(id)}].rarity`));
    check('6 modèles : 4 communs, 1 rare, 1 ✨', ids.length === 6 && rar.filter(r=> r==='commun').length === 4 && rar.filter(r=> r==='rare').length === 1 && rar.filter(r=> r==='brille').length === 1);
    check('le rare est Pois, le ✨ le papillon irisé', ev('SQUISHIES.pois.rarity') === 'rare' && ev('SQUISHIES["papillon-irise"].rarity') === 'brille');
    check('chaque modèle a son dessin', ids.every(id=> ev(`squishyArtSVG(${json(id)})`).includes('sq-face')));
    ev(`state.missions = ${LEVEL(55)}; save()`);
    check('avant l\'île : la série n\'apparaît pas', ev('squishySeriesAvailable("petitesbetes")') === false && !ev('squishyMissing()').includes('pois'));
    ev(`state.missions = ${LEVEL(56)}; save(); openSquishyRoom("collection")`);
    check('ensuite, elle apparaît dans la chambre', !!d.querySelector('.sq-series[data-series="petitesbetes"]'));
    ev('closeModal()');
  }

  /* ================= De la graine à la fleur ================= */
  section('De la graine à la fleur');
  {
    const CYC = { plante:['graine','pousse','bouton','fleur','fruit'], papillon:['oeuf','chenille','chrysalide','papillon'], poule:['oeuf','poussinoeuf','poussin','poule'] };
    check('palier 1 : 3 étapes à remettre dans l\'ordre', ev('(()=>{ for(let i = 0; i < 30; i++){ const r = lifecycleBuildRound(1); if(r.mode !== "order" || r.order.length !== 3) return false; } return true; })()'));
    check('palier 2 : 4 étapes, la plante, le papillon ou la poule', ev('(()=>{ const s = new Set(); for(let i = 0; i < 60; i++){ const r = lifecycleBuildRound(2); if(r.order.length !== 4) return false; s.add(r.cycle); } return s.size === 3; })()'));
    check('les étapes suivent toujours l\'ordre de la vie', ev(`(()=>{ const C = ${json(CYC)}; for(let i = 0; i < 80; i++){ const r = lifecycleBuildRound(1 + i % 5); const c = C[r.cycle]; if(!r.order.every((s, j)=> j === 0 || c.indexOf(s) > c.indexOf(r.order[j - 1]))) return false; } return true; })()`));
    check('palier 3 : 5 étapes de la plante, ou une étape manquante', ev('(()=>{ const s = new Set(); for(let i = 0; i < 40; i++) s.add(lifecycleBuildRound(3).mode); return s.has("order") && s.has("missing"); })()'));
    check('palier 5 : « que se passe-t-il ensuite ? » et deux cycles mélangés', ev('(()=>{ const s = new Set(); for(let i = 0; i < 60; i++) s.add(lifecycleBuildRound(5).mode); return s.has("next") && s.has("mixed"); })()'));
    check('« ensuite » : une seule bonne réponse, même pour l\'œuf (poule ou papillon)', ev(`(()=>{ const C = ${json(CYC)}; for(let i = 0; i < 200; i++){ const r = lifecycleBuildRound(5); if(r.mode !== "next") continue; const cur = r.order[r.at]; const nexts = Object.values(C).flatMap(c=> c.filter((s, j)=> c[j - 1] === cur)); if(r.options.filter(o=> nexts.includes(o)).length !== 1) return false; } return true; })()`));
    startGame('lifecycle', 2);
    check('chaque étape est dessinée et nommée', [...d.querySelectorAll('.lc-card')].every(c=> !!c.querySelector('.lc-svg, .lc-emoji') && c.querySelector('.lc-name').textContent.length > 2));
    let sol = ev('gameSolution');
    d.querySelector(sol[0]).click();
    check('la bonne première étape se range sur le chemin', d.querySelectorAll('#lc-strip .lc-step.found').length === 1 && d.querySelector(sol[0]).classList.contains('done'));
    const q0 = ev('hint.q');
    d.querySelector(sol[2]).click();
    await waitFor(()=> ev('hint.q') !== q0, 600);
    check('une étape dans le désordre : un autre cycle', ev('hint.q') !== q0 && !d.querySelector('#lc-strip .lc-step.found'));
    let tries = 0;
    do { startGame('lifecycle', 4); tries++; } while(d.getElementById('lc-strip').dataset.mode !== 'mixed' && tries < 30);
    check('cycles mélangés : des étapes du papillon à laisser de côté', d.querySelectorAll('.lc-card').length > d.querySelectorAll('#lc-strip .lc-slot').length);
    sol = ev('gameSolution');
    for(const s of sol) d.querySelector(s).click();
    check('seulement la plante, dans l\'ordre : mission réussie', await waitFor(()=> !!d.querySelector('.win-box'), 1500));
    check('pas de minuteur ; compétence « Sciences »', ev('timerFor("lifecycle", 5)') === null && ev('SKILL_GROUPS.find(g=> g.id==="sciences").games').includes('lifecycle'));
  }

  /* ================= Les coccinelles ================= */
  section('Les coccinelles');
  {
    check('palier 1 : compter, jusqu\'à 3 points par aile', ev('(()=>{ for(let i = 0; i < 30; i++){ const r = ladybugsBuildRound(1); if(r.mode !== "count" || r.n < 1 || r.n > 3) return false; } return true; })()'));
    check('palier 2 : les doubles jusqu\'à 5 + 5 ; palier 3 : jusqu\'à 10 + 10', ev('ladybugsRound(2).max') === 5 && ev('ladybugsRound(3).max') === 10 && ev('(()=>{ for(let i = 0; i < 30; i++) if(ladybugsBuildRound(2).mode !== "double") return false; return true; })()'));
    check('palier 5 : les moitiés (« 14 points en tout, combien par aile ? »)', ev('(()=>{ for(let i = 0; i < 40; i++) if(ladybugsBuildRound(5).mode === "half") return true; return false; })()'));
    startGame('ladybugs', 2);
    const l = d.querySelectorAll('.lb-dot[data-w="l"]').length, r = d.querySelectorAll('.lb-dot[data-w="r"]').length;
    check('les deux ailes sont pareilles (autant de points de chaque côté)', l === r && l >= 2);
    let sol = ev('gameSolution');
    check('la bonne réponse est le double', Number(d.querySelector(sol[0]).dataset.v) === l + r);
    const lv = ev('hintsFor("ladybugs", hint.q)');
    check('ses indices : une aile, puis « n + n », sans dire le total', lv.length === 2 && /\+/.test(lv[1].say) && !lv.some(h=> new RegExp(`(^|[^0-9+])${l + r}([^0-9]|$)`).test(h.say)));
    const q0 = ev('hint.q');
    [...d.querySelectorAll('.lb-opt')].find(b=> b !== d.querySelector(sol[0])).click();
    await waitFor(()=> ev('hint.q') !== q0, 600);
    check('une erreur : une autre coccinelle', ev('hint.q') !== q0);
    let tries = 0;
    do { startGame('ladybugs', 4); tries++; } while(!d.getElementById('lb-add') && tries < 20);
    const n = d.querySelectorAll('.lb-dot[data-w="l"]').length;
    check('compléter l\'aile : l\'aile droite est vide au début', d.querySelectorAll('.lb-dot[data-w="r"]').length === 0 && n >= 5);
    // exactement n points (l'aile peut déjà être au maximum : pas de point « en trop » à ajouter)
    const right = ()=> d.querySelectorAll('.lb-dot[data-w="r"]').length;
    let seen = true;
    for(let i = 0; i < n; i++){ d.getElementById('lb-add').click(); if(right() !== i + 1) seen = false; }
    d.getElementById('lb-undo').click();
    const afterUndo = right();
    d.getElementById('lb-add').click();
    check('chaque point ajouté se voit ; ↩️ enlève le dernier', seen && afterUndo === n - 1 && right() === n);
    d.getElementById('lb-done').click();
    check('autant de points des deux côtés, puis « Pareil ! » : mission réussie', await waitFor(()=> !!d.querySelector('.win-box'), 1500));
    tries = 0;
    do { startGame('ladybugs', 5); tries++; } while(!d.querySelector('.lb-total') && tries < 20);
    sol = ev('gameSolution');
    check('les moitiés : le total est écrit, la bonne réponse en est la moitié', Number(d.querySelector(sol[0]).dataset.v) * 2 === parseInt(d.querySelector('.lb-total').textContent, 10));
    check('pas de minuteur ; compétence « Calcul »', ev('timerFor("ladybugs", 5)') === null && ev('SKILL_GROUPS.find(g=> g.id==="calcul").games').includes('ladybugs'));
  }

  section('Le jeu de l\'île');
  {
    check('les coccinelles pour moins de 7 ans, le cycle de vie ensuite', ev('worldGame("jardin", 5)') === 'ladybugs' && ev('worldGame("jardin", 8)') === 'lifecycle');
    check('proposés dès 5 ans (pas avant)', ev('gameTypesForAge(5)').includes('lifecycle') && ev('gameTypesForAge(5)').includes('ladybugs') && !ev('gameTypesForAge(4)').includes('ladybugs'));
    ev(`closeModal(); currentProfile().age = 5; state.missions = ${LEVEL(56)}; save(); setWorld("jardin", true); openGamePicker("pois")`);
    check('sur l\'île, un enfant de 5 ans se voit proposer les coccinelles', !!d.querySelector('.game-choice[data-game="ladybugs"]'));
    ev('closeModal(); currentProfile().age = 8; openGamePicker("azur")');
    check('à 8 ans, de la graine à la fleur', !!d.querySelector('.game-choice[data-game="lifecycle"]'));
    ev('closeModal(); currentProfile().age = 0; setWorld("lagon", true)');
  }

  /* ================= L'histoire ================= */
  section('Histoire « Le jardin endormi »');
  {
    const ch = ev('STORY.jardin');
    check('guide Pétale, 3 phrases, au moins 2 énigmes en images avec un coup de pouce', ch.guide === 'petale' && ch.intro.length === 3 && ch.riddles.length >= 2 && ch.riddles.every(r=> r.opts.filter(o=> o.ok).length === 1 && r.tip));
    check('Grisou a mis le rêve sous une cloche de verre ; il ne lui manque que les couleurs des licornes', /Grisou/.test(ch.intro.join(' ')) && /cloche de verre/.test(ch.intro.join(' ')) && /licornes/.test(ch.success));
    ev('closeModal(); state.coins = 0; state.storySolved = { lagon:true, boites:true, jouets:true, bonbons:true, musique:true }; state.squishies = squishyFreshState(); save(); storyWin("jardin")');
    const coins = ev('state.coins');
    check('la récompense : des pièces et une boîte surprise de la série Petites bêtes', coins === ch.reward && json(ev('state.squishies.boxes')) === json(['petitesbetes']));
    ev('closeModal(); openStoryChapter("jardin")');
    while(d.getElementById('story-next') && /Suite/.test(d.getElementById('story-next').textContent)) d.getElementById('story-next').click();
    const last = d.getElementById('story-next');
    check('relire le chapitre résolu : pas de nouvelle énigme', !!last && /Continuer/.test(last.textContent));
    last.click();
    check('… ni de nouvelle récompense', ev('state.coins') === coins && ev('squishyBoxCount()') === 1 && !shown('.story-opt'));
    check('Grisou reprend des couleurs : 5 îles du Ciel libérées', ev('skyIslandsFreed()') === 5);
    const eps = ev('EPISODES.jardin');
    check('3 épisodes, racontés par Pois, Azur et Miella (jamais Pétale)', eps.length === 3 && eps.every(e=> ['pois','azur','miella'].includes(e.by)) && eps.every(e=> e.lines.length >= 2 && e.find));
    check('le dernier épisode annonce le Royaume Arc-en-ciel', /Arc-en-ciel/.test(eps[2].lines.join(' ')));
    ev(`closeModal(); state.missions = ${LEVEL(56)}; state.storyMissions = {}; state.storyEpisodes = {}; save(); setCurrentWorld("jardin")`);
    let seen = 0;
    for(let k = 0; k < 7; k++){ ev('noteStoryMission("jardin")'); if(ev('maybeStoryEpisode()')){ seen++; ev('closeModal()'); } }
    check('les épisodes arrivent après la 2ᵉ, 4ᵉ et 7ᵉ mission sur l\'île', seen === 3 && ev('state.storyEpisodes.jardin') === 3);
    ev('closeModal(); setCurrentWorld("lagon")');
  }

  check('aucune erreur JS', errs.length === 0);
  if(errs.length) console.log('   ' + errs.slice(0, 5).join('\n   '));
  console.log(failed ? `\n${failed} échec(s), ${passed} réussi(s)` : `\nTous les tests du Jardin des Fées passent (${passed})`);
  process.exit(failed ? 1 : 0);
})();
