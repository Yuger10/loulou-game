// @shards 4
// Une voix partout (track voix-partout), la garde : chaque écran de
// test/voix-ecrans.js est ouvert, et tout texte visible doit avoir une voix
// (lu à l'ouverture ou écoutable au doigt, lignes 23 à 27 de la spec) ; un
// écran sans scénario, un bouton `disabled` à l'ouverture ou un champ sans
// étiquette font échouer. Les autres lignes de la spec ont leur suite :
// - l'écoute au doigt (lignes 10 à 18) : test/voix-partout-ecoute.test.js ;
// - les raisons des boutons inactifs (ligne 12, table R) : test/voix-partout-raisons.test.js ;
// - ce qui est lu à l'ouverture (lignes 19, 21, 22) : test/voix-partout-ouverture.test.js ;
// - les choix écrits des mini-jeux (ligne 20) : test/voix-partout-choix.test.js.
// VOIX_DEBUG=1 affiche les phrases dites par chaque scénario.
const fs = require('fs');
const path = require('path');
const page = require('./tools/page.js');
const { inShard, shard } = require('./tools/shard.js');
const { SCENARIOS, COVERS } = require('./voix-ecrans.js');
const {
  DEBUG,
  check,
  section,
  wait,
  spoken,
  everSaid,
  w,
  d,
  ev,
  $,
  norm,
  resetScreen,
  start,
  finish,
} = require('./voix-outils.js');
const {
  selectorOf,
  isDisplayNone,
  auditScreen,
  jsFiles,
  inventory,
  missingCovers,
  GATE_KEY,
  CLICK_LISTENERS,
} = require('./voix-garde.js');

(async () => {
  await start();
  if (shard.k === 0) {
    staticTests();
    guardVisibilityTest();
    guardScreenTests();
    guardInventoryTests();
  }
  section('La garde : chaque écran de test/voix-ecrans.js');
  const total = { texts: 0, voiceless: 0 };
  const mine = inShard(SCENARIOS);
  for (const sc of mine) await runScenario(sc, total);
  await resetScreen();
  finish('voix-partout', () => {
    console.log(`voix : ${mine.length} scénarios, ${total.texts} textes, ${total.voiceless} sans voix`);
    clipsLine();
  });
})();

// Un scénario : l'écran s'ouvre, les phrases dites toutes seules sont celles
// attendues (ligne 19), et tout texte visible a une voix (ligne 23).
async function runScenario(sc, total) {
  await resetScreen();
  await sc.open(ev, d, w);
  await wait(70);
  const autoSaid = spoken.slice();
  if (DEBUG) console.log(`   [${sc.name}] ${autoSaid.join(' | ') || '(rien)'}`);
  if (sc.auto) {
    const ok = autoSaid.length === sc.auto.length && sc.auto.every((re, i) => re.test(autoSaid[i]));
    check(
      `${sc.name} : les phrases dites à l'ouverture (ligne 19)`,
      ok,
      `attendu ${sc.auto.map(String).join(' puis ') || 'rien'} ; dit : ${autoSaid.join(' | ') || 'rien'}`,
    );
  } else checkGameAuto(sc, autoSaid);
  const res = auditScreen(sc.name, autoSaid);
  total.texts += res.texts;
  total.voiceless += res.problems.length;
  check(`${sc.name} : tout texte visible a une voix`, res.problems.length === 0, res.problems.join('\n     → '));
  if (sc.close) sc.close(ev, d, w);
}

// si la track voix-naturelle a branché des clips enregistrés : leur couverture
function clipsLine() {
  if (ev('typeof VOICE_CLIPS') === 'undefined') return;
  const clips = ev('VOICE_CLIPS');
  const all = [...new Set(everSaid)];
  const n = all.filter((p) => clips[p]).length;
  console.log(
    `clips : ${n} phrases dites sur ${all.length} ont un clip (${all.length ? Math.round((n * 100) / all.length) : 0} %)`,
  );
}

// Un mini-jeu : la consigne d'abord ; puis, pour la table J, les choix écrits
// dans l'ordre d'affichage (ligne 20) ; rhythm et simon disent leurs signaux de tour.
function checkGameAuto(sc, autoSaid) {
  const hint = $('.puzzle-hint [data-say]');
  const choices = [...d.querySelectorAll('#modal-body [data-voix="choix"][data-say]')].map((c) => norm(c.dataset.say));
  const expected = [norm(hint ? hint.dataset.say : ''), ...choices];
  const got = autoSaid.map(norm);
  const turnSignals = /^(ecoute|ecoute encore|regarde encore|a toi|lis le rythme puis joue le|on recommence)$/;
  const rest = got.slice(expected.length);
  const ok = expected.every((p, i) => got[i] === p) && rest.every((p) => turnSignals.test(p));
  check(
    `${sc.name} : la consigne${choices.length ? ' puis les choix' : ''}, et rien d'autre (ligne 19)`,
    ok,
    `attendu : ${expected.join(' | ')} ; dit : ${got.join(' | ') || 'rien'}`,
  );
}

