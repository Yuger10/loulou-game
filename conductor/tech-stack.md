# Tech Stack

## Langages et runtime
- **HTML5 / CSS3 / JavaScript en modules ES natifs** (v54), sans framework, sans bundler et sans build pour le jeu.
  - `index.html` charge un seul `<script type="module" src="js/app/main.js">`.
  - Chaque fichier importe ce qu'il utilise ; aucune variable globale.
  - `js/package.json` déclare `"type": "module"` (pour Node).
- **Servir en `http://localhost` ou `https://`** : ouvert depuis le disque (`file://`), le jeu ne charge pas ses modules, car les navigateurs l'interdisent. En local : `bun run start`.
- **Aucune dépendance d'exécution.** Les dessins sont en SVG et en emojis, les sons en Web Audio, la voix passe par `speechSynthesis`.
- **Pause (v64) :** `js/features/rest/` : voile qui rend `#app` inerte quand `pauseDue()` (règle dans `features/parents`) ; `game:after` (fin de mission, moteur), `onViewChange` (shared/ui/views), cartes de l'espace parents par l'événement `parents:cards`.
- **Navigation (v61) :** les Réglages sont une vue (`registerView('reglages')`, `js/features/settings/`) ouverte par l'avatar ; la barre du bas a une seule feuille de tailles, `js/shared/ui/nav.css` ; `setNavLabel` (shared/ui/views) permet à une feature de nommer un bouton de la barre.
- **Formulaires (v59) :** `formSheet` / `bindForm` (`js/shared/ui/form.js`) pour tout formulaire en fenêtre ; `askConfirm` (`js/shared/ui/confirm.js`) remplace `confirm()` ; les gestes de fermeture passent par `requestCloseModal` (garde `setModalCloseGuard`). `form.css` est chargée en dernier.
- **Son (v56) :** un seul `AudioContext` et un bus principal dans `js/shared/ui/sound.js` (volume général, réduction pendant la voix, limiteur, écho doux). Les sons passent par `playSound(clé)` (palette « marimba doux », `SOUND_PALETTE`), les notes exactes par `playNote`, la musique se branche sur `musicBusNode()`. Les tests utilisent `test/tools/fake-audio.js`.

## Architecture : feature slices (v51) en modules ES (v54)
> Décisions et options écartées : [ADR 0001](../docs/adr/0001-architecture-feature-slices.md) (slices) et [ADR 0002](../docs/adr/0002-modules-es-natifs.md) (modules ES, couches sans cycle).

- **4 couches**, de la plus haute à la plus basse : `app` → `features` → `entities` → `shared`, dans `js/<couche>/<slice>/`. Le CSS d'une slice est rangé à côté de son JS.
- **Manifeste `js/slices.cjs`**, lu par les outils seulement (d'où le `.cjs`). Il donne :
  - la couche de chaque slice et ses fichiers JS et CSS ;
  - **l'ordre des slices, de bas en haut** : une slice n'importe que celles placées avant elle ;
  - `CSS_ORDER`, l'ordre global de la cascade.

  `index.html` et la liste `FILES` de `sw.js` en sont générés (`bun run sync`, ou `bun run sw`).
- **API publique = l'`index.js` de chaque slice**, qui réexporte ce que les autres slices ont le droit d'importer.
- **Règles vérifiées par `test/slices.test.js`, sur les `import`** :
  - entre slices, seulement l'`index.js` ;
  - une couche n'importe que sa couche ou les couches inférieures, et seulement des slices placées avant elle ;
  - aucun cycle d'import entre slices (graphe d'esbuild) ;
  - aucun nom utilisé sans import ;
  - aucune écriture sur `window` / `globalThis` / `self` ;
  - un seul fichier définit chaque nom ;
  - manifeste, fichiers, `index.html` et `sw.js` cohérents.
- **Dépendances vers le haut interdites.** Deux moyens les remplacent :
  - **des points d'accroche** fournis par la couche basse : `registerGame`, `registerView`, `onModalOpen` / `onModalClose`, `onWrongFeedback`, `onProfileRefresh`, `setAudioPrefsSource`, `setCompanionDressing`, `setSaveSlot`, `setCompanionPlayerSource`, `setHintCountable` ;
  - **un petit bus d'événements** (`js/shared/lib/events.js` : `on`, `off`, `emit`) : `ui:…` pour redessiner, `nav:…` pour ouvrir un écran, et des événements de domaine (`world:changed`, `lagon:rendered`…).
