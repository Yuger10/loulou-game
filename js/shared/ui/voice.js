/* ---------- Voix (clips enregistrés, Web Speech en repli) ---------- */
import { audioPrefs, setVoiceDuck } from './sound.js';
import { emit, emojiWord, toSpoken } from '../lib/index.js';
import { hasHandler, setHandler } from './handlers.js';
import { VOICE_CLIPS, VOICE_UNLOCK } from './voice-clips.js';

// Choix d'une voix féminine française, la plus naturelle possible
const VOICE_PREFS = [
  'Audrey',
  'Aurélie',
  'Aurelie',
  'Google français',
  'Marie',
  'Amélie',
  'Amelie',
  'Virginie',
  'Hortense',
  'Julie',
  'Denise',
  'Vivienne',
  'Flo (Français (France))',
  'Sandy (Français (France))',
  'Shelley (Français (France))',
  'Flo',
  'Sandy',
  'Shelley',
];

const VOICE_MALE = /thomas|jacques|eddy|reed|rocko|grandpa|nicolas|paul|henri|daniel|claude|yannick/i;

/** @type {SpeechSynthesisVoice | null} */
let chosenVoice = null;

function pickVoice() {
  if (!('speechSynthesis' in window)) return null;
  const voices = window.speechSynthesis.getVoices().filter((v) => /^fr/i.test(v.lang));
  if (!voices.length) return null;
  /** @param {SpeechSynthesisVoice} v */
  const score = (v) => {
    let s = 0;
    const i = VOICE_PREFS.findIndex((p) => v.name.toLowerCase().startsWith(p.toLowerCase()));
    if (i >= 0) s += 1000 - i * 10;
    if (/premium|enhanced|natural|neural|amélior/i.test(v.name)) s += 200;
    if (/^fr-FR$/i.test(v.lang)) s += 50;
    if (VOICE_MALE.test(v.name)) s -= 500;
    if (/grandma|compact/i.test(v.name)) s -= 100;
    if (v.localService) s += 5;
    return s;
  };
  chosenVoice = voices.sort((a, b) => score(b) - score(a))[0];
  return chosenVoice;
}

/* ---------- La file de parole ----------
   Deux phrases qui se suivent dans une même scène ne se coupent plus : la
   seconde attend la fin de la première. Une scène est ce qui est à l'écran
   entre deux changements (vue, fenêtre, écran titre, accueil, pause) : la
   première phrase d'une nouvelle scène coupe celle de la précédente. Une
   demande de l'enfant (`interrupt`) coupe toujours. */

/** @typedef {{ rate?: number, interrupt?: boolean, demand?: boolean, el?: HTMLElement | null }} SpeakOptions */
/** @typedef {{ text: string, key: string, rate: number, demand: boolean, el: HTMLElement | null }} SpeechItem */

const QUEUE_MAX = 3; // phrases en attente au plus : au-delà, la plus ancienne est retirée
/** @type {{ item: SpeechItem, scene: number, stop: () => void } | null} */
let speaking = null;
/** @type {Array<{ item: SpeechItem, scene: number }>} */
let speechQueue = [];
let voiceScene = 0;
// nombre d'appels à speak : l'écoute au doigt sait ainsi si l'action d'un
// bouton a parlé pendant le toucher (js/shared/ui/listen.js)
let speakCalls = 0;
function speakCallCount() {
  return speakCalls;
}

// Lecteur d'une phrase par Web Speech. `done` est appelé une seule fois : à la
// fin, à l'erreur ou à l'arrêt. Rend la fonction qui arrête la lecture.
/**
 * @param {SpeechItem} item
 * @param {() => void} done
 * @returns {() => void}
 */
