/* ---------- Ma chambre à squishies (v53) : l'interface ----------
   On y entre par le bouton 🧸 de l'en-tête (avec la pastille des boîtes à
   ouvrir) ou par le Sac. Trois onglets à icône :
     📚 Collection   les boîtes à ouvrir en haut (« Ouvrir ! »), puis une
                     rangée par série : les squishies obtenus (×N), une
                     silhouette grise pour les manquants, « 4 / 6 »
     🗄️ Étagère      12 emplacements libres : on touche un squishy, puis
                     une place. Purement décoratif, sauvegardé
     📦 Ranger       les boîtes de rangement à consigne (tri par couleur,
                     forme, taille : voir makeSortingTask)
   Presser : toucher un squishy l'écrase puis le fait remonter lentement,
   avec un « pouic » et une petite vibration. Rien ne change dans la partie.
   Tout est dit à voix haute : aucun texte n'est nécessaire pour jouer. */
import { save } from '../../entities/game-state/index.js';
import { currentPlayerAge, onProfileRefresh } from '../../entities/player/index.js';
import {
  SQ_COLORS,
  SQUISHIES,
  squishiesOf,
  SQUISHY_SERIES,
  SQUISHY_SERIES_ORDER,
  SQUISHY_TREASURES,
} from '../../entities/squishy/index.js';
import { archipelagoUnlocked } from '../../entities/world/index.js';
import { squishyArtSVG, squishyBoxSVG } from './squishy-art.js';
import {
  confetti,
  onModalChange,
  openModal,
  playSound,
  setHandler,
  showToast,
  speak,
  vibrate,
} from '../../shared/ui/index.js';
import { gainCoins } from '../gains/index.js';
import { hintNudge, registerHints, setHintQuestion } from '../hints/index.js';
import { bindQuit, gameHeader, rememberSpokenHint } from '../screen/index.js';
import {
  makeSortingTask,
  onSquishyChange,
  openSquishyBox,
  recordSorting,
  shelfPlace,
  shelfRemove,
  sortingDone,
  sortingPaidLeft,
  sortMatches,
  sortSay,
  sortWrongHint,
  SQ_SERIES_BONUS,
  SQ_SORT_MAX_ERRORS,
  SQ_SORT_MIN_MODELS,
  SQ_SORT_REWARD,
  SQ_SORT_SHAPES,
  SQ_SORT_SIZES,
  SQ_SORT_SLOTS,
  sqState,
  squishyBoxCount,
  squishyCount,
  squishyOwnedIds,
  squishySeriesAvailable,
  squishySeriesProgress,
  squishyShelfCount,
  squishyTreasureOwned,
} from './squishies.js';
import { random } from '../../shared/lib/index.js';

/** @typedef {import('./squishies.js').SortCriterion} SortCriterion */
/** @typedef {import('./squishies.js').SortingTask} SortingTask */
/** @typedef {import('./squishies.js').Rng} Rng */
/** @typedef {{ task: SortingTask, filled?: number }} SortQuestion la question posée aux indices */
/** @typedef {{ task: SortingTask, filled: number, errors: number, age: number | null }} SortRun */

/* ---------- Pastille 🧸 : les boîtes à ouvrir ---------- */
function renderSquishyBadge() {
  const n = squishyBoxCount();
  /** @type {Array<[string, boolean]>} */ ([
    ['squishy-badge', true],
    ['sq-room-link-n', false],
  ]).forEach(([elId, pulse]) => {
    const b = document.getElementById(elId);
    if (!b) return;
    b.hidden = !n;
    b.textContent = String(n);
    if (pulse) b.classList.toggle('ready', n > 0);
  });
}
onSquishyChange(renderSquishyBadge);
onProfileRefresh(renderSquishyBadge);

