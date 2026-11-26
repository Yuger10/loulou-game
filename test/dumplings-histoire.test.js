// L'Île des Squishy Dumplings : son ouverture au niveau 78, le chapitre « Le
// deuxième morceau de la carte » (T10), sa récompense et la carte de Zap, la
// série de squishies « Dumplings » (T9) et les épisodes (T11) : lignes 31, 35
// à 38 de la spec, S8 et S9. Harnais : test/tools/dumplings.js.
const t = require('./tools/dumplings.js');
const { d, ev, json, check, section, shown, text, click, waitFor, LEVEL } = t;

const header = () => text(d.querySelector('.char-header h2'));
const TITLE = 'Le deuxième morceau de la carte';
const SUCCESS = 'Bravo ! Sous le dernier couvercle, le deuxième morceau de la carte est là, tout chaud et tout sec 🗺️';
const INTRO = [
  'Bienvenue dans ma cuisine à vapeur 🥟 Je suis Bao, le chef des Squishy Dumplings !',
  "Ce matin, j'ai mis un vieux papier au fond d'un panier. C'était le deuxième morceau de la carte de Zap ! Mais j'ai empilé tous mes paniers, et je ne sais plus où il est.",
  'Résous mes devinettes de cuisine : chaque bonne réponse soulève un couvercle !',
];

/* ================= Ligne 31 : l'ouverture au niveau 78 ================= */
async function ouverture() {
  ev(`closeModal(); state.missions = ${LEVEL(78) - 1}; state.expeditionIntroSeen = true; state.skyIntroSeen = true;
      ${t.VISIT_ALL} state.storySolved = Object.fromEntries(state.visited.map((id) => [id, true]));
      state.season2Done = true; save(); setCurrentWorld("crayons")`);
  check("ligne 31 : au niveau 77, l'île est verrouillée", () => [
    ev('level()') === 77,
    ev('worldUnlocked("dumplings")') === false,
    !ev('state.visited.includes("dumplings")'),
  ]);
  ev('playGame("count"); onMissionWin()');
  check('ligne 31 : la mission qui fait passer au niveau 78', () => [ev('level()') === 78]);
  const from = t.spoken.length;
  click(d.getElementById('btn-yay')); // « Continuer » sur l'écran de victoire
  const chapter = await waitFor(() => header() === TITLE, 1500);
  check('ligne 31 : le chapitre « Le deuxième morceau de la carte » s’ouvre, raconté par Bao', () => [
    chapter,
    !!d.querySelector('.char-header [aria-label*="Bao"]'),
    t.said(INTRO[0], from),
    ev('state.visited.includes("dumplings")'),
  ]);
  check('ligne 36 : il montre la carte de Zap (le premier morceau trouvé), pas Grisou', () => [
    shown('.story-zapmap svg.zap-map'),
    !d.querySelector('.story-grisou'),
    d.querySelector('.story-zapmap svg.zap-map').getAttribute('data-found') === '1',
    !d.querySelector('.story-zapmap .zm-new'),
  ]);
}
// ligne 36 : une mauvaise réponse pose une AUTRE énigme de l'île
async function mauvaiseReponse() {
  for (let k = 0; k < 6 && d.getElementById('story-next') && !d.querySelector('.story-opt'); k++)
    click(d.getElementById('story-next'));
  const first = text(d.querySelector('.puzzle-hint .hint-txt'));
  const riddles = ev('STORY.dumplings.riddles');
  const wrong = [...d.querySelectorAll('.story-opt')].find(
    (b) => b.textContent !== riddles.find((r) => r.q === first).opts.find((o) => o.ok).e,
  );
  click(wrong);
  const other = await waitFor(() => {
    const now = text(d.querySelector('.puzzle-hint .hint-txt'));
    return !!d.querySelector('.story-opt') && now !== first && riddles.some((r) => r.q === now);
  }, 1500);
  check("ligne 36 : la première énigme est de l'île ; une mauvaise réponse en pose une autre", () => [
    riddles.some((r) => r.q === first),
    other,
    !ev('state.storySolved.dumplings'),
  ]);
  ev('closeModal()');
}

