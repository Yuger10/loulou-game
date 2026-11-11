# Plan : 🧸 Le Coffre aux Jouets Doux

Spec : [spec.md](./spec.md). Workflow : [workflow.md](../../workflow.md).
> **Architecture (feature slices v51, modules ES v54) :** nouvelles slices avec leur `index.js`, déclarées dans `js/slices.cjs`, puis `npm run sync`. Checklists : `conductor/checklist-ile.md`, `conductor/checklist-mini-jeu.md`.
> **Numéro de version :** attribué à la livraison (le suivant sur `main`).
> **À relire avec la joueuse avant de commencer** : noms, personnages, mini-jeux.

> **Réalisé (v58) — écarts au plan :**
> - **8 objets** au lieu d'environ 6 (yo-yo doux et toupie à pois en plus), pour que 3 objets ne soient donnés par personne (objets préférés).
> - **Les paliers des mini-jeux** suivent les 5 paliers du jeu : GS = palier 1, CP = palier 2, CE1 = paliers 3 et 4, CE2 = palier 5. L'étagère passe en 4 × 4 dès le palier 4 ; les coordonnées dites à voix haute arrivent au palier 5.
> - **Les deux jeux sont proposés dès 5 ans**, sans minuteur, avec le barème d'essais « généreux ».
> - **Un nouveau timbre de musique** (`celesta`) pour la boîte à musique de l'île.
> - **L'ourson arc-en-ciel ✨ est jaune** (et non rose), pour ne pas ressembler à l'ourson guimauve dans la collection et les boîtes de rangement.
> - **Tests :** un fichier `test/jouets.test.js` (70 vérifications) en plus de `test/games.test.js` et `test/companions.test.js`.

## Phase 1 : L'île
- [x] Task: Entités de l'île
    - [x] Tests : `WORLDS.jouets` (saison, niveau 38, position, thème) ; 4 personnages avec butin, 3 répliques et 2 objets préférés ; objets, recettes, décorations
- [x] Task: Scène, thème et musique
    - [x] Tests : `ISLE_SCENERY.jouets`, thème `--world-*`, `MUSIC_THEMES.jouets`
- [x] Task: Série de squishies « Jouets doux »
    - [x] Tests : 6 modèles (4 communs, 1 rare, 1 ✨), dessins SVG, visibles dans la chambre
- [x] Task: Conductor - User Manual Verification "L'île" (Protocol in workflow.md)

## Phase 2 : « Les paquets de jouets »
- [x] Task: Logique (pure) et tests de chaque palier
- [x] Task: Interface, indices, relance anti-devinette, niveau adaptatif, compétence parents
- [x] Task: Joué jusqu'à la victoire dans `test/games.test.js`
- [x] Task: Conductor - User Manual Verification 'Les paquets de jouets' (Protocol in workflow.md)

## Phase 3 : « L'étagère magique »
- [x] Task: Logique (pure) et tests de chaque palier
- [x] Task: Interface, indices, relance anti-devinette, niveau adaptatif, compétence parents
- [x] Task: Joué jusqu'à la victoire dans `test/games.test.js`
- [x] Task: Conductor - User Manual Verification 'L'étagère magique' (Protocol in workflow.md)

## Phase 4 : Histoire
- [x] Task: Chapitre « Les jouets qui ne jouent plus » et ses énigmes
    - [x] Tests : au moins 2 énigmes ; récompense (pièces et boîte de la série) une seule fois
- [x] Task: 3 épisodes
    - [x] Tests : après la 2ᵉ, 4ᵉ et 7ᵉ mission ; jamais racontés par le guide ; relisibles dans le journal
- [x] Task: Conductor - User Manual Verification 'Histoire' (Protocol in workflow.md)

## Phase 5 : Livraison
- [x] Task: Docs et intégration
    - [x] Numéro de version attribué à la livraison ; PRD (idée de la joueuse), TODO, cache `sw.js` incrémenté, `npm run sync`
- [x] Task: Vérification complète
    - [x] `npm test` vert ; parcours manuel à 360 px (ouverture de l'île, 4 personnages, 2 mini-jeux, chapitre, un épisode)
- [x] Task: Conductor - User Manual Verification 'Livraison' (Protocol in workflow.md)
- [x] Task: Branche, PR sur `main` (merge sur ordre du propriétaire) : PR #35
