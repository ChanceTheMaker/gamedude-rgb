// Keep decompression off the UI thread, including solid archives with variants.
import SevenZip from './vendor/7zip/7zz.es6.js';
let zip, entries, output=[];
const run=args=>{output=[];const code=zip.callMain([args[0],'-bsp0',...args.slice(1)]);if(code>1)throw Error('Cannot open this 7z archive. It may be damaged or password-protected.');return output.join('\n');};
self.onmessage=async({data})=>{
  try{
    if(data.buffer){
      zip=await SevenZip({print:s=>output.push(s),printErr:s=>output.push(s),stdin:()=>null,
        locateFile:name=>new URL('./vendor/7zip/'+name,import.meta.url).href});
      zip.FS.writeFile('/game.7z',new Uint8Array(data.buffer));
      const listing=run(['l','-slt','-ba','-pGameDude-no-password','/game.7z']);
      entries=listing.split(/\r?\n\s*\r?\n/).map(block=>{
        const fields=Object.fromEntries(block.split(/\r?\n/).filter(l=>l.includes(' = ')).map(l=>{const i=l.indexOf(' = ');return [l.slice(0,i),l.slice(i+3)];}));
        return {name:fields.Path,size:Number(fields.Size),encrypted:fields.Encrypted==='+'};
      }).filter(e=>e.name&&/\.gbc?$/i.test(e.name));
      if(!entries.length)throw Error('This 7z archive contains no .gb or .gbc cartridge.');
      if(entries.length>1000)throw Error('This archive has too many cartridges. Choose a smaller archive.');
      self.postMessage({entries});
    }else{
      const entry=entries?.[data.index];
      if(!entry)throw Error('Choose a cartridge from this archive.');
      if(entry.encrypted)throw Error('Password-protected cartridges are unsupported.');
      if(!Number.isSafeInteger(entry.size)||entry.size<1||entry.size>8388608)throw Error('Cartridge exceeds the simulator limit of 8 MiB.');
      zip.FS.mkdir('/out');
      run(['e','-y','-spd','-pGameDude-no-password','-o/out','--','/game.7z',entry.name]);
      const files=zip.FS.readdir('/out').filter(n=>n!=='.'&&n!=='..');
      if(files.length!==1)throw Error('Could not extract the selected cartridge.');
      const bytes=zip.FS.readFile('/out/'+files[0]);
      if(bytes.length!==entry.size)throw Error('7z cartridge size mismatch.');
      self.postMessage({buffer:bytes.buffer},[bytes.buffer]);
    }
  }catch(e){self.postMessage({error:e.message||'Could not unpack this 7z archive.'});}
};
