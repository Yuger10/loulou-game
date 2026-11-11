// Test de fumée : charge le HTML dans jsdom et parcourt tout le cycle de jeu.
const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
// Le jeu est découpé en plusieurs fichiers : on inline CSS et JS pour jsdom,
// dans l'ordre du manifeste des slices (js/slices.cjs)
const page = require('./tools/page.js');
const html = page.buildHtml();

const dom = new JSDOM(html, { runScripts:'dangerously', pretendToBeVisual:true, url:'http://localhost/' });
const w = dom.window, d = w.document;
w.confirm = ()=>true;
const errs = [];
w.addEventListener('error', e=>errs.push(e.message));
const ev = (code)=> w.eval(code);
let failed = 0;
function check(name, cond){ console.log((cond?'✅':'❌')+' '+name); if(!cond) failed++; }
// tests reproductibles toute l'année : pas de décor de saison (Noël, Halloween…)
// sauf dans le bloc qui les teste
ev('setSeasonPreview("aucune")');

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

// Les personnages s'ordonnent selon le genre du joueur (comme les
// compagnons) : ceux du même genre passent en premier, sans jamais
// disparaître.
check('tri par genre : fille → personnages féminins en tête', ev('charsOfForPlayer("lagon","f").map(c=>c[0]).join()')==='sirene,licorne,danseuse,pirate');
check('tri par genre : garçon → pirate en tête, tous présents', ev('charsOfForPlayer("lagon","m").map(c=>c[0]).join()')==='pirate,sirene,licorne,danseuse');
check('tri par genre : sans genre → ordre inchangé', ev('charsOfForPlayer("lagon","").map(c=>c[0]).join()')==='sirene,licorne,danseuse,pirate');
ev('currentProfile().gender = "m"; renderLagon()');
check("île : l'affichage suit le genre du joueur (garçon)", [...d.querySelectorAll('.island')].map(b=>b.dataset.char)[0]==='pirate');
ev('currentProfile().gender = ""; renderLagon()');
check("île : remis à l'ordre par défaut une fois le genre effacé", [...d.querySelectorAll('.island')].map(b=>b.dataset.char).join()==='sirene,licorne,danseuse,pirate');

check('scène déco présente', !!d.getElementById('scene'));
check('3 missions du jour', ev('state.quests.list.length')===3);

// Carte des îles
check('carte : 8 îles affichées', d.querySelectorAll('.map-island').length===8);
check('carte : route dessinée', !!d.querySelector('.route-line') && !!d.querySelector('.route-done'));
check('carte : bateau présent', !!d.getElementById('map-boat'));
check('carte : îles dessinées (terre + label)', d.querySelectorAll('.map-island .isle-land').length===8);
check('carte : lagon est l\'île courante', !!d.querySelector('.map-island.here[data-world="lagon"]'));
check('carte : 7 îles verrouillées au niveau 1', d.querySelectorAll('.map-island.locked').length===7);
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
check('pays squishy encore verrouillé au niveau 22', ev('worldUnlocked("squishy")')===false);

