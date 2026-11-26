<!-- Gabarit cothon 0.4.0 (setting-up-docs), adopté dans Conductor (cothon 0.2.0-2 et 0.4.0-6) : une nouvelle track part de ce fichier. -->
# Plan : le bilan de la semaine pour les parents

Spec : [spec.md](spec.md)

Une seule phase, une seule PR : la carte n'a de sens qu'entière (bilan et conseils). Les numéros entre parenthèses renvoient au « Comportement attendu » de la spec.

## Tâches

### Phase 1 : la carte « 🧭 Cette semaine » (PR 1) [checkpoint: 5e46479]

- [x] 1. Écrire `test/bilan.test.js` (JSDOM et `test/tools/page.js`, comme `test/stockage.test.js`). Construire des parties à la main : `state.skills = { count: { wins, fails, errors, last, recent: [{ t, e, ok }], hints: 0 }, … }`, dates par `const d = new Date(); d.setDate(d.getDate() - n); todayKey(d)` (même formule que la spec ; bornes testées : `n = 6` dans la fenêtre, `n = 7` hors fenêtre, `n = -1` (demain) hors fenêtre). Lire la carte par `ev("emit('parents:cards', { st: state, p: currentProfile() }).filter(Boolean).join('')")` et par `ev('bilanHTML(state)')`. Couvrir les points 1 à 13 et 17 à 19, et les six cas de la table « Rendus selon les cas » (point 17 : un test paramétré qui part d'une partie saine en texte JSON, rend hors domaine un seul champ à la fois pour chaque valeur listée au point 17, puis la lit par `ev('readSave(…)')` comme le jeu, sur le modèle de `test/parties-importees.test.js` ; il vérifie l'absence d'exception, l'absence du jeu dans la carte et `JSON.stringify(st)` inchangé ; le point 7 compare le `textContent` de la carte montée dans un élément, jamais la chaîne HTML) ; point 16 : aucun conseil ni nom ne contient `<`, `>`, `&` ou `"` ; point 14 : `ev('[...GAME_LIST.map(g => g.key), ...SKILL_GROUPS.flatMap(g => g.games)]')`, chaque clé dans `BILAN_TIPS` avec un `tip` qui finit par « . », « ? » ou « » » ; point 15 : lecture du fichier source. Vérifier qu'il échoue.
- [x] 2. `js/features/parents/bilan.js` : `BILAN_DAYS`, `BILAN_MAX`, `BILAN_TIER_LABELS`, `BILAN_TIPS` (la table de la spec, mot pour mot), `bilanEsc` (politique « Échappement »), `bilanSkill` (validation et copie, politique « Entrée du bilan »), `bilanHTML(st)`, écouteur `on('parents:cards', ({ st }) => bilanHTML(st))`. Imports : `GAME_LIST` (`entities/difficulty`), `skillStatus`, `todayKey` (`features/adaptive`), `emit`, `on` (`shared/lib`). Noms de haut niveau uniques dans le jeu (`test/slices.test.js`).
- [x] 3. Ajouter le fichier à la slice `parents` dans `js/slices.cjs` (liste `files`), `import './bilan.js';` dans `parents.js` avant `storage-alert.js` pour que la carte vienne avant les autres, puis `bun run sync`.
- [x] 4. `js/features/parents/parents.css` : `.ps-bilan`, `.bilan-tip` (teinte douce, lisible sur téléphone).
- [x] 5. `conductor/checklist-mini-jeu.md`, section 3 : la ligne « son conseil sans écran dans `BILAN_TIPS` (`js/features/parents/bilan.js`) » (D8).
- [x] 6. Annotations JSDoc de `bilan.js` selon D16 (`BilanSkill` = le `SkillRecord` de `state.js`, copie avec `errors: 0` et sans `hints` (optionnel), passée à `skillStatus` sans cast) ; test de la règle « Réponse d'erreur » : un écouteur qui renvoie `undefined`, un autre `42`, un autre `"  "`, puis `"Confond 6 et 9"` : seule la dernière est affichée ; `bun run typecheck` et `bun run check` passent ; `bun run test bilan` passe avec deux graines (`TEST_SEED`).
- [x] 7. Livraison : rebase sur `main`, `bun run release track "bilan de la semaine pour les parents"`, compléter la section du PRD (dire « idée de Claude »), mettre à jour la ligne du `TODO.md` sur les statistiques de l'espace parents si elle est couverte en partie, PR (zone sensible : espace parents).

## Preuves

