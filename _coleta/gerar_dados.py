"""Gera js/dados.js e as ilustrações (fotos/ilustracoes/*.svg) do Ponto da Esfiha Faria Lima.
Fonte: menudino.json (cardápio online), manifest.json (fotos baixadas) e o que foi visto no Google Maps.
Rode dentro desta pasta: python gerar_dados.py"""
import json, os, re, unicodedata
from ilustrar import ilustrar

os.chdir(os.path.dirname(os.path.abspath(__file__)))
D = json.load(open('menudino.json', encoding='utf-8'))
MAN = json.load(open('manifest.json', encoding='utf-8'))
OUT = os.path.join('..', 'js', 'dados.js')
ILUS = os.path.join('..', 'fotos', 'ilustracoes')
os.makedirs(ILUS, exist_ok=True)


def norm(s):
    return unicodedata.normalize('NFD', s or '').encode('ascii', 'ignore').decode().lower()


def slug(s):
    return re.sub(r'[^a-z0-9]+', '-', norm(s)).strip('-')


# ------------------------------------------------------------------ nomes
PALAVRA = {'c': 'com', 'c/': 'com', 'catu/original': 'Catupiry Original', 'catupiry': 'Catupiry', 'catup': 'Catupiry',
           'cat': 'Catupiry', 'brocolis': 'brócolis', 'requeijao': 'requeijão', 'peperone': 'pepperoni',
           'peperony': 'pepperoni', 'chese': 'cheese', 'queij': 'queijo', 'calab': 'calabresa', 'fofazza': 'fogazza',
           'porçao': 'porção', 'tres': 'três', 'prestigio': 'prestígio', 'prestigío': 'prestígio', 'agua': 'água'}
NOME = {  # nomes que pedem mais que trocar palavra
    'AGUA C GAS': 'Água com gás', 'AGUA SEM G': 'Água sem gás', 'CERVEJA IMPERIO': 'Cerveja Império',
    'CERVEJA ORIGINAL': 'Cerveja Original', 'CERVEJA SKOL LATA 350ML': 'Cerveja Skol lata 350 ml',
    'COCA 2,5L': 'Coca-Cola 2,5 L', 'COCA-COLA GARRAFA 2L': 'Coca-Cola garrafa 2 L', 'JABOTI 2 LITROS': 'Jaboti 2 L',
    'LATA': 'Refrigerante lata', 'REFRIGERANTE 1,5LITROS': 'Refrigerante 1,5 L', 'REFRIGERANTE DE SUKITA 2L SABORES': 'Sukita 2 L',
    'SUKITA LATA LARANJA': 'Sukita lata laranja', 'tiss 2l': 'Tiss 2 L', 'BRAHMA': 'Brahma', 'CAÇULINHA': 'Caçulinha',
    'BEIRUTE A MODA': 'Beirute à moda', 'BEIRUTE ATUM': 'Beirute de atum', 'BEIRUTE CALABRESA': 'Beirute de calabresa',
    'BEIRUTE CALABRESA REQUEIJÃO': 'Beirute de calabresa com requeijão', 'BEIRUTE FRANGO': 'Beirute de frango',
    'BEIRUTE FRANGO CATUPIRY': 'Beirute de frango com Catupiry', 'COMBO DE ESFIHA FAMILIA': 'Combo família',
    'COMBO KIDS': 'Combo kids', 'PROMOÇÃO 20 ESFIHAS DE CARNE': 'Promoção 20 esfihas de carne',
    'BRÓCOLIS BACON ALHO': 'Brócolis, bacon e alho', 'FRANGO MILHO QUEIJO': 'Frango, milho e queijo',
    'CATU ORIGINAL': 'Catupiry Original', 'ESFIHA A GREGA': 'À grega', 'ESFIHA Á MODA': 'À moda',
    'ROMEU JULIETA': 'Romeu e Julieta', 'ESFIHA OURO BRANCO': 'Ouro Branco', 'SONHO DE VALSA': 'Sonho de Valsa',
    'ESFIHA CHOCO BALL': 'Chocoball', 'LANCHE AMERICANO': 'Americano', 'X TUDO': 'X-Tudo', 'X- BACON': 'X-Bacon',
    'X- BURGUER': 'X-Burguer', 'X- CALABRESA': 'X-Calabresa', 'X- EGG': 'X-Egg', 'X-SALADA': 'X-Salada',
    'PORÇAO CALABRESA': 'Porção de calabresa', 'PORÇAO MISTA': 'Porção mista',
    'PEPERONE CHEDDAR': 'Pepperoni com cheddar', 'FOGAZZA BROCOLIS BACON': 'Fogazza de brócolis com bacon', 'BRÓCOLIS REQUEIJÃO': 'Brócolis com requeijão',
    'PASTEL FRANGO C REQUEIJÃO': 'Pastel de frango com requeijão', 'PASTEL FRANGO CATUP ORIGINAL': 'Pastel de frango com Catupiry Original',
    'Pizza Doce Pizza de Gotas de Chocolate': 'Gotas de chocolate', 'Pizza Doce Pizza de Chocolate com Sonho de Valsa': 'Chocolate com Sonho de Valsa',
    'Tipo Pizza Salgada Pizza A Moda da Casa': 'À moda da casa', 'Tipo Pizza Salgada Pizza A Moda Do Chef': 'À moda do chef',
    'Tipo Pizza Salgada Pizza Mussarela -': 'Mussarela', 'Tipo Pizza Salgada pizza quatro queijo': 'Quatro queijos',
    'Tipo Pizza Salgada Pizza Milho Verde': 'Milho verde',
}
NOMES_PROPRIOS = ['Catupiry', 'Original', 'Sonho de Valsa', 'Ouro Branco', 'Coca-Cola']


