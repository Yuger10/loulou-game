# Audit du dépôt : Le Lagon Magique (phase 0 de la cuisine étoilée)

> Référence : playbook cothon (`software-factory-playbook.md` du plugin `cothon` 0.1.0), section 3. Audit réalisé le 21 novembre 2026 sur `main` en v65.
> Cette phase ne modifie rien d'autre que ce fichier. La phase 1 attend les réponses d'Amrou (fin du document).

## 1. Stack détectée

| Élément | Valeur |
|---|---|
| Type | PWA, jeu éducatif pour enfant (mathématiques, lecture, logique), en français |
| Langage | JavaScript vanilla, **ES modules natifs** (ADR 0002), HTML, CSS, SVG dessiné dans le code |
| Framework | Aucun. Pas de bundler en production : les fichiers sont servis tels quels |
| Architecture | **Feature slices** (ADR 0001) : `app > features > entities > shared`, 161 fichiers JS (16 900 lignes), 69 fichiers CSS, manifest `js/slices.cjs` |
| Package manager | **npm** (`package-lock.json`). Node 24.13, npm 11.18 (pnpm 10.28 installé sur le poste, non utilisé) |
| Dépendances | Aucune en production. `devDependencies` : esbuild, jsdom, acorn, acorn-walk (tests uniquement) |
| Monorepo | Non |
| Données | `localStorage` sur l'appareil, pas de serveur, pas de base de données |
| Déploiement | **GitHub Pages en mode legacy, depuis la racine de `main`** : chaque merge sur `main` part directement en production |

## 2. Commandes existantes

| Rôle | Commande | État |
|---|---|---|
| Installer | `npm ci` | OK |
| Lancer en local | `npm start` (`python3 -m http.server 8080`) | OK |
| Build | aucun | Pas nécessaire (pas de bundler) |
| Générer `index.html` et la liste de cache de `sw.js` | `npm run sync` | OK, à lancer à la main après tout ajout de fichier |
| Tests | `npm test` | OK : **1 457 tests verts, 0 échec, 110 s** |
| Tests ciblés | `npm run test:jeux`, `test:saison2`, etc. | OK |
| Lint | **manquant** | Aucune config ESLint, Biome ni Prettier |
| Typecheck | **manquant** | Pas de TypeScript, pas de `checkJs` |
| `check` / `verify` | **manquants** | |
| Migrations | dans le code : `SAVE_VERSION = 8` et migrations dans `js/entities/game-state/state.js` | Testées par les suites |

## 3. État des tests

