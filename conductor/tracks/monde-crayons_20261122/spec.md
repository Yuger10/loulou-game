---
status: brouillon        # brouillon | validée | faite ; « validée » est posé par l'humain
issue: 0
size: M                  # trois PR : trace, length, l'île
migration: false         # aucun nouveau champ : skills, storySolved et squishies existent déjà
sensitive: true          # PWA (index.html et sw.js régénérés) ; dessins de personnages demandés explicitement
files:
  - js/features/minigames/trace/trace.js
  - js/features/minigames/trace/trace.css
  - js/features/minigames/trace/index.js
  - js/features/minigames/length/length.js
  - js/features/minigames/length/length.css
  - js/features/minigames/length/index.js
  - js/slices.cjs
  - js/app/main.js
  - js/entities/difficulty/index.js
  - js/entities/difficulty/game-types.js
  - js/entities/difficulty/difficulty.js
  - js/features/adaptive/adaptive.js
  - js/features/parents/parents.js
  - js/entities/world/worlds.js
  - js/entities/character/characters.js
  - js/entities/character/characters-art.js
  - js/entities/item/items.js
  - js/entities/squishy/squishies.js
  - js/features/squishies/squishy-art.js   # créé par la phase 0 de squishy-boites, prérequis (D19)
  - js/features/island/island.js
  - js/features/story/story.js
  - js/features/story/episodes.js
  - js/features/music/music.js
  - js/shared/styles/design-system-v21.css
  - test/crayons.test.js
  - test/tools/gestures.js
  - test/games.test.js
  - test/companions.test.js
  - test/saison2.test.js
  - test/niveaux.test.js
taster: { facts: 0, decisions: 0, rounds: 7 }
---

<!-- Gabarit cothon 0.4.0 (setting-up-docs), adopté dans Conductor (cothon 0.2.0-2 et 0.4.0-6). -->

# Spec : ✏️ L'Île des Crayons (saison 3 « La Grande Expédition », île 1)

- Nouveau projet : non

> Idée de la joueuse : « une île des crayons ». Première île de la saison 3. Elle remplace la Cité des Nuages, jamais codée (`conductor/niveaux.md`, Historique).

**L'île :** `crayons`, emoji ✏️, niveau d'ouverture **70**. Règle et tableau de tous les niveaux : `conductor/niveaux.md`. Palier `diff: 6`.

## Problème

La joueuse veut une île des crayons. Elle entre au CP : elle apprend à tracer ses lettres et ses chiffres, et à comparer des longueurs. L'île lui donne deux mini-jeux qui manquent au jeu : tracer au doigt en suivant un modèle fléché (le geste d'écriture, compétence `lire`) et mesurer des crayons, du plus long à la règle graduée (compétence `mesures`). Elle ouvre aussi le fil de la saison 3 : le premier morceau de la carte de Zap.

## Comportement attendu

Tests dans `test/crayons.test.js` (harnais de `test/musique.test.js:1-75`), sauf mention. « Palier p » = le jeu lancé comme `startGame(key, p)` de `test/musique.test.js:70-75`.

### Mini-jeu « Trace avec ton doigt » (`trace`)

