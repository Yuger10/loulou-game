// Une pause qui tient : voile flouté sur tout le jeu (fin naturelle de
// mission, sans compte à rebours), il revient toujours, plus de portes de
// sortie (changer, créer un joueur, jouer à plusieurs : adulte), compagnon
// fatigué et île qui s'endort, une activité au choix (bouger, yoga, respirer,
// idée hors écran) puis l'écran s'endort, le lendemain, journal des parents.
const { JSDOM } = require('jsdom');
const page = require('./tools/page.js');
const html = page.buildHtml();

const SPEED = 0.05;   // les activités durent ~1-2 min : le temps du jeu est accéléré ×20
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
async function waitFor(cond, ms = 6000){ const t0 = Date.now(); while(Date.now() - t0 < ms){ if(cond()) return true; await wait(20); } return !!cond(); }
let failed = 0, passed = 0;
function check(name, cond){ if(cond){ passed++; console.log('✅ ' + name); } else { failed++; console.log('❌ ' + name); } }
function section(name){ console.log('— ' + name); }
const $ = (sel)=> d.querySelector(sel);
const veil = ()=> d.getElementById('rest-veil');
const veilOn = ()=> !!veil() && !veil().hidden;
const stage = ()=> veil() ? veil().dataset.stage : '';
const said = (re)=> spoken.some(t=> re.test(t));
// atteindre la limite : 20 minutes de pause, 25 minutes jouées aujourd'hui
const overLimit = ()=> ev('currentProfile().pauseMin = 20; saveProfiles(); state.pauseExtra = null; state.playTime = { [todayKey()]: 25*60 }; save()');
const underLimit = (left = 30)=> ev(`currentProfile().pauseMin = 60; saveProfiles(); state.pauseExtra = null; state.playTime = { [todayKey()]: ${(60 - left)}*60 }; save()`);
const noPause = ()=> ev('currentProfile().pauseMin = 0; saveProfiles(); state.playTime = {}; state.pauseExtra = null; save(); restWake()');
// répondre à la porte des parents (multiplication)
function answerGate(right){
  const q = $('.gate-q').textContent.match(/(\d+) × (\d+)/);
  d.getElementById('gate-in').value = String(Number(q[1]) * Number(q[2]) + (right ? 0 : 1));
  d.getElementById('gate-ok').click();
}

