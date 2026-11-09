# Plan : Les compagnons et leurs rôles (indices et équipe) (v51)

Spec : [spec.md](./spec.md). Workflow : [workflow.md](../../workflow.md).
**Prérequis :** `refactor-feature-slices` (étape A) livrée. Les spécialités Tom (boîtes) et Rose (squishies) s'appuient sur la v52 si elle est livrée, et se dégradent proprement sinon. Lili (Monde des Boîtes) et Grisou (fin de saison 2) ne sont rencontrables qu'une fois leurs tracks livrées.
Nouvelle slice : `features/companion-team/`. Contrat d'indices dans `features/minigame-engine/`.

## Phase 1 : Le contrat d'indices et le bouton 💡
- [ ] Task: Contrat d'indices du moteur
    - [ ] Tests : `hintsFor(type, question)` renvoie 2 niveaux (texte parlé et effet visuel) ; pas de 3ᵉ ; règle d'élimination (aucune sous 4 choix, au maximum 1 au niveau 2, et toujours au moins 3 choix restants) ; une relance remet à zéro
    - [ ] API dans `features/minigame-engine/`
- [ ] Task: Bouton 💡 et proposition douce
    - [ ] Tests : bouton présent dans chaque mini-jeu avec la tête du principal ; il brille après une erreur ou 10 s sans toucher ; masqué en mode course ; récompense identique avec ou sans indice
    - [ ] Interface, humeurs du compagnon (« réfléchit », « fête »), voix
- [ ] Task: Compter les indices
    - [ ] Tests : `skills[jeu].hints` incrémenté ; un indice ne compte pas comme une erreur pour `js/adaptive.js` ; visible dans l'espace parents (`js/parents.js`) ; inclus dans la sauvegarde
- [ ] Task: Conductor - User Manual Verification 'Contrat d'indices et bouton' (Protocol in workflow.md)

## Phase 2 : Les indices de chaque mini-jeu
- [ ] Task: Jeux de nombres
    - [ ] Tests et indices : compter, math, compare, money, calc, puzzle, sequence, assembler l'image (jigsaw)
- [ ] Task: Jeux de langue
    - [ ] Tests et indices : reading, grammar
- [ ] Task: Jeux d'observation et de monde
    - [ ] Tests et indices : memory, intruder, volume, clock, calendar, shapes, planets
- [ ] Task: Énigmes d'histoire (et rangement des squishies si la v52 est livrée)
- [ ] Task: Test de couverture des indices
    - [ ] Un test parcourt **chaque** type de mini-jeu inscrit et échoue s'il n'a pas d'indices ; ajouter l'étape « indices » à `conductor/checklist-mini-jeu.md`
- [ ] Task: Conductor - User Manual Verification 'Indices de chaque mini-jeu' (Protocol in workflow.md)

## Phase 3 : L'équipe
- [ ] Task: Ouverture au niveau 10
    - [ ] Tests : écran « Ton équipe s'agrandit ! » une seule fois ; partie déjà au niveau 10 ou plus migrée : écran au chargement
    - [ ] État `team` et migration
- [ ] Task: Rencontres sur les îles
    - [ ] Tests : bonne île pour chaque compagnon ; principal sauté ; une seule fois ; à la prochaine visite pour une île déjà connue ; « Plus tard » la repropose à la visite suivante ; Lili et Grisou absents tant que leurs tracks ne sont pas livrées
    - [ ] Scène de rencontre (compagnon en grand, 2 phrases, démonstration du rôle)
- [ ] Task: Fenêtre « Mon équipe »
    - [ ] Tests : 2 équipiers au maximum ; changer d'équipier et de principal ; conservé ; 3 têtes au maximum affichées (en-tête, île, bateau)
- [ ] Task: Conductor - User Manual Verification "L'équipe" (Protocol in workflow.md)

## Phase 4 : Les spécialités
- [ ] Task: Infrastructure
    - [ ] Tests : une spécialité est active si son compagnon est équipier actif, ou principal avec l'équipe ouverte ; file de parole (une à la fois, priorité aux indices) ; inactive en course
- [ ] Task: Lili (indices magiques), Perle (conteuse), Grisou (câlins)
    - [ ] Tests : 5 s au lieu de 10, paillettes, énigmes ; bouton « 🔁 Relire » et syllabes ; consolation après 2 erreurs ; Grisou annonce la pause douce des parents (v41) sans minuteur à lui
- [ ] Task: Léo (tuteur)
    - [ ] Tests : Léo annonce un jeu « à travailler » ou en soutien choisi par `js/adaptive.js` ; il dit la phrase de progrès existante ; indice 1 avant la première question d'un jeu en soutien ; 1 annonce par session
- [ ] Task: Sam (guide), Rose (collection)
    - [ ] Tests : priorité des destinations de Sam et toucher pour y aller ; Rose indique ce qui manque et sa provenance (Sac, Album, chambre si v52)
- [ ] Task: Zap (défis), Tom (trésors)
    - [ ] Tests : défi bonus 1 par jour et par île, un cran au-dessus du niveau adaptatif (plafond d'âge respecté), sans effet sur le niveau, récompense doublée, refusable ; trésor 1 par jour, boîte surprise comptée dans la limite si v52
- [ ] Task: Conductor - User Manual Verification 'Les spécialités' (Protocol in workflow.md)

## Phase 5 : Livraison v51
- [ ] Task: Intégration et docs
    - [ ] `sw.js` (`lagon-v51`, nouveaux fichiers), PRD (v51, demande du parent), TODO (amitié qui grandit, espace parents qui lit `stats`), README
- [ ] Task: Vérification complète
    - [ ] `npm test` vert ; parcours manuel à 360 px (indices dans 3 mini-jeux, niveau 9 → 10, une rencontre, Mon équipe, chaque spécialité au moins une fois, mode course sans indices)
- [ ] Task: Conductor - User Manual Verification 'Livraison' (Protocol in workflow.md)
- [ ] Task: Branche, PR sur `main`, merge
