<!-- Gabarit cothon 0.4.0 (setting-up-docs), adopté dans Conductor (cothon 0.2.0-2 et 0.4.0-6). -->
# Plan : les boîtes de rangement durables de la chambre à squishies

Spec : [spec.md](spec.md)

Deux phases, **une PR chacune**, chacune livrable seule (chaque merge est en production une minute après). L'ancienne phase 0 (dessins dans `squishy-art.js`) est faite par main (v66.9). La phase 1 ne change rien à l'écran ; tout ce qui se voit arrive ensemble en phase 2. Avant chaque PR : rebase sur `main`, `bun run check` (sortie 0), `bun run verify`.

## Tâches

### Phase 1 : l'état et la logique des boîtes (PR 1, rien de visible, zone sensible)

Tests d'abord, dans un nouveau fichier `test/squishy-boites.test.js` (harnais copié des lignes 1 à 75 de `test/squishies.test.js` : jsdom, temps ×0,1, voix notée dans `spoken`, `ev`, `check`, `setOwned`).

- [ ] 1.1 Tests (rouges) de l'état neuf et de la migration : spec 1, 2 (une sauvegarde `v: SAVE_VERSION - 1` sans `crates` passée à `migrate()`, puis par le vrai `load()`).
- [ ] 1.2 Tests (rouges) de `cleanSquishyCrates` dans `readSave` (spec D18), sur le modèle de `test/parties-importees.test.js` (une partie abîmée posée dans le stockage avant le démarrage, puis lue) : spec 3 à 11 et 11b (holdout : `crates` absent reste absent après `readSave`), un cas par ligne (dont une boîte `label: null` avec des éléments et `done: true`, qui ressort `{ label: null, items: [], done: false }`), plus un cas « tout à la fois » qui vérifie l'ordre de nettoyage des Politiques, et un cas par `readSave` directe (`ev('readSave(...)')`). Spec 3 aussi par `applyBackup` d'une sauvegarde construite à la main avec `crates: "abîmé"` : aucune erreur dans `errs`.
- [ ] 1.3 Test (rouge) d'aller-retour : spec 12, par fichier et par code `LAGON1:` (même méthode que `test/squishies.test.js:189-214`).
- [ ] 1.4 Tests (rouges) de la logique : spec 13 à 24 (âge réglé par `currentProfile().age`, que `crateAdd` lit par `currentPlayerAge()`) (`crateAdd`, `crateRemove`, `crateEmpty`, `crateSetLabel`, retours exacts, `state.coins`, longueur de `crates`, `done`), plus l'ordre des refus des Politiques (un cas où deux refus s'appliquent à la fois, pour chaque paire voisine : `bad` avant `nolabel`, `nolabel` avant `full`, `full` avant `none`, `none` avant `wrong`).
- [ ] 1.5 Tests (rouges) des étiquettes : spec 25 à 27 (`crateLabelsFor` dans l'ordre du contrat, `crateLevel`, `crateLabelAllowed`, déblocage après 2 boîtes `done` à 6 ans), `crateLabelValid` sur la grammaire D5 (valides : `fav`, `color:rose`, `series:capy`, `size:petit+color:rose`, `color:rose+shape:rond`, `size:grand+shape:carre` ; invalides : `color:noir`, `color:rose+size:petit` (ordre), `series:capy+color:rose`, `fav+color:rose`, `''`, `42`, `null`), `crateName`, `crateOptionSay` et `crateWrongHint` (textes exacts de D9, D10).
- [ ] 1.6 Tests (rouges) des doubles, de l'étagère et de l'exercice : spec 28 à 31, avec chacun des exemples chiffrés de 28 et 29 et de « Valeurs calculées » ; vérifier que `sortWrongHint("cupcake", [{type:"color", value:"rose"}])` est inchangé.
- [ ] 1.6b Mettre à jour `test/licornes.test.js:499` : `ev('SAVE_VERSION') === 9` devient le nouveau numéro, celui de 1.7 (spec D23) ; aucun autre changement dans ce fichier. Les tests de 1.1 lisent `SAVE_VERSION`, sans numéro en dur.
- [ ] 1.7 `state.js` : `@typedef SquishyCrate` et champ `crates: SquishyCrate[]` dans `SquishyState` (spec D17b) ; `crates` dans `squishyFreshState()` (3 boîtes vides, commentaire de la forme D17) ; `SAVE_VERSION` à la version suivante sur `main` au moment de la livraison ; étape `migrate()` correspondante (D17). Dans le même fichier : `crateLabelValid`, `crateCriteria`, `cleanSquishyCrates` à côté de `cleanSkills`, et l'appel dans `readSave` (seulement si `crates` existe) ; exports dans `game-state/index.js`.
- [ ] 1.8 `squishies.js` (import de `currentPlayerAge` depuis `../../entities/player/index.js` ; `SortCriterion` étendu à `'series'`, `@typedef CrateResult`, spec D17b) : constantes `CRATE_START`, `CRATE_MAX`, `CRATE_SLOTS`, `CRATE_REWARD` ; import de `crateLabelValid` et `crateCriteria` depuis `game-state/index.js` (aucun nettoyage ici, D18) ; fonctions du contrat ; `shelfPlace` et l'état « libre » tiennent compte des boîtes (D4) ; `squishyDuplicates` et `tradeDuplicatesFor` ne prennent que des exemplaires libres ; `squishyStoredDuplicates`. Exporter et ajouter à `index.js` ce que d'autres slices lisent (`squishyStoredDuplicates` pour le marché).
- [ ] 1.9 `bun run check` vert (sortie 0), `bun run typecheck` vert (tout `js/` en strict), sans `any` ni `@ts-ignore` ; les fonctions nouvelles de `squishies.js` annotées (`@param`, `@returns`, `@typedef` du retour de `crateAdd`).
- [ ] 1.10 Livrer : `bun run release patch "squishies : état des boîtes de rangement"`. Corps de PR : zone sensible sauvegarde, `migration: true`, risques (anciennes sauvegardes, import).

### Phase 2 : l'onglet « 🗃️ Mes boîtes » (PR 2, visible)

- [ ] 2.0 Déplacer tels quels `sortIconsHTML` et `squishyPress` de `squishy-room.js` vers `squishy-art.js` : `node test/tools/move.js js/features/squishies/squishy-room.js js/features/squishies/squishy-art.js sortIconsHTML squishyPress`, puis les `import` et `export` (spec D20) ; `bun run test squishies` vert avant toute autre tâche.

- [ ] 2.1 Mettre à jour `test/squishies.test.js:390` en « 4 onglets : Collection, Étagère, Mes boîtes, Ranger », qui vérifie l'ordre (spec D22), et rien d'autre dans ce fichier.
- [ ] 2.2 Tests (rouges) dans `test/squishy-boites.test.js` : spec 32 à 39 (onglets, collection vide, cartes, consignes dites, choix de l'étiquette aux crans 1, 2 et 3 avec les phrases exactes).
- [ ] 2.3 Tests (rouges) : spec 40 à 51, chaque phrase comparée en chaîne exacte à `lastSaid()` et un seul texte noté par événement (politique « Voix ») (toucher puis toucher, case vide, rebond et indice, 3 erreurs qui font briller, boîte pleine, sortir, tout sortir, changer l'étiquette, récompense, retour, persistance après `load()`).
- [ ] 2.4 Tests (rouges) : spec 40 et 55 par le glisser simulé (S5) : `pointerdown` puis `pointermove` à plus de 8 px puis `pointerup` sur le bouton du tapis, avec `d.elementFromPoint = () => d.querySelector('.cb-crate')` ; puis `delete w.PointerEvent` (ou le mettre à `undefined`), rouvrir la boîte et vérifier qu'aucun fantôme n'apparaît et que le toucher puis toucher marche.
- [ ] 2.5 Tests (rouges) : spec 52 à 54 (marque `🗃️` et phrases de la Collection, phrase de l'étagère, message et phrase du marché).
- [ ] 2.6 Test (rouge) de la largeur : spec 56, le test lit le texte de `js/features/squishies/squishies.css` et vérifie `.cb-tray` (`overflow-x: auto`), `.cb-item` (`touch-action: pan-x`), et un `min-width` et un `min-height` d'au moins 64 px pour chaque bouton `.cb-…` (cartes, options d'étiquette, Choisir, Tout sortir, Changer l'étiquette, retour, tapis) ; les onglets `.tab-btn` ne sont pas concernés ; le rendu réel à 360 px est la ligne 👤 S8.
- [ ] 2.7 Créer `js/features/squishies/squishy-crates.js` : `renderSquishyCrates()`, cartes, choix de l'étiquette, boîte ouverte, tapis, toucher puis toucher, glisser (D11 à D13), minuteurs propres effacés par `onModalChange`, garde `typeof window.PointerEvent === 'function'` à créer (D11), tout strictement typé (D17b). Le déclarer dans `js/slices.cjs` (après `squishy-art.js`, avant `squishy-room.js`), puis `bun run sync`.
- [ ] 2.8 `squishy-room.js` : onglet `boites` dans `SQ_TABS` (D2), sa consigne dans `sqRoomHead` (spec 34), appel de `renderSquishyCrates()` ; marque `🗃️` et phrases de la Collection (52) ; phrase de l'étagère (53).
- [ ] 2.9 `market.js` : message et phrase des doubles rangés (54).
- [ ] 2.10 `squishies.css` : styles `.cb-…` (cartes 2 par rangée, boîte 3 × 2, tapis d'une rangée qui défile de côté, `.cb-glow`, `.cb-item.sr-bounce`, fantôme comme `.jg-drag`) ; vérifier 360 px.
- [ ] 2.11 `bun run check` vert (sortie 0) ; vérification manuelle (workflow, fin de phase) : `bun run start`, vue téléphone 360 px, les étapes de S8 à S13.
- [ ] 2.12 Doc : ne pas toucher la spec livrée `squishy-collection_20261109` ; mettre à jour le commentaire d'en-tête de `squishy-room.js` (4 onglets) ; `TODO.md` garde l'idée de mission du jour (D16).
- [ ] 2.13 Livrer : `bun run release track "Squishies : des boîtes de rangement qui restent (idée de la joueuse)"`, compléter la section du PRD (idée de la joueuse visible), PR avec `agent-generated: true` et l'étiquette `agent`.

## Preuves

Chaque affirmation pointe vers une preuve : commande exacte, code de sortie, chemin de la sortie. `build-only` n'est jamais une preuve de comportement.

| Ligne du smoke test | Résultat | Niveau | Preuve |
|---|---|---|---|
| S1 | à faire | test-verified | `bun run test squishies` (exit 0) après chaque phase |
| S2 | à faire | test-verified | `bun run test squishy-boites` (exit 0) |
| S3 | à faire | test-verified | `bun run test squishy-boites` (exit 0) |
| S4 | à faire | test-verified | `bun run test squishy-boites` (exit 0) |
| S5 | à faire | test-verified | `bun run test squishy-boites` (exit 0) |
| S6 | à faire | test-verified | `bun run test squishy-boites` (exit 0) |
| S7 | à faire | test-verified | `bun run check` (exit 0) à chaque phase |
| S8 à S13 | à faire | runtime-verified | compte rendu d'Amrou et de la joueuse dans la PR 2 |

## Journal de décisions

En ajout seul : une décision fausse reçoit une nouvelle ligne qui la remplace, on ne modifie ni ne supprime une ligne.

| # | Décision | Décidé par | Pourquoi | Preuve | Résultat |
|---|---|---|---|---|---|
| 1 | Découpage en 3 PR : déplacement des dessins, état et logique, interface | spec | `max-lines` 1 250 et `import/no-cycle` ; rien de visible à moitié | `.oxlintrc.json:40`, `.oxlintrc.json:44` | remplacée par #2 |
| 2 | Découpage en 2 PR : état et logique, puis interface ; les dessins sont déjà dans `squishy-art.js` (main, v66.9) | spec | `max-lines` 1 100 et `import/no-cycle` ; rien de visible à moitié | `.oxlintrc.json:40`, `.oxlintrc.json:44`, `js/features/squishies/squishy-art.js:19-600` | gardée |

## Écarts et non vérifié

- Non vérifié par un outil : le défilement de côté du tapis avec `touch-action: pan-x` sur l'iPad et les vieux Safari (S12) ; le ressenti des phrases (S11) ; la lisibilité de 4 onglets à 360 px (S8).
