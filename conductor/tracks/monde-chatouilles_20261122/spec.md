---
status: faite           # brouillon | validée | faite ; validée à la demande d'Amrou le 26/11/2026, livrée en v71 le 27/11/2026
issue: 0
size: M                  # trois phases, une PR chacune
migration: false         # aucun champ de sauvegarde nouveau (voir D17)
sensitive: true          # PWA : index.html et sw.js régénérés par bun run sync
files:
  - js/features/minigames/coding/coding.js
  - js/features/minigames/coding/coding.css
  - js/features/minigames/coding/index.js
  - js/features/minigames/sentence/sentence.js
  - js/features/minigames/sentence/sentence.css
  - js/features/minigames/sentence/index.js
  - js/features/island/tickle.js
  - js/features/island/island.js
  - js/features/island/island-s3.js                # ISLE_SCENERY_S3.chatouilles, préparé par saison3-ouverture
  - js/features/island/island-view.js
  - js/entities/difficulty/difficulty.js            # coding et sentence dans GENEROUS_KINDS (barème generous) et NO_TIMER_KINDS
  - js/entities/difficulty/difficulty-s3.js         # codingRound, sentenceRound et leurs types (créé par la première track qui en a besoin)
  - js/features/island/island.css
  - js/entities/difficulty/index.js
  - js/app/main.js
  - js/entities/difficulty/game-types.js
  - js/features/adaptive/adaptive.js
  - js/features/parents/parents.js
  - js/shared/ui/sound.js
  - js/shared/styles/design-system-v21.css
  - js/entities/world/worlds.js
  - js/entities/character/characters-s3.js          # CHARACTERS_S3 (4 personnages) et CHARACTER_TICKLES, préparé par saison3-ouverture
  - js/entities/character/characters-art-s3.js      # season3Art(ART, kit) : 4 dessins, préparé par saison3-ouverture
  - js/entities/character/index.js                  # réexport de CHARACTER_TICKLES
  - js/entities/item/items.js
  - js/entities/squishy/squishies.js               # série guilis : une ligne par table de séries
  - js/entities/squishy/squishies-s3.js            # SQUISHIES_S3 (6 modèles), préparé par saison3-ouverture
  - js/features/squishies/squishy-art.js           # SQ_BOX_COLORS.guilis (une ligne)
  - js/features/squishies/squishy-art-s3.js        # SQ_ART_S3 : dessins des 6 modèles, préparé par saison3-ouverture
  - js/features/story/story-s3.js                  # STORY_S3.chatouilles, préparé par saison3-ouverture
  - js/features/story/episodes.js
  - js/features/music/music.js
  - js/slices.cjs
  - test/chatouilles.test.js
  - test/games.test.js
  - test/smoke.test.js
  - test/sounds.test.js
  - test/squishies.test.js
taster: { facts: 0, decisions: 0, rounds: 14 }
---

<!-- Gabarit cothon 0.4.0 (setting-up-docs), adopté dans Conductor (cothon 0.2.0-2 et 0.4.0-6) : une nouvelle track part de ce fichier. -->

# Spec : 🪶 Le Monde des Chatouilles (saison 3 « La Grande Expédition », île 4)

