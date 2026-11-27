/* ---------- L'équipe des compagnons (v52) ----------
   Dès le départ, le compagnon choisi est le compagnon PRINCIPAL : il donne
   les indices 💡 (js/features/hints/hints.js).
   Au niveau 10, l'équipe s'ouvre :
   - un écran « Ton équipe s'agrandit ! », une seule fois (une partie déjà au
     niveau 10 ou plus le voit au chargement) ;
   - les autres compagnons se RENCONTRENT en voyageant, chacun sur une île
     (TEAM_ROLES[id].home), une seule fois : au premier passage sur l'île, ou
     à la prochaine visite si l'île est déjà connue. « Plus tard » la repropose
     à la visite suivante. Le principal n'a pas de rencontre : il est déjà là ;
   - l'enfant garde 2 équipiers actifs en plus du principal (« Mon équipe »,
     en touchant les compagnons de l'en-tête) ; il peut aussi changer de
     principal parmi ceux qu'il a rencontrés ;
   - les équipiers se voient en petit à côté du principal : en-tête, île,
     bateau de la carte (3 têtes au maximum).
   Chaque compagnon a une spécialité (js/features/companion-team/specialties.js).
   Données (par profil) : state.team = { open, met:[…], mates:[…], day } ;
   le principal est profile.companion. */
import { COMPANIONS, companionSVG, currentCompanion } from '../../entities/companion/index.js';
import { level, save, state } from '../../entities/game-state/index.js';
import {
  currentProfile,
  onProfileRefresh,
  party,
  race,
  refreshAll,
  saveProfiles,
} from '../../entities/player/index.js';
import { currentWorld, WORLDS } from '../../entities/world/index.js';
import { on } from '../../shared/lib/index.js';
import {
  bindSpeakButtons,
  closeModal,
  confetti,
  openModal,
  playSound,
  setHandler,
  showToast,
  speak,
  speechBubble,
} from '../../shared/ui/index.js';
import { bindQuit, gameHeader } from '../screen/index.js';

const TEAM_LEVEL = 10;
const TEAM_MATES_MAX = 2;

/**
 * La place d'un compagnon dans l'équipe (détail des champs juste en dessous) ;
 * `after` = le champ de la partie qui le fait rejoindre l'équipe sans rencontre.
 * @typedef {{ home: string, role: string, icon: string, say: string[], demo: string, after?: string }} TeamRole
 */
// home : l'île de la rencontre ; role : la spécialité ; say : 2 phrases de présentation ;
// demo : une petite démonstration en image. Lili (Monde des Boîtes) et
// Grisou (fin de la saison 2) ne se rencontrent qu'une fois leur île livrée.
/** @type {Record<string, TeamRole>} */
const TEAM_ROLES = {
  perle: {
    home: 'lagon',
    role: 'Conteuse',
    icon: '📖',
    say: [
      "Coucou, je suis Perle la sirène ! J'adore raconter des histoires.",
      'Je te relis les phrases tout doucement, et je découpe les mots en syllabes.',
    ],
    demo: '<span class="tm-chip">🔁 Relire</span><span class="tm-chip">ba · teau</span>',
  },
  leo: {
    home: 'chateau',
    role: 'Tuteur',
    icon: '📈',
    say: [
      'Bonjour, je suis Léo le chevalier !',
      "Je suis ton tuteur : on s'entraîne ensemble à ce qui est encore difficile.",
    ],
    demo: '<span class="tm-chip">🕐 On s\'entraîne ?</span><span class="tm-chip">📈 Bravo !</span>',
  },
  sam: {
    home: 'jungle',
    role: 'Guide',
    icon: '🧭',
    say: [
      "Salut, moi c'est Sam l'explorateur !",
      'Je suis ton guide : ma flèche te montre la prochaine chose à faire.',
    ],
    demo: '<span class="tm-chip">🧭 ➜ 📜</span><span class="tm-chip">🧭 ➜ 🏝️</span>',
  },
  zap: {
    home: 'cite',
    role: 'Défis',
    icon: '⚡',
    say: [
      'Zap le super-héros, à ton service !',
      'Une fois par jour sur chaque île, je te propose un défi bonus, avec une récompense doublée.',
    ],
    demo: '<span class="tm-chip">⚡ Défi bonus</span><span class="tm-chip">🎁 × 2</span>',
  },
  tom: {
    home: 'volcan',
    role: 'Trésors',
    icon: '🗝️',
    say: ['Ohé ! Je suis Tom le pirate !', 'Une fois par jour, après une mission réussie, je te rapporte un trésor.'],
    demo: '<span class="tm-chip">🏴‍☠️ ➜ 🪙🪙🪙</span><span class="tm-chip">🎁</span>',
  },
  rose: {
    home: 'squishy',
    role: 'Collection',
    icon: '👑',
    say: [
      'Bonjour, je suis Rose la princesse !',
      "J'adore les collections : je te dis ce qui te manque, et où le trouver.",
    ],
    demo: '<span class="tm-chip">📖 ✅✅✅❓</span><span class="tm-chip">🪶 ➜ 🌲</span>',
  },
  lili: {
    home: 'boites',
    role: 'Indices magiques',
    icon: '✨',
    say: ['Bonjour, je suis Lili la fée !', 'Mes indices sont magiques : ils arrivent plus vite, avec des paillettes.'],
    demo: '<span class="tm-chip">💡✨</span><span class="tm-chip">🔎 Énigmes</span>',
  },
  // Grisou ne se rencontre pas en visitant l'île : il rejoint l'équipe au grand
  // final de la saison 2 (événement « season2:done », js/features/story/finale.js)
  grisou: {
    home: 'licornes',
    role: 'Câlins',
    icon: '☁️',
    after: 'season2Done',
    say: [
      'Coucou, je suis Grisou, un petit nuage tout doux.',
      "Quand c'est difficile, je te fais un câlin, et je te dis quand il est l'heure de la pause.",
    ],
    demo: '<span class="tm-chip">☁️ 🤗</span><span class="tm-chip">😴</span>',
  },
};
const TEAM_ORDER = ['perle', 'rose', 'lili', 'tom', 'leo', 'sam', 'zap', 'grisou'];

