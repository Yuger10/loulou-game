/* ---------- Fenêtre de confirmation du jeu ----------
   Remplace les boîtes confirm() du navigateur, peu lisibles et que la voix ne
   lit pas. Elle s'ouvre PAR-DESSUS la fenêtre en cours (sans l'effacer), lit
   la question à voix haute, et met en avant le choix prudent.

   askConfirm({ text, confirmLabel, cancelLabel, danger, typeWord })
     → Promise<boolean>
   - danger (par défaut true) : bouton de confirmation rouge, « Annuler » mis
     en avant comme action principale ;
   - typeWord : double confirmation, il faut taper ce mot (sans tenir compte
     des majuscules) pour que le bouton s'active ;
   - Échap ou toucher à côté : `dismissValue` (false par défaut ; null pour
     « Garder tes changements ? », où ne rien choisir ramène au formulaire) ;
   - primaryYes : le « oui » est l'action principale (bouton mis en avant). */
import { speak } from './voice.js';

let confirmClose = null;

function askConfirm(opts){
  const o = Object.assign({ text:'', confirmLabel:'Oui', cancelLabel:'Annuler', danger:true, typeWord:'', dismissValue:false, primaryYes:false }, opts || {});
  if(confirmClose) confirmClose(null);
  let el = document.getElementById('confirm-layer');
  if(!el){
    el = document.createElement('div');
    el.id = 'confirm-layer';
    document.body.appendChild(el);
  }
  const word = String(o.typeWord || '').trim();
  el.innerHTML = `
    <div class="confirm-box" role="alertdialog" aria-modal="true" aria-labelledby="confirm-text">
      <p id="confirm-text" class="confirm-text">${o.text}</p>
      ${word ? `<label class="confirm-type">Pour confirmer, écris <strong>${word}</strong>
        <input id="confirm-input" type="text" autocomplete="off" autocapitalize="characters" autocorrect="off" spellcheck="false" enterkeyhint="done"></label>` : ''}
      <div class="confirm-actions">
        <button type="button" class="${o.primaryYes ? 'form-primary' : o.danger ? 'danger' : 'form-secondary'}" data-confirm="yes">${o.confirmLabel}</button>
        <button type="button" class="${o.primaryYes ? 'form-secondary' : 'form-primary'}" data-confirm="no">${o.cancelLabel}</button>
      </div>
    </div>`;
  el.hidden = false;
  speak(String(o.text).replace(/<[^>]+>/g, ''));
  const yes = el.querySelector('[data-confirm="yes"]'), no = el.querySelector('[data-confirm="no"]');
  const input = el.querySelector('#confirm-input');
  const typed = ()=> !word || (input && input.value.trim().toLowerCase() === word.toLowerCase());
  const refresh = ()=> yes.setAttribute('aria-disabled', typed() ? 'false' : 'true');
  refresh();
  return new Promise(resolve=>{
    const onKey = (e)=>{
      if(e.key === 'Escape'){ e.stopImmediatePropagation(); e.preventDefault(); close(o.dismissValue); }
      else if(e.key === 'Enter' && e.target === input && typed()){ e.preventDefault(); close(true); }
    };
    function close(result){
      document.removeEventListener('keydown', onKey, true);
      el.hidden = true; el.innerHTML = '';
      confirmClose = null;
      resolve(result);
    }
    confirmClose = close;
    document.addEventListener('keydown', onKey, true);   // avant la fenêtre derrière (qui fermerait sur Échap)
    if(input){ input.addEventListener('input', refresh); setTimeout(()=> input.focus(), 0); }
    else setTimeout(()=> no.focus(), 0);
    yes.onclick = ()=>{
      if(!typed()){ speak(`Pour confirmer, écris ${word}.`); input && input.focus(); return; }
      close(true);
    };
    no.onclick = ()=> close(false);
    el.onclick = (e)=>{ if(e.target === el) close(o.dismissValue); };
  });
}

export { askConfirm };
