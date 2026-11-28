// L'Île des Crayons : son ouverture au niveau 70 (écran de la saison 3, prologue
// de Zap, puis le chapitre), le chapitre « Le premier morceau de la carte », sa
// récompense et la carte de Zap, la série de squishies « Papeterie » et les
// épisodes (lignes 41 à 45 de la spec). Harnais : test/tools/crayons.js.
const t = require('./tools/crayons.js');
const { d, ev, json, check, section, shown, text, click, waitFor, LEVEL } = t;

const header = () => text(d.querySelector('.char-header h2'));
const TITLE = 'Le premier morceau de la carte';

/* ================= Ligne 41 : l'ouverture au niveau 70 ================= */
async function ouverture() {
  ev(`closeModal(); state.missions = ${LEVEL(70) - 1}; state.expeditionIntroSeen = false; state.skyIntroSeen = true;
      ${t.VISIT_ALL} state.storySolved = Object.fromEntries(state.visited.map((id) => [id, true]));
      state.season2Done = true; save(); setCurrentWorld("lagon")`);
  ev('playGame("count"); onMissionWin()');
  check('ligne 41 : la mission qui fait passer au niveau 70', () => [ev('level()') === 70]);
  click(d.getElementById('btn-yay')); // « Continuer » sur l'écran de victoire
  const opening = await waitFor(() => shown('.expedition-open'), 1500);
  check("ligne 41 : l'écran « Une nouvelle expédition commence ! » s'affiche d'abord", () => [opening]);
  click(d.getElementById('expedition-go'));
  check('ligne 41 : puis le prologue de Zap, « La carte déchirée »', () => [
    header() === 'La carte déchirée',
    !!d.querySelector('.char-header [aria-label*="Zap"]'),
  ]);
  const from = t.spoken.length;
  for (let k = 0; k < 8 && header() === 'La carte déchirée'; k++) click(d.getElementById('story-next'));
  const chapter = await waitFor(() => header() === TITLE, 1500);
  check('ligne 41 : puis le chapitre « Le premier morceau de la carte », raconté par Gribouille', () => [
    chapter,
    !!d.querySelector('.char-header [aria-label*="Gribouille"]'),
    t.said("Bienvenue sur l'Île des Crayons ✏️ Ici, tout ce qu'on dessine prend vie !", from),
  ]);
  check("ligne 41 : la carte de Zap est encore vide (aucun morceau qui brille), l'île est découverte", () => [
    d.querySelector('.story-zapmap svg.zap-map').getAttribute('data-found') === '0',
    !d.querySelector('.story-zapmap .zm-new'),
    ev('state.visited.includes("crayons")'),
    ev('state.expeditionIntroSeen') === true,
  ]);
  ev('closeModal()');
}

/* ================= Ligne 42 : le chapitre ================= */
const RIDDLES = [
  {
    q: "Je suis long et pointu, j'écris et je dessine, et on me taille quand je suis usé. Qui suis-je ?",
    tip: 'Sa mine laisse un trait gris sur la feuille.',
    opts: [{ e: '✏️', ok: true }, { e: '🥄' }, { e: '🔑' }],
  },
  {
    q: 'Je suis plate et droite, avec des petits traits et des nombres, et je sers à mesurer. Qui suis-je ?',
    tip: "On la pose le long d'un crayon pour savoir combien il mesure.",
    opts: [{ e: '📏', ok: true }, { e: '📖' }, { e: '🍴' }],
  },
  {
    q: "J'ai des poils tout doux au bout d'un manche, et je me trempe dans la peinture. Qui suis-je ?",
    tip: "On s'en sert pour peindre, pas pour se coiffer.",
    opts: [{ e: '🖌️', ok: true }, { e: '🪥' }, { e: '🧹' }],
  },
];
function chapitre() {
  const ch = ev('STORY.crayons');
  check('ligne 42 : guide Gribouille, titre, 16 pièces', () => [
    ch.guide === 'gribouille',
    ch.title === TITLE,
    ch.reward === 16,
    ch.success === 'Bravo ! Le dessin réapparaît : voici le premier morceau de la carte de Zap 🗺️',
  ]);
  check("ligne 42 : les 3 phrases d'introduction (textes exacts)", () => [
    json(ch.intro) ===
      json([
        "Bienvenue sur l'Île des Crayons ✏️ Ici, tout ce qu'on dessine prend vie !",
        "Le vent a posé un morceau de la carte de Zap sur mon cahier… mais le dessin s'est tout effacé.",
        'Résous mes devinettes : chaque bonne réponse redessine un bout de la carte !',
      ]),
  ]);
  check('ligne 42 : 3 devinettes, une seule bonne réponse et un coup de pouce chacune', () => [
    ch.riddles.length === 3,
    ch.riddles.every((r) => r.opts.filter((o) => o.ok).length === 1 && r.opts.length === 3 && !!r.tip),
  ]);
  check('ligne 42 : les devinettes, leurs coups de pouce et leurs réponses (textes exacts)', () =>
    RIDDLES.map((want, i) => {
      const r = ch.riddles[i];
      return (
        r.q === want.q &&
        r.tip === want.tip &&
        json(r.opts.map((o) => [o.e, !!o.ok])) === json(want.opts.map((o) => [o.e, !!o.ok]))
      );
    }),
  );
}

