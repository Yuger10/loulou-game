/* Les personnages de la saison 3 « La Grande Expédition » : vide tant qu'aucune
   île n'est livrée. Chaque île y ajoute ses personnages ; characters.js (au
   plafond de 800 lignes) les étale à la fin de CHARACTERS. */

/** @type {Record<string, import('./characters.js').Character>} */
const CHARACTERS_S3 = {};

export { CHARACTERS_S3 };
