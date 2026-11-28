// L'Île du Grand Concert : après le grand final, « 📖 Mon histoire » et le
// dialogue de Stella rendent le final et le xylophone d'or : critères 36 à 38
// et 40 de la spec. Harnais : test/tools/concert.js.
const t = require('./tools/concert.js');
const { d, ev, json, check, section, shown, text, click, one, all, LEVEL } = t;

const REPLAY = 'La Grande Expédition est terminée : le trésor de Zap est à toi !';
const season3 = () => one('.story-season[data-saison="3"]');
const journal = () => !!one('.story-journal');
// une partie au niveau 102, toutes les îles ouvertes, la saison 2 finie ; la saison 3 finie ou non
function setup(done) {
  ev(`closeModal(); state.missions = ${LEVEL(102)}; state.expeditionIntroSeen = true; state.skyIntroSeen = true;
      ${t.VISIT_ALL} state.storySolved = Object.fromEntries(state.visited.map((id) => [id, true]));
      state.season2Done = true; state.season3Done = ${done}; state.coins = 7; save(); setWorld("concert", true)`);
}

// critère 37 : sans le final, ni le journal ni Stella ne proposent le xylophone d'or
function avant() {
  setup(false);
  ev('openStoryJournal()');
  check('critère 37 : avant le final, le journal ne propose ni le final ni le xylophone d’or', () => [
    !!season3(),
    !season3().querySelector('h3 span.done'),
    !one('[data-finale="3"]'),
    !one('[data-xylo]'),
    one('[data-finale]').dataset.finale === '2',
  ]);
  ev('closeModal(); openDialogue("stella")');
  check('critère 37 : avant le final, Stella ne propose pas le xylophone d’or', () => [
    shown('#btn-close'),
    !one('#btn-xylo'),
    !!one('#btn-play'),
  ]);
}

// critère 36 : la section de la saison 3 du journal, une fois le final vu
function apres() {
  setup(true);
  ev('openStoryJournal()');
  const buttons = all('.story-season[data-saison="3"] button.story-chap.story-prologue');
  check('critère 36 : le titre de la saison 3 porte ✅, et la section a ses deux boutons, après les chapitres', () => [
    season3().querySelector('h3 span.done').textContent === '✅',
    text(one('[data-finale="3"]')).includes('Revoir le grand final'),
    text(one('[data-xylo]')).includes("🎼 Mon xylophone d'or"),
    json(buttons.slice(-2).map((b) => Object.keys(b.dataset).join())) === json(['finale', 'xylo']),
    season3().lastElementChild === one('[data-xylo]'),
  ]);
  check('critère 40 : le premier [data-finale] du journal reste celui de la saison 2', () => [
    all('[data-finale]').length === 2,
    one('[data-finale]').dataset.finale === '2',
    one('[data-finale]').closest('.story-season').dataset.saison === '2',
  ]);
}

// critère 36 : revoir le final, sans l'écran du trésor et sans rien redonner
function revoir() {
  t.spyEvents();
  click(one('[data-finale="3"]'));
  const first = [shown('.finale.finale3[data-step="0"]'), json(t.themes()) === json(['concert-fete'])];
  t.finaleNext();
  t.finaleNext();
  const label = one('#finale3-next').textContent;
  t.finaleNext();
  check('critère 36 : revoir le final : les 3 scènes, puis « La Grande Expédition ✅ », sans l’écran du trésor', () => [
    ...first,
    label === 'La Grande Expédition ✅',
    shown('.reward-box.finale-done'),
    !one('.finale-gift') && !one('#finale3-play'),
    text(one('.finale-done .speech')) === REPLAY && t.saidLast(REPLAY),
  ]);
  click(one('#finale3-end'));
  check('critère 36 : rien n’est redonné, et le journal se rouvre', () => [
    ev('state.coins') === 7,
    !t.themes().includes('done'),
    t.themes().filter((k) => k === null).length === 1,
    journal(),
  ]);
}

// critères 36 et 40 : le xylophone d'or depuis le journal ; le final de la saison 2 intact
function depuisLeJournal() {
  click(one('[data-xylo]'));
  const opened = shown('.xylo.xylo-gold#xylo-gold');
  click(one('#xylo-done'));
  check('critère 36 : « 🎼 Mon xylophone d’or » ouvre le xylophone ; « Fini ✨ » rouvre le journal', () => [
    opened,
    journal(),
    !one('#xylo-gold'),
  ]);
  click(one('[data-finale]'));
  check('critère 40 : le premier [data-finale] ouvre le final de la saison 2', () => [
    shown('#finale'),
    !one('.finale3'),
    /Grisou/.test(text(one('#finale h2'))),
  ]);
  ev('closeModal()');
}

// critère 38 : Stella propose le xylophone d'or
function stella() {
  ev('closeModal(); openDialogue("stella")');
  const btn = one('#btn-xylo');
  check('critère 38 : après le final, Stella a un bouton « 🎼 Le xylophone d’or », avant « Pas maintenant »', () => [
    btn.textContent === "🎼 Le xylophone d'or",
    btn.classList.contains('btn-craft'),
    btn.nextElementSibling === one('#btn-close'),
  ]);
  click(btn);
  check('critère 38 : il ouvre le xylophone d’or', () => [shown('.xylo.xylo-gold#xylo-gold'), !one('#btn-close')]);
  click(one('#xylo-done'));
  check('critère 38 : « Fini ✨ » ferme la fenêtre', () => [!t.modalOpen()]);
  ev('closeModal(); openDialogue("doremi")');
  check('critère 38 : les autres personnages ne le proposent pas', () => [shown('#btn-close'), !one('#btn-xylo')]);
  ev('closeModal(); setWorld("lagon", true)');
}

(async () => {
  await t.start();
  section('Avant le grand final (critère 37)');
  avant();
  section('« 📖 Mon histoire » après le final (critères 36 et 40)');
  apres();
  revoir();
  depuisLeJournal();
  section('Stella (critère 38)');
  stella();
  check('la page est toujours là', [!!d.getElementById('overlay')]);
  await t.finish('l’Île du Grand Concert (le journal et Stella)');
})();
