# Plan : TypeScript en vérification du JavaScript

Spec : [spec.md](./spec.md). Une PR par couche. Mesure de départ du mode strict : 2 663 erreurs dans 97 fichiers (22 novembre 2026).

## Phase 1 : mode souple
- [x] Task: TypeScript 7.0.2 en version exacte, `tsconfig.json`, `types/dom.d.ts`
- [x] Task: 284 erreurs corrigées (DOM, état partagé, points d'accroche, noms réutilisés)
- [x] Task: `bun run typecheck` dans `check`, la CI et le hook de l'agent

## Phase 2 : mode strict, couche par couche
- [x] Task: `js/shared/` en strict : 161 erreurs → 0, en JSDoc seulement (aucun `any`), `tsconfig.strict.json` (include de la couche), `bun run typecheck` lance les deux modes ; 2 annotations dans `features` rendues nécessaires par les types de `shared` (`share.js`, `music.js`)
- [x] Task: `js/entities/` en strict (dont la sauvegarde) : 299 → 0, types de la partie (`GameState`…) ; a révélé la perte de `decoPos` au chargement
- [x] Task: `js/features/` en strict, par lots de bas en haut (ordre du manifeste) : lot 1 (8 slices, 402 → 0, 66.9), lot 2 (`story` → `map`, 304 → 0, 66.10), lots 3a et 3b (moteur et mini-jeux, 517 → 0) et 4 (`market` → `settings`, 142 → 0), faits en parallèle par trois agents puis réunis (66.11)
- [x] Task: `js/app/` en strict (19 → 0), puis `strict: true` dans `tsconfig.json` ; `tsconfig.strict.json` supprimé, `bun run typecheck` = `tsc -p .` (0,1 s)

## Phase 3 : livraison
- [x] Task: `AGENTS.md` (types obligatoires), `tech-stack.md`, `docs/factory/SPEED.md`, ADR 0003
- [ ] Task: Conductor - User Manual Verification 'Livraison' (Protocol in workflow.md)
