// Les boîtes de rangement durables de la chambre à squishies (track
// squishy-boites), phase 1 : les étiquettes (crans selon l'âge, grammaire,
// noms dits par la voix). Harnais : test/tools/squishy-boites.js.
const { ev, check, section, same, crate, E, setSq, start, finish } = require('./tools/squishy-boites.js');

(async () => {
  await start();

  section('Étiquettes : crans, grammaire, noms dits (spec 25 à 27, D5, D7, D9, D10)');
  await (async () => {
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
  })();

  await finish('étiquettes');
})();
