from pathlib import Path
import re
root=Path.cwd(); out=root/'covers'; src=out/'src'
def write(p,s):
    with p.open('x',encoding='utf-8') as f:f.write(s)
def source(p):
    s=(root/p).read_text(encoding='utf-8')
    return re.sub(r'^import .*?;\s*','',s,flags=re.M).replace('export ','')
old=(src/'build.py').read_text(encoding='utf-8')
common=old.split("common=r'''",1)[1].split("'''",1)[0]
common+=r'''
function poly(points,col){ctx.fillStyle=col;ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.fill()}
function line(x,y,a,b,col,w){ctx.strokeStyle=col;ctx.lineWidth=w;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(a,b);ctx.stroke()}
function rr(x,y,w,h,r,col){roundRectPath(ctx,x,y,w,h,r);ctx.fillStyle=col;ctx.fill()}
function art(){ctx.save();ctx.translate(P?40:570,P?485:35);ctx.scale(P?1:.65,P?1:.65)}
function heading(a,b){if(P)title([a,b],[185,340],850,150,540);else title([a,b],[225,360],435,105,315)}
'''
draw=source('cristais/src/draw.js')
crystal=source('cristais/src/config.js')+'\n'+draw+'\n'+source('cristais/src/gem.js')+'\n'+source('cristais/src/shapes.js')+'\n'+source('cristais/src/cave.js').replace('const TAU = Math.PI * 2;','')
space=source('cosmos/src/config.js')+'\n'+draw+'\n'+source('cosmos/src/paint.js')+'\n'+source('cosmos/src/planets.js')+'\n'+source('cosmos/src/world.js')
robot='const PLAYER_SCALE=1;\n'+draw+'\n'+source('corrida/src/robot.js')
crystalart=r'''
let bg=ctx.createLinearGradient(0,0,W,H);bg.addColorStop(0,'#100c29');bg.addColorStop(.6,'#29205c');bg.addColorStop(1,'#071523');ctx.fillStyle=bg;ctx.fillRect(0,0,W,H);glow(W*.6,H*.65,800,'#5c3d9b66');
art();burst(500,515,1250,'#b9a4ff16');
for(const [x,y,hue,size,angle] of [[80,1040,188,5,.1],[940,1080,282,5,-.2],[30,160,312,3,2.6],[950,180,168,3,3.5]])drawCluster(ctx,{x,y,gx:x,gy:y-130,r:300,hue,size,angle});
ctx.save();ctx.translate(505,650);ctx.rotate(-.13);ctx.scale(2.48,2.25);ctx.translate(-180,-264);drawBoard(ctx);
const grid=[
[0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0],[0,0,0,0,6,6,0,0],[2,2,0,0,6,6,0,0],[4,4,4,4,0,0,8,0],[3,3,3,11,11,11,8,8],[9,0,0,0,0,0,0,10],[9,9,13,13,0,10,10,10]];
grid.forEach((row,r)=>row.forEach((v,c)=>{if(v)drawGem(ctx,20+c*40,104+r*40,40,gemColor(v))}));
for(let c=0;c<8;c++)drawGem(ctx,20+c*40,344,40,[196,88,52],{flash:.55});
trail(12,364,180,350,350,364,'#bfffff',10);ctx.restore();
glow(490,850,350,'#61eaffaa');burst(490,850,650,'#b4ffff33');
for(let i=0;i<35;i++){let x=80+(i*149%860),y=710+(i*91%350);ctx.save();ctx.translate(x,y);ctx.rotate(i*1.7);poly([[0,-22],[15,0],[3,23],[-12,7]],i%3?'#83f3ff':'#fff8ce');ctx.restore()}
glow(565,230,300,'#f075ff66');ctx.save();ctx.translate(370,135);ctx.rotate(.12);[[0,0],[1,0],[2,0],[1,1]].forEach(([c,r])=>drawGem(ctx,c*119,r*119,119,[292,76,60]));ctx.restore();
trail(655,385,710,480,660,550,'#fbc7ff',10);
[[200,250,26],[820,350,26],[300,900,30],[670,800,32],[790,1040,20]].forEach(s=>star(...s));ctx.restore();vignette();heading('BLOCOS','DE CRISTAL');
'''
spaceart=r'''
drawSpace(ctx,{x:0,y:0,w:W,h:H});glow(W*.65,H*.5,850,'#7333cd66');art();burst(500,450,1100,'#bca4ff1b');
ctx.save();ctx.translate(140,100);ctx.scale(2,1.65);ctx.translate(-42,-66);drawGlassBack(ctx);ctx.restore();
function planet(fn,x,y,r){ctx.save();ctx.translate(x,y);fn(ctx,r);shade(ctx,r,.8);ctx.restore()}
planet(drawRinged,365,925,145);planet(drawGasGiant,625,920,155);planet(drawMoon,217,765,78);planet(drawMeteor,750,787,70);planet(drawOcean,475,720,105);planet(drawRocky,690,650,83);
glow(490,430,410,'#fee9b9aa');burst(490,430,640,'#fff4bc55');
trail(125,295,280,290,410,420,'#ffc589',17);trail(865,295,720,290,580,420,'#ffc589',17);
planet(drawRocky,310,388,128);planet(drawRocky,677,388,128);
star(492,433,90,'#fffade');glow(495,210,270,'#84e9ff88');planet(drawOcean,495,155,155);
ctx.save();ctx.translate(140,100);ctx.scale(2,1.65);ctx.translate(-42,-66);drawGlassFront(ctx);ctx.restore();
[[145,520,24],[805,550,30],[660,70,25],[290,75,25],[450,540,18],[700,1050,20]].forEach(s=>star(...s));ctx.restore();vignette();heading('FUSÃO','CÓSMICA');
'''
robotart=r'''
let sky=ctx.createLinearGradient(0,0,0,H);sky.addColorStop(0,'#46358c');sky.addColorStop(.45,'#ec8aa1');sky.addColorStop(.75,'#ffc586');sky.addColorStop(1,'#685da3');ctx.fillStyle=sky;ctx.fillRect(0,0,W,H);
art();glow(530,350,500,'#ffebae99');ellipse(530,350,190,190,'#ffe9ae');burst(530,350,1300,'#fff3c51c');
for(let i=0;i<32;i++){let x=(i*217%1300)-150,y=410+(i*127%700);ellipse(x,y,115+i%4*26,35+i%3*17,i%2?'#fff0dc':'#b6a5db')}
poly([[455,390],[610,390],[1160,1180],[-180,1180]],'#444260');poly([[455,390],[610,390],[1110,1140],[-130,1140]],'#9b99c5');
line(455,390,-130,1140,'#bafaff',14);line(610,390,1110,1140,'#bafaff',14);
for(const t of [.333,.667])line(455+155*t,390,-130+1240*t,1140,'#eee4fa',7);
for(let i=0;i<7;i++){let y=450+i*i*15;line(425-(y-450)*.5,y,650+(y-450)*.6,y,'#ffffff33',4)}
// Yellow jump barrier and its dark hazard stripes, matching obstacles.js.
poly([[325,840],[705,840],[735,875],[295,875]],'#fff0a0');rr(295,875,440,115,14,'#f2a900');
for(let i=0;i<6;i++)poly([[310+i*70,974],[345+i*70,974],[385+i*70,891],[350+i*70,891]],'#2b2140');
// Purple drone with red sensor and downwards beam.
poly([[785,530],[815,530],[920,900],[680,900]],'#ff465a33');line(725,510,875,510,'#2a2350',13);ellipse(720,500,48,9,'#eeeaffaa');ellipse(880,500,48,9,'#eeeaffaa');ellipse(800,530,64,42,'#51468d');ellipse(800,540,23,23,'#ffd9de');ellipse(800,540,15,15,'#ff2d4a');
for(let i=0;i<7;i++){let x=180+i*42,y=930-i*77,r=43-i*3;ellipse(x,y,r*.8,r,'#b87513');ellipse(x-4,y-4,r*.72,r*.89,'#ffd94e');ellipse(x-5,y-6,r*.45,r*.66,'#ffed8c');star(x-12,y-24,12)}
// Exact game robot, enlarged and facing the viewer in a jump.
glow(510,640,270,'#c9fbff66');drawRobot(ctx,{x:520,y:820,scale:6.6,phase:1.3,time:.6,air:1,vy:1,slide:0,tilt:-.12,running:true,front:true,alpha:1,shield:false,magnet:false,crash:-1});
for(let i=0;i<12;i++){let x=i%2?70:960,y=500+i*52;line(x,y,x+(i%2?-150:150),y+130,'#fff4d866',5)}
[[310,480,28],[710,720,25],[185,1000,25],[900,1030,30]].forEach(s=>star(...s));ctx.restore();vignette();heading('CORRIDA','NAS NUVENS');
'''
for slug,lib,artwork in [('blocos-de-cristal',crystal,crystalart),('fusao-cosmica',space,spaceart),('corrida-nas-nuvens',robot,robotart)]:
 for orient,w,h in [('portrait',1080,1620),('landscape',1280,720)]:
  write(src/f'{slug}-{orient}.html',f'<!doctype html><meta charset="utf-8"><canvas width="{w}" height="{h}"></canvas><script>\n'+lib+'\n'+common+'\n'+artwork+'\n</script>')
