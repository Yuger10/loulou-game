// @shards 8
// Les erreurs expliquées (track erreurs-expliquees), le parcours : une erreur à
// chaque palier de chaque jeu expliqué, le dernier essai, et le puzzle (la
// question continue). Le garde et les tables sont dans test/explications.test.js.
// Harnais et parcours d'une partie : test/explications/.
const { inShard, shard } = require('./tools/shard.js');
const h = require('./explications/harnais.js');
const { tierPairs } = require('./explications/listes.js');
const { GAMES, puzzleNext, errorRound } = require('./explications/parcours.js');
const { d, ev, check, section, startGame, waitFor, glows } = h;

async function everyTier() {
  const problems = [];
  let rounds = 0;
  for (const { key, tier } of inShard(tierPairs()))
    for (let r = 0; r < 3; r++) {
      rounds++;
      problems.push(...(await errorRound(key, tier)));
    }
  check(
    `bulle, voix, verrou, bonne réponse montrée, relance à 4 s, autre question, jeu gagnable (${rounds} parties)`,
    problems.length === 0,
  );
  h.list(problems, 15);
}
async function lastTry() {
  startGame('count', 5);
  check('count au palier 5 : un seul essai', ev('lives') === 1);
  const out = await errorRound('count', 5);
  check('une erreur : explication, puis « Raté ! » après EXPLAIN_MS, mission relancée gagnable', out.length === 0);
  h.list(out, out.length);
}
// puzzle : une erreur au rang idx, puis la bonne réponse ; les problèmes du rang
async function puzzleRank(idx) {
  const body = d.getElementById('modal-body'),
    out = [];
  const next = puzzleNext(),
    btn = GAMES.puzzle.wrong();
  const exp = ev(`explainFor("puzzle", hint.q, ${btn.dataset.n})`);
  btn.click();
  const text = (d.querySelector('.explain-text') || {}).textContent;
  if (!exp || text !== exp.say) out.push(`rang ${idx} : pas la bonne explication`);
  else if (new RegExp(`(^|[^0-9])${next.dataset.n}([^0-9]|$)`).test(text))
    out.push(`rang ${idx} : « ${text} » donne la réponse (${next.dataset.n})`);
  if (glows(next)) out.push(`rang ${idx} : la bonne réponse brille`);
  if (![...body.querySelectorAll('.puzzle-btn')].every((b) => b.disabled))
    out.push(`rang ${idx} : des boutons restent actifs`);
  await waitFor(() => !d.querySelector('.explain-bubble'));
  if (body.classList.contains('explaining') || next.disabled || btn.disabled)
    out.push(`rang ${idx} : le verrou n'est pas levé après l'explication`);
  next.click();
  if (ev('hint.q.idx') !== idx + 1) out.push(`rang ${idx} : la bonne réponse n'avance plus`);
  return out;
}
async function puzzle() {
  startGame('puzzle', 1);
  const len = ev('hint.q.seq.length'),
    problems = [];
  for (let idx = 0; idx < len - 1; idx++) problems.push(...(await puzzleRank(idx)));
  check(`puzzle : ${len - 1} rangs, la réponse n'est jamais dite ni montrée, le verrou se lève`, problems.length === 0);
  h.list(problems, problems.length);
  startGame('puzzle', 5);
  check('puzzle au palier 5 : un seul essai', ev('lives') === 1);
  const out = await errorRound('puzzle', 5);
  check('puzzle, dernier essai : explication, puis « Raté ! » après EXPLAIN_MS', out.length === 0);
  h.list(out, out.length);
}

(async () => {
  await h.boot();
  section('Une erreur à chaque palier (ligne 18, S2, S4)');
  await everyTier();
  section('Dernier essai : « Raté ! » attend la fin (ligne 8, S4)');
  await lastTry();
  if (shard.k === 0) {
    section('Puzzle : une erreur à chaque rang, jamais la réponse (ligne 7, S3)');
    await puzzle();
  }
  h.finish('du parcours des explications');
})();
