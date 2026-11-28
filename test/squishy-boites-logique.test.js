// Les boîtes de rangement durables de la chambre à squishies (track
// squishy-boites), phase 1 : l'aller-retour de la sauvegarde, la logique des
// boîtes (crateAdd, crateRemove, crateSetLabel), la boîte pleine, les doubles
// rangés. Harnais : test/tools/squishy-boites.js.
const {
  ev,
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
  OK,
  NO,
  start,
  finish,
} = require('./tools/squishy-boites.js');

(async () => {
  await start();

  section('Aller-retour de la sauvegarde (spec 12)');
  await (async () => {
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
  })();

  section('Ranger, sortir, étiqueter (spec 13 à 20)');
  await (async () => {
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
  })();

  section('Boîte pleine : pièces, nouvelle boîte, déblocage (spec 21 à 24)');
  await (async () => {
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
  })();

  section('Doubles, étagère, exercice (spec 28 à 31)');
  await (async () => {
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
  })();

  await finish('sauvegarde, rangement, doubles');
})();
