# Spec : Les compagnons et leurs rôles (indices et équipe) (v52)

> Demande : mettre en avant les compagnons et ce qu'ils apportent au jeu, avec des **rôles différents** (un tuteur, un qui donne des indices quand on en a besoin…).
> Aujourd'hui (v49), les 7 compagnons sont **surtout visuels** : ils ont 6 humeurs, se choisissent sur le profil, servent d'avatar habillable (v43), et disent déjà une phrase d'encouragement quand un mini-jeu monte de niveau (v42).
> **S'appuie sur l'existant :** les progrès par jeu `state.skills` (v41), le niveau propre à chaque mini-jeu et le « soutien » (v42), la pause douce réglée par les parents (v41).

## 1. Vue d'ensemble
- **Dès le départ**, le compagnon choisi par l'enfant est son **compagnon principal** : il **donne des indices** dans tous les mini-jeux. Un bouton 💡 est toujours disponible ; le compagnon le fait briller quand l'enfant semble bloquée. Il y a 2 niveaux d'indice, qui enseignent la méthode, ne donnent jamais la réponse et n'ont aucune pénalité.
- **Au niveau 10**, **l'équipe** s'ouvre. Les autres compagnons se **rencontrent en voyageant**, chacun sur une île, avec une scène d'arrivée qui présente son rôle. L'enfant garde **2 équipiers actifs** en plus du principal.
- Chaque compagnon a une **spécialité**, active quand il est principal (à partir du niveau 10) ou équipier.

## 2. Exigences fonctionnelles

### 2.1 Les indices du compagnon principal (dès le niveau 1)
- **Bouton 💡** dans l'en-tête de chaque mini-jeu, avec la tête du compagnon principal. Il est visible et utilisable à tout moment, pour tous les âges.
- **Proposition douce :** après **une erreur**, ou après **10 secondes sans toucher l'écran** pendant une question, le bouton **brille et se balance**, et le compagnon prend l'humeur « réfléchit ». Il ne parle pas de lui-même, pour ne jamais imposer l'aide.
- **Deux niveaux par question :**
  - **Indice 1 : la piste.** Il rappelle la méthode, à voix haute et avec un geste visuel : « Compte les points un par un », « Regarde la petite aiguille », « Écoute le premier son : /ch/ ».
  - **Indice 2 : le coup de pouce.** Il montre le début du raisonnement : il compte les 3 premiers points avec des numéros, il surligne la petite aiguille et l'heure qu'elle désigne, il découpe le mot en syllabes.
  - Il n'y a **jamais de troisième indice** : la réponse n'est jamais donnée. Le bouton indique alors « Tu peux le faire ! » et le compagnon prend l'humeur « fête ».
