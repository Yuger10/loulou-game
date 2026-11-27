/* ---------- Mini-jeu : Do, ré, mi (Île du Grand Concert, saison 3) ----------
   Le nom des notes et leur place sur la portée, sur le xylophone de Dorémi.
   Selon le palier (`notesRound`, js/entities/difficulty/difficulty-s3-concert.js) :
     hear   une note est jouée (un ♪ de sa couleur la montre aussi : le jeu se
            joue sans le son) : quelle lame chante pareil ?
     name   le nom de la note est écrit : quelle lame ?
     read   une note sur la portée : quelle lame porte son nom ?
     find   le nom est écrit : laquelle des 5 petites portées le montre ?
            (on touche une portée entière : deux places voisines d'une même
            portée seraient trop proches pour un doigt)
   Une question par mission. Anti-devinette : une erreur relance une AUTRE
   note, jamais la même deux fois d'affilée. */
import { notesRound } from '../../../entities/difficulty/index.js';
import { party } from '../../../entities/player/index.js';
import { pickRandom, shuffle } from '../../../shared/lib/index.js';
import { openModal, setHandler } from '../../../shared/ui/index.js';
import { gameDiff } from '../../adaptive/index.js';
import { registerHints, setHintQuestion } from '../../hints/index.js';
import {
  flashModal,
  livesBar,
  loseLife,
  registerGame,
  setSolution,
  setupLives,
  solSel,
  stepOk,
  winSoon,
} from '../../minigame-engine/index.js';
import { bindQuit, gameHeader } from '../../screen/index.js';
import { playXylo, staffSVG, XYLO_NOTES, xyloHTML } from '../../xylophone/index.js';

/** @typedef {import('../../../entities/difficulty/index.js').NotesRound} NotesRound */
/** @typedef {{ ask: NotesRound['ask'], replay: () => void }} NotesQuestion */
/** @typedef {{ cfg: NotesRound, t: number, choices: number[] }} NotesPlay une question : la cible, les petites portées */

const NOTES_HEAR_DELAY = 400; // la note est jouée un instant après l'ouverture

/** @type {Record<NotesRound['ask'], string[]>} le titre et la consigne dite ; {nom} : le nom de la note */
const NOTES_ASKS = {
  hear: ['Quelle lame chante cette note ?', 'Écoute la note de Dorémi, puis touche la lame qui chante pareil.'],
  name: ['Touche le {nom} !', 'Trouve la lame du {nom}, et touche-la !'],
  read: ['Quelle note est sur la portée ?', 'Regarde la note sur la portée, et touche la lame qui porte son nom.'],
  find: ['Où est le {nom} ?', 'Touche la portée où le {nom} est à sa place.'],
};

// La dernière note demandée : elle survit d'une ouverture du jeu à l'autre et
// au changement de palier, pour ne jamais redemander la même tout de suite.
let notesLast = -1,
  notesToken = 0;

/**
 * Les petites portées du palier 5 : la cible et d'autres notes, toutes
 * différentes, jamais les deux do ensemble (ils portent le même nom).
 * @param {number} t la cible
 * @param {number} count
 * @returns {number[]}
 */
function notesChoices(t, count) {
  const twin = t === 0 ? 7 : t === 7 ? 0 : pickRandom([0, 7]);
  const others = shuffle(XYLO_NOTES.map((x) => x.n).filter((n) => n !== t && n !== twin));
  return shuffle([t, ...others.slice(0, count - 1)]);
}

/** @param {number} dd le palier de difficulté @returns {NotesPlay} */
function notesDraw(dd) {
  const cfg = notesRound(dd);
  const t = pickRandom(cfg.targets.filter((n) => n !== notesLast));
  notesLast = t;
  return { cfg, t, choices: cfg.ask === 'find' ? notesChoices(t, cfg.choices || 5) : [] };
}

/** @param {NotesPlay} g @returns {string} ce qu'on regarde, selon la question */
function notesShown(g) {
  const { cfg, t } = g;
  const x = XYLO_NOTES[t];
  const name = `<b class="notes-name">${x.name}</b>`;
  if (cfg.ask === 'hear')
    return `<span class="notes-heard" data-n="${t}" style="color:${x.color}">♪</span>
      <button class="btn-small" id="notes-listen">🔈 Écouter</button>`;
  if (cfg.ask === 'name') return name;
  if (cfg.ask === 'read') return staffSVG([t], { lines: cfg.staff || 5, colors: !!cfg.colors, id: 'notes-staff' });
  const cases = g.choices.map(
    (k, i) =>
      `<button class="notes-find" data-n="${k}" aria-label="Portée ${i + 1}">${staffSVG([k], { lines: 5, colors: false, cls: 'notes-find-staff' })}</button>`,
  );
  return `${name}<div class="notes-find-row">${cases.join('')}</div>`;
}

