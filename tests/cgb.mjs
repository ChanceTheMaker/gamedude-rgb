import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {cartridge,crc32} from '../web/zip.js';
import {validateHardwareRom,prepareFirmware} from '../web/rom-firmware.js';
import {createHash} from 'node:crypto';
const hash=b=>createHash('sha256').update(b).digest('hex');
const metadata=JSON.parse(await fs.readFile('tests/fixtures/cgb-acid2.json','utf8'));
const wasm=await fs.readFile('web/gb.wasm');
for(const [file,color] of [['tests/fixtures/cgb-acid2.gbc',true],['web/homebrew/flooder.gb',true],['web/diagnostic.gb',false]]){
 const rom=await fs.readFile(file),{instance:{exports:e}}=await WebAssembly.instantiate(wasm,{});
 if(file.includes('acid2'))assert.equal(hash(rom),metadata.rom_sha256);
 new Uint8Array(e.memory.buffer,e.gp_upload(),rom.length).set(rom);
 assert.equal(e.gp_load_upload(rom.length),0);assert.equal(Boolean(e.gp_color_mode()),color);
 for(let frame=0;frame<600;frame++){
  e.gp_buttons(file.includes('flooder')&&frame>=60&&frame<65?8:0);
  assert.equal(e.gp_frame(),1,`${file} frame ${frame}`);e.gp_render_audio(e.gp_audio_queued());
 }
 const bytes=new Uint8Array(e.memory.buffer,e.gp_pixels(),46080);
 if(file.includes('acid2'))assert.equal(hash(bytes),metadata.rgb565_sha256,'Every CGB Acid2 pixel must match the independent reference');
 if(color)assert(new Set(new Uint16Array(bytes.buffer,bytes.byteOffset,23040)).size>4);
 e.gp_reset();assert.equal(Boolean(e.gp_color_mode()),color);assert.equal(e.gp_frame(),1);
 console.log('PASS:',file,'600 frames, color mode, reset'+(file.includes('acid2')?', exact Acid2 reference':''));
}

// A .gbc entry must survive ZIP extraction and hardware validation unchanged.
const rom=new Uint8Array(await fs.readFile('tests/fixtures/cgb-acid2.gbc'));
const name=new TextEncoder().encode('Color.GBC'),local=new Uint8Array(30+name.length+rom.length),lv=new DataView(local.buffer);
lv.setUint32(0,0x04034b50,true);lv.setUint32(14,crc32(rom),true);lv.setUint32(18,rom.length,true);lv.setUint32(22,rom.length,true);lv.setUint16(26,name.length,true);local.set(name,30);local.set(rom,30+name.length);
const central=new Uint8Array(46+name.length),cv=new DataView(central.buffer);
cv.setUint32(0,0x02014b50,true);cv.setUint32(16,crc32(rom),true);cv.setUint32(20,rom.length,true);cv.setUint32(24,rom.length,true);cv.setUint16(28,name.length,true);central.set(name,46);
const zip=new Uint8Array(local.length+central.length+22);zip.set(local);zip.set(central,local.length);
const end=new DataView(zip.buffer,local.length+central.length);end.setUint32(0,0x06054b50,true);end.setUint16(8,1,true);end.setUint16(10,1,true);end.setUint32(12,central.length,true);end.setUint32(16,local.length,true);
const unpacked=new Uint8Array(await cartridge(zip.buffer));assert.deepEqual(unpacked,rom);validateHardwareRom(unpacked);
await assert.rejects(()=>prepareFirmware(rom,null,null),/legacy DMG template/);
console.log('PASS: .GBC ZIP extraction, Color hardware validation, legacy DMG template rejection');
