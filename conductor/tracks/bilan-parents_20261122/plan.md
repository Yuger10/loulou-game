<!-- Gabarit cothon 0.4.0 (setting-up-docs), adopté dans Conductor (cothon 0.2.0-2 et 0.4.0-6) : une nouvelle track part de ce fichier. -->
# Plan : le bilan de la semaine pour les parents

Spec : [spec.md](spec.md)

Une seule phase, une seule PR : la carte n'a de sens qu'entière (bilan et conseils). Les numéros entre parenthèses renvoient au « Comportement attendu » de la spec.

## Tâches

### Phase 1 : la carte « 🧭 Cette semaine » (PR 1)

- [ ] 1. Écrire `test/bilan.test.js` (JSDOM et `test/tools/page.js`, comme `test/stockage.test.js`). Construire des parties à la main : `state.skills = { count: { wins, fails, errors, last, recent: [{ t, e, ok }], hints: 0 }, … }`, dates par `const d = new Date(); d.setDate(d.getDate() - n); todayKey(d)` (même formule que la spec ; bornes testées : `n = 6` dans la fenêtre, `n = 7` hors fenêtre, `n = -1` (demain) hors fenêtre). Lire la carte par `ev("emit('parents:cards', { st: state, p: currentProfile() }).filter(Boolean).join('')")` et par `ev('bilanHTML(state)')`. Couvrir les points 1 à 13 et 17 à 19, et les six cas de la table « Rendus selon les cas » (point 17 : un test paramétré qui part d'une entrée saine et rend hors domaine un seul champ à la fois, pour chaque valeur listée au point 17 ; il vérifie l'absence d'exception, l'absence du jeu dans la carte et `JSON.stringify(st)` inchangé ; le point 7 compare le `textContent` de la carte montée dans un élément, jamais la chaîne HTML) ; point 16 : aucun conseil ni nom ne contient `<`, `>`, `&` ou `"` ; point 14 : `ev('[...GAME_LIST.map(g => g.key), ...SKILL_GROUPS.flatMap(g => g.games)]')`, chaque clé dans `BILAN_TIPS` avec un `tip` qui finit par « . », « ? » ou « » » ; point 15 : lecture du fichier source. Vérifier qu'il échoue.
- [ ] 2. `js/features/parents/bilan.js` : `BILAN_DAYS`, `BILAN_MAX`, `BILAN_TIER_LABELS`, `BILAN_TIPS` (la table de la spec, mot pour mot), `bilanEsc` (politique « Échappement »), `bilanSkill` (validation et copie, politique « Entrée du bilan »), `bilanHTML(st)`, écouteur `on('parents:cards', ({ st }) => bilanHTML(st))`. Imports : `GAME_LIST` (`entities/difficulty`), `skillStatus`, `todayKey` (`features/adaptive`), `emit`, `on` (`shared/lib`). Noms de haut niveau uniques dans le jeu (`test/slices.test.js`).
- [ ] 3. Ajouter le fichier à la slice `parents` dans `js/slices.cjs` (liste `files`), `import './bilan.js';` dans `parents.js` avant `storage-alert.js` pour que la carte vienne avant les autres, puis `bun run sync`.
- [ ] 4. `js/features/parents/parents.css` : `.ps-bilan`, `.bilan-tip` (teinte douce, lisible sur téléphone).
- [ ] 5. `conductor/checklist-mini-jeu.md`, section 3 : la ligne « son conseil sans écran dans `BILAN_TIPS` (`js/features/parents/bilan.js`) » (D8).
- [ ] 6. Annotations JSDoc de `bilan.js` selon D16 (`BilanSkill` = le `SkillRecord` de `state.js`, copie avec `errors: 0` et `hints: 0`, passée à `skillStatus` sans cast) ; test de la règle « Réponse d'erreur » : un écouteur qui renvoie `undefined`, un autre `42`, un autre `"  "`, puis `"Confond 6 et 9"` : seule la dernière est affichée ; `bun run typecheck` et `bun run check` passent ; `bun run test bilan` passe avec deux graines (`TEST_SEED`).
- [ ] 7. Livraison : rebase sur `main`, `bun run release track "bilan de la semaine pour les parents"`, compléter la section du PRD (dire « idée de Claude »), mettre à jour la ligne du `TODO.md` sur les statistiques de l'espace parents si elle est couverte en partie, PR (zone sensible : espace parents).

## Preuves

| Ligne du smoke test | Résultat | Niveau | Preuve |
|---|---|---|---|
| S1 | | test-verified | `bun run test bilan` (exit 0) |
| S2 | | runtime-verified | `bun run check` (exit 0) |
| S3 | | e2e-verified | 👤 Amrou |
| S4 | | e2e-verified | 👤 Amrou et sa fille |

## Journal de décisions

| # | Décision | Décidé par | Pourquoi | Preuve | Résultat |
|---|---|---|---|---|---|
| 1 | Une seule PR | spec | une carte à moitié (sans conseils) ne sert pas le parent | spec, Comportement attendu | gardée |

## Écarts et non vérifié

- Le rédacteur n'a pas pu lire les pages de l'EEF (403), de PubMed (mur de cookies) ni d'ADS (réponse vide) : D4 et D11 reposent sur les sources fournies par le brief.
- La justesse et le ton des conseils (S3, S4) ne se prouvent pas par un test.
