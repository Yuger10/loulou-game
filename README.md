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
Le jeu est fait de modules ES (v54) : ouvert directement depuis le disque (`file://`), il ne démarre pas ; toujours passer par `npm start` ou l'adresse en ligne.

Sauvegarde dans `localStorage` (versionnée, migration automatique).
**Ne pas perdre la partie** : panneau des joueurs (bouton avec l'avatar, en haut à gauche) → 💾 *Sauvegarde* : enregistrer un fichier, copier un code de transfert pour un autre appareil, restaurer. Installer le jeu sur l'écran d'accueil évite que Safari efface la partie après 7 jours sans visite.
Le mode hors-ligne et le stockage protégé demandent `https://` : c'est le cas sur l'adresse GitHub Pages.

## Tester
```bash
npm install
npm test             # architecture (imports, couches, aucun cycle), vrais modules ES, test de fumée,
                     # squishies, saison 2, Jouets Doux, Bonbons, Musique, niveaux (conductor/niveaux.md), chaque mini-jeu joué jusqu'à la victoire,
                     # compagnons
npm run sync         # après avoir ajouté/déplacé un fichier : index.html et sw.js depuis js/slices.cjs
npm run sw           # (même chose) la liste des fichiers mis en cache hors-ligne
npm run inventaire   # ce que chaque fichier définit, exporte et importe (analyse du code)
```

## Structure : feature slices (v51) en modules ES natifs (v54)
Le code est rangé en **slices** sur 4 couches. Chaque fichier **importe** ce qu'il utilise. Entre slices, on n'importe que l'`index.js` de l'autre slice (son API publique), et seulement depuis sa couche ou une couche inférieure. Les slices sont rangées de bas en haut, sans aucun cycle ; pour prévenir une slice plus haute, on émet un événement (`js/shared/lib/events.js`). `npm test` vérifie tout ([ADR 0002](docs/adr/0002-modules-es-natifs.md)).
```
js/slices.cjs        manifeste (pour les outils) : couche, fichiers JS et CSS, ordre des slices, CSS_ORDER
js/app/              main.js (le seul script d'index.html : charge les slices) et init.js (démarrage)
js/features/         ce que l'enfant fait : minigame-engine/ (moteur) et minigames/<jeu>/, screen/ (en-tête des
                     fenêtres), hints/ (indices 💡), island/, map/, story/, bag/ (sac, album), market/, quests/,
                     profile/ (en-tête, accueil), wallet/, adaptive/ (niveau, progrès), party/ (chacun son tour,
                     course), players/, gains/, gifts/, wardrobe/, parents/, seasons/, backup/, music/,
                     companion-team/ (équipe et spécialités, v52), squishies/ (collection, chambre, rangement, v53)
js/entities/         les données du jeu : item/, world/ (îles et archipels), character/, difficulty/, words/, squishy/, season/,
                     game-state/ (état, sauvegarde, migrations), player/ (profils, partie en cours), companion/
js/shared/           sans rien connaître du jeu : lib/ (hasard, événements), ui/ (modale, vues, son, voix,
                     retours, icônes), styles/ (variables, design system, responsive)
<slice>/index.js     l'API publique de chaque slice
index.html           page du jeu (markup) ; balise du module et feuilles de style générées par `npm run sync`
manifest.json, sw.js, icon*.png|svg    PWA
test/                slices.test.js (architecture), modules.test.js (vrais modules), smoke.test.js,
                     squishies.test.js, saison2.test.js, jouets.test.js (le Coffre aux Jouets Doux),
                     bonbons.test.js (le Royaume des Bonbons), musique.test.js (l'Île de la Musique),
                     niveaux.test.js (le tableau des niveaux, le jeu et les specs),
                     games.test.js, companions.test.js (indices, équipe, spécialités),
                     tools/ (page de test regroupée par esbuild, analyse, synchronisation, déplacements)
conductor/           specs, plans, checklists « ajouter un mini-jeu » et « ajouter une île », niveaux.md (le tableau des niveaux)
docs/adr/            décisions d'architecture (ADR)
PRD-lagon-magique.md cadrage et historique des versions
TODO.md              feuille de route
lagon-magique.html   ancienne URL → redirige vers index.html
```
Chaque feature dépend des couches basses par des **points d'accroche** plutôt que l'inverse : `registerGame`, `registerView`, `onModalOpen` / `onModalClose`, `onProfileRefresh`, `onWrongFeedback`, `setAudioPrefsSource`, `setCompanionDressing`.
