const { J, P, check, section, waitFor, done } = require('./fixtures.js');
const {
  setTier,
  SHOWN,
  answerOf,
  rightBtn,
  ANSWER,
  EXPECTED_PARAMS,
  hintQ,
  startGame,
  CHOICES,
  newPlayer,
  CAPTURE_DAY,
} = require('./jeux.js');
const { captureKeptTests, captureAgainTests, captureNothingTests, captureFullTests } = require('./capture.js');

const replay = (pg, key, p) => pg.ev(`setLastGame(${J(key)}); REVIEW_REPLAYS[${J(key)}].render(${J(p)})`);
// un item rejoué au palier donné : la question, sa bonne réponse, ses indices
function replayCase(pg, name, tier) {
  const p = P[name],
    key = p.g;
  setTier(pg, key, tier);
  check(`${name}, palier ${tier} : la question affichée est celle de l'item`, () => {
    replay(pg, key, p);
    return SHOWN[key](pg.d, p);
  });
  check(
    `${name}, palier ${tier} : la bonne réponse est proposée`,
    () => answerOf(rightBtn(pg)) === ANSWER[key](p),
    () => answerOf(rightBtn(pg)),
  );
  check(
    `${name}, palier ${tier} : la question des indices est celle de l'item`,
    () => pg.js('currentHintQuestion().kind') === J(key) && J(EXPECTED_PARAMS[key](hintQ(pg))) === J(p),
    () => pg.js('currentHintQuestion()'),
  );
  check(`${name}, palier ${tier} : deux niveaux d'indice`, () => {
    const hints = JSON.parse(pg.js(`hintsFor(${J(key)}, currentHintQuestion().q)`));
    return hints.length === 2 && hints.every((h) => h.say.length > 10);
  });
}
const REPLAY_CASES = [
  ['math', 1],
  ['minus', 1],
  ['calc', 1],
  ['calc2', 1],
  ['mult', 1],
  ['compare', 1],
  ['clock', 1],
  ['reading', 1],
  ['math', 5],
  ['calc2', 6],
  ['clock', 5],
  ['reading', 5],
];

function replayTests(pg) {
  section('S4 : chaque jeu rejoue un item (ligne 7)');
  for (const [name, tier] of REPLAY_CASES) replayCase(pg, name, tier);
  // lecture : le sens de lecture de l'item, quel que soit le palier du moment
  const other = { g: 'reading', w: 'cheval', img: false };
  setTier(pg, 'reading', 5);
  check("lecture, palier 5 : un item « image vers mot » montre l'image et des mots", () => {
    replay(pg, 'reading', other);
    return (
      pg.d.querySelector('.reading-image').textContent === '🐴' &&
      pg.d.querySelectorAll('.reading-word-btn').length === 5 &&
      answerOf(rightBtn(pg)) === 'cheval'
    );
  });
  // horloge : un quart d'heure au palier 1 (où le jeu ne tire que des heures pleines)
  const quarter = { g: 'clock', h: 9, m: 45 };
  setTier(pg, 'clock', 1);
  check("horloge, palier 1 : un item au quart d'heure garde son heure", () => {
    replay(pg, 'clock', quarter);
    return SHOWN.clock(pg.d, quarter) && answerOf(rightBtn(pg)) === '9 h 45';
  });
}

// Un item rejoué (`p`, tiré de la question `q1`) : ce qui ne va pas, ou '' si tout est retrouvé
function replayedBad(pg, key, { tier, p, q1 }) {
  replay(pg, key, p);
  const q2 = hintQ(pg);
  const back = pg.js(`REVIEW_REPLAYS[${J(key)}].item(hint.q)`);
  // les indices d'une question rejouée : ceux de la question d'origine (au tirage près)
  const same = (q) => pg.js(`hintsFor(${J(key)}, ${J({ ...q, emoji: q1.emoji, options: q1.options })})`);
  if (back !== J(p)) return `palier ${tier} : retour ${back} au lieu de ${J(p)}`;
  if (!SHOWN[key](pg.d, p)) return `palier ${tier} : ${J(p)} mal affiché`;
  if (answerOf(rightBtn(pg)) !== ANSWER[key](p)) return `palier ${tier} : mauvaise solution pour ${J(p)}`;
  if (J(Object.keys(q2).sort()) !== J(Object.keys(q1).sort()))
    return `palier ${tier} : question des indices ${J(Object.keys(q2))} au lieu de ${J(Object.keys(q1))}`;
  if (same(q2) !== same(q1)) return `palier ${tier} : indices différents pour ${J(p)}`;
  return '';
}
// Une question tirée par le jeu, puis item, render, item : `bad` dit ce qui ne va pas,
// `counted` si la question compte (un calcul qui dépasse 100 n'est pas gardé)
function roundTripOnce(pg, key, tier) {
  startGame(pg, key, tier);
  const q1 = hintQ(pg);
  let p;
  try {
    p = JSON.parse(pg.js(`REVIEW_REPLAYS[${J(key)}].item(hint.q)`));
  } catch (e) {
    return { bad: e.message, counted: false };
  }
  const expected = EXPECTED_PARAMS[key](q1);
  // seule exception : un calcul qui dépasse 100 (palier 5 ou 6) n'est pas gardé
  if (p === null && key === 'calc' && !pg.ev(`validParams(${J(expected)})`)) return { bad: '', counted: false };
  if (J(p) !== J(expected)) return { bad: `palier ${tier} : item ${J(p)} au lieu de ${J(expected)}`, counted: true };
  return { bad: replayedBad(pg, key, { tier, p, q1 }), counted: true };
}
function roundTripGame(pg, key) {
  const tiers = key === 'calc' ? [1, 2, 3, 4, 5, 6] : [1, 2, 3, 4, 5];
  let bad = '',
    n = 0;
  for (const tier of tiers) {
    for (let round = 0; round < 6 && !bad; round++) {
      const r = roundTripOnce(pg, key, tier);
      bad = r.bad;
      if (r.counted) n++;
    }
  }
  check(`${key} : item, render, item redonne le même item (${n} questions)`, !bad && n >= 20, bad || `${n} questions`);
}

async function roundTripTests(pg) {
  section('S4 : aller-retour item / render, à chaque palier (ligne 8)');
  for (const key of Object.keys(CHOICES)) roundTripGame(pg, key);
  startGame(pg, 'compare', 2);
  pg.ev(`renderCompare(${J(P.compare)})`);
  rightBtn(pg).click();
  check(
    'un jeu rejoué gagne comme avant (hors mission, la victoire normale)',
    await waitFor(() => pg.d.getElementById('btn-yay')),
  );
  pg.ev('closeModal()');
  check('une question qui ne ressemble à rien ne donne aucun item', () =>
    ['math', 'calc', 'compare', 'clock', 'reading'].every((key) =>
      [null, 'x', 42, {}, { a: 'x' }, { ops: 'x' }, { correct: null }].every(
        (q) => pg.ev(`REVIEW_REPLAYS[${J(key)}].item(${J(q)})`) === null,
      ),
    ),
  );
}

async function captureTests() {
  const pg = await newPlayer({ day: CAPTURE_DAY, fast: true });
  captureKeptTests(pg);
  captureAgainTests(pg);
  await captureNothingTests(pg);
  captureFullTests(pg);
  replayTests(pg);
  await roundTripTests(pg);
  done(pg);
}

module.exports = { captureTests };
