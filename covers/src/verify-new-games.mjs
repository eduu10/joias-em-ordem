import fs from 'node:fs';
import {createRequire} from 'node:module';
const require=createRequire('C:/Users/eduu1/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json');
const sharp=require('sharp');
const dir=new URL('./',import.meta.url);
// Composition correction for this run's newly created landscape only.
const name='fusao-cosmica-landscape';
let svg=fs.readFileSync(new URL(name+'.svg',dir),'utf8');
svg=svg.replace(/font-size="([\d.]+)"/g,(_,s)=>`font-size="${Number(s)*.89}"`);
fs.writeFileSync(new URL(name+'.svg',dir),svg);
await sharp(Buffer.from(svg)).png().toFile(new URL('../'+name+'.png',dir).pathname.replace(/^\/([A-Z]:)/,'$1'));
let html=fs.readFileSync(new URL(name+'.html',dir),'utf8').replace('[225,360],435,105,315','[225,360],387,93.45,315');
fs.writeFileSync(new URL(name+'.html',dir),html);
const names=['blocos-de-cristal','fusao-cosmica','corrida-nas-nuvens'];
let tiles=[];let report=[];
for(const n of names)for(const o of ['portrait','landscape']){
 const p=new URL('../'+n+'-'+o+'.png',dir);const m=await sharp(p).metadata();
 const expected=o==='portrait'?[1080,1620]:[1280,720];
 if(m.width!==expected[0]||m.height!==expected[1])throw new Error('Wrong dimensions');
 report.push(`${n}-${o}.png: ${m.width} x ${m.height}`);
 const buf=await sharp(p).resize({width:200}).png().toBuffer();
 tiles.push({input:buf,left:tiles.length*210,top:0});
}
await sharp({create:{width:1260,height:300,channels:4,background:'#201834'}}).composite(tiles).png().toFile(new URL('new-games-thumbnail-check.png',dir).pathname.replace(/^\/([A-Z]:)/,'$1'));
fs.writeFileSync(new URL('new-games-verification.txt',dir),report.join('\n'),{flag:'wx'});
console.log(report.join('\n'));
