# TODO — Le Lagon Magique

Feuille de route du jeu. On avance phase par phase, dans l'ordre ; à l'intérieur d'une phase, de haut en bas.
Cocher au fur et à mesure. Les idées nouvelles vont dans la **Boîte à idées**, puis rejoignent une phase quand on décide de les faire.
Le détail de chaque version livrée est dans `PRD-lagon-magique.md`.

Légende : 🔴 indispensable · 🟠 important · 🟢 bonus · ⏳ en cours

---

## 🗺️ Feuille de route

### En continu — Tester avec les enfants 🔴
Ce qui guide tout le reste. Après chaque partie, remplir les **Notes de session** en bas de ce fichier.
- [ ] Session de test avec chaque enfant : quel mini-jeu il préfère, lequel le bloque, de quoi il parle ensuite
- [ ] Vérifier la voix sur iPad / iPhone (Safari exige un toucher avant de parler)
- [ ] Installer une voix française premium (Réglages → Accessibilité → Contenu énoncé → Voix)
- [ ] Vérifier la taille des boutons et la lisibilité au doigt sur leur appareil
- [ ] Ajuster la difficulté selon ce qu'on observe

### Phase 1 — Ne rien perdre 🔴 ✅
La partie est enregistrée dans le navigateur. Safari peut effacer ces données après 7 jours sans utilisation si le jeu n'est pas installé sur l'écran d'accueil, et changer d'appareil fait tout perdre.
- [x] **Sauvegarder / restaurer** une partie dans un fichier (tous les joueurs, toute la progression), depuis le panneau des joueurs — v39
- [x] **Code de transfert** à copier-coller pour passer sur un autre appareil sans fichier — v39
- [x] **Stockage persistant** : demander au navigateur de ne pas effacer les données (`navigator.storage.persist`) — v39
- [x] **Inviter à installer le jeu** sur l'écran d'accueil (explication iPhone/iPad, bouton « Installer » sur Android et ordinateur) — v39
- [x] **Rappel de sauvegarde** discret quand la dernière sauvegarde date de plus de 2 semaines — v39
- [x] **Jeu en ligne en `https://`** : https://yuger10.github.io/loulou-game/ (GitHub Pages, branche `main`) — à installer sur l'écran d'accueil de chaque appareil ; pour garder une partie jouée sur l'ancienne adresse, la transférer avec le code de transfert

### Phase 2 — Espace parents 🟠 ✅
Panneau des joueurs → 👪 *Espace parents*.
- [x] Accès discret réservé aux adultes : une multiplication à résoudre (6 × 6 à 9 × 9), valable 5 minutes — v41
- [x] Progrès par compétence : lecture, nombres, calcul, temps et mesures, formes, sciences, mémoire et logique → à l'aise / en cours / à travailler / pas encore joué — v41
- [x] Enregistrer les réussites et les erreurs par mini-jeu et par palier — v41
- [x] Temps de jeu actif par jour et par enfant (graphique des 7 derniers jours) — v41
- [x] Pause douce réglable par enfant (15 à 60 min) : « Perle est fatiguée, on revient demain ? » ; un adulte peut ajouter 10 min — v41
- [x] Y regrouper les réglages adultes : sauvegarde, prénom / âge / compagnon, remise à zéro — v41
- [ ] À observer : les seuils « à l'aise / à travailler » sont-ils justes avec les enfants ? (à noter dans les Notes de session)

### Phase 3 — Un jeu qui s'adapte à chaque enfant 🟠 ✅
Chaque mini-jeu a maintenant son propre niveau pour chaque enfant (`js/adaptive.js`).
- [x] Reproposer plus souvent (et un peu plus facile) ce qui est souvent raté : une fois sur deux, un jeu à travailler prend une place dans le choix et dans la Surprise ; après 2 missions ratées, le jeu redescend d'un cran — v42
- [x] Ne passer au palier suivant d'une compétence que lorsqu'elle est acquise : 2 réussites d'affilée presque sans erreur ; l'île et l'âge restent des plafonds — v42
- [x] Le compagnon encourage sur ce qui progresse (« Tu lis de mieux en mieux ! »), sur l'écran de victoire — v42
- [ ] À observer : la montée (2 réussites) est-elle trop rapide ou trop lente ? Les jeux à travailler reviennent-ils trop souvent ?

