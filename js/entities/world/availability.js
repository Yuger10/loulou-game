/* ---------- Quêtes du jour ---------- */
import { CHARACTERS } from '../character/index.js';
import { level } from '../game-state/index.js';
import { CRAFTED, ITEMS } from '../item/index.js';
import { WORLDS } from './worlds.js';

// objets et personnages accessibles selon les mondes débloqués
function availableItems(){
  return Object.keys(ITEMS).filter(k=>{
    const w = ITEMS[k].world || 'lagon';
    return level() >= WORLDS[w].level;
  });
}

function availableChars(){
  return Object.keys(CHARACTERS).filter(k=>{
    const w = CHARACTERS[k].world || 'lagon';
    return level() >= WORLDS[w].level;
  });
}

function availableCrafted(){
  return Object.keys(CRAFTED).filter(k=>{
    const w = CRAFTED[k].world || 'lagon';
    return level() >= WORLDS[w].level;
  });
}

export { availableChars, availableCrafted, availableItems };
