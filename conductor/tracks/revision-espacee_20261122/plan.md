<!-- Gabarit cothon 0.4.0 (setting-up-docs), adopté dans Conductor (cothon 0.2.0-2 et 0.4.0-6) : une nouvelle track part de ce fichier. -->
# Plan : la révision espacée (« les souvenirs »)

Spec : [spec.md](spec.md)

Deux phases, une PR chacune. La phase 1 ne montre rien à l'enfant (elle garde les questions ratées) ; la phase 2 ouvre la mission. La track ne dépend pas de `erreurs-expliquees` : elle code toujours la branche de repli (la bonne réponse brille, D12, D18). Le câblage des explications suit la section « Ordre de livraison » de la spec : avant de commencer la phase 2, regarder sur `main` si `EXPLAIN_MS` est exporté par `js/features/minigame-engine/index.js` (cas 2 : tâche 10 bis) ou non (cas 1 : rien à câbler). Zones sensibles : relecture humaine des deux PR (sauvegarde, migration, import).

## Tâches

**Livraison** : chaque PR intermédiaire se livre par `bun run release patch "résumé"`, la dernière PR de la track par `bun run release track "résumé"` ; le numéro est le suivant sur `main` au moment de la livraison, après rebase (`docs/adr/0005-versions-66x.md`, `test/tools/release.js`). Ici : phase 1 en `patch`, phase 2 en `track`.

### Phase 1 : l'item, la file, la migration, la capture

- [ ] 1. `test/revision.test.js`, partie pure : `dayKey`, `addDays` (changement de mois, d'année, d'heure d'été), `reviewKey`, `validParams` (chaque borne de la table, dedans et dehors), `addMiss` (lignes 1, 2, 4), `reviewAnswer` (table de l'échéancier, 3 erreurs, ligne 19), `pickDue` (ligne 11), `sanitizeReview` (ligne 6, S3). Ils échouent.
- [ ] 2. Entité `js/entities/review/` (`review.js`, `index.js`), fonctions pures typées strictement (`@typedef` et signatures de « Contrats partagés », jamais `any` ni `@ts-ignore`), `bun run typecheck` vert, déclarée dans `js/slices.cjs` sous l'identifiant `review-queue`, après `words`, avant `game-state` (D20). Tests verts.
- [ ] 3. Tests de migration et de chargement : ancienne sauvegarde sans `review` (ligne 5) ; sauvegardes trafiquées chargées et importées par `applyBackup` (S3). Ils échouent.
- [ ] 4. `state.js` : `review: ReviewState` dans le `@typedef GameState` et `review: { items: [], offered: null }` dans `DEFAULT_STATE` (la seule liste des champs : `state` est fabriqué par `freshState()`) ; un test de redémarrage, sur le modèle de `test/redemarrage.test.js`, vérifie qu'une file enregistrée survit au rechargement de la page ; `SAVE_VERSION` à la version suivante au moment de la livraison ; étape de `migrate()` qui pose `review` ; dans la même PR, `test/licornes.test.js:499` attend le nouveau numéro (`ev('SAVE_VERSION') === N`, même force, règle D6) ; les nouveaux tests de migration lisent `SAVE_VERSION` ; `load()` appelle `sanitizeReview(state.review, dayKey(new Date()))` après le tri des clés. Tests verts, `bun run verify` vert (holdout inchangé).
- [ ] 5. Tests de capture en JSDOM avec `Date` simulée (S2) et d'aller-retour `item`/`render` (lignes 7, 8, S4). Ils échouent.
- [ ] 6. `hints.js` : `currentHintQuestion()`. `engine.js` : `emit('answer:wrong', { kind, q })` dans `loseLife` (solo, `el` non nul, hors défi bonus, hors manche).
- [ ] 7. Feature `js/features/review/` (`review.js`, `index.js`) : `registerReplay`, écoute de `answer:wrong` (refus si `party.active`, `race.active`, `inBonusChallenge()`), `addMiss`, `save()`. Code vérifié en strict par `bun run typecheck` (D22), vert. Déclarée dans `js/slices.cjs` sous l'identifiant `review`, après `minigame-engine`, avant `minigame-memory`, avec `review.css` dans `css` et dans `CSS_ORDER` (D20 ; fichier CSS vide avec un commentaire en phase 1). `bun run sync`.
- [ ] 8. Les 5 jeux : rendu à partir de `p` (`renderX(p)` si `p && p.g === '<jeu>'`) et `registerReplay`. Tests verts, `bun run check` vert, `bun run verify` vert. `bun run release patch "révision espacée : les questions ratées sont gardées"`.

