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
// une phrase telle que la voix la dit : sans emoji, sans espace avant la ponctuation
const voiced = (s) =>
  plain(s)
    .replace(/⭐/g, '')
    .replace(/\s+([?!,.:])/g, '$1')
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

/* ---- phase 2 : les textes de l'enfant (spec, points 17 à 30) et les outils ---- */
const OFFER = "Ce jeu, tu le connais par cœur ! Tu veux essayer un défi étoile ? C'est un cran plus difficile.";
const REFUSED = "D'accord ! Le défi étoile t'attendra.";
const WON_FIRST = 'Défi étoile réussi ! Ce jeu gagne son étoile ⭐';
const WON_AGAIN = 'Défi étoile réussi ⭐';
const FAIL_MSG = "Le défi étoile était très difficile. C'était courageux d'essayer !";
const BACK_STAR = 'On revient à ton jeu habituel. Ton étoile reste à toi !';
const BACK_NONE = "On revient à ton jeu habituel. Bravo d'avoir essayé !";
const STAR_NONE = { streak: 0, open: false, miss: 0, won: 0, offered: null };
const COUNT_SKILL = '{ wins: 5, fails: 0, errors: 0, last: null, recent: [], lvl: 2, hints: 0 }';
// l'état de départ : 6 ans sans classe (plafond 2), en solo, sur une île de palier 2,
// « Compter » déjà au niveau 2 : le palier joué est le plafond du jeu
function base(t) {
  t('closeModal(); endBonusChallenge(); party.active = false; party.players = []; race.active = false');
  t('endStarMission()');
  t("currentProfile().age = 6; currentProfile().grade = ''; delete currentProfile().starChallenges; saveProfiles()");
  t(
    `currentWorld = 'foret'; state.missions = 400; state.skills = { count: ${COUNT_SKILL} }; state.stars = {}; setLastGame(null); save()`,
  );
}
// le suivi étoile d'un jeu, lu par l'API (une copie)
function starRec(t, k = 'count') {
  try {
    return JSON.parse(t(`JSON.stringify(starOf(${JSON.stringify(k)}))`));
  } catch {
    return {}; // starOf pas encore écrite : les vérifications échouent
  }
}
// le suivi étoile d'un jeu tel qu'il est enregistré dans la partie du joueur courant
function savedStar(win, evIn, k = 'count') {
  const saved = JSON.parse(win.localStorage.getItem(evIn('currentSaveKey()')) || '{}');
  return (saved.stars || {})[k] || {};
}
// une mission enregistrée sans passer par l'écran du jeu
function mission(t, key, ok, errors) {
  t(
    `setLastGame(${JSON.stringify(key)}); resetMissionErrors(); for (let i = 0; i < ${errors}; i++) noteAnswerError(); recordMission(${ok})`,
  );
}
// une victoire au tirage fixé (jamais d'objet surprise), sans laisser Math.random figé
function winMission(t) {
  t(
    'window.__r0 = window.__r0 || Math.random; Math.random = () => 0.5; try { onMissionWin(); } finally { Math.random = window.__r0; }',
  );
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
  await wait(700); // après le premier chapitre de l'histoire, ouvert 600 ms après la création du joueur
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

  /* ================= Phase 2 : le défi étoile ================= */
  const t = tryEv;
  const today = ev('todayKey()');
  const yesterday = ev('todayKey(new Date(Date.now() - 864e5))');

  section('Défi étoile : la sauvegarde');
  {
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

  section('Défi étoile : la maîtrise (streak)');
  {
    base(t);
    const streak = (k = 'count') => starRec(t, k).streak;
    check(
      'une valeur absente se lit par défaut',
      json(starRec(t, 'count')) === json(STAR_NONE),
      json(starRec(t, 'count')),
    );
    check('lire ne crée aucune entrée', ev('JSON.stringify(state.stars)') === '{}');
    mission(t, 'count', true, 0);
    check('point 16 : réussie sans erreur au plafond : streak 1', streak() === 1, `${streak()}`);
    mission(t, 'count', true, 1);
    check('point 16 : réussie avec 1 erreur : streak 2', streak() === 2, `${streak()}`);
    mission(t, 'count', true, 2);
    check('point 16 : 2 erreurs : streak revient à 0', streak() === 0, `${streak()}`);
    mission(t, 'count', true, 0);
    mission(t, 'count', false, 0);
    check('point 16 : ratée : streak revient à 0', streak() === 0, `${streak()}`);
    mission(t, 'count', true, 0);
    mission(t, 'count', true, 0);
    ev("currentWorld = 'lagon'");
    check('contrôle : sur une île plus facile, le palier joué est 1', ev('gameDiff()') === 1);
    mission(t, 'count', true, 0);
    mission(t, 'count', false, 0);
    check('point 16 : jouée au palier 1, la mission ne compte pas', streak() === 2, `${streak()}`);
    ev("currentWorld = 'foret'");
    mission(t, 'count', true, 0);
    check('point 16 : la 3e mission maîtrisée donne streak 3', streak() === 3, `${streak()}`);
    check('le compteur est enregistré', savedStar(w, ev).streak === 3);
    ev(`state.skills.memory = ${COUNT_SKILL}`);
    mission(t, 'memory', true, 3);
    check('au mémo, 3 erreurs restent une mission maîtrisée', streak('memory') === 1, `${streak('memory')}`);
    mission(t, 'memory', true, 4);
    check('au mémo, 4 erreurs remettent streak à 0', streak('memory') === 0, `${streak('memory')}`);
  }

  section("Défi étoile : quand l'offre est due");
  {
    const due = (k = 'count') => t(`starOfferDue(${json(k)})`);
    const ready = (more) => {
      base(t);
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
    check(
      'D9 : CE2 garde un défi sur le calcul mental (palier 6)',
      due('calc') === true && t("starTier('calc')") === 6,
    );
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

  section('Défi étoile : la mission');
  {
    base(t);
    t("state.stars.count = { streak: 0, open: true, miss: 0, won: 0, offered: null }; playGame('count')");
    check('point 23 : porte ouverte, playGame démarre une mission étoile', t('inStarMission()') === true);
    check('point 23 : le palier joué est 3', ev('gameDiff()') === 3, `${ev('gameDiff()')}`);
    check('point 24 : le palier habituel reste 2', t('normalDiff()') === 2, `${t('normalDiff()')}`);
    await wait(0);
    const badges = () => d.querySelectorAll('#modal-body .game-head .star-badge');
    check("point 23 : le badge ⭐ dans l'en-tête", badges().length === 1);
    check(
      'point 23 : le badge a son nom',
      badges().length === 1 &&
        badges()[0].getAttribute('role') === 'img' &&
        badges()[0].getAttribute('aria-label') === 'Défi étoile' &&
        badges()[0].textContent === '⭐',
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
    check('point 25 : une erreur, miss vaut 1', starRec(t).miss === 1, `${starRec(t).miss}`);
    t('stepOk(null)');
    check('point 25 : une bonne étape remet miss à 0', starRec(t).miss === 0, `${starRec(t).miss}`);

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
      ev('lastGame') === 'count' && t('inStarMission()') === true && ev('gameDiff()') === 3 && badges().length === 1,
      `${ev('lastGame')}`,
    );

    // point 26 : 2 erreurs d'affilée ferment la porte, la mission continue
    t("closeModal(); state.stars.count.streak = 2; playGame('count')");
    await wait(0);
    t('loseLife(null)');
    check('point 26 : après 1 erreur, la porte reste ouverte', starRec(t).open === true && starRec(t).miss === 1);
    t('loseLife(null)');
    check(
      "point 26 : la 2e erreur d'affilée ferme la porte",
      json(starRec(t)) === json({ streak: 0, open: false, miss: 0, won: 0, offered: null }),
      json(starRec(t)),
    );
    check('point 26 : le badge est retiré', badges().length === 0);
    check(
      "point 26 : la mission reste une mission étoile jusqu'à sa fin",
      t('inStarMission()') === true && t('starActive()') === false,
    );
    check('point 26 : le palier revient au palier habituel', ev('gameDiff()') === 2, `${ev('gameDiff()')}`);
    const before = JSON.parse(ev('JSON.stringify(state.skills.count)'));
    spoken.length = 0;
    winMission(t);
    await wait(350);
    let body = plain(d.getElementById('modal-body').textContent);
    check('point 30 : gagnée porte fermée, le texte de retour', body.includes(BACK_NONE), body.slice(0, 200));
    check('point 30 : sans texte de réussite du défi', !body.includes('Défi étoile réussi'));
    check("point 30 : pas d'étoile gagnée", starRec(t).won === 0);
    check(
      'point 30 : le texte de retour est dit',
      spoken.some((s) => voiced(s).includes(voiced(BACK_NONE))),
      spoken.join(' | '),
    );
    check("point 30 : pas d'offre sur cet écran", !d.querySelector('.star-offer'));
    let after = JSON.parse(ev('JSON.stringify(state.skills.count)'));
    check(
      'point 28 : porte fermée en cours, comptée comme pour Zap',
      after.wins === before.wins + 1 &&
        after.last === today &&
        json(after.recent) === json(before.recent) &&
        after.lvl === before.lvl &&
        after.atLvl === undefined &&
        starRec(t).streak === 0,
      json(after),
    );
    check('la mission étoile est finie', t('inStarMission()') === false);

    // perdue après une porte fermée en cours : l'écran d'échec habituel, puis le texte de retour
    t("closeModal(); state.stars.count = { streak: 0, open: true, miss: 0, won: 1, offered: null }; playGame('count')");
    t('loseLife(null); loseLife(null)');
    spoken.length = 0;
    t('onMissionFail()');
    body = plain(d.getElementById('modal-body').textContent);
    check(
      'point 30 : ratée porte fermée, le titre habituel et le texte de retour',
      plain((d.querySelector('#modal-body h2') || {}).textContent) === 'Raté !' &&
        body.includes(BACK_STAR) &&
        !body.includes(FAIL_MSG),
      body.slice(0, 200),
    );
    check("point 30 : l'étoile déjà gagnée reste", starRec(t).won === 1);
    check(
      'point 30 : le texte de retour est dit',
      spoken.some((s) => voiced(s).endsWith(voiced(BACK_STAR))),
      spoken.join(' | '),
    );
  }

  section('Défi étoile : réussi');
  {
    base(t);
    t("state.stars.count = { streak: 0, open: true, miss: 0, won: 0, offered: null }; playGame('count')");
    const inv = () => Object.values(JSON.parse(ev('JSON.stringify(state.inventory)'))).reduce((a, b) => a + b, 0);
    const before = JSON.parse(ev('JSON.stringify(state.skills.count)'));
    const inv0 = inv();
    t('loseLife(null)');
    spoken.length = 0;
    winMission(t);
    await wait(350);
    let body = plain(d.getElementById('modal-body').textContent);
    check('point 27 : won augmente de 1', starRec(t).won === 1, json(starRec(t)));
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
    check('point 27 : la porte reste ouverte, miss revient à 0', starRec(t).open === true && starRec(t).miss === 0);
    check("pas d'offre pendant que la porte est ouverte", !d.querySelector('.star-offer'));
    t("closeModal(); playGame('count')");
    winMission(t);
    body = plain(d.getElementById('modal-body').textContent);
    check(
      'point 27 : la fois suivante, « Défi étoile réussi ⭐ »',
      starRec(t).won === 2 && body.includes(WON_AGAIN) && !body.includes(WON_FIRST),
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
        starRec(t).streak === 0,
      json(after),
    );
    t('closeModal()');
  }

  section('Défi étoile : raté');
  {
    for (const won of [0, 1]) {
      base(t);
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
        json(starRec(t)) === json({ streak: 0, open: false, miss: 0, won, offered: null }),
        json(starRec(t)),
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
  }

  section('Défi étoile : à plusieurs et avec Zap');
  {
    base(t);
    t(
      "state.stars.count = { streak: 2, open: true, miss: 0, won: 0, offered: null }; party.active = true; party.players = [profiles.current]; party.turn = 0; setLastGame('count'); beginStarMission('count')",
    );
    check(
      'point 33 : à plusieurs, pas de mission étoile',
      t('inStarMission()') === false && ev('gameDiff()') === 2,
      `${ev('gameDiff()')}`,
    );
    mission(t, 'count', true, 0);
    check(
      'point 33 : à plusieurs, aucun compteur ne bouge',
      json(starRec(t)) === json({ streak: 2, open: true, miss: 0, won: 0, offered: null }),
      json(starRec(t)),
    );

    base(t);
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
    winMission(t);
    check('point 34 : un défi de Zap gagné ne compte pas dans streak', starRec(t).streak === 2, json(starRec(t)));
    t('closeModal()');
  }

  section('Défi étoile : le choix des jeux');
  {
    base(t);
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

  section("Défi étoile : l'espace parents");
  {
    base(t);
    openParents();
    const chips = () => [...d.querySelectorAll('#modal-body [data-stars]')];
    const onChips = () =>
      chips()
        .filter((b) => b.classList.contains('on'))
        .map((b) => plain(b.textContent));
    let card = parentCard('🎒 Classe');
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

    t('state.stars.count = { streak: 2, open: true, miss: 1, won: 1, offered: null }; save()');
    const off = chips().find((b) => b.dataset.stars === '0');
    if (off) off.click();
    check("point 36 : « Pas de défi étoile » coupe l'interrupteur", ev('currentProfile().starChallenges') === false);
    check(
      'point 36 : le réglage est enregistré',
      JSON.parse(w.localStorage.getItem('lagon-magique-profiles')).list.find((p) => p.id === linaId).starChallenges ===
        false,
    );
    check('point 36 : la puce passe « on »', json(onChips()) === json(['Pas de défi étoile']), json(onChips()));
    check(
      'point 36 : toutes les portes se ferment, streak et won restent',
      json(starRec(t)) === json({ streak: 2, open: false, miss: 0, won: 1, offered: null }),
      json(starRec(t)),
    );
    check('point 36 : la partie est enregistrée', savedStar(w, ev).open === false);
    t('state.stars.count.streak = 3');
    check('point 36 : plus aucune offre', t("starOfferDue('count')") === false);
    // une porte encore ouverte (partie importée, autre onglet) : fermée au démarrage
    t("closeModal(); state.stars.count.open = true; playGame('count')");
    check(
      'point 36 : interrupteur coupé, playGame ferme la porte et joue au palier habituel',
      t('inStarMission()') === false && starRec(t).open === false && ev('gameDiff()') === 2 && starRec(t).won === 1,
      json(starRec(t)),
    );
    await wait(0);
    check('point 36 : pas de badge', !d.querySelector('#modal-body .star-badge'));
    t('closeModal()');
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

    // point 37 : un changement de classe ferme les portes et remet les compteurs à 0
    t(
      'state.stars = { count: { streak: 2, open: true, miss: 1, won: 2, offered: null }, math: { streak: 1, open: false, miss: 0, won: 0, offered: null } }; save()',
    );
    const grade = (g) => [...d.querySelectorAll('#modal-body [data-grade]')].find((b) => b.dataset.grade === g);
    if (grade('CE1')) grade('CE1').click();
    check(
      'point 37 : la classe change, portes fermées et streak à 0, won reste',
      json(starRec(t)) === json({ streak: 0, open: false, miss: 0, won: 2, offered: null }) &&
        starRec(t, 'math').streak === 0,
      json(ev('JSON.stringify(state.stars)')),
    );
    check('point 37 : la partie est enregistrée', savedStar(w, ev).streak === 0);
    t('state.stars.count.streak = 2');
    if (grade('CE1')) grade('CE1').click();
    check('point 37 : toucher la même classe ne remet rien à zéro', starRec(t).streak === 2);

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
      json(tomStars()) === json({ streak: 2, open: false, miss: 0, won: 1, offered: null }) && starRec(t).streak === 2,
      json(tomStars()),
    );
    if (grade('CP')) grade('CP').click();
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

    // point 38 : la ligne de détail des progrès
    const detail = (won) => {
      base(t);
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

  /* ---- l'offre : une seule par ouverture du jeu, donc une page neuve par scénario ---- */
  const pages = [];
  async function newPage(saved) {
    const p = boot(saved);
    pages.push(p);
    await wait(150);
    if (!saved) {
      p.d.getElementById('btn-splash-play').click();
      p.d.getElementById('name-input').value = 'Lina';
      p.d.querySelector('.avatar-opt').click();
      p.d.getElementById('btn-start').click();
    }
    await wait(700); // après le premier chapitre de l'histoire, ouvert 600 ms après la création du joueur
    p.t = (code) => {
      try {
        return p.ev(code);
      } catch (e) {
        return `⛔ ${e.message}`;
      }
    };
    return p;
  }
  // une mission de « Compter » gagnée, qui fait passer streak de 2 à 3 : l'offre est due
  async function winThird(p) {
    p.t("state.stars.count = { streak: 2, open: false, miss: 0, won: 0, offered: null }; playGame('count')");
    p.spoken.length = 0;
    winMission(p.t);
    await wait(350);
  }

  section("Défi étoile : l'offre, puis « Pas maintenant »");
  let copy = null;
  {
    const p = await newPage();
    base(p.t);
    p.t("playGame('count')");
    winMission(p.t);
    check('point 17 : streak à 1, aucune offre', starRec(p.t).streak === 1 && !p.d.querySelector('.star-offer'));
    p.t('closeModal()');
    await winThird(p);
    const offer = p.d.querySelector('#modal-body .star-offer');
    check(
      'point 17 : streak passe à 3, le bloc .star-offer apparaît',
      starRec(p.t).streak === 3 && !!offer,
      json(starRec(p.t)),
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
    check('point 17 : offered vaut la date du jour', starRec(p.t).offered === today, json(starRec(p.t)));
    check(
      'point 21 : les boutons habituels restent',
      !!p.d.getElementById('btn-yay') && !!p.d.getElementById('btn-again'),
    );
    check("point 17 : la porte n'est pas encore ouverte", starRec(p.t).open === false);
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
    check('point 20 : la porte reste fermée', starRec(p.t).open === false);
    check("point 20 : pas de nouvelle offre aujourd'hui", p.t("starOfferDue('count')") === false);

    // point 31 : porte fermée (streak à 0), trois nouvelles missions maîtrisées, offre d'un autre jour
    p.t(`closeModal(); closeStarDoor('count'); state.stars.count.offered = ${json(yesterday)}; save()`);
    check('point 31 : closeStarDoor remet streak à 0', starRec(p.t).streak === 0);
    for (let i = 0; i < 3; i++) mission(p.t, 'count', true, 0);
    check('point 31 : streak remonte à 3', starRec(p.t).streak === 3, json(starRec(p.t)));
    check('point 31 : pas de deuxième offre pendant cette ouverture du jeu', p.t("starOfferDue('count')") === false);
    p.t("playGame('count')");
    winMission(p.t);
    check(
      "point 31 : l'écran de victoire ne montre pas l'offre",
      !p.d.querySelector('.star-offer') && starRec(p.t).streak === 4,
    );
    p.t('closeModal(); save()');
    copy = {};
    for (let i = 0; i < p.w.localStorage.length; i++) {
      const k = p.w.localStorage.key(i);
      if (k === 'lagon-magique-profiles' || k.startsWith('lagon-magique-save')) copy[k] = p.w.localStorage.getItem(k);
    }
  }

  section('Défi étoile : une page neuve, puis « ⭐ Oui ! »');
  {
    const p = await newPage(copy);
    check(
      'point 31 : la partie relue garde son compteur',
      starRec(p.t).streak === 4 && starRec(p.t).offered === yesterday,
      json(starRec(p.t)),
    );
    check("point 31 : dans une page neuve, l'offre est due", p.t("starOfferDue('count')") === true);
    p.t("closeModal(); currentWorld = 'foret'; playGame('count')");
    p.spoken.length = 0;
    winMission(p.t);
    await wait(350);
    const yes = p.d.getElementById('btn-star-yes');
    check(
      "point 31 : l'offre revient",
      !!p.d.querySelector('#modal-body .star-offer') &&
        !!yes &&
        p.spoken.some((s) => voiced(s).endsWith(voiced(OFFER))),
    );
    if (yes) yes.click();
    check(
      'point 22 : « ⭐ Oui ! » ouvre la porte',
      starRec(p.t).open === true && starRec(p.t).miss === 0,
      json(starRec(p.t)),
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
    check('point 22 : la porte ouverte est enregistrée', savedStar(p.w, p.ev).open === true);
    p.t('closeModal()');
  }

  section("Défi étoile : quitter l'offre autrement est un refus silencieux");
  for (const sel of ['#btn-yay', '#btn-again', '#modal-close']) {
    const p = await newPage();
    base(p.t);
    await winThird(p);
    const shown = !!p.d.querySelector('#modal-body .star-offer');
    p.spoken.length = 0;
    const btn = p.d.querySelector(sel);
    if (btn) btn.click();
    await wait(30);
    check(
      `point 21 : ${sel} : la porte reste fermée, rien n'est dit sur le défi`,
      shown &&
        starRec(p.t).open === false &&
        !p.spoken.some((s) => /défi étoile/i.test(s)) &&
        p.t('inStarMission()') === false,
      p.spoken.join(' | '),
    );
    check(
      `point 21 : ${sel} : l'offre ne revient pas avant demain`,
      starRec(p.t).offered === today && p.t("starOfferDue('count')") === false,
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
  for (const p of pages) check('aucune erreur JS (page neuve)', p.errs.length === 0, p.errs.join(' | '));
  check('aucune erreur JS', errs.length === 0, errs.join(' | '));
  console.log(`\n${failed ? '❌' : '✅'} aller-plus-loin : ${passed} vérifications réussies, ${failed} en échec`);
  process.exit(failed ? 1 : 0);
})();
