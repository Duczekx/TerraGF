from pathlib import Path
from html.parser import HTMLParser
from html import escape
import re,json
root=Path(__file__).resolve().parents[1]
langs=['pl','de','en','fr','es','it']
rows=[line.split('|') for line in (root/'scripts/translations.txt').read_text(encoding='utf-8-sig').splitlines() if line.strip()]
assert all(len(r)==6 for r in rows)
data={lang:{r[0]:r[i] for r in rows} for i,lang in enumerate(langs)}
source=root/'website/source/index.pl.html';source.parent.mkdir(exist_ok=True)
if not source.exists(): source.write_text((root/'website/dist/index.html').read_text(encoding='utf-8'),encoding='utf-8')
s=source.read_text(encoding='utf-8')
# Every photo retains a useful accessible description without a visible caption.
alts=['Widły w warsztacie','Praca na łące','Detal siłownika i przegubu chwytaka','Konstrukcja ramy przed malowaniem','Otwarty chwytak na tle nieba','Widły widziane od przodu','Ciągnik z otwartym chwytakiem na łące','Układ hydrauliczny chwytaka','Chwytak podczas zbierania roślinności','Montaż stalowej ramy w warsztacie']
idx=iter(alts)
s=re.sub(r'(<img\s+src="\./assets/photos/[^>]*?alt=")[^"]*(")',lambda m:m[1]+next(idx)+m[2],s)
s=re.sub(r'(<a href="\./assets/photos/[^>]*?aria-label=")[^"]*(")',r'\1Powiększ zdjęcie\2',s)
s=s.replace('<script defer src="./app.js"></script>','<script defer src="./translations.js"></script>\n  <script defer src="./i18n.js"></script>\n  <script defer src="./app.js"></script>')
selector='<label class="language-picker"><span class="sr-only">Język strony</span><select id="language-select" aria-label="Język strony">'+''.join(f'<option value="{code}" lang="{code}"'+(' selected' if code=='de' else '')+f'>{name}</option>' for code,name in [('de','Deutsch'),('en','English'),('pl','Polski'),('fr','Français'),('es','Español'),('it','Italiano')])+'</select></label>'
s=s.replace('    <button class="menu-toggle"',selector+'\n    <button class="menu-toggle"')
class Translate(HTMLParser):
 def __init__(self): super().__init__(convert_charrefs=False);self.out=[];self.stack=[];self.missing=[]
 def handle_decl(self,d):self.out.append('<!'+d+'>')
 def handle_starttag(self,tag,attrs):
  attr=dict(attrs); extra=[]
  for key in ('alt','aria-label','title','content'):
   val=attr.get(key)
   if val in data['de']:
    attr[key]=data['de'][val];extra.append(('data-i18n-'+key,val))
  if tag=='html':attr['lang']='de'
  if tag=='title': extra.append(('data-i18n-title', 'TERRAGF — GF 1900 · Mocny chwyt. Pełna kontrola.'))
  self.out.append('<'+tag+''.join(' '+k+('="'+escape(v,quote=True)+'"' if v is not None else '') for k,v in list(attr.items())+extra)+'>')
  if tag not in ('meta','link','img','br','input','hr','source','path'):self.stack.append(tag)
 def handle_endtag(self,tag):
  self.out.append('</'+tag+'>')
  if tag in self.stack: self.stack=self.stack[:len(self.stack)-1-self.stack[::-1].index(tag)]
 def handle_data(self,text):
  key=text.strip()
  if key in data['de']:
   translated=escape(data['de'][key])
   if self.stack and self.stack[-1]=='title':self.out.append(translated)
   else:self.out.append(text[:len(text)-len(text.lstrip())]+'<i18n-text data-i18n="'+escape(key,quote=True)+'">'+translated+'</i18n-text>'+text[len(text.rstrip()):])
  else:
   self.out.append(text)
   if key and any(c.isalpha() for c in key) and not key.startswith(('TERRA','GF 1900','Instagram','@','©')) and key not in ('GF','mm','kg','Deutsch','English','Polski','Français','Español','Italiano'):self.missing.append(key)
 def handle_entityref(self,n):self.out.append('&'+n+';')
 def handle_charref(self,n):self.out.append('&#'+n+';')
 def handle_comment(self,d):self.out.append('<!--'+d+'-->')
p=Translate();p.feed(s)
assert not p.missing,p.missing
(root/'website/dist/index.html').write_text(''.join(p.out),encoding='utf-8')
(root/'website/dist/translations.js').write_text('window.TRANSLATIONS = '+json.dumps(data,ensure_ascii=False,indent=2)+';\n',encoding='utf-8')
print('Built',len(rows),'translations in',len(langs),'languages; no untranslated page text.')
