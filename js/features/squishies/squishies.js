/* ---------- Collection de squishies (v53) : la logique ----------
   Le catalogue (séries, modèles, raretés) est dans js/entities/squishy/.
   Ici : gagner des boîtes surprises, les ouvrir (tirage doux avec filet de
   sécurité), échanger ses doubles, et préparer une boîte de rangement à
   consigne (tri par couleur, forme, taille). Aucune interface : la chambre
   à squishies est dans squishy-room.js, et ces fonctions acceptent un
   hasard injecté (`rng`) pour être testées.

   Gagner des boîtes :
   - le coffre des missions du jour : 1 boîte « mystère » en plus ;
   - une énigme d'histoire résolue : 1 boîte de la série de l'île, une
     seule fois par île (SQUISHY_ISLAND_SERIES) ;
   - la boutique du marché : 15 pièces, 3 par jour au plus. */
import { save, squishyFreshState, state } from '../../entities/game-state/index.js';
import {
  SQ_COLORS,
  SQUISHIES,
  squishiesOf,
  SQUISHY_ISLAND_SERIES,
  SQUISHY_RARITY,
  SQUISHY_SERIES,
  SQUISHY_SERIES_ORDER,
  SQUISHY_TREASURES,
} from '../../entities/squishy/index.js';
import { worldUnlocked } from '../../entities/world/index.js';
import { todayKey } from '../adaptive/index.js';
import { addCoins } from '../wallet/index.js';
import { random } from '../../shared/lib/index.js';

const SQ_BOX_PRICE = 15; // pièces, à la boutique du marché
const SQ_BUY_MAX = 3; // achats par jour et par joueur
const SQ_DRY_MAX = 3; // boîtes d'affilée sans nouveauté avant le filet
const SQ_SERIES_BONUS = 20; // pièces quand une série est complète (une fois)
const SQ_TRADE_COST = 3; // doubles donnés pour un squishy manquant
const SQ_SHELF_SLOTS = 12;
const SQ_SORT_SLOTS = 4; // cases d'une boîte de rangement
const SQ_SORT_CHOICES = 8; // squishies proposés pour la remplir
const SQ_SORT_MIN_MODELS = 6; // modèles différents nécessaires pour ranger
const SQ_SORT_REWARD = 5; // pièces par boîte bien remplie…
const SQ_SORT_PAID_MAX = 3; // … pour les 3 premières du jour
const SQ_SORT_MAX_ERRORS = 2; // erreurs avant une nouvelle consigne

/** @typedef {import('../../entities/game-state/index.js').GameState['squishies']} SquishyState */
/** Un critère de rangement (« les roses », « les ronds »…).
 * @typedef {{ type: 'color' | 'shape' | 'size', value: string }} SortCriterion */
/**
 * Une boîte de rangement : `key` identifie la consigne, `targets` = combien
 * des `items` proposés vont dans la boîte.
 * @typedef {{
 *   criteria: SortCriterion[],
 *   key: string,
 *   say: string,
 *   level: number,
 *   items: string[],
 *   targets: number,
 * }} SortingTask
 */
/** @typedef {() => number} Rng un hasard entre 0 et 1, injectable pour les tests */

// L'état de la collection, complété si une clé manque (sauvegarde ancienne)
function sqState() {
  const fresh = squishyFreshState();
  if (!state.squishies || typeof state.squishies !== 'object') state.squishies = fresh;
  const sq = state.squishies;
  // parcours clé par clé : les deux états vus comme de simples tables
  const sqKeys = /** @type {Record<string, unknown>} */ (sq),
    freshKeys = /** @type {Record<string, unknown>} */ (fresh);
  Object.keys(fresh).forEach((k) => {
    if (sqKeys[k] === undefined || (sqKeys[k] === null && k !== 'day')) sqKeys[k] = freshKeys[k];
  });
  if (!Array.isArray(sq.shelf) || sq.shelf.length !== SQ_SHELF_SLOTS) {
    sq.shelf = Array.from({ length: SQ_SHELF_SLOTS }, (_, i) => (Array.isArray(sq.shelf) && sq.shelf[i]) || null);
  }
  return sq;
}
// les compteurs du jour (achats, rangements payés), remis à zéro chaque jour
function sqDay() {
  const sq = sqState(),
    today = todayKey();
  if (!sq.day || sq.day.date !== today) sq.day = { date: today, bought: 0, sorted: 0 };
  return sq.day;
}

