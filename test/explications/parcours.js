// Le parcours d'une erreur (ligne 18 de la spec erreurs-expliquees) : ce que les
// suites savent de chaque jeu, et une partie jouée avec une erreur (lignes 1 à 8).
const h = require('./harnais.js');
const { SINGLE_QUESTION } = require('./listes.js');
const { sayProblem } = require('./phrases.js');
const { d, ev, glows, solEl, otherChoice, waitFor, EXPLAIN_MS, explainReal } = h;

const filled = (sel, text) => {
  const el = d.querySelector(sel);
  return !!el && el.textContent === String(text) && el.classList.contains('explain-fill');
};
// puzzle : le bouton du prochain nombre attendu
const puzzleNext = () => d.querySelector(ev('gameSolution')[ev('hint.q.idx')]);
// share : le seul bouton qui porte la bonne réponse, selon la question
const shareSel = (q) => {
  if (q.ask === 'fair') return '.share-opt[data-equal="1"]';
  return q.ask === 'show' ? `.share-opt[data-equal="1"][data-n="${q.n}"]` : `.share-opt[data-k="${q.n}"]`;
};
/* wrong : le bouton faux à toucher ; v : la mauvaise réponse passée au jeu (source JS) ;
   key : la clé de la question (ce qui fixe la réponse) ; shows : la bonne réponse de la
   question ratée est montrée comme la table « Où est la bonne réponse » l'exige */
const GAMES = {
  count: {
    wrong: () => otherChoice('.num-btn'),
    v: (b) => b.dataset.v,
    key: () => ev('String(hint.q.n)'),
    shows: (q) => glows(solEl()) && d.querySelectorAll('.count-row .explain-mark').length === q.n,
  },
  compare: {
    wrong: () => otherChoice('.cmp-btn'),
    v: (b) => JSON.stringify(b.dataset.v),
    key: () => ev('hint.q.a + "-" + hint.q.b'),
    shows: (q) => glows(solEl()) && filled('.cmp-q', q.answer),
  },
  math: {
    wrong: () => otherChoice('.num-btn'),
    v: (b) => b.dataset.v,
    key: () => ev('hint.q.a + " " + hint.q.op + " " + hint.q.b'),
    shows: (q) => glows(solEl()) && filled('.eq-q', q.result),
  },
  calc: {
    wrong: () => otherChoice('.num-btn'),
    v: (b) => b.dataset.v,
    key: () => ev('hint.q.text'),
    shows: (q) => glows(solEl()) && filled('.eq-q', q.result),
  },
  clock: {
    wrong: () => otherChoice('.clock-opt-btn'),
    v: (b) => JSON.stringify(b.dataset.v),
    key: () => ev('hint.q.hour + "-" + hint.q.minute'),
    shows: () => glows(solEl()) && !!d.querySelector('.clock-face .clock-nums'),
  },
  // la question continue : pas de clé, pas de bonne réponse montrée (ligne 7)
  puzzle: {
    continued: true,
    wrong: () => [...d.querySelectorAll('.puzzle-btn:not(.done)')].find((b) => b !== puzzleNext()),
    v: (b) => b.dataset.n,
  },
  money: {
    wrong: () => otherChoice('.money-pile-btn'),
    v: (b) => b.dataset.v,
    key: () => ev('String(hint.q.target)'),
    shows: (q) =>
      glows(solEl()) && new RegExp(`= ${q.target}$`).test((solEl().querySelector('.explain-mark') || {}).textContent),
  },
  packs: {
    wrong: () => otherChoice('.pack-opt'),
    v: (b) => b.dataset.v,
    key: () => ev('hint.q.size + "-" + hint.q.n + "-" + hint.q.extra'),
    shows: () => glows(solEl()),
  },
  share: {
    wrong: () => otherChoice('.share-opt'),
    v: (b) => `({ equal: ${b.dataset.equal === '1'}, n: ${Number(b.dataset.n)}, k: ${JSON.stringify(b.dataset.k)} })`,
    key: () => ev('shareLast'),
    shows: (q) => {
      const els = [...d.querySelectorAll(shareSel(q))];
      return els.length === 1 && els[0] === solEl() && glows(els[0]);
    },
  },
  ladybugs: {
    wrong: () => (ev('hint.q.mode') === 'complete' ? d.getElementById('lb-done') : otherChoice('.lb-opt')),
    v: (b) => (b.id === 'lb-done' ? '0' : b.dataset.v),
    key: () => ev('hint.q.mode + hint.q.n'),
    shows: (q) =>
      q.mode === 'complete'
        ? glows(d.getElementById('lb-stage')) && d.querySelectorAll('#lb-right .lb-dot').length === q.n
        : glows(solEl()),
  },
};