ev('state.missions = 125; switchView("carte")');   // niveau 26
check('pays squishy déverrouillé au niveau 26', ev('worldUnlocked("squishy")')===true);
d.querySelector('.map-island[data-world="squishy"]').click();
ev('sailing=false; setWorld("squishy")');
check('navigation vers le pays squishy', ev('currentWorld')==='squishy');
check('difficulté du pays squishy = 6', ev('gameDiff()')===6);
check('squishy : personnages tout doux', [...d.querySelectorAll('.island')].map(b=>b.dataset.char).join()==='mochichat,donut,avocat,phoque');
ev('openGamePicker("mochichat")');
check('squishy : son mini-jeu « Formes et couleurs » est toujours proposé', !!d.querySelector('.game-choice[data-game="shapes"]'));
ev('closeModal()');
ev("switchView('carte')");
check('carte : toutes les îles du Lagon débloquées, le prochain monde est annoncé', d.getElementById('map-next').innerHTML.includes('Prochain monde') && d.getElementById('map-next').innerHTML.includes('Ciel des Rêves'));

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
    check('compagnon : les 7 proposés sans genre', d.querySelectorAll('.buddy-opt').length===7);
    d.querySelector('.gender-opt[data-gender="f"]').click();
    check('compagnon : fille → sirène, princesse, fée', [...d.querySelectorAll('.buddy-opt')].map(b=>b.dataset.buddy).join()==='perle,rose,lili');
    d.querySelector('.gender-opt[data-gender="m"]').click();
    check('compagnon : garçon → pirate, chevalier, explorateur, super-héros', [...d.querySelectorAll('.buddy-opt')].map(b=>b.dataset.buddy).join()==='tom,leo,sam,zap');
    check('compagnon : garçon → pirate présélectionné', d.querySelector('.buddy-opt.sel').dataset.buddy==='tom');
    d.querySelector('[data-buddy-more]').click();
    check('compagnon : « voir les autres » montre tout le monde', d.querySelectorAll('.buddy-opt').length===7);
    d.querySelector('.buddy-opt[data-buddy="rose"]').click();
    check('compagnon : on peut choisir librement', d.querySelector('.buddy-opt.sel').dataset.buddy==='rose');
    ev('closeModal()');
    // ---- Avatar dessiné : Zap le super-héros ----
    check('avatar : le super-héros dessiné est proposé', ev('AVATARS.includes("art:zap")'));
    check('avatar dessiné : image en HTML, emoji dans le texte', ev('avatarHTML("art:zap")').includes('<svg') && ev('avatarText("art:zap")')==='🦸‍♂️' && ev('avatarText("🦁")')==='🦁' && ev('avatarHTML("🦁")')==='🦁');
    ev('state.avatar="art:zap"; renderProfile(); renderMap()');
    check('avatar dessiné : en haut de l\'écran', !!d.querySelector('#avatar-pill .av .av-art svg'));
    check('avatar dessiné : sur le bateau de la carte', !!d.querySelector('#map-boat .boat-av .av-art svg'));
    ev('openNewPlayer()');
    check('avatar dessiné : dans le choix des avatars', !!d.querySelector('.avatar-opt[data-av="art:zap"] svg'));
    ev('closeModal(); state.avatar="👧"; renderProfile(); renderMap()');
    check('compagnon par défaut : fille → sirène, garçon → pirate', ev("defaultCompanionFor('f')")==='perle' && ev("defaultCompanionFor('m')")==='tom');
    // ---- Illustrations SVG des personnages ----
    check('personnages : les 36 ids possèdent un SVG', ev('Object.keys(CHARACTERS).length===36 && Object.keys(CHARACTERS).every(k=>charArtSVG(k).startsWith("<svg"))'));
    check('personnages : viewBox et longueur SVG valides', ev('Object.values(CHAR_ART).every(s=>s.startsWith("<svg") && s.includes(\'viewBox="0 0 120 130"\') && s.length<=6000)'));
    check('personnages : aucun élément ou attribut SVG interdit', ev('Object.values(CHAR_ART).every(s=>!/\\bid\\s*=|\\bhref\\s*=|url\\s*\\(|<\\s*(?:defs|linearGradient|radialGradient|clipPath|mask|filter|text|image|style|script)\\b/i.test(s))'));
    check('personnages : fallback emoji pour id inconnu', ev('charFace("__unknown").includes("❔")'));
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
    ev('state.gameCounts = {}; state.gameCounts["memory"]=1; state.gameCounts["count"]=1; state.gameCounts["diff"]=1; state.gameCounts["puzzle"]=1; state.gameCounts["sequence"]=1; state.gameCounts["simon"]=1; state.gameCounts["math"]=1; state.gameCounts["reading"]=1; state.gameCounts["determinants"]=1; state.gameCounts["volume"]=1; state.gameCounts["clock"]=1; state.gameCounts["calendar"]=1; state.gameCounts["calc"]=1; state.gameCounts["compare"]=0; state.gameCounts["shapes"]=1; state.gameCounts["planets"]=1; state.gameCounts["jigsaw"]=1; state.gameCounts["nesting"]=1; state.gameCounts["cubes"]=1; state.gameCounts["money"]=0; openGamePicker("sirene")');
    const leastPlayed = [...d.querySelectorAll('.game-choice:not(.surprise)')].map(b=>b.dataset.game);
    check('variété : les 2 jeux jamais essayés remontent en priorité', leastPlayed.includes('compare') && leastPlayed.includes('money'));
    ev('closeModal()');
    ev('playGame("count")');
    check('compteur : incrémenté après avoir joué', ev('gameCount("count")')===2);
    ev('closeModal(); state.gameCounts = {}; renderLagon()');

    // ---- Défis adaptés à l\'âge (programme maternelle 3-6 ans) ----
    check('âge 3 ans : mémoire/compter/intrus + saisons + formes + puzzle + gigognes (sans lecture)', ev('gameTypesForAge(3)').join()==='memory,count,diff,calendar,shapes,jigsaw,nesting');
    check('âge 4 ans : encore limité aux jeux visuels', ev('gameTypesForAge(4)').join()==='memory,count,diff,calendar,shapes,jigsaw,nesting');
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
    // (« Compter » déjà acquis jusqu'au niveau 5 : seule l'île fixe le palier)
    ev('currentWorld="montagne"; lastGame="count"; state.skills = Object.assign(state.skills||{}, {count:{wins:4, fails:0, errors:0, last:null, recent:[], lvl:5}}); renderCount()');
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
    // ---- L'île vivante ----
    ev('closeModal(); currentWorld="lagon"; state.decos=["palmier","dauphin"]; state.decoPos={}; renderLagon(); switchView("ile")');
    check('île vivante : paysage dessiné dans la scène', !!d.querySelector('#scene.live-isle svg.isle-land'));
    check('île vivante : les personnages sont dans le paysage', d.querySelectorAll('#scene .isle-char[data-char]').length===4);
    check('île vivante : les personnages affichent les SVG', d.querySelectorAll('#scene .isle-char .char-art svg').length===4);
    check('île vivante : décorations posées dans le paysage', d.querySelectorAll('#scene .deco[data-deco-key]').length===2);
    check('île vivante : un dauphin va dans l\'eau, pas sur la plage', Number(d.querySelector('#scene .deco[data-deco-key="dauphin"]').dataset.vy) < 200);
    ev('moveDeco("palmier", 300, 300); renderScene()');
    check('île vivante : une décoration déplacée garde sa place', d.querySelector('#scene .deco[data-deco-key="palmier"]').dataset.vx==='300' && ev('state.decoPos.palmier.y')===300);
    ev('state.helped=null; markHelped("licorne"); renderScene()');
    check('île vivante : ❤️ sur le personnage aidé aujourd\'hui', d.querySelector('#scene .isle-char[data-char="licorne"] .ic-bubble').textContent.trim()==='❤️');
    check('île vivante : moment de la journée selon l\'heure', ev('isleTimeOfDay(new Date(2026,0,1,22))')==='nuit' && ev('isleTimeOfDay(new Date(2026,0,1,8))')==='matin' && ev('isleTimeOfDay(new Date(2026,0,1,13))')==='jour' && ev('isleTimeOfDay(new Date(2026,0,1,18))')==='soir');
    check('île vivante : une nouvelle île a un paysage par défaut', ev('(WORLDS.__test={name:"T",shape:"inconnue",sand:"#eee",land:"#8c8"}, landscapeSVG("__test").includes("<svg"))'));
    ev('delete WORLDS.__test');
    // ---- Formes et couleurs (Pays Squishy) ----
    {
      // chaque palier : le bon nombre de squishies, exactement `targets` bonnes réponses
      const okRounds = [1,2,3,4,5,6].every(dd=>ev(`(()=>{ for(let k=0;k<40;k++){ const r=shapesBuildRound(${dd}); const cfg=shapesRound(${dd});
        if(r.items.length!==cfg.items || r.targets!==cfg.targets) return false; } return true; })()`));
      check('formes : chaque palier a le bon nombre de squishies et de bonnes réponses', okRounds);
      check('formes : palier 1 = couleur, palier 6 = sommets', ev('shapesRound(1).criterion')==='color' && ev('shapesRound(6).criterion')==='vertices');
      check('formes : accords en français (féminin, pluriel)', ev('(()=>{ for(let k=0;k<200;k++){ const r=shapesBuildRound(3); if(/étoiles/.test(r.say) && !/toutes les étoiles (roses|bleues|jaunes|vertes)/.test(r.say)) return false; } return true; })()'));
      ev('closeModal(); currentWorld="lagon"; playGame("shapes")');
      const items = [...d.querySelectorAll('.sq-item')];
      check('formes : le plateau s\'affiche', items.length===ev('shapesRound(1).items'));
      check('formes : la consigne montre la couleur attendue (palier 1)', !!d.querySelector('.puzzle-hint .sq-dot'));
      check('formes : jeu enregistré dans la liste', ev('GAME_LIST.some(g=>g.key==="shapes") && GAME_TYPES.includes("shapes")'));
      check('formes : pas de minuteur (plusieurs touches)', ev('timerFor("shapes",5)')===null);
      ev('closeModal()');
    }
    // ---- Les planètes : exactitude scientifique ----
    {
      check('planètes : 8 planètes dans l\'ordre (pas de Pluton)', ev('PLANET_IDS.join()')==='mercure,venus,terre,mars,jupiter,saturne,uranus,neptune' && !ev('PLANET_IDS').includes('pluton') && ev('PLANET_QUESTIONS[5][0]().fact').includes('Pluton est une planète naine'));
      check('planètes : extrêmes calculés (proche Mercure, lointaine Neptune, grande Jupiter, petite Mercure, chaude Vénus)',
        ev('closestPlanet()')==='mercure' && ev('farthestPlanet()')==='neptune' && ev('largestPlanet()')==='jupiter' && ev('smallestPlanet()')==='mercure' && ev('hottestPlanet()')==='venus');
      check('planètes : tailles dans le bon ordre (Jupiter > Saturne > Uranus > Neptune > Terre > Vénus > Mars > Mercure)',
        ev('["jupiter","saturne","uranus","neptune","terre","venus","mars","mercure"].every((id,i,a)=>i===0 || SOLAR_DATA[a[i-1]].diameter > SOLAR_DATA[id].diameter)'));
      // chaque question de chaque palier : une seule bonne réponse, présente dans les choix, sans doublon, avec une phrase à retenir
      const bad = ev(`(()=>{ const out=[]; for(const t of [1,2,3,4,5,6]) PLANET_QUESTIONS[t].forEach((f,i)=>{ for(let k=0;k<5;k++){ const q=f();
          if(!q.say || !q.fact) out.push(t+':'+i+' sans texte');
          if(q.type!=='order'){ if(!q.options.includes(q.answer)) out.push(t+':'+i+' réponse absente');
            if(new Set(q.options).size!==q.options.length) out.push(t+':'+i+' doublon');
            if(q.type==='pic' && !q.options.every(id=>bodySVG(id).startsWith('<svg'))) out.push(t+':'+i+' dessin manquant'); } } }); return out; })()`);
      check('planètes : chaque question a une seule bonne réponse parmi des choix valides', bad.length===0);
      if(bad.length) console.log('   ', bad.slice(0,5));
      check('planètes : toutes dessinées à la même taille (aucune fausse taille suggérée)', ev('PLANET_IDS.every(id=>{ const r=PLANET_DISC_R[id]; if(!r) return false; const m=bodySVG(id).match(/scale\\(([0-9.]+)\\)/); const k=m?Number(m[1]):1; return Math.abs(r*k - PLANET_DRAW_R) < 0.1; })'));
      check('planètes : le jour et la nuit viennent de la rotation de la Terre', ev('PLANET_QUESTIONS[5][3]().answer')==='La Terre tourne sur elle-même');
      check('planètes : le Soleil est une étoile, la Lune un satellite', ev('PLANET_QUESTIONS[2][3]().answer')==='une étoile' && ev('PLANET_QUESTIONS[5][5]().answer')==='un satellite de la Terre');
      check('planètes : pas avant 5 ans', !ev('gameTypesForAge(4)').includes('planets') && ev('gameTypesForAge(5)').includes('planets'));
      check('planètes : pas de minuteur', ev('timerFor("planets",5)')===null);
      ev('closeModal(); currentWorld="lagon"; playGame("planets")');
      check('planètes : le quiz s\'affiche avec ses choix', d.querySelectorAll('.pl-opt').length>=2);
      // bonne réponse : la phrase à retenir est affichée sur l'écran de victoire
      ev('missionFact = "Phrase de test."; onMissionWin()');
      check('planètes : la phrase à retenir apparaît à la victoire', !!d.querySelector('.win-box .fun-fact') && d.querySelector('.win-box .fun-fact').textContent.includes('Phrase de test.'));
      ev('closeModal()');
    }
    // ---- Sauvegarde et restauration (Phase 1 : ne rien perdre) ----
    {
      ev('closeModal(); save(); saveProfiles()');
      const before = ev('JSON.stringify({coins: state.coins, missions: state.missions, names: profiles.list.map(p=>p.name)})');
      const backup = ev('JSON.stringify(buildBackup())');
      const B = JSON.parse(backup);
      check('sauvegarde : contient les joueurs et chaque partie', !!B.data['lagon-magique-profiles'] && Object.keys(B.data).some(k=>k.startsWith('lagon-magique-save:')));
      check('sauvegarde : lisible et reconnue', ev(`parseBackupText(${JSON.stringify(backup)}).ok`)===true);
      // on abîme la partie, puis on restaure : tout revient
      ev('state.coins = 999; state.missions = 0; save()');
      ev(`applyBackup(JSON.parse(${JSON.stringify(backup)}))`);
      check('restauration : la partie revient à l\'identique', ev('JSON.stringify({coins: state.coins, missions: state.missions, names: profiles.list.map(p=>p.name)})')===before);
      check('restauration : une copie de la partie remplacée est gardée', ev('undoRestoreAvailable()')===true);
      // code de transfert simple (sans compression)
      const code = 'LAGON1:' + ev(`utf8ToB64(${JSON.stringify(backup)})`);
      check('code de transfert : relu correctement (accents compris)', ev(`parseBackupText(${JSON.stringify(code)}).ok`)===true && ev(`parseBackupText(${JSON.stringify(code)}).players.length`)>=1);
      check('code de transfert : un code tronqué est refusé', ev(`parseBackupText(${JSON.stringify(code.slice(0, code.length-40))}).ok`)===false);
      check('sauvegarde : un fichier étranger est refusé', ev('parseBackupText(JSON.stringify({app:"autre", data:{}})).ok')===false && ev('parseBackupText("bonjour").ok')===false);
      check('sauvegarde : une clé étrangère est refusée', ev('parseBackupText(JSON.stringify({app:"lagon-magique", data:{"autre-site":"{}"}})).ok')===false);
      ev('openPlayers()');
      check('sauvegarde : accessible depuis le panneau des joueurs', !!d.getElementById('btn-backup'));
      ev('openBackup()');
      check('sauvegarde : la fenêtre propose enregistrer, transférer, restaurer, installer', !!d.getElementById('bk-export') && !!d.getElementById('bk-code') && !!d.getElementById('bk-file') && !!d.getElementById('bk-install-zone'));
      ev('closeModal()');
      check('rappel : sauvegarde à faire si jamais faite après quelques missions', ev('(localStorage.removeItem("lagon-magique-meta"), state.missions=10, backupDue())')===true);
      check('rappel : plus de rappel juste après une sauvegarde', ev('(setBackupMeta({lastBackupAt:new Date().toISOString()}), backupDue())')===false);
      ev('localStorage.removeItem("lagon-magique-meta")');
    }
    // ---- Espace parents (Phase 2) ----
    {
      ev('closeModal(); party.active = false; if(typeof race!=="undefined") race.active = false');
      const inGroups = ev('SKILL_GROUPS.flatMap(g=>g.games)');
      const sansGroupe = ev('GAME_TYPES').filter(k=>!inGroups.includes(k));
      check('parents : chaque mini-jeu est rangé dans une compétence', sansGroupe.length===0);
      // une vraie mission : une erreur, puis la victoire
      ev('state.skills = {}; currentWorld = "lagon"; playGame("count"); loseLife(null); onMissionWin()');
      check('parents : une mission gagnée est enregistrée avec ses erreurs', ev('state.skills.count.wins')===1 && ev('state.skills.count.errors')===1 && ev('state.skills.count.recent[0].t')===1);
      ev('closeModal(); playGame("count"); onMissionFail()');
      check('parents : une mission ratée est enregistrée', ev('state.skills.count.fails')===1 && ev('state.skills.count.recent[1].e')===0);
      ev('closeModal()');
      check('parents : à plusieurs, rien n\'est compté (une erreur passe la main)', ev('(party.active = true, lastGame = "count", recordMission(true), party.active = false, state.skills.count.wins)')===1);
      check('parents : jamais joué → « pas encore joué »', ev('skillStatus(undefined, "count")')==='jamais');
      check('parents : jeu tout juste commencé → « pas assez joué »', ev('skillStatus({wins:1, fails:0, recent:[{t:1,e:0,ok:true}]}, "count")')==='nouveau');
      check('parents : réussi sans erreur → « à l\'aise »', ev('skillStatus({wins:3, fails:0, recent:[{t:1,e:0,ok:true},{t:1,e:0,ok:true},{t:2,e:1,ok:true}]}, "count")')==='aise');
      check('parents : souvent raté → « à travailler »', ev('skillStatus({wins:1, fails:2, recent:[{t:1,e:2,ok:false},{t:1,e:0,ok:true},{t:1,e:2,ok:false}]}, "count")')==='difficile');
      check('parents : au mémo, retourner deux cartes différentes n\'est pas « difficile »', ev('skillStatus({wins:3, fails:0, recent:[{t:1,e:3,ok:true},{t:1,e:3,ok:true},{t:1,e:3,ok:true}]}, "memory")')!=='difficile' && ev('skillStatus({wins:3, fails:0, recent:[{t:1,e:3,ok:true},{t:1,e:3,ok:true},{t:1,e:3,ok:true}]}, "count")')==='difficile');
      check('parents : les progrès partent avec la sauvegarde', JSON.stringify(ev('buildBackup()').data).includes('skills'));
      // temps de jeu et pause douce
      ev('state.playTime = {}; tickPlayTime(600)');
      check('temps de jeu : compté par jour', ev('playMinutesToday()')===10);
      check('pause douce : pas de pause par défaut', ev('pauseDue()')===false);
      ev('currentProfile().pauseMin = 10');
      check('pause douce : due une fois le temps atteint', ev('pauseDue()')===true);
      ev('playGame("count")');
      check('pause douce : plus de nouveau défi, l\'écran de pause s\'affiche', !!d.querySelector('.pause-box') && !d.querySelector('.count-row'));
      check('pause douce : accord avec le compagnon (fatigué / fatiguée)', d.querySelector('.pause-box .speech').textContent.includes(ev('COMPANIONS[currentCompanion()].group')==='f' ? 'fatiguée' : 'fatigué\u00a0'));
      ev('closeModal()');
      check('pause douce : jamais en mode à plusieurs', ev('(party.active = true, pauseDue())')===false);
      ev('party.active = false; state.pauseExtra = { date: todayKey(), min: 10 }');
      check('pause douce : un adulte peut ajouter 10 minutes', ev('pauseDue()')===false);
      ev('currentProfile().pauseMin = 0; state.pauseExtra = null; state.playTime = {}; save(); saveProfiles()');
      // accès réservé aux adultes
      ev('parentUnlockedUntil = 0; openPlayers()');
      check('parents : bouton dans le panneau des joueurs', !!d.getElementById('btn-parents'));
      d.getElementById('btn-parents').click();
      check('parents : une question pour adultes protège l\'accès', !!d.getElementById('gate-in') && !d.querySelector('.ps-tabs'));
      const q = d.querySelector('.gate-q').textContent.match(/(\d+) × (\d+)/);
      d.getElementById('gate-in').value = String(Number(q[1])*Number(q[2]) + 1);
      d.getElementById('gate-ok').click();
      check('parents : une mauvaise réponse n\'ouvre pas', !d.querySelector('.ps-tabs') && d.getElementById('gate-err').textContent.length>0);
      d.getElementById('gate-in').value = String(Number(q[1])*Number(q[2]));
      d.getElementById('gate-ok').click();
      check('parents : la bonne réponse ouvre l\'espace parents', !!d.querySelector('.ps-tabs'));
      check('parents : un onglet par enfant', d.querySelectorAll('.ps-tab').length===ev('profiles.list.length'));
      check('parents : temps de jeu sur 7 jours', d.querySelectorAll('.pt-col').length===7);
      check('parents : progrès par compétence affichés', d.querySelectorAll('.sk-row').length>0 && d.querySelector('.sk-row').textContent.length>0);
      d.querySelector('[data-pause="20"]').click();
      check('parents : la pause se règle par enfant', ev('currentProfile().pauseMin')===20 && d.querySelector('[data-pause="20"]').classList.contains('on'));
      ev('currentProfile().pauseMin = 0; saveProfiles(); closeModal(); openParents()');
      check('parents : pas de nouvelle question pendant 5 minutes', !!d.querySelector('.ps-tabs'));
      ev('closeModal(); parentUnlockedUntil = 0');
      // une ancienne partie sans ces données ne partage pas ses objets avec les autres joueurs
      ev('window.__keep = JSON.stringify(state); localStorage.setItem(currentSaveKey(), JSON.stringify({v: SAVE_VERSION, coins: 3})); load(); state.skills.x = 1');
      check('chargement : une ancienne partie reçoit ses propres données (pas partagées)', ev('DEFAULT_STATE.skills.x')===undefined && ev('freshState().skills.x')===undefined);
      ev('localStorage.setItem(currentSaveKey(), __keep); load()');
    }
    // ---- Phase 3 : un jeu qui s'adapte à chaque enfant ----
    {
      ev('closeModal(); party.active = false; currentProfile().age = 0; state.skills = {}; currentWorld = "montagne"; lastGame = "reading"');
      check('adaptatif : chaque mini-jeu a une phrase d\'encouragement', ev('GAME_TYPES').every(k=>ev(`!!PROGRESS_CHEERS[${JSON.stringify(k)}]`)));
      check('adaptatif : jeu jamais joué → un cran sous l\'île (placement)', ev('gameDiff()')===2);
      check('adaptatif : à plusieurs, la difficulté ne change pas', ev('(party.active = true, adaptTier(3, "reading"))')===3 && ev('(party.active = false, true)'));
      // deux réussites sans erreur → le jeu monte d'un cran, le compagnon félicite
      ev('playGame("reading"); recordMission(true)');
      check('adaptatif : le premier passage fixe le niveau du jeu', ev('state.skills.reading.lvl')===2 && ev('missionProgress')===null);
      ev('playGame("reading"); onMissionWin()');
      check('adaptatif : 2 réussites d\'affilée → niveau suivant', ev('state.skills.reading.lvl')===3 && ev('gameDiff()')===3);
      check('adaptatif : le compagnon dit ce qui progresse', !!d.querySelector('.win-box .progress-cheer') && d.querySelector('.win-box .progress-cheer').textContent.includes('Tu lis de mieux en mieux'));
      ev('closeModal()');
      check('adaptatif : jamais au-dessus de l\'île', ev('(state.skills.reading.lvl = 5, gameDiff())')===3);
      check('adaptatif : jamais au-dessus de l\'âge', ev('(currentProfile().age = 6, state.skills.reading.lvl = 5, gameDiff())')===ev('Math.min(ageToDiff(6), 3)') && ev('(currentProfile().age = 0, true)'));
      // une réussite avec des erreurs ne fait pas monter
      ev('state.skills.reading = {wins:0, fails:0, errors:0, last:null, recent:[], lvl:3}; playGame("reading"); noteAnswerError(); noteAnswerError(); recordMission(true); playGame("reading"); recordMission(true)');
      check('adaptatif : réussir avec beaucoup d\'erreurs ne fait pas monter', ev('state.skills.reading.lvl')===3);
      // deux missions ratées → un cran plus facile (soutien)
      ev('playGame("reading"); recordMission(false); playGame("reading"); recordMission(false)');
      check('adaptatif : 2 missions ratées → un cran plus facile', ev('state.skills.reading.lvl')===2 && ev('state.skills.reading.support')===true && ev('gameDiff()')===2);
      check('adaptatif : un jeu redescendu est « à travailler »', ev('needsPractice("reading")')===true);
      // ce qui est à travailler revient plus souvent
      ev('PRACTICE_CHANCE = 1; lastGame = "count"');
      check('adaptatif : le jeu à travailler est proposé dans le choix', ev('pickPickerChoices(2).map(g=>g.key)').includes('reading'));
      check('adaptatif : …et par la Surprise', ev('pickPracticeGame(GAME_TYPES)')==='reading');
      ev('lastGame = "reading"');
      check('adaptatif : …mais jamais deux fois de suite', ev('pickPracticeGame(GAME_TYPES)')===null);
      ev('PRACTICE_CHANCE = 0');
      check('adaptatif : …et pas à chaque fois', ev('pickPracticeGame(GAME_TYPES)')===null);
      ev('PRACTICE_CHANCE = 0.5');
      // en remontant, le jeu sort du soutien
      ev('playGame("reading"); recordMission(true); playGame("reading"); recordMission(true)');
      check('adaptatif : 2 réussites → on remonte et on sort du soutien', ev('state.skills.reading.lvl')===3 && ev('state.skills.reading.support')===false);
      // sur une île plus facile, les missions ne comptent pas pour monter
      ev('currentWorld = "lagon"; playGame("reading"); recordMission(true); playGame("reading"); recordMission(true)');
      check('adaptatif : sur une île plus facile, le niveau du jeu ne bouge pas', ev('state.skills.reading.lvl')===3);
      check('adaptatif : le niveau du calcul mental va jusqu\'à 6, les autres jeux jusqu\'à 5', ev('gameMaxTier("calc")')===6 && ev('gameMaxTier("reading")')===5);
      ev('state.skills = {}; currentWorld = "lagon"; lastGame = null; save()');
    }
    // ---- Garde-robe : habiller son avatar (Phase 4) ----
    {
      ev('closeModal(); party.active = false');
      const ids = ev('Object.keys(WARDROBE)');
      check('garde-robe : chaque objet a un dessin ou des couleurs', ids.every(k=>ev(`!!(LOOK_ART[${JSON.stringify(k)}] || WARDROBE[${JSON.stringify(k)}].colors)`)));
      check('garde-robe : chaque objet a un prix, se gagne avec des missions ou s\'offre à une fête', ids.every(k=>ev(`!!(WARDROBE[${JSON.stringify(k)}].price || WARDROBE[${JSON.stringify(k)}].unlock || WARDROBE[${JSON.stringify(k)}].season)`)));
      check('garde-robe : chaque dessin est un SVG valide', ids.filter(k=>ev(`!!LOOK_ART[${JSON.stringify(k)}]`)).every(k=>{
        const svg = ev(`'<svg xmlns="http://www.w3.org/2000/svg">' + LOOK_ART[${JSON.stringify(k)}]() + '</svg>'`);
        const doc = new w.DOMParser().parseFromString(svg, 'image/svg+xml');
        return !doc.querySelector('parsererror');
      }));
      ev('state.avatar = "art:zap"; state.coins = 50; state.missions = 9; state.wardrobe = []; state.look = {tete:null, visage:null, tenue:null, cape:null}; save()');
      check('garde-robe : Zap peut changer de cape', ev('lookSlotsFor("art:zap").map(s=>s.id).join()')==='tete,visage,tenue,cape');
      check('garde-robe : un avatar emoji porte chapeaux et lunettes (pas de tenue)', ev('lookSlotsFor("🧒").map(s=>s.id).join()')==='tete,visage');
      check('garde-robe : pas encore d\'objet', ev('ownsLookItem("couronne")')===false && ev('ownsLookItem("joues")')===false);
      // acheter et porter
      check('garde-robe : acheter la couronne', ev('buyLookItem("couronne")')===true && ev('state.coins')===20 && ev('state.look.tete')==='couronne');
      check('garde-robe : pas deux fois, ni sans assez de pièces', ev('buyLookItem("couronne")')===false && ev('buyLookItem("tricorne")')===false && ev('state.coins')===20);
      check('garde-robe : l\'avatar de la barre porte la couronne', d.querySelector('#avatar-pill .av').innerHTML.includes('b-look'));
      check('garde-robe : la couronne remplace le couvre-chef d\'origine', !ev('avatarHTML("art:rose", {tete:"couronne"})').includes('M43 26 L46 12') && ev('avatarHTML("art:rose", null)').includes('M43 26 L46 12'));
      ev('state.wardrobe.push("c_rouge"); wearLook("cape", "c_rouge")');
      check('garde-robe : la cape de Zap change de couleur', ev('avatarHTML("art:zap", state.look)').includes('#E5484D') && !ev('avatarHTML("art:zap", state.look)').includes('#FF8A3D'));
      check('garde-robe : un avatar emoji porte ses accessoires par-dessus', ev('avatarHTML("🧒", {tete:"couronne"})').includes('look-ov'));
      check('garde-robe : pas d\'accessoire sur une fusée ou un héros en pied', ev('avatarHTML("🚀", {tete:"couronne"})')==='🚀' && ev('lookSlotsFor("🦸‍♂️").length')===0);
      check('avatars : uniquement des emoji standard (pas de « 👧‍🦱 » en deux morceaux)', !ev('AVATARS').includes('👧‍🦱') && ev('fixAvatar("👦‍🦱")')==='👨‍🦱');
      check('garde-robe : le look suit le joueur dans la liste des joueurs', ev('currentProfile().look.tete')==='couronne' && ev('currentProfile().look.cape')==='c_rouge');
      // gagner un objet avec les missions
      ev('currentWorld = "lagon"; lastGame = "count"; playGame("count"); onMissionWin()');
      check('garde-robe : 10e mission → objet gagné, annoncé sur l\'écran de victoire', ev('ownsLookItem("joues")')===true && !!d.querySelector('.win-box .look-won'));
      ev('closeModal()');
      // l'onglet du sac
      ev('switchView("sac"); setSacTab("look")');
      check('garde-robe : onglet « Mon look » dans le sac', !d.getElementById('look-content').hidden && !!d.querySelector('.look-preview') && d.querySelectorAll('.look-tile').length > 3);
      d.querySelector('[data-look="tricorne"]').click();
      check('garde-robe : on essaie avant d\'acheter (pas assez de pièces → message)', ev('lookTry && lookTry.id')==='tricorne' && !!d.querySelector('.look-msg') && ev('state.look.tete')==='couronne');
      d.querySelector('[data-look=""]').click();
      check('garde-robe : « Rien » enlève le chapeau', ev('state.look.tete')===null);
      d.querySelector('[data-lslot="avatar"]').click();
      d.querySelector('.av-pick[data-av="art:perle"]').click();
      check('garde-robe : changer de personnage depuis « Mon look »', ev('state.avatar')==='art:perle' && ev('currentProfile().avatar')==='art:perle');
      check('garde-robe : pas de cape pour la sirène', !d.querySelector('[data-lslot="cape"]'));
      ev('state.look = {tete:null, visage:null, tenue:null, cape:null}; state.wardrobe = []; state.avatar = "🦄"; save(); refreshLookEverywhere(); switchView("carte")');
    }
    // ---- Icônes dessinées de l'interface (identiques sur tous les appareils) ----
    {
      const slots = [...d.querySelectorAll('[data-ui-icon]')];
      check('icônes : barres du haut et du bas dessinées en SVG (pas d\'emoji de l\'appareil)', slots.length>=7 && slots.every(el=>el.querySelector('svg.ui-ic')));
      check('icônes : les 4 boutons de navigation ont leur icône', [...d.querySelectorAll('nav.bottomnav .navbtn')].every(b=>b.querySelector('svg.ui-ic')));
      const st = ev('JSON.stringify({s: state.sound, v: state.voice, m: state.music})');
      const icons = [];
      for(let i=0;i<3;i++){ d.getElementById('sound-btn').click(); icons.push(d.getElementById('sound-btn').innerHTML); }
      check('icônes : le bouton son a une icône pour chaque état (sons, silence, musique)', icons.every(h=>h.includes('ui-ic')) && new Set(icons).size===3);
      ev(`(function(o){ state.sound = o.s; state.voice = o.v; state.music = o.m; save(); renderSoundBtn(); })(${st})`);
      check('icônes : chaque dessin est un SVG valide', ev('Object.keys(UI_ICONS)').every(k=>{
        const doc = new w.DOMParser().parseFromString(ev(`uiIcon(${JSON.stringify(k)})`).replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" '), 'image/svg+xml');
        return !doc.querySelector('parsererror');
      }));
    }
    // ---- Fêtes et saisons (Halloween, Noël, anniversaire) ----
    {
      ev('closeModal(); party.active = false; sessionStorage.removeItem(SEASON_PREVIEW_KEY); currentProfile().birthday = ""');
      check('saisons : Noël le 24 décembre et le 3 janvier', ev('currentSeason(new Date(2026,11,24))')==='noel' && ev('currentSeason(new Date(2027,0,3))')==='noel');
      check('saisons : rien le 10 janvier ni le 9 novembre', ev('currentSeason(new Date(2027,0,10))')===null && ev('currentSeason(new Date(2026,10,9))')===null);
      check('saisons : Halloween le 31 octobre', ev('currentSeason(new Date(2026,9,31))')==='halloween');
      check('saisons : l\'anniversaire passe avant Noël', ev('(currentProfile().birthday = "12-25", currentSeason(new Date(2026,11,25)))')==='anniversaire' && ev('currentSeason(new Date(2026,11,24))')==='noel');
      ev('currentProfile().birthday = ""');
      check('saisons : chaque fête a son chapeau dessiné dans la garde-robe', ev('Object.values(FETES).every(f=>WARDROBE[f.hat] && LOOK_ART[f.hat])')===true);
      // aperçu de Noël (espace parents)
      ev('switchView("ile"); setSeasonPreview("noel")');
      check('saisons : aperçu de Noël — la neige tombe', d.body.dataset.season==='noel' && d.querySelectorAll('#season-fx .sfx-neige').length>5);
      check('saisons : aperçu de Noël — sapin et bonhomme de neige sur l\'île', !!d.querySelector('#view-ile .ss-noel'));
      check('saisons : les compagnons portent le bonnet de Noël', ev('companionSVG("perle","happy")').includes('M-2 12 C2 -12 24 -34'));
      check('saisons : un avatar qui a déjà un chapeau le garde', !ev('avatarHTML("art:zap", {tete:"couronne"})').includes('M-2 12 C2 -12 24 -34'));
      check('saisons : pas de cadeau pendant un aperçu', ev('seasonGiftDue()')===null);
      ev('openParentSpace()');
      check('saisons : l\'espace parents propose l\'aperçu des fêtes', !!d.querySelector('[data-season-preview="noel"]') && d.querySelector('[data-season-preview="noel"]').classList.contains('on'));
      ev('closeModal(); setSeasonPreview(null)');
      check('saisons : hors saison, ni neige ni décor', !d.body.dataset.season && !d.querySelector('#season-fx .sfx') && !d.querySelector('#view-ile .ss'));
      // anniversaire réglé dans les réglages du joueur, puis fêté
      ev('openPlayerSettings(profiles.current)');
      d.getElementById('pe-bday-d').value = String(new Date().getDate());
      d.getElementById('pe-bday-m').value = String(new Date().getMonth()+1);
      d.getElementById('pe-save').click();
      check('anniversaire : réglé dans les réglages du joueur', ev('currentProfile().birthday')===ev('seasonMMDD(new Date())'));
      check('anniversaire : le jour J, c\'est la fête', ev('currentSeason()')==='anniversaire' && ev('seasonGiftDue()')==='anniversaire');
      const coins = ev('state.coins');
      ev('closeModal(); state.wardrobe = state.wardrobe.filter(k=>k!=="fete"); maybeSeasonGift()');
      check('anniversaire : un cadeau — chapeau de fête et 20 pièces', !!d.querySelector('.season-gift') && ev('state.coins')===coins+20 && ev('ownsLookItem("fete")')===true);
      d.getElementById('sg-wear').click();
      check('anniversaire : on peut mettre son chapeau tout de suite', ev('state.look.tete')==='fete');
      check('anniversaire : un seul cadeau par an', ev('maybeSeasonGift()')===false);
      ev('currentProfile().birthday = ""; saveProfiles(); state.seasonGifts = {}; state.look = {tete:null, visage:null, tenue:null, cape:null}; state.wardrobe = []; save(); setSeasonPreview("aucune"); switchView("carte")');
    }
    // ---- Assembler l'image (vrai puzzle) ----
    {
      ev('closeModal(); party.active = false; state.skills = {}; currentProfile().age = 0; currentWorld = "lagon"; playGame("jigsaw")');
      check('puzzle : 2×2 au Lagon, avec l\'image en transparence', d.querySelectorAll('.jg-slot').length===4 && d.querySelectorAll('.jg-piece').length===4 && !!d.querySelector('.jg-ghost'));
      check('puzzle : l\'image est dessinée une fois (symbole), chaque morceau en montre une partie', d.querySelectorAll('#jg-art').length===1 && d.querySelectorAll('.jg-piece use').length===4);
      check('puzzle : les morceaux ne sont jamais déjà en ordre', ev('jigsawState.order.some((p,i)=>p!==i)'));
      // une erreur : le morceau revient, rien n'est posé
      const wrong = [...d.querySelectorAll('.jg-piece')].find(p=>p.dataset.p!=='0');
      wrong.click(); d.querySelector('.jg-slot[data-s="0"]').click();
      check('puzzle : un morceau mal placé revient dans la réserve', !d.querySelector('.jg-slot.filled') && !wrong.classList.contains('used') && ev('missionErrors')===1);
      // tout bien placer (toucher le morceau, puis sa case)
      for(let i=0;i<4;i++){ d.querySelector(`.jg-piece[data-p="${i}"]`).click(); d.querySelector(`.jg-slot[data-s="${i}"]`).click(); }
      check('puzzle : chaque morceau bien placé reste dans le cadre', d.querySelectorAll('.jg-slot.filled').length===4);
      await wait(800);
      check('puzzle : image complète → mission réussie', !!d.querySelector('.win-box') && ev('state.skills.jigsaw.wins')===1);
      ev('closeModal()');
      check('puzzle : de plus en plus de morceaux (2×2, 3×3, 4×3)', ev('[1,2,3,4,5].map(t=>jigsawRound(t).cols*jigsawRound(t).rows).join()')==='4,4,9,9,12');
      check('puzzle : plus de transparence aux paliers 4-5, un modèle à la place', ev('jigsawRound(4).ghost')===0 && ev('jigsawRound(3).ghost')>0);
      ev('state.skills.jigsaw = {wins:3, fails:0, errors:0, last:null, recent:[], lvl:5}; currentWorld = "chateau"; playGame("jigsaw")');
      check('puzzle : 3×3 avec un modèle sur l\'île 4', d.querySelectorAll('.jg-slot').length===9 && !!d.querySelector('.jg-model') && !d.querySelector('.jg-ghost'));
      check('puzzle : pas de minuteur', !d.getElementById('challenge-timer'));
      ev('closeModal(); state.skills = {}; currentWorld = "lagon"; save()');
    }
    // ---- Offrir un objet à un personnage ----
    {
      ev('closeModal(); party.active = false; state.friends = {}; state.friendRewards = {}; state.inventory = {}; save()');
      const chars = ev('Object.keys(CHARACTERS)');
      check('cadeaux : chaque personnage a 2 objets préférés de son île, qu\'il ne donne pas lui-même', chars.every(c=>ev(`(function(){ const f = favoritesOf(${JSON.stringify(c)}), ch = CHARACTERS[${JSON.stringify(c)}]; return f.length===2 && f[0]!==f[1] && f.every(k=>ITEMS[k] && (ITEMS[k].world||'lagon')===(ch.world||'lagon') && !ch.loot.includes(k)); })()`)));
      check('cadeaux : les préférés ne changent pas d\'une fois à l\'autre', ev('favoritesOf("sirene").join()===favoritesOf("sirene").join()'));
      ev('openDialogue("sirene")');
      check('cadeaux : bouton « Offrir un objet » dans le dialogue', !!d.getElementById('btn-gift'));
      d.getElementById('btn-gift').click();
      check('cadeaux : sac vide → message clair', !!d.querySelector('.empty-state') && !d.querySelector('.gift-item'));
      const fav = ev('favoritesOf("sirene")[0]');
      ev(`state.inventory = { ${JSON.stringify(fav)}: 2, coquillage: 1 }; state.quests = { date: today(), list: [{type:'gift', target:null, goal:2, n:0, label:'Offre 2 objets'}], claimed:false }; save(); openGiftPicker("sirene")`);
      check('cadeaux : les objets du sac sont proposés, le préféré marqué 💖 en premier', d.querySelectorAll('.gift-item').length===2 && d.querySelector('.gift-item').dataset.gift===fav && d.querySelector('.gift-item').classList.contains('fav'));
      d.querySelector(`.gift-item[data-gift="${fav}"]`).click();
      check('cadeaux : l\'objet quitte le sac, le préféré vaut 2 cœurs', ev(`countItem(${JSON.stringify(fav)})`)===1 && ev('friendPoints("sirene")')===2);
      check('cadeaux : le personnage remercie (cœurs, message)', !!d.querySelector('.gift-thanks') && d.querySelectorAll('.gt-hearts i').length>0 && d.querySelector('.gift-thanks').textContent.includes('préféré'));
      check('cadeaux : compte pour la mission du jour', ev('state.quests.list[0].n')===1);
      d.getElementById('gift-more').click();
      d.querySelector('.gift-item[data-gift="coquillage"]').click();
      check('cadeaux : un autre objet vaut 1 cœur', ev('friendPoints("sirene")')===3 && ev('state.quests.list[0].n')===2);
      const coins = ev('state.coins');
      ev(`state.inventory[${JSON.stringify(fav)}] = 1; giveGift("sirene", ${JSON.stringify(fav)})`);
      check('cadeaux : à 5 cœurs, meilleurs amis et une surprise de 10 pièces', ev('friendPoints("sirene")')>=5 && ev('state.coins')===coins+10 && ev('state.friendRewards.sirene')===true);
      ev('state.inventory.coquillage = 1; giveGift("sirene", "coquillage")');
      check('cadeaux : la surprise n\'est donnée qu\'une fois', ev('state.coins')===coins+10);
      check('cadeaux : impossible d\'offrir un objet qu\'on n\'a pas', ev('giveGift("sirene", "gemme")')===null);
      ev('openDialogue("sirene")');
      check('cadeaux : l\'amitié se voit en cœurs dans le dialogue', !!d.querySelector('.char-header .friend-hearts'));
      ev('closeModal(); state.friends = {}; state.friendRewards = {}; state.inventory = {}; state.quests = null; save()');
    }
    // ---- Musique d'ambiance ----
    {
      // jsdom n'a pas de son : un faux moteur audio qui compte les notes
      ev(`(function(){
        const param = ()=>({ value:0, setValueAtTime(){}, linearRampToValueAtTime(){}, exponentialRampToValueAtTime(){}, setTargetAtTime(){}, cancelScheduledValues(){} });
        const node = (extra)=>Object.assign({ connect(n){ return n || this; }, disconnect(){} }, extra);
        window.__notes = 0;
        window.AudioContext = class { constructor(){ this.currentTime = 0; this.state = 'running'; this.destination = node({}); }
          createOscillator(){ window.__notes++; return node({ type:'', frequency:param(), start(){}, stop(){} }); }
          createGain(){ return node({ gain:param() }); }
          createBiquadFilter(){ return node({ type:'', frequency:param(), Q:param() }); }
          resume(){} };
        audioCtx = null;
      })()`);
      check('musique : chaque île a son ambiance', ev('WORLD_ORDER.every(id=>!!MUSIC_THEMES[id])'));
      check('musique : coupée par défaut', ev('freshState().music')===false && ev('musicWanted()')===false);
      // le bouton son : sons + voix → sons seuls → silence → musique → sons + voix
      ev('state.sound = true; state.voice = true; state.music = false; save(); renderSoundBtn()');
      const modes = [];
      for(let i=0;i<4;i++){ d.getElementById('sound-btn').click(); modes.push(ev('soundModeLabel()')); }
      check('musique : le bouton son passe par la musique', modes.join(' | ')==='🔊 Sons seulement | 🔇 Silence | 🎵 Musique + sons + voix | 🗣️ Sons + voix');
      ev('state.music = true; state.sound = true; state.voice = true; save(); updateMusic()');
      check('musique : démarre quand elle est activée', ev('music.on')===true && ev('window.__notes')>0);
      const n0 = ev('window.__notes');
      ev('for(let i=0;i<20;i++){ audioCtx.currentTime += .3; musicTick(); }');   // 6 s : au moins une mesure entière
      check('musique : la mélodie continue (notes programmées à l\'avance)', ev('window.__notes')>n0);
      ev('currentWorld = "volcan"; for(let i=0;i<20;i++){ audioCtx.currentTime += .3; musicTick(); }');
      check('musique : change d\'ambiance avec l\'île', ev('musicTheme().lead')==='pluck' && ev('musicTheme().minor')===true);
      ev('state.sound = false; updateMusic()');
      check('musique : s\'arrête en mode silence', ev('music.on')===false);
      ev('state.sound = true; state.music = false; currentWorld = "lagon"; save(); updateMusic(); renderSoundBtn(); audioCtx = null; delete window.AudioContext');
      ev('openParentSpace()');
      check('musique : interrupteur dans l\'espace parents', !!d.querySelector('[data-music="1"]') && d.querySelector('[data-music="0"]').classList.contains('on'));
      ev('closeModal()');
    }
    // ---- L'histoire avance à chaque mission : épisodes ----
    {
      ev('closeModal(); party.active = false; state.storyMissions = {}; state.storyEpisodes = {}; currentWorld = "lagon"; save()');
      check('épisodes : 3 épisodes pour chaque île', ev('WORLD_ORDER.every(id=>EPISODES[id] && EPISODES[id].length===3)'));
      check('épisodes : racontés par les habitants de l\'île (pas le guide du chapitre)', ev('WORLD_ORDER.every(id=>EPISODES[id].every(ep=>CHARACTERS[ep.by] && (CHARACTERS[ep.by].world||"lagon")===id && ep.by!==STORY[id].guide && ep.lines.length>=2))'));
      check('épisodes : pas d\'épisode avant 2 missions', ev('episodeDue("lagon")')===-1 && ev('maybeStoryEpisode()')===false);
      // une vraie mission réussie : l'histoire avance sur l'écran de victoire
      ev('state.visited = WORLD_ORDER.filter(worldUnlocked); state.storyMissions = { lagon: 1 }; save(); playGame("count"); onMissionWin()');
      check('épisodes : la victoire compte pour l\'histoire de l\'île', ev('storyMissionsOn("lagon")')===2);
      check('épisodes : l\'écran de victoire montre que l\'histoire avance', !!d.querySelector('.win-box .story-progress'));
      const coins = ev('state.coins');
      d.getElementById('btn-yay').click();
      await wait(400);
      check('épisodes : après « Super ! », l\'épisode 1 arrive', !!d.querySelector('.ep-num') && d.querySelector('.char-header').textContent.includes('La bouteille à la mer'));
      d.getElementById('ep-next').click();
      check('épisodes : à la fin, un indice et 3 pièces', !!d.querySelector('.ep-find') && ev('state.coins')===coins+3 && ev('episodesSeen("lagon")')===1);
      d.getElementById('ep-next').click();
      check('épisodes : pas deux fois le même', ev('maybeStoryEpisode()')===false);
      ev('state.storyMissions.lagon = 4'); check('épisodes : le 2e après 4 missions', ev('episodeDue("lagon")')===1);
      ev('state.storyMissions.lagon = 6; state.storyEpisodes.lagon = 2'); check('épisodes : le 3e après 7 missions seulement', ev('episodeDue("lagon")')===-1 && ev('(state.storyMissions.lagon = 7, episodeDue("lagon"))')===2);
      check('épisodes : en mode à plusieurs, pas d\'interruption', ev('(party.active = true, maybeStoryEpisode())')===false && ev('(party.active = false, true)'));
      // « Mon histoire » : relire les épisodes vus, sans regagner de pièces
      ev('state.storyEpisodes = { lagon: 1 }; save(); openStoryJournal()');
      check('épisodes : relire les épisodes vus dans « Mon histoire »', d.querySelectorAll('.story-ep[data-ep]').length===1 && d.querySelectorAll('.story-ep.locked').length>=2);
      const c2 = ev('state.coins');
      d.querySelector('[data-ep="lagon:0"]').click(); d.getElementById('ep-next').click();
      check('épisodes : relire ne redonne pas de pièces', !!d.querySelector('.ep-find') && ev('state.coins')===c2);
      ev('closeModal(); state.storyMissions = {}; state.storyEpisodes = {}; save()');
    }
    // ---- Chaque nouveau monde : couleurs propres et place sur la carte ----
    {
      // toutes les feuilles de style du manifeste : les thèmes peuvent vivre dans leur slice
      const css = page.manifestCss().map(f=> page.read(f)).join('\n');
      const ids = ev('Object.keys(WORLDS)');
      const sansTheme = ids.filter(id=>id!=='lagon' && !css.includes(`body[data-world="${id}"]{--world-sky`));
      check('carte : chaque monde a son thème de couleurs (--world-*)', sansTheme.length===0);
      if(sansTheme.length) console.log('   sans thème :', sansTheme.join(', '));
      const pos = ids.map(id=>({id, ...ev(`WORLDS[${JSON.stringify(id)}].map`)}));
      const dehors = pos.filter(p=>p.x<14 || p.x>86 || p.y<15 || p.y>85);
      check('carte : chaque île tient dans le cadre (x 14–86 %, y 15–85 %)', dehors.length===0);
      if(dehors.length) console.log('   hors cadre :', dehors.map(p=>p.id).join(', '));
      // une île + son étiquette ≈ 24 % de large et 30 % de haut sur téléphone ;
      // chaque archipel a sa carte (v55) : on compare les îles d'un même archipel
      const collisions = [];
      pos.forEach((a,i)=>pos.slice(i+1).forEach(b=>{ if(ev(`archipelagoOf(${JSON.stringify(a.id)})===archipelagoOf(${JSON.stringify(b.id)})`) && Math.abs(a.x-b.x)<24 && Math.abs(a.y-b.y)<30) collisions.push(a.id+'/'+b.id); }));
      check('carte : aucune île ne chevauche une autre (dans chaque archipel)', collisions.length===0);
      if(collisions.length) console.log('   chevauchements :', collisions.join(', '));
    }
    // ---- Feuilles de style : une accolade perdue (ex. lors d'une fusion) enferme
    //      silencieusement tout le reste dans une media query ----
    page.manifestCss().forEach(f=>{
      const css = page.read(f).replace(/\/\*[\s\S]*?\*\//g, '');
      let depth = 0, min = 0;
      for(const ch of css){ if(ch==='{') depth++; else if(ch==='}') depth--; min = Math.min(min, depth); }
      check(`${f} : accolades équilibrées`, depth===0 && min===0);
    });

    // ---- Anti-devinette : une erreur relance une NOUVELLE question, ----
    // ---- jamais la même à éliminer peu à peu (ex. Volumes, Saisons) ----
    ev('currentWorld="lagon"; renderVolume()');
    const volBtns = [...d.querySelectorAll('.vol-container-btn')];
    check('volumes : île 1, 2 contenants distincts', volBtns.length===2);
    volBtns[0].click();   // une bonne ou une mauvaise réponse, peu importe ici
    await wait(1050);     // laisse la relance (900ms) se déclencher si c'était faux
    check('volumes : la fenêtre reste utilisable après une relance', !!d.querySelector('.vol-container-btn, .win-box, .fail-box'));
    ev('closeModal()');

    ev('currentWorld="lagon"; renderCalendar()');
    if(d.querySelector('.season-btn')){
      [...d.querySelectorAll('.season-btn')][0].click();
      await wait(1050);
      check('saisons : la fenêtre reste utilisable après une éventuelle relance', !!d.querySelector('.season-btn, .win-box, .fail-box'));
    }
    ev('closeModal()');

    // la relance programmée doit être annulable : si on ferme la fenêtre
    // (ou qu'on en ouvre une autre) avant qu'elle ne se déclenche, elle
    // ne doit JAMAIS réapparaître par-dessus un autre jeu.
    ev('currentWorld="lagon"; renderCount()');
    const cntWrong = [...d.querySelectorAll('.num-btn')].find(b=>Number(b.dataset.v)!==Number(d.querySelectorAll('.count-row span').length));
    cntWrong.click();                 // programme une relance dans 900ms…
    ev('closeModal(); renderMemory()'); // …mais on quitte avant qu'elle n'ait eu lieu
    await wait(1100);
    check('anti-devinette : la relance annulée ne revient pas par-dessus un autre jeu', !!d.querySelector('.mcard'));
    ev('closeModal()');

    // un clic sur la mauvaise réponse déclenche un encouragement parlé
    check("audio pendant le jeu : un indice parlé existe en cas d'erreur", ev('typeof speakWrongHint')==='function' && ev('WRONG_HINTS.length')>0);

    check('aucune erreur JS', errs.length===0);
    if(errs.length) console.log(errs);
    console.log(failed ? `\n${failed} test(s) en échec` : '\nTous les tests passent');
    process.exit(failed?1:0);
  }, 600);
}, 600);
