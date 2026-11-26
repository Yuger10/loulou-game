// Le bilan de la semaine de l'espace parents (track bilan-parents_20261122) :
// une carte « 🧭 Cette semaine » dit ce qui va bien, ce qui résiste cette
// semaine (3 jeux au plus) et, pour chacun, une idée à faire sans écran.
// Les numéros entre parenthèses sont ceux du « Comportement attendu » de la spec.
// La carte se calcule à l'affichage depuis `skills` : aucune note, aucun
// pourcentage, rien n'est envoyé, et une entrée abîmée d'une partie importée
// est ignorée sans que la partie soit corrigée.
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');
const page = require('./tools/page.js');

const html = page.buildHtml();
let failed = 0,
  passed = 0;
function check(name, cond, detail) {
  if (cond) {
    passed++;
    console.log('✅ ' + name);
  } else {
    failed++;
    console.log('❌ ' + name + (detail ? `\n     → ${detail}` : ''));
  }
}
function section(name) {
  console.log('— ' + name);
}
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

function boot(saved) {
  const dom = new JSDOM(html, {
    runScripts: 'dangerously',
    pretendToBeVisual: true,
    url: 'http://localhost/?saison=aucune',
    beforeParse(win) {
      win.SpeechSynthesisUtterance = function () {};
      win.speechSynthesis = { speaking: false, cancel() {}, getVoices: () => [], speak() {} };
      if (saved) for (const [k, v] of Object.entries(saved)) win.localStorage.setItem(k, v);
    },
  });
  const w = dom.window;
  const errs = [];
  w.addEventListener('error', (e) => errs.push(e.message));
  return { w, d: w.document, ev: (code) => w.eval(code), errs };
}

