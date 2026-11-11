# Plan : 🎵 L'Île de la Musique

Spec : [spec.md](./spec.md). Workflow : [workflow.md](../../workflow.md).
> **Architecture (feature slices v51, modules ES v54) :** nouvelles slices avec leur `index.js`, déclarées dans `js/slices.cjs`, puis `npm run sync`. Checklists : `conductor/checklist-ile.md`, `conductor/checklist-mini-jeu.md`.
> **Numéro de version :** attribué à la livraison (le suivant sur `main`).
> **À relire avec la joueuse avant de commencer** : noms, personnages, mini-jeux.

> **Réalisé (v62) — écarts au plan :**
> - **8 objets** au lieu d'environ 6 (métronome et micro doré en plus), pour que 3 objets ne soient donnés par personne. « Baguette » et « carillon » existaient déjà : ce sont ici la baguette de chef et le carillon d'or.
> - **Le rythme se rejoue avec trois boutons** (● Boum, ▬ Bouuum, 🤫 Chut) plutôt qu'en tapant court ou long sur un seul tambour : c'est plus sûr pour un enfant, et jouable sans le son.
> - **Le rythme est écrit en images.** Aux paliers 1 et 2, il reste écrit ; aux paliers 3 et 4, il se cache après l'écoute ; au palier 5, il se lit avant de l'entendre.
> - **Les notes de « Grave ou aigu ? »** sont prises dans la gamme pentatonique de la v56. La taille de chaque cloche suit sa note.
> - **Les paliers suivent les 5 paliers du jeu.** « Grave ou aigu ? » propose 5 cloches dès le palier 4, et la mélodie qui monte ou descend au palier 5.
> - **Les deux jeux sont proposés dès 5 ans**, sans minuteur. Le rythme a le barème d'essais de Simon, et les cloches le barème « généreux ».
> - **Tests :** un fichier `test/musique.test.js` (60 vérifications).

## Phase 1 : L'île
- [x] Task: Entités de l'île
    - [x] Tests : `WORLDS.musique` (saison, niveau 50, position, thème) ; 4 personnages avec butin, 3 répliques et 2 objets préférés ; objets, recettes, décorations
- [x] Task: Scène, thème et musique
    - [x] Tests : `ISLE_SCENERY.musique`, thème `--world-*`, `MUSIC_THEMES.musique`
- [x] Task: Série de squishies « Instruments »
    - [x] Tests : 6 modèles (4 communs, 1 rare, 1 ✨), dessins SVG, visibles dans la chambre
- [x] Task: Conductor - User Manual Verification "L'île" (Protocol in workflow.md)

## Phase 2 : « Le rythme magique »
- [x] Task: Logique (pure) et tests de chaque palier
- [x] Task: Interface, indices, relance anti-devinette, niveau adaptatif, compétence parents
- [x] Task: Joué jusqu'à la victoire dans `test/games.test.js`
- [x] Task: Conductor - User Manual Verification 'Le rythme magique' (Protocol in workflow.md)

## Phase 3 : « Grave ou aigu ? »
- [x] Task: Logique (pure) et tests de chaque palier
- [x] Task: Interface, indices, relance anti-devinette, niveau adaptatif, compétence parents
- [x] Task: Joué jusqu'à la victoire dans `test/games.test.js`
- [x] Task: Conductor - User Manual Verification 'Grave ou aigu ?' (Protocol in workflow.md)

## Phase 4 : Histoire
- [x] Task: Chapitre « Le silence de l'île » et ses énigmes
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