/* ================= Ligne 43 : la récompense et la carte de Zap ================= */
function recompense() {
  ev(`closeModal(); state.missions = ${LEVEL(70)}; state.coins = 0; state.storySolved = { lagon: true };
      state.squishies = squishyFreshState(); save(); setCurrentWorld("crayons")`);
  const from = t.spoken.length;
  ev('storyWin("crayons")');
  check('ligne 43 : 16 pièces et une boîte surprise de la série Papeterie', () => [
    ev('state.coins') === 16,
    json(ev('state.squishies.boxes')) === json(['papeterie']),
    ev('zapMapPieces()') === 1,
  ]);
  check('ligne 43 : la carte de Zap montre son premier morceau, qui brille', () => {
    const map = d.querySelector('.story-zapmap.happy svg.zap-map');
    const fresh = [...map.querySelectorAll('.zm-new')];
    return [
      map.getAttribute('data-found') === '1',
      map.querySelector('.zm-piece[data-piece="crayons"]').classList.contains('zm-new'),
      fresh.length === 1,
      t.sameMap(map, `zapMapSVG(zapMapFound(), { fresh: 'crayons' })`),
    ];
  });
  check('ligne 43 : la voix dit le succès, puis où en est la carte', () => [
    t.said('Bravo ! Le dessin réapparaît : voici le premier morceau de la carte de Zap 🗺️', from),
    t.said(ev('zapMapSay(1)'), from),
  ]);
  ev('closeModal(); storyWin("crayons")');
  check('ligne 43 : une seconde victoire ne redonne pas la boîte', () => [
    ev('squishyBoxCount()') === 1,
    json(ev('state.squishies.boxes')) === json(['papeterie']),
  ]);
  ev('closeModal()');
}

