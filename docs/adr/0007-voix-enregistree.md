# ADR 0007 : Voix enregistrée (clips générés à l'avance, Web Speech en repli)

- **Statut :** proposée (outil et lecteur en place, inertes ; elle passe à « acceptée » quand Amrou a choisi la voix à l'écoute et généré les clips)
- **Date :** 2026-11-26
- **Décideur :** Amrou (décision 3 du brief de la saison 3, 22/11/2026 : « une voix partout et plus naturelle »)
- **Spec :** [conductor/tracks/voix-naturelle_20261122/spec.md](../../conductor/tracks/voix-naturelle_20261122/spec.md)

## Contexte
La voix du jeu est celle de l'appareil (Web Speech). Amrou la trouve robotique, et une enfant de 6 ans qui apprend à lire passe l'essentiel du jeu à l'écouter. Choisir une meilleure voix de l'appareil est une impasse sur iPad : Safari ne donne à Web Speech que les voix préinstallées (https://developer.apple.com/forums/thread/723503). Il faut une voix chaleureuse, la même partout, qui marche sans Internet, sans clé de service dans le jeu, et sans jamais envoyer le prénom de l'enfant.

## Options envisagées
1. **Mieux choisir la voix de l'appareil** : écartée, les voix téléchargeables ne sont pas offertes à Web Speech sur iOS.
2. **Synthèse neuronale dans le navigateur** (modèle embarqué) : écartée, trop lourde pour un téléphone.
3. **Clips en Ogg Opus** : écartés, lus seulement depuis iOS 18.4 ; le MP3 est lu partout.
4. **Web Audio pour jouer la voix** : écarté, muet sur iOS quand l'interrupteur de sonnerie est sur silence ; un élément audio est sur le canal média.
5. **Clips MP3 générés pendant le développement, livrés avec le jeu, Web Speech en repli** : retenue.

## Décision
- Les **phrases fixes** du code (sans prénom, sans nombre, règles R1 à R5 de la spec) sont dites par une voix neuronale du cloud, générées **à l'avance** par `bun run voix` (`test/tools/voix.js`), sur le poste d'Amrou. La clé du service ne vit que dans l'environnement de ce poste : jamais dans le dépôt, jamais dans le jeu. Seuls des littéraux du code sont envoyés : le prénom ne l'est jamais.
- **Format** : MP3 mono (Azure `audio-24khz-48kbitrate-mono-mp3`, Google `MP3`).
- **Nom d'un clip** : `voix/<empreinte>.mp3`, l'empreinte étant les 12 premiers caractères hexadécimaux du SHA-256 des réglages (`voix/voix.json`) et du texte dit (`toSpoken`). Un nom ne change donc jamais de contenu : seul ce qui change est regénéré, et le cache hors ligne n'a jamais à être invalidé.
- **Table** : `js/shared/ui/voice-clips.js` (générée, triée, passée par oxfmt) associe chaque phrase dite à son empreinte.
- **Lecture** : un seul `HTMLAudioElement`, source = URL d'objet d'un `Blob` obtenu par `fetch`. Si le clip manque, tarde plus de 1 500 ms ou si le navigateur refuse de jouer, la même phrase est dite par Web Speech, à sa place dans la file de parole.
- **Hors ligne** : cache séparé `lagon-voix` (cache d'abord), gardé d'une version à l'autre, rempli à la demande et en tâche de fond, jamais à l'installation du service worker.
- **Garde** : `test/voix-clips.test.js` échoue si une phrase fixe n'a pas son clip à jour, si un clip est orphelin, ou si le budget (8 Mo au total, 300 Ko par clip) est dépassé.
- **Service retenu** : à écrire ici après l'essai d'écoute (`bun run voix --essai`). Candidats : Azure (`fr-FR-DeniseNeural`, `fr-FR-EloiseNeural`, `fr-FR-Vivienne:DragonHDLatestNeural`) et Google (`fr-FR-Chirp3-HD-Aoede`, `-Leda`, `-Kore`).

## Conditions des services
- **Droits sur les clips** : Azure, « Output Content is Customer Data. Microsoft does not own Customer's Output Content » (https://www.microsoft.com/licensing/terms/product/ForOnlineServices/all) ; Google, « Google does not assert any ownership rights in any new intellectual property created in the Generated Output » (https://cloud.google.com/terms/service-terms, section 20). Les MP3 sont commités dans le dépôt public.
- **Mention** : l'espace parents dit que la voix est une voix de synthèse (code de conduite Microsoft, https://learn.microsoft.com/en-us/legal/ai-code-of-conduct).
- **Public d'enfants** : Google n'est retenu que si Amrou lit et accepte la section 20(d) de ses conditions (« Customer will not … use a Generative AI Service as part of a website … that is directed towards or is likely to be accessed by individuals under the age of 18 »). Dans le doute, Azure.

## Vérification
- `bun run voix --selftest` (dans `bun run selftest`, donc dans `bun run check`) : extraction, empreinte, nombre d'appels au service, messages et codes de sortie, avec un faux service. Il n'appelle jamais le vrai.
- `test/voix-clips.test.js` : la garde. `test/voix-lecteur.test.js` : le lecteur, le repli, le téléchargement de fond. `test/update.test.js` : le cache `lagon-voix` du service worker.
- **Non vérifié par un check** : la qualité de la voix (écoute d'Amrou et de sa fille), le comportement sur iPad avec l'interrupteur de sonnerie sur silence, et la lecture des conditions des services.

## Conséquences
- Positif : une voix chaleureuse, identique sur tous les appareils, sans Internet ; rien ne change pour les phrases avec prénom ou nombre.
- Coût : une PR qui ajoute une phrase fixe doit livrer son clip, donc passer par le poste d'Amrou (la clé n'existe que là). Sans clé, la garde échoue et l'agent s'arrête : il ne contourne pas la garde.
- Poids : les clips entrent dans le dépôt (budget 8 Mo).
- Risque : deux voix dans le jeu (clip et appareil), jugé à l'usage par la fille d'Amrou.
