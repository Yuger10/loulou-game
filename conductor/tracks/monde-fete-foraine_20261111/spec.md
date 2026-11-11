# Spec : 🎪 La Fête Foraine (Saison 3 « La Grande Expédition », île 3)

> Proposition retenue par la joueuse.
> Fait partie de la Saison 3 « La Grande Expédition ». Prérequis : l'archipel de sa saison existe (track `saison3-monde-nuages`). Suivre `conductor/checklist-ile.md` et `conductor/checklist-mini-jeu.md`.
> Spec écrite par Claude à partir des idées choisies : **à relire avec la joueuse**, en particulier les noms et les personnages.

> **Niveau d'ouverture : 86.** Règle et tableau de tous les niveaux : `conductor/niveaux.md`.

## 1. Vue d'ensemble
- **L'île :** `fete`, emoji 🎪, niveau d'ouverture **86**. Une fête foraine sur une île : grande roue, carrousel, stands de barbe à papa, guirlandes lumineuses. Thème de couleurs rouge cerise, crème et bleu nuit.
- **Deux nouveaux mini-jeux**, chacun avec une compétence encore absente ou nouvelle dans le jeu.
- **Son chapitre d'histoire** et ses 3 épisodes, sa série de squishies, sa musique.

## 2. Exigences fonctionnelles

### 2.1 L'île et ses personnages
- Scène dessinée en SVG et CSS (`features/island`), thème de couleurs `--world-*`, forme d'île propre, position sur la carte de sa saison (dans le cadre, sans chevauchement).
- **Personnages** (4, avec chacun un butin et 3 répliques) :
  - 🎩 **Gaston**, le forain : guide du chapitre
  - 🎠 **Paillette**, la cavalière du carrousel : présente « La caisse du manège »
  - 🍿 **Popcorn**, le vendeur de pop-corn : présente « La roue de la chance »
  - 🎈 **Hélia**, la vendeuse de ballons : offre des ballons
- **Objets** (environ 6) : ticket de manège, barbe à papa, pomme d'amour, ballon en forme d'étoile, peluche gagnée, lampion. Au moins 3 ne sont donnés par personne, pour que chaque personnage ait 2 objets préférés (cadeaux, v47). Il y a aussi **2 recettes de fusion** et **4 à 5 décorations**.
- **Série de squishies « Fête foraine »** (6 modèles : 4 communs, 1 rare, 1 ✨) : barbe à papa, ballon, pomme d'amour, ticket ; rare : Popcorn ; ✨ : cheval de manège doré. La boîte surprise de l'énigme du chapitre vient de cette série.
- **Musique :** un thème `MUSIC_THEMES.fete` (orgue de barbarie, 104 battements par minute).
- **Jeu favori de l'île :** le premier mini-jeu pour moins de 7 ans, le second pour 7 ans et plus.

### Mini-jeu « La caisse du manège » (`change`)
- Payer un tour de manège avec les bonnes pièces, puis rendre la monnaie. Le jeu s'appuie sur les pièces de « La monnaie magique », un cran plus loin.
- **Progression selon l'âge et le niveau du jeu :**
  - GS : reconnaître la pièce qui paie (prix 1, 2 ou 5)
  - CP : payer le prix exact jusqu'à 10
  - CE1 : rendre la monnaie jusqu'à 10
  - CE2 : rendre la monnaie jusqu'à 20, avec billets
- **Anti-devinette :** une erreur donne un indice parlé, puis relance un autre prix (relance annulable).
- **Indices du compagnon** (contrat de la v52) : 2 niveaux (la piste, le coup de pouce), jamais la réponse.
- **Niveau adaptatif** (v42) et compétence « calcul » dans l'espace parents.

### Mini-jeu « La roue de la chance » (`chance`)
- Une roue à secteurs de couleur : quelle couleur a le plus de chances de sortir ? Est-ce certain, possible ou impossible ? Une première approche du hasard.
- **Progression selon l'âge et le niveau du jeu :**
  - GS : la couleur qui a le plus de cases (2 couleurs)
  - CP : 3 couleurs
  - CE1 : certain, possible ou impossible
  - CE2 : comparer deux roues (« sur laquelle as-tu le plus de chances ? »)
- **Anti-devinette :** une erreur donne un indice parlé, puis relance une autre roue (relance annulable).
- **Indices du compagnon** (contrat de la v52) : 2 niveaux (la piste, le coup de pouce), jamais la réponse.
- **Niveau adaptatif** (v42) et compétence « logique » dans l'espace parents.


### Histoire : « Le morceau gagné à la loterie »
- Le troisième morceau de la carte est le gros lot du stand de Gaston. Pour le gagner, il faut aider tous les forains.
- **Chapitre** (format de `features/story`) : 3 phrases d'intro lues à voix haute par le guide, au moins 2 énigmes en images, un succès, une récompense (des pièces et une boîte surprise de la série de l'île).
- **3 épisodes** (après la 2ᵉ, la 4ᵉ et la 7ᵉ mission réussie sur l'île), racontés par les trois autres personnages, jamais par le guide.

## 3. Exigences non fonctionnelles
- Architecture en feature slices et modules ES : chaque mini-jeu dans `features/minigames/<jeu>/` avec son `index.js`, l'île dans les entités et features existantes ; déclaration dans `js/slices.cjs`, puis `npm run sync`.
- Mobile 360 px, tout est lu à voix haute, choix de réponses en images (sauf les mini-jeux de lecture), pas de punition.
- Les 2 mini-jeux respectent la checklist mini-jeu (difficulté, essais, minuteur, indices, compétence parents, tests de victoire dans `test/games.test.js`).
- Une partie de la version précédente se charge sans perte (migration si l'état change).

## 4. Critères d'acceptation
1. L'île s'ouvre au niveau 86 sur la carte de sa saison, avec l'écran « Nouvelle île » précédé de son chapitre.
2. Les 4 personnages, leurs butins et répliques, les objets, recettes, décorations, la scène, le thème, la musique et la série de squishies sont présents.
3. Les 2 mini-jeux suivent leurs paliers, relancent une autre question après une erreur, ont leurs 2 niveaux d'indice et leur niveau adaptatif, et sont joués jusqu'à la victoire à chaque palier par `test/games.test.js`.
4. Le chapitre et les 3 épisodes se jouent au bon moment ; la récompense est donnée une seule fois.
5. `npm test` passe, sans aucune erreur JS.

## 5. Hors périmètre
- Les autres îles de la saison.
- Changer les mini-jeux existants.
