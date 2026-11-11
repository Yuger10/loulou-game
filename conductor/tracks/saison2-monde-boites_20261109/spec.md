# Spec : Saison 2 « Le Ciel des Rêves » et le Monde des Boîtes

> Idée de la joueuse principale : « le monde des boîtes ».
> **Décision du propriétaire (11/11/2026, après relecture) :** le Ciel des Rêves s'ouvre au **niveau 36**, et non au niveau 8 : une fois toutes les îles du Lagon ouvertes (le Pays Squishy est au niveau 26), et non en parallèle. Le Monde des Boîtes passe au palier 6. Puis, pour que chaque île dure plus longtemps, les îles suivantes sont espacées de 8 niveaux (44, 52, 60, 68, 76), et la saison 3 suit la saison 2, de 10 en 10 (86 à 126). Les mentions du niveau 8 ci-dessous sont celles de la demande d'origine.
> **Dépend de** la track `squishy-collection_20261109` (v53) : les rêves libérés sont des squishies, et le Monde des Boîtes apporte sa série.

## 1. Vue d'ensemble
Un **deuxième archipel**, **« Le Ciel des Rêves »**, s'ouvre **au niveau 8**, **en parallèle** de la saison 1. Il a sa propre carte, ses couleurs et son fil d'histoire : **« Les Rêves dans les boîtes »**. Grisou, un petit nuage triste, a rangé tous les rêves colorés du ciel dans des boîtes, parce qu'il avait peur de les perdre. Chaque île en libère quelques-uns, et à la fin Grisou devient l'ami de tous.

Sa première île est le **Monde des Boîtes** (« La Fabrique de boîtes »), avec 4 personnages, 2 nouveaux mini-jeux (**Les boîtes gigognes** et **Combien de cubes ?**), ses objets, ses décorations, ses recettes, son chapitre et sa **série de squishies**.

## 2. Exigences fonctionnelles

### 2.1 Deuxième archipel et navigation
- Les îles portent maintenant un **archipel** : `saison:1` pour les 8 îles existantes (comportement inchangé), `saison:2` pour le Ciel des Rêves.
- **Ouverture :** le Ciel des Rêves s'ouvre au **niveau 8**. Ses îles ont leur **propre niveau d'ouverture**, plus espacé qu'en saison 1 pour que chaque monde dure : de 5 en 5 : 📦 Boîtes **8**, 🧸 Jouets Doux **13**, 🍭 Bonbons **18**, 🎵 Musique **23**, 🌸 Jardin des Fées **28**, 🦄 Licornes **33** (grand final). *Revus depuis (décision du propriétaire) : de 8 en 8, soit 36, 44, 52, 60, 68 et 76.* Chaque île a sa track (`monde-jouets`, `monde-bonbons`, `monde-musique`, `monde-jardin`, `monde-licornes`).
- **Carte :** l'écran carte affiche **deux onglets en haut**, « 🌊 Le Lagon Magique » et « ☁️ Le Ciel des Rêves ». L'onglet du Ciel est grisé, avec un cadenas et « Niveau 8 », tant qu'il est fermé. Le Ciel a son propre fond (dégradé pastel, nuages) et ses positions d'îles. Les règles « dans le cadre » et « pas de chevauchement » des tests s'appliquent à chaque archipel.
- **Bateau :** dans le Ciel, le bateau devient une **montgolfière** 🎈. Le trajet se fait d'île en île à l'intérieur d'un archipel. Passer d'un archipel à l'autre se fait par l'onglet, sans trajet.
- **Ouverture du Ciel :** au passage au niveau 8, un écran spécial « Un nouveau monde s'ouvre dans le ciel ! ☁️ » s'affiche. Il passe avant le chapitre 1 de la saison 2.
- **Parties existantes :** une joueuse déjà au niveau 8 ou plus voit le Ciel s'ouvrir à la première ouverture après la mise à jour, avec le même écran.

