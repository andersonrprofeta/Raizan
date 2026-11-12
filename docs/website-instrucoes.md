

CLAUDE COMECE PELO RAIZAN CORE

RAIZAN CORE — NOVO ECOSSISTEMA DE DASHBOARD, RAIZAN INSIGHT E GESTÃO DE SITES

## Instruções completas de implementação para Claude

Você será responsável por evoluir o Raizan Core, implementando um novo ecossistema de gerenciamento de sites, analytics, formulários, leads, dashboards inteligentes, licenciamento e notificações.

**ATENÇÃO: este projeto já possui funcionalidades em produção. Não reconstrua o Raizan Core do zero e não substitua os dashboards existentes. A missão é evoluir a arquitetura atual, preservando tudo o que já funciona.**

O desenvolvimento deverá considerar o frontend existente, backend, banco de dados, autenticação, controle de usuários, isolamento multitenant e aplicação Electron.

---

# 1. PRIMEIRA ETAPA — AUDITORIA OBRIGATÓRIA DO RAIZAN CORE

Antes de alterar qualquer código, faça uma auditoria do projeto.

Investigue especialmente:

- A página `page.js` responsável pelo dashboard.
- Os três modelos de dashboard já existentes.
- Como o sistema identifica o nível de acesso do usuário.
- Como diferencia administrador, televendas, separação, financeiro e demais perfis.
- Como funciona o controle de permissões.
- Como o `tenant_id` é obtido.
- Como as empresas são cadastradas.
- Como os módulos são instalados e ativados.
- Como funciona o painel de integrações.
- Como o sistema identifica ERP conectado.
- Como os pedidos são consultados.
- Como funcionam as notificações de novos pedidos.
- Como o Electron carrega a aplicação.
- Como funciona a autenticação entre frontend e backend.
- Como estão organizadas as tabelas existentes.

Identifique as APIs, tabelas e componentes que já atendem a essas funcionalidades.

Não crie estruturas duplicadas sem necessidade.

Não remova os três dashboards existentes.

Não altere permissões de usuários sem entender primeiro a implementação atual.

### Entrega da auditoria

Antes de programar, apresente:

1. Como funciona atualmente o dashboard.
2. Quais são os três modelos existentes.
3. Quais permissões determinam cada modelo.
4. Quais componentes podem ser reaproveitados.
5. Quais APIs e tabelas poderão ser utilizadas.
6. O que precisará ser criado.
7. Quais arquivos serão alterados.

Depois dessa análise, execute a implementação.

---

# 2. NOVA FILOSOFIA DO DASHBOARD — DASHBOARD INTELIGENTE

O Raizan Core não pode depender de ERP para oferecer valor ao cliente.

Atualmente, uma empresa pode contratar somente um site institucional, sem ERP, sem Portal B2B, sem Raizan Seller e sem qualquer ferramenta de vendas conectada.

Mesmo assim, quando essa empresa entrar no Raizan Core, ela deverá encontrar um dashboard profissional, funcional e rico em informações.

O site institucional será a primeira fonte de inteligência comercial dessa empresa.

## Regra principal

Todo tenant deverá possuir um dashboard-base institucional.

Os outros módulos acrescentarão informações ao dashboard conforme suas funcionalidades e permissões.

Não quero criar vários dashboards independentes que se sobreponham.

Quero um sistema inteligente de composição de dashboards.

### Exemplos de funcionamento

**Cenário A — Empresa contratou somente o site institucional**

O dashboard deverá mostrar:

- Visitas no site.
- Visitantes únicos.
- Sessões.
- Páginas mais acessadas.
- Regiões com maior volume de acessos.
- Origem dos visitantes.
- Cliques em WhatsApp.
- Cliques em telefone.
- Cliques em e-mail.
- Formulários recebidos.
- Novos leads.
- Conversões.
- Últimas interações.
- Desempenho dos formulários.

Não mostrar pedidos, estoque, faturamento ou indicadores de ERP inexistentes.

**Cenário B — Empresa possui site + ERP integrado**

O dashboard institucional continua existindo.

Acrescentar:

- Pedidos.
- Faturamento.
- Indicadores comerciais.
- Estoque, quando disponível.
- Informações financeiras, respeitando permissões.
- Indicadores de integração.

**Cenário C — Empresa possui site + ERP + Portal B2B**

Acrescentar também:

- Pedidos B2B.
- Clientes ativos.
- Pedidos aguardando.
- Pedidos pagos.
- Histórico comercial.
- Indicadores de utilização do portal.

**Cenário D — Empresa possui site + Raizan Seller**

Acrescentar:

- Vendas por vendedor.
- Pedidos realizados.
- Clientes cadastrados.
- Metas.
- Comissões.
- Visitas comerciais.
- Indicadores de produtividade.

**Cenário E — Empresa possui site + Raizan Commerce**

Acrescentar:

- Visitas na loja.
- Produtos visualizados.
- Carrinhos.
- Conversões.
- Pedidos.
- Abandono de carrinho.
- Desempenho comercial.

**Cenário F — Empresa possui site + WooCommerce ou Shopify**

