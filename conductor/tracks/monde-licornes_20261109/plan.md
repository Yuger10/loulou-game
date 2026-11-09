# Plan : Le Monde des Licornes et la fin de la saison 2 (v55)

Spec : [spec.md](./spec.md). Workflow : [workflow.md](../../workflow.md).
**Prérequis :** v52 (`squishy-collection`) et v54 (`saison2-monde-boites`) livrées.
Nouveaux fichiers prévus : `js/potions.js` (Les potions de couleurs), `js/mirror.js` (Le miroir magique), `js/finale.js` (grand final de la saison 2).

## Phase 1 : L'île du Royaume Arc-en-ciel
- [ ] Task: L'île et son contenu
    - [ ] Tests : `WORLDS.licornes` (saison 2, niveau 13, thème) ; Reine Arc-en-ciel, guide sans mission ; Étincelle, Biscotte, Félix et Mira avec butin et 3 répliques ; Étincelle du Lagon inchangée ; environ 6 objets, 2 recettes, 4 à 5 décorations ; île dans le cadre de la carte du Ciel, sans chevauchement
    - [ ] `js/data.js`, scène dans `js/island.js`, avatars si nécessaire
- [ ] Task: Musique et cadeaux
    - [ ] Tests : `MUSIC_THEMES.licornes` et variante du final ; 2 objets préférés par personnage
- [ ] Task: Série de squishies « Licornes »
    - [ ] Tests : 6 modèles (4 communs, 1 rare Biscotte, 1 ✨ licorne étoile), visibles dans la chambre
    - [ ] Données et dessins SVG
- [ ] Task: Conductor - User Manual Verification "L'île du Royaume Arc-en-ciel" (Protocol in workflow.md)

## Phase 2 : Les potions de couleurs
- [ ] Task: Logique des couleurs
    - [ ] Tests : la table des mélanges (rouge + jaune = orange, bleu + jaune = vert, rouge + bleu = violet, rouge + blanc = rose, noir + blanc = gris) ; ordre de l'arc-en-ciel ; mélange inverse ; 3 choix distincts dont un seul juste
    - [ ] `js/potions.js` (pure) : `COLOR_MIXES`, `RAINBOW`, générateurs par palier
- [ ] Task: Jeu et interface
    - [ ] Tests : GS = reconnaître une couleur, CP = primaires, CE1 = tous les mélanges et l'arc-en-ciel à 2 trous, CE2 = inverse et 4 trous ; chaque pastille a un nom parlé et un repère non coloré ; une erreur relance un autre mélange (annulable)
    - [ ] Rendu des fioles et de l'arc-en-ciel, inscription dans les types de mini-jeux, `gameTypesForAge`, `js/difficulty.js`
- [ ] Task: Conductor - User Manual Verification 'Les potions de couleurs' (Protocol in workflow.md)

## Phase 3 : Le miroir magique
- [ ] Task: Logique de symétrie
    - [ ] Tests : `mirrorOf(pattern, axis)` pour les axes vertical et horizontal ; validation exacte ; motifs générés selon le palier (4×4 à 2-3 cases, 6×6 à environ 5 cases, axe horizontal ou deux couleurs en CE2)
    - [ ] `js/mirror.js` (pure)
- [ ] Task: Jeu et interface
    - [ ] Tests : toucher bascule une case ; « ✨ Fini ! » valide ; les cases fausses clignotent avec un indice parlé ; nouveau motif après 2 erreurs (annulable) ; jeu favori de l'île : potions pour moins de 7 ans, miroir pour 7 ans et plus
    - [ ] Grille tactile, axe en paillettes, inscription et difficulté
- [ ] Task: Conductor - User Manual Verification 'Le miroir magique' (Protocol in workflow.md)

## Phase 4 : Chapitre et grand final
- [ ] Task: Chapitre `licornes`
    - [ ] Tests : au moins 2 énigmes sur les couleurs ; la résolution donne des pièces et une boîte de la série Licornes, une seule fois ; le final suit
    - [ ] `STORY.licornes` (guide : la Reine Arc-en-ciel)
- [ ] Task: Épisodes du Royaume
    - [ ] Tests : 3 épisodes (`EPISODES.licornes`), jamais racontés par la Reine, objet et 3 pièces
- [ ] Task: Grand final (`js/finale.js`)
    - [ ] Tests : il se joue une seule fois (`season2Done`) ; Grisou devient entièrement coloré ; récompenses données : compagnon Grisou sélectionnable et squishy unique ✨ Grisou arc-en-ciel dans la case Trésors ; revoir le final depuis le journal ne redonne rien ; le journal affiche « Le Ciel des Rêves ✅ »
    - [ ] Scène plein écran, voix, confettis ; compagnon Grisou dans `js/companions.js` ; case Trésors dans la chambre ; `SAVE_VERSION` +1 et `migrate()`
    - [ ] Tests : ✨ Grisou arc-en-ciel n'est jamais tiré d'une boîte (tirages simulés)
- [ ] Task: Conductor - User Manual Verification 'Chapitre et grand final' (Protocol in workflow.md)

## Phase 5 : Livraison v55
- [ ] Task: Intégration PWA et docs
    - [ ] `sw.js` : `lagon-v55` et nouveaux fichiers ; `index.html` ; PRD (v55, idée de la joueuse), TODO (idées bonus : licorne volante, grand décor arc-en-ciel, saison 3), README
- [ ] Task: Vérification complète
    - [ ] `npm test` vert ; parcours manuel à 360 px (niveau 12 → 13, Royaume, deux mini-jeux, énigme, final, choix de Grisou comme compagnon, Trésors)
- [ ] Task: Conductor - User Manual Verification 'Livraison v55' (Protocol in workflow.md)
- [ ] Task: Branche, PR sur `main`, merge
