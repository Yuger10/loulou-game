/* ---------- Textes saisis ou importés ----------
   Un prénom vient de l'enfant (clavier) ou d'un fichier de sauvegarde
   importé (entrée non fiable), puis il est inséré tel quel dans des
   templates HTML partout dans le jeu. cleanName() le rend inoffensif une
   fois pour toutes, à chacune de ses portes d'entrée (saisie, renommage,
   chargement, import) : sans balise, sans < > & ", 12 caractères au plus.
   Vérifié par test/prenoms.test.js (dont un garde : aucun prénom de joueur
   affecté sans cleanName). */
const NAME_MAX = 12;

// un caractère de contrôle (saut de ligne, tabulation…) n'a rien à faire dans un prénom
const isControl = (/** @type {string} */ ch) => ch.charCodeAt(0) < 32 || ch.charCodeAt(0) === 127;

/**
 * @param {unknown} s
 * @returns {string}
 */
export function cleanName(s) {
  const noTags = String(s ?? '').replace(/<[^>]*>/g, ''); // balises entières
  return [...noTags]
    .filter((ch) => !isControl(ch) && !'<>&"'.includes(ch)) // restes et caractères de contrôle
    .join('')
    .trim()
    .slice(0, NAME_MAX)
    .trim();
}
