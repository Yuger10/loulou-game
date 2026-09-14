# PRD — Le Lagon Magique (v1 HTML)

## 1. Vision
Un jeu mobile-friendly en HTML/CSS/JS où une fille de 6 ans explore un lagon peuplé d'une sirène, d'une licorne et d'une danseuse. Elle discute avec elles, résout des petits défis ("tests d'intelligence") pour valider leurs missions, gagne des objets, puis les vend, les échange ou les fusionne au marché pour créer de nouveaux objets.

## 2. Public cible
- Fille de 6 ans, lecture en cours d'acquisition (peu de texte, beaucoup d'icônes/emojis)
- Doit pouvoir jouer seule, au doigt, sur mobile
- Pas de compétition ni de "game over" : l'échec mène simplement à réessayer

## 3. Demande initiale (résumé)
- Un monde avec sirènes, licornes, danseuses ; on y discute, on y vend des objets (ex. scoubidous)
- Des tests d'intelligence pour réussir des missions et gagner des objets
- Les objets peuvent être échangés, vendus au marché, ou combinés pour créer un nouvel objet lui-même vendable

## 4. Réponses de cadrage (posées directement à elle)
| Question | Réponse |
|---|---|
| Quels personnages ? | Un peu de tout → sirène, licorne et danseuse toutes présentes |
| Quels mini-jeux ? | Mémoire (insisté explicitement), puzzle, compter, trouver l'intruse. Le dessin/coloriage n'a pas été retenu |
| Que faire des objets ? | Un peu de tout → vente, échange et fusion, toutes activées |

## 5. Boucle de jeu (game loop) v1
1. Elle touche un personnage (sirène / licorne / danseuse) sur l'écran principal
2. Le personnage propose une mission courte
3. Elle joue un mini-jeu tiré au hasard parmi les 4 types (mémoire, compter, intrus, puzzle)
4. Réussite → elle gagne un objet, ajouté à son sac
5. Au marché : elle vend un objet contre des pièces, l'échange contre un autre, ou combine plusieurs objets selon une recette pour créer un objet nouveau, vendable à son tour

