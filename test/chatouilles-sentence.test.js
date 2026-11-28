// Le Monde des Chatouilles : « La phrase rigolote » (sentence), ses tables et
// sa banque : critères 18, 19, 26 et 28 à 30 de la spec, tables T3 (paliers)
// et T4 (les 40 phrases, recopiées ici), règles R1 (ordre accepté) et R2
// (lettres du palier 1). L'écran : test/chatouilles-sentence-ecran.test.js.
// Harnais : test/tools/chatouilles.js.
const t = require('./tools/chatouilles.js');
const { ev, json, check, section, all, one, T3 } = t;

// T4 : `t | pic | ok`, rangées par nombre d'étiquettes
const T4 = {
  3: [
    'Le rat rit.|🐀😆',
    'Le lama rit.|🦙😆',
    'La tortue rit.|🐢😆',
    'Papi rit fort.|👴😆',
    'Le pirate rit.|🏴‍☠️😆',
    'Le rat lit.|🐀📖',
    'Lulu a ri.|🦦😆',
    'Le lama lit.|🦙📖',
  ],
  4: [
    'Le chat chatouille Papi.|🐱🪶👴',
    'La vache fait coucou.|🐄👋',
    'Le cochon danse bien.|🐷💃',
    'Le robot rit fort.|🤖😆',
    'La souris chatouille Papi.|🐭🪶👴',
    'Le poisson a froid.|🐠🥶',
    'Le lapin fait dodo.|🐰😴',
    'Le loup a peur.|🐺😱',
  ],
  5: [
    'Le chat chatouille le loup.',
    'La vache mange la lune.',
    'Un ours mange une fusée.',
    'Le cochon fait du ski.',
    'La poule chatouille le lion.',
    'Le singe danse sur Papi.',
    'Le lapin porte un chapeau.',
    'Mamie a un nez rouge.',
  ],
  6: [
    'Le petit chat chatouille le loup.||Le chat chatouille le petit loup.',
    'La vache rose mange la lune.',
    'Le crocodile a mis un tutu.',
    'Papi chatouille le ventre du lion.',
    'Le poisson rouge fait du vélo.',
    'Un ours danse avec une fusée.',
    'Le roi a une barbe bleue.',
    'La grande girafe chatouille les nuages.',
  ],
  7: [
    'Le petit lapin chatouille le grand ours.||Le grand lapin chatouille le petit ours.',
    'Papi fait du ski sur la lune.',
    'La vache mange le gâteau du roi.',
    'Un poisson rouge chante dans le bain.',
    'Le lion porte une petite chaussette rose.',
    'Mamie chatouille le nez du gros dragon.||Mamie chatouille le gros nez du dragon.',
    'La tortue gagne la course des lapins.||La course gagne la tortue des lapins.',
    'Le gros chien chatouille la souris grise.',
  ],
};
const entry = (row) => {
  const [text, pic, ok] = row.split('|');
  return { t: text, pic: pic || '', ok: ok ? [ok] : [] };
};
const SIZES = [3, 4, 5, 6, 7];
const sorted = (s) => s.split(' ').sort().join(' ');

function inscription() {
  check('critère 28 : « La phrase rigolote » est inscrite une seule fois, 📝, dès 6 ans', () => [
    ev('GAME_TYPES.filter((k) => k === "sentence").length') === 1,
    ev('GAME_TYPES.filter((k) => k === "coding").length') === 1,
    json(ev('GAME_LIST.filter((x) => x.key === "sentence")')) ===
      json([{ key: 'sentence', emoji: '📝', name: 'La phrase rigolote' }]),
    ev('hasHints("sentence")'),
    ev('gameTypesForAge(6).includes("sentence")') && ev('gameTypesForAge(0).includes("sentence")'),
    !ev('gameTypesForAge(5).includes("sentence")') && !ev('gameTypesForAge(4).includes("sentence")'),
    ev('new Set(GAME_TYPES).size === GAME_TYPES.length'),
    ev('new Set(GAME_LIST.map((x) => x.key)).size === GAME_LIST.length'),
  ]);
  check('critère 29 : pas de minuteur, barème généreux (illimités, 4, 3, 3, 2)', () => [
    t.TIERS.every((p) => ev(`timerFor("sentence", ${p})`) === null),
    ev('livesFor("sentence", 1)') === Infinity,
    json([2, 3, 4, 5].map((p) => ev(`livesFor("sentence", ${p})`))) === json([4, 3, 3, 2]),
  ]);
  check('critère 30 : sa phrase de progrès, groupe « lire » de l’espace parents', () => [
    ev('PROGRESS_CHEERS.sentence') === 'Tes phrases veulent dire de plus en plus de choses !',
    ev('SKILL_GROUPS.find((x) => x.id === "lire").games.includes("sentence")'),
    ev('SKILL_GROUPS.filter((x) => x.games.includes("sentence")).length') === 1,
  ]);
  check('critère 18, T3 : sentenceRound(p) vaut les 5 objets de la spec', () =>
    t.TIERS.map((p) => json(ev(`sentenceRound(${p})`)) === json(T3[p])),
  );
}

