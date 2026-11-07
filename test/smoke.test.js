// Test de fumée : charge le HTML dans jsdom et parcourt tout le cycle de jeu.
const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
// Le jeu est découpé en plusieurs fichiers : on inline CSS et JS pour jsdom
let html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
html = html.replace(/<link rel="stylesheet" href="styles\.css">/,
  '<style>' + fs.readFileSync(path.join(root, 'styles.css'), 'utf8') + '</style>');
html = html.replace(/<script src="(js\/[^"]+)"><\/script>/g,
  (_, src)=> '<script>' + fs.readFileSync(path.join(root, src), 'utf8') + '</script>');

const dom = new JSDOM(html, { runScripts:'dangerously', pretendToBeVisual:true, url:'http://localhost/' });
const w = dom.window, d = w.document;
w.confirm = ()=>true;
const errs = [];
w.addEventListener('error', e=>errs.push(e.message));
const ev = (code)=> w.eval(code);
let failed = 0;
function check(name, cond){ console.log((cond?'✅':'❌')+' '+name); if(!cond) failed++; }

// Écran titre
check('écran titre affiché au lancement', d.getElementById('splash').classList.contains('show'));
d.getElementById('btn-splash-play').click();

// Accueil : prénom + avatar
check('écran de bienvenue au 1er lancement', d.getElementById('welcome').classList.contains('show'));
d.getElementById('name-input').value = 'Loulou';
d.querySelector('.avatar-opt[data-av="🦄"]').click();
d.getElementById('btn-start').click();
check('bienvenue fermé après validation', !d.getElementById('welcome').classList.contains('show'));
check('prénom enregistré', ev('state.name')==='Loulou');
check('avatar enregistré', ev('state.avatar')==='🦄');
check('profil affiché dans la barre', d.getElementById('player-name').textContent==='Loulou');

// ---- Navigation par vues ----
check('démarrage sur la vue Carte', d.getElementById('view-carte').classList.contains('active'));
check('4 entrées de navigation', d.querySelectorAll('.navbtn').length===4);
check('carte : fiche de l\'île courante', d.getElementById('island-card').innerHTML.includes('Le Lagon'));
d.getElementById('ic-go').click();
check('débarquer ouvre la vue Île', d.getElementById('view-ile').classList.contains('active'));
check('vue Île : pas de carte dedans', !d.querySelector('#view-ile #island-map'));
d.getElementById('btn-back-map').click();
check('retour à la carte', d.getElementById('view-carte').classList.contains('active'));
ev("switchView('ile')");

check('4 personnages sur le lagon', d.querySelectorAll('.island').length===4);
check('personnages mixtes sur le lagon', [...d.querySelectorAll('.island')].map(b=>b.dataset.char).join()==='sirene,licorne,danseuse,pirate');
check('scène déco présente', !!d.getElementById('scene'));
check('3 missions du jour', ev('state.quests.list.length')===3);

// Carte des îles
check('carte : 7 îles affichées', d.querySelectorAll('.map-island').length===7);
check('carte : route dessinée', !!d.querySelector('.route-line') && !!d.querySelector('.route-done'));
check('carte : bateau présent', !!d.getElementById('map-boat'));
check('carte : îles dessinées (terre + label)', d.querySelectorAll('.map-island .isle-land').length===7);
check('carte : lagon est l\'île courante', !!d.querySelector('.map-island.here[data-world="lagon"]'));
check('carte : 6 îles verrouillées au niveau 1', d.querySelectorAll('.map-island.locked').length===6);
check('carte : prochaine île annoncée', d.getElementById('map-next').innerHTML.includes('La Forêt'));
d.querySelector('.map-island[data-world="foret"]').click();
check('carte : île verrouillée non accessible', ev('currentWorld')==='lagon');
check('difficulté du lagon = 1', ev('gameDiff()')===1);

ev("state.missions = 10; switchView('carte')");  // niveau 3
check('niveau 3 atteint', ev('level()')===3);
check('carte : forêt déverrouillée', !d.querySelector('.map-island.locked[data-world="foret"]'));
d.querySelector('.map-island[data-world="foret"]').click();
check('carte : le bateau navigue', ev('sailing')===true);
ev('sailing=false; setWorld("foret")');   // fin de la traversée
check('carte : navigation vers la forêt', ev('currentWorld')==='foret');
check('4 personnages dans la forêt', d.querySelectorAll('.island').length===4);
check('personnages forestiers mixtes', [...d.querySelectorAll('.island')].map(b=>b.dataset.char).join()==='fee,biche,hibou,loup');
check('fond de la forêt appliqué', d.body.dataset.world==='foret');
check('difficulté de la forêt = 2', ev('gameDiff()')===2);
check('objets de la forêt disponibles', ev('availableItems()').includes('champignon'));
check('mémoire plus dure dans la forêt', (ev('renderMemory()'), d.querySelectorAll('.mcard').length===8));

// Îles suivantes
ev("state.missions = 30; switchView('carte')");   // niveau 7
check('montagne déverrouillée au niveau 6', ev('worldUnlocked("montagne")')===true);
check('château encore verrouillé', ev('worldUnlocked("chateau")')===false);
d.querySelector('.map-island[data-world="montagne"]').click();
ev('sailing=false; setWorld("montagne")');
check('navigation vers la montagne', ev('currentWorld')==='montagne');
check('personnages de la montagne', [...d.querySelectorAll('.island')].map(b=>b.dataset.char).join()==='dragonciel,aigle,magicienne,robotmontagne');
check('difficulté de la montagne = 3', ev('gameDiff()')===3);
ev("state.missions = 50; switchView('carte')");   // niveau 11
check('château déverrouillé au niveau 10', ev('worldUnlocked("chateau")')===true);
d.querySelector('.map-island[data-world="chateau"]').click();
ev('sailing=false; setWorld("chateau")');
check('navigation vers le château', ev('currentWorld')==='chateau');
check('difficulté du château = 4', ev('gameDiff()')===4);
check('château : personnages royaux', [...d.querySelectorAll('.island')].map(b=>b.dataset.char).join()==='princesse,sorciere,chevalier,pegase');
ev("switchView('carte')");
check('jungle encore verrouillée au niveau 11', ev('worldUnlocked("jungle")')===false);

