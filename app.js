import {computeLocally} from '/browser-compute.js?v=c1eac2477268ec67';
import {degree, encounter} from '/legibility.js?v=c1eac2477268ec67';
import {termsWidget} from '/terms.js?v=c1eac2477268ec67';
const $ = id => document.getElementById(id);
const KEY = 'qune.interview.drafts.v1';
let legibilityEnabled = false, legibilityDegree = degree(new URL(location.href).searchParams.get('d') ?? .75);
let config, store = { takes: [], active: -1 }, result = null, busy = false, storedSnapshot = null;
const descriptions = [
  ['A', [['Speak', ' in your own words. We '], ['keep', ' your saved answers as they are.']], 'var(--a)'],
  ['B', [['Revise', ' freely. We '], ['keep', ' your original and every saved edit—the whole conversation.']], 'var(--b)'],
  ['C', [['Revise', ' freely. We '], ['keep', ' your latest wording and '], ['record', ' how often and how much you changed it.']], 'var(--c)']
];
function element(tag, text, className) { const e = document.createElement(tag); if(text !== undefined) e.textContent = text; if(className) e.className = className; return e; }
function button(text, fn, cls = '') { const b = element('button', text, cls); b.onclick = fn; return b; }
function notice(message = '') { $('notice').textContent = message; }
function persist() {
  try {
    if(localStorage.getItem(KEY) !== storedSnapshot) throw Error('Draft changed in another tab');
    const next = JSON.stringify(store); localStorage.setItem(KEY, next); storedSnapshot = next;
    $('saved').textContent = 'Saved on this browser';
  }
  catch { $('saved').textContent = 'Not saved'; throw Error('Browser storage failed. Keep this tab open and download your reviewed selection before leaving.'); }
}
async function compute(action = null) {
  if(busy) return false; busy = true;
  try {
    const draft = store.takes[store.active];
    result = await computeLocally({draft, revision:draft.revision, action}); store.takes[store.active] = result.draft;
    persist(); notice(); return true;
  } catch(e) { notice(e.message); return false; } finally { busy = false; }
}
function refreshEncounters() { document.querySelectorAll('main h1, main h2, main h3, main p, main blockquote, .company-name').forEach(node=>{node.dataset.provides='text';}); document.querySelectorAll('[data-provides]').forEach(node => encounter(node,legibilityEnabled ? legibilityDegree : 0)); }
function renderCards() {
  $('cards').replaceChildren();
  descriptions.forEach(([name, description, tone], index) => {
    const card = element('article', undefined, 'policy'); card.style.setProperty('--tone', tone); card.dataset.company=name;
    card.append(element('span', ['01 / ON THE RECORD','02 / ROOM TO REVISE','03 / THE LATEST WORD'][index], 'policy-mark'));
    const chrome=element('div',undefined,'company-chrome');
    chrome.append(element('h3', `Company ${name}`),element('span',['Opaque','Extractive','Limited'][index],'company-name'));
    const narrative=element('p',undefined,'description');
    for(const [action,words] of description) narrative.append(element('strong',action),document.createTextNode(words));
    card.append(chrome,narrative);
    const view = result?.policies[index];
    if(!view?.answers.length) card.append(element('p', 'Your answers will appear here.', 'empty'));
    for(const a of view?.answers || []) {
      const wording = element('blockquote', a.text); wording.dataset.provides = 'text'; card.append(wording);
      if(name === 'B' && a.earlier?.length) {
        const details = element('details'); details.append(element('summary', `${a.earlier.length} earlier version${a.earlier.length === 1 ? '' : 's'} kept`));
        a.earlier.forEach(t => { const old=element('p',t); old.dataset.provides='text'; details.append(old); }); card.append(details);
      }
      if(name === 'C' && a.edits) card.append(element('span', `${a.edits} edit${a.edits === 1 ? '' : 's'} · ${a.characters_changed} character changes`, 'tag'));
    }
    if(view?.left_at_question) card.append(element('p', `Left at question ${view.left_at_question}, when you edited an answer. Answers saved after that edit are excluded.`, 'exit'));
    card.append(termsWidget(name).node); $('cards').append(card);
  });
}
function editor(container, q, value = '') {
  const input = element('textarea'); input.dataset.provides='text'; input.value = value; input.maxLength = 4000; input.setAttribute('aria-label', `Answer question ${q+1}`); input.placeholder = 'In your own words…';
  const controls = element('div', undefined, 'edit-actions'), count = element('span', `${value.length}/4000`, 'count');
  input.oninput = () => count.textContent = `${input.value.length}/4000`;
  const save = button(value ? 'Save edit' : 'Save & continue →', async () => {
    save.disabled = true;
    if(await compute({kind:'answer', question:q, text:input.value})) render(); else save.disabled = false;
  }, 'primary');
  controls.append(count, save); if(value) controls.append(button('Cancel', render, 'quiet'));
  container.append(input, controls); encounter(input,legibilityEnabled ? legibilityDegree : 0); return input;
}
function render() {
  renderCards();
  $('terms').hidden = !!result;
  $('questions').replaceChildren(); $('progress').replaceChildren(); $('interview-actions').replaceChildren();
  $('take').textContent = result ? `TAKE ${store.active+1} · ${store.takes.length} TOTAL` : 'NOT STARTED';
  const picker = $('take-picker'); picker.replaceChildren(); picker.hidden = store.takes.length < 2;
  store.takes.forEach((_, i) => { const option = element('option', `Take ${i+1}`); option.value = i; picker.append(option); });
  picker.value = store.active;
  const d = result?.draft;
  for(let q=0; q<3; q++) {
    const versions = d?.versions[q] || [], current = versions.at(-1);
    $('progress').append(element('i', undefined, current ? 'done' : ''));
    if(!d || (q > 0 && !d.versions[q-1].length)) continue;
    const section = element('article', undefined, 'question'); section.append(element('span', `QUESTION 0${q+1}`, 'question-number'), element('h3', config.questions[q]));
    if(current) {
      const answer = element('div', undefined, 'answer'), meta = element('div', undefined, 'answer-meta');
      const wording=element('p', current); wording.dataset.provides='text'; answer.append(wording);
      if(versions.length > 1) meta.append(element('span', `Edited ${versions.length-1}×`));
      meta.append(button('Edit', () => { answer.replaceChildren(); editor(answer,q,current).focus(); }, 'quiet'));
      answer.append(meta); section.append(answer);
    } else editor(section,q);
    section.querySelector('h3').dataset.provides='text'; $('questions').append(section);
  }
  if(!d) $('questions').append(element('p', 'Three questions. You can revise any answer, take the interview again, and choose your quotes before exporting.', 'empty'));
  refreshEncounters();
  if(d?.versions.every(v=>v.length)) {
    $('interview-actions').append(element('p', "That's all three. Before sharing, check the words someone might quote."), button('Check my quotes ↗', () => { renderQuotes(); $('quotes').showModal(); }, 'primary'));
  }
}
function renderQuotes(suggest = false) {
  const d = result.draft; $('quote-options').replaceChildren(); $('approved').replaceChildren();
  d.versions.forEach((versions, question) => {
    const text = versions.at(-1); if(!text) return;
    const section = element('div', undefined, 'quote-option'); section.append(element('strong', `Question ${question+1}`));
    const area = element('textarea'); area.dataset.provides='text'; area.setAttribute('aria-label', `Exact quote from answer ${question+1}`);
    area.value = suggest ? (text.match(/[^.!?\n]+[.!?]?/u)?.[0]?.trim() || text) : text;
    section.append(area, button('Approve this excerpt', async () => { if(await compute({kind:'quote',question,text:area.value})) renderQuotes(); }));
    $('quote-options').append(section); encounter(area,legibilityEnabled ? legibilityDegree : 0);
  });
  d.quotes.forEach((q,index) => { const row = element('p', q.text); row.append(button('Remove', async () => { if(await compute({kind:'remove_quote',index})) renderQuotes(); }, 'quiet')); $('approved').append(row); });
  if(!d.quotes.length) $('approved').append(element('p','No excerpts approved yet.'));
  $('download').disabled = !d.quotes.length;
}
$('take-picker').onchange = async e => {
  store.active = Number(e.target.value); if(await compute()) render();
};
$('agree').onchange = () => $('begin').disabled = !$('agree').checked;
$('begin').onclick = async () => {
  const d = {id:crypto.randomUUID(), terms:'interview-local-preview-0.3.0-v1', versions:[[],[],[]], events:[], quotes:[], revision:0};
  store.takes.push(d); store.active = store.takes.length-1;
  if(await compute()) render();
};
$('retake').onclick = () => {
  if(!result) return;
  if(!confirm('Start another take? Your saved takes stay on this browser. Unsaved editor text will be discarded.')) return;
  result = null; $('agree').checked = false; $('begin').disabled = true; render(); $('terms').scrollIntoView({behavior:'smooth'});
};
$('clear').onclick = () => {
  if(!confirm("Delete all interview takes and earlier answers stored by this app in this browser? Downloaded files aren't deleted.")) return;
  try { localStorage.removeItem(KEY); storedSnapshot=null; store={takes:[],active:-1}; result=null; $('agree').checked=false; $('begin').disabled=true; $('saved').textContent='Drafts cleared'; render(); notice(); }
  catch(e) { notice(`Could not clear drafts: ${e.message}`); }
};
document.querySelectorAll('[name=appearance]').forEach(input=>{input.onchange=()=>document.body.classList.toggle('light',input.value==='light');});
$('theme-panel').addEventListener('toggle',event=>$('theme').setAttribute('aria-expanded',String(event.newState==='open')));
$('close-quotes').onclick = () => { $('quotes').close(); render(); };
$('suggest').onclick = () => renderQuotes(true);
$('publish').onclick = () => $('publication').showModal();
$('close-publication').onclick = () => $('publication').close();
$('download').onclick = () => {
  const policy = $('export-policy').value;
  if(policy === 'B' && !confirm('Company B includes all earlier wording, including text you edited out. Include that history?')) return;
  const data={format:'qn.primer.interview.reviewed-export.v1',app_id:config.app_id,session_id:result.draft.id,revision:result.draft.revision,terms:result.draft.terms,quotes:result.draft.quotes,publication:'local-download-only'};
  if(policy) data.policy_preview = result.policies.find(p=>p.company===policy);
  const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));
  const a=document.createElement('a'); a.href=url; a.download=`interview-reviewed-${result.draft.id}.json`; a.click(); setTimeout(()=>URL.revokeObjectURL(url),1000);
};
window.addEventListener('storage', e => { if(e.key===KEY) { notice('This interview changed in another tab. Reload before saving to avoid overwriting it.'); document.querySelectorAll('button').forEach(b=>b.disabled=true); } });
try {
  const response=await fetch('/config.json?v=c1eac2477268ec67'); if(!response.ok) throw Error('Configuration unavailable'); config=await response.json();
  $('publication-url').textContent=config.publication_url;
  const saved=localStorage.getItem(KEY); storedSnapshot=saved;
  if(saved) {
    const parsed=JSON.parse(saved);
    if(!Array.isArray(parsed.takes) || !Number.isInteger(parsed.active) || parsed.active < 0 || parsed.active >= parsed.takes.length) throw Error('Saved draft format is invalid. Existing storage has not been changed.');
    store=parsed; await compute();
  }
  render();
} catch(e) { notice(e.message); $('begin').disabled=true; }

