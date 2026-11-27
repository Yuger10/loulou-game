/* ---------- Le service worker et les clips de la voix ----------
   (track voix-naturelle, lignes 23 et 24 de la spec ; lancé par test/update.test.js)
   La règle de voix/*.mp3 dans sw.js : son texte (écrit par bun run sync), puis
   son comportement, en faisant tourner sw.js avec un faux `caches` et un faux
   réseau. Ces vérifications vivent dans le processus de test/update.test.js :
   elles réécrivent sw.js un instant, comme lui, et deux suites lancées en
   parallèle se marcheraient dessus. */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..', '..');
const SW_FILE = path.join(ROOT, 'sw.js');
const VOICE_BLOCK =
  'const vu = new URL(e.request.url);\n  if(vu.origin===self.location.origin && /\\/voix\\/[0-9a-f]{12}\\.mp3$/.test(vu.pathname)){ e.respondWith(caches.open(VOICE_CACHE).then(c=>c.match(e.request).then(hit=> hit || fetch(e.request).then(res=>{ if(res.status===200) c.put(e.request, res.clone()).catch(()=>{}); return res; })))); return; }';
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const sync = () => execFileSync('node', [path.join(ROOT, 'test', 'tools', 'sync.js')], { stdio: 'pipe' });
const swNow = () => fs.readFileSync(SW_FILE, 'utf8');

// le texte de sw.js
function textChecks({ check, SW, V }) {
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
}

// bun run sync réécrit ces trois morceaux à l'identique, et un second passage ne change aucun octet
function syncChecks({ check, SW }) {
  try {
    const bare = SW.replace("const VOICE_CACHE = 'lagon-voix';\n", '')
      .replace(/ {2}\/\* voix: début[\s\S]*?\/\* voix: fin \*\/\n/, '')
      .replace('k!==CACHE&&k!==VOICE_CACHE', 'k!==CACHE');
    fs.writeFileSync(SW_FILE, bare);
    sync();
    check('bun run sync pose la règle des voix dans un sw.js qui ne les a pas', bare !== SW && swNow() === SW);
    fs.writeFileSync(SW_FILE, SW.replace(VOICE_BLOCK, 'ancien bloc;'));
    sync();
    check('il remplace le bloc entre les marqueurs', swNow() === SW);
    sync();
    check('un second passage ne change aucun octet', swNow() === SW);
  } finally {
    fs.writeFileSync(SW_FILE, SW);
  }
}

// un faux `caches` : chaque cache est une Map(url → réponse), rangée par son nom
function fakeCaches() {
  const stores = new Map();
  const deleted = [];
  const cacheOf = (name) => {
    if (!stores.has(name)) stores.set(name, new Map());
    const m = stores.get(name);
    return {
      match: async (req) => m.get(req.url),
      put: async (req, res) => void m.set(req.url, res),
      addAll: async () => {},
    };
  };
  const caches = {
    open: async (name) => cacheOf(name),
    keys: async () => [...stores.keys()],
    delete: async (name) => {
      deleted.push(name);
      stores.delete(name);
    },
    match: async () => undefined,
  };
  return { stores, deleted, cacheOf, caches };
}

// sw.js tourne dans un bac à sable : `ask(url)` lui envoie une requête, `sb.status` règle le faux réseau
function bootServiceWorker(SW) {
  const sb = { ...fakeCaches(), network: [], handlers: {}, status: 200 };
  const response = (url) => ({ status: sb.status, url, clone: () => ({ status: sb.status, url, copy: true }) });
  const sandbox = {
    self: {
      addEventListener: (type, fn) => (sb.handlers[type] = fn),
      location: { origin: 'https://exemple.test' },
      skipWaiting() {},
      clients: { claim() {} },
    },
    caches: sb.caches,
    fetch: async (req) => {
      sb.network.push(req.url);
      return response(req.url);
    },
    URL,
    Request: function (req) {
      return req;
    },
    Promise,
  };
  vm.runInNewContext(SW, sandbox);
  sb.ask = async (url) => {
    let answer;
    sb.handlers.fetch({ request: { method: 'GET', url, mode: 'cors' }, respondWith: (p) => (answer = p) });
    const res = await answer;
    await wait(5);
    return res;
  };
  return sb;
}

// ligne 23 : cache d'abord, dans lagon-voix
async function cacheChecks({ check, V }, sb) {
  const { stores, network, ask } = sb;
  // sous le sous-chemin de GitHub Pages
  const clip = 'https://exemple.test/loulou-game/voix/0123456789ab.mp3';
  await ask(clip);
  check('un clip absent du cache vient du réseau', network.join() === clip, network.join());
  const game = stores.get('lagon-v' + V) || new Map();
  check(
    'la réponse 200 est rangée dans lagon-voix, pas dans le cache du jeu',
    !!stores.get('lagon-voix') && stores.get('lagon-voix').has(clip) && !game.has(clip),
  );
  await ask(clip);
  check('ensuite le cache répond sans réseau (cache d’abord)', network.length === 1, network.join());
  sb.status = 404;
  const missing = 'https://exemple.test/loulou-game/voix/ffffffffffff.mp3';
  const res404 = await ask(missing);
  const voices = stores.get('lagon-voix') || new Map();
  check("une réponse non 200 est rendue mais n'est pas rangée", res404.status === 404 && !voices.has(missing));
  sb.status = 200;
  await ask('https://ailleurs.test/voix/0123456789ab.mp3');
  check(
    "un clip d'une autre origine ne passe pas par lagon-voix",
    !voices.has('https://ailleurs.test/voix/0123456789ab.mp3'),
  );
  await ask('https://exemple.test/loulou-game/voix/voix.json');
  check('seuls les noms <12 hex>.mp3 passent par lagon-voix', voices.size === 1, voices.size);
}

// ligne 24 : une nouvelle version s'active, les anciens caches du jeu partent, lagon-voix reste
async function activateChecks({ check, V }, sb) {
  const { stores, deleted, cacheOf, handlers } = sb;
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

// `t` : { check, section, SW (le texte de sw.js), V (la version affichée) }
async function voiceCacheChecks(t) {
  t.section('Le service worker et les clips de la voix');
  textChecks(t);
  syncChecks(t);
  const sb = bootServiceWorker(t.SW);
  await cacheChecks(t, sb);
  await activateChecks(t, sb);
}

module.exports = { voiceCacheChecks };
