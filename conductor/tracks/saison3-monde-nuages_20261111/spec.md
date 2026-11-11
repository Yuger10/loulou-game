# Spec : ☁️ La Cité des Nuages (Saison 3 « La Grande Expédition », île 1)

> Proposition retenue par la joueuse. **Ouvre la saison 3** : troisième carte et fil d'histoire de la carte au trésor de Zap.
> Fait partie de la Saison 3 « La Grande Expédition ». Prérequis : l'archipel de sa saison existe (cette track le crée). Suivre `conductor/checklist-ile.md` et `conductor/checklist-mini-jeu.md`.
> Spec écrite par Claude à partir des idées choisies : **à relire avec la joueuse**, en particulier les noms et les personnages.

## 1. Vue d'ensemble
- **L'île :** `nuages`, emoji ☁️, niveau d'ouverture **20**. Une ville posée sur des nuages : ponts en arc-en-ciel, girouettes, moulins à vent. Thème de couleurs bleu ciel, blanc et jaune soleil.
- **Deux nouveaux mini-jeux**, chacun avec une compétence encore absente ou nouvelle dans le jeu.
- **Son chapitre d'histoire** et ses 3 épisodes, sa série de squishies, sa musique.

## 2. Exigences fonctionnelles

### 2.1 L'île et ses personnages
- Scène dessinée en SVG et CSS (`features/island`), thème de couleurs `--world-*`, forme d'île propre, position sur la carte de sa saison (dans le cadre, sans chevauchement).
- **Personnages** (4, avec chacun un butin et 3 répliques) :
  - 🌦️ **Nimbus**, le gardien de la météo : guide du chapitre
  - 🪁 **Brise**, la cerf-volante : présente « Quel temps fait-il ? »
  - ❄️ **Givre**, le petit bonhomme de neige : présente « Le thermomètre »
  - ☀️ **Solène**, la fille du soleil : réchauffe tout le monde
- **Objets** (environ 6) : girouette, goutte de pluie, rayon de soleil, écharpe, parapluie, morceau d'arc-en-ciel. Au moins 3 ne sont donnés par personne, pour que chaque personnage ait 2 objets préférés (cadeaux, v47). Il y a aussi **2 recettes de fusion** et **4 à 5 décorations**.
- **Série de squishies « Ciel »** (6 modèles : 4 communs, 1 rare, 1 ✨) : petit nuage, goutte, soleil, flocon ; rare : Nimbus ; ✨ : arc-en-ciel de cristal. La boîte surprise de l'énigme du chapitre vient de cette série.
- **Musique :** un thème `MUSIC_THEMES.nuages` (carillon aérien, 70 battements par minute).
- **Jeu favori de l'île :** le premier mini-jeu pour moins de 7 ans, le second pour 7 ans et plus.

### Mini-jeu « Quel temps fait-il ? » (`weather`)
- Habiller un personnage selon la météo (bonnet sous la neige, chapeau au soleil, bottes sous la pluie), puis lire une petite carte météo.
- **Progression selon l'âge et le niveau du jeu :**
  - GS : un temps, un vêtement à choisir parmi 3
  - CP : un temps, deux vêtements
  - CE1 : choisir le temps qui va avec une tenue
  - CE2 : lire une carte météo de 3 villes (« où faut-il un parapluie ? »)
- **Anti-devinette :** une erreur donne un indice parlé, puis relance un autre temps (relance annulable).
- **Indices du compagnon** (contrat de la v52) : 2 niveaux (la piste, le coup de pouce), jamais la réponse.
- **Niveau adaptatif** (v42) et compétence « sciences » dans l'espace parents.

### Mini-jeu « Le thermomètre » (`thermo`)
- Lire la température sur un thermomètre gradué, ou faire monter le liquide jusqu'au bon trait.
- **Progression selon l'âge et le niveau du jeu :**
  - GS : chaud ou froid (deux thermomètres)
  - CP : graduations de 10 en 10 jusqu'à 40
  - CE1 : de 5 en 5
  - CE2 : de 2 en 2, et comparer deux températures
- **Anti-devinette :** une erreur donne un indice parlé, puis relance une autre température (relance annulable).
- **Indices du compagnon** (contrat de la v52) : 2 niveaux (la piste, le coup de pouce), jamais la réponse.
- **Niveau adaptatif** (v42) et compétence « mesures » dans l'espace parents.


### Histoire : « Le premier morceau de la carte »
- **Prologue de la saison 3** : en rangeant son sac, Zap trouve une vieille carte d'explorateur, déchirée en 5 morceaux. Le premier est coincé dans la girouette de la Cité des Nuages. L'énigme du chapitre le délivre.
- **Chapitre** (format de `features/story`) : 3 phrases d'intro lues à voix haute par le guide, au moins 2 énigmes en images, un succès, une récompense (des pièces et une boîte surprise de la série de l'île).
- **3 épisodes** (après la 2ᵉ, la 4ᵉ et la 7ᵉ mission réussie sur l'île), racontés par les trois autres personnages, jamais par le guide.

### Ouverture de la saison 3
- **Troisième carte** « 🧭 La Grande Expédition » : troisième onglet de la carte (après « Le Lagon Magique » et « Le Ciel des Rêves »), sur le modèle des archipels de la saison 2. Elle s'ouvre au **niveau 20**, en parallèle des deux autres saisons, et chaque île garde son propre niveau (20, 25, 30, 35, 40).
- **Véhicule :** un petit avion en papier ✈️ (le bateau en saison 1, la montgolfière en saison 2).
- **Écran d'ouverture** « Une nouvelle expédition commence ! », une seule fois par profil, y compris pour une partie déjà au niveau 20 ou plus.
- **La carte de Zap** : une image de carte en 5 morceaux, visible dans le journal 📖 (partie « Saison 3 »), qui se complète d'un morceau à chaque chapitre résolu.

## 3. Exigences non fonctionnelles
- Architecture en feature slices et modules ES : chaque mini-jeu dans `features/minigames/<jeu>/` avec son `index.js`, l'île dans les entités et features existantes ; déclaration dans `js/slices.cjs`, puis `npm run sync`.
- Mobile 360 px, tout est lu à voix haute, choix de réponses en images (sauf les mini-jeux de lecture), pas de punition.
- Les 2 mini-jeux respectent la checklist mini-jeu (difficulté, essais, minuteur, indices, compétence parents, tests de victoire dans `test/games.test.js`).
- Une partie de la version précédente se charge sans perte (migration si l'état change).

## 4. Critères d'acceptation
1. L'île s'ouvre au niveau 20 sur la carte de sa saison, avec l'écran « Nouvelle île » précédé de son chapitre.
2. Les 4 personnages, leurs butins et répliques, les objets, recettes, décorations, la scène, le thème, la musique et la série de squishies sont présents.
3. Les 2 mini-jeux suivent leurs paliers, relancent une autre question après une erreur, ont leurs 2 niveaux d'indice et leur niveau adaptatif, et sont joués jusqu'à la victoire à chaque palier par `test/games.test.js`.
4. Le chapitre et les 3 épisodes se jouent au bon moment ; la récompense est donnée une seule fois.
5. `npm test` passe, sans aucune erreur JS.

## 5. Hors périmètre
- Les autres îles de la saison.
- Changer les mini-jeux existants.