/* ---- l'état ---- */
function teamState() {
  const t = state.team || (state.team = { open: false, met: [], mates: [], day: null });
  if (!Array.isArray(t.met)) t.met = [];
  if (!Array.isArray(t.mates)) t.mates = [];
  return t;
}
function teamPrincipal() {
  return currentCompanion();
}
function teamIsOpen() {
  return !!teamState().open;
}
// les compagnons qui existent dans le jeu (Grisou arrive avec la track Licornes)
function teamKnownIds() {
  return TEAM_ORDER.filter((id) => COMPANIONS[id] && TEAM_ROLES[id]);
}
/** @param {string} id */
function teamHasMet(id) {
  return id === teamPrincipal() || teamState().met.includes(id);
}
function teamMates() {
  const p = teamPrincipal();
  return teamState()
    .mates.filter((id) => id !== p && COMPANIONS[id])
    .slice(0, TEAM_MATES_MAX);
}
// l'île où l'on rencontre ce compagnon, si elle existe déjà dans le jeu
/** @param {string} id @returns {string | null} */
function teamHomeOf(id) {
  const r = TEAM_ROLES[id];
  return r && WORLDS[r.home] ? r.home : null;
}
// un compagnon à rencontrer sur cette île (jamais le principal, ni un déjà rencontré)
/** @param {string} world */
function teamEncounterOn(world) {
  if (!teamIsOpen()) return null;
  return teamKnownIds().find((id) => teamHomeOf(id) === world && !teamHasMet(id) && !TEAM_ROLES[id].after) || null;
}
// le grand final de la saison 2 : Grisou devient l'ami de tous, et rejoint l'équipe
on('season2:done', () => {
  const t = teamState();
  if (!t.met.includes('grisou')) t.met.push('grisou');
  save();
  renderTeamHeads();
});

/* ---- les petites têtes : principal + équipiers (3 au maximum) ---- */
function teamHeadsHTML() {
  const ids = [teamPrincipal(), ...(teamIsOpen() ? teamMates() : [])].slice(0, 1 + TEAM_MATES_MAX);
  return `<span class="team-heads" data-n="${ids.length}">${ids
    .map(
      (id, i) =>
        `<span class="th-head ${i ? 'mate' : 'main'}" data-team-head="${id}">${companionSVG(id, 'happy')}</span>`,
    )
    .join('')}</span>`;
}
// [data-team-slot] : un bouton qui ouvre « Mon équipe » ; [data-team-heads] : un simple affichage
function renderTeamHeads() {
  const label =
    teamIsOpen() && teamMates().length ? 'Mon équipe' : `Mon compagnon, ${COMPANIONS[teamPrincipal()].name}`;
  document.querySelectorAll('[data-team-slot], [data-team-heads]').forEach((el) => {
    el.innerHTML = teamHeadsHTML();
    if (el.hasAttribute('data-team-slot')) el.setAttribute('aria-label', label);
  });
}
if (typeof document !== 'undefined')
  document.addEventListener('click', (e) => {
    const b = e.target && /** @type {HTMLElement} */ (e.target).closest('[data-team-slot]');
    if (!b) return;
    playSound('tap');
    openTeamWindow();
  });

