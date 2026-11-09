# Plan : Collection de squishies (v53)

> **Architecture (v51) :** chaque nouveau fichier JS ou CSS va dans sa slice et est déclaré dans `js/slices.js` (puis `npm run sync`) ; voir `conductor/checklist-mini-jeu.md` et `conductor/checklist-ile.md`.

Spec : [spec.md](./spec.md). Workflow : [workflow.md](../../workflow.md).
Nouveaux fichiers prévus : `js/features/squishies/squishies.js` (données et logique pure), `js/features/squishies/squishy-room.js` (chambre, ouverture, rangement : interface).
Tests : un nouveau `test/squishies.test.js`, enchaîné par `npm test` après le test de fumée.

> **Réalisé (v53) — écarts au plan :**
> - Le catalogue (séries, modèles, raretés, île → série) est une **entité**, `js/entities/squishy/squishies.js` : la migration de la sauvegarde (`js/entities/game-state/state.js`, couche entities) en a besoin pour créer les boîtes de rattrapage, et une entité ne peut pas lire une feature. La logique reste dans `js/features/squishies/squishies.js`, l'interface dans `squishy-room.js`, le CSS dans `squishies.css`.
> - Le coffre du jour est dans `js/features/quests/quests.js` (et non `state.js`).
> - Série Animaux : le **poussin** remplace le panda des exemples de la spec, pour que chaque squishy ait une couleur naturelle parmi celles du mini-jeu Formes (le tri par couleur doit avoir du sens : « le poussin est jaune »).
> - Une consigne est réalisable si la collection a au moins 4 **exemplaires** qui la respectent et 2 qui ne la respectent pas : les doubles comptent (on range des squishies, pas des modèles), ce qui leur donne aussi un usage. À 8 ans et plus, si aucune consigne à deux critères n'est possible avec la collection, on range avec un seul critère en attendant.
> - En plus de la spec : le bouton 💡 du compagnon dans les boîtes de rangement (piste, puis 3 squishies qui brillent dont au moins un à ranger), les sons « pouic » et « clochettes » dans `js/shared/ui/sound.js`, et des boutons ronds de l'en-tête qui suivent la largeur de l'écran (7 éléments à 360 px).
> - Vérification manuelle : captures à 360 et 390 px de chaque écran (en-tête, collection, ouverture, double, ✨, étagère, rangement à 4, 6 et 9 ans, victoire, marché, coffre) et parcours complet dans Chromium sans erreur JS.

## Phase 1 : Données et état [checkpoint: f116dbf]
- [x] Task: Brancher un second fichier de test
    - [x] Créer `test/squishies.test.js` (même chargement jsdom que `smoke.test.js`, factorisé si simple)
    - [x] `package.json` : `npm test` lance les deux fichiers
- [x] Task: Catalogue des squishies (`js/features/squishies/squishies.js`)
    - [x] Tests : 3 séries × 6 modèles ; 4 communs, 1 rare et 1 ✨ par série ; ids uniques ; chaque modèle a une couleur de `SQ_COLORS`, une forme et une taille
    - [x] Implémenter `SQUISHY_SERIES` et `SQUISHIES` (données déclaratives, extensibles)
- [x] Task: État et migration v4
    - [x] Tests : une partie neuve a un `state.squishies` vide ; une partie de la version précédente avec N chapitres résolus migre avec N boîtes en attente, de la bonne série par île ; aucune autre donnée n'est perdue
    - [x] `SAVE_VERSION` +1, `DEFAULT_STATE.squishies`, l'objet `state`, étape `migrate()`
    - [x] Tests : une sauvegarde par fichier puis une restauration conservent `squishies` (`js/features/backup/backup.js`)
- [x] Task: Conductor - User Manual Verification 'Données et état' (Protocol in workflow.md)

## Phase 2 : Boîtes et tirage [checkpoint: f116dbf]
- [x] Task: Gagner des boîtes
    - [x] Tests : le coffre du jour ajoute 1 boîte ; une énigme résolue ajoute 1 boîte de la série de l'île, une seule fois ; boutique à 15 pièces, 3 par jour, avec remise à zéro le lendemain ; refus doux sans assez de pièces
    - [x] `addSquishyBox(series|null)`, branchement dans le coffre (`js/entities/game-state/state.js`) et dans `js/features/story/story.js`
