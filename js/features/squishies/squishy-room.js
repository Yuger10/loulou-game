/* ---------- Ma chambre à squishies (v53) : l'interface ----------
   On y entre par le bouton 🧸 de l'en-tête (avec la pastille des boîtes à
   ouvrir) ou par le Sac. Trois onglets à icône :
     📚 Collection   les boîtes à ouvrir en haut (« Ouvrir ! »), puis une
                     rangée par série : les squishies obtenus (×N), une
                     silhouette grise pour les manquants, « 4 / 6 »
     🗄️ Étagère      12 emplacements libres : on touche un squishy, puis
                     une place. Purement décoratif, sauvegardé
     📦 Ranger       les boîtes de rangement à consigne (tri par couleur,
                     forme, taille : voir makeSortingTask)
   Presser : toucher un squishy l'écrase puis le fait remonter lentement,
   avec un « pouic » et une petite vibration. Rien ne change dans la partie.
   Tout est dit à voix haute : aucun texte n'est nécessaire pour jouer. */
import { save } from '../../entities/game-state/index.js';
import { currentPlayerAge, onProfileRefresh } from '../../entities/player/index.js';
import {
  SQ_COLORS, SQUISHIES, squishiesOf, SQUISHY_SERIES, SQUISHY_SERIES_ORDER, SQUISHY_TREASURES
} from '../../entities/squishy/index.js';
import { archipelagoUnlocked } from '../../entities/world/index.js';
import {
  confetti, onModalChange, openModal, playSound, showToast, speak, vibrate
} from '../../shared/ui/index.js';
import { gainCoins } from '../gains/index.js';
import { hintNudge, registerHints, setHintQuestion } from '../hints/index.js';
import { bindQuit, gameHeader } from '../screen/index.js';
import {
  makeSortingTask, onSquishyChange, openSquishyBox, recordSorting, shelfPlace, shelfRemove,
  sortingDone, sortingPaidLeft, sortMatches, sortSay, sortWrongHint, SQ_SERIES_BONUS,
  SQ_SORT_MAX_ERRORS, SQ_SORT_MIN_MODELS, SQ_SORT_REWARD, SQ_SORT_SHAPES, SQ_SORT_SIZES, SQ_SORT_SLOTS,
  sqState, squishyBoxCount, squishyCount, squishyOwnedIds, squishySeriesAvailable, squishySeriesProgress,
  squishyShelfCount, squishyTreasureOwned
} from './squishies.js';

/* ---------- Les dessins (SVG, aucune image) ----------
   Dans le style des squishies du mini-jeu Formes (squishySVG) : un corps
   doux à la forme du modèle (rond, ovale, carré arrondi), un reflet, un
   petit visage, et un détail propre au modèle. Un petit squishy est dessiné
   plus petit, posé au même endroit. */

const SQ_BODIES = {
  rond:      { el:'<circle cx="50" cy="58" r="38"/>',                         face:[50,62] },
  'ovale-h': { el:'<ellipse cx="50" cy="67" rx="45" ry="28"/>',               face:[50,66] },
  'ovale-v': { el:'<ellipse cx="50" cy="57" rx="31" ry="39"/>',               face:[50,60] },
  carre:     { el:'<rect x="13" y="24" width="74" height="70" rx="24"/>',     face:[50,62] },
};

// le visage : yeux, joues, bouche (o.sleep : yeux fermés ; o.capy : museau ;
// o.beak : un bec à la place de la bouche ; o.noEyes : yeux dessinés à part)
function sqFace(fx, fy, o){
  o = o || {};
  const ey = o.capy ? fy - 8 : fy;
  const eyes = o.noEyes ? '' : o.sleep
    ? `<path d="M${fx-13} ${ey} q4 4 8 0 M${fx+5} ${ey} q4 4 8 0" fill="none" stroke="#2B2140" stroke-width="2.6" stroke-linecap="round"/>`
    : `<ellipse cx="${fx-9}" cy="${ey}" rx="${o.capy ? 2.8 : 3.4}" ry="${o.capy ? 3.4 : 4.4}" fill="#2B2140"/><ellipse cx="${fx+9}" cy="${ey}" rx="${o.capy ? 2.8 : 3.4}" ry="${o.capy ? 3.4 : 4.4}" fill="#2B2140"/>
       <circle cx="${fx-8}" cy="${ey-1.6}" r="1.2" fill="#fff"/><circle cx="${fx+10}" cy="${ey-1.6}" r="1.2" fill="#fff"/>`;
  const blush = `<ellipse cx="${fx-17}" cy="${fy+5}" rx="4.2" ry="2.5" fill="#FF6F91" opacity=".45"/><ellipse cx="${fx+17}" cy="${fy+5}" rx="4.2" ry="2.5" fill="#FF6F91" opacity=".45"/>`;
  let mouth;
  if(o.capy) mouth = `<ellipse cx="${fx}" cy="${fy+4}" rx="14" ry="9" fill="#fff" opacity=".4"/>
      <ellipse cx="${fx-4.5}" cy="${fy+1.5}" rx="2" ry="1.4" fill="#2B2140" opacity=".75"/><ellipse cx="${fx+4.5}" cy="${fy+1.5}" rx="2" ry="1.4" fill="#2B2140" opacity=".75"/>
      <path d="M${fx-4} ${fy+7} Q${fx} ${fy+10} ${fx+4} ${fy+7}" fill="none" stroke="#8C2F3F" stroke-width="2" stroke-linecap="round"/>`;
  else if(o.beak) mouth = `<path d="M${fx-5} ${fy+4} L${fx+5} ${fy+4} L${fx} ${fy+10}Z" fill="#FFA43A" stroke="#C8661A" stroke-width="1.6" stroke-linejoin="round"/>`;
  else if(o.wide) mouth = `<path d="M${fx-12} ${fy+5} Q${fx} ${fy+15} ${fx+12} ${fy+5}" fill="none" stroke="#8C2F3F" stroke-width="2.4" stroke-linecap="round"/>`;
  else mouth = `<path d="M${fx-4} ${fy+5} Q${fx} ${fy+9} ${fx+4} ${fy+5}" fill="none" stroke="#8C2F3F" stroke-width="2.2" stroke-linecap="round"/>`;
  return `<g class="sq-face">${eyes}${blush}${mouth}</g>`;
}

