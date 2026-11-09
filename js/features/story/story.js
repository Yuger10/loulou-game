/* ---------- Histoire : le Grand Voyage du Lagon Magique (v40) ----------
   Un fil narratif relie les huit îles : à chaque nouvelle île débloquée,
   un ami raconte un petit bout d'histoire (texte très court, lu à voix
   haute, jamais indispensable à lire) puis pose une énigme en images —
   les réponses sont des emojis, jamais un mot à lire. La résoudre offre
   des pièces EN PLUS du coffre du jour (js/entities/game-state/state.js § quêtes), une seule
   fois par île. On peut toujours relire un chapitre déjà vu depuis
   « 📖 Mon histoire » (bouton de l'en-tête).

   Anti-devinette (même principe que js/features/minigame-engine/engine.js) : avec seulement
   2-3 choix et aucune limite de tentative, laisser le bouton fautif se
   réactiver permettrait de deviner PAR ÉLIMINATION. Une mauvaise réponse
   relance donc une AUTRE énigme de la même île (`riddles[]`, au moins 2
   variantes par île), jamais la même à éliminer. La relance est annulable
   (comme `scheduleRetry` / `clearActiveTimer`) pour éviter qu'elle ne
   réapparaisse par-dessus une autre fenêtre déjà ouverte. */

