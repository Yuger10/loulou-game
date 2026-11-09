/* ---------- Les fêtes et la saison du moment (v54 : données sorties de features/seasons) ----------
   Halloween du 20 octobre au 2 novembre, Noël du 1er décembre au 6 janvier,
   et l'anniversaire de l'enfant (jour et mois réglés dans ses réglages), qui
   passe avant les autres ce jour-là. Un adulte peut prévisualiser une saison
   (espace parents, ou ?saison=noel dans l'adresse) : elle est gardée dans
   sessionStorage. Ce fichier ne contient que les données et le calcul de la
   saison : le décor, les chapeaux et le cadeau sont dans js/features/seasons/.
   Il sert aussi à la musique, à la garde-robe et à l'île. */
const FETES = {
  halloween:    { name:'Halloween',    emoji:'🎃', from:[10,20], to:[11,2], hat:'sorciere',    gift:10, fx:'feuilles', hatGift:'un chapeau de sorcière',
                  greet:(who)=>`Joyeux Halloween${who ? ' ' + who : ''} !` },
  noel:         { name:'Noël',         emoji:'🎄', from:[12,1],  to:[1,6],  hat:'bonnet_noel', gift:10, fx:'neige', hatGift:'un bonnet de Noël',
                  greet:(who)=>`Joyeux Noël${who ? ' ' + who : ''} !` },
  anniversaire: { name:'Anniversaire', emoji:'🎂',                          hat:'fete',        gift:20, fx:'ballons', hatGift:'un chapeau de fête',
                  greet:(who)=>`Joyeux anniversaire${who ? ' ' + who : ''} !` },
};

const SEASON_PREVIEW_KEY = 'lagon-magique-saison';   // sessionStorage : aperçu choisi par un adulte

const SEASON_NONE = 'aucune';                         // aperçu « pas de saison » (tests, comparaison)

function seasonMMDD(d){ return `${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; }

function inSeasonRange(d, from, to){
  const md = (d.getMonth()+1)*100 + d.getDate();
  const a = from[0]*100 + from[1], b = to[0]*100 + to[1];
  return a <= b ? (md >= a && md <= b) : (md >= a || md <= b);
}

function seasonPreview(){ try{ return sessionStorage.getItem(SEASON_PREVIEW_KEY) || null; }catch(e){ return null; } }

function isBirthday(profile, d){ return !!(profile && profile.birthday && profile.birthday === seasonMMDD(d || new Date())); }

// La saison du moment pour le joueur courant (ou null)
function currentSeason(date){
  const prev = seasonPreview();
  if(prev === SEASON_NONE) return null;
  if(prev && FETES[prev]) return prev;
  const d = date || new Date();
  const p = currentProfile();
  if(isBirthday(p, d)) return 'anniversaire';
  return Object.keys(FETES).find(k=>FETES[k].from && inSeasonRange(d, FETES[k].from, FETES[k].to)) || null;
}

// Le chapeau de saison des compagnons (utilisé par companionSVG)
function seasonHat(){ const s = currentSeason(); return s ? FETES[s].hat : null; }