Consumir os indicadores disponíveis pelas integrações correspondentes.

Não presumir que todos os dados existem. Mostrar somente informações efetivamente sincronizadas.

## Regra de composição

O dashboard deverá ser construído a partir de:

- Papel do usuário.
- Permissões.
- Módulos contratados.
- Integrações ativas.
- Disponibilidade dos dados.
- Escopo de acesso do usuário.

Criar uma camada central que determine quais widgets poderão ser exibidos.

Não espalhar condicionais diferentes por toda a página `page.js`.

Exemplo conceitual:

```js
const dashboardContext = {
  tenantId,
  userRole,
  permissions,
  installedModules,
  integrations,
  availableDataSources
};
```

A estrutura deverá ser adaptada ao padrão real do projeto.

Criar um resolvedor central de dashboard, por exemplo:

`resolveDashboardLayout(context)`

Ele deverá retornar os widgets permitidos para o usuário.

### Importante sobre os níveis de usuário

Preservar a lógica atual.

Exemplos:

- Administrador: visão gerencial da empresa.
- Televendas: informações dos próprios resultados e dados autorizados.
- Separação: pedidos e informações da operação de separação.
- Financeiro: informações financeiras autorizadas.
- Outros perfis: somente os indicadores relacionados às suas permissões.

O site institucional deverá ser tratado como uma fonte de dados independente do ERP.

Uma pessoa que não possui permissão para visualizar dados financeiros não poderá receber esses dados simplesmente porque o dashboard foi composto com outros módulos.

A segurança deverá existir no backend, não apenas escondendo componentes no frontend.

---

# 3. NOVO MÓDULO — MEU SITE

Criar um novo módulo dentro do painel de integrações do Raizan Core.

Nome:

**Meu site**

Descrição:

"Conecte seu site institucional ao Raizan Core e acompanhe visitas, interações, formulários, oportunidades comerciais e desempenho digital em um único lugar."

Esse módulo deverá ser instalável e configurável por tenant.

### Interface do módulo

Criar uma tela premium seguindo a identidade visual atual do Raizan Core.

Exibir:

- Nome do site.
- Domínio principal.
- Status da conexão.
- Data da última comunicação.
- Status da coleta de eventos.
- Status da API.
- Identificador do site.
- Tenant vinculado.
- Chave de integração.
- Data de instalação.
- Último evento recebido.

### Ações

- Instalar integração.
- Gerar chave.
- Copiar instruções.
- Testar conexão.
- Rotacionar chave.
- Revogar chave.
- Editar domínio.
- Consultar documentação.
- Desconectar site.

A integração deverá ser independente de plataforma.

Deve permitir conectar:

- Sites em Next.js.
- Sites em React.
- WordPress.
- WooCommerce.
- Shopify.
- Raizan Commerce.
- Outros sistemas que consigam consumir a API.

Não criar uma integração exclusiva para os sites desenvolvidos pela Raizan Labs.

---

# 4. RAIZAN INSIGHT — MOTOR DE ANALYTICS

O Raizan Insight será o mecanismo responsável por receber, organizar e transformar os dados dos sites em inteligência comercial.

O site envia eventos para uma API de ingestão.

O Raizan Core consulta os dados por uma API autenticada de leitura.

Fluxo:

SITE → API DE INGESTÃO → RAIZAN INSIGHT → BANCO DE DADOS → API DE LEITURA → RAIZAN CORE.

Cada evento deverá estar associado a:

- `tenant_id`
- `site_id`
- `visitor_id`
- `session_id`
- `event_id`

O `tenant_id` não poderá ser aceito cegamente do navegador.

A associação entre site e tenant deverá ser validada no servidor através da configuração da integração.

## Eventos a capturar

Implementar inicialmente:

- `page_view`
- `session_start`
- `session_end`
- `cta_click`
- `whatsapp_click`
- `phone_click`
- `email_click`
- `form_view`
- `form_start`
- `form_submit`
- `form_error`
- `product_view`
- `file_download`
- `scroll_depth`
- `outbound_link_click`

Cada evento deverá possuir:

- Identificador.
- Tipo.
- Site.
- Tenant.
- Data e hora.
- Página de origem.
- URL.
- Origem de tráfego, quando disponível.
- Informações de campanha, quando disponíveis.
- Identificador de sessão.
- Metadados específicos em JSON.

Não coletar informações desnecessárias.

A geolocalização deverá ser aproximada, por região, utilizando mecanismos permitidos e disponíveis no servidor.

Não utilizar GPS para analytics.

Não armazenar IP completo desnecessariamente.

Respeitar LGPD, consentimento e política de privacidade.

---

# 5. FORMULÁRIOS — RECEBIMENTO UNIVERSAL E PADRONIZADO

Esta é uma das partes mais importantes do projeto.

Os sites podem possuir dezenas de formulários diferentes.

Um formulário de contato pode ter apenas nome, e-mail e mensagem.

Um pré-cadastro comercial pode solicitar:

- Razão social.
- Nome fantasia.
- CNPJ.
- Responsável.
- Telefone.
- WhatsApp.
- E-mail.
- Endereço.
- Cidade.
- Estado.
- Segmento.
- Produtos de interesse.
- Volume de compra.
- Observações.

