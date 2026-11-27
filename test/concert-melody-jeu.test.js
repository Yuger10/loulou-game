// L'Île du Grand Concert : le mini-jeu « La mélodie » (melody), le jeu :
// critères 20 à 23 de la spec (rejouer, se tromper, réécouter, les indices).
// Son ouverture (critères 16 à 19) : test/concert-melody.test.js.
// Harnais : test/tools/concert.js. Les minuteries du jeu sont 10 fois plus courtes.
const t = require('./tools/concert.js');
const { ev, json, check, section, all, one, XYLO, MELODY_T, TIERS } = t;

const AGAIN = '🔁 Écoute encore…';
const READ = '📖 Lis la mélodie, puis joue-la !';
const youLabel = (p) => (p === 3 ? "👆 À toi ! Tu t'en souviens ?" : p > 3 ? READ : '👆 À toi !');
const HINTS = {
  listen: [
    'Écoute si la mélodie monte ou descend. Quand elle monte, on va vers les petites lames.',
    'Écoute et regarde encore, plus lentement. Puis rejoue depuis le début.',
  ],
  read: [
    'Lis les notes de gauche à droite. Plus une note est haute sur la portée, plus sa lame est petite.',
    'Écoute la mélodie plus lentement, en suivant les notes du doigt. Puis joue-la depuis le début.',
  ],
};
const done = () => all('#melody-score .ml-note').map((el) => el.classList.contains('done'));
const dotsOn = () => all('#melody-progress .game-progress i.on').length;
const progress = (pos, n) => one('#melody-progress').innerHTML === ev(`progressDots(${pos}, ${n})`);

// critère 20 : chaque note juste marque son point ; la dernière gagne
async function rejouer(p) {
  t.startGame('melody', p);
  await t.yourTurn();
  const m = t.score();
  t.spy();
  let steps = true;
  m.slice(0, -1).forEach((n, k) => {
    t.lame(n).click();
    steps = steps && json(done()) === json(m.map((_, i) => i <= k)) && progress(k + 1, m.length);
  });
  const t0 = Date.now();
  t.lame(m[m.length - 1]).click();
  const last = [done().every(Boolean), dotsOn() === m.length, t.turn() === 'listen'];
  const win = await t.won();
  const ms = Date.now() - t0;
  check(`critère 20, palier ${p} : la k-ième note juste marque le k-ième point, la progression suit`, () => [
    steps,
    ...last,
  ]);
  if (p <= 3) {
    check(`critère 20, palier ${p} : la mission est gagnée, sans rejouer la mélodie`, () => [
      win,
      json(t.played()) === json(t.hzOf(m)),
    ]);
  } else {
    const end = ev(`melodyReadEnd(${m.length})`);
    check(`critère 20, palier ${p} : la mélodie est jouée une fois, puis la victoire attend sa fin`, () => [
      win,
      json(t.played()) === json(t.hzOf([...m, ...m])),
      end === 300 * (m.length - 1) + 500 + 200,
      ms >= end / 10 - 5,
    ]);
  }
  t.unspy();
  ev('closeModal()');
}

function constantes() {
  check('critère 20 : les délais nommés de la lecture (1 900 ms pour 5 notes, 2 200 ms pour 6)', () => [
    ev('MELODY_READ_STEP') === 300 && ev('MELODY_NOTE_MS') === 500 && ev('MELODY_END_MARGIN') === 200,
    ev('melodyReadEnd(5)') === 1900 && ev('melodyReadEnd(6)') === 2200,
  ]);
}

// critère 21 : une mauvaise lame joue sa note, puis une AUTRE mélodie arrive
async function erreur(p) {
  t.startGame('melody', p);
  await t.yourTurn();
  const m = t.score();
  const wrong = MELODY_T[p].lames.find((n) => n !== m[0]);
  const errors = ev('missionErrors');
  t.spy();
  t.lame(wrong).click();
  const now = [t.played().pop() === XYLO[wrong].hz, ev('missionErrors') === errors + 1, !done().some(Boolean)];
  const other = await t.waitFor(() => t.score().length > 0 && t.score().join('') !== m.join(''), 2000);
  check(`critère 21, palier ${p} : la mauvaise lame joue sa note, une erreur est notée`, () => now);
  check(`critère 21, palier ${p} : une autre mélodie arrive, sans victoire`, () => [
    other,
    !one('.win-box'),
    t.melodiesOf(p).some((x) => x.join('') === t.score().join('')),
  ]);
  t.unspy();
  ev('closeModal()');
}

