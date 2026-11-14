from pathlib import Path
import math
S=Path(__file__).resolve().parent
COL=['#ff5a5f','#ffc93c','#3ec300','#2e9bff','#ff7fd1','#ff8c2e','#a46bff','#2ad1c9']
def make(p):
 w,h=(1080,1620) if p else (1280,720)
 a=[]
 def add(s): a.append(s)
 add(f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}">')
 add('''<defs><linearGradient id="sky" x2="0" y2="1"><stop stop-color="#170a33"/><stop offset=".5" stop-color="#4b1a5e"/><stop offset=".85" stop-color="#b4466a"/><stop offset="1" stop-color="#f08a4b"/></linearGradient><linearGradient id="gold" x2="0" y2="1"><stop stop-color="#fffce0"/><stop offset=".45" stop-color="#fff0a3"/><stop offset="1" stop-color="#ffbb36"/></linearGradient><linearGradient id="wood" x2="0" y2="1"><stop stop-color="#a55a2a"/><stop offset="1" stop-color="#5b2a14"/></linearGradient><radialGradient id="light"><stop stop-color="#ffd778" stop-opacity=".6"/><stop offset="1" stop-color="#ffd778" stop-opacity="0"/></radialGradient><radialGradient id="ball"><stop stop-color="#fffbe0"/><stop offset=".55" stop-color="#ffdf6b"/><stop offset="1" stop-color="#ff9f1c"/></radialGradient><radialGradient id="vignette"><stop offset=".45" stop-color="#06051b" stop-opacity="0"/><stop offset="1" stop-color="#06051b" stop-opacity=".55"/></radialGradient></defs>''')
 add(f'<path fill="url(#sky)" d="M0 0H{w}V{h}H0Z"/>')
 floor=h*.79
 add(f'<path fill="url(#wood)" d="M0 {floor}H{w}V{h}H0Z"/>')
 for i in range(8):
  y=floor+20+i*i*6
  add(f'<path d="M0 {y}H{w}" stroke="#3c1405" stroke-opacity=".3" stroke-width="3"/>')
 cx,cy=(540,850) if p else (920,340)
 for i in range(28):
  t=i*math.tau/28
  pts=[(cx,cy),(cx+2200*math.cos(t),cy+2200*math.sin(t)),(cx+2200*math.cos(t+.044),cy+2200*math.sin(t+.044))]
  add('<polygon points="'+' '.join(f'{x},{y}' for x,y in pts)+'" fill="#fff4bc" opacity=".065"/>')
 add(f'<ellipse cx="{cx}" cy="{cy}" rx="650" ry="600" fill="url(#light)"/>')
 # Two original triangular flag garlands and strings of soft lights.
 for row,y in enumerate([10,420 if p else 18]):
  left,right=(0,w) if p or row==0 else (640,w+120)
  if not p and row==0: right=600
  add(f'<path d="M{left} {y} Q{(left+right)/2} {y+110} {right} {y}" fill="none" stroke="#fff0d2" stroke-opacity=".7" stroke-width="3"/>')
  n=13 if p else 9
  for i in range(n):
   t=(i+.5)/n; x=left+(right-left)*t; yy=y+110*t*(1-t)
   add(f'<path d="M{x-23} {yy}h46l-23 61Z" fill="{COL[(i+row*3)%7]}"/><circle cx="{x-5}" cy="{yy+16}" r="4" fill="#ffffff" opacity=".35"/>')
   add(f'<circle cx="{x}" cy="{yy+82}" r="23" fill="url(#light)"/><circle cx="{x}" cy="{yy+82}" r="5" fill="#fff1b1"/>')
 # Art in a consistent local 1000 x 1000 coordinate space.
 tx,ty,scale=(40,520,1) if p else (630,100,.59)
 add(f'<g transform="translate({tx} {ty}) scale({scale})">')
 def sparkle(x,y,r): add(f'<path d="M{x-r} {y}l{r*.83} {-r*.17}L{x} {y-r}l{r*.17} {r*.83}L{x+r} {y}l{-r*.83} {r*.17}L{x} {y+r}l{-r*.17} {-r*.83}Z" fill="#fff3b1"/>')
 def note(x,y,s,c,rot=0):
  add(f'<g transform="translate({x} {y}) rotate({rot}) scale({s})" fill="{c}"><ellipse cx="-12" cy="35" rx="18" ry="13" transform="rotate(-20 -12 35)"/><path d="M0 34V-40h10v74Z M5-40Q53-19 27 6Q40-19 5-23Z"/></g>')
 # Paper lantern silhouettes follow screens.js.
 for x,y,c in [(70,100,'#ff8c2e'),(930,110,'#ffc93c')]:
  add(f'<g transform="translate({x} {y})"><circle r="100" fill="url(#light)"/><path d="M0-65Q50-36 33 43H-33Q-50-36 0-65" fill="{c}"/><path d="M-32-7H32" stroke="#fff" stroke-opacity=".3" stroke-width="10"/><path d="M-14 44h28v15h-28Z" fill="#ffdf6b"/></g>')
 # Karaoke panel, dashes only. The game's glowing blank and ball are enlarged.
 add('<rect x="50" y="225" width="900" height="245" rx="48" fill="#190b38" stroke="#ffcf6b" stroke-opacity=".6" stroke-width="5"/><rect x="65" y="240" width="870" height="215" rx="38" fill="#3a1450"/>')
 for i in range(5):
  add(f'<path d="M{110+i*91} 356h55" stroke="'+('#ffd45c' if i<3 else '#ffeed6')+'" stroke-width="13" stroke-linecap="round"/>')
 add('<ellipse cx="770" cy="337" rx="190" ry="160" fill="url(#light)"/><rect x="650" y="280" width="230" height="135" rx="24" fill="#ffd666" fill-opacity=".24"/><path d="M672 392H858" stroke="#ffeca0" stroke-width="7"/>')
 add('<text x="765" y="372" text-anchor="middle" font-family="Arial Black, sans-serif" font-weight="900" font-size="100" fill="#fff0be">?</text>')
 add('<path d="M340 242Q430 65 550 218Q635 105 724 206" fill="none" stroke="#ffe9a0" stroke-opacity=".65" stroke-width="7" stroke-linecap="round" stroke-dasharray="10 19"/><circle cx="724" cy="206" r="78" fill="url(#light)"/><circle cx="724" cy="206" r="30" fill="url(#ball)"/><circle cx="715" cy="196" r="9" fill="#fffbe0"/>')
 # Four individually separated fanned answer cards, game button colours.
 for i,(x,y,ang,c,d) in enumerate([(265,570,-10,'#ff6b3d','#b8401c'),(735,570,10,'#3fb4ff','#1d6fb3'),(265,740,-6,'#ff7fd1','#a33683'),(735,740,6,'#a46bff','#55396e')]):
  add(f'<g transform="translate({x} {y}) rotate({ang})"><rect x="-200" y="-64" width="400" height="140" rx="28" fill="{d}"/><rect x="-200" y="-76" width="400" height="140" rx="28" fill="{c}" stroke="#ffffff" stroke-opacity=".4" stroke-width="3"/><rect x="-183" y="-65" width="366" height="35" rx="18" fill="#fff" opacity=".12"/>')
  if i%2==0: add('<text x="0" y="33" text-anchor="middle" font-family="Arial Black, sans-serif" font-weight="900" font-size="100" fill="#fff6e0">?</text>')
  else: note(0,-12,.9,'#fff6e0',-5)
  add('</g>')
 for x,y,s,c,r in [(180,150,1.1,'#ffc93c',-18),(850,190,1,'#2ad1c9',20),(60,440,.7,'#ff7fd1',-25),(965,455,.7,'#ffc93c',18),(500,85,.8,'#ff7fd1',12)]:note(x,y,s,c,r)
 # Eight simple original children: same trapezoid bodies, circle heads, hair caps and stick legs.
 kids=[]
 for i in range(8):
  t=i*math.tau/8;x=500+360*math.cos(t);y=935+58*math.sin(t);kids.append((x,y,i))
 add('<path d="'+' '.join(('M' if j==0 else 'L')+f'{x},{y-5}' for j,(x,y,i) in enumerate(kids))+'Z" fill="none" stroke="#ffdcB4" stroke-width="9"/>')
 skins=['#f2c9a0','#c98b5e','#8d5a3b','#e8b48a','#6e4129','#f5d3b3','#a86f48','#d9a173']
 for x,y,i in sorted(kids,key=lambda k:k[1]):
  add(f'<g transform="translate({x} {y}) scale(2.05)"><ellipse cy="29" rx="16" ry="4" fill="#170a33" opacity=".25"/><path d="M-4 14l-2 14m10-14 2 14" stroke="#3a1a10" stroke-width="4" stroke-linecap="round"/><path d="M-6-6H6L11 16H-11Z" fill="{COL[i]}"/><circle cy="-16" r="9" fill="{skins[i]}"/><path d="M-9-19a9 9 0 0 1 18 0Z" fill="#2b140b"/></g>')
 for v in [(45,210,22),(930,310,24),(490,470,18),(65,810,22),(955,825,27),(500,1060,20)]:sparkle(*v)
 add('</g>')
 add(f'<rect width="{w}" height="{h}" fill="url(#vignette)"/>')
 # Title safe bounds include the thick outline. Explicit widths avoid font metric drift.
 def title(t,x,y,size,width):
  add(f'<text x="{x}" y="{y+9}" text-anchor="middle" font-family="Arial Black, Segoe UI, sans-serif" font-weight="900" font-size="{size}" textLength="{width}" lengthAdjust="spacingAndGlyphs" stroke="#190b38" stroke-width="23" stroke-linejoin="round" fill="#190b38">{t}</text>')
  add(f'<text x="{x}" y="{y}" text-anchor="middle" font-family="Arial Black, Segoe UI, sans-serif" font-weight="900" font-size="{size}" textLength="{width}" lengthAdjust="spacingAndGlyphs" paint-order="stroke" stroke="#190b38" stroke-width="18" stroke-linejoin="round" fill="url(#gold)">{t}</text>')
 if p:
  title('COMPLETE A',540,260,151,900);title('CANTIGA!',540,421,165,865)
 else:
  title('COMPLETE',345,280,105,500);title('A CANTIGA!',345,405,106,510)
 add('</svg>')
 return ''.join(a)
for orient,p in [('portrait',True),('landscape',False)]:
 with (S/f'complete-a-cantiga-{orient}.svg').open('x',encoding='utf-8') as f:f.write(make(p))
print('Created exclusive new SVG sources.')
