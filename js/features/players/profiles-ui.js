/* ---------- Écran des joueurs, modes de jeu, choix du mini-jeu ---------- */
import {
  avatarHTML,
  avatarText,
  bindCompanionSelector,
  companionOf,
  companionSelector,
  companionsFor,
  companionSVG,
  defaultCompanionFor,
} from '../../entities/companion/index.js';
import { ageToDiff, GAME_LIST, gameTypesForAge } from '../../entities/difficulty/index.js';
import { gameCount, levelOf, save, state } from '../../entities/game-state/index.js';
import {
  addProfile,
  AVATARS,
  currentPlayerAge,
  currentProfile,
  party,
  partyCurrent,
  profiles,
  profileSaveKey,
  saveProfiles,
  switchProfile,
} from '../../entities/player/index.js';
import { currentWorld, worldGame } from '../../entities/world/index.js';
import { cleanName, on, pickRandom, shuffle } from '../../shared/lib/index.js';
import {
  bindForm,
  closeModal,
  confetti,
  formSheet,
  openModal,
  playSound,
  setHandler,
  showToast,
  speak,
  switchView,
} from '../../shared/ui/index.js';
import { pickPracticeGame } from '../adaptive/index.js';
import { teamOnGamePicker } from '../companion-team/index.js';
import { renderLagon, setCurrentChar } from '../island/index.js';
import { playGame, startMinigame } from '../minigame-engine/index.js';
import { startParty, startRace, stopParty } from '../party/index.js';
import { genderSelector, renderProfile } from '../profile/index.js';
import { bindQuit, gameHeader } from '../screen/index.js';

/* --- Panneau des joueurs --- */
/** @param {(typeof profiles.list)[number]} p @param {Set<string | null>} sel */
function playerRowHTML(p, sel) {
  return `
          <div class="market-row player-row ${p.id === profiles.current ? 'current' : ''}">
            <span class="emoji">${avatarHTML(p.avatar, p.look)}<span class="row-buddy">${companionSVG(companionOf(p), 'happy')}</span></span>
            <div class="info">
              <div class="name">${p.name || 'Sans nom'} ${p.id === profiles.current ? '<small>(en cours)</small>' : ''}</div>
              <div class="sub">${p.age ? `🎂 ${p.age} ans · ` : ''}${playerSummary(p.id)}</div>
            </div>
            <button class="pick-btn ${sel.has(p.id) ? 'on' : ''}" data-pick="${p.id}">${sel.has(p.id) ? '✅' : '⬜️'}</button>
            <button class="btn-small ghost" data-edit="${p.id}">⚙️</button>
          </div>`;
}

/** @param {Set<string | null>} sel */
function playersPanelHTML(sel) {
  return `
      ${gameHeader('👥 Les joueurs', "Choisis qui joue, ou ajoute quelqu'un")}
      <div id="players-list">
        ${profiles.list.map((p) => playerRowHTML(p, sel)).join('')}
      </div>
      <button class="btn-craft" id="btn-add-player">➕ Ajouter un joueur</button>
      <div class="mode-row">
        <button class="btn-primary" id="btn-solo">👤 Solo</button>
        <button class="btn-primary alt" id="btn-turns">🎲 Chacun<br>son tour</button>
        <button class="btn-primary race" id="btn-race">🏁 Course</button>
      </div>
      <p class="mode-hint">🏁 En course, chacun joue à sa difficulté selon son âge : c'est équitable même entre grands et petits.</p>
      ${party.active ? `<button class="btn-ghost" id="btn-stop-party">Arrêter le mode chacun son tour</button>` : ''}
    `;
}

// les joueurs cochés, dans l'ordre de la liste ; null (avec un message) s'il y en a moins de 2
/** @param {Set<string | null>} sel @param {string} pourQuoi */
function pickedPlayers(sel, pourQuoi) {
  const ids = profiles.list.filter((p) => sel.has(p.id)).map((p) => p.id);
  if (ids.length >= 2) return ids;
  showToast('Choisis au moins 2 joueurs ✌️');
  speak(`Choisis au moins deux joueurs pour ${pourQuoi}.`);
  return null;
}

