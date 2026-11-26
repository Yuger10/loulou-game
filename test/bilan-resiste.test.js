// Le bilan de la semaine, suite de test/bilan.test.js (track
// bilan-parents_20261122) : les jeux qui résistent (ordre, limite, ligne et
// conseil) et la phrase « Erreur fréquente » qu'une autre slice peut fournir
// par l'événement `bilan:error-kind`. Les numéros entre parenthèses sont ceux
// du « Comportement attendu » de la spec.
const {
  check,
  section,
  wait,
  day,
  OK,
  KO,
  aise,
  hard,
  HARD,
  orderOf,
  after,
  open,
  finish,
} = require('./tools/bilan-kit.js');

function resisteOrdre({ card }) {
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
}

function resisteLigne({ card }) {
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

// le jeu qui résiste des vérifications de « Erreur fréquente »
const skills = { count: hard(day(0)) };

/** branche les écouteurs de `bilan:error-kind` ; rend la carte obtenue pour une réponse donnée */
function listen({ w, ev, card }) {
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
  return withReply;
}

function erreurPhrase({ d }, withReply) {
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
}

function erreurVide({ w, ev, card }, tags) {
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
}

function erreurCopie({ w, ev, mount }) {
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
}

async function erreurPlante({ ev, card, errs }) {
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

async function erreurFrequente(k) {
  const plain = k.card({ skills });
  check('sans écouteur : rien n’est ajouté', !plain.text.includes('Erreur fréquente'), plain.text);
  const tags = plain.el ? plain.el.querySelectorAll('*').length : -1;
  const withReply = listen(k);
  erreurPhrase(k, withReply);
  erreurVide(k, tags);
  erreurCopie(k);
  await erreurPlante(k);
}

(async () => {
  const k = await open();
  section('Ce qui résiste (4, 5, 6)');
  resisteOrdre(k);
  resisteLigne(k);
  section('Erreur fréquente : l’événement bilan:error-kind (7)');
  await erreurFrequente(k);
  finish('bilan-resiste', k.errs);
})();