function playSpeech(item, done) {
  let over = false;
  const finish = () => {
    if (over) return;
    over = true;
    if (item.el) item.el.classList.remove('voix-lu');
    setVoiceDuck(false);
    done();
  };
  try {
    const u = new SpeechSynthesisUtterance(item.key);
    u.lang = 'fr-FR';
    u.rate = item.rate;
    u.pitch = 1.0;
    const v = chosenVoice || pickVoice();
    if (v) u.voice = v;
    // tout le bus audio baisse pendant que la voix parle (js/shared/ui/sound.js)
    setHandler(u, 'start', () => {
      if (!over) setVoiceDuck(true);
    });
    setHandler(u, 'end', finish);
    setHandler(u, 'error', finish);
    if (item.el) item.el.classList.add('voix-lu');
    window.speechSynthesis.speak(u);
  } catch {
    // synthèse vocale absente ou en panne : le texte reste affiché à l'écran
    finish();
  }
  return () => {
    if (over) return;
    // `over` d'abord : l'événement que le navigateur envoie à la phrase coupée ne compte plus
    over = true;
    if (item.el) item.el.classList.remove('voix-lu');
    try {
      window.speechSynthesis.cancel();
    } catch {
      // synthèse vocale en panne : rien à arrêter
    }
    setVoiceDuck(false);
    done();
  };
}

/* ---------- Le lecteur de clips (track voix-naturelle, ADR 0007) ----------
   Une phrase fixe a un clip MP3 généré à l'avance (`voix/<empreinte>.mp3`,
   table js/shared/ui/voice-clips.js). Le clip gagne s'il est dans la table,
   lisible, et arrive en moins de 1 500 ms ; sinon Web Speech dit la même
   phrase, à sa place dans la file, sans message.
   - Un seul élément audio, et non Web Audio : sur iOS il reste audible quand
     l'interrupteur de sonnerie est sur silence. Sa source est l'URL d'objet
     d'un Blob obtenu par fetch : pas de requête partielle, que le service
     worker servirait mal depuis son cache.
   - Lecteur inerte : sans clip dans la table, ou dans un navigateur qui ne lit
     pas le MP3 (ou sans fetch ni caches), rien n'est créé ni écouté, et
     speak() se comporte exactement comme avant. */

/** @typedef {{ cached: number | null, total: number, full: boolean, offline: boolean, saveData: boolean }} VoiceOfflineState */

const SPEECH_RATE = 0.92; // la vitesse normale de la voix (les clips sont générés à cette vitesse)
const CLIP_HASH = /^[0-9a-f]{12}$/; // seule forme d'empreinte qui part en fetch
const CLIP_TIMEOUT = 1500; // au-delà, Web Speech prend la place du clip
const CLIP_SLOW_RATE = 0.8; // la relecture lente de Perle, hauteur conservée
const VOICE_CACHE_NAME = 'lagon-voix'; // le cache du service worker (sw.js), gardé d'une version à l'autre
const VOICE_FILL_DELAY = 5000; // le téléchargement de fond attend que le jeu soit lancé
const VOICE_FILL_BATCH = 4; // clips téléchargés à la fois

let clipTable = VOICE_CLIPS;
let clipUnlock = VOICE_UNLOCK;
/** @type {HTMLAudioElement | null} */
let clipAudio = null;
let clipsReady = false; // faux : lecteur inerte
let clipsOff = false; // play() refusé : Web Speech jusqu'au prochain geste
let clipsUnlocked = false; // l'élément audio a joué une fois dans cette session
let clipBusy = false; // un clip charge ou joue
let clipGestures = false; // l'écouteur de pointerdown est posé (une seule fois)
let clipSession = 0; // change quand la table change : les tâches d'avant s'arrêtent
let clipPlays = 0; // numéro du dernier play() : un refus plus ancien ne compte plus
/** @type {VoiceOfflineState} */
let voiceOffline = { cached: null, total: 0, full: false, offline: false, saveData: false };

// les empreintes de la table, sans doublon, dans son ordre
function clipHashes() {
  return [...new Set(Object.values(clipTable))].filter((h) => CLIP_HASH.test(h));
}

function canPlayClips() {
  if (!Object.keys(clipTable).length) return false;
  if (typeof window.Audio !== 'function' || typeof window.fetch !== 'function' || !('caches' in window)) return false;
  try {
    // jsdom et les navigateurs sans MP3 rendent '' ; sinon l'élément de sonde
    // devient l'unique élément audio de la voix
    const probe = new window.Audio();
    if (probe.canPlayType('audio/mpeg') === '') return false;
    clipAudio = probe;
    return true;
  } catch {
    // élément audio en panne : le lecteur reste inerte, Web Speech parle
    return false;
  }
}