/** @param {Set<string | null>} sel */
function playSolo(sel) {
  playSound('tap');
  const id = [...sel][0] || profiles.current;
  if (party.active) stopParty();
  switchProfile(/** @type {string} */ (id), true); // un joueur courant existe toujours (loadProfiles)
  closeModal();
  renderProfile();
  renderLagon();
  speak(`Mode solo. À toi de jouer ${currentProfile().name || ''} !`);
  showToast(`👤 ${avatarText(currentProfile().avatar)} ${currentProfile().name || ''}`);
}

/** @param {Set<string | null>} sel */
function playTurns(sel) {
  playSound('tap');
  const ids = pickedPlayers(sel, 'jouer chacun son tour');
  if (!ids) return;
  startParty(ids);
  closeModal();
}

/** @param {Set<string | null>} sel */
function playRace(sel) {
  playSound('tap');
  const ids = pickedPlayers(sel, 'faire la course');
  if (!ids) return;
  const sansAge = profiles.list.filter((p) => sel.has(p.id) && !p.age);
  if (sansAge.length) {
    showToast(`Ajoute l'âge de ${sansAge[0].name || 'ce joueur'} 🎂`);
    speak(`Indique l'âge de ${sansAge[0].name || 'ce joueur'} pour une course équitable.`);
    openPlayerSettings(sansAge[0].id);
    return;
  }
  startRace(ids);
  closeModal();
  renderLagon();
}

/** @param {Set<string | null>} sel @param {() => void} render */
function bindPlayerRows(sel, render) {
  document.querySelectorAll('[data-pick]').forEach((b) => {
    setHandler(b, 'click', () => {
      const id = /** @type {string} */ (b.dataset.pick);
      if (sel.has(id)) sel.delete(id);
      else sel.add(id);
      playSound('tap');
      render();
    });
  });
  document.querySelectorAll('[data-edit]').forEach((b) => {
    setHandler(b, 'click', () => {
      playSound('tap');
      openPlayerSettings(/** @type {string} */ (b.dataset.edit));
    });
  });
}

/** @param {Set<string | null>} sel */
function bindModeButtons(sel) {
  setHandler(document.getElementById('btn-add-player'), 'click', () => {
    playSound('tap');
    openNewPlayer();
  });
  setHandler(document.getElementById('btn-solo'), 'click', () => playSolo(sel));
  setHandler(document.getElementById('btn-turns'), 'click', () => playTurns(sel));
  setHandler(document.getElementById('btn-race'), 'click', () => playRace(sel));
  const stop = document.getElementById('btn-stop-party');
  if (stop)
    setHandler(stop, 'click', () => {
      playSound('tap');
      stopParty();
      closeModal();
    });
}

function openPlayers() {
  const sel = new Set(party.active ? party.players : [profiles.current]);
  const render = () => {
    openModal(playersPanelHTML(sel));
    bindQuit();
    bindPlayerRows(sel, render);
    bindModeButtons(sel);
  };
  render();
}

/** @param {string} id */
function playerSummary(id) {
  try {
    const raw = localStorage.getItem(profileSaveKey(id));
    if (!raw) return 'Nouvelle aventure';
    const s = JSON.parse(raw);
    const lvl = levelOf(s.missions);
    return `⭐ niveau ${lvl} · 🪙 ${s.coins || 0} · 🎮 ${s.missions || 0} missions`;
  } catch {
    return '';
  }
}

/** @param {number | null} sel l'âge choisi */
function ageSelector(sel) {
  const ages = [4, 5, 6, 7, 8, 9, 10, 11, 12];
  return `<label class="mini-label">🎂 Quel âge ?</label>
    <div class="age-grid">
      ${ages.map((a) => `<button class="age-opt ${Number(sel) === a ? 'sel' : ''}" data-age="${a}">${a}</button>`).join('')}
    </div>
    <p class="mode-hint" id="age-hint">${sel ? `Défi adapté : ${'⭐'.repeat(/** @type {number} */ (ageToDiff(sel)))}` : 'Sert à adapter la difficulté en course 🏁'}</p>`;
}

/* --- Formulaires des joueurs (modèle commun de js/shared/ui/form.js) --- */
// après un formulaire : on revient d'où l'on vient (l'écran Réglages, ou le panneau des joueurs)
function backFromPlayerForm() {
  const rg = document.getElementById('view-reglages');
  if (rg && rg.classList.contains('active')) {
    closeModal();
    switchView('reglages');
  } else openPlayers();
}

