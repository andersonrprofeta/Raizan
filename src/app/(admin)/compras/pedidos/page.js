"use client";

// Central de Compras do Raizan Core: orçamentos, pedidos de compra e NF-es de entrada numa lista só.
// Toda a operação acontece aqui. Integrações (Omie, Tiny, Bling...) só alimentam os documentos, em segundo plano.
// Especificação do dono: src/components/compras/ESPECIFICACAO.md

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import {
  ArrowRight, ChevronDown, FilePlus2, FileText, Loader2, Pencil, Plus, Printer, RefreshCw, Search, SlidersHorizontal, Trash2, X,
} from "lucide-react";
import {
  api, BOTAO_PRIMARIO, BOTAO_SECUNDARIO, CAMPO, Carregando, CascaPagina, EstadoVazio, Kpi, Modal, ROTULO, Segmentado, VIDRO, moeda, moedaCurta,
} from "@/components/vendedores/ui";
import { ACAO_DO_STATUS, SeloStatus, SeloTipo, TIPOS, diaCurto, numeroDoDocumento, quantidade } from "@/components/compras/ui";
import { montarMapaDeEntrada } from "@/components/compras/MapaEntradas";
import { abrirDocumento } from "@/components/utils/documentoPdf";

const ABAS = [
  { id: "tudo", rotulo: "Tudo" },
  { id: "orcamento", rotulo: "Orçamentos" },
  { id: "pedido", rotulo: "Pedidos" },
  { id: "nfe", rotulo: "NF-e de entrada" },
  { id: "aprovacao", rotulo: "Aprovação" },
  { id: "recebimentos", rotulo: "Recebimentos" },
  { id: "divergencias", rotulo: "Divergências" },
];
const TIPOS_DAS_ABAS = ["orcamento", "pedido", "nfe"];
const FILTROS_VAZIOS = { fornecedor: "", de: "", ate: "" };
const GRADE = "md:grid-cols-[112px_96px_minmax(0,1fr)_96px_120px_190px_20px]";

// ==========================================
// FORMULÁRIO: ORÇAMENTO OU PEDIDO
// ==========================================
const itemVazio = (produto) => ({
  chave: `${Date.now()}-${Math.random()}`,
  produto_id: produto?.id || null,
  sku: produto?.sku || "",
  ean: produto?.gtin || "",
  descricao: produto?.nome || "",
  fabricante: produto?.marca || "",
  unidade: produto?.unidade || "UN",
  quantidade: "1",
  valor_unitario: produto?.ultimo_custo ? String(produto.ultimo_custo).replace(".", ",") : "",
});
const lerNumero = (texto) => Number(String(texto || "0").replace(/\./g, "").replace(",", ".")) || 0;

