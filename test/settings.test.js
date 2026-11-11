// Barre de navigation et écran Réglages : 4 boutons (pas de 5e), bouton Île
// nommé, une seule règle de taille selon le support, Réglages ouverts en
// touchant l'avatar et le prénom ; sections Son, Moi, Joueurs, Parents (protégé).
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
const view = (name)=> d.getElementById('view-' + name);
const islandBtn = ()=> $('.navbtn[data-view="ile"]');
const sw = (k)=> $(`[role="switch"][data-sound="${k}"]`);

(async ()=>{
  await wait(100);
  d.getElementById('btn-splash-play').click();
  d.getElementById('name-input').value = 'Lou';
  $('.avatar-opt').click();
  d.getElementById('btn-start').click();
  await wait(150);
  ev('closeModal(); state.sound = true; state.voice = true; state.music = false; save()');

  /* ================= Barre du bas ================= */
  section('Barre du bas');
  {
    const btns = [...d.querySelectorAll('nav.bottomnav .navbtn')];
    check('4 boutons, pas de bouton Réglages', btns.length === 4 && !$('.navbtn[data-view="reglages"]'));
    check('la pastille du Sac est toujours là', !!$('.navbtn[data-view="sac"] #sac-badge'));
    ev('switchView("carte")');
    check('bouton Île : le nom de l\'île courante (Lagon), et son icône dessinée', /Lagon/.test(islandBtn().textContent) && !!islandBtn().querySelector('.icon svg'));
    ev('state.missions = 400; save(); setWorld("foret", true); renderLagon()'); await wait(20);
    check('changer d\'île met à jour le bouton (Forêt)', /Forêt/.test(islandBtn().textContent) && !/Lagon/.test(islandBtn().textContent) && islandBtn().getAttribute('aria-label') === 'Forêt');
    islandBtn().click(); await wait(20);
    check('il mène toujours à l\'île courante', view('ile').classList.contains('active') && ev('currentWorld') === 'foret');
    ev('setWorld("lagon", true); renderLagon()');
  }

  section('Une seule règle de taille');
  {
    const navCss = page.read('js/shared/ui/nav.css');
    const others = page.manifestCss().filter(f=> f !== 'js/shared/ui/nav.css');
    // une règle « hauteur » de la barre ailleurs que dans nav.css ?
    const offenders = [];
    for(const f of others){
      const css = page.read(f).replace(/\/\*[\s\S]*?\*\//g, '');
      for(const m of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)){
        // seulement les règles qui visent la barre ou ses boutons eux-mêmes (pas la pastille ni l'icône)
        const targetsBar = m[1].split(',').some(sel=> /(nav\.bottomnav( button)?|\.navbtn)(:[\w-]+|\.[\w-]+)*\s*$/.test(sel.trim()));
        if(targetsBar && /(^|;|\s)(min-height|height)\s*:/.test(m[2])) offenders.push(`${f} : ${m[1].trim()}`);
      }
    }
    check('les hauteurs de la barre sont dans une seule feuille (nav.css)', offenders.length === 0);
    if(offenders.length) console.log('   ', offenders.join('\n    '));
    check('repères : 64 px (portrait), 48 px (paysage), 72 px (tablette), barre centrée ~640 px (ordinateur)',
      /min-height:\s*64px/.test(navCss) && /min-height:\s*48px/.test(navCss) && /min-height:\s*72px/.test(navCss) && /max-width:\s*640px/.test(navCss));
    check('jamais moins de 48 px', [...navCss.matchAll(/min-height:\s*(\d+)px/g)].every(m=> Number(m[1]) >= 48));
    check('paysage : hauteur ≤ 500 px ; tablette : largeur ≥ 700 px ; ordinateur : ≥ 1024 px', /max-height:\s*500px/.test(navCss) && /min-width:\s*700px/.test(navCss) && /min-width:\s*1024px/.test(navCss));
  }

  /* ================= Accès par l'avatar et le prénom ================= */
  section('Accès aux Réglages');
  {
    const pill = d.getElementById('avatar-pill');
    check('un petit ⚙️ accolé au prénom', !!pill.querySelector('.pill-gear'));
    check('libellé « Réglages de Lou »', pill.getAttribute('aria-label') === 'Réglages de Lou');
    pill.click(); await wait(20);
    check('toucher le prénom ouvre la vue Réglages', view('reglages') && view('reglages').classList.contains('active'));
    check('aucun bouton de la barre n\'est actif', !$('.navbtn.active'));
    check('« Changer de joueur » visible dès l\'ouverture', !!d.getElementById('rg-switch'));
    check('le Sac n\'a plus de bouton de réglages', !d.getElementById('reset-btn'));
  }

  section('🔊 Son');
  {
    ev('switchView("reglages")'); await wait(10);
    check('trois interrupteurs : Bruitages, Voix, Musique', !!sw('sound') && !!sw('voice') && !!sw('music'));
    check('ils reflètent l\'état', sw('sound').getAttribute('aria-checked') === 'true' && sw('voice').getAttribute('aria-checked') === 'true' && sw('music').getAttribute('aria-checked') === 'false');
    sw('voice').click(); await wait(10);
    check('couper la voix', ev('state.voice') === false && sw('voice').getAttribute('aria-checked') === 'false');
    check('le bouton 🔊 du haut suit', ev('soundModeLabel()') === '🔊 Sons seulement');
    sw('music').click(); await wait(10);
    check('allumer la musique', ev('state.music') === true);
    sw('sound').click(); await wait(10);
    check('couper les bruitages coupe tout', ev('state.sound') === false && ev('soundModeLabel()') === '🔇 Silence' && sw('voice').getAttribute('aria-disabled') === 'true');
    sw('sound').click(); await wait(10);
    check('rallumer les bruitages rend la voix', ev('state.sound') === true && ev('state.voice') === true);
    check('le volume général est ici aussi', !!d.getElementById('rg-volume'));
    ev('state.music = false; save(); updateMusic()');
  }

  section('🙂 Moi');
  {
    ev('switchView("reglages")'); await wait(10);
    check('le profil du joueur courant', /Lou/.test($('.rg-me').textContent));
    d.getElementById('rg-edit').click(); await wait(20);
    check('« Modifier » ouvre le formulaire du profil (v59)', !!$('#modal .form-sheet') && !!d.getElementById('pe-name'));
    ev('closeModal()');
    check('« Mon compagnon / Mon équipe » accessible', !!$('#view-reglages [data-team-slot]'));
  }

  section('👥 Joueurs');
  {
    ev('addProfile("Tom", "🦁", 7, "m", null); switchProfile(profiles.list[0].id, true); switchView("reglages")'); await wait(20);
    const rows = [...d.querySelectorAll('.rg-player')];
    check('un bouton par joueur', rows.length === ev('profiles.list.length'));
    const tom = rows.find(r=> /Tom/.test(r.textContent));
    tom.click(); await wait(20);
    check('toucher un joueur le choisit', ev('currentProfile().name') === 'Tom');
    check('le prénom en haut suit (Réglages de Tom)', d.getElementById('avatar-pill').getAttribute('aria-label') === 'Réglages de Tom');
    d.getElementById('rg-add').click(); await wait(20);
    check('« Ajouter un joueur » ouvre le formulaire', !!d.getElementById('np-name'));
    ev('closeModal(); switchView("reglages")');
    d.getElementById('rg-modes').click(); await wait(20);
    check('« Jouer à plusieurs » ouvre les modes (solo, chacun son tour, course)', !!d.getElementById('btn-turns') && !!d.getElementById('btn-race'));
    check('le panneau des joueurs n\'a plus de doublons (sauvegarde, parents)', !d.getElementById('btn-backup') && !d.getElementById('btn-parents'));
    ev('closeModal(); switchProfile(profiles.list[0].id, true)');
  }

  section('🔒 Parents');
  {
    ev('parentUnlockedUntil = 0; switchView("reglages")'); await wait(10);
    d.getElementById('rg-parents').click(); await wait(20);
    check('l\'espace parents demande la multiplication', !!d.getElementById('gate-in'));
    ev('closeModal(); parentUnlockedUntil = Date.now() + 60000');
    d.getElementById('rg-parents').click(); await wait(20);
    check('déverrouillé : l\'espace parents (avec la zone sensible)', !!$('.ps-tabs') && !!d.getElementById('ps-reset'));
    ev('closeModal(); parentUnlockedUntil = 0');
    d.getElementById('rg-backup').click(); await wait(20);
    check('la sauvegarde est aussi protégée', !!d.getElementById('gate-in'));
    ev('closeModal()');
  }

  check('aucune erreur JS', errs.length === 0);
  if(errs.length) console.log(errs.slice(0, 5));
  console.log(failed ? `\n${failed} test(s) en échec sur ${passed + failed}` : `\nTous les tests des Réglages passent (${passed})`);
  process.exit(failed ? 1 : 0);
})();