// Le dessin propre à chaque modèle : body (forme du corps), face (options du
// visage), back (derrière le corps), front (devant). c = { fill, edge }.
const SQ_ART = {
  'capy-fraise': { body:'carre', face:{ capy:true },
    back: c=> `<ellipse cx="25" cy="27" rx="7" ry="6" fill="${c.fill}" stroke="${c.edge}" stroke-width="4"/><ellipse cx="75" cy="27" rx="7" ry="6" fill="${c.fill}" stroke="${c.edge}" stroke-width="4"/>`,
    front: ()=> `<path d="M39 15 Q50 5 61 15 Q61 29 50 33 Q39 29 39 15Z" fill="#FF5A6E" stroke="#C2324A" stroke-width="3"/>
      <g class="sq-deco" fill="#FFE37A"><circle cx="45" cy="18" r="1.3"/><circle cx="55" cy="18" r="1.3"/><circle cx="50" cy="24" r="1.3"/><circle cx="45" cy="26" r="1.1"/><circle cx="55" cy="26" r="1.1"/></g>
      <path d="M41 13 L46 7 L50 11 L54 7 L59 13 L50 15Z" fill="#4FBF6A" stroke="#2F8F45" stroke-width="2" stroke-linejoin="round"/>` },
  'capy-orange': { body:'ovale-h', face:{ capy:true },
    back: c=> `<ellipse cx="22" cy="44" rx="7" ry="6" fill="${c.fill}" stroke="${c.edge}" stroke-width="4"/><ellipse cx="78" cy="44" rx="7" ry="6" fill="${c.fill}" stroke="${c.edge}" stroke-width="4"/>`,
    front: ()=> `<circle cx="50" cy="32" r="11" fill="#FF9A2E" stroke="#C8661A" stroke-width="3"/>
      <circle class="sq-deco" cx="46" cy="29" r="2.4" fill="#fff" opacity=".6"/>
      <path d="M50 21 Q58 13 64 18 Q57 24 50 21Z" fill="#4FBF6A" stroke="#2F8F45" stroke-width="2"/>` },
  'capy-dodo': { body:'ovale-h', face:{ capy:true, sleep:true },
    back: c=> `<ellipse cx="22" cy="44" rx="7" ry="6" fill="${c.fill}" stroke="${c.edge}" stroke-width="4"/><ellipse cx="78" cy="44" rx="7" ry="6" fill="${c.fill}" stroke="${c.edge}" stroke-width="4"/>`,
    front: c=> `<g class="sq-deco" fill="${c.edge}" font-family="'Baloo 2', system-ui, sans-serif" font-weight="800"><text x="74" y="30" font-size="13">z</text><text x="84" y="18" font-size="17">Z</text></g>` },
  'capy-bain': { body:'rond', face:{ capy:true },
    back: c=> `<ellipse cx="24" cy="32" rx="7" ry="6" fill="${c.fill}" stroke="${c.edge}" stroke-width="4"/><ellipse cx="76" cy="32" rx="7" ry="6" fill="${c.fill}" stroke="${c.edge}" stroke-width="4"/>`,
    front: ()=> `<path d="M29 30 Q50 12 71 30 L67 38 Q50 28 33 38Z" fill="#fff" stroke="#7DC2EA" stroke-width="3" stroke-linejoin="round"/>
      <path class="sq-deco" d="M38 27 Q50 20 62 27" fill="none" stroke="#FF9CC8" stroke-width="3" stroke-linecap="round"/>
      <g class="sq-deco" fill="#E6F6FF" stroke="#7DC2EA" stroke-width="2"><circle cx="10" cy="86" r="6"/><circle cx="90" cy="80" r="7"/><circle cx="94" cy="64" r="3.5"/><circle cx="6" cy="70" r="3"/></g>` },
  'capy-pyjama': { body:'carre', face:{ capy:true },
    back: c=> `<ellipse cx="25" cy="27" rx="7" ry="6" fill="${c.fill}" stroke="${c.edge}" stroke-width="4"/><ellipse cx="75" cy="27" rx="7" ry="6" fill="${c.fill}" stroke="${c.edge}" stroke-width="4"/>`,
    front: ()=> `<path class="sq-deco" d="M24 78 H76 M26 87 H74" stroke="#fff" stroke-width="4" opacity=".6" stroke-linecap="round"/>
      <path d="M28 31 Q40 2 72 6 Q64 17 70 31Z" fill="#7FD0F5" stroke="#3C8FC0" stroke-width="3" stroke-linejoin="round"/>
      <circle cx="75" cy="7" r="6.5" fill="#fff" stroke="#3C8FC0" stroke-width="2.5"/>` },
  'capy-dore': { body:'carre', face:{ capy:true },
    back: c=> `<ellipse cx="25" cy="27" rx="7" ry="6" fill="${c.fill}" stroke="${c.edge}" stroke-width="4"/><ellipse cx="75" cy="27" rx="7" ry="6" fill="${c.fill}" stroke="${c.edge}" stroke-width="4"/>`,
    front: ()=> `<path d="M33 27 L35 9 L43 18 L50 5 L57 18 L65 9 L67 27Z" fill="#FFD23F" stroke="#B8780A" stroke-width="3" stroke-linejoin="round"/>
      <circle class="sq-deco" cx="50" cy="20" r="3.2" fill="#FF6F91"/>
      <path class="sq-deco" d="M20 46 Q24 36 34 34" fill="none" stroke="#fff" stroke-width="4" opacity=".7" stroke-linecap="round"/>` },
  'donut': { body:'rond', face:{}, faceY:70,
    front: c=> `<circle cx="50" cy="42" r="9" fill="#FFF3E0" stroke="${c.edge}" stroke-width="3.5"/>
      <g class="sq-deco" stroke-width="3.4" stroke-linecap="round"><path d="M26 40 l5 -3" stroke="#6FB8F5"/><path d="M70 34 l5 3" stroke="#FFD95A"/><path d="M34 26 l4 4" stroke="#6ED38C"/><path d="M62 24 l-4 4" stroke="#BFA3EC"/><path d="M76 50 l2 5" stroke="#fff"/><path d="M22 54 l3 4" stroke="#FFD95A"/></g>` },
  'mochi': { body:'rond', face:{},
    front: ()=> `<path d="M50 22 Q60 4 76 12 Q66 26 50 22Z" fill="#7BCB6A" stroke="#3F8F3A" stroke-width="2.5" stroke-linejoin="round"/>
      <path class="sq-deco" d="M53 20 Q62 14 70 13" fill="none" stroke="#3F8F3A" stroke-width="1.6"/>
      <g class="sq-deco" fill="#fff" opacity=".7"><circle cx="30" cy="80" r="1.6"/><circle cx="70" cy="84" r="1.4"/><circle cx="76" cy="40" r="1.4"/></g>` },
  'cupcake': { body:'carre', face:{}, faceY:50,
    front: ()=> `<path d="M15 68 H85 L80 93 Q50 99 20 93Z" fill="#FFE0A8" stroke="#C99A4A" stroke-width="3.5" stroke-linejoin="round"/>
      <path class="sq-deco" d="M32 71 L34 95 M44 71 L45 97 M56 71 L55 97 M68 71 L66 95" stroke="#C99A4A" stroke-width="2.4" opacity=".7"/>
      <path d="M50 17 Q52 8 58 5" fill="none" stroke="#3F8F3A" stroke-width="2.4" stroke-linecap="round"/>
      <circle cx="50" cy="20" r="7" fill="#FF4D6D" stroke="#C2324A" stroke-width="2.5"/>
      <circle class="sq-deco" cx="47.5" cy="17.5" r="2" fill="#fff" opacity=".7"/>` },
  'glace': { body:'rond', face:{},
    back: ()=> `<path d="M28 78 L50 113 L72 78Z" fill="#F2C27B" stroke="#B98535" stroke-width="3.5" stroke-linejoin="round"/>
      <path class="sq-deco" d="M36 84 L58 106 M48 82 L64 97 M60 82 L42 102 M68 84 L50 106" stroke="#B98535" stroke-width="2" opacity=".6"/>`,
    front: ()=> `<path class="sq-deco" d="M30 86 Q34 96 38 88 Q44 98 48 90 Q54 99 58 90 Q64 97 68 87" fill="none" stroke="#fff" stroke-width="3" opacity=".75" stroke-linecap="round"/>` },
  'macaron': { body:'ovale-h', face:{}, faceY:52,
    front: ()=> `<rect x="7" y="65" width="86" height="10" rx="5" fill="#FFF3D6" stroke="#C9A86A" stroke-width="2.5"/>
      <path class="sq-deco" d="M12 80 Q50 92 88 80" fill="none" stroke="#fff" stroke-width="2.5" opacity=".6"/>` },
  'gateau-arc': { body:'carre', face:{}, faceY:50,
    front: ()=> `<g class="sq-deco" stroke-width="5" stroke-linecap="round"><path d="M22 72 H78" stroke="#FF6F91"/><path d="M21 79 H79" stroke="#FFB04A"/><path d="M22 86 H78" stroke="#FFD95A"/><path d="M27 92 H73" stroke="#6FB8F5"/></g>
      <rect x="46" y="5" width="8" height="20" rx="3" fill="#fff" stroke="#BFA3EC" stroke-width="2.5"/>
      <path class="sq-deco" d="M46 11 L54 8 M46 18 L54 15" stroke="#FF6F91" stroke-width="2"/>
      <path d="M50 -5 Q56 1 50 4 Q44 1 50 -5Z" fill="#FFB020" stroke="#E8573A" stroke-width="1.5"/>` },
  'chat': { body:'rond', face:{},
    back: c=> `<path d="M16 44 L20 8 L46 26Z" fill="${c.fill}" stroke="${c.edge}" stroke-width="4" stroke-linejoin="round"/><path d="M84 44 L80 8 L54 26Z" fill="${c.fill}" stroke="${c.edge}" stroke-width="4" stroke-linejoin="round"/>
      <path d="M22 34 L24 18 L36 28Z M78 34 L76 18 L64 28Z" fill="#FFB8C8"/>`,
    front: ()=> `<path class="sq-deco" d="M18 62 H30 M18 68 L30 66 M82 62 H70 M82 68 L70 66" stroke="#2B2140" stroke-width="1.8" stroke-linecap="round" opacity=".6"/>` },
  'pingouin': { body:'ovale-v', face:{ beak:true }, faceY:46,
    back: c=> `<ellipse cx="18" cy="64" rx="7" ry="16" fill="${c.fill}" stroke="${c.edge}" stroke-width="4" transform="rotate(18 18 64)"/><ellipse cx="82" cy="64" rx="7" ry="16" fill="${c.fill}" stroke="${c.edge}" stroke-width="4" transform="rotate(-18 82 64)"/>
      <ellipse cx="38" cy="96" rx="9" ry="5" fill="#FFA43A" stroke="#C8661A" stroke-width="2.5"/><ellipse cx="62" cy="96" rx="9" ry="5" fill="#FFA43A" stroke="#C8661A" stroke-width="2.5"/>`,
    front: ()=> `<ellipse cx="50" cy="70" rx="20" ry="22" fill="#fff" opacity=".92"/>` },
  'lapin': { body:'ovale-v', face:{},
    back: c=> `<ellipse cx="37" cy="10" rx="8" ry="19" fill="${c.fill}" stroke="${c.edge}" stroke-width="4" transform="rotate(-10 37 10)"/><ellipse cx="63" cy="10" rx="8" ry="19" fill="${c.fill}" stroke="${c.edge}" stroke-width="4" transform="rotate(10 63 10)"/>
      <ellipse cx="37" cy="10" rx="3.5" ry="12" fill="#FFE1EE" transform="rotate(-10 37 10)"/><ellipse cx="63" cy="10" rx="3.5" ry="12" fill="#FFE1EE" transform="rotate(10 63 10)"/>`,
    front: ()=> `<ellipse class="sq-deco" cx="50" cy="66" rx="2.6" ry="2" fill="#C9497F"/>` },
  'poussin': { body:'rond', face:{ beak:true },
    back: c=> `<path d="M44 24 Q40 8 49 12 Q52 2 57 12 Q64 8 60 24" fill="${c.fill}" stroke="${c.edge}" stroke-width="3.5" stroke-linejoin="round"/>
      <ellipse cx="40" cy="96" rx="7" ry="4" fill="#FFA43A"/><ellipse cx="60" cy="96" rx="7" ry="4" fill="#FFA43A"/>`,
    front: c=> `<path d="M14 64 Q8 54 18 50 M86 64 Q92 54 82 50" fill="none" stroke="${c.edge}" stroke-width="3.5" stroke-linecap="round"/>` },
  'grenouille': { body:'ovale-h', face:{ noEyes:true, wide:true }, faceY:66,
    back: c=> `<circle cx="31" cy="42" r="13" fill="${c.fill}" stroke="${c.edge}" stroke-width="4"/><circle cx="69" cy="42" r="13" fill="${c.fill}" stroke="${c.edge}" stroke-width="4"/>`,
    front: ()=> `<g class="sq-face"><circle cx="31" cy="42" r="7.5" fill="#fff"/><circle cx="69" cy="42" r="7.5" fill="#fff"/>
      <circle cx="32" cy="43" r="4" fill="#2B2140"/><circle cx="70" cy="43" r="4" fill="#2B2140"/><circle cx="33" cy="41.5" r="1.3" fill="#fff"/><circle cx="71" cy="41.5" r="1.3" fill="#fff"/></g>` },
  'chat-holo': { body:'rond', face:{},
    back: c=> `<path d="M16 44 L20 8 L46 26Z" fill="${c.fill}" stroke="${c.edge}" stroke-width="4" stroke-linejoin="round"/><path d="M84 44 L80 8 L54 26Z" fill="${c.fill}" stroke="${c.edge}" stroke-width="4" stroke-linejoin="round"/>
      <path d="M22 34 L24 18 L36 28Z M78 34 L76 18 L64 28Z" fill="#9CE7F2"/>`,
    front: ()=> `<g class="sq-deco"><ellipse cx="34" cy="78" rx="12" ry="5" fill="#9CE7F2" opacity=".55" transform="rotate(-25 34 78)"/><ellipse cx="68" cy="80" rx="11" ry="5" fill="#FFB8E1" opacity=".6" transform="rotate(20 68 80)"/>
      <ellipse cx="74" cy="40" rx="8" ry="4" fill="#FFF3A6" opacity=".7" transform="rotate(35 74 40)"/></g>
      <path class="sq-deco" d="M18 62 H30 M82 62 H70" stroke="#2B2140" stroke-width="1.8" stroke-linecap="round" opacity=".5"/>` },
  // 📦 Boîtes (saison 2, v55) : des boîtes douces, chacune avec son détail
  'chat-boite': { body:'carre', face:{}, faceY:58,
    back: c=> `<path d="M18 34 L22 6 L44 26Z M82 34 L78 6 L56 26Z" fill="${c.fill}" stroke="${c.edge}" stroke-width="4" stroke-linejoin="round"/>
      <path d="M24 26 L25 14 L36 24Z M76 26 L75 14 L64 24Z" fill="#FFC9D6"/>`,
    front: c=> `<path class="sq-deco" d="M13 76 H87" stroke="${c.edge}" stroke-width="3" opacity=".5"/>
      <path class="sq-deco" d="M20 58 H30 M20 64 L30 62 M80 58 H70 M80 64 L70 62" stroke="#2B2140" stroke-width="1.8" stroke-linecap="round" opacity=".55"/>` },
  'robot-carton': { body:'carre', face:{}, faceY:58,
    back: ()=> `<path d="M50 24 V8" stroke="#5E6B7C" stroke-width="4"/><circle cx="50" cy="6" r="5" fill="#FF9CC8" stroke="#C9497F" stroke-width="2.5"/>`,
    front: c=> `<rect x="26" y="40" width="48" height="36" rx="8" fill="#fff" opacity=".45"/>
      <g class="sq-deco" fill="${c.edge}"><circle cx="22" cy="34" r="2.6"/><circle cx="78" cy="34" r="2.6"/><circle cx="22" cy="86" r="2.6"/><circle cx="78" cy="86" r="2.6"/></g>` },
  'cadeau': { body:'carre', face:{}, faceY:66,
    front: ()=> `<path d="M50 24 V94 M13 50 H87" stroke="#FFD95A" stroke-width="8" opacity=".95"/>
      <path d="M50 24 C40 8 24 14 34 24Z M50 24 C60 8 76 14 66 24Z" fill="#FFD95A" stroke="#B8901A" stroke-width="3" stroke-linejoin="round"/>` },
  'colis': { body:'carre', face:{}, faceY:64,
    front: ()=> `<rect x="44" y="24" width="12" height="70" fill="#F3E2C4" opacity=".9"/>
      <rect class="sq-deco" x="60" y="78" width="20" height="12" rx="2" fill="#fff" stroke="#B8901A" stroke-width="2"/>` },
  'pop': { body:'rond', face:{ wide:true },
    back: ()=> `<path d="M42 92 L58 98 L42 104 L58 110" fill="none" stroke="#9AA7B8" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M22 30 Q28 6 50 18 Q72 6 78 30" fill="#FF8FB8" stroke="#C9497F" stroke-width="3.5" stroke-linejoin="round"/>
      <circle cx="22" cy="30" r="5" fill="#FFD95A"/><circle cx="78" cy="30" r="5" fill="#FFD95A"/>`,
    front: ()=> `<path class="sq-deco" d="M24 86 Q50 98 76 86" fill="none" stroke="#FFD95A" stroke-width="5" stroke-linecap="round"/>` },
  'boite-doree': { body:'carre', face:{}, faceY:64,
    front: ()=> `<path d="M50 24 V94" stroke="#fff" stroke-width="7" opacity=".7"/>
      <path d="M50 24 C40 8 24 14 34 24Z M50 24 C60 8 76 14 66 24Z" fill="#FFF3A6" stroke="#B8780A" stroke-width="3" stroke-linejoin="round"/>
      <path class="sq-deco" d="M20 46 Q24 34 36 32" fill="none" stroke="#fff" stroke-width="4" opacity=".8" stroke-linecap="round"/>` },
  // 🧸 Jouets doux (saison 2, le Coffre aux Jouets Doux) : des peluches toutes rondes
  'ourson-guimauve': { body:'rond', face:{}, faceY:56,
    back: c=> `<circle cx="22" cy="26" r="11" fill="${c.fill}" stroke="${c.edge}" stroke-width="4"/><circle cx="78" cy="26" r="11" fill="${c.fill}" stroke="${c.edge}" stroke-width="4"/>
      <circle cx="22" cy="26" r="5" fill="#FFE1EE"/><circle cx="78" cy="26" r="5" fill="#FFE1EE"/>`,
    front: ()=> `<ellipse class="sq-deco" cx="50" cy="82" rx="15" ry="9" fill="#fff" opacity=".55"/>` },
  'lapin-mochi': { body:'ovale-h', face:{}, faceY:66,
    back: c=> `<ellipse cx="36" cy="26" rx="8" ry="18" fill="${c.fill}" stroke="${c.edge}" stroke-width="4" transform="rotate(-14 36 26)"/><ellipse cx="64" cy="26" rx="8" ry="18" fill="${c.fill}" stroke="${c.edge}" stroke-width="4" transform="rotate(14 64 26)"/>
      <ellipse cx="36" cy="27" rx="3.4" ry="11" fill="#F3E4FF" transform="rotate(-14 36 27)"/><ellipse cx="64" cy="27" rx="3.4" ry="11" fill="#F3E4FF" transform="rotate(14 64 27)"/>`,
    front: ()=> `<path class="sq-deco" d="M20 84 Q50 96 80 84" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".55"/>` },
  'poulpe-mou': { body:'rond', face:{ wide:true }, faceY:54,
    back: c=> `<g fill="${c.fill}" stroke="${c.edge}" stroke-width="4" stroke-linejoin="round"><path d="M18 76 Q6 96 18 104 Q26 96 30 86Z"/><path d="M82 76 Q94 96 82 104 Q74 96 70 86Z"/>
      <path d="M34 88 Q28 106 40 108 Q46 100 46 92Z"/><path d="M66 88 Q72 106 60 108 Q54 100 54 92Z"/></g>`,
    front: ()=> `<g class="sq-deco" fill="#fff" opacity=".6"><circle cx="70" cy="32" r="3.4"/><circle cx="78" cy="44" r="2.4"/></g>` },
  'grenouille-sauteuse': { body:'ovale-h', face:{ noEyes:true, wide:true }, faceY:68,
    back: c=> `<circle cx="31" cy="42" r="12" fill="${c.fill}" stroke="${c.edge}" stroke-width="4"/><circle cx="69" cy="42" r="12" fill="${c.fill}" stroke="${c.edge}" stroke-width="4"/>
      <path d="M12 86 Q2 100 18 100 M88 86 Q98 100 82 100" fill="none" stroke="${c.edge}" stroke-width="4" stroke-linecap="round"/>`,
    front: ()=> `<g class="sq-face"><circle cx="31" cy="42" r="7" fill="#fff"/><circle cx="69" cy="42" r="7" fill="#fff"/>
      <circle cx="31" cy="43" r="3.8" fill="#2B2140"/><circle cx="69" cy="43" r="3.8" fill="#2B2140"/><circle cx="32" cy="41.5" r="1.2" fill="#fff"/><circle cx="70" cy="41.5" r="1.2" fill="#fff"/></g>
      <g class="sq-deco" fill="#FFF3A6"><circle cx="38" cy="82" r="3"/><circle cx="62" cy="83" r="3"/><circle cx="50" cy="88" r="2.4"/></g>` },
  'nougat': { body:'carre', face:{}, faceY:58,
    back: c=> `<circle cx="22" cy="28" r="12" fill="${c.fill}" stroke="${c.edge}" stroke-width="4"/><circle cx="78" cy="28" r="12" fill="${c.fill}" stroke="${c.edge}" stroke-width="4"/>
      <circle cx="22" cy="28" r="5.5" fill="#FFE1EE"/><circle cx="78" cy="28" r="5.5" fill="#FFE1EE"/>`,
    front: ()=> `<path d="M37 80 L50 87 L63 80 L63 94 L50 87 L37 94Z" fill="#FF8FB8" stroke="#C9497F" stroke-width="2.4" stroke-linejoin="round"/>
      <circle cx="50" cy="87" r="3.6" fill="#FFD95A" stroke="#C9497F" stroke-width="1.6"/>` },
  'ourson-arc': { body:'rond', face:{}, faceY:54,
    back: c=> `<circle cx="22" cy="26" r="11" fill="${c.fill}" stroke="${c.edge}" stroke-width="4"/><circle cx="78" cy="26" r="11" fill="${c.fill}" stroke="${c.edge}" stroke-width="4"/>
      <circle cx="22" cy="26" r="5" fill="#FFF3A6"/><circle cx="78" cy="26" r="5" fill="#9CE7F2"/>`,
    front: ()=> `<g class="sq-deco" fill="none" stroke-width="4.5" stroke-linecap="round"><path d="M28 88 Q50 68 72 88" stroke="#FF6F91"/><path d="M33 91 Q50 76 67 91" stroke="#FFD95A"/><path d="M38 94 Q50 84 62 94" stroke="#6ED38C"/></g>` },
  // 🍬 Bonbons (saison 2, le Royaume des Bonbons) : des bonbons tout doux
  'sucette-spirale': { body:'rond', face:{},
    back: c=> `<rect x="46" y="86" width="8" height="26" rx="4" fill="#fff" stroke="${c.edge}" stroke-width="3"/>`,
    front: ()=> `<path class="sq-deco" d="M22 44 Q30 24 50 22 M30 34 Q40 26 52 30 M78 40 Q72 26 60 24" fill="none" stroke="#fff" stroke-width="5" opacity=".7" stroke-linecap="round"/>` },
  'berlingot': { body:'carre', face:{}, faceY:62,
    back: c=> `<path d="M13 58 L0 46 L0 72Z M87 58 L100 46 L100 72Z" fill="${c.fill}" stroke="${c.edge}" stroke-width="3.5" stroke-linejoin="round"/>`,
    front: ()=> `<path class="sq-deco" d="M32 26 L28 92 M68 26 L72 92" stroke="#fff" stroke-width="5" opacity=".6"/>` },
  'guimauve': { body:'ovale-h', face:{}, faceY:68,
    front: ()=> `<ellipse class="sq-deco" cx="50" cy="48" rx="32" ry="7" fill="#fff" opacity=".5"/><path class="sq-deco" d="M18 76 Q50 88 82 76" fill="none" stroke="#FFB8D6" stroke-width="4" stroke-linecap="round" opacity=".8"/>` },
  'dragee': { body:'ovale-v', face:{}, faceY:60,
    front: ()=> `<ellipse class="sq-deco" cx="64" cy="34" rx="6" ry="10" fill="#fff" opacity=".5" transform="rotate(20 64 34)"/>` },
  'praline': { body:'rond', face:{}, faceY:62,
    back: ()=> `<path d="M28 28 L32 8 L42 20 L50 4 L58 20 L68 8 L72 28Z" fill="#FFD95A" stroke="#B8901A" stroke-width="3" stroke-linejoin="round"/>
      <circle cx="50" cy="12" r="3" fill="#FF6F91"/>`,
    front: ()=> `<g class="sq-deco" fill="#fff" opacity=".45"><circle cx="28" cy="78" r="3"/><circle cx="72" cy="80" r="3.4"/><circle cx="62" cy="88" r="2.4"/><circle cx="36" cy="88" r="2.2"/></g>` },
  'gateau-etages': { body:'carre', face:{}, faceY:66,
    back: c=> `<rect x="27" y="2" width="46" height="28" rx="10" fill="${c.fill}" stroke="${c.edge}" stroke-width="4"/><circle cx="50" cy="-2" r="6" fill="#E8344E" stroke="#A8264A" stroke-width="2"/>`,
    front: ()=> `<path class="sq-deco" d="M15 42 Q21 52 27 42 Q33 52 39 42 Q45 52 51 42 Q57 52 63 42 Q69 52 75 42 Q81 52 85 42" fill="none" stroke="#fff" stroke-width="5" opacity=".85" stroke-linecap="round"/>` },
  // 🎺 Instruments (saison 2, l'Île de la Musique)
  'tambour-mochi': { body:'rond', face:{}, faceY:58,
    back: ()=> `<path d="M34 26 L22 4 M66 26 L78 4" stroke="#C99364" stroke-width="4.5" stroke-linecap="round"/><circle cx="22" cy="4" r="4.5" fill="#FFF4E0" stroke="#7A4524" stroke-width="1.5"/><circle cx="78" cy="4" r="4.5" fill="#FFF4E0" stroke="#7A4524" stroke-width="1.5"/>`,
    front: ()=> `<ellipse class="sq-deco" cx="50" cy="30" rx="24" ry="7" fill="#fff" opacity=".55"/>
      <path class="sq-deco" d="M18 78 L26 88 L34 78 L42 88 L50 78 L58 88 L66 78 L74 88 L82 78" fill="none" stroke="#fff" stroke-width="3.5" stroke-linejoin="round" opacity=".75"/>` },
  'maracas': { body:'ovale-v', face:{}, faceY:52,
    back: ()=> `<rect x="44" y="88" width="12" height="24" rx="6" fill="#C99364" stroke="#7A4524" stroke-width="3"/>`,
    front: ()=> `<g class="sq-deco" fill="#FFF3A6"><circle cx="32" cy="72" r="3.4"/><circle cx="50" cy="80" r="3.4"/><circle cx="68" cy="72" r="3.4"/><circle cx="40" cy="30" r="3"/><circle cx="62" cy="28" r="3"/></g>` },
  'xylophone': { body:'carre', face:{}, faceY:52,
    front: ()=> `<g class="sq-deco" stroke="#fff" stroke-width="1.5"><rect x="20" y="70" width="11" height="18" rx="3" fill="#FF8FB8"/><rect x="34" y="72" width="11" height="15" rx="3" fill="#FFD95A"/>
      <rect x="48" y="74" width="11" height="12" rx="3" fill="#6ED38C"/><rect x="62" y="76" width="11" height="9" rx="3" fill="#6FB8F5"/></g>` },
  'trompette': { body:'rond', face:{}, faceY:62,
    back: ()=> `<path d="M80 48 L106 32 L106 84 L80 68Z" fill="#FFD95A" stroke="#B8901A" stroke-width="3" stroke-linejoin="round"/>
      <g fill="#FFD95A" stroke="#B8901A" stroke-width="2.4"><rect x="36" y="10" width="7" height="14" rx="2"/><rect x="47" y="8" width="7" height="16" rx="2"/><rect x="58" y="10" width="7" height="14" rx="2"/></g>`,
    front: ()=> `<path class="sq-deco" d="M24 40 Q32 30 44 30" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".6"/>` },
  'boumbo': { body:'rond', face:{}, faceY:56,
    back: ()=> `<path d="M18 8 L46 34 M82 8 L54 34" stroke="#C99364" stroke-width="5" stroke-linecap="round"/><circle cx="18" cy="8" r="5" fill="#FFF4E0" stroke="#7A4524" stroke-width="1.5"/><circle cx="82" cy="8" r="5" fill="#FFF4E0" stroke="#7A4524" stroke-width="1.5"/>`,
    front: ()=> `<path class="sq-deco" d="M16 76 Q50 94 84 76" fill="none" stroke="#FFD95A" stroke-width="6" stroke-linecap="round"/>` },
  'lyre-doree': { body:'carre', face:{}, faceY:64,
    back: ()=> `<path d="M24 30 Q4 12 22 0 M76 30 Q96 12 78 0" fill="none" stroke="#B8780A" stroke-width="6" stroke-linecap="round"/><path d="M18 2 H82" stroke="#B8780A" stroke-width="5" stroke-linecap="round"/>`,
    front: ()=> `<path class="sq-deco" d="M38 26 V46 M50 26 V46 M62 26 V46" stroke="#fff" stroke-width="2.6" opacity=".8"/>` },
  // 🐞 Petites bêtes (saison 2, le Jardin des Fées)
  'coccinelle': { body:'rond', face:{}, faceY:62,
    back: ()=> `<path d="M40 24 Q34 8 26 8 M60 24 Q66 8 74 8" fill="none" stroke="#2B2140" stroke-width="3" stroke-linecap="round"/><circle cx="26" cy="8" r="3.6" fill="#2B2140"/><circle cx="74" cy="8" r="3.6" fill="#2B2140"/>`,
    front: ()=> `<path class="sq-deco" d="M50 20 V40" stroke="#2B2140" stroke-width="3" opacity=".6"/>
      <g class="sq-deco" fill="#2B2140" opacity=".75"><circle cx="30" cy="40" r="5"/><circle cx="70" cy="40" r="5"/><circle cx="24" cy="70" r="4"/><circle cx="76" cy="70" r="4"/><circle cx="38" cy="86" r="3.6"/><circle cx="62" cy="86" r="3.6"/></g>` },
  'abeille': { body:'ovale-h', face:{}, faceY:62,
    back: ()=> `<ellipse cx="34" cy="36" rx="16" ry="11" fill="#E6F4FF" stroke="#7FA8C9" stroke-width="3" transform="rotate(-20 34 36)"/><ellipse cx="66" cy="36" rx="16" ry="11" fill="#E6F4FF" stroke="#7FA8C9" stroke-width="3" transform="rotate(20 66 36)"/>`,
    front: ()=> `<path class="sq-deco" d="M24 50 Q28 66 24 84 M76 50 Q72 66 76 84" fill="none" stroke="#6B3E26" stroke-width="6" stroke-linecap="round" opacity=".75"/>` },
  'escargot': { body:'rond', face:{}, faceY:70,
    back: c=> `<path d="M8 92 Q4 70 18 66 L30 70 L30 96Z" fill="#FFE1C9" stroke="#B5702E" stroke-width="3" stroke-linejoin="round"/><path d="M12 68 L6 54 M20 66 L18 52" stroke="#B5702E" stroke-width="3" stroke-linecap="round"/>`,
    front: ()=> `<path class="sq-deco" d="M50 54 m-10 0 a10 10 0 1 1 10 10 a16 16 0 1 1 -16 -16" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".6"/>` },
  'chenille': { body:'ovale-h', face:{}, faceY:64,
    back: c=> `<g fill="${c.fill}" stroke="${c.edge}" stroke-width="4"><circle cx="10" cy="74" r="13"/><circle cx="90" cy="74" r="13"/></g>
      <path d="M40 42 L34 26 M60 42 L66 26" stroke="${c.edge}" stroke-width="3" stroke-linecap="round"/><circle cx="34" cy="25" r="3.4" fill="#FFD95A"/><circle cx="66" cy="25" r="3.4" fill="#FFD95A"/>`,
    front: ()=> `<g class="sq-deco" fill="#FFF3A6" opacity=".8"><circle cx="20" cy="70" r="3"/><circle cx="80" cy="70" r="3"/><circle cx="34" cy="86" r="2.6"/><circle cx="66" cy="86" r="2.6"/></g>` },
  'pois': { body:'rond', face:{}, faceY:62,
    back: ()=> `<g stroke="#C9497F" stroke-width="2"><circle cx="30" cy="20" r="7" fill="#FF9CC8"/><circle cx="50" cy="12" r="7" fill="#FFF3A6"/><circle cx="70" cy="20" r="7" fill="#BFA3EC"/></g>`,
    front: ()=> `<g class="sq-deco" fill="#2B2140" opacity=".7"><circle cx="28" cy="44" r="5"/><circle cx="72" cy="44" r="5"/><circle cx="26" cy="76" r="4"/><circle cx="74" cy="76" r="4"/></g>` },
  'papillon-irise': { body:'ovale-v', face:{}, faceY:58,
    back: ()=> `<path d="M44 46 C26 10 0 18 6 44 C10 60 30 60 44 54Z M56 46 C74 10 100 18 94 44 C90 60 70 60 56 54Z" fill="#FFB8E1" stroke="#7B5CC0" stroke-width="3.5" stroke-linejoin="round"/>
      <path d="M44 66 C28 70 14 88 26 100 C36 108 46 90 46 76Z M56 66 C72 70 86 88 74 100 C64 108 54 90 54 76Z" fill="#9CE7F2" stroke="#7B5CC0" stroke-width="3.5" stroke-linejoin="round"/>`,
    front: ()=> `<path class="sq-deco" d="M42 24 Q36 10 28 10 M58 24 Q64 10 72 10" fill="none" stroke="#7B5CC0" stroke-width="2.6" stroke-linecap="round"/>` },
  // 🦄 Licornes (saison 2, le Royaume Arc-en-ciel) : une corne, une crinière
  'licorne-nuage': { body:'rond', face:{}, faceY:62,
    back: c=> `<path d="M44 24 L50 0 L56 24Z" fill="#FFF3A6" stroke="#B8901A" stroke-width="3" stroke-linejoin="round"/><path d="M24 30 L22 12 L36 24Z M76 30 L78 12 L64 24Z" fill="${c.fill}" stroke="${c.edge}" stroke-width="3.5" stroke-linejoin="round"/>`,
    front: ()=> `<g class="sq-deco" fill="#fff" opacity=".75"><ellipse cx="28" cy="88" rx="12" ry="7"/><ellipse cx="72" cy="88" rx="12" ry="7"/><ellipse cx="50" cy="92" rx="14" ry="7"/></g>` },
  'licorne-fraise': { body:'rond', face:{}, faceY:62,
    back: c=> `<path d="M44 24 L50 0 L56 24Z" fill="#FFF3A6" stroke="#B8901A" stroke-width="3" stroke-linejoin="round"/><path d="M64 24 Q86 20 88 48 Q78 40 70 38Z" fill="#6ED38C" stroke="#2F9551" stroke-width="3"/>`,
    front: ()=> `<g class="sq-deco" fill="#FFF3A6"><circle cx="30" cy="44" r="2.6"/><circle cx="70" cy="46" r="2.6"/><circle cx="26" cy="74" r="2.6"/><circle cx="74" cy="76" r="2.6"/><circle cx="50" cy="86" r="2.6"/></g>` },
  'licorne-dodo': { body:'ovale-h', face:{ sleep:true }, faceY:66,
    back: c=> `<path d="M44 40 L48 18 L54 40Z" fill="#FFF3A6" stroke="#B8901A" stroke-width="3" stroke-linejoin="round"/><path d="M60 40 Q84 32 92 56 Q80 50 70 50Z" fill="#9CE7F2" stroke="#2F7CC0" stroke-width="3"/>`,
    front: ()=> `<path class="sq-deco" d="M76 28 h8 l-8 8 h8 M86 16 h6 l-6 6 h6" fill="none" stroke="#7B5CC0" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>` },
  'bebe-licorne': { body:'rond', face:{ wide:true }, faceY:62,
    back: ()=> `<path d="M46 24 L50 10 L54 24Z" fill="#FFF3A6" stroke="#B8901A" stroke-width="3" stroke-linejoin="round"/>`,
    front: ()=> `<path class="sq-deco" d="M28 36 Q38 26 50 30 Q62 26 72 36" fill="none" stroke="#FF9CC8" stroke-width="5" stroke-linecap="round"/>` },
  'biscotte': { body:'rond', face:{}, faceY:62,
    back: ()=> `<path d="M46 24 L50 10 L54 24Z" fill="#FFF3A6" stroke="#B8901A" stroke-width="3" stroke-linejoin="round"/><g fill="none" stroke-width="4.5" stroke-linecap="round"><path d="M80 80 Q100 56 106 78" stroke="#FF6F61"/><path d="M82 86 Q98 66 102 84" stroke="#FFD95A"/></g>`,
    front: ()=> `<path class="sq-deco" d="M26 34 Q40 22 54 30" fill="none" stroke="#9FDCF5" stroke-width="5" stroke-linecap="round"/>` },
  'licorne-etoile': { body:'carre', face:{}, faceY:62,
    back: c=> `<path d="M44 26 L50 0 L56 26Z" fill="#FFF3A6" stroke="#B8780A" stroke-width="3" stroke-linejoin="round"/><path d="M14 40 Q4 20 22 22 M86 40 Q96 20 78 22" fill="none" stroke="${c.edge}" stroke-width="4" stroke-linecap="round"/>`,
    front: ()=> `<path class="sq-deco" d="M24 82 l2.4 5 l5.5 .8 l-4 3.8 l1 5.5 l-4.9 -2.6 l-4.9 2.6 l1 -5.5 l-4 -3.8 l5.5 -.8z M76 82 l2.4 5 l5.5 .8 l-4 3.8 l1 5.5 l-4.9 -2.6 l-4.9 2.6 l1 -5.5 l-4 -3.8 l5.5 -.8z" fill="#FFF3A6" stroke="#B8780A" stroke-width="1.6"/>` },
  // 💎 Trésors : uniques, jamais dans les boîtes
  'grisou-arc': { body:'rond', face:{ wide:true }, faceY:62,
    back: ()=> `<g fill="none" stroke-width="6" stroke-linecap="round"><path d="M4 70 Q50 -20 96 70" stroke="#FF6F61"/><path d="M11 70 Q50 -6 89 70" stroke="#FFD95A"/><path d="M18 70 Q50 8 82 70" stroke="#6ED38C"/><path d="M25 70 Q50 22 75 70" stroke="#6FB8F5"/></g>
      <g fill="#F3E8FF" stroke="#7B5CC0" stroke-width="4"><circle cx="16" cy="80" r="16"/><circle cx="84" cy="80" r="16"/><circle cx="50" cy="30" r="20"/></g>`,
    front: ()=> `<g class="sq-deco"><ellipse cx="30" cy="74" rx="6" ry="3.6" fill="#FF6F91" opacity=".55"/><ellipse cx="70" cy="74" rx="6" ry="3.6" fill="#FF6F91" opacity=".55"/></g>` },
};

