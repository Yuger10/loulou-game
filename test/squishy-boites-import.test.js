// Les boîtes de rangement durables de la chambre à squishies (track
// squishy-boites), phase 1 : l'état neuf, la migration, et le nettoyage d'une
// partie importée par readSave. Harnais : test/tools/squishy-boites.js.
const {
  boot,
  ev,
  errs,
  wait,
  check,
  section,
  json,
  same,
  crate,
  E,
  rep,
  setSq,
  crates,
  stored,
  sqSave,
  loadSave,
  cleaned,
  start,
  finish,
} = require('./tools/squishy-boites.js');

(async () => {
  await start();

  section('État neuf et migration (spec 1, 2)');
  const V = ev('SAVE_VERSION');
  await (async () => {
    check(
      'partie neuve : 3 boîtes vides',
      same(ev('squishyFreshState().crates'), [E, E, E]),
      ev('squishyFreshState().crates'),
    );
    check('freshState() porte aussi ses 3 boîtes', same(ev('freshState().squishies.crates'), [E, E, E]));
    const shelf = Array(12).fill(null);
    shelf[3] = 'donut';
    const old = {
      v: V - 1,
      coins: 7,
      name: 'Lou',
      avatar: '👧',
      squishies: {
        owned: { donut: 2, chat: 1 },
        boxes: ['capy', null],
        shelf,
        dry: 1,
        done: {},
        fromStory: { lagon: true },
        day: { date: '2026-01-01', bought: 1, sorted: 2 },
        sorted: 4,
        hello: true,
        treasures: ['grisou-arc'],
      },
    };
    const m = ev(`migrate(${json(old)})`);
    check('migrate : 3 boîtes vides', same(m.squishies.crates, [E, E, E]), m.squishies.crates);
    check('migrate : la version est la version courante', m.v === V);
    const kept = (sq) =>
      ['owned', 'boxes', 'shelf', 'sorted', 'day', 'treasures'].every((k) => same(sq[k], old.squishies[k]));
    check('migrate : owned, boxes, shelf, sorted, day, treasures inchangés', kept(m.squishies));
    const sq = loadSave(old);
    check('vrai chargement : 3 boîtes vides', same(sq.crates, [E, E, E]), sq.crates);
    check(
      'vrai chargement : version courante, rien de perdu',
      ev('state.v') === V && kept(sq) && ev('state.coins') === 7,
    );
    check('une partie sans squishies ne plante pas la migration', ev(`migrate({ v: ${V - 1}, coins: 1 }).v`) === V);
  })();

  section('Nettoyage des boîtes importées (spec 3 à 11, 5b, 11b)');
  await (async () => {
    const lots = { donut: 9, lapin: 9, cupcake: 9, 'capy-fraise': 9 };
    check(
      '3 : crates qui n’est pas un tableau → 3 boîtes vides',
      same(cleaned({ owned: lots, crates: 'abîmé' }), [E, E, E]),
    );
    check(
      '3 : un objet à la place du tableau → 3 boîtes vides',
      same(cleaned({ owned: lots, crates: { 0: E } }), [E, E, E]),
    );
    const labels = [
      'fav',
      'color:rose',
      'color:bleu',
      'shape:rond',
      'size:petit',
      'series:capy',
      'color:vert',
      'color:jaune',
    ];
    const ten = [...labels, 'color:orange', 'color:violet'].map((l) => crate(l));
    const eight = cleaned({ owned: lots, crates: ten });
    check(
      '4 : plus de 8 boîtes → les 8 premières',
      same(
        eight.map((c) => c.label),
        labels,
      ),
      eight.map((c) => c.label),
    );
    check(
      '5 : moins de 3 boîtes → complétées à la fin',
      same(cleaned({ owned: lots, crates: [crate('fav', ['donut'])] }), [crate('fav', ['donut']), E, E]),
    );
    check('5 : un tableau vide → 3 boîtes vides', same(cleaned({ owned: lots, crates: [] }), [E, E, E]));
    check(
      '5b : un élément qui n’est pas un objet devient une boîte vide à sa place ; items non tableau → []',
      same(cleaned({ owned: lots, crates: [null, 'x', { label: 'fav', items: 'abc', done: true }] }), [
        E,
        E,
        crate('fav', [], true),
      ]),
    );
    check(
      '5b : tableau, nombre, booléen comptent dans la longueur, l’ordre des autres ne change pas',
      same(cleaned({ owned: lots, crates: [[1], crate('fav', ['donut']), 7, true, crate('color:rose', ['lapin'])] }), [
        E,
        crate('fav', ['donut']),
        E,
        E,
        crate('color:rose', ['lapin']),
      ]),
    );
    check(
      '6 : id inconnu, trésor, nombre, objet retirés',
      same(
        cleaned({
          owned: lots,
          treasures: ['grisou-arc'],
          crates: [crate('fav', ['donut', 'inconnu', 'grisou-arc', 42, { a: 1 }, null, 'lapin', 'constructor'])],
        })[0].items,
        ['donut', 'lapin'],
      ),
    );
    check(
      '7 : plus de 6 éléments → les 6 premiers',
      same(
        cleaned({ owned: lots, crates: [crate('fav', [...rep('donut', 5), 'lapin', 'cupcake', 'donut'])] })[0].items,
        [...rep('donut', 5), 'lapin'],
      ),
    );
    const shelf = Array(12).fill(null);
    shelf[0] = 'donut';
    check(
      '8 : exemplaires en trop retirés depuis la dernière boîte (2 donuts, 1 sur l’étagère)',
      same(
        cleaned({ owned: { donut: 2 }, shelf, crates: [crate('fav', ['donut']), crate('fav', ['donut'])] }).map(
          (c) => c.items,
        ),
        [['donut'], [], []],
      ),
    );
    check(
      '8 : dans une boîte, on retire depuis le dernier élément',
      same(
        cleaned({ owned: { donut: 2, lapin: 1 }, crates: [crate('fav', ['donut', 'lapin', 'donut', 'donut'])] })[0]
          .items,
        ['donut', 'lapin', 'donut'],
      ),
    );
    check(
      '8 : un owned qui n’est pas un entier positif compte pour 0 (texte, négatif, décimal, absent)',
      same(
        cleaned({
          owned: { donut: '3', lapin: -1, chat: 1.5, mochi: null },
          crates: [crate('fav', ['donut', 'lapin', 'chat', 'mochi', 'glace'])],
        })[0].items,
        [],
      ),
    );
    check(
      '8 : owned qui n’est pas un objet, étagère qui n’est pas un tableau : rien ne plante',
      same(cleaned({ owned: 'x', shelf: 'y', crates: [crate('fav', ['donut'])] }), [crate('fav'), E, E]) &&
        errs.length === 0,
    );
    check(
      '9 : étiquette invalide → sans étiquette, vidée',
      same(cleaned({ owned: lots, crates: [crate('color:noir', ['donut'], true), crate(42, ['donut'])] }), [E, E, E]),
    );
    check(
      '9 : une boîte sans étiquette n’a ni élément ni done',
      same(cleaned({ owned: lots, crates: [crate(null, ['donut'], true)] }), [E, E, E]),
    );
    const lic = ev('squishiesOf("licornes")[0]');
    check(
      '9 : une série pas encore disponible, ou deux règles au cran 1, restent posées (grammaire seule)',
      same(
        cleaned({
          owned: { [lic]: 1, lapin: 1 },
          crates: [crate('series:licornes', [lic]), crate('size:petit+color:rose', ['lapin'])],
        }),
        [crate('series:licornes', [lic]), crate('size:petit+color:rose', ['lapin']), E],
      ),
    );
    check(
      '10 : un exemplaire hors étiquette est retiré (sauf fav)',
      same(
        cleaned({
          owned: lots,
          crates: [crate('color:rose', ['donut', 'cupcake', 'lapin']), crate('fav', ['cupcake', 'donut'])],
        }).map((c) => c.items),
        [['donut', 'lapin'], ['cupcake', 'donut'], []],
      ),
    );
    check(
      '11 : done qui n’est pas un booléen → false ; true reste',
      same(
        cleaned({ owned: lots, crates: [crate('fav', [], 'oui'), crate('fav', [], 1), crate('fav', [], true)] }).map(
          (c) => c.done,
        ),
        [false, false, true],
      ),
    );
    // 11b : à la version courante, sans champ crates
    const bare = sqSave({ owned: { donut: 1 } });
    delete bare.squishies.crates;
    const sq = loadSave(bare);
    check(
      '11b : crates absent reste absent après readSave',
      sq.crates === undefined && !('crates' in stored().squishies),
    );
    check(
      '11b : readSave directe ne crée pas le champ',
      ev(`"crates" in readSave(${json(json(bare))}).squishies`) === false,
    );
    check('11b : la chambre le complète à 3 boîtes vides', same(ev('squishyCrates()'), [E, E, E]) && errs.length === 0);

    // tout à la fois : l'ordre de nettoyage des Politiques
    const mess = [
      'x',
      { label: 'color:rose', items: ['cupcake', 'zzz', ...rep('donut', 8)], done: 'yes' },
      crate(null, ['donut'], true),
      crate('fav', ['donut', 'lapin'], true),
      crate('color:noir', ['donut'], true),
      { label: 'fav', items: 'abc' },
      crate('fav'),
      crate('fav'),
      crate('fav', ['lapin']),
      crate('fav', ['lapin']),
    ];
    const expected = [
      E,
      crate('color:rose', rep('donut', 6)),
      E,
      crate('fav', ['donut', 'lapin'], true),
      E,
      crate('fav'),
      crate('fav'),
      crate('fav'),
    ];
    const messy = sqSave({ owned: { donut: 8, lapin: 1, cupcake: 1 }, shelf, crates: mess });
    check(
      'tout à la fois, par readSave directe : forme, longueur, done, étiquette, éléments, 6 au plus, puis exemplaires en trop',
      same(ev(`readSave(${json(json(messy))}).squishies.crates`), expected),
      ev(`readSave(${json(json(messy))}).squishies.crates`),
    );
    // la même partie abîmée, posée dans le stockage avant le démarrage
    const other = boot({
      'lagon-magique-profiles': json({ list: [{ id: 'p1', name: 'Nina', avatar: '👧' }], current: 'p1' }),
      'lagon-magique-save:p1': json(Object.assign(messy, { name: 'Nina' })),
    });
    await wait(300);
    check(
      'tout à la fois, au démarrage du jeu : mêmes boîtes, aucune erreur JS',
      same(other.ev('state.squishies.crates'), expected) && other.errs.length === 0,
      other.errs.join(' | ') || other.ev('state.squishies.crates'),
    );
    other.w.close();

    // 3 par applyBackup : une sauvegarde construite à la main
    setSq({ owned: { donut: 2 } });
    ev('saveProfiles()');
    const backup = JSON.parse(ev('JSON.stringify(buildBackup())'));
    const key = ev('currentSaveKey()');
    const game = JSON.parse(backup.data[key]);
    game.squishies.crates = 'abîmé';
    backup.data[key] = json(game);
    const before = errs.length;
    ev(`applyBackup(${json(backup)})`);
    check(
      '3 : applyBackup d’une sauvegarde aux boîtes abîmées : aucune erreur JS, 3 boîtes vides',
      errs.length === before && same(crates(), [E, E, E]) && ev('state.squishies.owned.donut') === 2,
      crates(),
    );
    ev('closeModal()');
  })();

  await finish('état neuf, migration, import');
})();
