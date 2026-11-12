# Raizan Insight / Meu site: estado e contrato

As instruções originais do dono estão em [website-instrucoes.md](website-instrucoes.md).

## Estado atual (fase 1, só no Core)

| Parte | Situação |
|---|---|
| Tela `/website` (Meu site): Visão geral, Interações, Analytics e Gestão do site | Pronta no Core |
| Peça central de permissões (`src/components/website/capacidades.js`) | Pronta |
| Cliente da API (`src/components/website/dados.js`) | Pronto. As rotas ainda não existem na API |
| Tabelas, chaves, ingestão, script do site | Fase 2 (API) |
| Bloco do site no dashboard `/resumo` | Fase 4. Os três modelos atuais não foram tocados |
| Licença com carência, Mercado Pago, página de suspensão | Fase 5 |
| Electron: bandeja, iniciar com Windows, avisos de interação | Fase 6 |

Sem as rotas da API, a tela mostra "Módulo em ativação". Ela nunca mostra números inventados.

### Dados simulados (só para desenvolvimento)
No navegador do `next dev`, rode no console:

`localStorage.setItem("@raizan:website-simulado", "1")`

Para desligar, use `removeItem`. No build de produção, `process.env.NODE_ENV === "production"` desliga essa condição, e o arquivo `simulado.js` nem entra no pacote.

## Como a tela aparece para o cliente
1. **Cadastrar o módulo:** no painel administrativo, cadastre o módulo com o slug `website` (nome sugerido: "Meu site") e libere na licença da empresa. O Sidebar monta o menu sozinho, sem mudar código.
2. **Publicar uma nova versão do Core:** o Electron carrega o build local (`out/`).

## Permissões (a API precisa conhecer estas chaves na fase 2)
| Chave | Libera |
|---|---|
| `website` | Visão geral e analytics agregados, sem dados pessoais |
| `website/interacoes` | Formulários e leads, com dados pessoais |
| `website/gestao` | Licença, domínio, hospedagem e financeiro do site |
| `cadastros/integracoes` (já existe) | Instalar a integração quando não há site |

Quem usa sessão por licença ou tem `*` vê tudo, igual ao resto do Core. A API precisa repetir a regra (`guardaUsuarioCore.ROTAS_COM_PERMISSAO`).

## Contrato da API de leitura (Core → API)
Base: `https://api.raizan.com.br/api/hub/site`, com o token do Core.

**O tenant sai SEMPRE do token.** O `x-tenant-id` e o `tenant_id` da URL não podem definir a consulta.

Se a rota não existir (404), a tela entende que o módulo não está ativo. Um 403 vira "Acesso restrito".

| Método e rota | Resposta (`success: true` + …) |
|---|---|
| `GET /sites` | `sites: [{ id, nome, dominio, dominios_adicionais[], plataforma, status_conexao: conectado\|aguardando\|sem_comunicacao\|desconectado, coleta_ativa, api_ok, ultima_comunicacao, ultimo_evento, instalado_em, tem_chave, chave_prefixo }]` |
| `POST /sites` `{ nome, dominio }` | cria o site da empresa do token |
| `PUT /sites/:id` `{ dominio }` | edita o domínio |
| `POST /sites/:id/chave` | `{ chave }`: gera ou rotaciona. A chave aparece só uma vez. Guardar só o hash e o prefixo |
| `DELETE /sites/:id/chave` | revoga |
| `POST /sites/:id/testar` | `{ recebido_em }`: último sinal do site |
| `DELETE /sites/:id` | desconecta (para a coleta e revoga a chave). **Não apaga dados** |
| `GET /analytics?site_id&de&ate` | `resumo{visitantes, visitas, sessoes, novos_visitantes, recorrentes, paginas_vistas, engajamento_medio_seg\|null, formularios, whatsapp, telefone, email, conversao_pct, conversao_definicao}`, `por_dia[{data, visitas, visitantes, formularios, conversoes}]`, `paginas[{caminho, titulo, visualizacoes}]`, `origens[{origem, sessoes}]`, `regioes[{regiao, uf, visitas}]`, `categorias[{tipo, rotulo, total}]`, `formularios[{formulario, visualizacoes, inicios, envios}]`, `atividades[{tipo, quando, descricao, interacao_id?}]`. Sem visitas: `resumo: null` |
| `GET /interacoes?site_id&status&tipo&origem&responsavel&busca&de&ate` | `resumo{total, novo, atendimento, negociacao, convertido, arquivado}`, `itens[{id, nome, empresa, email, telefone, documento, formulario, tipo, site_id, site_nome, dominio, recebido_em, status, responsavel{id,nome}\|null, nova, origem}]`, `responsaveis[{id,nome}]`, `formularios[{tipo, formulario}]` |
| `GET /interacoes/:id` | `interacao{…item, pagina_url, campanha{}, campos[{chave, rotulo, valor}]` **ou** `payload{}`, `navegacao[{pagina, quando}], historico[{quando, quem, acao}], observacoes[{quando, quem, texto}]}` |
| `PATCH /interacoes/:id` `{ status? , responsavel_id? }` | `interacao` atualizada. Registra no histórico |
| `POST /interacoes/:id/observacoes` `{ texto }` | `interacao` atualizada |
| `GET /gestao?site_id` | `gestao{projeto, dominio, dominios_adicionais[], publicado_em, status_site, https\|null, hospedagem, plano, valor, ciclo, status_licenca: active\|payment_pending\|overdue\|grace_period\|suspended\|cancelled, licenca_vence, dominio_vence, hospedagem_vence, proximo_pagamento, situacao_financeira, carencia_dias, link_pagamento?, pagamentos[], alteracoes[]}` ou `gestao: null` |

O valor de um campo do formulário pode ser texto, número, sim/não, lista ou objeto. A tela mostra cada caso de forma legível e não depende de uma lista fixa de campos.

## Próximas fases (resumo)
- **Fase 2 (API):**
  - tabelas `site_*` com `tenant_id` e `site_id` e índices `(tenant_id, site_id, criado_em)`;
  - `payload` e `normalized_data` em JSON;
  - ingestão pública `POST /api/v1/site/events|forms/submit|heartbeat`, com chave pública, domínio de origem, limite de requisições, tamanho máximo e UUID por envio;
  - IP só truncado, região aproximada.
- **Fase 3:**
  - interações no `/api/admin/notificacoes`, porque o sino do Core já mostra o que essa rota devolve;
  - script `raizan-insight.js` reutilizável.
- **Fase 4:** bloco do site no `/resumo`, por cima dos três modelos atuais e pela mesma peça central.
- **Fase 5:**
  - licença com carência de 20 dias;
  - Mercado Pago confirmado por webhook e consulta no servidor;
  - estado de licença assinado com prazo de validade;
  - página neutra de suspensão;
  - suspensão nunca apaga dados.
- **Fase 6:**
  - Tray;
  - fechar a janela manda para a bandeja quando a preferência estiver ligada;
  - `setLoginItemSettings`;
  - `requestSingleInstanceLock`.
