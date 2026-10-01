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
// Stable adjacent swaps of interior graphemes; punctuation and word ends stay put.
const graphemes = new Intl.Segmenter(undefined, {granularity:'grapheme'});
export function rearrange(text, value) {
  const d=degree(value);
  return text.replace(/[\p{L}\p{M}]+/gu, word => {
    const letters=Array.from(graphemes.segment(word), part=>part.segment);
    const pairs=Math.floor((letters.length-2)/2);
    const swaps=Math.round(Math.max(0,pairs)*d);
    for(let i=0;i<swaps;i++) {
      const a=1+i*2; [letters[a],letters[a+1]]=[letters[a+1],letters[a]];
    }
    return letters.join('');
  });
}
const sources=new WeakMap();
const editors=new WeakMap();
export function encounter(node, value) {
  const protectedSelector = '[data-role="terms"], [data-role="legibility-tos"]';
  if (['terms', 'legibility-tos'].includes(node.dataset.role) || node.closest?.(protectedSelector) || node.querySelector?.(protectedSelector)) return false;
  if(!applicable({provides:(node.dataset.provides || '').split(' ')})) return false;
  const d=degree(value);
  if(node.tagName==='TEXTAREA') {
    let state=editors.get(node);
    if(!state) {
      const wrap=document.createElement('div'); wrap.className='text-encounter-editor';
      const overlay=document.createElement('div'); overlay.className='text-encounter-overlay'; overlay.setAttribute('aria-hidden','true');
      node.before(wrap); wrap.append(node,overlay);
      state={overlay,d:0,composing:false}; editors.set(node,state);
      const paint=()=>{
        const active=state.d>0 && !state.composing && node.value.length>0;
        wrap.classList.toggle('permuted',active); overlay.hidden=!active;
        overlay.textContent=rearrange(node.value,state.d)+'\n';
        overlay.style.width=node.clientWidth+'px'; overlay.style.height=node.clientHeight+'px';
        overlay.scrollTop=node.scrollTop; overlay.scrollLeft=node.scrollLeft;
      };
      state.paint=paint;
      node.addEventListener('input',paint); node.addEventListener('scroll',paint);
      node.addEventListener('compositionstart',()=>{state.composing=true;paint();});
      node.addEventListener('compositionend',()=>{state.composing=false;paint();});
      const observer=new ResizeObserver(paint); observer.observe(node);
      // Disconnect once removed, so replaced editors do not remain retained.
      const removal=new MutationObserver(()=>{if(!node.isConnected){observer.disconnect();removal.disconnect();}});
      removal.observe(document.body,{childList:true,subtree:true});
    }
    state.d=d; state.paint();
  } else {
    const renderText=part=>{
      if(!sources.has(part)) sources.set(part,part.textContent);
      part.textContent=rearrange(sources.get(part),d);
    };
    if(node.childNodes) {
      const walk=parent=>{for(const child of parent.childNodes) {
        if(child.nodeType===3) renderText(child);
        else if(child.nodeType===1 && !child.matches('button,input,textarea,select,[data-role=terms],[data-role=legibility-tos]')) walk(child);
      }};
      walk(node);
    } else renderText(node);
  }
  return true;
}