/** @param {string} id */
function squishyCount(id) {
  return sqState().owned[id] || 0;
}
function squishyOwnedIds() {
  return Object.keys(SQUISHIES).filter((id) => squishyCount(id) > 0);
}
function squishyBoxCount() {
  return sqState().boxes.length;
}
/** @param {string} series */
function squishySeriesProgress(series) {
  const ids = squishiesOf(series);
  return { have: ids.filter((id) => squishyCount(id) > 0).length, total: ids.length };
}
/** @param {string} series */
function squishySeriesComplete(series) {
  const p = squishySeriesProgress(series);
  return p.have === p.total;
}
// Une série liée à une île (`world`, saison 2) n'apparaît qu'une fois l'île
// ouverte : ni dans la chambre, ni dans les boîtes mystère, ni au marché.
/** @param {string} series */
function squishySeriesAvailable(series) {
  const s = SQUISHY_SERIES[series];
  return !!s && (!s.world || worldUnlocked(s.world));
}
function availableSeries() {
  return SQUISHY_SERIES_ORDER.filter(squishySeriesAvailable);
}
/** @param {string} [series] une série, ou toutes celles ouvertes */
function squishyMissing(series) {
  const ids = series ? squishiesOf(series) : availableSeries().flatMap(squishiesOf);
  return ids.filter((id) => !squishyCount(id));
}

/* ---- gagner des boîtes ---- */
// Les écrans (pastille 🧸…) s'inscrivent ici pour se mettre à jour.
/** @type {Array<() => void>} */
const squishyChangeHooks = [];
/** @param {() => void} fn */
function onSquishyChange(fn) {
  squishyChangeHooks.push(fn);
}
function squishyChanged() {
  squishyChangeHooks.forEach((fn) => fn());
}

// series : id d'une série, ou null pour une boîte « mystère »
/** @param {string | null | undefined} series */
function addSquishyBox(series) {
  const sq = sqState();
  sq.boxes.push(series && SQUISHY_SERIES[series] ? series : null);
  save();
  squishyChanged();
  return sq.boxes.length;
}
// Énigme d'histoire résolue : la boîte de la série de l'île, une seule fois.
// Renvoie { series } (null : boîte mystère), ou null si déjà donnée.
/** @param {string} world */
function addStorySquishyBox(world) {
  const sq = sqState();
  if (sq.fromStory[world]) return null;
  sq.fromStory[world] = true;
  const series = SQUISHY_ISLAND_SERIES[world] || null;
  addSquishyBox(series);
  return { series };
}

// Boutique du marché : { ok:true } ou { ok:false, reason:'limit'|'coins' }
function squishyShopState() {
  const day = sqDay();
  return { left: Math.max(0, SQ_BUY_MAX - day.bought), price: SQ_BOX_PRICE, canPay: state.coins >= SQ_BOX_PRICE };
}
function buySquishyBox() {
  const day = sqDay();
  if (day.bought >= SQ_BUY_MAX) return { ok: false, reason: 'limit' };
  if (state.coins < SQ_BOX_PRICE) return { ok: false, reason: 'coins' };
  day.bought++;
  addCoins(-SQ_BOX_PRICE);
  addSquishyBox(null);
  return { ok: true };
}

/* ---- ouvrir une boîte (tirage doux) ----
   70 % commun, 25 % rare, 5 % ✨, dans la série de la boîte. Une boîte
   mystère choisit une série pas encore complète (s'il en reste).
   Filet de sécurité : après 3 boîtes d'affilée sans nouveauté, la suivante
   donne un squishy jamais obtenu : de sa série s'il en reste, sinon de
   n'importe quelle série. Une série complète est ignorée par le filet : un
   double y est inévitable, il ne compte pas comme une boîte « sans
   nouveauté ».
   Renvoie { id, isNew, count, series, seriesCompleted, rarity } ou null. */
/**
 * @template T
 * @param {T[]} list
 * @param {Rng} rng
 * @returns {T}
 */
function sqPick(list, rng) {
  return list[Math.min(list.length - 1, Math.floor(rng() * list.length))];
}
/** @param {Rng} rng */
function squishyRollRarity(rng) {
  const r = rng();
  if (r < SQUISHY_RARITY.commun.chance) return 'commun';
  if (r < SQUISHY_RARITY.commun.chance + SQUISHY_RARITY.rare.chance) return 'rare';
  return 'brille';
}
/**
 * Une boîte ouverte : `count` = exemplaires après l'ouverture, `seriesCompleted`
 * = la série vient d'être complétée (bonus versé).
 * @typedef {{
 *   id: string,
 *   isNew: boolean,
 *   count: number,
 *   series: string,
 *   seriesCompleted: boolean,
 *   rarity: string,
 * }} OpenedBox
 */
