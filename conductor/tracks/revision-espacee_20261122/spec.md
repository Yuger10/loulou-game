---
status: faite            # livrée en v67 le 26/11/2026 ; brouillon | validée | faite ; posé à la demande d'Amrou le 26/11/2026 (« tu passes tout en validé »)
issue: 0
size: M                  # S | M ; L se découpe (ici en deux phases, une PR chacune)
migration: true
sensitive: true          # sauvegarde et migration (js/entities/game-state/), import de sauvegarde (entrée non fiable)
files: [js/entities/review/review.js, js/entities/review/index.js, js/entities/game-state/state.js, js/features/hints/hints.js, js/features/hints/index.js, js/features/minigame-engine/engine.js, js/features/minigame-engine/index.js, js/features/review/review.js, js/features/review/review.css, js/features/review/index.js, js/features/minigames/math/math.js, js/features/minigames/calc/calc.js, js/features/minigames/compare/compare.js, js/features/minigames/clock/clock.js, js/features/minigames/reading/reading.js, js/app/init.js, js/slices.cjs, test/revision.test.js, test/licornes.test.js]
taster: { facts: 0, decisions: 0, rounds: 13 }
---

<!-- Gabarit cothon 0.4.0 (setting-up-docs), adopté dans Conductor (cothon 0.2.0-2 et 0.4.0-6) : une nouvelle track part de ce fichier. -->

# Spec : la révision espacée (« les souvenirs »)

- Nouveau projet : non

## Problème

Une question ratée disparaît pour toujours : le jeu en tire une autre au hasard et ne s'en souvient pas. Ce que l'enfant n'a pas su lundi n'est jamais reposé mardi. Or revoir une notion à quelques jours d'écart, en la retrouvant de mémoire, aide à la retenir.

Cette track garde les questions ratées de quelques jeux simples, et les repose un, trois puis sept jours plus tard, dans une petite mission « souvenirs » de 3 questions au plus, proposée par le compagnon en début de séance, toujours refusable.

## Ce que disent les preuves (et leurs limites)

| Preuve | Ce qu'on en garde | Limite pour une enfant de 6 ans |
|---|---|---|
| Méta-analyse de la pratique distribuée en classe (*Behavioral Sciences* 2025 ; 22 rapports, 31 effets, N > 3000) : d = 0,54 [0,31 ; 0,77]. https://pmc.ncbi.nlm.nih.gov/articles/PMC12189222/ | Revoir à jours d'écart plutôt que d'affilée. | Les études en **primaire** ont le plus d'effets négatifs et de résultats non significatifs (figure 7) ; les méta-analyses antérieures citées donnent d = 0,57 en primaire contre 0,70 au secondaire. Aucune étude à 6 ans isolée. |
| Agarwal, Nunes et Blunt 2021, *Educational Psychology Review*, revue systématique de la récupération en mémoire en classe : 50 expériences, 49 effets, n = 5374, 57 % d'effets moyens ou grands, pour divers niveaux scolaires. https://link.springer.com/10.1007/s10648-021-09595-9 (résumé relu via Crossref et Semantic Scholar, la page de l'éditeur demandant une connexion) | Reposer la question (retrouver la réponse) plutôt que remontrer la leçon. | 6 % seulement des expériences hors pays occidentaux ; peu d'études à l'âge du CP. |
| Kliegl et al. 2018, *Frontiers in Psychology* : pas d'effet de test chez des enfants de maternelle en rappel libre ; un effet net en rappel **indicé**, nettement plus fort avec un **retour immédiat**. https://www.ncbi.nlm.nih.gov/pmc/articles/PMC6110808/ | Questions à choix (indicées), et toujours un retour immédiat après une erreur (la bonne réponse est montrée). | Enfants plus jeunes que la joueuse, tâches de laboratoire : « recette préliminaire » selon les auteurs eux-mêmes. |
| *Journal of Intelligence* 2025, entrelacement de catégories : bénéfice chez des enfants de 9 ans, plus faible que chez les jeunes adultes. https://www.ncbi.nlm.nih.gov/pmc/articles/PMC12470837/ | Le mélange de jeux reste réservé à la mission « souvenirs » (3 questions de jeux différents) ; l'apprentissage normal ne change pas. | Enfants de 9 ans, catégories de roches : preuve mince pour le CP. |
| Deci, Koestner et Ryan 1999, *Psychological Bulletin* (128 études) : récompenses attendues et matérielles diminuent la motivation intrinsèque (d = −0,40 à −0,28), plus chez l'enfant ; le retour positif verbal l'augmente (d = 0,33). Résumé relu sur PubMed (PMID 10589297) ; PDF : https://depts.washington.edu/techdocs/papers/deciExtrinsicRewardsAndIntrinsicMotivation99.pdf | Aucune récompense matérielle annoncée pour les souvenirs : un retour verbal qui dit ce qu'elle a fait. | Le même travail note que le retour verbal agit moins chez l'enfant que chez l'étudiant. |

## Comportement attendu

Vocabulaire : un **item** est une question ratée sous forme rejouable ; la **file** est `state.review.items` ; **aujourd'hui** est la date locale `AAAA-MM-JJ` (même calcul que `todayKey`, `js/features/adaptive/skills.js:14-17`) ; une **séance** commence quand l'enfant touche « Jouer » sur l'écran titre (`js/app/init.js:74-105`).

### Phase 1 : garder les questions ratées (rien de visible)

1. Étant donné une partie en solo, hors défi bonus, hors mission « souvenirs », dans `math`, `calc`, `compare`, `clock` ou `reading`, quand l'enfant touche une mauvaise réponse, alors un item `{ k, p, t, due, box: 1, fails: 0, added }` entre dans la file avec `due` = aujourd'hui + 1, `t` = `gameDiff()`, `added` = aujourd'hui, et la partie est enregistrée.
2. Étant donné un item déjà dans la file (même clé `k`), quand la même question est ratée à nouveau en jeu normal, alors aucun doublon n'est créé : l'item repasse à `box: 1`, `due` = aujourd'hui + 1, `t` prend le palier du moment (`gameDiff()`), `fails` et `added` ne changent pas, et il garde sa place dans le tableau (table « Transitions d'un item »).
3. Étant donné une partie à plusieurs (`party.active` ou `race.active`), un défi bonus de Zap (`inBonusChallenge()`), un temps écoulé (`loseLife(null)`) ou un jeu hors de la liste, quand l'enfant se trompe, alors la file ne change pas.
4. Étant donné une file de 30 items, quand un nouvel item entre, alors l'item au `added` le plus ancien sort (le premier du tableau en cas d'égalité), et la file garde 30 items.
5. Étant donné une sauvegarde d'une version antérieure, quand elle se charge, alors `state.review` vaut `{ items: [], offered: null }`, `state.v` vaut `SAVE_VERSION`, et tout le reste est identique (le test holdout `test/holdout/sauvegardes.test.js` passe sans modification).
6. Étant donné une sauvegarde chargée ou importée dont `review` est absent, n'est pas un objet, ou contient des items invalides (voir « Surface d'attaque »), quand elle se charge, alors chaque item invalide est retiré, les doublons de clé aussi (le premier est gardé), la file est coupée à 30, `offered` invalide devient `null`, une date `due` après aujourd'hui + 7 devient aujourd'hui + 7, et le jeu ne lève aucune erreur.
7. Étant donné un item valide de chaque jeu, quand le jeu le rejoue (`render(p)`), alors la question affichée est exactement celle de l'item (mêmes nombres, même heure, même mot et même sens de lecture), et `setHintQuestion` reçoit une question équivalente (indices identiques à ceux d'une question tirée au hasard égale).
8. Étant donné chaque jeu de la liste, quand on appelle `item(q)` sur la question passée à `setHintQuestion`, puis `render(item)`, puis `item` sur la nouvelle question, alors on retrouve le même item (aller-retour).

