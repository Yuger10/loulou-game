// Le Monde des Chatouilles : les chatouilles (critères 38 à 45 de la spec,
// règles K1 à K5) : le rire de bonjour sur la scène, le bouton « 🪶 Des
// chatouilles ? » du dialogue, l'envie tirée une fois, le « stop », le repos
// de 60 s. Rien n'est sauvegardé. Harnais : test/tools/chatouilles.js.
const t = require('./tools/chatouilles.js');
const { ev, json, check, section, one, all, LEVEL } = t;

const sceneChar = (id) => one(`#scene .isle-char[data-char="${id}"]`);
const face = (id) => one(`#scene .isle-char[data-char="${id}"] .emoji`);
const dialogFace = () => one('#modal-body .char-header .emoji');
const btn = () => one('#btn-tickle');
const bubble = () => one('#modal-body .speech .txt').textContent;
const bubbleSay = () => one('#modal-body .speech .btn-speak').dataset.say;
const dialogOf = (name) =>
  t.modalOpen() &&
  !!one(`.char-header [aria-label*="${name}"], .char-header h2`) &&
  one('.char-header h2').textContent.includes(name);
const played = () => ev('window.__played');
const buzz = () => ev('window.__buzz');
const tickle = (id) => ev(`CHARACTER_TICKLES.${id}`);
// le texte d'une bulle : dit par `speak`, montré, et porté par le bouton d'écoute (sans balises)
const says = (textSaid) => t.saidLast(textSaid) && bubble() === textSaid && bubbleSay() === textSaid;

function surIle() {
  ev(`closeModal(); state.missions = ${LEVEL(94)}; state.expeditionIntroSeen = true; ${t.VISIT_ALL}
      state.storySolved = { lagon: true, crayons: true, dumplings: true, coffres: true, chatouilles: true }; save();
      setWorld("chatouilles", true); switchView("ile");
      window.__played = []; window.__buzz = [];
      const realSound = playSound; playSound = (k) => { window.__played.push(k); return realSound(k); };
      navigator.vibrate = (p) => { window.__buzz.push(p); return true; };
      Object.keys(tickleRestUntil).forEach((k) => delete tickleRestUntil[k])`);
}
const forget = () => ev('window.__played.length = 0; window.__buzz.length = 0');

// critères 38 à 40 : le toucher sur la scène
async function bonjour() {
  check('constantes des chatouilles (politique « Défauts » de la spec)', () => [
    ev('HELLO_LAUGH_DELAY') === 600 && ev('GIGGLE_MS') === 900 && ev('TICKLE_REST_MS') === 60000,
    json(ev('tickleRestUntil')) === '{}',
  ]);
  forget();
  ev('window.__rnd = Math.random; window.__draws = 0; Math.random = () => { window.__draws++; return 0.5; }');
  sceneChar('guili').click();
  const draws = ev('window.__draws');
  ev('Math.random = window.__rnd');
  const now = [face('guili').classList.contains('giggle-wiggle'), played().includes('giggle'), json(buzz()) === '[25]'];
  const early = t.modalOpen();
  const opened = await t.waitFor(() => dialogOf('Guili'), 1500);
  check('critère 38 : toucher un personnage : son visage rit, le son `giggle` joue, l’appareil vibre 25 ms', () => [
    ...now,
    !sceneChar('guili').classList.contains('giggle-wiggle'),
    draws === 0, // un rire de bonjour : aucune envie n'est tirée
  ]);
  check('critère 38 : le dialogue s’ouvre 600 ms après le toucher, pas avant', () => [early === false, opened]);
  const gone = await t.waitFor(() => !face('guili').classList.contains('giggle-wiggle'), 1500);
  check('critère 38 : après 900 ms, le visage ne rit plus (le balancement reprend)', [gone]);
  ev('closeModal()');
  // critère 39 : au repos, pas de rire de bonjour, le dialogue tout de suite
  ev('tickleRestUntil.pic = Date.now() + 60000');
  forget();
  sceneChar('pic').click();
  check(
    'critère 39 : un personnage au repos ne fait pas de rire de bonjour, son dialogue s’ouvre tout de suite',
    () => [
      dialogOf('Pic'),
      !face('pic').classList.contains('giggle-wiggle'),
      !played().includes('giggle') && buzz().length === 0,
      !btn(),
    ],
  );
  ev('closeModal(); tickleRestUntil.pic = 0');
}
function autreIle() {
  ev('closeModal(); setWorld("lagon", true); switchView("ile")');
  forget();
  const el = one('#scene .isle-char');
  el.click();
  check(
    'critère 40 : sur une autre île, rien ne change : dialogue tout de suite, ni rire ni bouton de chatouilles',
    () => [
      t.modalOpen() && !!one('#btn-gift'),
      !el.querySelector('.emoji').classList.contains('giggle-wiggle'),
      !played().includes('giggle'),
      !btn(),
      json(played()) === json(['tap']),
    ],
  );
  ev('closeModal(); setWorld("chatouilles", true); switchView("ile")');
}

