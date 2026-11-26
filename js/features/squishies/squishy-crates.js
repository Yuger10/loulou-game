/* ---------- 🗃️ Mes boîtes : l'onglet des boîtes de rangement durables ----------
   Trois écrans dans la zone de la chambre (#sq-room) :
     les cartes     une carte par boîte : son étiquette en image, ses
                    squishies en petit, « N / 6 »
     l'étiquette    le choix en image (couleur, famille, préférés, puis
                    forme et taille, puis une deuxième règle), et « ✓ Choisir »
     la boîte       ses 6 cases, et en dessous le tapis des squishies libres
   On range en faisant glisser un squishy du tapis vers la boîte, ou en le
   touchant puis en touchant la boîte (ce repli marche partout). Un squishy
   qui ne va pas dans la boîte rebondit, avec un indice parlé : rien n'est
   retiré, rien n'est compté. Après 3 erreurs d'affilée, les bons brillent.
   La logique (crateAdd…) est dans squishy-crate-rules.js. Tout est dit à voix
   haute, et un seul appel à speak() par geste : un nouvel appel couperait la
   phrase en cours. */
import { crateCriteria } from '../../entities/game-state/index.js';
import { currentPlayerAge } from '../../entities/player/index.js';
import { SQUISHIES, SQUISHY_SERIES } from '../../entities/squishy/index.js';
import { confetti, onModalChange, playSound, setHandler, speak, vibrate } from '../../shared/ui/index.js';
import { gainCoins } from '../gains/index.js';
import { sortMatches, squishyFree, squishyOwnedIds, squishySeriesAvailable } from './squishies.js';
import { sortIconsHTML, squishyArtSVG } from './squishy-art.js';
import {
  CRATE_SLOTS,
  crateAdd,
  crateEmpty,
  crateLabelAllowed,
  crateLabelsFor,
  crateLevel,
  crateName,
  crateOptionSay,
  crateRemove,
  crateSetLabel,
  crateWrongHint,
  squishyCrates,
} from './squishy-crate-rules.js';

/** @typedef {import('../../entities/game-state/index.js').SquishyCrate} SquishyCrate */

const CRATE_DRAG_START = 8; // pixels avant de soulever le squishy (un simple toucher ne glisse pas)
const CRATE_GLOW_MS = 3000; // les bons squishies brillent 3 secondes
const CRATE_WRONG_MAX = 3; // erreurs d'affilée avant de les faire briller
// l'ordre canonique de deux règles : la taille, la couleur, puis la forme
const CRATE_RULE_ORDER = ['size', 'color', 'shape'];

/* ---- l'état de l'onglet (rien de sauvegardé : la partie est dans state.squishies.crates) ---- */
/** @type {number | null} la boîte ouverte, ou null : les cartes */
let cbOpen = null;
/** @type {{ i: number, first: string | null, second: string | null } | null} le choix d'étiquette en cours */
let cbPick = null;
/** @type {string | null} le squishy du tapis choisi (toucher puis toucher) */
let cbSel = null;
let cbWrong = 0; // erreurs d'affilée dans la boîte ouverte
let cbJustDragged = false; // un glisser vient de finir : le clic qui suit est ignoré
let cbTimers = /** @type {Array<ReturnType<typeof setTimeout>>} */ ([]);
/** @param {() => void} fn @param {number} ms */
function cbLater(fn, ms) {
  const t = setTimeout(() => {
    cbTimers = cbTimers.filter((x) => x !== t);
    fn();
  }, ms);
  cbTimers.push(t);
}
// une lueur ou un drapeau en attente ne survit pas à la fenêtre
onModalChange(() => {
  cbTimers.forEach(clearTimeout);
  cbTimers = [];
  cbJustDragged = false;
});

/** @param {string} s @returns {string} la phrase avec sa majuscule */
const cbCap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
function cbRoom() {
  return document.getElementById('sq-room');
}

/* ---- l'étiquette en image, pour qui ne lit pas encore ---- */
/** @param {string | null} key */
function crateLabelHTML(key) {
  if (!key) return '🏷️ ?';
  const rules = crateCriteria(key);
  if (!rules) return '<span class="cb-emoji">❤️</span>';
  if (rules[0].type === 'series') return `<span class="cb-emoji">${SQUISHY_SERIES[rules[0].value].emoji}</span>`;
  return sortIconsHTML(rules);
}

