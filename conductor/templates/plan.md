<!-- Gabarit cothon 0.4.0 (setting-up-docs), adopté dans Conductor (cothon 0.2.0-2 et 0.4.0-6) : une nouvelle track part de ce fichier. -->
# Plan : titre de la feature

Spec : [spec.md](spec.md)

## Tâches

- [ ] 1. Test qui décrit le critère 1 (il échoue avant le changement)
- [ ] 2. Implémentation minimale
- [ ] 3. `check` passe
- [ ] 4. Doc mise à jour (AGENTS.md, docs/, ADR si décision)

## Preuves

Chaque affirmation pointe vers une preuve : commande exacte, code de sortie, chemin de la sortie. `build-only` n'est jamais une preuve de comportement.

| Ligne du smoke test | Résultat | Niveau | Preuve |
|---|---|---|---|
| S1 | pass / fail / blocked | e2e-verified · runtime-verified · test-verified · build-only | `commande` (exit 0), `chemin` |

## Journal de décisions

En ajout seul : une décision fausse reçoit une nouvelle ligne qui la remplace, on ne modifie ni ne supprime une ligne.

| # | Décision | Décidé par | Pourquoi | Preuve | Résultat |
|---|---|---|---|---|---|
| 1 | ... | politique · spec · code existant · essai · défaut | ... | sha, `file:line` | gardée · annulée · remplacée par #n |

## Écarts et non vérifié

Ce qui a dévié du plan et pourquoi. Ce qu'aucun outil n'a pu atteindre (devient une ligne 👤).