/**
 * @param {Rng} [rng]
 * @returns {OpenedBox | null}
 */
function openSquishyBox(rng = random) {
  const sq = sqState();
  if (!sq.boxes.length) return null;
  let series = sq.boxes.shift();
  if (!series || !SQUISHY_SERIES[series]) {
    const open = availableSeries().filter((s) => !squishySeriesComplete(s));
    series = sqPick(open.length ? open : availableSeries(), rng);
  }
  const seriesHadMissing = squishyMissing(series).length > 0;
  let id;
  if (sq.dry >= SQ_DRY_MAX && squishyMissing().length) {
    const here = squishyMissing(series);
    id = sqPick(here.length ? here : squishyMissing(), rng);
  } else {
    const rarity = squishyRollRarity(rng);
    const pool = squishiesOf(series).filter((x) => SQUISHIES[x].rarity === rarity);
    id = sqPick(pool.length ? pool : squishiesOf(series), rng);
  }
  const isNew = !squishyCount(id);
  sq.owned[id] = squishyCount(id) + 1;
  if (isNew) sq.dry = 0;
  else if (seriesHadMissing) sq.dry++;
  const seriesCompleted = squishyCheckSeriesDone(SQUISHIES[id].series);
  save();
  squishyChanged();
  return {
    id,
    isNew,
    count: sq.owned[id],
    series: SQUISHIES[id].series,
    seriesCompleted,
    rarity: SQUISHIES[id].rarity,
  };
}
// Une série vient d'être complétée : 20 pièces, une seule fois par série
/** @param {string} series */
function squishyCheckSeriesDone(series) {
  const sq = sqState();
  if (sq.done[series] || !squishySeriesComplete(series)) return false;
  sq.done[series] = true;
  addCoins(SQ_SERIES_BONUS);
  return true;
}

/* ---- échanger ses doubles ----
   Un double est un exemplaire au-delà du premier. 3 doubles, quels qu'ils
   soient, donnent 1 squishy manquant au choix. On donne d'abord ceux qu'on
   a en plus grand nombre. */
function squishyDuplicates() {
  const owned = sqState().owned;
  return Object.keys(owned).reduce((n, id) => n + Math.max(0, (owned[id] || 0) - 1), 0);
}
/** @param {string} id le squishy manquant voulu */
function tradeDuplicatesFor(id) {
  const sq = sqState();
  if (!SQUISHIES[id] || squishyCount(id) > 0 || squishyDuplicates() < SQ_TRADE_COST) return { ok: false };
  for (let i = 0; i < SQ_TRADE_COST; i++) {
    const most = Object.keys(sq.owned)
      .filter((x) => sq.owned[x] > 1)
      .sort((a, b) => sq.owned[b] - sq.owned[a])[0];
    sq.owned[most]--;
  }
  sq.owned[id] = 1;
  const seriesCompleted = squishyCheckSeriesDone(SQUISHIES[id].series);
  save();
  squishyChanged();
  return { ok: true, id, seriesCompleted };
}

/* ---- l'étagère : 12 emplacements libres, purement décoratifs ---- */
/** @param {string} id */
function squishyShelfCount(id) {
  return sqState().shelf.filter((x) => x === id).length;
}
// on ne pose pas plus d'exemplaires qu'on n'en a
/**
 * @param {number} slot
 * @param {string} id
 */
function shelfPlace(slot, id) {
  const sq = sqState();
  if (slot < 0 || slot >= SQ_SHELF_SLOTS || !SQUISHIES[id]) return false;
  if (sq.shelf[slot] !== id && squishyShelfCount(id) >= squishyCount(id)) return false;
  sq.shelf[slot] = id;
  save();
  return true;
}
/** @param {number} slot */
function shelfRemove(slot) {
  const sq = sqState();
  if (!sq.shelf[slot]) return false;
  sq.shelf[slot] = null;
  save();
  return true;
}

