/* ---------- Difficulté selon l'âge (mode course, chacun son tour) ---------- */
// Difficulté adaptée à l'âge : chacun joue à son niveau, la course reste juste.
// Bornes alignées sur les 5 paliers de js/entities/difficulty/difficulty.js (repères scolaires
// GS/CP/CE1/CE2) : voir ANALYSE-DIFFICULTE.md pour le détail académique.
const AGE_DIFF = [
  { max:5,  diff:1, label:'4-5 ans' },
  { max:7,  diff:2, label:'6-7 ans' },
  { max:8,  diff:3, label:'8 ans' },
  { max:9,  diff:4, label:'9 ans' },
  { max:99, diff:5, label:'10 ans et +' },
];

function ageToDiff(age){
  const a = Number(age);
  if(!a) return null;                       // âge non renseigné → difficulté de l'île
  return (AGE_DIFF.find(r=>a<=r.max) || AGE_DIFF[AGE_DIFF.length-1]).diff;
}

function ageLabel(age){
  const a = Number(age);
  if(!a) return 'âge non précisé';
  return `${a} ans`;
}