### 2.2 Histoire de la saison 2 : « Les Rêves dans les boîtes »
- Elle suit le même format que `js/features/story/story.js` : un chapitre par île (guide, titre, 3 phrases d'intro lues à voix haute, au moins 2 énigmes en images, un succès, une récompense).
- Le **journal 📖** affiche deux parties, Saison 1 et Saison 2. Les chapitres de la saison 2 sont regroupés sous « Le Ciel des Rêves ».
- **Prologue** (à l'ouverture du Ciel, lu par Capucine) : Grisou, le petit nuage, a eu peur de perdre les rêves colorés et les a tous enfermés dans des boîtes. Le ciel est devenu gris. « Aide-nous à les libérer ! »
- **Chapitre Monde des Boîtes :** les rêves sont cachés dans les boîtes de la Fabrique. Résoudre l'énigme en libère les premiers. Récompense : des pièces, plus **une boîte surprise de la série Boîtes** (mécanique de la track 1).
- **Grisou** apparaît dans chaque chapitre (un nuage gris avec un petit visage triste en SVG) et devient un peu plus coloré à chaque île libérée (6 étapes, une par île : rose, caramel, turquoise, vert tendre, puis toutes les couleurs avec les Licornes). C'est la progression visible de la saison.
- **Fin de saison :** elle est prévue mais **hors de cette track**. Elle arrivera avec la dernière île de la saison 2.

### 2.3 Le Monde des Boîtes (« La Fabrique de boîtes »)
- **L'île :** `boites`, emoji 📦, avec sa forme d'île propre (des boîtes empilées) et un thème de couleurs (`--world-*`) kraft et pastel. Sa décoration de scène est en SVG et CSS, dans le style de `js/features/island/island.js`.
- **Les personnages** (4, avec chacun leur butin et 3 répliques) :
  - 🦫 **Capucine**, la capybara directrice de la Fabrique, guide du chapitre
  - 🐱 **Kiki**, le chat-dans-la-boîte, mascotte qui dort dans toutes les boîtes
  - 🤖 **Boulon**, le robot en carton, qui présente « Combien de cubes ? »
  - 📦 **Lola**, la livreuse en trottinette, qui apporte les boîtes surprises dans tout le ciel
- **Pop**, le diablotin à ressort 🎁, n'est pas un personnage à aider : il surgit pour le plaisir dans l'animation d'ouverture des boîtes surprises, de temps en temps (1 fois sur 5).
- **Objets** (environ 6, avec `world:'boites'`) : ruban adhésif, papier cadeau, étiquette, carton plié, nœud doré, ficelle… Il y a aussi **2 recettes de fusion** et **4 à 5 décorations**, sur le modèle des autres îles.
- **Série de squishies « Boîtes »** (6 modèles, 4 communs, 1 rare, 1 ✨), ajoutée au catalogue de la track 1 : chat-dans-la-boîte, robot carton, cadeau surprise, petit colis… ; rare : Pop ; ✨ : boîte dorée.

### 2.4 Mini-jeu « Les boîtes gigognes » (sériation)
- On voit N boîtes de tailles différentes, dans le désordre. L'enfant les touche **de la plus petite à la plus grande**, et chaque bonne boîte vient se ranger dans la suivante.
- La consigne est en image (une flèche petite → grande) et lue à voix haute.
- **Selon l'âge et le palier :** 3 boîtes (GS), puis 4, puis 5 ; au palier haut, **ordre inverse** (« de la plus grande à la plus petite ») et des écarts de taille plus fins.
- **Anti-devinette :** une erreur fait trembler la boîte et donne un indice parlé. Après 2 erreurs, nouvelle série de boîtes (relance annulable).

### 2.5 Mini-jeu « Combien de cubes ? » (repérage dans l'espace)
- Une **pile de cubes** est dessinée en perspective (SVG isométrique). L'enfant choisit le bon nombre parmi 3 réponses en grands chiffres et en points.
- **Progression :**
  - palier 1-2 : de 2 à 5 cubes, tous visibles
  - palier 3-4 : jusqu'à 8 cubes, sur 2 étages
  - palier 5-6 : jusqu'à 12 cubes, **certains cachés derrière ou dessous**, avec un indice visuel (« les cubes du dessus sont toujours posés sur d'autres cubes »)
- **Anti-devinette :** une mauvaise réponse relance **une autre pile** (même principe que l'existant).
- Les deux mini-jeux sont proposés sur l'île des Boîtes (`game:` favori : les gigognes pour moins de 7 ans, les cubes pour 7 ans et plus) et peuvent apparaître ailleurs selon la variété (`gameCounts`).

### 2.6 Intégration aux fonctionnalités récentes (v45 à v49)
- **Épisodes (v49) :** l'île des Boîtes a ses **3 épisodes** (après la 2ᵉ, la 4ᵉ et la 7ᵉ mission réussie), racontés par Kiki, Boulon et Lola, jamais par la guide Capucine. Ils suivent le fil de Grisou (des boîtes qui frissonnent, un rêve qui s'échappe, un indice sur le Royaume Arc-en-ciel). Chacun fait trouver un objet de l'histoire et 3 pièces, comme en saison 1.
- **Cadeaux (v47) :** au moins 3 objets de l'île ne sont donnés par personne, pour que chaque personnage ait 2 objets préférés (`favoritesOf`).
- **Musique (v48) :** un thème `MUSIC_THEMES.boites` (rythme de machines douces, petits « tchac » de carton). Le Ciel des Rêves a une ambiance plus aérienne.
- **Saisons (v45) :** les décorations de fête s'affichent aussi sur la carte du Ciel.
- **Jeu adaptatif (v42) :** les deux nouveaux mini-jeux ont un niveau propre à chaque enfant (`skills[jeu].lvl`), sont rangés dans une compétence de l'espace parents (gigognes et cubes : « formes et espace ») et, une fois la track compagnons livrée (v52), fournissent leurs indices.

## 3. Exigences non fonctionnelles
- **Sauvegarde :** `SAVE_VERSION` augmente. Il y a un état `skyIntroSeen` (écran d'ouverture déjà vu) et les îles visitées par archipel. La migration n'efface rien de la saison 1.
- **Pas de régression de la saison 1 :** ordre des îles, niveaux, trajet du bateau, journal et tests existants inchangés.
- **Extensible :** ajouter une île de la saison 2 = une entrée dans `WORLDS` (`saison:2`), un chapitre dans `STORY`, une série de squishies. Pas de code spécifique à l'île en dehors de sa scène.
- Mobile 360 px, voix, pas de texte à lire (voir `product-guidelines.md`).

## 4. Critères d'acceptation
1. En dessous du niveau 8, l'onglet Ciel est verrouillé (cadenas, « Niveau 8 »). La carte de la saison 1 est identique à la v53.
2. En atteignant le niveau 8 (ou en ouvrant une partie déjà au niveau 8 ou plus), l'écran d'ouverture s'affiche une seule fois, suivi du prologue, puis du chapitre des Boîtes.
3. La carte du Ciel affiche ses îles dans le cadre, sans chevauchement, avec la montgolfière.
4. Le Monde des Boîtes affiche ses 4 personnages, leurs butins, sa scène et son thème. Les missions donnent ses objets.
5. Résoudre l'énigme des Boîtes donne des pièces et une boîte surprise de la série Boîtes. La série apparaît dans la chambre à squishies.
6. Gigognes : l'ordre est vérifié, l'ordre inverse est présent au palier haut, la relance a lieu après 2 erreurs, le nombre de boîtes suit l'âge et le palier.
7. Cubes : le nombre affiché correspond au nombre de cubes de la pile, y compris ceux cachés. Une autre pile est proposée après une erreur. La taille suit le palier.
8. Le journal 📖 sépare Saison 1 et Saison 2 ; l'île des Boîtes a ses 3 épisodes, sa musique, et 2 objets préférés par personnage.
9. Une partie v54 migrée garde toute sa progression.
10. `npm test` passe, sans aucune erreur JS.

## 5. Hors périmètre
- Les autres îles de la saison 2 (Jouets Doux, Bonbons, Musique, Jardin des Fées, Licornes), chacune dans sa track.
- La fin de la saison 2 (Grisou devient l'ami de tous), qui arrivera avec la dernière île.
- Le glisser-déposer dans les gigognes (on touche).
- Le changement des niveaux d'ouverture de la saison 1.
