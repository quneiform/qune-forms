// Local read-only terms surface. Runtime admission is not connected in this app.
const common = Object.freeze([
  'This company is fictional. This preview runs locally; no answers are sent to a company and no background sharing occurs.',
  'Only saved answers enter the preview. Unsubmitted keystrokes stay in the editor. Your private browser draft retains original answers and edits for all three previews, including Company C.',
  'Sharing is your choice: approving quotes does not publish them. A download includes your approved quotes and only the company preview you select. Anyone you give that file to can keep a copy.',
  'Clear this app’s drafts removes its saved interview data from this browser. It does not delete downloads, shared copies, or data on another device.'
]);
const retention = {
  A: 'We keep your saved answers verbatim until your first saved change. At that change we stop participating: we keep the pre-change answers, do not receive the replacement, and do not receive later answers. Leaving does not erase the earlier answers from this preview.',
  B: 'We keep your current saved answers, the original wording, and every saved edit. Earlier wording remains available in this preview and is included if you choose to export Company B.',
  C: 'We keep your current saved wording, the number of edits, and the cumulative character edit distance across saved changes. Earlier wording is omitted from this company preview and its export. This does not remove history from your separate private browser draft.'
};
export const policies = Object.freeze(Object.fromEntries(Object.entries(retention).map(([company, text]) => [company,
  Object.freeze({id: `interview-company-${company}-privacy-v1`, company, paragraphs: Object.freeze([text, ...common])})
])));
export function rejectTermsDiff() {
  throw new Error('Terms are read-only: content and presentation changes are refused.');
}
export function termsWidget(company) {
  const policy = policies[company];
  if (!policy) throw new Error('Unknown company policy');
  const node = document.createElement('div');
  node.dataset.role = 'terms';
  node.dataset.surfaceDiffs = 'deny';
  node.contentEditable = 'false';
  const root = node.attachShadow({mode:'closed'});
  const css = document.createElement('link'); css.rel = 'stylesheet'; css.href = '/terms.css';
  const details = document.createElement('details');
  const summary = document.createElement('summary'); summary.textContent = `Company ${company} · Privacy & terms`;
  details.append(summary);
  for (const text of policy.paragraphs) {
    const p = document.createElement('p'); p.textContent = text; details.append(p);
  }
  const label = document.createElement('small'); label.textContent = 'Read-only policy · v1'; details.append(label);
  root.append(css, details);
  // Disclosure navigation is allowed; editing and transform proposals are not.
  root.addEventListener('beforeinput', event => event.preventDefault());
  return Object.freeze({node, policy, applyDiff: rejectTermsDiff});
}
