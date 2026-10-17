// SPDX-License-Identifier: GPL-3.0-only
import {buildFeluccaPackage,sha256hex} from './vendor/fm1pkg.js?v=20261013';
import {buildSmkPublicPackage} from './vendor/smk37-package.js';
import {SMK_MODELS,getSmkStock} from './smk-firmware.js?v=963';
import {prepareFirmwareFile} from './firmware-file.js?v=fm1current2';

export async function loadGamedudeFirmware(model,fetcher=fetch,{onStatus=()=>{}}={}){
 if(model!=='fm1'&&!SMK_MODELS[model])throw Error('Choose your instrument.');
 async function download(url,label){
  let failure;
  for(let attempt=1;attempt<=3;attempt++){
   onStatus((attempt===1?'Downloading ':'Retrying download: ')+label+(attempt===1?'…':' (attempt '+attempt+' of 3)…'));
   try{
    const response=await fetcher(url,{cache:'no-store',signal:AbortSignal.timeout(20000)});
    if(!response.ok){
     const error=Error('HTTP '+response.status);error.permanent=response.status>=400&&response.status<500&&![408,429].includes(response.status);throw error;
    }
    // A connection can fail after headers arrive. Retry the entire body too;
    // integrity validation below still runs before any MIDI access.
    return new Uint8Array(await response.arrayBuffer());
   }catch(error){failure=error;if(error.permanent||attempt===3)break;}
   await new Promise(resolve=>setTimeout(resolve,250*attempt));
  }
  throw Error('Firmware download failed: '+label+' ('+url+'). Reload this page and retry. No device update started.',{cause:failure});
 }
 const manifest=JSON.parse(new TextDecoder().decode(await download('firmware/gamedude.json','release information'))),release=manifest.models?.[model];
 const product=model==='fm1'?'FM-1_983':'SMK-37_983';
 if(manifest.version!==983||release?.product!==product||!/^firmware\/[a-z0-9-]+\.bin$/.test(release?.file)||!Number.isInteger(release?.bytes)||release.bytes<4||release.bytes>(model==='fm1'?204512:216800)||!/^[a-f0-9]{64}$/.test(release?.sha256))throw Error('GameDude Color release information is invalid. Reload the site and retry.');
 const app=await download(release.file,model==='fm1'?'FM-1 firmware':'SMK firmware');
 if(app.length!==release.bytes||await sha256hex(app)!==release.sha256)throw Error('GameDude Color firmware verification failed. Reload the site and retry.');
 let bytes;
 if(model==='fm1'){
  const stock=await download('firmware/fm1-original.fwsc','FM-1 installation base');
  onStatus('Verifying and preparing FM-1 firmware…');
  bytes=await buildFeluccaPackage(stock,app,product);
 }else{
  const stock=await getSmkStock(SMK_MODELS[model],fetcher);
  const built=await buildSmkPublicPackage(stock,app,{public:true,board:SMK_MODELS[model],product,version:'GAMEDUDE SMK 983',bytes:app.length,sha256:release.sha256});
  bytes=built.factory;
 }
 return prepareFirmwareFile(bytes,model);
}
