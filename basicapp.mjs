// Composes existing host surfaces. Does not acquire data or provider authority.
export function mountBasicApp({nav, appearance, ai, aiLabel='AI'}) {
  if(!nav)throw Error('BasicApp requires a navigation surface');
  const mounted=[];
  for(const [label,panel] of [['Appearance',appearance],[aiLabel,ai]]){
    if(!panel)continue;
    if(!panel.id)throw Error('BasicApp panels require host-assigned IDs');
    panel.setAttribute('popover','auto');
    let button=nav.querySelector(`[popovertarget="${CSS.escape(panel.id)}"]`);
    if(!button){button=document.createElement('button');button.textContent=label;button.setAttribute('popovertarget',panel.id);nav.append(button);mounted.push(button);}
    button.setAttribute('aria-label',label);button.setAttribute('aria-expanded','false');
    const toggle=e=>{button.setAttribute('aria-expanded',String(e.newState==='open'));if(e.newState==='closed' && (panel.contains(document.activeElement)||document.activeElement===document.body))button.focus();};panel.addEventListener('toggle',toggle);mounted.push(()=>panel.removeEventListener('toggle',toggle));
  }
  return {dispose(){for(const item of mounted)typeof item==='function'?item():item.remove();}};
}
