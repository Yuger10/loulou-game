/* ---------- Mini-jeu : Le gâteau partagé (Royaume des Bonbons, saison 2) ----------
   Partager en parts égales, puis la moitié, le tiers et le quart : d'abord
   avec les yeux, puis avec les mots, puis avec les écritures ½, ⅓, ¼.
   Quatre façons de jouer, selon le palier (`shareRound`, js/entities/difficulty/difficulty.js) :
     fair    « Quel gâteau est coupé en 2 (ou 4) parts égales ? »
     show    « Montre le quart du gâteau » (la part colorée)
     write   « Quelle écriture montre la part colorée ? » (½, ⅓, ¼)
     whole   « Combien de quarts pour faire une moitié ? »
   Le gâteau est rond (parts en secteurs) ou rectangulaire (une tablette,
   parts en bandes). Anti-devinette : une erreur relance un AUTRE gâteau. */
import { shareRound } from '../../../entities/difficulty/index.js';
import { shuffle } from '../../../shared/lib/index.js';
import { openModal } from '../../../shared/ui/index.js';
import { gameDiff } from '../../adaptive/index.js';
import { registerHints, setHintQuestion } from '../../hints/index.js';
import {
  clearActiveTimer, flashModal, livesBar, loseLife, onMissionWin, registerGame, setSolution,
  setupLives, solSel, startTimerIfNeeded, stepOk
} from '../../minigame-engine/index.js';
import { bindQuit, gameHeader } from '../../screen/index.js';

const SHARE_FRACS = {
  2: { word:'la moitié', sym:'½' },
  3: { word:'le tiers',  sym:'⅓' },
  4: { word:'le quart',  sym:'¼' },
};
// parts inégales (en fractions du gâteau) : bien différentes, puis plus proches
const SHARE_UNEQUAL = {
  far:  { 2:[[.25, .75], [.72, .28], [.3, .7]], 3:[[.2, .3, .5], [.5, .2, .3]], 4:[[.1, .2, .3, .4], [.4, .1, .35, .15], [.15, .35, .15, .35]] },
  near: { 2:[[.4, .6], [.62, .38], [.36, .64]], 3:[[.25, .35, .4]], 4:[[.2, .3, .2, .3], [.3, .2, .25, .25]] },
};
// « Combien de… pour faire… ? » : la question, la réponse, ce que l'on montre
const SHARE_WHOLE = [
  { key:'quarts-moitie', say:'Combien de quarts faut-il pour faire une moitié ?', ans:2, show:[2, 4] },
  { key:'quarts-entier', say:'Combien de quarts faut-il pour faire le gâteau entier ?', ans:4, show:[4] },
  { key:'moities-entier', say:'Combien de moitiés faut-il pour faire le gâteau entier ?', ans:2, show:[2] },
  { key:'tiers-entier', say:'Combien de tiers faut-il pour faire le gâteau entier ?', ans:3, show:[3] },
];
const equalParts = (n)=> Array.from({ length: n }, ()=> 1 / n);

/* Un gâteau (SVG 100×100). parts : fractions du gâteau (somme 1) ;
   shaded : la part colorée (-1 : aucune). Chaque part a la classe share-part. */
function shareCakeSVG(shape, parts, shaded){
  const cream = '#FFF1D6', pink = '#FF8FB8', edge = '#B5702E';
  let body = '';
  if(shape === 'rond'){
    const cx = 50, cy = 54, r = 40;
    let a = -90;
    parts.forEach((f, i)=>{
      const a2 = a + f * 360;
      const p = (deg)=> [cx + r * Math.cos(deg * Math.PI / 180), cy + r * Math.sin(deg * Math.PI / 180)].map(v=> v.toFixed(1)).join(' ');
      body += parts.length === 1
        ? `<circle class="share-part" cx="${cx}" cy="${cy}" r="${r}" fill="${i === shaded ? pink : cream}"/>`
        : `<path class="share-part" d="M${cx} ${cy} L${p(a)} A${r} ${r} 0 ${f > .5 ? 1 : 0} 1 ${p(a2)}Z" fill="${i === shaded ? pink : cream}"/>`;
      a = a2;
    });
    body = `<g stroke="${edge}" stroke-width="2.6" stroke-linejoin="round">${body}</g><circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${edge}" stroke-width="3.5"/>`;
  } else {
    const x0 = 8, y0 = 22, w = 84, h = 60;
    let x = x0;
    parts.forEach((f, i)=>{
      body += `<rect class="share-part" x="${x.toFixed(1)}" y="${y0}" width="${(f * w).toFixed(1)}" height="${h}" fill="${i === shaded ? pink : cream}"/>`;
      x += f * w;
    });
    body = `<rect x="${x0}" y="${y0 - 6}" width="${w}" height="10" rx="5" fill="#fff" stroke="${edge}" stroke-width="2.5"/>
      <g stroke="${edge}" stroke-width="2.6">${body}</g><rect x="${x0}" y="${y0}" width="${w}" height="${h}" rx="4" fill="none" stroke="${edge}" stroke-width="3.5"/>`;
  }
  return `<svg class="share-cake" viewBox="0 0 100 100" aria-hidden="true">${body}</svg>`;
}

