// Widget-local presentation state. This is not runtime adoption or durable history.
export class ChatSession {
  constructor(providers, notify = () => {}) {
    this.providers = new Map(providers.map(p => [p.id, p]));
    if (this.providers.size !== providers.length) throw Error('Duplicate provider ID');
    this.notify = notify; this.messages = []; this.generation = 0; this.pending = false;
  }
  select(id, model) {
    const provider = this.providers.get(id);
    if (!provider || !provider.models.includes(model)) throw Error('Provider or model unavailable');
    this.stop(); this.provider = provider; this.model = model; this.messages = []; this.notify();
  }
  stop() {
    this.generation++; this.controller?.abort(); this.pending = false;
    if (this.messages.at(-1)?.status === 'streaming') this.messages.at(-1).status = 'interrupted';
    this.notify();
  }
  disconnect() { this.stop(); this.provider = null; this.model = null; this.messages = []; this.notify(); }
  clear() { this.stop(); this.messages = []; this.notify(); }
  async send(text, retry = false) {
    if (this.pending) throw Error('A reply is already running');
    if (!this.provider?.stream) throw Error('No configured provider connection');
    if (!text.trim()) throw Error('Enter a message');
    if (retry) {
      if (!['failed', 'interrupted'].includes(this.messages.at(-1)?.status)) throw Error('Nothing to retry');
      this.messages.splice(-2);
    }
    const history = [];
    for (let i=0; i<this.messages.length; i+=2) {
      if(this.messages[i+1]?.status==='complete') for(const {role,content} of this.messages.slice(i,i+2)) history.push({role,content});
    }
    const user = {role:'user', content:text, status:'complete'};
    const reply = {role:'assistant', content:'', status:'streaming'};
    this.messages.push(user, reply); this.pending = true;
    const ticket = ++this.generation; this.controller = new AbortController(); this.notify();
    try {
      for await (const chunk of this.provider.stream({model:this.model, messages:[...history,{role:'user',content:text}], signal:this.controller.signal})) {
        if (ticket !== this.generation) return;
        if (typeof chunk !== 'string') throw Error('Invalid provider text chunk');
        reply.content += chunk; this.notify();
      }
      if (ticket === this.generation) reply.status = 'complete';
    } catch (e) {
      if (ticket === this.generation) { reply.status = 'failed'; reply.error = e.message; }
    } finally { if (ticket === this.generation) { this.pending = false; this.notify(); } }
  }
}
export function loadPreference(storage, namespace) {
  const raw = storage.getItem(`q.ux.chatbot:${namespace}`);
  if (!raw) return null;
  const value = JSON.parse(raw);
  if (typeof value.provider !== 'string' || typeof value.model !== 'string') throw Error('Invalid chat preferences');
  return {provider:value.provider, model:value.model};
}
export function savePreference(storage, namespace, provider, model) {
  storage.setItem(`q.ux.chatbot:${namespace}`, JSON.stringify({provider, model}));
}
