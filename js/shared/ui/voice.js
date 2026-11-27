/* ---------- Voix (clips enregistrés, Web Speech en repli) ----------
   La file de parole et Web Speech vivent ici ; le choix de la voix de
   l'appareil dans voice-choice.js, le lecteur de clips dans voice-player.js,
   leur cache hors ligne dans voice-cache.js. */
import { audioPrefs, setVoiceDuck } from './sound.js';
import { emojiWord, toSpoken } from '../lib/index.js';
import { hasHandler, setHandler } from './handlers.js';
import { bestFrenchVoice } from './voice-choice.js';
import { voiceOfflineState } from './voice-cache.js';
import { SPEECH_RATE, clipFor, clipIsBusy, playClip } from './voice-player.js';

/** @type {SpeechSynthesisVoice | null} */
let chosenVoice = null;

function pickVoice() {
  if (!('speechSynthesis' in window)) return null;
  const best = bestFrenchVoice(window.speechSynthesis.getVoices());
  if (best) chosenVoice = best;
  return best;
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

// Lecteur d'une phrase : son clip s'il y en a un de jouable, sinon Web Speech.
/**
 * @param {SpeechItem} item
 * @param {() => void} done
 * @returns {() => void}
 */
function playItem(item, done) {
  const clip = clipFor(item);
  return clip ? playClip(item, clip, { done, speech: playSpeech }) : playSpeech(item, done);
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
  if (!speaking || !(synth.speaking || synth.pending || clipIsBusy())) {
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
// (`data-voix`) sont des réponses, jamais des boutons d'écoute. Un 🔈 déjà
// branché garde aussi son handler (il lit son `data-say` au moment du toucher) :
// un indice ou un conseil affiché en cours de jeu rappelle cette fonction, et
// ne doit pas défaire le 🔈 de la consigne qui relit aussi les choix (`bindQuit`).
function bindSpeakButtons() {
  document.querySelectorAll('[data-say]').forEach((b) => {
    if (hasHandler(b, 'click') || (!b.matches('.btn-speak') && b.hasAttribute('data-voix'))) return;
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
