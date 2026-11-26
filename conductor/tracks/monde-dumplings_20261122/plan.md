<!-- Gabarit cothon 0.4.0 (setting-up-docs), adopté dans Conductor (cothon 0.2.0-2 et 0.4.0-6) : une nouvelle track part de ce fichier. -->
# Plan : 🥟 L'Île des Squishy Dumplings

Spec : [spec.md](spec.md). Workflow : [workflow.md](../../workflow.md). Checklists : [checklist-mini-jeu.md](../../checklist-mini-jeu.md), [checklist-ile.md](../../checklist-ile.md).

Trois phases, **une PR chacune**, livrables seules (chaque merge est en production une minute après). Les phases 1 et 2 ne dépendent de rien : un mini-jeu livré seul est proposé dans « choisir un jeu » sur toutes les îles. La phase 3 attend la track `saison3-ouverture` et l'île précédente de la saison, `crayons`, dans `WORLDS`. Livraison selon la règle « Track livrée en plusieurs PR » de [workflow.md](../../workflow.md) (section « Fin de track : livraison ») : les phases 1 et 2 par `bun run release patch "résumé"`, la phase 3, dernière, par `bun run release track "résumé"` ; le numéro est pris sur `main` après rebase.

## Tâches

### Phase 1 : le mini-jeu `tens` « Les paniers de dix » (PR 1)

