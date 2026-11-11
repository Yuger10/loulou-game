# Plan : 🍭 Le Royaume des Bonbons

Spec : [spec.md](./spec.md). Workflow : [workflow.md](../../workflow.md).
> **Architecture (feature slices v51, modules ES v54) :** nouvelles slices avec leur `index.js`, déclarées dans `js/slices.cjs`, puis `npm run sync`. Checklists : `conductor/checklist-ile.md`, `conductor/checklist-mini-jeu.md`.
> **Numéro de version :** attribué à la livraison (le suivant sur `main`).
> **À relire avec la joueuse avant de commencer** : noms, personnages, mini-jeux.

> **Réalisé (v60) — écarts au plan :**
> - **8 objets** au lieu d'environ 6 (sac de farine et caramel fondant en plus), pour que 3 objets ne soient donnés par personne. Le « Pot de miel » existait déjà dans la Forêt.
> - **Les paliers des mini-jeux** suivent les 5 paliers du jeu : GS = palier 1, CP = palier 2, CE1 = paliers 3 et 4, CE2 = palier 5.
>   - Le gâteau : le palier 4 ajoute un piège (le bon nombre de parts, mais inégales).
>   - La recette : les cuillères vont jusqu'à 10 au palier 3, avec le verre doseur en verres ; les centilitres sont gradués de 10 en 10 jusqu'à 100 (et non 50 en 50, peu courant en cuisine) ; les grammes de 50 en 50 jusqu'à 500.
> - **Les deux jeux sont proposés dès 5 ans**, sans minuteur, avec le barème d'essais « généreux ».
> - **La valse en pizzicato** utilise le timbre « pluck » existant, en 4 temps (le moteur de musique n'a pas de mesure à 3 temps).
> - **Tests :** un fichier `test/bonbons.test.js` (64 vérifications) en plus de `test/games.test.js` et `test/companions.test.js`.

## Phase 1 : L'île
- [x] Task: Entités de l'île
    - [x] Tests : `WORLDS.bonbons` (saison, niveau 44, position, thème) ; 4 personnages avec butin, 3 répliques et 2 objets préférés ; objets, recettes, décorations
- [x] Task: Scène, thème et musique
    - [x] Tests : `ISLE_SCENERY.bonbons`, thème `--world-*`, `MUSIC_THEMES.bonbons`
- [x] Task: Série de squishies « Bonbons »
    - [x] Tests : 6 modèles (4 communs, 1 rare, 1 ✨), dessins SVG, visibles dans la chambre
- [x] Task: Conductor - User Manual Verification "L'île" (Protocol in workflow.md)

## Phase 2 : « Le gâteau partagé »
- [x] Task: Logique (pure) et tests de chaque palier
- [x] Task: Interface, indices, relance anti-devinette, niveau adaptatif, compétence parents
- [x] Task: Joué jusqu'à la victoire dans `test/games.test.js`
- [x] Task: Conductor - User Manual Verification 'Le gâteau partagé' (Protocol in workflow.md)

## Phase 3 : « La recette »
- [x] Task: Logique (pure) et tests de chaque palier
- [x] Task: Interface, indices, relance anti-devinette, niveau adaptatif, compétence parents
- [x] Task: Joué jusqu'à la victoire dans `test/games.test.js`
- [x] Task: Conductor - User Manual Verification 'La recette' (Protocol in workflow.md)

## Phase 4 : Histoire
- [x] Task: Chapitre « La fête sans gâteau » et ses énigmes
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
- [ ] Task: Branche, PR sur `main` (merge sur ordre du propriétaire)
