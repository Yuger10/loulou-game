# Analyse de la difficulté des mini-jeux — Le Lagon Magique

> ⚠️ **Avertissement méthodologique** : l'environnement de développement
> n'a pas d'accès internet. Les repères de programme scolaire cités ici
> (cycle 1 — maternelle 3-6 ans, cycle 2 — CP/CE1/CE2) viennent de ma
> connaissance générale du système éducatif français (BOEN, domaines
> « Construire les premiers outils pour structurer sa pensée » et
> « Mobiliser le langage »). **À vérifier sur eduscol.education.fr**
> si une confirmation précise et à jour est nécessaire avant tout usage
> pédagogique sérieux.

## 1. Pourquoi cette analyse

Avant la v27, la difficulté de chaque mini-jeu était codée en dur,
dispersée dans 8 fichiers différents, avec des tables `{2:x, 3:y, 4:z}`
copiées-collées et légèrement différentes d'un jeu à l'autre. Résultat :
des incohérences qui n'avaient pas de raison pédagogique, et un seul
palier maximal (4) qui ne distinguait pas un enfant qui débute le CE1
d'un enfant qui le termine.

## 2. Bugs corrigés

| # | Jeu | Problème trouvé | Correction |
|---|---|---|---|
| 1 | Puzzle des nombres | La variante « à partir d'un autre nombre » (`start`) était ajoutée **deux fois** dans la liste de tirage au sort, dès l'île 2 → elle sortait deux fois plus souvent que prévu, sans que ce soit voulu. | `puzzleVariants(dd)` dans `js/difficulty.js` : chaque variante n'apparaît désormais qu'une fois, pondération explicite et documentée. |
| 2 | Trouver l'intrus | Le nombre d'images progressait de façon irrégulière : 6 → 8 → 9 → 12 (+2, +1, +3). | Progression régulière `diffTotal` : 6 → 8 → 10 → 12 → 14 (+2 à chaque palier). |
| 3 | Grandeurs & volumes | Les paliers 1 et 2 (comparaison de contenances) étaient strictement identiques : toujours 2 contenants, aucune différence de difficulté entre l'île 1 et l'île 2. | Palier 2 : 3 contenants à classer (petit/moyen/grand) au lieu de 2, et la question « le moins » (plus exigeante, demande une inhibition) devient plus fréquente. |
| 4 | Comparer les nombres | Au palier le plus difficile, les deux nombres tirés pouvaient être très éloignés (ex. 3 et 97) : comparer de tels nombres ne demande aucune réflexion sur l'ordre de grandeur, l'exercice restait parfois trivial même « au maximum ». | `compareCloseChance(dd)` : à partir du palier 3, une partie des manches force des nombres **voisins** (écart de 1 à 5), ce qui teste réellement la compétence de comparaison. |

## 3. Les 5 paliers (nouveau référentiel commun)

Toute la difficulté est désormais définie dans **un seul fichier**,
`js/difficulty.js`, avec le détail du raisonnement pédagogique en
commentaire pour chaque jeu. Voici le référentiel global :

| Palier | Île | Repère scolaire approximatif | Ce qui change |
|---|---|---|---|
| 1 | 🌊 Lagon | GS / début CP (5-6 ans) | Découverte. Essais illimités, aucun minuteur. |
| 2 | 🌲 Forêt | CP (6-7 ans) | Premiers essais limités (❤️), toujours sans minuteur. |
| 3 | ⛰️ Montagne | fin CP / début CE1 (7-8 ans) | Nombres plus grands, plus d'options ; **le minuteur apparaît**. |
| 4 | 🏰 Château | CE1 (8-9 ans) | Consolidation : mêmes exercices, plus exigeants. |
| 5 | 🌴 Jungle | fin CE1 / début CE2 (9-10 ans) | **Nouveau palier** — le plus avancé du jeu. |

**Avant cette analyse, l'île Jungle avait exactement la même difficulté
que le Château (`diff:4` dans les deux cas)** — elle n'offrait que plus
de butin à collectionner, aucun défi intellectuel supplémentaire.
Elle est maintenant au palier **5**, un vrai cran au-dessus :

