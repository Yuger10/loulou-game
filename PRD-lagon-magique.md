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

---

# v8 — Carte des îles & mini-jeux enrichis

## Voyage entre les îles
- L'écran d'accueil affiche une **carte d'îles** défilante reliée par un chemin pointillé. Chaque île montre son numéro, son emoji, son nom, sa difficulté (⭐ à ⭐⭐⭐⭐) et les personnages qui l'habitent ; l'avatar de la joueuse marque l'île courante.
- Les îles verrouillées affichent 🔒 et le niveau requis ; un bandeau indique la progression vers la prochaine île.
- Quand une île se débloque, un écran « Nouvelle île ! » l'annonce (à la voix aussi) et propose d'y aller tout de suite.
- **4 îles** : 🌊 Le Lagon (niv. 1) → 🌲 La Forêt (niv. 3) → ⛰️ La Montagne (niv. 6) → 🏰 Le Château (niv. 10), chacune avec son ambiance visuelle.

## Nouvelles îles
- **⛰️ La Montagne des Nuages** : Zéphyr le dragon 🐉, Ariane l'aigle 🦅, Céleste la magicienne 🧙‍♀️ ; objets ☁️ 🔮 ⚡ ❄️ ; recettes 🎐 🌩️ et 🌠 Étoile filante ; 6 décorations.
- **🏰 Le Château des Étoiles** : Aurore la princesse 👸, Morgane la sorcière 🧙‍♀️, Comète le pégase 🦄 ; objets 💫 🗝️ 🕯️ 📜 ; recettes 🏮 🔱 et 🏰 Royaume des étoiles (70 pièces) ; 6 décorations.

## Difficulté par île
La difficulté des mini-jeux ne dépend plus du niveau mais de **l'île** (1 à 4) : mémoire 3→6 paires, compter jusqu'à 12, intruse 6→12 éléments, Simon 3→6 étapes, suites logiques jusqu'à ABBC, puzzles jusqu'à 7 nombres.

## Mini-jeux enrichis (demandes de la joueuse)
- **Simon** : chaque pastille a sa propre note (avec harmonique), jouée aussi bien pendant la démonstration qu'à chaque appui — même en cas d'erreur, pour pouvoir reconnaître les couleurs à l'oreille.
- **Trouve l'intruse** : nouvelle variante « miroir » où l'intruse est la **même image retournée**, à partir de l'île 2 (1 fois sur 3, puis 1 fois sur 2).
- **Petit puzzle** : les suites ne commencent plus toujours à 1 — départ variable (ex. 6 → 9), suite **décroissante** (7 → 4) et comptage **de 2 en 2** selon l'île.

---

# v9 — Carte dessinée, joueurs multiples, mode chacun son tour

## Carte des îles retravaillée
- Vraie carte marine : mer en dégradé avec **vagues animées**, nuages qui dérivent, poissons qui passent, reflets qui scintillent.
- Les îles sont **dessinées** (plage de sable + terre colorée + écume animée autour), pas de simples cartes : chacune a sa couleur, son relief et son icône (🌴 🌲 🏔️ 🏰), avec une étiquette « 1. Lagon ⭐ » et les visages de ses habitants.
- Une **route en pointillés** relie les îles ; la partie déjà parcourue est tracée en doré.
- Un **bateau ⛵ avec l'avatar** de la joueuse marque sa position. Quand elle choisit une autre île, le bateau **navigue d'île en île** avec un petit son à chaque escale avant de débarquer.

## Plusieurs joueurs
- **Profils multiples** : chaque joueur a son prénom, son avatar et **sa propre sauvegarde** (pièces, objets, îles, album, quêtes) — les parties sont totalement indépendantes.
- Panneau « 👥 Les joueurs » accessible par la pastille en haut : liste avec niveau/pièces/missions de chacun, ajout d'un joueur, réglages.
- **Réglages par joueur** : renommer, changer d'avatar, **recommencer à zéro**, supprimer le joueur (avec confirmation). Le bouton du sac ouvre directement ces réglages.
- Migration automatique : la partie existante devient le premier joueur.