- **Anti-devinette :** un indice ne réduit jamais les choix au point de pouvoir deviner. Pas d'élimination de réponse quand il y a moins de 4 choix ; avec 4 choix ou plus, au maximum une élimination, au niveau 2, et il en reste toujours au moins 3. Une nouvelle question (relance) remet les indices à zéro.
- **Aucune pénalité :** les pièces, objets et progression sont identiques avec ou sans indice. Les indices utilisés sont **comptés** dans `state.skills[jeu].hints` (affichés dans l'espace parents, à côté des erreurs), sans jamais être reprochés. **Un indice ne compte pas comme une erreur** pour le niveau adaptatif (v42).
- **Chaque mini-jeu fournit ses indices :** un contrat commun du moteur de mini-jeux (`hintsFor(type)` reçoit la question en cours et renvoie les deux niveaux : texte parlé et effet visuel). Les mini-jeux existants (dont « assembler l'image », v46) ont leurs indices, et les futurs mini-jeux (gigognes, cubes, potions, miroir) doivent en fournir (ajout à la checklist « ajouter un mini-jeu »).
- Les **énigmes d'histoire** et les **boîtes de rangement** (squishies) utilisent aussi le bouton 💡, avec les mêmes règles.

### 2.2 L'équipe (à partir du niveau 10)
- **Ouverture :** au passage au niveau 10, un écran « Ton équipe s'agrandit ! » s'affiche. Le compagnon principal annonce que des amis attendent sur les îles.
- **Rencontres** (une fois par profil, au premier passage sur l'île une fois l'équipe ouverte, ou à la prochaine visite si l'île est déjà connue) :

| Compagnon | Île de rencontre | Spécialité |
|---|---|---|
| 🧜‍♀️ Perle la sirène | Le Lagon | **Conteuse** |
| 🛡️ Léo le chevalier | Le Château | **Tuteur** |
| 🧭 Sam l'explorateur | La Jungle | **Guide** |
| 🦸 Zap le super-héros | La Cité du Temps | **Défis** |
| 🏴‍☠️ Tom le pirate | Le Volcan | **Trésors** |
| 👑 Rose la princesse | Le Pays Squishy | **Collection** |
| 🧚 Lili la fée | Le Monde des Boîtes (saison 2) | **Indices magiques** |
| ☁️ Grisou | Fin de la saison 2 (track Licornes) | **Câlins** |

- Le **compagnon principal** n'a pas de rencontre : il est déjà là. Les rencontres suivent l'ordre du voyage, et le principal est simplement sauté.
- **Scène de rencontre :** le compagnon apparaît en grand, se présente en 2 phrases lues à voix haute (qui il est, ce qu'il fait pour toi), puis une démonstration en image de son rôle. Bouton « Dans mon équipe ! » ou « Plus tard ».
- **Équipe active :** le principal plus **2 équipiers** au maximum. On choisit et on change dans une nouvelle fenêtre **« Mon équipe »**, ouverte en touchant le compagnon dans l'en-tête. Les compagnons rencontrés mais non actifs y restent visibles. On peut aussi changer de principal parmi les rencontrés.
- **Affichage :** les équipiers actifs sont visibles en petit à côté du principal (en-tête, île, bateau de la carte), soit 3 têtes au maximum à l'écran.

### 2.3 Les spécialités
Chaque spécialité est active quand le compagnon est équipier actif, ou quand il est principal et que l'équipe est ouverte (niveau 10 et plus). Le compagnon concerné **apparaît et parle** quand sa spécialité agit, pour que l'enfant associe chaque aide à son compagnon.

- **Lili, Indices magiques :** le bouton 💡 brille plus tôt (5 s au lieu de 10). Le niveau 2 ajoute une animation de paillettes sur l'élément clé. Elle donne aussi des indices pour les énigmes d'histoire même quand elle n'est pas principale.
- **Léo, Tuteur :** il **incarne le jeu adaptatif qui existe déjà** (v42), sans nouvelle règle de difficulté :
  - quand le choix des jeux propose un jeu « à travailler » ou redescendu en « soutien », c'est Léo qui l'annonce : « On s'entraîne ensemble à l'heure ? » ;
  - c'est lui qui dit la phrase de progrès déjà prévue quand un jeu monte de niveau ou n'est plus « à travailler » (« Tu lis l'heure de mieux en mieux ! ») ;
  - avant un jeu en soutien, il rappelle la méthode (son indice 1) avant même la première question ;
  - au maximum 1 annonce par session, pour ne pas lasser.
- **Sam, Guide :** sur l'île et la carte, une bulle avec une flèche indique la prochaine chose utile, par ordre de priorité : une mission du jour à finir, une nouvelle île à visiter, un chapitre d'histoire pas résolu, un personnage jamais aidé. On la touche pour y aller.
- **Zap, Défis :** une fois par jour et par île, il propose un **défi bonus** : le mini-jeu **un cran au-dessus de son niveau adaptatif** (v42), sans dépasser le plafond de l'âge, avec le minuteur si l'âge le permet, et une récompense doublée. Le défi ne fait **ni monter ni descendre** le niveau du jeu. Il est toujours facultatif et refusable sans conséquence.
- **Tom, Trésors :** une fois par jour, après une mission réussie, il « trouve » un trésor : des pièces en bonus ou un objet de l'île. Avec la collection de squishies (v53), il trouve parfois une boîte surprise à la place (comptée dans la limite du jour).
- **Perle, Conteuse :** un bouton « 🔁 Relire » sur les dialogues, consignes et chapitres. Elle lit plus lentement. Dans les mini-jeux de lecture, elle découpe le mot en syllabes au niveau 1 de l'indice.
- **Rose, Collection :** dans le Sac, l'Album, « Mon look » et la chambre à squishies, elle montre ce qui manque et où l'obtenir (« Il te manque le capy dodo : ouvre des boîtes ! », « La plume vient de la Forêt »).
- **Grisou, Câlins :** après 2 erreurs d'affilée, il console (« Ce n'est pas grave, on réessaie ensemble ☁️ »). Quand la **pause douce réglée par les parents** (v41) arrive, c'est Grisou qui l'annonce, avec une petite animation de respiration, à la place du compagnon qui s'endort. Il n'ajoute **aucun minuteur à lui** : la durée reste le réglage des parents.

## 3. Exigences non fonctionnelles
- **Sauvegarde :** `SAVE_VERSION` +1. Nouvel état :
  - `team` : équipe ouverte, compagnons rencontrés, équipiers actifs ;
  - `skills[jeu].hints` : un compteur d'indices ajouté aux progrès existants (v41), sans nouvelle structure de statistiques ;
  - compteurs du jour : défi de Zap, trésor de Tom.
  La migration se fait sans perte. Une partie déjà au niveau 10 ou plus voit l'écran d'ouverture de l'équipe au chargement, et les rencontres arrivent à la prochaine visite de chaque île.
- **Multijoueur :** équipe, statistiques et indices par profil. En mode « chacun son tour », ce sont l'équipe et le compagnon de **l'enfant dont c'est le tour** qui s'affichent.
- **Mode course :** pas d'indices et pas de spécialités pendant une course, pour rester équitable. Le bouton 💡 est masqué.
- **Lisibilité :** 3 compagnons au maximum à l'écran ; une seule spécialité parle à la fois (file d'attente, priorité aux indices).
- **Ton :** jamais de reproche, jamais de « tu as utilisé un indice ».
- **Architecture :** une slice `features/companion-team/` et un contrat d'indices dans `features/minigame-engine/` (voir le refactor A). Grisou compagnon (track Licornes) reçoit la spécialité Câlins.

## 4. Critères d'acceptation
1. Dès le niveau 1, chaque mini-jeu a un bouton 💡 avec la tête du compagnon principal. Il brille après une erreur ou 10 s d'inactivité.
2. Indice 1 puis indice 2, distincts, parlés et visuels ; pas de 3ᵉ ; la règle d'élimination est respectée (vérifiée sur chaque mini-jeu).
3. Les récompenses et le niveau adaptatif sont identiques avec ou sans indice ; les indices sont comptés dans `skills[jeu].hints` et visibles dans l'espace parents.
4. Tous les mini-jeux existants (dont assembler l'image), les énigmes et le rangement fournissent leurs indices (un test parcourt chaque type).
5. Au niveau 10, l'écran d'équipe s'affiche une seule fois ; les rencontres arrivent sur les bonnes îles, le principal est sauté.
6. « Mon équipe » : 2 équipiers au maximum, changement d'équipiers et de principal, conservé après rechargement.
7. Chaque spécialité agit selon sa règle et ses limites (1 par session, 1 par jour, 5 s, un cran au-dessus, pause des parents…), et le compagnon concerné parle.
8. Pas d'indices ni de spécialités en mode course.
9. Une partie migrée garde tout ; une partie déjà au niveau 10 ou plus voit l'ouverture de l'équipe.
10. `npm test` passe, sans aucune erreur JS.

## 5. Hors périmètre
- L'**amitié avec les compagnons** (cœurs, souvenirs) : pour une track future, qui pourra reprendre les cœurs d'amitié des personnages (v47) et la garde-robe (v43).
- Toute nouvelle règle de difficulté : on réutilise le jeu adaptatif (v42).
- La boutique de compagnons, l'achat avec des pièces.
- De nouveaux compagnons, à part Grisou (track Licornes).