def nome_limpo(n):
    n = re.sub(r'\s+', ' ', n).strip()
    if n in NOME:
        return NOME[n]
    n = re.sub(r'^(Tipo Pizza Salgada |Pizza Doce )', '', n)
    n = re.sub(r'^(pizza|esfiha)\s+', '', n, flags=re.I)
    if n.upper().startswith('FOGAZZA') or n.upper().startswith('FOFAZZA'):
        resto = n.split(' ', 1)[1]
        n = 'fogazza de ' + resto
    ws = [PALAVRA.get(w.lower(), w.lower()) for w in n.split(' ')]
    s = ' '.join(ws)
    for p in NOMES_PROPRIOS:
        s = re.sub(re.escape(p), p, s, flags=re.I)
    s = re.sub(r'(?<=[a-zçãéóí]) (?=Catupiry)', ' com ', s).replace('com com', 'com')
    return s[0].upper() + s[1:]


DESC = {
    'CARNE': 'Carne, tomate, cebola e temperos. A cebola faz parte do tempero da carne, então não dá para tirar.',
    'COMBO VEGANO': '1 esfiha de brócolis com alho, 1 de milho, 1 de palmito, 1 de milho com tomate e azeitona e 1 de palmito com tomate. Sem queijo.',
    'COMBO VEGETARIANO': '1 esfiha de brócolis com alho, 1 de palmito (queijo e palmito), 1 napolitana (queijo e tomate), 1 de milho (milho e queijo) e 1 de brócolis com palmito e queijo.',
    'COMBO DE ESFIHA FAMILIA': '40 esfihas: 10 de carne, 10 de queijo, 10 de frango com Catupiry e 10 de calabresa.',
    'COMBO 1': '20 esfihas: 10 de carne e 10 de queijo.',
    'COMBO 2': '20 esfihas: 5 de carne, 5 de queijo, 5 de frango com Catupiry e 5 de calabresa.',
    'COMBO 3': '10 esfihas: 5 de carne e 5 de queijo.',
    'PROMOÇÃO 20 ESFIHAS DE CARNE': '20 esfihas de carne.',
    'ESFIHA OURO BRANCO': 'Chocolate com bombom Ouro Branco.',
    'ESFIHA CASADINHA': 'Meio chocolate branco, meio chocolate preto.',
    'ESFIHA CHOCO BALL': 'Chocolate com chocoball.',
    'PRESTIGIO': 'Chocolate preto com coco.',
    'Tipo Pizza Salgada Pizza Mussarela -': 'Mussarela com tomate, azeitona e orégano.',
    'Tipo Pizza Salgada Pizza Frango Com requeijao': 'Frango, requeijão, orégano, azeitona e molho de tomate.',
    'Tipo Pizza Salgada Pizza Caipira': 'Frango, milho, queijo e bacon.',
    'Tipo Pizza Salgada Pizza A Moda Do Chef': 'Frango, presunto, calabresa, mussarela, Catupiry, milho, palmito, molho de tomate e azeitona.',
    'Tipo Pizza Salgada Pizza Brasileira': 'Frango, ervilha e milho, coberta com mussarela.',
    'REFRIGERANTE 1,5LITROS': 'Pepsi Black ou Fanta Laranja.',
    'REFRIGERANTE DE SUKITA 2L SABORES': 'Escolha o sabor na observação.',
}
TYPO = {'maoinese': 'maionese', 'pelmito': 'palmito', 'mussrela': 'mussarela', 'mussarrela': 'mussarela',
        'mussare$': 'mussarela', 'parmessao': 'parmesão', 'mangericao': 'manjericão', 'frangocom': 'frango com',
        'requeijao': 'requeijão', 'brocolis': 'brócolis', 'oregano': 'orégano', 'pepperone': 'pepperoni',
        'hamb\\.': 'hambúrguer', 'e/calabresa': 'e calabresa', 'moida': 'moída', 'choc ': 'chocolate ',
        'c coco': 'com coco', 'pizza frango;': 'Frango, '}


