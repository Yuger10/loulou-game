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

function playSound(kind){
  if(!audioPrefs().sound) return;
  try{
    if(!audioCtx) audioCtx = new (window.AudioContext||window.webkitAudioContext)();
    if(audioCtx.state==='suspended') audioCtx.resume();
    if(kind==='tap') tone(660, 0, .08, 'triangle', .1);
    else if(kind==='good') { tone(523, 0, .12); tone(784, .1, .16); }
    else if(kind==='wrong') tone(220, 0, .2, 'square', .08);
    else if(kind==='win') { [523,659,784,1047].forEach((f,i)=>tone(f, i*.11, .22)); }
    else if(kind==='coin') { tone(988, 0, .08, 'triangle'); tone(1319, .07, .14, 'triangle'); }
    else if(kind==='tick') tone(1568, 0, .05, 'triangle', .05);
    else if(kind==='pop') { tone(784, 0, .06, 'sine', .12); tone(1175, .05, .1, 'sine', .1); }
  }catch(e){}
}

function soundModeLabel(){
  const p = audioPrefs();
  if(!p.sound) return '🔇 Silence';
  if(p.music && p.voice) return '🎵 Musique + sons + voix';
  return p.voice ? '🗣️ Sons + voix' : '🔊 Sons seulement';
}