/* ================= T10 : le chapitre ================= */
const RIDDLES = [
  {
    q: 'Je suis tout mou et tout blanc, je cuis dans la vapeur, et dedans il y a une bonne farce. Qui suis-je ?',
    tip: 'Je ressemble à un petit chausson, et on me mange avec des baguettes.',
    opts: [{ e: '🥟', ok: true }, { e: '🍕' }, { e: '🍩' }],
  },
  {
    q: "Je siffle quand l'eau est chaude, et je verse le thé par mon bec. Qui suis-je ?",
    tip: "J'ai une anse, un couvercle et un bec.",
    opts: [{ e: '🫖', ok: true }, { e: '🥄' }, { e: '🍳' }],
  },
  {
    q: 'Je suis une grande plante verte, toute droite, et on fait des paniers avec moi. Qui suis-je ?',
    tip: 'Ma tige a des nœuds, comme des petits anneaux.',
    opts: [{ e: '🎋', ok: true }, { e: '🌻' }, { e: '🌵' }],
  },
];
function chapitre() {
  const ch = ev('STORY.dumplings');
  check('T10 : guide Bao, titre, 16 pièces, phrase de succès', () => [
    ch.guide === 'bao',
    ch.title === TITLE,
    ch.reward === 16,
    ch.success === SUCCESS,
  ]);
  check("T10 : les 3 phrases d'introduction (textes exacts)", () => [json(ch.intro) === json(INTRO)]);
  check('T10 : les 3 devinettes, leurs coups de pouce et leurs réponses (textes exacts)', () => [
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

/* ================= Ligne 37 : la récompense et la carte de Zap ================= */
function recompense() {
  ev(`closeModal(); state.missions = ${LEVEL(78)}; state.coins = 0; state.storySolved = { crayons: true };
      state.squishies = squishyFreshState(); save(); setCurrentWorld("dumplings")`);
  const from = t.spoken.length;
  ev('storyWin("dumplings")');
  check('ligne 37 : 16 pièces, une boîte de la série Dumplings, deux morceaux de carte', () => [
    ev('state.coins') === 16,
    json(ev('state.squishies.boxes')) === json(['dumplings']),
    ev('state.storySolved.dumplings') === true,
    ev('zapMapPieces()') === 2,
  ]);
  check('ligne 37 : la carte de Zap montre 2 morceaux, celui des Dumplings brille', () => {
    const map = d.querySelector('.story-zapmap.happy svg.zap-map[data-found="2"]');
    return [
      !!map,
      map.querySelector('.zm-piece[data-piece="dumplings"]').classList.contains('zm-new'),
      map.querySelectorAll('.zm-new').length === 1,
      t.sameMap(map, `zapMapSVG(zapMapFound(), { fresh: 'dumplings' })`),
    ];
  });
  check('ligne 37 : la voix dit le succès, puis où en est la carte', () => [
    t.said(SUCCESS, from),
    t.said(ev('zapMapSay(2)'), from),
  ]);
  ev('closeModal(); storyWin("dumplings")');
  check('ligne 37 : une seconde victoire ne redonne pas la boîte ; le chapitre reste résolu', () => [
    ev('squishyBoxCount()') === 1,
    json(ev('state.squishies.boxes')) === json(['dumplings']),
    ev('state.storySolved.dumplings') === true,
    ev('zapMapPieces()') === 2,
  ]);
  ev('closeModal()');
}

/* ================= T9 : la série « Dumplings » ================= */
const SQUISHIES = {
  'dumpling-rose': 'Dumpling rose|un dumpling rose|commun|rose|rond|petit',
  'demi-lune': 'Demi-lune|un dumpling en demi-lune|commun|vert|ovale|petit',
  'bao-violet': 'Bao violet|un bao violet|commun|violet|rond|grand',
  'panier-vapeur': 'Panier vapeur|un panier vapeur|commun|orange|carre|grand',
  'chef-bao': 'Chef Bao|Bao, le chef dumpling|rare|bleu|rond|grand',
  'dumpling-dore': 'Dumpling doré|un dumpling doré|brille|jaune|rond|grand',
};
function serie() {
  const ids = ev('squishiesOf("dumplings")');
  check('ligne 35 : la série Dumplings, sur son île, après les séries déjà livrées', () => [
    json(ev('SQUISHY_SERIES.dumplings')) === json({ name: 'Dumplings', emoji: '🥟', world: 'dumplings' }),
    ev('SQUISHY_ISLAND_SERIES.dumplings') === 'dumplings',
    ev('SQUISHY_SERIES_ORDER.indexOf("dumplings")') > ev('SQUISHY_SERIES_ORDER.indexOf("licornes")'),
    ev('SQUISHY_SERIES_ORDER.filter((s) => s === "dumplings").length') === 1,
    json(ev('SQ_BOX_COLORS.dumplings')) === json(['#DDF0D6', '#3F7A4A']),
  ]);
  check('ligne 35 : 6 modèles (4 communs, Chef Bao rare, le dumpling doré ✨), données exactes de T9', () => [
    json(ids) === json(Object.keys(SQUISHIES)),
    ...ids.map((id) => {
      const m = ev(`SQUISHIES[${json(id)}]`);
      return (
        [m.name, m.say, m.rarity, m.color, m.shape, m.size].join('|') === SQUISHIES[id] && m.series === 'dumplings'
      );
    }),
  ]);
  check('ligne 35 : chaque modèle a son dessin (un modèle inconnu n’en a pas)', () => [
    ...Object.keys(SQUISHIES).map((id) => {
      const svg = ev(`squishyArtSVG(${json(id)})`);
      return svg.length > 0 && svg.includes('<svg') && svg.includes('sq-face') && !/undefined|NaN/.test(svg);
    }),
    ...Object.keys(SQUISHIES).map((id) => ev(`${json(id)} in SQ_ART_S3`)),
    ev('squishyArtSVG("pas-un-squishy")') === '',
  ]);
  ev(`closeModal(); state.missions = ${LEVEL(78) - 1}; save()`);
  const before = ev('squishySeriesAvailable("dumplings")');
  ev(`state.missions = ${LEVEL(78)}; save(); openSquishyRoom("collection")`);
  check('ligne 35 : la série apparaît dans la chambre au niveau 78, pas avant', () => [
    before === false,
    ev('squishySeriesAvailable("dumplings")') === true,
    !!d.querySelector('.sq-series[data-series="dumplings"]'),
  ]);
  ev('closeModal()');
}

/* ================= T11 : les épisodes ================= */
const EPISODES = [
  {
    by: 'bambou',
    title: 'La tour de paniers',
    find: '🧺',
    lines: [
      "J'ai empilé dix paniers, l'un sur l'autre. Une vraie tour !",
      "Dix paniers de dix dumplings… ça fait cent ! Le chef Bao n'en revient pas.",
    ],
  },
  {
    by: 'sesame',
    title: 'La commande de Zap',
    find: '🥡',
    lines: [
      'Zap est passé au comptoir. Il a commandé trois dumplings roses pour le voyage.',
      "Je les ai mis dans une boîte à emporter. Il a dit : « C'est pour l'avion en papier ! »",
    ],
  },
  {
    by: 'theo',
    title: 'Le cliquetis dans la vapeur',
    find: '🗝️',
    lines: [
      "Fiou ! En sifflant très fort, j'ai entendu un cliquetis dans la vapeur, comme une petite clé.",
      'Il vient de plus loin sur la carte. Une autre île nous attend !',
    ],
  },
];
function episodes() {
  check('ligne 38 : 3 épisodes, racontés par Bambou, Sésame et Théo (jamais Bao), textes exacts de T11', () => [
    json(ev('EPISODES.dumplings')) === json(EPISODES),
    !ev('EPISODES.dumplings').some((e) => e.by === 'bao'),
  ]);
  ev(`closeModal(); state.missions = ${LEVEL(78)}; state.storyMissions = {}; state.storyEpisodes = {};
      state.storySolved = { lagon: true, crayons: true, dumplings: true }; save(); setCurrentWorld("dumplings")`);
  const at = [];
  for (let k = 1; k <= 7; k++) {
    ev('noteStoryMission("dumplings")');
    if (ev('maybeStoryEpisode()')) {
      at.push(k);
      ev('closeModal()');
    }
  }
  check("ligne 38 : ils arrivent après la 2ᵉ, la 4ᵉ et la 7ᵉ mission réussie sur l'île", () => [
    json(at) === json([2, 4, 7]),
    ev('state.storyEpisodes.dumplings') === 3,
  ]);
  ev('closeModal(); openStoryJournal()');
  check('ligne 38 : ils se relisent dans « 📖 Mon histoire »', () => [
    EPISODES.every((e) => text(d.getElementById('modal-body')).includes(e.title)),
  ]);
  ev('closeModal(); setCurrentWorld("lagon")');
}

(async () => {
  await t.start();
  section("L'Île des Squishy Dumplings : ouverture au niveau 78");
  await ouverture();
  await mauvaiseReponse();
  section('Histoire « Le deuxième morceau de la carte »');
  chapitre();
  recompense();
  section('Série de squishies « Dumplings »');
  serie();
  section('Épisodes');
  episodes();
  await t.finish("l'Île des Squishy Dumplings (l'histoire)");
})();
