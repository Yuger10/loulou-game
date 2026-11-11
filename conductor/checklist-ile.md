# Checklist : ajouter une île (un monde)

Architecture en feature slices (v51), en modules ES natifs (v54). Exemple de référence : le Pays Squishy (`squishy`).
Remplacer `<ile>` par la clé de l'île (ex. `boites`).

## 1. Tests d'abord
- [ ] `test/smoke.test.js` : l'île s'ouvre au bon niveau, ses personnages et son jeu favori sont là. Les tests génériques (thème de couleurs, île dans le cadre de la carte, sans chevauchement) la couvrent automatiquement.

## 2. Entités
- [ ] `js/entities/world/worlds.js` : l'entrée `WORLDS.<ile>` :
  - nom, emoji, niveau, `diff`, sous-titre ;
  - **`saison`** : son archipel (1 = Lagon Magique, 2 = Ciel des Rêves, v55) ;
  - position `map:{x,y}` sur la carte de son archipel, dans le cadre 14–86 % / 15–85 %, sans chevaucher les autres îles du même archipel ;
  - forme, couleurs ;
  - `game:` favori éventuel, un nom ou une fonction de l'âge (`(age)=> …`) ;
  - textes d'intro et de scène vide.
- [ ] `js/entities/character/characters.js` : ses 4 personnages (`world:'<ile>'`, butin `loot`, 3 répliques), et leur dessin dans `js/entities/character/characters-art.js` (`CHAR_ART`).
- [ ] `js/entities/item/items.js` : ses objets (`world:'<ile>'`), au moins 3 qui ne sont donnés par personne (pour les 2 objets préférés de chaque personnage, `favoritesOf`), ses recettes de fusion et ses décorations.
- [ ] `js/entities/difficulty/difficulty.js` : son palier dans `DIFFICULTY_TIERS`.

## 3. Features
- [ ] `js/shared/styles/design-system-v21.css` (ou une feuille de la slice île) : le thème `body[data-world="<ile>"]{--world-sky:…; --world-sea:…}`.
- [ ] `js/features/island/island.js` : son paysage dans `ISLE_SCENERY.<ile>`.
- [ ] `js/features/story/story.js` : son chapitre `STORY.<ile>` (guide, 3 phrases d'intro, au moins 2 énigmes en emojis avec un `tip`, succès, récompense). Une île de la saison 2 montre Grisou, qui reprend des couleurs quand son énigme est résolue.
- [ ] `js/entities/squishy/squishies.js` : la série de squishies gagnée par son énigme, dans `SQUISHY_ISLAND_SERIES.<ile>` (et sa propre série dans `SQUISHY_SERIES` / `SQUISHIES` si le monde en a une, v53).
- [ ] `js/features/story/episodes.js` : ses 3 épisodes `EPISODES.<ile>` (racontés par les autres habitants, jamais par le guide).
- [ ] `js/features/music/music.js` : son thème `MUSIC_THEMES.<ile>`.
- [ ] Ses mini-jeux éventuels : voir [checklist-mini-jeu.md](./checklist-mini-jeu.md).

## 4. Brancher et vérifier
- [ ] `npm run sync` si des fichiers ont été ajoutés ; un nom exposé s'ajoute à l'`index.js` de sa slice.
- [ ] `npm test` vert.
- [ ] Cache `sw.js` incrémenté, PRD et TODO à jour.
