// L'Île du Grand Concert : le grand final de la saison 3 (js/features/story/
// finale3.js) : critères 32 à 35 de la spec, table « Le grand final ». Le
// journal et Stella : test/concert-journal.test.js ; le xylophone d'or :
// test/concert-xylo-or.test.js. Harnais : test/tools/concert.js.
const t = require('./tools/concert.js');
const { d, ev, json, check, section, shown, text, click, one, all, LEVEL } = t;

const LINES = [
  'Le dernier morceau se pose à sa place… La carte de Zap est complète ! Sa croix rouge montre le trésor, juste sous la grande scène.',
  '« On creuse ? » dit Zap. Sous les planches, il y a un vieux coffre. Dedans… un xylophone tout en or !',
  '« C’est le trésor de l’expédition, dit Zap. Il est pour toi. Ce soir, c’est toi qui ouvres le grand concert ! »',
].map((s) => s.replace(/’/g, "'"));
const TITLES = ['La carte est complète !', 'Le trésor de Zap', 'Le grand concert'];
const GIFT =
  "Le xylophone d'or est à toi ! Touche ses lames pour jouer ce que tu veux. Tu le retrouves dans Mon histoire, et auprès de Stella sur la grande scène.";
const END = 'Bravo ! Tu as trouvé le trésor de Zap. La saison 3, la Grande Expédition, est terminée !';
const FOUR = '{ crayons: true, dumplings: true, coffres: true, chatouilles: true }';
const saved = () => JSON.parse(d.defaultView.localStorage.getItem(ev('currentSaveKey()')));
const scene = (i) => one(`.finale.finale3[data-step="${i}"]`);
const reset = () =>
  ev(`closeModal(); state.missions = ${LEVEL(102)}; state.coins = 0; state.season3Done = false;
      state.storySolved = ${FOUR}; state.squishies = squishyFreshState(); save(); setCurrentWorld("concert")`);

// critère 32 : « Continuer l'aventure » ouvre le final ; tout est donné avant la première scène
function ouverture() {
  reset();
  t.spyEvents();
  ev('storyWin("concert")');
  const before = [ev('state.season3Done') === false, t.themes().length === 0];
  click(one('#story-continue'));
  check('critère 31 : « Continuer l’aventure ✨ » ouvre le grand final de la saison 3', () => [
    ...before,
    shown('.finale.finale3'),
    !!scene(0),
  ]);
  check('critère 32 : `season3Done` est posé et enregistré avant la première scène', () => [
    ev('state.season3Done') === true,
    saved().season3Done === true,
    saved().storySolved.concert === true,
  ]);
  check('critère 32 : l’événement `season3:done` est émis, puis la musique de fête', () => [
    json(t.themes()) === json(['done', 'concert-fete']),
  ]);
}

// critère 33 : les 3 scènes, puis l'écran du trésor
function scenes() {
  const map = one('.story-zapmap.happy.finale3-map svg.zap-map');
  check('critère 33, scène 1 : la carte complète, le morceau du Concert brille (D20)', () => [
    scene(0).querySelector('h2').textContent === TITLES[0],
    map.dataset.found === '5',
    map.querySelector('.zm-piece[data-piece="concert"]').classList.contains('zm-new'),
    t.sameMap(map, 'zapMapSVG(ZAP_MAP_PIECES, { fresh: "concert" })'),
    text(scene(0).querySelector('.speech')) === LINES[0] && t.saidLast(LINES[0]),
    one('#finale3-next').textContent === 'Suite ➡️',
  ]);
  t.finaleNext();
  t.spy();
  all('.finale3 .xylo-lame').forEach((el) => el.click());
  check('critère 33, scène 2 : le xylophone tout en or, sans noms, non cliquable', () => [
    scene(1).querySelector('h2').textContent === TITLES[1],
    all('.finale3 .xylo.xylo-gold .xylo-lame').length === 8,
    all('.finale3 .xylo-name').length === 0,
    t.played().length === 0,
    text(scene(1).querySelector('.speech')) === LINES[1] && t.saidLast(LINES[1]),
    one('#finale3-next').textContent === 'Suite ➡️',
  ]);
  t.unspy();
  t.finaleNext();
  check('critère 33, scène 3 : Zap fait la fête, « Mon trésor 🎁 »', () => [
    scene(2).querySelector('h2').textContent === TITLES[2],
    !!scene(2).querySelector('svg[data-buddy="zap"]'),
    text(scene(2).querySelector('.speech')) === LINES[2] && t.saidLast(LINES[2]),
    one('#finale3-next').textContent === 'Mon trésor 🎁',
  ]);
  t.finaleNext();
  check('critère 33 : l’écran du trésor : « Jouer maintenant » et « Plus tard »', () => [
    shown('.reward-box.finale-gift .finale3-treasure .xylo.xylo-gold'),
    one('.finale-gift h2').textContent === "Le xylophone d'or est à toi ! ✨",
    text(one('.finale-gift .speech')) === GIFT && t.saidLast(GIFT),
    one('#finale3-play').textContent === '🎼 Jouer maintenant',
    one('#finale3-later').textContent === 'Plus tard',
  ]);
}

