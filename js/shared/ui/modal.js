/* ---------- Fenêtre modale ----------
   `shared` ne connaît pas les features : celles qui doivent réagir à
   l'ouverture ou à la fermeture d'une fenêtre (minuteur, relances
   anti-devinette, gains en attente…) s'inscrivent ici. */
const modalOpenHooks = [], modalCloseHooks = [];
function onModalOpen(fn){ modalOpenHooks.push(fn); }
function onModalClose(fn){ modalCloseHooks.push(fn); }
// raccourci : la même fonction à l'ouverture et à la fermeture
function onModalChange(fn){ onModalOpen(fn); onModalClose(fn); }

function openModal(html){
  // tout nouveau contenu invalide ce qui dépendait de l'ancien : minuteur de
  // défi, relance programmée après une erreur (anti-devinette), gains en
  // attente… Chaque feature concernée s'inscrit avec onModalOpen.
  modalOpenHooks.forEach(fn=> fn());
  const body = document.getElementById('modal-body') || document.getElementById('modal');
  body.innerHTML = html;
  const ov = document.getElementById('overlay');
  ov.classList.add('show');
  document.body.classList.add('modal-open');
  // la fenêtre repart toujours du haut
  const m = document.getElementById('modal');
  if(m) m.scrollTop = 0;
}

function closeModal(){
  modalCloseHooks.forEach(fn=> fn());
  document.getElementById('overlay').classList.remove('show');
  document.body.classList.remove('modal-open');
  if(window.speechSynthesis) speechSynthesis.cancel();
}