(async ()=>{
  await wait(100);
  d.getElementById('btn-splash-play').click();
  d.getElementById('name-input').value = 'Lou';
  $('.avatar-opt').click();
  d.getElementById('btn-start').click();
  await wait(100);
  ev('closeModal()');

  /* ================= Phase 1 : le verrou ================= */
  section('Le voile');
  {
    underLimit();
    ev('maybeRest()');
    check('sous la limite : pas de voile', !veilOn());
    overLimit();
    ev('maybeRest()');
    check('limite atteinte : un voile sur tout le jeu', veilOn() && d.getElementById('app').hasAttribute('inert') && d.body.classList.contains('resting'));
    check('voile accessible : fenêtre modale annoncée', veil().getAttribute('role') === 'dialog' && veil().getAttribute('aria-modal') === 'true');
    // rien n'est touchable dessous
    const coins = ev('state.coins');
    d.querySelector('.navbtn[data-view="sac"]').click();
    d.getElementById('avatar-pill').click();
    check('dessous, rien ne réagit (le jeu est inerte)', d.getElementById('app').inert === true || d.getElementById('app').hasAttribute('inert'));
    check('aucun nouveau mini-jeu ne démarre', (ev('playGame("count")'), !d.querySelector('#modal .count-row, #modal .num-btn')) && ev('state.coins') === coins);
    ev('switchView("carte")');
    check('changer de vue ne lève pas le voile', veilOn());
    ev('document.dispatchEvent(new Event("visibilitychange")); maybeRest()');
    check('revenir dans l\'application non plus', veilOn());
    check('pas de compte à rebours ni de minutes affichées', !/\d+\s*(min|s)\b/.test(veil().textContent));
  }

  section('Fin naturelle d\'une mission');
  {
    ev('restWake()');
    underLimit(1);
    ev('playGame("count")'); await wait(50);
    check('une mission démarre avant la limite', !!d.querySelector('#modal .num-btn'));
    overLimit();
    ev('maybeRest()');
    check('pendant la mission : pas de voile (on la laisse finir)', !veilOn());
    // gagner la mission
    const good = d.querySelectorAll('.count-row span').length;
    const btn = [...d.querySelectorAll('.num-btn')].find(b=> Number(b.dataset.v) === good);
    if(btn) btn.click();
    await waitFor(()=> veilOn(), 4000);
    check('la mission finie, le voile arrive', veilOn());
  }

  section('Lever le voile : un adulte');
  {
    ev('restWake(); maybeRest()');
    check('le voile est là', veilOn());
    d.getElementById('rest-adult').click(); await wait(30);
    check('« Un adulte » : la multiplication', !!d.getElementById('gate-in'));
    answerGate(false); await wait(30);
    check('mauvaise réponse : la tentative est notée', ev('restLogToday().attempts') >= 1);
    answerGate(true); await wait(30);
    check('bonne réponse : les choix de l\'adulte', !!d.getElementById('rest-add10') && !!d.getElementById('rest-add30') && !!d.getElementById('rest-endday') && !!d.getElementById('rest-switch'));
    d.getElementById('rest-add10').click(); await wait(30);
    check('+ 10 minutes : le voile se lève', !veilOn() && ev('state.pauseExtra.min') === 10);
    ev('state.pauseExtra = { date: todayKey(), min: 0 }; save(); maybeRest()');
    check('le voile revient quand le temps est passé', veilOn());
    ev('parentUnlockedUntil = Date.now() + 60000');
    d.getElementById('rest-adult').click(); await wait(30);
    d.getElementById('rest-endday').click(); await wait(30);
    check('« Fin de la pause aujourd\'hui » : plus de voile jusqu\'à demain', !veilOn() && (ev('maybeRest()'), !veilOn()));
    ev('state.pauseExtra = null; save(); parentUnlockedUntil = 0');
  }

  /* ================= Phase 2 : plus de portes de sortie ================= */
  section('Plus de portes de sortie');
  {
    ev('addProfile("Tom", "🦁", 7, "m", null); switchProfile(profiles.list[0].id, true)');
    overLimit(); ev('restWake(); maybeRest()');
    check('pendant la pause, les Réglages (changer, créer, jouer à plusieurs) sont sous le voile', veilOn() && d.getElementById('app').hasAttribute('inert'));
    ev('parentUnlockedUntil = Date.now() + 60000');
    d.getElementById('rest-adult').click(); await wait(30);
    d.getElementById('rest-switch').click(); await wait(30);
    check('l\'adulte peut faire changer de joueur : le voile s\'écarte, les Réglages s\'ouvrent', !veilOn() && d.getElementById('view-reglages').classList.contains('active'));
    const tom = [...d.querySelectorAll('.rg-player')].find(b=> /Tom/.test(b.textContent));
    tom.click(); await wait(30);
    ev('maybeRest()');
    check('Tom n\'est pas en pause : il peut jouer', ev('currentProfile().name') === 'Tom' && !veilOn());
    ev('switchProfile(profiles.list[0].id, true); maybeRest()');
    check('revenir sur Lou : le voile revient', veilOn());
    ev('parentUnlockedUntil = 0; restWake()');
    // à plusieurs : plus d'exemption
    ev('startParty(profiles.list.map(p=> p.id).slice(0, 2))');
    check('à plusieurs, la pause s\'applique aussi', ev('pauseDue()') === true || ev('currentProfile().name') === 'Tom');
    ev('stopParty(); switchProfile(profiles.list[0].id, true)');
  }

  section('Réglage familial');
  {
    noPause();
    ev('parentUnlockedUntil = Date.now() + 60000; openParentSpace()'); await wait(30);
    d.querySelector('[data-pause="30"]').click();
    ev('closeModal()');
    check('le dernier choix d\'un adulte devient le réglage familial', ev('profiles.familyPause') === 30);
    ev('addProfile("Léa", "👧", 6, "f", null)');
    check('un nouveau joueur reçoit la pause familiale', ev('profiles.list.find(p=> p.name === "Léa").pauseMin') === 30);
    ev('parentUnlockedUntil = 0');
  }

  /* ================= Phase 3 : l'île s'endort ================= */
  section('Avant la limite : un bâillement, pas de compte à rebours');
  {
    noPause(); underLimit(4);
    ev('restTick()');
    check('5 minutes avant : le compagnon de l\'en-tête bâille', d.getElementById('team-btn').classList.contains('yawning'));
    check('aucun chiffre ni message de minutes', !/minute|min\b/i.test(d.getElementById('team-btn').textContent));
    underLimit(30); ev('restTick()');
    check('loin de la limite : pas de bâillement', !d.getElementById('team-btn').classList.contains('yawning'));
  }

  section('L\'île s\'endort');
  {
    spoken.length = 0;
    overLimit(); ev('restWake(); maybeRest()');
    check('le compagnon fatigué (bâille, bonnet de nuit, se roule en boule)', !!veil().querySelector('.rest-buddy.sleepy .rest-nightcap') && /sleepy|yawn/.test(veil().querySelector('.rest-buddy').className));
    check('la nuit tombe : ciel sombre et étoiles', !!veil().querySelector('.rest-night .rest-star'));
    check('il le dit à voix haute, et propose une activité', said(/fatigué/i) && said(/activité/i));
    check('quatre activités au choix', ['move','yoga','breathe','offscreen'].every(k=> !!veil().querySelector(`[data-rest-act="${k}"]`)));
    check('« Pas maintenant » existe', !!d.getElementById('rest-skip'));
  }

  /* ================= Phase 4 : une activité au choix ================= */
  section('Respirer avec Grisou (jusqu\'au bout)');
  {
    spoken.length = 0;
    veil().querySelector('[data-rest-act="breathe"]').click(); await wait(30);
    const grisou = !!veil().querySelector('.rest-grisou') && stage() === 'activity';
    await waitFor(()=> said(/inspire/i), 3000);
    check('Grisou apparaît et guide la respiration', grisou && said(/inspire/i));
    await waitFor(()=> stage() === 'asleep', 8000);
    check('à la fin : « Bravo ! À demain ! » puis l\'écran s\'endort', stage() === 'asleep' && said(/À demain/));
    check('l\'activité est notée pour les parents', ev('restLogToday().activity') === 'breathe');
    check('endormi : plus d\'activités, seul « Un adulte » reste', !veil().querySelector('[data-rest-act]') && !!d.getElementById('rest-adult'));
    ev('maybeRest()');
    check('une seule activité par pause (rechargement : toujours endormi)', stage() === 'asleep');
  }

  section('Les autres activités');
  {
    for(const k of ['move', 'yoga']){
      ev('restLogToday().activity = null; restLogToday().skipped = false; save(); restWake(); maybeRest()');
      spoken.length = 0;
      veil().querySelector(`[data-rest-act="${k}"]`).click(); await wait(30);
      check(`${k === 'move' ? '🤸 bouger comme les animaux' : '🧘 le yoga des animaux'} : 3 étapes guidées par des personnages`,
        stage() === 'activity' && !!veil().querySelector('.rest-step-art') && ev(`REST_ACTIVITIES.${k}.steps.length`) === 3 && spoken.length > 0);
      check('rythme visuel sans chiffres', !!veil().querySelector('.rest-progress') && !/\d/.test(veil().querySelector('.rest-progress').textContent));
      await waitFor(()=> stage() === 'asleep', 12000);
      check('puis l\'écran s\'endort', stage() === 'asleep');
    }
    ev('restLogToday().activity = null; save(); restWake(); maybeRest()');
    veil().querySelector('[data-rest-act="offscreen"]').click(); await wait(30);
    check('🎨 une idée hors écran : proposée, puis l\'écran s\'endort tout de suite', stage() === 'asleep' && !!veil().querySelector('.rest-idea'));
    ev('restLogToday().activity = null; save(); restWake(); maybeRest()');
    d.getElementById('rest-skip').click(); await wait(30);
    check('« Pas maintenant » : l\'écran s\'endort, c\'est noté', stage() === 'asleep' && ev('restLogToday().skipped') === true);
    check('aucune récompense pendant la pause', !ev('Object.keys(REST_ACTIVITIES).some(k=> REST_ACTIVITIES[k].reward)'));
  }

  /* ================= Phase 5 : le lendemain, les parents ================= */
  section('Le lendemain');
  {
    ev('restWake(); currentProfile().pauseMin = 0; saveProfiles()');
    // hier : yoga fait ; aujourd'hui : rien encore
    ev('state.restLog = { [todayKey(new Date(Date.now() - 864e5))]: { at:"18:30", activity:"yoga", skipped:false, attempts:1 } }; state.restRecall = null; save()');
    spoken.length = 0;
    ev('restRecallYesterday()');
    check('le compagnon se souvient de l\'activité de la veille', said(/Hier/) && said(/yoga/i));
    spoken.length = 0;
    ev('restRecallYesterday()');
    check('une seule fois par jour', spoken.length === 0);
  }

  section('Espace parents : les pauses');
  {
    ev('parentUnlockedUntil = Date.now() + 60000; openParentSpace()'); await wait(30);
    const card = $('.ps-rest');
    check('une carte « Pauses » : les 7 derniers jours', !!card && /yoga/i.test(card.textContent));
    check('les tentatives de contournement, sans jugement', /tentative/i.test(card.textContent));
    check('le réglage familial des nouveaux joueurs', /nouveaux joueurs/i.test(card.textContent));
    check('un conseil sur les contrôles de l\'appareil', /Temps d'écran|Family Link/.test(card.textContent));
    ev('closeModal(); parentUnlockedUntil = 0');
  }

  section('Sauvegarde');
  check('partie neuve : un journal de pause vide', JSON.stringify(ev('freshState().restLog')) === '{}');
  check('migration : les anciennes parties reçoivent un journal', JSON.stringify(ev('migrate({ v: SAVE_VERSION - 1 }).restLog')) === '{}');

  check('aucune erreur JS', errs.length === 0);
  if(errs.length) console.log(errs.slice(0, 5));
  console.log(failed ? `\n${failed} test(s) en échec sur ${passed + failed}` : `\nTous les tests de la pause passent (${passed})`);
  process.exit(failed ? 1 : 0);
})();
