// Aller plus loin (track aller-plus-loin_20261122), phase 2 : la mission étoile,
// du badge ⭐ à l'écran de fin (réussie, ratée, porte fermée en cours de route).
// Points 23 à 30 de la spec.
const { check, finish, json, newPage, plain, section, TEXTS, voiced, wait } = require('./tools/aller-plus-loin.js');
const { WON_FIRST, WON_AGAIN, FAIL_MSG, BACK_STAR, BACK_NONE } = TEXTS;

// le badge ⭐ dans l'en-tête du jeu
const badges = (d) => d.querySelectorAll('#modal-body .game-head .star-badge');

async function missionDebut(p) {
  section('Défi étoile : la mission');
  const { d, ev, t, base, starRec } = p;
  base();
  t("state.stars.count = { streak: 0, open: true, miss: 0, won: 0, offered: null }; playGame('count')");
  check('point 23 : porte ouverte, playGame démarre une mission étoile', t('inStarMission()') === true);
  check('point 23 : le palier joué est 3', ev('gameDiff()') === 3, `${ev('gameDiff()')}`);
  check('point 24 : le palier habituel reste 2', t('normalDiff()') === 2, `${t('normalDiff()')}`);
  await wait(0);
  check("point 23 : le badge ⭐ dans l'en-tête", badges(d).length === 1);
  check(
    'point 23 : le badge a son nom',
    badges(d).length === 1 &&
      badges(d)[0].getAttribute('role') === 'img' &&
      badges(d)[0].getAttribute('aria-label') === 'Défi étoile' &&
      badges(d)[0].textContent === '⭐',
  );
  check(
    'point 24 : les essais sont ceux du palier habituel',
    ev('maxLives') === ev("livesFor('count', 2)") && ev("livesFor('count', 2)") !== ev("livesFor('count', 3)"),
    `${ev('maxLives')}`,
  );
  check(
    'point 24 : pas de minuteur au plafond 2, même si la question est au palier 3',
    d.getElementById('challenge-timer') === null && !!ev("timerFor('count', 3)"),
  );
  t('loseLife(null)');
  check('point 25 : une erreur, miss vaut 1', starRec().miss === 1, `${starRec().miss}`);
  t('stepOk(null)');
  check('point 25 : une bonne étape remet miss à 0', starRec().miss === 0, `${starRec().miss}`);
}

async function missionSurprise(p) {
  const { d, ev, t } = p;
  // par la Surprise : le tirage est forcé sur « Compter »
  t("closeModal(); setLastGame('math')");
  {
    const pool = ev("JSON.stringify(gameTypesForAge(6).filter((k) => k !== 'math'))");
    const list = JSON.parse(pool);
    const r = (list.indexOf('count') + 0.5) / list.length;
    // les deux premiers tirages choisissent le jeu (jeu à travailler, puis Surprise) ;
    // ensuite le vrai hasard, pour que le jeu fabrique sa question
    ev(
      `window.__rand = Math.random; window.__n = 0; Math.random = () => (window.__n++ < 2 ? ${r} : window.__rand()); startMinigame(); Math.random = window.__rand`,
    );
  }
  await wait(0);
  check(
    'point 23 : par la Surprise, le même résultat',
    ev('lastGame') === 'count' && t('inStarMission()') === true && ev('gameDiff()') === 3 && badges(d).length === 1,
    `${ev('lastGame')}`,
  );
}

async function missionPorteFermee(p) {
  const { d, ev, t, starRec } = p;
  // point 26 : 2 erreurs d'affilée ferment la porte, la mission continue
  t("closeModal(); state.stars.count.streak = 2; playGame('count')");
  await wait(0);
  t('loseLife(null)');
  check('point 26 : après 1 erreur, la porte reste ouverte', starRec().open === true && starRec().miss === 1);
  t('loseLife(null)');
  check(
    "point 26 : la 2e erreur d'affilée ferme la porte",
    json(starRec()) === json({ streak: 0, open: false, miss: 0, won: 0, offered: null }),
    json(starRec()),
  );
  check('point 26 : le badge est retiré', badges(d).length === 0);
  check(
    "point 26 : la mission reste une mission étoile jusqu'à sa fin",
    t('inStarMission()') === true && t('starActive()') === false,
  );
  check('point 26 : le palier revient au palier habituel', ev('gameDiff()') === 2, `${ev('gameDiff()')}`);
}

