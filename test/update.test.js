// La version du jeu et le bouton « Chercher une mise à jour » (v66) :
// - un seul numéro (js/shared/lib/version.js), écrit par bun run sync dans le
//   cache du service worker (sw.js : lagon-vNN) ;
// - le service worker ne mélange jamais anciens et nouveaux fichiers ;
// - dans l'espace parents : la version, et le bouton qui répond dans chaque cas
//   (pas d'Internet, site muet, rien de neuf, nouvelle version, déjà installée) ;
// - après le redémarrage, « Le jeu est à jour : version N » sur l'écran titre.
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { JSDOM, VirtualConsole } = require('jsdom');
const page = require('./tools/page.js');

let failed = 0, passed = 0;
function check(name, cond, detail){
  if(cond){ passed++; console.log('✅ ' + name); }
  else { failed++; console.log('❌ ' + name + (detail ? `\n     → ${detail}` : '')); }
}
function section(name){ console.log('— ' + name); }
const wait = ms => new Promise(r=> setTimeout(r, ms));
async function waitFor(cond, ms = 3000){ const t0 = Date.now(); while(Date.now() - t0 < ms){ if(cond()) return true; await wait(20); } return !!cond(); }
const file = (f)=> path.join(page.root, f);

/* ---------- un seul numéro de version ---------- */
section('La version du jeu');
const V = Number((/const APP_VERSION = (\d+);/.exec(fs.readFileSync(file('js/shared/lib/version.js'), 'utf8')) || [])[1]);
const SW = fs.readFileSync(file('sw.js'), 'utf8');
check('js/shared/lib/version.js donne un numéro de version', V > 0, String(V));
check('le cache du service worker porte ce numéro (lagon-vNN)', SW.includes(`const CACHE = 'lagon-v${V}';`), (/const CACHE = '([^']+)'/.exec(SW) || [])[1]);
// bun run sync réécrit le nom du cache à partir de la version
try{
  fs.writeFileSync(file('sw.js'), SW.replace(/const CACHE = 'lagon-v\d+';/, "const CACHE = 'lagon-v1';"));
  execFileSync('node', [file('test/tools/sync.js')], { stdio:'pipe' });
  check('bun run sync écrit la version dans le cache de sw.js', fs.readFileSync(file('sw.js'), 'utf8') === SW);
} finally {
  fs.writeFileSync(file('sw.js'), SW);
}
check('le service worker prend ses fichiers sur le site, pas dans le cache HTTP (cache:\'reload\')', /addAll\(FILES\.map\(f=> new Request\(f, \{ cache:'reload' \}\)\)\)/.test(SW));
check('il redemande au site si les fichiers du jeu ont changé (no-cache), pas les pages ni les polices',
  /mode !== 'navigate' && new URL\(e\.request\.url\)\.origin === self\.location\.origin/.test(SW) && /new Request\(e\.request, \{ cache:'no-cache' \}\)/.test(SW));
check('sans réseau, il répond toujours avec le cache', /\.catch\(\(\)=>caches\.match\(e\.request\)\)/.test(SW));

/* ---------- le jeu ---------- */
const html = page.buildHtml();
function openGame(flag){
  const jsdomErrors = [];
  const vc = new VirtualConsole();
  vc.on('jsdomError', e=> jsdomErrors.push(String(e && e.message)));
  const dom = new JSDOM(html, {
    runScripts:'dangerously', pretendToBeVisual:true, url:'http://localhost/?saison=aucune', virtualConsole:vc,
    beforeParse(win){
      win.SpeechSynthesisUtterance = function(text){ this.text = text; };
      win.speechSynthesis = { speaking:false, cancel(){}, getVoices:()=>[], speak(){} };
      if(flag !== undefined) win.sessionStorage.setItem('lagon-update-from', String(flag));
    },
  });
  return { w:dom.window, d:dom.window.document, jsdomErrors };
}

