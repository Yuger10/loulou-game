# Spec : Le Monde des Licornes et la fin de la saison 2 (v58)

> Idée de la joueuse principale : « le monde des licornes ».
> **Dépend de** `squishy-collection_20261109` (v55) et de `saison2-monde-boites_20261109` (v57).

## 1. Vue d'ensemble
La **2ᵉ et dernière île du Ciel des Rêves** est le **Royaume Arc-en-ciel**, ouvert au **niveau 13**. Grisou a privé la Reine Arc-en-ciel de ses couleurs. En aidant les licornes, l'enfant rend ses couleurs au ciel. Le chapitre est le **grand final de la saison 2** : Grisou devient tout coloré, s'excuse et devient l'ami de tous, avec une fête dans le ciel.

Il apporte 4 personnages, 2 nouveaux mini-jeux (**Les potions de couleurs** et **Le miroir magique**), une série de squishies « Licornes », et deux récompenses de fin : **Grisou devient un compagnon** et le squishy unique **✨ Grisou arc-en-ciel**.

## 2. Exigences fonctionnelles

### 2.1 L'île
- `licornes` : `saison:2`, niveau 13, emoji 🦄, forme d'île en nuages avec une cascade arc-en-ciel, thème `--world-*` pastel irisé, scène en SVG et CSS (`js/features/island/island.js`).
- **Personnages :**
  - 👑 **Reine Arc-en-ciel**, guide du chapitre ; elle n'a pas de mission
  - 🦄 **Étincelle**, la licorne du Lagon rentrée chez elle. C'est un personnage distinct d'Étincelle au Lagon (id différent), avec un butin propre et des répliques qui font le lien (« Tu m'as aidée au Lagon, tu te souviens ? »)
  - 🐴 **Biscotte**, le bébé licorne maladroit qui rate ses arcs-en-ciel
  - 🧪 **Félix**, le licorne alchimiste, qui présente « Les potions de couleurs »
  - 🪞 **Mira**, la licorne coiffeuse des Écuries étoilées, qui présente « Le miroir magique »
- Chacun a un butin et 3 répliques. L'île a environ 6 objets (corne scintillante, crin arc-en-ciel, fer à cheval étoilé, fiole de couleur, peigne d'argent, nuage doux…), 2 recettes de fusion et 4 à 5 décorations.
- **Série de squishies « Licornes »** (6 modèles : 4 communs, 1 rare, 1 ✨) : licorne nuage, licorne fraise, licorne dodo, bébé licorne… ; rare : Biscotte ; ✨ : licorne étoile. Elle s'ajoute au catalogue et sert de récompense à l'énigme du chapitre.

### 2.2 Mini-jeu « Les potions de couleurs »
- **Mélanges :** on voit deux fioles de couleur, par exemple 🔴 et 🟡. Quelle couleur obtient-on ? On choisit parmi 3 fioles résultat. Les mélanges retenus sont ceux de la peinture : rouge + jaune = orange, bleu + jaune = vert, rouge + bleu = violet, rouge + blanc = rose, noir + blanc = gris.
- **Arc-en-ciel :** remettre dans l'ordre les couleurs de l'arc-en-ciel, en touchant dans l'ordre les couleurs qui manquent.
- **Progression selon l'âge et le palier :**
  - GS : reconnaître la couleur nommée à voix haute
  - CP : les 3 mélanges primaires
  - CE1 : tous les mélanges, plus l'arc-en-ciel avec 2 couleurs manquantes
  - CE2 : le mélange inverse (« orange = rouge + ? ») et l'arc-en-ciel avec 4 couleurs manquantes
- Les couleurs sont **toujours nommées à voix haute** et identifiables autrement que par la couleur seule (une pastille avec un motif ou une initiale), pour rester accessibles aux enfants qui distinguent mal les couleurs.
- **Anti-devinette :** une erreur donne un indice parlé, puis relance un **autre mélange** (relance annulable).

### 2.3 Mini-jeu « Le miroir magique » (symétrie)
- Une grille avec un **axe de symétrie** vertical (une ligne de paillettes). À gauche, un motif est déjà colorié (une crinière, une étoile, un cœur). L'enfant touche les cases de droite pour compléter le reflet.
- **Progression :**
  - GS/CP : grille 4×4 et 2 à 3 cases à placer
  - CE1 : 6×6 et environ 5 cases
  - CE2 : 6×6 avec **axe horizontal**, ou deux couleurs à placer
- On valide avec le bouton « ✨ Fini ! ». Si c'est faux, les cases mal placées clignotent avec un indice parlé. Après 2 erreurs, nouveau motif (relance annulable).
- Les deux jeux sont proposés au Royaume (jeu favori : les potions pour moins de 7 ans, le miroir pour 7 ans et plus) et ailleurs selon la variété.

