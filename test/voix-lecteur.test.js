// Le lecteur de clips de la voix (track voix-naturelle, phase 2) : lignes 14
// à 22 et 25 à 28 de la spec. D'abord sans clip (lecteur inerte : rien ne
// change), puis avec un faux navigateur qui lit le MP3 (test/tools/fake-voice.js)
// et trois clips injectés par setVoiceClips.
const { JSDOM, VirtualConsole } = require('jsdom');
const page = require('./tools/page.js');
const { FAKE_VOICE_SRC } = require('./tools/fake-voice.js');
const { FAKE_AUDIO_SRC } = require('./tools/fake-audio.js');

let failed = 0,
  passed = 0;
function check(name, cond, detail) {
  if (cond) {
    passed++;
    console.log('✅ ' + name);
  } else {
    failed++;
    console.log('❌ ' + name + (detail !== undefined ? `\n     → ${detail}` : ''));
  }
}
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
async function waitFor(cond, ms = 3000) {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) {
    if (cond()) return true;
    await wait(10);
  }
  return !!cond();
}
const tick = () => wait(15); // laisse passer les promesses du faux fetch

const SPEED = 0.05; // le temps du jeu est accéléré ×20 : 1 500 ms = 75 ms, 5 s = 250 ms

// Faux speechSynthesis : une phrase à la fois, sa fin déclenchée par le test.
const synth = {
  speaking: false,
  pending: false,
  current: null,
  log: [],
  rates: [],
  cancels: 0,
  getVoices: () => [],
  speak(u) {
    this.log.push(u.text);
    this.rates.push(u.rate);
    this.current = u;
    this.speaking = true;
    if (u.onstart) u.onstart();
  },
  cancel() {
    this.cancels++;
    const u = this.current;
    this.current = null;
    this.speaking = false;
    if (u && u.onerror) u.onerror();
  },
  end() {
    const u = this.current;
    this.current = null;
    this.speaking = false;
    if (u && u.onend) u.onend();
  },
};

// avant les faux : ce que le jeu touche quand il n'a aucun clip
const touched = { audios: 0, fetches: 0, caches: 0 };
const jsdomErrors = [];
const vc = new VirtualConsole();
vc.on('jsdomError', (e) => jsdomErrors.push(String(e && e.message)));
const dom = new JSDOM(page.buildHtml(), {
  runScripts: 'dangerously',
  pretendToBeVisual: true,
  url: 'http://localhost/?saison=aucune',
  virtualConsole: vc,
  beforeParse(win) {
    const st = win.setTimeout.bind(win);
    win.setTimeout = (fn, ms, ...a) => st(fn, Math.round((ms || 0) * SPEED), ...a);
    win.SpeechSynthesisUtterance = function (text) {
      this.text = text;
    };
    win.speechSynthesis = synth;
    const NativeAudio = win.Audio;
    win.Audio = function (...a) {
      touched.audios++;
      return new NativeAudio(...a);
    };
    win.fetch = () => {
      touched.fetches++;
      return Promise.reject(new TypeError('pas de réseau dans ce test'));
    };
    win.caches = {
      open: async () => {
        touched.caches++;
        throw new Error('pas de cache dans ce test');
      },
    };
  },
});
const w = dom.window,
  d = w.document;
const ev = (code) => w.eval(code);
const errs = [];
w.addEventListener('error', (e) => errs.push(e.message));

const A = 'aaaaaaaaaaaa',
  B = 'bbbbbbbbbbbb',
  C = 'cccccccccccc';
const TABLE = { 'Bonjour.': A, 'Au revoir.': B, 'Encore une histoire.': C };
const UNLOCK = 'data:audio/mpeg;base64,AAAA';

