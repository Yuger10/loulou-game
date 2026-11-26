// Les erreurs expliquées (track erreurs-expliquees) : après une erreur, une
// phrase dite et un geste sur l'écran pendant 4 secondes, puis une autre
// question. Ici : le garde des jeux exemptés, la table de chaque jeu, et les
// cas où l'explication ne vient pas ou s'arrête. Le parcours par palier est
// dans test/explications-parcours.test.js, les phrases de stratégie et le repli
// dans test/explications-strategies.test.js. Harnais, listes et tables :
// test/explications/.
const h = require('./explications/harnais.js');
const L = require('./explications/listes.js');
const { ROWS_PHASE1 } = require('./explications/tables-phase1.js');
const { ROWS_PHASE2 } = require('./explications/tables-phase2.js');
const { same, sayProblem } = require('./explications/phrases.js');
const { d, ev, check, section, startGame, otherChoice, waitFor, EXPLAIN_MS } = h;

const ROWS = [...ROWS_PHASE1, ...ROWS_PHASE2];
const explaining = () => d.getElementById('modal-body').classList.contains('explaining');
const teamShown = () => d.getElementById('team-say').classList.contains('show');

/* ---------- Le garde (ligne 17 de la spec) ---------- */
// Le garde, pur : la liste des erreurs (vide si tout va bien).
// lists : { games, explained, exempt, never, legacy, max }
function explainGuard(lists) {
  const { games, explained, exempt, never, legacy, max } = lists;
  const errors = [];
  for (const g of games)
    if (!explained.includes(g) && !exempt.includes(g) && !never.includes(g))
      errors.push(`${g} : ni explication, ni exemption`);
  for (const g of exempt) {
    if (explained.includes(g)) errors.push(`${g} : exempté alors qu'il a des explications`);
    if (!legacy.includes(g)) errors.push(`${g} : exempté alors que c'est un nouveau jeu`);
  }
  if (exempt.length > max) errors.push(`EXPLAIN_EXEMPT : ${exempt.length} jeux, le maximum est ${max}`);
  return errors;
}
// des listes vides : chaque cas construit en mémoire ne nomme que ce qu'il change
const NONE = { games: [], explained: [], exempt: [], never: [], legacy: [], max: 0 };

function guardReal() {
  const games = ev('GAME_TYPES');
  const explained = games.filter((g) => ev(`hasExplain(${JSON.stringify(g)})`));
  const real = explainGuard({
    games,
    explained,
    exempt: L.EXPLAIN_EXEMPT,
    never: L.EXPLAIN_NEVER,
    legacy: L.LEGACY_GAMES,
    max: L.EXPLAIN_EXEMPT_MAX,
  });
  check('chaque jeu a ses explications, ou une exemption permise', real.length === 0, real.join(' ; '));
  check(
    `les jeux de la track ont leurs explications (${L.EXPLAINED.length})`,
    L.EXPLAINED.every((g) => explained.includes(g)),
    L.EXPLAINED.filter((g) => !explained.includes(g)).join(', '),
  );
}
function guardCases() {
  const names = (list, g) => list.length === 1 && list[0].includes(g);
  check(
    'un jeu sans explication ni exemption est refusé, par son nom',
    names(explainGuard({ ...NONE, games: ['a', 'b'], explained: ['a'] }), 'b'),
  );
  check(
    'un exempté qui a des explications est refusé, par son nom',
    names(explainGuard({ ...NONE, games: ['a'], explained: ['a'], exempt: ['a'], legacy: ['a'], max: 1 }), 'a'),
  );
  check(
    'un nouveau jeu exempté est refusé, par son nom',
    names(explainGuard({ ...NONE, games: ['a', 'z'], explained: ['a'], exempt: ['z'], max: 1 }), 'z'),
  );
  check(
    'une liste plus longue que le maximum est refusée',
    names(
      explainGuard({ ...NONE, games: ['a', 'b'], exempt: ['a', 'b'], legacy: ['a', 'b'], max: 1 }),
      'maximum est 1',
    ),
  );
  check(
    'un jeu exempté pour toujours passe',
    explainGuard({ ...NONE, games: ['memory'], never: ['memory'], legacy: L.LEGACY_GAMES }).length === 0,
  );
  check('EXPLAIN_MS vaut 4000', EXPLAIN_MS() === 4000);
}

/* ---------- Les tables (ligne 14) ---------- */
// les problèmes d'une ligne de table : say exact, fx conforme
function rowProblems([game, q, v, say, fx, run]) {
  const got = ev(`explainFor(${JSON.stringify(game)}, ${JSON.stringify(q)}, ${v})`);
  const where = `${game} ${JSON.stringify(q)} / ${v}`;
  if (!got) return [`${where} : pas d'explication`];
  const out = [];
  if (got.say !== say) out.push(`${where} : « ${got.say} » au lieu de « ${say} »`);
  const { run: gotRun, ...rest } = got.fx;
  if (!same(rest, fx)) out.push(`${where} : fx ${JSON.stringify(rest)} au lieu de ${JSON.stringify(fx)}`);
  if (!!run !== (typeof gotRun === 'function')) out.push(`${where} : fx.run ${run ? 'absent' : 'en trop'}`);
  if (sayProblem(got.say)) out.push(`${where} : ${sayProblem(got.say)}`);
  return out;
}
function tables() {
  const rows = ROWS.filter((r) => L.EXPLAINED.includes(r[0]));
  const problems = rows.flatMap(rowProblems);
  check(`chaque ligne des tables : say exact, fx conforme (${rows.length} lignes)`, problems.length === 0);
  h.list(problems);
  check('un jeu sans explication : explainFor renvoie null', ev('explainFor("reading", {}, 1)') === null);
}