## Mode chacun son tour
- Dans le panneau des joueurs : cocher 2 joueurs ou plus, puis **🎲 Chacun son tour** (ou 👤 Mode solo).
- Une **barre de tour** affiche les joueurs, met en avant celui qui joue et compte les 🏅 remportés.
- Le joueur dont c'est le tour **choisit le mini-jeu** ; en cas d'erreur, un écran « Oups ! On change » annonce (à la voix) le joueur suivant, qui reprend la partie en cours.
- Celui qui termine le défi gagne le point **et l'objet**, dans son propre sac.

## Choix du jeu
- Le dialogue d'un personnage propose « 🎮 Choisir un jeu » (grille des 6 mini-jeux) ou « 🎲 Surprise » (tirage au sort comme avant), en solo comme en mode tour par tour.

---

# v10 — Mode course de navigation (compétition équitable)

## Le principe
Un 3ᵉ mode, en plus de **👤 Solo** et **🎲 Chacun son tour** : **🏁 la Course**. Les joueurs s'affrontent sur une piste de 6 cases ; à chaque tour, celui qui joue choisit un mini-jeu, et **chaque réussite avance son bateau d'une case**. Une erreur passe la main au joueur suivant. Le premier à l'arrivée gagne **50 pièces** et le podium s'affiche (🥇🥈🥉).

## L'équité par l'âge
- Chaque joueur a désormais un **âge** (sélecteur 4 à 12 ans à la création ou dans ses réglages).
- En multijoueur, **la difficulté des mini-jeux suit l'âge du joueur qui joue**, pas l'île :
  | Âge | Difficulté |
  |---|---|
  | 4-5 ans | ⭐ |
  | 6-7 ans | ⭐⭐ |
  | 8-9 ans | ⭐⭐⭐ |
  | 10 ans et + | ⭐⭐⭐⭐ |
- Concrètement, une joueuse de 6 ans cherche 4 paires pendant qu'une de 10 ans en cherche 6, compte jusqu'à 7 au lieu de 12, répète 4 couleurs au lieu de 6 : **une petite peut gagner contre un grand**.
- La course refuse de démarrer tant qu'un des joueurs sélectionnés n'a pas d'âge renseigné, et propose de le compléter.

## Piste de course
- Une piste s'affiche sur l'écran principal : une ligne par joueur avec son avatar, son prénom, **son âge et sa difficulté en étoiles**, les cases franchies et son ⛵ qui glisse à chaque réussite.
- La ligne du joueur actif est surlignée, avec un rappel « 👉 Au tour de … ».
- À l'arrivée : écran de victoire, classement complet, et bouton « 🔁 Refaire une course ».

---

# v11 — Un jeu mixte, aussi pour les garçons

Le jeu était très connoté « fille » (sirène, licorne, danseuse, avatars et félicitations au féminin). Rééquilibrage sans rien retirer de l'existant :

## Personnages
Chaque île compte désormais **4 personnages, mixtes** :
| Île | Personnages |
|---|---|
| 🌊 Lagon | 🧜‍♀️ Marina · 🦄 Étincelle · 💃 Luna · **🏴‍☠️ Tiago le pirate** |
| 🌲 Forêt | 🧚‍♀️ Sylvie · 🦌 Maïa · 🦉 Hector · **🐺 Balto le loup** |
| ⛰️ Montagne | 🐉 Zéphyr · 🦅 Ariane · 🧙‍♀️ Céleste · **🤖 Bolt le robot** |
| 🏰 Château | 👸 Aurore · 🧙‍♀️ Morgane · 🦄 Comète · **🤴 Prince Tao le chevalier** |

