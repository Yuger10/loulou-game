---
status: brouillon
issue: 0
size: M                  # quatre PR livrables seules : 1a, 1b, 2, 3 (L découpé)
migration: false
sensitive: true
files:
  - js/features/minigames/problems/problems.js          # environ 450 lignes
  - js/features/minigames/problems/problems-bank.js     # environ 250 lignes
  - js/features/minigames/problems/problems-draw.js     # environ 200 lignes
  - js/features/minigames/problems/problems-schema.js   # environ 300 lignes
  - js/features/minigames/problems/problems-hints.js    # environ 150 lignes
  - js/features/minigames/problems/problems.css
  - js/features/minigames/problems/index.js
  - js/features/minigames/code/code.js                  # environ 450 lignes
  - js/features/minigames/code/code.css
  - js/features/minigames/code/index.js
  - js/slices.cjs
  - js/app/main.js
  - tsconfig.strict.json   # peut changer : procédure d'include de Y1 (aujourd'hui, aucun ajout attendu)
  - js/entities/difficulty/index.js
  - js/entities/difficulty/rounds-saison3.js   # problemsRound, codeRound et leurs types ; créé par la première PR qui en a besoin
  - js/entities/difficulty/game-types.js
  - js/entities/difficulty/difficulty.js
  - js/features/adaptive/adaptive.js
  - js/features/parents/parents.js
  - js/entities/world/worlds.js
  - js/entities/character/characters.js
  - js/entities/character/characters-art-saison3.js   # 4 dessins dans ART_S3 (fichier préparé par saison3-ouverture)
  - index.html                       # régénéré par bun run sync (zone sensible)
  - sw.js                            # régénéré par bun run sync et release (zone sensible)
  - js/entities/item/items.js
  - js/entities/squishy/squishies.js
  - js/features/squishies/squishy-art.js   # 6 entrées SQ_ART (fichier déjà sur main)
  - js/features/story/story.js
  - js/features/story/episodes.js
  - js/features/music/music.js
  - js/features/island/island.js
  - js/shared/styles/design-system-v21.css
  - test/problems.test.js
  - test/code.test.js
  - test/coffres.test.js
  - test/games.test.js               # INDEPENDENT.problems et INDEPENDENT.code
  - test/companions.test.js          # lu, pas modifié : sa boucle générique couvre les deux jeux
  - test/smoke.test.js
taster: { facts: 5, decisions: 0, rounds: 11 }
---

<!-- Gabarit cothon 0.4.0 (setting-up-docs), adopté dans Conductor (cothon 0.2.0-2 et 0.4.0-6) : une nouvelle track part de ce fichier. -->

# Spec : 🗝️ L'Île des Coffres (saison 3 « La Grande Expédition », île 3)

- Nouveau projet : non

L'île : `coffres`, emoji 🗝️, niveau d'ouverture **86**. Règle et tableau de tous les niveaux : `conductor/niveaux.md`. Idée de la joueuse. Prérequis de la phase 3 (l'île) : la track `saison3-ouverture` (troisième onglet, `ARCHIPELAGOS[3]`, `refreshArchipelagos()`, carte de Zap `ZAP_MAP_PIECES`) est sur `main`, l'île précédente de la saison (`dumplings`, track `monde-dumplings`) est déjà dans `WORLDS`, (les dessins des squishies sont déjà dans `js/features/squishies/squishy-art.js` sur `main`). Ordre de livraison des îles : crayons, dumplings, coffres, chatouilles, concert. Les phases 1 et 2 (les deux mini-jeux) n'ont pas ce prérequis.

## Problème

La joueuse veut « une île des coffres ». Le parent demande « plus de maths » et des jeux de résolution de problèmes. Le jeu calcule déjà beaucoup (`math`, `calc`, `money`, `share`) mais ne raconte jamais un problème : l'enfant n'apprend pas à passer d'une histoire à un calcul. Il manque aussi un jeu de déduction où l'on raisonne à partir d'indices. L'Île des Coffres apporte les deux : on y ouvre des coffres en réfléchissant. Elle se distingue du Coffre aux Jouets Doux (`jouets`, des jouets endormis), du Monde des Boîtes (`boites`, une fabrique de cartons) et du coffre du jour des missions (`js/features/quests/quests.js:1`, une récompense) : ici, chaque coffre est une énigme à résoudre.

## Comportement attendu

### A. Mini-jeu « Le trésor raconté » (`problems`, compétence `calcul`)

1. Étant donné un joueur de 6 ans ou plus (ou sans âge), quand il ouvre « choisir un jeu » sur n'importe quelle île, alors `problems` peut être proposé, avec l'emoji 🪙 et le nom « Le trésor raconté » (`GAME_LIST`).
2. Étant donné le palier joué `dd`, quand un problème est tiré, alors son type, ses nombres, sa représentation et son nombre de choix suivent la table T1 (`problemsRound(dd)`), et ses phrases suivent la banque B1 ; le type `possible` a le poids 0,2, les autres le poids 1. Règle de répétition : le jeu garde en mémoire (variable du module, jamais sauvegardée, remise à zéro au rechargement) le type du dernier problème joué par l'enfant (problème principal ou jumeau, jamais l'exemple), mis à jour à chaque problème montré ; un tirage libre (nouvelle mission, ou relance après une erreur hors jumeau) exclut ce type. Deux exceptions : le jumeau a toujours le type de son exemple, et la relance d'un jumeau garde ce type (D25). Chaque palier a au moins 3 types, donc l'exclusion laisse toujours un choix.
3. Étant donné un problème affiché, alors l'écran montre les 4 étapes en haut (👂 Comprendre, 📊 Dessiner, 🧮 Calculer, 💬 Répondre), l'étape en cours allumée, et les vignettes de la scène (`.pb-scene .pb-vignette`) ne montrent que les emojis des personnages de l'histoire (table locale de B1) et de son objet, plus le « ? » de la vignette de question : aucun décor. La règle vise ces seuls emojis de vignette ; en sont exclus les outils (le coffre `.pb-chest`, les barres, cases, étiquettes, signes, boutons, la barre des 4 étapes et le bouton 🔈). Le test compte, dans chaque vignette, que l'ensemble des emojis est inclus dans { emoji de P, emoji de Q (et de Zap pour deuxEtapes B), emoji de l'objet } et, seulement pour les vignettes dont la phrase contient un nombre, que le nombre d'emojis d'objet vaut ce nombre (jusqu'à 10) ou 1 avec le nombre en chiffres (au-delà). Une phrase sans nombre a une vignette sans emoji d'objet (table V1).
4. Étant donné l'étape Comprendre, quand elle commence, alors l'énoncé est dit phrase par phrase (`speak`), chaque phrase allume sa vignette (le personnage, et les objets : un emoji par objet jusqu'à 10, au-delà le nombre en chiffres suivi d'un seul emoji), puis la vignette de la question (`.pb-vignette[data-q]`) apparaît (personnage, objet, « ? »). Le bouton 🔈 redit tout l'énoncé. Le bouton 👉 (`.pb-next[data-step="comprendre"]`) passe à l'étape suivante ; cette étape n'est pas notée.
5. Étant donné la représentation `concret` (palier 1) ou `concret-barre` (palier 2), types `reunion` et `ajout`, quand l'enfant touche un objet d'une vignette (`.pb-token`), alors il vole dans le coffre (`.pb-chest`) et la voix compte (« un », « deux »…) ; quand tous les objets connus sont dans le coffre, l'étape Dessiner se termine seule.
6. Étant donné la représentation `concret` ou `concret-barre`, types `retrait` et `partie`, quand l'étape Dessiner commence, alors le coffre contient déjà `a` (ou `t`) objets ; l'enfant en touche pour les sortir (la voix compte), puis touche « C'est fait » (`.pb-done`) : si le nombre sorti est `b` (ou `a` pour `partie`), l'étape est réussie ; sinon c'est une erreur (critère 12).
7. Étant donné la représentation `concret-barre` (palier 2), alors elle fait exactement les gestes de `concret` (critères 5 et 6), puis, au clic qui termine Dessiner, les objets du coffre se rangent en barres (animation seulement visuelle) et le schéma F1 de son type apparaît rempli selon L1 ; vient ensuite le choix de l'opération (critère 9), puis Calculer. Le test vérifie que le schéma est montré, que ses étiquettes sont dans les cases de L1 et que les largeurs suivent la règle des longueurs.
8. Étant donné la représentation `barres` (lignes 3 et 4 de `problemsRound`), quand l'étape Dessiner commence, alors le schéma vide de la table F1 s'affiche (chaque barre, celle du « ? » comprise, a sa vraie longueur, écrite en `style.width` selon la règle des longueurs de F1, ce que jsdom lit ; chaque barre de comparaison porte l'emoji de son personnage, table locale de B1) avec trois étiquettes (`.pb-label[data-l="n1|n2|q"]`, table L1) ; l'enfant touche une étiquette puis une case (`.pb-slot[data-s]`) ; une étiquette posée dans la bonne case s'y fixe (les deux parties d'un parties-tout sont interchangeables) ; une étiquette posée dans une mauvaise case est une erreur (critère 12).
9. Étant donné les représentations `concret-barre` et `barres`, quand le schéma est rempli, alors l'enfant choisit l'opération (`.pb-sign[data-v="+"]` ou `[data-v="-"]`) : ➕ si l'on cherche le tout ou le plus grand (reunion, ajout, compPlus, étape 1 de deuxEtapes), ➖ si l'on cherche une partie, l'écart ou le plus petit (retrait, partie, ajoutInconnu, compEcart, compMoinsPlus, étape 2 de deuxEtapes) ; une mauvaise opération est une erreur. Au palier 4, au clic du bon signe, l'égalité s'écrit sous le schéma dans `B .pb-eq-text` (B : le bloc de l'étape, G1) : les deux nombres de l'étape en chiffres (1 compris), dans l'« ordre Q » de L1, le signe `+` ou `−` (U+2212, comme `js/features/minigames/math/math.js`), puis ` = ?`, séparés par des espaces ; après le bon résultat, le `?` devient ce résultat. Exemples au palier 4 : retrait a = 30, b = 12 : « 30 − 12 = ? » ; partie t = 40, a = 15 : « 40 − 15 = ? » ; ajoutInconnu a = 15, t = 40 : « 40 − 15 = ? » ; compPlus a = 23, b = 9 : « 23 + 9 = ? » ; compEcart a = 17, g = 35 : « 35 − 17 = ? » ; compMoinsPlus t = 44, b = 1 : « 44 − 1 = ? » ; deuxEtapes a = 20, b = 14, c = 9 : étape 1 « 20 + 14 = ? », étape 2 « 34 − 9 = ? » ; possible : pas d'égalité. Le test lit `textContent` de `.pb-eq-text` et le compare à cette forme.
10. Étant donné la représentation `egalite` (palier 5), quand l'étape Dessiner commence, alors aucun schéma n'est montré : l'enfant remplit `□ ○ □ = ?` en touchant les deux nombres (`.pb-eq-num[data-k]`, les deux nombres de l'étape et eux seuls, table L1 ; ils remplissent les cases dans l'ordre) et le signe. L'égalité est jugée une seule fois, au toucher du signe, quand les deux cases sont pleines : elle est juste si et seulement si le signe est l'opération de l'étape (colonne « Opération » de T1 ; deuxEtapes : ➕ à l'étape 1, ➖ à l'étape 2) et, pour ➖, le grand nombre est d'abord ; pour ➕, les deux ordres sont justes. Tout autre signe est une erreur notée. Un signe touché avant que les deux cases soient pleines ne fait rien ; un nombre touché quand les deux cases sont pleines ne fait rien. Une égalité fausse est une erreur (critère 12) : une erreur notée, un essai perdu, un nouveau problème. Exemple au palier 5 (3 essais), `partie` t = 63, a = 18 : l'enfant touche 18, puis 63, puis ➖ : une erreur, il reste 2 essais, un autre problème arrive ; s'il avait touché ➖ après le seul 63, rien ne se passait, puis 18 et ➖ donnaient une égalité juste (63 − 18), sans erreur ; 63, 18, puis ➕ est une erreur (`partie` demande ➖).
11. Étant donné l'étape Calculer, quand elle commence, alors `choices` nombres (champ de la ligne de `problemsRound`, R1 : 3 aux lignes 1 et 2, 4 aux lignes 3 à 5) sont proposés (`.pb-num[data-v]`) selon la règle R1 ; le bon choix allume l'étape Répondre ; un mauvais choix est une erreur.
12. Étant donné une erreur à n'importe quelle étape notée, alors le moteur l'enregistre (`loseLife(el, { onRetry })`) et relance un **autre** problème (nouveau tirage selon X2, même mode d'exemple) : jamais le même à finir par élimination. Une erreur pendant le problème jumeau (mode `n = 0`) relance un nouveau jumeau seul (même type, nouveaux nombres selon X2), sans rejouer l'exemple résolu ; pendant la mission, le mode reste `n = 0` tant que le jumeau n'est pas réussi. Si les essais s'épuisent, l'échec est enregistré comme une mission jouée, comme pour tous les jeux (`recordMission(false)`, qui ajoute une entrée à `atLvl`) ; E1 ne change pas, donc la mission suivante peut avoir `n = 1` sans qu'aucun jumeau ait été réussi (le compagnon y fait encore Comprendre, les indices restent disponibles). Défauts de Claude, à juger à la revue par Amrou (D25, D31).
13. Étant donné l'étape Répondre, quand l'enfant touche le « ? » (`.pb-answer`), alors il devient le nombre trouvé, la phrase réponse de la banque B1 est dite et écrite, et la mission est gagnée (`winSoon()`).
14. Étant donné un problème de type `deuxEtapes`, alors les étapes Dessiner et Calculer se font deux fois (étape 1, puis étape 2 où le résultat de l'étape 1 devient une étiquette ou un nombre de l'égalité), puis une seule étape Répondre.
15. Étant donné un problème de type `possible`, alors l'étape Dessiner montre le schéma de retrait déjà dessiné (la barre « donner » dépasse la barre de ce qu'on a, ou non), puis l'enfant répond 👍 (`.pb-yesno[data-v="oui"]`) ou 👎 (`[data-v="non"]`) ; la bonne réponse dit la phrase de B1 et gagne la mission ; la mauvaise est une erreur (critère 12).
16. Étant donné le mode d'exemple E1 calculé au début de la mission, quand `n = 0`, alors la mission contient un exemple résolu par le compagnon (l'enfant touche seulement 👉 pour avancer, la voix dit les textes de N1) suivi d'un problème jumeau (même type, autres nombres, autre objet) où le compagnon fait Comprendre et Dessiner (objets déplacés ou étiquettes posées) et l'enfant fait le reste (le choix de l'opération s'il y en a un, le résultat, puis Répondre ; en représentation `egalite`, nombres et signe font partie de Dessiner et sont posés par le compagnon) ; quand `n = 1`, le compagnon fait seulement Comprendre ; quand `n ≥ 2`, l'enfant fait tout.
17. Étant donné une partie à plusieurs (`party.active`), alors le mode d'exemple est toujours `n ≥ 2` (pas d'exemple résolu).
18. Étant donné le bouton 💡, à chaque étape notée, alors deux indices sont donnés selon H1 (la méthode, puis le début du raisonnement), jamais le résultat, jamais une réponse écartée ; la question d'indice suit la table H0 (un seul moment actif à la fois, donc une seule ligne de H1) et change à chaque moment (`setHintQuestion` avec un nouvel objet, les indices repartent du niveau 1).
19. Étant donné n'importe quelle mission, alors `gameSolution` vaut exactement la liste de la table G1 pour son mode, son type et sa représentation : tous ces éléments existent dans la fenêtre dès son ouverture (étapes et jumeau cachés puis montrés), chacun réagit à `click` (aucun `pointerdown`, aucun glisser), et chaque passage d'étape se fait au clic même, sans attendre une animation.
20. Étant donné `problems`, alors il n'a pas de minuteur (`NO_TIMER_KINDS`), ses essais suivent `LIVES_TABLE.problems = { 2: 4, 3: 4, 4: 3, 5: 3 }` (illimités au palier 1), sa phrase de progrès est « Tu résous les problèmes de mieux en mieux ! » (`PROGRESS_CHEERS`), et il est dans le groupe `calcul` de `SKILL_GROUPS`.

