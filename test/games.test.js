// Chaque mini-jeu joué jusqu'à la victoire, à chaque palier ; la mémoire
// jouée « pour de vrai » jusqu'au bout ; le bouton son.
// Le temps du jeu est accéléré ×10 (minuteries du jeu) pour que tout tienne
// en quelques secondes ; l'ordre des événements, lui, ne change pas.
const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
// CSS et JS inlinés dans l'ordre du manifeste des slices (js/slices.cjs)
const html = require('./tools/page.js').buildHtml();

const SPEED = 0.1;   // minuteries du jeu 10 fois plus courtes
const spoken = [];
const dom = new JSDOM(html, {
  runScripts:'dangerously', pretendToBeVisual:true, url:'http://localhost/?saison=aucune',
  beforeParse(win){
    const st = win.setTimeout.bind(win), si = win.setInterval.bind(win);
    win.setTimeout = (fn, ms, ...a)=> st(fn, Math.round((ms || 0) * SPEED), ...a);
    win.setInterval = (fn, ms, ...a)=> si(fn, Math.max(1, Math.round((ms || 0) * SPEED)), ...a);
    // voix : on note ce qui serait dit
    win.SpeechSynthesisUtterance = function(text){ this.text = text; };
    win.speechSynthesis = { speaking:false, cancel(){}, getVoices:()=>[], speak(u){ spoken.push(u.text); } };
  },
});
const w = dom.window, d = w.document;
w.confirm = ()=>true;
const errs = [];
w.addEventListener('error', e=>errs.push(e.message));
const ev = (code)=> w.eval(code);
const wait = ms => new Promise(r=>setTimeout(r, ms));
async function waitFor(cond, ms = 3000){
  const t0 = Date.now();
  while(Date.now() - t0 < ms){ if(cond()) return true; await wait(10); }
  return !!cond();
}
let failed = 0, passed = 0;
function check(name, cond){ if(cond) passed++; else { failed++; console.log('❌ ' + name); } }
function section(name){ console.log('— ' + name); }

// L'âge et l'île fixent le palier ; le niveau propre au jeu (v42) le plafonne :
// on met le jeu « acquis » au palier voulu, sur une île au moins aussi difficile.
const ISLAND_FOR_TIER = { 1:'lagon', 2:'foret', 3:'montagne', 4:'chateau', 5:'jungle', 6:'volcan' };
function startGame(key, tier){
  ev(`closeModal(); party.active = false; currentProfile().age = 0;
      state.missions = 200; currentWorld = ${JSON.stringify(ISLAND_FOR_TIER[tier])};
      state.skills = { ${key}: { wins:0, fails:0, errors:0, last:null, recent:[], lvl:${tier} } };
      playGame(${JSON.stringify(key)})`);
}