### Phase 2 : la mission « souvenirs »

9. Étant donné une séance en solo, un prénom connu, pas de pause en cours (`emit('game:before', 'souvenirs')`, appelé **une seule fois**, juste avant d'ouvrir la proposition, ne renvoie aucun `true` ; voir « Ce que fait le démarrage »), `state.review.offered !== aujourd'hui`, au moins un item dû (`due <= aujourd'hui`), et aucune fenêtre ouverte, quand la chaîne de début de séance n'a rien montré d'autre, alors le compagnon principal propose la mission (fenêtre `#review-offer`), sa phrase est dite, et `offered` = aujourd'hui.
10. Étant donné la proposition, quand l'enfant touche « Plus tard » ou ferme la fenêtre, alors rien ne change dans la file, et la proposition ne revient pas avant demain.
11. Étant donné la proposition, quand l'enfant touche « On joue ! », alors `pickDue(state.review, aujourd'hui, 3)` choisit les items et leur ordre de passage (algorithme et exemples : section « `pickDue` pas à pas ») ; chaque question s'affiche avec son jeu et un badge `🌟 i/n`, après `setLastGame(g)` seulement (table « Ce que fait le démarrage »).
12. Étant donné une question de souvenirs, quand elle s'affiche, alors il n'y a ni minuteur, ni cœurs d'essais, et le bouton 💡 fonctionne.
13. Étant donné une question de souvenirs, quand l'enfant répond juste, alors l'item avance (`box` 1 → 3, `due` = aujourd'hui + 3 ; `box` 3 → 7, `due` = aujourd'hui + 7 ; `box` 7 → l'item sort de la file), et la question suivante (ou l'écran de fin) s'affiche `WIN_DELAY` après.
14. Étant donné une question de souvenirs, quand l'enfant se trompe, alors l'item repasse à `box: 1`, `due` = aujourd'hui + 1, `fails` + 1 ; si `fails` atteint 3, l'item sort de la file ; seule cette première réponse compte : tous les `button` de `#modal-body` (sauf `.btn-speak`) sont désactivés jusqu'à la question suivante, et toucher la bonne réponse pendant ce temps ne fait pas avancer l'item ; la bonne réponse brille (`hint-glow` sur le premier sélecteur de `gameSolution`) et la phrase « Regarde, c'était celle-ci. » est dite ; `REVIEW_SHOW_MS` (1500 ms) après l'erreur, on passe à la suite, sans reposer la même question. Cette ligne se teste sans explication. Si `erreurs-expliquees` est déjà livrée, voir « Ordre de livraison avec `erreurs-expliquees` » (ligne 14 bis).
15. Étant donné une mission « souvenirs », quand l'enfant fait sa 2ᵉ erreur, alors la bonne réponse est d'abord montrée comme à la ligne 14 (même verrou, même phrase), puis l'écran de fin remplace la question suivante `REVIEW_SHOW_MS` après cette erreur (`EXPLAIN_MS` dans le cas 2 de « Ordre de livraison ») ; les items non posés ne changent pas. Déroulé daté vérifié par S6 (3 items dus, T = instant de la 1ʳᵉ erreur) : T, erreur sur la question 1 ; T + 1500 ms, question 2 ; T2, erreur sur la question 2 ; T2 + 1500 ms, écran de fin ; la question 3 n'est jamais affichée et son item est identique avant et après.
16. Étant donné la fin de la mission, quand l'écran de fin s'ouvre, alors il dit la phrase de fin de la table, `emit('game:after', { win: true })` est appelé, et rien d'autre ne change : ni `coins`, ni `inventory`, ni `missions`, ni `skills` (hors compteur d'indices si l'enfant en demande, comme partout), ni `quests`, ni `gameCounts`, ni niveau adaptatif, ni défi bonus ; seuls changent `state.review` et le jeu courant en mémoire (`lastGame`, non enregistré). Le test vérifie ces champs avant et après, sans demander d'indice.
17. Étant donné une mission « souvenirs » en cours, quand la fenêtre se ferme (croix, Échap, pause), alors la mission s'arrête : les items dont `onRight` ou `onWrong` a déjà eu lieu gardent leur nouvel état ; celui de la question affichée ne change pas, même si l'enfant y avait répondu et que la fermeture tombe pendant `WIN_DELAY` (après une bonne réponse) ou `REVIEW_SHOW_MS` (après une erreur) ; les autres ne changent pas ; aucune question n'apparaît plus tard par-dessus un autre écran (table « Minuteries de la mission »).
18. Étant donné une partie à plusieurs, quand une séance commence, alors aucune proposition n'apparaît.
19. Étant donné une horloge simulée, quand on joue « rater le 1er, réussir le 2, réussir le 5, réussir le 12 », alors l'item est dû le 2, puis le 5, puis le 12, puis sort ; et « rater le 1er, rater en révision le 2 » le rend dû le 3.

## Ce qu'est un item (choisi d'après le code, jeu par jeu)

Les jeux tirent leurs questions au hasard (`js/shared/lib`), sans graine conservée : rejouer une graine imposerait de rejouer tous les tirages dans le même ordre, ce qui casse dès qu'un jeu change. On garde donc les **paramètres** de la question, et chaque jeu sait se rendre à partir d'eux. Les choix proposés (distracteurs), l'emoji et l'ordre des boutons sont tirés à nouveau : seul le cœur de la question revient.