function shareBuildRound(dd, rng){
  rng = rng || Math.random;
  const cfg = shareRound(dd);
  const pick = (arr)=> arr[Math.floor(rng() * arr.length)];
  const shape = rng() < .5 ? 'rond' : 'carre';
  if(cfg.ask === 'fair'){
    const n = pick(cfg.parts);
    const pool = shuffle(SHARE_UNEQUAL[cfg.near ? 'near' : 'far'][n].slice());
    const opts = shuffle([{ parts: equalParts(n), equal:true }, { parts: pool[0], equal:false }, { parts: pool[1 % pool.length].slice().reverse(), equal:false }]);
    return { cfg, ask:'fair', shape, n, opts: opts.map((o, k)=> Object.assign(o, { k, shaded:-1 })) };
  }
  if(cfg.ask === 'show'){
    const n = pick(cfg.fracs);
    const others = shuffle([2, 3, 4].filter(x=> x !== n));
    const list = [{ parts: equalParts(n), n, equal:true }, { parts: equalParts(others[0]), n: others[0], equal:true }];
    if(cfg.trap){
      // le piège : le bon nombre de parts, mais pas égales (la plus grosse est colorée)
      const un = pick(SHARE_UNEQUAL.far[n]);
      list.push({ parts: un, n, equal:false, shaded: un.indexOf(Math.max(...un)) });
    } else list.push({ parts: equalParts(others[1]), n: others[1], equal:true });
    const opts = shuffle(list).map((o, k)=> Object.assign({ shaded:0 }, o, { k }));
    return { cfg, ask:'show', shape, n, opts };
  }
  // palier 5 : l'écriture, ou « combien de… pour faire… ? »
  if(rng() < cfg.whole){
    const w = pick(SHARE_WHOLE);
    return { cfg, ask:'whole', shape, whole: w, n: w.ans };
  }
  const n = pick(cfg.fracs);
  return { cfg, ask:'write', shape, n };
}
const shareKey = (r)=> `${r.ask}-${r.n}-${r.shape}-${r.whole ? r.whole.key : ''}-${(r.opts || []).map(o=> o.parts.join(',')).join('|')}`;

