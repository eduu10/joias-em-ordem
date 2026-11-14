import fs from 'node:fs';
import {createRequire} from 'node:module';
const require=createRequire('C:/Users/eduu1/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json');
const sharp=require('sharp');
const results=[];
for (const [o,w,h] of [['portrait',1080,1620],['landscape',1280,720]]) {
 const p=`covers/qual-e-a-melodia-${o}.png`;const m=await sharp(p).metadata();
 if(m.width!==w||m.height!==h)throw Error('Wrong dimensions');
 results.push(`${p}: ${m.width} x ${m.height}`);
 await sharp(p).resize({width:200}).png().toFile(`covers/src/qual-e-a-melodia-${o}-200px.png`);
}
fs.writeFileSync('covers/src/melodia-verification.txt',results.join('\n'),{flag:'wx'});
console.log(results.join('\n'));
