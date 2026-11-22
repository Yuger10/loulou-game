# Spec : réactiver les règles de lint désactivées, en corrigeant le code

## Pourquoi
La PR oxlint (factory, phase 1, étape 3) a désactivé 5 règles de la catégorie `suspicious` pour livrer vite. Amrou préfère **corriger le code plutôt que couper une règle** : chaque règle coupée laisse passer une façon de faire que les agents recopieront. Cette track réactive les règles une par une.

## Les 5 règles (état au 21 novembre 2026)

| Règle | Cas | Correction prévue | Point d'attention |
|---|---|---|---|
| `no-underscore-dangle` | 15 | Remplacer les propriétés posées sur les éléments (`el._last`, `el._t`) par une `WeakMap` locale à la slice, ou un `data-*` quand la valeur est une chaîne | Aucun |
| `unicorn/consistent-function-scoping` | 50 | Sortir au niveau du module les fonctions internes qui ne capturent rien | Diff assez large, mais mécanique |
| `unicorn/no-array-reverse` | 6 | `toReversed()` | `toReversed` et `toSorted` existent seulement depuis Safari 16 (iOS 16) : voir la question 1 |
| `unicorn/no-array-sort` | 27 | `toSorted()` | Idem |
| `unicorn/prefer-add-event-listener` | 195 | `addEventListener`, avec une façon unique d'éviter les doublons sur les éléments qui persistent (par exemple un `AbortController` par ouverture de fenêtre, annulé à la fermeture) | Le plus gros changement : risque de handlers en double. Il faut un helper partagé et un test qui ouvre deux fois chaque fenêtre réutilisée (confirmation, formulaire) |

## Règles à ajouter (proposées le 21 novembre 2026)

Principe : **une règle n'entre que si elle vise un vrai risque pour ce projet**, pas une préférence de style, et **sans alourdir les vérifications**. Coût mesuré de toute la sélection ci-dessous : le lint passe de 34,1 ms à 34,6 ms (hyperfine, 15 runs). Les catégories `pedantic`, `style` et `restriction` entières sont écartées : environ 19 000 signalements, presque tous de style (nombres magiques, noms courts, tri des clés), du bruit que les agents corrigeraient à la chaîne sans gain.

| Règle | Cas | Pourquoi pour ce projet |
|---|---|---|
| `import/no-cycle` | 12 | Les modules ES s'initialisent dans l'ordre des imports : un cycle peut lire une valeur pas encore définie au démarrage. `test/slices.test.js` interdit déjà les cycles **entre** slices ; il en reste à l'intérieur (par exemple `entities/player` et `features/adaptive`) |
| `eqeqeq` | 10 | `==` et `!=` font des conversions surprenantes. Exception possible : `x == null` (null ou undefined), si on la garde, elle s'écrit avec `"null": "ignore"` |
| `no-use-before-define` (variables seulement) | 10 | Même risque d'ordre d'initialisation que les cycles |
| `no-empty` | 34 | **Fait** avec l'anti-pattern 3 (22 novembre 2026) |
| `no-param-reassign` | 40 | Par exemple `rng = rng \|\| Math.random` : lié à l'anti-pattern 2, une valeur par défaut s'écrit `rng = Math.random` dans la signature |
| `no-console` (dans `js/`) | 1 | Rien ne doit s'afficher dans la console du jeu ; les tests (`test/`) restent libres |
| `max-lines` en cliquet | 3 au-delà de 800 | Depuis le formatage oxfmt (étape 5), les plus gros fichiers sont `squishy-room.js` (1 215 lignes), `characters-art.js` (996) et `difficulty.js` (947). Cliquet : seuil à 1 250 pour qu'aucun fichier ne grossisse au-delà, puis découper ces 3 fichiers et abaisser à 800. Un agent travaille mieux sur des fichiers courts |

Règles custom (dans `tools/lint-rules/`, chargées par `jsPlugins`), à écrire avec leur anti-pattern :
- **échappement HTML** des données dans les templates (anti-pattern 1) ;
- **`Math.random` interdit hors de `shared/lib`** (anti-pattern 2), via `no-restricted-properties` avant toute règle custom ;
- **`setTimeout` à délai fixe dans la logique de jeu** (anti-pattern 4), après la mise en place d'un `delay()` central.

Règle de conduite pour la suite : **quand une correction humaine revient deux fois, proposer la règle qui l'empêche** (playbook, « chaque correction devient un check »), avec son nombre de cas et son coût mesuré.

## Questions à trancher avant de commencer
1. **Version minimale d'iOS ou de Safari à supporter ?** Si iOS 16 ou plus suffit, `toSorted` et `toReversed` passent tels quels. Sinon, il faut un petit polyfill dans `shared/lib`, chargé avant le reste, ou garder ces deux règles coupées pour cette raison précise.
2. Pour `prefer-add-event-listener` : faut-il un helper unique (`on(el, 'click', fn, signal)`) imposé par une règle custom, ou `addEventListener` direct avec `{ signal }` ?

## Critères d'acceptation
1. Les 5 règles et les règles ajoutées retenues sont actives en erreur dans `.oxlintrc.json`. Il ne reste aucune ligne `"off"`, sauf une règle gardée pour une contrainte écrite (question 1).
2. `bun run check` passe, sans nouvelle exception `oxlint-disable`, et le lint reste sous 100 ms (budget cothon : 3 s).
3. Aucun changement de comportement. Un test vérifie qu'ouvrir deux fois la fenêtre de confirmation et le formulaire ne double aucun handler.
4. `AGENTS.md` (ou la convention en place) décrit la façon unique d'attacher un handler.

## Hors périmètre
Les règles custom des anti-patterns de l'audit (échappement HTML, `Math.random`, `setTimeout`), qui ont leurs propres PR.
