/* Réglages audio du joueur ({ sound, voice, music, soundVolume }). `shared` ne
   connaît pas l'état du jeu : c'est l'état (entities/game-state) qui fournit la
   source, avec setAudioPrefsSource(() => state). Par défaut : tout est actif. */
import { random } from '../lib/index.js';
/** @typedef {{ sound?: boolean, voice?: boolean, music?: boolean, soundVolume?: number }} AudioPrefs */
/** @type {() => AudioPrefs} */
let audioPrefsSource = () => ({ sound: true, voice: true, music: false, soundVolume: 80 });
/** @param {() => AudioPrefs} fn */
function setAudioPrefsSource(fn) {
  audioPrefsSource = fn;
}
/** @returns {AudioPrefs} */
function audioPrefs() {
  return audioPrefsSource() || {};
}

/* ---------- Moteur audio (Web Audio, aucun fichier) ----------
   Un seul AudioContext et un bus principal, par lequel passent les sons, les
   notes du Simon et la musique :

     sons ─┬─ sec ─────────────┐
           └─ écho (réverb) ───┤
     musique ──────────────────┼─▶ volume général ─▶ réduction voix ─▶ limiteur ─▶ haut-parleur

   - volume général : réglage du joueur (state.soundVolume, 0 à 100) ;
   - réduction voix : tout baisse pendant que la voix parle ;
   - limiteur : plusieurs sons ensemble ne saturent jamais ;
   - écho doux : une légère réverbération, « sous l'eau du lagon ».
   Chaque son varie très légèrement (hauteur, volume) pour ne jamais sonner
   comme une machine, et un même son n'est pas rejoué à moins de 60 ms
   (pas de crépitement quand un enfant tape vite).
   Choix validés à l'écoute : https://claude.ai/artifact/F5xuENW8ePFKLk4QogwH8K */
/**
 * Le bus principal (voir le schéma ci-dessus).
 * @typedef {object} SoundBus
 * @property {GainNode} master
 * @property {GainNode} duck
 * @property {DynamicsCompressorNode | GainNode} comp
 * @property {GainNode} dry
 * @property {GainNode} wet
 * @property {ConvolverNode | null} reverb
 * @property {GainNode} music
 */
/** @type {AudioContext | null} */
let audioCtx = null;
/** @type {SoundBus | null} */
let soundBus = null;
const SOUND_MASTER_LEVEL = 0.9; // volume général à 100 %
const SOUND_VOICE_DUCK = 0.4; // part du volume gardée pendant que la voix parle
const SOUND_REVERB_SEND = 0.22; // quantité d'écho
const SOUND_BURST_MS = 60; // délai minimal entre deux lectures d'un même son
const SOUND_PITCH_VARIATION = 0.012; // ±1,2 %
const SOUND_GAIN_VARIATION = 0.12; // ±12 %

// l'horloge de l'anti-rafale (remplaçable dans les tests)
let soundClock = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());

// le contexte audio, créé au premier son (après un geste de l'enfant, exigé par iOS)
function ensureAudioCtx() {
  if (!audioCtx) {
    const Ctx = typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext);
    if (!Ctx) return null;
    audioCtx = new Ctx();
    soundBus = null;
  }
  if (!soundBus) buildSoundBus();
  if (audioCtx.state === 'suspended' && audioCtx.resume) audioCtx.resume();
  return audioCtx;
}

