# Spec : Refactor en « feature slices », scripts classiques (étape A, v50)

> Track technique, **sans aucun changement visible pour l'enfant**. C'est l'étape A de la feuille de route A → B :
> **A** : feature slices en scripts classiques (cette track) ;
> **B** : modules ES natifs (`refactor-esm-modules_20261109`).
> À faire **en premier** (v50), avant `compagnons-roles` (v51) et `squishy-collection` (v52), pour que les nouvelles fonctionnalités naissent directement dans la nouvelle structure.

## 1. Pourquoi
- Les fichiers « fourre-tout » grossissent à chaque version : `minigames.js` (720 lignes), `data.js` (690), `ui.js` (537), `difficulty.js` (480), `styles.css` (2 800) ; 37 fichiers JS à plat dans `js/`. Trouver où ajouter un monde, un mini-jeu ou un compagnon demande de connaître tout le code.
- Tout vit dans la portée globale, avec des dépendances implicites (`typeof fn==='function'`). Rien ne dit qui a le droit d'appeler quoi.
- Les tracks à venir (squishies, saison 2, licornes, compagnons) ajoutent chacune plusieurs fichiers. Il leur faut un endroit évident où vivre.

## 2. Décisions (prises par délégation, modifiables)
| Sujet | Décision | Pourquoi |
|---|---|---|
| Système de chargement | **Scripts classiques** conservés (`<script src>`), sans build | Zéro risque pour le test jsdom et la PWA ; l'étape B s'en chargera |
| Couches | 4 couches inspirées de Feature-Sliced Design : `app` → `features` → `entities` → `shared` | Pas de `pages`/`widgets` : l'appli est une seule page à vues, ce serait de la cérémonie inutile |
| Frontières | Chaque slice déclare son **API publique** dans un **manifeste** (`js/slices.js`). Un **test de frontières** vérifie les règles | Les scripts classiques n'ont pas de vraies frontières, donc on les vérifie par un test |
| Appels entre features | Autorisés **uniquement via l'API publique** de l'autre feature | Le jeu est très imbriqué (histoire ↔ île ↔ quêtes) ; l'interdire forcerait un bus d'événements dès l'étape A. L'étape B pourra le resserrer |
| CSS | **Découpé par slice**, à côté de son JS (`*.css`), avec une base commune dans `shared/` | `styles.css` (2 568 lignes) est le plus gros fichier du projet |
| Comportement | **Identique** : mêmes clés `localStorage`, même `SAVE_VERSION`, mêmes écrans | Un refactor ne doit rien changer pour l'enfant ni pour les sauvegardes |

## 3. Structure cible
```
js/
  slices.js                 manifeste : couche, fichiers (dans l'ordre), API publique de chaque slice
  app/                      démarrage (init.js), enregistrement du service worker, liaison des boutons globaux
  features/
    minigame-engine/        cadre commun des mini-jeux : essais, relance anti-devinette, minuteur, choix du jeu
    minigames/<jeu>/        un dossier par mini-jeu : memory, count, intruder, sequence, puzzle, math, reading,
                            grammar, volume, compare, money, clock, calendar, calc, shapes, planets, jigsaw
    adaptive/               niveau propre à chaque mini-jeu, soutien (adaptive.js)
    story/                  histoire, énigmes, épisodes (episodes.js), journal
    gifts/                  offrir un objet, amitié des personnages (gifts.js)
    wardrobe/               « Mon look » (wardrobe.js)
    parents/                espace parents (parents.js)
    seasons/                fêtes et saisons (seasons.js)
    map/                    carte, bateau, trajets
    island/                 île vivante, scène, personnages à toucher
    market/                 marché (vendre, échanger, fusionner, acheter)
    bag/                    sac et album
    quests/                 missions du jour et coffre
    gains/                  animations de gain
    players/                écrans joueurs, modes de jeu (profiles-ui), course (race)
    backup/                 sauvegarde, restauration, installation
  entities/
    game-state/             état, sauvegarde, migrations (state.js sans les quêtes)
    player/                 profils (players.js sans l'interface)
    item/                   ITEMS, ALL_ITEMS, recettes, décorations
    character/              CHARACTERS, art des personnages (characters-art.js)
    world/                  WORLDS, WORLD_ORDER, charsOf
    companion/              compagnons (companions.js)
    difficulty/             paliers, réglages par âge (difficulty.js)
  shared/
    ui/                     modale, toast, sons, voix, confettis, vibration, en-têtes de jeu, icônes dessinées (icons.js)
    audio/                  musique d'ambiance (music.js)
    lib/                    hasard, utilitaires purs
    styles/                 base, variables, design system, responsive
```
La correspondance exacte, fonction par fonction, est établie et figée dans la phase 1 du plan (inventaire). Les noms de dossiers ci-dessus sont la cible ; un regroupement plus fin ou plus large reste possible si l'inventaire le justifie.

## 4. Règles de frontières (vérifiées par un test)
1. **Couches :** un fichier ne référence que des noms de sa couche ou des couches **inférieures** (`app` > `features` > `entities` > `shared`). `shared` ne connaît personne.
2. **API publique :** un nom défini dans une autre slice ne peut être référencé que s'il fait partie de l'API publique de cette slice, déclarée dans `js/slices.js`.
3. **Pas de garde `typeof fn==='function'`** pour une dépendance déclarée. Les gardes ne restent que pour les fonctions vraiment optionnelles, listées et commentées.
4. **Ordre de chargement :** `index.html` et `sw.js` (`FILES`) correspondent exactement au manifeste : même liste de fichiers, même ordre.
5. **Une seule définition par nom global** (pas d'écrasement silencieux entre fichiers).

## 5. Exigences
- **Aucun changement fonctionnel.** `npm test` passe **à chaque étape** (chaque déplacement ou découpage est un commit vert).
- Le harnais de test charge les scripts **et les CSS** à partir du manifeste (plus de liste en dur).
- `README.md` (structure), `tech-stack.md` (architecture et règles) et `workflow.md` (où ajouter un monde, un mini-jeu, un compagnon) sont mis à jour.
- Une **checklist « ajouter un mini-jeu »** et une checklist **« ajouter une île »** sont écrites dans `conductor/`, pour les tracks suivantes.
- Le cache `sw.js` est incrémenté (les chemins changent).

## 6. Critères d'acceptation
1. Plus aucun fichier JS à la racine de `js/`, à part `slices.js`. Chaque fichier appartient à une slice du manifeste.
2. Le test de frontières passe et **échoue** si on ajoute un appel interdit (vérifié par un cas de test volontairement fautif).
3. `index.html` et `sw.js` correspondent au manifeste (vérifié par un test).
4. `styles.css` est découpé : chaque section de feature est dans sa slice, la cascade est identique (même ordre final).
5. `npm test` passe, sans aucune erreur JS. Parcours manuel complet identique à la v49 (carte, île, chaque mini-jeu, marché, histoire, sauvegarde).
6. Une sauvegarde v49 se charge à l'identique.

## 7. Hors périmètre
- Les modules ES, `import`/`export` et le bus d'événements (étape B).
- Les nouvelles fonctionnalités et les changements de design.
- Le renommage des fonctions publiques (seulement si un conflit de noms l'impose).
