---
status: brouillon        # brouillon | validée | faite ; « validée » est posé par l'humain
issue: 0
size: M                  # chaque phase est une PR de taille M ; la track entière (L) est découpée en 3 phases
migration: true          # nouveau champ d'état state.season3Done (phase 3)
sensitive: true          # sauvegarde, espace parents, PWA (régénérée), manifeste des slices
files:
  - js/features/xylophone/xylophone.js
  - js/features/xylophone/xylophone.css
  - js/features/xylophone/index.js
  - js/features/minigames/notes/notes.js
  - js/features/minigames/notes/notes.css
  - js/features/minigames/notes/index.js
  - js/features/minigames/melody/melody.js
  - js/features/minigames/melody/melody.css
  - js/features/minigames/melody/index.js
  - js/features/story/finale3.js
  - js/features/story/story.js
  - js/features/story/episodes.js
  - js/features/story/story.css
  - js/features/story/index.js
  - js/features/island/island.js
  - js/features/island/island-view.js
  - js/features/music/music.js
  - js/features/parents/parents.js
  - js/features/adaptive/adaptive.js
  - js/entities/difficulty/difficulty.js   # LIVES_TABLE, GENEROUS_KINDS, NO_TIMER_KINDS, export de tierValue
  - js/entities/difficulty/rounds-saison3.js
  - js/entities/difficulty/game-types.js
  - js/entities/world/worlds.js
  - js/entities/character/characters.js
  - js/entities/character/characters-art-saison3.js
  - js/entities/item/items.js
  - js/entities/squishy/squishies.js
  - js/features/squishies/squishy-art.js
  - js/entities/game-state/state.js
  - js/shared/styles/design-system-v21.css
  - js/slices.cjs
  - js/app/main.js
  - js/entities/difficulty/index.js
  - test/concert.test.js
  - test/games.test.js
  - test/musique.test.js
  - test/companions.test.js
  - test/smoke.test.js
  - test/squishies.test.js
  - test/licornes.test.js
taster: { facts: 0, decisions: 0, rounds: 11 }
---

<!-- Gabarit cothon 0.4.0 (setting-up-docs), adopté dans Conductor (cothon 0.2.0-2 et 0.4.0-6). -->

# Spec : 🎼 L'Île du Grand Concert (saison 3, île 5, grand final)

- Nouveau projet : non
- L'île : `concert`, emoji 🎼, niveau d'ouverture **102**. Règle et tableau de tous les niveaux : `conductor/niveaux.md`.
- Proposition de Claude, pour le souhait « musique et notes » de la joueuse. Décision d'Amrou du 22/11/2026 (brief de la saison 3, tableau des îles).
- **Prérequis :** les phases 1 et 2 (les deux mini-jeux) n'ont aucun prérequis. La phase 3 (l'île) attend que la track `saison3-ouverture` soit livrée (troisième archipel `ARCHIPELAGOS[3]`, `refreshArchipelagos()`, `shownArchipelagos()`, `SEASON_OPENINGS`, `STORY_PROLOGUES[3]`, carte de Zap `ZAP_MAP_PIECES`, `zapMapFound()`, `zapMapPieces()`, `zapMapSVG(zapMapFound(), { fresh: id })`, `zapMapSay(n)`, `.story-zapmap`) **et** que `js/entities/character/characters-art-saison3.js` et `characters-art-kit.js` existent (préparés par `saison3-ouverture`), **et** que les quatre îles précédentes soient dans `WORLDS` : `crayons`, `dumplings`, `coffres`, `chatouilles` (tracks `monde-crayons`, `monde-dumplings`, `monde-coffres`, `monde-chatouilles`).
- Suivre `conductor/checklist-ile.md` et `conductor/checklist-mini-jeu.md` en entier. Noms et personnages : à relire avec la joueuse (ligne S14 du smoke test).

## Problème

La joueuse aime la musique et veut « des notes ». L'Île de la Musique (saison 2) travaille déjà le rythme (`rhythm`) et le grave ou l'aigu (`pitch`), mais rien ne lui apprend le nom des notes, leur place sur une portée, ni à rejouer une petite mélodie. La saison 3 a aussi besoin de sa fin : la carte au trésor de Zap, complète, doit mener quelque part. Cette île est le grand final : une scène en plein air où tous les amis de l'expédition préparent un grand concert, deux mini-jeux de notes, et un trésor qui se joue, le **xylophone d'or**.

