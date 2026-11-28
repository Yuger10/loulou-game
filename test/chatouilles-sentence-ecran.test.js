// Le Monde des Chatouilles : l'écran de « La phrase rigolote » (sentence) :
// critères 20 à 25 et 27 de la spec, contrat DOM, textes S1 à S5, indices H2.
// Les phrases sont posées par le test. Harnais : test/tools/chatouilles.js.
const t = require('./tools/chatouilles.js');
const { ev, json, check, section, all, one } = t;

const S = {
  a: 'Les mots de Lulu se sont mélangés ! Touche un mot pour l’entendre et le mettre dans la phrase. Regarde l’image : elle montre ce que dit la phrase.',
  b: 'Les mots de Lulu se sont mélangés ! Touche un mot pour l’entendre et le mettre dans la phrase. Quand la phrase est finie, je la lis.',
  win: 'Bravo, ta phrase veut dire quelque chose !',
  wrong: 'Hi hi hi ! Ta phrase est rigolote, mais elle ne veut rien dire. Touche un mot pour le changer de place.',
  again: 'Hi hi hi ! Allez, une nouvelle phrase !',
  empty: 'Ta phrase est encore vide. Touche un mot !',
};
Object.keys(S).forEach((k) => (S[k] = S[k].replace(/’/g, "'")));
const FOUR = { t: 'Le chat chatouille Papi.', pic: '🐱🪶👴', ok: [] };
const SIX = { t: 'Le petit chat chatouille le loup.', pic: '', ok: ['Le chat chatouille le petit loup.'] };
const SEVEN = { t: 'Papi fait du ski sur la lune.', pic: '', ok: [] };
const errors = () => ev('missionErrors');
// pose les étiquettes dans cet ordre (rangs dans `t`)
const place = (order) => order.forEach((i) => t.tile(i).click());
const count = (text) => t.spoken.filter((x) => x === t.toSpoken(text)).length;

function rendu() {
  t.openSentence(2, FOUR);
  check('C : titre, consigne écrite, consigne dite (paliers 1 et 2 : « regarde l’image »), image', () => [
    one('.game-head h2').textContent === '📝 La phrase rigolote',
    one('.puzzle-hint .hint-txt').textContent === 'Remets les mots dans l’ordre'.replace('’', "'"),
    t.saidLast(S.a),
    one('#st-pic').textContent.trim() === FOUR.pic,
    one('#st-read').textContent.includes('Lis ma phrase'),
  ]);
  check('critère 25 : la solution : les étiquettes dans l’ordre de la phrase, chacune trouvée une seule fois', () => [
    json(t.sol()) === json([0, 1, 2, 3].map((i) => `.st-tile[data-i="${i}"]`)),
    t.sol().every((s) => all(s).length === 1),
    json(t.sol().map((s) => one(s).textContent)) === json(FOUR.t.split(' ')),
  ]);
  ev('closeModal()');
  t.openSentence(3, SIX);
  check('C : aux paliers 3 à 5, pas d’image, la consigne dit « quand la phrase est finie, je la lis »', () => [
    !one('#st-pic'),
    t.saidLast(S.b),
    all('#st-line .st-slot').length === 6,
  ]);
  ev('closeModal()');
}

// critères 20 à 22 : toucher, retirer, « Lis ma phrase »
function etiquettes() {
  t.openSentence(2, FOUR);
  const start = t.reserveWords();
  const from = t.spoken.length;
  one('#st-read').click();
  check('critère 22 : « Lis ma phrase » sur une ligne vide : un seul `speak`, S5', () => [
    t.saidLast(S.empty),
    t.spoken.length === from + 1,
  ]);
  t.tile(3).click();
  const first = [t.saidLast('Papi'), json(t.lineWords()) === json(['Papi.'])];
  t.tile(1).click();
  check('critère 20 : toucher une étiquette dit le mot (sans le point) et la pose dans la première case vide', () => [
    ...first,
    t.saidLast('chat'),
    json(t.lineWords()) === json(['Papi.', 'chat']),
    t.tile(3).parentElement === all('#st-line .st-slot')[0],
    all('#st-reserve .st-gap').length === 2 && all('#st-reserve .st-gap .st-tile').length === 0,
    all('.st-tile').length === 4 && errors() === 0,
  ]);
  const before = t.spoken.length;
  one('#st-read').click();
  check('critère 22 : « Lis ma phrase » : un seul `speak` dit les mots posés tels quels, dans l’ordre', () => [
    t.saidLast('Papi. chat'),
    t.spoken.length === before + 1,
  ]);
  t.tile(3).click();
  const back = [t.saidLast('Papi'), json(t.lineWords()) === json(['chat'])];
  t.tile(0).click();
  check(
    'critère 21 : toucher une étiquette posée la renvoie à sa place dans la réserve ; la suivante prend la case vide',
    () => [
      ...back,
      json(all('#st-line .st-slot').map((s) => s.textContent)) === json(['Le', 'chat', '', '']),
      json(all('#st-reserve > *').map((x) => x.textContent)) ===
        json(start.map((w) => (w === 'Papi.' || w === 'chatouille' ? w : ''))),
    ],
  );
  ev('closeModal()');
}

