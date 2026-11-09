# ADR 0001 : Organiser le code en « feature slices », en deux étapes (scripts classiques, puis modules ES)

- **Statut :** acceptée, étape A livrée en v51 ; **complétée par l'[ADR 0002](./0002-modules-es-natifs.md)** (étape B, modules ES natifs, livrée en v54)
- **Date :** 2026-11-09
- **Décideur :** le propriétaire du projet, sur proposition de Claude (track Conductor `refactor-feature-slices`)
- **Specs liées :** [`refactor-feature-slices`](../../conductor/tracks/refactor-feature-slices_20261109/spec.md) (A), [`refactor-esm-modules`](../../conductor/tracks/refactor-esm-modules_20261109/spec.md) (B)

## Contexte
En v50, le jeu compte 37 scripts classiques à plat dans `js/`, plus un `styles.css` de 2 800 lignes, sans build ni dépendance d'exécution. Tous partagent la portée globale.
- **Des fichiers fourre-tout :** `ui.js` (56 noms, dépend de 18 fichiers), `state.js` (état, en-tête, accueil, quêtes, album), `data.js`, `minigames.js` (moteur et 6 jeux).
- **Des dépendances implicites et circulaires :** la modale appelle le minuteur, l'histoire et les gains ; la navigation appelle le rendu de chaque vue ; 174 gardes `typeof fn==='function'` protègent des fichiers « peut-être absents ».
- **Beaucoup de contenu à venir :** compagnons à rôles, collection de squishies, saison 2 avec deux mondes et quatre mini-jeux. Chacun ajoute plusieurs fichiers, sans endroit évident où les mettre.
- **Contraintes fortes du projet :** PWA hors-ligne servie telle quelle (GitHub Pages), pas de build, un test jsdom qui doit continuer de tourner, des sauvegardes d'enfants à ne jamais casser.

## Décision
1. **Organisation en « feature slices »,** inspirée de Feature-Sliced Design, réduite à **4 couches** : `app` → `features` → `entities` → `shared`. Un dossier par slice, avec son JS **et** son CSS.
2. **Règles :**
   - une couche n'utilise que sa couche ou les couches inférieures ;
   - entre slices, uniquement l'**API publique** déclarée ;
   - une seule définition par nom global.
3. **Un manifeste `js/slices.js`,** source unique de vérité : couche, fichiers dans l'ordre de chargement, API publique, ordre global du CSS (`CSS_ORDER`). `index.html` et `sw.js` en sont générés.
4. **Les règles sont vérifiées par un test** (`test/slices.test.js`, analyse du code avec `acorn`), puisque les scripts classiques n'ont pas de vraies frontières.
5. **Points d'accroche plutôt que dépendances vers le haut :** la couche basse expose un registre (`registerGame`, `registerView`, `onModalOpen` / `onModalClose`, `onWrongFeedback`, `onProfileRefresh`, `setAudioPrefsSource`, `setCompanionDressing`) et la feature s'y inscrit.
6. **Feuille de route en deux étapes :**
   - **A (v51) :** slices en **scripts classiques**, sans changer le mode de chargement ;
   - **B (v54) :** **modules ES natifs**, sans bundler (esbuild seulement pour les tests), avec un bus d'événements si des cycles apparaissent.

## Options envisagées
| Option | Pour | Contre | Verdict |
|---|---|---|---|
| **A. Slices en scripts classiques** | Aucun risque pour la PWA et le test jsdom ; migration progressive, chaque étape testée | Frontières conventionnelles, garanties seulement par un test | **Retenue comme première étape** |
| **B. Slices en modules ES natifs, d'un coup** | Vraies frontières (`import`/`export`), dépendances explicites | jsdom gère mal les modules : refaire le harnais de test ; migration « big bang » de 37 fichiers | **Retenue comme seconde étape**, une fois A en place |
| **C. Modules ES et bundler (Vite, esbuild)** | Frontières les plus propres, optimisations | Build obligatoire, `dist/` à publier : contraire à « sans build » ; change toute la chaîne de déploiement | Écartée |
| **D. Ne rien changer, juste des dossiers** | Rapide | Ne règle ni les fourre-tout ni les dépendances cachées | Écartée |
| **FSD complet** (`pages`, `widgets`, `processes`) | Standard reconnu | Cérémonie inutile pour une appli d'une seule page à vues | Réduit à 4 couches |

## Conséquences
**Positives (constatées en v51)**
- 49 slices. Les fourre-tout sont découpés, et `styles.css` est réparti en 48 feuilles avec une cascade **identique octet pour octet**.
- **Aucune dépendance vers le haut** dans tout le code, sans liste d'exceptions : les points d'accroche ont suffi.
- 203 gardes `typeof` retirées ; le moteur de mini-jeux ne connaît plus la liste des jeux (`registerGame`).
- Endroits évidents pour la suite : checklists « ajouter un mini-jeu » et « ajouter une île » (`conductor/`).
- Aucun changement pour l'enfant ni pour les sauvegardes ; 284 tests de jeu et le test de fumée inchangés et verts.

**Négatives et risques acceptés**
- **Plus de fichiers à charger** (64 scripts et 50 feuilles au lieu de 37 et 3). C'est acceptable en HTTP/2 (GitHub Pages) et avec le cache hors-ligne. À surveiller ; l'étape B pourra regrouper si besoin.
- **Frontières non garanties par le langage** jusqu'à l'étape B : elles reposent sur `npm test`. Un oubli de `npm run sync` ou `npm run api` fait échouer le test, ce qui est voulu.
- **L'ordre de chargement compte encore** (scripts classiques) : il est figé dans le manifeste.
- **Nouvelles dépendances de développement** : `acorn` et `acorn-walk`, jamais chargées par le jeu.

## Validation
`test/slices.test.js` vérifie : cohérence entre le manifeste, les fichiers, `index.html` et `sw.js` ; unicité des noms ; couches ; API publiques. Il prouve aussi qu'il sait échouer, sur deux cas fabriqués. Une violation réelle (une slice `shared` qui lit `state`) a été vérifiée détectée pendant l'implémentation.

## À revoir
- ~~À l'étape B (v54) : écrire l'ADR 0002 (modules ES, harnais esbuild, bus d'événements) et passer celui-ci au statut « complété par 0002 ».~~ Fait : [ADR 0002](./0002-modules-es-natifs.md).
- Si le nombre de requêtes devient un problème mesuré sur un vrai appareil.
