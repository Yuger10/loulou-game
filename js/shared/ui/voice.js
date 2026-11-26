/* ---------- Voix (Web Speech) ---------- */
import { audioPrefs, setVoiceDuck } from './sound.js';
import { emojiWord, toSpoken } from '../lib/index.js';
import { hasHandler, setHandler } from './handlers.js';

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

// Lecteur d'une phrase (Web Speech). `done` est appelé une seule fois : à la
// fin, à l'erreur ou à l'arrêt. Rend la fonction qui arrête la lecture.
/**
 * @param {SpeechItem} item
 * @param {() => void} done
 * @returns {() => void}
 */
function playItem(item, done) {
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
  const item = { text, key, rate: opts.rate || 0.92, demand: !!opts.demand, el: opts.el || null };
  const entry = { item, scene: voiceScene };
  const synth = window.speechSynthesis;
  if (opts.interrupt || (speaking && speaking.scene !== voiceScene)) {
    cutSpeech();
    playNow(entry);
    return;
  }
  // rien ne parle vraiment (ou une fin perdue) : la phrase part tout de suite
  if (!speaking || !(synth.speaking || synth.pending)) {
    speaking = null; // une fin perdue : la phrase d'avant est oubliée
    playNow(entry);
    return;
  }
  // une lecture automatique déjà en cours ou en attente ne se répète pas
  if (!item.demand && (speaking.item.key === key || speechQueue.some((e) => e.item.key === key))) return;
  speechQueue.push(entry);
  if (speechQueue.length > QUEUE_MAX) speechQueue.shift();
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

if ('speechSynthesis' in window) {
  pickVoice();
  setHandler(window.speechSynthesis, 'voiceschanged', pickVoice);
}

export { bindSpeakButtons, emojiWord, newVoiceScene, speak, speakCallCount, speechBubble, stopSpeech };
