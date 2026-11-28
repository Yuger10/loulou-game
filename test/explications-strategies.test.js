// @shards 4
// Les erreurs expliquées (track erreurs-expliquees), après la réussite : la
// phrase de stratégie de l'écran de victoire, les éloges du processus, et le
// repli du tirage « jamais deux fois la même question ». Le garde et les tables
// sont dans test/explications.test.js. Harnais et phrases : test/explications/.
const { inShard } = require('./tools/shard.js');
const h = require('./explications/harnais.js');
const { EXPLAINED, MAX_TIER, SINGLE_QUESTION, tierPairs } = require('./explications/listes.js');
const { words, STRATEGIES, PRAISES, plain } = require('./explications/phrases.js');
const { d, ev, check, section, startGame, winNow, toSpoken } = h;

/* ---------- Phrases de stratégie (ligne 15) ---------- */
function strategyProblem([game, q, phrase]) {
  const got = ev(`hint.kind = ${JSON.stringify(game)}; hint.q = ${JSON.stringify(q)}; strategyLine()`);
  const where = `${game} ${JSON.stringify(q)}`;
  if (got !== phrase) return [`${where} : « ${got} » au lieu de « ${phrase} »`];
  if (words(got) < 3 || words(got) > 10) return [`${where} : ${words(got)} mots`];
  return got.startsWith('Tu as ') ? [] : [`${where} : pas au passé composé`];
}
function strategyTable() {
  const problems = STRATEGIES.flatMap(strategyProblem);
  check(`chaque cas de la table : la phrase exacte (${STRATEGIES.length} cas)`, problems.length === 0);
  h.list(problems);
  check(
    'un jeu sans phrase de stratégie : strategyLine renvoie null',
    ev('hint.kind = "reading"; hint.q = {}; strategyLine()') === null,
  );
}
const table = (game) => STRATEGIES.filter((r) => r[0] === game).map((r) => r[2]);
const HOW = (phrase) =>
  `<div class="speech win-how"><span aria-hidden="true">🧠</span> <span class="win-how-text">${phrase}</span></div>`;
// la ligne 🧠 de l'écran de victoire : le problème, ou '' si elle est juste
function howProblem(key, phrase) {
  const h2 = d.querySelector('.win-box h2'),
    how = h2 && h2.nextElementSibling;
  if (!phrase || !(table(key).includes(phrase) || /^Tu as compté (chaque|de) /.test(phrase)))
    return `« ${phrase} » n'est pas dans la table`;
  if (!how || how.outerHTML !== HOW(phrase)) return 'pas de ligne .win-how juste après le titre';
  return how.querySelector('.win-how-text').textContent === phrase ? '' : 'texte différent';
}
// une vraie victoire : les problèmes de sa ligne 🧠 et de ce qui est dit
async function winProblems({ key, tier }) {
  const where = `${key} palier ${tier}`,
    out = [];
  startGame(key, tier);
  const markS = h.spoken.length;
  if (!(await winNow())) return [`${where} : pas gagné`];
  const phrase = ev('strategyLine()');
  const shownWrong = howProblem(key, phrase);
  if (shownWrong) out.push(`${where} : ${shownWrong}`);
  await h.waitFor(() => h.spoken.length > markS, 1000);
  const said = h.spoken.slice(markS).filter((x) => x.includes(toSpoken(phrase || '?')));
  const afterPraise = (ev('winPraises(" Lou")') || []).some(
    (p) => said[0] && said[0].includes(toSpoken(`${p} ${phrase}`)),
  );
  if (said.length !== 1) out.push(`${where} : la phrase est dite ${said.length} fois`);
  else if (!afterPraise) out.push(`${where} : la phrase n'est pas dite juste après l'éloge (« ${said[0]} »)`);
  return out;
}
// une vraie victoire, à chaque palier de chaque jeu
async function strategyWins() {
  const wins = [],
    pairs = inShard(tierPairs());
  for (const pair of pairs) wins.push(...(await winProblems(pair)));
  check(
    `victoire : la ligne 🧠 sous le titre, dite une fois, juste après l'éloge (${pairs.length} victoires)`,
    wins.length === 0,
  );
  h.list(wins);
}
async function noStrategy() {
  startGame('reading', 1);
  check('jeu exempté : gagné', await winNow());
  check('jeu exempté : pas de ligne 🧠', !d.querySelector('.win-box .win-how'));
  startGame('count', 1);
  ev('party.active = true; party.mode = "turns"');
  const won = await winNow();
  check('à plusieurs : gagné, sans ligne 🧠', won && !d.querySelector('.win-box .win-how'));
  ev('party.active = false; closeModal()');
}

