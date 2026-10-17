import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {loadGamedudeFirmware} from '../web/gamedude-firmware.js';
const manifest=JSON.parse(await fs.readFile('web/firmware/gamedude.json','utf8'));
let corrupt=false,fail=false,badModel=false;
const fetcher=async url=>{
 if(fail)return new Response('',{status:503});
 if(url==='firmware/gamedude.json'){
  const data=structuredClone(manifest);if(badModel)data.models.fm1.product='SMK-37_983';
  return Response.json(data);
 }
 let file='web/'+url;
 if(url.includes('SMK-37_Pro_016'))file=process.argv[2];
 if(url.includes('SMK-37_Elite_016'))file=process.argv[3];
 const bytes=await fs.readFile(file);if(corrupt&&url.endsWith('.bin'))bytes[0]^=1;
 return new Response(bytes);
};
for(const model of ['fm1',...(process.argv[2]?['smk-pro','smk-elite']:[])]){
 const result=await loadGamedudeFirmware(model,fetcher);
 assert.equal(result.product,model==='fm1'?'FM-1_983':'SMK-37_983');assert(result.install);
}
corrupt=true;await assert.rejects(()=>loadGamedudeFirmware('fm1',fetcher),/verification failed/);corrupt=false;
fail=true;await assert.rejects(()=>loadGamedudeFirmware('fm1',fetcher),/download failed/);fail=false;
badModel=true;await assert.rejects(()=>loadGamedudeFirmware('fm1',fetcher),/release information/);
await assert.rejects(()=>loadGamedudeFirmware('unknown',fetcher),/Choose your instrument/);
console.log('PASS: automatic GameDude core selection, packaging, wrong-release, corrupt-core and failed-download rejection.');

badModel=false;
// Transient failures can happen before headers or partway through a body.
for(const broken of ['request','body']){
 const attempts=new Map(),status=[];
 const flaky=async(url,options)=>{
  const n=(attempts.get(url)||0)+1;attempts.set(url,n);
  if(url===manifest.models.fm1.file&&n===1){
   if(broken==='request')throw TypeError('Failed to fetch');
   return new Response(new ReadableStream({start(controller){controller.error(TypeError('Connection closed'));}}));
  }
  return fetcher(url,options);
 };
 const result=await loadGamedudeFirmware('fm1',flaky,{onStatus:s=>status.push(s)});
 assert.equal(result.product,'FM-1_983');assert.equal(attempts.get(manifest.models.fm1.file),2);
 assert.ok(status.some(s=>s.includes('attempt 2 of 3')));
}
let requests=0;
await assert.rejects(()=>loadGamedudeFirmware('fm1',async()=>{requests++;throw TypeError('Failed to fetch');}),/release information.*firmware\/gamedude.json.*No device update started/);
assert.equal(requests,3,'Network retries must be bounded');
requests=0;
await assert.rejects(()=>loadGamedudeFirmware('fm1',async()=>{requests++;return new Response('',{status:404});}),/download failed/);
assert.equal(requests,1,'Missing files should fail immediately');
console.log('PASS: interrupted request/body retries, bounded failures, specific file errors and preparation status.');
