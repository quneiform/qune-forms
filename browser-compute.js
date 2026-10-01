let instance;
const encoder=new TextEncoder(), decoder=new TextDecoder();
export async function computeLocally(request) {
  if(!instance) {
    const response=await fetch('/interview.wasm?v=c1eac2477268ec67');
    if(!response.ok) throw Error('Interview computation could not load. No answers were sent.');
    ({instance}=await WebAssembly.instantiate(await response.arrayBuffer(),{}));
  }
  const {alloc,compute,release,memory}=instance.exports;
  const input=encoder.encode(JSON.stringify(request));
  const ptr=alloc(input.length); new Uint8Array(memory.buffer,ptr,input.length).set(input);
  const packed=compute(ptr,input.length); // consumes the input allocation
  const outputPtr=Number(packed & 0xffffffffn), outputLen=Number(packed >> 32n);
  let output;
  try { output=JSON.parse(decoder.decode(new Uint8Array(memory.buffer,outputPtr,outputLen))); }
  finally { release(outputPtr,outputLen); }
  if(output.error) throw Error(output.error);
  return output;
}
