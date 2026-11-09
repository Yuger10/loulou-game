/* ---------- Bouton son de l'en-tête ---------- */
import { save, state } from '../../entities/game-state/index.js';
import { onProfileRefresh } from '../../entities/player/index.js';
import { playSound, showToast, soundModeLabel, uiIcon } from '../../shared/ui/index.js';
import { updateMusic } from '../music/index.js';

document.getElementById('sound-btn').addEventListener('click', ()=>{
  // cycle : musique (+ sons + voix) → sons + voix → sons seuls → silence → musique…
  if(state.sound && state.voice && state.music){ state.music=false; }
  else if(state.sound && state.voice){ state.voice=false; }
  else if(state.sound){ state.sound=false; }
  else { state.sound=true; state.voice=true; state.music=true; }
  save(); renderSoundBtn();
  if(!state.voice && window.speechSynthesis) speechSynthesis.cancel();
  if(state.sound) playSound('tap');
  showToast(soundModeLabel());
});
function renderSoundBtn(){
  const k = state.sound ? (state.music && state.voice ? 'musique' : state.voice ? 'voix' : 'son') : 'muet';
  const b = document.getElementById('sound-btn');
  b.innerHTML = uiIcon(k);
  b.setAttribute('aria-label', soundModeLabel().replace(/^\S+\s/, ''));
  updateMusic();
}

onProfileRefresh(renderSoundBtn);

export { renderSoundBtn };
