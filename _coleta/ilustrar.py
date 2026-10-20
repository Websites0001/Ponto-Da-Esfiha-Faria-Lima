"""Ilustrações em SVG para os itens que não têm foto no cardápio online.
Cada ilustração é desenhada a partir dos ingredientes da descrição (calabresa vira rodelas,
milho vira grãos...), então cada sabor sai diferente. Não são fotos e o site avisa isso."""
import math, random, re, unicodedata

W = 400
C = W / 2


def norm(s):
    return unicodedata.normalize('NFD', s or '').encode('ascii', 'ignore').decode().lower()


# --------------------------------------------------------------- ingredientes
# ordem importa: o primeiro que casar com o texto entra; "base" decide a cor do recheio
TOPPINGS = [
    ('pepperoni', r'pepperon|peperon'), ('calabresa', r'calabres'), ('bacon', r'bacon'),
    ('lombo', r'lombo'), ('presunto', r'presunto|bauru|portugues'), ('atum', r'atum'),
    ('frango', r'frango|catoles|caipira|catufrango'), ('carne', r'\bcarne\b|hamburg'),
    ('catupiry', r'catupiry|catu\b|requeij|cream ch|chese'), ('cheddar', r'cheddar'),
    ('parmesao', r'parmes|tres queijos|quatro queijo'), ('tomate', r'tomate|napolitan|marguerit|bauru'),
    ('cebola', r'cebola|calabresa|atum'), ('azeitona', r'azeiton|pizza$|mussarela -'),
    ('milho', r'milho|brasileira|caipira'), ('ervilha', r'ervilha|jardineira|brasileira'),
    ('palmito', r'palmito|pelmito|grega|a moda|jardineira'), ('brocolis', r'brocol'),
    ('escarola', r'escarola'), ('alho', r'alho'), ('ovo', r'\bovos?\b|portugues|baiana'),
    ('pimenta', r'pimenta|baiana'), ('manjericao', r'manjeric|mangeric|marguerit'),
    ('oregano', r'oregano'),
]
DOCES = [
    ('coco', r'coco|beijinho|prestig'), ('confete', r'confete'), ('chocoball', r'choco ?ball'),
    ('granulado', r'brigadeiro|gotas'), ('bombom', r'ouro branco|sonho de valsa'),
    ('goiabada', r'goiabada|romeu'), ('meia', r'casadinh'),
]


def ingredientes(texto, lista):
    t = norm(texto)
    return [k for k, rx in lista if re.search(rx, t)]


def base_salgada(t, tops):
    t = norm(t)
    if 'carne' in tops and not re.search(r'queijo|mussarela|requeij|catupiry|cream', t):
        return 'carne'
    if 'atum' in tops and 'queijo' not in t and 'mussarela' not in t:
        return 'atum'
    if 'frango' in tops and not re.search(r'queijo|mussarela|cheddar|requeij|catupiry|cream', t):
        return 'frango'
    if 'catupiry' in tops and not re.search(r'mussarela|queijo', t):
        return 'catupiry'
    if 'cheddar' in tops and not re.search(r'mussarela|queijo', t):
        return 'cheddar'
    return 'queijo'


# ------------------------------------------------------------------- desenho
class Tela:
    def __init__(self, seed):
        self.r = random.Random(seed)
        self.p = []
        self.defs = []

    def add(self, s):
        self.p.append(s)

    def svg(self, title):
        return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {W}" role="img">'
                f'<title>{title}</title><defs>{"".join(self.defs)}</defs>{"".join(self.p)}</svg>')

    def pontos(self, n, raio, minimo, cx=C, cy=C):
        pts, tent = [], 0
        while len(pts) < n and tent < n * 60:
            tent += 1
            a = self.r.random() * math.tau
            d = math.sqrt(self.r.random()) * raio
            x, y = cx + math.cos(a) * d, cy + math.sin(a) * d
            if all((x - px) ** 2 + (y - py) ** 2 > minimo ** 2 for px, py in pts):
                pts.append((x, y))
        return pts


GRAD = {
    'massa': ('#F5C46B', '#D88C35', '#B86A22'),
    'queijo': ('#FBE7A1', '#F2C95C', '#E2A93A'),
    'carne': ('#9A5434', '#7A3E24', '#5C2B17'),
    'frango': ('#F1D6A2', '#E2B977', '#C9975A'),
    'catupiry': ('#FFFBF1', '#F6EEDB', '#E8DCC0'),
    'cheddar': ('#FFB347', '#F28C1C', '#D9700A'),
    'atum': ('#EBC6B4', '#D9A68D', '#BF8770'),
    'molho': ('#D9452B', '#B8321C', '#922313'),
    'chocolate': ('#7A4A2E', '#5A321D', '#3E2012'),
    'branco': ('#FFF6E4', '#F4E6C8', '#E6D2A8'),
    'doce_leite': ('#E7A65A', '#C98235', '#A9661F'),
}