## Avatars
25 avatars au lieu de 10 : 👦 🧒 👨‍🦰 🦸‍♂️ 🧙‍♂️ 🤴 🧜‍♂️ 🏴‍☠️ 🥷 🤖 🚀 🐉 🦖 🦁 ⚽ s'ajoutent aux avatars existants.

## Objets et décors d'aventure
- Nouveaux objets : 🧭 Boussole, 🪝 Grappin, 🦴 Vieil os, 🪨 Silex, 🔩 Boulon, 🛡️ Petit bouclier.
- Nouvelles recettes : 🗺️ Carte au trésor, 🏹 Arc des bois, 🤖 Robot des cimes, ⚔️ Épée du courage.
- Nouvelles décorations : 🦈 requin, 🏴‍☠️ bateau pirate, 🐙 poulpe, 🦖 dino, 🐺 loup, ⛺ campement, 🛸 soucoupe, 🚡 téléphérique, 🐉 dragon gardien, 🛡️ garde, 🏹 tour d'archers.
- Total : 25 objets de base, 19 recettes, 41 décorations.

## Langage
- **Choix « Comment on te parle ? »** à la création d'un joueur : 👧 Fille · 👦 Garçon · 🧒 Peu importe. Les félicitations s'accordent (« tu es trop fort/forte », « quel champion / quelle championne », « un vrai explorateur / une vraie exploratrice »), à l'écran comme à la voix.
- Formulations neutralisées ailleurs : le mini-jeu devient « Trouve l'**intrus** », l'écran titre « En route pour l'aventure ? ».
- L'écran titre montre maintenant 🧜‍♀️ 🏴‍☠️ 🦄 🤖 🐉.

---

# v12 — Interface épurée et navigation plus simple

L'écran d'accueil empilait tout (niveau, barre de tour, piste de course, carte, progression, titre d'île, quêtes, décor, personnages). Le jeu est réorganisé en **4 vues courtes**, une tâche par écran :

| Vue | Contenu |
|---|---|
| 🗺️ **Carte** | la carte des îles, la progression vers la prochaine île, et une fiche de l'île courante avec « 🏝️ Débarquer sur l'île » |
| 🏝️ **Île** | uniquement les 4 personnages, le décor et les missions du jour ; bouton « 🗺️ Carte » pour repartir |
| 🎒 **Sac** | onglets « Objets » et « Album » réunis (l'Album n'occupe plus une entrée de navigation) |
| 🏪 **Marché** | inchangé, avec des boutons plus larges |

## Navigation
- Barre du bas ramenée à **4 entrées**, boutons plus hauts (56 px), icônes plus grandes, onglet actif surligné.
- Toucher une île sur la carte fait naviguer le bateau **puis débarque automatiquement** sur la vue Île.
- Les **missions du jour** passent dans une pastille 📜 de la barre du haut, avec un badge (nombre de missions restantes ou 🎁 quand le coffre est prêt) ; elles restent consultables sur la vue Île.
- Les bandeaux multijoueur (tour par tour / course) ne s'affichent que lorsqu'une partie est en cours, dans une bande dédiée sous l'en-tête.

## Fenêtres plus accueillantes
- Poignée de glissement, **grande croix de fermeture**, fond assombri et flouté pour concentrer l'attention.
- Fermeture par la croix, la poignée, un clic à côté ou la touche Échap ; la voix s'arrête à la fermeture.
- Le contenu repart toujours du haut, le corps est isolé dans `#modal-body`.
- Dans les mini-jeux : titre centré, consigne plus grande avec bouton 🔈, **cases et boutons agrandis** (mémoire, nombres, intrus, puzzle, Simon), plus de respiration entre les éléments.

---

# v13 — Boutons plus grands, clics fiables, deck de jeu centré

## Pourquoi
Le pointeur « accrochait » mal : les îles de la carte flottaient (le bouton lui-même se déplaçait sous le curseur), plusieurs éléments cliquables n'étaient pas de vrais boutons, et beaucoup de cibles étaient trop petites.

## Clics fiables
- **La carte** : l'animation de flottement est passée du bouton à son contenu — la zone cliquable ne bouge plus. Chaque île a en plus une marge de sécurité autour d'elle.
- **Vrais boutons** : les cartes du jeu de mémoire et les images du jeu de l'intrus étaient des `div`/`span` ; ce sont désormais des `<button>` (clic fiable, navigation au clavier, libellés pour les lecteurs d'écran).
- Tous les éléments décoratifs (bulles, mer, route, bateau, confettis, toast) sont explicitement `pointer-events:none` et n'interceptent plus le clic.
- `touch-action:manipulation` partout : plus de délai de 300 ms au doigt.

