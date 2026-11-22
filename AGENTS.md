# Le Lagon Magique

## Ce que fait le projet
Jeu éducatif en français pour une enfant de 6 ans (mathématiques, lecture, logique) : des îles, des personnages, des mini-jeux, une collection. PWA sans dépendance de production, jouée sur téléphone et tablette, en ligne sur GitHub Pages depuis `main` : **chaque merge est en production une minute après.** Données uniquement sur l'appareil (`localStorage`).

## Commandes
- Installer : `bun install` (installe aussi le hook git). **bun seulement** : npm, yarn et pnpm sont interdits, `check` échoue si leur lockfile apparaît.
- Vérifier avant de terminer : `bun run check` (obligatoire, doit passer) : garde des lockfiles, lint et format, docs, tests en parallèle (environ 20 s).
- Tests ciblés : `bun run test jardin` (filtre sur le nom des suites).
- Avant une PR : `bun run verify` (`check` puis les tests holdout de `test/holdout/`). La CI GitHub lance la même chose ; `ci-ok` doit être vert pour merger.
- Contrat de sortie de `check`, `verify` et des scripts : `0` réussi, `1` échec, `2` bloqué (un outil n'a pas pu tourner) ; bloqué n'est jamais une réussite. Les scripts non triviaux ont un `--selftest` (`bun run selftest`).
- Types : `bun run typecheck` (TypeScript 7 vérifie le JavaScript, [ADR 0003](docs/adr/0003-typescript.md), 0,1 s), déjà dans `check` et dans le hook de l'agent.
- Mettre en forme : `bun run format` (le hook de l'agent et le commit le font déjà).
- Après un ajout ou un déplacement de fichier : `bun run sync` (régénère `index.html` et `sw.js`).
- Lancer en local : `bun run start`, puis `http://localhost:8080` (jamais `file://`, les modules ES ne chargent pas).

## Architecture
- **Feature slices** sur 4 couches, en modules ES natifs : `js/app` > `js/features` > `js/entities` > `js/shared`. Voir [ADR 0001](docs/adr/0001-architecture-feature-slices.md) et [ADR 0002](docs/adr/0002-modules-es-natifs.md).
- Une slice n'importe que l'`index.js` d'une autre slice (son API publique), de sa couche ou d'une couche inférieure, sans cycle. Pour prévenir une slice plus haute : un événement (`emit`/`on`, `js/shared/lib/events.js`) ou un point d'accroche. `test/slices.test.js` le vérifie.
- `js/slices.cjs` est le manifeste (ordre des slices, CSS). Où ajouter quoi : [conductor/workflow.md](conductor/workflow.md#où-ajouter-quoi-feature-slices-v51-modules-es-v54).
- Ajouter un mini-jeu : [checklist-mini-jeu](conductor/checklist-mini-jeu.md). Une île : [checklist-ile](conductor/checklist-ile.md). Niveaux : [conductor/niveaux.md](conductor/niveaux.md).
- Sauvegarde versionnée : `SAVE_VERSION` et `migrate()` dans `js/entities/game-state/state.js`.
- Décisions : `docs/adr/` (lire les ADR avant de changer un outil ou un pattern). Outillage et mesures : `docs/factory/` (dont `LEARNINGS.md` : chaque correction d'Amrou y devient un check).

## Comment on travaille
- **Conductor** est la seule convention de spec et de plan : `conductor/tracks/<id>/spec.md` et `plan.md`, registre `conductor/tracks.md`. Cycle et livraison : [conductor/workflow.md](conductor/workflow.md).
- Tests d'abord : le comportement attendu s'écrit dans `test/*.test.js` avant le code. Un nouveau fichier de test est trouvé tout seul par le lanceur.
- Plusieurs sessions livrent en parallèle : le numéro de version s'attribue **à la livraison** (le suivant sur `main`), et on rebase sur `main` avant de pousser. Livrer : `bun run release track "résumé"` (67) ou `bun run release patch "résumé"` (66.3, sans track), juste avant la PR ; il reste à compléter la section du PRD.
- L'enfant d'abord : [conductor/product-guidelines.md](conductor/product-guidelines.md) (peu de texte et voix, pas de punition, anti-devinette, pas de minuteur avant le CP).

## Conventions
- **Handlers d'événements : `setHandler(el, 'click', fn)`** (`js/shared/ui/handlers.js`) : il remplace le handler précédent du même type, donc un rendu qui rebranche ses boutons ne crée jamais de doublon. Jamais `el.onclick = …` (oxlint). `addEventListener` direct seulement pour plusieurs écouteurs voulus ou `{ capture: true }`.
- **Compatibilité : le jeu doit marcher partout** (choix d'Amrou : c'est pourquoi il est en HTML). Pas d'API récente sans repli : par exemple `toSorted` et `toReversed` (Safari 16) sont interdits, on garde `.sort()` sur une copie si besoin.
- **Hasard : `random()`, `pickRandom()`, `shuffle()`** de `js/shared/lib` (oxlint interdit `Math.random` dans `js/`). Les tests sont rejouables : chaque passage affiche sa graine, et `TEST_SEED=1234 bun run test games` rejoue exactement le même. Un test peut forcer un tirage en remplaçant `Math.random`.
- **Prénoms : `cleanName()` à l'entrée** (`js/shared/lib/text.js`). Tout prénom saisi, chargé ou importé passe par elle avant d'être stocké : il ne contient alors jamais de HTML et s'insère sans risque dans les templates. `test/prenoms.test.js` vérifie chaque porte et refuse toute affectation `x.name = …` d'un joueur sans `cleanName`.
- **Stockage : `storageWrite()` et `storageRemove()`** de `js/shared/lib` (oxlint interdit `localStorage.setItem` et `removeItem` ailleurs). Elles renvoient `false` si l'écriture échoue (mémoire pleine, navigation privée) et préviennent l'interface : message à l'enfant une fois par session, carte « Enregistrement » dans l'espace parents.
- **Fin de mission : `winSoon()`** du moteur (`WIN_DELAY`, ou `WIN_DELAY_LONG` si le jeu finit sur une animation), jamais `setTimeout(onMissionWin, …)` dans un mini-jeu (`test/gardes.test.js`).
- **Bloc vide** : interdit par `no-empty`, sauf avec un commentaire qui dit pourquoi l'échec est sans gravité (`catch { // … }`).
- **État lu par les tests** : les tests lisent l'état du jeu par son nom (`ev('gameSolution')`). Une variable qui ne sert qu'aux tests porte `// oxlint-disable-next-line no-unused-vars -- lu par les tests` : ne pas la supprimer.
- **Types en JSDoc** (pas de fichiers `.ts`, pas de build) : un champ ou un bouton s'annote à sa déclaration (`/** @type {HTMLInputElement} */ (…)`), un point d'accroche a son type, un nom ne change pas de type (un `Set` et un tableau ont deux noms). Jamais `any` ni `@ts-ignore`.
- **Lint** : corriger le code plutôt que désactiver une règle. Toute exception `oxlint-disable` dit pourquoi, sur la même ligne. Les règles encore désactivées sont suivies par la track `lint-regles-completes`.
- Commentaires en français, qui expliquent le *pourquoi*. Styleguides : [JavaScript](conductor/code_styleguides/javascript.md), [HTML et CSS](conductor/code_styleguides/html-css.md).
- Textes (docs, commentaires, PR) en français, termes techniques anglais standards, **pas de tirets cadratins**.

## Interdits
- Merger sans ordre explicite d'Amrou, `push --force`, activer l'auto-merge.
- Poser l'étiquette `human:approved` : seul un humain la pose, jamais l'agent, même sur délégation.
- Annuler une expérience (`git checkout`, `reset`) sans avoir commité son travail avant.
- Modifier à la main `sw.js` et `index.html` (générés par `bun run sync`).
- Assouplir la garde d'architecture (`test/slices.test.js`, `test/tools/boundaries.js`, `js/slices.cjs`) pour faire passer du code.
- Désactiver, affaiblir ou supprimer un test existant pour faire passer `check`.
- Modifier une **zone protégée** : les tests holdout (`test/holdout/`, écrits ou validés par Amrou) et la CI (`.github/`). La CI échoue sans l'étiquette `human:approved`, posée par Amrou seul.
- Changer la forme de la sauvegarde sans augmenter `SAVE_VERSION` ni écrire la migration.
- Ajouter une dépendance (`package.json`, `bun.lock`) sans le demander.
- Toucher aux dessins des personnages et compagnons (`characters-art.js`, SVG) sans demande explicite.

## Ressources protégées (cothon 0.2.0-1)
Jamais supprimées, vidées ni réécrites par l'agent : la branche `main` (pas de `push --force`, `reset --hard`, `clean -f`, merge `--admin`, ni changement de sa protection), et les dossiers `js/`, `docs/`, `conductor/`, `test/`, `test/holdout/`, `.git/`, `.github/`. Le hook `PreToolUse` `.claude/hooks/guard-resources.sh` refuse ces commandes (sortie 2, `--selftest`). L'agent ne supprime que ce qu'il a créé.

## Zones sensibles (relecture humaine obligatoire)
Sauvegarde et migrations (`js/entities/game-state/`), import de sauvegarde (`js/features/backup/`, entrée non fiable), pause et porte des parents (`js/features/rest/`, `js/features/parents/`), PWA (`sw.js`, `manifest.json`, `index.html`), garde d'architecture, dépendances. Liste complète : [docs/factory/AUDIT.md](docs/factory/AUDIT.md#8-zones-sensibles-proposées).

## Définition de "terminé"
- `bun run check` passe.
- Les critères d'acceptation de la spec sont couverts par des tests.
- La doc touchée par le changement est à jour dans la même PR (ce fichier, `conductor/`, `docs/`, ADR si décision).
- Résumé du changement et risques écrits dans le corps de la PR ; une PR d'agent porte `agent-generated: true` dans son corps et l'étiquette `agent`, un correctif a un titre `fix: …` (métriques : `docs/factory/METRICS.md`).
