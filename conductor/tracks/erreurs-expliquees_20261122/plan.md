<!-- Gabarit cothon 0.4.0 (setting-up-docs), adopté dans Conductor (cothon 0.2.0-2 et 0.4.0-6) : une nouvelle track part de ce fichier. -->
# Plan : les erreurs expliquées

Spec : [spec.md](spec.md)

Trois phases, trois PR livrables seules (défaut de Claude, à juger à la revue par Amrou). **Livraison** : chaque PR intermédiaire se livre par `bun run release patch "résumé"`, la dernière PR de la track par `bun run release track "résumé"` ; le numéro est le suivant sur `main` au moment de la livraison, après rebase (`docs/adr/0005-versions-66x.md`, `test/tools/release.js`). Ici : phases 1 et 2 en `patch`, phase 3 en `track`. Les autres jeux sont des suites hors de cette track (spec, « Hors périmètre »). Rien n'est visible à moitié : un jeu a ses explications au complet, ou garde le comportement d'avant.

## Tâches

### Phase 1 : le contrat, le moteur, le garde, et 5 jeux (`count`, `compare`, `math`, `calc`, `clock`)

- [ ] 1. `test/explications.test.js` (harnais de `test/companions.test.js:1-40` : temps ×0,1, voix notée) : constantes `LEGACY_GAMES` (les 30 clés de `GAME_TYPES` d'aujourd'hui), `EXPLAIN_NEVER = ['memory','simon']`, `EXPLAIN_EXEMPT` (23 jeux en phase 1 : les 18 de la spec plus `puzzle`, `money`, `packs`, `share`, `ladybugs`), `EXPLAIN_EXEMPT_MAX = 23` ; le garde de la ligne 17. Il échoue (pas de `hasExplain`).
- [ ] 2. Même fichier : la voix est comparée à `ev('toSpoken(' + JSON.stringify(say) + ')')` (nom lisible sans export, `test/tools/page.js:1-15`) ; les lignes des tables de `count`, `compare`, `math`, `calc`, `clock` (ligne 14, `explainFor` avec des questions fixes) ; le parcours par palier (ligne 18) ; lignes 3, 4, 5, 6, 8, 10, 11, 12, 13. Ils échouent.
- [ ] 3. `hints.js` (`onExplain` ajouté au type JSDoc de `hintPolicy`, D19 ; `bun run typecheck` vert) : `registerExplain`, `hasExplain`, `explainFor`, `explainShow`, `explainClear`, `hintPolicy.onExplain` ; bulle `.explain-bubble` (structure de la spec, section « La bulle ») ; `fx.fill` ; marques `explain-mark` ; marqueur `explaining` ; son `onModalChange` appelle `explainClear()` (aucune minuterie dans `hints`). Export dans `hints/index.js`. CSS partagée `.hint-bubble, .explain-bubble`.
- [ ] 4. `engine.js` : `EXPLAIN_MS`, `scheduleRetry(fn, delay)`, le déroulé de `loseLife` (spec, section « Le déroulé »), `onMissionFail` retardé ; le moteur possède toutes les minuteries (relance, « Raté ! », `explainClear` d'une question continuée), annulées par son `onModalChange`. Export de `EXPLAIN_MS`.
- [ ] 5. `specialties.js` : `onExplain: () => teamSayClear()` (D9).
- [ ] 6. Les 5 jeux : option `wrong` dans `loseLife`, `registerExplain(… { wrong })`, clé de la dernière question (table « Clés de question ») et son repli après 8 tirages identiques ; test du repli en forçant `Math.random` (8 tirages identiques puis clé différente), et constante `SINGLE_QUESTION = []` dans le test (ligne 5).
- [ ] 6 bis. Cas 2 seulement (`setRoundHandlers` déjà exporté par le moteur sur `main`) : test puis câblage de `explainShow` dans le mode manche, selon « Ordre de livraison avec `revision-espacee` » de la spec.
- [ ] 7. `conductor/checklist-mini-jeu.md` : en section 1, « `test/explications.test.js` : ses explications d'erreur sont vérifiées » ; en section 3, une puce « Ses explications d'erreur (contrat `registerExplain` de `js/features/hints/hints.js`) : `wrong(q, v)` → `{ say, fx }`, 3 à 12 mots, pourquoi la réponse ne va pas, puis la bonne réponse si la question est remplacée, jamais si elle continue ; `loseLife(el, { wrong })` ; `right(q)` facultatif ; un nouveau jeu n'est jamais exempté ».
- [ ] 8. Si un jeu de la saison 3 est déjà sur `main` : ses explications selon les règles de la spec (table au journal de décisions).
- [ ] 9. `bun run check` vert ; `bun run verify` vert ; `bun run release patch "erreurs expliquées : contrat et 5 jeux"`. AGENTS.md : rien à changer (la checklist porte la règle).

### Phase 2 : `puzzle`, `money`, `packs`, `share`, `ladybugs`

- [ ] 10. Tests : lignes des tables de ces 5 jeux, parcours par palier, `puzzle` (ligne 7, S3). Ils échouent.
- [ ] 11. Les 5 jeux : `wrong`, `registerExplain`, clé `moneyLast`, clé de `packs` ramenée à `size-n-extra`, replis de la table « Clés de question », table « Où est la bonne réponse » (dont `ladybugs` `complete`). Retrait des 5 de `EXPLAIN_EXEMPT`, `EXPLAIN_EXEMPT_MAX = 18`.
- [ ] 12. `bun run check` vert ; `bun run release patch "erreurs expliquées : 5 jeux de plus"`.

### Phase 3 : les phrases de stratégie et l'éloge du processus

- [ ] 13. Tests : ligne 15 (chacun des 10 jeux, chaque cas de la table `right`), ligne 16 (`winPraises`), jeu exempté sans `.win-how`. Ils échouent.
- [ ] 14. `hints.js` : `strategyLine()`. `engine.js` : `winPraises(who)`, ligne `.win-how` (🧠 et la phrase) sous le titre, phrase dite après l'éloge, en solo seulement. `right` dans les 10 jeux.
- [ ] 15. `bun run check` vert ; `bun run release track "erreurs expliquées : 10 jeux de nombres, phrases de stratégie"`, section du PRD.

## Preuves

| Ligne du smoke test | Résultat | Niveau | Preuve |
|---|---|---|---|
| S1 à S9 | à faire | test-verified | `bun run test explications` (exit 0), `bun run check` (exit 0) |
| S10 à S12 | à faire | runtime-verified | Amrou, téléphone |

## Journal de décisions

En ajout seul : une décision fausse reçoit une nouvelle ligne qui la remplace, on ne modifie ni ne supprime une ligne.

| # | Décision | Décidé par | Pourquoi | Preuve | Résultat |
|---|---|---|---|---|---|
| 1 | La phase 1 exempte 23 jeux (dont les 5 de la phase 2) ; la phase 2 ramène à 18 | spec | Chaque phase reste livrable seule et le garde passe à chaque PR | spec, « Politique et phasage » | gardée |
| 2 | Phases 4 à 7 retirées du plan : suites hors périmètre | défaut | Track de taille M ; `EXPLAIN_EXEMPT` suit le reste | spec D18 | gardée |

## Écarts et non vérifié

- La page EEF et la page de l'université de Washington n'ont pas pu être relues (HTTP 403) ; le PDF de Mueller et Dweck est un scan, seul son résumé PubMed a été relu.
- La durée réelle de la voix de l'appareil pour une phrase de 12 mots n'est pas mesurable en test : ligne S10.
