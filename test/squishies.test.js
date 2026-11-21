// La collection de squishies (v53) : catalogue, sauvegarde et migration,
// boîtes surprises (coffre, énigmes, boutique), tirage doux et filet de
// sécurité, échange des doubles, chambre (collection, ouverture, presser,
// étagère), boîtes de rangement à consigne, marché. Même harnais que
// test/companions.test.js : le temps du jeu est accéléré ×10, la voix est
// notée au lieu d'être dite.
const { JSDOM } = require('jsdom');
const html = require('./tools/page.js').buildHtml();

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
// un hasard prévisible : renvoie les valeurs données, en boucle
const seq = (vals)=> `(()=>{ let i = 0; const v = ${json(vals)}; return ()=> v[i++ % v.length]; })()`;
// une collection : { id: nombre }
const setOwned = (owned)=> ev(`state.squishies = squishyFreshState(); state.squishies.owned = ${json(owned)}; save()`);
const ALL = ()=> ev('Object.keys(SQUISHIES)');

(async ()=>{
  await wait(100);
  d.getElementById('btn-splash-play').click();
  d.getElementById('name-input').value = 'Lou';
  d.querySelector('.avatar-opt').click();
  d.getElementById('btn-start').click();
  await wait(150);
  ev('closeModal()');

  /* ================= Phase 1 : données et état ================= */
  section('Catalogue');
  {
    const series = ev('SQUISHY_SERIES_ORDER');
    check('3 séries au lancement, puis les séries des îles du Ciel (Boîtes, Jouets doux, Bonbons, Instruments, Petites bêtes, Licornes)', json(series) === json(['capy', 'desserts', 'animaux', 'boites', 'jouets', 'bonbons', 'instruments', 'petitesbetes', 'licornes']));
    check('6 modèles par série (54 squishies)', series.every(s=> ev(`squishiesOf("${s}").length`) === 6) && ALL().length === 54);
    check('par série : 4 communs, 1 rare, 1 ✨', series.every(s=>{
      const r = ev(`squishiesOf("${s}").map(id=> SQUISHIES[id].rarity)`);
      return r.filter(x=> x === 'commun').length === 4 && r.filter(x=> x === 'rare').length === 1 && r.filter(x=> x === 'brille').length === 1;
    }));
    check('noms uniques et faciles à dire', new Set(ev('Object.values(SQUISHIES).map(m=> m.name)')).size === 54 && ev('Object.values(SQUISHIES).every(m=> m.say.length > 3)'));
    check('chaque modèle a une couleur du mini-jeu Formes', ev('Object.values(SQUISHIES).every(m=> !!SQ_COLORS[m.color])'));
    check('chaque modèle a une forme et une taille', ev('Object.values(SQUISHIES).every(m=> ["rond","ovale","carre"].includes(m.shape) && ["petit","grand"].includes(m.size))'));
    check('chaque île donne une série existante', ev('Object.keys(STORY).every(w=> !!SQUISHY_SERIES[SQUISHY_ISLAND_SERIES[w]])'));
    check('île → série : Lagon, Forêt, Montagne → Animaux ; Château, Volcan, Squishy → Desserts ; Jungle, Cité → Capybaras',
      ev('["lagon","foret","montagne"].every(w=> SQUISHY_ISLAND_SERIES[w]==="animaux") && ["chateau","volcan","squishy"].every(w=> SQUISHY_ISLAND_SERIES[w]==="desserts") && ["jungle","cite"].every(w=> SQUISHY_ISLAND_SERIES[w]==="capy")'));
  }

  section('État et migration');
  {
    const sq = ev('state.squishies');
    check('partie neuve : une collection vide', json(sq.owned) === '{}' && sq.boxes.length === 0 && sq.dry === 0);
    check('partie neuve : une étagère de 12 places libres', sq.shelf.length === 12 && sq.shelf.every(x=> x === null));
    check('sauvegarde versionnée (5 en v53, 6 depuis la v55)', ev('SAVE_VERSION') >= 5 && JSON.parse(w.localStorage.getItem(ev('currentSaveKey()'))).v === ev('SAVE_VERSION'));
    const old = { v:4, coins:9, missions:60, inventory:{ coquillage:2 }, storySolved:{ lagon:true, jungle:true, volcan:true },
      skills:{ count:{ wins:3, fails:0, errors:1, last:null, recent:[], hints:2 } }, team:{ open:true, met:['perle'], mates:[], day:null } };
    const m = ev(`migrate(${json(old)})`);
    check('migration v4 → v5 : une boîte par chapitre résolu', m.squishies.boxes.length === 3);
    check('migration : chaque boîte est de la série de son île', json(m.squishies.boxes) === json(['animaux', 'capy', 'desserts']));
    check('migration : ces îles ne redonneront pas de boîte', m.squishies.fromStory.lagon && m.squishies.fromStory.jungle && m.squishies.fromStory.volcan);
    check('migration : aucune autre donnée perdue', m.v === ev('SAVE_VERSION') && m.coins === 9 && m.missions === 60 && m.inventory.coquillage === 2 && m.skills.count.hints === 2 && m.team.open === true);
    check('migration sans chapitre résolu : aucune boîte', ev('migrate({ v:4, coins:1 }).squishies.boxes.length') === 0);
    // par le vrai chargement
    ev(`localStorage.setItem(currentSaveKey(), ${json(json(old))}); load()`);
    check('au chargement : les boîtes de rattrapage attendent', ev('squishyBoxCount()') === 3 && ev('state.coins') === 9);
    check('la pastille 🧸 compte les boîtes à ouvrir', (ev('renderSquishyBadge()'), !d.getElementById('squishy-badge').hidden && d.getElementById('squishy-badge').textContent === '3'));
  }

  section('Sauvegarde et restauration');
  {
    setOwned({ 'capy-fraise':2, 'donut':1 });
    ev('state.squishies.boxes = ["capy", null]; state.squishies.shelf[3] = "donut"; state.squishies.sorted = 4; save(); saveProfiles()');
    const backup = ev('JSON.stringify(buildBackup())');
    ev('state.squishies = squishyFreshState(); save()');
    ev(`applyBackup(JSON.parse(${json(backup)}))`);
    const sq = ev('state.squishies');
    check('fichier : la collection, les boîtes, l\'étagère et le compteur reviennent', sq.owned['capy-fraise'] === 2 && sq.owned.donut === 1 && json(sq.boxes) === json(['capy', null]) && sq.shelf[3] === 'donut' && sq.sorted === 4);
    const code = 'LAGON1:' + ev(`utf8ToB64(${json(backup)})`);
    ev('state.squishies = squishyFreshState(); save()');
    ev(`applyBackup(parseBackupText(${json(code)}).backup)`);
    check('code de transfert : la collection revient aussi', ev('state.squishies.owned["capy-fraise"]') === 2 && ev('state.squishies.shelf[3]') === 'donut');
    ev('closeModal()');
  }

  /* ================= Phase 2 : boîtes et tirage ================= */
  section('Gagner des boîtes');
  {
    setOwned({});
    ev('ensureQuests(); state.quests.claimed = false; state.quests.list.forEach(q=> q.n = q.goal); save()');
    ev('openChest()');
    check('coffre du jour : 1 boîte surprise en plus', ev('squishyBoxCount()') === 1 && ev('state.squishies.boxes[0]') === null);
    check('coffre : la boîte est montrée dans la récompense', shown('.reward-box .sq-reward-line'));
    check('coffre : la voix l\'annonce', /boîte surprise/.test(lastSaid()));
    check('pastille 🧸 : 1', d.getElementById('squishy-badge').textContent === '1' && d.getElementById('squishy-badge').classList.contains('ready'));
    ev('closeModal(); state.squishies = squishyFreshState(); state.storySolved = {}; save()');
    ev('storyWin("jungle")');
    check('énigme résolue : 1 boîte de la série de l\'île (Jungle → Capybaras)', json(ev('state.squishies.boxes')) === json(['capy']) && shown('.sq-reward-line'));
    ev('closeModal(); storyWin("jungle")');
    check('énigme : une seule boîte par île', ev('squishyBoxCount()') === 1);
    ev('closeModal()');
  }

  section('Boutique');
  {
    ev('state.squishies = squishyFreshState(); state.coins = 100; save()');
    const r = [1, 2, 3, 4].map(()=> ev('buySquishyBox()'));
    check('une boîte coûte 15 pièces', ev('state.coins') === 55);
    check('3 achats par jour', r.slice(0, 3).every(x=> x.ok) && ev('squishyBoxCount()') === 3);
    check('le 4ᵉ est refusé avec douceur (limite du jour)', r[3].ok === false && r[3].reason === 'limit' && ev('state.coins') === 55);
    ev('state.squishies.day.date = "2000-01-01"; save()');
    check('remise à zéro le lendemain', ev('buySquishyBox()').ok === true && ev('squishyShopState().left') === 2);
    ev('state.coins = 10; save()');
    const poor = ev('buySquishyBox()');
    check('sans assez de pièces : refus doux, rien ne change', poor.ok === false && poor.reason === 'coins' && ev('state.coins') === 10 && ev('squishyBoxCount()') === 4);
  }

  section('Ouvrir une boîte');
  {
    check('raretés : 70 % commun, 25 % rare, 5 % ✨',
      ev('[0, .69].every(r=> squishyRollRarity(()=>r)==="commun") && [.70, .94].every(r=> squishyRollRarity(()=>r)==="rare") && [.95, .999].every(r=> squishyRollRarity(()=>r)==="brille")'));
    const stats = ev('(()=>{ const n = {commun:0, rare:0, brille:0}; for(let i=0;i<20000;i++) n[squishyRollRarity(Math.random)]++; return n; })()');
    check('raretés : la répartition au hasard est la bonne', Math.abs(stats.commun / 20000 - .70) < .02 && Math.abs(stats.rare / 20000 - .25) < .02 && Math.abs(stats.brille / 20000 - .05) < .01);
    setOwned({});
    ev('state.squishies.boxes = ["desserts"]');
    const one = ev(`openSquishyBox(${seq([0.5])})`);
    check('ouvrir ajoute exactement un squishy de la série de la boîte', one.series === 'desserts' && ev('SQUISHIES[' + json(one.id) + '].series') === 'desserts' && ev('Object.values(state.squishies.owned).reduce((a,b)=>a+b,0)') === 1);
    check('premier exemplaire : nouveau', one.isNew === true && one.count === 1 && ev('squishyBoxCount()') === 0);
    check('sans boîte : rien à ouvrir', ev('openSquishyBox()') === null);
    // filet : après 3 doubles d'affilée, la 4ᵉ boîte est nouvelle
    setOwned({ 'capy-fraise':1, 'capy-orange':1, 'capy-dodo':1, 'capy-bain':1 });
    ev('state.squishies.boxes = ["capy","capy","capy","capy"]');
    const res = [1, 2, 3, 4].map(()=> ev(`openSquishyBox(${seq([0])})`));   // toujours le 1er commun
    check('3 doubles d\'affilée comptés', res.slice(0, 3).every(x=> !x.isNew) && res[2].count === 4);
    check('filet : la 4ᵉ boîte donne un squishy jamais obtenu, de la série', res[3].isNew && res[3].series === 'capy');
    check('filet : le compteur repart à zéro', ev('state.squishies.dry') === 0);
    // série complète : ignorée par le filet
    setOwned(Object.fromEntries(ev('squishiesOf("capy")').map(id=> [id, 1])));
    ev('state.squishies.done.capy = true; state.squishies.boxes = ["capy"]');
    ev(`openSquishyBox(${seq([0])})`);
    check('série complète : un double y ne compte pas « sans nouveauté »', ev('state.squishies.dry') === 0);
    ev('state.squishies.dry = 3; state.squishies.boxes = ["capy"]');
    const other = ev(`openSquishyBox(${seq([0])})`);
    check('filet sur une série complète : un nouveau d\'une autre série', other.isNew && other.series !== 'capy');
    ev('state.squishies.boxes = [null]');
    check('boîte mystère : une série pas encore complète', ev(`openSquishyBox(${seq([0])}).series`) !== 'capy');
    // bonus de série
    const all = ev('squishiesOf("animaux")');
    setOwned(Object.fromEntries(all.filter(id=> id !== 'chat-holo').map(id=> [id, 1])));
    ev('state.coins = 0; state.squishies.dry = 3; state.squishies.boxes = ["animaux", "animaux"]');
    const done = ev(`openSquishyBox(${seq([0])})`);
    check('compléter une série : la fête et 20 pièces', done.id === 'chat-holo' && done.seriesCompleted === true && ev('state.coins') === 20);
    const again = ev(`openSquishyBox(${seq([0])})`);
    check('bonus de série : une seule fois', again.seriesCompleted === false && ev('state.coins') === 20);
  }

  section('Échanger 3 doubles');
  {
    setOwned({ 'donut':4, 'mochi':2, 'chat':1 });
    check('compte des doubles (exemplaires au-delà du premier)', ev('squishyDuplicates()') === 4);
    check('on ne peut pas échanger contre un squishy déjà obtenu', ev('tradeDuplicatesFor("chat").ok') === false);
    const t = ev('tradeDuplicatesFor("lapin")');
    check('3 doubles → le squishy manquant choisi', t.ok && ev('squishyCount("lapin")') === 1);
    check('les doubles les plus nombreux partent d\'abord', ev('squishyCount("donut")') === 1 && ev('squishyCount("mochi")') === 2 && ev('squishyDuplicates()') === 1);
    check('échange refusé s\'il manque des doubles', ev('tradeDuplicatesFor("pingouin").ok') === false && ev('squishyCount("pingouin")') === 0);
  }

  /* ================= Phase 3 : dessins et chambre ================= */
  section('Dessins');
  {
    check('un dessin <svg> pour chacun des 18 modèles', ALL().every(id=> /^<svg[\s\S]*<\/svg>$/.test(ev(`squishyArtSVG(${json(id)})`).trim())));
    check('chaque dessin a un visage', ALL().every(id=> ev(`squishyArtSVG(${json(id)})`).includes('sq-face')));
    check('la silhouette (modèle manquant) existe', ALL().every(id=> ev(`squishyArtSVG(${json(id)}, { silhouette:true })`).includes('sq-sil')));
    check('le ✨ a ses paillettes animées', ALL().filter(id=> ev(`SQUISHIES[${json(id)}].rarity`) === 'brille').every(id=> /sq-brille[\s\S]*sq-sparkles/.test(ev(`squishyArtSVG(${json(id)})`))));
    check('un commun n\'en a pas', !ev('squishyArtSVG("donut")').includes('sq-sparkles'));
    check('un petit squishy est dessiné plus petit', ev('squishyArtSVG("mochi")').includes('scale(.68)') && !ev('squishyArtSVG("donut")').includes('scale(.68)'));
  }

  section('Bouton 🧸 et chambre');
  {
    setOwned({ 'capy-fraise':1, 'donut':2 });
    ev('state.missions = 0; state.squishies.boxes = ["capy", "desserts"]; save(); renderSquishyBadge()');   // niveau 1 : sans la série Boîtes
    check('bouton 🧸 dans l\'en-tête, avec la pastille des boîtes', !!d.querySelector('.topbar #squishy-btn') && d.getElementById('squishy-badge').textContent === '2');
    check('un bouton dans le Sac aussi', (ev('switchView("sac")'), !!d.querySelector('#view-sac #sq-room-link')) && d.getElementById('sq-room-link-n').textContent === '2');
    d.getElementById('sq-room-link').click();
    check('le Sac ouvre la chambre', shown('#sq-room'));
    ev('closeModal(); switchView("carte")');
    d.getElementById('squishy-btn').click();
    check('la chambre s\'ouvre sur 📚 Collection', shown('#sq-room[data-tab="collection"]') && d.querySelector('[data-sqtab="collection"]').classList.contains('active'));
    check('3 onglets : Collection, Étagère, Ranger', d.querySelectorAll('[data-sqtab]').length === 3);
    check('une rangée par série, avec « n / 6 »', d.querySelectorAll('.sq-series').length === 3 && /1 \/ 6/.test(d.querySelector('.sq-series[data-series="capy"] .sq-prog').textContent));
    check('silhouettes grises pour les manquants', d.querySelectorAll('.sq-cell.missing').length === 16 && d.querySelectorAll('.sq-cell.missing .sq-sil').length === 16);
    check('un double montre son compteur ×2', d.querySelector('.sq-cell[data-sq="donut"] .sq-n').textContent === '×2');
    check('les boîtes à ouvrir en haut, avec « Ouvrir ! »', !!d.querySelector('.sq-boxes #sq-open') && d.querySelector('.sq-box-n').textContent === '×2');
    check('la voix annonce les boîtes', /2 boîtes/.test(lastSaid()));
  }

  section('Ouverture animée');
  {
    ev('Math.__r = Math.random; Math.random = () => 0');   // le 1er commun : capy-fraise (déjà obtenu)
    spoken.length = 0;
    d.getElementById('sq-open').click();
    check('la boîte tremble', d.getElementById('sq-stage').classList.contains('shake'));
    check('la boîte est consommée', ev('squishyBoxCount()') === 1);
    await waitFor(()=> !!d.querySelector('.sq-reveal'), 1000);
    check('le squishy saute : un double affiche « ×2 »', d.querySelector('.sq-reveal').classList.contains('is-dup') && d.querySelector('.sq-tag').textContent === '×2');
    check('la voix annonce son nom', /Un capy fraise/.test(spoken.join(' ')));
    d.getElementById('sq-next').click();
    d.getElementById('sq-open').click();   // desserts : le 1er commun, donut (déjà), puis…
    await waitFor(()=> !!d.querySelector('.sq-reveal'), 1000);
    check('dernière boîte : « Voir ma collection »', /collection/.test(d.getElementById('sq-next').textContent));
    ev('Math.random = Math.__r');
    setOwned({});
    ev('state.squishies.boxes = ["animaux"]; save(); openSquishyRoom("collection")');
    ev('Math.random = () => .99');   // ✨
    d.getElementById('sq-open').click();
    await waitFor(()=> !!d.querySelector('.sq-reveal'), 1000);
    ev('Math.random = Math.__r');
    check('nouveau squishy : badge « Nouveau ! »', d.querySelector('.sq-reveal').classList.contains('is-new') && d.querySelector('.sq-tag').textContent === 'Nouveau !');
    check('un ✨ : une fête spéciale (paillettes)', d.querySelector('.sq-reveal').classList.contains('r-brille') && !!d.querySelector('.sq-reveal .sq-sparkles'));
    check('le pastille se met à jour (plus de boîte)', d.getElementById('squishy-badge').hidden);
  }

  section('Presser');
  {
    setOwned({ 'capy-fraise':1, 'donut':2 });
    ev('openSquishyRoom("collection")');
    const before = ev('JSON.stringify(state)');
    const cell = d.querySelector('.sq-cell[data-sq="donut"]');
    cell.click();
    check('toucher un squishy l\'écrase (animation)', cell.classList.contains('sq-press'));
    check('la voix dit son nom', /Donut/.test(lastSaid()));
    check('presser ne change rien à la partie', ev('JSON.stringify(state)') === before);
  }

  section('Étagère');
  {
    d.querySelector('[data-sqtab="etagere"]').click();
    check('12 emplacements', d.querySelectorAll('#sq-shelf .sq-slot').length === 12);
    d.querySelector('[data-pick="donut"]').click();
    check('toucher un squishy le choisit', !!d.querySelector('[data-pick="donut"].selected') && d.getElementById('sq-shelf').classList.contains('picking'));
    d.querySelector('[data-slot="5"]').click();
    check('puis une place : il y est posé', ev('state.squishies.shelf[5]') === 'donut' && !!d.querySelector('[data-slot="5"] svg'));
    d.querySelector('[data-pick="donut"]').click(); d.querySelector('[data-slot="0"]').click();
    d.querySelector('[data-pick="donut"]').click();
    check('pas plus d\'exemplaires qu\'on n\'en a', ev('state.squishies.shelf.filter(x=> x==="donut").length') === 2 && !d.querySelector('[data-pick="donut"].selected'));
    ev('load()');
    check('l\'étagère est retrouvée après rechargement', ev('state.squishies.shelf[5]') === 'donut' && ev('state.squishies.shelf[0]') === 'donut');
    ev('openSquishyRoom("etagere")');
    d.querySelector('[data-slot="5"]').click();
    check('toucher un squishy de l\'étagère le choisit (et le presse)', d.querySelector('[data-slot="5"]').classList.contains('selected') && !!d.getElementById('sq-shelf-remove'));
    d.querySelector('[data-slot="7"]').click();
    check('puis une autre place : il est déplacé', ev('state.squishies.shelf[5]') === null && ev('state.squishies.shelf[7]') === 'donut');
    d.querySelector('[data-slot="7"]').click(); d.getElementById('sq-shelf-remove').click();
    check('« Retirer » le range dans la collection', ev('state.squishies.shelf[7]') === null);
    d.querySelector('[data-slot="0"]').click(); d.querySelector('[data-slot="0"]').click();
    check('le même geste (toucher deux fois sa place) le retire aussi', ev('state.squishies.shelf.every(x=> x===null)'));
    ev('closeModal()');
  }

  /* ================= Phase 4 : rangement à consigne et marché ================= */
  section('Consigne réalisable');
  {
    const small = { 'capy-fraise':3, 'donut':3, 'chat':2, 'lapin':1, 'mochi':1 };   // 5 modèles
    check('moins de 6 modèles différents : pas de boîte', ev(`makeSortingTask(${json(small)}, 9)`) === null);
    // de nombreuses collections au hasard : toute consigne proposée est réalisable
    let ok = true, made = 0, oneColor = true, kinds = new Set(), two = true, cap = true;
    const ids = ALL();
    for(let n = 0; n < 300; n++){
      const owned = {};
      ids.forEach(id=>{ if(Math.random() < .55) owned[id] = 1 + Math.floor(Math.random() * 3); });
      const age = [0, 4, 5, 6, 7, 8, 10][n % 7];
      const t = ev(`makeSortingTask(${json(owned)}, ${age})`);
      if(!t) continue;
      made++;
      const copies = Object.entries(owned).flatMap(([id, c])=> Array(c).fill(id));
      const match = (id)=> t.criteria.every(c=> ev(`SQUISHIES[${json(id)}]`)[c.type] === c.value);
      const yes = copies.filter(match).length;
      if(!(yes >= 4 && copies.length - yes >= 2)) ok = false;
      if(t.items.length !== 8 || t.items.filter(match).length < 4 || t.items.filter(id=> !match(id)).length < 2 || !t.items.every(id=> owned[id])) ok = false;
      if(age < 6 && !(t.criteria.length === 1 && t.criteria[0].type === 'color')) oneColor = false;
      if(age >= 6 && age < 8){ if(t.criteria.length !== 1) cap = false; else kinds.add(t.criteria[0].type); }
      if(age >= 8 && t.criteria.length !== 2 && t.level === 3) two = false;
    }
    check('des consignes sont proposées avec une grande collection', made > 150);
    check('seulement des consignes réalisables : au moins 4 qui la respectent et 2 non, 8 choix tirés de la collection', ok);
    check('moins de 6 ans ou sans âge : un critère, la couleur', oneColor);
    check('6-7 ans : un critère, couleur, forme ou taille', cap && kinds.has('color') && kinds.has('shape') && kinds.has('size'));
    const big = Object.fromEntries(ids.map(id=> [id, 3]));
    check('8 ans et plus : deux critères', ev(`makeSortingTask(${json(big)}, 9).criteria.length`) === 2 && two);
    check('la consigne est dite en entier (« Range les … »)', /^Range les .*squishies/.test(ev(`makeSortingTask(${json(big)}, 9).say`)));
    ev('state.skills.rangement = { wins:0, fails:2, errors:4, last:null, recent:[], hints:0, lvl:1 }');
    check('niveau adaptatif : redescendu, un 8 ans range par couleur', ev(`makeSortingTask(${json(big)}, 9).criteria.map(c=>c.type).join()`) === 'color');
    ev('state.skills.rangement.lvl = 3');
    check('jamais au-dessus du plafond de l\'âge', ev(`makeSortingTask(${json(big)}, 5).criteria.length`) === 1 && ev(`makeSortingTask(${json(big)}, 5).criteria[0].type`) === 'color');
    ev('delete state.skills.rangement');
    check('l\'indice parlé dit ce qui ne va pas', ev('sortWrongHint("cupcake", [{type:"color", value:"rose"}])') === 'Lui, il est bleu. On cherche des roses !');
  }

  section('Jouer une boîte de rangement');
  {
    const big = Object.fromEntries(ALL().map(id=> [id, 2]));
    setOwned({ 'capy-fraise':1, 'donut':1, 'chat':1 });
    ev('openSquishyRoom("ranger")');
    check('collection trop petite : la zone l\'explique', shown('.sr-empty') && /au moins 6/.test(d.querySelector('.sr-empty').textContent) && /Ouvre des boîtes/.test(lastSaid()));
    setOwned(big);
    ev('state.coins = 0; currentProfile().age = 6; save(); openSquishyRoom("ranger")');
    const task = ()=> ev('sqSort.task');
    const goodBtns = ()=> [...d.querySelectorAll('.sr-item:not(:disabled)')].filter(b=> ev(`sortMatches(sqSort.task.items[${b.dataset.i}], sqSort.task.criteria)`));
    const badBtns = ()=> [...d.querySelectorAll('.sr-item:not(:disabled)')].filter(b=> !ev(`sortMatches(sqSort.task.items[${b.dataset.i}], sqSort.task.criteria)`));
    check('la consigne en image et à voix haute, 4 cases, 8 squishies', shown('.puzzle-hint') && (d.querySelector('.puzzle-hint .sq-dot') || d.querySelector('.puzzle-hint .sr-ico')) && d.querySelectorAll('.sr-cell').length === 4 && d.querySelectorAll('.sr-item').length === 8 && /Range les/.test(spoken.join(' ')));
    check('le bouton 💡 du compagnon est là', !!d.querySelector('#modal-body .game-head .hint-btn'));
    goodBtns()[0].click();
    check('un bon choix remplit une case', d.querySelectorAll('.sr-cell.in').length === 1);
    spoken.length = 0;
    const bad = badBtns()[0];
    bad.click();
    check('un mauvais rebondit, avec un indice parlé', bad.classList.contains('sr-bounce') && /^Lui, il est .* On cherche des /.test(lastSaid()) && d.querySelectorAll('.sr-cell.in').length === 1);
    check('le bouton 💡 se propose', d.querySelector('.hint-btn').classList.contains('nudge'));
    const key = task().key;
    badBtns()[0].click();
    check('2ᵉ erreur : on va changer de consigne', /autre boîte/.test(lastSaid()) && ev('state.skills.rangement.fails') === 1);
    await waitFor(()=> ev('sqSort && sqSort.task.key') !== key, 1000);
    check('nouvelle consigne, différente', ev('sqSort.task.key') !== key && d.querySelectorAll('.sr-cell.in').length === 0);
    check('la relance est annulable (fenêtre fermée : rien ne se rouvre)', await (async ()=>{
      badBtns()[0].click(); badBtns()[0].click(); ev('closeModal()');
      await wait(400);
      return !d.getElementById('overlay').classList.contains('show');
    })());
    const fill = async ()=>{
      ev('openSquishyRoom("ranger")');
      for(let i = 0; i < 4; i++) goodBtns()[0].click();
      return waitFor(()=> !!d.querySelector('.sr-win'), 1000);
    };
    await fill();
    check('4 cases : la boîte est rangée, 5 pièces', ev('state.coins') === 5 && ev('state.squishies.sorted') === 1 && /rangée/.test(lastSaid()));
    check('compteur et petite pile des boîtes rangées', (ev('openSquishyRoom("ranger")'), /1/.test(d.querySelector('.sr-pile').textContent)) && d.querySelectorAll('.sr-pile i').length === 1);
    await fill(); await fill();
    check('3 boîtes payées par jour', ev('state.coins') === 15 && ev('state.squishies.day.sorted') === 3);
    await fill();
    check('au-delà, pour le plaisir, sans pièces', ev('state.coins') === 15 && ev('state.squishies.sorted') === 4 && /plaisir/.test(d.querySelector('.sr-win').textContent));
    check('ranger n\'enlève rien à la collection', json(ev('state.squishies.owned')) === json(big));
    check('espace parents : réussites et erreurs du rangement', ev('state.skills.rangement.wins') === 4 && ev('state.skills.rangement.fails') === 2 && ev('skillsHTML(state, 6)').includes('Boîtes de rangement'));
    ev('closeModal(); currentProfile().age = 0; save()');
  }

  section('Marché');
  {
    setOwned({ 'donut':2, 'chat':1 });
    ev('state.missions = 0; switchView("marche"); currentTab = "echanger"; renderMarche()');
    check('Échanger : la section « Mes doubles de squishies »', !!d.querySelector('#marche-content .sq-market') && /Mes doubles de squishies/.test(d.querySelector('.sq-market h3').textContent));
    check('il manque des doubles : « Encore 2 doubles », bouton inactif', d.getElementById('sqm-trade').disabled && /Encore 2 doubles/.test(d.getElementById('sqm-trade').textContent));
    check('les silhouettes des manquants', d.querySelectorAll('.sqm-grid .sq-cell.missing').length === 16);
    setOwned({ 'donut':3, 'chat':2 });
    ev('renderMarche()');
    d.querySelector('[data-want="grenouille"]').click();
    check('assez de doubles : on choisit, le bouton s\'active', !d.getElementById('sqm-trade').disabled && !!d.querySelector('[data-want="grenouille"].selected'));
    d.getElementById('sqm-trade').click();
    check('l\'échange donne le squishy choisi', ev('squishyCount("grenouille")') === 1 && ev('squishyDuplicates()') === 0 && /Échangé/.test(lastSaid()));
    setOwned(Object.fromEntries(ALL().map(id=> [id, 1])));
    ev('renderMarche()');
    check('rien ne manque : la section l\'explique avec douceur', /complète/.test(d.querySelector('.sq-market').textContent) && !d.getElementById('sqm-trade'));
    ev('state.squishies = squishyFreshState(); state.coins = 50; save(); currentTab = "acheter"; renderMarche()');
    check('Acheter : la boîte surprise à 15 pièces', !!d.getElementById('sqm-buy') && /15 pièces/.test(d.querySelector('.sqm-shop').textContent));
    d.getElementById('sqm-buy').click();
    check('acheter : une boîte de plus, 15 pièces de moins', ev('squishyBoxCount()') === 1 && ev('state.coins') === 35 && !!d.getElementById('sqm-go'));
    d.getElementById('sqm-buy').click(); d.getElementById('sqm-buy').click();
    check('après 3 achats : « Reviens demain » et le bouton inactif', d.getElementById('sqm-buy').disabled && /Reviens demain/.test(d.querySelector('.sqm-shop').textContent));
    d.getElementById('sqm-go').click();
    check('« Ouvrir mes boîtes » mène à la chambre', shown('#sq-room[data-tab="collection"]'));
    ev('closeModal(); switchView("carte")');
  }

  section('Annonce de début de partie');
  {
    ev('state.squishies = squishyFreshState(); state.squishies.boxes = ["capy"]; save()');
    check('des boîtes attendent : on le dit une fois', ev('squishySessionHello()') === true);
    ev('openSquishyRoom("collection"); closeModal()');
    check('chambre déjà ouverte : plus d\'annonce', ev('squishySessionHello()') === false);
  }

  await wait(200);
  check('aucune erreur JS', errs.length === 0);
  if(errs.length) console.log(errs);
  console.log(failed ? `\n${failed} échec(s), ${passed} réussi(s)` : `\nTous les tests des squishies passent (${passed})`);
  process.exit(failed ? 1 : 0);
})();
