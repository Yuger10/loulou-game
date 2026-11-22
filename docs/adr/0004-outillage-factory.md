# ADR 0004 : Outillage de la factory : bun, oxlint, oxfmt, lanceur de tests maison en parallèle

- **Statut :** acceptée, livrée entre la v66 et la v66.2 (PR #47 à #51)
- **Date :** 2026-11-22
- **Décideur :** Amrou (réponses à l'audit, puis « aligne sur cothon »)
- **Liens :** [audit](../factory/AUDIT.md), [mesures](../factory/SPEED.md), playbook cothon section 4.2

## Contexte
Le dépôt n'avait ni lint, ni format, ni CI ; les 17 suites de tests tournaient en série en 108 s, au-dessus du budget de 30 s du playbook. Amrou avait d'abord choisi pnpm et Biome, puis s'est aligné sur la stack de référence cothon, avec un principe : **l'exécution la plus rapide, avec le moins de ressources**.

## Décision
| Rôle | Outil | Écart à la référence cothon |
|---|---|---|
| Paquets et scripts | **bun** (version épinglée), runtime Node conservé | Aucun |
| Lint | **oxlint** (`correctness` et `suspicious` en erreur) | Pas de `--type-aware` : le projet est en JavaScript (voir ADR 0003). 5 règles de `suspicious` désactivées provisoirement, track `lint-regles-completes` |
| Format | **oxfmt** (largeur 120, guillemets simples en JS, doubles en CSS) | Aucun |
| Tests | **lanceur maison** (`test/tools/run.js`) : suites Node + jsdom en parallèle, découpage `// @shards N`, graine rejouable `TEST_SEED` | **Écart :** ni Vitest ni `bun test`. Les 5 500 lignes de tests existantes sont des scripts Node ; les réécrire n'apportait rien de mesuré, le parallélisme a suffi (108 s → 18 s) |
| Hooks | **hook `PostToolUse`** de l'agent (format, lint, types : 211 ms) et **lefthook** au commit | Aucun |
| Orchestration | aucune | Sans objet : un seul paquet |

## Options écartées
- pnpm et Biome : premier choix d'Amrou, abandonné pour la stack de référence (plus rapide, une seule convention entre projets).
- Vitest ou `bun test` : réécriture de toute la suite sans gain prouvé.

## Conséquences
- Positif : `bun run check` en 19 s (lint 33 ms, types 93 ms) ; un agent voit ses erreurs 0,2 s après chaque édition.
- Risque : oxfmt est en beta, et les plugins JS d'oxlint en alpha (non utilisés ici) ; versions exactes épinglées.
- Repli : Biome pour le format, si oxfmt régresse ; pnpm si bun bloque (les deux prévus par le playbook).