## Comportement « cliquable » homogène
- **Curseur main** sur tout ce qui se clique, `not-allowed` sur ce qui est désactivé.
- **Survol souris** (uniquement sur écrans avec vrai pointeur) : léger éclaircissement et soulèvement de 2 px ; les îles s'illuminent, leur étiquette passe en doré.
- **Appui** : assombrissement immédiat, en plus des effets existants.
- **Focus clavier** visible (contour doré) mais invisible à la souris (`:focus-visible`).
- Respect de la préférence système « réduire les animations ».

## Cibles agrandies (minimum 48 px)
Boutons du marché, onglets, navigation (62 px), icônes de la barre du haut (48 px), croix de fermeture (46 px), boutons « écouter » (40 px), cases à cocher des joueurs, avatars, âges…

## Deck de jeu centré
- Les fenêtres de jeu ne montent plus du bas : elles apparaissent **au centre de l'écran**, en grande carte arrondie (jusqu'à 620 px de large), avec une animation d'apparition en zoom.
- **Le décor autour est flouté** (`backdrop-filter: blur(10px)`) et assombri en dégradé radial : toute l'attention va sur le jeu.
- Plateaux agrandis : cartes mémoire 84-96 px, images de l'intrus 72 px, nombres 84 px, pastilles Simon 120-136 px, textes et consignes plus grands.
- Adaptations automatiques pour les petits écrans en hauteur et les grands écrans.

---

# v14 — Erreurs qui comptent, animations, responsive

## 1. Des erreurs qui comptent à partir de l'île 2
Le clic au hasard jusqu'à tomber juste n'est plus possible.

- **Île 1 (Le Lagon)** : aucun compteur, on apprend sans pression — mais la mauvaise réponse se referme brièvement (impossible de marteler le même bouton).
- **Île 2 et au-delà** : des ❤️ d'essais apparaissent en haut du jeu.
  | Île | Essais | Mémoire | Simon |
  |---|---|---|---|
  | 🌲 Forêt | 3 | 5 paires ratées | 3 |
  | ⛰️ Montagne | 2 | 4 | 2 |
  | 🏰 Château | 1 | 3 | 2 |
- **Chaque mauvaise réponse est définitivement neutralisée** (grisée, barrée d'un ✖, non recliquable) : impossible de retenter la même.
- À court d'essais → **écran « Raté ! »** : pas de récompense, pas d'objet, mais un message encourageant et un bouton « 🔁 Réessayer ». Aucune sanction sur les pièces ou la progression.
- En multijoueur, la règle existante prime : une erreur passe la main au joueur suivant.

## 2. Animations de réussite et d'échec
- **Bonne étape** : la case pulse, s'entoure de vert, et une étoile ✨ s'envole vers le haut.
- **Mauvaise étape** : secousse, halo rouge, cœur qui se brise en 💔, tout le deck flashe en rouge.
- **Mission réussie** : rayons dorés tournants derrière l'emoji, apparition en rebond, tampon ✅ qui s'imprime, objet gagné qui glisse puis se balance, plus les confettis existants.
- **Mission ratée** : l'emoji tressaute et tout le deck tremble.
- Tout est désactivé si le système demande « réduire les animations ».

## 3. Contenu enfin responsive
- Le jeu n'est plus bloqué dans une colonne de 480 px : largeur adaptative (480 → 660 → 820 → 900 px selon l'écran), marges et titres en `clamp()`.
- **Grilles fluides** (`auto-fit`/`auto-fill`) pour les personnages, le sac, l'album, les avatars, les âges, les cartes mémoire et le choix des jeux.
- **Carte des îles** à hauteur proportionnelle (230 → 420 px).
- Cas particuliers traités : téléphone étroit (≤ 360 px), téléphone à l'horizontale, tablette (≥ 640 px), ordinateur (≥ 1024 px, le jeu devient une carte arrondie centrée avec ombre portée) et très grand écran.

