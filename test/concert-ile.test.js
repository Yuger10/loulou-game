// L'Île du Grand Concert (saison 3 « La Grande Expédition », île 5) : l'île,
// son thème, son paysage (le drap, puis le xylophone d'or), sa musique, ses 4
// personnages, son ouverture au niveau 102 et son jeu favori : critères 26 à
// 29 et 43 de la spec. Les objets et les squishies : test/concert-objets.test.js ;
// l'histoire : test/concert-histoire.test.js. Harnais : test/tools/concert.js.
const page = require('./tools/page.js');
const t = require('./tools/concert.js');
const { d, ev, json, check, section, LEVEL } = t;

const WORLD = {
  name: "L'Île du Grand Concert",
  emoji: '🎼',
  level: 102,
  diff: 6,
  saison: 3,
  short: 'Concert',
  subtitle: 'La grande scène en plein air',
  map: { x: 50, y: 22 },
  shape: 'concert',
  icon: '🎼',
  sand: '#FFF1D6',
  land: '#E9A0A8',
  intro: "Bienvenue sur l'Île du Grand Concert : ce soir, tout le monde joue ! 🎼",
  sceneEmpty: 'Ta grande scène attend ses décorations de fête !',
};
const same = (a, b) => json(Object.entries(a).sort()) === json(Object.entries(b).sort());

