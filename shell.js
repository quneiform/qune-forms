import {mountBasicApp} from '/basicapp.mjs?v=5fea13f54caaaca7';
import {mountChatbot} from '/chatbot.mjs?v=5fea13f54caaaca7';
import {providers} from '/ai-host.js?v=5fea13f54caaaca7';
const ai=document.getElementById('ai-panel');
mountBasicApp({nav:document.querySelector('.header-actions'),appearance:document.getElementById('theme-panel'),ai});
mountChatbot(ai,{providers,scopeLabel:'Only this chat is sent. Your interview answers are not included.',profile:'primer-interview',onUse(text){
  const editor=document.querySelector('#questions textarea');
  if(!editor)throw Error('Open an answer editor first.');
  if(text.length>editor.maxLength)throw Error('The reply is longer than the answer limit.');
  editor.value=text;editor.dispatchEvent(new Event('input',{bubbles:true}));
}});