### B. Mini-jeu « Le code secret » (`code`, compétence `logique`)

21. Étant donné un joueur de 6 ans ou plus (ou sans âge), quand il ouvre « choisir un jeu », alors `code` peut être proposé, avec l'emoji 🔐 et le nom « Le code secret ».
22. Étant donné le palier `dd`, quand un cadenas est tiré, alors son nombre de roues, de symboles, de types d'indices et d'indices suit la table T2 (`codeRound(dd)`) ; le code utilise des symboles tous différents, pris dans la table S2.
23. Étant donné un cadenas tiré, alors ses indices (table I2) sont tous vrais pour le code, **un seul** code de la palette les respecte tous, et **chacun** est nécessaire (sans lui, au moins deux codes conviendraient).
24. Étant donné l'ouverture d'un cadenas, alors la consigne « Trouve le code du cadenas. Chaque symbole ne sert qu'une fois. Touche un indice pour l'écouter. » est dite ; aux paliers 1 et 2, chaque indice est ensuite dit à la suite ; toucher une carte d'indice (`.code-clue`) redit sa phrase.
25. Étant donné le cadenas, quand l'enfant touche une roue (`.code-wheel[data-w]`), alors elle est choisie (cadre épais) ; quand il touche un symbole de la palette (`.code-sym[data-s]`), alors il se pose sur la roue choisie, et la sélection va à la première roue vide à droite de celle-ci, sinon à la première roue vide en partant de la gauche, sinon (aucune roue vide) reste sur la roue où l'on vient de poser ; la règle est la même quand la pose remplace un symbole ou quand elle déplace un symbole (la roue vidée compte alors comme vide). Une roue pleine touchée de nouveau peut être changée. Exemple, 3 roues : lune sur la roue 0, la sélection va à 1 ; poisson sur 1, elle va à 2 ; l'enfant touche la roue 0 puis poisson : le poisson quitte la roue 1 pour la 0, la lune disparaît de la roue 0 (remplacée), et la sélection va à la roue 1 (première vide à droite de 0). Poser sur une roue un symbole déjà posé sur une autre roue le déplace : l'ancienne roue se vide (jamais de doublon, donc aucune erreur de doublon possible). Au départ, la roue de gauche est choisie. Défaut de Claude, à juger à la revue par Amrou (D26).
26. Étant donné toutes les roues pleines, alors le bouton « 🔓 Ouvrir » (`#code-open`) s'active ; avant, il est grisé et ne fait rien.
27. Étant donné « Ouvrir » avec le bon code, alors le cadenas s'ouvre (animation, « Clic ! Le cadenas s'ouvre ! » dit) et la mission est gagnée (`winSoon(WIN_DELAY_LONG)`).
28. Étant donné « Ouvrir » avec un mauvais code, alors c'est une erreur (`loseLife(btn, { onRetry })`) et un **autre** cadenas est tiré : son `data-code` est différent de celui du cadenas raté (règle X2) ; le test compare `data-code` avant et après.
29. Étant donné le bouton 💡, alors les deux indices suivent H2, sans jamais dire où va un symbole qui n'est pas écrit tel quel dans un indice, et sans écarter de choix.
30. Étant donné `code`, alors il n'a pas de minuteur, il est dans les jeux généreux (`GENEROUS_KINDS`), sa phrase de progrès est « Tu trouves les codes secrets de mieux en mieux ! », et il est dans le groupe `logique`.

### C. L'île

31. Étant donné les prérequis livrés, quand on lit `WORLDS.coffres`, alors il existe avec `saison: 3`, `diff: 6`, `level: 86`, `map: { x: 82, y: 70 }`, `worldsOf(3).slice(0, 3)` vaut `['crayons', 'dumplings', 'coffres']` (donc `worldsOf(3).indexOf('coffres') === 2`, vrai aussi après les îles suivantes), et l'île est sur la carte de la saison 3 sans chevaucher une autre île (règle de `test/smoke.test.js`).
32. Étant donné l'île ouverte pour la première fois, alors le chapitre C1 « Le troisième morceau de la carte » est lu par Clémence avant l'écran « Nouvelle île », et il montre `.story-zapmap svg.zap-map` (pas `.story-grisou`).
33. Étant donné `state.coins = 0`, `state.storySolved = { crayons: true, dumplings: true }` et `storyWin('coffres')`, quand on le joue, alors on gagne 16 pièces et une boîte de la série `coffres`, `state.storySolved.coffres === true`, `zapMapPieces() === 3`, la fenêtre montre `.story-zapmap.happy svg.zap-map[data-found="3"]` (dessinée par `zapMapSVG(zapMapFound(), { fresh: 'coffres' })`), et la voix ajoute `zapMapSay(3)` (« La carte de Zap : tu as trouvé 3 morceaux sur 5. ») à la phrase de victoire ; un second `storyWin('coffres')` ne redonne pas la boîte. Rien d'autre n'est stocké.
34. Étant donné une mauvaise réponse à une énigme, alors une **autre** énigme de l'île est posée (mécanisme existant : l'énigme suivante de la liste, `js/features/story/story.js:565` ; avec 3 énigmes, elle diffère toujours de la précédente).
35. Étant donné les 2ᵉ, 4ᵉ et 7ᵉ missions réussies sur l'île, alors les épisodes P1, P2, P3 se jouent, racontés par Kadi, Grignote et Pinçou, jamais par Clémence.
36. Étant donné l'île, alors ses 4 personnages (table K1), ses 8 objets (O1), ses 2 recettes (R2), ses 5 décorations (D1), son paysage, son thème de couleurs, sa musique (M1) et sa série de 6 squishies (Q1) sont présents ; chaque personnage a `world: 'coffres'` et 2 objets préférés (`favoritesOf`), tous deux des objets de l'île (`ITEMS[k].world === 'coffres'`).
37. Étant donné l'île, alors son jeu favori (`worldGame('coffres', âge)`) est `problems` à tout âge.

## Tables et textes

### T1. « Le trésor raconté » par palier (`problemsRound(dd)`)

Livraison en deux PR (D30) : la PR 1a livre les lignes 1 à 3 (critères 1 à 9 sans l'égalité du palier 4, 11 à 13, 16 à 20 ; S1, S2, S4, S7 sur ce contenu) ; la PR 1b ajoute les lignes 4 et 5 (critères 10, 14, 15, l'égalité du critère 9 ; S1, S2, S4 sur toute la table). Entre les deux, les paliers 4 et 5 jouent la ligne 3 : `tierValue` renvoie l'entrée de la plus grande clé présente (`js/entities/difficulty/difficulty.js:92-105`), un état correct pour l'enfant et pour `test/games.test.js`.

