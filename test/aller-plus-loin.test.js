// Aller plus loin (track aller-plus-loin_20261122) :
//   - phase 1 : la classe du profil (GS, CP, CE1, CE2), choisie par un adulte
//     dans l'espace parents, remplace l'âge comme plafond de palier ;
//   - phase 2 : le défi étoile, un cran au-dessus du plafond, offert quand un
//     jeu est maîtrisé, refusable, retiré sans rien perdre après 2 erreurs.
// Les numéros (point N) renvoient au « Comportement attendu » de la spec.
const { JSDOM } = require('jsdom');
const page = require('./tools/page.js');

let failed = 0,
  passed = 0;
function check(name, cond, detail) {
  if (cond) {
    passed++;
    console.log('✅ ' + name);
  } else {
    failed++;
    console.log('❌ ' + name + (detail ? `\n     → ${detail}` : ''));
  }
}
function section(name) {
  console.log('— ' + name);
}
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
// les textes se comparent avec une espace ordinaire (spec, « Espaces avant ! et ? »)
const plain = (s) =>
  String(s || '')
    .replace(/ /g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
const json = (x) => JSON.stringify(x);

const html = page.buildHtml();
function boot(saved) {
  const spoken = [];
  const dom = new JSDOM(html, {
    runScripts: 'dangerously',
    pretendToBeVisual: true,
    url: 'http://localhost/?saison=aucune',
    beforeParse(win) {
      win.SpeechSynthesisUtterance = function (text) {
        this.text = text;
      };
      win.speechSynthesis = {
        speaking: false,
        cancel() {},
        getVoices: () => [],
        speak(u) {
          spoken.push(u.text);
        },
      };
      if (saved) for (const [k, v] of Object.entries(saved)) win.localStorage.setItem(k, v);
    },
  });
  const w = dom.window;
  const errs = [];
  w.addEventListener('error', (e) => errs.push(e.message));
  return { w, d: w.document, ev: (code) => w.eval(code), errs, spoken };
}

const { w, d, ev, errs, spoken } = boot();
// une fonction pas encore écrite ne doit pas arrêter la suite : le point échoue, c'est tout
const tryEv = (code) => {
  try {
    return ev(code);
  } catch (e) {
    return `⛔ ${e.message}`;
  }
};
const stars = (n) => '⭐'.repeat(n);
// le profil courant, en solo, sur une île, sans défi en cours
function solo(age, grade, world) {
  ev(`closeModal(); endBonusChallenge(); party.active = false; race.active = false;
    currentProfile().age = ${json(age)}; currentProfile().grade = ${json(grade)};
    currentWorld = ${json(world || 'volcan')}; saveProfiles()`);
}
function openParents(id) {
  ev(`parentUnlockedUntil = Date.now() + 60000; openParentSpace(${id ? json(id) : ''})`);
}
// la carte de l'espace parents dont le titre contient ce texte
function parentCard(title) {
  return [...d.querySelectorAll('#modal-body section.bk-card')].find((s) =>
    (s.querySelector('h3') || { textContent: '' }).textContent.includes(title),
  );
}

(async () => {
  await wait(150);
  d.getElementById('btn-splash-play').click();
  d.getElementById('name-input').value = 'Lina';
  d.querySelector('.avatar-opt').click();
  d.getElementById('btn-start').click();
  await wait(300);
  ev('closeModal()');
  // des missions pour que toutes les îles soient ouvertes
  ev('state.missions = 400; save()');

  /* ================= Phase 1 : la classe du profil ================= */
  section('Classe : la table et le plafond');
  check(
    'point 3 : GS, CP, CE1, CE2 donnent 1, 2, 4, 5',
    json(tryEv("['GS', 'CP', 'CE1', 'CE2'].map(gradeToDiff)")) === '[1,2,4,5]',
    json(tryEv("['GS', 'CP', 'CE1', 'CE2'].map(gradeToDiff)")),
  );
  check('point 3 : sans classe, gradeToDiff vaut null', tryEv("gradeToDiff('')") === null);
  check('point 3 : une classe inconnue vaut null', tryEv("gradeToDiff('CM2')") === null);
  check(
    'GRADES : le contrat partagé',
    json(tryEv('GRADES')) ===
      json([
        { id: 'GS', label: 'GS', diff: 1 },
        { id: 'CP', label: 'CP', diff: 2 },
        { id: 'CE1', label: 'CE1', diff: 4 },
        { id: 'CE2', label: 'CE2', diff: 5 },
      ]),
  );
  check("point 4 : la classe prime sur l'âge", tryEv("playerCap({ age: 6, grade: 'CE1' })") === 4);
  check(
    "point 1 : sans classe, le plafond est celui de l'âge",
    tryEv("playerCap({ age: 6, grade: '' })") === 2 && ev('ageToDiff(6)') === 2,
  );
  check(
    'sans classe, chaque âge garde son palier (8 ans reste au palier 3)',
    json(tryEv("[4, 5, 6, 7, 8, 9, 10, 12].map((a) => playerCap({ age: a, grade: '' }))")) ===
      json(ev('[4, 5, 6, 7, 8, 9, 10, 12].map(ageToDiff)')),
  );
  check('point 5 : ni âge ni classe, pas de plafond', tryEv("playerCap({ age: null, grade: '' })") === null);
  check('un profil absent : pas de plafond', tryEv('playerCap(null)') === null);

  section('Classe : les profils chargés');
  ev('currentProfile().age = 6; delete currentProfile().grade; saveProfiles(); loadProfiles()');
  check(
    "point 1 : un profil sans champ grade reçoit ''",
    ev('currentProfile().grade') === '',
    json(ev('currentProfile().grade')),
  );
  check('point 1 : son plafond ne change pas', tryEv('playerCap(currentProfile())') === 2);
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
  const linaId = ev('profiles.current');
  const tomId = ev('profiles.list[1].id');

  section('Classe : le palier joué');
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

  section('Classe : la course montre le palier joué');
  {
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

  section("Classe : la carte de l'espace parents");
  {
    solo(6, '', 'lagon');
    openParents();
    let card = parentCard('🎒 Classe');
    check('point 9 : une carte « 🎒 Classe »', !!card);
    const chips = () => [...d.querySelectorAll('#modal-body [data-grade]')];
    check(
      "point 9 : 5 puces, dans l'ordre",
      json(chips().map((b) => plain(b.textContent))) === json(["Selon l'âge", 'GS', 'CP', 'CE1', 'CE2']),
      json(chips().map((b) => plain(b.textContent))),
    );
    const onChips = () =>
      chips()
        .filter((b) => b.classList.contains('on'))
        .map((b) => plain(b.textContent));
    check("point 9 : « Selon l'âge » est marquée", json(onChips()) === json(["Selon l'âge"]), json(onChips()));
    check(
      "point 11 : l'aide, selon l'âge",
      !!card && plain(card.textContent).includes("Selon l'âge (6 ans) : jusqu'au palier ⭐⭐."),
      card && plain(card.textContent),
    );
    check(
      'la carte est juste après « 😴 Pause douce »',
      !!card && !!card.previousElementSibling && card.previousElementSibling.textContent.includes('😴 Pause douce'),
    );
    const ce1 = chips().find((b) => b.dataset.grade === 'CE1');
    if (ce1) ce1.click();
    check('point 10 : toucher « CE1 » règle la classe', ev('currentProfile().grade') === 'CE1');
    check(
      'point 10 : les profils sont enregistrés',
      JSON.parse(w.localStorage.getItem('lagon-magique-profiles')).list.find((p) => p.id === linaId).grade === 'CE1',
    );
    check('point 10 : la puce passe « on »', json(onChips()) === json(['CE1']), json(onChips()));
    check(
      'point 10 : le toast',
      plain(d.getElementById('toast').textContent) === '🎒 Classe : CE1',
      d.getElementById('toast').textContent,
    );
    card = parentCard('🎒 Classe');
    check(
      "point 11 : l'aide, avec la classe",
      !!card &&
        plain(card.textContent).includes("CE1 : jusqu'au palier ⭐⭐⭐⭐.") &&
        !plain(card.textContent).includes('(6 ans)'),
      card && plain(card.textContent),
    );
    openParents();
    check('point 9 : rouverte, la carte marque « CE1 »', json(onChips()) === json(['CE1']), json(onChips()));
    const byAge = chips().find((b) => b.dataset.grade === '');
    if (byAge) byAge.click();
    check("point 10 : « Selon l'âge » remet ''", ev('currentProfile().grade') === '');
    check(
      "point 10 : le toast « selon l'âge »",
      plain(d.getElementById('toast').textContent) === "🎒 Classe selon l'âge",
      d.getElementById('toast').textContent,
    );
    solo(null, '', 'lagon');
    openParents();
    card = parentCard('🎒 Classe');
    check(
      "point 11 : l'aide, sans âge ni classe",
      !!card && plain(card.textContent).includes("Sans âge ni classe : la difficulté suit l'île."),
      card && plain(card.textContent),
    );
    const skills = parentCard('📈 Progrès par compétence');
    check(
      "l'aide des progrès parle de la classe",
      !!skills &&
        plain(skills.textContent).includes(
          "ne dépasse jamais celui de l'île ni la classe de l'enfant (ou son âge, sans classe choisie)",
        ),
    );
    // un autre enfant : sa fiche, pas celle du joueur courant
    openParents(tomId);
    const gs = chips().find((b) => b.dataset.grade === 'GS');
    if (gs) gs.click();
    check(
      "la classe d'un autre enfant se règle sur sa fiche",
      ev(`profiles.list.find((p) => p.id === ${json(tomId)}).grade`) === 'GS' && ev('currentProfile().grade') === '',
    );
    ev('closeModal()');
  }

  section('Classe : le formulaire du joueur');
  {
    solo(6, 'CE1', 'lagon');
    ev(`openPlayerSettings(${json(linaId)})`);
    let hint = d.getElementById('age-hint');
    check(
      "point 12 : avec une classe, l'aide le dit",
      !!hint && plain(hint.textContent) === 'Défi adapté : ⭐⭐⭐⭐ (classe CE1, choisie par un adulte)',
      hint && hint.textContent,
    );
    const age7 = d.querySelector('.age-opt[data-age="7"]');
    if (age7) age7.click();
    hint = d.getElementById('age-hint');
    check(
      "point 12 : un autre âge choisi, l'aide garde la classe",
      !!hint && plain(hint.textContent) === 'Défi adapté : ⭐⭐⭐⭐ (classe CE1, choisie par un adulte)',
      hint && hint.textContent,
    );
    check('point 12 : le formulaire ne propose pas la classe', !d.querySelector('#modal-body [data-grade]'));
    solo(6, '', 'lagon');
    ev(`closeModal(); openPlayerSettings(${json(linaId)})`);
    hint = d.getElementById('age-hint');
    check(
      'point 12 : sans classe, le texte ne change pas',
      !!hint && plain(hint.textContent) === 'Défi adapté : ⭐⭐',
      hint && hint.textContent,
    );
    ev('closeModal()');
  }

  section("Classe : les jeux proposés et le minuteur restent liés à l'âge");
  {
    const picks = (grade) => {
      solo(5, grade, 'lagon');
      ev(
        'window.__rand = Math.random; Math.random = () => 0.42; state.gameCounts = {}; state.skills = {}; setLastGame(null)',
      );
      const out = {
        types: json(ev('gameTypesForAge(currentPlayerAge())')),
        picker: json(ev('pickPickerChoices(2).map((g) => g.key)')),
      };
      ev('Math.random = window.__rand');
      return out;
    };
    const a = picks('');
    const b = picks('CE2');
    check(
      'point 13 : la classe ne change pas les jeux proposés',
      a.types === b.types && a.picker === b.picker,
      `${a.picker} / ${b.picker}`,
    );
    check('point 13 : à 5 ans, pas de calcul mental même en CE2', !JSON.parse(b.types).includes('calc'));

    solo(5, 'CE1', 'volcan');
    ev("state.skills = { count: { wins: 4, fails: 0, errors: 0, last: null, recent: [], lvl: 4 } }; playGame('count')");
    await wait(0);
    check('point 14 : 5 ans en CE1, le palier joué est 4', ev('gameDiff()') === 4, `${ev('gameDiff()')}`);
    check('point 14 : jamais de minuteur avant 6 ans', d.getElementById('challenge-timer') === null);
    solo(6, 'CE1', 'volcan');
    ev("playGame('count')");
    await wait(0);
    check(
      'point 14 (contrôle) : à 6 ans, le même état montre le minuteur',
      ev('gameDiff()') === 4 && !!d.getElementById('challenge-timer'),
    );
    ev('closeModal()');
  }

  check('aucune erreur JS', errs.length === 0, errs.join(' | '));
  void spoken;
  console.log(`\n${failed ? '❌' : '✅'} aller-plus-loin : ${passed} vérifications réussies, ${failed} en échec`);
  process.exit(failed ? 1 : 0);
})();
