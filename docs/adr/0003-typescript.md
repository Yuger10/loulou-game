# ADR 0003 : Passer à TypeScript, par la vérification du JavaScript (TypeScript 7, `checkJs`), sans build

- **Statut :** acceptée le 2026-11-22 (option 1) ; étape 1 livrée (mode souple, zéro erreur), étape 2 suivie par la track `typescript-checkjs`
- **Date :** 2026-11-22
- **Décideur :** Amrou
- **Liens :** [ADR 0002](./0002-modules-es-natifs.md) (modules ES natifs, sans build) ; playbook cothon, section 4.2 (stack de référence : TypeScript 7) ; skill `cothon:migrating-to-tsgo` ; `docs/factory/SPEED.md`

## Contexte

Le jeu est en JavaScript (167 modules ES, 24 500 lignes), servi tel quel par GitHub Pages, sans étape de build ([ADR 0002](./0002-modules-es-natifs.md)). Il n'a aucun typecheck : à la phase 0 de la factory, Amrou a choisi « le plus léger ». La stack de référence cothon prévoit TypeScript 7 (compilateur natif en Go). Le passage à TypeScript est à décider.

**Mesures du 22 novembre 2026**, TypeScript 7.0.2 en vérification du JavaScript existant (`allowJs`, `checkJs`, `noEmit`), sans rien changer au code :

| Mode | Erreurs | Fichiers | Temps |
|---|---|---|---|
| Souple (`strict: false`) | 284 | 60 | **0,12 s** |
| Strict | 2 663 | 97 | 0,12 s |

Détail du mode souple :
- **260 erreurs liées au DOM** (TS2339) : `querySelector` renvoie un `Element`, qui n'a pas `.hidden`, `.value`, `.focus()`…, alors que le code sait que c'est un bouton ou un champ. Il faut annoter, pas corriger.
- **24 erreurs restantes : toutes des faux positifs d'inférence**, par exemple :
  - un point d'accroche dont la valeur par défaut ne prend pas de paramètre (`enabled: () => !race.active`, appelé avec `kind`) ;
  - un tableau déduit `'court' | 'long'` qui reçoit aussi `'silence'` ;
  - `textContent = 42` (nombre accepté par le navigateur).
- **Aucun vrai bug trouvé.** Les 1 500 vérifications des tests et oxlint couvrent déjà bien le code actuel. Le gain attendu est **pour la suite** : un agent qui appelle une fonction avec les mauvais arguments, une faute de frappe dans une propriété, un champ de sauvegarde renommé à moitié.

En mode strict, les erreurs viennent surtout des paramètres sans type (1 166 TS7006) et des accès par clé (499 TS7053) : c'est le coût d'annoter tout le code.

## Options envisagées

1. **Vérifier le JavaScript avec TypeScript 7 (`checkJs`), types en JSDoc, progressivement.**
   - Les fichiers restent en `.js`, le jeu reste servi sans build : l'ADR 0002 tient.
   - `tsconfig.json`, `bun run typecheck` dans `check` (0,12 s, budget cothon 10 s).
   - Étape 1, mode souple : un helper typé pour le DOM (`byId('pe-name')` qui renvoie un `HTMLElement`, ou une annotation `/** @type {HTMLInputElement} */`) fait tomber les 260 erreurs DOM ; les 24 faux positifs se règlent par une annotation JSDoc à la source (le type du point d'accroche, celui du tableau).
   - Étape 2, strict par couche, en commençant par le bas : `shared/`, puis `entities/` (dont l'état et la sauvegarde, la zone la plus sensible), puis `features/`. Une couche passe en strict quand elle est propre, par `// @ts-check` ou un `tsconfig` par couche.
2. **Migrer en vrais fichiers `.ts`.**
   - Il faut une étape de build (bun ou esbuild) avant le déploiement : GitHub Pages ne sert plus `main` tel quel, la CI construit et publie ; la liste des fichiers du service worker et `index.html` viennent du build.
   - 167 fichiers renommés, des imports et des tests à adapter, l'ADR 0002 remplacée.
   - Gain par rapport à l'option 1 : une syntaxe plus courte que JSDoc pour les types. Rien de plus pour la sécurité : le compilateur et les vérifications sont les mêmes.
3. **Rester en JavaScript sans typecheck** (la décision de la phase 0). Plus léger, aucun travail ; les erreurs de type restent à la charge des tests et de la relecture.

## Décision

**Option 1.** Critères du playbook (4.2), dans l'ordre :
- **Vitesse :** 0,12 s, négligeable dans `check` (18 s) et dans le hook de l'agent si on l'y ajoute plus tard.
- **Déterminisme :** version exacte de TypeScript 7 dans `package.json`, comme oxlint et oxfmt.
- **Couverture :** les mêmes vérifications que l'option 2.
- **Maturité :** TypeScript 7 stable depuis juillet 2026 ; aucun outil du projet n'utilise l'API JavaScript de TypeScript (seul cas qui obligerait à garder TypeScript 6, selon le skill `migrating-to-tsgo`).
- **Coût de migration :** progressif, sans build, sans toucher au déploiement ni à l'ADR 0002. L'option 2 change la chaîne de production pour un gain de syntaxe seulement.

## Conséquences

- **Positif :** les agents reçoivent une erreur de type en 0,12 s au lieu de la découvrir en test, ou pas du tout ; les signatures documentent le code (paramètres des mini-jeux, forme de la sauvegarde).
- **Négatif ou risque :**
  - du JSDoc en plus dans un code compact, surtout en mode strict ;
  - pendant la migration, deux régimes cohabitent (couches strictes et souples) : `AGENTS.md` dit lequel s'applique où.
- **Plan de repli :** retirer `typecheck` de `check` ; les annotations JSDoc sont des commentaires, sans effet sur le jeu.
- **Mise en œuvre :** track Conductor [`typescript-checkjs`](../../conductor/tracks/typescript-checkjs_20261122/plan.md).

## Validation (étape 1, 22 novembre 2026)

- TypeScript 7.0.2 en version exacte, `tsconfig.json` (checkJs, mode souple), `bun run typecheck` dans `check`, la CI et le hook de l'agent.
- **284 erreurs → 0** :
  - `types/dom.d.ts` (le jeu interroge son propre HTML : `querySelector` renvoie un `HTMLElement`) en fait tomber 200 sans toucher au code ;
  - les champs et boutons sont annotés à leur déclaration (JSDoc) ;
  - l'état partagé posé sur des fonctions (`bindQuit._last`, `showToast._t`) devient un état explicite du module (`forgetSpokenHint`, `rememberSpokenHint`) ;
  - les points d'accroche (`hintPolicy`, `saveSlot`, préférences audio) ont leur type ;
  - un `Set` réutilisé en tableau sous le même nom est séparé en deux.
- **Une incohérence réelle attrapée** : un appel à `bellSVG(m, i)` n'avait pas suivi le retrait du paramètre `i` (étape oxlint de la factory).
- Temps : `tsc` 93 ms ; hook de l'agent (format, lint, types) 211 ms, budget 300 ms. Test de mutation : un appel avec un argument de trop est refusé par la CI et renvoyé à l'agent juste après l'édition.