- Nouveau projet : non
- **L'île :** `chatouilles`, emoji 🪶, niveau d'ouverture **94**. Règle et tableau de tous les niveaux : `conductor/niveaux.md`.
- Idée de la joueuse : un monde de plumes, de rires et de guilis, où les habitants sont chatouilleux et rient pour un rien.
- Prérequis de la phase 3 (l'île) : la track `saison3-ouverture` (troisième archipel, `refreshArchipelagos()`, `shownArchipelagos()`, la carte de Zap) est sur `main`, **et** l'île précédente de la saison, `coffres`, est dans `WORLDS` (ordre de livraison : crayons, dumplings, coffres, chatouilles, concert). Les phases 1 et 2 (les deux mini-jeux) n'ont aucun prérequis. Les tests d'onglets de la carte (3 onglets) appartiennent à la track Crayons, pas à celle-ci.
- Références à suivre en entier : [checklist-mini-jeu](../../checklist-mini-jeu.md) (phases 1 et 2), [checklist-ile](../../checklist-ile.md) (phase 3), [product-guidelines](../../product-guidelines.md).

## Problème

La joueuse veut un monde où l'on chatouille et où tout le monde rit. Elle a 6 ans, elle apprend à lire, et elle aime qu'un personnage réagisse quand elle le touche. Il lui faut deux jeux nouveaux : guider une plume sur un quadrillage (le codage d'un déplacement, au programme du CP et du CE1), et remettre en ordre une phrase drôle (la lecture). Les chatouilles doivent rester bienveillantes : on chatouille seulement qui en a envie, et on s'arrête quand l'autre dit stop.

## Comportement attendu

### A. Mini-jeu « Le chemin de la plume » (`coding`, phase 1)

1. Étant donné le jeu `coding` lancé au palier `p`, quand la grille s'affiche, alors sa taille, son mode, son nombre de cactus et sa barre de programme suivent la ligne `p` de la table T1 (`codingRound(p)`).
2. Étant donné une grille générée à n'importe quel palier, quand on calcule son plus court programme (règle G4), alors il existe, sa longueur est dans `len` et son nombre de virages dans `turns` de T1 ; si `rocks > 0`, au moins un cactus est dans le rectangle qui va de la plume à l'ami (bords compris).
3. Étant donné 300 appels `codingBuildRound(p, rng)` par palier (graines différentes), quand on lit leurs retours (G5), alors chacun a `fallback === false` et `tries <= 500` ; et `codingRun(r.grid, r.best.prog).end === 'goal'`.
4. Étant donné le mode `abs` (palier 1), quand l'enfant touche ⬆️ ➡️ ⬇️ ⬅️, alors l'instruction s'ajoute au bout du programme et sa direction est dite (« en haut », « à droite », « en bas », « à gauche »).
5. Étant donné le mode `rel` (paliers 2 à 5), quand l'enfant touche ⬆️, ↰ ou ↱, alors l'instruction s'ajoute et la voix dit « avance », « tourne à gauche » ou « tourne à droite ».
6. Étant donné un programme qui a `slots` instructions, quand l'enfant touche une instruction de la palette, alors rien ne s'ajoute et la voix dit le texte C7.
7. Étant donné un programme non vide, quand l'enfant touche une instruction du programme, alors elle est retirée (son `pop`) et les suivantes se décalent.
8. Étant donné un programme vide, quand l'enfant touche « ▶️ Go », alors la plume ne bouge pas, aucun essai n'est perdu, et la voix dit C6.
9. Étant donné un programme, quand l'enfant touche « ▶️ Go », alors la plume repart de sa case de départ, exécute une instruction toutes les 450 ms (`CODING_STEP_MS`), l'instruction en cours est surlignée, et la palette, le programme et « Go » sont inactifs pendant le trajet.
10. Étant donné un trajet, quand la plume entre dans la case de l'ami, alors le trajet s'arrête (les instructions restantes ne sont pas jouées), l'ami rit (classe `giggle-wiggle`, son `giggle`), la voix dit C8, et la mission est gagnée par `winSoon(WIN_DELAY_LONG)`.
11. Étant donné un trajet, quand l'instruction suivante mènerait hors de la grille ou sur un cactus, alors la plume reste sur sa case et tremble (classe `cd-bump`), l'instruction fautive prend la classe `ko`, `loseLife(boutonGo, { disable: false })` (options de type `LoseLifeOptions`, `engine.js:116-120`) est appelé, puis la voix dit C9 (cactus) ou C10 (bord).
12. Étant donné un trajet qui finit ailleurs que chez l'ami, quand la dernière instruction est jouée, alors la case d'arrêt est entourée (classe `cd-stop`), `loseLife(boutonGo, { disable: false })` est appelé, puis la voix dit C11.
13. Étant donné une erreur (lignes 11 et 12), quand l'enfant regarde la grille, alors la même grille et le même programme restent ; dès qu'il modifie le programme ou touche « Go », la plume revient à son départ et les marques `ko` et `cd-stop` s'effacent.
14. Étant donné le palier 1 (essais illimités), quand le programme est faux plusieurs fois, alors la grille ne change jamais d'elle-même ; aux paliers 2 à 5, la mission est perdue quand les essais de `livesFor('coding', p)` sont épuisés (comportement du moteur).
15. Étant donné le mode `rel`, quand la plume tourne, alors son dessin pivote d'un quart de tour sur place, et la direction de départ est « vers le haut » au palier 2, tirée au hasard aux paliers 3 à 5.
16. Étant donné une grille, quand le jeu l'affiche, alors `setSolution` contient les sélecteurs des instructions du plus court programme (G4), dans l'ordre, puis `#cd-go` ; les jouer gagne la mission (`test/games.test.js`, vérificateur `coding`).
17. Étant donné le jeu `coding`, quand on demande les deux indices, alors ils suivent la table H1, aucun n'écarte de choix, et le jeu reste gagnable après (`test/companions.test.js`).

### B. Mini-jeu « La phrase rigolote » (`sentence`, phase 2)

18. Étant donné le jeu `sentence` lancé au palier `p`, quand la phrase s'affiche, alors elle est tirée dans la banque de son nombre d'étiquettes (`sentenceRound(p).n`, table T3), jamais la même que la précédente, et l'image (`pic`) n'est montrée qu'aux paliers 1 et 2.
19. Étant donné une phrase, quand les étiquettes s'affichent dans la réserve, alors chaque mot de la phrase est une étiquette (découpage aux espaces, la majuscule du premier mot et le point du dernier sont gardés), et leur ordre de départ n'est aucun des ordres acceptés.
20. Étant donné une étiquette dans la réserve, quand l'enfant la touche, alors le mot est dit à voix haute (sans le point) et l'étiquette va dans la première case vide de la ligne de phrase.
21. Étant donné une étiquette posée dans la ligne, quand l'enfant la touche, alors le mot est dit et l'étiquette retourne à sa place dans la réserve.
22. Étant donné une ligne partiellement remplie, quand l'enfant touche « 🔊 Lis ma phrase », alors un seul appel `speak` dit les textes des étiquettes posées tels quels (point final compris : seul le toucher d'une étiquette seule, ligne 20, retire le point), dans l'ordre de la ligne, joints par une espace (le test compare à `toSpoken(mots.join(' '))`) ; si la ligne est vide, un seul `speak` dit S5.
23. Étant donné la dernière case remplie, quand la phrase construite (mots joints par une espace) est l'un des ordres acceptés (règle R1), alors un seul appel `speak` dit la phrase construite, une espace, puis S3 (le test compare à `toSpoken(phrase + ' ' + S3)`), les étiquettes s'illuminent, `stepOk` puis `winSoon(WIN_DELAY_LONG)`.
24. Étant donné la dernière case remplie, quand la phrase construite n'est pas acceptée, alors la ligne rit (classe `giggle-wiggle`, son `giggle`), `loseLife(derniereEtiquette, …)` est appelé, puis un seul appel `speak` dit la phrase construite, une espace, puis S4 (à la 2ᵉ erreur, le texte de remplacement de S4) ; le test compare à `toSpoken(phrase + ' ' + texte)`, et ce `speak` vient après `loseLife` (D8) ; à la 1ʳᵉ erreur sur cette phrase les étiquettes restent en place (`{ disable: false }`), à la 2ᵉ une autre phrase arrive (`{ onRetry: renderSentence, disable: false }`, relance annulable).
25. Étant donné une phrase, quand le jeu l'affiche, alors `setSolution` contient les étiquettes dans l'ordre de `t` (sélecteurs `.st-tile[data-i="k"]`) ; les jouer gagne (`test/games.test.js`, vérificateur `sentence`).
26. Étant donné la banque, quand le test la parcourt, alors chaque entrée a exactement `n` mots, chaque ordre de `ok` est une permutation de ses étiquettes, chaque `pic` existe aux tailles 3 et 4, et chaque mot du palier 1 (sans le point) ne contient que les lettres `a e é i o u y l r m s t p n f d v` (règle R2).
27. Étant donné le jeu `sentence`, quand on demande les deux indices, alors ils suivent la table H2, aucun n'écarte d'étiquette, et le jeu reste gagnable après.

### C. Branchement des deux jeux (phases 1 et 2)

28. Étant donné `GAME_TYPES` et `GAME_LIST`, quand on les lit, alors `coding` (🪶 « Le chemin de la plume ») et `sentence` (📝 « La phrase rigolote ») y sont, et aucun des deux n'est dans les tranches d'âge `max: 4` et `max: 5` de `AGE_GAME_TYPES` (proposés à 6 ans et plus, et sans âge).
29. Étant donné `NO_TIMER_KINDS` et les essais, quand on les lit, alors les deux jeux n'ont pas de minuteur et sont dans le barème `generous` (palier 1 : illimités ; 2 : 4 ; 3 : 3 ; 4 : 3 ; 5 : 2).
30. Étant donné `SKILL_GROUPS`, quand on les lit, alors `coding` est dans `formes` et `sentence` dans `lire` ; `PROGRESS_CHEERS.coding` vaut « Tu programmes de mieux en mieux ! » et `PROGRESS_CHEERS.sentence` « Tes phrases veulent dire de plus en plus de choses ! ».
31. Étant donné le son `giggle`, quand `playSound('giggle')` est appelé, alors trois petits glissés sinus montent et redescendent (table T5), et `SOUND_FAMILY.giggle` vaut 0,9.

### D. L'île (phase 3)

32. Étant donné un niveau de 93, quand la carte de la saison 3 s'affiche, alors l'île `chatouilles` est verrouillée ; en atteignant le niveau 94, elle s'ouvre avec l'écran « Nouvelle île » précédé de son chapitre.
33. Étant donné `WORLDS.chatouilles`, quand on le lit, alors il contient les valeurs de la table I1, `WORLD_ORDER.indexOf('chatouilles') === WORLD_ORDER.indexOf('coffres') + 1` et `worldsOf(3).indexOf('chatouilles') === 3` (critères qui restent vrais après la livraison de `concert`), et `worldGame('chatouilles', 6)` vaut `coding`, `worldGame('chatouilles', 7)` vaut `sentence`, `worldGame('chatouilles', 0)` vaut `sentence`.
34. Étant donné les personnages de l'île, quand on les lit, alors ce sont les 4 de la table I2, chacun avec son butin, ses 3 répliques, son genre, sa fiche `tickle` (`CHARACTER_TICKLES[id]`, table I3) et son dessin dans `CHAR_ART`.
35. Étant donné les objets, quand on les lit, alors les 8 objets, les 2 recettes et les 5 décorations de la table I4 existent avec `world: 'chatouilles'`, et `favoritesOf(id)` donne 2 objets pour chaque personnage.
36. Étant donné la série de squishies `guilis`, quand on la lit, alors ses 6 modèles sont ceux de la table I5, `SQUISHY_ISLAND_SERIES.chatouilles === 'guilis'`, `guilis` est ajoutée à la fin de `SQUISHY_SERIES_ORDER` (le test vérifie `SQUISHY_SERIES_ORDER.indexOf('guilis') > SQUISHY_SERIES_ORDER.indexOf(SQUISHY_ISLAND_SERIES.coffres)`, qui reste vrai après la livraison de `concert`), chaque modèle a son dessin dans `SQ_ART`, et `SQ_BOX_COLORS.guilis` vaut `['#FFF1B8', '#8A3D6B']` (lu par son nom, comme l'état du jeu).
37. Étant donné l'île courante `chatouilles`, quand la musique joue, alors elle suit `MUSIC_THEMES.chatouilles` (table I6), et `body[data-world="chatouilles"]` a les jetons de couleur de la table I7.
38. Étant donné l'île courante `chatouilles` et un personnage qui n'est pas « au repos », quand l'enfant le touche sur la scène, alors il fait un « rire de bonjour » (il est content de te voir : ce n'est pas une chatouille, aucune envie n'est tirée) : son visage (`#scene .isle-char[data-char="<id>"] .emoji`, voir K5) prend `giggle-wiggle` pendant 900 ms, `giggle` joue, l'appareil vibre 25 ms, et le dialogue s'ouvre 600 ms après le toucher (`HELLO_LAUGH_DELAY`).
39. Étant donné un personnage « au repos » (règle K4), quand l'enfant le touche sur la scène, alors il ne fait pas de rire de bonjour et le dialogue s'ouvre tout de suite, comme sur les autres îles.
40. Étant donné une autre île, quand l'enfant touche un personnage, alors rien ne change par rapport à aujourd'hui (pas de rire, pas de bouton de chatouilles).
41. Étant donné le dialogue d'un personnage de l'île qui n'est pas au repos, quand il s'ouvre, alors un bouton « 🪶 Des chatouilles ? » (`#btn-tickle`) est présent entre « Choisir un jeu » et « Offrir un objet ».
42. Étant donné ce bouton, quand l'enfant le touche une première fois, alors l'envie est tirée une fois pour ce dialogue (`random() < tickle.want`) ; sans envie, la bulle et la voix disent la phrase `no` du personnage, le bouton disparaît et le personnage passe au repos.
43. Étant donné l'envie, quand l'enfant touche le bouton pour la `k`-ième fois avec `k < tickle.max`, alors le visage du dialogue (`#modal-body .char-header .emoji`, le `<span class="emoji">` de `js/features/island/island-view.js:342`) prend `giggle-wiggle`, `giggle` joue, la bulle et la voix disent `laughs[(k - 1) % laughs.length]`.
44. Étant donné l'envie, quand l'enfant touche le bouton pour la `tickle.max`-ième fois, alors le personnage ne rit pas, la bulle et la voix disent sa phrase `stop`, le bouton disparaît et le personnage passe au repos.
45. Étant donné un personnage passé au repos, quand 60 s (`TICKLE_REST_MS`) se sont écoulées, alors il rit de nouveau au toucher et son dialogue repropose le bouton ; rien de tout cela n'est sauvegardé.
46. Étant donné le chapitre `STORY.chatouilles`, quand il se joue, alors il a le guide, le titre, les 3 phrases, les 2 énigmes (avec `tip`), le succès et la récompense de la table I8 ; avec `state.storySolved = { crayons: true, dumplings: true, coffres: true }`, il montre `.story-zapmap svg.zap-map[data-found="3"]`.
46b. Étant donné `state.coins = 0`, `state.storySolved = { crayons: true, dumplings: true, coffres: true }` et `storyWin('chatouilles')`, quand on le joue, alors on gagne 16 pièces et une boîte de la série `guilis`, `zapMapPieces() === 4`, la fenêtre montre `.story-zapmap.happy svg.zap-map[data-found="4"]` et la voix dit exactement `toSpoken` de « Bravo ! L'arbre à plumes rit si fort qu'il laisse tomber le quatrième morceau de la carte de Zap ! 🗺️ Tu gagnes 16 pièces et une boîte surprise de squishies. La carte de Zap : tu as trouvé 4 morceaux sur 5. » (dans cet ordre : le `success`, la phrase existante de `js/features/story/story.js:601`, puis `zapMapSay(4)`, séparés par une espace, comme le comportement 29 de `saison3-ouverture`) ; un second `storyWin('chatouilles')` ne redonne pas la boîte. Le morceau est gagné parce que `state.storySolved.chatouilles` est vrai : rien d'autre n'est stocké.
47. Étant donné une mauvaise réponse à une énigme, quand elle est touchée, alors l'autre énigme est proposée (comportement existant de `story.js`).
48. Étant donné 2, 4 puis 7 missions réussies sur l'île, quand l'écran de victoire se ferme, alors les épisodes de la table I9 arrivent dans l'ordre, racontés par Guili, Lulu puis Pic (jamais par Plumette).

## Décisions

| Id | Décision | Pourquoi | Source |
|---|---|---|---|
| D1 | Île `chatouilles`, 🪶, niveau 94, saison 3, compétences `formes` (`coding`) et `lire` (`sentence`) | Décision d'Amrou du 22/11/2026 | `conductor/niveaux.md:46` ; brief de la saison 3 (décision 1) |
| D2 | Programme officiel : au CP, au plus 10 instructions dont 2 virages ; au CE1, au plus 15 instructions dont 4 virages ; instructions « avancer de », « quart de tour à droite », « quart de tour à gauche » | Les paliers T1 s'y calent | https://www.education.gouv.fr/sites/default/files/ensel135_annexe4.pdf (texte extrait du PDF, cours préparatoire et cours élémentaire première année) |
| D3 | Palier 1 en flèches absolues (⬆️ ➡️ ⬇️ ⬅️), paliers 2 à 5 en instructions relatives (avance, quart de tour) | Le palier 1 est la GS et le début du CP (cycle 1 : décrire un déplacement) ; le programme du CP utilise déjà le quart de tour | D2 ; paliers : `js/entities/difficulty/difficulty.js:22-47` (en-tête « LES PALIERS DE DIFFICULTÉ ») |
| D4 | Une instruction « avance » = une case (pas de « avancer de N ») | Une flèche par case se compte au doigt ; nos programmes ont donc plus d'instructions que ceux du programme officiel, d'où le plafond de 15 cases au palier 5 | défaut du rédacteur, à juger à la revue |
| D5 | Plafond d'âge : une enfant de 6 ans joue au palier 2 au plus | `ageToDiff` : 6 et 7 ans au palier 2 | `js/entities/difficulty/age.js:14-18`, table `AGE_DIFF` du même fichier |
| D6 | Après une erreur de programme, la grille et le programme restent (pas de nouvelle grille) | L'anti-devinette vise « peu de choix » ; un programme en a des milliers, et corriger son programme est le but du codage. Le miroir garde aussi sa grille à la 1ʳᵉ erreur | `conductor/product-guidelines.md:7` ; `js/features/minigames/mirror/mirror.js:153` (`renderMirror`, appel de `loseLife`) |
| D7 | La phrase : 1ʳᵉ erreur, les étiquettes restent ; 2ᵉ erreur, une autre phrase | Même règle que le miroir | `js/features/minigames/mirror/mirror.js:153` (`renderMirror`, appel de `loseLife`) |
| D8 | Le message précis d'une erreur est dit **après** `loseLife` | `loseLife` dit une phrase générique 7 fois sur 10 ; `speak` coupe la phrase en cours | `js/features/minigame-engine/engine.js:140` ; `js/features/screen/screen.js:21-23` ; `js/shared/ui/voice.js:125` |
| D9 | Chaque étiquette est dite quand on la touche, la phrase construite est lue quand elle est finie | Demande d'Amrou dans la commande de cette track ; le rire vient d'entendre l'ordre absurde | brief de cette track |
| D10 | La majuscule du premier mot et le point du dernier restent sur les étiquettes | Programme du CP (la phrase commence par une majuscule et finit par un point) ; cela rend presque toujours un seul ordre possible | défaut du rédacteur, à juger à la revue |
| D11 | Image (`pic`) aux paliers 1 et 2 seulement | Même seuil que la lecture (image jusqu'au palier 2) | `js/entities/difficulty/difficulty.js:240-242` (`readingWordOnly` : `dd >= 3`) |
| D12 | Les deux jeux : pas de minuteur, barème d'essais `generous` | Politique commune (pas de minuteur dans les nouveaux jeux) ; jeux à réflexion comme le miroir | `js/entities/difficulty/difficulty.js:360-369` (`LIVES_TABLE`), `:385-407` (`GENEROUS_KINDS`), `:446-466` (`NO_TIMER_KINDS`) |
| D13 | Proposés à partir de 6 ans | Le codage d'un déplacement et la lecture d'une phrase sont au programme du CP ; `sentence` demande de lire | D2 ; `js/entities/difficulty/game-types.js` (`AGE_GAME_TYPES`) ; défaut du rédacteur pour `coding`, à juger à la revue |
| D14 | Jeu favori : `coding` avant 7 ans, `sentence` à 7 ans et plus (et sans âge) | Forme des îles de la saison 2 ; pour une lectrice débutante, le jeu sans lecture d'abord | `js/entities/world/worlds.js:223` ; `js/entities/world/worlds.js:352-355` |
| D15 | Le rire : son `giggle` construit sur `soundGlide` comme le `pouic`, animation inspirée de `sqPress` | S'appuyer sur ce qui existe | `js/shared/ui/sound.js:206-222`, `:280-288` ; `js/features/squishies/squishy-room.js:105-112` (`squishyPress`) |
| D16b | Toucher un personnage sur la scène fait un « rire de bonjour », pas une chatouille ; les chatouilles passent seulement par le bouton « 🪶 Des chatouilles ? » | Le message reste cohérent : on ne chatouille jamais quelqu'un sans lui demander | défaut de Claude, à juger à la revue par Amrou (testeur à blanc, tour 2) |
| D16 | Le consentement : un bouton « Des chatouilles ? », une envie tirée par dialogue, un « stop » au bout de `max` touchers, 60 s de repos | Demande d'Amrou : on chatouille ceux qui en ont envie, on s'arrête au stop, sans leçon de morale | brief de cette track ; valeurs : défaut du rédacteur, à juger à la revue |
| D17 | Rien n'est sauvegardé pour les chatouilles ; aucun nouveau champ d'état | Les progrès d'histoire et de squishies sont déjà rangés par clé d'île ou de série | `js/features/story/episodes.js:12-13` ; `js/features/story/story.js:600` |
| D18 | Personnages, noms, objets, squishies, textes : propositions du rédacteur | La joueuse les juge à la revue (S20) | brief de la saison 3 (politique « Noms et personnages ») |
| D19 | Les dessins SVG des 4 nouveaux personnages sont demandés explicitement par cette spec, sans toucher aux dessins existants ; ils vont dans `season3Art(ART, kit)` de `js/entities/character/characters-art-s3.js`, fichier préparé vide par `saison3-ouverture` et appelé par `characters-art.js` juste après `season2Art` (modèle `-s2` de la v66.16). Les dessins dessinent avec les outils reçus dans `kit` (`@typedef ArtKit` de `characters-art.js`) ; `characters-art.js` n'est pas modifié, sauf si un dessin demande un outil absent de `ArtKit` : la track l'ajoute alors au `@typedef ArtKit` et à l'objet passé aux deux appels (une ligne, aucun dessin ne change) | Zone à demande explicite ; `characters-art-s3.js` est une zone sensible comme les deux autres fichiers de dessins | `AGENTS.md` (Interdits, dessins) ; `conductor/checklist-ile.md` (section 2 bis) ; brief de la saison 3 |
| D20 | Position sur la carte : `{ x: 82, y: 26 }`, définitive | Positions des cinq îles de la saison 3 fixées ensemble (crayons `{ x: 18, y: 78 }`, dumplings `{ x: 50, y: 74 }`, coffres `{ x: 82, y: 70 }`, chatouilles `{ x: 82, y: 26 }`, concert `{ x: 50, y: 22 }`), vérifiées contre la règle de chevauchement | décision de coordination de la saison 3 du 22/11/2026 ; `test/smoke.test.js:1866-1882` |
| D21 | Récompense du chapitre : 16 pièces | Les îles de la saison 2 donnent 14 ; un cran de plus pour la saison 3 | `js/features/story/story.js:360` ; défaut du rédacteur, à juger à la revue |
| D23 | Types stricts : tout `js/` est vérifié en strict (`strict: true` dans `tsconfig.json`) ; tout le code de cette track l'est donc par `bun run typecheck`, sans `any` ni `@ts-ignore`, et les `@typedef` et extensions de types ci-dessous sont obligatoires. Cette track étend un seul `@typedef` : `World` gagne `giggly?: boolean`. `Character` ne change pas (`characters.js` n'a plus de marge, voir D24) : la fiche de chatouilles est une table à part, `CHARACTER_TICKLES` (`Record<string, CharacterTickle>`), écrite dans `characters-s3.js` après `CHARACTERS_S3` avec le nouveau `@typedef {{ want: number, max: number, laughs: string[], stop: string, no: string }} CharacterTickle`, et réexportée par `js/entities/character/index.js`. Les autres ajouts entrent dans des types existants sans les changer (`Character`, `Item`, `CraftedItem`, `SquishySeries`, `Squishy`, `StoryChapter`, `SqArt`, `SOUND_FAMILY` dont `sfam` prend les clés). Les fonctions nouvelles de `js/entities/difficulty/difficulty-s3.js` sont typées strictement : `@typedef {{ size: number, mode: 'abs' \| 'rel', len: [number, number], turns: [number, number], rocks: number, slots: number, startUp: boolean }} CodingRound`, `@typedef {{ n: number, pic: boolean }} SentenceRound`, `@param {number} dd`, `@returns {CodingRound}` ou `{SentenceRound}`. Tout nouveau code de cette track, quelle que soit sa slice (`coding.js`, `sentence.js`, `tickle.js`, les ajouts à `island.js`, `island-s3.js`, `island-view.js`, `story-s3.js`, `episodes.js`, `music.js`, `squishy-art-s3.js`, `sound.js`), s'écrit strictement typé : `@param` et `@returns` sur chaque fonction, `@typedef` des objets renvoyés (`CodingGrid` pour G0, `CodingBuild = { cfg: CodingRound, grid: CodingGrid, best: CodingBest \| null, tries: number, fallback: boolean }`, `CodingBest = { len: number, turns: number, prog: string[] }`, `CodingRunResult = { path: { r: number, c: number, dir: number }[], end: 'goal' \| 'rock' \| 'edge' \| 'stop' \| 'empty', at: number }`, `SentenceEntry = { t: string, pic?: string, ok?: string[] }`), indices au contrat `HintProvider` de `js/features/hints/hints.js:57`, phrases de progrès dans `PROGRESS_CHEERS` (`Record<string, string>`, `adaptive.js:40-41`). Jamais `any` ni `@ts-ignore` ; `bun run typecheck` vert | Règle des types stricts de la checklist | `js/entities/world/worlds.js:6-25` (`World`), `js/entities/character/characters.js:2-15` (`Character`), `js/entities/item/items.js:4-12`, `js/entities/squishy/squishies.js:6-22` ; [checklist-mini-jeu](../../checklist-mini-jeu.md), [checklist-ile](../../checklist-ile.md) |
| D24 | Taille des fichiers (`max-lines` à 800, jamais relevé ; `checklist-ile.md` section « 2 bis », modèle `-s2` de la v66.16). Avant chaque ajout à un fichier partagé, mesurer sa marge (`wc -l`) sur `main` après rebase. **Fichiers `-s3`** (préparés vides par `saison3-ouverture`) : personnages et `CHARACTER_TICKLES` dans `characters-s3.js` (+70 environ), dessins dans `characters-art-s3.js` (+110, 4 dessins), squishies dans `squishies-s3.js` (+56), leurs 6 dessins dans `SQ_ART_S3` de `js/features/squishies/squishy-art-s3.js` (+54), chapitre dans `story-s3.js` (+28), paysage dans `island-s3.js` (+25). **Paliers** : `codingRound` et `sentenceRound` dans `js/entities/difficulty/difficulty-s3.js` (+45 environ), sur le modèle de `difficulty-s2.js` (`import { tierValue } from './difficulty.js'`, `tierValue` déjà exporté) ; si cette track est la première à en avoir besoin, sa phase 1 le crée, le déclare dans la slice `difficulty` de `js/slices.cjs` après `difficulty-s2.js`, et `js/entities/difficulty/index.js` le réexporte dans un bloc `export { … } from './difficulty-s3.js'`. **Lignes courtes dans les fichiers d'origine** : `difficulty.js` (670 lignes au 22/11/2026, +2 : `coding` et `sentence` dans `GENEROUS_KINDS` et `NO_TIMER_KINDS`), `squishies.js` (630, +3 : la série `guilis`), `episodes.js` (534, +29), `music.js` (276, +1), `worlds.js` (371, +22 avec `giggly`), `items.js` (570, +25 environ), `island.js` (663, +15 pour le rire de bonjour K5), `island-view.js` (397, +5), `sound.js` (373, +6). **`characters.js` n'est pas modifié** : 798 lignes, et `saison3-ouverture` y ajoute l'import et l'étalement de `CHARACTERS_S3` ; il ne reste pas la place d'un champ `tickle` dans `@typedef Character`, d'où la table `CHARACTER_TICKLES` (D23). **`squishy-art.js`** (640 lignes, +1) ne reçoit que la couleur de la boîte : `guilis: ['#FFF1B8', '#8A3D6B'],` à la fin de `SQ_BOX_COLORS` (`squishy-art.js:604-614`, `Record<string, string[]>`, remplissage puis contour). Couleurs tirées du thème I7 (`--world-scene-floor` jaune plume, `--world-deep` prune), choisies pour ne pas se confondre avec la boîte rose des `desserts` ; défaut de Claude, à juger à la revue par Amrou. **Nouveaux fichiers de jeu**, tous sous 800 lignes : `coding.js` environ 450, `coding.css` 130, `sentence.js` 340 (dont 50 de banque), `sentence.css` 100, `tickle.js` 130. Si `coding.js` dépassait 800 lignes, la génération et `codingRun` iraient dans un fichier frère `coding-grid.js` de la même slice, déclaré dans `js/slices.cjs` | Règle commune de la saison 3 | `conductor/checklist-ile.md` (section 2 bis), `.oxlintrc.json:40` ; `wc -l` du 22/11/2026 après la v66.16 |
| D25 | Une phrase correcte en français n'est jamais refusée à l'enfant, même drôle (« La course gagne la tortue des lapins. » est acceptée) : grille de R1b | Pas de punition | défaut de Claude, à juger à la revue par Amrou (testeur à blanc, tour 7) ; `conductor/product-guidelines.md:6` |
| D22 | Emojis limités à Unicode 13 ou avant (🪶 et 🥸 au plus récent) | Le jeu doit marcher sur d'anciens appareils | `AGENTS.md` (Compatibilité) ; `js/entities/item/items.js:129` (🪶 déjà utilisé) |

## Politiques

- **Arbitrages.**
  - Le message précis d'une erreur gagne sur la phrase générique du moteur : il est dit après `loseLife` (D8).
  - Le consentement gagne sur l'envie de jouer : quand un personnage a dit stop ou non, ni le toucher sur la scène ni le dialogue ne le font rire avant `TICKLE_REST_MS`.
  - Dans `coding`, l'arrivée chez l'ami gagne sur le reste du programme : on gagne dès qu'on y entre.
  - Le texte écrit ici gagne sur la reformulation : les textes C, S, H, I, K et T se recopient tels quels.
- **Défauts.**
  - Constantes plutôt que réglages : `CODING_STEP_MS = 450`, `CODING_MAX_TRIES = 500`, `HELLO_LAUGH_DELAY = 600`, `GIGGLE_MS = 900`, `TICKLE_REST_MS = 60000`.
  - Aucune dépendance nouvelle. Aucune API récente sans repli (pas de `toSorted`, pas de `structuredClone`).
  - Hasard : `random()`, `pickRandom()`, `shuffle()` de `js/shared/lib`, jamais `Math.random`.
  - Handlers : `setHandler(el, 'click', fn)`. Fin de mission : `winSoon`.
  - Une phrase de la banque dont les étiquettes permettent deux phrases correctes liste la seconde dans `ok` (règle R1). Une phrase nouvelle ajoutée plus tard suit la même règle.
  - Les fonctions pures sont exposées aux tests par leur nom (`codingBuildRound`, `codingBest`, `codingRun`, `sentenceAccepts`, `SENTENCES`, `tickleRestUntil`) avec le commentaire `// oxlint-disable-next-line no-unused-vars -- lu par les tests` si elles ne servent pas ailleurs.
- **Référence visuelle.**
  - `coding` : la grille du miroir (`js/features/minigames/mirror/mirror.js`, `mirror.css`), cases d'au moins 56 px à 360 px de large pour 4 × 4 et 5 × 5, 48 px pour 6 × 6. Palette en bas, boutons d'au moins 64 px.
  - `sentence` : les étiquettes ressemblent aux boutons de mots de la lecture (`js/features/minigames/reading/reading.css`, `.reading-word-btn`), la ligne de phrase est une rangée de cases pointillées qui passe à la ligne.
  - Scène et thème de l'île : comme `ISLE_SCENERY.musique` (`js/features/island/island.js:349`).
- **Une phrase dite = un seul `speak`.** `speak` coupe la phrase en cours (D8) : quand la spec dit qu'une voix enchaîne deux textes, ils forment un seul appel, joints par une espace, et les tests comparent à `toSpoken` de la chaîne entière. Quand un texte suit `loseLife`, il est dit par un seul `speak` après lui.
- **Textes.** Tous les textes montrés ou dits sont écrits ci-dessous. Un texte dit et montré est le même. La voix passe par `toSpoken` (`js/shared/ui/voice.js:55-68`) : un emoji connu de `EMOJI_WORDS` devient un mot (🎁 devient « cadeau »), les autres disparaissent, les espaces avant la ponctuation sont retirées, et `elide` contracte « de, que, le, la, ne, se, je, me, te » devant une voyelle ou un h (`voice.js:50-52`). Les tests comparent la voix à `toSpoken(texte)`. Les emojis des textes dits de cette spec (🪶, 👋, 🗺️) ne sont pas dans `EMOJI_WORDS` : ils disparaissent. Seuls les emojis (`\p{Extended_Pictographic}`) disparaissent : un autre symbole (flèche ↰, ↱) resterait dans la voix, donc aucun texte dit n'en contient. Relecture faite par le rédacteur (script appliquant `toSpoken` à chaque texte) : aucun texte ne subit d'élision fautive ; « le hoquet », « le hérisson » et « une île où » ont été reformulés. Une phrase ajoutée plus tard se relit de la même façon.
- **Détails non écrits.** L'agent prend le défaut de la référence (le miroir pour `coding`, la lecture pour `sentence`, la Musique pour l'île) ou l'option la plus simple, le note dans le journal de décisions du plan, et l'humain juge à la revue.

### Données et textes de « Le chemin de la plume » (`coding`)

**T1 : `codingRound(dd)`** (dans `js/entities/difficulty/difficulty-s3.js`, réexporté par `js/entities/difficulty/index.js`, avec `import { tierValue } from './difficulty.js'` comme `difficulty-s2.js` : `tierValue` (`difficulty.js:92`) y est déjà exporté. `difficulty.js` ne reçoit que les lignes `coding` de `GENEROUS_KINDS` et `NO_TIMER_KINDS` ; règle de `conductor/checklist-ile.md`, section 2 bis, et D24)

| Palier | `size` | `mode` | `len` (instructions du plus court programme) | `turns` (virages) | `rocks` (cactus) | `slots` | Départ |
|---|---|---|---|---|---|---|---|
| 1 | 4 | `abs` | 2 à 3 | 0 | 0 | 6 | direction sans importance |
| 2 | 4 | `rel` | 3 à 6 | 1 | 1 | 10 | vers le haut |
| 3 | 5 | `rel` | 5 à 10 | 2 | 2 | 10 | au hasard |
| 4 | 5 | `rel` | 6 à 12 | 2 à 3 | 3 | 12 | au hasard |
| 5 | 6 | `rel` | 9 à 15 | 3 à 4 | 5 | 15 | au hasard |

Valeurs littérales renvoyées (le test « `codingRound(1..5)` égale T1 » les compare à l'identique ; `startUp` vaut `true` seulement au palier 2, `false` ailleurs : au palier 1, mode `abs`, G0 fixe déjà la direction ; aux paliers 3 à 5, la direction de départ est tirée au hasard par la construction de la grille, pas par `codingRound`) :
- palier 1 : `{ size: 4, mode: 'abs', len: [2, 3], turns: [0, 0], rocks: 0, slots: 6, startUp: false }`
- palier 2 : `{ size: 4, mode: 'rel', len: [3, 6], turns: [1, 1], rocks: 1, slots: 10, startUp: true }`
- palier 3 : `{ size: 5, mode: 'rel', len: [5, 10], turns: [2, 2], rocks: 2, slots: 10, startUp: false }`
- palier 4 : `{ size: 5, mode: 'rel', len: [6, 12], turns: [2, 3], rocks: 3, slots: 12, startUp: false }`
- palier 5 : `{ size: 6, mode: 'rel', len: [9, 15], turns: [3, 4], rocks: 5, slots: 15, startUp: false }`

**Règles de la grille.**
- G1 : lignes numérotées de 0 (en haut) à `size - 1`, colonnes de 0 (à gauche). Directions : 0 haut, 1 droite, 2 bas, 3 gauche.
- G2 : mode `abs` : instructions `U`, `R`, `D`, `L` ; chacune tourne la plume vers sa direction puis avance d'une case. Un virage = deux instructions qui se suivent avec des directions différentes.
- G3 : mode `rel` : `F` avance d'une case dans la direction de la plume ; `TL` tourne d'un quart de tour à gauche sur place (direction + 3, modulo 4) ; `TR` à droite (direction + 1, modulo 4). Un virage = une instruction `TL` ou `TR`.
- G0 : **forme d'une grille** (objet `grille`) : `{ size, mode, start: [r, c], dir, goal: [r, c], rocks: [[r, c], …], friend: { e, name } }`. `mode` vaut `'abs'` ou `'rel'`. `dir` est la direction de départ (G1) ; en mode `abs`, elle vaut toujours 1 (la plume pointe vers la droite au départ, elle n'a pas d'effet sur les flèches). Exemple (secours du palier 2) : `{ size: 4, mode: 'rel', start: [3, 0], dir: 0, goal: [1, 2], rocks: [[3, 1]], friend: { e: '🐧', name: 'Guili' } }`.
- G4 : le plus court programme = le moins d'instructions, puis, à égalité, le moins de virages. Plusieurs programmes peuvent avoir la même longueur et les mêmes virages : `codingBest` en renvoie un, sans ordre imposé, et **aucun test ne compare `prog` mot pour mot** ; les tests comparent `len` et `turns`, et vérifient que `codingRun(grille, best.prog).end === 'goal'` (recherche en largeur sur les états case et direction, exposée en `codingBest(grille)` qui renvoie `{ len, turns, prog }`, ou `null` si l'ami est inatteignable). Exemple : la grille de G0 donne `len: 5`, `turns: 1` (par exemple `prog: ['F', 'F', 'TR', 'F', 'F']`, ici le seul possible).
- G5 : génération (`codingBuildRound(dd, rng = random)`, `@param {number} dd`, `@param {() => number} [rng]` qui rend des valeurs dans [0, 1), `@returns {CodingBuild}`) : le mélange est un Fisher-Yates local écrit dans `coding.js`, qui tire avec `rng` (`shuffle` de `js/shared/lib` ne prend pas de générateur) ; le test passe un générateur à graine écrit dans le test (par exemple un mulberry32 initialisé par la graine du lanceur, donc rejouable par `TEST_SEED`). Puis à chaque essai, mélanger toutes les cases ; la 1ʳᵉ est la plume, la 2ᵉ l'ami, les `rocks` suivantes les cactus ; direction de départ selon T1. Garder la grille si G4 trouve un programme dont `len` et `turns` sont dans T1, et, si `rocks > 0`, si au moins un cactus est dans le rectangle plume-ami. Retour : `{ cfg, grid, best, tries, fallback }` (`cfg = codingRound(dd)`, `grid` au format G0, `best = codingBest(grid)`, `tries` = nombre d'essais faits, de 1 à 500, `fallback` = `true` seulement si la grille de secours a été prise). L'ami est tiré avec `rng` dans `CODING_FRIENDS` après la grille. Au plus 500 essais ; sinon la grille de secours T2 (essai du rédacteur : 0 échec sur 2 000 générations par palier, au plus 138 essais).
- G7 : **`codingRun(grille, prog)`** (pure, sans DOM) joue `prog` (tableau de `'U' | 'R' | 'D' | 'L' | 'F' | 'TL' | 'TR'`) et renvoie `{ path, end, at }` : `path` = les états `{ r, c, dir }`, le départ d'abord puis un état après chaque instruction jouée sans heurt ; `end` = `'goal'` (entrée chez l'ami, les instructions suivantes ne sont pas jouées), `'rock'` ou `'edge'` (l'instruction `at` mènerait sur un cactus ou hors de la grille : elle n'est pas jouée), `'stop'` (programme fini ailleurs) ou `'empty'` (programme vide) ; `at` = index de l'instruction qui entre chez l'ami ou qui heurte, `-1` pour `'stop'` et `'empty'`. Le trajet animé (ligne 9) suit `path` ; les marques des lignes 11 et 12 suivent `end` et `at`. Exemples sur la grille de G0 : `['F', 'F', 'TR', 'F', 'F']` donne `end: 'goal', at: 4`, `path` de 6 états ; `['TR', 'F']` donne `end: 'rock', at: 1`, `path` de 2 états ; `['TL', 'F']` donne `end: 'edge', at: 1` ; `['F', 'TR', 'F']` donne `end: 'stop', at: -1`, dernier état `{ r: 2, c: 1, dir: 1 }` ; `[]` donne `end: 'empty', at: -1`.
- G6 : la même grille (mêmes plume, ami, cactus) ne revient pas deux fois de suite (comme `mirrorLast`).