/* ---- l'entrée de l'onglet : toujours les cartes ---- */
function renderSquishyCrates() {
  cbOpen = null;
  cbPick = null;
  cbSel = null;
  cbWrong = 0;
  cbRender();
}
function cbRender() {
  const el = cbRoom();
  if (!el) return;
  if (!squishyOwnedIds().length) {
    el.innerHTML = `<div class="empty-state"><span class="es-art">🗃️</span>Tes boîtes t'attendent !<br>Ouvre une boîte surprise pour trouver ton premier squishy.</div>`;
    return;
  }
  if (cbPick) crateRenderPicker(el, cbPick);
  else if (cbOpen != null && squishyCrates()[cbOpen]) crateRenderOpen(el, cbOpen);
  else crateRenderCards(el);
}
// revenir aux cartes (ou y arriver) : la boîte se ferme, le compteur d'erreurs repart
function cbShowCards() {
  cbOpen = null;
  cbPick = null;
  cbSel = null;
  cbWrong = 0;
  cbRender();
}

/* ---- les cartes ---- */
/** @param {HTMLElement} el */
function crateRenderCards(el) {
  el.innerHTML = `<div class="cb-grid">${squishyCrates()
    .map((c, i) => {
      const full = c.items.length >= CRATE_SLOTS;
      const name = c.label
        ? `${cbCap(crateName(c.label))}, ${c.items.length} sur ${CRATE_SLOTS}`
        : 'Boîte sans étiquette';
      return `<button type="button" class="cb-card ${full ? 'full' : ''} ${c.label ? '' : 'blank'}" data-crate="${i}" aria-label="${name}">
        <span class="cb-label">${crateLabelHTML(c.label)}</span>
        <span class="cb-minis">${c.items.map((id) => squishyArtSVG(id)).join('')}</span>
        <span class="cb-count">${c.items.length} / ${CRATE_SLOTS}</span>
      </button>`;
    })
    .join('')}</div>`;
  el.querySelectorAll('.cb-card').forEach((b) => {
    setHandler(b, 'click', () => {
      playSound('tap');
      const i = Number(b.dataset.crate),
        c = squishyCrates()[i];
      if (!c) return;
      if (!c.label) return crateOpenPicker(i);
      crateOpenBox(i, `${cbCap(crateName(c.label))}.`, '!');
    });
  });
}

/* ---- le choix de l'étiquette ---- */
/** @param {number} i */
function crateOpenPicker(i) {
  cbPick = { i, first: null, second: null };
  cbOpen = null;
  cbSel = null;
  cbRender();
  speak(
    crateLevel(currentPlayerAge()) < 2
      ? "Choisis l'étiquette de ta boîte : une couleur, une famille, ou tes préférés !"
      : "Choisis l'étiquette de ta boîte : une couleur, une forme, une taille, une famille, ou tes préférés !",
  );
}
/** @param {string} key @returns {string} le type de l'unique règle de cette option (« fav » pour les préférés) */
const crateOptType = (key) => key.split(':')[0];
/**
 * L'étiquette à deux règles, dans l'ordre canonique, quel que soit l'ordre des touchers.
 * @param {string} first
 * @param {string} second
 */
function cratePairKey(first, second) {
  return [first, second]
    .sort((a, b) => CRATE_RULE_ORDER.indexOf(crateOptType(a)) - CRATE_RULE_ORDER.indexOf(crateOptType(b)))
    .join('+');
}
/**
 * Les compléments d'une première règle (une couleur appelle une forme ou une
 * taille…), seulement si deux règles sont permises au cran de l'enfant.
 * @param {string | null} first
 * @returns {string[]}
 */
function crateComplements(first) {
  if (!first || !CRATE_RULE_ORDER.includes(crateOptType(first))) return [];
  const age = currentPlayerAge();
  return crateLabelsFor(age).filter(
    (k) =>
      CRATE_RULE_ORDER.includes(crateOptType(k)) &&
      crateOptType(k) !== crateOptType(first) &&
      crateLabelAllowed(cratePairKey(first, k), age),
  );
}
/** @param {string} key @param {boolean} on */
function crateOptHTML(key, on) {
  const say = crateOptionSay(key).split(' :')[0];
  return `<button type="button" class="cb-opt ${on ? 'selected' : ''}" data-key="${key}" aria-label="${say}" aria-pressed="${on}">${crateLabelHTML(key)}</button>`;
}
/**
 * @param {HTMLElement} el
 * @param {{ i: number, first: string | null, second: string | null }} pick
 */
