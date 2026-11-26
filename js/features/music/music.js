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
import { on, random } from '../../shared/lib/index.js';
import { currentWorld } from '../../entities/world/index.js';
import { audioCtx, ensureAudioCtx, musicBusNode } from '../../shared/ui/index.js';

// root : note MIDI de départ ; scale : gamme (demi-tons) ; prog : accords (degrés en demi-tons)
/**
 * @typedef {{
 *   root: number,
 *   scale: number[],
 *   bpm: number,
 *   lead: string,
 *   prog: number[],
 *   minor?: boolean,
 *   shaker?: boolean,
 *   tick?: boolean,
 * }} MusicTheme
 */
/** @type {Record<string, MusicTheme>} */
const MUSIC_THEMES = {
  lagon: { root: 60, scale: [0, 2, 4, 7, 9], bpm: 84, lead: 'marimba', prog: [0, 9, 5, 7] },
  foret: { root: 55, scale: [0, 2, 4, 7, 9], bpm: 76, lead: 'flute', prog: [0, 5, 9, 7] },
  montagne: { root: 62, scale: [0, 2, 4, 7, 9], bpm: 70, lead: 'bell', prog: [0, 7, 9, 5] },
  chateau: { root: 57, scale: [0, 2, 3, 7, 9], bpm: 72, lead: 'harp', prog: [0, 8, 5, 7], minor: true },
  jungle: { root: 53, scale: [0, 2, 4, 7, 9], bpm: 96, lead: 'pluck', prog: [0, 5, 7, 5], shaker: true },
  cite: { root: 64, scale: [0, 2, 4, 7, 11], bpm: 80, lead: 'bell', prog: [0, 9, 5, 7], tick: true },
  volcan: { root: 50, scale: [0, 3, 5, 7, 10], bpm: 74, lead: 'pluck', prog: [0, 8, 5, 7], minor: true },
  squishy: { root: 67, scale: [0, 2, 4, 7, 9], bpm: 98, lead: 'bubble', prog: [0, 5, 9, 7] },
  // saison 2 : une harpe aérienne, et les petits « tchac » des machines de la Fabrique
  boites: { root: 65, scale: [0, 2, 4, 7, 9], bpm: 88, lead: 'harp', prog: [0, 5, 9, 7], tick: true },
  // une boîte à musique (célesta), très douce
  jouets: { root: 72, scale: [0, 2, 4, 7, 9], bpm: 80, lead: 'celesta', prog: [0, 9, 5, 7] },
  // une petite valse sucrée, en pizzicato
  bonbons: { root: 67, scale: [0, 2, 4, 7, 9], bpm: 92, lead: 'pluck', prog: [0, 5, 7, 0] },
  // un thème joyeux au marimba (le timbre du moteur de la v56)
  musique: { root: 62, scale: [0, 2, 4, 7, 9], bpm: 100, lead: 'marimba', prog: [0, 5, 9, 7], tick: true },
  // une flûte légère et de petites cloches
  jardin: { root: 69, scale: [0, 2, 4, 7, 9], bpm: 76, lead: 'flute', prog: [0, 9, 5, 7], tick: true },
  // la harpe et les clochettes du Royaume ; la fête du grand final, plus joyeuse
  licornes: { root: 65, scale: [0, 2, 4, 7, 9], bpm: 84, lead: 'harp', prog: [0, 9, 5, 7], tick: true },
  'licornes-fete': { root: 67, scale: [0, 2, 4, 7, 9], bpm: 112, lead: 'bell', prog: [0, 5, 7, 0], shaker: true },
  // saison 3, l'Île des Crayons : un pizzicato léger, et un crayon qui tapote
  crayons: { root: 64, scale: [0, 2, 4, 7, 9], bpm: 96, lead: 'pluck', prog: [0, 5, 9, 7], tick: true },
  // l'Île des Squishy Dumplings : une flûte qui siffle comme la vapeur, et le shaker des grains de riz
  dumplings: { root: 62, scale: [0, 2, 4, 7, 9], bpm: 84, lead: 'flute', prog: [0, 5, 9, 7], shaker: true },
  // l'Île des Coffres : un pincé léger, et les petits « tic » des serrures
  coffres: { root: 64, scale: [0, 2, 4, 7, 9], bpm: 90, lead: 'pluck', prog: [0, 9, 5, 7], tick: true },
};
const MUSIC_VOLUME = 1.0; // crête ≈ 0,11, bien sous les bruitages ; passe ensuite par le volume général du bus

/**
 * La musique en cours : `master` et `filter` existent dès qu'elle joue (on).
 * @type {{
 *   on: boolean,
 *   timer: ReturnType<typeof setInterval> | undefined,
 *   nextTime: number,
 *   step: number,
 *   master: GainNode | null,
 *   filter: BiquadFilterNode | null,
 *   last: number,
 * }}
 */
