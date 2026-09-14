# 🌊 Le Lagon Magique

Petit jeu mobile-first en un seul fichier HTML/CSS/JS pour une enfant de 6 ans : aider une sirène, une licorne et une danseuse via des mini-jeux, gagner des objets, les vendre / échanger / fusionner au marché, et décorer son lagon avec les pièces gagnées.

## Lancer
```bash
npm start            # serveur local sur http://localhost:8080/lagon-magique.html
```
Sur un téléphone du même Wi-Fi : `http://<ip-du-mac>:8080/lagon-magique.html`, puis « Ajouter à l'écran d'accueil » pour l'installer en plein écran (PWA, hors-ligne OK).

La sauvegarde utilise `localStorage` — elle persiste sur le même navigateur.

## Tester
```bash
npm install
npm test             # test de fumée jsdom sur tout le cycle de jeu
```

## Fichiers
- `lagon-magique.html` — le jeu complet
- `manifest.json`, `icon.svg`, `sw.js` — PWA
- `test/smoke.test.js` — test de fumée
- `PRD-lagon-magique.md` — cadrage v1 et évolutions v2/v3
