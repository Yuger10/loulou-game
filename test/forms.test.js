// Formulaires et boutons d'action : modèle commun (en-tête fixe avec ✕,
// contenu qui défile, barre d'actions fixe en bas), modifications non
// enregistrées (« Garder tes changements ? »), champs obligatoires, fenêtre de
// confirmation du jeu, actions dangereuses derrière l'accès parents avec
// double confirmation, plus aucun confirm() du navigateur.
const fs = require('fs');
const path = require('path');
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
    // un confirm() du navigateur ne doit plus jamais être appelé
    win.confirm = ()=>{ win.__confirmCalled = true; return true; };
  },
});
const w = dom.window, d = w.document;
const errs = [];
w.addEventListener('error', e=> errs.push(e.message));
const ev = (code)=> w.eval(code);
const wait = ms => new Promise(r=> setTimeout(r, ms));
let failed = 0, passed = 0;
function check(name, cond){ if(cond){ passed++; console.log('✅ ' + name); } else { failed++; console.log('❌ ' + name); } }
function section(name){ console.log('— ' + name); }
const $ = (sel)=> d.querySelector(sel);
const modalOpen = ()=> d.getElementById('overlay').classList.contains('show');
const layer = ()=> d.getElementById('confirm-layer');
const layerOpen = ()=> !!layer() && !layer().hidden;
const lastSaid = ()=> spoken[spoken.length - 1] || '';
const css = (el, prop)=> el ? w.getComputedStyle(el)[prop] : '';
function type(el, value){ el.value = value; el.dispatchEvent(new w.Event('input', { bubbles:true })); }
function key(el, k){ el.dispatchEvent(new w.KeyboardEvent('keydown', { key:k, bubbles:true })); }