const STORY = {
  lagon: {
    guide: 'sirene',
    title: 'Le murmure du Lagon',
    intro: [
      "Bienvenue, aventurier des mers 🌊",
      "Je suis Marina, la gardienne du Lagon. Une légende raconte un trésor caché loin, par-delà huit îles mystérieuses 🏝️.",
      "Aide chaque ami que tu rencontres, et résous l'énigme de chaque île pour avancer sur la carte !",
    ],
    riddles: [
      { q: "Je nage dans la mer et j'ai une queue de poisson, mais je parle comme toi. Qui suis-je ?",
        opts: [{ e:'🧜‍♀️', ok:true }, { e:'🐬' }, { e:'🦀' }] },
      { q: "Je vis dans la mer, j'ai huit bras et je sais me cacher partout. Qui suis-je ?",
        opts: [{ e:'🐙', ok:true }, { e:'🦞' }, { e:'🐟' }] },
    ],
    success: "Bravo ! Tu gardes précieusement le premier indice du trésor 🗺️",
    reward: 10,
  },
  foret: {
    guide: 'fee',
    title: 'Le secret de la forêt',
    intro: [
      "Chhht… bienvenue dans la forêt enchantée 🌿",
      "Je suis Sylvie, la fée des bois. L'indice de Marina m'a conduit jusqu'à toi !",
      "Résous mon énigme, et je te confierai le deuxième indice du trésor.",
    ],
    riddles: [
      { q: "Je suis tout petit, j'ai des ailes et je fais de la magie dans la forêt. Qui suis-je ?",
        opts: [{ e:'🧚‍♀️', ok:true }, { e:'🦋' }, { e:'🐝' }] },
      { q: "Je pousse sous les arbres, j'ai un chapeau mais pas de tête. Qui suis-je ?",
        opts: [{ e:'🍄', ok:true }, { e:'🌻' }, { e:'🌳' }] },
    ],
    success: "Bravo ! Un deuxième indice du trésor rejoint ta carte 🗺️",
    reward: 12,
  },
  montagne: {
    guide: 'dragonciel',
    title: 'Le souffle de la montagne',
    intro: [
      "Tout là-haut, au-dessus des nuages ☁️",
      "Je suis Zéphyr, le dragon du ciel. Le vent m'a soufflé que tu cherches un trésor…",
      "Si tu résous mon énigme, je t'indique le chemin vers la suite !",
    ],
    riddles: [
      { q: "Je vole très haut dans le ciel, je crache du feu et j'ai des écailles. Qui suis-je ?",
        opts: [{ e:'🐉', ok:true }, { e:'🦅' }, { e:'☁️' }] },
      { q: "Je suis blanc et froid, je tombe doucement du ciel en hiver. Qui suis-je ?",
        opts: [{ e:'❄️', ok:true }, { e:'☀️' }, { e:'🌧️' }] },
    ],
    success: "Bravo ! Le troisième indice brille entre tes mains ✨",
    reward: 14,
  },
  chateau: {
    guide: 'princesse',
    title: 'Le mystère du château',
    intro: [
      "Bienvenue au château des étoiles 👑",
      "Je suis Aurore. Ici se cache un indice précieux, gardé par une énigme royale.",
      "Résous-la, et le château t'ouvrira ses portes vers la suite de l'aventure !",
    ],
    riddles: [
      { q: "Je porte une couronne et j'habite dans un château. Qui suis-je ?",
        opts: [{ e:'👸', ok:true }, { e:'🧙‍♀️' }, { e:'🤖' }] },
      { q: "Je sers à ouvrir toutes les portes et tous les coffres. Qui suis-je ?",
        opts: [{ e:'🔑', ok:true }, { e:'🛡️' }, { e:'🕯️' }] },
    ],
    success: "Bravo ! Le quatrième indice rejoint ta carte au trésor 🗺️",
    reward: 16,
  },
  jungle: {
    guide: 'exploratrice',
    title: 'Le trésor de la jungle',
    intro: [
      "Chhht, écoute les bruits de la jungle 🌴",
      "Je suis Maya, l'exploratrice. On approche du trésor, je le sens !",
      "Résous mon énigme, et je te montre le prochain chemin.",
    ],
    riddles: [
      { q: "Je grimpe aux arbres, je mange des bananes et je fais ouh ouh. Qui suis-je ?",
        opts: [{ e:'🐒', ok:true }, { e:'🐆' }, { e:'🦜' }] },
      { q: "J'ai de grandes plumes colorées et je sais répéter ce que tu dis. Qui suis-je ?",
        opts: [{ e:'🦜', ok:true }, { e:'🦚' }, { e:'🦋' }] },
    ],
    success: "Bravo ! Le cinquième indice est entre tes mains 🗺️",
    reward: 18,
  },
  cite: {
    guide: 'horloger',
    title: "Le secret de l'horloger",
    intro: [
      "Bienvenue dans la Cité du Temps 🕰️",
      "Je suis Horace, l'horloger. Chaque heure compte, et chaque énigme aussi !",
      "Résous celle-ci, et le temps te révélera un nouvel indice.",
    ],
    riddles: [
      { q: "J'ai deux aiguilles et je tourne toute la journée sans jamais m'arrêter. Qui suis-je ?",
        opts: [{ e:'🕰️', ok:true }, { e:'📅' }, { e:'🔔' }] },
      { q: "Le sable coule de haut en bas pour mesurer le temps qui passe. Qui suis-je ?",
        opts: [{ e:'⏳', ok:true }, { e:'🕰️' }, { e:'🔔' }] },
    ],
    success: "Bravo ! Un sixième indice rejoint ta carte au trésor 🗺️",
    reward: 20,
  },
  volcan: {
    guide: 'genie',
    title: 'Le vœu du génie',
    intro: [
      "Le Volcan des Génies t'attend 🌋",
      "Je suis Nova, le génie. Le trésor est presque entre tes mains !",
      "Résous mon énigme, et je t'accorde un vœu !",
    ],
    riddles: [
      { q: "Je sors d'une lampe magique et je peux réaliser trois vœux. Qui suis-je ?",
        opts: [{ e:'🧞‍♂️', ok:true }, { e:'🐉' }, { e:'🔥' }] },
      { q: "Je coule rouge et brûlant du sommet d'une montagne qui explose. Qui suis-je ?",
        opts: [{ e:'🌋', ok:true }, { e:'❄️' }, { e:'☁️' }] },
    ],
    success: "Bravo ! Le septième indice brûle de puissance ✨",
    reward: 22,
  },
  squishy: {
    guide: 'mochichat',
    title: 'Le dernier secret, tout doux',
    intro: [
      "Bienvenue au Pays Squishy, où tout est doux et moelleux 🍡",
      "Je suis Mimi, la chatte mochi. Voici la toute dernière énigme avant le trésor !",
      "Résous-la, et le trésor du Lagon Magique sera enfin à toi !",
    ],
    riddles: [
      { q: "Je n'ai aucun coin, je suis tout rond. Qui suis-je ?",
        opts: [{ e:'⚪', ok:true }, { e:'🔺' }, { e:'🟥' }] },
      { q: "J'ai trois côtés et trois coins pointus. Qui suis-je ?",
        opts: [{ e:'🔺', ok:true }, { e:'🟦' }, { e:'⚪' }] },
    ],
    success: "BRAVO ! Tu as trouvé tous les indices… le trésor du Lagon Magique est à toi ! 🏆✨",
    reward: 25,
  },
};

