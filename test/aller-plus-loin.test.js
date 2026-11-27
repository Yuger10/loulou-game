// Aller plus loin (track aller-plus-loin_20261122), phase 1 : la classe du profil
// (GS, CP, CE1, CE2), choisie par un adulte dans l'espace parents, remplace l'âge
// comme plafond de palier. Ici : la table, les profils chargés, le palier joué.
// Les numéros (point N) renvoient au « Comportement attendu » de la spec.
// Les autres suites de la track : test/aller-plus-loin-*.test.js.
const { check, finish, json, newPage, section, stars } = require('./tools/aller-plus-loin.js');

function classeTable(p) {
  section('Classe : la table et le plafond');
  const { ev, t } = p;
  check(
    'point 3 : GS, CP, CE1, CE2 donnent 1, 2, 4, 5',
    json(t("['GS', 'CP', 'CE1', 'CE2'].map(gradeToDiff)")) === '[1,2,4,5]',
    json(t("['GS', 'CP', 'CE1', 'CE2'].map(gradeToDiff)")),
  );
  check('point 3 : sans classe, gradeToDiff vaut null', t("gradeToDiff('')") === null);
  check('point 3 : une classe inconnue vaut null', t("gradeToDiff('CM2')") === null);
  check(
    'GRADES : le contrat partagé',
    json(t('GRADES')) ===
      json([
        { id: 'GS', label: 'GS', diff: 1 },
        { id: 'CP', label: 'CP', diff: 2 },
        { id: 'CE1', label: 'CE1', diff: 4 },
        { id: 'CE2', label: 'CE2', diff: 5 },
      ]),
  );
  check("point 4 : la classe prime sur l'âge", t("playerCap({ age: 6, grade: 'CE1' })") === 4);
  check(
    "point 1 : sans classe, le plafond est celui de l'âge",
    t("playerCap({ age: 6, grade: '' })") === 2 && ev('ageToDiff(6)') === 2,
  );
  check(
    'sans classe, chaque âge garde son palier (8 ans reste au palier 3)',
    json(t("[4, 5, 6, 7, 8, 9, 10, 12].map((a) => playerCap({ age: a, grade: '' }))")) ===
      json(ev('[4, 5, 6, 7, 8, 9, 10, 12].map(ageToDiff)')),
  );
  check('point 5 : ni âge ni classe, pas de plafond', t("playerCap({ age: null, grade: '' })") === null);
  check('un profil absent : pas de plafond', t('playerCap(null)') === null);
}

function classeProfils(p) {
  section('Classe : les profils chargés');
  const { ev, t } = p;
  ev('currentProfile().age = 6; delete currentProfile().grade; saveProfiles(); loadProfiles()');
  check(
    "point 1 : un profil sans champ grade reçoit ''",
    ev('currentProfile().grade') === '',
    json(ev('currentProfile().grade')),
  );
  check('point 1 : son plafond ne change pas', t('playerCap(currentProfile())') === 2);
  for (const bad of ['CM2', '<img src=x>', 4, null, { a: 1 }]) {
    ev(`currentProfile().grade = ${json(bad)}; saveProfiles(); loadProfiles()`);
    check(
      `point 2 : une classe abîmée (${json(bad)}) devient ''`,
      ev('currentProfile().grade') === '',
      json(ev('currentProfile().grade')),
    );
  }
  ev("currentProfile().grade = 'CE2'; saveProfiles(); loadProfiles()");
  check('une classe connue est gardée', ev('currentProfile().grade') === 'CE2');
  {
    const first = ev('profiles.current');
    ev("addProfile('Tom', '👦', { age: 7 })");
    check("un nouveau joueur n'a pas de classe", ev('currentProfile().grade') === '');
    ev(`switchProfile(${json(first)}, true)`);
  }
}

function classePalier(p) {
  section('Classe : le palier joué');
  const { ev, solo } = p;
  solo(null, '', 'chateau');
  ev("state.skills = {}; setLastGame('count')");
  check(
    "point 5 : sans âge ni classe, le palier suit l'île (placement)",
    ev('gameDiff()') === 3,
    `${ev('gameDiff()')}`,
  );
  solo(6, 'CE1', 'volcan');
  check('point 6 : 6 ans en CE1, île 6, jeu jamais joué : palier 3', ev('gameDiff()') === 3, `${ev('gameDiff()')}`);
  ev('state.skills.count = { wins: 4, fails: 0, errors: 0, last: null, recent: [], lvl: 5 }');
  check('point 6 : le jeu ne dépasse pas la classe (palier 4)', ev('gameDiff()') === 4, `${ev('gameDiff()')}`);
  ev("currentWorld = 'foret'");
  check("point 6 : l'île reste un plafond (palier 2)", ev('gameDiff()') === 2, `${ev('gameDiff()')}`);
  ev("state.skills = {}; currentWorld = 'foret'");
  check('point 6 : île 2, jeu jamais joué : au plus 2', ev('gameDiff()') <= 2);
  solo(6, '', 'volcan');
  ev('state.skills.count = { wins: 4, fails: 0, errors: 0, last: null, recent: [], lvl: 5 }');
  check('sans classe, rien ne change : 6 ans reste au palier 2', ev('gameDiff()') === 2, `${ev('gameDiff()')}`);

  solo(6, 'CE1', 'lagon');
  ev('party.active = true; party.players = [profiles.current]; party.turn = 0');
  check("point 7 : à plusieurs, la classe remplace l'âge (palier 4)", ev('gameDiff()') === 4, `${ev('gameDiff()')}`);
  ev('party.active = false; party.players = []');

  solo(6, 'CE1', 'volcan');
  ev(
    "state.skills.count = { wins: 4, fails: 0, errors: 0, last: null, recent: [], lvl: 3 }; beginBonusChallenge('count'); setLastGame('count')",
  );
  check(
    "point 8 : le défi de Zap monte jusqu'au plafond de la classe (3 vers 4)",
    ev('gameDiff()') === 4,
    `${ev('gameDiff()')}`,
  );
  ev('state.skills.count.lvl = 4');
  check('point 8 : Zap ne dépasse jamais le plafond de la classe', ev('gameDiff()') === 4, `${ev('gameDiff()')}`);
  ev('endBonusChallenge()');
}

function classeCourse(p) {
  section('Classe : la course montre le palier joué');
  const { d, ev, solo } = p;
  solo(6, 'CE1', 'lagon');
  ev(
    'race.active = true; race.players = [profiles.current]; race.pos = {}; race.turn = 0; race.winner = null; renderRaceTrack()',
  );
  const lane = d.querySelector('#race-track .lane-name small');
  const turn = d.querySelector('#race-track .race-turn');
  check(
    'les étoiles du couloir suivent la classe',
    !!lane && lane.textContent.includes(stars(4)) && !lane.textContent.includes(stars(5)),
    lane && lane.textContent,
  );
  check(
    'les étoiles du tour suivent la classe',
    !!turn && turn.textContent.includes(stars(4)) && !turn.textContent.includes(stars(5)),
    turn && turn.textContent,
  );
  ev('race.active = false; race.players = []; renderRaceTrack()');
}

(async () => {
  const p = await newPage();
  classeTable(p);
  classeProfils(p);
  classePalier(p);
  classeCourse(p);
  finish('aller-plus-loin');
})();
