// The publication host replaces this registry with authorized connections.
// No keys, discovery requests, or provider connections are inferred by the app.
export const providers = [
  {id:'openai',label:'OpenAI · not configured',models:[],local:false,destination:'Not configured'},
  {id:'claude',label:'Claude · not configured',models:[],local:false,destination:'Not configured'},
  {id:'gemini',label:'Gemini · not configured',models:[],local:false,destination:'Not configured'},
  {id:'local',label:'Local model · not configured',models:[],local:true,destination:'Not configured'}
];
