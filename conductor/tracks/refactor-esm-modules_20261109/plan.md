# Plan : Passage aux modules ES natifs (étape B) (v54)

Spec : [spec.md](./spec.md). Workflow : [workflow.md](../../workflow.md).
**Prérequis :** `refactor-feature-slices_20261109` livrée.

> **Réalisé (v54) — écarts au plan** (détails et raisons : [ADR 0002](../../../docs/adr/0002-modules-es-natifs.md)) :
> - **Pas de passerelle `globalThis`.** Les noms republiés auraient été des copies, pas des liaisons vivantes (`state = …` invisible des autres fichiers). L'ordre suivi :
>   1. préparation : une variable n'est réaffectée que par son fichier ;
>   2. phase 2 faite **en scripts classiques**, tests verts : bus d'événements et couches sans cycle ;
>   3. conversion de tous les fichiers d'un coup par un script (imports, exports, `index.js`, `main.js`), à partir de l'analyse `acorn` de l'étape A.
> - **Les cycles venaient surtout de code rangé trop haut.** Il a été déplacé vers des slices plus basses :
>   - `screen` (en-tête des fenêtres) et `hints` (indices) sortent du moteur ;
>   - `adaptive/session.js` (jeu en cours, défi bonus) et `adaptive/skills.js` (progrès) quittent le moteur et l'espace parents ;
>   - l'entité `season` (les fêtes) ; `SQ_COLORS` va dans l'entité `squishy` et `GAME_LIST` dans `difficulty`.
>
>   Le reste passe par 14 événements et 3 points d'accroche (liste dans l'ADR).
> - **Le manifeste devient `js/slices.cjs`**, et `js/package.json` déclare `"type": "module"`. Il ne garde que couche, fichiers, ordre et CSS ; les listes `public` sont remplacées par les `index.js`.
> - **En plus du plan : `test/modules.test.js`,** qui charge les vrais modules dans Node, parce que le regroupement esbuild change `const`/`let` en `var` et masquerait une erreur d'ordre d'initialisation.
> - **Il reste 5 petites boucles entre deux fichiers d'une même slice.** La spec ne vise que les cycles entre slices, et le test des vrais modules vérifie qu'elles ne gênent pas.

## Phase 1 : Harnais de test et passerelle [checkpoint: 326e0bc, ea8d091]
- [x] Task: ADR 0002 « Modules ES natifs » (`docs/adr/`), avant tout code ; passer l'ADR 0001 à « complété par 0002 »
- [x] Task: Harnais esbuild
    - [x] `esbuild` en `devDependencies` ; le harnais regroupe `js/app/main.js` en un script IIFE injecté dans jsdom ; `tech-stack.md` mis à jour **avant** (règle du workflow)
    - [x] Tests : tout le test de fumée passe avec le nouveau harnais
- [x] Task: Tous les fichiers en modules, avec passerelle
    - [x] Script de conversion : chaque fichier exporte ses noms de haut niveau et les republie sur `globalThis` (passerelle), dans l'ordre du manifeste ; `js/app/main.js` importe tous les fichiers dans cet ordre
    - [x] `index.html` : un seul `<script type="module">`
    - [x] Tests : jeu identique ; ordre d'initialisation conservé
- [x] Task: Conductor - User Manual Verification 'Harnais de test et passerelle' (Protocol in workflow.md)

## Phase 2 : Bus d'événements et cycles [checkpoint: 9fbea3c]
- [x] Task: `shared/lib/events.js`
    - [x] Tests : `on`, `emit`, `off` ; un écouteur qui plante n'empêche pas les autres
- [x] Task: Casser les cycles entre features
    - [x] Repérer les cycles (graphe esbuild `metafile`) ; remplacer les appels croisés par des événements (`island:unlocked`, `mission:won`, `chest:opened`, `modal:opening`…)
    - [x] Tests : aucun cycle d'import entre slices
- [x] Task: Conductor - User Manual Verification 'Bus d'événements et cycles' (Protocol in workflow.md)

## Phase 3 : Imports explicites, couche par couche [checkpoint: ea8d091]
- [x] Task: `shared` puis `entities`
    - [x] Chaque slice : `index.js` qui réexporte l'API publique ; les fichiers importent ce qu'ils utilisent ; plus de lecture de globales
- [x] Task: `features`
    - [x] Même travail ; retrait des gardes `typeof`
- [x] Task: `app`
    - [x] `main.js` importe les `index.js` et démarre le jeu
- [x] Task: Test des imports
    - [x] Tests : seuls les `index.js` d'autres slices sont importés ; règle des couches ; cas fautif volontaire qui doit échouer
- [x] Task: Conductor - User Manual Verification 'Imports explicites' (Protocol in workflow.md)

## Phase 4 : Retrait de la passerelle et service worker [checkpoint: ea8d091]
- [x] Task: Retirer la passerelle `globalThis`
    - [x] Tests : aucune écriture applicative sur `globalThis` ou `window` ; jeu identique
- [x] Task: Service worker
    - [x] `npm run sw` génère `FILES` depuis le manifeste ; le test compare `sw.js` à la liste générée ; cache incrémenté
- [x] Task: Conductor - User Manual Verification 'Retrait de la passerelle' (Protocol in workflow.md)

## Phase 5 : Documentation et livraison
- [x] Task: Docs
    - [x] `tech-stack.md`, `README.md` (`file://` interdit, `npm start`), `workflow.md`, checklists « ajouter un mini-jeu » et « ajouter une île »
- [~] Task: Vérification sur appareils
    - [x] Ordinateur (Chromium) : parcours au doigt sur les vrais modules, hors-ligne (192 fichiers précachés), rechargement ; émulation Pixel 7 et iPhone 13
    - [ ] Safari iOS et Chrome Android sur les vrais appareils : à faire par le propriétaire (noté dans TODO.md)
- [x] Task: Conductor - User Manual Verification 'Documentation et livraison' (Protocol in workflow.md)
- [ ] Task: Branche, PR sur `main`, merge
