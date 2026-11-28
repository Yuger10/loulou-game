// Le Monde des Chatouilles : son ouverture au niveau 94, le chapitre « Le
// quatrième morceau de la carte » (I8), sa récompense et la carte de Zap, la
// série de squishies « Guilis » (I5) et les épisodes (I9) : critères 32, 36,
// 46, 46b, 47 et 48 de la spec. Harnais : test/tools/chatouilles.js.
const t = require('./tools/chatouilles.js');
const { d, ev, json, check, section, shown, text, click, waitFor, LEVEL } = t;

const header = () => text(d.querySelector('.char-header h2'));
const TITLE = 'Le quatrième morceau de la carte';
const SUCCESS = "Bravo ! L'arbre à plumes rit si fort qu'il laisse tomber le quatrième morceau de la carte de Zap ! 🗺️";
const INTRO = [
  'Hi hi ! Bienvenue au Monde des Chatouilles 🪶 Ici, tout le monde rit pour un rien.',
  "Le quatrième morceau de la carte de Zap s'est envolé dans mon arbre à plumes. Il est caché tout en haut, sous les plumes qui chatouillent !",
  "Ici, on chatouille seulement ceux qui en ont envie, et quand quelqu'un dit stop, on s'arrête. Résous mes devinettes, et l'arbre te donnera le morceau !",
];
const BEFORE = '{ lagon: true, crayons: true, dumplings: true, coffres: true }';

/* ================= Critère 32 : l'ouverture au niveau 94 ================= */
async function ouverture() {
  ev(`closeModal(); state.missions = ${LEVEL(94) - 1}; state.expeditionIntroSeen = true; state.skyIntroSeen = true;
      ${t.VISIT_ALL} state.storySolved = Object.fromEntries(state.visited.map((id) => [id, true]));
      state.season2Done = true; save(); setCurrentWorld("coffres")`);
  check("critère 32 : au niveau 93, l'île est verrouillée", () => [
    ev('level()') === 93,
    ev('worldUnlocked("chatouilles")') === false,
    !ev('state.visited.includes("chatouilles")'),
  ]);
  ev('playGame("count"); onMissionWin()');
  check('critère 32 : la mission qui fait passer au niveau 94', () => [ev('level()') === 94]);
  const from = t.spoken.length;
  click(d.getElementById('btn-yay')); // « Continuer » sur l'écran de victoire
  const chapter = await waitFor(() => header() === TITLE, 1500);
  check('critère 32 : le chapitre « Le quatrième morceau de la carte » s’ouvre, lu par Plumette', () => [
    chapter,
    !!d.querySelector('.char-header [aria-label*="Plumette"]'),
    t.said(INTRO[0], from),
    ev('state.visited.includes("chatouilles")'),
  ]);
  check('critère 46 : il montre la carte de Zap, trois morceaux trouvés', () => [
    shown('.story-zapmap svg.zap-map[data-found="3"]'),
    !d.querySelector('.story-grisou'),
    !d.querySelector('.story-zapmap .zm-new'),
  ]);
}
// critère 47 : une mauvaise réponse pose l'AUTRE énigme de l'île
async function mauvaiseReponse() {
  for (let k = 0; k < 6 && d.getElementById('story-next') && !d.querySelector('.story-opt'); k++)
    click(d.getElementById('story-next'));
  const first = text(d.querySelector('.puzzle-hint .hint-txt'));
  const riddles = ev('STORY.chatouilles.riddles');
  const wrong = [...d.querySelectorAll('.story-opt')].find(
    (b) => b.textContent !== riddles.find((r) => r.q === first).opts.find((o) => o.ok).e,
  );
  click(wrong);
  const other = await waitFor(() => {
    const now = text(d.querySelector('.puzzle-hint .hint-txt'));
    return !!d.querySelector('.story-opt') && now !== first && riddles.some((r) => r.q === now);
  }, 1500);
  check("critère 47 : la première énigme est de l'île ; une mauvaise réponse propose l'autre", () => [
    riddles.some((r) => r.q === first),
    other,
    !ev('state.storySolved.chatouilles'),
  ]);
  ev('closeModal()');
}

