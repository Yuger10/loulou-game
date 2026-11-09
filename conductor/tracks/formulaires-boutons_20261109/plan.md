# Plan : Formulaires et boutons d'action

Spec : [spec.md](./spec.md). Workflow : [workflow.md](../../workflow.md).
> **Architecture (feature slices v51, modules ES v54) :** chaque nouvelle slice a ses modules JS, son CSS et un `index.js` qui réexporte son API publique ; elle est déclarée dans `js/slices.cjs` à sa place dans l'ordre, puis `npm run sync` (voir `conductor/workflow.md`, « Où ajouter quoi »).

## Phase 1 : Modèle commun
- [ ] Task: Slice `shared/ui/form`
    - [ ] Tests : `openForm` rend un en-tête (titre et ✕), un contenu qui défile, une barre d'actions fixe (secondaire à gauche, principale à droite) ; action principale désactivée tant qu'un champ obligatoire manque, avec une explication parlée au toucher ; « Entrée » valide ; focus sur le premier champ, puis rendu à l'origine à la fermeture
    - [ ] Implémentation (JS et CSS : barre fixe, zones sûres, `role="dialog"`)
- [ ] Task: Modifications non enregistrées
    - [ ] Tests : fermer sans changement ferme ; après un changement, « Garder tes changements ? » (voix) ; « Garder » enregistre, « Ne pas garder » rétablit l'état d'avant ; vaut pour ✕, Retour, toucher à côté et Échap
- [ ] Task: Slice `shared/ui/confirm`
    - [ ] Tests : fenêtre du jeu lue à voix haute, bouton rouge et « Annuler » mis en avant ; double confirmation par saisie d'un mot
- [ ] Task: Conductor - User Manual Verification 'Modèle commun' (Protocol in workflow.md)

## Phase 2 : Migrer les formulaires
- [ ] Task: Accueil et nouveau joueur
    - [ ] Tests existants adaptés ; sections titrées ; prénom obligatoire en douceur ; âge en gros boutons ; clavier adapté
- [ ] Task: Réglages d'un joueur
    - [ ] Tests : Enregistrer visible sans défiler à 360 × 640 et 640 × 360 ; modifications non enregistrées ; anniversaire avec de plus grandes listes
- [ ] Task: Réglages parents et restauration d'une sauvegarde
    - [ ] Tests : même modèle ; coller un code puis valider
- [ ] Task: Boutiques et sélecteurs
    - [ ] Tests : garde-robe, cadeaux, décorations et choix du jeu ont l'en-tête fixe avec ✕
- [ ] Task: Conductor - User Manual Verification 'Migrer les formulaires' (Protocol in workflow.md)

## Phase 3 : Actions dangereuses
- [ ] Task: Plus de `confirm()`
    - [ ] Tests : aucun `confirm(` dans `js/` (test d'architecture) ; recommencer et supprimer passent par `shared/ui/confirm` avec double confirmation
- [ ] Task: Derrière l'accès parents
    - [ ] Tests : recommencer et supprimer ont disparu du Sac et des réglages du joueur ; ils ne sont accessibles qu'après `openParentGate`, dans une zone sensible séparée (provisoirement dans l'espace parents, en attendant la section Parents des Réglages de la track `navigation-reglages`)
- [ ] Task: Conductor - User Manual Verification 'Actions dangereuses' (Protocol in workflow.md)

## Phase 4 : Livraison
- [ ] Task: Docs et intégration
    - [ ] Numéro de version attribué à la livraison (le suivant sur `main`) : PRD, TODO, cache `sw.js` incrémenté, `npm run sync`
- [ ] Task: Vérification complète
    - [ ] `npm test` vert ; parcours manuel sur téléphone (portrait, paysage, clavier ouvert)
- [ ] Task: Conductor - User Manual Verification 'Livraison' (Protocol in workflow.md)
- [ ] Task: Branche, PR sur `main`, merge
