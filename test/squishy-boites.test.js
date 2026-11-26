// Les boîtes de rangement durables de la chambre à squishies (track
// squishy-boites) : état neuf, migration, nettoyage d'une partie importée
// (readSave), logique des boîtes (crateAdd…), étiquettes, doubles rangés, puis
// l'onglet « 🗃️ Mes boîtes ». Même harnais que test/squishies.test.js : le
// temps du jeu est accéléré ×10, la voix est notée au lieu d'être dite.
const { JSDOM } = require('jsdom');
const html = require('./tools/page.js').buildHtml();

const SPEED = 0.1;
const spoken = [];
function boot(saved) {
  const dom = new JSDOM(html, {
    runScripts: 'dangerously',
    pretendToBeVisual: true,
    url: 'http://localhost/?saison=aucune',
    beforeParse(win) {
      const st = win.setTimeout.bind(win),
        si = win.setInterval.bind(win);
      win.setTimeout = (fn, ms, ...a) => st(fn, Math.round((ms || 0) * SPEED), ...a);
      win.setInterval = (fn, ms, ...a) => si(fn, Math.max(1, Math.round((ms || 0) * SPEED)), ...a);
      win.SpeechSynthesisUtterance = function (text) {
        this.text = text;
      };
      win.speechSynthesis = {
        speaking: false,
        cancel() {},
        getVoices: () => [],
        speak(u) {
          spoken.push(u.text);
        },
      };
      if (saved) for (const [k, v] of Object.entries(saved)) win.localStorage.setItem(k, v);
    },
  });
  const win = dom.window;
  const errors = [];
  win.addEventListener('error', (e) => errors.push(e.message));
  return { w: win, d: win.document, ev: (code) => win.eval(code), errs: errors };
}
const { w, d, ev, errs } = boot();
w.confirm = () => true;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
let failed = 0,
  passed = 0;
function check(name, cond, detail) {
  if (cond) {
    passed++;
    console.log('✅ ' + name);
  } else {
    failed++;
    console.log(
      '❌ ' +
        name +
        (detail === undefined ? '' : `\n     → ${typeof detail === 'string' ? detail : JSON.stringify(detail)}`),
    );
  }
}
function section(name) {
  console.log('— ' + name);
}
const json = (x) => JSON.stringify(x);
const same = (a, b) => json(a) === json(b);

// une boîte de rangement, et la boîte vide
const crate = (label, items = [], done = false) => ({ label, items, done });
const E = crate(null);
const rep = (id, n) => Array(n).fill(id);
// la collection du joueur : les champs donnés par-dessus un état neuf
const setSq = (o) => ev(`state.squishies = Object.assign(squishyFreshState(), ${json(o)}); save()`);
const crates = () => ev('state.squishies.crates');
const stored = () => JSON.parse(w.localStorage.getItem(ev('currentSaveKey()')));
// une partie enregistrée à la version courante, avec cette collection
const sqSave = (sq) => ({
  v: ev('SAVE_VERSION'),
  name: 'Lou',
  avatar: '👧',
  squishies: Object.assign(ev('squishyFreshState()'), sq),
});
// posée dans le stockage puis lue par le vrai chargement (readSave)
const loadSave = (saved) => {
  ev(`localStorage.setItem(currentSaveKey(), ${json(json(saved))}); load()`);
  return ev('state.squishies');
};
const cleaned = (sq) => loadSave(sqSave(sq)).crates;
const OK = (o) => Object.assign({ ok: true, full: false, coins: 0, newCrate: false, unlock: false }, o);
const NO = (reason) => ({ ok: false, reason });

