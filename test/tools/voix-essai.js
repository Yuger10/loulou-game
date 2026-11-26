/* ---------- `bun run voix --essai` : l'essai d'écoute ----------
   (track voix-naturelle, lignes 1 et 2 de la spec, tables E et V)
   Cinq phrases dites par chaque voix candidate, dans un dossier hors du
   dépôt, et la page ecoute.html pour les écouter. Rien n'entre dans le dépôt. */
const fs = require('fs');
const path = require('path');
const { loadToSpoken } = require('./voix-phrases.js');
const { ask, missingVars } = require('./voix-service.js');

// Table E : les 5 phrases de l'essai d'écoute
const ESSAI_PHRASES = [
  "Touche un personnage pour l'aider.",
  'Compte les étoiles, puis touche le bon nombre.',
  'Presque ! Regarde bien et réessaie.',
  "Bravo ! Marina t'offre un coquillage.",
  'Il était une fois, au milieu du lagon, une île qui brillait la nuit.',
];
// Table V : les voix candidates, avec les réglages de voix.json qu'elles donneraient
const ESSAI_VOICES = [
  {
    service: 'azure',
    voice: 'fr-FR-DeniseNeural',
    style: 'cheerful',
    rate: '-8%',
    format: 'audio-24khz-48kbitrate-mono-mp3',
  },
  { service: 'azure', voice: 'fr-FR-EloiseNeural', style: '', rate: '-8%', format: 'audio-24khz-48kbitrate-mono-mp3' },
  {
    service: 'azure',
    voice: 'fr-FR-Vivienne:DragonHDLatestNeural',
    style: '',
    rate: '-8%',
    format: 'audio-24khz-48kbitrate-mono-mp3',
  },
  { service: 'google', voice: 'fr-FR-Chirp3-HD-Aoede', style: '', rate: 0.92, format: 'MP3' },
  { service: 'google', voice: 'fr-FR-Chirp3-HD-Leda', style: '', rate: 0.92, format: 'MP3' },
  { service: 'google', voice: 'fr-FR-Chirp3-HD-Kore', style: '', rate: 0.92, format: 'MP3' },
];

const worst = (codes) => (codes.includes(2) ? 2 : codes.includes(1) ? 1 : 0);
const escapeHtml = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function ecouteHtml(got) {
  const rows = got
    .map(
      (g) =>
        `<tr><td>${escapeHtml(g.service)}</td><td>${escapeHtml(g.voice)}</td><td>${escapeHtml(g.phrase)}</td>` +
        `<td><audio controls preload="none" src="${escapeHtml(g.file)}"></audio></td></tr>`,
    )
    .join('\n');
  return `<!doctype html>
<html lang="fr"><meta charset="utf-8"><title>Essai d'écoute des voix</title>
<style>body{font-family:system-ui,sans-serif;margin:1rem}td{padding:.3rem .6rem;border-bottom:1px solid #ddd}</style>
<h1>Essai d'écoute des voix</h1>
<p>Chaque phrase est dite par chaque voix candidate. La voix choisie s'écrit dans voix/voix.json.</p>
<table>
${rows}
</table>
</html>
`;
}

// les services complets ; un service à moitié posé (une seule de ses deux variables) est signalé
function completeServices(env, log) {
  const complete = [];
  for (const service of ['azure', 'google']) {
    const missing = missingVars(service, env);
    if (!missing.length) complete.push(service);
    else if (missing.length === 1) log(`⚠️ voix : ${service} ignoré, il manque ${missing.join(', ')}`);
  }
  return complete;
}

// Les 5 phrases d'une voix. Rend 0, 1 (voix refusée : elle s'arrête, les autres
// continuent) ou 2 (service injoignable ou clé refusée : le service s'arrête).
async function essaiVoice(line, config, { toSpoken, got }) {
  const { io } = line;
  for (let n = 1; n <= ESSAI_PHRASES.length; n++) {
    const phrase = ESSAI_PHRASES[n - 1];
    // le texte même qui serait généré : ce que Web Speech dit aujourd'hui (ligne 6b)
    const r = await ask(line, config, { text: toSpoken(phrase) });
    if (r.fatal) {
      io.log(`⛔ voix : ${config.service} injoignable ou clé refusée (${r.fatal})`);
      return 2;
    }
    if (r.refused) {
      io.log(`⚠️ voix : voix inconnue : ${config.voice}`);
      return 1;
    }
    const file = `${config.service}-${config.voice.replace(/:/g, '_')}-${n}.mp3`;
    fs.writeFileSync(path.join(io.essaiDir, file), r.ok);
    got.push({ service: config.service, voice: config.voice, phrase, file });
  }
  return 0;
}

async function essai(io) {
  const { env, log, essaiDir } = io;
  const complete = completeServices(env, log);
  if (!complete.length) {
    log(
      "⛔ voix : aucun service complet dans l'environnement (VOIX_AZURE_KEY et VOIX_AZURE_REGION, ou VOIX_GOOGLE_TOKEN et VOIX_GOOGLE_PROJECT), rien n'est généré",
    );
    return 2;
  }
  const toSpoken = await loadToSpoken();
  fs.rmSync(essaiDir, { recursive: true, force: true });
  fs.mkdirSync(essaiDir, { recursive: true });
  const codes = [];
  const got = [];
  for (const service of complete) {
    const line = { io, pace: { sent: false, waited: false } };
    for (const config of ESSAI_VOICES.filter((v) => v.service === service)) {
      const code = await essaiVoice(line, config, { toSpoken, got });
      if (code) codes.push(code);
      if (code === 2) break;
    }
  }
  const page = path.join(essaiDir, 'ecoute.html');
  fs.writeFileSync(page, ecouteHtml(got));
  log(page);
  return worst(codes);
}

module.exports = { essai };