// les paillettes d'un ✨ (animées en CSS)
const SQ_SPARKLE = (x, y, s)=> `<path d="M${x} ${y-s} Q${x+s*.18} ${y-s*.18} ${x+s} ${y} Q${x+s*.18} ${y+s*.18} ${x} ${y+s} Q${x-s*.18} ${y+s*.18} ${x-s} ${y} Q${x-s*.18} ${y-s*.18} ${x} ${y-s}Z"/>`;

/* Le dessin d'un squishy. opts.silhouette : gris, sans visage (un modèle
   pas encore trouvé). */
function squishyArtSVG(id, opts){
  opts = opts || {};
  const m = SQUISHIES[id] || SQUISHY_TREASURES[id], art = SQ_ART[id];
  if(!m || !art) return '';
  const c = SQ_COLORS[m.color] || { fill:'#E4ECF0', edge:'#7C8E99' };
  const body = SQ_BODIES[art.body] || SQ_BODIES.rond;
  const fx = body.face[0], fy = art.faceY || body.face[1];
  const shine = `<ellipse class="sq-deco" cx="${fx-16}" cy="${(art.faceY ? fy - 14 : fy - 24)}" rx="8" ry="4.6" fill="#fff" opacity=".45" transform="rotate(-25 ${fx-16} ${(art.faceY ? fy - 14 : fy - 24)})"/>`;
  let inner = `${art.back ? art.back(c) : ''}
    <g fill="${c.fill}" stroke="${c.edge}" stroke-width="4.5" stroke-linejoin="round">${body.el}</g>
    ${shine}${sqFace(fx, fy, art.face)}${art.front ? art.front(c) : ''}`;
  // un petit squishy : le même dessin, plus petit, posé au même endroit
  if(m.size === 'petit') inner = `<g transform="translate(50 98) scale(.68) translate(-50 -98)">${inner}</g>`;
  const brille = m.rarity === 'brille' && !opts.silhouette;
  const sparkles = brille ? `<g class="sq-sparkles" fill="#FFE45C" stroke="#fff" stroke-width="1.2">${SQ_SPARKLE(10, 22, 7)}${SQ_SPARKLE(92, 34, 6)}${SQ_SPARKLE(86, 96, 5)}</g>` : '';
  return `<svg class="sq-art${brille ? ' sq-brille' : ''}" viewBox="-6 -8 112 124" data-sq="${id}" aria-hidden="true">
    ${opts.silhouette ? `<g class="sq-sil">${inner}</g>` : inner}${sparkles}
  </svg>`;
}

