import fs from 'node:fs';
import vm from 'node:vm';
import {createRequire} from 'node:module';
const require=createRequire('C:/Users/eduu1/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json');
const sharp=require('sharp');
let serial=0;
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;');
function color(v){return String(v).replace(/hsl\(([-.\d]+) ([-.\d]+)% ([-.\d]+)%(?: \/ ([-.\d]+))?\)/g,(_,h,s,l,a)=>{s/=100;l/=100;let f=n=>{let k=(n+h/30)%12;return Math.round(255*(l-s*Math.min(l,1-l)*Math.max(-1,Math.min(k-3,9-k,1))))};return a===undefined?`rgb(${f(0)},${f(8)},${f(4)})`:`rgba(${f(0)},${f(8)},${f(4)},${a})`})}
class Gradient{constructor(kind,args){this.kind=kind;this.args=args;this.stops=[];this.id='g'+serial++}addColorStop(n,c){this.stops.push([n,color(c)])}svg(){let a=this.args;return `<${this.kind} id="${this.id}" gradientUnits="userSpaceOnUse" ${this.kind==='linearGradient'?`x1="${a[0]}" y1="${a[1]}" x2="${a[2]}" y2="${a[3]}"`:`cx="${a[3]}" cy="${a[4]}" r="${a[5]}" fx="${a[0]}" fy="${a[1]}"`}>${this.stops.map(([n,c])=>`<stop offset="${n}" stop-color="${c}"/>`).join('')}</${this.kind}>`}}
class Canvas{constructor(w=300,h=150){this.width=w;this.height=h;this.ctx=new Context(this)}getContext(){return this.ctx}svg(){return `<svg xmlns="http://www.w3.org/2000/svg" width="${this.width}" height="${this.height}" viewBox="0 0 ${this.width} ${this.height}">${this.ctx.parts.join('')}</svg>`}}
class Context{
constructor(c){this.canvas=c;this.parts=[];this.path='';this.stack=[];this.s={transform:'',fillStyle:'#000',strokeStyle:'#000',lineWidth:1,globalAlpha:1,font:'10px Arial',textAlign:'start',textBaseline:'alphabetic'}}
save(){this.stack.push({...this.s})}restore(){this.s=this.stack.pop()}
translate(x,y){this.s.transform+=` translate(${x} ${y})`}scale(x,y){this.s.transform+=` scale(${x} ${y})`}rotate(a){this.s.transform+=` rotate(${a*180/Math.PI})`}
setTransform(a,b,c,d,e,f){this.s.transform=`matrix(${a} ${b} ${c} ${d} ${e} ${f})`}
arcTo(x,y,a,b,r){this.lineTo(x,y)}
clip(){let id='clip'+serial++;this.parts.push(`<defs><clipPath id="${id}"><path transform="${this.s.transform}" d="${this.path}"/></clipPath></defs>`);this.s.clip=id}
beginPath(){this.path='';this.current=false}closePath(){this.path+=' Z';this.current=true}moveTo(x,y){this.path+=` M${x} ${y}`;this.current=true}lineTo(x,y){this.path+=` ${this.current?'L':'M'}${x} ${y}`;this.current=true}
bezierCurveTo(...a){this.path+=' C'+a.join(' ')}quadraticCurveTo(...a){this.path+=' Q'+a.join(' ')}rect(x,y,w,h){this.path+=` M${x} ${y}h${w}v${h}h${-w}Z`}
arc(x,y,r,a,b,cc=false){this.ellipse(x,y,r,r,0,a,b,cc)}
ellipse(x,y,rx,ry,rot,a,b,cc=false){let pt=t=>[x+rx*Math.cos(t)*Math.cos(rot)-ry*Math.sin(t)*Math.sin(rot),y+rx*Math.cos(t)*Math.sin(rot)+ry*Math.sin(t)*Math.cos(rot)];let start=pt(a);this.path+=` ${this.current?'L':'M'}${start.join(' ')}`;this.current=true;let delta=b-a;if(Math.abs(delta)>=Math.PI*2-.0001)delta=cc?-Math.PI*2:Math.PI*2;else if(cc&&delta>0)delta-=Math.PI*2;else if(!cc&&delta<0)delta+=Math.PI*2;let count=Math.ceil(Math.abs(delta)/Math.PI);for(let i=1;i<=count;i++){let end=pt(a+delta*i/count);this.path+=` A${rx} ${ry} ${rot*180/Math.PI} 0 ${cc?0:1} ${end.join(' ')}`}}
paint(v){if(v instanceof Gradient){this.parts.push('<defs>'+v.svg()+'</defs>');return `url(#${v.id})`}return color(v)}
element(tag,attrs,fill=false,stroke=false,body=''){let f=fill?this.paint(this.s.fillStyle):'none',s=stroke?this.paint(this.s.strokeStyle):'none';this.parts.push(`${this.s.clip?`<g clip-path="url(#${this.s.clip})">`:''}<${tag} transform="${this.s.transform}" opacity="${this.s.globalAlpha}" fill="${f}" stroke="${s}" stroke-width="${this.s.lineWidth}" stroke-linejoin="round" stroke-linecap="round" ${attrs}>${body}</${tag}>${this.s.clip?'</g>':''}`)}
fill(){this.element('path',`d="${this.path}"`,true)}stroke(){this.element('path',`d="${this.path}"`,false,true)}fillRect(x,y,w,h){this.element('rect',`x="${x}" y="${y}" width="${w}" height="${h}"`,true)}
createLinearGradient(...a){return new Gradient('linearGradient',a)}createRadialGradient(...a){return new Gradient('radialGradient',a)}
drawImage(c,x,y,w,h){this.parts.push(`<g transform="${this.s.transform}"><svg x="${x}" y="${y}" width="${w}" height="${h}" viewBox="0 0 ${c.width} ${c.height}">${c.ctx.parts.join('')}</svg></g>`)}
measureText(t){let size=Number(this.s.font.match(/([\d.]+)px/)[1]);return {width:[...t].reduce((a,c)=>a+(/[IMi l]/.test(c)?.36:c==='Õ'||c==='O'? .81:.74),0)*size}}
text(t,x,y,stroke){let size=this.s.font.match(/([\d.]+)px/)[1];this.element('text',`x="${x}" y="${y}" font-family="Arial Black, Segoe UI, sans-serif" font-weight="900" font-size="${size}" text-anchor="${this.s.textAlign==='center'?'middle':'start'}" dominant-baseline="central"`,!stroke,stroke,esc(t))}fillText(...a){this.text(...a,false)}strokeText(...a){this.text(...a,true)}setLineDash(){}
}
for(let prop of ['fillStyle','strokeStyle','lineWidth','globalAlpha','font','textAlign','textBaseline','lineCap','lineJoin','shadowColor','shadowBlur'])Object.defineProperty(Context.prototype,prop,{get(){return this.s[prop]},set(v){this.s[prop]=v}});
const dir=new URL('./',import.meta.url);
for(let file of fs.readdirSync(dir).filter(f=>/^qual-e-a-melodia-.*\.html$/.test(f))){let html=fs.readFileSync(new URL(file,dir),'utf8');let [_,w,h]=html.match(/<canvas width="(\d+)" height="(\d+)"/);let canvas=new Canvas(+w,+h);let sandbox={document:{querySelector:()=>canvas,createElement:()=>new Canvas()},console};vm.runInNewContext(html.match(/<script>([\s\S]*)<\/script>/)[1],sandbox);let svg=canvas.svg();fs.writeFileSync(new URL(file.replace('.html','.svg'),dir),svg,{flag:'wx'});let output=new URL('../'+file.replace('.html','.png'),dir);if(fs.existsSync(output))throw new Error('Output already exists');await sharp(Buffer.from(svg)).png().toFile(output.pathname.replace(/^\/([A-Z]:)/,'$1'));console.log(file,+w,+h)}