def grad(t, nome, key, cx='45%', cy='38%'):
    a, b, c = GRAD[key]
    t.defs.append(f'<radialGradient id="{nome}" cx="{cx}" cy="{cy}" r="70%">'
                  f'<stop offset="0" stop-color="{a}"/><stop offset=".6" stop-color="{b}"/>'
                  f'<stop offset="1" stop-color="{c}"/></radialGradient>')
    return f'url(#{nome})'


def sombra(t, rx=150, ry=22, y=C + 150, op=.18):
    t.add(f'<ellipse cx="{C}" cy="{y}" rx="{rx}" ry="{ry}" fill="#3B1E0E" opacity="{op}"/>')


def manchas(t, n, raio, cor, op, tam=(6, 16), cx=C, cy=C):
    for x, y in t.pontos(n, raio, 4, cx, cy):
        rx, ry = t.r.uniform(*tam), t.r.uniform(*tam) * .7
        t.add(f'<ellipse cx="{x:.1f}" cy="{y:.1f}" rx="{rx:.1f}" ry="{ry:.1f}" '
              f'transform="rotate({t.r.randint(0, 180)} {x:.1f} {y:.1f})" fill="{cor}" opacity="{op}"/>')


def massa_borda(t, R, r, uid):
    """Borda de massa dourada, com pontos mais tostados."""
    g = grad(t, f'm{uid}', 'massa')
    t.add(f'<circle cx="{C}" cy="{C}" r="{R}" fill="{g}"/>')
    t.add(f'<circle cx="{C}" cy="{C}" r="{R - 4}" fill="none" stroke="#FFE2A3" stroke-width="3" opacity=".55"/>')
    for i in range(26):
        a = t.r.random() * math.tau
        d = t.r.uniform(r + 4, R - 6)
        x, y = C + math.cos(a) * d, C + math.sin(a) * d
        t.add(f'<ellipse cx="{x:.1f}" cy="{y:.1f}" rx="{t.r.uniform(3, 8):.1f}" ry="{t.r.uniform(2, 4):.1f}" '
              f'transform="rotate({math.degrees(a) + 90:.0f} {x:.1f} {y:.1f})" fill="#9C5419" opacity=".28"/>')


