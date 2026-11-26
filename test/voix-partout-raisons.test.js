// Une voix partout (track voix-partout), les boutons inactifs du jeu (ligne 12
// de la spec, table R) : chacun dit sa raison quand l'enfant le touche, et le
// toucher ne fait rien d'autre (rien n'est acheté, échangé, créé ni ouvert).
// Un bouton inactif est `aria-disabled="true"`, jamais `disabled` (D7).
const { check, section, wait, spoken, d, ev, $, said, tap, resetScreen, start, finish } = require('./voix-outils.js');

const spokenForm = (t) => ev('toSpoken')(t);
const isInactive = (b) => !!b && b.getAttribute('aria-disabled') === 'true' && !b.disabled;
// touche un bouton inactif : rend ce qui est dit pendant ce toucher
async function touch(btn) {
  spoken.length = 0;
  await tap(btn);
  return said();
}
// ouvre un onglet du marché, redessiné avec l'état du moment
async function openMarket(tab) {
  ev(`switchView('carte'); currentTab = ${JSON.stringify(tab)}; switchView('marche')`);
  await wait(15);
}

(async () => {
  await start();
  section('Table R : chaque bouton inactif dit sa raison, et le toucher est ignoré');
  await buyItemTest();
  await squishyBoxTests();
  await squishyTradeTests();
  await craftTest();
  await decoTest();
  await teamFullTest();
  await lockedChapterTest();
  await soundSwitchTest();
  await resetScreen();
  finish('voix-partout-raisons');
})();

// « Acheter » d'un objet du marché, pièces insuffisantes
async function buyItemTest() {
  await resetScreen();
  ev("state.coins = 0; switchView('marche')");
  $('.tab-btn[data-tab="acheter"]').click();
  await wait(15);
  spoken.length = 0;
  const buy = $('[data-buy]');
  const price = ev(`ITEMS[${JSON.stringify(buy.dataset.buy)}].price * 2`);
  await tap(buy);
  check(
    'table R : « Acheter » sans assez de pièces dit le prix, sans acheter',
    said() === `Il te faut ${price} pièces.` && ev('state.coins') === 0,
    said(),
  );
  check(
    'table R : il est aria-disabled, jamais disabled',
    buy.getAttribute('aria-disabled') === 'true' && !buy.disabled,
  );
}

// la boîte de squishies (#sqm-buy) : plus de boîte aujourd'hui passe avant les pièces
async function squishyBoxTests() {
  const boxes = () => ev('squishyBoxCount()');
  await resetScreen();
  ev('state.coins = 0; sqDay().bought = 0');
  await openMarket('acheter');
  const before = boxes();
  let phrase = await touch($('#sqm-buy'));
  check(
    'table R : boîte de squishies, pièces insuffisantes : « Il te faut 15 pièces. »',
    isInactive($('#sqm-buy')) && phrase === `Il te faut ${ev('squishyShopState().price')} pièces.`,
    phrase,
  );
  check('la boîte n’est pas achetée', boxes() === before && ev('state.coins') === 0 && ev('sqDay().bought') === 0);

  ev('sqDay().bought = 99');
  await openMarket('acheter');
  phrase = await touch($('#sqm-buy'));
  check(
    'table R : plus de boîte aujourd’hui et pas assez de pièces : « Reviens demain » gagne',
    isInactive($('#sqm-buy')) && phrase === spokenForm("Reviens demain pour d'autres boîtes !"),
    phrase,
  );
  ev('state.coins = 500');
  await openMarket('acheter');
  phrase = await touch($('#sqm-buy'));
  check(
    'table R : plus de boîte aujourd’hui, même avec des pièces : « Reviens demain pour d’autres boîtes ! »',
    isInactive($('#sqm-buy')) && phrase === spokenForm("Reviens demain pour d'autres boîtes !"),
    phrase,
  );
  check('la boîte n’est pas achetée, les pièces restent', boxes() === before && ev('state.coins') === 500);
  ev('sqDay().bought = 0');
}

