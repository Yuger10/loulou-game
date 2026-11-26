<!-- Gabarit cothon 0.4.0 (setting-up-docs), adopté dans Conductor (cothon 0.2.0-2 et 0.4.0-6). -->
# Plan : l'ouverture de la saison 3 « La Grande Expédition »

Spec : [spec.md](spec.md)

Livraison : règle « Track livrée en plusieurs PR » de [workflow.md](../../workflow.md) (section « Fin de track : livraison ») : chaque PR intermédiaire par `bun run release patch "résumé"`, la dernière par `bun run release track "résumé"`, numéro pris sur `main` après rebase. Ici : phase 1 (généralisation, rien de visible) en `patch`, phase 2 en `track`.

Deux phases, chacune une PR livrable seule. Aucune des deux ne change ce que voit l'enfant en production : la saison 3 n'a pas encore d'île (spec, D1). Les numéros « ligne N » renvoient au « Comportement attendu » de la spec.

## Tâches

### Phase 1 : généraliser sans rien changer à l'écran (PR 1)

Rien de neuf pour l'enfant : la saison 2 garde ses écrans, la saison 3 n'existe pas encore.

**État du code en entrée de phase 1** : `main` actuel. `ARCHIPELAGO_ORDER` vaut `[1, 2]`, `ARCHIPELAGOS[3]` n'existe pas, pas de `refreshArchipelagos`, `shownArchipelagos`, `maybeSeasonOpening`, `expeditionIntroSeen`, `zap-map.js`.

**Lignes de comportement dues à la phase 1** : 3, 21b, 30, 31, 32 à 34c (fichiers `-s3`), et la « vérification de phase 1 » ci-dessous (forme des lignes 2 et 8 sur un archipel posé par le test). Les lignes 1, 2 et 4 à 29 sont dues à la phase 2 : elles demandent `ARCHIPELAGOS[3]` réel, `expeditionIntroSeen` ou la carte de Zap, absents en phase 1.

- [x] 1. Test rouge dans `test/saison3.test.js` (nouveau fichier, harnais copié de `test/saison2.test.js:1-75`), section « phase 1 : archipel posé par le test » (provisoire : la tâche 10 la retire ; elle ne contient que ce qui suit, jamais les lignes 32 et 32b, qui vont dans la section « fichiers -s3 » de la tâche 7 bis). Le test pose, dans cet ordre :
  1. `ARCHIPELAGOS[3] = { name: "L'Archipel d'essai", short: 'Essai', emoji: '🧪', vehicle: '✈️', sky: false }` ;
  2. `ARCHIPELAGO_ORDER.push(3)` ;
  3. `WORLDS.essai3 = { … }` (objet exact de la spec, Contrats partagés) ;
  4. `refreshArchipelagos()`.

  Il vérifie : `ARCHIPELAGOS[3].level === 70`, `worldsOf(3)` vaut `['essai3']`, `shownArchipelagos()` vaut `[1, 2, 3]`, `WORLD_ORDER` finit par `'essai3'` (forme de la ligne 8). Puis il retire l'île : `delete WORLDS.essai3; refreshArchipelagos()`, et vérifie `ARCHIPELAGOS[3].level === null`, `shownArchipelagos()` vaut `[1, 2]`, et, avec `state.missions = 995`, `archipelagoUnlocked(3) === false` (forme de la ligne 2). Enfin il remet tout en place : `ARCHIPELAGO_ORDER.pop(); delete ARCHIPELAGOS[3]; refreshArchipelagos()`, et vérifie la ligne 3 (`shownArchipelagos()` vaut `[1, 2]`) et que `WORLD_ORDER` ne contient plus `essai3`.
