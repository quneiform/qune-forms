import {ChatSession, loadPreference, savePreference} from './session.mjs?v=23d17983c1a87e0b';
const node = (tag, text) => {const n=document.createElement(tag);if(text!==undefined)n.textContent=text;return n;};
export function mountChatbot(container, {providers=[], profile='default', storage, onUse=null, scopeLabel='Only messages in this chat are sent.'}={}) {
  const title=node('h2','Talk it through'), disclosure=node('p'), settings=node('div'), provider=node('select'), model=node('select');
  provider.setAttribute('aria-label','AI connection');model.setAttribute('aria-label','AI model');
  const log=node('div'), status=node('p'), input=node('textarea'), send=node('button','Send'), stop=node('button','Stop'), retry=node('button','Retry'), clear=node('button','Clear chat');
  log.className='chat-messages';log.setAttribute('role','log');status.setAttribute('role','status');input.setAttribute('aria-label','Message AI');input.placeholder='Ask in your own words…';
  const session=new ChatSession(providers,render);
  for(const p of providers){const option=node('option',p.label);option.value=p.id;provider.append(option);}
  settings.append(provider,model);const actions=node('div');actions.className='chat-actions';actions.append(send,stop,retry,clear);
  container.classList.add('q-chatbot');container.replaceChildren(title,node('p',scopeLabel),settings,disclosure,log,input,actions,status);
  let storageError='';
  try { storage ??= globalThis.localStorage; } catch { storageError='Preferences unavailable on this device.'; }
  function render(){
    log.replaceChildren();
    for(const m of session.messages){const row=node('article');row.append(node('strong',m.role==='user'?'You':'AI'),node('p',m.content));
      if(m.status!=='complete')row.append(node('small',m.error || m.status));
      if(m.role==='assistant' && m.status==='complete' && onUse){const use=node('button','Use in answer');use.onclick=()=>{try{onUse(m.content);status.textContent='Inserted into the editor. Not saved.';}catch(e){status.textContent=e.message;}};row.append(use);}
      log.append(row);
    }
    send.disabled=session.pending||!session.provider?.stream;stop.disabled=!session.pending;
    retry.disabled=session.pending||!['failed','interrupted'].includes(session.messages.at(-1)?.status);
    status.textContent=storageError || (session.pending?'Receiving reply…':'');
  }
  function select(preserveModel=false,persist=true){
    const p=providers.find(p=>p.id===provider.value);if(!p){session.disconnect();disclosure.textContent='No AI connection configured by this host.';render();return;}
    if(!preserveModel){model.replaceChildren();for(const name of p.models){const o=node('option',name);o.value=name;model.append(o);}}
    if(!model.value){session.disconnect();disclosure.textContent='No models available for this connection.';render();return;}
    session.select(p.id,model.value);disclosure.textContent=`${p.local?'Local':'Remote'} · ${p.destination} · ${p.stream?'Connected configuration':'Unavailable'}`;
    if(persist)try{savePreference(storage,profile,p.id,model.value);storageError='';}catch{storageError='Preferences could not be saved on this device.';}render();
  }
  provider.onchange=()=>select();model.onchange=()=>select(true);
  send.onclick=async()=>{const text=input.value;try{await session.send(text);if(session.messages.at(-1)?.status==='complete' && input.value===text)input.value='';}catch(e){status.textContent=e.message;}};
  stop.onclick=()=>session.stop();clear.onclick=()=>{session.clear();input.value='';};retry.onclick=()=>session.send(session.messages.at(-2).content,true).catch(e=>status.textContent=e.message);
  let preference;try{preference=loadPreference(storage,profile);}catch{storageError='Saved AI preferences could not be loaded.';}
  if(preference && providers.some(p=>p.id===preference.provider))provider.value=preference.provider;
  select(false,false);if(preference && session.provider?.models.includes(preference.model)){model.value=preference.model;select(true,false);}
  return {session, dispose(){session.stop();container.replaceChildren();}};
}