// critère 23 : la victoire
async function victoire() {
  t.openSentence(3, SIX);
  place([0, 2, 3, 4, 1]);
  const from = t.spoken.length;
  t.tile(5).click();
  const built = 'Le chat chatouille le petit loup.';
  check(
    'critère 23 : un ordre de `ok` est accepté : un seul `speak` dit la phrase puis S3, les étiquettes s’illuminent',
    () => [
      t.saidLast(`${built} ${S.win}`),
      t.spoken.length === from + 1,
      all('.st-tile').every((x) => x.classList.contains('lit')),
      errors() === 0,
    ],
  );
  check('critère 23 : la mission est gagnée', [await t.won()]);
  ev('closeModal()');
  t.openSentence(2, FOUR);
  const win = t.play(t.sol()) && (await t.won());
  check('critère 25 : jouer la solution gagne ; la voix dit la phrase puis S3', () => [
    win,
    count(`${FOUR.t} ${S.win}`) >= 1,
  ]);
  ev('closeModal()');
}

// critère 24 : première erreur, les étiquettes restent ; deuxième, une autre phrase
async function erreurs() {
  t.openSentence(2, FOUR);
  const lives = t.lives();
  place([0, 2, 1]);
  const from = t.spoken.length;
  t.tile(3).click();
  const built = 'Le chatouille chat Papi.';
  check('critère 24 : ordre refusé : la ligne rit, un essai perdu, puis un seul `speak` dit la phrase et S4', () => [
    one('#st-line').classList.contains('giggle-wiggle'),
    errors() === 1 && t.lives() === lives - 1,
    t.saidLast(`${built} ${S.wrong}`),
    t.spoken.slice(from).filter((x) => x === t.toSpoken(`${built} ${S.wrong}`)).length === 1,
    !one('.win-box'),
  ]);
  check('critère 24 : à la première erreur, les étiquettes restent en place et se touchent encore', () => [
    json(t.lineWords()) === json(built.split(' ')),
    all('.st-tile').every((x) => !x.disabled),
  ]);
  t.tile(1).click();
  t.tile(2).click();
  place([2, 1]); // de nouveau faux : « Le chatouille chat Papi. »
  const lost = t.saidLast(`${built} ${S.again}`);
  const next = await t.waitFor(
    () => t.lineWords().length === 0 && t.reserveWords().slice().sort().join(' ') !== 'Le Papi. chat chatouille',
    2500,
  );
  check('critère 24 : à la deuxième erreur, la voix annonce une nouvelle phrase, et une autre phrase arrive', () => [
    lost,
    next,
    errors() === 2 && t.lives() === lives - 2,
    t.reserveWords().length === 4,
    json(t.sol()) === json([0, 1, 2, 3].map((i) => `.st-tile[data-i="${i}"]`)),
  ]);
  const win = t.play(t.sol()) && (await t.won());
  check('critère 24 : la nouvelle phrase se gagne', [win]);
  ev('closeModal()');
}
// essais épuisés (palier 5 : 2 essais) : jamais « une nouvelle phrase »
async function perdu() {
  t.openSentence(5, SEVEN);
  const wrong = [0, 2, 1, 3, 4, 5, 6];
  place(wrong);
  t.tile(2).click();
  t.tile(1).click();
  place([1, 2].reverse());
  const built = 'Papi du fait ski sur la lune.';
  check('critère 24 : essais épuisés à la deuxième erreur : la voix dit S4, jamais « une nouvelle phrase »', () => [
    errors() === 2,
    t.saidLast(`${built} ${S.wrong}`),
    count(`${built} ${S.again}`) === 0,
  ]);
  await t.wait(200);
  check('critère 24 : la mission est perdue, aucune nouvelle phrase n’arrive', () => [
    !one('.win-box'),
    !one('#st-line') || t.lineWords().length === 7,
  ]);
  ev('closeModal()');
}

// critère 27, table H2
async function indices() {
  for (const [p, e] of [
    [2, FOUR],
    [4, SIX],
  ]) {
    t.openSentence(p, e);
    const h = ev('hintsFor("sentence", hint.q)');
    const first =
      "Touche chaque mot pour l'écouter. Puis cherche : qui fait quoi ?" +
      (p <= 2 ? " Regarde l'image pour t'aider." : '');
    t.hintBtn().click();
    const glow1 = one('#st-reserve').classList.contains('hint-glow');
    t.hintBtn().click();
    check(
      `critère 27, palier ${p} : indice 1 la méthode, indice 2 montre le premier mot, aucune étiquette écartée`,
      () => [
        h.length === 2 && h[0].say === first,
        h[1].say === 'Une phrase commence par une grande lettre et finit par un point. Je te montre le premier mot.',
        glow1,
        json(all('.st-tile.hint-glow').map((x) => x.dataset.i)) === json(['0']),
        all('#modal-body .hint-dim').length === 0,
        t.lineWords().length === 0,
        ev('hint.choices') === '.st-tile',
      ],
    );
    const win = t.play(t.sol()) && (await t.won());
    check(`critère 27, palier ${p} : le jeu reste gagnable après les indices`, [win]);
    ev('closeModal()');
  }
}

(async () => {
  await t.start();
  section('La phrase rigolote : l’écran, la solution');
  rendu();
  section('La phrase rigolote : toucher, retirer, « Lis ma phrase »');
  etiquettes();
  section('La phrase rigolote : victoire et erreurs');
  await victoire();
  await erreurs();
  await perdu();
  section('La phrase rigolote : indices du compagnon (H2)');
  await indices();
  await t.finish('le Monde des Chatouilles (sentence, l’écran)');
})();
