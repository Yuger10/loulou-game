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

## État actuel (v52)
- 8 îles : Lagon, Forêt, Montagne, Château, Jungle, Cité du Temps, Volcan, Pays Squishy. Il y a 6 paliers de difficulté, de la GS au CE2, et **chaque mini-jeu a son propre niveau** pour chaque enfant (v42 : il monte, redescend en « soutien », et ce qui est à travailler revient plus souvent).
- 15 mini-jeux (mémoire, compter, intruse, suites, puzzle, lecture, grammaire, volumes, comparer, monnaie, heure, calendrier, calcul, formes, planètes), plus « assembler l'image » (v46).
- Profils multijoueurs, 7 compagnons dessinés, avatars habillables (« Mon look », v43). **Les compagnons ont un rôle** (v52) : le compagnon principal donne des indices 💡 dans tous les mini-jeux dès le départ ; au niveau 10, l'équipe s'ouvre (rencontres sur les îles, 2 équipiers, une spécialité chacun : conteuse, tuteur, guide, défis, trésors, collection, indices magiques, câlins).
- L'histoire du Lagon Magique : un chapitre et une énigme par île, plus **3 épisodes par île** qui avancent à chaque mission (v49). Elle se termine avec le trésor au Pays Squishy.
- Offrir un objet à un personnage, avec des cœurs d'amitié (v47) ; fêtes et saisons (v45) ; une musique d'ambiance par île (v48).
- **Espace parents** (v41) : progrès par compétence (`state.skills`), temps de jeu, pause douce réglable.
- Tests jsdom qui jouent chaque mini-jeu jusqu'à la victoire (v50), architecture en feature slices (v51), tests des indices et de l'équipe (v52).
- Sauvegarde versionnée avec migrations, fichier et code de transfert, PWA hors-ligne, **en ligne sur https://yuger10.github.io/loulou-game/**.

## Objectifs produit
- **Plaisir et motivation d'abord :** la joueuse doit vouloir revenir. Collection, surprise et histoire sont les moteurs.
- **Apprendre sans s'en rendre compte :** chaque activité nouvelle doit pouvoir porter une compétence (tri, comptage, lecture).
- **Autonomie :** jouable seule, sans savoir lire, au doigt.
- **Ne jamais rien perdre :** la progression est sauvegardée, migrée et transférable.

## Prochaines grandes étapes
- Collection de squishies (boîtes surprises, séries, rangement).
- Saison 2 : une deuxième carte, un nouveau fil d'histoire, le Monde des Boîtes et le Monde des Licornes (idées de la joueuse).
- Une architecture en feature slices, puis en modules ES, pour accueillir tout ça.
