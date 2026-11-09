# Spec : Collection de squishies (v53)

> Idée de la joueuse principale : « un système de squishies qu'on range dans des boîtes ».
> Inspiré du phénomène réel des squishies (taba squishies, blind box, séries, raretés) : voir [`conductor/research-squishies.md`](../../research-squishies.md).

## 1. Vue d'ensemble
L'enfant gagne des **boîtes surprises** en jouant. En les ouvrant, elle découvre des **squishies** à collectionner, répartis en **séries** avec trois **raretés**. Elle les retrouve dans **« Ma chambre à squishies »** : elle peut les **presser**, les exposer sur une **étagère libre**, et remplir des **boîtes de rangement à consigne** (un tri par couleur, forme ou taille) qui rapportent des pièces. Ses **doubles** s'échangent au marché contre un squishy manquant de son choix.

Objectifs : donner envie de revenir chaque jour (motivation), donner un vrai usage aux pièces, et faire travailler le **tri et le classement** (logique, couleurs, formes, ensembles) sans que ça ressemble à un exercice.

## 2. Exigences fonctionnelles

### 2.1 Squishies, séries, raretés
- **3 séries au lancement**, de **6 modèles** chacune, soit 18 squishies :
  - **Capybaras** 🦫 : capy fraise, capy orange sur la tête, capy dodo, capy bain… ; rare : capy pyjama ; ✨ : capy doré
  - **Desserts** 🍩 : donut, mochi, cupcake, fraise, glace… ; rare : macaron ; ✨ : gâteau arc-en-ciel
  - **Animaux** 🐾 : chat, pingouin, lapin, panda… ; rare : grenouille ; ✨ : chat holographique
- Chaque série a **4 communs, 1 rare et 1 ✨ pailleté**.
- Chaque squishy a : un `id`, un nom court facile à dire, une série, une rareté, une **couleur dominante** (parmi les couleurs du mini-jeu Formes), une **forme** (rond, ovale, carré arrondi…) et une **taille** (petit ou grand). Ces trois attributs servent aux consignes de rangement.
- Dessin en **SVG** dans le style de `squishySVG` (`js/features/minigames/shapes/shapes.js`) : une forme douce, un reflet, un petit visage, plus un détail propre au modèle (oreilles, fraise, cornet…). Le ✨ a un effet de paillettes animé.
- **Extensible :** une série est une entrée de données. Les futurs mondes (Boîtes, Licornes) ajouteront chacun leur série sans toucher à la logique.

### 2.2 Gagner des boîtes surprises
- **Coffre des missions du jour :** il contient toujours **1 boîte surprise** en plus de sa récompense actuelle.
- **Boutique au marché :** une boîte coûte **15 pièces**, avec un maximum de **3 achats par jour et par joueur**. Quand la limite est atteinte, la boutique l'annonce avec douceur (« Reviens demain pour d'autres boîtes 🌙 »).
- **Énigmes d'histoire :** résoudre une énigme de chapitre donne **1 boîte de la série liée à l'île**, une seule fois par île, comme les pièces actuelles. Correspondance au lancement : Lagon, Forêt et Montagne → Animaux ; Château, Volcan et Pays Squishy → Desserts ; Jungle et Cité du Temps → Capybaras.
- **Rattrapage :** les joueurs qui ont déjà résolu des chapitres reçoivent, à la migration, une boîte par chapitre résolu, en attente d'ouverture (« Tu as des boîtes à ouvrir ! »).
- Les boîtes gagnées s'accumulent **non ouvertes**. Une pastille sur le bouton 🧸 indique combien il en reste à ouvrir.

### 2.3 Ouvrir une boîte (tirage doux)
- Raretés : **70 % commun, 25 % rare, 5 % ✨**. La série est celle de la boîte, ou une série au hasard pour une boîte « mystère » (coffre et boutique).
- **Filet de sécurité :** après **3 boîtes d'affilée sans nouveauté**, la suivante donne forcément un squishy **jamais obtenu**, s'il en reste un dans la série concernée, sinon dans n'importe quelle série. Une série complète ne compte pas dans le filet.
- **Animation :** la boîte tremble, s'ouvre, le squishy saute. La voix annonce son nom (« Un capy fraise ! »). Pour un rare, un confetti plus grand. Pour un ✨, une fête spéciale avec des paillettes et un son dédié. Un nouveau squishy affiche le badge « Nouveau ! ». Un double affiche « ×2 ».
- Compléter une série déclenche une fête, avec un bonus de pièces (**20 pièces**) et une annonce vocale.

### 2.4 Ma chambre à squishies
- On y accède par un **nouveau bouton 🧸 dans l'en-tête** (avec la pastille des boîtes non ouvertes), et par un **bouton depuis le Sac**.
- Il y a trois zones, en onglets à icône :
  1. **📚 Collection :** une rangée par série. Chaque modèle obtenu est dessiné avec son compteur (×N). Chaque modèle manquant apparaît en **silhouette grise**. Un indicateur affiche la progression (« 4 / 6 »). Les boîtes non ouvertes s'affichent en haut, avec un gros bouton « Ouvrir ! ».
  2. **🗄️ Étagère :** **12 emplacements libres**. On touche un squishy de sa collection, puis un emplacement pour l'y poser. Le même geste permet de le retirer. Elle est purement décorative et sauvegardée.
  3. **📦 Boîtes de rangement :** les boîtes à consigne (voir 2.6).