// Une boîte surprise (la couleur dit sa série ; violette avec « ? » : mystère)
const SQ_BOX_COLORS = { capy:['#FFC98F','#C8661A'], desserts:['#FFB8D6','#C9497F'], animaux:['#A6E8B8','#2F9551'], boites:['#EFC896','#8A5A2B'], jouets:['#FFD9E6','#B8577E'], bonbons:['#F6D7A8','#B5702E'], instruments:['#BFE9EC','#2B2F6B'], petitesbetes:['#CDEBC4','#4F8A45'], licornes:['#E3D6FB','#6A4FB3'] };
function squishyBoxSVG(series){
  const col = SQ_BOX_COLORS[series] || ['#CDB8F2','#7B5CC0'];
  return `<svg class="sq-boxart" viewBox="0 0 100 100" aria-hidden="true">
    <g class="sb-base"><rect x="16" y="44" width="68" height="50" rx="8" fill="${col[0]}" stroke="${col[1]}" stroke-width="4"/>
      <rect x="45" y="46" width="10" height="46" fill="#fff" opacity=".9"/>
      <circle cx="30" cy="70" r="9" fill="#fff" opacity=".9"/>
      <text x="30" y="75.5" text-anchor="middle" font-size="15" font-weight="800" fill="${col[1]}" font-family="'Baloo 2', system-ui, sans-serif">?</text></g>
    <g class="sb-lid"><rect x="10" y="30" width="80" height="18" rx="6" fill="${col[0]}" stroke="${col[1]}" stroke-width="4"/>
      <rect x="45" y="32" width="10" height="14" fill="#fff"/>
      <path d="M50 31 C40 12 22 20 34 31Z M50 31 C60 12 78 20 66 31Z" fill="#fff" stroke="${col[1]}" stroke-width="3" stroke-linejoin="round"/></g>
  </svg>`;
}
// La ligne « 🎁 Boîte surprise » des fenêtres de récompense (coffre, énigme)
function squishyBoxRewardHTML(series){
  const s = series && SQUISHY_SERIES[series];
  return `<div class="speech sq-reward-line">
    <span class="sq-reward-box">${squishyBoxSVG(series)}</span>
    <span><strong>1 boîte surprise</strong>${s ? ` ${s.emoji} ${s.name}` : ' de squishies'}</span>
  </div>`;
}

