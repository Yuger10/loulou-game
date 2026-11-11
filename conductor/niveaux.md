# Les niveaux du jeu : le tableau de référence

> **C'est la seule référence pour les niveaux.** Les specs des îles renvoient ici au lieu de recopier la règle. `test/niveaux.test.js` vérifie que le jeu (`WORLDS`) et les specs disent la même chose que ce tableau.
> Décision du propriétaire du 11/11/2026 : l'écart entre deux îles grandit de 2 niveaux à chaque saison.

## La règle

1. **Un niveau = 5 missions réussies**, du premier au dernier niveau (`MISSIONS_PER_LEVEL`). Cette valeur ne change jamais, pour qu'aucun enfant ne perde de niveau.
2. **Les saisons se suivent.** Une saison s'ouvre avec sa première île.
3. **L'écart entre deux îles grandit de 2 niveaux à chaque saison :**

| Saison | Une île tous les… | Missions par île |
|---|---|---|
| 1 · Le Lagon Magique | 4 niveaux (après un départ rapide : 1, 3, 6, 10) | 20 |
| 2 · Le Ciel des Rêves | 6 niveaux | 30 |
| 3 · La Grande Expédition | 8 niveaux | 40 |

4. **Entre deux saisons, l'écart est celui de la nouvelle saison.** Par exemple, du Pays Squishy (26) au Monde des Boîtes (32), il y a 6 niveaux.

À titre d'exemple, avec une dizaine de missions par jour :
- une île de la saison 1 s'ouvre tous les 2 jours ;
- une île de la saison 2, tous les 3 jours ;
- une île de la saison 3, tous les 4 jours.

## Le tableau

| Saison | Île | id | Niveau | Écart | Missions depuis l'île d'avant | Missions depuis le début |
|---|---|---|---|---|---|---|
| 1 | 🌊 Le Lagon | `lagon` | 1 | — | — | 0 |
| 1 | 🌲 La Forêt | `foret` | 3 | 2 | 10 | 10 |
| 1 | ⛰️ La Montagne | `montagne` | 6 | 3 | 15 | 25 |
| 1 | 🏰 Le Château | `chateau` | 10 | 4 | 20 | 45 |
| 1 | 🌴 La Jungle | `jungle` | 14 | 4 | 20 | 65 |
| 1 | 🕰️ La Cité du Temps | `cite` | 18 | 4 | 20 | 85 |
| 1 | 🌋 Le Volcan | `volcan` | 22 | 4 | 20 | 105 |
| 1 | 🍡 Le Pays Squishy | `squishy` | 26 | 4 | 20 | 125 |
| 2 | 📦 Le Monde des Boîtes | `boites` | 32 | 6 | 30 | 155 |
| 2 | 🧸 Le Coffre aux Jouets Doux | `jouets` | 38 | 6 | 30 | 185 |
| 2 | 🍭 Le Royaume des Bonbons | `bonbons` | 44 | 6 | 30 | 215 |
| 2 | 🎵 L'Île de la Musique | `musique` | 50 | 6 | 30 | 245 |
| 2 | 🌸 Le Jardin des Fées | `jardin` | 56 | 6 | 30 | 275 |
| 2 | 🦄 Le Royaume Arc-en-ciel (Licornes) | `licornes` | 62 | 6 | 30 | 305 |
| 3 | ☁️ La Cité des Nuages | `nuages` | 70 | 8 | 40 | 345 |
| 3 | 🦕 La Vallée des Dinosaures | `dinos` | 78 | 8 | 40 | 385 |
| 3 | 🎪 La Fête Foraine | `fete` | 86 | 8 | 40 | 425 |
| 3 | 📚 La Bibliothèque Magique | `biblio` | 94 | 8 | 40 | 465 |
| 3 | 🚀 La Station des Étoiles | `etoiles` | 102 | 8 | 40 | 505 |

Dans le jeu, aujourd'hui (v58) :
- les îles de la saison 1, le Monde des Boîtes et le Coffre aux Jouets Doux existent ;
- les autres îles ont chacune leur track dans `conductor/tracks.md` ;
- une saison s'ouvre au niveau de sa première île, que le jeu calcule lui-même (`ARCHIPELAGOS[s].level`).

## Ce que voit l'enfant

- **La pastille « ⭐ Niv. N »** a une barre qui se remplit à chaque mission et se vide à chaque nouveau niveau (5 missions).
- **Sous la carte**, la prochaine étape est indiquée ainsi : « Prochaine île : … au niveau N · encore X missions » (ou « Prochain monde »). Sa barre part de la dernière île ouverte et arrive pleine à la prochaine.
- **Une île verrouillée** répond « … s'ouvrira au niveau N. Encore X missions ! ».
- Les trois messages font le même calcul (`missionsUntil`, dans `js/entities/game-state`).

## Ajouter une île

1. Prendre son niveau dans ce tableau.
2. Le donner dans `WORLDS` (`level`).
3. Le citer dans sa spec (« niveau d'ouverture **N** »).

Si la règle change, il faut changer ce tableau, `WORLDS` et les specs ensemble : le test échoue sinon.

## Historique

Ces anciennes valeurs ne s'appliquent plus.
- Le Ciel des Rêves avait d'abord été prévu au niveau 8, en parallèle de la saison 1, avec une île tous les 5 niveaux.
- Il a ensuite été prévu au niveau 36.
- La saison 3 avait été prévue au niveau 20, en parallèle des autres saisons.
- La règle ci-dessus remplace tout cela.
