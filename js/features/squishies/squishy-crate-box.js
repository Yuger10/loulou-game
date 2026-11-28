/* ---------- 🗃️ Mes boîtes : la boîte ouverte ----------
   Ses 6 cases, et en dessous le tapis des squishies libres. On range en
   faisant glisser un squishy du tapis vers la boîte, ou en le touchant puis
   en touchant la boîte (ce repli marche partout). Un squishy qui ne va pas
   dans la boîte rebondit, avec un indice parlé : rien n'est retiré, rien
   n'est compté. Après 3 erreurs d'affilée, les bons brillent. Un seul appel à
   speak() par geste : un nouvel appel couperait la phrase en cours. */
import { crateCriteria } from '../../entities/game-state/index.js';
import { SQUISHIES } from '../../entities/squishy/index.js';
import { confetti, playSound, setHandler, speak, vibrate } from '../../shared/ui/index.js';
import { gainCoins } from '../gains/index.js';
import { sortMatches, squishyFree, squishySeriesAvailable } from './squishies.js';
import { squishyArtSVG } from './squishy-art.js';
import {
  CRATE_SLOTS,
  crateAdd,
  crateEmpty,
  crateRemove,
  crateWrongHint,
  squishyCrates,
} from './squishy-crate-rules.js';
import { cb, cbLater, cbPickLabel, cbRender, cbRoom, cbShowCards, crateLabelHTML } from './squishy-crate-view.js';

const CRATE_DRAG_START = 8; // pixels avant de soulever le squishy (un simple toucher ne glisse pas)
const CRATE_GLOW_MS = 3000; // les bons squishies brillent 3 secondes
const CRATE_WRONG_MAX = 3; // erreurs d'affilée avant de les faire briller

// le tapis : un bouton par modèle libre, dans l'ordre du catalogue (jamais
// les bons d'abord : ce serait donner la réponse)
function crateTrayIds() {
  return Object.keys(SQUISHIES).filter((id) => squishySeriesAvailable(SQUISHIES[id].series) && squishyFree(id) > 0);
}
/**
 * Ouvre une boîte et le dit : son nom, puis la consigne (ou « tout est rangé »).
 * @param {number} i
 * @param {string} intro « Ta boîte des squishies roses. » ou « Voilà ta boîte… ! »
 * @param {string} end la ponctuation de la consigne
 */
function crateOpenBox(i, intro, end) {
  cb.pick = null;
  cb.open = i;
  cb.sel = null;
  cb.wrong = 0;
  cbRender();
  speak(
    crateTrayIds().length
      ? `${intro} Fais glisser tes squishies dedans${end === '!' ? ' !' : '.'}`
      : `${intro} Tous tes squishies sont déjà rangés !`,
  );
}
/**
 * @param {HTMLElement} el
 * @param {number} i
 * @param {number} [fresh] la case qui vient d'être remplie (elle saute)
 */
