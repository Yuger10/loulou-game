---
status: brouillon        # brouillon | validée | faite ; « validée » est posé par l'humain
issue: 0
size: M                  # la track se livre en 3 phases, chacune une PR de taille M
migration: false
sensitive: true          # index.html et sw.js régénérés par bun run sync (PWA) ; dessins de personnages (demande explicite ci-dessous)
files:
  - js/features/minigames/tens/tens.js
  - js/features/minigames/tens/tens.css
  - js/features/minigames/tens/index.js
  - js/features/minigames/order/order.js
  - js/features/minigames/order/order.css
  - js/features/minigames/order/index.js
  - js/slices.cjs
  - js/app/main.js
  - js/entities/difficulty/difficulty.js
  - js/entities/difficulty/game-types.js
  - js/entities/difficulty/index.js
  - js/features/adaptive/adaptive.js
  - js/features/parents/parents.js
  - js/entities/world/worlds.js
  - js/entities/character/characters.js
  - js/entities/character/characters-art.js
  - js/entities/item/items.js
  - js/entities/squishy/squishies.js
  - js/features/squishies/squishy-room.js
  - js/features/squishies/squishy-art.js
  - js/features/island/island.js
  - js/shared/styles/design-system-v21.css
  - js/features/story/story.js
  - js/features/story/episodes.js
  - js/features/music/music.js
  - test/dumplings.test.js
  - test/smoke.test.js
  - test/games.test.js
  - test/companions.test.js
  - index.html
  - sw.js
taster: { facts: 0, decisions: 0, rounds: 4 }
---

<!-- Gabarit cothon 0.4.0 (setting-up-docs), adopté dans Conductor (cothon 0.2.0-2 et 0.4.0-6) : une nouvelle track part de ce fichier. -->

# Spec : 🥟 L'Île des Squishy Dumplings (saison 3, île 2, idée de la joueuse)

- Nouveau projet : non

L'île : `dumplings`, emoji 🥟, niveau d'ouverture **78**. Règle et tableau de tous les niveaux : `conductor/niveaux.md`. Prérequis : la track `saison3-ouverture` (troisième onglet, archipel 3, prologue, carte de Zap) est livrée ; pour la phase « île », l'île précédente de la saison, `crayons`, est aussi dans `WORLDS`, et la phase 0 de la track `squishy-boites` (dessins des squishies déplacés dans `js/features/squishies/squishy-art.js`) est livrée. Checklists suivies en entier : [checklist-ile.md](../../checklist-ile.md) et [checklist-mini-jeu.md](../../checklist-mini-jeu.md).

## Problème

La joueuse (6 ans) a demandé une île des squishy dumplings, et de « ranger dans des boîtes ». Le jeu n'a aucun exercice de valeur de position (dizaines et unités, puis centaines), cœur du programme de CP et de CE1 : `packs` fait compter par paquets de 2, 5 ou 10, `count` dénombre un par un jusqu'à 18. Elle aime aussi les jeux de mémoire, et il n'en existe que deux (`memory`, `simon`). Cette île apporte une cuisine à vapeur pleine de raviolis tout mous et souriants, un jeu de rangement en paniers de dix (les maths) et un jeu de commande à retenir (la mémoire), avec le deuxième chapitre de la carte au trésor de Zap.

## Comportement attendu

### Mini-jeu `tens` « Les paniers de dix » (phase 1)

1. Étant donné le jeu inscrit, quand on ouvre « choisir un jeu », alors il figure dans `GAME_LIST` avec l'emoji 🧺 et le nom « Les paniers de dix », proposé dès 5 ans (tranche `max: 5` de `AGE_GAME_TYPES`, donc aussi à 6 ans et plus), jamais à 4 ans.
2. Étant donné `tensRound(dd)` dans `difficulty.js`, quand on le lit pour les paliers 1 à 5, alors il rend, à `toEqual` près, l'objet littéral du palier donné dans T1 (toutes les clés sont présentes à chaque palier ; une option sans objet vaut `0` ou `false`, jamais une clé absente).
3. Étant donné le palier 1 (mode `build`), quand le jeu s'ouvre, alors 11 à 19 dumplings sont posés en vrac (`.tens-heap .tens-dumpling`, chacun avec `data-id` de 0 à n − 1), un panier vide (`.tens-basket`, 10 `.tens-cell` en 2 rangées de 5) est dessiné, l'assiette des tout seuls (`.tens-loose`) est vide, et les réponses (`.tens-opt`) sont dans la page mais cachées (attribut `hidden` sur `.tens-options`). Contrat DOM complet : C1.
4. Étant donné le mode `build`, quand l'enfant touche un dumpling en vrac, alors cet élément (même `data-id`) quitte `.tens-heap` pour la première `.tens-cell` libre du panier ; quand les 10 cases sont prises, le panier reçoit la classe `full` et les dumplings suivants vont dans `.tens-loose`. Toucher un dumpling n'est jamais une erreur.
5. Étant donné le mode `build`, quand le dernier dumpling en vrac est rangé, alors `.tens-options` perd `hidden`, la consigne affichée devient « Combien de dumplings en tout ? » et la voix dit « Un panier de dix, et {qty(u, 'tout seul', 'tout seuls')}. Combien de dumplings en tout ? » (u = n − 10, de 1 à 9 ; accord : règle R3).
6. Étant donné les modes `read` (lire) et `build`, quand on compte les réponses, alors il y en a 3 aux paliers 1 et 2, 4 aux paliers 3 à 5, toutes différentes, toutes entre 1 et la borne B de R1 (99 aux paliers 1 à 4, 999 au palier 5), une seule juste, construites par la règle R1.
7. Étant donné le mode `read`, quand le jeu s'ouvre, alors la scène (C1) montre des piles (`.tens-pile`, palier 5 seulement), des paniers pleins (`.tens-basket.full`) et des dumplings tout seuls (`.tens-loose .tens-dumpling`) ; 100 × (nombre de `.tens-pile`) + (nombre de `.tens-dumpling` dans `#tens-stage`) est le nombre à trouver.
8. Étant donné le mode `make` (construire), quand le jeu s'ouvre, alors le nombre cible est écrit en grand (`#tens-target`, `data-target`) et dit (T12) ; la scène (C1) est vide ; les boutons `#tens-add10` (🧺 +10), `#tens-add1` (🥟 +1), `#tens-undo` (↩️), `#tens-ready` (✅ C'est prêt !) et, au palier 5 seulement, `#tens-add100` (🗼 +100) sont présents. Aucun total n'est affiché pendant la construction.
9. Étant donné le mode `make`, quand le 10ᵉ dumpling tout seul est ajouté, alors les 10 deviennent un panier plein (voix « Dix dumplings : hop, un panier plein ! ») ; au palier 5, quand le 10ᵉ panier est ajouté, ils deviennent une pile (voix « Dix paniers : hop, une pile de cent ! »). Le plafond est 99 aux paliers 2 à 4 et 999 au palier 5 : un bouton `+100`, `+10` ou `+1` dont l'ajout dépasserait le plafond ne fait rien (pas de secousse ni de phrase : le jeu n'a pas de réaction prévue pour un bouton sans effet ; défaut de Claude, à juger à la revue par Amrou). Par exemple, à 9 paniers et 9 tout seuls hors palier 5, `#tens-add1` et `#tens-add10` ne font rien.
10. Étant donné le mode `make`, quand l'enfant touche ↩️, alors l'état d'avant le dernier ajout revient exactement (regroupement compris) ; sans rien à enlever, rien ne se passe.
11. Étant donné le mode `make`, quand l'enfant touche « C'est prêt ! » sans rien avoir posé, alors la voix dit « Ajoute d'abord des paniers ou des dumplings ! » et aucun essai n'est perdu ; avec le bon total, la mission est gagnée (`stepOk`, `winSoon()`) ; avec un autre total, c'est une erreur.
12. Étant donné le mode `write` (écrire), quand le jeu s'ouvre, alors l'écriture de la table T2 est affichée en grand (`#tens-expr`) et dite, et les réponses sont construites par R1.
13. Étant donné une mauvaise réponse (bouton de réponse ou « C'est prêt ! »), quand elle est donnée, alors `loseLife(…, { onRetry: renderTens })` relance une **autre** question : le couple (mode, nombre) diffère du précédent.
14. Étant donné une bonne réponse dans un mode à choix, alors `stepOk` puis `winSoon()` : une question par mission, comme `packs`.
15. Étant donné le jeu, alors il n'a jamais de minuteur (`NO_TIMER_KINDS`), ses essais suivent le barème `generous` (`GENEROUS_KINDS` de `livesFor`), il est dans le groupe `nombres` de `SKILL_GROUPS` et a sa phrase dans `PROGRESS_CHEERS` : « Tu ranges les nombres en dizaines de mieux en mieux ! ».
16. Étant donné un enfant de 6 ans en solo, sans classe choisie ni défi étoile (track `aller-plus-loin`), quand il joue sur une île au palier 6, alors `gameDiff()` rend au plus 2 (plafond de l'âge), donc les modes `read` et `make` jusqu'à 69.
17. Étant donné `gameSolution`, alors : en `build`, chaque dumpling en vrac (`.tens-heap .tens-dumpling[data-id=…]`, du plus petit `data-id` au plus grand) puis la bonne réponse (`.tens-opt[data-v=…]`) ; en `read` et `write`, la bonne réponse ; en `make`, `#tens-add100` × c (palier 5), `#tens-add10` × d, `#tens-add1` × u, puis `#tens-ready`, où c, d, u sont les chiffres de `data-target`.
18. Étant donné les indices, quand on touche 💡, alors on obtient les deux niveaux de la table T3, jamais la réponse ; seul le niveau 2 en mode à 4 choix écarte une réponse (`fx.dim`), le piège le plus éloigné de la bonne réponse.

### Mini-jeu `order` « La commande du chef » (phase 2)

19. Étant donné le jeu inscrit, alors il figure dans `GAME_LIST` avec l'emoji 🥟 et le nom « La commande du chef », proposé dès 5 ans (tranche `max: 5`), jamais à 4 ans.
20. Étant donné `orderRound(dd)`, quand on le lit pour les paliers 1 à 5, alors il rend, à `toEqual` près, l'objet littéral du palier donné dans T4.
21. Étant donné un palier, quand le jeu tire une commande, alors elle a `kinds` sortes différentes, chacune de 1 à 3 dumplings, un total entre `min` et `max`, et chaque sorte n'utilise que les attributs actifs du palier (les autres prennent la valeur par défaut : forme `rond`, visage `sourit`).
22. Étant donné le jeu ouvert, alors un client (emoji tiré de 🐰 🦊 🐻 🐨 🐸 🐧) montre son ticket (`#order-ticket`, un dessin par dumpling, `.order-item` avec `data-color`, `data-shape`, `data-face`) et la voix dit la phrase de la règle R2. Le plateau et la palette sont déjà dans la page mais cachés (`hidden`).
23. Étant donné la phase « voir », quand l'enfant touche `#order-ready` (« 👍 J'ai retenu ! »), alors le ticket se cache, la palette (`#order-palette`, boutons `.order-pick` avec les mêmes `data-*`) et le plateau (`#order-plate`) apparaissent, et la voix dit « À toi ! Prépare la commande, puis touche la cloche. ». Il n'y a aucun compte à rebours : c'est l'enfant qui décide quand il a retenu.
24. Étant donné la phase « préparer », quand l'enfant touche un dumpling de la palette, alors une copie se pose sur le plateau (8 au plus ; au-delà, voix « Le plateau est plein ! ») ; toucher un dumpling du plateau (`.order-placed`) le retire. Ces gestes ne sont jamais des erreurs.
25. Étant donné la palette, alors elle contient `palette` sortes (T4) : toutes celles de la commande, puis des sortes qui diffèrent d'une commandée par **un seul** attribut actif tant qu'il en existe, puis d'autres au hasard, toutes différentes, mélangées.
26. Étant donné `#order-serve` (« 🛎️ Servir »), quand le plateau est vide, alors la voix dit « Ton plateau est vide : ajoute des dumplings ! » sans perte d'essai ; quand le plateau contient exactement la commande (mêmes sortes, mêmes quantités, l'ordre ne compte pas), alors `stepOk`, voix « Miam ! C'est exactement ma commande ! », `winSoon()` ; sinon `loseLife(serveBtn, { disable: false, onRetry: renderOrder })` relance une **autre** commande : sa signature (les couples sorte et quantité, triés) diffère de celle de la commande précédente ; on tire au plus 20 fois, puis on garde le dernier tirage (jamais atteint en pratique : il existe au moins 9 commandes par palier, table T4).
27. Étant donné le jeu, alors il n'a jamais de minuteur (`NO_TIMER_KINDS`), ses essais sont `LIVES_TABLE.order = { 2: 3, 3: 3, 4: 2, 5: 2 }` (le barème de Simon), il est dans le groupe `logique` de `SKILL_GROUPS` et a sa phrase dans `PROGRESS_CHEERS` : « Tu retiens les commandes de mieux en mieux ! ».
28. Étant donné `gameSolution`, alors : `#order-ready`, puis un `.order-pick[data-k=…]` par dumpling commandé, puis `#order-serve`.
29. Étant donné les indices, alors ils suivent la table T5 : le niveau 2 en phase « préparer » remontre le ticket un instant (comme Simon rejoue sa suite), jamais il ne pose les dumplings à la place de l'enfant.

