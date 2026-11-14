from pathlib import Path
import re

root = Path(__file__).resolve().parents[2]
src = root / 'covers/src'

def write(path, content):
    with path.open('x', encoding='utf-8') as f:
        f.write(content)

def source(name):
    text = (root / 'melodia/src' / name).read_text(encoding='utf-8')
    text = re.sub(r'^import .*?;\s*', '', text, flags=re.M).replace('export ', '')
    return text.replace('const TAU = Math.PI * 2;', '')

common = (src / 'build.py').read_text(encoding='utf-8').split("common=r'''", 1)[1].split("'''", 1)[0]
lib = 'const TAU=Math.PI*2;\n' + '\n'.join(source(n) for n in ['config.js', 'draw.js', 'stage.js', 'mascot.js'])
# Preserve the actual game's rounded silhouettes in the SVG canvas adapter.
lib += r'''
roundRectPath = (ctx,x,y,w,h,r) => {
 r=Math.min(r,w/2,h/2);ctx.beginPath();ctx.moveTo(x+r,y);ctx.lineTo(x+w-r,y);
 ctx.quadraticCurveTo(x+w,y,x+w,y+r);ctx.lineTo(x+w,y+h-r);ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
 ctx.lineTo(x+r,y+h);ctx.quadraticCurveTo(x,y+h,x,y+h-r);ctx.lineTo(x,y+r);ctx.quadraticCurveTo(x,y,x+r,y);ctx.closePath();
};
'''
# The original export is const; make only this local copy assignable.
lib = lib.replace('const roundRectPath =', 'let roundRectPath =')
art = r'''
drawBackdrop(ctx,{width:W,height:H,ratio:1},3.2,.9);
glow(W*.66,H*.53,700,'#ab48ff44');
ctx.save();ctx.translate(P?30:590,P?470:30);ctx.scale(P?1:.61,P?1:.61);
burst(510,430,1150,'#fff0bf18');glow(510,430,500,'#ff7ad155');
drawEqualiser(ctx,{x:65,y:155,w:890,h:650},Array.from({length:30},(_,i)=>.35+.6*Math.abs(Math.sin(i*.61))),1.2);
// Large vinyl, with the game's grooves, wedge reflections and gradient label.
drawVinyl(ctx,510,415,302,-.35,176,.8);
ctx.strokeStyle='#3df5e0';ctx.lineWidth=5;ctx.beginPath();ctx.arc(510,415,308,.25,5.7);ctx.stroke();
drawNoteGlyph(ctx,510,412,110,'#fff2b0',true);
// Music bursts use the exact note glyph from stage.js.
for(const [x,y,s,a,col,d] of [[155,200,85,-.25,'#ffd24a',true],[795,170,95,.24,'#3df5e0',true],[895,390,78,.2,'#ff7ad1',false],[380,60,60,-.2,'#ff7ad1',false],[90,460,65,-.3,'#3df5e0',false]]){
ctx.save();ctx.translate(x,y);ctx.rotate(a);drawNoteGlyph(ctx,0,0,s,col,d);ctx.restore();}
glow(285,650,240,'#ffb05c55');drawPlayer(ctx,285,630,190,{mood:MOOD.HAPPY,time:1});
drawRobot(ctx,755,610,161,{mood:MOOD.THINK,time:1});
function answer(x,y,angle,top,bottom,edge,d){
ctx.save();ctx.translate(x,y);ctx.rotate(angle);
roundRectPath(ctx,-190,-64+9,380,128,28);ctx.fillStyle=edge;ctx.fill();
let g=ctx.createLinearGradient(0,-64,0,64);g.addColorStop(0,top);g.addColorStop(1,bottom);
roundRectPath(ctx,-190,-64,380,128,28);ctx.fillStyle=g;ctx.fill();ctx.strokeStyle='#ffffff99';ctx.lineWidth=3;ctx.stroke();
roundRectPath(ctx,-177,-54,354,39,20);ctx.fillStyle='#ffffff20';ctx.fill();
drawNoteGlyph(ctx,0,-3,53,'#fff9e8',d);ctx.restore();}
answer(290,875,-.13,'#ffe98a','#ffb02e','#a95c0c',false);
answer(720,875,.13,'#9af9f0','#28cfc0','#087e79',true);
answer(290,1033,-.08,'#ff9ce0','#dc4f9b','#7e245e',true);
answer(720,1033,.08,'#c8b4ff','#8860d6','#463071',false);
[[80,720,22],[930,750,26],[620,70,25],[415,760,20],[840,290,18],[540,1130,25],[110,1110,17]].forEach(s=>star(...s));
ctx.restore();vignette();
if(P)title(['QUAL É A','MELODIA?'],[185,345],880,151,540);
else {glow(265,315,420,'#150a38bb');title(['QUAL É A','MELODIA?'],[245,365],420,83,323);star(300,495,27);drawNoteGlyph(ctx,180,535,43,'#3df5e0',true);drawNoteGlyph(ctx,420,545,40,'#ff7ad1');}
'''
for orient,w,h in [('portrait',1080,1620),('landscape',1280,720)]:
    write(src/f'qual-e-a-melodia-{orient}.html',f'<!doctype html><meta charset="utf-8"><canvas width="{w}" height="{h}"></canvas><script>\n'+lib+'\n'+common+'\n'+art+'\n</script>')
renderer=(src/'render-new-games.mjs').read_text(encoding='utf-8')
renderer=renderer.replace('^(blocos-de-cristal|fusao-cosmica|corrida-nas-nuvens)-', '^qual-e-a-melodia-')
write(src/'render-melodia.mjs',renderer)
print('Created Melodia sources and exclusive-create Sharp renderer.')
