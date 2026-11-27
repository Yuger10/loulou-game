/* ---------- Mini-jeu : La phrase rigolote (Monde des Chatouilles, saison 3) ----------
   La lecture : les mots d'une phrase drôle sont mélangés. L'enfant touche
   une étiquette pour l'entendre et la poser dans la ligne ; la toucher encore
   la renvoie à sa place. Quand la ligne est pleine, la phrase est lue telle
   qu'elle est construite : entendre l'ordre absurde fait rire.
   Une phrase dite = un seul `speak` (il coupe la phrase en cours) : la phrase
   construite et son message partent ensemble, après `loseLife` (spec D8).
   1ʳᵉ erreur : les étiquettes restent ; 2ᵉ : une autre phrase (comme le
   miroir). La banque : sentence-bank.js ; les paliers : `sentenceRound`.
   Sans minuteur. */
import { sentenceRound } from '../../../entities/difficulty/index.js';
import { party } from '../../../entities/player/index.js';
import { pickRandom, shuffle } from '../../../shared/lib/index.js';
import { giggle, openModal, setHandler, speak } from '../../../shared/ui/index.js';
import { gameDiff } from '../../adaptive/index.js';
import { registerHints, setHintQuestion } from '../../hints/index.js';
import {
  flashModal,
  livesBar,
  loseLife,
  registerGame,
  setSolution,
  setupLives,
  solSel,
  stepOk,
  WIN_DELAY_LONG,
  winSoon,
} from '../../minigame-engine/index.js';
import { bindQuit, gameHeader } from '../../screen/index.js';
import { sentenceAccepts, SENTENCES } from './sentence-bank.js';

/** @typedef {import('./sentence-bank.js').SentenceEntry} SentenceEntry */
/** @typedef {{ entry: SentenceEntry, errors: number, over: boolean }} SentenceGame la phrase en cours et ses erreurs */
/** @typedef {{ pic: boolean }} SentenceHintQ la question d'indice : l'image est-elle montrée ? */
/** @typedef {import('../../hints/index.js').HintProvider<SentenceHintQ>} SentenceHintProvider */

const SENTENCE_TITLE = '📝 La phrase rigolote';
const SENTENCE_START = "Les mots de Lulu se sont mélangés ! Touche un mot pour l'entendre et le mettre dans la phrase.";
const SENTENCE_SAY_PIC = `${SENTENCE_START} Regarde l'image : elle montre ce que dit la phrase.`;
const SENTENCE_SAY = `${SENTENCE_START} Quand la phrase est finie, je la lis.`;
const SENTENCE_WIN = 'Bravo, ta phrase veut dire quelque chose !';
const SENTENCE_WRONG =
  'Hi hi hi ! Ta phrase est rigolote, mais elle ne veut rien dire. Touche un mot pour le changer de place.';
const SENTENCE_AGAIN = 'Hi hi hi ! Allez, une nouvelle phrase !';
const SENTENCE_EMPTY = 'Ta phrase est encore vide. Touche un mot !';

let sentenceLast = '';

/** @param {string} sel @returns {HTMLElement[]} */
function sentenceAll(sel) {
  return [...document.querySelectorAll(sel)].map((el) => /** @type {HTMLElement} */ (el));
}
/** Les mots posés dans la ligne, dans l'ordre des cases. */
function sentenceBuilt() {
  return sentenceAll('#st-line .st-slot .st-tile').map((el) => el.textContent || '');
}
/**
 * Un ordre de départ qui n'est aucun des ordres acceptés (rangs des mots dans `t`).
 * @param {SentenceEntry} entry
 * @returns {number[]}
 */
function sentenceMix(entry) {
  const words = entry.t.split(' ');
  let order = words.map((_w, i) => i);
  for (let k = 0; k < 30; k++) {
    order = shuffle(order);
    if (!sentenceAccepts(entry, order.map((i) => words[i]).join(' '))) return order;
  }
  return order.reverse(); // jamais vu : une phrase à l'envers n'est pas une phrase
}

/**
 * La dernière case vient d'être remplie : la phrase construite est lue, puis jugée.
 * @param {SentenceGame} g
 * @param {HTMLElement} last la dernière étiquette posée
 */
