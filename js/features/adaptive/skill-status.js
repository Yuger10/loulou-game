/* ---------- L'état d'une compétence (« À l'aise », « À travailler »…) ----------
   Calcul pur, sans dépendance : adaptive.js et skills.js l'utilisent tous les
   deux, depuis ce fichier, pour qu'aucun n'importe l'autre (import/no-cycle). */
const SKILL_STATUS = {
  aise: { label: "À l'aise", cls: 'ok' },
  encours: { label: 'En cours', cls: 'mid' },
  difficile: { label: 'À travailler', cls: 'hard' },
  nouveau: { label: 'Pas assez joué', cls: 'new' },
  jamais: { label: 'Pas encore joué', cls: 'new' },
};

// Au mémo, retourner deux cartes différentes fait partie du jeu : on
// tolère donc plus d'« erreurs » avant de dire que c'est difficile.
/** @type {Record<string, number>} */
const SKILL_ERR_TOLERANCE = { memory: 3 };

/** @typedef {import('../../entities/game-state/index.js').GameState['skills'][string]} SkillRecord */

/**
 * @param {SkillRecord | null | undefined} s
 * @param {string} key
 * @returns {keyof typeof SKILL_STATUS}
 */
function skillStatus(s, key) {
  if (!s || !(s.wins + s.fails)) return 'jamais';
  const r = s.recent || [];
  const last = r.slice(-6);
  if (last.length < 2) return 'nouveau';
  const fails = last.filter((x) => !x.ok).length / last.length;
  const avgErr = last.reduce((a, x) => a + x.e, 0) / last.length / (SKILL_ERR_TOLERANCE[key] || 1);
  if (fails >= 0.34 || avgErr >= 1.5) return 'difficile';
  if (last.length >= 3 && avgErr <= 0.5 && fails === 0) return 'aise';
  return 'encours';
}

export { SKILL_ERR_TOLERANCE, SKILL_STATUS, skillStatus };