- **Presser :** toucher un squishy (dans la collection ou sur l'étagère) l'écrase puis le fait remonter lentement (environ 1,5 s), avec un « pouic » et une vibration courte. Il ne se passe rien d'autre et rien ne se perd.

### 2.5 Échanger ses doubles (marché)
- L'onglet **Échanger** du marché gagne une section « Mes doubles de squishies ».
- **3 doubles, quels qu'ils soient, donnent 1 squishy manquant au choix.** On choisit parmi les silhouettes de ses séries incomplètes. Un double est un exemplaire au-delà du premier.
- Si aucun squishy ne manque, la section l'explique avec douceur. S'il manque des doubles, la section indique combien il en faut encore (« Encore 2 doubles »).

### 2.6 Boîtes de rangement à consigne (tri éducatif)
- Une boîte de rangement affiche sa **consigne en image et à voix haute** (exemples : une pastille rose pour « que des roses », une forme ronde pour « que des ronds », un petit point pour « que des petits »).
- L'enfant touche les squishies **de sa collection** qui respectent la consigne pour remplir la boîte, avec **4 cases** à remplir.
- Les choix proposés sont **8 squishies tirés de sa collection**. Il y en a au moins 4 qui respectent la consigne et au moins 2 qui ne la respectent pas. La consigne est choisie parmi celles que sa collection permet de réussir. Si la collection est trop petite (moins de 6 modèles différents), la zone l'explique et propose d'ouvrir des boîtes.
- **Difficulté selon l'âge du profil :**
  - moins de 6 ans ou sans âge : **un critère, couleur**
  - de 6 à 7 ans : **un critère**, couleur, forme ou taille
  - 8 ans et plus : **deux critères** (« rose ET rond »)
- **Anti-devinette :** un squishy qui ne respecte pas la consigne rebondit et revient, avec un indice parlé (« Lui, il est bleu. On cherche des roses ! »). Après **2 erreurs**, la boîte est relancée avec une **autre consigne** (même principe que `scheduleRetry`, avec une relance annulable).
- **Récompense :** une boîte bien remplie rapporte **5 pièces** et s'ajoute aux « boîtes rangées » (un compteur et une petite pile visible). Les **3 premières boîtes par jour** sont récompensées. Au-delà, on peut continuer pour le plaisir, sans pièces.
- Ranger n'enlève rien à la collection : les squishies sont « rangés » symboliquement.
- **Espace parents (v41) :** les boîtes de rangement sont comptées comme une activité de la compétence « mémoire et logique » (`skills.rangement` : réussites, erreurs), et leur consigne suit aussi le niveau adaptatif (v42) en plus de l'âge, sans jamais dépasser le plafond de l'âge.

## 3. Exigences non fonctionnelles
- **Enfant d'abord** (`product-guidelines.md`) : aucun texte nécessaire à lire, tout est lu à voix haute, gros boutons, aucune perte.
- **Sauvegarde :** `SAVE_VERSION` +1 (5 si la v52 des compagnons est passée à 4). Il y a un nouvel état `squishies` (squishies possédés et compteurs, boîtes non ouvertes avec leur série, étagère, compteur du filet de sécurité, achats et rangements du jour) et une étape de migration qui crée les boîtes de rattrapage. La sauvegarde et le code de transfert (`js/features/backup/backup.js`) emportent tout.
- **Multijoueur :** la collection est **par profil**.
- **Mobile :** la chambre tient dans la fenêtre modale existante, défile verticalement, et ne déborde pas à 360 px de large.
- **Performance :** 18 dessins SVG légers, aucune image externe. Les nouveaux fichiers JS sont ajoutés au cache `sw.js`.

## 4. Critères d'acceptation
1. Ouvrir le coffre du jour ajoute 1 boîte non ouverte et la pastille 🧸 l'affiche.
2. Acheter une boîte au marché coûte 15 pièces. Le 4ᵉ achat du jour est refusé avec un message doux. Le compteur se remet à zéro le lendemain.
3. Résoudre une énigme d'histoire donne une boîte de la série de l'île. Une partie migrée depuis la version précédente avec N chapitres résolus reçoit N boîtes.
4. Ouvrir une boîte ajoute exactement un squishy de la bonne série et respecte le filet de sécurité : après 3 doubles d'affilée, la 4ᵉ boîte est nouvelle.
5. La collection montre les silhouettes des manquants et la progression par série. Compléter une série rapporte 20 pièces, une seule fois.
6. L'étagère enregistre ses 12 emplacements et les retrouve après rechargement.
7. Presser un squishy joue l'animation et le son, sans changer l'état.
8. 3 doubles s'échangent contre le squishy manquant choisi. Le bouton est inactif s'il manque des doubles.
9. Une boîte de rangement ne propose que des consignes réalisables, refuse un mauvais squishy avec un indice, se relance avec une autre consigne après 2 erreurs, et rapporte 5 pièces (3 fois par jour maximum).
10. La consigne suit l'âge du profil (un critère couleur, puis un critère au choix, puis deux critères).
11. Sauvegarde et restauration (fichier ou code) conservent toute la collection.
12. `npm test` passe, sans aucune erreur JS.

## 5. Hors périmètre
- Les séries Licornes et Boîtes, qui arriveront avec leurs tracks respectives.
- L'échange de squishies **entre profils** (entre frère et sœur). C'est une bonne idée pour plus tard.
- Faire glisser les squishies : on touche, on ne fait pas glisser. C'est plus fiable au doigt, sur tous les appareils.
- Le retrait d'un squishy de la collection (vente). Un squishy ne se vend pas, il se garde ou s'échange en double.
- L'achat avec de l'argent réel, sous quelque forme que ce soit.
