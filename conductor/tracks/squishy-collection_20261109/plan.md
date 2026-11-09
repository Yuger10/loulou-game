# Plan : Collection de squishies (v53)

> **Architecture (v51) :** chaque nouveau fichier JS ou CSS va dans sa slice et est déclaré dans `js/slices.js` (puis `npm run sync`) ; voir `conductor/checklist-mini-jeu.md` et `conductor/checklist-ile.md`.

Spec : [spec.md](./spec.md). Workflow : [workflow.md](../../workflow.md).
Nouveaux fichiers prévus : `js/features/squishies/squishies.js` (données et logique pure), `js/features/squishies/squishy-room.js` (chambre, ouverture, rangement : interface).
Tests : un nouveau `test/squishies.test.js`, enchaîné par `npm test` après le test de fumée.

## Phase 1 : Données et état
- [ ] Task: Brancher un second fichier de test
    - [ ] Créer `test/squishies.test.js` (même chargement jsdom que `smoke.test.js`, factorisé si simple)
    - [ ] `package.json` : `npm test` lance les deux fichiers
- [ ] Task: Catalogue des squishies (`js/features/squishies/squishies.js`)
    - [ ] Tests : 3 séries × 6 modèles ; 4 communs, 1 rare et 1 ✨ par série ; ids uniques ; chaque modèle a une couleur de `SQ_COLORS`, une forme et une taille
    - [ ] Implémenter `SQUISHY_SERIES` et `SQUISHIES` (données déclaratives, extensibles)
- [ ] Task: État et migration v4
    - [ ] Tests : une partie neuve a un `state.squishies` vide ; une partie de la version précédente avec N chapitres résolus migre avec N boîtes en attente, de la bonne série par île ; aucune autre donnée n'est perdue
    - [ ] `SAVE_VERSION` +1, `DEFAULT_STATE.squishies`, l'objet `state`, étape `migrate()`
    - [ ] Tests : une sauvegarde par fichier puis une restauration conservent `squishies` (`js/features/backup/backup.js`)
- [ ] Task: Conductor - User Manual Verification 'Données et état' (Protocol in workflow.md)

## Phase 2 : Boîtes et tirage
- [ ] Task: Gagner des boîtes
    - [ ] Tests : le coffre du jour ajoute 1 boîte ; une énigme résolue ajoute 1 boîte de la série de l'île, une seule fois ; boutique à 15 pièces, 3 par jour, avec remise à zéro le lendemain ; refus doux sans assez de pièces
    - [ ] `addSquishyBox(series|null)`, branchement dans le coffre (`js/entities/game-state/state.js`) et dans `js/features/story/story.js`
- [ ] Task: Ouvrir une boîte
    - [ ] Tests (hasard injecté) : 70/25/5 ; filet après 3 boîtes sans nouveauté ; une série complète est ignorée par le filet ; bonus de 20 pièces une seule fois à la complétion
    - [ ] `openSquishyBox(rng)` : logique pure qui renvoie `{id, isNew, seriesCompleted}`
- [ ] Task: Échanger 3 doubles contre 1 manquant
    - [ ] Tests : compte des doubles ; échange refusé s'il en manque ; le squishy choisi est ajouté et 3 doubles sont retirés (les plus nombreux d'abord)
    - [ ] `squishyDuplicates()`, `tradeDuplicatesFor(id)`
- [ ] Task: Conductor - User Manual Verification 'Boîtes et tirage' (Protocol in workflow.md)

## Phase 3 : Dessins et chambre
- [ ] Task: Dessins SVG
    - [ ] Tests : `squishyArtSVG(id)` rend un `<svg>` pour chaque modèle ; la silhouette existe ; le ✨ a la classe des paillettes
    - [ ] 18 dessins dans le style de `squishySVG` (`js/features/minigames/shapes/shapes.js`) et CSS des paillettes
- [ ] Task: Bouton 🧸 et ouverture de la chambre
    - [ ] Tests : le bouton d'en-tête et sa pastille (nombre de boîtes) ; le bouton dans le Sac ; la chambre s'ouvre sur 📚 Collection
    - [ ] `index.html`, `js/app/init.js`, `openSquishyRoom(tab)`
- [ ] Task: Onglet Collection et ouverture animée
    - [ ] Tests : des silhouettes pour les manquants, la progression « n / 6 » ; « Ouvrir ! » consomme une boîte et affiche le résultat (Nouveau ! / ×2 / fête ✨) ; la voix annonce le nom
    - [ ] Rendu, animation (tremble, s'ouvre, saute), sons et confettis
- [ ] Task: Presser
    - [ ] Tests : toucher un squishy ajoute la classe d'animation, sans changer l'état
    - [ ] CSS « écrase puis remonte » (environ 1,5 s), son « pouic », vibration
- [ ] Task: Onglet Étagère
    - [ ] Tests : poser, retirer, 12 emplacements, conservés après rechargement
    - [ ] Sélection en deux touchers (squishy puis emplacement)
- [ ] Task: Conductor - User Manual Verification 'Dessins et chambre' (Protocol in workflow.md)

## Phase 4 : Rangement à consigne et marché
- [ ] Task: Générer une consigne réalisable
    - [ ] Tests : seulement des consignes avec au moins 4 squishies qui la respectent et 2 qui ne la respectent pas dans la collection ; selon l'âge (moins de 6 ans : couleur ; 6-7 ans : un critère ; 8 ans et plus : deux critères) ; message si moins de 6 modèles
    - [ ] `makeSortingTask(owned, age, rng)` (logique pure)
- [ ] Task: Jouer une boîte de rangement
    - [ ] Tests : un bon choix remplit une case ; un mauvais rebondit avec un indice parlé ; après 2 erreurs, nouvelle consigne avec une relance annulable (`storyClearPendingRetry`-like dans `openModal`/`closeModal`) ; 4 cases donnent 5 pièces, 3 fois par jour, puis plus de pièces
    - [ ] Onglet 📦 et compteur des boîtes rangées
- [ ] Task: Marché, doubles et boutique
    - [ ] Tests : la section « Mes doubles de squishies » de l'onglet Échanger ; la boutique de boîtes dans l'onglet Acheter
    - [ ] `js/features/market/market.js`
- [ ] Task: Conductor - User Manual Verification 'Rangement à consigne et marché' (Protocol in workflow.md)

## Phase 5 : Livraison v53
- [ ] Task: Intégration PWA et docs
    - [ ] `sw.js` : `lagon-v53`, nouveaux fichiers dans `FILES` ; `index.html` : les scripts
    - [ ] `PRD-lagon-magique.md` (section v53, idée de la joueuse), `TODO.md`, `README.md` (structure)
- [ ] Task: Vérification complète
    - [ ] `npm test` vert ; parcours manuel à 360 px (ouvrir, presser, étagère, ranger, échanger, sauvegarder puis restaurer)
- [ ] Task: Conductor - User Manual Verification 'Livraison v53' (Protocol in workflow.md)
- [ ] Task: Branche, PR sur `main`, merge
