from pathlib import Path
s=Path('covers/src')
for o in ['portrait','landscape']:
 p=s/f'complete-a-cantiga-{o}.svg'
 text=p.read_text(encoding='utf-8')
 if o=='portrait':text=text.replace('font-size="151"','font-size="118"')
 else:text=text.replace('font-size="105"','font-size="77"').replace('font-size="106"','font-size="75"').replace('translate(630 100)','translate(630 90)')
 with (s/f'complete-a-cantiga-{o}-final.svg').open('x',encoding='utf-8') as f:f.write(text)
