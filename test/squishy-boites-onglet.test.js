// L'onglet « 🗃️ Mes boîtes » de la chambre à squishies (track squishy-boites,
// phase 2) : les cartes, le choix de l'étiquette, et les boîtes retrouvées
// après un rechargement. Harnais : test/tools/squishy-boites.js, gestes de
// l'onglet : test/tools/squishy-boites-ui.js.
const {
  ev,
  check,
  section,
  shown,
  same,
  crate,
  E,
  rep,
  setSq,
  crates,
  stored,
  start,
  finish,
} = require('./tools/squishy-boites.js');
const {
  $,
  $$,
  openTab,
  card,
  opt,
  add,
  keysOf,
  selected,
  saidOnly,
  tap,
  place,
  HEAD,
  PICK1,
  PICK2,
  MORE,
} = require('./tools/squishy-boites-ui.js');

(async () => {
  await start();

  section('L’onglet, la collection vide, les cartes (spec 32 à 34)');
  await (async () => {
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
  })();

  section('Choisir l’étiquette (spec 35 à 38)');
  // 35, 36, 38 : au cran 1, une seule règle
  await (async () => {
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
  })();
  // 35 à 38 : aux crans 2 et 3, les formes, les tailles, puis deux règles
  await (async () => {
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
  })();

  section('Persistance (spec 51)');
  await (async () => {
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
  })();

  await finish('onglet, étiquette choisie, persistance');
})();
