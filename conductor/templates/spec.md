<!-- Gabarit cothon 0.3.0 (setting-up-docs), adopté dans Conductor (cothon 0.2.0-2) : une nouvelle track part de ce fichier. -->
# Spec : titre de la feature

- Statut : draft | approved | done
- Issue : #NNN
- Nouveau projet : oui | non
- Testeur à blanc : faits 0 · décisions 0 en N tours

## Problème

Le problème de l'utilisateur, de son point de vue, en deux à cinq lignes.

## Comportement attendu

1. Étant donné ..., quand ..., alors ... (chaque ligne est vérifiable)

## Décisions

| Id | Décision | Pourquoi | Source |
|---|---|---|---|
| D1 | ... | ... | `file:line`, URL de doc, résultat d'essai |

## Politiques

- **Arbitrages** : quand X et Y se percutent, X gagne et Y fait Z.
- **Défauts** : constante plutôt que réglage ; pas de nouvelle dépendance sans ligne de décision ; comportement en erreur : ... ; textes : ...
- **Référence visuelle** : maquette, capture ou `DESIGN.md`, par écran.
- **Détails non écrits** : l'agent prend le défaut de la référence ou l'option la plus simple, le note dans le journal de décisions du plan, l'humain juge à la revue.

## Hors périmètre

- ...

## Contrats partagés

| Contrat | Forme (ou lien) | Propriétaire | Consommateurs |
|---|---|---|---|

## Surface d'attaque

Aucune, ou :

| Entrée | Données ou appelant | Limites et vérifications | Peut atteindre | Jamais |
|---|---|---|---|---|

## Zones sensibles touchées

Aucune, ou liste (schéma, auth, paiement...) : revue humaine obligatoire.

## Smoke test

🤖 : un agent la prouve et joint la preuve. 👤 : seul l'humain peut juger (rendu, ressenti, téléphone, vrai paiement).

| Id | Qui | Étapes | Attendu | Niveau visé |
|---|---|---|---|---|
| S1 | 🤖 | ... | ... | e2e-verified · runtime-verified · test-verified |

## Questions ouvertes

Doit être vide avant le passage au code.
