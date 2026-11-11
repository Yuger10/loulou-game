/* ---------- Musique d'ambiance douce (Phase 4) ----------
   Une petite musique inventée en direct (Web Audio, aucun fichier) :
   - chaque île a son ambiance : gamme, tempo et instrument (marimba au
     Lagon, flûte en Forêt, clochettes en Montagne, harpe au Château…) ;
   - une suite de 4 accords tenus très doucement, une basse, et une
     mélodie tirée au hasard dans une gamme pentatonique (jamais de fausse
     note) : elle ne se répète jamais tout à fait ;
   - elle baisse quand la voix parle (avec tous les sons, par le bus principal), s'arrête quand le jeu
     passe en arrière-plan et reprend au retour ;
   - à Noël, les clochettes ; à Halloween, une gamme mineure.
   Coupée par défaut. Le bouton son passe par 🎵 (musique + sons + voix) ;
   l'espace parents a aussi un interrupteur. Réglage : state.music. */
import { state } from '../../entities/game-state/index.js';
import { currentSeason } from '../../entities/season/index.js';
import { currentWorld } from '../../entities/world/index.js';
import { audioCtx, ensureAudioCtx, musicBusNode } from '../../shared/ui/index.js';

// root : note MIDI de départ ; scale : gamme (demi-tons) ; prog : accords (degrés en demi-tons)
const MUSIC_THEMES = {
  lagon:    { root:60, scale:[0,2,4,7,9],  bpm:84, lead:'marimba', prog:[0,9,5,7] },
  foret:    { root:55, scale:[0,2,4,7,9],  bpm:76, lead:'flute',   prog:[0,5,9,7] },
  montagne: { root:62, scale:[0,2,4,7,9],  bpm:70, lead:'bell',    prog:[0,7,9,5] },
  chateau:  { root:57, scale:[0,2,3,7,9],  bpm:72, lead:'harp',    prog:[0,8,5,7], minor:true },
  jungle:   { root:53, scale:[0,2,4,7,9],  bpm:96, lead:'pluck',   prog:[0,5,7,5], shaker:true },
  cite:     { root:64, scale:[0,2,4,7,11], bpm:80, lead:'bell',    prog:[0,9,5,7], tick:true },
  volcan:   { root:50, scale:[0,3,5,7,10], bpm:74, lead:'pluck',   prog:[0,8,5,7], minor:true },
  squishy:  { root:67, scale:[0,2,4,7,9],  bpm:98, lead:'bubble',  prog:[0,5,9,7] },
  // saison 2 : une harpe aérienne, et les petits « tchac » des machines de la Fabrique
  boites:   { root:65, scale:[0,2,4,7,9],  bpm:88, lead:'harp',    prog:[0,5,9,7], tick:true },
  // une boîte à musique (célesta), très douce
  jouets:   { root:72, scale:[0,2,4,7,9],  bpm:80, lead:'celesta', prog:[0,9,5,7] },
  // une petite valse sucrée, en pizzicato
  bonbons:  { root:67, scale:[0,2,4,7,9],  bpm:92, lead:'pluck',   prog:[0,5,7,0] },
  // un thème joyeux au marimba (le timbre du moteur de la v56)
  musique:  { root:62, scale:[0,2,4,7,9],  bpm:100, lead:'marimba', prog:[0,5,9,7], tick:true },
};
const MUSIC_VOLUME = 1.0;       // crête ≈ 0,11, bien sous les bruitages ; passe ensuite par le volume général du bus

let music = { on:false, timer:null, nextTime:0, step:0, master:null, filter:null, last:7 };

function musicTheme(){
  const th = Object.assign({}, MUSIC_THEMES[currentWorld] || MUSIC_THEMES.lagon);
  const season = currentSeason();
  if(season === 'noel') th.lead = 'bell';
  if(season === 'halloween'){ th.scale = [0,3,5,7,10]; th.minor = true; th.prog = [0,8,5,7]; }
  return th;
}
function midiHz(m){ return 440 * Math.pow(2, (m - 69) / 12); }
function musicWanted(){
  if(!state.music || !state.sound) return false;
  if(typeof document!=='undefined' && document.visibilityState === 'hidden') return false;
  const sp = typeof document!=='undefined' && document.getElementById('splash');
  return !(sp && sp.classList.contains('show'));     // après « Jouer » (le geste qui débloque le son sur iPhone)
}