/* ---- les boîtes de rangement à consigne (tri) ----
   Une consigne est une liste de 1 ou 2 critères { type, value } :
   type 'color' (rose…), 'shape' (rond, ovale, carre) ou 'size' (petit,
   grand). Elle n'est proposée que si la collection permet de la réussir :
   au moins 4 exemplaires qui la respectent et 2 qui ne la respectent pas
   (les doubles comptent : on range des squishies, pas des modèles).

   Difficulté (`level`) : 1 = un critère, la couleur ; 2 = un critère au
   choix ; 3 = deux critères. Elle suit l'âge (moins de 6 ans ou sans âge :
   1 ; 6-7 ans : 2 ; 8 ans et plus : 3) et le niveau adaptatif de l'enfant
   (state.skills.rangement.lvl), sans jamais dépasser le plafond de l'âge. */
/** @type {Record<string, { s: string, p: string }>} le mot au singulier et au pluriel */
const SQ_SORT_SHAPES = {
  rond: { s: 'rond', p: 'ronds' },
  ovale: { s: 'ovale', p: 'ovales' },
  carre: { s: 'carré', p: 'carrés' },
};
/** @type {Record<string, { s: string, p: string }>} */
const SQ_SORT_SIZES = { petit: { s: 'petit', p: 'petits' }, grand: { s: 'grand', p: 'grands' } };

/** @param {unknown} age un nombre, une chaîne ou rien : lu par Number */
function sortLevelCap(age) {
  const a = Number(age);
  if (!a || a < 6) return 1;
  if (a < 8) return 2;
  return 3;
}
/** @param {unknown} age */
function sortLevelFor(age) {
  const cap = sortLevelCap(age);
  const s = (state.skills || {}).rangement;
  return Math.max(1, Math.min(cap, (s && s.lvl) || cap));
}

/**
 * @param {string} id
 * @param {SortCriterion[]} criteria
 */
function sortMatches(id, criteria) {
  const m = SQUISHIES[id];
  return criteria.every((c) => m[c.type] === c.value);
}
// tous les exemplaires de la collection (un double apparaît deux fois)
/** @param {Record<string, number> | null | undefined} owned */
function sortCopies(owned) {
  return (
    Object.keys(owned || {})
      // owned existe ici : sans lui, Object.keys n'a rien donné
      .filter((id) => SQUISHIES[id] && /** @type {Record<string, number>} */ (owned)[id] > 0)
      .flatMap((id) => /** @type {string[]} */ (Array(/** @type {Record<string, number>} */ (owned)[id]).fill(id)))
  );
}
/**
 * @param {number} level
 * @returns {SortCriterion[][]}
 */
function sortCandidates(level) {
  /** @param {SortCriterion['type']} type */
  const values = (type) => [...new Set(Object.values(SQUISHIES).map((m) => m[type]))].map((value) => ({ type, value }));
  const colors = values('color'),
    shapes = values('shape'),
    sizes = values('size');
  if (level <= 1) return colors.map((c) => [c]);
  if (level === 2) return [...colors, ...shapes, ...sizes].map((c) => [c]);
  /** @type {SortCriterion[][]} */
  const pairs = [];
  colors.forEach((c) => {
    shapes.forEach((s) => pairs.push([c, s]));
    sizes.forEach((z) => pairs.push([z, c]));
  });
  shapes.forEach((s) => sizes.forEach((z) => pairs.push([z, s])));
  return pairs;
}
/**
 * @param {string[]} copies
 * @param {SortCriterion[]} criteria
 */
function sortFeasible(copies, criteria) {
  const ok = copies.filter((id) => sortMatches(id, criteria)).length;
  return ok >= SQ_SORT_SLOTS && copies.length - ok >= 2;
}

// La phrase de la consigne : « Range les petits squishies roses ! »
/** @param {SortCriterion[]} criteria */
function sortSay(criteria) {
  const size = criteria.find((c) => c.type === 'size');
  const adj = criteria
    .filter((c) => c.type !== 'size')
    .map((c) => (c.type === 'color' ? SQ_COLORS[c.value].adj[1] : SQ_SORT_SHAPES[c.value].p));
  return `Range les ${size ? SQ_SORT_SIZES[size.value].p + ' ' : ''}squishies${adj.length ? ' ' + adj.join(' et ') : ''}`;
}

/** @param {SortCriterion[]} cr */
const sortKey = (cr) => cr.map((c) => c.type + ':' + c.value).join('+');

/* Les consignes possibles au palier voulu ; deux critères impossibles avec
   cette collection : un seul, en attendant. */
