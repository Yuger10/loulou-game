// Le lecteur de clips de la voix (track voix-naturelle, phase 2) : lignes 14,
// 15 et 18 à 20 de la spec. D'abord sans clip (lecteur inerte : rien ne
// change), puis avec un faux navigateur qui lit le MP3 (test/tools/voice-bench.js)
// et trois clips injectés par setVoiceClips. La suite : test/voix-lecteur-repli.test.js
// (lignes 16, 17, 21 et 22) et test/voix-lecteur-cache.test.js (lignes 25 à 28).
const { A, B, TABLE, UNLOCK, openVoiceBench, tick, wait } = require('./tools/voice-bench.js');

const t = openVoiceBench('du lecteur de clips');
const { check, speak, V, said, touch, played, audio, state, fresh, duck, ev, d, synth, touched } = t;

async function inerteSansClip() {
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
}

async function inerteSansMp3() {
  console.log('— Lecteur inerte : des clips, mais un navigateur qui ne lit pas le MP3 (jsdom)');
  synth.log.length = 0;
  ev('setVoiceClips')(TABLE, UNLOCK);
  await wait(400);
  touch();
  speak('Bonjour.');
  check('aucun fetch ni cache', touched.fetches === 0 && touched.caches === 0, JSON.stringify(touched));
  check('la phrase est dite par Web Speech', said() === 'Bonjour.', said());
  check("l'état reste « pas encore compté »", ev('voiceOfflineState().cached') === null, state());
  t.noErrors('aucune erreur jsdom ni de la fenêtre');
  synth.end();
  t.installFakes();
}

async function deverrouillage() {
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
}

async function clipJoue() {
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
}

async function sonsEtFile() {
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
}

async function arret() {
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
}

async function surlignage() {
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
}

async function sansClip() {
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
}

(async () => {
  await wait(200);
  await inerteSansClip();
  await inerteSansMp3();
  await deverrouillage();
  await clipJoue();
  await sonsEtFile();
  await arret();
  await surlignage();
  await sansClip();
  t.noErrors('aucune erreur dans la fenêtre');
  t.finish();
})();