// appelée par ensureAudioCtx, une fois le contexte créé
function buildSoundBus() {
  const ctx = /** @type {AudioContext} */ (audioCtx);
  /** @type {SoundBus} */
  const b = {
    master: ctx.createGain(), // volume général
    duck: ctx.createGain(), // réduction pendant la voix
    comp: ctx.createDynamicsCompressor ? ctx.createDynamicsCompressor() : ctx.createGain(),
    dry: ctx.createGain(), // sons sans écho
    wet: ctx.createGain(), // envoi vers l'écho
    reverb: ctx.createConvolver ? ctx.createConvolver() : null,
    music: ctx.createGain(), // entrée de la musique (features/music)
  };
  // sans compresseur (vieux navigateurs), comp est un simple GainNode, sans réglages
  if (/** @type {Partial<DynamicsCompressorNode>} */ (b.comp).threshold) {
    const comp = /** @type {DynamicsCompressorNode} */ (b.comp);
    comp.threshold.value = -14;
    comp.knee.value = 10;
    comp.ratio.value = 6;
    comp.attack.value = 0.003;
    comp.release.value = 0.2;
  }
  b.master.gain.value = soundVolumeLevel();
  b.wet.gain.value = SOUND_REVERB_SEND;
  b.dry.connect(b.master);
  b.music.connect(b.master);
  if (b.reverb) {
    b.reverb.buffer = reverbImpulse(1.4, 3.2);
    b.wet.connect(b.reverb);
    b.reverb.connect(b.master);
  }
  b.master.connect(b.duck);
  b.duck.connect(b.comp);
  b.comp.connect(ctx.destination);
  soundBus = b;
}

// réponse impulsionnelle de l'écho : un bruit qui s'éteint doucement (générée une seule fois)
/**
 * @param {number} seconds
 * @param {number} decay
 */
function reverbImpulse(seconds, decay) {
  const ctx = /** @type {AudioContext} */ (audioCtx),
    n = Math.max(1, Math.floor(ctx.sampleRate * seconds));
  const buf = ctx.createBuffer(2, n, ctx.sampleRate);
  for (let c = 0; c < 2; c++) {
    const data = buf.getChannelData(c);
    for (let i = 0; i < n; i++) data[i] = (random() * 2 - 1) * Math.pow(1 - i / n, decay);
  }
  return buf;
}

function soundVolumeLevel() {
  const v = Number(audioPrefs().soundVolume);
  return (SOUND_MASTER_LEVEL * (Number.isFinite(v) ? Math.max(0, Math.min(100, v)) : 80)) / 100;
}

// la voix parle : tout le bus baisse (sons et musique), puis remonte
/** @param {boolean} on */
function setVoiceDuck(on) {
  if (!soundBus) return;
  // le bus n'existe qu'avec son contexte
  const ctx = /** @type {AudioContext} */ (audioCtx);
  soundBus.duck.gain.setTargetAtTime(on ? SOUND_VOICE_DUCK : 1, ctx.currentTime, 0.12);
}

// entrée du bus pour la musique (features/music)
function musicBusNode() {
  ensureAudioCtx();
  return soundBus ? soundBus.music : null;
}

/* ---------- Instrument : le marimba ---------- */
/**
 * @param {number} x
 * @param {number} amount
 * @param {boolean} [exact]
 */
const soundVary = (x, amount, exact) => (exact ? x : x * (1 + (random() * 2 - 1) * amount));

/* Les fonctions de l'instrument ne sont appelées que par playSound et playNote,
   après ensureAudioCtx : le contexte et le bus existent alors. */
const liveCtx = () => /** @type {AudioContext} */ (audioCtx);
const liveBus = () => /** @type {SoundBus} */ (soundBus);

// une composante : attaque très courte, extinction exponentielle
/**
 * @param {number} freq
 * @param {number} t
 * @param {{ vol: number, decay: number, type?: OscillatorType, wet?: boolean }} sound `wet: false` : hors de l'écho
 */
function marimbaPartial(freq, t, { vol, decay, type, wet }) {
  const o = liveCtx().createOscillator(),
    g = liveCtx().createGain();
  o.type = type || 'sine';
  o.frequency.setValueAtTime(freq, t);
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(vol, t + 0.006);
  g.gain.exponentialRampToValueAtTime(0.0008, t + decay);
  o.connect(g);
  g.connect(liveBus().dry);
  if (wet !== false) g.connect(liveBus().wet);
  o.start(t);
  o.stop(t + decay + 0.05);
}

// une note de marimba : fondamentale, partiel à ~4× qui s'éteint vite, petit clic de bois (3 oscillateurs)
/**
 * @param {number} freq
 * @param {number} delay
 * @param {object} note
 * @param {number} note.vol
 * @param {number} [note.decay] 0,45 s par défaut
 * @param {boolean} [note.exact] sans variation de hauteur ni de volume (Simon)
 */
