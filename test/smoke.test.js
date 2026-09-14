// Test de fumée : charge le HTML dans jsdom et parcourt tout le cycle de jeu.
const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '..', 'lagon-magique.html'), 'utf8');
const dom = new JSDOM(html, { runScripts:'dangerously', pretendToBeVisual:true, url:'http://localhost/' });
const w = dom.window, d = w.document;
w.confirm = ()=>true;
const errs = [];
w.addEventListener('error', e=>errs.push(e.message));
const ev = (code)=> w.eval(code);
let failed = 0;
function check(name, cond){ console.log((cond?'✅':'❌')+' '+name); if(!cond) failed++; }

// Accueil : prénom + avatar
check('écran de bienvenue au 1er lancement', d.getElementById('welcome').classList.contains('show'));
d.getElementById('name-input').value = 'Loulou';
d.querySelector('.avatar-opt[data-av="🦄"]').click();
d.getElementById('btn-start').click();
check('bienvenue fermé après validation', !d.getElementById('welcome').classList.contains('show'));
check('prénom enregistré', ev('state.name')==='Loulou');
check('avatar enregistré', ev('state.avatar')==='🦄');
check('profil affiché dans la barre', d.getElementById('player-name').textContent==='Loulou');

check('3 personnages affichés', d.querySelectorAll('.island').length===3);
check('scène déco présente', !!d.getElementById('scene'));
check('3 missions du jour', ev('state.quests.list.length')===3);

d.querySelector('.island[data-char="licorne"]').click();
check('dialogue ouvert', d.getElementById('overlay').classList.contains('show'));
check('bouton voix dans le dialogue', !!d.querySelector('#modal [data-say]'));
d.getElementById('btn-play').click();
check('mini-jeu lancé avec bouton quitter', !!d.getElementById('btn-quit'));

ev("currentChar='licorne'");
// Compter
ev('renderCount()');
const n = d.querySelectorAll('.count-row span').length;
d.querySelector(`.num-btn[data-v="${n}"]`).click();
check('compter : victoire', ev('state.missions')===1);
// Intruse
ev('renderDiff()');
d.querySelector('.diff-item[data-odd="true"]').click();
check('intruse : victoire', ev('state.missions')===2);
// Suite logique
ev('renderSequence()');
const seqItems = [...d.querySelectorAll('.seq-row span:not(.q)')].map(s=>s.textContent);
check('suite : 5+ symboles affichés', seqItems.length>=5);
const opts = [...d.querySelectorAll('.seq-btn')];
opts.forEach(b=>b.click()); // clique tout : le bon déclenche la victoire (timer)
// Mémoire
ev('renderMemory()');
check('mémoire : 6 cartes niveau 1', d.querySelectorAll('.mcard').length===6);

setTimeout(()=>{
  check('suite : victoire (missions=3)', ev('state.missions')===3);
  // Puzzle
  ev('renderPuzzle()');
  const cnt = d.querySelectorAll('.puzzle-btn').length;
  for(let i=1;i<=cnt;i++) d.querySelector(`.puzzle-btn[data-n="${i}"]`).click();

  setTimeout(()=>{
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

    check('sauvegarde localStorage', !!w.localStorage.getItem('lagon-magique-save'));
    check('aucune erreur JS', errs.length===0);
    if(errs.length) console.log(errs);
    console.log(failed ? `\n${failed} test(s) en échec` : '\nTous les tests passent');
    process.exit(failed?1:0);
  }, 600);
}, 600);
