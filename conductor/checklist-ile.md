# Checklist : ajouter une île (un monde)

Architecture en feature slices (v51), en modules ES natifs (v54). Exemple de référence : le Pays Squishy (`squishy`).
Remplacer `<ile>` par la clé de l'île (ex. `boites`).

## 1. Tests d'abord
- [ ] `test/smoke.test.js` : l'île s'ouvre au bon niveau, ses personnages et son jeu favori sont là. Les tests génériques (thème de couleurs, île dans le cadre de la carte, sans chevauchement) la couvrent automatiquement.

## 2. Entités
> Tout `js/` est vérifié en TypeScript strict (`strict: true` dans `tsconfig.json` depuis la v66.11, [ADR 0003](../docs/adr/0003-typescript.md)) : `bun run typecheck` vérifie tout nouveau code, sans rien à déclarer. Une entrée qui ajoute un champ à une table typée (`World`, `Archipelago`, `Character`, `Item`, `Squishy`, `GameState`…) étend d'abord son `@typedef` ; chaque nouvelle fonction a ses `@param` et `@returns`. Jamais `any` ni `@ts-ignore`.

## 2 bis. Taille des fichiers (`max-lines` à 1100, `.oxlintrc.json`)
Avant d'ajouter à un fichier partagé, mesurer sa marge (`wc -l`). Relever `max-lines` est exclu (corriger le code plutôt que la règle). Au 22/11/2026, deux fichiers sont presque pleins : `characters-art.js` (1055 lignes) et `difficulty.js` (1014). Le contenu de la saison 3 va donc dans des fichiers dédiés :
- **Dessins des personnages** : `js/entities/character/characters-art-saison3.js`. La track `saison3-ouverture` le prépare sans rien changer à l'écran : les aides de dessin (`svg`, `human`, `beast`, `face`, `features` et leurs couleurs) passent telles quelles dans `characters-art-kit.js`, qui les exporte ; `characters-art.js` les importe ; `characters-art-saison3.js` exporte sa table `ART_S3` (vide au départ), que `characters-art.js` fusionne dans `CHAR_ART`. Un test vérifie que le SVG de chaque personnage existant est identique, au caractère près, avant et après. Chaque île ajoute ses 4 dessins dans `characters-art-saison3.js`, et ne touche à aucun dessin existant.
- **Fonctions de palier des nouveaux jeux** et leurs types : `js/entities/difficulty/rounds-saison3.js`, réexporté par `js/entities/difficulty/index.js` ; créé par la première track qui en a besoin. La PR qui le crée exporte aussi `tierValue` de `difficulty.js` s'il n'est pas déjà exporté (une ligne ; il ne l'est pas au 22/11/2026), pour que `rounds-saison3.js` l'importe ; les tracks suivantes trouvent les deux en place. `LIVES_TABLE`, `GENEROUS_KINDS` et `NO_TIMER_KINDS` restent dans `difficulty.js` (une ligne par jeu).
- **Personnages** : `characters.js` fait 798 lignes, et 20 personnages d'environ 13 lignes l'amènent vers 1060 : il tient, mais chaque île vérifie la marge avant d'ajouter ; si elle manque, ses personnages vont dans `js/entities/character/characters-saison3.js`, fusionné dans `CHARACTERS`.
- **Un fichier de jeu** qui dépasserait 1100 lignes se découpe en fichiers frères dans sa slice (par exemple les banques de textes à part), déclarés dans `js/slices.cjs`, puis `bun run sync`.

## 2 ter. Emojis
Le jeu doit marcher sur les appareils anciens (AGENTS.md) : un emoji trop récent s'y affiche en carré vide. Un emoji ajouté appartient à Emoji 13.1 ou avant (2020), ou figure déjà dans `js/`. Les emojis d'Emoji 14 et 15 (par exemple 🫛, 🪭, 🫙, 🪷, 🫧, 🪸) sont exclus. Règle proposée par Claude le 22/11/2026 : à confirmer par Amrou.

## 2 quater. Tests existants à effectif figé
Trois vérifications existantes comptent le contenu du jeu en dur. Chaque île les met à jour dans sa PR, au titre de la règle « Tests existants touchés par un changement voulu » (`conductor/workflow.md`). Chaque fois, c'est un ajout du même genre que celui des îles précédentes, et aucune vérification n'est affaiblie :
- `test/smoke.test.js`, « personnages : les N ids possèdent un SVG » (vers la ligne 755) : `N` vaut le nombre trouvé sur `main` après le rebase, plus les personnages de l'île (57 + 4 = 61 pour la première île livrée), dans le libellé et dans l'expression.
- `test/squishies.test.js`, « 3 séries au lancement… » (vers la ligne 86) : la série de l'île s'ajoute **à la fin** du tableau attendu, après les séries déjà livrées ; le libellé nomme la nouvelle série.
- `test/squishies.test.js`, « 6 modèles par série (N squishies) » et « noms uniques » (vers les lignes 91 et 107) : `N` augmente de 6, dans le libellé et dans les deux expressions.

Les tests qui comptent les cases d'un écran (`16` manquants, `3` rangées, `12` emplacements) ne voient que les séries débloquées de leur scénario : une nouvelle île ne les change pas. `test/niveaux.test.js` (19 niveaux, `8,6,5`) reste vrai, car la saison 3 garde 5 îles. Règle proposée par Claude le 22/11/2026 : à confirmer par Amrou.

## 3. Features
- [ ] `js/shared/styles/design-system-v21.css` (ou une feuille de la slice île) : le thème `body[data-world="<ile>"]{--world-sky:…; --world-sea:…}`.
- [ ] `js/features/island/island.js` : son paysage dans `ISLE_SCENERY.<ile>`.
- [ ] `js/features/story/story.js` : son chapitre `STORY.<ile>` (guide, 3 phrases d'intro, au moins 2 énigmes en emojis avec un `tip`, succès, récompense). Une île de la saison 2 montre Grisou, qui reprend des couleurs quand son énigme est résolue.
- [ ] `js/entities/squishy/squishies.js` : la série de squishies gagnée par son énigme, dans `SQUISHY_ISLAND_SERIES.<ile>` (et sa propre série dans `SQUISHY_SERIES` / `SQUISHIES` si le monde en a une, v53).
- [ ] `js/features/story/episodes.js` : ses 3 épisodes `EPISODES.<ile>` (racontés par les autres habitants, jamais par le guide).
- [ ] `js/features/music/music.js` : son thème `MUSIC_THEMES.<ile>`.
- [ ] Ses mini-jeux éventuels : voir [checklist-mini-jeu.md](./checklist-mini-jeu.md).

## 4. Brancher et vérifier
- [ ] `bun run sync` si des fichiers ont été ajoutés ; un nom exposé s'ajoute à l'`index.js` de sa slice.
- [ ] `bun run check` vert.
- [ ] Cache `sw.js` incrémenté, PRD et TODO à jour.
