# Checklist : ajouter une île (un monde)

Architecture en feature slices (v51). Exemple de référence : le Pays Squishy (`squishy`).
Remplacer `<ile>` par la clé de l'île (ex. `boites`).

## 1. Tests d'abord
- [ ] `test/smoke.test.js` : l'île s'ouvre au bon niveau, ses personnages et son jeu favori sont là. Les tests génériques (thème de couleurs, île dans le cadre de la carte, sans chevauchement) la couvrent automatiquement.

## 2. Entités
- [ ] `js/entities/world/worlds.js` : l'entrée `WORLDS.<ile>` (nom, emoji, niveau, `diff`, sous-titre, position `map:{x,y}` dans le cadre 14–86 % / 15–85 %, forme, couleurs, `game:` favori éventuel, textes d'intro et de scène vide).
- [ ] `js/entities/character/characters.js` : ses 4 personnages (`world:'<ile>'`, butin `loot`, 3 répliques), et leur dessin dans `js/entities/character/characters-art.js` (`CHAR_ART`).
- [ ] `js/entities/item/items.js` : ses objets (`world:'<ile>'`), au moins 3 qui ne sont donnés par personne (pour les 2 objets préférés de chaque personnage, `favoritesOf`), ses recettes de fusion et ses décorations.
- [ ] `js/entities/difficulty/difficulty.js` : son palier dans `DIFFICULTY_TIERS`.

## 3. Features
- [ ] `js/shared/styles/design-system-v21.css` (ou une feuille de la slice île) : le thème `body[data-world="<ile>"]{--world-sky:…; --world-sea:…}`.
- [ ] `js/features/island/island.js` : son paysage dans `ISLE_SCENERY.<ile>`.
- [ ] `js/features/story/story.js` : son chapitre `STORY.<ile>` (guide, 3 phrases d'intro, au moins 2 énigmes en emojis, succès, récompense).
- [ ] `js/features/story/episodes.js` : ses 3 épisodes `EPISODES.<ile>` (racontés par les autres habitants, jamais par le guide).
- [ ] `js/features/music/music.js` : son thème `MUSIC_THEMES.<ile>`.
- [ ] Ses mini-jeux éventuels : voir [checklist-mini-jeu.md](./checklist-mini-jeu.md).

## 4. Brancher et vérifier
- [ ] `npm run sync` si des fichiers ont été ajoutés, `npm run api` si un nom est exposé.
- [ ] `npm test` vert.
- [ ] Cache `sw.js` incrémenté, PRD et TODO à jour.
