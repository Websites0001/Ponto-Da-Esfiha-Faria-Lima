"""Baixa as fotos grandes dos itens (Menudino), logo e capa. Gera manifest.json {id_do_item: caminho}."""
import json, os, re, unicodedata, urllib.request
os.chdir(os.path.dirname(os.path.abspath(__file__)))
D = json.load(open('menudino.json', encoding='utf-8'))
M = '0cb78ca8-9a8e-4269-a31a-292221ebec37'

def slug(s):
    s = unicodedata.normalize('NFD', s).encode('ascii', 'ignore').decode().lower()
    return re.sub(r'[^a-z0-9]+', '-', s).strip('-')

def baixar(url, destino):
    if os.path.exists(destino) and os.path.getsize(destino) > 0:
        return True
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            data = r.read()
        if len(data) < 500:
            return False
        open(destino, 'wb').write(data)
        return True
    except Exception as e:
        print('falhou', url, e)
        return False

man = {}
for c in D['categorias']:
    for it in c['itens']:
        r = it['resumo']
        u = r.get('largeImageUrl') or ''
        if not u:
            continue
        nome = slug(r['name'])
        dest = f'../fotos/cardapio/{nome}.webp'
        if baixar('https://' + re.sub(r'^https?://', '', u), dest):
            man[r['id']] = dest[3:]
base = f'https://files.menudino.com/merchants/{M}/'
baixar(base + 'logo.png', '../fotos/local/logo-ponto-da-esfiha.png')
baixar(base + 'cover.webp', '../fotos/local/capa-menudino.webp')
json.dump(man, open('manifest.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print('fotos de itens:', len(man))