### Phase 4 — Plus de plaisir 🟢
- [x] Habiller son avatar : Sac → « 🎩 Mon look » — 10 chapeaux, 6 accessoires de visage, couleurs de tenue, capes de Zap ; achetés avec les pièces ou gagnés avec les missions — v43
- [ ] À observer : les prix (8 à 30 pièces) sont-ils bien réglés ? Faut-il plus d'objets à gagner ?
- [x] Offrir un objet à un personnage : il remercie (objet qui s'envole, cœurs, danse) ; 2 objets préférés par personnage, cœurs d'amitié, « meilleurs amis » à 5 cœurs, mission du jour « Offre 2 objets » — v47
- [x] Une petite histoire par île : un chapitre et une énigme en images à chaque nouvelle île, relisible dans « 📖 Mon histoire » — v40
- [ ] Faire avancer l'histoire aussi à chaque mission (pas seulement à chaque île)
- [x] Musique d'ambiance douce, activable : une ambiance par île, inventée en direct, qui baisse quand la voix parle ; bouton son (🎵) ou espace parents — v48
- [x] Décorations de saison : Halloween, Noël, anniversaire — île décorée, neige / feuilles / ballons, chapeaux de fête pour les compagnons, un cadeau par saison ; aperçu dans l'espace parents — v45
- [x] Mini-jeu « Assembler l'image » (« Le puzzle ») : 2×2 avec l'image en transparence, puis 3×3, puis 4×3 avec un modèle ; glisser du doigt ou toucher morceau puis case — v46

### Technique 🔧 (au fil de l'eau)
- [ ] Étendre les tests : mémoire complète jusqu'au bout, bouton son, chaque mini-jeu joué jusqu'à la victoire
- [ ] Tester sur de vrais appareils (iPhone, iPad, Android, ordinateur) à chaque grosse version
- [ ] Garder le design system à jour (https://claude.ai/artifact/C55xYvvT7iYZo6KcSphBbu)

---

## ✅ Fait

| Version | Ce qui a été livré |
|---|---|
| v1 | MVP : le Lagon, 3 personnages, 4 mini-jeux (mémoire, compter, intrus, puzzle), sac, marché |
| v2 | Sauvegarde, niveaux, difficulté progressive, butins, objet surprise, sons, confettis |
| v3 | Voix française, scène à décorer, « La suite magique », PWA hors-ligne, premier test automatique |
| v4 | Prénom et avatar, missions du jour et coffre, album de collection |
| v5 | « Répète après moi » (Simon), écran titre animé, dialogues qui parlent de la partie |
| v6 | Code découpé en fichiers, icônes, sauvegarde versionnée avec migration |
| v7 | 2e île : la Forêt |
| v8 | Carte des îles, la Montagne et le Château, difficulté liée à l'île |
| v9 | Carte dessinée, plusieurs joueurs, mode « chacun son tour », choix du mini-jeu |
| v10 | Mode course, âge par joueur |
| v11 | Jeu mixte : personnages garçons, 25 avatars, accords fille / garçon / neutre |
| v12–v14 | Interface épurée, boutons de 48 px minimum, essais limités, écran « Raté », animations, tous formats d'écran |
| v15–v16 | Opérations, lecture, petits mots (déterminants), grandeurs et volumes |
| v17–v20 | 5e île (la Jungle), correctif du cache, déterminants complets, comparer les nombres, la monnaie |
| v21–v22 | Choix de 2 ou 3 défis, variété forcée, jeux adaptés à l'âge (3-6 ans) |
| v23–v26 | Refonte graphique (design system), mini-jeux redessinés, 2 défis au choix |
| v27 | Difficulté centralisée et documentée, minuteur de fluence dès le palier 3 |
| v28 | Compagnons d'aventure dessinés (sirène, princesse, fée, pirate, chevalier, explorateur), tous les écrans |
| v29 | Animations de gain (objets vers le sac, pièces vers le compteur) |
| v30 | La Cité du Temps (l'heure, le calendrier) et le Volcan des Génies (calcul mental) |
| v31 | L'île vivante : paysages dessinés, décorations à placer du doigt, ciel selon l'heure |
| v32 | Le parcours entre les îles se voit sur la carte |
| v33 | Adaptation 3-4 ans, personnages selon le genre, anti-devinette, sons en jeu |
| v34–v35 | Les 28 personnages des îles dessinés en SVG, relus et corrigés |
| v36 | 8e île : le Pays Squishy et le mini-jeu « Formes et couleurs » |
| v37 | Zap le super-héros, compagnon et avatar dessinés |
| v38 | Mini-jeu « Les planètes », exact et adapté à l'âge |
| v39 | Sauvegarde et restauration (fichier, code de transfert), stockage protégé, invitation à installer, rappel de sauvegarde |
| v40 | L'Histoire du Lagon Magique : un chapitre et une énigme en images par île |
| v41 | Espace parents : accès adulte, progrès par compétence, temps de jeu, pause douce |
| v42 | Un jeu qui s'adapte : un niveau par mini-jeu et par enfant, ce qui est raté revient plus souvent, le compagnon encourage les progrès |
| v43 | Habiller son avatar : garde-robe « Mon look », 7 personnages dessinés comme avatars, capes de Zap |
| v44 | Icônes dessinées pour les barres du haut et du bas (identiques sur tous les appareils), barre du bas flottante aussi sur grand écran |
| v45 | Fêtes et saisons : Halloween, Noël, anniversaire (décor, chapeaux, cadeau), aperçu dans l'espace parents |
| v46 | Mini-jeu « Le puzzle » (assembler l'image) : 2×2, 3×3, 4×3, images dessinées des îles et des compagnons |
| v47 | Offrir un objet à un personnage : remerciements animés, objets préférés, amitié ; jeu en ligne sur GitHub Pages |
| v48 | Musique d'ambiance douce, une par île (Web Audio, sans fichier), coupée par défaut |

---

## 💡 Boîte à idées (non triées)
- Coffre au trésor quotidien à ouvrir au lancement (en plus du coffre des missions)
- Le compagnon grandit ou gagne des accessoires avec la progression
- Nouveaux mondes : banquise, village des lutins, fond des océans
- Un « livre des découvertes » qui garde les phrases à retenir des planètes et des autres jeux

---

## 📝 Notes de session
_(à remplir après chaque partie avec les enfants)_

| Date | Enfant | Ce qu'il a aimé | Ce qui a bloqué | Idée / demande |
|------|--------|-----------------|-----------------|----------------|
|      |        |                 |                 |                |