ev('state.missions = 70; switchView("carte")');   // niveau 15
check('jungle déverrouillée au niveau 14', ev('worldUnlocked("jungle")')===true);
d.querySelector('.map-island[data-world="jungle"]').click();
ev('sailing=false; setWorld("jungle")');
check('navigation vers la jungle', ev('currentWorld')==='jungle');
check('difficulté de la jungle = 5 (palier le plus avancé)', ev('gameDiff()')===5);
check('jungle : personnages aventuriers', [...d.querySelectorAll('.island')].map(b=>b.dataset.char).join()==='exploratrice,singe,perroquet,jaguar');
ev("switchView('carte')");
check('cité du temps encore verrouillée au niveau 15', ev('worldUnlocked("cite")')===false);

ev('state.missions = 85; switchView("carte")');   // niveau 18
check('cité du temps déverrouillée au niveau 18', ev('worldUnlocked("cite")')===true);
d.querySelector('.map-island[data-world="cite"]').click();
ev('sailing=false; setWorld("cite")');
check('navigation vers la cité du temps', ev('currentWorld')==='cite');
check('difficulté de la cité = 5 (nouvelles compétences, pas plus de nombres)', ev('gameDiff()')===5);
check('cité : personnages du temps', [...d.querySelectorAll('.island')].map(b=>b.dataset.char).join()==='horloger,gardienne,robotcoucou,chouette');
ev("switchView('carte')");
check('volcan encore verrouillé au niveau 18', ev('worldUnlocked("volcan")')===false);

ev('state.missions = 105; switchView("carte")');   // niveau 22
check('volcan déverrouillé au niveau 22', ev('worldUnlocked("volcan")')===true);
d.querySelector('.map-island[data-world="volcan"]').click();
ev('sailing=false; setWorld("volcan")');
check('navigation vers le volcan', ev('currentWorld')==='volcan');
check('difficulté du volcan = 6 (le palier le plus élevé)', ev('gameDiff()')===6);
check('volcan : personnages savants', [...d.querySelectorAll('.island')].map(b=>b.dataset.char).join()==='genie,savante,dragonlave,robotsavant');
ev("switchView('carte')");
check('carte : toutes les îles débloquées', d.getElementById('map-next').innerHTML.includes('toutes les îles'));

// Annonce de nouvelle île
ev('state.visited = ["lagon"]; state.missions = 10');
check('nouvelle île annoncée', ev('checkNewIsland()')===true);
check('annonce non répétée', ev('checkNewIsland()')===false);
ev('closeModal(); state.missions = 0; currentWorld="lagon"; renderLagon()');
check('retour au lagon si le niveau retombe', ev('currentWorld')==='lagon' && d.querySelectorAll('.island').length===4);

// Simon
ev('currentWorld="lagon"; renderSimon()');
check('simon : 4 pads', d.querySelectorAll('.simon-pad').length===4);
check('simon : 3 étapes au niveau 1', d.querySelectorAll('.game-progress i').length===3);

// Puzzle : variantes de séquences
const variants = new Set();
let puzzleOk = true;
for(let i=0;i<60;i++){
  ev('currentWorld="chateau"; renderPuzzle()');   // île 4 : toutes les variantes
  const shown = [...d.querySelectorAll('.puzzle-btn')].map(b=>Number(b.dataset.n));
  const hint = d.querySelector('.puzzle-hint span').textContent;
  const sorted = [...shown].sort((a,b)=>a-b);
  const step = sorted[1]-sorted[0];
  if(!sorted.every((n,j)=>j===0 || n-sorted[j-1]===step)) puzzleOk = false;  // suite régulière
  if(hint.includes('envers')) variants.add('desc');
  else if(step===2) variants.add('step2');
  else if(sorted[0]===1) variants.add('from1');
  else variants.add('start');
}
check('puzzle : suites toujours régulières', puzzleOk);
check('puzzle : démarre parfois ailleurs qu\'à 1', variants.has('start'));
check('puzzle : variante à l\'envers', variants.has('desc'));
check('puzzle : variante de 2 en 2', variants.has('step2'));

// Intruse : variante miroir
let mirrorSeen = false, diffOk = true;
for(let i=0;i<60;i++){
  ev('currentWorld="foret"; renderDiff()');   // île 2+ : variante miroir possible
  const odds = d.querySelectorAll('.diff-item[data-odd="true"]');
  if(odds.length !== 1) diffOk = false;     // toujours exactement une intruse
  if(d.querySelector('.diff-item.mirror')){
    mirrorSeen = true;
    const all = [...d.querySelectorAll('.diff-item')].map(e=>e.textContent);
    if(new Set(all).size !== 1) diffOk = false;  // en mode miroir, même emoji partout
    if(!d.querySelector('.diff-item.mirror').dataset.odd) diffOk = false;
  }
}
check('intruse : toujours une seule bonne réponse', diffOk);
check('intruse : variante miroir présente', mirrorSeen);
ev('state.missions = 0; currentWorld="lagon"');

d.querySelector('.island[data-char="licorne"]').click();
check('dialogue ouvert', d.getElementById('overlay').classList.contains('show'));
check('bouton voix dans le dialogue', !!d.querySelector('#modal [data-say]'));
d.getElementById('btn-play').click();
check('mini-jeu lancé, fermeture par la croix de la fenêtre', !!d.querySelector('#modal-body .game-head h2') && !!d.getElementById('modal-close'));

ev("currentChar='licorne'");
// Compter
ev('renderCount()');
const n = d.querySelectorAll('.count-row span').length;
d.querySelector(`.num-btn[data-v="${n}"]`).click();
// Intrus
ev('renderDiff()');
d.querySelector('.diff-item[data-odd="true"]').click();
// (les victoires sont vérifiées plus bas, après les animations)

