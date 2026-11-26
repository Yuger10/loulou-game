// L'onglet « 🗃️ Mes boîtes » de la chambre à squishies (track squishy-boites,
// phase 2) : la boîte ouverte, où l'on range en touchant un squishy puis la
// boîte. Harnais : test/tools/squishy-boites.js, gestes de l'onglet :
// test/tools/squishy-boites-ui.js.
const {
  ev,
  waitFor,
  check,
  section,
  shown,
  same,
  crate,
  E,
  rep,
  setSq,
  crates,
  start,
  finish,
} = require('./tools/squishy-boites.js');
const {
  $,
  $$,
  openTab,
  card,
  opt,
  item,
  slot,
  saidOnly,
  silent,
  tap,
  place,
  dropSays,
  heard,
  nameOf,
  PICK1,
} = require('./tools/squishy-boites-ui.js');

(async () => {
  await start();

  section('La boîte ouverte : toucher puis toucher (spec 39 à 47, 50)');
  // 39 à 42 : ouvrir, choisir, ranger
  await (async () => {
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
  })();
  // 43, 44 : un squishy qui ne va pas là
  await (async () => {
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
  })();
  // 45 à 47 : boîte pleine, sortir, changer l'étiquette
  await (async () => {
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
  })();

  await finish('boîte ouverte');
})();