/* ---------- Pastille 🧸 : les boîtes à ouvrir ---------- */
function renderSquishyBadge(){
  const n = squishyBoxCount();
  [['squishy-badge', true], ['sq-room-link-n', false]].forEach(([elId, pulse])=>{
    const b = document.getElementById(elId);
    if(!b) return;
    b.hidden = !n;
    b.textContent = n;
    if(pulse) b.classList.toggle('ready', n > 0);
  });
}
onSquishyChange(renderSquishyBadge);
onProfileRefresh(renderSquishyBadge);

// Début de partie : la chambre n'a jamais été ouverte et des boîtes attendent
// (rattrapage de la migration, coffre…) : on le dit une fois, doucement.
function squishySessionHello(){
  const sq = sqState();
  if(sq.hello || !sq.boxes.length || document.getElementById('overlay').classList.contains('show')) return false;
  showToast(`🧸 Tu as ${sq.boxes.length} boîte${sq.boxes.length > 1 ? 's' : ''} surprise${sq.boxes.length > 1 ? 's' : ''} à ouvrir !`);
  return true;
}

/* ---------- Presser un squishy ---------- */
function squishyPress(el){
  if(!el) return;
  el.classList.remove('sq-press'); void el.offsetWidth; el.classList.add('sq-press');
  playSound('pouic');
  vibrate(25);
}

