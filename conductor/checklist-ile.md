# Checklist : ajouter une île (un monde)

Architecture en feature slices (v51), en modules ES natifs (v54). Exemple de référence : le Pays Squishy (`squishy`).
Remplacer `<ile>` par la clé de l'île (ex. `boites`).

## 1. Tests d'abord
- [ ] `test/smoke.test.js` : l'île s'ouvre au bon niveau, ses personnages et son jeu favori sont là. Les tests génériques (thème de couleurs, île dans le cadre de la carte, sans chevauchement) la couvrent automatiquement.

## 2. Entités
> Tout `js/` est vérifié en TypeScript strict (`strict: true` dans `tsconfig.json` depuis la v66.11, [ADR 0003](../docs/adr/0003-typescript.md)) : `bun run typecheck` vérifie tout nouveau code, sans rien à déclarer. Une entrée qui ajoute un champ à une table typée (`World`, `Archipelago`, `Character`, `Item`, `Squishy`, `GameState`…) étend d'abord son `@typedef` ; chaque nouvelle fonction a ses `@param` et `@returns`. Jamais `any` ni `@ts-ignore`.

> Archipels (`ARCHIPELAGOS`, `js/entities/world/availability.js`) : `saison` 1 = Le Lagon Magique, 2 = Le Ciel des Rêves, 3 = La Grande Expédition. Un archipel sans île n'a pas de niveau (`level: null`) et reste caché partout (pas d'onglet, pas de section dans le journal, pas d'ouverture) : les vues parcourent `shownArchipelagos()`, jamais `ARCHIPELAGO_ORDER`. Il apparaît tout seul à la première île qui porte sa `saison`.

## 2 bis. Taille des fichiers (`max-lines` à 800, `.oxlintrc.json`, v66.16)
Avant d'ajouter à un fichier partagé, mesurer sa marge (`wc -l`). Relever `max-lines` est exclu : c'est un cliquet qui ne fait que descendre (`.oxlintrc.json`). La v66.16 a posé le modèle pour la saison 2 :
- ses dessins sont dans `characters-art-s2.js`, avec une fonction `season2Art(ART, kit)` qui reçoit les outils de dessin (`@typedef ArtKit` dans `characters-art.js`) ;
- ses paliers sont dans `difficulty-s2.js`, qui importe `tierValue` (déjà exporté par `difficulty.js`) et que `difficulty/index.js` réexporte.

La saison 3 suit le même modèle, avec le suffixe `-s3`.

Tailles au 22/11/2026, après la v66.16 :

| Fichier | Lignes |
|---|---|
| `characters.js` | 798 |
| `characters-art.js` | 759 |
| `story.js` | 729 |
| `difficulty.js` | 670 |
| `island.js` | 663 |
| `squishies.js` | 630 |
| `squishy-art.js` (dessins des squishies) | 640 |
| `episodes.js` | 534 |

Ce qu'une île de la saison 2 a coûté, en lignes :

| Contenu | Lignes |
|---|---|
| personnages | 52 |
| chapitre | 28 |
| paysage | 23 |
| squishies | 56 |
| dessins des squishies | 50 |
| épisodes | 29 |

Avec cinq îles, cinq fichiers dépasseraient 800 lignes : `characters.js`, `story.js`, `squishies.js`, `squishy-art.js` et `island.js`. Leur contenu de la saison 3 va donc dans un fichier frère. La track `saison3-ouverture` prépare ces fichiers vides en phase 1, sans rien changer à l'écran, et déclare chacun dans `js/slices.cjs`, juste avant le fichier qui le lit :

| Fichier frère | Ce qu'il exporte | Qui le lit |
|---|---|---|
| `js/entities/world/worlds-s3.js` (créé par `monde-crayons`) | `WORLDS_S3` (`Record<string, World>`, type lu par `import('./worlds.js').World`) | `worlds.js` l'importe et l'étale à la fin de `WORLDS` (`...WORLDS_S3`) |
| `js/entities/character/characters-s3.js` | `CHARACTERS_S3` (`Record<string, Character>`, type lu par `import('./characters.js').Character`) | `characters.js` l'importe et l'étale à la fin de `CHARACTERS` (`...CHARACTERS_S3`) |
| `js/entities/character/characters-art-s3.js` | `season3Art(ART, kit)` (même signature que `season2Art`) | `characters-art.js` l'importe et l'appelle juste après `season2Art`, avec le même objet d'outils |
| `js/entities/squishy/squishies-s3.js` | `SQUISHIES_S3` (`Record<string, Squishy>`, les modèles) | `squishies.js` l'étale à la fin de `SQUISHIES` |
| `js/features/squishies/squishy-art-s3.js` | `SQ_ART_S3` (`Record<string, SqArt>`, type lu par `import('./squishy-art.js').SqArt`) | `squishy-art.js` l'étale à la fin de `SQ_ART` |
| `js/features/story/story-s3.js` | `STORY_S3` (`Record<string, StoryChapter>`) | `story.js` l'étale à la fin de `STORY` |
| `js/features/island/island-s3.js` | `ISLE_SCENERY_S3` (`Record<string, (w: World) => string>`, comme `ISLE_SCENERY`) | `island.js` l'étale à la fin de `ISLE_SCENERY` |

