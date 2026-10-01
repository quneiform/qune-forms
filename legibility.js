// Presentation-only adapter. No draft, claim, journal or network access.
export const textTransform = Object.freeze({
  provider: 'qune.io.ux.theme.hradtoraed.com',
  requires: ['text'], excludes: ['legibility-tos', 'terms'], status: 'posited', approval: 'pending'
});
export const theme = Object.freeze({
  id: 'qune.io.ux.theme.hradtoraed.com',
  status: 'posited', approval: 'pending', provenance: 'https://hradtoraed.com',
  textTransform
});
export function degree(value) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : 0;
}
export function applicable({provides = [], role = ''}) {
  return provides.includes('text') && !['legibility-tos', 'terms'].includes(role);
}
export function presentation(target, value) {
  const d = applicable(target) ? degree(value) : 0;
  return { blur: `${(d * 1.6).toFixed(3)}px`, spacing: `${(-d * .065).toFixed(4)}em`, shadow: `${(d * 3).toFixed(2)}px ${(d * 1.4).toFixed(2)}px currentColor` };
}
export function encounter(node, value) {
  // Refuse before writing even neutral styles. Also protect descendants and
  // ancestors: blurring a containing card would blur its terms widget too.
  const protectedSelector = '[data-role="terms"], [data-role="legibility-tos"]';
  if (['terms', 'legibility-tos'].includes(node.dataset.role) || node.closest?.(protectedSelector) || node.querySelector?.(protectedSelector)) return false;
  const target = {provides: (node.dataset.provides || '').split(' '), role: node.dataset.role || ''};
  const style = presentation(target, value);
  node.style.filter = `blur(${style.blur})`;
  node.style.letterSpacing = style.spacing;
  node.style.textShadow = degree(value) && applicable(target) ? style.shadow : 'none';
  return true;
}
