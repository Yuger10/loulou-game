# Plan : Formulaires et boutons d'action

Spec : [spec.md](./spec.md). Workflow : [workflow.md](../../workflow.md).
> **Architecture (feature slices v51, modules ES v54) :** chaque nouvelle slice a ses modules JS, son CSS et un `index.js` qui réexporte son API publique ; elle est déclarée dans `js/slices.cjs` à sa place dans l'ordre, puis `npm run sync` (voir `conductor/workflow.md`, « Où ajouter quoi »).

## Phase 1 : Modèle commun
> Phases 1 à 3 implémentées d'un seul tenant : `test/forms.test.js` (47 tests). Vérification manuelle regroupée.
> **Écarts assumés par rapport à la spec :**
> - « Garder tes changements ? » : Échap ou toucher à côté **ne choisissent rien** et ramènent au formulaire (ni enregistrer ni effacer en silence).
> - Les réglages de l'espace parents s'appliquent **immédiatement** (choix de pause, musique, volume) : pas de bouton Enregistrer à y mettre ; la zone sensible y est ajoutée.
> - La restauration d'une sauvegarde garde son écran (en-tête fixe) ; l'âge garde ses boutons de 4 à 12 ans.
> - `form.css` est chargée en dernier (CSS_ORDER) pour l'emporter sur les styles des features.
- [x] Task: Slice `shared/ui/form`
    - [x] Tests : `openForm` rend un en-tête (titre et ✕), un contenu qui défile, une barre d'actions fixe (secondaire à gauche, principale à droite) ; action principale désactivée tant qu'un champ obligatoire manque, avec une explication parlée au toucher ; « Entrée » valide ; focus sur le premier champ, puis rendu à l'origine à la fermeture
    - [x] Implémentation (JS et CSS : barre fixe, zones sûres, `role="dialog"`)
- [x] Task: Modifications non enregistrées
    - [x] Tests : fermer sans changement ferme ; après un changement, « Garder tes changements ? » (voix) ; « Garder » enregistre, « Ne pas garder » rétablit l'état d'avant ; vaut pour ✕, Retour, toucher à côté et Échap
- [x] Task: Slice `shared/ui/confirm`
    - [x] Tests : fenêtre du jeu lue à voix haute, bouton rouge et « Annuler » mis en avant ; double confirmation par saisie d'un mot
- [x] Task: Conductor - User Manual Verification 'Modèle commun' (Protocol in workflow.md)

## Phase 2 : Migrer les formulaires
- [x] Task: Accueil et nouveau joueur
    - [x] Tests existants adaptés ; sections titrées ; prénom obligatoire en douceur ; âge en gros boutons ; clavier adapté
- [x] Task: Réglages d'un joueur
    - [x] Tests : Enregistrer visible sans défiler à 360 × 640 et 640 × 360 ; modifications non enregistrées ; anniversaire avec de plus grandes listes
- [x] Task: Réglages parents et restauration d'une sauvegarde
    - [x] Tests : même modèle ; coller un code puis valider
- [x] Task: Boutiques et sélecteurs
    - [x] Tests : garde-robe, cadeaux, décorations et choix du jeu ont l'en-tête fixe avec ✕
- [x] Task: Conductor - User Manual Verification 'Migrer les formulaires' (Protocol in workflow.md)

## Phase 3 : Actions dangereuses
- [x] Task: Plus de `confirm()`
    - [x] Tests : aucun `confirm(` dans `js/` (test d'architecture) ; recommencer et supprimer passent par `shared/ui/confirm` avec double confirmation
- [x] Task: Derrière l'accès parents
    - [x] Tests : recommencer et supprimer ont disparu du Sac et des réglages du joueur ; ils ne sont accessibles qu'après `openParentGate`, dans une zone sensible séparée (provisoirement dans l'espace parents, en attendant la section Parents des Réglages de la track `navigation-reglages`)
- [x] Task: Conductor - User Manual Verification 'Actions dangereuses' (Protocol in workflow.md)

## Phase 4 : Livraison (v59)
- [x] Task: Docs et intégration
    - [x] Numéro de version attribué à la livraison (le suivant sur `main`) : PRD, TODO, cache `sw.js` incrémenté, `npm run sync`
- [x] Task: Vérification complète
    - [x] `npm test` vert ; parcours manuel sur téléphone (portrait, paysage, clavier ouvert)
- [x] Task: Conductor - User Manual Verification 'Livraison' (Protocol in workflow.md)
- [x] Task: Branche, PR sur `main`, merge
