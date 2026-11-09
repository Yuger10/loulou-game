/* ---------- Navigation par vues ----------
   Chaque feature inscrit le rendu de sa vue avec registerView(nom, rendu) ;
   switchView affiche la section puis appelle ces rendus. */
const viewRenderers = {};
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
}

/* ---------- Navigation ---------- */
document.querySelectorAll('.navbtn').forEach(btn=>{
  btn.addEventListener('click', ()=> { playSound('tap'); switchView(btn.dataset.view); });
});
