# Spec : Passage aux modules ES natifs (étape B) (v56)

> Track technique, **sans aucun changement visible pour l'enfant**. C'est l'étape B de la feuille de route A → B.
> **Dépend de** `refactor-feature-slices_20261109` (étape A) : les slices, leurs API publiques et le manifeste existent déjà.
> Prévue en v56, entre les squishies (v55) et la saison 2 (v57) ; elle ne bloque pas les tracks de jeu.

## 1. Pourquoi
L'étape A donne la structure, mais ses frontières ne tiennent que par un test. Avec des **modules ES natifs**, les frontières deviennent **réelles** : un fichier ne voit que ce qu'il importe. Les dépendances sont explicites, les cycles deviennent visibles, et il n'y a plus de portée globale partagée. Le tout se fait **sans build** : les navigateurs et la PWA chargent les modules directement.

## 2. Décisions (prises par délégation, modifiables)
| Sujet | Décision | Pourquoi |
|---|---|---|
| Runtime | `<script type="module" src="js/app/main.js">`, `import`/`export` natifs, **sans bundler** | La philosophie du projet est « sans dépendance d'exécution » ; tous les appareils visés gèrent les modules (iOS ≥ 11) |
| API publique | Chaque slice a un `index.js` qui **réexporte** son API publique. Entre slices, on importe uniquement ce `index.js` | C'est l'API publique de l'étape A, rendue concrète |
| Tests | **esbuild en dépendance de développement**, utilisé seulement par les tests pour regrouper `main.js` en un script que jsdom exécute | jsdom gère mal les modules ES ; le jeu, lui, reste sans build |
| Migration | **Progressive, avec une passerelle** : tous les fichiers deviennent des modules d'un coup, mais chacun **republie** temporairement ses noms sur `globalThis`. Puis, couche par couche, on remplace l'usage des globales par des `import`. Enfin, on retire la passerelle | Chaque étape reste verte ; pas de « big bang » risqué |
| Cycles | Les cycles entre features (par exemple histoire ↔ île ↔ quêtes) sont cassés par un **petit bus d'événements** dans `shared/lib/events.js` (`emit` / `on`), par exemple `island:unlocked`, `mission:won`, `chest:opened` | Les modules ES tolèrent mal les cycles à l'initialisation ; les événements découplent les features |
| Service worker | `FILES` généré depuis le manifeste par un script (`npm run sw`), vérifié par un test | Avec de nombreux petits modules, une liste à la main devient source d'erreurs |
| Navigateur | Servir en `http://localhost` ou `https://`. Ouvrir `index.html` en `file://` **n'est plus possible** (les modules l'interdisent) | Déjà le cas en pratique (`npm start`) ; à écrire dans le README |

## 3. Exigences
- **Aucun changement fonctionnel** ; mêmes sauvegardes ; `npm test` vert à chaque étape.
- À la fin : **aucune variable globale applicative** (à part ce qu'exige le navigateur), aucune garde `typeof fn==='function'` pour une dépendance, `js/slices.js` remplacé par les `index.js` (ou réduit à la liste servant au service worker).
- **Test de frontières réécrit** sur les `import` : on n'importe que des `index.js` d'autres slices ; la règle des couches est respectée ; aucun cycle d'import entre slices (détecté par le graphe d'esbuild, avec `metafile`).
- PWA et hors-ligne fonctionnent comme avant (les modules sont précachés).
- Docs : `tech-stack.md` (modules, esbuild en développement, `file://` interdit), `README.md`, `workflow.md` et checklists « ajouter un mini-jeu » et « ajouter une île » mises à jour.

## 4. Critères d'acceptation
1. `index.html` ne charge plus qu'**un** script, de type `module`.
2. Aucun fichier de `js/` ne contient d'écriture sur `globalThis` ou `window` (hors API navigateur), vérifié par un test.
3. Le test des imports échoue sur un import interdit (cas fautif volontaire) et sur un cycle.
4. `sw.js` `FILES` est égal à la liste générée ; le jeu fonctionne hors-ligne après une première visite.
5. `npm test` passe, sans aucune erreur JS ; parcours manuel identique ; une sauvegarde de la version précédente se charge.
6. Testé sur Safari iOS, Chrome Android et un navigateur d'ordinateur.

## 5. Hors périmètre
- TypeScript, un framework, un bundler pour la production.
- La réécriture de la logique des jeux.
- Une minification ou une optimisation du poids.
