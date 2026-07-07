# 프로그램 일지 생성기 빌드: template.html + 문장은행.json → 프로그램일지생성기.html
# 사용법: 이 폴더에서  py build.py
import json, os
d = os.path.dirname(os.path.abspath(__file__))
tpl = open(os.path.join(d, 'template.html'), encoding='utf-8').read()
bank = json.load(open(os.path.join(d, '문장은행.json'), encoding='utf-8'))
seen, sentences = set(), []
for s in bank['sentences']:
    k = s['text'].replace(' ', '')
    if k in seen: continue
    seen.add(k)
    sentences.append({'category': s['category'], 'programs': s.get('programs', []), 'status': s['status'], 'text': s['text']})
data = json.dumps({'sentences': sentences}, ensure_ascii=False, separators=(',', ':'))
assert '__BANK_DATA__' in tpl
open(os.path.join(d, '프로그램일지생성기.html'), 'w', encoding='utf-8').write(tpl.replace('__BANK_DATA__', data))
print('빌드 완료:', len(sentences), '문장')
