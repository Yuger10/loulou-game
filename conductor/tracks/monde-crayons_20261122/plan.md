<!-- Gabarit cothon 0.4.0 (setting-up-docs), adopté dans Conductor (cothon 0.2.0-2 et 0.4.0-6). -->
# Plan : ✏️ L'Île des Crayons

Spec : [spec.md](spec.md). Checklists : [mini-jeu](../../checklist-mini-jeu.md), [île](../../checklist-ile.md).

Livraison : règle « Track livrée en plusieurs PR » de [workflow.md](../../workflow.md) (section « Fin de track : livraison ») : chaque PR intermédiaire par `bun run release patch "résumé"`, la dernière par `bun run release track "résumé"`, numéro pris sur `main` après rebase. Ici : phases 1 et 2 en `patch`, phase 3 en `track`.

Trois phases, chacune une PR livrable seule (chaque merge est en production une minute après). Les phases 1 et 2 ne dépendent de rien : un mini-jeu livré seul est proposé dans « choisir un jeu » sur toutes les îles. La phase 3 attend deux prérequis mergés : les deux PR de la track `saison3-ouverture`, et la phase 0 de la track `squishy-boites` (`js/features/squishies/squishy-art.js`). Les numéros « ligne N » renvoient au « Comportement attendu » de la spec.

## Tâches

### Phase 1 : le mini-jeu « Trace avec ton doigt » (`trace`) (PR 1)

