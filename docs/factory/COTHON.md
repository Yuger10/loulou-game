# cothon dans ce projet

Version : 0.3.0 (mise à jour vers 0.4.0 en cours : `0.4.0-4` et `0.3.0-2` finissent avec la PR protégée #68)
Appliqué le : 2026-11-22
Étapes installées : 1 et 2 (playbook 9.1) ; 3 à 5 écartées (ADR 0006)
Fichiers copiés de cothon : `test/tools/check-docs.sh` (de `setting-up-docs`, version 0.4.0), `.claude/hooks/lint-edited-file.sh` (de `wiring-fast-feedback`, complété par `tsc`), gabarits `conductor/templates/spec.md` et `plan.md` (de `setting-up-docs`, adoptés dans Conductor)

`Version` = la dernière version de cothon dont toutes les actions du `CHANGELOG.md` sont faites ou en exception. Retour d'expérience envoyé à la session qui maintient cothon le 2026-11-22.

## Actions faites

- `0.1.0-1` : installation selon le playbook, phases 0 à 2 (audit, bun, oxlint, oxfmt, hooks, `AGENTS.md`, CI obligatoire, holdout, garde des zones sensibles). Détail : `docs/factory/AUDIT.md`, `SPEED.md`, ADR 0003 à 0006.
- `0.2.0-1` : section « Ressources protégées » dans `AGENTS.md`, hook `PreToolUse` `.claude/hooks/guard-resources.sh` (sortie 2, `--selftest` de 16 cas, testé en conditions réelles).
- `0.2.0-2` : gabarits `spec.md` et `plan.md` dans `conductor/templates/`, cités par `conductor/workflow.md` (Conductor reste la seule convention de spec).
- `0.2.0-3` : contrat de sortie `0/1/2` sur `check` et `verify` (`test/tools/check.js` lance toutes les étapes et combine ; bloqué l'emporte sur échec) ; `--selftest` sur `check.js`, `run.js`, `sensitive.js` et la garde des ressources, lancés par `bun run selftest` dans `check`.
- `0.3.0-1` : ce fichier.
- `0.3.0-2` : étiquette `agent` posée sur les PR d'agent (#45 à #66), convention `agent-generated: true` et titres `fix:` dans `AGENTS.md`. Le marqueur dans le gabarit de PR (`.github/`, zone protégée) suit dans sa propre PR.
- `0.3.0-4` : bloc calculé par `measuring-the-factory` en tête de `docs/factory/METRICS.md`.

## Actions 0.4.0 traitées

- `0.4.0-1` : `test/tools/check-docs.sh` recopié (sortie 0/1/2, `--selftest`, noms accentués).
- `0.4.0-2` : déjà fait avant la 0.4.0 (`"prepare": "lefthook install"`, hook de l'agent sur `Edit|MultiEdit|Write`). Raison : sous bun, on ne compte pas sur le postinstall de lefthook (lefthook 2.2.2 en a un et figure dans la liste de confiance par défaut de bun, mais aucun hook n'était posé) ; `prepare` le garantit, et `.git/hooks/pre-commit` existe bien (vérifié).
- `0.4.0-3` : `bunfig.toml` avec `minimumReleaseAge = "3d"` ; actions GitHub déjà épinglées par SHA.
- `0.4.0-4` : `.claude/`, `.mcp.json`, `.vscode/` (et `bunfig.toml`, `test/tools/sensitive.js`) dans les zones sensibles du garde et de `AGENTS.md` ; la partie `CODEOWNERS` (zone protégée) est dans la PR #68.
- `0.4.0-5` : cible d'exécution dans `AUDIT.md` (1 bis : « marcher partout »), tableau « règle, cas, décision, raison » dans `SPEED.md`.
- `0.4.0-6` : gabarits `conductor/templates/` en 0.4.0 ; en-tête YAML posé sur la seule spec en cours (`typescript-checkjs`). Les tracks de la saison 3, pas commencées, le recevront à leur démarrage.
- `0.4.0-7` : déjà fait (`bun run release patch|track`, ADR 0005).

## Exceptions

| Action | Raison |
|---|---|
| `0.3.0-3` | Pas de script d'orchestration : pas de pipeline automatique dans ce projet (ADR 0006) |
