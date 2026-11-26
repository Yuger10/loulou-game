// La version du jeu et le bouton « Chercher une mise à jour » (v66) :
// - un seul numéro (js/shared/lib/version.js), écrit par bun run sync dans le
//   cache du service worker (sw.js : lagon-vNN) ;
// - le service worker ne mélange jamais anciens et nouveaux fichiers ;
// - dans l'espace parents : la version, et le bouton qui répond dans chaque cas
//   (pas d'Internet, site muet, rien de neuf, nouvelle version, déjà installée) ;
// - après le redémarrage, « Le jeu est à jour : version N » sur l'écran titre.
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { JSDOM, VirtualConsole } = require('jsdom');
const page = require('./tools/page.js');

let failed = 0,
  passed = 0;
function check(name, cond, detail) {
  if (cond) {
    passed++;
    console.log('✅ ' + name);
  } else {
    failed++;
    console.log('❌ ' + name + (detail ? `\n     → ${detail}` : ''));
  }
}
function section(name) {
  console.log('— ' + name);
}
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
async function waitFor(cond, ms = 3000) {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) {
    if (cond()) return true;
    await wait(20);
  }
  return !!cond();
}
const file = (f) => path.join(page.root, f);

/* ---------- un seul numéro de version ---------- */
section('La version du jeu');
// V : la version affichée (66, ou 66.1 pour une livraison sans track)
const { major: MAJOR, patch: PATCH, label: V } = require('./tools/version.js').readVersion();
// la version d'avant : 66 avant 66.1, 65 avant 66
const PREV = PATCH > 0 ? String(MAJOR) : String(MAJOR - 1);
const SW = fs.readFileSync(file('sw.js'), 'utf8');
check('js/shared/lib/version.js donne un numéro de version', MAJOR > 0, V);
check(
  'le cache du service worker porte ce numéro (lagon-v66, lagon-v66.1)',
  SW.includes(`const CACHE = 'lagon-v${V}';`),
  (/const CACHE = '([^']+)'/.exec(SW) || [])[1],
);
// bun run sync réécrit le nom du cache à partir de la version
try {
  fs.writeFileSync(file('sw.js'), SW.replace(/const CACHE = 'lagon-v[\d.]+';/, "const CACHE = 'lagon-v1';"));
  execFileSync('node', [file('test/tools/sync.js')], { stdio: 'pipe' });
  check('bun run sync écrit la version dans le cache de sw.js', fs.readFileSync(file('sw.js'), 'utf8') === SW);
} finally {
  fs.writeFileSync(file('sw.js'), SW);
}
check(
  "le service worker prend ses fichiers sur le site, pas dans le cache HTTP (cache:'reload')",
  /addAll\(FILES\.map\(f=> new Request\(f, \{ cache:'reload' \}\)\)\)/.test(SW),
);
check(
  'il redemande au site si les fichiers du jeu ont changé (no-cache), pas les pages ni les polices',
  /mode !== 'navigate' && new URL\(e\.request\.url\)\.origin === self\.location\.origin/.test(SW) &&
    /new Request\(e\.request, \{ cache:'no-cache' \}\)/.test(SW),
);
check('sans réseau, il répond toujours avec le cache', /\.catch\(\(\)=>caches\.match\(e\.request\)\)/.test(SW));

/* ---------- les clips de la voix (track voix-naturelle, lignes 23 et 24) ---------- */
// La règle de voix/*.mp3 dans sw.js : son texte (écrit par bun run sync), puis
// son comportement, en faisant tourner sw.js avec un faux `caches` et un faux réseau.
const VOICE_BLOCK =
  'const vu = new URL(e.request.url);\n  if(vu.origin===self.location.origin && /\\/voix\\/[0-9a-f]{12}\\.mp3$/.test(vu.pathname)){ e.respondWith(caches.open(VOICE_CACHE).then(c=>c.match(e.request).then(hit=> hit || fetch(e.request).then(res=>{ if(res.status===200) c.put(e.request, res.clone()).catch(()=>{}); return res; })))); return; }';