const body = () => d.getElementById('modal-body');
const text = (el) => (el || {}).textContent;

// lignes 1 et 2 : la bulle, la phrase exacte, dite telle quelle, et rien d'autre
function checkBubble(r, bub) {
  const { exp, bad } = r;
  if (bub.getAttribute('role') !== 'status' || !bub.querySelector('.hint-bface svg')) bad('bulle mal formée');
  const anchor =
    d.querySelector('#modal-body #challenge-timer') ||
    d.querySelector('#modal-body .puzzle-hint') ||
    d.querySelector('#modal-body .game-head');
  if (bub.previousElementSibling !== anchor) bad("la bulle n'est pas sous la consigne");
  if (text(bub.querySelector('.explain-text')) !== exp.say) bad('le texte de la bulle diffère de say');
  if (h.lastSaid() !== h.toSpoken(exp.say)) bad(`la voix dit « ${h.lastSaid()} » au lieu de say`);
  if (h.spoken.slice(r.markS).some((s) => h.WRONG_HINTS().includes(s))) bad('une phrase générique a été dite');
  if (sayProblem(exp.say)) bad(`say : ${sayProblem(exp.say)} (« ${exp.say} »)`);
  if ('dim' in exp.fx) bad('fx.dim est interdit');
  if (exp.fx.html && (bub.querySelector('.hint-extra') || {}).innerHTML !== exp.fx.html) bad('fx.html absent');
  if (d.querySelector('#modal-body .hint-bubble')) bad("une bulle d'indice reste affichée");
}
// ligne 3 : le verrou
function checkLock(r) {
  if (!body().classList.contains('explaining')) r.bad('pas de classe explaining');
  const open = [...body().querySelectorAll('button')].filter((b) => !b.disabled && !b.classList.contains('btn-speak'));
  if (open.length) r.bad(`${open.length} bouton(s) encore actif(s) pendant l'explication`);
  const speak = body().querySelector('.btn-speak');
  if (speak && speak.disabled) r.bad('le bouton 🔈 est désactivé');
}
// ligne 8 : le dernier essai est perdu, « Raté ! » attend la fin de l'explication
async function failAfterExplain(r) {
  const { where, asked } = r,
    out = [];
  if (!asked.includes(EXPLAIN_MS()) || asked.includes(520)) out.push(`${where} : « Raté ! » programmé à 520 ms`);
  if (!(await waitFor(() => h.shown('.fail-box')))) return [`${where} : pas d'écran « Raté ! »`];
  if (r.since() < explainReal()) out.push(`${where} : « Raté ! » trop tôt (${r.since()} ms)`);
  h.startGame(r.key, r.tier);
  if (!(await h.winNow())) out.push(`${where} : la mission relancée ne se gagne pas`);
  return out;
}
/* ligne 7 : la question continue, la réponse n'est jamais donnée.
   Renvoie les derniers problèmes si la partie s'arrête là, sinon null. */
