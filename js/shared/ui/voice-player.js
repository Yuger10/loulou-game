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
import { setVoiceDuck } from './sound.js';
import { setHandler } from './handlers.js';
import { VOICE_CLIPS, VOICE_UNLOCK } from './voice-clips.js';
import { fillVoiceCache, resetVoiceOffline } from './voice-cache.js';

/** @typedef {import('./voice.js').SpeechItem} SpeechItem */
/** @typedef {{ hash: string, slow: boolean }} ClipChoice */
/** @typedef {{ done: () => void, speech: (item: SpeechItem, done: () => void) => () => void }} ClipHooks */
/** @typedef {{ live: boolean, started: boolean, url: string, timer: ReturnType<typeof setTimeout> | undefined, speechStop: (() => void) | null }} ClipTurn */

const SPEECH_RATE = 0.92; // la vitesse normale de la voix (les clips sont générés à cette vitesse)
const CLIP_HASH = /^[0-9a-f]{12}$/; // seule forme d'empreinte qui part en fetch
const CLIP_TIMEOUT = 1500; // au-delà, Web Speech prend la place du clip
const CLIP_SLOW_RATE = 0.8; // la relecture lente de Perle, hauteur conservée
const VOICE_FILL_DELAY = 5000; // le téléchargement de fond attend que le jeu soit lancé

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

// un clip charge ou joue : il parle aussi, sans que Web Speech le sache
function clipIsBusy() {
  return clipBusy;
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

// Le clip rend la parole : les sons remontent, son URL est libérée.
/**
 * @param {ClipTurn} turn
 * @param {SpeechItem} item
 */
function leaveClip(turn, item) {
  turn.live = false;
  clearTimeout(turn.timer);
  clipBusy = false;
  if (turn.url) URL.revokeObjectURL(turn.url);
  turn.url = '';
  if (item.el) item.el.classList.remove('voix-lu');
  setVoiceDuck(false);
}

/** @param {HTMLAudioElement} a */
function silenceClip(a) {
  try {
    a.pause();
    a.removeAttribute('src');
    a.load();
  } catch {
    // élément audio en panne : rien à arrêter
  }
}

// Le fichier d'un clip : rejeté hors ligne et pas en cache, sur une erreur réseau ou une réponse non 200.
/** @param {string} hash */
function fetchClip(hash) {
  /** @type {Promise<Response>} */
  let request;
  try {
    request = fetch('voix/' + hash + '.mp3');
  } catch (e) {
    request = Promise.reject(e);
  }
  return request.then((res) => {
    if (res.status !== 200) throw new Error('clip introuvable');
    return res.blob();
  });
}

// La source et la vitesse de l'élément audio, puis play() : rend sa promesse.
/**
 * @param {HTMLAudioElement} a
 * @param {string} url
 * @param {boolean} slow
 */
function startClip(a, url, slow) {
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
  clipPlays++;
  return Promise.resolve(a.play());
}

// Lecteur d'une phrase par son clip. Même contrat que le lecteur Web Speech
// (`hooks.speech`) : `hooks.done` une seule fois, et la fonction rendue arrête la lecture.
/**
 * @param {SpeechItem} item
 * @param {ClipChoice} clip
 * @param {ClipHooks} hooks
 * @returns {() => void}
 */
function playClip(item, clip, hooks) {
  const a = clipElement();
  // `live` : le clip tient encore la parole
  /** @type {ClipTurn} */
  const turn = { live: true, started: false, url: '', timer: undefined, speechStop: null };
  clipBusy = true;
  const end = () => {
    if (!turn.live) return;
    leaveClip(turn, item);
    hooks.done();
  };
  // Web Speech dit la phrase à la place du clip, à sa place dans la file
  const fallback = () => {
    if (!turn.live) return;
    leaveClip(turn, item);
    if (turn.started) silenceClip(a);
    turn.speechStop = hooks.speech(item, hooks.done);
  };
  // le navigateur refuse de jouer (pas encore de geste) : Web Speech jusqu'au prochain geste
  const refused = () => {
    if (!turn.live) return;
    clipsOff = true;
    fallback();
  };
  const onPlaying = () => {
    if (!turn.live) return;
    clearTimeout(turn.timer);
    clipsUnlocked = true;
    if (item.el) item.el.classList.add('voix-lu');
    // tout le bus audio baisse pendant que la voix parle (js/shared/ui/sound.js)
    setVoiceDuck(true);
  };
  turn.timer = setTimeout(fallback, CLIP_TIMEOUT);
  fetchClip(clip.hash)
    .then((blob) => {
      if (!turn.live) return; // arrivé trop tard : Web Speech a déjà pris la place
      turn.url = URL.createObjectURL(blob);
      setHandler(a, 'playing', onPlaying);
      setHandler(a, 'ended', end);
      setHandler(a, 'error', end);
      turn.started = true;
      startClip(a, turn.url, clip.slow).then(() => turn.live && clearTimeout(turn.timer), refused);
    })
    .catch(fallback); // hors ligne et pas en cache, erreur réseau, réponse non 200
  return () => {
    if (turn.speechStop) turn.speechStop();
    else if (turn.live) {
      leaveClip(turn, item);
      silenceClip(a);
      hooks.done();
    }
  };
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
  resetVoiceOffline(clipHashes().length);
  if (!clipsReady) return;
  if (!clipGestures) {
    clipGestures = true;
    // en capture : le lecteur est déverrouillé avant que l'action du bouton ne parle
    document.addEventListener('pointerdown', onClipGesture, { capture: true });
  }
  setTimeout(() => {
    if (session === clipSession) void fillVoiceCache(clipHashes(), () => session === clipSession);
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

initClips();

export { SPEECH_RATE, clipFor, clipIsBusy, playClip };
