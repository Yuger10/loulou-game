/* ---------- La version du jeu ----------
   Un seul endroit pour le numéro de version. `npm run sync` l'écrit dans le
   cache du service worker (sw.js : `lagon-vNN`), et l'espace parents l'affiche.
   À chaque livraison : on augmente ce numéro, puis `npm run sync`.
   test/update.test.js vérifie que sw.js et ce fichier disent la même chose. */
const APP_VERSION = 66;

export { APP_VERSION };
