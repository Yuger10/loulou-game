<!-- Gabarit cothon 0.4.0 (setting-up-docs), adopté dans Conductor (cothon 0.2.0-2 et 0.4.0-6). -->
# Plan : l'ouverture de la saison 3 « La Grande Expédition »

Spec : [spec.md](spec.md)

Livraison : règle « Track livrée en plusieurs PR » de [workflow.md](../../workflow.md) (section « Fin de track : livraison ») : chaque PR intermédiaire par `bun run release patch "résumé"`, la dernière par `bun run release track "résumé"`, numéro pris sur `main` après rebase. Ici : phase 1 (généralisation, rien de visible) en `patch`, phase 2 en `track`.

Deux phases, chacune une PR livrable seule. Aucune des deux ne change ce que voit l'enfant en production : la saison 3 n'a pas encore d'île (spec, D1). Les numéros « ligne N » renvoient au « Comportement attendu » de la spec.

## Tâches

### Phase 1 : généraliser sans rien changer à l'écran (PR 1)

Rien de neuf pour l'enfant : la saison 2 garde ses écrans, la saison 3 n'existe pas encore.

**État du code en entrée de phase 1** : `main` actuel. `ARCHIPELAGO_ORDER` vaut `[1, 2]`, `ARCHIPELAGOS[3]` n'existe pas, pas de `refreshArchipelagos`, `shownArchipelagos`, `maybeSeasonOpening`, `expeditionIntroSeen`, `zap-map.js`.

**Lignes de comportement dues à la phase 1** : 3, 30, 31, 32 à 34 (dessins), et la « vérification de phase 1 » ci-dessous (forme des lignes 2 et 8 sur un archipel posé par le test). Les lignes 1, 2 et 4 à 29 sont dues à la phase 2 : elles demandent `ARCHIPELAGOS[3]` réel, `expeditionIntroSeen` ou la carte de Zap, absents en phase 1.

- [ ] 1. Test rouge dans `test/saison3.test.js` (nouveau fichier, harnais copié de `test/saison2.test.js:1-75`), section « phase 1 : archipel posé par le test ». Le test pose, dans cet ordre :
  1. `ARCHIPELAGOS[3] = { name: "L'Archipel d'essai", short: 'Essai', emoji: '🧪', vehicle: '✈️', sky: false }` ;
  2. `ARCHIPELAGO_ORDER.push(3)` ;
  3. `WORLDS.essai3 = { … }` (objet exact de la spec, Contrats partagés) ;
  4. `refreshArchipelagos()`.

  Il vérifie : `ARCHIPELAGOS[3].level === 70`, `worldsOf(3)` vaut `['essai3']`, `shownArchipelagos()` vaut `[1, 2, 3]`, `WORLD_ORDER` finit par `'essai3'` (forme de la ligne 8). Puis il retire l'île : `delete WORLDS.essai3; refreshArchipelagos()`, et vérifie `ARCHIPELAGOS[3].level === null`, `shownArchipelagos()` vaut `[1, 2]`, et, avec `state.missions = 995`, `archipelagoUnlocked(3) === false` (forme de la ligne 2). Enfin il remet tout en place : `ARCHIPELAGO_ORDER.pop(); delete ARCHIPELAGOS[3]; refreshArchipelagos()`, et vérifie la ligne 3 (`shownArchipelagos()` vaut `[1, 2]`) et que `WORLD_ORDER` ne contient plus `essai3`.
