from pathlib import Path
import re
root=Path(__file__).resolve().parents[2]
out=root/'covers'
def source(p):
    s=(root/p).read_text(encoding='utf-8')
    s=re.sub(r'^import .*?;\s*','',s,flags=re.M)
    return s.replace('export ','')
gem='\n'.join(source(p) for p in ['game/src/config.js','game/src/draw.js','game/src/sprites.js','game/src/jars.js','game/src/background.js'])
world=source('guardioes/src/world.js').replace('const TAU = Math.PI * 2;','')
actors=source('guardioes/src/actors.js')
# The level seal is intentionally omitted: the cover contains only the title.
actors=actors[:actors.index('  // Selo com o nivel.')]+'};\n'+actors[actors.index('const enemyHue'):]
wizard=source('guardioes/src/config.js')+'\n'+source('guardioes/src/draw.js')+'\n'+actors+'\n'+world.replace('const noise =','const worldNoise =').replace('noise(', 'worldNoise(')
common=r'''
const c=document.querySelector('canvas'),ctx=c.getContext('2d');
const W=c.width,H=c.height,P=H>W;
function ellipse(x,y,rx,ry,color){ctx.fillStyle=color;ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fill()}
function glow(x,y,r,color){const g=ctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,color);g.addColorStop(1,'transparent');ctx.fillStyle=g;ctx.fillRect(x-r,y-r,r*2,r*2)}
function star(x,y,r,color='#fff6ba'){ctx.save();ctx.translate(x,y);ctx.fillStyle=color;ctx.shadowColor=color;ctx.shadowBlur=20;ctx.beginPath();for(let i=0;i<8;i++){let a=i*Math.PI/4,rr=i%2?r*.19:r;ctx.lineTo(Math.cos(a)*rr,Math.sin(a)*rr)}ctx.closePath();ctx.fill();ctx.restore()}
function burst(x,y,r,color){ctx.save();ctx.translate(x,y);for(let i=0;i<26;i++){ctx.rotate(Math.PI*2/26);ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(r,-r*.028);ctx.lineTo(r,r*.028);ctx.fill()}ctx.restore()}
function trail(ax,ay,bx,by,cx,cy,color,width){ctx.save();ctx.lineCap='round';ctx.shadowColor=color;ctx.shadowBlur=22;ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(ax,ay);ctx.quadraticCurveTo(bx,by,cx,cy);ctx.stroke();ctx.strokeStyle='#fffde6';ctx.lineWidth=width*.28;ctx.stroke();ctx.restore()}
function title(lines,ys,maxWidth,size,x){ctx.save();ctx.textAlign='center';ctx.textBaseline='middle';ctx.lineJoin='round';lines.forEach((line,i)=>{ctx.font=`1000 ${size}px "Arial Black", "Segoe UI", sans-serif`;let s=size*Math.min(1,maxWidth/ctx.measureText(line).width);ctx.font=`1000 ${s}px "Arial Black", "Segoe UI", sans-serif`;ctx.shadowColor='#9d56ff';ctx.shadowBlur=30;ctx.strokeStyle='#190b38';ctx.lineWidth=23;ctx.strokeText(line,x,ys[i]+8);ctx.shadowBlur=0;ctx.strokeStyle='#190b38';ctx.lineWidth=17;ctx.strokeText(line,x,ys[i]);ctx.strokeStyle='#ffe5a3';ctx.lineWidth=3;ctx.strokeText(line,x,ys[i]);let g=ctx.createLinearGradient(0,ys[i]-s*.5,0,ys[i]+s*.5);g.addColorStop(0,'#ffffff');g.addColorStop(.45,'#fff5b9');g.addColorStop(1,'#ffbb36');ctx.fillStyle=g;ctx.fillText(line,x,ys[i])});ctx.restore()}
function vignette(){let g=ctx.createRadialGradient(W*.52,H*.55,W*.25,W*.5,H*.5,Math.max(W,H)*.7);g.addColorStop(0,'transparent');g.addColorStop(1,'#06051b8a');ctx.fillStyle=g;ctx.fillRect(0,0,W,H)}
function scene(){ctx.save();ctx.translate(P?0:540,P?490:55);ctx.scale(P?1.08:.68,P?1.08:.68)}
'''
gemscene=r'''
drawBackground(ctx,{width:W,height:H},0);glow(W*.58,H*.57,W*.7,'#a450ff88');
scene();burst(520,440,850,'#dca4ff15');
for(let i=0;i<24;i++){let x=(Math.sin(i*12.5)*.5+.5)*1000,y=(Math.cos(i*4.2)*.5+.5)*1000;ellipse(x,y,18+i%4*11,18+i%4*11,'#e0b4ff12')}
function jar(x,y,a,colors,done=false){ctx.save();ctx.translate(x,y);ctx.rotate(a);const j={x:-100,y:0,w:200,h:690,cx:0};drawJarBack(ctx,j,165);colors.forEach((col,i)=>drawGem(ctx,col,0,580-i*174,177,1));drawJarFront(ctx,j,165,{done,pulse:.7});ctx.restore()}
jar(220,195,-.19,[1,0,2,4]);jar(760,240,.19,[3,3,3,3],true);jar(480,300,.025,[5,7,8]);
trail(240,125,480,-85,710,120,'#fff1a9',21);glow(550,85,200,'#ffcf5380');
ctx.save();ctx.translate(550,85);ctx.rotate(.2);drawGem(ctx,2,0,0,225,1);ctx.restore();
drawGem(ctx,6,110,860,190,1);drawGem(ctx,0,895,865,205,1);
[[380,80,30],[665,35,22],[690,240,30],[130,390,19],[780,710,30],[355,835,23],[480,210,15],[890,380,18]].forEach(s=>star(...s));ctx.restore();
vignette();
if(P)title(['JOIAS','EM ORDEM'],[175,335],790,170,540);else{title(['JOIAS','EM ORDEM'],[180,310],335,116,310);glow(250,570,200,'#a769ff50');drawGem(ctx,0,180,555,175,1);drawGem(ctx,1,340,590,150,1);star(420,495,25)}
'''
wizscene=r'''
let bg=ctx.createLinearGradient(0,0,0,H);bg.addColorStop(0,'#164c53');bg.addColorStop(.4,'#8fd45a');bg.addColorStop(1,'#4fae45');ctx.fillStyle=bg;ctx.fillRect(0,0,W,H);
scene();drawGround(ctx,{x:-2000,y:-2000,w:5000,h:5000});
// Recompose the original game's winding road for the cover's camera.
ctx.lineJoin=ctx.lineCap='round';for(const [color,width] of [['#54743b',170],['#8a6436',151],['#d8b27a',130],['#e7c893',91]]){ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(900,180);ctx.bezierCurveTo(1080,430,580,390,740,660);ctx.bezierCurveTo(850,870,480,970,170,875);ctx.stroke()}
function at(x,y,s,fn){ctx.save();ctx.translate(x,y);ctx.scale(s,s);fn();ctx.restore()}
at(865,185,2.2,()=>{ctx.translate(-PATH[0][0],-PATH[0][1]);drawCave(ctx)});
at(120,915,2.3,()=>{ctx.translate(-BASE.x,-BASE.y);drawCastle(ctx)});
[[60,430],[945,775],[85,690],[965,330]].forEach(([x,y])=>at(x,y,2.5,()=>drawTree(ctx,0,0)));
for(let i=0;i<10;i++){let y=285+i*45,x=850+Math.sin(i*1.3)*85;at(x,y,1.7+i*.13,()=>drawEnemy(ctx,{id:i,boss:false,maxHp:i%2?13:2,hp:i%2?13:2},0,0,.2))}
at(798,755,7,()=>drawEnemy(ctx,{id:8,boss:true,maxHp:100,hp:100},0,0,.2));
glow(435,505,390,'#b5ffb8dd');burst(435,500,620,'#fff7ab33');
trail(170,760,120,490,420,470,'#a7f2ff',25);trail(390,840,660,690,460,455,'#a7f2ff',25);
function hero(x,y,s,t){at(x,y,s,()=>{drawPedestal(ctx,{x:0,y:3});ctx.save();ctx.shadowColor='#e8fff1';ctx.shadowBlur=5;drawHero(ctx,0,0,t,{time:0});ctx.restore()})}
hero(185,800,4.1,1);hero(405,920,4.1,1);hero(430,590,6.9,2);
[[410,165,26],[610,450,24],[540,640,23],[200,505,18],[565,785,24],[340,700,22]].forEach(s=>star(...s));
ctx.restore();vignette();
if(P)title(['GUARDIÕES','DA FUSÃO'],[180,340],895,151,540);else{glow(260,235,470,'#100c46e8');title(['GUARDIÕES','DA FUSÃO'],[175,300],410,103,315);star(240,515,30);star(420,475,26)}
'''
for slug,lib,art in [('joias-em-ordem',gem,gemscene),('guardioes-da-fusao',wizard,wizscene)]:
    for orientation,w,h in [('portrait',1080,1620),('landscape',1280,720)]:
        html=f'<!doctype html><meta charset="utf-8"><style>*{{margin:0}}html,body{{width:{w}px;height:{h}px;overflow:hidden}}canvas{{display:block}}</style><canvas width="{w}" height="{h}"></canvas><script>\n'+lib+'\n'+common+'\n'+art+'\ndocument.title="Rendered";</script>'
        (out/'src'/f'{slug}-{orientation}.html').write_text(html,encoding='utf-8')
print('Wrote four self-contained HTML canvas sources.')
