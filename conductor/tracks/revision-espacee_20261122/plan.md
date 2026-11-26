<!-- Gabarit cothon 0.4.0 (setting-up-docs), adopté dans Conductor (cothon 0.2.0-2 et 0.4.0-6) : une nouvelle track part de ce fichier. -->
# Plan : la révision espacée (« les souvenirs »)

Spec : [spec.md](spec.md)

Deux phases, une PR chacune. La phase 1 ne montre rien à l'enfant (elle garde les questions ratées) ; la phase 2 ouvre la mission. La track ne dépend pas de `erreurs-expliquees` : elle code toujours la branche de repli (la bonne réponse brille, D12, D18). Le câblage des explications suit la section « Ordre de livraison » de la spec : avant de commencer la phase 2, regarder sur `main` si `EXPLAIN_MS` est exporté par `js/features/minigame-engine/index.js` (cas 2 : tâche 10 bis) ou non (cas 1 : rien à câbler). Zones sensibles : relecture humaine des deux PR (sauvegarde, migration, import).

## Tâches

**Livraison** : chaque PR intermédiaire se livre par `bun run release patch "résumé"`, la dernière PR de la track par `bun run release track "résumé"` ; le numéro est le suivant sur `main` au moment de la livraison, après rebase (`docs/adr/0005-versions-66x.md`, `test/tools/release.js`). Ici : phase 1 en `patch`, phase 2 en `track`.

### Phase 1 : l'item, la file, la migration, la capture

Tous les tests de la track vont dans `test/revision.test.js` (`bun run test revision`) ; seule exception, la mise à jour de `test/licornes.test.js:499` (D6). Les tests de redémarrage et d'import y suivent seulement le modèle de `test/redemarrage.test.js` et `test/parties-importees.test.js`.

- [x] 1. `test/revision.test.js`, partie pure : `dayKey`, `addDays` (changement de mois, d'année, d'heure d'été), `reviewKey`, `validParams` (chaque borne de la table, dedans et dehors), `addMiss` (lignes 1, 2, 4), `reviewAnswer` (table de l'échéancier, 3 erreurs, ligne 19), `pickDue` (ligne 11), `sanitizeReview` (ligne 6, S3). Ils échouent.
- [x] 2. Entité `js/entities/review/` (`review.js`, `index.js`), fonctions pures typées strictement (`@typedef` et signatures de « Contrats partagés », jamais `any` ni `@ts-ignore`), `bun run typecheck` vert, déclarée dans `js/slices.cjs` sous l'identifiant `review-queue`, après `words`, avant `game-state` (D20). Tests verts.
- [x] 3. Dans `test/revision.test.js`, tests de migration et de chargement : ancienne sauvegarde sans `review` (ligne 5) ; sauvegardes trafiquées chargées et importées par `applyBackup`, et lues par `profileState` de l'espace parents (S3), sur le modèle de `test/parties-importees.test.js`. Ils échouent.
- [x] 4. `state.js` : `review: ReviewState` dans le `@typedef GameState` et `review: { items: [], offered: null }` dans `DEFAULT_STATE` (la seule liste des champs : `state` est fabriqué par `freshState()`) ; un test de redémarrage dans `test/revision.test.js`, sur le modèle de `test/redemarrage.test.js`, vérifie qu'une file enregistrée survit au rechargement de la page ; `SAVE_VERSION` à la version suivante au moment de la livraison ; étape de `migrate()` qui pose `review` ; dans la même PR, `test/licornes.test.js:499` attend le nouveau numéro (`ev('SAVE_VERSION') === N`, même force, règle D6) ; les nouveaux tests de migration lisent `SAVE_VERSION` ; `readSave()` appelle `st.review = sanitizeReview(st.review, dayKey(new Date()))` après `freshState`, à côté de `cleanSkills` et `cleanRestLog` (D7). Tests verts, `bun run verify` vert (holdout inchangé).
- [x] 5. Tests de capture en JSDOM avec `Date` simulée (S2) et d'aller-retour `item`/`render` (lignes 7, 8, S4). Ils échouent.
- [x] 6. `hints.js` : `currentHintQuestion()`. `engine.js` : `emit('answer:wrong', { kind, q })` dans `loseLife` (solo, `el` non nul, hors défi bonus, hors manche).
- [x] 7. Feature `js/features/review/` (`review.js`, `index.js`) : `registerReplay`, écoute de `answer:wrong` (refus si `party.active`, `race.active`, `inBonusChallenge()`), `addMiss`, `save()`. Code vérifié en strict par `bun run typecheck` (D22), vert. Déclarée dans `js/slices.cjs` sous l'identifiant `review`, après `minigame-engine`, avant `minigame-memory`, avec `review.css` dans `css` et dans `CSS_ORDER` (D20 ; fichier CSS vide avec un commentaire en phase 1). `bun run sync`.
- [x] 8. Les 5 jeux : rendu à partir de `p` (`renderX(p)` si `p && p.g === '<jeu>'`) et `registerReplay`. Tests verts, `bun run check` vert, `bun run verify` vert. `bun run release patch "révision espacée : les questions ratées sont gardées"`.

