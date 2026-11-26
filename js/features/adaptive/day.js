/* ---------- Le jour d'aujourd'hui (AAAA-MM-JJ) ----------
   Sans dépendance : skills.js et stars.js le lisent tous les deux, depuis ce
   fichier, pour qu'aucun n'importe l'autre (import/no-cycle). */
/** @param {Date} [dArg] le jour, par défaut aujourd'hui */
function todayKey(dArg) {
  const d = dArg || new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export { todayKey };