// une réécoute (bouton 🔈 ou indice 2) : l'état, la progression remise à 0, le retour de la main
async function reecoute(p, step, start) {
  const m = t.score();
  const t0 = Date.now();
  t.spy();
  start();
  const now = [t.stateText() === AGAIN, t.turn() === 'listen', dotsOn() === 0, !done().some(Boolean)];
  t.lame(m[0]).click();
  const ignored = t.played().length === 0;
  const back = await t.yourTurn();
  const ms = Date.now() - t0;
  const heard = json(t.played()) === json(t.hzOf(m));
  t.unspy();
  return [...now, ignored, back, heard, t.stateText() === youLabel(p), ms >= (500 + m.length * step) / 10 - 5];
}

// critère 22 : « 🔈 Écouter » rejoue au tempo normal, depuis le début
async function ecouter(p) {
  t.startGame('melody', p);
  await t.yourTurn();
  t.lame(t.score()[0]).click();
  const played = dotsOn() === 1;
  const res = await reecoute(p, 650, () => one('#melody-listen').click());
  check(`critère 22, palier ${p} : « 🔈 Écouter » rejoue la mélodie, remet la progression à 0, rend la main`, () => [
    played,
    one('#melody-listen').textContent === '🔈 Écouter',
    ...res,
  ]);
  if (p === 3)
    check('critère 22, palier 3 : les points restent cachés pendant et après le rejeu', () => [
      all('#melody-score .ml-note').every((el) => el.classList.contains('covered') && el.style.bottom === '45%'),
    ]);
  ev('closeModal()');
}

// critère 23 : 2 indices ; le second rejoue 1,6 fois plus lentement, à tous les paliers
async function indices(p) {
  t.startGame('melody', p);
  await t.yourTurn();
  const lv = ev('hintsFor(hint.kind, hint.q)');
  const want = HINTS[MELODY_T[p].read ? 'read' : 'listen'];
  check(`critère 23, palier ${p} : ses 2 indices, distincts, rien d'écarté`, () => [
    lv.length === 2 && lv[0].say !== lv[1].say,
    json(lv.map((h) => h.say)) === json(want),
    lv[0].fx.glow === (MELODY_T[p].read ? '#melody-staff' : '.xylo'),
    lv.every((h) => !h.fx.dim),
    ev('hint.choices') === null,
  ]);
  t.lame(t.score()[0]).click();
  const res = await reecoute(p, 1040, () => lv[1].fx.run(one('#modal-body')));
  check(
    `critère 23, palier ${p} : l'indice 2 rejoue lentement (une note toutes les 1 040 ms), puis rend la main`,
    () => res,
  );
  t.tap(t.score());
  check(`critère 23, palier ${p} : le jeu reste gagnable après l'indice`, [await t.won()]);
  ev('closeModal()');
}

(async () => {
  await t.start();
  section('La mélodie : rejouer (critère 20)');
  constantes();
  for (const p of TIERS) await rejouer(p);
  section('La mélodie : se tromper (critère 21)');
  for (const p of [1, 4]) await erreur(p);
  section('La mélodie : réécouter (critère 22)');
  for (const p of [1, 2, 3]) await ecouter(p);
  check('critère 22 : pas de bouton « Écouter » aux paliers 4 et 5', () =>
    [4, 5].map((p) => {
      t.startGame('melody', p);
      return !one('#melody-listen');
    }),
  );
  section('La mélodie : indices (critère 23)');
  for (const p of TIERS) await indices(p);
  await t.finish('l’Île du Grand Concert (La mélodie, le jeu)');
})();
