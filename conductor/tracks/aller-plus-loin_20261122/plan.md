<!-- Gabarit cothon 0.4.0 (setting-up-docs), adopté dans Conductor (cothon 0.2.0-2 et 0.4.0-6) : une nouvelle track part de ce fichier. -->
# Plan : aller plus loin (classe du profil et défi étoile)

Spec : [spec.md](spec.md)

Deux phases, deux PR. Chacune est livrable seule : la phase 1 ne montre que la carte « 🎒 Classe » (sans les puces des défis) ; la phase 2 ajoute tout le défi étoile d'un coup. Les numéros entre parenthèses renvoient au « Comportement attendu » de la spec.

## Tâches

### Phase 1 : la classe du profil (PR 1)

- [x] 1. Écrire `test/aller-plus-loin.test.js` (JSDOM et `test/tools/page.js`, comme `test/stockage.test.js`), section « classe » : points 1 à 14. Lire l'état par son nom (`ev('playerCap({ age: 6, grade: "CE1" })')`, `ev('gameDiff()')` après avoir réglé `profiles`, `currentWorld`, `party`). Pour le point 2, écrire un profil abîmé dans `localStorage` puis appeler `loadProfiles()`. Vérifier qu'il échoue.
- [x] 2. `js/entities/difficulty/age.js` : `GRADES`, `gradeToDiff`, `playerCap` (D1, D2), typés strictement selon D21 (`Grade`, `@param`, `@returns`) ; les exporter par `js/entities/difficulty/index.js`.
- [x] 3. `js/entities/player/profiles.js` : dans `loadProfiles`, normaliser `p.grade` (liste blanche, sinon `''`) ; `addProfile` crée `grade: ''` (point 1, 2) ; étendre le `@typedef Profile` avec `grade?: string` (phase 1 ; `starChallenges?: boolean` vient en phase 2, tâche 18) selon D21 ; `bun run typecheck` vert.
- [x] 4. `js/features/adaptive/game-diff.js` : `playerCap(p)` remplace `ageToDiff(p.age)` aux trois endroits (partie à plusieurs, solo, plafond de Zap) (points 4 à 8) ; `js/features/party/race.js:165,174` : `playerCap` remplace `ageToDiff` pour les étoiles de niveau (table « Usages de l'âge »).
- [x] 5. `js/features/parents/parents.js` : carte « 🎒 Classe » juste après « 😴 Pause douce », puces `data-grade` (points 9 à 11), handlers avec `setHandler`, phrase d'aide de « Progrès par compétence » dans sa version **phase 1** (Politiques, « Textes du parent »).
- [x] 6. `js/features/players/profiles-ui.js` : aide sous les âges quand une classe est choisie (point 12). `ageSelector` reçoit la classe en second paramètre.
- [x] 7. Vérifier que le point 13 passe sans changer `gameTypesForAge`, et le point 14 tel qu'écrit (profil `{ age: 5, grade: 'CE1' }`, `state.skills.count.lvl = 4`, `playGame('count')`, `#challenge-timer` absent ; contrôle avec `age: 6`) sans changer le minuteur.
- [x] 8. Doc : `ANALYSE-DIFFICULTE.md` (une section « Classe du profil » : la table D1 et la règle D6), `conductor/product-guidelines.md:8` (« de l'île et de la classe du profil, ou de son âge »). `bun run check` passe.
- [x] 9. Sans objet : consigne d'Amrou du 26/11/2026, une seule PR pour toute la track (journal, décision 2). Pas de `release patch` ni de PR intermédiaire ; la phase 1 est commitée et poussée seule (29158b7).

### Phase 2 : le défi étoile (PR 2)

- [x] 10. Compléter `test/aller-plus-loin.test.js`, section « défi étoile » : points 15 à 38. Entrer dans une mission étoile en écrivant `state.stars.count = { streak: 0, open: true, miss: 0, won: 0, offered: null }` puis en appelant `playGame('count')` (point 23) ; terminer par `onMissionWin()` ou `onMissionFail()` ; une erreur : `loseLife(null)` ; une bonne étape : `stepOk(null)` ; le badge se lit après `await wait(0)`. Point 31 : recharger une page neuve comme `test/stockage.test.js` (second `new JSDOM(page.buildHtml(), { beforeParse })` qui recopie le `localStorage`, puis `ev2`). Remplacer `Math.random` pour les tirages. Vérifier qu'il échoue.
- [x] 11. `js/entities/game-state/state.js` : `stars: {}` dans `DEFAULT_STATE` ; `cleanStars(raw)` appelée dans `readSave()` après `freshState` (Surface d'attaque), avec un test d'une partie abîmée sur le modèle de `test/parties-importees.test.js` (un jeu absent reste absent, `open: 'oui'` devient `false`, `won: -2` devient 0) ; `SAVE_VERSION` passe à `SAVE_VERSION + 1` (10 aujourd'hui, ou le suivant de `main` après rebase), branche de `migrate()` (point 15) ; `@typedef StarRecord`, champ `stars: Record<string, StarRecord>` dans `GameState`, réexport de `StarRecord` par `js/entities/game-state/index.js` (D21) ; `bun run typecheck` vert. Le test fabrique la sauvegarde précédente avec `v: ev('SAVE_VERSION') - 1` et compare avec `ev('SAVE_VERSION')`, sans numéro en dur. `test/licornes.test.js:499` fige aujourd'hui `SAVE_VERSION === 9` : comme chaque track de migration, la PR met cette valeur à jour vers le nouveau numéro (le test garde la même force) et le signale dans le corps de la PR.
- [x] 12. `js/features/adaptive/day.js` (nouveau, ajouté à la slice `adaptive`) : `todayKey` y est déplacé depuis `skills.js` ; `adaptive/index.js` l'exporte depuis `./day.js` ; `skills.js` l'importe de `./day.js` (Politiques, « Imports de la slice `adaptive` », pas de cycle). `js/features/adaptive/stars.js` (nouveau, ajouté à la slice `adaptive` dans `js/slices.cjs`, puis `bun run sync`) : toute l'API des « Contrats partagés », dont `starActive()` (règle « Palier étoile » de la spec), `beginStarMission(k)` (ferme la porte si l'interrupteur est coupé, point 36), `endStarMission()`, `closeAllStarDoors(st)`, `starsResetFor(st)` ; constantes `STAR_STREAK`, `STAR_MISS_LIMIT` ; annotations JSDoc selon D21 ; variables de module `starMission` (sur le modèle de `bonusChallenge`, `session.js:18-37`) et « offre déjà faite depuis l'ouverture » ; exporter par `js/features/adaptive/index.js`.
- [x] 13. `js/features/adaptive/game-diff.js` : `normalDiff()` (le calcul actuel, sans porte) ; `gameDiff()` renvoie `starTier(lastGame)` si `starActive()`, sinon `normalDiff()` (points 22, 23, 26, 33, 34).
- [x] 14. `js/features/adaptive/skills.js` (importe `starAfterMission` de `./stars.js` et `todayKey` de `./day.js`, sans cycle) : dans `recordMission`, une mission étoile compte comme le défi de Zap (point 28) ; sinon `starAfterMission` met `streak` à jour (point 16).
- [x] 15. `js/features/minigame-engine/engine.js` : `playGame` appelle `beginStarMission(key)` après `bonusOnNewGame()` ; `onMissionWin` et `onMissionFail` appellent `endStarMission()` à côté de `endBonusChallenge()` ; `triesFor` et `startTimerIfNeeded` lisent `normalDiff()` (point 24) ; `loseLife` appelle `noteStarError()` et, s'il renvoie `true`, retire `.star-badge` (26) ; `stepOk` appelle `noteStarGood()` (25) ; badge : `onModalOpen(() => setTimeout(starBadgeDecorate, 0))` et `starBadgeDecorate()` dans `engine.js` (23 ; `screen.js` ne change pas) ; écran de victoire : bloc d'offre si `starOfferDue(lastGame)` (règle « Offre due »), boutons, phrase dite, ligne de réussite (17, 20 à 22, 27, 30) ; écran d'échec en mission étoile (29, 30) ; mission dont la porte s'est fermée en cours : pas d'étoile, texte du point 30 seul en victoire, après le message habituel en échec (D20) ; refus de l'offre par `speak` (20), refus silencieux par `#btn-yay`, `#btn-again` et la croix (21). Tests : `textContent` et phrases de `speak` comparés après `\u00a0` remplacé par une espace.
- [x] 16. `js/features/players/profiles-ui.js` : `.star-mark` sur le bouton d'un jeu dont `won` vaut au moins 1 (32).
- [x] 17. `js/features/companion-team/specialties.js` : `zapGameFor` écarte les jeux à porte ouverte (34).
- [x] 18. `js/entities/player/profiles.js` : `starChallenges?: boolean` dans le `@typedef Profile` (D21). `js/features/parents/parents.js` : puces des défis dans la carte « 🎒 Classe » (35) ; « Pas de défi étoile » appelle `closeAllStarDoors(st)` (36) ; un changement de classe appelle `starsResetFor(st)` (37) ; pour le profil courant `st` est `state` puis `save()`, pour un autre profil écriture comme `parents.js:356-371` ; ligne « défi étoile réussi » (38) ; phrase d'aide de « Progrès par compétence » dans sa version **phase 2**, et aide sous les puces de défi (Politiques, « Textes du parent »).
- [x] 19. `js/features/adaptive/adaptive.css` : `.star-offer`, `.star-badge`, `.star-mark` (boutons d'au moins 64 px de haut au doigt).
- [x] 20. Doc : `ANALYSE-DIFFICULTE.md` (le défi étoile, D8 à D11), `conductor/product-guidelines.md` (une ligne : « Aller plus loin sans pression : défi étoile refusable, retiré sans rien perdre »). `bun run check` passe.
- [x] 21. Livraison : rebase sur `main`, `bun run release track "aller plus loin : classe du profil et défi étoile"`, compléter la section du PRD, PR (zones sensibles : sauvegarde et migration, espace parents).

## Preuves

| Ligne du smoke test | Résultat | Niveau | Preuve |
|---|---|---|---|
| S1 | vert | test-verified | `bun run test aller-plus-loin` : sortie 1 sans le changement (168 en échec, dont « gradeToDiff is not defined »), sortie 0 avec (`prove-red-green.sh --base origin/conductor/specs-validees`) |
| S2 | vert | test-verified | même commande : les points 15 à 38 rouges avant le code (127 en échec après la phase 1), verts après ; 209 vérifications |
| S3 | vert | runtime-verified | `bun run check` (exit 0) |
| S4 | à faire | e2e-verified | 👤 Amrou |
| S5 | à faire | e2e-verified | 👤 Amrou et sa fille |
| S6 | à faire | e2e-verified | 👤 Amrou et sa fille |

## Journal de décisions

| # | Décision | Décidé par | Pourquoi | Preuve | Résultat |
|---|---|---|---|---|---|
| 1 | Deux PR : classe, puis défi étoile | spec | chaque merge est en production ; la classe est utile seule | spec, Comportement attendu | remplacée par la décision 2 |
| 2 | Une seule PR pour toute la track, livrée par un seul `bun run release track` | Amrou (consigne du workflow, 26/11/2026) | consigne qui prime sur le découpage écrit dans les specs et plans | corps de la PR | appliquée ; la tâche 9 est sans objet |
| 3 | `beginStarMission(k)` lit le défi de Zap par sa clé (`bonusChallenge.key === k`), pas par `inBonusChallenge()` | Claude | `playGame` l'appelle juste après `bonusOnNewGame()`, avant `setLastGame(key)` : `inBonusChallenge()` comparerait encore le jeu précédent | `test/aller-plus-loin.test.js`, point 34 | à juger à la revue |
| 4 | La voix dit la phrase de réussite sans le ⭐ final | Claude | `speak` lit ⭐ « étoile » : « Ce jeu gagne son étoile étoile » ; le texte affiché garde le ⭐ | test « la voix ne lit pas le ⭐ final » | à juger à la revue |
| 5 | `loadProfiles` remet aussi `starChallenges` en forme (un booléen, sinon absent) | Claude | D4 dit « normalisés à la lecture » pour les deux champs ; le plan ne citait que le typedef | test « un interrupteur abîmé » | à juger à la revue |
| 6 | `closeAllStarDoors(st)` et `starsResetFor(st)` renvoient `true` si quelque chose a changé ; l'espace parents n'écrit la partie que dans ce cas | Claude | sans cela, régler la classe d'un enfant qui n'a jamais joué écrirait une partie vide `{}` dans son stockage | tests des points 36 et 37 (autre enfant) | à juger à la revue |
| 7 | `starsResetFor` n'est appelé que si la classe change vraiment (toucher la puce déjà choisie ne remet rien à 0) | Claude | option la plus prudente : ne rien retirer sans changement de plafond | test « toucher la même classe » | à juger à la revue |
| 8 | Sans âge ni classe, `streak` ne bouge pas | Claude | D8 définit le plafond du jeu par `playerCap`, inconnu ici ; l'offre serait de toute façon refusée (condition 3) | lecture du code | à juger à la revue |
| 9 | L'aide « classe CE1, choisie par un adulte » n'apparaît que si un âge est choisi | spec (point 12, « quand l'âge est choisi ») | lecture à la lettre ; sans âge, le texte actuel reste | test du point 12 | à juger à la revue |
| 10 | `test/licornes.test.js` : deux assertions passent de 9 à 10 (lignes 499 et 526), la spec ne nommait que la 499 | Claude | la ligne 526 (`m.v === 9` après `migrate`) fige la même version dans le même test ; même force, seul le numéro change | diff du test | à signaler dans la PR |
| 11 | Toasts des puces de défi : « ⭐ Défis étoile » et « Pas de défi étoile » | Claude | détail non écrit : le libellé de la puce, comme le toast de la musique | lecture du code | à juger à la revue |
| 12 | Une mission étoile quittée par la croix garde `miss` tel quel ; changer l'âge dans le formulaire du joueur ne ferme pas les portes | Claude | la spec ne parle que d'erreurs « d'affilée » et du changement de classe ; rien ajouté hors spec | lecture du code | question pour Amrou |

## Écarts et non vérifié

- Une seule PR au lieu de deux (journal, décision 2) : la v67 livre la classe et le défi étoile ensemble.
- S4 à S6 (téléphone, ressenti de la joueuse) restent à faire par Amrou ; la vérification manuelle proposée est dans le corps de la PR.
- Le rendu visuel du bloc d'offre, du badge et de l'étoile du choix des jeux n'a pas été regardé dans un navigateur par l'agent (jsdom seulement).

- Le rédacteur n'a pas pu lire le PDF de Deci, Koestner et Ryan (1999) avec son outil : D12 repose sur la source fournie par le brief.
- Le ressenti de l'offre et du retour au jeu habituel (S5, S6) ne se prouve pas par un test.
