/* ---------- Mini-jeu : Lecture magique (niveau GS-CE1) ----------
   Association image <-> mot écrit, pour s'entraîner à lire des mots
   simples. Plus le palier est élevé, plus on retire les indices
   visuels (ça force à vraiment lire, pas juste reconnaître l'image).
   Seuils centralisés dans js/entities/difficulty/difficulty.js (readingWordOnly/Options). */
import { readingOptions, readingWordOnly } from '../../../entities/difficulty/index.js';
import { WORDS_CP } from '../../../entities/words/index.js';
import { pickRandom, shuffle } from '../../../shared/lib/index.js';
import { openModal } from '../../../shared/ui/index.js';
import { gameDiff } from '../../adaptive/index.js';
import { hintSyllablesFirst, hintSyllablesHTML, registerHints, setHintQuestion } from '../../hints/index.js';
import {
  clearActiveTimer, flashModal, livesBar, loseLife, onMissionWin, registerGame, setSolution,
  setupLives, solSel, startTimerIfNeeded, stepOk
} from '../../minigame-engine/index.js';
import { bindQuit, gameHeader } from '../../screen/index.js';

function pickDistractors(pool, correct, count){
  const others = pool.filter(w=>w.word!==correct.word);
  return shuffle(others).slice(0, count);
}

function renderReading(){
  setupLives('reading');
  const dd = gameDiff();
  const pool = WORDS_CP;
  const correct = pickRandom(pool);

  // paliers 1-2 : on voit l'image, on choisit le mot écrit (association)
  // paliers 3-5 : on ne voit QUE le mot, il faut le lire pour trouver l'image
  const wordToImage = readingWordOnly(dd);
  const nOptions = readingOptions(dd);
  const distractors = pickDistractors(pool, correct, nOptions - 1);
  const options = shuffle([correct, ...distractors]);

  if(wordToImage){
    openModal(`
      ${gameHeader('📖 Lecture magique', 'Lis bien le mot… puis touche la bonne image !', 'Lis bien le mot, puis touche la bonne image')}
      ${livesBar()}
      <div class="reading-word-box"><span class="reading-word">${correct.word}</span></div>
      <div class="reading-options">
        ${options.map(o=>`<button type="button" class="reading-opt" data-w="${o.word}" aria-label="${o.word}">${o.emoji}</button>`).join('')}
      </div>
    `);
  } else {
    openModal(`
      ${gameHeader('📖 Lecture magique', 'Quel mot va avec cette image ?', 'Quel mot va avec cette image ?')}
      ${livesBar()}
      <div class="reading-image-box"><span class="reading-image">${correct.emoji}</span></div>
      <div class="reading-options reading-options-words">
        ${options.map(o=>`<button type="button" class="reading-opt reading-word-btn" data-w="${o.word}">${o.word}</button>`).join('')}
      </div>
    `);
  }
  bindQuit();
  startTimerIfNeeded('reading');
  setSolution([solSel('.reading-opt','w',correct.word)]);
  setHintQuestion('reading', { correct, wordToImage, options }, { choices:'.reading-opt' });
  document.querySelectorAll('.reading-opt').forEach(btn=>{
    btn.onclick = ()=>{
      if(btn.dataset.w===correct.word){ clearActiveTimer(); stepOk(btn); flashModal('ok'); setTimeout(onMissionWin, 350); }
      else loseLife(btn, { onRetry: renderReading });
    };
  });
}

/* Indices (v52). On ne lit jamais le mot à la place de l'enfant : la voix
   explique la méthode, le découpage s'affiche seulement.
   - mot → image : 1. lire son par son ; 2. le mot découpé en syllabes
     (ou sa première lettre s'il n'a qu'une syllabe).
   - image → mot : 1. dire le nom de l'image dans sa tête, écouter le premier
     son ; 2. la première lettre du bon mot.
   Avec Perle la conteuse, les syllabes arrivent dès l'indice 1. */
function readingFirstLetter(w){ return `<span class="hint-syl"><b>${w[0]}</b>${w.slice(1)}</span>`; }
function readingHints(q){
  const w = q.correct.word, syl = q.correct.syl || [w];
  // une mauvaise réponse à écarter (avec 4 choix ou plus), de préférence une
  // qui ne commence pas par la même lettre
  const wrong = q.options.filter(o=> o.word !== w).sort((a, b)=> (a.word[0] === w[0]) - (b.word[0] === w[0]))[0];
  const dim = wrong ? solSel('.reading-opt', 'w', wrong.word) : null;
  const cut = syl.length > 1
    ? { say:'Je découpe le mot en morceaux. Lis chaque morceau, puis le mot entier !', fx:{ html:hintSyllablesHTML(syl), glow:'.reading-word-box' } }
    : { say:'Regarde bien la première lettre, puis lis la suite.', fx:{ html:readingFirstLetter(w), glow:'.reading-word-box' } };
  if(q.wordToImage){
    const first = { say:'Lis le mot doucement, un son après l\'autre. Puis cherche son image.', fx:{ glow:'.reading-word-box' } };
    return hintSyllablesFirst() ? [cut, { say:'Regarde la première lettre et lis encore une fois.', fx:{ html:readingFirstLetter(w), dim } }]
                                : [first, Object.assign({}, cut, { fx:Object.assign({}, cut.fx, { dim }) })];
  }
  const last = { say:'Cherche le mot qui commence par cette lettre.', fx:{ html:`<span class="hint-syl"><b>${w[0]}</b>…</span>`, dim } };
  if(hintSyllablesFirst()) return [
    { say:'Je découpe chaque mot en syllabes : lis-les doucement.', fx:{ run(root){
        root.querySelectorAll('.reading-word-btn').forEach(b=>{
          const o = WORDS_CP.find(x=> x.word === b.dataset.w);
          if(o && o.syl && !b.querySelector('.hint-syl')) b.innerHTML = hintSyllablesHTML(o.syl);
        });
      } } },
    last,
  ];
  return [
    { say:'Dis le nom de l\'image dans ta tête. Quel son entends-tu au début ?', fx:{ glow:'.reading-image-box' } },
    last,
  ];
}

// inscription auprès du moteur de mini-jeux (js/features/minigame-engine)
registerGame('reading', renderReading);
registerHints('reading', readingHints);
