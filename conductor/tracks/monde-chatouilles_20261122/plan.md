<!-- Gabarit cothon 0.4.0 (setting-up-docs), adopté dans Conductor (cothon 0.2.0-2 et 0.4.0-6) : une nouvelle track part de ce fichier. -->
# Plan : 🪶 Le Monde des Chatouilles

Spec : [spec.md](spec.md). Workflow : [workflow.md](../../workflow.md). Checklists : [mini-jeu](../../checklist-mini-jeu.md), [île](../../checklist-ile.md).

Trois phases, **une PR livrable seule par phase** (chaque merge est en production une minute après). Ordre imposé : phase 1, puis phase 2, puis phase 3. Ce que chaque phase consomme : la phase 2 utilise le son `giggle` et la classe `giggle-wiggle` créés par la phase 1 ; la phase 3 utilise `giggle`, `giggle-wiggle` et les deux jeux (`coding`, `sentence`, jeu favori de l'île), donc les phases 1 et 2. Un jeu livré seul apparaît dans « choisir un jeu » sur toutes les îles. La phase 3 attend aussi que la track `saison3-ouverture` soit sur `main` et que l'île précédente, `coffres`, soit dans `WORLDS` (ordre : crayons, dumplings, coffres, chatouilles, concert). À chaque phase : rebase sur `main`, `bun run sync`, `bun run check` vert, puis la livraison selon la règle « Track livrée en plusieurs PR » de [workflow.md](../../workflow.md) (section « Fin de track : livraison ») : phases 1 et 2 par `bun run release patch "résumé"`, phase 3 (la dernière) par `bun run release track "résumé"`, numéro pris sur `main` après rebase.

Les numéros entre parenthèses renvoient aux lignes de « Comportement attendu » de la spec.

## Tâches

### Phase 1 : « Le chemin de la plume » (`coding`), le son et l'animation du rire
- [x] 1.1 Tests d'abord, dans `test/chatouilles.test.js` (nouveau fichier, harnais copié de `test/musique.test.js`), section « Le chemin de la plume » :
  - `codingRound(1..5)` égale T1 (1) ;
  - 300 générations par palier : contraintes G4 et G5, aucune grille de secours (2, 3) ;
  - les 5 grilles T2 donnent les `len` et `turns` de T2 avec `codingBest`, et `codingRun(grille, best.prog).end === 'goal'` (jamais de comparaison de `prog` mot pour mot) ; les exemples de G0, G5 et G7 (forme de la grille, retour `{ cfg, grid, best, tries, fallback }`, `codingRun` et ses fins `goal`, `rock`, `edge`, `stop`, `empty`) ;
  - palette et programme : ajout, mot dit, programme plein (C7), retrait (4 à 7) ;
  - Go à vide (C6), heurt d'un cactus et du bord (C9, C10), arrêt ailleurs (C11), même grille et même programme après l'erreur, retour au départ à la modification (8, 11 à 13) ;
  - palier 1 : la grille ne change pas après 3 erreurs (14) ; palier 2 : départ vers le haut (15) ;
  - victoire : `giggle-wiggle` sur l'ami, C8 dit (10).
  Ils échouent avant le code.
- [x] 1.2 Tests dans les fichiers existants : ajouter `state.gameCounts["coding"]=1` à la ligne du test « variété » de `test/smoke.test.js` (`checklist-mini-jeu.md`, étape 10) ; vérificateur `coding` dans `test/games.test.js` (il rejoue la solution sur la grille lue dans le DOM : `#cd-grid` et ses `data-*`, règles G1 à G3), entrée `coding` dans `test/smoke.test.js` (ouverture, une erreur garde la grille, palier et âge), son `giggle` dans la liste de `test/sounds.test.js` (31). Tout ajout de liste dans un test existant ajoute, n'enlève rien.
- [x] 1.3 `js/entities/difficulty/difficulty-s3.js` (s'il n'existe pas encore : le créer sur le modèle de `difficulty-s2.js`, avec `import { tierValue } from './difficulty.js'`, le déclarer dans la slice `difficulty` de `js/slices.cjs` après `difficulty-s2.js`, et ajouter à `js/entities/difficulty/index.js` un bloc `export { … } from './difficulty-s3.js'` ; `checklist-ile.md` section 2 bis, spec D24) : `codingRound` (T1), typé strictement (`@typedef CodingRound`, `@param {number} dd`, `@returns {CodingRound}`, spec D23), exporté et ajouté au bloc de réexport de `index.js` ; dans `difficulty.js`, seulement les lignes `coding` de `NO_TIMER_KINDS` et `GENEROUS_KINDS` (barème `generous`), après `wc -l`.
- [x] 1.4 `js/entities/difficulty/game-types.js` : `coding` dans `GAME_TYPES` et `GAME_LIST` (🪶 « Le chemin de la plume »), pas dans les tranches `max: 4` et `max: 5` (28).
- [x] 1.5 `js/features/adaptive/adaptive.js` (`PROGRESS_CHEERS.coding`) et `js/features/parents/parents.js` (`coding` dans `formes`) (30).
- [x] 1.6 `js/shared/ui/sound.js` : `SOUND_PALETTE.giggle` et `SOUND_FAMILY.giggle` (T5) ; `js/shared/styles/design-system-v21.css` : `.giggle-wiggle` et `@keyframes giggleWiggle`, avec le repli `prefers-reduced-motion`.
- [x] 1.7 `js/features/minigames/coding/coding.js`, `coding.css`, `index.js` : génération (G1 à G6), rendu, trajet pas à pas, erreurs, textes C1 à C11, indices H1, `setSolution`, `registerGame('coding', renderCoding)`, `registerHints('coding', codingHints)`.
- [x] 1.8 `js/slices.cjs` : slice `minigame-coding` (couche `features`, après le moteur), sa feuille dans `css` et dans `CSS_ORDER` avant `island.css` ; `import '../features/minigames/coding/index.js';` dans `js/app/main.js` (avec les autres mini-jeux, comme `nesting` ligne 55) ; puis `bun run sync`.
- [x] 1.9 `bun run typecheck` et `bun run check` verts ; `bun run verify` avant la PR.
- [x] 1.10 Doc : ligne « 🪶 Le chemin de la plume » dans le PRD (section de la version), `conductor/tracks.md` (phase 1 livrée). Fait à la livraison (v71) : section du PRD, registre.
- [x] 1.11 Conductor : vérification manuelle (S17) par Amrou sur téléphone. Non faite par l'agent (Amrou n'est pas joignable) : proposée dans le corps de la PR.