function marimbaNote(freq, delay, { vol, decay, exact }) {
  const t = liveCtx().currentTime + (delay || 0);
  const f = soundVary(freq, SOUND_PITCH_VARIATION, exact),
    v = soundVary(vol, SOUND_GAIN_VARIATION, exact);
  const d = decay || 0.45;
  marimbaPartial(f, t, { vol: v, decay: d });
  marimbaPartial(f * 3.99, t, { vol: v * 0.28, decay: d * 0.25 });
  marimbaPartial(f * 10, t, { vol: v * 0.05, decay: 0.03, type: 'triangle', wet: false });
}

// un glissé doux (pouic, ouverture de boîte)
/**
 * @param {Array<[number, number]>} points [instant en s, fréquence en Hz]
 * @param {object} glide
 * @param {number} glide.delay en s
 * @param {number} glide.vol
 * @param {OscillatorType} [glide.type] sinus par défaut
 */
function soundGlide(points, { delay, vol, type }) {
  const t = liveCtx().currentTime + (delay || 0),
    o = liveCtx().createOscillator(),
    g = liveCtx().createGain();
  o.type = type || 'sine';
  o.frequency.setValueAtTime(soundVary(points[0][1], 0.02), t);
  points.slice(1).forEach(([dt, f]) => o.frequency.exponentialRampToValueAtTime(f, t + dt));
  const end = points[points.length - 1][0];
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(soundVary(vol, SOUND_GAIN_VARIATION), t + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0008, t + end + 0.05);
  o.connect(g);
  g.connect(liveBus().dry);
  g.connect(liveBus().wet);
  o.start(t);
  o.stop(t + end + 0.1);
}

/* ---------- La palette « marimba doux » ----------
   Gamme pentatonique (do, ré, mi, sol, la) : deux sons qui se superposent ne
   font jamais une fausse note. */
const SOUND_NOTES = {
  A4: 440,
  C5: 523,
  D5: 587,
  E5: 659,
  G5: 784,
  A5: 880,
  C6: 1047,
  D6: 1175,
  E6: 1319,
  G6: 1568,
  A6: 1760,
  C7: 2093,
  E7: 2637,
};
// le mixage : touchers discrets, retours clairs, fêtes plus présentes
const SOUND_FAMILY = {
  tap: 0.55,
  tick: 0.5,
  pop: 0.7,
  good: 0.9,
  coin: 0.85,
  wrong: 0.8,
  pouic: 0.9,
  giggle: 0.9,
  sparkle: 0.8,
  hint: 0.8,
  win: 1,
  island: 1,
  box: 1,
};
const SN = SOUND_NOTES,
  sfam = (/** @type {keyof typeof SOUND_FAMILY} */ k) => SOUND_FAMILY[k];
