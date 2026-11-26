// Aller plus loin (track aller-plus-loin_20261122), phase 2 : l'offre du défi étoile
// sur l'écran de victoire (points 17, 20, 21, 22, 31). Une seule offre par ouverture
// du jeu, donc une page neuve par scénario.
const { check, finish, json, newPage, plain, section, TEXTS, voiced, wait } = require('./tools/aller-plus-loin.js');
const { OFFER, REFUSED } = TEXTS;

// une mission de « Compter » gagnée, qui fait passer streak de 2 à 3 : l'offre est due
async function winThird(p) {
  p.t("state.stars.count = { streak: 2, open: false, miss: 0, won: 0, offered: null }; playGame('count')");
  p.spoken.length = 0;
  p.winMission();
  await wait(350);
}

async function offreMontree(p) {
  section("Défi étoile : l'offre, puis « Pas maintenant »");
  const { today } = p;
  p.base();
  p.t("playGame('count')");
  p.winMission();
  check('point 17 : streak à 1, aucune offre', p.starRec().streak === 1 && !p.d.querySelector('.star-offer'));
  p.t('closeModal()');
  await winThird(p);
  const offer = p.d.querySelector('#modal-body .star-offer');
  check(
    'point 17 : streak passe à 3, le bloc .star-offer apparaît',
    p.starRec().streak === 3 && !!offer,
    json(p.starRec()),
  );
  check(
    "point 17 : le texte de l'offre",
    !!offer && plain(offer.textContent).includes(OFFER),
    offer && plain(offer.textContent),
  );
  const yes = p.d.getElementById('btn-star-yes');
  const no = p.d.getElementById('btn-star-no');
  check(
    'point 17 : deux boutons « ⭐ Oui ! » et « Pas maintenant »',
    !!yes &&
      !!no &&
      plain(yes.textContent) === '⭐ Oui !' &&
      plain(no.textContent) === 'Pas maintenant' &&
      !!offer &&
      offer.contains(yes) &&
      offer.contains(no),
  );
  check(
    "point 17 : l'offre est la dernière phrase dite",
    p.spoken.some((s) => voiced(s).endsWith(voiced(OFFER))),
    p.spoken.join(' | '),
  );
  check('point 17 : offered vaut la date du jour', p.starRec().offered === today, json(p.starRec()));
  check(
    'point 21 : les boutons habituels restent',
    !!p.d.getElementById('btn-yay') && !!p.d.getElementById('btn-again'),
  );
  check("point 17 : la porte n'est pas encore ouverte", p.starRec().open === false);
}

function offreRefusee(p) {
  const no = p.d.getElementById('btn-star-no');
  p.spoken.length = 0;
  if (no) no.click();
  const block = p.d.querySelector('#modal-body .star-offer');
  check(
    "point 20 : le bloc dit « D'accord ! Le défi étoile t'attendra. »",
    !!block && plain(block.textContent) === REFUSED,
    block && plain(block.textContent),
  );
  check('point 20 : sans bouton', !!block && !block.querySelector('button'));
  check(
    'point 20 : la phrase est dite',
    p.spoken.some((s) => voiced(s) === voiced(REFUSED)),
    p.spoken.join(' | '),
  );
  check('point 20 : la porte reste fermée', p.starRec().open === false);
  check("point 20 : pas de nouvelle offre aujourd'hui", p.t("starOfferDue('count')") === false);
}

