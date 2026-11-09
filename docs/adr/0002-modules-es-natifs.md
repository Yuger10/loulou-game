# ADR 0002 : Passer aux modules ES natifs, sans build, avec des couches sans cycle

- **Statut :** acceptée, livrée en v54 ; complète l'[ADR 0001](./0001-architecture-feature-slices.md) (étape B)
- **Date :** 2026-11-09
- **Décideur :** le propriétaire du projet, par délégation à Claude (track Conductor `refactor-esm-modules`)
- **Spec liée :** [`refactor-esm-modules`](../../conductor/tracks/refactor-esm-modules_20261109/spec.md)

## Contexte
En v53, le jeu compte 75 scripts classiques rangés en 52 slices (ADR 0001, étape A). Ils partagent une seule portée globale.
- **Des frontières de convention :** un fichier peut utiliser n'importe quel nom ; seul un test (`acorn`) vérifie les couches et les API publiques.
- **Un ordre de chargement fragile :** il est figé dans le manifeste, et un appel au chargement vers un fichier chargé plus tard casse le jeu.
- **Des dépendances circulaires** que les modules ES rendraient dangereuses à l'initialisation. Mesurées au début de la track :
  - 5 entités en cycle (état ↔ joueurs ↔ compagnons ↔ îles ↔ objets) ;
  - 19 features en cycle (moteur ↔ île ↔ histoire ↔ quêtes ↔ équipe…).
- **12 écritures d'une variable par un autre fichier** (`currentWorld = …`, `state = …`, `party = …`) : un module ne peut pas réaffecter la variable d'un autre.

## Décision
1. **Modules ES natifs, sans bundler pour le jeu.**
   - `index.html` charge un seul `<script type="module" src="js/app/main.js">`.
   - Chaque fichier importe ce qu'il utilise et exporte ce que les autres lui prennent.
   - `js/package.json` déclare `"type": "module"`.
2. **API publique = `index.js`.**
   - Chaque slice a un `index.js` qui réexporte son API.
   - Entre slices, on n'importe que lui ; dans une slice, on importe le fichier voulu.
3. **Couches sans cycle.**
   - Le manifeste range les slices de bas en haut, et une slice n'importe que celles placées avant elle :
     - entités : words < squishy < game-state < item < character < world < difficulty < companion < player < season ;
     - features : wallet < gains < screen < hints < adaptive < … < island < companion-team < map < minigame-engine < mini-jeux < market < backup < players < parents.
   - Pour remonter d'une couche, deux outils :
     - **un petit bus d'événements** (`js/shared/lib/events.js` : `on`, `off`, `emit`) :
       - `ui:…` pour redessiner (`ui:lagon`, `ui:profile`, `ui:map`, `ui:backup-reminder`) ;
       - `nav:…` pour ouvrir un écran (`nav:game-picker`, `nav:player-settings`, `nav:dialogue`, `nav:parents`) ;
       - des noms de domaine pour ce qui vient de se passer (`world:changed`, `lagon:rendered`, `bag:tab`) ;
       - des demandes au moteur (`game:start`, `game:bonus`, `game:before`, cette dernière pour la pause douce) ;
     - **des points d'accroche** quand une couche basse a besoin d'une fonction : `setSaveSlot` (la clé de sauvegarde du joueur), `setCompanionPlayerSource`, `setHintCountable`.
4. **Le code est rangé à la bonne hauteur.**
   - En features :
     - l'en-tête des fenêtres (`gameHeader`, `bindQuit`) forme la slice `screen` ;
     - les indices forment la slice `hints` ;
     - le jeu en cours, le défi bonus et l'enregistrement des progrès vont dans `adaptive`.
   - En entités :
     - les fêtes et la saison du moment forment l'entité `season` ;
     - `SQ_COLORS` va dans l'entité `squishy` ;
     - `GAME_LIST` va dans `difficulty`.