- **Une variable n'est réaffectée que par son fichier** ; les autres passent par une fonction (`setCurrentWorld`, `replaceState`…).
- **Pas de garde `typeof fn==='function'`** pour une fonction du jeu (tout est toujours chargé). Seules les capacités du navigateur sont testées ainsi.

## Plateforme
- **PWA :** `manifest.json` et `sw.js`, avec un cache versionné `lagon-vNN`.
  - Depuis la v66, le numéro vient de `APP_VERSION` (`js/shared/lib/version.js`) : `bun run sync` l'écrit dans `sw.js`. L'espace parents l'affiche, avec un bouton « Chercher une mise à jour » (`js/features/update`).
  - Stratégie : réseau d'abord, cache si pas de réseau. Les fichiers du jeu sont redemandés au site avec `cache:'no-cache'` (réponse 304 s'ils n'ont pas changé), et le précache de l'installation prend `cache:'reload'` : une nouvelle version ne garde jamais d'anciens modules du cache HTTP du navigateur.
  - La liste `FILES` (tous les modules, leurs `index.js`, `main.js` et les feuilles de style, précachés pour le hors-ligne) est générée depuis le manifeste (`bun run sw`), et `test/slices.test.js` la vérifie.
  - La version (donc le cache) doit être incrémentée à chaque livraison.
