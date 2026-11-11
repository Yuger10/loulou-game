# Spec : 🍭 Le Royaume des Bonbons (Saison 2 « Le Ciel des Rêves », île 3)

> Proposition retenue par la joueuse.
> Fait partie de la Saison 2 « Le Ciel des Rêves ». Prérequis : l'archipel de sa saison existe (track `saison2-monde-boites`). Suivre `conductor/checklist-ile.md` et `conductor/checklist-mini-jeu.md`.
> Spec écrite par Claude à partir des idées choisies : **à relire avec la joueuse**, en particulier les noms et les personnages.

## 1. Vue d'ensemble
- **L'île :** `bonbons`, emoji 🍭, niveau d'ouverture **18**. Un village en pâtisserie : maisons en pain d'épices, rivière de sirop, arbres en sucettes. Thème de couleurs framboise, caramel et vanille.
- **Deux nouveaux mini-jeux**, chacun avec une compétence encore absente ou nouvelle dans le jeu.
- **Son chapitre d'histoire** et ses 3 épisodes, sa série de squishies, sa musique.

## 2. Exigences fonctionnelles

### 2.1 L'île et ses personnages
- Scène dessinée en SVG et CSS (`features/island`), thème de couleurs `--world-*`, forme d'île propre, position sur la carte de sa saison (dans le cadre, sans chevauchement).
- **Personnages** (4, avec chacun un butin et 3 répliques) :
  - 👑 **Praline**, la reine pâtissière : guide du chapitre
  - 🧁 **Chouquette**, la petite pâtissière : présente « Le gâteau partagé »
  - 🍫 **Cacao**, le chocolatier : présente « La recette »
  - 🍭 **Berlingot**, le marchand de bonbons : vend et échange des bonbons
- **Objets** (environ 6) : sucre glace, cerise confite, pépite de chocolat, ruban de réglisse, cuillère en bois, moule à gâteau. Au moins 3 ne sont donnés par personne, pour que chaque personnage ait 2 objets préférés (cadeaux, v47). Il y a aussi **2 recettes de fusion** et **4 à 5 décorations**.
- **Série de squishies « Bonbons »** (6 modèles : 4 communs, 1 rare, 1 ✨) : sucette spirale, berlingot, guimauve, dragée ; rare : Praline ; ✨ : gâteau à étages doré. La boîte surprise de l'énigme du chapitre vient de cette série.
- **Musique :** un thème `MUSIC_THEMES.bonbons` (petite valse sucrée (pizzicato), 92 battements par minute).
- **Jeu favori de l'île :** le premier mini-jeu pour moins de 7 ans, le second pour 7 ans et plus.

### Mini-jeu « Le gâteau partagé » (`share`)
- Partager un gâteau ou une tablette en parts égales entre des amis. On découvre la moitié, le tiers et le quart, d'abord avec les yeux, puis avec les mots.
- **Progression selon l'âge et le niveau du jeu :**
  - GS : deux parts, « est-ce juste ? » (parts égales ou non)
  - CP : partager en 2 ou en 4 parts égales en touchant les lignes de coupe
  - CE1 : moitié, quart, tiers : montrer la bonne part
  - CE2 : écritures ½, ¼, ⅓ associées à l'image, et « combien de quarts pour faire une moitié ? »
- **Anti-devinette :** une erreur donne un indice parlé, puis relance un autre gâteau ou un autre nombre d'amis (relance annulable).
- **Indices du compagnon** (contrat de la v52) : 2 niveaux (la piste, le coup de pouce), jamais la réponse.
- **Niveau adaptatif** (v42) et compétence « calcul » dans l'espace parents.

### Mini-jeu « La recette » (`recipe`)
- Suivre une recette : mettre le bon nombre de cuillères, remplir un verre doseur jusqu'au bon trait, comparer deux sacs sur la balance.
- **Progression selon l'âge et le niveau du jeu :**
  - GS : plus ou moins (deux bols)
  - CP : compter les cuillères jusqu'à 10
  - CE1 : verre doseur gradué de 1 en 1 (en verres)
  - CE2 : graduations de 10 en 10 et de 50 en 50 (grammes, centilitres)
- **Anti-devinette :** une erreur donne un indice parlé, puis relance une autre recette (relance annulable).
- **Indices du compagnon** (contrat de la v52) : 2 niveaux (la piste, le coup de pouce), jamais la réponse.
- **Niveau adaptatif** (v42) et compétence « mesures » dans l'espace parents.


### Histoire : « La fête sans gâteau »
- Grisou a caché le rêve « fête et gourmandise » dans le grand four éteint. Rallumer le four en aidant les pâtissiers libère le rêve, et Grisou devient un peu jaune caramel.
- **Chapitre** (format de `features/story`) : 3 phrases d'intro lues à voix haute par le guide, au moins 2 énigmes en images, un succès, une récompense (des pièces et une boîte surprise de la série de l'île).
- **3 épisodes** (après la 2ᵉ, la 4ᵉ et la 7ᵉ mission réussie sur l'île), racontés par les trois autres personnages, jamais par le guide.

## 3. Exigences non fonctionnelles
- Architecture en feature slices et modules ES : chaque mini-jeu dans `features/minigames/<jeu>/` avec son `index.js`, l'île dans les entités et features existantes ; déclaration dans `js/slices.cjs`, puis `npm run sync`.
- Mobile 360 px, tout est lu à voix haute, choix de réponses en images (sauf les mini-jeux de lecture), pas de punition.
- Les 2 mini-jeux respectent la checklist mini-jeu (difficulté, essais, minuteur, indices, compétence parents, tests de victoire dans `test/games.test.js`).
- Une partie de la version précédente se charge sans perte (migration si l'état change).

## 4. Critères d'acceptation
1. L'île s'ouvre au niveau 18 sur la carte de sa saison, avec l'écran « Nouvelle île » précédé de son chapitre.
2. Les 4 personnages, leurs butins et répliques, les objets, recettes, décorations, la scène, le thème, la musique et la série de squishies sont présents.
3. Les 2 mini-jeux suivent leurs paliers, relancent une autre question après une erreur, ont leurs 2 niveaux d'indice et leur niveau adaptatif, et sont joués jusqu'à la victoire à chaque palier par `test/games.test.js`.
4. Le chapitre et les 3 épisodes se jouent au bon moment ; la récompense est donnée une seule fois.
5. `npm test` passe, sans aucune erreur JS.

## 5. Hors périmètre
- Les autres îles de la saison.
- Changer les mini-jeux existants.