function BuscaDeProduto({ onEscolher }) {
  const [termo, setTermo] = useState("");
  const [resultados, setResultados] = useState([]);
  const [buscando, setBuscando] = useState(false);
  const ultima = useRef(0);

  useEffect(() => {
    const busca = termo.trim();
    if (busca.length < 2) return undefined;
    const numero = ++ultima.current;
    const espera = setTimeout(async () => {
      setBuscando(true);
      try {
        const resposta = await api(`/compras/produtos?busca=${encodeURIComponent(busca)}`);
        if (numero === ultima.current) setResultados(resposta.success ? resposta.produtos : []);
      } catch (erro) {
        if (numero === ultima.current) setResultados([]);
      } finally {
        if (numero === ultima.current) setBuscando(false);
      }
    }, 250);
    return () => clearTimeout(espera);
  }, [termo]);

  const escolher = (produto) => { onEscolher(produto); setTermo(""); setResultados([]); };
  const aberto = termo.trim().length >= 2;

  return (
    <div className="relative">
      <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
      <input
        value={termo}
        onChange={(e) => setTermo(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); if (resultados[0]) escolher(resultados[0]); } }}
        placeholder="Buscar produto por nome, SKU ou EAN"
        aria-label="Buscar produto"
        className={`${CAMPO} pl-11`}
      />
      {aberto && (
        <div className="absolute z-30 left-0 right-0 mt-2 max-h-72 overflow-y-auto custom-scrollbar rounded-2xl bg-white dark:bg-[#1c1c1f] border border-black/[0.06] dark:border-white/[0.08] shadow-[0_20px_50px_-20px_rgba(0,0,0,0.45)]">
          {buscando && resultados.length === 0 ? (
            <p className="flex items-center gap-2 px-4 py-3 text-sm text-zinc-500"><Loader2 size={14} className="animate-spin" />Buscando...</p>
          ) : resultados.length === 0 ? (
            <button type="button" onClick={() => escolher({ nome: termo.trim() })} className="w-full text-left px-4 py-3 text-sm hover:bg-black/[0.03] dark:hover:bg-white/[0.05]">
              Nenhum produto encontrado. <span className="font-semibold text-purple-600 dark:text-purple-400">Incluir “{termo.trim()}” como item avulso</span>
            </button>
          ) : resultados.map((produto) => (
            <button key={produto.id} type="button" onClick={() => escolher(produto)} className="w-full text-left flex items-center justify-between gap-3 px-4 py-2.5 hover:bg-purple-500/[0.06] transition-colors">
              <span className="min-w-0">
                <span className="block text-sm font-medium truncate">{produto.nome}</span>
                <span className="block text-[11px] font-mono text-zinc-500 truncate">{[produto.sku, produto.gtin, produto.marca].filter(Boolean).join(" · ")}</span>
              </span>
              <span className="text-right shrink-0">
                <span className="block text-xs text-zinc-500">Estoque {quantidade(produto.estoque_inicial)}</span>
                {produto.ultimo_custo !== null && <span className="block text-[11px] text-zinc-400">Última compra {moeda(produto.ultimo_custo)}</span>}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function FormularioDocumento({ tipo, documento, itensAtuais, fornecedores, onFechar, onSalvo }) {
  const [dados, setDados] = useState(() => ({
    fornecedor: documento?.fornecedor || "",
    fornecedor_documento: documento?.fornecedor_documento || "",
    data_previsao: documento?.data_previsao || "",
    condicoes_comerciais: documento?.condicoes_comerciais || "",
    observacao: documento?.observacao || "",
  }));
  const [itens, setItens] = useState(() => (itensAtuais || []).map((item) => ({
    ...itemVazio(),
    produto_id: item.produto_id, sku: item.sku || "", ean: item.ean || "", descricao: item.descricao, fabricante: item.fabricante || "", unidade: item.unidade || "UN",
    quantidade: String(item.quantidade).replace(".", ","), valor_unitario: String(item.valor_unitario ?? "").replace(".", ","),
  })));
  const [salvando, setSalvando] = useState(false);

  const total = itens.reduce((soma, item) => soma + lerNumero(item.quantidade) * lerNumero(item.valor_unitario), 0);
  const mudarItem = (chave, campo, valor) => setItens((lista) => lista.map((item) => (item.chave === chave ? { ...item, [campo]: valor } : item)));

  const salvar = async () => {
    if (!dados.fornecedor.trim()) { toast.error("Informe o fornecedor."); return; }
    const validos = itens.filter((item) => item.descricao.trim() && lerNumero(item.quantidade) > 0);
    if (validos.length === 0) { toast.error("Inclua ao menos um produto com quantidade."); return; }

    setSalvando(true);
    const corpo = {
      ...dados,
      tipo_documento: tipo,
      itens: validos.map((item) => ({
        produto_id: item.produto_id, sku: item.sku, ean: item.ean, descricao: item.descricao, fabricante: item.fabricante, unidade: item.unidade,
        quantidade: lerNumero(item.quantidade), valor_unitario: lerNumero(item.valor_unitario),
      })),
    };
    try {
      const resposta = documento ? await api(`/compras/${documento.id}`, { metodo: "PUT", corpo }) : await api("/compras", { metodo: "POST", corpo });
      if (!resposta.success) { toast.error(resposta.message || "Não foi possível salvar."); return; }
      toast.success(documento ? "Alterações salvas." : `${TIPOS[tipo].rotulo} nº ${resposta.numero_documento} criado.`);
      onSalvo(documento?.id || resposta.id);
    } catch (erro) {
      toast.error("Sem conexão com o servidor.");
    } finally {
      setSalvando(false);
    }
  };

  const titulo = documento ? `${TIPOS[tipo].rotulo} nº ${documento.numero_documento}` : tipo === "orcamento" ? "Novo orçamento" : "Novo pedido de compra";

  return (
    <Modal
      titulo={titulo}
      descricao={tipo === "orcamento" ? "Consulte o fornecedor antes de comprar. Depois de aprovado, vira pedido." : "O pedido passa pela aprovação antes de ser emitido ao fornecedor."}
      onFechar={onFechar}
      largura="max-w-4xl"
      rodape={(
        <>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-zinc-500">Total</p>
            <p className="text-xl font-semibold tracking-tight tabular-nums">{moeda(total)}</p>
          </div>
          <button type="button" onClick={onFechar} className={BOTAO_SECUNDARIO}>Cancelar</button>
          <button type="button" onClick={salvar} disabled={salvando} className={BOTAO_PRIMARIO}>{salvando ? <Loader2 size={16} className="animate-spin" /> : null}Salvar</button>
        </>
      )}
    >
      <div className="space-y-6 pb-4">
        <div className="grid sm:grid-cols-[minmax(0,1fr)_200px] gap-4">
          <div>
            <label className={ROTULO} htmlFor="doc-fornecedor">Fornecedor</label>
            <input id="doc-fornecedor" list="lista-fornecedores" value={dados.fornecedor} onChange={(e) => setDados({ ...dados, fornecedor: e.target.value })} className={CAMPO} placeholder="Nome do fornecedor" autoComplete="off" />
            <datalist id="lista-fornecedores">{fornecedores.map((nome) => <option key={nome} value={nome} />)}</datalist>
          </div>
          <div>
            <label className={ROTULO} htmlFor="doc-cnpj">CNPJ (opcional)</label>
            <input id="doc-cnpj" inputMode="numeric" value={dados.fornecedor_documento} onChange={(e) => setDados({ ...dados, fornecedor_documento: e.target.value })} className={CAMPO} placeholder="00.000.000/0000-00" />
          </div>
          <div>
            <label className={ROTULO} htmlFor="doc-condicoes">Condições comerciais</label>
            <input id="doc-condicoes" value={dados.condicoes_comerciais} onChange={(e) => setDados({ ...dados, condicoes_comerciais: e.target.value })} className={CAMPO} placeholder="Ex.: 30/60/90 dias, frete CIF" maxLength={255} />
          </div>
          <div>
            <label className={ROTULO} htmlFor="doc-previsao">Previsão de entrega</label>
            <input id="doc-previsao" type="date" value={dados.data_previsao} onChange={(e) => setDados({ ...dados, data_previsao: e.target.value })} className={CAMPO} />
          </div>
        </div>

        <div>
          <p className={ROTULO}>Produtos</p>
          <BuscaDeProduto onEscolher={(produto) => setItens((lista) => [...lista, itemVazio(produto)])} />
          {itens.length === 0 ? (
            <p className="mt-3 rounded-2xl border border-dashed border-black/[0.1] dark:border-white/[0.1] px-4 py-6 text-center text-sm text-zinc-500">Busque e inclua os produtos da compra.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {itens.map((item) => (
                <li key={item.chave} className="grid grid-cols-[minmax(0,1fr)_auto] sm:grid-cols-[minmax(0,1fr)_96px_128px_110px_36px] items-center gap-2 sm:gap-3 rounded-2xl bg-black/[0.03] dark:bg-white/[0.04] px-3 sm:px-4 py-2.5">
                  <div className="min-w-0 col-span-2 sm:col-span-1">
                    <p className="text-sm font-medium truncate">{item.descricao}</p>
                    <p className="text-[11px] font-mono text-zinc-500 truncate">{[item.sku, item.ean, item.fabricante].filter(Boolean).join(" · ") || "Item avulso"}</p>
                  </div>
                  <input aria-label={`Quantidade de ${item.descricao}`} inputMode="decimal" value={item.quantidade} onChange={(e) => mudarItem(item.chave, "quantidade", e.target.value)} className={`${CAMPO} h-10 text-right tabular-nums`} placeholder="Qtd" />
                  <input aria-label={`Valor unitário de ${item.descricao}`} inputMode="decimal" value={item.valor_unitario} onChange={(e) => mudarItem(item.chave, "valor_unitario", e.target.value)} className={`${CAMPO} h-10 text-right tabular-nums`} placeholder="R$ unitário" />
                  <p className="hidden sm:block text-right text-sm font-semibold tabular-nums">{moeda(lerNumero(item.quantidade) * lerNumero(item.valor_unitario))}</p>
                  <button type="button" aria-label={`Tirar ${item.descricao}`} onClick={() => setItens((lista) => lista.filter((x) => x.chave !== item.chave))} className="w-9 h-9 rounded-full flex items-center justify-center text-zinc-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"><Trash2 size={15} /></button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <label className={ROTULO} htmlFor="doc-obs">Observações</label>
          <textarea id="doc-obs" rows={3} maxLength={2000} value={dados.observacao} onChange={(e) => setDados({ ...dados, observacao: e.target.value })} className={`${CAMPO} h-auto py-3 resize-none`} placeholder="Combinados com o fornecedor, prazos, frete..." />
        </div>
      </div>
    </Modal>
  );
}

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

  const imprimirMapa = () => {
    if (!abrirDocumento(montarMapaDeEntrada({ documento, itens, vinculados }))) toast.error("Libere as janelas do navegador para imprimir o mapa.");
  };

  const informacoes = [
    ehNota && documento.chave_nfe && ["Chave", <span key="c" className="font-mono text-[11px] break-all">{documento.chave_nfe}</span>],
    ehNota && ["Entrada", documento.data_recebimento ? diaCurto(documento.data_recebimento) : "Não registrada"],
    !ehNota && ["Previsão de entrega", diaCurto(documento.data_previsao) || "Não informada"],
    documento.condicoes_comerciais && ["Condições", documento.condicoes_comerciais],
    documento.fornecedor_documento && ["CNPJ", documento.fornecedor_documento],
    documento.criado_por && ["Criado por", documento.criado_por],
    documento.origem_documento !== "core" && ["Origem", "Integração"],
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

      <div className="flex flex-wrap items-center gap-2">
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
          <span className="block font-medium truncate text-zinc-900 dark:text-white"><span className="md:hidden tabular-nums">{numeroDoDocumento(documento)} · </span>{documento.fornecedor || "Fornecedor não informado"}</span>
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
  const pedidoAtual = useRef(0);

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
      if (resposta.success) { toast.success(resposta.message, { id: aviso }); carregar(); }
      else toast.error(resposta.message || "Não foi possível sincronizar.", { id: aviso });
    } catch (erro) {
      toast.error("Sem conexão com o servidor.", { id: aviso });
    } finally {
      setSincronizando(false);
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
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-purple-600 dark:text-purple-400">Compras</p>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-zinc-900 dark:text-white">Central de Compras</h1>
          <p className="text-zinc-500 mt-1">Orçamentos, pedidos e notas de entrada, do pedido ao recebimento.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" onClick={sincronizar} disabled={sincronizando} aria-label="Sincronizar integrações" title="Sincronizar integrações" className={`${BOTAO_SECUNDARIO} w-11 px-0`}>
            <RefreshCw size={16} className={sincronizando ? "animate-spin" : ""} />
          </button>
          <button type="button" onClick={() => setFormulario({ tipo: "orcamento" })} className={BOTAO_SECUNDARIO}><FilePlus2 size={16} />Novo orçamento</button>
          <button type="button" onClick={() => setFormulario({ tipo: "pedido" })} className={BOTAO_PRIMARIO}><Plus size={16} />Novo pedido de compra</button>
        </div>
      </header>

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi rotulo="Comprado no mês" valor={moedaCurta(indicadores.comprado_no_mes)} detalhe="Pedidos feitos neste mês" />
        <button type="button" onClick={() => setAba("recebimentos")} className="text-left"><Kpi rotulo="Pedidos a receber" valor={indicadores.pedidos_em_aberto || 0} detalhe={moedaCurta(indicadores.valor_em_aberto)} /></button>
        <button type="button" onClick={() => setAba("aprovacao")} className="text-left"><Kpi rotulo="Aguardando aprovação" valor={indicadores.aguardando_aprovacao || 0} tom={indicadores.aguardando_aprovacao ? "text-amber-600 dark:text-amber-400" : ""} detalhe={`${indicadores.orcamentos_abertos || 0} ${indicadores.orcamentos_abertos === 1 ? "orçamento" : "orçamentos"} em aberto`} /></button>
        <button type="button" onClick={() => setAba(indicadores.divergencias ? "divergencias" : "nfe")} className="text-left"><Kpi rotulo="NF-e pendentes" valor={indicadores.notas_pendentes || 0} detalhe={indicadores.divergencias ? `${indicadores.divergencias} com divergência` : "Nenhuma divergência"} tom={indicadores.divergencias ? "text-rose-600 dark:text-rose-400" : ""} /></button>
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
    </CascaPagina>
  );
}