### L'île (phase 3)

30. Étant donné `WORLDS.dumplings`, alors il vaut exactement l'entrée de la table T6 (niveau 78, `saison: 3`, `diff: 6`), juste après `crayons` dans `worldsOf(3)` (test : `worldsOf(3).indexOf('dumplings') === worldsOf(3).indexOf('crayons') + 1`, vrai aussi quand les îles suivantes arrivent), et sa position tient dans le cadre sans chevaucher une autre île de la saison 3 (`test/smoke.test.js`).
31. Étant donné le niveau 77, alors l'île est verrouillée ; en atteignant le niveau 78, elle s'ouvre avec le chapitre « Le deuxième morceau de la carte » puis l'écran habituel de nouvelle île.
32. Étant donné l'île, alors `charsOf('dumplings')` rend les 4 personnages de la table T7, chacun avec 2 objets de butin de l'île et 3 répliques, et `favoritesOf` rend pour chacun 2 objets de l'île hors de son butin.
33. Étant donné les objets, alors `ITEMS` contient les 8 objets de T8 (`world: 'dumplings'`), dont 3 donnés par personne, `CRAFTED` les 2 recettes de T8 (ingrédients tous de l'île) et `decosOf('dumplings')` les 5 décorations de T8.
34. Étant donné le thème, alors la CSS du manifeste contient `body[data-world="dumplings"]` avec les 5 variables de T6, `ISLE_SCENERY.dumplings(WORLDS.dumplings)` rend un SVG qui contient `<rect` et `<path`, et `MUSIC_THEMES.dumplings` vaut l'entrée de T6.
35. Étant donné les squishies, alors `SQUISHY_SERIES.dumplings` existe (`world: 'dumplings'`), `squishiesOf('dumplings')` rend les 6 modèles de T9 (4 communs, 1 rare, 1 ✨), chacun a son dessin dans `SQ_ART` (`squishyArtSVG(id)` rend une chaîne non vide qui contient `<svg`, pour les 6 ids ; sans entrée elle rend une chaîne vide, `js/features/squishies/squishy-room.js:630`), `SQUISHY_ISLAND_SERIES.dumplings === 'dumplings'` et `SQ_BOX_COLORS.dumplings` vaut `['#DDF0D6', '#3F7A4A']`.
36. Étant donné le chapitre `STORY.dumplings` (T10), quand il s'ouvre, alors il montre `.story-zapmap svg.zap-map` (pas `.story-grisou`) ; quand une mauvaise réponse est touchée, alors une autre énigme de l'île est posée.
37. Étant donné `state.coins = 0`, `state.storySolved = { crayons: true }` et `storyWin('dumplings')`, quand on le joue, alors on gagne 16 pièces et une boîte de la série `dumplings`, `state.storySolved.dumplings === true` et `zapMapPieces() === 2`. La fenêtre de victoire, construite par la track `saison3-ouverture` pour tout chapitre de la saison 3 (`zapMapSVG(zapMapPieces(), { fresh: world })`), montre `.story-zapmap.happy svg.zap-map[data-found="2"]` avec le morceau `dumplings` en classe `zm-new`, et la voix ajoute `zapMapSay(2)` à la phrase de victoire. Cette track n'écrit aucun code de carte : elle le consomme tel quel. Un second `storyWin` ne redonne ni les pièces ni la boîte. Rien d'autre n'est stocké pour le morceau : il est gagné quand `state.storySolved.dumplings` est vrai.
38. Étant donné les épisodes `EPISODES.dumplings` (T11), alors il y en a 3, après la 2ᵉ, la 4ᵉ et la 7ᵉ mission réussie sur l'île, racontés par `bambou`, `sesame`, `theo` (jamais par le guide `bao`), et relisibles dans « 📖 Mon histoire ».
39. Étant donné `worldGame('dumplings', age)`, alors il rend `'tens'` à tout âge ; un joueur de 4 ans ne se le voit pas proposer (filtre de l'âge existant).

### Tables de données

**T1 : `tensRound(dd)`** (paliers 1 à 5, par `tierValue`). Objets renvoyés, à l'identique :

```js
1: { modes: { build: 1 }, min: 11, max: 19, choices: 3, zero: false, looseBig: 0, unitsFirst: 0, shuffled: 0, hundreds: false },
2: { modes: { read: 0.5, make: 0.5 }, min: 20, max: 69, choices: 3, zero: false, looseBig: 0, unitsFirst: 0, shuffled: 0, hundreds: false },
3: { modes: { read: 0.35, make: 0.35, write: 0.3 }, min: 20, max: 99, choices: 4, zero: true, looseBig: 0, unitsFirst: 0, shuffled: 0, hundreds: false },
4: { modes: { read: 0.35, make: 0.3, write: 0.35 }, min: 20, max: 99, choices: 4, zero: true, looseBig: 0.5, unitsFirst: 0.5, shuffled: 0, hundreds: false },
5: { modes: { read: 0.35, make: 0.3, write: 0.35 }, min: 100, max: 999, choices: 4, zero: true, looseBig: 0, unitsFirst: 0, shuffled: 0.3, hundreds: true },
```

Repères : palier 1 GS et début CP, 2 CP, 3 fin CP et CE1, 4 CE1, 5 fin CE1 et CE2. `modes` : chance de chaque mode (tirée par `random()`) ; `min`/`max` : bornes du nombre n ; `choices` : nombre de réponses ; `zero` : un chiffre 0 est-il permis ; `looseBig` : chance, en `read`, d'avoir 10 à 19 tout seuls ; `unitsFirst` : chance, en `write`, d'écrire les unités d'abord ; `shuffled` : chance, en `write` au palier 5, d'un ordre mélangé ; `hundreds` : piles de cent et bouton `+100`.

**Tirage du nombre, mode par mode** (n uniforme dans [`min`, `max`], puis on retire au plus 20 fois tant que la règle n'est pas tenue ou que (mode, n) égale la question précédente ; au-delà, mode `read` et le premier n valide) :
- `build` : n de 11 à 19 (le chiffre des unités n'est jamais 0).
- `read` et `make` : si `zero` est faux (palier 2), le chiffre des unités n'est pas 0 (jamais un multiple de 10). Si `zero` est vrai, les unités peuvent valoir 0 (paliers 3 à 5) et, au palier 5, les dizaines aussi (305, 300).
- `read` avec `looseBig` (palier 4) : nombre de paniers de 1 à 8 et tout seuls de 10 à 19, tirés à part ; n est leur total (20 à 99, toujours valide). Les pièges de R1 se calculent sur les chiffres de n.
- `write` : au moins 2 termes non nuls. Aux paliers 3 et 4, les unités ne sont jamais 0 ; au palier 5, au moins un des chiffres des dizaines et des unités n'est pas 0.

**T2 : écritures du mode `write`** (n = c centaines, d dizaines, u unités ; un terme nul est omis, au moins 2 termes, sinon on tire un autre nombre).

| Palier | Affiché | Dit |
|---|---|---|
| 3 | `30 + 5` | « 30 plus 5. Quel nombre ça fait ? » |
| 4 | `30 + 5`, ou `5 + 30` (chance `unitsFirst`) | idem, dans l'ordre affiché |
| 5 | `300 + 40 + 5`, ou un ordre mélangé (chance `shuffled`) | « 300 plus 40 plus 5. Quel nombre ça fait ? » |

**R1 : les réponses** (modes `build`, `read`, `write`). La bonne réponse n, puis les pièges du palier, dans l'ordre donné, en gardant les premiers valides jusqu'à `choices` réponses ; s'il en manque, le repli essaie n + 2, n − 2, n + 3, n − 3… dans cet ordre, en gardant les valides ; puis mélange. Valide : un entier de 1 à B (B = 99 aux paliers 1 à 4, 999 au palier 5), différent de n et des réponses déjà gardées. Chiffres : c centaines, d dizaines, u unités de n (pour `read` avec `looseBig`, ceux de n, pas ceux du dessin). Un piège avec une condition non remplie est sauté.

| Palier | Pièges, dans l'ordre (condition) | Exemple |
|---|---|---|
| 1 | objets d + u (l'erreur de qui compte le panier pour 1) ; n + 1 ; n − 1 | n = 14 : 5, 15 (13 non gardé, 3 réponses atteintes) |
| 2 | inversion 10u + d (si u ≠ 0 et u ≠ d) ; objets d + u ; n + 1 ; n − 1 ; n + 10 ; n − 10 | n = 34 : 43, 7 ; n = 33 : 6, 34 (inversion sautée) |
| 3 et 4 | inversion 10u + d (si u ≠ 0 et u ≠ d) ; n + 10 ; n − 10 ; n + 1 ; objets d + u ; n − 1 | n = 34 : 43, 44, 24 ; n = 30 : 40, 20, 31 (inversion sautée, « 03 » n'est pas un nombre à deux chiffres) ; n = 33 : 43, 23, 34 |
| 5 | échange dizaines et unités 100c + 10u + d (si u ≠ d) ; échange centaines et dizaines 100d + 10c + u (si d ≠ 0 et d ≠ c) ; n + 100 ; n + 10 ; n + 1 ; n − 10 | n = 345 : 354, 435, 445 ; n = 305 : 350, 405, 315 ; n = 300 : 400, 310, 301 ; n = 950 : 905, 590, 960 (n + 100 > 999, sauté) |

Aux bornes de chaque palier (test dédié, `test/dumplings.test.js`) :
- palier 1 : n = 11 : 2, 12 ; n = 19 : 10, 20.
- palier 2 (n de 21 à 69, jamais un multiple de 10) : n = 21 : 12, 3 ; n = 69 : 96, 15.
- paliers 3 et 4 : n = 20 : 30, 10, 21 (inversion sautée) ; n = 99 : 89, 18, 98 (inversion sautée car u = d, n + 10 et n + 1 dépassent 99).
- palier 5 : n = 100 : 200, 110, 101 (les deux échanges sautés) ; n = 999 : 989 seul piège valide, puis le repli donne 997 et 996 (n + 2 et n + 3 dépassent 999).

Les boutons montrent le nombre en grand, sans points (au-delà de 12 les points de `packDots` ne s'affichent pas, `packs.js:68`).

**R3 : accord des quantités dites** (tous les modes, les indices et les phrases de `tens`). `qty(k, singulier, pluriel)` rend `{k} {singulier}` si k = 1, `{k} {pluriel}` si k ≥ 2 ; un groupe à 0 n'est jamais dit : `qty` n'est jamais appelée avec 0. Les cas de T3 garantissent que le groupe nommé n'est pas vide (aux paliers 2 à 4, n ≥ 20 donne d ≥ 1, et d ≥ 2 hors `looseBig` ; au palier 5, c ≥ 1) ; un groupe vide plus petit est couvert par « Ajoute le reste ! » ou par la ligne « seuls » de T3, jamais par « 0 paniers ». Formes : « 1 panier » / « 2 paniers », « 1 pile » / « 2 piles », « 1 dumpling » / « 2 dumplings », « 1 tout seul » / « 2 tout seuls ». Les nombres de `tens` s'écrivent en chiffres dans le texte passé à `speak` (la voix les lit) ; seules les phrases fixes écrites en lettres dans cette spec restent en lettres (« Un panier de dix », « Dix dumplings »).

**T3 : indices de `tens`** (niveau 1 = la méthode, niveau 2 = le début du raisonnement, jamais le total ; accords par R3). « Groupes » : piles (100), paniers pleins (10), tout seuls (1), du plus grand au plus petit, seulement ceux qui ne sont pas vides. Les indices de `read` décrivent **les groupes dessinés** : P piles, p paniers pleins, t tout seuls comptés sur la scène, jamais les chiffres de n. Avec `looseBig` (palier 4), 33 peut être dessiné en 2 paniers et 13 tout seuls : l'indice dit « 2 paniers, ça fait 20. Ajoute le reste ! », et R3 s'applique à p et t (p de 1 à 8, donc « 1 panier » possible ; t de 10 à 19, jamais 0, donc la ligne « paniers seuls » ne vaut jamais avec `looseBig`). Variantes vérifiées : palier 2 (p ≥ 2, t ≥ 1) ; paliers 3 et 4 sans `looseBig` (p ≥ 2, t de 0 à 9) ; palier 4 avec `looseBig` (p ≥ 1, t ≥ 10) ; palier 5 (P ≥ 1, p et t de 0 à 9) : chaque variante tombe sur exactement une ligne ci-dessous.

| Mode | Niveau 1 (`say`, `fx`) | Niveau 2 (`say`, `fx`) |
|---|---|---|
| `build`, rangement pas fini | « Touche chaque dumpling : il saute dans le panier. Un panier, c'est dix places. » ; `glow: '.tens-heap'` | « Regarde : il reste des places dans le panier. Remplis-le d'abord ! » ; `glow` sur la première `.tens-cell` vide |
| `build`, rangé, u ≥ 2 | « Un panier plein, c'est dix. Compte dix, puis continue avec ceux qui sont tout seuls. » ; `glow: '.tens-basket'` | « Après dix, on dit onze, douze… Continue ! » ; `marks` : « 11 » sur le premier `.tens-loose .tens-dumpling` |
| `build`, rangé, u = 1 | idem | « Compte avec ton doigt : dix pour le panier, puis le tout seul. » ; `glow: '.tens-loose'` |
| `read`, paliers 2 à 4, des tout seuls à l'écran (t ≥ 1) | « Compte les paniers de dix en dix, puis ajoute les dumplings tout seuls. » ; `glow: '#tens-stage'` | « {qty(p, 'panier', 'paniers')}, ça fait {10 × p}. Ajoute le reste ! » ; `fx.html` : la bande `{10 × p} + ? = ?` ; `dim` aux paliers 3 et 4 |
| `read`, paliers 3 et 4, paniers seuls (t = 0) | « Compte les paniers de dix en dix. » ; `glow: '#tens-stage'` | « Compte de dix en dix avec moi : 10, 20… Continue ! » ; `marks` : « 10 » et « 20 » sur les 2 premiers paniers ; `dim` |
| `read`, palier 5, un autre groupe que les piles à l'écran (p ≥ 1 ou t ≥ 1) | « Compte d'abord les piles de cent, puis les paniers de dix, puis ceux qui sont tout seuls. » ; `glow: '#tens-stage'` | « {qty(P, 'pile', 'piles')}, ça fait {100 × P}. Ajoute le reste ! » ; `fx.html` : la bande `{100 × P} + ? = ?` ; `dim` |
| `read`, palier 5, piles seules (p = 0 et t = 0) | idem | P ≥ 2 : « Compte de cent en cent avec moi : 100, 200… Continue ! », `marks` « 100 » et « 200 » sur les 2 premières piles ; P = 1 : « Une pile, c'est dix paniers de dix dumplings. » ; `dim` |
| `make`, au moins 2 chiffres non nuls | « Le premier chiffre dit combien de paniers. Le dernier dit combien de dumplings tout seuls. » (palier 5 : « Le premier chiffre dit combien de piles, le deuxième combien de paniers, le dernier combien de tout seuls. ») ; `glow: '#tens-target'` | « Dans {n}, le premier chiffre est {x}. Commence par mettre {qty(x, 'panier', 'paniers')}. » (palier 5 : `qty(x, 'pile', 'piles')`) ; `glow: '#tens-add10'` (palier 5 : `#tens-add100`) |
| `make`, un seul chiffre non nul (30, 300) | idem | 30 : « Le dernier chiffre est 0 : pas de dumpling tout seul. Combien de paniers ? » ; 300 : « Les deux derniers chiffres sont 0 : ni panier, ni tout seul. Combien de piles ? » ; `glow: '#tens-target'` |
| `write`, paliers 3 et 4 | « Regarde chaque morceau : le plus grand te donne les dizaines, le petit les unités. » ; `glow: '#tens-expr'` | « {10 × d}, c'est {qty(d, 'panier', 'paniers')} de dix. Combien de tout seuls en plus ? » ; `fx.html` : d paniers dessinés ; `dim` |
| `write`, palier 5 | « Regarde chaque morceau : les centaines, les dizaines, puis les unités. » ; `glow: '#tens-expr'` | « {100 × c}, c'est {qty(c, 'pile', 'piles')} de cent. Ajoute le reste ! » ; `fx.html` : c piles dessinées ; `dim` (le palier 5 a toujours un autre terme non nul, T1) |

**T4 : `orderRound(dd)`** (par `tierValue`). Objets renvoyés, à l'identique :

```js
1: { kinds: 1, min: 1, max: 3, attrs: ['color'], colors: ['rose', 'vert', 'jaune'], palette: 3 },
2: { kinds: 2, min: 3, max: 4, attrs: ['color'], colors: ['rose', 'vert', 'jaune', 'violet'], palette: 4 },
3: { kinds: 2, min: 3, max: 5, attrs: ['color', 'shape'], colors: ['rose', 'vert', 'jaune'], palette: 6 },
4: { kinds: 3, min: 4, max: 6, attrs: ['color', 'shape'], colors: ['rose', 'vert', 'jaune'], palette: 6 },
5: { kinds: 3, min: 5, max: 6, attrs: ['color', 'shape', 'face'], colors: ['rose', 'vert', 'jaune', 'violet'], palette: 8 },
```

Commandes distinctes possibles (sortes choisies et quantités) : palier 1, 3 × 3 = 9 ; palier 2, 6 paires de couleurs × 5 répartitions = 30 ; palier 3, 15 paires de sortes × 7 = 105 ; palier 4, 20 triplets × 16 = 320 ; palier 5, 560 triplets × 13 = 7 280.

`kinds` : sortes commandées ; `min`/`max` : total de dumplings ; `attrs` : attributs actifs ; `colors` : couleurs possibles ; `palette` : sortes proposées.

Formes : `rond` (bao tout rond, plis sur le dessus) et `lune` (demi-lune, plis sur le bord). Visages : `sourit` (yeux ouverts, sourire) et `dort` (yeux fermés en arcs). Couleurs : remplissage et bord de `SQ_COLORS` (`js/entities/squishy/squishies.js`). Clé d'une sorte : `data-k="{color}-{shape}-{face}"`.

**R2 : la phrase du client.** « Bonjour ! Je voudrais {liste}, s'il te plaît ! ». La liste joint les sortes par « et » (2 sortes) ou par « , » puis « et » (3 sortes). Une sorte : `{un | deux | trois} dumpling(s) {couleur}{forme}{visage}`, avec la couleur accordée au masculin (`SQ_COLORS[c].adj[0]` au singulier, `adj[1]` au pluriel), la forme dite seulement si `shape` est actif (« tout rond » ou « tout ronds » ; « en demi-lune ») et le visage seulement si `face` est actif (« qui sourit » ou « qui sourient » ; « qui dort » ou « qui dorment »). Exemple : « Bonjour ! Je voudrais deux dumplings roses et un dumpling vert, s'il te plaît ! ».

**T5 : indices de `order`.**

| Phase | Niveau 1 | Niveau 2 |
|---|---|---|
| voir | « Regarde bien : quelles sortes, et combien de chaque ? Dis-le tout bas, puis touche « J'ai retenu ». » ; `glow: '#order-ticket'` | Paliers 1 et 2 : « Commence par celle-ci : retiens sa couleur, et combien il y en a. » ; paliers 3 et 4 : « Commence par celle-ci : retiens sa couleur, sa forme, et combien il y en a. » ; palier 5 : « Commence par celle-ci : retiens sa couleur, sa forme, son visage, et combien il y en a. » ; `glow` sur les `.order-item` de la première sorte |
| préparer | « Souviens-toi : quelles sortes de dumplings, et combien de chaque ? Pose-les un par un sur le plateau. » ; `glow: '#order-palette'` | « Je te remontre la commande un petit instant. Regarde bien ! » ; `fx.run` : le ticket réapparaît 3 s aux paliers 1 et 2, 2 s ensuite, puis se cache |

La phase est lue au moment où l'indice est demandé (`q.phase`, comme `memoryHints` lit l'état des cartes, `memory.js:107`).

**T12 : consignes (`gameHeader(titre, consigne affichée, phrase dite)`) et provenance des autres phrases.** Accords par R3 ; nombres en chiffres.

| Jeu, mode ou phase | Titre | Consigne affichée | Phrase dite |
|---|---|---|---|
| `tens`, `build` | 🧺 Les paniers de dix | Range les dumplings dans le panier ! | « Touche chaque dumpling pour le ranger dans le panier. Un panier, c'est dix places ! » ; une fois tout rangé : consigne « Combien de dumplings en tout ? » et phrase du comportement 5 |
| `tens`, `read`, paliers 2 à 4 | 🧺 Les paniers de dix | Combien de dumplings en tout ? | « Les dumplings sont rangés par paniers de dix. Combien y en a-t-il en tout ? » |
| `tens`, `read`, palier 5 | 🧺 Les paniers de dix | Combien de dumplings en tout ? | « Une pile, c'est dix paniers : cent dumplings. Combien y en a-t-il en tout ? » |
| `tens`, `make`, paliers 2 à 4 | 🧺 Les paniers de dix | Prépare {n} dumplings | « Le client veut {n} dumplings. Prépare-les avec des paniers de dix et des dumplings tout seuls, puis touche « C'est prêt ». » |
| `tens`, `make`, palier 5 | 🧺 Les paniers de dix | Prépare {n} dumplings | « Le client veut {n} dumplings. Prépare-les avec des piles de cent, des paniers de dix et des dumplings tout seuls, puis touche « C'est prêt ». » |
| `tens`, `write` | 🧺 Les paniers de dix | {écriture affichée} = ? | la phrase de T2 |
| `order`, phase « voir » | 🥟 La commande du chef | Retiens la commande ! | la phrase R2 |
| `order`, phase « préparer » | (inchangé) | Prépare la commande | « À toi ! Prépare la commande, puis touche la cloche. » |

Phrases propres aux jeux : celles des comportements 5, 9, 11 (`tens`), 23, 24, 26 (`order`), et les indices T3 et T5. Phrases du moteur, inchangées : après une erreur, `loseLife` dit une phrase de `WRONG_HINTS` (`js/features/screen/screen.js:14-22`) et montre « n essais restants » ; la mission ratée et l'écran de victoire viennent de `onMissionFail` et `onMissionWin` (`js/features/minigame-engine/engine.js:335`, `engine.js:391`). `tens` n'a pas de phrase de victoire à lui (`stepOk` puis `winSoon()`, comme `packs`) ; `order` dit « Miam ! C'est exactement ma commande ! » avant `winSoon()`.

**C1 : contrat DOM de `tens`** (le solveur de `test/games.test.js` compte ces éléments).
- Toujours : `#tens-stage.tens-stage[data-mode="build|read|make|write"]` contient, dans cet ordre, `.tens-piles`, `.tens-baskets`, `.tens-loose` (chacun présent, éventuellement vide) ; `.tens-heap` seulement en `build`.
- `.tens-pile` (dans `.tens-piles`, `data-v="100"`) : un seul dessin SVG de 10 paniers empilés ; il ne contient **aucun** `.tens-basket` ni `.tens-dumpling`.
- `.tens-basket` (dans `.tens-baskets`) : 10 `.tens-cell` ; il a la classe `full` quand ses 10 cases ont chacune un `.tens-dumpling`. Hors `build`, un panier affiché est toujours plein.
- `.tens-dumpling` : un dumpling dessiné ; dans `.tens-heap` (vrac, `build`, avec `data-id`), dans une `.tens-cell`, ou dans `.tens-loose` (tout seuls).
- Total montré par la scène = 100 × (nombre de `.tens-pile`) + (nombre de `.tens-dumpling` dans `#tens-stage`).
- `build` : au départ n dumplings dans `.tens-heap`, un `.tens-basket` vide dans `.tens-baskets`, `.tens-loose` vide (c'est l'assiette des tout seuls, dans `#tens-stage`), `.tens-options[hidden]` qui contient les `.tens-opt[data-v]`. Un toucher déplace l'élément lui-même (même classe `.tens-dumpling`, même `data-id`) de `.tens-heap` vers la première `.tens-cell` libre ; dès que la 10ᵉ case est prise (10ᵉ toucher), le panier reçoit `full` ; les touchers suivants le déplacent dans `.tens-loose`. Seuls les dumplings de `.tens-heap` réagissent au toucher : un dumpling rangé n'est plus touchable (son handler l'ignore). Quand `.tens-heap` est vide, `.tens-options` perd `hidden`. Le total de la scène reste n pendant tout le rangement.
- `read` : piles, paniers pleins et tout seuls du nombre ; `.tens-options` visible avec les `.tens-opt[data-v]`.
- `make` : scène vide au départ, redessinée après chaque bouton à partir de l'état { piles, paniers, tout seuls } (mêmes classes que `read`) ; `#tens-target[data-target]`, `.tens-tools` avec les boutons du comportement 8 ; pas de `.tens-opt`.
- `write` : scène vide ; `#tens-expr[data-terms="300,40,5"]` (les termes dans l'ordre affiché) ; `.tens-options` visible avec les `.tens-opt[data-v]`.

**C2 : contrat DOM de `order`** (le solveur de `test/games.test.js` compare ces éléments).
- `.order-item` (dans `#order-ticket`), `.order-pick` (dans `#order-palette`) et `.order-placed` (dans `#order-plate`) portent tous les quatre attributs `data-k`, `data-color`, `data-shape`, `data-face`. Un attribut inactif au palier prend sa valeur par défaut, `data-shape="rond"` et `data-face="sourit"`, et `data-k` a toujours ses trois parties (`"rose-rond-sourit"`).
- `#order-ticket` : un `.order-item` par dumpling commandé, sorte après sorte dans l'ordre de la phrase R2.
- `#order-palette` : un `.order-pick` par sorte proposée (`palette` boutons, T4).
- `#order-plate` : un `.order-placed` par dumpling posé, dans l'ordre de pose, avec `data-i` (sa place) ; le plateau se lit comme l'ensemble des `data-k` de `#order-plate .order-placed`, avec leurs nombres.
- Phase « voir » : `#order-palette`, `#order-plate` et `#order-serve` ont `hidden` ; phase « préparer » : `#order-ticket` a `hidden` (sauf pendant l'indice 2) et `#order-ready` aussi.
- Contrôle indépendant `INDEPENDENT.order` : les `data-k` des `.order-pick` de la solution, avec leurs nombres, égalent ceux des `.order-item` du ticket.

**H1 : jouable par le harnais.** Les deux boucles génériques parcourent tout `GAME_TYPES`, paliers 1 à 5 : `test/games.test.js:300-322` (`playToWin` : vérifie que chaque sélecteur de `gameSolution` existe **dès l'ouverture**, passe le contrôle `INDEPENDENT[clé]`, clique chaque sélecteur par `el.click()` à 5 ms d'écart, puis attend `.win-box` au plus 3000 ms, `games.test.js:44`, 3 tirages par palier, `games.test.js:338`) et `test/companions.test.js:223-289` (touche deux fois 💡, puis rejoue `gameSolution` de la même façon et attend `.win-box` au plus 2000 ms). Seul `simon` y a une attente propre ; `tens` et `order` n'en demandent aucune. Les minuteries du jeu y sont 10 fois plus courtes (`SPEED = 0.1`).
- **Événements** : tous les boutons et dumplings touchables de `tens` et `order` sont branchés par `setHandler(el, 'click', …)`, jamais sur `pointerdown` seul : `el.click()` les déclenche.
- **Synchrone** : chaque toucher change le DOM tout de suite (déplacement d'un dumpling, regroupement, apparition des réponses, passage de « voir » à « préparer ») ; les animations sont en CSS seulement, aucune ne retarde le DOM. Un toucher ne dépend jamais d'une minuterie : le harnais n'a rien à attendre entre deux clics.
- **`gameSolution` de `tens`**, posé une fois après `openModal`, tous les sélecteurs présents dès l'ouverture (C1) :
  - palier 1, `build` : `['.tens-heap .tens-dumpling[data-id="0"]', …, '.tens-heap .tens-dumpling[data-id="{n − 1}"]', '.tens-opt[data-v="{n}"]']` (n + 1 éléments ; la réponse est cliquée quand `.tens-options` vient de perdre `hidden`) ;
  - `read` et `write` (paliers 2 à 5) : `['.tens-opt[data-v="{n}"]']` ;
  - `make` (paliers 2 à 5) : `['#tens-add100' × c, '#tens-add10' × d, '#tens-add1' × u, '#tens-ready']` (c seulement au palier 5).
  Durée : au plus 20 clics (palier 1) ou 28 clics (palier 5, 9 + 9 + 9 + 1), soit moins de 0,2 s, puis `winSoon()` (40 ms en test) : très sous 2000 ms.
- **`gameSolution` de `order`**, tous les sélecteurs présents dès l'ouverture (palette et plateau cachés par `hidden`, mais dans la page) : `['#order-ready', '.order-pick[data-k="{k}"]' répété autant de fois que la quantité de la sorte k, sorte après sorte dans l'ordre du ticket, '#order-serve']` (3 à 8 éléments). La commande reste montrée tant que `#order-ready` n'est pas touché, sans durée : il n'y a donc rien à attendre. Pendant la phase « voir », un toucher sur `.order-pick`, `.order-placed` ou `#order-serve` est ignoré (le handler lit `phase`) ; le harnais touche `#order-ready` en premier, ce qui passe à « préparer » tout de suite. L'indice 2 de la phase « voir » ne fait que briller (T5) ; celui de « préparer » remontre le ticket 2 ou 3 s (0,2 ou 0,3 s en test) sans bloquer la palette.
- **Indices dans `test/companions.test.js`** : les deux indices sont demandés avant de jouer, donc en phase « voir » pour `order` et avant le rangement pour `tens` `build` ; aucun ne change l'état du jeu, et un `dim` ne vise jamais `.tens-opt[data-v="{n}"]`.
- **Fichiers de test** : `test/games.test.js` reçoit `INDEPENDENT.tens` et `INDEPENDENT.order` (plan, tâches 2 et 10) ; `test/companions.test.js` n'a rien à changer (sa boucle trouve les deux jeux par `GAME_TYPES`) mais doit passer ; `test/smoke.test.js` et `test/dumplings.test.js` reçoivent les tests propres.

**T6 : l'île, son thème, sa musique.**

```js
dumplings: {
  name: "L'Île des Squishy Dumplings",
  emoji: '🥟',
  level: 78,
  diff: 6,
  saison: 3,
  short: 'Dumplings',
  subtitle: 'La cuisine à vapeur',
  game: 'tens',
  map: { x: 50, y: 74 },
  shape: 'dumplings',
  icon: '🥟',
  sand: '#FFF6E6',
  land: '#A8D5A2',
  intro: "Bienvenue sur l'Île des Squishy Dumplings, où ça sent bon la vapeur 🥟",
  sceneEmpty: 'Ta cuisine attend ses décorations toutes chaudes !',
},
```

Thème : `body[data-world="dumplings"] { --world-sky: #eef7ea; --world-sea: #a8d5a2; --world-deep: #3f7a4a; --world-scene-top: #f7fbf2; --world-scene-floor: #f3e3c3; }`.
Musique : `dumplings: { root: 62, scale: [0, 2, 4, 7, 9], bpm: 84, lead: 'flute', prog: [0, 5, 9, 7], shaker: true }` (une flûte qui siffle comme la vapeur, et le petit shaker des grains de riz).
Paysage `ISLE_SCENERY.dumplings` : une île de terre `w.land`, une tour de 3 paniers vapeur en bambou empilés (ellipses et `rect`, brun clair `#D9B27A`, bord `#8A5A2B`) d'où montent 3 volutes de vapeur blanche (`path`, opacité 0,8), un bosquet de 3 tiges de bambou (`rect` vert `#6FBF73` avec nœuds), un comptoir bas et 3 petits dumplings souriants (crème `#FFF3DC`, plis en arcs, yeux et joues roses). Pas de lanterne ni de symbole culturel appuyé : c'est une cuisine de conte.

**T7 : les personnages** (ordre de `CHARACTERS` ; dessins nouveaux dans `CHAR_ART`, style « tout rond, le visage sur le corps » du Pays Squishy, `characters-art.js:643`).

| id | emoji | name | title | gender | loot | texts (3) | Dessin |
|---|---|---|---|---|---|---|---|
| `bao` | 🥟 | Bao | le chef dumpling | m | `pate`, `feuillechou` | « Bienvenue dans ma cuisine ! Ici, tout cuit à la vapeur, tout doucement. » ; « Un bon dumpling, c'est tout mou, tout chaud, et ça sourit ! » ; « Tu m'aides en cuisine ? J'ai plein de commandes ! » | gros dumpling crème, plis sur le dessus, toque blanche, tablier bleu |
| `bambou` | 🎋 | Bambou | la pousse de bambou qui empile les paniers | f | `feuillechou`, `petitspois` | « Un panier, c'est dix places. Quand il est plein, hop, on en prend un autre ! » ; « Je range les dumplings par dix. Comme ça, on compte bien plus vite ! » ; « Tu viens empiler les paniers avec moi ? » | tige verte ronde à nœuds, deux feuilles en couettes, un petit panier sur la tête |
| `sesame` | 🛎️ | Sésame | la petite serveuse dumpling | f | `tassethe`, `boiteemporter` | « Ding ding ! Une nouvelle commande ! Tu la retiens avec moi ? » ; « Je dis la commande tout bas, pour ne pas l'oublier. » ; « Un client attend son plateau. On le prépare ensemble ? » | petit dumpling rose en demi-lune, graines de sésame sur la tête, plateau à la main |
| `theo` | 🫖 | Théo | la théière qui fait la vapeur | m | `tassethe`, `pate` | « Fiou ! Je fais la vapeur pour toute la cuisine. » ; « Attention, c'est chaud ! On souffle un peu avant de croquer. » ; « Une petite tasse de thé, et on joue ? » | théière ronde vert jade, visage sur le ventre, bec, petit nuage de vapeur |

**T8 : objets, recettes, décorations.**

| Clé | emoji | name | price | Donné par |
|---|---|---|---|---|
| `pate` | 🫓 | Galette de pâte | 6 | Bao, Théo |
| `feuillechou` | 🥬 | Feuille de chou | 5 | Bao, Bambou |
| `petitspois` | 🫛 | Petits pois | 5 | Bambou |
| `tassethe` | 🍵 | Tasse de thé | 6 | Sésame, Théo |
| `boiteemporter` | 🥡 | Boîte à emporter | 7 | Sésame |
| `bolriz` | 🍚 | Bol de riz | 6 | personne |
| `potsauce` | 🫙 | Pot de sauce | 7 | personne |
| `eventail` | 🪭 | Éventail | 8 | personne |

Recettes (`CRAFTED`) : `plateauchef` 🍱 « Plateau du chef », price 22, `recipe: { pate: 2, feuillechou: 1 }` ; `soupe` 🍜 « Soupe aux dumplings », price 20, `recipe: { bolriz: 1, potsauce: 1 }`.
Décorations (`DECOS`) : `marmiteD` 🫕 « Grande marmite à vapeur » 40 ; `bambouD` 🎋 « Bosquet de bambous » 30 ; `vapeurD` ♨️ « Source de vapeur » 18 ; `lotusD` 🪷 « Bassin de lotus » 14 ; `tabouretsD` 🪑 « Tabourets du comptoir » 12.

**T9 : la série de squishies « Dumplings »** (`SQUISHY_SERIES.dumplings = { name: 'Dumplings', emoji: '🥟', world: 'dumplings' }`, ajoutée à `SQUISHY_SERIES_ORDER` après les séries existantes ; le test vérifie seulement qu'elle vient après `licornes`, pour rester vrai quand d'autres séries s'ajoutent).

| id | name | say | rarity | color | shape | size | Dessin (`SQ_ART`) |
|---|---|---|---|---|---|---|---|
| `dumpling-rose` | Dumpling rose | un dumpling rose | commun | rose | rond | petit | corps `rond`, plis en éventail sur le dessus |
| `demi-lune` | Demi-lune | un dumpling en demi-lune | commun | vert | ovale | petit | corps `ovale-h`, bord plissé en vagues |
| `bao-violet` | Bao violet | un bao violet | commun | violet | rond | grand | corps `rond`, petit point rose sur le dessus |
| `panier-vapeur` | Panier vapeur | un panier vapeur | commun | orange | carre | grand | corps `carre`, rayures de bambou, couvercle, volute de vapeur |
| `chef-bao` | Chef Bao | Bao, le chef dumpling | rare | bleu | rond | grand | corps `rond`, toque blanche |
| `dumpling-dore` | Dumpling doré | un dumpling doré | brille | jaune | rond | grand | corps `rond`, plis dorés, étincelles |

**Où vont les 6 dessins.** La table `SQ_ART` (`js/features/squishies/squishy-room.js:108`) donne à chaque modèle `body` (une clé de `SQ_BODIES` : `rond`, `ovale-h`, `ovale-v`, `carre`, `squishy-room.js:74-79`), `face` (options de `sqFace`, par exemple `{}` ou `{ sleep: true }`), `faceY` facultatif, et `back`/`front`, des fonctions `(c) => chaîne SVG` en coordonnées 0 à 100 (c = la couleur de `SQ_COLORS`). Modèle à suivre : l'entrée `'tambour-mochi'` (aujourd'hui `squishy-room.js:448-456`). Les 6 entrées vont dans `js/features/squishies/squishy-art.js`, créé par la phase 0 de la track `squishy-boites` (déplacement à l'identique des dessins, prérequis de la phase « île »). Si ce fichier n'existe pas au moment d'implémenter la phase « île », l'agent s'arrête et signale le prérequis manquant : il ne crée aucun autre fichier et n'ajoute aucune entrée `SQ_ART` à `squishy-room.js` (1223 lignes pour un plafond `max-lines` de 1250, `.oxlintrc.json:40`). En revanche `SQ_BOX_COLORS.dumplings` (une ligne) va bien dans `squishy-room.js` : la phase 0 de `squishy-boites` ne déplace pas `SQ_BOX_COLORS` (elle déplace `SQ_BODIES`, `sqFace`, `SQ_ART`, `SQ_SPARKLE`, `squishyArtSVG`, `squishyPress`, `sortIconsHTML`, `conductor/tracks/squishy-boites_20261122/plan.md:12`), et après elle le fichier a perdu plus de 500 lignes, la marge est large.

**T10 : le chapitre `STORY.dumplings`.**
- `guide: 'bao'`, `title: 'Le deuxième morceau de la carte'`, `reward: 16`.
- `intro` :
  1. « Bienvenue dans ma cuisine à vapeur 🥟 Je suis Bao, le chef des Squishy Dumplings ! »
  2. « Ce matin, j'ai mis un vieux papier au fond d'un panier. C'était le deuxième morceau de la carte de Zap ! Mais j'ai empilé tous mes paniers, et je ne sais plus où il est. »
  3. « Résous mes devinettes de cuisine : chaque bonne réponse soulève un couvercle ! »
- `riddles` :
  1. q « Je suis tout mou et tout blanc, je cuis dans la vapeur, et dedans il y a une bonne farce. Qui suis-je ? » ; tip « Je ressemble à un petit chausson, et on me mange avec des baguettes. » ; opts 🥟 (ok), 🍕, 🍩.
  2. q « Je siffle quand l'eau est chaude, et je verse le thé par mon bec. Qui suis-je ? » ; tip « J'ai une anse, un couvercle et un bec. » ; opts 🫖 (ok), 🥄, 🍳.
  3. q « Je suis une grande plante verte, toute droite, et on fait des paniers avec moi. Qui suis-je ? » ; tip « Ma tige a des nœuds, comme des petits anneaux. » ; opts 🎋 (ok), 🌻, 🌵.
- `success` : « Bravo ! Sous le dernier couvercle, le deuxième morceau de la carte est là, tout chaud et tout sec 🗺️ » (la track `saison3-ouverture` ajoute ensuite `zapMapSay(2)`).

**T11 : les épisodes `EPISODES.dumplings`.**
1. `by: 'bambou'`, `title: 'La tour de paniers'`, `find: '🧺'`, lines : « J'ai empilé dix paniers, l'un sur l'autre. Une vraie tour ! » ; « Dix paniers de dix dumplings… ça fait cent ! Le chef Bao n'en revient pas. »
2. `by: 'sesame'`, `title: 'La commande de Zap'`, `find: '🥡'`, lines : « Zap est passé au comptoir. Il a commandé trois dumplings roses pour le voyage. » ; « Je les ai mis dans une boîte à emporter. Il a dit : « C'est pour l'avion en papier ! » »
3. `by: 'theo'`, `title: 'Le cliquetis dans la vapeur'`, `find: '🗝️'`, lines : « Fiou ! En sifflant très fort, j'ai entendu un cliquetis dans la vapeur, comme une petite clé. » ; « Il vient de plus loin sur la carte. Une autre île nous attend ! »

## Décisions

| Id | Décision | Pourquoi | Source |
|---|---|---|---|
| D1 | `tens` est un nouveau jeu, distinct de `packs` et de `count` | `packs` fait compter des paquets déjà faits de 2, 5 ou 10 (début de la multiplication), 2 à 5 paquets, total choisi parmi 3, sans construire ni écrire ; `count` dénombre 3 à 18 objets un par un. `tens` travaille la **valeur de position** : groupement par dix seulement, échange 10 unités = 1 dizaine et 10 dizaines = 1 centaine, construire un nombre, lire 30 + 5, distinguer 23 et 32, jusqu'à 999 | `js/features/minigames/packs/packs.js:1-8`, `js/entities/difficulty/difficulty.js:711-723`, `difficulty.js:126-137` |
| D2 | Bornes : 11 à 19 en GS, jusqu'à 69 puis 99 au CP et en fin de CP, centaines au palier 5 | Le programme de cycle 2 (2024) vise les nombres jusqu'à 100 en fin de CP (valeur des chiffres, unités et dizaines) et jusqu'à 1000 en fin de CE1 (centaines, relations unités, dizaines, centaines) | https://www.education.gouv.fr/sites/default/files/document/Annexe%204%20%E2%80%93%20Programme%20de%20math%C3%A9matiques%20du%20cycle%202-403821.pdf |
| D3 | Progression concret, imagé, abstrait : `build` (déplacer), puis `read` et `make` (paniers déjà pleins), puis `write` (écriture 30 + 5) | Demande d'Amrou et souhait de la joueuse « ranger dans des boîtes » appliqué aux maths | brief d'Amrou du 22/11/2026 ; souhaits dans `conductor/tracks.md:86` |
| D4 | On touche, on ne fait pas glisser (un dumpling touché saute dans le panier) | Convention des jeux de rangement existants, plus sûre au doigt d'un enfant | `js/features/minigames/nesting/nesting.js:9` |
| D5 | Une question par mission pour `tens`, réponses en nombres écrits | Même rythme et même forme de réponse que `packs` et `count` | `packs.js:107-117`, `js/features/minigames/count/count.js:41-58` |
| D6 | Regroupement automatique en mode `make` (10 tout seuls deviennent un panier) | L'échange est la notion à apprendre ; l'automatiser la montre à chaque fois, et garde un total toujours écrit en chiffres canoniques | défaut du rédacteur, à juger à la revue |
| D6b | Plafond de `make` : 99 aux paliers 2 à 4, 999 au palier 5 ; un bouton dont l'ajout dépasserait le plafond ne fait rien, sans secousse ni phrase | Le jeu n'a aucune réaction prévue pour un bouton sans effet (aucune dans les jeux à boutons d'ajout, `js/features/minigames/recipe/recipe.js:183-195`) | tranché par la coordination le 22/11/2026 : défaut de Claude, à juger à la revue par Amrou |
| D7 | `order` est un nouveau jeu, distinct de `memory` et de `simon` | `memory` retient des **places** (paires de cartes retournées, 3 à 7 paires) ; `simon` retient une **suite ordonnée** de 4 couleurs avec leurs sons (3 à 7). `order` retient un **ensemble lié** : des sortes définies par 1 à 3 attributs (couleur, forme, visage) et leur quantité, l'ordre ne compte pas, sans son à mémoriser, et on le reconstruit en choisissant parmi des sortes qui se ressemblent | `js/features/minigames/memory/memory.js:22-31`, `js/features/minigames/simon/simon.js:23-32`, `difficulty.js:114-116`, `difficulty.js:176-178` |
| D8 | `order` est un jeu de mémoire pour le plaisir et l'attention ; la spec, le PRD et l'espace parents ne promettent aucun « entraînement du cerveau » | Une méta-analyse de 87 publications ne trouve pas de transfert lointain de l'entraînement de la mémoire de travail (raisonnement, lecture, calcul) ; les gains restent sur des tâches proches | https://pmc.ncbi.nlm.nih.gov/articles/PMC4968033 |
| D9 | Taille des commandes : au plus 6 dumplings en 3 sortes | L'empan d'un enfant de 6 à 7 ans est d'environ 4 à 5 éléments ; le jeu reste en dessous au palier de cet âge (2 sortes, 3 à 4 dumplings) | `difficulty.js:168-174` |
| D10 | Pas de minuteur : l'enfant cache la commande lui-même (« J'ai retenu ! ») | Pas de minuteur avant le CP, pas de compte à rebours ; défaut des nouveaux jeux | `conductor/product-guidelines.md:8-9`, `difficulty.js:445-465` |
| D11 | Indice 2 de `order` : remontrer le ticket un instant | Même aide que Simon, qui rejoue la suite ; jamais la réponse posée à la place de l'enfant | `simon.js:134-150` |
| D12 | Essais : `tens` au barème `generous`, `order` au barème de Simon | `packs` est `generous` ; une suite à rejouer suit Simon, comme `rhythm` | `difficulty.js:360-369`, `difficulty.js:381-408` |
| D13 | Les deux jeux dès 5 ans | Le palier 1 de `tens` (11 à 19 avec un panier) et `order` (1 sorte, couleur seule) sont du niveau GS, comme `packs` et `potions` ouverts à 5 ans | `js/entities/difficulty/game-types.js:62-98` |
| D14 | Une enfant de 6 ans joue au palier 2 au plus | `ageToDiff` : 6 et 7 ans, palier 2 | `js/entities/difficulty/age.js:7` |
| D15 | Compétences parents : `tens` dans `nombres`, `order` dans `logique` | Décision d'Amrou (tableau de la saison 3) | brief d'Amrou du 22/11/2026, décision 1 |
| D16 | Jeu favori de l'île : `tens` à tout âge (`game: 'tens'`) | Le souhait de la joueuse porte sur le rangement ; une seule valeur comme le Pays Squishy (`game: 'shapes'`) | `js/entities/world/worlds.js:149` ; défaut du rédacteur, à juger à la revue |
| D17 | L'univers : cuisine à vapeur salée, bambou vert et crème, gestes de cuisinier | Distinguer du Pays Squishy (monde tout doux, mochis et desserts, rose) et du Royaume des Bonbons (pâtisserie sucrée, rose et caramel). Les dumplings sont une série réelle de squishies | `worlds.js:141-157`, `worlds.js:196-213`, `js/shared/styles/design-system-v21.css:102-108`, `conductor/research-squishies.md:5` |
| D18 | Chapitre et épisodes au format existant : 3 phrases d'intro, énigmes en emojis avec `tip`, 3 épisodes après les missions 2, 4, 7 | Format de `features/story` | `js/features/story/story.js:324-351`, `js/features/story/episodes.js:32` |
| D19 | Récompense du chapitre : 16 pièces | Valeur commune aux îles 1 à 4 de la saison 3, entre la saison 2 (14) et le grand final (20) ; défaut de Claude, à juger à la revue | `story.js:350`, `story.js:408`, `conductor/tracks/monde-crayons_20261122/spec.md:129` |
| D20 | Pas de Grisou : il est réservé à la saison 2 | `storyWin` ne le montre que pour l'archipel 2 | `story.js:593` |
| D21 | Le deuxième morceau de la carte est gagné quand `state.storySolved.dumplings` est vrai (rang 2 de `ZAP_MAP_PIECES`) ; cette track n'ajoute ni champ ni code de carte, elle utilise `zapMapPieces()`, `zapMapSVG(n, { fresh: id })`, `zapMapSay(n)` et `.story-zapmap` | Contrat de la track `saison3-ouverture`, comportements 22 à 25 et 29 | `conductor/tracks/saison3-ouverture_20261122/spec.md:78-85`, `conductor/tracks/saison3-ouverture_20261122/spec.md:170` |
| D22 | Aucun nouveau champ de sauvegarde | Les îles, histoires, épisodes, squishies et niveaux de jeu sont rangés par clé dans des champs existants (`storySolved`, `storyMissions`, `storyEpisodes`, `skills`, `squishies`) | `js/features/story/episodes.js:13-14`, `js/entities/game-state/state.js:11` |
| D23 | Position sur la carte `{ x: 50, y: 74 }` | Positions de la saison 3 fixées ensemble : crayons `{ x: 18, y: 78 }`, dumplings `{ x: 50, y: 74 }`, coffres `{ x: 82, y: 70 }`, chatouilles `{ x: 82, y: 26 }`, concert `{ x: 50, y: 22 }` ; conformes au cadre et à la règle de chevauchement | `test/smoke.test.js:1866-1882` ; décision de coordination du 22/11/2026 |
| D24 | Noms des 4 personnages | Proposés par Claude, faciles à dire ; la joueuse les juge à la revue | `conductor/product-guidelines.md:19` ; défaut du rédacteur, à juger à la revue |
| D25 | Dessins des 4 personnages et des 6 squishies : **demandés explicitement ici** ; aucun dessin existant n'est modifié | Zone à demande explicite d'`AGENTS.md` | `AGENTS.md` (Interdits) ; brief d'Amrou du 22/11/2026 |
| D26 | Toutes les clés nouvelles sont libres : personnages `bao`, `bambou`, `sesame`, `theo` ; prénoms Bao, Bambou, Sésame, Théo ; objets `pate`, `feuillechou`, `petitspois`, `tassethe`, `boiteemporter`, `bolriz`, `potsauce`, `eventail` ; recettes `plateauchef`, `soupe` ; décorations `marmiteD`, `bambouD`, `vapeurD`, `lotusD`, `tabouretsD` ; squishies `dumpling-rose`, `demi-lune`, `bao-violet`, `panier-vapeur`, `chef-bao`, `dumpling-dore` ; série, monde, thème musical et forme `dumplings` ; jeux `tens`, `order` ; classes `tens-*`, `order-*` | Contrôle par `grep -w` le 22/11/2026 sur `js/` (compagnons, `words`, `GAME_TYPES` compris) et sur les specs des îles `crayons`, `coffres`, `chatouilles`, `concert` : aucune clé prise. `tens` et `order` n'existent que comme variables locales ou valeurs internes (`calc.js:116`, `pitch.js:54`, `lifecycle.js:114`), jamais comme clé de jeu. La série et le monde portent le même nom `dumplings`, comme `boites`, `jouets`, `bonbons`, `licornes` aujourd'hui : séries et mondes sont dans deux tables séparées (`SQUISHY_SERIES`, `WORLDS`), reliées par `SQUISHY_ISLAND_SERIES`. Bao est déjà cité, comme guide de cette île, par la spec du Grand Concert | `js/entities/squishy/squishies.js:39-49`, `squishies.js:588-603`, `js/entities/companion/companions.js:56-132`, `conductor/tracks/monde-concert_20261122/spec.md:381`, `conductor/tracks/monde-concert_20261122/spec.md:431` |
| D27 | Types stricts (`js/entities` est vérifié par `tsconfig.strict.json`) : **aucun typedef existant n'est étendu**. Les nouvelles entrées n'ont que des champs déjà déclarés : `WORLDS.dumplings` suit `World` (`game: 'tens'`, une chaîne), les 4 personnages suivent `Character` (sans `noGames`), les 8 objets et 5 décorations suivent `Item`, les 2 recettes `CraftedItem` (sans `tier`), la série `SquishySeries`, les 6 modèles `Squishy` (sans `how`), `SQUISHY_ISLAND_SERIES.dumplings` une chaîne. Deux typedefs nouveaux dans `difficulty.js`, au-dessus de leur fonction : `@typedef {{ modes: { build?: number, read?: number, make?: number, write?: number }, min: number, max: number, choices: number, zero: boolean, looseBig: number, unitsFirst: number, shuffled: number, hundreds: boolean }} TensRound` et `@typedef {{ kinds: number, min: number, max: number, attrs: Array<'color' \| 'shape' \| 'face'>, colors: string[], palette: number }} OrderRound`. Les fichiers des jeux (`js/features/minigames/`) suivent la règle des types de la checklist ; jamais `any` ni `@ts-ignore`. `bun run typecheck` vert à chaque phase | Règle des types stricts des checklists ; forme des tables typées | `js/entities/world/worlds.js:6-25`, `js/entities/character/characters.js:2-15`, `js/entities/item/items.js:4-12`, `js/entities/squishy/squishies.js:20-38`, `js/entities/difficulty/difficulty.js:86-92`, `tsconfig.strict.json`, [checklist-mini-jeu.md](../../checklist-mini-jeu.md), [checklist-ile.md](../../checklist-ile.md) |

## Politiques

- **Arbitrages** :
  - Quand le plafond de l'âge et le palier de l'île se percutent, l'âge gagne (`gameDiff`, `js/features/adaptive/game-diff.js:20-40`) : à 6 ans, `tens` reste aux paliers 1 et 2 même au palier 6 de l'île. La track `aller-plus-loin` pourra relever ce plafond ; cette track n'y touche pas.
  - Quand l'anti-devinette et la durée d'une question longue se percutent (mode `build`, `make`, `order`), l'anti-devinette gagne : une erreur relance toujours une autre question.
  - Quand un indice et « jamais la réponse » se percutent, la réponse n'est jamais dite : on donne au plus la première moitié (le chiffre des dizaines, la première sorte) ou on remontre ce qui a déjà été montré.
  - Ordre de livraison : la phase « île » attend `saison3-ouverture`, la phase 0 de `squishy-boites` (`squishy-art.js`) et l'île précédente de la saison, `crayons`, dans `WORLDS` (ordre crayons, dumplings, coffres, chatouilles, concert). Les tests des onglets de carte (3 onglets) appartiennent à la track des Crayons, pas à celle-ci.
- **Personnages et jeux** : le lien entre Bambou et « Les paniers de dix », et entre Sésame et « La commande du chef », est une intention de narration portée par leurs répliques (T7), sans champ de code : `characters.js` n'a pour cela que `loot`, `texts` et `noGames` (`js/entities/character/characters.js:703-710`). Les 4 personnages, guide compris, proposent les jeux par le choix habituel (`pickPickerChoices`, `js/features/players/profiles-ui.js:424-446`), où le jeu favori `tens` est toujours présent ; aucun n'a `noGames`.
- **Jeux indépendants de l'île** : `tens` et `order` sont livrés avant l'île (phases 1 et 2) et n'utilisent aucune entité créée par la phase 3 : pas de personnage de l'île (le client de `order` est un emoji tiré de la liste locale du comportement 22, sans nom, et aucun texte des jeux ne nomme Bao, Bambou, Sésame ou Théo), pas d'objet, de squishy, de thème ni de musique de l'île. Les dumplings, paniers et piles sont dessinés par des fonctions SVG locales à `tens.js` et `order.js`, qui n'importent que `SQ_COLORS` (`js/entities/squishy/squishies.js`, déjà dans le jeu) ; jamais `characters.js`, `SQ_ART` ni `squishy-art.js`.
- **Preuves** : une ligne 🤖 se prouve par `bun run test` sous jsdom, qui ne fait ni mise en page ni capture ; tailles de boutons, largeur à 360 px, rendu des dessins et de la scène sont des lignes 👤 (S11 à S14).
- **Défauts** : constantes dans `difficulty.js` plutôt que réglages ; aucune dépendance nouvelle ; hasard par `random()`, `pickRandom()`, `shuffle()` ; handlers par `setHandler` ; fin de mission par `winSoon()` ; un tirage raté (moins de 2 termes en `write`, total hors bornes) tire à nouveau, au plus 20 fois, puis prend le mode `read`.
- **Textes** : tous les textes montrés ou dits sont dans cette spec (consignes : T12). Une phrase qui contient un nombre se construit par les gabarits ci-dessus. Nombres : dans `tens`, en chiffres dans le texte passé à `speak` (R3) ; dans `order`, les quantités 1 à 3 de la phrase du client s'écrivent en lettres (« un », « deux », « trois »), et **R2 prime** dans ce jeu, parce que l'accord « un dumpling vert » se lit mieux qu'« 1 dumpling vert ». Chaque consigne passe par `gameHeader(titre, consigne, phrase dite)`. Les boutons d'action ont un emoji et un mot court, et un `aria-label` qui dit la même chose.
- **Voix dans les tests** : `speak()` passe le texte par `toSpoken()` (`js/shared/ui/voice.js:55-68`), qui retire les balises, remplace les emojis connus par leur mot (`EMOJI_WORDS`) et supprime les autres, retire l'espace devant `? ! , . :` et élide. Une vérification de voix ne compare donc jamais au texte brut d'une table : elle compare à `ev('toSpoken(' + JSON.stringify(texte) + ')')` (le bundle de test expose les noms de haut niveau, `test/tools/page.js`), ou cherche un fragment sans emoji ni ponctuation (comme `test/games.test.js:469`). Les emojis des textes dits de cette spec (🥟, 🗺️, et ceux des boutons ✅, 🧺, 👍, 🛎️, ↩️, 🗼) n'ont pas de mot dans `EMOJI_WORDS` : ils sont supprimés, aucun ne double un mot. Les dumplings de `order` sont des dessins SVG, jamais un emoji dit.
- **Référence visuelle** :
  - `tens` : la scène et les boutons de réponse de « Les paquets de jouets » (`packs.js:93-104`) ; un panier est une grille 2 × 5 de cases rondes sur un fond bambou.
  - `order` : la grille de boutons de « Répète après moi » (`simon.js:36-44`) pour la palette, au moins 64 px par bouton ; le ticket est une bulle blanche au-dessus du client.
  - L'île : la scène de l'Île de la Musique (`js/features/island/island.js:340`) pour le niveau de détail.
- **Détails non écrits** : l'agent prend le défaut de la référence ou l'option la plus simple, le note dans le journal de décisions du plan, l'humain juge à la revue.

## Hors périmètre

- Le troisième onglet, l'archipel 3, le prologue de la saison et l'affichage de la carte de Zap : track `saison3-ouverture`.
- Les clips audio de la voix neuronale (track `voix-naturelle`) ; ici, la voix de l'appareil lit les phrases.
- La classe du profil et le défi étoile (track `aller-plus-loin`).
- L'explication de l'erreur après une mauvaise réponse (track `erreurs-expliquees`).
- Les boîtes de rangement des squishies (track `squishy-boites`).
- Les autres îles de la saison 3 et tout changement des mini-jeux existants.

## Contrats partagés

| Contrat | Forme (ou lien) | Propriétaire | Consommateurs |
|---|---|---|---|
| Registre des mini-jeux | `registerGame('tens', renderTens)`, `registerGame('order', renderOrder)` | moteur `js/features/minigame-engine` | « choisir un jeu », personnages, Zap |
| Indices | `registerHints(clé, q => [n1, n2])`, `setHintQuestion(clé, q, { choices })` | `js/features/hints` | `test/companions.test.js` |
| Paramètres par palier | `tensRound(dd)` et `orderRound(dd)`, exportés par `js/entities/difficulty/index.js`, typés en strict : `@param {number} dd`, `@returns {TensRound}` et `@returns {OrderRound}`, table annotée `/** @type {Record<number, TensRound>} */` (et `OrderRound`) passée à `tierValue` ; typedefs exacts en D27 | cette track | les deux jeux, les tests |
| Archipel de la saison 3 | `ARCHIPELAGOS[3]`, `worldsOf(3)`, `refreshArchipelagos()`, `shownArchipelagos()` | track `saison3-ouverture` (`entities/world`) | `WORLDS.dumplings` (`saison: 3`), `test/dumplings.test.js` |
| Carte de Zap | `ZAP_MAP_PIECES` (`dumplings` au rang 2), `zapMapPieces()`, `zapMapSVG(n, { fresh: id })`, `zapMapSay(n)`, `.story-zapmap` ; un morceau est gagné quand `state.storySolved.<id>` est vrai | track `saison3-ouverture` (`features/story`) | ce chapitre (lignes 36 et 37) |

## Surface d'attaque

Aucune : pas de saisie, pas d'import, pas de réseau ; les jeux ne lisent que leurs propres tirages.

## Zones sensibles touchées

- PWA : `index.html` et `sw.js` régénérés par `bun run sync` (nouvelles slices) et `bun run release`, jamais modifiés à la main. Revue humaine.
- Dessins des personnages (`characters-art.js`) : ajout seul des 4 nouveaux, demandé ici explicitement.
- Pas de changement de sauvegarde, d'import, de pause, de parents (hors une clé ajoutée à `SKILL_GROUPS`), ni de garde d'architecture.

## Smoke test

🤖 : un agent la prouve et joint la preuve. 👤 : seul l'humain peut juger (rendu, ressenti, téléphone, vrai paiement).

| Id | Qui | Étapes | Attendu | Niveau visé |
|---|---|---|---|---|
| S1 | 🤖 | `bun run test dumplings` : `tensRound` et `orderRound` comparés à T1 et T4 | égalité stricte, paliers 1 à 5 | test-verified |
| S2 | 🤖 | `bun run test games` : `tens` et `order` joués par `gameSolution` à chaque palier, avec un contrôle indépendant (total compté sur la scène ; plateau égal au ticket) | écran de victoire à chaque palier | test-verified |
| S3 | 🤖 | `bun run test smoke` : ouverture, bonne réponse, mauvaise réponse | une mauvaise réponse relance un autre (mode, nombre) ou une autre commande | test-verified |
| S4 | 🤖 | `bun run test companions` | 2 niveaux d'indice, `dim` seulement au niveau 2 avec 4 choix, jeu gagnable après les indices | test-verified |
| S5 | 🤖 | `test/dumplings.test.js` : mode `make`, 10 × `#tens-add1` puis ↩️ ; puis 9 × `#tens-add10`, 9 × `#tens-add1`, `#tens-add1` et `#tens-add10` au palier 2 | un `.tens-basket.full` et 0 `.tens-loose .tens-dumpling` après le 10ᵉ, puis 0 panier et 9 tout seuls ; à 99, les deux derniers boutons ne changent rien | test-verified |
| S6 | 🤖 | `test/dumplings.test.js` : profil de 6 ans sur une île au palier 6 | `gameDiff()` ≤ 2 pour `tens` et `order` | test-verified |
| S7 | 🤖 | `test/dumplings.test.js` : `WORLDS.dumplings`, personnages, objets, recettes, décorations, thème, paysage, musique, squishies comparés à T6 à T9 | égalité | test-verified |
| S8 | 🤖 | `test/dumplings.test.js` : niveau 77 puis 78, chapitre, mauvaise puis bonne réponse, `storyWin` deux fois | verrouillée puis ouverte ; autre énigme après l'erreur ; 16 pièces, une boîte et `zapMapPieces() === 2`, une seule fois | test-verified |
| S9 | 🤖 | `test/dumplings.test.js` : 2, 4, 7 missions sur l'île | 3 épisodes, conteurs `bambou`, `sesame`, `theo` | test-verified |
| S10 | 🤖 | `bun run test niveaux` et `bun run check` | verts | test-verified |
| S11 | 👤 | Téléphone, `tens` au palier 1 puis 2 | ranger au doigt est agréable, le panier plein se voit, les nombres se lisent ; tout tient à 360 px sans défilement, boutons d'au moins 64 px | e2e-verified |
| S12 | 👤 | Téléphone, `order` aux paliers 1 et 2, avec et sans le son | la commande dite et dessinée se comprend ; les dumplings se distinguent (couleur, forme, visage) | e2e-verified |
| S13 | 👤 | La joueuse découvre l'île, ses 4 personnages, leurs noms et dessins, l'histoire | elle aime les noms et les dessins (sinon, nouveaux noms à la revue) | e2e-verified |
| S14 | 👤 | Écoute de la musique de l'île et des phrases à voix haute | agréable, pas trop forte, voix compréhensible | e2e-verified |

## Questions ouvertes

