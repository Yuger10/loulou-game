/* Jeu 1 : mémoire (pas de minuteur : tâche à plusieurs étapes, voir
   js/entities/difficulty/difficulty.js § « MINUTEUR » pour la justification). */
import { memoryPairs } from '../../../entities/difficulty/index.js';
import { ALL_ITEMS } from '../../../entities/item/index.js';
import { pickRandom, random, shuffle } from '../../../shared/lib/index.js';
import { openModal, playSound, setHandler } from '../../../shared/ui/index.js';
import { gameDiff } from '../../adaptive/index.js';
import { registerHints, setHintQuestion } from '../../hints/index.js';
import {
  flashModal,
  livesBar,
  loseLife,
  progressDots,
  registerGame,
  setSolution,
  setupLives,
  solSel,
  winSoon,
} from '../../minigame-engine/index.js';
import { bindQuit, gameHeader } from '../../screen/index.js';

/** @typedef {{ id: number, emoji: string, flipped: boolean, matched: boolean }} MemoryCard */
/** @typedef {{ cards: MemoryCard[] }} MemoryQuestion la question, pour les indices */

function renderMemory() {
  setupLives('memory');
  const dd = gameDiff();
  const pairs = memoryPairs(dd);
  const pool = shuffle(Object.values(ALL_ITEMS).map((i) => i.emoji)).slice(0, pairs);
  /** @type {MemoryCard[]} */
  const cards = shuffle([...pool, ...pool]).map((e, i) => ({ id: i, emoji: e, flipped: false, matched: false }));
  /** @type {MemoryCard | null} */
  let first = null,
    lock = false;
  const cols3 = pairs === 3;
  /** @type {MemoryQuestion} */
  const q = { cards }; // la question, pour les indices
  // tests : les paires, deux cartes à la fois
  {
    /** @type {Record<string, number[]>} */
    const by = {};
    cards.forEach((c) => (by[c.emoji] = by[c.emoji] || []).push(c.id));
    setSolution(
      Object.values(by)
        .flat()
        .map((id) => solSel('.mcard', 'id', id)),
    );
  }

  function render() {
    openModal(`
      ${gameHeader('🧠 Jeu de mémoire', 'Retrouve les paires identiques')}
      ${livesBar()}
      ${progressDots(cards.filter((c) => c.matched).length / 2, pairs)}
      <div class="memory-grid ${cols3 ? 'cols3' : ''}">
        ${cards.map((c) => `<button type="button" class="mcard ${c.matched ? 'matched' : c.flipped ? 'flipped' : ''}" data-id="${c.id}" ${c.matched ? 'disabled' : ''} aria-label="Carte ${c.id + 1}">${c.flipped || c.matched ? c.emoji : ''}</button>`).join('')}
      </div>
    `);
    bindQuit();
    setHintQuestion('memory', q); // même question à chaque nouveau dessin : les indices restent
    document.querySelectorAll('.mcard').forEach((el) => {
      setHandler(el, 'click', () => {
        const id = Number(el.dataset.id);
        const card = /** @type {MemoryCard} */ (cards.find((c) => c.id === id)); // la carte touchée existe toujours
        if (lock || card.flipped || card.matched) return;
        playSound('tap');
        card.flipped = true;
        render();
        if (!first) {
          first = card;
          return;
        }
        lock = true;
        const second = card;
        const isMatch = first.emoji === second.emoji;
        setTimeout(
          () => {
            const wasMatch = isMatch;
            // verrouillé (lock) : la première carte est encore posée
            if (isMatch) {
              /** @type {MemoryCard} */ (first).matched = true;
              second.matched = true;
            } else {
              /** @type {MemoryCard} */ (first).flipped = false;
              second.flipped = false;
            }
            first = null;
            lock = false;
            render();
            if (wasMatch) {
              playSound('good');
              document.querySelectorAll('.mcard.matched').forEach((m) => {
                m.classList.add('ok-flash');
                setTimeout(() => m.classList.remove('ok-flash'), 600);
              });
            } else {
              if (loseLife(null)) return; // plus d'essais : mission ratée
            }
            if (cards.every((c) => c.matched)) {
              flashModal('ok');
              winSoon();
            }
          },
          isMatch ? 350 : 700,
        );
      });
    });
  }
  render();
}

/* Indices (v52) : 1. retourner une carte et chercher sa jumelle, en
   retenant les places ; 2. si une carte est retournée : sa jumelle est parmi
   3 cartes qui brillent ; sinon, une carte se montre un instant (à retenir). */
/** @param {MemoryQuestion} q */
function memoryHints(q) {
  const hidden = q.cards.filter((c) => !c.matched && !c.flipped);
  const up = q.cards.filter((c) => c.flipped && !c.matched);
  const first = up.length === 1 ? up[0] : null; // une carte retournée, en attente de sa jumelle
  let two;
  if (first) {
    const twin = q.cards.find((c) => c !== first && c.emoji === first.emoji);
    const i = hidden.indexOf(/** @type {MemoryCard} */ (twin)); // une paire a toujours sa jumelle
    const start = Math.max(0, Math.min(i - Math.floor(random() * 3), hidden.length - 3));
    const group = hidden.slice(start, start + 3);
    two = {
      say: 'Sa jumelle se cache parmi les cartes qui brillent !',
      fx: { glow: group.map((c) => solSel('.mcard', 'id', c.id)).join(', ') },
    };
  } else {
    const peek = pickRandom(hidden);
    two = {
      say: 'Je te montre une carte un petit instant : retiens-la bien !',
      fx: {
        /** @param {HTMLElement} root */
        run(root) {
          const el = peek && root.querySelector(solSel('.mcard', 'id', peek.id));
          if (!el) return;
          el.textContent = peek.emoji;
          el.classList.add('flipped', 'hint-glow');
          setTimeout(() => {
            if (el.isConnected && !peek.flipped && !peek.matched) {
              el.textContent = '';
              el.classList.remove('flipped', 'hint-glow');
            }
          }, 1400);
        },
      },
    };
  }
  return [
    {
      say: 'Retourne une carte, puis cherche sa jumelle. Retiens bien où sont les images déjà vues !',
      fx: { glow: '.memory-grid' },
    },
    two,
  ];
}

// inscription auprès du moteur de mini-jeux (js/features/minigame-engine)
registerGame('memory', renderMemory);
registerHints('memory', memoryHints);
