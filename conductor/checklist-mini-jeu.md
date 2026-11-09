# Checklist : ajouter un mini-jeu

Architecture en feature slices (v51). Exemple de référence : « Assembler l'image » (`jigsaw`).
Remplacer `<cle>` par la clé du jeu (ex. `nesting`) et `<Jeu>` par son nom de fonction (ex. `renderNesting`).

## 1. Tests d'abord
- [ ] `test/smoke.test.js` : le jeu s'ouvre, une bonne réponse avance, une mauvaise relance une **autre** question (anti-devinette), la difficulté suit le palier et l'âge.
- [ ] `test/games.test.js` : le jeu est joué jusqu'à la victoire à chaque palier (ajouter son « solveur » s'il en faut un).
- [ ] `npm test` échoue pour la bonne raison.

## 2. La slice du jeu
- [ ] `js/features/minigames/<cle>/<cle>.js` : la fonction `<Jeu>()`, qui utilise le moteur (`setupLives`, `gameHeader`, `livesBar`, `bindQuit`, `setSolution`, `stepOk`, `loseLife`, `onMissionWin`, `scheduleRetry`…).
- [ ] À la fin du fichier : `registerGame('<cle>', <Jeu>);`. Le moteur ne connaît pas la liste des jeux.
- [ ] `js/features/minigames/<cle>/<cle>.css` si besoin.
- [ ] `js/slices.js` : une slice `minigame-<cle>` (couche `features`, `public:[]`) ; sa feuille de style dans `css` **et** dans `CSS_ORDER` (en fin de liste, avant `island.css`).

## 3. Les entités et features à compléter
- [ ] `js/entities/difficulty/game-types.js` : la clé dans `GAME_TYPES`, et dans les tranches d'âge de `AGE_GAME_TYPES` où le jeu est proposé.
- [ ] `js/entities/difficulty/difficulty.js` : ses paramètres par palier (une fonction `<cle>Round(dd)` ou équivalent), ses essais dans `LIVES_TABLE`, et `NO_TIMER_KINDS` s'il ne doit pas avoir de minuteur.
- [ ] `js/features/adaptive/adaptive.js` : sa phrase de progrès dans `PROGRESS_CHEERS`, et `GAME_TIER_MAX` s'il va au-delà du palier 5.
- [ ] `js/features/parents/parents.js` : le jeu dans un groupe de `SKILL_GROUPS` (compétence de l'espace parents).
- [ ] `js/features/players/profiles-ui.js` : une entrée dans `GAME_LIST` (clé, emoji, nom) pour « choisir un jeu ».
- [ ] À partir de la v52 (compagnons) : ses **deux niveaux d'indice** (contrat `hintsFor`).

## 4. Brancher et vérifier
- [ ] `npm run sync` : met à jour `index.html` et `sw.js` depuis le manifeste.
- [ ] `npm run api` si le jeu expose volontairement un nom à d'autres slices.
- [ ] `npm test` vert : architecture et frontières, test de fumée, tests de jeu.
- [ ] Cache `sw.js` incrémenté, PRD et TODO à jour.