let music = { on: false, timer: undefined, nextTime: 0, step: 0, master: null, filter: null, last: 7 };

// un thème qui remplace un moment celui de l'île (la fête du grand final) :
// emit('music:theme', 'licornes-fete'), puis emit('music:theme', null)
/** @type {string | null} */
let musicOverride = null;
on('music:theme', (/** @type {string | null} */ key) => {
  // String : null devient la clé « null », absente, comme le faisait l'accès direct
  musicOverride = MUSIC_THEMES[String(key)] ? key : null;
});
function musicTheme() {
  const th = Object.assign({}, MUSIC_THEMES[musicOverride || currentWorld] || MUSIC_THEMES.lagon);
  const season = currentSeason();
  if (season === 'noel') th.lead = 'bell';
  if (season === 'halloween') {
    th.scale = [0, 3, 5, 7, 10];
    th.minor = true;
    th.prog = [0, 8, 5, 7];
  }
  return th;
}
/** @param {number} m note MIDI */
function midiHz(m) {
  return 440 * Math.pow(2, (m - 69) / 12);
}
function musicWanted() {
  if (!state.music || !state.sound) return false;
  if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return false;
  const sp = typeof document !== 'undefined' && document.getElementById('splash');
  return !(sp && sp.classList.contains('show')); // après « Jouer » (le geste qui débloque le son sur iPhone)
}

/* ---- les instruments ---- */
// chaque instrument : forme d'onde, attaque et durée de la note (sinus, 0,01 s et durée demandée par défaut)
/** @type {Record<string, { type?: OscillatorType, attack?: number, dur?: (d: number) => number }>} */
const MUSIC_INSTRUMENTS = {
  marimba: { dur: (d) => Math.min(d, 0.45) },
  flute: { attack: 0.07 },
  bell: { dur: (d) => Math.max(d, 1.1) },
  celesta: { dur: (d) => Math.min(Math.max(d, 0.6), 0.9) },
  harp: { type: 'triangle', dur: (d) => Math.max(d, 0.8) },
  pluck: { type: 'triangle', dur: (d) => Math.min(d, 0.28) },
  bubble: { dur: (d) => Math.min(d, 0.2) },
  pad: { type: 'triangle', attack: 0.6 },
  bass: { attack: 0.02 },
};
/** @typedef {{ dur: number, kind: string, vol: number }} MusicNote kind : l'instrument */
/**
 * @param {number} freq
 * @param {number} t
 * @param {MusicNote} note
 */
