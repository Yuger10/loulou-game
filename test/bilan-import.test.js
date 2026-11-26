// Le bilan de la semaine, suite de test/bilan.test.js (track
// bilan-parents_20261122) : les parties vides ou jamais jouées, et une partie
// importée abîmée, lue par readSave comme le fait le jeu. Une entrée abîmée
// est ignorée sans que la partie soit corrigée. Les numéros entre parenthèses
// sont ceux du « Comportement attendu » de la spec.
const {
  check,
  section,
  day,
  OK,
  aise,
  hard,
  FOOT,
  EMPTY,
  GOOD,
  NONE,
  TITLE,
  saveOf,
  blocksOf,
  between,
  open,
  finish,
} = require('./tools/bilan-kit.js');

function partiesVides({ card, d }) {
  section('Parties vides ou jamais jouées (11)');
  for (const st of [{}, { skills: null }, { skills: 'x' }, { skills: 42 }, { skills: [] }, { skills: {} }]) {
    const r = card(st);
    check(
      `partie ${JSON.stringify(st)} : « fenêtre vide, aucun jeu à l’aise »`,
      !r.error && blocksOf(r.text) === [TITLE, EMPTY, FOOT].join(' | '),
      r.error || r.text,
    );
  }
  const never = { wins: 0, fails: 0, errors: 0, last: null, recent: [], hints: 1 };
  const r = card({ skills: { count: never, memory: aise(day(1)) } });
  check(
    'une entrée jamais jouée (créée par un indice) n’est dans aucun bloc',
    !r.text.includes('Compter') && blocksOf(r.text) === [TITLE, GOOD, NONE, FOOT].join(' | '),
    r.text,
  );
  const alone = card({ skills: { count: never } });
  check(
    'seule, elle ne compte pas comme une partie de la semaine',
    blocksOf(alone.text) === [TITLE, EMPTY, FOOT].join(' | '),
    alone.text,
  );
  const unknown = card({ skills: { inconnu: hard(day(0)), '<img id="pwn-cle">': hard(day(0)) } });
  check(
    'un jeu inconnu de la sauvegarde n’est pas lu',
    blocksOf(unknown.text) === [TITLE, EMPTY, FOOT].join(' | ') && !d.getElementById('pwn-cle'),
    unknown.text,
  );
}

// référence : un jeu à l'aise et joué dans la fenêtre, plus un acquis ancien
const ref = () => ({ count: aise(day(1)), memory: aise(day(20)) });
const entry = (i, more) => (skills) => {
  skills.count.recent[i] = { ...skills.count.recent[i], ...more };
};

/** rend la fonction qui lit une partie comme le jeu : voir `read` */
function reader({ ev, mount }) {
  /** lit la partie comme le jeu (readSave), rend la carte, vérifie que rien n'est écrit */
  const read = (skills) => {
    try {
      const r = ev(`(() => {
        const st = readSave(${JSON.stringify(saveOf('Nina', skills))});
        const before = JSON.stringify(st);
        const out = bilanHTML(st);
        return { out, same: before === JSON.stringify(st) };
      })()`);
      return { ...mount(r.out), same: r.same, html: r.out };
    } catch (e) {
      return { error: e.message, text: '', same: false, html: '' };
    }
  };
  return read;
}

function abimee(read) {
  const sane = read(ref());
  check(
    'référence : le jeu est cité, rien ne résiste',
    !sane.error && blocksOf(sane.text) === [TITLE, GOOD, NONE, FOOT].join(' | ') && sane.text.includes('Compter'),
    sane.error || sane.text,
  );
  const without = read({ memory: aise(day(20)) });
  const broken = [
    ['last: "hier"', (s) => void (s.count.last = 'hier')],
    ['last: "2026-1-5"', (s) => void (s.count.last = '2026-1-5')],
    ['recent de 11 entrées', (s) => void (s.count.recent = Array.from({ length: 11 }, () => OK()))],
    ['t: 0', entry(0, { t: 0 })],
    ['t: 7', entry(1, { t: 7 })],
    ['t: 2.5', entry(3, { t: 2.5 })],
    ['e: 1.5', entry(2, { e: 1.5 })],
    ['wins: 2.5', (s) => void (s.count.wins = 2.5)],
    ['fails: 1.5', (s) => void (s.count.fails = 1.5)],
  ];
  for (const [name, breakIt] of broken) {
    const skills = ref();
    breakIt(skills);
    const r = read(skills);
    check(`${name} : pas d’exception`, !r.error, r.error);
    check(`${name} : le jeu n’apparaît nulle part`, !r.error && !r.text.includes('Compter'), r.text);
    check(`${name} : la carte est celle des autres jeux`, r.html === without.html && r.html !== '', r.text);
    check(`${name} : la partie n’est pas corrigée par le bilan`, r.same === true);
  }
}

function corrigee(read) {
  // ce que readSave corrige déjà : l'entrée remise en forme suit les autres règles
  const fixed = [
    ['wins: -1', (s) => void (s.count.wins = -1), (t) => !t.includes('Compter') && t.includes(NONE)],
    ['t: "3"', entry(0, { t: '3' }), (t) => !t.includes('Compter')],
    ['ok: 1', entry(3, { ok: 1 }), (t) => !t.includes('Compter') && t.includes(NONE)],
    ['support: "oui"', (s) => void (s.count.support = 'oui'), (t) => between(t, GOOD, NONE).includes('Compter')],
    ['recent absent', (s) => void delete s.count.recent, (t) => !t.includes('Compter') && t.includes(NONE)],
    ['entrée null', (s) => void (s.count = null), (t) => !t.includes('Compter') && t.includes(EMPTY)],
  ];
  for (const [name, breakIt, want] of fixed) {
    const skills = ref();
    breakIt(skills);
    const r = read(skills);
    check(
      `${name} (corrigé par readSave) : pas d’exception, entrée traitée selon les règles`,
      !r.error && r.same && want(r.text),
      r.error || r.text,
    );
  }
}

(async () => {
  const k = await open();
  partiesVides(k);
  section('Une partie importée abîmée (17)');
  const read = reader(k);
  abimee(read);
  corrigee(read);
  finish('bilan-import', k.errs);
})();
