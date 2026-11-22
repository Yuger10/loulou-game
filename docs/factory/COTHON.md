# cothon dans ce projet

Version : 0.4.0
Appliqué le : 2026-11-22
Profil : petit projet, script, jeu HTML (playbook 9) ; étapes 3 à 5 hors profil (ADR 0006)
Étapes installées : 0, 1, 2
Étapes écartées : 3, 4, 5
Fichiers copiés de cothon : `test/tools/check-docs.sh` (de `setting-up-docs`, version 0.4.0, inchangé en 0.7.0), `.claude/hooks/lint-edited-file.sh` (de `wiring-fast-feedback`, complété par `tsc`), gabarits `conductor/templates/spec.md` et `plan.md` (de `setting-up-docs`, adoptés dans Conductor)

`Version` = la dernière version de cothon dont toutes les actions du `CHANGELOG.md` sont faites ou en exception. Mise à jour vers 0.7.0 en cours : la version reste 0.4.0 tant que `0.6.1-1` n'est pas faite (voir « Actions 0.5.0 à 0.7.0 »). Retour d'expérience envoyé à la session qui maintient cothon le 2026-11-22.

## Actions faites

- `0.1.0-1` : installation selon le playbook, phases 0 à 2 (audit, bun, oxlint, oxfmt, hooks, `AGENTS.md`, CI obligatoire, holdout, garde des zones sensibles). Détail : `docs/factory/AUDIT.md`, `SPEED.md`, ADR 0003 à 0006.
- `0.2.0-1` : section « Ressources protégées » dans `AGENTS.md`, hook `PreToolUse` `.claude/hooks/guard-resources.js` (sortie 2, `--selftest` de 25 cas, testé en conditions réelles ; lecture façon shell depuis la première correction de faux positifs).
- `0.2.0-2` : gabarits `spec.md` et `plan.md` dans `conductor/templates/`, cités par `conductor/workflow.md` (Conductor reste la seule convention de spec).
- `0.2.0-3` : contrat de sortie `0/1/2` sur `check` et `verify` (`test/tools/check.js` lance toutes les étapes et combine ; bloqué l'emporte sur échec) ; `--selftest` sur `check.js`, `run.js`, `sensitive.js` et la garde des ressources, lancés par `bun run selftest` dans `check`.
- `0.3.0-1` : ce fichier.
- `0.3.0-2` : étiquette `agent` posée sur les PR d'agent (#45 à #66), convention `agent-generated: true` et titres `fix:` dans `AGENTS.md`. Le marqueur est dans le gabarit de PR depuis la PR #68.
- `0.3.0-4` : bloc calculé par `measuring-the-factory` en tête de `docs/factory/METRICS.md`.

## Actions 0.4.0 faites

- `0.4.0-1` : `test/tools/check-docs.sh` recopié (sortie 0/1/2, `--selftest`, noms accentués).
- `0.4.0-2` : déjà fait avant la 0.4.0 (`"prepare": "lefthook install"`, hook de l'agent sur `Edit|MultiEdit|Write`). Raison : sous bun, on ne compte pas sur le postinstall de lefthook (lefthook 2.2.2 en a un et figure dans la liste de confiance par défaut de bun, mais aucun hook n'était posé) ; `prepare` le garantit, et `.git/hooks/pre-commit` existe bien (vérifié).
- `0.4.0-3` : `bunfig.toml` avec `minimumReleaseAge = "3d"` ; actions GitHub déjà épinglées par SHA.
- `0.4.0-4` : `.claude/`, `.mcp.json`, `.vscode/` (et `bunfig.toml`, `test/tools/sensitive.js`) dans les zones sensibles du garde, de `AGENTS.md` et de `CODEOWNERS` (PR #68, approuvée par Amrou).
- `0.4.0-5` : cible d'exécution dans `AUDIT.md` (1 bis : « marcher partout »), tableau « règle, cas, décision, raison » dans `SPEED.md`.
- `0.4.0-6` : gabarits `conductor/templates/` en 0.4.0 ; en-tête YAML posé sur la seule spec en cours (`typescript-checkjs`). Les tracks de la saison 3, pas commencées, le recevront à leur démarrage.
- `0.4.0-7` : déjà fait (`bun run release patch|track`, ADR 0005).

## Actions 0.5.0 à 0.7.1

Faites :
- `0.5.0-1` : `.cothon/` dans `.gitignore`. Les hooks `PreCompact` et `SessionStart` du plugin (passation avant `/compact`) agissent à partir de la session qui suit le rechargement de cothon.
- `0.6.0-2` : section « Vérification » dans les 6 ADR. Deux décisions sans check, dites telles quelles : « jamais `any` » (ADR 0003, relecture) et « lancer `release` à chaque livraison » (ADR 0005, risque déjà noté).
- `0.7.0-1` : étapes au format strict ci-dessus (`Étapes installées`, `Étapes écartées`).
- `0.7.1` : rien à faire dans le projet (tableau de bord et hooks de passation, côté cothon).

À faire :
- `0.6.1-1` : activer « Require branches to be up to date before merging » sur `main`. Action d'Amrou : la protection de `main` est une ressource protégée, l'agent n'y touche pas.

Autres vérifications faites à la mise à jour : `check-docs.sh` identique à celui de cothon 0.7.0 et son `--selftest` ajouté à `bun run selftest` ; gabarits `spec.md` et `plan.md` identiques (à notre en-tête près) ; commande des métriques corrigée (elle pointait vers le cache de cothon 0.3.0) et bloc recalculé.

## Exceptions

| Action | Raison |
|---|---|
| `0.3.0-3` | Pas de script d'orchestration : pas de pipeline automatique dans ce projet (ADR 0006) |
| `0.6.0-1` | L'architecture est déjà décidée et vérifiée : feature slices et modules ES natifs (ADR 0001 et 0002), garde `test/slices.test.js`, `import/no-cycle`. Pas de besoin d'architecture ouvert ; un nouveau besoin passera par une RFC (skill `proposing-architecture`). Décision d'Amrou, 2026-11-22 |
