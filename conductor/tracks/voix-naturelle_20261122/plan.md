<!-- Gabarit cothon 0.4.0 (setting-up-docs), adopté dans Conductor. -->
# Plan : une voix plus naturelle

Spec : [spec.md](spec.md). Prérequis : la phase 1 de [voix-partout](../voix-partout_20261122/plan.md) est sur `main` (file de parole, `stopSpeech()`, `toSpoken()` dans `js/shared/lib/spoken.js`, lecteur interne `playItem`).

Trois PR. Les phases 1 et 2 ne changent rien pour l'enfant (`VOICE_CLIPS` vide) ; la phase 3 allume la belle voix d'un coup. Chaque PR : `bun run check` vert, puis `bun run verify`, corps de PR avec `agent-generated: true`, étiquette `agent`, zones sensibles citées.

## État du dépôt et du jeu après chaque phase

| Après | Dépôt | Ce que voit l'enfant |
|---|---|---|
| Phase 1 seule | `test/tools/voix.js`, `test/tools/voix-phrases.js`, ADR 0007 « Proposée », script `voix` ; pas de `voix/`, pas de `voice-clips.js` | rien ne change (outil de développement seulement) |
| Phases 1 et 2 | `voice-clips.js` avec `VOICE_CLIPS = {}`, `VOICE_SERVICE = ''`, `VOICE_UNLOCK = ''` ; `sw.js` a `VOICE_CACHE` et le bloc `voix:` ; carte parents codée ; pas de `voix/` | rien ne change : lecteur inerte (spec, avant la ligne 14), règle `voix/` du service worker jamais atteinte, carte « Voix » absente |
| Phases 1 à 3 | `voix/voix.json`, `voix/*.mp3`, `voice-clips.js` rempli | la belle voix pour les phrases fixes, Web Speech pour le reste, carte « Voix » chez les parents |

## Fichiers générés ou modifiés par un outil, et ce qui les relit

| Fichier | Écrit par | Relu par |
|---|---|---|
| `js/shared/ui/voice-clips.js` | `bun run voix` puis oxfmt (D23) | `bun run lint` (oxlint et `oxfmt --check`), `bun run typecheck`, `test/slices.test.js` (manifeste), `test/modules.test.js` (vrais modules), `test/voix-clips.test.js`, `bun run sync` (le met dans `FILES`) |
| `sw.js` | `bun run sync` (D24) | `test/update.test.js` (expressions existantes et ajouts de 2.3) ; ignoré par oxfmt (`.oxfmtrc.json`) |
| `voix/*.mp3` | `bun run voix` | `test/voix-clips.test.js` (noms, poids, orphelins, fraîcheur) |
| `voix/voix.json` | Amrou (choix 1.7), à la main | `test/voix-clips.test.js` (ligne 13), `bun run voix` |
| `package.json` | à la main (1.5) | `bun run check` (étape selftests) |

## Tâches

### Phase 1 : l'outil et l'essai d'écoute (PR 1, livrée par `bun run release patch "outil de génération des voix"`)