function crateRenderOpen(el, i, fresh) {
  const c = squishyCrates()[i],
    tray = crateTrayIds();
  el.innerHTML = `<div class="cb-open">
      <div class="cb-head"><span class="cb-label">${crateLabelHTML(c.label)}</span><span class="cb-count">${c.items.length} / ${CRATE_SLOTS}</span></div>
      <div class="cb-crate ${c.items.length >= CRATE_SLOTS ? 'full' : ''}" id="cb-crate" data-crate="${i}">
        ${Array.from({ length: CRATE_SLOTS }, (_, pos) => {
          const id = c.items[pos];
          return `<button type="button" class="cb-slot ${id ? 'in' : ''} ${pos === fresh ? 'fresh' : ''}" data-pos="${pos}" aria-label="${id ? SQUISHIES[id].name + ', le sortir de la boîte' : 'Case vide'}">${id ? squishyArtSVG(id) : ''}</button>`;
        }).join('')}
      </div>
      ${
        tray.length
          ? `<div class="cb-tray" id="cb-tray">${tray
              .map((id) => {
                const n = squishyFree(id);
                return `<button type="button" class="sq-cell cb-item ${cb.sel === id ? 'selected' : ''}" data-id="${id}" aria-label="${SQUISHIES[id].name}${n > 1 ? ', ' + n : ''}">${squishyArtSVG(id)}${n > 1 ? `<span class="sq-n">×${n}</span>` : ''}</button>`;
              })
              .join('')}</div>`
          : `<p class="cb-none">Tous tes squishies sont déjà rangés !</p>`
      }
      <div class="cb-actions">
        <button type="button" class="cb-btn" id="cb-back">⬅️ Mes boîtes</button>
        ${
          c.items.length
            ? `<button type="button" class="cb-btn" id="cb-empty">↩️ Tout sortir</button>`
            : `<button type="button" class="cb-btn" id="cb-relabel">🏷️ Changer l'étiquette</button>`
        }
      </div>
    </div>`;
  crateBindOpen(el, i);
}
/** @param {HTMLElement} el @param {number} i */
function crateBindOpen(el, i) {
  el.querySelectorAll('.cb-slot').forEach((b) => {
    setHandler(b, 'click', () => crateSlotTap(i, Number(b.dataset.pos)));
  });
  // sans PointerEvent (vieux navigateur) : pas de glisser, le toucher puis toucher suffit
  const canDrag = typeof window.PointerEvent === 'function';
  /** @type {NodeListOf<HTMLButtonElement>} */ (el.querySelectorAll('.cb-item')).forEach((b) => {
    setHandler(b, 'click', () => crateItemTap(b));
    if (canDrag) setHandler(b, 'pointerdown', (e) => crateDrag(i, b, e));
  });
  setHandler(document.getElementById('cb-back'), 'click', () => {
    playSound('tap');
    cbShowCards();
  });
  setHandler(document.getElementById('cb-empty'), 'click', () => {
    playSound('tap');
    crateEmpty(i);
    cb.sel = null;
    cbRender();
    speak('Tes squishies sont sortis de la boîte.');
  });
  setHandler(document.getElementById('cb-relabel'), 'click', () => {
    playSound('tap');
    cbPickLabel(i);
  });
}
// toucher un squishy du tapis : le choisir (ou le reposer)
/** @param {HTMLButtonElement} btn */
function crateItemTap(btn) {
  if (cb.justDragged) {
    cb.justDragged = false;
    return;
  }
  const id = /** @type {string} */ (btn.dataset.id); // posé par crateRenderOpen
  playSound('tap');
  cb.sel = cb.sel === id ? null : id;
  document.querySelectorAll('.cb-item').forEach((b) => b.classList.toggle('selected', b.dataset.id === cb.sel));
  if (cb.sel) speak(`${SQUISHIES[id].name}. Touche la boîte pour le ranger !`);
}
// toucher la boîte : y ranger le squishy choisi ; sinon, sortir celui de la case
/** @param {number} i @param {number} pos */
function crateSlotTap(i, pos) {
  if (cb.sel) return crateTryAdd(i, cb.sel);
  if (pos < squishyCrates()[i].items.length) {
    crateRemove(i, pos);
    playSound('pop');
    cbRender();
    return;
  }
  playSound('tap');
  speak("Choisis d'abord un squishy, en dessous.");
}
/** @param {string} id @returns {HTMLElement | null} le bouton de ce squishy sur le tapis */
function crateTrayButton(id) {
  return (
    /** @type {HTMLElement | null} */ (
      [...document.querySelectorAll('.cb-item')].find((b) => b.dataset.id === id) || null
    )
  );
}
// il ne va pas là : il rebondit sur le tapis, avec ce que dit la voix
/** @param {string} id @param {string} say */
function crateBounce(id, say) {
  cb.sel = null;
  document.querySelectorAll('.cb-item').forEach((b) => b.classList.remove('selected'));
  const btn = crateTrayButton(id);
  if (btn) {
    btn.classList.remove('sr-bounce');
    void btn.offsetWidth;
    btn.classList.add('sr-bounce');
  }
  playSound('wrong');
  vibrate(80);
  speak(say);
}
// 3 erreurs d'affilée : les squishies du tapis qui vont dans la boîte brillent
/** @param {string} label @returns {boolean} au moins un brille */
function crateGlow(label) {
  const rules = crateCriteria(label);
  const good = /** @type {HTMLElement[]} */ ([...document.querySelectorAll('.cb-item')]).filter(
    (b) => !rules || sortMatches(/** @type {string} */ (b.dataset.id), rules),
  );
  good.forEach((b) => b.classList.add('cb-glow'));
  if (good.length) cbLater(() => good.forEach((b) => b.classList.remove('cb-glow')), CRATE_GLOW_MS);
  return good.length > 0;
}
/**
 * Ranger ce squishy dans la boîte ouverte (lâché ou posé) : c'est crateAdd,
 * puis ce qu'on voit et ce qu'on entend.
 * @param {number} i
 * @param {string} id
 */
function crateTryAdd(i, id) {
  const c = squishyCrates()[i];
  const wasPaid = c.done;
  const res = crateAdd(i, id);
  if (res.reason === 'full') return crateBounce(id, 'Cette boîte est pleine ! Range-le dans une autre boîte.');
  if (res.reason === 'wrong') {
    // un label existe : sans lui crateAdd aurait répondu « nolabel »
    const label = /** @type {string} */ (c.label);
    const hint = crateWrongHint(id, label);
    cb.wrong++;
    if (cb.wrong < CRATE_WRONG_MAX) return crateBounce(id, hint);
    cb.wrong = 0;
    return crateBounce(id, crateGlow(label) ? `${hint} Regarde ceux qui brillent !` : hint);
  }
  if (!res.ok) return; // bad, nolabel, none : l'interface ne les produit pas
  cb.wrong = 0;
  cb.sel = null;
  const el = cbRoom();
  if (el) crateRenderOpen(el, i, c.items.length - 1);
  vibrate(30);
  if (!res.full) {
    playSound('good');
    return;
  }
  // la boîte est pleine : le seul son est celui de la fête
  playSound('win');
  if (res.coins) {
    confetti();
    gainCoins(res.coins, document.getElementById('cb-crate'));
    speak(
      `Bravo, ta boîte est pleine ! Tu gagnes ${res.coins} pièces${res.newCrate ? ' et une nouvelle boîte' : ''} !${res.unlock ? ' Maintenant, une étiquette peut avoir deux règles !' : ''}`,
    );
  } else speak(wasPaid ? 'Ta boîte est pleine, bravo !' : 'Ta boîte de préférés est pleine !');
}

/* ---- glisser au doigt (comme le puzzle) : un fantôme suit le doigt, et le
   squishy est lâché sur la boîte. Le tapis défile de côté (touch-action:
   pan-x) : c'est un geste vers le haut qui soulève le squishy. ---- */
/**
 * @param {number} i la boîte ouverte
 * @param {HTMLButtonElement} btn le bouton du tapis
 * @param {PointerEvent} e
 */
function crateDrag(i, btn, e) {
  if (e.button != null && e.button > 0) return;
  const id = /** @type {string} */ (btn.dataset.id); // posé par crateRenderOpen
  const x0 = e.clientX,
    y0 = e.clientY;
  /** @type {HTMLElement | null} */
  let ghost = null;
  /** @type {DOMRect | null} */
  let box = null;
  try {
    btn.setPointerCapture(e.pointerId);
  } catch {
    // capture refusée (vieux navigateur) : le glisser marche tant que le doigt reste sur le bouton
  }
  /** @param {PointerEvent} ev */
  const move = (ev) => {
    if (!ghost) {
      if (Math.hypot(ev.clientX - x0, ev.clientY - y0) < CRATE_DRAG_START) return;
      box = btn.getBoundingClientRect();
      ghost = /** @type {HTMLElement} */ (btn.cloneNode(true));
      ghost.removeAttribute('id');
      ghost.classList.remove('selected', 'sr-bounce', 'cb-glow');
      ghost.classList.add('cb-drag');
      ghost.style.width = box.width + 'px';
      ghost.style.height = box.height + 'px';
      document.body.appendChild(ghost);
      btn.classList.add('lifted');
    }
    // box est mesurée en même temps que le fantôme
    ghost.style.left = ev.clientX - /** @type {DOMRect} */ (box).width / 2 + 'px';
    ghost.style.top = ev.clientY - /** @type {DOMRect} */ (box).height / 2 + 'px';
  };
  /** @param {PointerEvent} ev */
  const end = (ev) => {
    btn.removeEventListener('pointermove', move);
    btn.removeEventListener('pointerup', end);
    btn.removeEventListener('pointercancel', end);
    if (!ghost) return;
    ghost.remove();
    btn.classList.remove('lifted');
    cb.justDragged = true;
    cbLater(() => (cb.justDragged = false), 350);
    if (ev.type === 'pointercancel') return;
    const target = document.elementFromPoint(ev.clientX, ev.clientY);
    if (target && target.closest && target.closest('.cb-crate')) crateTryAdd(i, id);
  };
  btn.addEventListener('pointermove', move);
  btn.addEventListener('pointerup', end);
  btn.addEventListener('pointercancel', end);
}

export { crateOpenBox, crateRenderOpen };
