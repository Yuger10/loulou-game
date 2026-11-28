// L'Île des Coffres : son ouverture au niveau 86, le chapitre « Le troisième
// morceau de la carte » (C1), sa récompense et la carte de Zap, la série de
// squishies « Coffres » (Q1) et les épisodes (P1 à P3) : critères 32 à 36 de
// la spec. Harnais : test/tools/coffres.js.
const t = require('./tools/coffres.js');
const { d, ev, json, check, section, shown, text, click, waitFor, LEVEL } = t;

const header = () => text(d.querySelector('.char-header h2'));
const TITLE = 'Le troisième morceau de la carte';
const SUCCESS =
  'Bravo ! La serrure fait clic, le grand coffre s’ouvre… et voici le troisième morceau de la carte de Zap 🗺️'.replace(
    '’',
    "'",
  );
const INTRO = [
  "Bienvenue sur l'Île des Coffres 🗝️ Ici, chaque coffre garde un secret, et chaque secret a sa clé.",
  'Zap a vu le troisième morceau de sa carte au fond du grand coffre. Mais le coffre est fermé, et sa serrure pose une devinette !',
  'Trouve la bonne réponse, et la serrure fera clic !',
];

/* ================= Critère 32 : l'ouverture au niveau 86 ================= */
async function ouverture() {
  ev(`closeModal(); state.missions = ${LEVEL(86) - 1}; state.expeditionIntroSeen = true; state.skyIntroSeen = true;
      ${t.VISIT_ALL} state.storySolved = Object.fromEntries(state.visited.map((id) => [id, true]));
      state.season2Done = true; save(); setCurrentWorld("dumplings")`);
  check("critère 32 : au niveau 85, l'île est verrouillée", () => [
    ev('level()') === 85,
    ev('worldUnlocked("coffres")') === false,
    !ev('state.visited.includes("coffres")'),
  ]);
  ev('playGame("count"); onMissionWin()');
  check('critère 32 : la mission qui fait passer au niveau 86', () => [ev('level()') === 86]);
  const from = t.spoken.length;
  click(d.getElementById('btn-yay')); // « Continuer » sur l'écran de victoire
  const chapter = await waitFor(() => header() === TITLE, 1500);
  check('critère 32 : le chapitre « Le troisième morceau de la carte » s’ouvre, lu par Clémence', () => [
    chapter,
    !!d.querySelector('.char-header [aria-label*="Clémence"]'),
    t.said(INTRO[0], from),
    ev('state.visited.includes("coffres")'),
  ]);
  check('critère 32 : il montre la carte de Zap (deux morceaux trouvés), pas Grisou', () => [
    shown('.story-zapmap svg.zap-map'),
    !d.querySelector('.story-grisou'),
    d.querySelector('.story-zapmap svg.zap-map').getAttribute('data-found') === '2',
    !d.querySelector('.story-zapmap .zm-new'),
  ]);
}
// critère 34 : une mauvaise réponse pose une AUTRE énigme de l'île
async function mauvaiseReponse() {
  for (let k = 0; k < 6 && d.getElementById('story-next') && !d.querySelector('.story-opt'); k++)
    click(d.getElementById('story-next'));
  const first = text(d.querySelector('.puzzle-hint .hint-txt'));
  const riddles = ev('STORY.coffres.riddles');
  const wrong = [...d.querySelectorAll('.story-opt')].find(
    (b) => b.textContent !== riddles.find((r) => r.q === first).opts.find((o) => o.ok).e,
  );
  click(wrong);
  const other = await waitFor(() => {
    const now = text(d.querySelector('.puzzle-hint .hint-txt'));
    return !!d.querySelector('.story-opt') && now !== first && riddles.some((r) => r.q === now);
  }, 1500);
  check("critère 34 : la première énigme est de l'île ; une mauvaise réponse en pose une autre", () => [
    riddles.some((r) => r.q === first),
    other,
    !ev('state.storySolved.coffres'),
  ]);
  ev('closeModal()');
}

