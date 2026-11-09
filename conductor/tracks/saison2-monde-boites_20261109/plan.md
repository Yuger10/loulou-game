# Plan : Saison 2 « Le Ciel des Rêves » et le Monde des Boîtes (v55)

> **Architecture (v51) :** chaque nouveau fichier JS ou CSS va dans sa slice et est déclaré dans `js/slices.js` (puis `npm run sync`) ; voir `conductor/checklist-mini-jeu.md` et `conductor/checklist-ile.md`.

Spec : [spec.md](./spec.md). Workflow : [workflow.md](../../workflow.md).
**Prérequis :** la track `squishy-collection_20261109` (v53) est livrée.
Nouveaux fichiers prévus : `js/features/minigames/nesting/nesting.js` (Les boîtes gigognes), `js/features/minigames/cubes/cubes.js` (Combien de cubes ?). La saison 2 de l'histoire va dans `js/features/story/story.js`.

## Phase 1 : Deux archipels
- [ ] Task: Modèle de données des archipels
    - [ ] Tests : les 8 îles existantes ont `saison:1`, avec un ordre et des niveaux inchangés ; `worldsOf(saison)` ; le Ciel ouvert si niveau ≥ 8 ; aucune régression des tests de la carte
    - [ ] `ARCHIPELAGOS` (nom, emoji, niveau d'ouverture, fond, véhicule) et `saison` dans `WORLDS` ; `WORLD_ORDER` reste l'ordre de la saison 1 ; la logique d'ouverture et `checkNewIsland` passent par archipel
- [ ] Task: Carte à deux onglets
    - [ ] Tests : onglets présents ; Ciel verrouillé sous le niveau 8 (cadenas, « Niveau 8 ») ; îles du Ciel dans le cadre, sans chevauchement ; montgolfière dans le Ciel ; trajet seulement à l'intérieur d'un archipel
    - [ ] `js/features/map/map.js` (`renderMap(saison)`, `sailTo`), CSS du fond du Ciel
- [ ] Task: Ouverture du Ciel et migration
    - [ ] Tests : au passage au niveau 8, l'écran d'ouverture s'affiche une seule fois, puis le prologue ; une partie déjà au niveau 8 ou plus le voit au chargement ; une partie v53 migrée sans perte
    - [ ] `SAVE_VERSION` +1, `skyIntroSeen`, `migrate()`
- [ ] Task: Conductor - User Manual Verification 'Deux archipels' (Protocol in workflow.md)

## Phase 2 : Le Monde des Boîtes
- [ ] Task: L'île et son contenu
    - [ ] Tests : `WORLDS.boites` (saison 2, niveau 8, thème `--world-*`) ; 4 personnages avec butin et 3 répliques ; environ 6 objets, 2 recettes, 4 à 5 décorations
    - [ ] `js/entities/ (item, character, world)` : Capucine, Kiki, Boulon, Lola, objets, recettes, décorations ; scène dans `js/features/island/island.js` ; avatars dans `js/entities/character/characters-art.js` si nécessaire
- [ ] Task: Musique, cadeaux, saisons
    - [ ] Tests : `MUSIC_THEMES.boites` ; chaque personnage a 2 objets préférés (`favoritesOf`) ; décorations de fête sur la carte du Ciel
- [ ] Task: Série de squishies « Boîtes »
    - [ ] Tests : la série a 6 modèles (4 communs, 1 rare Pop, 1 ✨ boîte dorée) et apparaît dans la chambre
    - [ ] Données et dessins SVG (`js/features/squishies/squishies.js`)
- [ ] Task: Pop dans l'ouverture des boîtes
    - [ ] Tests (hasard injecté) : Pop apparaît 1 fois sur 5 sans changer le résultat du tirage
    - [ ] Animation dans `js/features/squishies/squishy-room.js`
- [ ] Task: Conductor - User Manual Verification 'Le Monde des Boîtes' (Protocol in workflow.md)

## Phase 3 : Les deux mini-jeux
- [ ] Task: Les boîtes gigognes (`js/features/minigames/nesting/nesting.js`)
    - [ ] Tests : bon ordre validé ; erreur avec tremblement et indice parlé ; relance après 2 erreurs (annulable) ; 3, 4 puis 5 boîtes selon le palier et l'âge ; ordre inverse au palier haut
    - [ ] Implémentation, inscription dans les types de mini-jeux et `gameTypesForAge`, paramètres dans `js/entities/difficulty/difficulty.js`, niveau adaptatif (`js/features/adaptive/adaptive.js`), compétence de l'espace parents, indices (contrat v52)
- [ ] Task: Combien de cubes ? (`js/features/minigames/cubes/cubes.js`)
    - [ ] Tests : le compte de la pile générée (cubes cachés compris) correspond à la bonne réponse ; 3 réponses distinctes ; autre pile après une erreur ; taille selon le palier ; seules les piles physiquement possibles (chaque cube du dessus repose sur un cube)
    - [ ] Générateur de piles, rendu SVG isométrique, inscription, paramètres de difficulté
- [ ] Task: Jeu favori de l'île
    - [ ] Tests : les Boîtes proposent les gigognes pour moins de 7 ans et les cubes pour 7 ans et plus
- [ ] Task: Conductor - User Manual Verification 'Les deux mini-jeux' (Protocol in workflow.md)

## Phase 4 : Histoire de la saison 2
- [ ] Task: Prologue et chapitre des Boîtes
    - [ ] Tests : le prologue suit l'ouverture du Ciel ; le chapitre des Boîtes a au moins 2 énigmes en emojis ; sa résolution donne des pièces et une boîte de la série Boîtes, une seule fois
    - [ ] `STORY` : prologue `ciel` et chapitre `boites` (guide Capucine)
- [ ] Task: Épisodes des Boîtes
    - [ ] Tests : 3 épisodes (`EPISODES.boites`) après la 2ᵉ, 4ᵉ et 7ᵉ mission, jamais racontés par Capucine, objet et 3 pièces, relisibles dans le journal
- [ ] Task: Grisou
    - [ ] Tests : `grisouSVG(n)` a une couleur qui progresse avec le nombre d'îles libérées ; affiché dans les chapitres de la saison 2
    - [ ] Dessin SVG (nuage, visage, couleurs progressives)
- [ ] Task: Journal à deux saisons
    - [ ] Tests : le journal 📖 affiche « Saison 1 » et « Le Ciel des Rêves » ; chapitres verrouillés et résolus corrects dans chaque partie
- [ ] Task: Conductor - User Manual Verification 'Histoire de la saison 2' (Protocol in workflow.md)

## Phase 5 : Livraison v55
- [ ] Task: Intégration PWA et docs
    - [ ] `sw.js` : `lagon-v55` et nouveaux fichiers ; `index.html` : les scripts ; PRD (v55, idée de la joueuse), TODO, README
- [ ] Task: Vérification complète
    - [ ] `npm test` vert ; parcours manuel à 360 px (niveau 7 → 8, ouverture du Ciel, Boîtes, deux mini-jeux, énigme, boîte surprise)
- [ ] Task: Conductor - User Manual Verification 'Livraison v55' (Protocol in workflow.md)
- [ ] Task: Branche, PR sur `main`, merge