| Jeu | `p` (paramètres) | Clé `k` | Bornes vérifiées au chargement | Tiré de |
|---|---|---|---|---|
| `math` | `{ g:'math', a, b, op }`, `op` `'+'` ou `'-'` | `math:{a}{op}{b}` | entiers ; `+` : a, b ≥ 1, a + b ≤ 30 ; `-` : 1 ≤ b < a ≤ 30 | `math.js:28-45` (`op` affiché `−`) |
| `calc` | `{ g:'calc', first, ops:[{ s, n }] }` (1 ou 2 opérations, `s` `'+'` ou `'-'`) ou `{ g:'calc', mult:{ a, b } }` | `calc:{first}{s}{n}…` ou `calc:{a}x{b}` | entiers ; chaque résultat intermédiaire entre 0 et 100 ; 1 ≤ first, n ≤ 100 ; `a` dans 2, 5, 10 et 1 ≤ b ≤ 10 | `calc.js:27-61` |
| `compare` | `{ g:'compare', a, b }` | `compare:{a}-{b}` | entiers, 1 à 100 | `compare.js:29-44` |
| `clock` | `{ g:'clock', h, m }` | `clock:{h}-{m}` | h entier de 1 à 12 ; m dans 0, 15, 30, 45 | `clock.js:68-74` |
| `reading` | `{ g:'reading', w, img }` (`img` : vrai si l'enfant voit le mot et choisit l'image) | `reading:{w}-{1 ou 0}` | `w` est un `word` de `WORDS_CP` ; `img` booléen | `reading.js:38-50` |