MANTEM = {'Catupiry', 'Original', 'Sonho', 'Valsa', 'Ouro', 'Branco', 'Pepsi', 'Black', 'Fanta', 'Laranja'}


def desc_limpa(orig_nome, d, nome):
    if orig_nome in DESC:
        return DESC[orig_nome]
    d = re.sub(r'\s+', ' ', (d or '').replace('\r', ' ').replace('\n', ' ')).strip()
    if not d or norm(d) == norm(orig_nome) or norm(d) == norm(nome) or norm(d) in ('esfiha ' + norm(nome), 'garrafa 2l', '2 litros'):
        return ''
    d = re.sub(r'^(esfiha|pizza)\s+', '', d, flags=re.I)
    for a, b in TYPO.items():
        d = re.sub(a, b, d, flags=re.I)
    d = re.sub(r'\s*,\s*', ', ', d).replace(' ,', ',').strip(' .,')
    d = re.sub(r'\bcatupiry\b', 'Catupiry', d, flags=re.I)
    if d.isupper():
        d = d.lower()
    conectivo = re.search(r'\b(e|com|de|do|da|ao)\b|/', d, flags=re.I)
    if not re.search(r'[,.;]', d) and len(d.split()) > 2 and not conectivo:
        for u in ('alho frito', 'cream cheese', 'Catupiry Original', 'molho de tomate'):
            d = re.sub(u, u.replace(' ', '_'), d, flags=re.I)
        ws = d.split(' ')
        d = (', '.join(ws[:-1]) + ' e ' + ws[-1]).replace('_', ' ')
    d = re.sub(r'^(de|do|da)\s+', '', d, flags=re.I).replace(' / ', ' e ').replace('/', ' e ')
    ws = d.split(' ')
    for i, w in enumerate(ws):
        limpo = w.strip('.,;')
        if i and limpo and limpo not in MANTEM and (limpo.isupper() or limpo[0].isupper()):
            ws[i] = w.lower()
    d = ' '.join(ws)
    if ',' in d and not re.search(r'\b(e|ou)\b', d):
        a, b = d.rsplit(', ', 1)
        d = f'{a} e {b}'
    elif len(d.split()) == 2 and not re.search(r'\b(e|com|de|ao)\b', d):
        d = d.replace(' ', ' e ')
    d = d[0].upper() + d[1:]
    return d + ('' if d.endswith('.') else '.')


