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

---

# v19 — Déterminants complets : le/la/les, un/une/des

## Correctif
Le jeu des déterminants ne proposait que le/la et un/une (singulier uniquement). **"des" n'était pas pris en compte**, alors que c'est la forme plurielle de l'article indéfini, enseignée dès le CP avec un/une.

## Ce qui change
- Chaque mot de `WORDS_CP` a maintenant un **pluriel explicite** (gère les exceptions comme bateau→bateaux, cheval→chevaux, souris→souris).
- Le jeu tire au sort une manche au **singulier ou au pluriel**, et propose **toujours les 3 déterminants de la famille complète** :
  - famille définie : **le / la / les**
  - famille indéfinie : **un / une / des**
- Île 1-2 : image + mot, 3 options.
- Île 3-4 : mot seul (sans image) + un intrus de l'autre famille (4 options), pour renforcer la vigilance.

---

# v20 — Comparer les nombres & la monnaie magique

## ⚖️ Comparer les nombres
Programme CP : comparaison et rangement des nombres, symboles `<`, `>`, `=`.
- Deux nombres affichés côte à côte, l'enfant choisit le bon signe parmi les 3.
- Nombres qui grandissent avec l'île : jusqu'à 10 (Lagon) → 20 (Forêt) → 50 (Montagne) → 100 (Château/Jungle).
- Une égalité apparaît environ 1 fois sur 5, pour ne pas être oubliée.

