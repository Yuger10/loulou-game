# Project Workflow

## Principes
1. **Le plan fait foi :** tout le travail est suivi dans le `plan.md` de la track.
2. **La stack est délibérée :** tout changement (nouvelle dépendance, nouveau stockage) est d'abord documenté dans `tech-stack.md`.
3. **Tests d'abord :** le comportement attendu est écrit dans `test/smoke.test.js` (ou un nouveau fichier `test/*.test.js` branché sur `npm test`) avant le code.
4. **L'enfant d'abord :** chaque décision respecte `product-guidelines.md` (peu de texte, voix, pas de punition, anti-devinette).
5. **Commandes non interactives :** `CI=true` si besoin.

## Cycle d'une tâche
1. Prendre la tâche suivante du `plan.md` et la passer de `[ ]` à `[~]`.
2. **Rouge :** écrire le ou les tests qui décrivent le comportement, lancer `npm test` et constater l'échec.
3. **Vert :** écrire le minimum de code pour que `npm test` repasse entièrement au vert.
4. **Refactor** si utile, en relançant `npm test`.
5. **Pas de seuil de couverture chiffré** (aucun outil de mesure dans le projet). À la place, chaque comportement visible de la spec a au moins un test de fumée.
6. Si l'implémentation s'écarte de `tech-stack.md` : s'arrêter, mettre le document à jour avec une note datée, puis reprendre.
7. Passer la tâche à `[x]` dans `plan.md`, en ajoutant le SHA court du commit si la tâche a été commitée seule.

## Où ajouter quoi (feature slices, v51)
- Toute décision structurante (architecture, stockage, chaîne de build) s'écrit d'abord dans un ADR numéroté (`docs/adr/`), avant le code.
- Un mini-jeu : [checklist-mini-jeu.md](./checklist-mini-jeu.md). Une île : [checklist-ile.md](./checklist-ile.md).
- Une nouvelle fonctionnalité : une slice `js/features/<nom>/` (JS et CSS), déclarée dans `js/slices.cjs`, puis `npm run sync`. Les données de base vont dans `js/entities/`, les outils sans lien avec le jeu dans `js/shared/`.
- Besoin d'appeler une couche supérieure ? Ne pas le faire : ajouter un point d'accroche dans la couche basse et inscrire la feature dessus.
- Exposer un nom à d'autres slices : l'utiliser, puis `npm run api` (l'ajout apparaît dans le diff du manifeste, à relire).
- Déplacer du code : `node test/tools/move.js <source> <destination> nom…` (déplace des déclarations telles quelles, commentaires compris).

## Commits
- **Un commit par phase** (au minimum), avec un message en français dans le style du dépôt : `vNN : <résumé>` pour la version finale, `conductor(plan): …` pour les mises à jour de plan.
- Pas de git notes : le résumé va dans le message de commit et dans le PRD.

## Fin de phase : vérification et checkpoint
1. Annoncer la fin de phase.
2. Vérifier que chaque fichier JS modifié pendant la phase est couvert par au moins un test.
3. Lancer **`npm test`**. En cas d'échec, au maximum deux tentatives de correction, puis s'arrêter et demander.
4. Proposer une vérification manuelle concrète :
   1. `npm start`
   2. Ouvrir `http://localhost:8080/index.html` (vue téléphone dans le navigateur)
   3. Ce qu'on doit voir et faire, étape par étape
5. Attendre un « oui » explicite de l'utilisateur.
6. Commit de checkpoint, puis noter `[checkpoint: <sha>]` sur le titre de la phase dans `plan.md`.

## Fin de track : livraison
- Incrémenter le cache `sw.js` (`lagon-vNN`) ; `npm run sync` pour `FILES` et `index.html`.
- Si l'état change : incrémenter `SAVE_VERSION` et ajouter l'étape `migrate()`.
- Mettre à jour `PRD-lagon-magique.md` (section de la version), `TODO.md` et `README.md` (structure).
- Branche, puis PR sur `main`, `npm test` vert, puis merge.

## Critères de qualité (avant de cocher une tâche)
- [ ] `npm test` passe entièrement (« Tous les tests passent », « aucune erreur JS »)
- [ ] Respect des styleguides (`code_styleguides/`) et des conventions du code voisin (commentaires en français expliquant le *pourquoi*)
- [ ] Jouable au doigt sur téléphone, textes importants lus à voix haute
- [ ] Anciennes sauvegardes migrées sans perte
- [ ] Documentation à jour