// Début de partie : la chambre n'a jamais été ouverte et des boîtes attendent
// (rattrapage de la migration, coffre…) : on le dit une fois, doucement.
function squishySessionHello() {
  const sq = sqState();
  const overlay = /** @type {HTMLElement} */ (document.getElementById('overlay'));
  if (sq.hello || !sq.boxes.length || overlay.classList.contains('show')) return false;
  showToast(
    `🧸 Tu as ${sq.boxes.length} boîte${sq.boxes.length > 1 ? 's' : ''} surprise${sq.boxes.length > 1 ? 's' : ''} à ouvrir !`,
  );
  return true;
}

/* ---------- Presser un squishy ---------- */
function squishyPress(/** @type {HTMLElement | null | undefined} */ el) {
  if (!el) return;
  el.classList.remove('sq-press');
  void el.offsetWidth;
  el.classList.add('sq-press');
  playSound('pouic');
  vibrate(25);
}

/* ---------- La chambre ---------- */
let sqRoomTab = 'collection';
let sqTimers = /** @type {Array<ReturnType<typeof setTimeout>>} */ ([]);
function sqLater(/** @type {() => void} */ fn, /** @type {number} */ ms) {
  const t = setTimeout(() => {
    sqTimers = sqTimers.filter((x) => x !== t);
    fn();
  }, ms);
  sqTimers.push(t);
  return t;
}
function sqClearTimers() {
  sqTimers.forEach(clearTimeout);
  sqTimers = [];
}
// une animation ou une relance en attente ne survit pas à la fenêtre
onModalChange(sqClearTimers);

const SQ_TABS = [
  { id: 'collection', icon: '📚', name: 'Collection' },
  { id: 'etagere', icon: '🗄️', name: 'Étagère' },
  { id: 'ranger', icon: '📦', name: 'Ranger' },
];

/** @param {string} [tabArg] l'onglet, par défaut le dernier @param {{ avoid?: string }} [opts] Ranger : la consigne à éviter */
function openSquishyRoom(tabArg, opts) {
  let tab = tabArg;
  // un onglet reconnu est forcément défini
  tab = SQ_TABS.some((t) => t.id === tab) ? /** @type {string} */ (tab) : sqRoomTab || 'collection';
  sqRoomTab = tab;
  sqShelfSel = null;
  const sq = sqState();
  const first = !sq.hello;
  if (first) {
    sq.hello = true;
    save();
  }
  const head = sqRoomHead(tab, opts);
  openModal(`
    ${gameHeader('🧸 Ma chambre à squishies', head.hint, head.say)}
    <div class="tabs sq-tabs">
      ${SQ_TABS.map((t) => `<button type="button" class="tab-btn ${t.id === tab ? 'active' : ''}" data-sqtab="${t.id}">${t.icon} ${t.name}</button>`).join('')}
    </div>
    <div class="sq-room" id="sq-room" data-tab="${tab}"></div>
  `);
  document.querySelectorAll('[data-sqtab]').forEach((b) => {
    setHandler(b, 'click', () => {
      playSound('tap');
      openSquishyRoom(b.dataset.sqtab);
    });
  });
  bindQuit();
  if (tab === 'collection') renderSquishyCollection();
  else if (tab === 'etagere') renderSquishyShelf();
  else renderSquishySorting(head.task);
}

// la consigne de l'en-tête (et ce que dit la voix), selon l'onglet
/** @param {string} tab @param {{ avoid?: string }} [opts] @returns {{ hint: string, say: string, task?: SortingTask | null }} */
function sqRoomHead(tab, opts) {
  if (tab === 'collection') {
    const n = squishyBoxCount();
    const hint = n
      ? `Tu as ${n} boîte${n > 1 ? 's' : ''} surprise${n > 1 ? 's' : ''} à ouvrir !`
      : 'Touche un squishy pour le presser !';
    return { hint, say: hint };
  }
  if (tab === 'etagere') {
    const hint = "Touche un squishy, puis une place sur l'étagère";
    return { hint, say: hint + '.' };
  }
  const task = sqSortTask(opts);
  if (!task) return { hint: 'Les boîtes de rangement', say: 'Les boîtes de rangement.', task };
  return { hint: `${sortIconsHTML(task.criteria)}<span>${task.say} !</span>`, say: task.say + ' !', task };
}

