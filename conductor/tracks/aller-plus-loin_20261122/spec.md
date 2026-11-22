---
status: brouillon        # brouillon | validée | faite ; « validée » est posé par l'humain
issue: 0
size: M                  # S | M ; L se découpe
migration: true
sensitive: true          # espace parents, sauvegarde et migration
files:
  - js/entities/difficulty/age.js
  - js/entities/difficulty/index.js
  - js/entities/player/profiles.js
  - js/entities/game-state/state.js
  - js/features/adaptive/game-diff.js
  - js/features/adaptive/skills.js
  - js/features/adaptive/stars.js
  - js/features/adaptive/day.js
  - js/features/adaptive/index.js
  - js/features/adaptive/adaptive.css
  - js/features/minigame-engine/engine.js
  - js/features/companion-team/specialties.js
  - js/features/players/profiles-ui.js
  - js/features/party/race.js
  - js/features/parents/parents.js
  - js/slices.cjs
  - test/aller-plus-loin.test.js
  - ANALYSE-DIFFICULTE.md
  - conductor/product-guidelines.md
taster: { facts: 0, decisions: 0, rounds: 7 }
---

<!-- Gabarit cothon 0.4.0 (setting-up-docs), adopté dans Conductor (cothon 0.2.0-2 et 0.4.0-6) : une nouvelle track part de ce fichier. -->

# Spec : aller plus loin (classe du profil et défi étoile)

- Nouveau projet : non

## Problème

Demande du parent : « des jeux pour aller plus loin, niveau supérieur par rapport à celui adapté à l'âge ». Aujourd'hui, en solo, le palier joué ne dépasse jamais celui de l'âge : une enfant de 6 ou 7 ans reste au palier 2, même quand elle réussit tout (`js/entities/difficulty/age.js:7`, `js/features/adaptive/game-diff.js:37`). Le défi bonus de Zap ne passe pas ce plafond non plus (`game-diff.js:51-53`). Le parent n'a aucun moyen de dire « elle est en CE1 », ni l'enfant de tenter un cran au-dessus quand un jeu est maîtrisé.

## Comportement attendu

Les « paliers » sont ceux de `js/entities/difficulty/difficulty.js:75-80`. « Plafond de l'enfant » désigne `playerCap(p)` (D2). « Plafond du jeu » désigne `min(playerCap(p), gameMaxTier(jeu))`.

**Phase 1 : la classe du profil**

