# Plan : Saison 2 « Le Ciel des Rêves » et le Monde des Boîtes (v55)

> **Architecture (v51) :** chaque nouveau fichier JS ou CSS va dans sa slice et est déclaré dans `js/slices.cjs` (puis `npm run sync`) ; voir `conductor/checklist-mini-jeu.md` et `conductor/checklist-ile.md`.

Spec : [spec.md](./spec.md). Workflow : [workflow.md](../../workflow.md).
**Prérequis :** la track `squishy-collection_20261109` (v53) est livrée.

> **Réalisé (v55) — écarts au plan :**
> - **Ouverture au niveau 36** (décision du propriétaire, après relecture), au lieu du niveau 8 : le Ciel vient après tout le Lagon. Le Monde des Boîtes est au palier 6. Les tests de la saison 2 suivent ce niveau. Une fois le Lagon entièrement ouvert, la carte annonce « Prochain monde : Le Ciel des Rêves au niveau 36 », avec sa progression.
> - **`WORLD_ORDER` contient toutes les îles** (la saison 1, puis la saison 2), et `worldsOf(saison)` donne celles d'un archipel, pour sa carte et sa route. Ainsi les îles visitées, Sam le guide, le puzzle des images, la musique et les épisodes couvrent les deux saisons sans cas particulier.
> - **Fichiers ajoutés :**
>   - `js/features/story/grisou.js` (le dessin de Grisou) ;
>   - les mini-jeux dans leurs slices `minigames/nesting/` et `minigames/cubes/` (JS, CSS, `index.js`, v54) ;
>   - la série Boîtes, ajoutée au catalogue `js/entities/squishy/squishies.js`, avec ses dessins dans `squishy-room.js`.
> - **La série Boîtes reste cachée tant que l'île est fermée** (chambre, boîtes mystère, marché), pour ne pas montrer 6 silhouettes de plus à un enfant de niveau 1.
> - **8 objets** au lieu d'environ 6, pour qu'au moins 3 ne soient donnés par personne (les préférés des habitants).
> - **Combien de cubes ?** n'a pas de minuteur, comme les gigognes : le repérage dans l'espace est une compétence nouvelle.
> - **Lili** (v52) a désormais son île : la rencontre au Monde des Boîtes marche sans code de plus.
> - **Vérification manuelle :**
>   - captures à 360 px, sur les vrais modules (clics seulement) : carte verrouillée, ouverture du Ciel, prologue, chapitre, énigme, nouvelle île, carte du Ciel, île, choix des jeux, gigognes, cubes, journal, chambre à squishies ;
>   - parcours au doigt sans erreur JS ;
>   - hors-ligne : 199 fichiers en cache.
Nouveaux fichiers prévus : `js/features/minigames/nesting/nesting.js` (Les boîtes gigognes), `js/features/minigames/cubes/cubes.js` (Combien de cubes ?). La saison 2 de l'histoire va dans `js/features/story/story.js`.

