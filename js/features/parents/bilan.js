/* ---------- Le bilan de la semaine (track bilan-parents) ----------
   L'espace parents montre beaucoup de chiffres par jeu, mais ne dit pas quoi
   faire. Cette carte « 🧭 Cette semaine » se lit en dix secondes : ce qui va
   bien, ce qui résiste cette semaine (3 jeux au plus) et, pour chacun, une
   idée simple à faire avec l'enfant, loin de l'écran.
   - Rien n'est stocké : la carte se calcule à l'affichage depuis `skills`.
   - Aucune note, aucun pourcentage, aucune comparaison avec d'autres enfants,
     et rien ne quitte l'appareil (test/bilan.test.js le vérifie).
   - La partie peut venir d'une sauvegarde importée : elle est déjà passée par
     readSave, et `bilanSkill` écarte en plus toute entrée qu'une partie écrite
     par le jeu ne peut pas contenir. Le bilan n'écrit jamais dans la partie.
   - Ce fichier n'importe rien de parents.js (pas de cycle) : il s'inscrit sur
     l'événement `parents:cards`, comme storage-alert.js. */
import { GAME_LIST } from '../../entities/difficulty/index.js';
import { emit, on } from '../../shared/lib/index.js';
import { skillStatus, todayKey } from '../adaptive/index.js';

/** Le suivi d'un jeu, tel que readSave le remet en forme.
 * @typedef {import('../../entities/game-state/index.js').GameState['skills'][string]} BilanSkill */

const BILAN_DAYS = 7; // la fenêtre de la semaine : aujourd'hui et les 6 jours d'avant
const BILAN_MAX = 3; // au plus 3 jeux cités par bloc : court et faisable le soir même
// Le palier montré est celui de la dernière mission jouée (`t`), pas `lvl`,
// qui peut dépasser d'un cran le palier vraiment joué quand l'âge plafonne.
/** @type {Record<number, string>} */
const BILAN_TIER_LABELS = {
  1: 'GS, début CP',
  2: 'CP',
  3: 'fin CP, CE1',
  4: 'CE1',
  5: 'fin CE1, CE2',
  6: 'CE2',
};
// Une idée sans écran par jeu suivi (les clés de GAME_LIST et de SKILL_GROUPS).
// Un nouveau mini-jeu ajoute la sienne (conductor/checklist-mini-jeu.md) : sans
// elle, test/bilan.test.js échoue. Textes constants, sans <, >, & ni " : ils
// s'insèrent tels quels dans la carte. `name` : pour une activité absente de
// GAME_LIST (les boîtes de rangement de la chambre à squishies).
/** @type {Record<string, { tip: string, name?: string }>} */
const BILAN_TIPS = {
  memory: {
    tip: 'Posez 5 objets de la maison sur la table, laissez votre enfant les regarder, cachez-en un sous un torchon : lequel a disparu ?',
  },
  count: {
    tip: 'En mettant la table, comptez ensemble les couverts en touchant chacun une seule fois, puis demandez : « Combien en tout ? »',
  },
  diff: {
    tip: "Posez 4 cuillères et 1 fourchette, puis demandez lequel n'est pas de la même famille, et pourquoi.",
  },
  puzzle: {
    tip: 'Écrivez 5 nombres sur des bouts de papier, mélangez-les et rangez-les ensemble du plus petit au plus grand.',
  },
  sequence: {
    tip: 'Faites une suite avec des couverts (fourchette, cuillère, fourchette, cuillère) et demandez ce qui vient après.',
  },
  simon: {
    tip: "Montrez 3 objets de couleurs différentes dans un ordre, cachez-les, et demandez de refaire l'ordre ; ajoutez-en un quand c'est réussi.",
  },
  math: {
    tip: "À table, avec de vrais objets : « Tu as 3 pâtes, j'en ajoute 2, combien en as-tu ? » Puis la même question sans regarder.",
  },
  reading: {
    tip: 'Lisez ensemble un mot court sur un paquet ou une étiquette, en montrant chaque syllabe du doigt.',
  },
  determinants: {
    tip: 'Montrez un objet de la cuisine et jouez à « un ou une ? » : une cuillère, un verre, une assiette.',
  },
  volume: {
    tip: "Prenez deux verres de formes différentes : lequel contient le plus ? Vérifiez en transvasant l'eau.",
  },
  compare: { tip: 'Lancez deux dés ou tirez deux cartes : chacun dit quel nombre est le plus grand.' },
  money: {
    tip: 'Jouez à la marchande avec de vraies pièces : « Ça coûte 5 euros, quelles pièces donnes-tu ? »',
  },
  clock: {
    tip: 'Regardez ensemble une horloge à aiguilles plusieurs fois dans la journée : « La petite aiguille est sur le 7, il est 7 heures. »',
  },
  calendar: {
    tip: "Au dîner : « Quel jour sommes-nous ? Et demain ? » ; à la fenêtre : « Quelle saison, d'après les arbres ? »",
  },
  calc: {
    tip: 'En voiture ou à table, posez un calcul court à voix haute (« 5 plus 5 ? ») et laissez le temps de répondre, sans presser.',
  },
  shapes: {
    tip: "Cherchez dans la cuisine un objet rond, un carré, un triangle, puis comptez ensemble les coins d'une boîte.",
  },
  planets: {
    tip: "Avec une lampe et une orange : la lampe est le Soleil ; tournez l'orange pour montrer le jour et la nuit.",
  },
  jigsaw: { tip: 'Découpez une image de magazine en 4 morceaux et reconstituez-la ensemble.' },
  nesting: { tip: 'Rangez 3 ou 4 bols du plus petit au plus grand, puis emboîtez-les.' },
  cubes: {
    tip: "Empilez quelques morceaux de sucre ou des briques, puis demandez combien il y en a, même ceux qu'on ne voit pas.",
  },
  packs: { tip: 'Faites des tas de 2 pâtes et comptez tas par tas : « 2, 4, 6. »' },
  shelf: {
    tip: 'Posez des petits objets dans une boîte à œufs et décrivez leur place : « en haut, à gauche ».',
  },
  share: { tip: 'En coupant une crêpe ou une pomme, demandez : « Est-ce que chacun a la même part ? »' },
  recipe: {
    tip: 'Faites une vraie recette ensemble : votre enfant verse et mesure avec le verre doseur, les cuillères ou la balance.',
  },
  rhythm: { tip: 'Tapez dans les mains un rythme court (long, court, court) et demandez de le refaire.' },
  pitch: {
    tip: "Tapez doucement sur des verres plus ou moins remplis d'eau : lequel fait le son le plus aigu ?",
  },
  lifecycle: {
    tip: 'Faites germer une lentille ou un haricot dans du coton mouillé et regardez-le pousser chaque jour.',
  },
  ladybugs: { tip: 'Avec des pâtes : « Fais le double de 3 », puis « Partage 8 en deux tas pareils. »' },
  potions: {
    tip: 'Mélangez deux couleurs de peinture ou de pâte à modeler : « Jaune et bleu, ça donne quoi ? »',
  },
  mirror: {
    tip: "Posez un ruban sur la table ; placez 3 objets d'un côté et demandez de les placer en miroir de l'autre côté.",
  },
  rangement: {
    name: '📦 Boîtes de rangement',
    tip: "Triez ensemble le linge ou les jouets selon une règle choisie par votre enfant : la couleur, la taille ou l'usage.",
  },
};