/**
 * @param {string[]} copies
 * @param {number} wanted
 */
function sortPool(copies, wanted) {
  let level = wanted,
    /** @type {SortCriterion[][]} */
    pool = [];
  for (; level >= 1; level--) {
    pool = sortCandidates(level).filter((cr) => sortFeasible(copies, cr));
    if (pool.length) break;
  }
  return { level, pool };
}

// n squishies pris au hasard dans la liste ; collection trop petite : on répète
/**
 * @param {string[]} list
 * @param {number} n
 * @param {Rng} rng
 */
function sortTake(list, n, rng) {
  const bag = shuffleWith(list.slice(), rng),
    /** @type {string[]} */
    out = [];
  // bag.length vérifié : shift donne un id
  while (out.length < n && bag.length) out.push(/** @type {string} */ (bag.shift()));
  let i = 0;
  while (out.length < n && list.length) out.push(list[i++ % list.length]); // collection trop petite : on répète
  return out;
}

// le plateau : 4 ou 5 qui vont dans la boîte, le reste non (au moins 2)
/**
 * @param {string[]} copies
 * @param {SortCriterion[]} criteria
 * @param {Rng} rng
 */
function sortBoard(copies, criteria, rng) {
  const yes = copies.filter((id) => sortMatches(id, criteria));
  const no = copies.filter((id) => !sortMatches(id, criteria));
  const nYes = Math.min(SQ_SORT_SLOTS + 1, yes.length, SQ_SORT_CHOICES - 2);
  // deux critères : d'abord des « presque » (un seul des deux), pour regarder les deux
  const near = criteria.length > 1 ? no.filter((id) => criteria.some((c) => SQUISHIES[id][c.type] === c.value)) : [];
  const nNear = Math.min(near.length, 2);
  const noPart = sortTake(near, nNear, rng);
  const rest = no.slice();
  noPart.forEach((id) => {
    const i = rest.indexOf(id);
    if (i >= 0) rest.splice(i, 1);
  });
  return shuffleWith(
    [...sortTake(yes, nYes, rng), ...noPart, ...sortTake(rest.length ? rest : no, SQ_SORT_CHOICES - nYes - nNear, rng)],
    rng,
  );
}

/* Prépare une boîte de rangement, ou null si la collection ne le permet pas
   encore. `avoid` : la consigne précédente (après 2 erreurs, on en change).
   Renvoie { criteria, say, level, items:[8 ids], targets } */
/**
 * @param {Record<string, number> | null | undefined} owned
 * @param {unknown} age
 * @param {{ rng?: Rng, level?: number, avoid?: string }} [opts]
 * @returns {SortingTask | null}
 */
function makeSortingTask(owned, age, opts = {}) {
  const rng = opts.rng || random;
  // owned existe dans le filtre : sans lui, Object.keys n'a rien donné
  const models = Object.keys(owned || {}).filter(
    (id) => SQUISHIES[id] && /** @type {Record<string, number>} */ (owned)[id] > 0,
  );
  if (models.length < SQ_SORT_MIN_MODELS) return null;
  const copies = sortCopies(owned);
  let { level, pool } = sortPool(copies, opts.level || sortLevelFor(age));
  if (!pool.length) return null;
  if (opts.avoid && pool.length > 1) pool = pool.filter((cr) => sortKey(cr) !== opts.avoid);
  const criteria = sqPick(pool, rng);
  const items = sortBoard(copies, criteria, rng);
  return {
    criteria,
    key: sortKey(criteria),
    say: sortSay(criteria),
    level,
    items,
    targets: items.filter((id) => sortMatches(id, criteria)).length,
  };
}
/**
 * @template T
 * @param {T[]} a mélangé sur place
 * @param {Rng} rng
 */
function shuffleWith(a, rng) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// L'indice parlé quand un squishy ne va pas dans la boîte :
// « Lui, il est bleu. On cherche des roses ! »
/**
 * @param {string} id
 * @param {SortCriterion[]} criteria
 */
function sortWrongHint(id, criteria) {
  const m = SQUISHIES[id];
  const bad = criteria.find((c) => m[c.type] !== c.value) || criteria[0];
  /**
   * @param {SortCriterion['type']} type
   * @param {string} value
   * @param {boolean} plural
   */
  const word = (type, value, plural) => {
    if (type === 'color') return SQ_COLORS[value].adj[plural ? 1 : 0];
    if (type === 'shape') return SQ_SORT_SHAPES[value][plural ? 'p' : 's'];
    return SQ_SORT_SIZES[value][plural ? 'p' : 's'];
  };
  return `Lui, il est ${word(bad.type, m[bad.type], false)}. On cherche des ${word(bad.type, bad.value, true)} !`;
}