- [x] 2. `js/entities/world/worlds.js` : `refreshArchipelagos()` (remplace la boucle `worlds.js:300-304`), `shownArchipelagos()`, garde « sans île » dans `archipelagoUnlocked` ; `@typedef` `Archipelago` avec `level: number | null` (le champ `paper` arrive en phase 2) ; export dans `js/entities/world/index.js` ; types stricts de la spec D17, `bun run typecheck` vert.
- [x] 3. `js/features/map/map.js` (`renderMapTabs`) et `js/features/story/story.js` (`openStoryJournal`) parcourent `shownArchipelagos()`. `test/niveaux.test.js:204` : `ARCHIPELAGO_ORDER` remplacé par `shownArchipelagos()` (spec D16).
- [x] 4. Test rouge : `openSeasonOpening(2, …)` et `maybeSeasonOpening()` existent ; puis renommage dans `test/saison2.test.js:275` et `:314` (`maybeSkyOpening` en `maybeSeasonOpening`), sans autre changement.
- [x] 5. `js/features/island/island-view.js` : table `SEASON_OPENINGS` (saison 2 seule pour l'instant, textes inchangés), `openSeasonOpening(s, onDone)` (pose les drapeaux de `s` et des saisons plus basses, D8), `checkNewIsland` lit la table, `maybeSeasonOpening()` (D9) ; `js/features/island/index.js` et `js/app/init.js:11` et `:101` suivent le renommage. Le renommage remplace **tous** les appels dans `js/` (`git grep -n maybeSkyOpening -- js` doit être vide), y compris l'appel ajouté par la track `revision-espacee` dans `js/app/init.js` (sa tâche 12 : `if (!maybeSeasonGift() && !maybeSkyOpening() && !teamOnSessionStart()) maybeOfferReview();`), livrée avant celle-ci dans l'ordre prévu. Test de la ligne 21b (saison 2 sans île nouvelle : `false`).
- [x] 6. `js/features/story/story.js` : `@typedef` `StoryPrologue` (`story.js:59`) étendu sur place, sans changer de nom, en `{ guide?: string, companion?: string, title: string, intro: string[], go: string }` (spec D17, point 6 ; pas de `SeasonPrologue`) ; `STORY_PROLOGUES[2].go = 'En route ! ☁️'`, le bouton final lit `pr.go` ; prologue par compagnon (`companion`, D10) ; table `SEASON_STORY_ART` (saison 2 : Grisou) utilisée par `renderStoryIntro`, `openSeasonPrologue` et `storyWin` (D11) ; pastille du prologue dans le journal = `a.emoji` (☁️ pour la saison 2, inchangé).
- [x] 7. `bun run test saison2`, `bun run test niveaux`, `bun run test saison3` verts ; `bun run check` vert.
- [ ] 7 bis. Les six fichiers `-s3` (spec D19, lignes 32 à 34c), dans un commit à part (ligne 33 le mesure). D'abord les tests rouges : lignes 32 et 32b dans une section à part de `test/saison3.test.js`, « fichiers -s3 » (pas dans « phase 1 : archipel posé par le test » : la tâche 10 ne retire que celle-là ; « fichiers -s3 » reste, la ligne 32 seule part avec `monde-crayons`) ; cas du `--selftest` de `test/tools/sensitive.js` étendu aux trois fichiers de dessins (`{ s: 3, p: 0, b: false }`, ligne 34b). Puis : créer `characters-s3.js` (`CHARACTERS_S3 = {}`), `characters-art-s3.js` (`season3Art(_ART, _kit)`, `@param {Record<string, string>} _ART` et `@param {import('./characters-art.js').ArtKit} _kit`, corps vide, sans `oxlint-disable` : le `_` suit `argsIgnorePattern: "^_"` de `.oxlintrc.json:10`, spec D19 ; en-tête sur le modèle de `characters-art-s2.js:1-10`), `squishies-s3.js` (`SQUISHIES_S3 = {}`), `story-s3.js` (`STORY_S3 = {}`), `island-s3.js` (`ISLE_SCENERY_S3 = {}`), `js/features/squishies/squishy-art-s3.js` (`SQ_ART_S3 = {}`, pas une zone sensible), typés comme dans D19 ; les brancher (import et `...X_S3,` en fin de table ; dans `characters-art.js`, import et appel `season3Art(ART, { … })` juste après l'appel de `season2Art`, avec le même objet : deux lignes, aucun dessin ni aucune aide déplacés) ; les déclarer dans `js/slices.cjs`, chacun juste avant le fichier qui le lit (ligne 34c), puis `bun run sync`. Zone sensible : motif `characters-art(-s2|-s3)?` dans `test/tools/sensitive.js`, `docs/factory/AUDIT.md` section 8, AGENTS.md (Interdits, ligne des dessins), `.github/CODEOWNERS` (une ligne `/js/entities/character/characters-art-s3.js @Yuger10`). Vérifier, juste après le commit (avant tout autre commit ou rebase) : `git show --numstat HEAD -- js/entities/character/characters.js js/entities/character/characters-art.js js/entities/squishy/squishies.js js/features/story/story.js js/features/island/island.js js/features/squishies/squishy-art.js` (2 ajoutées, 0 retirée pour chacun, ligne 33) ; `wc -l` des six fichiers lecteurs (chacun 2 de plus qu'au parent du commit, 800 au plus, ligne 34 ; `story.js` a déjà reçu la tâche 6, sa valeur n'est pas 731) ; `git grep -n characters-art-s3 -- AGENTS.md docs/factory/AUDIT.md .github/CODEOWNERS test/tools/sensitive.js` (une ligne au moins dans chacun, ligne 34b) ; après `bun run sync`, `git grep -o -- '-s3\.js' sw.js | wc -l` vaut 6 (ligne 34c) ; `bun run test saison3`, `bun run test smoke`, `bun run test slices`, `node test/tools/sensitive.js --selftest`, `bun run typecheck` verts. La PR 1 touche `.github/` (zone protégée) : sa description le dit en tête, avec le geste (étiquette `human:approved` posée par Amrou, `gh pr edit N --add-label human:approved`, pas le bouton Approve).
- [ ] 8. Doc : `conductor/checklist-ile.md` (section 2 : `saison` 3 = La Grande Expédition ; un archipel sans île reste caché), `conductor/niveaux.md` (« Dans le jeu, aujourd'hui » : un archipel sans île n'a pas de niveau et ne s'affiche pas). Livraison : `bun run release patch "…"`, PR `agent-generated: true`, étiquette `agent`.

### Phase 2 : la saison 3, cachée tant qu'elle n'a pas d'île (PR 2)

Zone sensible (sauvegarde) : relecture humaine obligatoire.

**État du code en entrée de phase 2** : la phase 1 mergée (`refreshArchipelagos`, `shownArchipelagos`, `SEASON_OPENINGS[2]`, `openSeasonOpening`, `maybeSeasonOpening`, prologue par compagnon, `SEASON_STORY_ART[2]`), `ARCHIPELAGO_ORDER` encore `[1, 2]`.

**Lignes de comportement dues à la phase 2** : 1, 2 et 4 à 29 ; 3, 30 et 31 restent vertes. La section « phase 1 : archipel posé par le test » de `test/saison3.test.js` est retirée à la tâche 10 (elle pose et retire un `ARCHIPELAGOS[3]` qui devient réel) : les lignes 2, 3 et 8 la remplacent. La section « fichiers -s3 » (lignes 32 et 32b) reste. Plafond de 800 lignes en fin de phase : voir la règle et l'estimation de la ligne 34 de la spec (`story.js` est le fichier à surveiller, environ 771 estimé). À partir de cette phase, le test ne pose plus que `WORLDS.essai3` (puis `refreshArchipelagos()`), après avoir mis de côté les vraies îles de `worldsOf(3)` s'il y en a ; il les remet et rappelle `refreshArchipelagos()` en fin de section.

- [ ] 9. Tests rouges `test/saison3.test.js` : lignes 1 à 7 (archipel 3 vide invisible, sans erreur).
- [ ] 10. `ARCHIPELAGOS[3]` et `ARCHIPELAGO_ORDER = [1, 2, 3]` ; `paper: false` sur les archipels 1 et 2 ; `paper: boolean` dans le `@typedef` `Archipelago` (spec D17). Dans `test/saison3.test.js`, retirer la seule sous-section « phase 1 : archipel posé par le test » (tâche 1) ; la section « fichiers -s3 » (lignes 32 et 32b, tâche 7 bis) n'est pas touchée.
- [ ] 11. Tests rouges : lignes 18 (migration), puis `SAVE_VERSION` à la version suivante au moment de la livraison, `expeditionIntroSeen: false` dans `DEFAULT_STATE` (`js/entities/game-state/state.js:145-146`, l'état initial en découle par `freshState()`) et `expeditionIntroSeen: boolean` dans le `@typedef` `GameState` (`:62-102`, spec D17), étape de `migrate()` qui pose `false`. Le test de migration lit `SAVE_VERSION` (sauvegarde à `SAVE_VERSION - 1`), sans numéro en dur. `test/licornes.test.js:499` (`ev('SAVE_VERSION') === 9`) : la valeur attendue passe au nouveau numéro, le suivant sur `main` au moment de la livraison (rebaser d'abord : d'autres tracks l'augmentent aussi).
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
| 2 | La tâche 7 bis prépare les six fichiers `-s3` vides (modèle `-s2`) au lieu d'extraire les aides de dessin dans `characters-art-kit.js` avec une capture des dessins : remplace l'ancienne tâche 7 bis (spec D18, remplacée par D19) | défaut (Claude), à juger à la revue par Amrou | la v66.16 a posé le modèle `-s2` (`season2Art(ART, kit)`) et `max-lines` à 800 ; aucun dessin ne bouge, la capture et l'entrée `scripts.selftest` de `package.json` ne servent plus | spec D19, `conductor/checklist-ile.md` section 2 bis | gardée |
| 3 | Toucher `characters-art.js` (deux lignes : import et appel de `season3Art`) et créer `characters-art-s3.js` est autorisé : AGENTS.md demande une « demande explicite », c'est celle d'Amrou du 22/11/2026 (refonte de la saison 3 avec ses îles et leurs personnages, cette refonte de specs) | Amrou (demande du 22/11/2026, confirmée par sa revue de la PR #80 qui porte ces specs) | les deux lignes ne changent aucun dessin ; la PR de la phase 1 est de toute façon relue par Amrou (CODEOWNERS, étiquette `human:approved` pour `.github/`) | spec D19, spec « Zones sensibles touchées » | gardée |
| 4 | Le prologue garde le `@typedef` existant `StoryPrologue` (`story.js:59`), étendu sur place, au lieu d'un nouveau `SeasonPrologue` | défaut (Claude), à juger à la revue | change le moins de code : une ligne, ses deux références restent | spec D17 (6) | gardée |

## Écarts et non vérifié

- Le rendu réel (écran d'ouverture, carte vieux papier, carte de Zap) ne se voit pas en production avant la première île : il se juge sur une île d'essai locale (S7 à S9).
