/* Réglages audio du joueur ({ sound, voice, music }). `shared` ne connaît pas
   l'état du jeu : c'est l'état (entities/game-state) qui fournit la source,
   avec setAudioPrefsSource(() => state). Par défaut : tout est actif. */
let audioPrefsSource = ()=> ({ sound:true, voice:true, music:false });
function setAudioPrefsSource(fn){ audioPrefsSource = fn; }
function audioPrefs(){ return audioPrefsSource() || {}; }

/* ---------- Sons (Web Audio, aucun fichier) ---------- */
let audioCtx = null;

function tone(freq, start, dur, type='sine', vol=.18){
  const o = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  o.type = type; o.frequency.value = freq;
  g.gain.setValueAtTime(0, audioCtx.currentTime + start);
  g.gain.linearRampToValueAtTime(vol, audioCtx.currentTime + start + .01);
  g.gain.exponentialRampToValueAtTime(.001, audioCtx.currentTime + start + dur);
  o.connect(g).connect(audioCtx.destination);
  o.start(audioCtx.currentTime + start);
  o.stop(audioCtx.currentTime + start + dur + .05);
}

// le contexte audio, créé au premier son (après un geste de l'enfant)
function ensureAudioCtx(){
  if(!audioCtx) audioCtx = new (window.AudioContext||window.webkitAudioContext)();
  return audioCtx;
}

function playSound(kind){
  if(!audioPrefs().sound) return;
  try{
    ensureAudioCtx();
    if(audioCtx.state==='suspended') audioCtx.resume();
    if(kind==='tap') tone(660, 0, .08, 'triangle', .1);
    else if(kind==='good') { tone(523, 0, .12); tone(784, .1, .16); }
    else if(kind==='wrong') tone(220, 0, .2, 'square', .08);
    else if(kind==='win') { [523,659,784,1047].forEach((f,i)=>tone(f, i*.11, .22)); }
    else if(kind==='coin') { tone(988, 0, .08, 'triangle'); tone(1319, .07, .14, 'triangle'); }
    else if(kind==='tick') tone(1568, 0, .05, 'triangle', .05);
    else if(kind==='pop') { tone(784, 0, .06, 'sine', .12); tone(1175, .05, .1, 'sine', .1); }
    // un squishy qu'on presse (v53) : un petit « pouic » qui monte puis redescend
    else if(kind==='pouic') {
      const o = audioCtx.createOscillator(), g = audioCtx.createGain(), t = audioCtx.currentTime;
      o.type = 'sine';
      o.frequency.setValueAtTime(520, t);
      o.frequency.exponentialRampToValueAtTime(1500, t + .14);
      o.frequency.exponentialRampToValueAtTime(900, t + .26);
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(.16, t + .02);
      g.gain.exponentialRampToValueAtTime(.001, t + .3);
      o.connect(g).connect(audioCtx.destination);
      o.start(t); o.stop(t + .32);
    }
    // un squishy ✨ pailleté (v53) : des clochettes
    else if(kind==='sparkle') { [1319,1568,1976,2637,2093,2637].forEach((f,i)=>tone(f, i*.08, .2, 'triangle', .09)); }
  }catch(e){}
}

function soundModeLabel(){
  const p = audioPrefs();
  if(!p.sound) return '🔇 Silence';
  if(p.music && p.voice) return '🎵 Musique + sons + voix';
  return p.voice ? '🗣️ Sons + voix' : '🔊 Sons seulement';
}

export { audioCtx, audioPrefs, ensureAudioCtx, playSound, setAudioPrefsSource, soundModeLabel, tone };
