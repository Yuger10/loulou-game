# Plan : Refactor en feature slices, scripts classiques (étape A), v51

Spec : [spec.md](./spec.md). Workflow : [workflow.md](../../workflow.md).
Principe : **un déplacement ou un découpage = un commit avec `npm test` vert**. On ne change aucune logique.

## Phase 1 : Inventaire et outillage [checkpoint: bce5d59]
- [x] Task: Inventaire des noms globaux
    - [x] Script `test/tools/globals.js` : pour chaque fichier JS, liste de ses définitions de haut niveau (`function`, `const`, `let`) et des noms d'autres fichiers qu'il référence
    - [x] Tableau de correspondance fichier/fonction → slice cible, dans `conductor/tracks/refactor-feature-slices_20261109/inventory.md`, avec l'API publique pressentie de chaque slice
- [x] Task: Manifeste et harnais de test
    - [x] Tests : le harnais charge les scripts et les CSS **depuis le manifeste** ; le jeu tourne à l'identique
    - [x] `js/slices.js` (au départ : une slice par fichier actuel, dans l'ordre actuel) ; `test/smoke.test.js` lit le manifeste
- [x] Task: Tests de cohérence
    - [x] Tests : `index.html` et `sw.js` (`FILES`) correspondent au manifeste (liste et ordre) ; une seule définition par nom global
- [x] Task: Conductor - User Manual Verification 'Inventaire et outillage' (Protocol in workflow.md)

## Phase 2 : Couches basses (shared, entities) [checkpoint: 5607574]
> Fait : points d'accroche `onModalOpen/onModalClose`, `registerView`, `onWrongFeedback`, `setAudioPrefsSource`, `setCompanionDressing` ; outils `test/tools/move.js` (déplacement de déclarations) et `npm run sync` (index.html et sw.js depuis le manifeste). Les entités n'ont plus aucune dépendance vers le haut. Ce qui reste de `state.js` (en-tête, accueil, quêtes, album) et de `ui.js` (vue Île, porte-monnaie, difficulté adaptée) part en features à la phase 3.
- [x] Task: `shared/`
    - [x] Extraire de `ui.js` la modale, le toast, les sons, la voix, les confettis, la vibration et les en-têtes de jeu vers `shared/ui/` ; les utilitaires purs vers `shared/lib/`
- [x] Task: `entities/`
    - [x] Découper `data.js` en `item/`, `character/`, `world/` ; déplacer `difficulty.js`, `companions.js`, `characters-art.js`
    - [x] Séparer `state.js` : l'état, la sauvegarde et les migrations vers `entities/game-state/` ; les quêtes du jour vers `features/quests/` (phase 3)
    - [x] `players.js` : les profils et le stockage vers `entities/player/`
- [x] Task: Mettre à jour le manifeste, `index.html` et `sw.js` à chaque déplacement (tests de cohérence verts)
- [x] Task: Conductor - User Manual Verification 'Couches basses' (Protocol in workflow.md)

## Phase 3 : Features et app [checkpoint: 8903c86]
> Fait : 46 slices ; registre `registerGame` (le moteur ne connaît plus la liste des jeux) ; point d'accroche `onProfileRefresh` (changement de joueur) ; `GAME_LIST.fn`, inutilisé, retiré ; chemins des commentaires mis à jour. **Plus aucune dépendance vers le haut dans tout le code** : la liste d'exceptions prévue n'est pas nécessaire.
- [x] Task: Moteur et mini-jeux
    - [x] `minigames.js` : le cadre commun (essais, `scheduleRetry`, minuteur, choix du jeu) vers `features/minigame-engine/` ; chaque jeu historique vers `features/minigames/<jeu>/`
    - [x] Déplacer math, reading, grammar, volume, compare, money, clock, calendar, calc, shapes et planets vers `features/minigames/<jeu>/`
- [x] Task: Autres features
    - [x] story (avec episodes), map, island, market et bag (séparer sac et album de `market.js`), quests, gains, players (profiles-ui et race), backup, adaptive, gifts, wardrobe, parents, seasons
    - [x] `jigsaw.js` vers `features/minigames/jigsaw/` ; `music.js` vers `shared/audio/` ; `icons.js` vers `shared/ui/`
- [x] Task: `app/`
    - [x] `init.js` et la liaison des boutons d'en-tête vers `app/` ; les vues restantes de `ui.js` (`renderLagon`, `checkNewIsland`, navigation) vers leur feature
- [x] Task: Conductor - User Manual Verification 'Features et app' (Protocol in workflow.md)

## Phase 4 : CSS par slice [checkpoint: 8ca4861]
> Fait : `styles.css` découpé en 48 fichiers rangés dans leur slice (`shared/styles/` pour la base, le design system v21 et le responsive). `CSS_ORDER` reprend l'ordre exact : la concaténation est identique octet pour octet à l'ancien fichier, et chaque fichier a ses accolades équilibrées (test de fumée).
- [x] Task: Découper `styles.css`
    - [x] Base, variables, design system v21 et responsive vers `shared/styles/` ; chaque section de feature (minuteur, compagnons, gains, horloge, calendrier, histoire, calcul, formes, planètes, sauvegarde, parents, garde-robe, cadeaux, saisons, puzzle…) vers sa slice
    - [x] Tests : l'ordre de cascade final est identique (concaténation dans l'ordre du manifeste = ancien `styles.css`, à la mise en forme près) ; accolades équilibrées pour chaque fichier
    - [x] `island.css` et `characters.css` rejoignent `features/island/` et `entities/character/`