# ------------------------------------------------------------- categorias
CATS = [  # (nomes no Menudino, id, nome, curto, descrição)
    (['Esfiha aberta'], 'esfihas', 'Esfihas', 'Esfihas', 'Esfiha aberta, vendida por unidade. Peça quantas quiser de cada sabor.'),
    (['Esfihas Abertas Especiais'], 'especiais', 'Esfihas especiais', 'Especiais', 'Recheios combinados e Catupiry Original.'),
    (['Esfihas Doces'], 'doces', 'Esfihas doces', 'Doces', 'Chocolate, coco, bombom e goiabada.'),
    (['COMBOS'], 'combos', 'Combos', 'Combos', 'Caixas de 5 a 40 esfihas com preço fechado.'),
    (['Pizzas Salgadas'], 'pizzas', 'Pizzas', 'Pizzas', 'Broto ou grande. A grande pode ser meio a meio.'),
    (['Pizza Doce'], 'pizzas-doces', 'Pizzas doces', 'Pizzas doces', 'Para fechar a noite.'),
    (['Beirutes, acompanham fritas'], 'beirutes', 'Beirutes', 'Beirutes', 'Todos acompanham fritas.'),
    (['Lanches'], 'lanches', 'Lanches', 'Lanches', 'No pão de hambúrguer.'),
    (['SALGADOS', 'Pasteis'], 'fogazzas', 'Fogazzas e pastéis', 'Fogazzas', 'Fritos e recheados.'),
    (['Porções'], 'porcoes', 'Porções', 'Porções', 'Para dividir na mesa.'),
    (['Bebidas'], 'bebidas', 'Bebidas', 'Bebidas', 'Refrigerantes, cervejas, água e café.'),
]
BORDAS_SALGADA = [['Borda de Catupiry Original', 15], ['Borda de cheddar', 10], ['Borda de cream cheese', 18],
                  ['Borda de chocolate', 18], ['Borda de requeijão', 10]]
BORDAS_DOCE = [['Borda de chocolate', 18]]

por_menudino = {c['categoria']['name']: c['itens'] for c in D['categorias']}
saida, ids, n_ilus = [], set(), 0
for nomes, cid, cnome, curto, cdesc in CATS:
    itens = []
    for mn in nomes:
        for it in por_menudino.get(mn, []):
            r, det = it['resumo'], it['detalhe']
            nome = nome_limpo(r['name'])
            pre = {'pizzas': 'pizza ', 'pizzas-doces': 'pizza doce ', 'doces': 'esfiha doce '}.get(cid, '')
            i = slug(pre + nome)
            while i in ids:
                i += '-2'
            ids.add(i)
            o = {'id': i, 'nome': nome, 'desc': desc_limpa(r['name'], r.get('description'), nome), 'preco': round(r['minPrice'], 2)}
            tams = [[s['name'], round(s['salePrice'], 2), s.get('maxQtyParts') or 1] for s in det.get('sizes') or [] if not s.get('isPaused')]
            if tams:
                o['tamanhos'] = sorted(tams, key=lambda x: x[1])
                o['preco'] = o['tamanhos'][0][1]
            if r['id'] in MAN:
                o['img'] = MAN[r['id']]
            else:
                svg = ilustrar(o, cid)
                open(os.path.join(ILUS, i + '.svg'), 'w', encoding='utf-8').write(svg)
                o['img'] = f'fotos/ilustracoes/{i}.svg'
                o['ilus'] = 1
                n_ilus += 1
            itens.append(o)
    if cid in ('esfihas', 'especiais', 'doces', 'bebidas', 'lanches', 'fogazzas'):
        itens.sort(key=lambda x: (x['preco'], x['nome']))
    elif cid in ('pizzas', 'pizzas-doces'):
        itens.sort(key=lambda x: (x['tamanhos'][-1][1], x['nome']))
    saida.append({'id': cid, 'nome': cnome, 'curto': curto, 'desc': cdesc, 'itens': itens})

