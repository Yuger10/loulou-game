---
status: validée         # brouillon | validée | faite ; posé à la demande d'Amrou le 26/11/2026 (« tu passes tout en validé »)
issue: 0
size: S                  # S | M ; L se découpe
migration: false
sensitive: true          # espace parents
files:
  - js/features/parents/bilan.js
  - js/features/parents/parents.js
  - js/features/parents/parents.css
  - js/slices.cjs
  - test/bilan.test.js
  - conductor/checklist-mini-jeu.md
taster: { facts: 0, decisions: 0, rounds: 8 }
---

<!-- Gabarit cothon 0.4.0 (setting-up-docs), adopté dans Conductor (cothon 0.2.0-2 et 0.4.0-6) : une nouvelle track part de ce fichier. -->

# Spec : le bilan de la semaine pour les parents

- Nouveau projet : non

## Problème

L'espace parents montre beaucoup de chiffres par jeu (réussites, erreurs par mission, indices, niveau, état « à l'aise » ou « à travailler » : `js/features/parents/parents.js:232-268`), mais ne dit pas quoi faire. Un parent pressé veut savoir en dix secondes ce qui va bien, ce qui résiste cette semaine, et une chose simple à faire avec son enfant, loin de l'écran. Le `TODO.md` note déjà l'envie de « lire plus finement les statistiques » (`TODO.md`, ligne « Espace parents : lire plus finement les statistiques (indices par jeu et par semaine, jeux réussis grâce à un indice) »). Idée de Claude, d'après la recherche sur l'implication des parents.

## Comportement attendu

« Fenêtre de la semaine » : `s.last` (« AAAA-MM-JJ », écrit par `todayKey`, `js/features/adaptive/skills.js:14-17,55`) est dans la fenêtre si et seulement si `debut <= s.last && s.last <= todayKey()`, comparés comme chaînes, où `debut = todayKey(d)` avec `const d = new Date(); d.setDate(d.getDate() - 6);` (calendrier local, sans dérive à l'heure d'été, contrairement à `Date.now() - 6 * 864e5`). Un `s.last` futur ou mal formé est hors fenêtre. « Partie dans la fenêtre » : au moins un jeu suivi dont `s.last` est dans la fenêtre, même avec `recent` vide (une entrée hors domaine, elle, est ignorée : politique « Entrée du bilan »). « Jeu suivi » : une clé de `GAME_LIST` ou d'un groupe de `SKILL_GROUPS`. `s` désigne `st.skills[clé]`.