function crateRenderPicker(el, pick) {
  const more = crateComplements(pick.first);
  el.innerHTML = `<div class="cb-picker" data-crate="${pick.i}">
      <div class="cb-opts" data-row="1">${crateLabelsFor(currentPlayerAge())
        .map((k) => crateOptHTML(k, k === pick.first))
        .join('')}</div>
      ${more.length ? `<div class="cb-opts cb-opts-more" data-row="2">${more.map((k) => crateOptHTML(k, k === pick.second)).join('')}</div>` : ''}
      <div class="cb-actions">
        <button type="button" class="cb-btn" id="cb-back">⬅️ Mes boîtes</button>
        <button type="button" class="cb-btn cb-go" id="cb-choose" ${pick.first ? '' : 'disabled'}>✓ Choisir</button>
      </div>
    </div>`;
  el.querySelectorAll('[data-row="1"] .cb-opt').forEach((b) => {
    setHandler(b, 'click', () => {
      playSound('tap');
      pick.first = /** @type {string} */ (b.dataset.key); // posé par crateOptHTML
      pick.second = null;
      const say = crateOptionSay(pick.first);
      cbRender();
      speak(
        crateComplements(pick.first).length ? `${say}. Tu peux ajouter une deuxième règle, ou toucher Choisir.` : say,
      );
    });
  });
  el.querySelectorAll('[data-row="2"] .cb-opt').forEach((b) => {
    setHandler(b, 'click', () => {
      if (!pick.first) return;
      playSound('tap');
      const k = /** @type {string} */ (b.dataset.key);
      pick.second = pick.second === k ? null : k;
      cbRender();
      speak(crateOptionSay(pick.second ? cratePairKey(pick.first, pick.second) : pick.first));
    });
  });
  setHandler(document.getElementById('cb-back'), 'click', () => {
    playSound('tap');
    cbShowCards();
  });
  setHandler(document.getElementById('cb-choose'), 'click', () => {
    if (!pick.first) return;
    playSound('tap');
    const key = pick.second ? cratePairKey(pick.first, pick.second) : pick.first;
    if (!crateSetLabel(pick.i, key, currentPlayerAge())) return;
    crateOpenBox(pick.i, `Voilà ${crateName(key)} !`, '.');
  });
}

/* ---- la boîte ouverte ---- */
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
  cbPick = null;
  cbOpen = i;
  cbSel = null;
  cbWrong = 0;
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
                return `<button type="button" class="sq-cell cb-item ${cbSel === id ? 'selected' : ''}" data-id="${id}" aria-label="${SQUISHIES[id].name}${n > 1 ? ', ' + n : ''}">${squishyArtSVG(id)}${n > 1 ? `<span class="sq-n">×${n}</span>` : ''}</button>`;
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
    cbSel = null;
    cbRender();
    speak('Tes squishies sont sortis de la boîte.');
  });
  setHandler(document.getElementById('cb-relabel'), 'click', () => {
    playSound('tap');
    crateOpenPicker(i);
  });
}
// toucher un squishy du tapis : le choisir (ou le reposer)
/** @param {HTMLButtonElement} btn */
function crateItemTap(btn) {
  if (cbJustDragged) {
    cbJustDragged = false;
    return;
  }
  const id = /** @type {string} */ (btn.dataset.id); // posé par crateRenderOpen
  playSound('tap');
  cbSel = cbSel === id ? null : id;
  document.querySelectorAll('.cb-item').forEach((b) => b.classList.toggle('selected', b.dataset.id === cbSel));
  if (cbSel) speak(`${SQUISHIES[id].name}. Touche la boîte pour le ranger !`);
}
// toucher la boîte : y ranger le squishy choisi ; sinon, sortir celui de la case
/** @param {number} i @param {number} pos */
function crateSlotTap(i, pos) {
  if (cbSel) return crateTryAdd(i, cbSel);
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
  cbSel = null;
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
    cbWrong++;
    if (cbWrong < CRATE_WRONG_MAX) return crateBounce(id, hint);
    cbWrong = 0;
    return crateBounce(id, crateGlow(label) ? `${hint} Regarde ceux qui brillent !` : hint);
  }
  if (!res.ok) return; // bad, nolabel, none : l'interface ne les produit pas
  cbWrong = 0;
  cbSel = null;
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
    cbJustDragged = true;
    cbLater(() => (cbJustDragged = false), 350);
    if (ev.type === 'pointercancel') return;
    const target = document.elementFromPoint(ev.clientX, ev.clientY);
    if (target && target.closest && target.closest('.cb-crate')) crateTryAdd(i, id);
  };
  btn.addEventListener('pointermove', move);
  btn.addEventListener('pointerup', end);
  btn.addEventListener('pointercancel', end);
}

export { renderSquishyCrates };
