/* ---------- Modèle de formulaire commun ----------
   Un formulaire dans la fenêtre modale a toujours la même forme :
     - un en-tête fixe : le titre et une ✕ ;
     - un contenu qui défile, en sections titrées ;
     - une barre d'actions fixe en bas, toujours visible, à portée du pouce :
       l'action secondaire à gauche (Retour, Annuler), la principale à droite
       (Enregistrer ✅).
   formSheet(...) donne le HTML ; bindForm(...) branche le comportement :
     - l'action principale est désactivée tant qu'un champ obligatoire manque
       (toucher explique ce qui manque, à voix haute) ; « Entrée » valide ;
     - fermer après un changement (✕, Retour, poignée, toucher à côté, Échap)
       demande « Garder tes changements ? ». Sans changement, on ferme.
   `shared` ne connaît pas le jeu : textes et actions sont passés en paramètres. */
import { askConfirm } from './confirm.js';
import { closeModal, requestCloseModal, setModalCloseGuard } from './modal.js';
import { playSound } from './sound.js';
import { speak } from './voice.js';
import { setHandler } from './handlers.js';

/** @typedef {{ title?: string, html: string }} FormSection */
/**
 * @typedef {object} FormSheetOptions
 * @property {string} title
 * @property {FormSection[]} [sections]
 * @property {string} [primary]
 * @property {string} [secondary]
 */

// sections : [{ title, html }] (une section sans titre : { html })
/** @param {FormSheetOptions} options */
function formSheet({ title, sections, primary, secondary }) {
  const body = (sections || [])
    .map((s) =>
      s.title
        ? `<section class="form-section"><h3 class="form-section-title">${s.title}</h3>${s.html}</section>`
        : s.html,
    )
    .join('');
  return `
    <div class="form-sheet">
      <header class="form-head">
        <h2>${title}</h2>
        <button type="button" class="form-close" aria-label="Fermer">✕</button>
      </header>
      <div class="form-body">${body}</div>
      <footer class="form-actions">
        <button type="button" class="form-secondary">${secondary || 'Retour'}</button>
        <button type="button" class="form-primary">${primary || 'Enregistrer ✅'}</button>
      </footer>
    </div>`;
}

/* initial  : l'état de départ (instantané sérialisable), pris UNE fois avant le premier affichage
   current  : () => l'état actuel, même forme que `initial`
   required : [{ value: () => texte, say: 'ce qui manque', focus: () => élément }]
   onSave   : enregistre et passe à la suite (renvoie false pour rester)
   onCancel : où aller après « Retour » sans enregistrer (par défaut : fermer) */
/**
 * @typedef {object} FormRequirement
 * @property {() => unknown} value
 * @property {string} say
 * @property {() => HTMLElement | null | undefined} [focus]
 */
/**
 * @typedef {object} FormBinding
 * @property {unknown} initial
 * @property {() => unknown} current
 * @property {FormRequirement[]} [required]
 * @property {() => unknown} onSave
 * @property {() => void} [onCancel]
 */
/** @param {FormBinding} binding */
function bindForm({ initial, current, required, onSave, onCancel }) {
  const root = document.getElementById('modal');
  if (!root) return;
  root.classList.add('has-form');
  // la fenêtre contient un formSheet : ses trois boutons sont là
  const primary = /** @type {HTMLElement} */ (root.querySelector('.form-primary'));
  const secondary = /** @type {HTMLElement} */ (root.querySelector('.form-secondary'));
  const closeBtn = /** @type {HTMLElement} */ (root.querySelector('.form-close'));
  const fields = [...root.querySelectorAll('.form-body input, .form-body select, .form-body textarea')];
  const missing = () => (required || []).find((r) => !String(r.value() || '').trim());
  const refresh = () => primary.setAttribute('aria-disabled', missing() ? 'true' : 'false');
  const dirty = () => JSON.stringify(current()) !== JSON.stringify(initial);
  const leave = onCancel || (() => closeModal());

  function save() {
    const m = missing();
    if (m) {
      playSound('tap');
      speak(m.say);
      const el = m.focus && m.focus();
      if (el) {
        el.classList.add('form-missing');
        el.focus();
      }
      return false;
    }
    return onSave() !== false;
  }
  // « Garder tes changements ? » : garder = enregistrer ; ne pas garder = partir ;
  // ne rien choisir (Échap, toucher à côté) = rester dans le formulaire
  /** @param {() => void} after */
  function askKeep(after) {
    askConfirm({
      text: 'Garder tes changements ?',
      confirmLabel: '✅ Garder',
      cancelLabel: '↩️ Ne pas garder',
      danger: false,
      primaryYes: true,
      dismissValue: null,
    }).then((keep) => {
      if (keep === true) save();
      else if (keep === false) after();
    });
    return false;
  }

  refresh();
  fields.forEach((el) => {
    el.addEventListener('input', () => {
      el.classList.remove('form-missing');
      refresh();
    });
    el.addEventListener('change', refresh);
    // le champ actif reste visible au-dessus du clavier et de la barre d'actions
    el.addEventListener('focus', () => {
      try {
        el.scrollIntoView({ block: 'center' });
      } catch {
        // vieux navigateurs sans scrollIntoView : le champ reste accessible
      }
    });
    if (el.tagName === 'INPUT')
      el.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          save();
        }
      });
  });
  setHandler(primary, 'click', () => {
    playSound('tap');
    save();
  });
  setHandler(secondary, 'click', () => {
    playSound('tap');
    if (dirty()) askKeep(leave);
    else leave();
  });
  setHandler(closeBtn, 'click', () => {
    playSound('tap');
    requestCloseModal();
  });
  setModalCloseGuard(() => (dirty() ? askKeep(() => closeModal()) : true));
}

export { bindForm, formSheet };