(async ()=>{
  await wait(100);
  d.getElementById('btn-splash-play').click();

  /* ================= Accueil ================= */
  section('Accueil');
  {
    const start = d.getElementById('btn-start');
    d.getElementById('name-input').value = '';
    start.click();
    await wait(30);
    check('prénom vide : l\'accueil reste ouvert', d.getElementById('welcome').classList.contains('show'));
    check('prénom vide : un message doux et parlé', /prénom/i.test(lastSaid()));
    check('le bouton « C\'est parti » reste visible (barre fixe)', css($('#welcome .welcome-actions'), 'position') === 'sticky');
    check('sections titrées : Moi, Mon avatar', !!$('#welcome .form-section-title') && /Moi/.test(d.getElementById('welcome').textContent) && /Mon avatar/.test(d.getElementById('welcome').textContent));
    d.getElementById('name-input').value = 'Lou';
    $('.avatar-opt').click();
    start.click();
    await wait(150);
    check('avec un prénom, l\'accueil se ferme', !d.getElementById('welcome').classList.contains('show'));
    ev('closeModal()');
  }

  /* ================= Phase 1 : modèle commun ================= */
  section('Modèle de formulaire (nouveau joueur)');
  {
    ev('openNewPlayer()'); await wait(20);
    const sheet = $('#modal .form-sheet');
    check('un formulaire au modèle commun', !!sheet);
    check('en-tête fixe : titre et ✕', !!$('.form-head h2') && !!$('.form-head .form-close') && css($('.form-head'), 'position') === 'sticky');
    check('la croix générale est remplacée par celle du formulaire', d.getElementById('modal').classList.contains('has-form') && css(d.getElementById('modal-close'), 'display') === 'none');
    check('barre d\'actions fixe en bas', css($('.form-actions'), 'position') === 'sticky' && css($('.form-actions'), 'bottom') === '0px');
    const btns = [...d.querySelectorAll('.form-actions button')];
    check('action secondaire à gauche, principale à droite', btns.length === 2 && btns[0].classList.contains('form-secondary') && btns[1].classList.contains('form-primary'));
    check('sections titrées : Moi, Mon avatar, Mon compagnon', ['Moi', 'Mon avatar', 'Mon compagnon'].every(t=> [...d.querySelectorAll('.form-section-title')].some(h=> h.textContent.includes(t))));
    check('l\'âge en gros boutons', d.querySelectorAll('.age-opt').length >= 8);
    const name = d.getElementById('np-name');
    check('clavier adapté au prénom', name.getAttribute('autocapitalize') === 'words' && name.getAttribute('enterkeyhint') === 'done' && name.getAttribute('autocorrect') === 'off');
    const primary = $('.form-primary');
    check('prénom vide : « Enregistrer » désactivé', primary.getAttribute('aria-disabled') === 'true');
    const n0 = ev('profiles.list.length');
    primary.click(); await wait(20);
    check('toucher « Enregistrer » désactivé : explication parlée, rien d\'ajouté', /prénom/i.test(lastSaid()) && ev('profiles.list.length') === n0);
    type(name, 'Zoé');
    check('prénom rempli : « Enregistrer » actif', primary.getAttribute('aria-disabled') !== 'true');
    key(name, 'Enter'); await wait(30);
    check('« Entrée » valide le formulaire', ev('profiles.list.length') === n0 + 1 && ev('profiles.list.some(p=> p.name === "Zoé")'));
    ev('closeModal()');
  }

  section('Modifications non enregistrées');
  {
    const id = ev('profiles.current'), name0 = ev('state.name');
    // sans changement : la croix ferme directement
    ev(`openPlayerSettings("${id}")`); await wait(20);
    $('.form-close').click(); await wait(20);
    check('sans changement, ✕ ferme directement', !modalOpen() && !layerOpen());
    // changement puis ✕ : la question
    ev(`openPlayerSettings("${id}")`); await wait(20);
    type(d.getElementById('pe-name'), 'Loulou');
    $('.form-close').click(); await wait(20);
    check('après un changement, ✕ demande « Garder tes changements ? »', layerOpen() && /Garder tes changements/.test(layer().textContent) && /Garder tes changements/.test(lastSaid()));
    check('la fenêtre reste ouverte derrière', modalOpen());
    layer().querySelector('[data-confirm="no"]').click(); await wait(20);
    check('« Ne pas garder » ferme sans enregistrer', !modalOpen() && !layerOpen() && ev('state.name') === name0);
    // changement puis Échap : « Garder » enregistre
    ev(`openPlayerSettings("${id}")`); await wait(20);
    type(d.getElementById('pe-name'), 'Loulou');
    key(d, 'Escape'); await wait(20);
    check('Échap aussi demande', layerOpen());
    layer().querySelector('[data-confirm="yes"]').click(); await wait(30);
    check('« Garder » enregistre puis ferme', ev('state.name') === 'Loulou' && !layerOpen());
    ev('closeModal()');
    // changement puis clic à côté, puis Retour
    ev(`openPlayerSettings("${id}")`); await wait(20);
    d.querySelector('.age-opt[data-age="7"]').click(); await wait(20);
    d.getElementById('overlay').dispatchEvent(new w.MouseEvent('click', { bubbles:true }));
    await wait(20);
    check('toucher à côté aussi demande', layerOpen());
    layer().querySelector('[data-confirm="no"]').click(); await wait(20);
    ev(`openPlayerSettings("${id}")`); await wait(20);
    d.querySelector('.age-opt[data-age="7"]').click(); await wait(20);
    $('.form-secondary').click(); await wait(20);
    check('« Retour » aussi demande', layerOpen());
    layer().querySelector('[data-confirm="no"]').click(); await wait(20);
    ev('closeModal()');
  }

  section('Réglages d\'un joueur');
  {
    ev(`openPlayerSettings(profiles.current)`); await wait(20);
    check('« Enregistrer » dans la barre fixe', !!$('.form-actions .form-primary') && /Enregistrer/.test($('.form-actions .form-primary').textContent));
    check('anniversaire : jour et mois', !!d.getElementById('pe-bday-d') && !!d.getElementById('pe-bday-m'));
    check('plus de « Recommencer » ni de « Supprimer » ici', !d.getElementById('pe-reset') && !d.getElementById('pe-del') && !/Recommencer|Supprimer/.test(d.getElementById('modal-body').textContent));
    ev('closeModal()');
  }

  section('Boutiques et sélecteurs : en-tête fixe');
  {
    ev('openGamePicker()'); await wait(20);
    check('le choix du jeu a un en-tête fixe', css($('#modal-body > .game-head'), 'position') === 'sticky');
    ev('closeModal()');
  }

  /* ================= Phase 3 : confirmation et actions dangereuses ================= */
  section('Fenêtre de confirmation du jeu');
  {
    let res = null;
    ev('window.__ask = askConfirm({ text:"Tout effacer ?", confirmLabel:"Effacer", typeWord:"EFFACER" })');
    ev('window.__ask.then(v=> window.__askRes = v)');
    await wait(10);
    check('une fenêtre du jeu, lue à voix haute', layerOpen() && lastSaid().includes('Tout effacer'));
    const ok = layer().querySelector('[data-confirm="yes"]'), input = layer().querySelector('input');
    check('bouton rouge, « Annuler » mis en avant', ok.classList.contains('danger') && layer().querySelector('[data-confirm="no"]').classList.contains('form-primary'));
    check('mot à taper : bouton désactivé tant qu\'il manque', !!input && ok.getAttribute('aria-disabled') === 'true');
    type(input, 'effacer');
    check('le mot tapé (sans tenir compte des majuscules) active le bouton', ok.getAttribute('aria-disabled') !== 'true');
    ok.click(); await wait(20);
    res = ev('window.__askRes');
    check('confirmer renvoie oui et ferme', res === true && !layerOpen());
    ev('askConfirm({ text:"Sûr ?" }).then(v=> window.__askRes2 = v)'); await wait(10);
    key(d, 'Escape'); await wait(20);
    check('Échap annule', ev('window.__askRes2') === false && !layerOpen());
  }

  section('Actions dangereuses derrière l\'accès parents');
  {
    check('le Sac n\'a plus de bouton de réglages (ils sont dans les Réglages)', !d.getElementById('reset-btn'));
    ev('state.coins = 77; save(); parentUnlockedUntil = 0; openParents()'); await wait(20);
    check('l\'espace parents demande la multiplication d\'abord', !!d.getElementById('gate-in') && !d.getElementById('ps-reset'));
    ev('parentUnlockedUntil = Date.now() + 60000; openParentSpace()'); await wait(20);
    const zone = $('.ps-danger');
    check('une zone sensible séparée, après l\'accès parents', !!zone && !!d.getElementById('ps-reset'));
    d.getElementById('ps-reset').click(); await wait(20);
    check('recommencer : double confirmation (taper RECOMMENCER)', layerOpen() && !!layer().querySelector('input') && /RECOMMENCER/.test(layer().textContent));
    type(layer().querySelector('input'), 'non');
    layer().querySelector('[data-confirm="yes"]').click(); await wait(20);
    check('mauvais mot : rien n\'est effacé', ev('state.coins') === 77 && layerOpen());
    type(layer().querySelector('input'), 'RECOMMENCER');
    layer().querySelector('[data-confirm="yes"]').click(); await wait(40);
    check('bon mot : la partie recommence', ev('state.coins') !== 77 && !layerOpen());
    ev('closeModal()');
    // supprimer un autre joueur
    ev('addProfile("Tom", "🦁", 7, "m", null); switchProfile(profiles.list[0].id, true)'); await wait(20);
    const tomId = ev('profiles.list.find(p=> p.name === "Tom").id');
    ev(`parentUnlockedUntil = Date.now() + 60000; openParentSpace("${tomId}")`); await wait(20);
    check('supprimer un joueur : dans la zone sensible', !!d.getElementById('ps-delete'));
    d.getElementById('ps-delete').click(); await wait(20);
    check('supprimer : taper le prénom du joueur', layerOpen() && /Tom/.test(layer().textContent) && !!layer().querySelector('input'));
    type(layer().querySelector('input'), 'Tom');
    layer().querySelector('[data-confirm="yes"]').click(); await wait(40);
    check('le joueur est supprimé', !ev('profiles.list.some(p=> p.name === "Tom")'));
    ev('closeModal()');
  }

  section('Plus de confirm() du navigateur');
  {
    const files = page.manifestScripts().filter(f=> f.endsWith('.js'));
    const offenders = files.filter(f=> /(^|[^.\w])confirm\s*\(/.test(fs.readFileSync(path.join(page.root, f), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '')));
    check('aucun appel à confirm() dans js/', offenders.length === 0);
    if(offenders.length) console.log('   ', offenders.join(', '));
    check('aucun confirm() appelé pendant ces parcours', !w.__confirmCalled);
  }

  check('aucune erreur JS', errs.length === 0);
  if(errs.length) console.log(errs.slice(0, 5));
  console.log(failed ? `\n${failed} test(s) en échec sur ${passed + failed}` : `\nTous les tests des formulaires passent (${passed})`);
  process.exit(failed ? 1 : 0);
})();
