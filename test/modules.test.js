// Les VRAIS modules ES (v54), chargés par Node comme par le navigateur :
// même ordre d'initialisation, mode strict, une variable lue avant d'être
// initialisée (« temporal dead zone ») ou un import manquant au chargement
// font échouer ce test. Les autres tests utilisent une version regroupée
// par esbuild, où ces erreurs passeraient inaperçues (voir test/tools/page.js).
// Le DOM vient de jsdom : on expose ses objets (document, localStorage…)
// comme le ferait le navigateur, puis on importe js/app/main.js.
const path = require('path');
const { pathToFileURL } = require('url');
const { JSDOM } = require('jsdom');
const page = require('./tools/page.js');

let failed = 0;
function check(name, cond, detail){
  console.log((cond ? '✅' : '❌') + ' ' + name + (!cond && detail ? `\n     → ${detail}` : ''));
  if(!cond) failed++;
}

// la page sans aucun script : main.js sera importé à la main
const html = page.read('index.html').replace(/<script[^>]*src="js\/[^"]+"><\/script>\n?/g, '');
const dom = new JSDOM(html, { url:'http://localhost/?saison=aucune', pretendToBeVisual:true });
const w = dom.window;
const errors = [];
w.addEventListener('error', (e)=> errors.push(e.message));
process.on('uncaughtException', (e)=> errors.push(e.message));
w.speechSynthesis = { speaking:false, cancel(){}, getVoices:()=>[], speak(){} };
w.SpeechSynthesisUtterance = function(text){ this.text = text; };
w.confirm = ()=> true;
// ce que le jeu prend dans la portée globale du navigateur : pris dans jsdom
// (liste explicite : recopier tout l'objet window dérègle Node)
const BROWSER = ['window', 'self', 'document', 'localStorage', 'sessionStorage', 'location', 'navigator', 'history',
  'matchMedia', 'requestAnimationFrame', 'cancelAnimationFrame', 'speechSynthesis', 'SpeechSynthesisUtterance',
  'innerWidth', 'innerHeight', 'confirm', 'alert', 'FileReader', 'ResizeObserver', 'getComputedStyle', 'scrollTo',
  'Event', 'CustomEvent', 'HTMLElement', 'Node'];
for(const k of BROWSER){
  const v = typeof w[k] === 'function' && !/^[A-Z]/.test(k) ? w[k].bind(w) : undefined;
  Object.defineProperty(globalThis, k, { get: ()=> v || w[k], configurable:true });
}
const wait = (ms)=> new Promise(r=> setTimeout(r, ms));

console.log('— Vrais modules ES (Node)');
(async ()=>{
  try{
    await import(pathToFileURL(path.join(page.root, page.ENTRY)).href);
  }catch(e){
    check('les modules se chargent', false, e.stack.split('\n').slice(0, 3).join(' | '));
    process.exit(1);
  }
  check('les modules se chargent, dans l\'ordre de leurs imports', true);
  const d = w.document;
  check('aucune variable du jeu dans la portée globale', ['state', 'closeModal', 'playGame', 'currentWorld', 'SQUISHIES', 'on', 'emit']
    .every(n=> !(n in w)), ['state', 'closeModal', 'playGame', 'currentWorld', 'SQUISHIES', 'on', 'emit'].filter(n=> n in w).join(', '));
  check('écran titre affiché', d.getElementById('splash').classList.contains('show'));
  d.getElementById('btn-splash-play').click();
  check('écran de bienvenue', d.getElementById('welcome').classList.contains('show'));
  d.getElementById('name-input').value = 'Lou';
  d.querySelector('.avatar-opt').click();
  d.getElementById('btn-start').click();
  await wait(300);
  check('bienvenue fermée, prénom affiché', !d.getElementById('welcome').classList.contains('show') && d.getElementById('player-name').textContent === 'Lou');
  d.getElementById('modal-close').click();
  d.getElementById('ic-go').click();
  check('débarquer sur l\'île', d.getElementById('view-ile').classList.contains('active'));
  const ch = d.querySelector('.isle-char, .island, [data-char]');
  if(ch) ch.click();
  await wait(100);
  const play = d.getElementById('btn-play');
  if(play) play.click();
  const choice = d.querySelector('.game-choice');
  if(choice) choice.click();
  await wait(100);
  check('un mini-jeu s\'ouvre (île → choix des jeux → jeu)', !!d.querySelector('#modal-body .game-head'));
  d.getElementById('modal-close').click();
  d.getElementById('squishy-btn').click();
  check('la chambre à squishies s\'ouvre', !!d.getElementById('sq-room'));
  d.getElementById('modal-close').click();
  d.querySelector('.navbtn[data-view="marche"]').click();
  ['echanger', 'acheter', 'fusionner', 'vendre'].forEach(t=> d.querySelector(`.tab-btn[data-tab="${t}"]`).click());
  check('le marché et ses onglets', d.getElementById('view-marche').classList.contains('active'));
  d.getElementById('avatar-pill').click();
  const parents = d.getElementById('btn-parents');
  if(parents) parents.click();
  check('les joueurs puis la porte des parents (événement nav:parents)', !!d.getElementById('gate-in'));
  await wait(300);
  check('aucune erreur JS', errors.length === 0, errors.slice(0, 3).join(' | '));
  console.log(failed ? `\n${failed} échec(s)` : '\nLes vrais modules se chargent et fonctionnent');
  process.exit(failed ? 1 : 0);
})();