// critère 34 : jouer maintenant, « Fini ✨ », l'écran de fin, la musique de l'île revient
function tresor() {
  click(one('#finale3-play'));
  const opened = [shown('#xylo-gold'), !t.themes().includes('concert'), !t.themes().includes(null)];
  click(one('#xylo-done'));
  check('critère 34 : « 🎼 Jouer maintenant » ouvre le xylophone d’or ; « Fini ✨ » mène à l’écran de fin', () => [
    ...opened,
    shown('.reward-box.finale-done'),
    one('.finale-done h2').textContent === 'La Grande Expédition ✅',
    one('.finale-done .big-emoji').textContent === '🎼',
    text(one('.finale-done .speech')) === END && t.saidLast(END),
    one('#finale3-end').textContent === 'Continuer ✨',
    !t.themes().includes(null),
  ]);
  click(one('#finale3-end'));
  check('critère 34 : « Continuer ✨ » ferme la fenêtre, et la musique de l’île revient', () => [
    !t.modalOpen(),
    t.themes().pop() === null,
    t.themes().filter((k) => k === null).length === 1,
    ev('state.coins') === 20,
  ]);
}

// « Plus tard » mène aussi à l'écran de fin ; fermer en route ne perd rien
function plusTard() {
  ev('closeModal(); state.season3Done = false; save()');
  t.spyEvents();
  ev('openSeason3Finale(() => window.__th.push("fin"))');
  for (let k = 0; k < 3; k++) t.finaleNext();
  click(one('#finale3-later'));
  const end = shown('.reward-box.finale-done') && !one('#xylo-gold');
  click(one('#finale3-end'));
  check('critère 33 : « Plus tard » mène à l’écran de fin ; à la fin, `onDone` est appelée', () => [
    end,
    json(t.themes()) === json(['done', 'concert-fete', null, 'fin']),
  ]);
  ev('closeModal(); state.season3Done = false; save()');
  t.spyEvents();
  ev('openSeason3Finale(null); closeModal()');
  check('critère 32 : fermer la fenêtre dès la première scène garde le xylophone d’or', () => [
    ev('state.season3Done') === true,
    saved().season3Done === true,
    json(t.themes()) === json(['done', 'concert-fete', null]),
  ]);
}

// critère 35 : le final ne se rejoue pas
function uneSeuleFois() {
  ev(`closeModal(); state.coins = 0; state.storySolved = ${FOUR}; save()`);
  t.spyEvents();
  ev('storyWin("concert")');
  click(one('#story-continue'));
  check('critère 35 : résoudre de nouveau le chapitre ne rejoue pas le final', () => [
    ev('state.season3Done') === true,
    !t.modalOpen(),
    !one('.finale3'),
    t.themes().length === 0,
  ]);
}

(async () => {
  await t.start();
  section('Le grand final : ouverture (critères 31 et 32)');
  ouverture();
  section('Le grand final : les 3 scènes et le trésor (critères 33 et 34)');
  scenes();
  tresor();
  plusTard();
  section('Le grand final : une seule fois (critère 35)');
  uneSeuleFois();
  await t.finish('l’Île du Grand Concert (le grand final)');
})();
