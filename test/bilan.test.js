// Le bilan de la semaine de l'espace parents (track bilan-parents_20261122) :
// une carte « 🧭 Cette semaine » dit ce qui va bien, ce qui résiste cette
// semaine (3 jeux au plus) et, pour chacun, une idée à faire sans écran.
// Les numéros entre parenthèses sont ceux du « Comportement attendu » de la spec.
// La carte se calcule à l'affichage depuis `skills` : aucune note, aucun
// pourcentage, rien n'est envoyé, et une entrée abîmée d'une partie importée
// est ignorée sans que la partie soit corrigée.
// Suites voisines : test/bilan-resiste.test.js (ce qui résiste, erreur
// fréquente) et test/bilan-import.test.js (parties vides ou abîmées).
const fs = require('fs');
const path = require('path');
const page = require('./tools/page.js');
const {
  check,
  section,
  wait,
  day,
  OK,
  aise,
  hard,
  FOOT,
  EMPTY,
  GOOD,
  HARD,
  NONE,
  TITLE,
  blocksOf,
  orderOf,
  after,
  between,
  open,
  finish,
} = require('./tools/bilan-kit.js');

async function carteParents({ w, d, ev, mount, stage }) {
  section('La carte dans l’espace parents (1, 10, 12)');
  const cards = ev("emit('parents:cards', { st: state, p: currentProfile() }).filter(Boolean).join('')");
  const { el, text } = mount(cards);
  check(
    'une carte <section class="bk-card ps-bilan"> parmi parents:cards',
    !!el && el.matches('section.bk-card.ps-bilan'),
  );
  check('titrée « 🧭 Cette semaine »', !!el && el.querySelector('h3')?.textContent === TITLE, text.slice(0, 80));
  check('elle se termine par la phrase de pied (12)', text.endsWith(FOOT), text.slice(-120));
  stage.innerHTML = '';

  ev('parentUnlockedUntil = Date.now() + 60000; openParentSpace()');
  await wait(100);
  const shown = d.querySelector('#modal .ps-bilan') || d.querySelector('.ps-bilan');
  const progress = [...d.querySelectorAll('.bk-card h3')].find((h) => /Progrès par compétence/.test(h.textContent));
  check(
    'dans l’espace parents, avant « 📈 Progrès par compétence »',
    !!shown && !!progress && !!(shown.compareDocumentPosition(progress) & w.Node.DOCUMENT_POSITION_FOLLOWING),
  );
  check(
    'joueur courant : sa partie (Compter résiste)',
    !!shown && /Compter/.test(shown.textContent) && !/Mémoire/.test(shown.textContent),
    shown && shown.textContent,
  );

  ev('openParentSpace("p2")');
  await wait(100);
  const other = d.querySelector('.ps-bilan');
  check(
    'autre enfant : sa partie à lui, jamais celle du joueur courant (10)',
    !!other && /Mémoire/.test(other.textContent) && !/Compter/.test(other.textContent),
    other && other.textContent,
  );
  ev('closeModal()');
}

function rendus({ card }) {
  section('Rendus selon les cas (2, 8, table)');
  const cases = [
    ['fenêtre vide, aucun jeu à l’aise', {}, [TITLE, EMPTY, FOOT]],
    ['fenêtre vide, un jeu à l’aise', { memory: aise(day(20)) }, [TITLE, EMPTY, GOOD, FOOT]],
    [
      'fenêtre non vide, rien à l’aise, rien ne résiste',
      { memory: { ...aise(day(0)), recent: [OK()] } },
      [TITLE, NONE, FOOT],
    ],
    ['fenêtre non vide, un jeu à l’aise, rien ne résiste', { memory: aise(day(0)) }, [TITLE, GOOD, NONE, FOOT]],
    ['fenêtre non vide, rien à l’aise, un jeu résiste', { count: hard(day(0)) }, [TITLE, HARD, FOOT]],
    [
      'fenêtre non vide, un jeu à l’aise, un jeu résiste',
      { memory: aise(day(3)), count: hard(day(0)) },
      [TITLE, GOOD, HARD, FOOT],
    ],
  ];
  for (const [name, skills, want] of cases) {
    const { text, error } = card({ skills });
    check(name, blocksOf(text) === want.join(' | ') && text.endsWith(FOOT), error || blocksOf(text));
  }
  const { text } = card({ skills: { memory: aise(day(3)), count: hard(day(0)) } });
  check(
    '« va bien » cite le jeu à l’aise, « résiste » le jeu qui résiste',
    /Mémoire/.test(between(text, GOOD, HARD)) && /Compter/.test(after(text, HARD)),
    text,
  );
}