# ----- cada ingrediente
def t_calabresa(t, x, y, s=1, cor=('#B3341F', '#D9573B')):
    r = 17 * s
    t.add(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{r:.1f}" fill="{cor[0]}"/>'
          f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{r - 3 * s:.1f}" fill="{cor[1]}"/>')
    for _ in range(4):
        a, d = t.r.random() * math.tau, t.r.uniform(0, r - 6 * s)
        t.add(f'<circle cx="{x + math.cos(a) * d:.1f}" cy="{y + math.sin(a) * d:.1f}" r="{2.2 * s:.1f}" fill="#F6C9B4" opacity=".85"/>')


def t_pepperoni(t, x, y, s=1):
    t_calabresa(t, x, y, s * .9, ('#8E1E14', '#B8321F'))


def t_bacon(t, x, y, s=1):
    a = t.r.randint(0, 180)
    w = 34 * s
    t.add(f'<g transform="rotate({a} {x:.1f} {y:.1f})">'
          f'<path d="M{x - w / 2:.1f} {y:.1f} q{w / 4:.1f} -8 {w / 2:.1f} 0 t{w / 2:.1f} 0" stroke="#A8432E" stroke-width="{11 * s:.1f}" fill="none" stroke-linecap="round"/>'
          f'<path d="M{x - w / 2:.1f} {y:.1f} q{w / 4:.1f} -8 {w / 2:.1f} 0 t{w / 2:.1f} 0" stroke="#F0B8A0" stroke-width="{3.5 * s:.1f}" fill="none" stroke-linecap="round"/></g>')


def t_frango(t, x, y, s=1):
    for _ in range(3):
        dx, dy = t.r.uniform(-7, 7) * s, t.r.uniform(-7, 7) * s
        a = t.r.uniform(0, math.tau)
        L = t.r.uniform(7, 12) * s
        x1, y1 = x + dx, y + dy
        x2, y2 = x1 + math.cos(a) * L, y1 + math.sin(a) * L
        t.add(f'<path d="M{x1:.1f} {y1:.1f} L{x2:.1f} {y2:.1f}" stroke="#C99560" stroke-width="{6.5 * s:.1f}" stroke-linecap="round"/>'
              f'<path d="M{x1:.1f} {y1:.1f} L{x2:.1f} {y2:.1f}" stroke="#EFD3A2" stroke-width="{3.4 * s:.1f}" stroke-linecap="round"/>')


def t_carne(t, x, y, s=1):
    for _ in range(4):
        dx, dy = t.r.uniform(-8, 8) * s, t.r.uniform(-8, 8) * s
        t.add(f'<circle cx="{x + dx:.1f}" cy="{y + dy:.1f}" r="{t.r.uniform(3, 6) * s:.1f}" fill="#6E3820"/>')


def t_atum(t, x, y, s=1):
    for _ in range(3):
        dx, dy = t.r.uniform(-8, 8) * s, t.r.uniform(-8, 8) * s
        t.add(f'<ellipse cx="{x + dx:.1f}" cy="{y + dy:.1f}" rx="{7 * s:.1f}" ry="{4 * s:.1f}" fill="#D99A86" transform="rotate({t.r.randint(0, 180)} {x + dx:.1f} {y + dy:.1f})"/>')


def t_lombo(t, x, y, s=1):
    t.add(f'<ellipse cx="{x:.1f}" cy="{y:.1f}" rx="{17 * s:.1f}" ry="{11 * s:.1f}" fill="#E7B2A0" transform="rotate({t.r.randint(0, 180)} {x:.1f} {y:.1f})"/>'
          f'<ellipse cx="{x:.1f}" cy="{y:.1f}" rx="{12 * s:.1f}" ry="{6 * s:.1f}" fill="#F3CDBE" transform="rotate({t.r.randint(0, 180)} {x:.1f} {y:.1f})"/>')


def t_presunto(t, x, y, s=1):
    a = t.r.randint(0, 90)
    t.add(f'<rect x="{x - 11 * s:.1f}" y="{y - 11 * s:.1f}" width="{22 * s:.1f}" height="{22 * s:.1f}" rx="{4 * s:.1f}" fill="#EBA0A2" transform="rotate({a} {x:.1f} {y:.1f})"/>'
          f'<rect x="{x - 7 * s:.1f}" y="{y - 7 * s:.1f}" width="{14 * s:.1f}" height="{14 * s:.1f}" rx="3" fill="#F6C1C1" transform="rotate({a} {x:.1f} {y:.1f})"/>')


def t_catupiry(t, x, y, s=1):
    t.add(f'<ellipse cx="{x:.1f}" cy="{y + 1.5 * s:.1f}" rx="{13 * s:.1f}" ry="{10 * s:.1f}" fill="#E6D6B3" opacity=".7"/>'
          f'<path d="M{x - 12 * s:.1f} {y:.1f} c0 -12 24 -12 24 0 c0 9 -24 9 -24 0z" fill="#FFFDF7"/>'
          f'<path d="M{x - 6 * s:.1f} {y - 2 * s:.1f} q6 -6 12 0" stroke="#EADBB8" stroke-width="{1.6 * s:.1f}" fill="none"/>')


def t_cheddar(t, x, y, s=1):
    t.add(f'<path d="M{x - 18 * s:.1f} {y:.1f} q9 -12 18 0 t18 0" stroke="#F28C1C" stroke-width="{7 * s:.1f}" fill="none" stroke-linecap="round" opacity=".95"/>')


def t_parmesao(t, x, y, s=1):
    for _ in range(3):
        dx, dy = t.r.uniform(-10, 10) * s, t.r.uniform(-10, 10) * s
        t.add(f'<path d="M{x + dx:.1f} {y + dy:.1f} l{5 * s:.1f} {-2 * s:.1f} l{-1 * s:.1f} {6 * s:.1f}z" fill="#FFF3CF"/>')


def t_tomate(t, x, y, s=1):
    r = 16 * s
    t.add(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{r:.1f}" fill="#E0402A"/><circle cx="{x:.1f}" cy="{y:.1f}" r="{r - 3 * s:.1f}" fill="#F0654A"/>')
    for k in range(5):
        a = k / 5 * math.tau
        t.add(f'<ellipse cx="{x + math.cos(a) * 7 * s:.1f}" cy="{y + math.sin(a) * 7 * s:.1f}" rx="{2.8 * s:.1f}" ry="{1.6 * s:.1f}" fill="#FFD9A6" transform="rotate({math.degrees(a):.0f} {x + math.cos(a) * 7 * s:.1f} {y + math.sin(a) * 7 * s:.1f})"/>')


def t_cebola(t, x, y, s=1):
    t.add(f'<ellipse cx="{x:.1f}" cy="{y:.1f}" rx="{15 * s:.1f}" ry="{11 * s:.1f}" fill="none" stroke="#C99BC9" stroke-width="{3 * s:.1f}" transform="rotate({t.r.randint(0, 180)} {x:.1f} {y:.1f})"/>')


def t_azeitona(t, x, y, s=1):
    t.add(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{8 * s:.1f}" fill="#2B2420"/><circle cx="{x:.1f}" cy="{y:.1f}" r="{3.4 * s:.1f}" fill="#7A5B3B"/>'
          f'<circle cx="{x - 3 * s:.1f}" cy="{y - 3 * s:.1f}" r="{1.6 * s:.1f}" fill="#fff" opacity=".35"/>')


def t_milho(t, x, y, s=1):
    for _ in range(3):
        dx, dy = t.r.uniform(-9, 9) * s, t.r.uniform(-9, 9) * s
        t.add(f'<rect x="{x + dx - 3.5 * s:.1f}" y="{y + dy - 3 * s:.1f}" width="{7 * s:.1f}" height="{6 * s:.1f}" rx="{2.5 * s:.1f}" fill="#FFD23F" stroke="#E0A800" stroke-width=".8"/>')


def t_ervilha(t, x, y, s=1):
    for _ in range(3):
        dx, dy = t.r.uniform(-9, 9) * s, t.r.uniform(-9, 9) * s
        t.add(f'<circle cx="{x + dx:.1f}" cy="{y + dy:.1f}" r="{4.2 * s:.1f}" fill="#6DB33F"/><circle cx="{x + dx - 1.2:.1f}" cy="{y + dy - 1.2:.1f}" r="{1.3 * s:.1f}" fill="#C8EFA0"/>')


def t_palmito(t, x, y, s=1):
    t.add(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{11 * s:.1f}" fill="#F7EFD2" stroke="#E2D2A0" stroke-width="{2 * s:.1f}"/>'
          f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{5 * s:.1f}" fill="none" stroke="#E2D2A0" stroke-width="{1.4 * s:.1f}"/>')


def t_brocolis(t, x, y, s=1):
    t.add(f'<path d="M{x:.1f} {y + 4 * s:.1f} l0 {9 * s:.1f}" stroke="#7FB45A" stroke-width="{5 * s:.1f}" stroke-linecap="round"/>')
    for dx, dy in ((-6, -2), (6, -2), (0, -8), (-3, 3), (4, 3)):
        t.add(f'<circle cx="{x + dx * s:.1f}" cy="{y + dy * s:.1f}" r="{6 * s:.1f}" fill="#3F8A2E"/>')
    t.add(f'<circle cx="{x - 2 * s:.1f}" cy="{y - 6 * s:.1f}" r="{2.2 * s:.1f}" fill="#7CC35A"/>')


def t_escarola(t, x, y, s=1):
    a = t.r.randint(0, 180)
    t.add(f'<path d="M{x:.1f} {y:.1f} c{8 * s:.1f} {-14 * s:.1f} {22 * s:.1f} {-6 * s:.1f} {16 * s:.1f} {6 * s:.1f} c{-4 * s:.1f} {8 * s:.1f} {-14 * s:.1f} {6 * s:.1f} {-16 * s:.1f} {-6 * s:.1f}z" '
          f'fill="#4E8F3A" transform="rotate({a} {x:.1f} {y:.1f})"/>')


def t_alho(t, x, y, s=1):
    for _ in range(4):
        dx, dy = t.r.uniform(-9, 9) * s, t.r.uniform(-9, 9) * s
        t.add(f'<ellipse cx="{x + dx:.1f}" cy="{y + dy:.1f}" rx="{3.2 * s:.1f}" ry="{2 * s:.1f}" fill="#E6B85C"/>')


def t_ovo(t, x, y, s=1):
    t.add(f'<path d="M{x - 15 * s:.1f} {y:.1f} c0 -14 30 -14 30 0 c0 12 -30 12 -30 0z" fill="#FFFFFF" stroke="#EEE6D6" stroke-width="1.2"/>'
          f'<circle cx="{x + 2 * s:.1f}" cy="{y - 1 * s:.1f}" r="{6.5 * s:.1f}" fill="#FFC21A"/>')


def t_pimenta(t, x, y, s=1):
    for _ in range(3):
        dx, dy = t.r.uniform(-8, 8) * s, t.r.uniform(-8, 8) * s
        t.add(f'<circle cx="{x + dx:.1f}" cy="{y + dy:.1f}" r="{2 * s:.1f}" fill="#D7261C"/>')


def t_manjericao(t, x, y, s=1):
    a = t.r.randint(0, 180)
    t.add(f'<path d="M{x:.1f} {y:.1f} q{9 * s:.1f} {-12 * s:.1f} {18 * s:.1f} 0 q{-9 * s:.1f} {9 * s:.1f} {-18 * s:.1f} 0z" fill="#2F7D32" transform="rotate({a} {x:.1f} {y:.1f})"/>')


def t_oregano(t, x, y, s=1):
    for _ in range(5):
        dx, dy = t.r.uniform(-11, 11) * s, t.r.uniform(-11, 11) * s
        t.add(f'<circle cx="{x + dx:.1f}" cy="{y + dy:.1f}" r="{1.3 * s:.1f}" fill="#4F6B2A" opacity=".85"/>')


def t_coco(t, x, y, s=1):
    for _ in range(4):
        dx, dy = t.r.uniform(-10, 10) * s, t.r.uniform(-10, 10) * s
        t.add(f'<path d="M{x + dx:.1f} {y + dy:.1f} l{6 * s:.1f} {t.r.uniform(-2, 2) * s:.1f}" stroke="#FFFFFF" stroke-width="{2.4 * s:.1f}" stroke-linecap="round"/>')


CONFETE = ['#E53935', '#FFB300', '#43A047', '#1E88E5', '#8E24AA', '#FB8C00']


def t_confete(t, x, y, s=1):
    t.add(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{6 * s:.1f}" fill="{t.r.choice(CONFETE)}"/><circle cx="{x - 2:.1f}" cy="{y - 2:.1f}" r="{1.8 * s:.1f}" fill="#fff" opacity=".45"/>')


def t_chocoball(t, x, y, s=1):
    t.add(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{6.5 * s:.1f}" fill="#3E2012"/><circle cx="{x - 2:.1f}" cy="{y - 2:.1f}" r="{2 * s:.1f}" fill="#8A5A3A"/>')


def t_granulado(t, x, y, s=1):
    for _ in range(4):
        dx, dy = t.r.uniform(-10, 10) * s, t.r.uniform(-10, 10) * s
        a = t.r.uniform(0, math.tau)
        t.add(f'<path d="M{x + dx:.1f} {y + dy:.1f} l{math.cos(a) * 6 * s:.1f} {math.sin(a) * 6 * s:.1f}" stroke="#2A1408" stroke-width="{2.4 * s:.1f}" stroke-linecap="round"/>')


def t_bombom(t, x, y, s=1):
    t.add(f'<rect x="{x - 10 * s:.1f}" y="{y - 8 * s:.1f}" width="{20 * s:.1f}" height="{16 * s:.1f}" rx="{5 * s:.1f}" fill="#6B3B1F" transform="rotate({t.r.randint(-30, 30)} {x:.1f} {y:.1f})"/>'
          f'<path d="M{x - 6 * s:.1f} {y - 2 * s:.1f} q6 -5 12 0" stroke="#F1E3C4" stroke-width="{2 * s:.1f}" fill="none"/>')


def t_goiabada(t, x, y, s=1):
    t.add(f'<rect x="{x - 8 * s:.1f}" y="{y - 8 * s:.1f}" width="{16 * s:.1f}" height="{16 * s:.1f}" rx="{3 * s:.1f}" fill="#B3202A" transform="rotate({t.r.randint(0, 90)} {x:.1f} {y:.1f})"/>')


DRAW = {k: globals()['t_' + k] for k, _ in TOPPINGS + DOCES if 't_' + k in globals()}

# quantos de cada ingrediente cabem num disco (o resto se ajusta pela área)
DENS = {'calabresa': 6, 'pepperoni': 6, 'bacon': 5, 'frango': 8, 'carne': 9, 'atum': 7, 'lombo': 5,
        'presunto': 5, 'catupiry': 5, 'cheddar': 4, 'parmesao': 6, 'tomate': 4, 'cebola': 5, 'azeitona': 5,
        'milho': 7, 'ervilha': 7, 'palmito': 5, 'brocolis': 5, 'escarola': 6, 'alho': 6, 'ovo': 3,
        'pimenta': 6, 'manjericao': 4, 'oregano': 8, 'coco': 10, 'confete': 12, 'chocoball': 9,
        'granulado': 12, 'bombom': 5, 'goiabada': 8}


PROTEINAS = ('calabresa', 'pepperoni', 'bacon', 'frango', 'carne', 'atum', 'lombo', 'presunto', 'brocolis', 'escarola', 'palmito', 'milho')


def espalhar(t, tops, raio, escala, area):
    """Distribui os ingredientes; o primeiro ingrediente "principal" ganha mais peças."""
    foco = next((k for k in tops if k in PROTEINAS), None)
    usados = []
    for k in tops:
        if k not in DRAW:
            continue
        n = max(2, round(DENS.get(k, 5) * area * (1.7 if k == foco else 1)))
        livres = [p for p in t.pontos(n * 3, raio, 15 * escala) if all((p[0] - q[0]) ** 2 + (p[1] - q[1]) ** 2 > (13 * escala) ** 2 for q in usados)]
        for x, y in livres[:n]:
            usados.append((x, y))
            DRAW[k](t, x, y, escala)


def recheio_base(t, base, r, uid):
    g = grad(t, f'b{uid}', base)
    t.add(f'<circle cx="{C}" cy="{C}" r="{r}" fill="{g}"/>')
    if base == 'queijo':
        manchas(t, 16, r - 12, '#FFF4C9', .55, (8, 20))
        manchas(t, 8, r - 14, '#E9A93A', .35, (5, 10))
    elif base == 'carne':
        manchas(t, 40, r - 8, '#4A2312', .55, (3, 7))
        manchas(t, 18, r - 10, '#C9805A', .35, (2, 5))
    elif base in ('chocolate', 'doce_leite'):
        t.add(f'<path d="M{C - r * .55:.0f} {C - r * .25:.0f} q{r * .5:.0f} {-r * .35:.0f} {r * 1.05:.0f} {r * .05:.0f}" stroke="#fff" stroke-opacity=".18" stroke-width="10" fill="none" stroke-linecap="round"/>')
    elif base in ('branco', 'catupiry'):
        manchas(t, 10, r - 12, '#FFFFFF', .7, (8, 16))
        t.add(f'<path d="M{C - r * .5:.0f} {C:.0f} a{r * .5:.0f} {r * .5:.0f} 0 1 1 {r * .5:.0f} {r * .5:.0f} a{r * .32:.0f} {r * .32:.0f} 0 1 1 -{r * .2:.0f} -{r * .5:.0f}" stroke="#E2D2AE" stroke-width="5" fill="none" opacity=".7"/>')
    else:
        manchas(t, 18, r - 10, '#FFFFFF', .25, (5, 12))


# ----------------------------------------------------------------- produtos
def esfiha(nome, desc, uid, doce=False):
    t = Tela(uid)
    texto = f'{nome} {desc}'
    sombra(t, 146, 20, C + 152)
    massa_borda(t, 160, 122, uid)
    if doce:
        n = norm(texto)
        base = 'branco' if re.search(r'chocolate branco|beijinho', n) and 'preto' not in n else \
            'doce_leite' if 'doce de leite' in n else 'queijo' if 'romeu' in n else 'chocolate'
        recheio_base(t, base, 124, uid)
        tops = ingredientes(texto, DOCES)
        if 'meia' in tops:  # casadinha: meio branco, meio preto
            t.add(f'<path d="M{C} {C - 124} A124 124 0 0 1 {C} {C + 124}z" fill="{grad(t, f"w{uid}", "branco")}"/>')
            tops.remove('meia')
        espalhar(t, tops, 98, 1.75, .75)
    else:
        tops = ingredientes(texto, TOPPINGS)
        base = base_salgada(texto, tops)
        recheio_base(t, base, 124, uid)
        tops = [k for k in tops if not (k == base and k in ('catupiry', 'cheddar'))]
        if base == 'carne' and 'tomate' not in tops:
            tops.append('tomate')
        espalhar(t, tops, 96, 1.8, .62)
    t.add(f'<circle cx="{C}" cy="{C}" r="124" fill="none" stroke="#8C4A12" stroke-opacity=".25" stroke-width="3"/>')
    return t.svg(nome)


def pizza(nome, desc, uid, doce=False):
    t = Tela(uid)
    texto = f'{nome} {desc}'
    sombra(t, 176, 18, C + 176, .15)
    massa_borda(t, 186, 162, uid)
    if doce:
        n = norm(texto)
        base = 'branco' if 'branco' in n and 'leite' not in n else 'chocolate'
        recheio_base(t, base, 164, uid)
        tops = ingredientes(texto, DOCES)
        if 'meia' in tops:
            t.add(f'<path d="M{C} {C - 164} A164 164 0 0 1 {C} {C + 164}z" fill="{grad(t, f"w{uid}", "branco")}"/>')
            tops.remove('meia')
        espalhar(t, tops, 132, 2.0, .9)
    else:
        t.add(f'<circle cx="{C}" cy="{C}" r="164" fill="{grad(t, f"s{uid}", "molho")}"/>')
        tops = ingredientes(texto, TOPPINGS)
        base = base_salgada(texto, tops)
        recheio_base(t, 'queijo' if base == 'carne' else base, 156, uid)
        tops = [k for k in tops if not (k == base and k in ('frango', 'catupiry', 'cheddar', 'atum'))]
        if base in ('frango', 'atum', 'carne'):
            tops.insert(0, base)
        espalhar(t, tops, 134, 1.5, 1.15)
    for k in range(4):  # cortes em 8 fatias
        a = k / 4 * math.pi
        t.add(f'<line x1="{C + math.cos(a) * 164:.1f}" y1="{C + math.sin(a) * 164:.1f}" x2="{C - math.cos(a) * 164:.1f}" y2="{C - math.sin(a) * 164:.1f}" stroke="#5A2A0C" stroke-opacity=".22" stroke-width="2.5"/>')
    return t.svg(nome)


CAMADA = {
    'alface': ('#5DAA3A', 12), 'tomate': ('#E0402A', 9), 'queijo': ('#F7C440', 8), 'cheddar': ('#F28C1C', 8),
    'presunto': ('#EBA0A2', 8), 'bacon': ('#B04A32', 8), 'ovo': ('#FFFFFF', 12), 'carne': ('#6B3520', 20),
    'calabresa': ('#B3341F', 10), 'frango': ('#E2B977', 12), 'maionese': ('#FFF6DD', 5),
}


def lanche(nome, desc, uid):
    t = Tela(uid)
    n = norm(f'{nome} {desc}')
    sombra(t, 150, 16, 326, .2)
    camadas = []
    if re.search(r'salada|alface', n):
        camadas += ['alface', 'tomate']
    if 'maionese' in n or 'maoinese' in n:
        camadas.append('maionese')
    if 'cheddar' in n:
        camadas.append('cheddar')
    if re.search(r'queijo|misto|x-|x ', n):
        camadas.append('queijo')
    if 'presunto' in n or 'misto' in n:
        camadas.append('presunto')
    if 'ovo' in n or 'egg' in n:
        camadas.append('ovo')
    if 'bacon' in n:
        camadas.append('bacon')
    if 'calabresa' in n:
        camadas.append('calabresa')
    if 'frango' in n:
        camadas.append('frango')
    if 'carne' in n or 'burguer' in n or 'x-' in n or 'americano' not in n and 'misto' not in n:
        camadas += ['carne'] * (2 if re.search(r'duplo|2 carnes', n) else 1)
    y = 300
    t.add(f'<path d="M70 {y} q0 22 30 26 h200 q30 -4 30 -26z" fill="{grad(t, f"p{uid}", "massa", "50%", "20%")}"/>')
    for k in reversed(camadas):
        cor, h = CAMADA[k]
        y -= h
        if k == 'alface':
            t.add(f'<path d="M58 {y + h} q12 -{h} 24 0 t24 0 t24 0 t24 0 t24 0 t24 0 t24 0 t24 0 t24 0 t24 0 t24 0z" fill="{cor}"/>')
        elif k in ('queijo', 'cheddar'):
            t.add(f'<path d="M64 {y} h272 l-14 {h + 10} l-12 -{h + 4} l-26 {h + 14} l-18 -{h + 10} h-120 l-18 {h + 12} l-16 -{h + 8} l-20 {h + 6}z" fill="{cor}"/>')
        elif k == 'ovo':
            t.add(f'<rect x="76" y="{y}" width="248" height="{h}" rx="{h / 2}" fill="#FFFFFF" stroke="#EEE6D6"/><ellipse cx="200" cy="{y + h / 2}" rx="34" ry="{h / 2 + 2}" fill="#FFC21A"/>')
        elif k == 'tomate':
            for x0 in (84, 156, 228):
                t.add(f'<rect x="{x0}" y="{y}" width="88" height="{h}" rx="{h / 2}" fill="{cor}"/>')
        elif k == 'carne':
            t.add(f'<rect x="72" y="{y}" width="256" height="{h}" rx="{h / 2}" fill="{cor}"/>'
                  f'<path d="M86 {y + 6} h228" stroke="#4A2312" stroke-width="2" stroke-dasharray="10 8" opacity=".6"/>')
        else:
            t.add(f'<rect x="70" y="{y}" width="260" height="{h}" rx="{h / 2}" fill="{cor}"/>')
    topo = y - 4
    t.add(f'<path d="M62 {topo} q0 -96 138 -96 q138 0 138 96z" fill="{grad(t, f"q{uid}", "massa", "40%", "20%")}"/>')
    for x, yy in t.pontos(14, 70, 18, 200, topo - 52):
        if yy < topo - 14:
            t.add(f'<ellipse cx="{x:.1f}" cy="{yy:.1f}" rx="4" ry="2.4" fill="#FFF3D1" transform="rotate({t.r.randint(-40, 40)} {x:.1f} {yy:.1f})"/>')
    t.add(f'<path d="M96 {topo - 54} q40 -34 100 -36" stroke="#FFE6B0" stroke-width="8" fill="none" stroke-linecap="round" opacity=".5"/>')
    return t.svg(nome)


RECHEIO = [('carne', '#7A3E24'), ('calab', '#B3341F'), ('frango', '#E2B977'), ('brocolis', '#3F8A2E'),
           ('palmito', '#F7EFD2'), ('queijo', '#F7C440'), ('vento', '#F3E2C0')]


def fogazza(nome, desc, uid, pastel=False):
    t = Tela(uid)
    n = norm(f'{nome} {desc}')
    sombra(t, 150, 16, 318, .2)
    cor = next((c for k, c in RECHEIO if k in n), '#F7C440')
    queijo = re.search(r'queij|catu|requeij', n)
    if pastel:
        t.add(f'<rect x="64" y="128" width="272" height="170" rx="26" fill="{grad(t, f"m{uid}", "massa", "40%", "30%")}"/>')
        for k in range(14):
            x = 82 + k * 17.5
            t.add(f'<path d="M{x} 140 v10 M{x} 276 v10" stroke="#B86A22" stroke-width="3" stroke-linecap="round" opacity=".55"/>')
        manchas(t, 18, 90, '#FFE2A3', .35, (6, 14))
    else:
        t.add(f'<path d="M58 292 A142 142 0 0 1 342 292 z" fill="{grad(t, f"m{uid}", "massa", "45%", "30%")}"/>')
        for k in range(17):
            a = math.pi + k / 16 * math.pi
            x, y = 200 + math.cos(a) * 142, 292 + math.sin(a) * 142
            t.add(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="9" fill="#E7A346"/>')
        manchas(t, 14, 80, '#FFE2A3', .35, (6, 14), 200, 230)
    # mordida na ponta mostrando o recheio
    t.add(f'<ellipse cx="318" cy="250" rx="36" ry="44" fill="{cor}" stroke="#F3D49A" stroke-width="8"/>')
    if queijo:
        t.add('<path d="M300 236 q14 -10 30 4 q-8 16 -24 10z" fill="#FFF6DD" opacity=".9"/>')
    for k in range(3):
        x = 150 + k * 40
        t.add(f'<path d="M{x} 96 q-12 -18 0 -36 q12 -18 0 -36" stroke="#C9B9A6" stroke-width="5" fill="none" stroke-linecap="round" opacity=".45"/>')
    return t.svg(nome)


BEBIDA = [  # (regex, tipo, cor do corpo, cor do rótulo)
    (r'agua', 'garrafa', '#BFE3F5', '#2D8BC9'), (r'cafe c', 'xicara', '#C79A6B', ''), (r'cafe', 'xicara', '#4A2A17', ''),
    (r'sukita lata', 'lata', '#F7941D', '#FFFFFF'), (r'sukita', 'garrafa', '#F7941D', '#2E7D32'),
    (r'brahma', 'lata', '#C8102E', '#FFFFFF'), (r'imperio', 'garrafa-v', '#6B3A17', '#1E3A8A'),
    (r'original', 'garrafa-v', '#6B3A17', '#E8E1D0'), (r'caculinha|coca', 'garrafa', '#2B1208', '#D50000'),
    (r'jaboti', 'garrafa', '#1E7A3A', '#FFD000'), (r'tiss', 'garrafa', '#6E2C8C', '#FFD000'),
    (r'1,5|pepsi|fanta', 'garrafa', '#1B1B3A', '#F7941D'), (r'lata', 'lata', '#B71C1C', '#FFFFFF'),
]


def bebida(nome, desc, uid):
    t = Tela(uid)
    n = norm(f'{nome} {desc}')
    tipo, corpo, rot = next(((tp, c1, c2) for rx, tp, c1, c2 in BEBIDA if re.search(rx, n)), ('lata', '#B71C1C', '#FFFFFF'))
    sombra(t, 90, 14, 340, .22)
    if tipo == 'lata':
        t.add(f'<rect x="128" y="96" width="144" height="242" rx="20" fill="{corpo}"/>'
              f'<rect x="138" y="84" width="124" height="22" rx="10" fill="#C9CED6"/><rect x="138" y="328" width="124" height="16" rx="8" fill="#AEB4BD"/>'
              f'<path d="M128 170 q72 -26 144 0 v60 q-72 26 -144 0z" fill="{rot}" opacity=".92"/>'
              f'<rect x="146" y="112" width="14" height="210" rx="7" fill="#fff" opacity=".22"/>')
    elif tipo == 'xicara':
        t.add(f'<ellipse cx="200" cy="318" rx="128" ry="22" fill="#EFE6D8"/><path d="M110 170 h180 v80 q0 64 -90 64 q-90 0 -90 -64z" fill="#FFFFFF" stroke="#E5DACA" stroke-width="3"/>'
              f'<path d="M290 196 q46 0 46 34 q0 34 -50 32" stroke="#FFFFFF" stroke-width="16" fill="none"/><ellipse cx="200" cy="172" rx="90" ry="16" fill="{corpo}"/>')
        for k in range(3):
            x = 168 + k * 32
            t.add(f'<path d="M{x} 146 q-12 -18 0 -36 q12 -18 0 -36" stroke="#C9B9A6" stroke-width="5" fill="none" stroke-linecap="round" opacity=".5"/>')
    else:
        alto = tipo == 'garrafa'
        top = 52 if alto else 74
        t.add(f'<path d="M180 {top} h40 v36 q44 30 44 78 v158 q0 18 -18 18 h-92 q-18 0 -18 -18 v-158 q0 -48 44 -78z" fill="{corpo}" opacity="{.75 if "agua" in n else 1}"/>'
              f'<rect x="176" y="{top - 16}" width="48" height="22" rx="6" fill="{rot if alto else "#D4AF37"}"/>'
              f'<rect x="136" y="210" width="128" height="70" rx="8" fill="{rot}"/>'
              f'<rect x="150" y="{top + 70}" width="12" height="200" rx="6" fill="#fff" opacity=".25"/>')
    return t.svg(nome)


def combo(nome, desc, uid):
    """Caixa aberta com esfihas (para combos sem foto)."""
    t = Tela(uid)
    sombra(t, 170, 18, 336, .2)
    t.add('<path d="M40 150 h320 l-20 180 h-280z" fill="#C0392B"/><path d="M40 150 h320 l-12 22 h-296z" fill="#962D22"/>'
          '<path d="M60 70 h280 l20 80 h-320z" fill="#E74C3C"/>')
    for k, (x, y) in enumerate(((120, 230), (200, 236), (280, 230))):
        t.add(f'<circle cx="{x}" cy="{y}" r="44" fill="#E7A346"/><circle cx="{x}" cy="{y}" r="32" fill="{["#7A3E24", "#F2C95C", "#B3341F"][k]}"/>')
    t.add('<path d="M168 112 l10 -22 l10 22 l24 2 l-18 16 l6 24 l-22 -12 l-22 12 l6 -24 l-18 -16z" fill="#FFD23F"/>')
    return t.svg(nome)


def ilustrar(item, cat):
    nome, desc, uid = item['nome'], item.get('desc', ''), item['id']
    if cat in ('esfihas', 'especiais'):
        return esfiha(nome, desc, uid)
    if cat == 'doces':
        return esfiha(nome, desc, uid, doce=True)
    if cat == 'pizzas':
        return pizza(nome, desc, uid)
    if cat == 'pizzas-doces':
        return pizza(nome, desc, uid, doce=True)
    if cat == 'lanches':
        return lanche(nome, desc, uid)
    if cat == 'fogazzas':
        return fogazza(nome, desc, uid, pastel=nome.lower().startswith('pastel'))
    if cat == 'bebidas':
        return bebida(nome, desc, uid)
    return combo(nome, desc, uid)
