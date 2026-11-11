/* Slice « island » (couche features) : son API publique. Les autres slices
   n'importent que ce fichier (vérifié par test/slices.test.js). */
export {
  checkNewIsland, currentChar, maybeSkyOpening, openDialogue, renderIslandCard, renderLagon,
  renderLevelPill, setCurrentChar, setWorld
} from './island-view.js';
export { ISLE_SCENERY, isleGenericScenery, markHelped } from './island.js';