# Combos com composição exata (para a sugestão da caixa e o "a menos que avulso")
COMBOS = {'combo-3': {'carne': 5, 'queijo': 5}, 'combo-1': {'carne': 10, 'queijo': 10},
          'promocao-20-esfihas-de-carne': {'carne': 20}}

LOJA = {
    'nome': 'Ponto da Esfiha', 'nomeCompleto': 'Ponto da Esfiha Faria Lima', 'slogan': 'O endereço do sabor',
    'endereco': 'Av. Brig. José Vicente de Faria Lima, 750', 'bairro': 'Jardim Maria Augusta',
    'cidade': 'Taubaté · SP', 'cep': '12070-000',
    'telefone': '(12) 3635-6603', 'telefoneLink': '+551236356603', 'whatsapp': '551236356603',
    'facebook': 'https://www.facebook.com/107599427484620',
    'mapa': 'https://www.google.com/maps/dir//Ponto+Da+Esfiha+Faria+Lima,+Av.+Brg.+de+Faria+Lima,+750+-+Jardim+Maria+Augusta,+Taubat%C3%A9+-+SP',
    'mapaEmbed': 'https://www.google.com/maps?q=Ponto+Da+Esfiha+Faria+Lima,+Av.+Brg.+de+Faria+Lima,+750,+Taubat%C3%A9+-+SP&output=embed',
    'nota': '3,9', 'avaliacoes': '1.385',
    # horário do cardápio online (o Google diz que fecha à 0h)
    'horarios': {'0': [['16:00', '23:00']], **{str(d): [['16:00', '23:45']] for d in range(1, 7)}},
    'entrega': {'tempo': '60 a 70 min', 'taxaMin': 3, 'taxaMax': 16, 'minimo': 18},
    'modos': ['Entrega', 'Retirada', 'Consumo no local'],
    'pagamentos': ['Dinheiro', 'Cartão de crédito', 'Cartão de débito', 'Pix'],
    'comodidades': ['Ambiente familiar', 'Estacionamento', 'Wi-Fi'],
    'bordas': {'pizzas': BORDAS_SALGADA, 'pizzas-doces': BORDAS_DOCE},
    'combos': COMBOS,
    'fotos': {'logo': 'fotos/local/logo-ponto-da-esfiha.png', 'fachada': 'fotos/local/fachada.jpg',
              'salao': 'fotos/local/salao.jpg', 'mesa': 'fotos/local/mesa-de-esfihas.jpg',
              'perto': 'fotos/local/esfihas-de-perto.jpg', 'pizza': 'fotos/local/pizza.jpg',
              'docesCaixa': 'fotos/local/esfihas-doces-caixa.jpg', 'carne': 'fotos/local/esfihas-de-carne.jpg',
              'morango': 'fotos/local/esfihas-de-morango.jpg', 'capa': 'fotos/local/capa-menudino.webp'},
}

js = ('/* ==========================================================================\n'
      '   DADOS DO SITE · Ponto da Esfiha Faria Lima\n'
      '   Gerado em 20/10/2026 a partir do cardápio da loja e do Google.\n'
      '   Itens sem foto usam uma ilustração do sabor (fotos/ilustracoes).\n'
      '   Para editar, troque aqui ou rode _coleta/gerar_dados.py de novo\n'
      '   (isso sobrescreve este arquivo).\n'
      '   ========================================================================== */\n')
js += 'window.LOJA = ' + json.dumps(LOJA, ensure_ascii=False, indent=1) + ';\n\n'
js += 'window.CATEGORIAS = ' + json.dumps(saida, ensure_ascii=False, indent=1) + ';\n'
open(OUT, 'w', encoding='utf-8').write(js)

print({c['id']: len(c['itens']) for c in saida}, 'ilustrações:', n_ilus)
for c in saida:
    print(c['id'], '|', ' · '.join(i['nome'] for i in c['itens']))