/* ---- les instruments ---- */
function mNote(freq, t, dur, kind, vol){
  const ctx = audioCtx, o = ctx.createOscillator(), g = ctx.createGain();
  let attack = .01, type = 'sine';
  if(kind === 'marimba'){ type = 'sine'; dur = Math.min(dur, .45); }
  else if(kind === 'flute'){ type = 'sine'; attack = .07; }
  else if(kind === 'bell'){ type = 'sine'; dur = Math.max(dur, 1.1); }
  else if(kind === 'celesta'){ type = 'sine'; dur = Math.min(Math.max(dur, .6), .9); }
  else if(kind === 'harp'){ type = 'triangle'; dur = Math.max(dur, .8); }
  else if(kind === 'pluck'){ type = 'triangle'; dur = Math.min(dur, .28); }
  else if(kind === 'bubble'){ type = 'sine'; dur = Math.min(dur, .2); }
  else if(kind === 'pad'){ type = 'triangle'; attack = .6; }
  else if(kind === 'bass'){ type = 'sine'; attack = .02; }
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if(kind === 'bubble') o.frequency.exponentialRampToValueAtTime(freq * 1.5, t + dur);
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(vol, t + attack);
  g.gain.exponentialRampToValueAtTime(.0008, t + dur);
  o.connect(g).connect(kind === 'pad' ? music.filter : music.master);
  o.start(t); o.stop(t + dur + .05);
  // clochette : un second partiel, plus aigu, qui s'éteint plus vite
  if(kind === 'bell' || kind === 'marimba' || kind === 'celesta'){
    const o2 = ctx.createOscillator(), g2 = ctx.createGain();
    o2.type = 'sine'; o2.frequency.setValueAtTime(freq * (kind === 'bell' ? 2.76 : kind === 'celesta' ? 3 : 4), t);
    g2.gain.setValueAtTime(0, t); g2.gain.linearRampToValueAtTime(vol * .35, t + .005);
    g2.gain.exponentialRampToValueAtTime(.0008, t + dur * .4);
    o2.connect(g2).connect(music.master);
    o2.start(t); o2.stop(t + dur * .4 + .05);
  }
}

/* ---- une croche ---- */
function musicStep(t){
  const th = musicTheme();
  const spb = 60 / th.bpm, eighth = spb / 2;
  const s = music.step % 8, bar = Math.floor(music.step / 8);
  const chordRoot = th.root + th.prog[bar % th.prog.length];
  const third = th.minor ? 3 : 4;
  if(s === 0){
    // accord tenu très doucement (filtré), et la basse
    [0, third, 7].forEach(iv=> mNote(midiHz(chordRoot - 12 + iv), t, eighth * 8.2, 'pad', .022));
    mNote(midiHz(chordRoot - 24), t, eighth * 3, 'bass', .05);
  }
  if(s === 4) mNote(midiHz(chordRoot - 24 + 7), t, eighth * 3, 'bass', .035);
  // mélodie : marche au hasard dans la gamme, avec des silences
  const play = s === 0 ? .9 : s % 2 === 0 ? .6 : .32;
  if(Math.random() < play){
    const degrees = [];
    for(let oct=0; oct<2; oct++) th.scale.forEach(iv=> degrees.push(iv + 12*oct));
    let i = music.last + Math.round((Math.random() - .5) * 4);
    i = Math.max(0, Math.min(degrees.length - 1, i));
    music.last = i;
    const len = s % 2 === 0 && Math.random() < .3 ? eighth * 2 : eighth;
    mNote(midiHz(th.root + degrees[i]), t, len * 1.6, th.lead, th.lead === 'pluck' ? .07 : .06);
  }
  if(th.shaker && s % 2 === 1) mNote(4200 + Math.random() * 600, t, .03, 'pluck', .006);
  if(th.tick && s % 2 === 0) mNote(2093, t, .04, 'pluck', .008);
  music.step++;
  return eighth;
}

/* ---- démarrer, arrêter ---- */
function musicTick(){
  if(!musicWanted() || !audioCtx){ stopMusic(); return; }
  const now = audioCtx.currentTime;
  if(music.nextTime < now) music.nextTime = now + .05;
  while(music.nextTime < now + .6) music.nextTime += musicStep(music.nextTime);
}
function startMusic(){
  if(music.on) return;
  try{
    ensureAudioCtx();
    if(audioCtx.state === 'suspended' && audioCtx.resume) audioCtx.resume();
    music.master = audioCtx.createGain();
    music.master.gain.setValueAtTime(0, audioCtx.currentTime);
    music.master.gain.linearRampToValueAtTime(MUSIC_VOLUME, audioCtx.currentTime + 1.5);
    // sur le bus principal : volume général, réduction pendant la voix, limiteur (js/shared/ui/sound.js)
    music.master.connect(musicBusNode() || audioCtx.destination);
    music.filter = audioCtx.createBiquadFilter();
    music.filter.type = 'lowpass'; music.filter.frequency.value = 900;
    music.filter.connect(music.master);
    music.nextTime = audioCtx.currentTime + .1;
    music.step = 0;
    music.on = true;
    music.timer = setInterval(musicTick, 150);
    musicTick();
  }catch(e){ music.on = false; }
}
function stopMusic(){
  if(!music.on) return;
  music.on = false;
  clearInterval(music.timer); music.timer = null;
  const master = music.master, filter = music.filter;
  try{
    master.gain.cancelScheduledValues(audioCtx.currentTime);
    master.gain.setTargetAtTime(0, audioCtx.currentTime, .15);
  }catch(e){}
  setTimeout(()=>{ try{ master.disconnect(); filter.disconnect(); }catch(e){} }, 900);
}
// À appeler dès qu'un réglage ou la situation change
function updateMusic(){ if(musicWanted()) startMusic(); else stopMusic(); }

if(typeof document!=='undefined') document.addEventListener('visibilitychange', updateMusic);

export { updateMusic };
