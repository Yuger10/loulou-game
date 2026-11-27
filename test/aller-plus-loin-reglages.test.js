// Aller plus loin (track aller-plus-loin_20261122), phase 2 : le défi étoile à
// plusieurs et avec Zap (points 33, 34), l'étoile dans le choix des jeux (point 32),
// et les réglages de l'espace parents (points 35 à 38).
const { check, finish, json, newPage, plain, section, wait } = require('./tools/aller-plus-loin.js');

// les deux puces « défi étoile » de l'espace parents, et les noms de celles qui sont marquées
function starChips(d) {
  const chips = () => [...d.querySelectorAll('#modal-body [data-stars]')];
  const onChips = () =>
    chips()
      .filter((b) => b.classList.contains('on'))
      .map((b) => plain(b.textContent));
  return { chips, onChips };
}
// la puce d'une classe
const gradeChip = (d, g) => [...d.querySelectorAll('#modal-body [data-grade]')].find((b) => b.dataset.grade === g);

function plusieursEtZap(p) {
  section('Défi étoile : à plusieurs et avec Zap');
  const { ev, t, base, starRec, mission, winMission } = p;
  base();
  t(
    "state.stars.count = { streak: 2, open: true, miss: 0, won: 0, offered: null }; party.active = true; party.players = [profiles.current]; party.turn = 0; setLastGame('count'); beginStarMission('count')",
  );
  check(
    'point 33 : à plusieurs, pas de mission étoile',
    t('inStarMission()') === false && ev('gameDiff()') === 2,
    `${ev('gameDiff()')}`,
  );
  mission('count', true, 0);
  check(
    'point 33 : à plusieurs, aucun compteur ne bouge',
    json(starRec()) === json({ streak: 2, open: true, miss: 0, won: 0, offered: null }),
    json(starRec()),
  );

  base();
  t('state.stars.count = { streak: 0, open: true, miss: 0, won: 0, offered: null }');
  const picks = JSON.parse(t('JSON.stringify(Array.from({ length: 40 }, () => zapGameFor()))') || '[]');
  check('contrôle : « Compter » est le seul jeu déjà réussi', ev('Object.keys(state.skills).join()') === 'count');
  check(
    'point 34 : Zap ne choisit jamais un jeu dont la porte est ouverte',
    picks.length === 40 && !picks.includes('count'),
    picks.slice(0, 5).join(),
  );
  t("startBonusChallenge('count')");
  check(
    "point 34 : un défi de Zap en cours n'est pas une mission étoile",
    ev('inBonusChallenge()') === true && t('inStarMission()') === false && ev('gameDiff()') <= 2,
  );
  t('closeModal(); endBonusChallenge()');
  t("state.stars.count = { streak: 2, open: false, miss: 0, won: 0, offered: null }; startBonusChallenge('count')");
  winMission();
  check('point 34 : un défi de Zap gagné ne compte pas dans streak', starRec().streak === 2, json(starRec()));
  t('closeModal()');
}

function choixDesJeux(p) {
  section('Défi étoile : le choix des jeux');
  const { d, ev, t, base } = p;
  base();
  t('state.stars.count = { streak: 0, open: false, miss: 0, won: 1, offered: null }');
  ev(
    'state.gameCounts = {}; GAME_LIST.forEach((g) => (state.gameCounts[g.key] = 5)); state.gameCounts.count = 0; openGamePicker()',
  );
  const btn = d.querySelector('#modal-body .game-choice[data-game="count"]');
  const mark = btn && btn.querySelector('.star-mark');
  check('contrôle : « Compter » est proposé', !!btn);
  check(
    'point 32 : un jeu au défi réussi porte une petite étoile',
    !!mark && mark.textContent === '⭐' && mark.getAttribute('aria-hidden') === 'true',
  );
  check(
    "point 32 : les autres jeux n'en portent pas",
    d.querySelectorAll('#modal-body .star-mark').length === (mark ? 1 : 0),
  );
  t('closeModal()');
}

