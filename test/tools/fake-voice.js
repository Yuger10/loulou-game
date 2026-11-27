/* ---------- Faux lecteur de clips pour jsdom (tests de la voix enregistrée) ----------
   jsdom ne lit pas le MP3 (`canPlayType` rend ''), n'a ni `fetch`, ni `caches`,
   ni `URL.createObjectURL`. Ce faux navigateur donne au jeu de quoi jouer des
   clips, et note tout dans window.fakeVoice :
   - `Audio` : chaque élément créé (`audios`), ses `play()` (promesse réglable
     par `playMode` : 'ok', 'reject', 'hang'), `pause()`, `playbackRate`,
     `preservesPitch` (présent si `pitch`) ; le test déclenche lui-même
     `playing`, `ended` et `error` par `audio.fire('ended')` ;
   - `fetch` de voix/*.mp3 (`fetches`), réglé par `clipMode` : 'ok', '404',
     'fail' (réseau), 'slow' (ne répond qu'à `release()`) ;
   - `caches` : le contenu de `lagon-voix` (`store`, par nom de fichier),
     `put` qui lève `putError` s'il est posé, `keys`, `delete`, `match` ;
   - `URL.createObjectURL` et `revokeObjectURL` (`created`, `revoked`) ;
   - `navigator.onLine` (`online`) et `navigator.connection.saveData`.

   Usage : ev(FAKE_VOICE_SRC) dans la fenêtre jsdom, puis
   ev('setVoiceClips({…}, "data:audio/mpeg;base64,AAAA")') pour que le lecteur
   se réveille avec ce faux navigateur. */
const FAKE_VOICE_SRC = `(function(){
  const V = window.fakeVoice = {
    audios: [], fetches: [], created: [], revoked: [],
    playMode: 'ok', canPlay: 'probably', pitch: true,
    clipMode: 'ok', waiting: [],
    store: new Set(), opens: 0, cacheNames: [], puts: [], deletes: [], putError: null,
    online: true, saveData: false,
    release(){ const w = V.waiting; V.waiting = []; w.forEach(go => go()); },
  };
  const name = (req) => String(req && req.url || req).split('/').pop();
  class FakeAudio {
    constructor(){
      V.audios.push(this);
      this.src = ''; this.paused = true; this.playbackRate = 1;
      this.played = []; this.pauses = 0; this.loads = 0; this.listeners = {};
      if (V.pitch) this.preservesPitch = false;
    }
    canPlayType(type){ return type === 'audio/mpeg' ? V.canPlay : ''; }
    addEventListener(type, fn){ (this.listeners[type] = this.listeners[type] || []).push(fn); }
    removeEventListener(type, fn){ this.listeners[type] = (this.listeners[type] || []).filter(f => f !== fn); }
    play(){
      this.played.push(this.src);
      if (V.playMode === 'reject') return Promise.reject(Object.assign(new Error('lecture refusée'), { name: 'NotAllowedError' }));
      this.paused = false;
      return V.playMode === 'hang' ? new Promise(() => {}) : Promise.resolve();
    }
    pause(){ this.pauses++; this.paused = true; }
    removeAttribute(attr){ if (attr === 'src') this.src = ''; }
    load(){ this.loads++; }
    fire(type){ (this.listeners[type] || []).slice().forEach(fn => fn({ type })); }
  }
  window.Audio = FakeAudio;

  const response = (status) => ({ status, ok: status === 200, clone(){ return this; }, blob: async () => ({ size: 3, type: 'audio/mpeg' }) });
  window.fetch = (url, opts) => {
    V.fetches.push({ url: String(url), opts: opts || null });
    if (V.clipMode === 'fail') return Promise.reject(new TypeError('réseau coupé'));
    if (V.clipMode === 'slow') return new Promise(resolve => V.waiting.push(() => resolve(response(200))));
    return Promise.resolve(response(V.clipMode === '404' ? 404 : 200));
  };

  const cache = {
    keys: async () => [...V.store].map(f => ({ url: 'http://localhost/voix/' + f })),
    match: async (req) => (V.store.has(name(req)) ? response(200) : undefined),
    put: async (req) => { if (V.putError) throw V.putError; V.puts.push(name(req)); V.store.add(name(req)); },
    delete: async (req) => { V.deletes.push(name(req)); return V.store.delete(name(req)); },
  };
  window.caches = { open: async (n) => { V.opens++; V.cacheNames.push(n); return cache; } };

  let urls = 0;
  window.URL.createObjectURL = () => { const u = 'blob:clip-' + (++urls); V.created.push(u); return u; };
  window.URL.revokeObjectURL = (u) => { V.revoked.push(u); };

  Object.defineProperty(navigator, 'onLine', { configurable: true, get: () => V.online });
  Object.defineProperty(navigator, 'connection', { configurable: true, get: () => ({ saveData: V.saveData }) });
})()`;

module.exports = { FAKE_VOICE_SRC };