/* ---- 📚 Collection ---- */
function sqCellHTML(/** @type {string} */ id) {
  const m = SQUISHIES[id],
    n = squishyCount(id);
  if (!n)
    return `<button type="button" class="sq-cell missing" data-miss="${id}" aria-label="Pas encore trouvé">${squishyArtSVG(id, { silhouette: true })}<span class="sq-name">?</span></button>`;
  return `<button type="button" class="sq-cell r-${m.rarity}" data-sq="${id}" aria-label="${m.name}${n > 1 ? ', ' + n : ''}">
    ${squishyArtSVG(id)}<span class="sq-name">${m.name}</span>
    ${n > 1 ? `<span class="sq-n">×${n}</span>` : ''}
    ${m.rarity !== 'commun' ? `<span class="sq-rar" aria-hidden="true">${m.rarity === 'rare' ? '⭐' : '✨'}</span>` : ''}
  </button>`;
}
function renderSquishyCollection() {
  const el = document.getElementById('sq-room');
  if (!el) return;
  const sq = sqState();
  const next = sq.boxes[0];
  el.innerHTML = `
    ${
      sq.boxes.length
        ? `<div class="sq-boxes" id="sq-boxes">
      <div class="sq-stage" id="sq-stage">${squishyBoxSVG(next)}${sq.boxes.length > 1 ? `<span class="sq-box-n">×${sq.boxes.length}</span>` : ''}</div>
      <button type="button" class="btn-primary sq-open" id="sq-open">Ouvrir ! 🎁</button>
    </div>`
        : ''
    }
    ${SQUISHY_SERIES_ORDER.filter(squishySeriesAvailable)
      .map((series) => {
        const s = SQUISHY_SERIES[series],
          p = squishySeriesProgress(series);
        return `<section class="sq-series ${p.have === p.total ? 'complete' : ''}" data-series="${series}">
        <h3><span>${s.emoji} ${s.name}</span><span class="sq-prog">${p.have === p.total ? '🏆 ' : ''}${p.have} / ${p.total}</span></h3>
        <div class="quest-bar"><i style="width:${(p.have / p.total) * 100}%"></i></div>
        <div class="sq-grid">${squishiesOf(series).map(sqCellHTML).join('')}</div>
      </section>`;
      })
      .join('')}
    ${
      Object.keys(SQUISHY_TREASURES).some(squishyTreasureOwned) || archipelagoUnlocked(2)
        ? `<section class="sq-series sq-treasures" data-series="tresors">
      <h3><span>💎 Trésors</span><span class="sq-prog">${Object.keys(SQUISHY_TREASURES).filter(squishyTreasureOwned).length} / ${Object.keys(SQUISHY_TREASURES).length}</span></h3>
      <div class="sq-grid">${Object.keys(SQUISHY_TREASURES)
        .map((id) =>
          squishyTreasureOwned(id)
            ? `<button type="button" class="sq-cell owned treasure" data-sq="${id}" aria-label="${SQUISHY_TREASURES[id].name}">${squishyArtSVG(id)}<span class="sq-name">${SQUISHY_TREASURES[id].name}</span></button>`
            : `<div class="sq-cell treasure locked" data-treasure="${id}" aria-label="Un trésor à trouver : ${SQUISHY_TREASURES[id].how}">${squishyArtSVG(id, { silhouette: true })}<span class="sq-name">${SQUISHY_TREASURES[id].how}</span></div>`,
        )
        .join('')}</div>
    </section>`
        : ''
    }`;
  sqBindPress(el);
  const open = document.getElementById('sq-open');
  if (open) setHandler(open, 'click', () => squishyOpenAnimated());
}
function sqBindPress(/** @type {HTMLElement} */ el) {
  el.querySelectorAll('.sq-cell[data-sq]').forEach((b) => {
    setHandler(b, 'click', () => {
      // le sélecteur [data-sq] garantit l'attribut
      const id = /** @type {string} */ (b.dataset.sq),
        n = squishyCount(id);
      squishyPress(b);
      speak(`${(SQUISHIES[id] || SQUISHY_TREASURES[id]).name}${n > 1 ? `. Tu en as ${n}.` : ' !'}`);
    });
  });
  el.querySelectorAll('.sq-cell[data-treasure]').forEach((b) => {
    setHandler(b, 'click', () => {
      playSound('tap');
      speak(`Un trésor unique ! ${SQUISHY_TREASURES[/** @type {string} */ (b.dataset.treasure)].how}.`);
    });
  });
  el.querySelectorAll('.sq-cell[data-miss]').forEach((b) => {
    setHandler(b, 'click', () => {
      playSound('tap');
      speak("Celui-là, tu ne l'as pas encore. Ouvre des boîtes surprises pour le trouver !");
    });
  });
}

