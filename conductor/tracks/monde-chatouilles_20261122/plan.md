<!-- Gabarit cothon 0.4.0 (setting-up-docs), adopté dans Conductor (cothon 0.2.0-2 et 0.4.0-6) : une nouvelle track part de ce fichier. -->
# Plan : 🪶 Le Monde des Chatouilles

Spec : [spec.md](spec.md). Workflow : [workflow.md](../../workflow.md). Checklists : [mini-jeu](../../checklist-mini-jeu.md), [île](../../checklist-ile.md).

Trois phases, **une PR livrable seule par phase** (chaque merge est en production une minute après). Ordre imposé : phase 1, puis phase 2, puis phase 3. Ce que chaque phase consomme : la phase 2 utilise le son `giggle` et la classe `giggle-wiggle` créés par la phase 1 ; la phase 3 utilise `giggle`, `giggle-wiggle` et les deux jeux (`coding`, `sentence`, jeu favori de l'île), donc les phases 1 et 2. Un jeu livré seul apparaît dans « choisir un jeu » sur toutes les îles. La phase 3 attend aussi que la track `saison3-ouverture` soit sur `main` et que l'île précédente, `coffres`, soit dans `WORLDS` (ordre : crayons, dumplings, coffres, chatouilles, concert). À chaque phase : rebase sur `main`, `bun run sync`, `bun run check` vert, puis la livraison selon la règle « Track livrée en plusieurs PR » de [workflow.md](../../workflow.md) (section « Fin de track : livraison ») : phases 1 et 2 par `bun run release patch "résumé"`, phase 3 (la dernière) par `bun run release track "résumé"`, numéro pris sur `main` après rebase.

Les numéros entre parenthèses renvoient aux lignes de « Comportement attendu » de la spec.

## Tâches

### Phase 1 : « Le chemin de la plume » (`coding`), le son et l'animation du rire
- [ ] 1.1 Tests d'abord, dans `test/chatouilles.test.js` (nouveau fichier, harnais copié de `test/musique.test.js`), section « Le chemin de la plume » :
  - `codingRound(1..5)` égale T1 (1) ;
  - 300 générations par palier : contraintes G4 et G5, aucune grille de secours (2, 3) ;
  - les 5 grilles T2 donnent les `len` et `turns` de T2 avec `codingBest`, et `codingRun(grille, best.prog).end === 'goal'` (jamais de comparaison de `prog` mot pour mot) ; les exemples de G0, G5 et G7 (forme de la grille, retour `{ cfg, grid, best, tries, fallback }`, `codingRun` et ses fins `goal`, `rock`, `edge`, `stop`, `empty`) ;
  - palette et programme : ajout, mot dit, programme plein (C7), retrait (4 à 7) ;
  - Go à vide (C6), heurt d'un cactus et du bord (C9, C10), arrêt ailleurs (C11), même grille et même programme après l'erreur, retour au départ à la modification (8, 11 à 13) ;
  - palier 1 : la grille ne change pas après 3 erreurs (14) ; palier 2 : départ vers le haut (15) ;
  - victoire : `giggle-wiggle` sur l'ami, C8 dit (10).
  Ils échouent avant le code.
- [ ] 1.2 Tests dans les fichiers existants : ajouter `state.gameCounts["coding"]=1` à la ligne du test « variété » de `test/smoke.test.js` (`checklist-mini-jeu.md`, étape 10) ; vérificateur `coding` dans `test/games.test.js` (il rejoue la solution sur la grille lue dans le DOM : `#cd-grid` et ses `data-*`, règles G1 à G3), entrée `coding` dans `test/smoke.test.js` (ouverture, une erreur garde la grille, palier et âge), son `giggle` dans la liste de `test/sounds.test.js` (31). Tout ajout de liste dans un test existant ajoute, n'enlève rien.
- [ ] 1.3 `js/entities/difficulty/rounds-saison3.js` (le créer s'il n'existe pas encore, le déclarer dans la slice `difficulty` de `js/slices.cjs`) : `codingRound` (T1) ; dans `difficulty.js`, les lignes `coding` de `NO_TIMER_KINDS` et `GENEROUS_KINDS`, et `tierValue` ajouté à son `export` s'il n'y est pas déjà (pas à `index.js` ; `checklist-ile.md` section 2 bis) ; typé strictement (`@typedef CodingRound`, `@param {number} dd`, `@returns {CodingRound}`, spec D23), `coding` dans `NO_TIMER_KINDS` et le barème `generous` ; export, et ré-export de `codingRound` dans `js/entities/difficulty/index.js` (comme `nestingRound`).
- [ ] 1.4 `js/entities/difficulty/game-types.js` : `coding` dans `GAME_TYPES` et `GAME_LIST` (🪶 « Le chemin de la plume »), pas dans les tranches `max: 4` et `max: 5` (28).
- [ ] 1.5 `js/features/adaptive/adaptive.js` (`PROGRESS_CHEERS.coding`) et `js/features/parents/parents.js` (`coding` dans `formes`) (30).
- [ ] 1.6 `js/shared/ui/sound.js` : `SOUND_PALETTE.giggle` et `SOUND_FAMILY.giggle` (T5) ; `js/shared/styles/design-system-v21.css` : `.giggle-wiggle` et `@keyframes giggleWiggle`, avec le repli `prefers-reduced-motion`.
- [ ] 1.7 `js/features/minigames/coding/coding.js`, `coding.css`, `index.js` : génération (G1 à G6), rendu, trajet pas à pas, erreurs, textes C1 à C11, indices H1, `setSolution`, `registerGame('coding', renderCoding)`, `registerHints('coding', codingHints)`.
- [ ] 1.8 `js/slices.cjs` : slice `minigame-coding` (couche `features`, après le moteur), sa feuille dans `css` et dans `CSS_ORDER` avant `island.css` ; `import '../features/minigames/coding/index.js';` dans `js/app/main.js` (avec les autres mini-jeux, comme `nesting` ligne 55) ; puis `bun run sync`.
- [ ] 1.9 `bun run typecheck` et `bun run check` verts ; `bun run verify` avant la PR.
- [ ] 1.10 Doc : ligne « 🪶 Le chemin de la plume » dans le PRD (section de la version), `conductor/tracks.md` (phase 1 livrée).
- [ ] 1.11 Conductor : vérification manuelle (S17) par Amrou sur téléphone.

### Phase 2 : « La phrase rigolote » (`sentence`), après la phase 1
- [ ] 2.1 Tests d'abord dans `test/chatouilles.test.js`, section « La phrase rigolote » :
  - `sentenceRound(1..5)` égale T3 (18) ;
  - aucune clé de jeu en double (`GAME_TYPES` et `GAME_LIST` sans doublon, `sentence` et `coding` une seule fois) ;
  - la banque : tailles, permutations de `ok`, `pic` aux tailles 3 et 4, lettres du palier 1 (R2) (26) ;
  - `sentenceAccepts` suit R1, y compris les quatre `ok` de T4, et chaque `ok` est une permutation exacte des étiquettes ;
  - ordre de départ jamais accepté (19) ; toucher, retirer, mot dit sans point (20, 21) ; « Lis ma phrase » (22, S5) ;
  - erreur 1 : étiquettes en place, S4 dit après la phrase ; erreur 2 : autre phrase (24) ; victoire (23).
- [ ] 2.2 Ajouter `state.gameCounts["sentence"]=1` à la ligne du test « variété » de `test/smoke.test.js` (`checklist-mini-jeu.md`, étape 10) ; vérificateur `sentence` dans `test/games.test.js` (la phrase construite par la solution est acceptée par R1, recalculée par le test à partir des `.st-tile`) ; entrée `sentence` dans `test/smoke.test.js`.
- [ ] 2.3 `rounds-saison3.js` (`sentenceRound` typé strictement avec `@typedef SentenceRound`, sans minuteur, barème `generous`) et son ré-export dans `js/entities/difficulty/index.js`, `game-types.js` (📝 « La phrase rigolote », 6 ans et plus), `adaptive.js`, `parents.js` (`lire`) (28 à 30).
- [ ] 2.4 `js/features/minigames/sentence/sentence.js`, `sentence.css`, `index.js` : banque T4, rendu, textes S1 à S5, indices H2, `setSolution`, inscription.
- [ ] 2.5 `js/slices.cjs` : slice `minigame-sentence` ; `import '../features/minigames/sentence/index.js';` dans `js/app/main.js` ; `bun run sync` ; `bun run typecheck`, `bun run check` et `bun run verify` verts.
- [ ] 2.6 Doc : PRD, `conductor/tracks.md`.
- [ ] 2.7 Conductor : vérification manuelle (S18) avec la joueuse.

### Phase 3 : l'île (après les phases 1 et 2, `saison3-ouverture` et l'île `coffres`)
- [ ] 3.1 Tests d'abord dans `test/chatouilles.test.js`, sections « L'île », « Ouverture au niveau 94 », « Série de squishies Guilis », « Les chatouilles », « Le jeu de l'île », « Histoire » :
  - aucune clé en double, table par table (`CHARACTERS`, `COMPANIONS`, `ITEMS`, `CRAFTED`, `DECOS`, `SQUISHIES`, `SQUISHY_SERIES`, `GAME_TYPES` : chaque table sans doublon, ce que garantit déjà un objet JS, donc le test compare les clés nouvelles de I2 à I5 à la liste des clés de la même table avant l'ajout, figée dans le test) ; aucun id ni prénom de personnage n'est aussi un id ou un prénom de compagnon (le test échoue si on remet `lili`, Lili ou `fanionsD`) ; un squishy peut porter l'id de son personnage (`guili`, comme `boumbo`) ;
  - `WORLDS.chatouilles` contient I1, rang par `indexOf` (juste après `coffres`, jamais une liste exacte de `worldsOf(3)`), `worldGame` (33) ; verrouillée à 93, ouverte avec son chapitre à 94 (32) ;
  - 4 personnages, butins, 3 répliques, `tickle`, dessins (34) ; objets, recettes, décorations, `favoritesOf` (35) ;
  - série `guilis` (36) ; musique et thème (37) ;
  - toucher sur la scène : rire de bonjour sur `#scene .isle-char[data-char="<id>"] .emoji` (`helloLaugh`, pas de tirage d'envie) puis dialogue après 600 ms ; au repos : dialogue tout de suite ; autre île : inchangé (38 à 40) ;
  - dialogue avec `Math.random` forcé : bouton présent (41), refus (42), rires puis stop au `max`-ième toucher (43, 44), repos et retour après `tickleRestUntil` remis à 0 (45) ;
  - chapitre I8, récompense une seule fois, autre énigme après une erreur (46, 47) ; épisodes I9 aux missions 2, 4 et 7, jamais par Plumette (48).
- [ ] 3.1b Tests existants à effectif figé (spec, « 2 quater ») : dans `test/smoke.test.js` (vers 755), nombre de personnages + 4 ; dans `test/squishies.test.js`, `'guilis'` à la fin des séries attendues (vers 86) et nombre de squishies + 6 (vers 91 et 107) ; valeurs de départ lues sur `main` après rebase. Ils échouent avant le code.
- [ ] 3.2 Entités (dessins dans `ART_S3` de `characters-art-saison3.js`, préparé par `saison3-ouverture` ; `characters-art.js` n'est pas modifié) : `worlds.js` (I1, et `giggly?: boolean` dans `@typedef World`), `characters.js` (I2, I3, et `@typedef CharacterTickle` plus `tickle?: CharacterTickle` dans `@typedef Character`, spec D23), `characters-art-saison3.js` (4 dessins nouveaux dans `ART_S3`, sans toucher aux autres), `items.js` (I4), `squishies.js` (I5).
- [ ] 3.3 Features : `island.js` (`ISLE_SCENERY.chatouilles`, toucher K5), `tickle.js` (nouveau, K1 à K4, typé strictement comme tout le code de la track ; exporté par l'`index.js` de la slice `island` si une autre slice en a besoin), `island-view.js` (bouton du dialogue), `island.css` (règle `.emoji.giggle-wiggle` de la scène et son repli `prefers-reduced-motion`), `SQ_ART` des 6 modèles dans `js/features/squishies/squishy-art.js` (table vers la ligne 55, type `SqArt`), `story.js` (I8), `episodes.js` (I9), `music.js` (I6), thème I7 dans `design-system-v21.css`.
- [ ] 3.4 Morceau n° 4 de la carte de Zap : tests 46 et 46b (`zapMapPieces() === 4`, phrase dite exacte de 46b, `.story-zapmap.happy svg.zap-map[data-found="4"]`, `zapMapSay(4)` dit après le `success`) ; aucun code de carte à écrire.
- [ ] 3.5 `js/slices.cjs` : `js/features/island/tickle.js` dans les fichiers de la slice `island` ; `bun run sync` ; `bun run typecheck`, `bun run check` et `bun run verify` verts.
- [ ] 3.6 Doc : PRD (idée de la joueuse visible), `conductor/tracks.md` (track faite), `conductor/niveaux.md` (la phrase « Dans le jeu, aujourd'hui » cite le Monde des Chatouilles).
- [ ] 3.7 Conductor : vérification manuelle (S19 à S21) avec Amrou et la joueuse.

## Preuves

Chaque affirmation pointe vers une preuve : commande exacte, code de sortie, chemin de la sortie. `build-only` n'est jamais une preuve de comportement.

| Ligne du smoke test | Résultat | Niveau | Preuve |
|---|---|---|---|
| S1 à S3 | à faire | test-verified | `bun run test chatouilles` (exit 0) |
| S4, S5 | à faire | runtime-verified | `bun run test chatouilles` (exit 0) |
| S6, S10 | à faire | test-verified | `bun run test games` (exit 0) |
| S7 | à faire | test-verified | `bun run test companions` (exit 0) |
| S8, S9 | à faire | test-verified · runtime-verified | `bun run test chatouilles` (exit 0) |
| S11 | à faire | test-verified | `bun run test chatouilles` et `bun run test smoke` (exit 0) |
| S12 | à faire | test-verified | `bun run test sounds` (exit 0) |
| S13 à S16 | à faire | runtime-verified | `bun run test chatouilles` (exit 0) |
| S17 à S21 | à faire | 👤 | compte rendu d'Amrou dans la PR |

## Journal de décisions

En ajout seul : une décision fausse reçoit une nouvelle ligne qui la remplace, on ne modifie ni ne supprime une ligne.

| # | Décision | Décidé par | Pourquoi | Preuve | Résultat |
|---|---|---|---|---|---|
| 1 | Trois phases : `coding`, `sentence`, puis l'île | politique | un mini-jeu livré seul est utile partout ; l'île attend `saison3-ouverture` | brief de la saison 3 (politique « Livraison par phases ») | gardée |
| 2 | Paliers de `coding` calés sur le programme (CP : 10 instructions dont 2 virages ; CE1 : 15 dont 4) | spec | D2 | essai du générateur par le rédacteur : 0 échec sur 2 000 grilles par palier | gardée |
| 3 | Clés renommées après le testeur à blanc : `yoyo` (déjà « Yo-yo doux » des Jouets) devient `yoyofarceur`, `fanionsD` (pris par la spec Crayons, île plus basse) devient `fanionsrireD`, la loutre `lili` (compagne Lili) devient `lulu` (Lulu) ; l'objet existant `yoyo` n'est pas touché | testeur à blanc, tour 1 | collisions trouvées par `grep -rnw` dans `js/` et les specs de la saison 3 | `js/entities/item/items.js` (`yoyo`), `js/entities/companion/companions.js:77` | gardée |
| 4 | Toucher sur la scène = « rire de bonjour », pas une chatouille ; `ticklish` devient `giggly`, `tickle-laugh` devient `giggle-wiggle`, `TICKLE_OPEN_DELAY` devient `HELLO_LAUGH_DELAY` ; phases ordonnées 1, 2, 3 | testeur à blanc, tour 2 (défaut de Claude pour le rire de bonjour, à juger par Amrou) | cohérence du message de consentement ; dépendances entre phases | spec D16b | gardée |

## Écarts et non vérifié

- Les tests d'onglets de la carte (3 onglets) sont dans la track Crayons, pas ici.
- L'écoute du son `giggle`, le rendu des dessins et le ressenti des chatouilles sont des lignes 👤.
