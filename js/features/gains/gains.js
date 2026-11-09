/* ---------- Animations de gain ----------
   Ce que l'on gagne se VOIT arriver : l'objet vole jusqu'au sac, les pièces
   tombent une à une dans le compteur (qui monte au rythme des pièces, avec
   un « +5 » qui s'envole). Quand on achète, les pièces partent du compteur.

   - gainItems(['🐚'], depuisEl)      objet(s) → sac
   - gainCoins(5, depuisEl)           pièces → compteur (après addCoins(5))
   - spendCoins(6, versEl)            compteur → article (après addCoins(-6))
   - queueGain({items, coins})        pour une fenêtre de récompense : les
                                      gains partent quand on la ferme
   Sans animation possible (vieux navigateur, « réduire les animations »),
   tout se met à jour d'un coup. */

const GAIN_FLIGHT_MS = 720;

function gainsReduced(){
  try{ return !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches); }catch(e){ return false; }
}
function gainsCanAnimate(){
  return !gainsReduced() && typeof document.body.animate === 'function';
}
function gainCenter(el){
  if(!el || !el.getBoundingClientRect) return { x: innerWidth/2, y: innerHeight/2 };
  const r = el.getBoundingClientRect();
  if(!r.width && !r.height) return { x: innerWidth/2, y: innerHeight/2 };
  // une cible hors de l'écran (en-tête défilé) : on vise le bord visible
  return {
    x: Math.max(20, Math.min(innerWidth - 20, r.left + r.width/2)),
    y: Math.max(20, Math.min(innerHeight - 20, r.top + r.height/2)),
  };
}
function gainLayer(){
  let l = document.getElementById('gain-layer');
  if(!l){
    l = document.createElement('div');
    l.id = 'gain-layer'; l.setAttribute('aria-hidden','true');
    document.body.appendChild(l);
  }
  return l;
}

// un emoji qui vole en arc de `from` à `to` ; onLand est appelé à l'arrivée
function flyEmoji(emoji, from, to, opts){
  opts = opts || {};
  const onLand = opts.onLand || (()=>{});
  if(!gainsCanAnimate()){ onLand(); return; }
  const el = document.createElement('span');
  el.className = 'gain-fly' + (opts.coin ? ' coin' : '');
  el.textContent = emoji;
  el.style.left = from.x + 'px';
  el.style.top = from.y + 'px';
  if(opts.size) el.style.fontSize = opts.size;
  gainLayer().appendChild(el);
  const dx = to.x - from.x, dy = to.y - from.y;
  const lift = opts.lift != null ? opts.lift : Math.min(160, 60 + Math.abs(dx) * .25);
  const jx = opts.jitter ? (Math.random() - .5) * opts.jitter : 0;
  const anim = el.animate([
    { transform:'translate(-50%,-50%) translate(0,0) scale(1)', opacity:1 },
    { transform:`translate(-50%,-50%) translate(${jx}px,-18px) scale(1.25)`, opacity:1, offset:.18 },
    { transform:`translate(-50%,-50%) translate(${dx*.5 + jx}px,${dy*.5 - lift}px) scale(1)`, opacity:1, offset:.6 },
    { transform:`translate(-50%,-50%) translate(${dx}px,${dy}px) scale(${opts.endScale || .5})`, opacity:.85 },
  ], { duration: opts.duration || GAIN_FLIGHT_MS, delay: opts.delay || 0, easing:'cubic-bezier(.45,0,.55,1)', fill:'both' });
  let done = false;
  const finish = ()=>{ if(done) return; done = true; el.remove(); onLand(); };
  anim.onfinish = finish;
  // filet de sécurité (onglet en arrière-plan, animation annulée…)
  setTimeout(finish, (opts.duration || GAIN_FLIGHT_MS) + (opts.delay || 0) + 900);
}

// petit rebond de la cible + anneau qui s'élargit
function gainLand(target, ring){
  if(!target) return;
  target.classList.remove('gain-land'); void target.offsetWidth; target.classList.add('gain-land');
  setTimeout(()=> target.classList.remove('gain-land'), 480);
  if(ring && gainsCanAnimate()){
    const c = gainCenter(target);
    const r = document.createElement('span');
    r.className = 'gain-ring';
    r.style.left = c.x + 'px'; r.style.top = c.y + 'px';
    gainLayer().appendChild(r);
    setTimeout(()=> r.remove(), 600);
  }
}
// « +5 » / « −6 » qui s'envole près du compteur
function gainLabel(text, target, minus){
  if(!gainsCanAnimate() || !target) return;
  const c = gainCenter(target);
  const t = document.createElement('span');
  t.className = 'gain-label' + (minus ? ' minus' : '');
  t.textContent = text;
  t.style.left = c.x + 'px'; t.style.top = (c.y + 22) + 'px';
  gainLayer().appendChild(t);
  setTimeout(()=> t.remove(), 1200);
}

