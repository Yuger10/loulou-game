<!-- Gabarit cothon 0.4.0 (setting-up-docs), adopté dans Conductor (cothon 0.2.0-2 et 0.4.0-6). -->
# Plan : 🎼 L'Île du Grand Concert (saison 3, île 5, grand final)

Spec : [spec.md](spec.md)

Chaque phase est une PR livrable seule (chaque merge est en production une minute après). Avant chaque PR : rebase sur `main`, `bun run verify`, puis la livraison selon la règle « Track livrée en plusieurs PR » de [conductor/workflow.md](../../workflow.md) (section « Fin de track : livraison ») : phases 1 et 2 par `bun run release patch "résumé"`, phase 3 (la dernière) par `bun run release track "résumé"`, numéro pris sur `main` après le rebase ; et la section du PRD. Les numéros entre parenthèses renvoient au « Comportement attendu » de la spec.

## Tâches

### Phase 1 : le xylophone partagé et « Do, ré, mi » (`notes`) : une PR

Visible après le merge : « Do, ré, mi » dans « Choisir un jeu » sur toutes les îles, et le groupe « 🎵 Musique » de l'espace parents.

- [ ] 1. Tests d'abord : créer `test/concert.test.js` (même harnais que `test/musique.test.js:1-70`) avec les sections « Le xylophone » (1 à 4) et « Do, ré, mi » (5 à 14). Lancer `bun run test concert` : échec attendu (slice absente).
- [ ] 2. Tests d'abord : solveur `notes` dans `test/games.test.js` (15), tel qu'écrit dans « Contrat DOM de `notes` et de `melody` » de la spec (il n'utilise que les sélecteurs de ce contrat).
- [ ] 3. Tests d'abord : dans `test/musique.test.js:289-291` et `351-353`, remplacer `"logique"` par `"musique"` et le libellé par « compétence « Musique » » (D16). Ajouter dans `test/concert.test.js` : `logique` ne contient plus `rhythm` ni `pitch` (13), et une partie avec `state.skills.rhythm` affiche ses chiffres sous « 🎵 Musique » (14).
- [ ] 4. Slice `js/features/xylophone/` (`xylophone.js`, `xylophone.css`, `index.js`) : `XYLO_NOTES`, `xyloHTML`, `playXylo`, `staffSVG` (tables de la spec). `openGoldenXylophone` n'est pas encore exporté. Déclarer la slice dans `js/slices.cjs` juste après `hints`, sa feuille dans `CSS_ORDER` avant `island.css`, et l'importer dans `js/app/main.js` juste après `../features/hints/index.js` (ligne 21).
- [ ] 5. `@typedef NotesRound` et `notesRound` (`@param`, `@returns {NotesRound}`) dans `js/entities/difficulty/rounds-saison3.js` (le créer s'il n'existe pas : déclaré dans la slice `difficulty` de `js/slices.cjs` après `difficulty.js`, réexporté par `js/entities/difficulty/index.js`, `tierValue` exporté par `difficulty.js` et importé de `./difficulty.js`) (bloc commenté comme `pitchRound`), exporté de ce fichier et ré-exporté par `js/entities/difficulty/index.js` (comme `nestingRound`, ligne 30).
- [ ] 6. `js/features/minigames/notes/` (`notes.js`, `notes.css`, `index.js`) : `renderNotes`, anti-répétition de la cible, `#notes-listen`, `loseLife(..., { onRetry: renderNotes, disable: false })`, `winSoon()`, `registerGame('notes', …)`, `registerHints('notes', …)`. Slice `minigame-notes` dans `js/slices.cjs` après `minigame-mirror`, CSS avant `island.css` ; `import '../features/minigames/notes/index.js';` dans `js/app/main.js` après la ligne de `mirror` (ligne 66).
- [ ] 7. Tables : `GAME_TYPES`, `AGE_GAME_TYPES` (tranche `max: 5` avec un commentaire comme pour `rhythm`), `GAME_LIST`, `GENEROUS_KINDS`, `NO_TIMER_KINDS`, `PROGRESS_CHEERS`.
- [ ] 8. `SKILL_GROUPS` : groupe `musique` en dernier (`rhythm`, `pitch`, `notes`), `logique` sans `rhythm` ni `pitch`.
- [ ] 9. `bun run sync`, puis `bun run typecheck` (strict sur tout `js/`) et `bun run check` verts.
- [ ] 10. Test S8 (règles CSS de `.xylo` présentes) ; S8b proposé à Amrou sur téléphone. Doc : `conductor/tracks.md` (phase 1 livrée).

### Phase 2 : « La mélodie » (`melody`) : une PR

Visible après le merge : « La mélodie » dans « Choisir un jeu » sur toutes les îles.

- [ ] 11. Tests d'abord : section « La mélodie » de `test/concert.test.js` (16 à 24) ; dans `test/games.test.js` (`playToWin`) et `test/companions.test.js`, l'attente de `#melody-state[data-turn="you"]` écrite dans « Jouable par le harnais » ; solveur `melody` dans `test/games.test.js` (25) : la suite des `data-n` de `#melody-score .ml-note` (et, en portée, `n = (104 - cy) / 8` qui doit donner la même suite) égale celle des lames de la solution. Échec attendu.
- [ ] 12. `@typedef MelodyRound` et `melodyRound` (`@returns {MelodyRound}`) dans `js/entities/difficulty/rounds-saison3.js`, réexporté par `js/entities/difficulty/index.js` ; `melody` dans `LIVES_TABLE` (`{ 2: 3, 3: 3, 4: 2, 5: 2 }`) et `NO_TIMER_KINDS`.
- [ ] 13. `js/features/minigames/melody/` : `MELODIES`, `renderMelody` (écoute à 650 ms, touches ignorées pendant l'écoute, `covered` au palier 3, lecture aux paliers 4 et 5 puis jeu de la mélodie et `winSoon(melodyReadEnd(n))` avec les constantes `MELODY_READ_STEP`, `MELODY_NOTE_MS`, `MELODY_END_MARGIN`), `#melody-listen`, `q.replay()` à 1,6 fois plus lent, indices. Slice `minigame-melody` après `minigame-notes`, et son import dans `js/app/main.js` après celui de `notes`.
- [ ] 14. Tables : `GAME_TYPES`, `AGE_GAME_TYPES` (`max: 5`), `GAME_LIST`, `PROGRESS_CHEERS`, `SKILL_GROUPS.musique` (+ `melody`).
- [ ] 15. `bun run typecheck` vert (strict sur tout `js/`) ; `bun run sync`, `bun run check` vert ; S8b (paliers 1 et 5) proposé à Amrou.

### Phase 3 : l'île, l'histoire, le grand final et le xylophone d'or : une PR

Prérequis : `saison3-ouverture` mergée (dont `characters-art-saison3.js` et `characters-art-kit.js`), et les quatre îles précédentes (`crayons`, `dumplings`, `coffres`, `chatouilles`) dans `WORLDS`. Visible après le merge : l'île au niveau 102, son chapitre, le final, le xylophone d'or.

- [ ] 15 bis. Tests existants à effectif figé (spec, « Tests existants touchés » ; `conductor/checklist-ile.md`, « 2 quater »), avant le code des personnages et des squishies : `test/smoke.test.js` « personnages : les N ids possèdent un SVG » (N + 4), `test/squishies.test.js` « 3 séries au lancement… » (`'concert'` à la fin) et « 6 modèles par série (N squishies) » et « noms uniques » (N + 6). Ils échouent jusqu'aux tâches 19 et 21.
- [ ] 16. Tests d'abord, clés en double : dans `test/concert.test.js`, une section « Clés uniques » qui échoue si une clé est écrasée ou reprise : le nombre d'entrées `world: 'concert'` vaut exactement 4 dans `CHARACTERS`, 8 dans `ITEMS`, 2 dans `CRAFTED`, 5 dans `DECOS`, 6 dans `SQUISHIES` (série `concert`), chacune avec le `name` de la spec (une clé en double dans un objet littéral écrase l'autre en silence) ; aucune clé de `ITEMS`, `CRAFTED`, `DECOS` n'est aussi une clé de `WARDROBE` (`js/features/wardrobe/wardrobe.js:61`) ; aucun id de `CHARACTERS` n'est un id de `COMPANIONS` ; aucun `name` de personnage de l'île n'est le `name` d'un autre personnage ou d'un compagnon ; `GAME_TYPES` n'a aucun doublon. Échec attendu avant les données.
- [ ] 16 bis. Tests d'abord : sections « L'île » (26 à 30), « Le chapitre et le final » (31 à 36, 40), « Le xylophone d'or » (37 à 39, 43) et « Sauvegarde » (41, 42) de `test/concert.test.js`. Échec attendu.
- [ ] 17. Sauvegarde (zone sensible) : `season3Done: boolean` dans le `@typedef GameState` et `season3Done: false` dans `DEFAULT_STATE` ; mettre `test/licornes.test.js:499` (`ev('SAVE_VERSION') === 9`) au nouveau numéro, même force ; les tests de migration de `test/concert.test.js` lisent `ev('SAVE_VERSION')`, sans numéro en dur. Puis `SAVE_VERSION` à la version suivante au moment de la livraison, étape de `migrate()`.
- [ ] 18. `WORLDS.concert` ; thème CSS ; `ISLE_SCENERY.concert` (avec le xylophone doré ou le drap selon `state.season3Done`).
- [ ] 19. Personnages (`characters.js`) et leurs 4 dessins dans `ART_S3` de `js/entities/character/characters-art-saison3.js` (aides de `characters-art-kit.js` ; aucun dessin existant ni `characters-art.js` touché).
- [ ] 20. Objets, recettes, décorations (`items.js`).
- [ ] 21. Série de squishies « Concert » (les 6 entrées `SQ_ART` et `SQ_BOX_COLORS.concert` dans `js/features/squishies/squishy-art.js`, sur le modèle de `'licorne-etoile'`, `squishy-art.js:550-558`) : catalogue (`js/entities/squishy/squishies.js`).
- [ ] 22. `MUSIC_THEMES.concert` et `'concert-fete'`.
- [ ] 23. `STORY.concert` et `EPISODES.concert`.
- [ ] 24. `openGoldenXylophone` dans la slice `xylophone` (export ajouté à son `index.js`).
- [ ] 25. `js/features/story/finale3.js` (déclaré dans la slice `story` après `finale.js`), son déclenchement dans `storyWin`, ses styles dans `story.css` ; journal (`data-finale="2"` et `"3"`, `data-xylo`, ✅) ; bouton `#btn-xylo` du dialogue de Stella.
- [ ] 26. `bun run sync`, `bun run typecheck` puis `bun run verify` verts (S1 à S7).
- [ ] 27. Doc : `conductor/niveaux.md` (« Dans le jeu, aujourd'hui » : la cinquième île de la saison 3 existe), `conductor/tracks.md`, `README.md` si la structure change ; section du PRD avec le paragraphe « Pour le parent » de la spec.
- [ ] 28. Lignes 👤 S9 à S14 proposées à Amrou et à la joueuse ; leurs choix (noms gardés ou changés) vont dans le journal de décisions.

## Preuves

Chaque affirmation pointe vers une preuve : commande exacte, code de sortie, chemin de la sortie. `build-only` n'est jamais une preuve de comportement.

| Ligne du smoke test | Résultat | Niveau | Preuve |
|---|---|---|---|
| S1 | à faire | test-verified | `bun run test concert` (exit 0) |
| S2 | à faire | test-verified | `bun run test games` (exit 0) |
| S3 | à faire | test-verified | `bun run test companions` (exit 0) |
| S4 | à faire | test-verified | `bun run test musique` (exit 0) |
| S5 | à faire | test-verified | `bun run test smoke`, `bun run test niveaux` (exit 0) |
| S6 | à faire | test-verified | `bun run test licornes` (exit 0) |
| S7 | à faire | test-verified | `bun run verify` (exit 0) |
| S8 | à faire | test-verified | `bun run test concert` (exit 0) |
| S8b | à faire | humain | réponse d'Amrou dans la PR |
| S9 à S14 | à faire | humain | réponse d'Amrou dans la PR |

## Journal de décisions

En ajout seul : une décision fausse reçoit une nouvelle ligne qui la remplace, on ne modifie ni ne supprime une ligne.

| # | Décision | Décidé par | Pourquoi | Preuve | Résultat |
|---|---|---|---|---|---|
| 1 | Trois phases : `notes`, `melody`, puis l'île avec le final | politique | Brief de la saison 3 : chaque mini-jeu seul, puis l'île ; le final reste avec son chapitre pour ne jamais livrer un chapitre qui ne mène nulle part | spec, Comportement attendu | gardée |

## Écarts et non vérifié

Rien pour l'instant.