Outro site pode possuir um formulário completamente diferente.

**Não criar uma coluna SQL para cada campo possível de cada formulário.**

Isso tornaria o banco de dados difícil de manter e praticamente impossível de escalar para os próximos 20 sites.

## Modelo de dados recomendado

Criar uma estrutura normalizada para formulários e uma estrutura flexível para os campos.

### Tabela `site_forms`

Representa os formulários cadastrados em cada site.

Campos conceituais:

- id
- tenant_id
- site_id
- form_key
- form_name
- form_type
- form_schema
- is_active
- created_at
- updated_at

`form_schema` poderá ser JSON, contendo a definição dos campos esperados.

### Tabela `site_form_submissions`

Representa cada envio.

Campos conceituais:

- id
- tenant_id
- site_id
- form_id
- submission_uuid
- form_name
- form_type
- visitor_id
- session_id
- page_url
- submitted_at
- status
- payload
- normalized_data
- metadata
- created_at
- updated_at

`payload` deverá armazenar o conjunto completo dos campos enviados em JSON ou JSONB, conforme o banco utilizado.

`normalized_data` poderá conter os campos comuns identificados pelo sistema.

Exemplo:

```json
{
  "name": "João da Silva",
  "email": "joao@empresa.com",
  "phone": "62999999999",
  "company": "Empresa Exemplo",
  "document": "00000000000000",
  "message": "Gostaria de receber uma proposta"
}
```

Esse é apenas um exemplo de dados recebidos. Não significa que todos os formulários terão esses campos.

### Regra de normalização

Quando o sistema identificar campos conhecidos, poderá mapear os valores para uma estrutura comum:

- Nome.
- E-mail.
- Telefone.
- Empresa.
- Documento.
- Mensagem.

Os demais campos permanecerão preservados no JSON.

Não descartar campos desconhecidos.

Não perder informações porque um formulário novo possui campos diferentes.

Não assumir que todo formulário possui CNPJ, telefone ou e-mail.

### Segurança dos formulários

- Validar payload.
- Limitar tamanho.
- Sanitizar dados.
- Evitar SQL injection.
- Evitar XSS.
- Implementar rate limiting.
- Utilizar proteção antispam.
- Gerar UUID único para cada envio.
- Registrar data e hora.
- Evitar submissões duplicadas.
- Controlar acesso por tenant.

Os dados pessoais deverão possuir controle de acesso apropriado e política de retenção.

---

# 6. NOVA PÁGINA — CENTRAL DE FORMULÁRIOS E LEADS

Criar uma página completa para receber e gerenciar todos os formulários enviados pelos sites.

Nome sugerido:

**Interações do site**

Essa página deverá ser uma das áreas mais bem acabadas do Raizan Core.

Quero uma experiência de CRM moderno, com apresentação visual premium, excelente organização e muitos detalhes úteis.

## Visão geral

Exibir cards com:

- Total de envios.
- Novos envios.
- Em atendimento.
- Em negociação.
- Convertidos.
- Arquivados.

Adicionar filtros:

- Período.
- Site.
- Domínio.
- Formulário.
- Tipo de formulário.
- Status.
- Origem.
- Responsável.

Permitir busca por:

- Nome.
- E-mail.
- Telefone.
- Empresa.
- Documento, quando disponível.

## Lista de interações

Criar uma listagem elegante, com:

- Nome do contato.
- Empresa.
- Tipo de formulário.
- Site de origem.
- Data e horário.
- Status.
- Responsável.
- Indicador de nova interação.

Não apresentar informações inexistentes.

Quando não houver nome, utilizar uma identificação adequada, como "Contato sem identificação".

## Detalhamento da interação

Ao clicar em um registro, abrir uma página ou drawer detalhado.

Exibir:

1. Identificação do contato.
2. Dados de contato.
3. Empresa.
4. Site de origem.
5. Formulário utilizado.
6. Data e hora.
7. Página de origem.
8. Origem de tráfego, quando disponível.
9. Histórico de navegação associado, quando permitido.
10. Todos os campos recebidos no formulário.
11. Status comercial.
12. Responsável pelo atendimento.
13. Histórico de alterações.
14. Observações internas.

### Campos dinâmicos

Os campos deverão ser renderizados automaticamente.

Exemplo:

Se um formulário enviar 8 campos, exibir os 8.

Se outro enviar 27 campos, exibir os 27.

O frontend não poderá depender de uma lista fixa de campos.

Utilizar o schema e o payload armazenados.

Campos com valores complexos deverão ser apresentados de forma legível.

### Ações

- Marcar como novo.
- Marcar como em atendimento.
- Marcar como negociação.
- Marcar como convertido.
- Arquivar.
- Atribuir responsável.
- Adicionar observação interna.
- Copiar e-mail.
- Copiar telefone.
- Abrir WhatsApp, quando houver telefone válido.
- Exportar informações, respeitando permissões.

Não permitir que um usuário visualize leads de outro tenant.

---

# 7. DASHBOARD ANALÍTICO DO SITE

