// Les niveaux du jeu : un seul tableau de référence (conductor/niveaux.md),
// et le jeu comme les specs des îles doivent dire la même chose que lui.
// - le jeu : le niveau de chaque île (WORLDS), celui de chaque archipel, un
//   niveau = 5 missions, un seul endroit qui fait le calcul ;
// - la règle : les saisons se suivent, l'écart entre deux îles grandit de 2
//   niveaux à chaque saison (4, puis 6, puis 8) ;
// - les specs : le niveau d'ouverture qu'elles citent est celui du tableau.
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');
const page = require('./tools/page.js');

let failed = 0, passed = 0;
function check(name, cond, detail){
  if(cond){ passed++; console.log('✅ ' + name); }
  else { failed++; console.log('❌ ' + name + (detail ? `\n     → ${detail}` : '')); }
}
function section(name){ console.log('— ' + name); }
const read = (p)=> fs.readFileSync(path.join(page.root, p), 'utf8');

/* ---------- le tableau de référence ---------- */
const DOC = read('conductor/niveaux.md');
const ROWS = [...DOC.matchAll(/^\|\s*(\d)\s*\|[^|]*\|\s*`(\w+)`\s*\|\s*(\d+)\s*\|\s*([—\d]+)\s*\|\s*([—\d]+)\s*\|\s*(\d+)\s*\|\s*$/gm)]
  .map(m=> ({ saison:+m[1], id:m[2], level:+m[3], gap:m[4], since:m[5], total:+m[6] }));
const TABLE = Object.fromEntries(ROWS.map(r=> [r.id, r]));
const GAP = (s)=> 2 * s + 2;   // 4, 6, 8 : +2 niveaux à chaque saison

section('Le tableau de référence (conductor/niveaux.md)');
check('il liste les 19 îles des trois saisons (8 + 6 + 5)', ROWS.length === 19
  && [1, 2, 3].map(s=> ROWS.filter(r=> r.saison === s).length).join() === '8,6,5', `${ROWS.length} lignes lues`);
check('les niveaux montent d\'une île à l\'autre, saison après saison', ROWS.every((r, i)=> i === 0 || (r.level > ROWS[i - 1].level && r.saison >= ROWS[i - 1].saison)));
check('saison 1 : départ rapide (1, 3, 6, 10), puis une île tous les 4 niveaux',
  ROWS.filter(r=> r.saison === 1).slice(0, 4).map(r=> r.level).join() === '1,3,6,10'
  && ROWS.filter(r=> r.saison === 1).every((r, i, a)=> i < 4 || r.level - a[i - 1].level === GAP(1)));
check('saisons 2 et 3 : une île tous les 6, puis tous les 8 niveaux, y compris en passant d\'une saison à l\'autre',
  ROWS.every((r, i)=> r.saison === 1 || r.level - ROWS[i - 1].level === GAP(r.saison)),
  ROWS.filter((r, i)=> r.saison > 1 && r.level - ROWS[i - 1].level !== GAP(r.saison)).map(r=> r.id).join(', '));
check('la règle écrite dit la même chose (4, 6, 8 niveaux ; 20, 30, 40 missions)',
  /\| 1 · Le Lagon Magique \| 4 niveaux[^|]*\| 20 \|/.test(DOC) && /\| 2 · Le Ciel des Rêves \| 6 niveaux \| 30 \|/.test(DOC) && /\| 3 · La Grande Expédition \| 8 niveaux \| 40 \|/.test(DOC));
check('les colonnes « Écart » et « Missions » sont justes (5 missions par niveau)', ROWS.every((r, i)=>
  r.total === (r.level - 1) * 5
  && (i === 0 ? r.gap === '—' && r.since === '—' : +r.gap === r.level - ROWS[i - 1].level && +r.since === +r.gap * 5)),
  ROWS.filter((r, i)=> r.total !== (r.level - 1) * 5 || (i > 0 && (+r.gap !== r.level - ROWS[i - 1].level || +r.since !== +r.gap * 5))).map(r=> r.id).join(', '));

/* ---------- les specs des îles ---------- */
section('Les specs des îles');
const SPECS = fs.readdirSync(path.join(page.root, 'conductor/tracks'))
  .map(dir=> `conductor/tracks/${dir}/spec.md`).filter(p=> fs.existsSync(path.join(page.root, p)));