- Servi en local (`bun run start` → `python3 -m http.server 8080`). En ligne sur GitHub Pages en `https://` (https://yuger10.github.io/loulou-game/), déployé depuis `main`.

## Données
- **`localStorage`**, une sauvegarde par profil (`profileSaveKey(id)`) et la liste des profils (`PROFILES_KEY`).
- **Sauvegarde versionnée :** `SAVE_VERSION` dans `js/entities/game-state/state.js`. Toute nouvelle donnée d'état passe par `DEFAULT_STATE`, l'objet `state` et une étape `migrate()` (`if(v < N)`).
- **Sauvegarde et restauration :** `js/features/backup/backup.js` (fichier, code de transfert `LAGON1:`). La restauration repasse par `load()`, donc par `migrate()`.
- **Contenu de jeu** déclaratif dans les entités (`js/entities/item/items.js`, `character/characters.js`, `world/worlds.js`, `squishy/squishies.js`) et dans `js/features/story/` (`STORY`, `EPISODES`).

## Tests
- **`bun run check`** → `test/slices.test.js` (architecture et imports), `test/modules.test.js` (v54 : les vrais modules ES chargés dans Node, dans l'ordre du navigateur et en mode strict), `test/smoke.test.js` (test de fumée jsdom : parcours, sauvegarde, anti-devinette, CSS équilibré, aucune erreur JS) `test/games.test.js` (chaque mini-jeu joué jusqu'à la victoire) `test/squishies.test.js` (v53 : collection, tirage, chambre, rangement, marché), `test/saison2.test.js` (v55 : archipels, Monde des Boîtes, gigognes, cubes, histoire), `test/jouets.test.js` (v58 : le Coffre aux Jouets Doux, les paquets de jouets, l'étagère magique), `test/bonbons.test.js` (v60 : le Royaume des Bonbons, le gâteau partagé, la recette), `test/musique.test.js` (v62 : l'Île de la Musique, le rythme magique, grave ou aigu), `test/jardin.test.js` (v63 : le Jardin des Fées, de la graine à la fleur, les coccinelles), `test/update.test.js` (v66 : la version du jeu, le bouton de mise à jour, le service worker), `test/licornes.test.js` (v65 : le Monde des Licornes, les potions, le miroir, le grand final de la saison 2), `test/niveaux.test.js` (le tableau de référence `conductor/niveaux.md`, les niveaux de `WORLDS` et ceux des specs disent la même chose) et `test/companions.test.js` (v52 : indices de chaque mini-jeu, équipe, spécialités). La page de test est construite par `test/tools/page.js` : esbuild regroupe `js/app/main.js` en un script (mode strict, sans *tree shaking*), que jsdom exécute. Les tests lisent ainsi l'état du jeu par son nom (`state`, `playGame(…)`).
  - *Note du 2026-11-09 (v54) :* ajout d'`esbuild` (dépendance de développement, jamais chargée par le jeu) pour les tests, comme prévu par la track `refactor-esm-modules`. Ce regroupement change `const`/`let` en `var` : `test/modules.test.js` couvre donc l'ordre d'initialisation réel. Tests sous Node 22.
- **Lint : oxlint** (factory, phase 1 ; stack de référence cothon), version exacte dans `package.json`, règles dans `.oxlintrc.json` : catégories `correctness` et `suspicious` en erreur, `--deny-warnings`. Quelques règles de style sont désactivées, chacune avec sa raison dans le fichier (dont `onclick =`, l'idiome du projet, et `toSorted`, trop récent pour les vieilles tablettes). Une variable lue seulement par les tests, par son nom, porte `// oxlint-disable-next-line no-unused-vars -- lu par les tests`. `bun run check` lance le lint en premier (33 ms).
- **Contexte des agents (factory, phase 1) :** `AGENTS.md` est la source unique (moins de 150 lignes, standard ouvert lu par Claude Code, Codex, Cursor…) ; `CLAUDE.md` contient seulement `@AGENTS.md`. `bun run docs` (`test/tools/check-docs.sh`, repris du skill `cothon:setting-up-docs`, 0,3 s, dans `check`) vérifie la taille d'`AGENTS.md`, l'import dans `CLAUDE.md`, les commandes citées, la présence d'un ADR et les liens internes de tous les `.md`.
- **Format : oxfmt** (factory, phase 1, étape 5 ; stack de référence cothon), version exacte, `.oxfmtrc.json` : largeur 120, guillemets simples en JS, doubles en CSS ; `sw.js` et `index.html` exclus (générés par `bun run sync`). `bun run format` met en forme `js/` et `test/` ; `bun run lint` vérifie le format. Le reformatage initial est dans `.git-blame-ignore-revs` (`git config blame.ignoreRevsFile .git-blame-ignore-revs`).
- **Retour rapide (factory, phase 1, étape 4) :** deux boucles, toutes deux limitées au lint (environ 30 ms) ; les tests restent dans `bun run check`.
  - **Agent :** hook Claude Code `PostToolUse` (`.claude/settings.json`, script `.claude/hooks/lint-edited-file.sh`, repris du skill `cothon:wiring-fast-feedback`) : après chaque `Edit` ou `Write` d'un fichier JS, oxlint le vérifie et renvoie les erreurs à l'agent (code de sortie 2), qui corrige aussitôt. Formate aussi le fichier avec oxfmt (118 ms en tout).
  - **Humain :** lefthook (`lefthook.yml`), installé par `bun install` (script `prepare`) : les fichiers JS et CSS indexés sont mis en forme (oxfmt, `stage_fixed`), puis le commit est refusé si oxlint signale un fichier JS.
- **Lanceur de tests (factory, phase 1) :** `bun run test` lance `test/tools/run.js`, qui trouve tout seul `test/*.test.js` (un nouveau fichier n'a rien à déclarer dans `package.json`) et les lance **en parallèle**, un processus Node par suite. Une suite lente déclare `// @shards N` en première ligne et filtre sa grande boucle avec `inShard(liste)` (`test/tools/shard.js`) : elle est découpée en N morceaux. Filtre : `bun run test jardin`. Durée : 18 s sur 10 cœurs, 34 s sur 4.
- **Paquets et scripts : bun** (factory, phase 1 ; stack de référence cothon). Version épinglée par `packageManager` dans `package.json`, `bun.lock` commité, `bun install --frozen-lockfile` en CI. npm, yarn et pnpm sont refusés : `bun run check` échoue si leur lockfile réapparaît (`test/tools/lockfile.js`). Le **runtime reste Node** : les tests se lancent avec `node`. Mesures : `docs/factory/SPEED.md`.
- Dépendances de développement : `jsdom` (exécuter le jeu), `esbuild` (regrouper les modules pour les tests, v54), `acorn` et `acorn-walk` (analyser le code : imports, inventaire, test de frontières). Aucune n'est chargée par le jeu.
  - *Note du 2026-11-09 :* ajout d'`acorn` pour la track `refactor-feature-slices` : un analyseur sans dépendance, plus fiable que des expressions régulières pour distinguer le code des textes.

## Outillage
- Git et GitHub (`gh`) : une branche par version, une PR, un merge sur `main`.
