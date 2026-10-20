# Site do Ponto da Esfiha Faria Lima (prévia)

Site de uma página com o cardápio completo do Ponto da Esfiha Faria Lima (Av. Brig. José Vicente de Faria Lima, 750, Jardim Maria Augusta, Taubaté), para computador e celular.

## Abrir

Dê dois cliques no `index.html`. Precisa de internet só para as fontes e o mapa; fotos e ilustrações estão na pasta `fotos/`.

## Arquivos

| Arquivo | Para que serve |
| --- | --- |
| `index.html` | A página |
| `css/estilo.css` | Visual. As cores ficam no topo (`--tomato`, `--crust`) |
| `js/dados.js` | Loja, horários, entrega, bordas, combos e o cardápio inteiro (gerado automaticamente) |
| `js/app.js` | Funcionamento: caixa de esfihas, pizza meio a meio, sacola, animações, galeria infinita |
| `fotos/cardapio/` | As 42 fotos de itens do cardápio online da loja |
| `fotos/ilustracoes/` | 123 ilustrações (uma por item sem foto), desenhadas a partir dos ingredientes |
| `fotos/local/` | Logo e fotos da loja no Google Maps |
| `_coleta/` | Dados coletados, os scripts de coleta e o que gera `dados.js` e as ilustrações. `ilustracoes.html` mostra todas as ilustrações juntas |
| `REVISAR.md` | O que confirmar com o dono antes de publicar |
| `AVALIACAO-SITE-ATUAL.md` | Avaliação do cardápio atual (Menudino), boa para mostrar ao dono |

## Mudar algo

- **Preço, nome ou descrição:** edite direto em `js/dados.js`.
- **Trocar uma ilustração por foto:** ponha a foto em `fotos/cardapio/` e, no item em `js/dados.js`, troque o caminho de `img` e apague a linha `"ilus": 1`.
- **Gerar tudo de novo:** rode `python gerar_dados.py` dentro de `_coleta`. Isso sobrescreve o `dados.js` e as ilustrações (edições feitas à mão no `dados.js` se perdem).

## O que tem no site

- Abertura com uma esfiha recebendo o recheio (só na primeira visita)
- Endereço como placa de rua e "O endereço do sabor", a frase da logo
- Tábua giratória com a foto da casa no centro e itens do cardápio em órbita
- Duas fitas infinitas cruzadas que aceleram e mudam de direção com a rolagem
- **Monte sua caixa:** 10, 20 ou 40 esfihas, a caixa enche na tela, total e média por esfiha, aviso quando um combo sai mais barato
- Carrossel infinito dos combos (arrasta com impulso e encaixa), com quanto cada um economiza quando dá para calcular
- Cardápio com abas fixas, busca e filtros; esfihas em grade compacta
- Pizza broto ou grande, meio a meio (imagem dividida ao meio, cobra o sabor mais caro) e borda
- Sacola com entrega, retirada ou comer no salão, pedido mínimo de R$ 18 na entrega, troco e pedido pronto no WhatsApp
- Faixa infinita com as fotos da casa e galeria infinita com os 165 itens
- Horários, entrega, pagamento, mapa e botões de rota, WhatsApp, ligar e Facebook
- Tema claro (padrão) e escuro