function clipElement() {
  if (!clipAudio) clipAudio = new window.Audio();
  return clipAudio;
}

// L'état du cache hors ligne des clips, pour la carte « Voix » de l'espace parents.
/** @returns {VoiceOfflineState} */
function voiceOfflineState() {
  return { ...voiceOffline };
}

// Le geste de l'enfant : il déverrouille l'élément audio (iOS demande un geste
// avant de jouer un média) en jouant un silence, une fois par session réussie,
// et il réactive le lecteur après un refus.
function onClipGesture() {
  if (!clipsReady) return;
  if (clipsUnlocked || !clipUnlock) {
    clipsOff = false;
    return;
  }
  if (clipBusy) return; // un clip est en route : sa lecture réussie vaudra déverrouillage
  const session = clipSession,
    turn = ++clipPlays;
  /** @param {boolean} ok */
  const settle = (ok) => {
    if (session !== clipSession) return;
    // un refus dépassé par un play() plus récent (source changée) n'en est pas un
    if (!ok && turn !== clipPlays) return;
    clipsUnlocked = ok;
    clipsOff = !ok;
  };
  try {
    const a = clipElement();
    a.src = clipUnlock;
    Promise.resolve(a.play()).then(
      () => settle(true),
      () => settle(false),
    );
  } catch {
    // lecture impossible : les phrases passent par Web Speech, nouvel essai au geste suivant
    settle(false);
  }
}

// Le clip d'une phrase, ou null si elle revient à Web Speech.
/** @param {SpeechItem} item */
function clipFor(item) {
  if (!clipsReady || clipsOff) return null;
  const hash = Object.prototype.hasOwnProperty.call(clipTable, item.key) ? clipTable[item.key] : '';
  if (!hash || !CLIP_HASH.test(hash)) return null;
  if (item.rate === SPEECH_RATE) return { hash, slow: false };
  // une autre vitesse (relecture lente) : seulement si le navigateur garde la hauteur de la voix
  const a = clipElement();
  return 'preservesPitch' in a || 'webkitPreservesPitch' in a ? { hash, slow: true } : null;
}

// Lecteur d'une phrase par son clip. Même contrat que playSpeech : `done` une
// seule fois, et la fonction rendue arrête la lecture.
/**
 * @param {SpeechItem} item
 * @param {string} hash
 * @param {boolean} slow
 * @param {() => void} done
 * @returns {() => void}
 */
function playClip(item, hash, slow, done) {
  const a = clipElement();
  let live = true; // le clip tient encore la parole
  let started = false;
  let url = '';
  /** @type {(() => void) | null} */
  let speechStop = null;
  /** @type {ReturnType<typeof setTimeout> | undefined} */
  let timer;
  clipBusy = true;
  // le clip rend la parole : les sons remontent, son URL est libérée
  const leave = () => {
    live = false;
    clearTimeout(timer);
    clipBusy = false;
    if (url) URL.revokeObjectURL(url);
    url = '';
    if (item.el) item.el.classList.remove('voix-lu');
    setVoiceDuck(false);
  };
  const silence = () => {
    try {
      a.pause();
      a.removeAttribute('src');
      a.load();
    } catch {
      // élément audio en panne : rien à arrêter
    }
  };
  const end = () => {
    if (!live) return;
    leave();
    done();
  };
  // Web Speech dit la phrase à la place du clip, à sa place dans la file
  const fallback = () => {
    if (!live) return;
    leave();
    if (started) silence();
    speechStop = playSpeech(item, done);
  };
  timer = setTimeout(fallback, CLIP_TIMEOUT);
  /** @type {Promise<Response>} */
  let request;
  try {
    request = fetch('voix/' + hash + '.mp3');
  } catch (e) {
    request = Promise.reject(e);
  }
  request
    .then((res) => {
      if (res.status !== 200) throw new Error('clip introuvable');
      return res.blob();
    })
    .then((blob) => {
      if (!live) return; // arrivé trop tard : Web Speech a déjà pris la place
      url = URL.createObjectURL(blob);
      setHandler(a, 'playing', () => {
        if (!live) return;
        clearTimeout(timer);
        clipsUnlocked = true;
        if (item.el) item.el.classList.add('voix-lu');
        // tout le bus audio baisse pendant que la voix parle (js/shared/ui/sound.js)
        setVoiceDuck(true);
      });
      setHandler(a, 'ended', end);
      setHandler(a, 'error', end);
      a.src = url;
      // la vitesse par défaut aussi : le navigateur la reprend quand la source change
      const rate = slow ? CLIP_SLOW_RATE : 1;
      a.defaultPlaybackRate = rate;
      a.playbackRate = rate;
      if (slow) {
        const pitched = /** @type {HTMLAudioElement & { webkitPreservesPitch?: boolean }} */ (a);
        if ('preservesPitch' in a) a.preservesPitch = true;
        else pitched.webkitPreservesPitch = true;
      }
      started = true;
      clipPlays++;
      Promise.resolve(a.play()).then(
        () => {
          if (live) clearTimeout(timer);
        },
        () => {
          if (!live) return;
          // le navigateur refuse de jouer (pas encore de geste) : Web Speech jusqu'au prochain geste
          clipsOff = true;
          fallback();
        },
      );
    })
    .catch(fallback); // hors ligne et pas en cache, erreur réseau, réponse non 200
  return () => {
    if (speechStop) {
      speechStop();
      return;
    }
    if (!live) return;
    leave();
    silence();
    done();
  };
}