/* ---- objets → sac ---- */
function bagTarget(){
  const b = document.querySelector('.navbtn[data-view="sac"]');
  return b ? (b.querySelector('.icon') || b) : null;
}
// fromEl : un élément, ou un point {x, y} déjà mesuré
function gainItems(emojis, fromEl, baseDelay){
  const list = (emojis || []).filter(Boolean);
  if(!list.length) return;
  const bag = bagTarget();
  const badge = document.getElementById('sac-badge');
  const from = (fromEl && fromEl.x != null) ? fromEl : gainCenter(fromEl);
  const to = gainCenter(bag);
  list.forEach((e, i)=>{
    flyEmoji(e, from, to, {
      delay: (baseDelay || 0) + i * 220, size:'2.4rem',
      onLand: ()=>{
        playSound('pop');
        gainLand(bag, true);
        if(badge && !badge.hidden){ badge.classList.remove('pop'); void badge.offsetWidth; badge.classList.add('pop'); }
      },
    });
  });
}

/* ---- pièces ↔ compteur ----
   coinsInFlight (ui.js) = pièces déjà comptées dans state.coins mais pas
   encore arrivées (positif) ou pas encore parties (négatif). */
function coinTarget(){
  const p = document.getElementById('coin-pill');
  return p ? (p.querySelector('.icon') || p) : null;
}
function coinSprites(amount){ return Math.max(1, Math.min(8, Math.abs(amount))); }

function gainCoins(amount, fromEl){
  if(!amount) return;
  const pill = document.getElementById('coin-pill');
  const n = coinSprites(amount);
  const shares = splitAmount(amount, n);
  coinsInFlight += amount; renderCoins();
  let left = amount;
  const land = (share)=>{
    if(left <= 0) return;
    const s = Math.min(share, left);
    left -= s; coinsInFlight -= s; renderCoins();
    playSound('tick');
    gainLand(pill, false);
  };
  if(!gainsCanAnimate()){ land(amount); return; }
  const from = gainCenter(fromEl), to = gainCenter(coinTarget());
  shares.forEach((s, i)=> flyEmoji('🪙', from, to, { coin:true, delay: i * 90, size:'1.7rem', jitter:60, lift:90, endScale:.7, duration:620, onLand: ()=> land(s) }));
  setTimeout(()=>{ gainLabel(`+${amount}`, pill); gainLand(pill, true); }, 620 + (n - 1) * 90);
  // filet de sécurité : tout ce qui n'est pas arrivé est compté
  setTimeout(()=> land(left), 620 + n * 90 + 1200);
}

function spendCoins(amount, toEl){
  if(!amount) return;
  const pill = document.getElementById('coin-pill');
  const n = coinSprites(amount);
  const shares = splitAmount(amount, n);
  if(!gainsCanAnimate()){ return; }   // l'affichage est déjà à jour
  coinsInFlight -= amount; renderCoins();
  let left = amount;
  const leave = (share)=>{
    if(left <= 0) return;
    const s = Math.min(share, left);
    left -= s; coinsInFlight += s; renderCoins();
  };
  const from = gainCenter(coinTarget()), to = gainCenter(toEl);
  gainLabel(`−${amount}`, pill, true);
  shares.forEach((s, i)=>{
    setTimeout(()=> leave(s), i * 80);
    flyEmoji('🪙', from, to, { coin:true, delay: i * 80, size:'1.5rem', jitter:40, lift:70, endScale:.5, duration:560,
      onLand: ()=>{ if(i === n - 1){ playSound('coin'); gainLand(toEl, true); } } });
  });
  setTimeout(()=> leave(left), n * 80 + 1000);
}
function splitAmount(amount, n){
  const a = Math.abs(amount), base = Math.floor(a / n), rest = a - base * n;
  return Array.from({ length:n }, (_, i)=> base + (i < rest ? 1 : 0));
}

/* ---- gains d'une fenêtre de récompense : partent à sa fermeture ---- */
let pendingGain = null;
function queueGain(g){
  pendingGain = { items: (g.items || []).filter(Boolean), coins: g.coins || 0 };
  // le compteur garde l'ancienne valeur tant que les pièces ne sont pas arrivées
  if(pendingGain.coins){ coinsInFlight += pendingGain.coins; renderCoins(); }
}
function flushPendingGain(){
  const g = pendingGain;
  if(!g) return;
  pendingGain = null;
  const body = document.getElementById('modal-body') || document;
  const itemEls = [...body.querySelectorAll('[data-gain-item]')];
  const coinEl = body.querySelector('[data-gain-coins]') || body.querySelector('.reward-box');
  const fallback = body.querySelector('.reward-box');
  if(g.coins){
    coinsInFlight -= g.coins;          // gainCoins le remet en vol
    gainCoins(g.coins, coinEl);
  }
  // positions mesurées MAINTENANT, avant que la fenêtre ne se ferme
  g.items.forEach((e, i)=> gainItems([e], gainCenter(itemEls[i] || fallback), i * 220 + (g.coins ? 250 : 0)));
}

// gains d'une fenêtre précédente : ils partent avant que son contenu ne disparaisse
onModalChange(flushPendingGain);