- [ ] 2. `js/entities/world/worlds.js` : `refreshArchipelagos()` (remplace la boucle `worlds.js:300-304`), `shownArchipelagos()`, garde « sans île » dans `archipelagoUnlocked` ; `@typedef` `Archipelago` avec `level: number | null` (le champ `paper` arrive en phase 2) ; export dans `js/entities/world/index.js` ; types stricts de la spec D17, `bun run typecheck` vert.
- [ ] 3. `js/features/map/map.js` (`renderMapTabs`) et `js/features/story/story.js` (`openStoryJournal`) parcourent `shownArchipelagos()`. `test/niveaux.test.js:204` : `ARCHIPELAGO_ORDER` remplacé par `shownArchipelagos()` (spec D16).
- [ ] 4. Test rouge : `openSeasonOpening(2, …)` et `maybeSeasonOpening()` existent ; puis renommage dans `test/saison2.test.js:275` et `:314` (`maybeSkyOpening` en `maybeSeasonOpening`), sans autre changement.
- [ ] 5. `js/features/island/island-view.js` : table `SEASON_OPENINGS` (saison 2 seule pour l'instant, textes inchangés), `openSeasonOpening(s, onDone)` (pose les drapeaux de `s` et des saisons plus basses, D8), `checkNewIsland` lit la table, `maybeSeasonOpening()` (D9) ; `js/features/island/index.js` et `js/app/init.js:11` et `:101` suivent le renommage.
- [ ] 6. `js/features/story/story.js` : `STORY_PROLOGUES[2].go = 'En route ! ☁️'`, le bouton final lit `pr.go` ; prologue par compagnon (`companion`, D10) ; table `SEASON_STORY_ART` (saison 2 : Grisou) utilisée par `renderStoryIntro`, `openSeasonPrologue` et `storyWin` (D11) ; pastille du prologue dans le journal = `a.emoji` (☁️ pour la saison 2, inchangé).
- [ ] 7. `bun run test saison2`, `bun run test niveaux`, `bun run test saison3` verts ; `bun run check` vert.
- [ ] 7 bis. Dessins (spec D18, lignes 32 à 34). D'abord la capture : écrire `test/tools/capture-dessins.js` (avec `--selftest`, sorties 0, 1, 2, ligne 32b), le lancer sur le code non modifié, commiter `test/dessins.json` et `test/dessins.test.js` (qui échoue si le fichier manque et ne l'écrit jamais, ligne 32) **avant** tout déplacement ; ajouter le script à `bun run selftest` s'il liste les scripts. Ensuite : créer `characters-art-kit.js` (`ART_KIT`, aides déplacées au texte près) et `characters-art-saison3.js` (`ART_S3 = {}`), les déclarer dans la slice `character` de `js/slices.cjs` avant `characters-art.js`, `bun run sync` ; `characters-art.js` importe `ART_KIT` et `ART_S3`, fusionne `ART_S3`. Vérifier `wc -l js/entities/character/characters-art.js` (900 au plus), `bun run test dessins`, `bun run test slices`, `bun run typecheck` verts.
- [ ] 8. Doc : `conductor/checklist-ile.md` (section 2 : `saison` 3 = La Grande Expédition ; un archipel sans île reste caché), `conductor/niveaux.md` (« Dans le jeu, aujourd'hui » : un archipel sans île n'a pas de niveau et ne s'affiche pas). Livraison : `bun run release patch "…"`, PR `agent-generated: true`, étiquette `agent`.

### Phase 2 : la saison 3, cachée tant qu'elle n'a pas d'île (PR 2)

Zone sensible (sauvegarde) : relecture humaine obligatoire.

**État du code en entrée de phase 2** : la phase 1 mergée (`refreshArchipelagos`, `shownArchipelagos`, `SEASON_OPENINGS[2]`, `openSeasonOpening`, `maybeSeasonOpening`, prologue par compagnon, `SEASON_STORY_ART[2]`), `ARCHIPELAGO_ORDER` encore `[1, 2]`.

**Lignes de comportement dues à la phase 2** : 1, 2 et 4 à 29 ; 3, 30 et 31 restent vertes. La section « phase 1 » de `test/saison3.test.js` est retirée à la tâche 10 (elle pose et retire un `ARCHIPELAGOS[3]` qui devient réel) : les lignes 2, 3 et 8 la remplacent. À partir de cette phase, le test ne pose plus que `WORLDS.essai3` (puis `refreshArchipelagos()`), après avoir mis de côté les vraies îles de `worldsOf(3)` s'il y en a ; il les remet et rappelle `refreshArchipelagos()` en fin de section.

- [ ] 9. Tests rouges `test/saison3.test.js` : lignes 1 à 7 (archipel 3 vide invisible, sans erreur).
- [ ] 10. `ARCHIPELAGOS[3]` et `ARCHIPELAGO_ORDER = [1, 2, 3]` ; `paper: false` sur les archipels 1 et 2 ; `paper: boolean` dans le `@typedef` `Archipelago` (spec D17).
- [ ] 11. Tests rouges : lignes 18 (migration), puis `SAVE_VERSION` à la version suivante au moment de la livraison, `expeditionIntroSeen: false` dans `DEFAULT_STATE` (`js/entities/game-state/state.js:144-145`, l'état initial en découle par `freshState()`) et `expeditionIntroSeen: boolean` dans le `@typedef` `GameState` (`:62-102`, spec D17), étape de `migrate()` qui pose `false`. Le test de migration lit `SAVE_VERSION` (sauvegarde à `SAVE_VERSION - 1`), sans numéro en dur. `test/licornes.test.js:499` (`ev('SAVE_VERSION') === 9`) : la valeur attendue passe au nouveau numéro, le suivant sur `main` au moment de la livraison (rebaser d'abord : d'autres tracks l'augmentent aussi).
- [ ] 12. Tests rouges : lignes 8 à 17 et 19 à 21 (île d'essai : onglet, voix, prochain monde, ouverture, prologue, carte vieux papier, avion, lancement).
- [ ] 13. `SEASON_OPENINGS[3]` et `STORY_PROLOGUES[3]` (textes exacts de la spec) ; `js/features/island/island-view.css` : `.expedition-open` et son dessin (avion qui traverse, `prefers-reduced-motion` respecté).
- [ ] 14. `js/features/map/map.js` : classe `paper` sur `#island-map`, décor vieux papier, `.boat.plane` ; `js/features/map/map.css` : `.island-map.paper`, `.boat.plane`, `.map-tab.paper.active`, sans animation avec `prefers-reduced-motion`.
- [ ] 15. Tests rouges : lignes 22 à 29, dont 24b (carte de Zap, Coffres résolu avant Dumplings).
- [ ] 16. `js/features/story/zap-map.js` : `ZAP_MAP_PIECES`, `zapMapFound()`, `zapMapPieces()`, `zapMapSVG(found, opts)`, `zapMapSay(n)` ; déclaré dans la slice `story` de `js/slices.cjs` ; exports dans `js/features/story/index.js` ; `SEASON_STORY_ART[3]` ; carte de Zap dans le journal ; phrase `zapMapSay` à la victoire d'une énigme de saison 3 ; `js/features/story/story.css` : `.story-zapmap`, `.story-zapmap-row`, `.zm-new`. Puis `bun run sync`.
- [ ] 17. `bun run typecheck` vert (strict sur `js/entities`, spec D17), `bun run check` vert, puis `bun run verify` (holdout des sauvegardes vert).
- [ ] 18. Doc : `conductor/niveaux.md` (la saison 3 a son onglet dès sa première île), section du PRD. Livraison : `bun run release track "Ouverture de la saison 3 (cachée jusqu'à la première île)"`, PR avec résumé et risques (migration), `agent-generated: true`, étiquette `agent`.
- [ ] 19. Lignes 👤 S7 à S10 avec Amrou (S7 à S9 sur une île d'essai locale jamais commitée).

## Preuves

| Ligne du smoke test | Résultat | Niveau | Preuve |
|---|---|---|---|
| S1 | à faire | test-verified | `bun run test saison3` (exit 0) |
| S2 | à faire | test-verified | `bun run test saison3` (exit 0) |
| S3 | à faire | test-verified | `bun run test saison3` (exit 0) |
| S4 | à faire | test-verified | `bun run test saison3` (exit 0) |
| S5 | à faire | test-verified | `bun run test saison2`, `bun run test niveaux` (exit 0) |
| S6 | à faire | test-verified | `bun run verify` (exit 0) |
| S7 à S10 | à faire | runtime-verified | retour d'Amrou dans la PR |

## Journal de décisions

En ajout seul : une décision fausse reçoit une nouvelle ligne qui la remplace, on ne modifie ni ne supprime une ligne.

| # | Décision | Décidé par | Pourquoi | Preuve | Résultat |
|---|---|---|---|---|---|
| 1 | Deux PR : la généralisation d'abord (aucun changement visible, aucune migration), puis la saison 3 et sa migration | défaut | sépare le refactor de la zone sensible ; chaque PR est livrable seule | spec D1, D5 | gardée |

## Écarts et non vérifié

- Le rendu réel (écran d'ouverture, carte vieux papier, carte de Zap) ne se voit pas en production avant la première île : il se juge sur une île d'essai locale (S7 à S9).
