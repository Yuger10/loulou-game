# Plan : réactiver les règles de lint désactivées

Spec : [spec.md](./spec.md). Une PR par règle, dans l'ordre du plus simple au plus risqué. Chaque PR enlève la ligne `"off"` de `.oxlintrc.json` et corrige tout le code.

## Phase 1 : décisions
- [ ] Task: Trancher les questions 1 (iOS minimum) et 2 (helper d'événements) avec Amrou

## Phase 2 : règles simples
- [x] Task: `no-underscore-dangle` : réactivée. L'état posé sur des fonctions est devenu explicite (track TypeScript), les noms des tests renommés
- [x] Task: `unicorn/consistent-function-scoping` : **gardée coupée, décision écrite**. Sortir les 50 fonctions internes créerait des noms de haut niveau en double (5 `key`, 4 `ok`), interdits par `test/slices.test.js` ; gain de style seulement
- [ ] Task: `unicorn/no-array-reverse` et `unicorn/no-array-sort` (33 cas), selon la décision sur iOS

## Phase 3 : les handlers d'événements
- [ ] Task: Tests d'abord : ouvrir deux fois chaque fenêtre réutilisée, un seul handler déclenché
- [ ] Task: Helper ou convention retenue, puis migration des 195 `onclick =`, slice par slice
- [ ] Task: Activer `unicorn/prefer-add-event-listener`, convention dans `AGENTS.md`

## Phase 4 : règles ajoutées
- [x] Task: Valider la sélection avec Amrou (tableau de la spec) : « vas jusqu'au bout dans l'intégration »
- [x] Task: Règles ajoutées, toutes à 0 cas : `eqeqeq` (`x == null` permis), `no-use-before-define` (même portée), `no-console` (une sauvegarde illisible était un `console.warn` silencieux : elle est maintenant signalée), `max-lines` (1 250), `no-param-reassign` (40 cas : valeurs par défaut dans la signature, variables locales quand `0` ou `null` comptent), `import/no-cycle` (5 cycles cassés : barre des tours, bus `nav:dialogue`, `lagon:rendered`, `onProfileDelete`, `skill-status.js`) ; `no-empty` fait avec l'anti-pattern 3
- [x] Task: Mesurer le lint après chaque ajout (`docs/factory/SPEED.md`)

## Phase 5 : livraison
- [ ] Task: `bun run check` vert, `docs/factory/SPEED.md` (règles désactivées : aucune), `tech-stack.md`
- [ ] Task: Conductor - User Manual Verification 'Livraison' (Protocol in workflow.md)
