# Checklist : ajouter une île (un monde)

Architecture en feature slices (v51), en modules ES natifs (v54). Exemple de référence : le Pays Squishy (`squishy`).
Remplacer `<ile>` par la clé de l'île (ex. `boites`).

## 1. Tests d'abord
- [ ] `test/smoke.test.js` : l'île s'ouvre au bon niveau, ses personnages et son jeu favori sont là. Les tests génériques (thème de couleurs, île dans le cadre de la carte, sans chevauchement) la couvrent automatiquement.

## 2. Entités
> Le code est vérifié en TypeScript strict couche par couche : `tsconfig.strict.json` liste ce qui l'est déjà, et la liste grandit jusqu'à tout `js/` ([ADR 0003](../docs/adr/0003-typescript.md), track `typescript-checkjs`). Tout nouveau code s'écrit donc strictement typé, quelle que soit sa slice. Une entrée qui ajoute un champ à une table typée (`World`, `Archipelago`, `Character`, `Item`, `Squishy`, `GameState`…) étend d'abord son `@typedef` ; un nouveau fichier de ces couches est typé strictement. Jamais `any` ni `@ts-ignore`. `bun run typecheck` le vérifie.
> Une **nouvelle slice** entre dans `include` de `tsconfig.strict.json` dans la PR qui la crée **seulement si** `bun run typecheck` reste vert avec elle, c'est-à-dire si tout ce qu'elle importe est déjà strict : TypeScript vérifie aussi, avec les mêmes options, chaque fichier importé (essai du 22/11/2026 : ajouter un mini-jeu y entraîne `minigame-engine`, `island`, `story`… et plusieurs centaines d'erreurs). Procédure : ajouter le glob, lancer `bun run typecheck` ; si des erreurs apparaissent hors des fichiers de la track, retirer le glob et le noter au journal de décisions du plan. Dans tous les cas, le nouveau code est typé à la main (`@param`, `@returns`, `@typedef`), pour entrer sans travail le jour où ses dépendances seront strictes (track `typescript-checkjs`).

- [ ] `js/entities/world/worlds.js` : l'entrée `WORLDS.<ile>` :
  - nom, emoji, niveau (celui de `conductor/niveaux.md` : `test/niveaux.test.js` vérifie que le jeu et la spec suivent ce tableau), `diff`, sous-titre ;
  - **`saison`** : son archipel (1 = Lagon Magique, 2 = Ciel des Rêves, v55) ;
  - position `map:{x,y}` sur la carte de son archipel, dans le cadre 14–86 % / 15–85 %, sans chevaucher les autres îles du même archipel ;
  - forme, couleurs ;
  - `game:` favori éventuel, un nom ou une fonction de l'âge (`(age)=> …`) ;
  - textes d'intro et de scène vide.
- [ ] `js/entities/character/characters.js` : ses 4 personnages (`world:'<ile>'`, butin `loot`, 3 répliques), et leur dessin dans `js/entities/character/characters-art.js` (`CHAR_ART`).
- [ ] `js/entities/item/items.js` : ses objets (`world:'<ile>'`), au moins 3 qui ne sont donnés par personne (pour les 2 objets préférés de chaque personnage, `favoritesOf`), ses recettes de fusion et ses décorations.
- [ ] Son palier : le champ `diff` de `WORLDS.<ile>` (1 à 6, expliqué en tête de `js/entities/difficulty/difficulty.js`). Les îles des saisons 2 et 3 sont au palier 6.

## 2 bis. Taille des fichiers (`max-lines` à 1100, `.oxlintrc.json`)
Avant d'ajouter à un fichier partagé, mesurer sa marge (`wc -l`). Relever `max-lines` est exclu (corriger le code plutôt que la règle). Au 22/11/2026, deux fichiers sont presque pleins : `characters-art.js` (1055 lignes) et `difficulty.js` (1014). Le contenu de la saison 3 va donc dans des fichiers dédiés :
- **Dessins des personnages** : `js/entities/character/characters-art-saison3.js`. La track `saison3-ouverture` le prépare sans rien changer à l'écran : les aides de dessin (`svg`, `human`, `beast`, `face`, `features` et leurs couleurs) passent telles quelles dans `characters-art-kit.js`, qui les exporte ; `characters-art.js` les importe ; `characters-art-saison3.js` exporte sa table `ART_S3` (vide au départ), que `characters-art.js` fusionne dans `CHAR_ART`. Un test vérifie que le SVG de chaque personnage existant est identique, au caractère près, avant et après. Chaque île ajoute ses 4 dessins dans `characters-art-saison3.js`, et ne touche à aucun dessin existant.
- **Fonctions de palier des nouveaux jeux** et leurs types : `js/entities/difficulty/rounds-saison3.js`, réexporté par `js/entities/difficulty/index.js` ; créé par la première track qui en a besoin. Cette même PR exporte `tierValue` de `difficulty.js` (une ligne, il n'est pas exporté aujourd'hui) pour que `rounds-saison3.js` l'importe. `LIVES_TABLE`, `GENEROUS_KINDS` et `NO_TIMER_KINDS` restent dans `difficulty.js` (une ligne par jeu).
- **Personnages** : `characters.js` fait 798 lignes, et 20 personnages d'environ 13 lignes l'amènent vers 1060 : il tient, mais chaque île vérifie la marge avant d'ajouter ; si elle manque, ses personnages vont dans `js/entities/character/characters-saison3.js`, fusionné dans `CHARACTERS`.
- **Un fichier de jeu** qui dépasserait 1100 lignes se découpe en fichiers frères dans sa slice (par exemple les banques de textes à part), déclarés dans `js/slices.cjs`, puis `bun run sync`.

## 3. Features
- [ ] `js/shared/styles/design-system-v21.css` (ou une feuille de la slice île) : le thème `body[data-world="<ile>"]{--world-sky:…; --world-sea:…}`.
- [ ] `js/features/island/island.js` : son paysage dans `ISLE_SCENERY.<ile>`.
- [ ] `js/features/story/story.js` : son chapitre `STORY.<ile>` (guide, 3 phrases d'intro, au moins 2 énigmes en emojis avec un `tip`, succès, récompense). Une île de la saison 2 montre Grisou, qui reprend des couleurs quand son énigme est résolue.
- [ ] `js/entities/squishy/squishies.js` : la série de squishies gagnée par son énigme, dans `SQUISHY_ISLAND_SERIES.<ile>` (et sa propre série dans `SQUISHY_SERIES` / `SQUISHIES` si le monde en a une, v53).
- [ ] `js/features/story/episodes.js` : ses 3 épisodes `EPISODES.<ile>` (racontés par les autres habitants, jamais par le guide).
- [ ] `js/features/music/music.js` : son thème `MUSIC_THEMES.<ile>`.
- [ ] Ses mini-jeux éventuels : voir [checklist-mini-jeu.md](./checklist-mini-jeu.md).

## 4. Brancher et vérifier
- [ ] `bun run sync` si des fichiers ont été ajoutés ; un nom exposé s'ajoute à l'`index.js` de sa slice.
- [ ] `bun run check` vert.
- [ ] Cache `sw.js` incrémenté, PRD et TODO à jour.