- Mémoire : 7 paires (contre 6 au Château)
- Compter : jusqu'à 18 objets (contre 14)
- Trouver l'intrus : 14 images, variante miroir 60 % du temps
- Suite logique : motifs à 8 éléments affichés
- Simon : séquences de 7 couleurs
- Puzzle : suites de 8 nombres, les 4 variantes possibles
- Opérations : calculs jusqu'à 30 (le Château reste à 20)
- Lecture : 5 images proposées, jamais d'image pour deviner le mot
- Déterminants : pluriel une fois sur deux, intrus de l'autre famille
- Volumes : 5 formes à distinguer (contre 4)
- Comparer : nombres jusqu'à 100, proches 60 % du temps
- Monnaie : piles de 3 à 5 pièces (contre 3 à 4)
- Essais : le barème le plus serré de tout le jeu

## 4. Le minuteur de réponse (fluence)

### Pourquoi un minuteur, et pourquoi pas avant

Le programme de cycle 2 introduit explicitement la notion de
**fluence** : à partir du CE1, on ne demande plus seulement de trouver
la bonne réponse, mais de la trouver dans un temps raisonnable (calcul
mental automatisé, lecture courante sans ânonner). C'est une compétence
réelle, pas un gadget — mais elle n'a aucun sens avant le CP, où la
priorité du programme est la **justesse**, jamais la vitesse.

### Règles de conception (pour ne jamais frustrer l'enfant)

1. **Jamais avant le palier 3** (Montagne). Les îles Lagon et Forêt
   restent des espaces d'apprentissage sans aucune pression de temps.
2. **Jamais avant 6 ans**, quel que soit le palier atteint — si un
   enfant de 3-5 ans joue sur un profil avec un âge renseigné, le
   minuteur ne s'active jamais, même s'il se retrouve sur une île
   avancée.
3. **Jamais sur les jeux à plusieurs étapes** (Mémoire, Simon, Puzzle
   des nombres) : ces jeux ont déjà leur propre rythme (retenir une
   séquence, enchaîner plusieurs clics) — un décompte en plus ferait
   double pression sans rien apprendre de plus.
4. **Jamais en multijoueur** (mode chacun son tour, mode course) : ces
   modes ont déjà leur propre dynamique de passage de main ; on ne
   superpose pas un minuteur par-dessus.
