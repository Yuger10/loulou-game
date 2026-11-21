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

## Questions à trancher avant de commencer
1. **Version minimale d'iOS ou de Safari à supporter ?** Si iOS 16 ou plus suffit, `toSorted` et `toReversed` passent tels quels. Sinon, il faut un petit polyfill dans `shared/lib`, chargé avant le reste, ou garder ces deux règles coupées pour cette raison précise.
2. Pour `prefer-add-event-listener` : faut-il un helper unique (`on(el, 'click', fn, signal)`) imposé par une règle custom, ou `addEventListener` direct avec `{ signal }` ?

## Critères d'acceptation
1. Les 5 règles sont actives en erreur dans `.oxlintrc.json`. Il ne reste aucune ligne `"off"`, sauf une règle gardée pour une contrainte écrite (question 1).
2. `bun run check` passe, sans nouvelle exception `oxlint-disable`.
3. Aucun changement de comportement. Un test vérifie qu'ouvrir deux fois la fenêtre de confirmation et le formulaire ne double aucun handler.
4. `AGENTS.md` (ou la convention en place) décrit la façon unique d'attacher un handler.

## Hors périmètre
Les règles custom des anti-patterns de l'audit (échappement HTML, `Math.random`, `setTimeout`), qui ont leurs propres PR.