- [x] 1. Tests d'abord, `test/dumplings.test.js` (nouveau fichier, harnais de `test/musique.test.js`) : `tensRound` égal (`toEqual`) aux 5 objets littéraux de T1 ; règles de tirage par mode (pas de multiple de 10 au palier 2, au moins 2 termes en `write`) ; accords R3 (« 1 tout seul », « 1 panier », « 1 pile ») ; pièges R1 sur les exemples de la table (34, 33, 30, 345, 305, 300, 950) et aux bornes de chaque palier (11, 19, 21, 69, 20, 99, 100, 999 : 999 passe par le repli vers le bas) ; indices de `read` sur les groupes dessinés, dont `looseBig` (33 dessiné en 2 paniers et 13 tout seuls) ; contrat C1 en `build` (déplacement, `data-id` gardé, `full` au 10ᵉ, dumpling rangé non touchable) ; textes de T12 et indices T3 dans chaque cas (dont 30, 300, u = 1), comparés par `toSpoken` ; règle R1 (nombre de réponses, une seule juste, pièges dans l'ordre, bornes 1 à 999) sur 200 tirages par palier avec `TEST_SEED` ; écritures T2 (au moins 2 termes) ; mode `make` : regroupement à 10, ↩️, « C'est prêt ! » vide sans perte d'essai, bon et mauvais total ; profil de 6 ans sans classe ni défi étoile plafonné au palier 2 (S5, S6) ; **clés uniques** : `GAME_TYPES` et `GAME_LIST` sans clé en double, `tens` et `order` présents une seule fois. Constater l'échec.
- [x] 2. Tests `test/smoke.test.js` : ajouter `state.gameCounts["tens"]=1` à la liste du test « variété : les 2 jeux jamais essayés remontent en priorité » (vers la ligne 846, règle de la checklist mini-jeu) ; le jeu s'ouvre, une bonne réponse gagne, une mauvaise relance un autre (mode, nombre) ; `test/games.test.js` : solveur indépendant `tens` selon C1 (`build` et `read` : la réponse vaut 100 × `.tens-pile` + les `.tens-dumpling` de `#tens-stage` ; `write` : la réponse vaut la somme de `data-terms` ; `make` : la suite de boutons égale aux chiffres de `data-target`). Constater l'échec.
- [x] 3. `js/entities/difficulty/difficulty-s3.js` (D29 ; le créer s'il n'existe pas, sur le modèle de `difficulty-s2.js` : `import { tierValue } from './difficulty.js'`, déclaré dans `js/slices.cjs`, slice `difficulty`, après `difficulty-s2.js`, réexporté par `js/entities/difficulty/index.js` dans un bloc `export { … } from './difficulty-s3.js'`, `bun run sync`) : typedef `TensRound` et `tensRound(dd)` typé (D27 : `@param`, `@returns {TensRound}`, table `Record<number, TensRound>`), T1, commentaire du repère scolaire ; dans `difficulty.js` (une ligne chacun) : `'tens'` dans `GENEROUS_KINDS` et `NO_TIMER_KINDS` ; export dans le bloc `difficulty-s3.js` de `js/entities/difficulty/index.js`.
- [x] 4. `js/features/minigames/tens/tens.js`, vérifié en strict par `bun run typecheck` (D27) : `renderTens` (modes `build`, `read`, `make`, `write`), `setSolution`, `setHintQuestion('tens', q, { choices: '.tens-opt' })`, indices T3 par `registerHints`, `registerGame('tens', renderTens)` ; `index.js` ; `tens.css` (panier 2 × 5, boutons de 64 px au moins, 360 px de large sans défilement : jsdom ne fait pas de mise en page, ces mesures se jugent à l'œil sur téléphone, ligne 👤 S11).
- [x] 5. Branchements : slice `minigame-tens` dans `js/slices.cjs` (CSS dans `css` et `CSS_ORDER`, avant `island.css`) ; `GAME_TYPES`, `GAME_LIST` (🧺 « Les paniers de dix ») et tranche `max: 5` de `AGE_GAME_TYPES` ; import `../features/minigames/tens/index.js` dans `js/app/main.js` (à côté de `nesting`, `main.js:55`) ; ré-export de `tensRound` dans le bloc `difficulty-s3.js` de `js/entities/difficulty/index.js` (comme `nestingRound` dans le bloc `difficulty-s2.js`) ; `PROGRESS_CHEERS.tens` ; `SKILL_GROUPS` groupe `nombres` ; `bun run sync`.
- [x] 6. `bun run typecheck` vert (strict sur `js/entities`) et `bun run check` vert ; `bun run test companions` vert (indices).
- [ ] 7. Docs : `README.md` (structure) si besoin ; vérification manuelle de fin de phase (workflow.md) : `bun run start`, vue téléphone, « choisir un jeu », jouer aux paliers 1 et 2 (S11).
- [ ] 8. Livraison : rebase sur `main`, `bun run release patch "Les paniers de dix (île des Squishy Dumplings, phase 1)"`, section du PRD (idée de la joueuse : ranger dans des boîtes), PR avec `agent-generated: true` et l'étiquette `agent`.

### Phase 2 : le mini-jeu `order` « La commande du chef » (PR 2)

- [ ] 9. Tests d'abord, `test/dumplings.test.js` : `orderRound` égal (`toEqual`) aux 5 objets littéraux de T4 ; tirage (sortes, quantités 1 à 3, total dans les bornes, attributs inactifs à leur défaut) sur 200 tirages par palier ; phrase R2 sur 4 cas écrits à la main (1, 2 et 3 sortes, palier 5 avec forme et visage) ; palette (taille, sortes commandées présentes, distracteurs à un attribut près en premier) ; plateau (8 au plus, retrait au toucher) ; « Servir » vide sans perte d'essai ; après une erreur, la signature de la nouvelle commande diffère (200 relances par palier, palier 1 compris). Constater l'échec.
- [ ] 10. Tests `smoke` (ajouter `state.gameCounts["order"]=1` à la liste du test de variété, vers la ligne 846 ; ouverture, phase « voir » puis « préparer », bonne commande gagne, mauvaise relance une autre commande) et `games` (solveur indépendant selon C2 : les `data-k` des `.order-pick` de la solution, avec leurs nombres, égalent ceux des `.order-item` du ticket). Constater l'échec.
- [ ] 11. `difficulty-s3.js` : typedef `OrderRound` et `orderRound(dd)` typé (D27), T4, réexporté par `index.js` ; dans `difficulty.js` : `LIVES_TABLE.order = { 2: 3, 3: 3, 4: 2, 5: 2 }`, `'order'` dans `NO_TIMER_KINDS` ; export.
- [ ] 12. `js/features/minigames/order/order.js`, vérifié en strict par `bun run typecheck` (D27) : `renderOrder`, dessin SVG d'un dumpling (couleur `SQ_COLORS`, forme `rond` ou `lune`, visage `sourit` ou `dort`), ticket, palette, plateau, indices T5 (`q.phase`), `registerGame('order', renderOrder)` ; `index.js` ; `order.css`.
- [ ] 13. Branchements : slice `minigame-order`, `GAME_TYPES`, `GAME_LIST` (🥟 « La commande du chef »), tranche `max: 5`, import `../features/minigames/order/index.js` dans `js/app/main.js`, ré-export de `orderRound` dans le bloc `difficulty-s3.js` de `js/entities/difficulty/index.js`, `PROGRESS_CHEERS.order`, `SKILL_GROUPS` groupe `logique` ; `bun run sync`.
- [ ] 14. `bun run typecheck` et `bun run check` verts ; vérification manuelle (S12), avec et sans le son.
- [ ] 15. Livraison comme la tâche 8, par `bun run release patch "La commande du chef (île des Squishy Dumplings, phase 2)"`. Le PRD dit que c'est un jeu de mémoire pour le plaisir, sans promesse d'entraînement du cerveau (D8).

### Phase 3 : l'île, ses personnages, son histoire et son jeu favori (PR 3)

Prérequis : `saison3-ouverture` livrée (`ARCHIPELAGOS[3]`, `refreshArchipelagos()`, `ZAP_MAP_PIECES`), `WORLDS.crayons` présent. Les tests des onglets de carte restent ceux de la track des Crayons.

- [ ] 16. Tests d'abord, `test/dumplings.test.js` : `WORLDS.dumplings` égal à T6, `worldsOf(3).indexOf('dumplings') === worldsOf(3).indexOf('crayons') + 1` (jamais une liste exacte de `worldsOf(3)`, qui change avec les îles suivantes), série après `licornes` dans `SQUISHY_SERIES_ORDER` ; personnages T7 (butin, 3 répliques, `favoritesOf`) ; objets, recettes, décorations T8 ; thème CSS, `ISLE_SCENERY.dumplings` (`<rect`, `<path`), `MUSIC_THEMES.dumplings` ; série T9, `squishyArtSVG(id)` non vide pour les 6 ids, `SQUISHY_ISLAND_SERIES`, `SQ_BOX_COLORS` ; chapitre T10 (verrouillée au niveau 77, ouverte ensuite ; `.story-zapmap` à l'ouverture ; autre énigme après une erreur ; `storyWin('dumplings')` : 16 pièces, boîte, `zapMapPieces() === 2`, `.story-zapmap.happy svg.zap-map[data-found="2"]`, voix `zapMapSay(2)` ; au second appel, pas de seconde boîte et `storySolved.dumplings` vrai, les pièces ne sont pas vérifiées) ; épisodes T11 (missions 2, 4, 7 ; conteurs) ; `worldGame('dumplings', 6) === 'tens'` (S7 à S9) ; **clés uniques** (échoue sur une clé en double ou écrasée) : aucun id commun entre `CHARACTERS` et `COMPANIONS`, aucun prénom (`name`) porté deux fois parmi les personnages et les compagnons, aucune clé commune entre `ITEMS`, `CRAFTED` et `DECOS`, et chaque clé de T7 à T9 a bien `world === 'dumplings'` (ou `series === 'dumplings'`), ce qui détecte une entrée écrasée par une autre île (oxlint `no-dupe-keys` ne voit que les doublons dans un même objet). Constater l'échec.
- [ ] 16 bis. Tests existants à effectif figé (comportement 40, règle 2 quater de `conductor/checklist-ile.md`), avant le code des personnages et des squishies : après rebase, relever les valeurs de `main` puis ajouter 4 au nombre de personnages de `test/smoke.test.js` (vers 755), `'dumplings'` en fin de la liste des séries de `test/squishies.test.js` (vers 86, libellé compris) et 6 au nombre de squishies (vers 91 et 107) ; constater l'échec.
- [ ] 17. Entités (D29, fichiers `-s3` préparés par `saison3-ouverture`) : `WORLDS.dumplings` après `crayons` (`worlds.js`) ; les 4 personnages dans `CHARACTERS_S3` de `characters-s3.js` ; leurs dessins dans `season3Art(ART, kit)` de `characters-art-s3.js`, aucun dessin existant touché (un outil absent de `ArtKit` s'ajoute au `@typedef ArtKit` et à l'objet passé aux deux appels) ; `wc -l` de chaque fichier partagé avant l'ajout (D29) ; objets, recettes, décorations dans `items.js`.
- [ ] 18. Features : thème dans `design-system-v21.css`, paysage dans `ISLE_SCENERY_S3` de `island-s3.js`, musique dans `music.js` ; série dans `squishies.js` (lignes courtes : `SQUISHY_SERIES`, `SQUISHY_SERIES_ORDER`, `SQUISHY_ISLAND_SERIES`) et 6 modèles dans `SQUISHIES_S3` de `squishies-s3.js` ; 6 dessins dans `SQ_ART_S3` de `js/features/squishies/squishy-art-s3.js` sur le modèle de `'tambour-mochi'` (`squishy-art.js:395`), et `SQ_BOX_COLORS.dumplings` dans `squishy-art.js` (`:604`).
- [ ] 19. Histoire : `STORY.dumplings` dans `STORY_S3` de `story-s3.js`, `EPISODES.dumplings` dans `episodes.js` (vérifié en strict par `bun run typecheck`, comme tout `js/`).
- [ ] 20. `bun run typecheck` vert (les entrées de l'île tiennent dans `World`, `Character`, `Item`, `CraftedItem`, `SquishySeries`, `Squishy`, sans typedef étendu) et `bun run check` vert (dont `niveaux`, carte dans le cadre et sans chevauchement) ; vérification manuelle à 360 px : ouverture de l'île, 4 personnages, les 2 jeux, chapitre, un épisode (S13, S14).
- [ ] 21. Livraison de la dernière PR : rebase sur `main`, `bun run release track "Île des Squishy Dumplings (phase 3)"`, PRD, PR comme la tâche 8 ; `conductor/niveaux.md` (« Dans le jeu, aujourd'hui ») et `conductor/tracks.md` mis à jour.

## Preuves

Chaque affirmation pointe vers une preuve : commande exacte, code de sortie, chemin de la sortie. `build-only` n'est jamais une preuve de comportement.

| Ligne du smoke test | Résultat | Niveau | Preuve |
|---|---|---|---|
| S1 | à faire | test-verified | `bun run test dumplings` (exit 0) |
| S2 | à faire | test-verified | `bun run test games` (exit 0) |
| S3 | à faire | test-verified | `bun run test smoke` (exit 0) |
| S4 | à faire | test-verified | `bun run test companions` (exit 0) |
| S5 à S9 | à faire | test-verified | `bun run test dumplings` (exit 0) |
| S10 | à faire | test-verified | `bun run test niveaux`, `bun run check` (exit 0) |
| S11 à S14 | à faire | e2e-verified | compte rendu d'Amrou et de la joueuse dans la PR |

## Journal de décisions

En ajout seul : une décision fausse reçoit une nouvelle ligne qui la remplace, on ne modifie ni ne supprime une ligne.

| # | Décision | Décidé par | Pourquoi | Preuve | Résultat |
|---|---|---|---|---|---|
| 1 | Livrer en 3 PR : `tens`, `order`, puis l'île | politique | brief d'Amrou du 22/11/2026 : chaque mini-jeu seul, puis l'île | spec, en-tête | gardée |
| 2 | Taille des fichiers : `difficulty-s3.js` et les fichiers `-s3` (personnages, dessins, squishies et leurs dessins, chapitre, paysage) remplacent `rounds-saison3.js` et `characters-art-saison3.js` ; plus d'export de `tierValue` à ajouter (spec D29, qui remplace D28) | politique | la v66.16 a posé le modèle `-s2` et abaissé `max-lines` à 800 ; `tierValue` est déjà exporté par `difficulty.js` | `conductor/checklist-ile.md` (section 2 bis), `.oxlintrc.json:40` | gardée |

## Écarts et non vérifié

- Lignes 👤 : S11 à S14.