async function voiceCacheChecks() {
  section('Le service worker et les clips de la voix');
  check(
    "le cache des voix s'appelle lagon-voix",
    SW.includes("const CACHE = 'lagon-v" + V + "';\nconst VOICE_CACHE = 'lagon-voix';"),
  );
  check(
    'la règle voix/*.mp3 est entre ses marqueurs, avant la règle générale',
    SW.includes(
      "  if(e.request.method!=='GET') return;\n  /* voix: début (écrit par test/tools/sync.js) */\n  " +
        VOICE_BLOCK +
        '\n  /* voix: fin */\n',
    ) && SW.indexOf('/* voix: fin */') < SW.indexOf('const ours ='),
  );
  check('activate garde lagon-voix', SW.includes('keys.filter(k=>k!==CACHE&&k!==VOICE_CACHE)'));
  // bun run sync réécrit ces trois morceaux à l'identique, et un second passage ne change aucun octet
  try {
    const bare = SW.replace("const VOICE_CACHE = 'lagon-voix';\n", '')
      .replace(/ {2}\/\* voix: début[\s\S]*?\/\* voix: fin \*\/\n/, '')
      .replace('k!==CACHE&&k!==VOICE_CACHE', 'k!==CACHE');
    fs.writeFileSync(file('sw.js'), bare);
    execFileSync('node', [file('test/tools/sync.js')], { stdio: 'pipe' });
    check(
      'bun run sync pose la règle des voix dans un sw.js qui ne les a pas',
      bare !== SW && fs.readFileSync(file('sw.js'), 'utf8') === SW,
    );
    fs.writeFileSync(file('sw.js'), SW.replace(VOICE_BLOCK, 'ancien bloc;'));
    execFileSync('node', [file('test/tools/sync.js')], { stdio: 'pipe' });
    check('il remplace le bloc entre les marqueurs', fs.readFileSync(file('sw.js'), 'utf8') === SW);
    execFileSync('node', [file('test/tools/sync.js')], { stdio: 'pipe' });
    check('un second passage ne change aucun octet', fs.readFileSync(file('sw.js'), 'utf8') === SW);
  } finally {
    fs.writeFileSync(file('sw.js'), SW);
  }

  // le comportement : sw.js tourne dans un bac à sable
  const stores = new Map(); // nom du cache → Map(url → réponse)
  const deleted = [];
  const network = [];
  let status = 200;
  const response = (url) => ({ status, url, clone: () => ({ status, url, copy: true }) });
  const cacheOf = (name) => {
    if (!stores.has(name)) stores.set(name, new Map());
    const m = stores.get(name);
    return {
      match: async (req) => m.get(req.url),
      put: async (req, res) => void m.set(req.url, res),
      addAll: async () => {},
    };
  };
  const handlers = {};
  const sandbox = {
    self: {
      addEventListener: (type, fn) => (handlers[type] = fn),
      location: { origin: 'https://exemple.test' },
      skipWaiting() {},
      clients: { claim() {} },
    },
    caches: {
      open: async (name) => cacheOf(name),
      keys: async () => [...stores.keys()],
      delete: async (name) => {
        deleted.push(name);
        stores.delete(name);
      },
      match: async () => undefined,
    },
    fetch: async (req) => {
      network.push(req.url);
      return response(req.url);
    },
    URL,
    Request: function (req) {
      return req;
    },
    Promise,
  };
  require('vm').runInNewContext(SW, sandbox);
  const ask = async (url) => {
    let answer;
    handlers.fetch({ request: { method: 'GET', url, mode: 'cors' }, respondWith: (p) => (answer = p) });
    const res = await answer;
    await wait(5);
    return res;
  };
  // sous le sous-chemin de GitHub Pages
  const clip = 'https://exemple.test/loulou-game/voix/0123456789ab.mp3';
  await ask(clip);
  check('un clip absent du cache vient du réseau', network.join() === clip, network.join());
  check(
    'la réponse 200 est rangée dans lagon-voix, pas dans le cache du jeu',
    !!stores.get('lagon-voix') &&
      stores.get('lagon-voix').has(clip) &&
      !(stores.get('lagon-v' + V) || new Map()).has(clip),
  );
  await ask(clip);
  check('ensuite le cache répond sans réseau (cache d’abord)', network.length === 1, network.join());
  status = 404;
  const missing = 'https://exemple.test/loulou-game/voix/ffffffffffff.mp3';
  const res404 = await ask(missing);
  const voices = stores.get('lagon-voix') || new Map();
  check("une réponse non 200 est rendue mais n'est pas rangée", res404.status === 404 && !voices.has(missing));
  status = 200;
  await ask('https://ailleurs.test/voix/0123456789ab.mp3');
  check(
    "un clip d'une autre origine ne passe pas par lagon-voix",
    !voices.has('https://ailleurs.test/voix/0123456789ab.mp3'),
  );
  await ask('https://exemple.test/loulou-game/voix/voix.json');
  check('seuls les noms <12 hex>.mp3 passent par lagon-voix', voices.size === 1, voices.size);
  // une nouvelle version s'active : les anciens caches du jeu partent, lagon-voix reste
  cacheOf('lagon-v1');
  cacheOf('lagon-v' + V);
  cacheOf('lagon-voix');
  let done;
  handlers.activate({ waitUntil: (p) => (done = p) });
  await done;
  check(
    'activate supprime les anciens caches lagon-v… et garde lagon-voix',
    deleted.join() === 'lagon-v1' && stores.has('lagon-voix') && stores.has('lagon-v' + V),
    deleted.join(),
  );
}
/* ---------- le jeu ---------- */
const html = page.buildHtml();
function openGame(flag) {
  const jsdomErrors = [];
  const vc = new VirtualConsole();
  vc.on('jsdomError', (e) => jsdomErrors.push(String(e && e.message)));
  const dom = new JSDOM(html, {
    runScripts: 'dangerously',
    pretendToBeVisual: true,
    url: 'http://localhost/?saison=aucune',
    virtualConsole: vc,
    beforeParse(win) {
      win.SpeechSynthesisUtterance = function (text) {
        this.text = text;
      };
      win.speechSynthesis = { speaking: false, cancel() {}, getVoices: () => [], speak() {} };
      if (flag !== undefined) win.sessionStorage.setItem('lagon-update-from', String(flag));
    },
  });
  return { w: dom.window, d: dom.window.document, jsdomErrors };
}

