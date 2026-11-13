import fs from 'node:fs';
import {createRequire} from 'node:module';
const require=createRequire('C:/Users/eduu1/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json');
const sharp=require('sharp');let tiles=[],report=[];
for(const n of ['blocos-de-cristal','fusao-cosmica','corrida-nas-nuvens'])for(const o of ['portrait','landscape']){
const p='covers/'+n+'-'+o+'.png';const m=await sharp(p).metadata();const [w,h]=o==='portrait'?[1080,1620]:[1280,720];if(m.width!==w||m.height!==h)throw Error(p);report.push(`${p}: ${w} x ${h}`);tiles.push({input:await sharp(p).resize({width:200}).png().toBuffer(),left:tiles.length*210,top:0});}
await sharp({create:{width:1260,height:300,channels:4,background:'#201834'}}).composite(tiles).png().toFile('covers/src/new-games-thumbnail-check.png');fs.writeFileSync('covers/src/new-games-verification.txt',report.join('\n'),{flag:'wx'});console.log(report.join('\n'));
