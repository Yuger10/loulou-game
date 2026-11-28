/* ---------- Le xylophone d'or (le trésor de Zap, grand final de la saison 3) ----------
   Un instrument à jouer librement : huit lames dorées, chaque toucher joue sa
   note et lance un ♪. Rien n'est compté : ni mission, ni pièce, ni
   compétence, ni essai.
   Pendant qu'on joue, la musique de l'île passe au thème « concert » (en do,
   comme les lames : jamais de fausse note). Elle revient une seule fois,
   quelle que soit la sortie : « Fini ✨ », la croix, ou une autre fenêtre qui
   remplace celle-ci. Dans le grand final (`theme: false`), c'est le final qui
   gère sa musique. */
import { emit } from '../../shared/lib/index.js';
import { closeModal, onModalClose, onModalOpen, openModal, playSound, setHandler } from '../../shared/ui/index.js';
import { bindQuit, gameHeader } from '../screen/index.js';
import { playXylo, XYLO_NOTES, xyloHTML } from './xylophone.js';

/** @typedef {{ onDone?: () => void, theme?: boolean }} GoldenOptions */

const XYLO_FLOAT_MS = 900; // le ♪ monte puis disparaît
const XYLO_ALL = XYLO_NOTES.map((x) => x.n);

// vrai tant que le thème « concert » remplace la musique de l'île
let xyloTheme = false;
function endXyloTheme() {
  if (!xyloTheme) return;
  xyloTheme = false;
  emit('music:theme', null);
}
onModalClose(endXyloTheme);
onModalOpen(endXyloTheme);

/**
 * Un ♪ de la couleur de la note, qui monte de la lame touchée.
 * @param {HTMLElement} lame
 * @param {number} n
 * @returns {void}
 */
function xyloFloat(lame, n) {
  const box = document.getElementById('xylo-gold');
  if (!box) return;
  const note = document.createElement('span');
  note.className = 'xylo-float';
  note.textContent = '♪';
  note.style.color = XYLO_NOTES[n].color;
  note.style.left = `${lame.offsetLeft + lame.offsetWidth / 2}px`;
  box.appendChild(note);
  setTimeout(() => note.remove(), XYLO_FLOAT_MS);
}

/**
 * Ouvre le xylophone d'or. `onDone` : la suite après « Fini ✨ » (sinon la
 * fenêtre se ferme).
 * @param {GoldenOptions} [opts]
 * @returns {void}
 */
function openGoldenXylophone(opts = {}) {
  openModal(`
    ${gameHeader("🎼 Le xylophone d'or", 'Joue ce que tu veux !', "C'est ton xylophone d'or. Touche les lames, et joue ce que tu veux !")}
    ${xyloHTML({ lames: XYLO_ALL, gold: true, id: 'xylo-gold' })}
    <button class="btn-primary" id="xylo-done">Fini ✨</button>
  `);
  bindQuit();
  // posé après openModal : l'ouverture de cette fenêtre ne le remet pas à zéro
  if (opts.theme !== false) {
    xyloTheme = true;
    emit('music:theme', 'concert');
  }
  document.querySelectorAll('#xylo-gold .xylo-lame').forEach((lame) =>
    setHandler(lame, 'click', () => {
      const n = Number(lame.dataset.n);
      playXylo(n, lame);
      xyloFloat(lame, n);
    }),
  );
  setHandler(document.getElementById('xylo-done'), 'click', () => {
    playSound('tap');
    endXyloTheme();
    if (opts.onDone) opts.onDone();
    else closeModal();
  });
}

export { openGoldenXylophone };
