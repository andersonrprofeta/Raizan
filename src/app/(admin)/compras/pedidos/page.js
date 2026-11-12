"use client";

// Central de Compras do Raizan Core: orçamentos, pedidos de compra e NF-es de entrada numa lista só.
// Toda a operação acontece aqui. Integrações (Omie, Tiny, Bling...) só alimentam os documentos, em segundo plano.
// Especificação do dono: src/components/compras/ESPECIFICACAO.md

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  ArrowRight, ChevronDown, ExternalLink, FilePlus2, FileUp, Landmark, FileText, Loader2, PackageCheck, Pencil, Plus, Printer, RefreshCw, Search, SlidersHorizontal, X,
} from "lucide-react";
import {
  api, BOTAO_PRIMARIO, BOTAO_SECUNDARIO, CAMPO, Carregando, CascaPagina, EstadoVazio, Kpi, ROTULO, Segmentado, VIDRO, moeda, moedaCurta,
} from "@/components/vendedores/ui";
import { ACAO_DO_STATUS, SeloStatus, SeloTipo, diaCurto, numeroDoDocumento, quantidade } from "@/components/compras/ui";
import { montarMapaDeEntrada } from "@/components/compras/MapaEntradas";
import { FormularioDocumento } from "@/components/compras/FormularioDocumento";
import { SefazDfe } from "@/components/compras/SefazDfe";
import { useErp } from "@/components/utils/erp";
import { abrirDocumento } from "@/components/utils/documentoPdf";

const ABAS = [
  { id: "tudo", rotulo: "Tudo" },
  { id: "orcamento", rotulo: "Orçamentos" },
  { id: "pedido", rotulo: "Pedidos" },
  { id: "nfe", rotulo: "NF-e de entrada" },
  { id: "aprovacao", rotulo: "Aprovação" },
  { id: "recebimentos", rotulo: "A receber" },
  { id: "entradas", rotulo: "Entradas confirmadas" },
  { id: "divergencias", rotulo: "Divergências" },
];
const TIPOS_DAS_ABAS = ["orcamento", "pedido", "nfe"];
const FILTROS_VAZIOS = { fornecedor: "", de: "", ate: "" };
const GRADE = "md:grid-cols-[112px_96px_minmax(0,1fr)_96px_120px_190px_20px]";