// Lecteur d'une phrase : son clip s'il y en a un de jouable, sinon Web Speech.
/**
 * @param {SpeechItem} item
 * @param {() => void} done
 * @returns {() => void}
 */
function playItem(item, done) {
  const clip = clipFor(item);
  return clip ? playClip(item, clip.hash, clip.slow, done) : playSpeech(item, done);
}

// le nom de fichier d'une requête du cache des voix
/** @param {string} url */
function clipFileName(url) {
  return url.split('/').pop() || '';
}

// Téléchargement de fond : 5 s après le chargement, les clips absents du cache
// `lagon-voix` sont téléchargés, 4 à la fois, pour que la voix marche sans
// Internet. Hors ligne ou en économie de données, il compte seulement. Si
// l'appareil refuse d'enregistrer, il s'arrête pour la session sans prévenir
// l'enfant (Web Speech prend le relais) : l'espace parents le dit.
/** @param {number} session */
async function fillVoiceCache(session) {
  const hashes = clipHashes();
  /** @param {Partial<VoiceOfflineState>} patch */
  const publish = (patch) => {
    if (session !== clipSession) return false;
    voiceOffline = { ...voiceOffline, ...patch };
    emit('voice:offline', voiceOfflineState());
    return true;
  };
  try {
    const cache = await caches.open(VOICE_CACHE_NAME);
    const stored = await cache.keys();
    const names = new Set(stored.map((r) => clipFileName(r.url)));
    const missing = hashes.filter((h) => !names.has(h + '.mp3'));
    let cached = hashes.length - missing.length;
    const connection = /** @type {{ connection?: { saveData?: boolean } }} */ (navigator).connection;
    const offline = navigator.onLine === false;
    const saveData = !!connection && connection.saveData === true;
    if (!publish({ cached, offline, saveData }) || offline || saveData) return;
    let full = false;
    /** @param {string} h */
    const store = async (h) => {
      const url = 'voix/' + h + '.mp3';
      let res;
      try {
        res = await fetch(url, { cache: 'no-store' });
      } catch {
        // réseau coupé pour ce clip : il viendra à une prochaine session
        return;
      }
      if (res.status !== 200) return;
      try {
        // le service worker peut aussi le ranger : un double `put` est sans effet
        await cache.put(url, res);
        cached++;
      } catch {
        // plus de place (QuotaExceededError) ou cache refusé
        full = true;
      }
    };
    for (let i = 0; i < missing.length; i += VOICE_FILL_BATCH) {
      // un lot après l'autre : c'est la limite de 4 téléchargements à la fois
      // oxlint-disable-next-line no-await-in-loop -- les lots se suivent exprès
      await Promise.all(missing.slice(i, i + VOICE_FILL_BATCH).map(store));
      if (!publish({ cached, full }) || full) return;
    }
    // enfin, les clips d'une ancienne table quittent le cache
    const wanted = new Set(hashes.map((h) => h + '.mp3'));
    await Promise.all(stored.filter((r) => !wanted.has(clipFileName(r.url))).map((r) => cache.delete(r)));
  } catch {
    // cache indisponible (navigation privée) : les clips viennent du réseau, Web Speech en repli
  }
}