Criar uma seção de analytics completa, com identidade visual do Raizan Core.

Nome:

**Analytics do site**

O dashboard deverá funcionar mesmo que a empresa não tenha ERP ou outras ferramentas conectadas.

### Indicadores principais

- Visitantes únicos.
- Visitas.
- Sessões.
- Novos visitantes.
- Visitantes recorrentes.
- Páginas visualizadas.
- Tempo médio de engajamento, somente se mensurável.
- Taxa de conversão, com definição clara.
- Formulários enviados.
- Cliques em WhatsApp.
- Cliques em telefone.
- Cliques em e-mail.

### Gráficos

Criar gráficos de:

- Visitas por dia.
- Visitantes por período.
- Evolução de formulários.
- Conversões.
- Páginas mais acessadas.
- Origem do tráfego.
- Regiões com maior volume de acessos.
- Interações por categoria.

### Períodos

Permitir:

- Hoje.
- Ontem.
- Últimos 7 dias.
- Últimos 30 dias.
- Últimos 90 dias.
- Período personalizado.

### Inteligência comercial

Criar uma seção que ajude a identificar o interesse dos visitantes.

Exemplo:

"Página de distribuição hospitalar recebeu 320 visualizações."

"Página de produtos veterinários recebeu 85 visualizações."

"Formulário de orçamento recebeu 18 envios."

Essas informações deverão ser geradas a partir dos dados reais.

Nunca inventar conclusões ou números.

### Atividades recentes

Exibir uma timeline com:

- Novo formulário recebido.
- Clique em WhatsApp.
- Acesso a página importante.
- Novo visitante.
- Conversão registrada.

Não apresentar informações pessoais de visitantes anônimos.

---

# 8. DASHBOARD BASE PARA EMPRESAS SEM ERP

Esta funcionalidade deverá ser prioridade.

Quando o tenant não possuir nenhuma integração comercial, o dashboard inicial do Raizan Core deverá apresentar automaticamente a visão institucional.

Exemplo de organização:

### Cabeçalho

- Bom dia / boa tarde.
- Nome da empresa.
- Período selecionado.
- Status do site.
- Última atualização.

### Indicadores

- Visitas.
- Visitantes únicos.
- Novos leads.
- Formulários recebidos.
- Cliques em WhatsApp.
- Conversões.

### Gráficos

- Evolução de visitas.
- Interações.
- Origem do tráfego.
- Páginas populares.

### Central de oportunidades

- Últimos formulários.
- Novos contatos.
- Leads aguardando atendimento.
- Interações recentes.

### Status do site

- Site publicado.
- Domínio.
- SSL/HTTPS, quando verificável.
- Hospedagem.
- Licença.
- Próximo vencimento.
- Dias restantes.

Caso não existam dados suficientes, apresentar estados vazios elegantes e instruções para ativar a coleta.

Não mostrar gráficos falsos ou dados de demonstração em produção.

---

# 9. GESTÃO DE LICENÇA, DOMÍNIO E HOSPEDAGEM

O Raizan Core deverá controlar a situação comercial e operacional dos sites contratados.

Cada site deverá possuir seu próprio cadastro de gestão.

Criar uma área:

**Gestão do site**

Informações:

- Nome do projeto.
- Tenant responsável.
- Domínio principal.
- Domínios adicionais.
- Data de publicação.
- Status do site.
- Plano contratado.
- Valor contratado.
- Data de vencimento da licença.
- Data de vencimento do domínio.
- Data de vencimento da hospedagem.
- Próximo pagamento.
- Situação financeira.
- Histórico de pagamentos.
- Histórico de alterações.

### Atenção: separar os vencimentos

Licença do serviço, domínio e hospedagem são itens diferentes.

Não assumir que o pagamento da hospedagem renova o domínio.

Não assumir que o pagamento da licença renova automaticamente serviços de terceiros.

Permitir controlar as três datas separadamente.

Quando não houver integração com o registrador ou provedor de hospedagem, os vencimentos deverão ser cadastrados ou atualizados manualmente.

Não inventar uma integração com registradores.

---

# 10. CONTROLE DE LICENÇA E CARÊNCIA DE 20 DIAS

Criar uma política configurável de cobrança e suspensão.

Exemplo:

- Data de vencimento: 10/12.
- Início da inadimplência: 11/12.
- Período de carência: 20 dias.
- Durante a carência: avisos de pagamento.
- Após o encerramento da carência: suspensão do site, caso a política contratual determine.

O prazo deverá ser calculado no servidor.

Criar estados claros:

- `active`
- `payment_pending`
- `overdue`
- `grace_period`
- `suspended`
- `cancelled`

O status deverá ser controlado pelo backend.

### Página de bloqueio

Após o encerramento da carência, o site deverá apresentar uma página de indisponibilidade administrativa.

Não utilizar mensagens ofensivas, constrangedoras ou que exponham a situação comercial do cliente.

A página deverá ser profissional e neutra.

Exemplo:

"Este site está temporariamente indisponível. Para mais informações, entre em contato com o responsável pela administração."

Não exibir dados financeiros, valores em atraso ou informações internas.