(async ()=>{
  const { w, d, jsdomErrors } = openGame();
  const ev = (code)=> w.eval(code);
  await wait(150);
  check('le jeu connaît sa version', ev('APP_VERSION') === V);

  section('L\'espace parents');
  ev('parentUnlockedUntil = Date.now() + 60000; openParentSpace()'); await wait(20);
  const btn = ()=> d.getElementById('ps-update'), msg = ()=> d.getElementById('ps-update-msg');
  check(`la carte « Version du jeu » affiche la version ${V}`, !!d.querySelector('.ps-update') && d.getElementById('ps-version').textContent === String(V)
    && /Version du jeu/.test(d.querySelector('.ps-update h3').textContent));
  check('avec le bouton « Chercher une mise à jour », sous les réglages et avant la zone sensible', !!btn() && /Chercher une mise à jour/.test(btn().textContent)
    && !!d.querySelector('.ps-update + .ps-danger'));
  check('le message se lit à voix haute par les lecteurs d\'écran (role=status)', msg().getAttribute('role') === 'status');

  // un faux service worker, pour chaque cas
  let offline = false, reg = null, posted = [];
  Object.defineProperty(w.navigator, 'onLine', { configurable:true, get:()=> !offline });
  Object.defineProperty(w.navigator, 'serviceWorker', { configurable:true, value:{ getRegistration: async ()=> reg } });
  const flag = ()=> w.sessionStorage.getItem('lagon-update-from');
  const press = async ()=>{ btn().click(); await waitFor(()=> msg().dataset.status); await wait(10); return msg().dataset.status; };
  const reopen = async ()=>{ ev('openParentSpace()'); await wait(20); };

  offline = true;
  check('pas d\'Internet : « le jeu se mettra à jour à la prochaine connexion »', await press() === 'offline'
    && /Pas d'Internet/.test(msg().textContent) && !btn().disabled && flag() === null);

  offline = false; await reopen();
  reg = { installing:null, waiting:null, update: async ()=>{} };
  check(`rien de neuf : « Le jeu est à jour (version ${V}) », le bouton reste utilisable`, await press() === 'uptodate'
    && msg().textContent.includes(`version ${V}`) && !btn().disabled && flag() === null);

  await reopen();
  reg = { installing:null, waiting:null, update: async ()=>{ throw new Error('réseau'); } };
  check('le site ne répond pas : un message pour réessayer', await press() === 'error' && /réessayez/.test(msg().textContent) && !btn().disabled);

  await reopen();
  reg = { installing:null, waiting:null, update: async function(){ this.installing = { state:'installing' }; } };
  check('nouvelle version : « Le jeu redémarre dans quelques secondes », le bouton se bloque', await press() === 'found'
    && /redémarre/.test(msg().textContent) && btn().disabled);
  check('la version d\'avant est notée pour l\'annoncer après le redémarrage', flag() === String(V));
  w.sessionStorage.removeItem('lagon-update-from');

  await reopen();
  reg = { installing:null, waiting:{ postMessage:(m)=> posted.push(m) }, update: async ()=>{} };
  check('une nouvelle version déjà téléchargée qui attend : on lui dit de prendre la main', await press() === 'found' && posted.includes('skipWaiting'));
  w.sessionStorage.removeItem('lagon-update-from');

  await reopen();
  reg = { installing:null, waiting:null, update: async ()=>{} };
  w.caches = { keys: async ()=> ['lagon-v' + (V + 1)] };
  check('une version plus récente est déjà installée : le jeu redémarre pour la prendre', await press() === 'reload' && flag() === String(V));
  check('… et redémarre vraiment (rechargement de la page)', await waitFor(()=> jsdomErrors.some(m=> /navigation/i.test(m)), 2500), jsdomErrors.join(' | '));
  delete w.caches;

  section('Après le redémarrage');
  const note = (g)=> g.d.getElementById('splash-note');
  const after = openGame(V - 1);
  await wait(300);
  check(`sur l'écran titre : « Le jeu est à jour : version ${V} »`, after.d.getElementById('splash').classList.contains('show')
    && !note(after).hidden && note(after).textContent.includes(`Le jeu est à jour : version ${V}`), note(after).textContent);
  check('il ne s\'affiche qu\'une fois', after.w.sessionStorage.getItem('lagon-update-from') === null);
  after.d.getElementById('btn-splash-play').click(); await wait(50);
  check('il part avec l\'écran titre (« Jouer »)', note(after).hidden);
  const same = openGame(V);
  await wait(300);
  check(`même version (rien n'a changé) : « Le jeu est à jour (version ${V}) »`, !note(same).hidden && note(same).textContent.includes(`(version ${V})`));
  const none = openGame();
  await wait(300);
  check('un démarrage normal n\'affiche rien', note(none).hidden && !note(none).textContent);

  console.log(failed ? `\n${failed} test(s) de la mise à jour en échec` : `\nTous les tests de la mise à jour passent (${passed})`);
  process.exit(failed ? 1 : 0);
})();
