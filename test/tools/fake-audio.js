/* ---------- Faux moteur audio pour jsdom (tests des sons) ----------
   jsdom n'a pas de Web Audio. Ce faux AudioContext enregistre tout ce que le
   jeu crée : chaque nœud (type, paramètres, connexions) et chaque oscillateur
   (forme d'onde, fréquence de départ, début et fin). Les tests lisent
   window.__audio pour vérifier le chemin du son et les notes jouées.

   Usage : ev(FAKE_AUDIO_SRC) dans la fenêtre jsdom, puis ev('audioCtx = null')
   pour que le jeu recrée son contexte avec ce faux moteur. */
const FAKE_AUDIO_SRC = `(function(){
  const A = window.__audio = { contexts:0, nodes:[], oscs:[] };
  function param(owner, name, v){
    const p = { value:v || 0, calls:[], owner, name,
      setValueAtTime(x, t){ this.calls.push(['set', x, t]); this.value = x; return this; },
      linearRampToValueAtTime(x, t){ this.calls.push(['lin', x, t]); this.value = x; return this; },
      exponentialRampToValueAtTime(x, t){ this.calls.push(['exp', x, t]); this.value = x; return this; },
      setTargetAtTime(x, t, k){ this.calls.push(['target', x, t, k]); this.value = x; return this; },
      cancelScheduledValues(t){ this.calls.push(['cancel', t]); return this; } };
    return p;
  }
  function node(ctx, kind, extra){
    const n = Object.assign({ kind, ctx, outs:[], connect(dest){ this.outs.push(dest); return dest && dest.kind ? dest : dest; },
      disconnect(){ this.outs = []; } }, extra || {});
    A.nodes.push(n);
    return n;
  }
  class FakeAudioContext {
    constructor(){ A.contexts++; this.currentTime = 0; this.sampleRate = 8000; this.state = 'running';
      this.destination = node(this, 'destination'); }
    createOscillator(){
      const o = node(this, 'oscillator', { type:'sine', startAt:null, stopAt:null,
        start(t){ this.startAt = t || 0; }, stop(t){ this.stopAt = t || 0; } });
      o.frequency = param(o, 'frequency', 440); o.detune = param(o, 'detune', 0);
      A.oscs.push(o);
      return o;
    }
    createGain(){ const g = node(this, 'gain'); g.gain = param(g, 'gain', 1); return g; }
    createBiquadFilter(){ const f = node(this, 'filter', { type:'lowpass' }); f.frequency = param(f, 'frequency', 350); f.Q = param(f, 'Q', 1); return f; }
    createDynamicsCompressor(){ const c = node(this, 'compressor');
      ['threshold','knee','ratio','attack','release'].forEach(k=> c[k] = param(c, k, 0)); return c; }
    createConvolver(){ return node(this, 'convolver', { buffer:null }); }
    createBuffer(channels, length, rate){
      const data = Array.from({ length:channels }, ()=> new Float32Array(length));
      return { numberOfChannels:channels, length, sampleRate:rate, getChannelData:(c)=> data[c] };
    }
    resume(){ this.state = 'running'; return Promise.resolve(); }
  }
  window.AudioContext = FakeAudioContext;
  window.webkitAudioContext = FakeAudioContext;
})()`;

module.exports = { FAKE_AUDIO_SRC };