## 6. Fonctionnalités v1 (MVP HTML, implémentées)
- **Écran Lagon** : 3 personnages (🧜‍♀️ Marina, 🦄 Étincelle, 💃 Luna), design coloré et tactile
- **Dialogues** : bulle de texte courte + bouton "Jouer"
- **4 mini-jeux** tirés au hasard à chaque mission :
  - Mémoire (retrouver les paires)
  - Compter (dénombrer et choisir le bon nombre)
  - Trouver l'intruse (repérer l'élément différent)
  - Puzzle simple (toucher les nombres 1→4 dans l'ordre)
- **Sac (inventaire)** : grille visuelle des objets possédés avec quantités
- **Marché** en 3 onglets :
  - Vendre (objet → pièces)
  - Échanger (objet → objet surprise différent)
  - Fusionner (2 recettes fixes combinant plusieurs objets en un objet nouveau, lui-même vendable)
- Pas de score pénalisant, pas de minuteur, boutons larges (mobile-first)

## 7. Hors scope v1
- Sauvegarde entre les sessions (état en mémoire uniquement pour l'instant)
- Multijoueur, comptes, achats réels
- Narration audio / voix
- Nouveaux décors ou personnages supplémentaires

## 8. Contraintes techniques
- Un seul fichier HTML/CSS/JS, sans dépendance lourde
- Mobile-first : grands boutons tactiles, aucune interaction au survol requise

## 9. Critères de succès v1
- Elle peut faire tout le cycle seule : mission → mini-jeu → objet → marché
- Les 4 mini-jeux et les 3 actions du marché fonctionnent au toucher sur mobile

## 10. Prochaines étapes possibles
- Tester avec elle, observer quel mini-jeu elle préfère réellement en usage
- Décider si on ajoute une sauvegarde de la progression
- Envisager un 2e décor ou de nouveaux objets/recettes selon son engagement

---

# v2 — Améliorations implémentées

## Progression
- **Sauvegarde automatique** (localStorage) : pièces, sac, niveau, réglage du son. Bouton « Recommencer à zéro » dans le sac.
- **Niveaux** : 1 niveau tous les 5 missions réussies, barre de progression sur l'écran Lagon, écran spécial « Niveau X ! ».
- **Difficulté progressive** selon le niveau :
  - Mémoire : 3 paires → 4 → 6
  - Compter : jusqu'à 7 → 9 → 10
  - Intruse : 6 → 8 → 9 éléments, intruse plus ressemblante (🐚/🐌, ⭐/🌟…) à partir du niveau 2
  - Puzzle : 4 → 5 → 6… nombres (max 8)

## Personnages
- Chaque personnage a **son propre butin** (Marina 🐚🦪, Étincelle ⭐💎, Luna 🎀🌸), affiché sur sa carte → elle apprend qui aider pour obtenir un ingrédient.
- 3 phrases de dialogue par personnage, tirées au hasard.
- 20 % de chance d'un **objet surprise** en bonus après une mission.
- Bouton « Encore une mission » sur l'écran de récompense ; jamais deux fois le même mini-jeu d'affilée.

## Marché
- 3 nouvelles recettes : 👑 Couronne étoilée, 🪄 Baguette magique, et 🏆 **Trésor du lagon** (recette de niveau 2 : combine des objets déjà fusionnés).
- Nouvel onglet **Acheter** : racheter un objet de base contre des pièces (prix ×2) pour compléter une recette.
- Prix de vente affiché sur les recettes.

## Ressenti / feedback
- **Sons** générés en Web Audio (aucun fichier) : tap, bonne réponse, erreur, victoire, pièces. Bouton 🔊/🔇 en haut.
- **Confettis** à chaque victoire et fusion, vibration sur mobile, animation de la pile de pièces.
- Mauvaise réponse : secousse + son doux, jamais bloquant.
- Bouton ✖️ pour quitter un mini-jeu ; badge sur « Mon sac » quand de nouveaux objets arrivent.
- Personnages légèrement animés sur l'écran Lagon.

---

# v3 — Voix, décorations, suite logique, PWA

- **Voix** (Web Speech API, fr-FR) : les dialogues, consignes des mini-jeux et félicitations sont lus à haute voix. Bouton 🔈 sur chaque bulle pour réécouter. Le bouton en haut cycle : 🗣️ sons + voix → 🔊 sons seuls → 🔇 silence.
- **Décorer mon lagon** : nouvelle scène sur l'écran principal + boutique de 10 décorations (🌴 🐠 🐬 🐢 🌈 🏰 ⛵ 🧚‍♀️ 🐚 🌙, de 8 à 40 pièces). Les pièces ont enfin un but ; chaque déco s'affiche animée dans le lagon.
- **5ᵉ mini-jeu « La suite magique »** : compléter une suite logique (AB, AAB, ABC, ABAC selon le niveau) — vrai test de logique adapté à 6 ans.
- **PWA** : `manifest.json`, icône, service worker → installable sur l'écran d'accueil, plein écran, fonctionne hors-ligne après la première visite.
- **Tests** : `npm test` lance un test de fumée jsdom qui parcourt tout le cycle (personnages → 5 mini-jeux → marché → décorations → sauvegarde).

---

# v4 — Prénom, missions du jour, album

- **Voix corrigée** : les emojis sont maintenant prononcés (« Combien y a-t-il d'étoiles ? » au lieu de « Combien y a-t-il de ? »), avec accord au pluriel et élision. Sélection automatique d'une voix féminine française la plus naturelle disponible (Audrey/Aurélie/Amélie/Google français en priorité, voix masculines exclues), pitch neutre pour un rendu moins robotique.
- **Profil** : écran de bienvenue au 1er lancement (prénom + 10 avatars au choix), pastille en haut à gauche pour le modifier. Les félicitations deviennent « Bravo Loulou ! », à l'écran et à la voix.
- **Missions du jour** : 3 objectifs tirés au hasard chaque jour (gagner N objets, jouer N fois avec un personnage, réussir N missions, fabriquer un objet, vendre au marché), affichés sur l'écran Lagon avec barre de progression ; coffre 🎁 à ouvrir (+15 pièces + un objet) quand les 3 sont faits.
- **Album 📖** : 4ᵉ onglet listant tous les objets et décorations, découverts vs « ❓ », avec compteur et barre de progression.

---

# v5 — Simon, écran titre, dialogues vivants

- **6ᵉ mini-jeu « Répète après moi » (Simon)** : 4 pastilles de couleur s'allument avec un son ; elle doit reproduire la séquence (3 étapes au niveau 1, jusqu'à 6). En cas d'erreur, la séquence est rejouée — jamais de « perdu ».
- **Écran titre animé** au lancement : titre, poissons qui traversent l'écran, les 3 personnages, bouton « Jouer » et salutation personnalisée. Sert aussi de geste utilisateur pour débloquer le son et la voix sur iOS.
- **Dialogues contextuels** : les personnages commentent la partie en cours — mission du jour en attente, stock d'objets (« Tu as déjà 4 coquillages, tu pourrais en vendre »), recette à un ingrédient près, lagon décoré, niveau atteint — avec une salutation au prénom.

---

# v6 — Chantier technique

- **Découpage du code** : `index.html` (markup) + `styles.css` + 6 modules JS (`data`, `state`, `ui`, `minigames`, `market`, `init`). Le fichier unique de 1880 lignes devenait impossible à maintenir. `lagon-magique.html` reste en place et redirige vers `index.html`.
- **Icônes PNG** 192 / 512 / 180 px (emoji 🧜‍♀️ sur fond dégradé lagon) : l'icône SVG emoji ne s'affichait pas sur tous les appareils. Manifest mis à jour (dont une icône `maskable` pour Android).
- **Sauvegarde versionnée** (`v: 1`) : fonction `migrate()` qui complète les parties créées avant le profil / l'album / les quêtes, et filtrage des clés inconnues pour qu'une sauvegarde corrompue ne bloque pas le jeu.
- **Service worker** mis à jour pour mettre en cache tous les nouveaux fichiers (hors-ligne conservé).

---

# v7 — La Forêt enchantée

- **2ᵉ monde débloqué au niveau 3** : des onglets « 🌊 Le Lagon / 🌲 La Forêt » en haut de l'écran principal ; l'onglet verrouillé affiche « 🔒 niv. 3 ». Le fond, les bulles et la scène changent d'ambiance (vert forêt).
- **3 nouveaux personnages** : Sylvie la fée 🧚‍♀️ (champignon, trèfle), Maïa la biche 🦌 (gland, miel), Hector le hibou 🦉 (plume, trèfle) — chacun avec ses dialogues.
- **5 nouveaux objets** : 🍄 Champignon, 🌰 Gland, 🪶 Plume, 🍯 Pot de miel, 🍀 Trèfle porte-bonheur.
- **4 nouvelles recettes** : 🎩 Chapeau de sorcière, 🧪 Potion magique, 🪺 Nid douillet, et 📖 Grimoire des bois (fusion de fusions, 45 pièces).
- **8 décorations forestières** : 🌲 🐿️ 🦊 🦔 🏡 ✨ 🦋 🐲 (le bébé dragon à 45 pièces). Chaque monde a ses propres décorations et sa propre scène.
- **Album par monde** + **récompense d'album complet** : +100 pièces et un écran spécial quand les 40 objets/décorations ont été découverts.
- Les quêtes du jour, les butins bonus et le coffre ne proposent que des objets des mondes déjà débloqués.