1. Étant donné l'espace parents ouvert sur un enfant, quand il s'affiche, alors une carte `<section class="bk-card ps-bilan">` titrée « 🧭 Cette semaine » apparaît parmi les cartes de `parents:cards`, avant « 📈 Progrès par compétence ».
2. Étant donné aucune partie dans la fenêtre, quand la carte s'affiche, alors elle montre, dans cet ordre : « Pas de partie ces 7 derniers jours. » ; puis « Ce qui va bien : » s'il existe des jeux à l'aise (point 3, sans condition de date) ; puis la phrase de pied (point 12). Elle ne montre jamais « Ce qui résiste cette semaine : » ni « Rien ne résiste cette semaine. » (table « Rendus selon les cas »).
3. Étant donné des jeux suivis dont `skillStatus(s, clé) === 'aise'`, quand la carte s'affiche, alors la ligne « Ce qui va bien : » cite au plus 3 de ces jeux (emoji et nom), triés par `s.last` du plus récent au plus ancien, puis par clé ; sans aucun jeu à l'aise, cette ligne n'apparaît pas.
4. Étant donné un jeu suivi avec `s.last` dans la fenêtre et (`s.support === true` ou `skillStatus(s, clé) === 'difficile'`), quand la carte s'affiche, alors ce jeu « résiste » et figure sous « Ce qui résiste cette semaine : ».
5. Étant donné plus de 3 jeux qui résistent, quand la carte s'affiche, alors seuls 3 sont montrés, choisis dans cet ordre : `s.support` vrai d'abord ; puis le plus de missions ratées parmi les 6 dernières de `s.recent` ; puis `s.last` le plus récent ; puis la clé par ordre alphabétique.
6. Étant donné un jeu qui résiste, quand il est montré, alors sa ligne donne : l'emoji et le nom du jeu ; « palier N (repère : R) », où N est le `t` de la dernière entrée de `recent` (entrée saine, politique « Entrée du bilan ») et R vient de la table des repères (Décisions, D5), fragment omis si `recent` est vide ; puis, sur la ligne suivante, « Une idée sans écran : » suivi du conseil de ce jeu (table D7).
7. Étant donné un écouteur de l'événement `bilan:error-kind` qui renvoie une phrase non vide pour ce jeu, quand la ligne est montrée, alors elle ajoute « · Erreur fréquente : » suivi de la phrase retenue par la règle « Réponse d'erreur » (Politiques) ; sans phrase retenue, rien n'est ajouté. Le test vérifie le `textContent` de la carte (une phrase `a < b & "c"` s'y lit telle quelle, et aucune balise n'est créée), jamais la chaîne HTML.
8. Étant donné au moins une partie dans la fenêtre et aucun jeu qui résiste, quand la carte s'affiche, alors elle montre « Ce qui va bien : » s'il existe des jeux à l'aise, puis « Rien ne résiste cette semaine. » à la place de la liste « résiste », puis la phrase de pied.
9. Étant donné un jeu à l'aise dont `(st.stars || {})[clé]` existe avec `won` au moins 1 (track `aller-plus-loin_20261122`, en option), quand il est cité au point 3, alors son nom est suivi de « ⭐ » ; sans `st.stars`, rien ne change.
10. Étant donné un enfant autre que le joueur courant (onglet de l'espace parents), quand la carte s'affiche, alors elle utilise sa partie (`st` reçu par `parents:cards`), jamais celle du joueur courant.
11. Étant donné une partie dont `skills` est absent ou n'est pas un objet, quand la carte s'affiche, alors elle montre le rendu « fenêtre vide, aucun jeu à l'aise » (table « Rendus selon les cas ») ; étant donné une entrée saine jamais jouée (`last: null`, `recent: []`, créée par un indice, `js/features/hints/hints.js:417`), ce jeu n'est dans aucun bloc.
12. Étant donné la carte, quand elle s'affiche, alors elle se termine par « Ces idées viennent des parties jouées sur cet appareil. Rien n'est envoyé ailleurs. »
13. Étant donné la carte, quand elle s'affiche, alors son texte ne contient aucun « % », aucune note (« /10 », « /20 »), et aucun des mots « moyenne », « autres enfants », « en retard », « retard », « faible ».
14. Étant donné la table des conseils `BILAN_TIPS`, quand le test parcourt toutes les clés de `GAME_LIST` et de `SKILL_GROUPS`, alors chaque clé a un conseil non vide, qui finit par « . », « ? » ou « » » ; un jeu sans conseil fait échouer le test.
15. Étant donné le fichier `js/features/parents/bilan.js`, quand le test le lit, alors il ne contient ni `fetch(`, ni `XMLHttpRequest`, ni `sendBeacon`, ni `navigator.share`, ni `WebSocket`.
16. Étant donné la table `BILAN_TIPS` et `GAME_LIST`, quand le test les parcourt, alors aucun conseil ni aucun nom ne contient `<`, `>`, `&` ou `"` (ces textes constants s'insèrent sans échappement).
17. Étant donné une partie enregistrée (texte JSON) avec un jeu à l'aise et joué dans la fenêtre (référence), quand le test rend hors domaine **un seul champ** de cette entrée parmi ceux que `readSave` laisse passer (`last` à `'hier'` puis `'2026-1-5'` ; `recent` de 11 entrées ; `t` à `0`, `7`, `2.5` ; `e` à `1.5` ; `wins` à `2.5` ; `fails` à `1.5`), puis la lit par `readSave(texte)` comme le jeu, alors pour chaque cas : `bilanHTML(st)` ne lève pas d'exception, le nom du jeu n'apparaît nulle part dans le `textContent` de la carte, la carte suit le rendu des autres jeux comme si ce jeu n'existait pas, et `JSON.stringify(st)` est identique avant et après `bilanHTML` (le bilan ne corrige jamais la partie). Étant donné les valeurs que `readSave` corrige déjà (`wins: -1`, `t: '3'` devenu 0, `ok: 1`, `support: 'oui'`, `recent` absent, `s` à `null`), quand la partie est lue par `readSave` puis rendue, alors `bilanHTML` ne lève pas d'exception et traite l'entrée remise en forme selon les autres points (par exemple `t: '3'` devient 0, donc le jeu est ignoré).
18. Étant donné un seul jeu suivi, avec `s.support === true`, statut `aise` et `s.last` hors de la fenêtre, quand la carte s'affiche, alors il ne résiste pas (point 4), la fenêtre est vide et la carte montre « Pas de partie ces 7 derniers jours. », « Ce qui va bien : » avec ce jeu, puis la phrase de pied (point 2) ; le même jeu avec `s.last` dans la fenêtre résiste, n'est plus cité dans « Ce qui va bien », et la carte montre « Ce qui résiste cette semaine : » avec ce jeu, puis la phrase de pied.
19. Étant donné 4 jeux qui résistent dont l'un est aussi `aise` (en soutien) et classé 4e, quand la carte s'affiche, alors il n'est montré ni dans « résiste » (limite de 3) ni dans « va bien » : un jeu qui remplit la règle du point 4 n'est jamais cité dans « va bien », qu'il soit montré ou coupé par la limite.

### Rendus selon les cas

Ordre fixe des blocs : titre, « Pas de partie ces 7 derniers jours. » (fenêtre vide seulement), « Ce qui va bien : », « Ce qui résiste cette semaine : » ou « Rien ne résiste cette semaine. » (fenêtre non vide seulement), phrase de pied. Un jeu ne résiste que s'il est joué dans la fenêtre : « fenêtre vide » et « jeux qui résistent » ne vont jamais ensemble.

| Fenêtre | Jeux à l'aise (hors ceux qui résistent) | Jeux qui résistent | Rendu entre le titre et la phrase de pied |
|---|---|---|---|
| vide | aucun | aucun (forcé) | « Pas de partie ces 7 derniers jours. » |
| vide | au moins un | aucun (forcé) | « Pas de partie ces 7 derniers jours. » ; « Ce qui va bien : … » |
| non vide | aucun | aucun | « Rien ne résiste cette semaine. » |
| non vide | au moins un | aucun | « Ce qui va bien : … » ; « Rien ne résiste cette semaine. » |
| non vide | aucun | au moins un | « Ce qui résiste cette semaine : » et ses lignes (3 au plus) |
| non vide | au moins un | au moins un | « Ce qui va bien : … » ; « Ce qui résiste cette semaine : » et ses lignes |

Le test construit les six cas et compare le `textContent` de la carte (après `\u00a0` remplacé par une espace) à la présence et à l'ordre de ces blocs.

## Décisions

| Id | Décision | Pourquoi | Source |
|---|---|---|---|
| D1 | Le bilan est une carte de l'espace parents, branchée sur l'événement `parents:cards` depuis un nouveau fichier `js/features/parents/bilan.js` de la slice `parents`, importé par `parents.js` comme `storage-alert.js` | Le point d'accroche existe et reçoit `{ st, p }` du bon enfant ; pas de cycle d'import (bilan.js n'importe rien de parents.js) | `js/features/parents/parents.js:40,255`, `js/features/parents/storage-alert.js:25`, `js/features/rest/rest.js:527` |
| D2 | « Résiste cette semaine » = joué dans la fenêtre (`s.last`) et (`s.support` ou statut `difficile`) | Réutilise les deux signaux existants : la redescente d'un cran et l'état « À travailler » ; `s.recent` n'a pas de date, `s.last` si | `js/features/adaptive/skill-status.js:24-34`, `js/features/adaptive/adaptive.js:139-144`, `js/features/adaptive/skills.js:55,63` |
| D3 | « Va bien » = statut `aise`, sans condition de date, au plus 3 | Un acquis reste un acquis ; le parent voit d'abord du positif | `js/features/adaptive/skill-status.js:32` |
| D4 | Au plus 3 conseils, une seule idée par jeu | Demande du brief : court et actionnable ; l'EEF conseille des activités précises plutôt qu'une implication générale. Page non lisible par l'outil du rédacteur (403) : source fournie par le brief, à relire par l'humain | https://educationendowmentfoundation.org.uk/education-evidence/teaching-learning-toolkit/parental-engagement |
| D5 | Le palier montré est le `t` de la dernière mission (`s.recent`), pas `s.lvl` ; repères : 1 « GS, début CP », 2 « CP », 3 « fin CP, CE1 », 4 « CE1 », 5 « fin CE1, CE2 », 6 « CE2 » | `s.lvl` peut valoir le palier joué plus un quand l'âge plafonne (la montée a lieu mais ne compte plus) ; `t` est le palier vraiment joué ; un `t` qui n'est pas un entier de 1 à 6 n'est pas montré (point 17) | `js/features/adaptive/adaptive.js:107-113,128`, `js/features/adaptive/skills.js:49,63`, `js/entities/difficulty/difficulty.js:75-80` |
| D6 | Le type d'erreur n'existe pas encore : un point d'extension `emit('bilan:error-kind', { key, s })`, où `s` est la copie de `bilanSkill` (jamais l'objet de la sauvegarde), phrase retenue selon la règle « Réponse d'erreur » (Politiques) ; la track `erreurs-expliquees_20261122` pourra l'écouter (lien optionnel) | Track livrable sans elle ; `emit` renvoie les résultats des écouteurs | `js/shared/lib/events.js:48-61` |
| D7 | Table des conseils `BILAN_TIPS` (ci-dessous), une entrée par jeu suivi, écrite en toutes lettres | Chaque blocage reçoit une chose concrète à faire sans écran | brief ; `js/entities/difficulty/game-types.js:112-143`, `js/features/parents/parents.js:45-67` |
| D8 | Jeux à venir : `conductor/checklist-mini-jeu.md` gagne une ligne « son conseil sans écran dans `BILAN_TIPS` (`js/features/parents/bilan.js`) » ; le test du point 14 échoue tant qu'il manque | Politique demandée par le brief ; le même mécanisme que `SKILL_GROUPS` dans la checklist | `conductor/checklist-mini-jeu.md` (section 3), `test/smoke.test.js` (le test qui lit `SKILL_GROUPS.flatMap(g=>g.games)`) |
| D9 | Aucune note, aucun pourcentage, aucune comparaison avec d'autres enfants ; aucune donnée ne quitte l'appareil | Demande du brief ; données uniquement sur l'appareil | `AGENTS.md` (« Données uniquement sur l'appareil ») |
| D10 | Ton : sobre, concret, jamais culpabilisant ; « résiste » plutôt que « bloque » ou « échoue » ; pas de prénom dans les conseils (« l'enfant », « votre enfant ») | Les états existants disent déjà « À travailler », pas « échec » | `js/features/adaptive/skill-status.js:4-10` |
| D11 | Honnêteté sur la recherche : le brief signale un effet rapporté de l'usage partagé en famille (PubMed), contesté par un article de Science (2016). La track ne promet aucun effet : elle propose des activités simples, et la carte ne dit pas « prouvé » | Brief : le dire honnêtement. Pages PubMed et ADS non lisibles par l'outil du rédacteur (mur de cookies, réponse vide) : contenu à relire par l'humain | https://pubmed.ncbi.nlm.nih.gov/26450209/, https://ui.adsabs.harvard.edu/abs/2016Sci...351.1161F |
| D12 | Aucun nouveau champ d'état : le bilan se calcule à l'affichage depuis `state.skills` | Pas de migration, pas de `SAVE_VERSION` | `js/entities/game-state/state.js:128` |
| D15 | Politique « Entrée du bilan » : une entrée de jeu dont un champ lu est hors domaine (ce qu'une sauvegarde écrite par le jeu ne peut pas contenir) est ignorée partout dans le bilan, sans correction de la sauvegarde. Défaut de Claude, à juger à la revue par Amrou | Une seule règle au lieu de cas épars ; une entrée hors domaine vient d'un import abîmé, pas d'une partie jouée | Politiques, « Entrée du bilan » ; `js/features/adaptive/skills.js:47-64` |
| D16 | Types : tout le code de la track est vérifié en strict par `bun run typecheck` (`strict: true` dans `tsconfig.json` pour tout `js/`), sans `any` ni `@ts-ignore` ; annotations obligatoires de `bilan.js` : `@typedef {import('../../entities/game-state/index.js').GameState['skills'][string]} BilanSkill` (le `SkillRecord` de `state.js`, comme `skill-status.js:17` : `wins`, `fails`, `errors`, `last`, `recent` obligatoires, `hints` optionnel ; la copie met `errors: 0`, jamais lu, et omet `hints`), donc passé à `skillStatus` sans conversion de type ; pas de cast, ni `any`, ni `@ts-ignore`, `bilanSkill` (`@param {BilanSkill} s` (entrée déjà remise en forme par `readSave`), `@returns {BilanSkill \| null}`), `bilanHTML` (`@param {{ skills?: unknown, stars?: unknown }} st`, `@returns {string}`), `bilanEsc` (`@param {string} s`, `@returns {string}`). Aucun champ nouveau dans une table typée de `js/entities` ou `js/shared` ; jamais `any` ni `@ts-ignore` | Tout `js/` est strict depuis main v66.11 ; aucune table typée de `js/entities` ou `js/shared` ne change | `tsconfig.json` (`strict: true`), `js/entities/game-state/state.js:22-36` (`SkillRecord`, forme saine d'une entrée) |
| D14 | Sans partie dans la fenêtre, la carte montre « Pas de partie ces 7 derniers jours. », puis « Ce qui va bien » s'il existe des jeux à l'aise (sans condition de date), puis la phrase de pied ; jamais le bloc « résiste » ni « Rien ne résiste ». Un jeu joué dans la fenêtre compte comme une partie même avec `recent` vide (une entrée hors domaine, elle, est ignorée : politique « Entrée du bilan »). Défaut de Claude, à juger à la revue par Amrou | Un acquis reste un acquis (D3) ; « Rien ne résiste » n'a de sens que si l'enfant a joué | points 2, 8, 18 ; table « Rendus selon les cas » |
| D13 | Pas de dépendance à `revision-espacee_20261122` ; avec `aller-plus-loin_20261122`, seulement le « ⭐ » du point 9, lu défensivement | Track livrable seule | brief |

### Table des conseils (D7)

Le texte est celui qui s'affiche après « Une idée sans écran : ». Clé : celle de `GAME_LIST` ou de `SKILL_GROUPS`.

| Clé | Jeu | Conseil |
|---|---|---|
| `memory` | 🧠 Mémoire | Posez 5 objets de la maison sur la table, laissez votre enfant les regarder, cachez-en un sous un torchon : lequel a disparu ? |
| `count` | 🔢 Compter | En mettant la table, comptez ensemble les couverts en touchant chacun une seule fois, puis demandez : « Combien en tout ? » |
| `diff` | 🔍 L'intrus | Posez 4 cuillères et 1 fourchette, puis demandez lequel n'est pas de la même famille, et pourquoi. |
| `puzzle` | 🧩 Les nombres | Écrivez 5 nombres sur des bouts de papier, mélangez-les et rangez-les ensemble du plus petit au plus grand. |
| `sequence` | 🔮 La suite | Faites une suite avec des couverts (fourchette, cuillère, fourchette, cuillère) et demandez ce qui vient après. |
| `simon` | 🎵 Les couleurs | Montrez 3 objets de couleurs différentes dans un ordre, cachez-les, et demandez de refaire l'ordre ; ajoutez-en un quand c'est réussi. |
| `math` | ➕ Opérations | À table, avec de vrais objets : « Tu as 3 pâtes, j'en ajoute 2, combien en as-tu ? » Puis la même question sans regarder. |
| `reading` | 📖 Lecture | Lisez ensemble un mot court sur un paquet ou une étiquette, en montrant chaque syllabe du doigt. |
| `determinants` | 🔤 Petits mots | Montrez un objet de la cuisine et jouez à « un ou une ? » : une cuillère, un verre, une assiette. |
| `volume` | 🧪 Volumes | Prenez deux verres de formes différentes : lequel contient le plus ? Vérifiez en transvasant l'eau. |
| `compare` | ⚖️ Comparer | Lancez deux dés ou tirez deux cartes : chacun dit quel nombre est le plus grand. |
| `money` | 💰 La monnaie | Jouez à la marchande avec de vraies pièces : « Ça coûte 5 euros, quelles pièces donnes-tu ? » |
| `clock` | 🕐 L'heure | Regardez ensemble une horloge à aiguilles plusieurs fois dans la journée : « La petite aiguille est sur le 7, il est 7 heures. » |
| `calendar` | 📅 Calendrier | Au dîner : « Quel jour sommes-nous ? Et demain ? » ; à la fenêtre : « Quelle saison, d'après les arbres ? » |
| `calc` | 🌋 Calcul mental | En voiture ou à table, posez un calcul court à voix haute (« 5 plus 5 ? ») et laissez le temps de répondre, sans presser. |
| `shapes` | 🍡 Formes et couleurs | Cherchez dans la cuisine un objet rond, un carré, un triangle, puis comptez ensemble les coins d'une boîte. |
| `planets` | 🪐 Les planètes | Avec une lampe et une orange : la lampe est le Soleil ; tournez l'orange pour montrer le jour et la nuit. |
| `jigsaw` | 🖼️ Le puzzle | Découpez une image de magazine en 4 morceaux et reconstituez-la ensemble. |
| `nesting` | 🪆 Les boîtes gigognes | Rangez 3 ou 4 bols du plus petit au plus grand, puis emboîtez-les. |
| `cubes` | 🧊 Combien de cubes ? | Empilez quelques morceaux de sucre ou des briques, puis demandez combien il y en a, même ceux qu'on ne voit pas. |
| `packs` | 🧸 Les paquets de jouets | Faites des tas de 2 pâtes et comptez tas par tas : « 2, 4, 6. » |
| `shelf` | 🗄️ L'étagère magique | Posez des petits objets dans une boîte à œufs et décrivez leur place : « en haut, à gauche ». |
| `share` | 🎂 Le gâteau partagé | En coupant une crêpe ou une pomme, demandez : « Est-ce que chacun a la même part ? » |
| `recipe` | 🥣 La recette | Faites une vraie recette ensemble : votre enfant verse et mesure avec le verre doseur, les cuillères ou la balance. |
| `rhythm` | 🥁 Le rythme magique | Tapez dans les mains un rythme court (long, court, court) et demandez de le refaire. |
| `pitch` | 🔔 Grave ou aigu ? | Tapez doucement sur des verres plus ou moins remplis d'eau : lequel fait le son le plus aigu ? |
| `lifecycle` | 🌱 De la graine à la fleur | Faites germer une lentille ou un haricot dans du coton mouillé et regardez-le pousser chaque jour. |
| `ladybugs` | 🐞 Les coccinelles | Avec des pâtes : « Fais le double de 3 », puis « Partage 8 en deux tas pareils. » |
| `potions` | 🧪 Les potions de couleurs | Mélangez deux couleurs de peinture ou de pâte à modeler : « Jaune et bleu, ça donne quoi ? » |
| `mirror` | 🪞 Le miroir magique | Posez un ruban sur la table ; placez 3 objets d'un côté et demandez de les placer en miroir de l'autre côté. |
| `rangement` | 📦 Boîtes de rangement | Triez ensemble le linge ou les jouets selon une règle choisie par votre enfant : la couleur, la taille ou l'usage. |

## Politiques

- **Arbitrages** (paires de règles qui peuvent toucher le même jeu) :
  - « va bien » (statut `aise`) et « résiste » (point 4) : possible seulement avec `s.support === true` et `s.last` dans la fenêtre ; le jeu est alors classé « résiste » et retiré de « va bien », même s'il est coupé par la limite de 3 (point 19). Hors de la fenêtre, il ne résiste pas et reste dans « va bien » (point 18).
  - Statut `difficile` hors de la fenêtre : ni « résiste » ni « va bien ».
  - Limites : « va bien » et « résiste » ont chacune leur limite de 3, indépendantes ; « va bien » est calculé après « résiste ».
  - « va bien » et l'étoile d'`aller-plus-loin` : le « ⭐ » s'ajoute seulement aux jeux cités dans « va bien ».
  - `recent` vide (sain) et type d'erreur (point 7) : la ligne garde le type d'erreur sans le palier.
  - Entrée hors domaine (point 17) et toute autre règle : l'entrée est ignorée avant toute autre règle (fenêtre, tris, « va bien », « résiste »).
  - Un écouteur `bilan:error-kind` qui plante : `emit` isole l'erreur (`events.js:48-61`), la ligne n'ajoute rien.
- **Réponse d'erreur** (règle unique pour `bilan:error-kind`) : `emit('bilan:error-kind', { key, s })` renvoie la liste des réponses des écouteurs (`js/shared/lib/events.js:48`) ; seules les réponses de type `string` sont retenues (`undefined`, `null`, nombres, objets et un écouteur qui plante sont ignorés), chacune passe par `trim()`, la première non vide est gardée, coupée à 80 caractères **avant** l'échappement, puis passée par `bilanEsc`. Aucune réponse retenue : rien n'est ajouté.
- **Entrée du bilan** (politique unique pour les valeurs de la sauvegarde, entrée non fiable : partie importée). Toute partie que voit le bilan est déjà passée par `readSave()` (`js/entities/game-state/state.js`), la porte de lecture unique : `load()` pour le joueur courant, `profileState` (`js/features/parents/parents.js:189-199`) pour un autre joueur ; si la lecture échoue, `profileState` renvoie `{}`. `readSave` appelle `cleanSkills`, qui **garantit déjà** : `st.skills` est un objet ; chaque entrée est un objet ; `wins`, `fails`, `errors` sont des nombres finis, 0 ou plus (`savedCount`) ; `last` est une chaîne ou `null` ; `recent` est un tableau d'objets `{ t, e, ok }` où `t` et `e` sont des nombres finis, 0 ou plus, et `ok` un booléen ; `hints` est absent ou un nombre (optionnel, lu `s.hints || 0`, jamais lu par le bilan) ; `support` est `true` ou absent. Le bilan ne refait pas ces vérifications. `bilanHTML(st)` accepte aussi `{}` (lecture échouée) : `(st.skills || {})`. Seules les clés de `BILAN_TIPS` sont lues. Pour chacune, `bilanSkill(s)` (à créer dans `bilan.js`) vérifie **seulement ce que `readSave` ne garantit pas** (table ci-dessous) : si un champ est hors domaine, il renvoie `null` et le jeu est **ignoré partout** dans le bilan (ni « va bien », ni « résiste », ni partie de la fenêtre, ni tri) ; sinon il renvoie une copie (`{ wins, fails, errors: 0, last, recent: recent.map(r => ({ t, e, ok })), support }`, `support` seulement s'il est présent ; `errors` n'est jamais lu, il vaut 0 pour que la copie soit un `SkillRecord` complet ; `hints` est omis, il est optionnel). Tout le bilan (fenêtre, `skillStatus`, tris, `bilan:error-kind`) ne lit que cette copie. Le bilan ne plante jamais et n'écrit jamais dans `st`. Une entrée saine sans partie récente garde le comportement des points 2, 3, 11 et 18. « Domaine sain » = ce qu'une sauvegarde écrite par le jeu peut contenir :

  | Champ | Déjà garanti par `readSave` | Vérifié en plus par `bilanSkill` (domaine sain) | Source du domaine sain | Hors domaine |
  |---|---|---|---|---|
  | `s.last` | chaîne ou `null` | `null` ou chaîne `/^\d{4}-\d{2}-\d{2}$/` | `skills.js:48,55` (`todayKey`, `skills.js:14-17`), `js/features/hints/hints.js:417`, `js/features/squishies/squishies.js:519,525` | jeu ignoré |
  | `s.recent` | tableau d'objets `{ t, e, ok }` | 10 entrées au plus | `skills.js:63-64`, `js/features/squishies/squishies.js:526` (`slice(-10)`) | jeu ignoré |
  | `.t` de chaque entrée | nombre fini, 0 ou plus | entier de 1 à 6 (`Number.isInteger(t) && t >= 1 && t <= 6`) | `skills.js:49,63` (`gameDiff`, paliers 1 à 6), `js/features/squishies/squishies.js:326-331,526` (rangement 1 à 3) | jeu ignoré |
  | `.e` de chaque entrée | nombre fini, 0 ou plus | entier | `skills.js:50,63` (compteur d'erreurs), `js/features/squishies/squishies.js:526` | jeu ignoré |
  | `s.wins`, `s.fails` | nombres finis, 0 ou plus | entiers | `skills.js:52-53`, `js/features/squishies/squishies.js:522-523` | jeu ignoré |
  | `.ok`, `s.support`, `s` lui-même, `st.skills` | entièrement garantis | rien | `cleanSkills` dans `state.js` | sans objet |
  Champs non lus par le bilan, donc non validés : `errors`, `hints`, `lvl`, `atLvl`. Hors de cette politique, la lecture optionnelle de `(st.stars || {})[clé].won` (point 9) : « ⭐ » seulement si `Number.isInteger(won) && won >= 1`, sinon rien, sans ignorer le jeu.
- **Échappement** : aucune fonction d'échappement HTML n'existe dans le dépôt (`js/shared/lib/index.js` n'exporte que hasard, événements, version, `cleanName`, stockage ; `cleanName`, `js/shared/lib/text.js:18-26`, retire des caractères et coupe à 12, il n'échappe pas ; `escAttr`, `js/features/players/profiles-ui.js:189`, ne traite que `"`). À créer : `bilanEsc(s)`, fonction locale de `js/features/parents/bilan.js` (nom unique dans le jeu, non exportée par la slice), qui convertit `&` en `&amp;` (en premier), `<` en `&lt;`, `>` en `&gt;`, `"` en `&quot;`, et laisse l'apostrophe telle quelle (les conseils et les noms en contiennent, et aucun attribut n'est délimité par `'`). Elle ne s'applique qu'à la phrase reçue de `bilan:error-kind` (autre slice). Les textes entièrement constants (conseils de `BILAN_TIPS`, noms de `GAME_LIST`, repères, phrases fixes) s'insèrent tels quels : le point 16 garantit qu'ils ne contiennent aucun caractère HTML. Les données de la sauvegarde ne sont jamais insérées comme texte : seuls des nombres (`Number(t) || 0`) et des clés de `BILAN_TIPS` en sont tirés.
- **Fonctions supposées** : existantes : `skillStatus` (`js/features/adaptive/skill-status.js:24`, exportée par `js/features/adaptive/index.js:13`), `todayKey` (`js/features/adaptive/skills.js:14`, exportée par `index.js:12`), `GAME_LIST` (`js/entities/difficulty/game-types.js:112`, exportée par `js/entities/difficulty/index.js`), `emit` et `on` (`js/shared/lib/events.js:29,48`, exportées par `js/shared/lib/index.js:4`), `SKILL_GROUPS` (`js/features/parents/parents.js:45`, non exportée, lue par les tests par son nom comme `test/smoke.test.js` (le test qui lit `SKILL_GROUPS.flatMap(g=>g.games)`)), `currentProfile` (`js/entities/player/profiles.js:91`), l'événement `parents:cards` (`js/features/parents/parents.js:286`). À créer dans `js/features/parents/bilan.js` : `bilanEsc`, `bilanSkill`, `bilanHTML`, `BILAN_DAYS`, `BILAN_MAX`, `BILAN_TIPS`, `BILAN_TIER_LABELS`, l'écouteur `parents:cards`.
- **Défauts** : constantes dans `bilan.js` : `BILAN_DAYS = 7`, `BILAN_MAX = 3`, `BILAN_TIPS`, `BILAN_TIER_LABELS`. Pas de réglage. Pas de dépendance nouvelle. Noms des jeux : `GAME_LIST` (emoji et nom), et `📦 Boîtes de rangement` pour `rangement` (champ `name` de son entrée dans `BILAN_TIPS`, pour ne pas importer `parents.js`). Échappement : voir la politique « Échappement ».
- **Textes du parent** (tous écrits plus haut) : titre « 🧭 Cette semaine » ; « Ce qui va bien : » ; « Ce qui résiste cette semaine : » ; « palier N (repère : R) » ; « Une idée sans écran : » ; « · Erreur fréquente : » ; « Pas de partie ces 7 derniers jours. » ; « Rien ne résiste cette semaine. » ; la phrase de pied du point 12. Vouvoiement, présent, phrases courtes, aucun jugement sur l'enfant. Rien n'est montré ni dit à l'enfant.
- **Référence visuelle** : la carte reprend `bk-card` et `bk-help` des autres cartes (`parents.js:279`) et une liste simple comme la carte « 🌙 Pauses » (`rest.js:527-559`) ; chaque conseil dans un paragraphe `.bilan-tip` légèrement teinté.
- **Détails non écrits** : l'agent prend le défaut de la référence ou l'option la plus simple, le note dans le journal de décisions du plan, l'humain juge à la revue.

## Hors périmètre

- Statistiques par semaine stockées, graphiques, export ou envoi du bilan.
- Le type d'erreur lui-même (track `erreurs-expliquees_20261122`), la révision espacée (track `revision-espacee_20261122`).
- Les conseils des futurs jeux de la saison 3 : chaque track de mini-jeu écrit le sien (D8).
- Changer les seuils de `skillStatus` (`TODO.md`, ligne « À observer : les seuils « à l'aise / à travailler » sont-ils justes avec les enfants ? »).

## Contrats partagés

| Contrat | Forme (ou lien) | Propriétaire | Consommateurs |
|---|---|---|---|
| `BILAN_TIPS` | `{ [clé]: { tip: string, name?: string } }` | `js/features/parents/bilan.js` | tests, futures tracks de mini-jeu |
| `bilanHTML(st)` | chaîne HTML de la carte | `js/features/parents/bilan.js` | écouteur `parents:cards`, tests |
| `bilan:error-kind` | `emit('bilan:error-kind', { key, s })`, `s` = copie validée par `bilanSkill` ; un écouteur renvoie une phrase courte ou rien | `js/features/parents/bilan.js` | `erreurs-expliquees_20261122` (option) |
| `state.stars[clé].won` | nombre, lu seulement s'il existe | `aller-plus-loin_20261122` | `bilan.js` (option) |

## Surface d'attaque

| Entrée | Données ou appelant | Limites et vérifications | Peut atteindre | Jamais |
|---|---|---|---|---|
| `st.skills` d'une partie importée | fichier de sauvegarde (entrée non fiable), lu par l'espace parents | politique « Entrée du bilan » : `bilanSkill` valide chaque entrée, une entrée hors domaine est ignorée ; seules les clés de `BILAN_TIPS` sont lues ; rien n'est écrit dans `st` | le texte de la carte | du HTML : les noms viennent de `GAME_LIST` et `BILAN_TIPS`, jamais de la sauvegarde |
| réponse de `bilan:error-kind` | une autre slice | règle « Réponse d'erreur » (Politiques) | une ligne de la carte | du HTML injecté |

## Zones sensibles touchées

Espace parents (`js/features/parents/`) : revue humaine obligatoire.

## Smoke test

🤖 : un agent la prouve et joint la preuve. 👤 : seul l'humain peut juger.

| Id | Qui | Étapes | Attendu | Niveau visé |
|---|---|---|---|---|
| S1 | 🤖 | `test/bilan.test.js` : points 1 à 19, avec des `state.skills` construits à la main et des dates calculées par `todayKey` | tous verts | test-verified |
| S2 | 🤖 | `bun run check` | sortie 0 | runtime-verified |
| S3 | 👤 | Amrou ouvre l'espace parents sur le téléphone après une semaine de jeu | la carte se lit en dix secondes, les conseils sont faisables le soir même, le ton ne culpabilise pas | e2e-verified |
| S4 | 👤 | Amrou essaie un conseil avec sa fille | le conseil se comprend sans explication | e2e-verified |

## Questions ouvertes