---

# v15 — Opérations magiques (maths niveau CP)

## Nouveau mini-jeu
« ➕ Opérations magiques » rejoint la sélection : additions et soustractions illustrées avec des emojis (étoiles, coquillages, ballons…), pour apprendre le calcul sans se noyer dans l'abstraction des chiffres.

## Progression pensée pour le CP
| Île | Opération | Nombres jusqu'à |
|---|---|---|
| 🌊 Lagon | addition uniquement | 5 |
| 🌲 Forêt | + et − | 10 |
| ⛰️ Montagne | + et − | 15 |
| 🏰 Château | + et − | 20 |

- Les soustractions ne donnent jamais de résultat négatif.
- Chaque opération est illustrée par deux groupes d'emojis (ex. ⭐⭐⭐ + ⭐⭐) au-dessus de l'équation chiffrée, pour relier le symbole et la quantité.
- 3 réponses proposées, dont la bonne toujours présente.
- Essais limités comme les autres jeux à partir de l'île 2 (4 → 3 → 3 essais).
- La voix énonce l'opération en toutes lettres (« Combien ça fait, 3 plus 2 ? »).

## Intégration
- Nouveau fichier `js/math.js`, chargé après `minigames.js`.
- Ajouté à `GAME_TYPES` (tirage aléatoire) et à `GAME_LIST` (sélecteur manuel « 🎮 Choisis ton jeu »).
- `triesFor('math')` ajouté au système d'essais limités (v14).

---

# v16 — Lecture, déterminants, grandeurs & volumes (niveau CP)

> Pas d'accès internet dans l'environnement de développement : ces jeux s'appuient
> sur le programme officiel CP/CE1 français déjà connu (lecture de mots simples,
> genre des noms, grandeurs et mesures / solides usuels), sans vérification en ligne.