// (Re)met le lecteur en route d'après la table : inerte, ou prêt avec son
// écouteur de geste et son téléchargement de fond.
function initClips() {
  const session = ++clipSession;
  clipAudio = null;
  clipsOff = false;
  clipsUnlocked = false;
  clipBusy = false;
  clipsReady = canPlayClips();
  voiceOffline = { cached: null, total: clipHashes().length, full: false, offline: false, saveData: false };
  if (!clipsReady) return;
  if (!clipGestures) {
    clipGestures = true;
    // en capture : le lecteur est déverrouillé avant que l'action du bouton ne parle
    document.addEventListener('pointerdown', onClipGesture, { capture: true });
  }
  setTimeout(() => {
    if (session === clipSession) void fillVoiceCache(session);
  }, VOICE_FILL_DELAY);
}

// Remplace la table des clips : les tests injectent ainsi quelques clips.
/**
 * @param {Record<string, string>} table
 * @param {string} unlock
 */
// oxlint-disable-next-line no-unused-vars -- lu par les tests
function setVoiceClips(table, unlock) {
  clipTable = table;
  clipUnlock = unlock;
  initClips();
}

/** @param {{ item: SpeechItem, scene: number }} entry */
function playNow(entry) {
  /** @type {{ item: SpeechItem, scene: number, stop: () => void }} */
  const cur = { ...entry, stop: () => {} };
  speaking = cur;
  cur.stop = playItem(entry.item, () => {
    if (speaking !== cur) return; // arrêtée ou remplacée : la file a déjà été reprise
    speaking = null;
    // les phrases d'une scène quittée ne se disent plus
    speechQueue = speechQueue.filter((e) => e.scene === voiceScene);
    const next = speechQueue.shift();
    if (next) playNow(next);
  });
}

// Une fin perdue (événement `end` jamais reçu, connu sur iOS) : la phrase
// d'avant est oubliée, et son surlignage retiré, car sa fin n'arrivera plus
// pour le faire. Sans `cancel()` : il couperait la phrase sur un navigateur
// qui dirait « rien ne parle » juste après `speak()`.
function forgetSpeaking() {
  if (speaking && speaking.item.el) speaking.item.el.classList.remove('voix-lu');
  speaking = null;
}

// arrête la phrase en cours et vide la file
function cutSpeech() {
  speechQueue = [];
  const cur = speaking;
  speaking = null;
  if (cur) cur.stop();
}

// La voix se tait : phrase en cours arrêtée, file vidée, le son remonte.
function stopSpeech() {
  if (!('speechSynthesis' in window)) return;
  const known = !!speaking;
  cutSpeech();
  try {
    // même une phrase que la file ne connaît plus (fin perdue)
    if (!known) window.speechSynthesis.cancel();
  } catch {
    // synthèse vocale en panne : rien à arrêter
  }
  setVoiceDuck(false);
}

// L'écran change : la prochaine phrase coupera celle de l'écran quitté.
function newVoiceScene() {
  voiceScene++;
}

// Une phrase dite juste avant un changement d'écran appartient au nouvel écran
// (l'arrivée sur une île, dite au départ du bateau) : elle n'est pas coupée
// par la première phrase de cet écran, qui attend son tour.
/** @param {string} text */
function keepSpeech(text) {
  const key = toSpoken(text);
  if (speaking && speaking.item.key === key) {
    speaking.scene = voiceScene;
    return;
  }
  const kept = speechQueue.filter((e) => e.item.key === key);
  if (!kept.length) return;
  // elle attendait derrière une phrase de l'écran quitté : celle-ci s'arrête, elle passe
  kept.forEach((e) => (e.scene = voiceScene));
  speechQueue = speechQueue.filter((e) => e.scene === voiceScene);
  if (speaking && speaking.scene !== voiceScene) {
    const cur = speaking;
    speaking = null;
    cur.stop();
    const next = speechQueue.shift();
    if (next) playNow(next);
  }
}