(async () => {
  await wait(200);
  const speak = (t, o) => ev('speak')(t, o);
  const V = () => w.fakeVoice;
  const said = () => synth.log.join(' | ');
  const touch = () => d.body.dispatchEvent(new w.Event('pointerdown', { bubbles: true }));
  // les clips demandés pour être joués (le téléchargement de fond passe `cache: 'no-store'`)
  const played = () =>
    V()
      .fetches.filter((f) => !f.opts)
      .map((f) => f.url);
  const fetched = () =>
    V()
      .fetches.filter((f) => f.opts)
      .map((f) => f.url);
  const audio = () => V().audios[V().audios.length - 1];
  const state = () => JSON.stringify(ev('voiceOfflineState()'));
  // repart d'un lecteur neuf ; hors ligne par défaut, pour que le téléchargement de fond ne se mêle pas aux lectures
  function fresh(table = TABLE, { online = false } = {}) {
    ev('stopSpeech()');
    synth.log.length = 0;
    synth.rates.length = 0;
    Object.assign(V(), { playMode: 'ok', clipMode: 'ok', pitch: true, canPlay: 'probably', online, saveData: false });
    Object.assign(V(), { putError: null, waiting: [] });
    V().store.clear();
    for (const k of ['audios', 'fetches', 'created', 'revoked', 'puts', 'deletes', 'cacheNames']) V()[k].length = 0;
    V().opens = 0;
    ev('setVoiceClips')(table, UNLOCK);
  }

  console.log('— Lecteur inerte : sans clip, rien ne change');
  await wait(400); // plus que les 5 s (accélérées) du téléchargement de fond
  touch();
  speak('Bonjour.');
  check('aucun élément audio créé', touched.audios === 0, touched.audios);
  check('aucun fetch', touched.fetches === 0, touched.fetches);
  check('caches jamais touché', touched.caches === 0, touched.caches);
  check('speak() parle par Web Speech, comme avant', said() === 'Bonjour.', said());
  check(
    "l'état hors ligne dit « pas encore compté »",
    ev('voiceOfflineState().cached') === null && ev('voiceOfflineState().total') === 0,
    state(),
  );
  synth.end();

  console.log('— Lecteur inerte : des clips, mais un navigateur qui ne lit pas le MP3 (jsdom)');
  synth.log.length = 0;
  ev('setVoiceClips')(TABLE, UNLOCK);
  await wait(400);
  touch();
  speak('Bonjour.');
  check('aucun fetch ni cache', touched.fetches === 0 && touched.caches === 0, JSON.stringify(touched));
  check('la phrase est dite par Web Speech', said() === 'Bonjour.', said());
  check("l'état reste « pas encore compté »", ev('voiceOfflineState().cached') === null, state());
  check(
    'aucune erreur jsdom ni de la fenêtre',
    jsdomErrors.length === 0 && errs.length === 0,
    [...jsdomErrors, ...errs].join(' | '),
  );
  synth.end();

  // le faux navigateur qui lit le MP3, et le faux moteur audio (pour voir les sons baisser)
  ev(FAKE_VOICE_SRC);
  ev(FAKE_AUDIO_SRC);
  ev('audioCtx = null; ensureAudioCtx()');
  const duck = () => {
    const calls = ev('soundBus.duck.gain.calls');
    return calls.length ? calls[calls.length - 1][1] < 1 : false;
  };

  console.log('— Ligne 18 : le premier geste déverrouille le lecteur');
  fresh();
  check('rien ne joue avant le geste', V().audios.length === 1 && audio().played.length === 0, V().audios.length);
  touch();
  await tick();
  check(
    'le premier pointerdown joue VOICE_UNLOCK dans son élément audio',
    V().audios.length === 1 && audio().played.join() === UNLOCK,
    V().audios.length && audio().played.join(),
  );
  check('sans aucun réseau', V().fetches.length === 0);
  touch();
  await tick();
  check('une seule fois par session réussie', audio().played.length === 1, audio().played.join());

  console.log('— Ligne 14 : une phrase de la table est jouée par son clip');
  speak('Bonjour.');
  await tick();
  check('le clip est chargé par fetch', played().join() === `voix/${A}.mp3`, played().join());
  check(
    "il joue dans l'unique élément audio",
    V().audios.length === 1 && audio().played[1] === V().created[0] && audio().src.startsWith('blob:'),
    audio().played.join(),
  );
  check("speechSynthesis.speak n'est pas appelé", said() === '', said());

  console.log('— Ligne 19 : les sons baissent pendant le clip, la suite attend sa fin');
  speak('Au revoir.');
  await tick();
  check('la phrase suivante attend (file de parole)', played().length === 1 && said() === '', played().join());
  check('les sons ne baissent pas avant `playing`', !duck());
  audio().fire('playing');
  check('`playing` baisse les sons et la musique', duck());
  audio().fire('ended');
  check('`ended` les remonte', !duck());
  check("l'URL d'objet est libérée", V().revoked.join() === V().created[0], V().revoked.join());
  await tick();
  check('la phrase suivante démarre', played().join() === `voix/${A}.mp3,voix/${B}.mp3`, played().join());
  audio().fire('playing');
  audio().fire('error');
  check('`error` remonte les sons et libère son URL', !duck() && V().revoked.length === 2);
  speak('Encore une histoire.');
  await tick();
  check('après une erreur, la phrase suivante démarre', played().length === 3, played().join());

  console.log('— Ligne 20 : stopSpeech() arrête le clip');
  audio().fire('playing');
  const pauses = audio().pauses;
  ev('stopSpeech()');
  check(
    'pause() et src vidé',
    audio().pauses === pauses + 1 && audio().src === '',
    `${audio().pauses} pause(s), src « ${audio().src} »`,
  );
  check('les sons remontent, URL libérée', !duck() && V().revoked.length === 3);
  audio().fire('ended');
  speak('Bonjour.');
  await tick();
  check('la voix reprend ensuite normalement', played().length === 4 && said() === '', played().join());
  ev('stopSpeech()');

  console.log('— Surlignage : le texte lu est marqué pendant le clip');
  fresh();
  touch();
  await tick();
  const el = d.createElement('p');
  d.body.appendChild(el);
  speak('Bonjour.', { el });
  await tick();
  audio().fire('playing');
  check('voix-lu posé à `playing`', el.classList.contains('voix-lu'));
  audio().fire('ended');
  check('retiré à la fin', !el.classList.contains('voix-lu'));
  el.remove();

  console.log('— Ligne 15 : une phrase sans clip reste en Web Speech');
  fresh();
  touch();
  await tick();
  speak('Bonjour Lina, tu as 3 perles.');
  await tick();
  check('dite par Web Speech', said() === 'Bonjour Lina, tu as 3 perles.', said());
  check('sans fetch', played().length === 0, played().join());
  // une phrase à clip attend la fin de la phrase Web Speech, et inversement
  speak('Bonjour.');
  await tick();
  check('un clip attend la fin de la phrase Web Speech', played().length === 0);
  synth.end();
  await tick();
  check('puis il joue', played().length === 1, played().join());
  ev('stopSpeech()');

  console.log('— Ligne 16 : clip introuvable ou trop lent, Web Speech prend sa place');
  for (const [mode, nom] of [
    ['404', 'réponse non 200'],
    ['fail', 'erreur réseau'],
  ]) {
    fresh();
    touch();
    await tick();
    V().clipMode = mode;
    speak('Bonjour.');
    await tick();
    check(
      `${nom} : la même phrase est dite par Web Speech`,
      said() === 'Bonjour.' && audio().played.length === 1,
      said(),
    );
    speak('Au revoir.');
    await tick();
    check(`${nom} : la phrase suivante attend sa fin`, said() === 'Bonjour.', said());
    ev('stopSpeech()');
  }
  fresh();
  touch();
  await tick();
  V().clipMode = 'slow';
  speak('Bonjour.');
  await tick();
  check('clip lent : rien avant 1 500 ms', said() === '');
  check('clip lent : Web Speech après 1 500 ms', await waitFor(() => said() === 'Bonjour.'), said());
  V().release();
  await tick();
  check("clip lent : le clip arrivé trop tard n'est pas joué", audio().played.length === 1, audio().played.join());
  synth.end();
  check('clip lent : la phrase finit une seule fois', !ev('speaking'));

  console.log('— Ligne 17 : play() refusé, le lecteur se désactive jusqu’au prochain geste');
  fresh();
  touch();
  await tick();
  V().playMode = 'reject';
  speak('Bonjour.');
  await tick();
  check('la phrase passe à Web Speech', said() === 'Bonjour.', said());
  synth.end();
  V().playMode = 'ok';
  speak('Au revoir.');
  await tick();
  check(
    'le lecteur reste désactivé : pas de fetch, Web Speech',
    played().length === 1 && said() === 'Bonjour. | Au revoir.',
    said(),
  );
  synth.end();
  touch();
  speak('Encore une histoire.');
  await tick();
  check('le geste suivant le réactive', played().length === 2 && said() === 'Bonjour. | Au revoir.', said());
  ev('stopSpeech()');

  console.log('— Ligne 18 : déverrouillage refusé, nouvel essai au geste suivant');
  fresh();
  V().playMode = 'reject';
  touch();
  await tick();
  check('le silence a été tenté', audio().played.join() === UNLOCK);
  speak('Bonjour.');
  await tick();
  check('entre-temps, Web Speech (aucun fetch)', said() === 'Bonjour.' && played().length === 0, said());
  synth.end();
  V().playMode = 'ok';
  touch();
  await tick();
  check('le geste suivant rejoue le silence', audio().played.join() === `${UNLOCK},${UNLOCK}`, audio().played.join());
  speak('Au revoir.');
  await tick();
  check('puis les clips jouent', played().join() === `voix/${B}.mp3`, played().join());
  ev('stopSpeech()');

  console.log('— Ligne 21 : la relecture lente de Perle');
  fresh();
  touch();
  await tick();
  speak('Bonjour.', { rate: 0.7 });
  await tick();
  check(
    'avec preservesPitch : playbackRate 0,8 et hauteur conservée',
    audio().playbackRate === 0.8 && audio().preservesPitch === true && said() === '',
    `${audio().playbackRate}, ${said()}`,
  );
  audio().fire('ended');
  speak('Au revoir.');
  await tick();
  check('une phrase normale revient à la vitesse 1', audio().playbackRate === 1, audio().playbackRate);
  ev('stopSpeech()');
  V().pitch = false;
  fresh();
  V().pitch = false;
  ev('setVoiceClips')(TABLE, UNLOCK);
  touch();
  await tick();
  speak('Bonjour.', { rate: 0.7 });
  await tick();
  check(
    'sans preservesPitch : Web Speech à la vitesse 0,7',
    said() === 'Bonjour.' && synth.rates[0] === 0.7 && played().length === 0,
    `${said()} ${synth.rates[0]}`,
  );
  synth.end();
  speak('Au revoir.');
  await tick();
  check('… et les phrases normales gardent leur clip', played().length === 1, played().join());
  ev('stopSpeech()');

  console.log('— Ligne 22 : voix coupée, aucun clip');
  fresh();
  touch();
  await tick();
  ev('state.voice = false');
  speak('Bonjour.');
  await tick();
  check('ni chargé ni joué, ni dit', played().length === 0 && said() === '' && audio().played.length === 1, said());
  ev('state.voice = true');

  console.log('— Sécurité : une empreinte hors forme ne part jamais en fetch');
  fresh({ 'Bonjour.': '../../autre', 'Au revoir.': B });
  touch();
  await tick();
  speak('Bonjour.');
  await tick();
  check(
    'la phrase est dite par Web Speech, sans fetch',
    said() === 'Bonjour.' && played().length === 0,
    played().join(),
  );
  ev('stopSpeech()');

  console.log('— Ligne 25 : le téléchargement de fond');
  ev('window.voiceStates = []; on("voice:offline", (s) => window.voiceStates.push(JSON.stringify(s)))');
  const SIX = { ...TABLE, 'Quatre.': 'dddddddddddd', 'Cinq.': 'eeeeeeeeeeee', 'Six.': 'ffffffffffff' };
  fresh(SIX, { online: true });
  V().store.add(A + '.mp3');
  V().store.add('999999999999.mp3'); // un clip d'une ancienne table
  V().clipMode = 'slow';
  check('rien avant 5 s', V().opens === 0 && ev('voiceOfflineState().cached') === null, state());
  check(
    'il ouvre le cache lagon-voix après 5 s',
    (await waitFor(() => V().opens > 0)) && V().cacheNames.every((n) => n === 'lagon-voix'),
    V().cacheNames.join(),
  );
  await waitFor(() => V().fetches.length >= 4);
  await tick();
  check(
    'il télécharge les absents, 4 à la fois, dans l’ordre de la table',
    fetched().join() === [B, C, 'dddddddddddd', 'eeeeeeeeeeee'].map((h) => `voix/${h}.mp3`).join(),
    fetched().join(),
  );
  check(
    "avec cache: 'no-store'",
    V().fetches.every((f) => f.opts && f.opts.cache === 'no-store'),
  );
  check(
    'les clips déjà présents sont comptés',
    ev('voiceOfflineState().cached') === 1 && ev('voiceOfflineState().total') === 6,
    state(),
  );
  V().release();
  await waitFor(() => V().fetches.length === 5);
  V().release();
  await waitFor(() => V().deletes.length > 0);
  check('la page range elle-même chaque clip (cache.put)', V().puts.length === 5, V().puts.join());
  check('il retire les clips absents de la table', V().deletes.join() === '999999999999.mp3', V().deletes.join());
  check(
    'état final : tout est là',
    state() === JSON.stringify({ cached: 6, total: 6, full: false, offline: false, saveData: false }),
    state(),
  );
  check(
    "l'état est émis à chaque lot (voice:offline)",
    w.voiceStates.length >= 3 && w.voiceStates[w.voiceStates.length - 1] === state(),
    w.voiceStates.join(' '),
  );

  fresh(TABLE, { online: false });
  V().store.add(B + '.mp3');
  await waitFor(() => V().opens > 0);
  await tick();
  check(
    'hors ligne : il compte seulement',
    state() === JSON.stringify({ cached: 1, total: 3, full: false, offline: true, saveData: false }) &&
      V().fetches.length === 0 &&
      V().deletes.length === 0,
    state(),
  );
  fresh(TABLE, { online: true });
  V().saveData = true;
  await waitFor(() => V().opens > 0);
  await tick();
  check(
    'économie de données : il compte seulement',
    state() === JSON.stringify({ cached: 0, total: 3, full: false, offline: false, saveData: true }) &&
      V().fetches.length === 0,
    state(),
  );

  console.log('— Ligne 26 : l’appareil refuse d’enregistrer');
  fresh(SIX, { online: true });
  V().putError = Object.assign(new Error('plus de place'), { name: 'QuotaExceededError' });
  synth.log.length = 0;
  await waitFor(() => ev('voiceOfflineState().full'));
  await wait(60);
  check(
    'le téléchargement s’arrête pour la session',
    ev('voiceOfflineState().full') === true && V().fetches.length === 4,
    `${state()} ${V().fetches.length} fetch`,
  );
  check("l'enfant n'est pas prévenu", said() === '' && !d.querySelector('.toast.show'), said());

  console.log('— Lignes 27 et 28 : la carte « Voix » de l’espace parents');
  const card = async () => {
    ev('parentUnlockedUntil = Date.now() + 60000; openParentSpace()');
    await wait(20);
    const c = d.querySelector('.ps-voice');
    return c ? c.textContent.replace(/\s+/g, ' ').trim() : null;
  };
  check('sans service (VOICE_SERVICE vide) : aucune carte', (await card()) === null);
  ev("VOICE_SERVICE = 'Microsoft Azure'");
  let text = await card();
  check(
    'la carte dit que la voix est une voix de synthèse et nomme le service',
    !!text &&
      text.includes('🗣️ Voix') &&
      text.includes(
        "La voix du jeu est une voix de synthèse, créée par ordinateur (Microsoft Azure), et non la voix d'une vraie personne. Les phrases qui contiennent le prénom ou un nombre sont dites par la voix de l'appareil.",
      ),
    text,
  );
  check(
    'appareil plein',
    text.endsWith(
      "L'appareil n'a plus de place pour les voix : sans Internet, certaines phrases utilisent la voix de l'appareil.",
    ),
    text,
  );
  fresh(TABLE, { online: true });
  text = await card();
  check('pas encore compté', text.endsWith('Voix disponibles sans Internet : vérification en cours.'), text);
  await waitFor(() => ev('voiceOfflineState().cached') === 3);
  text = await card();
  check('tout est là', text.endsWith('Toutes les voix sont disponibles sans Internet.'), text);
  fresh(TABLE, { online: false });
  V().store.add(A + '.mp3');
  await waitFor(() => ev('voiceOfflineState().cached') === 1);
  text = await card();
  check(
    'hors ligne',
    text.endsWith('Voix disponibles sans Internet : 1 sur 3. Le reste se téléchargera avec Internet.'),
    text,
  );
  fresh(TABLE, { online: true });
  V().saveData = true;
  await waitFor(() => ev('voiceOfflineState().cached') === 0);
  text = await card();
  check(
    'économie de données',
    text.endsWith('Voix disponibles sans Internet : 0 sur 3. Téléchargement en pause (économie de données).'),
    text,
  );
  fresh(TABLE, { online: true });
  V().clipMode = '404';
  await waitFor(() => V().fetches.length === 3);
  await wait(40);
  text = await card();
  check('téléchargement incomplet', text.endsWith('Voix disponibles sans Internet : 0 sur 3.'), text);
  ev('closeModal()');

  check(
    'aucune erreur dans la fenêtre',
    errs.length === 0 && jsdomErrors.length === 0,
    [...errs, ...jsdomErrors].join(' | '),
  );
  console.log(
    failed
      ? `\n${failed} test(s) du lecteur de clips en échec`
      : `\nTous les tests du lecteur de clips passent (${passed})`,
  );
  process.exit(failed ? 1 : 0);
})();