/* ================= C1 : le chapitre ================= */
const RIDDLES = [
  {
    q: "Je suis petite, je suis en métal, et je tourne dans la serrure pour l'ouvrir. Qui suis-je ?",
    tip: 'Sans moi, la porte reste fermée. On me range sur un trousseau.',
    opts: [{ e: '🔑', ok: true }, { e: '🔨' }, { e: '🥄' }],
  },
  {
    q: "Je ferme les coffres et les vélos. Pour m'ouvrir, il faut une clé ou un code. Qui suis-je ?",
    tip: "On m'accroche, et clic ! je reste fermé.",
    opts: [{ e: '🔒', ok: true }, { e: '🔔' }, { e: '🎈' }],
  },
  {
    q: "Je montre le chemin d'un trésor. Une croix dit où creuser. Qui suis-je ?",
    tip: 'Les pirates me déplient pour trouver leur trésor.',
    opts: [{ e: '🗺️', ok: true }, { e: '📖' }, { e: '🖼️' }],
  },
];
function chapitre() {
  const ch = ev('STORY.coffres');
  check('C1 : guide Clémence, titre, 16 pièces, phrase de succès', () => [
    ch.guide === 'clemence',
    ch.title === TITLE,
    ch.reward === 16,
    ch.success === SUCCESS,
    ev('Object.keys(STORY).filter((k) => k === "coffres").length') === 1,
  ]);
  check("C1 : les 3 phrases d'introduction (textes exacts)", () => [json(ch.intro) === json(INTRO)]);
  check('C1 : les 3 devinettes, leurs coups de pouce et leurs réponses (textes exacts)', () => [
    ch.riddles.length === 3,
    ...RIDDLES.map((want, i) => {
      const r = ch.riddles[i];
      return (
        r.q === want.q &&
        r.tip === want.tip &&
        json(r.opts.map((o) => [o.e, !!o.ok])) === json(want.opts.map((o) => [o.e, !!o.ok]))
      );
    }),
  ]);
}

/* ================= Critère 33 : la récompense et la carte de Zap ================= */
function recompense() {
  ev(`closeModal(); state.missions = ${LEVEL(86)}; state.coins = 0;
      state.storySolved = { crayons: true, dumplings: true };
      state.squishies = squishyFreshState(); save(); setCurrentWorld("coffres")`);
  const from = t.spoken.length;
  ev('storyWin("coffres")');
  check('critère 33 : 16 pièces, une boîte de la série Coffres, trois morceaux de carte', () => [
    ev('state.coins') === 16,
    json(ev('state.squishies.boxes')) === json(['coffres']),
    ev('state.storySolved.coffres') === true,
    ev('zapMapPieces()') === 3,
    json(ev('ZAP_MAP_PIECES').slice(0, 3)) === json(['crayons', 'dumplings', 'coffres']),
  ]);
  check('critère 33 : la carte de Zap montre 3 morceaux, celui des Coffres brille', () => {
    const map = d.querySelector('.story-zapmap.happy svg.zap-map[data-found="3"]');
    return [
      !!map,
      map.querySelector('.zm-piece[data-piece="coffres"]').classList.contains('zm-new'),
      map.querySelectorAll('.zm-new').length === 1,
      t.sameMap(map, `zapMapSVG(zapMapFound(), { fresh: 'coffres' })`),
    ];
  });
  check('critère 33 : la voix dit le succès, puis « tu as trouvé 3 morceaux sur 5 »', () => [
    t.said(SUCCESS, from),
    t.said(ev('zapMapSay(3)'), from),
    ev('zapMapSay(3)') === 'La carte de Zap : tu as trouvé 3 morceaux sur 5.',
  ]);
  ev('closeModal(); storyWin("coffres")');
  check('critère 33 : une seconde victoire ne redonne pas la boîte ; le chapitre reste résolu', () => [
    ev('squishyBoxCount()') === 1,
    json(ev('state.squishies.boxes')) === json(['coffres']),
    ev('state.storySolved.coffres') === true,
    ev('zapMapPieces()') === 3,
  ]);
  ev('closeModal()');
}

