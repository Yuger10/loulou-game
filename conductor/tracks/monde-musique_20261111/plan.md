# Plan : 🎵 L'Île de la Musique

Spec : [spec.md](./spec.md). Workflow : [workflow.md](../../workflow.md).
> **Architecture (feature slices v51, modules ES v54) :** nouvelles slices avec leur `index.js`, déclarées dans `js/slices.cjs`, puis `npm run sync`. Checklists : `conductor/checklist-ile.md`, `conductor/checklist-mini-jeu.md`.
> **Numéro de version :** attribué à la livraison (le suivant sur `main`).
> **À relire avec la joueuse avant de commencer** : noms, personnages, mini-jeux.

## Phase 1 : L'île
- [ ] Task: Entités de l'île
    - [ ] Tests : `WORLDS.musique` (saison, niveau 60, position, thème) ; 4 personnages avec butin, 3 répliques et 2 objets préférés ; objets, recettes, décorations
- [ ] Task: Scène, thème et musique
    - [ ] Tests : `ISLE_SCENERY.musique`, thème `--world-*`, `MUSIC_THEMES.musique`
- [ ] Task: Série de squishies « Instruments »
    - [ ] Tests : 6 modèles (4 communs, 1 rare, 1 ✨), dessins SVG, visibles dans la chambre
- [ ] Task: Conductor - User Manual Verification "L'île" (Protocol in workflow.md)

## Phase 2 : « Le rythme magique »
- [ ] Task: Logique (pure) et tests de chaque palier
- [ ] Task: Interface, indices, relance anti-devinette, niveau adaptatif, compétence parents
- [ ] Task: Joué jusqu'à la victoire dans `test/games.test.js`
- [ ] Task: Conductor - User Manual Verification 'Le rythme magique' (Protocol in workflow.md)

## Phase 3 : « Grave ou aigu ? »
- [ ] Task: Logique (pure) et tests de chaque palier
- [ ] Task: Interface, indices, relance anti-devinette, niveau adaptatif, compétence parents
- [ ] Task: Joué jusqu'à la victoire dans `test/games.test.js`
- [ ] Task: Conductor - User Manual Verification 'Grave ou aigu ?' (Protocol in workflow.md)

## Phase 4 : Histoire
- [ ] Task: Chapitre « Le silence de l'île » et ses énigmes
    - [ ] Tests : au moins 2 énigmes ; récompense (pièces et boîte de la série) une seule fois
- [ ] Task: 3 épisodes
    - [ ] Tests : après la 2ᵉ, 4ᵉ et 7ᵉ mission ; jamais racontés par le guide ; relisibles dans le journal
- [ ] Task: Conductor - User Manual Verification 'Histoire' (Protocol in workflow.md)

## Phase 5 : Livraison
- [ ] Task: Docs et intégration
    - [ ] Numéro de version attribué à la livraison ; PRD (idée de la joueuse), TODO, cache `sw.js` incrémenté, `npm run sync`
- [ ] Task: Vérification complète
    - [ ] `npm test` vert ; parcours manuel à 360 px (ouverture de l'île, 4 personnages, 2 mini-jeux, chapitre, un épisode)
- [ ] Task: Conductor - User Manual Verification 'Livraison' (Protocol in workflow.md)
- [ ] Task: Branche, PR sur `main` (merge sur ordre du propriétaire)
