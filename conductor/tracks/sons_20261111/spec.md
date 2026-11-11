# Spec : Les sons du jeu (ambiance « marimba doux »)

> Demande : retravailler tous les sons de l'application, avec un système plus fluide et des sons plus adaptés à un enfant.
> Choix faits après écoute de la page de démonstration « Sons du Lagon » (https://claude.ai/artifact/F5xuENW8ePFKLk4QogwH8K) : **ambiance « marimba doux »**, **synthèse retravaillée** (aucun fichier audio).

## 1. Constat (v54)
- `js/shared/ui/sound.js` produit 9 sons par des ondes brutes (`tone`) : `tap` (112 usages), `win` (22), `good` (10), `wrong` (7), `coin` (6), `pop` (5), `tick`, `pouic`, `sparkle`.
- Les ondes sont **carrées et triangulaires**, sans adoucissement. Le « wrong » est un bourdonnement carré à 220 Hz, dur pour un enfant.
- Il n'y a **ni volume général, ni limiteur** : plusieurs sons ensemble peuvent saturer. Un enfant qui tape vite produit un **crépitement**, et les 112 « tap » identiques sonnent mécaniques.
- Trois chaînes audio séparées : les sons (`sound.js`), les notes du Simon (`tone` appelé directement) et la musique (`features/music`, avec sa propre réduction de volume pendant la voix).
- Il manque des sons pour certains moments : l'indice 💡 (compagnons), la nouvelle île, l'ouverture d'une boîte surprise (squishies).

## 2. Exigences fonctionnelles

### 2.1 Un moteur audio unique (`shared/ui/sound`)
- **Un seul `AudioContext`** et un **bus principal** : volume général, puis limiteur (`DynamicsCompressor`), puis haut-parleur. Les sons, le Simon et la musique y passent tous.
- **Écho doux** : une réverbération légère (réponse impulsionnelle générée, environ 1,4 s), envoyée sur un bus séparé, réglée par son.
- **Variation naturelle** : à chaque lecture, la hauteur varie d'environ ±1,2 % et le volume d'environ ±12 %. Pas de variation sur les notes du Simon, qui doivent rester exactes pour être mémorisées.
- **Anti-rafale** : un même son n'est pas rejoué moins de 60 ms après lui-même.
- **Mixage par famille** : interface (`tap`, `tick`) discrète, retours (`good`, `wrong`, `coin`, `pop`) clairs, fêtes (`win`, `island`, `box`) plus présentes, d'après les niveaux de la page de démonstration.
- **Réduction pendant la voix** : quand la voix parle, sons et musique baissent ensemble, par le bus principal. Cela remplace la réduction propre à la musique.
- **Déblocage audio** : l'`AudioContext` est créé ou repris au premier toucher, ce qu'exige iOS. Aucune erreur si l'audio n'est pas disponible.
- L'API publique ne change pas pour les appelants : `playSound(clé)`. Le moteur expose aussi `playNote(fréquence, durée)` pour le Simon et un accès au bus pour la musique.

### 2.2 La palette « marimba doux »
- **Instrument** : marimba de synthèse, avec une fondamentale, un partiel à ~3,99× qui s'éteint vite et un petit clic d'attaque. **Gamme pentatonique** (do, ré, mi, sol, la) : deux sons qui se superposent ne font jamais une fausse note.
- **Sons existants**, redessinés comme dans la démonstration :

| Clé | Moment | Nouveau son |
|---|---|---|
| `tap` | toucher un bouton | une note de marimba courte et discrète (sol) |
| `good` | bonne réponse | deux notes qui montent (mi, do aigu) |
| `wrong` | erreur | deux notes douces qui descendent (ré, la grave) : un « oups », jamais un buzzer |
| `win` | victoire | un arpège qui monte et se termine par un accord résonnant |
| `coin` | pièce | deux notes aiguës rapides |
| `pop` | apparition | une note brève (la) |
| `tick` | minuteur | un petit tic de bois, très discret |
| `pouic` | squishy pressé | un glissé doux qui monte et redescend |
| `sparkle` | squishy ✨ | une cascade aiguë de marimba |

- **Nouveaux sons**, branchés là où le moment existe déjà :
  - `hint` : deux notes qui montent doucement (mi, la), jouées quand on touche le bouton 💡 ;
  - `island` : une gamme qui monte et finit par un accord, jouée sur l'écran « Nouvelle île » ;
  - `box` : un glissé qui monte puis trois notes, joué à l'ouverture d'une boîte surprise.
- **Simon** : ses 4 couleurs deviennent 4 notes de marimba, sans variation et avec la même hauteur qu'aujourd'hui.

### 2.3 Réglages
- Le bouton 🔊 et ses 4 états restent inchangés : sons, voix, musique.
- **Volume général** des sons, de 0 à 100 %, par profil, dans la sauvegarde. Il est réglable dans l'écran Réglages, section Son, si la track `navigation-reglages` est livrée ; sinon, dans l'espace parents.

## 3. Exigences non fonctionnelles
- **Aucun fichier audio** : tout est synthétisé, le jeu marche hors-ligne et la taille reste la même.
- **Performances** : une voix de marimba compte 3 oscillateurs au maximum, et tous les nœuds sont arrêtés et libérés après le son. La réponse impulsionnelle est générée une seule fois.
- **Accessibilité** : le respect de `prefers-reduced-motion` ne coupe pas le son. Le réglage de son du joueur reste la seule autorité.
- **Sauvegarde** : `SAVE_VERSION` +1 pour le volume. La migration applique 80 % par défaut.
- Les règles d'architecture s'appliquent (feature slices et modules ES) : le moteur reste dans `shared/ui`, sans rien connaître du jeu.

## 4. Critères d'acceptation
1. Tous les appels `playSound` existants jouent la nouvelle palette. Aucune onde carrée ne reste dans le jeu (test : chaque son de la palette n'utilise que des ondes sinus ou triangulaires).
2. Les trois nouveaux sons sont joués au bon moment : bouton 💡, nouvelle île, ouverture d'une boîte.
3. Le bus principal existe, avec le limiteur. Le volume général s'applique aux sons, au Simon et à la musique.
4. Anti-rafale : 10 « tap » en 300 ms ne produisent pas 10 sons (test sur les lectures effectives).
5. La variation est active sauf pour le Simon. Le Simon garde ses 4 hauteurs exactes.
6. Pendant la voix, le bus principal baisse puis remonte. La musique n'a plus sa propre réduction.
7. Le volume est sauvegardé par profil. La migration met 80 % aux anciennes parties.
8. `npm test` passe. Les tests sonores utilisent un `AudioContext` simulé dans jsdom, qui enregistre les nœuds créés.
9. Écoute manuelle sur iPhone et sur ordinateur : rien de dur, rien ne sature, pas de crépitement en tapant vite.

## 5. Hors périmètre
- La voix (`speechSynthesis`) et le choix de la voix.
- Le changement des thèmes musicaux des îles. Ils passent seulement par le nouveau bus.
- Les sons enregistrés (fichiers), et le choix d'une autre ambiance dans les Réglages. Ce sera possible plus tard, puisque les palettes sont des données.