function offrePlusTard(p) {
  const { yesterday } = p;
  // point 31 : porte fermée (streak à 0), trois nouvelles missions maîtrisées, offre d'un autre jour
  p.t(`closeModal(); closeStarDoor('count'); state.stars.count.offered = ${json(yesterday)}; save()`);
  check('point 31 : closeStarDoor remet streak à 0', p.starRec().streak === 0);
  for (let i = 0; i < 3; i++) p.mission('count', true, 0);
  check('point 31 : streak remonte à 3', p.starRec().streak === 3, json(p.starRec()));
  check('point 31 : pas de deuxième offre pendant cette ouverture du jeu', p.t("starOfferDue('count')") === false);
  p.t("playGame('count')");
  p.winMission();
  check(
    "point 31 : l'écran de victoire ne montre pas l'offre",
    !p.d.querySelector('.star-offer') && p.starRec().streak === 4,
  );
  p.t('closeModal(); save()');
  const copy = {};
  for (let i = 0; i < p.w.localStorage.length; i++) {
    const k = p.w.localStorage.key(i);
    if (k === 'lagon-magique-profiles' || k.startsWith('lagon-magique-save')) copy[k] = p.w.localStorage.getItem(k);
  }
  return copy;
}

async function pageNeuve(p) {
  section('Défi étoile : une page neuve, puis « ⭐ Oui ! »');
  const { yesterday } = p;
  check(
    'point 31 : la partie relue garde son compteur',
    p.starRec().streak === 4 && p.starRec().offered === yesterday,
    json(p.starRec()),
  );
  check("point 31 : dans une page neuve, l'offre est due", p.t("starOfferDue('count')") === true);
  p.t("closeModal(); currentWorld = 'foret'; playGame('count')");
  p.spoken.length = 0;
  p.winMission();
  await wait(350);
  const yes = p.d.getElementById('btn-star-yes');
  check(
    "point 31 : l'offre revient",
    !!p.d.querySelector('#modal-body .star-offer') && !!yes && p.spoken.some((s) => voiced(s).endsWith(voiced(OFFER))),
  );
  if (yes) yes.click();
  check(
    'point 22 : « ⭐ Oui ! » ouvre la porte',
    p.starRec().open === true && p.starRec().miss === 0,
    json(p.starRec()),
  );
  check(
    'point 22 : une partie de « Compter » démarre aussitôt',
    p.ev('lastGame') === 'count' &&
      p.t('inStarMission()') === true &&
      !p.d.querySelector('.win-box') &&
      p.d.getElementById('overlay').classList.contains('show'),
  );
  check('point 22 : au palier du défi (3)', p.ev('gameDiff()') === 3, `${p.ev('gameDiff()')}`);
  await wait(0);
  check('point 22 : avec le badge ⭐', !!p.d.querySelector('#modal-body .game-head .star-badge'));
  check('point 22 : la porte ouverte est enregistrée', p.savedStar().open === true);
  p.t('closeModal()');
}

async function quitter(sel) {
  const p = await newPage();
  const { today } = p;
  p.base();
  await winThird(p);
  const shown = !!p.d.querySelector('#modal-body .star-offer');
  p.spoken.length = 0;
  const btn = p.d.querySelector(sel);
  if (btn) btn.click();
  await wait(30);
  check(
    `point 21 : ${sel} : la porte reste fermée, rien n'est dit sur le défi`,
    shown &&
      p.starRec().open === false &&
      !p.spoken.some((s) => /défi étoile/i.test(s)) &&
      p.t('inStarMission()') === false,
    p.spoken.join(' | '),
  );
  check(
    `point 21 : ${sel} : l'offre ne revient pas avant demain`,
    p.starRec().offered === today && p.t("starOfferDue('count')") === false,
  );
  if (sel !== '#btn-again')
    check(`point 21 : ${sel} : la fenêtre se ferme`, !p.d.getElementById('overlay').classList.contains('show'));
  if (sel === '#btn-again')
    check(
      'point 21 : « Encore une mission » lance un jeu habituel',
      !p.d.querySelector('.win-box') && !!p.ev('lastGame'),
    );
  p.t('closeModal()');
}

(async () => {
  const p = await newPage();
  await offreMontree(p);
  offreRefusee(p);
  const copy = offrePlusTard(p);
  await pageNeuve(await newPage({ saved: copy }));
  section("Défi étoile : quitter l'offre autrement est un refus silencieux");
  for (const sel of ['#btn-yay', '#btn-again', '#modal-close']) await quitter(sel);
  finish('aller-plus-loin (offre du défi étoile)');
})();
