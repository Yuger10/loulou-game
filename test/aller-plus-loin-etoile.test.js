// Aller plus loin (track aller-plus-loin_20261122), phase 2 : le défi étoile, un
// cran au-dessus du plafond. Ici, ses règles : la sauvegarde (point 15), la
// maîtrise (point 16), quand l'offre est due (points 18, 19, 33, 34).
const { check, COUNT_SKILL, finish, json, newPage, section, STAR_NONE } = require('./tools/aller-plus-loin.js');

function sauvegardeMigration(p) {
  section('Défi étoile : la sauvegarde');
  const { ev, t } = p;
  const V = ev('SAVE_VERSION');
  const old = JSON.parse(ev('JSON.stringify(freshState())'));
  delete old.stars;
  Object.assign(old, {
    v: V - 1,
    coins: 30,
    missions: 12,
    inventory: { cerise: 2 },
    storySolved: { lagon: true },
    skills: {
      count: {
        wins: 3,
        fails: 1,
        errors: 2,
        last: '2026-11-10',
        recent: [{ t: 2, e: 0, ok: true }],
        hints: 0,
        lvl: 2,
      },
    },
  });
  const m = JSON.parse(ev(`JSON.stringify(migrate(${json(old)}))`));
  check('point 15 : la migration ajoute stars: {}', json(m.stars) === '{}', json(m.stars));
  check('point 15 : la version devient SAVE_VERSION', m.v === V);
  const changed = Object.keys(old).filter((k) => k !== 'v' && json(m[k]) !== json(old[k]));
  check('point 15 : les autres champs sont identiques', changed.length === 0, changed.join(', '));
  check(
    'point 15 : aucun autre champ ajouté',
    json(Object.keys(m).filter((k) => k !== 'stars')) === json(Object.keys(old)),
  );
  check('une partie neuve a stars: {}', t('JSON.stringify(freshState().stars)') === '{}');
}

function sauvegardeAbimee(p) {
  const { ev } = p;
  const V = ev('SAVE_VERSION');
  const read = (saved) => JSON.parse(ev(`JSON.stringify(readSave(${json(json(saved))}).stars)`) || 'null');
  const cleaned = read({
    v: V,
    name: 'Nina',
    stars: {
      count: { streak: 2, open: 'oui', miss: 1, won: -2, offered: 'hier' },
      math: 'abîmé',
      clock: { streak: 1, open: true, miss: 0, won: 3, offered: '2026-11-20' },
      simon: { streak: '<img src=x>', open: 1, offered: '<img src=x>' },
      diff: null,
    },
  });
  check(
    "partie abîmée : open: 'oui' devient false, won: -2 devient 0, une date fausse devient null",
    json(cleaned && cleaned.count) === json({ streak: 2, open: false, miss: 1, won: 0, offered: null }),
    json(cleaned && cleaned.count),
  );
  check(
    'partie abîmée : une entrée saine est gardée telle quelle',
    json(cleaned && cleaned.clock) === json({ streak: 1, open: true, miss: 0, won: 3, offered: '2026-11-20' }),
    json(cleaned && cleaned.clock),
  );
  check(
    'partie abîmée : du HTML ne passe pas',
    json(cleaned && cleaned.simon) === json({ streak: 0, open: false, miss: 0, won: 0, offered: null }),
    json(cleaned && cleaned.simon),
  );
  check(
    "partie abîmée : ce qui n'est pas un objet est retiré, un jeu absent reste absent",
    json(Object.keys(cleaned || {}).sort()) === json(['clock', 'count', 'simon']),
    json(Object.keys(cleaned || {})),
  );
  check("partie abîmée : stars qui n'est pas un objet devient {}", json(read({ v: V, stars: 'abc' })) === '{}');
  check('partie sans stars : {}', json(read({ v: V })) === '{}');
}

