# Plan : Passage aux modules ES natifs (étape B) (v54)

Spec : [spec.md](./spec.md). Workflow : [workflow.md](../../workflow.md).
**Prérequis :** `refactor-feature-slices_20261109` livrée.

## Phase 1 : Harnais de test et passerelle
- [ ] Task: ADR 0002 « Modules ES natifs » (`docs/adr/`), avant tout code ; passer l'ADR 0001 à « complété par 0002 »
- [ ] Task: Harnais esbuild
    - [ ] `esbuild` en `devDependencies` ; le harnais regroupe `js/app/main.js` en un script IIFE injecté dans jsdom ; `tech-stack.md` mis à jour **avant** (règle du workflow)
    - [ ] Tests : tout le test de fumée passe avec le nouveau harnais
- [ ] Task: Tous les fichiers en modules, avec passerelle
    - [ ] Script de conversion : chaque fichier exporte ses noms de haut niveau et les republie sur `globalThis` (passerelle), dans l'ordre du manifeste ; `js/app/main.js` importe tous les fichiers dans cet ordre
    - [ ] `index.html` : un seul `<script type="module">`
    - [ ] Tests : jeu identique ; ordre d'initialisation conservé
- [ ] Task: Conductor - User Manual Verification 'Harnais de test et passerelle' (Protocol in workflow.md)

## Phase 2 : Bus d'événements et cycles
- [ ] Task: `shared/lib/events.js`
    - [ ] Tests : `on`, `emit`, `off` ; un écouteur qui plante n'empêche pas les autres
- [ ] Task: Casser les cycles entre features
    - [ ] Repérer les cycles (graphe esbuild `metafile`) ; remplacer les appels croisés par des événements (`island:unlocked`, `mission:won`, `chest:opened`, `modal:opening`…)
    - [ ] Tests : aucun cycle d'import entre slices
- [ ] Task: Conductor - User Manual Verification 'Bus d'événements et cycles' (Protocol in workflow.md)

## Phase 3 : Imports explicites, couche par couche
- [ ] Task: `shared` puis `entities`
    - [ ] Chaque slice : `index.js` qui réexporte l'API publique ; les fichiers importent ce qu'ils utilisent ; plus de lecture de globales
- [ ] Task: `features`
    - [ ] Même travail ; retrait des gardes `typeof`
- [ ] Task: `app`
    - [ ] `main.js` importe les `index.js` et démarre le jeu
- [ ] Task: Test des imports
    - [ ] Tests : seuls les `index.js` d'autres slices sont importés ; règle des couches ; cas fautif volontaire qui doit échouer
- [ ] Task: Conductor - User Manual Verification 'Imports explicites' (Protocol in workflow.md)

## Phase 4 : Retrait de la passerelle et service worker
- [ ] Task: Retirer la passerelle `globalThis`
    - [ ] Tests : aucune écriture applicative sur `globalThis` ou `window` ; jeu identique
- [ ] Task: Service worker
    - [ ] `npm run sw` génère `FILES` depuis le manifeste ; le test compare `sw.js` à la liste générée ; cache incrémenté
- [ ] Task: Conductor - User Manual Verification 'Retrait de la passerelle' (Protocol in workflow.md)

## Phase 5 : Documentation et livraison
- [ ] Task: Docs
    - [ ] `tech-stack.md`, `README.md` (`file://` interdit, `npm start`), `workflow.md`, checklists « ajouter un mini-jeu » et « ajouter une île »
- [ ] Task: Vérification sur appareils
    - [ ] Safari iOS, Chrome Android, ordinateur : jeu, hors-ligne, sauvegarde et restauration
- [ ] Task: Conductor - User Manual Verification 'Documentation et livraison' (Protocol in workflow.md)
- [ ] Task: Branche, PR sur `main`, merge