// les jours : même formule que la spec (calendrier local, comme todayKey)
const pad = (n) => String(n).padStart(2, '0');
function day(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// des suivis de jeu construits à la main
const OK = (t = 2) => ({ t, e: 0, ok: true });
const KO = (t = 2) => ({ t, e: 2, ok: false });
/** à l'aise : au moins 3 missions récentes, sans erreur ni échec */
const aise = (last, more) => ({
  wins: 5,
  fails: 0,
  errors: 0,
  last,
  recent: [OK(), OK(), OK(), OK()],
  hints: 0,
  ...more,
});
/** à travailler : `ko` missions ratées parmi les dernières */
const hard = (last, ko = 3, more) => ({
  wins: 1,
  fails: ko,
  errors: 2 * ko,
  last,
  recent: [...Array.from({ length: ko }, () => KO()), OK()],
  hints: 0,
  ...more,
});

const FOOT = "Ces idées viennent des parties jouées sur cet appareil. Rien n'est envoyé ailleurs.";
const EMPTY = 'Pas de partie ces 7 derniers jours.';
const GOOD = 'Ce qui va bien :';
const HARD = 'Ce qui résiste cette semaine :';
const NONE = 'Rien ne résiste cette semaine.';
const TITLE = '🧭 Cette semaine';
const BLOCKS = [TITLE, EMPTY, GOOD, HARD, NONE, FOOT];

const profilesOf = (current) =>
  JSON.stringify({
    list: [
      { id: 'p1', name: 'Nina', avatar: '👧' },
      { id: 'p2', name: 'Léo', avatar: '👦' },
    ],
    current,
  });
const saveOf = (name, skills, more) => JSON.stringify({ v: 9, name, avatar: '👧', missions: 12, skills, ...more });

(async () => {
  const { w, d, ev, errs } = boot({
    'lagon-magique-profiles': profilesOf('p1'),
    'lagon-magique-save:p1': saveOf('Nina', { count: hard(day(1)) }),
    'lagon-magique-save:p2': saveOf('Léo', { memory: aise(day(2)) }),
  });
  await wait(300);

  // la carte montée dans un élément : on lit ce que le parent voit (textContent)
  const stage = d.createElement('div');
  d.body.appendChild(stage);
  function mount(cardHtml) {
    stage.innerHTML = cardHtml;
    const el = stage.querySelector('.ps-bilan');
    const text = (el ? el.textContent : '').replace(/ /g, ' ').replace(/\s+/g, ' ').trim();
    return { el, text };
  }
  /** la carte d'une partie donnée (objet simple, passé tel quel à bilanHTML) */
  function card(st) {
    let out = '';
    try {
      out = ev(`bilanHTML(${JSON.stringify(st)})`);
    } catch (e) {
      return { el: null, text: '', error: e.message };
    }
    return mount(out);
  }
  /** les blocs présents, dans l'ordre où ils apparaissent */
  const blocksOf = (text) =>
    BLOCKS.filter((b) => text.includes(b))
      .sort((a, b) => text.indexOf(a) - text.indexOf(b))
      .join(' | ');
  /** l'ordre d'apparition de quelques noms dans un texte (absents : non listés) */
  const orderOf = (text, names) =>
    names
      .filter((n) => text.includes(n))
      .sort((a, b) => text.indexOf(a) - text.indexOf(b))
      .join(', ');
  const after = (text, mark) => (text.includes(mark) ? text.slice(text.indexOf(mark)) : '');
  const between = (text, from, to) => {
    const a = after(text, from);
    return to && a.includes(to) ? a.slice(0, a.indexOf(to)) : a;
  };

  section('La carte dans l’espace parents (1, 10, 12)');
  {
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

  section('Rendus selon les cas (2, 8, table)');
  {
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

  section('La fenêtre de la semaine (4, bornes)');
  {
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

  section('Ce qui va bien (3, 9)');
  {
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

  section('Ce qui résiste (4, 5, 6)');
  {
    // 4 jeux résistent : le soutien d'abord, puis les ratés des 6 dernières
    // missions (les anciens ratés de `count` ne comptent pas), puis le plus récent
    const six = [
      KO(),
      KO(),
      { t: 2, e: 3, ok: true },
      { t: 2, e: 3, ok: true },
      { t: 2, e: 3, ok: true },
      { t: 3, e: 3, ok: true },
    ];
    const skills = {
      math: aise(day(3), { support: true }),
      clock: hard(day(4), 3),
      count: { wins: 4, fails: 6, errors: 20, last: day(1), recent: [KO(), KO(), KO(), KO(), ...six], hints: 0 },
      money: hard(day(2), 2, { recent: [KO(), KO(), OK(), OK()] }),
    };
    const { text, el } = card({ skills });
    const list = after(text, HARD);
    check(
      'plus de 3 : soutien d’abord, puis le plus de ratés récents, puis le plus récent',
      orderOf(list, ['Opérations', "L'heure", 'Compter', 'La monnaie']) === "Opérations, L'heure, Compter",
      list,
    );
    check(
      '3 lignes au plus',
      !!el && el.querySelectorAll('.bilan-tip').length === 3,
      String(el && el.querySelectorAll('.bilan-tip').length),
    );
    check('le 4e n’est montré nulle part', !text.includes('La monnaie'), text);

    const same = { volume: hard(day(1)), shapes: hard(day(1)), compare: hard(day(1)), puzzle: hard(day(1)) };
    const ties = after(card({ skills: same }).text, HARD);
    check(
      'à égalité : par clé, dans l’ordre alphabétique',
      orderOf(ties, ['Volumes', 'Formes et couleurs', 'Comparer', 'Les nombres']) ===
        'Comparer, Les nombres, Formes et couleurs',
      ties,
    );

    const line = card({ skills: { count: { ...hard(day(0)), recent: [KO(2), KO(2), KO(3)] } } });
    check(
      'la ligne : emoji, nom, palier de la dernière mission et son repère',
      line.text.includes('🔢 Compter · palier 3 (repère : fin CP, CE1)'),
      line.text,
    );
    const tip =
      'Une idée sans écran : En mettant la table, comptez ensemble les couverts en touchant chacun une seule fois, puis demandez : « Combien en tout ? »';
    check(
      'puis, sur la ligne suivante, « Une idée sans écran : » et le conseil du jeu',
      line.text.includes(tip),
      line.text,
    );
    check(
      'le conseil est dans un paragraphe .bilan-tip',
      !!line.el &&
        [...line.el.querySelectorAll('p.bilan-tip')].some((p) => p.textContent.replace(/\s+/g, ' ').trim() === tip),
    );
    const labels = ['GS, début CP', 'CP', 'fin CP, CE1', 'CE1', 'fin CE1, CE2', 'CE2'];
    check(
      'les 6 repères de palier',
      labels.every((r, i) =>
        card({ skills: { count: { ...hard(day(0)), recent: [KO(i + 1), KO(i + 1), KO(i + 1)] } } }).text.includes(
          `palier ${i + 1} (repère : ${r})`,
        ),
      ),
    );
    const bare = card({
      skills: { count: { wins: 2, fails: 0, errors: 0, last: day(0), recent: [], hints: 0, support: true } },
    }).text;
    check(
      '`recent` vide : la ligne ne parle pas de palier',
      bare.includes('🔢 Compter') && !bare.includes('palier') && bare.includes('Une idée sans écran :'),
      bare,
    );
    const box = card({ skills: { rangement: hard(day(0)) } }).text;
    check(
      'les boîtes de rangement (hors choix des jeux) ont leur nom et leur conseil',
      box.includes('📦 Boîtes de rangement') && box.includes('Triez ensemble le linge'),
      box,
    );
  }

  section('Soutien, limite et « va bien » (18, 19)');
  {
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

  section('Erreur fréquente : l’événement bilan:error-kind (7)');
  {
    const skills = { count: hard(day(0)) };
    const plain = card({ skills });
    check('sans écouteur : rien n’est ajouté', !plain.text.includes('Erreur fréquente'), plain.text);
    const tags = plain.el ? plain.el.querySelectorAll('*').length : -1;

    w.bilanSeen = [];
    w.bilanReply = undefined;
    ev(`window.bilanOff = [
      on('bilan:error-kind', (a) => { window.bilanSeen.push({ key: a.key, same: a.s === window.bilanLive, wins: a.s.wins }); a.s.wins = 999; return undefined; }),
      on('bilan:error-kind', () => 42),
      on('bilan:error-kind', () => '  '),
      on('bilan:error-kind', () => window.bilanReply),
      on('bilan:error-kind', () => 'Une réponse plus tardive'),
    ]`);
    const withReply = (reply, sk = skills) => {
      w.bilanReply = reply;
      return card({ skills: sk });
    };
    const r1 = withReply('Confond 6 et 9');
    check(
      'la première réponse texte non vide est affichée (undefined, 42 et "  " ignorés)',
      r1.text.includes('🔢 Compter · palier 2 (repère : CP) · Erreur fréquente : Confond 6 et 9'),
      r1.text,
    );
    check('une seule phrase est retenue', !r1.text.includes('Une réponse plus tardive'), r1.text);
    const r2 = withReply('  a < b & "c"  ');
    check(
      'une phrase `a < b & "c"` se lit telle quelle',
      r2.text.includes('Erreur fréquente : a < b & "c" Une idée sans écran'),
      r2.text,
    );
    check(
      'et ne crée aucune balise',
      !!r2.el && r2.el.querySelectorAll('*').length === r1.el.querySelectorAll('*').length,
    );
    const r3 = withReply('<img id="pwn-bilan" src="x"><b>gras</b>');
    check(
      'du HTML reçu reste du texte',
      !d.getElementById('pwn-bilan') && !!r3.el && !r3.el.querySelector('b, img') && r3.text.includes('<b>gras</b>'),
      r3.text,
    );
    const r4 = withReply('x'.repeat(100));
    check(
      'la phrase est coupée à 80 caractères',
      (r4.text.match(/x+/g) || []).some((m) => m.length === 80) && !/x{81}/.test(r4.text),
      r4.text,
    );
    const r5 = withReply('y'.repeat(79) + '<' + 'z'.repeat(20));
    check(
      'coupée avant l’échappement (80 caractères lus, pas 80 d’entités)',
      r5.text.includes('y'.repeat(79) + '< Une idée'),
      r5.text,
    );
    const r6 = withReply('Confond 6 et 9', {
      count: { wins: 2, fails: 0, errors: 0, last: day(0), recent: [], hints: 0, support: true },
    });
    check(
      '`recent` vide : le type d’erreur sans le palier',
      r6.text.includes('🔢 Compter · Erreur fréquente : Confond 6 et 9') && !r6.text.includes('palier'),
      r6.text,
    );
    for (const reply of [null, 0, {}, ['a'], '', '   ']) {
      w.bilanReply = reply;
      ev('window.bilanOff[4]()'); // sans la réponse de secours, aucune phrase n'est retenue
      const r = card({ skills });
      ev("window.bilanOff[4] = on('bilan:error-kind', () => 'Une réponse plus tardive')");
      check(
        `réponse ${JSON.stringify(reply)} : rien n’est ajouté`,
        !r.error && !r.text.includes('Erreur fréquente') && r.el.querySelectorAll('*').length === tags,
        r.error || r.text,
      );
    }

    // l'écouteur reçoit la clé et une copie : la partie n'est jamais touchée
    w.bilanSeen = [];
    w.bilanReply = 'Confond 6 et 9';
    ev(`state.skills = ${JSON.stringify(skills)}; window.bilanLive = state.skills.count`);
    const before = ev('JSON.stringify(state)');
    mount(ev('bilanHTML(state)'));
    check(
      'l’écouteur reçoit { key, s }',
      w.bilanSeen.length === 1 && w.bilanSeen[0].key === 'count' && w.bilanSeen[0].wins === 1,
      JSON.stringify(w.bilanSeen),
    );
    check(
      '`s` est une copie, jamais l’objet de la sauvegarde',
      w.bilanSeen.length === 1 && w.bilanSeen[0].same === false,
    );
    check('un écouteur qui modifie `s` ne change pas la partie', ev('JSON.stringify(state)') === before);
    ev('window.bilanOff.forEach((off) => off())');

    // un écouteur qui plante : emit isole l'erreur, la ligne n'ajoute rien
    await wait(20);
    const n = errs.length;
    ev("window.bilanBoom = on('bilan:error-kind', () => { throw new Error('boum bilan'); })");
    const r7 = card({ skills });
    check(
      'un écouteur qui plante : la carte s’affiche, sans phrase',
      !r7.error && r7.text.includes('🔢 Compter') && !r7.text.includes('Erreur fréquente'),
      r7.error || r7.text,
    );
    ev('window.bilanBoom()');
    await wait(20);
    errs.splice(n); // l'erreur voulue de l'écouteur est relancée par le bus : elle ne compte pas
  }

  section('Parties vides ou jamais jouées (11)');
  {
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

  section('Une partie importée abîmée (17)');
  {
    // référence : un jeu à l'aise et joué dans la fenêtre, plus un acquis ancien
    const ref = () => ({ count: aise(day(1)), memory: aise(day(20)) });
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
    const sane = read(ref());
    check(
      'référence : le jeu est cité, rien ne résiste',
      !sane.error && blocksOf(sane.text) === [TITLE, GOOD, NONE, FOOT].join(' | ') && sane.text.includes('Compter'),
      sane.error || sane.text,
    );
    const without = read({ memory: aise(day(20)) });
    const entry = (i, more) => (skills) => {
      skills.count.recent[i] = { ...skills.count.recent[i], ...more };
    };
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

  section('Ni note, ni comparaison (13)');
  {
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

  section('La table des conseils (14, 16)');
  {
    const keys = ev('[...GAME_LIST.map(g => g.key), ...SKILL_GROUPS.flatMap(g => g.games)]');
    const tips = ev('JSON.parse(JSON.stringify(BILAN_TIPS))');
    const missing = keys.filter(
      (k) => !tips[k] || typeof tips[k].tip !== 'string' || !/[.?»]$/.test(tips[k].tip.trim()),
    );
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

  section('Rien ne quitte l’appareil (15)');
  {
    const file = path.join(page.root, 'js/features/parents/bilan.js');
    const src = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : null;
    const net = ['fetch(', 'XMLHttpRequest', 'sendBeacon', 'navigator.share', 'WebSocket'];
    const used = src == null ? ['fichier absent'] : net.filter((x) => src.includes(x));
    check('bilan.js n’appelle aucune API réseau ni de partage', used.length === 0, used.join(', '));
    check('aucune erreur JS', errs.length === 0, errs.join(' | '));
  }

  console.log(`\n${failed ? '❌' : '✅'} bilan : ${passed} vérifications réussies, ${failed} en échec`);
  process.exit(failed ? 1 : 0);
})();