### Phase 2 : « La phrase rigolote » (`sentence`), après la phase 1
- [x] 2.1 Tests d'abord dans `test/chatouilles.test.js`, section « La phrase rigolote » :
  - `sentenceRound(1..5)` égale T3 (18) ;
  - aucune clé de jeu en double (`GAME_TYPES` et `GAME_LIST` sans doublon, `sentence` et `coding` une seule fois) ;
  - la banque : tailles, permutations de `ok`, `pic` aux tailles 3 et 4, lettres du palier 1 (R2) (26) ;
  - `sentenceAccepts` suit R1, y compris les quatre `ok` de T4, et chaque `ok` est une permutation exacte des étiquettes ;
  - ordre de départ jamais accepté (19) ; toucher, retirer, mot dit sans point (20, 21) ; « Lis ma phrase » (22, S5) ;
  - erreur 1 : étiquettes en place, S4 dit après la phrase ; erreur 2 : autre phrase (24) ; victoire (23).
- [x] 2.2 Ajouter `state.gameCounts["sentence"]=1` à la ligne du test « variété » de `test/smoke.test.js` (`checklist-mini-jeu.md`, étape 10) ; vérificateur `sentence` dans `test/games.test.js` (la phrase construite par la solution est acceptée par R1, recalculée par le test à partir des `.st-tile`) ; entrée `sentence` dans `test/smoke.test.js`.
- [x] 2.3 `difficulty-s3.js` (`sentenceRound` typé strictement avec `@typedef SentenceRound`) et son ajout au bloc `export { … } from './difficulty-s3.js'` de `js/entities/difficulty/index.js`, `difficulty.js` (lignes `sentence` de `NO_TIMER_KINDS` et `GENEROUS_KINDS`), `game-types.js` (📝 « La phrase rigolote », 6 ans et plus), `adaptive.js`, `parents.js` (`lire`) (28 à 30).
- [x] 2.4 `js/features/minigames/sentence/sentence.js`, `sentence.css`, `index.js` : banque T4, rendu, textes S1 à S5, indices H2, `setSolution`, inscription.
- [x] 2.5 `js/slices.cjs` : slice `minigame-sentence` ; `import '../features/minigames/sentence/index.js';` dans `js/app/main.js` ; `bun run sync` ; `bun run typecheck`, `bun run check` et `bun run verify` verts.
- [x] 2.6 Doc : PRD, `conductor/tracks.md`. Fait à la livraison (v71).
- [x] 2.7 Conductor : vérification manuelle (S18) avec la joueuse. Non faite par l'agent : proposée dans le corps de la PR.