- [x] 1.1 `docs/adr/0007-voix-enregistree.md` (statut « Proposée ») : contexte (Web Speech robotique, D2), décision (D1, D3, D9, D11, D13), options écartées (choix de la voix de l'appareil, synthèse dans le navigateur, Opus, Web Audio pour la voix), conséquences (garde, clé sur le poste d'Amrou, poids du dépôt), conditions des deux services (D17, D18). Ligne ajoutée à `docs/adr/README.md`.
- [x] 1.2 Selftest d'abord : `test/tools/voix.js --selftest` (racine temporaire, `essaiDir` dans cette racine, faux `fetch`, `sleep` noté, oxfmt du vrai dépôt avec copie de `.oxfmtrc.json`, selon la spec) avec des cas qui échouent tant que le script n'existe pas : nombres d'appels N + 1, 0, 1, N (lignes 3 à 6), chaque ligne de la table C, extraction R1 à R5 sur une source d'exemple écrite dans le selftest (chaînes, gabarit sans `${}`, gabarit avec `${}` ignoré, `data-say` avec `&quot;`, marqueur `// voix: phrases` sur un tableau et un objet), rejet des chiffres, empreinte stable pour un même texte et différente si `voix.json` change.
- [x] 1.3 `test/tools/voix-phrases.js` (CommonJS) : `async extractPhrases(root) → [{ text, key, file, line }]` (acorn, `ecmaVersion: 'latest'`, `sourceType: 'module'`), `clipHash(config, key)` selon D9 (le selftest vérifie l'exemple `3b8aa8075516`) ; `toSpoken` chargé selon D25, par le chemin relatif au script (`path.join(__dirname, '..', '..', 'js', 'shared', 'lib', 'spoken.js')`), jamais par `root` ; lancé par `node`.
- [x] 1.4 `test/tools/voix.js` : `main({ root, env, fetch, sleep, argv, essaiDir })` exporté (politiques « Messages du script », « Écritures du script » et « Lecture de `voice-clips.js` » : acorn, jamais `import()` ; une phrase par clé distincte), `--root`, chaque ligne de la table C de la spec (états d'entrée, messages, codes), texte envoyé selon la ligne 6b, silence demandé seulement si `VOICE_UNLOCK` est vide ; services complets et à moitié posés (lignes 1 et 2), `--essai` (tables E et V, `path.join(os.tmpdir(), 'voix-essai')`, `ecoute.html`), appels Azure (table A) et Google (table G) par `fetch`, rythme Azure 3,4 s, 3 tentatives et comportement 400 (ligne 7), ligne de succès exacte (ligne 3), sorties 0, 1, 2, contrôle des octets MP3 et de la taille, écriture de `voice-clips.js` suivie d'oxfmt (D23). Le selftest appelle `main` avec un `fetch` injecté qui compte ses appels et rend 200, 400, 401, 429 selon le cas, et un `sleep` injecté qui note les pauses sans attendre ; il ne remplace jamais `globalThis.fetch`.
- [x] 1.5 `package.json` : `"voix": "node test/tools/voix.js"` ; `node test/tools/voix.js --selftest` ajouté à la fin de `selftest`.
- [x] 1.6 `bun run check` vert ; PR 1.
- [ ] 1.7 👤 S2, sur le poste d'Amrou (la clé n'existe que là) : une fois la PR 1 mergée, l'agent rend la main avec la commande exacte `VOIX_AZURE_KEY=… VOIX_AZURE_REGION=… VOIX_GOOGLE_TOKEN=$(gcloud auth print-access-token) VOIX_GOOGLE_PROJECT=… bun run voix --essai` (un seul service suffit). Amrou et sa fille écoutent `ecoute.html` ; Amrou choisit la voix et, si elle est Google, tranche D18. L'agent écrit ce choix dans le journal de décisions (ligne nouvelle) avant la phase 3. Rien n'entre dans le dépôt.

### Phase 2 : le lecteur et le hors ligne, sans clip (PR 2, `bun run release patch "lecteur de clips de voix"`)

- [ ] 2.1 Tests d'abord : `test/tools/fake-voice.js` (sur le modèle de `test/tools/fake-audio.js`) : faux `Audio` (`canPlayType`, `play()` qui rend une promesse réglable, `pause()`, `playbackRate`, `preservesPitch`, événements `playing`, `ended`, `error` déclenchés par le test), faux `fetch` de `voix/*.mp3` (réponse, échec, lenteur), faux `caches` (`open`, `match`, `put` qui peut lever `QuotaExceededError`, `keys`, `delete`), faux `URL.createObjectURL` et `revokeObjectURL`.
- [ ] 2.2 `test/voix-lecteur.test.js` : charge le jeu (page de `test/tools/page.js`) ; d'abord **sans** clips : aucun `Audio` créé, aucun `fetch`, aucun accès à `caches`, aucune erreur jsdom (lecteur inerte) ; puis installe `fake-voice.js` et injecte 3 clips et un `VOICE_UNLOCK` de test par `ev('setVoiceClips({…}, "data:audio/mpeg;base64,AAAA")')`, et prouve les lignes 14 à 22, 25, 26 et 28 de la spec. Doit échouer avant 2.4.
- [ ] 2.3 Tests du service worker dans `test/update.test.js` (ajouts seulement, aucun test existant modifié) : le texte de `sw.js` contient la règle `voix/` cache d'abord sur `lagon-voix` (ligne 23) et `activate` garde `lagon-voix` (ligne 24) ; `bun run sync` réécrit ces deux morceaux à l'identique.
- [ ] 2.4 `js/shared/ui/voice-clips.js` : `export const VOICE_CLIPS = {};`, `export const VOICE_SERVICE = '';`, `export const VOICE_UNLOCK = '';` (forme oxfmt), déclaré dans la slice `shared-ui` de `js/slices.cjs` (avant `voice.js`) ; `js/shared/ui/index.js` réexporte `VOICE_SERVICE` et `voiceOfflineState` (contrat « Réexports ») ; puis `bun run sync`. `test/voix-clips.test.js` est écrit **en entier** dès cette phase (lignes 10 à 13) : sans `voix/voix.json`, il ne vérifie que la forme vide (ligne 10) ; ses vérifications complètes sont prouvées sur une racine temporaire d'exemple (fichiers `js/`, `voix.json`, clips factices).
- [ ] 2.5 `js/shared/ui/voice.js` : règle d'inertie (spec, avant la ligne 14) ; dans `playItem`, choix clip ou Web Speech (lignes 14 à 21) ; un seul `HTMLAudioElement` créé au premier besoin ; déverrouillage par `VOICE_UNLOCK` au premier `pointerdown` (ligne 18) ; `setVoiceClips(table, unlock)` lu par les tests seulement (`// oxlint-disable-next-line no-unused-vars -- lu par les tests`) ; motif `^[0-9a-f]{12}$` vérifié avant `fetch`.
- [ ] 2.6 Téléchargement de fond (ligne 25) et nettoyage de `lagon-voix`, dans `voice.js` ; `voiceOfflineState()` exporté par `js/shared/ui/index.js` et `emit('voice:offline', état)` après chaque lot.
- [ ] 2.7 `test/tools/sync.js` : les trois insertions idempotentes de D24 (constante, bloc entre marqueurs, filtre d'`activate`), puis `bun run sync` deux fois : le second passage ne change aucun octet (test de 2.3). Les expressions déjà testées par `test/update.test.js:60-69` restent identiques.
- [ ] 2.8 `js/features/parents/voice-card.js` (déclaré dans la slice `parents` de `js/slices.cjs`, importé par `js/features/parents/parents.js` comme `storage-alert.js` ; importe `VOICE_SERVICE` et `voiceOfflineState` de `../../shared/ui/index.js`, `on` de `../../shared/lib/index.js`) : écoute `parents:cards` et rend la carte des lignes 27 et 28 d'après `voiceOfflineState()` ; ne rend rien tant que `VOICE_SERVICE` est vide.
- [ ] 2.9 `bun run typecheck` (tout `js/` en strict : `voice-clips.js`, `voiceOfflineState`, `setVoiceClips` typés selon la spec) puis `bun run check` verts ; PR 2 (zones sensibles : PWA, parents).

### Phase 3 : la belle voix (PR 3, livrée par `bun run release track "une voix plus naturelle"`)

- [ ] 3.1 Test d'abord : ajouter `voix/voix.json` (3.2) fait passer `test/voix-clips.test.js` (écrit en 2.4) en mode complet ; il échoue alors tant que les clips ne sont pas générés, en imprimant pour chaque manque `fichier:ligne`, la phrase et « lance bun run voix ».
- [ ] 3.2 `voix/voix.json` selon le choix de 1.7 ; marqueurs `// voix: phrases` sur `WRONG_HINTS`, `HINT_CHEERS`, `PROGRESS_CHEERS` et sur les tables de répliques fixes repérées par la couverture (S9).
- [ ] 3.3 👤 Génération, sur le poste d'Amrou : l'agent s'arrête après 3.2 (commit local de `voix/voix.json` et des marqueurs, pas de push ni de PR) et rend la main avec la commande exacte `VOIX_AZURE_KEY=… VOIX_AZURE_REGION=… bun run voix` (ou `VOIX_GOOGLE_TOKEN=$(gcloud auth print-access-token) VOIX_GOOGLE_PROJECT=… bun run voix`). Entre-temps, `bun run check` échoue sur `test/voix-clips.test.js` (phrases sans clip) : c'est attendu, rien n'est poussé. Amrou lance la commande ; les clips et `voice-clips.js` apparaissent dans l'arbre de travail. L'agent reprend : `bun run check` vert, ligne de succès copiée dans la PR (budget 8 Mo), commit des clips et de la table, puis 3.4 et suivantes.
- [ ] 3.4 Couverture : la garde de voix-partout imprime « clips : N phrases dites sur M ont un clip (X %) » (S9) ; le chiffre va dans la PR.
- [ ] 3.5 ADR 0007 passé à « Acceptée » avec le service et la voix retenus.
- [ ] 3.6 Docs : `AGENTS.md` (commande `bun run voix`, règle « une phrase fixe ajoutée livre son clip »), `conductor/checklist-mini-jeu.md` (consignes et indices fixes : `bun run voix` avant la PR), section du PRD.
- [ ] 3.7 `bun run check` et `bun run verify` verts ; PR 3.
- [ ] 3.8 👤 S6, S7, S8, S10 sur les appareils de la famille, après le merge ordonné par Amrou.

## Preuves

| Ligne du smoke test | Résultat | Niveau | Preuve |
|---|---|---|---|
| S1 | à faire | test-verified | `bun run voix --selftest` (exit 0) |
| S2 | à faire | runtime-verified | choix d'Amrou noté dans le journal |
| S3 | à faire | test-verified | `bun run test voix-clips` (exit 0) |
| S4 | à faire | test-verified | `bun run test voix-lecteur` (exit 0) |
| S5 | à faire | test-verified | `bun run test update` (exit 0) |
| S6 à S8, S10 | à faire | runtime-verified | compte rendu d'Amrou |
| S9 | à faire | test-verified | sortie de `bun run test voix-partout` |

## Journal de décisions

| # | Décision | Décidé par | Pourquoi | Preuve | Résultat |
|---|---|---|---|---|---|
| 1 | Trois PR, `VOICE_CLIPS` vide jusqu'à la phase 3 | spec | rien de visible à moitié | spec D12b | gardée |

## Écarts et non vérifié

- Non vérifié par la rédaction : qu'iOS laisse rejouer le même élément audio sans nouveau geste après le déverrouillage (savoir de la communauté, pas de page officielle) : couvert par S6 et par le repli de la ligne 17.
- Non vérifié : que l'élément audio s'entende quand l'interrupteur de sonnerie est sur silence (rapporté dans le bug WebKit 237322, pas écrit par Apple) : S6.
- Non vérifié : la qualification de Chirp 3 HD au regard de la section 20(d) des conditions Google : S2 et D18.
