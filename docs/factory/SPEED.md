# Vitesse des outils : Le Lagon Magique

> Skill `cothon:auditing-tool-speed`, playbook cothon section 4.2. Mesures du 21 novembre 2026 sur un MacBook à 10 cœurs, Node 24.13, `main` en v65.
> Outils de mesure : hyperfine 2.0.0, bun 1.4.5, oxlint 1.94.0, oxfmt 0.79.0 (lancés par `bunx`, rien d'installé dans le dépôt).

## Maturité du projet

**Actif, taille petite à moyenne.**
- 2 mois d'âge (premier commit le 14 septembre 2026), 186 commits, 43 PR mergées.
- 161 fichiers JS (16 900 lignes), un seul paquet, zéro dépendance de production.
- Un humain et plusieurs sessions d'agents en parallèle.

Règle du playbook pour ce profil : **migration progressive vers la stack de référence, une PR par rôle, dans l'ordre du gain mesuré.**

## Mesures

| Commande | Moyenne | Budget cothon | Verdict |
|---|---|---|---|
| `npm test` (17 suites en série) | **108 s** (3 runs, σ < 1 s) | `check` < 30 s | **Hors budget** |
| 17 suites en parallèle (`xargs -P 10`) | **35 s** (3 runs, toutes vertes) | | 3,1 fois plus rapide, encore au-dessus |
| `oxlint js` (tout le dépôt, via `bunx`) | 157 ms | < 3 s | OK |
| `oxlint` sur un fichier (via `bunx`) | 138 ms | < 300 ms | OK (le coût est surtout le lancement de `bunx`) |
| `oxfmt --check js` (via `bunx`) | 177 ms | | OK |
| `npm ci`, cache chaud | 664 ms | install < 15 s | OK |
| `bun install`, cache chaud | **18 ms** | | 37 fois plus rapide |
| Typecheck | aucun | < 10 s | Pas de typecheck (décision d'Amrou) |

Durée de chaque suite en série : compagnons 35,2 s, jeux 34,2 s, smoke 12,5 s, pause 9,6 s, les 13 autres moins de 3 s chacune. **La durée en parallèle est celle de la plus longue suite.** Pour passer sous 30 s, il faut découper `companions.test.js` et `games.test.js`, et réduire les attentes fixes (anti-pattern 4 de l'audit).

Premier passage d'oxlint (configuration par défaut) : **0 erreur, 72 avertissements** :
- 69 `no-unused-vars`, surtout des paramètres `e` de `catch` jamais utilisés (anti-pattern 3) ;
- 3 `no-unused-expressions`.

Premier passage d'oxfmt (réglages par défaut) : **232 fichiers** reformatés. C'est un gros diff mécanique.

## Décision par rôle

| Rôle | En place | Décision | Raison |
|---|---|---|---|
| Paquets et scripts | npm | **Migrer vers bun** (`cothon:migrating-to-bun`) | Référence ; install 37 fois plus rapide ; runtime Node conservé pour les tests et les outils |
| Tests | scripts Node + jsdom, en série | **Garder le runner, lancer les suites en parallèle** | Gain mesuré de 73 s. Le script lit `test/*.test.js` : plus de liste à la main dans `package.json`, plus de conflit entre sessions. Vitest et `bun test` sont écartés : réécriture de 5 550 lignes sans gain prouvé |
| Lint | aucun | **Ajouter oxlint** (`cothon:migrating-to-oxlint`, sans ESLint à migrer) | Référence ; 0,16 s ; les règles custom de l'audit iront dans `tools/lint-rules/` |
| Format | aucun | **Ajouter oxfmt** (`cothon:migrating-to-oxfmt`) | Référence ; une PR isolée de reformatage, avec `.git-blame-ignore-revs`. Les réglages (`printWidth`, guillemets) suivront le style actuel pour limiter le diff. **Après la dernière livraison de l'autre session** |
| Types | aucun | **Garder (aucun)** | Décision d'Amrou : le plus léger. Option future : TypeScript 7 `--checkJs` |
| Git hooks | aucun | **Ajouter** le hook `PostToolUse` de l'agent, puis lefthook (`cothon:wiring-fast-feedback`) | Erreurs de lint vues juste après l'édition |
| Orchestration des tâches | sans objet | Rien | Un seul paquet |
| Base éphémère | sans objet | Rien | Pas de base ; à la place, des sauvegardes de référence pour les tests de migration (phase 2) |
| CI | aucune | **Créer** en phase 2 (`cothon:speeding-up-ci`) | Jobs parallèles, `ci-ok` comme seul check obligatoire |

Rien n'est perdu : aucun outil existant n'est remplacé, sauf npm, et bun lit le `package-lock.json` actuel.

Adaptateur déclaré par rôle (cothon 0.10.0, principe 7 du playbook) : paquets **bun** (`packageManager`, gardé : budgets tenus), lint **oxlint**, format **oxfmt**, types **TypeScript 7** (`tsc`, `checkJs`), tests **runner Node + jsdom** du projet, hooks **lefthook**.

## Presets cothon (24 novembre 2026, cothon 0.11.0)

Les règles communes viennent des presets de cothon (ADR 0011 de cothon), copiés dans `.cothon/presets/` et vérifiés par `make fleet`. Ce dépôt n'écrit plus que ses écarts.

| Preset | Étendu par | Écarts du projet (où, pourquoi) |
| --- | --- | --- |
| `oxlint/base` | `.oxlintrc.json` | Plugins `unicorn`, `oxc`, `typescript`, `import` ; règles des anti-patterns de l'audit ; règles coupées pour la cible Safari 16 (voir « Règles de lint ») ; `ignorePatterns` (oxlint ne les hérite pas d'un fichier étendu) |
| `typescript/strict` | `tsconfig.json` | `checkJs` sans build, cible `es2022`, `types: []` (ADR 0003) |
| `oxfmt/base` | `.oxfmtrc.json`, généré | `.cothon/local/oxfmt.json` : `printWidth` 120, CSS en guillemets doubles (tests qui lisent le CSS), `sw.js` et `index.html` ignorés |
| `lefthook/base` | `lefthook.yml`, généré | `.cothon/local/lefthook.yml` : globs limités au JavaScript et au CSS du jeu |

**Preuve d'identité** (avant et après, sur la branche de la PR #89) : diagnostics d'oxlint sur `js` et `test` (avec des fichiers sonde qui violent les règles du projet), `tsc --showConfig`, `lefthook dump` et config d'oxfmt : **identiques**. `bun run check` : vert (32 suites).

## Contrôles qualité (25 novembre 2026, cothon 0.12.1)

Rapport de `bash .cothon/bin/quality-check.sh rapport --project .` sur `origin/main` `3608542` (skill `cothon:checking-code-quality`). Chaque famille est une **barrière** (la CI, job `violations ajoutées`, ne bloque que ce qu'une PR ajoute) ou un **rapport** (résumé du job, jamais bloquant).

| Famille | Outil | Constats | Sur quoi | Décision | Raison |
|---|---|---|---|---|---|
| Lint | oxlint (`js test`) | 0 | dépôt | barrière | bloque aussi un avertissement ajouté |
| Complexité et taille | oxlint, preset `oxlint/qualite` | 169 | 219 fichiers | barrière | 67 fonctions de plus de 50 lignes, 47 fichiers de plus de 300 lignes, 27 fonctions à plus de 3 paramètres, 23 trop complexes ; l'existant reste (le cliquet `max-lines` 800 du lint principal aussi), rien de neuf n'entre |
| Environnement | bash | 0 | 219 fichiers | barrière | `.env.example` créé : le jeu n'a pas de variable, les réglages du lanceur de tests (`TEST_SEED`, `TEST_JOBS`, `TEST_SHARD`, `TEST_DIR`) y sont documentés en commentaire ; `GITHUB_OUTPUT` et `PR_LABELS` viennent de la CI (`env_ignore` dans `.cothon/quality.conf`) |
| Code mort | knip, `knip.json` | 39 | 219 fichiers | rapport | sans points d'entrée, knip voyait 208 fichiers « inutilisés » (le jeu est chargé par `index.html`) ; `knip.json` déclare `js/app/main.js`, `js/app/init.js`, `sw.js` et les tests. Restent 39 exports à trier : les tests lisent le jeu par nom |
| Duplication | jscpd | 270 | 219 fichiers | rapport | à trier d'abord (tests compris) |
| Migrations SQL | squawk | 0 | 0 fichier | sans objet | pas de base de données |

Preuve que les nouveaux presets (`oxlint/qualite`, `bin/new-violations`, `bin/quality-check`, `bin/prove-identity`) ne changent rien à l'outillage : `prove-identity.sh` avant et après, `compare` sortie 0 (lint avec 9 diagnostics de sondes, `tsconfig.json`, lefthook, oxfmt). Sondes : `.cothon/probes/` (ignorées par oxlint et oxfmt au quotidien). Essai sur la flotte : `.cothon/trial.check` (`node test/tools/check.js`).

## Ordre des migrations (une PR chacune)

1. **bun** : `packageManager`, `bun.lock`, scripts en `bun run`, `check` créé.
2. **Tests en parallèle**, lancés depuis `check`. Ensuite, découpage des deux grosses suites pour passer sous 30 s.
3. **oxlint** : configuration, correction des 72 avertissements, première règle custom (échappement HTML, anti-pattern 1).
4. **Hook de l'agent** et lefthook.
5. **oxfmt** : PR de reformatage seule, une fois l'autre session mergée.
6. **CI** : en phase 2.

## Après l'étape 2 : tests en parallèle (21 novembre 2026)

`test/tools/run.js` lance les suites en parallèle ; `games` et `companions` sont découpées en 3 morceaux (`// @shards 3`). La couverture est vérifiée : 439 parties de jeux et 306 parties d'indices, comme sans découpage.

| Commande | Avant | Après |
|---|---|---|
| `bun run check`, 10 cœurs | 108 s | **18,4 s** (5 passages verts, 18,3 à 18,5 s) : **dans le budget de 30 s** |
| idem, limité à 4 en parallèle (`TEST_JOBS=4`, taille d'un runner de CI) | | 34,4 s (3 passages verts) |

Temps CPU total : 41 s, contre 108 s de durée en série. L'essentiel était de l'attente des minuteries du jeu. Pour aller plus loin, il faudrait réduire les délais fixes (anti-pattern 4 de l'audit).

## Après l'étape 3 : oxlint (21 novembre 2026)

`.oxlintrc.json` : `correctness` et `suspicious` en erreur, `--deny-warnings`, lancé en premier dans `bun run check`.

| Commande | Temps |
|---|---|
| `bun run lint` (tout `js/` et `test/`) | **33 ms** (budget 3 s) |
| oxlint sur un fichier | **28 ms** (budget 300 ms) |

Corrigé : 52 `catch(e)` dont l'erreur ne servait pas (devenus `catch`), des imports et du code mort, 15 noms masqués (`no-shadow`), 3 expressions sans effet, et **2 vérifications du test de fumée qui passaient toujours** (`|| true`) : la course vérifie maintenant que chaque joueur part à 0.

Règles désactivées **provisoirement**, avec leur raison (aussi écrite dans `.oxlintrc.json`). Amrou préfère corriger le code : la track `conductor/tracks/lint-regles-completes_20261121` les réactive une par une.

| Règle | Occurrences | Raison |
|---|---|---|
| `unicorn/prefer-add-event-listener` | 195 | `el.onclick =` est l'idiome du projet : réaffecté à chaque rendu, sans doublon de handler |
| `unicorn/no-array-sort`, `unicorn/no-array-reverse` | 33 | `toSorted` et `toReversed` demandent Safari 16 |
| `unicorn/consistent-function-scoping` | 50 | Style seulement |
| `no-underscore-dangle` | 15 | Propriétés posées exprès sur des éléments du DOM |

Pas encore de règle custom : l'échappement HTML (anti-pattern 1 de l'audit) aura sa propre PR, avec le nettoyage complet et sa règle (playbook 4.5).

## Après l'étape 4 : retour rapide (21 novembre 2026)

| Boucle | Outil | Temps | Budget |
|---|---|---|---|
| Agent, après chaque édition d'un fichier JS | hook `PostToolUse`, oxlint sur le fichier | **34 ms** (hyperfine, 20 runs) | < 300 ms |
| Humain, à chaque commit | lefthook, oxlint sur les fichiers indexés | **30 ms** | |

Vérifié en conditions réelles : une variable inutilisée écrite par l'agent lui est renvoyée aussitôt ; un commit qui contient la même erreur est refusé. Volontairement léger : pas de tests dans les hooks (pas de `pre-push`), ils restent dans `bun run check`.

## Après l'étape 5 : oxfmt (22 novembre 2026)

`.oxfmtrc.json` : largeur 120 (le moins de diff parmi 100, 120, 160 et 200 à lisibilité correcte), guillemets simples en JS, doubles en CSS, `sw.js` et `index.html` exclus (générés).

| Mesure | Avant | Après |
|---|---|---|
| Lignes de `js/` | 17 037 | 24 469 (+44 %) : le style compact devient le style Prettier |
| Poids de `js/` (non compressé / gzip) | 977 Ko / 282 Ko | 1 028 Ko / 287 Ko (+5 % / +1,7 %) |
| `bun run lint` (oxlint puis `oxfmt --check`) | 33 ms | **125 ms** (budget 3 s) |
| Hook de l'agent (oxfmt puis oxlint sur un fichier) | 34 ms | **118 ms** (budget 300 ms) |
| `bun run check` | 18,6 s | 18,3 s |

Le reformatage est un commit purement mécanique, listé dans `.git-blame-ignore-revs`. Seule adaptation : 7 vérifications de thème de monde lisaient le CSS à l'octet près ; elles tolèrent maintenant espaces et guillemets (commit séparé, avant le reformatage).

## TypeScript 7 en vérification du JavaScript (22 novembre 2026, ADR 0003)

| Commande | Temps | Budget |
|---|---|---|
| `bun run typecheck` (`tsc -p .`, 167 modules) | **93 ms** | < 10 s |
| Hook de l'agent (oxfmt, oxlint, tsc) | **211 ms** | < 300 ms |
| `bun run typecheck` en mode strict (66.11, 171 modules) | **100 ms** | < 10 s |

## Track lint : règles ajoutées (22 novembre 2026)

7 règles de plus, toutes à 0 cas (`eqeqeq`, `no-use-before-define`, `no-console`, `max-lines`, `no-param-reassign`, `import/no-cycle`, `no-underscore-dangle` réactivée) : `bun run lint` passe de 33 à **36 ms**. Restent coupées : `no-array-sort` et `no-array-reverse` (version minimale d'iOS à décider), `prefer-add-event-listener` (helper à décider), `consistent-function-scoping` (raison écrite dans `.oxlintrc.json`).

## Règles de lint : décision par règle (cothon 0.4.0-5, playbook 4.4)

Catégories `correctness` et `suspicious` en erreur, `--deny-warnings`. Toute règle coupée ou ajoutée, avec sa raison (aussi écrite dans `.oxlintrc.json`) :

| Règle | Cas trouvés | Décision | Raison |
|---|---|---|---|
| `unicorn/no-array-sort` | 27 | Coupée | Impose `toSorted` (Safari 16) : contraire à la cible d'exécution (audit, 1 bis) |
| `unicorn/no-array-reverse` | 6 | Coupée | Impose `toReversed` (Safari 16) : même raison |
| `unicorn/consistent-function-scoping` | 50 | Coupée | Sortir ces fonctions créerait des noms de haut niveau en double (5 `key`, 4 `ok`), interdits par `test/slices.test.js` ; gain de style seulement |
| `import/no-unassigned-import` | 100+ | Coupée | `main.js` charge les slices par import à effet (ADR 0002) |
| `unicorn/prefer-add-event-listener` | 197 | Réactivée | Corrigé par `setHandler` (v66.5) |
| `no-underscore-dangle` | 15 | Réactivée | État posé sur des fonctions rendu explicite (v66.3) |
| `no-restricted-properties` (`Math.random`, `localStorage.setItem` et `removeItem`) | 77 et 11 | Ajoutée | Anti-patterns 2 et 3 : une source de hasard rejouable, des écritures qui signalent leur échec |
| `no-empty` | 34 | Ajoutée | Anti-pattern 3 : un bloc vide dit pourquoi |
| `eqeqeq` (`null` permis) | 10 | Ajoutée | `x == null` est l'idiome du projet, le reste en `===` |
| `no-use-before-define` (même portée) | 0 avec ce réglage | Ajoutée | Les vrais risques d'ordre d'initialisation des modules |
| `no-console` (hors `test/`) | 1 | Ajoutée | Révélait une sauvegarde illisible passée en silence |
| `max-lines` (800, hors `test/`) | 0 | Ajoutée | Cliquet atteint (66.16) : 1 250 → 1 100 (`squishy-art.js`) → 800 (`characters-art-s2.js`, `difficulty-s2.js`), dessins et paliers déplacés tels quels |
| `no-param-reassign` | 40 | Ajoutée | Valeurs par défaut dans la signature, variables locales quand `0` ou `null` comptent |
| `import/no-cycle` | 12 (5 cycles) | Ajoutée | Un cycle peut lire une valeur pas encore définie au démarrage des modules ES |