/* ---- l'ouverture de l'équipe (niveau 10) ---- */
function teamDue() {
  return level() >= TEAM_LEVEL && !teamIsOpen();
}
/** @param {() => void} [onDone] appelée une fois l'écran fermé */
function maybeTeamOpening(onDone) {
  if (party.active || !teamDue()) return false;
  openTeamOpening(onDone);
  return true;
}
/** @param {() => void} [onDone] */
function openTeamOpening(onDone) {
  const p = teamPrincipal(),
    c = COMPANIONS[p];
  const others = teamKnownIds().filter((id) => id !== p);
  const msg = `Bravo, tu es au niveau ${level()} ! Des amis t'attendent sur les îles : chacun a un talent pour t'aider. Pars les rencontrer !`;
  openModal(`
    <div class="reward-box team-open">
      <span class="win-rays" aria-hidden="true"></span>
      <span class="buddy-slot buddy-big win-emoji" aria-hidden="true">${companionSVG(p, 'cheer')}</span>
      <h2>Ton équipe s'agrandit !</h2>
      ${speechBubble(`${c.name} : ${msg}`)}
      <div class="team-wait">${others
        .map((id) => {
          const home = teamHomeOf(id);
          return `<span class="tw-one"><span class="tw-face">${companionSVG(id, 'happy')}</span><i>${home ? WORLDS[home].emoji : '✨'}</i></span>`;
        })
        .join('')}</div>
    </div>
    <button class="btn-primary" id="team-open-ok">En route ! 🗺️</button>
  `);
  bindSpeakButtons();
  playSound('win');
  confetti();
  speak(`${c.name} : Ton équipe s'agrandit ! ${msg}`);
  teamState().open = true;
  save();
  renderTeamHeads();
  setHandler(document.getElementById('team-open-ok'), 'click', () => {
    playSound('tap');
    closeModal();
    if (onDone) onDone();
  });
}

/* ---- les rencontres sur les îles ---- */
// une « visite » = arriver sur une île (voyage, ou début de partie) ;
// « Plus tard » ne repropose la rencontre qu'à la visite suivante
let teamVisit = 0;
/** @type {Record<string, number>} la visite où l'enfant a dit « Plus tard », par compagnon */
const teamLater = {};
function teamNewVisit() {
  teamVisit++;
}
/** @param {string} [worldArg] l'île, par défaut l'île courante */
function maybeTeamEncounter(worldArg) {
  const world = worldArg || currentWorld;
  if (party.active || race.active) return false;
  // la fenêtre (#overlay) fait partie de la page (index.html)
  if (/** @type {HTMLElement} */ (document.getElementById('overlay')).classList.contains('show')) return false;
  const id = teamEncounterOn(world);
  if (!id || teamLater[id] === teamVisit) return false;
  openTeamEncounter(id);
  return true;
}
/** @param {string} id */
function openTeamEncounter(id) {
  const c = COMPANIONS[id],
    r = TEAM_ROLES[id];
  openModal(`
    <div class="team-meet">
      <span class="tm-stage" aria-hidden="true">${companionSVG(id, 'cheer')}</span>
      <h2>${c.name} ${c.title}</h2>
      <span class="tm-role">${r.icon} ${r.role}</span>
      ${speechBubble(r.say.join(' '))}
      <div class="tm-demo" aria-hidden="true">${r.demo}</div>
    </div>
    <button class="btn-primary" id="tm-yes">Dans mon équipe ! 🤝</button>
    <button class="btn-ghost" id="tm-later">Plus tard</button>
  `);
  bindSpeakButtons();
  playSound('good');
  speak(`${r.say.join(' ')} Tu veux bien que je rejoigne ton équipe ?`);
  setHandler(document.getElementById('tm-yes'), 'click', () => {
    playSound('tap');
    teamWelcome(id);
  });
  setHandler(document.getElementById('tm-later'), 'click', () => {
    playSound('tap');
    teamLater[id] = teamVisit;
    closeModal();
  });
}
// le compagnon rejoint l'équipe : équipier s'il reste une place, sinon au repos
/** @param {string} id */
function teamWelcome(id) {
  const t = teamState();
  if (!t.met.includes(id)) t.met.push(id);
  const joined = teamAddMate(id);
  save();
  renderTeamHeads();
  const c = COMPANIONS[id];
  if (joined) {
    closeModal();
    playSound('win');
    confetti();
    speak(`${c.name} rejoint ton équipe !`);
    showToast(`🤝 ${c.name} rejoint ton équipe !`, '');
  } else {
    openTeamWindow(`${c.name} attend dans ton équipe. Tu as déjà 2 équipiers : choisis qui t'accompagne !`);
  }
}