/* ---------- Éloges du processus (ligne 16) ---------- */
async function praises() {
  const withName = (ev('winPraises(" Lou")') || []).map(plain),
    without = (ev('winPraises("")') || []).map(plain);
  check('6 éloges, ceux de la spec, avec le prénom', JSON.stringify(withName) === JSON.stringify(PRAISES(' Lou')));
  check('6 éloges, ceux de la spec, sans prénom', JSON.stringify(without) === JSON.stringify(PRAISES('')));
  const banned = /\b(forte?|champion(ne)?|malin|maligne)\b/i;
  check(
    'aucun éloge de la personne (fort, champion, malin)',
    withName.length === 6 && ![...withName, ...without].some((p) => banned.test(p)),
  );
  check(
    "l'espace insécable avant « ! » est gardée",
    (ev('winPraises("")') || []).every((p) => !/ [!?]/.test(p) && / !/.test(p)),
  );
  startGame('count', 1);
  await winNow();
  const title = plain((d.querySelector('.win-box h2') || {}).textContent);
  check(
    "le titre de l'écran de victoire est un de ces éloges",
    PRAISES(' Lou').includes(title) || /^Niveau \d+ !$/.test(title),
  );
  ev('closeModal()');
}

/* ---------- Jamais deux fois la même question : le repli (ligne 5) ---------- */
// [jeu, le tirage (source JS), la clé de la question, la question reste dans le palier]
const FALLBACKS = [
  [
    'count',
    (t) => `countQuestion(${t})`,
    'String(q.n)',
    (t) => `q.n >= countRange(${t}).min && q.n <= countRange(${t}).max`,
  ],
  [
    'compare',
    (t) => `compareQuestion(${t})`,
    'q.a + "-" + q.b',
    (t) => `q.b >= 1 && q.b <= compareRange(${t}) && q.answer === (q.a < q.b ? '<' : q.a > q.b ? '>' : '=')`,
  ],
  [
    'math',
    (t) => `mathQuestion(${t})`,
    'q.a + q.op + q.b',
    (t) =>
      `q.a >= 1 && q.b >= 1 && q.result >= 0 && q.result <= mathBounds(${t}).max && q.result === (q.op === '+' ? q.a + q.b : q.a - q.b)`,
  ],
  [
    'calc',
    (t) => `calcQuestion(${t})`,
    'q.text',
    (t) =>
      `q.result >= 0 && q.result <= calcBounds(${t}).max && q.result === Function('return ' + q.text.replace(/×/g, '*').replace(/−/g, '-'))()`,
  ],
  [
    'clock',
    (t) => `clockQuestion(${t})`,
    'q.hour + "-" + q.minute',
    () => `q.hour >= 1 && q.hour <= 12 && q.answer === timeLabel(q.hour, q.minute)`,
  ],
  [
    'money',
    (t) => `moneyQuestion(${t})`,
    'String(q.correct.total)',
    (t) =>
      `q.options.length === 3 && q.options[0] === q.correct && q.options.slice(1).every((o) => o.total !== q.correct.total) && q.correct.pile.every((c) => moneyDenoms(${t}).includes(c)) && q.correct.pile.reduce((a, b) => a + b, 0) === q.correct.total && q.correct.pile.every((c, i, l) => i === 0 || l[i - 1] >= c)`,
  ],
  [
    'packs',
    (t) => `packsQuestion(${t})`,
    'q.size + "-" + q.n + "-" + q.extra',
    (t) => `q.n >= packsRound(${t}).min && q.n <= packsRound(${t}).max && q.total === q.size * q.n + q.extra`,
  ],
  ['share', (t) => `shareQuestion(${t})`, 'shareKey(q)', () => `q.shape === 'rond' || q.shape === 'carre'`],
  [
    'ladybugs',
    (t) => `ladybugsQuestion(${t})`,
    'q.mode + q.n',
    (t) => `q.n >= ladybugsRound(${t}).min && q.n <= ladybugsRound(${t}).max && q.total === 2 * q.n`,
  ],
];
// tirages forcés : la question tirée est toujours la même, 9 fois de suite
function fallbackProblem([game, draw, keyOf, valid], tier, r) {
  startGame(game, tier);
  const res = ev(`(() => { const rnd = Math.random; Math.random = () => ${r};
    try { let q = ${draw(tier)}; const k1 = ${keyOf}; q = ${draw(tier)}; const k2 = ${keyOf};
      return { k1, k2, ok: !!(${valid(tier)}) }; } finally { Math.random = rnd; } })()`);
  if (!res) return [`${game} palier ${tier} (${r}) : tirage impossible`];
  if (res.k1 === res.k2) return [`${game} palier ${tier} (${r}) : même question ${res.k1}`];
  return res.ok ? [] : [`${game} palier ${tier} (${r}) : repli hors du palier (${res.k2})`];
}
function fallbacks() {
  const problems = [];
  for (const c of FALLBACKS.filter((x) => EXPLAINED.includes(x[0])))
    for (let tier = 1; tier <= (MAX_TIER[c[0]] || 5); tier++)
      for (const r of [0, 0.31, 0.62, 0.999]) problems.push(...fallbackProblem(c, tier, r));
  check('8 tirages identiques : le repli donne une autre question, dans le palier', problems.length === 0);
  h.list(problems);
  check('aucun couple jeu et palier à question unique', SINGLE_QUESTION.length === 0);
  ev('closeModal()');
}

(async () => {
  await h.boot();
  section('Phrases de stratégie (ligne 15, S8)');
  strategyTable();
  await strategyWins();
  await noStrategy();
  section('Éloges du processus (ligne 16)');
  await praises();
  section('Jamais deux fois la même question : le repli (ligne 5)');
  fallbacks();
  h.finish('des stratégies');
})();
