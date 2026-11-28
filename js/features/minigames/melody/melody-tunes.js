/* Les mélodies de « La mélodie », par palier : des notes du xylophone (0 = do
   grave, 7 = do aigu, `XYLO_NOTES`). De vraies petites mélodies : des pas, des
   sauts, des débuts de comptines (leur nom n'est jamais affiché). */
/** @type {Record<number, number[][]>} */
const MELODIES = {
  // 3 notes sur do, mi, sol
  1: [
    [0, 2, 4],
    [4, 2, 0],
    [0, 0, 4],
    [4, 4, 0],
    [2, 4, 2],
    [0, 2, 0],
    [4, 2, 4],
    [2, 0, 2],
  ],
  // 4 notes, de do à sol
  2: [
    [0, 1, 2, 0], // Frère Jacques
    [2, 3, 4, 4],
    [0, 0, 0, 1], // Au clair de la lune
    [4, 3, 2, 1],
    [0, 2, 4, 2],
    [4, 2, 1, 0],
    [1, 2, 3, 4],
    [2, 2, 1, 0],
  ],
  // 5 notes, de do à sol
  3: [
    [0, 0, 0, 1, 2], // Au clair de la lune
    [0, 1, 2, 3, 4],
    [4, 3, 2, 1, 0],
    [2, 3, 4, 2, 0],
    [4, 4, 2, 2, 0],
    [0, 2, 1, 3, 2],
    [4, 2, 3, 1, 0],
    [0, 1, 2, 0, 0],
  ],
  // 5 notes sur les 8 lames
  4: [
    [0, 2, 4, 5, 4],
    [7, 6, 5, 4, 3],
    [4, 5, 4, 3, 2],
    [0, 4, 7, 4, 0],
    [2, 3, 4, 5, 4],
    [5, 4, 3, 2, 1],
    [7, 4, 2, 0, 0],
    [3, 2, 1, 0, 4],
  ],
  // 6 notes sur les 8 lames
  5: [
    [0, 0, 4, 4, 5, 5], // Ah ! vous dirai-je, maman
    [2, 2, 3, 4, 4, 3], // Ode à la joie
    [0, 1, 2, 3, 4, 5],
    [7, 6, 5, 4, 3, 2],
    [0, 2, 4, 7, 4, 2],
    [4, 3, 2, 2, 1, 0],
    [3, 3, 2, 2, 1, 1],
    [5, 5, 4, 4, 3, 3],
  ],
};

export { MELODIES };