// Vérifications indépendantes : la solution du jeu correspond à ce qui est affiché
const INDEPENDENT = {
  count(sol){ return Number(d.querySelector(sol[0]).dataset.v) === d.querySelectorAll('.count-row span').length; },
  math(sol){
    const [a, b] = [...d.querySelectorAll('.math-equation .eq-num')].map(e=>Number(e.textContent));
    const op = d.querySelector('.math-equation .eq-op').textContent.trim();
    const groups = [...d.querySelectorAll('.math-illustration .math-group')].map(g=>g.children.length);
    const r = op === '+' ? a + b : a - b;
    return Number(d.querySelector(sol[0]).dataset.v) === r && groups[0] === a && groups[1] === b;
  },
  calc(sol){
    const expr = d.querySelector('.calc-expr').textContent.replace(/×/g,'*').replace(/−/g,'-');
    if(!/^[0-9+\-* ]+$/.test(expr)) return false;
    return Number(d.querySelector(sol[0]).dataset.v) === Function('return ' + expr)();
  },
  compare(sol){
    const [a, b] = [...d.querySelectorAll('.cmp-num')].map(e=>Number(e.textContent));
    return d.querySelector(sol[0]).dataset.v === (a < b ? '<' : a > b ? '>' : '=');
  },
  money(sol){
    const target = parseInt(d.querySelector('.money-price').textContent, 10);
    const sum = [...d.querySelector(sol[0]).querySelectorAll('.coin-chip')].reduce((s, c)=> s + Number(c.textContent), 0);
    return sum === target && Number(d.querySelector(sol[0]).dataset.v) === target;
  },
  diff(sol){
    const el = d.querySelector(sol[0]), items = [...d.querySelectorAll('.diff-item')];
    if(el.classList.contains('mirror')) return items.every(i=> i === el || i.textContent === el.textContent);
    return items.filter(i=> i.textContent === el.textContent).length === 1;
  },
  sequence(sol){
    const shown = [...d.querySelectorAll('.seq-row span:not(.q)')].map(s=>s.textContent);
    let p = 1; while(p < shown.length && !shown.every((x, i)=> i < p || x === shown[i - p])) p++;
    return d.querySelector(sol[0]).dataset.v === shown[shown.length - p];
  },
  puzzle(sol){
    const ns = sol.map(s=> Number(d.querySelector(s).dataset.n));
    const diffs = ns.slice(1).map((n, i)=> n - ns[i]);
    return ns.length === d.querySelectorAll('.puzzle-btn').length && diffs.every(x=> x === diffs[0]) && [1,-1,2].includes(diffs[0]);
  },
  calendar(sol){
    if(!d.querySelector('.weekday-btn')) return true;   // « Quelle saison ? » : vérifié par la victoire
    const days = sol.map(s=> d.querySelector(s).dataset.w), order = ev('WEEKDAYS');
    return days.every((x, i)=> i === 0 || order.indexOf(x) === order.indexOf(days[i - 1]) + 1);
  },
  jigsaw(sol){ return sol.length === 2 * d.querySelectorAll('.jg-slot').length; },
  // gigognes (v55) : toutes les boîtes, de la plus petite à la plus grande (ou l'inverse)
  nesting(sol){
    const sizes = sol.map(s=> Number(d.querySelector(s).dataset.size));
    const up = sizes.every((x, i)=> i === 0 || x > sizes[i - 1]), down = sizes.every((x, i)=> i === 0 || x < sizes[i - 1]);
    return sol.length === d.querySelectorAll('.nest-btn').length && (up || down);
  },
  // cubes (v55) : la bonne réponse est le nombre de cubes dessinés (cachés compris)
  cubes(sol){ return Number(d.querySelector(sol[0]).dataset.v) === d.querySelectorAll('.cubes-svg .cube').length; },
  // paquets : la bonne réponse est le nombre de jouets dessinés (paquets et jouet seul)
  packs(sol){ return Number(d.querySelector(sol[0]).dataset.v) === d.querySelectorAll('.packs-stage .pack-toy').length; },
  // étagère : chaque case est à la croisée de la ligne de la couleur et de la colonne de la forme
  shelf(sol){
    const els = sol.map(s=> d.querySelector(s));
    if(d.querySelector('.shelf-opt')){
      const t = d.querySelector('.shelf-cell.target'), o = els[0];
      return sol.length === 1 && o.dataset.color === t.dataset.color && o.dataset.shape === t.dataset.shape;
    }
    const todo = [...d.querySelectorAll('.shelf-todo')];
    return els.length === todo.length && els.every((c, i)=> c.dataset.color === todo[i].dataset.color && c.dataset.shape === todo[i].dataset.shape
      && !c.classList.contains('filled'));
  },
};