5. **Une variable n'est réaffectée que par son fichier.** Les autres passent par une fonction : `setCurrentWorld`, `replaceState`, `setParty`, `setRace`, `ensureAudioCtx`, `addCoinsInFlight`, `setLastGame`…
6. **Tests.**
   - La page de test regroupe `main.js` avec **esbuild** (dépendance de développement seulement), en mode strict, sans *tree shaking*.
   - Comme chaque nom de haut niveau est unique, esbuild n'en renomme aucun. Les tests lisent et règlent donc l'état par son nom, comme avant.
   - esbuild change `const`/`let` en `var`. Pour cette raison, **`test/modules.test.js` charge les vrais modules dans Node** (jsdom pour le DOM) : même ordre d'initialisation et même mode strict que le navigateur.
   - `test/slices.test.js` vérifie sur les `import` :
     - seulement les `index.js` entre slices ;
     - les couches et l'ordre du manifeste ;
     - aucun cycle (graphe d'esbuild, `metafile`) ;
     - aucun nom utilisé sans import ;
     - aucune écriture sur `window` / `globalThis` / `self`, et aucune garde `typeof fn === 'function'`.

     Il contient aussi six cas fautifs fabriqués, qui doivent échouer.
7. **Service worker.**
   - `npm run sw` (comme `npm run sync`) régénère `FILES` depuis le manifeste : modules, `index.js`, `main.js` et feuilles de style.
   - Le test compare `sw.js` à cette liste.

## Options envisagées
| Option | Pour | Contre | Verdict |
|---|---|---|---|
| **Passerelle `globalThis`** (chaque module republie ses noms, puis on remplace les globales couche par couche), prévue par la spec | Petites étapes | Les globales seraient des copies, pas des liaisons vivantes : `state = …` dans un fichier ne serait pas vu par les autres. Il faudrait des accesseurs partout, pour un état intermédiaire jeté ensuite | **Écartée** : l'analyse `acorn` de l'étape A sait déjà, pour chaque fichier, quoi importer et d'où. La conversion a été faite d'un coup, par un script, après avoir rendu le graphe acyclique en scripts classiques, tests verts à chaque étape |
| **Tolérer les cycles entre features** (les modules les acceptent si rien n'est utilisé au chargement) | Moins de changements | L'ordre d'initialisation dépend alors du premier import : un mini-jeu s'inscrivait avant le moteur (constaté au premier essai) | Écartée |
| **Fusionner les slices trop liées** | Supprime des cycles | Des slices fourre-tout, à l'opposé de l'ADR 0001 | Écartée (seuls quelques noms ont changé de slice) |
| **Bundler pour le jeu** (Vite, esbuild) | Un seul fichier | Build et `dist/` à publier, contraire à « sans build » | Écartée (comme dans l'ADR 0001) |
| **Tests en modules natifs uniquement** | Fidèle au navigateur | Les ~560 vérifications existantes lisent l'état interne par son nom (`state`, `playGame(…)`) | Combinée : regroupement esbuild pour ces tests, plus un test des vrais modules |

## Conséquences
**Positives**
- **Frontières réelles :** un fichier ne voit que ce qu'il importe. Dans le navigateur, aucune variable du jeu n'est globale (vérifié dans Chromium).
- **Dépendances explicites et à sens unique :** le graphe des slices est acyclique, et le manifeste dit dans quel ordre elles se superposent.
- **Ordre de chargement sûr :** une slice s'initialise toujours après celles qu'elle utilise.
- **Aucune réécriture de la logique des jeux** et aucun changement pour l'enfant. Les sauvegardes sont inchangées (`SAVE_VERSION` 5).
- `npm run api` n'existe plus : exposer un nom, c'est l'ajouter à l'`index.js` de sa slice.

**Négatives et risques acceptés**
- **Plus de requêtes :**
  - 129 modules au lieu de 75 scripts, à cause des `index.js` et de `main.js` ;
  - acceptable en HTTP/2 (GitHub Pages) et avec le cache hors-ligne, qui précache tout (192 fichiers) ;
  - à mesurer sur un vrai appareil. On pourra regrouper si le premier chargement devient lent.
- **`file://` ne marche plus :** les navigateurs refusent les modules ouverts depuis le disque. Il faut `npm start` (`http://localhost:8080`) ou le site en ligne.
- **Un événement ne se suit pas dans l'éditeur comme un appel de fonction.** Ils sont peu nombreux, nommés par famille et documentés ici et dans `events.js`.
- **Nouvelle dépendance de développement :** `esbuild` (jamais chargée par le jeu). Tests sous Node 22.
- **Restent 5 petites boucles entre deux fichiers d'une même slice** (`profiles` ↔ `party-state`, `island-view` ↔ `island`…). La spec les permet, et `test/modules.test.js` vérifie qu'elles ne gênent pas l'initialisation.

## Validation
- `npm test` : architecture, vrais modules, fumée, 123 squishies, 284 jeux, 127 compagnons.
- Une erreur d'ordre d'initialisation, provoquée volontairement, est bien attrapée par `test/modules.test.js`. Le regroupement esbuild, lui, ne la voit pas.
- Chromium :
  - parcours au doigt (écran titre, accueil, île, mini-jeu et indice, chambre à squishies, Sac, marché, missions, histoire, joueurs, porte des parents, rechargement) sans erreur JS, aussi en émulation Pixel 7 et iPhone 13 ;
  - hors-ligne : 192 fichiers en cache, et le jeu démarre sans réseau.
- **À faire par le propriétaire :** essai sur un vrai iPhone (Safari) et un vrai téléphone Android. L'émulation utilise le moteur de Chromium.
