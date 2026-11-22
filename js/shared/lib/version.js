/* ---------- La version du jeu : 66.1, 66.2… puis 67 ----------
   - APP_VERSION augmente quand une track de contenu est livrée (une île, une
     fonctionnalité) ; APP_PATCH revient alors à 0.
   - APP_PATCH augmente pour une livraison sans track : outillage, corrections,
     nettoyages (version affichée 66.1, 66.2…).
   `bun run sync` écrit APP_LABEL dans le cache du service worker
   (sw.js : `lagon-v66.1`), et l'espace parents l'affiche.
   test/update.test.js vérifie que sw.js et ce fichier disent la même chose. */
const APP_VERSION = 66;
const APP_PATCH = 3;
const APP_LABEL = APP_PATCH ? `${APP_VERSION}.${APP_PATCH}` : String(APP_VERSION);

// « 66 », « 66.1 » ou « lagon-v66.1 » → un nombre à comparer (66.1 → 66001) ;
// 0 si ce n'est pas une version
function versionBuild(label) {
  const m = /(\d+)(?:\.(\d+))?$/.exec(String(label ?? ''));
  return m ? Number(m[1]) * 1000 + Number(m[2] || 0) : 0;
}

export { APP_LABEL, APP_PATCH, APP_VERSION, versionBuild };