function sentenceJudge(g, last) {
  const built = sentenceBuilt().join(' ');
  if (sentenceAccepts(g.entry, built)) {
    g.over = true;
    speak(`${built} ${SENTENCE_WIN}`);
    sentenceAll('.st-tile').forEach((el) => el.classList.add('lit'));
    stepOk(last);
    flashModal('ok');
    winSoon(WIN_DELAY_LONG);
    return;
  }
  g.errors++;
  giggle(document.getElementById('st-line'));
  // à plusieurs, le moteur passe la main sans rien relancer : la phrase reste, comme à la 1ʳᵉ erreur
  const second = g.errors >= 2 && !party.active;
  const lost = loseLife(last, second ? { onRetry: sentenceNext, disable: false } : { disable: false });
  // « une nouvelle phrase » ne s'annonce que si elle arrive : pas quand les essais sont épuisés
  speak(`${built} ${second && !lost ? SENTENCE_AGAIN : SENTENCE_WRONG}`);
  g.over = second || lost;
}
/**
 * Toucher une étiquette : dans la réserve, elle va dans la première case vide
 * de la ligne ; dans la ligne, elle retourne à sa place. Le mot est dit, sauf
 * quand il finit la phrase : c'est alors toute la phrase qui est lue.
 * @param {SentenceGame} g
 * @param {HTMLElement} tile
 */
function sentenceTap(g, tile) {
  if (g.over) return;
  const home = document.querySelector(`#st-reserve .st-home[data-h="${tile.dataset.i}"]`);
  const word = (tile.textContent || '').replace(/\.$/, '');
  if (tile.closest('#st-line')) {
    if (home) home.appendChild(tile).parentElement?.classList.remove('st-gap');
    speak(word);
    return;
  }
  const slot = sentenceAll('#st-line .st-slot').find((el) => !el.firstElementChild);
  if (!slot || !home) return;
  slot.appendChild(tile);
  home.classList.add('st-gap');
  if (sentenceAll('#st-line .st-slot').every((el) => el.firstElementChild)) sentenceJudge(g, tile);
  else speak(word);
}
/** « Lis ma phrase » : les mots posés, tels quels, dans l'ordre de la ligne. */
function sentenceRead() {
  const built = sentenceBuilt();
  speak(built.length ? built.join(' ') : SENTENCE_EMPTY);
}

/**
 * Affiche une phrase. La solution : les étiquettes dans l'ordre de `t`.
 * @param {SentenceEntry} entry
 */
function sentenceShow(entry) {
  sentenceLast = entry.t; // la phrase affichée ne reviendra pas tout de suite
  const words = entry.t.split(' ');
  const pic = sentenceRound(gameDiff()).pic && !!entry.pic;
  const tiles = sentenceMix(entry)
    .map((i) => `<span class="st-home" data-h="${i}"><button class="st-tile" data-i="${i}">${words[i]}</button></span>`)
    .join('');
  openModal(`
    ${gameHeader(SENTENCE_TITLE, "Remets les mots dans l'ordre", pic ? SENTENCE_SAY_PIC : SENTENCE_SAY)}
    ${livesBar()}
    ${pic ? `<div class="st-pic" id="st-pic" aria-hidden="true">${entry.pic}</div>` : ''}
    <div class="st-line" id="st-line">${words.map(() => '<span class="st-slot"></span>').join('')}</div>
    <div class="st-reserve" id="st-reserve">${tiles}</div>
    <button class="btn-ghost st-read" id="st-read">🔊 Lis ma phrase</button>
  `);
  bindQuit();
  setSolution(words.map((_w, i) => solSel('.st-tile', 'i', i)));
  setHintQuestion('sentence', { pic }, { choices: '.st-tile' });
  /** @type {SentenceGame} */
  const g = { entry, errors: 0, over: false };
  sentenceAll('.st-tile').forEach((el) => setHandler(el, 'click', () => sentenceTap(g, el)));
  setHandler(document.getElementById('st-read'), 'click', sentenceRead);
}

// Une autre phrase, dans la même mission : les essais perdus le restent.
function sentenceNext() {
  const bank = SENTENCES[sentenceRound(gameDiff()).n];
  // jamais la même phrase que la précédente
  const entry = pickRandom(bank.filter((e) => e.t !== sentenceLast));
  sentenceShow(entry);
}
function renderSentence() {
  setupLives('sentence');
  sentenceNext();
}

// Indices (table H2) : 1. écouter et chercher qui fait quoi ; 2. le premier mot. Aucune étiquette écartée.
/** @type {SentenceHintProvider} */
const sentenceHints = (q) => [
  {
    say: `Touche chaque mot pour l'écouter. Puis cherche : qui fait quoi ?${q.pic ? " Regarde l'image pour t'aider." : ''}`,
    fx: { glow: '#st-reserve' },
  },
  {
    say: 'Une phrase commence par une grande lettre et finit par un point. Je te montre le premier mot.',
    fx: { glow: '.st-tile[data-i="0"]' },
  },
];

registerGame('sentence', renderSentence);
registerHints('sentence', sentenceHints);
