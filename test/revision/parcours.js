const { queue, SHOWN, rightBtn, EXPECTED_PARAMS, hintQ, wrongBtn, newPlayer } = require('./jeux.js');
const { startSession, offerOpen } = require('./seance.js');
const { waitFor, check, section, done } = require('./fixtures.js');

const dueOf = (pg) => (queue(pg).items[0] || { due: 'sorti' }).due;
// le jour donné : la proposition vient, la question `p` est reposée et réussie
async function playOn(pg, p, day) {
  const { d } = pg;
  pg.setDay(day);
  await startSession(pg);
  if (!offerOpen(pg)) return false;
  d.getElementById('review-yes').click();
  if (!SHOWN.compare(d, p)) return false;
  rightBtn(pg).click();
  await waitFor(() => d.getElementById('review-end'), 1000);
  d.getElementById('review-done').click();
  return true;
}

async function lifeRightTests(pg) {
  const due = () => dueOf(pg);
  pg.ev('closeModal(); playGame("compare")'); // sur le lagon, au palier 1
  const p = EXPECTED_PARAMS.compare(hintQ(pg));
  wrongBtn(pg, 'compare').click();
  pg.ev('closeModal()');
  check('raté le 1er : dû le 2', due() === '2026-12-02', due());
  await startSession(pg);
  check('le 1er : pas de proposition', !offerOpen(pg));
  check('le 2 : proposée, réussie : dû le 5', (await playOn(pg, p, '2026-12-02')) && due() === '2026-12-05', due());
  pg.setDay('2026-12-04');
  await startSession(pg);
  check('le 4 : pas de proposition', !offerOpen(pg));
  check('le 5 : proposée, réussie : dû le 12', (await playOn(pg, p, '2026-12-05')) && due() === '2026-12-12', due());
  check(
    'le 12 : proposée, réussie : sortie de la file',
    (await playOn(pg, p, '2026-12-12')) && due() === 'sorti',
    due(),
  );
  pg.setDay('2026-12-13');
  await startSession(pg);
  check('le 13 : plus rien à proposer', !offerOpen(pg));
}

// l'autre branche : raté en révision le lendemain, dû le surlendemain
async function lifeWrongTests(pg) {
  const { ev, d } = pg;
  pg.setDay('2026-12-20');
  ev('closeModal(); playGame("compare")');
  wrongBtn(pg, 'compare').click();
  ev('closeModal()');
  const p2 = queue(pg).items[0].p;
  pg.setDay('2026-12-21');
  await startSession(pg);
  d.getElementById('review-yes').click();
  check('le lendemain, la question ratée est reposée', () => SHOWN.compare(d, p2));
  wrongBtn(pg, 'compare').click();
  await waitFor(() => d.getElementById('review-end'), 1000);
  check('ratée en révision le 21 : due le 22', dueOf(pg) === '2026-12-22', dueOf(pg));
  ev('closeModal()');
}

async function lifeTests() {
  section('Lignes 1, 9, 13, 19 : du premier raté à la sortie de la file');
  const pg = await newPlayer({ day: '2026-12-01', fast: true });
  await lifeRightTests(pg);
  await lifeWrongTests(pg);
  done(pg);
}

module.exports = { lifeTests };
