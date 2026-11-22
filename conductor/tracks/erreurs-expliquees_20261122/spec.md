---
status: brouillon        # brouillon | validée | faite ; « validée » est posé par l'humain
issue: 0
size: M                  # S | M ; L se découpe (ici en phases, une PR chacune)
migration: false
sensitive: false         # moteur, indices et mini-jeux : aucune zone sensible
files: [js/features/hints/hints.js, js/features/hints/index.js, js/features/hints/hints.css, js/features/minigame-engine/engine.js, js/features/minigame-engine/index.js, js/features/companion-team/specialties.js, js/features/minigames/count/count.js, js/features/minigames/compare/compare.js, js/features/minigames/math/math.js, js/features/minigames/calc/calc.js, js/features/minigames/clock/clock.js, js/features/minigames/puzzle/puzzle.js, js/features/minigames/money/money.js, js/features/minigames/packs/packs.js, js/features/minigames/share/share.js, js/features/minigames/ladybugs/ladybugs.js, test/explications.test.js, conductor/checklist-mini-jeu.md]
taster: { facts: 0, decisions: 0, rounds: 5 }
---

<!-- Gabarit cothon 0.4.0 (setting-up-docs), adopté dans Conductor (cothon 0.2.0-2 et 0.4.0-6) : une nouvelle track part de ce fichier. -->

# Spec : les erreurs expliquées

- Nouveau projet : non

## Problème

Quand l'enfant se trompe, le jeu dit au hasard une phrase générique (« Pas tout à fait, regarde encore »), 7 fois sur 10, puis remplace la question 0,9 s plus tard (anti-devinette). Elle ne sait jamais **pourquoi** sa réponse était fausse : elle repart avec la même idée fausse. Seuls trois jeux disent quelque chose de précis (`mirror`, `nesting`, et le changement de question de `shelf`). Le retour qui explique est nettement plus efficace sur ordinateur que le simple « juste ou faux ».

Cette track ajoute, après une erreur, une explication courte (une phrase dite, un geste visuel sur ce qui est déjà à l'écran, 4 secondes), puis la question suivante. À la réussite, une phrase nomme la stratégie utilisée.

## Ce que disent les preuves (et leurs limites)

| Preuve | Ce qu'on en garde | Limite pour une enfant de 6 ans |
|---|---|---|
| Van der Kleij, Feskens et Eggen 2015, méta-analyse (40 études, 70 effets) du retour sur ordinateur : retour élaboré (explication) 0,49 ; bonne réponse donnée 0,32 ; juste ou faux seul 0,05 ; effets plus grands en mathématiques. https://people.acer.org/en/publications/effects-of-feedback-in-a-computer-based-learning-environment-on-s/ | Expliquer, et montrer la bonne réponse de la question ratée, plutôt que dire « faux ». Commencer par les maths. | La même méta-analyse trouve des effets **plus faibles en primaire et au secondaire**. Aucun effet n'est mesuré à 6 ans en particulier. |
| EEF, *Teaching and Learning Toolkit*, fiche Feedback. https://educationendowmentfoundation.org.uk/education-evidence/teaching-learning-toolkit/feedback | Source citée par la recherche documentaire du parent. | **Non relue** par le rédacteur : la page refuse l'accès automatisé (HTTP 403, Cloudflare). Aucun chiffre n'en est repris ici. |
| Mueller et Dweck 1998, *Journal of Personality and Social Psychology* 75(1) : six études, élèves de CM2 (*fifth graders*) ; l'éloge de l'intelligence donne, après un échec, moins de persévérance et de plaisir que l'éloge de l'effort. Résumé relu sur PubMed (PMID 9686450) ; PDF : https://www.columbia.edu/cu/psychology/courses/3615/Readings/Mueller_Dweck.pdf | Phrases de réussite qui nomment ce que l'enfant a **fait**, jamais ce qu'elle **est**. | Enfants de 10 à 11 ans, pas de 6 ans. Le PDF est un scan sans texte : seul le résumé PubMed a été relu. |
| Sisk et al. 2018, *Psychological Science*, deux méta-analyses sur l'état d'esprit de croissance : effets globaux **faibles**. https://pubmed.ncbi.nlm.nih.gov/29505339/ | L'éloge du processus est un changement bon marché, pas un levier puissant : on le fait, on n'en attend pas de miracle. | Porte sur les interventions « état d'esprit », pas directement sur l'éloge dans un jeu. |
| Sundararajan et Adesope 2020, méta-analyse de l'effet des détails séduisants (*Keep it Coherent*, *Educational Psychology Review*), annoncée par https://news.wsu.edu/2020/03/19/seductive-details-inhibit-learning/ | Pas d'animation décorative dans l'explication : seulement les effets d'indice existants (brillance, étiquettes) sur ce qui est déjà à l'écran. | La page de l'université refuse l'accès automatisé (HTTP 403) ; titre, auteurs et revue vérifiés par Semantic Scholar, chiffres non relus. |

## Comportement attendu

Vocabulaire : une **explication** est l'objet `{ say, fx }` qu'un jeu renvoie pour une question et une mauvaise réponse ; une question **remplacée** est une erreur avec `onRetry` (une autre question suit) ; une question **continuée** est une erreur sans `onRetry` (l'enfant continue la même question, ex. `puzzle`).

1. Étant donné un jeu qui a inscrit ses explications et une partie en solo, quand l'enfant touche une mauvaise réponse, alors une bulle `.explain-bubble` (structure : section « La bulle ») apparaît sous la consigne, le texte de son `.explain-text` est exactement `say`, `speak` reçoit `say` tel quel (le test compare la dernière phrase notée par sa fausse synthèse vocale à `ev('toSpoken(' + JSON.stringify(say) + ')')` ; `toSpoken` n'est pas exporté, mais la page de test regroupe tous les modules en un script sans renommer ni retirer aucun nom, donc les fonctions non exportées sont lisibles par `ev`, comme `hintsFor` dans `test/companions.test.js:94` ; voir `test/tools/page.js:1-15` ; rien n'est exporté en plus et `speak` ne change pas), les effets `fx` s'appliquent, et aucune phrase de `WRONG_HINTS` n'est dite.
2. Étant donné une explication affichée, quand on lit `say`, alors il compte entre 3 et 12 mots (mots séparés par des espaces, signes de ponctuation seuls non comptés) et ne contient ni `+`, ni `−`, ni `×`, ni `=`, ni `<`, ni `>` (ils sont dits en mots : « plus », « moins », « fois »).
3. Étant donné une explication affichée, quand on inspecte `#modal-body`, alors il porte la classe `explaining`, et chaque `button` de `#modal-body` qui n'était pas déjà désactivé l'est, sauf `.btn-speak` ; toucher la bonne réponse pendant ce temps ne fait pas gagner.
4. Étant donné une question remplacée avec explication, quand l'enfant se trompe, alors la question suivante s'affiche `EXPLAIN_MS` (4000 ms) après l'erreur, et non 900 ms.
5. Étant donné une question remplacée, quand la question suivante s'affiche, alors sa clé diffère de celle de la question ratée (table « Clés de question », avec la règle de repli après 8 tirages identiques). Sans objet pour un couple jeu et palier qui n'a qu'une question possible : aucun aujourd'hui (table), et le test les exclut par sa liste `SINGLE_QUESTION`, vide.
6. Étant donné une question remplacée, quand l'explication s'affiche, alors l'élément qui porte la bonne réponse de la question ratée, donné jeu par jeu et mode par mode dans la table « Où est la bonne réponse », est montré comme cette table l'exige (brillance `hint-glow`, case remplie avec `explain-fill`, ou points dessinés).
7. Étant donné une question continuée (`puzzle`), quand l'explication s'affiche, alors `say` ne contient pas le nombre attendu (`seq[idx]`) comme mot, aucune réponse ne brille, et après `EXPLAIN_MS` la bulle `.explain-bubble` et les étiquettes `.explain-mark` disparaissent, la classe `explaining` est retirée et les boutons désactivés par l'explication se réactivent.
8. Étant donné une question où il ne reste qu'un essai, quand l'erreur fait perdre ce dernier essai, alors l'explication s'affiche et l'écran « Raté ! » arrive `EXPLAIN_MS` après l'erreur, et non 520 ms ; dans ce cas, la ligne 8 remplace les lignes 4 et 5 (aucune question suivante). Cas atteignables (chaque rendu rappelle `setupLives`, donc les essais repartent à chaque nouvelle question) : `count` au palier 5 (barème `default`, 1 essai, `difficulty.js:360-368`) en phase 1 ; `puzzle` en phase 2 (barème `default`, même question continuée : 3, 2, 2, 1 essais aux paliers 2 à 5). Les jeux du barème `generous` (2 essais au palier 5) n'atteignent jamais « Raté ! » en se trompant une fois par question.
9. Étant donné un jeu sans explication inscrite (exempté), quand l'enfant se trompe, alors le comportement est celui d'avant (phrase générique 7 fois sur 10, relance à 900 ms, écran « Raté ! » à 520 ms).
10. Étant donné une partie à plusieurs (`party.active`), quand un joueur se trompe, alors aucune explication ne s'affiche (la main passe, comme avant).
11. Étant donné un temps écoulé (minuteur, `loseLife(null)`), quand le temps finit, alors aucune explication ne s'affiche (rien de faux n'a été touché).
12. Étant donné une explication qui s'affiche, quand l'équipe des compagnons est branchée, alors `hintPolicy.onExplain(kind)` est appelé et la file de paroles de l'équipe est vidée (`teamSayClear`) : aucune bulle d'équipe ne reparle pendant ni après l'explication, une seule phrase est dite.
13. Étant donné une explication en cours, quand la fenêtre se ferme ou change (`onModalChange`), alors la relance programmée et le retrait programmé sont annulés par le moteur (rien ne réapparaît par-dessus un autre écran), et `explainClear()` est appelé par `hints` : `#modal-body` n'a plus la classe `explaining` (il persiste d'une fenêtre à l'autre, `js/shared/ui/modal.js:43-58`).
14. Étant donné chaque ligne des tables d'explications ci-dessous, quand `explainFor(jeu, question, mauvaise réponse)` est appelé avec les valeurs de la ligne, alors `say` est exactement la phrase de la table et `fx` contient les effets de la table.
15. Étant donné une mission gagnée en solo dans un jeu qui a inscrit `right`, quand l'écran de victoire s'ouvre, alors il contient, juste après le `<h2>`, `<div class="speech win-how"><span aria-hidden="true">🧠</span> <span class="win-how-text">{phrase}</span></div>`, le texte de `.win-how-text` est exactement la phrase de la table, et l'unique `speak` de la victoire (`engine.js:448-453`) contient la phrase insérée juste après l'éloge : `${niveau}${praise} ${phrase} ${cheer}…` (une seule chaîne, `speak` coupant toute phrase en cours).
16. Étant donné l'écran de victoire, quand on lit la liste des éloges (`winPraises`), alors aucun ne contient « fort », « forte », « champion », « championne », « malin » ni « maligne ».
17. Étant donné la liste des jeux inscrits (`GAME_TYPES`), quand `test/explications.test.js` tourne, alors il échoue si un jeu n'a ni explication, ni place dans `EXPLAIN_EXEMPT`, ni place dans `EXPLAIN_NEVER` ; s'il trouve dans `EXPLAIN_EXEMPT` un jeu qui a des explications ; si `EXPLAIN_EXEMPT` contient un jeu hors de `LEGACY_GAMES` ; ou si `EXPLAIN_EXEMPT` dépasse `EXPLAIN_EXEMPT_MAX`.
18. Étant donné chaque jeu de la phase en cours, à chaque palier (1 à 5, et 6 pour `calc`), sur 3 parties, quand l'enfant se trompe une fois, alors les lignes 1 à 7 sont vraies (ou la ligne 8 si l'essai était le dernier), `fx.dim` est absent, et le jeu reste gagnable : la question suivante se gagne, ou, si la mission est ratée, une mission relancée par `playGame(jeu)` se gagne.