function banque() {
  const bank = ev('SENTENCES');
  check('T4 : la banque du jeu est celle de la spec, 8 phrases par taille, dans l’ordre', () => [
    json(Object.keys(bank).map(Number)) === json(SIZES),
    ...SIZES.map((n) => json(bank[n]) === json(T4[n].map(entry))),
  ]);
  check('critère 26 : chaque phrase a exactement n étiquettes, majuscule au début, point à la fin', () =>
    SIZES.flatMap((n) =>
      T4[n].map(entry).map((e) => {
        const w = e.t.split(' ');
        return (
          w.length === n && /^[A-Z]/.test(w[0]) && w[n - 1].endsWith('.') && !w.slice(0, -1).some((x) => /\./.test(x))
        );
      }),
    ),
  );
  check('critère 26 : chaque ordre de `ok` est une permutation exacte des étiquettes, autre que `t`', () => [
    SIZES.every((n) => bank[n].every((e) => e.ok.every((o) => o !== e.t && sorted(o) === sorted(e.t)))),
    SIZES.flatMap((n) => bank[n]).filter((e) => e.ok.length).length === 4,
    SIZES.every((n) => bank[n].every((e) => e.ok.length <= 1)),
  ]);
  check('critère 26 : une image aux tailles 3 et 4 (emojis), aucune au-delà', () => [
    [3, 4].every((n) => bank[n].every((e) => /\p{Extended_Pictographic}/u.test(e.pic))),
    [5, 6, 7].every((n) => bank[n].every((e) => e.pic === '')),
  ]);
  check('R2 : les mots du palier 1 n’ont que les lettres simples du début de CP', () =>
    bank[3].flatMap((e) => e.t.split(' ').map((w) => /^[aeéiouylrmstpnfdv]+$/i.test(w.replace(/\.$/, '')))),
  );
  check('R1 : sentenceAccepts accepte `t` et chaque `ok`, refuse tout autre ordre', () => {
    const accepts = ev('sentenceAccepts');
    const six = bank[6][0];
    return [
      SIZES.every((n) => bank[n].every((e) => accepts(e, e.t) && e.ok.every((o) => accepts(e, o)))),
      accepts(six, 'Le chat chatouille le petit loup.') === true,
      accepts(six, 'Le chat petit chatouille le loup.') === false,
      accepts(bank[5][0], 'Le chatouille chat le loup.') === false,
      accepts(bank[7][6], 'La course gagne la tortue des lapins.') === true,
      accepts(bank[3][0], 'le rat rit.') === false,
    ];
  });
}

// critères 18 et 19 : 30 vraies parties par palier
function tirages(p) {
  const n = T3[p].n;
  const texts = T4[n].map((r) => entry(r));
  const seen = [];
  let fine = true;
  for (let k = 0; k < 30; k++) {
    t.startGame('sentence', p);
    const words = t.reserveWords();
    const e = texts.find((x) => sorted(x.t) === words.slice().sort().join(' '));
    seen.push(e ? e.t : '?');
    const pic = one('#st-pic');
    fine =
      fine &&
      !!e &&
      words.length === n &&
      all('#st-line .st-slot').length === n &&
      t.lineWords().length === 0 &&
      // critère 19 : l'ordre de départ n'est aucun des ordres acceptés
      ![e.t, ...e.ok].includes(words.join(' ')) &&
      // les data-i suivent le rang du mot dans `t`
      e.t.split(' ').every((w, i) => t.tile(i).textContent === w) &&
      (T3[p].pic ? !!pic && pic.textContent.trim() === e.pic : !pic);
  }
  check(
    `critères 18 et 19, palier ${p} : ${n} étiquettes d'une phrase de la banque, mélangées, image ${T3[p].pic ? 'montrée' : 'absente'}`,
    [fine],
  );
  check(`critère 18, palier ${p} : jamais la même phrase deux fois de suite, plusieurs phrases tirées`, () => [
    seen.every((x, i) => i === 0 || x !== seen[i - 1]),
    new Set(seen).size >= 4,
    !one('#challenge-timer'),
  ]);
  ev('closeModal()');
}

(async () => {
  await t.start();
  section('La phrase rigolote : inscription et paliers (T3)');
  inscription();
  section('La phrase rigolote : la banque (T4, R1, R2)');
  banque();
  section('La phrase rigolote : tirages (critères 18 et 19)');
  t.TIERS.forEach(tirages);
  await t.finish('le Monde des Chatouilles (sentence, la banque)');
})();
