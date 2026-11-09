/* ---------- Mini-jeu : Les petits mots magiques (déterminants, CP-CE1) ----------
   Choisir le bon déterminant devant un nom, selon son genre ET son nombre.
   Programme CP/CE1 français :
   - article défini   : le (masc. sing.) / la (fém. sing.) / les (pluriel)
   - article indéfini : un (masc. sing.) / une (fém. sing.) / des (pluriel)
   Plus le palier est élevé, moins il y a d'indice image, et plus le
   pluriel (plus difficile à repérer) apparaît souvent — voir
   js/entities/difficulty/difficulty.js (determinantsImageShown/PluralChance/ExtraDistractor). */

const DET_FAMILIES = {
  defini:   { m:'le',  f:'la',  p:'les' },
  indefini: { m:'un',  f:'une', p:'des' },
};

function renderDeterminants(){
  setupLives('determinants');
  const dd = gameDiff();
  const family = Math.random() < 0.5 ? 'defini' : 'indefini';
  const dets = DET_FAMILIES[family];
  const noun = pickRandom(WORDS_CP);
  const plural = Math.random() < determinantsPluralChance(dd);
  const shown = plural ? noun.plural : noun.word;
  const answer = dets[plural ? 'p' : noun.gender];

  // les 3 déterminants de la même famille, toujours tous proposés
  let options = [dets.m, dets.f, dets.p];
  // paliers élevés : un intrus de l'autre famille, pour forcer à vraiment lire
  if(determinantsExtraDistractor(dd)){
    const otherFamily = DET_FAMILIES[family==='defini' ? 'indefini' : 'defini'];
    options.push(otherFamily[plural ? 'p' : noun.gender]);
  }
  options = shuffle([...new Set(options)]);

  const showImage = determinantsImageShown(dd);
  const title = family==='defini' ? '🔤 "le", "la" ou "les" ?' : '🔤 "un", "une" ou "des" ?';

  openModal(`
    ${gameHeader(title, `Quel petit mot va avec « ${shown} » ?`, `Quel petit mot va avec le mot ${shown} ?`)}
    ${livesBar()}
    <div class="det-box">
      ${showImage ? `<span class="det-emoji">${plural ? noun.emoji+noun.emoji : noun.emoji}</span>` : ''}
      <span class="det-noun">${shown}</span>
    </div>
    <div class="det-options">
      ${options.map(o=>`<button type="button" class="det-btn" data-v="${o}">${o}</button>`).join('')}
    </div>
  `);
  bindQuit();
  startTimerIfNeeded('determinants');
  setSolution([solSel('.det-btn','v',answer)]);
  setHintQuestion('determinants', { noun, plural, shown, family, answer, options }, { choices:'.det-btn' });
  document.querySelectorAll('.det-btn').forEach(btn=>{
    btn.onclick = ()=>{
      if(btn.dataset.v===answer){ clearActiveTimer(); stepOk(btn); flashModal('ok'); setTimeout(onMissionWin, 350); }
      else loseLife(btn, { onRetry: renderDeterminants });
    };
  });
}

// Indices (v52) : 1. un seul ou plusieurs ? ; 2. la marque du pluriel
// montrée, ou « un … / une … » à dire dans sa tête pour entendre le genre.
// Avec 4 choix, l'intrus de l'autre famille peut être écarté.
function determinantsHints(q){
  const intrus = q.options.find(o=> !Object.values(DET_FAMILIES[q.family]).includes(o));
  const end = q.shown.slice(-1);
  const two = q.plural
    ? { say:'Il y en a plusieurs : regarde la petite lettre muette à la fin du mot. Le petit mot doit dire « plusieurs » lui aussi.',
        fx:{ html: /[sx]$/.test(q.shown) ? `<span class="hint-syl">${q.shown.slice(0, -1)}<b>${end}</b></span>` : `<span class="hint-syl">${q.shown}</span>`, glow:'.det-noun' } }
    : { say:`Il n'y en a qu'un. Dis dans ta tête « un ${q.noun.word} » puis « une ${q.noun.word} » : lequel sonne bien ?`, fx:{ glow:'.det-noun' } };
  if(intrus) two.fx.dim = solSel('.det-btn', 'v', intrus);
  return [
    { say:`Regarde bien le mot « ${q.shown} » : est-ce qu'il y en a un seul, ou plusieurs ?`, fx:{ glow:'.det-box' } },
    two,
  ];
}

// inscription auprès du moteur de mini-jeux (js/features/minigame-engine)
registerGame('determinants', renderDeterminants);
registerHints('determinants', determinantsHints);
