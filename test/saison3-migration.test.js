// La saison 3 sur une partie existante (track saison3-ouverture, lignes 18 à
// 21) : migration depuis la version précédente, ouverture due au lancement,
// plusieurs ouvertures dues. Harnais et île d'essai : test/tools/saison3.js.
const t = require('./tools/saison3.js');
const { d, ev, json, check, section, modalOpen, shown, click, wait } = t;

// une partie de la version d'avant la saison 3 (9 : la version 10 a ajouté `expeditionIntroSeen`),
// au niveau 75, les îles d'avant visitées. Écrite en dur : depuis la version 11 (Grand Concert),
// « la version précédente » n'est plus celle-là.
function oldSave() {
  return {
    // v9 précède l'ouverture de la saison 3, indépendamment des migrations
    // ajoutées ensuite par les autres tracks.
    v: 9,
    name: 'Lou',
    coins: 12,
    missions: 370,
    inventory: { coquillage: 3 },
    storySolved: { lagon: true, foret: true },
    skyIntroSeen: true,
    visited: ev('WORLD_ORDER.filter((id) => WORLDS[id].level <= 75 && id !== "essai3")'),
    squishies: {
      owned: { donut: 2 },
      boxes: ['capy'],
      shelf: Array(12).fill(null),
      dry: 0,
      done: {},
      fromStory: { lagon: true, foret: true },
      day: null,
      sorted: 3,
      hello: true,
      treasures: [],
    },
  };
}

function migration() {
  const old = oldSave();
  const m = ev(`migrate(${json(old)})`);
  check("ligne 18 : migration depuis la version précédente, rien n'est perdu", () => [
    m.v === ev('SAVE_VERSION'),
    m.expeditionIntroSeen === false,
    m.coins === 12,
    m.missions === 370,
    m.inventory.coquillage === 3,
    m.squishies.owned.donut === 2,
    m.squishies.crates.length === 3,
    m.squishies.sorted === 3,
    json(m.visited) === json(old.visited),
  ]);
  check('une partie neuve : ouverture pas encore montrée', ev('freshState().expeditionIntroSeen') === false);
  ev(`closeModal(); localStorage.setItem(currentSaveKey(), ${json(json(old))}); load(); refreshAll()`);
  check("ligne 19 : une partie déjà au niveau 75, l'expédition s'ouvre au lancement", () => [
    ev('level()') === 75,
    ev('state.expeditionIntroSeen') === false,
    ev('maybeSeasonOpening()') === true,
    shown('.expedition-open'),
  ]);
}

async function ouverturesDues() {
  ev(`closeModal(); state.missions = 370; state.skyIntroSeen = false; state.expeditionIntroSeen = false;
      state.visited = worldsOf(1).slice(); save()`);
  check("ligne 20 : deux ouvertures dues, seule celle de la saison la plus haute s'affiche", () => [
    ev('maybeSeasonOpening()') === true,
    shown('.expedition-open'),
    !d.querySelector('.sky-open'),
  ]);
  check('ligne 20 : les deux drapeaux sont posés', () => [
    ev('state.skyIntroSeen') === true,
    ev('state.expeditionIntroSeen') === true,
  ]);
  ev(
    `closeModal(); state.missions = 370; state.skyIntroSeen = true; state.expeditionIntroSeen = false; ${t.VISIT_ALL} save()`,
  );
  check("ligne 21 : sans île nouvelle, l'ouverture s'affiche quand même", () => [
    ev('state.visited.includes("essai3")'),
    ev('maybeSeasonOpening()') === true,
    shown('.expedition-open'),
  ]);
  click(d.getElementById('expedition-go'));
  check('ligne 21 : puis le prologue', shown('.story-zapmap svg.zap-map'));
  for (let k = 0; k < 3 && d.getElementById('story-next'); k++) d.getElementById('story-next').click();
  await wait(60);
  check('ligne 21 : il se ferme sur « En route ! ✈️ », sans autre écran', !modalOpen());
  check('… et ne revient pas', () => [ev('maybeSeasonOpening()') === false, !modalOpen()]);
}

(async () => {
  await t.start();
  section('Partie existante, migration, plusieurs ouvertures dues (lignes 18 à 21)');
  t.setIslands(true);
  migration();
  await ouverturesDues();
  t.restoreIslands();
  await t.finish('la saison 3 (partie existante)');
})();