### Comunicação com o Raizan Core

Os sites deverão consultar periodicamente o estado de licenciamento.

Criar um mecanismo seguro de comunicação entre o site e o Core.

O Core deverá conseguir:

- Liberar o site.
- Suspender o site.
- Reativar o site.
- Consultar a licença.
- Atualizar datas.
- Registrar alterações.

A comunicação deverá ser autenticada.

Não utilizar uma URL pública sem autenticação para bloquear ou liberar sites.

### Segurança e disponibilidade

O site não deverá ser bloqueado por uma falha momentânea de conexão com o Raizan Core.

Utilizar estado de licença assinado, cache controlado e prazo de validade da autorização.

O site deverá conseguir validar uma autorização previamente recebida enquanto estiver temporariamente sem comunicação com o Core, respeitando o prazo de validade dessa autorização e a política de suspensão.

Registrar todos os eventos de bloqueio e liberação.

### Exclusão de sites

Não excluir sites automaticamente após 20 dias de suspensão.

A suspensão é diferente da exclusão.

Criar um processo separado de cancelamento e exclusão, com:

- Aprovação administrativa.
- Verificação contratual.
- Backup.
- Retenção de dados.
- Registro da operação.

Nenhum site deverá ser apagado silenciosamente por uma rotina automática de cobrança.

---

# 11. PAGAMENTO PELO MERCADO PAGO

O cliente deverá conseguir consultar e quitar suas pendências diretamente no painel do site dentro do Raizan Core.

Criar uma seção:

**Financeiro do meu site**

Exibir:

- Plano atual.
- Valor.
- Próximo vencimento.
- Status da licença.
- Histórico de cobranças.
- Pagamentos realizados.
- Pagamentos pendentes.
- Botão pagar agora.

### Integração Mercado Pago

Utilizar integração oficial do Mercado Pago.

A arquitetura deverá contemplar:

- Criação de cobrança.
- Checkout.
- Retorno do pagamento.
- Webhooks.
- Consulta de status.
- Histórico.
- Reprocessamento seguro.

Não considerar um pagamento aprovado apenas porque o navegador retornou à página de sucesso.

A confirmação deverá ocorrer por webhook autenticado e/ou consulta server-side à API do Mercado Pago.

Implementar idempotência para evitar duplicação de pagamentos.

A atualização da licença deverá ocorrer somente após confirmação válida.

As credenciais deverão ficar em variáveis de ambiente ou armazenamento seguro de credenciais.

Nunca expor Access Token no frontend.

### Importante

Preparar a estrutura para pagamentos avulsos e planos recorrentes, mas não presumir que toda modalidade estará disponível na conta Mercado Pago utilizada.

Documentar o fluxo de configuração.

---

# 12. INTEGRAÇÃO DOS SITES DA RAIZAN LABS

Os sites que já estão sendo reformulados deverão ser os primeiros a utilizar o Raizan Insight e a gestão centralizada de licenças.

Projetos iniciais:

1. Hosplab — https://hosplabto.com.br/
2. AG Martins — https://agmartins.co.uk/
3. Digital Sistemas — https://digitalsistemas.com.br/

Cada site deverá ter:

- `site_id` exclusivo.
- `tenant_id` correspondente.
- Domínio cadastrado.
- Chave de ingestão.
- Chave privada de leitura, quando necessária.
- Configuração de analytics.
- Configuração de formulários.
- Configuração de licenciamento.
- Status de conexão.

Não associar todos os sites ao mesmo tenant automaticamente.

O relacionamento deverá ser definido no cadastro de cada cliente.

Os três sites deverão funcionar como primeiros projetos de validação da arquitetura.

### Requisitos para os projetos Next.js

Criar um pequeno módulo reutilizável de integração.

Sugestão de organização:

`lib/raizan-insight/`

Com recursos para:

- Inicializar coleta.
- Registrar eventos.
- Registrar page views.
- Enviar formulários.
- Consultar status de licença.
- Tratar indisponibilidade de comunicação.

O módulo deverá ser reutilizável nos projetos Hosplab, AG Martins e Digital Sistemas.

Não copiar e colar implementações diferentes para cada site.

A arquitetura deverá permitir integrar futuros sites com pouco esforço.

### Comunicação de bloqueio

Cada site deverá consultar o estado de licença e apresentar a página administrativa de suspensão quando autorizado pelo Core.

O mecanismo deverá funcionar sem depender de uma ação manual no código-fonte de cada site.

A lógica de bloqueio deverá ser centralizada e documentada.

---

# 13. NOTIFICAÇÕES DE NOVAS INTERAÇÕES NO ELECTRON

Atualmente, o Raizan Core já possui um aviso de novos pedidos na header.

Quero ampliar esse mecanismo.

Quando um site receber uma nova interação, o Electron deverá conseguir avisar o usuário.

Exemplos:

- Novo formulário recebido.
- Novo lead.
- Nova solicitação de orçamento.
- Novo pré-cadastro.
- Nova interação comercial.

### Header

Adicionar indicador de novas interações.

Exemplo:

- Ícone de mensagem.
- Contador de não lidas.
- Lista das interações recentes.
- Data e horário.
- Site de origem.
- Nome do contato, quando disponível.

Ao clicar, abrir diretamente a interação no Raizan Core.

### Notificações do Electron

Utilizar o mecanismo nativo de notificações do Electron.

A notificação deverá conter:

- Nome do site.
- Tipo de interação.
- Nome do contato, quando disponível.
- Horário.
- Ação para abrir o registro.

### Controle de notificações

Permitir:

- Marcar como lida.
- Marcar todas como lidas.
- Desativar notificações de determinado site.
- Controlar tipos de notificação.
- Consultar histórico.

### Backend

Criar um mecanismo confiável para disponibilizar novos eventos.

Avaliar a arquitetura atual e escolher a solução mais compatível:

- WebSocket.
- Server-Sent Events.
- Polling otimizado.

Não implementar três tecnologias simultaneamente.

Se o usuário estiver offline, as notificações deverão permanecer disponíveis para consulta posterior.

Implementar controle de leitura e deduplicação.

Não enviar a mesma notificação repetidamente.

---

# 14. ELECTRON — EXECUÇÃO EM SEGUNDO PLANO E INICIALIZAÇÃO COM WINDOWS

Quero que o Raizan Core tenha um comportamento semelhante ao Discord.

O usuário poderá fechar a janela e o aplicativo continuará ativo na bandeja do Windows, próximo ao relógio.

### Funcionalidades

- Ícone do Raizan Core na bandeja.
- Opção de minimizar para a bandeja.
- Opção de fechar janela mantendo o aplicativo ativo.
- Menu contextual.
- Abrir Raizan Core.
- Mostrar notificações.
- Verificar atualizações, se a infraestrutura atual permitir.
- Sair completamente.

### Menu da bandeja

Criar opções:

- Abrir Raizan Core.
- Notificações.
- Configurações.
- Iniciar com Windows.
- Sair.

### Inicialização automática

Implementar opção para iniciar o Raizan Core junto com o Windows.

Utilizar os mecanismos oficiais do Electron, como `app.setLoginItemSettings()` quando compatível com a versão e o empacotamento utilizados.

O usuário deverá poder ativar e desativar essa funcionalidade.

Não presumir que minimizar e fechar são a mesma coisa.

O comportamento deverá ser intuitivo:

- Minimizar: enviar para a bandeja.
- Fechar janela: enviar para a bandeja, se essa preferência estiver ativada.
- Sair: encerrar completamente o aplicativo.

### Requisitos técnicos

- Criar Tray.
- Criar menu contextual.
- Garantir apenas uma instância.
- Tratar eventos de fechamento.
- Restaurar janela ao clicar no ícone.
- Respeitar encerramento completo.
- Evitar processos órfãos.
- Manter notificações funcionando em segundo plano.
- Persistir preferências do usuário.

Não quebrar o fluxo atual de autenticação, atualização ou build do Electron.

Antes de alterar o processo principal, examine a estrutura atual do Electron e implemente de acordo com ela.

---

# 15. ARQUITETURA DE BANCO DE DADOS

Antes de criar tabelas, examine o banco atual.

Reaproveite tabelas existentes quando apropriado.

Não duplicar cadastros de tenant, usuários, integrações ou pagamentos.

As tabelas conceituais necessárias poderão incluir:

- `tenant_sites`
- `site_integrations`
- `site_api_keys`
- `site_events`
- `site_forms`
- `site_form_submissions`
- `site_leads`
- `site_notifications`
- `site_licenses`
- `site_billing`
- `site_payments`
- `site_license_logs`

Esses nomes são sugestões. Adapte aos padrões reais do banco.

### Regras fundamentais

Toda informação vinculada a um cliente deverá possuir isolamento multitenant.

Sempre que aplicável, utilizar:

- `tenant_id`
- `site_id`
- `created_at`
- `updated_at`

Criar índices adequados.

Considerar índices compostos por tenant, site e data para consultas analíticas.

Utilizar JSON/JSONB para dados flexíveis.

Criar migrations versionadas.

Não executar alterações destrutivas sem backup e plano de migração.

Não criar tabelas com campos duplicados desnecessariamente.

---

# 16. API — CONTRATO DE INTEGRAÇÃO

A API deverá ser versionada.

Sugestão:

`/api/v1/site/`

### Ingestão pública controlada

- `POST /api/v1/site/events`
- `POST /api/v1/site/forms/submit`
- `POST /api/v1/site/heartbeat`

Esses endpoints deverão utilizar identificadores públicos específicos do site, validação, rate limiting e regras de origem.

Não colocar chave privada de leitura no navegador.

A ingestão pública não deverá ter permissão para consultar dados de outros sites.

### API privada de leitura

- `GET /api/v1/site/analytics/overview`
- `GET /api/v1/site/analytics/realtime`
- `GET /api/v1/site/analytics/pages`
- `GET /api/v1/site/analytics/geography`
- `GET /api/v1/site/analytics/sources`
- `GET /api/v1/site/analytics/conversions`
- `GET /api/v1/site/interactions`
- `GET /api/v1/site/interactions/:id`
- `GET /api/v1/site/license/status`