### Phase 2 : la mission « souvenirs »

- [ ] 9. Tests (S6, S7) : déroulé daté de la ligne 15 (horloge du harnais ×0,1 : 1500 ms deviennent 150 ms) ; transitions complètes de la table « Transitions d'un item » ; proposition (ligne 9), refus (10), choix et ordre (11), pas de minuteur ni de cœurs (12), avancement (13), erreur avec et sans explication (14), arrêt après 2 erreurs (15), fin sans rien gagner (16 : `coins`, `inventory`, `missions`, `skills`, `quests` identiques avant et après), fermeture en cours (17), à plusieurs (18), pause due. Ils échouent.
- [ ] 10. `engine.js` : `setRoundHandlers` et le mode manche (D18), dont le verrou des boutons après une erreur, et `pendingRoundTimer` annulé par `onModalChange` (table « Minuteries de la mission ») ; code vérifié en strict (D22), `bun run typecheck` vert.
- [ ] 10 bis. Cas 2 seulement (`erreurs-expliquees` déjà livrée) : test de la ligne 14 bis (il échoue), puis branche `explainShow` dans le mode manche de `loseLife`.
- [ ] 11. Feature `review` : `maybeOfferReview()` (un seul `emit('game:before', 'souvenirs')` avant la proposition, un seul `emit('game:after')` à la fin normale ; par question, seulement `setLastGame` puis `render(p)` : table « Ce que fait le démarrage »), fenêtre `#review-offer`, déroulé de la mission, badge, écran de fin, textes de la table, `review.css` (badge). `onModalClose` arrête la mission.
- [ ] 12. `js/app/init.js` : `if (!maybeSeasonGift() && !maybeSkyOpening() && !teamOnSessionStart()) maybeOfferReview();` (en dernier, dans le `setTimeout(…, 700)` de `init.js:100-102`). `bun run sync`.
- [ ] 13. `bun run check` vert, `bun run verify` vert ; `bun run release track "les souvenirs : révision espacée des questions ratées"` ; section du PRD (dire que l'idée vient de la recherche, pas de la joueuse).

## Preuves

| Ligne du smoke test | Résultat | Niveau | Preuve |
|---|---|---|---|
| S1 à S4 | à faire | test-verified | `bun run test revision` (exit 0) |
| S5 | à faire | test-verified | `bun run verify` (exit 0) |
| S6 à S8 | à faire | test-verified | `bun run test revision`, `bun run check` (exit 0) |
| S9, S10 | à faire | runtime-verified | Amrou et sa fille, sur 3 jours |

## Journal de décisions

En ajout seul : une décision fausse reçoit une nouvelle ligne qui la remplace, on ne modifie ni ne supprime une ligne.

| # | Décision | Décidé par | Pourquoi | Preuve | Résultat |
|---|---|---|---|---|---|
| 1 | La phase 1 garde des items sans les montrer | spec | Migration et capture relues seules (zone sensible), avant tout écran | spec, « Zones sensibles touchées » | gardée |

## Écarts et non vérifié

- La page de l'éditeur Springer demande une connexion : le résumé d'Agarwal et al. 2021 a été relu via Crossref et Semantic Scholar.
- Le PDF de Deci et al. 1999 n'a pas pu être lu en texte ici ; son résumé PubMed l'a été.
- L'effet réel chez la joueuse n'est pas mesurable par le jeu (aucune analytique) : lignes S9 et S10.