function parentsPuces(p) {
  section("Défi étoile : l'espace parents");
  const { d, openParents, parentCard, base } = p;
  base();
  openParents();
  const { chips, onChips } = starChips(d);
  const card = parentCard('🎒 Classe');
  check(
    'point 35 : deux puces dans la carte « 🎒 Classe »',
    !!card &&
      json(chips().map((b) => plain(b.textContent))) === json(['⭐ Défis étoile', 'Pas de défi étoile']) &&
      chips().every((b) => card.contains(b)),
    json(chips().map((b) => plain(b.textContent))),
  );
  check(
    'point 35 : « ⭐ Défis étoile » marquée par défaut',
    json(onChips()) === json(['⭐ Défis étoile']),
    json(onChips()),
  );
  check(
    "l'aide sous les puces de défi",
    !!card &&
      plain(card.textContent).includes(
        "Quand un jeu est maîtrisé à son niveau, l'enfant peut accepter un défi un cran au-dessus. Après 2 erreurs d'affilée, le jeu revient à son niveau, sans rien perdre.",
      ),
  );
  const skillsCard = parentCard('📈 Progrès par compétence');
  check(
    "l'aide des progrès parle du défi étoile",
    !!skillsCard &&
      plain(skillsCard.textContent).includes(
        "(ou son âge, sans classe choisie), sauf pendant un défi étoile accepté par l'enfant. Les jeux à travailler",
      ),
  );
}

async function parentsCouper(p) {
  const { w, d, ev, t, starRec, savedStar, linaId } = p;
  const { chips, onChips } = starChips(d);
  t('state.stars.count = { streak: 2, open: true, miss: 1, won: 1, offered: null }; save()');
  const off = chips().find((b) => b.dataset.stars === '0');
  if (off) off.click();
  check("point 36 : « Pas de défi étoile » coupe l'interrupteur", ev('currentProfile().starChallenges') === false);
  check(
    'point 36 : le réglage est enregistré',
    JSON.parse(w.localStorage.getItem('lagon-magique-profiles')).list.find((x) => x.id === linaId).starChallenges ===
      false,
  );
  check('point 36 : la puce passe « on »', json(onChips()) === json(['Pas de défi étoile']), json(onChips()));
  check(
    'point 36 : toutes les portes se ferment, streak et won restent',
    json(starRec()) === json({ streak: 2, open: false, miss: 0, won: 1, offered: null }),
    json(starRec()),
  );
  check('point 36 : la partie est enregistrée', savedStar().open === false);
  t('state.stars.count.streak = 3');
  check('point 36 : plus aucune offre', t("starOfferDue('count')") === false);
  // une porte encore ouverte (partie importée, autre onglet) : fermée au démarrage
  t("closeModal(); state.stars.count.open = true; playGame('count')");
  check(
    'point 36 : interrupteur coupé, playGame ferme la porte et joue au palier habituel',
    t('inStarMission()') === false && starRec().open === false && ev('gameDiff()') === 2 && starRec().won === 1,
    json(starRec()),
  );
  await wait(0);
  check('point 36 : pas de badge', !d.querySelector('#modal-body .star-badge'));
  t('closeModal()');
}

function parentsRemettre(p) {
  const { d, ev, openParents } = p;
  const { chips, onChips } = starChips(d);
  openParents();
  check(
    'point 35 : rouverte, la carte marque « Pas de défi étoile »',
    json(onChips()) === json(['Pas de défi étoile']),
    json(onChips()),
  );
  const on = chips().find((b) => b.dataset.stars === '1');
  if (on) on.click();
  check(
    "point 35 : « ⭐ Défis étoile » remet l'interrupteur",
    ev('currentProfile().starChallenges') !== false && json(onChips()) === json(['⭐ Défis étoile']),
  );
}