// La boîte tremble, s'ouvre, et le squishy saute ; la voix dit son nom.
/* Pop, le diablotin à ressort du Monde des Boîtes (v55) : de temps en temps
   (1 fois sur 5), il surgit de la boîte pour le plaisir. Il ne change rien au
   tirage, qui a déjà eu lieu : son hasard (`popRng`) est à part. */
const SQ_POP_CHANCE = 0.2;
/** @param {Rng} [popRng] */
function squishyPopDue(popRng) {
  return (popRng || random)() < SQ_POP_CHANCE;
}
/** @param {Rng} [popRng] */
function squishyOpenAnimated(popRng) {
  const btn = /** @type {HTMLButtonElement} */ (document.getElementById('sq-open')),
    stage = document.getElementById('sq-stage');
  if (!btn || !stage || btn.disabled) return;
  const res = openSquishyBox();
  if (!res) return;
  const pop = squishyPopDue(popRng);
  btn.disabled = true;
  stage.classList.add('shake');
  playSound('tap');
  sqLater(() => playSound('tap'), 300);
  sqLater(() => {
    stage.classList.remove('shake');
    stage.classList.add('open');
    playSound('box');
    if (pop) {
      stage.insertAdjacentHTML(
        'beforeend',
        `<span class="sq-pop-jack" aria-hidden="true">${squishyArtSVG('pop')}</span>`,
      );
      playSound('pouic');
      speak('Pop !');
    }
  }, 900);
  sqLater(() => squishyReveal(res), pop ? 1900 : 1300);
  return { res, pop };
}
function squishyReveal(/** @type {import('./squishies.js').OpenedBox} */ res) {
  const box = document.getElementById('sq-boxes');
  if (!box) return;
  const m = SQUISHIES[res.id];
  const left = squishyBoxCount();
  box.innerHTML = `
    <div class="sq-reveal r-${m.rarity} ${res.isNew ? 'is-new' : 'is-dup'}" id="sq-reveal">
      <button type="button" class="sq-cell sq-big" data-sq="${res.id}" aria-label="${m.name}">${squishyArtSVG(res.id)}</button>
      <span class="sq-tag">${res.isNew ? 'Nouveau !' : '×' + res.count}</span>
    </div>
    <p class="sq-reveal-name">${m.rarity === 'brille' ? '✨ ' : m.rarity === 'rare' ? '⭐ ' : ''}${m.name}</p>
    ${res.seriesCompleted ? `<div class="sq-complete" id="sq-complete">🏆 Série ${SQUISHY_SERIES[res.series].name} complète ! <span data-gain-coins>🪙</span> <b>+${SQ_SERIES_BONUS}</b></div>` : ''}
    <button type="button" class="btn-primary" id="sq-next">${left ? `Ouvrir la suivante 🎁 (${left})` : 'Voir ma collection 📚'}</button>`;
  // la consigne de l'en-tête suit le nombre de boîtes qui restent
  const head = sqRoomHead('collection'),
    ht = document.querySelector('.puzzle-hint .hint-txt'),
    hs = document.querySelector('.puzzle-hint [data-say]');
  if (ht) ht.textContent = head.hint;
  if (hs) {
    hs.dataset.say = head.say;
    rememberSpokenHint(head.say);
  }
  const say = m.say.charAt(0).toUpperCase() + m.say.slice(1);
  speak(
    `${say} !${res.isNew ? ' Il est nouveau !' : ` Tu en as ${res.count}.`}${res.seriesCompleted ? ` Bravo, la série ${SQUISHY_SERIES[res.series].name} est complète ! Tu gagnes ${SQ_SERIES_BONUS} pièces.` : ''}`,
  );
  // la fête dépend de la rareté
  if (m.rarity === 'brille') {
    playSound('sparkle');
    confetti();
    sqLater(confetti, 500);
    vibrate([40, 30, 40, 30, 120]);
  } else if (m.rarity === 'rare') {
    playSound('win');
    confetti();
    vibrate([40, 30, 80]);
  } else {
    playSound(res.isNew ? 'win' : 'good');
    if (res.isNew) vibrate(40);
  }
  if (res.seriesCompleted) {
    sqLater(() => {
      playSound('win');
      confetti();
      gainCoins(SQ_SERIES_BONUS, document.getElementById('sq-complete'));
    }, 700);
  }
  const big = box.querySelector('.sq-cell[data-sq]');
  if (big) setHandler(big, 'click', () => squishyPress(big));
  setHandler(document.getElementById('sq-next'), 'click', () => {
    playSound('tap');
    openSquishyRoom('collection');
  });
}

