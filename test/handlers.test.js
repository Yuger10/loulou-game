// setHandler (js/shared/ui/handlers.js) remplace `el.onclick = …` sans
// jamais doubler un handler (règle oxlint prefer-add-event-listener) :
// - rebrancher un élément remplace le handler précédent ;
// - null le retire ;
// - un objet sans addEventListener garde la propriété `onX` (jeu qui marche partout) ;
// - une fenêtre réutilisée (confirmation) ouverte plusieurs fois garde un seul écouteur.
const { JSDOM } = require('jsdom');
const page = require('./tools/page.js');

let failed = 0,
  passed = 0;
function check(name, cond, detail) {
  if (cond) {
    passed++;
    console.log('✅ ' + name);
  } else {
    failed++;
    console.log('❌ ' + name + (detail ? `\n     → ${detail}` : ''));
  }
}
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

const dom = new JSDOM(page.buildHtml(), {
  runScripts: 'dangerously',
  pretendToBeVisual: true,
  url: 'http://localhost/?saison=aucune',
  beforeParse(win) {
    win.SpeechSynthesisUtterance = function (text) {
      this.text = text;
    };
    win.speechSynthesis = { speaking: false, cancel() {}, getVoices: () => [], speak() {} };
    // compte les écouteurs actifs par élément et par type (ajoutés moins retirés)
    const proto = win.EventTarget.prototype;
    const add = proto.addEventListener,
      remove = proto.removeEventListener;
    win.activeListenerCounts = new WeakMap();
    const bump = (t, type, k) => {
      const m = win.activeListenerCounts.get(t) || {};
      m[type] = (m[type] || 0) + k;
      win.activeListenerCounts.set(t, m);
    };
    proto.addEventListener = function (type, fn, o) {
      bump(this, type, 1);
      return add.call(this, type, fn, o);
    };
    proto.removeEventListener = function (type, fn, o) {
      bump(this, type, -1);
      return remove.call(this, type, fn, o);
    };
  },
});
const w = dom.window,
  d = w.document;
const ev = (code) => w.eval(code);
const errs = [];
w.addEventListener('error', (e) => errs.push(e.message));
const active = (el, type) => (w.activeListenerCounts.get(el) || {})[type] || 0;

(async () => {
  await wait(200);
  console.log('— setHandler');
  const b = d.createElement('button');
  d.body.appendChild(b);
  let calls = [];
  ev('setHandler')(b, 'click', () => calls.push('a'));
  ev('setHandler')(b, 'click', () => calls.push('b'));
  b.click();
  check('rebrancher remplace : seul le dernier handler répond', calls.join() === 'b', calls.join());
  check('un seul écouteur actif', active(b, 'click') === 1, String(active(b, 'click')));
  calls = [];
  ev('setHandler')(b, 'click', null);
  b.click();
  check('null retire le handler', calls.length === 0 && active(b, 'click') === 0);
  const plain = {};
  const fn = () => {};
  ev('setHandler')(plain, 'end', fn);
  check('sans addEventListener : la propriété onX (vieux navigateurs, objets incomplets)', plain.onend === fn);

  console.log('— Fenêtre de confirmation ouverte quatre fois');
  for (let i = 0; i < 4; i++) {
    ev("askConfirm({ text: 'Sûr ?' })");
    await wait(5);
  }
  const layer = d.getElementById('confirm-layer');
  check(
    'le calque réutilisé garde un seul écouteur de clic',
    active(layer, 'click') === 1,
    String(active(layer, 'click')),
  );
  let answers = 0;
  ev('askConfirm')({ text: 'Encore ?' }).then(() => answers++);
  await wait(5);
  layer.dispatchEvent(new w.MouseEvent('click', { bubbles: true }));
  await wait(10);
  check('un clic sur le fond ferme une seule fois', answers === 1 && layer.hidden, `${answers} réponse(s)`);

  check('aucune erreur JS', errs.length === 0, errs.join(' | '));
  console.log(`\n${failed ? '❌' : '✅'} handlers : ${passed} vérifications réussies, ${failed} en échec`);
  process.exit(failed ? 1 : 0);
})();