async function missionGagneePorteFermee(p) {
  const { d, ev, t, spoken, starRec, winMission, today } = p;
  const before = JSON.parse(ev('JSON.stringify(state.skills.count)'));
  spoken.length = 0;
  winMission();
  await wait(350);
  const body = plain(d.getElementById('modal-body').textContent);
  check('point 30 : gagnée porte fermée, le texte de retour', body.includes(BACK_NONE), body.slice(0, 200));
  check('point 30 : sans texte de réussite du défi', !body.includes('Défi étoile réussi'));
  check("point 30 : pas d'étoile gagnée", starRec().won === 0);
  check(
    'point 30 : le texte de retour est dit',
    spoken.some((s) => voiced(s).includes(voiced(BACK_NONE))),
    spoken.join(' | '),
  );
  check("point 30 : pas d'offre sur cet écran", !d.querySelector('.star-offer'));
  const after = JSON.parse(ev('JSON.stringify(state.skills.count)'));
  check(
    'point 28 : porte fermée en cours, comptée comme pour Zap',
    after.wins === before.wins + 1 &&
      after.last === today &&
      json(after.recent) === json(before.recent) &&
      after.lvl === before.lvl &&
      after.atLvl === undefined &&
      starRec().streak === 0,
    json(after),
  );
  check('la mission étoile est finie', t('inStarMission()') === false);
}

function missionRateePorteFermee(p) {
  const { d, t, spoken, starRec } = p;
  // perdue après une porte fermée en cours : l'écran d'échec habituel, puis le texte de retour
  t("closeModal(); state.stars.count = { streak: 0, open: true, miss: 0, won: 1, offered: null }; playGame('count')");
  t('loseLife(null); loseLife(null)');
  spoken.length = 0;
  t('onMissionFail()');
  const body = plain(d.getElementById('modal-body').textContent);
  check(
    'point 30 : ratée porte fermée, le titre habituel et le texte de retour',
    plain((d.querySelector('#modal-body h2') || {}).textContent) === 'Raté !' &&
      body.includes(BACK_STAR) &&
      !body.includes(FAIL_MSG),
    body.slice(0, 200),
  );
  check("point 30 : l'étoile déjà gagnée reste", starRec().won === 1);
  check(
    'point 30 : le texte de retour est dit',
    spoken.some((s) => voiced(s).endsWith(voiced(BACK_STAR))),
    spoken.join(' | '),
  );
}

async function reussiPremiere(p) {
  section('Défi étoile : réussi');
  const { d, ev, t, spoken, base, starRec, winMission } = p;
  base();
  t("state.stars.count = { streak: 0, open: true, miss: 0, won: 0, offered: null }; playGame('count')");
  const inv = () => Object.values(JSON.parse(ev('JSON.stringify(state.inventory)'))).reduce((a, b) => a + b, 0);
  const before = JSON.parse(ev('JSON.stringify(state.skills.count)'));
  const inv0 = inv();
  t('loseLife(null)');
  spoken.length = 0;
  winMission();
  await wait(350);
  const body = plain(d.getElementById('modal-body').textContent);
  check('point 27 : won augmente de 1', starRec().won === 1, json(starRec()));
  check('point 27 : la première fois, le jeu gagne son étoile', body.includes(WON_FIRST), body.slice(0, 200));
  check(
    'point 27 : la phrase est dite',
    spoken.some((s) => voiced(s).includes(voiced(WON_FIRST))),
    spoken.join(' | '),
  );
  check(
    'point 27 : la voix ne lit pas le ⭐ final (« étoile étoile »)',
    spoken.length > 0 && !spoken.some((s) => /étoile étoile/.test(s)),
    spoken.join(' | '),
  );
  check(
    'point 27 : la récompense est normale (pas de doublement)',
    inv() === inv0 + 1 && !d.querySelector('#modal-body .boost'),
    `${inv() - inv0}`,
  );
  check('point 27 : aucun texte de retour', !body.includes('On revient à ton jeu habituel'));
  check('point 27 : la porte reste ouverte, miss revient à 0', starRec().open === true && starRec().miss === 0);
  check("pas d'offre pendant que la porte est ouverte", !d.querySelector('.star-offer'));
  return before;
}

