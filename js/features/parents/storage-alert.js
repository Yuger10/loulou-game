/* ---------- Un enregistrement raté ne passe pas inaperçu ----------
   storageWrite (js/shared/lib/storage.js) émet 'storage:error' quand la partie
   ne peut pas être enregistrée (mémoire pleine, navigation privée).
   - L'enfant : un message doux, lu à voix haute, une seule fois par session
     (inutile de répéter à chaque sauvegarde ratée).
   - Les parents : une carte « Enregistrement » dans leur espace, avec la
     cause et le conseil (faire une sauvegarde, libérer de la place). */
import { on, storageErrors } from '../../shared/lib/index.js';
import { showToast, speak } from '../../shared/ui/index.js';

const CHILD_MESSAGE = "La partie n'a pas pu être enregistrée. Demande à un adulte.";
let warned = false;

on('storage:error', () => {
  if (warned) return;
  warned = true;
  showToast('⚠️ ' + CHILD_MESSAGE);
  speak(CHILD_MESSAGE);
});

on('parents:cards', () => {
  const errs = storageErrors();
  if (!errs.length) return '';
  const time = (iso) => new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  return `<section class="bk-card ps-storage"><h3>⚠️ Enregistrement</h3>
    <p>La partie n'a pas pu être enregistrée ${errs.length} fois pendant cette session : ce qui a été gagné depuis peut être perdu.</p>
    <ul>${errs
      .slice(-5)
      .map((e) => `<li><strong>${time(e.at)}</strong> · ${e.op} · ${e.cause}</li>`)
      .join('')}</ul>
    <p>Conseil : faites une sauvegarde (💾 dans le panneau des joueurs), libérez de la place sur l'appareil, et évitez la navigation privée.</p>
  </section>`;
});
