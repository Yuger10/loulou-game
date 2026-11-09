# Tech Stack

## Langages et runtime
- **HTML5 / CSS3 / JavaScript (ES2020)** sans framework ni bundler. Les scripts sont chargés dans l'ordre par `index.html` et partagent la portée globale (fonctions et constantes globales, `typeof fn==='function'` pour les dépendances optionnelles).
- **Aucune dépendance d'exécution.** Les dessins sont en SVG et en emojis, les sons en Web Audio, la voix passe par `speechSynthesis`.

## Plateforme
- **PWA :** `manifest.json` et `sw.js`, avec un cache versionné `lagon-vNN`. Chaque nouveau fichier JS doit être ajouté à `FILES`, et le cache doit être incrémenté à chaque version.
- Servi en local (`npm start` → `python3 -m http.server 8080`). En ligne sur GitHub Pages en `https://` (https://yuger10.github.io/loulou-game/), déployé depuis `main`.

## Données
- **`localStorage`**, une sauvegarde par profil (`profileSaveKey(id)`) et la liste des profils (`PROFILES_KEY`).
- **Sauvegarde versionnée :** `SAVE_VERSION` dans `js/state.js`. Toute nouvelle donnée d'état passe par `DEFAULT_STATE`, l'objet `state` et une étape `migrate()` (`if(v < N)`).
- **Sauvegarde et restauration :** `js/backup.js` (fichier, code de transfert `LAGON1:`). La restauration repasse par `load()`, donc par `migrate()`.
- **Contenu de jeu** déclaratif dans `js/data.js` (`ITEMS`, `CHARACTERS`, `WORLDS`, décorations, recettes) et `js/story.js` (`STORY`).

## Tests
- **`npm test`** → `test/smoke.test.js` : un test de fumée jsdom qui charge le jeu complet et vérifie les parcours (cartes, mini-jeux, sauvegarde, anti-devinette, CSS équilibré, aucune erreur JS).
- La seule dépendance de développement est `jsdom`.

## Outillage
- Git et GitHub (`gh`) : une branche par version, une PR, un merge sur `main`.
