# Plan : Les sons du jeu (ambiance « marimba doux »)

Spec : [spec.md](./spec.md). Workflow : [workflow.md](../../workflow.md).
> **Architecture (feature slices v51, modules ES v54) :** le moteur reste dans la slice `shared/ui` (`sound.js`, éventuellement découpé en `sound-engine.js` et `sound-palette.js`), et son API publique passe par `shared/ui/index.js`. Voir `conductor/workflow.md`, « Où ajouter quoi ».
> **Numéro de version :** attribué à la livraison (le suivant sur `main`).

## Phase 1 : Moteur audio
> Phases 1 à 3 implémentées d'un seul tenant (le moteur, la palette et les branchements se testent ensemble) : `test/sounds.test.js` (44 tests) et `test/tools/fake-audio.js`. La vérification manuelle (à l'oreille) des trois phases est regroupée.
- [x] Task: `AudioContext` simulé pour les tests
    - [x] `test/tools/fake-audio.js` : un faux `AudioContext` (oscillateurs, gains, compresseur, convolution, paramètres avec rampes) qui enregistre les nœuds créés et leurs connexions ; branché dans le harnais jsdom
- [x] Task: Bus principal
    - [x] Tests : un seul contexte ; volume général, limiteur et sortie ; envoi vers l'écho ; création ou reprise au premier toucher ; aucune erreur sans audio
    - [x] Implémentation dans `shared/ui/sound`
- [x] Task: Variation, anti-rafale, familles
    - [x] Tests : hauteur et volume varient dans les bornes (hasard injecté) ; 10 lectures en 300 ms donnent moins de 10 sons ; niveaux par famille appliqués
- [x] Task: Conductor - User Manual Verification 'Moteur audio' (Protocol in workflow.md)

## Phase 2 : Palette « marimba doux »
- [x] Task: Instrument marimba et gamme pentatonique
    - [x] Tests : 3 oscillateurs au maximum par note, arrêtés après le son ; seulement des ondes sinus ou triangulaires
- [x] Task: Les 9 sons existants
    - [x] Tests : chaque clé produit le motif prévu par la spec (notes, ordre) ; plus aucune onde carrée
- [x] Task: Simon en marimba
    - [x] Tests : `playNote` sans variation ; les 4 hauteurs du Simon sont inchangées
- [x] Task: Conductor - User Manual Verification 'Palette marimba doux' (Protocol in workflow.md)

## Phase 3 : Nouveaux moments et musique
- [x] Task: `hint`, `island`, `box`
    - [x] Tests : joués au toucher du bouton 💡, sur l'écran « Nouvelle île » et à l'ouverture d'une boîte surprise
- [x] Task: Musique sur le bus principal
    - [x] Tests : la musique passe par le bus ; pendant la voix, le bus baisse puis remonte ; plus de réduction propre à la musique ; le volume général s'applique à la musique
- [x] Task: Volume général par profil
    - [x] Tests : sauvegardé par profil ; `SAVE_VERSION` +1 et migration à 80 % ; réglable dans Réglages (section Son) si `navigation-reglages` est livrée, sinon dans l'espace parents
- [x] Task: Conductor - User Manual Verification 'Nouveaux moments et musique' (Protocol in workflow.md)

## Phase 4 : Livraison (v56)
- [x] Task: Docs et intégration
    - [x] Numéro de version attribué à la livraison ; PRD (avec le lien vers la page d'écoute), TODO, `tech-stack.md` (bus audio), cache `sw.js` incrémenté, `npm run sync`
- [x] Task: Vérification complète
    - [x] `npm test` vert ; écoute manuelle sur iPhone et sur ordinateur (une mission, taper vite, une victoire avec la musique et la voix)
- [x] Task: Conductor - User Manual Verification 'Livraison' (Protocol in workflow.md)
- [x] Task: Branche, PR sur `main` (merge sur ordre du propriétaire du dépôt)
