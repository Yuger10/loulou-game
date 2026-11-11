/* Slice « shared-ui » (couche shared) : son API publique. Les autres slices
   n'importent que ce fichier (vérifié par test/slices.test.js). */
export { uiIcon } from './icons.js';
export { audioCtx, ensureAudioCtx, musicBusNode, playNote, playSound, setAudioPrefsSource, soundModeLabel } from './sound.js';
export { bindSpeakButtons, emojiWord, speak, speechBubble } from './voice.js';
export { confetti, onWrongFeedback, shakeEl, showToast, vibrate, wrongFeedback } from './feedback.js';
export { closeModal, onModalChange, onModalClose, onModalOpen, openModal } from './modal.js';
export { registerView, switchView } from './views.js';
