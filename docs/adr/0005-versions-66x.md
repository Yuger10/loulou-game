# ADR 0005 : Versions 66.1, 66.2… pour les livraisons sans track

- **Statut :** acceptée, livrée en v66.1
- **Date :** 2026-11-22
- **Décideur :** Amrou (« je veux des versions 66.xx pour ce genre de versioning, ou pas de track livrée »)

## Contexte
La version du jeu (`APP_VERSION`, un entier) n'augmentait qu'à la livraison d'une track. Les PR d'outillage et de correction, pourtant en ligne une minute après le merge, laissaient « version 66 » affiché : impossible de savoir quel code tournait sur la tablette.

## Options envisagées
1. Un nombre décimal (66.1) : 66.10 et 66.1 seraient égaux, et la comparaison des mises à jour casserait.
2. Augmenter `APP_VERSION` à chaque PR : les numéros de version perdent leur sens (une île = une version).
3. **Deux nombres** : `APP_VERSION` (track livrée) et `APP_PATCH` (livraison sans track).

## Décision
Option 3, dans `js/shared/lib/version.js`. Affichage et cache : `66.1` et `lagon-v66.1` ; `versionBuild()` compare 66 < 66.1 < 66.2 < 66.10 < 67, y compris avec un ancien cache `lagon-v66`. Livrer : `bun run release patch "résumé"` ou `bun run release track "résumé"`.

## Vérification

- `bun run release patch|track` écrit le numéro (`js/shared/lib/version.js`), le cache et la section du PRD ; `test/update.test.js` vérifie l'ordre des versions et la mise à jour d'une tablette.
- **Aucun check** n'oblige à lancer `release` à chaque livraison : c'est le risque noté ci-dessous (sans effet sur la mise à jour).

## Conséquences
- Positif : chaque livraison a un numéro visible dans l'espace parents ; les tablettes existantes se mettent à jour normalement (testé de 66 à 66.1).
- Risque : oublier `bun run release` laisse l'ancien numéro (sans bloquer la mise à jour, le service worker sert le réseau d'abord).