/**
 * Échappe la seule phrase qui vient d'une autre slice (`bilan:error-kind`).
 * L'apostrophe reste telle quelle : aucun attribut n'est délimité par elle.
 * @param {string} s
 * @returns {string}
 */
function bilanEsc(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/**
 * Politique « Entrée du bilan » : une entrée dont un champ est hors de ce
 * qu'une partie écrite par le jeu peut contenir (import abîmé) est ignorée
 * partout, sans correction de la sauvegarde. Sinon, une copie : tout le bilan
 * ne lit qu'elle, et un écouteur ne peut pas toucher à la partie.
 * @param {BilanSkill} s entrée déjà remise en forme par readSave
 * @returns {BilanSkill | null}
 */
function bilanSkill(s) {
  if (s.last !== null && !/^\d{4}-\d{2}-\d{2}$/.test(s.last)) return null;
  if (!Number.isInteger(s.wins) || !Number.isInteger(s.fails)) return null;
  if (s.recent.length > 10) return null;
  if (s.recent.some((r) => !Number.isInteger(r.t) || r.t < 1 || r.t > 6 || !Number.isInteger(r.e))) return null;
  /** @type {BilanSkill} */
  const copy = {
    wins: s.wins,
    fails: s.fails,
    errors: 0, // jamais lu par le bilan : présent pour que la copie soit un suivi complet
    last: s.last,
    recent: s.recent.map((r) => ({ t: r.t, e: r.e, ok: r.ok })),
  };
  if (s.support === true) copy.support = true;
  return copy;
}

/** @param {string} key une clé de BILAN_TIPS */
function bilanName(key) {
  const own = BILAN_TIPS[key].name;
  if (own) return own;
  const g = GAME_LIST.find((x) => x.key === key);
  return g ? `${g.emoji} ${g.name}` : key;
}

/**
 * L'étoile de la track « aller plus loin », si elle existe un jour dans la
 * partie : lue sans rien supposer, elle ne fait jamais ignorer le jeu.
 * @param {unknown} stars
 * @param {string} key
 */
function bilanStar(stars, key) {
  if (!stars || typeof stars !== 'object') return false;
  const entry = /** @type {Record<string, unknown>} */ (stars)[key];
  if (!entry || typeof entry !== 'object' || !('won' in entry)) return false;
  const won = entry.won;
  return typeof won === 'number' && Number.isInteger(won) && won >= 1;
}

/**
 * Règle « Réponse d'erreur » : la première phrase non vide renvoyée par un
 * écouteur, coupée à 80 caractères avant l'échappement. Tout le reste
 * (rien, nombre, objet, écouteur qui plante) est ignoré.
 * @param {string} key
 * @param {BilanSkill} s
 */
function bilanErrorKind(key, s) {
  // l'écouteur reçoit sa propre copie : il ne peut changer ni la partie ni la carte
  for (const reply of emit('bilan:error-kind', { key, s: bilanSkill(s) })) {
    if (typeof reply !== 'string') continue;
    const text = reply.trim();
    // par caractère entier, pour ne pas couper un emoji en deux
    if (text) return bilanEsc(Array.from(text).slice(0, 80).join(''));
  }
  return '';
}

/**
 * @param {string} a
 * @param {string} b
 */
function bilanCompare(a, b) {
  if (a < b) return -1;
  return a > b ? 1 : 0;
}

/**
 * La ligne d'un jeu qui résiste : son nom, le palier vraiment joué, l'erreur
 * fréquente si une autre slice la connaît, puis l'idée sans écran.
 * @param {string} key
 * @param {BilanSkill} s
 */
function bilanHardRow(key, s) {
  const tier = s.recent.length ? Number(s.recent[s.recent.length - 1].t) || 0 : 0;
  const kind = bilanErrorKind(key, s);
  const where = tier ? ` · palier ${tier} (repère : ${BILAN_TIER_LABELS[tier]})` : '';
  return `<li><p class="bilan-game"><strong>${bilanName(key)}</strong>${where}${kind ? ` · Erreur fréquente : ${kind}` : ''}</p>
      <p class="bilan-tip">Une idée sans écran : ${BILAN_TIPS[key].tip}</p></li>`;
}

/**
 * La carte « 🧭 Cette semaine » d'une partie (celle de l'enfant affiché).
 * @param {{ skills?: unknown, stars?: unknown }} st
 * @returns {string}
 */
function bilanHTML(st) {
  // toute partie vue ici est passée par readSave (load ou profileState), qui
  // garantit la forme des entrées ; une lecture échouée donne {}
  const skills =
    st.skills && typeof st.skills === 'object' ? /** @type {Record<string, BilanSkill | undefined>} */ (st.skills) : {};
  // calendrier local, sans dérive à l'heure d'été (contrairement à Date.now() - 6 jours)
  const start = new Date();
  start.setDate(start.getDate() - (BILAN_DAYS - 1));
  const from = todayKey(start),
    to = todayKey();

  const rows = [];
  for (const key of Object.keys(BILAN_TIPS)) {
    const raw = skills[key];
    const s = raw ? bilanSkill(raw) : null;
    if (!s) continue;
    const status = skillStatus(s, key);
    // les dates AAAA-MM-JJ se comparent comme du texte ; une date future est hors fenêtre
    const inWeek = s.last !== null && from <= s.last && s.last <= to;
    rows.push({
      key,
      s,
      status,
      inWeek,
      last: s.last || '',
      // « résiste » : joué cette semaine, et redescendu d'un cran ou « à travailler »
      hard: inWeek && (s.support === true || status === 'difficile'),
      missed: s.recent.slice(-6).filter((r) => !r.ok).length,
    });
  }
  const played = rows.some((r) => r.inWeek);
  const hard = rows
    .filter((r) => r.hard)
    .sort(
      (a, b) =>
        Number(b.s.support === true) - Number(a.s.support === true) ||
        b.missed - a.missed ||
        bilanCompare(b.last, a.last) ||
        bilanCompare(a.key, b.key),
    )
    .slice(0, BILAN_MAX);
  // un jeu qui résiste n'est jamais cité dans « va bien », même coupé par la limite
  const good = rows
    .filter((r) => r.status === 'aise' && !r.hard)
    .sort((a, b) => bilanCompare(b.last, a.last) || bilanCompare(a.key, b.key))
    .slice(0, BILAN_MAX);

  const parts = [];
  if (!played) parts.push(`<p>Pas de partie ces ${BILAN_DAYS} derniers jours.</p>`);
  if (good.length) {
    const names = good.map((r) => bilanName(r.key) + (bilanStar(st.stars, r.key) ? ' ⭐' : ''));
    parts.push(`<p class="bilan-good">Ce qui va bien : ${names.join(', ')}</p>`);
  }
  if (hard.length) {
    parts.push(`<p>Ce qui résiste cette semaine :</p>
    <ul class="bilan-list">${hard.map((r) => bilanHardRow(r.key, r.s)).join('')}</ul>`);
  } else if (played) parts.push('<p>Rien ne résiste cette semaine.</p>');
  return `<section class="bk-card ps-bilan"><h3>🧭 Cette semaine</h3>
    ${parts.join('\n    ')}
    <p class="bk-help">Ces idées viennent des parties jouées sur cet appareil. Rien n'est envoyé ailleurs.</p>
  </section>`;
}

on('parents:cards', (/** @type {{ st: { skills?: unknown, stars?: unknown } }} */ { st }) => bilanHTML(st));