/* ---- 🗄️ Étagère ---- */
let sqShelfSel = /** @type {{ id: string, slot?: number } | null} */ (null); // { id } (depuis la collection) ou { id, slot } (depuis l'étagère)
function renderSquishyShelf() {
  const el = document.getElementById('sq-room');
  if (!el) return;
  const sq = sqState();
  const owned = squishyOwnedIds();
  if (!owned.length) {
    sqShelfSel = null;
    el.innerHTML = `<div class="empty-state"><span class="es-art">🗄️</span>Ton étagère t'attend !<br>Ouvre une boîte surprise pour trouver ton premier squishy.</div>`;
    return;
  }
  const sel = sqShelfSel;
  const tip = !sel
    ? ''
    : sel.slot != null
      ? `<div class="sq-shelf-tip">${squishyArtSVG(sel.id)}<span>Touche une autre place pour le déplacer.</span><button type="button" class="btn-small" id="sq-shelf-remove">Retirer ↩️</button></div>`
      : `<div class="sq-shelf-tip">${squishyArtSVG(sel.id)}<span>Touche une place sur l'étagère !</span></div>`;
  el.innerHTML = `
    <div class="sq-shelf ${sel ? 'picking' : ''}" id="sq-shelf">
      ${sq.shelf.map((id, i) => `<button type="button" class="sq-slot ${id ? 'full' : ''} ${sel && sel.slot === i ? 'selected' : ''}" data-slot="${i}" aria-label="${id ? SQUISHIES[id].name : 'Place libre'}">${id ? squishyArtSVG(id) : ''}</button>`).join('')}
    </div>
    ${tip}
    <h3 class="sq-h">Ta collection</h3>
    <div class="sq-grid sq-pick">
      ${owned
        .map((id) => {
          const free = squishyCount(id) - squishyShelfCount(id);
          return `<button type="button" class="sq-cell ${free ? '' : 'used'} ${sel && sel.slot == null && sel.id === id ? 'selected' : ''}" data-pick="${id}" aria-label="${SQUISHIES[id].name}">
          ${squishyArtSVG(id)}<span class="sq-name">${SQUISHIES[id].name}</span>${free > 1 ? `<span class="sq-n">×${free}</span>` : ''}</button>`;
        })
        .join('')}
    </div>`;
  el.querySelectorAll('[data-pick]').forEach((b) => {
    setHandler(b, 'click', () => {
      // le sélecteur [data-pick] garantit l'attribut
      const id = /** @type {string} */ (b.dataset.pick);
      squishyPress(b);
      if (squishyCount(id) - squishyShelfCount(id) <= 0) {
        speak("Il est déjà sur l'étagère !");
        return;
      }
      sqShelfSel = sqShelfSel && sqShelfSel.slot == null && sqShelfSel.id === id ? null : { id };
      if (sqShelfSel) speak(`${SQUISHIES[id].name}. Touche une place sur l'étagère !`);
      renderSquishyShelf();
    });
  });
  el.querySelectorAll('[data-slot]').forEach((b) => {
    setHandler(b, 'click', () => squishyShelfTap(Number(b.dataset.slot), b));
  });
  const rm = document.getElementById('sq-shelf-remove');
  if (rm)
    setHandler(rm, 'click', () => {
      playSound('tap');
      if (sqShelfSel && sqShelfSel.slot != null) shelfRemove(sqShelfSel.slot);
      sqShelfSel = null;
      renderSquishyShelf();
    });
}
function squishyShelfTap(/** @type {number} */ slot, /** @type {HTMLElement} */ btn) {
  const sq = sqState(),
    sel = sqShelfSel,
    here = sq.shelf[slot];
  if (!sel) {
    if (!here) {
      playSound('tap');
      speak("Choisis d'abord un squishy dans ta collection, en dessous.");
      return;
    }
    squishyPress(btn);
    sqShelfSel = { id: here, slot };
    renderSquishyShelf();
    return;
  }
  if (sel.slot != null) {
    // depuis l'étagère : toucher sa place une 2ᵉ fois le retire ; une autre place le déplace (échange)
    if (sel.slot === slot) shelfRemove(slot);
    else {
      sq.shelf[sel.slot] = here || null;
      sq.shelf[slot] = sel.id;
      save();
    }
  } else {
    shelfPlace(slot, sel.id);
  }
  playSound('pop');
  sqShelfSel = null;
  renderSquishyShelf();
}

