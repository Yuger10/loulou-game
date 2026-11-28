// Vérifie les explications des huit mini-jeux saison 3, sans exemptions.
const h = require('./explications/harnais.js');
const { SEASON3_EXPLANATIONS } = require('./explications/saison3-cas.js');
const { ev, check, section } = h;

(async () => {
  await h.boot();
  section('Explications des jeux saison 3');
  for (const [game, question, wrong, expected, glow] of SEASON3_EXPLANATIONS) {
    const got = ev(`explainFor(${JSON.stringify(game)}, ${JSON.stringify(question)}, ${JSON.stringify(wrong)})`);
    check(`${game} : explication attendue`, !!got && got.say === expected);
    if (!got) continue;
    const words = got.say.trim().split(/\s+/).length;
    check(
      `${game} : phrase courte, sans réponse éliminée, repère prévu`,
      words >= 3 && words <= 12 && !('dim' in got.fx) && got.fx.glow === glow,
    );
  }
  h.finish('des explications saison 3');
})();
