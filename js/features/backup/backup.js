/* ---------- Sauvegarde, restauration, installation (Phase 1 : ne rien perdre) ----------
   Toute la partie (joueurs + progression de chacun) vit dans le stockage du
   navigateur, sous des clés qui commencent par « lagon-magique ». Ce module :
   - l'exporte dans un fichier (feuille de partage du téléphone si possible,
     sinon téléchargement) ou dans un code de transfert à copier-coller ;
   - la restaure depuis un fichier ou un code, après vérification et
     confirmation, en gardant une copie de la partie remplacée ;
   - demande au navigateur de ne pas effacer ces données (stockage persistant) ;
   - invite à installer le jeu sur l'écran d'accueil (Safari efface les
     données d'un site non installé après 7 jours sans visite) ;
   - rappelle de sauvegarder quand la dernière sauvegarde a plus de 2 semaines. */

const BACKUP_PREFIX = 'lagon-magique';
const BACKUP_META_KEY = 'lagon-magique-meta';
const BACKUP_UNDO_KEY = 'lagon-avant-restauration';   // hors préfixe : jamais exportée
const BACKUP_REMIND_DAYS = 14;

function lsKeys(){
  const out = [];
  try{ for(let i=0;i<localStorage.length;i++){ const k = localStorage.key(i); if(k) out.push(k); } }catch(e){}
  return out;
}
function backupMeta(){
  try{ return JSON.parse(localStorage.getItem(BACKUP_META_KEY) || '{}') || {}; }catch(e){ return {}; }
}
function setBackupMeta(patch){
  try{ localStorage.setItem(BACKUP_META_KEY, JSON.stringify(Object.assign(backupMeta(), patch))); }catch(e){}
}

/* ---- construire / lire une sauvegarde ---- */
function buildBackup(){
  if(typeof save==='function') save();
  if(typeof saveProfiles==='function') saveProfiles();
  const data = {};
  lsKeys().filter(k=>k.startsWith(BACKUP_PREFIX) && k!==BACKUP_META_KEY).forEach(k=>{
    try{ data[k] = localStorage.getItem(k); }catch(e){}
  });
  return { app:'lagon-magique', kind:'sauvegarde', v:1, at:new Date().toISOString(), data };
}

// renvoie { ok:true, backup, players:[{name, avatar, missions}] } ou { ok:false, error }
function parseBackupObject(obj){
  if(!obj || obj.app!=='lagon-magique' || typeof obj.data!=='object' || !obj.data)
    return { ok:false, error:"Ce n'est pas une sauvegarde du Lagon Magique." };
  const keys = Object.keys(obj.data);
  if(!keys.length || !keys.every(k=>k.startsWith(BACKUP_PREFIX) && typeof obj.data[k]==='string'))
    return { ok:false, error:'Cette sauvegarde est incomplète ou abîmée.' };
  let prof = null;
  try{ prof = JSON.parse(obj.data[PROFILES_KEY] || 'null'); }catch(e){}
  for(const k of keys){ try{ JSON.parse(obj.data[k]); }catch(e){ return { ok:false, error:'Cette sauvegarde est abîmée (une partie est illisible).' }; } }
  const players = (prof && Array.isArray(prof.list) ? prof.list : []).map(p=>{
    let missions = 0;
    try{ missions = (JSON.parse(obj.data[profileSaveKey(p.id)] || '{}').missions) || 0; }catch(e){}
    return { name: p.name || 'Sans nom', avatar: p.avatar, missions };
  });
  if(!players.length && !obj.data[LEGACY_SAVE_KEY])
    return { ok:false, error:"Cette sauvegarde ne contient aucun joueur." };
  return { ok:true, backup:obj, players };
}
function parseBackupText(text){
  const t = String(text || '').trim();
  if(!t) return { ok:false, error:'Le code est vide.' };
  try{
    if(t.startsWith('LAGON1:')) return parseBackupObject(JSON.parse(b64ToUtf8(t.slice(7))));
    if(t.startsWith('{')) return parseBackupObject(JSON.parse(t));
  }catch(e){ return { ok:false, error:'Ce code est incomplet : vérifiez qu\'il a été copié en entier.' }; }
  if(t.startsWith('LAGONZ1:')) return { ok:false, async:true };
  return { ok:false, error:"Ce n'est pas un code de sauvegarde du Lagon Magique." };
}