/* ---------- La chambre ---------- */
let sqRoomTab = 'collection';
let sqTimers = [];
function sqLater(fn, ms){ const t = setTimeout(()=>{ sqTimers = sqTimers.filter(x=> x !== t); fn(); }, ms); sqTimers.push(t); return t; }
function sqClearTimers(){ sqTimers.forEach(clearTimeout); sqTimers = []; }
// une animation ou une relance en attente ne survit pas à la fenêtre
onModalChange(sqClearTimers);

const SQ_TABS = [
  { id:'collection', icon:'📚', name:'Collection' },
  { id:'etagere',    icon:'🗄️', name:'Étagère' },
  { id:'ranger',     icon:'📦', name:'Ranger' },
];

function openSquishyRoom(tab, opts){
  tab = SQ_TABS.some(t=> t.id === tab) ? tab : (sqRoomTab || 'collection');
  sqRoomTab = tab;
  sqShelfSel = null;
  const sq = sqState();
  const first = !sq.hello;
  if(first){ sq.hello = true; save(); }
  const head = sqRoomHead(tab, opts);
  openModal(`
    ${gameHeader('🧸 Ma chambre à squishies', head.hint, head.say)}
    <div class="tabs sq-tabs">
      ${SQ_TABS.map(t=> `<button type="button" class="tab-btn ${t.id === tab ? 'active' : ''}" data-sqtab="${t.id}">${t.icon} ${t.name}</button>`).join('')}
    </div>
    <div class="sq-room" id="sq-room" data-tab="${tab}"></div>
  `);
  document.querySelectorAll('[data-sqtab]').forEach(b=>{
    b.onclick = ()=>{ playSound('tap'); openSquishyRoom(b.dataset.sqtab); };
  });
  bindQuit();
  if(tab === 'collection') renderSquishyCollection();
  else if(tab === 'etagere') renderSquishyShelf();
  else renderSquishySorting(head.task);
}

// la consigne de l'en-tête (et ce que dit la voix), selon l'onglet
function sqRoomHead(tab, opts){
  if(tab === 'collection'){
    const n = squishyBoxCount();
    const hint = n ? `Tu as ${n} boîte${n > 1 ? 's' : ''} surprise${n > 1 ? 's' : ''} à ouvrir !` : 'Touche un squishy pour le presser !';
    return { hint, say: hint };
  }
  if(tab === 'etagere'){
    const hint = 'Touche un squishy, puis une place sur l\'étagère';
    return { hint, say: hint + '.' };
  }
  const task = sqSortTask(opts);
  if(!task) return { hint:'Les boîtes de rangement', say:'Les boîtes de rangement.', task };
  return { hint:`${sortIconsHTML(task.criteria)}<span>${task.say} !</span>`, say: task.say + ' !', task };
}