function reussiSuivante(p, before) {
  const { d, ev, t, starRec, winMission, today } = p;
  t("closeModal(); playGame('count')");
  winMission();
  const body = plain(d.getElementById('modal-body').textContent);
  check(
    'point 27 : la fois suivante, « Défi étoile réussi ⭐ »',
    starRec().won === 2 && body.includes(WON_AGAIN) && !body.includes(WON_FIRST),
    body.slice(0, 200),
  );
  const after = JSON.parse(ev('JSON.stringify(state.skills.count)'));
  check(
    'point 28 : wins, errors et last comptés, le niveau du jeu ne bouge pas',
    after.wins === before.wins + 2 &&
      after.errors === before.errors + 1 &&
      after.last === today &&
      json(after.recent) === json(before.recent) &&
      after.lvl === before.lvl &&
      after.atLvl === undefined &&
      !after.support &&
      starRec().streak === 0,
    json(after),
  );
  t('closeModal()');
}

function rate(p, won) {
  const { d, ev, t, spoken, base, starRec } = p;
  base();
  t(
    `state.stars.count = { streak: 0, open: true, miss: 0, won: ${won}, offered: null }; state.coins = 40; state.inventory = { perle: 2 }; playGame('count')`,
  );
  t('loseLife(null)');
  spoken.length = 0;
  t('onMissionFail()');
  const body = plain(d.getElementById('modal-body').textContent);
  const back = won ? BACK_STAR : BACK_NONE;
  check(
    `point 29 : le titre est « Bien essayé ! » (étoiles gagnées : ${won})`,
    plain((d.querySelector('#modal-body h2') || {}).textContent) === 'Bien essayé !',
  );
  check(
    'point 29 : le message, puis le texte de retour',
    body.includes(FAIL_MSG) &&
      body.includes(back) &&
      body.indexOf(FAIL_MSG) < body.indexOf(back) &&
      !body.includes('Raté'),
    body.slice(0, 240),
  );
  check(
    'point 29 : les deux phrases sont dites',
    spoken.some((s) => voiced(s).includes(voiced(FAIL_MSG)) && voiced(s).includes(voiced(back))),
    spoken.join(' | '),
  );
  check(
    'point 29 : la porte se ferme',
    json(starRec()) === json({ streak: 0, open: false, miss: 0, won, offered: null }),
    json(starRec()),
  );
  const s = JSON.parse(ev('JSON.stringify(state.skills.count)'));
  check(
    "points 28 et 30 : rien n'est retiré (pièces, objets, niveau du jeu)",
    ev('state.coins') === 40 &&
      ev('state.inventory.perle') === 2 &&
      s.lvl === 2 &&
      s.fails === 1 &&
      s.errors === 1 &&
      s.recent.length === 0 &&
      !s.support,
    json(s),
  );
  t('closeModal()');
}

(async () => {
  const p = await newPage();
  await missionDebut(p);
  await missionSurprise(p);
  await missionPorteFermee(p);
  await missionGagneePorteFermee(p);
  missionRateePorteFermee(p);
  reussiSuivante(p, await reussiPremiere(p));
  section('Défi étoile : raté');
  for (const won of [0, 1]) rate(p, won);
  finish('aller-plus-loin (mission étoile)');
})();
