// Aller plus loin (track aller-plus-loin_20261122), phase 1, côté adulte : la carte
// « 🎒 Classe » de l'espace parents, le formulaire du joueur, et ce qui reste lié à
// l'âge (jeux proposés, minuteur). Points 9 à 14 de la spec.
const { check, finish, json, newPage, plain, section, wait } = require('./tools/aller-plus-loin.js');

// les puces de classe de l'espace parents, et les noms de celles qui sont marquées
function gradeChips(d) {
  const chips = () => [...d.querySelectorAll('#modal-body [data-grade]')];
  const onChips = () =>
    chips()
      .filter((b) => b.classList.contains('on'))
      .map((b) => plain(b.textContent));
  return { chips, onChips };
}

function carteClasse(p) {
  section("Classe : la carte de l'espace parents");
  const { d, solo, openParents, parentCard } = p;
  const { chips, onChips } = gradeChips(d);
  solo(6, '', 'lagon');
  openParents();
  const card = parentCard('🎒 Classe');
  check('point 9 : une carte « 🎒 Classe »', !!card);
  check(
    "point 9 : 5 puces, dans l'ordre",
    json(chips().map((b) => plain(b.textContent))) === json(["Selon l'âge", 'GS', 'CP', 'CE1', 'CE2']),
    json(chips().map((b) => plain(b.textContent))),
  );
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
}

function carteRegler(p) {
  const { w, d, ev, openParents, parentCard, linaId } = p;
  const { chips, onChips } = gradeChips(d);
  const ce1 = chips().find((b) => b.dataset.grade === 'CE1');
  if (ce1) ce1.click();
  check('point 10 : toucher « CE1 » règle la classe', ev('currentProfile().grade') === 'CE1');
  check(
    'point 10 : les profils sont enregistrés',
    JSON.parse(w.localStorage.getItem('lagon-magique-profiles')).list.find((x) => x.id === linaId).grade === 'CE1',
  );
  check('point 10 : la puce passe « on »', json(onChips()) === json(['CE1']), json(onChips()));
  check(
    'point 10 : le toast',
    plain(d.getElementById('toast').textContent) === '🎒 Classe : CE1',
    d.getElementById('toast').textContent,
  );
  const card = parentCard('🎒 Classe');
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
}

function carteAides(p) {
  const { d, ev, solo, openParents, parentCard, tomId } = p;
  const { chips } = gradeChips(d);
  solo(null, '', 'lagon');
  openParents();
  const card = parentCard('🎒 Classe');
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

function formulaire(p) {
  section('Classe : le formulaire du joueur');
  const { d, ev, solo, linaId } = p;
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

async function jeuxEtMinuteur(p) {
  section("Classe : les jeux proposés et le minuteur restent liés à l'âge");
  const { d, ev, solo } = p;
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

(async () => {
  const p = await newPage({ tom: true });
  carteClasse(p);
  carteRegler(p);
  carteAides(p);
  formulaire(p);
  await jeuxEtMinuteur(p);
  finish('aller-plus-loin (classe, côté adulte)');
})();