As rotas deverão exigir autenticação apropriada.

A chave de leitura deverá ter escopos.

Exemplos:

- `analytics:read`
- `interactions:read`
- `leads:read`
- `license:read`

A leitura de leads e dados pessoais deverá possuir autorização separada de analytics agregado.

### Segurança de chaves

- Gerar chaves criptograficamente seguras.
- Exibir a chave privada apenas uma vez.
- Armazenar hash quando aplicável.
- Permitir revogação.
- Permitir rotação.
- Registrar utilização.
- Aplicar rate limiting.
- Validar escopo.
- Associar chave ao site e tenant no servidor.

Nunca confiar em parâmetros enviados pelo navegador para definir o tenant de uma consulta.

---

# 17. VARIÁVEIS DE AMBIENTE

Criar ou atualizar `.env.example`.

Separar as variáveis por finalidade:

### Banco e aplicação

- Conexão com banco de dados.
- URL da aplicação.
- Configurações de ambiente.

### Raizan Insight

- Ativação do serviço.
- Configurações de ingestão.
- Configurações de retenção.
- Geolocalização aproximada.
- Segredo de bootstrap, se realmente necessário.

### Mercado Pago

- Access Token.
- Public Key, somente quando necessária no frontend.
- Webhook secret.
- URL de retorno.

### SMTP

- Host.
- Porta.
- Usuário.
- Senha.
- Remetente.
- Destinatário.

### Electron

Verificar se existem variáveis ou configurações específicas para o processo desktop.

Não inventar valores.

Não colocar chaves de integração privadas em variáveis públicas `NEXT_PUBLIC_`.

Chaves individuais por tenant/site deverão ser gerenciadas no banco com proteção adequada, e não simplesmente armazenadas em texto aberto no `.env`.

Ao concluir, entregar uma lista explicando cada variável e como configurá-la.

---

# 18. DESIGN E EXPERIÊNCIA VISUAL

Todas as novas páginas deverão seguir a identidade atual do Raizan Core.

Não criar um produto visualmente desconectado.

Quero:

- Interface premium.
- Design limpo.
- Dark/glass quando coerente com o padrão atual.
- Cards bem trabalhados.
- Tipografia consistente.
- Lucide React.
- Framer Motion, quando apropriado.
- Gráficos legíveis.
- Tabelas organizadas.
- Filtros elegantes.
- Drawer de detalhes.
- Estados vazios bem desenhados.
- Loading states.
- Feedback de sucesso e erro.
- Responsividade.

As telas de Analytics e Interações deverão ter acabamento de produto SaaS profissional.

Não exagerar em animações.

Não utilizar dados fictícios em produção.

Preservar os componentes e o design system já existentes.

---

# 19. ESTRUTURA DE IMPLEMENTAÇÃO DA PAGE.JS

A página atual do dashboard é uma área crítica.

Não quero que você simplesmente substitua a `page.js` por outra versão.

Faça uma refatoração organizada.

A página deverá funcionar como orquestradora do dashboard.

Separar a lógica de:

1. Identificação do usuário.
2. Identificação do tenant.
3. Identificação do papel.
4. Busca de permissões.
5. Busca de módulos contratados.
6. Busca de integrações.
7. Resolução do layout.
8. Busca dos indicadores.
9. Renderização dos widgets.

Sugestão conceitual:

```text
DashboardPage
  ├── DashboardHeader
  ├── DashboardContextProvider
  ├── DashboardLayoutResolver
  ├── InstitutionalDashboard
  │     ├── WebsiteOverview
  │     ├── WebsiteTrafficChart
  │     ├── WebsiteInteractions
  │     ├── WebsiteTopPages
  │     └── WebsiteStatus
  ├── ERPWidgets
  ├── B2BWidgets
  ├── SellerWidgets
  ├── CommerceWidgets
  └── OperationalWidgets
```

Essa é uma referência arquitetural. Adaptar à estrutura existente.

### Regra importante

Se a empresa possuir somente o módulo Meu site, renderizar o dashboard institucional.

Se possuir ERP, adicionar os widgets permitidos.

Se possuir ERP e Seller, adicionar os widgets permitidos.

Se possuir WooCommerce ou Shopify, adicionar os widgets de e-commerce disponíveis.

Se possuir todos os módulos, compor o dashboard sem duplicar informações.

A página deverá continuar respeitando os três modelos existentes e seus respectivos níveis de usuário.

Não criar um quarto modelo fixo.

Criar uma arquitetura de widgets e capacidades.

### Performance

Evitar carregar todos os dados de todos os módulos quando o usuário não possui acesso a eles.

Consultar somente as fontes necessárias para aquele dashboard.

Utilizar carregamento independente de widgets quando apropriado.

Um erro na consulta de analytics não poderá derrubar o dashboard inteiro.

Um ERP indisponível não deverá impedir a exibição dos dados do site.

---

# 20. DOCUMENTAÇÃO TÉCNICA OBRIGATÓRIA

Criar:

`docs/RAIZAN-INSIGHT.md`

Documentar:

