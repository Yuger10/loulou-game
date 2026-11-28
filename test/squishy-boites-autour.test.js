// Ce que les boîtes de rangement changent autour d'elles (track
// squishy-boites, phase 2) : la Collection, l'Étagère et le marché aux
// doubles. Harnais : test/tools/squishy-boites.js, gestes de l'onglet :
// test/tools/squishy-boites-ui.js.
const { ev, check, section, same, crate, E, setSq, crates, start, finish } = require('./tools/squishy-boites.js');
const { $, openTab, saidOnly, tap, nameOf } = require('./tools/squishy-boites-ui.js');

(async () => {
  await start();

  section('Collection, Étagère, marché (spec 52 à 54)');
  await (async () => {
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
  })();

  await finish('collection, étagère, marché');
})();