/* ---- appliquer une sauvegarde (remplace la partie actuelle) ---- */
function applyBackup(backup){
  // garde une copie de ce qu'on remplace, pour pouvoir revenir en arrière
  try{ localStorage.setItem(BACKUP_UNDO_KEY, JSON.stringify(buildBackup())); }catch(e){}
  lsKeys().filter(k=>k.startsWith(BACKUP_PREFIX) && k!==BACKUP_META_KEY).forEach(k=>{ try{ localStorage.removeItem(k); }catch(e){} });
  Object.entries(backup.data).forEach(([k,v])=>{ try{ localStorage.setItem(k, v); }catch(e){} });
  setBackupMeta({ restoredAt: new Date().toISOString(), lastBackupAt: backup.at || new Date().toISOString() });
  // recharge les joueurs et la partie sans recharger la page
  if(typeof party!=='undefined' && party.active && typeof stopParty==='function') stopParty();
  loadProfiles(); load();
  if(typeof currentWorld!=='undefined') currentWorld = 'lagon';
  if(typeof refreshAll==='function') refreshAll();
  if(typeof renderMap==='function') renderMap();
  renderBackupReminder();
}
function undoRestoreAvailable(){ try{ return !!localStorage.getItem(BACKUP_UNDO_KEY); }catch(e){ return false; } }

/* ---- encodage du code de transfert ---- */
// (repli sans TextEncoder pour les vieux navigateurs : même résultat)
function utf8ToB64(s){
  if(typeof TextEncoder!=='function') return btoa(unescape(encodeURIComponent(s)));
  const bytes = new TextEncoder().encode(s); let bin = '';
  for(let i=0;i<bytes.length;i+=0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i+0x8000));
  return btoa(bin);
}
function b64ToUtf8(b){
  const bin = atob(b.replace(/\s+/g,''));
  if(typeof TextDecoder!=='function') return decodeURIComponent(escape(bin));
  const bytes = new Uint8Array(bin.length);
  for(let i=0;i<bin.length;i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}
function bytesToB64(bytes){ let bin=''; for(let i=0;i<bytes.length;i+=0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i+0x8000)); return btoa(bin); }
function b64ToBytes(b){ const bin = atob(b.replace(/\s+/g,'')); const out = new Uint8Array(bin.length); for(let i=0;i<bin.length;i++) out[i]=bin.charCodeAt(i); return out; }
// code compressé (gzip) quand le navigateur sait le faire, sinon code simple
async function backupToCode(backup){
  const json = JSON.stringify(backup);
  if(typeof CompressionStream==='function'){
    try{
      const stream = new Blob([json]).stream().pipeThrough(new CompressionStream('gzip'));
      const buf = new Uint8Array(await new Response(stream).arrayBuffer());
      return 'LAGONZ1:' + bytesToB64(buf);
    }catch(e){}
  }
  return 'LAGON1:' + utf8ToB64(json);
}
async function parseBackupCode(text){
  const t = String(text || '').trim();
  if(!t.startsWith('LAGONZ1:')) return parseBackupText(t);
  if(typeof DecompressionStream!=='function') return { ok:false, error:"Ce navigateur ne sait pas lire ce code : utilisez plutôt le fichier de sauvegarde." };
  try{
    const stream = new Blob([b64ToBytes(t.slice(8))]).stream().pipeThrough(new DecompressionStream('gzip'));
    return parseBackupObject(JSON.parse(await new Response(stream).text()));
  }catch(e){ return { ok:false, error:'Ce code est incomplet : vérifiez qu\'il a été copié en entier.' }; }
}

/* ---- stockage persistant ---- */
async function requestPersistentStorage(){
  try{
    if(!navigator.storage || !navigator.storage.persist) return null;
    if(await navigator.storage.persisted()) return true;
    const ok = await navigator.storage.persist();
    setBackupMeta({ persisted: !!ok });
    return ok;
  }catch(e){ return null; }
}

