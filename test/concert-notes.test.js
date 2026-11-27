// L'Île du Grand Concert : le mini-jeu « Do, ré, mi » (notes) : critères 5 à
// 11 de la spec, table `notesRound`, « Textes de notes », « Indices » et
// contrat DOM. Ses tables (critères 12 à 14) : test/concert-tables.test.js.
// Harnais : test/tools/concert.js.
const t = require('./tools/concert.js');
const { ev, json, check, section, all, one, XYLO, INK, NOTES_T, TIERS } = t;

const TEXTS = {
  hear: () => ['Quelle lame chante cette note ?', 'Écoute la note de Dorémi, puis touche la lame qui chante pareil.'],
  name: (nom) => [`Touche le ${nom} !`, `Trouve la lame du ${nom}, et touche-la !`],
  read: () => [
    'Quelle note est sur la portée ?',
    'Regarde la note sur la portée, et touche la lame qui porte son nom.',
  ],
  find: (nom) => [`Où est le ${nom} ?`, `Touche la portée où le ${nom} est à sa place.`],
};
const HIGH =
  'Plus une note est haute sur la portée, plus elle chante aigu. Le do du bas a un petit trait rien qu’à lui.';
const HINTS = {
  hear: [
    ['Écoute bien. Les grandes lames chantent grave, les petites lames chantent aigu.', '.xylo'],
    ['Écoute encore la note, puis touche les lames une par une pour trouver celle qui chante pareil.', '#notes-listen'],
  ],
  name: [
    ['Les notes se suivent toujours dans le même ordre, de la plus grande lame à la plus petite.', '.xylo'],
    ['Pars du do, la plus grande lame, et avance en chantant les notes jusqu’à la tienne.', '.xylo'],
  ],
  read: [
    [HIGH, '#notes-staff'],
    ['Pars du do du bas. Monte d’une marche à chaque ligne et à chaque espace, en disant les notes.', '#notes-staff'],
  ],
  find: [
    [HIGH, '#notes-stage'],
    [
      'Pars du do du bas et monte marche par marche, en disant les notes. Puis cherche la note qui est à cette hauteur.',
      '#notes-stage',
    ],
  ],
};
const straight = (s) => s.replace(/’/g, "'");
const headOf = (root) => root.querySelector('.note-head');

// critère 5 : ce que montre chaque palier, et sa consigne
function palier(p) {
  const cfg = NOTES_T[p];
  t.startGame('notes', p);
  const n = t.target();
  const [title, say] = TEXTS[cfg.ask](XYLO[n].name);
  check(`critère 5, palier ${p} : « ${cfg.ask} », ses lames ou ses cases, sa consigne`, () => [
    json(ev(`notesRound(${p})`)) === json(cfg),
    one('.game-head h2').textContent === '🎹 Do, ré, mi',
    t.stage().dataset.ask === cfg.ask && cfg.targets.includes(n),
    json(t.ns('.xylo-lame')) === json(cfg.lames),
    all('.notes-find').length === (cfg.choices || 0),
    one('.puzzle-hint .hint-txt').textContent === title,
    t.sayBtn() === say,
    !!one('#notes-listen') === (p === 1),
    !one('#challenge-timer'),
  ]);
  const staff = one('#notes-staff');
  const shows = {
    hear: () => !!one('.notes-heard') && !staff && !one('.notes-name'),
    name: () => one('b.notes-name').textContent === XYLO[n].name && !one('b.notes-name').style.color && !staff,
    read: () =>
      staff.querySelectorAll('line.staff-line').length === cfg.staff &&
      staff.querySelectorAll('.note-head').length === 1 &&
      t.headN(headOf(staff)) === n &&
      headOf(staff).getAttribute('fill') === (cfg.colors ? XYLO[n].color : INK) &&
      staff.querySelectorAll('line.ledger-line').length === (n === 0 ? 1 : 0),
    find: () => one('b.notes-name').textContent === XYLO[n].name && !one('.xylo'),
  };
  check(`contrat DOM, palier ${p} : ce qu'on voit`, () => [shows[cfg.ask]()]);
  check(`« Jouable par le harnais », palier ${p} : la solution vise la cible`, () => [
    json(t.sol()) === json([`${p === 5 ? '.notes-find' : '.xylo-lame'}[data-n="${n}"]`]),
    all(t.sol()[0]).length === 1,
  ]);
}

// critère 6 : au palier 1, la note est jouée, le ♪ porte sa couleur, 🔈 la rejoue
async function ecoute() {
  t.spy();
  t.startGame('notes', 1);
  const n = t.target();
  const before = t.played().length;
  const once = await t.waitFor(() => t.played().length === 1, 500);
  await t.wait(60);
  const heard = one('.notes-heard');
  check('critère 6 : la note cible est jouée une fois, après 400 ms', () => [
    before === 0,
    once,
    json(t.played()) === json([XYLO[n].hz]),
  ]);
  check('critère 6 : un ♪ de la couleur de la cible', () => [
    heard.textContent === '♪',
    heard.dataset.n === String(n),
    heard.style.color === XYLO[n].rgb,
  ]);
  one('#notes-listen').click();
  check('critère 6 : « 🔈 Écouter » rejoue la note', () => [
    one('#notes-listen').textContent === '🔈 Écouter',
    json(t.played()) === json([XYLO[n].hz, XYLO[n].hz]),
  ]);
  t.unspy();
  ev('closeModal(); state.sound = false');
  t.startGame('notes', 1);
  check('critère 6 : le son coupé, le ♪ coloré est là', () => [
    one('.notes-heard').style.color === XYLO[t.target()].rgb,
  ]);
  ev('closeModal(); state.sound = true');
}

