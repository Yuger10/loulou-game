# Plan : Barre de navigation et écran Réglages

Spec : [spec.md](./spec.md). Workflow : [workflow.md](../../workflow.md).
**Prérequis :** `formulaires-boutons` livrée.
> **Architecture (feature slices v51, modules ES v54) :** chaque nouvelle slice a ses modules JS, son CSS et un `index.js` qui réexporte son API publique ; elle est déclarée dans `js/slices.cjs` à sa place dans l'ordre, puis `npm run sync` (voir `conductor/workflow.md`, « Où ajouter quoi »).

## Phase 1 : Barre du bas
- [ ] Task: Une seule règle de taille
    - [ ] Tests : hauteurs 64 px (portrait), 48 px (paysage, hauteur ≤ 500 px), 72 px (tablette, largeur ≥ 700 px), barre centrée à ~640 px (ordinateur) ; toujours ≥ 48 px ; aucun débordement à 360 px ; une seule source de règles de hauteur pour la barre
    - [ ] Retirer les règles empilées (v12, v13, v14, « tous les écrans ») et les remplacer par une feuille dans la slice de navigation
- [ ] Task: Accès aux Réglages par l'avatar et le prénom
    - [ ] Tests : la barre garde 4 boutons ; toucher l'avatar et le prénom ouvre la vue `reglages` (section Moi) ; petit ⚙️ visible et libellé « Réglages de … » ; en mode chacun son tour, l'avatar du joueur du tour ; la pastille du Sac fonctionne toujours
- [ ] Task: Bouton Île nommé
    - [ ] Tests : icône et nom court de l'île courante ; mis à jour en changeant d'île et de joueur ; même destination qu'avant
    - [ ] Point d'accroche dans `shared/ui/views` pour le libellé, alimenté par `features/island`
- [ ] Task: Conductor - User Manual Verification 'Barre du bas' (Protocol in workflow.md)

## Phase 2 : Écran Réglages
- [ ] Task: Slice `features/settings` et section 🔊 Son
    - [ ] Tests : trois interrupteurs (Bruitages, Voix, Musique) équivalents au cycle actuel ; le 🔊 du haut reste synchronisé ; libellés lus à voix haute
- [ ] Task: Sections 🙂 Moi et 👥 Joueurs
    - [ ] Tests : le profil (modèle de formulaire de `formulaires-boutons`) quitte le Sac ; changer ou ajouter un joueur, modes Solo, Chacun son tour, Course ; le bouton du prénom ouvre la section Joueurs ; tests de fumée existants adaptés
- [ ] Task: Section 🔒 Parents
    - [ ] Tests : verrouillée par `openParentGate` ; donne accès à l'espace parents, la sauvegarde et le code de transfert, l'installation, l'aperçu des saisons ; zone sensible (recommencer, supprimer) avec double confirmation ; rappel de sauvegarde en tête si conseillé
- [ ] Task: Nettoyage
    - [ ] Tests : plus de bouton de réglages dans le Sac ; l'ancien panneau des joueurs est remplacé par l'écran Réglages
- [ ] Task: Conductor - User Manual Verification 'Écran Réglages' (Protocol in workflow.md)

## Phase 3 : Livraison
- [ ] Task: Docs et intégration
    - [ ] Numéro de version attribué à la livraison (le suivant sur `main`) : PRD, TODO, cache `sw.js` incrémenté, `npm run sync`
- [ ] Task: Vérification complète
    - [ ] `npm test` vert ; parcours manuel sur téléphone (portrait, paysage), tablette et ordinateur
- [ ] Task: Conductor - User Manual Verification 'Livraison' (Protocol in workflow.md)
- [ ] Task: Branche, PR sur `main`, merge
