// Le Monde des Chatouilles : « Le chemin de la plume » (coding), de vraies
// parties tirées par le jeu (critères 15 et 16, règle G6) et les indices du
// compagnon (critère 17, table H1). Harnais : test/tools/chatouilles.js.
const t = require('./tools/chatouilles.js');
const { ev, json, check, section, all, one } = t;

// critères 15, 16, G6 : de vraies parties, tirées par le jeu
async function parties() {
  const dirs = { 2: new Set(), 3: new Set() };
  const keys = [];
  for (let k = 0; k < 24; k++) {
    const p = k % 2 ? 3 : 2;
    t.startGame('coding', p);
    dirs[p].add(one('#cd-grid').dataset.dir);
    if (p === 2) keys.push(json(t.gridOnScreen()));
  }
  check('critère 15 : départ vers le haut au palier 2, au hasard au palier 3', () => [
    json([...dirs[2]]) === json(['0']),
    dirs[3].size >= 2,
  ]);
  check('G6 : la même grille ne revient pas deux fois de suite', () => [
    keys.every((k, i) => i === 0 || k !== keys[i - 1]),
  ]);
  for (const p of t.TIERS) {
    t.startGame('coding', p);
    const g = t.gridOnScreen();
    const prog = t
      .sol()
      .slice(0, -1)
      .map((x) => one(x).dataset.op);
    const mine = t.shortest(g);
    const ok = t.run(g, prog).end === 'goal' && prog.length === mine.len && t.turnsOf(g.mode, prog) === mine.turns;
    const win = t.play(t.sol()) && (await t.won());
    check(`critère 16, palier ${p} : jouer la solution (un plus court programme) gagne la mission`, [ok, win]);
    ev('closeModal()');
  }
}

// critère 17, table H1
async function indices() {
  for (const p of [1, 2]) {
    t.openCoding(p, t.fallbackGrid(p));
    const h = ev('hintsFor("coding", hint.q)');
    const first =
      p === 1
        ? "Suis le chemin avec ton doigt, case par case, de la plume jusqu'à Guili. Une flèche, c'est une case."
        : 'La plume avance dans le sens de sa pointe. Pour changer de direction, elle tourne sur place, à gauche ou à droite. Mets-toi à sa place !';
    t.hintBtn().click();
    const glow1 = one('#cd-grid').classList.contains('hint-glow');
    t.hintBtn().click();
    // palier 1 : un seul segment, sa première case ; palier 2 : les deux cases avant le virage (ordre de la page)
    const cells =
      p === 1
        ? [['3', '1']]
        : [
            ['1', '0'],
            ['2', '0'],
          ];
    check(`critère 17, palier ${p} : indice 1 la méthode, indice 2 le début du chemin, rien d'écarté`, () => [
      h.length === 2 && h[0].say === first,
      h[1].say.startsWith('Je te montre le début du chemin. Combien de cases ? Ensuite, à toi de trouver la suite !'),
      !/[↰↱]/.test(h[0].say + h[1].say),
      glow1,
      json(all('.cd-cell.hint-glow').map((x) => [x.dataset.r, x.dataset.c])) === json(cells),
      all('#modal-body .hint-dim').length === 0,
      t.steps().length === 0,
    ]);
    const win = t.play(t.sol()) && (await t.won());
    check(`critère 17, palier ${p} : le jeu reste gagnable après les indices`, [win]);
    ev('closeModal()');
  }
  // un programme qui commence par un virage : l'indice 2 le fait remarquer
  t.openCoding(3, { ...t.fallbackGrid(3), dir: 3 });
  const h = ev('hintsFor("coding", hint.q)');
  check('H1 : si le plus court programme commence par un virage, l’indice 2 demande où pointe la plume', () => [
    ev('hint.q.best.prog[0]') !== 'F',
    h[1].say.endsWith('Regarde où pointe la plume : faut-il tourner avant d’avancer ?'.replace('’', "'")),
  ]);
  ev('closeModal()');
}

(async () => {
  await t.start();
  section('Le chemin de la plume : vraies parties (G6, critères 15 et 16)');
  await parties();
  section('Le chemin de la plume : indices du compagnon (H1)');
  await indices();
  await t.finish('le Monde des Chatouilles (coding, parties et indices)');
})();
