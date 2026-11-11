# Plan : 🌸 Le Jardin des Fées

Spec : [spec.md](./spec.md). Workflow : [workflow.md](../../workflow.md).
> **Architecture (feature slices v51, modules ES v54) :** nouvelles slices avec leur `index.js`, déclarées dans `js/slices.cjs`, puis `npm run sync`. Checklists : `conductor/checklist-ile.md`, `conductor/checklist-mini-jeu.md`.
> **Numéro de version :** attribué à la livraison (le suivant sur `main`).
> **À relire avec la joueuse avant de commencer** : noms, personnages, mini-jeux.

> **Réalisé (v63) — écarts au plan :**
> - **La carte du Ciel passe en serpentin** (3 colonnes × 2 rangées) : sans cela, il n'y avait plus de place pour une cinquième île sans chevauchement. La 6ᵉ place, en haut à gauche (18, 26), est gardée pour les Licornes.
> - **8 objets** au lieu d'environ 6 (noisette et mini-champignon en plus). « Lucioles » existait déjà dans la Forêt.
> - **Le cycle de vie** compte aussi la poule (œuf, poussin qui éclot, poussin, poule). L'œuf, partagé par la poule et le papillon, n'est jamais une mauvaise réponse à « que se passe-t-il ensuite ? ». Au palier CE2, les deux cycles mélangés se jouent en ne rangeant que ceux de la plante.
> - **La graine, la pousse, le bouton, la fleur, le fruit et la chrysalide** sont dessinés en SVG ; les autres étapes sont des emojis bien connus.
> - **Les coccinelles** ont au plus 10 points par aile, placés sans chevauchement.
> - **Les deux jeux sont proposés dès 5 ans**, sans minuteur, avec le barème d'essais « généreux ».
> - **Tests :** un fichier `test/jardin.test.js` (63 vérifications).

## Phase 1 : L'île
- [x] Task: Entités de l'île
    - [x] Tests : `WORLDS.jardin` (saison, niveau 56, position, thème) ; 4 personnages avec butin, 3 répliques et 2 objets préférés ; objets, recettes, décorations
- [x] Task: Scène, thème et musique
    - [x] Tests : `ISLE_SCENERY.jardin`, thème `--world-*`, `MUSIC_THEMES.jardin`
- [x] Task: Série de squishies « Petites bêtes »
    - [x] Tests : 6 modèles (4 communs, 1 rare, 1 ✨), dessins SVG, visibles dans la chambre
- [x] Task: Conductor - User Manual Verification "L'île" (Protocol in workflow.md)

## Phase 2 : « De la graine à la fleur »
- [x] Task: Logique (pure) et tests de chaque palier
- [x] Task: Interface, indices, relance anti-devinette, niveau adaptatif, compétence parents
- [x] Task: Joué jusqu'à la victoire dans `test/games.test.js`
- [x] Task: Conductor - User Manual Verification 'De la graine à la fleur' (Protocol in workflow.md)

## Phase 3 : « Les coccinelles »
- [x] Task: Logique (pure) et tests de chaque palier
- [x] Task: Interface, indices, relance anti-devinette, niveau adaptatif, compétence parents
- [x] Task: Joué jusqu'à la victoire dans `test/games.test.js`
- [x] Task: Conductor - User Manual Verification 'Les coccinelles' (Protocol in workflow.md)

## Phase 4 : Histoire
- [x] Task: Chapitre « Le jardin endormi » et ses énigmes
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
