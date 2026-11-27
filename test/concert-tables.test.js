// L'Île du Grand Concert : les tables des deux mini-jeux « Do, ré, mi »
// (notes) et « La mélodie » (melody), et le groupe « 🎵 Musique » de l'espace
// parents : critères 12 à 14 et 24 de la spec. Harnais : test/tools/concert.js.
const t = require('./tools/concert.js');
const { d, ev, json, check, section, all, TIERS } = t;

const group = (id) => ev(`SKILL_GROUPS.find((x) => x.id === ${json(id)})`);
const idx = (id) => ev(`SKILL_GROUPS.findIndex((x) => x.id === ${json(id)})`);

// critères 12 et 24 : un jeu inscrit partout où il faut
function inscrit({ key, emoji, name, cheer }) {
  check(`« ${name} » : inscrit une seule fois, ${emoji}, dès 5 ans (pas à 4 ans)`, () => [
    ev(`GAME_TYPES.filter((k) => k === ${json(key)}).length`) === 1,
    json(ev(`GAME_LIST.filter((x) => x.key === ${json(key)})`)) === json([{ key, emoji, name }]),
    ev(`gameTypesForAge(5).includes(${json(key)})`) && ev(`gameTypesForAge(0).includes(${json(key)})`),
    !ev(`gameTypesForAge(4).includes(${json(key)})`),
    ev('new Set(GAME_TYPES).size === GAME_TYPES.length'),
    ev(`hasHints(${json(key)})`),
  ]);
  check(`« ${name} » : pas de minuteur, sa phrase de progrès, paliers 1 à 5`, () => [
    TIERS.every((p) => ev(`timerFor(${json(key)}, ${p})`) === null),
    ev(`PROGRESS_CHEERS[${json(key)}]`) === cheer,
    ev(`gameMaxTier(${json(key)})`) === 5,
  ]);
}

function notes() {
  inscrit({ key: 'notes', emoji: '🎹', name: 'Do, ré, mi', cheer: 'Tu reconnais les notes de mieux en mieux !' });
  check('critère 12 : « Do, ré, mi » a le barème généreux (illimités, 4, 3, 3, 2)', () => [
    ev('livesFor("notes", 1)') === Infinity,
    [2, 3, 4, 5].every((p) => ev(`livesFor("notes", ${p})`) === ev(`LIVES_TABLE.generous[${p}]`)),
    json([2, 3, 4, 5].map((p) => ev(`livesFor("notes", ${p})`))) === json([4, 3, 3, 2]),
  ]);
}

// critère 13 : le groupe « Musique », après « Mémoire et logique »
function groupe() {
  check('critère 13 : un groupe 🎵 « Musique », après le groupe « logique »', () => [
    group('musique').emoji === '🎵' && group('musique').name === 'Musique',
    idx('musique') > idx('logique'),
    ev('SKILL_GROUPS.filter((x) => x.id === "musique").length') === 1,
  ]);
  check('critère 13 : il contient le rythme, grave ou aigu et les notes', () => [
    json(group('musique').games) === json(['rhythm', 'pitch', 'notes']),
  ]);
  check('critère 13 : « Mémoire et logique » n’a plus le rythme ni grave ou aigu, et garde Simon', () => [
    !group('logique').games.includes('rhythm'),
    !group('logique').games.includes('pitch'),
    ['memory', 'simon', 'diff', 'sequence', 'rangement'].every((k) => group('logique').games.includes(k)),
  ]);
  check('chaque jeu de musique est dans un seul groupe', () =>
    ['rhythm', 'pitch', 'notes', 'simon'].map(
      (k) => ev(`SKILL_GROUPS.filter((x) => x.games.includes(${json(k)})).length`) === 1,
    ),
  );
}

// critère 14 : les chiffres d'une partie existante se retrouvent sous « Musique »
function parents() {
  const version = ev('SAVE_VERSION');
  ev(`closeModal(); currentProfile().age = 0;
      state.skills = {
        rhythm: { wins: 7, fails: 1, errors: 2, last: null, recent: [], lvl: 2 },
        pitch: { wins: 3, fails: 0, errors: 0, last: null, recent: [], lvl: 1 },
        simon: { wins: 5, fails: 0, errors: 0, last: null, recent: [], lvl: 1 },
      };
      save(); openParentSpace()`);
  const box = all('.sk-group').find((g) => g.querySelector('h4').textContent.includes('Musique'));
  const row = (name) => [...box.querySelectorAll('.sk-row')].find((r) => r.textContent.includes(name));
  const logic = all('.sk-group').find((g) => g.querySelector('h4').textContent.includes('Mémoire et logique'));
  check('critère 14 : « 🎵 Musique » montre le rythme et grave ou aigu, avec leurs réussites', () => [
    box.querySelector('h4').textContent === '🎵 Musique',
    row('Le rythme magique').querySelector('.sk-detail').textContent.startsWith('7 réussies · 1 ratée'),
    row('Grave ou aigu ?').querySelector('.sk-detail').textContent.startsWith('3 réussies'),
    !!row('Do, ré, mi'),
  ]);
  check('critère 14 : « Mémoire et logique » garde Simon, sans le rythme', () => [
    logic.textContent.includes('Les couleurs'),
    logic.textContent.includes('5 réussies'),
    !logic.textContent.includes('Le rythme magique'),
  ]);
  check('critère 14 : rien n’a migré (les compétences sont rangées par jeu)', () => [
    ev('SAVE_VERSION') === version,
    ev('state.skills.rhythm.wins') === 7 && ev('state.skills.pitch.wins') === 3,
  ]);
  ev('closeModal()');
}

(async () => {
  await t.start();
  section('Do, ré, mi : inscription (critère 12)');
  notes();
  section('Espace parents : le groupe « Musique » (critères 13 et 14)');
  groupe();
  parents();
  check('la page est toujours là', [!!d.getElementById('overlay')]);
  await t.finish('l’Île du Grand Concert (tables et espace parents)');
})();
