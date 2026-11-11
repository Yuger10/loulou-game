// Les sons du jeu : moteur audio unique (bus principal, limiteur, écho doux,
// variation, anti-rafale, familles, réduction pendant la voix), ambiance
// « marimba doux », nouveaux sons (indice, nouvelle île, boîte), Simon exact,
// musique sur le bus, volume par profil. Le son est simulé par un faux
// AudioContext qui enregistre les nœuds (test/tools/fake-audio.js).
const { JSDOM } = require('jsdom');
const html = require('./tools/page.js').buildHtml();
const { FAKE_AUDIO_SRC } = require('./tools/fake-audio.js');

const SPEED = 0.1;
const spoken = [];
const dom = new JSDOM(html, {
  runScripts:'dangerously', pretendToBeVisual:true, url:'http://localhost/?saison=aucune',
  beforeParse(win){
    const st = win.setTimeout.bind(win), si = win.setInterval.bind(win);
    win.setTimeout = (fn, ms, ...a)=> st(fn, Math.round((ms || 0) * SPEED), ...a);
    win.setInterval = (fn, ms, ...a)=> si(fn, Math.max(1, Math.round((ms || 0) * SPEED)), ...a);
    win.SpeechSynthesisUtterance = function(text){ this.text = text; };
    win.speechSynthesis = { speaking:false, cancel(){}, getVoices:()=>[], speak(u){ spoken.push(u); } };
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
const near = (a, b, tol = .001)=> Math.abs(a - b) <= tol * Math.max(1, Math.abs(b));

// remet un moteur audio neuf et une horloge contrôlée. Le hasard n'est fixé que là où il le faut
// (un hasard constant ferait boucler les tirages « tous différents » du jeu)
function freshAudio(){
  ev(FAKE_AUDIO_SRC);
  // l'horloge de l'anti-rafale repart de zéro : on oublie aussi les sons déjà joués
  ev('audioCtx = null; soundBus = null; Object.keys(soundLastPlayed).forEach(k=> delete soundLastPlayed[k]); window.__t = 0; soundClock = ()=> window.__t');
}
const later = (ms = 100)=> ev(`window.__t += ${ms}`);
const oscs = ()=> ev('window.__audio.oscs.map(o=> ({ type:o.type, f:o.frequency.calls.length ? o.frequency.calls[0][1] : o.frequency.value, start:o.startAt }))');
// fréquences de départ des oscillateurs créés pendant un appel
function notesOf(code){
  const n0 = ev('window.__audio.oscs.length');
  ev(code);
  return oscs().slice(n0);
}
// fondamentales d'un motif de marimba : la première fréquence de chaque triplet (fondamentale, ×3,99, ×10)
const fundamentals = (list)=> list.filter((o, i, a)=> !a.some(p=> p !== o && p.start === o.start && near(o.f, p.f * 3.99, .02)) && !a.some(p=> p !== o && p.start === o.start && near(o.f, p.f * 10, .02)));

(async ()=>{
  await wait(100);
  d.getElementById('btn-splash-play').click();
  d.getElementById('name-input').value = 'Lou';
  d.querySelector('.avatar-opt').click();
  d.getElementById('btn-start').click();
  await wait(150);
  ev('closeModal(); state.sound = true; state.voice = true; state.music = false; save(); window.__rand = Math.random');

  /* ================= Phase 1 : moteur audio ================= */
  section('Bus principal');
  {
    freshAudio();
    ev('playSound("tap")');
    check('un seul contexte audio, créé au premier son', ev('window.__audio.contexts') === 1);
    ev('playSound("good")');
    check('toujours un seul contexte ensuite', ev('window.__audio.contexts') === 1);
    const chain = ev(`(()=>{ const b = soundBus; return {
      masterToDuck: b.master.outs.includes(b.duck), duckToComp: b.duck.outs.includes(b.comp),
      compToOut: b.comp.outs.includes(audioCtx.destination), dryToMaster: b.dry.outs.includes(b.master),
      wetToReverb: b.wet.outs.includes(b.reverb), reverbToMaster: b.reverb.outs.includes(b.master),
      musicToMaster: b.music.outs.includes(b.master), comp: b.comp.kind, reverbBuffer: !!b.reverb.buffer }; })()`);
    check('chemin du son : sec et écho → volume général → réduction voix → limiteur → haut-parleur',
      chain.dryToMaster && chain.wetToReverb && chain.reverbToMaster && chain.masterToDuck && chain.duckToComp && chain.compToOut);
    check('le limiteur est un compresseur', chain.comp === 'compressor');
    check('écho doux : une réponse impulsionnelle générée', chain.reverbBuffer);
    check('un bus pour la musique, branché sur le volume général', chain.musicToMaster);
    check('aucun son ne va directement au haut-parleur (tout passe par le bus)',
      ev('window.__audio.nodes.filter(n=> n.outs.includes(audioCtx.destination)).every(n=> n === soundBus.comp)'));
  }

  section('Silence et absence d\'audio');
  {
    freshAudio();
    ev('state.sound = false');
    check('en silence, playSound ne joue rien', ev('playSound("win")') === false && ev('window.__audio.oscs.length') === 0);
    ev('state.sound = true; delete window.AudioContext; delete window.webkitAudioContext; audioCtx = null; soundBus = null');
    let ok = true; try{ ev('playSound("win")'); }catch(e){ ok = false; }
    check('sans Web Audio, aucune erreur', ok && errs.length === 0);
  }

  section('Anti-rafale');
  {
    freshAudio();
    const played = ev('Array.from({ length:10 }, ()=> playSound("tap")).filter(Boolean).length');
    check('10 « tap » au même instant : un seul est joué', played === 1);
    later(30);
    check('30 ms plus tard : toujours bloqué', ev('playSound("tap")') === false);
    later(40);
    check('70 ms plus tard : rejoué', ev('playSound("tap")') === true);
    check('un autre son n\'est pas bloqué par le « tap »', ev('playSound("good")') === true);
  }

  section('Variation naturelle');
  {
    freshAudio();
    ev('Math.random = ()=> .5');
    ev('Math.random = ()=> 1'); const hi = fundamentals(notesOf('playSound("pop")'))[0].f; later();
    ev('Math.random = ()=> 0'); const lo = fundamentals(notesOf('playSound("pop")'))[0].f; later();
    ev('Math.random = ()=> .5'); const mid = fundamentals(notesOf('playSound("pop")'))[0].f; later();
    check('sans hasard, la note exacte (la5 = 880 Hz)', near(mid, 880));
    check('la hauteur varie d\'environ ±1,2 % au plus', hi > mid && lo < mid && hi / mid <= 1.0121 && mid / lo <= 1 / (1 - .0121));
  }

  section('Familles de sons');
  check('touchers discrets, fêtes plus présentes', ev('SOUND_FAMILY.tap < SOUND_FAMILY.good && SOUND_FAMILY.good <= SOUND_FAMILY.win && SOUND_FAMILY.tick < SOUND_FAMILY.good'));
  check('chaque son de la palette a sa famille', ev('Object.keys(SOUND_PALETTE).every(k=> typeof SOUND_FAMILY[k] === "number")'));

  /* ================= Phase 2 : palette « marimba doux » ================= */
  section('Palette « marimba doux »');
  {
    freshAudio();
    ev('Math.random = ()=> .5');   // hasard neutre : les notes exactes
    const kinds = ev('Object.keys(SOUND_PALETTE)');
    check('les 9 sons existants et les 3 nouveaux', ['tap','good','wrong','win','coin','pop','tick','pouic','sparkle','hint','island','box'].every(k=> kinds.includes(k)));
    const all = [];
    kinds.forEach(k=>{ all.push(...notesOf(`playSound("${k}")`)); later(); });
    check('plus aucune onde carrée : seulement sinus et triangle', all.length > 0 && all.every(o=> o.type === 'sine' || o.type === 'triangle'));
    const perNote = ev('(()=>{ const n0 = window.__audio.oscs.length; marimbaNote(523, 0, .2, .4); return window.__audio.oscs.length - n0; })()');
    check('une note de marimba : 3 oscillateurs au maximum', perNote <= 3);
    check('chaque oscillateur est arrêté après son son', ev('window.__audio.oscs.every(o=> o.stopAt !== null && o.stopAt > o.startAt)'));
    check('toutes les notes de base sont dans la gamme pentatonique (do, ré, mi, sol, la)',
      ev('Object.values(SOUND_NOTES).every(f=> [0,2,4,7,9].includes(((Math.round(12 * Math.log2(f / 261.63)) % 12) + 12) % 12))'));
    const good = fundamentals(notesOf('playSound("good")')).map(o=> Math.round(o.f)); later();
    check('« bonne réponse » : mi puis do aigu, qui montent', good.length === 2 && near(good[0], 659, .01) && near(good[1], 1047, .01));
    const wrong = fundamentals(notesOf('playSound("wrong")')).map(o=> Math.round(o.f)); later();
    check('« oups » : deux notes douces qui descendent (ré, la)', wrong.length === 2 && near(wrong[0], 587, .01) && near(wrong[1], 440, .01));
    const win = fundamentals(notesOf('playSound("win")')); later();
    check('« victoire » : un arpège qui monte, puis un accord', win.length >= 6 && win.slice(0, 5).every((o, i, a)=> i === 0 || o.f > a[i - 1].f));
    const tap = fundamentals(notesOf('playSound("tap")')); later();
    check('« toucher » : une seule note (sol)', tap.length === 1 && near(tap[0].f, 784, .01));
  }

  section('Simon : notes exactes');
  {
    freshAudio();
    ev('Math.random = ()=> 1');
    const a = fundamentals(notesOf('playNote(330, .3)'))[0].f;
    ev('Math.random = ()=> 0');
    const b = fundamentals(notesOf('playNote(330, .3)'))[0].f;
    check('playNote garde la hauteur exacte, sans variation', a === 330 && b === 330);
    check('playNote n\'est pas bloquée par l\'anti-rafale (notes rapprochées)', notesOf('playNote(392, .2); playNote(392, .2)').length >= 2);
    check('le Simon joue en marimba (plus de tone)', ev('typeof tone') === 'undefined');
    ev('Math.random = window.__rand');
  }

  /* ================= Phase 3 : nouveaux moments, musique, volume ================= */
  section('Réduction pendant la voix');
  {
    freshAudio();
    ev('playSound("tap")');
    ev('state.voice = true; speak("Bonjour")');
    const u = spoken[spoken.length - 1];
    check('la voix prévient le bus quand elle commence et finit', typeof u.onstart === 'function' && typeof u.onend === 'function');
    u.onstart();
    check('pendant la voix, le bus principal baisse', ev('soundBus.duck.gain.value') < .6);
    u.onend();
    check('après la voix, il remonte', near(ev('soundBus.duck.gain.value'), 1));
    check('la musique n\'a plus sa propre réduction', ev('typeof MUSIC_DUCK') === 'undefined');
  }

  section('Musique sur le bus');
  {
    freshAudio();
    ev('state.music = true; state.sound = true; save(); updateMusic()');
    check('la musique démarre', ev('music.on') === true);
    check('elle passe par le bus de la musique (plus directement au haut-parleur)', ev('music.master.outs.includes(soundBus.music) && !music.master.outs.includes(audioCtx.destination)'));
    ev('state.music = false; save(); updateMusic()');
  }

  section('Volume général par profil');
  {
    freshAudio();
    check('partie neuve : volume à 80 %', ev('freshState().soundVolume') === 80);
    ev('state.soundVolume = 40; playSound("tap")');
    check('le volume règle le bus principal', near(ev('soundBus.master.gain.value'), .4 * ev('SOUND_MASTER_LEVEL'), .01));
    const migrated = ev('(()=>{ const s = JSON.parse(JSON.stringify(state)); delete s.soundVolume; s.v = 5; return migrate(s).soundVolume; })()');
    check('une partie de la version 5 reçoit 80 %', migrated === 80 && ev('SAVE_VERSION') >= 6);
    ev('state.soundVolume = 80; save(); parentUnlockedUntil = Date.now() + 60000; openParentSpace()');
    const slider = d.querySelector('#ps-volume');
    check('réglage du volume dans l\'espace parents', !!slider && slider.value === '80');
    if(slider){ slider.value = '55'; slider.dispatchEvent(new w.Event('input', { bubbles:true })); }
    check('le curseur change le volume du joueur', ev('state.soundVolume') === 55);
    ev('closeModal(); state.soundVolume = 80; save()');
  }

  section('Nouveaux moments');
  {
    freshAudio();
    ev('window.__played = []; const __origPlay = playSound; playSound = (k)=>{ window.__played.push(k); return __origPlay(k); }');
    // 💡 : un indice demandé pendant un mini-jeu
    ev('playGame("count")'); await wait(50);
    const hintBtn = d.querySelector('.hint-btn, #hint-btn, [data-hint]');
    if(hintBtn) hintBtn.click(); else ev('useHint()');
    check('💡 indice : le son « hint »', ev('window.__played').includes('hint'));
    ev('closeModal()');
    // nouvelle île
    ev('window.__played = []; state.visited = ["lagon"]; state.missions = 15; save(); checkNewIsland()'); await wait(50);
    check('nouvelle île : le son « island »', ev('window.__played').includes('island'));
    ev('closeModal(); state.visited = Object.keys(WORLDS); save()');
    // ouverture d'une boîte surprise
    ev('window.__played = []; state.squishies.boxes = ["capy"]; save(); openSquishyRoom("collection")'); await wait(50);
    const open = d.getElementById('sq-open'); if(open) open.click();
    await wait(200);
    check('boîte surprise : le son « box » à l\'ouverture', ev('window.__played').includes('box'));
    ev('closeModal()');
  }

  check('aucune erreur JS', errs.length === 0);
  if(errs.length) console.log(errs.slice(0, 5));
  console.log(failed ? `\n${failed} test(s) en échec sur ${passed + failed}` : `\nTous les tests des sons passent (${passed})`);
  process.exit(failed ? 1 : 0);
})();
