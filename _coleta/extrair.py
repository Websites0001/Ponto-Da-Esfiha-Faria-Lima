"""Baixa o cardápio do Menudino (Ponto da Esfiha Faria Lima) pela API pública que o próprio site usa.
O token anônimo de visitante vem da variável MENUDINO_TOKEN (não fica salvo aqui).
Uso: MENUDINO_TOKEN=... python extrair.py"""
import json, os, sys, time, urllib.request
M = '0cb78ca8-9a8e-4269-a31a-292221ebec37'
TOKEN = os.environ['MENUDINO_TOKEN']
H = {'Authorization': 'Bearer ' + TOKEN, 'Accept-Charset': 'utf-8', 'User-Agent': 'Mozilla/5.0',
     'Origin': 'https://pontodaesfihafarialima.menudino.com', 'Referer': 'https://pontodaesfihafarialima.menudino.com/'}

def get(base, path):
    req = urllib.request.Request(f'https://menudino-{base}.consumerapis.com/api/v1/{path}', headers=H)
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read().decode('utf-8'))

cats = get('catalog', f'categories/{M}?SellOnline=true')
lista = cats if isinstance(cats, list) else cats.get('categories') or cats.get('items') or cats
out = {'categorias': [], 'status': get('polling', f'merchants/{M}/status')}
for c in lista:
    resumo = get('catalog', f'items/{M}/{c["id"]}/summary?SellOnline=true&SellLocal=false')
    itens = resumo if isinstance(resumo, list) else resumo.get('items', resumo)
    det = []
    for it in itens:
        d = get('catalog', f'items/detailed?MerchantId={M}&Id={it["id"]}&SellOnline=true')
        det.append({'resumo': it, 'detalhe': d})
        time.sleep(0.1)
    out['categorias'].append({'categoria': c, 'itens': det})
    print(c.get('name'), len(det), flush=True)
json.dump(out, open('menudino.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print('ok', sum(len(c['itens']) for c in out['categorias']))