(async () => {
  await wait(100);
  d.getElementById('btn-splash-play').click();
  d.getElementById('name-input').value = 'Lou';
  d.querySelector('.avatar-opt').click();
  d.getElementById('btn-start').click();
  await wait(150);
  ev('closeModal()');
  const V = ev('SAVE_VERSION');

  /* ================= Phase 1 : état, migration, import ================= */
  section('État neuf et migration (spec 1, 2)');
  {
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
  }

  section('Nettoyage des boîtes importées (spec 3 à 11, 5b, 11b)');
  {
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
  }

  section('Aller-retour de la sauvegarde (spec 12)');
  {
    const mine = [crate('color:rose', ['donut', 'lapin'], true), crate('fav', ['cupcake']), E, crate('series:capy')];
    setSq({ owned: { donut: 2, lapin: 1, cupcake: 1 }, crates: mine });
    ev('saveProfiles()');
    const backup = ev('JSON.stringify(buildBackup())');
    setSq({});
    ev(`applyBackup(JSON.parse(${json(backup)}))`);
    check('fichier : les boîtes reviennent à l’identique', same(crates(), mine), crates());
    const code = 'LAGON1:' + ev(`utf8ToB64(${json(backup)})`);
    setSq({});
    ev(`applyBackup(parseBackupText(${json(code)}).backup)`);
    check('code de transfert : les boîtes reviennent à l’identique', same(crates(), mine), crates());
    ev('closeModal()');
  }

  section('Ranger, sortir, étiqueter (spec 13 à 20)');
  {
    ev('currentProfile().age = 0; state.missions = 0; save()');
    setSq({ owned: { donut: 3, cupcake: 1, lapin: 1 }, crates: [crate('color:rose'), crate('fav'), E] });
    check(
      '13 : un exemplaire libre entre dans sa boîte',
      same(ev('crateAdd(0, "donut")'), OK()),
      ev('crateAdd(0, "donut")'),
    );
    check(
      '13 : il est à la fin de la boîte, et la partie est enregistrée',
      same(crates()[0].items, ['donut', 'donut']) && same(stored().squishies.crates[0].items, ['donut', 'donut']),
    );
    const snap = json(crates());
    check('14 : un bleu dans la boîte des roses → wrong', same(ev('crateAdd(0, "cupcake")'), NO('wrong')));
    check('14 : rien ne change', json(crates()) === snap);
    check(
      '15 : la boîte des préférés accepte tout',
      same(ev('crateAdd(1, "cupcake")'), OK()) && same(crates()[1].items, ['cupcake']),
    );
    check('16 : une boîte sans étiquette → nolabel', same(ev('crateAdd(2, "donut")'), NO('nolabel')));
    check('18 : plus aucun exemplaire libre → none', same(ev('crateAdd(1, "cupcake")'), NO('none')));
    setSq({ owned: { donut: 9 }, crates: [crate('color:rose', rep('donut', 6)), E, E] });
    check('17 : une boîte de 6 → full', same(ev('crateAdd(0, "donut")'), NO('full')) && crates()[0].items.length === 6);
    // l'ordre des refus : le premier qui s'applique gagne
    setSq({
      owned: { donut: 6 },
      crates: [crate(null, rep('donut', 6)), crate('color:rose', rep('donut', 6)), crate('color:rose'), crate('fav')],
    });
    check('refus : bad avant nolabel (id inconnu, boîte sans étiquette)', same(ev('crateAdd(0, "zzz")'), NO('bad')));
    check(
      'refus : bad pour un index qui n’est pas une boîte',
      [99, -1, 1.5, '"0"', 'null'].every((i) => same(ev(`crateAdd(${i}, "donut")`), NO('bad'))),
    );
    check('refus : bad pour un trésor', same(ev('crateAdd(3, "grisou-arc")'), NO('bad')));
    check('refus : nolabel avant full (sans étiquette et 6 éléments)', same(ev('crateAdd(0, "donut")'), NO('nolabel')));
    check(
      'refus : full avant none (pleine, et aucun exemplaire libre)',
      same(ev('crateAdd(1, "cupcake")'), NO('full')),
    );
    check(
      'refus : none avant wrong (aucun cupcake libre, et il est bleu)',
      same(ev('crateAdd(2, "cupcake")'), NO('none')),
    );
    // 19
    setSq({ owned: { donut: 2, lapin: 1 }, crates: [crate('fav', ['donut', 'lapin', 'donut']), E, E] });
    check(
      '19 : aucun exemplaire libre avant de sortir',
      ev('squishyFree("lapin")') === 0 && ev('squishyFree("donut")') === 0,
    );
    check(
      '19 : crateRemove rend libre l’exemplaire à cette position',
      ev('crateRemove(0, 1)') === true &&
        same(crates()[0].items, ['donut', 'donut']) &&
        ev('squishyFree("lapin")') === 1,
    );
    check(
      '19 : position ou index invalide → false, rien ne change',
      [`crateRemove(0, 5)`, `crateRemove(0, -1)`, `crateRemove(9, 0)`, `crateRemove(0, 0.5)`].every(
        (c) => ev(c) === false,
      ) && crates()[0].items.length === 2,
    );
    check(
      '19 : crateEmpty les rend tous libres (une boîte vide renvoie true)',
      ev('crateEmpty(0)') === true &&
        same(crates()[0], crate('fav')) &&
        ev('squishyFree("donut")') === 2 &&
        ev('crateEmpty(0)') === true &&
        ev('crateEmpty(7)') === false,
    );
    check('19 : sortir enregistre la partie', same(stored().squishies.crates[0].items, []));
    // 20
    setSq({ owned: { donut: 2 }, crates: [crate('fav', ['donut']), E, E] });
    check(
      '20 : boîte non vide → false, l’étiquette ne change pas',
      ev('crateSetLabel(0, "color:rose", 0)') === false && crates()[0].label === 'fav',
    );
    check(
      '20 : boîte vide, étiquette permise → true, posée et enregistrée',
      ev('crateSetLabel(1, "color:rose", 0)') === true &&
        crates()[1].label === 'color:rose' &&
        stored().squishies.crates[1].label === 'color:rose',
    );
    check(
      '20 : étiquette invalide, hors cran, série non disponible, index invalide → false',
      [
        'crateSetLabel(2, "color:noir", 8)',
        'crateSetLabel(2, "shape:rond", 0)',
        'crateSetLabel(2, "size:petit+color:rose", 6)',
        'crateSetLabel(2, "series:licornes", 8)',
        'crateSetLabel(9, "fav", 8)',
      ].every((c) => ev(c) === false) && crates()[2].label === null,
    );
    check(
      '20 : on change l’étiquette d’une boîte vide',
      ev('crateSetLabel(1, "fav", 0)') === true && crates()[1].label === 'fav',
    );
  }

  section('Boîte pleine : pièces, nouvelle boîte, déblocage (spec 21 à 24)');
  {
    const five = rep('donut', 5);
    setSq({ owned: { donut: 9 }, crates: [crate('color:rose', five), E, E] });
    ev('state.coins = 10; save()');
    const r = ev('crateAdd(0, "donut")');
    check('21 : la 6ᵉ place d’une boîte de tri', same(r, OK({ full: true, coins: 5, newCrate: true })), r);
    check(
      '21 : +5 pièces, une boîte vide de plus à la fin, done',
      ev('state.coins') === 15 && crates().length === 4 && same(crates()[3], E) && crates()[0].done === true,
    );
    check('21 : enregistré', stored().coins === 15 && stored().squishies.crates.length === 4);
    // unlock : 6 ou 7 ans, la 2ᵉ boîte payée
    ev('currentProfile().age = 6; save()');
    setSq({ owned: { donut: 9 }, crates: [crate('color:rose', five), crate('fav', [], false), E] });
    check('21 : à 6 ans, une première boîte payée ne débloque rien', ev('crateAdd(0, "donut").unlock') === false);
    setSq({ owned: { donut: 9 }, crates: [crate('color:rose', five), crate('color:bleu', [], true), E] });
    const u = ev('crateAdd(0, "donut")');
    check(
      '21 : à 6 ans, la 2ᵉ boîte payée débloque les deux règles',
      same(u, OK({ full: true, coins: 5, newCrate: true, unlock: true })),
      u,
    );
    setSq({
      owned: { donut: 9 },
      crates: [crate('color:rose', five), crate('color:bleu', [], true), crate('color:vert', [], true)],
    });
    check('21 : la 3ᵉ ne débloque plus rien', ev('crateAdd(0, "donut").unlock') === false);
    ev('currentProfile().age = 8; save()');
    setSq({ owned: { donut: 9 }, crates: [crate('color:rose', five), crate('color:bleu', [], true), E] });
    check('21 : à 8 ans (déjà au cran 3), pas de déblocage', ev('crateAdd(0, "donut").unlock') === false);
    ev('currentProfile().age = 0; save()');
    setSq({ owned: { donut: 9 }, crates: [crate('color:rose', five), crate('color:bleu', [], true), E] });
    check('21 : sans âge (cran 1), pas de déblocage', ev('crateAdd(0, "donut").unlock') === false);
    // 22
    setSq({ owned: { donut: 9 }, crates: [crate('color:rose', five), ...Array(7).fill(E)] });
    ev('state.coins = 0; save()');
    const r8 = ev('crateAdd(0, "donut")');
    check(
      '22 : à 8 boîtes, 5 pièces mais pas de 9ᵉ boîte',
      same(r8, OK({ full: true, coins: 5 })) && crates().length === 8 && ev('state.coins') === 5,
      r8,
    );
    ev('currentProfile().age = 6; save()');
    setSq({ owned: { donut: 9 }, crates: [crate('color:rose', five), crate('fav', [], true), ...Array(6).fill(E)] });
    check(
      '22 : à 8 boîtes, le déblocage reste annoncé',
      same(ev('crateAdd(0, "donut")'), OK({ full: true, coins: 5, unlock: true })),
    );
    ev('currentProfile().age = 0; save()');
    // 23
    setSq({ owned: { donut: 9 }, crates: [crate('shape:rond', five, true), E, E] });
    ev('state.coins = 0; save()');
    const r2 = ev('crateAdd(0, "donut")');
    check(
      '23 : une boîte déjà payée ne paie plus',
      same(r2, OK({ full: true })) && ev('state.coins') === 0 && crates().length === 3,
      r2,
    );
    // 24
    setSq({ owned: { donut: 9 }, crates: [crate('fav', five), E, E] });
    const rf = ev('crateAdd(0, "donut")');
    check(
      '24 : la boîte des préférés ne paie jamais, done reste false',
      same(rf, OK({ full: true })) && ev('state.coins') === 0 && crates().length === 3 && crates()[0].done === false,
      rf,
    );
  }

  section('Étiquettes : crans, grammaire, noms dits (spec 25 à 27, D5, D7, D9, D10)');
  {
    ev('currentProfile().age = 0; state.missions = 0; save()');
    setSq({});
    const colors = ['rose', 'bleu', 'jaune', 'vert', 'violet', 'orange'].map((c) => 'color:' + c);
    const base = ['fav', ...colors, 'series:capy', 'series:desserts', 'series:animaux'];
    const more = ['shape:rond', 'shape:ovale', 'shape:carre', 'size:petit', 'size:grand'];
    check(
      '25 : cran 1 (sans âge) : préférés, couleurs, séries disponibles',
      same(ev('crateLabelsFor(null)'), base),
      ev('crateLabelsFor(null)'),
    );
    check(
      '25 : moins de 6 ans : pareil',
      same(ev('crateLabelsFor(5)'), base) && ev('crateLevel(5)') === 1 && ev('crateLevel(null)') === 1,
    );
    check(
      '25 : une série dont l’île n’est pas ouverte n’est ni listée ni permise, à tout cran',
      [0, 6, 8].every((a) => ev(`crateLabelAllowed("series:licornes", ${a})`) === false) &&
        !ev('crateLabelsFor(8)').includes('series:licornes') &&
        ev('crateLabelAllowed("series:capy", 0)') === true,
    );
    check(
      '26 : 6 ou 7 ans : aussi les formes et les tailles',
      same(ev('crateLabelsFor(6)'), [...base, ...more]) && ev('crateLevel(7)') === 2,
      ev('crateLabelsFor(6)'),
    );
    check(
      '25, 26 : forme et taille refusées au cran 1, permises au cran 2',
      ev('crateLabelAllowed("shape:rond", 5)') === false && ev('crateLabelAllowed("size:grand", 6)') === true,
    );
    check(
      '26 : deux règles refusées à 6 ans avant 2 boîtes payées',
      ev('crateLabelAllowed("size:petit+color:rose", 6)') === false,
    );
    setSq({ crates: [crate('fav', [], true), E, E] });
    check(
      '26 : une seule boîte payée ne suffit pas',
      ev('crateLabelAllowed("size:petit+color:rose", 6)') === false && ev('crateLevel(6)') === 2,
    );
    setSq({ crates: [crate('fav', [], true), crate('fav', [], true), E] });
    check(
      '26 : 2 boîtes payées : cran 3 à 6 ans',
      ev('crateLabelAllowed("size:petit+color:rose", 6)') === true && ev('crateLevel(6)') === 3,
    );
    check(
      '26 : le déblocage ne vaut pas avant 6 ans',
      ev('crateLevel(5)') === 1 && ev('crateLabelAllowed("color:rose+shape:rond", 5)') === false,
    );
    setSq({});
    check(
      '27 : 8 ans et plus : cran 3, deux règles permises',
      ev('crateLevel(8)') === 3 &&
        ['size:petit+color:rose', 'color:rose+shape:rond', 'size:grand+shape:carre'].every((k) =>
          ev(`crateLabelAllowed("${k}", 8)`),
        ),
    );
    check(
      'la liste du cran 3 reste celle des étiquettes à une règle',
      same(ev('crateLabelsFor(8)'), [...base, ...more]),
    );
    ev('state.missions = 9999; save()');
    check(
      'toutes les îles ouvertes : les 9 séries, dans l’ordre du catalogue',
      same(
        ev('crateLabelsFor(0)').filter((k) => k.startsWith('series:')),
        ev('SQUISHY_SERIES_ORDER').map((s) => 'series:' + s),
      ) && ev('crateLabelAllowed("series:licornes", 0)') === true,
    );
    ev('state.missions = 0; save()');
    const valid = [
      'fav',
      'color:rose',
      'series:capy',
      'size:petit+color:rose',
      'color:rose+shape:rond',
      'size:grand+shape:carre',
    ];
    const invalid = [
      '"color:noir"',
      '"color:rose+size:petit"',
      '"series:capy+color:rose"',
      '"fav+color:rose"',
      '""',
      '42',
      'null',
      'undefined',
      '"color:constructor"',
      '"shape:rond+shape:carre"',
      '"size:petit+color:rose+shape:rond"',
      '"series:tresors"',
      '"taille:petit"',
    ];
    check(
      'D5 : étiquettes valides',
      valid.every((k) => ev(`crateLabelValid("${k}")`) === true),
    );
    check(
      'D5 : étiquettes invalides',
      invalid.every((k) => ev(`crateLabelValid(${k})`) === false),
      invalid.filter((k) => ev(`crateLabelValid(${k})`) !== false),
    );
    check(
      'crateCriteria : les règles d’une étiquette, null pour les préférés',
      same(ev('crateCriteria("size:petit+color:rose")'), [
        { type: 'size', value: 'petit' },
        { type: 'color', value: 'rose' },
      ]) &&
        same(ev('crateCriteria("series:capy")'), [{ type: 'series', value: 'capy' }]) &&
        ev('crateCriteria("fav")') === null,
    );
    const says = {
      fav: 'Tes préférés : tu mets ceux que tu veux !',
      'color:rose': 'Les roses',
      'color:orange': 'Les orange',
      'shape:rond': 'Les ronds',
      'shape:ovale': 'Les ovales',
      'shape:carre': 'Les carrés',
      'size:petit': 'Les petits',
      'size:grand': 'Les grands',
      'series:capy': 'Les Capybaras',
      'size:petit+color:rose': 'Les petits squishies roses',
      'color:rose+shape:rond': 'Les squishies roses et ronds',
      'size:grand+shape:carre': 'Les grands squishies carrés',
    };
    const badSay = Object.keys(says).filter((k) => ev(`crateOptionSay("${k}")`) !== says[k]);
    check(
      'D9 : crateOptionSay, textes exacts',
      badSay.length === 0,
      badSay.map((k) => ev(`crateOptionSay("${k}")`)),
    );
    const names = {
      fav: 'ta boîte de préférés',
      'series:capy': 'ta boîte des Capybaras',
      'color:rose': 'ta boîte des squishies roses',
      'shape:rond': 'ta boîte des squishies ronds',
      'size:petit': 'ta boîte des petits squishies',
      'size:petit+color:rose': 'ta boîte des petits squishies roses',
      'color:rose+shape:rond': 'ta boîte des squishies roses et ronds',
    };
    const badName = Object.keys(names).filter((k) => ev(`crateName("${k}")`) !== names[k]);
    check(
      'D9 : crateName, textes exacts',
      badName.length === 0,
      badName.map((k) => ev(`crateName("${k}")`)),
    );
    check(
      'D10 : crateWrongHint, textes exacts',
      ev('crateWrongHint("cupcake", "color:rose")') === 'Lui, il est bleu. On cherche des roses !' &&
        ev('crateWrongHint("donut", "series:capy")') === "Lui, c'est un donut. On cherche des Capybaras !" &&
        ev('crateWrongHint("lapin", "size:grand+color:rose")') === 'Lui, il est petit. On cherche des grands !' &&
        ev('crateWrongHint("donut", "fav")') === '',
      [ev('crateWrongHint("cupcake", "color:rose")'), ev('crateWrongHint("donut", "series:capy")')],
    );
    check(
      'l’indice de l’exercice est inchangé',
      ev('sortWrongHint("cupcake", [{type:"color", value:"rose"}])') === 'Lui, il est bleu. On cherche des roses !',
    );
    check('les constantes', same(ev('[CRATE_START, CRATE_MAX, CRATE_SLOTS, CRATE_REWARD]'), [3, 8, 6, 5]));
  }

  section('Doubles, étagère, exercice (spec 28 à 31)');
  {
    const shelf = Array(12).fill(null);
    shelf[0] = 'donut';
    const counts = () => [ev('squishyDuplicates()'), ev('squishyStoredDuplicates()')];
    setSq({ owned: { donut: 3 }, shelf, crates: [crate('fav', ['donut']), E, E] });
    check(
      '28 : 3 donuts, 1 en boîte, 1 sur l’étagère : libre 1, 1 double libre, 1 double rangé',
      ev('squishyFree("donut")') === 1 && ev('squishyCrateCount("donut")') === 1 && same(counts(), [1, 1]),
      counts(),
    );
    setSq({ owned: { donut: 3 } });
    check('28 : 3 donuts, rien de rangé : 2 et 0', same(counts(), [2, 0]), counts());
    setSq({ owned: { donut: 2 }, crates: [crate('fav', ['donut']), crate('fav', ['donut']), E] });
    check('28 : 2 donuts, 2 en boîte : 0 et 1', ev('squishyFree("donut")') === 0 && same(counts(), [0, 1]), counts());
    setSq({ owned: { donut: 1, chat: 1 }, crates: [crate('fav', ['donut']), E, E] });
    check('28 : sans double, 0 et 0', same(counts(), [0, 0]));
    // 29
    setSq({ owned: { donut: 4, mochi: 3, chat: 1 }, crates: [crate('fav', ['donut', 'donut']), E, E] });
    const t = ev('tradeDuplicatesFor("grenouille")');
    check(
      '29 : l’échange prend 3 doubles libres, un par un (donut, mochi, donut)',
      t.ok === true && same(ev('state.squishies.owned'), { donut: 2, mochi: 2, chat: 1, grenouille: 1 }),
      ev('state.squishies.owned'),
    );
    check('29 : les 2 donuts de la boîte sont toujours là', same(crates()[0].items, ['donut', 'donut']));
    setSq({ owned: { donut: 4 }, crates: [crate('fav', ['donut', 'donut', 'donut']), E, E] });
    check(
      '29 : pas assez de doubles libres : refusé, rien ne change',
      ev('tradeDuplicatesFor("grenouille").ok') === false &&
        ev('state.squishies.owned.donut') === 4 &&
        ev('squishyDuplicates()') === 1,
    );
    setSq({ owned: { donut: 4 }, shelf: Array(12).fill('donut').fill(null, 2) });
    check(
      '29 : les doubles posés sur l’étagère ne s’échangent pas non plus',
      ev('squishyDuplicates()') === 2 && ev('tradeDuplicatesFor("grenouille").ok') === false,
    );
    // 30
    setSq({ owned: { donut: 1, lapin: 2 }, crates: [crate('fav', ['donut', 'lapin']), E, E] });
    check(
      '30 : poser sur l’étagère un exemplaire rangé dans une boîte → false',
      ev('shelfPlace(0, "donut")') === false && ev('state.squishies.shelf[0]') === null,
    );
    check(
      '30 : un exemplaire libre se pose',
      ev('shelfPlace(0, "lapin")') === true && ev('shelfPlace(1, "lapin")') === false,
    );
    check('30 : le reposer à sa place reste permis', ev('shelfPlace(0, "lapin")') === true);
    // 31
    const big = Object.fromEntries(
      ev('Object.keys(SQUISHIES)')
        .slice(0, 18)
        .map((id) => [id, 2]),
    );
    const rng = '(()=>{ let i = 0; const v = [0.1, 0.7, 0.3, 0.9, 0.5]; return ()=> v[i++ % v.length]; })()';
    setSq({ owned: big });
    const free = json(ev(`makeSortingTask(sqState().owned, 0, { rng: ${rng} })`));
    setSq({
      owned: big,
      crates: [crate('fav', Object.keys(big).slice(0, 6)), crate('fav', Object.keys(big).slice(0, 6)), E],
    });
    const packed = json(ev(`makeSortingTask(sqState().owned, 0, { rng: ${rng} })`));
    check(
      '31 : l’exercice tire de toute la collection, boîtes remplies ou non',
      free === packed && JSON.parse(packed).items.length === 8,
    );
    ev('state.coins = 0; state.skills = {}; state.squishies.day = null; save()');
    const paid = [1, 2, 3, 4].map(() => ev('sortingDone(0, 1, 0)'));
    check(
      '31 : il paie toujours 5 pièces 3 fois par jour, et le suivi évolue',
      same(paid, [5, 5, 5, 0]) && ev('state.coins') === 15 && ev('state.skills.rangement.wins') === 4,
      paid,
    );
    check('31 : l’exercice ne déplace rien', crates()[0].items.length === 6 && ev('state.squishies.sorted') === 4);
    ev('state.skills = {}; save()');
  }

  /* ================= Phase 2 : l'onglet « 🗃️ Mes boîtes » ================= */
  // @@PHASE2@@

  await wait(200);
  check('aucune erreur JS', errs.length === 0, errs.join(' | '));
  console.log(
    failed
      ? `\n${failed} échec(s), ${passed} réussi(s)`
      : `\nTous les tests des boîtes de rangement passent (${passed})`,
  );
  process.exit(failed ? 1 : 0);
})();