- [x] Task: Conductor - User Manual Verification 'CSS par slice' (Protocol in workflow.md)

## Phase 5 : Frontières [checkpoint: 173c4cf]
> Fait : API publique de chaque slice générée dans `js/slices.js` (`npm run api` pour la recalculer quand on expose volontairement un nom) ; test de frontières (couches et API publiques) avec deux cas fautifs fabriqués et une violation réelle vérifiée ; 203 gardes `typeof` retirées par `test/tools/unguard.js`. Les seules gardes restantes portent sur le navigateur (`window`, `document`, `TextEncoder`…) et sont légitimes. **Aucune exception** n'a été nécessaire : la liste `LAYER_EXCEPTIONS` n'existe pas.
>
> **Écart noté en phase 1 (finalement sans objet) :** les dépendances vers le haut trop imbriquées pour être corrigées sans bus d'événements vont dans une liste `LAYER_EXCEPTIONS` documentée du test de frontières. L'étape B (v54) doit la vider. Voir [inventory.md](./inventory.md).
- [x] Task: API publiques
    - [x] Renseigner l'API publique de chaque slice dans `js/slices.js` à partir de l'inventaire
- [x] Task: Test de frontières
    - [x] Tests : règle des couches ; seule l'API publique d'une autre slice est référencée ; cas fautif volontaire qui doit échouer
    - [x] Corriger les violations (déplacer une fonction, l'exposer, ou la descendre dans `shared`)
- [x] Task: Gardes `typeof`
    - [x] Retirer les gardes des dépendances déclarées ; lister et commenter celles qui restent
- [x] Task: Conductor - User Manual Verification 'Frontières' (Protocol in workflow.md)

## Phase 6 : Documentation et livraison
- [x] Task: ADR 0001 « Architecture en feature slices » (`docs/adr/`), ajouté à la demande en fin de track
- [x] Task: Docs
    - [x] `README.md` (structure), `tech-stack.md` (architecture, règles), `workflow.md` ; `conductor/checklist-mini-jeu.md` et `conductor/checklist-ile.md`
    - [x] Adapter les chemins de fichiers cités dans les plans des tracks suivantes (squishies, saison 2, licornes)
- [x] Task: Vérification complète
    - [x] `npm test` vert ; une vraie sauvegarde créée avec le code v50 (`origin/main`) se charge en v51 sans erreur ni perte (seul `seen` change, exactement comme en v50 au démarrage) ; parcours manuel : voir la vérification ci-dessous
- [ ] Task: Conductor - User Manual Verification 'Documentation et livraison' (Protocol in workflow.md)
- [ ] Task: `sw.js` (`lagon-v51`), PRD (v51), branche, PR sur `main`, merge
