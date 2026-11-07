# 🌊 Le Lagon Magique

Jeu mobile-first en HTML/CSS/JS (sans dépendance) pour une enfant de 6 ans : aider une sirène, une licorne et une danseuse via 6 mini-jeux, gagner des objets, les vendre / échanger / fusionner au marché, décorer son lagon et compléter son album.

## Lancer
```bash
npm start            # http://localhost:8080/index.html
```
Sur un téléphone du même Wi-Fi : `http://<ip-du-mac>:8080/`, puis « Ajouter à l'écran d'accueil » pour l'installer en plein écran (PWA, hors-ligne OK).

Sauvegarde dans `localStorage` (versionnée, migration automatique).
**Ne pas perdre la partie** : panneau des joueurs (bouton avec le prénom, en haut) → 💾 *Sauvegarde* : enregistrer un fichier, copier un code de transfert pour un autre appareil, restaurer. Installer le jeu sur l'écran d'accueil évite que Safari efface la partie après 7 jours sans visite.
Pour le mode hors-ligne et le stockage protégé, le jeu doit être servi en `https://` (par exemple GitHub Pages) : en `http://` depuis le Mac, ces fonctions sont désactivées par le navigateur.

## Tester
```bash
npm install
npm test             # test de fumée jsdom sur tout le cycle de jeu
```

## Structure
```
index.html           page du jeu (markup uniquement)
styles.css           tout le style
js/data.js           objets, recettes, décorations, personnages
js/state.js          état, sauvegarde/migration, profil, quêtes du jour, album
js/ui.js             utilitaires, sons, voix, confettis, navigation par vues, île, dialogues
js/map.js            carte des îles, bateau, navigation entre mondes
js/players.js        profils multijoueurs, mode chacun son tour
js/race.js           mode course et difficulté adaptée à l'âge
js/profiles-ui.js    écrans joueurs, modes de jeu, choix du mini-jeu
js/minigames.js      les 6 mini-jeux
js/market.js         sac + marché (vendre / échanger / acheter / fusionner)
js/init.js           démarrage, écran titre, service worker
manifest.json, sw.js, icon*.png|svg    PWA
test/smoke.test.js   test de fumée
PRD-lagon-magique.md cadrage et historique des versions
TODO.md              feuille de route
lagon-magique.html   ancienne URL → redirige vers index.html
```
