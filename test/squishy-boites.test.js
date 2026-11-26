// Les boîtes de rangement durables de la chambre à squishies (track
// squishy-boites) : état neuf, migration, nettoyage d'une partie importée
// (readSave), logique des boîtes (crateAdd…), étiquettes, doubles rangés, puis
// l'onglet « 🗃️ Mes boîtes ». Même harnais que test/squishies.test.js : le
// temps du jeu est accéléré ×10, la voix est notée au lieu d'être dite.
const fs = require('fs');
const path = require('path');
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
async function waitFor(cond, ms = 3000) {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) {
    if (cond()) return true;
    await wait(10);
  }
  return !!cond();
}
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
const shown = (sel) => d.getElementById('overlay').classList.contains('show') && !!d.querySelector(sel);
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
  const $ = (sel) => d.querySelector(sel);
  const $$ = (sel) => [...d.querySelectorAll(sel)];
  // ouvrir un onglet de la chambre comme une première fois (la consigne est relue)
  const openTab = (tab) => ev(`forgetSpokenHint(); openSquishyRoom("${tab}")`);
  const card = (i) => $(`.cb-card[data-crate="${i}"]`);
  const opt = (key) => $(`.cb-opts[data-row="1"] .cb-opt[data-key="${key}"]`);
  const add = (key) => $(`.cb-opts[data-row="2"] .cb-opt[data-key="${key}"]`);
  const item = (id) => $(`.cb-item[data-id="${id}"]`);
  const slot = (pos) => $(`.cb-slot[data-pos="${pos}"]`);
  const keysOf = (row) => $$(`.cb-opts[data-row="${row}"] .cb-opt`).map((b) => b.dataset.key);
  const selected = (row) => $$(`.cb-opts[data-row="${row}"] .cb-opt.selected`).map((b) => b.dataset.key);
  // ce que la voix dit pendant un geste : un seul texte par événement
  const said = (fn) => {
    const n = spoken.length;
    fn();
    return spoken.slice(n);
  };
  // la voix note le texte tel qu'il est prononcé (toSpoken : espaces avant « ! », élisions) :
  // la phrase attendue passe par la même mise en forme, et se compare en entier
  const voiced = (text) => ev(`toSpoken(${json(text)})`);
  const saidOnly = (fn, text) => {
    const got = said(fn);
    return got.length === 1 && got[0] === voiced(text) ? true : (console.log('     dit : ' + json(got)), false);
  };
  const silent = (fn) => said(fn).length === 0;
  const tap = (el) => el.click();
  const place = (id, pos = 0) => {
    tap(item(id));
    tap(slot(pos));
  };
  // choisir un squishy puis toucher la boîte : ce que la voix dit au second toucher seulement
  const dropSays = (id, text, pos = 0) => {
    tap(item(id));
    return saidOnly(() => tap(slot(pos)), text);
  };
  // les sons joués, notés au passage (le jeu les joue toujours)
  const sounds = [];
  w.cbNoteSound = (k) => sounds.push(k);
  ev('const cbRealSound = playSound; playSound = (k) => { window.cbNoteSound(k); return cbRealSound(k); }');
  const heard = (fn) => {
    const n = sounds.length;
    fn();
    return sounds.slice(n);
  };
  const nameOf = (id) => ev(`SQUISHIES["${id}"].name`);
  const HEAD = 'Range tes squishies dans tes boîtes !';
  const PICK1 = "Choisis l'étiquette de ta boîte : une couleur, une famille, ou tes préférés !";
  const PICK2 = "Choisis l'étiquette de ta boîte : une couleur, une forme, une taille, une famille, ou tes préférés !";
  const MORE = ' Tu peux ajouter une deuxième règle, ou toucher Choisir.';

  section('L’onglet, la collection vide, les cartes (spec 32 à 34)');
  {
    ev('currentProfile().age = 0; state.missions = 0; save()');
    setSq({});
    openTab('collection');
    check(
      '32 : 4 onglets dans l’ordre : Collection, Étagère, Mes boîtes, Ranger',
      same(
        $$('[data-sqtab]').map((b) => b.textContent.trim()),
        ['📚 Collection', '🗄️ Étagère', '🗃️ Mes boîtes', '📦 Ranger'],
      ),
      $$('[data-sqtab]').map((b) => b.textContent.trim()),
    );
    const EMPTY = "Tes boîtes t'attendent ! Ouvre une boîte surprise pour trouver ton premier squishy.";
    check(
      '33 : collection vide : la voix le dit, en un seul appel',
      saidOnly(() => tap($('[data-sqtab="boites"]')), EMPTY),
    );
    check(
      '33 : et l’onglet le montre',
      shown('#sq-room[data-tab="boites"] .empty-state') &&
        ["Tes boîtes t'attendent !", 'Ouvre une boîte surprise pour trouver ton premier squishy.'].every((x) =>
          $('#sq-room .empty-state').textContent.includes(x),
        ),
      $('#sq-room .empty-state') && $('#sq-room .empty-state').textContent,
    );
    check('33 : aucune carte de boîte', $$('.cb-card').length === 0);
    setSq({
      owned: { donut: 9, lapin: 2, cupcake: 1 },
      crates: [crate('color:rose', ['donut', 'lapin']), crate('fav', rep('donut', 6)), E],
    });
    check(
      '34 : la voix dit la consigne et ce que rapporte une boîte pleine',
      saidOnly(() => openTab('boites'), HEAD + " Une boîte pleine t'en fait gagner une autre."),
    );
    check('34 : la consigne de l’en-tête', $('.puzzle-hint .hint-txt').textContent === HEAD);
    check(
      '34 : une carte par boîte, l’onglet actif',
      $$('.cb-card').length === 3 && $('[data-sqtab="boites"]').classList.contains('active'),
    );
    check(
      '34 : étiquette en image, squishies en petit, « N / 6 »',
      !!card(0).querySelector('.cb-label .sq-dot') &&
        card(0).querySelectorAll('.cb-minis .sq-art').length === 2 &&
        card(0).querySelector('.cb-count').textContent === '2 / 6',
      card(0).innerHTML.slice(0, 200),
    );
    check(
      'une boîte pleine montre « 6 / 6 » et la classe full ; sans étiquette : « 🏷️ ? »',
      card(1).classList.contains('full') &&
        card(1).querySelector('.cb-count').textContent === '6 / 6' &&
        /❤️/.test(card(1).querySelector('.cb-label').textContent) &&
        card(2).querySelector('.cb-label').textContent.trim() === '🏷️ ?' &&
        !card(0).classList.contains('full'),
    );
    setSq({ owned: { donut: 1 }, crates: Array(8).fill(E) });
    check(
      '34 : à 8 boîtes, la voix ne dit que la consigne',
      saidOnly(() => openTab('boites'), HEAD) && $$('.cb-card').length === 8,
    );
  }

  section('Choisir l’étiquette (spec 35 à 38)');
  {
    setSq({ owned: { donut: 3, lapin: 1, cupcake: 1 } });
    openTab('boites');
    check(
      '35 : toucher une boîte sans étiquette ouvre le choix, la voix dit le texte du cran 1',
      saidOnly(() => tap(card(0)), PICK1) && shown('.cb-picker'),
    );
    check('35 : les options du cran 1, dans l’ordre', same(keysOf(1), ev('crateLabelsFor(0)')), keysOf(1));
    check(
      'D8 : chaque option est une image (pastille, emoji de la série, cœur)',
      !!opt('color:rose').querySelector('.sq-dot') &&
        /🦫/.test(opt('series:capy').textContent) &&
        /❤️/.test(opt('fav').textContent),
    );
    check(
      '« ✓ Choisir » attend une option',
      $('#cb-choose').disabled === true && /Choisir/.test($('#cb-choose').textContent),
    );
    check(
      '36 : toucher une option la met en avant, la voix dit son nom, rien de plus',
      saidOnly(() => tap(opt('color:rose')), 'Les roses') && same(selected(1), ['color:rose']),
    );
    check(
      '36 : une seule option en avant ; les préférés disent leur phrase',
      saidOnly(() => tap(opt('fav')), 'Tes préférés : tu mets ceux que tu veux !') && same(selected(1), ['fav']),
    );
    check('36 : pas de second rang au cran 1', !$('.cb-opts[data-row="2"]') && $('#cb-choose').disabled === false);
    tap(opt('color:rose'));
    check(
      '38 : « ✓ Choisir » pose l’étiquette, ouvre la boîte et le dit',
      saidOnly(() => tap($('#cb-choose')), 'Voilà ta boîte des squishies roses ! Fais glisser tes squishies dedans.') &&
        crates()[0].label === 'color:rose' &&
        shown('.cb-crate[data-crate="0"]') &&
        stored().squishies.crates[0].label === 'color:rose',
    );
    // cran 2
    ev('currentProfile().age = 6; save()');
    openTab('boites');
    check(
      '35 : crans 2 et 3 : la voix cite aussi la forme et la taille',
      saidOnly(() => tap(card(1)), PICK2),
    );
    check(
      '35 : les options du cran 2',
      same(keysOf(1), ev('crateLabelsFor(6)')) &&
        !!opt('shape:rond').querySelector('.sr-shape-rond') &&
        !!opt('size:petit').querySelector('.sr-size-petit'),
    );
    check(
      '36 : au cran 2, une forme ne montre pas de second rang',
      saidOnly(() => tap(opt('shape:rond')), 'Les ronds') && !$('.cb-opts[data-row="2"]'),
    );
    // cran 3
    ev('currentProfile().age = 8; save()');
    openTab('boites');
    check(
      '35 : cran 3 : même phrase que le cran 2',
      saidOnly(() => tap(card(1)), PICK2),
    );
    check(
      '37 : une couleur fait apparaître le second rang, la voix le dit en un seul appel',
      saidOnly(() => tap(opt('color:rose')), 'Les roses.' + MORE),
    );
    check(
      '37 : une couleur appelle une forme ou une taille',
      same(keysOf(2), ['shape:rond', 'shape:ovale', 'shape:carre', 'size:petit', 'size:grand']) &&
        selected(2).length === 0,
      keysOf(2),
    );
    check(
      '37 : toucher un complément le met en avant, la voix dit l’étiquette à deux règles',
      saidOnly(() => tap(add('size:petit')), 'Les petits squishies roses') && same(selected(2), ['size:petit']),
    );
    check(
      '37 : un seul complément à la fois',
      saidOnly(() => tap(add('shape:rond')), 'Les squishies roses et ronds') && same(selected(2), ['shape:rond']),
    );
    tap(add('shape:rond'));
    check('37 : le retoucher l’enlève', selected(2).length === 0 && same(selected(1), ['color:rose']));
    tap(add('shape:rond'));
    check(
      '37 : une autre option du premier rang vide le second et le refait',
      saidOnly(() => tap(opt('shape:carre')), 'Les carrés.' + MORE) && selected(2).length === 0,
    );
    check(
      '37 : une forme appelle une couleur ou une taille',
      same(keysOf(2), [
        ...['rose', 'bleu', 'jaune', 'vert', 'violet', 'orange'].map((c) => 'color:' + c),
        'size:petit',
        'size:grand',
      ]),
      keysOf(2),
    );
    check(
      '37 : une taille appelle une couleur ou une forme',
      saidOnly(() => tap(opt('size:grand')), 'Les grands.' + MORE) &&
        same(keysOf(2).slice(-3), ['shape:rond', 'shape:ovale', 'shape:carre']) &&
        keysOf(2).length === 9,
    );
    check(
      '37 : une famille ne montre pas de second rang et ne dit que son nom',
      saidOnly(() => tap(opt('series:capy')), 'Les Capybaras') && !$('.cb-opts[data-row="2"]'),
    );
    check(
      '37 : les préférés non plus',
      saidOnly(() => tap(opt('fav')), 'Tes préférés : tu mets ceux que tu veux !') && !$('.cb-opts[data-row="2"]'),
    );
    tap(opt('color:rose'));
    tap(add('size:petit'));
    check(
      '37, 38 : « Les roses » puis « Les petits » pose la clé canonique size:petit+color:rose',
      saidOnly(
        () => tap($('#cb-choose')),
        'Voilà ta boîte des petits squishies roses ! Fais glisser tes squishies dedans.',
      ) && crates()[1].label === 'size:petit+color:rose',
      crates()[1].label,
    );
    openTab('boites');
    check(
      'la carte d’une étiquette à deux règles montre la taille et la couleur',
      !!card(1).querySelector('.cb-label .sr-size-petit') && !!card(1).querySelector('.cb-label .sq-dot'),
    );
    tap(card(2));
    tap(opt('shape:rond'));
    tap(add('color:bleu'));
    tap($('#cb-choose'));
    check(
      '37 : forme puis couleur : color:bleu+shape:rond',
      crates()[2].label === 'color:bleu+shape:rond',
      crates()[2].label,
    );
    ev('currentProfile().age = 0; save()');
  }

  section('La boîte ouverte : toucher puis toucher (spec 39 à 47, 50)');
  {
    setSq({
      owned: { donut: 3, lapin: 1, cupcake: 1, 'capy-fraise': 1 },
      crates: [crate('color:rose'), crate('fav'), E],
    });
    openTab('boites');
    check(
      '39 : toucher une boîte étiquetée l’ouvre, la voix dit son nom et la consigne',
      saidOnly(() => tap(card(0)), 'Ta boîte des squishies roses. Fais glisser tes squishies dedans !'),
    );
    check(
      '39 : la boîte en grand, 6 cases',
      shown('.cb-crate[data-crate="0"]') && $$('.cb-crate .cb-slot').length === 6,
    );
    check(
      '39 : le tapis : un bouton par modèle libre, dans l’ordre du catalogue, « ×N » s’il y en a plusieurs',
      same(
        $$('.cb-tray .cb-item').map((b) => b.dataset.id),
        ['capy-fraise', 'donut', 'cupcake', 'lapin'],
      ) &&
        item('donut').querySelector('.sq-n').textContent === '×3' &&
        !item('lapin').querySelector('.sq-n'),
      $$('.cb-tray .cb-item').map((b) => b.dataset.id),
    );
    check(
      '42 : sans squishy choisi, une case vide le demande',
      saidOnly(() => tap(slot(0)), "Choisis d'abord un squishy, en dessous."),
    );
    check(
      '41 : toucher un squishy du tapis le choisit, la voix le dit',
      saidOnly(() => tap(item('donut')), `${nameOf('donut')}. Touche la boîte pour le ranger !`) &&
        item('donut').classList.contains('selected'),
    );
    check(
      '41 : le retoucher le repose',
      silent(() => tap(item('donut'))) && !item('donut').classList.contains('selected'),
    );
    tap(item('donut'));
    let snd = [];
    check(
      '41, 40 : toucher la boîte le range, sans voix',
      silent(() => (snd = heard(() => tap(slot(3))))) && same(crates()[0].items, ['donut']),
    );
    check('40 : le son good', same(snd, ['good']), snd);
    check(
      '40 : il apparaît dans la case suivante, le tapis perd un exemplaire',
      !!slot(0).querySelector('.sq-art') &&
        !slot(1).querySelector('.sq-art') &&
        item('donut').querySelector('.sq-n').textContent === '×2' &&
        !$('.cb-item.selected'),
    );
    place('lapin');
    check(
      '40 : un modèle dont le dernier exemplaire est rangé quitte le tapis',
      !item('lapin') && same(crates()[0].items, ['donut', 'lapin']),
    );
    // 43 : un mauvais squishy
    tap(item('cupcake'));
    let bad = [];
    check(
      '43 : un bleu dans la boîte des roses : l’indice parlé',
      saidOnly(() => (bad = heard(() => tap(slot(2)))), 'Lui, il est bleu. On cherche des roses !'),
    );
    check(
      '43 : il rebondit et revient sur le tapis ; rien n’est retiré, rien n’est compté',
      item('cupcake').classList.contains('sr-bounce') &&
        same(bad, ['wrong']) &&
        same(crates()[0].items, ['donut', 'lapin']) &&
        !$('.cb-item.selected') &&
        ev('state.skills.rangement') === undefined,
      bad,
    );
    // 44 : 3 erreurs d'affilée
    check(
      '44 : 2ᵉ erreur : l’indice seul, rien ne brille',
      dropSays('cupcake', 'Lui, il est bleu. On cherche des roses !') && $$('.cb-glow').length === 0,
    );
    check(
      '44 : 3ᵉ erreur : l’indice puis « Regarde ceux qui brillent ! », en un seul appel',
      dropSays('cupcake', 'Lui, il est bleu. On cherche des roses ! Regarde ceux qui brillent !'),
    );
    check(
      '44 : les squishies du tapis qui vont dans la boîte brillent',
      same(
        $$('.cb-item.cb-glow').map((b) => b.dataset.id),
        ['capy-fraise', 'donut'],
      ),
      $$('.cb-item.cb-glow').map((b) => b.dataset.id),
    );
    check('44 : ils brillent 3 secondes', await waitFor(() => $$('.cb-glow').length === 0, 1500));
    place('cupcake');
    check('44 : le compteur est reparti à zéro après la 3ᵉ', $$('.cb-glow').length === 0);
    place('cupcake');
    place('donut');
    place('cupcake');
    check(
      '44 : une réussite remet le compteur à zéro',
      $$('.cb-glow').length === 0 && same(crates()[0].items, ['donut', 'lapin', 'donut']),
    );
    place('cupcake');
    check(
      '50 : « ⬅️ Mes boîtes » revient aux cartes, sans voix',
      silent(() => tap($('#cb-back'))) && $$('.cb-card').length === 3 && !$('.cb-crate'),
    );
    tap(card(0));
    check(
      '44 : fermer puis rouvrir la boîte remet le compteur à zéro',
      dropSays('cupcake', 'Lui, il est bleu. On cherche des roses !') && $$('.cb-glow').length === 0,
    );
    // aucun squishy libre qui convienne : l'indice seul
    setSq({ owned: { lapin: 1, cupcake: 1 }, crates: [crate('color:rose', ['lapin']), E, E] });
    openTab('boites');
    tap(card(0));
    place('cupcake', 1);
    place('cupcake', 1);
    check(
      '44 : rien à faire briller : l’indice seul',
      dropSays('cupcake', 'Lui, il est bleu. On cherche des roses !', 1) && $$('.cb-glow').length === 0,
    );
    // une famille : l'indice de D10
    setSq({ owned: { donut: 1, 'capy-fraise': 1 }, crates: [crate('series:capy'), E, E] });
    openTab('boites');
    tap(card(0));
    check(
      '43 : dans une boîte de famille, l’indice nomme le squishy et la famille',
      dropSays('donut', "Lui, c'est un donut. On cherche des Capybaras !"),
    );
    // 45 : boîte pleine
    setSq({ owned: { donut: 9, cupcake: 1 }, crates: [crate('color:rose', rep('donut', 6), true), E, E] });
    openTab('boites');
    tap(card(0));
    tap(item('cupcake'));
    let full = [];
    check(
      '45 : boîte pleine : il rebondit et la voix le dit',
      saidOnly(() => (full = heard(() => tap(slot(0)))), 'Cette boîte est pleine ! Range-le dans une autre boîte.') &&
        item('cupcake').classList.contains('sr-bounce') &&
        same(full, ['wrong']),
    );
    place('cupcake');
    place('cupcake');
    check(
      '45 : ce rebond ne compte pas dans les erreurs',
      $$('.cb-glow').length === 0 && crates()[0].items.length === 6,
    );
    // 46 : sortir un squishy
    let out = [];
    check(
      '46 : toucher un squishy de la boîte le sort, sans voix',
      silent(() => (out = heard(() => tap(slot(5))))) && crates()[0].items.length === 5 && same(out, ['pop']),
      out,
    );
    check(
      '46 : il revient sur le tapis',
      item('donut').querySelector('.sq-n').textContent === '×4' && !slot(5).querySelector('.sq-art'),
    );
    // 47
    check(
      '47 : « 🏷️ Changer l’étiquette » ne se montre que si la boîte est vide',
      !$('#cb-relabel') && !!$('#cb-empty'),
    );
    check(
      '47 : « ↩️ Tout sortir » vide la boîte et le dit',
      saidOnly(() => tap($('#cb-empty')), 'Tes squishies sont sortis de la boîte.') &&
        same(crates()[0].items, []) &&
        crates()[0].done === true,
    );
    check(
      '47 : la boîte vide propose de changer l’étiquette, plus de tout sortir',
      !!$('#cb-relabel') && !$('#cb-empty'),
    );
    check(
      '47 : changer l’étiquette ouvre le choix',
      saidOnly(() => tap($('#cb-relabel')), PICK1) && shown('.cb-picker'),
    );
    tap(opt('color:bleu'));
    tap($('#cb-choose'));
    check('47 : la nouvelle étiquette est posée', crates()[0].label === 'color:bleu' && shown('.cb-crate'));
    // 39 : aucun exemplaire libre
    setSq({ owned: { donut: 1 }, crates: [crate('color:rose', ['donut']), crate('fav'), E] });
    openTab('boites');
    check(
      '39 : aucun exemplaire libre : la voix le dit',
      saidOnly(() => tap(card(1)), 'Ta boîte de préférés. Tous tes squishies sont déjà rangés !'),
    );
    check(
      '39 : le tapis est remplacé par le message',
      !$('.cb-tray') && $('.cb-none').textContent.trim() === 'Tous tes squishies sont déjà rangés !',
    );
    check(
      '15 : la boîte des préférés accepte tout, au doigt aussi',
      (setSq({ owned: { cupcake: 1, donut: 1 }, crates: [crate('fav'), E, E] }),
      openTab('boites'),
      tap(card(0)),
      place('cupcake'),
      place('donut'),
      same(crates()[0].items, ['cupcake', 'donut'])),
    );
  }

  section('Boîte pleine : la fête (spec 48, 49)');
  {
    const five = rep('donut', 5);
    const fill = (age, list) => {
      ev(`currentProfile().age = ${age}; state.coins = 0; save()`);
      setSq({ owned: { donut: 9 }, crates: list });
      openTab('boites');
      tap(card(0));
      ev('document.getElementById("confetti").innerHTML = ""');
      tap(item('donut'));
      let snd = [];
      const voice = said(() => (snd = heard(() => tap(slot(5)))));
      return { voice, snd, confetti: $$('#confetti .confetti-piece').length };
    };
    let r = fill(0, [crate('color:rose', five), E, E]);
    check(
      '48 : première boîte de tri pleine : bravo, pièces et nouvelle boîte, en un seul appel',
      same(r.voice, [voiced('Bravo, ta boîte est pleine ! Tu gagnes 5 pièces et une nouvelle boîte !')]),
      r.voice,
    );
    check(
      '48 : confettis, et win seul (pas de good)',
      r.confetti > 0 && r.snd[0] === 'win' && !r.snd.includes('good'),
      r.snd,
    );
    check(
      '48 : 5 pièces, une boîte de plus',
      ev('state.coins') === 5 && crates().length === 4 && crates()[0].done === true,
    );
    check(
      '48 : la boîte pleine reste ouverte, « 6 / 6 »',
      shown('.cb-crate.full') && $$('.cb-slot .sq-art').length === 6,
    );
    r = fill(0, [crate('color:rose', five), ...Array(7).fill(E)]);
    check(
      '48 : à 8 boîtes : bravo et pièces seulement',
      same(r.voice, [voiced('Bravo, ta boîte est pleine ! Tu gagnes 5 pièces !')]) && crates().length === 8,
      r.voice,
    );
    r = fill(6, [crate('color:rose', five), crate('fav', [], true), E]);
    check(
      '48 : le déblocage des deux règles termine la même phrase',
      same(r.voice, [
        voiced(
          'Bravo, ta boîte est pleine ! Tu gagnes 5 pièces et une nouvelle boîte ! Maintenant, une étiquette peut avoir deux règles !',
        ),
      ]),
      r.voice,
    );
    tap($('#cb-back'));
    tap(card(2));
    tap(opt('color:bleu'));
    check('S13 : après le déblocage, le second rang apparaît à 6 ans', keysOf(2).length === 5);
    r = fill(0, [crate('color:rose', five, true), E, E]);
    check(
      '49 : boîte déjà payée : win, sans pièces ni confettis',
      same(r.voice, [voiced('Ta boîte est pleine, bravo !')]) &&
        same(r.snd, ['win']) &&
        ev('state.coins') === 0 &&
        r.confetti === 0 &&
        crates().length === 3,
      r,
    );
    r = fill(0, [crate('fav', five), E, E]);
    check(
      '49 : boîte de préférés pleine',
      same(r.voice, [voiced('Ta boîte de préférés est pleine !')]) && same(r.snd, ['win']) && ev('state.coins') === 0,
      r,
    );
  }

  section('Glisser un squishy dans la boîte (spec 40, 55, S5)');
  {
    ev('currentProfile().age = 0; save()');
    setSq({ owned: { donut: 3, cupcake: 1 }, crates: [crate('color:rose'), E, E] });
    // jsdom n'a pas PointerEvent : on le définit avant d'ouvrir la boîte (la garde est lue au rendu)
    const FakePointerEvent = class extends w.MouseEvent {
      constructor(t, o = {}) {
        super(t, o);
        this.pointerId = o.pointerId ?? 1;
      }
    };
    w.PointerEvent = FakePointerEvent;
    const realFromPoint = d.elementFromPoint;
    d.elementFromPoint = () => d.querySelector('.cb-crate');
    const pe = (el, type, x, y) =>
      el.dispatchEvent(new FakePointerEvent(type, { bubbles: true, clientX: x, clientY: y, pointerId: 1 }));
    const drag = (id) => {
      const b = item(id);
      pe(b, 'pointerdown', 100, 400);
      pe(b, 'pointermove', 103, 398);
      const early = $$('.cb-drag').length;
      pe(b, 'pointermove', 110, 300);
      const ghost = $$('.cb-drag').length;
      pe(b, 'pointerup', 110, 200);
      return { early, ghost };
    };
    openTab('boites');
    tap(card(0));
    let g = {};
    let snd = [];
    check(
      '40 : glisser un squishy du tapis sur la boîte le range, sans voix',
      silent(() => (snd = heard(() => (g = drag('donut'))))) && same(crates()[0].items, ['donut']),
    );
    check(
      'D11 : un fantôme suit le doigt après 8 px, pas avant, et disparaît',
      g.early === 0 && g.ghost === 1 && $$('.cb-drag').length === 0,
      g,
    );
    check(
      '40 : son good, case remplie, le tapis perd un exemplaire',
      same(snd, ['good']) &&
        !!slot(0).querySelector('.sq-art') &&
        item('donut').querySelector('.sq-n').textContent === '×2',
      snd,
    );
    check(
      '43 : lâcher un mauvais squishy : rebond et indice',
      saidOnly(() => drag('cupcake'), 'Lui, il est bleu. On cherche des roses !') &&
        item('cupcake').classList.contains('sr-bounce') &&
        crates()[0].items.length === 1,
    );
    // lâché ailleurs que sur la boîte : rien
    d.elementFromPoint = () => d.querySelector('.cb-tray');
    check('lâché hors de la boîte : rien ne bouge', silent(() => drag('donut')) && crates()[0].items.length === 1);
    d.elementFromPoint = () => d.querySelector('.cb-crate');
    // pointercancel annule
    const b = item('donut');
    pe(b, 'pointerdown', 100, 400);
    pe(b, 'pointermove', 110, 300);
    pe(b, 'pointercancel', 110, 200);
    check('D11 : pointercancel annule le glisser', crates()[0].items.length === 1 && $$('.cb-drag').length === 0);
    await wait(60); // le drapeau « vient d'être glissé » (350 ms, ×0,1)
    // 55 : sans PointerEvent
    delete w.PointerEvent;
    openTab('boites');
    tap(card(0));
    const none = drag('donut');
    check(
      '55 : sans PointerEvent, aucun écouteur de glisser : pas de fantôme, rien n’est rangé',
      none.ghost === 0 && crates()[0].items.length === 1,
      none,
    );
    place('donut', 1);
    check('55 : le toucher puis toucher marche', same(crates()[0].items, ['donut', 'donut']));
    d.elementFromPoint = realFromPoint;
  }

  section('Persistance (spec 51)');
  {
    setSq({ owned: { donut: 3, lapin: 1, 'capy-fraise': 1, cupcake: 2 }, crates: [E, crate('fav'), E] });
    openTab('boites');
    tap(card(0));
    tap(opt('color:rose'));
    tap($('#cb-choose'));
    ['lapin', 'donut', 'capy-fraise', 'donut'].forEach((id) => place(id));
    tap($('#cb-back'));
    tap(card(1));
    ['cupcake', 'donut', 'cupcake'].forEach((id) => place(id));
    const want = [
      crate('color:rose', ['lapin', 'donut', 'capy-fraise', 'donut']),
      crate('fav', ['cupcake', 'donut', 'cupcake']),
      E,
    ];
    ev('closeModal(); state.squishies = squishyFreshState(); load()');
    check(
      '51 : après fermeture et rechargement, mêmes étiquettes, mêmes squishies, même ordre',
      same(crates(), want),
      crates(),
    );
    openTab('boites');
    tap(card(0));
    check(
      '51 : l’onglet les montre à nouveau',
      same(
        $$('.cb-slot .sq-art').map((s) => s.dataset.sq),
        ['lapin', 'donut', 'capy-fraise', 'donut'],
      ),
      $$('.cb-slot .sq-art').map((s) => s.dataset.sq),
    );
  }

  section('Collection, Étagère, marché (spec 52 à 54)');
  {
    const shelf = Array(12).fill(null);
    shelf[0] = 'chat';
    setSq({
      owned: { donut: 3, lapin: 1, chat: 1, mochi: 2 },
      shelf,
      crates: [crate('fav', ['donut', 'lapin']), E, E],
    });
    openTab('collection');
    const cell = (id) => $(`.sq-cell[data-sq="${id}"]`);
    check(
      '52 : un squishy rangé porte la marque 🗃️, « ×N » reste le nombre possédé',
      cell('donut').querySelector('.sq-in-crate').textContent === '🗃️' &&
        cell('donut').querySelector('.sq-n').textContent === '×3' &&
        !!cell('lapin').querySelector('.sq-in-crate') &&
        !cell('chat').querySelector('.sq-in-crate') &&
        !cell('mochi').querySelector('.sq-in-crate'),
    );
    check(
      '52 : un seul exemplaire, rangé',
      saidOnly(() => tap(cell('lapin')), `${nameOf('lapin')} ! Il est rangé dans une boîte.`),
    );
    check(
      '52 : plusieurs exemplaires, dont K dans les boîtes',
      saidOnly(() => tap(cell('donut')), `${nameOf('donut')}. Tu en as 3, dont 1 dans tes boîtes.`),
    );
    check(
      '52 : sans exemplaire rangé, les phrases d’avant',
      saidOnly(() => tap(cell('mochi')), `${nameOf('mochi')}. Tu en as 2.`) &&
        saidOnly(() => tap(cell('chat')), `${nameOf('chat')} !`),
    );
    openTab('etagere');
    const pick = (id) => $(`[data-pick="${id}"]`);
    check(
      '53, D4 : l’étagère compte les exemplaires libres (« ×N » si 2 ou plus, used si 0)',
      pick('donut').querySelector('.sq-n').textContent === '×2' &&
        !pick('donut').classList.contains('used') &&
        pick('lapin').classList.contains('used') &&
        pick('chat').classList.contains('used') &&
        pick('mochi').querySelector('.sq-n').textContent === '×2',
    );
    check(
      '53 : aucun libre, un dans une boîte',
      saidOnly(() => tap(pick('lapin')), 'Il est déjà rangé dans une boîte !'),
    );
    check(
      '53 : aucun libre, tous sur l’étagère : le texte d’avant',
      saidOnly(() => tap(pick('chat')), "Il est déjà sur l'étagère !"),
    );
    ev('closeModal()');
    // 54 : le marché
    const PLACE = 'Tes squishies rangés restent à leur place.';
    const market = () => ev('state.missions = 0; switchView("marche"); currentTab = "echanger"; renderMarche()');
    const msg = () => $('.sq-market .sqm-msg').textContent;
    setSq({
      owned: { donut: 3, chat: 1 },
      shelf: Array(12).fill(null).fill('donut', 0, 1),
      crates: [crate('fav', ['donut']), E, E],
    });
    market();
    check(
      '54 : un double rangé : le message se termine par la phrase',
      msg() === `3 doubles = 1 squishy de ton choix. ${PLACE}`,
      msg(),
    );
    check(
      '28, 54 : « 1 double », « Encore 2 doubles »',
      $('.sqm-n').textContent.trim() === '1 double' && /Encore 2 doubles/.test($('#sqm-trade').textContent),
    );
    check(
      '54 : la voix l’ajoute à « Il te faut encore… »',
      saidOnly(() => tap($('[data-want="grenouille"]')), `Il te faut encore 2 doubles pour l'échanger. ${PLACE}`),
    );
    setSq({ owned: { donut: 4, chat: 1 }, crates: [crate('fav', ['donut', 'donut']), E, E] });
    market();
    check(
      '54 : « 1 double » au singulier',
      saidOnly(() => tap($('[data-want="grenouille"]')), `Il te faut encore 1 double pour l'échanger. ${PLACE}`),
    );
    setSq({ owned: { donut: 5, chat: 1 }, crates: [crate('fav', ['donut', 'donut']), E, E] });
    market();
    check(
      '54 : assez de doubles libres : après « Lequel veux-tu ? »',
      msg() === `3 doubles = 1 squishy de ton choix. Lequel veux-tu ? ${PLACE}`,
      msg(),
    );
    check(
      '54 : « Celui-là ? Touche Échanger ! » ne change pas',
      saidOnly(() => tap($('[data-want="grenouille"]')), 'Celui-là ? Touche Échanger !'),
    );
    tap($('#sqm-trade'));
    check(
      '29, 54 : l’échange ne touche pas aux squishies rangés',
      ev('squishyCount("grenouille")') === 1 &&
        ev('squishyCount("donut")') === 2 &&
        same(crates()[0].items, ['donut', 'donut']),
    );
    setSq({ owned: { donut: 2, chat: 1 } });
    market();
    check(
      '54 : sans double rangé, rien ne change',
      msg() === '3 doubles = 1 squishy de ton choix.' &&
        saidOnly(() => tap($('[data-want="grenouille"]')), "Il te faut encore 2 doubles pour l'échanger."),
      msg(),
    );
    const all = Object.fromEntries(ev('Object.keys(SQUISHIES)').map((id) => [id, 1]));
    setSq({ owned: Object.assign(all, { donut: 3 }), crates: [crate('fav', ['donut', 'donut']), E, E] });
    ev('state.missions = 9999');
    market();
    ev('state.missions = 9999; renderMarche()');
    check(
      '54 : la branche « collection complète » ne change pas',
      /complète, bravo/.test(msg()) && !msg().includes(PLACE),
      msg(),
    );
    ev('state.missions = 0; save(); switchView("carte")');
  }

  section('360 px : rien ne déborde, des boutons de 64 px (spec 56)');
  {
    const css = fs.readFileSync(path.join(__dirname, '..', 'js', 'features', 'squishies', 'squishies.css'), 'utf8');
    // le bloc d'une règle écrite seule sur sa ligne : « .cb-card { … } »
    const rule = (sel) => {
      const m = css.match(new RegExp('(?:^|\\n)' + sel.replace('.', '\\.') + ' \\{([^}]*)\\}'));
      return m ? m[1] : '';
    };
    const px = (sel, prop) => Number((rule(sel).match(new RegExp(prop + ':\\s*(\\d+)px')) || [])[1] || 0);
    const BUTTONS = ['.cb-card', '.cb-opt', '.cb-btn', '.cb-item', '.cb-slot'];
    const small = BUTTONS.filter((sel) => px(sel, 'min-width') < 64 || px(sel, 'min-height') < 64);
    check('56 : chaque bouton .cb-… fait au moins 64 px de côté', small.length === 0, small);
    check(
      '56 : seul le tapis défile de côté',
      /overflow-x:\s*auto/.test(rule('.cb-tray')) && /flex-wrap:\s*nowrap/.test(rule('.cb-tray')),
      rule('.cb-tray'),
    );
    check(
      'D12 : un geste de côté fait défiler le tapis (touch-action: pan-x)',
      /touch-action:\s*pan-x/.test(rule('.cb-item')),
    );
    check(
      '34 : 2 cartes par rangée, 39 : 3 cases par rangée',
      /grid-template-columns:\s*repeat\(2,/.test(rule('.cb-grid')) &&
        /grid-template-columns:\s*repeat\(3,/.test(rule('.cb-crate')),
    );
    check(
      '43 : le rebond de l’exercice est repris pour le tapis',
      /\.cb-item\.sr-bounce/.test(css) && /\.cb-glow/.test(css) && /\.cb-drag\s*\{[^}]*position:\s*fixed/.test(css),
    );
    // tous les boutons des trois écrans portent une de ces classes
    const strays = [];
    const scan = () =>
      $$('#sq-room button').forEach((b) => {
        if (!BUTTONS.some((sel) => b.classList.contains(sel.slice(1)))) strays.push(b.outerHTML.slice(0, 80));
      });
    setSq({ owned: { donut: 3, lapin: 1 }, crates: [crate('color:rose', ['donut']), crate('fav'), E] });
    ev('currentProfile().age = 8; save()');
    openTab('boites');
    scan();
    tap(card(0));
    scan();
    tap($('#cb-back'));
    tap(card(1));
    scan();
    tap($('#cb-back'));
    tap(card(2));
    tap(opt('color:rose'));
    scan();
    check('56 : aucun bouton de l’onglet n’échappe à la règle', strays.length === 0, strays);
    ev('currentProfile().age = 0; save(); closeModal()');
  }

  await wait(200);
  check('aucune erreur JS', errs.length === 0, errs.join(' | '));
  console.log(
    failed
      ? `\n${failed} échec(s), ${passed} réussi(s)`
      : `\nTous les tests des boîtes de rangement passent (${passed})`,
  );
  process.exit(failed ? 1 : 0);
})();
