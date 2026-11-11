# Initial Concept

Le Lagon Magique : un jeu mobile, éducatif et familial, imaginé avec et pour une petite fille de 6 ans, puis étendu à toute la fratrie. On aide des personnages en réussissant des mini-jeux d'apprentissage, on gagne des objets, on les vend, on les échange ou on les fusionne au marché, on décore ses îles et on complète son album.

# Product Guide

## Vision
Donner envie d'apprendre (lecture, nombres, calcul, heure, formes, planètes…) à travers une aventure douce, où chaque réussite fait avancer une histoire et grandir une collection. Le jeu est co-conçu avec les enfants : leurs idées (mondes, personnages, objets) deviennent des fonctionnalités.

## Public
- **Joueuse principale :** une fille de 6-7 ans (GS → CE1), en train d'apprendre à lire.
- **Autres joueurs :** frères, sœurs et amis, de la maternelle au CE2, sur le même appareil (profils, mode « chacun son tour », mode course).
- **Adultes :** parents qui installent le jeu, sauvegardent la partie et suivent les progrès.

## Boucle de jeu
1. Choisir une île sur la carte, toucher un personnage.
2. Il propose une mission : un mini-jeu adapté à l'âge et au palier de l'île.
3. Réussir rapporte des pièces, des objets et de l'expérience. Un échec mène simplement à réessayer.
4. Au marché : vendre, échanger, fusionner, acheter des décorations.
5. Les niveaux débloquent de nouvelles îles, chacune avec un chapitre d'histoire et une énigme.
6. Les missions du jour et l'album donnent une raison de revenir chaque jour.

## État actuel (v57)
- 8 îles dans le Lagon Magique : Lagon, Forêt, Montagne, Château, Jungle, Cité du Temps, Volcan, Pays Squishy. **Saison 2, le Ciel des Rêves** (v55), au niveau 32, juste après le Lagon : un deuxième archipel avec sa carte (onglets, montgolfière) et sa première île, le **Monde des Boîtes** (idée de la joueuse). Il y a 6 paliers de difficulté, de la GS au CE2, et **chaque mini-jeu a son propre niveau** pour chaque enfant (v42 : il monte, redescend en « soutien », et ce qui est à travailler revient plus souvent).
- 15 mini-jeux (mémoire, compter, intruse, suites, puzzle, lecture, grammaire, volumes, comparer, monnaie, heure, calendrier, calcul, formes, planètes), plus « assembler l'image » (v46), « les boîtes gigognes » et « combien de cubes ? » (v55).
- Profils multijoueurs, 7 compagnons dessinés, avatars habillables (« Mon look », v43). **Les compagnons ont un rôle** (v52) : le compagnon principal donne des indices 💡 dans tous les mini-jeux dès le départ ; au niveau 10, l'équipe s'ouvre (rencontres sur les îles, 2 équipiers, une spécialité chacun : conteuse, tuteur, guide, défis, trésors, collection, indices magiques, câlins).
- L'histoire du Lagon Magique : un chapitre et une énigme par île, plus **3 épisodes par île** qui avancent à chaque mission (v49). Elle se termine avec le trésor au Pays Squishy.
- Offrir un objet à un personnage, avec des cœurs d'amitié (v47) ; fêtes et saisons (v45) ; une musique d'ambiance par île (v48) ; des sons doux au marimba, avec un volume par joueur (v56).
- **Collection de squishies** (v53, idée de la joueuse) : des boîtes surprises gagnées en jouant (coffre du jour, énigmes, boutique du marché), 3 séries de 6 squishies avec 3 raretés, une chambre à squishies (collection, étagère, presser), des **boîtes de rangement à consigne** qui font trier par couleur, forme et taille, et l'échange des doubles.
- **Espace parents** (v41) : progrès par compétence (`state.skills`), temps de jeu, pause douce réglable.
- Tests jsdom qui jouent chaque mini-jeu jusqu'à la victoire (v50), architecture en feature slices (v51), tests des indices et de l'équipe (v52), tests de la collection de squishies (v53), modules ES natifs sans cycle ni variable globale (v54), tests de la saison 2 (v55), tests des niveaux (v57).
- **Niveaux équilibrés (v57)** : un niveau = 5 missions ; une île tous les 4 niveaux dans le Lagon, tous les 6 dans le Ciel, tous les 8 dans la saison 3 ; une seule référence, `conductor/niveaux.md`. Sous la carte, « encore N missions » et une barre qui part de la dernière île ouverte.
- Sauvegarde versionnée avec migrations, fichier et code de transfert, PWA hors-ligne, **en ligne sur https://yuger10.github.io/loulou-game/**.

## Objectifs produit
- **Plaisir et motivation d'abord :** la joueuse doit vouloir revenir. Collection, surprise et histoire sont les moteurs.
- **Apprendre sans s'en rendre compte :** chaque activité nouvelle doit pouvoir porter une compétence (tri, comptage, lecture).
- **Autonomie :** jouable seule, sans savoir lire, au doigt.
- **Ne jamais rien perdre :** la progression est sauvegardée, migrée et transférable.

## Prochaines grandes étapes
- **Les niveaux** suivent une seule règle, dans `conductor/niveaux.md` : un niveau = 5 missions ; les saisons se suivent ; l'écart entre deux îles grandit de 2 niveaux à chaque saison (4, 6, 8).
- Saison 2 « Le Ciel des Rêves », suite : 5 îles après les Boîtes, une tous les 6 niveaux, du niveau 38 au niveau 62 (Jouets Doux, Bonbons, Musique, Jardin des Fées, et les Licornes en grand final, où Grisou devient l'ami de tous), puis la saison 3 « La Grande Expédition », une île tous les 8 niveaux, du niveau 70 au niveau 102 (5 îles : Nuages, Dinosaures, Fête Foraine, Bibliothèque, Étoiles), d'après les idées de la joueuse.
