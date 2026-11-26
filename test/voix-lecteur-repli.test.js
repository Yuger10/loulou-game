// Le lecteur de clips de la voix (track voix-naturelle, phase 2), quand le clip
// ne peut pas jouer : lignes 16, 17, 18, 21 et 22 de la spec. Web Speech prend
// sa place, à sa place dans la file. Banc : test/tools/voice-bench.js.
const { B, TABLE, UNLOCK, openVoiceBench, tick, wait, waitFor } = require('./tools/voice-bench.js');

const t = openVoiceBench('des replis du lecteur de clips');
const { check, speak, V, said, touch, played, audio, fresh, ev, synth } = t;

async function clipIntrouvable() {
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
}

async function clipLent() {
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
}

async function lectureRefusee() {
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
}

async function deverrouillageRefuse() {
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
}

async function relectureLente() {
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
}

async function voixCoupee() {
  console.log('— Ligne 22 : voix coupée, aucun clip');
  fresh();
  touch();
  await tick();
  ev('state.voice = false');
  speak('Bonjour.');
  await tick();
  check('ni chargé ni joué, ni dit', played().length === 0 && said() === '' && audio().played.length === 1, said());
  ev('state.voice = true');
}

async function empreinteHorsForme() {
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
}

(async () => {
  await wait(200);
  t.installFakes();
  await clipIntrouvable();
  await clipLent();
  await lectureRefusee();
  await deverrouillageRefuse();
  await relectureLente();
  await voixCoupee();
  await empreinteHorsForme();
  t.noErrors('aucune erreur dans la fenêtre');
  t.finish();
})();
