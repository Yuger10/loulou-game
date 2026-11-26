/* ---------- La carte « Voix » de l'espace parents (track voix-naturelle) ----------
   Les phrases fixes du jeu sont dites par une voix de synthèse générée à
   l'avance (ADR 0007). Les parents le lisent ici (le service demande de dire
   que la voix est artificielle), avec l'état des clips disponibles sans
   Internet. Tant qu'aucun clip n'est livré (VOICE_SERVICE vide), pas de carte. */
import { on } from '../../shared/lib/index.js';
import { VOICE_SERVICE, voiceOfflineState } from '../../shared/ui/index.js';

// la ligne d'état : la première qui s'applique
/** @returns {string} */
function voiceOfflineLine() {
  const s = voiceOfflineState();
  if (s.full)
    return "L'appareil n'a plus de place pour les voix : sans Internet, certaines phrases utilisent la voix de l'appareil.";
  if (s.cached === null) return 'Voix disponibles sans Internet : vérification en cours.';
  if (s.cached === s.total) return 'Toutes les voix sont disponibles sans Internet.';
  const count = `Voix disponibles sans Internet : ${s.cached} sur ${s.total}.`;
  if (s.offline) return count + ' Le reste se téléchargera avec Internet.';
  if (s.saveData) return count + ' Téléchargement en pause (économie de données).';
  return count;
}

on(
  'parents:cards',
  /** @returns {string} */
  () => {
    if (!VOICE_SERVICE) return '';
    return `<section class="bk-card ps-voice"><h3>🗣️ Voix</h3>
    <p>La voix du jeu est une voix de synthèse, créée par ordinateur (${VOICE_SERVICE}), et non la voix d'une vraie personne. Les phrases qui contiennent le prénom ou un nombre sont dites par la voix de l'appareil.</p>
    <p>${voiceOfflineLine()}</p>
  </section>`;
  },
);
