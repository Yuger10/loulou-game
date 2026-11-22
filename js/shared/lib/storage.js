/* ---------- Écrire dans le stockage de l'appareil ----------
   Toutes les écritures du jeu (partie, profils, sauvegardes) passent par
   storageWrite et storageRemove : oxlint interdit localStorage.setItem et
   storageRemove ailleurs dans js/. Une écriture peut échouer (mémoire pleine,
   navigation privée de Safari) : elle renvoie alors false, l'échec est noté
   (storageErrors) et l'événement 'storage:error' prévient l'interface
   (message à l'enfant, carte dans l'espace parents : features/parents). */
import { emit } from './events.js';

const errors = []; // les échecs de cette session, du plus ancien au plus récent

function causeOf(e) {
  if (e && (e.name === 'QuotaExceededError' || e.code === 22)) return 'mémoire pleine';
  if (e && e.name === 'SecurityError') return 'stockage bloqué (navigation privée ?)';
  return 'erreur inconnue';
}
function fail(op, key, e, cause = causeOf(e)) {
  const err = { at: new Date().toISOString(), op, key, cause };
  errors.push(err);
  if (errors.length > 20) errors.shift();
  emit('storage:error', err);
  return false;
}

function storageWrite(key, value) {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (e) {
    return fail('écriture', key, e);
  }
}
function storageRemove(key) {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (e) {
    return fail('suppression', key, e);
  }
}
// une partie enregistrée qu'on ne peut pas relire (abîmée) : signalée comme un
// échec d'écriture (message à l'enfant, carte dans l'espace parents)
function reportUnreadable(key, e) {
  return fail('lecture', key, e, 'sauvegarde illisible : la partie repart de zéro');
}
function storageErrors() {
  return errors.slice();
}

export { reportUnreadable, storageErrors, storageRemove, storageWrite };