/* ---- 📚 Collection ---- */
function sqCellHTML(id){
  const m = SQUISHIES[id], n = squishyCount(id);
  if(!n) return `<button type="button" class="sq-cell missing" data-miss="${id}" aria-label="Pas encore trouvé">${squishyArtSVG(id, { silhouette:true })}<span class="sq-name">?</span></button>`;
  return `<button type="button" class="sq-cell r-${m.rarity}" data-sq="${id}" aria-label="${m.name}${n > 1 ? ', ' + n : ''}">
    ${squishyArtSVG(id)}<span class="sq-name">${m.name}</span>
    ${n > 1 ? `<span class="sq-n">×${n}</span>` : ''}
    ${m.rarity !== 'commun' ? `<span class="sq-rar" aria-hidden="true">${m.rarity === 'rare' ? '⭐' : '✨'}</span>` : ''}
  </button>`;
}
function renderSquishyCollection(){
  const el = document.getElementById('sq-room');
  if(!el) return;
  const sq = sqState();
  const next = sq.boxes[0];
  el.innerHTML = `
    ${sq.boxes.length ? `<div class="sq-boxes" id="sq-boxes">
      <div class="sq-stage" id="sq-stage">${squishyBoxSVG(next)}${sq.boxes.length > 1 ? `<span class="sq-box-n">×${sq.boxes.length}</span>` : ''}</div>
      <button type="button" class="btn-primary sq-open" id="sq-open">Ouvrir ! 🎁</button>
    </div>` : ''}
    ${SQUISHY_SERIES_ORDER.filter(squishySeriesAvailable).map(series=>{
      const s = SQUISHY_SERIES[series], p = squishySeriesProgress(series);
      return `<section class="sq-series ${p.have === p.total ? 'complete' : ''}" data-series="${series}">
        <h3><span>${s.emoji} ${s.name}</span><span class="sq-prog">${p.have === p.total ? '🏆 ' : ''}${p.have} / ${p.total}</span></h3>
        <div class="quest-bar"><i style="width:${p.have / p.total * 100}%"></i></div>
        <div class="sq-grid">${squishiesOf(series).map(sqCellHTML).join('')}</div>
      </section>`;
    }).join('')}
    ${Object.keys(SQUISHY_TREASURES).some(squishyTreasureOwned) || archipelagoUnlocked(2) ? `<section class="sq-series sq-treasures" data-series="tresors">
      <h3><span>💎 Trésors</span><span class="sq-prog">${Object.keys(SQUISHY_TREASURES).filter(squishyTreasureOwned).length} / ${Object.keys(SQUISHY_TREASURES).length}</span></h3>
      <div class="sq-grid">${Object.keys(SQUISHY_TREASURES).map(id=> squishyTreasureOwned(id)
        ? `<button type="button" class="sq-cell owned treasure" data-sq="${id}" aria-label="${SQUISHY_TREASURES[id].name}">${squishyArtSVG(id)}<span class="sq-name">${SQUISHY_TREASURES[id].name}</span></button>`
        : `<div class="sq-cell treasure locked" data-treasure="${id}" aria-label="Un trésor à trouver : ${SQUISHY_TREASURES[id].how}">${squishyArtSVG(id, { silhouette:true })}<span class="sq-name">${SQUISHY_TREASURES[id].how}</span></div>`).join('')}</div>
    </section>` : ''}`;
  sqBindPress(el);
  const open = document.getElementById('sq-open');
  if(open) open.onclick = ()=> squishyOpenAnimated();
}
function sqBindPress(el){
  el.querySelectorAll('.sq-cell[data-sq]').forEach(b=>{
    b.onclick = ()=>{
      const id = b.dataset.sq, n = squishyCount(id);
      squishyPress(b);
      speak(`${(SQUISHIES[id] || SQUISHY_TREASURES[id]).name}${n > 1 ? `. Tu en as ${n}.` : ' !'}`);
    };
  });
  el.querySelectorAll('.sq-cell[data-treasure]').forEach(b=>{
    b.onclick = ()=>{ playSound('tap'); speak(`Un trésor unique ! ${SQUISHY_TREASURES[b.dataset.treasure].how}.`); };
  });
  el.querySelectorAll('.sq-cell[data-miss]').forEach(b=>{
    b.onclick = ()=>{ playSound('tap'); speak('Celui-là, tu ne l\'as pas encore. Ouvre des boîtes surprises pour le trouver !'); };
  });
}

// La boîte tremble, s'ouvre, et le squishy saute ; la voix dit son nom.
/* Pop, le diablotin à ressort du Monde des Boîtes (v55) : de temps en temps
   (1 fois sur 5), il surgit de la boîte pour le plaisir. Il ne change rien au
   tirage, qui a déjà eu lieu : son hasard (`popRng`) est à part. */
const SQ_POP_CHANCE = 0.2;
function squishyPopDue(popRng){ return (popRng || Math.random)() < SQ_POP_CHANCE; }
function squishyOpenAnimated(popRng){
  const btn = document.getElementById('sq-open'), stage = document.getElementById('sq-stage');
  if(!btn || !stage || btn.disabled) return;
  const res = openSquishyBox();
  if(!res) return;
  const pop = squishyPopDue(popRng);
  btn.disabled = true;
  stage.classList.add('shake');
  playSound('tap');
  sqLater(()=> playSound('tap'), 300);
  sqLater(()=>{
    stage.classList.remove('shake'); stage.classList.add('open'); playSound('box');
    if(pop){
      stage.insertAdjacentHTML('beforeend', `<span class="sq-pop-jack" aria-hidden="true">${squishyArtSVG('pop')}</span>`);
      playSound('pouic');
      speak('Pop !');
    }
  }, 900);
  sqLater(()=> squishyReveal(res), pop ? 1900 : 1300);
  return { res, pop };
}
function squishyReveal(res){
  const box = document.getElementById('sq-boxes');
  if(!box) return;
  const m = SQUISHIES[res.id];
  const left = squishyBoxCount();
  box.innerHTML = `
    <div class="sq-reveal r-${m.rarity} ${res.isNew ? 'is-new' : 'is-dup'}" id="sq-reveal">
      <button type="button" class="sq-cell sq-big" data-sq="${res.id}" aria-label="${m.name}">${squishyArtSVG(res.id)}</button>
      <span class="sq-tag">${res.isNew ? 'Nouveau !' : '×' + res.count}</span>
    </div>
    <p class="sq-reveal-name">${m.rarity === 'brille' ? '✨ ' : m.rarity === 'rare' ? '⭐ ' : ''}${m.name}</p>
    ${res.seriesCompleted ? `<div class="sq-complete" id="sq-complete">🏆 Série ${SQUISHY_SERIES[res.series].name} complète ! <span data-gain-coins>🪙</span> <b>+${SQ_SERIES_BONUS}</b></div>` : ''}
    <button type="button" class="btn-primary" id="sq-next">${left ? `Ouvrir la suivante 🎁 (${left})` : 'Voir ma collection 📚'}</button>`;
  // la consigne de l'en-tête suit le nombre de boîtes qui restent
  const head = sqRoomHead('collection'), ht = document.querySelector('.puzzle-hint .hint-txt'), hs = document.querySelector('.puzzle-hint [data-say]');
  if(ht) ht.textContent = head.hint;
  if(hs){ hs.dataset.say = head.say; bindQuit._last = head.say; }
  const say = m.say.charAt(0).toUpperCase() + m.say.slice(1);
  speak(`${say} !${res.isNew ? ' Il est nouveau !' : ` Tu en as ${res.count}.`}${res.seriesCompleted ? ` Bravo, la série ${SQUISHY_SERIES[res.series].name} est complète ! Tu gagnes ${SQ_SERIES_BONUS} pièces.` : ''}`);
  // la fête dépend de la rareté
  if(m.rarity === 'brille'){ playSound('sparkle'); confetti(); sqLater(confetti, 500); vibrate([40, 30, 40, 30, 120]); }
  else if(m.rarity === 'rare'){ playSound('win'); confetti(); vibrate([40, 30, 80]); }
  else { playSound(res.isNew ? 'win' : 'good'); if(res.isNew) vibrate(40); }
  if(res.seriesCompleted){
    sqLater(()=>{ playSound('win'); confetti(); gainCoins(SQ_SERIES_BONUS, document.getElementById('sq-complete')); }, 700);
  }
  const big = box.querySelector('.sq-cell[data-sq]');
  if(big) big.onclick = ()=> squishyPress(big);
  document.getElementById('sq-next').onclick = ()=>{ playSound('tap'); openSquishyRoom('collection'); };
}

/* ---- 🗄️ Étagère ---- */
let sqShelfSel = null;   // { id } (depuis la collection) ou { id, slot } (depuis l'étagère)
function renderSquishyShelf(){
  const el = document.getElementById('sq-room');
  if(!el) return;
  const sq = sqState();
  const owned = squishyOwnedIds();
  if(!owned.length){
    sqShelfSel = null;
    el.innerHTML = `<div class="empty-state"><span class="es-art">🗄️</span>Ton étagère t'attend !<br>Ouvre une boîte surprise pour trouver ton premier squishy.</div>`;
    return;
  }
  const sel = sqShelfSel;
  const tip = !sel ? '' : sel.slot != null
    ? `<div class="sq-shelf-tip">${squishyArtSVG(sel.id)}<span>Touche une autre place pour le déplacer.</span><button type="button" class="btn-small" id="sq-shelf-remove">Retirer ↩️</button></div>`
    : `<div class="sq-shelf-tip">${squishyArtSVG(sel.id)}<span>Touche une place sur l'étagère !</span></div>`;
  el.innerHTML = `
    <div class="sq-shelf ${sel ? 'picking' : ''}" id="sq-shelf">
      ${sq.shelf.map((id, i)=> `<button type="button" class="sq-slot ${id ? 'full' : ''} ${sel && sel.slot === i ? 'selected' : ''}" data-slot="${i}" aria-label="${id ? SQUISHIES[id].name : 'Place libre'}">${id ? squishyArtSVG(id) : ''}</button>`).join('')}
    </div>
    ${tip}
    <h3 class="sq-h">Ta collection</h3>
    <div class="sq-grid sq-pick">
      ${owned.map(id=>{
        const free = squishyCount(id) - squishyShelfCount(id);
        return `<button type="button" class="sq-cell ${free ? '' : 'used'} ${sel && sel.slot == null && sel.id === id ? 'selected' : ''}" data-pick="${id}" aria-label="${SQUISHIES[id].name}">
          ${squishyArtSVG(id)}<span class="sq-name">${SQUISHIES[id].name}</span>${free > 1 ? `<span class="sq-n">×${free}</span>` : ''}</button>`;
      }).join('')}
    </div>`;
  el.querySelectorAll('[data-pick]').forEach(b=>{
    b.onclick = ()=>{
      const id = b.dataset.pick;
      squishyPress(b);
      if(squishyCount(id) - squishyShelfCount(id) <= 0){ speak('Il est déjà sur l\'étagère !'); return; }
      sqShelfSel = (sqShelfSel && sqShelfSel.slot == null && sqShelfSel.id === id) ? null : { id };
      if(sqShelfSel) speak(`${SQUISHIES[id].name}. Touche une place sur l'étagère !`);
      renderSquishyShelf();
    };
  });
  el.querySelectorAll('[data-slot]').forEach(b=>{
    b.onclick = ()=> squishyShelfTap(Number(b.dataset.slot), b);
  });
  const rm = document.getElementById('sq-shelf-remove');
  if(rm) rm.onclick = ()=>{
    playSound('tap');
    if(sqShelfSel && sqShelfSel.slot != null) shelfRemove(sqShelfSel.slot);
    sqShelfSel = null;
    renderSquishyShelf();
  };
}
function squishyShelfTap(slot, btn){
  const sq = sqState(), sel = sqShelfSel, here = sq.shelf[slot];
  if(!sel){
    if(!here){ playSound('tap'); speak('Choisis d\'abord un squishy dans ta collection, en dessous.'); return; }
    squishyPress(btn);
    sqShelfSel = { id: here, slot };
    renderSquishyShelf();
    return;
  }
  if(sel.slot != null){
    // depuis l'étagère : toucher sa place une 2ᵉ fois le retire ; une autre place le déplace (échange)
    if(sel.slot === slot) shelfRemove(slot);
    else { sq.shelf[sel.slot] = here || null; sq.shelf[slot] = sel.id; save(); }
  } else {
    shelfPlace(slot, sel.id);
  }
  playSound('pop');
  sqShelfSel = null;
  renderSquishyShelf();
}

