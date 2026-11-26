<!-- Gabarit cothon 0.4.0 (setting-up-docs), adopté dans Conductor (cothon 0.2.0-2 et 0.4.0-6) : une nouvelle track part de ce fichier. -->
# Plan : les erreurs expliquées

Spec : [spec.md](spec.md)

Trois phases, trois PR livrables seules (défaut de Claude, à juger à la revue par Amrou). **Livraison** : chaque PR intermédiaire se livre par `bun run release patch "résumé"`, la dernière PR de la track par `bun run release track "résumé"` ; le numéro est le suivant sur `main` au moment de la livraison, après rebase (`docs/adr/0005-versions-66x.md`, `test/tools/release.js`). Ici : phases 1 et 2 en `patch`, phase 3 en `track`. Les autres jeux sont des suites hors de cette track (spec, « Hors périmètre »). Rien n'est visible à moitié : un jeu a ses explications au complet, ou garde le comportement d'avant.

## Tâches

### Phase 1 : le contrat, le moteur, le garde, et 5 jeux (`count`, `compare`, `math`, `calc`, `clock`)

- [x] 1. `test/explications.test.js` (harnais de `test/companions.test.js:1-40` : temps ×0,1, voix notée) : constantes `LEGACY_GAMES` (les 30 clés de `GAME_TYPES` d'aujourd'hui), `EXPLAIN_NEVER = ['memory','simon']`, `EXPLAIN_EXEMPT` (23 jeux en phase 1 : les 18 de la spec plus `puzzle`, `money`, `packs`, `share`, `ladybugs`), `EXPLAIN_EXEMPT_MAX = 23` ; le garde de la ligne 17, écrit comme une fonction pure `explainGuard(...)` du test (S7 l'appelle avec des listes en mémoire). Il échoue (pas de `hasExplain`).
- [x] 2. Même fichier : la voix est comparée à `ev('toSpoken(' + JSON.stringify(say) + ')')` (nom lisible sans export, `test/tools/page.js:1-15`) ; les lignes des tables de `count`, `compare`, `math`, `calc`, `clock` (ligne 14, `explainFor` avec des questions fixes) ; le parcours par palier (ligne 18) ; lignes 3, 4, 5, 6, 8, 10, 11, 12, 13. Ils échouent.
- [x] 3. `hints.js` (`onExplain` ajouté au type JSDoc de `hintPolicy`, D19 ; `bun run typecheck` vert) : `registerExplain`, `hasExplain`, `explainFor`, `explainShow`, `explainClear`, `hintPolicy.onExplain` ; bulle `.explain-bubble` (structure de la spec, section « La bulle ») ; `fx.fill` ; marques `explain-mark` ; marqueur `explaining` ; son `onModalChange` appelle `explainClear()` (aucune minuterie dans `hints`). Export dans `hints/index.js`. CSS partagée `.hint-bubble, .explain-bubble`.
- [x] 4. `engine.js` : `EXPLAIN_MS`, `scheduleRetry(fn, delay)`, le déroulé de `loseLife` (spec, section « Le déroulé »), `onMissionFail` retardé ; le moteur possède toutes les minuteries (relance, « Raté ! », `explainClear` d'une question continuée), annulées par son `onModalChange`. Export de `EXPLAIN_MS`.
- [x] 5. `specialties.js` : `onExplain: () => teamSayClear()` (D9). Réécrire les deux assertions de `test/companions.test.js` listées dans la spec (section « Tests existants touchés ») : attente sur `hint.q`, scénario de Grisou sur `simon`.
- [x] 6. Les 5 jeux : option `wrong` dans `loseLife`, `registerExplain(… { wrong })`, clé de la dernière question (table « Clés de question ») et son repli après 8 tirages identiques ; test du repli en forçant `Math.random` (8 tirages identiques puis clé différente), et constante `SINGLE_QUESTION = []` dans le test (ligne 5).
- [x] 6 bis. (sans objet : cas 1, le moteur n'exporte pas `setRoundHandlers` sur `main` le 26/11/2026) Cas 2 seulement (`setRoundHandlers` déjà exporté par le moteur sur `main`) : test puis câblage de `explainShow` dans le mode manche, selon « Ordre de livraison avec `revision-espacee` » de la spec.
- [x] 7. `conductor/checklist-mini-jeu.md` : en section 1, « `test/explications.test.js` : ses explications d'erreur sont vérifiées » ; en section 3, une puce « Ses explications d'erreur (contrat `registerExplain` de `js/features/hints/hints.js`) : `wrong(q, v)` → `{ say, fx }`, 3 à 12 mots, pourquoi la réponse ne va pas, puis la bonne réponse si la question est remplacée, jamais si elle continue ; `loseLife(el, { wrong })` ; `right(q)` facultatif ; un nouveau jeu n'est jamais exempté ».
- [x] 8. (sans objet : aucun jeu de la saison 3 sur `main` le 26/11/2026, `GAME_TYPES` compte les 30 jeux de `LEGACY_GAMES`) Si un jeu de la saison 3 est déjà sur `main` : ses explications selon les règles de la spec (table au journal de décisions).
- [x] 9. (une seule livraison, journal ligne 3 : `bun run release track`, v67) `bun run check` vert ; `bun run verify` vert ; `bun run release patch "erreurs expliquées : contrat et 5 jeux"`, puis compléter la section ajoutée à la fin de `PRD-lagon-magique.md` avant la PR. AGENTS.md : rien à changer (la checklist porte la règle).

### Phase 2 : `puzzle`, `money`, `packs`, `share`, `ladybugs`

- [x] 10. Tests : lignes des tables de ces 5 jeux, parcours par palier, `puzzle` (ligne 7, S3). Ils échouent.
- [x] 11. Les 5 jeux : `wrong`, `registerExplain`, clé `moneyLast`, clé de `packs` ramenée à `size-n-extra`, replis de la table « Clés de question », table « Où est la bonne réponse » (dont `ladybugs` `complete`). Retrait des 5 de `EXPLAIN_EXEMPT`, `EXPLAIN_EXEMPT_MAX = 18`.
- [x] 12. (une seule livraison, journal ligne 3 : `bun run release track`, v67) `bun run check` vert ; `bun run release patch "erreurs expliquées : 5 jeux de plus"`, puis compléter la section ajoutée à la fin de `PRD-lagon-magique.md` avant la PR.

### Phase 3 : les phrases de stratégie et l'éloge du processus

- [x] 13. Tests : ligne 15 (chacun des 10 jeux, chaque cas de la table `right`), ligne 16 (`winPraises`), jeu exempté sans `.win-how`. Ils échouent.
- [x] 14. `hints.js` : `strategyLine()`. `engine.js` : `winPraises(who)`, ligne `.win-how` (🧠 et la phrase) sous le titre, phrase dite après l'éloge, en solo seulement. `right` dans les 10 jeux.
- [x] 15. (une seule livraison, journal ligne 3 : `bun run release track`, v67) `bun run check` vert ; `bun run release track "erreurs expliquées : 10 jeux de nombres, phrases de stratégie"`, puis compléter la section ajoutée à la fin de `PRD-lagon-magique.md` avant la PR.

## Preuves

| Ligne du smoke test | Résultat | Niveau | Preuve |
|---|---|---|---|
| S1 | fait | test-verified | `bun run test explications` : « chaque ligne des tables : say exact, fx conforme (72 lignes) » ; rouge avant le code (« pas d'explication », `explainFor` absent) |
| S2 | fait | test-verified | même test : « bulle, voix, verrou, bonne réponse montrée, relance à 4 s, autre question, jeu gagnable » (153 parties sur les 8 morceaux) |
| S3 | fait | test-verified | même test : « puzzle : 3 rangs, la réponse n'est jamais dite ni montrée, le verrou se lève » |
| S4 | fait | test-verified | même test : « count au palier 5 », « puzzle, dernier essai : explication, puis « Raté ! » après EXPLAIN_MS » |
| S5 | fait | test-verified | même test : « à plusieurs : aucune explication », « temps écoulé : aucune explication » |
| S6 | fait | test-verified | même test : « reading : relance à 900 ms », « diff : « Raté ! » à 520 ms » |
| S7 | fait | test-verified | même test : section « Garde des jeux exemptés » (4 cas refusés par leur nom, les vraies listes passent) |
| S8 | fait | test-verified | même test : « chaque cas de la table : la phrase exacte (31 cas) », « victoire : la ligne 🧠 sous le titre, dite une fois, juste après l'éloge » (51 victoires) |
| S9 | fait | test-verified | `bun run check` (exit 0), `bun run verify` (exit 0) |
| S10 à S12 | à faire | runtime-verified | Amrou, téléphone (vérification manuelle proposée dans la PR) |

## Journal de décisions

En ajout seul : une décision fausse reçoit une nouvelle ligne qui la remplace, on ne modifie ni ne supprime une ligne.

| # | Décision | Décidé par | Pourquoi | Preuve | Résultat |
|---|---|---|---|---|---|
| 1 | La phase 1 exempte 23 jeux (dont les 5 de la phase 2) ; la phase 2 ramène à 18 | spec | Chaque phase reste livrable seule et le garde passe à chaque PR | spec, « Politique et phasage » | gardée |
| 2 | Phases 4 à 7 retirées du plan : suites hors périmètre | défaut | Track de taille M ; `EXPLAIN_EXEMPT` suit le reste | spec D18 | gardée |
| 3 | Une seule PR pour toute la track, livrée une fois par `bun run release track` (pas de `release patch` par phase) | Amrou (consigne du 26/11/2026) | La consigne prime sur le découpage en trois PR de D18 | consigne du workflow | gardée |
| 4 | Le tirage « jamais la même question » est une fonction du moteur, `drawOther(tirage, clé, { last, fallback })`, et chaque jeu a sa fonction `<jeu>Question(dd)` qui tire la question avant les réponses | agent | Une seule écriture de la boucle des 8 tirages pour 10 jeux ; le test du repli force `Math.random` sur le tirage de la question seule (un `Math.random` constant ferait tourner sans fin la boucle des réponses proposées) | `test/explications.test.js`, section « le repli » | gardée |
| 5 | Une étiquette déjà posée (`.hint-mark`) n'est jamais la cible d'un effet (`applyHintFx`) | agent | Les sélecteurs de la spec (`span:nth-child(k)`, `span:nth-last-child(-n+b)`) désignent aussi les étiquettes posées juste avant : elles seraient étiquetées ou barrées à leur tour | `js/features/hints/hints.js`, `applyHintFx` | gardée |
| 6 | `explainClear()` ne rouvre pas un bouton que le moteur a refermé entre-temps (classe `ko`) ; à essais illimités sans relance, le moteur le rouvre lui-même à la fin des 4 s | agent | À essais limités sans relance, la mauvaise réponse reste fermée comme avant ; la spec ne dit pas qui la rouvre | `engine.js`, `loseLifeUnlimited` | gardée |
| 7 | `test/smoke.test.js`, « 2e erreur : il reste 1 essai » : la 2e erreur se joue sur `diff` (exempté, même île, mêmes 3 essais) au lieu de `count` | agent, **à valider par Amrou** | La spec affirmait que les tests de fumée restaient justes : c'est faux pour cette assertion, qui touche une 2e mauvaise réponse tout de suite après la 1re ; sur `count`, le verrou (ligne 3, D7) ferme les réponses pendant 4 s, puis la question suivante repart avec 3 essais. Réécriture de même force (même scénario sur un cas équivalent, règle de `conductor/workflow.md`), plus une assertion ajoutée | `bun run test smoke` rouge avant la réécriture (« 2e erreur : il reste 1 essai »), vert après | à juger à la revue |
| 8 | `money` : pas d'explication (comportement d'avant) quand la pile touchée est la pile de secours de `moneyOptions`, dont le total affiché n'est pas la somme de ses pièces | agent | La phrase « Cette pile fait {v} » serait fausse ; cas rare (30 tirages sans trouver deux autres totaux), qui existait avant la track | `money.js`, `moneyExplain` | gardée |
| 9 | `test/explications.test.js` note les délais demandés à `setTimeout` (4000, 900, 520, 700) en plus du temps réel écoulé | agent | Un délai se vérifie alors sans dépendre de la charge de la machine (d'autres agents lancent les tests en même temps) ; le temps réel ne sert que de borne basse | `test/explications.test.js`, `timeouts` | gardée |
| 10 | Cas 1 de « Ordre de livraison avec `revision-espacee` » : rien à câbler | spec | Le moteur n'exporte pas `setRoundHandlers` sur `main` le 26/11/2026 ; `revision-espacee` câblera `explainShow` dans son mode manche | `grep -rn setRoundHandlers js` : aucun résultat | gardée |
| 11 | Les tests de la track tiennent en trois suites (`test/explications.test.js`, `test/explications-parcours.test.js`, `test/explications-strategies.test.js`) et un dossier d'aide `test/explications/` ; l'explication de `calc` a son fichier (`js/features/minigames/calc/explain.js`, déclaré dans `js/slices.cjs`) ; `drawOther`, `moneyOptions` et `calcExplainStep` prennent 3 paramètres au plus | agent, après la revue de la PR #107 | Le contrôle « violations ajoutées » de la CI (complexité et taille, absent de `bun run check`) comptait 10 violations ajoutées, donc `ci-ok` rouge. Les mêmes 50 vérifications tournent, par leurs noms (comparaison avant et après) | `bash .cothon/bin/new-violations.sh --base origin/main -- bash .cothon/bin/quality-check.sh complexite --project .` : 10 ajoutées avant, 0 après | gardée |
| 12 | `explainGuard` reçoit un objet `{ games, explained, exempt, never, legacy, max }` au lieu des 6 paramètres écrits par la spec (S7) | agent, **à valider par Amrou** | 6 paramètres dépassent le seuil de 3 du même contrôle ; les six listes gardent leurs noms, le garde reste pur et dans `test/explications.test.js` | `test/explications.test.js`, `explainGuard` | gardée |

## Écarts et non vérifié

- La page EEF et la page de l'université de Washington n'ont pas pu être relues (HTTP 403) ; le PDF de Mueller et Dweck est un scan, seul son résumé PubMed a été relu.
- La durée réelle de la voix de l'appareil pour une phrase de 12 mots n'est pas mesurable en test : ligne S10.
- La spec (S7, D13) écrit `explainGuard(games, explained, exempt, never, legacy, max)` et un seul fichier `test/explications.test.js` : le garde prend un objet aux six mêmes noms, et les tests tiennent en trois suites (journal, lignes 11 et 12). La spec n'est pas réécrite : à valider par Amrou.
- Une assertion de `test/smoke.test.js` que la spec ne listait pas a dû être réécrite (journal, ligne 7) : à valider par Amrou.
- Cas limite de la table « Clés de question » : pour `calc`, le repli peut donner un `+ 0` (résultat au maximum du palier et dernier nombre égal à 1). Il faut 9 tirages identiques d'affilée (moins d'une chance sur 190 puissance 8 au palier 1) ; la règle de la spec est suivie telle quelle.