## 💰 La monnaie magique
Prépare au calcul de monnaie (composer une somme avec des pièces de valeurs différentes), en réutilisant la pièce du jeu (🪙) déjà familière.
- Un prix est annoncé (ex. « Quelle pile de pièces vaut 7 ? ») avec un objet à acheter.
- 3 piles de pièces proposées (valeurs 1, 2, puis 5, 10, 20 selon l'île), une seule vaut exactement le prix.
- Valeurs disponibles : île 1 → {1,2}, île 2 → {1,2,5}, île 3 → {1,2,5,10}, île 4/5 → {1,2,5,10,20}.

## Intégration
- Nouveaux fichiers `js/compare.js`, `js/money.js`, chargés après `js/volume.js`.
- Ajoutés à `GAME_TYPES` et `GAME_LIST` (désormais **12 jeux + surprise**).
- Essais limités comme les autres jeux à partir de l'île 2.

---

# v21 — Seulement 3 défis proposés à chaque tour

## Pourquoi
Avec 12 mini-jeux, le sélecteur « Choisis ton jeu » montrait toute la liste à chaque fois : trop de choix, et toujours les mêmes jeux préférés revenaient. Le but est de tous les faire tourner et de garder la surprise.

## Changement
- `openGamePicker()` tire désormais **3 défis au hasard** (`GAME_PICKER_SIZE = 3`) parmi les 12 disponibles, plus le bouton 🎲 Surprise (qui lui tire parmi tous les types).
- Un nouveau tirage de 3 défis différents est proposé à chaque fois qu'on rouvre le sélecteur.
- Le bouton 🎲 Surprise reste disponible pour piocher dans toute la liste sans repasser par le sélecteur.

---

# v22 — Variété forcée des défis + adaptation à l'âge (3-6 ans)

## ⚠️ Correctif important au passage
`startMinigame()` (le bouton 🎲 Surprise) ne connaissait que les 6 premiers types de jeux : depuis la v15, les 6 nouveaux mini-jeux (Opérations, Lecture, Petits mots, Volumes, Comparer, Monnaie) retombaient tous silencieusement sur le puzzle des nombres au lieu d'être réellement lancés. Corrigé avec une fonction `gameRenderer(key)` résolue à l'appel (et non au chargement des scripts).

## 1. Un compteur de défis joués, par joueur
- `state.gameCounts` (nouveau champ de sauvegarde, `SAVE_VERSION` passé à 2 avec migration automatique) compte, **pour chaque joueur séparément**, combien de fois il a fait chaque type de mini-jeu.
- Le sélecteur « Choisis ton jeu 🎮 » ne propose plus que **3 défis tirés au sort** (plus Surprise) — et parmi tous les jeux possibles, il **favorise toujours les moins essayés** : les jeux jamais faits remontent systématiquement en tête de liste. Une fois tous les jeux testés au moins une fois, le tirage redevient équilibré.
- Le compteur est incrémenté à chaque lancement effectif d'un jeu, que ce soit via le sélecteur ou via Surprise.

## 2. Adaptation à l'âge (programme de maternelle, cycle 1, 3-6 ans)
> Pas d'accès internet dans l'environnement : repères issus du programme officiel de l'école maternelle que je connais (domaine « construire les premiers outils pour structurer sa pensée » et « mobiliser le langage »). À vérifier sur eduscol.education.fr si besoin de la source exacte.

- **3-4 ans (petite section)** : dénombrement très simple, reconnaissance visuelle uniquement → Mémoire, Compter, L'intrus.
- **5 ans (moyenne/grande section)** : + comparaison de grandeurs, suites simples, répétition de couleurs → Mémoire, Compter, L'intrus, Volumes (version « contenances »), La suite, Les couleurs.
- **6 ans et plus (CP)** : tout l'éventail du jeu, comme avant (12 mini-jeux) — ni lecture, ni déterminants, ni calcul formel, ni comparaison symbolique avant cet âge.
- Un joueur sans âge renseigné garde accès à tous les jeux (comportement inchangé).
- S'applique partout : tirage Surprise, sélecteur manuel, **et mode course** (chaque coureur reçoit des défis adaptés à son propre âge, pas seulement une difficulté chiffrée).

---

# v23 → v25 — Refonte graphique + 2 défis au choix

## Refonte graphique (design system « Le Lagon Magique »)
- Jetons de couleur, rayons et ombres partagés ; un thème de couleur par île (la Jungle a enfin le sien).
- Boutons « bonbons » plus contrastés, cartes personnages teintées avec halo, scène décorée en aquarium, carte des îles recadrée.
- Mini-jeux : consigne dans une bulle, plateau commun, réponses à tranche colorée, cartes mémoire décorées, vraies touches de couleur pour Simon, mauvaise réponse marquée d'un ✖ rouge bien visible.

## 2 défis au lieu de 3
- `GAME_PICKER_SIZE` passe à **2** : le sélecteur propose 2 grands défis (toujours les moins essayés en priorité) + 🎲 Surprise. Moins de choix, plus facile à lire pour une enfant de 6 ans.

---

# v27 — Analyse académique de la difficulté, 5e palier, minuteur de fluence

Voir **`ANALYSE-DIFFICULTE.md`** pour le détail complet (bugs trouvés,
raisonnement pédagogique, tableau des 5 paliers, proposition de
nouveaux mondes). Résumé :

- **Difficulté centralisée et documentée** : tous les paramètres numériques des 12 mini-jeux déplacés dans `js/difficulty.js`, avec le raisonnement pédagogique en commentaire pour chacun (référence au programme CP/CE1/CE2 français).
- **4 bugs corrigés** : pondération doublée par erreur dans le puzzle des nombres, progression irrégulière du nombre d'images dans « Trouve l'intrus », absence de graduation interne dans « Grandeurs & volumes », nombres toujours potentiellement trop éloignés dans « Comparer les nombres ».
- **Un vrai 5e palier de difficulté** : l'île Jungle passe de `diff:4` (identique au Château) à `diff:5` — elle offre maintenant un vrai cran de difficulté supplémentaire, pas seulement plus de butin.
- **Minuteur de réponse (fluence)**, à partir du palier 3 (Montagne), jamais avant 6 ans, jamais sur les jeux à plusieurs étapes (mémoire/Simon/puzzle), jamais en multijoueur, durée généreuse (13 à 26 secondes selon le jeu), temps écoulé traité comme une simple erreur encourageante (pas de pénalité supplémentaire).
- **Proposition de 2 nouveaux mondes** (non implémentés, à valider) : « Le Volcan des Génies » (CE2, calcul sans support imagé, tables de multiplication) et « La Cité du Temps » (lire l'heure, repères temporels).

---

# v28 — Compagnons d'aventure + tous les écrans

## Un compagnon pour chaque joueur
- 6 compagnons dessinés en SVG (`js/companions.js`), sans image externe : léger, net, identique sur iOS, Android et ordinateur.
  - Filles : **Perle** la sirène, **Rose** la princesse, **Lili** la fée.
  - Garçons : **Tom** le pirate, **Léo** le chevalier, **Sam** l'explorateur.
- Le profil (« Comment on te parle ? ») décide des compagnons proposés en premier et de celui présélectionné (fille → Perle, garçon → Tom) ; « Voir les autres compagnons » laisse toujours le libre choix.
- 6 humeurs : content, réfléchit, waouh, fête, oups, dodo. Il cligne des yeux.
- Il dit la consigne de chaque mini-jeu, fait « waouh » à une bonne étape, « oups » (encourageant) à une erreur, fait la fête à la victoire et console à l'échec. Il accueille le joueur sur l'écran titre.
- Choix à l'accueil, à la création d'un joueur et dans ses réglages (`profile.companion`). En multijoueur, chacun voit son propre compagnon.

## Ordinateur, tablette, mobile
- Ordinateur et tablette à l'horizontale : deux colonnes (carte + fiche de l'île, personnages + décor et missions), barre du bas toujours visible.
- iPhone : encoche et barre d'accueil respectées (`viewport-fit=cover`), hauteur d'écran réelle (`dvh`).
- Téléphone à l'horizontale : barre du bas compacte, mini-jeux sans défilement.
- PWA : l'orientation n'est plus bloquée en portrait (tablettes, Chromebooks).
- Correctif : les rayons de victoire n'affichaient qu'un seul rayon.

---

# v29 — Animations de gain

Ce que l'on gagne se voit arriver (`js/gains.js`) :
- **Mission réussie** : quand on ferme la fenêtre de récompense, l'objet gagné (et la surprise) s'envole en arc jusqu'au sac ; le sac rebondit, son badge saute.
- **Coffre du jour, album complet, course gagnée** : les pièces volent une à une jusqu'au compteur, qui monte au rythme de leur arrivée, avec un « +15 » qui s'envole ; l'objet du coffre file dans le sac.
- **Marché** : vendre → les pièces partent de l'objet vers le compteur ; acheter → les pièces quittent le compteur (« −4 ») puis l'objet file dans le sac ; échanger et fusionner → le nouvel objet file dans le sac.
- **Décoration achetée** : les pièces partent, la décoration s'envole vers la scène de l'île.
- Sons dédiés (« tick » par pièce, « pop » à l'arrivée dans le sac), anneau doré à l'arrivée.
- Le compteur affiché tient compte des pièces encore en vol (`coinsInFlight`) : il reste toujours juste. Sans animation possible ou avec « réduire les animations », tout se met à jour d'un coup.
- Correctif : « Tu as N pièces » dans l'onglet Acheter était blanc sur blanc depuis la v24.

---

# v30 — Deux nouveaux mondes : La Cité du Temps et Le Volcan des Génies

Mise en œuvre de la proposition de `ANALYSE-DIFFICULTE.md` § 5.

## 🕰️ La Cité du Temps (6e île, niveau 18)
Même palier numérique que la Jungle (palier 5) — ce monde n'ajoute pas
de nombres plus grands, mais deux compétences nouvelles :
- **Quelle heure est-il ?** : horloge à aiguilles dessinée en CSS (pas
  d'image). Heures pleines → demi-heures → quarts d'heure selon le palier.
- **Jours, mois, saisons** : reconnaissance d'une saison (accessible dès
  3-4 ans, aucune lecture nécessaire) puis, à partir du CP confirmé,
  remettre les jours de la semaine dans l'ordre. Jamais de minuteur.
- 4 personnages : Horace l'horloger, Clio la gardienne du temps, Tic le
  robot-coucou, Nocta la chouette des nuits.
- 7 objets, 5 recettes (dont 1 tier 2 : la Machine à remonter le temps),
  9 décorations.

## 🌋 Le Volcan des Génies (7e île, niveau 22)
**Le seul mini-jeu du jeu à aller jusqu'au palier 6** :
- **Calcul mental** : calcul sans aucun support imagé (contrairement au
  jeu « Opérations »), nombres jusqu'à 100, expressions à 3 termes,
  tables de multiplication (×2, ×5, ×10) à partir du palier 5.
- 4 personnages : Nova le génie, Léa la savante, Pyra la dragonne de
  lave, Max le robot savant.
- 6 objets, 5 recettes (dont 1 tier 2 : la Couronne du génie), 9 décorations.

## Intégration
- Nouveaux fichiers `js/clock.js`, `js/calendar.js`, `js/calc.js`.
- 3 nouvelles fonctions de difficulté dans `js/difficulty.js`
  (`clockGranularity`/`clockOptions`, `calendarUsesWeekdayOrder`/
  `calendarWeekdayCount`, `calcBounds`) — `calcBounds` est la seule à
  dépasser le palier 5, les autres jeux restent plafonnés à 5 sur ces
  deux îles.
- `gameTypesForAge` étendu : « saisons » dès 3-4 ans, + lecture de
  l'heure et calendrier dès 5 ans ; le calcul mental reste réservé à
  6 ans et plus (comme les autres jeux abstraits).
- 15 jeux au total désormais dans le sélecteur (+ Surprise).
- Entièrement data-driven (`WORLDS`/`CHARACTERS`/`ITEMS`/`CRAFTED`/`DECOS`
  dans `js/data.js`) : carte, marché, album, sac s'adaptent automatiquement.

---

# v31 — L'île vivante

La vue Île devient un paysage dessiné où vivent les personnages (`js/island.js`, `island.css`) :
- **Un paysage par île**, dessiné en SVG : plage, mer et palmier (Lagon), collines et sapins (Forêt), sommets enneigés (Montagne), château illuminé (Château), lianes et grandes feuilles (Jungle). Une île inconnue reçoit un paysage générique à ses couleurs (`sand`, `land` et jetons `--world-*`) : une nouvelle île est jolie sans rien faire de plus.
- **Les personnages vivent dans le paysage** : on les touche directement pour jouer. Une bulle au-dessus de chacun : 📜 mission du jour, ❤️ déjà aidé aujourd'hui (`state.helped`), 💬 il a envie de jouer.
- **Les décorations se posent où l'on veut** : on les fait glisser du doigt, leur place est gardée (`state.decoPos`). Par défaut, chacune va dans sa zone : arc-en-ciel et lune dans le ciel, dauphin et tortue dans l'eau, le reste sur le sol. Un simple toucher la fait se trémousser et dire son nom.
- **Le ciel suit l'heure réelle** : matin rosé, journée, coucher de soleil, nuit étoilée avec la lune.
- Les places sont exprimées en coordonnées du dessin et recalculées selon la taille de l'écran : tout reste au bon endroit sur téléphone, tablette, ordinateur et à l'horizontale.
- **Cité du Temps et Volcan des Génies** : paysages sur mesure (tour de l'horloge dont les aiguilles tournent, engrenages, toits et réverbères ; volcan qui fume, coulées de lave, fissures qui rougeoient) et thèmes de couleurs propres (`body[data-world="cite"|"volcan"]`), qui manquaient.
- **Carte à 7 îles** : 3 rangées en lacet (le Volcan, défi final, tout en haut à droite) ; étiquettes sur deux lignes (nom, puis étoiles ou niveau) ; plus aucune île ne sort du cadre ni n'en chevauche une autre.
- **Tests de garde** pour les prochains mondes : chaque monde a son thème `--world-*`, chaque île tient dans le cadre de la carte (x 14–86 %, y 15–85 %), aucune île n'en chevauche une autre.

---

# v32 — Le parcours entre les îles se voit

- La carte trace un vrai sentier entre les 7 îles, dans l'ordre des paliers de difficulté : une bande claire, de gros pointillés blancs, **dorés jusqu'à la dernière île débloquée** (et non plus jusqu'à l'île où l'on se trouve), et un tronçon animé qui avance vers la prochaine île à débloquer.
- Correctif : la partie dorée était découpée de gauche à droite (`clip-path`), ce qui ne suivait plus le chemin depuis la carte en lacet ; elle est maintenant un morceau du même tracé.


---

# v33 — Adaptation 3-4 ans, personnages selon le genre, anti-devinette + audio

## 1. Difficulté solo plafonnée par l'âge (correctif)
`gameDiff()` ignorait complètement l'âge en mode solo (seul le multijoueur
en tenait compte). Un enfant de 3-4 ans qui progressait jusqu'à l'île 2-3
(ça arrive vite : 10-25 missions) recevait quand même la difficulté
complète de cette île. Désormais, si l'âge est renseigné, il **plafonne**
la difficulté (jamais l'inverse : un enfant plus âgé qu'une île facile
n'est pas ralenti).

## 2. Voix ajoutée au Marché et à la Carte
Les écrans Sac/Vendre/Acheter/Échanger/Fusionner n'avaient **aucune voix** :
noms d'objets et prix étaient du texte pur, illisible pour un enfant qui
ne lit pas encore. Chaque ligne a maintenant un bouton d'écoute, et les
actions (vendu, acheté, échangé, créé) sont annoncées à voix haute. La
bannière « prochaine île » de la carte a aussi son bouton d'écoute.

## 3. Personnages adaptés au genre du joueur
Comme les compagnons, l'ordre d'affichage des 4 personnages de chaque île
met désormais en avant ceux du même genre que le joueur (`charsOfForPlayer`)
— sans jamais en retirer aucun : le butin et le contenu restent identiques,
seul l'ordre de présentation change. Un joueur sans genre renseigné garde
l'ordre d'origine.

## 4. Anti-devinette + audio pendant les mini-jeux (correctif important)
**Diagnostic en situation réelle** : avec seulement 2-3 choix et des essais
illimités à l'île 1, une mauvaise réponse ne faisait que désactiver
temporairement le bouton fautif puis le réactivait — l'enfant finissait
par trouver la bonne réponse **par élimination**, sans comprendre ce
qu'elle avait fait. Observé précisément sur « Grandeurs & volumes » et
« Quelle saison ? ».

- **Nouveau principe appliqué à tous les jeux à une seule étape** (compter,
  intrus, suite, opérations, lecture, déterminants, comparer, monnaie,
  heure, calcul mental, volumes, saisons) : une erreur relance désormais
  une **nouvelle question**, jamais la même à éliminer petit à petit.
- La relance est **annulable** (`clearPendingRetry`, même principe que le
  minuteur) : si la fenêtre se ferme ou qu'un autre jeu démarre avant la
  relance, elle ne réapparaît jamais par-dessus.
- **Audio ajouté pendant le jeu**, pas seulement au début : un encouragement
  parlé (« Regarde encore », « Essaie encore, tu vas trouver »…) à chaque
  erreur, sur tous les jeux. Pour « Quelle saison ? », les 3 noms proposés
  sont aussi annoncés à voix haute (sans révéler lequel est juste), pour
  relier le mot entendu à l'image vue.
- Les jeux à plusieurs étapes (mémoire, Simon, puzzle, ordre des jours)
  restent inchangés : y régénérer la question effacerait une progression
  déjà correcte, ce serait injuste.


---

# v34 — 28 personnages illustrés en SVG

- Les 28 personnages des sept îles ont chacun une illustration SVG originale intégrée au code, sans police emoji ni ressource externe. Le dessin reste identique sur iOS, Android et ordinateur.
- Silhouettes, accessoires et couleurs dominantes différencient les personnages : Tiago pirate, Marina sirène, Étincelle licorne, Luna danseuse ; Sylvie, Maïa, Hector et Balto ; Zéphyr, Ariane, Céleste et Bolt ; Aurore, Morgane, Tao et Comète ; Maya, Kiko, Iris et Jago ; Horace, Clio, Tic et Nocta ; Nova, Léa, Pyra et Max.
- Les visages reprennent les yeux, joues, bouche et traits des six compagnons SVG. Les illustrations sont affichées sur la scène vivante, la carte, la fiche d'île, les dialogues et l'écran d'échec. Les emojis d'objets des cartes mémoire restent inchangés.
- Nouveau module `js/characters-art.js` et feuille `characters.css`; cache PWA passé à `lagon-v34` (puis `lagon-v35` pour la relecture).
- Tests de garde : couverture des ids, viewBox, taille maximale, éléments et attributs interdits, rendu de la scène et repli emoji pour un id inconnu.
- **Relecture et corrections** :
  - visages dégagés (les ailes de Sylvie, Zéphyr et Pyra passaient devant) ;
  - vraies têtes de dragons (museau, cornes, crête de nuage ou de flammes) ;
  - Ariane en aigle (tête blanche, bec crochu, ailes déployées), Iris en perruche (masque jaune, joues bleues, longue queue), Nocta en chouette (disque facial, grands yeux dorés, lune sur le ventre) ;
  - Comète et Étincelle en chevaux (museau, crinière ; ailes pour le pégase, corne et crinière arc-en-ciel pour la licorne) ;
  - Max en robot à tête de dôme et lunettes de labo, pour ne plus ressembler à Bolt.
- Personnages plus grands sur l'île vivante (au moins la taille des anciens emojis) ; places écartées pour qu'aucune bulle ne cache le nom d'un voisin.
- Les fonctions de dessin sont enfermées dans `CHAR_ART` : plus de noms globaux génériques (`face`, `robot`…).

---

# v36 — Le Pays Squishy (8e île) et le mini-jeu « Formes et couleurs »

## L'île
- **Le Pays Squishy** 🍡 : 8e île, débloquée au niveau 26, juste après le Volcan. C'est la récompense finale, un monde tout doux. Palier 6 (comme le Volcan).
- Paysage dessiné : collines de guimauve, arc-en-ciel, nuages moelleux, sucettes géantes qui se dandinent, bonbons. Thème de couleurs pastel (`body[data-world="squishy"]`).
- 4 personnages dessinés en SVG, le visage sur le corps comme de vrais squishies : **Mimi** la chatte mochi, **Pépito** le donut, **Avo** l'avocat, **Bulle** la petite phoque.
- 6 objets (mochi, donut rose, cupcake, bonbon, sucette, peluche), 5 objets à fabriquer (dont le *Cœur des câlins*), 5 décorations (glace géante, ours en guimauve, flan, ballons, gâteau château).
- Carte à 8 îles : 3 rangées en serpentin (Lagon → Forêt → Montagne, puis Château → Jungle → Cité, puis Volcan → Squishy).

## Le mini-jeu « Formes et couleurs » (`js/shapes.js`)
- « Touche tous les… » : on trie des squishies (formes moelleuses avec un visage) en touchant **tous** ceux qui répondent à la consigne. Ils s'écrasent un peu quand on les touche (squish !).
- Progression du programme (cycle 1 « Explorer des formes », puis cycle 2 « Espace et géométrie »), réglée dans `shapesRound` (`js/difficulty.js`) :
  1. une couleur (« tous les squishies roses ») ;
  2. une forme (« toutes les étoiles ») ;
  3. forme et couleur (« tous les cœurs bleus ») ;
  4. taille et forme (« tous les petits triangles ») ;
  5. nombre de côtés (« les formes qui ont 4 côtés ») ;
  6. nombre de sommets (« les formes qui ont 6 sommets »).
- La consigne montre la couleur ou la forme attendue en image pour un enfant qui ne lit pas encore (sauf aux paliers 5-6, où compter est l'exercice). Accords en français (toutes les étoiles jaunes, tous les grands ronds).
- Ouvert dès 3 ans (formes et couleurs sont au programme de petite section). Pas de minuteur ; essais généreux.
- Sur l'île Squishy, le choix du jeu propose toujours « Formes et couleurs » (`WORLDS[id].game`).
- Cache `lagon-v36`.

---

# v37 — Zap le super-héros (compagnon et avatar dessinés)

- **Zap le super-héros** : 7e compagnon dessiné (combinaison bleue, cape orange, éclair doré, petit masque troué qui laisse voir les yeux et l'expression). Proposé aux garçons avec Tom, Léo et Sam ; libre pour tous via « Voir les autres compagnons ».
- **Avatar dessiné** : on peut aussi le choisir comme avatar (valeur `art:zap`). Il s'affiche en image en haut de l'écran, sur le bateau de la carte, dans la liste des joueurs, au passage de tour et dans la course. Dans le texte simple (notifications, voix), il devient l'emoji 🦸‍♂️ (`avatarText`). Mécanisme générique : `art:<id>` pour tout compagnon dessiné.

---

# v38 — Mini-jeu « Les planètes »

Un quiz illustré sur le Soleil, la Lune, la Terre et les 8 planètes (`js/planets.js`).

## Adapté à l'âge (palier de l'île, plafonné par l'âge de l'enfant)
1. GS/CP : reconnaître le Soleil, la Lune, la Terre ; quand voit-on les étoiles.
2. CP : on habite sur la Terre ; le Soleil est une étoile qui produit sa lumière ; la Lune tourne autour de la Terre.
3. CE1 : reconnaître les planètes (anneaux de Saturne, Mars la rouge, tache de Jupiter, la Terre bleue).
4. CE1/CE2 : la plus proche, la plus éloignée, la plus grande, la plus petite ; celle qui suit la Terre.
5. CE2 : 8 planètes ; 1 jour, 1 an ; pourquoi le jour et la nuit ; Vénus la plus chaude ; la Lune est un satellite.
6. CE2/CM1 : l'ordre des planètes (4 voisines à remettre dans l'ordre), planètes rocheuses et géantes, Uranus couchée sur le côté.
- Proposé à partir de 5 ans seulement. Pas de minuteur.

## Exactitude scientifique
- Les réponses sont calculées à partir d'un tableau de données (ordre, diamètre, température moyenne, d'après la NASA), jamais écrites à la main ; des tests vérifient chaque question.
- 8 planètes (Pluton est une planète naine depuis 2006) ; Vénus est la plus chaude, pas Mercure ; Saturne a de grands anneaux « bien visibles » (pas « la seule à anneaux ») ; le jour et la nuit viennent de la rotation de la Terre.
- Dessins pas à l'échelle : toutes les planètes ont le même diamètre à l'écran, pour qu'aucune image ne donne une fausse taille.
- Après une bonne réponse, une phrase vraie à retenir est affichée et lue sur l'écran de victoire (`missionFact`).

---

# v39 — Ne rien perdre : sauvegarde, restauration, installation

Toute la partie vit dans le stockage du navigateur. Safari peut l'effacer après 7 jours sans visite si le jeu n'est pas installé, et changer d'appareil faisait tout perdre (`js/backup.js`).
- **Sauvegarde** : panneau des joueurs → 💾 *Sauvegarde* → un fichier `lagon-magique-sauvegarde-AAAA-MM-JJ.json` avec tous les joueurs et leur progression (feuille de partage sur téléphone : « Enregistrer dans Fichiers », message…, sinon téléchargement).
- **Code de transfert** : un code à copier-coller pour passer sur un autre appareil, compressé quand le navigateur le permet (environ 800 caractères pour 2 joueurs).
- **Restauration** : depuis un fichier ou un code ; vérification (bon jeu, données lisibles, aucune clé étrangère), aperçu des joueurs et de leurs missions, confirmation ; une copie de la partie remplacée est gardée et peut être rétablie.
- **Stockage protégé** : demandé au navigateur au premier toucher (`navigator.storage.persist`).
- **Installer le jeu** : petit message sur la carte (masquable) et explications dans la fenêtre Sauvegarde (étapes Safari sur iPhone/iPad, bouton « Installer » sur Android et ordinateur).
- **Rappel** : un point doré sur le bouton du joueur et « Sauvegarde · à faire » quand la dernière sauvegarde a plus de 2 semaines (ou jamais, après 5 missions).
- Limite : en `http://` (depuis le Mac par le Wi-Fi), le navigateur désactive hors-ligne et stockage protégé ; d'où la mise en ligne en `https://` prévue dans la feuille de route.

---

# v40 — L'Histoire du Lagon Magique

Un fil narratif relie les huit îles (`js/story.js`) : à chaque nouvelle île, un ami raconte un petit bout d'histoire (lu à voix haute) puis pose une énigme en images, une seule fois par île, avec des pièces en plus. Les chapitres se relisent depuis « 📖 Mon histoire » dans l'en-tête.

---

# v41 — Espace parents

Réservé aux adultes : panneau des joueurs → 👪 *Espace parents* (`js/parents.js`).
- **Accès** : une multiplication à résoudre (de 6 × 6 à 9 × 9) ; l'accès reste ouvert 5 minutes.
- **Un onglet par enfant**, avec :
  - **Temps de jeu** : aujourd'hui, moyenne des jours joués, graphique des 7 derniers jours. Seul le jeu *actif* compte (un toucher dans les 90 dernières secondes, écran visible, hors écran titre) ; 60 jours gardés.
  - **Pause douce** : pas de pause, ou après 15, 20, 30, 45, 60 minutes de jeu dans la journée. Ensuite, plus de nouveau défi jusqu'au lendemain : le compagnon s'endort (« Perle est fatiguée : on fait une pause et on revient demain ? », accordé fille / garçon) ; l'île, le sac et l'album restent ouverts ; jamais au milieu d'une mission ; pas en mode à plusieurs. Un adulte peut ajouter 10 minutes (après la multiplication).
  - **Progrès par compétence** : les mini-jeux rangés en 7 compétences (lecture et langage, nombres, calcul, temps et mesures, formes et espace, sciences, mémoire et logique), seulement ceux proposés à l'âge de l'enfant. Pour chaque jeu : missions réussies et ratées, erreurs par mission, niveau atteint, et un état calculé sur les 6 dernières missions :
    - *À l'aise* : au moins 3 missions, aucune ratée, 0,5 erreur par mission au plus ;
    - *À travailler* : au moins un tiers de ratées, ou 1,5 erreur par mission ou plus (au mémo, retourner deux cartes différentes fait partie du jeu : seuil 3 fois plus haut) ;
    - *En cours* entre les deux ; *Pas assez joué* sous 2 missions ; *Pas encore joué*.
  - **Réglages** : sauvegarde, prénom / âge / compagnon / remise à zéro.
- **Données** (dans la partie de chaque enfant, donc dans la sauvegarde) : `skills[jeu] = { wins, fails, errors, last, recent[10] }`, `playTime[jour]` en secondes, `pauseExtra`. Le réglage `pauseMin` est dans le profil. Une erreur = un essai perdu (`loseLife`, minuteur compris). À plusieurs, une erreur passe la main : rien n'est compté.
- **Correctif** : une ancienne partie à laquelle il manquait une donnée recevait l'objet *par défaut* lui-même, partagé avec les autres joueurs ; elle reçoit maintenant sa propre copie.
- Cache `lagon-v41`.

---

# v42 — Un jeu qui s'adapte à chaque enfant

Avant, changer d'île suffisait à rendre tous les mini-jeux plus difficiles, même un jeu jamais réussi. Désormais chaque mini-jeu a son propre niveau, pour chaque enfant (`js/adaptive.js`, branché sur `gameDiff()`).
- **Niveau joué** = le plus petit entre le palier de l'île (plafonné par l'âge) et le niveau acquis dans ce jeu. L'île et l'âge restent des plafonds.
- **Premier essai d'un jeu** : un cran sous l'île, pour se placer (niveau 1 au minimum). Les enfants qui jouaient déjà repartent donc un cran plus bas dans chaque jeu, et remontent dès 2 réussites.
- **Monter** : 2 missions réussies d'affilée à ce niveau, avec au plus 1 erreur chacune (3 au mémo). Le niveau du calcul mental, des formes et des planètes va jusqu'à 6, les autres jusqu'à 5. Les missions jouées sur une île plus facile ne comptent pas pour monter.
- **Redescendre (« soutien »)** : 2 missions ratées sur les 3 dernières à ce niveau → un cran plus facile ; on remonte ensuite de la même façon.
- **Ce qui est à travailler revient plus souvent** : une fois sur deux, un jeu « à travailler » ou redescendu prend une des deux places du choix des jeux, et la Surprise le choisit ; jamais deux fois de suite le même jeu.
- **Le compagnon encourage** : quand un jeu monte d'un niveau, ou n'est plus « à travailler », l'écran de victoire affiche et dit une phrase propre au jeu (« Tu lis de mieux en mieux ! », « Tu comptes de mieux en mieux ! »…), valable pour une fille comme pour un garçon.
- **À plusieurs** (chacun son tour, course) : rien ne change, chacun joue à la difficulté de son âge.
- **Espace parents** : le niveau affiché est celui du jeu, avec « redescendu d'un cran pour s'entraîner » quand c'est le cas, et l'explication des règles.
- Données dans la partie de l'enfant : `skills[jeu].lvl`, `atLvl` (3 dernières missions à ce niveau), `support`.
- Cache `lagon-v42`.

---

# v43 — Habiller son avatar

Sac → onglet **« 🎩 Mon look »** (`js/wardrobe.js`). Chaque enfant habille son avatar, et le retrouve habillé partout : en haut de l'écran, sur le bateau de la carte, dans la liste des joueurs, au passage de tour et dans la course.
- **Tête** (10) : nœud, casquette, bonnet à pompon, oreilles de chat, couronne de fleurs, chapeau de magicien, chapeau de pirate, couronne dorée ; à gagner : antennes rigolotes (25 missions), couronne d'étoiles (60 missions).
- **Visage** (6) : lunettes rondes, moustache rigolote, lunettes de soleil, lunettes cœurs, masque de héros ; à gagner : joues étoilées (10 missions).
- **Tenue** (personnages dessinés) : rouge, verte, violette, rose, noire ; dorée à gagner (40 missions).
- **Cape** (Zap) : rouge, verte, violette, rose, noire ; dorée à gagner (40 missions).
- **Prix** : 8 à 30 pièces. On essaie avant d'acheter (aperçu en grand, nom et prix lus à voix haute) ; s'il manque des pièces, le jeu dit combien. Les objets à gagner arrivent tout seuls à la bonne mission, annoncés sur l'écran de victoire.
- **Personnages dessinés comme avatars** : en plus de Zap, Perle, Rose, Lili, Tom, Léo et Sam. Un chapeau remplace leur couvre-chef d'origine (couronne, casque…) ; des lunettes remplacent le masque de Zap.
- **Avatars emoji** : chapeaux et lunettes se posent sur les visages (enfants, lion, chat, robot). Les autres (fusée, drapeau, héros en pied…) gardent leur dessin ; « Mon look » propose alors de choisir un visage ou un personnage dessiné.
- Le compagnon le suggère (« Avec tes pièces, tu peux habiller ton avatar… ») quand l'enfant a des pièces et ne porte encore rien.
- **Correctif** : « 👧‍🦱 » et « 👦‍🦱 », qui ne sont pas des emoji standard et s'affichaient en deux morceaux sur beaucoup d'appareils, deviennent « 👩‍🦱 » et « 👨‍🦱 » (parties existantes mises à jour).
- Données : `state.wardrobe` (objets achetés), `state.look` = { tete, visage, tenue, cape }, recopié dans le profil (`profile.look`).
- Cache `lagon-v43`.

---

# v44 — Mêmes icônes sur tous les appareils

Retour du test sur tablette : la barre du bas ne ressemblait pas aux captures, ses icônes étaient de « vieux emoji ». Les emoji sont dessinés par chaque appareil (Apple, Google…) et une tablette ancienne garde d'anciens dessins.
- **Icônes dessinées en SVG** (`js/icons.js`) pour la barre du bas (Carte, Île, Sac, Marché) et la barre du haut (missions, histoire, son — voix / sons / silence —, pièces) : identiques sur iPhone, iPad, Android et ordinateur, dans le style du design system (contour encre, couleurs bonbon).
- **Barre du bas flottante partout** : sur grand écran et tablette à l'horizontale, elle garde ses coins arrondis comme sur téléphone.
- Dans le contenu du jeu (objets, personnages emoji…), les emoji restent ceux de l'appareil.
- Cache `lagon-v44`.

---

# v45 — Fêtes et saisons : Halloween, Noël, anniversaire

Le jeu se met tout seul aux couleurs du moment (`js/seasons.js`) :
- **Halloween** du 20 octobre au 2 novembre, **Noël** du 1er décembre au 6 janvier, et **l'anniversaire** de l'enfant (jour et mois facultatifs dans ses réglages ; ce jour-là, il passe avant les autres fêtes).
- **Sur l'île** : sapin décoré, cadeaux, bonhomme de neige et neige au sol ; citrouilles souriantes et chauves-souris ; guirlande de fanions, ballons et gâteau aux bougies. Placés au centre du paysage, visibles aussi sur un téléphone en portrait.
- **À l'écran** : de la neige, des feuilles d'automne ou de petits ballons passent doucement, sous les fenêtres (jamais pendant un mini-jeu) et jamais si l'appareil demande moins d'animations.
- **Les compagnons** portent le chapeau de la fête : bonnet de Noël, chapeau de sorcière, chapeau de fête (sauf si l'avatar porte déjà un chapeau de sa garde-robe).
- **L'écran titre** souhaite la fête (« Joyeux Noël Adam ! ») et la voix le dit.
- **Un cadeau par fête et par enfant** : le chapeau de la fête pour son avatar (gardé dans « Mon look ») et 10 pièces (20 pour l'anniversaire), avec « Le mettre tout de suite ».
- **Espace parents → Fêtes et saisons** : explications et **aperçu** de chaque fête (jusqu'à la fermeture du jeu, sans cadeau) ; aussi avec `?saison=noel` dans l'adresse.
- Données : `state.seasonGifts` (ex. `noel-2026`), `profile.birthday` (« MM-JJ »). Les tests forcent « pas de saison » pour rester identiques toute l'année.
- Cache `lagon-v45`.

---

# v46 — Mini-jeu « Le puzzle » (assembler l'image)

Un vrai puzzle (`js/jigsaw.js`), proposé dès 3 ans, rangé dans la compétence « Formes et espace ».
- **L'image** : le paysage dessiné d'une île déjà découverte, avec un compagnon en grand au premier plan (7 compagnons × 8 îles), plus de petits détails (oiseaux, papillon, fleurs, champignon, buisson) placés pour que **chaque morceau soit différent**, quelle que soit la découpe. Dessinée une seule fois (un symbole SVG), chaque morceau en montre une partie : identique sur tous les appareils, rien à télécharger.
- **Jouer** : glisser un morceau du doigt (ou à la souris) jusqu'à sa case, ou toucher le morceau puis la case (plus facile pour les petits). Un morceau mal placé revient dans la réserve. Les morceaux ne sont jamais déjà dans l'ordre.
- **Paliers** (`jigsawRound`) : 1) 2×2 avec l'image en transparence ; 2) 2×2, transparence légère ; 3) 3×3, transparence légère ; 4) 3×3 avec un petit modèle à côté ; 5) 4×3 (12 morceaux) avec le modèle. Suit le niveau propre au jeu (v42), plafonné par l'île et l'âge.
- **Essais** généreux (comme le mémo) à partir de l'île 2 ; pas de minuteur.
- **Mise en page** : le cadre s'ajuste à la hauteur de l'écran et la réserve tient sur une ou deux rangées, pour que cadre et morceaux soient visibles ensemble (glisser sans faire défiler) ; vérifié sur iPhone et iPad, glisser compris.
- Cache `lagon-v46`.

---

# v47 — Offrir un objet à un personnage

Le sac sert à faire plaisir (`js/gifts.js`). Dans le dialogue d'un personnage : **« 🎁 Offrir un objet »**.
- **Choisir** un objet du sac (nombre affiché). L'objet **s'envole** jusqu'au personnage, qui **danse**, fait jaillir des **cœurs** et remercie à voix haute.
- **Objets préférés** : chaque personnage en a 2 (💖), pris parmi les objets de SON île qu'il ne donne pas lui-même : il faut jouer avec ses voisins pour les trouver. Il le dit parfois (« Mes cadeaux préférés ? Boussole 🧭 et Étoile ⭐ ! ») et l'écran du cadeau le rappelle. Un préféré vaut 2 cœurs, un autre objet 1.
- **Amitié** : jusqu'à 5 cœurs, visibles sous son nom. À 5 cœurs, « Tu es mon meilleur ami / ma meilleure amie ! » et une surprise de 10 pièces (une seule fois par personnage) — pas plus qu'en vendant l'objet au marché, pour que ce soit un geste et pas une affaire.
- **Mission du jour** possible : « Offre 2 objets à tes amis 🎁 ».
- Données : `state.friends[perso]` (points), `state.friendRewards[perso]`.
- **En ligne** : le jeu est publié sur https://yuger10.github.io/loulou-game/ (GitHub Pages), en `https://` : hors-ligne, installation et stockage protégé fonctionnent. Phase 1 terminée.
- Cache `lagon-v47`.

---

# v48 — Musique d'ambiance douce

`js/music.js` : une petite musique inventée en direct avec le Web Audio (aucun fichier à télécharger, marche hors ligne).
- **Une ambiance par île** : gamme, tempo et instrument — marimba au Lagon, flûte en Forêt, clochettes en Montagne, harpe au Château, pincé rythmé (avec un petit hochet) dans la Jungle, clochettes et tic-tac à la Cité du Temps, gamme mineure au Volcan, bulles au Pays Squishy. À Noël des clochettes, à Halloween une gamme mineure.
- **Composition** : 4 accords tenus très doucement (filtrés), une basse, et une mélodie tirée au hasard dans une gamme pentatonique (jamais de fausse note), avec des silences : elle ne se répète jamais tout à fait.
- **Discrète** : crête d'environ 0,11 (les bruitages vont de 0,2 à 0,35) ; elle **baisse d'elle-même quand la voix parle**, s'arrête quand le jeu passe en arrière-plan et reprend au retour ; elle démarre après « Jouer » (le toucher qui débloque le son sur iPhone).
- **Réglage** : coupée par défaut. Le bouton son de l'enfant fait le tour : 🗣️ sons + voix → 🔊 sons seuls → 🔇 silence → 🎵 musique + sons + voix. Espace parents → Réglages : « Musique d'ambiance » / « Pas de musique », pour chaque enfant.
- Tests avec un faux moteur audio (notes programmées, changement d'île, arrêt en silence) ; extrait rendu hors ligne dans Chromium pour vérifier le volume.
- Cache `lagon-v48`.

---

# v49 — L'histoire avance à chaque mission ; les poissons nagent dans le bon sens

## Épisodes (`js/episodes.js`)
Entre deux chapitres (un par île), il se passait 10 à 20 missions sans rien de nouveau dans l'histoire. Chaque île a maintenant **3 épisodes** — 24 petites scènes en deux phrases, racontées par les autres habitants de l'île (jamais le guide du chapitre), qui suivent le fil de la chasse au trésor et annoncent l'île suivante :
- Lagon : la bouteille à la mer (« Le trésor dort là où les huit îles se donnent la main »), l'étoile filante, la danse des vagues ;
- Forêt : des traces qui brillent, **la petite clé dorée**, le vent des montagnes ;
- Montagne : la grotte aux cristaux, le vieux parchemin (un château), la boule de cristal ;
- Château : le tour des tours, **la clé de la forêt ouvre la fenêtre de la tour** (une carte de la jungle), la gentille sorcière ;
- Jungle : la noix de coco qui fait tic-tac, l'horloge cachée, le chemin secret ;
- Cité du Temps : l'horloge rapportée, le secret du temps, la nuit du volcan ;
- Volcan : la lave qui chante « dou-ceur », la pierre de feu, le mot mystère ;
- Pays Squishy : tout est tout doux, le coffre aux huit serrures, le vrai trésor (« tout ce que tu as appris en chemin »).

Fonctionnement :
- un épisode arrive **après la 2e, la 4e et la 7e mission réussie sur l'île** (en solo), juste après l'écran de victoire (après la nouvelle île s'il y en a une) ;
- l'écran de victoire montre que **l'histoire avance** (●●○) ;
- chaque épisode fait trouver un objet de l'histoire et **3 pièces** ;
- **« 📖 Mon histoire »** : sous chaque chapitre, les épisodes vus (à relire, sans regagner de pièces) et ceux à venir (🔒).
- Données : `state.storyMissions[île]`, `state.storyEpisodes[île]`.

## Écran d'accueil
Les poissons nageaient de gauche à droite alors que les emoji 🐠 🐟 🐢 regardent vers la gauche sur iPhone et iPad : ils semblaient reculer. Ils sont maintenant **dessinés** (poisson-clown, poisson bleu, tortue), tournés dans le sens où ils nagent, avec une petite ondulation — identiques sur tous les appareils.

## Divers
- Écran de victoire : espace insécable avant « ! » (il ne part plus seul à la ligne).
- Cache `lagon-v49`.

---

# v50 — Chaque mini-jeu joué jusqu'à la victoire (tests) ; mémoire plus juste

## Tests (`test/games.test.js`, lancé par `npm test`)
- **Les 18 mini-jeux, à chaque palier** (1 à 5, jusqu'à 6 pour le calcul mental, les formes et les planètes), trois tirages chacun : 259 parties jouées en touchant les bons boutons, jusqu'à l'écran de victoire. Le temps du jeu est accéléré ×10 dans le test (l'ordre des événements ne change pas) : une vingtaine de secondes en tout.
- Chaque mini-jeu note ce qu'il faut toucher pour réussir (`setSolution`, des sélecteurs dans l'ordre ; jamais montré à l'enfant). Pour les jeux dont la réponse se lit à l'écran, le test **vérifie aussi, sans la solution**, qu'elle correspond à ce qui est affiché : nombre d'objets à compter, opération et illustration, calcul mental, comparaison, pile de pièces, intrus, suite logique, ordre des nombres et des jours.
- **Mémoire jouée « de mémoire »** jusqu'au bout, aux paliers 1, 2 et 5 : le test ne connaît que les cartes qu'il a déjà retournées, comme un enfant.
- **Une mauvaise réponse ne fait jamais gagner** (8 jeux) et compte une erreur.
- **Bouton son** : le tour des 4 états, aucun bruitage en silence, voix coupée = rien n'est dit, voix allumée = la phrase est dite.

## Correctif trouvé par ces tests : la mémoire
Au palier 5 (7 paires), il n'y avait que 3 essais. Or, même en se souvenant de tout ce qu'on a vu, on se trompe en moyenne environ 4 fois en découvrant les cartes (jusqu'à 7) : un enfant qui n'avait rien oublié perdait presque à coup sûr. **Les essais suivent maintenant le nombre de paires : paires + 2** (6 au palier 2, 9 au palier 5). Bien retenir fait toujours gagner ; toucher au hasard fait toujours perdre.

- Cache `lagon-v50`.

---

# v51 — Le code rangé en « feature slices » (aucun changement pour l'enfant)

Track Conductor `refactor-feature-slices` (étape A de la feuille de route A → B). Décision documentée dans l'[ADR 0001](docs/adr/0001-architecture-feature-slices.md). Le jeu, les sauvegardes et les écrans sont **identiques** ; seule l'organisation du code change, pour accueillir les prochaines versions (compagnons, squishies, saison 2).

## Organisation
- 37 fichiers à plat deviennent **49 slices** sur 4 couches : `js/app/`, `js/features/` (un dossier par fonctionnalité, et un par mini-jeu dans `features/minigames/`), `js/entities/` (objets, mondes, personnages, difficulté, état et sauvegarde, joueurs, compagnons), `js/shared/` (modale, vues, son, voix, retours, icônes, styles communs).
- Les fichiers fourre-tout sont découpés : `ui.js`, `state.js`, `data.js`, `players.js`, `minigames.js` (moteur d'un côté, un dossier par jeu de l'autre) et **`styles.css` (2 800 lignes) en 48 feuilles** rangées dans leur slice. La cascade CSS est identique octet pour octet.
- **Manifeste `js/slices.js`** : couche, fichiers JS et CSS dans l'ordre de chargement, API publique de chaque slice. `index.html` et `sw.js` en sont générés (`npm run sync`).

## Règles, vérifiées par `npm test` (`test/slices.test.js`)
- Une couche n'utilise que sa couche ou les couches inférieures ; entre slices, seulement l'**API publique**. Le test sait échouer (cas fabriqués et violation réelle vérifiés).
- Les dépendances « vers le haut » sont remplacées par des **points d'accroche** : `registerGame` (le moteur ne connaît plus la liste des jeux), `registerView`, `onModalOpen` / `onModalClose`, `onWrongFeedback`, `onProfileRefresh`, `setAudioPrefsSource`, `setCompanionDressing`. Aucune exception n'a été nécessaire.
- **203 gardes `typeof fn==='function'` retirées** (tout est toujours chargé) ; seules restent celles qui testent le navigateur.

## Outils de développement
- `npm run inventaire` (qui définit et utilise quoi, analyse `acorn`), `npm run sync`, `npm run api`, `test/tools/move.js` (déplacer des déclarations telles quelles), `test/tools/unguard.js`.
- Checklists `conductor/checklist-mini-jeu.md` et `conductor/checklist-ile.md`.
- Dépendances de développement ajoutées : `acorn`, `acorn-walk` (jamais chargées par le jeu).
- Nettoyage : `GAME_LIST.fn`, inutilisé, retiré.

- Cache `lagon-v51`.

---

# v52 — Les compagnons et leurs rôles : indices dès le départ, équipe au niveau 10

> **Demande du parent :** mettre en avant les compagnons et ce qu'ils apportent au jeu, avec des **rôles différents** (un tuteur, un qui donne des indices quand on en a besoin…). Jusqu'ici, les 7 compagnons étaient surtout visuels.

Track Conductor `compagnons-roles` ([spec](conductor/tracks/compagnons-roles_20261109/spec.md), [plan](conductor/tracks/compagnons-roles_20261109/plan.md)). Nouvelle slice `js/features/companion-team/` ; contrat d'indices dans `js/features/minigame-engine/hints.js`.

## Les indices du compagnon (dès le niveau 1)
- **Bouton 💡** dans l'en-tête de chaque mini-jeu et de chaque énigme d'histoire, avec la tête du compagnon principal. Toujours utilisable, pour tous les âges.
- **Proposition douce :** après une erreur, ou 10 secondes sans toucher l'écran, le bouton brille et se balance, et le compagnon « réfléchit ». Il ne parle pas de lui-même.
- **Deux niveaux par question :** la piste (la méthode : « Touche chaque étoile avec ton doigt… ») puis le coup de pouce (le début du raisonnement : les 3 premiers objets numérotés, les nombres autour de l'horloge, le mot découpé en syllabes, « 24 + 40 = 64, puis ajoute les unités »…). **Jamais de 3ᵉ indice, jamais la réponse** : le bouton dit alors « Tu peux le faire ! ».
- **Anti-devinette :** une réponse n'est écartée qu'au niveau 2, avec 4 choix ou plus, une seule fois, et il en reste toujours au moins 3 (règle vérifiée par le moteur). Une relance remet les indices à zéro.
- **Aucune pénalité :** mêmes pièces, mêmes objets, même niveau adaptatif ; un indice n'est pas une erreur. Les indices sont comptés (`state.skills[jeu].hints`) et montrés dans l'espace parents, sans reproche.
- Chaque mini-jeu fournit ses indices (`registerHints`) : les 18 jeux et les 16 énigmes (`tip`, une devinette plus simple). Un test échoue si un jeu inscrit n'en a pas (étape ajoutée à la checklist « ajouter un mini-jeu »).

## L'équipe (à partir du niveau 10)
- Écran **« Ton équipe s'agrandit ! »**, une seule fois (au chargement pour une partie déjà au niveau 10 ou plus).
- **Rencontres en voyageant**, une par compagnon et par profil : Perle au Lagon, Léo au Château, Sam dans la Jungle, Zap à la Cité du Temps, Tom au Volcan, Rose au Pays Squishy (Lili et Grisou arriveront avec la saison 2). Le principal est sauté. Scène : le compagnon en grand, 2 phrases lues à voix haute, une démonstration en image ; « Dans mon équipe ! » ou « Plus tard » (reproposé à la visite suivante).
- **« Mon équipe »** (toucher les compagnons de l'en-tête) : le principal et **2 équipiers** au maximum, les autres au repos ou « à rencontrer » ; on peut aussi changer de principal.
- Les têtes de l'équipe (3 au maximum) dans l'en-tête, sur l'île et sur le bateau de la carte. Sur petit téléphone, le prénom de l'en-tête leur laisse la place.

## Les spécialités
Actives quand le compagnon est équipier, ou principal une fois l'équipe ouverte ; jamais en course. Le compagnon apparaît et parle quand sa spécialité agit ; **une seule bulle à la fois**, et les indices passent avant.
- **Lili, indices magiques :** le 💡 se propose après 5 s, paillettes à l'indice 2, c'est elle qui aide aux énigmes.
- **Perle, conteuse :** « 🔁 Relire », plus lentement, sur les dialogues, consignes et chapitres ; en lecture, les syllabes dès l'indice 1.
- **Léo, tuteur :** il incarne le jeu adaptatif (v42) : il annonce un jeu « à travailler » (1 fois par session), dit la phrase de progrès, rappelle la méthode avant un jeu en soutien.
- **Sam, guide :** une bulle avec une flèche vers la prochaine chose utile (mission du jour, nouvelle île, énigme pas résolue, ami jamais aidé) ; on la touche pour y aller.
- **Zap, défis :** 1 fois par jour et par île, un défi bonus un cran au-dessus du niveau du jeu (plafond de l'âge respecté), récompense doublée, sans effet sur le niveau ; toujours refusable.
- **Tom, trésors :** 1 fois par jour, après une mission réussie, des pièces ou un objet de l'île.
- **Rose, collection :** dans le Sac, l'Album et « Mon look », ce qui manque et où le trouver.
- **Grisou, câlins** (track Licornes) : il console après 2 erreurs d'affilée et annonce la pause douce des parents, sans minuteur à lui.

## Données et tests
- `SAVE_VERSION` 4 : `state.team = { open, met, mates, day }`, `state.charsHelped`, `skills[jeu].hints` ; migration sans perte.
- `test/companions.test.js` (127 vérifications, branché sur `npm test`) : contrat d'indices, bouton, anti-devinette et réponse jamais donnée **sur chaque mini-jeu et chaque palier** (186 parties, gagnables après les indices), énigmes, équipe, migration, rencontres, « Mon équipe », chaque spécialité, mode course.
- Cache `lagon-v52`.


---

# v53 — Collection de squishies : boîtes surprises, séries, chambre, rangement à consigne

> **Idée de la joueuse principale :** « un système de squishies qu'on range dans des boîtes ». Inspirée des vrais squishies (taba squishies, boîtes mystère, séries, raretés : voir [`conductor/research-squishies.md`](conductor/research-squishies.md)).

Track Conductor `squishy-collection` ([spec](conductor/tracks/squishy-collection_20261109/spec.md), [plan](conductor/tracks/squishy-collection_20261109/plan.md)). Catalogue dans l'entité `js/entities/squishy/` (données seules, pour que la migration de la sauvegarde puisse s'en servir), logique et interface dans la slice `js/features/squishies/`.

## Les squishies
- **3 séries de 6** au lancement : 🦫 Capybaras (capy fraise, capy orange, capy dodo, capy au bain ; rare : capy pyjama ; ✨ : capy doré), 🍩 Desserts (donut, mochi, cupcake, glace ; rare : macaron ; ✨ : gâteau arc-en-ciel), 🐾 Animaux (chat, pingouin, lapin, poussin ; rare : grenouille ; ✨ : chat holographique).
- Chaque modèle a une **couleur** (celles du mini-jeu Formes), une **forme** (rond, ovale, carré arrondi) et une **taille** (petit, grand), qui servent au tri. Dessins en SVG dans le style des squishies du Pays Squishy (corps doux, reflet, petit visage, un détail propre au modèle) ; les ✨ ont des paillettes animées.
- Une nouvelle série = une entrée de données : les mondes de la saison 2 ajouteront les leurs.

## Les boîtes surprises
- **Coffre des missions du jour :** toujours 1 boîte « mystère » en plus.
- **Énigmes d'histoire :** 1 boîte de la série de l'île, une seule fois par île (Lagon, Forêt, Montagne → Animaux ; Château, Volcan, Pays Squishy → Desserts ; Jungle, Cité du Temps → Capybaras).
- **Boutique du marché** (onglet Acheter) : 15 pièces, 3 par jour et par joueur, puis « Reviens demain pour d'autres boîtes 🌙 ».
- **Rattrapage :** une partie qui avait déjà résolu N énigmes reçoit N boîtes à ouvrir ; une bulle le dit au lancement tant que la chambre n'a pas été ouverte.
- Pastille sur le bouton 🧸 de l'en-tête : le nombre de boîtes à ouvrir.

## Ouvrir une boîte (tirage doux)
- 70 % commun, 25 % rare, 5 % ✨, dans la série de la boîte ; une boîte mystère choisit une série pas encore complète.
- **Filet de sécurité :** après 3 boîtes d'affilée sans nouveauté, la suivante donne un squishy jamais obtenu (de sa série, sinon d'une autre). Un double dans une série complète ne compte pas.
- La boîte tremble, s'ouvre, le squishy saute ; la voix dit son nom (« Un capy fraise ! »). « Nouveau ! » ou « ×2 » ; confettis pour un rare, fête avec clochettes et paillettes pour un ✨.
- **Série complète :** fête et 20 pièces, une seule fois par série.

## Ma chambre à squishies 🧸
- Par le bouton 🧸 de l'en-tête ou depuis le Sac. Trois onglets : **📚 Collection** (une rangée par série, silhouettes grises pour les manquants, « 4 / 6 », boîtes à ouvrir en haut), **🗄️ Étagère** (12 places : toucher un squishy puis une place ; toucher un squishy posé pour le déplacer ou le retirer), **📦 Ranger**.
- **Presser :** toucher un squishy l'écrase puis le fait remonter lentement (1,5 s), avec un « pouic » et une petite vibration. Rien ne change dans la partie.
- Sur petit téléphone, les boutons ronds de l'en-tête suivent la largeur de l'écran pour que les pièces restent visibles.

## Les boîtes de rangement à consigne (tri)
- Une consigne en image et à voix haute (« Range les squishies roses ! », pastille rose), 4 cases à remplir, 8 squishies **de sa collection** au choix. Seules les consignes réalisables sont proposées : au moins 4 exemplaires qui la respectent et 2 qui ne la respectent pas (les doubles comptent). Moins de 6 modèles différents : la zone l'explique et propose d'ouvrir des boîtes.
- **Selon l'âge :** moins de 6 ans ou sans âge, la couleur ; 6-7 ans, un critère (couleur, forme ou taille) ; 8 ans et plus, deux critères (« les petits squishies ronds »), avec des « presque » sur le plateau. Le niveau adaptatif (`skills.rangement.lvl`) peut redescendre d'un cran (2 boîtes ratées sur 3) puis remonter (2 réussites avec au plus 1 erreur), jamais au-dessus du plafond de l'âge.
- **Anti-devinette :** un mauvais squishy rebondit, avec un indice parlé (« Lui, il est bleu. On cherche des roses ! ») ; après 2 erreurs, une autre consigne (relance annulable si la fenêtre se ferme). Le bouton 💡 du compagnon aide aussi (la piste, puis 3 squishies qui brillent dont au moins un à ranger).
- **Récompense :** 5 pièces pour les 3 premières boîtes du jour, puis pour le plaisir ; un compteur et une petite pile des boîtes rangées. Ranger n'enlève rien à la collection.
- **Espace parents :** « 📦 Boîtes de rangement » dans Mémoire et logique (réussites, erreurs, niveau).

## Le marché
- **Échanger :** « Mes doubles de squishies » : 3 doubles, quels qu'ils soient (les plus nombreux partent d'abord), contre le squishy manquant choisi parmi les silhouettes. « Encore 2 doubles » tant qu'il en manque ; un mot doux si la collection est complète.
- **Acheter :** la boîte surprise, en tête de liste.

## Données et tests
- `SAVE_VERSION` 5 : `state.squishies = { owned, boxes, shelf, dry, done, fromStory, day, sorted, hello }` et `skills.rangement` ; migration sans perte avec les boîtes de rattrapage. La sauvegarde par fichier et le code de transfert emportent tout.
- Sons « pouic » et « clochettes » ajoutés au son du jeu (Web Audio, sans fichier).
- `test/squishies.test.js` (123 vérifications, branché sur `npm test`) : catalogue, migration, sauvegarde et restauration, boîtes (coffre, énigmes, boutique et sa limite), raretés et filet de sécurité (hasard injecté), bonus de série, échange, dessins, chambre, ouverture animée, presser, étagère et rechargement, consignes réalisables sur 300 collections au hasard selon l'âge, partie de rangement complète (relance, pièces, limite du jour), marché.
- Cache `lagon-v53`.

---

# v54 — Le jeu en modules ES natifs (étape B), sans changement visible

> Track technique Conductor `refactor-esm-modules` ([spec](conductor/tracks/refactor-esm-modules_20261109/spec.md), [plan](conductor/tracks/refactor-esm-modules_20261109/plan.md)). Décision : [ADR 0002](docs/adr/0002-modules-es-natifs.md), qui complète l'ADR 0001. Rien ne change pour l'enfant, et les sauvegardes restent les mêmes (version 5).

## Ce qui change dans le code
- **Un seul script :** `index.html` charge `<script type="module" src="js/app/main.js">`. Il n'y a plus aucun build pour le jeu, et aucune variable du jeu n'est globale.
- **Des imports explicites :** chaque fichier importe ce qu'il utilise. Chaque slice a un `index.js`, son API publique, que les autres slices sont seules à importer.
- **Des couches sans cycle :** les slices sont rangées de bas en haut dans le manifeste (`js/slices.cjs`), et une slice n'importe que celles placées avant elle.
  - Au départ, 5 entités et 19 features formaient des boucles de dépendances.
  - Pour remonter d'une couche, la v54 utilise un petit bus d'événements (`js/shared/lib/events.js`) :
    - `ui:lagon`, `ui:profile`, `ui:map`, `ui:backup-reminder` pour redessiner ;
    - `nav:game-picker`, `nav:player-settings`, `nav:dialogue`, `nav:parents` pour ouvrir un écran ;
    - `game:start`, `game:bonus`, `game:before` (pause douce) pour solliciter le moteur ;
    - `world:changed`, `lagon:rendered`, `bag:tab` pour ce qui vient de se passer.
  - Elle ajoute aussi trois points d'accroche : `setSaveSlot`, `setCompanionPlayerSource`, `setHintCountable`.
- **Du code rangé à la bonne hauteur :**
  - nouvelles slices `screen` (en-tête des fenêtres) et `hints` (indices 💡) ;
  - `adaptive` accueille le jeu en cours, le défi bonus et l'enregistrement des progrès ;
  - nouvelle entité `season` (les fêtes) ;
  - `SQ_COLORS` va dans l'entité `squishy`, `GAME_LIST` dans `difficulty`.
- **Une variable n'est réaffectée que par son fichier :** `setCurrentWorld`, `replaceState`, `setParty`, `setRace`, `ensureAudioCtx`… remplacent 12 écritures croisées.

## Tests et outils
- **La page de test** regroupe les modules avec **esbuild** (dépendance de développement seulement, en mode strict). Les ~560 vérifications existantes passent sans modification.
- **Nouveau `test/modules.test.js` :** il charge les **vrais** modules dans Node (jsdom pour la page), avec le même ordre d'initialisation que le navigateur et le mode strict. Une erreur d'ordre d'initialisation provoquée exprès est attrapée.
- **`test/slices.test.js`, réécrit sur les `import`,** vérifie :
  - seulement les `index.js` entre slices ;
  - les couches et l'ordre du manifeste ;
  - aucun cycle (graphe d'esbuild) ;
  - aucun nom utilisé sans import ;
  - aucune écriture sur `window` / `globalThis` / `self`, et aucune garde `typeof` ;
  - `index.html` (un seul module) et `sw.js` conformes.

  Six cas fautifs fabriqués prouvent qu'il sait échouer.
- **Commandes :**
  - `npm run sw` (comme `npm run sync`) régénère la liste du cache hors-ligne ;
  - `npm run api` disparaît : exposer un nom, c'est l'ajouter à l'`index.js` ;
  - `npm run inventaire` montre les imports et exports.
- **`file://` ne marche plus** (les modules l'interdisent) : passer par `npm start` ou l'adresse en ligne.

## Vérification
- `npm test` passe : architecture, vrais modules, fumée, 123 squishies, 284 jeux, 127 compagnons.
- Chromium :
  - parcours au doigt complet sur les vrais modules, sans erreur JS, aussi en émulation Pixel 7 et iPhone 13 ;
  - hors-ligne : 192 fichiers précachés, le jeu démarre sans réseau.
- **À faire sur les vrais appareils :** Safari iPhone ou iPad, et Chrome Android (voir la note du TODO).
- Cache `lagon-v54`.

---

# v55 — Saison 2 « Le Ciel des Rêves » et le Monde des Boîtes

> **Idée de la joueuse principale :** « le monde des boîtes ». Track Conductor `saison2-monde-boites` ([spec](conductor/tracks/saison2-monde-boites_20261109/spec.md), [plan](conductor/tracks/saison2-monde-boites_20261109/plan.md)).

## Deux archipels
- Chaque île porte son archipel (`saison`) :
  - les 8 îles de la saison 1 forment **Le Lagon Magique** ; leur ordre, leurs niveaux et leur carte sont inchangés ;
  - **Le Ciel des Rêves** (saison 2) s'ouvre au **niveau 32**, juste après le Lagon (le Pays Squishy est au niveau 26). Les saisons se suivent et l'écart entre deux îles grandit de 2 niveaux à chaque saison : tous les 4 niveaux dans le Lagon, tous les 6 dans le Ciel, tous les 8 dans la saison 3 (décision du propriétaire ; tableau de référence : `conductor/niveaux.md`, vérifié par `test/niveaux.test.js`). Un niveau vaut toujours 5 missions. Ses îles gardent la difficulté la plus haute (palier 6, toujours plafonnée par l'âge et le niveau de chaque jeu).
- **La carte a deux onglets en haut.**
  - Tant que le Ciel est fermé, son onglet est grisé, avec un cadenas et « Niveau 32 ». Le toucher dit quand il s'ouvre.
  - Une fois toutes les îles du Lagon ouvertes, la carte annonce « Prochain monde : Le Ciel des Rêves au niveau 32 · encore N missions » (il y a 30 missions entre le Pays Squishy et le Ciel).
  - **La barre sous la carte part de la dernière île ouverte** et se remplit jusqu'à la prochaine (avant, elle comptait depuis le tout début, et elle était déjà presque pleine en arrivant sur une île). La carte, l'île verrouillée (« Encore N missions ! ») et les profils font le même calcul (`levelOf`, `missionsUntil`).
  - Le Ciel a son fond pastel, ses nuages et ses îles. Le bateau y devient une **montgolfière** 🎈.
  - On voyage d'île en île à l'intérieur d'un archipel ; on passe de l'un à l'autre par l'onglet, sans trajet.
- **L'ouverture du Ciel** se fait une seule fois, dans cet ordre :
  1. l'écran « Un nouveau monde s'ouvre dans le ciel ! ☁️ » ;
  2. le prologue de la saison ;
  3. le chapitre du Monde des Boîtes ;
  4. l'écran de nouvelle île.

  Une partie déjà au niveau 32 ou plus découvre le Ciel au premier lancement.
- Données :
  - `ARCHIPELAGOS`, `worldsOf(saison)`, `archipelagoOf(id)`, `worldGame(id, age)` dans `js/entities/world/` ;
  - `SAVE_VERSION` 6 : `skyIntroSeen`. Les îles visitées couvrent les deux archipels, et la migration ne perd rien.
- Ajouter une île à la saison 2 se fait dans les données : une entrée dans `WORLDS` avec `saison:2`, un chapitre dans `STORY`, une série de squishies. Rien d'autre à coder, sauf son paysage.

## Le Monde des Boîtes (« La Fabrique de boîtes »)
- **L'île :** `boites` 📦, au niveau 32, palier 6. Elle flotte sur les nuages, avec des piles de cartons et le tapis roulant de la Fabrique. Son thème est kraft et pastel, et sa musique est une harpe aérienne avec les « tchac » des machines.
- **4 personnages dessinés en SVG :**
  - 🦫 **Capucine**, la capybara directrice, guide du chapitre ;
  - 🐱 **Kiki**, le chat-dans-la-boîte ;
  - 🤖 **Boulon**, le robot en carton ;
  - 🛴 **Lola**, la livreuse.
- **Objets :** 8 objets (carton plié, étiquette, ficelle, papier bulle, trombone, ciseaux, nœud doré, crayon). Les 3 derniers ne sont donnés par personne : ce sont les objets préférés des habitants.
- **Recettes et décorations :** 2 recettes (Boîte à rêves, Colis volant) et 5 décorations.
- **Lili** (indices magiques, v52) a maintenant son île : on peut la rencontrer au Monde des Boîtes une fois l'équipe ouverte.
- **Série de squishies « Boîtes »** : chat dans la boîte, robot carton, cadeau surprise, petit colis ; rare : **Pop** ; ✨ : **boîte dorée**. Elle n'apparaît (chambre, boîtes mystère, marché) qu'une fois l'île ouverte.
- **Pop, le diablotin à ressort,** surgit 1 fois sur 5 à l'ouverture d'une boîte surprise, sans rien changer au tirage.

## Deux nouveaux mini-jeux
- **🪆 Les boîtes gigognes (sériation) :**
  - on touche les boîtes de la plus petite à la plus grande, et chacune vient se ranger dans la suivante ;
  - 3, puis 4, puis 5 boîtes, avec des écarts plus fins aux paliers hauts ;
  - au palier haut, parfois à l'envers (de la plus grande à la plus petite) ;
  - une erreur fait trembler la boîte et donne un indice parlé ; à la 2ᵉ erreur, nouvelle série (relance annulable) ;
  - dès 3 ans.
- **🧊 Combien de cubes ? (repérage dans l'espace) :**
  - une pile de cubes en perspective (SVG isométrique) et 3 réponses en grands chiffres et en points ;
  - jusqu'à 5, puis 8, puis 12 cubes ;
  - au palier haut, 2 rangées et 3 étages, avec des cubes cachés derrière ou dessous et le rappel « les cubes du dessus sont toujours posés sur d'autres cubes » ;
  - la pile est une carte des hauteurs, donc toujours possible ;
  - une erreur donne une autre pile ;
  - dès 5 ans.
- **Ce que les deux jeux partagent :**
  - leurs indices 💡 ;
  - un niveau adaptatif propre ;
  - leur place dans « Formes et espace » de l'espace parents ;
  - pas de minuteur.
- **Jeu de l'île :** les gigognes avant 7 ans, les cubes ensuite.

## Histoire : « Les Rêves dans les boîtes »
- **Prologue,** lu par Capucine : Grisou, un petit nuage, a eu si peur de perdre les rêves colorés du ciel qu'il les a tous enfermés dans des boîtes.
- **Chapitre du Monde des Boîtes :** 3 énigmes en images. Il rapporte 14 pièces et une boîte surprise de la série Boîtes, une seule fois.
- **3 épisodes,** racontés par Kiki, Boulon et Lola : des boîtes qui frissonnent, un rêve qui s'échappe, un colis pour le Royaume Arc-en-ciel.
- **Grisou,** un nuage dessiné en SVG, apparaît dans les chapitres de la saison 2.
  - Triste et gris au début, il reprend des couleurs à chaque île libérée : des joues, un sourire, une bande d'arc-en-ciel de plus.
  - C'est la progression visible de la saison.
- **Le journal 📖** a deux parties : « Saison 1 : Le Lagon Magique » et « Le Ciel des Rêves », avec son prologue.

## Tests
- Nouveau `test/saison2.test.js` (96 vérifications), branché sur `npm test`. Il couvre :
  - archipels, onglets, montgolfière, voyage d'un archipel à l'autre ;
  - ouverture au niveau 32 et au chargement, migration ;
  - l'île, les personnages, les objets, les préférés ;
  - la série Boîtes et Pop ;
  - gigognes (ordre, erreurs et relance, paliers, envers) et cubes (comptage avec les cachés, piles possibles, paliers, autre pile) ;
  - jeu de l'île, histoire, épisodes, Grisou, journal.
- Les 20 mini-jeux sont joués jusqu'à la victoire à chaque palier, avec une vérification indépendante pour les gigognes et les cubes. Leurs indices passent le contrôle d'anti-devinette.
- Cache `lagon-v55`.

---

# v56 — Les sons du jeu : ambiance « marimba doux »

Track Conductor `sons`. Choix faits avec la joueuse sur la page d'écoute « Sons du Lagon » (https://claude.ai/artifact/F5xuENW8ePFKLk4QogwH8K) : **ambiance « marimba doux »**, **synthèse retravaillée** (toujours aucun fichier audio).

## Ce que l'on entend
- **Tous les sons en marimba**, dans une gamme pentatonique (do, ré, mi, sol, la) : deux sons qui se superposent ne font jamais une fausse note. Plus d'onde carrée : le « oups » devient deux notes douces qui descendent, plus jamais un buzzer.
- **3 nouveaux sons** : l'indice 💡 (deux notes qui montent), la nouvelle île (une gamme et un accord), l'ouverture d'une boîte surprise (un glissé puis trois notes).
- **Le Simon** joue ses 4 couleurs en marimba, avec des notes exactes (sans variation), pour qu'on puisse les mémoriser.

## Un moteur audio unique (`js/shared/ui/sound.js`)
- Un seul `AudioContext` et un **bus principal** : sons, Simon et musique → volume général → réduction pendant la voix → **limiteur** → haut-parleur. Plusieurs sons ensemble ne saturent plus.
- **Écho doux** (réverbération légère, générée une fois), **variation naturelle** (±1,2 % de hauteur, ±12 % de volume : 112 touchers ne sonnent plus comme une machine), **anti-rafale** (un même son n'est pas rejoué à moins de 60 ms : plus de crépitement quand on tape vite), **mixage par famille** (touchers discrets, fêtes plus présentes).
- **Pendant la voix, tout baisse** (sons et musique), puis remonte. La musique n'a plus sa propre réduction.
- **Volume général par joueur** (80 % par défaut) : espace parents → Réglages, avec une note pour entendre le résultat. Sauvegarde en version 7 (les anciennes parties reçoivent 80 %).

## Tests
- `test/sounds.test.js` (44 tests) avec un faux `AudioContext` qui enregistre les nœuds (`test/tools/fake-audio.js`) : chemin du son, limiteur, plus d'onde carrée, notes de chaque son, anti-rafale, variation, Simon exact, réduction pendant la voix, musique sur le bus, volume et migration, nouveaux moments.
- Les tests des squishies ne figent plus le numéro de sauvegarde.

---

# v57 — Des niveaux équilibrés, une seule règle

> **Demande du propriétaire :** « que le passage de niveaux soit équilibré et simple à suivre, sans contradiction ». Règle choisie : l'écart entre deux îles grandit de 2 niveaux à chaque saison. Tableau de référence : [`conductor/niveaux.md`](conductor/niveaux.md).

## La règle
- **Un niveau = 5 missions réussies**, du premier au dernier niveau. Cette valeur ne change pas, et aucun enfant ne perd de niveau.
- **Les saisons se suivent.** Une saison s'ouvre avec sa première île.
- **Une île tous les 4 niveaux dans le Lagon** (après le départ rapide 1, 3, 6, 10). Ensuite, **une île tous les 6 niveaux dans le Ciel des Rêves**, puis **tous les 8 dans la saison 3**. Cela fait 20, puis 30, puis 40 missions par île.
- Le Ciel des Rêves s'ouvre donc au **niveau 32**, contre 36 de la v55 à la v56. Il est 6 niveaux après le Pays Squishy (26).
- Les îles à venir suivent la même règle :
  - Saison 2 : Jouets Doux 38, Bonbons 44, Musique 50, Jardin des Fées 56, Licornes 62.
  - Saison 3 : Nuages 70, Dinosaures 78, Fête Foraine 86, Bibliothèque 94, Étoiles 102.

## Ce que voit l'enfant
- **Sous la carte :** « Prochaine île : … au niveau N · encore X missions » (ou « Prochain monde »).
  - La barre part de la dernière île ouverte et arrive pleine à la prochaine. Avant, elle comptait depuis le tout début, et elle était déjà presque pleine en arrivant sur une nouvelle île.
- **Une fois toutes les îles ouvertes,** la carte le dit (« Tu as ouvert toutes les îles ! D'autres arriveront bientôt. ») sur les deux onglets. Elle n'annonce plus deux choses différentes selon l'onglet.
- **Une île verrouillée** répond « … s'ouvrira au niveau N. Encore X missions ! », au singulier quand il n'en reste qu'une.

## Sans contradiction
- **Un seul calcul :** `levelOf`, `missionsForLevel` et `missionsUntil` (`js/entities/game-state`).
  - La carte, l'île verrouillée et le résumé des profils s'en servent.
  - Aucun autre fichier ne fait le calcul avec `MISSIONS_PER_LEVEL` (vérifié par un test).
- **Le niveau d'un archipel** est celui de sa première île, calculé par le jeu (`ARCHIPELAGOS[s].level`).
- **Les specs des îles** citent leur niveau et renvoient au tableau. Les anciennes notes (« de 5 en 5 », « en parallèle », niveaux décalés) sont retirées.

## Tests
- Nouveau `test/niveaux.test.js` (26 vérifications), branché sur `npm test`. Il vérifie :
  - que le tableau suit la règle (écarts, missions) ;
  - que chaque île du jeu a le niveau du tableau, et chaque archipel celui de sa première île ;
  - que chaque spec cite le niveau du tableau, sans ancienne règle ;
  - que le calcul du niveau est fait à un seul endroit.
- `test/saison2.test.js` passe à 102 vérifications : il ajoute la barre de la carte, « encore N missions » au singulier comme au pluriel, et « toutes les îles ouvertes ».
- Cache `lagon-v56`.

---

# v58 — Saison 2, île 2 : le Coffre aux Jouets Doux

> **Idée de la joueuse principale :** « un monde de jouets qui ressemblent à des squishies ». Track Conductor `monde-jouets` ([spec](conductor/tracks/monde-jouets_20261111/spec.md), [plan](conductor/tracks/monde-jouets_20261111/plan.md)).

## L'île
- **`jouets` 🧸, niveau 38** (règle des niveaux : `conductor/niveaux.md`), palier 6, deuxième île du Ciel des Rêves, après les Boîtes.
- **Le paysage :** un grand coffre ouvert d'où dépassent un ourson et une lapine qui se balancent, une étagère pastel avec des jouets mochi, des cubes à formes et un ballon. Le thème est crème, rose et menthe.
- **La musique :** une boîte à musique (nouveau timbre « célesta »), très douce, à 80 battements par minute.
- **4 personnages,** chacun avec son butin et 3 répliques :
  - 🧸 **Nougat**, l'ourson en guimauve, gardien du coffre et guide du chapitre ;
  - 🐰 **Cocotte**, la lapine mochi, qui présente l'étagère magique ;
  - 🐙 **Gloups**, le poulpe tout mou, qui fait des paquets avec ses huit bras ;
  - 🐸 **Rainette**, la grenouille squishy, qui cache des jouets.
- **8 objets** (ruban de peluche, bouton de nounours, grelot, ressort tout doux, mini-mochi, étoile en feutrine, yo-yo doux, toupie à pois). Trois d'entre eux ne sont donnés par personne, pour les objets préférés.
- **2 recettes** (Doudou des rêves, Boîte à musique) et **5 décorations** (coffre à jouets, manège de peluches, panier de câlins, piñata en feutrine, tipi des doudous).
- **La série de squishies « Jouets doux »** : ourson guimauve, lapin mochi, poulpe tout mou, grenouille sauteuse ; le rare est Nougat ; le ✨ est l'ourson arc-en-ciel. Elle n'apparaît qu'une fois l'île ouverte.

## Deux nouveaux mini-jeux
- **Le jeu de l'île :** les paquets avant 7 ans, l'étagère ensuite. Les deux jeux sont proposés dès 5 ans, sans minuteur, avec un essai de plus que le barème par défaut.
- **🧸 Les paquets de jouets** (`packs`) : le début de la multiplication. Les jouets sont rangés par paquets de 2, 5 ou 10. On choisit le total parmi 3 réponses.
  - Palier 1 : paquets de 2, 2 ou 3 paquets.
  - Palier 2 : paquets de 2 et de 5.
  - Palier 3 : paquets de 2, 5 et 10.
  - Palier 4 : jusqu'à 5 paquets, parfois un jouet tout seul en plus.
  - Palier 5 : la phrase « 4 paquets de 5 » est écrite sous l'image, et l'indice montre l'écriture 4 × 5.
  - Les pièges sont plausibles : un paquet de plus ou de moins, le jouet seul oublié.
  - Les indices disent de compter de paquet en paquet, sans jamais dire le total. Compétence « Nombres » dans l'espace parents.
- **🗄️ L'étagère magique** (`shelf`) : lire un tableau à double entrée, une couleur par ligne et une forme par colonne.
  - Palier 1 : 2 × 2 cases, un jouet à ranger.
  - Palier 2 : 3 × 3, deux jouets.
  - Palier 3 : trois jouets, et parfois « quel jouet va dans la case « ? » ? ».
  - Palier 4 : 4 × 4.
  - Palier 5 : souvent des cadeaux à poser aux coordonnées écrites et dites à voix haute (« ligne rose, colonne étoile »).
  - Les jouets à ranger attendent dans un panier, et le prochain est mis en avant.
  - L'indice 2 fait briller la ligne de la couleur, sans jamais nommer la case. Compétence « Formes et espace ».
- Pour les deux jeux, une erreur relance une autre question (anti-devinette, relance annulable).

## Histoire : « Les jouets qui ne jouent plus »
- **Le chapitre :** Grisou a rangé le rêve de « jouer ensemble » tout au fond du coffre, et les jouets se sont endormis.
  - Nougat pose 3 devinettes en images : la peluche, le ballon, le puzzle.
  - Résoudre le chapitre rapporte 14 pièces et une boîte surprise de la série Jouets doux, une seule fois.
  - Grisou reprend des couleurs (2 îles du Ciel libérées).
- **3 épisodes,** racontés par Cocotte, Gloups et Rainette. Dans le dernier, un ballon qui sent la fraise annonce le Royaume des Bonbons.

## Tests
- Nouveau `test/jouets.test.js` (70 vérifications), branché sur `npm test`. Il couvre :
  - l'île et son ouverture au niveau 38 ;
  - les personnages, les objets et la série de squishies ;
  - les paliers, les pièges, les indices et la relance des deux jeux ;
  - le jeu de l'île selon l'âge ;
  - le chapitre, la récompense unique et les épisodes.
- Les 22 mini-jeux sont joués jusqu'à la victoire à chaque palier, avec une vérification indépendante pour les paquets (jouets dessinés) et l'étagère (ligne et colonne de chaque case).
- `test/niveaux.test.js` vérifie aussi les fiches `metadata.json` des tracks. Il a corrigé 4 niveaux restés à l'ancienne valeur.
- Cache `lagon-v58`.

---

# v59 — Formulaires et boutons d'action

Track Conductor `formulaires-boutons`. Demande : « bien gérer les boutons dans les formulaires, avec des boutons d'enregistrement flottants ou en haut ; revoir les formulaires ».

## Un modèle de formulaire commun (`js/shared/ui/form.js`)
- **En-tête fixe** (titre et ✕), **contenu qui défile** en sections titrées (🙂 Moi, 🎨 Mon avatar, 🧚 Mon compagnon, 🎂 Mon anniversaire), **barre d'actions fixe en bas**, à portée du pouce : Retour / Annuler à gauche, Enregistrer ✅ à droite.
- Utilisé par l'accueil, « Nouveau joueur » et les réglages d'un joueur. Les boutiques et sélecteurs gardent leur titre visible en défilant.
- **« Garder tes changements ? »** si l'on ferme après une modification (✕, Retour, poignée, toucher à côté, Échap) ; Échap ou toucher à côté ramènent au formulaire, sans rien enregistrer ni effacer.
- **Prénom obligatoire, demandé en douceur** : bouton grisé, message parlé ; clavier adapté sur mobile ; « Entrée » valide.

## Actions dangereuses
- **Plus aucun `confirm()` du navigateur** : une fenêtre du jeu (`js/shared/ui/confirm.js`), lue à voix haute, « Annuler » mis en avant.
- **« Recommencer » et « Supprimer un joueur » ne sont plus accessibles à l'enfant** : zone sensible de l'espace parents (derrière la multiplication), avec double confirmation (écrire « RECOMMENCER » ou le prénom).

## Tests
- `test/forms.test.js` (47 tests) ; le test de fumée suit la nouvelle place de la remise à zéro.
- `form.css` est chargée en dernier (jsdom applique la dernière règle déclarée, sans tenir compte de la spécificité).

- Cache `lagon-v59`.

---

# v60 — Saison 2, île 3 : le Royaume des Bonbons

> **Proposition retenue par la joueuse.** Track Conductor `monde-bonbons` ([spec](conductor/tracks/monde-bonbons_20261111/spec.md), [plan](conductor/tracks/monde-bonbons_20261111/plan.md)).

## L'île
- **`bonbons` 🍭, niveau 44** (règle des niveaux : `conductor/niveaux.md`), palier 6. C'est la troisième île du Ciel des Rêves.
- **Le paysage :** deux maisons en pain d'épices au toit glacé, une rivière de sirop, des arbres-sucettes qui se balancent, des cailloux en bonbons. Le thème est framboise, caramel et vanille.
- **La musique :** une petite valse sucrée en pizzicato, à 92 battements par minute.
- **4 personnages**, chacun avec son butin et 3 répliques :
  - 👑 **Praline**, la reine pâtissière, guide du chapitre ;
  - 🧁 **Chouquette**, la petite pâtissière, une cupcake qui présente le gâteau partagé ;
  - 🍫 **Cacao**, l'ourson chocolatier, qui présente la recette ;
  - 🍭 **Berlingot**, le marchand de bonbons.
- **8 objets :** sucre glace, cerise confite, pépite de chocolat, ruban de réglisse, cuillère en bois, moule à gâteau, sac de farine, caramel fondant. Trois d'entre eux ne sont donnés par personne.
- **2 recettes** (gâteau à étages, tablette de chocolat) et **5 décorations** (maison en pain d'épices, fontaine de sirop, arbres-sucettes, guirlande de bonbons, chariot de glaces).
- **La série de squishies « Bonbons » :** sucette spirale, berlingot, guimauve, dragée ; le rare est Praline, le ✨ est le gâteau à étages doré.

## Deux nouveaux mini-jeux
Les deux sont proposés dès 5 ans, sans minuteur. Le jeu de l'île est la recette avant 7 ans, le gâteau partagé ensuite.

- **🎂 Le gâteau partagé** (`share`) : les fractions simples. Le gâteau est rond (parts en secteurs) ou rectangulaire (parts en bandes).
  - Paliers 1 et 2 : « Quel gâteau est coupé en 2 (ou 4) parts égales ? ». Les parts inégales sont de plus en plus proches.
  - Palier 3 : la moitié ou le quart (la part rose).
  - Palier 4 : la moitié, le tiers ou le quart, avec un piège : le bon nombre de parts, mais inégales.
  - Palier 5 : l'écriture de la part rose (½, ⅓, ¼), ou « Combien de quarts pour faire une moitié ? ».
  - Les indices expliquent « parts égales », puis ce qu'il faut compter, sans jamais montrer le bon gâteau.
  - Compétence « Calcul » dans l'espace parents.
- **🥣 La recette** (`recipe`) : les grandeurs et les mesures.
  - Palier 1 : le bol qui contient le plus (ou le moins), ou le sac le plus lourd (ou léger) sur la balance.
  - Paliers 2 et 3 : mettre le bon nombre de cuillères (jusqu'à 10). Chaque cuillère se voit dans le bol ; ↩️ enlève la dernière ; « C'est prêt ! » vérifie.
  - Palier 3 : aussi le verre doseur en verres, avec des traits numérotés.
  - Palier 4 : en grammes, des traits de 10 en 10, et des nombres seulement tous les 50.
  - Palier 5 : des grammes de 50 en 50 (nombres tous les 250) ou des centilitres de 10 en 10.
  - Au palier haut, la cible est toujours un trait sans nombre : il faut compter.
  - Compétence « Temps et mesures » dans l'espace parents.
- Pour les deux jeux, une erreur relance une autre question, jamais la même.

## Histoire : « La fête sans gâteau »
- **Le chapitre :** c'est jour de fête, mais Grisou a caché le rêve « fête et gourmandise » au fond du grand four, et le four s'est éteint.
  - Praline pose 3 devinettes gourmandes : le gâteau d'anniversaire, la cerise, la glace.
  - Le four se rallume et Grisou devient jaune caramel.
  - Le chapitre rapporte 14 pièces et une boîte Bonbons, une seule fois.
- **3 épisodes,** racontés par Chouquette, Cacao et Berlingot. Le dernier annonce l'Île de la Musique.

## Tests
- Nouveau `test/bonbons.test.js` (64 vérifications), branché sur `npm test`. Il couvre :
  - l'île et son ouverture au niveau 44 ;
  - les personnages, les objets et la série ;
  - les paliers, les pièges, les indices et la relance des deux jeux ;
  - les cuillères (↩️, « C'est prêt ! » trop tôt) et le verre doseur ;
  - le jeu de l'île, le chapitre, la récompense unique et les épisodes.
- Les 24 mini-jeux sont joués jusqu'à la victoire à chaque palier, avec une vérification indépendante pour le gâteau (parts dessinées, largeurs égales) et la recette (nombre de cuillères, bon trait).
- Cache `lagon-v60`.

---

# v61 — Barre de navigation et écran Réglages

Track Conductor `navigation-reglages`. Demande : retravailler la barre du bas (taille selon le support, rôle du bouton Île) et regrouper les paramètres, **sans 5e bouton** : on ouvre les Réglages en touchant son avatar et son prénom.

## Réglages (`js/features/settings/`)
- **Ouverts en touchant l'avatar et le prénom**, en haut ; un petit ⚙️ l'indique (« Réglages de Loulou » pour les lecteurs d'écran).
- 🙂 **Moi** : le profil (formulaire de la v59) et « Mon compagnon, mon équipe ».
- 🔊 **Son** : trois interrupteurs (Bruitages, Voix, Musique) et le volume ; couper les bruitages coupe tout ; le 🔊 du haut reste un raccourci, synchronisé.
- 👥 **Joueurs** : « Changer de joueur » visible d'emblée, un bouton par joueur, « Ajouter un joueur », « Jouer à plusieurs » (solo, chacun son tour, course).
- 🔒 **Parents** : espace parents (avec la zone sensible) et sauvegarde, derrière la multiplication ; rappel de sauvegarde en tête si besoin.
- Les formulaires ouverts depuis les Réglages y ramènent.

## Barre du bas
- **4 boutons** ; le bouton Île affiche **le nom de l'île courante** (Forêt, Volcan…), avec son icône dessinée (v44).
- **Une seule règle de taille** (`js/shared/ui/nav.css`) : 64 px en portrait, 48 px en paysage, 72 px sur tablette, barre centrée (~640 px) sur ordinateur ; jamais moins de 48 px. Elle remplace 4 hauteurs empilées depuis la v12.
- Plus de bouton de réglages dans le Sac ; plus de doublons (sauvegarde, parents) dans le panneau des joueurs.

## Tests
- `test/settings.test.js` (38 tests) ; tests existants adaptés au nouveau chemin.

- Cache `lagon-v61`.

---

# v62 — Saison 2, île 4 : l'Île de la Musique

> **Proposition retenue par la joueuse.** Elle s'appuie sur le moteur audio de la v56 (notes de marimba exactes). Track Conductor `monde-musique` ([spec](conductor/tracks/monde-musique_20261111/spec.md), [plan](conductor/tracks/monde-musique_20261111/plan.md)).

## L'île
- **`musique` 🎵, niveau 50** (règle des niveaux : `conductor/niveaux.md`), palier 6. C'est la quatrième île du Ciel des Rêves.
- **Le paysage :** un grand clavier de piano en guise de pont, des arbres-flûtes, une cascade de notes, des notes qui se balancent. Le thème est nuit, or et turquoise.
- **La musique :** un thème joyeux au marimba, à 100 battements par minute.
- **4 personnages**, chacun avec son butin et 3 répliques :
  - 🎻 **Viola**, la violoniste et cheffe d'orchestre, guide du chapitre ;
  - 🥁 **Boumbo**, le petit tambour, qui présente le rythme magique ;
  - 🪈 **Flûtine**, la flûte enchantée, qui présente « Grave ou aigu ? » ;
  - 🦜 **Piccolo**, le perroquet chanteur.
- **8 objets :** baguette de chef, partition, clé de sol, grelot doré, corde de violon, anche de flûte, métronome, micro doré.
- **2 recettes** (lyre des nuages, carillon d'or) et **5 décorations** (piano à queue, kiosque à musique, guirlande de notes, grand tambour, pupitre doré).
- **La série de squishies « Instruments » :** tambour mochi, maracas, xylophone, trompette ; le rare est Boumbo, le ✨ est la lyre dorée.

## Deux nouveaux mini-jeux
Les deux se jouent aussi sans le son. Ils sont proposés dès 5 ans, sans minuteur. Le jeu de l'île est le rythme avant 7 ans, « Grave ou aigu ? » ensuite. Compétence « Mémoire et logique » dans l'espace parents.

- **🥁 Le rythme magique** (`rhythm`) : Boumbo frappe un rythme, que l'enfant rejoue avec les boutons du tambour.
  - Le rythme est aussi écrit en images : ● pour un coup court « boum », ▬ pour un coup long « bouuum », 🤫 pour un silence.
  - Palier 1 : 3 coups tous pareils.
  - Palier 2 : 4 coups, courts et longs.
  - Palier 3 : 5 symboles dont un silence. Le rythme se cache après l'écoute : il faut le retenir.
  - Palier 4 : 6 symboles dont un silence.
  - Palier 5 : 6 symboles et deux silences. On lit le rythme écrit avant de l'entendre, puis Boumbo le joue.
  - L'indice 2 fait réécouter et revoir le rythme, plus lentement.
  - Les boutons ne sont jamais bloqués pendant l'écoute.
- **🔔 Grave ou aigu ?** (`pitch`) : des cloches dans une gamme pentatonique (jamais de fausse note). La grande cloche sonne grave, la petite sonne aigu.
  - Palier 1 : 2 cloches très éloignées, la plus aiguë ou la plus grave.
  - Paliers 2 à 4 : 3, 4 puis 5 cloches à ranger du grave à l'aigu, de plus en plus proches.
  - Palier 5 : parfois « La mélodie monte ou descend ? », avec 4 notes dessinées comme un escalier.
  - Le bouton 🔈 fait écouter les cloches.
- Pour les deux jeux, une erreur relance une autre question (anti-devinette).

## Histoire : « Le silence de l'île »
- **Le chapitre :** Grisou a enfermé le rêve « chanter et danser » dans une boîte à musique fermée à clé, et l'île est devenue silencieuse.
  - Viola pose 3 devinettes : le tambour, le piano, la trompette.
  - L'orchestre se remet à jouer et Grisou devient turquoise.
  - Le chapitre rapporte 14 pièces et une boîte Instruments, une seule fois.
- **3 épisodes,** racontés par Boumbo, Flûtine et Piccolo. Le dernier annonce le Jardin des Fées.

## Tests
- Nouveau `test/musique.test.js` (60 vérifications), branché sur `npm test`. Il couvre :
  - l'île, l'ouverture au niveau 50, les personnages, les objets et la série ;
  - les règles des rythmes (pas de silence au début, à la fin, ni deux de suite), le rythme caché puis revu grâce à l'indice, la lecture au palier 5 ;
  - les cloches (la plus grave est la plus grande), le rangement, la mélodie ;
  - le jeu de l'île, le chapitre, la récompense unique et les épisodes.
- Les 26 mini-jeux sont joués jusqu'à la victoire à chaque palier. Le rythme et les cloches ont une vérification indépendante : le rythme écrit, l'ordre des cloches, le sens de la mélodie.
- Cache `lagon-v62`.

---

# v63 — Saison 2, île 5 : le Jardin des Fées

> **Proposition retenue par la joueuse.** Track Conductor `monde-jardin` ([spec](conductor/tracks/monde-jardin_20261111/spec.md), [plan](conductor/tracks/monde-jardin_20261111/plan.md)).

## L'île
- **`jardin` 🌸, niveau 56** (règle des niveaux : `conductor/niveaux.md`), palier 6. C'est l'avant-dernière île du Ciel des Rêves.
- **Le paysage :** un jardin vu à hauteur d'insecte, avec des fleurs géantes qui se balancent, des champignons-maisons, des gouttes de rosée et des brins d'herbe. Le thème est vert tendre, lilas et pêche.
- **La musique :** une flûte légère et de petites cloches, à 76 battements par minute.
- **4 personnages**, chacun avec son butin et 3 répliques :
  - 🧚 **Pétale**, la fée jardinière, guide du chapitre ;
  - 🐞 **Pois**, la coccinelle, qui présente les coccinelles ;
  - 🦋 **Azur**, le papillon, qui présente « De la graine à la fleur » ;
  - 🐝 **Miella**, l'abeille.
- **8 objets :** graine magique, goutte de rosée, pollen doré, petit arrosoir, pétale de rose, fil d'araignée, noisette, mini-champignon.
- **2 recettes** (bouquet des fées, pot de miel des fées) et **5 décorations** (maison-champignon, balançoire de fleurs, tournesol géant, ruche dorée, fontaine de rosée).
- **La série de squishies « Petites bêtes » :** coccinelle, abeille, escargot, chenille ; le rare est Pois, le ✨ est le papillon irisé.

## La carte du Ciel
- Les îles du Ciel sont désormais placées en serpentin, sur 3 colonnes et 2 rangées.
  - En bas : les Boîtes, les Jouets Doux, les Bonbons.
  - En haut, de droite à gauche : la Musique, le Jardin, puis la place gardée pour les Licornes.
- Avant, la carte n'avait plus de place libre pour une cinquième île sans chevauchement.

## Deux nouveaux mini-jeux
Les deux sont proposés dès 5 ans, sans minuteur. Le jeu de l'île est les coccinelles avant 7 ans, « De la graine à la fleur » ensuite.

- **🌱 De la graine à la fleur** (`lifecycle`) : les étapes de la vie de la plante (graine, pousse, bouton, fleur, fruit), du papillon (œuf, chenille, chrysalide, papillon) et de la poule. Chaque étape est dessinée et nommée.
  - Palier 1 : 3 étapes à remettre dans l'ordre.
  - Palier 2 : 4 étapes.
  - Palier 3 : 5 étapes, ou une étape manquante à retrouver.
  - Palier 4 : l'étape manquante, ou deux cycles mélangés (ne ranger que ceux de la plante).
  - Palier 5 : en plus, « Que se passe-t-il ensuite ? ». L'œuf, partagé par la poule et le papillon, n'a jamais deux bonnes réponses.
  - Compétence « Sciences » dans l'espace parents.
- **🐞 Les coccinelles** (`ladybugs`) : les deux ailes sont symétriques.
  - Palier 1 : compter jusqu'à 3 points par aile.
  - Palier 2 : les doubles jusqu'à 5 + 5.
  - Palier 3 : les doubles jusqu'à 10 + 10, ou compléter l'aile vide (↩️ enlève un point, puis « Pareil ! »).
  - Palier 4 : surtout compléter l'aile vide.
  - Palier 5 : les moitiés (« 12 points en tout, combien sur chaque aile ? »).
  - Compétence « Calcul ».
- Pour les deux jeux, une erreur relance une autre question.

## Histoire : « Le jardin endormi »
- **Le chapitre :** Grisou a posé le rêve « grandir et fleurir » sous une cloche de verre, et plus rien ne pousse.
  - Pétale pose 3 devinettes : la graine, la coccinelle, le papillon.
  - Le jardin refleurit, et Grisou est presque tout coloré : il ne lui manque plus que les couleurs des licornes.
  - Le chapitre rapporte 14 pièces et une boîte Petites bêtes, une seule fois.
- **3 épisodes,** racontés par Pois, Azur et Miella. Le dernier annonce le Royaume Arc-en-ciel.

## Tests
- Nouveau `test/jardin.test.js` (63 vérifications), branché sur `npm test`. Il couvre :
  - l'île, la carte du Ciel (une place libre pour les Licornes), les personnages, les objets et la série ;
  - les cycles toujours dans l'ordre de la vie, l'étape manquante, les cycles mélangés, une seule réponse pour « ensuite » ;
  - les ailes pareilles, les doubles sans dire le total, l'aile à compléter, les moitiés ;
  - le jeu de l'île, le chapitre, la récompense unique et les épisodes.
- Les 28 mini-jeux sont joués jusqu'à la victoire à chaque palier, avec une vérification indépendante :
  - pour les cycles, comparés à une liste d'étapes propre au test ;
  - pour les coccinelles, avec les points dessinés.
- Cache `lagon-v63`.
