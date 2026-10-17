function chooseEntry(entries){
  if(entries.length===1)return Promise.resolve(0);
  return new Promise(resolve=>{
    const dialog=document.createElement('dialog'),form=document.createElement('form');form.method='dialog';
    const title=document.createElement('h2');title.textContent='Choose a cartridge';
    const label=document.createElement('label');label.textContent='This archive contains multiple versions.';
    const select=document.createElement('select');select.setAttribute('aria-label','Cartridge in archive');select.style.cssText='display:block;max-width:100%;margin:1rem 0';
    entries.forEach((entry,i)=>select.add(new Option(`${entry.name} (${Math.ceil(entry.size/1024)} KiB)`,String(i))));
    const verified=entries.findIndex(e=>e.name.includes('[!]'));select.value=String(Math.max(0,verified));
    const open=document.createElement('button');open.textContent='Open cartridge';open.value='open';
    const cancel=document.createElement('button');cancel.textContent='Cancel';cancel.value='cancel';cancel.style.marginLeft='1rem';
    label.append(select);form.append(title,label,open,cancel);dialog.append(form);dialog.style.cssText='max-width:min(90vw,700px);border-radius:12px;padding:24px';document.body.append(dialog);
    dialog.addEventListener('close',()=>{const index=dialog.returnValue==='open'?Number(select.value):null;dialog.remove();resolve(index);},{once:true});
    dialog.showModal();select.focus();
  });
}
export function sevenzip(buffer){
  if(buffer.byteLength>16777216)return Promise.reject(Error('Archive exceeds 16 MiB. Extract a cartridge first.'));
  return new Promise((resolve,reject)=>{
    const worker=new Worker(new URL('./sevenzip-worker.js',import.meta.url),{type:'module'});let timer;
    const finish=(error,result)=>{clearTimeout(timer);worker.terminate();error?reject(Error(error)):resolve(result);};
    const arm=()=>{timer=setTimeout(()=>finish('7z extraction timed out. Try extracting the cartridge first.'),30000);};
    worker.onerror=event=>{console.error('7z reader:',event.message);finish('Could not load the 7z reader. Reload the page and try again.');};
    worker.onmessage=async({data})=>{
      clearTimeout(timer);
      if(data.error)return finish(data.error);
      if(data.buffer)return finish(null,data.buffer);
      const index=await chooseEntry(data.entries);
      if(index===null)return finish('Cartridge selection cancelled.');
      arm();worker.postMessage({index});
    };
    arm();worker.postMessage({buffer});
  });
}