## Le contrat `registerExplain`

Nommé d'après `registerHints` (`js/features/hints/hints.js:41-44`), dans la même slice : il réutilise la question déjà connue des indices (`setHintQuestion`) et leurs effets visuels (`applyHintFx`).

```js
// à la fin du fichier du jeu, à côté de registerHints
registerExplain('<cle>', {
  wrong: (q, v) => ({ say, fx }),   // q : l'objet passé à setHintQuestion ; v : la mauvaise réponse (option `wrong` de loseLife)
  right: (q) => 'phrase de stratégie', // facultatif ; null si rien à dire
});
// au moment de l'erreur, le jeu passe la mauvaise réponse au moteur
loseLife(btn, { onRetry: renderMath, wrong: Number(btn.dataset.v) });
```

- `wrong(q, v)` renvoie `{ say, fx }` ou `null` (pas d'explication pour ce cas : comportement d'avant).
- `fx` accepte les clés des indices `glow`, `marks`, `strike`, `html`, `run`, plus `fill: { sel, text }` (écrit `text` dans l'élément et lui ajoute `filled explain-fill`). `dim` est interdit (le test le refuse).
- Les étiquettes posées par `fx.marks` reçoivent les classes `hint-mark explain-mark`.
- `right(q)` renvoie une phrase de 3 à 10 mots, au passé composé, qui décrit ce que l'enfant a fait.
- API ajoutée à `js/features/hints/index.js` : `registerExplain`, `hasExplain(kind)`, `explainFor(kind, q, v)` (pur, pour les tests), `explainShow(v)` (montre l'explication de la question courante, renvoie `true` si elle a été montrée), `explainClear()` (retire bulle, étiquettes `.explain-mark`, classe `explaining`, réactive les boutons qu'elle a désactivés ; appelé par le moteur à la fin d'une question continuée, et par `hints` dans son `onModalChange`), `strategyLine()` (phrase `right` de la question courante, ou `null`). `hintPolicy` reçoit un champ `onExplain: null`.

## La bulle

Structure exacte, insérée après `#challenge-timer`, sinon `.puzzle-hint`, sinon `.game-head` (même ancrage que `showHint`, `hints.js:245-257`) :

```html
<div class="explain-bubble" role="status">
  <span class="hint-bface" aria-hidden="true">{companionSVG(hintPolicy.giver(kind, 1), 'think')}</span>
  <span class="explain-text">{say, tel quel}</span>
  <span class="hint-extra">{fx.html}</span>   <!-- seulement si fx.html -->
</div>
```

- Aucune espace insécable n'est ajoutée (contrairement à `showHint`, `hints.js:261`) : `.explain-text` contient `say` exactement, et c'est ce que le test compare. `fx.html` va dans son propre `.hint-extra`, hors de `.explain-text`.
- `speak(say)` reçoit `say` brut.
- La classe `explaining` posée sur `#modal-body` est un **simple marqueur** (lu par les tests, aucune règle CSS). Elle est posée par `explainShow` et retirée par `explainClear`.
- **Propriétaire des minuteries : le moteur.** Il programme la relance (`scheduleRetry`), l'écran « Raté ! » et, pour une question continuée, l'appel à `explainClear()` après `EXPLAIN_MS` ; son `onModalChange` (`engine.js:513-516`) les annule toutes. `hints` n'a aucune minuterie d'explication : son `onModalChange` (`hints.js:337-342`) appelle seulement `explainClear()`.

## Le déroulé dans le moteur (`loseLife`)

Ordre, pour une erreur en solo (`js/features/minigame-engine/engine.js:112-169`) :

1. Inchangé : `buddyReact('oops')`, `hintNudge(true)`, retour immédiat si `party.active`, `noteAnswerError()`, son, vibration.
2. `shown = el !== null && opts.wrong !== undefined && explainShow(opts.wrong)`. Si `shown` : `clearActiveTimer()` ; sinon `speakWrongHint()` (comme avant).
3. Inchangé : secousse, `ko-flash`, désactivation du bouton fautif.
4. `delay = shown ? EXPLAIN_MS : 900`. Essais illimités avec `onRetry` : `scheduleRetry(onRetry, delay)`. Essais illimités sans `onRetry` : comme avant, et si `shown`, `explainClear()` après `EXPLAIN_MS` (minuterie du moteur, annulée par son `onModalChange`).
5. Essais limités : `lives--` ; si plus d'essai, `onMissionFail` après `shown ? EXPLAIN_MS : 520` ; sinon le message d'essais restants, puis `scheduleRetry(onRetry, delay)` ou, sans `onRetry`, `explainClear()` après `EXPLAIN_MS`.

Effets de `loseLife`, un par ligne (`engine.js:112-169`), quand une explication est montrée (`shown`) :

| Effet | Avec explication | Pourquoi |
|---|---|---|
| `buddyReact('oops', 1300)` | gardé | Visage seulement, aucune parole |
| `hintNudge(true)` | gardé | Le bouton 💡 de la question suivante brillera ; `hintPolicy.onError` peut lancer la parole de Grisou, aussitôt coupée par `speak(say)` et retirée par `onExplain` (D9) |
| retour si `party.active` | gardé (avant tout le reste) | Ligne 10 |
| `noteAnswerError()` | gardé | L'erreur compte pour l'espace parents comme avant |
| `playSound('wrong')` | gardé | Son court, pas une parole |
| `vibrate(90)` | gardé | |
| `speakWrongHint()` | **coupé** | Une seule phrase : `say` |
| `shakeEl(el)`, `ko-flash` | gardés | Retour visuel immédiat sur le bouton touché |
| désactivation du bouton (`disabled`, `ko`) | gardée | Puis tous les boutons par le verrou (D7) |
| réactivation à 700 ms (essais illimités, sans `onRetry`) | **coupée** | Le verrou dure `EXPLAIN_MS` ; `explainClear()` réactive à la fin |
| `lives--`, `renderLives()`, `flashModal('ko')` | gardés | Les essais se comptent comme avant |
| `showToast` des essais restants | gardé | Texte affiché, pas dit |
| `onMissionFail` | retardé à `EXPLAIN_MS` | D11 |
| `scheduleRetry(onRetry)` | retardé à `EXPLAIN_MS` | Ligne 4 |

Sans explication, tous les effets sont ceux d'avant (ligne 9).

`scheduleRetry(fn, delay = 900)` prend le délai en paramètre. `EXPLAIN_MS = 4000` est une constante exportée du moteur.

## Ce que livre chaque phase

| Phase (PR) | Jeux | Lignes de comportement dues | Smoke test dû |
|---|---|---|---|
| 1 (`release patch`) | `count`, `compare`, `math`, `calc`, `clock` | 1 à 6, 8 (`count` palier 5), 9 à 14, 17, 18 pour ces 5 jeux | S1, S2, S4, S5, S6, S7, S9, S10 |
| 2 (`release patch`) | `puzzle`, `money`, `packs`, `share`, `ladybugs` | 7, 8 (`puzzle`), 14 et 18 pour ces 5 jeux, 17 (liste à 18) | S1, S2, S3, S9 |
| 3 (`release track`) | les 10 jeux | 15, 16 | S8, S9, S11, S12 |

## Tables d'explications (phases 1 et 2)

Notations : `{n}` et les autres accolades sont des valeurs de la question ; `{objet}` est `emojiWord(q.emoji)` (repli : « image ») ; il n'est employé qu'après « chaque », qui ne s'accorde pas (« chaque étoile », « chaque coquillage », « chaque image ») ; un nom après un nombre s'accorde : `{b} paquet(s)` s'écrit « paquet » si b = 1, « paquets » sinon, et de même `{n} point(s)` ; `{mot}(s)` vaut « plus » pour `+`, « moins » pour `−`, « fois » pour `×`. Dans chaque jeu dont la question est remplacée, `fx.glow` contient **aussi** le sélecteur de la bonne réponse (colonne « Bonne réponse »). Les conditions se lisent dans l'ordre : la première vraie gagne.

### `count` (`wrong` : le nombre touché ; bonne réponse `solSel('.num-btn','v',n)`)

| Erreur | `say` | `fx` |
|---|---|---|
| `v < n` (oubli) | `Il ne faut en oublier aucun. Il y en a {n}.` | `marks` : chaque `.count-row span:nth-child(i)` reçoit `i`, pour i de 1 à n |
| `v > n` (compté deux fois) | `Chaque {objet} se compte une seule fois. Il y en a {n}.` | idem |

### `compare` (`wrong` : le signe touché ; `{grand}`, `{petit}` : max et min de a, b ; bonne réponse `solSel('.cmp-btn','v',answer)`)

| Erreur | `say` | `fx` |
|---|---|---|
| `answer` est `=`, `v` ne l'est pas | `{a} et {b} sont pareils : c'est le signe égal.` | `fill` `.cmp-q` = `=` ; `glow` `.cmp-num` |
| `answer` n'est pas `=`, `v` est `=` | `{a} et {b} ne sont pas pareils : {grand} est plus grand.` | `fill` `.cmp-q` = answer ; `glow` le `.cmp-num` du plus grand (`.cmp-equation .cmp-num:first-child` si a > b, sinon `:last-child`) |
| signe à l'envers | `{grand} est plus grand que {petit} : la bouche s'ouvre vers {grand}.` | idem |

### `math` (`wrong` : le nombre touché ; `{r}` = result ; G1 = `.math-illustration .math-group:first-child`, G2 = `.math-illustration .math-group:last-child` ; bonne réponse `solSel('.num-btn','v',r)`)

| Erreur | `say` | `fx` |
|---|---|---|
| `+` et `v === a - b` (a soustrait) | `On ajoute {b}, on n'enlève pas. {a} plus {b}, ça fait {r}.` | `fill` `.eq-q` = r ; `marks` : `G1 span:last-child` = a, `G2 span:nth-child(k)` = a + k pour k de 1 à b |
| `+` et `v < r` | `Il en manque. Je pars de {a} et j'avance de {b} : {r}.` | idem |
| `+` et `v > r` | `C'est trop. Je pars de {a} et j'avance de {b} : {r}.` | idem |
| `−` et `v === a + b` (a additionné) | `On enlève {b}, on n'ajoute pas. {a} moins {b}, ça fait {r}.` | `fill` `.eq-q` = r ; `strike` `G1 span:nth-last-child(-n+{b})` ; `marks` : `G1 span:nth-child(k)` = k pour k de 1 à r |
| `−` et `v > r` | `Il en reste moins. J'enlève {b} : il en reste {r}.` | idem |
| `−` et `v < r` | `Il en reste plus. J'enlève {b} : il en reste {r}.` | idem |

### `calc` (`wrong` : le nombre touché ; `{r}` = result ; bonne réponse `solSel('.num-btn','v',r)` ; `fx.fill` `.eq-q` = r dans tous les cas ; une « bande » est `<span class="hint-strip"><i>…</i>…</span>`, le format de `hintOrderStep`)

| Question | Erreur | `say` | `fx.html` (bande) |
|---|---|---|---|
| `mult {a, b}` | `v === r - a` | `Il manque un paquet de {a}. {b} paquet(s) de {a} : {r}.` | a, 2a, …, r |
| `mult` | `v === r + a` | `Un paquet de {a} en trop. {b} paquet(s) de {a} : {r}.` | idem |
| `mult` | autre | `{a} fois {b}, c'est {b} paquet(s) de {a} : {r}.` | idem |
| 3 termes (`ops` de 2) ; `{m}` = résultat du 1er calcul | toute | `D'abord {first} {mot1} {n1}, ça fait {m}. Puis {mot2} {n2} : {r}.` | `{first} {s1} {n1} = {m}`, `{m} {s2} {n2} = {r}` |
| 2 termes `{first} {s} {n}` | `+` et `v === r - 1`, ou `−` et `v === r + 1` (le nombre de départ compté) | `On ne compte pas {first} lui-même. {first} {mot} {n}, ça fait {r}.` | si n ≤ 5 : first, chaque pas jusqu'à r ; sinon comme la ligne « dizaines » si elle s'applique, sinon `{first} {s} {n} = {r}` |
| 2 termes, `{d}` > 0 et `{u}` > 0 (n a des dizaines **et** des unités) | autre | `D'abord les dizaines : {m}. Puis les unités : {r}.` | `{first} {s} {d} = {m}`, `{m} {s} {u} = {r}` |
| 2 termes | autre | `Je pars de {first} et j'avance de {n} : {r}.` (pour `−` : `et je recule de`) | si n ≤ 5 : first, chaque pas jusqu'à r ; sinon `{first} {s} {n} = {r}` |

Variables de `calc` (mêmes noms que `calcStepHint`, `calc.js:113-118`) :

| Variable | Formule | Exemple |
|---|---|---|
| `{first}`, `{s}`, `{n}` (2 termes) | `q.first`, `q.ops[0].sign` (`+` ou `−`), `q.ops[0].n` | `23 + 14` : first 23, s `+`, n 14 |
| `{mot}` | « plus » si s est `+`, « moins » si s est `−` | plus |
| `{d}` | `n - n % 10` (les dizaines de n, en valeur : 10 pour 14, 20 pour 23) | 10 |
| `{u}` | `n % 10` | 4 |
| `{m}` (2 termes) | `first + d` si `+`, `first - d` si `−` | 33 |
| `{m}` (3 termes) | `first + n1` ou `first - n1` (premier calcul) | `12 + 5 − 3` : 17 |
| `{first}`, `{s1}`, `{n1}`, `{s2}`, `{n2}`, `{mot1}`, `{mot2}` (3 termes) | `q.first`, `q.ops[0].sign`, `q.ops[0].n`, `q.ops[1].sign`, `q.ops[1].n`, mots de s1 et s2 | 12, `+`, 5, `−`, 3, plus, moins |
| `{a}`, `{b}` (multiplication) | `q.mult.a`, `q.mult.b` | `5 × 3` : 5, 3 |
| `{r}` | `q.result` | 37 |
| « chaque pas jusqu'à r » | `first`, puis `first ± 1`, `first ± 2`… jusqu'à r inclus (n + 1 cases) | `7 + 3` : 7, 8, 9, 10 |
| « a, 2a, …, r » | `a × k` pour k de 1 à b | 5, 10, 15 |

Dans les bandes, les signes s'affichent comme dans le jeu (`+`, `−` U+2212, `×`). Exemples complets (`say` puis `fx.html`) :

- `23 + 14`, v = 38 (ligne « dizaines ») : `D'abord les dizaines : 33. Puis les unités : 37.` ; `<span class="hint-strip"><i>23 + 10 = 33</i><i>33 + 4 = 37</i></span>`.
- `58 − 23`, v = 34 (ligne « dizaines ») : `D'abord les dizaines : 38. Puis les unités : 35.` ; `<span class="hint-strip"><i>58 − 20 = 38</i><i>38 − 3 = 35</i></span>`.
- `7 + 3`, v = 9 (nombre de départ compté) : `On ne compte pas 7 lui-même. 7 plus 3, ça fait 10.` ; `<span class="hint-strip"><i>7</i><i>8</i><i>9</i><i>10</i></span>`.
- `31 + 24`, v = 54 (nombre de départ compté, n > 5, ligne « dizaines » applicable) : `On ne compte pas 31 lui-même. 31 plus 24, ça fait 55.` ; `<span class="hint-strip"><i>31 + 20 = 51</i><i>51 + 4 = 55</i></span>`.
- `40 − 7`, v = 32 (dernière ligne, n > 5 sans dizaines) : `Je pars de 40 et je recule de 7 : 33.` ; `<span class="hint-strip"><i>40 − 7 = 33</i></span>`.
- `40 − 2`, v = 37 (dernière ligne, n ≤ 5) : `Je pars de 40 et je recule de 2 : 38.` ; `<span class="hint-strip"><i>40</i><i>39</i><i>38</i></span>`.
- `12 + 5 − 3`, v = 15 : `D'abord 12 plus 5, ça fait 17. Puis moins 3 : 14.` ; `<span class="hint-strip"><i>12 + 5 = 17</i><i>17 − 3 = 14</i></span>`.
- `5 × 3`, v = 10 : `Il manque un paquet de 5. 3 paquets de 5 : 15.` ; `<span class="hint-strip"><i>5</i><i>10</i><i>15</i></span>`.

### `puzzle` (question continuée : jamais la réponse ; `wrong` : le nombre touché ; `{last}` = dernier nombre déjà rangé)

| Cas | `say` | `fx` |
|---|---|---|
| rien rangé, ordre croissant (`from1`, `start`, `step2`) | `{v} n'est pas le plus petit. Cherche le plus petit nombre.` | `glow` `.puzzle-row` |
| rien rangé, `desc` | `{v} n'est pas le plus grand. Cherche le plus grand nombre.` | idem |
| déjà commencé, `from1` ou `start` | `{v} vient plus tard. Quel nombre vient juste après {last} ?` | `glow` `.puzzle-btn.done` |
| déjà commencé, `desc` | `{v} vient plus tard. Quel nombre vient juste avant {last} ?` | idem |
| déjà commencé, `step2` | `{v} vient plus tard. On compte de 2 en 2 après {last}.` | idem |

### `money` (`wrong` : le total de la pile touchée ; bonne réponse `solSel('.money-pile-btn','v',target)`)

| Erreur | `say` | `fx` |
|---|---|---|
| `v < target` | `Cette pile fait {v} : c'est moins que {target}.` | `marks` : la pile touchée (`solSel('.money-pile-btn','v',v)`) reçoit `{pièces jointes par +}={v}` ; la bonne pile reçoit `{pièces jointes par +}={target}` (piles lues dans `q.piles`) |
| `v > target` | `Cette pile fait {v} : c'est plus que {target}.` | idem |

### `packs` (`wrong` : le nombre touché ; `{T}` = `{n} paquets de {size} : {total}` sans jouet seul, `{n} paquets de {size} et 1 : {total}` avec ; bonne réponse `solSel('.pack-opt','v',total)`)

| Erreur | `say` | `fx` |
|---|---|---|
| `v === n + size` et `n + size !== total` | `On ne fait pas {n} plus {size}. On compte par paquets : {total}.` | `marks` : `.pack[data-pack="i"]` reçoit `size × (i + 1)` pour chaque paquet ; `.pack-single` reçoit `{total}` s'il existe |
| jouet seul et `v === total - 1` | `N'oublie pas le jouet seul : {total}.` | idem |
| `v === total - size` | `Il manque un paquet. {T}.` | idem |
| `v === total + size` | `Un paquet de trop. {T}.` | idem |
| autre | `Je compte de {size} en {size} : {total}.` | idem |

### `share` (`wrong` : `{ equal, n, k }` lus sur le bouton touché : `data-equal === '1'`, `Number(data-n)`, `data-k` ; `{Part}` : « La moitié », « Le tiers », « Le quart » ; `{part}` en minuscule ; `{un}` : « un demi », « un tiers », « un quart »)

| Question | Erreur | `say` | `fx` |
|---|---|---|---|
| `fair` | toute | `Ces parts ne sont pas pareilles : une est plus grosse.` | `glow` `.share-opt[data-equal="1"]` |
| `show` | gâteau aux parts égales mais `w.n !== q.n` | `Ce gâteau a {w.n} parts. {Part}, c'est {q.n} parts égales.` | `glow` `.share-opt[data-equal="1"][data-n="{q.n}"]` |
| `show` | gâteau piège (`equal` faux) | `Ces parts ne sont pas égales : ce n'est pas {part}.` | idem |
| `write` | toute | `Le gâteau a {q.n} parts égales : c'est {un}.` | `glow` `.share-stage` et `solSel('.share-opt','k',q.n)` ; `html` : `<span class="hint-strip"><i>½ ou ⅓ ou ¼ (celui de q.n)</i></span>` |
| `whole` `quarts-moitie` | toute | `Deux quarts font une moitié.` | `glow` `.share-stage` et la bonne réponse |
| `whole` `quarts-entier` | toute | `Quatre quarts font le gâteau entier.` | idem |
| `whole` `moities-entier` | toute | `Deux moitiés font le gâteau entier.` | idem |
| `whole` `tiers-entier` | toute | `Trois tiers font le gâteau entier.` | idem |

### `ladybugs` (`wrong` : le nombre touché, ou `added` pour `complete` ; bonne réponse `solSel('.lb-opt','v',réponse)` hors `complete`)

| Mode | Erreur | `say` | `fx` |
|---|---|---|---|
| `complete` | `added < n` | `Il manque des points : il en faut {n}, comme à gauche.` | `glow` `#lb-stage` ; `run` : `#lb-right` reçoit les n points attendus, dessinés comme `draw()` (`ladybugs.js:111-117`) |
| `complete` | `added > n` | `Trop de points : il en faut {n}, comme à gauche.` | idem |
| `count`, `double` | `v === n` (une seule aile) | `Tu as compté une seule aile. {n} plus {n}, ça fait {total}.` | `glow` `#lb-stage` ; `html` bande `{n} + {n} = {total}` |
| `count`, `double` | autre | `{n} point(s) sur chaque aile : {n} plus {n}, {total}.` | idem |
| `half` | toute | `{v} plus {v}, ça fait {2v}, pas {total}. C'est {n}.` | idem |

### `clock` (`wrong` : l'étiquette touchée, ex. `3 h 30` ; `{hv}`, `{mv}` : son heure et ses minutes ; `{dit}` : l'heure juste dite en mots (table « `{dit}` » ci-dessous) ; `{grande}` : 12, 3, 6, 9 pour 0, 15, 30, 45 minutes ; bonne réponse `solSel('.clock-opt-btn','v',answer)` ; `fx.run` ajoute les nombres autour du cadran, comme l'indice 2, `clock.js:126-129`)

| Erreur | `say` | `fx.glow` |
|---|---|---|
| `hv !== hour` et `hv === {grande}` (grande aiguille lue comme l'heure) | `La grande aiguille montre les minutes. Il est {dit}.` | `.clock-hand-h` |
| `hv !== hour` | `La petite aiguille est sur le {hour} : il est {dit}.` | `.clock-hand-h` |
| `mv !== minute`, minute 0 | `La grande aiguille est sur le 12 : c'est l'heure pile.` | `.clock-hand-m` |
| `mv !== minute`, minute 30 | `La grande aiguille est sur le 6 : c'est la demie.` | idem |
| `mv !== minute`, minute 15 | `La grande aiguille est sur le 3 : c'est le quart.` | idem |
| `mv !== minute`, minute 45 | `La grande aiguille est sur le 9 : c'est 45 minutes.` | idem |

Table `{dit}` (`h` = heure de la question, 1 à 12) :

| minute | h = 1 | h de 2 à 12 |
|---|---|---|
| 0 | `1 heure` | `{h} heures` |
| 15 | `1 heure 15` | `{h} heures 15` |
| 30 | `1 heure 30` | `{h} heures 30` |
| 45 | `1 heure 45` | `{h} heures 45` |

Cas le plus long : `La petite aiguille est sur le 12 : il est 12 heures 45.` = 12 mots (le « : » ne compte pas) ; `La grande aiguille montre les minutes. Il est 12 heures 45.` = 11 mots.

### Phrases de stratégie (`right`, phase 3)

| Jeu | Cas | Phrase |
|---|---|---|
| `count` | toujours | `Tu as compté chaque {objet} une seule fois.` |
| `compare` | a = b | `Tu as vu qu'ils sont pareils.` |
| `compare` | a et b ≥ 10, dizaines différentes | `Tu as bien regardé les dizaines.` |
| `compare` | autre | `Tu as trouvé le plus grand nombre.` |
| `math` | `+` / `−` | `Tu as compté les deux groupes ensemble.` / `Tu as enlevé, puis compté ceux qui restent.` |
| `calc` | `mult` | `Tu as compté de {a} en {a}.` |
| `calc` | 3 termes | `Tu as fait les calculs un par un.` |
| `calc` | n avec dizaines et unités | `Tu as fait les dizaines, puis les unités.` |
| `calc` | autre `+` / `−` | `Tu as avancé depuis le premier nombre.` / `Tu as reculé depuis le premier nombre.` |
| `puzzle` | `from1`, `start` / `desc` / `step2` | `Tu as suivi l'ordre des nombres.` / `Tu as compté à l'envers.` / `Tu as compté de 2 en 2.` |
| `money` | toujours | `Tu as additionné les pièces de chaque pile.` |
| `packs` | toujours | `Tu as compté de {size} en {size}.` |
| `share` | `fair` / `show` / `write` / `whole` | `Tu as vérifié que les parts sont pareilles.` / `Tu as compté les parts égales.` / `Tu as compté les parts du gâteau.` / `Tu as assemblé les parts dans ta tête.` |
| `ladybugs` | `count` / `double` / `complete` / `half` | `Tu as compté les deux ailes.` / `Tu as trouvé le double.` / `Tu as rendu les deux ailes pareilles.` / `Tu as partagé en deux parts égales.` |
| `clock` | toujours | `Tu as lu la petite aiguille, puis la grande.` |

### Éloges de l'écran de victoire (`winPraises(who)`, remplace la liste de `engine.js:430-437`)

`Bravo{, who}, bien joué !` ; `Super{, who}, tu as bien cherché !` ; `Génial, c'est réussi !` ; `Waouh{, who}, tu as bien réfléchi !` ; `Incroyable, tu as tout trouvé !` ; `Tu as bien travaillé ! 💪`. (`{, who}` : « ␣prénom » si connu, comme aujourd'hui ; l'espace insécable avant « ! » est gardée.)

### Clés de question (ligne 5 : jamais deux fois la même d'affilée)

Chaque jeu garde la clé de sa dernière question (`<jeu>Last`) et retire jusqu'à 8 fois si la nouvelle a la même clé, comme `packs` (`packs.js:79-87`). La clé est ce qui fixe la réponse. **Repli** : si les 8 tirages ont tous la même clé, le jeu change une valeur de la dernière question (colonne « Repli »), ce qui donne toujours une clé différente dans la plage du palier. `{lo}`, `{hi}` : bornes de la plage du palier (`difficulty.js`).

| Jeu (phase) | Clé | Repli après 8 tirages identiques | Questions distinctes au palier 1 (le plus petit) |
|---|---|---|---|
| `count` (1) | `n` | `n + 1` si `n + 1 <= max`, sinon `n - 1` (`countRange`) | 5 (n de 3 à 7, `difficulty.js:126-135`) |
| `compare` (1) | `a-b` | `b + 1` si `b + 1 <= max`, sinon `b - 1` ; réponse recalculée | 100 (a et b de 1 à 10) |
| `math` (1) | `a op b` | `+` : `b + 1` si `a + b + 1 <= max`, sinon `b - 1` si `b > 1`, sinon `a - 1` ; `−` : `b - 1` si `b > 1`, sinon `b + 1` si `b + 1 < a`, sinon `a + 1` | 7 (additions jusqu'à 5 : a de 1 à 2, `math.js:38-41`) |
| `calc` (1) | `text` | le dernier nombre `n` devient `n + 1` si le résultat reste dans 0 à max, sinon `n - 1` ; `mult` : `b` devient `b % 10 + 1` | 190 (45 soustractions, 145 additions) |
| `clock` (1) | `hour-minute` | `hour % 12 + 1` | 12 (heures pleines) |
| `money` (2) | `target` | algorithme « Repli de `money` » ci-dessous | 3 (piles de 2 pièces de 1 ou 2 : 2, 3, 4) |
| `packs` (2) | `size-n-extra` (remplace la clé actuelle, qui contient le jouet et laisserait revenir le même total) | `n + 1` si `n + 1 <= max`, sinon `n - 1` | 2 (paquets de 2, n de 2 à 3) |
| `share` (2) | existante (`share.js:156-157`) | la forme change (`rond` ↔ `carre`) | plus de 2 (forme et gâteaux inégaux) |
| `ladybugs` (2) | existante `mode + n` (`ladybugs.js:82`) | `n + 1` si `n + 1 <= max`, sinon `n - 1` | 3 (n de 1 à 3) |
| `puzzle` (2) | sans objet : question continuée | sans objet | sans objet |

### Repli de `money`

Quand les 8 retirages ont tous donné la cible de la question ratée, à partir du 9ᵉ tirage (bonne pile `correct`, ses distracteurs `options.slice(1)`) :

1. `denoms = moneyDenoms(dd)`. La première pièce de `correct.pile` (la plus grande, la pile étant triée par valeur décroissante) prend la valeur qui la suit dans `denoms` ; si c'était la dernière valeur de `denoms`, elle prend la première.
2. La pile est retriée par valeur décroissante ; `correct.total` est recalculé ; `target = correct.total` (elle diffère toujours de l'ancienne, car deux valeurs de `denoms` sont toujours différentes).
3. `options = [correct]` plus les anciens distracteurs dont le total **diffère** de la nouvelle `target`.
4. Même boucle que `money.js:46-56` : tant que `options.length < 3` et `tries < 30`, tirer `randomPile(denoms, min + Math.floor(random() * (max - min + 1)))` et l'ajouter si son total diffère de `target` ; puis, s'il manque encore des piles, la pile de secours `{ pile: [pickRandom(denoms)], total: target + options.length }`.
5. Mélange (`shuffle`) et affichage comme d'habitude ; `moneyLast = target`.

Exemple (palier 1, `denoms = [1, 2]`, piles de 2 pièces) : la question ratée valait 3 ; le 9ᵉ tirage donne encore `correct = [2, 1]` (3), distracteurs `[2, 2]` (4) et `[1, 1]` (2). Étape 1 : la première pièce 2 est la dernière valeur de `denoms`, elle devient 1 : `[1, 1]`. Étape 2 : `target = 2`. Étape 3 : `[2, 2]` (4) est gardé, `[1, 1]` (2) est retiré. Étape 4 : un tirage `[2, 1]` (3) est accepté. Choix affichés : piles de 2 (bonne), 4 et 3.

### Où est la bonne réponse (ligne 6), jeu par jeu et mode par mode

| Jeu, mode | Élément qui porte la bonne réponse | Ce que la ligne 6 exige |
|---|---|---|
| `count` | `solSel('.num-btn','v',n)` | il a `hint-glow` |
| `compare` | `solSel('.cmp-btn','v',answer)` et `.cmp-q` | bouton `hint-glow` ; `.cmp-q` contient answer, classe `explain-fill` |
| `math` | `solSel('.num-btn','v',r)` et `.eq-q` | idem, `.eq-q` contient r |
| `calc` | `solSel('.num-btn','v',r)` et `.eq-q` | idem |
| `clock` | `solSel('.clock-opt-btn','v',answer)` | `hint-glow` |
| `puzzle` | aucun (question continuée) | aucune bonne réponse ne brille (ligne 7) |
| `money` | `solSel('.money-pile-btn','v',target)` | `hint-glow` et l'étiquette de la somme |
| `packs` | `solSel('.pack-opt','v',total)` | `hint-glow` |
| `share` `fair` | `.share-opt[data-equal="1"]` | `hint-glow` |
| `share` `show` | `.share-opt[data-equal="1"][data-n="{q.n}"]` | `hint-glow` |
| `share` `write` | `solSel('.share-opt','k',q.n)` | `hint-glow` |
| `share` `whole` | `solSel('.share-opt','k',ans)` | `hint-glow` |
| `ladybugs` `count`, `double`, `half` | `solSel('.lb-opt','v',réponse)` | `hint-glow` |
| `ladybugs` `complete` | aucun bouton de réponse : la réponse est un nombre de points | `#lb-right` contient exactement n `.lb-dot` (dessinés par `fx.run`), `#lb-stage` a `hint-glow` |

## Politique pour les autres jeux (suites hors de cette track)

- **Exemptés pour toujours** (`EXPLAIN_NEVER`) : `memory` (une erreur est le jeu lui-même, `loseLife(null)` sans réponse touchée, `memory.js:89`) et `simon` (le jeu rejoue déjà la séquence après une erreur, `simon.js:114-121`).
- **Exemptés en attente** (`EXPLAIN_EXEMPT`, 18 jeux, `EXPLAIN_EXEMPT_MAX = 18` à la fin de cette track ; la liste ne peut que diminuer, chaque suite qui écrit les explications d'un jeu l'en retire et baisse le maximum) : `diff`, `sequence`, `reading`, `determinants`, `volume`, `calendar`, `shapes`, `planets`, `jigsaw`, `nesting`, `cubes`, `shelf`, `recipe`, `rhythm`, `pitch`, `lifecycle`, `potions`, `mirror`. C'est la liste après la phase 2 : la phase 1 y ajoute provisoirement `puzzle`, `money`, `packs`, `share`, `ladybugs` (23 jeux, `EXPLAIN_EXEMPT_MAX = 23`), que la phase 2 retire.
- **Règles d'écriture**, communes à tous les jeux : une phrase de 3 à 12 mots qui dit **pourquoi** la réponse touchée ne va pas (ce qu'elle est, ou la règle qu'elle ne suit pas), puis, si la question est remplacée, la bonne réponse ; un geste sur ce qui est déjà à l'écran (`glow`, `marks`, `strike`, `fill`, `html` court) ; jamais d'animation nouvelle ; jamais « non », « faux », « raté » ; tutoiement, présent. En lecture (`reading`), on ne lit pas à voix haute le mot cible à la place de l'enfant tant que la question continue ; ici elle est remplacée, donc l'explication peut nommer l'image et montrer la première lettre des deux mots.
- **Suites** (hors de cette track, voir « Hors périmètre ») : chaque suite écrit sa table selon les règles ci-dessus avant le code, retire ses jeux de `EXPLAIN_EXEMPT` et baisse `EXPLAIN_EXEMPT_MAX`. Pour `nesting` et `mirror`, l'explication remplace la phrase précise existante (`nesting.js:116-119`, `mirror.js:132`).
- **Nouveaux jeux** (saison 3 et suivants) : jamais exemptés. Ils ont leurs explications dès leur PR (ligne ajoutée à la checklist). Si un nouveau jeu est déjà sur `main` quand la phase 1 de cette track est livrée, la phase 1 écrit ses explications selon les règles ci-dessus.

## Ordre de livraison avec `revision-espacee`

Règle en miroir de [la spec de revision-espacee](../revision-espacee_20261122/spec.md) : aucune des deux tracks ne teste à l'exécution si l'autre existe ; la track livrée **en second** fait le câblage.

- **Cas 1 : `revision-espacee` n'est pas livrée (sa phase 2) sur `main` quand cette track est implémentée.** Rien à câbler : `loseLife` n'a pas de mode manche. `revision-espacee` câblera `explainShow` dans ce mode à sa livraison.
- **Cas 2 : `revision-espacee` phase 2 est déjà livrée (le moteur exporte `setRoundHandlers`).** La phase 1 de cette track ajoute, dans la branche manche de `loseLife` : `const shown = el !== null && opts.wrong !== undefined && explainShow(opts.wrong)` ; si `shown`, la bonne réponse de repli ne brille pas, la phrase « Regarde, c'était celle-ci. » n'est pas dite, et `onWrong` est appelé `EXPLAIN_MS` après l'erreur (au lieu de `REVIEW_SHOW_MS`) ; sinon, la branche de repli inchangée. Test ajouté à `test/explications.test.js` : une question de souvenirs de `math` ratée montre `.explain-bubble`, ne dit pas la phrase de repli, et passe à la suite `EXPLAIN_MS` après ; une question de `reading` (exempté) garde le repli.

## Décisions

| Id | Décision | Pourquoi | Source |
|---|---|---|---|
| D1 | Le contrat s'appelle `registerExplain` et vit dans la slice `hints` | Même forme que `registerHints`, même question (`hint.q`), mêmes effets (`applyHintFx`) ; le moteur importe déjà `hints` | `js/features/hints/hints.js:17-29`, `:41-44`, `:278-306` ; `engine.js:43` |
| D2 | La mauvaise réponse est passée explicitement (`loseLife(el, { wrong })`) | Le moteur ne connaît que le bouton ; `share` a besoin de trois données du bouton | `engine.js:112` ; `share.js:178`, `:230` |
| D3 | L'explication montre la bonne réponse de la question **ratée** quand cette question est remplacée | Donner la bonne réponse avec l'explication est plus efficace que « faux » seul (0,49 et 0,32 contre 0,05) ; aucune devinette possible, la question disparaît ; chez les petits, l'effet du rappel dépend d'un retour immédiat | https://people.acer.org/en/publications/effects-of-feedback-in-a-computer-based-learning-environment-on-s/ ; https://www.ncbi.nlm.nih.gov/pmc/articles/PMC6110808/ |
| D4 | Jamais la réponse quand la question continue (`puzzle`) | La règle des indices : la réponse n'est jamais donnée tant qu'il faut la trouver | `hints.js:8-12` |
| D5 | La question suivante n'est jamais identique à la ratée | Sinon l'explication donnerait la réponse de la question suivante ; `count`, `math`, `compare`, `calc`, `clock`, `money` peuvent aujourd'hui retirer la même | `count.js:27`, `math.js:50`, `compare.js:33-42`, `calc.js:65`, `clock.js:60-62`, `money.js:41-43` ; modèle `packs.js:79-87` |
| D6 | `EXPLAIN_MS = 4000`, `say` de 3 à 12 mots | Le brief fixe 4 s au plus ; la voix parle à 0,92 et `speak` coupe la phrase précédente quand la consigne suivante est lue | brief du parent ; `js/shared/ui/voice.js:125-128` ; `screen.js:50-58` |
| D7 | Pendant l'explication, tous les boutons de la fenêtre sont désactivés (sauf 🔈) | Aujourd'hui, pendant les 0,9 s, la bonne réponse reste touchable ; avec 4 s et la réponse qui brille, ce serait une victoire gratuite | `engine.js:103-110`, `:141-144` |
| D8 | Aucun effet visuel nouveau : seulement `hint-glow`, `hint-mark`, `hint-strike`, une case remplie et la bulle | Les détails décoratifs nuisent à l'apprentissage | https://news.wsu.edu/2020/03/19/seductive-details-inhibit-learning/ ; `hints.css:204`, `:218`, `:246` |
| D9 | L'explication vide la file de paroles de l'équipe (`hintPolicy.onExplain` branché sur `teamSayClear`) | Une seule voix : `teamHintSpoken` reprendrait la bulle après `HINT_HOLD_MS` (3500 ms), avant la fin des 4 s, et `speak` couperait l'explication ; la consolation de Grisou (2 erreurs d'affilée) est donc abandonnée quand une explication est dite | `specialties.js:61-62`, `:108-129`, `:141-154` ; `voice.js:125` |
| D10 | Pas d'explication à plusieurs ni sur un temps écoulé | À plusieurs, une erreur passe la main tout de suite ; sur un temps écoulé, rien de faux n'a été touché | `engine.js:115-119`, `:236-240` |
| D11 | L'écran « Raté ! » attend la fin de l'explication | Sinon la dernière explication serait coupée à 520 ms | `engine.js:157-160` |
| D12 | Phrases de réussite au passé composé, qui nomment l'action ; les éloges « fort », « champion », « malin » sont remplacés | Éloge du processus plutôt que de la personne ; changement peu coûteux mais à l'effet modeste | PubMed 9686450 (Mueller et Dweck 1998) ; https://pubmed.ncbi.nlm.nih.gov/29505339/ ; `engine.js:430-437` |
| D13 | Le garde est un nouveau fichier `test/explications.test.js`, sur le modèle du garde des indices | Le lanceur trouve tout seul un nouveau test ; même harnais (temps ×0,1, voix notée) | `test/companions.test.js:1-40`, `:222-228` ; `AGENTS.md` (« Un nouveau fichier de test est trouvé tout seul ») |
| D14 | `memory` et `simon` exemptés pour toujours | Pas de réponse fausse à expliquer (`memory`) ; la séquence est déjà rejouée (`simon`) | `memory.js:89` ; `simon.js:114-121` |
| D15 | Les énigmes d'histoire gardent la phrase générique | Hors des mini-jeux, hors de cette track | `js/features/story/story.js:557` |
| D16 | Pas de bouton « passer » pendant les 4 s | Moins d'éléments à l'écran ; défaut du rédacteur, à juger à la revue (ligne S12) | défaut |
| D18 | Cette track livre les phases 1, 2 et 3 en trois PR (`release patch`, `release patch`, `release track`) ; les autres jeux sont des suites hors périmètre | Garder une track de taille M, livrable par morceaux | défaut de Claude, à juger à la revue par Amrou |
| D19 | Aucune couche stricte touchée : tous les fichiers de la track sont dans `js/features` (vérifiés par `tsc -p .`, pas par `tsconfig.strict.json`). Le champ `onExplain` s'ajoute au type JSDoc de `hintPolicy` (`onExplain: ((kind: string) => void) \| null`) ; `bun run typecheck` reste vert | Les règles de types de la checklist s'appliquent quand même au JavaScript vérifié | `tsconfig.strict.json` ; `js/features/hints/hints.js:79-92` ; `conductor/checklist-mini-jeu.md` |
| D17 | La bulle d'explication est un élément distinct `.explain-bubble`, au même endroit que la bulle d'indice, avec la même apparence | `showHint` cherche `.hint-bubble` : une classe distincte évite qu'un indice réécrive l'explication | `hints.js:245-269` ; `hints.css:116-160` |

## Politiques

- **Arbitrages** : l'explication passe avant la phrase générique (jamais les deux) ; l'anti-devinette gagne toujours (question remplacée après l'explication, jamais la même, aucune réponse touchable pendant) ; un indice déjà affiché est retiré de l'écran pendant l'explication (`.hint-bubble` supprimée) et le niveau d'indice repart à zéro avec la nouvelle question, comme aujourd'hui (`hints.js:121-126`) ; les essais se comptent comme avant (une explication ne coûte ni ne rend d'essai) ; le minuteur s'arrête pendant l'explication et repart avec la question suivante (`startTimerIfNeeded` du rendu).
- **Défauts** : constantes `EXPLAIN_MS = 4000`, `EXPLAIN_EXEMPT_MAX = 18` ; pas de réglage parent ; aucune dépendance ; une explication qui lève une exception est ignorée (`try`/`catch` dans `explainShow`, avec commentaire, puis comportement d'avant) ; les nombres sont écrits en chiffres dans `say` (la voix les lit) ; les signes `+ − × =` n'apparaissent que dans `fx.html` et `fx.marks`.
- **Référence visuelle** : la bulle reprend l'apparence de `.hint-bubble` (tête du compagnon `think`, texte), sans le numéro « 💡 n » ; règle CSS partagée `.hint-bubble, .explain-bubble` dans `js/features/hints/hints.css`. Les étiquettes, la brillance et le barré sont ceux des indices (`hints.css:204-260`). La case remplie `.eq-q.filled` reprend le style de la bonne réponse trouvée (`math.js:95-98`).
- **Textes** : tous écrits dans les tables ci-dessus ; les jeux des phases 4 à 7 suivent les règles d'écriture de la section « Politique et phasage ».
- **Détails non écrits** : l'agent prend l'option la plus simple, la note dans le journal de décisions du plan, l'humain juge à la revue.

## Hors périmètre

- Les explications des 18 jeux en attente : suites à faire, suivies par la liste `EXPLAIN_EXEMPT` qui ne peut que diminuer. Regroupement suggéré : lecture et langage (`reading`, `determinants`, `sequence`, `diff`) ; formes et espace (`shapes`, `jigsaw`, `nesting`, `cubes`, `shelf`, `mirror`) ; mesures et sciences (`calendar`, `volume`, `recipe`, `planets`, `lifecycle`, `potions`) ; musique (`rhythm`, `pitch`). Elles suivent la politique d'écriture de la section « Politique pour les autres jeux ».
- Les énigmes d'histoire, le mode à plusieurs.
- Les clips audio pré-enregistrés (track `voix-naturelle`) : les explications sont des phrases à trous, dites par `speak` ; la track de la voix décide de leur traitement.
- La révision espacée des questions ratées (track `revision-espacee`) ; le câblage entre les deux suit « Ordre de livraison avec `revision-espacee` ».
- Toute mesure d'efficacité auprès de l'enfant (aucune analytique dans le jeu).

## Contrats partagés

| Contrat | Forme (ou lien) | Propriétaire | Consommateurs |
|---|---|---|---|
| `registerExplain(key, { wrong, right })` | section « Le contrat » | slice `hints` | chaque mini-jeu |
| `loseLife(el, { onRetry, disable, wrong })` | `wrong` : la mauvaise réponse, forme propre à chaque jeu (tables) | `minigame-engine` | chaque mini-jeu |
| `explainShow`, `explainClear`, `strategyLine`, `EXPLAIN_MS` | section « Le déroulé » | `hints`, `minigame-engine` | moteur ; track `revision-espacee` |
| `hintPolicy.onExplain(kind)` | `hints.js:92-103` + un champ | `hints` | `companion-team` |
| `winPraises(who)` | tableau de 6 phrases | `minigame-engine` | écran de victoire, test |

## Surface d'attaque

Aucune : pas d'entrée nouvelle. Les textes affichés sont construits à partir des valeurs de la question (nombres, mots de `EMOJI_WORDS`), jamais du prénom ni d'une saisie.

## Zones sensibles touchées

Aucune.

## Smoke test

🤖 : un agent la prouve et joint la preuve. 👤 : seul l'humain peut juger (rendu, ressenti, téléphone).

| Id | Qui | Étapes | Attendu | Niveau visé |
|---|---|---|---|---|
| S1 | 🤖 | `bun run test explications` : table de chaque jeu (ligne 14) | chaque `say` exact, `fx` conforme | test-verified |
| S2 | 🤖 | même test : 3 parties par palier et par jeu de la phase, une erreur chacune (ligne 18) | bulle, voix, verrou, réponse qui brille, relance à 4 s, autre question, jeu gagnable | test-verified |
| S3 | 🤖 | `puzzle` : erreur à chaque rang | jamais `seq[idx]` dans `say`, verrou levé après 4 s | test-verified |
| S4 | 🤖 | `count` au palier 5 (1 essai) : une erreur ; en phase 2, `puzzle` au palier 5 | « Raté ! » après 4 s, pas avant | test-verified |
| S5 | 🤖 | `party.active = true` ; temps écoulé | aucune bulle | test-verified |
| S6 | 🤖 | jeu exempté (`reading`) : erreur | phrase générique possible, relance à 900 ms | test-verified |
| S7 | 🤖 | garde : jeu sans explication ni exemption ; exempté qui en a | le test échoue avec le nom du jeu (essai à la main, puis annulé) | test-verified |
| S8 | 🤖 | victoire dans chaque jeu de la phase 3 | `.win-how` avec la phrase de la table, dite après l'éloge | test-verified |
| S9 | 🤖 | `bun run check` | vert | test-verified |
| S10 | 👤 | téléphone, voix de l'appareil : 5 erreurs en `math` et `clock` | la phrase est dite en entier avant la consigne suivante | runtime-verified |
| S11 | 👤 | Amrou et sa fille, 10 minutes de jeu | l'enfant comprend l'explication, ne la vit pas comme une punition | runtime-verified |
| S12 | 👤 | idem | les 4 s sans bouton « passer » ne l'agacent pas (sinon, nouvelle décision) | runtime-verified |

## Questions ouvertes