- **Passage de la question du jeu à `p`** (`item(q)`) : `calc` donne `q.ops[i].sign` en `−` (U+2212, `calc.js:48-57`) ; `item` le convertit en `-` ASCII dans `p.ops[i].s` (et `render(p)` le reconvertit en `−` pour l'affichage) ; de même, `math` donne `op` en `−` (U+2212), que `item` convertit en `-` ASCII dans `p.op`. `reading` donne `q.wordToImage` (`reading.js:74`) ; `item` le copie dans `p.img`, et `q.correct.word` dans `p.w`.
- **Fonction de clé `reviewKey(p)`**, exacte au caractère près (nombres en chiffres décimaux sans zéro devant ni espace ; signes ASCII `+`, `-`, `x` ; aucun autre caractère) :

| Jeu | `reviewKey(p)` | Exemples (paramètres → clé) |
|---|---|---|
| `math` | `'math:' + a + op + b` | `{ g:'math', a:7, b:5, op:'+' }` → `math:7+5` ; `{ g:'math', a:9, b:4, op:'-' }` → `math:9-4` |
| `calc`, opérations | `'calc:' + first` puis, pour chaque opération dans l'ordre, `s + n` | une opération `{ g:'calc', first:23, ops:[{ s:'+', n:14 }] }` → `calc:23+14` ; deux opérations `{ g:'calc', first:40, ops:[{ s:'-', n:12 }, { s:'+', n:7 }] }` → `calc:40-12+7` |
| `calc`, multiplication | `'calc:' + a + 'x' + b` | `{ g:'calc', mult:{ a:5, b:3 } }` → `calc:5x3` ; `{ g:'calc', mult:{ a:10, b:10 } }` → `calc:10x10` |
| `compare` | `'compare:' + a + '-' + b` | `{ g:'compare', a:42, b:47 }` → `compare:42-47` ; `{ g:'compare', a:8, b:8 }` → `compare:8-8` |
| `clock` | `'clock:' + h + '-' + m` | `{ g:'clock', h:3, m:30 }` → `clock:3-30` ; `{ g:'clock', h:12, m:0 }` → `clock:12-0` |
| `reading` | `'reading:' + w + '-' + (img ? '1' : '0')` | `{ g:'reading', w:'chat', img:true }` → `reading:chat-1` ; `{ g:'reading', w:'cheval', img:false }` → `reading:cheval-0` |

  Pas d'ambiguïté : chaque nombre est suivi d'un signe ou de la fin de la chaîne, et `p` est validé avant (`validParams`), donc deux `p` valides différents donnent deux clés différentes. Les clés de la colonne « Clé `k` » ci-dessus sont des abrégés de ces fonctions.
- `t` (palier joué, entier de 1 à 6) est gardé pour l'espace parents futur et les tests ; le rendu utilise le palier du moment (`gameDiff()`) pour tout ce qui n'est pas dans `p` (nombre de choix, minutes possibles des distracteurs).
- Contrat d'un jeu : `registerReplay(clé, { item: (q) => p ou null, render: (p) => void })`, dans la slice `review` (feature). `item` reçoit l'objet passé à `setHintQuestion` ; `render(p)` appelle la fonction de rendu du jeu avec `p` (`renderMath(p)` : si `p && p.g === 'math'`, la question vient de `p`, sinon elle est tirée comme aujourd'hui). Les appels existants sans argument (`registerGame`, `onRetry`) ne changent pas.
- Les autres jeux n'ont pas de `registerReplay` en phase 1 et 2 : leurs erreurs ne sont pas gardées. Un jeu s'ajoute plus tard en écrivant son contrat et sa ligne de la table (hors périmètre).

## Transitions d'un item

Exemple : la question `7 + 5` de `math`, ratée le 2026-11-20 au palier 2, puis jouée au palier 3. Chaque ligne donne l'item complet avant et après ; `{T}` est le jour de l'événement.

| Transition | Avant | Après |
|---|---|---|
| Ajout (raté en jeu, absent de la file), le 2026-11-20, palier 2 | (absent) | `{ k:'math:7+5', p:{ g:'math', a:7, b:5, op:'+' }, t:2, due:'2026-11-21', box:1, fails:0, added:'2026-11-20' }` |
| Raté de nouveau en jeu, le 2026-11-24, palier 3 (ligne 2) | `{ k:'math:7+5', p:…, t:2, due:'2026-11-27', box:3, fails:0, added:'2026-11-20' }` | `{ k:'math:7+5', p:…, t:3, due:'2026-11-25', box:1, fails:0, added:'2026-11-20' }` (même place dans le tableau) |
| Réussite en révision, `box` 1, le 2026-11-21 | `{ …, t:2, due:'2026-11-21', box:1, fails:0, added:'2026-11-20' }` | `{ …, t:2, due:'2026-11-24', box:3, fails:0, added:'2026-11-20' }` |
| Réussite en révision, `box` 3, le 2026-11-24 | `{ …, due:'2026-11-24', box:3, fails:0 }` | `{ …, due:'2026-12-01', box:7, fails:0 }` (`t`, `k`, `p`, `added` inchangés) |
| Réussite en révision, `box` 7, le 2026-12-01 | `{ …, due:'2026-12-01', box:7 }` | (sorti de la file) |
| Échec en révision, `fails` 0 ou 1, le 2026-11-24 | `{ …, t:2, due:'2026-11-24', box:3, fails:0, added:'2026-11-20' }` | `{ …, t:2, due:'2026-11-25', box:1, fails:1, added:'2026-11-20' }` |
| Échec en révision avec `fails` 2 | `{ …, box:1, fails:2 }` | (sorti de la file) |
| File pleine (30) et nouvel ajout | l'item au `added` le plus ancien (le premier du tableau à égalité) | (sorti de la file) ; le nouvel item est ajouté en fin de tableau |

En révision, `t` ne change jamais (la question est rejouée telle quelle) ; seul un nouvel échec en jeu normal le met à jour.

## Échéancier

| État | Réussite | Erreur |
|---|---|---|
| raté en jeu (entrée) : `box 1`, dû J+1 | `box 3`, dû 3 jours après la révision | reste `box 1`, dû le lendemain, `fails` + 1 |
| `box 3` | `box 7`, dû 7 jours après la révision | `box 1`, dû le lendemain, `fails` + 1 |
| `box 7` | sort de la file | `box 1`, dû le lendemain, `fails` + 1 |

Lecture du brief (« J+1, J+3, J+7, sorti après 2 réussites espacées ») : la révision du lendemain sert à revenir sur l'erreur ; les deux réussites **espacées** sont celles de 3 et 7 jours. Les délais comptent à partir du jour de la révision réelle (si l'enfant ne joue pas pendant 10 jours, les items attendent, sans se cumuler). `fails` atteint 3 : l'item sort (la question est trop difficile pour l'instant : le niveau adaptatif du jeu s'en charge déjà, `js/features/adaptive/adaptive.js:150-162`). Un même item n'est jamais revu deux fois le même jour.

## Textes

| Moment | Texte affiché (et dit) |
|---|---|
| Titre de la proposition | `🌟 Les souvenirs` |
| Proposition, 1, 2 ou 3 questions (`{Nom du compagnon}` : `COMPANIONS[currentCompanion()].name`, repli `Ton compagnon` si `COMPANIONS[currentCompanion()]` est absent, comme `js/features/seasons/seasons.js:205-207` ; tête : `buddySlot('happy', 'buddy-big')`, qui dessine le compagnon courant ou celui par défaut, `js/entities/companion/companions.js:465-468` (`companionOf`), `:481-483` (`currentCompanion`), `:523-526` (`buddySlot`)) | `{Nom du compagnon} : J'ai un souvenir pour toi. On joue ensemble ?` ; `… deux souvenirs …` ; `… trois souvenirs …` (dit sans le nom : `J'ai trois souvenirs pour toi. On joue ensemble ?`) |
| Boutons | `🌟 On joue !` ; `Plus tard` |
| Badge d'une question | `🌟 {i}/{n}` (`aria-label` : `Souvenir {i} sur {n}`) |
| Erreur en révision (branche de repli, toujours codée par cette track) | `Regarde, c'était celle-ci.` |
| Fin, tout juste | `Bravo, ta mémoire a bien travaillé !` |
| Fin, au moins une juste | `Bravo, tu t'en es souvenu ! On garde les autres pour bientôt.` (`souvenu` accordé par `ac('souvenu', 'souvenue')`) |
| Fin, aucune juste | `Merci d'avoir joué avec moi ! On en reparle bientôt.` |
| Bouton de fin | `Super !` |

Jamais « erreur », « raté », « faux », « tes erreurs » dans ces textes. Le nom de la mission est « souvenirs ».

## `pickDue` pas à pas

`pickDue(rv, today, max)` est pure, ne modifie pas `rv`, et renvoie un nouveau tableau d'items (au plus `max`).

1. **Candidats** : les items de `rv.items` dont `due <= today` (comparaison de chaînes `AAAA-MM-JJ`), dans l'ordre du tableau.
2. **Tri par retard** : tri stable par `due` croissant ; deux items de même `due` gardent l'ordre du tableau.
3. **Passe 1 (jeux différents)** : parcourir la liste triée ; prendre un item si aucun item déjà pris n'a le même `p.g` ; s'arrêter à `max`.
4. **Passe 2 (compléter)** : si moins de `max`, reparcourir la liste triée et prendre les items pas encore pris, dans l'ordre, jusqu'à `max`.
5. **Ordre de passage** : tri stable des items pris par `box` décroissant ; à égalité, l'ordre de prise (passe 1, puis passe 2) est gardé.

Le tri stable s'écrit sans `toSorted` (interdit, `AGENTS.md`) : copie puis `.sort()` avec l'indice d'origine en départage.

Exemple 1 (repris par le test), `today = '2026-11-22'`, `max = 3`, `items` dans cet ordre :

| Item | `p.g` | `box` | `due` |
|---|---|---|---|
| A | `math` | 1 | `2026-11-20` |
| B | `math` | 3 | `2026-11-19` |
| C | `clock` | 1 | `2026-11-21` |
| D | `compare` | 7 | `2026-11-22` |
| E | `reading` | 1 | `2026-11-23` |
| F | `calc` | 3 | `2026-11-21` |

Candidats : A, B, C, D, F (E pas encore dû). Tri par retard : B, A, C, F, D (C avant F : même date, ordre du tableau). Passe 1 : B (`math`), A refusé (`math` déjà pris), C (`clock`), F (`calc`) : 3 pris, fin. Ordre de passage (`box` décroissant, stable) : **B, F, C**.

Exemple 2 (passe 2), même `today` et `max`, `items` : X (`math`, box 1, `2026-11-20`), Y (`math`, box 3, `2026-11-21`), Z (`math`, box 1, `2026-11-19`), W (`math`, box 7, `2026-11-22`). Tri : Z, X, Y, W. Passe 1 : Z. Passe 2 : X, Y. Ordre de passage : **Y, Z, X**.

Exemple 3 : aucun item dû : `[]` (pas de proposition, ligne 9).

## Effets de `loseLife` en mode manche

Un effet par ligne (`loseLife`, `engine.js:116-185`). « Gardé » : comme en jeu normal ; « coupé » : pas fait en mode manche.

| Effet | Mode manche | Pourquoi |
|---|---|---|
| `buddyReact('oops', 1300)` | gardé | Visage seulement, aucune parole |
| `hintNudge(true)` | **coupé** | Il appelle `hintPolicy.onError`, qui peut faire parler Grisou par-dessus « Regarde, c'était celle-ci. » ; la question est remplacée, le bouton 💡 n'a pas à briller |
| retour si `party.active` | sans objet | Pas de mode manche à plusieurs (D15) |
| `noteAnswerError()` | **coupé** | D18 : la révision ne touche pas aux progrès |
| `emit('answer:wrong')` | **coupé** | D18 : pas de nouvel ajout pendant la révision |
| `playSound('wrong')` | gardé | Son court, pas une parole |
| `vibrate(90)` | gardé | |
| `speakWrongHint()` | **coupé** | Une seule phrase dite : « Regarde, c'était celle-ci. » (sinon le test serait aléatoire, 70 %) |
| `shakeEl(el)`, `ko-flash` | gardés | Retour visuel sur le bouton touché |
| désactivation du bouton touché | gardée | Puis tous les boutons (verrou, ligne 14) |
| réactivation à 700 ms | **coupée** | Seule la première réponse compte |
| `lives--`, `renderLives`, `flashModal('ko')`, `showToast`, `onMissionFail` | sans objet | Essais illimités en mode manche |
| `scheduleRetry(onRetry)` | **coupé** | Remplacé par `onWrong` après `REVIEW_SHOW_MS` |
| bonne réponse qui brille et phrase « Regarde, c'était celle-ci. » | **ajouté** | Ligne 14 |

## Minuteries de la mission « souvenirs »

Chaque minuterie que la mission déclenche ou hérite du moteur, et ce qui l'annule à la fermeture :

| Minuterie | Posée par | Annulée par |
|---|---|---|
| `winSoon` en mode manche : `onRight` après `WIN_DELAY` (aujourd'hui `setTimeout(onMissionWin, …)` sans garde, `engine.js:431-433`) | moteur | le moteur garde ce `setTimeout` dans `pendingRoundTimer` et son `onModalChange` (`engine.js:557-560`) l'annule ; en plus, `onRight` et `onWrong` ne font rien si la mission est arrêtée (`setRoundHandlers(null)` déjà appelé) |
| `onWrong` après `REVIEW_SHOW_MS` (ou `EXPLAIN_MS`, cas 2) | moteur | même `pendingRoundTimer`, même annulation, même garde |
| bonne réponse qui brille (`hint-glow`) | moteur | aucune minuterie : la classe disparaît avec la fenêtre |
| proposition du bouton 💡 après 10 s | `hints` (existant) | `onModalChange` de `hints` (`hints.js:424-429`) |
| la voix (`speak`) | toutes | `closeModal` coupe la synthèse (`js/shared/ui/modal.js`, `closeModal`) |
| la pause 2,5 s après `game:after` | `rest` | voulue : seulement à la fin normale |

À la fermeture (`onModalClose`), la feature `review` appelle `setRoundHandlers(null)` et oublie la mission en cours. Un autre écran ouvert par-dessus la mission sans la fermer (un `openModal`) ne déclenche pas `onModalClose` : c'est pourquoi `playGame` (`engine.js`, au début de la fonction) appelle aussi `setRoundHandlers(null)` et oublie `pendingRoundTimer` ; un jeu normal lancé après une mission abandonnée n'est donc jamais en mode manche. La feature `review` ne passe pas par `playGame` (elle appelle `render(p)` du jeu), elle n'est pas touchée. Test (S7) : mission ouverte, puis `playGame('count')` au palier 3 par-dessus, sans fermer : le jeu a ses cœurs (`#lives-bar`) et son minuteur (`#challenge-timer`), et une erreur relance une autre question comme d'habitude. Le test de la ligne 17 (S7) ferme la fenêtre pendant `WIN_DELAY` après une bonne réponse, puis pendant `REVIEW_SHOW_MS` après une erreur, attend deux fois ce délai, et vérifie : aucune fenêtre ouverte, item de la question inchangé.

## Ce que fait le démarrage d'une question « souvenirs » (comparé à `playGame`, `engine.js:347-358`)

| Appel de `playGame` | Souvenirs | Pourquoi |
|---|---|---|
| `emit('game:before', key)` | **Une fois**, `emit('game:before', 'souvenirs')` juste avant d'ouvrir la proposition ; si un écouteur renvoie `true`, pas de proposition (la pause montre son voile). Jamais à chaque question. | `rest.js:562-569` met `inMission = true` et montre le voile si la pause est due. « Plus tard » ou la fermeture appellent `closeModal`, dont `onModalClose` remet `inMission = false` (`rest.js:575-578`). La fin normale de la mission appelle **une fois** `emit('game:after', { win: true })` (`rest.js:571-574` : la pause peut venir 2,5 s après) ; un abandon n'émet rien (`onModalClose` suffit). |
| `bonusOnNewGame()` | non | En début de séance, aucun défi bonus n'est en cours ; la révision ne doit pas consommer celui qu'on pourrait lancer ensuite (`session.js:29-34`). |
| `hintPolicy.onMission(key)` | non | Ce n'est pas une mission de jeu ; Grisou compte les erreurs comme ailleurs (`specialties.js:169-171`). |
| `resetMissionErrors()` | non | En mode manche, `noteAnswerError` n'est jamais appelé (D18) : rien à remettre à zéro, et `recordMission` n'est pas appelé. |
| `trackGamePlayed(key)` | non | `gameCounts` sert à proposer les jeux les moins joués ; une révision n'est pas une partie (`trackGamePlayed`, `state.js`). |
| `setLastGame(key)` | **oui**, avant chaque question, avec `p.g` | `gameDiff()` lit le jeu courant (D19). |
| `gameSolution = null` puis le rendu | **oui** : `render(p)` du jeu (qui appelle `setSolution`) | Le mode manche lit `gameSolution` pour la bonne réponse. |

## Ordre de livraison avec `erreurs-expliquees`

Aucune des deux tracks ne teste à l'exécution si l'autre existe (un import ES d'un export absent casse le module). La track livrée **en second** fait le câblage ; la même règle est écrite en miroir dans [la spec d'erreurs-expliquees](../erreurs-expliquees_20261122/spec.md).

- **Cas 1 : `erreurs-expliquees` n'est pas livrée sur `main` quand cette track est implémentée.** Cette track ne code que la branche de repli (ligne 14), sans aucun import ni appel de `explainShow`, `EXPLAIN_MS` ou `explainClear`. Rien d'autre à faire : `erreurs-expliquees` fera le câblage à sa livraison.
- **Cas 2 : `erreurs-expliquees` est déjà livrée (le moteur exporte `EXPLAIN_MS` et importe `explainShow` de `hints`).** Dans la branche manche de `loseLife` : `const shown = el !== null && opts.wrong !== undefined && explainShow(opts.wrong)` ; si `shown`, pas de `hint-glow` de repli ni de phrase de repli, `onWrong` est appelé `EXPLAIN_MS` après l'erreur ; sinon, la branche de repli. Ligne 14 bis à tester en plus :
  14 bis. Étant donné une question de souvenirs d'un jeu qui a ses explications (`math`), quand l'enfant se trompe, alors `.explain-bubble` s'affiche, « Regarde, c'était celle-ci. » n'est pas dite, et la question suivante arrive `EXPLAIN_MS` après l'erreur ; pour un jeu encore exempté (`reading` tant que sa phase n'est pas livrée), la ligne 14 s'applique.

## Décisions

| Id | Décision | Pourquoi | Source |
|---|---|---|---|
| D1 | Un item garde les paramètres de la question, pas une graine | Le hasard passe par `random()` sans graine conservée par question ; les jeux de la liste ont des paramètres simples et bornés | `js/shared/lib/random.js:1-9` (aucune graine gardée par question) ; `math.js:28-45`, `calc.js:27-61`, `compare.js:29-44`, `clock.js:68-74`, `reading.js:38-50` |
| D2 | Première phase limitée à `math`, `calc`, `compare`, `clock`, `reading` | Une question tient en 2 à 4 nombres ou un mot ; les autres jeux ont des questions à plusieurs étapes ou des dessins tirés au hasard | brief du parent ; `share.js:139-183`, `ladybugs.js:51-56` |
| D3 | La question ratée est lue sur la question des indices (`currentHintQuestion()` exporté de `hints`), au moment de `loseLife` | Chaque jeu passe déjà sa question à `setHintQuestion` après `openModal` ; le moteur importe déjà `hints` | `hints.js:185-199` ; `engine.js:43` ; `count.js:48`, `math.js:90`, `calc.js:91`, `compare.js:61`, `clock.js:97`, `reading.js:74` |
| D4 | Le moteur émet `emit('answer:wrong', { kind, q })` ; la slice `review` écoute | Le moteur est sous `review` dans le manifeste : un événement évite le cycle | `AGENTS.md` (événements) ; `js/shared/lib/events.js:48-58` |
| D5 | Nouveau champ `state.review = { items, offered }`, pas dans `state.skills` | Le test holdout compare `skills` avant et après chargement : on n'y touche pas | `test/holdout/sauvegardes.test.js:62-63` |
| D6 | `SAVE_VERSION` passe à la version suivante au moment de la livraison, `migrate()` ajoute `review`. Règle commune : la PR qui augmente `SAVE_VERSION` met à jour la valeur attendue de l'assertion `ev('SAVE_VERSION') === 9` de `test/licornes.test.js:499` au nouveau numéro (même force : ce n'est pas un affaiblissement) ; les nouveaux tests de migration lisent la constante `SAVE_VERSION`, sans numéro en dur | Règle de sauvegarde du projet ; la PR casserait sinon un test existant | `js/entities/game-state/state.js` (`SAVE_VERSION`, `migrate`) ; `AGENTS.md` (Interdits) ; `test/licornes.test.js:499` |
| D21 | Types stricts (tout `js/` est vérifié en strict par `bun run typecheck`) : l'entité `review-queue` déclare ses `@typedef` et chaque fonction a `@param` et `@returns` ; `GameState` (`state.js`) gagne le champ `review: ReviewState`, importé par `/** @typedef {import('../review/index.js').ReviewState} ReviewState */` ; comme `js/entities/game-state/index.js:3-5`, `js/entities/review/index.js` redéclare ses types pour les autres slices : `/** @typedef {import('./review.js').ReviewState} ReviewState */`, `/** @typedef {import('./review.js').ReviewItem} ReviewItem */`, `/** @typedef {import('./review.js').ReviewParams} ReviewParams */` ; `DEFAULT_STATE` (seule liste des champs depuis que `state` est fabriqué par `freshState()`) gagne `review: { items: [], offered: null }`. Jamais `any` ni `@ts-ignore` | `strict: true` couvre tout `js/` ; un champ absent de `DEFAULT_STATE` se perd au redémarrage | `tsconfig.json` ; `js/entities/game-state/state.js` (`@typedef GameState`, `DEFAULT_STATE`, `let state = freshState()`, `readSave`) ; `test/redemarrage.test.js` ; `conductor/checklist-mini-jeu.md` (règle des types stricts) |
| D22 | Types consommés et nouveau code hors `js/entities` (tout est vérifié en strict) : `hints` exporte `currentHintQuestion(): { kind: string \| null, q: unknown }` ; `setLastGame(key: string \| null)` et `todayKey` sont déjà typés (`js/features/adaptive/session.js:8-9`, `skills.js:14-17`). Le nouveau code de la feature `review` et le code ajouté au moteur sont vérifiés en strict par `bun run typecheck` : `registerReplay<P extends ReviewParams>(key: string, r: { item: (q: unknown) => P \| null, render: (p: P) => void }): void` ; `setRoundHandlers(h: { onRight: () => void, onWrong: () => void } \| null): void` ; `maybeOfferReview(): boolean` ; l'événement `answer:wrong` porte `{ kind: string, q: unknown }` ; chaque `item(q)` d'un jeu vérifie la forme de `q` avant de lire ses champs. Jamais `any` ni `@ts-ignore` | `strict: true` couvre tout `js/` depuis la v66.11 | `tsconfig.json` ; `conductor/checklist-mini-jeu.md` (section 3) |
| D7 | La validation de la file est une fonction pure `sanitizeReview(raw, today)` de l'entité `review-queue`, appelée **dans `readSave()`**, sur le modèle de `cleanSkills` et `cleanRestLog` : après `freshState`, `st.review = sanitizeReview(st.review, dayKey(new Date()))`. Règle holdout : `review` a une valeur par défaut dans `freshState` (`DEFAULT_STATE`), donc une partie sans `review` en reçoit une ; `migrate()` reste le seul endroit où une version ajoute le champ | `readSave()` est la seule porte de lecture : partie jouée (`load()` l'appelle), import (`applyBackup` puis `load`), et autres joueurs dans l'espace parents (`profileState`, `parents.js`) | `readSave`, `cleanSkills`, `cleanRestLog` et `load` dans `js/entities/game-state/state.js` ; `test/parties-importees.test.js` (modèle des tests de parties abîmées) ; `js/features/backup/backup.js:176-195` |
| D8 | Le jour est la date **locale** (comme `todayKey` et la pause), pas UTC | Les quêtes utilisent `toISOString` (UTC) et changeraient de jour à 1 h du matin en hiver ; la pause et les progrès utilisent la date locale | `skills.js:14-17` ; `rest.js:508-511` ; `quests.js:71-74` |
| D9 | Échéancier 1, 3, 7 jours, sortie après les réussites à 3 et 7 jours, retour à 1 jour après une erreur | Lecture du brief ; espacement croissant | brief ; https://pmc.ncbi.nlm.nih.gov/articles/PMC12189222/ |
| D10 | File de 30 items, l'ajout le plus ancien sort quand elle est pleine ; un item sort après 3 erreurs de révision | Borne la sauvegarde et l'import ; évite qu'une question trop dure revienne sans fin | défaut du rédacteur, à juger à la revue |
| D11 | Mission de 3 questions au plus, de jeux différents d'abord, les mieux sues d'abord, arrêt après 2 erreurs | Taux de réussite visé élevé ; entrelacement réservé à la révision | brief ; https://www.ncbi.nlm.nih.gov/pmc/articles/PMC12470837/ |
| D12 | Toujours un retour immédiat après une erreur en révision : la bonne réponse brille et une phrase la désigne ; l'explication détaillée ne s'ajoute que selon « Ordre de livraison » | Chez les petits, l'effet du rappel dépend du retour immédiat ; aucune dépendance à une track non livrée | https://www.ncbi.nlm.nih.gov/pmc/articles/PMC6110808/ |
| D13 | Aucune récompense matérielle ; la mission ne compte ni comme mission, ni pour le niveau du jeu, ni pour les quêtes | Les récompenses attendues et matérielles diminuent la motivation, plus chez l'enfant ; le retour verbal l'augmente ; une révision à un palier inférieur fausserait le niveau adaptatif | PubMed 10589297 (Deci et al. 1999) ; `skills.js:37-74` |
| D14 | Proposée par le compagnon principal (`currentCompanion()`), une fois par jour au plus, en dernier dans la chaîne de début de séance | Pas de nouvelle voix à présenter ; ne passe jamais avant le cadeau de saison, l'ouverture d'une saison ou l'équipe | `init.js:97-102` (la chaîne est dans un `setTimeout(…, 700)`, ligne 101) ; `team.js:453-457`, `:253-261` |
| D15 | Pas de révision à plusieurs | Défaut du brief ; une erreur à plusieurs n'est pas comptée non plus pour les progrès | brief ; `skills.js:39-45` |
| D16 | Pas de capture pendant le défi bonus de Zap | Joué un cran au-dessus ; déjà exclu des progrès | `skills.js:56-62` ; `specialties.js:18-20` |
| D17 | Un temps écoulé n'est pas une question ratée | Rien de faux n'a été touché ; le minuteur n'existe qu'à partir du palier 3 | `engine.js:249-259` ; `difficulty.js` (`TIMER_SECONDS`) |
| D18 | Le moteur reçoit un mode « manche » : `setRoundHandlers({ onRight, onWrong } ou null)` ; tant qu'il est actif : pas de cœurs, pas de minuteur, `winSoon` appelle `onRight`, `playGame` l'éteint au début (`setRoundHandlers(null)`, voir « Minuteries de la mission »), `loseLife` fait les effets de la table « Effets de `loseLife` en mode manche » (dont `speakWrongHint` et `hintNudge` coupés), désactive tous les `button` de `#modal-body` sauf `.btn-speak` (seule la première réponse compte), montre la bonne réponse (`hint-glow` sur le premier sélecteur de `gameSolution`, la phrase de la table dite) puis appelle `onWrong` après `REVIEW_SHOW_MS` (minuterie du moteur, annulée par son `onModalChange`), sans `onRetry`, sans `noteAnswerError`, sans `answer:wrong` | Les jeux restent inchangés pour gagner et perdre ; le moteur ne connaît pas la file | `engine.js:66-69`, `:112-169`, `:196-229`, `:385-389` |
| D19 | `setLastGame(g)` avant chaque question de souvenirs, et aucun autre appel de `playGame` (table « Ce que fait le démarrage ») | `gameDiff()` lit le jeu courant pour le palier adaptatif (nombre de choix) | `js/features/adaptive/game-diff.js:44-55` |
| D20 | Deux slices aux identifiants uniques : `review-queue` (couche `entities`, `files: ['js/entities/review/review.js']`, `css: []`), placée après `words` et avant `game-state` ; `review` (couche `features`, `files: ['js/features/review/review.js']`, `css: ['js/features/review/review.css']`), placée après `minigame-engine` et avant `minigame-memory`. `js/features/review/review.css` est aussi ajoutée à `CSS_ORDER`, en fin de liste, avant `js/features/island/island.css` | `sanitizeReview` vérifie les mots de `WORDS_CP` ; les jeux importent `registerReplay` ; le test exige des identifiants uniques et un dossier par slice ; règle de la checklist pour le CSS | `js/slices.cjs:68-70`, `:182-193`, la liste `CSS_ORDER` et sa ligne `js/features/island/island.css` ; `test/slices.test.js:41-50` ; `conductor/checklist-mini-jeu.md` (section 2) |

## Politiques

- **Arbitrages** : la pause gagne toujours (pas de proposition si `emit('game:before', 'souvenirs')` renvoie `true`, et la mission se termine par `emit('game:after')` pour que la pause puisse venir) ; le cadeau de saison, l'ouverture de saison et l'équipe passent avant (une seule chose en début de séance) ; une track qui ajoute un écran de début de séance (ex. `saison3-ouverture`) le place avant la proposition, qui reste la dernière ; si la mission est ouverte, une question ratée en jeu normal le même jour entre dans la file pour demain, jamais dans la mission en cours.
- **Défauts** : constantes `REVIEW_MAX = 30`, `REVIEW_STEPS = [1, 3, 7]`, `REVIEW_SESSION = 3`, `REVIEW_STOP_AFTER = 2` erreurs, `REVIEW_FAILS_OUT = 3`, `REVIEW_SHOW_MS = 1500` ; aucun réglage parent ; aucune dépendance ; une erreur de lecture de la file la vide (jamais d'exception au chargement).
- **Référence visuelle** : la proposition reprend la fenêtre de rencontre d'un compagnon (`openTeamEncounter`, `js/features/companion-team/team.js:277`) : tête du compagnon, bulle de texte, deux boutons `.btn-primary` et `.btn-ghost`. L'écran de fin reprend `.reward-box` de l'écran de victoire (`engine.js:500-526`) sans objet ni confettis. Le badge `🌟 i/n` est une pastille dans `.game-head`, à droite du titre.
- **Détails non écrits** : l'agent prend l'option la plus simple, la note dans le journal de décisions du plan, l'humain juge à la revue.

## Hors périmètre

- Les autres jeux (contrat `registerReplay` à écrire jeu par jeu, plus tard).
- Une carte « souvenirs » dans l'espace parents (track `bilan-parents` si elle le souhaite : `state.review` est lisible).
- Un réglage parent pour couper la révision.
- La révision à plusieurs.
- Les explications elles-mêmes (track `erreurs-expliquees`) ; leur câblage dans la révision suit « Ordre de livraison avec `erreurs-expliquees` ».

## Contrats partagés

| Contrat | Forme (ou lien) | Propriétaire | Consommateurs |
|---|---|---|---|
| `state.review` | `{ items: [{ k, p, t, due, box, fails, added }], offered: 'AAAA-MM-JJ' ou null }` | entité `game-state` (forme), entité `review` (validation) | feature `review` ; espace parents futur |
| Types de l'entité `review-queue` (strict) | `/** @typedef {{ g: 'math', a: number, b: number, op: '+' \| '-' }} MathParams */` ; `/** @typedef {{ g: 'calc', first: number, ops: Array<{ s: '+' \| '-', n: number }> } \| { g: 'calc', mult: { a: 2 \| 5 \| 10, b: number } }} CalcParams */` ; `/** @typedef {{ g: 'compare', a: number, b: number }} CompareParams */` ; `/** @typedef {{ g: 'clock', h: number, m: 0 \| 15 \| 30 \| 45 }} ClockParams */` ; `/** @typedef {{ g: 'reading', w: string, img: boolean }} ReadingParams */` ; `/** @typedef {MathParams \| CalcParams \| CompareParams \| ClockParams \| ReadingParams} ReviewParams */` ; `/** @typedef {{ k: string, p: ReviewParams, t: number, due: string, box: 1 \| 3 \| 7, fails: number, added: string }} ReviewItem */` ; `/** @typedef {{ items: ReviewItem[], offered: string \| null }} ReviewState */` | entité `review-queue` | `GameState`, feature `review`, tests |
| Signatures (strict) | `dayKey(date: Date): string` ; `addDays(key: string, n: number): string` ; `reviewKey(p: ReviewParams): string` ; `validParams(p: unknown): p is ReviewParams` (`@returns {p is ReviewParams}`) ; `sanitizeReview(raw: unknown, today: string): ReviewState` ; `addMiss(rv: ReviewState, p: ReviewParams, attempt: { t: number, today: string }): ReviewState` ; `reviewAnswer(rv: ReviewState, k: string, answer: { ok: boolean, today: string }): ReviewState` ; `pickDue(rv: ReviewState, today: string, max: number): ReviewItem[]`. Les fonctions qui renvoient une `ReviewState` renvoient un nouvel objet et ne modifient pas `rv` | entité `review-queue` | idem |
| `GameState.review` | `review: ReviewState` ajouté au `@typedef GameState` (`state.js`) ; valeur par défaut dans `DEFAULT_STATE` | entité `game-state` | tous |
| Entité `review-queue` (`js/entities/review/`) | `REVIEW_MAX`, `REVIEW_STEPS`, `dayKey(date)`, `addDays(key, n)`, `reviewKey(p)`, `validParams(p)`, `sanitizeReview(raw, today)`, `addMiss(rv, p, { t, today })`, `reviewAnswer(rv, k, { ok, today })`, `pickDue(rv, today, max)` : fonctions pures | entité `review` | `game-state`, feature `review`, tests |
| `registerReplay(clé, { item, render })` | section « Ce qu'est un item » | feature `review` | `math`, `calc`, `compare`, `clock`, `reading` |
| `emit('answer:wrong', { kind, q })` | émis par `loseLife` en solo, hors manche, avec un élément touché | `minigame-engine` | feature `review` |
| `setRoundHandlers(h)` | D18 | `minigame-engine` | feature `review` |
| `currentHintQuestion()` | `{ kind, q }` de la question affichée | `hints` | moteur |
| `maybeOfferReview()` | renvoie `true` si la proposition s'affiche | feature `review` | `js/app/init.js` |

## Surface d'attaque

| Entrée | Données ou appelant | Limites et vérifications | Peut atteindre | Jamais |
|---|---|---|---|---|
| `state.review` d'une partie enregistrée ou d'une sauvegarde importée (`applyBackup` puis `load`, puis `readSave`), ou lue par l'espace parents pour un autre joueur (`profileState`, puis `readSave`) | JSON non fiable | `sanitizeReview` : objet sinon `{ items: [], offered: null }` ; `items` tableau sinon `[]` ; au plus 30 items gardés (les premiers valides) ; par item : `p` passe `validParams` (table des bornes), `k === reviewKey(p)`, `t` entier de 1 à 6, `due` et `added` au format `AAAA-MM-JJ` et dates réelles, `box` dans 1, 3, 7, `fails` entier de 0 à 2 ; champs inconnus retirés ; doublons de `k` retirés ; `due` après aujourd'hui + 7 ramené à aujourd'hui + 7 ; `offered` date valide sinon `null` | la file et ses dates | du HTML : aucun texte de l'item n'est inséré, sauf `w`, accepté seulement s'il est un mot de `WORDS_CP` ; une boucle sans fin ; une file de plus de 30 items |

## Zones sensibles touchées

- Sauvegarde et migration (`js/entities/game-state/state.js`) : nouveau champ, `SAVE_VERSION`, `migrate()`. Relecture humaine obligatoire.
- Import de sauvegarde (`js/features/backup/`) : non modifié, mais ses données passent par la nouvelle validation. Relecture humaine obligatoire.
- Garde d'architecture : deux nouvelles slices dans `js/slices.cjs` (ajout, aucune règle assouplie).

## Smoke test

🤖 : un agent la prouve et joint la preuve. 👤 : seul l'humain peut juger.

| Id | Qui | Étapes | Attendu | Niveau visé |
|---|---|---|---|---|
| S1 | 🤖 | `bun run test revision` (tous les tests de la track sont dans `test/revision.test.js`, seule exception la mise à jour de `test/licornes.test.js:499`) : fonctions pures avec des dates fixes (échéancier, file pleine, 3 erreurs, ligne 19) | conforme aux tables | test-verified |
| S2 | 🤖 | même test, JSDOM avec `Date` simulée dans `beforeParse` (une classe qui hérite de `Date` et part d'un instant fixé, avancé par le test) : erreurs en `math`, `calc`, `compare`, `clock`, `reading` | items créés (lignes 1 à 4) ; rien à plusieurs, en défi bonus, au temps écoulé | test-verified |
| S3 | 🤖 | sauvegardes trafiquées (items à `p` hors bornes, `w` en HTML, 500 items, dates fausses, `review: "x"`) chargées, importées par `applyBackup`, et lues par `profileState` (espace parents), toutes par `readSave` | ligne 6, aucune erreur JS | test-verified |
| S4 | 🤖 | aller-retour `item` / `render` pour chaque jeu, à chaque palier | lignes 7 et 8 | test-verified |
| S5 | 🤖 | `bun run verify` | le holdout des sauvegardes passe sans modification | test-verified |
| S6 | 🤖 | phase 2 : séance simulée le lendemain d'une erreur ; une erreur, puis un toucher de la bonne réponse pendant `REVIEW_SHOW_MS` | proposition, mission, badge, pas de minuteur ni de cœurs, boutons désactivés après l'erreur, item non avancé par le second toucher, écran de fin, rien gagné (lignes 9 à 17) | test-verified |
| S7 | 🤖 | refus, fermeture en cours (pendant `WIN_DELAY` et pendant `REVIEW_SHOW_MS`), mission abandonnée par `playGame` d'un jeu normal (cœurs et minuteur présents), partie à plusieurs, pause due | lignes 10, 17, 18, et aucune proposition sous la pause | test-verified |
| S8 | 🤖 | `bun run check` | vert | test-verified |
| S9 | 👤 | Amrou et sa fille, sur 3 jours : rater exprès 2 questions le premier jour | le lendemain, la proposition arrive, la mission est courte, elle n'est pas vécue comme une punition | runtime-verified |
| S10 | 👤 | idem | la phrase et les noms (« souvenirs ») plaisent ; refuser est facile | runtime-verified |

## Questions ouvertes