function mNote(freq, t, { dur: durArg, kind, vol }) {
  const inst = MUSIC_INSTRUMENTS[kind] || {};
  const dur = inst.dur ? inst.dur(durArg) : durArg;
  const attack = inst.attack || 0.01;
  // joué par musicTick, qui a vérifié le contexte audio ; master et filter existent (music.on)
  const ctx = /** @type {AudioContext} */ (audioCtx),
    master = /** @type {GainNode} */ (music.master),
    filter = /** @type {BiquadFilterNode} */ (music.filter),
    o = ctx.createOscillator(),
    g = ctx.createGain();
  o.type = inst.type || 'sine';
  o.frequency.setValueAtTime(freq, t);
  if (kind === 'bubble') o.frequency.exponentialRampToValueAtTime(freq * 1.5, t + dur);
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(vol, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
  o.connect(g).connect(kind === 'pad' ? filter : master);
  o.start(t);
  o.stop(t + dur + 0.05);
  // clochette : un second partiel, plus aigu, qui s'éteint plus vite
  if (kind === 'bell' || kind === 'marimba' || kind === 'celesta') musicPartial(freq, t, { dur, kind, vol });
}
/**
 * @param {number} freq
 * @param {number} t
 * @param {MusicNote} note
 */
function musicPartial(freq, t, { dur, kind, vol }) {
  const ctx = /** @type {AudioContext} */ (audioCtx),
    master = /** @type {GainNode} */ (music.master),
    o2 = ctx.createOscillator(),
    g2 = ctx.createGain();
  o2.type = 'sine';
  o2.frequency.setValueAtTime(freq * (kind === 'bell' ? 2.76 : kind === 'celesta' ? 3 : 4), t);
  g2.gain.setValueAtTime(0, t);
  g2.gain.linearRampToValueAtTime(vol * 0.35, t + 0.005);
  g2.gain.exponentialRampToValueAtTime(0.0008, t + dur * 0.4);
  o2.connect(g2).connect(master);
  o2.start(t);
  o2.stop(t + dur * 0.4 + 0.05);
}

/* ---- une croche ---- */
/** @param {number} t */
function musicStep(t) {
  const th = musicTheme();
  const spb = 60 / th.bpm,
    eighth = spb / 2;
  const s = music.step % 8,
    bar = Math.floor(music.step / 8);
  const chordRoot = th.root + th.prog[bar % th.prog.length];
  const third = th.minor ? 3 : 4;
  if (s === 0) {
    // accord tenu très doucement (filtré), et la basse
    [0, third, 7].forEach((iv) =>
      mNote(midiHz(chordRoot - 12 + iv), t, { dur: eighth * 8.2, kind: 'pad', vol: 0.022 }),
    );
    mNote(midiHz(chordRoot - 24), t, { dur: eighth * 3, kind: 'bass', vol: 0.05 });
  }
  if (s === 4) mNote(midiHz(chordRoot - 24 + 7), t, { dur: eighth * 3, kind: 'bass', vol: 0.035 });
  // mélodie : marche au hasard dans la gamme, avec des silences
  const play = s === 0 ? 0.9 : s % 2 === 0 ? 0.6 : 0.32;
  if (random() < play) {
    /** @type {number[]} */
    const degrees = [];
    for (let oct = 0; oct < 2; oct++) th.scale.forEach((iv) => degrees.push(iv + 12 * oct));
    let i = music.last + Math.round((random() - 0.5) * 4);
    i = Math.max(0, Math.min(degrees.length - 1, i));
    music.last = i;
    const len = s % 2 === 0 && random() < 0.3 ? eighth * 2 : eighth;
    mNote(midiHz(th.root + degrees[i]), t, { dur: len * 1.6, kind: th.lead, vol: th.lead === 'pluck' ? 0.07 : 0.06 });
  }
  if (th.shaker && s % 2 === 1) mNote(4200 + random() * 600, t, { dur: 0.03, kind: 'pluck', vol: 0.006 });
  if (th.tick && s % 2 === 0) mNote(2093, t, { dur: 0.04, kind: 'pluck', vol: 0.008 });
  music.step++;
  return eighth;
}

/* ---- démarrer, arrêter ---- */
function musicTick() {
  if (!musicWanted() || !audioCtx) {
    stopMusic();
    return;
  }
  const now = audioCtx.currentTime;
  if (music.nextTime < now) music.nextTime = now + 0.05;
  while (music.nextTime < now + 0.6) music.nextTime += musicStep(music.nextTime);
}
function startMusic() {
  if (music.on) return;
  try {
    ensureAudioCtx();
    // sans Web Audio, audioCtx reste null : la ligne suivante lève, le catch laisse la musique coupée
    const ctx = /** @type {AudioContext} */ (audioCtx);
    if (ctx.state === 'suspended' && ctx.resume) ctx.resume();
    const master = ctx.createGain();
    music.master = master;
    master.gain.setValueAtTime(0, ctx.currentTime);
    master.gain.linearRampToValueAtTime(MUSIC_VOLUME, ctx.currentTime + 1.5);
    // sur le bus principal : volume général, réduction pendant la voix, limiteur (js/shared/ui/sound.js)
    master.connect(musicBusNode() || ctx.destination);
    const filter = ctx.createBiquadFilter();
    music.filter = filter;
    filter.type = 'lowpass';
    filter.frequency.value = 900;
    filter.connect(master);
    music.nextTime = ctx.currentTime + 0.1;
    music.step = 0;
    music.on = true;
    music.timer = setInterval(musicTick, 150);
    musicTick();
  } catch {
    music.on = false;
  }
}
function stopMusic() {
  if (!music.on) return;
  music.on = false;
  clearInterval(music.timer);
  music.timer = undefined;
  // la musique jouait (music.on) : startMusic a créé ses deux nœuds
  const master = /** @type {GainNode} */ (music.master),
    filter = /** @type {BiquadFilterNode} */ (music.filter);
  try {
    // un contexte absent lève ici, comme un contexte fermé
    const ctx = /** @type {AudioContext} */ (audioCtx);
    master.gain.cancelScheduledValues(ctx.currentTime);
    master.gain.setTargetAtTime(0, ctx.currentTime, 0.15);
  } catch {
    // contexte audio déjà fermé : la musique est de toute façon coupée
  }
  setTimeout(() => {
    try {
      master.disconnect();
      filter.disconnect();
    } catch {
      // nœuds audio déjà débranchés : rien à faire
    }
  }, 900);
}
// À appeler dès qu'un réglage ou la situation change
function updateMusic() {
  if (musicWanted()) startMusic();
  else stopMusic();
}

if (typeof document !== 'undefined') document.addEventListener('visibilitychange', updateMusic);

export { updateMusic };
