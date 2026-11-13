# Cooper NYC · Site editorial

Página única estática, com conteúdo em português, navegação por âncoras e agendamento por WhatsApp. Abra index.html ou sirva a pasta com um servidor estático. O site funciona sem build, framework ou backend.

## Arquivos

- index.html — 17 blocos comentados, SEO, catálogo, formulários e links.
- css/site.css — paleta, tipografia, layout responsivo e animações.
- js/site.js — menu, scroll, vídeo, galerias, busca, orçamento, horário local, WhatsApp e sincronização do FAQ.
- img/ e video/ — fotos, versões responsivas, tipografia e montagem do hero.
- imagens-originais.csv — URL original e dimensões de cada imagem.
- robots.txt e sitemap.xml — configuração para a prévia e referência para publicação.
- CHECKLIST.md — validações e itens de lançamento.

## GitHub Pages

Envie o conteúdo deste ZIP para a raiz do branch main de um repositório e selecione Settings → Pages → Deploy from a branch → main → /(root). A navegação, imagens, fontes e vídeo usam caminhos relativos.

A prévia usa noindex e URL canônica privada. Depois de confirmar o endereço público, troque a URL em canonical, Open Graph, Twitter Card, JSON-LD, sitemap.xml e robots.txt. Na versão pública aprovada, remova a meta noindex e substitua Disallow: / por Allow: /. Em Pages de projeto, o robots.txt na subpasta não vale para todo o host. Envie o sitemap do projeto ao Search Console quando fizer a publicação.

## Atualizar conteúdo

- Preços e links por serviço ficam em #servicos. As caixas da calculadora usam data-budget-service e os valores em reais. Durações são estimativas de planejamento e devem ser aprovadas.
- Os três artigos seguem a ordem observada no índice do Cooper Times. Atualize os cards de #blog com os títulos e links do WordPress quando mudar a seleção.
- Os depoimentos são trechos presentes na captura do site. A nota de 5,0 e as 118 avaliações são um registro datado de 13/10/2026, publicado pelo Local Brazil. O botão Google aponta ao perfil para consultar os números atuais.
- O endereço do briefing é R. Padre Chagas, 347. O site oficial também contém referência à Av. Independência, 599. Confirme o endereço com a equipe antes de indexar ou assumir o domínio oficial.
- A montagem do hero dura cerca de 5,5 s, tem 242 kB e usa duas fotos reais do salão. Para inserir uma filmagem, substitua video/cooper-motion.mp4 e mantenha o pôster ou atualize os dois.
- O comparador mostra dois trabalhos distintos. Quando houver um par aprovado do mesmo atendimento, troque as duas imagens, os textos alternativos e a legenda em #mechas.
- As fotos foram extraídas da captura do site. Confirme a autorização de uso com a Cooper antes da publicação pública.

## Dimensões para fotos novas

| Uso | Dimensão sugerida |
|---|---|
| Hero ou fachada | 1440 × 1080 px |
| Imagens para carrossel | 1280 × 800 px |
| Corte, cor e comparador | 960 × 1200 px |
| Galeria de espaço | 1100 × 850 px, ou 850 × 1100 px na vertical |
| Prévia social | 1200 × 630 px |
| Selo do mascote | 300 × 300 px |

O projeto usa WebP. Entregue uma versão de 480 px de largura para imagens maiores e conserve a proporção.
