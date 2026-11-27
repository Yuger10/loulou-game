const { check, J, section, item, done } = require('./fixtures.js');
const { offerOpen, startSession, heard, D, modalOpen, ninaPage } = require('./seance.js');
const { queue } = require('./jeux.js');

async function offerShownTests(pg) {
  const { ev, d, spoken, w } = pg;
  check('rien avant « Jouer »', !offerOpen(pg));
  await startSession(pg);
  check("la proposition s'ouvre en début de séance (#review-offer)", offerOpen(pg));
  const name = ev('COMPANIONS[currentCompanion()].name');
  check('son titre : 🌟 Les souvenirs', () => d.querySelector('#review-offer h2').textContent === '🌟 Les souvenirs');
  check(
    'le compagnon principal propose, sa phrase est écrite avec son nom',
    () =>
      d
        .getElementById('review-offer')
        .textContent.replace(/\s+/g, ' ')
        .includes(`${name} : J'ai un souvenir pour toi. On joue ensemble ?`) &&
      !!d.querySelector('#review-offer .buddy-slot svg'),
    () => d.getElementById('review-offer').textContent,
  );
  check('sa phrase est dite, sans le nom', heard(pg, "J'ai un souvenir pour toi. On joue ensemble ?"), J(spoken));
  check(
    'deux boutons : « 🌟 On joue ! » et « Plus tard »',
    () =>
      d.getElementById('review-yes').textContent === '🌟 On joue !' &&
      d.getElementById('review-later').textContent === 'Plus tard',
  );
  check("`offered` vaut aujourd'hui, et c'est enregistré", () => {
    const saved = JSON.parse(w.localStorage.getItem('lagon-magique-save:p1')).review;
    return ev('state.review.offered') === D && saved.offered === D;
  });
  check('la pause a été consultée une seule fois, pour « souvenirs »', pg.js('__before') === J(['souvenirs']));
  check(
    'jamais « erreur », « raté » ni « faux » dans la proposition',
    () => !/erreur|rat[ée]|faux/i.test(d.getElementById('modal-body').textContent),
  );
}

async function offerRefusedTests(pg) {
  section('S7 : refuser (ligne 10)');
  const { ev, d } = pg;
  const before = pg.js('state.review');
  d.getElementById('review-later').click();
  check('« Plus tard » ferme la fenêtre, la file ne change pas', !modalOpen(pg) && pg.js('state.review') === before);
  check("la proposition ne revient pas aujourd'hui", ev('maybeOfferReview()') === false && !modalOpen(pg));
  await startSession(pg);
  check('ni à la séance suivante du même jour', !offerOpen(pg));
  pg.setDay('2026-11-22');
  await startSession(pg);
  check('elle revient le lendemain', offerOpen(pg) && ev('state.review.offered') === '2026-11-22');
  d.getElementById('modal-close').click();
  check('fermer la fenêtre (croix) : rien ne change non plus', () => {
    const q = queue(pg);
    return !modalOpen(pg) && J(q.items) === J([item('math')]) && ev('maybeOfferReview()') === false;
  });
  check("un refus n'annonce aucune fin de mission", pg.js('__after') === '[]');
}

// la fenêtre fermée et une file d'un item dû, puis un réglage de plus
const freshOffer = (pg, more = '') =>
  pg.ev(`closeModal(); state.review = ${J({ items: [item('math')], offered: null })}; ${more}`);

async function offerAbsentTests(pg) {
  section('S6 : quand la proposition ne vient pas');
  const { ev, d } = pg;
  const fresh = (more) => freshOffer(pg, more);
  const none = () => ev('maybeOfferReview()') === false && !modalOpen(pg);
  fresh();
  check('contrôle : avec ces réglages, elle vient', ev('maybeOfferReview()') === true && offerOpen(pg));
  fresh(`state.review.items[0].due = ${J(ev('addDays(dayKey(new Date()), 1)'))}`);
  check("aucun item dû aujourd'hui", none());
  fresh('party.active = true');
  check('à plusieurs, chacun son tour (ligne 18)', none());
  await startSession(pg);
  check('à plusieurs : rien non plus en début de séance (ligne 18)', !offerOpen(pg));
  fresh('party.active = false; race.active = true');
  check('à plusieurs, en course (ligne 18)', none());
  fresh('race.active = false; openModal("<p id=autre>autre fenêtre</p>")');
  check('une fenêtre est déjà ouverte', ev('maybeOfferReview()') === false && !!d.getElementById('autre'));
  fresh('window.__name = state.name; state.name = ""');
  check('pas de prénom', none());
  ev('state.name = __name');
  check('dans tous ces cas, `offered` reste libre', ev('state.review.offered') === null);
}

function offerPauseTests(pg) {
  section('S7 : la pause gagne toujours');
  const { ev, d } = pg;
  freshOffer(
    pg,
    'window.__before.length = 0; currentProfile().pauseMin = 20; saveProfiles(); state.pauseExtra = null; state.playTime = { [todayKey()]: 25 * 60 }; save()',
  );
  const offered = ev('maybeOfferReview()');
  const veil = d.getElementById('rest-veil');
  check('pause due : aucune proposition', offered === false && !offerOpen(pg));
  check('le voile de la pause est là', !!veil && !veil.hidden);
  check('la pause a été consultée une fois', pg.js('__before') === J(['souvenirs']));
  check('`offered` reste libre : la proposition viendra après la pause', ev('state.review.offered') === null);
  ev('currentProfile().pauseMin = 0; saveProfiles(); state.playTime = {}; save(); restWake()');
}

function offerCountTests(pg) {
  section('S6 : un, deux ou trois souvenirs');
  for (const [names, words] of [
    [['math', 'clock'], 'deux souvenirs'],
    [['math', 'clock', 'compare'], 'trois souvenirs'],
    [['math', 'clock', 'compare', 'reading', 'calc'], 'trois souvenirs'],
  ]) {
    pg.ev(`closeModal(); state.review = ${J({ items: names.map((n) => item(n)), offered: null })}`);
    pg.spoken.length = 0;
    pg.ev('maybeOfferReview()');
    check(
      `${names.length} items dus : « ${words} »`,
      heard(pg, `J'ai ${words} pour toi. On joue ensemble ?`),
      J(pg.spoken),
    );
  }
}

async function offerTests() {
  section('S6 : la proposition du compagnon (ligne 9)');
  const pg = await ninaPage({ items: [item('math')], offered: null }, D);
  await offerShownTests(pg);
  await offerRefusedTests(pg);
  await offerAbsentTests(pg);
  offerPauseTests(pg);
  offerCountTests(pg);
  done(pg);
}

module.exports = { offerTests };
