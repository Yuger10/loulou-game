# Inventaire et correspondance cible (phase 1)

Généré à partir de `npm run inventaire` (`test/tools/globals.js`, analyse acorn avec portées) sur la v50 : 37 fichiers, environ 550 noms globaux.
Le détail brut (noms définis et dépendances de chaque fichier) se régénère à tout moment avec `npm run inventaire`.

## Constats
- **`ui.js` est un fourre-tout** de 56 noms : inventaire (`addItem`, `addCoins`…), hasard (`pickRandom`, `shuffle`), retours (`showToast`, `vibrate`, `confetti`), son (`playSound`), voix (`speak`…), navigation (`switchView`), mondes (`currentWorld`, `worldUnlocked`, `setWorld`, `checkNewIsland`), difficulté (`gameDiff`), vue Île (`renderLagon`, `renderScene`, `openDialogue`, `openDecoShop`) et modale (`openModal`, `closeModal`). Il dépend de 18 fichiers.
- **`state.js`** mélange l'état et la sauvegarde avec l'en-tête (`renderProfile`), l'accueil (`openWelcome`), les quêtes du jour et l'album.
- **`minigames.js`** mélange le moteur (vies, relance, minuteur, victoire) et 6 jeux (`renderMemory`, `renderCount`, `renderDiff`, `renderSimon`, `renderSequence`, `renderPuzzle`).
- **`data.js`** mélange objets, personnages, mondes, types de jeux par âge, mots du CP, décorations et avatars.
- **`players.js`** mélange profils (stockage) et mode « chacun son tour » (interface).
- **Dépendances vers le haut** (une couche basse qui appelle une couche haute) :
  - `closeModal` → minuteur, relance, histoire, gains ;
  - `switchView` → carte, île, sac, marché ;
  - `playSound` → `state.sound` ;
  - `companionSVG` → garde-robe et saisons ;
  - `players.js` (profils) → `renderLagon`, quêtes, course.

## Remèdes retenus
1. **Points d'accroche dans `shared`** au lieu d'appels directs vers le haut :
   - `onModalClose(fn)` / `onModalOpen(fn)` : minuteur, relance, histoire et gains s'y inscrivent ;
   - `registerView(nom, rendu)` : chaque feature déclare le rendu de sa vue, et `switchView` ne connaît plus personne ;
   - `setSoundEnabled(bool)` : l'état pousse le réglage du son au lieu que le son lise l'état.
2. **Déplacer l'interface hors des entités :** `renderProfile` et l'accueil vers `features/profile`, les quêtes vers `features/quests`, l'album vers `features/bag`, le mode chacun son tour vers `features/party`.
3. **Exceptions documentées :** ce qui ne se corrige pas proprement sans bus d'événements va dans une liste `LAYER_EXCEPTIONS` du test de frontières, chaque entrée avec sa raison. **L'étape B (v54) doit vider cette liste.**

## Correspondance cible

| Cible | Vient de |
|---|---|
| `shared/lib/random.js` | `pickRandom`, `shuffle` (ui.js) |
| `shared/ui/icons.js` | icons.js |
| `shared/ui/feedback.js` | `showToast`, `vibrate`, `shakeEl`, `wrongFeedback`, `confetti` (ui.js) |
| `shared/ui/sound.js` | `audioCtx`, `tone`, `playSound`, `soundModeLabel` + `setSoundEnabled` (ui.js) |
| `shared/ui/voice.js` | `EMOJI_WORDS` … `speak`, `bindSpeakButtons`, `speechBubble` (ui.js) |
| `shared/ui/modal.js` | `openModal`, `closeModal` + accroches (ui.js) |
| `shared/ui/views.js` | `currentView`, `switchView` + `registerView` (ui.js) |
| `shared/styles/*.css` | base, variables, design system, responsive (styles.css) |
| `entities/item/` | `ITEMS`, `CRAFTED`, `ALL_ITEMS`, `DECOS`, `decosOf`, `ALBUM_REWARD` (data.js) ; `addItem`, `removeItem`, `countItem`, `addCoins`, `coinsInFlight` (ui.js) |
| `entities/character/` | `CHARACTERS`, `charsOf`, `charsOfForPlayer` (data.js) ; characters-art.js, characters.css |
| `entities/world/` | `WORLDS`, `WORLD_ORDER` (data.js) ; `currentWorld`, `worldUnlocked`, `nextLockedWorld` (ui.js) |
| `entities/game-state/` | état, sauvegarde, migrations (state.js) ; `SAVE_KEY`, `MISSIONS_PER_LEVEL` (data.js) ; `level`, `levelProgress`, `gameCount`, `trackGamePlayed` (ui.js) |
| `entities/player/` | profils et stockage (players.js) ; `AVATARS`, `AVATAR_FIX`, `fixAvatar` (data.js) |
| `entities/companion/` | companions.js |
| `entities/difficulty/` | difficulty.js ; `GAME_TYPES`, `AGE_GAME_TYPES`, `gameTypesForAge` (data.js) ; `AGE_DIFF`, `ageToDiff`, `ageLabel` (race.js) ; `gameDiffIsland`, `gameDiff`, `adaptedDiff` (ui.js) |
| `entities/words/` | `WORDS_CP` (data.js), partagé par lecture et grammaire |
| `features/minigame-engine/` | moteur de minigames.js (vies, relance, minuteur, victoire, `playGame`, `startMinigame`, `gameHeader`…) |
| `features/minigames/<jeu>/` | memory, count, intruder (`renderDiff`), simon, sequence, puzzle (minigames.js) ; math, reading, grammar, volume, compare, money, clock, calendar, calc, shapes, planets, jigsaw |
| `features/island/` | island.js, island.css ; `setWorld`, `checkNewIsland`, `renderLevelPill`, `renderIslandCard`, `renderLagon`, `renderScene`, `openDecoShop`, `currentChar`, `contextualLine`, `openDialogue` (ui.js) |
| `features/map/` | map.js |
| `features/story/` | story.js, episodes.js |
| `features/bag/` | `renderSac` (market.js), `currentSacTab`, `setSacTab`, `renderBadge` (ui.js), album (state.js) |
| `features/market/` | market.js sans le sac |
| `features/quests/` | quêtes du jour et coffre (state.js) |
| `features/profile/` | `renderProfile`, accueil (state.js) ; `renderCoins`, `renderSoundBtn` (ui.js) |
| `features/party/` | mode chacun son tour (players.js) ; race.js sans l'âge |
| `features/players/` | profiles-ui.js |
| `features/gains/`, `gifts/`, `wardrobe/`, `parents/`, `adaptive/`, `seasons/`, `backup/`, `music/` | un fichier chacun, tel quel |
| `app/` | init.js (démarrage, liaison des boutons d'en-tête) |
