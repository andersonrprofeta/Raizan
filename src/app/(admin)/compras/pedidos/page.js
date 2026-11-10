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


"use client";

// Painel de entradas de mercadorias. O Raizan Core é a fonte da verdade das compras:
// o Omie (e no futuro Tiny, planilhas, APIs) só entrega os pedidos pelo botão Importar.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import {
  AlertTriangle, CalendarClock, ChevronRight, ClipboardCheck, DownloadCloud, Inbox, PackageSearch, Printer, RotateCcw, Search, SlidersHorizontal, Truck, X,
} from "lucide-react";
import { api, BOTAO_PRIMARIO, BOTAO_SECUNDARIO, CAMPO, Carregando, CascaPagina, EstadoVazio, Kpi, Modal, ROTULO, Segmentado, VIDRO, moeda, moedaCurta, BarraProgresso } from "@/components/vendedores/ui";
import { ChipStatus, LinhaDoTempo, ORIGEM, diaCurto, diaEHora, diasDeAtraso, quantidade } from "@/components/compras/ui";
import { montarMapaDeConferencia } from "@/components/compras/MapaEntradas";
import { abrirDocumento } from "@/components/utils/documentoPdf";

const ABAS = [
  { id: "", rotulo: "Todas" },
  { id: "recebido", rotulo: "Para conferir" },
  { id: "parcial", rotulo: "Em parte" },
  { id: "aguardando", rotulo: "Aguardando" },
  { id: "divergencia", rotulo: "Divergência" },
  { id: "conferido", rotulo: "Conferidas" },
  { id: "cancelado", rotulo: "Canceladas" },
];
const FILTROS_VAZIOS = { fornecedor: "", origem: "", cd: "", de: "", ate: "" };

function imprimirMapa(compra, itens) {
  if (!abrirDocumento(montarMapaDeConferencia({ compra, itens }))) toast.error("Libere as janelas do navegador para imprimir o mapa.");
}

function LinhaDaCompra({ compra, onAbrir }) {
  const atraso = diasDeAtraso(compra);
  const pedida = Number(compra.quantidade_pedida) || 0;
  const recebida = Math.min(Number(compra.quantidade_recebida) || 0, pedida);
  const percentual = pedida > 0 ? (recebida / pedida) * 100 : 0;

  return (
    <button
      type="button"
      onClick={() => onAbrir(compra)}
      className="group w-full text-left grid grid-cols-[1fr_auto] md:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_150px_auto] items-center gap-x-6 gap-y-3 px-5 sm:px-6 py-4 hover:bg-black/[0.02] dark:hover:bg-white/[0.03] transition-colors"
    >
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-semibold tracking-tight text-zinc-900 dark:text-white">Pedido {compra.pedido_compra}</span>
          <span className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">{ORIGEM[compra.origem_integracao] || compra.origem_integracao}</span>
        </div>
        <p className="text-sm text-zinc-500 truncate mt-0.5">{compra.fornecedor_nome || "Fornecedor não informado"}</p>
      </div>

      <div className="hidden md:block min-w-0">
        <p className={`text-sm font-medium flex items-center gap-1.5 ${atraso ? "text-rose-600 dark:text-rose-400" : "text-zinc-700 dark:text-zinc-300"}`}>
          <CalendarClock size={14} className="shrink-0" />
          {compra.data_prevista ? diaCurto(compra.data_prevista) : "Sem previsão"}
        </p>
        <p className="text-xs text-zinc-500 mt-0.5">
          {atraso ? `${atraso} ${atraso === 1 ? "dia" : "dias"} de atraso` : `${compra.total_itens} ${compra.total_itens === 1 ? "item" : "itens"} · ${moedaCurta(compra.valor_total)}`}
        </p>
      </div>

      <div className="hidden md:block">
        <BarraProgresso percentual={percentual} />
        <p className="text-[11px] text-zinc-500 mt-1.5 tabular-nums">{quantidade(recebida)} de {quantidade(pedida)} recebidas</p>
      </div>

      <div className="flex items-center gap-2 justify-end">
        <ChipStatus status={compra.status_recebimento} />
        <ChevronRight size={18} className="text-zinc-300 group-hover:text-purple-500 group-hover:translate-x-0.5 transition-all" />
      </div>
    </button>
  );
}

