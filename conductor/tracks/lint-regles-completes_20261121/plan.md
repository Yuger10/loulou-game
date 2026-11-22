# Plan : réactiver les règles de lint désactivées

Spec : [spec.md](./spec.md). Une PR par règle, dans l'ordre du plus simple au plus risqué. Chaque PR enlève la ligne `"off"` de `.oxlintrc.json` et corrige tout le code.

## Phase 1 : décisions
- [x] Task: Trancher les questions 1 (iOS minimum) et 2 (helper d'événements) avec Amrou : « une version qui fonctionne partout » (pas de `toSorted`), « ok pour le helper »

## Phase 2 : règles simples
- [x] Task: `no-underscore-dangle` : réactivée. L'état posé sur des fonctions est devenu explicite (track TypeScript), les noms des tests renommés
- [x] Task: `unicorn/consistent-function-scoping` : **gardée coupée, décision écrite**. Sortir les 50 fonctions internes créerait des noms de haut niveau en double (5 `key`, 4 `ok`), interdits par `test/slices.test.js` ; gain de style seulement
- [x] Task: `unicorn/no-array-reverse` et `unicorn/no-array-sort` : **gardées coupées, décision d'Amrou** (compatibilité partout ; `toSorted` exige Safari 16)

## Phase 3 : les handlers d'événements
- [x] Task: Tests d'abord : `test/handlers.test.js` (remplacement, retrait, repli sans `addEventListener`, fenêtre de confirmation ouverte 4 fois : un seul écouteur ; mutation détectée)
- [x] Task: `setHandler` (nom choisi pour ne pas heurter `on` du bus d'événements), 197 handlers migrés par analyse acorn
- [x] Task: `unicorn/prefer-add-event-listener` réactivée, convention dans `AGENTS.md`

## Phase 4 : règles ajoutées
- [x] Task: Valider la sélection avec Amrou (tableau de la spec) : « vas jusqu'au bout dans l'intégration »
- [x] Task: Règles ajoutées, toutes à 0 cas : `eqeqeq` (`x == null` permis), `no-use-before-define` (même portée), `no-console` (une sauvegarde illisible était un `console.warn` silencieux : elle est maintenant signalée), `max-lines` (1 250), `no-param-reassign` (40 cas : valeurs par défaut dans la signature, variables locales quand `0` ou `null` comptent), `import/no-cycle` (5 cycles cassés : barre des tours, bus `nav:dialogue`, `lagon:rendered`, `onProfileDelete`, `skill-status.js`) ; `no-empty` fait avec l'anti-pattern 3
- [x] Task: Mesurer le lint après chaque ajout (`docs/factory/SPEED.md`)

## Phase 5 : livraison
- [x] Task: `bun run check` vert, `docs/factory/SPEED.md` ; restent coupées, chacune avec sa raison écrite : `no-array-sort`, `no-array-reverse` (compatibilité, décision d'Amrou), `consistent-function-scoping` (noms uniques), `import/no-unassigned-import` (ADR 0002)
- [x] Task: Conductor - User Manual Verification 'Livraison' : faite par l'agent sur délégation d'Amrou (suite complète et holdout verts, jeu servi localement : tous les fichiers du cache en 200, version 66.5)
