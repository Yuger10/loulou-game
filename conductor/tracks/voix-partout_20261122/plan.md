<!-- Gabarit cothon 0.4.0 (setting-up-docs), adopté dans Conductor. -->
# Plan : une voix partout

Spec : [spec.md](spec.md). Quatre PR, chacune complète et en production une minute après son merge. Les phases 1 à 3 se livrent par `bun run release patch "…"`, la phase 4 par `bun run release track "une voix partout"`. Chaque PR : tests d'abord, `bun run check` puis `bun run verify` verts, aucun test existant modifié pour passer, corps avec `agent-generated: true`, étiquette `agent`, zones sensibles citées. [voix-naturelle](../voix-naturelle_20261122/plan.md) attend la phase 1.

## Tâches

### Phase 1 : la file de parole (PR 1, « file de parole : les phrases ne se coupent plus »)

- [x] 1.1 Test d'abord : `test/voix-file.test.js` (dont la ligne 8 avec un faux `navigator.userActivation`, sans toucher aux tests existants). Faux `speechSynthesis` qui gère `speaking`, `cancel()` et déclenche `end` à la demande du test ; prouve les lignes 1 à 9 de la spec. Échoue avant 1.3.
- [x] 1.2 Test d'abord : dans `test/voix-file.test.js`, aucun fichier de `js/` hors `js/shared/ui/voice.js` ne contient `speechSynthesis` (ligne 7).
- [x] 1.3 `js/shared/lib/spoken.js` : `EMOJI_WORDS`, `emojiWord`, `elide`, `toSpoken` déplacés tels quels de `js/shared/ui/voice.js:5-68` (`node test/tools/move.js`) ; exportés par `js/shared/lib/index.js` ; `voice.js` les importe et réexporte `emojiWord` (API inchangée). Déclarer le fichier dans la slice `shared-lib` de `js/slices.cjs`, puis `bun run sync`.
- [x] 1.4 `js/shared/ui/voice.js` : file (D11), `speak(text, opts)` avec `interrupt` et `demand`, `stopSpeech()`, `newVoiceScene()`, `playItem(item, done)` (Web Speech, `end` et `error` font avancer la file, `setVoiceDuck` comme aujourd'hui) ; règle du premier geste par `navigator.userActivation` seulement (D12, ligne 8), sans écouteur `pointerdown` ni `keydown`.
- [x] 1.5 Appels : `closeModal` (`js/shared/ui/modal.js:66`), `js/features/settings/settings.js:110`, `js/features/profile/topbar.js:23`, `js/features/island/island-view.js:372` passent à `stopSpeech()` ; `#rest-skip` (`js/features/rest/rest.js:444-452`) appelle `stopSpeech()` puis dit sa phrase avec `interrupt` ; `openModal`, `closeModal`, `switchView` (`js/shared/ui/views.js:25`), l'écran titre, l'accueil et `renderVeil` (`js/features/rest/rest.js:208`) appellent `newVoiceScene()` (zone sensible : pause). `forgetSpokenHint` reste branché par le moteur (`js/features/minigame-engine/engine.js:561-563`) : aucun déplacement, la ligne 9 est couverte par un test.
- [x] 1.6 Options de chaque appelant selon la table « Appelants de `speak` » de la spec (`demand`, `interrupt`) ; `calendar.js:70` : `speak(…)` direct, sans `setTimeout`.
- [x] 1.7 `bun run typecheck` (tout `js/` en strict) puis `bun run check` verts, types de la table « Types » de la spec écrits ; PR 1 (zone sensible : aucune ; `island-view.js` « Pas maintenant »).

### Phase 2 : écouter au doigt, et la garde (PR 2, « tout texte s'écoute d'un toucher »)

- [x] 2.1 Test d'abord : `test/voix-ecrans.js` (scénarios et `COVERS`) et `test/voix-partout.test.js` (lignes 10 à 18 et 23 à 27). Scénarios de cette phase : écran titre, accueil, les 5 vues (`carte`, `ile`, `sac`, `marche`, `reglages`), dialogue d'un personnage, offre de Zap, magasin de décos, choix d'un jeu, chaque jeu de `GAME_LIST` au palier 1 (rendu initial), victoire, échec, indice, missions, équipe, chambre à squishies (3 onglets), histoire, journal, cadeaux, cadeau de saison, final, pause (début, activité, « À demain ! »), porte des parents, tour de jeu et course à plusieurs. `COVERS` liste chaque fonction qui appelle `openModal(` (inventaire par `acorn`, ligne 24) sauf la table X. Inclut le test de l'arbitrage `data-voix="lire"` inactif (muet au toucher) et la liste permise littérale de la ligne 25b. Colonne `auto` (ligne 19) : pour un écran hors table O, elle contient les phrases automatiques existantes, inchangées ; toute nouvelle phrase automatique passe par la table O. Un scénario par onglet du marché (Vendre, Échanger, Fusionner, Acheter, dont la boîte de squishies et l'échange de doubles), pour que la garde voie les boutons rendus après l'ouverture (« Il manque des objets », `js/features/market/market.js:302`).
- [x] 2.2 `js/shared/ui/listen.js` (slice `shared-ui`) : `listenText(el)`, écouteur délégué en capture (D5, D6, règles de l'écouteur), classe `voix-lu` ; `js/shared/styles/voice.css` (D8, D10) déclaré dans `CSS_ORDER` de `js/slices.cjs` ; `bun run sync`. `voice.css` porte la taille du 🔈 (D8) ; `width` et `height` retirés de `js/features/bag/bag.css:50-60`.
- [x] 2.3 `js/shared/ui/handlers.js` : pose `data-act` sur un élément non actif qui reçoit un handler `click` (et l'enlève avec le handler) ; test ajouté dans `test/handlers.test.js` (ajout seulement).
- [x] 2.3b Audit de la table A de la spec : les 14 `addEventListener('click'` marqués `setHandler` y passent ; test de la ligne 25b avec la liste permise (3 lignes « gardé »).
- [x] 2.4 `bindSpeakButtons` restreint (ligne 14) : corrige les cartes de la pause (`js/features/rest/rest.js:220`).
- [x] 2.5 Boutons inactifs : chaque ligne « `aria-disabled` + table R » de la table I (marché, magasin de décos, équipe, chapitres du journal) ; leurs handlers ignorent le toucher quand `aria-disabled` vaut `true` ; règle CSS `[aria-disabled="true"]` ajoutée à côté de `.btn-small:disabled`, `.btn-craft:disabled` et `button:disabled` (`js/features/market/market.css:69`, `132`, `js/shared/styles/design-system-v21.css:263-264`, `js/shared/styles/pointer-v13.css:31-34`). Sélecteurs `:active` et `:hover` complétés par `:not([aria-disabled="true"])` (`pointer-v13.css:40`, `51`, `board-v21.css:184`, D7). Les six assertions de D24 (`test/companions.test.js:456`, `test/saison2.test.js:641`, `test/squishies.test.js:691`, `699`, `726`, `test/smoke.test.js:303`) passent de `.disabled` à `getAttribute('aria-disabled') === 'true'` (ou `!== 'true'` pour une négation), dans la même PR ; aucune autre.
- [x] 2.5b Étiquette du champ prénom du formulaire des joueurs (ligne 25) : `aria-label="Prénom"` (`js/features/players/profiles-ui.js:208`). `#gate-in` n'est pas touché : il a déjà son `label for` (`js/features/parents/parents.js:145-146`).
- [x] 2.6 `showToast(msg, say?)` parle (ligne 18, table D) ; `engine.js:177` passe la forme dite de « Dernier essai ! ». Chaque appel de la table T est traité : `''` pour les toasts muets, rien pour ceux qui parlent.
- [x] 2.7 Exceptions des jeux de lecture : `data-voix="lire"` sur le mot et les choix écrits de `reading` (`reading.js:56`, `59`) et sur les choix d'articles de `grammar` (`grammar.js:72`).
- [x] 2.8 Porte des parents : « C'est pour les adultes. » et `data-voix="muet"` sur la question de calcul (ligne 16).
- [x] 2.9 `conductor/checklist-mini-jeu.md` et `conductor/checklist-ile.md` : ligne « un nouvel écran ajoute son scénario dans `test/voix-ecrans.js` ; un choix écrit pose `data-say` ; jamais `disabled` hors réponse neutralisée » ; `AGENTS.md` (Conventions : écoute au doigt, `stopSpeech`, `data-voix="lire"`).
- [x] 2.10 `bun run typecheck` puis `bun run check` verts (`listen.js`, `isActive`, `listenText` et `data-act` typés selon la spec) ; PR 2 (zones sensibles : pause, porte des parents, règle d'interaction).

### Phase 3 : lire à l'ouverture, hors mini-jeux (PR 3, « chaque écran se présente »)

- [x] 3.1 Test d'abord : colonne `auto` des scénarios selon la table O (ligne 19), 🔈 de la victoire, de l'échec et de l'indice (ligne 21), 🔈 des cartes du choix d'un jeu (ligne 22).
- [x] 3.2 Phrases d'ouverture de la table O : accueil, vues, intro de l'île une fois par île et par session, offre de Zap, « À demain ! » rouvert endormi. Écran titre : `showSplash()` pose le `data-say` du `h1` (table O).
- [x] 3.3 🔈 de la victoire et de l'échec (relisent la phrase dite, `engine.js:395`, `495`), de la bulle d'indice, des cartes du choix d'un jeu. Le choix d'un jeu enveloppe chaque carte dans `div.game-choice-wrap` (ligne 22).
- [x] 3.4 `bun run check` vert ; PR 3 (zone sensible : pause).

### Phase 4 : les mini-jeux (PR 4, livrée par `bun run release track "une voix partout"`)

- [x] 4.1 Test d'abord : pour chaque jeu de la table J, au palier 1 et au palier 5, les choix sont dits après la consigne à la première question avec `voix-lu`, pas aux suivantes, et le 🔈 de la consigne relit consigne puis choix (ligne 20) ; états de `rhythm` et `simon` dits à chaque changement.
- [x] 4.2 `data-voix="choix"` et `data-say` sur les choix (dont les saisons de `calendar`, dont le `speak` de `calendar.js:70` est retiré) (formes dites de la table J) ; `bindQuit` met les choix en file après la consigne à la première question et rebranche le 🔈 de la consigne (mécanisme unique de la ligne 20). `resetChoicesRead()` dans `screen.js`, appelé par `engine.js:347` (`playGame`), `385` (`onMissionFail`), `439` (`onMissionWin`), `563` (`onModalClose`), pas par `scheduleRetry` (ligne 20).
- [ ] 4.3 Docs : `conductor/product-guidelines.md` (« Toute phrase importante est lue » devient la règle D1), section du PRD.
- [ ] 4.4 `bun run check` et `bun run verify` verts ; PR 4.
- [ ] 4.5 👤 S5 à S9 sur les appareils de la famille, après le merge ordonné par Amrou.

## Preuves

| Ligne du smoke test | Résultat | Niveau | Preuve |
|---|---|---|---|
| S1 | à faire | test-verified | `bun run test voix-file` (exit 0) |
| S2 | à faire | test-verified | `bun run test voix-partout` (exit 0), ligne « voix : N scénarios, M textes, 0 sans voix » |
| S3 | à faire | test-verified | sortie du test en échec jointe à la PR 2 |
| S4 | à faire | test-verified | `bun run check` (exit 0) |
| S5 à S9 | à faire | runtime-verified | compte rendu d'Amrou |

## Journal de décisions

| # | Décision | Décidé par | Pourquoi | Preuve | Résultat |
|---|---|---|---|---|---|
| 1 | La garde arrive en phase 2 avec l'écouteur délégué, pas avant | spec | une garde stricte sans le mécanisme échouerait sur tout le jeu ; avec lui, elle passe dès la phase 2 et ne s'assouplit jamais | spec D5, D16 | gardée |

## Écarts et non vérifié

- Non vérifié : qu'iOS refuse la synthèse vocale avant un geste (page officielle trouvée pour les médias seulement) : S8.
- Non vérifié : la réussite d'une enfant de 6 ans avec le 🔈 de 56 px à côté d'un bouton : S5.