function maitrise(p) {
  section('Défi étoile : la maîtrise (streak)');
  const { ev, base, starRec, savedStar, mission } = p;
  base();
  const streak = (k = 'count') => starRec(k).streak;
  check('une valeur absente se lit par défaut', json(starRec('count')) === json(STAR_NONE), json(starRec('count')));
  check('lire ne crée aucune entrée', ev('JSON.stringify(state.stars)') === '{}');
  mission('count', true, 0);
  check('point 16 : réussie sans erreur au plafond : streak 1', streak() === 1, `${streak()}`);
  mission('count', true, 1);
  check('point 16 : réussie avec 1 erreur : streak 2', streak() === 2, `${streak()}`);
  mission('count', true, 2);
  check('point 16 : 2 erreurs : streak revient à 0', streak() === 0, `${streak()}`);
  mission('count', true, 0);
  mission('count', false, 0);
  check('point 16 : ratée : streak revient à 0', streak() === 0, `${streak()}`);
  mission('count', true, 0);
  mission('count', true, 0);
  ev("currentWorld = 'lagon'");
  check('contrôle : sur une île plus facile, le palier joué est 1', ev('gameDiff()') === 1);
  mission('count', true, 0);
  mission('count', false, 0);
  check('point 16 : jouée au palier 1, la mission ne compte pas', streak() === 2, `${streak()}`);
  ev("currentWorld = 'foret'");
  mission('count', true, 0);
  check('point 16 : la 3e mission maîtrisée donne streak 3', streak() === 3, `${streak()}`);
  check('le compteur est enregistré', savedStar().streak === 3);
  ev(`state.skills.memory = ${COUNT_SKILL}`);
  mission('memory', true, 3);
  check('au mémo, 3 erreurs restent une mission maîtrisée', streak('memory') === 1, `${streak('memory')}`);
  mission('memory', true, 4);
  check('au mémo, 4 erreurs remettent streak à 0', streak('memory') === 0, `${streak('memory')}`);
}

function offreDue(p) {
  section("Défi étoile : quand l'offre est due");
  const { t, base, today, yesterday } = p;
  const due = (k = 'count') => t(`starOfferDue(${json(k)})`);
  const ready = (more) => {
    base();
    t(`state.stars.count = { streak: 3, open: false, miss: 0, won: 0, offered: null }; ${more || ''}`);
  };
  ready();
  check('contrôle : 6 ans, solo, streak 3 : offre due', due() === true, `${due()}`);
  ready('state.stars.count.streak = 2');
  check("condition 1 : streak 2, pas d'offre", due() === false, `${due()}`);
  ready('currentProfile().starChallenges = false');
  check("condition 2 : interrupteur coupé, pas d'offre", due() === false, `${due()}`);
  ready('currentProfile().starChallenges = true');
  check('condition 2 : interrupteur à true, offre due', due() === true, `${due()}`);
  ready('currentProfile().age = null');
  check("point 19 : sans âge ni classe, pas d'offre", due() === false, `${due()}`);
  ready("currentProfile().grade = 'CE2'");
  check("point 18 : CE2 sur « Compter » (plafond 5 = palier maximal), pas d'offre", due() === false, `${due()}`);
  t('state.stars.calc = { streak: 3, open: false, miss: 0, won: 0, offered: null }');
  check('D9 : CE2 garde un défi sur le calcul mental (palier 6)', due('calc') === true && t("starTier('calc')") === 6);
  ready('party.active = true; party.players = [profiles.current]; party.turn = 0');
  check("point 33 : à plusieurs, pas d'offre", due() === false, `${due()}`);
  ready("beginBonusChallenge('count'); setLastGame('count')");
  check("point 34 : pendant un défi de Zap, pas d'offre", due() === false, `${due()}`);
  ready('state.stars.count.open = true');
  check("condition 7 : porte déjà ouverte, pas d'offre", due() === false, `${due()}`);
  ready(
    "state.stars.math = { streak: 0, open: true, miss: 0, won: 0, offered: null }; setLastGame('math'); beginStarMission('math')",
  );
  check("condition 8 : pendant une mission étoile, pas d'offre", t('inStarMission()') === true && due() === false);
  ready(`state.stars.count.offered = ${json(today)}`);
  check("condition 9 : déjà offerte aujourd'hui, pas d'offre", due() === false, `${due()}`);
  ready(`state.stars.count.offered = ${json(yesterday)}`);
  check('condition 9 : offerte hier, offre due', due() === true, `${due()}`);
  ready();
  check('D9 : le palier du défi est un cran au-dessus du plafond', t("starTier('count')") === 3);
  t("currentProfile().grade = 'CE1'");
  check('D9 : CE1 vers 5', t("starTier('count')") === 5);
}

(async () => {
  const p = await newPage();
  sauvegardeMigration(p);
  sauvegardeAbimee(p);
  maitrise(p);
  offreDue(p);
  finish('aller-plus-loin (défi étoile, règles)');
})();