- [ ] 1. `test/tools/gestures.js` : `traceAlong(w, el)` (contrat de la spec), module `require` comme `test/tools/page.js`.
- [ ] 2. Tests rouges dans `test/crayons.test.js` (nouveau, harnais de `test/musique.test.js:1-75`) : lignes 1 à 12 (paliers, ensembles, glyphes, jugement, tolérance, sens, gribouillis, toucher, point du `i`, coordonnées).
- [ ] 3. `js/entities/difficulty/difficulty.js` : `traceRound(dd)` (table des paliers), `LIVES_TABLE.trace`, `trace` dans `NO_TIMER_KINDS` ; export de `traceRound` dans `difficulty.js` et ré-export dans `js/entities/difficulty/index.js` (comme `nestingRound`, ligne 30).
- [ ] 4. `js/features/minigames/trace/trace.js` : `TRACE_GLYPHS`, `TRACE_SETS`, `traceStrokePoints`, `traceJudge`, `traceClientToPad`, `traceBuildRound` (logique pure, tirages par `random`, `shuffle`). Lignes 1 à 12 vertes.
- [ ] 5. Tests rouges : lignes 13 à 23 (écran, pilote, traits et glyphes suivants, ratés, toucher court, palier 5 sans flèches, démonstration au palier 1, indices, tables).
- [ ] 6. Écran et saisie (phrases : règle « Phrase du jeu et phrase générique » de la spec, `speak` après `loseLife`, un seul `speak` pour deux phrases d'un même événement) : `renderTrace()`, `traceAddStroke`, `TRACE_EVENTS` et repli tactile (spec D3), démonstration, `registerGame('trace', …)`, `registerHints('trace', …)`, `setHintQuestion` par glyphe ; `trace.css` (`touch-action: none`, carré, bande, `prefers-reduced-motion`) ; `index.js` ; import de la slice dans `js/app/main.js` (comme `nesting`, ligne 55) ; slice `minigame-trace` dans `js/slices.cjs` (et sa feuille dans `CSS_ORDER`, avant `island.css`) ; `bun run sync`.
- [ ] 7. Branchements : `GAME_TYPES`, `GAME_LIST`, tranche `max: 5` de `AGE_GAME_TYPES` (`js/entities/difficulty/game-types.js`) ; `PROGRESS_CHEERS.trace` (`js/features/adaptive/adaptive.js`) ; groupe `lire` de `SKILL_GROUPS` (`js/features/parents/parents.js`).
- [ ] 8. `test/games.test.js` : `INDEPENDENT.trace`, et dans `playToWin` `traceAlong` quand l'élément a `data-pts` ; `test/companions.test.js` : même remplacement dans la boucle « le jeu reste gagnable » (spec D4, D16). Ligne 24 verte.
- [ ] 9. `bun run typecheck` vert (types de la spec D20), `bun run check` vert. Doc : section du PRD (idée de la joueuse), `conductor/checklist-mini-jeu.md` (§ 1 : un jeu à geste se joue par `data-pts` et `traceAlong`). Livraison : `bun run release patch "Mini-jeu Trace avec ton doigt"`, PR `agent-generated: true`, étiquette `agent`.
- [ ] 10. Ligne 👤 S7 et S8 avec Amrou et la joueuse (tolérance au doigt) ; un réglage de R ou de `cover` se fait dans `traceRound`, noté au journal de décisions.

### Phase 2 : le mini-jeu « Mesure les crayons » (`length`) (PR 2)

- [ ] 11. Tests rouges dans `test/crayons.test.js` : lignes 25 à 30 (paliers et tirages).
- [ ] 12. `lengthRound(dd)` dans `difficulty.js` (ré-exporté par `js/entities/difficulty/index.js`), `length` dans `NO_TIMER_KINDS` et dans `GENEROUS_KINDS` de `livesFor` ; `lengthBuildRound` dans `js/features/minigames/length/length.js`. Lignes 25 à 30 vertes.
- [ ] 13. Tests rouges : lignes 31 à 34 (bonne réponse, autre question après une erreur, piège du zéro, indices, tables).
- [ ] 14. Écran (`renderLength`, crayons et règle en SVG), phrases d'erreur dites après `loseLife` (`if (!loseLife(btn, { disable: false, onRetry: renderLength })) speak(phrase)`, comme `nesting.js:119`), indices (`fx.run` pour les guides, `fx.marks` pour la gomme 1, `fx.glow` et `fx.dim` pour la règle) ; `length.css` ; `index.js` ; import dans `js/app/main.js` ; slice `minigame-length` ; `bun run sync`.
- [ ] 15. Branchements : `GAME_TYPES`, `GAME_LIST`, `AGE_GAME_TYPES` (`max: 5`), `PROGRESS_CHEERS.length`, groupe `mesures`. Vérifier que `length` ne se confond avec la propriété d'aucun tableau (spec D10).
- [ ] 16. `test/games.test.js` : `INDEPENDENT.length`. Ligne 35 verte.
- [ ] 17. `bun run typecheck` vert (`LengthRules`, spec D20), `bun run check` vert. Doc : section du PRD. Livraison : `bun run release patch "Mini-jeu Mesure les crayons"`, PR `agent-generated: true`, étiquette `agent`.
- [ ] 18. Ligne 👤 S9 avec Amrou.

### Phase 3 : l'île (PR 3, après `saison3-ouverture` et la phase 0 de `squishy-boites`)

- [ ] 18 bis. Vérifier les prérequis : `ARCHIPELAGOS[3]` et `zapMapSVG` existent sur `main`, et `js/features/squishies/squishy-art.js` existe. S'il en manque un, s'arrêter et le signaler (prérequis manquant), sans créer d'autre fichier.

- [ ] 19. Tests rouges dans `test/crayons.test.js` : lignes 36 à 40 (île, thème, paysage, musique, personnages, objets).
- [ ] 20. Entités : `WORLDS.crayons` (`js/entities/world/worlds.js`, après `licornes`) ; 4 personnages (`js/entities/character/characters.js`) et leurs 4 dessins (`characters-art.js`, demande explicite de la spec D13, aucun dessin existant touché) ; objets, recettes, décorations (`js/entities/item/items.js`).
- [ ] 21. Thème (`design-system-v21.css`), `ISLE_SCENERY.crayons` (`js/features/island/island.js`), `MUSIC_THEMES.crayons` (`js/features/music/music.js`). Lignes 36 à 40 vertes.
- [ ] 22. Tests rouges : lignes 41 à 46 (ouverture à 70 avec le prologue de Zap puis le chapitre, histoire, récompense et carte de Zap, squishies, épisodes, jeu favori).
- [ ] 23. `STORY.crayons` (`js/features/story/story.js`), `EPISODES.crayons` (`js/features/story/episodes.js`), série `papeterie` et `SQUISHY_ISLAND_SERIES.crayons` (`js/entities/squishy/squishies.js`) ; les 6 dessins `SQ_ART` dans `js/features/squishies/squishy-art.js`, sur le modèle de `'tambour-mochi'` (spec D19). Lignes 41 à 46 vertes.
- [ ] 23 bis. Test rouge de la ligne 48 dans `test/crayons.test.js` (clés et prénoms en double, lus dans le texte source, et tables indexées par clé de jeu qui sont des objets simples) ; il doit échouer si l'on ajoute temporairement une seconde ligne `cahier: {` dans `items.js` (essai local, jamais commité), puis passer.
- [ ] 24. Tests existants (spec D16, ligne 47) : `test/saison2.test.js:100` et `:126-129`, `test/niveaux.test.js:202-207`. `bun run test saison3` reste vert (il retire les vraies îles de la saison 3 avant ses essais).
- [ ] 25. `bun run typecheck` vert (les données de l'île respectent `World`, `Character`, `Item`, `CraftedItem`, `Squishy`, spec D20), `bun run check` vert, puis `bun run verify`.
- [ ] 26. Doc : `conductor/niveaux.md` (« Dans le jeu, aujourd'hui » : l'Île des Crayons existe), `conductor/tracks.md` (track faite), section du PRD (idée de la joueuse). Livraison : `bun run release track "L'Île des Crayons"`, PR avec résumé et risques, `agent-generated: true`, étiquette `agent`.
- [ ] 27. Ligne 👤 S10 avec la joueuse : noms, dessins, série ; un changement de nom se fait dans les données et les tests, noté au journal de décisions.

## Preuves

| Ligne du smoke test | Résultat | Niveau | Preuve |
|---|---|---|---|
| S1 | à faire | test-verified | `bun run test crayons` (exit 0) |
| S2 | à faire | test-verified | `bun run test games`, `bun run test companions` (exit 0) |
| S3 | à faire | test-verified | `bun run test crayons` (exit 0) |
| S4 | à faire | test-verified | `bun run test crayons` (exit 0) |
| S5 | à faire | test-verified | `bun run test saison2`, `bun run test niveaux`, `bun run test saison3` (exit 0) |
| S6 | à faire | test-verified | `bun run check`, `bun run verify` (exit 0) |
| S7 à S10 | à faire | runtime-verified | retour d'Amrou et de la joueuse dans la PR |

## Journal de décisions

En ajout seul : une décision fausse reçoit une nouvelle ligne qui la remplace, on ne modifie ni ne supprime une ligne.

| # | Décision | Décidé par | Pourquoi | Preuve | Résultat |
|---|---|---|---|---|---|
| 1 | Les deux mini-jeux d'abord, chacun dans sa PR ; l'île ensuite | politique | brief commun : « d'abord chacun de ses deux mini-jeux, seul, dans sa PR » | spec, Hors périmètre | gardée |

## Écarts et non vérifié

- La tolérance du tracé (R, `cover`, `wander`) est réglée par calcul : seul l'essai au doigt de la joueuse (S7) dira si elle est juste.
- Pointer Events et le repli tactile sur un vieil iPad (S8) : aucun outil du dépôt ne l'atteint.
