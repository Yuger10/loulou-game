# Spec : 🌸 Le Jardin des Fées (Saison 2 « Le Ciel des Rêves », île 5)

> Proposition retenue par la joueuse.
> Fait partie de la Saison 2 « Le Ciel des Rêves ». Prérequis : l'archipel de sa saison existe (track `saison2-monde-boites`). Suivre `conductor/checklist-ile.md` et `conductor/checklist-mini-jeu.md`.
> Spec écrite par Claude à partir des idées choisies : **à relire avec la joueuse**, en particulier les noms et les personnages.

> **Niveaux (décision du propriétaire, 11/11/2026) :** les saisons se suivent, et chaque île demande plus de parties qu'en saison 1 (où les îles sont espacées de 2 à 4 niveaux, et un niveau vaut 5 victoires). Saison 2 « Le Ciel des Rêves », de 8 en 8 à partir du niveau 36 (après tout le Lagon) : 📦 Boîtes 36, 🧸 Jouets Doux 44, 🍭 Bonbons 52, 🎵 Musique 60, 🌸 Jardin des Fées 68, 🦄 Licornes 76. Saison 3 « La Grande Expédition », de 10 en 10 après le grand final de la saison 2 : ☁️ Nuages 86, 🦕 Dinosaures 96, 🎪 Fête Foraine 106, 📚 Bibliothèque 116, 🚀 Étoiles 126.

## 1. Vue d'ensemble
- **L'île :** `jardin`, emoji 🌸, niveau d'ouverture **68**. Un jardin géant vu à hauteur d'insecte : fleurs immenses, champignons-maisons, gouttes de rosée. Thème de couleurs vert tendre, lilas et pêche.
- **Deux nouveaux mini-jeux**, chacun avec une compétence encore absente ou nouvelle dans le jeu.
- **Son chapitre d'histoire** et ses 3 épisodes, sa série de squishies, sa musique.

## 2. Exigences fonctionnelles

### 2.1 L'île et ses personnages
- Scène dessinée en SVG et CSS (`features/island`), thème de couleurs `--world-*`, forme d'île propre, position sur la carte de sa saison (dans le cadre, sans chevauchement).
- **Personnages** (4, avec chacun un butin et 3 répliques) :
  - 🧚 **Pétale**, la fée jardinière : guide du chapitre
  - 🐞 **Pois**, la coccinelle : présente « Les coccinelles »
  - 🦋 **Azur**, le papillon : présente « De la graine à la fleur »
  - 🐝 **Miella**, l'abeille : butine et apporte le miel
- **Objets** (environ 6) : graine magique, goutte de rosée, pollen doré, feuille d'arrosoir, pétale de rose, fil d'araignée. Au moins 3 ne sont donnés par personne, pour que chaque personnage ait 2 objets préférés (cadeaux, v47). Il y a aussi **2 recettes de fusion** et **4 à 5 décorations**.
- **Série de squishies « Petites bêtes »** (6 modèles : 4 communs, 1 rare, 1 ✨) : coccinelle, abeille, escargot, chenille ; rare : Pois ; ✨ : papillon irisé. La boîte surprise de l'énigme du chapitre vient de cette série.
- **Musique :** un thème `MUSIC_THEMES.jardin` (flûte légère et petites cloches, 76 battements par minute).
- **Jeu favori de l'île :** le premier mini-jeu pour moins de 7 ans, le second pour 7 ans et plus.

### Mini-jeu « De la graine à la fleur » (`lifecycle`)
- Remettre dans l'ordre les étapes de la vie : graine, pousse, bouton, fleur, fruit ; ou œuf, chenille, chrysalide, papillon. Chaque étape est dessinée et nommée à voix haute.
- **Progression selon l'âge et le niveau du jeu :**
  - GS : 3 étapes (graine, pousse, fleur)
  - CP : 4 étapes, plante ou papillon
  - CE1 : 5 étapes, une étape manquante à retrouver
  - CE2 : deux cycles mélangés à séparer (plante et papillon), et « que se passe-t-il ensuite ? »
- **Anti-devinette :** une erreur donne un indice parlé, puis relance un autre cycle (relance annulable).
- **Indices du compagnon** (contrat de la v52) : 2 niveaux (la piste, le coup de pouce), jamais la réponse.
- **Niveau adaptatif** (v42) et compétence « sciences » dans l'espace parents.

### Mini-jeu « Les coccinelles » (`ladybugs`)
- Compter les points d'une coccinelle. Ses deux ailes sont symétriques, ce qui fait découvrir les doubles (3 + 3) puis les moitiés. On peut aussi compléter l'aile vide pour qu'elle soit pareille à l'autre.
- **Progression selon l'âge et le niveau du jeu :**
  - GS : jusqu'à 3 points par aile, compter
  - CP : doubles jusqu'à 5 + 5
  - CE1 : doubles jusqu'à 10 + 10, compléter l'aile
  - CE2 : moitiés (« 14 points en tout, combien par aile ? »)
- **Anti-devinette :** une erreur donne un indice parlé, puis relance une autre coccinelle (relance annulable).
- **Indices du compagnon** (contrat de la v52) : 2 niveaux (la piste, le coup de pouce), jamais la réponse.
- **Niveau adaptatif** (v42) et compétence « calcul » dans l'espace parents.


### Histoire : « Le jardin endormi »
- Grisou a mis le rêve « grandir et fleurir » sous une cloche de verre : plus rien ne pousse. Réveiller le jardin libère l'avant-dernier rêve. Grisou est presque tout coloré : il ne lui manque que les couleurs des licornes.
- **Chapitre** (format de `features/story`) : 3 phrases d'intro lues à voix haute par le guide, au moins 2 énigmes en images, un succès, une récompense (des pièces et une boîte surprise de la série de l'île).
- **3 épisodes** (après la 2ᵉ, la 4ᵉ et la 7ᵉ mission réussie sur l'île), racontés par les trois autres personnages, jamais par le guide.

### Place dans la saison 2
- C'est l'**avant-dernière île** du Ciel des Rêves : juste après, le Monde des Licornes (niveau 76) joue le grand final de la saison.

## 3. Exigences non fonctionnelles
- Architecture en feature slices et modules ES : chaque mini-jeu dans `features/minigames/<jeu>/` avec son `index.js`, l'île dans les entités et features existantes ; déclaration dans `js/slices.cjs`, puis `npm run sync`.
- Mobile 360 px, tout est lu à voix haute, choix de réponses en images (sauf les mini-jeux de lecture), pas de punition.
- Les 2 mini-jeux respectent la checklist mini-jeu (difficulté, essais, minuteur, indices, compétence parents, tests de victoire dans `test/games.test.js`).
- Une partie de la version précédente se charge sans perte (migration si l'état change).

## 4. Critères d'acceptation
1. L'île s'ouvre au niveau 68 sur la carte de sa saison, avec l'écran « Nouvelle île » précédé de son chapitre.
2. Les 4 personnages, leurs butins et répliques, les objets, recettes, décorations, la scène, le thème, la musique et la série de squishies sont présents.
3. Les 2 mini-jeux suivent leurs paliers, relancent une autre question après une erreur, ont leurs 2 niveaux d'indice et leur niveau adaptatif, et sont joués jusqu'à la victoire à chaque palier par `test/games.test.js`.
4. Le chapitre et les 3 épisodes se jouent au bon moment ; la récompense est donnée une seule fois.
5. `npm test` passe, sans aucune erreur JS.

## 5. Hors périmètre
- Les autres îles de la saison.
- Changer les mini-jeux existants.