function storyChapter(world){ return STORY[world] || null; }
function storySolved(world){ return !!(state.storySolved && state.storySolved[world]); }
function storyChaptersCount(){ return Object.keys(STORY).length; }
function storySolvedCount(){ return Object.keys(STORY).filter(storySolved).length; }

// Relance programmée après une mauvaise réponse à une énigme : annulable
// (mêmes raisons que `scheduleRetry` dans js/features/minigame-engine/engine.js et
// `clearActiveTimer` pour le minuteur) — sinon une énigme en retard
// pourrait réapparaître par-dessus une autre fenêtre déjà ouverte.
let storyPendingRetry = null;
function storyClearPendingRetry(){
  if(storyPendingRetry){ clearTimeout(storyPendingRetry); storyPendingRetry = null; }
}
function storyScheduleRetry(fn){
  storyClearPendingRetry();
  storyPendingRetry = setTimeout(()=>{ storyPendingRetry = null; fn(); }, 900);
}

// Ouvre le chapitre d'une île : récit (une ligne à la fois), puis l'énigme
// si elle n'a jamais été résolue. `onDone` est appelée une fois le
// chapitre terminé (lu ou résolu) — utilisée pour enchaîner avec l'écran
// habituel de nouvelle île (js/shared/ui.js `checkNewIsland`).
function openStoryChapter(world, onDone){
  if(!STORY[world]){ if(onDone) onDone(); return; }
  renderStoryIntro(world, 0, onDone);
}

function renderStoryIntro(world, idx, onDone){
  const ch = STORY[world];
  const last = idx >= ch.intro.length - 1;
  const line = ch.intro[idx];
  const already = storySolved(world);
  openModal(`
    <div class="char-header">
      <span class="emoji">${typeof charFace === 'function' ? charFace(ch.guide) : CHARACTERS[ch.guide].emoji}</span>
      <h2>${ch.title}</h2>
    </div>
    ${speechBubble(line)}
    <button class="btn-primary" id="story-next">${last ? (already ? 'Continuer ✨' : "Résoudre l'énigme 🔎") : 'Suite ➡️'}</button>
    ${!last ? `<button class="btn-ghost" id="story-skip">Passer</button>` : ''}
  `);
  bindSpeakButtons();
  speak(line);
  document.getElementById('story-next').onclick = ()=>{
    playSound('tap');
    if(!last){ renderStoryIntro(world, idx + 1, onDone); return; }
    if(already){ closeModal(); if(onDone) onDone(); return; }
    renderStoryRiddle(world, 0, onDone);
  };
  const skip = document.getElementById('story-skip');
  if(skip) skip.onclick = ()=>{ playSound('tap'); renderStoryIntro(world, ch.intro.length - 1, onDone); };
}

