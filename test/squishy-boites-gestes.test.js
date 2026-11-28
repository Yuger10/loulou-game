// L'onglet « 🗃️ Mes boîtes » de la chambre à squishies (track squishy-boites,
// phase 2) : la fête d'une boîte pleine, le glisser au doigt, et la mise en
// page à 360 px. Harnais : test/tools/squishy-boites.js, gestes de l'onglet :
// test/tools/squishy-boites-ui.js.
const fs = require('fs');
const path = require('path');
const {
  w,
  d,
  ev,
  wait,
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
  keysOf,
  said,
  voiced,
  saidOnly,
  silent,
  tap,
  place,
  heard,
} = require('./tools/squishy-boites-ui.js');

(async () => {
  await start();

  section('Boîte pleine : la fête (spec 48, 49)');
  await (async () => {
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
  })();

  section('Glisser un squishy dans la boîte (spec 40, 55, S5)');
  await (async () => {
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
    const pe = (el, type, [x, y]) =>
      el.dispatchEvent(new FakePointerEvent(type, { bubbles: true, clientX: x, clientY: y, pointerId: 1 }));
    const drag = (id) => {
      const b = item(id);
      pe(b, 'pointerdown', [100, 400]);
      pe(b, 'pointermove', [103, 398]);
      const early = $$('.cb-drag').length;
      pe(b, 'pointermove', [110, 300]);
      const ghost = $$('.cb-drag').length;
      pe(b, 'pointerup', [110, 200]);
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
    pe(b, 'pointerdown', [100, 400]);
    pe(b, 'pointermove', [110, 300]);
    pe(b, 'pointercancel', [110, 200]);
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
  })();

  section('360 px : rien ne déborde, des boutons de 64 px (spec 56)');
  await (async () => {
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
  })();

  await finish('fête, glisser, 360 px');
})();
