# Checklist : ajouter un mini-jeu

Architecture en feature slices (v51), en modules ES natifs (v54). Exemple de référence : « Assembler l'image » (`jigsaw`).
Remplacer `<cle>` par la clé du jeu (ex. `nesting`) et `<Jeu>` par son nom de fonction (ex. `renderNesting`).

## 1. Tests d'abord
- [ ] `test/smoke.test.js` : le jeu s'ouvre, une bonne réponse avance, une mauvaise relance une **autre** question (anti-devinette), la difficulté suit le palier et l'âge.
- [ ] `test/games.test.js` : le jeu est joué jusqu'à la victoire à chaque palier (ajouter son « solveur » s'il en faut un).
  - Un jeu à geste (tracer au doigt, comme `trace`) ne se clique pas : chaque élément de sa solution porte `data-pts` (les points à suivre, unités du carré) et `data-pad` (l'id du carré). `playStep` et `traceAlong` de `test/tools/gestures.js` le jouent ; `test/games.test.js` et `test/companions.test.js` passent déjà par `playStep`.
- [ ] `test/companions.test.js` : ses indices sont vérifiés automatiquement (2 niveaux, anti-devinette, jeu gagnable après les indices).
- [ ] `test/smoke.test.js`, test « variété : les 2 jeux jamais essayés remontent en priorité » : ajouter `state.gameCounts["<cle>"]=1` à la liste. Un jeu absent de cette liste compte 0 partie, comme les deux jeux que le test attend en tête, et le fait échouer au hasard. C'est un ajout, aucune vérification n'est affaiblie.
- [ ] `bun run check` échoue pour la bonne raison.

## 2. La slice du jeu
- [ ] `js/features/minigames/<cle>/<cle>.js` : la fonction `<Jeu>()`. Elle utilise :
  - le moteur (`setupLives`, `livesBar`, `setSolution`, `stepOk`, `loseLife`, `onMissionWin`, `scheduleRetry`…) ;
  - la fenêtre (`gameHeader`, `bindQuit`) ;
  - les indices (`registerHints`, `setHintQuestion`).

  Le fichier **importe** tout cela depuis les `index.js` de leurs slices :
  ```js
  import { setupLives, onMissionWin, registerGame } from '../../minigame-engine/index.js';
  import { gameHeader, bindQuit } from '../../screen/index.js';
  ```
- [ ] À la fin du fichier : `registerGame('<cle>', <Jeu>);`. Le moteur ne connaît pas la liste des jeux.
- [ ] `js/features/minigames/<cle>/index.js` : `import './<cle>.js';`. Le jeu n'expose rien : il s'inscrit au chargement.
- [ ] `js/features/minigames/<cle>/<cle>.css` si besoin.
- [ ] `js/slices.cjs` : une slice `minigame-<cle>` (couche `features`), placée avec les autres mini-jeux, après le moteur. Sa feuille de style va dans `css` **et** dans `CSS_ORDER` (en fin de liste, avant `island.css`).

## 3. Les entités et features à compléter
> Tout `js/` est vérifié en TypeScript strict (`tsconfig.json`, v66.11) : le nouveau jeu, sa fonction de palier (`<cle>Round`) et les tables qu'il ajoute sont typés en JSDoc (`@param`, `@returns`, `@typedef` de l'objet renvoyé). Jamais `any` ni `@ts-ignore`.


- [ ] `js/entities/difficulty/game-types.js` : la clé dans `GAME_TYPES`, et dans les tranches d'âge de `AGE_GAME_TYPES` où le jeu est proposé.
- [ ] Qualité du code ajouté : le job CI « violations ajoutées » compare la PR à sa base avec le preset `.cothon/presets/oxlint/qualite.json` (un nouveau fichier fait 300 lignes au plus, une fonction 50 lignes et 3 paramètres au plus, complexité 20). Un jeu long se découpe en fichiers frères dans sa slice, et ses tests en plusieurs suites. Vérifier avant la PR : `bash .cothon/bin/new-violations.sh --base origin/main -- bash "$PWD/.cothon/bin/quality-check.sh" complexite --project .`
- [ ] Taille des fichiers (`max-lines` à 800) : voir `conductor/checklist-ile.md`, section 2 bis (les jeux de la saison 3 mettent leur fonction de palier dans `js/entities/difficulty/difficulty-s3.js`, sur le modèle de `difficulty-s2.js` ; ce fichier est à la limite de 300 lignes : les jeux suivants prennent un fichier frère, comme `difficulty-s3-concert.js`).
- [ ] `js/entities/difficulty/difficulty.js` : ses paramètres par palier (une fonction `<cle>Round(dd)` ou équivalent), ses essais dans `LIVES_TABLE`, et `NO_TIMER_KINDS` s'il ne doit pas avoir de minuteur.
- [ ] `js/features/adaptive/adaptive.js` : sa phrase de progrès dans `PROGRESS_CHEERS`, et `GAME_TIER_MAX` s'il va au-delà du palier 5.
- [ ] `js/features/parents/parents.js` : le jeu dans un groupe de `SKILL_GROUPS` (compétence de l'espace parents).
- [ ] `js/entities/difficulty/game-types.js` : une entrée dans `GAME_LIST` (clé, emoji, nom) pour « choisir un jeu ».
- [ ] **Ses deux niveaux d'indice** (v52, contrat de `js/features/hints/hints.js`) :
  - à la fin du fichier, `registerHints('<cle>', question => [indice 1, indice 2])` : chaque niveau `{ say, fx }` (`fx.glow`, `fx.marks`, `fx.strike`, `fx.dim`, `fx.html`, `fx.run`) ;
  - après chaque `openModal`, `setHintQuestion('<cle>', question, { choices:'.sélecteur-des-réponses' })` ; une relance passe une **nouvelle** question (indices remis à zéro) ;
  - indice 1 = la méthode, indice 2 = le début du raisonnement ; **jamais la réponse** ; une seule réponse écartée au plus, au niveau 2 et avec 4 choix ou plus (le moteur le vérifie) ;
  - `test/companions.test.js` parcourt chaque jeu inscrit : il échoue si le jeu n'a pas d'indices.

## 4. Brancher et vérifier
- [ ] `js/app/main.js` : l'import de la slice du jeu (`import '../features/minigames/<cle>/index.js';`), avec les autres mini-jeux. Sans lui, le jeu n'est jamais chargé.
- [ ] `js/entities/difficulty/index.js` : la fonction de palier du jeu (`<cle>Round` ou équivalent) dans les exports. Sans elle, la slice du jeu ne peut pas l'importer.
- [ ] `bun run sync` : met à jour `index.html` et la liste des fichiers mis en cache par `sw.js` depuis le manifeste.
- [ ] Si le jeu expose volontairement un nom à d'autres slices : l'exporter et l'ajouter à son `index.js`.
- [ ] `bun run check` vert : architecture et imports, vrais modules, test de fumée, tests de jeu.
- [ ] Cache `sw.js` incrémenté, PRD et TODO à jour.
