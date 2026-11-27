// L'Île du Grand Concert : son ouverture au niveau 102, le chapitre « Le
// dernier morceau de la carte », sa récompense, la carte de Zap complète et
// les épisodes : critères 27, 29 et 31 de la spec. Le grand final qui suit :
// test/concert-final.test.js. Harnais : test/tools/concert.js.
const t = require('./tools/concert.js');
const { d, ev, json, check, section, shown, text, click, waitFor, LEVEL } = t;

const header = () => text(d.querySelector('.char-header h2'));
const TITLE = 'Le dernier morceau de la carte';
const SUCCESS =
  'Bravo ! Tous les instruments sont prêts… et regarde : le dernier morceau de la carte de Zap était caché dans le pupitre 🗺️';
const INTRO = [
  'Bienvenue sur la grande scène ! 🎼 Ce soir, tous les amis de l’expédition viennent jouer au Grand Concert.',
  'Zap m’a dit que le dernier morceau de sa carte au trésor est caché ici, quelque part dans la musique.',
  'Résous mes devinettes : à chaque bonne réponse, un instrument s’accorde, et le morceau de carte se rapproche !',
].map((s) => s.replace(/’/g, "'"));
const RIDDLES = [
  {
    q: "J'ai six cordes, on me gratte avec les doigts, et je fais gling gling. Qui suis-je ?",
    tip: 'On la tient contre son ventre, et on chante avec elle.',
    opts: ['🎸', '🎷', '🥁'],
  },
  {
    q: 'Je suis tout petit, on me tient devant la bouche, et je rends ta voix très forte. Qui suis-je ?',
    tip: 'Les chanteurs me tiennent dans la main, sur la scène.',
    opts: ['🎤', '🎧', '📯'],
  },
  {
    q: "On me met sur les oreilles, et j'écoute la musique tout bas, rien que pour moi. Qui suis-je ?",
    tip: "J'ai deux petits coussins tout doux, un pour chaque oreille.",
    opts: ['🎧', '🎤', '🔔'],
  },
];
const FOUR = '{ crayons: true, dumplings: true, coffres: true, chatouilles: true }';

// critère 27 : la mission qui fait passer au niveau 102 ouvre le chapitre
async function ouverture() {
  ev(`closeModal(); state.missions = ${LEVEL(102) - 1}; state.expeditionIntroSeen = true; state.skyIntroSeen = true;
      ${t.VISIT_ALL} state.storySolved = Object.fromEntries(state.visited.map((id) => [id, true]));
      state.season2Done = true; state.season3Done = false; save(); setCurrentWorld("chatouilles")`);
  check("critère 27 : au niveau 101, l'île est verrouillée", () => [
    ev('level()') === 101,
    ev('worldUnlocked("concert")') === false,
    !ev('state.visited.includes("concert")'),
  ]);
  ev('playGame("count"); onMissionWin()');
  const from = t.spoken.length;
  click(d.getElementById('btn-yay'));
  const chapter = await waitFor(() => header() === TITLE, 1500);
  check('critère 27 : au niveau 102, le chapitre « Le dernier morceau de la carte » s’ouvre, lu par Stella', () => [
    ev('level()') === 102,
    chapter,
    !!d.querySelector('.char-header [aria-label*="Stella"]'),
    t.said(INTRO[0], from),
    ev('state.visited.includes("concert")'),
  ]);
  check('critère 27 : il montre la carte de Zap, quatre morceaux trouvés', () => [
    shown('.story-zapmap svg.zap-map[data-found="4"]'),
  ]);
  ev('closeModal()');
}

function chapitre() {
  const ch = ev('STORY.concert');
  check('critère 29 : guide Stella, titre, 20 pièces (comme le final de la saison 2), phrase de succès', () => [
    ch.guide === 'stella',
    ch.title === TITLE,
    ch.reward === 20 && ch.reward === ev('STORY.licornes.reward'),
    ch.success === SUCCESS,
    ev('Object.keys(STORY).filter((k) => k === "concert").length') === 1,
  ]);
  check("critère 29 : les 3 phrases d'introduction (textes exacts)", () => [json(ch.intro) === json(INTRO)]);
  check('critère 29 : les 3 devinettes, leurs coups de pouce et leurs réponses (la première est la bonne)', () => [
    ch.riddles.length === 3,
    ...RIDDLES.map((want, i) => {
      const r = ch.riddles[i];
      return (
        r.q === want.q &&
        r.tip === want.tip &&
        json(r.opts.map((o) => [o.e, !!o.ok])) === json(want.opts.map((e, k) => [e, k === 0]))
      );
    }),
  ]);
}

