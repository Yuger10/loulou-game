# Plan : réactiver les règles de lint désactivées

Spec : [spec.md](./spec.md). Une PR par règle, dans l'ordre du plus simple au plus risqué. Chaque PR enlève la ligne `"off"` de `.oxlintrc.json` et corrige tout le code.

## Phase 1 : décisions
- [ ] Task: Trancher les questions 1 (iOS minimum) et 2 (helper d'événements) avec Amrou

## Phase 2 : règles simples
- [ ] Task: `no-underscore-dangle` (15 cas) : `WeakMap` ou `data-*`
- [ ] Task: `unicorn/consistent-function-scoping` (50 cas)
- [ ] Task: `unicorn/no-array-reverse` et `unicorn/no-array-sort` (33 cas), selon la décision sur iOS

## Phase 3 : les handlers d'événements
- [ ] Task: Tests d'abord : ouvrir deux fois chaque fenêtre réutilisée, un seul handler déclenché
- [ ] Task: Helper ou convention retenue, puis migration des 195 `onclick =`, slice par slice
- [ ] Task: Activer `unicorn/prefer-add-event-listener`, convention dans `AGENTS.md`

## Phase 4 : règles ajoutées
- [ ] Task: Valider la sélection avec Amrou (tableau de la spec)
- [ ] Task: Une PR par règle retenue : `import/no-cycle`, `eqeqeq`, `no-use-before-define`, `no-param-reassign`, `no-console`, `max-lines` (`no-empty` part avec l'anti-pattern 3)
- [ ] Task: Mesurer le lint après chaque ajout (hyperfine), noter dans `docs/factory/SPEED.md`

## Phase 5 : livraison
- [ ] Task: `bun run check` vert, `docs/factory/SPEED.md` (règles désactivées : aucune), `tech-stack.md`
- [ ] Task: Conductor - User Manual Verification 'Livraison' (Protocol in workflow.md)