const islandSpecs = [];
for(const p of SPECS){
  const s = read(p);
  // l'île décrite par la spec : « `id`, emoji …, niveau d'ouverture **N** », ou « `id` : `saison:2`, niveau N »
  const m = s.match(/`(\w+)`, emoji [^,]+, niveau d'ouverture \*\*(\d+)\*\*/) || s.match(/`(\w+)` : `saison:\d`, niveau (\d+)/);
  if(m) islandSpecs.push({ p, id:m[1], level:+m[2], text:s });
  // la v55 (Ciel des Rêves + Boîtes) : « Niveau d'ouverture : 32 » en tête
  else if(p.includes('/saison2-monde-boites_')) islandSpecs.push({ p, id:'boites', level:+(s.match(/Niveau d'ouverture : (\d+)/) || [])[1], text:s });
}
check('le Ciel et chaque île à venir ont leur spec, avec leur niveau d\'ouverture', ROWS.filter(r=> r.level >= 32).every(r=> islandSpecs.some(x=> x.id === r.id)),
  ROWS.filter(r=> r.level >= 32 && !islandSpecs.some(x=> x.id === r.id)).map(r=> r.id).join(', '));
for(const x of islandSpecs){
  const want = TABLE[x.id] && TABLE[x.id].level;
  // tous les « s'ouvre au niveau N », « ouvert au niveau N », « Au niveau N » de la spec
  const said = [...x.text.matchAll(/(?:s'ouvre au|ouverte? au|Au|En atteignant le|En dessous du|déjà au|passage au) \*{0,2}niveau (\d+)\*{0,2}|« Niveau (\d+) »/g)].map(m=> +(m[1] || m[2]));
  check(`${x.id} : niveau ${want} dans le tableau comme dans sa spec, qui renvoie au tableau`,
    x.level === want && said.every(n=> n === want) && x.text.includes('conductor/niveaux.md'),
    `spec : ${x.level}, phrases : ${said.join('/')}, tableau : ${want}`);
}
// les fiches (metadata.json) des tracks d'îles : le niveau de leur description
const META = SPECS.map(p=> p.replace(/spec\.md$/, 'metadata.json')).filter(p=> fs.existsSync(path.join(page.root, p)));
const metaWrong = islandSpecs.flatMap(x=>{
  const p = x.p.replace(/spec\.md$/, 'metadata.json');
  if(!META.includes(p)) return [];
  const said = [...JSON.parse(read(p)).description.matchAll(/niveau (\d+)/g)].map(m=> +m[1]);
  return said.every(n=> n === TABLE[x.id].level) ? [] : [`${x.id} (${said.join('/')})`];
});
check('les fiches des tracks (metadata.json) citent le même niveau que le tableau', metaWrong.length === 0, metaWrong.join(', '));
check('aucune spec ne garde une ancienne règle (« de 5 en 5 », « en parallèle », « décalés », « revus »)',
  SPECS.every(p=> !/(?:îles?|saisons?|niveaux?)[^.\n]{0,60}(?:de 5 en 5|en parallèle|Décalés depuis|Revus depuis)/i.test(read(p))),
  SPECS.filter(p=> /(?:îles?|saisons?|niveaux?)[^.\n]{0,60}(?:de 5 en 5|en parallèle|Décalés depuis|Revus depuis)/i.test(read(p))).join(', '));

/* ---------- le jeu ---------- */
section('Le jeu');
check('un seul endroit fait le calcul du niveau (js/entities/game-state)', (()=>{
  const files = require('../js/slices.cjs').SLICES.flatMap(s=> s.files);
  return files.filter(f=> !f.startsWith('js/entities/game-state/') && /MISSIONS_PER_LEVEL/.test(read(f)));
})().length === 0);

const dom = new JSDOM(page.buildHtml(), {
  runScripts:'dangerously', pretendToBeVisual:true, url:'http://localhost/?saison=aucune',
  beforeParse(win){
    win.SpeechSynthesisUtterance = function(text){ this.text = text; };
    win.speechSynthesis = { speaking:false, cancel(){}, getVoices:()=>[], speak(){} };
  },
});
const w = dom.window;
const ev = (code)=> w.eval(code);
setTimeout(()=>{
  check('un niveau = 5 missions, comme le dit le tableau', ev('MISSIONS_PER_LEVEL') === 5 && /Un niveau = 5 missions réussies/.test(DOC));
  check('levelOf : 0 à 4 missions → niveau 1, 5 → niveau 2, 155 → niveau 32', ev('[levelOf(0), levelOf(4), levelOf(5), levelOf(155)].join()') === '1,1,2,32');
  check('missionsForLevel et missionsUntil : 155 missions pour le niveau 32 ; à 150, il en reste 5', ev('missionsForLevel(32)') === 155
    && ev('(state.missions = 150, missionsUntil(32))') === 5 && ev('(state.missions = 200, missionsUntil(32))') === 0);
  const worlds = JSON.parse(ev('JSON.stringify(Object.fromEntries(Object.entries(WORLDS).map(([id, x])=> [id, { level:x.level, saison:x.saison }])))'));
  check('chaque île du jeu a le niveau et la saison du tableau', Object.entries(worlds).every(([id, x])=> TABLE[id] && TABLE[id].level === x.level && TABLE[id].saison === x.saison),
    Object.entries(worlds).filter(([id, x])=> !TABLE[id] || TABLE[id].level !== x.level || TABLE[id].saison !== x.saison).map(([id])=> id).join(', '));
  check('chaque archipel s\'ouvre au niveau de sa première île', ev('ARCHIPELAGO_ORDER.every(s=> ARCHIPELAGOS[s].level === WORLDS[worldsOf(s)[0]].level)')
    && ev('ARCHIPELAGOS[1].level') === 1 && ev('ARCHIPELAGOS[2].level') === TABLE.boites.level);
  check('dernière île ouverte : niveau 31 → le Pays Squishy (26) ; niveau 32 → les Boîtes (32)',
    ev(`(state.missions = missionsForLevel(31), lastOpenedLevel())`) === 26 && ev(`(state.missions = missionsForLevel(32), lastOpenedLevel())`) === 32);

  console.log(failed ? `\n${failed} test(s) des niveaux en échec` : `\nTous les tests des niveaux passent (${passed})`);
  process.exit(failed ? 1 : 0);
}, 150);