1. Étant donné un profil existant sans champ `grade` (âge 6), quand le jeu charge les profils, alors `p.grade` vaut `''` et `playerCap(p)` vaut 2, exactement `ageToDiff(6)` : aucun palier joué ne change.
2. Étant donné un profil dont `grade` vaut une valeur hors de `['', 'GS', 'CP', 'CE1', 'CE2']` (sauvegarde importée ou abîmée), quand les profils sont chargés, alors `grade` devient `''`.
3. Étant donné les classes GS, CP, CE1, CE2, quand on appelle `gradeToDiff`, alors on obtient 1, 2, 4, 5 ; `gradeToDiff('')` vaut `null`.
4. Étant donné un profil `{ age: 6, grade: 'CE1' }`, quand on calcule `playerCap`, alors on obtient 4 (la classe prime sur l'âge).
5. Étant donné un profil `{ age: null, grade: '' }`, quand on calcule `playerCap`, alors on obtient `null` et `gameDiff()` garde le comportement actuel (palier de l'île, niveau du jeu).
6. Étant donné un profil `{ age: 6, grade: 'CE1' }` en solo sur une île de `diff` 6, un jeu jamais joué, quand `gameDiff()` est appelé, alors il vaut `placementTier(4)` = 3 ; et sur une île de `diff` 2, il vaut au plus 2 (l'île reste un plafond).
7. Étant donné une partie à plusieurs où le joueur courant est `{ age: 6, grade: 'CE1' }`, quand `gameDiff()` est appelé, alors il vaut 4 (la classe remplace l'âge, comme l'âge aujourd'hui à `game-diff.js:25-29`).
8. Étant donné le défi bonus de Zap en cours pour un profil `{ age: 6, grade: 'CE1' }` et un jeu au palier 3, quand `gameDiff()` est appelé, alors il vaut 4 (Zap utilise `playerCap` à la place de `ageToDiff`).
9. Étant donné l'espace parents ouvert sur un enfant, quand il s'affiche, alors une carte « 🎒 Classe » montre 5 puces : « Selon l'âge », « GS », « CP », « CE1 », « CE2 », celle du profil marquée `on` (« Selon l'âge » si `grade` vaut `''`).
10. Étant donné cette carte, quand l'adulte touche « CE1 », alors `p.grade === 'CE1'`, `saveProfiles()` est appelé, la puce passe `on`, et le toast « 🎒 Classe : CE1 » s'affiche ; « Selon l'âge » remet `''` et affiche « 🎒 Classe selon l'âge ».
11. Étant donné la carte « 🎒 Classe », quand elle s'affiche, alors sa ligne d'aide dit, pour un profil de 6 ans sans classe : « Selon l'âge (6 ans) : jusqu'au palier ⭐⭐. » ; avec la classe CE1 : « CE1 : jusqu'au palier ⭐⭐⭐⭐. » ; sans âge ni classe : « Sans âge ni classe : la difficulté suit l'île. »
12. Étant donné le formulaire des réglages d'un joueur dont `grade` vaut `'CE1'`, quand l'âge est choisi, alors l'aide sous les âges dit « Défi adapté : ⭐⭐⭐⭐ (classe CE1, choisie par un adulte) » ; sans classe, le texte actuel (`profiles-ui.js:170`) ne change pas.
13. Étant donné le choix des jeux et la Surprise, quand la classe change, alors la liste des jeux proposés ne change pas (elle reste celle de `gameTypesForAge(âge)`).
14. Étant donné un profil `{ age: 5, grade: 'CE1' }` en solo, sur une île de `diff` 6, avec `state.skills.count.lvl = 4`, quand le test appelle `playGame('count')`, alors `gameDiff()` vaut 4 et, après le rendu, `document.getElementById('challenge-timer')` est `null` (la règle « jamais avant 6 ans » de `engine.js:203-205` reste liée à l'âge) ; le même état avec `age: 6` montre `#challenge-timer` (contrôle).

**Phase 2 : le défi étoile**

15. Étant donné une sauvegarde de la version précédente, fabriquée par le test avec `v: SAVE_VERSION - 1` (constante lue par `ev('SAVE_VERSION')`, jamais de numéro en dur), quand `migrate()` la traite, alors `stars` vaut `{}`, `v` vaut `SAVE_VERSION`, et les autres champs sont identiques à l'entrée (comparaison champ par champ, sur le modèle de `test/licornes.test.js:503-526`).
16. Étant donné un enfant au plafond 2 (6 ans) en solo, hors défi, quand une mission de `count` est enregistrée au palier joué 2, réussie avec au plus 1 erreur, alors `state.stars.count.streak` augmente de 1 ; ratée ou avec 2 erreurs ou plus, il revient à 0 ; jouée au palier 1 (île plus facile), il ne bouge pas.
17. Étant donné `starOfferDue('count')` vrai (règle « Offre due », Politiques) à la fin d'une mission gagnée (par exemple : 6 ans, solo, `streak` passé à 3 par cette mission), quand l'écran de victoire s'affiche, alors il contient le bloc `.star-offer` avec le texte « Ce jeu, tu le connais par cœur ! Tu veux essayer un défi étoile ? C'est un cran plus difficile. » et deux boutons « ⭐ Oui ! » (`#btn-star-yes`) et « Pas maintenant » (`#btn-star-no`), et cette phrase est la dernière de la phrase dite à voix haute ; `noteStarOffered('count')` pose `state.stars.count.offered` à la date du jour et la marque de session. Quand `starOfferDue` est faux, aucun bloc `.star-offer`.
18. Étant donné `streak` à 3 ou plus mais un plafond égal ou supérieur à `gameMaxTier(jeu)` (par exemple CE2 sur `count`, plafond 5), quand l'écran de victoire s'affiche, alors `starOfferDue` est faux (condition 4 de « Offre due ») et aucune offre n'apparaît.
19. Étant donné `streak` à 3 ou plus et un profil sans âge ni classe, quand l'écran de victoire s'affiche, alors `starOfferDue` est faux (condition 3 de « Offre due ») et aucune offre n'apparaît.
20. Étant donné l'offre affichée, quand l'enfant touche « Pas maintenant » (`#btn-star-no`), alors le contenu du bloc `.star-offer` est remplacé par la phrase « D'accord ! Le défi étoile t'attendra. » (sans bouton), la même phrase est dite par `speak` (`js/shared/ui`, comme le refus de Zap à `js/features/companion-team/specialties.js:323` ; `teamSay` n'est pas exporté par la slice `companion-team`), la porte reste fermée, et l'offre ne revient pas pour ce jeu avant le lendemain (`offered` vaut déjà la date du jour depuis l'affichage, point 17).
21. Étant donné l'offre affichée, quand l'enfant quitte l'écran par un autre moyen, alors c'est un refus silencieux : aucune phrase, la porte reste fermée, l'offre ne revient pas avant le lendemain (rien d'autre à écrire : `offered` est posé à l'affichage). Boutons présents avec `.star-offer` (toujours en solo, `engine.js:480-481`) : `#btn-star-yes` (point 22), `#btn-star-no` (point 20), `#btn-yay` « Super ! » (refus silencieux, puis comportement actuel), `#btn-again` « Encore une mission 🎮 » (refus silencieux, puis comportement actuel), la croix de fermeture de la fenêtre (refus silencieux), et les boutons 🔈 éventuels (sans effet sur l'offre).
22. Étant donné l'offre affichée, quand l'enfant touche « ⭐ Oui ! », alors `state.stars.count.open` vaut `true`, `miss` vaut 0, la fenêtre se ferme et une partie de `count` démarre aussitôt au palier `starTier('count')` (définition D9), soit 3 ici.
23. Étant donné un profil de 6 ans sans classe en solo, l'interrupteur actif, et `state.stars.count = { streak: 0, open: true, miss: 0, won: 0, offered: null }` écrit par le test, quand le test appelle `playGame('count')`, alors `inStarMission()` est vrai, `gameDiff()` vaut 3, et après le rendu (`setTimeout` 0) `#modal-body .game-head .star-badge` existe ; le même appel par la Surprise (`startMinigame` qui tombe sur `count`) ou un personnage donne le même résultat, puisque tous passent par `playGame`.
24. Étant donné une mission étoile, quand elle démarre, alors le nombre d'essais et la durée du minuteur sont ceux du palier habituel (`normalDiff()`, 2 ici) : pas de minuteur pour un enfant au plafond 2, même si le palier de la question est 3.
25. Étant donné une mission étoile, quand l'enfant fait une erreur, alors `miss` augmente de 1 ; une bonne étape (`stepOk`) ou une mission gagnée remet `miss` à 0.
26. Étant donné une mission étoile et `miss` à 1, quand l'enfant fait une 2e erreur d'affilée (`loseLife`), alors `noteStarError()` ferme la porte aussitôt (`open` à `false`, `streak` à 0, `miss` à 0) et renvoie `true` ; le moteur retire alors `.star-badge` de la fenêtre ; `inStarMission()` reste vrai jusqu'à la fin de la mission, mais `gameDiff()` revient au palier habituel (règle « Palier étoile », Politiques) : la mission continue au palier habituel jusqu'à sa fin, sans badge.
27. Étant donné une mission étoile gagnée **porte encore ouverte**, quand l'écran de victoire s'affiche, alors la récompense est la récompense normale (pas de doublement), `won` augmente de 1, et l'écran ajoute « Défi étoile réussi ! Ce jeu gagne son étoile ⭐ » si `won` vaut 1, sinon « Défi étoile réussi ⭐ » ; la même phrase est dite à voix haute ; aucun texte du point 30.
28. Étant donné une mission étoile, gagnée ou ratée, que sa porte se soit fermée pendant la mission ou non, quand elle est enregistrée, alors `wins`, `fails`, `errors` et `last` sont comptés comme pour Zap, mais `recent`, `atLvl`, `lvl`, `support` et `streak` ne changent pas (comme `skills.js:58-62`).
29. Étant donné une mission étoile ratée (plus d'essais) **porte encore ouverte**, quand l'écran d'échec s'affiche, alors son titre est « Bien essayé ! » (au lieu de « Raté ! ») et son message « Le défi étoile était très difficile. C'était courageux d'essayer ! », suivi du texte du point 30 ; la porte se ferme (`open` à `false`, `streak` à 0, `miss` à 0), et rien de ce qui a été gagné avant n'est retiré.
30. Texte de retour : « On revient à ton jeu habituel. Ton étoile reste à toi ! » si `won` est au moins 1, sinon « On revient à ton jeu habituel. Bravo d'avoir essayé ! ». Étant donné une mission étoile dont la porte s'est fermée pendant la mission (point 26), quand elle se termine : gagnée, l'écran de victoire habituel (récompense normale d'une mission) montre et dit ce seul texte de retour, sans texte du point 27, et `won` ne change pas ; ratée, l'écran d'échec garde le titre « Raté ! » et le message habituels du moteur (`engine.js:346-356`), suivis du texte de retour. Étant donné l'échec du point 29, le texte de retour suit son message. Dans tous les cas, rien de ce que l'enfant avait (pièces, objets, niveau du jeu, étoiles déjà gagnées) n'est retiré.
31. Étant donné une porte fermée par le point 26 ou 29 (`streak` remis à 0) et une offre déjà faite pendant cette ouverture du jeu (condition 10), quand trois nouvelles missions maîtrisées au plafond remontent `streak` à 3 (règle D8), alors `starOfferDue` reste faux pendant cette ouverture ; le test recharge alors une page neuve, sur le modèle de `test/stockage.test.js` (un second `new JSDOM(page.buildHtml(), { beforeParse(win) { win.localStorage.setItem(…) } })` et son `ev2`), en recopiant dans le nouveau `localStorage` les clés de profils et de partie du premier, et avec `offered` d'un autre jour ; dans cette page neuve, `starOfferDue('count')` est vrai et l'offre revient (point 17).
32. Étant donné un jeu dont `won` vaut au moins 1, quand le choix des jeux le propose, alors son bouton porte un petit `⭐` (`.star-mark`, `aria-hidden="true"`), même porte fermée.
33. Étant donné une partie à plusieurs (chacun son tour ou course), quand un jeu dont la porte est ouverte est joué, alors ce n'est pas une mission étoile (règle « Palier étoile »), `starOfferDue` est faux (condition 5) et aucun compteur ne bouge (`recordMission` s'arrête, `skills.js:42-45`).
34. Étant donné un défi bonus de Zap, quand Zap choisit son jeu, alors il ne choisit jamais un jeu dont la porte est ouverte ; et si un défi de Zap est en cours, la partie n'est pas une mission étoile (règle « Palier étoile »), `starOfferDue` est faux (condition 6) et elle ne compte pas dans `streak` (`recordMission` s'arrête comme pour Zap, `skills.js:58-62`).
35. Étant donné l'espace parents, quand il s'affiche, alors la carte « 🎒 Classe » contient aussi deux puces « ⭐ Défis étoile » et « Pas de défi étoile », celle du profil marquée `on` (« ⭐ Défis étoile » si `p.starChallenges` n'est pas `false`).
36. Étant donné une porte ouverte sur `count` et l'adulte qui touche « Pas de défi étoile », quand le réglage est enregistré, alors `closeAllStarDoors(st)` ferme toutes les portes de cet enfant (`open` à `false`, `miss` à 0 ; `streak` et `won` restent) ; et si une porte est encore ouverte quand l'interrupteur est coupé (partie importée, autre onglet), `beginStarMission(k)` au démarrage d'une partie la ferme et ne démarre pas de mission étoile. Ensuite aucune offre n'apparaît (`starOfferDue` faux) ; `won` et les étoiles du choix des jeux restent.
37. Étant donné une classe changée par l'adulte, quand l'enregistrement est fait, alors `starsResetFor(st)` ferme toutes les portes de cet enfant et remet tous les `streak` à 0 ; `won` reste.
38. Étant donné la liste « Progrès par compétence » de l'espace parents, quand un jeu a `won` au moins 1, alors sa ligne de détail ajoute « · ⭐ défi étoile réussi N fois » (« 1 fois » au singulier).

## Décisions

| Id | Décision | Pourquoi | Source |
|---|---|---|---|
| D1 | Table classe vers plafond : GS 1, CP 2, CE1 4, CE2 5. Règle : le palier dont le repère scolaire est la classe elle-même ; les paliers « de fin d'année » (3 : fin CP ; 5 : fin CE1) s'atteignent par le défi étoile de la classe d'en dessous (CP vers 3, CE1 vers 5) | Repères du code : palier 1 « GS / début CP », 2 « CP », 3 « fin CP / CE1 », 4 « CE1 », 5 « fin CE1 / CE2 » ; CE2 à 5 garde la parité avec 10 ans et plus | `js/entities/difficulty/difficulty.js:75-80`, `ANALYSE-DIFFICULTE.md:36-42`, `js/entities/difficulty/age.js:5-11` |
| D2 | `playerCap(p) = gradeToDiff(p.grade) \|\| ageToDiff(p.age) \|\| null`, dans `js/entities/difficulty/age.js`, exporté par `index.js` de la slice | La classe, choisie par un adulte, prime ; sans classe, l'âge reste la source, sans aucun changement | `js/entities/difficulty/age.js:14-18` |
| D3 | La classe par défaut d'un profil existant est `''` (« Selon l'âge ») et non une classe déduite et stockée | Aucune classe ne donne le palier 3 de 8 ans (`age.js:8`) : stocker une classe déduite changerait le palier des enfants de 8 ans ; « selon l'âge » calcule le plafond depuis l'âge à chaque fois, donc aucune partie ne change de niveau à la mise à jour | `js/entities/difficulty/age.js:5-11` |
| D4 | `grade` et `starChallenges` sont des champs du **profil** (stockage `lagon-magique-profiles`), normalisés à la lecture dans `loadProfiles`, sans `SAVE_VERSION` | Comme l'âge, la pause et l'anniversaire : réglages de l'enfant par un adulte, hors de la partie ; `SAVE_VERSION` ne versionne que `state` ; la normalisation à l'entrée sert de migration et de garde pour l'import | `js/entities/player/profiles.js:55-67`, `profiles.js:148-151`, `js/features/players/profiles-ui.js:387` |
| D5 | La classe se règle dans l'espace parents (derrière la porte des adultes), carte « 🎒 Classe » ; pas dans le formulaire du joueur | Le formulaire du joueur s'ouvre sans porte (Réglages, panneau des joueurs) ; la classe change la difficulté : réglage d'adulte | `js/features/parents/parents.js:124-171`, `js/features/settings/settings.js:126`, `js/features/players/profiles-ui.js:93` |
| D6 | Ordre de priorité : la classe (ou l'âge) plafonne, l'île plafonne en solo, le niveau propre au jeu plafonne ; seul le défi étoile passe un cran au-dessus du plafond de l'enfant | Garde la règle actuelle `adaptedDiff(min(âge, île))` en remplaçant l'âge par `playerCap` | `js/features/adaptive/game-diff.js:34-38`, `js/features/adaptive/adaptive.js:107-113` |
| D7 | La classe ne change ni `AGE_GAME_TYPES` (jeux proposés) ni la règle « pas de minuteur avant 6 ans » ; le minuteur reste « âge 6 ans ou plus et palier 3 ou plus » | Règles d'âge à ne pas bouger sans décision ; un enfant de 6 ans en CE1 a passé le CP, donc la règle « pas de minuteur avant le CP » tient | `js/entities/difficulty/game-types.js:46-110`, `js/features/minigame-engine/engine.js:203-207`, `conductor/product-guidelines.md:8` |
| D8 | Maîtrise d'un jeu : `state.stars[jeu].streak`, nombre de missions d'affilée jouées au plafond du jeu (`t === min(playerCap, gameMaxTier)`), réussies, avec au plus `SKILL_ERR_TOLERANCE[jeu] \|\| 1` erreurs ; une mission jouée plus bas ne compte pas ; la porte s'offre à 3 | Mêmes critères que la montée de niveau (2 réussites, au plus 1 erreur, 3 au mémo), avec une mission de plus pour parler de maîtrise ; `recent` ne suffit pas car il mêle les paliers et ne sait pas « depuis la fermeture » | `js/features/adaptive/adaptive.js:126-137`, `js/features/adaptive/skill-status.js:15`, `js/features/adaptive/skills.js:49,63` |
| D9 | Le palier d'une mission étoile est `starTier(jeu) = min(playerCap + 1, gameMaxTier(jeu))`, offert seulement si `playerCap < gameMaxTier(jeu)` ; il ignore l'île | Un seul cran ; comme le défi de Zap qui ne regarde pas l'île ; CE2 n'a de défi que sur le calcul mental, les formes et les planètes (palier 6) | `js/features/adaptive/game-diff.js:53`, `js/features/adaptive/adaptive.js:33` |
| D10 | La porte reste ouverte d'une partie à l'autre et se ferme après 2 erreurs d'affilée (`STAR_MISS_LIMIT = 2`) ; au mémo, 6 erreurs d'affilée (2 × la tolérance du mémo) ; défaut du rédacteur pour le mémo, à juger à la revue | Décision d'Amrou (brief, décision 4) ; au mémo, retourner deux cartes différentes fait partie du jeu | brief décision 4, `js/features/adaptive/skill-status.js:12-15` |
| D11 | Une mission étoile garde les essais et le minuteur du palier habituel (`normalDiff()`) : le défi change la question, pas la pression | Jamais de minuteur ajouté par un défi (défaut du brief) ; moins d'essais au palier supérieur rendrait l'échec plus probable, ce qui contredit « pas de punition » | `js/entities/difficulty/difficulty.js:472-479`, `js/features/minigame-engine/engine.js:60-62`, `conductor/product-guidelines.md:6` |
| D12 | Ce qu'on gagne : une marque de fierté (une étoile sur le jeu, la phrase de réussite), la récompense normale, aucun doublement ni pièce en plus | Les récompenses tangibles attendues et liées à la tâche réduisent la motivation intrinsèque, les retours verbaux non (méta-analyse de Deci, Koestner et Ryan, 1999). Page non lisible par l'outil du rédacteur (PDF compressé) : source fournie par le brief, contenu à relire par l'humain | https://depts.washington.edu/techdocs/papers/deciExtrinsicRewardsAndIntrinsicMotivation99.pdf |
| D13 | Principe d'aller au-dessus du niveau de l'âge | Méta-analyse de second ordre (Steenbergen-Hu, Makel, Olszewski-Kubilius, 2016) : l'accélération a un effet positif sur les résultats scolaires. Le communiqué lu ne chiffre pas l'effet socio-affectif : la track ne s'appuie donc pas sur lui, et garde ses propres garde-fous (offre refusable, retrait après 2 erreurs, rien de perdu) | https://today.duke.edu/2016/12/new-analysis-finds-two-measures-boost-k-12-academic-achievement |
| D14 | Le défi bonus de Zap est **gardé**, séparé et sans cumul : Zap joue un cran au-dessus du niveau du jeu, jamais au-dessus du plafond de l'enfant (`playerCap` remplace `ageToDiff`), 1 fois par jour et par île, récompense doublée ; le défi étoile est le seul chemin au-dessus du plafond. Zap ne choisit pas un jeu à porte ouverte, et Zap prime s'il est en cours | Zap est une spécialité de compagnon déjà jouée (v52), qui sert un autre but (variété quotidienne) ; le fusionner ou retirer son doublement change un compagnon que la joueuse connaît : défaut du rédacteur, à juger à la revue | `js/features/companion-team/specialties.js:18-20,294-331`, `js/features/adaptive/game-diff.js:47-54`, `js/features/minigame-engine/engine.js:408-409` |
| D15 | À plusieurs : la classe remplace l'âge pour le palier de chacun ; pas de défi étoile, pas d'offre, aucun compteur | À plusieurs, chacun joue à son niveau et rien n'est compté (`recordMission` s'arrête) | `js/features/adaptive/game-diff.js:25-29`, `js/features/adaptive/skills.js:42-45` |
| D16 | Interrupteur parent `p.starChallenges` (absent ou `true` : actif ; `false` : coupé), dans la carte « 🎒 Classe » | Décision d'Amrou : le parent peut couper les défis ; actif par défaut car l'offre est toujours refusable : défaut du rédacteur, à juger à la revue | brief décision 4 |
| D17 | Nouveau champ d'état `state.stars = { [jeu]: { streak, open, miss, won, offered } }` : `SAVE_VERSION` passe à `SAVE_VERSION + 1` (9 aujourd'hui, `state.js:11`, donc 10 ; ou le suivant de `main` après rebase si une autre track a migré avant), `migrate()` ajoute `stars: {}` dans une branche `if (v < SAVE_VERSION)` écrite avec le nouveau numéro ; pas de rattrapage du compteur depuis `recent` | `load()` ne garde que les clés de `DEFAULT_STATE` ; le plafond de l'enfant n'est pas connu dans `migrate()` (il vit dans le profil) | `js/entities/game-state/state.js:11,106-151,218-280,283-300` |
| D18 | Offre : définie une seule fois par la règle « Offre due » (Politiques), évaluée sur l'écran de victoire ; refus silencieux selon le point 21 | Toujours refusable, jamais insistante (brief) ; l'écran de victoire est le moment où la maîtrise vient d'être prouvée | `js/features/minigame-engine/engine.js:391-500` |
| D20 | Une mission étoile dont la porte s'est fermée en cours (2 erreurs d'affilée) continue au palier habituel jusqu'à sa fin et ne donne pas d'étoile, même gagnée (`won` inchangé), puisqu'elle s'est finie au palier habituel ; l'enfant ne perd rien de ce qu'il avait. À la fin, un seul texte : celui du point 30 (victoire, avec la récompense normale) ; en cas d'échec, titre et message habituels du moteur suivis du texte du point 30. Défaut de Claude, à juger à la revue par Amrou | Une étoile récompense une mission réussie au palier du défi ; « sans rien perdre » (brief, décision 4) | brief décision 4, `js/features/minigame-engine/engine.js:335-356` |
| D21 | Types (TypeScript strict sur `js/entities` et `js/shared`, `tsconfig.strict.json`) : `age.js` gagne `@typedef {{ id: string, label: string, diff: number }} Grade`, `/** @type {Grade[]} */ GRADES`, `gradeToDiff` (`@param {unknown} grade`, `@returns {number \| null}`) et `playerCap` (`@param {{ age?: number \| null, grade?: string } \| null \| undefined} p`, `@returns {number \| null}`). Le `@typedef Profile` (`profiles.js:13-28`) gagne `grade?: string` (`''`, `'GS'`, `'CP'`, `'CE1'` ou `'CE2'` après `loadProfiles`) et `starChallenges?: boolean` ; son commentaire les décrit. `state.js` gagne `@typedef {{ streak: number, open: boolean, miss: number, won: number, offered: string \| null }} StarRecord`, le champ `stars: Record<string, StarRecord>` dans `@typedef GameState` (`state.js:60-102`), et `game-state/index.js` réexporte `StarRecord` comme `GameState` et `Look`. Tout le code nouveau ou modifié de la track s'écrit en strict, quelle que soit sa slice (règle des deux checklists) ; `js/features/adaptive` et `js/features/party` sont déjà dans `tsconfig.strict.json` : `stars.js` (`@param`, `@returns`, `StarRecord` lu par `import('../../entities/game-state/index.js').StarRecord`, `starMission` typé `{ key: string } \| null`), `normalDiff` et `gameDiff` (`@returns {number}`), et les appels de `race.js` sont vérifiés en strict ; `lastGame` est `string \| null` (`session.js:7`) : `gameDiff` ne passe `lastGame` à `starTier` qu'après la garde `lastGame && starActive()` (comme la conversion de `game-diff.js:53`). Les ajouts dans `engine.js`, `profiles-ui.js`, `specialties.js` et `parents.js` sont annotés de la même façon (`@param`, `@returns`, `@type` des éléments du DOM). Jamais `any` ni `@ts-ignore` | Le rebase sur `main` a rendu ces couches strictes ; la checklist des mini-jeux porte la même règle | `tsconfig.strict.json` (`include` : `js/shared`, `js/entities`, `js/features/adaptive`, `js/features/party`, entre autres), `js/entities/player/profiles.js:13-34`, `js/entities/game-state/state.js:22-107`, `js/entities/game-state/index.js:3-5`, `js/entities/difficulty/age.js:13-18`, [checklist-mini-jeu](../../checklist-mini-jeu.md) |
| D19 | La logique du défi étoile vit dans un nouveau fichier `js/features/adaptive/stars.js` (slice `adaptive`), son rendu dans le moteur (écran de victoire, d'échec, badge) et le choix des jeux | Le moteur importe déjà `adaptive` ; `adaptive` est sous le moteur et sous `players` dans les couches | `js/features/minigame-engine/engine.js:24-39`, `js/slices.cjs:112-121` |

## Politiques

- **Arbitrages** : classe contre âge : la classe gagne pour le palier, l'âge garde les jeux proposés et la règle du minuteur. Île contre défi étoile : le défi étoile ignore l'île (D9). Zap contre défi étoile : Zap gagne quand il est en cours, et la partie ne compte pour aucun des compteurs étoile. Interrupteur coupé contre porte ouverte : l'interrupteur gagne, la porte se ferme. Fermeture de la porte en pleine mission : la mission continue, seules les questions suivantes reviennent au palier habituel.
- **Palier étoile** (règle unique, portée par `starActive()` de `stars.js`) : `gameDiff()` renvoie `starTier(lastGame)` **si et seulement si** `inStarMission()` est vrai, `state.stars[lastGame].open === true`, `currentProfile().starChallenges !== false`, `playerCap(currentProfile())` n'est pas `null`, `!party.active` et `!inBonusChallenge()`. `inStarMission()` vaut `!!starMission && starMission.key === lastGame`, où `starMission` est une variable de session de `stars.js` posée par `beginStarMission(k)` au démarrage de chaque partie (appelée par `playGame`, juste après `bonusOnNewGame()`, `engine.js:311`) quand la porte de `k` est ouverte et les conditions ci-dessus vraies, et remise à `null` par `endStarMission()` à la fin de la mission (`onMissionWin`, `onMissionFail`, comme `endBonusChallenge`, `engine.js:338,447`). Porte ouverte mais pas de mission étoile en cours (avant `playGame`, ou à plusieurs) : palier habituel. Porte fermée en pleine mission : `inStarMission()` reste vrai jusqu'à la fin (la mission est comptée comme étoile, point 28), mais `starActive()` devient faux, donc palier habituel et pas de badge.
- **Offre due** (règle unique, portée par `starOfferDue(k)` de `stars.js`, évaluée par `onMissionWin` après `recordMission` ; tous les points qui parlent de l'offre renvoient ici) : `starOfferDue(k)` est vrai si et seulement si **toutes** ces conditions sont vraies :
  1. `starOf(k).streak >= STAR_STREAK` (3) ;
  2. l'interrupteur est actif (`currentProfile().starChallenges !== false`) ;
  3. le plafond est connu (`playerCap(currentProfile())` n'est pas `null`) ;
  4. ce plafond est strictement inférieur à `gameMaxTier(k)` ;
  5. pas de partie à plusieurs (`!party.active`) ;
  6. pas de défi de Zap en cours (`!inBonusChallenge()`) ;
  7. la porte de `k` est fermée (`starOf(k).open !== true`) ;
  8. pas de mission étoile en cours (`!inStarMission()`) ;
  9. pas déjà offerte aujourd'hui pour `k` (`starOf(k).offered !== todayKey()`) ;
  10. aucune offre de défi étoile depuis l'ouverture du jeu : une marque de session **globale** (une seule pour tous les jeux, variable de module de `stars.js`), posée par `noteStarOffered` ; l'API n'a aucune remise à zéro : seule une nouvelle ouverture du jeu (nouveau chargement de la page) la remet à faux.
- **Imports de la slice `adaptive`** (pas de cycle, `import/no-cycle` est en erreur dans `.oxlintrc.json`) : `todayKey` quitte `skills.js` pour un nouveau fichier sans dépendance `js/features/adaptive/day.js` (même nom, même code) ; `adaptive/index.js` l'exporte depuis `./day.js` (aucun export nouveau : `parents.js` et `specialties.js` l'importent toujours par `index.js`) ; `skills.js` l'importe de `./day.js`. Graphe interne après le changement (A vers B : A importe B) : `session.js`, `skill-status.js`, `day.js` : aucun import interne ; `adaptive.js` vers `session.js`, `skill-status.js` ; `stars.js` vers `session.js`, `skill-status.js`, `day.js`, `adaptive.js` (`gameMaxTier`) ; `game-diff.js` vers `adaptive.js`, `session.js`, `stars.js` ; `skills.js` vers `adaptive.js`, `game-diff.js`, `skill-status.js`, `session.js`, `stars.js`, `day.js`. Aucun fichier n'importe `skills.js` ni `game-diff.js` en retour, `stars.js` n'importe ni `skills.js` ni `game-diff.js` : le graphe n'a pas de cycle. Les imports existants sont ceux de `js/features/adaptive/*.js` (en-têtes de fichier).
- **Défauts** : constantes dans `stars.js` : `STAR_STREAK = 3`, `STAR_MISS_LIMIT = 2`, limite du mémo `2 * SKILL_ERR_TOLERANCE.memory`. Aucune dépendance nouvelle. Une valeur de `state.stars[jeu]` absente se lit `{ streak: 0, open: false, miss: 0, won: 0, offered: null }`. Une sauvegarde d'un autre enfant (profil non courant) lue brute par l'espace parents : on ne touche `st.stars` que s'il existe (`parents.js:329-340` pour l'écriture). Compatibilité : pas de `?.` ni `??` dans le nouveau code, `(st.stars || {})[k]`.
- **Textes de l'enfant** (tous écrits plus haut, sans accord de genre, dits à voix haute) : offre (point 17), refus (point 20), réussite (point 27), échec (point 29), retour au jeu habituel (point 30). Le badge `⭐` n'a pas de texte à lire. Aucun autre texte n'est montré à l'enfant.
- **Textes du parent** : puces et aides des points 9 à 11, 35 et 38 ; aide de la carte sous les puces de défi : « Quand un jeu est maîtrisé à son niveau, l'enfant peut accepter un défi un cran au-dessus. Après 2 erreurs d'affilée, le jeu revient à son niveau, sans rien perdre. » ; la phrase de `parents.js:259` devient, **en phase 1** (tâche 5) : « Chaque jeu a son propre niveau : il monte d'un cran après 2 réussites d'affilée presque sans erreur, redescend d'un cran après 2 missions ratées, et ne dépasse jamais celui de l'île ni la classe de l'enfant (ou son âge, sans classe choisie). Les jeux à travailler reviennent plus souvent. » ; **en phase 2** (tâche 18) : « Chaque jeu a son propre niveau : il monte d'un cran après 2 réussites d'affilée presque sans erreur, redescend d'un cran après 2 missions ratées, et ne dépasse jamais celui de l'île ni la classe de l'enfant (ou son âge, sans classe choisie), sauf pendant un défi étoile accepté par l'enfant. Les jeux à travailler reviennent plus souvent. » Règle : chaque phase ne livre que des textes vrais avec cette phase seule en production ; l'aide sous les puces de défi n'arrive qu'en phase 2.
- **Espaces avant « ! » et « ? »** : `onMissionWin` remplace l'espace avant « ! » ou « ? » par une espace insécable, pour le seul `praise` (`engine.js:437`). Les textes de cette track sont insérés et dits tels quels, avec une espace ordinaire, sans ce remplacement. Les tests comparent le `textContent` (et les phrases passées à `speak`) après avoir remplacé `\u00a0` par une espace ordinaire, pour rester justes si l'agent applique le même remplacement.
- **Référence visuelle** : la carte « 🎒 Classe » reprend les puces de la pause douce (`ps-chips`, `ps-chip`, `parents.js:249-254`) ; le bloc d'offre reprend `.speech.team-extra` de l'écran de victoire (`engine.js:464`) avec deux `btn-small` comme l'offre de Zap (`specialties.js:311-313`) ; le badge `.star-badge` (`<span class="star-badge" role="img" aria-label="Défi étoile">⭐</span>`) est ajouté à la fin de `.game-head` (bloc écrit par `gameHeader`, `js/features/screen/screen.js:32-41`) par le **moteur**, sans toucher `screen.js` : `engine.js` s'inscrit avec `onModalOpen(() => setTimeout(starBadgeDecorate, 0))` (`js/shared/ui/modal.js:10,41,60`), comme Perle le fait déjà (`js/features/companion-team/specialties.js:189`) ; `starBadgeDecorate()` ajoute le badge si et seulement si la règle « Palier étoile » est vraie et que `#modal-body .game-head` existe sans badge. Imports permis : `minigame-engine` importe déjà `shared/ui` et `adaptive` (`js/features/minigame-engine/engine.js:10-39`, couches de `js/slices.cjs:109-121,182`) ; `.star-mark` reprend la place de `.leo-badge` sur le bouton du choix des jeux (`specialties.js:204-208`).
- **Détails non écrits** : l'agent prend le défaut de la référence ou l'option la plus simple, le note dans le journal de décisions du plan, l'humain juge à la revue.

## Usages de l'âge dans `js/` et leur sort

Relevé par `grep -rn "ageToDiff\|\.age\b\|currentPlayerAge()" js` dans le worktree.

| Endroit | Usage | Sort |
|---|---|---|
| `js/features/adaptive/game-diff.js:27` | palier à plusieurs | remplacé par `playerCap(p)` (tâche 4) |
| `js/features/adaptive/game-diff.js:36` | plafond en solo | remplacé par `playerCap(p)` (tâche 4) |
| `js/features/adaptive/game-diff.js:51` | plafond du défi de Zap | remplacé par `playerCap(p)` (tâche 4) |
| `js/features/party/race.js:165` | étoiles de niveau de chaque couloir de la course | remplacé par `playerCap(p)` (tâche 4), pour montrer le palier vraiment joué |
| `js/features/party/race.js:174` | étoiles de niveau du joueur dont c'est le tour | remplacé par `playerCap(cur)` (tâche 4) |
| `js/features/players/profiles-ui.js:170` | aide « Défi adapté » sous les âges | complété par la classe (point 12, tâche 6) |
| `js/features/minigame-engine/engine.js:204` | pas de minuteur avant 6 ans | inchangé : règle d'âge (D7) |
| `js/features/minigame-engine/engine.js:323`, `js/features/players/profiles-ui.js:425,432`, `js/features/companion-team/specialties.js:295` | jeux proposés selon l'âge (`gameTypesForAge`, `worldGame`) | inchangés : `AGE_GAME_TYPES` reste lié à l'âge (D7) |
| `js/features/squishies/squishy-room.js:454,1107` | difficulté du rangement des squishies | inchangé : activité de la chambre, hors des paliers des mini-jeux |
| `js/features/parents/parents.js:256` | jeux listés dans « Progrès par compétence » | inchangé : suit `gameTypesForAge` |
| `js/features/settings/settings.js:41`, `js/features/players/profiles-ui.js:62` | « N ans » affiché | inchangés : affichage de l'âge |
| `js/features/players/profiles-ui.js:130` | âge exigé pour la course | inchangé : la course garde l'âge comme réglage obligatoire |
| `js/features/players/profiles-ui.js:192,242-244,294,356-358,390` | saisie de l'âge | inchangés |
| `js/entities/player/party-state.js:53-55` | `currentPlayerAge()` | inchangé |

## Hors périmètre

- Changer les jeux proposés selon la classe (`AGE_GAME_TYPES`), la règle du minuteur, `LIVES_TABLE`.
- Un deuxième cran (plafond + 2), une classe CM1 ou plus.
- Changer la récompense doublée de Zap ou ses règles de choix, hors l'exclusion des portes ouvertes.
- Le bilan des parents (track `bilan-parents_20261122`), qui peut lire `won` en option.
- Corriger l'affichage du niveau dans l'espace parents quand `s.lvl` vaut plafond + 1 (`parents.js:221`, voir `adaptive.js:128`).

## Contrats partagés

| Contrat | Forme (ou lien) | Propriétaire | Consommateurs |
|---|---|---|---|
| `GRADES` | `[{ id: 'GS', label: 'GS', diff: 1 }, { id: 'CP', label: 'CP', diff: 2 }, { id: 'CE1', label: 'CE1', diff: 4 }, { id: 'CE2', label: 'CE2', diff: 5 }]` | `js/entities/difficulty/age.js` | parents, profiles-ui, tests |
| `gradeToDiff(grade)`, `playerCap(p)` | nombre de 1 à 5, ou `null` | `js/entities/difficulty/age.js` | game-diff, stars, parents, profiles-ui |
| `p.grade`, `p.starChallenges` | `'' \| 'GS' \| 'CP' \| 'CE1' \| 'CE2'` ; booléen, absent = `true` | `js/entities/player/profiles.js` | game-diff, stars, parents |
| `state.stars[jeu]` | `{ streak: number, open: boolean, miss: number, won: number, offered: 'AAAA-MM-JJ' \| null }` | `js/features/adaptive/stars.js` | engine, players, parents, bilan-parents (option) |
| API de `stars.js` | `starOf(k)`, `starTier(k)`, `beginStarMission(k)`, `endStarMission()`, `inStarMission()`, `starActive()`, `starOfferDue(k)`, `noteStarOffered(k)`, `openStarDoor(k)`, `closeStarDoor(k)`, `noteStarError()` (renvoie `true` si la porte vient de se fermer), `noteStarGood()`, `starAfterMission(ok, errors, t)`, `closeAllStarDoors(st)`, `starsResetFor(st)` | `js/features/adaptive/stars.js` | engine, specialties, players, parents |
| `normalDiff()` | palier sans la porte étoile | `js/features/adaptive/game-diff.js` | engine (essais, minuteur) |

## Surface d'attaque

| Entrée | Données ou appelant | Limites et vérifications | Peut atteindre | Jamais |
|---|---|---|---|---|
| `p.grade` d'un profil importé | fichier de sauvegarde (entrée non fiable) | liste blanche dans `loadProfiles` ; sinon `''` | le plafond de palier | du HTML : la valeur n'est insérée qu'après la liste blanche |
| `state.stars` d'une partie importée | fichier de sauvegarde | lecture défensive : nombres via `Number(x) \|\| 0`, `open` via `=== true` | l'offre et la porte d'un jeu | un palier au-delà de `starTier` |

## Zones sensibles touchées

Espace parents (`js/features/parents/`), sauvegarde et migration (`js/entities/game-state/state.js`), profils lus à l'import (`js/entities/player/profiles.js`) : revue humaine obligatoire.

## Smoke test

🤖 : un agent la prouve et joint la preuve. 👤 : seul l'humain peut juger.

| Id | Qui | Étapes | Attendu | Niveau visé |
|---|---|---|---|---|
| S1 | 🤖 | `test/aller-plus-loin.test.js` : points 1 à 14 | tous verts | test-verified |
| S2 | 🤖 | même fichier : points 15 à 38, avec `Math.random` remplacé pour les tirages | tous verts | test-verified |
| S3 | 🤖 | `bun run check` | sortie 0 | runtime-verified |
| S4 | 👤 | Amrou règle la classe dans l'espace parents sur le téléphone, puis repasse sur « Selon l'âge » | la carte est claire, le palier suit | e2e-verified |
| S5 | 👤 | La joueuse maîtrise un jeu, entend l'offre, l'accepte puis la refuse un autre jour | l'offre est comprise à l'oral, ne la presse pas, le retour au jeu habituel ne la vexe pas | e2e-verified |
| S6 | 👤 | La joueuse gagne un défi étoile | l'étoile sur le jeu lui fait plaisir, elle la retrouve dans le choix des jeux | e2e-verified |

## Questions ouvertes