function fenetre({ card }) {
  section('La fenêtre de la semaine (4, bornes)');
  check('joué il y a 6 jours : dans la fenêtre', card({ skills: { count: hard(day(6)) } }).text.includes(HARD));
  const t7 = card({ skills: { count: hard(day(7)) } }).text;
  check('joué il y a 7 jours : hors fenêtre', blocksOf(t7) === [TITLE, EMPTY, FOOT].join(' | '), t7);
  check('« à travailler » hors fenêtre : ni « résiste » ni « va bien »', !/Compter/.test(t7), t7);
  const tm = card({ skills: { count: hard(day(-1)) } }).text;
  check('une date future (demain) : hors fenêtre', blocksOf(tm) === [TITLE, EMPTY, FOOT].join(' | '), tm);
  const ts = card({ skills: { count: aise(day(2), { support: true }) } }).text;
  check('en soutien et joué dans la fenêtre : résiste', /Compter/.test(after(ts, HARD)), ts);
  const te = card({ skills: { count: { wins: 2, fails: 0, errors: 0, last: day(0), recent: [], hints: 0 } } }).text;
  check(
    'joué dans la fenêtre avec `recent` vide : compte comme une partie',
    blocksOf(te) === [TITLE, NONE, FOOT].join(' | '),
    te,
  );
}

function vaBien({ card }) {
  section('Ce qui va bien (3, 9)');
  const skills = {
    memory: aise(day(40)),
    count: aise(day(1)),
    diff: aise(day(10)),
    puzzle: aise(day(3)),
    sequence: aise(day(3)),
  };
  const { text } = card({ skills });
  const good = between(text, GOOD, NONE);
  check(
    'au plus 3 jeux, du plus récent au plus ancien, puis par clé',
    orderOf(good, ['Mémoire', 'Compter', "L'intrus", 'Les nombres', 'La suite']) === 'Compter, Les nombres, La suite',
    good,
  );
  check('avec l’emoji et le nom', good.includes('🔢 Compter') && good.includes('🧩 Les nombres'), good);
  check(
    'sans jeu à l’aise : pas de ligne « Ce qui va bien : »',
    !card({ skills: { count: hard(day(0)) } }).text.includes(GOOD),
  );
  check(
    'un acquis ancien reste cité (sans condition de date)',
    between(card({ skills: { memory: aise(day(300)) } }).text, GOOD, FOOT).includes('🧠 Mémoire'),
  );
  check('sans `stars` : aucune étoile', !text.includes('⭐'), text);
  const starred = card({ skills, stars: { count: { won: 1 }, puzzle: { won: 0 }, sequence: { won: 'x' } } }).text;
  check('une étoile « aller plus loin » gagnée suit le nom (9)', starred.includes('🔢 Compter ⭐'), starred);
  check('pas d’étoile sans au moins 1 gagnée', (starred.match(/⭐/g) || []).length === 1, starred);
  for (const stars of [null, 'x', 3, { count: null }, { count: { won: 1.5 } }, { count: 'oui' }]) {
    const r = card({ skills, stars });
    check(
      `\`stars\` illisible (${JSON.stringify(stars)}) : pas d’étoile, pas d’erreur`,
      !r.error && r.text.includes('🔢 Compter') && !r.text.includes('⭐'),
      r.error || r.text,
    );
  }
}

