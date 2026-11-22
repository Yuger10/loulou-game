# Plan : TypeScript en vérification du JavaScript

Spec : [spec.md](./spec.md). Une PR par couche. Mesure de départ du mode strict : 2 663 erreurs dans 97 fichiers (22 novembre 2026).

## Phase 1 : mode souple
- [x] Task: TypeScript 7.0.2 en version exacte, `tsconfig.json`, `types/dom.d.ts`
- [x] Task: 284 erreurs corrigées (DOM, état partagé, points d'accroche, noms réutilisés)
- [x] Task: `bun run typecheck` dans `check`, la CI et le hook de l'agent

## Phase 2 : mode strict, couche par couche
- [ ] Task: `js/shared/` en strict
- [ ] Task: `js/entities/` en strict (dont la sauvegarde)
- [ ] Task: `js/features/` en strict, slice par slice
- [ ] Task: `js/app/` en strict, puis `strict: true` dans `tsconfig.json`

## Phase 3 : livraison
- [ ] Task: `AGENTS.md` (types obligatoires), `tech-stack.md`, `docs/factory/SPEED.md`
- [ ] Task: Conductor - User Manual Verification 'Livraison' (Protocol in workflow.md)
