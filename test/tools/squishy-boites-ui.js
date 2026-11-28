// Les gestes de l'onglet « 🗃️ Mes boîtes » pour les suites
// test/squishy-boites-*.test.js : trouver une carte, une option, une case,
// toucher, et noter ce que la voix dit et les sons joués pendant un geste.
const { w, d, ev, json, spoken } = require('./squishy-boites.js');

const $ = (sel) => d.querySelector(sel);
const $$ = (sel) => [...d.querySelectorAll(sel)];
// ouvrir un onglet de la chambre comme une première fois (la consigne est relue)
const openTab = (tab) => ev(`forgetSpokenHint(); openSquishyRoom("${tab}")`);
const card = (i) => $(`.cb-card[data-crate="${i}"]`);
const opt = (key) => $(`.cb-opts[data-row="1"] .cb-opt[data-key="${key}"]`);
const add = (key) => $(`.cb-opts[data-row="2"] .cb-opt[data-key="${key}"]`);
const item = (id) => $(`.cb-item[data-id="${id}"]`);
const slot = (pos) => $(`.cb-slot[data-pos="${pos}"]`);
const keysOf = (row) => $$(`.cb-opts[data-row="${row}"] .cb-opt`).map((b) => b.dataset.key);
const selected = (row) => $$(`.cb-opts[data-row="${row}"] .cb-opt.selected`).map((b) => b.dataset.key);
// ce que la voix dit pendant un geste : un seul texte par événement
const said = (fn) => {
  const n = spoken.length;
  fn();
  return spoken.slice(n);
};
// la voix note le texte tel qu'il est prononcé (toSpoken : espaces avant « ! », élisions) :
// la phrase attendue passe par la même mise en forme, et se compare en entier
const voiced = (text) => ev(`toSpoken(${json(text)})`);
const saidOnly = (fn, text) => {
  const got = said(fn);
  return got.length === 1 && got[0] === voiced(text) ? true : (console.log('     dit : ' + json(got)), false);
};
const silent = (fn) => said(fn).length === 0;
const tap = (el) => el.click();
const place = (id, pos = 0) => {
  tap(item(id));
  tap(slot(pos));
};
// choisir un squishy puis toucher la boîte : ce que la voix dit au second toucher seulement
const dropSays = (id, text, pos = 0) => {
  tap(item(id));
  return saidOnly(() => tap(slot(pos)), text);
};
// les sons joués, notés au passage (le jeu les joue toujours)
const sounds = [];
w.cbNoteSound = (k) => sounds.push(k);
ev('const cbRealSound = playSound; playSound = (k) => { window.cbNoteSound(k); return cbRealSound(k); }');
const heard = (fn) => {
  const n = sounds.length;
  fn();
  return sounds.slice(n);
};
const nameOf = (id) => ev(`SQUISHIES["${id}"].name`);
const HEAD = 'Range tes squishies dans tes boîtes !';
const PICK1 = "Choisis l'étiquette de ta boîte : une couleur, une famille, ou tes préférés !";
const PICK2 = "Choisis l'étiquette de ta boîte : une couleur, une forme, une taille, une famille, ou tes préférés !";
const MORE = ' Tu peux ajouter une deuxième règle, ou toucher Choisir.';

module.exports = {
  $,
  $$,
  openTab,
  card,
  opt,
  add,
  item,
  slot,
  keysOf,
  selected,
  said,
  voiced,
  saidOnly,
  silent,
  tap,
  place,
  dropSays,
  heard,
  nameOf,
  HEAD,
  PICK1,
  PICK2,
  MORE,
};
