# Tech Stack

## Langages et runtime
- **HTML5 / CSS3 / JavaScript (ES2020)** sans framework ni bundler. Les scripts sont chargés dans l'ordre par `index.html` et partagent la portée globale (fonctions et constantes globales, `typeof fn==='function'` pour les dépendances optionnelles).
- **Aucune dépendance d'exécution.** Les dessins sont en SVG et en emojis, les sons en Web Audio, la voix passe par `speechSynthesis`.

## Architecture : feature slices (v51)
> Décision et options écartées : [ADR 0001](../docs/adr/0001-architecture-feature-slices.md).

- **4 couches**, de la plus haute à la plus basse : `app` → `features` → `entities` → `shared`, dans `js/<couche>/<slice>/`. Le CSS d'une slice est rangé à côté de son JS.
- **Manifeste `js/slices.js`** : couche, fichiers JS et CSS dans l'ordre de chargement, et **API publique** de chaque slice. `CSS_ORDER` fixe l'ordre global de la cascade. `index.html` et `sw.js` en sont générés (`npm run sync`).
- **Règles vérifiées par `test/slices.test.js`** : une couche n'utilise que sa couche ou les couches inférieures ; entre slices, seulement l'API publique ; une seule définition par nom global ; manifeste, fichiers, `index.html` et `sw.js` cohérents.
- **Dépendances vers le haut interdites, remplacées par des points d'accroche** fournis par la couche basse : `registerGame` (moteur de mini-jeux), `registerView`, `onModalOpen` / `onModalClose`, `onWrongFeedback`, `onProfileRefresh`, `setAudioPrefsSource`, `setCompanionDressing`.
- **Pas de garde `typeof fn==='function'`** pour une fonction du jeu (tout est toujours chargé). Seules les capacités du navigateur sont testées ainsi.
- Toujours des **scripts classiques**, en portée globale. L'étape B (v54) passera aux modules ES natifs.

## Plateforme
- **PWA :** `manifest.json` et `sw.js`, avec un cache versionné `lagon-vNN`. La liste `FILES` est générée depuis le manifeste (`npm run sync`), et le cache doit être incrémenté à chaque version.
- Servi en local (`npm start` → `python3 -m http.server 8080`). En ligne sur GitHub Pages en `https://` (https://yuger10.github.io/loulou-game/), déployé depuis `main`.

## Données
- **`localStorage`**, une sauvegarde par profil (`profileSaveKey(id)`) et la liste des profils (`PROFILES_KEY`).
- **Sauvegarde versionnée :** `SAVE_VERSION` dans `js/entities/game-state/state.js`. Toute nouvelle donnée d'état passe par `DEFAULT_STATE`, l'objet `state` et une étape `migrate()` (`if(v < N)`).
- **Sauvegarde et restauration :** `js/features/backup/backup.js` (fichier, code de transfert `LAGON1:`). La restauration repasse par `load()`, donc par `migrate()`.
- **Contenu de jeu** déclaratif dans les entités (`js/entities/item/items.js`, `character/characters.js`, `world/worlds.js`) et dans `js/features/story/` (`STORY`, `EPISODES`).

## Tests
- **`npm test`** → `test/slices.test.js` (architecture et frontières), `test/smoke.test.js` (test de fumée jsdom : parcours, sauvegarde, anti-devinette, CSS équilibré, aucune erreur JS) `test/games.test.js` (chaque mini-jeu joué jusqu'à la victoire) et `test/companions.test.js` (v52 : indices de chaque mini-jeu, équipe, spécialités). Les pages de test sont construites depuis le manifeste (`test/tools/page.js`).
- Dépendances de développement : `jsdom` (exécuter le jeu), `acorn` et `acorn-walk` (analyser le code : inventaire des noms globaux et test de frontières des slices, v51). Aucune n'est chargée par le jeu.
  - *Note du 2026-11-09 :* ajout d'`acorn` pour la track `refactor-feature-slices` : un analyseur sans dépendance, plus fiable que des expressions régulières pour distinguer le code des textes.

## Outillage
- Git et GitHub (`gh`) : une branche par version, une PR, un merge sur `main`.
