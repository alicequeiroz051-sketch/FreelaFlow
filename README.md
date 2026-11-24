# FreelaFlow

Plataforma de gerenciamento para freelancers: clientes, projetos, orçamentos e propostas em uma interface dark, responsiva e sem dependências externas.

## Problema que resolve
Freelancers costumam controlar clientes, prazos e valores em planilhas, mensagens e anotações soltas. O FreelaFlow reúne tudo em um só painel e ajuda a precificar e formalizar propostas.

## Funcionalidades
- **Painel:** total de clientes, projetos ativos, propostas pendentes, faturamento previsto (projetos em Planejamento + Em andamento), gráfico mensal (valor dos projetos por mês de prazo, exceto cancelados) e atividades recentes.
- **Clientes:** cadastrar, editar, excluir, pesquisar e ver projetos/propostas associados.
- **Projetos:** CRUD com cliente, valor, prazo e status (Planejamento, Em andamento, Concluído, Cancelado) e filtro por status.
- **Calculadora de orçamento:** `preço = (horas × valor/hora + custos adicionais) × (1 + margem/100)`, com opção de transformar o resultado em proposta.
- **Propostas:** serviços e valores, validade, status (Pendente, Aprovada, Recusada), visualização e impressão.
- **Persistência:** tudo salvo no LocalStorage. Os dados de exemplo vêm marcados como "exemplo" e podem ser removidos em *Ajustes*.
- Exportação de dados em arquivo JSON para backup.
- Importação de backups em JSON para recuperação dos dados.

## Tecnologias
HTML5, CSS3 e JavaScript puro (Vanilla JS), LocalStorage e ícones/gráfico em SVG inline. Nenhum framework ou biblioteca externa.

## Estrutura
```
FreelaFlow/
├── index.html
├── css/style.css
├── js/app.js
├── assets/favicon.svg
└── README.md
```

## Como executar
Abra o `index.html` no navegador ou use uma extensão como Live Server. Não há instalação nem build.

## Publicação no GitHub Pages
1. Crie um repositório e envie os arquivos na raiz.
2. Em **Settings → Pages**, escolha **Deploy from a branch**, a branch `main` e a pasta `/ (root)`.
3. Aguarde alguns minutos e acesse `https://SEU-USUARIO.github.io/NOME-DO-REPOSITORIO/`.

## Qualidade
Escape de HTML em todo conteúdo digitado (prevenção de XSS), validação de formulários, tratamento de erros no LocalStorage, navegação por teclado, `aria-label` no gráfico e `prefers-reduced-motion`.

## Testes realizados
A versão atual foi testada em Chromium (Playwright) com 79 verificações automatizadas: navegação, CRUD de clientes/projetos/propostas, pesquisa e filtros, validações, cálculos do orçamento, persistência após recarregar, dados corrompidos no LocalStorage, tentativa de XSS, sincronização entre abas, impressão (PDF) e layouts de 320 px, 360 px e desktop. Não foram testados Safari, Firefox nem aparelhos físicos.

## Limitações conhecidas
- Os dados ficam só neste navegador/dispositivo; limpar os dados do site apaga tudo.
- Exclusões usam `confirm()` nativo e não podem ser desfeitas.
- Em modo anônimo o LocalStorage pode não persistir.
- Os dados ficam armazenados localmente no navegador (LocalStorage), sem sincronização automática entre dispositivos.

## Possíveis melhorias
- Exportar/importar dados em JSON e exportar propostas em PDF.
- Vincular propostas aprovadas a projetos automaticamente.
- Campo de pagamentos recebidos para um faturamento realizado.
- Testes automatizados das funções de cálculo.
- Exportação de propostas em PDF.
- Vincular propostas aprovadas aos projetos automaticamente.
- Campo de pagamentos recebidos para controle do faturamento.
- Testes automatizados das funções de cálculo.