# Spec : 🧸 Le Coffre aux Jouets Doux (Saison 2 « Le Ciel des Rêves », île 2)

> Idée de la joueuse : « un monde de jouets qui ressemblent à des squishies ».
> Fait partie de la Saison 2 « Le Ciel des Rêves ». Prérequis : l'archipel de sa saison existe (track `saison2-monde-boites`). Suivre `conductor/checklist-ile.md` et `conductor/checklist-mini-jeu.md`.
> Spec écrite par Claude à partir des idées choisies : **à relire avec la joueuse**, en particulier les noms et les personnages.

> **Niveau d'ouverture : 38.** Règle et tableau de tous les niveaux : `conductor/niveaux.md`.

## 1. Vue d'ensemble
- **L'île :** `jouets`, emoji 🧸, niveau d'ouverture **38**. Un grand coffre à jouets ouvert : peluches en guimauve, jouets mochi tout ronds, étagères de bois pastel. Thème de couleurs crème, rose et menthe.
- **Deux nouveaux mini-jeux**, chacun avec une compétence encore absente ou nouvelle dans le jeu.
- **Son chapitre d'histoire** et ses 3 épisodes, sa série de squishies, sa musique.

## 2. Exigences fonctionnelles

### 2.1 L'île et ses personnages
- Scène dessinée en SVG et CSS (`features/island`), thème de couleurs `--world-*`, forme d'île propre, position sur la carte de sa saison (dans le cadre, sans chevauchement).
- **Personnages** (4, avec chacun un butin et 3 répliques) :
  - 🧸 **Nougat**, l'ourson en guimauve : guide du chapitre, gardien du coffre
  - 🐰 **Cocotte**, la lapine mochi : range les étagères, présente « L'étagère magique »
  - 🐙 **Gloups**, le poulpe tout mou : fait des paquets avec ses 8 bras, présente « Les paquets de jouets »
  - 🐸 **Rainette**, la grenouille squishy : saute partout, cache des jouets
- **Objets** (environ 6) : ruban de peluche, bouton de nounours, grelot, ressort doux, étoile en feutrine, mini-mochi. Au moins 3 ne sont donnés par personne, pour que chaque personnage ait 2 objets préférés (cadeaux, v47). Il y a aussi **2 recettes de fusion** et **4 à 5 décorations**.
- **Série de squishies « Jouets doux »** (6 modèles : 4 communs, 1 rare, 1 ✨) : ourson guimauve, lapin mochi, poulpe tout mou, grenouille sauteuse ; rare : Nougat ; ✨ : ourson arc-en-ciel. La boîte surprise de l'énigme du chapitre vient de cette série.
- **Musique :** un thème `MUSIC_THEMES.jouets` (boîte à musique (célesta), 80 battements par minute, très douce).
- **Jeu favori de l'île :** le premier mini-jeu pour moins de 7 ans, le second pour 7 ans et plus.

### Mini-jeu « Les paquets de jouets » (`packs`)
- Les jouets sont rangés par paquets de 2, 5 ou 10. Combien y en a-t-il en tout ? On choisit parmi 3 réponses. C'est le début de la multiplication : compter par groupes plutôt qu'un par un.
- **Progression selon l'âge et le niveau du jeu :**
  - GS : paquets de 2, jusqu'à 3 paquets, on peut compter un par un
  - CP : paquets de 2 et de 5, jusqu'à 4 paquets
  - CE1 : paquets de 2, 5 et 10, jusqu'à 5 paquets, plus un jouet isolé
  - CE2 : « 4 paquets de 5 » écrit sous l'image, l'écriture 4 × 5 apparaît en indice
- **Anti-devinette :** une erreur donne un indice parlé, puis relance une autre collection de paquets (relance annulable).
- **Indices du compagnon** (contrat de la v52) : 2 niveaux (la piste, le coup de pouce), jamais la réponse.
- **Niveau adaptatif** (v42) et compétence « nombres » dans l'espace parents.

### Mini-jeu « L'étagère magique » (`shelf`)
- Une étagère en tableau à double entrée : une couleur par ligne, une forme par colonne. On pose chaque jouet dans la bonne case. C'est le repérage et la lecture de tableau.
- **Progression selon l'âge et le niveau du jeu :**
  - GS : 2 × 2 cases, un seul jouet à placer
  - CP : 3 × 3, deux jouets
  - CE1 : 3 × 3, trois jouets, et « quel jouet est dans cette case ? »
  - CE2 : 4 × 4, coordonnées dites à voix haute (« ligne rose, colonne étoile »)
- **Anti-devinette :** une erreur donne un indice parlé, puis relance une autre étagère (relance annulable).
- **Indices du compagnon** (contrat de la v52) : 2 niveaux (la piste, le coup de pouce), jamais la réponse.
- **Niveau adaptatif** (v42) et compétence « formes » dans l'espace parents.


### Histoire : « Les jouets qui ne jouent plus »
- Grisou a rangé le rêve de « jouer ensemble » tout au fond du coffre, sous des piles de jouets endormis. Réveiller les jouets libère le rêve, et Grisou gagne un peu de rose.
- **Chapitre** (format de `features/story`) : 3 phrases d'intro lues à voix haute par le guide, au moins 2 énigmes en images, un succès, une récompense (des pièces et une boîte surprise de la série de l'île).
- **3 épisodes** (après la 2ᵉ, la 4ᵉ et la 7ᵉ mission réussie sur l'île), racontés par les trois autres personnages, jamais par le guide.

## 3. Exigences non fonctionnelles
- Architecture en feature slices et modules ES : chaque mini-jeu dans `features/minigames/<jeu>/` avec son `index.js`, l'île dans les entités et features existantes ; déclaration dans `js/slices.cjs`, puis `npm run sync`.
- Mobile 360 px, tout est lu à voix haute, choix de réponses en images (sauf les mini-jeux de lecture), pas de punition.
- Les 2 mini-jeux respectent la checklist mini-jeu (difficulté, essais, minuteur, indices, compétence parents, tests de victoire dans `test/games.test.js`).
- Une partie de la version précédente se charge sans perte (migration si l'état change).

## 4. Critères d'acceptation
1. L'île s'ouvre au niveau 38 sur la carte de sa saison, avec l'écran « Nouvelle île » précédé de son chapitre.
2. Les 4 personnages, leurs butins et répliques, les objets, recettes, décorations, la scène, le thème, la musique et la série de squishies sont présents.
3. Les 2 mini-jeux suivent leurs paliers, relancent une autre question après une erreur, ont leurs 2 niveaux d'indice et leur niveau adaptatif, et sont joués jusqu'à la victoire à chaque palier par `test/games.test.js`.
4. Le chapitre et les 3 épisodes se jouent au bon moment ; la récompense est donnée une seule fois.
5. `npm test` passe, sans aucune erreur JS.

## 5. Hors périmètre
- Les autres îles de la saison.
- Changer les mini-jeux existants.
