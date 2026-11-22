# ADR 0006 : Ce que ce projet garde et écarte du playbook cothon

- **Statut :** acceptée
- **Date :** 2026-11-22
- **Décideur :** Amrou (tri des points restants de la checklist, section 10 du playbook)

## Contexte
Le playbook cothon décrit une factory complète (phases 0 à 5). Ce dépôt est un petit projet solo : un jeu PWA pour une enfant, sans backend, sans base de données. Le playbook recommande lui-même de s'arrêter à la phase 2 pour ce profil.

## Décision
**Gardé** : phases 0 à 2 (audit ; bun, oxlint, oxfmt, hooks, `AGENTS.md` ; CI obligatoire, holdout, garde des zones sensibles, protection de `main`), TypeScript en vérification du JavaScript (ADR 0003), `docs/factory/LEARNINGS.md` et `docs/factory/METRICS.md` en version légère.

**Écarté, et pourquoi :**
| Point du playbook | Raison |
|---|---|
| Diátaxis (réorganiser `docs/`) | Conductor est déjà la convention de spec et de plan ; déplacer les docs ferait du bruit sans gain |
| Skills `spec-writer`, `implement`, `review` | Conductor les remplace (le playbook dit de le réutiliser) |
| Skill `verify-ui` (Playwright) | Lourd (navigateurs de plusieurs centaines de Mo, CI plus lente) ; les tests jsdom couvrent l'interface. À revoir si un bug visuel passe les tests |
| Base de données éphémère | Pas de base ; les sauvegardes figées du holdout jouent ce rôle |
| Holdout caché à l'agent | Impossible en local ; la CI protège ces tests (étiquette `human:approved`, posée par un humain seulement) |
| Sentry | Jeu d'enfant, prénoms : rien ne sort de l'appareil. Les échecs d'enregistrement sont montrés dans l'espace parents |
| Pipeline automatique, sandbox Docker, boucle de review (phase 3) | Clé API dans GitHub et tokens payants par issue, pour un projet de cette taille. À rouvrir si ce dépôt devient le terrain d'essai d'autres projets |
| Evals (phase 4) | Elles mesurent un pipeline, qui n'existe pas |
| Modèles économiques, DeepSeek (étape 5) | Supposent le pipeline ; et des API hébergées en Chine sont exclues pour un dépôt lié à une enfant |

## Vérification

Aucun check : la décision est de ne pas installer ces étapes, il n'y a rien à faire respecter dans le code. Côté cothon, `make fleet` signale toute action du `CHANGELOG.md` ni faite ni notée en exception dans `docs/factory/COTHON.md`.

## Conséquences
- Positif : une factory proportionnée, qui tient dans `bun run check` (19 s) et une CI d'une minute.
- Revoir cet ADR si : plusieurs issues par semaine sont confiées à des agents, ou un bug visuel ou de production passe la CI.