/* ---- 📦 Ranger : les boîtes de rangement à consigne ---- */
let sqSort = /** @type {SortRun | null} */ (null); // { task, filled, errors, age }
function sqSortTask(/** @type {{ avoid?: string }} */ opts = {}) {
  const age = currentPlayerAge();
  return makeSortingTask(sqState().owned, age, random, { avoid: opts.avoid });
}
// La consigne en image, pour qui ne lit pas encore : la forme (remplie de la
// couleur s'il y en a une), sinon une pastille de couleur ; la taille par une
// paire « petit / grand » dont la bonne est foncée.
function sortIconsHTML(/** @type {SortCriterion[]} */ criteria) {
  /** @param {SortCriterion['type']} t */
  const get = (t) => (criteria.find((c) => c.type === t) || /** @type {Partial<SortCriterion>} */ ({})).value;
  const color = get('color'),
    shape = get('shape'),
    size = get('size');
  const col = color && SQ_COLORS[color];
  const style = col ? ` style="background:${col.fill};border-color:${col.edge}"` : '';
  const pair = size ? `<span class="sr-ico sr-size sr-size-${size}"><i></i><i></i></span>` : '';
  let main = '';
  if (shape) main = `<span class="sr-ico sr-shape-${shape}"${style}></span>`;
  else if (color) main = `<span class="sq-dot"${style}></span>`;
  return `<span class="sr-icons" aria-hidden="true">${pair}${main}</span>`;
}
// le haut de l'onglet : la pile des boîtes rangées, et ce que rapporte la suivante
function sortTopHTML() {
  const sq = sqState(),
    left = sortingPaidLeft();
  return `<div class="sr-top" id="sr-top">
      <div class="sr-pile" aria-label="${sq.sorted} boîtes rangées">${Array.from({ length: Math.min(sq.sorted, 6) }, () => '<i></i>').join('')}<b>${sq.sorted}</b>&nbsp;rangée${sq.sorted > 1 ? 's' : ''}</div>
      <div class="sr-pay">${left ? `🪙 +${SQ_SORT_REWARD} <small>(encore ${left} aujourd'hui)</small>` : '😊 Pour le plaisir'}</div>
    </div>`;
}
function renderSquishySorting(/** @type {SortingTask | null | undefined} */ task) {
  const el = document.getElementById('sq-room');
  if (!el) return;
  const models = squishyOwnedIds().length;
  const pile = sortTopHTML();
  if (!task) {
    sqSort = null;
    const msg =
      models < SQ_SORT_MIN_MODELS
        ? `Il te faut au moins ${SQ_SORT_MIN_MODELS} squishies différents pour ranger. Tu en as ${models}. Ouvre des boîtes surprises !`
        : 'Il te faut encore quelques squishies pareils pour remplir une boîte. Ouvre des boîtes surprises !';
    el.innerHTML = `${pile}<div class="empty-state sr-empty"><span class="es-art">📦</span>${msg}</div>
      ${squishyBoxCount() ? `<button type="button" class="btn-primary" id="sr-go-open">Ouvrir mes boîtes 🎁</button>` : ''}`;
    speak(msg);
    const go = document.getElementById('sr-go-open');
    if (go)
      setHandler(go, 'click', () => {
        playSound('tap');
        openSquishyRoom('collection');
      });
    return;
  }
  sqSort = { task, filled: 0, errors: 0, age: currentPlayerAge() };
  el.innerHTML = `${pile}
    <div class="sr-crate" id="sr-crate" aria-label="La boîte de rangement">
      ${Array.from({ length: SQ_SORT_SLOTS }, (_, i) => `<span class="sr-cell" data-cell="${i}"></span>`).join('')}
    </div>
    <div class="sr-board">
      ${task.items.map((id, i) => `<button type="button" class="sq-cell sr-item" data-i="${i}" aria-label="${SQUISHIES[id].name}">${squishyArtSVG(id)}<span class="sq-check" aria-hidden="true">✓</span></button>`).join('')}
    </div>`;
  const q = /** @type {SortQuestion} */ ({ task });
  setHintQuestion('rangement', q, { choices: '.sr-item', noCount: true });
  el.querySelectorAll('.sr-item').forEach((b) => {
    setHandler(b, 'click', () => squishySortTap(/** @type {HTMLButtonElement} */ (b), q));
  });
}
function squishySortTap(/** @type {HTMLButtonElement} */ btn, /** @type {SortQuestion} */ q) {
  const run = sqSort;
  if (!run || btn.disabled || run.filled >= SQ_SORT_SLOTS || run.errors >= SQ_SORT_MAX_ERRORS) return;
  const id = run.task.items[Number(btn.dataset.i)];
  if (sortMatches(id, run.task.criteria)) {
    btn.disabled = true;
    btn.classList.add('placed');
    const cell = document.querySelector(`.sr-cell[data-cell="${run.filled}"]`);
    if (cell) {
      cell.innerHTML = squishyArtSVG(id);
      cell.classList.add('in');
    }
    run.filled++;
    q.filled = run.filled;
    playSound('good');
    vibrate(30);
    if (run.filled >= SQ_SORT_SLOTS) sqLater(() => squishySortWin(run), 450);
    return;
  }
  // anti-devinette : il rebondit, avec un indice parlé ; 2 erreurs → autre consigne
  run.errors++;
  btn.classList.remove('sr-bounce');
  void btn.offsetWidth;
  btn.classList.add('sr-bounce');
  playSound('wrong');
  vibrate(80);
  hintNudge(true);
  if (run.errors >= SQ_SORT_MAX_ERRORS) {
    recordSorting(false, run.errors, run.task.level, run.age);
    speak(`${sortWrongHint(id, run.task.criteria)} On essaie une autre boîte !`);
    sqLater(() => openSquishyRoom('ranger', { avoid: run.task.key }), 2200);
  } else {
    speak(sortWrongHint(id, run.task.criteria));
  }
}
function squishySortWin(/** @type {SortRun} */ run) {
  const coins = sortingDone(run.errors, run.task.level, run.age);
  const crate = document.getElementById('sr-crate');
  const board = document.querySelector('.sr-board');
  if (crate) crate.classList.add('done');
  playSound('win');
  confetti();
  vibrate([50, 40, 120]);
  speak(`Bravo, la boîte est rangée !${coins ? ` Tu gagnes ${coins} pièces.` : ''}`);
  if (board)
    board.outerHTML = `<div class="sr-win">
      <p class="sr-win-txt">📦 Boîte rangée !${coins ? ` <span data-gain-coins>🪙</span> <b>+${coins}</b>` : ' <small>Pour le plaisir 😊</small>'}</p>
      <button type="button" class="btn-primary" id="sr-again">Encore une boîte 📦</button>
    </div>`;
  const top = document.getElementById('sr-top');
  if (top) top.outerHTML = sortTopHTML();
  if (coins) gainCoins(coins, crate);
  const again = document.getElementById('sr-again');
  if (again)
    setHandler(again, 'click', () => {
      playSound('tap');
      openSquishyRoom('ranger');
    });
}

// Indices du compagnon (v52) : 1. sur quoi porter son regard ; 2. combien
// il en reste, et une partie du plateau où se cache l'un d'eux.
function sortingHints(/** @type {SortQuestion} */ q) {
  const cr = q.task.criteria;
  const one = (/** @type {SortCriterion} */ c) =>
    c.type === 'color'
      ? `la couleur : on cherche les ${SQ_COLORS[c.value].adj[1]}`
      : c.type === 'shape'
        ? `la forme : on cherche les ${SQ_SORT_SHAPES[c.value].p}`
        : `la taille : on cherche les ${SQ_SORT_SIZES[c.value].p}`;
  const first =
    cr.length > 1
      ? {
          say: `Il faut les deux à la fois : ${sortSay(cr).replace('Range les ', '')}. Regarde chaque squishy deux fois !`,
          fx: { glow: '.puzzle-hint' },
        }
      : { say: `Regarde seulement ${one(cr[0])}.`, fx: { glow: '.puzzle-hint' } };
  // trois squishies qui brillent, dont au moins un à ranger
  const free = [...document.querySelectorAll('.sr-board .sr-item:not(:disabled)')];
  const good = free.filter((b) => sortMatches(q.task.items[Number(b.dataset.i)], cr));
  const pick = good[0] ? [good[0], ...free.filter((b) => b !== good[0]).slice(0, 2)] : [];
  const left = SQ_SORT_SLOTS - (q.filled || 0);
  return [
    first,
    {
      say: `Il en reste ${left} à ranger. Regarde bien parmi ceux qui brillent !`,
      fx: { glow: pick.map((b) => `.sr-item[data-i="${b.dataset.i}"]`).join(', ') || '.sr-board' },
    },
  ];
}
registerHints('rangement', sortingHints);

/* ---------- Entrées : le bouton 🧸 de l'en-tête et celui du Sac ---------- */
['squishy-btn', 'sq-room-link'].forEach((elId) => {
  const b = document.getElementById(elId);
  if (b)
    b.addEventListener('click', () => {
      playSound('tap');
      openSquishyRoom('collection');
    });
});

export { openSquishyRoom, renderSquishyBadge, squishySessionHello };
