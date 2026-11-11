// Le Monde des Licornes (Royaume Arc-en-ciel, dernière île de la saison 2 ;
// idée de la joueuse : « le monde des licornes ») : l'île et ses 5
// personnages (la Reine sans mission, Étincelle distincte de celle du Lagon),
// la série « Licornes », « Les potions de couleurs », « Le miroir magique »,
// le chapitre et le GRAND FINAL de la saison 2 : Grisou compagnon, le
// squishy unique ✨ Grisou arc-en-ciel (Trésors), « Le Ciel des Rêves ✅ »,
// la sauvegarde v8. Même harnais que test/saison2.test.js.
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
  section('L\'île du Royaume Arc-en-ciel');
  {
    const css = page.manifestCss().map(f=> page.read(f)).join('\n');
    check('Le Royaume Arc-en-ciel : saison 2, niveau 62 (conductor/niveaux.md), palier 6',
      ev('WORLDS.licornes.saison') === 2 && ev('WORLDS.licornes.level') === 62 && ev('WORLDS.licornes.diff') === 6 && ev('WORLDS.licornes.emoji') === '🦄');
    check('c\'est la 6ᵉ et dernière île du Ciel des Rêves', json(ev('worldsOf(2)')) === json(['boites', 'jouets', 'bonbons', 'musique', 'jardin', 'licornes']));
    const pos = ev('worldsOf(2).map(id=> WORLDS[id].map)');
    check('les 6 îles du Ciel tiennent dans le cadre, sans chevauchement', pos.every(p=> p.x >= 14 && p.x <= 86 && p.y >= 15 && p.y <= 85)
      && !pos.some((a, i)=> pos.slice(i + 1).some(b=> Math.abs(a.x - b.x) < 24 && Math.abs(a.y - b.y) < 30)));
    check('son thème pastel irisé', css.includes('body[data-world="licornes"]{--world-sky'));
    check('son paysage (île de nuages, cascade arc-en-ciel, château)', !!ev('ISLE_SCENERY.licornes') && /FF6F61/.test(ev('ISLE_SCENERY.licornes(WORLDS.licornes)')));
    check('sa musique (harpe et clochettes), et une variante joyeuse pour le final', ev('MUSIC_THEMES.licornes.lead') === 'harp' && !!ev('MUSIC_THEMES["licornes-fete"]') && ev('MUSIC_THEMES["licornes-fete"].bpm') > ev('MUSIC_THEMES.licornes.bpm'));
    const chars = ev('charsOf("licornes").map(([id])=> id)');
    check('5 personnages : la Reine Arc-en-ciel, Étincelle, Biscotte, Félix, Mira', json(chars) === json(['reine','etincelle','biscotte','felix','mira']));
    check('la Reine est le guide, sans mission', ev('STORY.licornes.guide') === 'reine' && ev('CHARACTERS.reine.noGames') === true);
    check('Étincelle du Royaume est un personnage distinct ; celle du Lagon reste au Lagon', ev('CHARACTERS.etincelle.world') === 'licornes' && ev('(CHARACTERS.licorne.world || "lagon")') === 'lagon' && ev('CHARACTERS.licorne.name') === 'Étincelle'
      && /Lagon/.test(ev('CHARACTERS.etincelle.texts[0]')));
    check('chacun a son butin (2 objets de l\'île), 3 répliques et son dessin', chars.every(c=> ev(`CHARACTERS.${c}.loot.length===2 && CHARACTERS.${c}.loot.every(k=> ITEMS[k] && ITEMS[k].world==="licornes") && CHARACTERS.${c}.texts.length===3`) && ev(`charArtSVG(${json(c)})`).startsWith('<svg')));
    const items = ev('Object.keys(ITEMS).filter(k=> ITEMS[k].world==="licornes")');
    check(`ses objets (${items.length}) : corne scintillante, crin arc-en-ciel, fer à cheval étoilé, fiole de couleur, nuage doux…`, items.length >= 6
      && ['cornescintillante','crinarc','ferastral','fiolecouleur','nuagedoux'].every(k=> items.includes(k)));
    check('au moins 3 objets ne sont donnés par personne', items.filter(k=> !chars.some(c=> ev(`CHARACTERS.${c}.loot.includes(${json(k)})`))).length >= 3);
    check('2 recettes de fusion et 4 à 5 décorations', ev('Object.keys(CRAFTED).filter(k=> CRAFTED[k].world==="licornes").length') === 2 && [4, 5].includes(ev('decosOf("licornes").length')));
    check('2 objets préférés par personnage', chars.every(c=> ev(`(()=>{ const f = favoritesOf(${json(c)}); return f.length===2 && f.every(k=> ITEMS[k].world==="licornes" && !CHARACTERS.${c}.loot.includes(k)); })()`)));
    ev(`closeModal(); state.missions = ${LEVEL(62)}; save(); setWorld("licornes", true); switchView("ile")`);
    check('sur l\'île : ses 5 personnages, le thème appliqué', (d.querySelectorAll('#scene [data-char]').length === 5 || d.querySelectorAll('#scene .isle-char').length === 5) && d.body.dataset.world === 'licornes');
    ev('openDialogue("reine")');
    check('la Reine parle et accepte les cadeaux, sans proposer de jeu', !d.getElementById('btn-play') && !!d.getElementById('btn-gift'));
    ev('closeModal(); openDialogue("felix")');
    check('les autres licornes proposent leurs jeux', !!d.getElementById('btn-play'));
    ev(`closeModal(); state.missions = ${LEVEL(61)}; save()`);
    check('niveau 61 : l\'île est encore fermée', ev('worldUnlocked("licornes")') === false);
    ev('setWorld("lagon", true)');
  }

  section('Ouverture au niveau 62');
  {
    ev(`closeModal(); state.missions = ${LEVEL(62) - 1}; state.visited = WORLD_ORDER.filter(worldUnlocked); state.storySolved = { lagon:true, boites:true, jouets:true, bonbons:true, musique:true, jardin:true }; save(); setCurrentWorld("jardin")`);
    ev('playGame("count"); onMissionWin()');
    check('la mission qui fait passer au niveau 62', ev('level()') === 62);
    d.getElementById('btn-yay').click();
    await waitFor(()=> shown('.char-header'), 1500);
    check('le chapitre « Les couleurs du ciel » s\'ouvre, raconté par la Reine, avec Grisou', shown('.char-header') && /couleurs du ciel/.test(d.querySelector('.char-header h2').textContent) && shown('.story-grisou .grisou'));
    ev('closeModal()');
  }

  section('Série de squishies « Licornes »');
  {
    const ids = ev('squishiesOf("licornes")');
    const rar = ids.map(id=> ev(`SQUISHIES[${json(id)}].rarity`));
    check('6 modèles : 4 communs, 1 rare (Biscotte), 1 ✨ (la licorne étoile)', ids.length === 6 && rar.filter(r=> r==='commun').length === 4 && ev('SQUISHIES.biscotte.rarity') === 'rare' && ev('SQUISHIES["licorne-etoile"].rarity') === 'brille');
    check('chaque modèle a son dessin', ids.every(id=> ev(`squishyArtSVG(${json(id)})`).includes('sq-face')));
    ev(`state.missions = ${LEVEL(61)}; save()`);
    check('avant l\'île : la série n\'apparaît pas', ev('squishySeriesAvailable("licornes")') === false);
    ev(`state.missions = ${LEVEL(62)}; save()`);
  }

  /* ================= Les potions de couleurs ================= */
  section('Les potions de couleurs');
  {
    const MIX = { 'rouge+jaune':'orange', 'bleu+jaune':'vert', 'rouge+bleu':'violet', 'rouge+blanc':'rose', 'noir+blanc':'gris' };
    const mixOf = (a, b)=> MIX[`${a}+${b}`] || MIX[`${b}+${a}`];
    check('la table des mélanges de la peinture', ev('COLOR_MIXES').every(([a, b, r])=> mixOf(a, b) === r) && ev('COLOR_MIXES.length') === 5);
    check('l\'arc-en-ciel dans l\'ordre (rouge, orange, jaune, vert, bleu, violet)', json(ev('RAINBOW')) === json(['rouge','orange','jaune','vert','bleu','violet']));
    const modes = (t)=> new Set(Array.from({ length: 50 }, ()=> ev(`potionsBuildRound(${t}).mode`)));
    check('GS : reconnaître la couleur nommée ; CP : les mélanges', json([...modes(1)]) === json(['name']) && json([...modes(2)]) === json(['mix']));
    check('CP : seulement les 3 mélanges primaires', ev('(()=>{ for(let i = 0; i < 60; i++){ const r = potionsBuildRound(2); if(!["orange","vert","violet"].includes(r.r)) return false; } return true; })()'));
    check('CE1 : tous les mélanges et l\'arc-en-ciel à 2 trous ; CE2 : l\'inverse et 4 trous', modes(3).has('rainbow') && ev('potionsRound(3).holes') === 2 && modes(5).has('inverse') && ev('potionsRound(5).holes') === 4);
    check('3 potions différentes, une seule juste', ev(`(()=>{ const M = ${json(MIX)}; const mix = (a, b)=> M[a + "+" + b] || M[b + "+" + a];
      for(let i = 0; i < 100; i++){ const r = potionsBuildRound(1 + i % 5); if(r.mode === "rainbow") continue;
        if(new Set(r.options).size !== 3) return false;
        const good = r.mode === "name" ? [r.target] : r.mode === "mix" ? [mix(r.a, r.b)] : r.options.filter(o=> mix(r.a, o) === r.r);
        if(r.options.filter(o=> good.includes(o)).length !== 1) return false; } return true; })()`));
    startGame('potions', 2);
    check('chaque potion porte son initiale et son nom (jamais la couleur seule)', [...d.querySelectorAll('.po-opt')].every(b=> /^[A-Z][a-z]?$/.test(b.querySelector('text').textContent) && b.querySelector('.po-name').textContent === b.dataset.c));
    const sol = ev('gameSolution');
    const q0 = ev('hint.q');
    [...d.querySelectorAll('.po-opt')].find(b=> b !== d.querySelector(sol[0])).click();
    await waitFor(()=> ev('hint.q') !== q0, 600);
    check('une erreur : un autre mélange', ev('hint.q') !== q0 && !!d.querySelector('.po-opt'));
    let tries = 0;
    do { startGame('potions', 4); tries++; } while(d.getElementById('po-stage').dataset.mode !== 'rainbow' && tries < 30);
    const holes = [...d.querySelectorAll('.po-band.hole')].length;
    for(const s of ev('gameSolution')) d.querySelector(s).click();
    check(`l'arc-en-ciel réparé (${holes} couleurs), dans l'ordre : mission réussie`, holes === 3 && await waitFor(()=> !!d.querySelector('.win-box'), 1500) && !d.querySelector('.po-band.hole'));
  }

  /* ================= Le miroir magique ================= */
  section('Le miroir magique');
  {
    check('mirrorOf : le reflet par l\'axe vertical et par l\'axe horizontal', json(ev('mirrorOf({ r:1, c:0, v:1 }, "v", 4)')) === json({ r:1, c:3, v:1 }) && json(ev('mirrorOf({ r:0, c:2, v:2 }, "h", 6)')) === json({ r:5, c:2, v:2 }));
    check('GS/CP : grille 4 × 4, 2 puis 3 cases ; CE1 : 6 × 6, 5 cases', ev('mirrorRound(1).size') === 4 && ev('mirrorRound(1).cells') === 2 && ev('mirrorRound(2).cells') === 3 && ev('mirrorRound(3).size') === 6 && ev('mirrorRound(3).cells') === 5);
    check('CE2 : axe horizontal, et parfois deux couleurs', ev('mirrorRound(5).axes').includes('h') && ev('(()=>{ for(let i = 0; i < 40; i++) if(mirrorBuildRound(5).two) return true; return false; })()'));
    startGame('mirror', 2);
    const src = d.querySelectorAll('.mr-cell.src[data-src]').length;
    check('d\'un côté, le motif ; de l\'autre, les cases à toucher ; l\'axe en paillettes', src === 3 && d.querySelectorAll('.mr-cell.tap').length === 8 && !!d.querySelector('.mr-axis'));
    const sol = ev('gameSolution');
    d.querySelector(sol[0]).click();
    const wrongCell = [...d.querySelectorAll('.mr-cell.tap')].find(c=> !sol.includes(`.mr-cell[data-k="${c.dataset.k}"]`));
    wrongCell.click();
    spoken.length = 0;
    const q0 = ev('hint.q');
    d.getElementById('mirror-done').click();
    check('« ✨ Fini ! » trop tôt : les cases fausses clignotent, avec un indice parlé', d.querySelectorAll('.mr-cell.wrong').length >= 1 && /clignotent/.test(spoken.join(' ')));
    check('après 1 erreur, on garde le motif pour le corriger', ev('hint.q') === q0);
    d.getElementById('mirror-done').click();
    await waitFor(()=> ev('hint.q') !== q0, 600);
    check('après 2 erreurs : un nouveau motif', ev('hint.q') !== q0 && !d.querySelector('.mr-cell.wrong'));
    startGame('mirror', 3);
    for(const s of ev('gameSolution')) d.querySelector(s).click();
    check('le reflet exact, puis « ✨ Fini ! » : mission réussie', await waitFor(()=> !!d.querySelector('.win-box'), 1500));
  }

  section('Le jeu de l\'île');
  {
    check('les potions pour moins de 7 ans, le miroir ensuite', ev('worldGame("licornes", 5)') === 'potions' && ev('worldGame("licornes", 8)') === 'mirror');
    check('compétences : potions en « Sciences », miroir en « Formes et espace »', ev('SKILL_GROUPS.find(g=> g.id==="sciences").games').includes('potions') && ev('SKILL_GROUPS.find(g=> g.id==="formes").games').includes('mirror'));
  }

  /* ================= Le chapitre et le grand final ================= */
  section('Grisou avant le final');
  {
    check('Grisou ne se choisit pas encore comme compagnon', ev('companionUnlocked("grisou")') === false && !ev('companionsFor("")').includes('grisou'));
    check('il ne se rencontre pas en visitant le Royaume', ev('(state.team = { open:true, met:[], mates:[], day:null }, teamEncounterOn("licornes"))') === null);
    check('la case Trésors attend : Grisou arc-en-ciel n\'est jamais dans les boîtes', !ev('Object.keys(SQUISHIES)').includes('grisou-arc') && !!ev('SQUISHY_TREASURES["grisou-arc"]'));
    ev('closeModal(); state.squishies = squishyFreshState(); for(let i = 0; i < 60; i++) addSquishyBox(null); save()');
    const drawn = ev('(()=>{ const out = []; for(let i = 0; i < 60; i++){ const r = openSquishyBox(); if(r) out.push(r.id); } return out; })()');
    check(`60 boîtes ouvertes : jamais de Grisou arc-en-ciel (${drawn.length} tirages)`, drawn.length === 60 && !drawn.includes('grisou-arc'));
  }

  section('Chapitre « Les couleurs du ciel » et grand final');
  {
    const ch = ev('STORY.licornes');
    check('3 phrases et au moins 2 énigmes de couleurs (☀️, 🌈…)', ch.intro.length === 3 && ch.riddles.length >= 2 && ch.riddles.some(r=> r.opts.some(o=> o.ok && o.e === '☀️')) && ch.riddles.every(r=> r.tip));
    ev(`closeModal(); currentProfile().companion = "perle"; state.coins = 0; state.season2Done = false; state.squishies = squishyFreshState(); state.team = { open:true, met:[], mates:[], day:null };
        state.storySolved = { lagon:true, boites:true, jouets:true, bonbons:true, musique:true, jardin:true }; save(); storyWin("licornes")`);
    check('la récompense du chapitre : des pièces et une boîte Licornes', ev('state.coins') === ch.reward && json(ev('state.squishies.boxes')) === json(['licornes']));
    spoken.length = 0;
    d.getElementById('story-continue').click();
    check('le grand final suit : Grisou retrouve toutes ses couleurs', shown('.finale') && /retrouvé toutes ses couleurs/.test(lastSaid()));
    check('les récompenses sont données dès le début du final (une seule fois)', ev('state.season2Done') === true && ev('state.squishies.treasures').includes('grisou-arc') && ev('state.team.met').includes('grisou'));
    d.getElementById('finale-next').click();
    check('Grisou s\'excuse : il avait peur de perdre les rêves', /Pardon/.test(lastSaid()) && /peur de perdre/.test(lastSaid()));
    d.getElementById('finale-next').click();
    check('un rêve partagé ne se perd jamais : il devient l\'ami de tous', /rêve partagé ne se perd jamais/.test(lastSaid()) && d.querySelector('.finale .grisou').classList.contains('full'));
    d.getElementById('finale-next').click();
    check('récompense 1 : Grisou devient un compagnon', shown('.finale-gift [data-buddy="grisou"]') && !!d.getElementById('finale-pick'));
    d.getElementById('finale-pick').click();
    check('« Choisir Grisou » : il devient le compagnon du joueur', ev('currentProfile().companion') === 'grisou' && ev('currentCompanion()') === 'grisou');
    check('récompense 2 : ✨ Grisou arc-en-ciel, le trésor unique', shown('.finale-treasure [data-sq="grisou-arc"]'));
    d.getElementById('finale-treasure').click();
    check('« Le Ciel des Rêves ✅ »', shown('.finale-done') && /Ciel des Rêves ✅/.test(d.querySelector('.finale-done h2').textContent));
    d.getElementById('finale-end').click();
    check('Grisou se choisit maintenant comme compagnon, avec un dessin pour chaque humeur', ev('companionUnlocked("grisou")') === true && ev('companionsFor("")').includes('grisou')
      && ev('BUDDY_MOODS').every(m=> ev(`companionSVG("grisou", ${json(m)})`).includes('data-buddy="grisou"')));
    ev('openSquishyRoom("collection")');
    check('la chambre : Grisou arc-en-ciel dans la case Trésors', !!d.querySelector('.sq-treasures .sq-cell.owned[data-sq="grisou-arc"]'));
    ev('closeModal(); openStoryJournal()');
    check('le journal : « Le Ciel des Rêves ✅ » et « Revoir le grand final »', /✅/.test(d.querySelector('.story-season[data-saison="2"] h3').textContent) && !!d.querySelector('[data-finale]'));
    const coins = ev('state.coins');
    d.querySelector('[data-finale]').click();
    check('revoir le final depuis le journal', shown('.finale'));
    for(let k = 0; k < 3; k++) d.getElementById('finale-next').click();
    check('… sans redonner les récompenses', shown('.finale-done') && !d.getElementById('finale-pick') && ev('state.squishies.treasures.length') === 1 && ev('state.coins') === coins);
    d.getElementById('finale-end').click();
    ev('closeModal(); storyWin("licornes")');
    d.getElementById('story-continue').click();
    check('rejouer l\'énigme ne relance pas le final', !shown('.finale'));
    check('Grisou reprend toutes ses couleurs : 6 îles du Ciel libérées', ev('skyIslandsFreed()') === 6);
    ev('closeModal(); currentProfile().companion = "perle"');
  }

  section('Épisodes et sauvegarde');
  {
    const eps = ev('EPISODES.licornes');
    check('3 épisodes, jamais racontés par la Reine, qui préparent le final', eps.length === 3 && eps.every(e=> ['etincelle','biscotte','felix','mira'].includes(e.by)) && /Grisou/.test(eps.map(e=> e.lines.join(' ')).join(' ')));
    check('la sauvegarde passe en version 9', ev('SAVE_VERSION') === 9 && ev('freshState().season2Done') === false && json(ev('squishyFreshState().treasures')) === '[]');
    const old = { v:8, coins:30, missions:300, inventory:{ cerise:2 }, storySolved:{ lagon:true, jardin:true }, soundVolume:60, restLog:{ '2026-11-10':{ activity:'bouger' } },
      squishies:{ owned:{ donut:1 }, boxes:[], shelf:Array(12).fill(null), dry:0, done:{}, fromStory:{}, day:null, sorted:0, hello:true } };
    const m = ev(`migrate(${json(old)})`);
    check('migration v8 → v9 : rien n\'est perdu, le final reste à jouer', m.v === 9 && !!m.restLog['2026-11-10'] && m.coins === 30 && m.missions === 300 && m.inventory.cerise === 2 && m.squishies.owned.donut === 1 && m.soundVolume === 60 && m.season2Done === false && json(m.squishies.treasures) === '[]');
  }

  check('aucune erreur JS', errs.length === 0);
  if(errs.length) console.log('   ' + errs.slice(0, 5).join('\n   '));
  console.log(failed ? `\n${failed} échec(s), ${passed} réussi(s)` : `\nTous les tests du Monde des Licornes passent (${passed})`);
  process.exit(failed ? 1 : 0);
})();