`min` et `max` : bornes du tout (ou du plus grand nombre de l'histoire). `ecart` : écart maximal des comparaisons.

| Palier | Types | min | max | ecart | Représentation | Choix au calcul |
|---|---|---|---|---|---|---|
| 1 (GS, début CP) | reunion, ajout, retrait | 2 | 6 | sans objet | concret | 3 |
| 2 (CP) | reunion, ajout, retrait, partie | 4 | 10 | sans objet | concret-barre | 3 |
| 3 (fin CP, CE1) | reunion, ajout, retrait, partie, ajoutInconnu, compPlus, compEcart | 5 | 20 | 9 | barres | 4 |
| 4 (CE1) | retrait, partie, ajoutInconnu, compPlus, compEcart, compMoinsPlus, deuxEtapes, possible | 10 | 50 | 20 | barres (et égalité) | 4 |
| 5 (fin CE1, CE2) | partie, ajoutInconnu, compEcart, compMoinsPlus, deuxEtapes, possible | 20 | 100 | 40 | egalite | 4 |

Tirage des nombres (entiers, toujours au moins 1) :

| Type | Tirage | Résultat `r` | Opération |
|---|---|---|---|
| reunion, ajout | `t` dans [min, max], `a` dans [1, t−1], `b = t − a` | `t` | ➕ |
| retrait | `a` dans [min, max], `b` dans [1, a−1] | `a − b` | ➖ |
| partie | `t` dans [min, max], `a` dans [1, t−1] | `t − a` | ➖ |
| ajoutInconnu | `t` dans [min, max], `a` dans [1, t−1] | `t − a` | ➖ |
| compPlus | `b` (écart) dans [1, ecart], `a` dans [1, max − b] | `a + b` | ➕ |
| compEcart | `a` dans [1, max − 1], `g` dans [a+1, min(max, a + ecart)] | `g − a` | ➖ |
| compMoinsPlus | `t` dans [max(min, 2), max], `b` dans [1, min(ecart, t−1)] | `t − b` | ➖ |
| deuxEtapes (A ou B, une chance sur deux) | `a` dans [1, max − 2], `b` dans [1, max − a − 1], `c` dans [1, a + b − 1] | `a + b − c` | ➕ puis ➖ |
| possible | d'abord oui ou non (une chance sur deux) ; non : `a` dans [2, max − 1], `b` dans [a+1, min(max, a + 9)] ; oui : `a` dans [2, max], `b` dans [1, a] | oui ou non | sans objet |

Aucune plage n'est vide, aux deux bornes de chaque palier (le test tire 500 problèmes par palier et le vérifie). Exemples aux extrêmes, au premier et au dernier palier où chaque type existe (T1) :

| Type (paliers) | Premier palier, bornes basses | Dernier palier, bornes hautes |
|---|---|---|
| reunion, ajout (1 à 3) | palier 1, t = 2 : a = 1, b = 1 | palier 3, t = 20 : a dans [1, 19] |
| retrait (1 à 4) | palier 1, a = 2 : b = 1 | palier 4, a = 50 : b dans [1, 49] |
| partie (2 à 5) | palier 2, t = 4 : a dans [1, 3] | palier 5, t = 100 : a dans [1, 99] |
| ajoutInconnu (3 à 5) | palier 3, t = 5 : a dans [1, 4] | palier 5, t = 100 : a dans [1, 99] |
| compPlus (3 et 4) | palier 3 (ecart 9) : b = 9 : a dans [1, 11] ; b = 1 : a dans [1, 19] | palier 4 (ecart 20) : b = 20 : a dans [1, 30] |
| compEcart (3 à 5) | palier 3 : a = 1 : g dans [2, 10] ; a = 19 : g = 20 | palier 5 : a = 1 : g dans [2, 41] ; a = 99 : g = 100 |
| compMoinsPlus (4 et 5) | palier 4 (min 10) : t = 10 : b dans [1, 9] | palier 5 : t = 100 : b dans [1, 40] ; t = 20 : b dans [1, 19] |
| deuxEtapes (4 et 5) | palier 4 : a = 1 : b dans [1, 48], c dans [1, b] ; a = 48 : b = 1, c dans [1, 48] | palier 5 : a = 98 : b = 1, c dans [1, 98] |
| possible, non (4 et 5) | palier 4 : a = 2 : b dans [3, 11] ; a = 49 : b = 50 | palier 5 : a = 99 : b = 100 |
| possible, oui (4 et 5) | palier 4 : a = 2 : b dans [1, 2] | palier 5 : a = 100 : b dans [1, 100] |

### V1. Contenu des vignettes, phrase par phrase

Une vignette par phrase entre crochets de B1. Une phrase avec un nombre montre le personnage dont elle parle et ses objets (un emoji par objet jusqu'à 10, au-delà le nombre en chiffres et un seul emoji). Une phrase sans nombre montre le personnage seul (ou les deux pour une action à deux), zéro emoji d'objet. La question montre le personnage, un emoji d'objet et « ? » (`data-q`).

| Type | Vignettes, dans l'ordre (N : avec nombre ; S : sans nombre) |
|---|---|
| reunion | N : P, a objets ; N : P, b objets ; question : P, objet, ? |
| ajout | N : P, a objets ; N : Q, b objets ; question : P, objet, ? |
| retrait | N : P, a objets ; N : P, b objets ; question : P, objet, ? |
| partie | N : P et Q, t objets ; N : P, a objets ; question : Q, objet, ? |
| ajoutInconnu | N : P, a objets ; S : Q seul ; N : P, t objets ; question : Q, objet, ? |
| compPlus | N : P, a objets ; N : Q, b objets ; question : Q, objet, ? |
| compEcart | N : P, a objets ; N : Q, g objets ; question : Q, objet, ? |
| compMoinsPlus | N : Q, t objets ; N : Q, b objets ; question : P, objet, ? |
| deuxEtapes A | N : P, a objets ; N : Q, b objets ; N : P, c objets ; question : P, objet, ? |
| deuxEtapes B | N : P, a objets ; N : Q, b objets ; N : P, Q et Zap, c objets ; question : P et Q, objet, ? |
| possible | N : P, a objets ; N : P et Q, b objets ; question : « Est-ce possible ? » : P et Q, objet, ? |

### A1. Les attributs de `#pb-root` (lus par le solveur indépendant du test)

Toujours présents : `data-type` (le type), `data-a`, `data-b`, `data-c`, `data-t`, `data-r` ; une valeur sans objet vaut la chaîne vide. `deuxEtapes` ajoute `data-variant` (`A` ou `B`) et `data-r1`.

| Type | data-a | data-b | data-c | data-t | data-r (recalcul du test) |
|---|---|---|---|---|---|
| reunion, ajout | a | b | vide | t = a + b | a + b |
| retrait | a | b | vide | vide | a − b |
| partie, ajoutInconnu | a | vide | vide | t | t − a |
| compPlus | a (le petit) | b (l'écart) | vide | vide | a + b |
| compEcart | a (le petit) | g (le grand) | vide | vide | b − a |
| compMoinsPlus | vide | b (l'écart) | vide | t (le grand) | t − b |
| deuxEtapes | a | b | c | vide | a + b − c ; `data-r1` = a + b |
| possible | a | b | vide | vide | `oui` si b ≤ a, sinon `non` |

### Z1. Fichiers de la slice `minigame-problems` (`max-lines` à 1100)

`problems` est découpé en fichiers frères dans `js/features/minigames/problems/`, tous déclarés dans `files` de la slice `minigame-problems` de `js/slices.cjs` (ordre : banque, tirage, schéma, indices, puis `problems.js`), puis `bun run sync`. Chaque fichier importe ses frères directement (même slice) ; seul `index.js` est importé par les autres slices.

| Fichier | Contenu | Taille estimée |
|---|---|---|
| `problems-bank.js` | `PB_PEOPLE`, objets de B1, gabarits B1 et phrases réponses, règle du nombre 1, textes N1, phrases d'étape | 250 lignes |
| `problems-draw.js` | tirage T1 (nombres, poids, exclusions X2, mémoire du dernier type et des tuples), choix R1 et table « autre opération », attributs A1 | 200 lignes |
| `problems-schema.js` | schémas F1 et étiquettes L1, règle des longueurs, égalité (`.pb-eq-text`, `.pb-eq-num`), vignettes V1, objets à toucher | 300 lignes |
| `problems-hints.js` | table H0, textes H1, `registerHints('problems', …)` | 150 lignes |
| `problems.js` | fenêtre, étapes, modes E1, exemple et jumeau, `gameSolution` G1, erreurs et relances, `registerGame` | 450 lignes |

PR 1a : les cinq fichiers, contenu des paliers 1 à 3 ; PR 1b : ajouts dans les mêmes fichiers (environ 150 lignes en tout), chacun reste sous 600 lignes. `code` tient dans `code.js` (environ 450 lignes : fabrication, solveur, fenêtre, indices) ; s'il dépassait 1000 lignes, la fabrication passe dans `code-make.js`, même règle.

### P0. Ce que chaque phase suppose déjà présent

Un jeu livré avant son île ne dépend d'aucune entité de l'île (personnages, objets, squishies, thème, musique, histoire) : `problems` a ses personnages (B1) et ses objets (emojis 🪙 🔑 💎 🐚 💍, table B1) en local ; `code` a ses symboles (S2) et ses couleurs de roues (T2) en local. Les deux n'importent que des slices déjà sur `main` : moteur des mini-jeux, `screen`, `hints`, `adaptive`, `entities/difficulty`, `shared/lib`, `shared/ui` (`speak`, `toSpoken`, `setHandler`), et le compagnon du joueur (`entities/companion`) pour l'exemple résolu et les indices.

| Phase | Suppose sur `main` |
|---|---|
| 1a | le jeu actuel seulement (slices ci-dessus) |
| 1b | 1a |
| 2 | le jeu actuel seulement (indépendante de 1a et 1b) |
| 3 | 1a, 1b et 2 (le jeu favori `problems` et les répliques de Kadi et Grignote parlent des deux jeux) ; `saison3-ouverture` ; `WORLDS.dumplings` (`monde-dumplings`) |

### G1. `gameSolution` de « Le trésor raconté » et harnais de test

Les deux boucles génériques (`test/games.test.js:306-322`, `test/companions.test.js:277-286`) font `d.querySelector(sel).click()` pour chaque sélecteur, dans l'ordre, 5 ms réelles entre deux clics (minuteries du jeu ×0,1, donc 50 ms de jeu), puis attendent `.win-box` 3000 ms (2000 ms dans `companions`). D'où ces règles :
- tout se branche par `setHandler(el, 'click', fn)` ; objets, étiquettes et cases se touchent, rien ne se glisse ;
- un clic fait passer l'étape tout de suite (état changé dans le gestionnaire, avant toute animation) ; gestes du compagnon et animations (objets qui volent, barres qui se rangent, au plus 600 ms de jeu) sont seulement visuels ; un clic pendant un geste le termine aussitôt ; la voix ne bloque jamais un bouton ;
- la victoire passe par `winSoon()` (400 ms de jeu, 40 ms réelles), sous les 2000 ms du harnais ; aucune relance (`scheduleRetry`) sur le chemin de la solution.

**Conteneurs, pour que le premier élément trouvé soit toujours le bon.** Chaque problème a son conteneur : `#pb-main` (modes `n ≥ 1`), ou `#pb-ex` (l'exemple) et `#pb-twin` (le jumeau) en mode `n = 0`. Chaque étape de calcul a son bloc : `#pb-main-e1`, `#pb-main-e2` (deuxEtapes seulement), `#pb-twin-e1`, `#pb-twin-e2`, `#pb-ex-e1`, `#pb-ex-e2`. Objets, étiquettes, cases, signes, nombres d'égalité, choix de résultat et `.pb-done` sont dans le bloc de leur étape ; `.pb-next[data-step="comprendre"]`, `.pb-answer` et `.pb-yesno` sont dans le conteneur du problème ; les boutons de l'exemple ont des `data-step` uniques. Chaque sélecteur de `gameSolution` commence par l'id de son bloc ou de son conteneur : aucun sélecteur ne peut désigner un élément d'un autre problème ou d'une autre étape. `#pb-root[data-*]` (table A1) décrit le problème que l'enfant résout : `#pb-main`, ou le jumeau en mode `n = 0` (le solveur indépendant compare son `data-r`).

**Boutons 👉 et enchaînements, par mode.**
- `n ≥ 2` : un seul 👉, `#pb-main .pb-next[data-step="comprendre"]`. L'énoncé est dit à l'ouverture ; les phrases d'étape (« Dessine l'histoire. »…) sont dites seules au début de chaque étape.
- `n = 1` : le même seul 👉. Après l'énoncé, le compagnon dit seul le texte « Comprendre » de N1 puis « J'ai écouté avec toi. À toi de dessiner ! », sans attendre.
- `n = 0` : K boutons dans `#pb-ex`, `data-step` `ex1` à `exK` (K = 5 ou 7, table des pas de N1). Le pas 1 (Comprendre) est dit après l'énoncé, à l'ouverture. Le bouton `exk` est visible pendant le pas k : le toucher joue le pas k+1 (geste et texte) ; `exK` (pas « Fin », « À toi, maintenant ! ») cache `#pb-ex` et montre `#pb-twin`. Dans le jumeau, aucun 👉 : l'énoncé, le texte « Comprendre », le dessin fait (gestes instantanés) et « J'ai dessiné l'histoire. À toi de calculer ! » s'enchaînent seuls ; pour deuxEtapes, le dessin 2 et son texte arrivent seuls juste après le bon `R(r1)` de l'enfant.

Notation : `B` = bloc de l'étape (`#pb-main-e1`…), `C` = conteneur ; `N(x)` = `C .pb-next[data-step="x"]` ; `L(l)` = `B .pb-label[data-l="l"]` ; `S(s)` = `B .pb-slot[data-s="s"]` ; `O` = `B .pb-sign[data-v="+"]` ou `[data-v="-"]` ; `R(v)` = `B .pb-num[data-v="v"]` ; `Q(k)` = `B .pb-eq-num[data-k="k"]` ; `T(i)` = `B .pb-token[data-i="i"]` ; `D` = `B .pb-done` ; `A` = `C .pb-answer` ; `Y(v)` = `C .pb-yesno[data-v="v"]`.

Ce que l'enfant touche (modes `n ≥ 1`) :

| Représentation et type | `gameSolution` |
|---|---|
| concret, reunion et ajout | `N(comprendre)`, `T(0)` à `T(t−1)` (0 à a−1 : objets de la première vignette, a à t−1 : de la seconde), `R(r)`, `A` |
| concret, retrait | `N(comprendre)`, `T(0)` à `T(b−1)` (objets du coffre numérotés 0 à a−1), `D`, `R(r)`, `A` |
| concret, partie | `N(comprendre)`, `T(0)` à `T(a−1)` (coffre numéroté 0 à t−1), `D`, `R(r)`, `A` |
| concret-barre (palier 2) | la liste « concret » du même type, avec `O` juste avant `R(r)` |
| barres | `N(comprendre)`, `L("n1")`, `S(case de n1)`, `L("n2")`, `S(case de n2)`, `L("q")`, `S(case de q)` (cases de la table L1), `O`, `R(r)`, `A` |
| egalite | `N(comprendre)`, les deux `Q` dans l'ordre de L1, `O`, `R(r)`, `A` |
| deuxEtapes | `N(comprendre)`, puis l'étape 1 dans `#…-e1` et l'étape 2 dans `#…-e2`, chacune comme « barres » (palier 4) ou « egalite » (palier 5) avec ses étiquettes de L1, puis `A` |
| possible | `N(comprendre)`, `Y("oui")` ou `Y("non")` (la victoire suit ce clic) |

Ce que l'enfant touche dans le jumeau (`n = 0`), après `N(ex1)` à `N(exK)` : concret, `R(r)`, `A` ; concret-barre et barres, `O`, `R(r)`, `A` ; egalite, `R(r)`, `A` (le compagnon a posé nombres et signe) ; deuxEtapes, pour chaque étape `O` (palier 4 seulement) et `R`, puis `A` ; possible, `Y`.

Exemples complets :
- `n ≥ 2` (et `n = 1`), palier 3, `partie`, t = 8, a = 3, r = 5 : `#pb-main .pb-next[data-step="comprendre"]`, `#pb-main-e1 .pb-label[data-l="n1"]`, `#pb-main-e1 .pb-slot[data-s="tout"]`, `#pb-main-e1 .pb-label[data-l="n2"]`, `#pb-main-e1 .pb-slot[data-s="partie1"]`, `#pb-main-e1 .pb-label[data-l="q"]`, `#pb-main-e1 .pb-slot[data-s="partie2"]`, `#pb-main-e1 .pb-sign[data-v="-"]`, `#pb-main-e1 .pb-num[data-v="5"]`, `#pb-main .pb-answer`.
- `n ≥ 2`, palier 1, `ajout`, a = 2, b = 3 : `#pb-main .pb-next[data-step="comprendre"]`, `#pb-main-e1 .pb-token[data-i="0"]` à `[data-i="4"]` (5 sélecteurs), `#pb-main-e1 .pb-num[data-v="5"]`, `#pb-main .pb-answer`.
- `n = 0`, palier 1, `ajout` (jumeau a = 1, b = 4) : `#pb-ex .pb-next[data-step="ex1"]` à `[data-step="ex5"]` (5 sélecteurs), `#pb-twin-e1 .pb-num[data-v="5"]`, `#pb-twin .pb-answer`.
- `n = 0`, palier 5, `deuxEtapes` A (jumeau a = 30, b = 12, c = 7) : `#pb-ex .pb-next[data-step="ex1"]` à `[data-step="ex7"]`, `#pb-twin-e1 .pb-num[data-v="42"]`, `#pb-twin-e2 .pb-num[data-v="35"]`, `#pb-twin .pb-answer`.

### L1. Étiquettes, valeurs et cases (barres, concret-barre et égalité)

`n1` et `n2` : les deux nombres dans l'ordre où l'énoncé les dit ; `q` : le « ? ». Dans un parties-tout, une partie peut aller en `partie1` ou `partie2` (la case libre) ; la solution utilise la case écrite ici. Au palier 5, `.pb-eq-num` offre exactement les deux nombres de l'étape (`data-k="1"` pour n1, `"2"` pour n2), sans leurre ; « ordre Q » est l'ordre à toucher.

| Type (étape) | n1 : valeur, case | n2 : valeur, case | q : case | Ordre Q |
|---|---|---|---|---|
| reunion, ajout | a, `partie1` | b, `partie2` | `tout` | Q(1), Q(2) (les deux ordres sont justes) |
| retrait | a, `tout` | b, `partie1` | `partie2` | Q(1), Q(2) |
| partie | t, `tout` | a, `partie1` | `partie2` | Q(1), Q(2) |
| ajoutInconnu | a, `partie1` | t, `tout` | `partie2` | Q(2), Q(1) |
| compPlus | a, `petit` | b, `ecart` | `grand` | Q(1), Q(2) |
| compEcart | a, `petit` | g, `grand` | `ecart` | Q(2), Q(1) |
| compMoinsPlus | t, `grand` | b, `ecart` | `petit` | Q(1), Q(2) |
| deuxEtapes (étape 1) | a, `partie1` | b, `partie2` | `tout` | Q(1), Q(2) |
| deuxEtapes (étape 2) | r1, `tout` | c, `partie1` | `partie2` | Q(1), Q(2) |

En `concret-barre`, le schéma qui apparaît rempli est celui de la ligne de son type (reunion, ajout, retrait ou partie), étiquettes déjà posées dans ces cases. En mode `n = 0`, le compagnon pose les étiquettes dans ces mêmes cases.

### G2. `gameSolution` du « Code secret »

Pour chaque roue `w` de 0 à N−1 : `.code-wheel[data-w="w"]`, puis `.code-sym[data-s="<symbole du code en w>"]` ; enfin `#code-open`. Tout est présent dès l'ouverture, branché sur `click` ; « Ouvrir » s'active dans le gestionnaire du dernier symbole posé ; la lecture des indices (paliers 1 et 2) ne bloque aucun bouton ; victoire par `winSoon(WIN_DELAY_LONG)` (700 ms de jeu).

### A2. Les attributs de `#code-root` (lus par le solveur indépendant du test)

Écrits par le jeu avec `el.dataset.… = JSON.stringify(…)` (aucun échappement à la main), une fois par cadenas :

| Attribut | Forme | Exemple |
|---|---|---|
| `data-wheels` | nombre de roues, en chiffres | `"3"` |
| `data-palette` | tableau JSON des ids de S2 proposés, dans l'ordre des boutons `.code-sym` | `["poisson","lune","pomme","fleur"]` |
| `data-code` | tableau JSON des ids, roue 0 (gauche) d'abord | `["lune","poisson","pomme"]` |
| `data-clues` | tableau JSON d'objets, dans l'ordre d'affichage des cartes `.code-clue` (la carte k porte `data-k="k"` et `data-t` = son type) | voir ci-dessous |

Forme d'un indice, une par type (`w` : indice de roue, 0 à gauche) : `{"t":"est","s":"lune","w":0}` ; `{"t":"pas","s":"poisson","w":2}` ; `{"t":"absent","s":"fleur"}` ; `{"t":"voisins","s":"pomme","s2":"lune"}` (pomme sur la roue juste à gauche de lune) ; `{"t":"bout","s":"etoile"}` (première ou dernière roue). Aucune autre clé.

Sens pour le solveur (un code candidat est une suite de `data-wheels` ids distincts pris dans `data-palette`) : `est` vrai si `code[w] === s` ; `pas` vrai si `s` est dans le code et `code[w] !== s` ; `absent` vrai si `s` n'est pas dans le code ; `voisins` vrai s'il existe i avec `code[i] === s` et `code[i+1] === s2` ; `bout` vrai si `code[0] === s` ou `code[N−1] === s`.

`INDEPENDENT.code` (dans `test/games.test.js`) : lit les quatre attributs ; énumère toutes les suites candidates ; garde celles qui rendent vrais tous les indices ; vérifie qu'il en reste exactement une, qu'elle est égale à `data-code`, que le nombre de cartes `.code-clue` est la longueur de `data-clues`, et que `gameSolution` est exactement la liste G2 construite depuis `data-code`.

Cadenas complet en exemple (palier 2) : `data-wheels="3"`, `data-palette='["poisson","lune","pomme","fleur"]'`, `data-code='["lune","poisson","pomme"]'`, `data-clues='[{"t":"absent","s":"fleur"},{"t":"est","s":"lune","w":0},{"t":"pas","s":"poisson","w":2}]'`. Cartes : k = 0 « La fleur n'est pas dans le code. » ; k = 1 « La lune est sur la roue rouge. » ; k = 2 « Le poisson n'est pas sur la roue verte. ». Raisonnement : sans la fleur, il reste lune, poisson, pomme ; la lune est à gauche ; le poisson ne peut pas être à droite, il est au milieu ; la pomme est à droite. Chaque indice est nécessaire (sans l'un d'eux, au moins deux codes conviennent). `gameSolution` : `.code-wheel[data-w="0"]`, `.code-sym[data-s="lune"]`, `.code-wheel[data-w="1"]`, `.code-sym[data-s="poisson"]`, `.code-wheel[data-w="2"]`, `.code-sym[data-s="pomme"]`, `#code-open`.

### F1. Les schémas

| Types | Schéma | Cases (`data-s`) | Ce qui va dans chaque case |
|---|---|---|---|
| reunion, ajout | parties-tout : une grande barre (le tout) au-dessus de deux petites (les parties) | `tout`, `partie1`, `partie2` | tout : ? ; parties : a et b |
| retrait | parties-tout | idem | tout : a ; parties : b et ? |
| partie, ajoutInconnu | parties-tout | idem | tout : t ; parties : a et ? |
| compPlus | comparaison : deux barres alignées à gauche, la plus courte prolongée d'un bout en pointillés (l'écart) | `grand`, `petit`, `ecart` | grand : ? ; petit : a ; ecart : b |
| compEcart | comparaison | idem | grand : g ; petit : a ; ecart : ? |
| compMoinsPlus | comparaison | idem | grand : t ; petit : ? ; ecart : b |
| deuxEtapes A et B | deux parties-tout l'un après l'autre | idem | étape 1 : tout ?, parties a et b ; étape 2 : tout r1, parties c et ? |
| possible | parties-tout dessiné, sans étiquette à poser | sans objet | la barre « donner » (b) sous la barre « ce qu'on a » (a) : elle dépasse si b > a |

Règle des longueurs : l'échelle de tout le schéma est le plus grand nombre du schéma (le tout, ou le plus grand), dessiné sur 100 % ; chaque barre, celle du « ? » comprise, a `style.width` = valeur ÷ ce nombre × 100 %, arrondi à l'entier (D28, vérifié par test pour toutes les barres) ; une barre garde une largeur minimale de 56 px en CSS (`min-width`), pour qu'on puisse la toucher (rendu jugé par la ligne 👤 S7, jsdom ne fait pas de mise en page). Dans une comparaison, chaque barre porte à gauche l'emoji (table locale de B1) du personnage dont elle parle.

### R1. Les choix du calcul

`G` (écart maximal d'un leurre), le nombre de choix et l'usage de `r ± 10` sont des champs de la ligne renvoyée par `problemsRound(dd)`, jamais lus sur `dd` lui-même. Les 5 objets littéraux (après 1b ; la PR 1a ne livre que les clés 1, 2, 3) :

```js
1: { types: ['reunion', 'ajout', 'retrait'], min: 2, max: 6, ecart: 0, rep: 'concret', eqUnder: false, choices: 3, gap: 3, tens: false },
2: { types: ['reunion', 'ajout', 'retrait', 'partie'], min: 4, max: 10, ecart: 0, rep: 'concret-barre', eqUnder: false, choices: 3, gap: 3, tens: false },
3: { types: ['reunion', 'ajout', 'retrait', 'partie', 'ajoutInconnu', 'compPlus', 'compEcart'], min: 5, max: 20, ecart: 9, rep: 'barres', eqUnder: false, choices: 4, gap: 3, tens: false },
4: { types: ['retrait', 'partie', 'ajoutInconnu', 'compPlus', 'compEcart', 'compMoinsPlus', 'deuxEtapes', 'possible'], min: 10, max: 50, ecart: 20, rep: 'barres', eqUnder: true, choices: 4, gap: 10, tens: true },
5: { types: ['partie', 'ajoutInconnu', 'compEcart', 'compMoinsPlus', 'deuxEtapes', 'possible'], min: 20, max: 100, ecart: 40, rep: 'egalite', eqUnder: false, choices: 4, gap: 10, tens: true },
```

`choices` compte `r` compris ; `eqUnder` : l'égalité s'écrit sous le schéma (critère 9). Pendant 1a, `tierValue` renvoie la ligne 3 aux paliers 4 et 5 : 4 choix, `gap: 3`, pas de `r ± 10`, nombres jusqu'à 20, barres sans égalité.

Règle unique pour 0 : ni réponse ni leurre ; tout nombre proposé vaut au moins 1 (T1 garantit `r ≥ 1`). Écart maximal G = `gap` de la ligne (la largeur de la barre « ? » ne suffit donc pas à répondre, D28). Candidats, dans cet ordre, sans doublon, en gardant seulement ceux qui valent au moins 1 et sont à au plus G de `r` : l'autre opération (table ci-dessous), `r + 1`, `r − 1`, `r + 2`, `r − 2`, `r + 3`, puis, si `tens` est vrai, `r + 10` et `r − 10`. On garde `r` et les `choices − 1` premiers candidats, puis on mélange (`shuffle`). Il y en a toujours assez : `r + 1`, `r + 2`, `r + 3` sont toujours permis.

| Type (étape) | Autre opération |
|---|---|
| reunion, ajout | \|a − b\| |
| retrait | a + b |
| partie, ajoutInconnu | t + a |
| compPlus | \|a − b\| |
| compEcart | g + a |
| compMoinsPlus | t + b |
| deuxEtapes (étape 1) | \|a − b\| |
| deuxEtapes (étape 2) | r1 + c |
| possible | sans objet |

### B1. La banque d'énoncés

Personnages des histoires : une table locale de `problems.js` (`PB_PEOPLE`), sans import de `characters.js` ni d'aucune entité de l'île, car le jeu est livré avant l'île (phases 1a et 1b) ; la phase 3 n'y change rien :

| id | Nom | Genre | Emoji (vignette et visage des barres) |
|---|---|---|---|
| clemence | Clémence | f | 🗝️ |
| kadi | Kadi | m | 🔒 |
| grignote | Grignote | f | 🐭 |
| pincou | Pinçou | m | 🦀 |
| zap | Zap | m | 🦸‍♂️ |

Le « visage » d'une vignette ou d'une barre de comparaison est cet emoji, jamais un dessin de `CHAR_ART`. Ensuite : `P` et `Q` sont deux personnages différents ; Zap n'est jamais `P` ni `Q` dans deuxEtapes B. `{Il}` et `{il}` suivent le genre de `P`. Objets (un seul objet par problème) :

| Objet | Emoji | Singulier | Pluriel | Genre |
|---|---|---|---|---|
| piece | 🪙 | pièce | pièces | f |
| cle | 🔑 | clé | clés | f |
| gemme | 💎 | gemme | gemmes | f |
| coquillage | 🐚 | coquillage | coquillages | m |
| bague | 💍 | bague | bagues | f |

Le nombre 1 s'écrit et se dit « une » ou « un » selon le genre, avec le nom au singulier (« une pièce ») ; sinon le nombre en chiffres et le nom au pluriel. Chaque ligne entre crochets est une phrase dite et une vignette.

Règle du nombre 1, partout où une phrase dite ou écrite contient un nombre (B1, N1, H1) : 1 se dit et s'écrit « une » si l'objet est féminin, « un » s'il est masculin, qu'il soit suivi du nom (« une pièce ») ou non (« lui en donne une », « en a une de plus ») ; 2 et plus s'écrivent en chiffres. Les questions gardent « Combien de {objets} » et « assez de {objets} » au pluriel. Les boutons et étiquettes (`.pb-num`, `.pb-label`, `.pb-eq-num`) montrent toujours le chiffre 1. Revue de chaque gabarit avec 1 pour chaque variable qui peut valoir 1 (objet pièce, féminin ; P = Grignote, elle ; Q = Kadi) :

| Type | Variables à 1 | Phrases obtenues |
|---|---|---|
| reunion | a = 1, b = 1 | Grignote a une pièce dans un coffre. Elle a une pièce dans un autre coffre. Combien de pièces a Grignote en tout ? Réponse : Grignote a 2 pièces en tout. |
| ajout | a = 1, b = 1 | Grignote a une pièce. Kadi lui en donne une. Combien de pièces a Grignote maintenant ? Réponse : Grignote a 2 pièces maintenant. |
| retrait | b = 1, r = 1 (a = 2) | Grignote a 2 pièces. Elle en perd une dans le sable. Combien de pièces reste-t-il à Grignote ? Réponse : Il reste une pièce à Grignote. |
| partie | a = 1 (t = 4) ; r = 1 (t = 4, a = 3) | Grignote et Kadi ont 4 pièces en tout. Grignote en a une. Combien de pièces a Kadi ? Réponse : Kadi a 3 pièces. Avec r = 1 : Kadi a une pièce. |
| ajoutInconnu | a = 1 (t = 5) ; r = 1 (a = 4, t = 5) | Grignote a une pièce. Kadi lui en donne. Maintenant, Grignote en a 5. Combien Kadi lui en a donné ? Réponse : Kadi lui a donné 4 pièces. Avec r = 1 : Kadi lui a donné une pièce. |
| compPlus | a = 1, b = 1 | Grignote a une pièce. Kadi en a une de plus que Grignote. Combien de pièces a Kadi ? Réponse : Kadi a 2 pièces. |
| compEcart | a = 1, r = 1 (g = 2) | Grignote a une pièce. Kadi en a 2. Combien Kadi en a de plus que Grignote ? Réponse : Kadi en a une de plus que Grignote. |
| compMoinsPlus | b = 1 (t = 10) ; r = 1 (t = 10, b = 9) | Kadi a 10 pièces. Kadi en a une de plus que Grignote. Combien de pièces a Grignote ? Réponse : Grignote a 9 pièces. Avec r = 1 : Grignote a une pièce. |
| deuxEtapes A | a = 1, b = 1, c = 1, r = 1 | Grignote a une pièce. Kadi lui en donne une. Puis Grignote en perd une. Combien de pièces reste-t-il à Grignote ? Réponse : Il reste une pièce à Grignote. |
| deuxEtapes B | a = 1, b = 1, c = 1, r = 1 | Grignote a une pièce. Kadi en a une. Grignote et Kadi en donnent une à Zap. Combien de pièces leur reste-t-il ? Réponse : Il leur reste une pièce. |
| possible | b = 1 (a = 2) | Grignote a 2 pièces. Elle veut en donner une à Kadi. Est-ce possible ? Réponse : Oui, c'est possible : Grignote a assez de pièces. |

Au masculin, avec l'objet coquillage : « Pinçou a un coquillage. Zap lui en donne un. », « Kadi en a un de plus que Pinçou. ». Les textes du compagnon suivent la même règle (« Grignote en perd une : je les enlève du coffre. » devient, pour b = 1, « Grignote en perd une : je l'enlève du coffre. »).

| Type | Énoncé | Phrase réponse |
|---|---|---|
| reunion | [{P} a {a} {objets} dans un coffre.] [{Il} a {b} {objets} dans un autre coffre.] [Combien de {objets} a {P} en tout ?] | {P} a {r} {objets} en tout. |
| ajout | [{P} a {a} {objets}.] [{Q} lui en donne {b}.] [Combien de {objets} a {P} maintenant ?] | {P} a {r} {objets} maintenant. |
| retrait | [{P} a {a} {objets}.] [{Il} en perd {b} dans le sable.] [Combien de {objets} reste-t-il à {P} ?] | Il reste {r} {objets} à {P}. |
| partie | [{P} et {Q} ont {t} {objets} en tout.] [{P} en a {a}.] [Combien de {objets} a {Q} ?] | {Q} a {r} {objets}. |
| ajoutInconnu | [{P} a {a} {objets}.] [{Q} lui en donne.] [Maintenant, {P} en a {t}.] [Combien {Q} lui en a donné ?] | {Q} lui a donné {r} {objets}. |
| compPlus | [{P} a {a} {objets}.] [{Q} en a {b} de plus que {P}.] [Combien de {objets} a {Q} ?] | {Q} a {r} {objets}. |
| compEcart | [{P} a {a} {objets}.] [{Q} en a {g}.] [Combien {Q} en a de plus que {P} ?] | {Q} en a {r} de plus que {P}. |
| compMoinsPlus | [{Q} a {t} {objets}.] [{Q} en a {b} de plus que {P}.] [Combien de {objets} a {P} ?] | {P} a {r} {objets}. |
| deuxEtapes A | [{P} a {a} {objets}.] [{Q} lui en donne {b}.] [Puis {P} en perd {c}.] [Combien de {objets} reste-t-il à {P} ?] | Il reste {r} {objets} à {P}. |
| deuxEtapes B | [{P} a {a} {objets}.] [{Q} en a {b}.] [{P} et {Q} en donnent {c} à Zap.] [Combien de {objets} leur reste-t-il ?] | Il leur reste {r} {objets}. |
| possible | [{P} a {a} {objets}.] [{Il} veut en donner {b} à {Q}.] [Est-ce possible ?] | oui : « Oui, c'est possible : {P} a assez de {objets}. » ; non : « Non, ce n'est pas possible : {P} n'a pas assez de {objets}. » |

Phrases des étapes (dites au début de chaque étape, quand l'enfant la fait) : « Écoute l'histoire. », « Dessine l'histoire. », « Calcule. », « Réponds à la question. ». Au palier 2, quand les objets se rangent en barres : « Regarde : les objets deviennent des barres. ». Pour `possible` : « Est-ce possible ? Touche le pouce levé pour oui, le pouce baissé pour non. ».

### E1. Le mode d'exemple (estompage)

Au début de chaque mission, avec `s = state.skills.problems` et `tier = gameDiff()` :
définition totale, règles lues dans cet ordre, la première qui s'applique gagne :
1. partie à plusieurs (`party.active`) : `n = 2` ;
2. pas de `s`, ou `s.lvl` absent ou nul (une entrée créée par un indice, `countHint` dans `js/features/hints/hints.js:413-420`, ou par `recordMission` avant `adaptAfterMission`, `js/features/adaptive/skills.js:46-48`, n'a pas de `lvl`) : `n = 0` ;
3. `tier > s.lvl` : `n = 0` ;
4. `tier < s.lvl` : `n = 2` ;
5. `tier === s.lvl` : `n = Math.min(2, (s.atLvl || []).length)`.

Rien de nouveau n'est enregistré : `atLvl` est déjà tenu par `adaptAfterMission` (`js/features/adaptive/adaptive.js:129`) et remis à zéro à chaque changement de niveau du jeu (lignes 135 et 141), ce qui redonne un exemple résolu au nouveau palier.

### N1. Ce que dit le compagnon quand il résout

| Étape | Texte |
|---|---|
| Comprendre | J'écoute l'histoire. La question, c'est : {question} ({question} = la dernière phrase entre crochets de l'énoncé B1 du problème, telle qu'elle est dite, accords compris ; ex. ajout, Grignote, Kadi, pièces : « J'écoute l'histoire. La question, c'est : Combien de pièces a Grignote maintenant ? » ; possible : « … La question, c'est : Est-ce possible ? ») |
| Dessiner, concret, reunion et ajout | Je mets les {objets} dans le coffre, une par une. (« un par un » au masculin) |
| Dessiner, concret, retrait | {P} en perd {b} : je les enlève du coffre. (b = 1 : « {P} en perd une : je l'enlève du coffre. ») |
| Dessiner, concret, partie | {P} en a {a} : je les enlève du coffre. Les autres sont à {Q}. (a = 1 : « je l'enlève » ; r = 1 : « L'autre est à {Q}. » au féminin comme au masculin) |
| Parties-tout | Le tout va sur la grande barre. Les parties vont sur les petites barres. Ici, on cherche {le tout ou une partie} : je mets le point d'interrogation dessus. |
| Comparaison | Une barre pour chacun. La plus longue, c'est celui qui en a le plus. Le bout en pointillés, c'est ce qu'il a en plus. |
| Dessiner, égalité | J'écris le calcul. |
| Calculer, reunion et ajout | On cherche le tout, alors j'ajoute : {a} plus {b}, ça fait {r}. |
| Calculer, retrait | {P} en perd, alors j'enlève : {a} moins {b}, ça fait {r}. |
| Calculer, partie et ajoutInconnu | On cherche une partie, alors j'enlève : {t} moins {a}, ça fait {r}. |
| Calculer, compPlus | On cherche celui qui en a le plus, alors j'ajoute : {a} plus {b}, ça fait {r}. |
| Calculer, compEcart | On cherche l'écart, alors j'enlève : {g} moins {a}, ça fait {r}. |
| Calculer, compMoinsPlus | Attention : « de plus » parle de {Q}. On cherche celui qui en a le moins, alors j'enlève : {t} moins {b}, ça fait {r}. |
| deuxEtapes A, calcul 1 | D'abord, {Q} lui en donne : j'ajoute. {a} plus {b}, ça fait {r1}. |
| deuxEtapes B, calcul 1 | D'abord, je mets ensemble ce qu'ils ont : {a} plus {b}, ça fait {r1}. |
| deuxEtapes, dessin 2 | Maintenant, le tout, c'est {r1}. Une partie s'en va : je cherche l'autre partie. |
| deuxEtapes A, calcul 2 | Puis {P} en perd {c} : j'enlève. {r1} moins {c}, ça fait {r}. |
| deuxEtapes B, calcul 2 | Puis ils en donnent {c} à Zap : j'enlève. {r1} moins {c}, ça fait {r}. |
| possible, dessin | Je dessine ce que {P} a, et ce qu'{il} veut donner. |
| possible, jugement (non) | La barre « donner » dépasse : {P} n'a pas assez. |
| possible, jugement (oui) | La barre « donner » ne dépasse pas : {P} a assez. |
| Répondre | Je réponds à la question : {phrase réponse} |
| Fin de l'exemple | À toi, maintenant ! |
| Jumeau, fin de Dessiner | J'ai dessiné l'histoire. À toi de calculer ! |
| `n = 1`, fin de Comprendre | J'ai écouté avec toi. À toi de dessiner ! |

Nombre de pas de l'exemple (un bouton 👉 par pas, `.pb-next[data-step="ex1"]`, `"ex2"`…, dans l'ordre) :

| Types | Pas |
|---|---|
| un problème en une étape | 5 : ex1 Comprendre, ex2 Dessiner, ex3 Calculer (opération et résultat), ex4 Répondre, ex5 Fin |
| deuxEtapes | 7 : ex1 Comprendre, ex2 Dessiner 1, ex3 Calcul 1, ex4 Dessin 2, ex5 Calcul 2, ex6 Répondre, ex7 Fin |
| possible | 5 : ex1 Comprendre, ex2 Dessin, ex3 Jugement, ex4 Répondre (phrase réponse de B1), ex5 Fin |

Dans le jumeau : pour `deuxEtapes`, le compagnon fait Comprendre, Dessin 1 puis Dessin 2 (après le calcul 1 de l'enfant), l'enfant fait les deux calculs et Répondre ; pour `possible`, le compagnon fait Comprendre et le dessin, l'enfant répond 👍 ou 👎.

Pendant l'exemple, chaque 👉 passe au texte suivant ; le compagnon fait lui-même les gestes (objets qui volent, étiquettes posées, signe et nombre allumés).

### H0. Quelle ligne de H1 vaut à chaque moment

Un seul moment est actif à la fois ; à chaque changement, `setHintQuestion('problems', { moment, problème }, { choices })` est appelé avec un nouvel objet. `choices` vaut le sélecteur des `.pb-num` du bloc pendant Calculer, celui des `.pb-sign` pendant Opération, et rien ailleurs.

| Mode | Moment | Ligne de H1 |
|---|---|---|
| `n = 0` | de l'ouverture au dernier 👉 de l'exemple | Exemple résolu |
| `n ≥ 1` | ouverture et Comprendre | Comprendre |
| tous | Dessiner, concret ou concret-barre, reunion et ajout (avant le rangement) | Concret, ajouter |
| tous | Dessiner, concret ou concret-barre, retrait et partie (avant le rangement) | Concret, sortir |
| tous | Dessiner, barres, types parties-tout (et deuxEtapes) | Parties-tout |
| tous | Dessiner, barres, compPlus, compEcart, compMoinsPlus | Comparaison |
| tous | Dessiner, egalite | Égalité |
| tous | Opération (barres, et concret-barre après le rangement) | Opération |
| tous | Calculer, l'opération de l'étape est ➕ | Calculer ➕ |
| tous | Calculer, l'opération de l'étape est ➖ | Calculer ➖ |
| tous | possible, avant 👍 ou 👎 | possible |
| tous | Répondre (le « ? » à toucher) | Répondre |
| `n = 0`, jumeau | le premier moment que fait l'enfant (Opération, Calculer ou possible) | la ligne de ce moment |

### H1. Indices de « Le trésor raconté » (2 niveaux par moment)

| Étape | Indice 1 (la méthode) | Indice 2 (le début du raisonnement) |
|---|---|---|
| Exemple résolu | Regarde bien ce que je fais : j'écoute, je dessine, je calcule, je réponds. | Touche la flèche pour voir l'étape suivante. |
| Comprendre | Écoute bien l'histoire. Tu peux la réécouter avec le haut-parleur. (glow `.btn-speak`) | Cherche la question : c'est la dernière phrase de l'histoire. Que veut-on savoir ? (glow `.pb-vignette[data-q]`, la vignette de question) |
| Concret, ajouter | Fais comme l'histoire : chaque objet va dans le coffre quand l'histoire le dit. (glow `.pb-scene`) | {P} a {a} {objets} : commence par les siens. (glow sur sa vignette) |
| Concret, sortir | L'histoire dit combien il en part. Sors-les du coffre, un par un. | Écoute encore : {P} en perd {b}. (ou : {P} en a {a}.) Compte en les sortant. |
| Dessiner, parties-tout | La grande barre, c'est le tout. Les petites barres, ce sont les parties. (glow `.pb-bars`) | Le tout, c'est quand on met tout ensemble. Est-ce qu'on le connaît, ou est-ce qu'on le cherche ? (glow `[data-s="tout"]`) |
| Dessiner, comparaison | Une barre pour chacun. La plus longue, c'est celui qui en a le plus. | Le bout en pointillés, c'est ce que l'un a de plus que l'autre. Est-ce qu'on le connaît ? (glow `[data-s="ecart"]`) |
| Opération | On cherche le tout ? On ajoute. On cherche une partie ou l'écart ? On enlève. | Regarde où est le point d'interrogation sur ton dessin. (glow sur la case du « ? ») |
| Égalité | Dans ta tête, dessine l'histoire : on cherche le tout, ou une partie ? | Voici le dessin de l'histoire. (fx.html : le schéma F1 rempli, en petit) |
| Calculer, ➕ | Pour ajouter, pars du plus grand nombre. | Pars de {grand}, et avance encore de {petit}. |
| Calculer, ➖ | Pour enlever, tu peux compter ce qu'il manque pour aller du petit au grand. | Pars de {petit}, et compte combien il faut avancer pour arriver à {grand}. |
| possible | Peut-on donner plus que ce qu'on a ? | {P} a {a} {objets}, et veut en donner {b}. Lequel est le plus grand ? |
| Répondre | Touche le point d'interrogation pour répondre à la question. (glow `.pb-answer`) | Ton calcul a trouvé le nombre. Mets-le à la place du point d'interrogation. (glow `.pb-answer`) |

Aucun indice n'utilise `fx.dim`. Aucun ne contient « = {r} » ni une suite de nombres qui arrive à `r`.

### T2. « Le code secret » par palier (`codeRound(dd)`)

| Palier | Roues (couleurs, de gauche à droite) | Symboles dans la palette | Types d'indices | « est » au plus | Indices au plus |
|---|---|---|---|---|---|
| 1 | 2 (rouge, bleue) | 4 | est, absent | 1 | 3 |
| 2 | 3 (rouge, bleue, verte) | 4 | est, pas, absent | 1 | 4 |
| 3 | 3 | 5 | est, pas, absent, voisins | 1 | 4 |
| 4 | 4 (rouge, bleue, verte, jaune) | 5 | est, pas, absent, voisins | 1 | 5 |
| 5 | 4 | 6 | pas, absent, voisins, bout | 0 | 6 |

Couleurs des roues : rouge `#E8344E`, bleue `#2F7CC0`, verte `#2F9551`, jaune `#E0A800` ; dites « la roue rouge », « la roue bleue », « la roue verte », « la roue jaune ».

### S2. Les symboles

| id | Emoji | Nom dit | Avec « de » |
|---|---|---|---|
| poisson | 🐟 | le poisson | du poisson |
| etoile | ⭐ | l'étoile | de l'étoile |
| lune | 🌙 | la lune | de la lune |
| pomme | 🍎 | la pomme | de la pomme |
| fleur | 🌸 | la fleur | de la fleur |
| coquillage | 🐚 | le coquillage | du coquillage |

En début de phrase, la majuscule va sur l'article (« Le poisson », « L'étoile »).

### I2. Les indices (dessin et phrase)

| Type | Vrai quand | Dessin de la carte (`.code-clue[data-t]`) | Phrase |
|---|---|---|---|
| est | X est sur la roue i | un petit cadenas aux couleurs des roues, X dans la case i, ✅ | {X} est sur la roue {couleur}. |
| pas | X est dans le code mais pas sur la roue i | X dans la case i, barré d'une croix rouge | {X} n'est pas sur la roue {couleur}. |
| absent | X n'est pas dans le code | X seul, sous le signe 🚫 | {X} n'est pas dans le code. |
| voisins | X est sur la roue juste à gauche de Y | deux cases blanches collées, X puis Y, reliées par un trait | {X} est juste à gauche {de Y}. |
| bout | X est sur la première ou la dernière roue | X en pointillés dans la première et la dernière case, « ou » entre les deux | {X} est sur une roue du bout. |

Fabrication d'un cadenas (au plus 500 essais ; au-delà, on reprend le palier inférieur, ce que le test interdit d'atteindre) :
1. tirer la palette (symboles de S2 au hasard), puis le code (symboles distincts de la palette) ;
2. lister tous les indices vrais des types permis, les mélanger ;
3. les ajouter un à un s'ils réduisent l'ensemble des codes possibles (permutations de la palette), jusqu'à un seul code ;
4. retirer chaque indice inutile (sans lui, toujours un seul code) ;
5. garder le cadenas si le nombre d'indices et le nombre de « est » respectent T2, sinon recommencer.

### H2. Indices du « Code secret »

- Indice 1 : « Commence par l'indice le plus sûr : celui qui chasse un symbole du code, ou celui qui dit où va un symbole. » Glow sur les cartes du premier type présent dans l'ordre absent, est, voisins, pas, bout (il y a toujours au moins une carte, donc le glow vise toujours quelque chose).
- Indice 2, selon le premier indice présent dans cet ordre : absent : « {X} n'est pas dans le code : il ne va sur aucune roue. Regarde les autres symboles. » ; voisins : « {X} et {Y} sont collés : {x} d'abord, puis {y} juste à sa droite. Où peuvent-ils aller ? » ; pas : « {X} n'est pas sur la roue {couleur}. Où peut-il aller, alors ? » ; est (repli) : « Une carte dit où va {x} : la roue {couleur}. Commence par elle, puis cherche les autres. » ; bout (repli) : « {X} est sur une roue du bout : la première ou la dernière. Laquelle reste possible ? ». Glow sur la carte citée.
- Couverture par palier (types permis par T2 et l'algorithme) : palier 1 a toujours 1 « est » et 2 « absent » (seul moyen d'une solution unique avec 4 symboles et 2 roues) ; paliers 2 à 4 ont toujours au moins un indice parmi absent, voisins, pas (un seul « est » ne suffit jamais à fixer 3 ou 4 roues) ; palier 5 a toujours au moins un absent, voisins ou pas (des « bout » seuls laissent au moins 2 codes). Les replis « est » et « bout » ne servent donc qu'en garde ; le test `test/code.test.js` vérifie sur 200 cadenas par palier que l'indice 1 vise au moins une carte et que les deux indices sont distincts. Pas de `fx.dim`, pas de `fx.strike`.

### K1. Les personnages (`js/entities/character/characters.js`)

Champs de chaque entrée, comme `viola` (`js/entities/character/characters.js:597-609`) : `emoji`, `name`, `title`, `world: 'coffres'`, `gender`, `loot`, `texts` (3 répliques), et rien d'autre (pas de `noGames`). `world: 'coffres'` est indispensable : `favoritesOf` (`js/features/gifts/gifts.js:41-50`) prend les objets préférés parmi les objets de `c.world || 'lagon'` ; avec les 8 objets de l'île et 2 de butin, chaque personnage a 2 objets préférés pris parmi les 6 autres objets de l'île (le test le vérifie).

| id | Emoji | Nom | Titre | Genre | Butin (`loot`) |
|---|---|---|---|---|---|
| clemence | 🗝️ | Clémence | la gardienne des clés | f | clecuivre, piecedor |
| kadi | 🔒 | Kadi | le petit cadenas à code | m | petitcadenas, clecuivre |
| grignote | 🐭 | Grignote | la souris qui compte tout | f | boulier, piecedor |
| pincou | 🦀 | Pinçou | le crabe serrurier | m | tournevis, petitcadenas |

Quel personnage « présente » quel jeu n'est pas un mécanisme : `characters.js` n'a pas de champ pour cela (seulement `loot`, `texts` et `noGames`, `js/entities/character/characters.js:597-648`). C'est une intention de narration portée par les répliques (Kadi parle de codes, Grignote d'histoires à compter) ; le jeu proposé reste celui du choix des jeux et du jeu favori de l'île.

Répliques (`texts`) :
- Clémence : « Bienvenue sur l'Île des Coffres ! J'ai une clé pour chaque serrure… sauf pour le grand coffre. » ; « Un coffre ne s'ouvre pas en forçant. Il s'ouvre en réfléchissant ! » ; « Chaque mission réussie, c'est une serrure qui fait clic. On continue ? »
- Kadi : « Clic, clac ! Je suis un cadenas à code. Tu trouves mon code ? » ; « Mes indices ne mentent jamais. Écoute-les bien, un par un ! » ; « Dans mon code, chaque symbole ne sert qu'une fois. Ça aide, non ? »
- Grignote : « Je compte tout : les pièces, les clés, les coffres ! Tu m'aides ? » ; « Une histoire, un dessin, un calcul… et hop, le trésor est trouvé ! » ; « Écoute bien mon histoire. La réponse se cache dedans ! »
- Pinçou : « Avec mes pinces, j'ouvre les serrures… enfin, j'essaie ! » ; « Clic-clic ! On joue avant que je referme mes pinces ? » ; « Le sable est plein de trésors. On cherche ensemble ? »

Dessins (demande explicite de cette spec ; aucun dessin existant n'est touché) : dans la table `ART_S3` de `js/entities/character/characters-art-saison3.js`, que `characters-art.js` fusionne dans `CHAR_ART`, avec les aides (`svg`, `human`…) importées de `js/entities/character/characters-art-kit.js` ; ces deux fichiers sont préparés par la track `saison3-ouverture` (prérequis de la phase 3, règle « 2 bis » de `conductor/checklist-ile.md`) : Clémence (`human`) : cheveux bruns en tresse, robe bleu canard, un gros trousseau de clés dorées à la ceinture ; Kadi (`svg`) : un cadenas doré tout rond, l'anse en haut, une molette à chiffres sur le ventre, yeux et joues comme Boumbo ; Grignote (`svg`) : une souris grise aux grandes oreilles roses, lunettes rondes, une pièce d'or dans les pattes ; Pinçou (`svg`) : un crabe orange, deux grosses pinces, une petite clé tenue dans une pince.

### O1, R2, D1. Objets, recettes, décorations (`js/entities/item/items.js`, `world: 'coffres'`)

| Clé | Emoji | Nom | Prix | Donné par |
|---|---|---|---|---|
| clecuivre | 🔑 | Clé de cuivre | 6 | Clémence, Kadi |
| piecedor | 🪙 | Pièce d'or | 5 | Clémence, Grignote |
| petitcadenas | 🔒 | Petit cadenas | 6 | Kadi, Pinçou |
| boulier | 🧮 | Boulier | 7 | Grignote |
| tournevis | 🪛 | Petit tournevis | 6 | Pinçou |
| loupe | 🔍 | Loupe de détective | 8 | personne |
| lampe | 🔦 | Lampe de poche | 7 | personne |
| bague | 💍 | Bague au rubis | 9 | personne |

Champs, comme `baguettechef` (`js/entities/item/items.js:103`) : `{ emoji, name, price, world: 'coffres' }`.

Recettes (`CRAFTED`), champs comme `lyre` (`js/entities/item/items.js:371`) : `trousseau: { emoji: '🔐', name: 'Trousseau magique', price: 22, world: 'coffres', recipe: { clecuivre: 2, tournevis: 1 } }` ; `medaillon: { emoji: '🏅', name: 'Médaillon secret', price: 20, world: 'coffres', recipe: { piecedor: 2, bague: 1 } }`.

Décorations (`DECOS`), champs comme `pianoD` (`js/entities/item/items.js:526`), `{ emoji, name, price, world: 'coffres' }` : `salleD` 🏛️ « Salle des coffres » 40 ; `porteD` 🚪 « Porte secrète » 30 ; `arbreclesD` 🌳 « Arbre à clés » 18 ; `ancreD` ⚓ « Ancre dorée » 14 ; `jarreD` 🏺 « Jarre aux trésors » 12.

### W1. L'entrée `WORLDS.coffres` et le décor

`name: "L'Île des Coffres"`, `emoji: '🗝️'`, `level: 86`, `diff: 6`, `saison: 3`, `short: 'Coffres'`, `subtitle: "L'île aux mille serrures"`, `game: 'problems'`, `map: { x: 82, y: 70 }`, `shape: 'coffres'`, `icon: '🗝️'`, `sand: '#F6E3B4'`, `land: '#C8955A'`, `intro: "Bienvenue sur l'Île des Coffres, où chaque coffre garde un secret 🗝️"`, `sceneEmpty: 'Ton île attend ses décorations pleines de secrets !'`.

Thème (`design-system-v21.css`) : `body[data-world="coffres"] { --world-sky: #fff4dc; --world-sea: #3fa7a3; --world-deep: #6b3f1d; --world-scene-top: #fffaf0; --world-scene-floor: #f2d29b; }`.

Paysage (`ISLE_SCENERY.coffres`, SVG 480 × 360 comme `musique` à `js/features/island/island.js:340`) : une île de sable (`w.sand`) sur la mer turquoise ; au centre un grand coffre de bois brun cerclé d'or, fermé par un cadenas doré ; à gauche un arbre dont les branches portent des clés qui se balancent (classes `ls-lolly l1` et `l2` pour le mouvement) ; à droite un rocher avec une petite porte ronde ; quelques pièces d'or brillantes dans le sable ; un chemin de sable vers le bas, comme les autres îles.

### M1. Musique

`MUSIC_THEMES.coffres = { root: 64, scale: [0, 2, 4, 7, 9], bpm: 90, lead: 'pluck', prog: [0, 9, 5, 7], tick: true }` : un pincé léger et les petits « tic » des serrures.

### Q1. La série de squishies « Coffres »

`SQUISHY_SERIES.coffres = { name: 'Coffres', emoji: '🔐', world: 'coffres' }`, `SQUISHY_ISLAND_SERIES.coffres = 'coffres'`, et `'coffres'` ajouté en fin de `SQUISHY_SERIES_ORDER`.

Les 6 dessins sont des entrées `SQ_ART` (type `SqArt`, `js/features/squishies/squishy-art.js:10`) ajoutées à la table `SQ_ART` de `js/features/squishies/squishy-art.js:55`, sur le modèle de l'entrée `'lyre-doree'` (`body`, `face`, `faceY`, `back`, `front`, `js/features/squishies/squishy-art.js:438`) ; `squishyArtSVG` (`:579`) les dessine. `SQ_BOX_COLORS` (`:604`) n'est pas touché.

Champs de chaque modèle, comme `'lyre-doree'` (`js/entities/squishy/squishies.js:449-457`) : `series: 'coffres'`, `name`, `say`, `rarity`, `color`, `shape`, `size`.

| id | Nom | `say` | Rareté | Couleur | Forme | Taille | Dessin (`SQ_ART`) |
|---|---|---|---|---|---|---|---|
| coffre-mochi | Coffre mochi | un coffre mochi | commun | orange | carre | grand | corps `carre`, un couvercle bombé et une serrure dorée en avant |
| cadenas-coeur | Cadenas cœur | un cadenas cœur | commun | rose | ovale | petit | corps `ovale-v`, une anse grise en arrière, un cœur blanc devant |
| cle-lune | Clé de lune | une clé de lune | commun | violet | ovale | grand | corps `ovale-h`, une tige et des dents de clé en arrière, un croissant de lune devant |
| piece-souriante | Pièce souriante | une pièce souriante | commun | jaune | rond | petit | corps `rond`, un cercle intérieur blanc pâle, une étoile gravée |
| kadi | Kadi | Kadi, le petit cadenas | rare | bleu | carre | petit | corps `carre`, l'anse en arrière, une molette à chiffres devant |
| coffre-etoiles | Coffre aux étoiles | un coffre aux étoiles | brille | vert | carre | grand | corps `carre`, un couvercle doré, trois petites étoiles qui s'échappent |

### C1. Le chapitre `STORY.coffres`

- `guide: 'clemence'`, `title: 'Le troisième morceau de la carte'`, `reward: 16`.
- `intro` :
  1. « Bienvenue sur l'Île des Coffres 🗝️ Ici, chaque coffre garde un secret, et chaque secret a sa clé. »
  2. « Zap a vu le troisième morceau de sa carte au fond du grand coffre. Mais le coffre est fermé, et sa serrure pose une devinette ! »
  3. « Trouve la bonne réponse, et la serrure fera clic ! »
- `riddles` (chacune avec 3 choix, la bonne marquée `ok`) :
  1. q : « Je suis petite, je suis en métal, et je tourne dans la serrure pour l'ouvrir. Qui suis-je ? » ; tip : « Sans moi, la porte reste fermée. On me range sur un trousseau. » ; opts : 🔑 (ok), 🔨, 🥄.
  2. q : « Je ferme les coffres et les vélos. Pour m'ouvrir, il faut une clé ou un code. Qui suis-je ? » ; tip : « On m'accroche, et clic ! je reste fermé. » ; opts : 🔒 (ok), 🔔, 🎈.
  3. q : « Je montre le chemin d'un trésor. Une croix dit où creuser. Qui suis-je ? » ; tip : « Les pirates me déplient pour trouver leur trésor. » ; opts : 🗺️ (ok), 📖, 🖼️.
- `success` : « Bravo ! La serrure fait clic, le grand coffre s'ouvre… et voici le troisième morceau de la carte de Zap 🗺️ » (la track `saison3-ouverture` ajoute ensuite `zapMapSay(zapMapPieces())`). `coffres` est le 3ᵉ élément de `ZAP_MAP_PIECES`.

### P1 à P3. Les épisodes `EPISODES.coffres`

1. `by: 'kadi'`, `title: 'Les traces de Zap'`, `find: '👣'` : « J'ai vu des traces de pas devant le grand coffre. Des petites bottes de super-héros ! » ; « Zap est passé par ici. Il cherche lui aussi les morceaux de sa carte. »
2. `by: 'grignote'`, `title: 'Le compte est bon'`, `find: '🪙'` : « J'ai compté toutes les pièces de l'île : il y en a cent, pas une de moins ! » ; « Mais dans le grand coffre, j'ai entendu un bruit de papier. Un morceau de carte, peut-être ? »
3. `by: 'pincou'`, `title: 'La plume qui chatouille'`, `find: '🪶'` : « Avec mes pinces, j'ai attrapé une plume qui volait au-dessus de la mer. » ; « Elle m'a chatouillé, hi hi ! Elle vient sûrement d'une île plus loin sur la carte. On ira voir ! »

### X1. Inventaire des clés nouvelles (vérifié le 22/11/2026)

Chaque clé ci-dessous a été cherchée par `grep` dans `js/` (personnages, compagnons, `js/entities/words/words.js`, `GAME_TYPES`, objets, squishies, musique, décors, CSS) et dans les specs `monde-crayons`, `monde-dumplings`, `monde-chatouilles` et `monde-concert` : aucune n'y est déjà prise. Les seules mentions trouvées sont des renvois à cette île (`monde-concert` cite `clemence`, Clémence et `coffres` comme île précédente ; `monde-chatouilles` cite `coffres` dans `storySolved`) ; « code » n'apparaît dans `js/` que dans des textes et `e.code`, jamais comme clé de jeu ni comme classe.

| Registre | Clés nouvelles |
|---|---|
| Île (`WORLDS`, `shape`, `STORY`, `EPISODES`, `MUSIC_THEMES`, `ISLE_SCENERY`, `SQUISHY_SERIES`, `SQUISHY_ISLAND_SERIES`, `data-world`) | `coffres` |
| Personnages (`CHARACTERS`, `CHAR_ART`) | `clemence`, `kadi`, `grignote`, `pincou` |
| Prénoms | Clémence, Kadi, Grignote, Pinçou (aucun compagnon ni personnage ne les porte : compagnons Perle, Rose, Lili, Tom, Léo, Sam, Grisou, Zap) |
| Objets (`ITEMS`) | `clecuivre`, `piecedor`, `petitcadenas`, `boulier`, `tournevis`, `loupe`, `lampe`, `bague` |
| Recettes (`CRAFTED`) | `trousseau`, `medaillon` |
| Décorations (`DECOS`) | `salleD`, `porteD`, `arbreclesD`, `ancreD`, `jarreD` |
| Squishies (`SQUISHIES`) | `coffre-mochi`, `cadenas-coeur`, `cle-lune`, `piece-souriante`, `kadi`, `coffre-etoiles` |
| Mini-jeux (`GAME_TYPES`, `GAME_LIST`, `registerGame`, `registerHints`, slices `minigame-problems` et `minigame-code`) | `problems`, `code` |
| Fonctions de difficulté | `problemsRound`, `codeRound`, `LIVES_TABLE.problems`, table locale `PB_PEOPLE` (dans `problems.js`) |
| Classes et ids CSS | préfixes `pb-` (`#pb-root`, `.pb-token`, `.pb-label`, `.pb-slot`, `.pb-sign`, `.pb-eq-num`, `.pb-num`, `.pb-yesno`, `.pb-next`, `.pb-chest`, `.pb-done`, `.pb-answer`, `#pb-main`, `#pb-ex`, `#pb-twin` et leurs blocs `-e1`, `-e2`, `.pb-scene`, `.pb-bars`) et `code-` (`#code-root`, `.code-wheel`, `.code-sym`, `.code-clue`, `#code-open`) |

Le squishy rare `kadi` porte le même id que le personnage Kadi, comme le squishy `boumbo` et le personnage Boumbo (`js/entities/squishy/squishies.js:440`, `js/entities/character/characters.js:610`) : registres différents, même être, voulu.

### X2. Règles d'exclusion (chaque « autre », « nouveau », « différent »)

| Où | Règle | Repli |
|---|---|---|
| Type du problème suivant (critère 2) | exclut le type du dernier problème joué, sauf jumeau et relance de jumeau | jamais nécessaire : chaque ligne de T1 a au moins 3 types |
| Nombres d'un problème (critères 12 et 16) | le tuple de nombres du dernier problème joué de même type (mémoire du module, par type, jamais sauvegardée) est exclu au tirage ; pour le jumeau, le tuple de l'exemple est exclu, et pour la relance d'un jumeau, celui du jumeau raté et celui de l'exemple ; on retire jusqu'à 50 fois | si un type n'avait qu'un tuple, l'exclusion serait sautée ; aucun type n'est dans ce cas (le plus petit ensemble : 15 tuples, palier 1), et le test vérifie que chaque couple palier et type a au moins 3 tuples, sans exception nommée |
| Objet du jumeau (critère 16) | le jumeau, et chacune de ses relances, prend un autre objet que l'exemple (5 objets dans B1) | jamais nécessaire |
| Personnages (B1) | P et Q sont deux personnages différents de la table locale | jamais nécessaire : 5 personnages (4 pour deuxEtapes B) |
| Cadenas suivant (critère 28) | le `data-code` du nouveau cadenas est différent de celui du cadenas raté (comparaison des tableaux) ; on refabrique jusqu'à 50 fois | jamais nécessaire : au palier 1, 30 codes possibles (2 symboles différents, dans l'ordre, parmi 6) |
| Énigme du chapitre (critère 34) | l'énigme suivante de la liste | mécanisme existant, 3 énigmes |

Tuples par type : reunion, ajout, retrait, compPlus, possible : (a, b) ; partie, ajoutInconnu : (t, a) ; compEcart : (a, g) ; compMoinsPlus : (t, b) ; deuxEtapes : (variante, a, b, c). Nombre de tuples au palier 1 : reunion 15, ajout 15, retrait 15 (somme de 1 à 5).

### Y1. Types (TypeScript strict sur `js/entities` et `js/shared`)

`js/entities/` et `js/shared/` sont vérifiés en strict (`tsconfig.strict.json`, `bun run typecheck`) ; règle commune : `conductor/checklist-mini-jeu.md` et `conductor/checklist-ile.md`. Jamais `any` ni `@ts-ignore`.

Aucun `@typedef` existant n'est étendu : toutes les entrées de l'île tiennent dans les types actuels, champ par champ.

| Table | Type existant | Entrées de cette track |
|---|---|---|
| `WORLDS` | `World` (`js/entities/world/worlds.js:8`) | `coffres` : tous les champs requis, `game: 'problems'` (une chaîne, permise) |
| `CHARACTERS` | `Character` (`js/entities/character/characters.js:5`) | 4 personnages avec `world`, sans `noGames` |
| `ITEMS`, `DECOS` | `Item` (`js/entities/item/items.js:6`) | 8 objets, 5 décorations, avec `world` |
| `CRAFTED` | `CraftedItem` (`js/entities/item/items.js:11`) | 2 recettes, sans `tier` |
| `SQUISHY_SERIES` | `SquishySeries` (`js/entities/squishy/squishies.js:22`) | `coffres` avec `world` |
| `SQUISHIES` | `Squishy` (`js/entities/squishy/squishies.js:26`) | 6 modèles, sans `how` |
| `SQUISHY_ISLAND_SERIES`, `SQUISHY_SERIES_ORDER` | `Record<string, string>`, `string[]` | une clé, un id |
| `LIVES_TABLE` | `Record<string, Record<number, number>>` (`js/entities/difficulty/difficulty.js:360`) | `problems: { 2: 4, 3: 4, 4: 3, 5: 3 }` |
| `state.skills.problems` | `SkillRecord` (`js/entities/game-state/state.js:22-35`, `lvl?`, `atLvl?`) | lu seulement (E1) ; aucun champ de sauvegarde nouveau |

Nouvelles fonctions, dans `js/entities/difficulty/rounds-saison3.js` (et non dans `difficulty.js`, presque plein : règle « 2 bis » de `conductor/checklist-ile.md`), typées strictement, sur le modèle de `rhythmRound` (`js/entities/difficulty/difficulty.js:818`) et de `tierValue` (`js/entities/difficulty/difficulty.js:92-105`) :

```js
/** @typedef {'concret' | 'concret-barre' | 'barres' | 'egalite'} ProblemsRep */
/**
 * Une ligne de « Le trésor raconté » (T1, R1).
 * @typedef {{ types: string[], min: number, max: number, ecart: number, rep: ProblemsRep,
 *   eqUnder: boolean, choices: number, gap: number, tens: boolean }} ProblemsRound
 */
/** @param {number} dd le palier de difficulté
 *  @returns {ProblemsRound} */
function problemsRound(dd) { /* tierValue sur les objets littéraux de R1 */ }

/**
 * Une ligne du « Code secret » (T2).
 * @typedef {{ wheels: number, palette: number, types: string[], maxEst: number, maxClues: number }} CodeRound
 */
/** @param {number} dd le palier de difficulté
 *  @returns {CodeRound} */
function codeRound(dd) { /* tierValue sur les objets littéraux ci-dessous */ }
```

Objets littéraux de `codeRound` (T2) : `1: { wheels: 2, palette: 4, types: ['est', 'absent'], maxEst: 1, maxClues: 3 }`, `2: { wheels: 3, palette: 4, types: ['est', 'pas', 'absent'], maxEst: 1, maxClues: 4 }`, `3: { wheels: 3, palette: 5, types: ['est', 'pas', 'absent', 'voisins'], maxEst: 1, maxClues: 4 }`, `4: { wheels: 4, palette: 5, types: ['est', 'pas', 'absent', 'voisins'], maxEst: 1, maxClues: 5 }`, `5: { wheels: 4, palette: 6, types: ['pas', 'absent', 'voisins', 'bout'], maxEst: 0, maxClues: 6 }`. Les objets de `problemsRound` sont ceux de R1. Les deux sont ré-exportés par `js/entities/difficulty/index.js`. `rounds-saison3.js` est créé par la première PR de la saison 3 qui en a besoin ; s'il n'existe pas encore, la PR 1a (ou la PR 2 si elle passe avant) le crée et le déclare dans `js/slices.cjs`, slice `difficulty`. `LIVES_TABLE`, `GENEROUS_KINDS` et `NO_TIMER_KINDS` restent dans `difficulty.js` (une ligne par jeu). `rounds-saison3.js` importe `tierValue` de `difficulty.js`, qui l'exporte pour cela (une ligne ajoutée à son `export`, par la première PR qui crée `rounds-saison3.js`). Tout nouveau code de cette track s'écrit strictement typé, quelle que soit sa slice (règle des deux checklists) : `problems.js` et `code.js` comme les ajouts aux slices `story`, `island`, `squishies`, `music`. Chaque fonction a `@param` et `@returns` ; chaque table a son `@type` ou son `@typedef` (`PB_PEOPLE` : `Record<string, { name: string, gender: 'f' | 'm', emoji: string }>` ; objets de B1 : `Record<string, { emoji: string, one: string, many: string, gender: 'f' | 'm' }>` ; symboles S2 : `Record<string, { emoji: string, name: string, of: string }>` ; un indice I2 : `{ t: 'est' | 'pas' | 'absent' | 'voisins' | 'bout', s: string, s2?: string, w?: number }`). Les types existants des slices de `main` suffisent, sans extension : les indices des deux jeux n'utilisent que les champs de `HintFx` (`glow`, `html`, `js/features/hints/hints.js:40-50`) et s'inscrivent par `registerHints` avec un `HintProvider<Q>` (`:55-57`, `:67`), où `Q` est le type de la question propre au jeu (`ProblemsHintQ = { moment: string, problem: object }` typé précisément dans `problems.js`, `CodeHintQ = { clues: object[] }` de même dans `code.js`) ; `setHintQuestion(kind, q, { choices })` garde sa signature (`:180-185`) ; procédure d'`include` (règle de `conductor/checklist-mini-jeu.md` section 3 et `conductor/checklist-ile.md` section 2) : la PR qui crée une slice essaie d'ajouter son glob à `include` de `tsconfig.strict.json` et lance `bun run typecheck` ; si des erreurs apparaissent hors des fichiers de la track, elle retire le glob et le note au journal de décisions du plan. Résultat attendu aujourd'hui : `"js/features/minigames/problems/**/*.js"` (PR 1a) et `"js/features/minigames/code/**/*.js"` (PR 2) n'y entrent pas, car un mini-jeu importe `minigame-engine`, qui n'est pas strict ; les slices existantes non strictes que la phase 3 touche (`story`, `island`) ne sont pas ajoutées. Dans tous les cas, le nouveau code est typé à la main ; le thème `MUSIC_THEMES.coffres` tient dans `MusicTheme` (`js/features/music/music.js:20-31`) ; les 6 dessins tiennent dans `SqArt`. Jamais `any` ni `@ts-ignore`.

## Décisions

| Id | Décision | Pourquoi | Source |
|---|---|---|---|
| D1 | Les 4 étapes du jeu `problems` sont Comprendre, Dessiner (modéliser), Calculer, Répondre, avec la question « est-ce possible ? » en régulation | Le modèle du programme 2024 | https://www.education.gouv.fr/sites/default/files/ensel135_annexe4.pdf (CP et CE1, « La résolution de problèmes » : « résolution de problèmes en quatre phases », « est-ce possible ? ») |
| D2 | Au CP (paliers 1 et 2), calculer peut se faire en dénombrant les objets du coffre | Le programme le dit pour le CP | même PDF, CP : « Au CP, la phase « Calculer » […] à dénombrer les éléments restants » |
| D3 | Paliers 1 et 2 : parties-tout en une étape ; palier 3 : comparaison avec deux barres ; paliers 4 et 5 : deux étapes et « plus » qui appelle une soustraction | CP : additifs en une étape parties-tout ; CE1 : comparaison avec « un schéma avec deux barres », deux étapes, mot « plus » et soustraction | même PDF, CP « Exemples de réussite » et CE1 « Résoudre des problèmes additifs de comparaison en une étape » ; le CP admet déjà deux étapes jusqu'à 30, le placer au palier 4 reste prudent |
| D4 | Progression concret (objets à toucher), imagé (barres), abstrait (égalité) | Le programme décrit ce « passage progressif du concret » à l'abstrait | même PDF, « Principes » (manipulation, représentations schématisées) |
| D5 | Le schéma en barres est l'outil de modélisation | Schémas pour soutenir la modélisation | même PDF ; https://eld.bl.uk/catalog/100072653733_0x000001 (fourni par le brief, non relu : serveur injoignable) |
| D6 | Vignettes sans décor : seulement les personnages et objets de l'histoire | Les illustrations qui portent une information inutile gênent | https://link.springer.com/article/10.1007/s10649-017-9802-3 (fourni par le brief, non relu : accès refusé) |
| D7 | Exemple résolu puis estompé (E1) | Effet des exemples résolus et de l'estompage | https://link.springer.com/content/pdf/10.1007/s10648-023-09745-1.pdf (fourni par le brief, non relu : accès refusé) |
| D8 | Le mode d'exemple se lit dans `state.skills.problems.atLvl`, sans nouveau champ de sauvegarde | `atLvl` existe, est par jeu et se vide à chaque changement de niveau | `js/features/adaptive/adaptive.js:126`, `:129`, `:135`, `:141` |
| D9 | Toutes les étapes et le jumeau sont dans une seule fenêtre ouverte dès le départ | Le test joue `gameSolution` et refuse un sélecteur absent à l'ouverture | `test/games.test.js:310`, `:314` |
| D10 | Une erreur relance un autre problème ou un autre cadenas | Anti-devinette du moteur | `js/features/minigame-engine/engine.js:112` (`loseLife`, `onRetry`), `conductor/product-guidelines.md:7` |
| D11 | `problems` ne double pas `math`, `calc`, `money`, `share` | `math` illustre `a ± b` sans histoire, `calc` est sans image, `money` compose une somme, `share` travaille les fractions | `js/features/minigames/math/math.js:1`, `calc/calc.js:1`, `money/money.js:1`, `share/share.js:1` |
| D12 | Essais de `problems` : `{ 2: 4, 3: 4, 4: 3, 5: 3 }` ; `code` dans les jeux généreux | Plusieurs étapes notées par mission : un essai de plus que le barème généreux | `js/entities/difficulty/difficulty.js:360`, `:385` |
| D13 | Pas de minuteur sur les deux jeux | Politique commune des nouveaux jeux | `js/entities/difficulty/difficulty.js:446`, brief de la saison 3 |
| D14 | `problems` dans `calcul`, `code` dans `logique` | Décision d'Amrou (tableau de la saison 3) | `js/features/parents/parents.js:45`, `:55` |
| D15 | Les deux jeux sont proposés dès 6 ans, pas avant (aucun ajout dans `AGE_GAME_TYPES`) | Dès 6 ans tous les jeux sont ouverts ; la compréhension orale d'un énoncé et la déduction à plusieurs indices sont du CP. Défaut du rédacteur, à juger à la revue | `js/entities/difficulty/game-types.js:100` |
| D16 | Jeu favori : `problems` à tout âge | Demande du parent « plus de maths ». Défaut du rédacteur, à juger à la revue (les autres îles changent de jeu à 7 ans) | `js/entities/world/worlds.js:223`, `js/features/players/profiles-ui.js:432` |
| D17 | Le code secret est un jeu de déduction à indices fixes donnés d'avance (pas de retour essai par essai) | Un jeu à retour par essai se gagne en tâtonnant ; ici tout se déduit avant d'ouvrir, et l'ancienne idée (table de correspondance) n'était pas une déduction | `git show HEAD:conductor/tracks/monde-etoiles_20261111/spec.md` (« Déchiffrer un message avec une table de correspondance ») |
| D18 | Un cadenas par mission, palier 1 à 2 roues et 4 symboles (12 codes) | Le test exige tous les éléments à l'ouverture ; 12 codes rendent le hasard peu payant, et une erreur change de cadenas | `test/games.test.js:310`, `js/features/minigame-engine/engine.js:112` |
| D19 | Aucun indice n'écarte de choix (`fx.dim`) | Règle : au plus une, au niveau 2, avec 4 choix ou plus ; plus simple de n'en écarter aucune | `js/features/hints/hints.js:37`, `:38` |
| D20 | Récompense du chapitre : 16 pièces | Entre la Musique (14) et le grand final des Licornes (20). Défaut du rédacteur, à juger à la revue | `js/features/story/story.js:350`, `:408` |
| D21 | Le morceau 3 de la carte : gagné quand `state.storySolved.coffres` est vrai, rien d'autre n'est stocké ; carte et voix par `zapMapFound()`, `zapMapPieces()`, `zapMapSVG(zapMapFound(), { fresh: id })`, `zapMapSay(n)` | Contrat fixé par la track `saison3-ouverture` (`ZAP_MAP_PIECES = ['crayons', 'dumplings', 'coffres', 'chatouilles', 'concert']`) | spec de `saison3-ouverture`, comportements 22 à 25 et 29, « Contrats partagés » |
| D22 | Position `{ x: 82, y: 70 }` sur la carte de la saison 3 | Positions des cinq îles fixées ensemble et vérifiées contre la règle de chevauchement : crayons `{ x: 18, y: 78 }`, dumplings `{ x: 50, y: 74 }`, coffres `{ x: 82, y: 70 }`, chatouilles `{ x: 82, y: 26 }`, concert `{ x: 50, y: 22 }` | décision de coordination de la saison 3 (22/11/2026) ; même place que les Bonbons dans la saison 2, `js/entities/world/worlds.js:206` |
| D23 | Thème de musique `pluck` et `tick` | Instruments déjà disponibles | `js/features/music/music.js:38`, `:49` |
| D25 | Erreur pendant le jumeau : nouveau jumeau seul, `n = 0` tant qu'aucun jumeau n'est réussi | Ne pas faire revoir l'exemple à chaque erreur. Défaut de Claude, à juger à la revue par Amrou | tour 1 du testeur à blanc ; E1 |
| D26 | Un symbole posé sur une seconde roue quitte la première | Jamais de doublon, aucune erreur « bête ». Défaut de Claude, à juger à la revue par Amrou | tour 1 du testeur à blanc ; critère 25 |
| D27 | Brancher un mini-jeu touche aussi `js/app/main.js` (import de la slice) et `js/entities/difficulty/index.js` (ré-export de `<cle>Round`) | Comme `nesting` | `js/app/main.js:55`, `js/entities/difficulty/index.js:30` |
| D28 | Barre « ? » à sa vraie longueur, échelle = plus grand nombre du schéma ; leurres à au plus 3 (paliers 1 à 3) ou 10 (paliers 4 et 5) du résultat | Un schéma montre les relations entre quantités, et estimer l'ordre de grandeur fait partie de l'apprentissage (« est-ce possible ? ») ; des leurres proches empêchent de répondre à la seule largeur. Défaut de Claude, à juger à la revue par Amrou | tour 2 du testeur à blanc ; F1, R1 |
| D29 | Les dessins des 6 squishies vont dans `SQ_ART` de `js/features/squishies/squishy-art.js` | Les dessins y vivent déjà sur `main` ; `squishyArtSVG` renvoie une chaîne vide sans entrée `SQ_ART` | `js/features/squishies/squishy-art.js:55`, `:438`, `:579` |
| D30 | `problems` livré en deux PR : 1a (paliers 1 à 3), puis 1b (paliers 4 et 5 : égalité, `compMoinsPlus`, `deuxEtapes`, `possible`) ; `bun run release patch` pour 1a, 1b et 2, `bun run release track` pour 3 | Une PR par morceau livrable ; avant 1b, `tierValue` sert la table du palier 3 aux paliers 4 et 5 | `js/entities/difficulty/difficulty.js:92-105` ; décision de coordination du 22/11/2026 ; `conductor/workflow.md:57-58` |
| D31 | Essais épuisés : échec enregistré (`recordMission(false)`) comme pour tous les jeux, E1 inchangé (la mission suivante peut avoir `n = 1` sans jumeau réussi) | Même règle pour tous les jeux. Défaut de Claude, à juger à la revue par Amrou | tour 7 du testeur à blanc ; `js/features/adaptive/skills.js:37` |
| D32 | Types : aucun `@typedef` existant étendu ; `ProblemsRound` et `CodeRound` nouveaux, `problemsRound` et `codeRound` typés strictement ; tout le nouveau code typé à la main ; les deux slices de mini-jeux n'entrent dans `tsconfig.strict.json` que si `bun run typecheck` reste vert (pas aujourd'hui : `minigame-engine` n'est pas strict) | `js/entities` est en TypeScript strict ; les entrées de l'île tiennent dans `World`, `Character`, `Item`, `CraftedItem`, `SquishySeries`, `Squishy` | table Y1 ; `conductor/checklist-mini-jeu.md:30`, `conductor/checklist-ile.md:10` |
| D33 | Taille : `problems` en 5 fichiers frères (Z1) ; `problemsRound` et `codeRound` dans `rounds-saison3.js` ; dessins dans `characters-art-saison3.js` (`ART_S3`) | `max-lines` à 1100 ; `difficulty.js` et `characters-art.js` presque pleins | `.oxlintrc.json` ; `conductor/checklist-ile.md` section « 2 bis » |
| D24 | Noms des personnages proposés par Claude, jugés par la joueuse | Politique commune | brief de la saison 3 ; `conductor/product-guidelines.md:19` |

## Politiques

- **Arbitrages** :
  - Anti-devinette contre douceur : l'anti-devinette gagne ; une erreur relance un autre problème, même à la dernière étape. La relance garde le mode d'exemple.
  - Ordre des îles : `WORLDS.coffres` se place dans `WORLDS` juste après `dumplings` (l'ordre des clés fait le parcours, `js/entities/world/worlds.js:298`, recalculé par `refreshArchipelagos()`).
  - Série de squishies : ajoutée en fin de `SQUISHY_SERIES_ORDER`, après les séries déjà livrées.
- **Défauts** : constantes plutôt que réglages ; aucune dépendance nouvelle ; aucun nouveau champ de sauvegarde (`migration: false`) ; hasard par `random()`, `pickRandom()`, `shuffle()` ; handlers par `setHandler`. Fin de mission par `winSoon()`. Textes : ceux de cette spec, mot pour mot ; une phrase composée (gabarit de B1, N1, H1, I2) suit ses accords (genre, « une »/« un », « du »/« de la »/« de l' »). Voix : tout passe par `speak()` et `data-say` ; la track `voix-naturelle` changera la voix sans toucher cette track. `speak()` passe le texte par `toSpoken()` (`js/shared/ui/voice.js:55`) : il enlève les balises, remplace les emojis connus par leur mot (`EMOJI_WORDS`, dont 🐚, 🌸, ⭐, 💎, 🐟, 🌙 ; 🪙 devient vide), supprime les autres, retire l'espace devant `? ! , . :` et élide. Après une erreur, ni `problems` ni `code` ne disent de phrase propre : seule parle la phrase de `loseLife` (`speakWrongHint()`, `js/features/minigame-engine/engine.js:112`), puis l'énoncé du nouveau problème ou la consigne du nouveau cadenas, dits à la relance (`scheduleRetry`, 900 ms de jeu plus tard), comme dans les autres jeux. Toute vérification de voix d'un test compare donc à `toSpoken(texte de la spec)` et la cherche dans `spoken` par `includes`, jamais en ne lisant que la dernière phrase (appelé dans la page de test par `ev`), jamais au texte brut. Les phrases dites de cette spec (B1, N1, H1, H2, I2, K1, C1, P1 à P3, consignes) ne contiennent aucun emoji qui doublerait un mot : les objets et symboles y sont nommés en mots, les emojis restent dans les vignettes et sur les boutons ; les seuls emojis dits sont décoratifs en fin ou milieu de phrase (🗝️ et 🗺️ du chapitre), que `toSpoken` supprime sans rien doubler.
- **Référence visuelle** : la fenêtre de mini-jeu de « Opérations magiques » (`js/features/minigames/math/math.js`, `gameHeader`, `livesBar`, boutons `.num-btn`) pour les choix de nombres ; les étiquettes et cases de « Assembler l'image » (`js/features/minigames/jigsaw/jigsaw.js`, toucher une pièce puis une case) pour poser les étiquettes ; les boutons ronds de « Grave ou aigu ? » (`js/features/minigames/pitch/pitch.js`) pour la palette du code ; l'île `musique` pour l'île (`js/features/island/island.js:340`). Boutons d'au moins 64 px, tout tient sur un écran de 360 px de large sans défilement horizontal : ces mesures sont jugées à l'œil sur téléphone (lignes 👤 S7, S8, S10), jsdom ne calcule aucune mise en page.
- **Détails non écrits** : l'agent prend le défaut de la référence ou l'option la plus simple, le note dans le journal de décisions du plan, l'humain juge à la revue.

## Hors périmètre

- La track `saison3-ouverture` (onglet, écran d'ouverture, prologue, carte de Zap) et les autres îles de la saison.
- Changer `math`, `calc`, `money`, `share` ou le moteur des mini-jeux.
- Les explications d'erreur détaillées (track `erreurs-expliquees`), le défi étoile (track `aller-plus-loin`), les clips de voix (track `voix-naturelle`).
- La multiplication et la division dans les problèmes.
- Glisser-déposer : tout se fait en touchant.

## Contrats partagés

| Contrat | Forme (ou lien) | Propriétaire | Consommateurs |
|---|---|---|---|
| Archipel de la saison 3 | `ARCHIPELAGOS[3]`, `refreshArchipelagos()`, `shownArchipelagos()` | `saison3-ouverture` (`entities/world`) | `WORLDS.coffres.saison = 3`, `test/coffres.test.js` |
| Dessins de la saison 3 | `ART_S3` de `js/entities/character/characters-art-saison3.js`, aides de `characters-art-kit.js` | `saison3-ouverture` | K1 (4 dessins) |
| Carte de Zap | `ZAP_MAP_PIECES` (coffres au rang 3), `zapMapFound()`, `zapMapPieces()`, `zapMapSVG(zapMapFound(), { fresh: id })`, `zapMapSay(n)`, `.story-zapmap` ; morceau gagné si `state.storySolved.coffres` | `saison3-ouverture` (`features/story`) | chapitre C1 (critères 32 et 33) |
| Île précédente | `WORLDS.dumplings` présent avant `WORLDS.coffres` | `monde-dumplings` | `worldsOf(3)`, critère 31 |
| Mode d'exemple | `state.skills.problems.lvl` et `.atLvl` (lecture seule) | slice `adaptive` | `problems` (E1) |
| `gameSolution` | liste ordonnée de sélecteurs, tous présents à l'ouverture | moteur des mini-jeux | `test/games.test.js`, `test/companions.test.js` |
| Types de difficulté | `ProblemsRound`, `CodeRound` (table Y1), dans `js/entities/difficulty/rounds-saison3.js` | première PR de la saison 3 qui crée ce fichier (`entities/difficulty`) | `problems.js`, `code.js`, tests |
| Données de la fenêtre | `#pb-root[data-type][data-a][data-b][data-c][data-t][data-r]` ; `#code-root[data-wheels][data-palette][data-code][data-clues]` (table A2) | cette track | `INDEPENDENT.problems` et `INDEPENDENT.code` de `test/games.test.js` |

## Surface d'attaque

Aucune : aucune entrée de texte, aucun import, aucune donnée extérieure. Les prénoms ne sont pas utilisés dans les énoncés.

## Zones sensibles touchées

Relecture humaine demandée dans chaque PR :
- `js/features/parents/parents.js` (espace parents) : `SKILL_GROUPS` reçoit `problems` (groupe `calcul`, PR 1a) et `code` (groupe `logique`, PR 2), une donnée seulement ;
- PWA : `index.html` et `sw.js` régénérés par `bun run sync` (nouveaux fichiers des slices) et `bun run release` (cache), jamais écrits à la main ;
- garde d'architecture : deux slices ajoutées dans `js/slices.cjs` selon la checklist, et les fichiers frères de `problems` déclarés dans sa slice, sans assouplir la garde.

Pas de champ de sauvegarde, pas d'import, pas de pause, pas de dépendance.

## Smoke test

🤖 : un agent la prouve et joint la preuve. 👤 : seul l'humain peut juger (rendu, ressenti, téléphone, vrai paiement).

| Id | Qui | Étapes | Attendu | Niveau visé |
|---|---|---|---|---|
| S1 | 🤖 | `bun run test games` | `problems` et `code` gagnés à chaque palier 1 à 5, 3 tirages, solution vérifiée par `INDEPENDENT` | test-verified |
| S2 | 🤖 | `bun run test problems` | critères 1 à 20 : table T1 (types, bornes sur 500 tirages par palier), un mauvais choix à chaque étape relance un autre problème, modes `n = 0`, `1`, `2`, phrases de B1 accordées (« une pièce », jamais « 1 pièce ») | test-verified |
| S3 | 🤖 | `bun run test code` | critères 21 à 30 : 200 cadenas par palier, chacun à solution unique, chaque indice nécessaire, T2 respectée ; mauvais code : nouveau cadenas ; « Ouvrir » inactif tant qu'une roue est vide | test-verified |
| S4 | 🤖 | `bun run test companions` | 2 indices par étape, distincts, jamais le résultat, aucune réponse écartée, jeu gagnable après les indices | test-verified |
| S5 | 🤖 | `bun run test coffres` (après `saison3-ouverture` et `monde-dumplings`) | critères 31 à 37 : île, niveau 86, saison 3, `worldsOf(3).indexOf('coffres') === 2`, série `coffres` présente dans `SQUISHY_SERIES_ORDER` (pas forcément la dernière), carte, personnages, objets, recettes, décorations, série, musique, chapitre, épisodes, récompense une seule fois, jeu favori | test-verified |
| S6 | 🤖 | `bun run test niveaux` puis `bun run check` | vert, aucune erreur JS | test-verified |
| S7 | 👤 | téléphone : jouer 5 problèmes au palier 2 (6 ans), dont le premier en exemple résolu | les objets se touchent bien, les barres se lisent (aucune plus étroite qu'un doigt), tout tient sur l'écran sans défilement horizontal, l'enfant comprend sans lire | runtime-verified |
| S8 | 👤 | téléphone : 3 cadenas aux paliers 1 et 2 | l'enfant trouve le code en écoutant les indices, pas en tâtonnant ; roues, palette et cartes tiennent sur 360 px | runtime-verified |
| S9 | 👤 | la joueuse écoute les noms, les répliques et l'histoire de l'île | elle garde ou change les noms (Clémence, Kadi, Grignote, Pinçou) | runtime-verified |
| S10 | 👤 | regarder les 4 dessins de personnages, le paysage et les 6 squishies | doux, lisibles, dans le style du jeu | runtime-verified |

## Questions ouvertes

