# Métriques de la factory

Version légère (ADR 0006 : pas de pipeline automatique, donc pas d'evals ni de coût par PR). On suit la vitesse, qui est une fonctionnalité (playbook cothon, principe 5) : un dépassement de budget est un bug.

À relever de temps en temps (par exemple à chaque livraison 66.x) :
```bash
gh run list --workflow ci --limit 20 --json conclusion,createdAt,updatedAt   # durée de la CI
bun run check                                                                # temps local, graine affichée
```

| Date | Version | CI (médiane, p90) | `check` local | Lint | Types | Tests (suites) | Notes |
|---|---|---|---|---|---|---|---|
| 2026-11-22 | 66.3 | 66 s, 73 s (2 runs) | 19 s | 33 ms | 93 ms | 18,9 s (26 + 1 holdout) | Première mesure après la phase 2 |

Budgets (`docs/factory/SPEED.md`) : `check` < 30 s, CI < 3 min, hook de l'agent < 300 ms.