### 2.4 Chapitre et grand final
- **Chapitre `licornes`** (guide : la Reine Arc-en-ciel) : 3 phrases d'intro et au moins 2 énigmes en images, sur le thème des couleurs (« Je suis jaune et je brille dans le ciel ? » → ☀️). Récompense : des pièces et une boîte surprise de la série Licornes.
- **Grand final**, juste après la résolution du chapitre :
  1. Une scène plein écran : Grisou se colore entièrement, avec une animation arc-en-ciel et des confettis.
  2. 3 phrases lues à voix haute : Grisou s'excuse et explique qu'il avait peur de perdre les rêves, puis il comprend qu'un rêve partagé ne se perd pas. Il devient l'ami de tous.
  3. **Récompenses**, présentées l'une après l'autre :
     - **Grisou devient un compagnon** que l'on peut choisir, comme Zap (`js/entities/companion/companions.js`). C'est un nuage arc-en-ciel avec ses propres encouragements.
     - Le squishy **✨ Grisou arc-en-ciel**, **unique** : il n'est jamais dans les boîtes et apparaît dans une case spéciale « Trésors » de la chambre à squishies.
  4. Le journal 📖 indique que la saison 2 est terminée (« Le Ciel des Rêves ✅ »).
- Le final ne se joue **qu'une fois** par profil. On peut le **revoir** depuis le journal, sans recevoir les récompenses une seconde fois.

### 2.5 Intégration aux fonctionnalités récentes (v45 à v49)
- **Épisodes (v49) :** le Royaume a ses **3 épisodes**, racontés par Étincelle, Biscotte, Félix ou Mira, jamais par la Reine. Ils préparent le final (les couleurs reviennent une à une, Grisou hésite à rendre le dernier rêve).
- **Cadeaux (v47) :** au moins 3 objets de l'île ne sont donnés par personne, pour que chaque personnage ait 2 objets préférés.
- **Musique (v48) :** un thème `MUSIC_THEMES.licornes` (harpe, clochettes), et une variante joyeuse pour le final.
- **Jeu adaptatif (v42) :** potions (« sciences » ou « formes et espace » selon l'exercice, à trancher dans le plan) et miroir (« formes et espace ») ont un niveau propre à chaque enfant ; ils fournissent leurs indices (v52).
- **Compagnons (v52) :** Grisou compagnon reçoit la spécialité **Câlins** définie par la track compagnons.

## 3. Exigences non fonctionnelles
- **Sauvegarde :** `SAVE_VERSION` augmente. Il y a un état `season2Done`, et le compagnon Grisou débloqué apparaît dans la liste des compagnons du profil. La migration se fait sans perte.
- **Aucun changement** de comportement des îles et compagnons existants. Étincelle du Lagon reste intacte.
- **Accessibilité des couleurs :** jamais la couleur seule. On ajoute toujours un nom parlé, et un motif ou une initiale.
- Mobile 360 px, voix, aucun texte nécessaire à lire.

## 4. Critères d'acceptation
1. Au niveau 13, le Royaume Arc-en-ciel s'ouvre dans le Ciel, avec l'écran « Nouvelle île » précédé de son chapitre.
2. Les 4 personnages, leurs butins, objets, recettes, décorations, la scène et le thème sont présents.
3. Potions : les mélanges sont corrects (table de la spec), l'arc-en-ciel est dans le bon ordre, la difficulté suit l'âge et le palier, un autre mélange est proposé après une erreur, chaque couleur a un nom parlé et un repère non coloré.
4. Miroir : la validation compare exactement au reflet attendu (axes vertical et horizontal), les erreurs clignotent avec un indice, nouveau motif après 2 erreurs, la taille suit le palier.
5. Résoudre le chapitre donne des pièces et une boîte de la série Licornes, puis le final se joue une seule fois.
6. Après le final : Grisou est sélectionnable comme compagnon, et ✨ Grisou arc-en-ciel est dans la case Trésors, jamais tiré d'une boîte.
7. Revoir le final depuis le journal ne redonne pas les récompenses.
8. Le journal affiche « Le Ciel des Rêves ✅ » ; le Royaume a ses 3 épisodes, sa musique, et 2 objets préférés par personnage.
9. Une partie v57 migrée garde tout.
10. `npm test` passe, sans aucune erreur JS.

## 5. Hors périmètre
- Remplacer la montgolfière par une licorne volante (idée bonus pour plus tard).
- Un grand décor arc-en-ciel à poser partout.
- La saison 3 : un nouvel archipel, sur le même modèle, pour les prochaines idées de la joueuse.