async function playToWin(key, tier){
  startGame(key, tier);
  const sol = ev('gameSolution');
  if(!sol || !sol.length) return 'pas de solution';
  if(sol.some(s=> !d.querySelector(s))) return 'élément introuvable : ' + sol.find(s=> !d.querySelector(s));
  if(INDEPENDENT[key] && !INDEPENDENT[key](sol)) return 'la solution ne correspond pas à l\'écran';
  if(key === 'simon' && !(await waitFor(()=> (d.getElementById('simon-state') || {}).textContent === '👆 À toi !'))) return 'Simon ne rend pas la main';
  for(const s of sol){
    const el = d.querySelector(s);
    if(!el) return 'élément disparu : ' + s;
    el.click();
    await wait(key === 'memory' ? 45 : 5);
  }
  if(!(await waitFor(()=> !!d.querySelector('.win-box')))) return 'pas d\'écran de victoire';
  return 'ok';
}

(async ()=>{
  await wait(100);
  // un joueur
  d.getElementById('btn-splash-play').click();
  d.getElementById('name-input').value = 'Testeur';
  d.querySelector('.avatar-opt').click();
  d.getElementById('btn-start').click();
  await wait(150);                       // le premier chapitre de l'histoire s'ouvre…
  ev('closeModal(); state.storySolved = { lagon: true }; save()');   // …on le referme

  /* ---- 1. chaque mini-jeu, à chaque palier, jusqu'à la victoire ---- */
  section('Chaque mini-jeu jusqu\'à la victoire');
  const games = ev('GAME_TYPES');
  const maxTier = { calc:6, shapes:6, planets:6 };
  const ROUNDS = 3;     // plusieurs tirages : les jeux changent de question et de variante
  let played = 0;
  for(const key of games){
    for(let tier = 1; tier <= (maxTier[key] || 5); tier++){
      for(let r = 0; r < (key === 'simon' || key === 'memory' ? 1 : ROUNDS); r++){
        const res = await playToWin(key, tier);
        played++;
        check(`${key} palier ${tier} (tirage ${r + 1}) : ${res}`, res === 'ok');
      }
    }
  }
  console.log(`  ${played} parties jouées`);
  check('les 22 mini-jeux sont testés', games.length >= 22);

  /* ---- 2. une mauvaise réponse ne fait jamais gagner ---- */
  section('Une mauvaise réponse ne fait pas gagner');
  for(const [key, wrongSel] of [['count','.num-btn'],['math','.num-btn'],['compare','.cmp-btn'],['money','.money-pile-btn'],['clock','.clock-opt-btn'],['reading','.reading-opt'],['determinants','.det-btn'],['planets','.pl-opt']]){
    startGame(key, 2);
    const sol = ev('gameSolution');
    if(sol.length !== 1){ check(`${key} : une seule bonne réponse attendue`, false); continue; }
    const good = d.querySelector(sol[0]);
    const wrong = [...d.querySelectorAll(wrongSel)].find(b=> b !== good);
    const errBefore = ev('missionErrors');
    wrong.click();
    await wait(30);
    check(`${key} : mauvaise réponse → pas de victoire, une erreur notée`, !d.querySelector('.win-box') && ev('missionErrors') === errBefore + 1);
  }

  /* ---- 3. la mémoire, jouée pour de vrai jusqu'au bout ---- */
  section('Mémoire jouée jusqu\'au bout');
  for(const tier of [1, 2, 5]){
    startGame('memory', tier);
    const known = {};   // id → emoji vu
    const flip = async (id)=>{ d.querySelector(`.mcard[data-id="${id}"]`).click(); await wait(2); return d.querySelector(`.mcard[data-id="${id}"]`).textContent; };
    let moves = 0, mistakes = 0;
    const total = d.querySelectorAll('.mcard').length;
    while(!d.querySelector('.win-box') && !d.querySelector('.fail-box') && moves < 60){
      const open = [...d.querySelectorAll('.mcard:not(.matched)')].map(e=> Number(e.dataset.id));
      if(!open.length) break;
      // une paire déjà vue ? on la joue ; sinon une carte inconnue
      const byEmoji = {};
      open.filter(id=> known[id]).forEach(id=> (byEmoji[known[id]] = byEmoji[known[id]] || []).push(id));
      const pair = Object.values(byEmoji).find(ids=> ids.length >= 2);
      let a, b;
      if(pair){ [a, b] = pair; await flip(a); await flip(b); }
      else {
        a = open.find(id=> !known[id]);
        known[a] = await flip(a);
        const match = open.find(id=> id !== a && known[id] === known[a]);
        b = match !== undefined ? match : open.find(id=> id !== a && !known[id]);
        if(b === undefined) b = open.find(id=> id !== a);
        known[b] = await flip(b);
        if(known[a] !== known[b]) mistakes++;
      }
      moves++;
      await waitFor(()=> d.querySelectorAll('.mcard.flipped').length === 0, 500);
    }
    const won = await waitFor(()=> !!d.querySelector('.win-box'), 1000);
    check(`mémoire palier ${tier} : toutes les paires trouvées (${total / 2} paires, ${moves} coups, ${mistakes} erreurs)`, won);
    check(`mémoire palier ${tier} : un enfant qui retient tout ne peut pas perdre (essais ≥ paires)`, ev(`livesFor("memory", ${tier})`) >= total / 2);
    check(`mémoire palier ${tier} : chaque erreur comptée`, ev('state.skills.memory.recent.slice(-1)[0].e') === mistakes);
  }

  /* ---- 4. le bouton son ---- */
  section('Bouton son');
  ev('closeModal()');
  // faux moteur audio : on compte les notes jouées
  ev(`(function(){
    const param = ()=>({ value:0, setValueAtTime(){}, linearRampToValueAtTime(){}, exponentialRampToValueAtTime(){}, setTargetAtTime(){}, cancelScheduledValues(){} });
    const node = (x)=>Object.assign({ connect(n){ return n || this; }, disconnect(){} }, x);
    window.__osc = 0;
    window.AudioContext = class { constructor(){ this.currentTime = 0; this.state = 'running'; this.destination = node({}); }
      createOscillator(){ window.__osc++; return node({ type:'', frequency:param(), start(){}, stop(){} }); }
      createGain(){ return node({ gain:param() }); } createBiquadFilter(){ return node({ type:'', frequency:param() }); } resume(){} };
    audioCtx = null;
  })()`);
  const btn = d.getElementById('sound-btn');
  ev('state.sound = true; state.voice = true; state.music = false; save(); renderSoundBtn()');
  const states = [];
  for(let i = 0; i < 4; i++){ btn.click(); states.push(ev('[state.sound, state.voice, state.music].map(Number).join("")')); }
  check('son : le bouton fait le tour sons seuls → silence → musique → sons + voix', states.join(' ') === '100 000 111 110');
  check('son : chaque état a son icône et son nom pour les lecteurs d\'écran', !!btn.querySelector('svg') && btn.getAttribute('aria-label').length > 3);
  ev('state.sound = false; window.__osc = 0; playSound("win")');
  check('son : en silence, aucun bruitage', ev('window.__osc') === 0);
  ev('state.sound = true; window.__osc = 0; playSound("win")');
  check('son : avec le son, les bruitages jouent', ev('window.__osc') > 0);
  spoken.length = 0;
  ev('state.voice = false; speak("Bonjour")');
  check('voix : coupée, rien n\'est dit', spoken.length === 0);
  ev('state.voice = true; speak("Bonjour Testeur")');
  check('voix : allumée, la phrase est dite', spoken.length === 1 && spoken[0].includes('Bonjour'));
  ev('state.sound = true; state.voice = true; state.music = false; save(); renderSoundBtn(); audioCtx = null; delete window.AudioContext');

  check('aucune erreur JS', errs.length === 0);
  if(errs.length) console.log(errs.slice(0, 5));
  console.log(failed ? `\n${failed} test(s) en échec sur ${passed + failed}` : `\nTous les tests de jeu passent (${passed})`);
  process.exit(failed ? 1 : 0);
})();