/* ---------- Les cas sans explication, ou interrompus ---------- */
async function exempted() {
  startGame('reading', 1);
  ev('window.__q0 = hint.q; window.__rnd = Math.random; Math.random = () => 0');
  let markT = h.timeouts.length;
  const markS = h.spoken.length;
  otherChoice(ev('hint.choices')).click();
  ev('Math.random = window.__rnd');
  check('reading : aucune bulle d’explication', !d.querySelector('.explain-bubble'));
  check(
    'reading : la phrase générique est dite',
    h.spoken.slice(markS).some((s) => h.WRONG_HINTS().includes(s)),
  );
  const asked = h.timeouts.slice(markT);
  check('reading : relance à 900 ms', asked.includes(900) && !asked.includes(EXPLAIN_MS()));
  check('reading : la fenêtre reste jouable (pas de verrou)', !explaining());
  check('reading : une autre question suit', await waitFor(() => ev('hint.q !== window.__q0')));
  startGame('diff', 5);
  check('diff au palier 5 : un seul essai', ev('lives') === 1);
  markT = h.timeouts.length;
  otherChoice(ev('hint.choices')).click();
  const after = h.timeouts.slice(markT);
  check('diff : « Raté ! » à 520 ms', after.includes(520) && !after.includes(EXPLAIN_MS()));
  check('diff : l’écran « Raté ! » arrive', await waitFor(() => h.shown('.fail-box')));
}
function partyAndTimeout() {
  startGame('count', 1);
  ev('party.active = true');
  otherChoice('.num-btn').click();
  check('à plusieurs : aucune explication', !d.querySelector('.explain-bubble'));
  ev('party.active = false');
  startGame('count', 2);
  ev('loseLife(null)');
  check('temps écoulé : aucune explication', !d.querySelector('.explain-bubble') && ev('lives') === 2);
  ev('loseLife(null, { wrong: 1 })');
  check('sans bouton touché : aucune explication, même avec une réponse', !d.querySelector('.explain-bubble'));
}
async function teamQuiet() {
  startGame('count', 1);
  ev(`window.__ex = []; window.__on = hintPolicy.onExplain;
      hintPolicy.onExplain = (k) => { window.__ex.push(k); if (window.__on) window.__on(k); };
      teamSay(currentCompanion(), 'Coucou !'); teamSay(currentCompanion(), 'Encore moi !')`);
  check('avant : une bulle de l’équipe est affichée', teamShown());
  otherChoice('.num-btn').click();
  check('hintPolicy.onExplain reçoit le jeu', JSON.stringify(ev('window.__ex')) === '["count"]');
  check(
    "la file de l'équipe est vidée, sa bulle retirée",
    ev('teamSayQueue.length === 0 && teamSaying === null') && !teamShown(),
  );
  const said = ev('explainFor("count", window.__q0 = hint.q, 0)');
  check('une seule phrase : la dernière dite est l’explication', !!said && /Il y en a/.test(h.lastSaid()));
  await waitFor(() => ev('hint.q !== window.__q0'));
  check("l'équipe ne reparle pas après l'explication", !teamShown());
  ev('hintPolicy.onExplain = window.__on');
}
async function windowCloses() {
  startGame('count', 1);
  otherChoice('.num-btn').click();
  check('explication en cours', explaining());
  ev('closeModal()');
  check('fermeture : la classe explaining est retirée', !explaining());
  await h.wait(EXPLAIN_MS() * h.SPEED + 80);
  check('fermeture : la relance est annulée', !d.getElementById('overlay').classList.contains('show'));

  startGame('count', 5);
  otherChoice('.num-btn').click();
  ev('openModal("<p id=\\"autre\\">autre écran</p>")');
  check('autre fenêtre : la classe explaining est retirée', !explaining());
  await h.wait(EXPLAIN_MS() * h.SPEED + 80);
  check('autre fenêtre : « Raté ! » est annulé', !!d.getElementById('autre') && !d.querySelector('.fail-box'));
  ev('closeModal()');
}

(async () => {
  await h.boot();
  section('Garde des jeux exemptés (ligne 17, S7)');
  guardReal();
  guardCases();
  section('Tables des explications (ligne 14, S1)');
  tables();
  section('Jeu exempté : comme avant (ligne 9, S6)');
  await exempted();
  section('À plusieurs, temps écoulé (lignes 10 et 11, S5)');
  partyAndTimeout();
  section("L'équipe se tait (ligne 12)");
  await teamQuiet();
  section('La fenêtre se ferme ou change (ligne 13)');
  await windowCloses();
  h.finish('des explications');
})();
