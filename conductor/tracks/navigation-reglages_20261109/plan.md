# Plan : Barre de navigation et écran Réglages

Spec : [spec.md](./spec.md). Workflow : [workflow.md](../../workflow.md).
**Prérequis :** `formulaires-boutons` livrée.
> **Architecture (feature slices v51, modules ES v54) :** chaque nouvelle slice a ses modules JS, son CSS et un `index.js` qui réexporte son API publique ; elle est déclarée dans `js/slices.cjs` à sa place dans l'ordre, puis `npm run sync` (voir `conductor/workflow.md`, « Où ajouter quoi »).

## Phase 1 : Barre du bas
> Phases 1 et 2 implémentées d'un seul tenant : `test/settings.test.js` (36 tests). Vérification manuelle regroupée.
> **Écarts assumés :**
> - Le bouton Île garde **son icône dessinée** (décision de la v44 : mêmes icônes sur tous les appareils) et affiche **le nom de l'île** (« Forêt ») au lieu de l'emoji.
> - Le volume général est réglable dans les Réglages (section Son) **et** dans l'espace parents.
> - « 👥 Joueurs » : changer de joueur et en ajouter directement ; « Jouer à plusieurs » ouvre l'écran existant des modes (solo, chacun son tour, course), sans ses anciens doublons.
> - Les hauteurs de la barre sont dans `js/shared/ui/nav.css`, chargée tard (avant `form.css`) ; le test refuse toute autre règle de hauteur sur la barre ou ses boutons.
- [x] Task: Une seule règle de taille
    - [x] Tests : hauteurs 64 px (portrait), 48 px (paysage, hauteur ≤ 500 px), 72 px (tablette, largeur ≥ 700 px), barre centrée à ~640 px (ordinateur) ; toujours ≥ 48 px ; aucun débordement à 360 px ; une seule source de règles de hauteur pour la barre
    - [x] Retirer les règles empilées (v12, v13, v14, « tous les écrans ») et les remplacer par une feuille dans la slice de navigation
- [x] Task: Accès aux Réglages par l'avatar et le prénom
    - [x] Tests : la barre garde 4 boutons ; toucher l'avatar et le prénom ouvre la vue `reglages` (section Moi) ; petit ⚙️ visible et libellé « Réglages de … » ; en mode chacun son tour, l'avatar du joueur du tour ; la pastille du Sac fonctionne toujours
- [x] Task: Bouton Île nommé
    - [x] Tests : icône et nom court de l'île courante ; mis à jour en changeant d'île et de joueur ; même destination qu'avant
    - [x] Point d'accroche dans `shared/ui/views` pour le libellé, alimenté par `features/island`
- [ ] Task: Conductor - User Manual Verification 'Barre du bas' (Protocol in workflow.md)

## Phase 2 : Écran Réglages
- [x] Task: Slice `features/settings` et section 🔊 Son
    - [x] Tests : trois interrupteurs (Bruitages, Voix, Musique) équivalents au cycle actuel ; le 🔊 du haut reste synchronisé ; libellés lus à voix haute
- [x] Task: Sections 🙂 Moi et 👥 Joueurs
    - [x] Tests : le profil (modèle de formulaire de `formulaires-boutons`) quitte le Sac ; changer ou ajouter un joueur, modes Solo, Chacun son tour, Course ; le bouton du prénom ouvre la section Joueurs ; tests de fumée existants adaptés
- [x] Task: Section 🔒 Parents
    - [x] Tests : verrouillée par `openParentGate` ; donne accès à l'espace parents, la sauvegarde et le code de transfert, l'installation, l'aperçu des saisons ; zone sensible (recommencer, supprimer) avec double confirmation ; rappel de sauvegarde en tête si conseillé
- [x] Task: Nettoyage
    - [x] Tests : plus de bouton de réglages dans le Sac ; l'ancien panneau des joueurs est remplacé par l'écran Réglages
- [ ] Task: Conductor - User Manual Verification 'Écran Réglages' (Protocol in workflow.md)

## Phase 3 : Livraison
- [ ] Task: Docs et intégration
    - [ ] Numéro de version attribué à la livraison (le suivant sur `main`) : PRD, TODO, cache `sw.js` incrémenté, `npm run sync`
- [ ] Task: Vérification complète
    - [ ] `npm test` vert ; parcours manuel sur téléphone (portrait, paysage), tablette et ordinateur
- [ ] Task: Conductor - User Manual Verification 'Livraison' (Protocol in workflow.md)
- [ ] Task: Branche, PR sur `main`, merge
