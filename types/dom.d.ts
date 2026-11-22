/* Types du DOM pour ce jeu (ADR 0003, TypeScript en vérification du JS).
   Le jeu interroge son propre HTML : ses sélecteurs désignent des éléments
   HTML (boutons, champs, sections), pas des éléments SVG ou XML. Par défaut,
   TypeScript renvoie un `Element` générique (sans .hidden, .value, .focus…) ;
   ces déclarations, prioritaires, lui disent `HTMLElement`. Un champ précis
   s'annote sur place : /** @type {HTMLInputElement} *\/ (…). */
interface ParentNode {
  querySelector(selectors: string): HTMLElement | null;
  querySelectorAll(selectors: string): NodeListOf<HTMLElement>;
}
interface Element {
  closest(selectors: string): HTMLElement | null;
}
