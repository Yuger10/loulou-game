/* ---------- Le cache hors ligne des clips de la voix (track voix-naturelle, ADR 0007) ----------
   Téléchargement de fond : 5 s après le chargement (js/shared/ui/voice-player.js),
   les clips absents du cache `lagon-voix` sont téléchargés, 4 à la fois, pour
   que la voix marche sans Internet. Hors ligne ou en économie de données, il
   compte seulement. Si l'appareil refuse d'enregistrer, il s'arrête pour la
   session sans prévenir l'enfant (Web Speech prend le relais) : l'espace
   parents le dit. */
import { emit } from '../lib/index.js';

/** @typedef {{ cached: number | null, total: number, full: boolean, offline: boolean, saveData: boolean }} VoiceOfflineState */

const VOICE_CACHE_NAME = 'lagon-voix'; // le cache du service worker (sw.js), gardé d'une version à l'autre
const VOICE_FILL_BATCH = 4; // clips téléchargés à la fois

/** @type {VoiceOfflineState} */
let voiceOffline = { cached: null, total: 0, full: false, offline: false, saveData: false };

// L'état du cache hors ligne des clips, pour la carte « Voix » de l'espace parents.
/** @returns {VoiceOfflineState} */
function voiceOfflineState() {
  return { ...voiceOffline };
}

// Une nouvelle table de clips : rien n'est encore compté.
/** @param {number} total */
function resetVoiceOffline(total) {
  voiceOffline = { cached: null, total, full: false, offline: false, saveData: false };
}

// le nom de fichier d'une requête du cache des voix
/** @param {string} url */
function clipFileName(url) {
  return url.split('/').pop() || '';
}

// Télécharge un clip et le range : 'stored', 'full' (plus de place), ou
// 'skipped' (réseau coupé ou réponse non 200 : il viendra à une prochaine session).
/**
 * @param {Cache} cache
 * @param {string} h
 * @returns {Promise<'stored' | 'full' | 'skipped'>}
 */
async function storeClip(cache, h) {
  const url = 'voix/' + h + '.mp3';
  let res;
  try {
    res = await fetch(url, { cache: 'no-store' });
  } catch {
    // réseau coupé pour ce clip : il viendra à une prochaine session
    return 'skipped';
  }
  if (res.status !== 200) return 'skipped';
  try {
    // le service worker peut aussi le ranger : un double `put` est sans effet
    await cache.put(url, res);
    return 'stored';
  } catch {
    // plus de place (QuotaExceededError) ou cache refusé
    return 'full';
  }
}

// `alive` rend faux quand la table a changé : la tâche s'arrête sans rien publier.
/**
 * @param {string[]} hashes
 * @param {() => boolean} alive
 */
async function fillVoiceCache(hashes, alive) {
  /** @param {Partial<VoiceOfflineState>} patch */
  const publish = (patch) => {
    if (!alive()) return false;
    voiceOffline = { ...voiceOffline, ...patch };
    emit('voice:offline', voiceOfflineState());
    return true;
  };
  try {
    const cache = await caches.open(VOICE_CACHE_NAME);
    const stored = await cache.keys();
    const names = new Set(stored.map((r) => clipFileName(r.url)));
    const missing = hashes.filter((h) => !names.has(h + '.mp3'));
    let cached = hashes.length - missing.length;
    const connection = /** @type {{ connection?: { saveData?: boolean } }} */ (navigator).connection;
    const offline = navigator.onLine === false;
    const saveData = !!connection && connection.saveData === true;
    if (!publish({ cached, offline, saveData }) || offline || saveData) return;
    for (let i = 0; i < missing.length; i += VOICE_FILL_BATCH) {
      // un lot après l'autre : c'est la limite de 4 téléchargements à la fois
      // oxlint-disable-next-line no-await-in-loop -- les lots se suivent exprès
      const results = await Promise.all(missing.slice(i, i + VOICE_FILL_BATCH).map((h) => storeClip(cache, h)));
      cached += results.filter((r) => r === 'stored').length;
      const full = results.includes('full');
      if (!publish({ cached, full }) || full) return;
    }
    // enfin, les clips d'une ancienne table quittent le cache
    const wanted = new Set(hashes.map((h) => h + '.mp3'));
    await Promise.all(stored.filter((r) => !wanted.has(clipFileName(r.url))).map((r) => cache.delete(r)));
  } catch {
    // cache indisponible (navigation privée) : les clips viennent du réseau, Web Speech en repli
  }
}

export { fillVoiceCache, resetVoiceOffline, voiceOfflineState };
