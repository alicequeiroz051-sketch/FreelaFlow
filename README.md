# FreelaFlow

Plataforma de gerenciamento para freelancers, desenvolvida para organizar clientes, projetos, orçamentos e propostas comerciais em uma interface moderna, responsiva e intuitiva.

## Problema que resolve

Freelancers frequentemente precisam controlar clientes, prazos, valores e propostas utilizando planilhas, mensagens e anotações separadas.

O FreelaFlow reúne essas informações em um único painel, facilitando a organização dos trabalhos, o acompanhamento dos projetos e a elaboração de orçamentos.

## Funcionalidades

- **Dashboard:** indicadores de clientes, projetos ativos, propostas pendentes, faturamento previsto, gráfico financeiro mensal e atividades recentes.
- **Clientes:** cadastro, edição, exclusão, pesquisa e visualização de projetos e propostas associados.
- **Projetos:** gerenciamento de projetos, com cliente vinculado, valor, prazo e status.
- **Calculadora de orçamento:** cálculo de preços considerando horas trabalhadas, valor por hora, custos adicionais e margem de lucro.
- **Propostas comerciais:** cadastro de serviços, valores, validade e status, com visualização e impressão.
- **Persistência de dados:** armazenamento local utilizando LocalStorage.
- **Backup:** exportação e importação de dados em formato JSON.
- **Interface responsiva:** adaptação para diferentes tamanhos de tela.

## Tecnologias utilizadas

- HTML5
- CSS3
- JavaScript puro (Vanilla JavaScript)
- LocalStorage
- SVG para elementos gráficos e ícones.

O projeto não utiliza frameworks ou bibliotecas externas.

## Estrutura do projeto

```text
FreelaFlow/
├── index.html
├── css/
│   └── style.css
├── js/
│   └── app.js
├── assets/
│   └── favicon.svg
└── README.md
```

## Como executar

1. Clone ou baixe este repositório.
2. Abra a pasta do projeto.
3. Abra o arquivo `index.html` no navegador.

Também é possível utilizar a extensão Live Server no Visual Studio Code.

Não é necessária instalação de dependências ou processo de build.

## Publicação no GitHub Pages

O projeto pode ser publicado gratuitamente utilizando o GitHub Pages.

1. Acesse as configurações do repositório.
2. Entre em Settings → Pages.
3. Selecione Deploy from a branch.
4. Escolha a branch `main` e a pasta `/ (root)`.
5. Salve as configurações e aguarde a publicação.

## Segurança e qualidade

A versão atual possui:

- Escape de conteúdo HTML inserido pelo usuário.
- Validação de formulários.
- Tratamento de erros no LocalStorage.
- Navegação por teclado.
- Atributos de acessibilidade, incluindo `aria-label`.
- Respeito à preferência `prefers-reduced-motion`.

## Testes realizados

Em 25/11/2026, foram realizados testes funcionais manuais envolvendo:

- Cadastro, edição e exclusão de clientes.
- Cadastro, edição e exclusão de projetos.
- Associação entre projetos e clientes.
- Cadastro, visualização, edição e exclusão de propostas.
- Persistência dos dados após atualização da página.
- Exportação e importação de backups JSON.
- Conferência dos dados exportados.
- Verificação dos indicadores do dashboard.

A validação automatizada com Playwright e suas 79 verificações ainda precisa ser documentada e confirmada separadamente.

## Limitações atuais

- Os dados são armazenados exclusivamente no navegador, por meio do LocalStorage.
- Não existe sincronização automática entre dispositivos.
- A limpeza dos dados do navegador pode apagar os registros.
- Não existe autenticação ou gerenciamento de contas de usuários.
- As exclusões não possuem mecanismo de desfazer.
- A impressão de propostas utiliza os recursos do próprio navegador.

## Próximas evoluções

O FreelaFlow está sendo planejado para evoluir de uma aplicação local para uma plataforma SaaS.

As melhorias previstas incluem:

- **Infraestrutura:** banco de dados na nuvem, autenticação e sincronização entre dispositivos.
- **Relacionamentos:** vínculo entre propostas aprovadas e projetos.
- **Documentos:** geração e exportação de propostas e relatórios em PDF.
- **Financeiro:** controle de pagamentos, controles de pagamentos e status de assinatura.
- **Dashboard:** indicadores financeiros mais completos.
- **Automação:** testes automatizados e validações de integração.
- **Monetização:** planos gratuitos e pagos, assinaturas e integração com provedores de pagamento.
- **Segurança:** isolamento dos dados dos usuários e políticas de acesso.

## Objetivo do projeto

Construir uma plataforma completa para freelancers, reunindo gestão de clientes, projetos, propostas e finanças em um único ambiente.

**FreelaFlow — Organização para quem trabalha por conta própria.**
