// Les clips de la voix sans Internet (track voix-naturelle, phase 2) : le
// téléchargement de fond dans le cache lagon-voix (lignes 25 et 26 de la spec)
// et la carte « Voix » de l'espace parents (lignes 27 et 28).
// Banc : test/tools/voice-bench.js.
const { A, B, C, TABLE, openVoiceBench, tick, wait, waitFor } = require('./tools/voice-bench.js');

const t = openVoiceBench('du cache des clips');
const { check, V, said, fetched, state, fresh, ev, d, w, synth } = t;

const SIX = { ...TABLE, 'Quatre.': 'dddddddddddd', 'Cinq.': 'eeeeeeeeeeee', 'Six.': 'ffffffffffff' };

// la carte « Voix » de l'espace parents, telle qu'elle se lit
async function card() {
  ev('parentUnlockedUntil = Date.now() + 60000; openParentSpace()');
  await wait(20);
  const c = d.querySelector('.ps-voice');
  return c ? c.textContent.replace(/\s+/g, ' ').trim() : null;
}

async function telechargementDeFond() {
  console.log('— Ligne 25 : le téléchargement de fond');
  ev('window.voiceStates = []; on("voice:offline", (s) => window.voiceStates.push(JSON.stringify(s)))');
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
}

async function comptageSeul() {
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
}

async function appareilPlein() {
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
}

async function carteVoix() {
  console.log('— Lignes 27 et 28 : la carte « Voix » de l’espace parents');
  check('sans service (VOICE_SERVICE vide) : aucune carte', (await card()) === null);
  ev("VOICE_SERVICE = 'Microsoft Azure'");
  const text = await card();
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
}

async function carteEtats() {
  let text;
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
}

(async () => {
  await wait(200);
  t.installFakes();
  await telechargementDeFond();
  await comptageSeul();
  await appareilPlein();
  await carteVoix();
  await carteEtats();
  t.noErrors('aucune erreur dans la fenêtre');
  t.finish();
})();