## Phase 1 : Deux archipels [checkpoint: 453fc6c]
- [x] Task: Modèle de données des archipels
    - [x] Tests : les 8 îles existantes ont `saison:1`, avec un ordre et des niveaux inchangés ; `worldsOf(saison)` ; le Ciel ouvert si niveau ≥ 8 ; aucune régression des tests de la carte
    - [x] `ARCHIPELAGOS` (nom, emoji, niveau d'ouverture, fond, véhicule) et `saison` dans `WORLDS` ; `WORLD_ORDER` reste l'ordre de la saison 1 ; la logique d'ouverture et `checkNewIsland` passent par archipel
- [x] Task: Carte à deux onglets
    - [x] Tests : onglets présents ; Ciel verrouillé sous le niveau 36 (cadenas, « Niveau 36 ») ; îles du Ciel dans le cadre, sans chevauchement ; montgolfière dans le Ciel ; trajet seulement à l'intérieur d'un archipel
    - [x] `js/features/map/map.js` (`renderMap(saison)`, `sailTo`), CSS du fond du Ciel
- [x] Task: Ouverture du Ciel et migration
    - [x] Tests : au passage au niveau 36, l'écran d'ouverture s'affiche une seule fois, puis le prologue ; une partie déjà au niveau 36 ou plus le voit au chargement ; une partie v53 migrée sans perte
    - [x] `SAVE_VERSION` +1, `skyIntroSeen`, `migrate()`
- [x] Task: Conductor - User Manual Verification 'Deux archipels' (Protocol in workflow.md)

## Phase 2 : Le Monde des Boîtes [checkpoint: 453fc6c]
- [x] Task: L'île et son contenu
    - [x] Tests : `WORLDS.boites` (saison 2, niveau 36, thème `--world-*`) ; 4 personnages avec butin et 3 répliques ; environ 6 objets, 2 recettes, 4 à 5 décorations
    - [x] `js/entities/ (item, character, world)` : Capucine, Kiki, Boulon, Lola, objets, recettes, décorations ; scène dans `js/features/island/island.js` ; avatars dans `js/entities/character/characters-art.js` si nécessaire
- [x] Task: Musique, cadeaux, saisons
    - [x] Tests : `MUSIC_THEMES.boites` ; chaque personnage a 2 objets préférés (`favoritesOf`) ; décorations de fête sur la carte du Ciel
- [x] Task: Série de squishies « Boîtes »
    - [x] Tests : la série a 6 modèles (4 communs, 1 rare Pop, 1 ✨ boîte dorée) et apparaît dans la chambre
    - [x] Données et dessins SVG (`js/features/squishies/squishies.js`)
- [x] Task: Pop dans l'ouverture des boîtes
    - [x] Tests (hasard injecté) : Pop apparaît 1 fois sur 5 sans changer le résultat du tirage
    - [x] Animation dans `js/features/squishies/squishy-room.js`
- [x] Task: Conductor - User Manual Verification 'Le Monde des Boîtes' (Protocol in workflow.md)

## Phase 3 : Les deux mini-jeux [checkpoint: 453fc6c]
- [x] Task: Les boîtes gigognes (`js/features/minigames/nesting/nesting.js`)
    - [x] Tests : bon ordre validé ; erreur avec tremblement et indice parlé ; relance après 2 erreurs (annulable) ; 3, 4 puis 5 boîtes selon le palier et l'âge ; ordre inverse au palier haut
    - [x] Implémentation, inscription dans les types de mini-jeux et `gameTypesForAge`, paramètres dans `js/entities/difficulty/difficulty.js`, niveau adaptatif (`js/features/adaptive/adaptive.js`), compétence de l'espace parents, indices (contrat v52)
- [x] Task: Combien de cubes ? (`js/features/minigames/cubes/cubes.js`)
    - [x] Tests : le compte de la pile générée (cubes cachés compris) correspond à la bonne réponse ; 3 réponses distinctes ; autre pile après une erreur ; taille selon le palier ; seules les piles physiquement possibles (chaque cube du dessus repose sur un cube)
    - [x] Générateur de piles, rendu SVG isométrique, inscription, paramètres de difficulté
- [x] Task: Jeu favori de l'île
    - [x] Tests : les Boîtes proposent les gigognes pour moins de 7 ans et les cubes pour 7 ans et plus
- [x] Task: Conductor - User Manual Verification 'Les deux mini-jeux' (Protocol in workflow.md)

## Phase 4 : Histoire de la saison 2 [checkpoint: 453fc6c]
- [x] Task: Prologue et chapitre des Boîtes
    - [x] Tests : le prologue suit l'ouverture du Ciel ; le chapitre des Boîtes a au moins 2 énigmes en emojis ; sa résolution donne des pièces et une boîte de la série Boîtes, une seule fois
    - [x] `STORY` : prologue `ciel` et chapitre `boites` (guide Capucine)
- [x] Task: Épisodes des Boîtes
    - [x] Tests : 3 épisodes (`EPISODES.boites`) après la 2ᵉ, 4ᵉ et 7ᵉ mission, jamais racontés par Capucine, objet et 3 pièces, relisibles dans le journal
- [x] Task: Grisou
    - [x] Tests : `grisouSVG(n)` a une couleur qui progresse avec le nombre d'îles libérées ; affiché dans les chapitres de la saison 2
    - [x] Dessin SVG (nuage, visage, couleurs progressives)
- [x] Task: Journal à deux saisons
    - [x] Tests : le journal 📖 affiche « Saison 1 » et « Le Ciel des Rêves » ; chapitres verrouillés et résolus corrects dans chaque partie
- [x] Task: Conductor - User Manual Verification 'Histoire de la saison 2' (Protocol in workflow.md)

## Phase 5 : Livraison v55
- [x] Task: Intégration PWA et docs
    - [x] `sw.js` : `lagon-v55` et nouveaux fichiers ; `index.html` : les scripts ; PRD (v55, idée de la joueuse), TODO, README
- [x] Task: Vérification complète
    - [x] `npm test` vert ; parcours manuel à 360 px (niveau 35 → 36, ouverture du Ciel, Boîtes, deux mini-jeux, énigme, boîte surprise)
- [x] Task: Conductor - User Manual Verification 'Livraison v55' (Protocol in workflow.md)
- [ ] Task: Branche, PR sur `main`, merge
