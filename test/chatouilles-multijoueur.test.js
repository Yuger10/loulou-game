// Le Monde des Chatouilles en mode « chacun son tour » : une erreur passe la
// main (le moteur ne relance rien, `loseLife` sort par sa branche à plusieurs),
// donc la phrase et la grille restent en place et restent jouables. Bug vu en
// relecture : à la 2ᵉ erreur, « La phrase rigolote » annonçait une nouvelle
// phrase qui n'arrivait jamais, et plus aucune étiquette ne répondait.
// Harnais : test/tools/chatouilles.js (qui lance d'habitude les jeux en solo).
const t = require('./tools/chatouilles.js');
const { ev, json, check, section, all, one } = t;

const S = {
  wrong: 'Hi hi hi ! Ta phrase est rigolote, mais elle ne veut rien dire. Touche un mot pour le changer de place.',
  again: 'Hi hi hi ! Allez, une nouvelle phrase !',
};
const FOUR = { t: 'Le chat chatouille Papi.', pic: '🐱🪶👴', ok: [] };
const place = (order) => order.forEach((i) => t.tile(i).click());
const count = (text) => t.spoken.filter((x) => x === t.toSpoken(text)).length;
// lance un mini-jeu à plusieurs, comme le fait la carte (sans couper la partie)
function startShared(key) {
  ev(`closeModal(); currentWorld = 'foret'; playGame(${json(key)})`);
  ev('forgetSpokenHint()');
}

async function phrase() {
  startShared('sentence');
  ev('sentenceShow')(FOUR);
  const first = ev('profiles.current');
  place([0, 2, 1, 3]);
  const built = 'Le chatouille chat Papi.';
  const said1 = t.saidLast(`${built} ${S.wrong}`);
  const passed1 = await t.waitFor(() => ev('profiles.current') !== first, 1500);
  check('à plusieurs, 1ʳᵉ erreur : la voix dit la phrase et S4, la main passe, les étiquettes restent', () => [
    ev('party.active') === true,
    said1,
    passed1,
    json(t.lineWords()) === json(built.split(' ')),
  ]);
  t.tile(1).click();
  t.tile(2).click();
  place([2, 1]); // de nouveau faux : « Le chatouille chat Papi. »
  const said2 = t.saidLast(`${built} ${S.wrong}`);
  const passed2 = await t.waitFor(() => ev('profiles.current') === first, 1500);
  await t.wait(300); // 3 s de jeu : une relance (900 ms) serait arrivée
  check('à plusieurs, 2ᵉ erreur : aucune nouvelle phrase n’est annoncée, la même phrase reste, la main passe', () => [
    said2,
    count(`${built} ${S.again}`) === 0,
    passed2,
    json(t.lineWords()) === json(built.split(' ')),
    !one('.win-box') && !one('.fail-box'),
  ]);
  t.tile(1).click();
  check('à plusieurs, après la 2ᵉ erreur : une étiquette posée se retire encore (le jeu n’est pas figé)', () => [
    json(t.lineWords()) === json(['Le', 'chatouille', 'Papi.']),
    t.reserveWords().includes('chat'),
  ]);
  t.tile(2).click();
  t.tile(3).click();
  place([1, 2, 3]);
  check('à plusieurs, la phrase se gagne après deux erreurs', [await t.won()]);
  ev('closeModal()');
}

async function plume() {
  startShared('coding');
  const grid = t.fallbackGrid(2);
  ev('codingShow')({ cfg: t.T1[2], grid, best: ev('codingBest')(grid), tries: 1, fallback: false });
  t.tapOps(['TL', 'F']); // le bord, deux fois
  for (let k = 0; k < 2; k++) {
    one('#cd-go').click();
    await t.idle();
  }
  check('à plusieurs, deux programmes faux : la grille et le programme restent, tout est de nouveau actif', () => [
    json(t.steps()) === json(['TL', 'F']),
    !one('#cd-go').disabled && all('.cd-op').every((b) => !b.disabled),
    !one('.win-box') && !one('.fail-box'),
  ]);
  all('.cd-step').forEach(() => one('.cd-step[data-i="0"]').click());
  t.tapOps(['F', 'F', 'TR', 'F', 'F']);
  one('#cd-go').click();
  check('à plusieurs, le chemin se gagne après deux erreurs', [await t.won()]);
  ev('closeModal()');
}

(async () => {
  await t.start();
  ev(`addProfile('Léo', '👦'); startParty(profiles.list.map((p) => p.id))`);
  section('La phrase rigolote, chacun son tour');
  await phrase();
  section('Le chemin de la plume, chacun son tour');
  await plume();
  await t.finish('le Monde des Chatouilles (chacun son tour)');
})();
