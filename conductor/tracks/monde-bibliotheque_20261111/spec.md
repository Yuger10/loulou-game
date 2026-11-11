# Spec : 📚 La Bibliothèque Magique (Saison 3 « La Grande Expédition », île 4)

> Proposition retenue par la joueuse.
> Fait partie de la Saison 3 « La Grande Expédition ». Prérequis : l'archipel de sa saison existe (track `saison3-monde-nuages`). Suivre `conductor/checklist-ile.md` et `conductor/checklist-mini-jeu.md`.
> Spec écrite par Claude à partir des idées choisies : **à relire avec la joueuse**, en particulier les noms et les personnages.

## 1. Vue d'ensemble
- **L'île :** `biblio`, emoji 📚, niveau d'ouverture **35**. Une île-bibliothèque : tours de livres, escaliers en spirale, lettres qui volent comme des papillons. Thème de couleurs bordeaux, bois clair et or.
- **Deux nouveaux mini-jeux**, chacun avec une compétence encore absente ou nouvelle dans le jeu.
- **Son chapitre d'histoire** et ses 3 épisodes, sa série de squishies, sa musique.

## 2. Exigences fonctionnelles

### 2.1 L'île et ses personnages
- Scène dessinée en SVG et CSS (`features/island`), thème de couleurs `--world-*`, forme d'île propre, position sur la carte de sa saison (dans le cadre, sans chevauchement).
- **Personnages** (4, avec chacun un butin et 3 répliques) :
  - 📖 **Grimoire**, le livre bavard : guide du chapitre
  - 🐛 **Virgule**, la chenille liseuse : présente « La phrase en désordre »
  - 🦉 **Majuscule**, la chouette savante : présente « Qui ? Où ? Quoi ? »
  - 🐭 **Tome**, le souriceau des archives : retrouve tous les livres
- **Objets** (environ 6) : marque-page, plume d'encre, loupe, lettre dorée, livre de contes, lampe de lecture. Au moins 3 ne sont donnés par personne, pour que chaque personnage ait 2 objets préférés (cadeaux, v47). Il y a aussi **2 recettes de fusion** et **4 à 5 décorations**.
- **Série de squishies « Livres »** (6 modèles : 4 communs, 1 rare, 1 ✨) : livre ouvert, marque-page, crayon, lettre A ; rare : Virgule ; ✨ : grimoire doré. La boîte surprise de l'énigme du chapitre vient de cette série.
- **Musique :** un thème `MUSIC_THEMES.biblio` (harpe calme, 66 battements par minute).
- **Jeu favori de l'île :** le premier mini-jeu pour moins de 7 ans, le second pour 7 ans et plus.

### Mini-jeu « La phrase en désordre » (`sentence`)
- Les mots d'une phrase se sont mélangés ; on les remet dans l'ordre. Chaque mot est lu à voix haute quand on le touche, et une image montre ce que dit la phrase.
- **Progression selon l'âge et le niveau du jeu :**
  - GS : 2 mots avec images (« Le chat »), entièrement à l'écoute
  - CP : 3 mots
  - CE1 : 4 à 5 mots
  - CE2 : 6 mots, avec la majuscule au début et le point à la fin
- **Anti-devinette :** une erreur donne un indice parlé, puis relance une autre phrase (relance annulable).
- **Indices du compagnon** (contrat de la v52) : 2 niveaux (la piste, le coup de pouce), jamais la réponse.
- **Niveau adaptatif** (v42) et compétence « lire » dans l'espace parents.

### Mini-jeu « Qui ? Où ? Quoi ? » (`comprehension`)
- Une mini-histoire de 2 ou 3 phrases, lue à voix haute (et écrite à partir du CP). On répond en touchant l'image : qui ? où ? qu'a-t-il fait ?
- **Progression selon l'âge et le niveau du jeu :**
  - GS : histoire écoutée seulement, une question « qui ? »
  - CP : 2 phrases, « qui ? » et « où ? »
  - CE1 : 3 phrases, « quoi ? »
  - CE2 : 3 phrases, « pourquoi ? » (une petite déduction)
- **Anti-devinette :** une erreur donne un indice parlé, puis relance une autre histoire (relance annulable).
- **Indices du compagnon** (contrat de la v52) : 2 niveaux (la piste, le coup de pouce), jamais la réponse.
- **Niveau adaptatif** (v42) et compétence « lire » dans l'espace parents.


### Histoire : « Le morceau entre les pages »
- Le quatrième morceau de la carte sert de marque-page dans le plus vieux livre de la bibliothèque. Il faut remettre de l'ordre dans les histoires pour le retrouver.
- **Chapitre** (format de `features/story`) : 3 phrases d'intro lues à voix haute par le guide, au moins 2 énigmes en images, un succès, une récompense (des pièces et une boîte surprise de la série de l'île).
- **3 épisodes** (après la 2ᵉ, la 4ᵉ et la 7ᵉ mission réussie sur l'île), racontés par les trois autres personnages, jamais par le guide.

## 3. Exigences non fonctionnelles
- Architecture en feature slices et modules ES : chaque mini-jeu dans `features/minigames/<jeu>/` avec son `index.js`, l'île dans les entités et features existantes ; déclaration dans `js/slices.cjs`, puis `npm run sync`.
- Mobile 360 px, tout est lu à voix haute, choix de réponses en images (sauf les mini-jeux de lecture), pas de punition.
- Les 2 mini-jeux respectent la checklist mini-jeu (difficulté, essais, minuteur, indices, compétence parents, tests de victoire dans `test/games.test.js`).
- Une partie de la version précédente se charge sans perte (migration si l'état change).

## 4. Critères d'acceptation
1. L'île s'ouvre au niveau 35 sur la carte de sa saison, avec l'écran « Nouvelle île » précédé de son chapitre.
2. Les 4 personnages, leurs butins et répliques, les objets, recettes, décorations, la scène, le thème, la musique et la série de squishies sont présents.
3. Les 2 mini-jeux suivent leurs paliers, relancent une autre question après une erreur, ont leurs 2 niveaux d'indice et leur niveau adaptatif, et sont joués jusqu'à la victoire à chaque palier par `test/games.test.js`.
4. Le chapitre et les 3 épisodes se jouent au bon moment ; la récompense est donnée une seule fois.
5. `npm test` passe, sans aucune erreur JS.

## 5. Hors périmètre
- Les autres îles de la saison.
- Changer les mini-jeux existants.