/* ================= Ligne 44 : la série « Papeterie » ================= */
const SQUISHIES = {
  'crayon-mochi': 'Crayon mochi|un crayon mochi|commun|jaune|ovale|grand',
  'gomme-fraise': 'Gomme fraise|une gomme fraise|commun|rose|carre|petit',
  'taille-crayon': 'Taille-crayon|un taille-crayon|commun|bleu|carre|petit',
  'pot-de-peinture': 'Pot de peinture|un pot de peinture|commun|vert|rond|grand',
  gribouille: 'Gribouille|Gribouille, le crayon à papier|rare|orange|ovale|grand',
  'crayon-arc-en-ciel': 'Crayon arc-en-ciel|un crayon arc-en-ciel|brille|violet|ovale|grand',
};
function papeterie() {
  const ids = ev('squishiesOf("papeterie")');
  check("ligne 44 : la série Papeterie, sur l'Île des Crayons, à la suite des séries déjà livrées", () => [
    json(ev('SQUISHY_SERIES.papeterie')) === json({ name: 'Papeterie', emoji: '✏️', world: 'crayons' }),
    ev('SQUISHY_ISLAND_SERIES.crayons') === 'papeterie',
    ev('SQUISHY_SERIES_ORDER.indexOf("papeterie")') > ev('SQUISHY_SERIES_ORDER.indexOf("licornes")'),
    json(ev('SQ_BOX_COLORS.papeterie')) === json(['#FFE9A8', '#B8901A']),
  ]);
  check('ligne 44 : 6 modèles (4 communs, Gribouille rare, le crayon arc-en-ciel ✨), données exactes', () => [
    json(ids) === json(Object.keys(SQUISHIES)),
    ...ids.map((id) => {
      const m = ev(`SQUISHIES[${json(id)}]`);
      return (
        [m.name, m.say, m.rarity, m.color, m.shape, m.size].join('|') === SQUISHIES[id] && m.series === 'papeterie'
      );
    }),
  ]);
  check('ligne 44 : chaque modèle est dessiné', () =>
    Object.keys(SQUISHIES).map((id) => ev(`squishyArtSVG(${json(id)})`).includes('sq-face')),
  );
  ev(`closeModal(); state.missions = ${LEVEL(70) - 1}; save()`);
  check("ligne 44 : sous le niveau 70, la série n'est pas disponible", () => [
    ev('squishySeriesAvailable("papeterie")') === false,
    !ev('squishyMissing()').includes('gribouille'),
  ]);
  ev(`state.missions = ${LEVEL(70)}; save(); openSquishyRoom("collection")`);
  check('ligne 44 : au niveau 70, elle apparaît dans la chambre', () => [
    ev('squishySeriesAvailable("papeterie")') === true,
    !!d.querySelector('.sq-series[data-series="papeterie"]'),
  ]);
  ev('closeModal()');
}

/* ================= Ligne 45 : les épisodes ================= */
const EPISODES = [
  {
    by: 'gommette',
    title: 'Pas grave si ça dépasse',
    find: '⭐',
    lines: [
      'Ce matin, Gribouille a dessiné une étoile, et le trait a dépassé.',
      "Je n'ai rien effacé : on a fait une deuxième étoile à côté. Deux étoiles, c'est encore mieux !",
    ],
  },
  {
    by: 'taillou',
    title: 'Le crayon tout petit',
    find: '📏',
    lines: [
      "J'ai taillé, taillé… et mon crayon est devenu tout petit !",
      "Je l'ai mesuré avec la règle : il fait trois centimètres. Il dessine encore très bien !",
    ],
  },
  {
    by: 'aquarelle',
    title: 'Le dessin du vent',
    find: '🥟',
    lines: [
      'Le vent a soufflé sur ma peinture, et il a dessiné… des petits paniers qui fument !',
      "Zap dit que le prochain morceau de la carte est sur une île où l'on cuisine des dumplings tout doux.",
    ],
  },
];
function episodes() {
  check('ligne 45 : 3 épisodes, racontés par Gommette, Taillou et Aquarelle (jamais Gribouille), textes exacts', () => [
    json(ev('EPISODES.crayons')) === json(EPISODES),
    !ev('EPISODES.crayons').some((e) => e.by === 'gribouille'),
  ]);
  ev(`closeModal(); state.missions = ${LEVEL(70)}; state.storyMissions = {}; state.storyEpisodes = {};
      state.storySolved = { lagon: true, crayons: true }; save(); setCurrentWorld("crayons")`);
  const at = [];
  for (let k = 1; k <= 7; k++) {
    ev('noteStoryMission("crayons")');
    if (ev('maybeStoryEpisode()')) {
      at.push(k);
      ev('closeModal()');
    }
  }
  check("ligne 45 : ils arrivent après la 2ᵉ, la 4ᵉ et la 7ᵉ mission réussie sur l'île", () => [
    json(at) === json([2, 4, 7]),
    ev('state.storyEpisodes.crayons') === 3,
  ]);
  ev('closeModal(); setCurrentWorld("lagon")');
}

(async () => {
  await t.start();
  section("L'Île des Crayons : ouverture au niveau 70 (saison 3, prologue de Zap, chapitre)");
  await ouverture();
  section('Histoire « Le premier morceau de la carte »');
  chapitre();
  recompense();
  section('Série de squishies « Papeterie »');
  papeterie();
  section('Épisodes');
  episodes();
  await t.finish("l'Île des Crayons (l'histoire)");
})();