1. Étant donné `traceRound(p)` pour p de 1 à 5, quand on le lit, alors il vaut exactement la ligne p de la table « Paliers de `trace` » (Politiques).
2. Étant donné `traceBuildRound(p)` tiré 40 fois, quand on lit ses glyphes, alors il y en a `traceRound(p).glyphs`, tous dans l'ensemble du palier (table « Ensembles de glyphes »), sans doublon dans une même mission.
3. Étant donné chaque glyphe de `TRACE_GLYPHS`, quand on calcule `traceStrokePoints(trait)` pour chacun de ses traits, alors chaque point est dans le carré 0 à 100, deux points voisins sont à 3 unités au plus l'un de l'autre, et le premier point est le départ du trait (table « Glyphes »).
4. Étant donné un trait et des règles d'un palier, quand on appelle `traceJudge(trait, traceStrokePoints(trait), règles)`, alors le résultat est `{ ok: true }` pour chaque trait de chaque glyphe, à chaque palier.
5. Étant donné les points du modèle décalés de 0,7 × R (R du palier) vers la droite, quand on les juge, alors `ok` est vrai (tolérance).
6. Étant donné les points du modèle avec une main qui tremble (le point d'indice i décalé de 0,5 × R × sin(i / 5) en x et de 0,5 × R × cos(i / 7) en y), quand on les juge, alors `ok` est vrai.
7. Étant donné les points du modèle d'un trait qui n'est ni fermé ni un point (tous les traits de la table « Glyphes » sauf le trait de `0`, le trait de `8` et le trait `D(45, 36)` du `i`, jugé par la seule règle `dot`) dans l'ordre inverse, quand on les juge au palier 2 ou plus, alors `ok` est faux avec `reason: 'start'` ; au palier 1, `ok` est vrai.
8. Étant donné le chiffre `0` tracé dans le mauvais sens (même départ, sens des aiguilles d'une montre), quand on le juge au palier 2 ou plus, alors `ok` est faux avec `reason: 'cover'`.
9. Étant donné un gribouillis qui commence au départ du trait puis couvre tout le carré (20 lignes horizontales de x = 5 à x = 95, de y = 5 à y = 95, reliées en zigzag), quand on le juge à n'importe quel palier et pour n'importe quel trait qui n'est pas un point, alors `ok` est faux avec `reason: 'wander'`.
10. Étant donné un simple toucher (2 points au même endroit) sur un trait qui n'est pas un point, quand on le juge, alors `reason: 'short'`.
11. Étant donné le point du `i` (trait `dot`), quand on touche à moins de R de lui, alors `ok` est vrai ; à plus de R, `reason: 'dot'`.
12. Étant donné `traceClientToPad({ clientX: 150, clientY: 75 }, { left: 50, top: 25, width: 200, height: 200 })`, quand on l'appelle, alors il renvoie `[50, 25]`.
13. Étant donné le jeu lancé au palier 2, quand la fenêtre s'ouvre, alors il y a `svg#tr-pad` (`viewBox="0 0 100 100"`, `data-g="0"`, `data-s="0"`), un seul `#tr-pad circle.tr-start` (`data-s="0"`, `cx` et `cy` égaux au premier point de `traceStrokePoints` du trait 0, `r="5"`), au moins un `#tr-pad .tr-arrow`, `.tr-strip` avec 2 `.tr-mini` (le premier a la classe `current`), et la voix dit la consigne du premier glyphe (table « Textes »).
14. Étant donné le jeu au palier 2, quand on trace avec le pilote de test (`traceAlong`, Contrats partagés) chaque élément de `gameSolution` dans l'ordre, alors l'écran de victoire `.win-box` s'affiche.
15. Étant donné un glyphe à plusieurs traits (recopiés de la table « Glyphes », nombre de traits entre parenthèses : `4` (2), `5` (2), `T` (2), `E` (2), `H` (3), `i` (2, le 2ᵉ est le point), `t` (2)), quand le trait s est réussi, alors `#tr-pad` passe au trait suivant (`data-s` vaut s + 1), le trait réussi a la classe `done` à deux endroits (`#tr-pad .tr-model[data-s="s"]` et `.tr-ms[data-g="g"][data-s="s"]`), `#tr-pad .tr-model[data-s="s + 1"]` a la classe `current`, le `#tr-pad .tr-start` porte `data-s="s + 1"`, et la voix dit « Bravo ! Maintenant, le trait numéro {k}. » (k à partir de 2).
16. Étant donné un glyphe réussi qui n'est pas le dernier, quand son dernier trait est réussi, alors le glyphe suivant s'affiche tout de suite (`#tr-pad` `data-g` augmente de 1, `data-s` revient à 0), `.tr-mini[data-g="g"]` a la classe `done` (et plus `current`), `.tr-mini[data-g="g + 1"]` a la classe `current`, et la voix dit « Bravo, c'est très bien tracé ! » suivi de la consigne du glyphe suivant.
17. Étant donné un trait raté (raison `start`, `cover`, `wander` ou `dot`), quand c'est le 1ᵉʳ ou le 2ᵉ raté de suite sur ce trait, alors aucun essai n'est perdu (`lives` inchangé), l'encre s'efface (`#tr-pad .tr-ink` a un attribut `points` vide), la voix dit la phrase de la raison (table « Textes ») et le même trait reste à faire (`#tr-pad` garde le même `data-g` et le même `data-s`).
18. Étant donné un 3ᵉ raté de suite sur le même trait, quand il est jugé, alors `loseLife` est appelé une fois, la voix dit « Regarde le crayon, puis refais ce trait ! », la démonstration suit **ce trait seulement** (`#tr-pad .tr-demo[data-s="s"]` existe tant qu'elle se joue), le compteur de ratés du trait revient à 0, et on reste sur ce trait : `data-g` et `data-s` de `#tr-pad` inchangés, les traits déjà réussis du glyphe gardent la classe `done` (sur `#tr-pad .tr-model` et `.tr-ms`). On ne passe pas au glyphe suivant.
19. Étant donné un toucher court (raison `short`), quand il est jugé, alors rien ne se passe (pas de voix, pas d'erreur, compteur inchangé).
20. Étant donné le jeu au palier 5, quand la fenêtre s'ouvre, alors il n'y a aucun `#tr-pad .tr-arrow` et la consigne dit « suis le chemin gris » au lieu de « suis les flèches ».
21. Étant donné le jeu au palier 1, quand la fenêtre s'ouvre, alors la démonstration du premier trait se joue une fois toute seule (`#tr-pad .tr-demo[data-s="0"]` existe juste après l'ouverture).
22. Étant donné le jeu, quand on lit `hintsFor('trace', hint.q)`, alors il y a 2 indices aux textes exacts (table « Textes »), le premier a `fx.glow === '#tr-pad .tr-start'`, le second a un `fx.run`, le second lance la démonstration du trait courant ; aucun n'utilise `dim`. `test/companions.test.js` le vérifie avec le pilote de test.
23. Étant donné le jeu, quand on lit les tables, alors `timerFor('trace', 5) === null`, `livesFor('trace', 1) === Infinity`, `livesFor('trace', 2) === 4`, `livesFor('trace', 5) === 3`, `trace` est dans le groupe `lire` de `SKILL_GROUPS`, dans `GAME_LIST` (`{ key: 'trace', emoji: '✍️', name: 'Trace avec ton doigt' }`), dans `gameTypesForAge(5)` mais pas dans `gameTypesForAge(4)`, et `PROGRESS_CHEERS.trace` vaut « Tes lettres sont de plus en plus belles ! ».
24. Étant donné `test/games.test.js`, quand il joue `trace` à chaque palier de 1 à 5 (3 tirages), alors chaque partie finit par la victoire, et la vérification indépendante `INDEPENDENT.trace` confirme que chaque élément de la solution porte les points de son trait (`data-pts`) et que la solution couvre tous les traits de tous les glyphes de la bande.

### Mini-jeu « Mesure les crayons » (`length`)

25. Étant donné `lengthRound(p)` pour p de 1 à 5, quand on le lit, alors il vaut exactement la ligne p de la table « Paliers de `length` ».
26. Étant donné `lengthBuildRound(1)` tiré 40 fois, alors il y a 2 crayons qui partent tous de x = 5, des longueurs entières de 25 à 90, le plus long au moins 1,3 fois le plus court, et `ask` vaut `long` ou `short` (les deux apparaissent).
27. Étant donné `lengthBuildRound(2)` tiré 40 fois, alors il y a 3 crayons, des départs entiers de 5 à 25 et une fin à 95 au plus, deux longueurs voisines dans un rapport d'au moins 1,15, et au moins 10 tirages sur 40 où le crayon qui finit le plus à droite n'est pas la bonne réponse (piège du décalage).
28. Étant donné `lengthBuildRound(3)` tiré 40 fois, alors un seul crayon mesure k gommes (k de 2 à 6), part du début de la première gomme, et les 3 choix sont k - 1, k et k + 1.
29. Étant donné `lengthBuildRound(4)` tiré 40 fois, alors le crayon part du 0 de la règle, mesure k cm (k de 3 à 12), et il y a 4 choix distincts, tous de 1 à 15, dont k.
30. Étant donné `lengthBuildRound(5)` tiré 40 fois, alors le crayon part de s cm (s de 1 à 4), mesure k cm (k de 3 à 10, s + k ≤ 14), et les 4 choix distincts contiennent k (bonne réponse) et s + k (le piège : la graduation sous la pointe).
31. Étant donné le jeu au palier 1, quand on touche le bon crayon, alors la mission est gagnée ; quand on touche le mauvais, alors la voix dit la phrase d'erreur (table « Textes ») et une **autre** question s'affiche (anti-devinette, `hint.q` change).
32. Étant donné les paliers 3 à 5, quand on touche un mauvais nombre, alors la phrase d'erreur du mode est dite et une autre question s'affiche ; au palier 5, toucher s + k fait dire « Attention : le crayon ne commence pas au zéro ! ».
33. Étant donné le jeu, quand on lit ses indices, alors il y a 2 indices aux textes exacts de la table « Textes » ; l'indice 2 du mode `compare` a un `fx.run` qui ajoute 2 `.ln-guide` par crayon (`data-i`, `data-at="start"` ou `"end"`) ; celui de `units` a `fx.marks` égal à `[{ sel: '.ln-unit[data-u="0"]', text: '1' }]` ; celui de `ruler` a `fx.glow` égal à `.ln-tick[data-cm="s"], .ln-tick[data-cm="s + k"]` (nombres calculés) et `fx.dim` égal à `.ln-opt[data-v="x"]` pour une seule mauvaise réponse x, différente de s + k ; les autres indices n'ont pas de `dim`.
34. Étant donné le jeu, quand on lit les tables, alors `timerFor('length', 5) === null`, `length` est dans les jeux généreux de `livesFor` (`livesFor('length', 2) === 4`), dans le groupe `mesures`, dans `GAME_LIST` (`{ key: 'length', emoji: '📏', name: 'Mesure les crayons' }`), dans `gameTypesForAge(5)` mais pas dans `gameTypesForAge(4)`, et `PROGRESS_CHEERS.length` vaut « Tu mesures de mieux en mieux ! ».
35. Étant donné `test/games.test.js`, quand il joue `length` à chaque palier (3 tirages), alors chaque partie est gagnée et `INDEPENDENT.length` confirme la réponse à partir de l'écran (`data-len`, `data-start`, `data-ask`).

### L'île (après la track `saison3-ouverture`)

36. Étant donné `WORLDS.crayons`, quand on le lit, alors il vaut l'entrée de la table « Données de l'île », `worldsOf(3)[0] === 'crayons'` (première île : reste vrai quand les suivantes arrivent ; jamais de liste exacte de `worldsOf(3)`) et `ARCHIPELAGOS[3].level === 70`.
37. Étant donné les feuilles de style du manifeste, quand on les lit, alors il y a `body[data-world="crayons"] { --world-sky: … }` ; `ISLE_SCENERY.crayons(WORLDS.crayons)` contient `F7C948` ; `MUSIC_THEMES.crayons.lead === 'pluck'` et `.bpm === 96`.
38. Étant donné `charsOf('crayons')`, alors il vaut `['gribouille', 'gommette', 'taillou', 'aquarelle']`, chacun a 2 objets de l'île en butin, 3 répliques (textes exacts de la table « Personnages ») et un dessin (`charArtSVG(id)` commence par `<svg`).
39. Étant donné les objets de `crayons`, alors il y a les 8 objets de la table, au moins 3 ne sont dans aucun butin, 2 recettes de `CRAFTED` avec des ingrédients de l'île, 5 décorations, et `favoritesOf(id)` donne 2 objets de l'île hors butin pour chaque personnage.
40. Étant donné une partie au niveau 70 sur l'île, quand on ouvre la vue île, alors les 4 personnages sont dans le paysage et `document.body.dataset.world === 'crayons'` ; une mission avant (69), `worldUnlocked('crayons') === false` et `availableItems()` ne contient pas `regle`.
41. Étant donné `state.expeditionIntroSeen = false`, toutes les îles ouvertes visitées et une partie à une mission du niveau 70, quand la mission est gagnée et « Continuer » touché, alors l'écran `.expedition-open` s'affiche, puis le prologue de Zap, puis le chapitre « Le premier morceau de la carte » raconté par Gribouille avec `.story-zapmap svg.zap-map[data-found="0"]` ; `state.visited` contient `crayons`.
42. Étant donné `STORY.crayons`, alors `guide === 'gribouille'`, `intro` a 3 phrases, `riddles` en a 3, chacune avec une seule bonne option et un `tip`, et les textes sont ceux de la table « Histoire ».
43. Étant donné `state.coins = 0` et `storyWin('crayons')`, quand on le joue, alors on gagne 16 pièces et une boîte de la série `papeterie`, `zapMapPieces() === 1`, la fenêtre montre `.story-zapmap.happy svg.zap-map[data-found="1"]` dont le morceau `.zm-piece[data-piece="crayons"]` porte `zm-new` (contrat `zapMapSVG(zapMapPieces(), { fresh: 'crayons' })` de la track `saison3-ouverture`, aucun code de carte dans cette track), et la voix ajoute `zapMapSay(1)` ; à l'ouverture du chapitre (ligne 41), aucun `zm-new` ; un second `storyWin` ne redonne pas la boîte.
44. Étant donné `squishiesOf('papeterie')`, alors 6 modèles : 4 `commun`, `gribouille` en `rare`, `crayon-arc-en-ciel` en `brille`, chacun dessiné (`squishyArtSVG` contient `sq-face` ; sans entrée dans `SQ_ART`, elle renvoie une chaîne vide, voir D19) ; sous 70 la série n'est pas disponible, à 70 elle apparaît dans la chambre (`.sq-series[data-series="papeterie"]`) ; `SQUISHY_ISLAND_SERIES.crayons === 'papeterie'`.
45. Étant donné `EPISODES.crayons`, alors 3 épisodes, racontés par `gommette`, `taillou`, `aquarelle` (jamais `gribouille`), aux textes exacts de la table « Épisodes », joués après la 2ᵉ, la 4ᵉ et la 7ᵉ mission réussie sur l'île.
46. Étant donné l'âge du profil, quand on lit `worldGame('crayons', age)`, alors `trace` pour 5 ans, `length` pour 8 ans ; sur l'île, `openGamePicker('gommette')` propose `trace` à 5 ans et `openGamePicker('taillou')` propose `length` à 8 ans. Le personnage touché ne choisit pas le jeu : le mécanisme réel est `worldGame(currentWorld, âge)`, toujours placé dans les choix de « choisir un jeu » (`js/features/players/profiles-ui.js:430-434`) ; n'importe quel personnage de l'île donnerait le même résultat.
48. Étant donné le texte source de `js/entities/item/items.js`, `js/entities/character/characters.js`, `js/entities/companion/companions.js`, `js/entities/squishy/squishies.js`, `js/entities/difficulty/game-types.js` et `js/features/music/music.js`, quand le test compte les déclarations de clés (lignes de la forme `  clé: {` ou `  'clé': {` au premier niveau de chaque table, et les chaînes de `GAME_TYPES`), alors chaque clé apparaît une seule fois dans l'union `ITEMS` + `CRAFTED` + `DECOS`, une seule fois dans `CHARACTERS`, une seule fois dans `SQUISHIES`, `SQUISHY_SERIES` et `MUSIC_THEMES`, une seule fois dans `GAME_TYPES` ; aucun id de `CHARACTERS` n'est un id de `COMPANIONS` ; aucun `name` de personnage n'est porté par un autre personnage ni par un compagnon ; et chaque table du jeu indexée par une clé de jeu (liste de D10) est un objet simple (`!Array.isArray(table) && typeof table === 'object'`). Le test échoue en nommant la clé en double. Il lit le texte source parce qu'une clé en double dans un objet littéral disparaît à l'exécution.
47. Étant donné `test/saison2.test.js`, quand l'île existe, alors les 3 premiers onglets de la carte sont, dans l'ordre, Lagon Magique, Ciel des Rêves, Grande Expédition (vrai aussi quand les îles suivantes de la saison 3 arrivent : elles ne créent pas d'onglet) et « chaque île a un archipel » accepte les saisons 1, 2 et 3 ; `test/niveaux.test.js` vérifie en plus `ARCHIPELAGOS[3].level === TABLE.crayons.level`.

## Décisions

| Id | Décision | Pourquoi | Source |
|---|---|---|---|
| D1 | Le tracé se juge sur des **points de passage** du modèle (un tous les 8 unités), avec un rayon de tolérance R par palier, un ordre de passage (glouton, vers l'avant), un départ près du point vert et un plafond d'écart ; algorithme exact dans Politiques. | Juger le geste (sens, départ, chemin) sans exiger un trait parfait ; l'ordre glouton accepte les traits qui repassent sur eux-mêmes (`d`, `a`). | `conductor/product-guidelines.md:6` (pas de punition) |
| D2 | Un trait raté ne coûte un essai qu'au 3ᵉ raté de suite ; un toucher court est ignoré. Après un raté, quel qu'en soit le rang, on reste sur le même trait (les traits déjà réussis restent faits, on ne passe pas au glyphe suivant) ; au 3ᵉ, la démonstration montre ce trait seulement. Ce dernier point est un défaut de Claude, à juger à la revue par Amrou. L'anti-devinette ne s'applique pas : il n'y a aucun choix à éliminer. | « Pas de game over, pas de punition. Un échec mène à réessayer, avec un indice parlé. » L'anti-devinette vise « peu de choix et pas de limite d'essais ». | `conductor/product-guidelines.md:6-7` |
| D3 | Saisie par Pointer Events sur `#tr-pad` (avec `setPointerCapture` dans un `try`) et, si `window.PointerEvent` n'existe pas, par `touchstart/touchmove/touchend` et `mousedown/mousemove/mouseup`. `touch-action: none` sur le carré ; en repli tactile, `preventDefault` dans `touchmove` (`addEventListener` avec `{ passive: false }`). | Le jeu doit marcher partout (Safari avant 13 n'a pas Pointer Events) ; le puzzle utilise déjà Pointer Events et une capture protégée. | `AGENTS.md:33`, `js/features/minigames/jigsaw/jigsaw.js:185-195` |
| D4 | Les tests jouent `trace` sans doigt : chaque élément de `gameSolution` porte `data-pts` (les points du modèle) et `data-pad` ; un pilote partagé `test/tools/gestures.js` (`traceAlong`) donne au carré une taille de 100 × 100 (`getBoundingClientRect` remplacé dans le test seul) et envoie les événements de `TRACE_EVENTS`. `test/games.test.js` (`playToWin`) et `test/companions.test.js` (boucle « le jeu reste gagnable ») appellent `traceAlong` quand l'élément a `data-pts`, sinon `click()`. | Les boucles génériques cliquent `gameSolution` ; jsdom n'a pas de mise en page (rectangle nul). La checklist prévoit un solveur. Aucun code de test dans le jeu. | `test/games.test.js:306-322`, `test/companions.test.js:276-286`, `conductor/checklist-mini-jeu.md` (§ 1, « ajouter son solveur ») |
| D5 | Une mission de `trace` montre tous ses glyphes dans une bande (`.tr-strip`) dès le début ; les éléments de la solution sont les traits de cette bande. Le glyphe suivant s'affiche **sans délai** après le précédent. | `playToWin` vérifie que tous les éléments de la solution existent dès le départ et les joue sans attendre. | `test/games.test.js:306-316` |
| D6 | Paliers de `trace` : capitales bâton et chiffres simples (palier 1), lettres attachées et chiffres (paliers 2 et 3), révision (4), sans flèches (5). Une enfant de 6 ans joue les paliers 1 et 2. | Programme du cycle 2 : l'écriture cursive s'apprend au CP ; l'âge plafonne au palier 2 à 6 et 7 ans. | https://www.education.gouv.fr/sites/default/files/ensel135_annexe4.pdf , `js/entities/difficulty/age.js:5-11`, `js/features/adaptive/game-diff.js` (plafond par l'âge) |
| D7 | Paliers de `length` : comparer 2 crayons alignés, puis 3 décalés, puis mesurer en gommes (unité choisie), puis en centimètres à partir du 0, puis à partir d'un autre nombre. Reprend « Le plus long » de l'ancienne Vallée des Dinosaures. | Programme : comparer, puis mesurer avec un étalon, puis la règle graduée en cm (CE1). | https://www.education.gouv.fr/sites/default/files/ensel135_annexe4.pdf , `git show HEAD:conductor/tracks/monde-dinosaures_20261111/spec.md` (lignes 28-37) |
| D8 | `length` : une mission = une question ; chaque mauvaise réponse relance une autre question (`loseLife(…, { onRetry })`), à tous les paliers. | Anti-devinette avec 2 ou 3 choix ; même règle partout pour rester simple. | `conductor/product-guidelines.md:7`, `js/features/minigame-engine/engine.js:134-166` |
| D9 | Pas de minuteur (`NO_TIMER_KINDS`) pour les deux jeux. `trace` a sa ligne `LIVES_TABLE.trace = { 2: 4, 3: 4, 4: 3, 5: 3 }` ; `length` rejoint `GENEROUS_KINDS`. | Politique commune des nouveaux jeux ; tracer est une tâche à plusieurs étapes. | `js/entities/difficulty/difficulty.js:360-374`, `js/entities/difficulty/difficulty.js:446-474` |
| D10 | La clé `length` est **gardée**. Vérifié le 22/11/2026 : toute table indexée par une clé de jeu est un objet simple (`{}`), jamais un tableau ni une chaîne, donc `table['length']` vaut `undefined` tant que la clé n'est pas posée. Les tables : `GAME_RENDERERS`, `HINT_PROVIDERS`, `GAME_TIER_MAX`, `PROGRESS_CHEERS`, `SKILL_ERR_TOLERANCE`, `LIVES_TABLE`, `TIMER_SECONDS`, `leoSession.primed`, `state.skills`, `state.gameCounts`. Ailleurs, les clés de jeu ne passent que par `includes` sur des tableaux (`GAME_TYPES`, `NO_TIMER_KINDS`, `GENEROUS_KINDS`, `SKILL_GROUPS[].games`). Une table indexée par clé de jeu qui serait un tableau casserait `length` : la ligne 48 l'interdit. | Clés imposées par Amrou ; aucune collision trouvée. | `js/features/minigame-engine/engine.js:287`, `js/features/hints/hints.js:41`, `js/features/adaptive/adaptive.js:32`, `js/features/adaptive/adaptive.js:39`, `js/features/adaptive/skill-status.js:14`, `js/entities/difficulty/difficulty.js:360`, `js/entities/difficulty/difficulty.js:432`, `js/features/companion-team/specialties.js:133`, `js/entities/game-state/state.js:125` |
| D18 | Inventaire des clés nouvelles, vérifié par `grep` le 22/11/2026 dans `js/` (compagnons et `words.js` compris) et dans les specs `monde-dumplings`, `monde-coffres`, `monde-chatouilles`, `monde-concert` : personnages `gribouille`, `gommette`, `taillou`, `aquarelle` (prénoms Gribouille, Gommette, Taillou, Aquarelle) ; objets `cahier`, `craie`, `gomme`, `copeaux`, `palette`, `regle`, `feutre`, `equerre` ; recettes `trousse`, `fresque` ; décorations `potcrayonsD`, `chevaletD`, `fanionsD`, `lampeD`, `marquepageD` ; série `papeterie` et squishies `crayon-mochi`, `gomme-fraise`, `taille-crayon`, `pot-de-peinture`, `gribouille`, `crayon-arc-en-ciel` ; jeux `trace`, `length` ; thème `MUSIC_THEMES.crayons` ; forme `crayons` ; classes `tr-*`, `ln-*`. Aucune n'existe dans `js/`. Une seule collision : `fanionsD` est aussi une décoration de `monde-chatouilles` (niveau 94, plus haut) : c'est elle qui change, l'Île des Crayons garde `fanionsD`. `monde-concert` cite Gribouille comme guide de cette île : voulu. Le squishy rare `gribouille` porte l'id du personnage, comme `boumbo` pour la Musique (tables différentes). | Une clé en double écrase l'autre en silence dans un objet littéral JS. | `js/entities/squishy/squishies.js:441-448` (`boumbo`), `conductor/tracks/monde-chatouilles_20261122/spec.md:375` |
| D11 | Jeu favori : `trace` avant 7 ans, `length` à partir de 7 ans. | Même forme que la Musique ; la joueuse (6 ans) trace. | `js/entities/world/worlds.js:222-223` |
| D12 | Noms des personnages : Gribouille (crayon à papier, guide), Gommette (gomme), Taillou (taille-crayon), Aquarelle (pinceau). Noms, titres, objets, série de squishies : proposition du rédacteur, à juger par la joueuse à la revue. | Noms faciles à dire, avec un titre descriptif. | `conductor/product-guidelines.md:19` |
| D13 | Dessins des 4 personnages à créer dans `js/entities/character/characters-art.js` : **demande explicite de cette spec**, sans toucher à aucun dessin existant. | Zone à demande explicite. | `AGENTS.md` (Interdits, dessins des personnages) |
| D14 | Récompense du chapitre : 16 pièces. | Entre la saison 2 (14) et le grand final (20). Défaut du rédacteur, à juger à la revue. | `js/features/story/story.js:350`, `js/features/story/story.js:408` |
| D15 | Aucun nouveau champ de sauvegarde. | Les jeux écrivent dans `state.skills[clé]`, l'histoire dans `storySolved`, les squishies dans la collection existante ; la carte de Zap se calcule (track `saison3-ouverture`, D12). | `js/entities/game-state/state.js:126-143` |
| D16 | Les tests existants qui changent à la phase 3 : `test/saison2.test.js:100` (saisons 1, 2 ou 3), `test/saison2.test.js:126-129` (les 3 premiers onglets, le 3ᵉ « La Grande Expédition », sans compter les onglets ni les îles de la saison 3), `test/niveaux.test.js:202-207` (ajout de `ARCHIPELAGOS[3].level`). Aux phases 1 et 2 : `test/games.test.js:306-322` et `test/companions.test.js:276-286` (pilote `traceAlong`, D4). Aucun test affaibli. | L'onglet de la saison 3 devient réel avec cette île. | `test/saison2.test.js:98-101`, `test/saison2.test.js:125-129` |
| D19 | Les dessins des 6 squishies sont 6 entrées de la table `SQ_ART` (champs `body`, `face`, `faceY` et, s'il le faut, `back` et `front`), sur le modèle de `'tambour-mochi'` et `boumbo` (aujourd'hui dans `squishy-room.js`). Pas dans `js/entities/squishy/squishies.js`, qui ne tient que les données. Elles vont dans `js/features/squishies/squishy-art.js`, créé par la phase 0 de la track `squishy-boites` (déplacement à l'identique des dessins, rien de visible) : cette phase 0 est un **prérequis** de la phase 3, au même titre que `saison3-ouverture`. Si `squishy-art.js` n'existe pas au moment d'implémenter la phase 3, l'agent s'arrête et signale le prérequis manquant ; il ne crée aucun autre fichier et n'ajoute rien à `squishy-room.js` (1223 lignes pour un plafond de 1250). | Règle commune aux cinq îles de la saison 3. `squishyArtSVG` lit `SQ_ART[id]` et renvoie une chaîne vide sans entrée. | `js/features/squishies/squishy-room.js:108`, `js/features/squishies/squishy-room.js:448-456`, `js/features/squishies/squishy-room.js:482-490`, `js/features/squishies/squishy-room.js:630-633`, `.oxlintrc.json:40`, `conductor/tracks/squishy-boites_20261122/plan.md:12-14` |
| D20 | **Types stricts** (règle de `conductor/checklist-mini-jeu.md` et `conductor/checklist-ile.md`). Aucun `@typedef` existant ne change : `WORLDS.crayons` respecte `World` (`worlds.js:8-25`, `game` en fonction de l'âge) ; les personnages, `Character` (`characters.js:5-15`) ; les objets et décorations, `Item`, les recettes, `CraftedItem` (`items.js:6-11`) ; la série et les squishies, `SquishySeries` et `Squishy` (`squishies.js:22-37`). Nouveaux types dans `js/entities/difficulty/difficulty.js` (strict) : `@typedef {{ glyphs: number, set: string, R: number, cover: number, order: boolean, start: boolean, wander: number, arrows: boolean, demo: boolean }} TraceRules`, `traceRound(dd)` avec `@param {number} dd` et `@returns {TraceRules}` ; `@typedef {{ mode: 'compare' \| 'units' \| 'ruler', n?: number, aligned?: boolean, minRatio?: number, trap?: number, min?: number, max?: number, choices?: number, unit?: number, cm?: number, offset?: boolean }} LengthRules`, `lengthRound(dd)` avec `@returns {LengthRules}` ; la table passée à `tierValue` est typée `Record<number, TraceRules>` ou `Record<number, LengthRules>`. Les fichiers des jeux (`js/features/minigames/trace/trace.js`, `length.js`) sont typés en JSDoc : `@typedef` `TraceGlyph` (`{ id, kind, say, word?, emoji?, strokes }`), `TraceStroke`, `JudgeResult` (`{ ok: boolean, reason?: 'dot' \| 'short' \| 'start' \| 'wander' \| 'cover', cover: number, wander: number }`), `@param` et `@returns` sur chaque fonction exposée ; jamais `any` ni `@ts-ignore`. `bun run typecheck` vert à chaque phase. | Le rebase a passé `js/shared` et `js/entities` en strict. | `js/entities/difficulty/difficulty.js:86-92`, `js/entities/world/worlds.js:8-25`, `tsconfig.strict.json` |
| D17 | Position sur la carte de la saison 3 : `{ x: 18, y: 78 }` (en bas à gauche, départ de la route). | Dans le cadre 14 à 86 % et 15 à 85 % ; laisse la place aux 4 îles suivantes. Défaut du rédacteur. | `conductor/checklist-ile.md` (§ 2, position), `test/saison2.test.js:213-217` |

## Politiques

- **Arbitrages** :
  - Tolérance contre exigence du geste : la tolérance gagne aux paliers 1 et 2 (âge de la joueuse), l'exigence augmente ensuite (table des paliers).
  - Anti-devinette contre persévérance dans `trace` : la persévérance gagne (même glyphe, D2) ; dans `length`, l'anti-devinette gagne (D8).
  - Voix préenregistrée (track `voix-naturelle`) contre textes variables : chaque phrase variable est faite de morceaux fixes listés ici (nom de la lettre, mot exemple), jamais d'un texte libre.
- **Défauts** : constantes dans `difficulty.js` (pas de réglage) ; aucune dépendance ; une erreur de saisie (événement sans coordonnées) est ignorée ; le hasard passe par `random()`, `pickRandom()`, `shuffle()` (`AGENTS.md`, Conventions).

### Paliers de `trace` (`traceRound(dd)`, avec `tierValue`)

| Palier | glyphs | set | R | cover | order | start | wander | arrows | demo |
|---|---|---|---|---|---|---|---|---|---|
| 1 | 1 | `p1` | 16 | 0,75 | non | non | 0,35 | oui | oui |
| 2 | 2 | `p2` | 14 | 0,85 | oui | oui | 0,30 | oui | non |
| 3 | 2 | `p3` | 12 | 0,85 | oui | oui | 0,25 | oui | non |
| 4 | 3 | `p4` | 11 | 0,90 | oui | oui | 0,25 | oui | non |
| 5 | 3 | `p5` | 10 | 0,90 | oui | oui | 0,20 | non | non |

### Ensembles de glyphes

| set | glyphes |
|---|---|
| `p1` | `1`, `4`, `7`, `0`, `L`, `T`, `E`, `H` |
| `p2` | `i`, `u`, `t`, `l`, `e`, `2`, `3`, `5` |
| `p3` | `c`, `o`, `a`, `d`, `6`, `8`, `9` |
| `p4` | `i`, `u`, `t`, `l`, `e`, `c`, `o`, `a`, `d` |
| `p5` | `i`, `u`, `t`, `l`, `e`, `c`, `o`, `a`, `d`, `2`, `3`, `5`, `6`, `8`, `9` |

### Glyphes (`TRACE_GLYPHS`)

Carré de 0 à 100, y vers le bas. Un trait est une suite de morceaux mis bout à bout :
- `P(x1 y1, x2 y2, …)` : une ligne brisée ;
- `A(cx, cy, rx, ry, a0, a1)` : un arc d'ellipse de l'angle a0 à l'angle a1 (degrés, pas de 10°), point = (cx + rx cos a, cy + ry sin a) ; un angle qui croît tourne dans le sens des aiguilles d'une montre à l'écran ;
- `D(x, y)` : un point à toucher (trait `dot`).

`traceStrokePoints(trait)` met les morceaux bout à bout, puis rééchantillonne le tout tous les 3 unités au plus (début et fin compris). Lignes d'écriture dessinées : chiffres et capitales, y = 15 et y = 85 ; lettres attachées, y = 52 (hauteur des petites lettres) et y = 85 (ligne de base), y = 15 en tirets.

| Glyphe | Sorte | Dit | Mot | Traits |
|---|---|---|---|---|
| `0` | chiffre | zéro | | 1 : `A(50, 50, 22, 35, 270, -90)` |
| `1` | chiffre | un | | 1 : `P(36 32, 56 15, 56 85)` |
| `2` | chiffre | deux | | 1 : `A(50, 35, 20, 20, 200, 380)` + `P(30 85, 72 85)` |
| `3` | chiffre | trois | | 1 : `A(50, 32, 18, 17, 210, 450)` + `A(50, 66, 20, 19, 270, 510)` |
| `4` | chiffre | quatre | | 1 : `P(58 15, 28 62, 76 62)` ; 2 : `P(60 40, 60 85)` |
| `5` | chiffre | cinq | | 1 : `P(36 15, 34 46)` + `A(50, 64, 20, 20, 235, 495)` ; 2 : `P(36 15, 68 15)` |
| `6` | chiffre | six | | 1 : `A(50, 48, 22, 33, 300, 180)` + `A(50, 66, 20, 19, 180, -180)` |
| `7` | chiffre | sept | | 1 : `P(28 15, 72 15, 42 85)` |
| `8` | chiffre | huit | | 1 : `A(50, 32, 16, 17, 330, 90)` + `A(50, 67, 20, 18, 270, 630)` + `A(50, 32, 16, 17, 90, -30)` |
| `9` | chiffre | neuf | | 1 : `A(50, 34, 19, 19, 0, -360)` + `P(69 34, 66 85)` |
| `L` | capitale | L | lion 🦁 | 1 : `P(35 15, 35 85, 70 85)` |
| `T` | capitale | T | tortue 🐢 | 1 : `P(25 15, 75 15)` ; 2 : `P(50 15, 50 85)` |
| `E` | capitale | E | étoile ⭐ | 1 : `P(68 15, 35 15, 35 85, 68 85)` ; 2 : `P(35 50, 62 50)` |
| `H` | capitale | H | hibou 🦉 | 1 : `P(30 15, 30 85)` ; 2 : `P(70 15, 70 85)` ; 3 : `P(30 50, 70 50)` |
| `i` | attachée | i | île 🏝️ | 1 : `P(25 85, 45 52, 45 78, 53 86, 68 80)` ; 2 : `D(45, 36)` |
| `u` | attachée | u | lune 🌙 | 1 : `P(20 85, 34 52, 34 78, 42 86, 54 80, 60 52, 60 78, 67 86, 80 80)` |
| `t` | attachée | t | tomate 🍅 | 1 : `P(25 85, 45 25, 45 78, 53 86, 68 80)` ; 2 : `P(34 50, 58 50)` |
| `l` | attachée | l | lapin 🐰 | 1 : `P(20 85, 44 55, 54 30, 52 16, 44 15, 40 26, 41 60, 43 80, 52 86, 68 80)` |
| `e` | attachée | e | cheval 🐴 | 1 : `P(20 78, 44 68, 56 58, 52 50, 42 52, 36 64, 38 78, 48 86, 62 84, 74 76)` |
| `c` | attachée | c | carotte 🥕 | 1 : `P(62 56, 52 50, 40 54, 34 68, 38 81, 50 86, 64 82, 76 75)` |
| `o` | attachée | o | moto 🏍️ | 1 : `A(48, 68, 14, 17, 300, -60)` + `P(55 53, 70 52, 80 55)` |
| `a` | attachée | a | ananas 🍍 | 1 : `A(46, 68, 14, 17, 330, -30)` + `P(60 52, 60 79, 67 86, 80 80)` |
| `d` | attachée | d | dauphin 🐬 | 1 : `A(46, 68, 14, 17, 330, -30)` + `P(60 15, 60 79, 67 86, 80 80)` |

### Jugement d'un trait (`traceJudge(trait, points, règles)`)

Renvoie `{ ok, reason, cover, wander }`. Les points de l'enfant sont d'abord rééchantillonnés tous les 3 unités (interpolation linéaire), pour qu'un geste rapide ne laisse pas de trous.
1. Trait `dot` : `ok` si tous les points sont à moins de R du point ; sinon `reason: 'dot'`.
2. Moins de 3 points reçus (avant rééchantillonnage), ou longueur du geste < 0,25 × longueur du modèle : `reason: 'short'` (ignoré).
3. Si `règles.start` : le premier point doit être à moins de 1,5 × R du départ du trait, sinon `reason: 'start'`.
4. `wander` = part des points (rééchantillonnés) à plus de R de la ligne du modèle. `reason: 'wander'` si `wander` dépasse `règles.wander`, ou si la longueur du geste dépasse 2,5 × la longueur du modèle (un gribouillis qui remplit le carré passe près de tout le modèle, mais il est bien trop long).
5. Points de passage C : le modèle rééchantillonné tous les 8 unités, début et fin compris. Si `règles.order` : on parcourt C dans l'ordre avec un curseur j = 0 ; pour chaque point de passage, on cherche le premier point de l'enfant d'indice ≥ j à moins de R ; s'il existe, il compte et j devient son indice. Sinon : un point de passage compte s'il a un point de l'enfant à moins de R. `cover` = comptés / total ; sous `règles.cover` : `reason: 'cover'`.
6. Sinon `ok: true`. Les raisons se testent dans cet ordre : `dot`, `short`, `start`, `wander`, `cover`.

### Écran de `trace`

- `gameHeader('✍️ Trace avec ton doigt', …)` : le glyphe en grand, son mot et son emoji (capitales et lettres attachées) ou autant de petits points que le chiffre (chiffres, rien pour `0`).
- `livesBar()`, `progressDots(0, glyphs)`, puis la bande `.tr-strip` : un `.tr-mini` par glyphe (`data-g`), petit dessin du modèle dont chaque trait est un `polyline.tr-ms` (ou `circle.tr-ms` pour un point) avec `data-g`, `data-s`, `data-pad="tr-pad"` et `data-pts` (JSON des points de `traceStrokePoints`, arrondis au dixième). `setSolution` reçoit les sélecteurs `.tr-ms[data-g="g"][data-s="s"]` dans l'ordre (élément exact : contrat DOM ci-dessous).
- `svg#tr-pad` (`viewBox="0 0 100 100"`, `data-g`, `data-s`), carré de `min(78vw, 320px)` de côté : lignes d'écriture bleu pâle `#BFDDF5`, modèle gris `#D9D4CC` épais (largeur 9, bouts ronds), traits réussis à la couleur du crayon, `.tr-start` vert `#2F9551` (rayon 5) avec le numéro du trait si le glyphe en a plusieurs, chevrons `.tr-arrow` tous les 22 unités sur le trait courant (pas au palier 5), encre `polyline.tr-ink` sous le doigt. Couleur du crayon, glyphe par glyphe : `#E8344E`, `#3C8FC0`, `#2F9551`, `#7B5CC0`, `#E07A1F`.
- `.tr-demo` : un ✏️ qui suit le trait courant en 1,2 s (un pas toutes les 40 ms) ; avec `prefers-reduced-motion`, le trait clignote une fois (`tr-flash`) à la place. Poser le doigt sur le carré arrête la démonstration en cours : on peut toujours tracer, même pendant qu'elle se joue (les tests tracent sans l'attendre).
- **Contrat DOM de `trace`** (seuls sélecteurs lus par les critères) :

| Sélecteur | Nombre | Attributs | Classes d'état |
|---|---|---|---|
| `svg#tr-pad` | 1 | `viewBox="0 0 100 100"`, `data-g` (glyphe courant), `data-s` (trait courant) | aucune |
| `#tr-pad polyline.tr-model` (un `circle.tr-model` de rayon 3 pour un trait `dot`) | un par trait du glyphe courant | `data-s` ; `points` (points de `traceStrokePoints`, unités du carré) ou `cx`, `cy` | `done` (réussi, couleur du crayon), `current` (à faire) ; aucune pour un trait à venir |
| `#tr-pad circle.tr-start` | 1 (trait courant) | `data-s` ; `cx`, `cy` = premier point de `traceStrokePoints` du trait courant (unités du carré) ; `r="5"` | aucune |
| `#tr-pad text.tr-num` | 1 si le glyphe a plusieurs traits, sinon 0 ; élément frère de `.tr-start`, jamais dedans | `data-s` ; `x` = `cx` + 7, `y` = `cy` - 7 ; texte : le numéro du trait (1 pour le premier) | aucune |
| `#tr-pad path.tr-arrow` | 0 au palier 5, sinon au moins 1 (trait courant) | `data-s` | aucune |
| `#tr-pad polyline.tr-ink` | 1 | `points` (vide quand rien n'est tracé) | aucune |
| `#tr-pad text.tr-demo` (le ✏️) | 0 ou 1 (pendant la démonstration) | `data-s` (le trait montré), `x`, `y` | aucune |
| `.tr-strip span.tr-mini` (contient un `svg` en `viewBox="0 0 100 100"`) | un par glyphe de la mission | `data-g` | `done`, `current` |
| `.tr-strip polyline.tr-ms` (un `circle.tr-ms` pour un trait `dot`) | un par trait de chaque glyphe | `data-g`, `data-s`, `data-pad="tr-pad"`, `data-pts` | `done` |

- Fonctions exposées (lues par les tests) : `TRACE_GLYPHS`, `TRACE_SETS`, `TRACE_EVENTS`, `traceRound` (dans `difficulty.js`), `traceBuildRound`, `traceStrokePoints`, `traceJudge`, `traceClientToPad`, `traceAddStroke(points)` (appelée au lever du doigt avec les points du carré).

### Paliers de `length` (`lengthRound(dd)`, avec `tierValue`)

| Palier | Réglage |
|---|---|
| 1 | `{ mode: 'compare', n: 2, aligned: true, minRatio: 1.3 }` |
| 2 | `{ mode: 'compare', n: 3, aligned: false, minRatio: 1.15, trap: 0.5 }` |
| 3 | `{ mode: 'units', min: 2, max: 6, choices: 3, unit: 12 }` |
| 4 | `{ mode: 'ruler', min: 3, max: 12, offset: false, choices: 4, cm: 6 }` |
| 5 | `{ mode: 'ruler', min: 3, max: 10, offset: true, choices: 4, cm: 6 }` |

- `compare` : longueurs entières de 25 à 90 (unités du dessin, largeur 100) ; alignés : départ x = 5 ; décalés : départ entier de 5 à 25, fin ≤ 95 ; `ask` = `long` ou `short` (une chance sur deux) ; `trap: 0.5` : une fois sur deux on retire jusqu'à ce que le crayon qui finit le plus à droite ne soit pas la réponse.
- `units` : gommes de 12 unités, une rangée de 7 gommes `.ln-unit[data-u]` à partir de x = 5 ; le crayon mesure k × 12 ; choix k - 1, k, k + 1.
- `ruler` : règle de 0 à 15 cm, 1 cm = 6 unités, 0 à x = 5 ; graduations `.ln-tick[data-cm]` et nombres de 0 à 15 ; palier 4 : départ 0, 4 choix = k et 3 tirés parmi k - 2, k - 1, k + 1, k + 2 (de 1 à 15) ; palier 5 : départ s, choix = k, s + k et 2 tirés parmi k - 1, k + 1, k + 2 (différents de s + k).
- Écran : `#ln-stage` (`data-mode`, `data-ask`, `data-len` = k pour `units` et `ruler`) ; crayons dessinés en SVG à l'horizontale (gomme rose à gauche, corps de couleur, pointe en bois `#F1D3A2` et mine `#4A4A4A`) ; mode `compare` : un `button.ln-crayon` par crayon (`data-i`, `data-start`, `data-len`), solution `solSel('.ln-crayon', 'i', bonne)` ; modes `units` et `ruler` : `button.ln-opt[data-v]` (grand nombre), solution `solSel('.ln-opt', 'v', k)`.
- **Contrat DOM de `length`** (seuls sélecteurs lus par les critères) :

| Sélecteur | Mode | Attributs | Classes d'état |
|---|---|---|---|
| `div#ln-stage` | tous | `data-mode` ; `data-ask` (`long` ou `short`, mode `compare`) ; `data-len` = k et `data-start` = 0 ou s (modes `units` et `ruler`) | aucune |
| `button.ln-crayon` (contient un `svg` du crayon) | `compare` | `data-i`, `data-start`, `data-len` (unités du dessin) | aucune |
| `div.ln-crayon.solo` (contient un `svg` du crayon, pas un bouton) | `units`, `ruler` | `data-start`, `data-len` (en gommes ou en cm) | aucune |
| `svg.ln-units rect.ln-unit` | `units` | `data-u` de 0 à 6 ; `x` = 5 + 12 × `data-u`, `width="12"` | aucune |
| `svg.ln-ruler line.ln-tick` | `ruler` | `data-cm` de 0 à 15 ; `x1` = `x2` = 5 + 6 × `data-cm` | aucune |
| `button.ln-opt` | `units`, `ruler` | `data-v` | aucune |
| `svg.ln-guides line.ln-guide` (un `svg` posé sur `#ln-stage`) | `compare`, après l'indice 2 | `data-i`, `data-at` (`start` ou `end`), `x1` = `x2` = début ou fin du crayon | aucune |

- Fonctions exposées : `lengthRound` (dans `difficulty.js`), `lengthBuildRound`.

### Textes (exacts, tous lus à voix haute)

- **Ce que les tests comparent** : `speak()` passe chaque texte par `toSpoken()` (`js/shared/ui/voice.js:55-68` : balises retirées, emojis remplacés par leur mot ou supprimés, espaces retirées devant `? ! , . :`, élisions). Une vérification de voix ne compare donc jamais `spoken` au texte brut de cette table : elle compare à `ev('toSpoken(' + JSON.stringify(texte) + ')')`, ou elle cherche un morceau sans emoji ni ponctuation par une expression régulière, comme `test/saison2.test.js:255` (`/nouveau monde s'ouvre dans le ciel/.test(spoken.join(' '))`). Les textes affichés (`.textContent`) se comparent au texte brut.
- **Phrase du jeu et phrase générique** : `loseLife` dit déjà une phrase générique 70 % du temps (`speakWrongHint`, `js/features/minigame-engine/engine.js:124`, `js/features/screen/screen.js:21-23`), et chaque `speak()` coupe la phrase en cours. Règle, celle de « Les boîtes gigognes » (`js/features/minigames/nesting/nesting.js:118-119`, `if (!loseLife(btn, { disable: false })) speak(tip)`) : la phrase propre au jeu se dit **après** l'appel à `loseLife`, et seulement s'il a renvoyé `false` (mission pas perdue) ; elle remplace donc la phrase générique, qui est tolérée. On ne suit pas « Le miroir magique », qui parle avant `loseLife` (`js/features/minigames/mirror/mirror.js:132-134`) et peut être coupé. Pour `length`, l'appel est `if (!loseLife(btn, { disable: false, onRetry: renderLength })) speak(phrase)` ; la consigne de la question suivante viendra ensuite. Pour `trace`, les 1ᵉʳ et 2ᵉ ratés n'appellent pas `loseLife` (un seul `speak`) ; le 3ᵉ appelle `loseLife(pad, { disable: false })`, puis dit « Regarde le crayon, puis refais ce trait ! ».
- **Deux phrases pour un même événement** : un seul `speak` avec les deux phrases jointes par une espace (ligne 16 : « Bravo, c'est très bien tracé ! » puis la consigne du glyphe suivant ; ligne 15 : la phrase du trait suivant seule).
- **Lecture par les tests** : ils cherchent la phrase du jeu avec `spoken.some((x) => x.includes(toSpoken(texte)))` (ou `spoken.join(' ')`), jamais avec la seule dernière phrase dite.
- **`{dit}` et `{mot}`** : colonnes « Dit » et « Mot » de la table « Glyphes ». `{mot}` est le mot seul, sans article ni emoji (« lion », « lapin », « lune »), dans la phrase dite comme dans `data-say`. L'emoji du mot ne s'affiche que dans l'en-tête, à côté du glyphe. Exemples exacts : `L` : « Trace la lettre L, comme dans lion. Pars du point vert et suis les flèches ! » ; `l` : « Trace la lettre l en attaché, comme dans lapin. Pars du point vert et suis les flèches ! » ; `u` : « Trace la lettre u en attaché, comme dans lune. … » ; `4` : « Trace le chiffre quatre. Pars du point vert et suis les flèches ! ». Chaque mot de la table (lion, tortue, étoile, hibou, île, lune, tomate, lapin, cheval, carotte, moto, ananas, dauphin) contient la lettre tracée.

| Où | Texte |
|---|---|
| `trace`, consigne d'un chiffre | Trace le chiffre {dit}. Pars du point vert et suis les flèches ! |
| `trace`, consigne d'une capitale | Trace la lettre {dit}, comme dans {mot}. Pars du point vert et suis les flèches ! |
| `trace`, consigne d'une lettre attachée | Trace la lettre {dit} en attaché, comme dans {mot}. Pars du point vert et suis les flèches ! |
| `trace`, palier 5 | les mêmes, avec « et suis le chemin gris ! » à la place de « et suis les flèches ! » |
| `trace`, trait suivant | Bravo ! Maintenant, le trait numéro {k}. |
| `trace`, glyphe réussi | Bravo, c'est très bien tracé ! |
| `trace`, raté `start` | Presque ! Pose ton doigt sur le point vert pour commencer. |
| `trace`, raté `cover` | Presque ! Suis bien le chemin gris jusqu'au bout. |
| `trace`, raté `wander` | Doucement ! Reste sur le chemin gris. |
| `trace`, raté `dot` | Touche juste le petit point. |
| `trace`, 3ᵉ raté (démonstration) | Regarde le crayon, puis refais ce trait ! |
| `trace`, indice 1 | Pose ton doigt sur le point vert, puis suis les flèches sans lever le doigt. (palier 5 : « …puis suis le chemin gris sans lever le doigt. ») |
| `trace`, indice 2 | Regarde bien le crayon : il te montre le chemin. À toi ! |
| `length`, consigne `compare` | Touche le crayon le plus long ! (ou : Touche le crayon le plus court !) ; à l'écran : « Le plus long ! » ou « Le plus court ! » |
| `length`, consigne `units` | Combien de gommes mesure ce crayon ? ; à l'écran : « Combien de gommes ? » |
| `length`, consigne `ruler` | Combien de centimètres mesure ce crayon ? ; à l'écran : « Combien de centimètres ? » |
| `length`, erreur `compare` | Ce n'est pas le plus long. Regarde où chaque crayon commence et où il finit. (ou « le plus court ») |
| `length`, erreur `units` | Compte les gommes, de la première jusqu'au bout du crayon. |
| `length`, erreur `ruler` palier 4 | Lis le nombre juste sous la pointe du crayon. |
| `length`, erreur `ruler` palier 5 | sur s + k : « Attention : le crayon ne commence pas au zéro ! » ; sinon : « Compte les centimètres, du début du crayon jusqu'à sa pointe. » |
| `length`, indice 1 | `compare` aligné : « Les crayons partent tous du même bord : regarde lequel va le plus loin. » (court : « …regarde lequel s'arrête le plus tôt. ») ; `compare` décalé : « Attention, les crayons ne partent pas du même endroit : regarde où chacun commence et où il finit. » ; `units` : « Compte les gommes sous le crayon, une par une. » ; `ruler` palier 4 : « Le crayon commence au zéro : lis le nombre sous sa pointe. » ; `ruler` palier 5 : « Le crayon ne commence pas au zéro : compte les centimètres de son début à sa pointe. » |
| `length`, indice 2 | `compare` : « Regarde les traits en pointillés : ils montrent le début et la fin de chaque crayon. » ; `units` : « Compte avec moi : un… et continue jusqu'au bout du crayon ! » ; `ruler` : « Regarde les deux traits qui brillent : le début et la pointe du crayon. Combien de centimètres entre les deux ? » |

### Données de l'île

```js
crayons: {
  name: "L'Île des Crayons", emoji: '✏️', level: 70, diff: 6, saison: 3, short: 'Crayons',
  subtitle: "L'île où tout se dessine",
  game: (age) => (age && age < 7 ? 'trace' : 'length'),
  map: { x: 18, y: 78 }, shape: 'crayons', icon: '✏️', sand: '#FFF6DC', land: '#F7C948',
  intro: "Bienvenue sur l'Île des Crayons, où tout se dessine ✏️",
  sceneEmpty: 'Ton île attend ses décorations en couleurs !',
}
```

- Thème : `body[data-world="crayons"] { --world-sky: #fff6dc; --world-sea: #8fd3f4; --world-deep: #3a4a8c; --world-scene-top: #fffbef; --world-scene-floor: #fbe3a1; }` (à côté de `musique`, `js/shared/styles/design-system-v21.css:109-115`).
- Paysage `ISLE_SCENERY.crayons` (même cadre que `musique`, `js/features/island/island.js:338-360`) : sol `w.land` ; trois crayons géants plantés comme des arbres (corps `#F7C948` bordé `#B8901A`, pointe en bois `#F1D3A2`, mine `#4A4A4A`, l'un rose `#FF9CC8`, l'un bleu `#6FB8F5`) ; un pont en règle jaune avec ses graduations au-dessus d'un ruisseau de peinture bleue ; trois taches de peinture (rose, verte, violette) ; une maison taille-crayon (cube rouge `#E8344E`, porte ronde) ; un chemin de sable `w.sand`.
- Musique : `MUSIC_THEMES.crayons = { root: 64, scale: [0, 2, 4, 7, 9], bpm: 96, lead: 'pluck', prog: [0, 5, 9, 7], tick: true }` (un crayon qui tapote).

### Personnages (`CHARACTERS`, `world: 'crayons'`)

| id | emoji | name | title | gender | loot | Répliques |
|---|---|---|---|---|---|---|
| `gribouille` | ✏️ | Gribouille | le crayon à papier | m | `cahier`, `craie` | « Bienvenue sur mon île ! Ici, tout ce qu'on dessine prend vie. Tu dessines avec moi ? » ; « Un trait, puis un autre trait… et voilà une maison ! Dessiner, c'est facile quand on prend son temps. » ; « Chaque mission réussie, c'est un nouveau dessin sur mon cahier. Allez, au travail ! » |
| `gommette` | 🧽 | Gommette | la gomme rose | f | `gomme`, `cahier` | « Coucou ! Moi, je n'efface pas les erreurs : je t'aide à recommencer. » ; « Pose ton doigt sur le point vert, et suis les flèches. Pas grave si ça dépasse ! » ; « Une lettre bien tracée, c'est une lettre qu'on peut lire. On s'entraîne ? » |
| `taillou` | 🌀 | Taillou | le taille-crayon | m | `copeaux`, `craie` | « Tourne, tourne ! Je taille les crayons, et après ils sont plus courts. » ; « Lequel est le plus long ? Pour savoir, je regarde où il commence et où il finit. » ; « Avec ma règle, je mesure tout ! Tu veux essayer ? » |
| `aquarelle` | 🖌️ | Aquarelle | le pinceau magique | f | `palette`, `gomme` | « Bonjour ! Je peins le ciel en bleu et les nuages en rose. » ; « Un peu de jaune, un peu de bleu… et ça fait du vert ! » ; « J'ai peint une carte au trésor pour Zap. Tu crois qu'elle ressemble à la vraie ? » |

Gommette « parle » du tracé et Taillou de la mesure : c'est une intention de narration, portée seulement par leurs répliques. `characters.js` n'a aucun champ qui lie un personnage à un jeu (une entrée n'a que `emoji`, `name`, `title`, `world`, `gender`, `loot`, `texts`, et parfois `noGames`) ; aucun code ne l'ajoute.

Dessins (`CHAR_ART`, même style que Viola et Boumbo) : Gribouille, un crayon jaune debout, pointe en haut, gomme rose en bas, grands yeux et sourire, petits bras ; Gommette, une gomme rose arrondie avec un bandeau bleu et un nœud ; Taillou, un cube rouge avec un trou rond sur le côté et un copeau de bois ondulé sur la tête comme un chapeau ; Aquarelle, un pinceau au manche en bois `#C99364`, bague argentée, poils violets `#BFA3EC` comme une coiffure, un béret.

### Objets

| Clé | Table | emoji | name | price | Détail |
|---|---|---|---|---|---|
| `cahier` | `ITEMS` | 📒 | Cahier à lignes | 6 | butin |
| `craie` | `ITEMS` | 🖍️ | Craie grasse | 6 | butin |
| `gomme` | `ITEMS` | 🧽 | Gomme rose | 5 | butin |
| `copeaux` | `ITEMS` | 🪵 | Copeaux de crayon | 5 | butin |
| `palette` | `ITEMS` | 🎨 | Palette de couleurs | 8 | butin |
| `regle` | `ITEMS` | 📏 | Règle magique | 7 | donné par personne |
| `feutre` | `ITEMS` | 🖊️ | Feutre pailleté | 7 | donné par personne |
| `equerre` | `ITEMS` | 📐 | Équerre | 6 | donné par personne |
| `trousse` | `CRAFTED` | 👝 | Trousse arc-en-ciel | 22 | recette `{ craie: 2, gomme: 1 }` |
| `fresque` | `CRAFTED` | 🌄 | Fresque du matin | 20 | recette `{ palette: 1, feutre: 1, cahier: 1 }` |
| `potcrayonsD` | `DECOS` | 🏺 | Pot à crayons géant | 40 | |
| `chevaletD` | `DECOS` | 🖼️ | Chevalet de peintre | 30 | |
| `fanionsD` | `DECOS` | 🚩 | Fanions dessinés | 18 | |
| `lampeD` | `DECOS` | 💡 | Lampe de bureau | 14 | |
| `marquepageD` | `DECOS` | 🔖 | Marque-page géant | 12 | |

Toutes avec `world: 'crayons'`.

### Squishies : série « Papeterie »

`SQUISHY_SERIES.papeterie = { name: 'Papeterie', emoji: '✏️', world: 'crayons' }`, ajoutée en fin de `SQUISHY_SERIES_ORDER` ; `SQUISHY_ISLAND_SERIES.crayons = 'papeterie'`.

| id | name | say | rarity | color | shape | size |
|---|---|---|---|---|---|---|
| `crayon-mochi` | Crayon mochi | un crayon mochi | commun | jaune | ovale | grand |
| `gomme-fraise` | Gomme fraise | une gomme fraise | commun | rose | carre | petit |
| `taille-crayon` | Taille-crayon | un taille-crayon | commun | bleu | carre | petit |
| `pot-de-peinture` | Pot de peinture | un pot de peinture | commun | vert | rond | grand |
| `gribouille` | Gribouille | Gribouille, le crayon à papier | rare | orange | ovale | grand |
| `crayon-arc-en-ciel` | Crayon arc-en-ciel | un crayon arc-en-ciel | brille | violet | ovale | grand |

### Histoire : « Le premier morceau de la carte » (`STORY.crayons`)

- `guide: 'gribouille'`, `title: 'Le premier morceau de la carte'`, `reward: 16`.
- `intro` :
  1. « Bienvenue sur l'Île des Crayons ✏️ Ici, tout ce qu'on dessine prend vie ! »
  2. « Le vent a posé un morceau de la carte de Zap sur mon cahier… mais le dessin s'est tout effacé. »
  3. « Résous mes devinettes : chaque bonne réponse redessine un bout de la carte ! »
- `riddles` :
  1. q : « Je suis long et pointu, j'écris et je dessine, et on me taille quand je suis usé. Qui suis-je ? » ; tip : « Sa mine laisse un trait gris sur la feuille. » ; options ✏️ (bonne), 🥄, 🔑.
  2. q : « Je suis plate et droite, avec des petits traits et des nombres, et je sers à mesurer. Qui suis-je ? » ; tip : « On la pose le long d'un crayon pour savoir combien il mesure. » ; options 📏 (bonne), 📖, 🍴.
  3. q : « J'ai des poils tout doux au bout d'un manche, et je me trempe dans la peinture. Qui suis-je ? » ; tip : « On s'en sert pour peindre, pas pour se coiffer. » ; options 🖌️ (bonne), 🪥, 🧹.
- `success` : « Bravo ! Le dessin réapparaît : voici le premier morceau de la carte de Zap 🗺️ » (la track `saison3-ouverture` ajoute ensuite `zapMapSay(1)`).

### Épisodes (`EPISODES.crayons`)

| # | by | title | find | lines |
|---|---|---|---|---|
| 1 | `gommette` | Pas grave si ça dépasse | ⭐ | « Ce matin, Gribouille a dessiné une étoile, et le trait a dépassé. » ; « Je n'ai rien effacé : on a fait une deuxième étoile à côté. Deux étoiles, c'est encore mieux ! » |
| 2 | `taillou` | Le crayon tout petit | 📏 | « J'ai taillé, taillé… et mon crayon est devenu tout petit ! » ; « Je l'ai mesuré avec la règle : il fait trois centimètres. Il dessine encore très bien ! » |
| 3 | `aquarelle` | Le dessin du vent | 🥟 | « Le vent a soufflé sur ma peinture, et il a dessiné… des petits paniers qui fument ! » ; « Zap dit que le prochain morceau de la carte est sur une île où l'on cuisine des dumplings tout doux. » |

- **Référence visuelle** : `trace`, la fenêtre de jeu habituelle (`gameHeader`, `livesBar`, `progressDots`) comme « Les boîtes gigognes » (`js/features/minigames/nesting/nesting.js:69-90`) ; `length`, les boutons de réponse et la mise en page de « Les boîtes gigognes » ; l'île, l'Île de la Musique (`js/features/island/island.js:338-360`, `js/shared/styles/design-system-v21.css:109-115`).
- **Détails non écrits** : l'agent prend le défaut de la référence ou l'option la plus simple, le note dans le journal de décisions du plan, l'humain juge à la revue.

## Hors périmètre

- L'ouverture de la saison 3 (onglet, écran, prologue, carte de Zap) : track `saison3-ouverture`, prérequis de la phase 3.
- Le déplacement des dessins de squishies vers `squishy-art.js` : phase 0 de la track `squishy-boites`, prérequis de la phase 3 (D19).
- Les autres îles de la saison 3 et le trésor de la carte.
- Les lettres attachées en mots entiers, les majuscules cursives, l'écriture du prénom.
- Les demi-centimètres et les millimètres.

## Contrats partagés

| Contrat | Forme (ou lien) | Propriétaire | Consommateurs |
|---|---|---|---|
| Élément de solution tracé | un élément de `gameSolution` qui a `data-pts` (JSON `[[x, y], …]`, unités du carré) et `data-pad` (id du carré) se joue en traçant, pas en cliquant | `features/minigames/trace` | `test/tools/gestures.js` |
| `TRACE_EVENTS` | `window.PointerEvent ? ['pointerdown', 'pointermove', 'pointerup'] : ['mousedown', 'mousemove', 'mouseup']` (le repli ajoute aussi les événements tactiles) | `features/minigames/trace` | `test/tools/gestures.js` |
| `traceAlong(w, el)` | lit `el.dataset.pad` et `el.dataset.pts` ; vérifie que `pad.dataset.g === el.dataset.g` et `pad.dataset.s === el.dataset.s` (sinon renvoie `false`) ; remplace `pad.getBoundingClientRect` par `{ left: 0, top: 0, width: 100, height: 100, right: 100, bottom: 100 }` ; envoie `new w.MouseEvent(type, { clientX, clientY, bubbles: true })` : appui au 1ᵉʳ point, un mouvement par point, lever au dernier ; renvoie `true` | `test/tools/gestures.js` | `test/games.test.js`, `test/companions.test.js`, `test/crayons.test.js` |
| `zapMapSay`, `zapMapPieces`, `.story-zapmap` | définis par la track `saison3-ouverture` | `features/story` | ce chapitre (lignes 41 et 43) |

## Surface d'attaque

Aucune entrée nouvelle hors du doigt (coordonnées numériques, jamais insérées en HTML sans `Number`). Aucun texte saisi.

## Zones sensibles touchées

- PWA : `index.html` et `sw.js` régénérés par `bun run sync` (nouvelles slices `minigame-trace`, `minigame-length`), jamais à la main.
- Dessins des personnages (`characters-art.js`) : 4 nouveaux dessins, demandés explicitement par cette spec (D13) ; aucun dessin existant modifié.

## Smoke test

| Id | Qui | Étapes | Attendu | Niveau visé |
|---|---|---|---|---|
| S1 | 🤖 | `bun run test crayons` | lignes 1 à 23 (`trace` : paliers, glyphes, jugement, tolérance, écran, ratés, indices, tables) | test-verified |
| S2 | 🤖 | `bun run test games` et `bun run test companions` | lignes 24 et 35, ligne 22 : `trace` et `length` gagnés à chaque palier, indices conformes | test-verified |
| S3 | 🤖 | `bun run test crayons` | lignes 25 à 34 (`length`) | test-verified |
| S4 | 🤖 | `bun run test crayons` | lignes 36 à 46 et 48 (île, personnages, objets, ouverture à 70, chapitre, carte de Zap, squishies, épisodes, jeu favori) | test-verified |
| S5 | 🤖 | `bun run test saison2`, `bun run test niveaux`, `bun run test saison3` | ligne 47 et la track d'ouverture toujours verte | test-verified |
| S6 | 🤖 | `bun run check` puis `bun run verify` | tout vert, aucune erreur JS | test-verified |
| S7 | 👤 | Téléphone, la joueuse trace `L`, `4`, puis `i` et `e` au palier 2 | ni trop dur ni trop facile : un tracé honnête passe, un gribouillis non ; les messages aident | runtime-verified |
| S8 | 👤 | Téléphone, l'écran ne défile pas pendant qu'on trace ; essai sur un vieil iPad si possible | le doigt trace sans faire bouger la page | runtime-verified |
| S9 | 👤 | « Mesure les crayons » aux paliers 1 et 2, puis 4 et 5 avec Amrou | crayons et règle lisibles à 360 px, le piège du zéro se comprend | runtime-verified |
| S10 | 👤 | La joueuse découvre l'île, les 4 personnages, le chapitre, la musique | elle juge les noms (Gribouille, Gommette, Taillou, Aquarelle), les dessins et la série « Papeterie » | runtime-verified |

## Questions ouvertes