// critère 7 : la bonne réponse gagne ; au palier 4, l'un ou l'autre do
async function victoire() {
  for (const p of TIERS) {
    t.startGame('notes', p);
    one(t.sol()[0]).click();
    check(`critère 7, palier ${p} : la bonne réponse gagne la mission`, [await t.won()]);
  }
  for (const [low, other] of [
    [0, 7],
    [7, 0],
  ]) {
    const found = t.startNotesUntil(4, (n) => n === low);
    t.lame(other).click();
    check(`critère 7, palier 4 : la cible est le do ${low}, l'autre do (${other}) gagne aussi`, [
      found && (await t.won()),
    ]);
  }
  const mi = t.startNotesUntil(4, (n) => n === 2);
  t.lame(3).click();
  await t.wait(60);
  check('critère 7, palier 4 : une autre note ne gagne pas', () => [mi, !one('.win-box')]);
  ev('closeModal()');
}

// critère 8 : une erreur joue la note touchée, puis pose une AUTRE question
async function erreur() {
  t.startGame('notes', 1);
  t.spy();
  const first = t.target();
  const wrong = [0, 2, 4].find((n) => n !== first);
  const errors = ev('missionErrors');
  t.lame(wrong).click();
  const now = [t.played().pop() === XYLO[wrong].hz, ev('missionErrors') === errors + 1, !one('#lives-bar')];
  const other = await t.waitFor(() => !!t.stage() && t.target() !== first, 1500);
  check('critère 8 : la mauvaise lame joue sa note, une erreur est notée, les essais sont illimités', () => now);
  check('critère 8 : une autre question arrive (cible différente), sans victoire', () => [other, !one('.win-box')]);
  t.unspy();
  ev('closeModal()');
}

// critères 9 et 10 : jamais deux fois la même note ; les 5 petites portées
function tirages() {
  let prev = null;
  let distinct = true;
  for (const p of TIERS) {
    const seen = [];
    for (let k = 0; k < 25; k++) {
      t.startGame('notes', p);
      distinct = distinct && t.target() !== prev;
      prev = t.target();
      seen.push(prev);
    }
    check(`critère 9, palier ${p} : plusieurs cibles, toutes de la table`, () => [
      new Set(seen).size >= 3,
      seen.every((n) => NOTES_T[p].targets.includes(n)),
    ]);
  }
  check('critère 9 : jamais deux fois la même note d’affilée, même en changeant de palier', [distinct]);
  let fine = true;
  for (let k = 0; k < 40; k++) {
    t.startGame('notes', 5);
    const cases = all('.notes-find-row > button.notes-find');
    const found = cases.map((b) => Number(b.dataset.n));
    fine =
      fine &&
      cases.length === 5 &&
      new Set(found).size === 5 &&
      found.includes(t.target()) &&
      !(found.includes(0) && found.includes(7)) &&
      cases.every((b) => b.querySelectorAll('svg.notes-find-staff line.staff-line').length === 5) &&
      cases.every((b) => b.querySelectorAll('.note-head').length === 1) &&
      cases.every((b) => t.headN(headOf(b)) === Number(b.dataset.n) && headOf(b).getAttribute('fill') === INK) &&
      json(cases.map((b) => b.getAttribute('aria-label'))) === json([1, 2, 3, 4, 5].map((i) => `Portée ${i}`));
  }
  check('critère 10 : 5 petites portées de 5 lignes, 5 notes différentes dont la cible, jamais les deux do', [fine]);
  ev('closeModal()');
}

// critère 11 : 2 indices distincts, ceux de la table, sans réponse écartée
function indices() {
  for (const p of [1, 2, 3, 5]) {
    t.startGame('notes', p);
    const ask = NOTES_T[p].ask;
    const lv = ev('hintsFor(hint.kind, hint.q)');
    check(`critère 11, « ${ask} » : ses 2 indices, rien d'écarté`, () => [
      lv.length === 2 && lv[0].say !== lv[1].say,
      json(lv.map((h) => [h.say, h.fx.glow])) === json(HINTS[ask].map(([s, g]) => [straight(s), g])),
      lv.every((h) => !h.fx.dim),
      ev('hint.choices') === (p === 5 ? '.notes-find' : '.xylo-lame'),
    ]);
  }
  t.startGame('notes', 1);
  t.spy();
  ev('hintsFor(hint.kind, hint.q)')[1].fx.run(one('#modal-body'));
  check('critère 11 : l’indice 2 de « hear » rejoue la note', () => [json(t.played()) === json([XYLO[t.target()].hz])]);
  t.unspy();
  ev('closeModal()');
}

(async () => {
  await t.start();
  section('Do, ré, mi : les paliers (critère 5)');
  TIERS.forEach(palier);
  section('Do, ré, mi : écouter (critère 6)');
  await ecoute();
  section('Do, ré, mi : gagner, se tromper (critères 7 et 8)');
  await victoire();
  await erreur();
  section('Do, ré, mi : tirages (critères 9 et 10)');
  tirages();
  section('Do, ré, mi : indices (critère 11)');
  indices();
  await t.finish('l’Île du Grand Concert (Do, ré, mi)');
})();