let shareLast = '';
function renderShare(){
  setupLives('share');
  const dd = gameDiff();
  let r = shareBuildRound(dd);
  for(let k = 0; k < 8 && shareKey(r) === shareLast; k++) r = shareBuildRound(dd);
  shareLast = shareKey(r);
  const q = { ask: r.ask, n: r.n, whole: r.whole ? r.whole.key : null, trap: !!r.cfg.trap };
  let title, say, stage = '', options, good;
  if(r.ask === 'fair'){
    title = `Quel gâteau est coupé en ${r.n} parts égales ?`;
    say = `Chouquette veut partager son gâteau entre ${r.n} amis. Quel gâteau est coupé en ${r.n} parts égales ?`;
    options = r.opts.map(o=> `<button class="share-opt" data-k="${o.k}" data-equal="${o.equal ? 1 : 0}" data-n="${o.parts.length}" aria-label="Gâteau ${o.k + 1}">${shareCakeSVG(r.shape, o.parts, -1)}</button>`).join('');
    good = r.opts.find(o=> o.equal).k;
  } else if(r.ask === 'show'){
    const fr = SHARE_FRACS[r.n];
    title = `Sur quel gâteau la part rose est-elle ${fr.word} ?`;
    say = `Sur quel gâteau la part rose est-elle ${fr.word} du gâteau ?`;
    options = r.opts.map(o=> `<button class="share-opt" data-k="${o.k}" data-equal="${o.equal ? 1 : 0}" data-n="${o.parts.length}" aria-label="Gâteau ${o.k + 1}">${shareCakeSVG(r.shape, o.parts, o.shaded)}</button>`).join('');
    good = r.opts.find(o=> o.equal && o.n === r.n).k;
  } else if(r.ask === 'write'){
    title = 'Quelle écriture montre la part rose ?';
    say = 'Quelle écriture montre la part rose du gâteau ?';
    stage = `<div class="share-stage" data-n="${r.n}">${shareCakeSVG(r.shape, equalParts(r.n), 0)}</div>`;
    options = shuffle([2, 3, 4]).map(n=> `<button class="num-btn share-opt share-frac" data-k="${n}" data-v="1/${n}" aria-label="un ${n === 2 ? 'demi' : n === 3 ? 'tiers' : 'quart'}">${SHARE_FRACS[n].sym}</button>`).join('');
    good = r.n;
  } else {
    title = r.whole.say;
    say = r.whole.say;
    stage = `<div class="share-stage" data-q="${r.whole.key}">${r.whole.show.map(n=> shareCakeSVG(r.shape, equalParts(n), 0)).join('')}</div>`;
    options = shuffle([2, 3, 4]).map(n=> `<button class="num-btn share-opt" data-k="${n}" data-v="${n}" aria-label="${n}"><b>${n}</b></button>`).join('');
    good = r.whole.ans;
  }
  openModal(`
    ${gameHeader('🎂 Le gâteau partagé', title, say)}
    ${livesBar()}
    ${stage}
    <div class="share-options${r.ask === 'write' || r.ask === 'whole' ? ' num-options' : ''}" data-ask="${r.ask}" data-n="${r.n}">${options}</div>
  `);
  bindQuit();
  startTimerIfNeeded('share');
  setSolution([solSel('.share-opt', 'k', good)]);
  setHintQuestion('share', q, { choices:'.share-opt' });
  document.querySelectorAll('.share-opt').forEach(btn=>{
    btn.onclick = ()=>{
      if(btn.dataset.k === String(good)){ clearActiveTimer(); stepOk(btn); flashModal('ok'); setTimeout(onMissionWin, 350); }
      else loseLife(btn, { onRetry: renderShare });
    };
  });
}

// Indices (v52) : 1. ce que veut dire « parts égales » ou « le quart » ;
// 2. ce qu'il faut regarder ou compter. Jamais le bon gâteau ni le nombre.
function shareHints(q){
  if(q.ask === 'fair') return [
    { say:'Des parts égales ont toutes exactement la même taille : aucune n\'est plus grosse que les autres.', fx:{ glow:'.share-options' } },
    { say:`Regarde chaque gâteau, une part après l'autre : ses ${q.n} parts sont-elles toutes aussi grandes ?`, fx:{ glow:'.share-options' } },
  ];
  if(q.ask === 'show') return [
    { say:'La moitié, c\'est une part sur 2 parts égales ; le tiers, une part sur 3 ; le quart, une part sur 4.', fx:{ glow:'.share-options' } },
    { say:`Pour ${SHARE_FRACS[q.n].word}, le gâteau doit être coupé en ${q.n} parts égales. Compte les parts de chaque gâteau${q.trap ? ', et vérifie qu\'elles sont pareilles' : ''}.`, fx:{ glow:'.share-options' } },
  ];
  if(q.ask === 'write') return [
    { say:'Dans ½, ⅓ ou ¼, le chiffre du bas dit en combien de parts égales le gâteau est coupé.', fx:{ glow:'.share-stage' } },
    { say:'Compte les parts du gâteau, puis cherche l\'écriture qui a ce nombre en bas.', fx:{ glow:'.share-stage' } },
  ];
  const tips = {
    'quarts-moitie': 'Coupe la moitié en deux dans ta tête : chaque petite part est un quart. Combien y en a-t-il ?',
    'quarts-entier': 'Un quart, c\'est une part d\'un gâteau coupé en parts égales. Compte toutes les parts du gâteau.',
    'moities-entier': 'Une moitié, c\'est une part d\'un gâteau coupé en parts égales. Compte toutes les parts du gâteau.',
    'tiers-entier': 'Un tiers, c\'est une part d\'un gâteau coupé en parts égales. Compte toutes les parts du gâteau.',
  };
  return [
    { say:'Un quart, c\'est une part d\'un gâteau coupé en 4 ; une moitié, une part d\'un gâteau coupé en 2.', fx:{ glow:'.share-stage' } },
    { say: tips[q.whole] || tips['quarts-entier'], fx:{ glow:'.share-stage' } },
  ];
}

registerGame('share', renderShare);
registerHints('share', shareHints);
