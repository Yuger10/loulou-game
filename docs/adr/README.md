# Décisions d'architecture (ADR)

Une décision structurante = un fichier numéroté, jamais réécrit après coup : si elle change, on écrit un nouvel ADR qui la remplace.
Format : contexte, décision, options envisagées, conséquences, validation.

| N° | Décision | Statut |
|---|---|---|
| [0001](./0001-architecture-feature-slices.md) | Organiser le code en feature slices, en deux étapes (scripts classiques, puis modules ES) | Acceptée, complétée par 0002 (A en v51, B en v54) |
| [0002](./0002-modules-es-natifs.md) | Modules ES natifs sans build, `index.js` comme API publique, couches sans cycle (bus d'événements), tests regroupés par esbuild et test des vrais modules | Acceptée, livrée en v54 |