async function afterContinued(r) {
  const { exp, bad, asked } = r;
  const next = ev('hint.q.seq[hint.q.idx]');
  if (new RegExp(`(^|[^0-9])${next}([^0-9]|$)`).test(exp.say)) bad(`say donne la réponse (${next})`);
  if (glows(d.querySelector(r.sol0[ev('hint.q.idx')]))) bad('la bonne réponse brille');
  if (!asked.includes(EXPLAIN_MS()) || asked.includes(700)) bad('le verrou ne dure pas EXPLAIN_MS');
  if (r.lastTry) return failAfterExplain(r);
  await waitFor(() => !d.querySelector('.explain-bubble'));
  if (r.since() < explainReal()) bad(`l'explication s'efface trop tôt (${r.since()} ms)`);
  if (d.querySelector('.explain-bubble, .explain-mark') || body().classList.contains('explaining'))
    bad("l'explication ne s'efface pas");
  if ([...body().querySelectorAll('.puzzle-btn:not(.done)')].some((b) => b.disabled))
    bad('les boutons ne se réactivent pas');
  if (ev('state.missions') !== r.missions) bad("la bonne réponse touchée pendant l'explication a compté");
  return null;
}
/* lignes 4 à 6 : la bonne réponse est montrée, puis une AUTRE question arrive.
   Renvoie les derniers problèmes si la partie s'arrête là, sinon null. */
async function afterNext(r) {
  const { cfg, bad, asked, where } = r;
  // ligne 6 : la bonne réponse de la question ratée est montrée
  if (!cfg.shows(r.q)) bad("la bonne réponse de la question ratée n'est pas montrée");
  if (r.lastTry) return failAfterExplain(r);
  // ligne 4 : la question suivante arrive après EXPLAIN_MS, et non 900 ms
  if (!asked.includes(EXPLAIN_MS()) || asked.includes(900)) bad('la relance est programmée à 900 ms');
  if (!(await waitFor(() => ev('hint.q !== window.__q0')))) return [`${where} : pas de question suivante`];
  if (r.since() < explainReal()) bad(`question suivante trop tôt (${r.since()} ms)`);
  if (h.shown('.win-box') || ev('state.missions') !== r.missions) bad("gagné en touchant pendant l'explication");
  if (d.querySelector('.explain-bubble') || body().classList.contains('explaining'))
    bad("l'explication reste sur la question suivante");
  // ligne 5 : jamais la même question
  if (!SINGLE_QUESTION.includes(`${r.key}-${r.tier}`) && cfg.key() === r.key0)
    bad(`la même question revient (${r.key0}) : l'explication donnerait la réponse`);
  return null;
}
// la partie lancée et sa mauvaise réponse touchée : ce qu'il faut pour vérifier la suite
function startRound(key, tier) {
  const cfg = GAMES[key],
    where = `${key} palier ${tier}`,
    out = [];
  h.startGame(key, tier);
  const btn = cfg.wrong();
  if (!btn) return { stop: [`${where} : aucune mauvaise réponse à toucher`] };
  const exp = ev(`explainFor(${JSON.stringify(key)}, hint.q, ${cfg.v(btn)})`);
  if (!exp) return { stop: [`${where} : pas d'explication pour ${cfg.v(btn)}`] };
  const r = { key, tier, cfg, where, out, exp, bad: (msg) => out.push(`${where} : ${msg}`) };
  r.q = ev('JSON.parse(JSON.stringify(hint.q))');
  r.key0 = cfg.key ? cfg.key() : '';
  r.sol0 = ev('gameSolution').slice();
  r.lastTry = ev('lives') === 1;
  r.missions = ev('state.missions');
  ev('window.__q0 = hint.q');
  r.markT = h.timeouts.length;
  r.markS = h.spoken.length;
  const t0 = Date.now();
  btn.click();
  r.since = () => Date.now() - t0;
  return r;
}
/* Une partie : une erreur, puis tout ce que les lignes 1 à 8 exigent.
   Renvoie la liste des problèmes (vide si tout va bien). */
async function errorRound(key, tier) {
  const r = startRound(key, tier);
  if (r.stop) return r.stop;
  const bub = d.querySelector('#modal-body .explain-bubble');
  if (!bub) return [`${r.where} : pas de bulle .explain-bubble`];
  checkBubble(r, bub);
  checkLock(r);
  // la bonne réponse, touchée pendant l'explication
  for (const x of r.sol0) if (d.querySelector(x)) d.querySelector(x).click();
  r.asked = h.timeouts.slice(r.markT);
  const last = await (r.cfg.continued ? afterContinued(r) : afterNext(r));
  if (last) return r.out.concat(last);
  if (!(await h.winNow())) r.bad("plus gagnable après l'explication");
  return r.out;
}

module.exports = { GAMES, puzzleNext, errorRound };
