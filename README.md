# 🌊 Le Lagon Magique

Jeu mobile-first en HTML/CSS/JS (sans dépendance) pour une enfant de 6 ans : aider une sirène, une licorne et une danseuse via 6 mini-jeux, gagner des objets, les vendre / échanger / fusionner au marché, décorer son lagon et compléter son album.

## Jouer
**En ligne : https://yuger10.github.io/loulou-game/** (GitHub Pages, branche `main` : chaque merge est en ligne une minute après).
Sur iPhone / iPad : ouvrir l'adresse dans Safari → Partager → « Sur l'écran d'accueil ». Le jeu marche alors hors ligne et la partie est protégée.

Changer d'adresse (ex. du Mac vers GitHub Pages) ne transporte pas la partie : sur l'ancienne adresse, panneau des joueurs → 💾 *Sauvegarde* → copier le code de transfert ; sur la nouvelle, *Restaurer* → coller le code.

## Lancer en local
```bash
npm start            # http://localhost:8080/index.html
```
Sur un téléphone du même Wi-Fi : `http://<ip-du-mac>:8080/` (en `http://`, pas de hors-ligne ni de stockage protégé : préférer l'adresse en ligne).

Sauvegarde dans `localStorage` (versionnée, migration automatique).
**Ne pas perdre la partie** : panneau des joueurs (bouton avec l'avatar, en haut à gauche) → 💾 *Sauvegarde* : enregistrer un fichier, copier un code de transfert pour un autre appareil, restaurer. Installer le jeu sur l'écran d'accueil évite que Safari efface la partie après 7 jours sans visite.
Le mode hors-ligne et le stockage protégé demandent `https://` : c'est le cas sur l'adresse GitHub Pages.

## Tester
```bash
npm install
npm test             # architecture (slices, frontières) + test de fumée + chaque mini-jeu joué jusqu'à la victoire
npm run sync         # après avoir ajouté/déplacé un fichier : index.html et sw.js depuis js/slices.js
npm run api          # recalcule l'API publique des slices (quand on expose volontairement un nom)
npm run inventaire   # qui définit quoi, qui utilise quoi (analyse du code)
```

## Structure : feature slices (v51)
Le code est rangé en **slices** sur 4 couches. Un fichier n'utilise que sa couche ou les couches inférieures, et seulement l'**API publique** des autres slices. `npm test` le vérifie.
```
js/slices.js         manifeste : couche, fichiers JS et CSS (ordre de chargement), API publique de chaque slice
js/app/              démarrage (init.js)
js/features/         ce que l'enfant fait : minigame-engine/ (moteur) et minigames/<jeu>/, island/, map/,
                     story/, bag/ (sac, album), market/, quests/, profile/ (en-tête, accueil), wallet/,
                     adaptive/, party/ (chacun son tour, course), players/, gains/, gifts/, wardrobe/,
                     parents/, seasons/, backup/, music/, companion-team/ (équipe et spécialités, v52)
js/entities/         les données du jeu : item/, world/, character/, difficulty/, words/, game-state/
                     (état, sauvegarde, migrations), player/ (profils, partie en cours), companion/
js/shared/           sans rien connaître du jeu : lib/ (hasard), ui/ (modale, vues, son, voix, retours, icônes),
                     styles/ (variables, design system, responsive)
index.html           page du jeu (markup) ; scripts et feuilles de style générés par `npm run sync`
manifest.json, sw.js, icon*.png|svg    PWA
test/                slices.test.js (architecture), smoke.test.js, games.test.js, companions.test.js
                     (indices, équipe, spécialités), tools/ (analyse, déplacements)
conductor/           specs, plans, checklists « ajouter un mini-jeu » et « ajouter une île »
docs/adr/            décisions d'architecture (ADR)
PRD-lagon-magique.md cadrage et historique des versions
TODO.md              feuille de route
lagon-magique.html   ancienne URL → redirige vers index.html
```
Chaque feature dépend des couches basses par des **points d'accroche** plutôt que l'inverse : `registerGame`, `registerView`, `onModalOpen` / `onModalClose`, `onProfileRefresh`, `onWrongFeedback`, `setAudioPrefsSource`, `setCompanionDressing`.