/* ---- 📦 Ranger : les boîtes de rangement à consigne ---- */
let sqSort = null;   // { task, filled, errors, age }
function sqSortTask(opts){
  opts = opts || {};
  const age = currentPlayerAge();
  return makeSortingTask(sqState().owned, age, Math.random, { avoid: opts.avoid });
}
// La consigne en image, pour qui ne lit pas encore : la forme (remplie de la
// couleur s'il y en a une), sinon une pastille de couleur ; la taille par une
// paire « petit / grand » dont la bonne est foncée.
function sortIconsHTML(criteria){
  const get = (t)=> (criteria.find(c=> c.type === t) || {}).value;
  const color = get('color'), shape = get('shape'), size = get('size');
  const col = color && SQ_COLORS[color];
  const style = col ? ` style="background:${col.fill};border-color:${col.edge}"` : '';
  const pair = size ? `<span class="sr-ico sr-size sr-size-${size}"><i></i><i></i></span>` : '';
  let main = '';
  if(shape) main = `<span class="sr-ico sr-shape-${shape}"${style}></span>`;
  else if(color) main = `<span class="sq-dot"${style}></span>`;
  return `<span class="sr-icons" aria-hidden="true">${pair}${main}</span>`;
}
// le haut de l'onglet : la pile des boîtes rangées, et ce que rapporte la suivante
function sortTopHTML(){
  const sq = sqState(), left = sortingPaidLeft();
  return `<div class="sr-top" id="sr-top">
      <div class="sr-pile" aria-label="${sq.sorted} boîtes rangées">${Array.from({ length: Math.min(sq.sorted, 6) }, ()=> '<i></i>').join('')}<b>${sq.sorted}</b>&nbsp;rangée${sq.sorted > 1 ? 's' : ''}</div>
      <div class="sr-pay">${left ? `🪙 +${SQ_SORT_REWARD} <small>(encore ${left} aujourd'hui)</small>` : '😊 Pour le plaisir'}</div>
    </div>`;
}
function renderSquishySorting(task){
  const el = document.getElementById('sq-room');
  if(!el) return;
  const models = squishyOwnedIds().length;
  const pile = sortTopHTML();
  if(!task){
    sqSort = null;
    const msg = models < SQ_SORT_MIN_MODELS
      ? `Il te faut au moins ${SQ_SORT_MIN_MODELS} squishies différents pour ranger. Tu en as ${models}. Ouvre des boîtes surprises !`
      : 'Il te faut encore quelques squishies pareils pour remplir une boîte. Ouvre des boîtes surprises !';
    el.innerHTML = `${pile}<div class="empty-state sr-empty"><span class="es-art">📦</span>${msg}</div>
      ${squishyBoxCount() ? `<button type="button" class="btn-primary" id="sr-go-open">Ouvrir mes boîtes 🎁</button>` : ''}`;
    speak(msg);
    const go = document.getElementById('sr-go-open');
    if(go) go.onclick = ()=>{ playSound('tap'); openSquishyRoom('collection'); };
    return;
  }
  sqSort = { task, filled:0, errors:0, age: currentPlayerAge() };
  el.innerHTML = `${pile}
    <div class="sr-crate" id="sr-crate" aria-label="La boîte de rangement">
      ${Array.from({ length: SQ_SORT_SLOTS }, (_, i)=> `<span class="sr-cell" data-cell="${i}"></span>`).join('')}
    </div>
    <div class="sr-board">
      ${task.items.map((id, i)=> `<button type="button" class="sq-cell sr-item" data-i="${i}" aria-label="${SQUISHIES[id].name}">${squishyArtSVG(id)}<span class="sq-check" aria-hidden="true">✓</span></button>`).join('')}
    </div>`;
  const q = { task };
  setHintQuestion('rangement', q, { choices:'.sr-item', noCount:true });
  el.querySelectorAll('.sr-item').forEach(b=>{
    b.onclick = ()=> squishySortTap(b, q);
  });
}
function squishySortTap(btn, q){
  const run = sqSort;
  if(!run || btn.disabled || run.filled >= SQ_SORT_SLOTS || run.errors >= SQ_SORT_MAX_ERRORS) return;
  const id = run.task.items[Number(btn.dataset.i)];
  if(sortMatches(id, run.task.criteria)){
    btn.disabled = true; btn.classList.add('placed');
    const cell = document.querySelector(`.sr-cell[data-cell="${run.filled}"]`);
    if(cell){ cell.innerHTML = squishyArtSVG(id); cell.classList.add('in'); }
    run.filled++;
    q.filled = run.filled;
    playSound('good'); vibrate(30);
    if(run.filled >= SQ_SORT_SLOTS) sqLater(()=> squishySortWin(run), 450);
    return;
  }
  // anti-devinette : il rebondit, avec un indice parlé ; 2 erreurs → autre consigne
  run.errors++;
  btn.classList.remove('sr-bounce'); void btn.offsetWidth; btn.classList.add('sr-bounce');
  playSound('wrong'); vibrate(80);
  hintNudge(true);
  if(run.errors >= SQ_SORT_MAX_ERRORS){
    recordSorting(false, run.errors, run.task.level, run.age);
    speak(`${sortWrongHint(id, run.task.criteria)} On essaie une autre boîte !`);
    sqLater(()=> openSquishyRoom('ranger', { avoid: run.task.key }), 2200);
  } else {
    speak(sortWrongHint(id, run.task.criteria));
  }
}
function squishySortWin(run){
  const coins = sortingDone(run.errors, run.task.level, run.age);
  const crate = document.getElementById('sr-crate');
  const board = document.querySelector('.sr-board');
  if(crate) crate.classList.add('done');
  playSound('win'); confetti(); vibrate([50, 40, 120]);
  speak(`Bravo, la boîte est rangée !${coins ? ` Tu gagnes ${coins} pièces.` : ''}`);
  if(board) board.outerHTML = `<div class="sr-win">
      <p class="sr-win-txt">📦 Boîte rangée !${coins ? ` <span data-gain-coins>🪙</span> <b>+${coins}</b>` : ' <small>Pour le plaisir 😊</small>'}</p>
      <button type="button" class="btn-primary" id="sr-again">Encore une boîte 📦</button>
    </div>`;
  const top = document.getElementById('sr-top');
  if(top) top.outerHTML = sortTopHTML();
  if(coins) gainCoins(coins, crate);
  const again = document.getElementById('sr-again');
  if(again) again.onclick = ()=>{ playSound('tap'); openSquishyRoom('ranger'); };
}

// Indices du compagnon (v52) : 1. sur quoi porter son regard ; 2. combien
// il en reste, et une partie du plateau où se cache l'un d'eux.
function sortingHints(q){
  const cr = q.task.criteria;
  const one = (c)=> c.type === 'color' ? `la couleur : on cherche les ${SQ_COLORS[c.value].adj[1]}`
    : c.type === 'shape' ? `la forme : on cherche les ${SQ_SORT_SHAPES[c.value].p}`
    : `la taille : on cherche les ${SQ_SORT_SIZES[c.value].p}`;
  const first = cr.length > 1
    ? { say:`Il faut les deux à la fois : ${sortSay(cr).replace('Range les ', '')}. Regarde chaque squishy deux fois !`, fx:{ glow:'.puzzle-hint' } }
    : { say:`Regarde seulement ${one(cr[0])}.`, fx:{ glow:'.puzzle-hint' } };
  // trois squishies qui brillent, dont au moins un à ranger
  const free = [...document.querySelectorAll('.sr-board .sr-item:not(:disabled)')];
  const good = free.filter(b=> sortMatches(q.task.items[Number(b.dataset.i)], cr));
  const pick = good[0] ? [good[0], ...free.filter(b=> b !== good[0]).slice(0, 2)] : [];
  const left = SQ_SORT_SLOTS - (q.filled || 0);
  return [first, {
    say:`Il en reste ${left} à ranger. Regarde bien parmi ceux qui brillent !`,
    fx:{ glow: pick.map(b=> `.sr-item[data-i="${b.dataset.i}"]`).join(', ') || '.sr-board' },
  }];
}
registerHints('rangement', sortingHints);

/* ---------- Entrées : le bouton 🧸 de l'en-tête et celui du Sac ---------- */
['squishy-btn', 'sq-room-link'].forEach(elId=>{
  const b = document.getElementById(elId);
  if(b) b.addEventListener('click', ()=>{ playSound('tap'); openSquishyRoom('collection'); });
});

export {
  openSquishyRoom, renderSquishyBadge, squishyArtSVG, squishyBoxRewardHTML, squishyBoxSVG,
  squishySessionHello
};
