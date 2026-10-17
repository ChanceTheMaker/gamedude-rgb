import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {Worker} from 'node:worker_threads';

// Run the production browser worker with only its messaging interface adapted.
async function extract(bytes,index=0){
  const module=new URL('../web/sevenzip-worker.js',import.meta.url).href;
  const source=`import {parentPort} from 'node:worker_threads';
    globalThis.self={postMessage:(data,transfer)=>parentPort.postMessage(data,transfer)};
    await import(${JSON.stringify(module)});
    parentPort.on('message',data=>self.onmessage({data}));`;
  const worker=new Worker(new URL('data:text/javascript,'+encodeURIComponent(source)));
  try{return await new Promise((resolve,reject)=>{
    const timer=setTimeout(()=>reject(Error('Archive worker timed out')),10000);let entries;
    worker.on('error',e=>{clearTimeout(timer);reject(e);});
    worker.on('message',data=>{
      if(data.error){clearTimeout(timer);reject(Error(data.error));}
      else if(data.entries){entries=data.entries;worker.postMessage({index});}
      else {clearTimeout(timer);resolve({entries,bytes:new Uint8Array(data.buffer)});}
    });
    worker.postMessage({buffer:bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength)});
  });}finally{await worker.terminate();}
}
// Fixture contains two copies of our original diagnostic, compressed together.
const archive=await readFile(new URL('fixtures/cartridge-variants.7z',import.meta.url));
const expected=await readFile(new URL('../web/diagnostic.gb',import.meta.url));
for(const index of [0,1]){
  const result=await extract(archive,index);
  assert.equal(result.entries.length,2);
  assert.deepEqual(Buffer.from(result.bytes),expected);
}
await assert.rejects(extract(archive,99),/Choose a cartridge/);
await assert.rejects(extract(archive.subarray(0,12)),/damaged/);
console.log('PASS: real 7z worker, solid archive, multiple variants, spaced filenames, exact bytes, invalid selection and damaged archive.');
