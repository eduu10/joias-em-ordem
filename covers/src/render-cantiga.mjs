import fs from 'node:fs';
import {createRequire} from 'node:module';
const require=createRequire('C:/Users/eduu1/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json');
const sharp=require('sharp');
const report=[];
for(const [o,w,h] of [['portrait',1080,1620],['landscape',1280,720]]){
 const source=new URL(`complete-a-cantiga-${o}.svg`,import.meta.url);
 const dest=new URL(`../complete-a-cantiga-${o}.png`,import.meta.url);
 if(fs.existsSync(dest))throw Error('Refusing existing PNG');
 await sharp(fs.readFileSync(source)).png().toFile(dest.pathname.replace(/^\/([A-Z]:)/,'$1'));
 const m=await sharp(fs.readFileSync(dest)).metadata();
 if(m.width!==w||m.height!==h)throw Error('Wrong size');
 const preview=new URL(`complete-a-cantiga-${o}-200px.png`,import.meta.url);
 if(fs.existsSync(preview))throw Error('Refusing existing preview');
 await sharp(fs.readFileSync(dest)).resize({width:200}).png().toFile(preview.pathname.replace(/^\/([A-Z]:)/,'$1'));
 report.push(`${o}: ${m.width} x ${m.height}`);
}
fs.writeFileSync(new URL('cantiga-verification.txt',import.meta.url),report.join('\n'),{flag:'wx'});
console.log(report.join('\n'));