/* ---------- L'inventaire du code ---------- */
function staticTests() {
  section('La garde : chaque écran a son scénario (ligne 24), liste des écouteurs de clic (ligne 25b)');
  const keys = [],
    anonymous = [],
    clicks = [];
  for (const f of jsFiles()) {
    const inv = inventory(f, fs.readFileSync(path.join(page.root, f), 'utf8'));
    keys.push(...inv.keys);
    anonymous.push(...inv.anonymous);
    clicks.push(...inv.clicks);
  }
  check(
    'aucun openModal dans une fonction anonyme',
    anonymous.length === 0,
    `nomme la fonction qui ouvre cet écran : ${anonymous.join(', ')}`,
  );
  keys.push(...ev('GAME_LIST').map((g) => `game:${g.key}`));
  const missing = missingCovers(keys, COVERS);
  check('chaque écran, vue et jeu a son passage dans la garde', missing.length === 0, missing.join('\n     → '));
  const stale = COVERS.filter((k) => !keys.includes(k));
  check('COVERS ne cite que des écrans qui existent', stale.length === 0, stale.join(', '));
  check(
    "la liste des addEventListener('click' est la liste permise",
    clicks.sort().join('\n') === CLICK_LISTENERS.join('\n'),
    `trouvé :\n${clicks.join('\n')}\nUn handler se pose par setHandler (js/shared/ui/handlers.js) : l'écoute au doigt le reconnaît.`,
  );
  const direct = jsFiles().filter(
    (f) =>
      f !== 'js/shared/ui/voice.js' && fs.readFileSync(path.join(page.root, f), 'utf8').includes('speechSynthesis'),
  );
  check('seul js/shared/ui/voice.js contient speechSynthesis', direct.length === 0, direct.join(', '));
}

/* ---------- La garde se trompe-t-elle ? (S3 : un écran cassé exprès) ---------- */
function guardVisibilityTest() {
  section('La garde échoue sur un écran cassé exprès (S3)');
  const sample = [...d.querySelectorAll('body > *, .view, .view > *, #modal *, nav *')]
    .filter((el) => !/^(script|style)$/i.test(el.tagName))
    .slice(0, 150);
  const differ = sample.filter((el) => isDisplayNone(el) !== (w.getComputedStyle(el).display === 'none'));
  check(
    'la visibilité de la garde dit comme getComputedStyle',
    sample.length > 40 && differ.length === 0,
    differ.map(selectorOf).join(', '),
  );
}
function guardScreenTests() {
  ev('openModal(\'<h2>Un écran</h2><button disabled id="vx-casse">Acheter 3 pièces</button>\')');
  let res = auditScreen('cassé', []);
  check(
    'un bouton disabled avec du texte fait échouer la garde',
    res.problems.length === 1 &&
      res.problems[0].startsWith("Bouton disabled à l'ouverture de « cassé » : « Acheter 3 pièces »"),
    res.problems.join(' | '),
  );
  const b = $('#vx-casse');
  b.disabled = false;
  b.setAttribute('aria-disabled', 'true');
  res = auditScreen('réparé', []);
  check('la garde repasse une fois le bouton en aria-disabled', res.problems.length === 0, res.problems.join(' | '));
  ev('openModal(\'<h2>Un écran</h2><input id="vx-champ" placeholder="Prénom">\')');
  res = auditScreen('cassé', []);
  check(
    'un champ sans étiquette fait échouer la garde',
    res.problems.length === 1 && res.problems[0].startsWith('Champ sans étiquette'),
    res.problems.join(' | '),
  );
  $('#vx-champ').setAttribute('aria-label', 'Prénom');
  check('la garde repasse avec aria-label', auditScreen('réparé', []).problems.length === 0);
  ev(
    'openModal(\'<h2>Un écran</h2><p data-say=""><span data-voix="muet" id="vx-m">secret</span></p><p id="vx-vide2"></p>\')',
  );
  $('#vx-m').removeAttribute('data-voix');
  $('#vx-m').closest('p').setAttribute('data-voix', 'lire');
  check('un mot à lire est une exception de la garde (table X)', auditScreen('lire', []).problems.length === 0);
  ev('closeModal()');
}
function guardInventoryTests() {
  const inv = inventory(
    'js/features/truc/truc.js',
    "function openTruc() { openModal('<p>x</p>'); }\nregisterView('truc', () => {});",
  );
  const missing = missingCovers(inv.keys, COVERS);
  check(
    'un nouvel openModal sans scénario fait échouer la garde',
    missing[0] ===
      'Écran sans passage dans la garde de la voix : js/features/truc/truc.js#openTruc. Ajoute un scénario dans test/voix-ecrans.js.' &&
      missing.length === 2,
    missing.join(' | '),
  );
  check(
    'elle repasse quand le scénario existe',
    missingCovers(inv.keys, [...COVERS, 'js/features/truc/truc.js#openTruc', 'view:truc']).length === 0,
  );
  const anon = inventory(
    'js/x.js',
    "document.getElementById('b').addEventListener('click', () => { openModal('x'); });",
  );
  check(
    'un openModal dans une fonction anonyme et un addEventListener de clic sont repérés',
    anon.anonymous.length === 1 && anon.clicks.join() === 'js/x.js|#b',
    JSON.stringify(anon),
  );
  check(
    'espace parents et sauvegarde sont hors garde, sauf la porte',
    missingCovers(
      ['js/features/parents/parents.js#openParentSpace', 'js/features/backup/backup.js#openBackup', GATE_KEY],
      [],
    ).length === 1,
  );
}