**T2 : grilles de secours** (vérifiées par le rédacteur avec G4 ; la dernière colonne est un plus court programme possible, donné pour la lecture : le test compare seulement `len` et `turns`), écrites dans le code au format G0 sans `friend` (constante `CODING_FALLBACK = { 1: { start: [3, 0], dir: 1, goal: [3, 3], rocks: [] }, … }`, `size` et `mode` venant de T1 ; l'ami est tiré comme pour une grille générée)

| Palier | Plume (ligne, colonne) | Direction | Ami | Cactus | Un plus court programme (`len`, `turns`) |
|---|---|---|---|---|---|
| 1 | (3, 0) | 1 | (3, 3) | aucun | R R R (3, 0) |
| 2 | (3, 0) | 0 | (1, 2) | (3, 1) | F F TR F F (5, 1) |
| 3 | (4, 0) | 1 | (0, 4) | (4, 2), (2, 4) | F TL F F F F TR F F F (10, 2) |
| 4 | (4, 0) | 1 | (0, 4) | (4, 2), (2, 4), (1, 1) | TL F F F F TR F F F F (10, 2) |
| 5 | (5, 0) | 0 | (0, 5) | (1, 5), (5, 2), (4, 4), (3, 4), (0, 2) | F F F F TR F F F F TL F TR F (13, 3) |

**L'ami à chatouiller** (il a envie de rire : C3 et C4 le disent) : tiré parmi `CODING_FRIENDS = [{ e: '🦚', name: 'Plumette' }, { e: '🐧', name: 'Guili' }, { e: '🦦', name: 'Lulu' }]` (Pic n'est jamais la cible : il n'aime pas toujours les chatouilles). C'est une table locale du jeu (emoji et prénom), définie dans `coding.js` : le jeu n'importe ni `characters.js` ni aucune entité de la phase 3, et garde ces emojis même après la livraison de l'île. De même, `sentence` porte sa banque `SENTENCES` dans `sentence.js` et ne cite Lulu que dans ses textes.

**Le rendu.**
- `#cd-grid` porte `data-size`, `data-mode`, `data-dir` (direction de départ) ; chaque case est `.cd-cell` avec `data-r`, `data-c`, et la classe `start`, `goal` (l'ami) ou `rock` (🌵).
- La plume est `#cd-feather`, un SVG (une plume dont la pointe montre la direction) posé dans la grille, avec `data-r`, `data-c`, `data-dir` mis à jour à chaque instruction jouée ; tournée par `transform: rotate(<angle>deg)`, déplacée en 300 ms par une transition (le test lit les `data-*`, jamais la position). L'angle est cumulatif : départ = `dir × 90` ; `TR` ajoute 90, `TL` retire 90, et en mode `abs` l'angle prend le plus petit pas (−90, 0, +90 ou +180) vers la nouvelle direction ; il n'est jamais ramené modulo 360 pendant un trajet (sinon la transition ferait un tour complet). `data-dir` reste modulo 4. Au Go suivant, l'angle revient à celui du départ, sans transition (classe `cd-instant` le temps d'un rendu).
- Palette `#cd-pal` : boutons `.cd-op` avec `data-op` (`U`, `R`, `D`, `L` en mode `abs` ; `F`, `TL`, `TR` en mode `rel`) ; libellés ⬆️ ➡️ ⬇️ ⬅️, ou ⬆️ ↰ ↱. Chaque bouton a un `aria-label` égal au mot dit (ligne 4 ou 5).
- Programme `#cd-prog` : `slots` cases ; une instruction posée est un bouton `.cd-step` avec `data-i` et `data-op`.
- **Contrat DOM lu par les tests** : instruction en cours pendant le trajet : `.cd-step.on` (une seule à la fois) ; instruction fautive : `.cd-step.ko` ; plume qui tremble : `#cd-feather.cd-bump` ; case d'arrêt : `.cd-cell.cd-stop` ; l'ami qui rit : l'emoji `.cd-cell.goal .cd-friend` reçoit `giggle-wiggle` ; pendant le trajet, `.cd-op`, `.cd-step` et `#cd-go` ont `disabled`. Les classes `on`, `ko`, `cd-bump`, `cd-stop` s'effacent à la modification suivante du programme ou au Go suivant.
- Bouton `#cd-go` « ▶️ Go ».

**Textes de `coding`** (C1 à C11 ; `{nom}` = l'ami ; « lui » ou « elle » selon l'ami : Guili lui, Plumette et Lulu elle)

| Id | Où | Texte |
|---|---|---|
| C1 | titre | 🪶 Le chemin de la plume |
| C2 | consigne écrite | Guide la plume jusqu'à {nom} |
| C3 | consigne dite, mode `abs` | {nom} a envie de rire ! Choisis les flèches pour guider la plume jusqu'à {lui ou elle}, puis appuie sur Go. |
| C4 | consigne dite, mode `rel` | {nom} a envie de rire ! Programme la plume : elle avance tout droit, ou elle tourne sur place. Puis appuie sur Go. Attention aux cactus ! |
| C6 | Go avec un programme vide | Ajoute d'abord des flèches, puis appuie sur Go ! |
| C7 | programme plein | Ton programme est plein. Touche une flèche du programme pour l'enlever. |
| C8 | victoire | Hi hi hi ! Ça chatouille ! Bravo, ta plume a trouvé le chemin ! |
| C9 | cactus | Oups, un cactus ! La plume s'arrête là. Change la flèche rouge. |
| C10 | bord | Oups, le bord ! La plume s'arrête là. Change la flèche rouge. |
| C11 | arrêt ailleurs | La plume s'est arrêtée ici, mais {nom} est plus loin. Ajoute ou change des flèches ! |

**H1 : indices de `coding`** (`registerHints('coding', q => [...])`, `setHintQuestion('coding', q, { choices: '#cd-go' })`)
- Indice 1, mode `abs` : « Suis le chemin avec ton doigt, case par case, de la plume jusqu'à {nom}. Une flèche, c'est une case. » ; `fx: { glow: '#cd-grid' }`.
- Indice 1, mode `rel` : « La plume avance dans le sens de sa pointe. Pour changer de direction, elle tourne sur place, à gauche ou à droite. Mets-toi à sa place ! » (sans les symboles ↰ et ↱, qui ne sont pas des emojis : `toSpoken` ne retire que `\p{Extended_Pictographic}` et les laisserait dans la voix ; ils restent sur les boutons, qui ont leur `aria-label`) ; `fx: { glow: '#cd-grid' }`.
- Indice 2 : on calcule le premier segment du plus court programme (G4) : les cases traversées par la première suite d'avancées. S'il n'y a qu'un segment (palier 1), on ne montre que sa première case. Texte : « Je te montre le début du chemin. Combien de cases ? Ensuite, à toi de trouver la suite ! » ; en mode `rel`, si le programme commence par un virage, ajouter « Regarde où pointe la plume : faut-il tourner avant d'avancer ? ». `fx.marks` ou `fx.glow` sur ces cases (sélecteurs `.cd-cell[data-r="…"][data-c="…"]`). Jamais tout le chemin, jamais d'écart de choix.

**Jouable par le harnais (`coding`).** Les boucles génériques `playToWin` de `test/games.test.js` (vers les lignes 305 à 321) et des indices de `test/companions.test.js` (vers les lignes 230 à 288) lisent `gameSolution`, cliquent chaque sélecteur par `el.click()` toutes les 5 ms, puis attendent `.win-box` (`waitFor`, 3 000 ms par défaut ; 2 000 ms dans `companions`). Les minuteries du jeu y sont 10 fois plus courtes (`SPEED = 0.1`).
- `gameSolution`, à tous les paliers : les instructions de `best.prog` (G4), chacune par `#cd-pal .cd-op[data-op="<op>"]` (un bouton de la palette, présent du début à la fin), puis `#cd-go`. Exemple (secours du palier 2) : `['#cd-pal .cd-op[data-op="F"]', '#cd-pal .cd-op[data-op="F"]', '#cd-pal .cd-op[data-op="TR"]', '#cd-pal .cd-op[data-op="F"]', '#cd-pal .cd-op[data-op="F"]', '#cd-go']`. Les `.cd-step` du programme ne portent pas la classe `cd-op`, pour que le sélecteur reste unique.
- Événements : tous les boutons sont branchés sur `click` par `setHandler` (jamais `pointerdown` seul).
- Attentes : le trajet avance par `setTimeout` (jamais `requestAnimationFrame` ni `transitionend`) : au plus 15 instructions × 450 ms = 6 750 ms, soit 675 ms dans le harnais, puis `WIN_DELAY_LONG` (70 ms) : moins de 800 ms, sous les 2 000 ms. Aucune attente avant le premier clic (la palette est active dès l'ouverture).
- Fichiers de test : `test/games.test.js` (vérificateur `INDEPENDENT.coding` : il rejoue la solution avec les règles G1 à G3 sur la grille lue dans le DOM et vérifie l'arrivée chez l'ami et `#cd-go` en dernier) ; `test/companions.test.js` sans modification (il parcourt `GAME_TYPES`).

### Données et textes de « La phrase rigolote » (`sentence`)

**T3 : `sentenceRound(dd)`** : `{ 1: { n: 3, pic: true }, 2: { n: 4, pic: true }, 3: { n: 5, pic: false }, 4: { n: 6, pic: false }, 5: { n: 7, pic: false } }`.

**R1 : ordre accepté.** La phrase construite (mots joints par une espace) est acceptée si elle est égale à `t` ou à l'une des chaînes de `ok`. Deux étiquettes au même texte (« le » et « le ») sont interchangeables.

La comparaison garde la ponctuation et les majuscules : l'étiquette du dernier mot porte le point (« loup. ») et celle du premier la majuscule (« Le »). Un ordre qui échange le sujet et l'objet (« Le loup chatouille le chat. ») ne peut donc pas se construire avec les étiquettes de « Le chat chatouille le loup. » : il faudrait une étiquette « chat. », qui n'existe pas. Seuls comptent les ordres qui gardent la première étiquette en tête et la dernière en fin.

**R1b : règle de relecture d'une phrase de la banque** (faite par le rédacteur pour les 40 phrases de T4, à refaire pour toute phrase ajoutée) : garder la première et la dernière étiquette à leur place, essayer tous les ordres des étiquettes du milieu, et lister dans `ok` chacun qui fait une phrase française correcte et sensée. **Grille** (décision D25) : une phrase correcte en français n'est jamais refusée, même si elle est drôle. Pour chaque phrase, échanger deux groupes de même nature (deux groupes du nom, deux adjectifs, deux compléments) ; chaque ordre grammatical **qui se construit avec les étiquettes** s'ajoute à `ok` ; un ordre seulement poétique ou incorrect (« la grise souris », « la rose lune », « gros souris ») reste refusé ; une phrase qui aurait plus de 2 ordres corrects est remplacée. Un ordre qui mettrait le mot à point (« lion. », « roi. ») ailleurs qu'à la fin ne se construit pas : il ne va jamais dans `ok` (le test de la ligne 26 refuse un `ok` qui n'est pas une permutation exacte des étiquettes).

Relecture de toute la banque (rédacteur, tour 9), groupes du nom de part et d'autre de « du », « de la » ou « des » :
- Tailles 3 et 4 (16 phrases) : aucune n'a « du », « de la » ou « des » ; aucun autre échange possible (le premier et le dernier mot sont fixés, il reste 1 ou 2 mots au milieu) : un seul ordre chacune.
- Taille 5 : « Le cochon fait du ski. » : échanger « cochon » et « ski » demanderait « cochon. » en fin : impossible. Les 7 autres n'ont pas « du/des » et le sujet ne peut pas passer en fin (le dernier mot porte le point) : un seul ordre chacune.
- Taille 6 : « Papi chatouille le ventre du lion. » : « … le lion du ventre. » demanderait « ventre. » : impossible, un seul ordre. « Le poisson rouge fait du vélo. » : « Le vélo… du poisson. » impossible. « Le petit chat chatouille le loup. » : second ordre « Le chat chatouille le petit loup. » (adjectif déplacé). Les 5 autres : un seul ordre.
- Taille 7 : « Papi fait du ski sur la lune. » : « du lune » et « sur la ski » sont faux : un seul ordre. « La vache mange le gâteau du roi. » : « … le roi du gâteau. » demanderait « gâteau. » : impossible, un seul ordre. « Mamie chatouille le nez du gros dragon. » : second ordre « Mamie chatouille le gros nez du dragon. ». « La tortue gagne la course des lapins. » : « des » ne peut pas changer de groupe (« lapins. » est fixé), mais sujet et objet s'échangent : second ordre « La course gagne la tortue des lapins. ». « Le petit lapin chatouille le grand ours. » : second ordre « Le grand lapin chatouille le petit ours. ». Les 3 autres : un seul ordre.
- Bilan : 4 phrases ont un second ordre, 36 n'en ont qu'un, aucune n'en a plus de 2.

**Unicité des clés (règle commune aux îles).** L'unicité se vérifie table par table : `CHARACTERS`, `COMPANIONS`, `ITEMS`, `CRAFTED`, `DECOS`, `SQUISHIES`, `SQUISHY_SERIES`, `GAME_TYPES` ; plus une vérification croisée entre personnages et compagnons (ids et prénoms). Un squishy peut porter l'id du personnage qu'il représente, comme `boumbo` (personnage `js/entities/character/characters.js:610`, squishy `js/entities/squishy/squishies.js:440`) : le squishy rare `guili` et le personnage `guili` sont donc permis. Contrôle du rédacteur (22/11/2026), `grep -nE "^\s*'?<clé>'?\s*:"` dans `characters.js`, `companions.js`, `team.js`, `items.js`, `squishies.js`, `squishy-room.js`, et recherche des clés entre accents graves dans les specs Crayons, Dumplings, Coffres et Concert : aucune des 25 clés nouvelles (`plumette`, `guili`, `lulu`, `pic`, les 8 objets, les 2 recettes, les 5 décorations, `guilis` et les 5 autres squishies) n'existe déjà ; `coding` et `sentence` absents de `GAME_TYPES` ; aucun personnage ni compagnon ne s'appelle Plumette, Guili, Lulu ou Pic. La spec Concert cite `plumette` : c'est ce personnage-ci, pas un doublon.

**Lulu, pas Lili** : une compagne `lili` (Lili la fée, `js/entities/companion/companions.js:77-78`, `js/features/companion-team/team.js:114`) existe déjà ; la loutre s'appelle donc Lulu, clé `lulu`.

**R2 : mots du palier 1.** Chaque mot, sans le point final, ne contient que les lettres `a e é i o u y l r m s t p n f d v` (majuscules comprises) : lettres simples apprises en début de CP. Les mots des paliers 2 à 5 viennent du vocabulaire du CP (`js/entities/words/words.js`) et de mots courants.

**T4 : la banque `SENTENCES`** (dans `sentence.js`, rangée par nombre d'étiquettes)

Forme et types (dans `sentence.js`) : `@typedef {{ t: string, pic: string, ok: string[] }} SentenceEntry` (`ok` vaut `[]` quand la colonne est vide) ; `SENTENCES` est un `Record<number, SentenceEntry[]>` dont la clé est `n` (3 à 7, le nombre d'étiquettes), dans l'ordre de la table ; `sentenceAccepts(entry: SentenceEntry, built: string): boolean` applique R1 : `built` (les étiquettes jointes par une espace) égale `entry.t` ou l'une des chaînes de `entry.ok`.

| n | `t` | `pic` | `ok` |
|---|---|---|---|
| 3 | Le rat rit. | 🐀😆 | |
| 3 | Le lama rit. | 🦙😆 | |
| 3 | La tortue rit. | 🐢😆 | |
| 3 | Papi rit fort. | 👴😆 | |
| 3 | Le pirate rit. | 🏴‍☠️😆 | |
| 3 | Le rat lit. | 🐀📖 | |
| 3 | Lulu a ri. | 🦦😆 | |
| 3 | Le lama lit. | 🦙📖 | |
| 4 | Le chat chatouille Papi. | 🐱🪶👴 | |
| 4 | La vache fait coucou. | 🐄👋 | |
| 4 | Le cochon danse bien. | 🐷💃 | |
| 4 | Le robot rit fort. | 🤖😆 | |
| 4 | La souris chatouille Papi. | 🐭🪶👴 | |
| 4 | Le poisson a froid. | 🐠🥶 | |
| 4 | Le lapin fait dodo. | 🐰😴 | |
| 4 | Le loup a peur. | 🐺😱 | |
| 5 | Le chat chatouille le loup. | | |
| 5 | La vache mange la lune. | | |
| 5 | Un ours mange une fusée. | | |
| 5 | Le cochon fait du ski. | | |
| 5 | La poule chatouille le lion. | | |
| 5 | Le singe danse sur Papi. | | |
| 5 | Le lapin porte un chapeau. | | |
| 5 | Mamie a un nez rouge. | | |
| 6 | Le petit chat chatouille le loup. | | Le chat chatouille le petit loup. |
| 6 | La vache rose mange la lune. | | |
| 6 | Le crocodile a mis un tutu. | | |
| 6 | Papi chatouille le ventre du lion. | | |
| 6 | Le poisson rouge fait du vélo. | | |
| 6 | Un ours danse avec une fusée. | | |
| 6 | Le roi a une barbe bleue. | | |
| 6 | La grande girafe chatouille les nuages. | | |
| 7 | Le petit lapin chatouille le grand ours. | | Le grand lapin chatouille le petit ours. |
| 7 | Papi fait du ski sur la lune. | | |
| 7 | La vache mange le gâteau du roi. | | |
| 7 | Un poisson rouge chante dans le bain. | | |
| 7 | Le lion porte une petite chaussette rose. | | |
| 7 | Mamie chatouille le nez du gros dragon. | | Mamie chatouille le gros nez du dragon. |
| 7 | La tortue gagne la course des lapins. | | La course gagne la tortue des lapins. |
| 7 | Le gros chien chatouille la souris grise. | | |

**Le rendu.** `#st-pic` (paliers 1 et 2, emojis en grand) ; `#st-line` : `n` cases `.st-slot` ; `#st-reserve` : les étiquettes `.st-tile` avec `data-i` (rang du mot dans `t`, de 0 à `n - 1`) ; une étiquette garde sa place dans la réserve quand elle en sort (place vide `.st-gap`, sans la classe `st-tile`) ; bouton `#st-read` « 🔊 Lis ma phrase ». **Contrat DOM lu par les tests** : une étiquette posée est dans `#st-line .st-slot` ; à la victoire, toutes les `.st-tile` prennent la classe `lit` ; à l'erreur, `#st-line` reçoit `giggle-wiggle` ; à la 2ᵉ erreur, la nouvelle phrase remplace `#st-line` et `#st-reserve`.

**Textes de `sentence`** (S1 à S5)

| Id | Où | Texte |
|---|---|---|
| S1 | titre | 📝 La phrase rigolote |
| S2 | consigne écrite | Remets les mots dans l'ordre |
| S2a | consigne dite, paliers 1 et 2 | Les mots de Lulu se sont mélangés ! Touche un mot pour l'entendre et le mettre dans la phrase. Regarde l'image : elle montre ce que dit la phrase. |
| S2b | consigne dite, paliers 3 à 5 | Les mots de Lulu se sont mélangés ! Touche un mot pour l'entendre et le mettre dans la phrase. Quand la phrase est finie, je la lis. |
| S3 | victoire (dit dans le même `speak` que la phrase, après une espace) | Bravo, ta phrase veut dire quelque chose ! |
| S4 | erreur (dit dans le même `speak` que la phrase construite, après une espace) | Hi hi hi ! Ta phrase est rigolote, mais elle ne veut rien dire. Touche un mot pour le changer de place. |
| S5 | « Lis ma phrase » sur une ligne vide | Ta phrase est encore vide. Touche un mot ! |

À la 2ᵉ erreur, S4 est remplacé par : « Hi hi hi ! Allez, une nouvelle phrase ! », seulement si la mission continue (`loseLife` renvoie `false`). Si `loseLife` renvoie `true` (essais épuisés), le moteur prend la main (`onMissionFail` après 520 ms, `engine.js:172-175`) : le jeu dit la phrase construite suivie de S4 (version normale), jamais « une nouvelle phrase ». Tranché par les preuves : aucune nouvelle phrase n'arrive après `onMissionFail`. Même règle pour tout texte qui annonce une relance (`coding` compris).

**H2 : indices de `sentence`** (`setHintQuestion('sentence', q, { choices: '.st-tile' })`)
- Indice 1 : « Touche chaque mot pour l'écouter. Puis cherche : qui fait quoi ? » ; aux paliers 1 et 2, ajouter « Regarde l'image pour t'aider. » ; `fx: { glow: '#st-reserve' }`.
- Indice 2 : « Une phrase commence par une grande lettre et finit par un point. Je te montre le premier mot. » ; `fx: { glow: '.st-tile[data-i="0"]' }`. Aucun écart d'étiquette.

**Jouable par le harnais (`sentence`).** Mêmes boucles que pour `coding`.
- `gameSolution`, à tous les paliers : `.st-tile[data-i="0"]`, `.st-tile[data-i="1"]`, … jusqu'à `data-i="n - 1"` (l'ordre de `t`). Une étiquette qui passe dans la ligne est le même élément (déplacé), et la place vide qu'elle laisse dans la réserve n'a pas la classe `st-tile` : chaque sélecteur trouve un seul élément, avant comme après les clics précédents.
- Événements : `click` par `setHandler`.
- Attentes : la phrase est jugée dès la dernière étiquette posée, sans délai ; la victoire passe par `winSoon(WIN_DELAY_LONG)` (70 ms dans le harnais). La voix est simulée par le harnais et n'attend rien.
- Fichiers de test : `test/games.test.js` (vérificateur `INDEPENDENT.sentence` : la phrase construite par la solution, relue sur les `.st-tile` dans la ligne, est acceptée par R1) ; `test/companions.test.js` sans modification.

### Le son et l'animation du rire (phase 1, partagés)

**T5 : `SOUND_PALETTE.giggle`** (dans `js/shared/ui/sound.js`) : trois `soundGlide` sinus, aux délais 0 s, 0,14 s et 0,28 s, volume `0.11 * sfam('giggle')` ; points `[[0, 820], [0.06, 1250], [0.11, 900]]` pour les deux premiers, `[[0, 900], [0.06, 1400], [0.12, 1000]]` pour le troisième. `SOUND_FAMILY.giggle = 0.9`.

**`.giggle-wiggle`** (dans `js/shared/styles/design-system-v21.css`) : animation `giggleWiggle` de 0,9 s, `transform-origin: 50% 90%` ; étapes : 0 % `rotate(0) scale(1)`, 15 % `rotate(-10deg) scale(1.08, 0.94)`, 30 % `rotate(9deg)`, 45 % `rotate(-8deg) scale(1.06, 0.96)`, 60 % `rotate(6deg)`, 75 % `rotate(-3deg)`, 100 % `rotate(0) scale(1)`. Sous `@media (prefers-reduced-motion: reduce)` : pas d'animation. Le code retire la classe puis la remet (`void el.offsetWidth`) comme `squishyPress`.
- **Sur la scène**, `.giggle-wiggle` seule ne suffit pas : `#scene.live-isle .isle-char .emoji` a déjà une animation infinie plus spécifique (`isleCharBob`, `js/features/island/island.css:273-279`). La phase 3 ajoute donc à `island.css` la règle `#scene.live-isle .isle-char .emoji.giggle-wiggle { animation: giggleWiggle 0.9s ease-in-out 1; }` (plus spécifique d'une classe), placée après la règle existante, et ajoute `#scene.live-isle .isle-char .emoji.giggle-wiggle` à la liste du bloc `prefers-reduced-motion` existant (`island.css:501-518`, `animation: none`). Après 900 ms la classe est retirée et le balancement reprend.
- **Dans le dialogue**, `.char-header .emoji` et `#modal .char-header .emoji` n'ont pas d'animation (`js/shared/styles/design-system-v21.css:566-578`) : la règle partagée `.giggle-wiggle` suffit.

### L'île (phase 3)

**I1 : `WORLDS.chatouilles`** (juste après `WORLDS.coffres`, pour que `WORLD_ORDER` suive les niveaux ; avec le commentaire « idée de la joueuse : le monde des chatouilles »)

| Champ | Valeur |
|---|---|
| `name` | `'Le Monde des Chatouilles'` |
| `emoji` | `'🪶'` |
| `level` | `94` |
| `diff` | `6` |
| `saison` | `3` |
| `short` | `'Chatouilles'` |
| `subtitle` | `'Le monde des plumes et des rires'` |
| `game` | `(age) => (age && age < 7 ? 'coding' : 'sentence')` |
| `map` | `{ x: 82, y: 26 }` (D20) |
| `shape` | `'chatouilles'` |
| `icon` | `'🪶'` |
| `sand` | `'#FFF1DA'` |
| `land` | `'#FFC2DA'` |
| `giggly` | `true` (les personnages font un rire de bonjour quand on les touche) |
| `intro` | `'Bienvenue au Monde des Chatouilles, où tout le monde rit pour un rien 🪶'` |
| `sceneEmpty` | `'Ton monde attend ses décorations rigolotes !'` |

**I2 : personnages** (dans `CHARACTERS_S3` de `js/entities/character/characters-s3.js`, bloc « Le Monde des Chatouilles (idée de la joueuse) » ; `characters.js` les étale dans `CHARACTERS`, ce que prépare `saison3-ouverture`)

| Clé | Emoji | `name` | `title` | `gender` | `loot` | Rôle |
|---|---|---|---|---|---|---|
| `plumette` | 🦚 | Plumette | la paonne aux plumes chatouilleuses | f | `plumeguili`, `chaussettes` | guide du chapitre |
| `guili` | 🐧 | Guili | le petit manchot chatouilleux | m | `plumeguili`, `yoyofarceur` | présente « Le chemin de la plume » |
| `lulu` | 🦦 | Lulu | la loutre qui adore les blagues | f | `nezclown`, `boiterires` | présente « La phrase rigolote » |
| `pic` | 🦔 | Pic | le petit hérisson timide | m | `chaussettes`, `nezclown` | n'aime pas toujours les chatouilles |

La colonne « Rôle » est une intention de narration, portée seulement par les répliques : `Character` n'a aucun champ qui lie un personnage à un jeu (ses champs sont `emoji`, `name`, `title`, `world`, `gender`, `loot`, `texts`, `noGames` ; la fiche de chatouilles est à part, dans `CHARACTER_TICKLES`). Le guide est désigné par `STORY.chatouilles.guide` ; « Choisir un jeu » propose tous les jeux, comme sur les autres îles.

Répliques (`texts`, 3 chacun) :
- Plumette : « Bienvenue au Monde des Chatouilles ! Ici, on rit pour un rien… hi hi ! » ; « Mes plumes chatouillent seulement ceux qui en ont envie. Tu veux jouer avec moi ? » ; « Un fou rire, ça se partage ! On fait une mission ensemble ? »
- Guili : « Ma plume va où je lui dis ! Tu m'aides à la guider ? » ; « Avance, tourne, avance… et guili guili ! » ; « Je suis chatouilleux des ailes. Chut, ne le dis à personne ! »
- Lulu : « Mes mots se sont tout mélangés ! Tu m'aides à refaire ma phrase ? » ; « Une phrase en désordre, c'est rigolo. Une phrase en ordre, ça veut dire quelque chose ! » ; « On invente une phrase rigolote ensemble ? »
- Pic : « Bonjour… Moi, je n'aime pas toujours les chatouilles. Mais j'adore jouer ! » ; « Quand je dis stop, mes amis s'arrêtent. Alors je joue tranquille. » ; « Mes piquants sont tout doux aujourd'hui. On fait un jeu ? »

Dessins (dans `season3Art(ART, kit)` de `characters-art-s3.js`, qui les ajoute à la table des dessins ; même style que les personnages de la Musique) : Plumette, une paonne bleue et verte, roue de plumes roses et jaunes ; Guili, un manchot noir et blanc avec une plume rose sur la tête ; Lulu, une loutre marron clair aux moustaches, un nez rouge de clown sur le front ; Pic, un hérisson aux piquants arrondis couleur noisette, joues roses, l'air timide. Tous ont des yeux souriants.

**I3 : la fiche `tickle` de chaque personnage** (table `CHARACTER_TICKLES` de `characters-s3.js`, clé = id du personnage)

| Clé | `want` | `max` | `laughs` | `stop` | `no` |
|---|---|---|---|---|---|
| `plumette` | 0.8 | 4 | « Hi hi hi ! Mes plumes ! » ; « Ha ha ha, ça chatouille ! » ; « Hou hou hou, mes plumes frissonnent ! » | « Stop ! J'ai assez ri pour l'instant. Merci d'avoir arrêté ! » | « Pas maintenant, merci. On se fait un coucou à la place ? 👋 » |
| `guili` | 0.9 | 5 | « Guili guili ! Hi hi hi ! » ; « Ha ha ha, je suis tout chatouilleux ! » ; « Hi hi, ma plume rigole aussi ! » | « Stop, stop ! J'ai trop ri, je n'ai plus de souffle. Merci d'avoir arrêté ! » | « Pas maintenant, je suis tout essoufflé. On joue plutôt ? » |
| `lulu` | 0.8 | 3 | « Ha ha ha ! Ça chatouille mes moustaches ! » ; « Hi hi hi, ma queue rigole ! » | « Stop ! Mon ventre a trop ri. Merci d'avoir arrêté ! » | « Pas maintenant, merci. Je te raconte une blague à la place ? » |
| `pic` | 0.4 | 2 | « Hi… hi hi ! Tout doucement, alors. » | « Stop, ça suffit pour moi. Merci d'avoir arrêté tout de suite ! » | « Non merci, pas de chatouilles aujourd'hui. Mais je veux bien un sourire ! » |

**K : règles des chatouilles** (dans `js/features/island/tickle.js`, nouveau fichier de la slice `island`)
- K1 : bouton du dialogue : `<button class="btn-ghost" id="btn-tickle">🪶 Des chatouilles ?</button>`, seulement si `WORLDS[currentWorld].giggly`, si le personnage a une fiche `tickle` (`CHARACTER_TICKLES[id]`) et s'il n'est pas au repos.
- K2 : chaque ouverture de dialogue remet à zéro le compteur `k` et l'envie (tirée au premier toucher du bouton).
- K3 : chaque réponse remplace la bulle du dialogue par `speechBubble(texte)` (`js/shared/ui/voice.js:155-160`, réinjectée à la place de l'ancienne `.speech`) : `.speech .txt` contient le texte, et `.speech .btn-speak[data-say]` le texte sans balises (le `data-say` est sur le bouton, pas sur `.txt`). Elle est dite par `speak`. Les tests lisent les deux.
- K4 : « au repos » : `tickleRestUntil[id] > Date.now()`. Après `no` ou `stop`, `tickleRestUntil[id] = Date.now() + TICKLE_REST_MS`. Cet objet vit en mémoire seulement.
- K5 : l'élément qui rit sur la scène est le `<span class="emoji">` à l'intérieur du bouton du personnage (`js/features/island/island.js:556`), sélecteur `#scene .isle-char[data-char="<id>"] .emoji`, jamais le bouton lui-même, pour que la zone à toucher ne bouge pas. Le toucher sur la scène (`js/features/island/island.js:573`) n'est jamais une chatouille : c'est un rire de bonjour, comme on dit bonjour en souriant. Fonction `helloLaugh(el)` (dans `tickle.js`) ; si l'île est `giggly` et le personnage pas au repos, rire de bonjour (ligne 38), puis `emit('nav:dialogue', id)` après `HELLO_LAUGH_DELAY` ; sinon le comportement actuel.

**I4 : objets** (`ITEMS`, `CRAFTED`, `DECOS` de `js/entities/item/items.js`, bloc « Monde des Chatouilles »)

| Clé | Table | Emoji | Nom | Prix | Recette |
|---|---|---|---|---|---|
| `plumeguili` | ITEMS | 🪶 | Plume à guilis | 6 | |
| `nezclown` | ITEMS | 🔴 | Nez de clown | 5 | |
| `chaussettes` | ITEMS | 🧦 | Chaussettes à pois | 5 | |
| `boiterires` | ITEMS | 🎁 | Boîte à rires | 7 | |
| `yoyofarceur` | ITEMS | 🪀 | Yo-yo farceur | 6 | |
| `lunettesrigolotes` | ITEMS | 🥸 | Lunettes rigolotes | 8 | |
| `bonbonpetillant` | ITEMS | 🍬 | Bonbon qui pétille | 5 | |
| `sifflet` | ITEMS | 📯 | Trompette à rires | 7 | |
| `chapeauplumes` | CRAFTED | 👒 | Chapeau à plumes | 22 | `{ plumeguili: 2, lunettesrigolotes: 1 }` |
| `mallefarces` | CRAFTED | 🧳 | Malle des farces | 20 | `{ nezclown: 1, boiterires: 1, sifflet: 1 }` |
| `arbreplumesD` | DECOS | 🌳 | Arbre à plumes | 40 | |
| `trampolineD` | DECOS | 🤸 | Trampoline des fous rires | 30 | |
| `fanionsrireD` | DECOS | 🎏 | Fanions rigolos | 18 | |
| `canapeD` | DECOS | 🛋️ | Canapé des guilis | 14 | |
| `nuagecoussinD` | DECOS | ☁️ | Nuage-coussin | 12 | |

Objets donnés par personne : `lunettesrigolotes`, `bonbonpetillant`, `sifflet` (3).

**I5 : série de squishies `guilis`** : `SQUISHY_SERIES.guilis = { name: 'Guilis', emoji: '🪶', world: 'chatouilles' }`, ajoutée **à la fin** de `SQUISHY_SERIES_ORDER`, après les séries déjà livrées (règle commune, `checklist-ile.md` section « 2 quater ») ; `SQUISHY_ISLAND_SERIES.chatouilles = 'guilis'` ; boîte `SQ_BOX_COLORS.guilis = ['#FFF1B8', '#8A3D6B']` dans `squishy-art.js` (D24, défaut de Claude). Ces lignes courtes restent dans leurs fichiers d'origine ; les 6 modèles ci-dessous vont dans `SQUISHIES_S3` de `js/entities/squishy/squishies-s3.js`, étalé à la fin de `SQUISHIES` (`checklist-ile.md` section 2 bis).

| Clé | `name` | `say` | `rarity` | `color` | `shape` | `size` | Dessin (`SQ_ART`) |
|---|---|---|---|---|---|---|---|
| `plume-rose` | Plume rose | une plume rose | commun | rose | ovale | petit | corps ovale vertical, une nervure blanche au milieu, barbes en vagues |
| `nuage-rieur` | Nuage rieur | un nuage rieur | commun | bleu | rond | grand | trois bosses de nuage derrière, bouche grande ouverte qui rit |
| `chaussette-pois` | Chaussette à pois | une chaussette à pois | commun | vert | ovale | grand | pois blancs, revers blanc en haut |
| `bonbon-rigolo` | Bonbon rigolo | un bonbon rigolo | commun | orange | rond | petit | deux papillotes de côté, comme `berlingot` |
| `guili` | Guili | Guili, le petit manchot | rare | violet | ovale | petit | ventre blanc, petit bec jaune, plume rose sur la tête |
| `plumette-doree` | Plumette dorée | Plumette dorée, la paonne | brille | jaune | rond | grand | roue de plumes dorées derrière, couronne de trois points |

**Dessins des 6 squishies (`SQ_ART`).** Le dessin d'un squishy vient de la table `SQ_ART` de `js/features/squishies/squishy-art.js:55` (type `SqArt`, `squishy-art.js:10`) ; `squishyArtSVG` (`squishy-art.js:579`) ne dessine rien sans entrée. Chaque modèle de I5 reçoit une entrée `SQ_ART['<clé>'] = { body, face: {}, faceY?, back?, front? }` (forme `SqArt`, `back` et `front` de type `(c: SqColor) => string`) sur le modèle de `'tambour-mochi'` (`squishy-art.js:395-403`) : `body` vaut `'rond'`, `'ovale-v'`, `'ovale-h'` ou `'carre'` selon `shape` (ovale : `'ovale-v'` pour `plume-rose` et `chaussette-pois`, `'ovale-h'` pour `guili`) ; `back` et `front` reçoivent la couleur `c` et dessinent ce que dit la colonne « Dessin ». Les 6 entrées s'écrivent dans `SQ_ART_S3` de `js/features/squishies/squishy-art-s3.js` (préparé vide par `saison3-ouverture`, étalé à la fin de `SQ_ART` ; `checklist-ile.md` section 2 bis, D24), pas dans `squishy-art.js`. `squishy-room.js` n'est pas modifié.
- Test : chaque modèle de la série `guilis` a `squishyArtSVG(id) !== ''` (ligne 36).

**Tests existants à effectif figé** (`conductor/checklist-ile.md`, section « 2 quater ») : la PR de la phase 3 met à jour trois vérifications, sans en affaiblir aucune :
- `test/smoke.test.js`, « personnages : les N ids possèdent un SVG » (vers la ligne 755) : `N` = le nombre trouvé sur `main` après le rebase, plus 4 (73 si les trois îles précédentes de la saison en ont ajouté 4 chacune sur les 57 d'aujourd'hui), dans le libellé et dans l'expression.
- `test/squishies.test.js`, « 3 séries au lancement… » (vers la ligne 86) : `'guilis'` s'ajoute à la fin du tableau attendu, et le libellé nomme la série « Guilis ».
- `test/squishies.test.js`, « 6 modèles par série (N squishies) » et « noms uniques » (vers les lignes 91 et 107) : `N` augmente de 6 (78 si les trois îles précédentes en ont ajouté 6 chacune sur les 54 d'aujourd'hui), dans le libellé et dans les deux expressions.

**I6 : musique** (forme `MusicTheme`, `js/features/music/music.js:19-30` ; `lead: 'bubble'` est une chaîne, le type ne change pas) : `chatouilles: { root: 67, scale: [0, 2, 4, 7, 9], bpm: 108, lead: 'bubble', prog: [0, 9, 5, 7], shaker: true }`, commentaire « des bulles qui rebondissent, comme des rires ».

**I7 : thème** : `body[data-world="chatouilles"] { --world-sky: #fff0f6; --world-sea: #ffb3d1; --world-deep: #8a3d6b; --world-scene-top: #fff7fb; --world-scene-floor: #fff1b8; }`.

**Scène `ISLE_SCENERY.chatouilles`** (écrite dans `ISLE_SCENERY_S3` de `js/features/island/island-s3.js`, étalé dans `ISLE_SCENERY` ; viewBox 480 × 360, sol sous y = 254 comme la Musique) : deux arbres à plumes (tronc lilas, houppe de plumes roses et jaunes en ellipses, classes `ls-lolly l1` et `ls-lolly l2` pour leur balancement), trois plumes qui flottent dans le ciel, un petit trampoline rond à rayures, un nuage qui sourit, un chemin couleur `sand`.

**I8 : chapitre `STORY.chatouilles`** (écrit dans `STORY_S3` de `js/features/story/story-s3.js`, étalé dans `STORY`)
- `guide: 'plumette'`, `title: 'Le quatrième morceau de la carte'`.
- `intro` :
  1. « Hi hi ! Bienvenue au Monde des Chatouilles 🪶 Ici, tout le monde rit pour un rien. »
  2. « Le quatrième morceau de la carte de Zap s'est envolé dans mon arbre à plumes. Il est caché tout en haut, sous les plumes qui chatouillent ! »
  3. « Ici, on chatouille seulement ceux qui en ont envie, et quand quelqu'un dit stop, on s'arrête. Résous mes devinettes, et l'arbre te donnera le morceau ! »
- `riddles` :
  1. `q` : « Je suis toute légère, je vole au vent, et je chatouille le bout du nez. Qui suis-je ? » ; `tip` : « Les oiseaux en ont plein sur le dos. » ; `opts` : 🪶 (juste), 🪨, 🔨.
  2. `q` : « On me met aux pieds, une à droite, une à gauche, et parfois j'ai des pois. Qui suis-je ? » ; `tip` : « On me met avant les chaussures. » ; `opts` : 🧦 (juste), 🧤, 🎩.
- `success` : « Bravo ! L'arbre à plumes rit si fort qu'il laisse tomber le quatrième morceau de la carte de Zap ! 🗺️ » (la track `saison3-ouverture` ajoute ensuite `zapMapSay(4)` à la voix).
- `reward` : 16 (et la boîte surprise `guilis`, par le mécanisme existant).
- Le morceau 4 de la carte de Zap : `chatouilles` est le 4ᵉ id de `ZAP_MAP_PIECES` ; le morceau est gagné quand `state.storySolved.chatouilles` est vrai. Le chapitre et la victoire montrent la carte par `zapMapSVG(zapMapFound())` (chapitre) et `zapMapSVG(zapMapFound(), { fresh: 'chatouilles' })` (victoire) dans `.story-zapmap` (mécanisme de `saison3-ouverture`, rien à coder ici sauf les tests 46 et 46b).

**I9 : épisodes `EPISODES.chatouilles`**
1. `by: 'guili'`, `title: 'La plume qui file'`, `find: '🪶'`, `lines` : « J'ai lancé une plume dans le vent, et elle a fait trois virages avant de se poser ! » ; « Elle s'est posée sur le nez de Pic. Il a fait atchoum, et on a tous ri ! »
2. `by: 'lulu'`, `title: 'La blague de Lulu'`, `find: '📜'`, `lines` : « J'ai trouvé une blague : pourquoi les poissons n'aiment pas jouer au tennis ? Parce qu'ils ont peur du filet ! » ; « Hi hi ! Même Pic a ri, et pourtant il est très sérieux ! »
3. `by: 'pic'`, `title: 'La musique au loin'`, `find: '🎼'`, `lines` : « Chut… Écoute. Très loin, derrière les nuages, on entend de la musique. » ; « Elle vient d'une île lointaine, qui prépare un grand concert. Le dernier morceau de la carte y est peut-être ! »

## Hors périmètre

- L'archipel de la saison 3, son onglet, son écran d'ouverture, son prologue et la carte de Zap : track `saison3-ouverture`.
- Les autres îles de la saison 3 et le trésor final.
- Les clips de voix enregistrés à l'avance : track `voix-naturelle` (les textes de cette spec passent par `speak` et en profiteront).
- La classe du profil et la porte « défi étoile » : track `aller-plus-loin`.
- Changer les mini-jeux existants ou les dessins des personnages existants.
- Une boucle « répéter » dans `coding` (l'ancienne idée la plaçait au CE2, hors du programme cité en D2).

## Contrats partagés

| Contrat | Forme (ou lien) | Propriétaire | Consommateurs |
|---|---|---|---|
| Archipel 3 | `WORLDS.chatouilles.saison = 3` ; `refreshArchipelagos()` et `shownArchipelagos()` | `entities/world` (track `saison3-ouverture`) | cette track (phase 3, tests) |
| `ZAP_MAP_PIECES`, `zapMapFound()`, `zapMapPieces()`, `zapMapSVG(zapMapFound(), { fresh: id })`, `zapMapSay(n)`, `.story-zapmap` | définis par la track `saison3-ouverture` (ses comportements 22 à 29) ; `chatouilles` est le 4ᵉ morceau | `features/story` | ce chapitre (lignes 46 et 46b) |
| Son `giggle` | `playSound('giggle')` | cette track (phase 1) | `coding`, `sentence`, l'île |
| Classe `giggle-wiggle` | CSS partagée, 0,9 s | cette track (phase 1) | `coding`, `sentence`, l'île |
| `WORLDS[id].giggly` | `World.giggly?: boolean` (D23) | cette track (phase 3) | `island.js`, `tickle.js` |
| `CHARACTER_TICKLES[id]` | `Record<string, CharacterTickle>`, `CharacterTickle = { want: number, max: number, laughs: string[], stop: string, no: string }`, dans `characters-s3.js`, réexporté par `js/entities/character/index.js` (D23) | cette track (phase 3) | `tickle.js` |

## Surface d'attaque

Aucune : aucune entrée de l'enfant n'est stockée ni insérée sans contrôle (les étiquettes et textes viennent de constantes du code).

## Zones sensibles touchées

- PWA : `index.html` et `sw.js` sont régénérés par `bun run sync` à chaque phase (nouveaux fichiers). Revue humaine.
- Pas de sauvegarde, pas d'import, pas de pause ni de porte des parents (seule la liste `SKILL_GROUPS` de `parents.js` gagne deux clés, sans toucher à la porte).

## Smoke test

🤖 : un agent la prouve et joint la preuve. 👤 : seul l'humain peut juger.

| Id | Qui | Étapes | Attendu | Niveau visé |
|---|---|---|---|---|
| S1 | 🤖 | `codingRound(1..5)` | valeurs de T1 | test-verified |
| S2 | 🤖 | 300 `codingBuildRound(p)` par palier, graines différentes | lignes 2 et 3 | test-verified |
| S3 | 🤖 | grilles T2 passées à `codingBest` | `len` et `turns` de T2 (3 et 0 ; 5 et 1 ; 10 et 2 ; 10 et 2 ; 13 et 3), et `codingRun` de `best.prog` finit en `goal` | test-verified |
| S4 | 🤖 | `coding` palier 2 : programme vide puis Go ; programme qui heurte un cactus ; programme qui finit ailleurs | lignes 8, 11, 12, 13 (même grille, même programme, classes `ko` et `cd-stop`) | runtime-verified (jsdom) |
| S5 | 🤖 | `coding` palier 1 : remplir 6 instructions, en toucher une 7ᵉ, retirer la 2ᵉ | lignes 6 et 7 | runtime-verified |
| S6 | 🤖 | `test/games.test.js` : `coding` gagné à chaque palier | ligne 16 | test-verified |
| S7 | 🤖 | `test/companions.test.js` sur `coding` et `sentence` | lignes 17 et 27 | test-verified |
| S8 | 🤖 | parcours de `SENTENCES` | ligne 26 | test-verified |
| S9 | 🤖 | `sentence` palier 2 : toucher, retirer, « Lis ma phrase » vide, ordre faux une fois puis deux fois | lignes 20 à 22, 24 (2ᵉ erreur : nouvelle phrase) | runtime-verified |
| S10 | 🤖 | `test/games.test.js` : `sentence` gagné à chaque palier | lignes 23 et 25 | test-verified |
| S11 | 🤖 | `GAME_LIST`, `AGE_GAME_TYPES`, `NO_TIMER_KINDS`, `livesFor`, `SKILL_GROUPS`, `PROGRESS_CHEERS` | lignes 28 à 30 | test-verified |
| S12 | 🤖 | `test/sounds.test.js` | ligne 31 (sinus seulement, famille définie) | test-verified |
| S13 | 🤖 | niveau 93 puis 94 | ligne 32 | runtime-verified |
| S14 | 🤖 | données de l'île (I1 à I9) | lignes 33 à 37, 46, 46b, 48 | test-verified |
| S15 | 🤖 | toucher un personnage sur la scène des Chatouilles, puis sur une autre île | lignes 38 à 40 | runtime-verified |
| S16 | 🤖 | dialogue, `Math.random` forcé : sans envie ; avec envie jusqu'au stop ; `tickleRestUntil` remis à 0 | lignes 41 à 45 | runtime-verified |
| S17 | 👤 | jouer `coding` aux paliers 1 et 2 sur téléphone | la plume se suit des yeux, on comprend où elle s'arrête, les virages se comprennent | ressenti |
| S18 | 👤 | jouer `sentence` aux paliers 1 et 2 avec la joueuse | elle rit quand l'ordre est absurde ; les mots du palier 1 se lisent | ressenti, écoute |
| S19 | 👤 | chatouiller les 4 personnages, dont Pic | le rire et le son font sourire ; le « stop » et le « non » sont clairs, doux, sans leçon | écoute, ressenti |
| S20 | 👤 | relire noms, titres, objets, squishies, histoire avec la joueuse | elle valide ou propose d'autres noms | revue |
| S21 | 👤 | regarder la scène, les dessins et la carte de la saison 3 sur téléphone (360 px) | rien ne déborde, l'île ne cache aucune autre | rendu |

## Questions ouvertes

Aucune.
