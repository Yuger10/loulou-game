# Métriques de la factory

Deux parties : la **qualité du travail des agents**, calculée par le script de cothon (skill `measuring-the-factory`, cothon 0.3.0-4 : jamais de chiffre écrit à la main), puis la **vitesse** des outils (un dépassement de budget est un bug).

Une PR d'agent porte l'étiquette `agent` ou `agent-generated: true` dans son corps ; un correctif est titré `fix:` (ou porte l'étiquette `bug`). Sans eux, rien n'est compté.

```bash
bash ~/Desktop/dev/cothon/skills/measuring-the-factory/scripts/factory-metrics.sh --days 7
```

## Du 2026-11-15 au 2026-11-22

| Métrique | Valeur | Détail |
|---|---|---|
| PR d'agent terminées | 34 | 34 mergée(s), 0 fermée(s) sans merge ; unité des taux |
| Taux de reprise | 17,6 pour 100 | 6 correctif(s) à 7 jours, 0 PR rejetée(s) en revue ou fermée(s) sans merge |
| Correctif attribuable à 14 jours | 17,6 pour 100 | 6 correctif(s) dont plus de 50 % des fichiers viennent d'une PR d'agent |
| Stock | 3 PR ouverte(s) | dont 0 brouillon(s), âge médian 0 jours |
| Attente humaine | 0,1 heures | médiane, de l'ouverture à la première revue humaine (ou au merge) |

Lecture (22 novembre, fin de journée) : deux sortes de correctifs.
- **Une vraie reprise du travail de la semaine** : #70 (tests instables, `main` rouge depuis la #64 sans que personne le voie) et #72 (faux positifs de la garde des ressources). Les deux sont devenus des checks (`LEARNINGS.md`).
- **Des bugs anciens, révélés par la factory** : #74, #78, #79, #81, #82 (TypeScript strict). Le script les attribue aux agents parce que presque tout le code du jeu a été écrit par des agents, avant la factory ; ce n'est pas du travail de la semaine repris.

La mesure de la semaine prochaine dira si le taux redescend une fois ces bugs anciens épuisés.

Mesure précédente (première, même jour, matin) : 18 PR d'agent, taux de reprise 0, attente humaine 0,2 h.

## Vitesse

À relever de temps en temps (par exemple à chaque livraison 66.x) :
```bash
gh run list --workflow ci --limit 20 --json conclusion,createdAt,updatedAt   # durée de la CI
bun run check                                                                # temps local, graine affichée
```

| Date | Version | CI (médiane, p90) | `check` local | Lint | Types | Tests (suites) | Notes |
|---|---|---|---|---|---|---|---|
| 2026-11-22 | 66.3 | 66 s, 73 s (2 runs) | 19 s | 33 ms | 93 ms | 18,9 s (26 + 1 holdout) | Première mesure après la phase 2 |

Budgets (`docs/factory/SPEED.md`) : `check` < 30 s, CI < 3 min, hook de l'agent < 300 ms.