function parentsClasse(p) {
  const { d, ev, t, starRec, savedStar } = p;
  // point 37 : un changement de classe ferme les portes et remet les compteurs à 0
  t(
    'state.stars = { count: { streak: 2, open: true, miss: 1, won: 2, offered: null }, math: { streak: 1, open: false, miss: 0, won: 0, offered: null } }; save()',
  );
  if (gradeChip(d, 'CE1')) gradeChip(d, 'CE1').click();
  check(
    'point 37 : la classe change, portes fermées et streak à 0, won reste',
    json(starRec()) === json({ streak: 0, open: false, miss: 0, won: 2, offered: null }) &&
      starRec('math').streak === 0,
    json(ev('JSON.stringify(state.stars)')),
  );
  check('point 37 : la partie est enregistrée', savedStar().streak === 0);
  t('state.stars.count.streak = 2');
  if (gradeChip(d, 'CE1')) gradeChip(d, 'CE1').click();
  check('point 37 : toucher la même classe ne remet rien à zéro', starRec().streak === 2);
}

function parentsAutreEnfant(p) {
  const { w, d, ev, openParents, starRec, tomId } = p;
  const { chips } = starChips(d);
  // un autre enfant : sa partie est lue, changée et réécrite dans son stockage
  const tomKey = ev(`profileSaveKey(${json(tomId)})`);
  const tomSave = JSON.parse(ev('JSON.stringify(freshState({ name: "Tom" }))'));
  tomSave.stars = { count: { streak: 2, open: true, miss: 1, won: 1, offered: null } };
  w.localStorage.setItem(tomKey, json(tomSave));
  openParents(tomId);
  const offTom = chips().find((b) => b.dataset.stars === '0');
  if (offTom) offTom.click();
  const tomStars = () => (JSON.parse(w.localStorage.getItem(tomKey)).stars || {}).count;
  check(
    'point 36 : pour un autre enfant, ses portes se ferment dans sa partie',
    json(tomStars()) === json({ streak: 2, open: false, miss: 0, won: 1, offered: null }) && starRec().streak === 2,
    json(tomStars()),
  );
  if (gradeChip(d, 'CP')) gradeChip(d, 'CP').click();
  check(
    'point 37 : pour un autre enfant, sa classe remet ses compteurs à 0',
    json(tomStars()) === json({ streak: 0, open: false, miss: 0, won: 1, offered: null }),
    json(tomStars()),
  );
  ev(`profiles.list.find((p) => p.id === ${json(tomId)}).starChallenges = 'non'; saveProfiles(); loadProfiles()`);
  check(
    'un interrupteur abîmé dans un profil redevient actif',
    ev(`profiles.list.find((p) => p.id === ${json(tomId)}).starChallenges`) !== false &&
      typeof ev(`profiles.list.find((p) => p.id === ${json(tomId)}).starChallenges`) !== 'string',
  );
}

function parentsDetail(p) {
  const { d, t, openParents, base } = p;
  // point 38 : la ligne de détail des progrès
  const detail = (won) => {
    base();
    t(`state.stars.count = { streak: 0, open: false, miss: 0, won: ${won}, offered: null }`);
    openParents();
    const row = [...d.querySelectorAll('#modal-body .sk-row')].find(
      (r) => plain((r.querySelector('.sk-name') || {}).textContent) === '🔢 Compter',
    );
    return plain(row && (row.querySelector('.sk-detail') || {}).textContent);
  };
  check('point 38 : « défi étoile réussi 1 fois »', detail(1).endsWith('· ⭐ défi étoile réussi 1 fois'), detail(1));
  check('point 38 : « défi étoile réussi 3 fois »', detail(3).endsWith('· ⭐ défi étoile réussi 3 fois'), detail(3));
  check('point 38 : rien sans étoile gagnée', !detail(0).includes('défi étoile'), detail(0));
  t('closeModal()');
}

(async () => {
  const p = await newPage({ tom: true });
  plusieursEtZap(p);
  choixDesJeux(p);
  parentsPuces(p);
  await parentsCouper(p);
  parentsRemettre(p);
  parentsClasse(p);
  parentsAutreEnfant(p);
  parentsDetail(p);
  finish('aller-plus-loin (défi étoile, réglages)');
})();
