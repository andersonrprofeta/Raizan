# Especificação do módulo de Compras

Texto do dono, guardado como veio. A correção de escopo (mais abaixo) vale sobre a versão original.

## Versão original

```text
/*
MÓDULO: HUB DE COMPRAS / ENTRADA DE MERCADORIAS

Objetivo:
Centralizar todo o processo de entrada de mercadorias do Raizan Core, independentemente da origem dos dados.

Fontes de integração previstas:
- Omie
- Tiny ERP
- APIs proprietárias
- Planilhas importadas
- Futuras integrações externas

Requisitos funcionais:

1. Dashboard de Entrada
- Exibir todas as entradas de mercadorias em uma única interface centralizada.
- Permitir filtros por:
  - fornecedor
  - pedido de compra
  - data
  - status
  - origem da integração
  - centro de distribuição
- Busca rápida com alta performance.

2. Pedidos de Compra
- Listar todos os pedidos de compra vinculados às entradas.
- Exibir status completos:
  - aguardando recebimento
  - recebido parcialmente
  - recebido integralmente
  - divergência encontrada
  - conferência finalizada
- Possibilitar rastreabilidade entre:
  Pedido → Entrada → Conferência → Estoque.

3. Conferência Cega
- Implementar geração e impressão de mapa de conferência cega.
- O operador responsável pela conferência não deve visualizar as quantidades esperadas.
- O layout será baseado no PDF que será enviado posteriormente para análise.
- A estrutura de impressão deverá ficar preferencialmente em:

  components/compras/MapaEntrada.js

- Caso a complexidade exija, criar componentes auxiliares específicos.

4. UX / Experiência do Usuário
- Desenvolver a melhor experiência operacional possível para equipes de recebimento.
- Minimizar quantidade de cliques.
- Priorizar velocidade de conferência.
- Suportar operação em desktop, tablet e coletores industriais. (no momento eu renderizo no electron pra rafany)
- Utilizar feedback visual claro para:
  - itens pendentes
  - itens divergentes
  - itens conferidos
  - recebimento concluído

5. Banco de Dados
Criar tabela (ou conjunto de tabelas) denominada:

  hub_compras

A estrutura deve ser preparada para se tornar o repositório central de compras do sistema.

Campos sugeridos:
- id
- origem_integracao
- codigo_externo
- pedido_compra
- fornecedor_id
- fornecedor_nome
- produto_id
- sku
- ean
- descricao
- quantidade_pedida
- quantidade_recebida
- quantidade_conferida
- unidade_medida
- valor_unitario
- valor_total
- status_recebimento
- data_emissao
- data_prevista
- data_recebimento
- usuario_responsavel
- observacoes
- metadata_json

6. Visão Estratégica
Toda a implementação deve seguir uma arquitetura desacoplada e orientada ao Core.

O objetivo de longo prazo é transformar o Raizan Core em um ERP autossuficiente, capaz de operar sem dependência obrigatória de plataformas externas como Omie, Tiny ou qualquer outro ERP.

As integrações devem ser tratadas apenas como provedores de dados, enquanto o Raizan Core se torna a fonte primária e soberana das informações de compras, recebimentos e estoque.

Portanto, toda modelagem de banco, APIs, componentes e regras de negócio deve ser projetada considerando futura independência completa das integrações externas.

/*
MÓDULO: INTELIGÊNCIA DE COMPRAS E ABASTECIMENTO

Aproveitando que já possuímos todas as regras de estoque mínimo, ponto de corte,
movimentação de produtos, histórico de vendas e consumo do sistema, criar um
módulo avançado de Inteligência de Compras dentro do Raizan Core.

O objetivo não é apenas gerar relatórios, mas fornecer recomendações automáticas
de abastecimento baseadas em comportamento real do estoque.

=================================================================
VISÃO DE PRODUTO
=================================================================

O Raizan Core deve ser capaz de identificar riscos operacionais,
oportunidades de compra e necessidades de reposição antes que o problema aconteça.

A área de Compras deve funcionar como um cockpit inteligente, exibindo
indicadores, alertas e sugestões acionáveis em tempo real.

=================================================================
RELATÓRIOS E SUGESTÕES DE COMPRAS
=================================================================

1. ESTOQUE ABAIXO DO MÍNIMO

Detectar produtos que atingiram ou ultrapassaram o estoque mínimo definido.

Exibir:
- Estoque atual
- Estoque mínimo
- Estoque ideal
- Sugestão de compra
- Dias restantes de cobertura

Classificação:
- Crítico
- Atenção
- Saudável

=================================================================

2. PONTO DE CORTE ATINGIDO

Utilizar as informações já cadastradas de corte e reposição.

Gerar automaticamente:

"Produtos que precisam entrar em processo de compra agora"

Exibir:
- Produto
- Quantidade recomendada
- Consumo médio
- Prazo médio de entrega do fornecedor
- Risco de ruptura

=================================================================

3. QUEDA ABRUPTA DE ESTOQUE

Detectar variações anormais de saída.

Exemplos:
- Produto vende normalmente 50 unidades por semana e vendeu 300.
- Produto teve movimentação muito acima da média histórica.
- Crescimento repentino de consumo.

Gerar alerta:

"Possível ruptura de estoque em X dias"

=================================================================

4. TENDÊNCIA DE ESGOTAMENTO

Utilizar médias móveis e histórico de movimentação.

Períodos:
- 7 dias
- 15 dias
- 30 dias
- 60 dias
- 90 dias
- 180 dias

Exibir previsão:

- Acaba em 5 dias
- Acaba em 12 dias
- Acaba em 25 dias

Baseado no consumo real.

=================================================================

5. REPOSIÇÃO AUTOMÁTICA SUGERIDA

Criar motor de sugestão que recomende quantidade ideal de compra.

Fatores:

- Estoque atual
- Estoque mínimo
- Estoque ideal
- Histórico de vendas
- Sazonalidade
- Pedidos pendentes
- Compras em trânsito
- Tempo de entrega do fornecedor

Resultado:

"Sugerimos comprar 450 unidades"

com justificativa completa da recomendação.

=================================================================

6. PRODUTOS SEM MOVIMENTAÇÃO

Identificar itens parados.

Períodos:
- 30 dias
- 60 dias
- 90 dias
- 180 dias
- 365 dias

Exibir:

- Valor parado em estoque
- Quantidade parada
- Última movimentação

=================================================================

7. COMPRAS EM TRÂNSITO

Exibir produtos já comprados e ainda não recebidos.

Objetivo:
Evitar compras duplicadas.

Indicadores:

- Pedido emitido
- Quantidade comprada
- Previsão de chegada
- Dias de atraso

=================================================================

8. ANÁLISE DE RUPTURA

Identificar produtos que chegaram a estoque zero.

Exibir:

- Quantidade de dias sem estoque
- Perda estimada de vendas
- Histórico de ocorrências

=================================================================

9. CURVA ABC DE COMPRAS

Classificar itens por relevância.

Classe A
- Produtos mais importantes

Classe B
- Produtos intermediários

Classe C
- Produtos de baixa relevância

Permitir filtros por:

- Unidade
- Período
- Categoria
- Fornecedor

=================================================================

10. SAZONALIDADE

Analisar comportamento anual.

Exemplos:

- Produtos que crescem no final do ano.
- Produtos com pico em determinadas épocas.
- Produtos que possuem demanda recorrente em meses específicos.

Utilizar o histórico para antecipar compras.

=================================================================

11. PAINEL EXECUTIVO

Criar dashboard executivo contendo:

- Valor total em estoque
- Capital imobilizado
- Produtos críticos
- Produtos em ruptura
- Compras em trânsito
- Sugestões automáticas
- Economia potencial
- Cobertura média do estoque

=================================================================
EXPERIÊNCIA DO USUÁRIO (UX/UI)
=================================================================

Manter padrão premium nível Apple.

Princípios obrigatórios:

- Interface limpa
- Poucos elementos visuais
- Hierarquia clara de informação
- Tipografia elegante
- Espaçamento generoso
- Animações suaves
- Feedback visual sofisticado
- Nada poluído ou com aparência de ERP antigo

Dashboard inspirado em:

- Apple Business Manager
- Notion
- Stripe Dashboard
- Linear
- Vercel

Priorizar:

- Leitura rápida
- Visualização executiva
- Zero excesso de informação
- Ações importantes destacadas
- Uso inteligente de cores e indicadores

=================================================================
VISÃO FUTURA
=================================================================

Toda a inteligência deve ser construída dentro do Raizan Core.

O objetivo é que, no futuro, o sistema possua motor próprio de previsão
de compras e abastecimento, eliminando dependência operacional de ERPs externos.

Omie, Tiny e demais integrações devem ser tratados apenas como fontes de dados.

A inteligência, previsão, decisão e gestão devem pertencer exclusivamente ao Raizan Core.
*/


```

