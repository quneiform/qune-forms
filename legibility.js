// Presentation-only adapter. No draft, claim, journal or network access.
export const theme = Object.freeze({
  id: 'qune.io.ux.theme.hradtoraed.com',
  status: 'posited', approval: 'pending', provenance: 'https://hradtoraed.com'
});
export const skene = Object.freeze({
  id: 'qune.io.ux.skenes.legibility.hradtoraed.com',
  requires: ['text'], excludes: ['legibility-tos'], status: 'posited', approval: 'pending'
});
export function degree(value) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : 0;
}
export function applicable({provides = [], role = ''}) {
  return provides.includes('text') && role !== 'legibility-tos';
}
export function presentation(target, value) {
  const d = applicable(target) ? degree(value) : 0;
  return { blur: `${(d * 1.6).toFixed(3)}px`, spacing: `${(-d * .065).toFixed(4)}em`, shadow: `${(d * 3).toFixed(2)}px ${(d * 1.4).toFixed(2)}px currentColor` };
}
export function encounter(node, value) {
  const target = {provides: (node.dataset.provides || '').split(' '), role: node.dataset.role || ''};
  const style = presentation(target, value);
  node.style.filter = `blur(${style.blur})`;
  node.style.letterSpacing = style.spacing;
  node.style.textShadow = degree(value) && applicable(target) ? style.shadow : 'none';
}
