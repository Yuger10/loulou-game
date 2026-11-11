# Spec : Une pause qui tient, et des activités pour bouger

> Demande : « ma fille arrive facilement à contourner la pause. Je veux réfléchir à ça de manière académique. Il faut empêcher de continuer le jeu sauf intervention parentale, mais pendant ce temps on peut inciter l'enfant à faire des exercices, avec les personnages du jeu. Le compagnon dit qu'il est fatigué, avec une animation qui va dans ce sens ; on propose le choix entre activité physique, yoga ou autres. »
> Décisions : changer de joueur pendant la pause demande un adulte ; la porte des parents reste **la multiplication simple** ; la pause est **un voile flouté sur tout le jeu** ; activités : bouger, yoga, respirer avec Grisou, une idée hors écran ; **une seule activité**, puis l'écran s'endort.

## 1. Constat (v61) : comment la pause se contourne
La pause (v41) ne bloque que le **lancement d'un mini-jeu** (`game:before`). Tout le reste reste possible :

| Contournement | Cause |
|---|---|
| Jouer ailleurs | île, sac, marché, chambre à squishies (les boîtes de rangement rapportent des pièces), énigmes, cadeaux, garde-robe restent ouverts |
| Changer de joueur | la pause est propre à chaque profil, et changer de joueur ne demande rien |
| Créer un joueur | un nouveau profil n'a **aucune** pause (`pauseMin = 0`) |
| Jouer « à plusieurs » | `if(party.active) return false` : pas de pause en mode chacun son tour ou course |
| Recharger la page | le voile n'est montré qu'au lancement d'un mini-jeu |

