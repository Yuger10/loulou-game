---
status: brouillon
issue: 0
size: M
migration: false
sensitive: true          # pause (js/features/rest/), porte des parents (js/features/parents/), règle d'interaction de tout le jeu
files: [js/shared/lib/spoken.js, js/shared/ui/handlers.js, js/shared/lib/index.js, js/shared/ui/voice.js, js/shared/ui/listen.js, js/shared/ui/modal.js, js/shared/ui/views.js, js/shared/ui/feedback.js, js/shared/ui/index.js, js/shared/styles/voice.css, js/slices.cjs, js/features/screen/screen.js, js/features/minigame-engine/engine.js, js/features/hints/hints.js, js/features/settings/settings.js, js/features/profile/topbar.js, js/features/profile/profile.js, js/features/island/island-view.js, js/features/players/profiles-ui.js, js/features/market/market.js, js/features/companion-team/team.js, js/features/rest/rest.js, js/features/parents/parents.js, js/features/story/story.js, js/features/squishies/squishy-room.js, js/features/wardrobe/wardrobe.js, js/features/map/map.js, js/features/island/island.js, js/features/companion-team/specialties.js, js/app/init.js, js/features/market/market.css, js/shared/styles/design-system-v21.css, js/shared/styles/pointer-v13.css, js/features/minigames/*/*.js, test/voix-partout.test.js, test/voix-file.test.js, test/voix-ecrans.js, AGENTS.md, conductor/checklist-mini-jeu.md, conductor/product-guidelines.md]
taster: { facts: 0, decisions: 0, rounds: 3 }
---

<!-- Gabarit cothon 0.4.0 (setting-up-docs), adopté dans Conductor. -->

# Spec : une voix partout

- Nouveau projet : non
- Suivie par : [voix-naturelle](../voix-naturelle_20261122/spec.md), qui branche des clips enregistrés dans la file de parole définie ici.

## Problème

La joueuse a 6 ans et apprend à peine à lire. Une bonne part de ce que le jeu lui montre ne se lit pas à voix haute : l'écran d'accueil, la barre du bas, les noms des jeux, les boutons des dialogues, les messages du marché, les choix écrits de plusieurs mini-jeux, les petits messages qui passent (« Dernier essai ! »). Quand deux phrases se suivent de près, la seconde coupe la première. Elle doit pouvoir **tout entendre**, sans être noyée sous la voix, et sans qu'écouter un bouton le déclenche.

## Comportement attendu

Vocabulaire : un **texte** est un nœud texte visible qui contient une lettre ou un chiffre après `toSpoken()`. Une **scène** est ce qui est à l'écran entre deux changements : `switchView`, `openModal`, `closeModal`, l'écran titre, l'accueil, la fenêtre de pause. Une lecture **automatique** vient du jeu ; une lecture **à la demande** vient d'un toucher de l'enfant (texte, 🔈, bouton inactif).

La file de parole (phase 1)

1. Étant donné une phrase en cours dans la scène courante, quand le jeu appelle `speak(b)`, alors `b` est dite après la fin de la phrase en cours, sans la couper (exemple : `calendar` dit les saisons après la consigne, sans le `setTimeout` de 1 600 ms de `js/features/minigames/calendar/calendar.js:65`).
2. Étant donné une phrase en cours qui appartient à une scène précédente, quand le jeu appelle `speak(b)`, alors la phrase en cours s'arrête, la file se vide, et `b` est dite.
3. Étant donné `speak(b, { interrupt: true })`, quand il est appelé, alors la phrase en cours s'arrête, la file se vide, et `b` est dite tout de suite. Les appelants sont fixés par la table « Appelants de `speak` » (Politiques).
4. Étant donné que la même phrase (même texte après `toSpoken`) est en cours ou en attente, quand `speak` la redemande, alors elle n'est pas ajoutée une seconde fois.
5. Étant donné 3 phrases déjà en attente, quand une quatrième arrive, alors la plus ancienne en attente est retirée.
6. Étant donné que `speechSynthesis.speaking` est faux (rien ne parle, ou un événement `end` perdu), quand `speak` est appelé, alors la phrase est dite tout de suite.
7. Étant donné `stopSpeech()`, quand il est appelé, alors la phrase en cours s'arrête, la file se vide et le son remonte (`setVoiceDuck(false)`). `closeModal()`, la voix coupée dans les réglages ou par le bouton son, et les deux « Pas maintenant » (`#btn-close` du dialogue, `js/features/island/island-view.js:363`, et `#rest-skip` de la pause, `js/features/rest/rest.js:400-408`, qui dit ensuite sa phrase avec `interrupt`) appellent `stopSpeech()` ; l'affichage du voile de la pause (`renderVeil`, `js/features/rest/rest.js:178`) appelle `newVoiceScene()` ; plus aucun fichier de `js/` sauf `js/shared/ui/voice.js` ne contient `speechSynthesis` (vérifié par test).
8. Étant donné qu'aucun `pointerdown` ni `keydown` n'a encore eu lieu dans la session, quand `speak` est appelé, alors rien n'est dit ni mis en file (iOS refuse la parole avant un geste ; cas réels : pause due au lancement, `js/features/rest/rest.js:255`, et sauvegarde illisible, `js/features/parents/storage-alert.js:20`).
9. Étant donné une fenêtre qui se referme, quand elle se rouvre avec la même consigne (missions du jour, équipe, chambre à squishies), alors sa consigne est relue. C'est déjà le cas : le moteur oublie la consigne à chaque fermeture (`onModalClose(() => forgetSpokenHint())`, `js/features/minigame-engine/engine.js:517-519`, et `onModalClose` vaut pour toute fenêtre). Ce point reste au moteur, sans déplacement ; la ligne 9 devient un test de non-régression.

Écouter au doigt (phase 2)

Un élément est **actif** s'il est `button`, `a[href]`, `input`, `select`, `textarea`, `[role="button"]`, `[role="tab"]`, ou porte `data-act` (posé par `setHandler` sur un élément non actif qui reçoit un handler `click`, D5), ou a un ancêtre qui remplit l'une de ces conditions.

10. Étant donné un texte dont aucun ancêtre n'est actif ni `data-voix="muet"` (titre, paragraphe, bulle, étiquette, compteur, message qui passe), quand l'enfant le touche, alors le bloc qui le contient est lu (`interrupt`), et le bloc reçoit la classe `voix-lu` tant qu'il est lu.
11. Étant donné un élément actif (y compris un élément à `data-act`, ou une cible d'une délégation marquée `data-act`), quand l'enfant le touche, alors son action a lieu comme aujourd'hui ; si l'action n'a demandé aucune phrase pendant le même toucher, alors le libellé du bouton est dit (retour sonore) ; si l'action parle, seule la phrase de l'action est entendue.
12. Étant donné un bouton inactif (`aria-disabled="true"`), quand l'enfant le touche, alors rien n'est déclenché et la raison est dite : son `data-say-why`, sinon son libellé (table R).
13. Étant donné un bouton 🔈 (`.btn-speak[data-say]`), quand l'enfant le touche, alors son `data-say` est dit (`interrupt`, `demand`), sans autre action. Seule exception, le 🔈 d'une consigne de mini-jeu qui a des choix `data-voix="choix"` : il dit la consigne puis les choix (ligne 20).
14. Étant donné un élément qui a une action et un `data-say` (cartes d'activité de la pause, `js/features/rest/rest.js:190`), quand l'enfant le touche, alors l'action a lieu et `data-say` sert de libellé (ligne 11) : `bindSpeakButtons` ne remplace plus jamais le handler d'un élément qui agit.
15. Étant donné un élément marqué `data-voix="lire"` (mot à lire et choix écrits de `reading`, choix d'articles du jeu `determinants` dont le dossier est `grammar`, étiquettes de mots du futur `sentence`), quand l'enfant le touche, alors son texte n'est jamais dit : un bouton agit normalement (c'est une réponse) sans libellé dit ; un texte dit « Essaie de le lire ! ».
16. Étant donné la porte des parents (`openParentGate`, `js/features/parents/parents.js:124-170`), quand elle s'ouvre, alors seule la phrase « C'est pour les adultes. » est dite ; la question de calcul porte `data-voix="muet"` et n'est jamais dite, même touchée ; l'espace parents lui-même n'est pas concerné par cette track.
17. Étant donné la voix coupée (`audioPrefs().voice` faux) et les sons allumés, quand l'enfant touche un texte, un 🔈 ou un bouton inactif, alors la phrase est dite ; les lectures automatiques et le libellé des boutons actifs (ligne 11) restent muets. En mode « Silence » (`sound` faux), rien n'est dit.
18. Étant donné `showToast(msg)`, quand il est appelé, alors `msg` est aussi dit (lecture automatique, en file), avec les formes dites de la table D.

Lire à l'ouverture (phases 3 et 4)

19. Étant donné un écran de la table O, quand il s'ouvre, alors exactement les phrases de la colonne « Lu à l'ouverture » sont dites, dans l'ordre, et aucune autre phrase automatique.
20. Étant donné un mini-jeu de la table J, ses choix portent `data-voix="choix"` et `data-say`. À la première question d'une mission, quand `bindQuit` lit la consigne, alors il met ensuite en file chaque choix, dans l'ordre d'affichage, avec `el` = le choix (classe `voix-lu` pendant sa lecture) ; aux questions suivantes, les choix ne sont pas lus seuls. Mécanisme unique du 🔈 de la consigne : à chaque appel, `bindQuit` (après `bindSpeakButtons`) rebranche par `setHandler` le 🔈 de `.puzzle-hint` quand la fenêtre contient des `[data-voix="choix"]` : il dit la consigne (`interrupt`, `demand`) puis met les choix en file (`demand`).
21. Étant donné les fenêtres de victoire et d'échec (`js/features/minigame-engine/engine.js:353-364` et `456-481`) et la bulle d'indice (`js/features/hints/hints.js:245-268`), quand elles s'affichent, alors elles ont un bouton 🔈 qui relit la phrase déjà dite à l'ouverture.
22. Étant donné le choix d'un jeu (`openGamePicker`, `js/features/players/profiles-ui.js:449-465`), quand il s'ouvre, alors chaque carte de jeu et « Surprise » a un bouton 🔈 à côté qui dit le nom du jeu sans le lancer.

La garde (phase 2, puis élargie)

Texte **visible** en jsdom (pas de mise en page) : nœud texte du DOM qui n'est pas sous `style`, `script`, `title`, `template` ni `svg` (le texte des dessins est décoratif) ; invisible si un ancêtre (lui compris) a l'attribut `hidden`, `aria-hidden="true"`, ou un `display` calculé à `none` (`getComputedStyle`, les feuilles de style étant injectées par `test/tools/page.js`) ; `#toast` sans la classe `show` est invisible. Les attributs `placeholder`, `value` et `alt` ne sont pas des textes : un champ est couvert par son étiquette (ligne 25).

23. Étant donné chaque scénario de `test/voix-ecrans.js`, quand `test/voix-partout.test.js` l'ouvre, alors le test échoue si un texte visible n'est ni lu à l'ouverture, ni couvert par l'écoute au doigt (ligne 26), ni dans une exception de la table X ; le message cite le scénario, le texte et le sélecteur de son élément.
24. Étant donné un appel `openModal(` dans `js/` (hors `js/shared/ui/modal.js` qui le définit), sa clé est `<chemin depuis la racine>#<fonction>`, où `<fonction>` est le nom de la fonction nommée englobante la plus proche (déclaration `function f`, ou `const f = () => …` / `function` affectée à une variable, ou clé d'une méthode ou d'une propriété d'objet) ; un appel dans une fonction anonyme sans englobante nommée fait échouer le test (« nomme la fonction qui ouvre cet écran »). Quand une clé n'est ni dans `COVERS` ni dans un fichier exclu par la table X (`js/features/parents/parents.js` et `js/features/backup/backup.js`, dont seule la clé `js/features/parents/parents.js#openParentGate` reste obligatoire dans `COVERS`), alors le test échoue : « Écran sans passage dans la garde de la voix : <clé>. Ajoute un scénario dans test/voix-ecrans.js. » De même, chaque nom de `registerView` doit avoir la clé `view:<nom>` et chaque jeu de `GAME_LIST` (`js/entities/difficulty/game-types.js:112`) la clé `game:<key>` (par exemple `game:memory`, `game:determinants`).
25. Étant donné un scénario, juste après son ouverture (avant tout toucher), alors le test échoue s'il trouve un `button[disabled]` visible dont le texte contient une lettre ou un chiffre (un bouton inactif doit dire pourquoi, ligne 12 ; les `disabled` posés en cours de jeu restent permis, table I), ou un `input`, `select` ou `textarea` visible sans étiquette. Comptent comme étiquette : un `label[for=<id>]`, un `label` ancêtre, `aria-label` non vide, ou `aria-labelledby` vers un élément au texte non vide. Manques connus, corrigés en phase 2 : `#gate-in` (`js/features/parents/parents.js:135`, `aria-label="Réponse"`) et le prénom du formulaire des joueurs (`js/features/players/profiles-ui.js:192`, `aria-label="Prénom"`). `#rg-volume` a déjà son `label for` (`js/features/settings/settings.js:52-53`).
25b. Étant donné les `addEventListener('click'` de `js/`, quand le test tourne, alors leur liste (fichier et sélecteur) est égale à la liste permise de la table A (audit) : un ajout fait échouer, un retrait aussi (pour retirer la ligne de la liste), si bien que la liste ne peut que diminuer.
26. Définition de « couvert » : `listenText(el)` (la fonction même qu'utilise l'écoute au doigt) appliquée à l'élément parent du texte rend une phrase non vide, et soit un ancêtre porte `data-say` (reformulation choisie par l'auteur), soit la phrase normalisée contient le texte normalisé (minuscules, sans accents ni ponctuation, espaces réduits).
27. Étant donné la garde, quand elle se termine, alors elle affiche « voix : N scénarios, M textes, 0 sans voix » et, si `VOICE_CLIPS` existe (voix-naturelle), « clips : N phrases dites sur M ont un clip (X %) ».

## Décisions

| Id | Décision | Pourquoi | Source |
|---|---|---|---|
| D1 | Règle d'interaction : **toucher un texte le lit ; toucher un bouton l'actionne et dit son libellé ; un 🔈 accolé fait écouter sans agir là où il faut entendre avant de choisir ; un bouton inactif dit pourquoi**. Ni appui long, ni mode « oreille », ni « premier toucher lit, second agit » | Le toucher simple est le geste le plus intuitif ; les jeunes enfants croient l'appli bloquée quand il faut deux gestes ; tout texte s'écoute d'un toucher chez Khan Academy Kids | https://joanganzcooneycenter.org/wp-content/uploads/2020/02/SesameWorkshop-2012.pdf (« Tap is the most intuitive… », « Double Tap: … tend to think the app is unresponsive ») ; https://blog.khanacademy.org/supporting-english-language-acquisition-with-khan-academy-kids/ (« Every text element in the app is interactive… with a simple tap ») ; https://www.nngroup.com/articles/children-ux-physical-development/ |
| D2 | Pas d'appui long | 50 % de réussite à 500 ms chez les 2-3 ans, geste le plus raté à cause du doigt qui glisse ; rien à l'écran n'indique qu'il existe ; les enfants appuient déjà « too hard, long » : un toucher un peu long serait pris pour « écouter » et l'action ne partirait pas. Aucune étude ouverte ne mesure le geste à 6 ans | https://riunet.upv.es/bitstream/handle/10251/64752/IJHCS-Nacher.pdf?sequence=2 ; https://www.w3.org/TR/mobile-accessibility-mapping/ (gestes sans indicateur à l'écran) ; PDF Sesame ci-dessus |
| D3 | Pas de mode « oreille » | État invisible : l'enfant oublie qu'il est actif. Aucune source pour ce schéma chez les jeunes enfants | défaut du rédacteur, à juger à la revue |
| D4 | Pas de « premier toucher lit, second agit » en général (modèle VoiceOver et TalkBack) | Toutes les actions prendraient deux touchers ; Sesame ne le garde que contre une navigation accidentelle | https://support.apple.com/guide/iphone/learn-voiceover-gestures-iph3e2e2281/ios ; https://support.google.com/accessibility/android/answer/6151827?hl=en ; PDF Sesame |
| D5b | Un élément n'est reconnu actif que par sa balise ou par `data-act`, posé par `setHandler`. La phase 2 fait l'audit des `addEventListener('click'` et des délégations (table A), migre vers `setHandler` ce qui peut l'être, et la garde fige la liste restante (ligne 25b). Une délégation sur un conteneur doit viser des éléments actifs par leur balise, ou poser `data-act` sur ses cibles au rendu | `AGENTS.md` impose déjà `setHandler` pour tout handler (`addEventListener` direct seulement pour plusieurs écouteurs voulus ou la capture, `.onclick` interdit par oxlint) | tranché par Claude d'après AGENTS.md, Amrou peut contredire |
| D5 | L'écoute au doigt est **un seul écouteur délégué** sur `document`, en phase de capture (`addEventListener('click', …, { capture: true })`), dans `js/shared/ui/listen.js` : aucun écran n'a à la brancher | Rend l'oubli impossible pour tout écran futur ; passe avant les handlers posés par `setHandler`, qui remplacent le précédent et ne permettent pas à un bouton d'agir et de se lire avec deux handlers | `js/shared/ui/handlers.js:28-48` ; `AGENTS.md` (Conventions : `addEventListener` direct pour `{ capture: true }`) |
| D6 | Le libellé d'un bouton actif est dit **après** ses handlers, seulement si aucun `speak` n'a eu lieu pendant ce toucher (`setTimeout(…, 0)` qui compare un compteur de `speak`) | Évite deux voix pour un même toucher (réponse de jeu, navigation vers un écran qui se présente) ; garde un retour sonore sinon | PDF Sesame (« Sound effects are an effective way to communicate input registration ») ; défaut du rédacteur, à juger à la revue |
| D7 | Bouton inactif : `aria-disabled="true"` + `data-say-why`, plus jamais l'attribut `disabled` à l'ouverture d'un écran ; inventaire et sort de chaque `disabled` dans la table I ; la règle CSS `[aria-disabled="true"]` est ajoutée à côté de chaque `:disabled` des boutons concernés (`js/features/market/market.css:69`, `132` ; `js/shared/styles/design-system-v21.css:263-264` ; `js/shared/styles/pointer-v13.css:31-34`) | Un bouton `disabled` ne reçoit pas le toucher : il ne peut pas dire pourquoi. Le jeu le fait déjà pour les réglages du son | `js/features/settings/settings.js:22`, `107` ; `js/features/market/market.js:108`, `155`, `238`, `287` ; `js/features/companion-team/team.js:347` |
| D8 | Bouton 🔈 : 56 px CSS de côté au moins, à 8 px au moins du bouton voisin | Aujourd'hui 40 px (`js/shared/styles/pointer-v13.css:143-147`) ; WCAG 2.5.5 demande 44 px, NN/g 2 cm pour les jeunes enfants, Sesame des zones « adequately isolated » | https://www.w3.org/WAI/WCAG22/Understanding/target-size-enhanced.html ; https://www.nngroup.com/articles/children-ux-physical-development/ ; défaut du rédacteur pour 56 px |
| D9 | Ce qui est lu à l'ouverture : la table O, courte (titre ou consigne, une ou deux phrases) ; tout le reste à la demande | Ne pas noyer l'enfant ; Sesame : consignes dites et montrées, consignes non essentielles interruptibles | PDF Sesame (« Primary instructions … conveyed verbally and visually », « make the unessential prompts interruptible ») |
| D10 | Le texte lu est surligné (`voix-lu` : contour 3 px `var(--sun)`, pulsation douce, sans pulsation si `prefers-reduced-motion`) | Sesame : l'audio seul ne suffit pas, l'accompagner d'un surlignage des boutons | PDF Sesame (« Combine the primary audio with any visual support possible (such as highlights on icons/buttons) ») ; couleur du 🔈 : `js/shared/styles/design-system-v21.css:276-279` |
| D11 | File de parole dans `voice.js` : en file dans une même scène, arrêt au changement de scène, `interrupt` pour la demande, 3 en attente au plus, sans doublon | Aujourd'hui chaque `speak` annule le précédent (`js/shared/ui/voice.js:125`) : deux phrases rapprochées se coupent | `js/shared/ui/voice.js:122-140` ; `js/features/minigames/calendar/calendar.js:65` |
| D12 | Rien n'est dit avant le premier geste de la session | Safari exige un geste pour jouer un média ; pour la synthèse vocale, aucune page officielle lue : précaution, vérifiée en S8 | https://webkit.org/blog/6784/new-video-policies-for-ios/ ; défaut du rédacteur |
| D13 | `toSpoken` et la table des emojis sortent de `voice.js` vers `js/shared/lib/spoken.js` (fonction pure, sans DOM), réexportée par `js/shared/lib/index.js` | La garde et le script de voix-naturelle en ont besoin hors navigateur ; `voice.js` touche `window` au chargement | `js/shared/ui/voice.js:5-68`, `145-148` |
| D14 | Voix coupée : les lectures automatiques se taisent, la demande parle ; « Silence » tait tout | L'enfant qui touche un texte demande la voix ; le parent qui choisit « Silence » veut le silence | `js/shared/ui/sound.js:356-361` ; `js/features/profile/topbar.js:7-25` ; défaut du rédacteur, à juger à la revue |
| D15 | Exception des jeux de lecture par l'attribut `data-voix="lire"` | Le mot à lire ne doit pas être dit avant la réponse : `reading` ne le dit pas aujourd'hui (`js/features/minigames/reading/reading.js:47-59`) ; `grammar` dit le nom mais jamais l'article à choisir (`js/features/minigames/grammar/grammar.js:62-69`) | code existant |
| D16 | Garde en deux parties : parcours des écrans rendus (jsdom) et inventaire statique des `openModal(` par `acorn` | Le parcours prouve la voix des écrans connus ; l'inventaire oblige à ajouter tout nouvel écran au parcours | `test/tools/boundaries.js:18-19`, `135` ; 77 appels `openModal(` dans 46 fichiers (`grep`, 22/11/2026) |
| D17 | Les toasts parlent par `showToast` lui-même | 45 appels, dont des messages d'enfant muets (`js/features/minigame-engine/engine.js:161`, `237`, `js/features/quests/quests.js:98`, `js/features/minigames/jigsaw/jigsaw.js:164`) | `js/shared/ui/feedback.js:7-13` |
| D18 | « ⚠️ Dernier essai ! » se dit « Plus qu'un essai. Prends ton temps. » | Les lignes directrices refusent la pression de « dernière chance » ; dire le texte tel quel l'amplifierait. Le texte affiché ne change pas dans cette track | `conductor/product-guidelines.md` (Surprise et collection) ; `js/features/minigame-engine/engine.js:161` ; défaut du rédacteur, à juger à la revue |
| D19 | Confirmation avant achat ou vente : hors de cette track | Sesame la recommande pour les conséquences importantes, mais elle change les parcours du marché ; à décider à part | PDF Sesame (« require confirmation when a major program consequence will result ») ; défaut du rédacteur |
| D21 | Types stricts (`js/shared/` est vérifié par `tsconfig.strict.json` depuis la v66.8) : chaque nouvel export de `js/shared/` a ses `@param`, `@returns` et `@typedef` (table « Types » des Contrats), sans `any` ni `@ts-ignore` ; `bun run typecheck` vert à chaque phase | règle des types stricts | `tsconfig.strict.json` ; `conductor/checklist-mini-jeu.md` ; `AGENTS.md` (Conventions : types en JSDoc) |
| D20 | Aucune migration : rien n'est ajouté à la sauvegarde (le « déjà lu » de l'intro d'île est en mémoire, par session) | Pas de nouveau champ d'état | `js/entities/game-state/state.js` (non touché) |

## Politiques

- **Arbitrages** :
  - Lecture automatique contre demande : la demande gagne toujours (`interrupt`).
  - Nouvelle scène contre phrase en cours : la nouvelle scène gagne (la phrase s'arrête au premier `speak` de la nouvelle scène ; `openModal` seul ne coupe rien, comme aujourd'hui ; `closeModal` coupe).
  - Jeu de lecture contre « tout s'écoute » : le jeu de lecture gagne pour le mot à lire et les choix écrits, avant la réponse (ligne 15).
  - Garde contre vitesse : un écran ajouté sans scénario fait échouer `check`. Le scénario s'ajoute ; la garde ne s'assouplit jamais, la table X ne s'allonge que par une ligne de décision d'Amrou.
  - Retour sonore du bouton contre phrase de l'action : la phrase de l'action gagne (D6).
- **Règles de l'écouteur** (`js/shared/ui/listen.js`, phase 2) :
  - Élément **interactif** : `button, a[href], input, select, textarea, [role="button"], [role="tab"]`, ou tout élément ayant un handler posé par `setHandler(…, 'click', …)` (repéré par un attribut `data-act` que `setHandler` pose sur l'élément quand le type est `click` et que l'élément n'est pas interactif).
  - **Libellé** d'un élément (`listenText(el)`) : `data-say` s'il existe ; sinon le texte visible de l'élément (`toSpoken(el.textContent)`), sans les sous-éléments `aria-hidden="true"` ; sinon `aria-label`.
  - **Bloc** d'un texte hors bouton : le plus proche de `[data-say], h1, h2, h3, h4, p, li, label, .speech, .hint-bubble, .view-hint, .name, .sub, .toast` ; à défaut, le parent direct du texte.
  - Le 🔈 (`.btn-speak[data-say]`) garde son handler de `bindSpeakButtons` ; l'écouteur l'ignore. `bindSpeakButtons` ne branche plus que `.btn-speak[data-say]` et les `[data-say]` non interactifs.
  - Un toucher qui fait défiler ne lit rien (le navigateur n'envoie pas de `click` après un défilement).
- **Table O : lu à l'ouverture** (tout le reste : à la demande)

| Écran | Lu à l'ouverture | Source du texte |
|---|---|---|
| Écran titre `#splash` | rien (avant le premier geste) ; toucher le titre lit « Le Lagon Magique. En route pour l'aventure ? » | `index.html:196`, `200` |
| Accueil `#welcome` | « Bienvenue dans le lagon ! Écris ton prénom, puis choisis ton avatar et ton compagnon. » | nouveau |
| Vue Carte | « La carte » | `index.html:113` |
| Vue Île | l'arrivée existante (`${w.name} ! ${w.subtitle}.`), puis l'intro de l'île (`w.intro`, par exemple « Touche un personnage pour l'aider. ») une fois par île et par session | `js/features/island/island-view.js:58`, `195-196` ; `js/entities/world/worlds.js:42` |
| Vue Sac | « Mon sac » (ou la phrase existante du sac vide) | `index.html:145` ; `js/features/bag/bag.js:55` |
| Vue Marché | « Le marché » | `index.html:165` |
| Vue Réglages | « Réglages » | `index.html:159` |
| Dialogue d'un personnage | la réplique (existant) | `js/features/island/island-view.js:336-343` |
| Offre du défi de Zap | « Un défi bonus ? Un cran plus difficile, et la récompense est doublée ! » | `js/features/companion-team/specialties.js:311` |
| Choix d'un jeu | l'en-tête existant (`gameHeader`, lu par `bindQuit`) | `js/features/players/profiles-ui.js:454` |
| Mini-jeu | la consigne (existant), puis les choix écrits pour la table J | `js/features/screen/screen.js:50-58` |
| Victoire, échec, indice | la phrase existante | `js/features/minigame-engine/engine.js:351`, `450` ; `js/features/hints/hints.js:268` |
| Fenêtres à en-tête (missions, équipe, chambre à squishies, journal, cadeaux, magasin de décos) | l'en-tête existant (`gameHeader` + `bindQuit`), relu à chaque ouverture (ligne 9) | `js/features/quests/quests.js:127` ; `js/features/companion-team/team.js:356`, `370` ; `js/features/story/story.js:645` ; `js/features/gifts/gifts.js:112` ; `js/features/island/island-view.js:216` |
| Histoire, épisodes | la réplique (existant) | `js/features/story/story.js:478`, `521` ; `js/features/story/episodes.js:497` |
| Pause : début | la phrase d'intro existante | `js/features/rest/rest.js:255` |
| Pause : « À demain ! » rouvert endormi | « L'île dort. On revient demain. » | `js/features/rest/rest.js:201`, `251` |
| Porte des parents | « C'est pour les adultes. » | nouveau (ligne 16) |
| Message qui passe (toast) | le message (table D) | `js/shared/ui/feedback.js:7` |

- **Table J : mini-jeux dont les choix écrits sont lus après la consigne** (première question d'une mission). Forme dite : `data-say` posé sur chaque choix par le jeu.

| Jeu | Choix | Forme dite | Source |
|---|---|---|---|
| `clock` | « 3 h 30 » | « 3 heures 30 » ; « 1 heure » au singulier ; minute 0 omise (« 4 heures ») | `js/features/minigames/clock/clock.js:78` |
| `planets` | réponses en mots, noms sous les images | le texte affiché | `js/features/minigames/planets/planets.js:419-420` |
| `volume` | cube, boule, cylindre, cône, pavé | le texte affiché | `js/features/minigames/volume/volume.js:137` |
| `calendar` (jours) | lundi … dimanche | le texte affiché ; la consigne dit « de lundi à jeudi » au lieu de « lundi → jeudi » | `js/features/minigames/calendar/calendar.js:93` |
| `calendar` (saisons) | les saisons | déjà dites ; passent par la file (ligne 1) | `js/features/minigames/calendar/calendar.js:60-65` |
| `pitch` | « Elle monte », « Elle descend » | le texte affiché | `js/features/minigames/pitch/pitch.js:113-114` |
| `rhythm` | Boum, Bouuum, Chut | le texte affiché | `js/features/minigames/rhythm/rhythm.js:34-36` |
| `potions` | noms des couleurs | le texte affiché | `js/features/minigames/potions/potions.js:91` |
| `lifecycle` | étapes | le texte affiché | `js/features/minigames/lifecycle/lifecycle.js:75` |
| `share` | ½, ⅓, ¼ | « un demi », « un tiers », « un quart » | `js/features/minigames/share/share.js:200` |

  Les textes d'état et d'aide de ces jeux (`rhythm` « Écoute… », « À toi ! », « Lis le rythme… », `rhythm.js:87`, `131`, `133`, `150` ; `simon` « Regarde… », « Regarde encore… », « À toi ! », `simon.js:44`, `79`, `85`, `96` ; aide de `jigsaw`, `jigsaw.js:113` ; astuce de `cubes`, `cubes.js:144` ; étiquette de `packs`, `packs.js:74-76`) sont dits à chaque changement d'état pour `rhythm` et `simon` (ce sont des signaux de tour) et à la demande pour les autres.

- **Table R : raisons des boutons inactifs**. Pluriel : `{n} pièce` si n vaut 1, sinon `{n} pièces` (même règle pour « double »). Quand deux raisons valent ensemble, la première de la ligne gagne.

| Bouton | Raison dite (`data-say-why`), par ordre de priorité | Source |
|---|---|---|
| « Acheter » d'un objet (marché) ou d'une décoration (magasin de l'île), pièces insuffisantes | « Il te faut {prix} pièces. » | `js/features/market/market.js:238` ; `js/features/island/island-view.js:228` |
| « Acheter » une boîte de squishies (`#sqm-buy`) | 1. plus de boîte aujourd'hui : « Reviens demain pour d'autres boîtes ! » ; 2. pièces insuffisantes : « Il te faut {prix} pièces. » (ordre et textes de `js/features/market/market.js:166`) | `js/features/market/market.js:155`, `166` |
| Échange de doubles (`#sqm-trade`) | son libellé : « Encore {n} doubles » (ou « Encore 1 double »), sinon « Choisis un squishy » | `js/features/market/market.js:100-108` |
| « Il manque des objets » (fusion) | « Il manque des objets. » | `js/features/market/market.js:287` |
| « ➕ Équipe », équipe pleine | « Ton équipe est déjà complète. » | `js/features/companion-team/team.js:341`, `347` |
| Chapitre verrouillé du journal (`.story-chap.locked`) | « Ce chapitre s'ouvre avec son île. Continue tes missions ! » | `js/features/story/story.js:626` |
| Tout autre bouton inactif ajouté plus tard | une raison écrite dans la spec qui l'ajoute, sinon son libellé | |

- **Table I : inventaire des `disabled` de `js/`** (`grep -rn disabled js`, 22/11/2026, hors `aria-disabled`)

| Fichier:ligne | Quoi | Sort |
|---|---|---|
| `js/features/market/market.js:108`, `155`, `238`, `287` | boutons du marché inactifs au rendu | `aria-disabled` + table R (phase 2) |
| `js/features/island/island-view.js:228` | « Acheter » d'une décoration | `aria-disabled` + table R (phase 2) |
| `js/features/companion-team/team.js:347` | « ➕ Équipe » | `aria-disabled` + table R (phase 2) |
| `js/features/story/story.js:626` | chapitre verrouillé | `aria-disabled` + table R (phase 2) ; le style `.story-chap.locked` existe déjà |
| `js/features/minigame-engine/engine.js:128-148`, `js/features/hints/hints.js:313`, `js/features/minigames/jigsaw/jigsaw.js:142`, `memory/memory.js:49`, `shapes/shapes.js:270`, `planets/planets.js:467`, `shelf/shelf.js:114`, `nesting/nesting.js:96`, `js/features/story/story.js:561`, `js/features/squishies/squishy-room.js:1126` | réponse neutralisée après une erreur, carte trouvée, pièce ou objet déjà placé, case sans action dans un jeu ou une énigme | gardés : posés en cours de jeu, déjà accompagnés d'un son et d'un indice parlé (`js/features/screen/screen.js:9-23`) ; `shelf.js:114` est sans texte |
| `js/features/squishies/squishy-room.js:890` | bouton « Ouvrir ! » pendant l'animation d'ouverture | gardé : état de moins d'une animation, pendant lequel la boîte parle déjà |
| `js/features/update/update.js:116`, `126` | recherche de mise à jour | hors périmètre : espace parents |
| `js/features/settings/settings.js:21` | nom de paramètre (`rgSwitch`) | rien à faire : déjà `aria-disabled` |

- **Table A : audit des `addEventListener('click'`** (`grep -rn "addEventListener('click'" js`, 22/11/2026) et des délégations (`grep -rn "target.*closest(" js`)

| Fichier:ligne | Élément | Sort (phase 2) |
|---|---|---|
| `js/app/init.js:108` | `#btn-back-map` | `setHandler` |
| `js/app/init.js:113` | `[data-sactab]` (onglets du sac) | `setHandler` |
| `js/app/init.js:118`, `122` | `#quests-btn`, `#story-btn` | `setHandler` |
| `js/app/init.js:128`, `132` | `#modal-close`, `#modal-handle` | `setHandler` |
| `js/app/init.js:136` | `#overlay` | **gardé** : n'agit que si `e.target` est le fond lui-même ; un `data-act` sur `#overlay` rendrait muet tout le contenu des fenêtres |
| `js/app/init.js:143`, `147`, `151` | `#btn-splash-play`, `#avatar-pill`, `#btn-start` | `setHandler` |
| `js/features/profile/topbar.js:7` | `#sound-btn` | `setHandler` |
| `js/features/market/market.js:37` | `.tab-btn` du marché | `setHandler` |
| `js/features/island/island.js:550` | `.isle-char` (boutons des personnages) | `setHandler` |
| `js/features/squishies/squishy-room.js:1217` | `#squishy-btn`, `#sq-room-link` | `setHandler` |
| `js/shared/ui/views.js:55` | `.navbtn` | `setHandler` |
| `js/features/companion-team/team.js:195-196` | délégation sur `document` vers `[data-team-slot]` | **gardé** : les cibles sont des `button` (`index.html:96`, `133`), actives par leur balise |
| `js/shared/ui/listen.js` (nouveau) | écouteur de l'écoute au doigt, en capture | **gardé** : c'est le mécanisme |

  Les écouteurs `pointerdown` et `pointerup` (glisser : `js/features/minigames/jigsaw/jigsaw.js:185`, `230` ; `js/features/island/island.js:568`, `622`) et la délégation de `js/features/hints/hints.js:201` (relance du minuteur d'indice, pas une action) ne sont pas concernés. Liste permise de la ligne 25b après la phase 2 : les trois lignes « gardé ».

- **Appelants de `speak`** (inventaire de `grep -rn "speak(" js`, 96 appels hors `voice.js`). **Demande** (`demand: true`, dite même voix coupée, ligne 17) : l'écoute au doigt (`listen.js`), `bindSpeakButtons` (`js/shared/ui/voice.js:142-149`), la relecture de Perle (`js/features/companion-team/specialties.js:184`), l'indice demandé au bouton 💡 (`useHint`, `js/features/hints/hints.js:208-228`, qui passe `demand` à `showHint`, et l'encouragement de `hints.js:212`), les touchers dont la seule action est de parler : `js/features/island/island.js:617`, `js/features/wardrobe/wardrobe.js:365`, `368`, `js/features/squishies/squishy-room.js:858`, `864`, `870`, `js/features/map/map.js:76`, `js/features/island/island-view.js:48`, `js/features/settings/settings.js:110`, et les raisons de la table R. **Interruption** (`interrupt: true`) : toutes les demandes, `speakWrongHint` (`js/features/screen/screen.js:22`, automatique : muet si la voix est coupée), `showHint`, `#rest-skip` (`js/features/rest/rest.js:407`). **Automatique** (sans option) : tous les autres appels.

- **Table D : formes dites des messages qui passent**. Par défaut, `toSpoken(msg)`. Exceptions : « ⚠️ Dernier essai ! » se dit « Plus qu'un essai. Prends ton temps. » (D18) ; `${lives} essais restants` se dit tel quel ; le libellé du mode son (`soundModeLabel()`) se dit tel quel sans l'emoji.
- **Table X : exceptions de la garde** (courte, chaque ligne justifiée)

| Exception | Pourquoi |
|---|---|
| `[data-voix="lire"]` | jeux de lecture : le mot à lire ne se dit pas avant la réponse (D15) |
| `aria-hidden="true"`, `[hidden]`, éléments non affichés | invisibles ou décoratifs |
| `[data-voix="muet"]` (seul usage : la question de calcul de la porte des parents, `js/features/parents/parents.js:124-170`) | une enfant de 6 ans ne doit pas pouvoir passer la porte grâce à la voix |
| Espace parents (`js/features/parents/parents.js`, sauf la porte), sauvegarde et import (`js/features/backup/backup.js`) | écrans d'adulte |
| `disabled` posés en cours de jeu (table I) | réponse neutralisée ou déjà placée, déjà accompagnée d'un indice parlé ; la garde ne regarde `disabled` qu'à l'ouverture (ligne 25) |

- **Défauts** : constantes plutôt que réglages (3 en attente, 56 px, 8 px) ; aucune dépendance ; textes de l'enfant au présent, tutoiement, ton chaleureux ; un nouveau texte d'interface n'a rien à faire pour être écoutable (écouteur délégué), il doit seulement éviter `disabled` et, pour une forme dite différente, poser `data-say`.
- **Référence visuelle** : le 🔈 existant (`.btn-speak`, `js/shared/styles/design-system-v21.css:276-279`, agrandi par D8) ; la bulle de consigne (`.puzzle-hint`, `js/features/screen/screen.js:31-35`) pour placer les 🔈 ajoutés.
- **Détails non écrits** : l'agent prend l'option la plus simple, la note dans le journal de décisions du plan, l'humain juge à la revue.

## Hors périmètre

- La voix elle-même (timbre, clips enregistrés) : [voix-naturelle](../voix-naturelle_20261122/spec.md).
- L'espace parents (adulte), sauf sa porte.
- Confirmation avant achat ou vente (D19).
- Changer les textes affichés (seules leurs formes dites sont fixées ici).
- Surlignage mot à mot pendant la lecture.

## Contrats partagés

| Contrat | Forme (ou lien) | Propriétaire | Consommateurs |
|---|---|---|---|
| `speak(text, opts)` | `opts = { rate?, interrupt?, demand?, el? }` ; `rate` : vitesse (0,92 par défaut) ; `interrupt` : ligne 3 ; `demand: true` = lecture à la demande (ligne 17) ; `el` : élément surligné par `voix-lu` du début à la fin de la lecture (lignes 10 et 20), recopié dans `item.el`, `null` par défaut | cette track | tout le jeu, voix-naturelle |
| `stopSpeech()`, `newVoiceScene()` | exportés par `js/shared/ui/index.js` | cette track | `modal.js`, `views.js`, `settings.js`, `topbar.js`, `island-view.js`, `rest.js`, écran titre et accueil (`init.js`, `profile.js`), voix-naturelle |
| `playItem(item, done) → stop` | lecteur interne de la file dans `voice.js`. `item = { text, key, rate, demand, el }` : `text` tel que passé à `speak`, `key = toSpoken(text)`, `rate` (0,92 par défaut, 0,7 pour Perle), `demand` (booléen), `el` (élément surligné par `voix-lu` du début à la fin de la lecture, ou `null`). `done()` est appelé une seule fois, à la fin, à l'erreur ou à l'arrêt ; `stop()` arrête la lecture. Web Speech ici ; voix-naturelle y ajoute le clip | cette track | voix-naturelle |
| `toSpoken(text)` | `js/shared/lib/spoken.js` | cette track | `voice.js`, `listen.js`, la garde, voix-naturelle |
| `listenText(el)` | `js/shared/ui/listen.js` | cette track | l'écouteur, la garde |
| Attributs | `data-say`, `data-say-why`, `data-voix="lire"`, `data-voix="muet"` (jamais dit, même touché), `data-voix="choix"` (choix écrits lus après la consigne, table J), `data-act`, classe `voix-lu` | cette track | écrans, mini-jeux, garde |
| Types (JSDoc strict) | `js/shared/lib/spoken.js` : `/** @type {Record<string, [string, string]>} */ EMOJI_WORDS` ; `emojiWord(emoji: string, plural?: boolean): string` ; `toSpoken(text: string): string` (signatures actuelles de `js/shared/ui/voice.js:39-55`, déplacées telles quelles). `js/shared/ui/voice.js` : `/** @typedef {{ rate?: number, interrupt?: boolean, demand?: boolean, el?: HTMLElement \| null }} SpeakOptions */` (étend l'actuel `{ rate?: number }`, `js/shared/ui/voice.js:118-121`) ; `speak(text: string, opts?: SpeakOptions): void` ; `/** @typedef {{ text: string, key: string, rate: number, demand: boolean, el: HTMLElement \| null }} SpeechItem */` ; `playItem(item: SpeechItem, done: () => void): () => void` ; `stopSpeech(): void` ; `newVoiceScene(): void`. `js/shared/ui/listen.js` : `listenText(el: Element): string` ; `isActive(el: Element): boolean`. `js/shared/ui/handlers.js` : signature de `setHandler` inchangée (`js/shared/ui/handlers.js:22-28`) ; `data-act` n'est posé que si `el instanceof Element`, que le type vaut `'click'` et que `isActive` serait faux sans lui (les cibles `Record<string, unknown>` et les objets voix n'en reçoivent jamais) | cette track | voix-naturelle, garde, tout le jeu |
| Scénarios | `test/voix-ecrans.js` (CommonJS) : `SCENARIOS = [{ name, covers: [clé…], open: async (ev, d, w) => …, auto: [RegExp…] }]` et `COVERS` = union des `covers`. Clés : `<chemin>#<fonction>` (ligne 24), `view:<nom>`, `game:<key>`. `ev(code)` = `w.eval(code)` dans la fenêtre jsdom du jeu ; `d` = `w.document` ; `w` = la fenêtre. `auto` : expressions attendues, dans l'ordre, pour les premières phrases dites après `open` (vide = rien d'automatique). **État de départ commun**, posé une fois par `test/voix-partout.test.js` : page de `test/tools/page.js` (`buildHtml()`, URL `http://localhost/?saison=aucune`), faux `speechSynthesis` qui note les phrases, accueil passé comme dans `test/smoke.test.js:23-33` (`setSeasonPreview("aucune")`, clic sur « Jouer », prénom « Lina », avatar `.avatar-opt[data-av="🦄"]`, compagnon par défaut, clic sur « C'est parti ! »), puis `ev("currentProfile().age = 6; state.missions = 200; state.coins = 500; state.sound = true; state.voice = true; currentWorld = 'lagon'; closeModal(); switchView('carte')")` et un `pointerdown` sur `d.body` (premier geste). Avant chaque scénario : `ev("closeModal(); switchView('carte')")` et la liste des phrases vidée | cette track | la garde ; toute track qui ajoute un écran |

## Surface d'attaque

Aucune : pas de nouvelle entrée. Le prénom, déjà nettoyé par `cleanName()`, peut être dit comme aujourd'hui ; il n'est jamais inséré dans un attribut `data-say` sans l'échappement `&quot;` déjà utilisé (`js/shared/ui/voice.js:158`).

## Zones sensibles touchées

- Pause (`js/features/rest/rest.js`) : cartes d'activité, écran « À demain ! ».
- Porte des parents (`js/features/parents/parents.js`, `openParentGate`).
- Règle d'interaction de tout le jeu (écouteur délégué).

## Smoke test

| Id | Qui | Étapes | Attendu | Niveau visé |
|---|---|---|---|---|
| S1 | 🤖 | `bun run test voix-file` | lignes 1 à 9 (faux `speechSynthesis` qui gère `speaking` et `end`) | test-verified |
| S2 | 🤖 | `bun run test voix-partout` | lignes 10 à 27 ; tous les scénarios, 0 texte sans voix | test-verified |
| S3 | 🤖 | casser exprès un écran (texte dans un `button[disabled]`, nouvel `openModal` sans scénario) | la garde échoue avec le message attendu, puis repasse après correction | test-verified |
| S4 | 🤖 | `bun run check` | tous les tests existants verts, aucun modifié pour passer | test-verified |
| S5 | 👤 | La joueuse fait le tour : accueil, carte, île, dialogue, choix d'un jeu, 3 mini-jeux de la table J, marché, sac, pause | elle entend ce qu'elle touche, ne déclenche rien en écoutant un texte ou un 🔈, et n'est pas gênée par la quantité de voix | runtime-verified |
| S6 | 👤 | Amrou touche vite plusieurs choses dans `calendar`, la victoire, puis ferme la fenêtre | aucune phrase coupée au milieu sauf par un toucher ou un changement d'écran ; rien ne reste dit après la fermeture | runtime-verified |
| S7 | 👤 | Dans `reading` et `grammar` | le mot à lire et les choix écrits ne sont jamais dits avant la réponse | runtime-verified |
| S8 | 👤 | iPad : lancer le jeu, attendre sans toucher, puis toucher « Jouer » | rien n'est dit avant le premier toucher ; la voix marche ensuite | runtime-verified |
| S9 | 👤 | Mode « Sons seulement » puis « Silence » | lignes 17 sur l'appareil | runtime-verified |

## Questions ouvertes

