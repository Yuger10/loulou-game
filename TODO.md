# TODO — Le Lagon Magique

Feuille de route du jeu. Cocher au fur et à mesure ; les idées nouvelles vont dans « Boîte à idées ».

Légende priorité : 🔴 haute · 🟠 moyenne · 🟢 basse

---

## ✅ Fait

### v1 — MVP
- [x] Écran Lagon avec 3 personnages (Marina 🧜‍♀️, Étincelle 🦄, Luna 💃)
- [x] Dialogues + bouton « Jouer »
- [x] 4 mini-jeux : mémoire, compter, intruse, puzzle
- [x] Sac (inventaire)
- [x] Marché : vendre, échanger, fusionner (2 recettes)

### v2 — Progression & ressenti
- [x] Sauvegarde automatique (localStorage) + bouton « Recommencer à zéro »
- [x] Niveaux (1 tous les 5 missions) + barre de progression
- [x] Difficulté progressive sur les 4 mini-jeux
- [x] Butin propre à chaque personnage, affiché sur sa carte
- [x] 3 dialogues aléatoires par personnage
- [x] Objet surprise bonus (20 %)
- [x] « Encore une mission » + jamais 2× le même jeu de suite
- [x] 3 nouvelles recettes (👑 🪄 🏆 dont une fusion de fusions)
- [x] Onglet « Acheter » au marché
- [x] Sons Web Audio + bouton mute
- [x] Confettis, vibration, animation des pièces, secousse sur erreur
- [x] Bouton ✖️ pour quitter un mini-jeu, badge « nouveaux objets » sur le sac

### v3 — Voix, décorations, PWA
- [x] Voix (Web Speech fr-FR) : dialogues, consignes, félicitations + bouton 🔈
- [x] Bouton son à 3 états : 🗣️ sons+voix / 🔊 sons / 🔇
- [x] Scène « Mon lagon » + boutique de 10 décorations
- [x] 5ᵉ mini-jeu « La suite magique » (suite logique)
- [x] PWA : manifest, icône, service worker (hors-ligne, plein écran)
- [x] Test de fumée jsdom (`npm test`)

### v4 — Prénom, missions du jour, album
- [x] Voix : emojis prononcés (« Combien y a-t-il d'étoiles ? ») + choix d'une voix féminine française naturelle
- [x] Écran de bienvenue : prénom + choix d'avatar (10 emojis), modifiable via la pastille en haut
- [x] Félicitations personnalisées (« Bravo Loulou ! ») à l'écran et à la voix
- [x] Missions du jour : 3 objectifs tirés chaque jour + coffre bonus (15 pièces + un objet)
- [x] Album de collection : objets et décorations découverts vs « ? », barre de progression
- [x] Tests étendus (33 assertions)

### v5 — Simon, écran titre, dialogues vivants
- [x] 6ᵉ mini-jeu « Répète après moi » (Simon) : séquence lumineuse et sonore à reproduire, 3 à 6 étapes selon le niveau
- [x] Écran titre animé (poissons, personnages, « Jouer ») — débloque aussi le son/la voix sur iOS
- [x] Dialogues contextuels : les personnages parlent de ses missions du jour, de son stock, des recettes presque finies, de son lagon décoré
- [x] Salutation personnalisée dans les dialogues (« Coucou Loulou ! »)

### v6 — Chantier technique
- [x] Découpage en `index.html` + `styles.css` + `js/{data,state,ui,minigames,market,init}.js`
- [x] Icônes PNG 192/512/180 pour la PWA (rendu de l'emoji 🧜‍♀️ sur fond dégradé)
- [x] Sauvegarde versionnée (`v: 1`) avec migration automatique des anciennes parties
- [x] Tests étendus : migration, reset, écran titre, Simon (41 assertions)
- [x] `lagon-magique.html` conservé en redirection

---

## 🔜 À faire

### Priorité 🔴 — tester avec elle d'abord
- [ ] **Session de test avec Loulou** : noter quel mini-jeu elle préfère / lequel la bloque
- [ ] Vérifier la voix sur iPad/iPhone (Safari exige une interaction avant de parler)
- [ ] Installer une voix française premium (Audrey / Aurélie) sur l'appareil : Réglages → Accessibilité → Contenu énoncé → Voix
- [ ] Vérifier la taille des boutons et la lisibilité au doigt sur son appareil
- [ ] Installer la PWA sur son appareil (« Ajouter à l'écran d'accueil »)
- [ ] Ajuster la difficulté selon ce qu'on observe (nombre de paires, tailles de suites…)

### Priorité 🟠 — personnalisation & objectifs
- [ ] **Album complet** : récompense spéciale quand tout est découvert

### Priorité 🟢 — contenu
- [ ] **2ᵉ décor « La forêt enchantée »** débloqué au niveau 3 : fée 🧚‍♀️, biche 🦌, nouveaux objets (champignon, gland, plume) et recettes
- [ ] Nouveaux personnages (dauphin 🐬 parlant, petit crabe 🦀)
- [ ] Plus de décorations et possibilité de les placer / réorganiser
- [ ] Événements spéciaux (anniversaire, Noël : décos de saison)
- [ ] Musique d'ambiance douce (Web Audio, boucle, activable)
- [ ] Mini-jeu « Assembler l'image » (vrai puzzle 2×2 puis 3×3 en déplaçant des pièces)

### 🔧 Technique
- [ ] Étendre encore le test de fumée (mémoire complète, niveaux, toggle son)
- [ ] Hébergement gratuit (GitHub Pages / Netlify) pour y accéder sans le Mac allumé
- [ ] Mode « parent » discret (long-press sur le titre) : reset, stats de jeu, réglages voix

---

## 💡 Boîte à idées (non triées)
- Coffre au trésor quotidien à ouvrir au lancement
- Pouvoir offrir un objet à un personnage → il dit merci + petite animation
- Météo dans le lagon (soleil / pluie / nuit) qui change selon l'heure
- Compagnon (poisson 🐠) qui suit la progression et grandit
- Mode 2 joueurs à tour de rôle (avec une copine / un frère)
- Export / import de la sauvegarde (QR code) pour changer d'appareil

---

## 📝 Notes de session
_(à remplir après chaque test avec elle)_

| Date | Ce qu'elle a aimé | Ce qui a bloqué | Idée / demande |
|------|-------------------|-----------------|----------------|
|      |                   |                 |                |