| Ligne du smoke test | Résultat | Niveau | Preuve |
|---|---|---|---|
| S1 | réussi | test-verified | `bun run test bilan` : rouge sans le changement (sortie 1, `ReferenceError: bilanHTML is not defined`), vert avec (sortie 0, 125 vérifications), rejoué avec `TEST_SEED=1234` et `TEST_SEED=99854` ; prouvé par `prove-red-green.sh` |
| S2 | réussi | runtime-verified | `bun run check` (sortie 0), `bun run verify` (sortie 0) |
| S3 | à faire | e2e-verified | 👤 Amrou |
| S4 | à faire | e2e-verified | 👤 Amrou et sa fille |

## Journal de décisions

| # | Décision | Décidé par | Pourquoi | Preuve | Résultat |
|---|---|---|---|---|---|
| 1 | Une seule PR | spec | une carte à moitié (sans conseils) ne sert pas le parent | spec, Comportement attendu | gardée |
| 2 | Une conversion de type à l'entrée de `bilanHTML` (`st.skills`, de `unknown` vers une table de `BilanSkill`) et une pour `st.stars` (vers `Record<string, unknown>`) | agent | D16 impose `skills?: unknown` en paramètre et `BilanSkill` pour `bilanSkill` : le passage de l'un à l'autre demande une annotation ; la copie, elle, va à `skillStatus` sans conversion (D16). Même idiome que `cleanSkills` (`state.js`) | `bun run typecheck` (0 erreur), `test/gardes.test.js` vert | à juger par Amrou |
| 3 | La phrase d'erreur est coupée à 80 caractères entiers (`Array.from`), pas à 80 unités UTF-16 | agent | couper un emoji en deux laisserait un caractère illisible ; identique pour un texte sans emoji | `test/bilan.test.js` (« coupée à 80 caractères ») | à juger par Amrou |
| 4 | L'écouteur de `bilan:error-kind` reçoit sa propre copie (une seconde copie par `bilanSkill`) | agent | un écouteur qui modifie `s` ne change ni la partie ni le palier affiché | `test/bilan.test.js` (« un écouteur qui modifie `s` ») | à juger par Amrou |
| 5 | Mise en forme : nom du jeu en gras, palier et erreur fréquente sur la même ligne séparés par « · », conseil dans un paragraphe `.bilan-tip` teinté `--tint-sun` ; les repères de palier sont les mêmes pour les boîtes de rangement (paliers 1 à 3) | agent | détail non écrit : option la plus simple, d'après la carte « 🌙 Pauses » | lecture du rendu par les tests (`textContent`) ; pas de capture d'écran | à juger par Amrou (S3) |
| 6 | Un jeu à l'aise sans date (`last: null`) est trié après tous les autres dans « va bien » | agent | la spec trie par `s.last` sans dire quoi faire d'une date absente | aucun test dédié | à juger par Amrou |
| 7 | Version 67 prise à la livraison ; d'autres tracks livrent en parallèle et prendront le même numéro | consigne d'Amrou (une PR par track, `release track`) | le numéro s'attribue à la livraison (AGENTS.md) | `bun run release track` : 66.16 vers 67 | la PR mergée en second devra reprendre le numéro suivant |
| 8 | Après relecture (CI rouge sur « violations ajoutées », contrôle `quality-check.sh complexite`) : `bilanHTML` découpée (`bilanRows`, `bilanHard`, `bilanGood`), la table `BILAN_TIPS` sortie dans `js/features/parents/bilan-tips.js`, et les tests découpés en trois suites (`test/bilan.test.js`, `test/bilan-resiste.test.js`, `test/bilan-import.test.js`) qui partagent `test/tools/bilan-kit.js` | relecteur, puis agent | le contrôle refuse une fonction de plus de 50 lignes, un fichier de plus de 300 lignes et une complexité de plus de 20 ; `check` et `verify` ne le lancent pas | `new-violations.sh` : 3 ajoutées avant, 0 après ; les 125 vérifications d'origine sont toutes là (127 avec « aucune erreur JS » dans chaque suite) | gardée |

## Écarts et non vérifié

- Le rédacteur n'a pas pu lire les pages de l'EEF (403), de PubMed (mur de cookies) ni d'ADS (réponse vide) : D4 et D11 reposent sur les sources fournies par le brief.
- La justesse et le ton des conseils (S3, S4) ne se prouvent pas par un test.
- Le rendu visuel de la carte (teinte, espacements sur téléphone) n'a pas été regardé dans un navigateur : seuls le texte et la structure sont testés.
- Amrou n'était pas joignable en fin de phase : la vérification manuelle proposée est dans le corps de la PR.