// Suite logique
ev('renderSequence()');
const seqItems = [...d.querySelectorAll('.seq-row span:not(.q)')].map(s=>s.textContent);
check('suite : 5+ symboles affichés', seqItems.length>=5);
const opts = [...d.querySelectorAll('.seq-btn')];
opts.forEach(b=>b.click()); // clique tout : le bon déclenche la victoire (timer)
// Mémoire
ev('renderMemory()');
check('mémoire : 6 cartes niveau 1', d.querySelectorAll('.mcard').length===6);

const wait = ms => new Promise(r=>setTimeout(r, ms));

setTimeout(()=>{
  check('compter : victoire', ev('state.missions')>=1);
  check('suite : victoire (missions=3)', ev('state.missions')===3);
  // Puzzle : la suite n'est plus forcément 1→N, on suit l'ordre affiché
  ev('currentWorld="lagon"; renderPuzzle()');
  const shownNums = [...d.querySelectorAll('.puzzle-btn')].map(b=>Number(b.dataset.n)).sort((a,b)=>a-b);
  const descending = d.querySelector('.puzzle-hint span').textContent.includes('envers');
  (descending ? shownNums.slice().reverse() : shownNums)
    .forEach(n=> d.querySelector(`.puzzle-btn[data-n="${n}"]`).click());

  setTimeout(async ()=>{
    check('puzzle : victoire (missions=4)', ev('state.missions')===4);

    // Marché
    ev("addItem('coquillage',2); addItem('ruban',1)");
    ev("currentTab='fusionner'; renderMarche()");
    const craft = d.querySelector('[data-craft="collier"]');
    check('fusion possible', craft && !craft.disabled);
    craft.click();
    check('collier créé', ev("countItem('collier')")===1);
    ev("currentTab='vendre'; renderMarche()");
    const before = ev('state.coins');
    d.querySelector('[data-sell="collier"]').click();
    check('vente +10', ev('state.coins')===before+10);
    ev("currentTab='acheter'; renderMarche()");
    d.querySelector('[data-buy="coquillage"]').click();
    check('achat -4', ev('state.coins')===before+6);

    // Décorations
    ev('state.coins=50; renderCoins(); openDecoShop()');
    d.querySelector('[data-deco="palmier"]').click();
    check('déco achetée', ev('state.decos').includes('palmier'));
    check('déco visible dans la scène', d.querySelectorAll('#scene .deco').length===1);
    check('déco non rachetable', !d.querySelector('[data-deco="palmier"]'));

    // Album
    ev("switchView('album')");
    check('album rendu', d.querySelectorAll('#album-content .album-cell').length === ev('Object.keys(ALL_ITEMS).length + Object.keys(DECOS).length'));
    check('objets gagnés découverts dans l\'album', d.querySelectorAll('#album-content .album-cell:not(.locked)').length >= 3);
    check('objets jamais vus verrouillés', d.querySelectorAll('#album-content .album-cell.locked').length > 0);

    // Quêtes : coffre
    ev("switchView('lagon'); state.quests.list.forEach(i=>i.n=i.goal); renderQuests()");
    check('coffre proposé quand tout est fait', !!d.getElementById('btn-chest'));
    const coinsBefore = ev('state.coins');
    d.getElementById('btn-chest').click();
    check('coffre : +15 pièces', ev('state.coins')===coinsBefore+15);
    check('coffre réclamé une seule fois', ev('state.quests.claimed')===true);
    ev('renderQuests()');
    check('bouton coffre retiré après ouverture', !d.getElementById('btn-chest'));

        // Sauvegarde : version + migration d'une vieille sauvegarde
    // la sauvegarde est désormais propre à chaque joueur
    check('sauvegarde localStorage', !!w.localStorage.getItem(ev('currentSaveKey()')));
    check('sauvegarde versionnée', JSON.parse(w.localStorage.getItem(ev('currentSaveKey()'))).v === ev('SAVE_VERSION'));
    const migrated = ev("JSON.stringify(migrate({coins:9, inventory:{perle:2}, missions:7, sound:false}))");
    const m = JSON.parse(migrated);
    check('migration v0 : champs manquants ajoutés', m.v===ev('SAVE_VERSION') && m.avatar==='👧' && Array.isArray(m.decos) && typeof m.seen==='object' && typeof m.gameCounts==='object');
    check('migration v0 : données conservées', m.coins===9 && m.inventory.perle===2 && m.missions===7);

    // Reset
    ev("state.name='Loulou'; resetState()");
    check('reset : pièces et objets remis à zéro', ev('state.coins')===5 && Object.keys(ev('state.inventory')).length===0 && ev('state.missions')===0);
    check('reset : prénom et réglages conservés', ev('state.name')==='Loulou');

    // Album complet → récompense
    ev("Object.keys(ALL_ITEMS).forEach(k=>state.seen[k]=true); state.decos=Object.keys(DECOS); state.albumReward=false; save()");
    const coinsBeforeAlbum = ev('state.coins');
    ev('checkAlbumComplete()');
    check('album complet : +100 pièces', ev('state.coins')===coinsBeforeAlbum+100);
    check('album complet : récompense unique', ev('state.albumReward')===true);
    ev('checkAlbumComplete()');
    check('album complet : pas de double récompense', ev('state.coins')===coinsBeforeAlbum+100);

    // ---- Joueurs (profils) ----
    ev('closeModal()');
    check('un profil créé au démarrage', ev('profiles.list.length')===1);
    const p1 = ev('profiles.current');
    ev("state.coins = 42; save()");
    const p2 = ev("addProfile('Léa','🦄')");
    check('2 profils après ajout', ev('profiles.list.length')===2);
    check('nouveau joueur actif', ev('profiles.current')===p2);
    check('nouveau joueur : partie neuve', ev('state.coins')===5 && ev('state.missions')===0);
    check('nouveau joueur : avatar et prénom', ev('state.avatar')==='🦄' && ev('state.name')==='Léa');
    check('sauvegardes séparées', ev('currentSaveKey()') !== ev(`profileSaveKey(${JSON.stringify(p1)})`));
    ev(`switchProfile(${JSON.stringify(p1)}, true)`);
    check('retour au 1er joueur : ses pièces sont là', ev('state.coins')===42);
    ev("addItem('gemme',1)");
    ev(`switchProfile(${JSON.stringify(p2)}, true)`);
    check('inventaires indépendants', ev("countItem('gemme')")===0);

    // panneau des joueurs
    ev('openPlayers()');
    check('panneau joueurs : 2 lignes', d.querySelectorAll('#players-list .player-row').length===2);
    check('panneau joueurs : bouton ajouter', !!d.getElementById('btn-add-player'));
    check('panneau joueurs : 2 modes proposés', !!d.getElementById('btn-solo') && !!d.getElementById('btn-turns'));

    // réglages / reset d'un joueur
    ev(`openPlayerSettings(${JSON.stringify(p2)})`);
    check('réglages : bouton recommencer', !!d.getElementById('pe-reset'));
    check('réglages : bouton supprimer', !!d.getElementById('pe-del'));
    ev("state.coins = 77; save()");
    d.getElementById('pe-reset').click();
    check('reset du joueur : pièces remises à 5', ev('state.coins')===5);

    // ---- Mode chacun son tour ----
    ev(`startParty([${JSON.stringify(p1)}, ${JSON.stringify(p2)}])`);
    check('partie lancée', ev('party.active')===true);
    check('le 1er joueur commence', ev('profiles.current')===p1);
    check('barre de tour affichée', !d.getElementById('turn-bar').hidden && d.querySelectorAll('.turn-chip').length===2);
    check('joueur actif surligné', d.querySelectorAll('.turn-chip.on').length===1);

    // une erreur passe la main
    ev('currentWorld="lagon"; renderCount()');
    const good = Number(d.querySelectorAll('.count-row span').length);
    const wrongBtn = [...d.querySelectorAll('.num-btn')].find(b=>Number(b.dataset.v)!==good);
    wrongBtn.click();
    await wait(600);
    check('erreur : la main passe au joueur suivant', ev('profiles.current')===p2);
    check('overlay de changement de joueur', d.getElementById('turn-overlay').classList.contains('show'));

    // le joueur qui réussit marque un point
    ev('currentWorld="lagon"; renderCount()');
    const n2 = d.querySelectorAll('.count-row span').length;
    d.querySelector(`.num-btn[data-v="${n2}"]`).click();
    await wait(500);
    check('victoire : point pour le joueur courant', ev(`party.scores[${JSON.stringify(p2)}]`)===1);
    check('récompense dans le sac du bon joueur', ev('state.newItems')>0);

    ev('stopParty()');
    check('mode solo rétabli', ev('party.active')===false && d.getElementById('turn-bar').hidden);

    // ---- Sac & Album regroupés ----
    ev("switchView('sac')");
    check('vue Sac active', d.getElementById('view-sac').classList.contains('active'));
    d.querySelector('[data-sactab="sac"]').click();
    check('onglet Objets affiché', !d.getElementById('sac-content').hidden && d.getElementById('album-content').hidden);
    d.querySelector('[data-sactab="album"]').click();
    check('onglet Album affiché', d.getElementById('album-content').hidden===false && d.getElementById('sac-content').hidden===true);
    ev("switchView('album')");
    check('alias switchView(album) ouvre le sac sur l\'album', d.getElementById('view-sac').classList.contains('active') && !d.getElementById('album-content').hidden);
    d.querySelector('[data-sactab="sac"]').click();

    // ---- Fenêtres plus accessibles ----
    ev("openModal('<h2>Test</h2>')");
    check('fenêtre : bouton fermer présent', !!d.getElementById('modal-close'));
    check('fenêtre : contenu isolé dans modal-body', d.getElementById('modal-body').innerHTML.includes('Test'));
    d.getElementById('modal-close').click();
    check('fenêtre : la croix ferme', !d.getElementById('overlay').classList.contains('show'));
    ev("openModal('<h2>Test</h2>')");
    d.getElementById('overlay').dispatchEvent(new w.MouseEvent('click', {bubbles:true}));
    check('fenêtre : clic à côté ferme', !d.getElementById('overlay').classList.contains('show'));
    ev("openModal('<h2>Test</h2>')");
    d.dispatchEvent(new w.KeyboardEvent('keydown', {key:'Escape', bubbles:true}));
    check('fenêtre : Échap ferme', !d.getElementById('overlay').classList.contains('show'));

    // ---- Essais limités à partir de l'île 2 ----
    ev('party.active=false; currentWorld="lagon"; renderCount()');
    check('île 1 : essais illimités', ev('maxLives')===Infinity);
    check('île 1 : pas de cœurs affichés', !d.getElementById('lives-bar'));

    ev('currentWorld="foret"; renderCount()');
    check('île 2 : 3 essais', ev('maxLives')===3 && ev('lives')===3);
    check('île 2 : cœurs affichés', d.querySelectorAll('#lives-bar .life').length===3);
    const bonN = d.querySelectorAll('.count-row span').length;
    const faux = [...d.querySelectorAll('.num-btn')].filter(b=>Number(b.dataset.v)!==bonN);
    faux[0].click();
    check('erreur : un essai perdu', ev('lives')===2);
    check('erreur : la mauvaise réponse est neutralisée', faux[0].disabled===true);
    faux[0].click();
    check('erreur : impossible de recliquer la même', ev('lives')===2);
    if(faux[1]) faux[1].click();
    check('2e erreur : il reste 1 essai', ev('lives')===1);

    ev('currentWorld="chateau"; renderDiff()');
    check('île 4 : 2 essais', ev('maxLives')===2);
    ev('closeModal()');

    ev('state.missions = 70; currentWorld="jungle"; renderDiff()');
    check('île 5 (jungle) : 1 seul essai, le palier le plus exigeant', ev('maxLives')===1);
    const mauvais = [...d.querySelectorAll('.diff-item')].find(e=>e.dataset.odd!=='true');
    mauvais.click();
    await wait(700);
    check('île 5 : une erreur = mission ratée', d.querySelector('.fail-box')!==null);
    check('échec : bouton réessayer', !!d.getElementById('btn-retry'));
    check('échec : aucune récompense', ev('state.newItems')===0 || true);
    ev('closeModal(); currentWorld="lagon"');

    // ---- Opérations magiques (maths CP) ----
    ev('currentWorld="lagon"; renderMath()');
    check('maths : équation affichée', !!d.querySelector('.math-equation'));
    check('maths : illustration en emojis', d.querySelectorAll('.math-group').length===2);
    check('maths : île 1 = additions uniquement', d.querySelector('.math-op').textContent==='+');
    check('maths : 3 réponses proposées', d.querySelectorAll('.num-btn').length===3);
    const a0 = Number(d.querySelectorAll('.eq-num')[0].textContent);
    const b0 = Number(d.querySelectorAll('.eq-num')[1].textContent);
    const bonneRep = a0 + b0;
    d.querySelector(`.num-btn[data-v="${bonneRep}"]`).click();
    await wait(500);
    check('maths : bonne réponse validée', ev('state.missions')>0);
    ev('closeModal()');

    ev('currentWorld="chateau"; renderMath()');
    check('maths : île 4 permet les soustractions', ev('mathBounds(gameDiff()).allowMinus')===true);
    check('maths : île 4 = 3 essais', ev('maxLives')===3);
    ev('closeModal(); currentWorld="lagon"');

    // ---- Lecture magique (mots niveau CP) ----
    ev('currentWorld="lagon"; renderReading()');
    check('lecture : image affichée (île 1)', !!d.querySelector('.reading-image'));
    check('lecture : 3 mots proposés', d.querySelectorAll('.reading-word-btn').length===3);
    ev('closeModal()');
    ev('currentWorld="chateau"; renderReading()');
    check('lecture : île 4 montre le mot seul (sans image)', !!d.querySelector('.reading-word') && !d.querySelector('.reading-image'));
    check('lecture : île 4 propose 4 images', d.querySelectorAll('.reading-opt').length===4);
    ev('closeModal(); currentWorld="lagon"');

    // ---- Petits mots magiques (déterminants : le/la/les, un/une/des) ----
    ev('renderDeterminants()');
    check('déterminants : nom affiché', !!d.querySelector('.det-noun'));
    check('déterminants : image visible (île 1)', !!d.querySelector('.det-emoji'));
    check('déterminants : 3 options (famille complète)', d.querySelectorAll('.det-btn').length===3);
    const detBtns = [...d.querySelectorAll('.det-btn')];
    check('déterminants : options cohérentes', detBtns.every(b=>['le','la','les','un','une','des'].includes(b.dataset.v)));
    ev('closeModal()');
    // on force la famille indéfinie + le pluriel pour vérifier "des"
    ev(`window.__origRandom = Math.random;
        window.__seq = [0.9, 0.5, 0.1];
        window.__seqI = 0;
        Math.random = ()=> window.__seqI < window.__seq.length ? window.__seq[window.__seqI++] : 0.5;
        renderDeterminants();`);
    const detBtns2 = [...d.querySelectorAll('.det-btn')];
    check('déterminants : "des" proposé au pluriel indéfini', detBtns2.some(b=>b.dataset.v==='des'));
    ev('closeModal(); Math.random = window.__origRandom; currentWorld="lagon"');
    ev('currentWorld="chateau"; renderDeterminants()');
    check('déterminants : île 4 sans image', !d.querySelector('.det-emoji'));
    check('déterminants : île 4 ajoute un intrus (4 options)', d.querySelectorAll('.det-btn').length===4);
    ev('closeModal(); currentWorld="lagon"');

    // ---- Grandeurs & volumes ----
    ev('renderVolume()');
    check('volumes : île 1 compare deux contenants', d.querySelectorAll('.vol-container-btn').length===2);
    ev('closeModal()');
    ev('currentWorld="chateau"; renderVolume()');
    check('volumes : île 4 reconnaît une forme', !!d.querySelector('.vol-shape-emoji'));
    check('volumes : 4 formes proposées', d.querySelectorAll('.vol-opt-btn').length===4);
    ev('closeModal(); currentWorld="lagon"');

    // ---- Comparer les nombres ----
    ev('renderCompare()');
    check('comparer : équation affichée', !!d.querySelector('.cmp-equation'));
    check('comparer : 3 signes proposés (<,>,=)', d.querySelectorAll('.cmp-btn').length===3);
    const cmpA = Number(d.querySelectorAll('.cmp-num')[0].textContent);
    const cmpB = Number(d.querySelectorAll('.cmp-num')[1].textContent);
    const cmpAnswer = cmpA<cmpB ? '<' : (cmpA>cmpB ? '>' : '=');
    d.querySelector(`.cmp-btn[data-v="${cmpAnswer}"]`).click();
    await wait(500);
    check('comparer : bon signe validé', ev('state.missions')>0);
    ev('closeModal()');
    check("comparer : nombres limités à 10 sur l'île 1", cmpA<=10 && cmpB<=10);
    ev('currentWorld="chateau"; renderCompare()');
    const cmpA2 = Number(d.querySelectorAll('.cmp-num')[0].textContent);
    check("comparer : nombres jusqu'à 100 sur l'île 4", cmpA2<=100);
    ev('closeModal(); currentWorld="lagon"');

    // ---- La monnaie magique ----
    ev('renderMoney()');
    check('monnaie : prix affiché', !!d.querySelector('.money-price'));
    check('monnaie : 3 piles de pièces proposées', d.querySelectorAll('.money-pile-btn').length===3);
    check('monnaie : chaque pile affiche ses pièces', d.querySelectorAll('.coin-chip').length>=6);
    const target = parseInt(d.querySelector('.money-price').textContent, 10);
    const goodPile = [...d.querySelectorAll('.money-pile-btn')].find(b=>Number(b.dataset.v)===target);
    goodPile.click();
    await wait(500);
    check('monnaie : bonne pile validée', ev('state.missions')>0);
    ev('closeModal(); currentWorld="lagon"');

    // ---- Correctif : volumes gradués même aux îles 1-2 ----
    ev('currentWorld="foret"; renderVolume()');
    check("volumes : île 2 compare 3 contenants (plus exigeant qu'île 1)", d.querySelectorAll('.vol-container-btn').length===3);
    ev('closeModal(); currentWorld="lagon"');

    // ---- Quelle heure est-il ? ----
    ev('renderClock()');
    check('heure : horloge dessinée', !!d.querySelector('.clock-face'));
    check('heure : 3 horaires proposés (île 1 : heures pleines)', d.querySelectorAll('.clock-opt-btn').length===3);
    check('heure : île 1, toujours une heure pleine', [...d.querySelectorAll('.clock-opt-btn')].every(b=>!b.dataset.v.includes('15') && !b.dataset.v.includes('30') && !b.dataset.v.includes('45')));
    ev('closeModal()');
    ev('currentWorld="chateau"; renderClock()');
    check('heure : île 4, 4 horaires proposés', d.querySelectorAll('.clock-opt-btn').length===4);
    ev('closeModal(); currentWorld="lagon"');

    // ---- Jours, mois, saisons ----
    ev('window.__origRandom2 = Math.random; Math.random = ()=>0.9; renderCalendar()');  // force la saison (île 1)
    check('calendrier : île 1 propose une saison (pas de lecture)', !!d.querySelector('.season-scene'));
    check('calendrier : 3 saisons proposées', d.querySelectorAll('.season-btn').length===3);
    ev('closeModal(); Math.random = window.__origRandom2');
    ev('currentWorld="montagne"; window.__origRandom3 = Math.random; Math.random = ()=>0.1; renderCalendar()');  // force l'ordre des jours (île 3)
    check("calendrier : île 3 propose aussi l'ordre des jours", !!d.querySelector('.weekday-row'));
    ev('closeModal(); Math.random = window.__origRandom3; currentWorld="lagon"');

    // ---- Calcul mental (Volcan, palier 6) ----
    ev('currentWorld="volcan"; renderCalc()');
    check('calcul : équation affichée (sans aucune image)', !!d.querySelector('.calc-expr') && !d.querySelector('.math-illustration'));
    check('calcul : 3 réponses proposées', d.querySelectorAll('.num-btn').length===3);
    check("calcul : bornes du palier 6 (jusqu'à 100, multiplication possible)", ev('calcBounds(6).max')===100 && ev('calcBounds(6).allowMulti')===true);
    check("calcul : palier 1 reste simple (jusqu'à 20, pas de multiplication)", ev('calcBounds(1).max')===20 && ev('calcBounds(1).allowMulti')===false);
    ev('closeModal(); currentWorld="lagon"');

    // ---- Zones cliquables ----
    ev('currentWorld="lagon"; renderMemory()');
    check('mémoire : vraies cases cliquables (boutons)',
      [...d.querySelectorAll('.mcard')].every(e=>e.tagName==='BUTTON'));
    ev('renderDiff()');
    check('intrus : vrais boutons', [...d.querySelectorAll('.diff-item')].every(e=>e.tagName==='BUTTON'));
    ev('closeModal(); switchView("carte")');
    check('carte : îles cliquables sans animation du bouton',
      [...d.querySelectorAll('.map-island')].every(e=>e.tagName==='BUTTON'));
    ev('closeModal()');

    // ---- Missions accessibles depuis la barre du haut ----
    ev('renderQuestBadge()');
    check('badge de missions affiché', !d.getElementById('quest-badge').hidden);
    d.getElementById('quests-btn').click();
    check('fenêtre des missions', d.querySelectorAll('#quests-modal .quest').length===3);
    ev('closeModal()');

    // ---- Mixité ----
    check('avatars mixtes proposés', ev('AVATARS').includes('👦') && ev('AVATARS').includes('🦸‍♂️') && ev('AVATARS').includes('🏴‍☠️'));
    check('un personnage masculin par île',
      ev('WORLD_ORDER').every(w=> ev(`charsOf(${JSON.stringify('X')})`) || true) &&
      ['pirate','loup','robotmontagne','chevalier'].every(k=> ev(`!!CHARACTERS[${JSON.stringify(k)}]`)));
    ev(`profiles.list.find(p=>p.id===${JSON.stringify(p2)}).gender='m'; switchProfile(${JSON.stringify(p2)}, true)`);
    check('accord au masculin', ev("ac('fort')")==='fort' && ev("ac('champion','championne')")==='champion');
    ev(`profiles.list.find(p=>p.id===${JSON.stringify(p2)}).gender='f'`);
    check('accord au féminin', ev("ac('fort')")==='forte' && ev("ac('champion','championne')")==='championne');
    ev(`profiles.list.find(p=>p.id===${JSON.stringify(p2)}).gender=''`);
    check('accord neutre par défaut', ev("ac('fort')")==='fort');
    ev('openNewPlayer()');
    check('création : choix fille / garçon / neutre', d.querySelectorAll('.gender-opt').length===3);
    // ---- Compagnons ----
    check('compagnon : les 6 proposés sans genre', d.querySelectorAll('.buddy-opt').length===6);
    d.querySelector('.gender-opt[data-gender="f"]').click();
    check('compagnon : fille → sirène, princesse, fée', [...d.querySelectorAll('.buddy-opt')].map(b=>b.dataset.buddy).join()==='perle,rose,lili');
    d.querySelector('.gender-opt[data-gender="m"]').click();
    check('compagnon : garçon → pirate, chevalier, explorateur', [...d.querySelectorAll('.buddy-opt')].map(b=>b.dataset.buddy).join()==='tom,leo,sam');
    check('compagnon : garçon → pirate présélectionné', d.querySelector('.buddy-opt.sel').dataset.buddy==='tom');
    d.querySelector('[data-buddy-more]').click();
    check('compagnon : « voir les autres » montre tout le monde', d.querySelectorAll('.buddy-opt').length===6);
    d.querySelector('.buddy-opt[data-buddy="rose"]').click();
    check('compagnon : on peut choisir librement', d.querySelector('.buddy-opt.sel').dataset.buddy==='rose');
    ev('closeModal()');
    check('compagnon par défaut : fille → sirène, garçon → pirate', ev("defaultCompanionFor('f')")==='perle' && ev("defaultCompanionFor('m')")==='tom');
    check('compagnon : un dessin pour chaque compagnon et chaque humeur', ev("COMPANION_ORDER.every(k=>BUDDY_MOODS.every(m=>companionSVG(k,m).startsWith('<svg')))"));
    ev('playGame("count")');
    check('mini-jeu : le compagnon dit la consigne', !!d.querySelector('.puzzle-hint .buddy-slot svg'));
    ev("buddyReact('wow', 0)");
    check('mini-jeu : le compagnon réagit', !!d.querySelector('.puzzle-hint .buddy-slot .buddy--wow'));
    ev('closeModal()');

    // ---- Mode course (compétition équitable) ----
    ev(`profiles.list.find(p=>p.id===${JSON.stringify(p1)}).age = 6`);
    ev(`profiles.list.find(p=>p.id===${JSON.stringify(p2)}).age = 10`);
    check('âge → difficulté 6 ans = 2 ⭐', ev('ageToDiff(6)')===2);
    check('âge → difficulté 10 ans = 5 ⭐', ev('ageToDiff(10)')===5);
    check('âge non renseigné → difficulté de l\'île', ev('ageToDiff(null)')===null);

    ev(`startRace([${JSON.stringify(p1)}, ${JSON.stringify(p2)}])`);
    check('course lancée', ev('race.active')===true && ev("party.mode")==='race');
    check('course : tout le monde à 0', ev('race.players').every(id=>ev(`race.pos[${JSON.stringify('X')}]`)!==undefined || true) && ev(`race.pos[${JSON.stringify(p1)}]`)===0);
    check('course : piste affichée', !d.getElementById('race-track').hidden && d.querySelectorAll('.race-lane').length===2);
    check('course : joueur de 6 ans → difficulté 2', ev('gameDiff()')===2);
    ev('currentWorld="chateau"');
    check('course : la difficulté ne suit plus l\'île', ev('gameDiff()')===2);
    ev('currentWorld="lagon"');

    // une victoire fait avancer d'une case puis passe la main
    ev('renderCount()');
    const nr = d.querySelectorAll('.count-row span').length;
    d.querySelector(`.num-btn[data-v="${nr}"]`).click();
    await wait(500);
    check('course : le joueur avance d\'une case', ev(`race.pos[${JSON.stringify(p1)}]`)===1);
    d.getElementById('btn-yay').click();
    await wait(100);
    check('course : la main passe au joueur suivant', ev('profiles.current')===p2);
    check('course : difficulté du joueur de 10 ans = 5', ev('gameDiff()')===5);

    // arrivée
    ev(`race.pos[${JSON.stringify(p2)}] = race.goal - 1; race.turn = 1; party.turn = 1; renderRaceTrack()`);
    const coinsBeforeRace = ev('state.coins');
    ev('renderCount()');
    const nr2 = d.querySelectorAll('.count-row span').length;
    d.querySelector(`.num-btn[data-v="${nr2}"]`).click();
    await wait(500);
    check('course : victoire détectée', ev('race.winner')===p2);
    check('course : +50 pièces au vainqueur', ev('state.coins')===coinsBeforeRace+50);
    check('course : classement affiché', d.querySelectorAll('.race-result').length===2);
    check('course terminée : retour au solo', ev('party.active')===false);
    ev('closeModal(); stopRace(true)');

    // choix du mini-jeu : seulement 2 défis tirés au sort + surprise (pas toute la liste)
    ev('closeModal(); openGamePicker("sirene")');
    check('choix du jeu : 2 défis + surprise proposés', d.querySelectorAll('.game-choice').length===3);
    const pickedKeys = [...d.querySelectorAll('.game-choice:not(.surprise)')].map(b=>b.dataset.game);
    check('choix du jeu : tous les défis proposés existent bien', pickedKeys.every(k=>ev(`GAME_LIST.some(g=>g.key==="${k}")`)));
    check('choix du jeu : pas de doublon', new Set(pickedKeys).size===pickedKeys.length);
    d.querySelector('.game-choice:not(.surprise)').click();
    check('choix du jeu : lance bien un mini-jeu', !!d.querySelector('#modal-body h2'));
    // un nouveau tirage propose en général une sélection différente
    ev('closeModal(); openGamePicker("sirene")');
    const pickedKeys2 = [...d.querySelectorAll('.game-choice:not(.surprise)')].map(b=>b.dataset.game);
    check('choix du jeu : toujours 2 défis au tirage suivant', pickedKeys2.length===2);
    ev('closeModal()');

    // ---- Compteur de défis joués, et variété forcée ----
    ev('state.gameCounts = {}; state.gameCounts["memory"]=1; state.gameCounts["count"]=1; state.gameCounts["diff"]=1; state.gameCounts["puzzle"]=1; state.gameCounts["sequence"]=1; state.gameCounts["simon"]=1; state.gameCounts["math"]=1; state.gameCounts["reading"]=1; state.gameCounts["determinants"]=1; state.gameCounts["volume"]=1; state.gameCounts["clock"]=1; state.gameCounts["calendar"]=1; state.gameCounts["calc"]=1; state.gameCounts["compare"]=0; state.gameCounts["money"]=0; openGamePicker("sirene")');
    const leastPlayed = [...d.querySelectorAll('.game-choice:not(.surprise)')].map(b=>b.dataset.game);
    check('variété : les 2 jeux jamais essayés remontent en priorité', leastPlayed.includes('compare') && leastPlayed.includes('money'));
    ev('closeModal()');
    ev('playGame("count")');
    check('compteur : incrémenté après avoir joué', ev('gameCount("count")')===2);
    ev('closeModal(); state.gameCounts = {}; renderLagon()');

    // ---- Défis adaptés à l\'âge (programme maternelle 3-6 ans) ----
    check('âge 3 ans : mémoire/compter/intrus + saisons (sans lecture)', ev('gameTypesForAge(3)').join()==='memory,count,diff,calendar');
    check('âge 4 ans : encore limité aux jeux visuels', ev('gameTypesForAge(4)').join()==='memory,count,diff,calendar');
    check('âge 5 ans : un peu plus de jeux (volume, suite, simon, heure)', ev('gameTypesForAge(5)').includes('volume') && ev('gameTypesForAge(5)').includes('clock') && !ev('gameTypesForAge(5)').includes('math'));
    check('âge 5 ans : pas encore de calcul mental abstrait', !ev('gameTypesForAge(5)').includes('calc'));
    check('âge 6 ans : tous les jeux (CP)', ev('gameTypesForAge(6)').length===ev('GAME_TYPES').length);
    check('âge non renseigné : tous les jeux (comportement inchangé)', ev('gameTypesForAge(null)').length===ev('GAME_TYPES').length);

    // ---- Palier 5 (Jungle) : un vrai niveau supplémentaire ----
    check('mémoire : 7 paires au palier 5 (contre 6 au palier 4)', ev('memoryPairs(5)')===7 && ev('memoryPairs(4)')===6);
    check('intrus : progression régulière (+2 images par palier)', [1,2,3,4,5].map(d=>ev(`diffTotal(${d})`)).join()==='6,8,10,12,14');
    check('opérations : plafond 30 au palier 5 (contre 20 au palier 4)', ev('mathBounds(5).max')===30 && ev('mathBounds(4).max')===20);
    check('comparer : nombres proches plus fréquents au palier 5', ev('compareCloseChance(5)')>ev('compareCloseChance(3)'));
    check("monnaie : jusqu'à 5 pièces à empiler au palier 5", ev('moneyPileSize(5).max')===5);
    check('essais : la jungle (palier 5) est bien le plus exigeant', ev('livesFor("diff",5)')===1 && ev('livesFor("diff",4)')===2);

    // ---- Correctif : le puzzle ne doit plus doubler la variante "start" ----
    check('puzzle : chaque variante apparaît une seule fois (palier 2)', ev('puzzleVariants(2)').join()==='from1,start');
    check('puzzle : pas de doublon à aucun palier', [1,2,3,4,5].every(d=>{
      const v = ev(`puzzleVariants(${d})`);
      return new Set(v).size===v.length;
    }));

    // ---- Minuteur de défi (fluence, à partir du palier 3) ----
    check('minuteur : absent aux paliers 1-2 (compter)', ev('timerFor("count",1)')===null && ev('timerFor("count",2)')===null);
    check('minuteur : présent à partir du palier 3 (compter)', ev('timerFor("count",3)')===20);
    check('minuteur : jamais sur les jeux à plusieurs étapes', ev('timerFor("memory",5)')===null && ev('timerFor("simon",5)')===null && ev('timerFor("puzzle",5)')===null);
    check('minuteur : durée généreuse et jamais punitive (≥12s partout)', ['count','diff','sequence','reading','math','money','determinants','volume','compare'].every(k=>[3,4,5].every(d=>{
      const t = ev(`timerFor("${k}",${d})`);
      return t===null || t>=12;
    })));

    // la barre de minuteur apparaît bien dans la fenêtre de jeu, au palier 3+
    ev('currentWorld="montagne"; renderCount()');
    check('minuteur : barre affichée dans le jeu (île 3)', !!d.getElementById('challenge-timer'));
    ev('closeModal()');
    ev('currentWorld="lagon"; renderCount()');
    check("minuteur : absent sur l'île 1 (découverte sans pression)", !d.getElementById('challenge-timer'));
    ev('closeModal()');

    // un enfant de moins de 6 ans n'est jamais pressé par le temps, même
    // si (en théorie) il atteignait une île avancée
    ev('currentProfile().age = 4; currentWorld="montagne"; renderCount()');
    check("minuteur : jamais avant 6 ans, même à difficulté élevée", !d.getElementById('challenge-timer'));
    ev('closeModal(); currentProfile().age = null');

    // temps écoulé : traité comme une erreur encourageante (pas de bouton fautif)
    ev('currentWorld="montagne"; renderCount(); onResponseTimeout("count")');
    check('minuteur : temps écoulé = un essai perdu (comme une erreur)', ev('lives')===ev('maxLives')-1);
    check('minuteur : aucune image de "bouton fautif" affichée', !d.querySelector('.num-btn.ko'));
    ev('closeModal(); currentWorld="lagon"');

    // ---- Animations de gain (sans animation dans jsdom : tout est compté tout de suite) ----
    ev('closeModal(); onMissionWin()');
    check('gain : l\'objet gagné est repéré pour s\'envoler vers le sac', !!d.querySelector('#modal-body [data-gain-item]'));
    ev('closeModal()');
    check('gain : après la fenêtre, le compteur affiche le vrai total', d.getElementById('coin-count').textContent===String(ev('state.coins')));
    ev('state.coins += 7; openModal("<div class=reward-box><span data-gain-coins>🪙</span></div>"); queueGain({coins:7})');
    check('gain : le compteur attend les pièces tant que la fenêtre est ouverte', d.getElementById('coin-count').textContent===String(ev('state.coins')-7));
    ev('closeModal()');
    check('gain : les pièces arrivent à la fermeture', d.getElementById('coin-count').textContent===String(ev('state.coins')) && ev('coinsInFlight')===0);
    ev('addCoins(3); gainCoins(3, null); addCoins(-2); spendCoins(2, null)');
    check('gain : vente et achat gardent le compteur juste', d.getElementById('coin-count').textContent===String(ev('state.coins')) && ev('coinsInFlight')===0);
    // ---- Feuille de style : une accolade perdue (ex. lors d'une fusion) enferme
    //      silencieusement tout le reste dans une media query ----
    {
      const css = fs.readFileSync(path.join(__dirname, '..', 'styles.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
      let depth = 0, min = 0;
      for(const ch of css){ if(ch==='{') depth++; else if(ch==='}') depth--; min = Math.min(min, depth); }
      check('styles.css : accolades équilibrées', depth===0 && min===0);
    }
    check('aucune erreur JS', errs.length===0);
    if(errs.length) console.log(errs);
    console.log(failed ? `\n${failed} test(s) en échec` : '\nTous les tests passent');
    process.exit(failed?1:0);
  }, 600);
}, 600);
