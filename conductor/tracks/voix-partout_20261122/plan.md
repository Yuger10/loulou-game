<!-- Gabarit cothon 0.4.0 (setting-up-docs), adopté dans Conductor. -->
# Plan : une voix partout

Spec : [spec.md](spec.md). Quatre PR, chacune complète et en production une minute après son merge. Les phases 1 à 3 se livrent par `bun run release patch "…"`, la phase 4 par `bun run release track "une voix partout"`. Chaque PR : tests d'abord, `bun run check` puis `bun run verify` verts, aucun test existant modifié pour passer, corps avec `agent-generated: true`, étiquette `agent`, zones sensibles citées. [voix-naturelle](../voix-naturelle_20261122/plan.md) attend la phase 1.

## Tâches

### Phase 1 : la file de parole (PR 1, « file de parole : les phrases ne se coupent plus »)

- [ ] 1.1 Test d'abord : `test/voix-file.test.js`. Faux `speechSynthesis` qui gère `speaking`, `cancel()` et déclenche `end` à la demande du test ; prouve les lignes 1 à 9 de la spec. Échoue avant 1.3.
- [ ] 1.2 Test d'abord : dans `test/voix-file.test.js`, aucun fichier de `js/` hors `js/shared/ui/voice.js` ne contient `speechSynthesis` (ligne 7).
- [ ] 1.3 `js/shared/lib/spoken.js` : `EMOJI_WORDS`, `emojiWord`, `elide`, `toSpoken` déplacés tels quels de `js/shared/ui/voice.js:5-68` (`node test/tools/move.js`) ; exportés par `js/shared/lib/index.js` ; `voice.js` les importe et réexporte `emojiWord` (API inchangée). Déclarer le fichier dans la slice `shared-lib` de `js/slices.cjs`, puis `bun run sync`.
- [ ] 1.4 `js/shared/ui/voice.js` : file (D11), `speak(text, opts)` avec `interrupt` et `demand`, `stopSpeech()`, `newVoiceScene()`, `playItem(item, done)` (Web Speech, `end` et `error` font avancer la file, `setVoiceDuck` comme aujourd'hui), règle du premier geste (écouteurs `pointerdown` et `keydown` en capture, une fois).
- [ ] 1.5 Appels : `closeModal` (`js/shared/ui/modal.js:66`), `js/features/settings/settings.js:101`, `js/features/profile/topbar.js:22`, `js/features/island/island-view.js:363` passent à `stopSpeech()` ; `#rest-skip` (`js/features/rest/rest.js:400-408`) appelle `stopSpeech()` puis dit sa phrase avec `interrupt` ; `openModal`, `closeModal`, `switchView` (`js/shared/ui/views.js:25`), l'écran titre, l'accueil et `renderVeil` (`js/features/rest/rest.js:178`) appellent `newVoiceScene()` (zone sensible : pause). `forgetSpokenHint` reste branché par le moteur (`js/features/minigame-engine/engine.js:517-519`) : aucun déplacement, la ligne 9 est couverte par un test.
- [ ] 1.6 Options de chaque appelant selon la table « Appelants de `speak` » de la spec (`demand`, `interrupt`) ; `calendar.js:65` : `speak(…)` direct, sans `setTimeout`.
- [ ] 1.7 `bun run typecheck` (souple et strict) puis `bun run check` verts, types de la table « Types » de la spec écrits ; PR 1 (zone sensible : aucune ; `island-view.js` « Pas maintenant »).

### Phase 2 : écouter au doigt, et la garde (PR 2, « tout texte s'écoute d'un toucher »)

- [ ] 2.1 Test d'abord : `test/voix-ecrans.js` (scénarios et `COVERS`) et `test/voix-partout.test.js` (lignes 10 à 18 et 23 à 27). Scénarios de cette phase : écran titre, accueil, les 5 vues (`carte`, `ile`, `sac`, `marche`, `reglages`), dialogue d'un personnage, offre de Zap, magasin de décos, choix d'un jeu, chaque jeu de `GAME_LIST` au palier 1 (rendu initial), victoire, échec, indice, missions, équipe, chambre à squishies (3 onglets), histoire, journal, cadeaux, cadeau de saison, final, pause (début, activité, « À demain ! »), porte des parents, tour de jeu et course à plusieurs. `COVERS` liste chaque fonction qui appelle `openModal(` (inventaire par `acorn`, ligne 24) sauf la table X.
- [ ] 2.2 `js/shared/ui/listen.js` (slice `shared-ui`) : `listenText(el)`, écouteur délégué en capture (D5, D6, règles de l'écouteur), classe `voix-lu` ; `js/shared/styles/voice.css` (D8, D10) déclaré dans `CSS_ORDER` de `js/slices.cjs` ; `bun run sync`.
- [ ] 2.3 `js/shared/ui/handlers.js` : pose `data-act` sur un élément non actif qui reçoit un handler `click` (et l'enlève avec le handler) ; test ajouté dans `test/handlers.test.js` (ajout seulement).
- [ ] 2.3b Audit de la table A de la spec : les 14 `addEventListener('click'` marqués `setHandler` y passent ; test de la ligne 25b avec la liste permise (3 lignes « gardé »).
- [ ] 2.4 `bindSpeakButtons` restreint (ligne 14) : corrige les cartes de la pause (`js/features/rest/rest.js:190`).
- [ ] 2.5 Boutons inactifs : chaque ligne « `aria-disabled` + table R » de la table I (marché, magasin de décos, équipe, chapitres du journal) ; leurs handlers ignorent le toucher quand `aria-disabled` vaut `true` ; règle CSS `[aria-disabled="true"]` ajoutée à côté de `.btn-small:disabled`, `.btn-craft:disabled` et `button:disabled` (`js/features/market/market.css:69`, `132`, `js/shared/styles/design-system-v21.css:263-264`, `js/shared/styles/pointer-v13.css:31-34`).
- [ ] 2.5b Étiquettes des champs (ligne 25) : `aria-label="Réponse"` sur `#gate-in` (`js/features/parents/parents.js:135`, zone sensible) et `aria-label="Prénom"` sur le prénom du formulaire des joueurs (`js/features/players/profiles-ui.js:192`).
- [ ] 2.6 `showToast` parle (ligne 18, table D).
- [ ] 2.7 Exceptions des jeux de lecture : `data-voix="lire"` sur le mot et les choix écrits de `reading` (`reading.js:49`, `59`) et sur les choix d'articles de `grammar` (`grammar.js:69`).
- [ ] 2.8 Porte des parents : « C'est pour les adultes. » et `data-voix="muet"` sur la question de calcul (ligne 16).
- [ ] 2.9 `conductor/checklist-mini-jeu.md` et `conductor/checklist-ile.md` : ligne « un nouvel écran ajoute son scénario dans `test/voix-ecrans.js` ; un choix écrit pose `data-say` ; jamais `disabled` hors réponse neutralisée » ; `AGENTS.md` (Conventions : écoute au doigt, `stopSpeech`, `data-voix="lire"`).
- [ ] 2.10 `bun run typecheck` puis `bun run check` verts (`listen.js`, `isActive`, `listenText` et `data-act` typés selon la spec) ; PR 2 (zones sensibles : pause, porte des parents, règle d'interaction).

### Phase 3 : lire à l'ouverture, hors mini-jeux (PR 3, « chaque écran se présente »)

- [ ] 3.1 Test d'abord : colonne `auto` des scénarios selon la table O (ligne 19), 🔈 de la victoire, de l'échec et de l'indice (ligne 21), 🔈 des cartes du choix d'un jeu (ligne 22).
- [ ] 3.2 Phrases d'ouverture de la table O : accueil, vues, intro de l'île une fois par île et par session, offre de Zap, « À demain ! » rouvert endormi.
- [ ] 3.3 🔈 de la victoire et de l'échec (relisent la phrase dite, `engine.js:351`, `450`), de la bulle d'indice, des cartes du choix d'un jeu.
- [ ] 3.4 `bun run check` vert ; PR 3 (zone sensible : pause).

### Phase 4 : les mini-jeux (PR 4, livrée par `bun run release track "une voix partout"`)

- [ ] 4.1 Test d'abord : pour chaque jeu de la table J, au palier 1 et au palier 5, les choix sont dits après la consigne à la première question avec `voix-lu`, pas aux suivantes, et le 🔈 de la consigne relit consigne puis choix (ligne 20) ; états de `rhythm` et `simon` dits à chaque changement.
- [ ] 4.2 `data-voix="choix"` et `data-say` sur les choix (formes dites de la table J) ; `bindQuit` met les choix en file après la consigne à la première question et rebranche le 🔈 de la consigne (mécanisme unique de la ligne 20).
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
