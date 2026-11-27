/* Les paliers des mini-jeux de l'Île du Grand Concert (saison 3), sur le
   modèle de difficulty-s3.js : un tableau par palier lu par tierValue. Un
   fichier frère, parce que difficulty-s3.js est à la limite de 300 lignes du
   contrôle de qualité (conductor/checklist-ile.md, section « 2 bis »).
   Les essais et l'absence de minuteur restent dans difficulty.js. */
import { tierValue } from './difficulty.js';

const CONCERT_LOW = [0, 1, 2, 3, 4]; // do, ré, mi, fa, sol
const CONCERT_ALL = [0, 1, 2, 3, 4, 5, 6, 7]; // jusqu'au do aigu

/* ---------------------------------------------------------------------
   DO, RÉ, MI (Île du Grand Concert, saison 3) : le nom des notes et leur
   place sur la portée. On associe d'abord une note entendue à sa lame, puis
   on la nomme, puis on la lit (la hauteur se perçoit bien avant le nom).
     palier 1   une note jouée (et un ♪ de sa couleur) : quelle lame ? 3 lames
     palier 2   le nom écrit : quelle lame ? 5 lames
     palier 3   une note colorée sur une portée réduite (3 lignes), 5 lames
     palier 4   une note sans couleur sur la portée de 5 lignes, 8 lames
     palier 5   le nom écrit : laquelle des 5 petites portées ?
   `ask` : la question ; `lames` : les lames montrées ; `targets` : les notes
   possibles ; `staff` : lignes de la portée ; `colors` : note colorée ;
   `choices` : petites portées proposées. Pas de minuteur.
   --------------------------------------------------------------------- */
/** @typedef {{ ask: 'hear' | 'name' | 'read' | 'find', lames: number[], targets: number[], staff?: 3 | 5, colors?: boolean, choices?: number }} NotesRound */
/** @type {Record<number, NotesRound>} */
const NOTES_TIERS = {
  1: { ask: 'hear', lames: [0, 2, 4], targets: [0, 2, 4] },
  2: { ask: 'name', lames: CONCERT_LOW, targets: CONCERT_LOW },
  3: { ask: 'read', lames: CONCERT_LOW, targets: CONCERT_LOW, staff: 3, colors: true },
  4: { ask: 'read', lames: CONCERT_ALL, targets: CONCERT_ALL, staff: 5, colors: false },
  5: { ask: 'find', lames: [], targets: CONCERT_ALL, staff: 5, colors: false, choices: 5 },
};
/** @param {number} dd le palier de difficulté @returns {NotesRound} */
function notesRound(dd) {
  return tierValue(NOTES_TIERS, dd);
}

/* ---------------------------------------------------------------------
   LA MÉLODIE (Île du Grand Concert, saison 3) : rejouer une petite mélodie
   sur le xylophone, d'abord à l'oreille et aux points, puis en la lisant.
     palier 1   3 notes sur 3 lames, les points restent visibles
     palier 2   4 notes sur 5 lames, les points restent visibles
     palier 3   5 notes, les points se cachent après l'écoute
     palier 4   5 notes sur 8 lames, lues sur la portée (notes colorées)
     palier 5   6 notes lues sur la portée, sans couleurs
   `n` : notes de la mélodie ; `show` : points ou portée ; `hide` : cachés
   après l'écoute ; `read` : on lit avant d'entendre (la mélodie n'est jouée
   qu'après la réussite). Pas de minuteur ; essais comme Simon.
   --------------------------------------------------------------------- */
/** @typedef {{ n: number, lames: number[], show: 'dots' | 'staff', hide: boolean, read: boolean, colors: boolean }} MelodyRound */
/** @type {Record<number, MelodyRound>} */
const MELODY_TIERS = {
  1: { n: 3, lames: [0, 2, 4], show: 'dots', hide: false, read: false, colors: true },
  2: { n: 4, lames: CONCERT_LOW, show: 'dots', hide: false, read: false, colors: true },
  3: { n: 5, lames: CONCERT_LOW, show: 'dots', hide: true, read: false, colors: true },
  4: { n: 5, lames: CONCERT_ALL, show: 'staff', hide: false, read: true, colors: true },
  5: { n: 6, lames: CONCERT_ALL, show: 'staff', hide: false, read: true, colors: false },
};
/** @param {number} dd le palier de difficulté @returns {MelodyRound} */
function melodyRound(dd) {
  return tierValue(MELODY_TIERS, dd);
}

export { melodyRound, notesRound };