- [x] Task: Ouvrir une boîte
    - [x] Tests (hasard injecté) : 70/25/5 ; filet après 3 boîtes sans nouveauté ; une série complète est ignorée par le filet ; bonus de 20 pièces une seule fois à la complétion
    - [x] `openSquishyBox(rng)` : logique pure qui renvoie `{id, isNew, seriesCompleted}`
- [x] Task: Échanger 3 doubles contre 1 manquant
    - [x] Tests : compte des doubles ; échange refusé s'il en manque ; le squishy choisi est ajouté et 3 doubles sont retirés (les plus nombreux d'abord)
    - [x] `squishyDuplicates()`, `tradeDuplicatesFor(id)`
- [x] Task: Conductor - User Manual Verification 'Boîtes et tirage' (Protocol in workflow.md)

## Phase 3 : Dessins et chambre [checkpoint: f116dbf]
- [x] Task: Dessins SVG
    - [x] Tests : `squishyArtSVG(id)` rend un `<svg>` pour chaque modèle ; la silhouette existe ; le ✨ a la classe des paillettes
    - [x] 18 dessins dans le style de `squishySVG` (`js/features/minigames/shapes/shapes.js`) et CSS des paillettes
- [x] Task: Bouton 🧸 et ouverture de la chambre
    - [x] Tests : le bouton d'en-tête et sa pastille (nombre de boîtes) ; le bouton dans le Sac ; la chambre s'ouvre sur 📚 Collection
    - [x] `index.html`, `js/app/init.js`, `openSquishyRoom(tab)`
- [x] Task: Onglet Collection et ouverture animée
    - [x] Tests : des silhouettes pour les manquants, la progression « n / 6 » ; « Ouvrir ! » consomme une boîte et affiche le résultat (Nouveau ! / ×2 / fête ✨) ; la voix annonce le nom
    - [x] Rendu, animation (tremble, s'ouvre, saute), sons et confettis
- [x] Task: Presser
    - [x] Tests : toucher un squishy ajoute la classe d'animation, sans changer l'état
    - [x] CSS « écrase puis remonte » (environ 1,5 s), son « pouic », vibration
- [x] Task: Onglet Étagère
    - [x] Tests : poser, retirer, 12 emplacements, conservés après rechargement
    - [x] Sélection en deux touchers (squishy puis emplacement)
- [x] Task: Conductor - User Manual Verification 'Dessins et chambre' (Protocol in workflow.md)

## Phase 4 : Rangement à consigne et marché [checkpoint: f116dbf]
- [x] Task: Générer une consigne réalisable
    - [x] Tests : seulement des consignes avec au moins 4 squishies qui la respectent et 2 qui ne la respectent pas dans la collection ; selon l'âge (moins de 6 ans : couleur ; 6-7 ans : un critère ; 8 ans et plus : deux critères) ; message si moins de 6 modèles
    - [x] `makeSortingTask(owned, age, rng)` (logique pure)
- [x] Task: Jouer une boîte de rangement
    - [x] Tests : un bon choix remplit une case ; un mauvais rebondit avec un indice parlé ; après 2 erreurs, nouvelle consigne avec une relance annulable (`storyClearPendingRetry`-like dans `openModal`/`closeModal`) ; 4 cases donnent 5 pièces, 3 fois par jour, puis plus de pièces
    - [x] Onglet 📦 et compteur des boîtes rangées
- [x] Task: Marché, doubles et boutique
    - [x] Tests : la section « Mes doubles de squishies » de l'onglet Échanger ; la boutique de boîtes dans l'onglet Acheter
    - [x] `js/features/market/market.js`
- [x] Task: Conductor - User Manual Verification 'Rangement à consigne et marché' (Protocol in workflow.md)

## Phase 5 : Livraison v53
- [x] Task: Intégration PWA et docs
    - [x] `sw.js` : `lagon-v53`, nouveaux fichiers dans `FILES` ; `index.html` : les scripts
    - [x] `PRD-lagon-magique.md` (section v53, idée de la joueuse), `TODO.md`, `README.md` (structure)
- [x] Task: Vérification complète
    - [x] `npm test` vert ; parcours manuel à 360 px (ouvrir, presser, étagère, ranger, échanger, sauvegarder puis restaurer)
- [x] Task: Conductor - User Manual Verification 'Livraison v53' (Protocol in workflow.md)
- [ ] Task: Branche, PR sur `main`, merge
