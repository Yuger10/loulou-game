<!-- Gabarit cothon 0.4.0 (setting-up-docs), adopté dans Conductor (cothon 0.2.0-2 et 0.4.0-6) : une nouvelle track part de ce fichier. -->
# Plan : aller plus loin (classe du profil et défi étoile)

Spec : [spec.md](spec.md)

Deux phases, deux PR. Chacune est livrable seule : la phase 1 ne montre que la carte « 🎒 Classe » (sans les puces des défis) ; la phase 2 ajoute tout le défi étoile d'un coup. Les numéros entre parenthèses renvoient au « Comportement attendu » de la spec.

## Tâches

### Phase 1 : la classe du profil (PR 1)

- [ ] 1. Écrire `test/aller-plus-loin.test.js` (JSDOM et `test/tools/page.js`, comme `test/stockage.test.js`), section « classe » : points 1 à 14. Lire l'état par son nom (`ev('playerCap({ age: 6, grade: "CE1" })')`, `ev('gameDiff()')` après avoir réglé `profiles`, `currentWorld`, `party`). Pour le point 2, écrire un profil abîmé dans `localStorage` puis appeler `loadProfiles()`. Vérifier qu'il échoue.
- [ ] 2. `js/entities/difficulty/age.js` : `GRADES`, `gradeToDiff`, `playerCap` (D1, D2), typés strictement selon D21 (`Grade`, `@param`, `@returns`) ; les exporter par `js/entities/difficulty/index.js`.
- [ ] 3. `js/entities/player/profiles.js` : dans `loadProfiles`, normaliser `p.grade` (liste blanche, sinon `''`) ; `addProfile` crée `grade: ''` (point 1, 2) ; étendre le `@typedef Profile` avec `grade?: string` (phase 1 ; `starChallenges?: boolean` vient en phase 2, tâche 18) selon D21 ; `bun run typecheck` vert.
- [ ] 4. `js/features/adaptive/game-diff.js` : `playerCap(p)` remplace `ageToDiff(p.age)` aux trois endroits (partie à plusieurs, solo, plafond de Zap) (points 4 à 8) ; `js/features/party/race.js:165,174` : `playerCap` remplace `ageToDiff` pour les étoiles de niveau (table « Usages de l'âge »).
- [ ] 5. `js/features/parents/parents.js` : carte « 🎒 Classe » juste après « 😴 Pause douce », puces `data-grade` (points 9 à 11), handlers avec `setHandler`, phrase d'aide de « Progrès par compétence » dans sa version **phase 1** (Politiques, « Textes du parent »).
- [ ] 6. `js/features/players/profiles-ui.js` : aide sous les âges quand une classe est choisie (point 12). `ageSelector` reçoit la classe en second paramètre.
- [ ] 7. Vérifier que le point 13 passe sans changer `gameTypesForAge`, et le point 14 tel qu'écrit (profil `{ age: 5, grade: 'CE1' }`, `state.skills.count.lvl = 4`, `playGame('count')`, `#challenge-timer` absent ; contrôle avec `age: 6`) sans changer le minuteur.
- [ ] 8. Doc : `ANALYSE-DIFFICULTE.md` (une section « Classe du profil » : la table D1 et la règle D6), `conductor/product-guidelines.md:8` (« de l'île et de la classe du profil, ou de son âge »). `bun run check` passe.
- [ ] 9. Livraison : rebase sur `main`, `bun run release patch "classe du profil dans l'espace parents"`, PR avec le résumé et les risques (zone sensible : espace parents, profils).

### Phase 2 : le défi étoile (PR 2)

- [ ] 10. Compléter `test/aller-plus-loin.test.js`, section « défi étoile » : points 15 à 38. Entrer dans une mission étoile en écrivant `state.stars.count = { streak: 0, open: true, miss: 0, won: 0, offered: null }` puis en appelant `playGame('count')` (point 23) ; terminer par `onMissionWin()` ou `onMissionFail()` ; une erreur : `loseLife(null)` ; une bonne étape : `stepOk(null)` ; le badge se lit après `await wait(0)`. Point 31 : recharger une page neuve comme `test/stockage.test.js` (second `new JSDOM(page.buildHtml(), { beforeParse })` qui recopie le `localStorage`, puis `ev2`). Remplacer `Math.random` pour les tirages. Vérifier qu'il échoue.
- [ ] 11. `js/entities/game-state/state.js` : `stars: {}` dans `DEFAULT_STATE`, `SAVE_VERSION` passe à `SAVE_VERSION + 1` (10 aujourd'hui, ou le suivant de `main` après rebase), branche de `migrate()` (point 15) ; `@typedef StarRecord`, champ `stars: Record<string, StarRecord>` dans `GameState`, réexport de `StarRecord` par `js/entities/game-state/index.js` (D21) ; `bun run typecheck` vert. Le test fabrique la sauvegarde précédente avec `v: ev('SAVE_VERSION') - 1` et compare avec `ev('SAVE_VERSION')`, sans numéro en dur. `test/licornes.test.js:499` fige aujourd'hui `SAVE_VERSION === 9` : comme chaque track de migration, la PR met cette valeur à jour vers le nouveau numéro (le test garde la même force) et le signale dans le corps de la PR.
- [ ] 12. `js/features/adaptive/day.js` (nouveau, ajouté à la slice `adaptive`) : `todayKey` y est déplacé depuis `skills.js` ; `adaptive/index.js` l'exporte depuis `./day.js` ; `skills.js` l'importe de `./day.js` (Politiques, « Imports de la slice `adaptive` », pas de cycle). `js/features/adaptive/stars.js` (nouveau, ajouté à la slice `adaptive` dans `js/slices.cjs`, puis `bun run sync`) : toute l'API des « Contrats partagés », dont `starActive()` (règle « Palier étoile » de la spec), `beginStarMission(k)` (ferme la porte si l'interrupteur est coupé, point 36), `endStarMission()`, `closeAllStarDoors(st)`, `starsResetFor(st)` ; constantes `STAR_STREAK`, `STAR_MISS_LIMIT` ; annotations JSDoc selon D21 ; variables de module `starMission` (sur le modèle de `bonusChallenge`, `session.js:18-37`) et « offre déjà faite depuis l'ouverture » ; exporter par `js/features/adaptive/index.js`.
- [ ] 13. `js/features/adaptive/game-diff.js` : `normalDiff()` (le calcul actuel, sans porte) ; `gameDiff()` renvoie `starTier(lastGame)` si `starActive()`, sinon `normalDiff()` (points 22, 23, 26, 33, 34).
- [ ] 14. `js/features/adaptive/skills.js` (importe `starAfterMission` de `./stars.js` et `todayKey` de `./day.js`, sans cycle) : dans `recordMission`, une mission étoile compte comme le défi de Zap (point 28) ; sinon `starAfterMission` met `streak` à jour (point 16).
- [ ] 15. `js/features/minigame-engine/engine.js` : `playGame` appelle `beginStarMission(key)` après `bonusOnNewGame()` ; `onMissionWin` et `onMissionFail` appellent `endStarMission()` à côté de `endBonusChallenge()` ; `triesFor` et `startTimerIfNeeded` lisent `normalDiff()` (point 24) ; `loseLife` appelle `noteStarError()` et, s'il renvoie `true`, retire `.star-badge` (26) ; `stepOk` appelle `noteStarGood()` (25) ; badge : `onModalOpen(() => setTimeout(starBadgeDecorate, 0))` et `starBadgeDecorate()` dans `engine.js` (23 ; `screen.js` ne change pas) ; écran de victoire : bloc d'offre si `starOfferDue(lastGame)` (règle « Offre due »), boutons, phrase dite, ligne de réussite (17, 20 à 22, 27, 30) ; écran d'échec en mission étoile (29, 30) ; mission dont la porte s'est fermée en cours : pas d'étoile, texte du point 30 seul en victoire, après le message habituel en échec (D20) ; refus de l'offre par `speak` (20), refus silencieux par `#btn-yay`, `#btn-again` et la croix (21). Tests : `textContent` et phrases de `speak` comparés après `\u00a0` remplacé par une espace.
- [ ] 16. `js/features/players/profiles-ui.js` : `.star-mark` sur le bouton d'un jeu dont `won` vaut au moins 1 (32).
- [ ] 17. `js/features/companion-team/specialties.js` : `zapGameFor` écarte les jeux à porte ouverte (34).
- [ ] 18. `js/entities/player/profiles.js` : `starChallenges?: boolean` dans le `@typedef Profile` (D21). `js/features/parents/parents.js` : puces des défis dans la carte « 🎒 Classe » (35) ; « Pas de défi étoile » appelle `closeAllStarDoors(st)` (36) ; un changement de classe appelle `starsResetFor(st)` (37) ; pour le profil courant `st` est `state` puis `save()`, pour un autre profil écriture comme `parents.js:329-340` ; ligne « défi étoile réussi » (38) ; phrase d'aide de « Progrès par compétence » dans sa version **phase 2**, et aide sous les puces de défi (Politiques, « Textes du parent »).
- [ ] 19. `js/features/adaptive/adaptive.css` : `.star-offer`, `.star-badge`, `.star-mark` (boutons d'au moins 64 px de haut au doigt).
- [ ] 20. Doc : `ANALYSE-DIFFICULTE.md` (le défi étoile, D8 à D11), `conductor/product-guidelines.md` (une ligne : « Aller plus loin sans pression : défi étoile refusable, retiré sans rien perdre »). `bun run check` passe.
- [ ] 21. Livraison : rebase sur `main`, `bun run release track "aller plus loin : classe du profil et défi étoile"`, compléter la section du PRD, PR (zones sensibles : sauvegarde et migration, espace parents).

## Preuves

| Ligne du smoke test | Résultat | Niveau | Preuve |
|---|---|---|---|
| S1 | | test-verified | `bun run test aller-plus-loin` (exit 0) |
| S2 | | test-verified | `bun run test aller-plus-loin` (exit 0) |
| S3 | | runtime-verified | `bun run check` (exit 0) |
| S4 | | e2e-verified | 👤 Amrou |
| S5 | | e2e-verified | 👤 Amrou et sa fille |
| S6 | | e2e-verified | 👤 Amrou et sa fille |

## Journal de décisions

| # | Décision | Décidé par | Pourquoi | Preuve | Résultat |
|---|---|---|---|---|---|
| 1 | Deux PR : classe, puis défi étoile | spec | chaque merge est en production ; la classe est utile seule | spec, Comportement attendu | gardée |

## Écarts et non vérifié

- Le rédacteur n'a pas pu lire le PDF de Deci, Koestner et Ryan (1999) avec son outil : D12 repose sur la source fournie par le brief.
- Le ressenti de l'offre et du retour au jeu habituel (S5, S6) ne se prouve pas par un test.
