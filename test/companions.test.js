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
// une fenêtre fermée garde son contenu : on regarde aussi si elle est affichée
const shown = (sel)=> d.getElementById('overlay').classList.contains('show') && !!d.querySelector(sel);

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

  /* ================= Phase 2 : les indices de chaque mini-jeu ================= */
  section('Indices de chaque mini-jeu');
  {
    const games = ev('GAME_TYPES');
    const maxTier = { calc:6, shapes:6, planets:6 };
    const missing = games.filter(k=> !ev(`hasHints(${JSON.stringify(k)})`));
    check(`chaque type de mini-jeu inscrit a ses indices (${games.length} jeux)`, missing.length === 0);
    if(missing.length) console.log('   sans indices :', missing.join(', '));
    const problems = [];
    let rounds = 0;
    for(const key of games){
      for(let tier = 1; tier <= (maxTier[key] || 5); tier++){
        for(let r = 0; r < 2; r++){
          rounds++;
          startGame(key, tier);
          const where = `${key} palier ${tier}`;
          if(!hintBtn()){ problems.push(`${where} : pas de bouton 💡`); continue; }
          if(!hintBtn().querySelector(`svg[data-buddy="${ev('currentCompanion()')}"]`)) problems.push(`${where} : pas la tête du principal`);
          const lv = ev('hintsFor(hint.kind, hint.q)');
          if(lv.length !== 2 || !lv.every(h=> h.say.length > 8) || lv[0].say === lv[1].say) problems.push(`${where} : 2 indices distincts attendus`);
          if(lv[0].fx.dim) problems.push(`${where} : l'indice 1 ne doit rien écarter`);
          const sol = ev('gameSolution') || [];
          const solEls = sol.map(x=> d.querySelector(x));
          const choicesSel = ev('hint.choices');
          const nChoices = choicesSel ? ev('hintChoicesLeft()') : 0;
          // le texte ne donne jamais la réponse (jeux à une seule réponse chiffrée ou à signe)
          if(sol.length === 1 && solEls[0]){
            const ans = solEls[0].dataset.v;
            // jamais « = réponse », ni une comptine qui arrive jusqu'à la réponse (« 4, 5, 6… »)
            const says = (re)=> lv.some(h=> re.test(h.say));
            if(['math','calc'].includes(key) && (says(new RegExp(`= ${ans}(?![0-9])`)) || says(new RegExp(`(^|[^0-9])${ans}…`)))) problems.push(`${where} : un indice dit la réponse (${ans})`);
            if(key === 'count' && lv.some(h=> (h.say.match(/[0-9]+/g) || []).some(x=> Number(x) >= Number(ans)))) problems.push(`${where} : on compte jusqu'à la réponse (${ans})`);
            if(key === 'compare' && lv.some(h=> /[<>=]/.test(h.say))) problems.push(`${where} : un indice montre un signe`);
            if(key === 'clock' && lv.some(h=> h.say.includes(ans))) problems.push(`${where} : un indice dit l'heure`);
          }
          hintBtn().click(); hintBtn().click();
          const dims = d.querySelectorAll('#modal-body .hint-dim');
          if(dims.length > 1) problems.push(`${where} : plus d'une réponse écartée`);
          if(dims.length && nChoices < 4) problems.push(`${where} : élimination avec moins de 4 choix`);
          if(dims.length && ev('hintChoicesLeft()') < 3) problems.push(`${where} : moins de 3 choix restants`);
          if([...dims].some(el=> solEls.includes(el))) problems.push(`${where} : une bonne réponse a été écartée !`);
          if(!d.querySelector('.hint-bubble[data-level="2"]')) problems.push(`${where} : pas de bulle pour l'indice 2`);
          // le jeu reste gagnable après les indices
          if(key === 'simon') await waitFor(()=> (d.getElementById('simon-state') || {}).textContent === '👆 À toi !', 3000);
          for(const x of sol){ const el = d.querySelector(x); if(el) el.click(); await wait(key === 'memory' ? 45 : 5); }
          if(!(await waitFor(()=> !!d.querySelector('.win-box'), 2000))) problems.push(`${where} : plus gagnable après les indices`);
        }
      }
    }
    check(`2 niveaux, anti-devinette, réponse jamais donnée, jeu gagnable (${rounds} parties)`, problems.length === 0);
    if(problems.length) console.log('   ' + problems.slice(0, 12).join('\n   '));
  }

  section('Indices des énigmes d\'histoire');
  {
    const worlds = ev('Object.keys(STORY)');
    const noTip = worlds.flatMap(wd=> ev(`STORY[${JSON.stringify(wd)}].riddles.filter(r=> !r.tip).length`) ? [wd] : []);
    check('chaque énigme a son coup de pouce (tip)', noTip.length === 0);
    ev('closeModal(); renderStoryRiddle("foret", 0)');
    check('énigme : le bouton 💡 avec la tête du principal', !!hintBtn() && !!hintBtn().querySelector(`svg[data-buddy="${ev('currentCompanion()')}"]`));
    const hintsBefore = JSON.stringify(ev('state.skills'));
    hintBtn().click(); hintBtn().click();
    check('énigme : 2 indices, sans écarter de réponse (3 choix)', d.querySelector('.hint-bubble').dataset.level === '2' && !d.querySelector('.hint-dim'));
    check('énigme : la réponse n\'est jamais nommée', !/🧚|🍄/.test(d.querySelector('.hint-bubble').textContent));
    check('énigme : pas comptée dans les progrès des mini-jeux', JSON.stringify(ev('state.skills')) === hintsBefore);
    ev('closeModal(); renderStoryRiddle("foret", 0)');
    const bad = [...d.querySelectorAll('.story-opt')].find(b=> !['🧚‍♀️','🍄'].includes(b.textContent.trim()));
    bad.click();
    check('énigme : après une erreur, le bouton brille', hintBtn().classList.contains('nudge'));
    ev('closeModal()');
  }

  /* ================= Phase 3 : l'équipe ================= */
  section('Ouverture de l\'équipe au niveau 10');
  ev('closeModal(); currentProfile().companion = "perle"; state.team = { open:false, met:[], mates:[], day:null }; state.missions = 44; state.visited = WORLD_ORDER.slice(); save(); refreshAll()');
  check('niveau 9 : l\'équipe est fermée', ev('level()') === 9 && !ev('teamIsOpen()'));
  check('avant le niveau 10 : seul le principal est dans l\'en-tête', d.querySelectorAll('#team-btn .th-head').length === 1 && !!d.querySelector('#team-btn svg[data-buddy="perle"]'));
  d.getElementById('team-btn').click();
  check('« Mon équipe » avant le niveau 10 : le principal et l\'annonce du niveau 10', !!d.querySelector('.tw-card.main') && /niveau 10/.test(d.getElementById('modal-body').textContent));
  startGame('count', 1, { missions:44 });
  d.querySelector(ev('gameSolution')[0]).click();
  await waitFor(()=> !!d.querySelector('.win-box'));
  check('la mission fait passer au niveau 10', ev('level()') === 10);
  d.getElementById('btn-yay').click();
  check('écran « Ton équipe s\'agrandit ! » après la victoire', await waitFor(()=> !!d.querySelector('.team-open'), 1500));
  check('le principal annonce que des amis attendent sur les îles', /amis t'attendent sur les îles/.test(d.querySelector('.team-open').textContent));
  check('l\'équipe est ouverte et sauvegardée', ev('teamIsOpen()') && ev(`JSON.parse(localStorage.getItem(currentSaveKey())).team.open`) === true);
  d.getElementById('team-open-ok').click();
  startGame('count', 1, { missions:46 });
  d.querySelector(ev('gameSolution')[0]).click();
  await waitFor(()=> !!d.querySelector('.win-box'));
  d.getElementById('btn-yay').click();
  await wait(80);
  check('une seule fois : pas d\'écran d\'équipe à la victoire suivante', !shown('.team-open'));

  section('Partie migrée');
  ev(`closeModal(); localStorage.setItem(currentSaveKey(), JSON.stringify({ v:3, coins:9, missions:60, inventory:{ coquillage:2 }, name:'Lou', avatar:'🦄', visited:WORLD_ORDER.slice(),
      skills:{ count:{ wins:3, fails:0, errors:1, last:null, recent:[] } } })); load()`);
  check('migration v3 → v4 sans perte (pièces, missions, objets, progrès)', ev('state.v') === 4 && ev('state.coins') === 9 && ev('state.missions') === 60 && ev('state.inventory.coquillage') === 2 && ev('state.skills.count.wins') === 3);
  check('migration : équipe fermée, compteur d\'indices à 0', ev('teamIsOpen()') === false && ev('state.skills.count.hints') === 0 && Array.isArray(ev('state.team.mates')));
  ev('teamOnSessionStart()');
  check('partie déjà au niveau 10 ou plus : l\'écran d\'équipe au chargement', !!d.querySelector('.team-open'));
  ev('closeModal()');

  section('Rencontres sur les îles');
  ev('closeModal(); currentProfile().companion = "perle"; state.team = { open:true, met:[], mates:[], day:null }; state.missions = 200; state.visited = WORLD_ORDER.slice(); currentWorld = "lagon"; save()');
  check('chaque compagnon a son île', ev('[TEAM_ROLES.perle.home, TEAM_ROLES.leo.home, TEAM_ROLES.sam.home, TEAM_ROLES.zap.home, TEAM_ROLES.tom.home, TEAM_ROLES.rose.home].join()') === 'lagon,chateau,jungle,cite,volcan,squishy');
  check('Lili et Grisou absents tant que leurs îles (saison 2) ne sont pas livrées', ev('teamHomeOf("lili")') === null && ev('teamEncounterOn("boites")') === null && !ev('teamKnownIds().includes("grisou")'));
  ev('teamNewVisit(); maybeTeamEncounter("lagon")');
  check('le principal (Perle) est sauté : pas de rencontre au Lagon', !shown('.team-meet'));
  spoken.length = 0;
  ev('closeModal(); setWorld("chateau")');
  check('Léo le chevalier apparaît en arrivant au Château', await waitFor(()=> shown('.team-meet .tm-stage svg[data-buddy="leo"]'), 1500));
  check('la scène : le compagnon en grand, son rôle, une démonstration', !!d.querySelector('.tm-role') && d.querySelectorAll('.tm-demo .tm-chip').length >= 1);
  check('il se présente en 2 phrases, lues à voix haute', ev('TEAM_ROLES.leo.say.length') === 2 && spoken.some(x=> /tuteur/.test(x)));
  d.getElementById('tm-later').click();
  check('« Plus tard » : il ne rejoint pas l\'équipe', !ev('teamHasMet("leo")') && !shown('.team-meet'));
  ev('maybeTeamEncounter("chateau")');
  check('« Plus tard » : pas reproposé pendant la même visite', !shown('.team-meet'));
  ev('setWorld("lagon"); setWorld("chateau")');
  check('« Plus tard » : reproposé à la visite suivante', await waitFor(()=> shown('.team-meet .tm-stage svg[data-buddy="leo"]'), 1500));
  d.getElementById('tm-yes').click();
  check('« Dans mon équipe ! » : Léo rencontré et équipier', ev('teamHasMet("leo")') && ev('teamMates().join()') === 'leo');
  ev('closeModal(); setWorld("lagon"); setWorld("chateau")');
  await wait(250);
  check('une seule rencontre par compagnon', !shown('.team-meet'));
  ev('closeModal(); currentProfile().companion = "tom"; teamNewVisit(); maybeTeamEncounter("lagon")');
  check('avec Tom en principal, Perle se rencontre au Lagon', shown('.team-meet .tm-stage svg[data-buddy="perle"]'));
  ev('closeModal(); teamNewVisit(); maybeTeamEncounter("volcan")');
  check('… et Tom, le principal, n\'a pas de rencontre au Volcan', !shown('.team-meet'));
  ev('closeModal(); currentProfile().companion = "perle"; party.active = true; teamNewVisit(); maybeTeamEncounter("jungle"); party.active = false');
  check('pas de rencontre en partie à plusieurs', !shown('.team-meet'));

  section('Mon équipe');
  ev('closeModal(); currentProfile().companion = "perle"; state.team = { open:true, met:["leo","sam","zap"], mates:["leo","sam"], day:null }; save(); refreshAll()');
  d.getElementById('team-btn').click();
  check('« Mon équipe » s\'ouvre en touchant les compagnons de l\'en-tête', !!d.querySelector('.tw-card.main svg[data-buddy="perle"]') && d.querySelectorAll('.tw-card.mate').length === 2);
  check('les rencontrés non actifs restent visibles (au repos), les autres « à rencontrer »', !!d.querySelector('.tw-card.rest svg[data-buddy="zap"]') && d.querySelectorAll('.tw-unmet .tw-one').length >= 2);
  check('2 équipiers au maximum : pas de 3ᵉ', ev('teamAddMate("zap")') === false && d.querySelector('[data-team-add="zap"]').disabled);
  d.querySelector('[data-team-rest="sam"]').click();
  check('un équipier peut se reposer', ev('teamMates().join()') === 'leo');
  d.querySelector('[data-team-add="zap"]').click();
  check('changer d\'équipier', ev('teamMates().join()') === 'leo,zap');
  d.querySelector('[data-team-main="leo"]').click();
  check('changer de principal : Léo principal, Perle prend sa place', ev('currentCompanion()') === 'leo' && ev('teamMates().join()') === 'perle,zap');
  ev('closeModal(); save(); load(); refreshAll()');
  check('l\'équipe est conservée après rechargement', ev('currentCompanion()') === 'leo' && ev('teamMates().join()') === 'perle,zap');
  check('en-tête : 3 têtes au maximum, le principal en premier', d.querySelectorAll('#team-btn .th-head').length === 3 && d.querySelector('#team-btn .th-head.main svg').dataset.buddy === 'leo');
  ev("switchView('ile')");
  check('île : les 3 têtes de l\'équipe', d.querySelectorAll('#view-ile .team-chip .th-head').length === 3);
  ev("switchView('carte')");
  check('carte : les 3 têtes sur le bateau', d.querySelectorAll('#map-boat .th-head').length === 3);
  ev('state.team.mates = ["perle","zap","sam"]; renderTeamHeads()');
  check('jamais plus de 3 têtes, même avec un état abîmé', d.querySelectorAll('#team-btn .th-head').length === 3);
  ev('currentProfile().companion = "perle"; state.team = { open:false, met:[], mates:[], day:null }; save(); refreshAll()');

  check('aucune erreur JS', errs.length === 0);
  if(errs.length) console.log(errs.slice(0, 5));
  console.log(failed ? `\n${failed} test(s) en échec sur ${passed + failed}` : `\nTous les tests des compagnons passent (${passed})`);
  process.exit(failed ? 1 : 0);
})();
