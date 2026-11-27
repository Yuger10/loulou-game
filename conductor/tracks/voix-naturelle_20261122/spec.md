---
status: validée         # brouillon | validée | faite ; posé à la demande d'Amrou le 26/11/2026 (« tu passes tout en validé »)
issue: 0
size: M
migration: false
sensitive: true          # PWA (sw.js), espace parents, outil de développement qui appelle un service payant
files: [test/tools/voix.js, test/tools/voix-phrases.js, test/tools/sync.js, js/shared/ui/voice.js, js/shared/ui/voice-clips.js, js/shared/lib/spoken.js, js/features/parents/voice-card.js, js/slices.cjs, sw.js, voix/voix.json, voix/*.mp3, js/features/parents/parents.js, test/voix-clips.test.js, test/voix-lecteur.test.js, test/tools/fake-voice.js, docs/adr/0007-voix-enregistree.md, package.json, AGENTS.md]
taster: { facts: 0, decisions: 0, rounds: 10 }
---

<!-- Gabarit cothon 0.4.0 (setting-up-docs), adopté dans Conductor. -->

# Spec : une voix plus naturelle (clips générés à l'avance, Web Speech en repli)

- Nouveau projet : non
- Dépend de : [voix-partout](../voix-partout_20261122/spec.md), phase 1 (file de parole, `stopSpeech()`, `toSpoken()` dans `js/shared/lib/spoken.js`). Cette track ne commence pas avant que cette phase soit sur `main`.

## Problème

La voix du jeu est celle de l'appareil (Web Speech) : Amrou la trouve robotique, et une enfant de 6 ans qui apprend à lire passe l'essentiel du jeu à l'écouter. Sur iPad, choisir une meilleure voix de l'appareil est une impasse : Safari ne donne à Web Speech que les voix préinstallées. Il faut une voix chaleureuse, la même sur tous les appareils, qui marche sans Internet, sans clé de service dans le jeu, et sans jamais envoyer le prénom de l'enfant.

## Comportement attendu

Vocabulaire : une **phrase fixe** est un texte dit sans partie variable, trouvé dans le code par les règles R1 à R5 (Décision D8). Sa **clé** est `toSpoken(texte)`. Son **empreinte** est définie une seule fois, en D9 (chaîne canonique et exemple calculé). Son **clip** est `voix/<empreinte>.mp3`. La **table des clips** est `js/shared/ui/voice-clips.js`, générée, qui exporte trois noms : `VOICE_CLIPS` (`{ 'clé': 'empreinte', … }`), `VOICE_SERVICE` (`'Microsoft Azure'`, `'Google Cloud'` ou `''`) et `VOICE_UNLOCK` (URI `data:audio/mpeg;base64,…` d'un silence de 200 ms, ou `''`). **Comptage** : `extractPhrases` renvoie **toutes les occurrences** (`{ text, key, file, line }`, une par endroit du code), pour que la garde cite chaque `fichier:ligne` ; deux occurrences qui donnent la même clé sont **une seule phrase** : un seul clip, une seule entrée de `VOICE_CLIPS`, une seule requête. Partout dans cette spec (lignes 3 à 6, 9 à 11, ligne de succès), N est le nombre de **clés distinctes**. Il n'y a **aucun autre fichier** dans `voix/` que `voix.json` et les clips nommés par leur empreinte : le silence de déverrouillage n'est pas un fichier.

Essai d'écoute (phase 1)

Un service est **complet** quand ses deux variables sont présentes et non vides : Azure = `VOIX_AZURE_KEY` et `VOIX_AZURE_REGION` ; Google = `VOIX_GOOGLE_TOKEN` et `VOIX_GOOGLE_PROJECT`. Le dossier d'essai est le paramètre `essaiDir` de `main` ; le point d'entrée le fixe à `path.join(os.tmpdir(), 'voix-essai')` (`os.tmpdir()` lit `$TMPDIR` et retombe sur le dossier temporaire du système s'il est absent) ; le selftest passe `<racine temporaire>/essai`, jamais le vrai dossier. Dans les messages, `<service>` est l'identifiant en minuscules (`azure` ou `google`, celui de `voix.json`), et `<VARIABLES>` la liste des variables manquantes du service, dans l'ordre `VOIX_AZURE_KEY`, `VOIX_AZURE_REGION` (Azure) ou `VOIX_GOOGLE_TOKEN`, `VOIX_GOOGLE_PROJECT` (Google), séparées par `, `.

1. Étant donné au moins un service complet, quand on lance `bun run voix --essai`, alors le script vide puis écrit le dossier d'essai : pour chaque service complet, les 5 phrases (table E) dites par chaque voix candidate (table V) dans `<service>-<voix>-<n>.mp3` (le `:` du nom de voix devient `_`), plus `ecoute.html` qui les liste avec un `<audio controls>` par fichier ; il affiche le chemin de `ecoute.html` et sort avec 0. Rien n'est écrit dans le dépôt.
2. Étant donné un service à moitié posé (une seule de ses deux variables), quand on lance `bun run voix --essai`, alors le script écrit « ⚠️ voix : <service> ignoré, il manque <VARIABLES> » et continue avec l'autre service s'il est complet ; s'il n'y a aucun service complet, il écrit « ⛔ voix : aucun service complet dans l'environnement (VOIX_AZURE_KEY et VOIX_AZURE_REGION, ou VOIX_GOOGLE_TOKEN et VOIX_GOOGLE_PROJECT), rien n'est généré » et sort avec 2. Pour `bun run voix` (génération), seul le service de `voix/voix.json` compte : s'il n'est pas complet (une ou deux variables manquantes), il écrit « ⛔ voix : <service> incomplet, il manque <VARIABLES> » et sort avec 2.

Génération (phase 3)

3. Étant donné `voix/voix.json` et le service choisi complet, quand on lance `bun run voix`, alors le script : extrait les phrases fixes ; demande au service seulement celles dont `voix/<empreinte>.mp3` n'existe pas ; écrit chaque clip ; demande le silence de déverrouillage **seulement si `VOICE_UNLOCK` est vide** (une requête ; un silence reste un silence quand la voix change, il n'est donc jamais regénéré ensuite) ; supprime les `voix/*.mp3` qui ne sont l'empreinte d'aucune phrase ; écrit `js/shared/ui/voice-clips.js` (clés triées par `localeCompare` en `fr`), puis lance `node_modules/.bin/oxfmt js/shared/ui/voice-clips.js` (D23) ; affiche exactement `✅ voix : <N> phrases, <X> nouvelles, <Y> supprimées, <Z> Mo` (Z = poids total de `voix/*.mp3` en millions d'octets, une décimale, point décimal, par exemple `✅ voix : 412 phrases, 3 nouvelles, 1 supprimées, 5.8 Mo`) et sort avec 0.
   Variables de la ligne de succès : `<N>` = nombre de clés distinctes (une par clip attendu) ; `<X>` = nombre de fichiers `.mp3` écrits dans `voix/` pendant ce lancement (le silence de déverrouillage, qui n'est jamais un fichier, n'est jamais compté) ; `<Y>` = nombre de fichiers `.mp3` supprimés de `voix/` pendant ce lancement ; `<Z>` = poids total des `voix/*.mp3` à la fin, en millions d'octets, une décimale, point décimal. Lignes exactes attendues au selftest, avec ses 2 phrases d'exemple et des corps MP3 factices de 103 octets : premier lancement, `✅ voix : 2 phrases, 2 nouvelles, 0 supprimées, 0.0 Mo` ; après le changement d'une phrase, `✅ voix : 2 phrases, 1 nouvelles, 1 supprimées, 0.0 Mo` ; tout à jour, `✅ voix : 2 phrases, 0 nouvelles, 0 supprimées, 0.0 Mo`.
   Nombre exact d'appels à `fetch` vérifié par le selftest, avec N phrases fixes : premier lancement sur un dépôt sans clip, **N + 1** (N clips et le silence).
4. Étant donné que tous les clips sont à jour et `VOICE_UNLOCK` rempli, quand on relance `bun run voix`, alors **0** appel à `fetch`, et `voice-clips.js` est identique à l'octet près.
5. Étant donné une phrase fixe dont le texte change d'un caractère, quand on relance `bun run voix`, alors **1** appel à `fetch` (son clip ; pas de silence), l'ancien clip est supprimé.
6. Étant donné que `voix/voix.json` change (autre voix, autre vitesse), quand on relance `bun run voix`, alors toutes les empreintes changent : **N** appels à `fetch` (tous les clips ; pas de silence), les N anciens clips sont supprimés.
6b. **Texte envoyé au service** (génération et essai, une seule règle) : la clé, c'est-à-dire exactement `toSpoken(texte)`, ce que Web Speech dit aujourd'hui. Azure : la clé échappée pour XML (`&` → `&amp;`, `<` → `&lt;`, `>` → `&gt;`, `"` → `&quot;`, `'` → `&apos;`) dans le SSML de la table A ; Google : la clé telle quelle dans `input.text`. L'essai envoie de même `toSpoken` des phrases de la table E (par exemple `Presque! Regarde bien et réessaie.`). L'espace avant `!`, que `toSpoken` retire (`js/shared/ui/voice.js:65`), ne devrait changer que la typographie, mais aucune page lue ne le garantit : dans le doute, on envoie exactement ce que Web Speech dit aujourd'hui, et l'écoute S2 se fait sur le texte même qui sera généré.

**Table C : les trois commandes du script** (`test/tools/voix.js`, racine du dépôt par défaut, autre racine par `--root <dossier>`)

| Commande | État d'entrée | Sortie affichée | Code |
|---|---|---|---|
| `voix` | `voix/voix.json` absent (cas normal jusqu'à la phase 3) | « ⛔ voix : voix/voix.json absent. Lance d'abord bun run voix --essai, puis écris le choix d'Amrou dans voix/voix.json. » | 2 |
| `voix` | `voix/voix.json` illisible (JSON invalide) ou hors de la forme de la ligne 13 | « ❌ voix : voix/voix.json invalide : <première règle violée> » | 1 |
| `voix` | service choisi incomplet | « ⛔ voix : <service> incomplet, il manque <VARIABLES> » | 2 |
| `voix` | tout à jour | ligne de succès, `0 nouvelles, 0 supprimées` | 0 |
| `voix` | des clips à faire, réponses 200 | ligne de succès | 0 |
| `voix` | une phrase en 400 ou 404, ou 200 qui n'est pas un MP3 | ligne 7 (liste des phrases refusées, table non réécrite) | 1 |
| `voix` | 401 ou 403, ou 3e tentative ratée (429, 5xx, réseau) | « ⛔ voix : <service> injoignable ou clé refusée (<cause>) », table non réécrite | 2 |
| `voix` | oxfmt introuvable ou en échec | « ⛔ voix : oxfmt n'a pas pu formater js/shared/ui/voice-clips.js » | 2 |
| `voix` | `voice-clips.js` présent avec un export qui n'est pas un littéral | « ❌ voix : js/shared/ui/voice-clips.js illisible : <export> » | 1 |
| `voix --essai` | aucun service complet | message de la ligne 2 | 2 |
| `voix --essai` | toutes les réponses 200 | chemin de `ecoute.html` | 0 |
| `voix --essai` | un service à moitié posé (ignoré, ligne 2) et l'autre complet, toutes ses réponses 200 | l'avertissement de la ligne 2, puis le chemin de `ecoute.html` | 0 (un avertissement ne compte pas dans le code ; seuls les cas de cette table à 1 ou 2 comptent) |
| `voix --essai` | une voix refusée (400 ou 404) | « ⚠️ voix : voix inconnue : <voix> » ; les autres voix et services continuent ; `ecoute.html` liste ce qui a été obtenu | 1 |
| `voix --essai` | un service en 401 ou 403, ou 3e tentative ratée | « ⛔ voix : <service> injoignable ou clé refusée (<cause>) » ; ce service s'arrête, l'autre continue ; `ecoute.html` est écrit | 2 |
| `voix --selftest` | tous les cas attendus | « ✅ voix : selftest, <n> cas » | 0 |
| `voix --selftest` | un cas faux | « ❌ <cas> : <obtenu> au lieu de <attendu> » par cas | 1 |
| `voix --selftest` | oxfmt introuvable | « ⛔ voix : oxfmt introuvable » | 2 |

L'essai suit les mêmes tentatives que la génération (ligne 7 : 3 tentatives, `Retry-After`) et le même rythme Azure (ligne 8). Quand plusieurs cas se cumulent, le code le plus grave gagne (2 sur 1 sur 0), comme `test/tools/check.js:21-30`.

**Selftest sans toucher au dépôt** : `test/tools/voix.js` exporte `main({ root, env, fetch, sleep, argv, essaiDir })` et ne lit ni `process.env` ni le vrai `fetch` ailleurs que dans son point d'entrée. `main` reçoit aussi `essaiDir`. Le selftest crée une racine temporaire (`fs.mkdtempSync(path.join(os.tmpdir(), 'voix-selftest-'))`), passe `essaiDir = <racine temporaire>/essai`, y écrit des fichiers `js/` d'exemple, `voix/voix.json`, `js/shared/ui/voice-clips.js` vide et une **copie** de `.oxfmtrc.json`, puis appelle `main` avec un `env` d'exemple, un faux `fetch` qui compte ses appels et rend les statuts voulus (corps MP3 = les octets `ID3` suivis de 100 octets nuls), et un `sleep` qui n'attend pas mais note les durées (ligne 8). oxfmt est toujours pris dans le vrai dépôt, par chemin absolu (`path.join(__dirname, '..', '..', 'node_modules', '.bin', 'oxfmt')`), et lancé avec `cwd` = la racine temporaire pour qu'il y lise la copie de `.oxfmtrc.json`. `toSpoken` est toujours chargé depuis le vrai dépôt (D25). La racine temporaire est supprimée à la fin.
7. Chaque phrase a **3 tentatives au total** (1 envoi et 2 reprises). Sur 429, 500, 502, 503 ou erreur réseau, le script attend `Retry-After` secondes (60 au plus) ou 10 s sans cet en-tête, puis réessaie. Après la 3e tentative ratée, ou dès une réponse 401 ou 403, il s'arrête et écrit « ⛔ voix : <service> injoignable ou clé refusée (<cause>) », où `<cause>` est le statut HTTP de la dernière réponse (par exemple `429`, `401`) ou, sans réponse, `réseau : <nom de l'erreur>` (par exemple `réseau : TypeError`) ; il sort avec 2. L'état des fichiers après chaque échec suit la politique « Écritures du script ». Sur une réponse 400 ou 404 (texte ou voix refusés), il note la phrase et **continue les autres** ; à la fin, les clips réussis restent, la table **n'est pas réécrite** (la garde échoue donc encore), il écrit « ❌ voix : <n> phrases refusées par le service » puis une ligne par phrase (`fichier:ligne  texte`) et sort avec 1. Le traitement de chaque réponse suit la table « Réponse du service » ci-dessous.

**Table « Réponse du service »** (génération et essai ; « corps » = octets reçus pour Azure, octets **décodés** de `audioContent` pour Google)

| Réponse | Forme du corps | Traitement | Effet sur la sortie |
|---|---|---|---|
| 200 | MP3 valide (commence par `ID3`, ou `0xFF` suivi de `0xFB`, `0xF3` ou `0xF2`), de 1 à 307 200 octets | clip écrit (génération) ou fichier d'essai écrit | aucun |
| 200 | vide (0 octet), plus de 307 200 octets, pas un MP3, ou (Google) JSON illisible ou sans `audioContent` | comme un 400 : phrase notée, rien n'est écrit pour elle, les autres continuent | 1 ; table non réécrite |
| 400, 404 | quelconque | phrase notée (génération) ou voix notée « voix inconnue » (essai), les autres continuent | 1 ; table non réécrite |
| 401, 403 | quelconque | arrêt immédiat du service | 2 ; table non réécrite |
| 429, 500, 502, 503 | quelconque | nouvelle tentative après `Retry-After` (60 s au plus) ou 10 s ; arrêt du service après la 3e tentative ratée | 2 si la 3e échoue |
| autre statut (par exemple 405, 415, 504) | quelconque | traité comme 400 | 1 ; table non réécrite |
| pas de réponse (erreur réseau, `fetch` rejeté) | sans objet | comme 429 ; `<cause>` = `réseau : <nom de l'erreur>` | 2 si la 3e échoue |

Quand des 1 et des 2 se cumulent, 2 gagne.
8. Étant donné le service Azure au palier gratuit, quand le script génère, alors il n'envoie jamais plus de 18 requêtes par 60 secondes (pause de 3,4 s entre deux requêtes).
9. Étant donné un texte qui contient un chiffre, un `${`, ou qui est vide après `toSpoken()`, quand le script extrait les phrases, alors ce texte n'est pas une phrase fixe (il reste en Web Speech).

Garde (phase 3, dans `bun run check`)

10. Étant donné une phrase fixe dans le code sans entrée dans `VOICE_CLIPS`, ou dont l'entrée n'est pas son empreinte actuelle, ou dont le fichier `voix/<empreinte>.mp3` manque, quand `bun run check` tourne, alors `test/voix-clips.test.js` échoue en citant le fichier source, la phrase et la commande à lancer (`bun run voix`). Tant que `voix/voix.json` n'existe pas (phases 1 et 2), le test vérifie seulement que `VOICE_CLIPS` est vide, `VOICE_UNLOCK` vide et `voix/` sans `.mp3`.
11. Étant donné un fichier `voix/*.mp3` qui n'est l'empreinte d'aucune entrée de `VOICE_CLIPS`, ou une entrée de `VOICE_CLIPS` qui n'est plus une phrase fixe du code, quand `bun run check` tourne, alors le même test échoue (fichier orphelin ou entrée en trop).
12. Étant donné le dossier `voix/`, quand `bun run check` tourne, alors le test échoue si le poids total des clips dépasse 8 Mo, si un clip dépasse 300 Ko, si un fichier n'est ni `voix.json` ni un nom conforme à `^[0-9a-f]{12}\.mp3$`, ou si `VOICE_UNLOCK` n'est pas vide alors que `VOICE_CLIPS` l'est (ou l'inverse), ou ne commence pas par `data:audio/mpeg;base64,`, ou dépasse 8 000 caractères.
13. Étant donné `voix/voix.json`, quand `bun run check` tourne, alors le test échoue si le fichier n'a pas **exactement** les clés `service`, `voice`, `style`, `rate`, `format`, ou si une valeur sort de sa forme : `service` vaut `azure` ou `google` ; `voice` correspond à `^fr-FR-[A-Za-z0-9:-]+$` ; `style` vaut `''` ou correspond à `^[a-z-]+$` ; pour Azure, `rate` est une chaîne `^[+-]?\d{1,2}%$` et `format` vaut `audio-24khz-48kbitrate-mono-mp3` ; pour Google, `rate` est un nombre entre 0,25 et 2, `style` vaut `''` et `format` vaut `MP3`. Une clé, un jeton ou une région n'ont donc aucune place où se loger. Vérifié contre chaque exemple de la spec : `fr-FR-DeniseNeural`, `fr-FR-EloiseNeural`, `fr-FR-Vivienne:DragonHDLatestNeural`, `fr-FR-Chirp3-HD-Aoede`, `-Leda`, `-Kore` passent la règle de `voice` ; `-8%` et `0.92` celle de `rate` ; `cheerful` et `''` celle de `style`.

Lecture dans le jeu (phase 2, puis activée par les clips de la phase 3)

Lecteur **inerte** : tant que `VOICE_CLIPS` est vide, ou que le navigateur n'a pas `Audio`, ou que `new Audio().canPlayType('audio/mpeg')` rend `''` (cas de jsdom), ou qu'il n'a pas `caches` pour le téléchargement de fond, le lecteur ne crée aucun élément audio, ne pose aucun écouteur `pointerdown`, ne fait aucun `fetch` et ne touche pas `caches` : `speak()` se comporte exactement comme dans voix-partout. C'est le cas de tous les tests existants (jsdom), qui ne voient donc ni 404 ni erreur « not implemented » de `HTMLMediaElement` (`test/update.test.js:74-76` compte les erreurs jsdom ; `test/games.test.js` relève les erreurs de la fenêtre).

14. Étant donné une phrase dont `toSpoken(texte)` a une entrée dans `VOICE_CLIPS` et un navigateur qui sait lire le MP3 (`canPlayType('audio/mpeg')` non vide), quand le jeu appelle `speak(texte)`, alors le lecteur charge `voix/<empreinte>.mp3` par `fetch`, le joue dans l'unique élément audio de la voix, et `speechSynthesis.speak` n'est pas appelé.
15. Étant donné une phrase sans entrée dans `VOICE_CLIPS` (prénom, nombres, phrase composée), quand le jeu appelle `speak(texte)`, alors elle est dite par Web Speech exactement comme avant cette track.
16. Étant donné un clip introuvable (hors ligne et pas encore en cache, erreur réseau, réponse non 200) ou un chargement plus long que 1 500 ms, quand le jeu appelle `speak(texte)`, alors la même phrase est dite par Web Speech à sa place dans la file, sans silence de plus de 1,5 s.
17. Étant donné que `play()` est refusé par le navigateur (promesse rejetée, par exemple avant le premier geste sur iOS), quand le lecteur le constate, alors la phrase passe à Web Speech et le lecteur de clips reste désactivé jusqu'au prochain geste de l'enfant (`pointerdown`), qui le réactive.
18. Étant donné un lecteur non inerte et le premier `pointerdown` de la session, quand il arrive, alors le lecteur joue `VOICE_UNLOCK` (URI `data:`, aucun réseau) dans son élément audio, une seule fois par session réussie. Si ce `play()` est rejeté, rien n'est montré : le lecteur réessaie au `pointerdown` suivant, et entre-temps les phrases passent par Web Speech (ligne 17).
19. Étant donné un clip qui joue, quand il commence (`playing`), alors `setVoiceDuck(true)` baisse les sons et la musique ; quand il finit (`ended`), échoue (`error`) ou est arrêté (`stopSpeech()`), alors `setVoiceDuck(false)` les remonte, l'URL d'objet est libérée (`URL.revokeObjectURL`), et la phrase suivante de la file démarre.
20. Étant donné `stopSpeech()` (fermeture d'une fenêtre, voix coupée, nouvelle scène), quand un clip joue, alors il s'arrête (`pause()`, `src` vidé) aussi vite qu'une phrase Web Speech annulée.
21. Étant donné la relecture lente de Perle (`speak(texte, { rate: 0.7 })`) et un clip disponible, quand le navigateur expose `preservesPitch` ou `webkitPreservesPitch`, alors le clip joue avec `playbackRate = 0.8` et la hauteur conservée ; sinon la phrase est dite par Web Speech à la vitesse 0,7.
22. Étant donné la voix coupée dans les réglages (`audioPrefs().voice` faux), quand le jeu appelle `speak()` pour une lecture automatique, alors aucun clip n'est chargé ni joué (même règle que Web Speech, fixée par voix-partout).

Hors ligne (phase 2)

23. Étant donné une requête du jeu vers `voix/*.mp3`, quand le service worker la reçoit, alors il répond depuis le cache `lagon-voix` s'il l'a (cache d'abord : un nom de clip ne change jamais de contenu), sinon il va sur le réseau et range la réponse 200 dans `lagon-voix`.
24. Étant donné une nouvelle version du jeu, quand le service worker s'active, alors il supprime les anciens caches `lagon-v…` mais garde `lagon-voix`.
25. Étant donné un lecteur non inerte, `navigator.onLine` vrai et `navigator.connection.saveData` pas vrai, quand 5 s se sont écoulées après le chargement, alors le jeu ouvre `caches.open('lagon-voix')`, compte les clips déjà présents, puis télécharge les absents, 4 à la fois, dans l'ordre de la table : `fetch('voix/<empreinte>.mp3', { cache: 'no-store' })` puis `cache.put` fait par la page elle-même (le service worker peut aussi le ranger : un double `put` est sans effet) ; enfin il retire de `lagon-voix` les clips absents de la table. Hors ligne ou en `saveData`, il compte seulement les clips présents.
26. Étant donné que l'appareil refuse d'enregistrer un clip (`QuotaExceededError` ou autre erreur de `cache.put`), quand le téléchargement de fond le constate, alors il s'arrête pour la session, ne prévient pas l'enfant (rien n'est perdu : Web Speech prend le relais) et la carte « Voix » de l'espace parents l'affiche (ligne 28).

Espace parents (phase 3)

27. Étant donné l'espace parents ouvert et `VOICE_SERVICE` non vide, quand il s'affiche, alors une carte « 🗣️ Voix » dit : « La voix du jeu est une voix de synthèse, créée par ordinateur (<VOICE_SERVICE>), et non la voix d'une vraie personne. Les phrases qui contiennent le prénom ou un nombre sont dites par la voix de l'appareil. » Avec `VOICE_SERVICE` vide (phases 1 et 2), aucune carte.
28. La carte lit l'état mémorisé par `voiceOfflineState()` (exporté par `js/shared/ui/index.js` : `{ cached: number | null, total, full, offline, saveData }`, mis à jour à chaque lot et émis par `voice:offline`), et ajoute **une** ligne, la première qui s'applique :
    - `full` : « L'appareil n'a plus de place pour les voix : sans Internet, certaines phrases utilisent la voix de l'appareil. » ;
    - `cached` vaut `null` (pas encore compté, moins de 5 s après le chargement, ou lecteur inerte) : « Voix disponibles sans Internet : vérification en cours. » ;
    - `cached === total` : « Toutes les voix sont disponibles sans Internet. » ;
    - `offline` : « Voix disponibles sans Internet : N sur M. Le reste se téléchargera avec Internet. » ;
    - `saveData` : « Voix disponibles sans Internet : N sur M. Téléchargement en pause (économie de données). » ;
    - sinon : « Voix disponibles sans Internet : N sur M. »

## Décisions

| Id | Décision | Pourquoi | Source |
|---|---|---|---|
| D1 | Clips générés pendant le développement par une voix neuronale du cloud, livrés avec le jeu, Web Speech en repli ; clé jamais dans le dépôt ni le client ; prénom jamais envoyé | Décision 3 d'Amrou (22/11/2026) | brief de la saison 3, décision 3 |
| D2 | Ne pas chercher à améliorer le choix de la voix de l'appareil | Sur iOS, Web Speech n'a que les voix préinstallées : « it is expected that with Web Speech APIs only the pre-installed voices are available. Optionally downloadable voices are not available » | https://developer.apple.com/forums/thread/723503 |
| D3 | Format MP3 mono : Azure `audio-24khz-48kbitrate-mono-mp3`, Google `MP3` (32 kbit/s fixe) | MP3 est lu partout (Safari depuis 3.1). AAC : Firefox dépend du système, Chrome seulement en MP4. Aucun des deux services ne sort de l'AAC. Ogg Opus seulement depuis iOS 18.4 | https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Formats/Audio_codecs ; https://learn.microsoft.com/en-us/azure/ai-services/speech-service/rest-text-to-speech ; https://docs.cloud.google.com/text-to-speech/docs/reference/rest/v1/AudioEncoding ; https://webkit.org/blog/16574/webkit-features-in-safari-18-4/ |
| D4 | Appel Azure : `POST https://<région>.tts.speech.microsoft.com/cognitiveservices/v1`, en-têtes `Ocp-Apim-Subscription-Key`, `Content-Type: application/ssml+xml`, `X-Microsoft-OutputFormat: audio-24khz-48kbitrate-mono-mp3`, `User-Agent: lagon-voix` (obligatoire, moins de 255 caractères) ; corps SSML (table A) ; réponse 200 = le fichier audio | Doc officielle de l'API REST | https://learn.microsoft.com/en-us/azure/ai-services/speech-service/rest-text-to-speech ; https://learn.microsoft.com/en-us/azure/ai-services/speech-service/speech-synthesis-markup-voice |
| D5 | Appel Google : `POST https://texttospeech.googleapis.com/v1/text:synthesize`, en-têtes `Authorization: Bearer <jeton>`, `x-goog-user-project: <projet>`, `Content-Type: application/json; charset=utf-8` ; corps JSON (table G) ; réponse `audioContent` en base64 | Doc officielle ; l'authentification documentée est le jeton de `gcloud` (pas de clé d'API documentée pour ce service) | https://docs.cloud.google.com/text-to-speech/docs/create-audio-text-command-line ; https://docs.cloud.google.com/text-to-speech/docs/reference/rest/v1/text/synthesize ; https://docs.cloud.google.com/text-to-speech/docs/authentication |
| D6 | Voix candidates : Azure `fr-FR-DeniseNeural` (style `cheerful`), `fr-FR-EloiseNeural` (voix d'enfant, sans style), `fr-FR-Vivienne:DragonHDLatestNeural` (HD) ; Google `fr-FR-Chirp3-HD-Aoede`, `fr-FR-Chirp3-HD-Leda`, `fr-FR-Chirp3-HD-Kore` | Denise a 4 styles dont `cheerful` ; Eloise est la seule voix d'enfant fr-FR ; Vivienne existe en HD. Chirp 3 HD couvre fr-FR ; les noms suivent « `<locale>-<model>-<voice>` » (les trois voix sont dans la liste des 30) | https://learn.microsoft.com/en-us/azure/ai-services/speech-service/language-support?tabs=tts ; https://docs.cloud.google.com/text-to-speech/docs/chirp3-hd |
| D7 | Le script vit dans `test/tools/voix.js` (CommonJS, comme les autres outils), lancé par `bun run voix` ; `fetch` intégré, aucune dépendance ajoutée ; `--selftest` ajouté à `bun run selftest` ; sorties 0, 1, 2 | Outils du projet dans `test/tools/` ; contrat de sortie du projet | `package.json:15` ; `test/tools/check.js:1-9` ; `AGENTS.md` (Commandes) |
| D8 | Extraction statique des phrases fixes avec `acorn` (déjà en dépendance de développement), règles R1 à R5 (Politiques) | Déterministe, rapide, sans exécuter le jeu ; `acorn` sert déjà à la garde d'architecture. Seuls 18 appels `speak('…')` sont littéraux : les phrases fixes vivent surtout dans les `say:` (153 littéraux) et les consignes de `gameHeader` | `test/tools/boundaries.js:18-19` ; `package.json` (devDependencies) ; mesure `grep` du 22/11/2026 |
| D9 | **Empreinte** (seule définition) : les 12 premiers caractères hexadécimaux (minuscules) du SHA-256, en UTF-8, de la chaîne canonique de 7 lignes séparées par `\n`, dans cet ordre, sans `\n` final : `GEN=1`, `service=<service>`, `voice=<voice>`, `style=<style>` (vide si pas de style : `style=`), `rate=<String(rate)>` (`-8%` pour Azure, `0.92` pour Google), `format=<format>`, `text=<clé>`. La région n'y est pas (elle ne change pas le son). `GEN` augmente si la façon de générer change. Exemple calculé le 22/11/2026 : clé `Presque! Regarde bien et réessaie.` (sortie de `toSpoken('Presque ! Regarde bien et réessaie.')`, qui retire l'espace avant `!`), réglages de `voix/voix.json` ci-dessous → empreinte `3b8aa8075516` ; le selftest vérifie cette valeur | Un nom de fichier qui dépend du contenu : seul ce qui change est regénéré, et le cache hors ligne n'a jamais besoin d'être invalidé | défaut du rédacteur, à juger à la revue ; calcul avec `node:crypto` |
| D10 | Clé de la table = `toSpoken(texte)` (emojis devenus mots, HTML retiré), fonction pure déplacée par voix-partout dans `js/shared/lib/spoken.js` | `speak()` et le script calculent la même clé : aucun appelant de `speak()` ne change | `js/shared/ui/voice.js:55-68` ; spec voix-partout (phase 1) |
| D11 | Lecture par **un seul `HTMLAudioElement`** réutilisé, source = URL d'objet d'un `Blob` obtenu par `fetch` (pas Web Audio) | (a) Sur iOS, Web Audio est muet quand l'interrupteur de sonnerie est sur silence (type de session `ambient` par défaut), l'élément audio est sur le canal média ; (b) un `Blob` évite les requêtes partielles (Range) que Safari exige des médias et qu'un service worker sert mal depuis son cache ; (c) iOS demande un geste avant de jouer un média | https://bugs.webkit.org/show_bug.cgi?id=237322 ; https://developer.chrome.com/docs/workbox/serving-cached-audio-and-video ; https://webkit.org/blog/6784/new-video-policies-for-ios/ |
| D12 | Phrases à trous : une phrase avec prénom, nombre ou objet variable reste en Web Speech, entière ; pas de clips par nombre, pas de collage de morceaux | Les littéraux ne contiennent jamais le prénom, qui n'est donc jamais envoyé. Coller des morceaux de voix neuronale casse l'intonation, et mêler deux voix dans une phrase est pire que l'une ou l'autre | défaut du rédacteur, à juger à la revue ; mesure de couverture en S9 |
| D12b | Avant la phase 3, `VOICE_CLIPS` est vide (`{}`) : le lecteur est en place mais rien ne change pour l'enfant | Chaque phase est en production une minute après le merge : rien de visible à moitié | brief de la saison 3 (barre de qualité) |
| D23 | `voice-clips.js` passe `oxfmt --check` sans exception de configuration : le script l'écrit, puis lance `node_modules/.bin/oxfmt js/shared/ui/voice-clips.js` (même outil et même `.oxfmtrc.json` que `bun run format`) ; si oxfmt sort autrement que 0, le script sort avec 2. Deux lancements donnent le même octet (oxfmt est déterministe), ce que prouve le selftest | `bun run lint` lance `oxfmt --check js test` ; `.oxfmtrc.json` (guillemets simples, largeur 120) | `package.json:7` ; `.oxfmtrc.json` |
| D24 | `test/tools/sync.js` insère la logique de la voix dans `sw.js` de façon idempotente : (1) après la ligne `const CACHE = …;`, la ligne `const VOICE_CACHE = 'lagon-voix';` si elle n'y est pas ; (2) le bloc entre les marqueurs `  /* voix: début (écrit par test/tools/sync.js) */` et `  /* voix: fin */` est remplacé par le bloc de référence ; si les marqueurs manquent, le bloc est inséré juste après la ligne `  if(e.request.method!=='GET') return;` du gestionnaire `fetch` (si cette ligne manque, `sync` sort avec 1) ; (3) `keys.filter(k=>k!==CACHE)` devient `keys.filter(k=>k!==CACHE&&k!==VOICE_CACHE)` (une seconde passe ne trouve plus rien à remplacer). Bloc de référence : `const vu = new URL(e.request.url);` puis `if(vu.origin===self.location.origin && /\/voix\/[0-9a-f]{12}\.mp3$/.test(vu.pathname)){ e.respondWith(caches.open(VOICE_CACHE).then(c=>c.match(e.request).then(hit=> hit || fetch(e.request).then(res=>{ if(res.status===200) c.put(e.request, res.clone()).catch(()=>{}); return res; })))); return; }`. Le motif ne regarde que la fin du chemin : il marche sous le sous-chemin de GitHub Pages (`/<dépôt>/voix/…`), car le jeu demande l'URL relative `voix/<empreinte>.mp3` | `sync` ne remplace aujourd'hui que `FILES` et `CACHE` ; `sw.js` est ignoré par oxfmt et lu par `test/update.test.js:45-69` | `test/tools/sync.js:35-55` ; `.oxfmtrc.json` ; `sw.js:54-58` |
| D25 | Les outils CommonJS chargent `js/shared/lib/spoken.js` (module ES) par un **seul** chemin, relatif au script et indépendant de `--root` : `await import(pathToFileURL(path.join(__dirname, '..', '..', 'js', 'shared', 'lib', 'spoken.js')).href)`, comme `test/modules.test.js` charge les vrais modules ; ils tournent sous `node` (Node 24 reconnaît la syntaxe ES d'un `.js` sans `"type": "module"`), comme tous les scripts de `package.json` (`"voix": "node test/tools/voix.js"`) | Mécanisme déjà prouvé par la suite | `test/modules.test.js:69` ; `package.json:6-20` |
| D13 | Hors ligne : cache séparé `lagon-voix`, cache d'abord pour `voix/*.mp3`, gardé par `activate` ; rempli à la demande et en tâche de fond, jamais à l'installation | Le cache du jeu change de nom à chaque version (`lagon-vNN`) et `activate` supprime les autres : des clips rangés dedans seraient retéléchargés à chaque merge. Un `addAll` de plusieurs Mo à l'installation échoue en bloc au moindre fichier | `sw.js:1`, `sw.js:46-56` ; `test/tools/sync.js:51-54` |
| D14 | Budget : 8 Mo (8 000 000 octets) de clips au total, 300 Ko (307 200 octets) par clip (garde et script) | Mesure du 22/11/2026 : environ 40 000 caractères de phrases fixes candidates, soit quelques centaines de clips de 2 à 4 s, environ 15 Ko chacun à 48 kbit/s. Le jeu fait 1,5 Mo de code | défaut du rédacteur, à juger à la revue ; `sw.js:2-45` |
| D15 | Stockage : WebKit donne à une app d'écran d'accueil le quota du navigateur (jusqu'à 60 % du disque par origine) et efface par origine, la moins récemment utilisée ; un refus d'écriture reste possible : il arrête le téléchargement et prévient les parents seulement | Politique de stockage WebKit (Safari 17) | https://webkit.org/blog/14403/updates-to-storage-policy/ ; `js/features/parents/storage-alert.js:1-38` |
| D16 | Mention « voix de synthèse » dans l'espace parents (carte du point d'accroche `parents:cards`) | Code de conduite Microsoft : « Disclose when the output … are generated by AI, including the synthetic nature of generated voices » ; même mention pour Google par cohérence | https://learn.microsoft.com/en-us/legal/ai-code-of-conduct ; `js/features/parents/parents.js:286` |
| D17 | Droits : Azure, « Output Content is Customer Data. Microsoft does not own Customer's Output Content » ; Google, « Google does not assert any ownership rights in any new intellectual property created in the Generated Output ». Les MP3 sont commités dans le dépôt public, avec la source et la voix nommées dans l'ADR 0007 | Conditions des services | https://www.microsoft.com/licensing/terms/product/ForOnlineServices/all ; https://cloud.google.com/terms/service-terms (section 20) |
| D18 | **Google n'est retenu que si Amrou lit et accepte la section 20(d)** des conditions Google : « Customer will not … use a Generative AI Service as part of a website … that is directed towards or is likely to be accessed by individuals under the age of 18 ». Si Chirp 3 HD est un service d'IA générative au sens de Google (ce n'est pas tranché par les pages lues), il est exclu pour un jeu d'enfant. Défaut : Azure si le doute demeure | Risque de non-conformité pour un public d'enfants | https://cloud.google.com/terms/service-terms ; https://cloud.google.com/terms/services ; défaut du rédacteur, à juger à la revue |
| D19 | Azure palier F0 : 0,5 million de caractères par mois, 20 transactions par 60 s ; Google Chirp 3 HD : 1 million de caractères gratuits par mois, facturation à activer | Une génération complète (environ 40 000 caractères) tient 12 fois dans le palier gratuit | https://azure.microsoft.com/en-us/pricing/details/cognitive-services/speech-services/ ; https://learn.microsoft.com/en-us/azure/ai-services/speech-service/speech-services-quotas-and-limits ; https://cloud.google.com/text-to-speech/pricing |
| D20 | Le volume de la voix ne suit pas le réglage du volume des sons, comme aujourd'hui avec Web Speech ; la voix baisse le reste du son (`setVoiceDuck`) | Comportement actuel gardé | `js/shared/ui/sound.js:129-136` ; `js/shared/ui/voice.js:132-135` |
| D21 | ADR 0007 « Voix enregistrée » écrit en phase 1, avant le code : format, cache `lagon-voix`, script, service retenu | Toute décision de stockage ou de chaîne d'outils passe par un ADR | `conductor/workflow.md:24` ; `docs/adr/README.md` |
| D22 | Vitesse de génération : `prosody rate="-8%"` (Azure), `speakingRate: 0.92` (Google) | Même vitesse qu'aujourd'hui (`u.rate = 0.92`) | `js/shared/ui/voice.js:128` |

### Table E : les 5 phrases de l'essai d'écoute

| n | Moment du jeu | Phrase |
|---|---|---|
| 1 | Accueil d'une île | Touche un personnage pour l'aider. |
| 2 | Consigne d'un mini-jeu | Compte les étoiles, puis touche le bon nombre. |
| 3 | Erreur douce | Presque ! Regarde bien et réessaie. (envoyée : `Presque! Regarde bien et réessaie.`, ligne 6b) |
| 4 | Victoire, nom propre | Bravo ! Marina t'offre un coquillage. |
| 5 | Histoire, ton de conteuse | Il était une fois, au milieu du lagon, une île qui brillait la nuit. |

### Table V : voix générées pour l'essai

| Service | Voix | Réglages |
|---|---|---|
| Azure | `fr-FR-DeniseNeural` | `mstts:express-as style="cheerful"`, `prosody rate="-8%"` |
| Azure | `fr-FR-EloiseNeural` | `prosody rate="-8%"` |
| Azure | `fr-FR-Vivienne:DragonHDLatestNeural` | `prosody rate="-8%"` |
| Google | `fr-FR-Chirp3-HD-Aoede` | `speakingRate: 0.92` |
| Google | `fr-FR-Chirp3-HD-Leda` | `speakingRate: 0.92` |
| Google | `fr-FR-Chirp3-HD-Kore` | `speakingRate: 0.92` |

Si une voix est refusée par le service (400 ou 404), l'essai l'écrit (« voix inconnue : … ») et continue avec les autres.

### Table A : requête Azure (commande exacte, pour vérifier à la main)

```sh
curl -sS -X POST "https://$VOIX_AZURE_REGION.tts.speech.microsoft.com/cognitiveservices/v1" \
  -H "Ocp-Apim-Subscription-Key: $VOIX_AZURE_KEY" \
  -H "Content-Type: application/ssml+xml" \
  -H "X-Microsoft-OutputFormat: audio-24khz-48kbitrate-mono-mp3" \
  -H "User-Agent: lagon-voix" \
  --data-binary '<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="https://www.w3.org/2001/mstts" xml:lang="fr-FR"><voice name="fr-FR-DeniseNeural"><mstts:express-as style="cheerful"><prosody rate="-8%">Presque! Regarde bien et réessaie.</prosody></mstts:express-as></voice></speak>' \
  -o essai.mp3
```

Le script envoie le même corps avec la clé échappée pour XML (ligne 6b). Sans style (Eloise, Vivienne HD), l'élément `mstts:express-as` est omis. Le silence de déverrouillage (`VOICE_UNLOCK`) se génère avec `<break time="200ms"/>` à la place du texte ; le script l'encode en base64 dans `voice-clips.js`, il n'est jamais écrit dans `voix/`.

### Table G : requête Google (commande exacte)

```sh
curl -sS -X POST "https://texttospeech.googleapis.com/v1/text:synthesize" \
  -H "Authorization: Bearer $VOIX_GOOGLE_TOKEN" \
  -H "x-goog-user-project: $VOIX_GOOGLE_PROJECT" \
  -H "Content-Type: application/json; charset=utf-8" \
  -d '{"input":{"text":"Presque! Regarde bien et réessaie."},"voice":{"languageCode":"fr-FR","name":"fr-FR-Chirp3-HD-Aoede"},"audioConfig":{"audioEncoding":"MP3","speakingRate":0.92}}' \
  | bun -e 'const r=await Bun.stdin.json(); await Bun.write("essai.mp3", Buffer.from(r.audioContent,"base64"))'
```

Le jeton s'obtient avant, hors du dépôt : `export VOIX_GOOGLE_TOKEN=$(gcloud auth print-access-token)` (`gcloud` est un outil du poste d'Amrou, pas une dépendance du projet). Le silence Google : `{"input":{"ssml":"<speak><break time=\"200ms\"/></speak>"}, …}`, encodé de même dans `VOICE_UNLOCK`.

### `voix/voix.json` (forme exacte, commitée)

```json
{ "service": "azure", "voice": "fr-FR-DeniseNeural", "style": "cheerful", "rate": "-8%", "format": "audio-24khz-48kbitrate-mono-mp3" }
```

Pour Google : `{ "service": "google", "voice": "fr-FR-Chirp3-HD-Aoede", "style": "", "rate": 0.92, "format": "MP3" }`. La région Azure vient de `VOIX_AZURE_REGION`, le projet Google de `VOIX_GOOGLE_PROJECT` : ni l'un ni l'autre, ni clé ni jeton, ne sont dans ce fichier (ligne 13).

## Politiques

- **Règles d'extraction (D8)**, appliquées par `test/tools/voix-phrases.js` (module partagé par le script et la garde) à chaque fichier de `js/**/*.js` sauf `js/shared/ui/voice-clips.js` :
  - R1 : premier argument d'un appel `speak(…)` ou `speechBubble(…)` ;
  - R2 : appel `gameHeader(titre, consigne, dite)` : le 3e argument s'il existe, sinon le 2e (c'est ce que `bindQuit` dit, `js/features/screen/screen.js:32-67`) ;
  - R3 : valeur de toute propriété nommée `say` (`say: '…'`), où qu'elle soit ;
  - R4 : valeur de tout attribut `data-say="…"` écrit en dur dans une chaîne ou un gabarit, sans `${` dedans (`&quot;` décodé) ;
  - R5 : chaque élément chaîne d'un tableau, et chaque valeur chaîne d'un objet (récursivement), dont la déclaration est précédée de la ligne `// voix: phrases` (à poser sur `WRONG_HINTS`, `js/features/screen/screen.js:14`, `HINT_CHEERS`, `js/features/hints/hints.js:273`, `PROGRESS_CHEERS`, `js/features/adaptive/adaptive.js:41`, et sur toute table de répliques fixes qu'on veut entendre avec la belle voix).
  - Une valeur compte si c'est un littéral chaîne ou un gabarit **sans** `${…}` ; tout le reste est ignoré (dit par Web Speech). Puis la clé = `toSpoken(valeur)` ; rejetée si elle contient un chiffre, est vide, ou dépasse 400 caractères.
  - Les phrases des jeux de lecture (`reading`, `grammar`, futur `sentence`) suivent les mêmes règles : un clip ne dit que ce que Web Speech aurait dit (l'exception « ne pas dire le mot à lire » est tenue par voix-partout, dans les appels).
- **Arbitrages** :
  - Clip ou Web Speech : le clip gagne s'il est dans la table, lisible, et arrive en moins de 1 500 ms ; sinon Web Speech, sans message.
  - File de parole (voix-partout) et clips : un clip occupe sa place dans la file comme une phrase Web Speech ; `stopSpeech()` arrête les deux.
  - Garde contre vitesse de livraison : une PR qui ajoute une phrase fixe doit livrer son clip (`bun run voix`, clé sur le poste d'Amrou). Sans clé, la garde échoue et l'agent sort bloqué : il le dit dans la PR, il ne contourne pas la garde (ni `// voix: phrases` retiré, ni phrase transformée en gabarit pour échapper à l'extraction).
  - Deux PR qui ajoutent des clips en même temps : le conflit sur `voice-clips.js` se règle en relançant `bun run voix` après le rebase (le fichier est généré, trié).
- **Messages du script** : seuls les messages de la table C (et ceux des lignes 2, 3 et 7 qu'elle reprend) sont des textes exacts, vérifiés par le selftest. Ce sont des gabarits dont les variables sont définies : `<service>` et `<VARIABLES>` (avant la ligne 1), `<cause>` (ligne 7), `<N>`, `<X>`, `<Y>`, `<Z>` (ligne 3), `<n>` (nombre de phrases refusées), `<voix>` (nom de voix de la table V), `<première règle violée>` (texte de la règle de la ligne 13, par exemple `clé en trop : region`), `<export>` (nom de l'export illisible), `<cas>`, `<obtenu>`, `<attendu>` (selftest). Tout autre affichage (progression, détail d'une requête) est libre et n'est pas vérifié.
- **Lecture de `voice-clips.js` par le script et par la garde** : jamais par `import()` (un second `import()` du même fichier dans un processus rend l'ancienne valeur, et le selftest relance `main` plusieurs fois) ; le texte du fichier est lu par `fs.readFileSync` puis analysé par `acorn` (`sourceType: 'module'`) : on prend les trois `export const` nommés `VOICE_SERVICE`, `VOICE_UNLOCK` (littéraux chaîne) et `VOICE_CLIPS` (objet de propriétés chaîne vers chaîne). Acorn plutôt qu'une expression régulière, parce qu'oxfmt choisit les guillemets doubles dès qu'une clé contient une apostrophe (essai du 22/11/2026, ci-dessous). Fichier absent, vide, ou export manquant : la valeur manquante vaut `''` ou `{}`. Export présent mais d'une autre forme (pas un littéral) : « ❌ voix : js/shared/ui/voice-clips.js illisible : <export> » et sortie 1 (ligne ajoutée à la table C). À la réécriture, `VOICE_UNLOCK` garde sa valeur lue quand le silence n'est pas redemandé, et `VOICE_SERVICE` est recalculé depuis `voix.json`.
- **Texte exact du fichier généré**, exemple à deux clips après oxfmt (essai lancé dans le scratchpad avec le `.oxfmtrc.json` du dépôt ; empreintes calculées selon D9 ; base64 abrégé ici) :

```js
/* Généré par bun run voix (test/tools/voix.js) : ne pas modifier à la main. */
/** @type {string} */
export const VOICE_SERVICE = 'Microsoft Azure';
/** @type {string} */
export const VOICE_UNLOCK = 'data:audio/mpeg;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4LjI5LjEwMAAAAAAAAAAAAAAA';
/** @type {Record<string, string>} */
export const VOICE_CLIPS = {
  'Presque! Regarde bien et réessaie.': '3b8aa8075516',
  "Touche un personnage pour l'aider.": 'b85f1f4327af',
};
```

  Les annotations `@type` sont exigées par le mode strict (`strict: true` dans `tsconfig.json`, tout `js/` est vérifié par `bun run typecheck`, sans `any` ni `@ts-ignore`) : sans elles, `{}` serait typé comme un objet vide. En phases 1 et 2, le fichier est le même avec `VOICE_SERVICE = ''`, `VOICE_UNLOCK = ''` et `VOICE_CLIPS = {}`.
- **Écritures du script** (`bun run voix`), dans cet ordre, tout ou rien pour ce qui existe déjà : 1. chaque clip nouveau est écrit dans `voix/` dès sa réponse (fichier neuf, jamais un fichier existant réécrit) ; 2. quand toutes les phrases ont réussi, l'ancien contenu de `voice-clips.js` est gardé en mémoire, la nouvelle table est écrite ; 3. oxfmt la formate ; s'il échoue, l'ancien contenu est réécrit à l'identique et le script sort avec 2 ; 4. les clips orphelins sont supprimés, en dernier. État après chaque échec : 401, 403, 3e tentative ratée ou 400 : clips nouveaux déjà reçus présents, table inchangée, **aucun clip supprimé** (la garde échoue sur ces clips sans entrée et sur les phrases sans clip : relancer `bun run voix` finit le travail sans redemander les clips présents) ; échec d'oxfmt : table restaurée, aucun clip supprimé. `--essai` n'écrit que dans `essaiDir` (vidé au début) ; `--selftest` n'écrit que dans sa racine temporaire.
- **Défauts** : pas de réglage « belle voix ou voix de l'appareil » pour l'enfant ; la vitesse est une constante de `voix.json` ; aucune dépendance ajoutée ; les MP3 ne passent ni par `oxfmt` ni par `oxlint`. Délai de repli 1 500 ms ; téléchargement de fond 4 clips à la fois, 5 s après le chargement.
- **Référence visuelle** : la carte « Voix » a la forme de la carte « Enregistrement » (`js/features/parents/storage-alert.js:30-37`, `section.bk-card` avec un `h3` et des `p`).
- **Détails non écrits** : l'agent prend l'option la plus simple, la note dans le journal de décisions du plan, l'humain juge à la revue.

## Hors périmètre

- Synthèse neuronale dans le navigateur (modèle embarqué) : trop lourde pour un téléphone, et d'autres voix que celles choisies.
- Enregistrement du prénom par le parent (sa voix ou une génération) : le prénom reste en Web Speech.
- Surlignage « karaoké » des mots pendant la lecture : idée notée, preuve faible de son effet sur l'apprentissage (https://hal.archives-ouvertes.fr/hal-01192870/file/eg_SLaTE2015_revision_TRACK_2015-06-18.pdf).
- Clips par nombre et phrases recollées en morceaux (D12).
- Un réglage de volume propre à la voix.

## Contrats partagés

| Contrat | Forme (ou lien) | Propriétaire | Consommateurs |
|---|---|---|---|
| `toSpoken(text)` | `js/shared/lib/spoken.js`, fonction pure, sans DOM | voix-partout | `voice.js`, `test/tools/voix-phrases.js`, garde |
| `voice-clips.js` | `js/shared/ui/voice-clips.js` : `VOICE_CLIPS = { 'clé': 'a1b2c3d4e5f6' }`, `VOICE_SERVICE`, `VOICE_UNLOCK`, générés, triés, passés par oxfmt (D23), déclarés dans la slice `shared-ui` (`js/slices.cjs`), donc précachés par `sync` comme tout module | cette track (script) | `voice.js`, carte parents, garde |
| Clips | `voix/<empreinte>.mp3`, rien d'autre | cette track | lecteur, `lagon-voix` |
| `voix/voix.json` | forme ci-dessus | Amrou (choix à l'écoute) | script seulement (la carte parents lit `VOICE_SERVICE`, ci-dessous) |
| File de parole | `speak(text, opts)`, `stopSpeech()`, lecteur interne `playItem(item, done) → stop` avec `item = { text, key, rate, demand, el }` (forme figée par voix-partout, contrat « `playItem` » ; `el` vient de `speak(text, { el })` et le lecteur de clips le surligne comme Web Speech, `voix-lu` de `playing` à `done()`) | voix-partout | cette track choisit clip ou Web Speech dans `playItem` d'après `item.key` et `item.rate`, appelle `done()` une seule fois à la fin, et rend `stop()` |
| Réexports de `js/shared/ui/index.js` | ajouts de cette track : `export { VOICE_SERVICE } from './voice-clips.js';` et `voiceOfflineState` dans la ligne d'export de `./voice.js` (avec `stopSpeech`, `newVoiceScene` ajoutés par voix-partout). `VOICE_CLIPS`, `VOICE_UNLOCK` et `setVoiceClips` ne sont pas réexportés : seul `voice.js`, dans la slice, les lit (les tests passent par `ev`, la garde lit le fichier par `fs.readFileSync` puis `acorn`, comme le script (politique « Lecture de `voice-clips.js` »)) | cette track | carte « Voix » : `import { VOICE_SERVICE, voiceOfflineState } from '../../shared/ui/index.js';` et `import { on } from '../../shared/lib/index.js';` |
| Types (JSDoc, vérifiés en strict par `bun run typecheck`) | `voice-clips.js` : les trois `@type` ci-dessus. `voice.js` : `/** @typedef {{ cached: number \| null, total: number, full: boolean, offline: boolean, saveData: boolean }} VoiceOfflineState */` ; `voiceOfflineState(): VoiceOfflineState` ; `setVoiceClips(table: Record<string, string>, unlock: string): void`. `playItem` garde la signature et le `SpeechItem` de voix-partout (contrat « Types »), sans `any` ni `@ts-ignore`. `js/features/parents/voice-card.js` : typé de même (tout le code de la track est vérifié en strict) (`@param` de l'écouteur de `parents:cards`, `@returns {string}`) | cette track | `voice.js`, carte, garde |
| État hors ligne | `voiceOfflineState() → { cached: number \| null, total, full, offline, saveData }` et `emit('voice:offline', même objet)` | cette track | carte « Voix » (parents) |

## Surface d'attaque

| Entrée | Données ou appelant | Limites et vérifications | Peut atteindre | Jamais |
|---|---|---|---|---|
| Clé du service | variables d'environnement du poste de développement | lue par `test/tools/voix.js` seulement ; jamais écrite dans un fichier ni affichée (le script n'affiche que les 4 derniers caractères) | l'API du service | le dépôt, le client, les logs de CI |
| Texte envoyé au service | phrases fixes extraites du code | littéraux seulement : aucun prénom, aucune donnée de partie | le service de synthèse | prénom, âge, sauvegarde |
| Réponse du service | MP3 (Azure) ou JSON base64 (Google) | statut 200 exigé ; corps non vide ; taille au plus 307 200 octets (décodés pour Google), table « Réponse du service » ; les 3 premiers octets sont `ID3` ou un en-tête de trame MP3 (`0xFF 0xFB`, `0xFF 0xF3`, `0xFF 0xF2`), sinon sortie 1 | `voix/*.mp3` | du code exécutable |
| Clip dans le jeu | `voix/<12 hex>.mp3` même origine | nom construit depuis `VOICE_CLIPS` seulement, motif `^[0-9a-f]{12}$` vérifié avant `fetch` | l'élément audio | une URL d'une autre origine |

## Zones sensibles touchées

- PWA : `sw.js` (cache `lagon-voix`, règle cache d'abord, `activate`), écrit par `test/tools/sync.js` (revue humaine).
- Espace parents : nouvelle carte « Voix » (revue humaine).
- Outil qui appelle un service payant avec une clé (revue humaine : aucune fuite de clé).

## Smoke test

| Id | Qui | Étapes | Attendu | Niveau visé |
|---|---|---|---|---|
| S1 | 🤖 | `bun run voix --selftest` | sortie 0 ; couvre : extraction R1 à R5 sur un fichier exemple, empreinte `3b8aa8075516` (D9), appels à `fetch` N + 1, 0, 1, N (lignes 3 à 6), texte envoyé (ligne 6b), chaque ligne de la table C, 429 puis succès, rythme Azure (ligne 8), contrôle des octets MP3, racine temporaire seule touchée | test-verified |
| S2 | 👤 | Amrou lance `bun run voix --essai`, ouvre `$TMPDIR/voix-essai/ecoute.html`, écoute les 5 phrases de chaque voix avec sa fille | une voix choisie ; Amrou lit la section 20(d) Google si une voix Google est choisie (D18) ; `voix/voix.json` écrit | runtime-verified |
| S3 | 🤖 | `bun run test voix-clips` après `bun run voix` | garde verte ; casser une phrase fixe la fait échouer avec le bon message (lignes 10 à 13) | test-verified |
| S4 | 🤖 | `bun run test voix-lecteur` (jsdom, faux `Audio`, faux `fetch`, faux `caches`) | lignes 14 à 22 et 25 à 28 | test-verified |
| S5 | 🤖 | `bun run test update` | lignes 23 et 24 (lecture du texte de `sw.js`), tests existants du service worker toujours verts | test-verified |
| S6 | 👤 | iPad de la famille, jeu installé sur l'écran d'accueil, interrupteur de sonnerie sur silence | la voix du clip s'entend ; les sons du jeu suivent l'interrupteur comme avant | runtime-verified |
| S7 | 👤 | iPad en mode avion après une partie en ligne | les phrases fixes ont la belle voix ; une phrase avec le prénom a la voix de l'appareil | runtime-verified |
| S8 | 👤 | Téléphone Android (Chrome) et ordinateur (Firefox) | les clips jouent ; aucune phrase coupée ni doublée | runtime-verified |
| S9 | 🤖 | `bun run test voix-partout` (garde de voix-partout) avec la couverture affichée | ligne « clips : N phrases dites sur M ont un clip (X %) » imprimée ; aucun échec | test-verified |
| S10 | 👤 | La fille d'Amrou joue 15 minutes | elle ne remarque pas de coupure ; le passage d'une voix à l'autre (prénom) ne la gêne pas, sinon une ligne dans « Écarts » du plan | runtime-verified |

## Questions ouvertes