const NAME_INPUT_ATTRS =
  'type="text" maxlength="12" placeholder="Prénom" autocomplete="off" autocapitalize="words" autocorrect="off" spellcheck="false" enterkeyhint="done"';
const NAME_REQUIRED = "Écris d'abord un prénom, en haut.";
/** @param {string} v */
const escAttr = (v) => String(v || '').replace(/"/g, '&quot;');
/**
 * Ce que montre un formulaire de joueur ; `nameId` = l'id du champ du prénom.
 * @typedef {{
 *   nameId: string,
 *   name: string,
 *   age: number | null,
 *   av: string,
 *   gen: string,
 *   comp: string,
 *   allBuddies: boolean,
 * }} PlayerFormValues
 */
// les sections communes : Moi (prénom, âge), Mon avatar, Mon compagnon
/** @param {PlayerFormValues} o */
function playerFormSections(o) {
  return [
    {
      title: '🙂 Moi',
      html: `<input id="${o.nameId}" class="name-input-modal" ${NAME_INPUT_ATTRS} value="${escAttr(o.name)}">${ageSelector(o.age)}`,
    },
    {
      title: '🎨 Mon avatar',
      html: `<div class="avatar-grid">
        ${AVATARS.map((a) => `<button class="avatar-opt ${a === o.av ? 'sel' : ''}" data-av="${a}" aria-label="${avatarText(a)}">${avatarHTML(a)}</button>`).join('')}
      </div>`,
    },
    { title: '🧚 Mon compagnon', html: `${genderSelector(o.gen)}${companionSelector(o.comp, o.gen, o.allBuddies)}` },
  ];
}

/**
 * Les choix d'un formulaire de joueur, modifiés en place par les boutons.
 * @typedef {{ name: string, av: string, age: number | null, gen: string, comp: string | null, allBuddies: boolean }} PlayerFormChoices
 */
// branche le prénom, l'avatar, l'âge, le genre et le compagnon d'un formulaire de joueur ;
// `onGender` peut corriger le compagnon quand le genre change
/** @param {PlayerFormChoices} f @param {string} nameId @param {{ render: () => void, onGender?: () => void }} o */
function bindPlayerChoices(f, nameId, o) {
  const input = /** @type {HTMLInputElement} */ (document.getElementById(nameId));
  input.addEventListener('input', () => {
    f.name = input.value;
  });
  /** @param {string} sel @param {(b: HTMLElement) => void} pick */
  const choice = (sel, pick) =>
    document.querySelectorAll(sel).forEach((b) => {
      setHandler(b, 'click', () => {
        pick(/** @type {HTMLElement} */ (b));
        playSound('tap');
        o.render();
      });
    });
  choice('.avatar-opt', (b) => (f.av = /** @type {string} */ (b.dataset.av)));
  choice('.age-opt', (b) => (f.age = Number(b.dataset.age)));
  choice('.gender-opt', (b) => {
    f.gen = /** @type {string} */ (b.dataset.gender);
    if (o.onGender) o.onGender();
  });
  bindCompanionSelector(
    document,
    (k) => {
      f.comp = k;
      o.render();
    },
    () => {
      f.allBuddies = true;
      o.render();
    },
  );
}

/* --- Nouveau joueur --- */
function openNewPlayer() {
  /** @type {PlayerFormChoices} */
  const f = { name: '', av: pickRandom(AVATARS), age: null, gen: '', comp: null, allBuddies: false };
  const snap = () => ({ name: f.name.trim(), av: f.av, age: f.age, gen: f.gen, comp: f.comp });
  const initial = snap();
  const render = () => {
    openModal(
      formSheet({
        title: '➕ Nouveau joueur',
        sections: playerFormSections({ ...f, nameId: 'np-name', comp: f.comp || defaultCompanionFor(f.gen) }),
        primary: "C'est parti ! 🎮",
        secondary: 'Annuler',
      }),
    );
    bindPlayerChoices(f, 'np-name', {
      render,
      onGender: () => {
        if (f.comp && !f.allBuddies && !companionsFor(f.gen).includes(f.comp)) f.comp = null;
      },
    });
    bindForm({
      initial,
      current: snap,
      required: [
        { value: () => cleanName(f.name), say: NAME_REQUIRED, focus: () => document.getElementById('np-name') },
      ],
      onSave: () => {
        const n = cleanName(f.name);
        addProfile(n, f.av, f.age, f.gen, f.comp || defaultCompanionFor(f.gen));
        playSound('win');
        confetti();
        speak(`Bienvenue ${n} !`);
        showToast(`${avatarText(f.av)} ${n} ajouté !`);
        backFromPlayerForm();
      },
      onCancel: () => backFromPlayerForm(),
    });
  };
  render();
}

/* --- Réglages d'un joueur : prénom, âge, avatar, compagnon, anniversaire ---
   (recommencer et supprimer sont dans l'espace parents, zone sensible) */
// les mois, dans l'ordre du calendrier (la liste du formulaire)
const MONTHS = 'janvier février mars avril mai juin juillet août septembre octobre novembre décembre'.split(' ');

// « MM-JJ » lu dans les deux listes de la page (une liste peut changer sans événement) ;
// `fallback` si les listes ne sont pas affichées
/** @param {string} fallback */
function readBdaySelects(fallback) {
  const de = /** @type {HTMLSelectElement} */ (document.getElementById('pe-bday-d')),
    me = /** @type {HTMLSelectElement} */ (document.getElementById('pe-bday-m'));
  if (!de || !me) return fallback;
  const d = Number(de.value),
    m = Number(me.value);
  return d && m ? `${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}` : '';
}

/** @param {string} bday « MM-JJ » ou '' */
function bdaySection(bday) {
  const [bm, bd] = bday ? bday.split('-').map(Number) : [0, 0];
  return {
    title: '🎂 Mon anniversaire (facultatif)',
    html: `<div class="bday-row">
            <select id="pe-bday-d" aria-label="Jour de l'anniversaire"><option value="0">Jour</option>${Array.from({ length: 31 }, (_, i) => `<option value="${i + 1}" ${bd === i + 1 ? 'selected' : ''}>${i + 1}</option>`).join('')}</select>
            <select id="pe-bday-m" aria-label="Mois de l'anniversaire"><option value="0">Mois</option>${MONTHS.map((m, i) => `<option value="${i + 1}" ${bm === i + 1 ? 'selected' : ''}>${m}</option>`).join('')}</select>
          </div>`,
  };
}

/** @param {(typeof profiles.list)[number]} p @param {PlayerFormChoices & { bday: string }} f */
function savePlayerSettings(p, f) {
  p.birthday = f.bday;
  p.name = cleanName(f.name);
  p.avatar = f.av;
  p.age = f.age;
  p.gender = f.gen;
  p.companion = /** @type {string} */ (f.comp); // les réglages partent toujours d'un compagnon (companionOf)
  saveProfiles();
  if (p.id === profiles.current) {
    state.name = p.name;
    state.avatar = p.avatar;
    save();
    renderProfile();
    renderLagon();
  }
  playSound('good');
  showToast('Enregistré ✅');
  backFromPlayerForm();
}

/** @param {string} id */
function openPlayerSettings(id) {
  const p = profiles.list.find((x) => x.id === id);
  if (!p) return;
  const gen = p.gender || '';
  const comp = companionOf(p);
  // bday : « MM-JJ », le jeu fête l'anniversaire ce jour-là (js/features/seasons/seasons.js)
  const f = {
    name: p.name || '',
    av: p.avatar,
    age: p.age || null,
    gen,
    comp,
    allBuddies: !companionsFor(gen).includes(comp),
    bday: p.birthday || '',
  };
  const readBday = () => (f.bday = readBdaySelects(f.bday));
  const snap = () => ({ name: f.name.trim(), av: f.av, age: f.age, gen: f.gen, comp: f.comp, bday: readBday() });
  const initial = { name: f.name.trim(), av: f.av, age: f.age, gen: f.gen, comp: f.comp, bday: f.bday };
  const render = () => {
    openModal(
      formSheet({
        title: `⚙️ ${p.name || 'Joueur'}`,
        sections: [
          ...playerFormSections({ ...f, nameId: 'pe-name', comp: /** @type {string} */ (f.comp) }),
          bdaySection(f.bday),
          { html: `<div class="speech" style="font-size:.82rem;">${playerSummary(id)}</div>` },
        ],
        primary: 'Enregistrer ✅',
        secondary: 'Retour',
      }),
    );
    bindPlayerChoices(f, 'pe-name', { render });
    ['pe-bday-d', 'pe-bday-m'].forEach((k) =>
      /** @type {HTMLElement} */ (document.getElementById(k)).addEventListener('change', readBday),
    );
    bindForm({
      initial,
      current: snap,
      required: [
        { value: () => cleanName(f.name), say: NAME_REQUIRED, focus: () => document.getElementById('pe-name') },
      ],
      onSave: () => {
        readBday();
        savePlayerSettings(p, f);
      },
      onCancel: () => backFromPlayerForm(),
    });
  };
  render();
}

/* --- Choix du mini-jeu --- */
// Nombre de défis proposés à chaque fois (+ le bouton Surprise).
// On ne montre jamais toute la liste : un petit choix à chaque tour,
// pour garder la surprise et faire tourner tous les jeux.
const GAME_PICKER_SIZE = 2;

// Choisit les défis à proposer :
// 1) on ne garde que les types adaptés à l'âge du joueur (programme
//    de maternelle pour les 3-5 ans, tout l'éventail dès 6 ans/CP) ;
// 2) parmi eux, on favorise ceux que CE joueur a le moins essayés (son
//    compteur personnel `state.gameCounts`) : les jeux jamais faits
//    remontent toujours en premier, pour forcer la variété (égalités
//    départagées au hasard).
/** @param {number} n */
function pickPickerChoices(n) {
  const allowed = new Set(gameTypesForAge(currentPlayerAge()));
  const pool = GAME_LIST.filter((g) => allowed.has(g.key));
  const withCount = shuffle(pool.length ? pool : GAME_LIST).map((g) => ({ g, c: gameCount(g.key) }));
  withCount.sort((a, b) => a.c - b.c);
  const choices = withCount.slice(0, n).map((x) => x.g);
  // une île peut avoir « son » mini-jeu (WORLDS[id].game) : il est toujours
  // proposé quand on y joue (s'il convient à l'âge du joueur)
  const own = worldGame(currentWorld, currentPlayerAge());
  const ownGame = own && pool.find((g) => g.key === own);
  if (ownGame && !choices.includes(ownGame)) choices[0] = ownGame;
  // Phase 3 : un jeu à travailler revient plus souvent (js/features/adaptive/adaptive.js)
  const practice = pickPracticeGame(pool.map((g) => g.key));
  if (practice && !choices.some((g) => g.key === practice)) {
    const slot =
      choices.length > 1 && choices[choices.length - 1] !== ownGame
        ? choices.length - 1
        : choices[0] === ownGame
          ? -1
          : 0;
    // practice vient des clés de pool : il s'y trouve
    if (slot >= 0) choices[slot] = /** @type {(typeof pool)[number]} */ (pool.find((g) => g.key === practice));
  }
  return choices;
}

/** @param {string} [charId] */
function openGamePicker(charId) {
  if (charId) setCurrentChar(charId);
  const who = party.active ? partyCurrent() || currentProfile() : currentProfile();
  const choices = pickPickerChoices(Math.min(GAME_PICKER_SIZE, GAME_LIST.length));
  openModal(`
    ${gameHeader('🎮 Choisis ton jeu', party.active ? `${avatarText(who.avatar)} ${who.name || 'À toi'} choisit !` : 'À quoi veux-tu jouer ?')}
    <div class="game-picker">
      ${choices
        .map(
          (g) => `<button class="game-choice" data-game="${g.key}">
        <span class="emoji">${g.emoji}</span><span class="nm">${g.name}</span>
      </button>`,
        )
        .join('')}
      <button class="game-choice surprise" data-game="random">
        <span class="emoji">🎲</span><span class="nm">Surprise</span>
      </button>
    </div>
  `);
  bindQuit();
  teamOnGamePicker(choices.map((g) => g.key)); // Léo le tuteur annonce un jeu à travailler
  document.querySelectorAll('[data-game]').forEach((b) => {
    setHandler(b, 'click', () => {
      playSound('tap');
      const k = /** @type {string} */ (b.dataset.game); // le sélecteur garantit data-game
      if (k === 'random') startMinigame();
      else playGame(k);
    });
  });
}

// ouvrir le choix des jeux ou les réglages d'un joueur, à la demande de l'île,
// des cadeaux ou du Sac (couches plus basses)
on('nav:game-picker', openGamePicker);
on('nav:player-settings', openPlayerSettings);

export { openNewPlayer, openPlayers, openPlayerSettings };
