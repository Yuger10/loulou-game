/* ---------- Écrire dans le stockage de l'appareil ----------
   Toutes les écritures du jeu (partie, profils, sauvegardes) passent par
   storageWrite et storageRemove : oxlint interdit localStorage.setItem et
   storageRemove ailleurs dans js/. Une écriture peut échouer (mémoire pleine,
   navigation privée de Safari) : elle renvoie alors false, l'échec est noté
   (storageErrors) et l'événement 'storage:error' prévient l'interface
   (message à l'enfant, carte dans l'espace parents : features/parents). */
import { emit } from './events.js';

/** @typedef {{ at: string, op: string, key: string, cause: string }} StorageError */
/** @type {StorageError[]} */
const errors = []; // les échecs de cette session, du plus ancien au plus récent

/** @param {unknown} thrown l'erreur attrapée (n'importe quoi peut être lancé) */
function causeOf(thrown) {
  const e = /** @type {{ name?: unknown, code?: unknown } | null | undefined} */ (thrown);
  if (e && (e.name === 'QuotaExceededError' || e.code === 22)) return 'mémoire pleine';
  if (e && e.name === 'SecurityError') return 'stockage bloqué (navigation privée ?)';
  return 'erreur inconnue';
}
/**
 * @param {string} op
 * @param {string} key
 * @param {unknown} e
 * @param {string} [cause]
 * @returns {false}
 */
function fail(op, key, e, cause = causeOf(e)) {
  /** @type {StorageError} */
  const err = { at: new Date().toISOString(), op, key, cause };
  errors.push(err);
  if (errors.length > 20) errors.shift();
  emit('storage:error', err);
  return false;
}

/**
 * @param {string} key
 * @param {string} value
 * @returns {boolean} false si l'écriture a échoué
 */
function storageWrite(key, value) {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (e) {
    return fail('écriture', key, e);
  }
}
/**
 * @param {string} key
 * @returns {boolean} false si la suppression a échoué
 */
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
/**
 * @param {string} key
 * @param {unknown} e
 */
function reportUnreadable(key, e) {
  return fail('lecture', key, e, 'sauvegarde illisible : la partie repart de zéro');
}
/** @returns {StorageError[]} */
function storageErrors() {
  return errors.slice();
}

export { reportUnreadable, storageErrors, storageRemove, storageWrite };
