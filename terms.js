// Local read-only terms surface. Runtime admission is not connected in this app.
const common = Object.freeze([
  'Collection: Only saved answers shall enter the company preview. Unsaved keystrokes shall not enter the preview.',
  'Local storage: The participant’s private browser draft shall retain the original and saved revisions for all three previews. Restrictions on a company preview shall not delete that separate draft history.',
  'Disclosure: No answer shall be transmitted to a company by this demonstration. Quote approval shall not publish an answer. A requested export shall contain approved quotes and only the company preview selected by the participant.',
  'Deletion: “Clear this app’s drafts” shall remove this app’s saved interview data from the current browser. It shall not delete downloaded files, shared copies, or data on another device.'
]);
const retention = {
  A: 'Retention and withdrawal: The preview shall retain answers verbatim as saved before the first saved revision. On that revision, participation shall end. The replacement and all later answers shall be excluded. Previously retained answers shall remain in the preview and any requested Company A export.',
  B: 'Retention and revisions: The preview shall retain the current answer, its original wording, and every saved revision. A revision shall not delete an earlier version. A requested Company B export shall include those earlier versions.',
  C: 'Retention and revisions: The preview shall retain only current wording, the count of saved edits, and cumulative character edit distance. Earlier wording shall be excluded from the Company C preview and export. The participant’s separate private draft history shall remain governed by the local-storage rule below.'
};
export const policies = Object.freeze(Object.fromEntries(Object.entries(retention).map(([company, text]) => [company,
  Object.freeze({id: `interview-company-${company}-privacy-v2`, company, paragraphs: Object.freeze([text, ...common])})
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
  const css = document.createElement('link'); css.rel = 'stylesheet'; css.href = '/terms.css?v=53fed8affc1e082d';
  const details = document.createElement('details');
  const summary = document.createElement('summary'); summary.textContent = `Company ${company} · Privacy & terms`;
  details.append(summary);
  const scope=document.createElement('p'); scope.textContent='Rules for this fictional company’s local preview.'; details.append(scope);
  const rules=document.createElement('ol');
  for (const text of policy.paragraphs) {
    const rule=document.createElement('li');
    const split=text.indexOf(':'); const heading=document.createElement('strong');heading.textContent=text.slice(0,split+1);
    rule.append(heading,document.createTextNode(text.slice(split+1)));rules.append(rule);
  }
  details.append(rules);
  const label = document.createElement('small'); label.textContent = 'Read-only policy · v2'; details.append(label);
  root.append(css, details);
  // Disclosure navigation is allowed; editing and transform proposals are not.
  root.addEventListener('beforeinput', event => event.preventDefault());
  return Object.freeze({node, policy, applyDiff: rejectTermsDiff});
}
