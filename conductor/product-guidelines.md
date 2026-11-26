# Product Guidelines

## Pour l'enfant
- **Très peu de texte, et une voix partout.** Toucher un texte le lit ; toucher un bouton l'actionne et dit son libellé ; un 🔈 accolé fait écouter sans agir là où il faut entendre avant de choisir ; un bouton inactif dit pourquoi. Ni appui long, ni mode « écoute », ni double toucher. Chaque écran se présente par une ou deux phrases (titre ou consigne), le reste s'écoute à la demande : on ne noie pas l'enfant sous la voix. Les choix de réponse sont des emojis ou des dessins ; un choix écrit (une heure, un jour, une forme) est lu après la consigne ; seuls les mini-jeux de lecture gardent des mots à lire, que la voix ne dit jamais avant la réponse. Détail et garde : track `voix-partout`, `test/voix-partout.test.js`.
- **Phrases courtes,** au présent, en tutoyant, sur un ton chaleureux. Le prénom de l'enfant est utilisé quand on le connaît (`hello()`).
- **Pas de game over, pas de punition.** Un échec mène à réessayer, avec un indice parlé. On ne perd jamais ce qu'on a gagné.
- **Anti-devinette.** Quand il y a peu de choix et pas de limite d'essais, une mauvaise réponse relance une autre question au lieu de laisser deviner par élimination.
- **Adapté à l'âge.** La difficulté dépend de l'île (paliers 1 à 6) et de l'âge du profil. Pas de minuteur avant le CP.
- **Surprise et collection, sans manipulation.** Les récompenses se gagnent en jouant, jamais avec de l'argent réel. Pas de compte à rebours anxiogène, pas de « dernière chance », pas de boucle sans fin de tirages : les mécaniques de hasard restent bornées et bienveillantes.
- **Égalité filles et garçons.** Les personnages et compagnons sont présentés en mettant en avant le même genre que le joueur, sans rien exclure.

## Visuel
- Mobile-first : boutons d'au moins 64 px environ, rien au survol, tout se fait au doigt.
- Style doux et coloré : pastels, coins arrondis, ombres légères, emojis et SVG dessinés à la main (pas d'images externes).
- Chaque monde a son thème de couleurs (`--world-*`) et sa forme d'île.
- Les animations (confettis, rebonds) célèbrent sans gêner. Il y a des sons et des vibrations courtes.

## Écriture du contenu
- Les noms de personnages sont faciles à dire et à mémoriser (Marina, Mimi, Zap…), avec un « titre » descriptif (« la chatte mochi »).
- Chaque nouveau monde apporte : des personnages avec leur butin, des objets, des décorations, des recettes de fusion, un chapitre d'histoire avec au moins 2 énigmes, et un mini-jeu favori.
- Les idées viennent des enfants : quand une fonctionnalité vient d'eux, on le garde visible dans le PRD.
