# Plan : Le Monde des Licornes et la fin de la saison 2

> **Architecture (v51) :** chaque nouveau fichier JS ou CSS va dans sa slice et est déclaré dans `js/slices.cjs` (puis `npm run sync`) ; voir `conductor/checklist-mini-jeu.md` et `conductor/checklist-ile.md`.

Spec : [spec.md](./spec.md). Workflow : [workflow.md](../../workflow.md).
**Prérequis :** v53 (`squishy-collection`) et v55 (`saison2-monde-boites`) livrées.
Nouveaux fichiers prévus : `js/features/minigames/potions/potions.js` (Les potions de couleurs), `js/features/minigames/mirror/mirror.js` (Le miroir magique), `js/features/story/finale.js` (grand final de la saison 2).

> **Réalisé (v65) — écarts au plan :**
> - **Numéro de version et sauvegarde :** livré en v65. La sauvegarde passe en **v9**, car la v8 a été prise par la pause (v64). La phase 5 citait `lagon-v56`, numéro prévu à l'époque.
> - **5 personnages :** la Reine (guide, `noGames` : elle parle et accepte les cadeaux, sans mini-jeu) et les 4 licornes. Sam le guide ne propose jamais d'aller l'aider.
> - **9 objets** au lieu d'environ 6, pour que 3 objets ne soient donnés par personne. Le « peigne d'argent » est devenu un miroir d'argent (emoji mieux reconnu sur les anciens téléphones). « Fiole » existait déjà : c'est ici la fiole de couleur.
> - **Les potions :** l'arc-en-ciel compte 6 couleurs (sans l'indigo, difficile à distinguer du bleu et du violet). La question « sciences ou formes et espace » est tranchée : les potions vont dans « Sciences ».
> - **Le miroir :** au palier 5, les deux couleurs s'obtiennent en touchant une case une fois (♥ rose) ou deux fois (★ bleu). Chaque couleur a son symbole.
> - **Grisou compagnon :** il a son propre dessin pour chaque humeur (un nuage arc-en-ciel). Il est verrouillé (`unlock:'season2Done'`) dans le choix des compagnons, et ne se rencontre pas sur l'île : il rejoint l'équipe au final (événement `season2:done`).
> - **Trésors :** un catalogue à part (`SQUISHY_TREASURES`), hors de `SQUISHIES` : aucun tirage ni échange ne peut le donner. La case n'apparaît qu'une fois le Ciel ouvert, ou le trésor gagné.
> - **Sur l'île, 5 personnages** au lieu de 4 : une disposition à part (2 en haut, 3 en bas), pour qu'aucune bulle ne cache le nom d'un voisin, de 360 à 1280 px de large.
> - **Les récompenses du final** sont données dès son début, pour ne rien perdre si la fenêtre est fermée en route.
> - **La musique de fête** passe par un événement (`music:theme`), qui remplace un moment le thème de l'île.
> - **Tests :** un fichier `test/licornes.test.js` (68 vérifications). Le test des compagnons sur Grisou et celui de la migration de la pause ont été mis à jour.

## Phase 1 : L'île du Royaume Arc-en-ciel
- [x] Task: L'île et son contenu
    - [x] Tests : `WORLDS.licornes` (saison 2, niveau 62, thème) ; Reine Arc-en-ciel, guide sans mission ; Étincelle, Biscotte, Félix et Mira avec butin et 3 répliques ; Étincelle du Lagon inchangée ; environ 6 objets, 2 recettes, 4 à 5 décorations ; île dans le cadre de la carte du Ciel, sans chevauchement
    - [x] `js/entities/ (item, character, world)`, scène dans `js/features/island/island.js`, avatars si nécessaire
- [x] Task: Musique et cadeaux
    - [x] Tests : `MUSIC_THEMES.licornes` et variante du final ; 2 objets préférés par personnage
- [x] Task: Série de squishies « Licornes »
    - [x] Tests : 6 modèles (4 communs, 1 rare Biscotte, 1 ✨ licorne étoile), visibles dans la chambre
    - [x] Données et dessins SVG
- [x] Task: Conductor - User Manual Verification "L'île du Royaume Arc-en-ciel" (Protocol in workflow.md)