**Pour le parent (à reprendre tel quel dans le PRD, sans le survendre) :** ces jeux apprennent la musique pour elle-même : écouter, nommer do ré mi, lire quelques notes, rejouer un petit air. On ne promet pas qu'ils aident en mathématiques ou en lecture : la plus grande synthèse disponible (Sala et Gobet, 2020, 54 études, près de 7 000 enfants) ne trouve aucun effet de l'apprentissage musical sur les autres matières quand les études sont bien construites ([PMC7683441](https://pmc.ncbi.nlm.nih.gov/articles/PMC7683441)). La musique vaut pour le plaisir et pour ce qu'elle est.

## Comportement attendu

### Phase 1 : le xylophone partagé et le mini-jeu « Do, ré, mi » (`notes`)

1. Étant donné la slice `xylophone`, quand on lit `XYLO_NOTES`, alors elle contient exactement les 8 lignes de la table « Les 8 lames » (politiques), dans l'ordre, avec ces noms, fréquences et couleurs.
2. Étant donné `xyloHTML({ lames: [0, 2, 4] })`, quand on l'insère, alors on voit 3 boutons `.xylo-lame` avec `data-n` 0, 2, 4, rangés de gauche (grave) à droite (aigu) dans l'ordre du DOM, chacun avec un style en ligne `height: Hpx` posé par `xyloHTML` (formule de « Les 8 lames ») ; le test lit `el.style.height` et vérifie 170, 152.86 et 135.71 px, donc chaque lame plus courte que celle de gauche ; chacun avec son nom écrit dans un `<b class="xylo-name">` et un `aria-label` « Lame do », « Lame mi », « Lame sol ».
3. Étant donné une lame affichée, quand on la touche (événement `click`, seul événement branché, voir D22), alors `playNote` est appelé avec la fréquence de sa ligne dans `XYLO_NOTES` et la lame reçoit la classe `lit` pendant 200 ms, même si le son est coupé (la classe arrive quand même).
4. Étant donné `staffSVG([3], { lines: 5, colors: false })`, quand on l'insère, alors le SVG a 5 lignes de portée aux ordonnées 88, 72, 56, 40, 24 et une tête de note `.note-head` `data-n="3"` de centre `cy = 80`, remplie de `#2B2F6B`. Avec `[0]`, il y a en plus un petit trait (ligne supplémentaire) à `y = 104`. Avec `lines: 3`, seules les lignes 88, 72, 56 sont tracées. Avec `colors: true`, la tête prend la couleur de sa lame.
5. Étant donné le jeu `notes` à chaque palier 1 à 5, quand il s'ouvre, alors `#notes-stage` porte `data-ask` et les lames ou cases de la table « `notesRound` » (politiques), et la consigne affichée et lue est celle de la table « Textes de `notes` ».
6. Étant donné `notes` au palier 1, quand il s'ouvre, alors la note cible est jouée une fois après 400 ms, un ♪ `.notes-heard` est affiché avec `data-n` égal à la cible et un style en ligne `color` égal à la couleur de la cible dans `XYLO_NOTES` (le test lit `el.style.color` et le compare à la colonne « En `rgb` » de la table « Les 8 lames », règle « Couleurs dans les tests ») (le jeu se joue sans le son), et le bouton `#notes-listen` « 🔈 Écouter » rejoue la note.
7. Étant donné `notes` à n'importe quel palier, quand l'enfant touche la bonne réponse, alors la mission est gagnée par `winSoon()`. Au palier 4, toucher l'une ou l'autre lame « do » est juste quand la cible est un do.
8. Étant donné `notes` au palier 1 (essais illimités), quand l'enfant touche une mauvaise lame, alors la lame joue sa note, le moteur dit son indice d'erreur, et une **autre** question arrive (cible différente de la précédente) : anti-devinette par `loseLife(el, { onRetry: renderNotes, disable: false })`.
9. Étant donné `notes`, quand deux questions se suivent, alors leurs cibles sont différentes (jamais deux fois la même note d'affilée).
10. Étant donné `notes` au palier 5, quand il s'ouvre, alors on voit 5 boutons `.notes-find`, chacun avec une petite portée de 5 lignes et une seule note, 5 notes toutes différentes, dont la cible, et jamais les deux do ensemble.
11. Étant donné `notes`, quand on demande les indices, alors il y en a 2, distincts, ceux de la table « Indices », sans aucune réponse écartée.
12. Étant donné les tables du jeu, alors `notes` est dans `GAME_TYPES`, dans la tranche `max: 5` de `AGE_GAME_TYPES` (pas dans `max: 4`), dans `GAME_LIST` (`🎹`, « Do, ré, mi »), dans `NO_TIMER_KINDS`, dans la liste des jeux généreux de `livesFor`, et a sa phrase dans `PROGRESS_CHEERS`.
13. Étant donné l'espace parents, alors `SKILL_GROUPS` a un groupe `{ id: 'musique', emoji: '🎵', name: 'Musique' }` placé après le groupe `logique` (test : son indice est plus grand que celui de `logique`, pas « le dernier », pour rester vrai si un groupe s'ajoute plus tard), qui contient `rhythm`, `pitch` et `notes` ; le groupe `logique` ne contient plus `rhythm` ni `pitch`.
14. Étant donné une sauvegarde qui a déjà `state.skills.rhythm` et `state.skills.pitch`, quand on ouvre l'espace parents, alors le `.sk-group` dont le `h4` contient « Musique » contient les `.sk-row` de « Le rythme magique » et « Grave ou aigu ? », dont le `.sk-detail` dit le même nombre de réussites que `state.skills` ; aucune migration (`SAVE_VERSION` inchangé par la phase 1).
15. Étant donné `test/games.test.js`, alors `notes` est joué jusqu'à la victoire à chaque palier 1 à 5 avec un solveur qui recalcule la réponse depuis le dessin (position de la note ou ♪), pas depuis `gameSolution`.

### Phase 2 : le mini-jeu « La mélodie » (`melody`)

16. Étant donné `melody` à chaque palier 1 à 5, quand il s'ouvre, alors la mélodie tirée appartient à la liste de ce palier (table « Mélodies »), a la longueur du palier, et les lames affichées sont celles de la table « `melodyRound` ».
17. Étant donné `melody` aux paliers 1 à 3, quand il s'ouvre, alors la mélodie est jouée (une note toutes les 650 ms, à partir de 500 ms), chaque lame s'allume (`lit`) quand sa note sonne, `#melody-state` dit « 👂 Écoute… » et porte `data-turn="listen"`, les touches sont ignorées pendant l'écoute (aucun son, aucune erreur), puis l'état devient « 👆 À toi ! » (« 👆 À toi ! Tu t'en souviens ? » au palier 3) avec `data-turn="you"` à `500 + n × 650` ms.
18. Étant donné `melody` aux paliers 1 et 2, quand l'écoute est finie, alors aucune `#melody-score .ml-note` n'a la classe `covered` et chacune garde son style en ligne `background` (couleur de sa lame : le test compare `el.style.backgroundColor` à la colonne « En `rgb` ») et `bottom` (`10 + n × 10` %, le test lit `el.style.bottom`). Au palier 3, toutes les `.ml-note` reçoivent la classe `covered` et leur style en ligne devient `background: #C9CEDB; bottom: 45%` (le test vérifie la classe `covered`, `el.style.bottom === '45%'` et `el.style.backgroundColor === 'rgb(201, 206, 219)'`), et l'état dit « 👆 À toi ! Tu t'en souviens ? ».
19. Étant donné `melody` aux paliers 4 et 5, quand il s'ouvre, alors rien n'est joué (`playNote` n'est pas appelé avant le premier toucher), `#melody-staff` existe avec 5 `line.staff-line` et une `.note-head.ml-note` par note de la mélodie, d'attribut `fill` égal à la couleur de la lame au palier 4 et à `#2B2F6B` au palier 5, l'état dit « 📖 Lis la mélodie, puis joue-la ! », et l'enfant peut jouer tout de suite.
20. Étant donné `melody`, quand l'enfant joue toutes les notes dans l'ordre, alors la `k`-ième `.ml-note` de `#melody-score` reçoit la classe `done` quand la `k`-ième note est juste, `#melody-progress` contient `progressDots(pos, n)` du moteur (des `i`, ceux d'indice inférieur à `pos` avec la classe `on`, comme `simon.js:119`), et la mission est gagnée par `winSoon()` aux paliers 1 à 3. Aux paliers 4 et 5 : la mélodie est jouée une fois, une note toutes les `MELODY_READ_STEP` (300 ms) à partir de 0 ms (lames allumées), et `winSoon(melodyReadEnd(n))` est appelé tout de suite après l'avoir programmée, sur le principe de `rhythm` (`const READ_END_DELAY = 900`, `winSoon(cfg.read ? READ_END_DELAY : undefined)`, `rhythm.js:31,178`) : le délai laisse finir la dernière note avant l'écran de victoire. Constantes de `melody.js` : `MELODY_READ_STEP = 300`, `MELODY_NOTE_MS = 500` (durée d'une note, `playNote(hz, 0.5, …)`), `MELODY_END_MARGIN = 200`, et `melodyReadEnd(n) = MELODY_READ_STEP × (n - 1) + MELODY_NOTE_MS + MELODY_END_MARGIN`, soit 1 900 ms pour 5 notes (palier 4) et 2 200 ms pour 6 notes (palier 5). `winSoon` reçoit donc un délai nommé, jamais un nombre (`test/gardes.test.js`, « winSoon reçoit un délai nommé »).
21. Étant donné `melody`, quand l'enfant touche une mauvaise lame, alors la lame joue sa note, puis `loseLife(el, { onRetry: renderMelody, disable: false })` : une **autre** mélodie arrive (jamais la même deux fois d'affilée).
22. Étant donné `melody` aux paliers 1 à 3, quand on touche « 🔈 Écouter » (`#melody-listen`), alors la mélodie est rejouée depuis le début au tempo normal (une note toutes les 650 ms à partir de 500 ms ; seul l'indice 2 est lent), `#melody-state` passe à « 🔁 Écoute encore… » et `data-turn="listen"` puis revient à `data-turn="you"` et au libellé du palier à `500 + n × 650` ms, et la progression revient à 0 (`#melody-progress i.on` vaut 0, aucune `.ml-note.done`). Au palier 3, les points restent cachés pendant et après le rejeu (classe `covered` gardée, seul `done` est retiré). Aucun `#melody-listen` dans le DOM aux paliers 4 et 5.
23. Étant donné `melody`, quand on demande les indices, alors il y en a 2, distincts, ceux de la table « Indices » ; l'indice 2 rejoue la mélodie 1,6 fois plus lentement (une note toutes les 1 040 ms, à partir de 500 ms), en allumant les lames, remet la progression à 0, passe `#melody-state` à « 🔁 Écoute encore… » et `data-turn="listen"` (touches ignorées, à tous les paliers, y compris 4 et 5), puis le rend à `data-turn="you"` à `500 + n × 1 040` ms avec le libellé du palier.
24. Étant donné les tables du jeu, alors `melody` est dans `GAME_TYPES`, dans la tranche `max: 5` de `AGE_GAME_TYPES`, dans `GAME_LIST` (`🎶`, « La mélodie »), dans `NO_TIMER_KINDS`, dans `LIVES_TABLE` (`{ 2: 3, 3: 3, 4: 2, 5: 2 }`), dans `PROGRESS_CHEERS`, et dans le groupe parents `musique`.
25. Étant donné `test/games.test.js`, alors `melody` est joué jusqu'à la victoire à chaque palier 1 à 5, avec un solveur qui relit la mélodie depuis `#melody-score` (`data-n` des points, ou `cy` des têtes de note).

### Phase 3 : l'île, son histoire, le grand final et le xylophone d'or

26. Étant donné `WORLDS.concert`, alors il a exactement les champs de la table « L'île » (politiques), `level: 102`, `saison: 3`, `diff: 6`.
27. Étant donné un enfant au niveau 101, quand il réussit la mission qui le fait passer au niveau 102, alors l'île s'ouvre sur la carte de la saison 3, avec son chapitre puis l'écran « Nouvelle île » (mécanisme existant). En dessous du niveau 102, toucher l'île dit qu'elle s'ouvrira plus tard (mécanisme existant).
28. Étant donné l'âge du profil, quand on lance le jeu favori de l'île, alors c'est `notes` avant 7 ans et `melody` à 7 ans et plus.
29. Étant donné les données de l'île, alors les 4 personnages, 8 objets, 2 recettes, 5 décorations, la série de 6 squishies « Concert », les thèmes `MUSIC_THEMES.concert` et `MUSIC_THEMES['concert-fete']`, le thème CSS `body[data-world="concert"]`, le paysage `ISLE_SCENERY.concert`, le chapitre `STORY.concert` et les 3 épisodes `EPISODES.concert` existent, avec exactement les valeurs écrites dans les politiques.
30. Étant donné chaque personnage de l'île, alors `favoritesOf(id)` renvoie 2 objets de l'île, et au moins 3 objets de l'île ne sont dans le butin de personne.
31. Étant donné `state.coins = 0`, `state.storySolved = { crayons: true, dumplings: true, coffres: true, chatouilles: true }` et `storyWin('concert')`, quand on le joue, alors on gagne 20 pièces et une boîte de la série `concert`, `state.storySolved.concert === true`, `zapMapPieces() === 5`, la fenêtre montre `.story-zapmap.happy svg.zap-map[data-found="5"]` et la voix ajoute `zapMapSay(5)` à la phrase de victoire (mécanisme de `saison3-ouverture`) ; puis « Continuer l'aventure ✨ » ouvre le grand final de la saison 3. Un second `storyWin('concert')` ne redonne pas la boîte. Avec seulement `{ crayons: true }` résolu avant, `zapMapPieces() === 2` et la fenêtre montre `data-found="2"` : rien n'est stocké pour la carte en dehors de `state.storySolved`.
32. Étant donné le grand final, quand il s'ouvre, alors `state.season3Done` passe à `true` et la sauvegarde est écrite **avant** la première scène (fermer en route ne fait rien perdre), l'événement `season3:done` est émis, et `music:theme` est émis avec `'concert-fete'`. Le test écoute les événements par `on` (exposé par le bundle de test, comme les autres noms) : `ev('window.__th = []; on("music:theme", (k) => window.__th.push(k)); on("season3:done", () => window.__th.push("done"))')`, puis lit `window.__th`.
33. Étant donné le grand final, quand l'enfant touche `#finale3-next` trois fois (libellé « Suite ➡️ » aux scènes 1 et 2, « Mon trésor 🎁 » à la scène 3), alors il voit les 3 scènes (textes de la table « Le grand final »), puis l'écran du xylophone d'or avec `#finale3-play` « 🎼 Jouer maintenant » et `#finale3-later` « Plus tard ». Comme en saison 2, c'est un seul bouton `#finale3-next`, ré-rendu à chaque scène avec un nouveau gestionnaire (`js/features/story/finale.js:82` pour le bouton, `:86-92` pour son gestionnaire).
34. Étant donné l'écran du trésor, quand il touche « 🎼 Jouer maintenant », alors le xylophone d'or s'ouvre ; quand il y touche « Fini ✨ », alors `.reward-box.finale-done` s'affiche avec le `h2` « La Grande Expédition ✅ » ; `#finale3-end` « Continuer ✨ » ferme la fenêtre (`#overlay` perd `show`) et le dernier `music:theme` émis vaut `null`.
35. Étant donné `state.season3Done === true`, quand l'enfant résout de nouveau le chapitre `concert`, alors le grand final ne se rejoue pas.
36. Étant donné `state.season3Done === true`, quand on ouvre « 📖 Mon histoire », alors le `h3` de `.story-season[data-saison="3"]` contient `span.done`, et la section a deux boutons : « Revoir le grand final » (`data-finale="3"`) et « 🎼 Mon xylophone d'or » (`data-xylo`). Revoir le final montre les 3 scènes puis « La Grande Expédition ✅ », sans l'écran du trésor et sans rien redonner.
37. Étant donné `state.season3Done === false`, alors ni le journal ni Stella ne proposent le xylophone d'or.
38. Étant donné `state.season3Done === true`, quand on parle à Stella, alors son dialogue a un bouton « 🎼 Le xylophone d'or » (`#btn-xylo`) qui ouvre le xylophone d'or.
39. Étant donné le xylophone d'or ouvert hors du final, alors `.xylo.xylo-gold#xylo-gold` contient 8 `.xylo-lame` de `data-n` 0 à 7, chaque `click` appelle `playNote` avec la fréquence de la lame et ajoute un `.xylo-float` (♪) dans `#xylo-gold`, retiré au plus tard 900 ms après, rien n'est compté (ni mission, ni pièce, ni compétence), `music:theme` est émis avec `'concert'` à l'ouverture et avec `null` une seule fois (le test compte les `null` dans `window.__th`, même espion qu'au 32) (un seul `emit('music:theme', null)`), qu'on le quitte par « Fini ✨ » qui rouvre une autre fenêtre, par la fermeture de la fenêtre, ou parce qu'une autre fenêtre le remplace.
40. Étant donné le journal avec `season2Done` et `season3Done` vrais, quand on touche le premier `[data-finale]` du DOM, alors c'est le final de la saison 2 qui s'ouvre (le test existant `test/licornes.test.js` reste valable sans modification).
41. Étant donné une sauvegarde de la version précédente (sans `season3Done`), quand elle est chargée, alors `state.season3Done === false` et tout le reste est identique ; `SAVE_VERSION` vaut la version précédente plus un ; `freshState().season3Done === false`. Après `state.season3Done = true; save()`, un rechargement du jeu dans une nouvelle page (même méthode que `test/redemarrage.test.js`) garde `season3Done === true`.
42. Étant donné une sauvegarde importée où `season3Done` vaut autre chose qu'un booléen, quand le jeu la lit, alors il la traite comme `!!season3Done` partout (jamais d'erreur JS).
43. Étant donné le paysage de l'île (`#scene`, rendu par `renderLiveIsland`), quand `state.season3Done` est vrai, alors le SVG contient `g.ls-xylo-or` avec exactement 8 `rect.ls-xylo-lame` et aucun `g.ls-drap` ; sinon, il contient `g.ls-drap` (le drap violet et un `text` « ? ») et aucun `g.ls-xylo-or`. Jamais les deux à la fois.

## Décisions

| Id | Décision | Pourquoi | Source |
|---|---|---|---|
| D1 | Le jeu `notes` commence par associer une note entendue à sa lame (palier 1) avant de nommer (2) puis de lire (3 à 5). | Le contour mélodique et la hauteur relative sont perçus très tôt (dès 3 mois, l'enfant repère une note qui casse le contour d'une mélodie) ; le nom et la lecture viennent après. L'ordre « nommer avant lire » est un défaut du rédacteur, à juger à la revue. | https://pmc.ncbi.nlm.nih.gov/articles/PMC6581289 (Lau et coll., 2017) |
| D2 | La table des 8 notes (do4 à do5, gamme de do majeur) vit dans la nouvelle slice `js/features/xylophone/` (`XYLO_NOTES`), pas dans `SOUND_NOTES`. | `SOUND_NOTES` est la palette des bruitages, volontairement pentatonique (sans fa ni si) pour que deux sons ne fassent jamais de fausse note ; `playNote` joue déjà n'importe quelle fréquence exacte. | `js/shared/ui/sound.js:224-241`, `js/shared/ui/sound.js:338-354` |
| D3 | Fréquences au tempérament égal, la4 = 440 Hz, formule de `pitch` ; écrites arrondies au centième. | Même formule que le jeu existant. | `js/features/minigames/pitch/pitch.js:43` (`pitchHz`) |
| D4 | Une slice `xylophone` (couche features), déclarée dans `js/slices.cjs` juste après `hints`, partagée par `notes`, `melody`, le final et l'île. | Une slice n'importe que des slices placées avant elle : elle a besoin de la slice `screen` et doit précéder les slices `story`, `island` et `minigame-engine` (ordre du tableau `SLICES`). | `js/slices.cjs` (en-tête du fichier et entrées `id: 'screen'`, `'hints'`, `'story'`, `'island'`, `'minigame-engine'`) |
| D5 | Lames rangées du grave (gauche) à l'aigu (droite), la plus grave la plus longue. | Repère visuel qui ne dépend ni du son ni de la couleur, comme les cloches de `pitch` (grande et grave, petite et aiguë). | `js/features/minigames/pitch/pitch.js:45-46` (`bellSize`) |
| D6 | Couleurs des lames : celles des tubes sonores pour enfants (do rouge, ré orange, mi jaune, fa vert, sol turquoise, la bleu, si violet, do aigu rouge), jamais seules : nom écrit et longueur de lame. | Repère courant dans les classes ; règle du jeu : jamais la couleur seule. Choix des couleurs : défaut du rédacteur, à juger à la revue. | `conductor/tracks/monde-licornes_20261109/spec.md` (exigence « jamais la couleur seule ») |
| D7 | « Placer » une note (palier 5) se fait en touchant, parmi 5 petites portées, celle où la note est à la bonne place, et non en touchant une ligne de la portée. | Sur une portée, deux places voisines sont à 8 unités du dessin, soit environ 12 px sur un téléphone : trop fin pour un doigt. Les boutons du jeu font au moins 64 px environ. | `conductor/product-guidelines.md` (« boutons d'au moins 64 px environ ») ; géométrie de D9 |
| D8 | Une question par mission dans `notes` (comme `pitch` au palier 1) ; une mélodie par mission dans `melody`. | Même rythme de mission que les jeux de la même compétence ; l'anti-devinette relance tout le jeu (`onRetry`). | `js/features/minigames/pitch/pitch.js:169-174,186-190` |
| D9 | Portée : têtes de note pleines, sans hampe ; lignes à `y` 88, 72, 56, 40, 24 ; une note `n` à `cy = 104 - 8 n` ; do grave sur un petit trait à 104. Portée réduite (palier 3 de `notes`) : les 3 lignes du bas seulement. Pas de clé de sol. | Ces jeux n'ont pas de rythme écrit : une tête ronde suffit. La clé de sol n'apporte rien à 6 ans et son caractère Unicode (𝄞) manque dans beaucoup de polices. Défaut du rédacteur, à juger à la revue. | Positions de la portée de sol (mi sur la 1re ligne, sol sur la 2e, si sur la 3e) ; politique « Compatibilité » de `AGENTS.md` |
| D10 | Au palier 4 de `notes`, l'une ou l'autre lame « do » est acceptée quand la cible est un do ; dans `melody`, l'octave compte. | Au palier 4, la question est « quel est son nom ? » ; dans une mélodie, on rejoue un son précis. | Comportement attendu 7 et 20 |
| D11 | Pendant l'écoute de `melody`, les touches sont ignorées (comme `simon`) ; aux paliers 4 et 5, on lit avant d'entendre et la mélodie est jouée après la réussite (comme `rhythm` au palier 5). | Ne pas mélanger la note de l'enfant et celle du modèle ; même mécanique de lecture que le jeu existant. | `js/features/minigames/simon/simon.js:110-111`, `js/features/minigames/rhythm/rhythm.js:31,76-78,178` |
| D12 | `melody` diffère de `simon` et de `pitch` (voir politiques, « En quoi `melody` est différent »). | Demande du propriétaire. | `js/features/minigames/simon/simon.js:27-34`, `js/features/minigames/pitch/pitch.js:1-11` |
| D13 | Essais : `melody` comme `simon` et `rhythm` (`{ 2: 3, 3: 3, 4: 2, 5: 2 }`) ; `notes` dans les jeux « généreux ». Aucun minuteur. | Une suite à rejouer comme Simon ; une question de réflexion comme `pitch`. Règle de la saison : pas de minuteur dans les nouveaux jeux. | `js/entities/difficulty/difficulty.js:360-366,346-368,405-425` |
| D14 | Nouveau groupe parents `musique` (🎵 « Musique »), en dernier, avec `rhythm`, `pitch`, `notes`, `melody` ; `simon` reste dans « Mémoire et logique ». | Décision d'Amrou (brief du 22/11/2026, tableau des îles). `simon` travaille la mémoire d'une suite de couleurs, pas la musique. | Brief de la saison 3, décision 1 ; `js/features/parents/parents.js:45-63` |
| D15 | Ce déplacement ne demande aucune migration. | `state.skills` est rangé par jeu, pas par groupe ; les groupes ne servent qu'à l'affichage de l'espace parents. | `js/features/adaptive/skills.js:4,48`, `js/features/parents/parents.js:240-258` |
| D16 | Les deux tests de `test/musique.test.js` qui vérifient « logique » vérifient désormais `musique`, avec la même force (même `includes`), et leur libellé devient « compétence « Musique » ». | Le comportement attendu change par décision du propriétaire ; ce n'est ni affaiblir ni supprimer un test. | `test/musique.test.js:289-291,351-353` ; `AGENTS.md` (Interdits) |
| D17 | Le grand final suit le modèle de la saison 2 : un drapeau `state.season3Done`, récompenses données au début, final rejouable depuis le journal sans rien redonner, thème musical de fête par `music:theme`. | Modèle existant, déjà testé. | `js/features/story/finale.js:35-67`, `js/features/story/story.js:617-622,652-667,680-685` |
| D18 | Le xylophone d'or est possédé si et seulement si `state.season3Done` ; aucun autre champ d'état. | Un seul drapeau, une seule migration. | `js/entities/game-state/state.js:273-278` (modèle de migration v9) |
| D19 | On retrouve le xylophone d'or à deux endroits : « 📖 Mon histoire » (section de la saison 3) et le dialogue de Stella. | Le journal s'ouvre de partout (bouton de l'en-tête) et accueille déjà « Revoir le grand final » ; le dialogue d'un personnage a déjà des boutons d'action. La chambre à squishies est écartée : elle ne parle que de squishies. Défaut du rédacteur, à juger à la revue. | `js/features/story/story.js:682-688`, `js/features/island/island-view.js:334-350` |
| D20 | La scène 1 du final appelle directement `zapMapSVG(ZAP_MAP_PIECES, { fresh: 'concert' })` : la carte y est complète (avec la croix du trésor sur le 5ᵉ morceau), même si `zapMapPieces()` vaut moins de 5. Le journal et la fenêtre de victoire du chapitre continuent de montrer le vrai compte, `zapMapSVG(zapMapFound())` ; rien n'est stocké pour la carte (elle se déduit de `state.storySolved`). Un chapitre manquant se résout toujours plus tard depuis le journal, et sa pièce apparaît alors. | Même choix que la saison 2, où le final montre Grisou tout coloré quel que soit le nombre d'îles libérées ; le journal reste juste. Défaut du rédacteur, à juger à la revue. | `js/features/story/finale.js:78` (`grisouSVG(i === 0 ? 5 : 6)`) ; `conductor/tracks/saison3-ouverture_20261122/spec.md` (comportements 22 à 25 et 29) |
| D21 | Le thème `concert` est en do pentatonique (`root: 60`). | Toutes ses notes sont dans la gamme de do majeur : la musique d'ambiance ne fait jamais de fausse note avec le xylophone d'or. | `js/features/music/music.js:20-33` (`@typedef MusicTheme` et `MUSIC_THEMES`) |
| D22 | Les lames (jeux et xylophone d'or) ne se branchent que sur `click`, par `setHandler(lame, 'click', …)`. Pas de `pointerdown`, donc pas de double branchement ni d'anti-doublon à écrire. | C'est ce que font tous les mini-jeux, dont `simon` qui joue aussi une note par toucher ; la page déclare `width=device-width`, ce qui supprime le retard du clic sur les navigateurs mobiles ; les tests du harnais jouent par `el.click()`. Un `pointerdown` serait réservé à `window.PointerEvent`, que jsdom fournit : les lames ne réagiraient plus aux tests. | `js/features/minigames/simon/simon.js:109-110`, `index.html:5`, `test/games.test.js` (fonction `playToWin`, boucle `el.click()`) |
| D23 | Position sur la carte : `{ x: 50, y: 22 }`. Places de la saison : crayons `{ x: 18, y: 78 }`, dumplings `{ x: 50, y: 74 }`, coffres `{ x: 82, y: 70 }`, chatouilles `{ x: 82, y: 26 }`, concert `{ x: 50, y: 22 }`. | Sommet de la carte, l'arrivée de l'expédition ; places fixées par la coordination des cinq îles, vérifiées contre la règle du cadre et du chevauchement (écart d'au moins 24 en x ou 30 en y). | `test/smoke.test.js:1865-1882` ; décision de coordination du 22/11/2026 |
| D24 | Pas de nouvelle dépendance, pas de fichier audio : tout le son passe par `playNote`. | Règle du projet. | `AGENTS.md` (Interdits) |
| D25 | Types stricts (TypeScript, tout `js/` en mode strict) : un seul `@typedef` existant s'étend, `GameState` (`season3Done: boolean`) ; `World`, `Character`, `Item`, `CraftedItem`, `SquishySeries` et `Squishy` suffisent tels quels (aucun champ nouveau). Les nouvelles fonctions de `js/entities` (`notesRound`, `melodyRound`) ont `@param {number} dd` et `@returns` vers les nouveaux `@typedef` `NotesRound` et `MelodyRound` (forme exacte dans les politiques). Les nouveaux fichiers de `js/features` sont typés de la même façon (`XyloNote`, `@param`, `@returns`). Jamais `any` ni `@ts-ignore`. Tout `js/` est vérifié en strict par `bun run typecheck` (`strict: true` dans `tsconfig.json` depuis la v66.11). | `bun run typecheck` vérifie tout `js/` en strict depuis la v66.11 ; règle des checklists. | `js/entities/game-state/state.js:62-106`, `js/entities/world/worlds.js:6-25`, `js/entities/character/characters.js:2-15`, `js/entities/item/items.js:4-12`, `js/entities/squishy/squishies.js:20-37`, `js/entities/difficulty/difficulty.js:842`, `conductor/checklist-mini-jeu.md`, `conductor/checklist-ile.md` |
| D26 | Taille des fichiers : `max-lines` vaut 1 100 et ne se relève pas. Dessins dans `characters-art-saison3.js`, fonctions de palier et leurs `@typedef` dans `rounds-saison3.js` (créé par la première PR qui en a besoin, déclaré dans la slice `difficulty` de `js/slices.cjs` après `difficulty.js`, réexporté par `js/entities/difficulty/index.js` ; il importe `tierValue` de `./difficulty.js`, qui l'exporte s'il ne le fait pas encore). `LIVES_TABLE`, `GENEROUS_KINDS`, `NO_TIMER_KINDS` restent dans `difficulty.js` (une ligne par jeu). Estimations dans « Taille des fichiers ». | `difficulty.js` fait 1 014 lignes et `characters-art.js` 1 055 (`wc -l`, 22/11/2026) ; règle commune de la saison. | `.oxlintrc.json:40`, `conductor/checklist-ile.md` (section « 2 bis. Taille des fichiers ») |
| D27 | Le bouton « 🔈 Écouter » de `melody` rejoue au tempo de la première écoute (650 ms par note) ; seul l'indice 2 rejoue lentement. Au palier 3, les points restent cachés pendant le rejeu. | L'indice est l'aide graduée ; le bouton est une simple réécoute, et montrer les points au palier 3 retirerait l'exercice de mémoire. Défaut de Claude, à juger à la revue par Amrou. | Comportements 17, 22, 23 ; `js/features/minigames/rhythm/rhythm.js:5-7` (le rythme se cache après l'écoute aux paliers 3 et 4) |

## Politiques

- **Arbitrages**
  - Jouable sans le son passe avant la pureté de l'exercice : au palier 1 de `notes`, le ♪ prend la couleur de la note cible, même si cela permet de répondre à la couleur.
  - Anti-devinette passe avant la continuité : toute erreur relance une autre question ou une autre mélodie (`onRetry`), même au milieu d'une mélodie.
  - Le final de la saison 2 reste intact : tout changement dans `story.js` garde ses sélecteurs et identifiants actuels (`[data-finale]` du DOM pour la saison 2 devient `data-finale="2"`, toujours en premier).
  - Cette track ne réécrit rien de ce que fait `saison3-ouverture` (carte de Zap, section du journal, ouverture) : elle n'en utilise que les noms des « Contrats partagés ».
- **Défauts**
  - Constantes plutôt que réglages (temps d'écoute, tailles, couleurs : tables ci-dessous).
  - Messages d'erreur : ceux du moteur (`speakWrongHint`, `js/features/minigame-engine/engine.js:141`), le jeu n'en ajoute pas.
  - Textes : tous écrits ci-dessous. Phrases courtes, présent, tutoiement. Aucun texte ne s'accorde au genre de l'enfant.
  - Voix dans les tests : `speak()` passe chaque texte par `toSpoken()` (`js/shared/ui/voice.js:55-68`), qui retire les balises, remplace les emojis de `EMOJI_WORDS` par leur mot et supprime les autres, colle `? ! , . :` au mot d'avant et élide (`de`, `le`, `la`… devant une voyelle, `voice.js:50-52`). Le texte d'une table n'est donc pas toujours celui qui arrive dans `spoken`. Toute vérification de voix compare à `ev('toSpoken(' + JSON.stringify(texteDeLaTable) + ')')` (le bundle de test expose les noms de haut niveau, comme `ev('SKILL_GROUPS…')` dans `test/musique.test.js:291`), ou cherche un fragment sans emoji ni ponctuation (comme `/clignotent/` dans `test/licornes.test.js:345`).
  - Emojis dans les textes dits : seuls trois en ont : l'`intro` de `WORLDS.concert` (🎼), la phrase 1 de l'intro du chapitre (🎼) et son `success` (🗺️). Aucun de ces emojis n'est dans `EMOJI_WORDS` (`voice.js:7-47`) : ils sont supprimés à la lecture et ne doublent aucun mot. Les textes dits du final, du xylophone d'or et des jeux n'ont pas d'emoji. Un emoji ajouté plus tard à un texte dit doit être vérifié contre `EMOJI_WORDS`.
  - Toute lecture de `state.season3Done` passe par `!!` (ou `season3Done()`).
  - Le hasard passe par `random`, `pickRandom`, `shuffle` de `js/shared/lib`.
  - Types en JSDoc, `bun run typecheck` vert ; handlers par `setHandler`.
- **Référence visuelle**
  - Mini-jeux : l'écran de `pitch` (`js/features/minigames/pitch/pitch.js`, `pitch.css`) pour la disposition (en-tête, essais, scène, bouton 🔈 Écouter, progression).
  - Points de la partition (`melody`, paliers 1 à 3) : les points de la mélodie de `pitch` (`.pm-dot`, hauteur selon la note).
  - Grand final : les écrans de `js/features/story/finale.js` (classes `finale`, `reward-box finale-gift`, `reward-box finale-done`).
  - Personnages : le style de `ART.viola` et `ART.boumbo` (`js/entities/character/characters-art.js:864-888`).
  - Squishies : le style des entrées `SQ_ART` existantes (`js/features/squishies/squishy-art.js:55`, par exemple `licorne-etoile`).
- **Détails non écrits** : l'agent prend le défaut de la référence ou l'option la plus simple, le note dans le journal de décisions du plan, l'humain juge à la revue.

### Les 8 lames (`XYLO_NOTES`, `js/features/xylophone/xylophone.js`)

| n | name (écrit et dit) | Note | Hz | Couleur | En `rgb` (lu par les tests) | Bord |
|---|---|---|---|---|---|---|
| 0 | do | do4 (C4) | 261.63 | `#F0544F` | `rgb(240, 84, 79)` | `#A8322E` |
| 1 | ré | ré4 (D4) | 293.66 | `#FF9A3C` | `rgb(255, 154, 60)` | `#C2661A` |
| 2 | mi | mi4 (E4) | 329.63 | `#FFD93D` | `rgb(255, 217, 61)` | `#B8901A` |
| 3 | fa | fa4 (F4) | 349.23 | `#5CC96B` | `rgb(92, 201, 107)` | `#2F9551` |
| 4 | sol | sol4 (G4) | 392.00 | `#3FC1C9` | `rgb(63, 193, 201)` | `#1F8A91` |
| 5 | la | la4 (A4) | 440.00 | `#4A7BEA` | `rgb(74, 123, 234)` | `#2A4FA8` |
| 6 | si | si4 (B4) | 493.88 | `#A66FE0` | `rgb(166, 111, 224)` | `#6E3FB0` |
| 7 | do | do5 (C5) | 523.25 | `#F0544F` | `rgb(240, 84, 79)` | `#A8322E` |

- **Couleurs dans les tests** (une seule méthode) : un style en ligne (`color`, `background`) se lit par la propriété (`el.style.color`, `el.style.backgroundColor`), que jsdom rend en `rgb(r, g, b)` ; le test compare à la colonne « En `rgb` » (gris des points cachés : `rgb(201, 206, 219)`), jamais au texte de l'attribut `style`. Une couleur portée par un attribut SVG (`fill` des têtes de note, critères 4 et 19) se lit par `getAttribute('fill')` et se compare au texte hexadécimal exact de la table (`#2B2F6B` pour une note sans couleur).
- Une note se joue par `playNote(hz, 0.5, 0.2)` (même appel que `pitch.js:147`).
- Conteneur `.xylo` (dans `xylophone.css`) : `display: flex; flex-wrap: nowrap; justify-content: center; align-items: center; gap: 4px; width: 100%;`. Lame `.xylo-lame` : `flex: 0 1 64px; min-width: 36px;`, et sous 356 px d'écran `@media (max-width: 355px) { .xylo-lame { min-width: 30px; } }`. Calcul : la fenêtre fait toute la largeur de l'écran avec 20 px de marge de chaque côté (`#modal`, `js/shared/ui/modal.css:14-19`), soit 320 px utiles à 360 px ; 8 lames de 36 px et 7 espaces de 4 px font 316 px, donc ça tient ; 5 lames rétrécissent de 64 à 60,8 px ; 3 lames gardent 64 px. Sur un écran de 320 px (280 px utiles), 8 lames de 30 px et 7 espaces font 268 px. Jamais de défilement horizontal.
- Lame : hauteur `170 - n × 60 / 7` px arrondie au centième (do grave 170 px, do aigu 110 px), posée par `xyloHTML` en style en ligne `style="height:Hpx"` sur chaque `.xylo-lame` (pas dans la feuille : jsdom ne calcule pas les feuilles, le test lit `el.style.height`), largeur donnée par le conteneur ci-dessus ; coins arrondis 10 px ; deux petits rivets clairs (cercles) en haut et en bas ; le nom écrit en bas, en `#2B2F6B` gras sur une pastille blanche. Lames alignées par le centre vertical.
- Lame dorée (xylophone d'or) : fond `#F7C948`, bord `#B8860B`, un petit rond de la couleur de la note au-dessus du nom.

### Branchement des trois nouvelles slices

Chaque slice est importée par `js/app/main.js` dans l'ordre de `js/slices.cjs` (comme `screen` et `hints` lignes 20-21, `nesting` ligne 55, `mirror` ligne 66) : `import '../features/xylophone/index.js';` juste après la ligne de `hints` ; `import '../features/minigames/notes/index.js';` puis `import '../features/minigames/melody/index.js';` juste après la ligne de `mirror`. `notesRound` et `melodyRound` sont ré-exportés par `js/entities/difficulty/index.js` (comme `nestingRound` et `pitchRound`, lignes 30-32).

**Tests robustes dans le temps** : aucun test de cette track n'affirme une liste complète qui grandira (îles de `worldsOf(3)`, groupes de `SKILL_GROUPS`, `GAME_TYPES`, séries de squishies) ; il vérifie l'appartenance (`includes`), l'absence (`!includes`), un ordre relatif, ou le compte des seules entrées `world: 'concert'`.

### L'API de la slice `xylophone` (son `index.js`)

| Nom | Forme | Rôle |
|---|---|---|
| `XYLO_NOTES` | tableau de 8 `{ n, name, hz, color, edge }` | la table ci-dessus |
| `xyloHTML(opts)` | `opts = { lames: number[], gold?: boolean, names?: boolean (vrai par défaut), id?: string }` → chaîne HTML | un `div.xylo` (`.xylo-gold` si `gold`) de boutons `.xylo-lame[data-n]` |
| `playXylo(n, el?)` | joue la note `n`, et si `el` est donné lui met `lit` 200 ms | un seul endroit pour jouer une lame |
| `staffSVG(notes, opts)` | `notes: number[]`, `opts = { lines: 3 or 5, colors: boolean, id?: string, cls?: string }` → chaîne SVG | portée de D9 ; `viewBox="0 0 W 120"` avec `W = 24 + 28 × notes.length` ; têtes à `x = 20 + 28 k`, ellipse `rx 8.5`, `ry 6.5`, tournée de -20°, classe `note-head`, `data-n` ; lignes de `x = 4` à `W - 4`, trait 2 ; trait supplémentaire du do grave de `x - 12` à `x + 12` ; lignes de portée en `<line class="staff-line">`, trait supplémentaire en `<line class="ledger-line">`, couleur de tête en attribut `fill` (jamais en CSS) : tout se lit en jsdom |
| `openGoldenXylophone(opts)` | `opts = { onDone?: () => void, theme?: boolean (vrai par défaut) }` | l'écran du xylophone d'or (voir plus bas) |

### Types (`@typedef`, TypeScript strict)

- `js/entities/game-state/state.js`, `GameState` : ajouter `season3Done: boolean,` après `season2Done: boolean,`.
- `js/entities/difficulty/rounds-saison3.js` :
  - `@typedef {{ ask: 'hear' | 'name' | 'read' | 'find', lames: number[], targets: number[], staff?: 3 | 5, colors?: boolean, choices?: number }} NotesRound`, et `notesRound` porte `/** @param {number} dd le palier de difficulté @returns {NotesRound} */` ;
  - `@typedef {{ n: number, lames: number[], show: 'dots' | 'staff', hide: boolean, read: boolean, colors: boolean }} MelodyRound`, et `melodyRound` porte `@returns {MelodyRound}`.
- `js/features/xylophone/xylophone.js` : `@typedef {{ n: number, name: string, hz: number, color: string, edge: string }} XyloNote`, `XYLO_NOTES` en `/** @type {XyloNote[]} */` ; `xyloHTML`, `staffSVG`, `playXylo`, `openGoldenXylophone` ont leurs `@param` (objets d'options en `@typedef` : `XyloOptions`, `StaffOptions`, `GoldenOptions`, formes des tables de l'API ci-dessous) et `@returns {string}` ou `@returns {void}`.
- `js/features/minigames/melody/melody.js` : `MELODIES` en `/** @type {Record<number, number[][]>} */`.
- Aucun champ nouveau sur `World`, `Archipelago`, `Character`, `Item`, `CraftedItem`, `SquishySeries`, `Squishy`.
- `MUSIC_THEMES` (`js/features/music/music.js:20-33`) : `concert` et `'concert-fete'` respectent `MusicTheme` tel quel (`root`, `scale`, `bpm`, `lead`, `prog`, `shaker`), sans champ nouveau.
- Indices (`js/features/hints/hints.js:40-57`) : `registerHints` reçoit un `HintProvider<Q>` typé ; `notes.js` déclare `@typedef {{ ask: NotesRound['ask'], replay: () => void }} NotesQuestion` et `melody.js` `@typedef {{ read: boolean, replay: () => void }} MelodyQuestion` ; chaque `fx` respecte `HintFx` (`glow`, `run`), jamais d'autre clé.
- **Tout nouveau code est strictement typé, quelle que soit sa slice** (règle des deux checklists) : `xylophone.js`, `notes.js`, `melody.js`, `finale3.js` et chaque fonction ajoutée à `story.js`, `episodes.js`, `island.js`, `island-view.js`, `parents.js`, `squishy-art.js`, `items.js`, `characters.js`, `characters-art.js` ont leurs `@param` et `@returns`, et un `@typedef` pour tout objet passé ou renvoyé (par exemple `Season3FinaleOptions = { replay?: boolean }` pour `openSeason3Finale`). `bun run typecheck` reste vert : depuis la v66.11, `strict: true` est dans `tsconfig.json` pour tout `js/`, donc tout le code de la track (nouveaux fichiers et ajouts aux fichiers existants) est vérifié en strict, sans `any` ni `@ts-ignore`, et rien n'est à déclarer. Les `@typedef` et extensions de types de cette section sont obligatoires. Les appels au moteur suivent ses types réels, par exemple `loseLife(target, opts)` avec `LoseLifeOptions` (`{ disable?: boolean, onRetry?: () => void }`, `js/features/minigame-engine/engine.js`, `@typedef LoseLifeOptions` au-dessus de `function loseLife`).

### Taille des fichiers (estimations, plafond 1 100 lignes)

| Fichier | Aujourd'hui | Ajout estimé | Après |
|---|---|---|---|
| `js/features/xylophone/xylophone.js` (nouveau) | 0 | `XYLO_NOTES`, `xyloHTML`, `staffSVG`, `playXylo`, `openGoldenXylophone`, types | environ 230 |
| `js/features/xylophone/xylophone.css` (nouveau) | 0 | lames, portée, xylophone d'or, ♪ flottant | environ 120 |
| `js/features/minigames/notes/notes.js` (nouveau) | 0 | comme `pitch.js` (246) | environ 270 |
| `js/features/minigames/melody/melody.js` (nouveau) | 0 | `MELODIES`, écoute, lecture, indices | environ 310 |
| `js/entities/difficulty/rounds-saison3.js` (nouveau ou existant) | 0 ou ce qu'y ont mis les autres îles | `notesRound`, `melodyRound`, deux `@typedef` | plus 60 |
| `js/features/story/finale3.js` (nouveau) | 0 | comme `finale.js` (165), plus l'écran du trésor | environ 200 |
| `js/features/story/story.js` | 706 | `STORY.concert` (30), déclenchement (5), journal (25) | environ 770 |
| `js/features/story/episodes.js` | 518 | `EPISODES.concert` | environ 555 |
| `js/entities/character/characters-art-saison3.js` | préparé par `saison3-ouverture` | 4 dessins | plus 50 |
| `js/entities/character/characters.js` | 798 | 4 personnages | environ 855 |
| `js/entities/squishy/squishies.js` | 630 | série et 6 modèles | environ 700 |
| `js/features/squishies/squishy-art.js` | 640 | 6 dessins et une boîte | environ 695 |
| `js/features/island/island.js` | 635 | `ISLE_SCENERY.concert` | environ 665 |
| `js/entities/difficulty/difficulty.js` | 1 014 | 4 lignes (`LIVES_TABLE`, `GENEROUS_KINDS`, `NO_TIMER_KINDS` deux fois) et l'export de `tierValue` | environ 1 019 |

Aucun fichier ne dépasse 1 100 lignes : rien à découper. Si l'implémentation dépasse une estimation au point d'approcher le plafond, le fichier se découpe en fichiers frères dans sa slice (règle de la checklist), noté au journal du plan.

### `notesRound(dd)` (`js/entities/difficulty/rounds-saison3.js`, par `tierValue`)

| Palier | `ask` | Ce qu'on voit | Lames ou choix | Cibles possibles |
|---|---|---|---|---|
| 1 | `hear` | un ♪ coloré, la note est jouée | lames 0, 2, 4 | 0, 2, 4 |
| 2 | `name` | le nom de la note écrit en grand (`.notes-name`), non coloré | lames 0 à 4 | 0 à 4 |
| 3 | `read` | portée réduite (3 lignes), une note colorée | lames 0 à 4 | 0 à 4 |
| 4 | `read` | portée de 5 lignes, une note sans couleur | lames 0 à 7 | 0 à 7 |
| 5 | `find` | le nom écrit en grand, 5 petites portées de 5 lignes côte à côte (`.notes-find[data-n]` dans `.notes-find-row`, `display: flex; gap: 0`, chaque bouton `flex: 1 1 0; min-width: 0`, soit 64 px à 360 px d'écran), notes sans couleur, ordre mélangé | 5 notes différentes dont la cible, jamais 0 et 7 ensemble | 0 à 7 |

Forme : `{ ask, lames, targets, staff?: 3 | 5, colors?: boolean, choices?: 5 }`. `#notes-stage` porte `data-ask` et `data-n` (la cible). Le ♪ du palier 1 est `<span class="notes-heard" data-n="…">♪</span>`.

### Textes de `notes` (`gameHeader('🎹 Do, ré, mi', titre, dit)`)

| `ask` | Titre affiché | Phrase dite |
|---|---|---|
| `hear` | Quelle lame chante cette note ? | Écoute la note de Dorémi, puis touche la lame qui chante pareil. |
| `name` | Touche le {nom} ! | Trouve la lame du {nom}, et touche-la ! |
| `read` | Quelle note est sur la portée ? | Regarde la note sur la portée, et touche la lame qui porte son nom. |
| `find` | Où est le {nom} ? | Touche la portée où le {nom} est à sa place. |

`{nom}` est le `name` de la cible (« do », « ré »…). Bouton `#notes-listen` « 🔈 Écouter » au palier 1 seulement.

### `melodyRound(dd)` (`js/entities/difficulty/rounds-saison3.js`, par `tierValue`)

| Palier | Notes | Lames | Écrite comment | Écoute |
|---|---|---|---|---|
| 1 | 3 | 0, 2, 4 | points colorés, visibles | jouée au début |
| 2 | 4 | 0 à 4 | points colorés, visibles | jouée au début |
| 3 | 5 | 0 à 4 | points colorés, cachés après l'écoute | jouée au début |
| 4 | 5 | 0 à 7 | portée de 5 lignes, notes colorées | jouée seulement après la réussite |
| 5 | 6 | 0 à 7 | portée de 5 lignes, sans couleurs | jouée seulement après la réussite |

Forme : `{ n, lames, show: 'dots' | 'staff', hide: boolean, read: boolean, colors: boolean }`. Points : `#melody-score` contient des `.ml-note[data-n]` de la couleur de la lame, placés à `bottom: 10 + n × 10 %` ; une fois `covered`, ils sont gris `#C9CEDB` à `bottom: 45 %`. Portée : `staffSVG(mélodie, { lines: 5, colors, id: 'melody-staff', cls: 'ml-staff' })`, dont les têtes ont aussi la classe `ml-note` ; `#melody-score` l'entoure.

### Mélodies (`MELODIES`, `js/features/minigames/melody/melody.js`)

Indices de `XYLO_NOTES`. Chaque palier tire au hasard dans sa liste, jamais la même deux fois d'affilée.

| Palier | Liste |
|---|---|
| 1 | `[0,2,4]`, `[4,2,0]`, `[0,0,4]`, `[4,4,0]`, `[2,4,2]`, `[0,2,0]`, `[4,2,4]`, `[2,0,2]` |
| 2 | `[0,1,2,0]` (Frère Jacques), `[2,3,4,4]`, `[0,0,0,1]` (Au clair de la lune), `[4,3,2,1]`, `[0,2,4,2]`, `[4,2,1,0]`, `[1,2,3,4]`, `[2,2,1,0]` |
| 3 | `[0,0,0,1,2]` (Au clair de la lune), `[0,1,2,3,4]`, `[4,3,2,1,0]`, `[2,3,4,2,0]`, `[4,4,2,2,0]`, `[0,2,1,3,2]`, `[4,2,3,1,0]`, `[0,1,2,0,0]` |
| 4 | `[0,2,4,5,4]`, `[7,6,5,4,3]`, `[4,5,4,3,2]`, `[0,4,7,4,0]`, `[2,3,4,5,4]`, `[5,4,3,2,1]`, `[7,4,2,0,0]`, `[3,2,1,0,4]` |
| 5 | `[0,0,4,4,5,5]` (Ah vous dirai-je maman), `[2,2,3,4,4,3]` (Ode à la joie), `[0,1,2,3,4,5]`, `[7,6,5,4,3,2]`, `[0,2,4,7,4,2]`, `[4,3,2,2,1,0]`, `[3,3,2,2,1,1]`, `[5,5,4,4,3,3]` |

Les noms entre parenthèses sont des commentaires du code, jamais affichés.

### Textes de `melody` (`gameHeader('🎶 La mélodie', titre, dit)`)

| Paliers | Titre affiché | Phrase dite |
|---|---|---|
| 1 à 3 | Rejoue la mélodie de Xylo | Écoute et regarde la mélodie de Xylo, puis rejoue-la sur le xylophone. |
| 4 et 5 | Lis la mélodie, puis joue-la ! | Lis les notes sur la portée, puis joue-les sur le xylophone. Xylo te la fera écouter après ! |

États (`#melody-state`, affichés, pas dits) : « 👂 Écoute… », « 👆 À toi ! », « 👆 À toi ! Tu t'en souviens ? » (palier 3), « 🔁 Écoute encore… » (indice 2 et bouton Écouter), « 📖 Lis la mélodie, puis joue-la ! » (paliers 4 et 5).

### Indices (contrat v52, `registerHints`)

| Jeu, cas | Indice 1 (`say`, `fx`) | Indice 2 (`say`, `fx`) |
|---|---|---|
| `notes`, `hear` | « Écoute bien. Les grandes lames chantent grave, les petites lames chantent aigu. » `glow: '.xylo'` | « Écoute encore la note, puis touche les lames une par une pour trouver celle qui chante pareil. » `glow: '#notes-listen'`, `run` rejoue la note |
| `notes`, `name` | « Les notes se suivent toujours dans le même ordre, de la plus grande lame à la plus petite. » `glow: '.xylo'` | « Pars du do, la plus grande lame, et avance en chantant les notes jusqu'à la tienne. » `glow: '.xylo'` |
| `notes`, `read` | « Plus une note est haute sur la portée, plus elle chante aigu. Le do du bas a un petit trait rien qu'à lui. » `glow: '#notes-staff'` | « Pars du do du bas. Monte d'une marche à chaque ligne et à chaque espace, en disant les notes. » `glow: '#notes-staff'` |
| `notes`, `find` | « Plus une note est haute sur la portée, plus elle chante aigu. Le do du bas a un petit trait rien qu'à lui. » `glow: '#notes-stage'` | « Pars du do du bas et monte marche par marche, en disant les notes. Puis cherche la note qui est à cette hauteur. » `glow: '#notes-stage'` |
| `melody`, paliers 1 à 3 | « Écoute si la mélodie monte ou descend. Quand elle monte, on va vers les petites lames. » `glow: '.xylo'` | « Écoute et regarde encore, plus lentement. Puis rejoue depuis le début. » `run` : `q.replay()` |
| `melody`, paliers 4 et 5 | « Lis les notes de gauche à droite. Plus une note est haute sur la portée, plus sa lame est petite. » `glow: '#melody-staff'` | « Écoute la mélodie plus lentement, en suivant les notes du doigt. Puis joue-la depuis le début. » `run` : `q.replay()` |

Aucun indice n'écarte de réponse (pas de `fx.dim`). `setHintQuestion('notes', q, { choices: '.xylo-lame' })` (`'.notes-find'` au palier 5) ; `setHintQuestion('melody', q)` sans `choices`.

### Tests existants touchés (règle de `conductor/workflow.md`, « Tests existants touchés par un changement voulu »)

Chaque assertion se réécrit avec la même force ; aucune n'est affaiblie ni supprimée.
- `test/musique.test.js`, « pas de minuteur ; compétence « Mémoire et logique » » pour `rhythm` et pour `pitch` (phase 1) : `"logique"` devient `"musique"` et le libellé « compétence « Musique » » (D16).
- `test/licornes.test.js`, `ev('SAVE_VERSION') === 9` (phase 3) : la valeur attendue devient le nouveau numéro de `SAVE_VERSION`.
- `test/smoke.test.js`, « personnages : les N ids possèdent un SVG » (`Object.keys(CHARACTERS).length===N`, vers la ligne 755, aujourd'hui 57) (phase 3) : `N` devient le nombre trouvé sur `main` après le rebase plus 4, dans le libellé et dans l'expression (règle de `conductor/checklist-ile.md`, section « 2 quater »).
- `test/squishies.test.js`, « 3 séries au lancement, puis les séries des îles… » (vers la ligne 86) (phase 3) : `'concert'` s'ajoute **à la fin** du tableau attendu, après les séries déjà livrées, et le libellé nomme la série « Concert ».
- `test/squishies.test.js`, « 6 modèles par série (N squishies) » et « noms uniques et faciles à dire » (vers les lignes 91 et 107, aujourd'hui 54) (phase 3) : `N` augmente de 6 par rapport à la valeur trouvée sur `main`, dans le libellé et dans les deux expressions.
- `test/games.test.js` et `test/companions.test.js` (phase 2) : ajout de l'attente de `#melody-state[data-turn="you"]` (« Jouable par le harnais ») ; rien d'existant ne change.

### Observer les notes jouées (méthode des tests)

Aucun test existant n'espionne `playNote`, et avec le son coupé `playNote` (`js/shared/ui/sound.js`, `function playNote`) rend `false` avant de créer un oscillateur : le faux audio (`test/tools/fake-audio.js`) ne verrait rien. Méthode retenue : **réaffecter `playNote` dans la fenêtre de test**, avant d'ouvrir le jeu :

```js
ev('window.__pn = []; playNote = (hz) => { window.__pn.push(hz); return true; }');
```

Le bundle de `test/tools/page.js` garde chaque nom de haut niveau sans le renommer et sans l'enfermer dans une fonction : la réaffectation remplace la fonction vue par tout le jeu. Essai fait le 22/11/2026 dans un fichier jetable (effacé, jamais commité), même harnais que `test/musique.test.js`, son coupé (`state.sound = false`) : après la réaffectation, toucher une cloche de `pitch` a donné `window.__pn = [880]`, et l'ouverture de `simon` au palier 1 a ajouté 4 appels. Les critères 3, 6, 17, 19, 22, 23 et 39 lisent donc `window.__pn` (fréquences jouées, dans l'ordre ; « rien n'est joué » = `window.__pn.length` inchangé), le son coupé ou non. Condition pour le code : les nouvelles slices appellent `playNote` sous ce nom (import sans renommage, `import { playNote } from '…/shared/ui/index.js'`), jamais par un alias. Pour « son coupé » (critères 3 et 6), le test garde la `playNote` d'origine, met `state.sound = false` et vérifie seulement ce qui se voit : `lit`, `.notes-heard`, la partition. La ligne S10 reste un jugement humain (👤).

### Contrat DOM de `notes` et de `melody`

Seuls ces sélecteurs sont lus par les critères, les solveurs (`test/games.test.js`) et les indices. Les éléments communs du moteur (`gameHeader`, `livesBar`, `.win-box`) ne changent pas.

**`notes`, tous paliers** : `#notes-stage` porte `data-ask` (`hear`, `name`, `read`, `find`) et `data-n` (la cible, 0 à 7) ; il contient tout le reste du tableau ci-dessous.

| Palier | Élément | Attributs et contenu |
|---|---|---|
| 1 | `.notes-heard` | `<span class="notes-heard" data-n="t" style="color:#XXXXXX">♪</span>`, couleur de la cible |
| 1 | `#notes-listen` | `<button class="btn-small" id="notes-listen">🔈 Écouter</button>` |
| 1 à 4 | `.xylo` | `xyloHTML({ lames })` : des `button.xylo-lame[data-n]` (style en ligne `height`, `<b class="xylo-name">` avec le nom, `aria-label` « Lame {nom} ») |
| 2 et 5 | `.notes-name` | `<b class="notes-name">{nom}</b>`, le `name` de la cible, sans couleur |
| 3 et 4 | `#notes-staff` | `staffSVG([t], { lines: 3 au palier 3, 5 au palier 4, colors: palier 3, id: 'notes-staff' })` : des `line.staff-line`, une seule `ellipse.note-head[data-n="t"]` de `cy = 104 - 8 t` (`fill` couleur ou `#2B2F6B`), et `line.ledger-line` si `t = 0` |
| 5 | `.notes-find-row` | `<div class="notes-find-row">` de 5 `<button class="notes-find" data-n="k" aria-label="Portée {numéro de 1 à 5}">`, chacun contenant `staffSVG([k], { lines: 5, colors: false, cls: 'notes-find-staff' })` : une seule `ellipse.note-head[data-n="k"]` de `cy = 104 - 8 k` ; les 5 `k` sont distincts, dont `t`, jamais 0 et 7 ensemble |

Solveur `notes` : `hear` lit `.notes-heard[data-n]` ; `read` lit le `cy` de `#notes-staff .note-head` (`n = (104 - cy) / 8`) ; `name` cherche le texte de `.notes-name` dans les `name` des lames affichées (une seule correspondance aux paliers 2 et 5, car un seul do y figure) ; `find` choisit la `.notes-find` dont la tête a ce `n` par son `cy`. Il vérifie que `gameSolution` vise cet élément (au palier 4, une lame de même `name`).

**`melody`, tous paliers** :

| Paliers | Élément | Attributs et contenu |
|---|---|---|
| 1 à 5 | `#melody-state` | `<p class="puzzle-hint" id="melody-state" data-turn="listen\|you">` et le libellé de l'état |
| 1 à 5 | `#melody-score` | conteneur de la partition |
| 1 à 3 | `#melody-score .ml-note` | une `<span class="ml-note" data-n="n" style="background:…;bottom:…%">` par note, dans l'ordre ; classes `covered` (palier 3 après l'écoute) et `done` (note jouée juste) |
| 4 et 5 | `#melody-staff` | `staffSVG(mélodie, { lines: 5, colors: palier 4, id: 'melody-staff', cls: 'ml-staff' })` dans `#melody-score` ; ses têtes sont des `ellipse.note-head.ml-note[data-n]`, dans l'ordre, de `cy = 104 - 8 n` ; classe `done` |
| 1 à 3 | `#melody-listen` | `<button class="btn-small" id="melody-listen">🔈 Écouter</button>` (absent aux paliers 4 et 5) |
| 1 à 5 | `#melody-progress` | `progressDots(pos, n)` du moteur (des `i`, classe `on`) |
| 1 à 5 | `.xylo` | `xyloHTML({ lames })`, des `button.xylo-lame[data-n]` |

Solveur `melody` : la suite des `data-n` de `#melody-score .ml-note` (et, aux paliers 4 et 5, la même suite recalculée par `n = (104 - cy) / 8`) doit égaler la suite des `data-n` des lames de `gameSolution`.

Indices : `glow` ne vise que `.xylo`, `#notes-listen`, `#notes-staff`, `#notes-stage`, `#melody-staff` ; `choices` : `.xylo-lame` ou `.notes-find`.

### Jouable par le harnais

Délais réels du harnais : toutes les minuteries du jeu sont 10 fois plus courtes (`const SPEED = 0.1` en tête de `test/games.test.js` et de `test/companions.test.js`) ; `waitFor` attend au plus 3 000 ms réels (`async function waitFor(cond, ms = 3000)` des deux fichiers) ; la boucle de `games` clique chaque sélecteur de `gameSolution` par `el.click()`, 5 ms entre deux (`playToWin` de `test/games.test.js`) ; celle de `companions` attend l'écran de victoire 2 000 ms réels après avoir cliqué (« plus gagnable après les indices », `test/companions.test.js`). Les deux boucles n'attendent un état « à toi » que pour `simon` (`key === 'simon'` dans `playToWin` de `test/games.test.js` et dans la boucle des indices de `test/companions.test.js`).

**`notes`**
- Événement : `click` sur la lame ou la case. Aucune attente : les touches marchent dès l'ouverture.
- `gameSolution` (un seul sélecteur, `solSel`, `js/features/minigame-engine/engine.js:305-307`) : paliers 1 à 4 : `['.xylo-lame[data-n="t"]']`, où `t` est la cible (`#notes-stage[data-n]`) ; au palier 4, quand la cible est un do, c'est la lame de la même octave que la note dessinée (`t` = 0 ou 7), même si l'autre do est aussi accepté au clic ; palier 5 : `['.notes-find[data-n="t"]']`.
- Durées : victoire à `WIN_DELAY` (400 ms, soit 40 ms réels). L'indice 2 du palier 1 rejoue la note (une seule, 0 ms) et ne bloque rien.
- Fichiers de test touchés : `test/games.test.js` (solveur `notes` dans `INDEPENDENT`), aucun changement de boucle.

**`melody`**
- Événement : `click` sur les lames. Les touches ne comptent que si `#melody-state[data-turn="you"]`.
- `gameSolution` : `mélodie.map((n) => '.xylo-lame[data-n="' + n + '"]')`, dans l'ordre, répétitions comprises (par exemple `[0,0,4]` donne deux fois `.xylo-lame[data-n="0"]` puis `.xylo-lame[data-n="4"]`) ; l'octave compte (`0` et `7` sont deux lames différentes). `setSolution` est appelé à l'ouverture, comme `simon` (`simon.js:77`).
- Signal « l'écoute est finie » : l'attribut `data-turn="you"` de `#melody-state` (le libellé change aussi : « 👆 À toi ! », « 👆 À toi ! Tu t'en souviens ? », ou « 📖 Lis la mélodie, puis joue-la ! » dès l'ouverture aux paliers 4 et 5). Pendant toute écoute (début des paliers 1 à 3, bouton Écouter, indice 2 à tous les paliers) : `data-turn="listen"`.
- Durées, temps du jeu puis temps réel du harnais : écoute du début au palier 3 (5 notes) : `500 + 5 × 650 = 3 750` ms, soit 375 ms réels ; au palier 2 : 3 100 ms (310 ms réels) ; indice 2 au palier 5 (6 notes) : `500 + 6 × 1 040 = 6 740` ms, soit 674 ms réels. Tout est sous les 3 000 ms réels de `waitFor`. Victoire : `WIN_DELAY` aux paliers 1 à 3 (40 ms réels), `melodyReadEnd(n)` aux paliers 4 et 5 (au plus 2 200 ms, soit 220 ms réels), sous les 2 000 ms réels de `companions` et les 3 000 ms réels de `games`.
- Fichiers de test touchés : `test/games.test.js` (solveur `melody` dans `INDEPENDENT`, et dans `playToWin` la même attente que pour `simon` : `if (key === 'melody' && !(await waitFor(() => !!d.querySelector('#melody-state[data-turn="you"]')))) return 'La mélodie ne rend pas la main';`) ; `test/companions.test.js` (à côté de l'attente de `simon`, avant de cliquer la solution : `if (key === 'melody') await waitFor(() => !!d.querySelector('#melody-state[data-turn="you"]'), 3000);`). Ajouter une attente pour un nouveau jeu n'affaiblit aucun test existant.

### Autres tables des mini-jeux

- `GAME_LIST` : `{ key: 'notes', emoji: '🎹', name: 'Do, ré, mi' }`, `{ key: 'melody', emoji: '🎶', name: 'La mélodie' }`, ajoutés en fin de liste.
- `PROGRESS_CHEERS` : `notes: 'Tu reconnais les notes de mieux en mieux !'`, `melody: 'Tu rejoues les mélodies de mieux en mieux !'`.
- Pas d'entrée dans `GAME_TIER_MAX` (paliers 1 à 5).
- `SKILL_GROUPS` après la phase 2 : `logique` = `['memory', 'simon', 'diff', 'sequence', 'rangement']` ; `musique` = `['rhythm', 'pitch', 'notes', 'melody']` (phase 1 : sans `melody`).

### En quoi `melody` est différent

- **De `simon`** (« Les couleurs ») : `simon` montre 4 pastilles de couleur sans ordre de hauteur et une suite au hasard ; il travaille la mémoire. `melody` utilise un vrai xylophone rangé du grave à l'aigu, de vraies petites mélodies (pas, sauts, comptines), une partition qui montre le contour (les points montent et descendent), et aux paliers 4 et 5 la lecture sur la portée avant d'entendre. Il travaille l'oreille et la lecture musicale.
- **De `pitch`** (« Grave ou aigu ? ») : `pitch` demande de juger ou de ranger des hauteurs, sans les rejouer et sans nom de note. `melody` demande de reproduire une suite de notes nommées sur un instrument.

### Le xylophone d'or (`openGoldenXylophone`)

- Fenêtre : `gameHeader("🎼 Le xylophone d'or", 'Joue ce que tu veux !', "C'est ton xylophone d'or. Touche les lames, et joue ce que tu veux !")`, puis `xyloHTML({ lames: [0,1,2,3,4,5,6,7], gold: true, id: 'xylo-gold' })`, puis `<button class="btn-primary" id="xylo-done">Fini ✨</button>`. `bindQuit()` lit la phrase une fois.
- Chaque toucher : `playXylo(n, lame)`, et un ♪ (`.xylo-float`, de la couleur de la note) monte de la lame et disparaît en 900 ms (animation CSS, retiré du DOM ensuite). Aucune voix par toucher.
- Rien n'est compté : pas de `setupLives`, pas de `registerGame`, pas de mission, pas de pièce, pas de `state.skills`.
- `theme` vrai (par défaut) : juste **après** son `openModal`, la slice pose un drapeau de module `xyloTheme = true` et émet `emit('music:theme', 'concert')`. Une seule fonction `endXyloTheme()` remet le thème : si `xyloTheme` est vrai, elle le passe à `false` puis émet `emit('music:theme', null)` ; sinon elle ne fait rien (jamais deux émissions). Elle est appelée par : le gestionnaire de « Fini ✨ », **avant** `onDone` ; un point d'accroche `onModalClose` (fermeture par ✕, à côté ou Échap ; `closeModal` est seul à déclencher ces points, `js/shared/ui/modal.js:61-67`) ; un point d'accroche `onModalOpen` (une autre fenêtre remplace le xylophone, `openModal` déclenche ces points, `modal.js:50`). Comme le drapeau est posé après `openModal`, l'ouverture du xylophone lui-même ne le remet pas à zéro. Dans le final : `theme: false`, le drapeau reste faux, c'est le final qui gère sa musique (son `onModalClose`, comme `finale.js:50-55`).
- « Fini ✨ » appelle `onDone` s'il est donné, sinon `closeModal()`. Depuis le journal, `onDone` rouvre le journal ; depuis Stella, `closeModal()`.

### L'île (`WORLDS.concert`, ajoutée après les quatre autres îles de la saison 3)

| Champ | Valeur |
|---|---|
| `name` | `"L'Île du Grand Concert"` |
| `emoji` | `'🎼'` |
| `level` | `102` |
| `diff` | `6` |
| `saison` | `3` |
| `short` | `'Concert'` |
| `subtitle` | `'La grande scène en plein air'` |
| `game` | `(age) => (age && age < 7 ? 'notes' : 'melody')`, avec le commentaire « son mini-jeu, selon l'âge : les notes avant 7 ans, la mélodie ensuite » |
| `map` | `{ x: 50, y: 22 }` (D23) |
| `shape` | `'concert'` |
| `icon` | `'🎼'` |
| `sand` | `'#FFF1D6'` |
| `land` | `'#E9A0A8'` |
| `intro` | `"Bienvenue sur l'Île du Grand Concert : ce soir, tout le monde joue ! 🎼"` |
| `sceneEmpty` | `'Ta grande scène attend ses décorations de fête !'` |

Thème CSS (`js/shared/styles/design-system-v21.css`, après `licornes`) : `body[data-world="concert"] { --world-sky: #fdf0e6; --world-sea: #e9a0a8; --world-deep: #8a2e3b; --world-scene-top: #fff8f0; --world-scene-floor: #ffe7a8; }`. Rouge velours, or et crème.

Paysage `ISLE_SCENERY.concert(w)` (`js/features/island/island.js`), même structure que `musique` (nuages au loin, sol `w.land`, chemin `w.sand`) : une estrade en bois au centre (rectangle brun clair `#E0A96D`, bord `#7A4524`), deux rideaux rouges `#C8384B` relevés de chaque côté, une guirlande d'ampoules de couleur tendue entre deux mâts au-dessus, trois rangées de petites chaises en bas à gauche, quelques notes ♪ blanches qui flottent. Sur l'estrade : si `state.season3Done`, un groupe `<g class="ls-xylo-or">` de 8 `<rect class="ls-xylo-lame">` dorés (`#F7C948`, bord `#B8860B`), du plus long au plus court ; sinon, un groupe `<g class="ls-drap">` : un drap violet `#7B5CC0` posé sur une forme, et un `<text>` « ? » blanc. Un seul des deux groupes est rendu.

### Les personnages (`js/entities/character/characters.js`, `world: 'concert'`)

| id | emoji | name | title | gender | loot | texts (3 répliques) |
|---|---|---|---|---|---|---|
| `stella` | 👩‍🎤 | Stella | la cheffe de la grande scène | f | `['billetconcert', 'programme']` | « Bienvenue sur ma grande scène ! Ce soir, c'est le Grand Concert, et tu as la meilleure place ! » ; « Un concert, ça se prépare : on accorde, on répète, on écoute. Tu m'aides ? » ; « Chaque mission réussie allume une lumière de la scène. Encore une ? » |
| `doremi` | 🐦 | Dorémi | la petite fauvette qui chante la gamme | f | `['etoilescene', 'billetconcert']` | « Do, ré, mi, fa, sol, la, si, do ! Tu chantes avec moi ? » ; « Chaque note a sa lame sur le xylophone, et sa couleur. Le do est tout rouge ! » ; « Sur la portée, plus la note est haute, plus elle chante aigu. Tu veux essayer ? » |
| `xylo` | 🐻 | Xylo | l'ourson au xylophone | m | `['lunettesstar', 'programme']` | « Ding, dong, ding ! Écoute ma mélodie, puis rejoue-la avec moi ! » ; « Les grandes lames font des notes graves, les petites des notes aiguës. » ; « Une mélodie, c'est comme un petit chemin : ça monte, ça descend, ça saute ! » |
| `trompi` | 🐘 | Trompi | le petit éléphant trompettiste | m | `['ampoule', 'lunettesstar']` | « Pouêêt ! Pardon, je m'entraîne pour le concert ! » ; « J'installe les lumières et les chaises. Tu viens voir la grande scène ? » ; « Tous les amis de l'expédition arrivent ce soir. Ça va être la plus belle fête ! » |

Stella est la guide du chapitre ; elle propose aussi des jeux (pas de `noGames`). Aucun personnage n'est lié à un jeu dans le code : `CHARACTERS` n'a que `emoji`, `name`, `title`, `world`, `gender`, `loot`, `texts` et `noGames` (`js/entities/character/characters.js:598-655`), et le choix des jeux ne dépend pas du personnage touché, seulement de l'âge, de la variété et du jeu favori de l'île (`js/features/players/profiles-ui.js:444-454`). Le lien entre Dorémi et « Do, ré, mi », entre Xylo et « La mélodie », est seulement narratif : il passe par leurs répliques ci-dessus et par les consignes des jeux (« Écoute la note de Dorémi », « Rejoue la mélodie de Xylo »). Rien à coder pour lui.

**Dessins** (table `ART_S3` de `js/entities/character/characters-art-saison3.js`, fusionnée dans `CHAR_ART` par `characters-art.js`, aides `human` et `svg` importées de `js/entities/character/characters-art-kit.js` ; ces deux fichiers sont préparés par la track `saison3-ouverture`, règle de `conductor/checklist-ile.md`, section « 2 bis ») : cette spec demande explicitement de créer les dessins de ces 4 nouveaux personnages, sans toucher aux dessins existants ni à `characters-art.js` (1 055 lignes pour un plafond de 1 100). Style de `ART.viola` (humain) et `ART.boumbo` (objet ou animal) :
- `stella` : `human(...)`, cheveux violets en queue de cheval, veste rouge à paillettes dorées, un micro doré dans la main.
- `doremi` : `svg(...)`, petit oiseau jaune et vert, bec orange ouvert, trois notes ♪ qui sortent du bec.
- `xylo` : `svg(...)`, ourson brun, nœud papillon rouge, deux maillets (bâton et boule ronde) dans les pattes.
- `trompi` : `svg(...)`, éléphanteau gris-bleu `#9FB4C7`, grandes oreilles roses, une petite trompette dorée au bout de la trompe.

### Objets, recettes, décorations (`js/entities/item/items.js`, `world: 'concert'`)

| Clé | Emoji | Nom | Prix |
|---|---|---|---|
| `billetconcert` | 🎟️ | Billet de concert | 5 |
| `programme` | 📋 | Programme du concert | 4 |
| `etoilescene` | 🌟 | Étoile de la scène | 8 |
| `lunettesstar` | 🕶️ | Lunettes de star | 6 |
| `ampoule` | 💡 | Ampoule de scène | 5 |
| `projecteur` | 🔦 | Projecteur | 7 |
| `casque` | 🎧 | Casque de musique | 6 |
| `saxo` | 🎷 | Saxophone doré | 9 |

Personne ne donne `projecteur`, `casque` ni `saxo` (3 objets pour les objets préférés).

**Clés uniques** : chaque clé nouvelle de cette spec (personnages `stella`, `doremi`, `xylo`, `trompi` ; objets ; recettes `etincelles`, `medaille` ; décorations ; squishies et série `concert` ; jeux `notes`, `melody` ; thèmes `concert`, `concert-fete` ; forme `concert` ; slice `xylophone`) a été cherchée par `grep -w` dans `js/` et dans les specs `monde-crayons`, `monde-dumplings`, `monde-coffres`, `monde-chatouilles` le 22/11/2026 : aucune n'y existe comme clé. Deux clés ont été renommées pour cela : l'objet `lunettesstar` (`lunettes` est déjà un vêtement, `js/features/wardrobe/wardrobe.js:77`) et le squishy `fauvette-doremi` (pour ne pas reprendre l'id du personnage `doremi`). La slice `xylophone` est un nom de dossier, distinct du squishy `xylophone` de la série `instruments` (`js/entities/squishy/squishies.js:422`), qui ne change pas. `melody` n'est pas encore une clé de jeu : dans `pitch`, c'est seulement une valeur de `ask` (`pitch.js:58`) et un champ de `pitchRound` (`difficulty.js:850`). Prénoms Stella, Dorémi, Xylo, Trompi : portés par aucun personnage ni compagnon du jeu (`js/entities/character/characters.js`, `js/entities/companion/companions.js:56-132`) ni des quatre autres îles.

Recettes (`CRAFTED`) : `etincelles` 🎇 « Feu d'étincelles », prix 22, `recipe: { ampoule: 2, etoilescene: 1 }` ; `medaille` 🥇 « Médaille du concert », prix 20, `recipe: { saxo: 1, programme: 1, billetconcert: 1 }`.

Décorations (`DECOS`) : `sceneD` 🏟️ « Grande scène » 40 ; `roueD` 🎡 « Grande roue de la fête » 30 ; `enceinteD` 🔊 « Enceinte géante » 18 ; `banderolesD` 🎏 « Banderoles » 14 ; `chaisesD` 🪑 « Rang de chaises » 12.

### Squishies « Concert » (`js/entities/squishy/squishies.js`)

Série : `concert: { name: 'Concert', emoji: '🎼', world: 'concert' }`, ajoutée à la fin de `SQUISHY_SERIES_ORDER` ; `SQUISHY_ISLAND_SERIES.concert = 'concert'` ; boîte `SQ_BOX_COLORS.concert = ['#FFE7A8', '#8A2E3B']`.

| id | name | say | rarity | color | shape | size | Dessin `SQ_ART` |
|---|---|---|---|---|---|---|---|
| `micro-mochi` | Micro mochi | un micro mochi | commun | rose | rond | petit | `body: 'rond'`, une grille de micro grise quadrillée en demi-cercle sur le dessus |
| `guitare-guimauve` | Guitare guimauve | une guitare guimauve | commun | orange | ovale | grand | `body: 'ovale'`, un manche brun avec 3 chevilles en haut à droite, une rosace sombre sous le visage |
| `note-croche` | Note croche | une note croche | commun | bleu | ovale | petit | `body: 'ovale'`, une hampe et un petit drapeau noirs à droite |
| `billet-dore` | Billet doré | un billet doré | commun | jaune | carre | petit | `body: 'carre'`, deux encoches en demi-cercle sur les côtés, une étoile au coin |
| `fauvette-doremi` | Dorémi | Dorémi, la petite fauvette | rare | vert | rond | petit | `body: 'rond'`, un petit bec orange, deux ailes, une note ♪ au-dessus |
| `cle-sol-etoilee` | Clé de sol étoilée | une clé de sol étoilée | brille | violet | ovale | grand | `body: 'ovale'`, une boucle de clé de sol dorée derrière, des étoiles dorées |

**Où vont les dessins** : le dessin d'un squishy vient de `SQ_ART` (`js/features/squishies/squishy-art.js:55`), pas du catalogue ; sans entrée, `squishyArtSVG` renvoie une chaîne vide (`squishy-art.js:579-582`). Les 6 entrées s'ajoutent à `SQ_ART` dans `squishy-art.js`, sur le modèle de `'licorne-etoile'` (`squishy-art.js:550-558` : `body`, `face`, `faceY`, `back(c)`, `front()`) ; la boîte va dans `SQ_BOX_COLORS` du même fichier (`squishy-art.js:604-614`). Marge : `squishy-art.js` fait 640 lignes pour un plafond oxlint de 1 100 (`.oxlintrc.json:40`) ; les 6 entrées en ajoutent environ 50.

### Musique (`js/features/music/music.js`)

- `concert: { root: 60, scale: [0, 2, 4, 7, 9], bpm: 96, lead: 'marimba', prog: [0, 5, 7, 0], shaker: true }`, commentaire « un marimba en do, comme le xylophone d'or (aucune fausse note avec lui) ».
- `'concert-fete': { root: 60, scale: [0, 2, 4, 7, 9], bpm: 116, lead: 'bell', prog: [0, 5, 7, 0], shaker: true }`, la fête du grand final.

### Le chapitre (`STORY.concert`, `js/features/story/story.js`)

- `guide: 'stella'`, `title: 'Le dernier morceau de la carte'`, `reward: 20` (voir plus bas).
- `intro` :
  1. « Bienvenue sur la grande scène ! 🎼 Ce soir, tous les amis de l'expédition viennent jouer au Grand Concert. »
  2. « Zap m'a dit que le dernier morceau de sa carte au trésor est caché ici, quelque part dans la musique. »
  3. « Résous mes devinettes : à chaque bonne réponse, un instrument s'accorde, et le morceau de carte se rapproche ! »
- `riddles` :
  1. q « J'ai six cordes, on me gratte avec les doigts, et je fais gling gling. Qui suis-je ? » ; tip « On la tient contre son ventre, et on chante avec elle. » ; opts 🎸 (juste), 🎷, 🥁.
  2. q « Je suis tout petit, on me tient devant la bouche, et je rends ta voix très forte. Qui suis-je ? » ; tip « Les chanteurs me tiennent dans la main, sur la scène. » ; opts 🎤 (juste), 🎧, 📯.
  3. q « On me met sur les oreilles, et j'écoute la musique tout bas, rien que pour moi. Qui suis-je ? » ; tip « J'ai deux petits coussins tout doux, un pour chaque oreille. » ; opts 🎧 (juste), 🎤, 🔔.
- `success` : « Bravo ! Tous les instruments sont prêts… et regarde : le dernier morceau de la carte de Zap était caché dans le pupitre 🗺️ » (la track `saison3-ouverture` ajoute ensuite `zapMapSay(zapMapPieces())`).
- `reward: 20` : la récompense du final de la saison 2 (`STORY.licornes.reward`, `js/features/story/story.js:418`), au-dessus des 16 pièces des îles 1 à 4 de la saison.

### Les épisodes (`EPISODES.concert`, `js/features/story/episodes.js`)

| # | by | title | find | lines |
|---|---|---|---|---|
| 1 | `doremi` | La gamme du matin | 🎵 | « Ce matin, j'ai chanté la gamme en entier : do, ré, mi, fa, sol, la, si, do ! » ; « Tous les oiseaux de l'île ont répondu. Le concert approche ! » |
| 2 | `xylo` | Le xylophone qui dort | 🗺️ | « Zap dit qu'un vieux xylophone tout brillant dort quelque part sur cette île. » ; « Sa carte le sait. Il ne lui manque que son dernier morceau ! » |
| 3 | `trompi` | Tout le monde arrive | 🎟️ | « Pouêêt ! J'ai vu des avions en papier dans le ciel : tous nos amis de l'expédition arrivent pour le concert ! » ; « Il y a Gribouille, Bao, Clémence et Plumette. Il ne manque plus que toi ! » |

### Le grand final (`js/features/story/finale3.js`, exports `openSeason3Finale(onDone, opts)` et `season3Done()`)

Même structure que `finale.js`. Déclenché dans `storyWin` juste après celui de la saison 2 : `if (world === 'concert' && !state.season3Done) { openSeason3Finale(onDone); return; }`.

| Écran | Titre (`h2`) | Image | Phrase dite et affichée | Bouton |
|---|---|---|---|---|
| Scène 1 (`.finale.finale3`, `data-step="0"`) | La carte est complète ! | `<div class="story-zapmap happy finale3-map">` + `zapMapSVG(ZAP_MAP_PIECES, { fresh: 'concert' })` (D20) | « Le dernier morceau se pose à sa place… La carte de Zap est complète ! Sa croix rouge montre le trésor, juste sous la grande scène. » | `#finale3-next` « Suite ➡️ » |
| Scène 2 (`data-step="1"`) | Le trésor de Zap | un xylophone doré (`xyloHTML({ lames: [0, 1, 2, 3, 4, 5, 6, 7], gold: true, names: false })`, non cliquable) | « « On creuse ? » dit Zap. Sous les planches, il y a un vieux coffre. Dedans… un xylophone tout en or ! » | `#finale3-next` « Suite ➡️ » (le même bouton, ré-rendu) |
| Scène 3 (`data-step="2"`) | Le grand concert | Zap, `companionSVG('zap', 'cheer')` | « « C'est le trésor de l'expédition, dit Zap. Il est pour toi. Ce soir, c'est toi qui ouvres le grand concert ! » » | `#finale3-next` (ré-rendu) « Mon trésor 🎁 », ou « La Grande Expédition ✅ » en revoyant le final (il mène alors à l'écran de fin) |
| Trésor (`.reward-box.finale-gift`) | Le xylophone d'or est à toi ! ✨ | le xylophone doré (`.finale3-treasure`) | « Le xylophone d'or est à toi ! Touche ses lames pour jouer ce que tu veux. Tu le retrouves dans Mon histoire, et auprès de Stella sur la grande scène. » | `#finale3-play` « 🎼 Jouer maintenant » ; `#finale3-later` « Plus tard » |
| Fin (`.reward-box.finale-done`) | La Grande Expédition ✅ | 🎼 en grand | première fois : « Bravo ! Tu as trouvé le trésor de Zap. La saison 3, la Grande Expédition, est terminée ! » ; en revoyant : « La Grande Expédition est terminée : le trésor de Zap est à toi ! » | `#finale3-end` « Continuer ✨ » |

- À la scène 1 : `playSound('win')`, `confetti()`, `vibrate([80, 60, 80, 60, 200])` (comme `finale.js:85-89`).
- Récompense donnée au début (`giveSeason3Rewards`) : si `state.season3Done` est déjà vrai, rien ; sinon `state.season3Done = true`, `save()`, `emit('season3:done')`.
- « 🎼 Jouer maintenant » : `openGoldenXylophone({ theme: false, onDone: écran de fin })`. « Plus tard » : écran de fin.
- Musique : `emit('music:theme', 'concert-fete')` à l'ouverture ; `onModalClose` remet `null` si le final était actif.

### Journal et dialogue

- Journal (`openStoryJournal`) : le bouton de la saison 2 devient `data-finale="2"` (inchangé sinon) ; le titre de la section `data-saison="3"` porte ` <span class="done">✅</span>` si `state.season3Done` ; après ses chapitres, si `state.season3Done` : `<button type="button" class="story-chap story-prologue" data-finale="3">` (icônes 🗺️ et 🎼, texte « Revoir le grand final ») puis `<button type="button" class="story-chap story-prologue" data-xylo>` (icônes 🎼 et ✨, texte « 🎼 Mon xylophone d'or »). Le gestionnaire de `[data-finale]` ouvre `openSeasonFinale` pour `"2"` et `openSeason3Finale(openStoryJournal, { replay: true })` pour `"3"` ; `[data-xylo]` ouvre `openGoldenXylophone({ onDone: openStoryJournal })`.
- Dialogue (`openDialogue`, `island-view.js`) : pour `charId === 'stella'` et `state.season3Done`, ajouter avant « Pas maintenant » `<button class="btn-craft" id="btn-xylo">🎼 Le xylophone d'or</button>`, qui ferme le dialogue et ouvre `openGoldenXylophone()`.

### Sauvegarde

- `season3Done: false` dans `DEFAULT_STATE` (`state.js:145`, à côté de `season2Done` ; l'état initial est `freshState()`, `state.js:194`, il n'y a plus de seconde copie) et `season3Done: boolean` dans le `@typedef` `GameState` (`state.js:97`, après `season2Done: boolean`), commentaire « le grand final de la saison 3 (Grand Concert) déjà joué : le xylophone d'or est gagné ».
- `SAVE_VERSION` : la version suivante au moment de la livraison. La PR met à jour la valeur attendue de `ev('SAVE_VERSION') === 9` dans `test/licornes.test.js:499` au nouveau numéro (même force : ce n'est pas un affaiblissement, D16 s'applique de la même façon) ; les nouveaux tests de migration de `test/concert.test.js` lisent `ev('SAVE_VERSION')` et ne mettent jamais de numéro en dur (une migration `{ v: SAVE_VERSION - 1 }`). C'est une migration distincte de celle de `saison3-ouverture` (`expeditionIntroSeen`) : chacune prend « la version suivante » au moment où elle est livrée, et leurs étapes de `migrate()` se suivent. Étape de `migrate()` : `if (v < N) { saved.season3Done = false; }` avec un commentaire.
- `load()` garde déjà les seules clés de `DEFAULT_STATE` (`state.js:294-301`) : une sauvegarde importée passe par la même porte (l'import écrit les clés puis appelle `load()`, `js/features/backup/backup.js:181-186`).

## Hors périmètre

- Changer `rhythm`, `pitch` ou `simon` (seul leur groupe parents change).
- Enregistrer ou rejouer ce que l'enfant joue sur le xylophone d'or ; un mode « chanson guidée ».
- Les autres îles de la saison 3, l'ouverture de la saison et la carte de Zap elle-même (track `saison3-ouverture`).
- Les voix enregistrées (track voix) : les textes de cette spec passent par `speak` comme les autres.
- Un compagnon ou un squishy trésor pour la saison 3.

## Contrats partagés

| Contrat | Forme (ou lien) | Propriétaire | Consommateurs |
|---|---|---|---|
| Slice `xylophone` | `XYLO_NOTES`, `xyloHTML`, `playXylo`, `staffSVG`, `openGoldenXylophone` (tables ci-dessus) | cette track | `notes`, `melody`, `story` (final, journal), `island` (dialogue) |
| `notesRound`, `melodyRound` | tables ci-dessus, dans `js/entities/difficulty/rounds-saison3.js`, réexportées par `js/entities/difficulty/index.js` | cette track | `notes`, `melody`, tests |
| Groupe parents `musique` | `SKILL_GROUPS`, 8ᵉ groupe | cette track | espace parents, track `bilan-parents` |
| `state.season3Done` | booléen, migré | cette track | final, journal, dialogue de Stella, paysage de l'île |
| Événement `season3:done` | `emit('season3:done')`, sans argument | cette track | personne aujourd'hui (pour les suites) |
| Thèmes `concert`, `concert-fete` | `MUSIC_THEMES` | cette track | xylophone d'or, final |
| Troisième archipel | `ARCHIPELAGOS[3]`, `ARCHIPELAGO_ORDER = [1, 2, 3]`, `refreshArchipelagos()`, `shownArchipelagos()`, `SEASON_OPENINGS`, `STORY_PROLOGUES[3]`, section du journal `.story-season[data-saison="3"]` | `saison3-ouverture` | `WORLDS.concert` , journal (boutons du final et du xylophone) |
| `ZAP_MAP_PIECES`, `zapMapFound()`, `zapMapPieces()`, `zapMapSVG(zapMapFound(), { fresh: id })`, `zapMapSay(n)`, `.story-zapmap` | exportés par `js/features/story/index.js` ; `ZAP_MAP_PIECES` se termine par `'concert'` (le 5ᵉ morceau, qui porte la croix du trésor) ; un morceau est gagné quand `state.storySolved.<id>` est vrai, rien d'autre n'est stocké | `saison3-ouverture` | victoire du chapitre (comportement 31), scène 1 du final (D20) |
| Îles précédentes | `WORLDS.crayons`, `WORLDS.dumplings`, `WORLDS.coffres`, `WORLDS.chatouilles` ; guides Gribouille (`gribouille`), Bao (`bao`), Clémence (`clemence`), Plumette (`plumette`) | `monde-crayons`, `monde-dumplings`, `monde-coffres`, `monde-chatouilles` | épisode 3, test de la carte |

## Surface d'attaque

| Entrée | Données ou appelant | Limites et vérifications | Peut atteindre | Jamais |
|---|---|---|---|---|
| `season3Done` d'une sauvegarde importée | fichier de sauvegarde (entrée non fiable, `js/features/backup/`) | clé connue gardée par `load()` ; lue par `!!` | afficher ou non le xylophone d'or | une erreur JS, du HTML injecté (la valeur n'est jamais insérée dans le DOM) |

## Zones sensibles touchées

Revue humaine obligatoire :
- Sauvegarde et migration : `js/entities/game-state/state.js` (`SAVE_VERSION`, `migrate`, `season3Done`).
- Espace parents : `js/features/parents/parents.js` (`SKILL_GROUPS`).
- PWA : `index.html` et `sw.js`, régénérés par `bun run sync` (nouvelles slices), jamais à la main.
- Manifeste des slices : `js/slices.cjs` reçoit trois slices (`xylophone`, `minigame-notes`, `minigame-melody`) sans rien assouplir.

## Smoke test

🤖 : un agent la prouve et joint la preuve. 👤 : seul l'humain peut juger (rendu, ressenti, écoute, téléphone).

| Id | Qui | Étapes | Attendu | Niveau visé |
|---|---|---|---|---|
| S1 | 🤖 | `bun run test concert` | comportements 1 à 14 et 16 à 24 et 26 à 43 vérifiés | test-verified |
| S2 | 🤖 | `bun run test games` | `notes` et `melody` gagnés à chaque palier 1 à 5 par leurs solveurs | test-verified |
| S3 | 🤖 | `bun run test companions` | 2 indices, aucune élimination, jeu gagnable après les indices, pour `notes` et `melody` | test-verified |
| S4 | 🤖 | `bun run test musique` | `rhythm` et `pitch` dans le groupe `musique` | test-verified |
| S5 | 🤖 | `bun run test smoke` et `bun run test niveaux` | chaque jeu a un groupe ; l'île dans le cadre, sans chevauchement, au niveau 102 | test-verified |
| S6 | 🤖 | `bun run test licornes` | le final de la saison 2 inchangé | test-verified |
| S7 | 🤖 | `bun run verify` | `check` et holdout (dont les sauvegardes réelles) verts | test-verified |
| S8 | 🤖 | `bun run test concert` : le test lit `js/features/xylophone/xylophone.css` (comme `test/smoke.test.js:1858-1862` lit les feuilles) | les règles du conteneur `.xylo`, de `.xylo-lame` (`min-width: 36px`, `gap: 4px`, `flex-wrap: nowrap`) et le `@media (max-width: 355px)` sont présentes ; jsdom ne fait pas de mise en page, il ne mesure rien | test-verified |
| S8b | 👤 | `bun run start`, téléphone ou vue 360 px, « Do, ré, mi » au palier 1 puis 4, et le xylophone d'or | lames lisibles et faciles à toucher, aucun débordement horizontal | humain |
| S9 | 👤 | Écouter les 8 lames au téléphone, son à 80 % | do à do aigu sonne juste et doux, aucune lame trop forte ou trop aiguë | humain |
| S10 | 👤 | Jouer « Do, ré, mi » et « La mélodie » son coupé | les deux restent jouables (♪ coloré, lames qui s'allument, partition) | humain |
| S11 | 👤 | La joueuse joue 3 mélodies du palier 1 et 2 | elle comprend qu'il faut rejouer, sans aide d'un adulte | humain |
| S12 | 👤 | Jouer le grand final, puis le xylophone d'or 2 minutes, musique activée | émotion du final ; le xylophone répond vite au doigt, sans fausse note avec la musique | humain |
| S13 | 👤 | Espace parents | « 🎵 Musique » regroupe rythme, grave ou aigu, notes et mélodie, chiffres intacts | humain |
| S14 | 👤 | La joueuse découvre Stella, Dorémi, Xylo, Trompi, leurs dessins et la série « Concert » | elle garde ou renomme les noms ; ses choix vont dans le journal de décisions du plan | humain |

## Questions ouvertes

