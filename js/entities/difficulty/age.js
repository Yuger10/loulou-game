/* ---------- Difficulté selon l'âge (mode course, chacun son tour) ---------- */
// Difficulté adaptée à l'âge : chacun joue à son niveau, la course reste juste.
// Bornes alignées sur les 5 paliers de js/entities/difficulty/difficulty.js (repères scolaires
// GS/CP/CE1/CE2) : voir ANALYSE-DIFFICULTE.md pour le détail académique.
const AGE_DIFF = [
  { max: 5, diff: 1, label: '4-5 ans' },
  { max: 7, diff: 2, label: '6-7 ans' },
  { max: 8, diff: 3, label: '8 ans' },
  { max: 9, diff: 4, label: '9 ans' },
  { max: 99, diff: 5, label: '10 ans et +' },
];

/** @param {unknown} age un nombre, une chaîne ou rien (âge non renseigné) : lu par Number */
function ageToDiff(age) {
  const a = Number(age);
  if (!a) return null; // âge non renseigné → difficulté de l'île
  return (AGE_DIFF.find((r) => a <= r.max) || AGE_DIFF[AGE_DIFF.length - 1]).diff;
}

/** @param {unknown} age un nombre, une chaîne ou rien (âge non renseigné) : lu par Number */
function ageLabel(age) {
  const a = Number(age);
  if (!a) return 'âge non précisé';
  return `${a} ans`;
}

/* ---------- La classe du profil (track aller-plus-loin) ----------
   Un adulte peut dire la classe de l'enfant dans l'espace parents : elle remplace
   alors l'âge comme plafond de palier. Chaque classe vaut le palier dont le repère
   scolaire est la classe elle-même ; les paliers « de fin d'année » (3 : fin CP,
   5 : fin CE1) s'atteignent par le défi étoile de la classe d'en dessous. */
/** @typedef {{ id: string, label: string, diff: number }} Grade */
/** @type {Grade[]} */
const GRADES = [
  { id: 'GS', label: 'GS', diff: 1 },
  { id: 'CP', label: 'CP', diff: 2 },
  { id: 'CE1', label: 'CE1', diff: 4 },
  { id: 'CE2', label: 'CE2', diff: 5 },
];

/**
 * @param {unknown} grade l'id d'une classe, ou '' (« selon l'âge »)
 * @returns {number | null} le palier de la classe, null sans classe connue
 */
function gradeToDiff(grade) {
  const g = GRADES.find((x) => x.id === grade);
  return g ? g.diff : null;
}

// Le plafond de palier d'un enfant : sa classe (choisie par un adulte) prime,
// sinon son âge ; null si aucun des deux n'est connu (la difficulté suit l'île).
/**
 * @param {{ age?: number | null, grade?: string } | null | undefined} p
 * @returns {number | null}
 */
function playerCap(p) {
  if (!p) return null;
  return gradeToDiff(p.grade) || ageToDiff(p.age) || null;
}

export { ageLabel, ageToDiff, GRADES, gradeToDiff, playerCap };