(async () => {
  await voiceCacheChecks();
  const { w, d, jsdomErrors } = openGame();
  const ev = (code) => w.eval(code);
  await wait(150);
  check('le jeu connaît sa version', ev('APP_LABEL') === V);
  check(
    'les versions se comparent dans le bon ordre : 66 < 66.1 < 66.2 < 66.10 < 67',
    ev("['66', '66.1', '66.2', '66.10', '67'].map(versionBuild).every((b, i, a) => i === 0 || b > a[i - 1])") &&
      ev("versionBuild('lagon-v66.1') === versionBuild('66.1')"),
  );

  section("L'espace parents");
  ev('parentUnlockedUntil = Date.now() + 60000; openParentSpace()');
  await wait(20);
  const btn = () => d.getElementById('ps-update'),
    msg = () => d.getElementById('ps-update-msg');
  check(
    `la carte « Version du jeu » affiche la version ${V}`,
    !!d.querySelector('.ps-update') &&
      d.getElementById('ps-version').textContent === String(V) &&
      /Version du jeu/.test(d.querySelector('.ps-update h3').textContent),
  );
  check(
    'avec le bouton « Chercher une mise à jour », sous les réglages et avant la zone sensible',
    !!btn() && /Chercher une mise à jour/.test(btn().textContent) && !!d.querySelector('.ps-update + .ps-danger'),
  );
  check(
    "le message se lit à voix haute par les lecteurs d'écran (role=status)",
    msg().getAttribute('role') === 'status',
  );

  // un faux service worker, pour chaque cas
  let offline = false,
    reg = null,
    posted = [];
  Object.defineProperty(w.navigator, 'onLine', { configurable: true, get: () => !offline });
  Object.defineProperty(w.navigator, 'serviceWorker', {
    configurable: true,
    value: { getRegistration: async () => reg },
  });
  const flag = () => w.sessionStorage.getItem('lagon-update-from');
  const press = async () => {
    btn().click();
    await waitFor(() => msg().dataset.status);
    await wait(10);
    return msg().dataset.status;
  };
  const reopen = async () => {
    ev('openParentSpace()');
    await wait(20);
  };

  offline = true;
  check(
    "pas d'Internet : « le jeu se mettra à jour à la prochaine connexion »",
    (await press()) === 'offline' && /Pas d'Internet/.test(msg().textContent) && !btn().disabled && flag() === null,
  );

  offline = false;
  await reopen();
  reg = { installing: null, waiting: null, update: async () => {} };
  check(
    `rien de neuf : « Le jeu est à jour (version ${V}) », le bouton reste utilisable`,
    (await press()) === 'uptodate' && msg().textContent.includes(`version ${V}`) && !btn().disabled && flag() === null,
  );

  await reopen();
  reg = {
    installing: null,
    waiting: null,
    update: async () => {
      throw new Error('réseau');
    },
  };
  check(
    'le site ne répond pas : un message pour réessayer',
    (await press()) === 'error' && /réessayez/.test(msg().textContent) && !btn().disabled,
  );

  await reopen();
  reg = {
    installing: null,
    waiting: null,
    update: async function () {
      this.installing = { state: 'installing' };
    },
  };
  check(
    'nouvelle version : « Le jeu redémarre dans quelques secondes », le bouton se bloque',
    (await press()) === 'found' && /redémarre/.test(msg().textContent) && btn().disabled,
  );
  check("la version d'avant est notée pour l'annoncer après le redémarrage", flag() === String(V));
  w.sessionStorage.removeItem('lagon-update-from');

  await reopen();
  reg = { installing: null, waiting: { postMessage: (m) => posted.push(m) }, update: async () => {} };
  check(
    'une nouvelle version déjà téléchargée qui attend : on lui dit de prendre la main',
    (await press()) === 'found' && posted.includes('skipWaiting'),
  );
  w.sessionStorage.removeItem('lagon-update-from');

  await reopen();
  reg = { installing: null, waiting: null, update: async () => {} };
  w.caches = { keys: async () => ['lagon-v' + (MAJOR + 1)] };
  check(
    'une version plus récente est déjà installée : le jeu redémarre pour la prendre',
    (await press()) === 'reload' && flag() === String(V),
  );
  check(
    '… et redémarre vraiment (rechargement de la page)',
    await waitFor(() => jsdomErrors.some((m) => /navigation/i.test(m)), 2500),
    jsdomErrors.join(' | '),
  );
  delete w.caches;

  section('Après le redémarrage');
  const note = (g) => g.d.getElementById('splash-note');
  const after = openGame(PREV);
  await wait(300);
  check(
    `sur l'écran titre : « Le jeu est à jour : version ${V} »`,
    after.d.getElementById('splash').classList.contains('show') &&
      !note(after).hidden &&
      note(after).textContent.includes(`Le jeu est à jour : version ${V}`),
    note(after).textContent,
  );
  check("il ne s'affiche qu'une fois", after.w.sessionStorage.getItem('lagon-update-from') === null);
  after.d.getElementById('btn-splash-play').click();
  await wait(50);
  check("il part avec l'écran titre (« Jouer »)", note(after).hidden);
  const same = openGame(V);
  await wait(300);
  check(
    `même version (rien n'a changé) : « Le jeu est à jour (version ${V}) »`,
    !note(same).hidden && note(same).textContent.includes(`(version ${V})`),
  );
  const none = openGame();
  await wait(300);
  check("un démarrage normal n'affiche rien", note(none).hidden && !note(none).textContent);

  console.log(
    failed
      ? `\n${failed} test(s) de la mise à jour en échec`
      : `\nTous les tests de la mise à jour passent (${passed})`,
  );
  process.exit(failed ? 1 : 0);
})();
