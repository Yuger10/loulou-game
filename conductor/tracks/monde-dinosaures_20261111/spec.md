# Spec : 🦕 La Vallée des Dinosaures (Saison 3 « La Grande Expédition », île 2)

> Proposition retenue par la joueuse.
> Fait partie de la Saison 3 « La Grande Expédition ». Prérequis : l'archipel de sa saison existe (track `saison3-monde-nuages`). Suivre `conductor/checklist-ile.md` et `conductor/checklist-mini-jeu.md`.
> Spec écrite par Claude à partir des idées choisies : **à relire avec la joueuse**, en particulier les noms et les personnages.

## 1. Vue d'ensemble
- **L'île :** `dinos`, emoji 🦕, niveau d'ouverture **25**. Une vallée de fougères géantes, un volcan endormi au loin, des œufs dans des nids. Thème de couleurs vert fougère, ocre et orange.
- **Deux nouveaux mini-jeux**, chacun avec une compétence encore absente ou nouvelle dans le jeu.
- **Son chapitre d'histoire** et ses 3 épisodes, sa série de squishies, sa musique.

## 2. Exigences fonctionnelles

### 2.1 L'île et ses personnages
- Scène dessinée en SVG et CSS (`features/island`), thème de couleurs `--world-*`, forme d'île propre, position sur la carte de sa saison (dans le cadre, sans chevauchement).
- **Personnages** (4, avec chacun un butin et 3 répliques) :
  - 🦕 **Diplo**, le bébé diplodocus : guide du chapitre
  - 🦖 **Rexie**, la petite T. rex : présente « Le plus long »
  - 🥚 **Coquille**, la dino dans son œuf : présente « La frise du temps »
  - 🦏 **Tricé**, le tricératops : grand protecteur de la vallée
- **Objets** (environ 6) : œuf tacheté, fougère géante, empreinte fossile, dent de dino, pierre volcanique, os de dinosaure. Au moins 3 ne sont donnés par personne, pour que chaque personnage ait 2 objets préférés (cadeaux, v47). Il y a aussi **2 recettes de fusion** et **4 à 5 décorations**.
- **Série de squishies « Dinos »** (6 modèles : 4 communs, 1 rare, 1 ✨) : bébé tricératops, œuf tacheté, brachiosaure, stégosaure ; rare : Rexie ; ✨ : dino de cristal. La boîte surprise de l'énigme du chapitre vient de cette série.
- **Musique :** un thème `MUSIC_THEMES.dinos` (tambours lointains et marimba grave, 88 battements par minute).
- **Jeu favori de l'île :** le premier mini-jeu pour moins de 7 ans, le second pour 7 ans et plus.

### Mini-jeu « Le plus long » (`length`)
- Comparer et mesurer des longueurs : des queues de dinosaures, des os. On mesure en cases, puis avec une règle.
- **Progression selon l'âge et le niveau du jeu :**
  - GS : le plus long de deux
  - CP : ranger trois longueurs
  - CE1 : mesurer en cases (unité choisie)
  - CE2 : mesurer en centimètres avec une règle dessinée
- **Anti-devinette :** une erreur donne un indice parlé, puis relance d'autres longueurs (relance annulable).
- **Indices du compagnon** (contrat de la v52) : 2 niveaux (la piste, le coup de pouce), jamais la réponse.
- **Niveau adaptatif** (v42) et compétence « mesures » dans l'espace parents.

### Mini-jeu « La frise du temps » (`timeline`)
- Remettre dans l'ordre des images dans le temps : l'œuf, le bébé, le grand dinosaure ; une journée (matin, midi, soir) ; avant et après.
- **Progression selon l'âge et le niveau du jeu :**
  - GS : avant / après (2 images)
  - CP : 3 images
  - CE1 : 4 images, une journée
  - CE2 : une frise avec des repères (hier, aujourd'hui, demain ; il y a longtemps)
- **Anti-devinette :** une erreur donne un indice parlé, puis relance une autre histoire en images (relance annulable).
- **Indices du compagnon** (contrat de la v52) : 2 niveaux (la piste, le coup de pouce), jamais la réponse.
- **Niveau adaptatif** (v42) et compétence « mesures » dans l'espace parents.


### Histoire : « Le morceau dans le nid »
- Le deuxième morceau de la carte a été pris pour une feuille par une maman dinosaure, qui l'a mis dans son nid. Aider la vallée permet de le récupérer.
- **Chapitre** (format de `features/story`) : 3 phrases d'intro lues à voix haute par le guide, au moins 2 énigmes en images, un succès, une récompense (des pièces et une boîte surprise de la série de l'île).
- **3 épisodes** (après la 2ᵉ, la 4ᵉ et la 7ᵉ mission réussie sur l'île), racontés par les trois autres personnages, jamais par le guide.

## 3. Exigences non fonctionnelles
- Architecture en feature slices et modules ES : chaque mini-jeu dans `features/minigames/<jeu>/` avec son `index.js`, l'île dans les entités et features existantes ; déclaration dans `js/slices.cjs`, puis `npm run sync`.
- Mobile 360 px, tout est lu à voix haute, choix de réponses en images (sauf les mini-jeux de lecture), pas de punition.
- Les 2 mini-jeux respectent la checklist mini-jeu (difficulté, essais, minuteur, indices, compétence parents, tests de victoire dans `test/games.test.js`).
- Une partie de la version précédente se charge sans perte (migration si l'état change).

## 4. Critères d'acceptation
1. L'île s'ouvre au niveau 25 sur la carte de sa saison, avec l'écran « Nouvelle île » précédé de son chapitre.
2. Les 4 personnages, leurs butins et répliques, les objets, recettes, décorations, la scène, le thème, la musique et la série de squishies sont présents.
3. Les 2 mini-jeux suivent leurs paliers, relancent une autre question après une erreur, ont leurs 2 niveaux d'indice et leur niveau adaptatif, et sont joués jusqu'à la victoire à chaque palier par `test/games.test.js`.
4. Le chapitre et les 3 épisodes se jouent au bon moment ; la récompense est donnée une seule fois.
5. `npm test` passe, sans aucune erreur JS.

## 5. Hors périmètre
- Les autres îles de la saison.
- Changer les mini-jeux existants.
