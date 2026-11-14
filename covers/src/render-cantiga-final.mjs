import fs from 'node:fs';
import {createRequire} from 'node:module';
const require=createRequire('C:/Users/eduu1/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json');
const sharp=require('sharp');
for(const [o,w,h] of [['portrait',1080,1620],['landscape',1280,720]]){
 const svg=fs.readFileSync(`covers/src/complete-a-cantiga-${o}-final.svg`);
 const png=await sharp(svg).png().toBuffer();
 const m=await sharp(png).metadata();if(m.width!==w||m.height!==h)throw Error('Dimensions');
 // These two PNGs were created by this task; no pre-existing assets are changed.
 fs.writeFileSync(`covers/complete-a-cantiga-${o}.png`,png);
 await sharp(png).resize({width:200}).png().toFile(`covers/src/complete-a-cantiga-${o}-final-200px.png`);
 console.log(o,m.width,m.height);
}