// opts.rate : plus lent pour relire (Perle la conteuse, v52)
/**
 * @param {string} text
 * @param {SpeakOptions} [opts]
 */
function speak(text, opts = {}) {
  speakCalls++;
  const prefs = audioPrefs();
  // une demande de l'enfant parle même voix coupée ; « Silence » tait tout
  const allowed = opts.demand ? prefs.sound : prefs.voice;
  if (!allowed || !('speechSynthesis' in window)) return;
  // avant le premier geste, le navigateur refuserait la parole (iOS) : rien
  // n'est dit ni gardé. Sans cette information (navigateurs anciens), on essaie.
  const activation = /** @type {{ userActivation?: { hasBeenActive: boolean } }} */ (navigator).userActivation;
  if (activation && activation.hasBeenActive === false) return;
  const key = toSpoken(text);
  /** @type {SpeechItem} */
  const item = { text, key, rate: opts.rate || SPEECH_RATE, demand: !!opts.demand, el: opts.el || null };
  const entry = { item, scene: voiceScene };
  const synth = window.speechSynthesis;
  if (opts.interrupt || (speaking && speaking.scene !== voiceScene)) {
    cutSpeech();
    playNow(entry);
    return;
  }
  // rien ne parle vraiment (ou une fin perdue) : la phrase part tout de suite
  // (un clip qui charge ou qui joue parle aussi, sans que Web Speech le sache)
  if (!speaking || !(synth.speaking || synth.pending || clipBusy)) {
    forgetSpeaking();
    playNow(entry);
    return;
  }
  // une lecture automatique déjà en cours ou en attente ne se répète pas
  if (!item.demand && (speaking.item.key === key || speechQueue.some((e) => e.item.key === key))) return;
  speechQueue.push(entry);
  // la file ne grossit pas : au-delà de 3 phrases en attente, la plus ancienne
  // part. Les choix écrits d'une question (surlignés : `el`) sont une liste
  // finie, lue en entier : ils ne comptent pas et ne sont jamais retirés.
  const loose = speechQueue.filter((e) => !e.item.el);
  if (loose.length > QUEUE_MAX) speechQueue.splice(speechQueue.indexOf(loose[0]), 1);
}

// Branche les boutons d'écoute : les 🔈 (`.btn-speak[data-say]`), et tout
// `[data-say]` qui n'a pas d'action (pas actif, ou bouton sans handler comme
// l'image d'un objet du marché). Un élément qui agit garde son handler : son
// `data-say` lui sert de libellé (écoute au doigt). Les choix d'un mini-jeu
// (`data-voix`) sont des réponses, jamais des boutons d'écoute.
function bindSpeakButtons() {
  document.querySelectorAll('[data-say]').forEach((b) => {
    if (!b.matches('.btn-speak') && (b.hasAttribute('data-voix') || hasHandler(b, 'click'))) return;
    setHandler(b, 'click', (e) => {
      e.stopPropagation();
      // le sélecteur garantit data-say
      speak(/** @type {string} */ (b.dataset.say), {
        interrupt: true,
        demand: true,
        el: b.matches('.btn-speak') ? null : b,
      });
    });
  });
}
/**
 * @param {string} text
 * @param {string} [extraStyle]
 */
function speechBubble(text, extraStyle = '') {
  return `<div class="speech with-voice" style="${extraStyle}">
    <span class="txt">${text}</span>
    <button class="btn-speak" data-say="${text.replace(/"/g, '&quot;').replace(/<[^>]+>/g, '')}" aria-label="Écouter">🔈</button>
  </div>`;
}

initClips();

if ('speechSynthesis' in window) {
  pickVoice();
  setHandler(window.speechSynthesis, 'voiceschanged', pickVoice);
}

export {
  bindSpeakButtons,
  emojiWord,
  keepSpeech,
  newVoiceScene,
  speak,
  speakCallCount,
  speechBubble,
  stopSpeech,
  voiceOfflineState,
};