/** @type {Record<string, () => void>} */
const SOUND_PALETTE = {
  tap: () => marimbaNote(SN.G5, 0, { vol: 0.16 * sfam('tap'), decay: 0.18 }),
  good: () => {
    marimbaNote(SN.E5, 0, { vol: 0.2 * sfam('good') });
    marimbaNote(SN.C6, 0.1, { vol: 0.22 * sfam('good'), decay: 0.6 });
  },
  wrong: () => {
    marimbaNote(SN.D5, 0, { vol: 0.17 * sfam('wrong'), decay: 0.35 });
    marimbaNote(SN.A4, 0.16, { vol: 0.17 * sfam('wrong'), decay: 0.5 });
  },
  win: () => {
    [SN.C5, SN.E5, SN.G5, SN.C6, SN.E6].forEach((f, i) =>
      marimbaNote(f, i * 0.1, { vol: 0.2 * sfam('win'), decay: 0.7 }),
    );
    [SN.C6, SN.E6, SN.G6].forEach((f) => marimbaNote(f, 0.62, { vol: 0.14 * sfam('win'), decay: 1.2 }));
  },
  coin: () => {
    marimbaNote(SN.G6, 0, { vol: 0.14 * sfam('coin'), decay: 0.25 });
    marimbaNote(SN.C7, 0.06, { vol: 0.14 * sfam('coin'), decay: 0.4 });
  },
  pop: () => marimbaNote(SN.A5, 0, { vol: 0.16 * sfam('pop'), decay: 0.15 }),
  tick: () => marimbaNote(SN.A6, 0, { vol: 0.07 * sfam('tick'), decay: 0.07 }),
  pouic: () =>
    soundGlide(
      [
        [0, 500],
        [0.12, 1300],
        [0.24, 950],
      ],
      { delay: 0, vol: 0.14 * sfam('pouic') },
    ),
  // le rire (Monde des Chatouilles) : trois petits glissés qui montent et redescendent
  giggle: () =>
    [0, 0.14, 0.28].forEach((delay, i) =>
      soundGlide(
        i < 2
          ? [
              [0, 820],
              [0.06, 1250],
              [0.11, 900],
            ]
          : [
              [0, 900],
              [0.06, 1400],
              [0.12, 1000],
            ],
        {
          delay,
          vol: 0.11 * sfam('giggle'),
        },
      ),
    ),
  sparkle: () =>
    [SN.E6, SN.G6, SN.A6, SN.C7, SN.A6, SN.E7].forEach((f, i) =>
      marimbaNote(f, i * 0.07, { vol: 0.1 * sfam('sparkle'), decay: 0.5 }),
    ),
  hint: () => {
    marimbaNote(SN.E5, 0, { vol: 0.15 * sfam('hint'), decay: 0.6 });
    marimbaNote(SN.A5, 0.18, { vol: 0.15 * sfam('hint'), decay: 0.9 });
  },
  island: () => {
    [SN.C5, SN.D5, SN.E5, SN.G5, SN.A5, SN.C6, SN.D6, SN.E6].forEach((f, i) =>
      marimbaNote(f, i * 0.08, { vol: 0.17 * sfam('island'), decay: 0.7 }),
    );
    [SN.C6, SN.G6].forEach((f) => marimbaNote(f, 0.75, { vol: 0.14 * sfam('island'), decay: 1.5 }));
  },
  box: () => {
    soundGlide(
      [
        [0, 300],
        [0.35, 900],
      ],
      { delay: 0, vol: 0.07 * sfam('box'), type: 'triangle' },
    );
    [SN.G5, SN.C6, SN.E6].forEach((f, i) => marimbaNote(f, 0.4 + i * 0.07, { vol: 0.18 * sfam('box'), decay: 0.8 }));
  },
};

/* ---------- Jouer ---------- */
/** @type {Record<string, number>} */
const soundLastPlayed = {};
// joue un son de la palette ; renvoie true s'il a été joué
/** @param {string} kind */
function playSound(kind) {
  if (!audioPrefs().sound) return false;
  const fn = SOUND_PALETTE[kind];
  if (!fn) return false;
  const now = soundClock();
  if (now - (soundLastPlayed[kind] ?? -Infinity) < SOUND_BURST_MS) return false;
  try {
    if (!ensureAudioCtx()) return false;
    soundLastPlayed[kind] = now;
    liveBus().master.gain.value = soundVolumeLevel();
    fn();
    return true;
  } catch {
    return false;
  }
}

// une note exacte (Simon) : pas de variation, pas d'anti-rafale
/**
 * @param {number} freq
 * @param {number} [dur]
 * @param {number} [vol]
 */
function playNote(freq, dur, vol) {
  if (!audioPrefs().sound) return false;
  try {
    if (!ensureAudioCtx()) return false;
    liveBus().master.gain.value = soundVolumeLevel();
    marimbaNote(freq, 0, { vol: vol || 0.18, decay: Math.max(0.3, dur || 0.45), exact: true });
    return true;
  } catch {
    return false;
  }
}

function soundModeLabel() {
  const p = audioPrefs();
  if (!p.sound) return '🔇 Silence';
  if (p.music && p.voice) return '🎵 Musique + sons + voix';
  return p.voice ? '🗣️ Sons + voix' : '🔊 Sons seulement';
}

export {
  audioCtx,
  audioPrefs,
  ensureAudioCtx,
  musicBusNode,
  playNote,
  playSound,
  setAudioPrefsSource,
  setVoiceDuck,
  soundModeLabel,
};
