# Plan : Une pause qui tient, et des activités pour bouger

Spec : [spec.md](./spec.md). Workflow : [workflow.md](../../workflow.md).
> **Architecture (feature slices v51, modules ES v54) :** nouvelle slice `features/rest/` avec son `index.js`, déclarée dans `js/slices.cjs`, puis `npm run sync`. Pas de cycle d'import : les features qui doivent consulter la pause passent par un point d'accroche.
> **Numéro de version :** attribué à la livraison (le suivant sur `main`).

## Phase 1 : Le verrou
> Phases 1 à 5 implémentées d'un seul tenant : `test/rest.test.js` (56 tests). Vérification manuelle regroupée (essai réel avec l'enfant).
> **Écarts assumés :**
> - Le voile couvre tout (y compris les Réglages) : l'enfant ne peut plus atteindre « changer de joueur », « créer un joueur » ou « jouer à plusieurs » ; seul l'adulte (menu du voile → « Changer de joueur ») le fait. Pas besoin de garde séparé sur ces actions.
> - Les **tentatives** notées sont les mauvaises réponses à la question des adultes pendant la pause.
> - Les anciens tests de l'écran de pause (fenêtre « D'accord 😴 ») et « jamais en mode à plusieurs » sont remplacés par le voile et « aussi en mode à plusieurs ».
- [x] Task: Tests d'abord (`test/rest.test.js`)
    - [x] Limite atteinte : voile sur tout ; clics sans effet sur carte, île, sac, marché, chambre, en-tête ; recharger et changer de vue ne le lèvent pas ; mini-jeu en cours terminé d'abord ; aucun nouveau mini-jeu
- [x] Task: Slice `features/rest` : le voile flouté
    - [x] Voile plein écran (`role="dialog"`, `aria-modal`, contenu en dessous `inert`, focus piégé) ; montré au chargement, au retour dans l'application, au changement de vue, et par la minuterie de temps de jeu
    - [x] Fin naturelle : `game:after` (fin de mission) déclenche le voile si la limite est atteinte
- [x] Task: Lever le voile (adulte)
    - [x] Tests : porte des parents, puis « + 10 min », « + 30 min », « fin de la pause aujourd'hui » ; le lendemain, plus de voile
- [ ] Task: Conductor - User Manual Verification 'Le verrou' (Protocol in workflow.md)

## Phase 2 : Plus de portes de sortie
- [x] Task: Changer, créer, jouer à plusieurs
    - [x] Tests : pendant la pause, ces trois actions demandent la porte des parents et notent la tentative ; en mode à plusieurs, la pause s'applique à la fin de la mission
    - [x] Point d'accroche « une action demande-t-elle un adulte ? » consulté par `players`, `party`, `settings`
- [x] Task: Réglage familial
    - [x] Tests : un nouveau joueur reçoit la dernière durée de pause choisie par un adulte ; réglage visible dans l'espace parents ; migration
- [ ] Task: Conductor - User Manual Verification 'Plus de portes de sortie' (Protocol in workflow.md)

## Phase 3 : L'île s'endort
- [x] Task: Bâillement avant la limite
    - [x] Tests : environ 5 min avant la limite, le compagnon de l'en-tête bâille ; aucun chiffre ni compte à rebours affiché
- [x] Task: Animation du compagnon fatigué et de la nuit
    - [x] Tests : séquence (bâille, bonnet, se roule en boule, zzz ; nuit, étoiles ; flou) ; phrase parlée accordée ; mouvement réduit = fondu simple
    - [x] SVG et CSS (humeurs existantes `sleepy` des compagnons, bonnet de nuit)
- [ ] Task: Conductor - User Manual Verification "L'île s'endort" (Protocol in workflow.md)

## Phase 4 : Une activité au choix
- [x] Task: Les 4 cartes et le déroulé
    - [x] Tests : 4 cartes lues à voix haute ; une seule activité par pause ; « Pas maintenant » endort l'écran ; à la fin « Bravo ! À demain ! » puis écran endormi (seul « Un adulte » reste)
- [x] Task: 🤸 Bouger comme les animaux et 🧘 Yoga des animaux
    - [x] 3 mouvements et 3 postures dessinés avec les personnages et compagnons, guidés par la voix, rythme visuel sans chiffres ; consignes de sécurité
- [x] Task: 🌬️ Respirer avec Grisou et 🎨 Une idée hors écran
    - [x] Grisou qui gonfle et se dégonfle 5 fois (`grisouSVG`) ; une idée tirée parmi la liste, puis l'écran s'endort
- [ ] Task: Conductor - User Manual Verification 'Une activité au choix' (Protocol in workflow.md)

## Phase 5 : Le lendemain et les parents
- [x] Task: Le compagnon se souvient
    - [x] Tests : premier lancement du lendemain, phrase sur l'activité de la veille
- [x] Task: Journal de pause dans l'espace parents
    - [x] Tests : `restLog` (heure, activité ou passée, tentatives) sur 7 jours ; `SAVE_VERSION` +1 et migration ; conseil sur les contrôles de l'appareil (Temps d'écran, Family Link)
- [ ] Task: Conductor - User Manual Verification 'Le lendemain et les parents' (Protocol in workflow.md)

## Phase 6 : Livraison
- [ ] Task: Docs et intégration
    - [ ] Numéro de version attribué à la livraison ; PRD (avec les sources de la recherche), TODO, tech-stack, cache `sw.js`, `npm run sync`
- [ ] Task: Vérification complète
    - [ ] `npm test` vert ; essai réel avec l'enfant : arriver à la limite, essayer de contourner, choisir une activité
- [ ] Task: Conductor - User Manual Verification 'Livraison' (Protocol in workflow.md)
- [ ] Task: Branche, PR sur `main` (merge sur ordre du propriétaire)