// Controls come from the compiled proto descriptors, not a hand-written type list.
const controlResponse=await fetch('/theme-controls.json?v=c1eac2477268ec67');
if(!controlResponse.ok) throw Error('Theme declarations could not load');
const controls=await controlResponse.json();
for(const spec of controls) {
  const group=element('fieldset'); group.dataset.kind=spec.kind; group.append(element('legend',spec.name==='ColorRotation'?'Color':spec.name));
  const labelInput=(text,input)=>{const label=element('label',text);label.prepend(input);group.append(label);};
  if(spec.kind==='enum') {
    for(const choice of spec.choices) {
      const input=element('input');input.type='radio';input.name=spec.name;input.value=choice;input.checked=choice===spec.choices[0];
      input.onchange=()=>{document.body.dataset[spec.name==='Density'?'density':'palette']=choice;};labelInput(choice[0].toUpperCase()+choice.slice(1),input);
    }
  } else if(spec.kind==='bool') {
    const input=element('input');input.type='checkbox';input.id='monotone';input.checked=spec.default;
    input.onchange=()=>document.body.classList.toggle('monotone',input.checked);labelInput('Use a single neutral palette',input);
  } else if(spec.kind==='int32') {
    const enabled=element('input');enabled.type='checkbox';enabled.id='hr-theme';labelInput('Rearrange letters',enabled);
    group.append(element('p','A little harder to read. Still exactly your words.','theme-description'));
    const slider=element('input');slider.type='range';slider.id='hr-degree';slider.min=spec.min;slider.max=spec.max;slider.step=1;slider.value=spec.default;
    slider.setAttribute('aria-label','Hradtoraed strength');
    const output=element('output',String(spec.default));output.id='hr-value';
    const update=()=>{
      const value=Number(slider.value);
      if(!Number.isInteger(value)||value<spec.min||value>spec.max) throw Error('Theme strength outside declared range');
      output.value=String(value);legibilityDegree=value/100;legibilityEnabled=enabled.checked;refreshEncounters();
    };
    enabled.onchange=update;slider.oninput=update;
    const strength=element('div',undefined,'theme-strength');strength.append(slider,output);group.append(strength);
    group.append(button('Ordinary text',()=>{enabled.checked=false;update();},'quiet'));
  } else throw Error('Unsupported theme declaration');
  $('theme-controls').append(group);
}
refreshEncounters();
