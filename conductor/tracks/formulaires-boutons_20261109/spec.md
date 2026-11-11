# Spec : Formulaires et boutons d'action

> Demande : « bien gérer les boutons dans les formulaires, avec des boutons d'enregistrement flottants ou des boutons en haut ; revoir les formulaires ».
> Prérequis : architecture en feature slices (v51) et modules ES (v54). Prépare la track `navigation-reglages`, qui réutilise le modèle de formulaire.

## 1. Constat (v54)
- Les formulaires sont des fenêtres modales dont les boutons (« Enregistrer ✅ », « Retour », « Annuler ») sont **tout en bas du contenu**. Dans les formulaires longs (réglages d'un joueur : prénom, âge, anniversaire, avatar, genre, compagnon), il faut **faire défiler** pour les trouver.
- Fermer avec ✕ ou « Retour » **perd les changements sans prévenir**.
- **« Recommencer à zéro » et « Supprimer ce joueur » sont accessibles à l'enfant** (réglages du joueur, bouton du Sac), protégés seulement par la boîte système `confirm()`, qui est peu lisible et que la voix ne lit pas. Ils sont placés juste à côté d'« Enregistrer ».
- Chaque écran construit ses boutons à sa façon : il n'y a pas de modèle commun.

## 2. Exigences fonctionnelles

### 2.1 Modèle de formulaire commun (`shared/ui/form`)
- Un composant unique : `openForm({ title, sections, actions, onSave, onCancel, dirtyCheck })`, ou équivalent, construit sur la modale existante.
  - **En-tête fixe** : titre et ✕ (fermer).
  - **Contenu qui défile** : sections titrées.
  - **Barre d'actions fixe en bas**, toujours visible, à portée du pouce : action secondaire à gauche (« Retour » ou « Annuler »), action principale à droite (« Enregistrer ✅ »), en gros boutons.
- La barre d'actions **ne passe jamais sous le clavier** du téléphone. Quand un champ a le focus, le contenu défile pour le garder visible.
- Respect des zones sûres de l'iPhone (encoche, barre d'accueil).
- L'action principale est désactivée, avec une explication parlée au toucher, tant qu'un champ obligatoire manque.

### 2.2 Modifications non enregistrées
- Fermer (✕, Retour, Annuler, toucher à côté, touche Échap) **après un changement** ouvre une petite question du jeu, lue à voix haute : **« Garder tes changements ? »**, avec deux gros boutons : « ✅ Garder » (enregistre puis ferme) et « ↩️ Ne pas garder » (ferme sans enregistrer).
- Sans changement, fermer ferme directement.

### 2.3 Actions dangereuses
- Plus aucune boîte `confirm()` dans le jeu : elles sont remplacées par une **fenêtre de confirmation du jeu**, avec un texte lu à voix haute, un bouton rouge à gauche et « Annuler » à droite, mis en avant.
- « Recommencer à zéro » et « Supprimer un joueur » :
  - quittent les réglages du joueur et le Sac ;
  - passent **derrière l'accès parents** (la multiplication existante, `openParentGate`), dans la section Parents des Réglages (track `navigation-reglages`) ;
  - sont présentés dans une zone séparée, « Zone sensible », loin d'« Enregistrer » ;
  - demandent une **double confirmation** : la fenêtre du jeu, puis taper le prénom du joueur à supprimer, ou « RECOMMENCER ».

### 2.4 Champs plus clairs
- **Sections titrées** : « Moi », « Mon avatar », « Mon compagnon », « Mon anniversaire ».
- **Prénom** obligatoire, signalé en douceur (bordure et message parlé), jamais en rouge agressif.
- **Âge** en gros boutons (3 à 11 ans) au lieu d'une liste déroulante. **Anniversaire** : le jour et le mois restent des listes (31 et 12 choix), mais plus grandes.
- Clavier adapté sur mobile (`autocapitalize`, `enterkeyhint="done"`, pas de correction automatique sur le prénom). « Entrée » valide le formulaire.

### 2.5 Écrans concernés
- **Formulaires** (modèle complet) : accueil (premier lancement), nouveau joueur, réglages d'un joueur, réglages de l'espace parents (pause douce…), restauration d'une sauvegarde (coller un code).
- **Boutiques et sélecteurs** (garde-robe, cadeaux, décorations, choix du jeu, « Mon équipe » des compagnons v52) : ce ne sont pas des formulaires. Ils reprennent seulement l'**en-tête fixe avec ✕**, par cohérence.

## 3. Exigences non fonctionnelles
- Une slice `shared/ui/form` (JS et CSS), sans rien connaître du jeu : les textes et les actions sont passés en paramètres. Une slice `shared/ui/confirm` pour la confirmation.
- Accessibilité : `role="dialog"`, titre relié, focus placé sur le premier champ, puis rendu à l'élément d'origine à la fermeture ; tout est utilisable au clavier.
- Mobile d'abord : à 360 px de large et en paysage (hauteur 360 px), la barre d'actions reste visible.
- Aucune donnée de sauvegarde ne change (pas de migration).

## 4. Critères d'acceptation
1. Dans chaque formulaire de 2.5, « Enregistrer » est visible sans défiler, à 360 × 640 et à 640 × 360, y compris avec le clavier ouvert (test : la barre d'actions est en position fixe dans la fenêtre).
2. Fermer après un changement demande « Garder tes changements ? ». « Garder » enregistre, « Ne pas garder » rétablit l'état d'avant. Sans changement, la fenêtre se ferme directement.
3. Il n'y a plus aucun appel à `confirm()` dans `js/` (vérifié par un test).
4. Recommencer et supprimer ne sont accessibles qu'après l'accès parents et une double confirmation. Ils ont disparu du Sac et des réglages du joueur.
5. Le prénom vide bloque « Enregistrer », avec un message parlé. L'âge se choisit en gros boutons.
6. `npm test` passe (architecture, fumée, jeux).

## 5. Hors périmètre
- L'écran Réglages et la barre du bas (track `navigation-reglages`).
- Le design des boutiques (garde-robe, marché) au-delà de l'en-tête fixe.