/* ---- composer l'équipe ---- */
/** @param {string} id */
function teamAddMate(id) {
  const t = teamState();
  if (id === teamPrincipal() || !teamHasMet(id) || teamMates().includes(id)) return false;
  if (teamMates().length >= TEAM_MATES_MAX) return false;
  t.mates = teamMates().concat(id);
  return true;
}
/** @param {string} id */
function teamRest(id) {
  const t = teamState();
  t.mates = teamMates().filter((x) => x !== id);
}
// changer de principal : l'ancien prend la place du nouveau dans l'équipe
/** @param {string} id */
function teamMakePrincipal(id) {
  const old = teamPrincipal(),
    p = currentProfile();
  if (!p || id === old || !teamHasMet(id)) return false;
  const t = teamState();
  if (!t.met.includes(old)) t.met.push(old);
  const mates = teamMates();
  const slot = mates.indexOf(id);
  if (slot >= 0) mates[slot] = old;
  else if (mates.length < TEAM_MATES_MAX) mates.push(old);
  p.companion = id;
  saveProfiles();
  t.mates = mates.filter((x) => x !== id);
  return true;
}

/* ---- la fenêtre « Mon équipe » ---- */
/** @param {string} id @param {'main' | 'mate' | 'rest'} kind */
function teamCard(id, kind) {
  const c = COMPANIONS[id],
    r = TEAM_ROLES[id] || { icon: '💡', role: 'Indices' };
  const full = teamMates().length >= TEAM_MATES_MAX;
  const actions =
    kind === 'main'
      ? ''
      : kind === 'mate'
        ? `<button type="button" class="btn-small ghost" data-team-rest="${id}">😴 Repos</button><button type="button" class="btn-small ghost" data-team-main="${id}">⭐ Principal</button>`
        : `<button type="button" class="btn-small" data-team-add="${id}"${full ? ' aria-disabled="true" data-say-why="Ton équipe est déjà complète."' : ''}>➕ Équipe</button><button type="button" class="btn-small ghost" data-team-main="${id}">⭐ Principal</button>`;
  return `<div class="tw-card ${kind}">
    <span class="tw-face">${companionSVG(id, kind === 'rest' ? 'sleepy' : 'happy')}</span>
    <span class="tw-txt"><b>${c.name}</b><i>${kind === 'main' ? '💡 Indices' + (teamIsOpen() ? ` · ${r.icon} ${r.role}` : '') : `${r.icon} ${r.role}`}</i></span>
    ${actions ? `<span class="tw-actions">${actions}</span>` : ''}
  </div>`;
}
/** @param {string} [note] le message de l'en-tête */
function openTeamWindow(note) {
  const p = teamPrincipal(),
    c = COMPANIONS[p];
  if (!teamIsOpen()) return teamWindowSoon(p, c);
  const mates = teamMates();
  const rest = teamKnownIds().filter((id) => id !== p && teamHasMet(id) && !mates.includes(id));
  const unmet = teamKnownIds().filter((id) => !teamHasMet(id));
  openModal(`
    ${gameHeader('🤝 Mon équipe', note || "Ton compagnon principal et 2 équipiers t'accompagnent", note)}
    <h3 class="tw-h">⭐ Principal</h3>
    <div class="tw-list">${teamCard(p, 'main')}</div>
    <h3 class="tw-h">🤝 Équipiers (${mates.length}/${TEAM_MATES_MAX})</h3>
    <div class="tw-list">${mates.length ? mates.map((id) => teamCard(id, 'mate')).join('') : '<p class="tw-empty">Personne pour l\'instant : rencontre des amis sur les îles !</p>'}</div>
    ${rest.length ? `<h3 class="tw-h">😴 Au repos</h3><div class="tw-list">${rest.map((id) => teamCard(id, 'rest')).join('')}</div>` : ''}
    ${
      unmet.length
        ? `<h3 class="tw-h">🗺️ À rencontrer</h3><div class="tw-unmet">${unmet
            .map((id) => {
              const home = teamHomeOf(id);
              return `<span class="tw-one locked"><span class="tw-face">${companionSVG(id, 'happy')}</span><i>${home ? `${WORLDS[home].emoji} ${WORLDS[home].short || WORLDS[home].name}` : '✨ Bientôt'}</i></span>`;
            })
            .join('')}</div>`
        : ''
    }
  `);
  bindQuit();
  teamWindowBind();
}