// force le prochain tirage d'envie : 0 = envie, 0.99 = pas envie
const withRandom = (v, fn) => {
  ev(`window.__rnd = Math.random; Math.random = () => ${v}`);
  try {
    return fn();
  } finally {
    ev('Math.random = window.__rnd');
  }
};

// critères 41 et 42 : le bouton, le refus
function refus() {
  ev('openDialogue("pic")');
  check('critère 41 : le bouton « 🪶 Des chatouilles ? » est entre « Choisir un jeu » et « Offrir un objet »', () => {
    const ids = all('#modal-body button[id]').map((b) => b.id);
    return [
      btn().textContent === '🪶 Des chatouilles ?' && btn().classList.contains('btn-ghost'),
      ids.indexOf('btn-tickle') === ids.indexOf('btn-play') + 1,
      ids.indexOf('btn-gift') === ids.indexOf('btn-tickle') + 1,
    ];
  });
  forget();
  withRandom(0.99, () => btn().click());
  check(
    'critère 42 : sans envie : la bulle et la voix disent son « non », le bouton disparaît, il passe au repos',
    () => [
      says(tickle('pic').no),
      !btn(),
      !dialogFace().classList.contains('giggle-wiggle') && !played().includes('giggle'),
      ev('tickleRestUntil.pic > Date.now() + 59000') && ev('tickleRestUntil.pic <= Date.now() + 60000'),
    ],
  );
  ev('closeModal(); openDialogue("pic")');
  check('critère 42 : au repos, son dialogue ne repropose pas le bouton', () => [dialogOf('Pic'), !btn()]);
  ev('closeModal()');
}

// critères 43 et 44 : les rires, puis le stop au `max`-ième toucher
function rires(id) {
  const card = tickle(id);
  ev(`tickleRestUntil.${id} = 0; openDialogue(${json(id)})`);
  const laughs = [];
  withRandom(0, () => {
    for (let k = 1; k < card.max; k++) {
      forget();
      btn().click();
      laughs.push(
        says(card.laughs[(k - 1) % card.laughs.length]) &&
          dialogFace().classList.contains('giggle-wiggle') &&
          played().includes('giggle') &&
          !!btn(),
      );
    }
  });
  check(
    `critère 43, ${id} : avec l'envie, ${card.max - 1} toucher(s) : il rit, la bulle et la voix disent ses rires dans l'ordre`,
    () => [laughs.length === card.max - 1, ...laughs],
  );
  forget();
  // l'envie a été tirée une fois pour ce dialogue : un tirage défavorable n'y change plus rien
  withRandom(0.99, () => btn().click());
  check(
    `critère 44, ${id} : au ${card.max}ᵉ toucher, il ne rit pas, dit « stop », le bouton disparaît, il passe au repos`,
    () => [says(card.stop), !btn(), !played().includes('giggle'), ev(`tickleRestUntil.${id} > Date.now() + 59000`)],
  );
  ev('closeModal()');
}

// critère 45 : le repos de 60 s, rien de sauvegardé
async function repos() {
  ev('switchView("ile")');
  forget();
  sceneChar('lulu').click();
  const calm = dialogOf('Lulu') && !btn() && !played().includes('giggle');
  ev('closeModal(); tickleRestUntil.lulu = 0');
  forget();
  sceneChar('lulu').click();
  const laughs = face('lulu').classList.contains('giggle-wiggle') && played().includes('giggle');
  const opened = await t.waitFor(() => dialogOf('Lulu'), 1500);
  check(
    'critère 45 : une fois le repos passé, il rit de nouveau au toucher et son dialogue repropose le bouton',
    () => [calm, laughs, opened && !!btn()],
  );
  // K2 : chaque dialogue repart de zéro (compteur et envie)
  withRandom(0, () => btn().click());
  ev('closeModal(); openDialogue("lulu")');
  const first = withRandom(0, () => {
    btn().click();
    return says(tickle('lulu').laughs[0]);
  });
  check('K2 : chaque ouverture de dialogue remet le compteur à zéro', [first]);
  check('critère 45, D17 : rien n’est sauvegardé (aucun champ de chatouilles dans la partie)', () => [
    !/tickle|giggl|chatouill/i.test(json(Object.keys(ev('state')))),
    !/tickleRest/.test(json(ev('({ ...localStorage })'))),
  ]);
  ev('closeModal(); setWorld("lagon", true)');
}

(async () => {
  await t.start();
  surIle();
  section('Les chatouilles : le rire de bonjour sur la scène');
  await bonjour();
  autreIle();
  section('Les chatouilles : le bouton du dialogue, le « non », les rires, le « stop »');
  refus();
  ['plumette', 'guili', 'lulu', 'pic'].forEach(rires);
  section('Les chatouilles : le repos');
  await repos();
  await t.finish('le Monde des Chatouilles (les chatouilles)');
})();