- **Ce que chaque île met dans les fichiers `-s3`** : son entrée de `WORLDS_S3`, ses 4 personnages, ses 4 dessins, ses 6 squishies et leurs 6 dessins, son chapitre et son paysage.
- **Le plafond qui compte en CI est plus bas que `max-lines`** : le job « violations ajoutées » compare la PR à sa base avec le preset `.cothon/presets/oxlint/qualite.json` (300 lignes par fichier, 50 lignes et 3 paramètres par fonction, complexité 20). Un fichier déjà au-dessus de 300 lignes peut grandir ; un fichier en dessous ne doit pas passer au-dessus (c'est pourquoi `worlds.js`, 287 lignes, a son fichier frère) ; une fonction ne dépasse pas 50 lignes (dans `characters-art-s3.js`, `season3Art` appelle une ou deux fonctions par île, par exemple `crayonsArt`). Les tests d'une île tiennent en plusieurs suites courtes `test/<ile>*.test.js` et un harnais `test/tools/<ile>.js`. Vérifier avant la PR : `bash .cothon/bin/new-violations.sh --base origin/main -- bash "$PWD/.cothon/bin/quality-check.sh" complexite --project .`
- **Les suites de la saison 3** (`test/saison3*.test.js`) mettent de côté les vraies îles de la saison 3 le temps de leurs essais (`setIslands` de `test/tools/saison3.js`), avec leurs objets, recettes, décorations, personnages et série de squishies : une île qui ajoute une autre table lue par son île (`T[k].world`) l'ajoute à `WITH_ISLAND`.
- **Ce qui reste dans le fichier d'origine** :
  - les lignes courtes : sa série dans `SQUISHY_SERIES`, `SQUISHY_SERIES_ORDER` et `SQUISHY_ISLAND_SERIES` (une ligne chacune), la couleur de sa boîte dans `SQ_BOX_COLORS` (`squishy-art.js`, une ligne ; une série sans couleur propre prend la couleur par défaut, comme la série « Coffres ») ;
  - son thème `MUSIC_THEMES` (`music.js`, 276 lignes) ;
  - ses épisodes (`episodes.js` : 534 + 5 × 29 ≈ 680 lignes).
- **Dessins : zone sensible.** `characters-art-s3.js` est une zone sensible, comme les deux autres fichiers de dessins (AGENTS.md, Interdits). La track `saison3-ouverture` l'ajoute donc aux mêmes endroits que la PR #84 pour `-s2` :
  - `test/tools/sensitive.js`, motif `characters-art(-s2|-s3)?`, avec un cas dans son `--selftest` ;
  - `docs/factory/AUDIT.md`, section 8 ;
  - AGENTS.md, ligne « Toucher aux dessins » ;
  - `.github/CODEOWNERS`. `.github/` est une zone protégée : cette PR le dit en tête de sa description, avec le geste (étiquette `human:approved`).
- **Dessins : ce qu'une île peut changer.** Les dessins d'une île sont une demande explicite de sa track. Une île ajoute ses dessins et ne modifie aucun dessin existant. Si un dessin demande un outil absent de `ArtKit` (par exemple `robot`, `dragon` ou `features`), la track l'ajoute au `@typedef ArtKit` et à l'objet passé aux deux appels : une ligne, aucun dessin ne change.
- **`characters.js` est plein** : après l'import et l'étalement de `CHARACTERS_S3`, il fait exactement 800 lignes. Une île qui veut un champ de plus par personnage n'étend donc pas `@typedef Character` : elle crée une table à part dans `characters-s3.js`, avec son propre `@typedef`, réexportée par `js/entities/character/index.js` (exemple : `CHARACTER_TICKLES` de `monde-chatouilles`).
- **Fonctions de palier des nouveaux jeux** et leurs `@typedef` : elles vont dans `js/entities/difficulty/difficulty-s3.js`, sur le modèle de `difficulty-s2.js` (`import { tierValue } from './difficulty.js'`).
  - `js/entities/difficulty/index.js` le réexporte dans un bloc `export { … } from './difficulty-s3.js'`.
  - La première track qui en a besoin le crée et le déclare dans `js/slices.cjs` (slice `difficulty`, après `difficulty-s2.js`). Les suivantes y ajoutent leurs fonctions.
  - `LIVES_TABLE`, `GENEROUS_KINDS` et `NO_TIMER_KINDS` restent dans `difficulty.js` (une ligne par jeu).
- **Un fichier de jeu** qui dépasserait 800 lignes se découpe en fichiers frères dans sa slice (par exemple les banques de textes à part), déclarés dans `js/slices.cjs`, puis `bun run sync`.

## 2 ter. Emojis
Le jeu doit marcher sur les appareils anciens (AGENTS.md) : un emoji trop récent s'y affiche en carré vide. Un emoji ajouté appartient à Emoji 13.1 ou avant (2020), ou figure déjà dans `js/`. Les emojis d'Emoji 14 et 15 (par exemple 🫛, 🪭, 🫙, 🪷, 🫧, 🪸) sont exclus. Règle proposée par Claude le 22/11/2026 : à confirmer par Amrou.

## 2 quater. Tests existants à effectif figé
Trois vérifications existantes comptent le contenu du jeu en dur (après l'Île des Squishy Dumplings : 65 personnages, 11 séries, 66 squishies). Chaque île les met à jour dans sa PR, au titre de la règle « Tests existants touchés par un changement voulu » (`conductor/workflow.md`). Chaque fois, c'est un ajout du même genre que celui des îles précédentes, et aucune vérification n'est affaiblie :
- `test/smoke.test.js`, « personnages : les N ids possèdent un SVG » (vers la ligne 755) : `N` vaut le nombre trouvé sur `main` après le rebase, plus les personnages de l'île (57 + 4 = 61 pour la première île livrée), dans le libellé et dans l'expression.
- `test/squishies.test.js`, « 3 séries au lancement… » (vers la ligne 86) : la série de l'île s'ajoute **à la fin** du tableau attendu, après les séries déjà livrées ; le libellé nomme la nouvelle série.
- `test/squishies.test.js`, « 6 modèles par série (N squishies) » et « noms uniques » (vers les lignes 91 et 107) : `N` augmente de 6, dans le libellé et dans les deux expressions.

Les tests qui comptent les cases d'un écran (`16` manquants, `3` rangées, `12` emplacements) ne voient que les séries débloquées de leur scénario : une nouvelle île ne les change pas. `test/niveaux.test.js` (19 niveaux, `8,6,5`) reste vrai, car la saison 3 garde 5 îles. Règle proposée par Claude le 22/11/2026 : à confirmer par Amrou.

## 3. Features
- [ ] `js/shared/styles/design-system-v21.css` (ou une feuille de la slice île) : le thème `body[data-world="<ile>"]{--world-sky:…; --world-sea:…}`.
- [ ] `js/features/island/island.js` : son paysage dans `ISLE_SCENERY.<ile>` (saison 3 : `ISLE_SCENERY_S3` dans `island-s3.js`, section 2 bis).
- [ ] `js/features/story/story.js` : son chapitre `STORY.<ile>` (saison 3 : `STORY_S3` dans `story-s3.js`, section 2 bis) (guide, 3 phrases d'intro, au moins 2 énigmes en emojis avec un `tip`, succès, récompense). Une île de la saison 2 montre Grisou, qui reprend des couleurs quand son énigme est résolue.
- [ ] `js/entities/squishy/squishies.js` : la série de squishies gagnée par son énigme, dans `SQUISHY_ISLAND_SERIES.<ile>` (et sa propre série dans `SQUISHY_SERIES` / `SQUISHIES` si le monde en a une, v53 ; saison 3 : les modèles dans `SQUISHIES_S3`, `squishies-s3.js`, section 2 bis).
- [ ] `js/features/story/episodes.js` : ses 3 épisodes `EPISODES.<ile>` (racontés par les autres habitants, jamais par le guide).
- [ ] `js/features/music/music.js` : son thème `MUSIC_THEMES.<ile>`.
- [ ] Ses mini-jeux éventuels : voir [checklist-mini-jeu.md](./checklist-mini-jeu.md).

## 4. Brancher et vérifier
- [ ] `bun run sync` si des fichiers ont été ajoutés ; un nom exposé s'ajoute à l'`index.js` de sa slice.
- [ ] `bun run check` vert.
- [ ] Cache `sw.js` incrémenté, PRD et TODO à jour.