/* ================= Q1 : la série « Coffres » ================= */
const SQUISHIES = {
  'coffre-mochi': 'Coffre mochi|un coffre mochi|commun|orange|carre|grand',
  'cadenas-coeur': 'Cadenas cœur|un cadenas cœur|commun|rose|ovale|petit',
  'cle-lune': 'Clé de lune|une clé de lune|commun|violet|ovale|grand',
  'piece-souriante': 'Pièce souriante|une pièce souriante|commun|jaune|rond|petit',
  kadi: 'Kadi|Kadi, le petit cadenas|rare|bleu|carre|petit',
  'coffre-etoiles': 'Coffre aux étoiles|un coffre aux étoiles|brille|vert|carre|grand',
};
const BODIES = ['carre', 'ovale-v', 'ovale-h', 'rond', 'carre', 'carre'];
function serie() {
  const ids = ev('squishiesOf("coffres")');
  check('Q1 : la série Coffres, sur son île, après les séries déjà livrées', () => [
    json(ev('SQUISHY_SERIES.coffres')) === json({ name: 'Coffres', emoji: '🔐', world: 'coffres' }),
    ev('SQUISHY_ISLAND_SERIES.coffres') === 'coffres',
    ev('SQUISHY_SERIES_ORDER.indexOf("coffres")') > ev('SQUISHY_SERIES_ORDER.indexOf("dumplings")'),
    ev('SQUISHY_SERIES_ORDER.filter((s) => s === "coffres").length') === 1,
  ]);
  check('Q1 : 6 modèles (4 communs, Kadi rare, le coffre aux étoiles ✨), données exactes', () => [
    json(ids) === json(Object.keys(SQUISHIES)),
    ...ids.map((id) => {
      const m = ev(`SQUISHIES[${json(id)}]`);
      return (
        [m.name, m.say, m.rarity, m.color, m.shape, m.size].join('|') === SQUISHIES[id] &&
        m.series === 'coffres' &&
        !m.how
      );
    }),
  ]);
  check('Q1 : chaque modèle a son dessin, sur le corps demandé', () => [
    ...Object.keys(SQUISHIES).map((id) => {
      const svg = ev(`squishyArtSVG(${json(id)})`);
      return svg.length > 0 && svg.includes('<svg') && svg.includes('sq-face') && !/undefined|NaN/.test(svg);
    }),
    json(Object.keys(SQUISHIES).map((id) => ev(`SQ_ART_S3[${json(id)}].body`))) === json(BODIES),
    Object.keys(SQUISHIES).every((id) => ev(`!!(SQ_ART_S3[${json(id)}].back || SQ_ART_S3[${json(id)}].front)`)),
  ]);
  ev(`closeModal(); state.missions = ${LEVEL(86) - 1}; save()`);
  const before = ev('squishySeriesAvailable("coffres")');
  ev(`state.missions = ${LEVEL(86)}; save(); openSquishyRoom("collection")`);
  check('Q1 : la série apparaît dans la chambre au niveau 86, pas avant', () => [
    before === false,
    ev('squishySeriesAvailable("coffres")') === true,
    !!d.querySelector('.sq-series[data-series="coffres"]'),
  ]);
  ev('closeModal()');
}

/* ================= P1 à P3 : les épisodes ================= */
const EPISODES = [
  {
    by: 'kadi',
    title: 'Les traces de Zap',
    find: '👣',
    lines: [
      "J'ai vu des traces de pas devant le grand coffre. Des petites bottes de super-héros !",
      'Zap est passé par ici. Il cherche lui aussi les morceaux de sa carte.',
    ],
  },
  {
    by: 'grignote',
    title: 'Le compte est bon',
    find: '🪙',
    lines: [
      "J'ai compté toutes les pièces de l'île : il y en a cent, pas une de moins !",
      "Mais dans le grand coffre, j'ai entendu un bruit de papier. Un morceau de carte, peut-être ?",
    ],
  },
  {
    by: 'pincou',
    title: 'La plume qui chatouille',
    find: '🪶',
    lines: [
      "Avec mes pinces, j'ai attrapé une plume qui volait au-dessus de la mer.",
      "Elle m'a chatouillé, hi hi ! Elle vient sûrement d'une île plus loin sur la carte. On ira voir !",
    ],
  },
];
function episodes() {
  check('critère 35 : 3 épisodes, racontés par Kadi, Grignote et Pinçou (jamais Clémence), textes exacts', () => [
    json(ev('EPISODES.coffres')) === json(EPISODES),
    !ev('EPISODES.coffres').some((e) => e.by === 'clemence'),
  ]);
  ev(`closeModal(); state.missions = ${LEVEL(86)}; state.storyMissions = {}; state.storyEpisodes = {};
      state.storySolved = { lagon: true, crayons: true, dumplings: true, coffres: true }; save();
      setCurrentWorld("coffres")`);
  const at = [];
  for (let k = 1; k <= 7; k++) {
    ev('noteStoryMission("coffres")');
    if (ev('maybeStoryEpisode()')) {
      at.push(k);
      ev('closeModal()');
    }
  }
  check("critère 35 : ils arrivent après la 2ᵉ, la 4ᵉ et la 7ᵉ mission réussie sur l'île", () => [
    json(at) === json([2, 4, 7]),
    ev('state.storyEpisodes.coffres') === 3,
  ]);
  ev('closeModal(); openStoryJournal()');
  check('critère 35 : ils se relisent dans « 📖 Mon histoire »', () => [
    EPISODES.every((e) => text(d.getElementById('modal-body')).includes(e.title)),
  ]);
  ev('closeModal(); setCurrentWorld("lagon")');
}

(async () => {
  await t.start();
  section("L'Île des Coffres : ouverture au niveau 86");
  await ouverture();
  await mauvaiseReponse();
  section('Histoire « Le troisième morceau de la carte »');
  chapitre();
  recompense();
  section('Série de squishies « Coffres »');
  serie();
  section('Épisodes');
  episodes();
  await t.finish("l'Île des Coffres (l'histoire)");
})();