## 2. Ce que dit la recherche (et ce qu'on en garde)
- **Fin naturelle et cause extérieure.** La fin d'écran se passe mieux à la fin d'un épisode qu'en plein milieu, et quand « c'est l'appareil » qui s'arrête ; un compte à rebours « encore 2 minutes » **aggrave** les crises chez les 1-5 ans (Université de Washington, 2016). → On laisse finir la mission en cours, **sans compte à rebours** ; c'est **le compagnon qui est fatigué** (cause extérieure à l'enfant).
- **Limites constantes** (AAP, dès 6 ans) qui ne remplacent ni le sommeil ni l'activité physique. → Le verrou est le même chaque jour et ne se négocie qu'avec un adulte.
- **Pauses actives** : effets positifs sur l'attention et le comportement (revue systématique 2025). **Yoga et pleine conscience** : meilleure autorégulation chez les jeunes enfants (13 études sur 16, revue 2021). → La pause propose de bouger, du yoga ou de respirer.
- **Autonomie** (théorie de l'autodétermination) : un choix offert aide à accepter la contrainte. → L'enfant choisit son activité.
- **Ne pas remplacer un écran par un autre.** → Une seule activité guidée, courte, puis l'écran s'endort.

Sources : [Université de Washington](https://www.washington.edu/news/2016/05/05/two-minute-warnings-make-kids-screen-time-tantrums-worse/), [AAP](https://www.healthychildren.org/english/family-life/Media/Pages/helping-kids-thrive-in-a-digital-world-AAP-policy-explained.aspx), [pauses actives, 2025](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC11822862/), [yoga et pleine conscience, 2021](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC8201280/).

## 3. Exigences fonctionnelles

### 3.1 Le verrou : un voile flouté sur tout le jeu
- Quand la limite du jour est atteinte (`pauseDue()`), un **voile flouté couvre tout le jeu** : en-tête, vues, barre du bas, fenêtres. Rien en dessous n'est touchable (le voile capte tous les touchers et le clavier ; le contenu est `inert`).
- **Fin naturelle** : si un mini-jeu est en cours, il se termine normalement (victoire ou échec), puis le voile arrive. Aucun nouveau mini-jeu ne démarre.
- **Le voile revient toujours** : au chargement de la page, au retour dans l'application, au changement de vue, et vérifié régulièrement (la minuterie de temps de jeu existante). Recharger ne le fait pas disparaître.
- Il se lève **le lendemain**, ou par **un adulte** (la multiplication existante) qui choisit : « + 10 minutes », « + 30 minutes », ou « fin de la pause pour aujourd'hui ».
- **Pas de compte à rebours.** Environ 5 minutes avant la limite, le compagnon **bâille** dans l'en-tête (signal visuel discret, sans texte ni chiffre).

### 3.2 Plus de portes de sortie
Pendant la pause d'un enfant :
- **Changer de joueur, créer un joueur ou lancer « à plusieurs »** passe par la porte des parents.
- **Mode à plusieurs** : la pause s'applique à chaque enfant ; la partie à plusieurs s'arrête à la fin de la mission en cours dès qu'un des enfants est en pause (sauf adulte).
- **Nouveau joueur** : sa pause reçoit le **réglage familial** (la durée choisie le plus récemment par un adulte), et non « pas de pause ».
- L'espace parents garde le réglage de la pause par enfant et ajoute le **réglage familial** pour les nouveaux joueurs.

### 3.3 L'animation « l'île s'endort »
À l'arrivée du voile :
1. le compagnon principal **bâille, se frotte les yeux, met son bonnet de nuit et se roule en boule**, avec un petit « zzz » ;
2. **la nuit tombe** doucement sur l'île (ciel plus sombre, étoiles qui s'allument), puis le flou s'installe ;
3. il dit, à voix haute et accordé fille/garçon : « Je suis tout fatigué… On a bien joué aujourd'hui ! Avant de dormir, tu choisis une activité avec moi ? ».
- Respecte `prefers-reduced-motion` (fondu simple, sans mouvement).

### 3.4 Une activité au choix, guidée par les personnages
Quatre grosses cartes, lues à voix haute au toucher :
- 🤸 **Bouger comme les animaux** (environ 1 min 30) : 3 mouvements montrés par des personnages des îles, par exemple marcher comme le crabe, sauter comme la grenouille, nager comme la sirène ; chaque mouvement environ 20 s, guidé par la voix, avec un rythme visuel (pas de chiffres à lire).
- 🧘 **Le yoga des animaux** (environ 2 min) : 3 postures montrées par les compagnons, par exemple l'arbre, le chat, la sirène, tenues le temps de 3 respirations guidées.
- 🌬️ **Respirer avec Grisou** (environ 1 min) : le petit nuage gonfle (« on inspire… ») et se dégonfle (« on souffle… »), 5 fois.
- 🎨 **Une idée hors écran** : le compagnon propose une activité sans écran, tirée parmi : dessiner son squishy préféré sur papier, lire un livre, aider à la maison, jouer dehors, construire une cabane. L'écran s'endort tout de suite.
- Les mouvements et postures sont adaptés aux 4-10 ans, sans risque (pas d'équilibre sur la tête, pas de saut en hauteur), avec la consigne « en faisant attention autour de toi ».
- **Une seule activité par pause.** À la fin : « Bravo ! À demain ! », puis **l'écran s'endort** : voile plus sombre, compagnon endormi, et seulement le bouton discret « Un adulte » (porte des parents).
- Passer l'activité est possible (« Pas maintenant ») : l'écran s'endort directement.

### 3.5 Le lendemain, et pour les parents
- Le lendemain, au premier lancement, le compagnon se souvient : « Hier, on a fait le yoga du chat ensemble ! ».
- **Espace parents**, par enfant : les pauses du jour et des 7 derniers jours (heure, activité choisie ou passée) et les **tentatives de contournement** (changer de joueur, créer un joueur, lancer à plusieurs pendant la pause), sans jugement, pour en parler.

## 4. Exigences non fonctionnelles
- Slice `features/rest/` (le voile, l'animation, les activités). `features/parents` garde la règle de pause (`pauseDue`) et la porte ; `features/players`, `features/party` et `settings` consultent la pause avant d'agir (point d'accroche, sans cycle d'import).
- **Sauvegarde** : `SAVE_VERSION` +1 ; par enfant : `restLog` (pauses, activité, tentatives) ; réglage familial dans les profils. Migration sans perte.
- **Accessibilité** : voile annoncé (`role="dialog"`, `aria-modal`), focus piégé dans le voile, tout est lu à voix haute, pas de texte nécessaire à lire, gros boutons.
- Aucun nouvel élément ne doit rendre l'écran plus attirant pendant la pause : pas de pièces, pas d'objets, pas de surprise.

## 5. Critères d'acceptation
1. Limite atteinte : le voile couvre tout ; aucun bouton du jeu n'est touchable dessous (test : les clics sur la carte, l'île, le sac, le marché, la chambre et l'en-tête n'ont aucun effet).
2. Un mini-jeu en cours se termine, puis le voile arrive ; aucun nouveau mini-jeu ne démarre.
3. Recharger la page ou changer de vue ne lève pas le voile.
4. Changer de joueur, créer un joueur, lancer à plusieurs pendant la pause : la porte des parents ; la tentative est notée.
5. Un nouveau joueur reçoit la pause familiale.
6. En mode à plusieurs, la pause s'applique (fin à la fin de la mission).
7. L'animation du compagnon fatigué et de la nuit se joue (fondu simple si mouvement réduit).
8. Les 4 activités se déroulent, guidées à voix haute ; une seule par pause ; puis l'écran s'endort.
9. Un adulte peut ajouter 10 ou 30 minutes ou lever la pause pour la journée.
10. Le lendemain, le compagnon rappelle l'activité ; l'espace parents montre les pauses et les tentatives.
11. Aucun compte à rebours ; seul un bâillement discret avant la limite.
12. `npm test` passe.

## 6. Hors périmètre
- Un code secret à la place de la multiplication (possible plus tard si la multiplication ne suffit plus).
- Bloquer l'appareil lui-même (Temps d'écran d'iOS, Family Link) : à conseiller aux parents dans l'espace parents, pas à faire dans le jeu.
- Des récompenses pour avoir fait l'activité.
