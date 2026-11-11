# Spec : Barre de navigation et écran Réglages

> Demande : retravailler la barre de navigation (taille des boutons selon le support, rôle du bouton Île), ajouter un accès rapide aux paramètres et revoir les paramètres. **Pas de barre latérale** : la barre reste en bas.
> **Décision (2026-11-11) :** pas de 5ᵉ bouton dans la barre (elle en a déjà 4). On ouvre les Réglages en touchant **son avatar et son prénom, en haut**.
> **Dépend de** `formulaires-boutons` (modèle de formulaire, confirmation, actions dangereuses derrière l'accès parents).

## 1. Constat (v54)
- La barre du bas a 4 boutons : Carte, Île, Sac, Marché. Leur hauteur varie selon des règles empilées au fil des versions : 62 px (v13), 52 px (v14), 46 px sur téléphone à l'horizontale (« tous les écrans »).
- Le bouton **🏝️ Île** mène à l'île courante (celle du bateau) sans dire laquelle.
- **Les réglages sont dispersés** :
  - son, musique et voix : un bouton 🔊 en haut, qui fait un cycle de 4 états peu compréhensible ;
  - joueurs, modes, sauvegarde et espace parents : derrière le bouton du prénom ;
  - réglages du joueur : un bouton en bas du Sac ;
  - aperçu des saisons : dans l'espace parents.

## 2. Exigences fonctionnelles

### 2.1 Barre du bas
- **4 boutons de même largeur**, comme aujourd'hui : 🗺️ Carte, Île, 🎒 Sac, 🏪 Marché. La pastille du Sac est conservée. **Pas de bouton Réglages dans la barre.**
- **Bouton Île nommé** : il affiche l'icône et le nom court de l'île courante (🌲 Forêt, 🌋 Volcan…). Le comportement ne change pas (il mène à l'île du bateau). Le libellé se met à jour quand on change d'île ou de joueur.
- **Tailles selon le support** (une seule règle, qui remplace les règles empilées) :

| Support | Hauteur | Disposition |
|---|---|---|
| Téléphone en portrait | 64 px | icône au-dessus du texte |
| Téléphone à l'horizontale (hauteur ≤ 500 px) | 48 px | icône et texte côte à côte |
| Tablette (largeur ≥ 700 px) | 72 px | icônes plus grandes |
| Ordinateur (largeur ≥ 1024 px, souris) | 64 px | barre centrée, largeur limitée (~640 px), survol à la souris |

  - Jamais moins de **48 px** (cible tactile minimale) ; texte jamais coupé (« Réglages » tient à 360 px de large) ; zone sûre du bas respectée.

### 2.2 Accès : l'avatar et le prénom, en haut
- Toucher **l'avatar et le prénom** dans l'en-tête ouvre l'écran Réglages, section 🙂 Moi. C'est le geste habituel des applications, et c'est déjà là que mène aujourd'hui le panneau des joueurs.
- Un **petit ⚙️** accolé au prénom signale que c'est touchable. Libellé pour les lecteurs d'écran : « Réglages de Loulou ». En mode « chacun son tour », c'est l'avatar de l'enfant dont c'est le tour.

### 2.3 Écran ⚙️ Réglages
C'est une nouvelle vue (`registerView('reglages')`), avec des sections en cartes. Les formulaires utilisent le modèle commun de `formulaires-boutons`.
1. **🔊 Son** :
   - trois interrupteurs clairs, chacun lu à voix haute : « Bruitages », « Voix », « Musique » ;
   - désactiver les bruitages coupe tout, comme aujourd'hui ;
   - le bouton 🔊 du haut reste un **raccourci** qui fait le même cycle et reflète les interrupteurs.
2. **🙂 Moi** : prénom, âge, anniversaire, avatar, compagnon du joueur courant. C'est le formulaire de profil, qui quitte le Sac. On y trouve aussi un accès à **« Mon équipe »** (compagnons, v52) une fois l'équipe ouverte.
3. **👥 Joueurs** :
   - changer de joueur, ajouter un joueur ;
   - modes Solo, Chacun son tour, Course.
   Un bouton « Changer de joueur » est visible dès l'ouverture des Réglages.
4. **🔒 Parents** : la section est verrouillée par l'accès parents existant (la multiplication).
   - Elle donne accès à l'espace parents (progrès, temps de jeu, pause douce), à la sauvegarde et au code de transfert, à l'installation du jeu et à l'aperçu des saisons.
   - Elle contient aussi la **zone sensible** : recommencer à zéro, supprimer un joueur (règles de `formulaires-boutons`).
- En tête de l'écran, un rappel discret s'affiche quand une sauvegarde est conseillée (rappel existant de la v39).

### 2.4 Ce qui disparaît ailleurs
- Le bouton de réglages en bas du **Sac** (le Sac redevient seulement le sac et l'album).
- L'ancien panneau des joueurs ouvert par le prénom : il est remplacé par l'écran Réglages.

## 3. Exigences non fonctionnelles
- Une slice `features/settings/` (vue, sections). La barre du bas reste dans `shared/ui/views` : elle reçoit le libellé du bouton Île via un point d'accroche, sans connaître les îles.
- Les règles CSS empilées sur la barre du bas (v12, v13, v14, « tous les écrans ») sont **remplacées** par une seule feuille dans la slice de navigation. Le test de fumée vérifie qu'il ne reste qu'une source de règles de hauteur.
- Aucune donnée de sauvegarde ne change (les réglages de son existent déjà dans l'état).
- Mobile d'abord. À 360 px de large, 4 boutons de 64 px de haut, sans débordement horizontal ; l'avatar, le prénom et le ⚙️ tiennent dans l'en-tête sans pousser les autres boutons.

## 4. Critères d'acceptation
1. La barre garde 4 boutons ; toucher l'avatar et le prénom ouvre la vue Réglages (section Moi) ; la pastille du Sac fonctionne.
2. Le bouton Île affiche l'île courante, et se met à jour en changeant d'île et de joueur.
3. Hauteurs vérifiées par le test de fumée pour chaque support (portrait, paysage, tablette, ordinateur) ; toutes ≥ 48 px ; aucun débordement à 360 px.
4. Les trois interrupteurs de son agissent comme le cycle actuel, et le bouton 🔊 reste synchronisé.
5. « Moi » (avec l'accès à « Mon équipe » quand elle est ouverte) et « Joueurs » fonctionnent comme les écrans actuels (tests de fumée existants adaptés).
6. « Parents » demande la multiplication et donne accès à tout ce qui est listé. La zone sensible demande une double confirmation.
7. Le Sac n'a plus de bouton de réglages.
8. `npm test` passe.

## 5. Hors périmètre
- Une barre latérale (écartée).
- La refonte des écrans eux-mêmes (espace parents, sauvegarde) au-delà de leur nouvel emplacement.