## 📖 Lecture magique
Entraînement à la lecture de mots simples (vocabulaire CP : animaux, nature, objets du quotidien), avec 38 mots illustrés (`WORDS_CP` dans `js/data.js`).
- **Île 1-2** : image affichée, l'enfant choisit le **mot écrit** correspondant (3 options) — association image/mot.
- **Île 3-4** : seul le **mot est affiché** (plus d'image), l'enfant doit le lire pour retrouver la bonne image parmi 4 — force la lecture réelle, pas la reconnaissance visuelle.

## 🔤 Les petits mots magiques (déterminants)
Choisir le bon déterminant devant un nom, règle simple et sûre du programme CP/CE1 :
- **« le »/« un »** devant un nom masculin singulier, **« la »/« une »** devant un nom féminin.
- Chaque manche tire au sort la famille testée (« le/la » ou « un/une »).
- **Île 1-2** : image + mot affichés, 2 options.
- **Île 3-4** : mot seul (sans image) + un 3ᵉ intrus de l'autre famille, pour renforcer la vigilance.

## 🧪 Grandeurs & volumes
Au CP on ne calcule pas de volume : le programme travaille les **grandeurs et mesures** (comparer des contenances) et la **reconnaissance des solides**.
- **Île 1-2** : « Touche celui qui contient LE PLUS/LE MOINS » — comparaison de deux contenants (verre/seau, tasse/baignoire…).
- **Île 3-4** : reconnaître la **forme en volume** d'un objet du quotidien parmi cube 🎲, boule ⚽, cylindre 🥫, cône 🍦, pavé 🎁 (3 puis 4 options).

## Intégration
- Nouveaux fichiers `js/reading.js`, `js/grammar.js`, `js/volume.js`, chargés après `js/math.js`.
- Vocabulaire partagé `WORDS_CP` ajouté dans `js/data.js` (mot + emoji + genre).
- Ajoutés à `GAME_TYPES` (tirage aléatoire) et `GAME_LIST` (sélecteur manuel, désormais **10 jeux + surprise**).
- Essais limités (`triesFor`) suivant le même barème que les autres jeux à partir de l'île 2.

---

# v17 — La Jungle Mystérieuse : une 5e île, le plus gros trésor à collectionner

## Nouvelle île : 🌴 La Jungle
- Débloquée au **niveau 14** (après le Château), difficulté 4 — le défi ultime en matière de mini-jeux, mais surtout **le plus grand nombre de choses à collectionner**.
- 4 personnages mixtes : 🧗‍♀️ Maya l'exploratrice, 🐒 Kiko le singe, 🦜 Iris la perruche, 🐆 Jago le jaguar.

## Le plus gros butin du jeu
- **8 objets à ramasser** (contre 5-7 pour les autres îles) : liane, masque tribal, bananes, fleur tropicale, noix de coco, ananas doré, scarabée doré, tambour sacré.
- **5 recettes** (contre 4-5 ailleurs) : totem mystérieux, couronne de fleurs, festin tropical, rythme de la jungle, et la recette ultime — le **temple caché** (combine les 3 premières, 65 pièces).
- **12 décorations** (le plus gros lot du jeu, contre 8-13 ailleurs) : toucan, singe, jaguar, serpent, grenouille dorée, palmier géant, cascade cachée, pont suspendu, temple ancien, papillon géant, coffre au trésor, statue totem.

## Intégration
- Entièrement data-driven : ajout dans `WORLDS`, `CHARACTERS`, `ITEMS`, `CRAFTED`, `DECOS` de `js/data.js` — aucune autre modification de code nécessaire (carte, marché, album, sac s'adaptent automatiquement).
- `WORLD_ORDER` suit désormais : lagon → forêt → montagne → château → **jungle**.

---

# v18 — Correctif : les nouveautés n'apparaissaient pas (cache PWA)

## Cause
Le service worker avait une liste de fichiers à mettre en cache (`FILES`) qui n'avait pas été mise à jour depuis plusieurs versions : `js/math.js`, `js/reading.js`, `js/grammar.js` et `js/volume.js` n'y figuraient pas. Sur un appareil ayant déjà visité le jeu (PWA installée ou simple visite), le navigateur pouvait continuer à afficher une ancienne version tant que l'onglet n'était pas complètement fermé/rouvert, même après un rechargement forcé.

## Correctifs
- `sw.js` : liste `FILES` complétée avec tous les nouveaux modules, cache renommé `lagon-v18`.
- `js/init.js` : le service worker vérifie désormais une mise à jour à chaque lancement (`reg.update()`) et, dès qu'une nouvelle version est installée, **recharge automatiquement la page** (`controllerchange` → `location.reload()`). Fini le besoin de deviner s'il faut vider le cache : la mise à jour est désormais automatique.
- CSS : le bouton « 🎲 Surprise » du sélecteur de jeu utilise `grid-column:1 / -1` (toute la largeur, quel que soit le nombre de colonnes) au lieu d'un `span 3` fixe, pour rester fiable avec la grille adaptative.

## Où trouver les nouveaux jeux
Dans le jeu : toucher un personnage → **« Choisir un jeu 🎮 »** → les 10 jeux (dont Opérations, Lecture, Petits mots, Volumes) + Surprise s'affichent dans une grille, avec défilement si besoin.
