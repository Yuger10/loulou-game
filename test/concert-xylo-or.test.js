// L'Île du Grand Concert : le xylophone d'or (`openGoldenXylophone`), le
// trésor de Zap, joué librement hors du final : critère 39 de la spec.
// Harnais : test/tools/concert.js.
const t = require('./tools/concert.js');
const { ev, json, check, section, shown, one, all, XYLO } = t;

const SAY = "C'est ton xylophone d'or. Touche les lames, et joue ce que tu veux !";
const counted = () => json(ev('[state.missions, state.coins, state.skills, state.gameCounts, missionErrors]'));

function ecran() {
  ev('closeModal(); state.season3Done = true; save()');
  t.spyEvents();
  const before = counted();
  const from = t.spoken.length;
  ev('openGoldenXylophone()');
  check('critère 39 : la fenêtre du xylophone d’or : titre, consigne lue une fois, 8 lames dorées, « Fini ✨ »', () => [
    shown('.xylo.xylo-gold#xylo-gold'),
    one('.game-head h2').textContent === "🎼 Le xylophone d'or",
    one('.puzzle-hint .hint-txt').textContent === 'Joue ce que tu veux !',
    t.spoken.length === from + 1 && t.saidLast(SAY),
    json(t.ns('#xylo-gold .xylo-lame')) === json([0, 1, 2, 3, 4, 5, 6, 7]),
    all('#xylo-gold .xylo-lame').every((el, i) => el.querySelector('.xylo-dot').style.backgroundColor === XYLO[i].rgb),
    one('#xylo-done').textContent === 'Fini ✨',
  ]);
  check('critère 39 : rien n’est compté : ni essais, ni indice, ni solution', () => [
    !one('#lives-bar'),
    !one('#modal-body .hint-btn'),
    !one('#challenge-timer'),
    json(t.themes()) === json(['concert']),
  ]);
  return before;
}

// chaque lame joue sa note et lance un ♪, qui disparaît
async function jouer(before) {
  t.spy();
  const said = t.spoken.length;
  all('#xylo-gold .xylo-lame').forEach((el) => el.click());
  const floats = all('#xylo-gold .xylo-float');
  check('critère 39 : chaque lame joue sa note, sans voix', () => [
    json(t.played()) === json(XYLO.map((x) => x.hz)),
    t.spoken.length === said,
  ]);
  check('critère 39 : chaque toucher ajoute un ♪ de la couleur de la note', () => [
    floats.length === 8,
    floats.every((f, i) => f.textContent === '♪' && f.style.color === XYLO[i].rgb),
  ]);
  await t.wait(150);
  check('critère 39 : les ♪ sont retirés au plus tard 900 ms après', () => [all('.xylo-float').length === 0]);
  check('critère 39 : ni mission, ni pièce, ni compétence', () => [counted() === before, !one('.win-box')]);
  t.unspy();
}

// la musique de l'île revient une seule fois, quelle que soit la sortie
function sorties() {
  const nulls = () => t.themes().filter((k) => k === null).length;
  const open = (code) => {
    ev('closeModal()');
    t.spyEvents();
    ev(code);
  };
  open('openGoldenXylophone({ onDone: () => openModal("<p id=\\"autre\\">Autre fenêtre</p>") })');
  one('#xylo-done').click();
  check('critère 39 : « Fini ✨ » qui rouvre une autre fenêtre : un seul retour à la musique de l’île', () => [
    shown('#autre'),
    json(t.themes()) === json(['concert', null]),
  ]);
  ev('closeModal()');
  check('… et fermer cette autre fenêtre n’en ajoute pas', () => [nulls() === 1]);
  open('openGoldenXylophone()');
  one('#xylo-done').click();
  check('critère 39 : « Fini ✨ » sans suite ferme la fenêtre : un seul retour', () => [
    !t.modalOpen(),
    json(t.themes()) === json(['concert', null]),
  ]);
  open('openGoldenXylophone()');
  ev('closeModal()');
  check('critère 39 : fermer la fenêtre : un seul retour', () => [json(t.themes()) === json(['concert', null])]);
  open('openGoldenXylophone()');
  ev('openModal("<p id=\\"autre\\">Autre fenêtre</p>")');
  const replaced = json(t.themes());
  ev('closeModal()');
  check('critère 39 : une autre fenêtre le remplace : un seul retour, même après sa fermeture', () => [
    replaced === json(['concert', null]),
    nulls() === 1,
  ]);
  open('openGoldenXylophone({ theme: false })');
  one('#xylo-done').click();
  check('dans le final (`theme: false`), le xylophone ne touche pas à la musique', () => [t.themes().length === 0]);
}

(async () => {
  await t.start();
  section('Le xylophone d’or (critère 39)');
  const before = ecran();
  await jouer(before);
  section('Le xylophone d’or : la musique de l’île revient une seule fois');
  sorties();
  await t.finish('l’Île du Grand Concert (le xylophone d’or)');
})();