## Correção de escopo (10/11/2026)

```text
/*
================================================================================
CORREÇÃO DE ESCOPO - MÓDULO DE COMPRAS
================================================================================

A implementação atual não representa o objetivo do módulo.

Precisamos refatorar completamente o conceito da tela.

O objetivo NÃO é criar uma tela de "Entrada de Mercadorias".

O objetivo é criar um HUB DE COMPRAS.

================================================================================
CONCEITO CORRETO
================================================================================

Este módulo deve funcionar como a CENTRAL DE COMPRAS do Raizan Core.

Toda operação principal deve acontecer dentro do Core.

Integrações externas (Omie, Tiny, Bling, etc) são apenas fontes opcionais
de dados.

Não construir a tela baseada em Omie.

Não utilizar Omie como entidade principal da interface.

Não utilizar textos como:

- Importar do Omie
- Pedidos Omie
- Conferência Omie

Isso cria dependência visual incorreta.

O usuário deve sentir que está operando o Raizan Core.

Integrações devem ficar em segundo plano.

================================================================================
OBJETIVO DA TELA
================================================================================

A tela principal deve exibir:

- Pedidos de Compra
- Orçamentos de Compra
- NF-es de Entrada
- Conferências
- Recebimentos
- Divergências

Tudo em uma única central operacional.

================================================================================
CADASTRO DE PEDIDOS DE COMPRA
================================================================================

Botão:

[ Novo Pedido de Compra ]

Permitir:

- seleção de fornecedor
- inclusão de produtos
- múltiplos produtos
- observações
- condições comerciais
- previsão de entrega

Status possíveis:

- Orçamento
- Aguardando Aprovação
- Aprovado
- Pedido Emitido
- Recebimento Parcial
- Recebido
- Cancelado

================================================================================
ORÇAMENTOS DE COMPRA
================================================================================

Orçamentos devem existir como entidade própria.

Objetivo:

Consultar múltiplos fornecedores antes da compra.

Fluxo:

Orçamento
↓
Aprovação
↓
Pedido de Compra

Não misturar orçamento com pedido.

================================================================================
NF-E DE ENTRADA
================================================================================

Criar área específica para notas fiscais de entrada.

Exibir:

- Número NF
- Série
- Chave
- Fornecedor
- Valor
- Data emissão
- Data entrada
- Situação

Badge visual:

[NF-e Recebida]

[NF-e Pendente]

[NF-e Divergente]

[NF-e Integrada]

Ao clicar:

Expandir produtos da nota.

================================================================================
LISTAGEM PRINCIPAL
================================================================================

A tela principal deve ter aparência similar a:

Gmail
Stripe
Linear
Notion

Lista rica de documentos.

Exemplo:

| Tipo | Número | Fornecedor | Valor | Status |

[ORÇAMENTO]
[PEDIDO]
[NF-E]

Cada linha deve permitir expansão.

Ao expandir:

Visualizar produtos.

================================================================================
CONFERÊNCIA CEGA
================================================================================

IMPORTANTE

Conferência Cega NÃO é uma tela.

Conferência Cega é um mapa de conferência impresso.

Utilizar como referência o PDF enviado.

A conferência cega consiste em:

- exibir produtos
- exibir código
- exibir descrição

SEM mostrar quantidade esperada.

O conferente deve preencher manualmente:

- quantidade recebida
- lote
- validade

O modelo atual do PDF representa corretamente o processo.

Implementar geração automática deste relatório.

O objetivo é imprimir para uso físico no recebimento.

Não construir uma tela de checkout.

Não construir Wizard.

Não construir recebimento simplificado.

Trata-se de um relatório operacional.

Conforme modelo do PDF de conferência física.

(No Raizan Core se chama "Mapa de entrada de produtos". Manter o visual dos outros PDFs do sistema.)

================================================================================
IMPORTAÇÃO DE DADOS
================================================================================

Integrações são secundárias.

Omie
Tiny
Bling
ERP Próprio

Todos são apenas provedores de dados.

Arquitetura esperada:

ERP Externo
↓
Webhook
ou
Sincronização Manual
↓
Core
↓
Operação Principal

A partir do momento que o documento entra no Core,
todo o processo acontece no Core.

================================================================================
HUB_COMPRAS
================================================================================

Criar tabela principal:

hub_compras

Objetivo:

Ser a fonte oficial das informações de compras.

Não depender estruturalmente dos ERPs externos.

Campos importantes:

- id
- origem_documento
- tipo_documento
- numero_documento
- fornecedor
- chave_nfe
- valor_total
- status
- data_emissao
- data_previsao
- data_recebimento
- observacao

================================================================================
VISUAL
================================================================================

A tela atual não transmite "Compras".

Ela transmite "Recebimento Operacional".

Precisamos de uma Central de Compras.

Visual de referência:

Apple Business
Stripe
Linear
SAP Fiori

Experiência:

- lista rica de documentos
- badges elegantes
- filtros rápidos
- dashboards superiores
- KPIs de compras
- fornecedores
- orçamentos
- pedidos
- notas fiscais
- recebimentos

O usuário deve visualizar imediatamente o ciclo completo de compras.

Não uma tela de conferência de mercadorias.
================================================================================
*/
```