5. **Durée toujours généreuse**, calibrée par type de tâche :

   | Jeu | Palier 3 | Palier 4 | Palier 5 |
   |---|---|---|---|
   | Comparer (lecture rapide d'un signe) | 16 s | 14 s | 13 s |
   | Déterminants / Volumes | 16 s | 14 s | 13 s |
   | Compter / Intrus / Suite | 20 s | 18 s | 16 s |
   | Lecture (décoder un mot) | 22 s | 20 s | 18 s |
   | Opérations / Monnaie (calcul à plusieurs termes) | 26 s | 22 s | 20 s |

   Même à la durée la plus courte (13 secondes), le temps reste
   largement supérieur au temps de réponse réel d'un enfant qui
   connaît la réponse — l'objectif est d'encourager la fluence, jamais
   de piéger.
6. **Le temps écoulé ne punit pas plus qu'une mauvaise réponse** :
   il consomme un essai (même système de cœurs ❤️ que les erreurs), le
   jeu affiche un message encourageant (« ⏰ Temps écoulé ! On réessaie
   👀 ») et redonne un temps complet sur la même question. Si tous les
   essais sont épuisés, l'écran « Raté ! » habituel s'affiche — jamais
   de sanction supplémentaire liée spécifiquement au chronomètre.
7. Une **barre visuelle calme** (verte, qui se vide doucement) devient
   orange puis pulse doucement dans les 5 dernières secondes — jamais
   de son strident ni d'animation brusque.

## 5. Proposition : de nouveaux mondes pour aller plus loin

Le jeu compte maintenant 5 paliers (5 îles), ce qui couvre la
progression de la grande section au début du CE2. Pour aller plus loin
sans casser l'équilibre actuel, deux pistes concrètes :

### 🌋 Monde proposé n°6 : « Le Volcan des Génies » (CE2 confirmé, 10-11 ans)

- **Calcul sans support imagé** : au-delà de 30, représenter chaque
  terme par des emojis devient illisible. Il faudrait passer à des
  opérations purement numériques (ex. `47 + 28 = ?`), éventuellement
  avec des **calculs à 3 termes** (`12 + 7 − 5 = ?`).
- **Tables de multiplication simples** (×2, ×5, ×10) : nouvelle
  compétence CE1-CE2, pas encore présente dans le jeu.
- **Lecture de phrases courtes** (et non plus seulement de mots isolés) :
  prolongement naturel du mini-jeu de lecture actuel.
- Nécessite de construire le contenu complet (personnages, objets,
  recettes, décorations) comme pour la Jungle — **travail de contenu
  à part entière**, proposé ici mais pas implémenté dans cette
  passe (décision à confirmer avant de s'y lancer).

### 🏛️ Monde proposé n°7 : « La Cité du Temps » (introduction de nouvelles compétences transversales)

- **Lire l'heure** (horloge à aiguilles) : compétence CP-CE1 du domaine
  « grandeurs et mesures », pas encore couverte.
- **Repères temporels** : jours de la semaine, mois, saisons — domaine
  « explorer le monde » du cycle 1, prolongé en cycle 2.
- Peut se greffer à difficulté modérée (palier 2-3), pour varier les
  compétences travaillées sans nécessairement incarner le point le
  plus difficile du jeu.

**Recommandation** : avant de construire un 6e monde, je suggère de
tester les 5 paliers actuels et le minuteur en situation réelle avec
l'enfant (priorité déjà identifiée dans `TODO.md`), pour calibrer plus
finement les durées et les bornes numériques avant d'investir dans du
nouveau contenu.

---

## 6. Mise à jour (v30) — les deux mondes ont été construits

Les deux propositions ci-dessus ont finalement été implémentées,
légèrement adaptées :

### 🕰️ La Cité du Temps (6e île, niveau 18, palier 5)
Même plafond numérique que la Jungle (palier 5) — ce monde n'ajoute
**pas** de nombres plus grands, mais deux compétences entièrement
nouvelles :
- **Quelle heure est-il ?** (`js/clock.js`) — horloge à aiguilles dessinée
  en CSS. Heures pleines (paliers 1-2) → demi-heures (3-4) → quarts
  d'heure (5-6). Accessible dès 5 ans en heures pleines.
- **Jours, mois, saisons** (`js/calendar.js`) — reconnaître une saison
  (dès la petite section, 3-4 ans, aucune lecture requise) puis, à
  partir du CP confirmé, remettre les jours de la semaine dans l'ordre.
  Jamais de minuteur sur ce jeu : chronométrer la notion de temps qui
  passe serait pédagogiquement absurde.
- 4 personnages : Horace l'horloger, Clio la gardienne du temps, Tic le
  robot-coucou, Nocta la chouette des nuits.

### 🌋 Le Volcan des Génies (7e île, niveau 22, **palier 6, nouveau**)
Le seul mini-jeu du jeu à dépasser le palier 5 :
- **Calcul mental** (`js/calc.js`) — calcul **sans aucun support imagé**
  (à la différence du jeu « Opérations »), nombres jusqu'à 100,
  expressions à 3 termes, et **tables de multiplication (×2, ×5, ×10)**
  à partir du palier 5. Les 11 autres jeux restent plafonnés à leurs
  valeurs du palier 5 sur cette île (`tierValue` plafonne à 5) : rien à
  gagner pédagogiquement à leur donner des nombres encore plus grands.
- 4 personnages : Nova le génie, Léa la savante, Pyra la dragonne de
  lave, Max le robot savant.

### Ce qui n'a pas changé
- Les règles de conception du minuteur (jamais avant le palier 3, jamais
  avant 6 ans, jamais sur les jeux à plusieurs étapes, jamais en
  multijoueur, toujours encourageant) s'appliquent à l'identique aux
  3 nouveaux jeux.
- `gameTypesForAge` a été étendu : « Quelle saison ? » dès 3-4 ans
  (aucune lecture nécessaire), + lecture de l'heure (heures pleines) et
  calendrier dès 5 ans. Le calcul mental reste réservé à 6 ans et plus.
