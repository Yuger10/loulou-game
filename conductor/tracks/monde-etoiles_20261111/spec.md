# Spec : 🚀 La Station des Étoiles (Saison 3 « La Grande Expédition », île 5)

> Proposition retenue par la joueuse. **Grand final de la saison 3.**
> Fait partie de la Saison 3 « La Grande Expédition ». Prérequis : l'archipel de sa saison existe (track `saison3-monde-nuages`). Suivre `conductor/checklist-ile.md` et `conductor/checklist-mini-jeu.md`.
> Spec écrite par Claude à partir des idées choisies : **à relire avec la joueuse**, en particulier les noms et les personnages.

## 1. Vue d'ensemble
- **L'île :** `etoiles`, emoji 🚀, niveau d'ouverture **40**. Une station spatiale sur une île flottante : fusée, antennes, dômes de verre, ciel étoilé. Thème de couleurs bleu nuit, argent et violet.
- **Deux nouveaux mini-jeux**, chacun avec une compétence encore absente ou nouvelle dans le jeu.
- **Son chapitre d'histoire** et ses 3 épisodes, sa série de squishies, sa musique.

## 2. Exigences fonctionnelles

### 2.1 L'île et ses personnages
- Scène dessinée en SVG et CSS (`features/island`), thème de couleurs `--world-*`, forme d'île propre, position sur la carte de sa saison (dans le cadre, sans chevauchement).
- **Personnages** (4, avec chacun un butin et 3 répliques) :
  - 🤖 **Bip**, le robot de la station : guide du chapitre
  - 👩‍🚀 **Astra**, l'astronaute : présente « Programme le robot »
  - 👽 **Glim**, le petit extraterrestre : présente « Le code secret »
  - 🌙 **Lunette**, l'amie de la Lune : veille sur les étoiles
- **Objets** (environ 6) : boulon d'argent, casque d'astronaute, poussière de comète, antenne, carte des étoiles, pile de robot. Au moins 3 ne sont donnés par personne, pour que chaque personnage ait 2 objets préférés (cadeaux, v47). Il y a aussi **2 recettes de fusion** et **4 à 5 décorations**.
- **Série de squishies « Espace »** (6 modèles : 4 communs, 1 rare, 1 ✨) : fusée, planète à anneaux, comète, petit robot ; rare : Glim ; ✨ : étoile filante. La boîte surprise de l'énigme du chapitre vient de cette série.
- **Musique :** un thème `MUSIC_THEMES.etoiles` (synthé doux et carillons, 72 battements par minute).
- **Jeu favori de l'île :** le premier mini-jeu pour moins de 7 ans, le second pour 7 ans et plus.

### Mini-jeu « Programme le robot » (`coding`)
- Une grille : Bip doit aller jusqu'à l'étoile. On aligne des flèches (↑ → ↓ ←), puis on appuie sur « Go » et le robot suit le programme. C'est le repérage et l'algorithmique sans écran compliqué.
- **Progression selon l'âge et le niveau du jeu :**
  - GS : 2 flèches, chemin droit
  - CP : 3 à 4 flèches, un virage
  - CE1 : 6 flèches, un obstacle
  - CE2 : des boucles (« répéter 3 fois → ») et deux obstacles
- **Anti-devinette :** une erreur donne un indice parlé, puis relance une autre grille (relance annulable).
- **Indices du compagnon** (contrat de la v52) : 2 niveaux (la piste, le coup de pouce), jamais la réponse.
- **Niveau adaptatif** (v42) et compétence « formes » dans l'espace parents.

### Mini-jeu « Le code secret » (`code`)
- Déchiffrer un message avec une table de correspondance (un symbole donne une couleur ou une lettre), ou trouver la règle d'un code.
- **Progression selon l'âge et le niveau du jeu :**
  - GS : symboles vers couleurs (3 symboles)
  - CP : symboles vers images, un mot de 3 images
  - CE1 : symboles vers lettres, un mot de 3 lettres
  - CE2 : un mot de 5 lettres et une règle à trouver (chaque lettre est remplacée par la suivante)
- **Anti-devinette :** une erreur donne un indice parlé, puis relance un autre message (relance annulable).
- **Indices du compagnon** (contrat de la v52) : 2 niveaux (la piste, le coup de pouce), jamais la réponse.
- **Niveau adaptatif** (v42) et compétence « logique » dans l'espace parents.


### Histoire : « Le voyage dans les étoiles »
- Le dernier morceau de la carte est dans le tableau de bord de la fusée. Une fois la carte complète, Zap découvre que le trésor est… un voyage dans les étoiles pour toute l'équipe.
- **Chapitre** (format de `features/story`) : 3 phrases d'intro lues à voix haute par le guide, au moins 2 énigmes en images, un succès, une récompense (des pièces et une boîte surprise de la série de l'île).
- **3 épisodes** (après la 2ᵉ, la 4ᵉ et la 7ᵉ mission réussie sur l'île), racontés par les trois autres personnages, jamais par le guide.

### Grand final de la saison 3
- Après la résolution du chapitre : la carte de Zap est complète. Scène plein écran : la fusée décolle, avec toute l'équipe des compagnons, pour un voyage dans les étoiles (animation, voix, musique du final).
- **Récompenses**, une seule fois par profil :
  - une **tenue d'astronaute** dans « Mon look » (pour l'avatar et pour Zap) ;
  - le squishy unique **✨ Zap l'astronaute** (jamais dans les boîtes, case « Trésors » de la chambre) ;
  - la **fusée** 🚀 remplace l'avion en papier sur la carte de la saison 3.
- Le journal 📖 affiche « La Grande Expédition ✅ ». On peut revoir le final sans regagner les récompenses.

## 3. Exigences non fonctionnelles
- Architecture en feature slices et modules ES : chaque mini-jeu dans `features/minigames/<jeu>/` avec son `index.js`, l'île dans les entités et features existantes ; déclaration dans `js/slices.cjs`, puis `npm run sync`.
- Mobile 360 px, tout est lu à voix haute, choix de réponses en images (sauf les mini-jeux de lecture), pas de punition.
- Les 2 mini-jeux respectent la checklist mini-jeu (difficulté, essais, minuteur, indices, compétence parents, tests de victoire dans `test/games.test.js`).
- Une partie de la version précédente se charge sans perte (migration si l'état change).

## 4. Critères d'acceptation
1. L'île s'ouvre au niveau 40 sur la carte de sa saison, avec l'écran « Nouvelle île » précédé de son chapitre.
2. Les 4 personnages, leurs butins et répliques, les objets, recettes, décorations, la scène, le thème, la musique et la série de squishies sont présents.
3. Les 2 mini-jeux suivent leurs paliers, relancent une autre question après une erreur, ont leurs 2 niveaux d'indice et leur niveau adaptatif, et sont joués jusqu'à la victoire à chaque palier par `test/games.test.js`.
4. Le chapitre et les 3 épisodes se jouent au bon moment ; la récompense est donnée une seule fois.
5. `npm test` passe, sans aucune erreur JS.

## 5. Hors périmètre
- Les autres îles de la saison.
- Changer les mini-jeux existants.