function ile() {
  check('critère 26 : WORLDS.concert a exactement les champs de la table (niveau 102, saison 3, palier 6)', () => {
    const { game, ...rest } = ev('WORLDS.concert');
    return [same(rest, WORLD), typeof game === 'function'];
  });
  check('critère 26 : cinquième et dernière île de La Grande Expédition, après les Chatouilles', () => [
    ev('WORLD_ORDER.indexOf("concert")') === ev('WORLD_ORDER.indexOf("chatouilles")') + 1,
    ev('worldsOf(3).indexOf("concert")') === 4,
    ev('archipelagoOf("concert")') === 3,
    ev('ZAP_MAP_PIECES[ZAP_MAP_PIECES.length - 1]') === 'concert',
  ]);
  check('D23 : sur la carte de la saison 3, dans le cadre, sans chevaucher une autre île', () => {
    const at = ev('worldsOf(3).map((id) => WORLDS[id].map)');
    const me = WORLD.map;
    return [
      me.x >= 10 && me.x <= 90 && me.y >= 10 && me.y <= 90,
      at.filter((m) => Math.abs(m.x - me.x) < 24 && Math.abs(m.y - me.y) < 30).length === 1,
    ];
  });
  check('critère 29 : son thème de couleurs (rouge velours, or et crème), les 5 jetons', () => {
    const css = page
      .manifestCss()
      .map((f) => page.read(f))
      .join('\n');
    const rule = /body\[data-world=["']concert["']\]\s*\{([^}]*)\}/.exec(css);
    const want = {
      '--world-sky': '#fdf0e6',
      '--world-sea': '#e9a0a8',
      '--world-deep': '#8a2e3b',
      '--world-scene-top': '#fff8f0',
      '--world-scene-floor': '#ffe7a8',
    };
    return [!!rule, ...Object.entries(want).map(([k, v]) => new RegExp(`${k}:\\s*${v}\\s*;`, 'i').test(rule[1]))];
  });
  check('critère 29 : ses deux musiques, en do (aucune fausse note avec le xylophone d’or)', () => [
    json(ev('MUSIC_THEMES.concert')) ===
      json({ root: 60, scale: [0, 2, 4, 7, 9], bpm: 96, lead: 'marimba', prog: [0, 5, 7, 0], shaker: true }),
    json(ev('MUSIC_THEMES["concert-fete"]')) ===
      json({ root: 60, scale: [0, 2, 4, 7, 9], bpm: 116, lead: 'bell', prog: [0, 5, 7, 0], shaker: true }),
  ]);
}

// une ligne de la table des personnages : [emoji, nom, titre, genre], son butin, ses répliques
const person = ([emoji, name, title, gender], loot, texts) => ({
  emoji,
  name,
  title,
  world: 'concert',
  gender,
  loot,
  texts,
});
const CHARS = {
  stella: person(
    ['👩‍🎤', 'Stella', 'la cheffe de la grande scène', 'f'],
    ['billetconcert', 'programme'],
    [
      "Bienvenue sur ma grande scène ! Ce soir, c'est le Grand Concert, et tu as la meilleure place !",
      "Un concert, ça se prépare : on accorde, on répète, on écoute. Tu m'aides ?",
      'Chaque mission réussie allume une lumière de la scène. Encore une ?',
    ],
  ),
  doremi: person(
    ['🐦', 'Dorémi', 'la petite fauvette qui chante la gamme', 'f'],
    ['etoilescene', 'billetconcert'],
    [
      'Do, ré, mi, fa, sol, la, si, do ! Tu chantes avec moi ?',
      'Chaque note a sa lame sur le xylophone, et sa couleur. Le do est tout rouge !',
      'Sur la portée, plus la note est haute, plus elle chante aigu. Tu veux essayer ?',
    ],
  ),
  xylo: person(
    ['🐻', 'Xylo', "l'ourson au xylophone", 'm'],
    ['lunettesstar', 'programme'],
    [
      'Ding, dong, ding ! Écoute ma mélodie, puis rejoue-la avec moi !',
      'Les grandes lames font des notes graves, les petites des notes aiguës.',
      "Une mélodie, c'est comme un petit chemin : ça monte, ça descend, ça saute !",
    ],
  ),
  trompi: person(
    ['🐘', 'Trompi', 'le petit éléphant trompettiste', 'm'],
    ['ampoule', 'lunettesstar'],
    [
      "Pouêêt ! Pardon, je m'entraîne pour le concert !",
      "J'installe les lumières et les chaises. Tu viens voir la grande scène ?",
      "Tous les amis de l'expédition arrivent ce soir. Ça va être la plus belle fête !",
    ],
  ),
};
const IDS = Object.keys(CHARS);
function personnages() {
  check('critère 29 : 4 personnages : Stella, Dorémi, Xylo, Trompi', () => [
    json(ev('charsOf("concert").map(([id]) => id)')) === json(IDS),
  ]);
  check('critère 29 : emoji, nom, titre, genre, butin et les 3 répliques exactes de chacun, rien d’autre', () =>
    IDS.map((id) => same(ev(`CHARACTERS.${id}`), CHARS[id])),
  );
  check("critère 29 : le butin de chacun : 2 objets de l'île ; chacun a son dessin", () =>
    IDS.map((id) => {
      const svg = ev(`charArtSVG(${json(id)})`);
      return (
        ev(`CHARACTERS.${id}.loot.every((k) => ITEMS[k] && ITEMS[k].world === "concert")`) &&
        svg.startsWith('<svg') &&
        svg.includes('viewBox="0 0 120 130"') &&
        svg.length > 400 &&
        !/undefined|NaN/.test(svg)
      );
    }),
  );
}

// critère 27 : au niveau 102, sur l'île ; critère 28 : son jeu favori selon l'âge
function surIle() {
  ev(`closeModal(); state.missions = ${LEVEL(102)}; state.expeditionIntroSeen = true; ${t.VISIT_ALL}
      state.storySolved = Object.fromEntries(state.visited.map((id) => [id, true])); state.season3Done = false; save();
      setWorld("concert", true); switchView("ile")`);
  check('critère 27 : au niveau 102, les 4 personnages sont dans le paysage, le thème est appliqué', () => [
    ev('level()') === 102,
    ev('worldUnlocked("concert")') === true,
    IDS.every((id) => !!d.querySelector(`#scene .isle-char[data-char="${id}"] .emoji`)),
    d.body.dataset.world === 'concert',
    ev('availableItems().includes("saxo")'),
  ]);
  paysage();
  ev(`setWorld("lagon", true); state.missions = ${LEVEL(102) - 1}; save()`);
  check("critère 27 : une mission avant (niveau 101), l'île est verrouillée et ses objets absents", () => [
    ev('level()') === 101,
    ev('worldUnlocked("concert")') === false,
    ev('worldUnlocked("chatouilles")') === true,
    ev('availableItems().includes("saxo")') === false,
  ]);
  check('critère 28 : jeu favori : « Do, ré, mi » avant 7 ans, « La mélodie » ensuite et sans âge', () => [
    ...[4, 5, 6].map((age) => ev(`worldGame("concert", ${age})`) === 'notes'),
    ...[0, 7, 9].map((age) => ev(`worldGame("concert", ${age})`) === 'melody'),
  ]);
}

// critère 43 : sur l'estrade, le drap et son « ? », puis le xylophone d'or
function paysage() {
  const scene = () => d.querySelector('#scene svg');
  const draw = (done) => ev(`state.season3Done = ${done}; renderLiveIsland(document.getElementById("scene"))`);
  draw(false);
  const svg = ev('ISLE_SCENERY.concert(WORLDS.concert)');
  check('critère 29 : son paysage : une estrade, deux rideaux, une guirlande, des chaises, un chemin', () => [
    ['#E0A96D', '#7A4524', '#C8384B', WORLD.sand, WORLD.land].every((c) => svg.toUpperCase().includes(c)),
    !/undefined|NaN/.test(svg),
    ev('Object.keys(ISLE_SCENERY).filter((k) => k === "concert").length') === 1,
  ]);
  check('critère 43 : avant le final, un drap violet et un « ? », pas de xylophone', () => [
    scene().querySelectorAll('g.ls-drap').length === 1,
    scene().querySelector('g.ls-drap text').textContent === '?',
    scene().querySelector('g.ls-drap').innerHTML.toUpperCase().includes('#7B5CC0'),
    !scene().querySelector('g.ls-xylo-or'),
  ]);
  draw(true);
  const lames = [...scene().querySelectorAll('g.ls-xylo-or rect.ls-xylo-lame')];
  check(
    'critère 43 : après le final, le xylophone d’or (8 lames, de la plus longue à la plus courte), plus de drap',
    () => [
      lames.length === 8,
      lames.every((r, i) => i === 0 || Number(r.getAttribute('height')) < Number(lames[i - 1].getAttribute('height'))),
      lames.every((r) => r.getAttribute('fill').toUpperCase() === '#F7C948'),
      !scene().querySelector('g.ls-drap'),
    ],
  );
  draw(false);
}

(async () => {
  await t.start();
  section('L’Île du Grand Concert : l’île, son thème, sa musique');
  ile();
  section('L’Île du Grand Concert : ses 4 personnages');
  personnages();
  section('L’Île du Grand Concert : au niveau 102, son paysage, son jeu favori');
  surIle();
  await t.finish('l’Île du Grand Concert (l’île)');
})();