function renderStoryRiddle(world, idx, onDone){
  const ch = STORY[world];
  const r = ch.riddles[idx % ch.riddles.length];
  const opts = shuffle(r.opts);
  const say = r.q.replace(/"/g, '&quot;');
  openModal(`
    ${gameHeader('🔎 ' + ch.title, r.q, r.q)}
    <div class="story-options">
      ${opts.map((o, i)=>`<button type="button" class="story-opt" data-i="${i}" aria-label="${o.e}">${o.e}</button>`).join('')}
    </div>
  `);
  bindQuit();
  document.querySelectorAll('.story-opt').forEach((el, i)=>{
    el.onclick = ()=>{
      const o = opts[i];
      if(o.ok){
        storyWin(world, onDone);
      } else {
        playSound('wrong'); vibrate(90); speakWrongHint();
        shakeEl(el);
        el.classList.add('ko-flash');
        el.disabled = true;
        setTimeout(()=> el.classList.remove('ko-flash'), 450);
        // anti-devinette : une AUTRE énigme de l'île remplace celle-ci,
        // jamais les mêmes choix à éliminer un par un.
        storyScheduleRetry(()=> renderStoryRiddle(world, idx + 1, onDone));
      }
    };
  });
}

function storyWin(world, onDone){
  const ch = STORY[world];
  state.storySolved = state.storySolved || {};
  state.storySolved[world] = true;
  save();
  playSound('win'); confetti(); vibrate([60, 40, 120, 40, 160]);
  addCoins(ch.reward);
  speak(`${ch.success} Tu gagnes ${ch.reward} pièces.`);
  openModal(`
    <div class="reward-box win-box">
      <span class="win-rays" aria-hidden="true"></span>
      <span class="big-emoji win-emoji">📖</span>
      <h2>Énigme résolue !</h2>
      <div class="speech">${ch.success}</div>
      <div class="speech" style="display:flex; align-items:center; justify-content:center; gap:10px; background:#FFF9E8;">
        <span data-gain-coins style="font-size:2rem;">🪙</span><span><strong>+${ch.reward} pièces</strong></span>
      </div>
    </div>
    <button class="btn-primary" id="story-continue">Continuer l'aventure ✨</button>
  `);
  document.getElementById('story-continue').onclick = ()=>{ playSound('tap'); closeModal(); if(onDone) onDone(); };
}

// « 📖 Mon histoire » : relire n'importe quel chapitre déjà débloqué.
function openStoryJournal(){
  openModal(`
    ${gameHeader('📖 Mon histoire', 'Le grand voyage du Lagon Magique', 'Le grand voyage du Lagon Magique')}
    <div class="story-journal">
      ${WORLD_ORDER.map((id, i)=>{
        const ch = STORY[id]; if(!ch) return '';
        const unlocked = worldUnlocked(id);
        const solved = storySolved(id);
        const eps = typeof EPISODES!=='undefined' && EPISODES[id] ? EPISODES[id] : [];
        const seen = typeof episodesSeen==='function' ? episodesSeen(id) : 0;
        return `<button type="button" class="story-chap ${solved ? 'done' : ''} ${!unlocked ? 'locked' : ''}" data-world="${id}" ${!unlocked ? 'disabled' : ''}>
          <span class="story-chap-n">${i + 1}</span>
          <span class="story-chap-ico">${!unlocked ? '🔒' : (solved ? '✅' : '📖')}</span>
          <span class="story-chap-title">${unlocked ? ch.title : '???'}</span>
        </button>
        ${unlocked && eps.length ? `<div class="story-eps">${eps.map((ep, k)=> k < seen
          ? `<button type="button" class="story-ep" data-ep="${id}:${k}" aria-label="Épisode ${k+1} : ${ep.title}"><span aria-hidden="true">${ep.find}</span> ${ep.title}</button>`
          : `<span class="story-ep locked" aria-label="Épisode ${k+1} : à venir">🔒 Épisode ${k+1}</span>`).join('')}</div>` : ''}`;
      }).join('')}
    </div>
  `);
  bindQuit();
  document.querySelectorAll('.story-chap').forEach(b=>{
    b.onclick = ()=>{
      playSound('tap'); closeModal();
      setTimeout(()=> openStoryChapter(b.dataset.world), 200);
    };
  });
  document.querySelectorAll('[data-ep]').forEach(b=>{
    b.onclick = ()=>{
      playSound('tap');
      const [w, k] = b.dataset.ep.split(':');
      openEpisode(w, Number(k), 0, false);
    };
  });
}

// relance programmée après une mauvaise réponse à une énigme : annulée dès
// qu'une fenêtre s'ouvre ou se ferme (même précaution anti-fantôme que les
// mini-jeux)
onModalChange(storyClearPendingRetry);