### Phase 2 : la mission « souvenirs »

- [x] 9. Tests (S6, S7) : déroulé daté de la ligne 15 (horloge du harnais ×0,1 : 1500 ms deviennent 150 ms) ; transitions complètes de la table « Transitions d'un item » ; proposition (ligne 9), refus (10), choix et ordre (11), pas de minuteur ni de cœurs (12), avancement (13), erreur avec et sans explication (14), arrêt après 2 erreurs (15), fin sans rien gagner (16 : `coins`, `inventory`, `missions`, `skills`, `quests` identiques avant et après), fermeture en cours (17), à plusieurs (18), pause due. Ils échouent.
- [x] 10. `engine.js` : `setRoundHandlers` et le mode manche (D18), `setRoundHandlers(null)` au début de `playGame` (test S7 : un jeu normal après une mission abandonnée a ses cœurs et son minuteur), dont le verrou des boutons après une erreur, et `pendingRoundTimer` annulé par `onModalChange` (table « Minuteries de la mission ») ; code vérifié en strict (D22), `bun run typecheck` vert.
- [x] 10 bis. (sans objet : cas 1, `EXPLAIN_MS` n'est pas exporté par le moteur sur `main` au 26/11/2026, voir le journal de décisions) Cas 2 seulement (`erreurs-expliquees` déjà livrée) : test de la ligne 14 bis (il échoue), puis branche `explainShow` dans le mode manche de `loseLife`.
- [x] 11. Feature `review` : `maybeOfferReview()` (un seul `emit('game:before', 'souvenirs')` avant la proposition, un seul `emit('game:after')` à la fin normale ; par question, seulement `setLastGame` puis `render(p)` : table « Ce que fait le démarrage »), fenêtre `#review-offer`, déroulé de la mission, badge, écran de fin, textes de la table, `review.css` (badge). `onModalClose` arrête la mission.
- [x] 12. `js/app/init.js` : `if (!maybeSeasonGift() && !maybeSkyOpening() && !teamOnSessionStart()) maybeOfferReview();` (en dernier, dans le `setTimeout(…, 700)` de `init.js:100-102`) ; pour l'ouverture de saison, le nom en vigueur sur `main` : `maybeSkyOpening`, ou `maybeSeasonOpening` si `saison3-ouverture` est déjà livrée. La track qui renomme met à jour cet appel. `bun run sync`.
- [x] 13. `bun run check` vert, `bun run verify` vert ; `bun run release track "les souvenirs : révision espacée des questions ratées"` ; section du PRD (dire que l'idée vient de la recherche, pas de la joueuse).

## Preuves

| Ligne du smoke test | Résultat | Niveau | Preuve |
|---|---|---|---|
| S1 à S4 | réussi | test-verified | `bun run test revision` (exit 0, 382 vérifications) ; rouge constaté avant le code : 135 échecs sur 136 (`sanitizeReview is not defined`…), puis 22 échecs (`state.review` absent), puis les captures (`{"items":[],"offered":null}`, `REVIEW_REPLAYS is not defined`) |
| S5 | réussi | test-verified | `bun run verify` (exit 0) : le holdout des sauvegardes passe sans modification |
| S6 à S8 | réussi | test-verified | `bun run test revision`, `bun run check` (exit 0) ; rouge constaté avant le code : la proposition ne s'ouvre pas (`#review-offer` absent) |
| S9, S10 | à faire par Amrou | runtime-verified | Amrou et sa fille, sur 3 jours (vérification manuelle proposée dans la PR) |

## Journal de décisions

En ajout seul : une décision fausse reçoit une nouvelle ligne qui la remplace, on ne modifie ni ne supprime une ligne.

| # | Décision | Décidé par | Pourquoi | Preuve | Résultat |
|---|---|---|---|---|---|
| 1 | La phase 1 garde des items sans les montrer | spec | Migration et capture relues seules (zone sensible), avant tout écran | spec, « Zones sensibles touchées » | gardée |
| 2 | Une seule PR pour toute la track, livrée une fois par `bun run release track` (pas de `release patch` pour la phase 1) : remplace la ligne 1 | Amrou (consigne du 26/11/2026, relayée par le workflow) | Consigne qui prime sur le découpage du plan | un commit par phase sur `track/revision-espacee` | appliquée |
| 3 | Cas 1 de « Ordre de livraison » : seule la branche de repli est codée, tâche 10 bis sans objet | agent | `EXPLAIN_MS` n'est pas exporté par `js/features/minigame-engine/index.js` sur `origin/main` au 26/11/2026 | `git grep EXPLAIN_MS origin/main` : aucun résultat | à reprendre par la track livrée en second |
| 4 | `test/licornes.test.js` : deux valeurs passent de 9 à 10, celle que la spec nomme (`ev('SAVE_VERSION')`) et, six lignes plus bas, `m.v` de la migration v8 | agent | Même cause (`SAVE_VERSION` 10), même force ; la seconde n'est pas nommée par la spec | `bun run test licornes` rouge avec `m.v === 9`, vert avec 10 | à juger à la revue |
| 5 | En mode manche, une seconde réponse (bonne ou mauvaise) pendant `WIN_DELAY` ou `REVIEW_SHOW_MS` est ignorée | agent | « Seule la première réponse compte » (ligne 14) vaut aussi après une bonne réponse : sinon un double toucher avancerait deux questions | test « la bonne réponse touchée ensuite ne compte pas » | à juger à la revue |
| 6 | Pause due : `offered` n'est pas posé, la proposition peut venir à la séance suivante | agent | La spec dit « pas de proposition » sans dire si le jour est consommé ; le plus prudent est de ne pas le consommer | test « la pause gagne toujours » | à juger à la revue |
| 7 | `sanitizeReview` recopie chaque item champ par champ (`cleanParams`), et lit `mult` seul si un `calc` porte aussi `first` | agent | « Champs inconnus retirés » ; une seule forme par item | tests S1 et S3 | à juger à la revue |
| 8 | Un calcul dont un résultat dépasse 100 (possible au palier 5 ou 6 : 100 + 1) n'est pas gardé | agent | Hors des bornes de la spec ; `item()` rend `null` | test d'aller-retour (exception notée) | à juger à la revue |
| 9 | Identifiants et classes non écrits dans la spec : `#review-yes`, `#review-later`, `#review-end`, `#review-done`, `.review-badge`, `.has-review` ; la proposition reprend `.team-meet`, l'écran de fin `.reward-box` | agent | Détails non écrits : l'option la plus simple | `js/features/review/review.js` | à juger à la revue |
| 10 | `js/entities/review/` n'est pas ajouté aux zones sensibles de `test/tools/sensitive.js` (le garde est lui-même une zone sensible) | agent | La validation d'une entrée non fiable y vit pourtant : proposition pour Amrou | PR, « ce qui attend une décision » | à décider par Amrou |
| 11 | Relecture de la PR #106, garde `violations ajoutées` de la CI (complexité et taille, que ni `check` ni `verify` ne lancent) : `test/revision.test.js` est découpé en petites fonctions (50 lignes, complexité 20, profondeur 4, 3 paramètres au plus), sans changer une seule vérification ; `js/entities/review/review.js` passe sous 300 lignes (deux JSDoc de fonctions internes sur une ligne, aucun code changé) | agent | La garde bloque `ci-ok` : 13 violations ajoutées | `new-violations.sh --base origin/main -- quality-check.sh complexite` : 13 ajoutées avant, 3 après ; les 382 vérifications ont le même nom, le même ordre et le même résultat avant et après | appliquée |
| 12 | `addMiss(rv, p, t, today)` et `reviewAnswer(rv, k, ok, today)` gardent leurs 4 paramètres | agent | La spec les impose (« Contrats partagés ») et la garde en accepte 3 : changer un contrat validé ou accepter une exception n'est pas à l'agent ; le plus prudent est de garder la spec | 2 violations `max-params` restantes | à décider par Amrou |
| 13 | `test/revision.test.js` reste un seul fichier (1 716 lignes) | agent | La spec impose un seul fichier (S1) et la garde 300 lignes par fichier, tests compris, alors que `.oxlintrc.json` exempte `test/**` de `max-lines` ; le plus prudent est de garder la spec | 1 violation `max-lines` restante | à décider par Amrou |

## Écarts et non vérifié

- La page de l'éditeur Springer demande une connexion : le résumé d'Agarwal et al. 2021 a été relu via Crossref et Semantic Scholar.
- Le PDF de Deci et al. 1999 n'a pas pu être lu en texte ici ; son résumé PubMed l'a été.
- L'effet réel chez la joueuse n'est pas mesurable par le jeu (aucune analytique) : lignes S9 et S10.