/* ---- les progrès du rangement (espace parents, niveau adaptatif) ----
   Comme un mini-jeu : state.skills.rangement = { wins, fails, errors, last,
   recent, hints, lvl, atLvl, support }. Une boîte remplie est une réussite ;
   2 erreurs (nouvelle consigne) comptent comme une boîte ratée. On
   redescend d'un cran après 2 ratées sur les 3 dernières, on remonte après
   2 réussites d'affilée avec au plus 1 erreur, jusqu'au plafond de l'âge. */
/**
 * @param {boolean} ok
 * @param {{ errors: number, level: number, age: unknown }} box les erreurs, le niveau de la boîte, l'âge
 */
function recordSorting(ok, box) {
  const { errors, level, age } = box;
  if (!state.skills) state.skills = {};
  const s =
    state.skills.rangement ||
    (state.skills.rangement = { wins: 0, fails: 0, errors: 0, last: null, recent: [], hints: 0 });
  const cap = sortLevelCap(age);
  if (!s.lvl) s.lvl = cap;
  if (ok) s.wins++;
  else s.fails++;
  s.errors += errors;
  s.last = todayKey();
  s.recent = (s.recent || []).concat({ t: level, e: errors, ok: !!ok }).slice(-10);
  if (level === s.lvl) {
    s.atLvl = (s.atLvl || []).concat({ ok: !!ok, e: errors }).slice(-3);
    const streak = s.atLvl.slice(-2);
    if (streak.length === 2 && streak.every((x) => x.ok && x.e <= 1) && s.lvl < cap) {
      s.lvl++;
      s.atLvl = [];
      s.support = false;
    } else if (s.atLvl.filter((x) => !x.ok).length >= 2 && s.lvl > 1) {
      s.lvl--;
      s.atLvl = [];
      s.support = true;
    }
  }
  save();
}
// Une boîte bien remplie : 5 pièces pour les 3 premières du jour.
// Renvoie le nombre de pièces gagnées.
/**
 * @param {number} errors
 * @param {number} level
 * @param {unknown} age
 */
function sortingDone(errors, level, age) {
  const sq = sqState(),
    day = sqDay();
  sq.sorted++;
  const paid = day.sorted < SQ_SORT_PAID_MAX;
  day.sorted++;
  recordSorting(true, { errors, level, age });
  if (paid) addCoins(SQ_SORT_REWARD);
  save();
  return paid ? SQ_SORT_REWARD : 0;
}
function sortingPaidLeft() {
  return Math.max(0, SQ_SORT_PAID_MAX - sqDay().sorted);
}

/* ---- les trésors : des squishies uniques (case « Trésors »), jamais tirés
   d'une boîte ni échangés : ils ne sont pas dans SQUISHIES. ---- */
function squishyTreasures() {
  const sq = sqState();
  if (!Array.isArray(sq.treasures)) sq.treasures = [];
  return sq.treasures;
}
/** @param {string} id */
function squishyTreasureOwned(id) {
  return squishyTreasures().includes(id);
}
// donne un trésor (une seule fois) ; vrai s'il est nouveau
/** @param {string} id */
function grantSquishyTreasure(id) {
  if (!SQUISHY_TREASURES[id] || squishyTreasureOwned(id)) return false;
  squishyTreasures().push(id);
  save();
  return true;
}

export {
  addSquishyBox,
  addStorySquishyBox,
  buySquishyBox,
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
  SQ_BOX_PRICE,
  SQ_SERIES_BONUS,
  SQ_SORT_MAX_ERRORS,
  SQ_SORT_MIN_MODELS,
  SQ_SORT_REWARD,
  SQ_SORT_SHAPES,
  SQ_SORT_SIZES,
  SQ_SORT_SLOTS,
  SQ_TRADE_COST,
  sqState,
  squishyBoxCount,
  squishyCount,
  squishyDuplicates,
  squishyMissing,
  squishyOwnedIds,
  squishySeriesAvailable,
  squishySeriesProgress,
  squishyShelfCount,
  squishyShopState,
  squishyTreasureOwned,
  squishyTreasures,
  grantSquishyTreasure,
  tradeDuplicatesFor,
};
