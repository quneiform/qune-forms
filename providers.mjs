// The host supplies an authorized transport; adapters never obtain credentials.
// Transport accepts a protocol request and returns a Fetch Response.
export function providerAdapter({id, label, models, local=false, destination, protocol, transport}) {
  if(!['openai','claude','gemini','ollama','chat-completions'].includes(protocol))throw Error('Unsupported protocol');
  return {id,label,models,local,destination,async *stream({model,messages,signal}) {
    if(!models.includes(model))throw Error('Model unavailable');
    const body=protocol==='openai'?{model,input:messages,stream:true,store:false}
      :protocol==='claude'?{model,messages,stream:true,max_tokens:2048}
      :protocol==='gemini'?{contents:messages.map(m=>({role:m.role==='assistant'?'model':'user',parts:[{text:m.content}]}))}
      :{model,messages,stream:true};
    const response=await transport({protocol,model,body,signal});
    if(!response.ok)throw Error(`Provider request failed (${response.status})`);
    if(!response.body)throw Error('Provider returned no stream');
    let completed=false;
    for await(const data of records(response.body,protocol==='ollama')) {
      if(signal.aborted)throw new DOMException('Stopped','AbortError');
      if(data==='[DONE]'){if(protocol==='chat-completions')completed=true;continue;}
      const event=JSON.parse(data);
      if(event.error || event.type==='error' || ['response.failed','response.incomplete'].includes(event.type))throw Error('Provider reported an incomplete or failed response');
      if(protocol==='openai') {
        if(event.type==='response.output_text.delta' || event.type==='response.refusal.delta')yield event.delta;
        if(event.type==='response.completed')completed=true;
      } else if(protocol==='claude') {
        if(event.type==='content_block_delta' && event.delta?.type==='text_delta')yield event.delta.text;
        if(event.type==='message_stop')completed=true;
      } else if(protocol==='gemini') {
        const candidate=event.candidates?.[0];
        if(event.promptFeedback?.blockReason)throw Error('Provider blocked the prompt');
        for(const part of candidate?.content?.parts || [])if(part.text && !part.thought)yield part.text;
        if(candidate?.finishReason){if(candidate.finishReason!=='STOP')throw Error(`Provider stopped: ${candidate.finishReason}`);completed=true;}
      } else if(protocol==='chat-completions') {
        const choice=event.choices?.[0];
        if(choice?.delta?.content)yield choice.delta.content;
        if(choice?.finish_reason && choice.finish_reason!=='stop')throw Error(`Provider stopped: ${choice.finish_reason}`);
      } else {
        if(event.message?.content)yield event.message.content;
        if(event.done)completed=true;
      }
    }
    if(!completed)throw Error('Provider stream ended before completion');
  }};
}
async function* records(stream, ndjson) {
  const reader=stream.getReader(), decoder=new TextDecoder();let buffer='',data=[];
  try {
    for(;;){const {value,done}=await reader.read();buffer+=done?decoder.decode():decoder.decode(value,{stream:true});
      let newline;
      while((newline=buffer.indexOf('\n'))>=0){const line=buffer.slice(0,newline).replace(/\r$/,'');buffer=buffer.slice(newline+1);
        if(ndjson){if(line.trim())yield line;}else if(line===''){if(data.length){yield data.join('\n');data=[];}}else if(line.startsWith('data:'))data.push(line.slice(5).replace(/^ /,''));
      }
      if(buffer.length>1_000_000)throw Error('Provider record exceeds limit');
      if(done){if(ndjson&&buffer.trim())yield buffer;else if(data.length)yield data.join('\n');break;}
    }
  } finally {await reader.cancel();reader.releaseLock();}
}
