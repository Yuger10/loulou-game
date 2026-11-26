---
status: faite           # livrée en 66.11 ; critères revérifiés le 26/11/2026 (strict: true, 0 erreur, 0,15 s, aucun any, check vert)
issue: 0
size: M
migration: false
sensitive: true          # touche la sauvegarde (js/entities/game-state/) en mode strict
files: [tsconfig.json, types/dom.d.ts, js/shared/**, js/entities/**, js/features/**, js/app/**]
taster: { facts: 0, decisions: 0, rounds: 0 }
---

# Spec : TypeScript en vérification du JavaScript (ADR 0003)

## Objectif
Que TypeScript 7 vérifie tout le JavaScript du jeu, sans build ([ADR 0003](../../../docs/adr/0003-typescript.md)) : une erreur de type (mauvais arguments, propriété mal écrite, champ de sauvegarde renommé à moitié) est arrêtée en 0,1 s, par le hook de l'agent et par la CI.

## Étape 1 : mode souple, zéro erreur (livrée, 66.3)
`tsconfig.json` (checkJs, `strict: false`), `types/dom.d.ts`, `bun run typecheck` dans `check`, la CI et le hook de l'agent.

## Étape 2 : mode strict, couche par couche
Du bas vers le haut, parce qu'une couche stricte donne des types sûrs à celles qui l'utilisent :
1. `js/shared/` (outils sans lien avec le jeu) ;
2. `js/entities/` (dont l'état et la sauvegarde, la zone la plus sensible) ;
3. `js/features/`, slice par slice ;
4. `js/app/`.

Une couche passe en strict quand toutes ses erreurs strictes sont corrigées : types en JSDoc (`@param`, `@returns`, `@typedef`), jamais `any` ni `@ts-ignore`.

## Critères d'acceptation
1. `strict: true` pour tout `js/`, `bun run typecheck` sans erreur.
2. Aucun `any` explicite, aucun `@ts-ignore` ni `@ts-expect-error` sans raison écrite.
3. `bun run check` vert, aucun changement de comportement.
4. Temps de `tsc` sous 1 s (budget cothon : 10 s).

## Hors périmètre
Renommer les fichiers en `.ts` et ajouter une étape de build (option 2 de l'ADR 0003, écartée).