function soutien({ card }) {
  section('Soutien, limite et « va bien » (18, 19)');
  const out = card({ skills: { count: aise(day(30), { support: true }) } }).text;
  check(
    'en soutien, à l’aise, hors fenêtre : cité dans « va bien », fenêtre vide (18)',
    blocksOf(out) === [TITLE, EMPTY, GOOD, FOOT].join(' | ') && between(out, GOOD, FOOT).includes('Compter'),
    out,
  );
  const inn = card({ skills: { count: aise(day(1), { support: true }) } }).text;
  check(
    'le même, joué dans la fenêtre : résiste et n’est plus dans « va bien » (18)',
    blocksOf(inn) === [TITLE, HARD, FOOT].join(' | ') && after(inn, HARD).includes('Compter'),
    inn,
  );
  // 3 jeux en soutien et ratés, plus un 4e en soutien mais à l'aise (aucun raté) : classé 4e
  const skills = {
    math: hard(day(1), 3, { support: true }),
    clock: hard(day(1), 3, { support: true }),
    money: hard(day(1), 3, { support: true }),
    count: aise(day(0), { support: true }),
  };
  const cut = card({ skills }).text;
  check(
    'un jeu qui résiste, coupé par la limite, n’est cité nulle part (19)',
    !cut.includes('Compter') && !cut.includes(GOOD) && cut.includes(HARD),
    cut,
  );
}

function niNote({ card, ev }) {
  section('Ni note, ni comparaison (13)');
  const rich = [
    {
      skills: {
        memory: aise(day(3)),
        count: hard(day(0)),
        math: aise(day(1), { support: true }),
        clock: hard(day(2)),
      },
      stars: { memory: { won: 2 } },
    },
    { skills: { memory: aise(day(30)) } },
    { skills: { memory: aise(day(1)) } },
    {},
  ];
  const all = rich.map((st) => card(st).text).join(' ');
  const banned = ['%', '/10', '/20', 'moyenne', 'autres enfants', 'en retard', 'retard', 'faible'];
  const found = banned.filter((b) => all.toLowerCase().includes(b));
  check('aucun « % », aucune note, aucune comparaison', all.includes(HARD) && found.length === 0, found.join(', '));
  const every = ev('Object.keys(BILAN_TIPS)')
    .map((k) => card({ skills: { [k]: hard(day(0)) } }).text)
    .join(' ');
  const found2 = banned.filter((b) => every.toLowerCase().includes(b));
  check('ni dans aucun conseil affiché', found2.length === 0, found2.join(', '));
}

function conseils({ card, ev }) {
  section('La table des conseils (14, 16)');
  const keys = ev('[...GAME_LIST.map(g => g.key), ...SKILL_GROUPS.flatMap(g => g.games)]');
  const tips = ev('JSON.parse(JSON.stringify(BILAN_TIPS))');
  const missing = keys.filter((k) => !tips[k] || typeof tips[k].tip !== 'string' || !/[.?»]$/.test(tips[k].tip.trim()));
  check(
    'chaque jeu suivi a son conseil, qui finit par « . », « ? » ou « » »',
    keys.length >= 31 && missing.length === 0,
    missing.join(', '),
  );
  const stray = Object.keys(tips).filter((k) => !keys.includes(k));
  check('aucun conseil pour un jeu qui n’existe pas', stray.length === 0, stray.join(', '));
  const names = ev('GAME_LIST.map(g => g.emoji + " " + g.name)');
  const texts = [...Object.values(tips).flatMap((t) => [t.tip, t.name || '']), ...names];
  const unsafe = texts.filter((t) => /[<>&"]/.test(t));
  check('aucun conseil ni aucun nom ne contient <, >, & ou "', unsafe.length === 0, unsafe.join(' | '));
  check(
    'chaque jeu suivi qui résiste a une ligne avec son nom',
    keys.every((k) => {
      const t = card({ skills: { [k]: hard(day(0)) } }).text;
      return t.includes(HARD) && t.includes('Une idée sans écran : ' + tips[k].tip);
    }),
  );
  check('constantes : 7 jours, 3 jeux au plus', ev('BILAN_DAYS') === 7 && ev('BILAN_MAX') === 3);
}

function rienNeSort() {
  section('Rien ne quitte l’appareil (15)');
  const file = path.join(page.root, 'js/features/parents/bilan.js');
  const src = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : null;
  const net = ['fetch(', 'XMLHttpRequest', 'sendBeacon', 'navigator.share', 'WebSocket'];
  const used = src == null ? ['fichier absent'] : net.filter((x) => src.includes(x));
  check('bilan.js n’appelle aucune API réseau ni de partage', used.length === 0, used.join(', '));
}

(async () => {
  const k = await open();
  await carteParents(k);
  rendus(k);
  fenetre(k);
  vaBien(k);
  soutien(k);
  niNote(k);
  conseils(k);
  rienNeSort();
  finish('bilan', k.errs);
})();
