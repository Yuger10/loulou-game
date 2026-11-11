/* ---------- Navigation par vues ----------
   Chaque feature inscrit le rendu de sa vue avec registerView(nom, rendu) ;
   switchView affiche la section puis appelle ces rendus. */
import { playSound } from './sound.js';

const viewRenderers = {};
// fonctions appelées à chaque changement de vue (par exemple : la pause revient)
const viewChangeHooks = [];
function onViewChange(fn){ viewChangeHooks.push(fn); }
function registerView(name, fn){ (viewRenderers[name] = viewRenderers[name] || []).push(fn); }

let currentView = 'carte';

function switchView(name){
  // alias pratiques
  if(name==='lagon') name = 'ile';
  let sacTab = null;
  if(name==='album'){ name = 'sac'; sacTab = 'album'; }

  const sec = document.getElementById('view-'+name);
  if(!sec) return;
  currentView = name;
  document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));
  sec.classList.add('active');
  document.querySelectorAll('.navbtn').forEach(b=>b.classList.toggle('active', b.dataset.view===name));
  // remonte en haut de la vue (sans dépendre de window.scrollTo, absent de certains environnements)
  try{
    if(document.scrollingElement) document.scrollingElement.scrollTop = 0;
    else document.documentElement.scrollTop = 0;
  }catch(e){}

  (viewRenderers[name] || []).forEach(fn=> fn({ sacTab }));
  viewChangeHooks.forEach(fn=> fn(name));
}

/* ---------- Navigation ---------- */
document.querySelectorAll('.navbtn').forEach(btn=>{
  btn.addEventListener('click', ()=> { playSound('tap'); switchView(btn.dataset.view); });
});

// Le libellé d'un bouton de la barre du bas, donné par la feature concernée
// (par exemple le bouton Île affiche l'île courante : 🌲 Forêt). `shared` ne
// connaît pas les îles : on lui passe l'icône et le texte. `iconKey` garde la
// marque des icônes dessinées (data-ui-icon, js/shared/ui/icons.js).
function setNavLabel(view, icon, label, iconKey){
  const b = document.querySelector(`.navbtn[data-view="${view}"]`);
  if(!b) return;
  const badge = b.querySelector('.badge');
  b.innerHTML = `<span class="icon" aria-hidden="true"${iconKey ? ` data-ui-icon="${iconKey}"` : ''}>${icon}</span><span class="nav-label">${label}</span>`;
  if(badge) b.appendChild(badge);
  b.setAttribute('aria-label', label);
}

export { registerView, switchView, setNavLabel, onViewChange };
