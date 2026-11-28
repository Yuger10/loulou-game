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
   La logique (crateAdd…) est dans squishy-crate-rules.js, la boîte ouverte
   dans squishy-crate-box.js, l'état de l'onglet dans squishy-crate-view.js. Tout est dit à voix
   haute, et un seul appel à speak() par geste : un nouvel appel couperait la
   phrase en cours. */
import { currentPlayerAge } from '../../entities/player/index.js';
import { playSound, setHandler, speak } from '../../shared/ui/index.js';
import { squishyOwnedIds } from './squishies.js';
import { squishyArtSVG } from './squishy-art.js';
import {
  CRATE_SLOTS,
  crateLabelAllowed,
  crateLabelsFor,
  crateLevel,
  crateName,
  crateOptionSay,
  crateSetLabel,
  squishyCrates,
} from './squishy-crate-rules.js';
import { cb, cbCap, cbRoom, cbSetNav, cbShowCards, crateLabelHTML } from './squishy-crate-view.js';
import { crateOpenBox, crateRenderOpen } from './squishy-crate-box.js';

/** @typedef {import('./squishy-crate-view.js').CratePick} CratePick */

// l'ordre canonique de deux règles : la taille, la couleur, puis la forme
const CRATE_RULE_ORDER = ['size', 'color', 'shape'];

/* ---- l'entrée de l'onglet : toujours les cartes ---- */
function renderSquishyCrates() {
  cbShowCards();
}
// l'écran en cours : le choix d'étiquette, la boîte ouverte, sinon les cartes
function cbDraw() {
  const el = cbRoom();
  if (!el) return;
  if (!squishyOwnedIds().length) {
    el.innerHTML = `<div class="empty-state"><span class="es-art">🗃️</span>Tes boîtes t'attendent !<br>Ouvre une boîte surprise pour trouver ton premier squishy.</div>`;
    return;
  }
  if (cb.pick) crateRenderPicker(el, cb.pick);
  else if (cb.open != null && squishyCrates()[cb.open]) crateRenderOpen(el, cb.open);
  else crateRenderCards(el);
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
  cb.pick = { i, first: null, second: null };
  cb.open = null;
  cb.sel = null;
  cbDraw();
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
/** @param {HTMLElement} el @param {CratePick} pick */
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
      cbDraw();
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
      cbDraw();
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
// la boîte ouverte redessine l'onglet et rouvre le choix d'étiquette par squishy-crate-view.js
cbSetNav(cbDraw, crateOpenPicker);

export { renderSquishyCrates };