function DetalheDaCompra({ id, onFechar, onMudou }) {
  const [dados, setDados] = useState(null);
  const [observacoes, setObservacoes] = useState("");
  const [salvando, setSalvando] = useState(false);

  const aplicar = useCallback((resposta) => {
    if (!resposta.success) { toast.error(resposta.message || "Não foi possível abrir a compra."); onFechar(); return; }
    setDados(resposta);
    setObservacoes(resposta.compra.observacoes || "");
  }, [onFechar]);
  const carregar = useCallback(() => api(`/compras/${id}`).then(aplicar).catch(() => toast.error("Sem conexão com o servidor.")), [id, aplicar]);

  useEffect(() => {
    let vivo = true;
    api(`/compras/${id}`).then((resposta) => { if (vivo) aplicar(resposta); }).catch(() => toast.error("Sem conexão com o servidor."));
    return () => { vivo = false; };
  }, [id, aplicar]);

  const salvarObservacao = async () => {
    setSalvando(true);
    const resposta = await api(`/compras/${id}/observacoes`, { metodo: "PUT", corpo: { observacoes } });
    setSalvando(false);
    if (resposta.success) toast.success("Observação salva.");
    else toast.error(resposta.message || "Não foi possível salvar.");
  };

  const reabrir = async () => {
    if (!window.confirm("Reabrir a conferência? A próxima contagem começa do zero. O histórico fica guardado.")) return;
    const resposta = await api(`/compras/${id}/conferencia/reabrir`, { metodo: "POST" });
    if (!resposta.success) { toast.error(resposta.message || "Não foi possível reabrir."); return; }
    toast.success(resposta.message);
    carregar();
    onMudou();
  };

  const compra = dados?.compra;
  const podeConferir = compra && !["conferido", "cancelado"].includes(compra.status_recebimento);

  return (
    <Modal
      titulo={compra ? `Pedido ${compra.pedido_compra}` : "Carregando..."}
      descricao={compra ? `${compra.fornecedor_nome || "Fornecedor não informado"} · ${ORIGEM[compra.origem_integracao] || compra.origem_integracao}` : ""}
      onFechar={onFechar}
      largura="max-w-4xl"
      rodape={compra && (
        <>
          <button type="button" className={BOTAO_SECUNDARIO} onClick={() => imprimirMapa(compra, dados.itens)}><Printer size={16} />Mapa cego</button>
          {compra.quantidade_conferida !== null && compra.status_recebimento !== "cancelado" && (
            <button type="button" className={BOTAO_SECUNDARIO} onClick={reabrir}><RotateCcw size={16} />Reabrir conferência</button>
          )}
          <span className="flex-1" />
          {podeConferir && (
            <Link href={`/compras/conferencia/?id=${compra.id}`} className={BOTAO_PRIMARIO}><ClipboardCheck size={16} />Conferir agora</Link>
          )}
        </>
      )}
    >
      {!dados ? <Carregando /> : (
        <div className="grid lg:grid-cols-[240px_1fr] gap-8 pb-4">
          <div className="space-y-5">
            <div className="flex items-center gap-2"><ChipStatus status={compra.status_recebimento} /></div>
            <LinhaDoTempo eventos={dados.linha_do_tempo} />
            <dl className="grid grid-cols-2 lg:grid-cols-1 gap-3 text-sm">
              <div><dt className="text-xs text-zinc-500">Emissão</dt><dd className="font-medium">{diaCurto(compra.data_emissao) || "—"}</dd></div>
              <div><dt className="text-xs text-zinc-500">Previsão</dt><dd className="font-medium">{diaCurto(compra.data_prevista) || "—"}</dd></div>
              <div><dt className="text-xs text-zinc-500">Valor</dt><dd className="font-medium">{moeda(compra.valor_total)}</dd></div>
              <div><dt className="text-xs text-zinc-500">Centro de distribuição</dt><dd className="font-medium">{compra.centro_distribuicao || "Principal"}</dd></div>
            </dl>
          </div>

          <div className="min-w-0 space-y-6">
            <div className="rounded-2xl border border-black/[0.06] dark:border-white/[0.07] overflow-hidden">
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-[11px] uppercase tracking-wide text-zinc-500 bg-black/[0.02] dark:bg-white/[0.03]">
                      <th className="text-left font-semibold px-4 py-2.5">Produto</th>
                      <th className="text-right font-semibold px-3 py-2.5">Pedido</th>
                      <th className="text-right font-semibold px-3 py-2.5">ERP recebeu</th>
                      <th className="text-right font-semibold px-4 py-2.5">Conferido</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/[0.05] dark:divide-white/[0.05]">
                    {dados.itens.map((item) => {
                      const conferido = item.quantidade_conferida;
                      const bate = conferido !== null && conferido === item.quantidade_pedida;
                      return (
                        <tr key={item.id}>
                          <td className="px-4 py-3 min-w-[220px]">
                            <p className="font-medium text-zinc-900 dark:text-white">{item.descricao}</p>
                            <p className="text-[11px] font-mono text-zinc-500 mt-0.5">{[item.sku, item.ean].filter(Boolean).join(" · ")}</p>
                          </td>
                          <td className="px-3 py-3 text-right tabular-nums">{quantidade(item.quantidade_pedida)}</td>
                          <td className="px-3 py-3 text-right tabular-nums text-zinc-500">{quantidade(item.quantidade_recebida)}</td>
                          <td className={`px-4 py-3 text-right tabular-nums font-semibold ${conferido === null ? "text-zinc-400" : bate ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                            {quantidade(conferido)}
                            {conferido !== null && !bate && <span className="block text-[11px] font-medium">{conferido > item.quantidade_pedida ? "+" : ""}{quantidade(conferido - item.quantidade_pedida)}</span>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {dados.conferencias.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold mb-2">Conferências</h3>
                <ul className="space-y-2">
                  {dados.conferencias.map((c) => (
                    <li key={c.id} className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-black/[0.03] dark:bg-white/[0.04] px-4 py-3 text-sm">
                      <span><b className="font-semibold">{c.conferente_nome}</b> <span className="text-zinc-500">· {diaEHora(c.fim)}</span></span>
                      <span className={c.resultado === "conferido" ? "text-emerald-600 dark:text-emerald-400 font-semibold" : "text-rose-600 dark:text-rose-400 font-semibold"}>
                        {c.resultado === "conferido" ? "Sem divergência" : `${c.itens_divergentes} ${c.itens_divergentes === 1 ? "divergência" : "divergências"}`}
                        {c.extras?.length > 0 && ` · ${c.extras.length} fora do pedido`}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div>
              <label className={ROTULO} htmlFor="obs-compra">Observações</label>
              <textarea id="obs-compra" value={observacoes} onChange={(e) => setObservacoes(e.target.value)} rows={3} maxLength={2000} className={`${CAMPO} h-auto py-3 resize-none`} placeholder="Avarias, combinados com o fornecedor..." />
              <div className="flex justify-end mt-2">
                <button type="button" onClick={salvarObservacao} disabled={salvando || observacoes === (compra.observacoes || "")} className={`${BOTAO_SECUNDARIO} h-9`}>Salvar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}

export default function PedidosDeCompra() {
  const [compras, setCompras] = useState(null);
  const [resumo, setResumo] = useState({});
  const [opcoes, setOpcoes] = useState({ fornecedores: [], centros: [], origens: [] });
  const [status, setStatus] = useState("");
  const [atrasados, setAtrasados] = useState(false);
  const [busca, setBusca] = useState("");
  const [filtros, setFiltros] = useState(FILTROS_VAZIOS);
  const [verFiltros, setVerFiltros] = useState(false);
  const [aberta, setAberta] = useState(null);
  const [importando, setImportando] = useState(false);
  const [limite, setLimite] = useState(null);
  const pedidoAtual = useRef(0);
  const fecharDetalhe = useCallback(() => setAberta(null), []);

  const carregar = useCallback(async () => {
    const numero = ++pedidoAtual.current;
    const parametros = new URLSearchParams(Object.entries({ status, busca: busca.trim(), atrasados: atrasados ? "1" : "", ...filtros }).filter(([, valor]) => valor));
    try {
      const resposta = await api(`/compras?${parametros.toString()}`);
      if (numero !== pedidoAtual.current) return;
      if (!resposta.success) { toast.error(resposta.message || "Não foi possível carregar as entradas."); setCompras([]); return; }
      setCompras(resposta.compras);
      setResumo(resposta.resumo || {});
      setOpcoes(resposta.filtros || { fornecedores: [], centros: [], origens: [] });
      setLimite(resposta.limite);
    } catch (erro) {
      if (numero === pedidoAtual.current) { toast.error("Sem conexão com o servidor."); setCompras([]); }
    }
  }, [status, busca, atrasados, filtros]);

  // A busca espera a digitação parar; leitor de código manda tudo de uma vez
  useEffect(() => {
    const espera = setTimeout(carregar, busca ? 280 : 0);
    return () => clearTimeout(espera);
  }, [carregar, busca]);

  const importar = async () => {
    setImportando(true);
    const aviso = toast.loading("Buscando pedidos de compra no Omie...");
    try {
      const resposta = await api("/compras/importar/omie", { metodo: "POST", corpo: { dias: 180 } });
      if (resposta.success) toast.success(resposta.message, { id: aviso });
      else toast.error(resposta.message || "Não foi possível importar.", { id: aviso });
      if (resposta.success) carregar();
    } catch (erro) {
      toast.error("Sem conexão com o servidor.", { id: aviso });
    } finally {
      setImportando(false);
    }
  };

  const filtrosAtivos = useMemo(() => Object.values(filtros).filter(Boolean).length, [filtros]);
  const escolherAba = (id) => { setStatus(id); setAtrasados(false); };
  const paraConferir = (resumo.recebido || 0) + (resumo.parcial || 0);

  return (
    <CascaPagina>
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-purple-600 dark:text-purple-400">Compras</p>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-zinc-900 dark:text-white">Entradas de mercadorias</h1>
          <p className="text-zinc-500 mt-1">Do pedido de compra ao estoque, num lugar só.</p>
        </div>
        <div className="flex gap-3">
          <button type="button" onClick={importar} disabled={importando} className={BOTAO_SECUNDARIO}><DownloadCloud size={16} />{importando ? "Importando..." : "Importar do Omie"}</button>
          <Link href="/compras/conferencia/" className={BOTAO_PRIMARIO}><ClipboardCheck size={16} />Conferir</Link>
        </div>
      </header>

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <button type="button" onClick={() => escolherAba("recebido")} className="text-left"><Kpi rotulo="Chegaram para conferir" valor={paraConferir} detalhe="Recebidas no todo ou em parte" /></button>
        <button type="button" onClick={() => escolherAba("divergencia")} className="text-left"><Kpi rotulo="Divergências" valor={resumo.divergencia || 0} tom={resumo.divergencia ? "text-rose-600 dark:text-rose-400" : ""} detalhe="Contagem diferente do pedido" /></button>
        <button type="button" onClick={() => { setStatus(""); setAtrasados(true); }} className="text-left"><Kpi rotulo="Atrasadas" valor={resumo.atrasados || 0} tom={resumo.atrasados ? "text-amber-600 dark:text-amber-400" : ""} detalhe="Passaram da previsão" /></button>
        <Kpi rotulo="Em aberto" valor={moedaCurta(resumo.valor_em_aberto)} detalhe={`${(resumo.aguardando || 0) + (resumo.parcial || 0)} pedidos a receber`} />
      </section>

      <section className={`${VIDRO} overflow-hidden`}>
        <div className="p-4 sm:p-5 space-y-4 border-b border-black/[0.05] dark:border-white/[0.06]">
          <div className="flex flex-col lg:flex-row gap-3 lg:items-center">
            <div className="relative flex-1">
              <Search size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Pedido, fornecedor, produto, SKU ou EAN" className={`${CAMPO} pl-11 pr-10`} aria-label="Buscar entradas" />
              {busca && <button type="button" onClick={() => setBusca("")} aria-label="Limpar busca" className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center text-zinc-400 hover:text-zinc-700"><X size={14} /></button>}
            </div>
            <button type="button" onClick={() => setVerFiltros((v) => !v)} className={`${BOTAO_SECUNDARIO} ${filtrosAtivos ? "text-purple-700 dark:text-purple-300" : ""}`}>
              <SlidersHorizontal size={16} />Filtros{filtrosAtivos ? ` · ${filtrosAtivos}` : ""}
            </button>
          </div>

          {verFiltros && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 animate-in fade-in slide-in-from-top-1 duration-200">
              <div className="col-span-2 md:col-span-1">
                <label className={ROTULO} htmlFor="f-fornecedor">Fornecedor</label>
                <select id="f-fornecedor" value={filtros.fornecedor} onChange={(e) => setFiltros({ ...filtros, fornecedor: e.target.value })} className={CAMPO}>
                  <option value="">Todos</option>
                  {opcoes.fornecedores.map((nome) => <option key={nome} value={nome}>{nome}</option>)}
                </select>
              </div>
              <div>
                <label className={ROTULO} htmlFor="f-origem">Origem</label>
                <select id="f-origem" value={filtros.origem} onChange={(e) => setFiltros({ ...filtros, origem: e.target.value })} className={CAMPO}>
                  <option value="">Todas</option>
                  {opcoes.origens.map((origem) => <option key={origem} value={origem}>{ORIGEM[origem] || origem}</option>)}
                </select>
              </div>
              <div>
                <label className={ROTULO} htmlFor="f-cd">Centro de distribuição</label>
                <select id="f-cd" value={filtros.cd} onChange={(e) => setFiltros({ ...filtros, cd: e.target.value })} className={CAMPO}>
                  <option value="">Todos</option>
                  {opcoes.centros.map((cd) => <option key={cd} value={cd}>{cd}</option>)}
                </select>
              </div>
              <div>
                <label className={ROTULO} htmlFor="f-de">Emitido de</label>
                <input id="f-de" type="date" value={filtros.de} onChange={(e) => setFiltros({ ...filtros, de: e.target.value })} className={CAMPO} />
              </div>
              <div>
                <label className={ROTULO} htmlFor="f-ate">Até</label>
                <input id="f-ate" type="date" value={filtros.ate} onChange={(e) => setFiltros({ ...filtros, ate: e.target.value })} className={CAMPO} />
              </div>
              {filtrosAtivos > 0 && (
                <button type="button" onClick={() => setFiltros(FILTROS_VAZIOS)} className="col-span-2 md:col-span-5 justify-self-start text-sm font-semibold text-purple-600 dark:text-purple-400">Limpar filtros</button>
              )}
            </div>
          )}

          <Segmentado opcoes={ABAS} valor={atrasados ? null : status} onChange={escolherAba} />
          {atrasados && (
            <p className="flex items-center gap-2 text-sm text-amber-700 dark:text-amber-400">
              <AlertTriangle size={15} />Mostrando só as atrasadas.
              <button type="button" onClick={() => setAtrasados(false)} className="font-semibold underline underline-offset-2">Ver todas</button>
            </p>
          )}
        </div>

        {compras === null ? <Carregando texto="Carregando entradas..." /> : compras.length === 0 ? (
          busca || status || filtrosAtivos || atrasados
            ? <EstadoVazio icone={PackageSearch} titulo="Nada encontrado" texto="Nenhuma entrada com esses filtros." />
            : (
              <EstadoVazio icone={Truck} titulo="Nenhum pedido de compra ainda" texto="Traga os pedidos de compra do Omie para começar a receber e conferir.">
                <button type="button" onClick={importar} disabled={importando} className={BOTAO_PRIMARIO}><DownloadCloud size={16} />Importar do Omie</button>
              </EstadoVazio>
            )
        ) : (
          <div className="divide-y divide-black/[0.05] dark:divide-white/[0.05]">
            {compras.map((compra) => <LinhaDaCompra key={compra.id} compra={compra} onAbrir={(c) => setAberta(c.id)} />)}
            {limite && <p className="flex items-center justify-center gap-2 py-4 text-xs text-zinc-500"><Inbox size={14} />Mostrando as {limite} primeiras. Use a busca ou os filtros para achar as demais.</p>}
          </div>
        )}
      </section>

      {aberta && <DetalheDaCompra id={aberta} onFechar={fecharDetalhe} onMudou={carregar} />}
    </CascaPagina>
  );
}