// l'échange de doubles (#sqm-trade) dit son libellé
async function squishyTradeTests() {
  await resetScreen();
  const id = ev('squishyMissing()[0]');
  for (const [count, label] of [
    [0, 'Encore 3 doubles'],
    [3, 'Encore 1 double'],
    [4, 'Choisis un squishy'],
  ]) {
    ev(`sqState().owned = ${JSON.stringify(count ? { [id]: count } : {})}`);
    await openMarket('echanger');
    const btn = $('#sqm-trade');
    const owned = ev('JSON.stringify(sqState().owned)');
    const phrase = await touch(btn);
    check(
      `table R : échange de doubles, « ${label} »`,
      isInactive(btn) && btn.textContent === label && phrase === label,
      `${btn.textContent} / ${phrase}`,
    );
    check(`« ${label} » : rien n’est échangé`, ev('JSON.stringify(sqState().owned)') === owned);
  }
  ev('sqState().owned = {}');
}

// la fusion : « Il manque des objets. »
async function craftTest() {
  await resetScreen();
  ev('state.inventory = {}');
  await openMarket('fusionner');
  const btn = $('[data-craft]');
  const phrase = await touch(btn);
  check('table R : fusion, « Il manque des objets. »', isInactive(btn) && phrase === 'Il manque des objets.', phrase);
  check('rien n’est créé', ev('JSON.stringify(state.inventory)') === '{}');
}

// « Acheter » d'une décoration de l'île, pièces insuffisantes
async function decoTest() {
  await resetScreen();
  ev('state.coins = 0; state.decos = []; openDecoShop()');
  await wait(15);
  const btn = $('#modal-body [data-deco]');
  const price = ev(`DECOS[${JSON.stringify(btn.dataset.deco)}].price`);
  const phrase = await touch(btn);
  check(
    'table R : décoration, pièces insuffisantes : « Il te faut N pièces. »',
    isInactive(btn) && phrase === `Il te faut ${price} pièces.`,
    phrase,
  );
  check('la décoration n’est pas achetée', ev('state.decos.length') === 0 && ev('state.coins') === 0);
}

// « ➕ Équipe », équipe pleine
async function teamFullTest() {
  await resetScreen();
  // Perle en principal, Léo et Sam équipiers, Zap rencontré et au repos (comme test/companions.test.js)
  ev(
    'currentProfile().companion = "perle"; state.team = { open: true, met: ["leo", "sam", "zap"], mates: ["leo", "sam"], day: null }; openTeamWindow()',
  );
  await wait(15);
  const btn = $('#modal-body [data-team-add="zap"]');
  const mates = ev('teamState().mates.join()');
  const phrase = await touch(btn);
  check(
    'table R : équipe pleine, « Ton équipe est déjà complète. »',
    isInactive(btn) && phrase === 'Ton équipe est déjà complète.',
    phrase,
  );
  check('personne ne rejoint l’équipe', ev('teamState().mates.join()') === mates);
}

// un chapitre verrouillé du journal
async function lockedChapterTest() {
  await resetScreen();
  ev('state.missions = 0; openStoryJournal()');
  await wait(15);
  const btn = $('#modal-body .story-chap.locked');
  const phrase = await touch(btn);
  check(
    'table R : chapitre verrouillé, « Ce chapitre s’ouvre avec son île. Continue tes missions ! »',
    isInactive(btn) && phrase === spokenForm("Ce chapitre s'ouvre avec son île. Continue tes missions !"),
    phrase,
  );
  await wait(40); // le temps qu'un chapitre s'ouvrirait
  check('le journal reste ouvert, aucun chapitre ne s’ouvre', !!$('#modal-body .story-journal'));
}

// Le commutateur de la voix n'est inactif que bruitages coupés (« Silence ») :
// il porte sa raison, mais en silence rien n'est dit (ligne 17), et rien ne change.
async function soundSwitchTest() {
  await resetScreen();
  ev("state.sound = false; state.voice = false; state.music = false; switchView('reglages')");
  await wait(15);
  for (const key of ['voice', 'music']) {
    const sw = d.querySelector(`#view-reglages [data-sound="${key}"]`);
    const phrase = await touch(sw);
    check(
      `table R : commutateur « ${key} » inactif, sa raison est « Allume d’abord les bruitages. »`,
      isInactive(sw) && sw.dataset.sayWhy === "Allume d'abord les bruitages.",
      sw.dataset.sayWhy,
    );
    check(`commutateur « ${key} » : le toucher ne change rien`, ev(`state.${key}`) === false && !ev('state.sound'));
    check(`commutateur « ${key} » : en silence, rien n’est dit (ligne 17)`, phrase === '', phrase);
  }
  ev('state.sound = true; state.voice = true');
}