/* ---- installation sur l'écran d'accueil ---- */
let deferredInstallPrompt = null;
window.addEventListener('beforeinstallprompt', e=>{ e.preventDefault(); deferredInstallPrompt = e; renderInstallHint(); });
window.addEventListener('appinstalled', ()=>{ deferredInstallPrompt = null; setBackupMeta({ installed:true }); renderInstallHint(); });
function isInstalled(){
  try{ return (window.matchMedia && matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true; }catch(e){ return false; }
}
function isIOS(){
  const ua = navigator.userAgent || '';
  return /iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
}
function installHelpHTML(){
  if(isInstalled()) return `<p class="bk-ok">✅ Le jeu est installé sur cet appareil.</p>`;
  if(deferredInstallPrompt) return `<button class="btn-small" id="bk-install">📲 Installer le jeu</button>`;
  if(isIOS()) return `<ol class="bk-steps"><li>Ouvrez le jeu dans <b>Safari</b>.</li><li>Touchez le bouton <b>Partager</b> <span aria-hidden="true">⬆️</span>.</li><li>Choisissez <b>« Sur l'écran d'accueil »</b>.</li></ol>`;
  return `<p>Dans le menu du navigateur, choisissez <b>« Installer l'application »</b> ou <b>« Ajouter à l'écran d'accueil »</b>.</p>`;
}
function renderInstallHint(){
  const el = document.getElementById('install-hint');
  if(!el) return;
  const dismissed = !!backupMeta().installHintDismissed;
  el.hidden = isInstalled() || dismissed || !(deferredInstallPrompt || isIOS());
}

/* ---- rappel de sauvegarde ---- */
function backupDue(){
  const last = backupMeta().lastBackupAt;
  const anyProgress = (typeof profiles!=='undefined' ? profiles.list : []).length > 0 && (typeof state!=='undefined' && state.missions >= 5);
  if(!last) return anyProgress;
  return (Date.now() - new Date(last).getTime()) > BACKUP_REMIND_DAYS * 864e5;
}
function lastBackupText(){
  const last = backupMeta().lastBackupAt;
  if(!last) return 'jamais';
  const days = Math.floor((Date.now() - new Date(last).getTime()) / 864e5);
  return days <= 0 ? "aujourd'hui" : days === 1 ? 'hier' : `il y a ${days} jours`;
}
function renderBackupReminder(){
  const pill = document.getElementById('avatar-pill');
  if(pill) pill.classList.toggle('backup-due', backupDue());
}

/* ---- la fenêtre « Sauvegarde » (pour les adultes) ---- */
function backupFileName(){
  const d = new Date();
  return `lagon-magique-sauvegarde-${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}.json`;
}
async function exportBackupFile(){
  const b = buildBackup();
  const json = JSON.stringify(b, null, 1);
  const name = backupFileName();
  const file = (typeof File==='function') ? new File([json], name, { type:'application/json' }) : null;
  try{
    if(file && navigator.canShare && navigator.canShare({ files:[file] })){
      await navigator.share({ files:[file], title:'Sauvegarde du Lagon Magique' });
      setBackupMeta({ lastBackupAt: b.at }); return 'shared';
    }
  }catch(e){ if(e && e.name==='AbortError') return 'cancelled'; }
  const url = URL.createObjectURL(new Blob([json], { type:'application/json' }));
  const a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(()=> URL.revokeObjectURL(url), 4000);
  setBackupMeta({ lastBackupAt: b.at });
  return 'downloaded';
}

function openBackup(){
  const players = (typeof profiles!=='undefined' ? profiles.list : []).map(p=>p.name || 'Sans nom').join(', ');
  openModal(`
    ${gameHeader('💾 Sauvegarde', 'Pour ne jamais perdre la partie (à faire avec un adulte)')}
    <section class="bk-card">
      <h3>Sauvegarder</h3>
      <p>Joueurs : <b>${players || '—'}</b>. Dernière sauvegarde : <b id="bk-last">${lastBackupText()}</b>.</p>
      <button class="btn-primary" id="bk-export">💾 Enregistrer une sauvegarde</button>
      <p class="bk-help">Sur téléphone, choisissez « Enregistrer dans Fichiers » ou envoyez-la-vous par message.</p>
    </section>
    <section class="bk-card">
      <h3>Changer d'appareil</h3>
      <p>Copiez ce code, envoyez-le sur l'autre appareil, puis collez-le dans « Restaurer ».</p>
      <button class="btn-small" id="bk-code">📋 Copier le code de transfert</button>
      <textarea id="bk-code-out" class="bk-code" readonly hidden aria-label="Code de transfert"></textarea>
    </section>
    <section class="bk-card">
      <h3>Restaurer</h3>
      <p>Remplace la partie de cet appareil par une sauvegarde.</p>
      <label class="btn-small ghost bk-file">📂 Choisir un fichier<input type="file" id="bk-file" accept="application/json,.json" hidden></label>
      <textarea id="bk-paste" class="bk-code" placeholder="…ou collez ici un code de transfert" aria-label="Code de transfert à restaurer"></textarea>
      <button class="btn-small" id="bk-paste-go">Restaurer ce code</button>
      <div id="bk-preview" aria-live="polite"></div>
      ${undoRestoreAvailable() ? `<button class="btn-ghost" id="bk-undo">↩️ Revenir à la partie d'avant la dernière restauration</button>` : ''}
    </section>
    <section class="bk-card">
      <h3>Installer le jeu</h3>
      <p>Installé sur l'écran d'accueil, le jeu s'ouvre en plein écran, marche sans Internet, et Safari n'efface plus la partie.</p>
      <div id="bk-install-zone">${installHelpHTML()}</div>
      <p class="bk-help" id="bk-persist"></p>
    </section>
  `);
  bindQuit();
  const $ = (id)=> document.getElementById(id);
  $('bk-export').onclick = async ()=>{
    playSound('tap');
    const r = await exportBackupFile();
    if(r!=='cancelled'){ showToast('💾 Sauvegarde enregistrée'); const l = $('bk-last'); if(l) l.textContent = lastBackupText(); renderBackupReminder(); }
  };
  $('bk-code').onclick = async ()=>{
    playSound('tap');
    const code = await backupToCode(buildBackup());
    const out = $('bk-code-out'); out.value = code; out.hidden = false;
    try{ await navigator.clipboard.writeText(code); showToast('📋 Code copié'); setBackupMeta({ lastBackupAt: new Date().toISOString() }); renderBackupReminder(); }
    catch(e){ out.focus(); out.select(); showToast('Sélectionnez le code puis copiez-le'); }
  };
  const preview = async (result)=>{
    const box = $('bk-preview');
    if(!result.ok){ box.innerHTML = `<p class="bk-err">${result.error}</p>`; return; }
    const when = result.backup.at ? new Date(result.backup.at).toLocaleDateString('fr-FR', { day:'numeric', month:'long', year:'numeric' }) : 'date inconnue';
    box.innerHTML = `<div class="bk-confirm"><p>Sauvegarde du <b>${when}</b> :</p>
      <ul>${result.players.map(p=>`<li>${avatarHTML(p.avatar)} <b>${p.name}</b> — ${p.missions} mission${p.missions>1?'s':''}</li>`).join('')}</ul>
      <p>La partie actuelle de cet appareil sera remplacée (une copie est gardée).</p>
      <button class="btn-craft danger" id="bk-apply">Remplacer par cette sauvegarde</button></div>`;
    $('bk-apply').onclick = ()=>{ applyBackup(result.backup); playSound('win'); closeModal(); showToast('✅ Partie restaurée'); };
  };
  $('bk-file').onchange = (e)=>{
    const f = e.target.files && e.target.files[0]; if(!f) return;
    const rd = new FileReader();
    rd.onload = ()=> preview(parseBackupText(String(rd.result || '')));
    rd.onerror = ()=> preview({ ok:false, error:'Impossible de lire ce fichier.' });
    rd.readAsText(f);
  };
  $('bk-paste-go').onclick = async ()=>{ playSound('tap'); preview(await parseBackupCode($('bk-paste').value)); };
  const undo = $('bk-undo');
  if(undo) undo.onclick = ()=>{
    let r = { ok:false };
    try{ r = parseBackupObject(JSON.parse(localStorage.getItem(BACKUP_UNDO_KEY))); }catch(e){}
    if(r.ok) preview(r);
  };
  const inst = $('bk-install');
  if(inst) inst.onclick = async ()=>{
    if(!deferredInstallPrompt) return;
    deferredInstallPrompt.prompt();
    try{ await deferredInstallPrompt.userChoice; }catch(e){}
    deferredInstallPrompt = null; const z = $('bk-install-zone'); if(z) z.innerHTML = installHelpHTML();
  };
  const ps = $('bk-persist');
  if(navigator.storage && navigator.storage.persisted){
    navigator.storage.persisted().then(ok=>{ if(ps) ps.textContent = ok ? '🔒 Ce navigateur protège la partie contre l\'effacement automatique.' : 'ℹ️ Ce navigateur peut effacer la partie s\'il manque de place : pensez à sauvegarder.'; }).catch(()=>{});
  }
}

/* ---- branchements au démarrage ---- */
function initBackup(){
  const hint = document.getElementById('install-hint');
  if(hint){
    hint.querySelector('[data-install-how]').onclick = ()=>{ playSound('tap'); openBackup(); };
    hint.querySelector('[data-install-close]').onclick = ()=>{ playSound('tap'); setBackupMeta({ installHintDismissed:true }); renderInstallHint(); };
  }
  renderInstallHint();
  renderBackupReminder();
}