/** @param {NotesPlay} g @returns {string} */
function notesMarkup(g) {
  const { cfg, t } = g;
  const [title, say] = NOTES_ASKS[cfg.ask].map((s) => s.replace('{nom}', XYLO_NOTES[t].name));
  return `
    ${gameHeader('🎹 Do, ré, mi', title, say)}
    ${livesBar()}
    <div class="notes-stage" id="notes-stage" data-ask="${cfg.ask}" data-n="${t}">
      ${notesShown(g)}
      ${cfg.lames.length ? xyloHTML({ lames: cfg.lames }) : ''}
    </div>
  `;
}

function renderNotes() {
  setupLives('notes');
  const g = notesDraw(gameDiff());
  const token = ++notesToken;
  openModal(notesMarkup(g));
  bindQuit();
  const find = g.cfg.ask === 'find';
  const answers = find ? '.notes-find' : '.xylo-lame';
  setSolution([solSel(answers, 'n', g.t)]);
  // la note cible, tant que cette question est à l'écran
  const replay = () => {
    if (token === notesToken && document.getElementById('notes-stage')) playXylo(g.t);
  };
  /** @type {NotesQuestion} */
  const q = { ask: g.cfg.ask, replay };
  setHintQuestion('notes', q, { choices: answers });
  if (g.cfg.ask === 'hear') {
    setHandler(document.getElementById('notes-listen'), 'click', replay);
    setTimeout(replay, NOTES_HEAR_DELAY);
  }
  let won = false,
    retrying = false;
  document.querySelectorAll(answers).forEach((el) =>
    setHandler(el, 'click', () => {
      const n = Number(el.dataset.n);
      if (!find) playXylo(n, el); // une lame chante toujours, même la mauvaise
      if (won || retrying) return;
      // sur les lames, on demande un nom : l'un ou l'autre do est juste (palier 4)
      const right = find ? n === g.t : XYLO_NOTES[n].name === XYLO_NOTES[g.t].name;
      if (!right) {
        // Une autre question arrive (ou l'écran « Raté ! ») : celle-ci ne se
        // juge plus, sinon toucher toutes les lames à la suite gagnerait à
        // tous les coups. À plusieurs, la question reste pour le joueur suivant.
        retrying = !party.active;
        loseLife(el, { onRetry: renderNotes, disable: false });
        return;
      }
      won = true;
      stepOk(el);
      flashModal('ok');
      winSoon();
    }),
  );
}

// Indices (v52) : 1. la méthode (grave et aigu, l'ordre des notes, la hauteur
// sur la portée) ; 2. le début du raisonnement. Jamais la lame, rien d'écarté.
const NOTES_HIGH =
  "Plus une note est haute sur la portée, plus elle chante aigu. Le do du bas a un petit trait rien qu'à lui.";
/** @param {NotesQuestion} q */
function notesHints(q) {
  if (q.ask === 'hear')
    return [
      {
        say: 'Écoute bien. Les grandes lames chantent grave, les petites lames chantent aigu.',
        fx: { glow: '.xylo' },
      },
      {
        say: 'Écoute encore la note, puis touche les lames une par une pour trouver celle qui chante pareil.',
        fx: {
          glow: '#notes-listen',
          run() {
            q.replay();
          },
        },
      },
    ];
  if (q.ask === 'name')
    return [
      {
        say: 'Les notes se suivent toujours dans le même ordre, de la plus grande lame à la plus petite.',
        fx: { glow: '.xylo' },
      },
      {
        say: "Pars du do, la plus grande lame, et avance en chantant les notes jusqu'à la tienne.",
        fx: { glow: '.xylo' },
      },
    ];
  const glow = q.ask === 'read' ? '#notes-staff' : '#notes-stage';
  const second =
    q.ask === 'read'
      ? "Pars du do du bas. Monte d'une marche à chaque ligne et à chaque espace, en disant les notes."
      : 'Pars du do du bas et monte marche par marche, en disant les notes. Puis cherche la note qui est à cette hauteur.';
  return [
    { say: NOTES_HIGH, fx: { glow } },
    { say: second, fx: { glow } },
  ];
}

registerGame('notes', renderNotes);
registerHints('notes', notesHints);