- Arquitetura.
- Fluxo de dados.
- Eventos.
- Formulários.
- Estrutura de banco.
- Endpoints.
- Autenticação.
- Segurança.
- Isolamento multitenant.
- Permissões.
- Integração com sites.
- Gestão de licenças.
- Mercado Pago.
- Notificações.
- Electron.
- Configuração de variáveis de ambiente.

Criar também:

`docs/RAIZAN-SITE-INTEGRATION.md`

Documentar como integrar qualquer site ao Raizan Core.

O objetivo é que os próximos projetos da Raizan Labs possam utilizar um padrão único de integração.

---

# 21. TESTES E CRITÉRIOS DE ACEITAÇÃO

Testar os seguintes cenários.

### Cenário 1

Tenant possui somente site institucional.

Resultado esperado:

- Dashboard institucional.
- Analytics.
- Formulários.
- Leads.
- Interações.
- Licença e domínio.

Nenhum dado de ERP deve aparecer.

### Cenário 2

Tenant possui ERP.

Resultado esperado:

- Dashboard institucional.
- Widgets de ERP.
- Respeito às permissões.

### Cenário 3

Administrador e televendas do mesmo tenant.

Resultado esperado:

- Administrador visualiza dados gerenciais autorizados.
- Televendas visualiza somente seus dados e informações permitidas.

### Cenário 4

Tenant com vários sites.

Resultado esperado:

- Analytics separado por site.
- Possibilidade de visão consolidada quando autorizada.
- Nenhum cruzamento entre tenants.

### Cenário 5

Formulários diferentes.

Resultado esperado:

- Receber formulários com diferentes quantidades de campos.
- Preservar todos os campos.
- Renderizar detalhes dinamicamente.
- Não exigir alteração de banco para cada novo campo.

### Cenário 6

Nova interação.

Resultado esperado:

- Registro no banco.
- Notificação no Core.
- Contador atualizado.
- Notificação no Electron.
- Controle de leitura.

### Cenário 7

Licença vencida.

Resultado esperado:

- Estado atualizado pelo servidor.
- Avisos de cobrança.
- Contagem de carência de 20 dias.
- Suspensão somente após o prazo.
- Página neutra de indisponibilidade.

### Cenário 8

Pagamento aprovado.

Resultado esperado:

- Webhook validado.
- Registro financeiro.
- Atualização da licença.
- Reativação do site.

### Cenário 9

Electron fechado na janela.

Resultado esperado:

- Continua na bandeja, se configurado.
- Notificações continuam funcionando.
- Usuário consegue reabrir.
- Opção Sair encerra completamente.

### Cenário 10

Inicialização do Windows.

Resultado esperado:

- Aplicativo inicia quando a opção estiver habilitada.
- Preferência pode ser desativada.
- Não abrir múltiplas instâncias.

---

# 22. ORDEM DE EXECUÇÃO

Não tente desenvolver tudo de uma vez sem validar as dependências.

Execute por etapas:

**FASE 1 — Auditoria**

Mapear dashboards, banco, permissões, integrações e Electron.

**FASE 2 — Arquitetura**

Criar modelo de dados, migrations, APIs e resolução de capacidades.

**FASE 3 — Meu site**

Criar módulo instalável e gerenciamento de integração.

**FASE 4 — Raizan Insight**

Implementar ingestão de eventos e analytics.

**FASE 5 — Formulários e leads**

Criar armazenamento flexível e central de interações.

**FASE 6 — Dashboard inteligente**

Adaptar a `page.js` para o dashboard-base e composição de widgets.

**FASE 7 — Licenças e financeiro**

Implementar vencimentos, carência, Mercado Pago e suspensão.

**FASE 8 — Electron**

Implementar notificações de interações, bandeja e inicialização com Windows.

**FASE 9 — Integração dos três primeiros sites**

Hosplab, AG Martins e Digital Sistemas.

**FASE 10 — Testes e documentação**

Validar todos os cenários e entregar a documentação.

Não deixe funcionalidades pela metade sem documentar o estado.

Não simule integrações financeiras ou de licença em produção.

---

# DIRETRIZ FINAL

O Raizan Core está deixando de ser apenas um painel de gestão comercial.

Ele deverá se tornar o centro de inteligência e operação digital das empresas.

Uma empresa poderá começar contratando somente um site institucional.

Depois poderá contratar e conectar:

- ERP.
- Portal B2B.
- Raizan Seller.
- Raizan Commerce.
- WooCommerce.
- Shopify.
- Outros canais e integrações.

O dashboard deverá evoluir junto com o negócio, sem exigir a reconstrução da experiência a cada nova contratação.

**O site é a primeira porta de entrada. O Raizan Insight transforma o tráfego em informação. O Raizan Core transforma informação em gestão.**

Preserve o que já funciona, evolua a arquitetura e implemente com segurança.

Não faça alterações destrutivas.

Não invente dados.

Não quebre os três dashboards existentes.

E, principalmente, não trate o tenant como uma informação visual: o isolamento multitenant precisa ser garantido em todas as consultas e operações do backend.

Esse projeto deverá servir como base para todos os próximos clientes e sites da Raizan Labs.