<!-- Gabarit cothon 0.4.0 (setting-up-docs), adopté dans Conductor (cothon 0.2.0-2 et 0.4.0-6) : une nouvelle track part de ce fichier. -->
# Plan : 🗝️ L'Île des Coffres

Spec : [spec.md](spec.md)

Quatre PR, **chacune livrable seule** (chaque merge est en production une minute après) : 1a et 1b (« Le trésor raconté », découpé en deux), 2 (« Le code secret »), 3 (l'île). 1a précède 1b ; 2 peut passer avant, entre ou après elles. Les phases 1a et 2 ajoutent chacune un mini-jeu proposé dans « choisir un jeu » sur toutes les îles. La phase 3 attend que la track `saison3-ouverture` et la phase 0 de `squishy-boites` soient sur `main`, et que l'île précédente, `dumplings`, soit dans `WORLDS` (ordre des îles : crayons, dumplings, coffres, chatouilles, concert). Le passage des tests de carte à 3 onglets se fait dans la track Crayons, pas ici. Chaque PR se termine par un rebase sur `main`, `bun run check` vert, la commande de livraison (numéro pris sur `main` après rebase, jamais fixé à l'avance) et la section du PRD : `bun run release patch "résumé"` pour les PR intermédiaires (1a, 1b, 2), `bun run release track "résumé"` pour la dernière (3).

## Tâches

### Phase 1a : « Le trésor raconté », paliers 1 à 3, PR 1a

État du code en entrée : `main` sans `problems`. Contenu : T1 lignes 1 à 3 seulement (`problemsRound` n'a que les clés 1, 2, 3), représentations `concret`, `concret-barre`, `barres` (sans l'égalité du palier 4), types `reunion`, `ajout`, `retrait`, `partie`, `ajoutInconnu`, `compPlus`, `compEcart`. Critères dus : 1 à 9 (sans la phrase « Au palier 4, l'égalité… » du critère 9), 11 à 13, 16 à 20. Smoke test dû : S1, S2 et S4 pour `problems` sur ce contenu, S7.

Entre 1a et 1b, une enfant jouée aux paliers 4 et 5 reçoit exactement le palier 3 : `tierValue` (`js/entities/difficulty/difficulty.js:86-97`) renvoie, pour un palier absent de la table, l'entrée de la plus grande clé présente, ici 3. C'est un état correct : nombres jusqu'à 20, barres, comparaisons ; `test/games.test.js` joue les paliers 1 à 5 et gagne les paliers 4 et 5 avec ce contenu. `gameMaxTier('problems')` reste 5 (`js/features/adaptive/adaptive.js:73`) : le niveau du jeu peut monter à 4 ou 5 avant 1b ; à la livraison de 1b, l'enfant déjà à ce niveau reçoit les nouveaux types sans nouvel exemple résolu si son `atLvl` compte déjà 2 missions (accepté : les indices H1 couvrent ces types).

- [ ] 1.1 Test `test/problems.test.js` (rouge), sur le contenu de 1a seulement (lignes 1 à 3 de T1, critères dus à 1a ; la tâche 1b.1 l'étend) : table T1 (500 tirages par palier : types permis, bornes et aucune plage vide (exemples aux extrêmes de la spec), règle de répétition du critère 2 (un tirage libre n'a jamais le type du dernier problème résolu ou raté ; le jumeau et sa relance gardent le type de l'exemple), `possible` rare), règle R1 (3 ou 4 choix distincts, dont `r`, tous au moins 1 : jamais 0, ni comme réponse ni comme leurre ; leurres à au plus 3 ou 10 de `r`, table « autre opération »), longueurs des barres (`style.width` de chaque barre, « ? » comprise, selon F1), étiquettes et cases de L1 pour chaque type et chaque étape, accords de B1 (« une pièce », « un coquillage », jamais « 1 pièce »), mode E1 (définition totale, dont `s` sans `lvl` : `n = 0`), objets littéraux de `problemsRound` (G, `choices`, `tens` lus sur la ligne ; aux paliers 4 et 5 pendant 1a, la ligne 3), table H0 (ligne d'indice par moment, dès l'ouverture), règle des vignettes du critère 3, échec enregistré et E1 inchangé (D31), critères 3 à 17 en jouant la fenêtre (une erreur à chaque étape notée relance un nouveau problème selon X2 : tuple de nombres exclu, type différent sauf pour le jumeau, objet du jumeau différent de l'exemple ; au moins 3 tuples par palier et type), vignettes de V1 (objets comptés seulement sur les phrases avec nombre), `#pb-root` porte ses `data-*` selon la table A1 pour chaque type ; une erreur pendant le jumeau relance un jumeau seul (D25).
- [ ] 1.2 Tests existants (rouge) : `gameSolution` égale la table G1 de la spec pour chaque mode et type (les quatre exemples complets de G1 compris), chaque sélecteur désigne un élément de son bloc, et la mission se gagne avec 5 ms entre les clics ; `test/games.test.js` : `INDEPENDENT.problems` recalcule `r` depuis `#pb-root` et le compare au dernier `.pb-num` (ou `.pb-yesno`) de `gameSolution` ; `test/smoke.test.js` : le jeu s'ouvre, une mauvaise réponse relance une autre question, la difficulté suit palier et âge ; dans le test « variété : les 2 jeux jamais essayés remontent en priorité » (`test/smoke.test.js:844-852`), ajouter `state.gameCounts["problems"]=1` à la liste (ajout seulement, aucune vérification affaiblie ; voir `conductor/checklist-mini-jeu.md`).
- [ ] 1.2b `test/problems.test.js` : `GAME_TYPES` et les clés de `GAME_LIST` sont sans doublon, et `problems` y figure une seule fois (le test de la phase 2 fait de même pour `code`).
- [ ] 1.3 `js/entities/difficulty/difficulty.js` : `problemsRound(dd)` (T1, par `tierValue`), `LIVES_TABLE.problems`, `'problems'` dans `NO_TIMER_KINDS` ; export.
- [ ] 1.4 `js/entities/difficulty/game-types.js` : `'problems'` dans `GAME_TYPES` et `GAME_LIST` (🪙, « Le trésor raconté ») ; rien dans `AGE_GAME_TYPES` (D15).
- [ ] 1.5 Slice `js/features/minigames/problems/` (`problems.js`, `problems.css`, `index.js`) et `js/slices.cjs` (slice `minigame-problems`, CSS dans `css` et `CSS_ORDER`), ; `import '../features/minigames/problems/index.js';` dans `js/app/main.js` (à côté de celui de `nesting`, ligne 55) ; `problemsRound` ré-exporté par `js/entities/difficulty/index.js` ; puis `bun run sync`.
- [ ] 1.6 Tirage (T1 lignes 1 à 3, B1 avec sa table locale `PB_PEOPLE` et ses objets locaux, sans import de `characters.js` ni d'aucune entité de l'île, P0, R1) et fenêtre (visages = emojis de `PB_PEOPLE`) : étapes, vignettes, concret, concret-barre, barres (F1, L1), réponse ; `setSolution` complet dès l'ouverture (D9, G1).
- [ ] 1.7 Exemple résolu et estompage (E1, N1) dans la même fenêtre.
- [ ] 1.8 Indices H1 (`registerHints('problems', …)`, `setHintQuestion` à chaque étape notée) ; `test/companions.test.js` vert.
- [ ] 1.9 `PROGRESS_CHEERS.problems`, `SKILL_GROUPS` groupe `calcul`.
- [ ] 1.10 `bun run check` vert ; S1, S2, S4 prouvés sur ce contenu (et paliers 4 et 5 joués avec la table du palier 3) ; S7 proposé à Amrou.
- [ ] 1.11 Doc : PRD (section de la version), `conductor/tracks.md` (phase 1a cochée), `README.md` si la structure l'exige ; livraison `bun run release patch "…"`.

### Phase 1b : « Le trésor raconté », paliers 4 et 5, PR 1b

État du code en entrée : 1a sur `main` (`problemsRound` à 3 clés, `problems` jouable partout). Contenu : T1 lignes 4 et 5, représentation `egalite`, égalité sous le schéma au palier 4, types `compMoinsPlus`, `deuxEtapes` (blocs `-e2`, 7 pas d'exemple), `possible` (`.pb-yesno`), leurres à 10 et `r ± 10` de R1, indices H1 « Égalité » et « possible ». Critères dus : 9 (phrase du palier 4), 10, 14, 15, et 2, 11, 16, 19 pour ces nouveaux types. Smoke test dû : S1, S2 et S4 sur toute la table T1.

- [ ] 1b.1 Tests (rouge) : `test/problems.test.js` étendu aux paliers 4 et 5 (T1, exemples aux extrêmes, L1 des nouveaux types, A1 pour `deuxEtapes` et `possible`, G1 dont les deux derniers exemples complets) ; `INDEPENDENT.problems` couvre `deuxEtapes` et `possible`.
- [ ] 1b.2 `problemsRound` : clés 4 et 5.
- [ ] 1b.3 Fenêtre : égalité (palier 4 sous le schéma dans `.pb-eq-text`, forme et exemples du critère 9, palier 5 seule, jugée au toucher du signe quand les deux cases sont pleines, critère 10), deux étapes, possible ; exemple résolu et jumeau de ces types (N1).
- [ ] 1b.4 Indices H1 des nouvelles étapes ; `test/companions.test.js` vert.
- [ ] 1b.5 `bun run check` vert ; S1, S2, S4 prouvés sur toute la table ; doc (PRD, `conductor/tracks.md`) ; livraison `bun run release patch "…"`.

### Phase 2 : « Le code secret » (`code`), PR 2

- [ ] 2.1 Test `test/code.test.js` (rouge) : après un mauvais code, `data-code` du nouveau cadenas différent de celui du cadenas raté (X2) ; règle de sélection des roues du critère 25 (son exemple compris) ; 200 cadenas par palier (T2 : roues, palette, types, nombre d'indices et de « est »), solution unique, chaque indice nécessaire (solveur propre au test, par permutations), phrases de I2 accordées (« du poisson », « de l'étoile »), critères 24 à 28 en jouant la fenêtre (« Ouvrir » inactif avec une roue vide, un symbole posé sur une seconde roue quitte la première (D26), indice 1 qui vise toujours une carte et indices distincts sur 200 cadenas par palier, mauvais code : autre cadenas, une erreur notée).
- [ ] 2.2 `gameSolution` égale G2 ; dans le même test de `test/smoke.test.js`, ajouter `state.gameCounts["code"]=1` (ajout seulement) ; `test/games.test.js` : `INDEPENDENT.code` résout `#code-root[data-clues]` avec le solveur du test et compare à `gameSolution` ; `test/smoke.test.js` : ouverture et anti-devinette.
- [ ] 2.3 `difficulty.js` : `codeRound(dd)` (T2), `'code'` dans `GENEROUS_KINDS` et `NO_TIMER_KINDS` ; `game-types.js` : `GAME_TYPES`, `GAME_LIST` (🔐, « Le code secret »).
- [ ] 2.4 Slice `js/features/minigames/code/` et `js/slices.cjs` ; `import '../features/minigames/code/index.js';` dans `js/app/main.js` ; `codeRound` ré-exporté par `js/entities/difficulty/index.js` ; puis `bun run sync`.
- [ ] 2.5 Fabrication des cadenas (algorithme de I2 ; symboles S2 et couleurs T2 en local, aucune entité de l'île, P0), fenêtre (roues, palette, cartes d'indice dessinées, « Ouvrir »), voix (consigne, indices), `setSolution`.
- [ ] 2.6 Indices H2 ; `test/companions.test.js` vert.
- [ ] 2.7 `PROGRESS_CHEERS.code`, `SKILL_GROUPS` groupe `logique`.
- [ ] 2.8 `bun run check` vert ; S1, S3, S4 prouvés ; S8 proposé à Amrou.
- [ ] 2.9 Doc : PRD, `conductor/tracks.md` ; livraison `bun run release patch "…"`.

### Phase 3 : l'île, PR 3 (après 1a, 1b, 2, `saison3-ouverture`, la phase 0 de `squishy-boites` et `monde-dumplings` : table P0 de la spec)

- [ ] 3.1 Test `test/coffres.test.js` (rouge), même harnais que `test/musique.test.js` : critères 31 à 37 (île, niveau 86, `saison: 3`, `diff: 6`, `map: { x: 82, y: 70 }`, `worldsOf(3).indexOf('coffres') === 2`, carte sans chevauchement, chapitre avec `.story-zapmap`, `storyWin('coffres')` : `zapMapPieces() === 3` et `svg.zap-map[data-found="3"]`, 4 personnages (champs de K1, `world: 'coffres'`), leurs butins et répliques, `favoritesOf` (2 objets préférés, tous deux objets de l'île `coffres`), 8 objets, 2 recettes, 5 décorations, thème appliqué, musique, série « Coffres » et sa boîte gagnée une fois, chapitre lu par Clémence, mauvaise réponse : autre énigme, 16 pièces une seule fois, 3 épisodes au bon moment et par les bons personnages, jeu favori `problems`).
- [ ] 3.1b Test « aucune clé en double » dans `test/coffres.test.js` (rouge si une clé est prise) : les ids de `CHARACTERS` et de `COMPANIONS` sont disjoints ; les prénoms (`name`) de `CHARACTERS` et de `COMPANIONS` sont tous différents ; les clés de `ITEMS`, `CRAFTED` et `DECOS` sont disjointes deux à deux ; chaque nouvelle clé de l'île (table « Inventaire des clés » de la spec) n'est présente qu'une fois dans son registre ; `SQUISHY_SERIES`, `MUSIC_THEMES`, `ISLE_SCENERY` et `STORY` ont une seule entrée `coffres`. Le test parcourt les registres eux-mêmes (pas une liste recopiée) : il protège aussi les îles suivantes.
- [ ] 3.2 `worlds.js` (W1, placée juste après `dumplings`), `design-system-v21.css` (thème), `island.js` (`ISLE_SCENERY.coffres`).
- [ ] 3.3 `characters.js` (K1) et `characters-art.js` (4 nouveaux dessins, aucun dessin existant touché).
- [ ] 3.4 `items.js` (O1, R2, D1).
- [ ] 3.5 `squishies.js` (Q1) et `js/features/squishies/squishy-art.js` (6 entrées `SQ_ART` sur le modèle de `'lyre-doree'`) ; si ce fichier n'existe pas (phase 0 de `squishy-boites` non livrée), s'arrêter et signaler le prérequis manquant.
- [ ] 3.6 `story.js` (C1 ; la carte de Zap vient de `zapMapSVG`, `zapMapSay`, `zapMapPieces`, rien à stocker), `episodes.js` (P1 à P3), `music.js` (M1).
- [ ] 3.7 `bun run sync`, `bun run test niveaux`, `bun run check` vert ; S5, S6 prouvés ; S9, S10 proposés à Amrou et à la joueuse.
- [ ] 3.8 Doc : PRD (idée de la joueuse), `conductor/niveaux.md` (l'île existe dans le jeu), `conductor/tracks.md` (track cochée) ; livraison `bun run release track "…"`.

## Preuves

Chaque affirmation pointe vers une preuve : commande exacte, code de sortie, chemin de la sortie. `build-only` n'est jamais une preuve de comportement.

| Ligne du smoke test | Résultat | Niveau | Preuve |
|---|---|---|---|
| S1 | à faire | test-verified | `bun run test games` (exit 0) |
| S2 | à faire | test-verified | `bun run test problems` (exit 0) |
| S3 | à faire | test-verified | `bun run test code` (exit 0) |
| S4 | à faire | test-verified | `bun run test companions` (exit 0) |
| S5 | à faire | test-verified | `bun run test coffres` (exit 0) |
| S6 | à faire | test-verified | `bun run check` (exit 0) |
| S7 à S10 | à faire | runtime-verified | retour d'Amrou et de la joueuse, noté ici |

## Journal de décisions

En ajout seul : une décision fausse reçoit une nouvelle ligne qui la remplace, on ne modifie ni ne supprime une ligne.

| # | Décision | Décidé par | Pourquoi | Preuve | Résultat |
|---|---|---|---|---|---|
| 1 | Trois phases livrables seules : `problems`, `code`, puis l'île | politique | brief de la saison 3 : chaque mini-jeu seul, puis l'île | spec, « Politiques » | gardée |
| 9 | `gameCounts` de `problems` et `code` ajoutés au test de variété | spec | testeur à blanc, tour 9 | `test/smoke.test.js:846` | gardée |
| 8 | Corrections du tour 8 : vignettes V1, règles d'exclusion X2 | spec | testeur à blanc | spec, `taster` | gardée |
| 7 | Corrections du tour 7 (6 faits, 1 décision : D31) | spec | testeur à blanc | spec, `taster` | gardée |
| 6 | Phase 1 découpée en 1a (paliers 1 à 3) et 1b (paliers 4 et 5) ; `release patch` pour 1a, 1b, 2, `release track` pour 3 | coordination | `problems` trop gros pour une PR | spec, D30 ; `js/entities/difficulty/difficulty.js:86-97` | gardée |
| 5 | Corrections du tour 2 (5 faits, 1 décision : D28) et dessins des squishies dans `squishy-art.js` (D29) | spec | testeur à blanc, coordination | spec, `taster` | gardée |
| 4 | Corrections du tour 1 du testeur à blanc (6 faits, 2 décisions : D25, D26) | spec | testeur à blanc | spec, `taster` | gardée |
| 3 | Inventaire des clés nouvelles vérifié par `grep` dans `js/` et dans les specs des quatre autres îles : aucune collision | spec | demande de la coordination (clés déjà prises ailleurs) | spec, « Inventaire des clés » | gardée |
| 2 | Carte de Zap, position `{ x: 82, y: 70 }` et ordre de livraison alignés sur `saison3-ouverture` | spec | contrat fixé le 22/11/2026 | spec, D21 et D22 | gardée |

## Écarts et non vérifié

Rien encore. Non vérifié à l'écriture de la spec : les trois articles de recherche cités (accès refusé ou serveur injoignable).
