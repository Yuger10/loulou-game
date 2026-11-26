# Décisions d'architecture (ADR)

Une décision structurante = un fichier numéroté, jamais réécrit après coup : si elle change, on écrit un nouvel ADR qui la remplace.
Format : contexte, décision, options envisagées, conséquences, validation.

| N° | Décision | Statut |
|---|---|---|
| [0001](./0001-architecture-feature-slices.md) | Organiser le code en feature slices, en deux étapes (scripts classiques, puis modules ES) | Acceptée, complétée par 0002 (A en v51, B en v54) |
| [0002](./0002-modules-es-natifs.md) | Modules ES natifs sans build, `index.js` comme API publique, couches sans cycle (bus d'événements), tests regroupés par esbuild et test des vrais modules | Acceptée, livrée en v54 |
| [0003](./0003-typescript.md) | Passer à TypeScript par la vérification du JavaScript (TypeScript 7, `checkJs`, JSDoc), sans build, progressivement | Acceptée, étape 1 livrée (66.3) |
| [0004](./0004-outillage-factory.md) | Outillage de la factory : bun, oxlint, oxfmt, lanceur de tests maison en parallèle | Acceptée (v66 à v66.2) |
| [0005](./0005-versions-66x.md) | Versions 66.1, 66.2… pour les livraisons sans track (`APP_PATCH`) | Acceptée (v66.1) |
| [0006](./0006-ecarts-playbook-cothon.md) | Ce que ce projet garde et écarte du playbook cothon | Acceptée |
| [0007](./0007-voix-enregistree.md) | Voix enregistrée : clips MP3 générés à l'avance par une voix neuronale, cache `lagon-voix`, Web Speech en repli | Proposée (outil et lecteur en place, clips à générer) |
