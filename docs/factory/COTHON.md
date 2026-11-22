# cothon dans ce projet

Version : 0.3.0
Appliqué le : 2026-11-22
Étapes installées : 1 et 2 (playbook 9.1) ; 3 à 5 écartées (ADR 0006)
Fichiers copiés de cothon : `test/tools/check-docs.sh` (de `setting-up-docs`), `.claude/hooks/lint-edited-file.sh` (de `wiring-fast-feedback`, complété par `tsc`), gabarits `conductor/templates/spec.md` et `plan.md` (de `setting-up-docs`, adoptés dans Conductor)

`Version` = la dernière version de cothon dont toutes les actions du `CHANGELOG.md` sont faites ou en exception. Retour d'expérience envoyé à la session qui maintient cothon le 2026-11-22.

## Actions faites

- `0.1.0-1` : installation selon le playbook, phases 0 à 2 (audit, bun, oxlint, oxfmt, hooks, `AGENTS.md`, CI obligatoire, holdout, garde des zones sensibles). Détail : `docs/factory/AUDIT.md`, `SPEED.md`, ADR 0003 à 0006.
- `0.2.0-1` : section « Ressources protégées » dans `AGENTS.md`, hook `PreToolUse` `.claude/hooks/guard-resources.sh` (sortie 2, `--selftest` de 16 cas, testé en conditions réelles).
- `0.2.0-2` : gabarits `spec.md` et `plan.md` dans `conductor/templates/`, cités par `conductor/workflow.md` (Conductor reste la seule convention de spec).
- `0.2.0-3` : contrat de sortie `0/1/2` sur `check` et `verify` (`test/tools/check.js` lance toutes les étapes et combine ; bloqué l'emporte sur échec) ; `--selftest` sur `check.js`, `run.js`, `sensitive.js` et la garde des ressources, lancés par `bun run selftest` dans `check`.
- `0.3.0-1` : ce fichier.
- `0.3.0-2` : étiquette `agent` posée sur les PR d'agent (#45 à #66), convention `agent-generated: true` et titres `fix:` dans `AGENTS.md`. Le marqueur dans le gabarit de PR (`.github/`, zone protégée) suit dans sa propre PR.
- `0.3.0-4` : bloc calculé par `measuring-the-factory` en tête de `docs/factory/METRICS.md`.

## Exceptions

| Action | Raison |
|---|---|
| `0.3.0-3` | Pas de script d'orchestration : pas de pipeline automatique dans ce projet (ADR 0006) |