// les boutons de la fenêtre : rejoindre l'équipe, se reposer, devenir principal
function teamWindowBind() {
  /** @param {string} [msg] */
  const redraw = (msg) => {
    save();
    renderTeamHeads();
    openTeamWindow();
    if (msg) {
      showToast(msg, '');
      speak(msg);
    }
  };
  document.querySelectorAll('[data-team-add]').forEach((b) =>
    setHandler(b, 'click', () => {
      playSound('tap');
      // le sélecteur [data-team-add] garantit l'attribut
      const id = /** @type {string} */ (b.dataset.teamAdd);
      if (b.getAttribute('aria-disabled') === 'true') return; // l'écoute au doigt dit pourquoi
      if (teamAddMate(id)) redraw(`${COMPANIONS[id].name} rejoint ton équipe !`);
    }),
  );
  document.querySelectorAll('[data-team-rest]').forEach((b) =>
    setHandler(b, 'click', () => {
      playSound('tap');
      // le sélecteur [data-team-rest] garantit l'attribut
      const id = /** @type {string} */ (b.dataset.teamRest);
      teamRest(id);
      redraw(`${COMPANIONS[id].name} se repose.`);
    }),
  );
  document.querySelectorAll('[data-team-main]').forEach((b) =>
    setHandler(b, 'click', () => {
      playSound('tap');
      // le sélecteur [data-team-main] garantit l'attribut
      const id = /** @type {string} */ (b.dataset.teamMain);
      if (teamMakePrincipal(id)) {
        refreshAll();
        redraw(`${COMPANIONS[id].name} est ton compagnon principal !`);
      }
    }),
  );
}
/**
 * @param {string} p le compagnon principal
 * @param {typeof COMPANIONS[string]} c
 */
function teamWindowSoon(p, c) {
  const left = Math.max(0, TEAM_LEVEL - level());
  openModal(`
    ${gameHeader('🤝 Mon équipe', `${c.name} te donne des indices 💡 dans tous les jeux`)}
    <div class="tw-list">${teamCard(p, 'main')}</div>
    <div class="speech tw-soon">🗺️ Au niveau ${TEAM_LEVEL}, ton équipe s'agrandit : d'autres amis t'attendent sur les îles !${left ? ` Encore ${left} niveau${left > 1 ? 'x' : ''}.` : ''}</div>
  `);
  bindQuit();
}

/* ---- branchements ---- */
// début de partie (après « Jouer ») : l'ouverture de l'équipe si elle est due,
// sinon une rencontre sur l'île où l'on se trouve (c'est une visite)
function teamOnSessionStart() {
  teamNewVisit();
  if (maybeTeamOpening()) return true;
  return maybeTeamEncounter(currentWorld);
}
// arrivée sur une autre île (js/features/island/island-view.js)
/** @param {string} world */
function teamOnTravel(world) {
  teamNewVisit();
  setTimeout(() => maybeTeamEncounter(world), 1400); // après l'annonce de l'île
}
onProfileRefresh(renderTeamHeads);

// l'île prévient : on arrive sur une île, ou elle vient d'être redessinée
on('world:changed', teamOnTravel);
on('lagon:rendered', renderTeamHeads); // les aides (Sam, Zap) : specialties.js écoute aussi

export {
  maybeTeamOpening,
  renderTeamHeads,
  teamHeadsHTML,
  teamIsOpen,
  teamMates,
  teamOnSessionStart,
  teamPrincipal,
  teamState,
};