// critère 31 : la récompense, la carte complète, la phrase dite
function recompense() {
  ev(`closeModal(); state.missions = ${LEVEL(102)}; state.coins = 0; state.season3Done = false;
      state.storySolved = ${FOUR}; state.squishies = squishyFreshState(); save(); setCurrentWorld("concert")`);
  ev('storyWin("concert")');
  check('critère 31 : 20 pièces, une boîte de la série Concert, cinq morceaux de carte', () => [
    ev('state.coins') === 20,
    json(ev('state.squishies.boxes')) === json(['concert']),
    ev('state.storySolved.concert') === true,
    ev('zapMapPieces()') === 5,
  ]);
  check('critère 31 : la carte de Zap est complète, le morceau du Concert brille', () => {
    const map = d.querySelector('.story-zapmap.happy svg.zap-map[data-found="5"]');
    return [
      !!map,
      map.querySelector('.zm-piece[data-piece="concert"]').classList.contains('zm-new'),
      map.querySelectorAll('.zm-new').length === 1,
      !!map.querySelector('.zm-cross'),
    ];
  });
  check('critère 31 : un seul `speak` dit le succès, la récompense, puis la carte complète', () => [
    t.saidLast(`${SUCCESS} Tu gagnes 20 pièces et une boîte surprise de squishies. ${ev('zapMapSay(5)')}`),
    ev('zapMapSay(5)') === 'La carte de Zap est complète ! Les 5 morceaux sont réunis.',
    d.getElementById('story-continue').textContent === "Continuer l'aventure ✨",
  ]);
  ev('closeModal(); state.season3Done = true; storyWin("concert")');
  check('critère 31 : une seconde victoire ne redonne pas la boîte', () => [
    ev('squishyBoxCount()') === 1,
    json(ev('state.squishies.boxes')) === json(['concert']),
  ]);
  ev('closeModal(); state.storySolved = { crayons: true }; state.season3Done = true; storyWin("concert")');
  check('critère 31 : avec un seul autre chapitre résolu, la carte montre 2 morceaux (rien n’est stocké)', () => [
    ev('zapMapPieces()') === 2,
    shown('.story-zapmap.happy svg.zap-map[data-found="2"]'),
    !Object.keys(ev('state')).some((k) => /zap|map|carte/i.test(k)),
  ]);
  ev(`closeModal(); state.season3Done = false; state.storySolved = ${FOUR}; save()`);
}

const episode = ([by, title, find], lines) => ({ by, title, find, lines });
const EPISODES = [
  episode(
    ['doremi', 'La gamme du matin', '🎵'],
    [
      "Ce matin, j'ai chanté la gamme en entier : do, ré, mi, fa, sol, la, si, do !",
      "Tous les oiseaux de l'île ont répondu. Le concert approche !",
    ],
  ),
  episode(
    ['xylo', 'Le xylophone qui dort', '🗺️'],
    [
      "Zap dit qu'un vieux xylophone tout brillant dort quelque part sur cette île.",
      'Sa carte le sait. Il ne lui manque que son dernier morceau !',
    ],
  ),
  episode(
    ['trompi', 'Tout le monde arrive', '🎟️'],
    [
      "Pouêêt ! J'ai vu des avions en papier dans le ciel : tous nos amis de l'expédition arrivent pour le concert !",
      'Il y a Gribouille, Bao, Clémence et Plumette. Il ne manque plus que toi !',
    ],
  ),
];
function episodes() {
  check('critère 29 : 3 épisodes, racontés par Dorémi, Xylo et Trompi (jamais Stella), textes exacts', () => [
    json(ev('EPISODES.concert')) === json(EPISODES),
    !ev('EPISODES.concert').some((e) => e.by === 'stella'),
    ['gribouille', 'bao', 'clemence', 'plumette'].every((id) => !!ev(`CHARACTERS.${id}`)),
  ]);
  ev(`closeModal(); state.missions = ${LEVEL(102)}; state.storyMissions = {}; state.storyEpisodes = {};
      state.storySolved = { lagon: true, crayons: true, dumplings: true, coffres: true, chatouilles: true,
        concert: true }; state.season3Done = true; save(); setCurrentWorld("concert")`);
  const at = [];
  for (let k = 1; k <= 7; k++) {
    ev('noteStoryMission("concert")');
    if (ev('maybeStoryEpisode()')) {
      at.push(k);
      ev('closeModal()');
    }
  }
  check("les épisodes arrivent après la 2ᵉ, la 4ᵉ et la 7ᵉ mission réussie sur l'île", () => [
    json(at) === json([2, 4, 7]),
    ev('state.storyEpisodes.concert') === 3,
  ]);
  ev('closeModal(); state.season3Done = false; setCurrentWorld("lagon")');
}

(async () => {
  await t.start();
  section('L’Île du Grand Concert : ouverture au niveau 102 (critère 27)');
  await ouverture();
  section('Histoire « Le dernier morceau de la carte » (critères 29 et 31)');
  chapitre();
  recompense();
  section('Épisodes');
  episodes();
  await t.finish('l’Île du Grand Concert (l’histoire)');
})();
