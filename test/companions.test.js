// Les compagnons et leurs rôles (v52) : indices (bouton 💡, 2 niveaux,
// anti-devinette, sans pénalité), équipe au niveau 10, rencontres, « Mon
// équipe », spécialités. Même harnais que test/games.test.js : le temps du
// jeu est accéléré ×10, la voix est notée au lieu d'être dite.
const { JSDOM } = require('jsdom');
const html = require('./tools/page.js').buildHtml();

const SPEED = 0.1;
const spoken = [];
const dom = new JSDOM(html, {
  runScripts:'dangerously', pretendToBeVisual:true, url:'http://localhost/?saison=aucune',
  beforeParse(win){
    const st = win.setTimeout.bind(win), si = win.setInterval.bind(win);
    win.setTimeout = (fn, ms, ...a)=> st(fn, Math.round((ms || 0) * SPEED), ...a);
    win.setInterval = (fn, ms, ...a)=> si(fn, Math.max(1, Math.round((ms || 0) * SPEED)), ...a);
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
function check(name, cond){ if(cond){ passed++; console.log('✅ ' + name); } else { failed++; console.log('❌ ' + name); } }
function section(name){ console.log('— ' + name); }
const lastSaid = ()=> spoken[spoken.length - 1] || '';

const ISLAND_FOR_TIER = { 1:'lagon', 2:'foret', 3:'montagne', 4:'chateau', 5:'jungle', 6:'volcan' };
// un jeu au palier voulu (comme test/games.test.js), en solo
function startGame(key, tier, opts){
  opts = opts || {};
  ev(`closeModal(); party.active = false; race.active = false; currentProfile().age = 0;
      state.missions = ${opts.missions || 200}; currentWorld = ${JSON.stringify(ISLAND_FOR_TIER[tier || 1])};
      state.skills = { ${key}: { wins:0, fails:0, errors:0, last:null, recent:[], lvl:${tier || 1} } };
      playGame(${JSON.stringify(key)})`);
}
const hintBtn = ()=> d.querySelector('#modal-body .hint-btn');
const wrongOf = (sel)=>{ const good = d.querySelector(ev('gameSolution')[0]); return [...d.querySelectorAll(sel)].find(b=> b !== good && !b.disabled); };

(async ()=>{
  await wait(100);
  d.getElementById('btn-splash-play').click();
  d.getElementById('name-input').value = 'Lou';
  d.querySelector('.avatar-opt').click();
  d.getElementById('btn-start').click();
  await wait(150);
  ev('closeModal(); state.storySolved = { lagon: true }; save()');

  /* ================= Phase 1 : contrat d'indices et bouton 💡 ================= */
  section('Contrat d\'indices');
  {
    const lv = ev('hintsFor("count", { n:6, emoji:"⭐" })');
    check('hintsFor renvoie exactement 2 niveaux', Array.isArray(lv) && lv.length === 2);
    check('chaque niveau a une phrase dite et un effet visuel', lv.every(h=> h.say.length > 5 && typeof h.fx === 'object'));
    check('indice 1 et indice 2 sont différents', lv[0].say !== lv[1].say);
    check('pas de 3ᵉ niveau, même si un jeu en proposait plus', ev(`registerHints("__t", ()=>[{say:"a"},{say:"b"},{say:"c"}]); hintsFor("__t", {}).length`) === 2);
    check('anti-devinette : aucune élimination sous 4 choix', !ev('hintMayEliminate(2, 3)') && !ev('hintMayEliminate(2, 2)'));
    check('anti-devinette : élimination permise au niveau 2 avec 4 choix (il en reste 3)', ev('hintMayEliminate(2, 4)') === true);
    check('anti-devinette : jamais au niveau 1', !ev('hintMayEliminate(1, 6)'));
  }

  section('Bouton 💡');
  startGame('count', 1);
  check('le bouton 💡 est dans l\'en-tête du mini-jeu', !!d.querySelector('#modal-body .game-head .hint-btn'));
  check('avec la tête du compagnon principal', hintBtn().querySelector(`svg[data-buddy="${ev('currentCompanion()')}"]`) !== null);
  check('il ne brille pas tout de suite', !hintBtn().classList.contains('nudge'));
  spoken.length = 0;
  hintBtn().click();
  check('indice 1 : une bulle avec la piste, dite à voix haute', !!d.querySelector('.hint-bubble') && d.querySelector('.hint-bubble').dataset.level === '1' && lastSaid().length > 5);
  const say1 = d.querySelector('.hint-bubble .hint-btext').textContent;
  hintBtn().click();
  check('indice 2 : une autre bulle (le coup de pouce)', d.querySelector('.hint-bubble').dataset.level === '2' && d.querySelector('.hint-bubble .hint-btext').textContent !== say1);
  check('indice 2 : les premiers objets sont numérotés, jamais tous', d.querySelectorAll('.count-row .hint-mark').length >= 1 && d.querySelectorAll('.count-row .hint-mark').length < d.querySelectorAll('.count-row span:not(.hint-mark)').length);
  check('après 2 indices : « Tu peux le faire ! » et le compagnon fait la fête', hintBtn().classList.contains('done') && /Tu peux le faire/.test(hintBtn().textContent) && !!hintBtn().querySelector('.buddy--cheer'));
  hintBtn().click();
  check('pas de 3ᵉ indice : la bulle reste au niveau 2', d.querySelector('.hint-bubble').dataset.level === '2' && ev('hint.level') === 2);
  check('les indices sont comptés pour l\'espace parents (skills.count.hints)', ev('state.skills.count.hints') === 2);
  check('un indice ne compte pas comme une erreur', ev('missionErrors') === 0);

  section('Proposition douce');
  startGame('count', 1);
  check('nouvelle partie : indices remis à zéro', ev('hint.level') === 0 && !d.querySelector('.hint-bubble'));
  wrongOf('.num-btn').click();
  check('après une erreur, le bouton brille et le compagnon réfléchit', hintBtn().classList.contains('nudge') && !!hintBtn().querySelector('.buddy--think'));
  await waitFor(()=> ev('hint.q') && !d.querySelector('.num-btn.ko'), 400);   // la relance (nouvelle question)
  check('la relance remet les indices à zéro, le bouton brille encore', ev('hint.level') === 0 && hintBtn() && hintBtn().classList.contains('nudge'));
  startGame('count', 1);
  const saidBefore = spoken.length;
  check('pas de lueur avant 10 secondes', !hintBtn().classList.contains('nudge'));
  const idleOk = await waitFor(()=> hintBtn() && hintBtn().classList.contains('nudge'), 1600);   // 10 s ×0,1
  check('après 10 secondes sans toucher, le bouton brille', idleOk);
  check('il ne parle pas de lui-même (l\'aide n\'est jamais imposée)', spoken.length === saidBefore);

  section('Sans pénalité');
  {
    // même mission, avec ou sans indice : même récompense, même niveau
    const play = async (withHints)=>{
      startGame('count', 2);
      if(withHints){ hintBtn().click(); hintBtn().click(); }
      const before = ev('({ missions: state.missions, items: Object.values(state.inventory).reduce((a,b)=>a+b,0) })');
      d.querySelector(ev('gameSolution')[0]).click();
      await waitFor(()=> !!d.querySelector('.win-box'));
      const after = ev('({ missions: state.missions, items: Object.values(state.inventory).reduce((a,b)=>a+b,0), e: state.skills.count.recent.slice(-1)[0].e, lvl: state.skills.count.lvl })');
      return { missions: after.missions - before.missions, items: after.items - before.items, e: after.e, lvl: after.lvl };
    };
    const a = await play(false), b = await play(true);
    check('une mission de plus, avec ou sans indice', a.missions === 1 && b.missions === 1);
    check('au moins un objet gagné, avec ou sans indice', a.items >= 1 && b.items >= 1);
    check('niveau adaptatif : un indice n\'est pas une erreur (0 erreur notée)', b.e === 0 && b.lvl === a.lvl);
    check('compteur d\'indices dans les progrès du jeu', ev('state.skills.count.hints') === 2);
  }
  ev('closeModal(); save(); load()');
  check('les indices sont gardés dans la sauvegarde', ev('state.skills.count.hints') === 2);
  ev('parentUnlockedUntil = Date.now() + 60000; openParentSpace()');
  check('espace parents : les indices sont montrés à côté des erreurs', /2 indices/.test(d.getElementById('modal-body').textContent));
  ev('closeModal()');

  section('Mode course');
  ev('race.active = true');
  ev('closeModal(); playGame("count")');
  check('en course : pas de bouton 💡', !hintBtn());
  ev('race.active = false; closeModal()');

  check('aucune erreur JS', errs.length === 0);
  if(errs.length) console.log(errs.slice(0, 5));
  console.log(failed ? `\n${failed} test(s) en échec sur ${passed + failed}` : `\nTous les tests des compagnons passent (${passed})`);
  process.exit(failed ? 1 : 0);
})();