/* ================= I8 : le chapitre ================= */
const RIDDLES = [
  {
    q: 'Je suis toute légère, je vole au vent, et je chatouille le bout du nez. Qui suis-je ?',
    tip: 'Les oiseaux en ont plein sur le dos.',
    opts: [{ e: '🪶', ok: true }, { e: '🪨' }, { e: '🔨' }],
  },
  {
    q: "On me met aux pieds, une à droite, une à gauche, et parfois j'ai des pois. Qui suis-je ?",
    tip: 'On me met avant les chaussures.',
    opts: [{ e: '🧦', ok: true }, { e: '🧤' }, { e: '🎩' }],
  },
];
function chapitre() {
  const ch = ev('STORY.chatouilles');
  check('critère 46, I8 : guide Plumette, titre, 16 pièces, phrase de succès', () => [
    ch.guide === 'plumette',
    ch.title === TITLE,
    ch.reward === 16,
    ch.success === SUCCESS,
    ev('Object.keys(STORY).filter((k) => k === "chatouilles").length') === 1,
  ]);
  check("I8 : les 3 phrases d'introduction (textes exacts)", () => [json(ch.intro) === json(INTRO)]);
  check('I8 : les 2 devinettes, leurs coups de pouce et leurs réponses (textes exacts)', () => [
    ch.riddles.length === 2,
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

/* ================= Critère 46b : la récompense et la carte de Zap ================= */
function recompense() {
  ev(`closeModal(); state.missions = ${LEVEL(94)}; state.coins = 0;
      state.storySolved = { crayons: true, dumplings: true, coffres: true };
      state.squishies = squishyFreshState(); save(); setCurrentWorld("chatouilles")`);
  ev('storyWin("chatouilles")');
  check('critère 46b : 16 pièces, une boîte de la série Guilis, quatre morceaux de carte', () => [
    ev('state.coins') === 16,
    json(ev('state.squishies.boxes')) === json(['guilis']),
    ev('state.storySolved.chatouilles') === true,
    ev('zapMapPieces()') === 4,
    ev('ZAP_MAP_PIECES')[3] === 'chatouilles',
  ]);
  check('critère 46b : la carte de Zap montre 4 morceaux, celui des Chatouilles brille', () => {
    const map = d.querySelector('.story-zapmap.happy svg.zap-map[data-found="4"]');
    return [
      !!map,
      map.querySelector('.zm-piece[data-piece="chatouilles"]').classList.contains('zm-new'),
      map.querySelectorAll('.zm-new').length === 1,
      t.sameMap(map, `zapMapSVG(zapMapFound(), { fresh: 'chatouilles' })`),
    ];
  });
  check('critère 46b : un seul `speak` dit le succès, la récompense, puis « 4 morceaux sur 5 », mot pour mot', () => [
    t.saidLast(
      `${SUCCESS} Tu gagnes 16 pièces et une boîte surprise de squishies. La carte de Zap : tu as trouvé 4 morceaux sur 5.`,
    ),
    ev('zapMapSay(4)') === 'La carte de Zap : tu as trouvé 4 morceaux sur 5.',
  ]);
  ev('closeModal(); storyWin("chatouilles")');
  check('critère 46b : une seconde victoire ne redonne pas la boîte ; le chapitre reste résolu', () => [
    ev('squishyBoxCount()') === 1,
    json(ev('state.squishies.boxes')) === json(['guilis']),
    ev('state.storySolved.chatouilles') === true,
    ev('zapMapPieces()') === 4,
  ]);
  ev(`closeModal(); state.storySolved = ${BEFORE}; save()`);
}

/* ================= I5 : la série « Guilis » ================= */
const SQUISHIES = {
  'plume-rose': 'Plume rose|une plume rose|commun|rose|ovale|petit',
  'nuage-rieur': 'Nuage rieur|un nuage rieur|commun|bleu|rond|grand',
  'chaussette-pois': 'Chaussette à pois|une chaussette à pois|commun|vert|ovale|grand',
  'bonbon-rigolo': 'Bonbon rigolo|un bonbon rigolo|commun|orange|rond|petit',
  guili: 'Guili|Guili, le petit manchot|rare|violet|ovale|petit',
  'plumette-doree': 'Plumette dorée|Plumette dorée, la paonne|brille|jaune|rond|grand',
};
const BODIES = ['ovale-v', 'rond', 'ovale-v', 'rond', 'ovale-h', 'rond'];
function serie() {
  const ids = ev('squishiesOf("guilis")');
  check('critère 36 : la série Guilis, sur son île, après les séries déjà livrées, sa boîte jaune et prune', () => [
    json(ev('SQUISHY_SERIES.guilis')) === json({ name: 'Guilis', emoji: '🪶', world: 'chatouilles' }),
    ev('SQUISHY_ISLAND_SERIES.chatouilles') === 'guilis',
    ev('SQUISHY_SERIES_ORDER.indexOf("guilis")') > ev('SQUISHY_SERIES_ORDER.indexOf(SQUISHY_ISLAND_SERIES.coffres)'),
    ev('SQUISHY_SERIES_ORDER.filter((s) => s === "guilis").length') === 1,
    json(ev('SQ_BOX_COLORS.guilis')) === json(['#FFF1B8', '#8A3D6B']),
  ]);
  check('I5 : 6 modèles (4 communs, Guili rare, Plumette dorée ✨), données exactes', () => [
    json(ids) === json(Object.keys(SQUISHIES)),
    ...ids.map((id) => {
      const m = ev(`SQUISHIES[${json(id)}]`);
      return (
        [m.name, m.say, m.rarity, m.color, m.shape, m.size].join('|') === SQUISHIES[id] &&
        m.series === 'guilis' &&
        !m.how
      );
    }),
  ]);
  check('critère 36 : chaque modèle a son dessin, sur le corps demandé', () => [
    ...Object.keys(SQUISHIES).map((id) => {
      const svg = ev(`squishyArtSVG(${json(id)})`);
      return svg !== '' && svg.includes('<svg') && svg.includes('sq-face') && !/undefined|NaN/.test(svg);
    }),
    json(Object.keys(SQUISHIES).map((id) => ev(`SQ_ART_S3[${json(id)}].body`))) === json(BODIES),
    Object.keys(SQUISHIES).every((id) => ev(`!!(SQ_ART_S3[${json(id)}].back || SQ_ART_S3[${json(id)}].front)`)),
  ]);
  ev(`closeModal(); state.missions = ${LEVEL(94) - 1}; save()`);
  const before = ev('squishySeriesAvailable("guilis")');
  ev(`state.missions = ${LEVEL(94)}; save(); openSquishyRoom("collection")`);
  check('I5 : la série apparaît dans la chambre au niveau 94, pas avant', () => [
    before === false,
    ev('squishySeriesAvailable("guilis")') === true,
    !!d.querySelector('.sq-series[data-series="guilis"]'),
  ]);
  ev('closeModal()');
}

/* ================= I9 : les épisodes ================= */
const episode = ([by, title, find], lines) => ({ by, title, find, lines });
const EPISODES = [
  episode(
    ['guili', 'La plume qui file', '🪶'],
    [
      "J'ai lancé une plume dans le vent, et elle a fait trois virages avant de se poser !",
      "Elle s'est posée sur le nez de Pic. Il a fait atchoum, et on a tous ri !",
    ],
  ),
  episode(
    ['lulu', 'La blague de Lulu', '📜'],
    [
      "J'ai trouvé une blague : pourquoi les poissons n'aiment pas jouer au tennis ? Parce qu'ils ont peur du filet !",
      'Hi hi ! Même Pic a ri, et pourtant il est très sérieux !',
    ],
  ),
  episode(
    ['pic', 'La musique au loin', '🎼'],
    [
      'Chut… Écoute. Très loin, derrière les nuages, on entend de la musique.',
      "Elle vient d'une île lointaine, qui prépare un grand concert. Le dernier morceau de la carte y est peut-être !",
    ],
  ),
];
function episodes() {
  check('critère 48, I9 : 3 épisodes, racontés par Guili, Lulu et Pic (jamais Plumette), textes exacts', () => [
    json(ev('EPISODES.chatouilles')) === json(EPISODES),
    !ev('EPISODES.chatouilles').some((e) => e.by === 'plumette'),
  ]);
  ev(`closeModal(); state.missions = ${LEVEL(94)}; state.storyMissions = {}; state.storyEpisodes = {};
      state.storySolved = { lagon: true, crayons: true, dumplings: true, coffres: true, chatouilles: true }; save();
      setCurrentWorld("chatouilles")`);
  const at = [];
  for (let k = 1; k <= 7; k++) {
    ev('noteStoryMission("chatouilles")');
    if (ev('maybeStoryEpisode()')) {
      at.push(k);
      ev('closeModal()');
    }
  }
  check("critère 48 : ils arrivent après la 2ᵉ, la 4ᵉ et la 7ᵉ mission réussie sur l'île", () => [
    json(at) === json([2, 4, 7]),
    ev('state.storyEpisodes.chatouilles') === 3,
  ]);
  ev('closeModal(); openStoryJournal()');
  check('critère 48 : ils se relisent dans « 📖 Mon histoire »', () => [
    EPISODES.every((e) => text(d.getElementById('modal-body')).includes(e.title)),
  ]);
  ev('closeModal(); setCurrentWorld("lagon")');
}

(async () => {
  await t.start();
  section('Le Monde des Chatouilles : ouverture au niveau 94');
  await ouverture();
  await mauvaiseReponse();
  section('Histoire « Le quatrième morceau de la carte »');
  chapitre();
  recompense();
  section('Série de squishies « Guilis »');
  serie();
  section('Épisodes');
  episodes();
  await t.finish('le Monde des Chatouilles (l’histoire)');
})();