// ==========================================
// LINHA DA LISTA, COM EXPANSÃO
// ==========================================
function DetalheExpandido({ detalhe, onAcao, onEditar, ocupado }) {
  const { documento, itens, vinculados, proximos_status: proximos } = detalhe;
  const ehNota = documento.tipo_documento === "nfe";
  const mostraRecebido = documento.tipo_documento !== "orcamento";
  const pedidoGerado = vinculados.find((v) => v.tipo_documento === "pedido" && v.id !== documento.documento_origem_id);
  const podeGerarPedido = documento.tipo_documento === "orcamento" && documento.status === "aprovado" && !pedidoGerado;
  const temMapa = documento.tipo_documento !== "orcamento" && !["cancelado", "cancelada"].includes(documento.status);
  const aguardaEntrada = ehNota && !documento.entrada_em && ["pendente", "recebida", "divergente"].includes(documento.status);

  const imprimirMapa = () => {
    if (!abrirDocumento(montarMapaDeEntrada({ documento, itens, vinculados }))) toast.error("Libere as janelas do navegador para imprimir o mapa.");
  };

  const informacoes = [
    ehNota && documento.chave_nfe && ["Chave", <span key="c" className="font-mono text-[11px] break-all">{documento.chave_nfe}</span>],
    ehNota && ["Entrada", documento.entrada_em ? `Confirmada em ${diaCurto(documento.entrada_em)}` : "Não confirmada"],
    ehNota && documento.metadata?.etapa && ["Etapa na integração", documento.metadata.etapa],
    !ehNota && ["Previsão de entrega", diaCurto(documento.data_previsao) || "Não informada"],
    documento.condicoes_comerciais && ["Condições", documento.condicoes_comerciais],
    documento.fornecedor_documento && ["CNPJ", documento.fornecedor_documento],
    documento.criado_por && ["Criado por", documento.criado_por],
    documento.origem_documento !== "core" && ["Origem", { xml: "XML importado", sefaz: "SEFAZ" }[documento.origem_documento] || "Integração"],
  ].filter(Boolean);

  return (
    <div className="px-5 sm:px-6 pb-6 pt-1 space-y-5 animate-in fade-in slide-in-from-top-1 duration-200">
      <dl className="flex flex-wrap gap-x-8 gap-y-2 text-sm">
        {informacoes.map(([rotulo, valor]) => (
          <div key={rotulo}><dt className="text-[11px] text-zinc-500">{rotulo}</dt><dd className="font-medium">{valor}</dd></div>
        ))}
      </dl>

      {vinculados.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="text-[11px] text-zinc-500 mr-1">Ciclo</span>
          {vinculados.map((v) => (
            <span key={v.id} className="inline-flex items-center gap-2 h-8 pl-1.5 pr-3 rounded-full bg-black/[0.04] dark:bg-white/[0.05]">
              <SeloTipo tipo={v.tipo_documento} /><span className="font-semibold tabular-nums">{v.numero_documento}</span>
            </span>
          ))}
        </div>
      )}

      <div className="rounded-2xl border border-black/[0.06] dark:border-white/[0.07] overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[11px] uppercase tracking-wide text-zinc-500 bg-black/[0.02] dark:bg-white/[0.03]">
                <th className="text-left font-semibold px-4 py-2.5">Produto</th>
                <th className="text-right font-semibold px-3 py-2.5">Qtd</th>
                {mostraRecebido && <th className="text-right font-semibold px-3 py-2.5">Recebido</th>}
                <th className="text-right font-semibold px-3 py-2.5">Unitário</th>
                <th className="text-right font-semibold px-4 py-2.5">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.05] dark:divide-white/[0.05]">
              {itens.map((item) => (
                <tr key={item.id}>
                  <td className="px-4 py-2.5 min-w-[220px]">
                    <p className="font-medium">{item.descricao}</p>
                    <p className="text-[11px] font-mono text-zinc-500">{[item.sku, item.ean, item.fabricante].filter(Boolean).join(" · ")}</p>
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums whitespace-nowrap">{quantidade(item.quantidade)} <span className="text-zinc-400 text-xs">{item.unidade}</span></td>
                  {mostraRecebido && <td className={`px-3 py-2.5 text-right tabular-nums ${item.quantidade_recebida >= item.quantidade ? "text-emerald-600 dark:text-emerald-400" : "text-zinc-500"}`}>{quantidade(item.quantidade_recebida)}</td>}
                  <td className="px-3 py-2.5 text-right tabular-nums whitespace-nowrap">{moeda(item.valor_unitario)}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums font-semibold whitespace-nowrap">{moeda(item.valor_total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {documento.observacao && <p className="text-sm text-zinc-600 dark:text-zinc-300 rounded-2xl bg-black/[0.03] dark:bg-white/[0.04] px-4 py-3">{documento.observacao}</p>}

      {aguardaEntrada && (
        <p className="text-sm text-zinc-600 dark:text-zinc-300 rounded-2xl bg-purple-500/[0.06] px-4 py-3">
          Para dar entrada: imprima o <b>Mapa de entrada</b>, confira a mercadoria e clique em <b>Conferir e dar entrada</b> para digitar a contagem e confirmar.
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {aguardaEntrada
          ? <Link href={`/compras/pedidos/documento?id=${documento.id}`} className={`${BOTAO_PRIMARIO} h-10`}><PackageCheck size={15} />Conferir e dar entrada</Link>
          : <Link href={`/compras/pedidos/documento?id=${documento.id}`} className={`${BOTAO_SECUNDARIO} h-10`}><ExternalLink size={15} />Abrir{temMapa && !ehNota ? " e contar" : ""}</Link>}
        {temMapa && <button type="button" onClick={imprimirMapa} className={`${BOTAO_SECUNDARIO} h-10`}><Printer size={15} />Mapa de entrada</button>}
        {documento.editavel && <button type="button" onClick={onEditar} className={`${BOTAO_SECUNDARIO} h-10`}><Pencil size={15} />Editar</button>}
        <span className="flex-1" />
        {proximos.filter((s) => s === "cancelado").map((s) => (
          <button key={s} type="button" disabled={ocupado} onClick={() => onAcao("status", s)} className="h-10 px-4 rounded-full text-sm font-semibold text-rose-600 hover:bg-rose-500/10 transition-colors disabled:opacity-40">{ACAO_DO_STATUS[s]}</button>
        ))}
        {proximos.filter((s) => s !== "cancelado").map((s, posicao, lista) => (
          <button key={s} type="button" disabled={ocupado} onClick={() => onAcao("status", s)} className={`${posicao === lista.length - 1 && !podeGerarPedido ? BOTAO_PRIMARIO : BOTAO_SECUNDARIO} h-10`}>{ACAO_DO_STATUS[s] || s}</button>
        ))}
        {podeGerarPedido && <button type="button" disabled={ocupado} onClick={() => onAcao("gerar-pedido")} className={`${BOTAO_PRIMARIO} h-10`}>Gerar pedido de compra<ArrowRight size={15} /></button>}
      </div>
    </div>
  );
}

function LinhaDoDocumento({ documento, aberto, detalhe, onAlternar, onAcao, onEditar, ocupado }) {
  return (
    <li className={aberto ? "bg-black/[0.015] dark:bg-white/[0.02]" : ""}>
      <button
        type="button"
        onClick={onAlternar}
        aria-expanded={aberto}
        className={`group w-full text-left grid grid-cols-[auto_minmax(0,1fr)_auto] ${GRADE} items-center gap-x-4 gap-y-1 px-5 sm:px-6 py-3.5 hover:bg-black/[0.02] dark:hover:bg-white/[0.03] transition-colors`}
      >
        <span><SeloTipo tipo={documento.tipo_documento} /></span>
        <span className="hidden md:block font-semibold tabular-nums text-zinc-900 dark:text-white">{numeroDoDocumento(documento)}</span>
        <span className="min-w-0">
          <span className="block font-medium truncate text-zinc-900 dark:text-white"><span className="md:hidden tabular-nums">{numeroDoDocumento(documento)} · </span>{documento.fornecedor || (documento.fornecedor_documento ? `CNPJ ${documento.fornecedor_documento}` : "Fornecedor não informado")}</span>
          <span className="block text-xs text-zinc-500 truncate">{documento.total_itens} {documento.total_itens === 1 ? "produto" : "produtos"}{documento.tipo_documento !== "nfe" && documento.data_previsao ? ` · entrega ${diaCurto(documento.data_previsao)}` : ""}</span>
        </span>
        <span className="hidden md:block text-sm text-zinc-500 tabular-nums">{diaCurto(documento.data_emissao)}</span>
        <span className="text-right text-sm font-semibold tabular-nums whitespace-nowrap">{moeda(documento.valor_total)}</span>
        <span className="col-span-2 md:col-span-1 md:justify-self-start"><SeloStatus status={documento.status} /></span>
        <ChevronDown size={18} className={`hidden md:block text-zinc-300 group-hover:text-purple-500 transition-transform duration-300 ${aberto ? "rotate-180 text-purple-500" : ""}`} />
      </button>
      {aberto && (detalhe ? <DetalheExpandido detalhe={detalhe} onAcao={onAcao} onEditar={onEditar} ocupado={ocupado} /> : <div className="py-6 flex justify-center text-zinc-400"><Loader2 size={18} className="animate-spin" /></div>)}
    </li>
  );
}

// ==========================================
// CENTRAL DE COMPRAS
// ==========================================
export default function CentralDeCompras() {
  const [documentos, setDocumentos] = useState(null);
  const [indicadores, setIndicadores] = useState({});
  const [fornecedores, setFornecedores] = useState([]);
  const [limite, setLimite] = useState(null);
  const [aba, setAba] = useState("tudo");
  const [busca, setBusca] = useState("");
  const [filtros, setFiltros] = useState(FILTROS_VAZIOS);
  const [verFiltros, setVerFiltros] = useState(false);
  const [aberto, setAberto] = useState(null);
  const [detalhes, setDetalhes] = useState({});
  const [ocupado, setOcupado] = useState(false);
  const [formulario, setFormulario] = useState(null);
  const [sincronizando, setSincronizando] = useState(false);
  const erpCompras = useErp().com("compras"); // ler compras do ERP só aparece com ERP que tem compras (hoje Omie)
  const [verSefaz, setVerSefaz] = useState(false);
  const pedidoAtual = useRef(0);
  const router = useRouter();

  const carregar = useCallback(async () => {
    const numero = ++pedidoAtual.current;
    const parametros = new URLSearchParams(Object.entries({
      tipo: TIPOS_DAS_ABAS.includes(aba) ? aba : "",
      visao: TIPOS_DAS_ABAS.includes(aba) || aba === "tudo" ? "" : aba,
      busca: busca.trim(),
      ...filtros,
    }).filter(([, valor]) => valor));
    try {
      const resposta = await api(`/compras?${parametros.toString()}`);
      if (numero !== pedidoAtual.current) return;
      if (!resposta.success) { toast.error(resposta.message || "Não foi possível carregar as compras."); setDocumentos([]); return; }
      setDocumentos(resposta.documentos);
      setIndicadores(resposta.indicadores || {});
      setFornecedores(resposta.fornecedores || []);
      setLimite(resposta.limite);
    } catch (erro) {
      if (numero === pedidoAtual.current) { toast.error("Sem conexão com o servidor."); setDocumentos([]); }
    }
  }, [aba, busca, filtros]);

  useEffect(() => {
    const espera = setTimeout(carregar, busca ? 280 : 0);
    return () => clearTimeout(espera);
  }, [carregar, busca]);

  const carregarDetalhe = useCallback(async (id) => {
    try {
      const resposta = await api(`/compras/${id}`);
      if (!resposta.success) { toast.error(resposta.message || "Não foi possível abrir o documento."); return null; }
      setDetalhes((atual) => ({ ...atual, [id]: resposta }));
      return resposta;
    } catch (erro) {
      toast.error("Sem conexão com o servidor.");
      return null;
    }
  }, []);

  const alternar = (id) => {
    if (aberto === id) { setAberto(null); return; }
    setAberto(id);
    carregarDetalhe(id);
  };

  const agir = async (id, acao, status) => {
    setOcupado(true);
    try {
      const resposta = acao === "status"
        ? await api(`/compras/${id}/status`, { metodo: "POST", corpo: { status } })
        : await api(`/compras/${id}/gerar-pedido`, { metodo: "POST" });
      if (!resposta.success) { toast.error(resposta.message || "Não foi possível concluir."); return; }
      toast.success(acao === "gerar-pedido" ? `Pedido de compra nº ${resposta.numero_documento} criado.` : "Situação atualizada.");
      await Promise.all([carregar(), carregarDetalhe(id)]);
      if (acao === "gerar-pedido") { setAba("pedido"); setAberto(resposta.id); carregarDetalhe(resposta.id); }
    } catch (erro) {
      toast.error("Sem conexão com o servidor.");
    } finally {
      setOcupado(false);
    }
  };

  const sincronizar = async () => {
    setSincronizando(true);
    const aviso = toast.loading("Sincronizando integrações...");
    try {
      const resposta = await api("/compras/sincronizar", { metodo: "POST", corpo: { dias: 180 } });
      if (resposta.success) { (resposta.avisos?.length ? toast.error : toast.success)(resposta.message, { id: aviso, duration: 10000 }); carregar(); }
      else toast.error(resposta.message || "Não foi possível sincronizar.", { id: aviso });
    } catch (erro) {
      toast.error("Sem conexão com o servidor.", { id: aviso });
    } finally {
      setSincronizando(false);
    }
  };

  const entradaDeXml = useRef(null);
  const importarXml = async (evento) => {
    const arquivos = [...(evento.target.files || [])];
    evento.target.value = "";
    if (!arquivos.length) return;
    const aviso = toast.loading(arquivos.length === 1 ? "Importando a nota..." : `Importando ${arquivos.length} notas...`);
    try {
      const corpo = { arquivos: await Promise.all(arquivos.map(async (arquivo) => ({ nome: arquivo.name, xml: await arquivo.text() }))) };
      const resposta = await api("/compras/importar-xml", { metodo: "POST", corpo });
      const recusadas = (resposta.resultados || []).filter((r) => !r.ok);
      if (resposta.importadas) toast.success(resposta.message, { id: aviso });
      else toast.error(recusadas[0]?.mensagem || resposta.message || "Nenhuma nota importada.", { id: aviso });
      if (resposta.importadas && recusadas.length) recusadas.slice(0, 3).forEach((r) => toast.error(`${r.nome}: ${r.mensagem}`));
      if (resposta.importadas) {
        await carregar();
        const unica = resposta.resultados.find((r) => r.ok);
        if (arquivos.length === 1 && unica) router.push(`/compras/pedidos/documento?id=${unica.id}`);
      }
    } catch (erro) {
      toast.error("Sem conexão com o servidor.", { id: aviso });
    }
  };

  const fecharFormulario = useCallback(() => setFormulario(null), []);
  const salvo = async (id) => {
    setFormulario(null);
    await carregar();
    setAberto(id);
    carregarDetalhe(id);
  };

  const filtrosAtivos = useMemo(() => Object.values(filtros).filter(Boolean).length, [filtros]);

  return (
    <CascaPagina>
      <header className="flex flex-col gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium text-purple-600 dark:text-purple-400">Compras</p>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-zinc-900 dark:text-white">Central de Compras</h1>
          <p className="text-zinc-500 mt-1">Orçamentos, pedidos e notas de entrada, do pedido ao recebimento.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 [&>button]:whitespace-nowrap">
          {erpCompras && (
            <button type="button" onClick={sincronizar} disabled={sincronizando} aria-label={`Ler compras do ${erpCompras.nome}`} title={`Ler compras do ${erpCompras.nome}`} className={`${BOTAO_SECUNDARIO.replace("px-5", "px-0")} w-11 shrink-0`}>
              <RefreshCw size={17} strokeWidth={2.2} className={sincronizando ? "animate-spin" : ""} />
            </button>
          )}
          <button type="button" onClick={() => setVerSefaz(true)} className={BOTAO_SECUNDARIO}><Landmark size={16} />Notas da SEFAZ</button>
          <input ref={entradaDeXml} type="file" accept=".xml,text/xml,application/xml" multiple hidden onChange={importarXml} />
          <button type="button" onClick={() => entradaDeXml.current?.click()} className={BOTAO_SECUNDARIO}><FileUp size={16} />Importar XML</button>
          <span className="hidden sm:block w-px h-7 mx-1 bg-black/[0.08] dark:bg-white/[0.1]" aria-hidden="true" />
          <button type="button" onClick={() => setFormulario({ tipo: "orcamento" })} className={BOTAO_SECUNDARIO}><FilePlus2 size={16} />Novo orçamento</button>
          <button type="button" onClick={() => setFormulario({ tipo: "pedido" })} className={BOTAO_PRIMARIO}><Plus size={16} />Novo pedido de compra</button>
        </div>
      </header>

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi rotulo="Comprado no mês" valor={moedaCurta(indicadores.comprado_no_mes)} detalhe="Pedidos feitos neste mês" />
        <button type="button" onClick={() => setAba("recebimentos")} className="text-left"><Kpi rotulo="Pedidos a receber" valor={indicadores.pedidos_em_aberto || 0} detalhe={moedaCurta(indicadores.valor_em_aberto)} /></button>
        <button type="button" onClick={() => setAba("aprovacao")} className="text-left"><Kpi rotulo="Aguardando aprovação" valor={indicadores.aguardando_aprovacao || 0} tom={indicadores.aguardando_aprovacao ? "text-amber-600 dark:text-amber-400" : ""} detalhe={`${indicadores.orcamentos_abertos || 0} ${indicadores.orcamentos_abertos === 1 ? "orçamento" : "orçamentos"} em aberto`} /></button>
        <button type="button" onClick={() => setAba(indicadores.divergencias ? "divergencias" : "nfe")} className="text-left"><Kpi rotulo="NF-e a dar entrada" valor={indicadores.notas_pendentes || 0} detalhe={indicadores.divergencias ? `${indicadores.divergencias} com divergência` : "Nenhuma divergência"} tom={indicadores.divergencias ? "text-rose-600 dark:text-rose-400" : ""} /></button>
      </section>

      <section className={`${VIDRO} overflow-visible`}>
        <div className="p-4 sm:p-5 space-y-4 border-b border-black/[0.05] dark:border-white/[0.06]">
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
            <div className="relative flex-1">
              <Search size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Número, fornecedor, chave da NF-e, produto, SKU ou EAN" className={`${CAMPO} pl-11 pr-10`} aria-label="Buscar documentos" />
              {busca && <button type="button" onClick={() => setBusca("")} aria-label="Limpar busca" className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center text-zinc-400 hover:text-zinc-700"><X size={14} /></button>}
            </div>
            <button type="button" onClick={() => setVerFiltros((v) => !v)} className={`${BOTAO_SECUNDARIO} ${filtrosAtivos ? "text-purple-700 dark:text-purple-300" : ""}`}>
              <SlidersHorizontal size={16} />Filtros{filtrosAtivos ? ` · ${filtrosAtivos}` : ""}
            </button>
          </div>

          {verFiltros && (
            <div className="grid grid-cols-2 md:grid-cols-[minmax(0,2fr)_1fr_1fr_auto] gap-3 items-end animate-in fade-in slide-in-from-top-1 duration-200">
              <div className="col-span-2 md:col-span-1">
                <label className={ROTULO} htmlFor="f-fornecedor">Fornecedor</label>
                <select id="f-fornecedor" value={filtros.fornecedor} onChange={(e) => setFiltros({ ...filtros, fornecedor: e.target.value })} className={CAMPO}>
                  <option value="">Todos</option>
                  {fornecedores.map((nome) => <option key={nome} value={nome}>{nome}</option>)}
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
              {filtrosAtivos > 0 && <button type="button" onClick={() => setFiltros(FILTROS_VAZIOS)} className="h-11 px-2 text-sm font-semibold text-purple-600 dark:text-purple-400">Limpar</button>}
            </div>
          )}

          <Segmentado opcoes={ABAS} valor={aba} onChange={(id) => { setAba(id); setAberto(null); }} />
        </div>

        {aba === "divergencias" && (
          <p className="mx-6 mb-3 rounded-xl bg-rose-500/[0.06] px-4 py-3 text-sm text-zinc-600 dark:text-zinc-300">
            Aqui ficam as notas em que a conferência física não bateu com a NF-e (faltou, sobrou ou veio produto trocado).
            Para usar: imprima o <b>Mapa de entrada</b>, confira a mercadoria e, se algo não bater, abra a nota e clique em <b>Marcar divergência</b>. Ela fica nesta aba até ser resolvida.
            Quando o fornecedor resolver, marque a NF-e como recebida.
          </p>
        )}

        <div className={`hidden md:grid ${GRADE} gap-x-4 px-6 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-zinc-400 border-b border-black/[0.05] dark:border-white/[0.06]`}>
          <span>Tipo</span><span>Número</span><span>Fornecedor</span><span>Emissão</span><span className="text-right">Valor</span><span>Situação</span><span />
        </div>

        {documentos === null ? <Carregando texto="Carregando compras..." /> : documentos.length === 0 ? (
          busca || filtrosAtivos || aba !== "tudo"
            ? <EstadoVazio icone={Search} titulo="Nada encontrado" texto="Nenhum documento com esses filtros." />
            : (
              <EstadoVazio icone={FileText} titulo="Nenhuma compra ainda" texto="Crie um orçamento para consultar fornecedores ou registre direto o pedido de compra.">
                <button type="button" onClick={() => setFormulario({ tipo: "pedido" })} className={BOTAO_PRIMARIO}><Plus size={16} />Novo pedido de compra</button>
              </EstadoVazio>
            )
        ) : (
          <ul className="divide-y divide-black/[0.05] dark:divide-white/[0.05]">
            {documentos.map((documento) => (
              <LinhaDoDocumento
                key={documento.id}
                documento={documento}
                aberto={aberto === documento.id}
                detalhe={detalhes[documento.id]}
                ocupado={ocupado}
                onAlternar={() => alternar(documento.id)}
                onAcao={(acao, status) => agir(documento.id, acao, status)}
                onEditar={() => setFormulario({ tipo: documento.tipo_documento, documento: detalhes[documento.id].documento, itens: detalhes[documento.id].itens })}
              />
            ))}
          </ul>
        )}
        {limite && <p className="py-4 text-center text-xs text-zinc-500">Mostrando os {limite} mais recentes. Use a busca ou os filtros para achar os demais.</p>}
      </section>

      {formulario && (
        <FormularioDocumento
          tipo={formulario.tipo}
          documento={formulario.documento}
          itensAtuais={formulario.itens}
          fornecedores={fornecedores}
          onFechar={fecharFormulario}
          onSalvo={salvo}
        />
      )}
      {verSefaz && <SefazDfe onFechar={() => setVerSefaz(false)} onNotasNovas={carregar} />}
    </CascaPagina>
  );
}