renderer=(src/'render.mjs').read_text(encoding='utf-8')
renderer=renderer.replace("for(let file of fs.readdirSync(dir).filter(f=>f.endsWith('.html')))","for(let file of fs.readdirSync(dir).filter(f=>/^(blocos-de-cristal|fusao-cosmica|corrida-nas-nuvens)-.*\\.html$/.test(f)))")
renderer=renderer.replace("beginPath(){", "arcTo(x,y,a,b,r){this.lineTo(x,y)}\nclip(){let id='clip'+serial++;this.parts.push(`<defs><clipPath id=\"${id}\"><path transform=\"${this.s.transform}\" d=\"${this.path}\"/></clipPath></defs>`);this.s.clip=id}\nbeginPath(){")
renderer=renderer.replace("this.parts.push(`<${tag}","this.parts.push(`${this.s.clip?`<g clip-path=\"url(#${this.s.clip})\">`:''}<${tag}")
renderer=renderer.replace("${body}</${tag}>`)","${body}</${tag}>${this.s.clip?'</g>':''}`)")
# Refuse overwrite of any existing output, including from a rerun.
renderer=renderer.replace("fs.writeFileSync(new URL(file.replace('.html','.svg'),dir),svg)","fs.writeFileSync(new URL(file.replace('.html','.svg'),dir),svg,{flag:'wx'})")
renderer=renderer.replace("await sharp(Buffer.from(svg)).png().toFile", "if(fs.existsSync(output))throw new Error('Output already exists');await sharp(Buffer.from(svg)).png().toFile")
write(src/'render-new-games.mjs',renderer)
print('Six new self-contained canvas sources and SVG/Sharp renderer created.')
