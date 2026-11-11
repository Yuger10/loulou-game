# Spec : 🎵 L'Île de la Musique (Saison 2 « Le Ciel des Rêves », île 4)

> Proposition retenue par la joueuse. S'appuie sur la track « sons » (moteur audio, marimba).
> Fait partie de la Saison 2 « Le Ciel des Rêves ». Prérequis : l'archipel de sa saison existe (track `saison2-monde-boites`). Suivre `conductor/checklist-ile.md` et `conductor/checklist-mini-jeu.md`.
> Spec écrite par Claude à partir des idées choisies : **à relire avec la joueuse**, en particulier les noms et les personnages.

## 1. Vue d'ensemble
- **L'île :** `musique`, emoji 🎵, niveau d'ouverture **23**. Une île en forme de piano : touches-ponts, arbres-flûtes, cascades de notes. Thème de couleurs nuit, or et turquoise.
- **Deux nouveaux mini-jeux**, chacun avec une compétence encore absente ou nouvelle dans le jeu.
- **Son chapitre d'histoire** et ses 3 épisodes, sa série de squishies, sa musique.

## 2. Exigences fonctionnelles

### 2.1 L'île et ses personnages
- Scène dessinée en SVG et CSS (`features/island`), thème de couleurs `--world-*`, forme d'île propre, position sur la carte de sa saison (dans le cadre, sans chevauchement).
- **Personnages** (4, avec chacun un butin et 3 répliques) :
  - 🎻 **Viola**, la violoniste : guide du chapitre, cheffe d'orchestre
  - 🥁 **Boumbo**, le petit tambour : présente « Le rythme magique »
  - 🪈 **Flûtine**, la flûte enchantée : présente « Grave ou aigu ? »
  - 🦜 **Piccolo**, le perroquet chanteur : répète tout ce qu'il entend
- **Objets** (environ 6) : baguette de chef, partition, clé de sol, grelot doré, corde de violon, anche de flûte. Au moins 3 ne sont donnés par personne, pour que chaque personnage ait 2 objets préférés (cadeaux, v47). Il y a aussi **2 recettes de fusion** et **4 à 5 décorations**.
- **Série de squishies « Instruments »** (6 modèles : 4 communs, 1 rare, 1 ✨) : tambour mochi, maracas, xylophone, trompette ; rare : Boumbo ; ✨ : lyre dorée. La boîte surprise de l'énigme du chapitre vient de cette série.
- **Musique :** un thème `MUSIC_THEMES.musique` (thème joyeux au marimba (moteur de la track sons), 100 battements par minute).
- **Jeu favori de l'île :** le premier mini-jeu pour moins de 7 ans, le second pour 7 ans et plus.

### Mini-jeu « Le rythme magique » (`rhythm`)
- Boumbo frappe un rythme (sons courts et longs, silences) ; l'enfant le reproduit en touchant le tambour. Le rythme est aussi montré en images (gros points, longs traits), pour pouvoir jouer sans le son.
- **Progression selon l'âge et le niveau du jeu :**
  - GS : 3 frappes régulières
  - CP : 4 frappes, courtes et longues
  - CE1 : 5 frappes avec un silence
  - CE2 : 6 frappes, deux silences, lecture d'un rythme écrit avant de l'entendre
- **Anti-devinette :** une erreur donne un indice parlé, puis relance un autre rythme (relance annulable).
- **Indices du compagnon** (contrat de la v52) : 2 niveaux (la piste, le coup de pouce), jamais la réponse.
- **Niveau adaptatif** (v42) et compétence « logique » dans l'espace parents.

### Mini-jeu « Grave ou aigu ? » (`pitch`)
- Écouter deux ou plusieurs notes et dire laquelle est la plus aiguë, ou les ranger du grave à l'aigu. Chaque note est aussi une cloche plus ou moins grande : le jeu reste faisable sans le son.
- **Progression selon l'âge et le niveau du jeu :**
  - GS : 2 notes très éloignées, « laquelle est la plus aiguë ? »
  - CP : 3 notes à ranger
  - CE1 : 4 notes plus proches
  - CE2 : 5 notes, et reconnaître une petite mélodie qui monte ou qui descend
- **Anti-devinette :** une erreur donne un indice parlé, puis relance d'autres notes (relance annulable).
- **Indices du compagnon** (contrat de la v52) : 2 niveaux (la piste, le coup de pouce), jamais la réponse.
- **Niveau adaptatif** (v42) et compétence « logique » dans l'espace parents.


### Histoire : « Le silence de l'île »
- Grisou a enfermé le rêve « chanter et danser » dans une boîte à musique fermée à clé. Remettre l'orchestre en marche libère le rêve, et Grisou devient un peu turquoise.
- **Chapitre** (format de `features/story`) : 3 phrases d'intro lues à voix haute par le guide, au moins 2 énigmes en images, un succès, une récompense (des pièces et une boîte surprise de la série de l'île).
- **3 épisodes** (après la 2ᵉ, la 4ᵉ et la 7ᵉ mission réussie sur l'île), racontés par les trois autres personnages, jamais par le guide.

## 3. Exigences non fonctionnelles
- Architecture en feature slices et modules ES : chaque mini-jeu dans `features/minigames/<jeu>/` avec son `index.js`, l'île dans les entités et features existantes ; déclaration dans `js/slices.cjs`, puis `npm run sync`.
- Mobile 360 px, tout est lu à voix haute, choix de réponses en images (sauf les mini-jeux de lecture), pas de punition.
- Les 2 mini-jeux respectent la checklist mini-jeu (difficulté, essais, minuteur, indices, compétence parents, tests de victoire dans `test/games.test.js`).
- Une partie de la version précédente se charge sans perte (migration si l'état change).

## 4. Critères d'acceptation
1. L'île s'ouvre au niveau 23 sur la carte de sa saison, avec l'écran « Nouvelle île » précédé de son chapitre.
2. Les 4 personnages, leurs butins et répliques, les objets, recettes, décorations, la scène, le thème, la musique et la série de squishies sont présents.
3. Les 2 mini-jeux suivent leurs paliers, relancent une autre question après une erreur, ont leurs 2 niveaux d'indice et leur niveau adaptatif, et sont joués jusqu'à la victoire à chaque palier par `test/games.test.js`.
4. Le chapitre et les 3 épisodes se jouent au bon moment ; la récompense est donnée une seule fois.
5. `npm test` passe, sans aucune erreur JS.

## 5. Hors périmètre
- Les autres îles de la saison.
- Changer les mini-jeux existants.