## Phase 2 : Les potions de couleurs
- [x] Task: Logique des couleurs
    - [x] Tests : la table des mélanges (rouge + jaune = orange, bleu + jaune = vert, rouge + bleu = violet, rouge + blanc = rose, noir + blanc = gris) ; ordre de l'arc-en-ciel ; mélange inverse ; 3 choix distincts dont un seul juste
    - [x] `js/features/minigames/potions/potions.js` (pure) : `COLOR_MIXES`, `RAINBOW`, générateurs par palier
- [x] Task: Jeu et interface
    - [x] Tests : GS = reconnaître une couleur, CP = primaires, CE1 = tous les mélanges et l'arc-en-ciel à 2 trous, CE2 = inverse et 4 trous ; chaque pastille a un nom parlé et un repère non coloré ; une erreur relance un autre mélange (annulable)
    - [x] Rendu des fioles et de l'arc-en-ciel, inscription dans les types de mini-jeux, `gameTypesForAge`, `js/entities/difficulty/difficulty.js`
- [x] Task: Conductor - User Manual Verification 'Les potions de couleurs' (Protocol in workflow.md)

## Phase 3 : Le miroir magique
- [x] Task: Logique de symétrie
    - [x] Tests : `mirrorOf(pattern, axis)` pour les axes vertical et horizontal ; validation exacte ; motifs générés selon le palier (4×4 à 2-3 cases, 6×6 à environ 5 cases, axe horizontal ou deux couleurs en CE2)
    - [x] `js/features/minigames/mirror/mirror.js` (pure)
- [x] Task: Jeu et interface
    - [x] Tests : toucher bascule une case ; « ✨ Fini ! » valide ; les cases fausses clignotent avec un indice parlé ; nouveau motif après 2 erreurs (annulable) ; jeu favori de l'île : potions pour moins de 7 ans, miroir pour 7 ans et plus
    - [x] Grille tactile, axe en paillettes, inscription et difficulté
- [x] Task: Conductor - User Manual Verification 'Le miroir magique' (Protocol in workflow.md)

## Phase 4 : Chapitre et grand final
- [x] Task: Chapitre `licornes`
    - [x] Tests : au moins 2 énigmes sur les couleurs ; la résolution donne des pièces et une boîte de la série Licornes, une seule fois ; le final suit
    - [x] `STORY.licornes` (guide : la Reine Arc-en-ciel)
- [x] Task: Épisodes du Royaume
    - [x] Tests : 3 épisodes (`EPISODES.licornes`), jamais racontés par la Reine, objet et 3 pièces
- [x] Task: Grand final (`js/features/story/finale.js`)
    - [x] Tests : il se joue une seule fois (`season2Done`) ; Grisou devient entièrement coloré ; récompenses données : compagnon Grisou sélectionnable et squishy unique ✨ Grisou arc-en-ciel dans la case Trésors ; revoir le final depuis le journal ne redonne rien ; le journal affiche « Le Ciel des Rêves ✅ »
    - [x] Scène plein écran, voix, confettis ; compagnon Grisou dans `js/entities/companion/companions.js` ; case Trésors dans la chambre ; `SAVE_VERSION` +1 et `migrate()`
    - [x] Tests : ✨ Grisou arc-en-ciel n'est jamais tiré d'une boîte (tirages simulés)
- [x] Task: Conductor - User Manual Verification 'Chapitre et grand final' (Protocol in workflow.md)

## Phase 5 : Livraison
- [x] Task: Intégration PWA et docs
    - [x] `sw.js` : `lagon-v56` et nouveaux fichiers ; `index.html` ; PRD (v56, idée de la joueuse), TODO (idées bonus : licorne volante, grand décor arc-en-ciel, saison 3), README
- [x] Task: Vérification complète
    - [x] `npm test` vert ; parcours manuel à 360 px (niveau 61 → 62, Royaume, deux mini-jeux, énigme, final, choix de Grisou comme compagnon, Trésors)
- [x] Task: Conductor - User Manual Verification 'Livraison' (Protocol in workflow.md)
- [ ] Task: Branche, PR sur `main`, merge