### Phase 3 : l'île (après les phases 1 et 2, `saison3-ouverture` et l'île `coffres`)
- [x] 3.1 Tests d'abord dans `test/chatouilles.test.js`, sections « L'île », « Ouverture au niveau 94 », « Série de squishies Guilis », « Les chatouilles », « Le jeu de l'île », « Histoire » :
  - aucune clé en double, table par table (`CHARACTERS`, `COMPANIONS`, `ITEMS`, `CRAFTED`, `DECOS`, `SQUISHIES`, `SQUISHY_SERIES`, `GAME_TYPES` : chaque table sans doublon, ce que garantit déjà un objet JS, donc le test compare les clés nouvelles de I2 à I5 à la liste des clés de la même table avant l'ajout, figée dans le test) ; aucun id ni prénom de personnage n'est aussi un id ou un prénom de compagnon (le test échoue si on remet `lili`, Lili ou `fanionsD`) ; un squishy peut porter l'id de son personnage (`guili`, comme `boumbo`) ;
  - `WORLDS.chatouilles` contient I1, rang par `indexOf` (juste après `coffres`, jamais une liste exacte de `worldsOf(3)`), `worldGame` (33) ; verrouillée à 93, ouverte avec son chapitre à 94 (32) ;
  - 4 personnages, butins, 3 répliques, `tickle`, dessins (34) ; objets, recettes, décorations, `favoritesOf` (35) ;
  - série `guilis`, dont `SQ_BOX_COLORS.guilis` (36) ; musique et thème (37) ;
  - toucher sur la scène : rire de bonjour sur `#scene .isle-char[data-char="<id>"] .emoji` (`helloLaugh`, pas de tirage d'envie) puis dialogue après 600 ms ; au repos : dialogue tout de suite ; autre île : inchangé (38 à 40) ;
  - dialogue avec `Math.random` forcé : bouton présent (41), refus (42), rires puis stop au `max`-ième toucher (43, 44), repos et retour après `tickleRestUntil` remis à 0 (45) ;
  - chapitre I8, récompense une seule fois, autre énigme après une erreur (46, 47) ; épisodes I9 aux missions 2, 4 et 7, jamais par Plumette (48).
- [x] 3.1b Tests existants à effectif figé (spec, « 2 quater ») : dans `test/smoke.test.js` (vers 755), nombre de personnages + 4 ; dans `test/squishies.test.js`, `'guilis'` à la fin des séries attendues (vers 86) et nombre de squishies + 6 (vers 91 et 107) ; valeurs de départ lues sur `main` après rebase. Ils échouent avant le code.
- [x] 3.2 Entités, dans les fichiers `-s3` préparés vides par `saison3-ouverture` (`checklist-ile.md` section 2 bis, spec D24 ; mesurer chaque marge par `wc -l` avant d'ajouter) : `worlds.js` (I1, et `giggly?: boolean` dans `@typedef World`) ; `characters-s3.js` (I2 dans `CHARACTERS_S3`, puis `@typedef CharacterTickle` et `CHARACTER_TICKLES` de I3, spec D23 ; `characters.js` n'est pas modifié) et la ligne `export { CHARACTER_TICKLES } from './characters-s3.js';` dans `js/entities/character/index.js` ; `characters-art-s3.js` (4 dessins nouveaux dans `season3Art(ART, kit)`, sans toucher aux autres ; `characters-art.js` n'est modifié que si un outil manque à `ArtKit`, spec D19) ; `items.js` (I4) ; `squishies.js` (les 3 lignes de la série `guilis`) et `squishies-s3.js` (les 6 modèles de I5 dans `SQUISHIES_S3`).
- [x] 3.3 Features : `island-s3.js` (`ISLE_SCENERY_S3.chatouilles`), `island.js` (toucher K5), `tickle.js` (nouveau, K1 à K4, lit `CHARACTER_TICKLES`, typé strictement comme tout le code de la track ; exporté par l'`index.js` de la slice `island` si une autre slice en a besoin), `island-view.js` (bouton du dialogue), `island.css` (règle `.emoji.giggle-wiggle` de la scène et son repli `prefers-reduced-motion`), dessins des 6 modèles dans `SQ_ART_S3` de `js/features/squishies/squishy-art-s3.js` (préparé par `saison3-ouverture`, type `SqArt`, spec D24) et, dans `squishy-art.js`, la seule ligne `guilis: ['#FFF1B8', '#8A3D6B'],` à la fin de `SQ_BOX_COLORS`, `story-s3.js` (I8 dans `STORY_S3`), `episodes.js` (I9), `music.js` (I6), thème I7 dans `design-system-v21.css`.
- [x] 3.4 Morceau n° 4 de la carte de Zap : tests 46 et 46b (`zapMapPieces() === 4`, phrase dite exacte de 46b, `.story-zapmap.happy svg.zap-map[data-found="4"]`, `zapMapSay(4)` dit après le `success`) ; aucun code de carte à écrire.
- [x] 3.5 `js/slices.cjs` : `js/features/island/tickle.js` dans les fichiers de la slice `island` ; `bun run sync` ; `bun run typecheck`, `bun run check` et `bun run verify` verts.
- [x] 3.6 Doc : PRD (idée de la joueuse visible), `conductor/tracks.md` (track faite), `conductor/niveaux.md` (la phrase « Dans le jeu, aujourd'hui » cite le Monde des Chatouilles). Fait (v71).
- [x] 3.7 Conductor : vérification manuelle (S19 à S21) avec Amrou et la joueuse. Non faite par l'agent : proposée dans le corps de la PR.

## Preuves

Chaque affirmation pointe vers une preuve : commande exacte, code de sortie, chemin de la sortie. `build-only` n'est jamais une preuve de comportement.

| Ligne du smoke test | Résultat | Niveau | Preuve |
|---|---|---|---|
| S1 à S3 | réussi | test-verified | `bun run test chatouilles-coding` (exit 0) ; rouge constaté avant le code : « codingRound is not defined », « codingBuildRound is not defined » |
| S4, S5 | réussi | runtime-verified (jsdom) | `bun run test chatouilles-coding-ecran` (exit 0) ; rouge avant le code : « codingShow is not defined » |
| S6, S10 | réussi | test-verified | `bun run test games` (exit 0), contrôles indépendants `coding` et `sentence` |
| S7 | réussi | test-verified | `bun run test companions` (exit 0) ; `bun run test chatouilles-coding-parties chatouilles-sentence-ecran` (tables H1 et H2) |
| S8, S9 | réussi | test-verified · runtime-verified | `bun run test chatouilles-sentence` (exit 0) ; rouge avant le code : « SENTENCES is not defined », « sentenceShow is not defined » |
| S11 | réussi | test-verified | `bun run test chatouilles-coding chatouilles-sentence` et `bun run test smoke` (exit 0) |
| S12 | réussi | test-verified | `bun run test sounds` (exit 0) : trois glissés sinus, famille 0,9 |
| S13 à S16 | réussi | runtime-verified (jsdom) | `bun run test chatouilles-ile chatouilles-objets chatouilles-histoire chatouilles-guilis` (exit 0) ; rouge avant le code : « CHARACTER_TICKLES is not defined », « ISLE_SCENERY.chatouilles is not a function » |
| S17 à S21 | à faire | 👤 | compte rendu d'Amrou dans la PR |

Vérification complète : `bun run check` et `bun run verify`, sortie 0 (27/11/2026).

## Journal de décisions

En ajout seul : une décision fausse reçoit une nouvelle ligne qui la remplace, on ne modifie ni ne supprime une ligne.

| # | Décision | Décidé par | Pourquoi | Preuve | Résultat |
|---|---|---|---|---|---|
| 1 | Trois phases : `coding`, `sentence`, puis l'île | politique | un mini-jeu livré seul est utile partout ; l'île attend `saison3-ouverture` | brief de la saison 3 (politique « Livraison par phases ») | gardée |
| 2 | Paliers de `coding` calés sur le programme (CP : 10 instructions dont 2 virages ; CE1 : 15 dont 4) | spec | D2 | essai du générateur par le rédacteur : 0 échec sur 2 000 grilles par palier | gardée |
| 3 | Clés renommées après le testeur à blanc : `yoyo` (déjà « Yo-yo doux » des Jouets) devient `yoyofarceur`, `fanionsD` (pris par la spec Crayons, île plus basse) devient `fanionsrireD`, la loutre `lili` (compagne Lili) devient `lulu` (Lulu) ; l'objet existant `yoyo` n'est pas touché | testeur à blanc, tour 1 | collisions trouvées par `grep -rnw` dans `js/` et les specs de la saison 3 | `js/entities/item/items.js` (`yoyo`), `js/entities/companion/companions.js:77` | gardée |
| 4 | Toucher sur la scène = « rire de bonjour », pas une chatouille ; `ticklish` devient `giggly`, `tickle-laugh` devient `giggle-wiggle`, `TICKLE_OPEN_DELAY` devient `HELLO_LAUGH_DELAY` ; phases ordonnées 1, 2, 3 | testeur à blanc, tour 2 (défaut de Claude pour le rire de bonjour, à juger par Amrou) | cohérence du message de consentement ; dépendances entre phases | spec D16b | gardée |
| 5 | Paliers dans `difficulty-s3.js` (modèle de `difficulty-s2.js`, `tierValue` déjà exporté), au lieu de `rounds-saison3.js` et d'un export de `tierValue` à ajouter | règle commune (`checklist-ile.md` section 2 bis) | la v66.16 a posé le modèle `-s2` et abaissé `max-lines` à 800 | `.oxlintrc.json:40` ; `js/entities/difficulty/difficulty-s2.js:4` ; `difficulty.js:665` | remplace la tâche 1.3 d'avant |
| 6 | Personnages, dessins, squishies, chapitre et paysage dans les fichiers `-s3` (`characters-s3.js`, `characters-art-s3.js` par `season3Art(ART, kit)`, `squishies-s3.js`, `story-s3.js`, `island-s3.js`) ; plus de `ART_S3` ni de `characters-art-saison3.js` | règle commune (`checklist-ile.md` section 2 bis) | la v66.16 a posé le modèle `-s2` ; avec cinq îles, `characters.js`, `story.js`, `squishies.js` et `island.js` dépasseraient 800 lignes | `conductor/checklist-ile.md` (section 2 bis) | remplace D19 et les tâches 3.2 et 3.3 d'avant |
| 7 | La fiche de chatouilles devient la table `CHARACTER_TICKLES` de `characters-s3.js` (réexportée par `js/entities/character/index.js`) au lieu d'un champ `tickle` de `@typedef Character` | rédacteur, à juger à la revue par Amrou | `characters.js` fait 798 lignes et `saison3-ouverture` y ajoute l'import et l'étalement de `CHARACTERS_S3` : le `@typedef CharacterTickle` et le champ `tickle?` n'y tiennent plus | `wc -l js/entities/character/characters.js` (798, le 22/11/2026) | remplace la partie `Character` de D23 |
| 8 | Les dessins des 6 squishies (`SQ_ART`) vont dans `SQ_ART_S3` de `squishy-art-s3.js`, préparé vide par `saison3-ouverture`, pas dans `squishy-art.js` | règle commune (`checklist-ile.md` section 2 bis, complétée le 22/11/2026) | `squishy-art.js` fait 640 lignes et une île y coûte environ 54 : avec cinq îles il dépasserait 800 | `conductor/checklist-ile.md` (section 2 bis) ; `wc -l js/features/squishies/squishy-art.js` (640) | nouvelle |
| 9 | Boîte `guilis` : `SQ_BOX_COLORS.guilis = ['#FFF1B8', '#8A3D6B']` (jaune plume et prune du thème I7) | défaut de Claude, à juger à la revue par Amrou | comme les autres îles de la saison 3, la série a sa couleur de boîte ; le rose du thème se confondrait avec la boîte des `desserts` (`#FFB8D6`) | `js/features/squishies/squishy-art.js:604-614` ; spec I7 | nouvelle |

| 10 | Une seule PR pour toute la track, livrée par `bun run release track` (v71), empilée sur la PR de `monde-coffres` | Amrou (consigne du workflow du 26/11/2026) | prime sur le découpage en trois PR écrit plus haut | corps de la PR | remplace la livraison par phases de la ligne 1 |
| 11 | Les tests tiennent en neuf suites `test/chatouilles-*.test.js` et un harnais `test/tools/chatouilles.js`, pas dans un seul `test/chatouilles.test.js` | agent | plafond de 300 lignes par fichier et 50 lignes par fonction du job « violations ajoutées » (`checklist-ile.md`, section 2 bis) ; `bun run test chatouilles` les lance toutes | `.cothon/presets/oxlint/qualite.json` | nouvelle |
| 12 | `coding.js` découpé d'emblée en quatre fichiers (`coding-grid.js`, `coding-draw.js`, `coding-hints.js`, `coding.js`), et la banque de phrases à part (`sentence-bank.js`) | agent | même plafond de 300 lignes ; la spec prévoyait `coding-grid.js` seulement au-delà de 800 lignes | `wc -l js/features/minigames/coding/*.js` | nouvelle |
| 13 | `sentenceRound` calcule `{ n: palier + 2, pic: palier <= 2 }` au lieu d'un tableau lu par `tierValue` | agent | `difficulty-s3.js` devait rester à 300 lignes au plus ; les valeurs sont celles de T3, comparées une à une par le test | `test/chatouilles-sentence.test.js` (T3) | nouvelle |
| 14 | Une fonction partagée `giggle(el)` dans `js/shared/ui/feedback.js` (classe `giggle-wiggle` relancée et son `giggle`) | agent | trois appelants (`coding`, `sentence`, l'île) ; la spec décrit le geste sans nommer de fonction | `js/shared/ui/feedback.js` | nouvelle |
| 15 | Le premier pas du trajet part 450 ms après « Go », comme les suivants | agent, défaut le plus simple | la spec dit « une instruction toutes les 450 ms » sans préciser le premier ; ce temps laisse voir la plume revenir au départ | `coding.js` (`codingGo`) | à juger par Amrou (S17) |
| 16 | Quand l'étiquette posée finit la phrase, le mot seul n'est pas dit : la phrase entière l'est tout de suite | agent | « une phrase dite = un seul `speak` » : le mot serait coupé par la phrase | `sentence.js` (`sentenceTap`) | à juger par Amrou (S18) |
| 17 | La deuxième erreur sur une phrase garde les essais déjà perdus (la relance n'appelle pas `setupLives`) | agent, option prudente | anti-devinette : une relance ne doit pas rendre des essais | `test/chatouilles-sentence-ecran.test.js` (critère 24) | nouvelle |
| 18 | Indice 2 de `coding` : si le premier segment va jusqu'à l'ami, une seule case est montrée, même après un virage | agent | « jamais tout le chemin » | `coding-hints.js` (`codingFirstCells`) | nouvelle |
| 19 | Un second toucher pendant le rire de bonjour n'ouvre pas un second dialogue ; si la scène a été redessinée entre-temps, le dialogue ne s'ouvre pas | agent | éviter deux fenêtres à 600 ms d'écart | `tickle.js` (`tickleHelloThen`) | nouvelle |

## Écarts et non vérifié

- Les tests d'onglets de la carte (3 onglets) sont dans la track Crayons, pas ici.
- L'écoute du son `giggle`, le rendu des dessins et le ressenti des chatouilles sont des lignes 👤.
- Le jeu n'a pas été lancé dans un navigateur par l'agent : les écrans sont vérifiés dans jsdom (structure, états, voix), pas leur rendu à 360 px (S17, S21). Les dessins des 4 personnages, des 6 squishies et du paysage ont été regardés en image par l'agent.
- `test/rythme-lecture.test.js` (suite existante, sensible au temps) a échoué une fois pendant un `bun run check` lancé sur une machine très chargée, puis est repassée ; elle ne touche pas à cette track.