- **18 fichiers** dans `test/` (5 550 lignes) : 17 suites branchées sur `npm test`, plus des outils (`test/tools/` : page jsdom, faux audio, garde d'architecture `boundaries.js`, `sync.js`).
- Style : tests de comportement dans jsdom (on clique, on lit le DOM), plus des tests de logique pure (difficulté, niveaux). Pas de framework : chaque fichier est un script Node qui affiche des ✅.
- `test/slices.test.js` vérifie déjà l'architecture (couches, absence de cycles, API publiques). C'est l'équivalent d'une lint rule custom.
- **Couverture** : non mesurée (aucun outil). Qualitativement, chaque mini-jeu, île et écran a sa suite.
- **Durée** : 110 s en séquence. Les suites tournent l'une après l'autre dans une seule commande.
- **Tests flaky connus** (tous corrigés en v64, la cause reste dans le code) :
  - les coccinelles (Jardin des Fées) échouaient 1 fois sur 6, y compris sur `main` : tirage `Math.random()` non maîtrisé par le test ;
  - « Grisou … inspire » (pause) : attente à durée fixe, remplacée par un `waitFor`.
- La liste des suites est écrite à la main dans le script `test` de `package.json` : source de conflits à chaque rebase entre sessions parallèles.

## 4. Base de données

Aucune. La sauvegarde est un objet JSON dans `localStorage`, versionné (`SAVE_VERSION`, aujourd'hui 8) avec des migrations dans le code. La sauvegarde joue le rôle du schéma de données : une migration ratée efface ou corrompt la progression d'un enfant, sans retour possible côté serveur. Une fonction d'export et d'import (`js/features/backup/`) existe.

Conséquence pour la phase 2 : pas de base éphémère à prévoir. L'équivalent est un **jeu de sauvegardes de référence** (une par ancienne version) rejouées par les tests de migration.

## 5. CI existante

**Aucune.** Pas de dossier `.github/`, pas de branch protection sur `main` (l'API répond « Branch not protected »), dépôt **public**. Les tests ne tournent qu'en local, avant chaque PR, et leur passage repose sur la discipline de la session qui code. Comme Pages publie `main` directement, rien n'empêche aujourd'hui un merge rouge d'arriver chez l'enfant.

## 6. Contexte existant

| Source | Contenu | Remarque |
|---|---|---|
| `CLAUDE.md`, `AGENTS.md`, `.cursor/`, `.claude/` | **absents** | À créer en phase 1 |
| `conductor/` | product, product-guidelines, tech-stack, **workflow** (TDD, critères de qualité, livraison), styleguides JS et HTML/CSS, checklists île et mini-jeu, registre et 19 tracks avec spec et plan | Joue déjà le rôle de `spec-writer` et `implement`. **À réutiliser** (règle du playbook) |
| `docs/adr/` | 0001 feature slices, 0002 modules ES | Bon format, à continuer |
| `PRD-lagon-magique.md` | 1 579 lignes, 60 sections de version | Trop long pour être lu en entier par un agent : le `CLAUDE.md` doit pointer vers les bonnes sections |
| `TODO.md`, `README.md`, `ANALYSE-DIFFICULTE.md` | 172, 63 et 190 lignes | |
| Skills | `conductor` dans `~/.claude/skills` (poste d'Amrou, hors dépôt) | Un agent en CI ne le verra pas : à versionner dans le dépôt si le pipeline arrive |

## 7. Anti-patterns récurrents (top 5)

Les agents copient ce qu'ils voient. Chaque point est mesuré sur `js/`.

1. **Données insérées dans du HTML sans échappement.** Aucune fonction d'échappement dans le code. Les prénoms tapés par l'enfant (12 caractères) et ceux d'une **sauvegarde importée** (fichier quelconque) partent tels quels dans des templates HTML :
   - `js/features/party/party.js:47` et `:66` ;
   - `js/features/backup/backup.js:266`.

   Règle proposée : un tag `html` qui échappe par défaut, plus un test avec un prénom `<b>`.

   **Corrigé le 22 novembre 2026** (décision d'Amrou : nettoyer à l'entrée plutôt qu'échapper à l'affichage) : `cleanName()` à chacune des 5 portes d'entrée d'un prénom, `test/prenoms.test.js` avec un garde d'architecture.
2. **`Math.random()` appelé directement** : 63 occurrences dans 27 fichiers, dont 14 mini-jeux. C'est la cause du test flaky des coccinelles. Le bon exemple existe déjà : `ladybugsBuildRound(dd, rng)` accepte un générateur injecté.

   Règle proposée : `no-restricted-syntax` hors de `shared/lib`, tirages par un `rng` injectable.
3. **`catch` vides** : 32 dans 13 fichiers (par exemple `js/features/music/music.js:163-164`, `js/features/settings/settings.js:111`). Certains sont légitimes (audio iOS), mais rien ne les distingue d'une erreur avalée par paresse.

   Règle proposée : `no-empty` avec commentaire obligatoire, ou un helper `ignoreError(reason, fn)`.
4. **Délais fixes `setTimeout`** : 105 dans 52 fichiers, mêlés à la logique de jeu (par exemple `setTimeout(onMissionWin, 400)`). C'est ce qui couple les tests au temps réel (110 s de suite, attentes à durée fixe).

   Règle proposée : un `delay()` central, réglable par les tests (le facteur `SPEED` de `rest.test.js` le fait déjà pour une slice).
5. **Rituel de livraison à la main dans 7 endroits** : cache de `sw.js`, PRD, TODO, `tech-stack.md`, `product.md`, plan, registre, plus la liste des tests dans `package.json`. C'est la source de presque tous les conflits de rebase entre sessions parallèles (v63, v64, v65).

   Proposition : un script `npm run release` et un check CI « le cache de `sw.js` a changé si le code a changé ».

Écart mineur, non retenu dans le top 5 : deux façons d'attacher un handler (`x.onclick =` 188 fois, `addEventListener` 47 fois). Les 2 095 couleurs hexadécimales en dur sont presque toutes dans les dessins SVG : ce n'est pas un problème.

## 8. Zones sensibles proposées

| Chemin | Pourquoi |
|---|---|
| `js/entities/game-state/state.js` (`SAVE_VERSION`, migrations) | Équivalent du schéma de données : progression de l'enfant, pas de sauvegarde serveur |
| `js/features/backup/` | Lecture de fichiers externes (entrée non fiable) |
| `js/features/rest/`, `js/features/parents/` | Pause et porte des parents : sécurité de l'enfant, décisions d'Amrou |
| `sw.js`, `manifest.json`, `index.html` | Un cache raté bloque l'appareil sur une vieille version |
| `js/slices.cjs`, `test/slices.test.js`, `test/tools/boundaries.js` | Garde d'architecture : un agent ne doit pas l'assouplir pour faire passer son code |
| `package.json`, `package-lock.json` | Supply chain |
| Dessins des personnages (`js/entities/character/characters-art.js`, SVG des compagnons) | Assets (règle du profil « jeu HTML ») |
| `.github/workflows/**`, futurs `tests/holdout/**` | Le playbook les interdit aux agents |

Données personnelles : prénoms et statistiques d'apprentissage d'un enfant, aujourd'hui **uniquement sur l'appareil**. Tout outil qui envoie des données hors de l'appareil (Sentry, Langfuse) change cette situation.

## 9. Profil du projet

Croisement de deux profils de la section 8 du playbook :

- **Jeu HTML** : la logique est déjà bien testée en jsdom. Il manque les **preuves visuelles** (screenshots ou vidéo des écrans touchés), et les assets doivent être protégés.
- **Petit projet** (solo, sans backend, PWA statique) : le playbook recommande **les phases 0 à 2 seulement**, le pipeline automatique n'étant pas rentable.

Adaptations prévues :

- **Phase 1** : `npm run check` (lint + tests) ; `CLAUDE.md` court qui pointe vers `conductor/workflow.md` ; ESLint avec les règles de la section 7 ; nettoyage des anti-patterns, une PR chacun.
- **Phase 2** :
  - CI GitHub Actions obligatoire, avec branch protection, puisque `main` est la production ;
  - tests holdout sur les parcours critiques : migration d'une vieille sauvegarde, pause impossible à contourner, porte des parents, montée de niveau ;
  - `CODEOWNERS` et garde des zones sensibles ;
  - screenshots Playwright comme preuves.
- **Ignoré** : base éphémère (pas de base).

## 10. Maturité et écarts à la stack de référence

Projet **actif, de taille petite à moyenne** : migration progressive vers la stack de référence cothon, une PR par rôle. Le détail (mesures, budgets, décision par rôle, ordre des migrations) est dans [`SPEED.md`](SPEED.md). En résumé :
- les tests sont hors budget (108 s en série, 35 s en parallèle, pour un budget de 30 s) ;
- npm passe à bun ;
- oxlint et oxfmt sont ajoutés ;
- pas de typecheck ;
- la CI arrive en phase 2.

## Questions pour Amrou

1. **npm ou pnpm ?** Le playbook impose pnpm partout. Ici, une seule dépendance de dev et aucun monorepo : le passage coûte un lockfile. Je recommande **pnpm**, par cohérence avec tes autres projets.
2. **Typecheck ?** Le projet est en JavaScript. Je recommande un `tsc --noEmit --checkJs` léger (non strict au début, sur `shared/` et `entities/` d'abord). L'autre choix est de s'en passer.
3. **Lint : ESLint ou Biome ?** Je recommande **ESLint** (flat config) : `no-restricted-syntax` et `no-restricted-imports` couvrent les règles de la section 7, et les règles custom iront dans `tools/lint-rules/`.
4. **Le top 5 des anti-patterns est-il le bon ?** Je propose de commencer par le 1 (échappement), puis le 2 (`Math.random`).
5. **Phase 3 (pipeline automatique) :** la recommandation « petit projet » est d'arrêter à la phase 2. Veux-tu quand même ce dépôt comme **terrain d'essai** du pipeline pour tes autres projets ?
6. **Merge :** le playbook dit « merge humain sans exception ». Jusqu'ici, tu me donnais l'ordre de merger. Je garde cette règle : **jamais sans ton ordre explicite**. Avec la branch protection, le merge sera en plus bloqué tant que la CI est rouge. D'accord ?
7. **Sentry :** jeu d'enfant, prénoms, appareil familial. Je recommande **pas de Sentry**, ou alors un journal d'erreurs local visible dans l'espace parents. Ton choix ?
8. **Conductor :** je propose de le garder comme format de spec et de plan (au lieu de créer des skills concurrents `spec-writer` et `implement`). D'accord ?
9. **Zones sensibles (section 8) :** la liste te convient-elle ? Faut-il ajouter quelque chose ?
10. **Session parallèle :** une autre session livre les îles. Les phases 1 et 2 touchent `package.json`, l'outillage et beaucoup de fichiers (nettoyages). Faut-il la mettre en pause pendant les PR de nettoyage pour éviter les conflits ?

## Décisions d'Amrou (21 novembre 2026)

Principe transverse : **exécution rapide, le moins de ressources possible**. À chaque choix, l'option la plus légère.

1. ~~pnpm~~ **bun**, après lecture du playbook cothon : alignement sur la stack de référence (bun, oxlint, oxfmt).
2. **Pas de typecheck** pour l'instant (option la plus légère). À reconsidérer seulement si une erreur de type passe les tests.
3. ~~Biome~~ **oxlint et oxfmt** (stack de référence cothon).
4. Top 5 validé : on commence par l'échappement, puis `Math.random`.
5. **Phase 3 probable**, à décider selon les prochaines itérations.
6. Merge **uniquement sur ordre explicite**, et bloqué si la CI est rouge.
7. **Pas de Sentry** ; un journal d'erreurs local dans l'espace parents, si besoin.
8. **Conductor** reste le format de spec et de plan.
9. Zones sensibles validées telles que proposées.
10. L'autre session a **une dernière livraison** en cours : les PR de nettoyage attendent qu'elle soit mergée.
